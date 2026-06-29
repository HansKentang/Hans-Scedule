// ─── CLOUD SYNC — Cross-device data sync for Havën ────────────
// This file must be loaded AFTER firestore.js and gsi.js.
// Syncs app data between devices via Firestore in real-time.
// Only active for Google-authenticated users (local profiles stay local).

/* === Sync Architecture ===
 *
 * 1. ON STARTUP (after auth):
 *    - Pull all data from Firestore → merge into localStorage
 *    - Reload page once to ensure fresh state
 *
 * 2. DURING USE:
 *    - Periodic dirty check (every 1s): compare current localStorage vs snapshot
 *    - If changes detected: push to Firestore immediately
 *    - Push includes a unique session ID to identify our own writes
 *
 * 3. REAL-TIME (Firestore onSnapshot):
 *    - Listen for changes from other devices
 *    - If updatedBy differs from our session ID → apply changes
 *    - Show "Synced from another device" toast + reload
 *
 * 4. CONFLICT RESOLUTION:
 *    - Last-write-wins per data field
 *    - Each field has an _updatedAt server timestamp from the last push
 *    - The onSnapshot listener applies whatever is in Firestore
 *
 * 5. IMAGES:
 *    - Synced as data URLs (resized to 800px max, ~50-200KB each)
 *    - Only custom images (different from defaults) are synced, not URL defaults
 *    - Stored in localStorage per-key under haven-image-{id} + IndexedDB
 */

var CLOUD_SYNC = {
  initialized: false,
  sessionId: 's' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
  userId: null,
  docRef: null,
  unsubscribe: null,
  dirtyCheckInterval: null,
  pushTimeout: null,
  isPushing: false,
  lastSnapshot: {},
  lastPushTime: 0,
  lastPullTime: 0,
  // Pause the onSnapshot listener during our own push to prevent echo loops
  paused: false,
  // Track whether this session already did the initial pull
  initialPullDone: false,
};

// All localStorage keys synced to/from Firestore.
// Custom images (differing from defaults) are added dynamically at init time.
// Base keys (without user prefix). Used to build the actual localStorage
// and Firestore keys for the current logged-in user.
var CLOUD_SYNC_BASE_KEYS = [
  'haven-schedule-tasks',
  'haven-schedule-settings',
  'haven-schedule-sleep',
  'haven-schedule-sleep-targets',
  'haven-schedule-goals',
  'haven-schedule-profile',
  'haven-custom-tags',
  'haven-card-colors',
  'haven-subcategories',
  'haven-schedule-categories',
  'haven-schedule-hub-layout',
  'haven-hub-visibility',
  'haven-hub-content',
  'haven-activities-completions',
  'haven-schedule-routine',
  'haven-schedule-pomodoro',
  'haven-schedule-focus',
  'haven-schedule-chat',
  'haven-schedule-ai-usage',
  'haven-schedule-finance',
  'haven-piggybank',
  'haven-wallet',
  'haven-sidebar-config',
  'haven-gallery-layout',
  'haven-plus-bubble-schedule',
  'haven-plus-bubble-hub',
  'haven-spotify-playlists',
  'haven-spotify-active',
  'haven-spotify-collapsed',
  'chickbot_profile',
  // AI settings (API key, model, provider) — synced so you don't reconfigure per device
  'haven-schedule-apikey',
  'haven-schedule-model',
  'haven-schedule-provider',
];

// Pre-computed sync keys for the current user (base keys without userId prefix).
// The localStorage override in shared.js adds the userId prefix automatically.
// For Firestore field access, the prefix is added inline with CLOUD_SYNC.userId.
var CLOUD_SYNC_KEYS = [];

function rebuildSyncKeys() {
  CLOUD_SYNC_KEYS = CLOUD_SYNC_BASE_KEYS.slice();
}

// ─── CUSTOM IMAGE KEYS ─────────────────────────────────────────
// Scans state.images for any images that differ from their defaults
// and adds their localStorage keys (haven-image-{id}) to the sync list.
// Only data URLs or custom URLs get synced — default picsum/unsplash URLs are skipped.
function addCustomImageKeys() {
  var added = 0;
  try {
    if (typeof DEFAULT_IMAGES !== 'undefined' && typeof state !== 'undefined' && state && state.images) {
      for (var key in DEFAULT_IMAGES) {
        if (DEFAULT_IMAGES.hasOwnProperty(key)) {
          var imgVal = state.images[key];
          var defaultVal = DEFAULT_IMAGES[key];
          // Only sync if the image has been customized (differs from default)
          if (imgVal && imgVal !== defaultVal) {
            var imgSyncKey = 'haven-image-' + key;
            if (CLOUD_SYNC_BASE_KEYS.indexOf(imgSyncKey) === -1) {
              CLOUD_SYNC_BASE_KEYS.push(imgSyncKey);
              added++;
            }
          }
        }
      }
    }
    // Also scan for any image keys that may not be in DEFAULT_IMAGES (e.g. dynamically added)
    if (typeof __origLS !== 'undefined') {
      for (var i = 0; i < __origLS.length; i++) {
        var lsk = __origLS.key(i);
        if (!lsk) continue;
        // Match keys like "firebase-xxx:haven-image-something" or "haven-image-something"
        var match = lsk.match(/(?:^|:)(haven-image-.+)$/);
        if (match) {
          var baseKey = match[1];
          if (CLOUD_SYNC_BASE_KEYS.indexOf(baseKey) === -1) {
            var val = __origLS.getItem(lsk);
            // Only add if the value is a data URL (custom upload/paste, not a default URL)
            if (val && val.indexOf('data:') === 0) {
              CLOUD_SYNC_BASE_KEYS.push(baseKey);
              added++;
            }
          }
        }
      }
    }
    if (added > 0) {
      rebuildSyncKeys();
    }
  } catch (e) {
    console.warn('[sync] addCustomImageKeys error:', e);
  }
  return added;
}

// ─── INIT ─────────────────────────────────────────────────────
// Called by gsi.js after auth is confirmed.
// Must be called with the full user id (e.g. "firebase-xxx").
function initCloudSync(userId) {
  if (!userId || CLOUD_SYNC.initialized) return;
  // Only sync for Google-authenticated users.
  // Local profiles (prefixed "u") are device-specific and can't sync.
  if (userId.indexOf('firebase-') !== 0) return;

  // Warn if running from file:// protocol — Firestore won't work
  if (window.location.protocol === 'file:') {
    console.warn('[sync] Cannot sync from file:// protocol. Use a local web server (http://) for cloud sync.');
    CLOUD_SYNC_STATUS.lastError = 'Cloud sync requires a web server (http://). Open via http://localhost or deploy online.';
    CLOUD_SYNC_STATUS.lastErrorTime = Date.now();
    if (typeof showToast === 'function') {
      showToast('Cloud sync unavailable: open via http:// instead of file://', 'warning', 5000);
    }
    return;
  }

  CLOUD_SYNC.userId = userId;

  try {
    initFirestore();
    var db = getFirestoreDb();
    if (!db) {
      // Firestore not ready yet — retry shortly
      setTimeout(function() { initCloudSync(userId); }, 1000);
      return;
    }

    CLOUD_SYNC.docRef = db.collection('userdata').doc(userId);

    // Rebuild the prefixed sync keys for this user
    rebuildSyncKeys();

    // Add any custom image keys to the sync list
    addCustomImageKeys();

    // Snapshot the current localStorage so we can detect changes
    takeCloudSnapshot();

    CLOUD_SYNC.initialized = true;

    // Phase 1: pull data from cloud, merge into localStorage
    pullFromCloud().then(function(cloudHadData) {
      // Phase 2: start the real-time listener for changes from other devices
      startCloudListener();
      // Phase 3: start periodic dirty check to push local changes
      startDirtyCheck();
      _updateSyncStatus();
    }).catch(function() {
      // Even if initial pull fails, start listener + dirty check
      startCloudListener();
      startDirtyCheck();
      _updateSyncStatus();
    });
  } catch (e) {
    console.warn('[sync] init failed:', e);
  }
}

// ─── SNAPSHOT ─────────────────────────────────────────────────
// Records current localStorage values for comparison.
function takeCloudSnapshot() {
  CLOUD_SYNC.lastSnapshot = {};
  for (var i = 0; i < CLOUD_SYNC_KEYS.length; i++) {
    var key = CLOUD_SYNC_KEYS[i];
    try {
      CLOUD_SYNC.lastSnapshot[key] = localStorage.getItem(key);
    } catch (e) { /* ignore */ }
  }
}

// ─── PULL FROM CLOUD ──────────────────────────────────────────
// Reads the Firestore userdata document and writes any
// cloud values into localStorage. Then reloads the page.
function pullFromCloud() {
  return CLOUD_SYNC.docRef.get().then(function(doc) {
    if (!doc.exists) return false;

    var data = doc.data();
    var anyChange = false;

    for (var i = 0; i < CLOUD_SYNC_KEYS.length; i++) {
      var key = CLOUD_SYNC_KEYS[i];
      var firestoreKey = CLOUD_SYNC.userId + ':' + key;
      var cloudVal = data[firestoreKey];
      // Skip keys that don't exist in the cloud doc yet
      if (cloudVal === undefined || cloudVal === null) continue;

      var localVal = CLOUD_SYNC.lastSnapshot[key];
      // Only write if cloud value differs from our local value
      if (cloudVal !== localVal) {
        try {
          localStorage.setItem(key, cloudVal);
          anyChange = true;
        } catch (e) { /* ignore */ }
      }
    }

    CLOUD_SYNC.lastPullTime = Date.now();
    _updateSyncStatus();

    if (anyChange) {
      // Update snapshot to reflect newly applied cloud data
      takeCloudSnapshot();
      // Reload the page so all in-memory state picks up the changes
      scheduleCloudReload('Pulled data from the cloud');
    }

    CLOUD_SYNC.initialPullDone = true;
    return true;
  }).catch(function(err) {
    console.warn('[sync] pull failed:', err);
    CLOUD_SYNC_STATUS.lastError = err.message || String(err);
    CLOUD_SYNC_STATUS.lastErrorTime = Date.now();
    if (typeof showToast === 'function') showToast('Sync pull failed: ' + (err.message || 'unknown error'), 'error', 4000);
  });
}

// ─── PUSH TO CLOUD ────────────────────────────────────────────
// Writes current localStorage values to Firestore.
// Called after dirty check detects changes.
function pushToCloud() {
  if (CLOUD_SYNC.isPushing || !CLOUD_SYNC.docRef) return Promise.resolve();
  CLOUD_SYNC.isPushing = true;

  var batch = {};
  for (var i = 0; i < CLOUD_SYNC_KEYS.length; i++) {
    var key = CLOUD_SYNC_KEYS[i];
    try {
      var val = localStorage.getItem(key);
      if (val !== null) {
        batch[CLOUD_SYNC.userId + ':' + key] = val;
      }
    } catch (e) { /* ignore */ }
  }

  // Add session metadata for echo-loop prevention
  batch._updatedBy = CLOUD_SYNC.sessionId;

  // Pause listener so we don't react to our own write
  CLOUD_SYNC.paused = true;

  return CLOUD_SYNC.docRef.set(batch, { merge: true }).then(function() {
    CLOUD_SYNC.lastPushTime = Date.now();
    _updateSyncStatus();
    takeCloudSnapshot();
  }).catch(function(err) {
    console.warn('[sync] push failed:', err);
    CLOUD_SYNC_STATUS.lastError = err.message || String(err);
    CLOUD_SYNC_STATUS.lastErrorTime = Date.now();
    if (typeof showToast === 'function') showToast('Sync push failed: ' + (err.message || 'unknown error'), 'error', 4000);
  }).then(function() {
    CLOUD_SYNC.isPushing = false;
    // Re-enable listener after a short delay to avoid echo
    setTimeout(function() {
      CLOUD_SYNC.paused = false;
    }, 300);
  });
}

// ─── REAL-TIME LISTENER ──────────────────────────────────────
// Uses Firestore onSnapshot to receive changes from other devices.
function startCloudListener() {
  if (CLOUD_SYNC.unsubscribe) return;

  CLOUD_SYNC.unsubscribe = CLOUD_SYNC.docRef.onSnapshot(function(doc) {
    if (!doc.exists) return;

    // Skip updates we wrote ourselves
    if (CLOUD_SYNC.paused) return;
    var data = doc.data();
    var updatedBy = data._updatedBy || '';
    if (updatedBy === CLOUD_SYNC.sessionId) return;
    // If we just pushed (within last 1s), skip to prevent loops
    if (Date.now() - CLOUD_SYNC.lastPushTime < 1000) return;

    var anyChange = false;
    for (var i = 0; i < CLOUD_SYNC_KEYS.length; i++) {
      var key = CLOUD_SYNC_KEYS[i];
      var firestoreKey = CLOUD_SYNC.userId + ':' + key;
      var cloudVal = data[firestoreKey];
      if (cloudVal === undefined || cloudVal === null) continue;

      try {
        var localVal = localStorage.getItem(key);
        if (cloudVal !== localVal) {
          localStorage.setItem(key, cloudVal);
          anyChange = true;
        }
      } catch (e) { /* ignore */ }
    }

    if (anyChange) {
      takeCloudSnapshot();
      scheduleCloudReload('Synced with another device');
    }
  }, function(err) {
    console.warn('[sync] listener error:', err);
    CLOUD_SYNC_STATUS.lastError = err.message || String(err);
    CLOUD_SYNC_STATUS.lastErrorTime = Date.now();
  });
}

// ─── DIRTY CHECK ──────────────────────────────────────────────
// Periodically checks if localStorage has changed since last snapshot.
// If so, pushes changes to Firestore (debounced).
function startDirtyCheck() {
  if (CLOUD_SYNC.dirtyCheckInterval) return;

  CLOUD_SYNC.dirtyCheckInterval = setInterval(function() {
    // Only push if enough time has passed since last push (debounce)
    if (Date.now() - CLOUD_SYNC.lastPushTime < 500) return;

    for (var i = 0; i < CLOUD_SYNC_KEYS.length; i++) {
      var key = CLOUD_SYNC_KEYS[i];
      try {
        var current = localStorage.getItem(key);
        if (current !== CLOUD_SYNC.lastSnapshot[key]) {
          // Push changes immediately
          if (CLOUD_SYNC.pushTimeout) clearTimeout(CLOUD_SYNC.pushTimeout);
          CLOUD_SYNC.pushTimeout = setTimeout(function() {
            CLOUD_SYNC.pushTimeout = null;
            pushToCloud();
          }, 0);
          return; // Only need one debounce cycle
        }
      } catch (e) { /* ignore */ }
    }
  }, 1000);
}

// ─── REFRESH ──────────────────────────────────────────────────
// Schedules a page reload after cloud data is applied.
// Shows a toast before reloading so the user knows what happened.
var _cloudReloadTimeout = null;

function scheduleCloudReload(message) {
  if (_cloudReloadTimeout) return;
  _cloudReloadTimeout = setTimeout(function() {
    _cloudReloadTimeout = null;
    if (typeof showToast === 'function') {
      showToast(message || 'Cloud sync complete', 'info', 2000);
    }
    setTimeout(function() {
      location.reload();
    }, 1000);
  }, 300);
}

// ─── TEARDOWN ─────────────────────────────────────────────────
// Called when the user signs out or switches accounts.
function stopCloudSync() {
  if (CLOUD_SYNC.unsubscribe) {
    CLOUD_SYNC.unsubscribe();
    CLOUD_SYNC.unsubscribe = null;
  }
  if (CLOUD_SYNC.dirtyCheckInterval) {
    clearInterval(CLOUD_SYNC.dirtyCheckInterval);
    CLOUD_SYNC.dirtyCheckInterval = null;
  }
  if (CLOUD_SYNC.pushTimeout) {
    clearTimeout(CLOUD_SYNC.pushTimeout);
    CLOUD_SYNC.pushTimeout = null;
  }
  CLOUD_SYNC.initialized = false;
  CLOUD_SYNC.userId = null;
  CLOUD_SYNC.lastSnapshot = {};
  CLOUD_SYNC.lastPushTime = 0;
  CLOUD_SYNC.initialPullDone = false;
}

// ─── SYNC CLEAR ───────────────────────────────────────────────
// Deletes all cloud data for the current user.
// Called when a profile is removed.
function clearCloudData(userId) {
  if (!userId || typeof firebase === 'undefined') return Promise.resolve();
  try {
    initFirestore();
    var db = getFirestoreDb();
    if (!db) return Promise.resolve();
    return db.collection('userdata').doc(userId).delete().catch(function() {});
  } catch (e) {
    return Promise.resolve();
  }
}

// Export globally so gsi.js can call these
window.initCloudSync = initCloudSync;
window.stopCloudSync = stopCloudSync;
window.clearCloudData = clearCloudData;

// ─── SYNC STATUS ──────────────────────────────────────────────
// Global status tracking: call getCloudSyncStatus() anytime.
// Used by Settings > Account to render sync status UI.

var CLOUD_SYNC_STATUS = {
  mode: 'off',        // 'cloud' | 'local' | 'file-protocol' | 'off'
  connected: false,
  lastSyncTime: null,
  lastSyncAgo: null,
  lastError: null,
  lastErrorTime: null,
  protocol: window.location.protocol,
  hasGoogleUser: false,
  hasActiveUser: false,
  isGoogleUser: false,
  pushCount: 0,
  pullCount: 0,
};

// Call after every push/pull to update status
function _updateSyncStatus() {
  var ls = CLOUD_SYNC.lastPushTime || CLOUD_SYNC.lastPullTime;
  CLOUD_SYNC_STATUS.lastSyncTime = ls || null;
  CLOUD_SYNC_STATUS.lastSyncAgo = ls ? Date.now() - ls : null;
  CLOUD_SYNC_STATUS.connected = CLOUD_SYNC.initialized;
  CLOUD_SYNC_STATUS.mode = CLOUD_SYNC.initialized ? 'cloud' : 'off';
  if (typeof updateSyncStatusDot === 'function') updateSyncStatusDot();
}

function getCloudSyncStatus() {
  var activeId = null;
  try { activeId = typeof getActiveUserId === 'function' ? getActiveUserId() : localStorage.getItem('haven-gsi-active'); } catch (e) {}
  var isFirebase = activeId && activeId.indexOf('firebase-') === 0;
  var isLocal = activeId && activeId.indexOf('u') === 0;
  var guest = false;
  try { guest = sessionStorage.getItem('haven-guest') === '1'; } catch (e) {}

  CLOUD_SYNC_STATUS.protocol = window.location.protocol;
  CLOUD_SYNC_STATUS.hasActiveUser = !!activeId;
  CLOUD_SYNC_STATUS.isGoogleUser = !!isFirebase;
  CLOUD_SYNC_STATUS.guest = guest;

  // Determine mode
  if (window.location.protocol === 'file:') {
    CLOUD_SYNC_STATUS.mode = 'file-protocol';
    CLOUD_SYNC_STATUS.connected = false;
  } else if (guest) {
    CLOUD_SYNC_STATUS.mode = 'off';
    CLOUD_SYNC_STATUS.connected = false;
  } else if (isLocal) {
    CLOUD_SYNC_STATUS.mode = 'local';
    CLOUD_SYNC_STATUS.connected = false;
  } else if (isFirebase) {
    CLOUD_SYNC_STATUS.mode = 'cloud';
    CLOUD_SYNC_STATUS.connected = CLOUD_SYNC.initialized;
  } else {
    CLOUD_SYNC_STATUS.mode = 'off';
    CLOUD_SYNC_STATUS.connected = false;
  }

  // Build a label for display
  var ago = CLOUD_SYNC_STATUS.lastSyncTime ? _formatAgo(CLOUD_SYNC_STATUS.lastSyncTime) : null;
  CLOUD_SYNC_STATUS.lastSyncAgo = ago;
  CLOUD_SYNC_STATUS.code = activeId;

  // Check for warnings
  CLOUD_SYNC_STATUS.warning = null;
  if (window.location.protocol === 'file:') {
    CLOUD_SYNC_STATUS.warning = 'file-protocol';
  } else if (isLocal) {
    CLOUD_SYNC_STATUS.warning = 'local-profile';
  }

  return CLOUD_SYNC_STATUS;
}

function _formatAgo(ts) {
  if (!ts) return null;
  var diff = Date.now() - ts;
  if (diff < 5000) return 'just now';
  if (diff < 60000) return Math.floor(diff / 1000) + 's ago';
  if (diff < 3600000) return Math.floor(diff / 60000) + 'm ago';
  if (diff < 86400000) return Math.floor(diff / 3600000) + 'h ago';
  return Math.floor(diff / 86400000) + 'd ago';
}

// ─── MANUAL SYNC ──────────────────────────────────────────────
// Called by the "Sync Now" button in settings.
function triggerSyncNow() {
  if (window.location.protocol === 'file:') {
    if (typeof showToast === 'function') showToast('Cloud sync requires a web server (http://)', 'error', 4000);
    return;
  }
  if (!CLOUD_SYNC.initialized) {
    // Try initializing
    var activeId = typeof getActiveUserId === 'function' ? getActiveUserId() : null;
    if (activeId && activeId.indexOf('firebase-') === 0) {
      initCloudSync(activeId);
      if (typeof showToast === 'function') showToast('Initializing cloud sync...', 'info', 2000);
    } else {
      if (typeof showToast === 'function') showToast('No Google-authenticated profile found', 'error', 3000);
    }
    return;
  }
  // Force a push
  if (typeof showToast === 'function') showToast('Syncing...', 'info', 1500);
  takeCloudSnapshot();
  pushToCloud().then(function() {
    CLOUD_SYNC.lastPullTime = Date.now();
    _updateSyncStatus();
    if (typeof showToast === 'function') showToast('Synced!', 'success', 2000);
  }).catch(function() {
    if (typeof showToast === 'function') showToast('Sync failed. Check console for details.', 'error', 3000);
  });
}

window.getCloudSyncStatus = getCloudSyncStatus;
window.triggerSyncNow = triggerSyncNow;

// ─── SYNC STATUS DOT ──────────────────────────────────────────
// Updates the #syncStatusDot in the sidebar footer.
function updateSyncStatusDot() {
  var dot = document.getElementById('syncStatusDot');
  if (!dot) return;
  var st = typeof getCloudSyncStatus === 'function' ? getCloudSyncStatus() : null;
  if (!st) { dot.className = 'sync-dot'; dot.title = 'Sync: unknown'; return; }
  dot.className = 'sync-dot';
  if (st.mode === 'cloud' && st.connected) {
    dot.classList.add('online');
    dot.title = 'Cloud sync: online \u2014 Last: ' + (st.lastSyncAgo || 'never');
  } else if (st.mode === 'cloud' && !st.connected) {
    dot.classList.add('error');
    dot.title = 'Cloud sync: disconnected';
  } else if (st.mode === 'file-protocol') {
    dot.classList.add('file');
    dot.title = 'Cloud sync unavailable: open via http://';
  } else if (st.mode === 'local') {
    dot.title = 'Local profile \u2014 sign in with Google to sync';
  } else {
    dot.title = 'Sync: ' + st.mode;
  }
  if (st.lastError && st.lastErrorTime && Date.now() - st.lastErrorTime < 300000) {
    dot.classList.add('error');
    dot.title += ' \u2014 Last error: ' + st.lastError;
  }
}

// Update the dot on page load and periodically
document.addEventListener('DOMContentLoaded', function() {
  updateSyncStatusDot();
  setInterval(updateSyncStatusDot, 10000);
});

window.updateSyncStatusDot = updateSyncStatusDot;
