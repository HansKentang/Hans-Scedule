// ─── FIRESTORE SYNC — Auto-sync all app data across devices ────────
// Loaded AFTER gsi.js. Dynamically loads Firestore SDK if needed.
// Syncs all haven-* localStorage keys to Firestore for the logged-in user.

var SYNC_ENABLED = false;
var SYNC_DB = null;
var SYNC_PENDING = false;
var SYNC_STATUS = 'offline'; // offline | syncing | synced | error | noauth
var SYNC_DEBOUNCE_TIMER = null;
var SYNC_DEBOUNCE_MS = 3000; // 3 seconds after last change
var SYNC_PULLED_ONCE = false;
var SYNC_PULLING = false;

// ─── Initialize ──────────────────────────────────────────
function initSync() {
  if (typeof FIREBASE_CONFIG === 'undefined') {
    console.warn('[sync] FIREBASE_CONFIG not found — sync disabled');
    setSyncStatus('noauth');
    return;
  }
  if (typeof state === 'undefined' || !state.currentUserId) {
    setSyncStatus('noauth');
    return;
  }

  // Dynamically load Firestore SDK if not available
  if (typeof firebase === 'undefined' || !firebase.firestore) {
    loadFirestoreSDK().then(function() {
      setupFirestore();
    }).catch(function() {
      console.warn('[sync] Failed to load Firestore SDK');
      setSyncStatus('error');
    });
  } else {
    setupFirestore();
  }
}

function setupFirestore() {
  try {
    if (!firebase.apps.length) {
      firebase.initializeApp(FIREBASE_CONFIG);
    }
    SYNC_DB = firebase.firestore();
    SYNC_ENABLED = true;

    // Enable offline persistence for Firestore
    var isFileProtocol = typeof window !== 'undefined' && window.location.protocol === 'file:';
    if (!isFileProtocol && SYNC_DB) {
      SYNC_DB.enablePersistence({ synchronizeTabs: true }).catch(function(err) {
        if (err.code === 'failed-precondition') {
          // Multiple tabs — only one can have persistence
        } else if (err.code === 'unimplemented') {
          // Browser doesn't support persistence
        }
      });
    }

    setSyncStatus('synced');

    // Pull from cloud on init
    pullFromCloud();

    // Set up periodic sync (every 30 seconds)
    setInterval(function() {
      if (SYNC_STATUS === 'syncing') return;
      pushToCloud();
    }, 30000);

    console.log('[sync] Initialized for user:', state.currentUserId.slice(0, 12) + '...');
  } catch (e) {
    console.warn('[sync] Setup failed:', e);
    setSyncStatus('error');
  }
}

function loadFirestoreSDK() {
  return new Promise(function(resolve, reject) {
    if (typeof firebase !== 'undefined' && firebase.firestore) {
      resolve();
      return;
    }

    // Check if script is already loading
    if (document.querySelector('script[src*="firebase-firestore-compat"]')) {
      var check = setInterval(function() {
        if (typeof firebase !== 'undefined' && firebase.firestore) {
          clearInterval(check);
          resolve();
        }
      }, 200);
      setTimeout(function() { clearInterval(check); reject(new Error('Timeout')); }, 15000);
      return;
    }

    // Also need firebase-app if not loaded
    var scripts = [];
    if (typeof firebase === 'undefined') {
      scripts.push('https://www.gstatic.com/firebasejs/11.10.0/firebase-app-compat.js');
    }
    scripts.push('https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore-compat.js');

    var loaded = 0;
    function onScriptLoad() {
      loaded++;
      if (loaded >= scripts.length) {
        // Small delay for SDK initialization
        setTimeout(resolve, 100);
      }
    }

    scripts.forEach(function(src) {
      var s = document.createElement('script');
      s.src = src;
      s.onload = onScriptLoad;
      s.onerror = reject;
      document.head.appendChild(s);
    });
  });
}

// ─── Pull data from Firestore → localStorage ─────────────
function pullFromCloud() {
  if (!SYNC_ENABLED || !SYNC_DB || !state.currentUserId) return;
  if (SYNC_PULLED_ONCE) return;
  if (SYNC_PULLING) return;

  SYNC_PULLING = true;
  setSyncStatus('syncing');

  SYNC_DB.collection('users').doc(state.currentUserId)
    .collection('app-data').doc('latest')
    .get()
    .then(function(doc) {
      if (!doc.exists) {
        setSyncStatus('synced');
        SYNC_PULLED_ONCE = true;
        SYNC_PULLING = false;
        return;
      }

      var cloudData = doc.data();
      var cloudSyncedAt = cloudData._syncedAt || 0;
      var localSyncedAt = 0;
      try { localSyncedAt = parseInt(localStorage.getItem('haven-synced-at') || '0'); } catch (e) {}

      if (cloudSyncedAt <= localSyncedAt) {
        setSyncStatus('synced');
        SYNC_PULLED_ONCE = true;
        SYNC_PULLING = false;
        return;
      }

      // Cloud has newer data — merge into localStorage
      var restoredKeys = [];
      for (var key in cloudData) {
        if (key === '_syncedAt' || key === '_version') continue;
        if (key.indexOf('haven-') !== 0) continue;
        // Skip gallery images (too large for sync)
        if (key.indexOf('haven-image-') === 0 || key.indexOf('hub-image-') === 0) continue;
        try {
          localStorage.setItem(key, JSON.stringify(cloudData[key]));
          restoredKeys.push(key);
        } catch (e) { /* quota */ }
      }

      localStorage.setItem('haven-synced-at', String(cloudSyncedAt));
      SYNC_PULLED_ONCE = true;
      SYNC_PULLING = false;
      setSyncStatus('synced');

      if (restoredKeys.length > 0 && typeof showToast === 'function') {
        showToast('Data synced from cloud (' + restoredKeys.length + ' items)', 'info', 3000);
      }

      // Reload in-memory state
      if (typeof loadState === 'function') loadState();
    })
    .catch(function(err) {
      console.warn('[sync] Pull failed:', err);
      setSyncStatus('error');
      SYNC_PULLED_ONCE = true;
      SYNC_PULLING = false;
    });
}

// ─── Push localStorage → Firestore ──────────────────────
function pushToCloud() {
  if (!SYNC_ENABLED || !SYNC_DB || !state.currentUserId) return false;
  if (SYNC_PENDING) return false;
  // Skip push if currently pulling from cloud (to prevent pull→push loop)
  if (SYNC_PULLING) return false;

  SYNC_PENDING = true;

  try {
    var data = {
      _syncedAt: Date.now(),
      _version: 1
    };

    // Collect all haven-* keys from localStorage
    for (var i = 0; i < localStorage.length; i++) {
      var key = localStorage.key(i);
      if (key && key.indexOf('haven-') === 0) {
        // Skip gallery images (too large — stored in IndexedDB)
        if (key.indexOf('haven-image-') === 0 || key.indexOf('hub-image-') === 0) continue;
        // Skip auth-related keys
        if (key.indexOf('haven-gsi-') === 0) continue;
        // Skip device ID (per-device)
        if (key === 'haven-device-id' || key === 'haven-device-label') continue;
        // Skip sync metadata
        if (key === 'haven-synced-at') continue;

        try {
          data[key] = JSON.parse(localStorage.getItem(key));
        } catch (e) {
          data[key] = localStorage.getItem(key);
        }
      }
    }

    setSyncStatus('syncing');

    SYNC_DB.collection('users').doc(state.currentUserId)
      .collection('app-data').doc('latest')
      .set(data, { merge: false })
      .then(function() {
        localStorage.setItem('haven-synced-at', String(data._syncedAt));
        setSyncStatus('synced');
        SYNC_PENDING = false;
        if (typeof showToast === 'function') {
          showToast('Changes saved to cloud', 'success', 1500);
        }
      })
      .catch(function(err) {
        console.warn('[sync] Push failed:', err);
        setSyncStatus('error');
        SYNC_PENDING = false;
      });

    return true;
  } catch (e) {
    console.warn('[sync] Push error:', e);
    setSyncStatus('error');
    SYNC_PENDING = false;
    return false;
  }
}

// ─── Watch for data changes via localStorage proxy ───────
function onDataChanged(key) {
  if (!SYNC_ENABLED || !state.currentUserId) return;
  // Ignore changes triggered by sync itself
  if (SYNC_PULLING) return;
  // Ignore non-haven keys and metadata
  if (!key || key.indexOf('haven-') !== 0) return;
  if (key === 'haven-synced-at') return;
  if (key.indexOf('haven-gsi-') === 0) return;
  if (key.indexOf('haven-image-') === 0 || key.indexOf('hub-image-') === 0) return;

  // Debounce: reset timer on each change
  if (SYNC_DEBOUNCE_TIMER) clearTimeout(SYNC_DEBOUNCE_TIMER);
  SYNC_DEBOUNCE_TIMER = setTimeout(function() {
    pushToCloud();
  }, SYNC_DEBOUNCE_MS);
}

// ─── Wrap localStorage.setItem to detect changes ─────────
(function patchLocalStorage() {
  if (localStorage.setItem.__patched) return;
  var origSetItem = localStorage.setItem.bind(localStorage);
  var origRemoveItem = localStorage.removeItem.bind(localStorage);

  localStorage.setItem = function(key, value) {
    origSetItem(key, value);
    onDataChanged(key);
  };
  localStorage.setItem.__patched = true;

  localStorage.removeItem = function(key) {
    origRemoveItem(key);
    onDataChanged(key);
  };
  localStorage.removeItem.__patched = true;
})();

// ─── Sync status indicator ───────────────────────────────
function setSyncStatus(status) {
  SYNC_STATUS = status;
  updateSyncIndicator();
}

function getSyncStatus() {
  return SYNC_STATUS;
}

function updateSyncIndicator() {
  var dot = document.getElementById('syncStatusDot');
  if (!dot) return;
  dot.className = 'sync-dot sync-dot-' + SYNC_STATUS;
  dot.title = syncStatusLabel(SYNC_STATUS);
}

function syncStatusLabel(status) {
  var labels = {
    offline: 'Sync offline',
    syncing: 'Syncing...',
    synced: 'All data synced',
    error: 'Sync error',
    noauth: 'Sign in to sync across devices'
  };
  return labels[status] || 'Unknown';
}

// ─── Re-sync (called on account switch) ──────────────────
function reSync() {
  SYNC_PULLED_ONCE = false;
  SYNC_PULLING = false;
  SYNC_ENABLED = false;
  SYNC_DB = null;
  setTimeout(function() {
    initSync();
  }, 500);
}

// ─── Init on DOM ready ───────────────────────────────────
(function() {
  // Patch __origLS if it exists (may load before shared.js)
  function patchOrigLS() {
    if (typeof __origLS !== 'undefined' && __origLS.setItem && __origLS.setItem.__patched) {
      return;
    }
    if (typeof __origLS !== 'undefined' && __origLS.setItem) {
      var origLSSet = __origLS.setItem;
      var origLSRemove = __origLS.removeItem;
      __origLS.setItem = function(key, value) {
        origLSSet(key, value);
        onDataChanged(key);
      };
      __origLS.removeItem = function(key) {
        origLSRemove(key);
        onDataChanged(key);
      };
      __origLS.setItem.__patched = true;
    }
  }

  function boot() {
    patchOrigLS();
    setTimeout(initSync, 300);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
