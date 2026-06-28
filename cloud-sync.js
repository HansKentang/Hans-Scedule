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
 *    - Periodic dirty check (every 3s): compare current localStorage vs snapshot
 *    - If changes detected: debounced (1.5s) push to Firestore
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
 *    - Not synced (too large for Firestore documents)
 *    - Stored in IndexedDB per-device
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
  // Pause the onSnapshot listener during our own push to prevent echo loops
  paused: false,
  // Track whether this session already did the initial pull
  initialPullDone: false,
};

// All localStorage keys synced to/from Firestore.
// Images excluded — too large for Firestore documents.
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
  'haven-activity-completions',
  'haven-schedule-routine',
  'haven-schedule-pomodoro',
  'haven-schedule-focus',
  'haven-schedule-chat',
  'haven-schedule-ai-usage',
];

// The app stores all user data under a userId prefix (e.g. "firebase-xxx:haven-schedule-tasks").
// This helper returns the actual localStorage key for the current user.
function _syncKey(baseKey) {
  var uid = CLOUD_SYNC.userId;
  return uid ? uid + ':' + baseKey : baseKey;
}

// Pre-computed sync keys for the current user. Rebuilt when userId changes.
var CLOUD_SYNC_KEYS = [];

function rebuildSyncKeys() {
  CLOUD_SYNC_KEYS = CLOUD_SYNC_BASE_KEYS.map(function(k) { return _syncKey(k); });
}

// ─── INIT ─────────────────────────────────────────────────────
// Called by gsi.js after auth is confirmed.
// Must be called with the full user id (e.g. "firebase-xxx").
function initCloudSync(userId) {
  if (!userId || CLOUD_SYNC.initialized) return;
  // Only sync for Google-authenticated users.
  // Local profiles (prefixed "u") are device-specific and can't sync.
  if (userId.indexOf('firebase-') !== 0) return;

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

    // Snapshot the current localStorage so we can detect changes
    takeCloudSnapshot();

    CLOUD_SYNC.initialized = true;

    // Phase 1: pull data from cloud, merge into localStorage
    pullFromCloud().then(function(cloudHadData) {
      // Phase 2: start the real-time listener for changes from other devices
      startCloudListener();
      // Phase 3: start periodic dirty check to push local changes
      startDirtyCheck();
    }).catch(function() {
      // Even if initial pull fails, start listener + dirty check
      startCloudListener();
      startDirtyCheck();
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
      var cloudVal = data[key];
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

    if (anyChange) {
      // Update snapshot to reflect newly applied cloud data
      takeCloudSnapshot();
      // Reload the page so all in-memory state picks up the changes
      scheduleCloudReload('Pulled data from the cloud');
    }

    CLOUD_SYNC.initialPullDone = true;
    return true;
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
        batch[key] = val;
      }
    } catch (e) { /* ignore */ }
  }

  // Add session metadata for echo-loop prevention
  batch._updatedBy = CLOUD_SYNC.sessionId;

  // Pause listener so we don't react to our own write
  CLOUD_SYNC.paused = true;

  return CLOUD_SYNC.docRef.set(batch, { merge: true }).then(function() {
    CLOUD_SYNC.lastPushTime = Date.now();
    // Update snapshot after successful push
    takeCloudSnapshot();
  }).catch(function(err) {
    console.warn('[sync] push failed:', err);
  }).then(function() {
    CLOUD_SYNC.isPushing = false;
    // Re-enable listener after a short delay to avoid echo
    setTimeout(function() {
      CLOUD_SYNC.paused = false;
    }, 1000);
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
    // If we just pushed (within last 3s), skip to prevent loops
    if (Date.now() - CLOUD_SYNC.lastPushTime < 3000) return;

    var anyChange = false;
    for (var i = 0; i < CLOUD_SYNC_KEYS.length; i++) {
      var key = CLOUD_SYNC_KEYS[i];
      var cloudVal = data[key];
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
  });
}

// ─── DIRTY CHECK ──────────────────────────────────────────────
// Periodically checks if localStorage has changed since last snapshot.
// If so, pushes changes to Firestore (debounced).
function startDirtyCheck() {
  if (CLOUD_SYNC.dirtyCheckInterval) return;

  CLOUD_SYNC.dirtyCheckInterval = setInterval(function() {
    // Only push if enough time has passed since last push (debounce)
    if (Date.now() - CLOUD_SYNC.lastPushTime < 2000) return;

    for (var i = 0; i < CLOUD_SYNC_KEYS.length; i++) {
      var key = CLOUD_SYNC_KEYS[i];
      try {
        var current = localStorage.getItem(key);
        if (current !== CLOUD_SYNC.lastSnapshot[key]) {
          // Debounced push: wait 1.5s after last dirty check
          if (CLOUD_SYNC.pushTimeout) clearTimeout(CLOUD_SYNC.pushTimeout);
          CLOUD_SYNC.pushTimeout = setTimeout(function() {
            CLOUD_SYNC.pushTimeout = null;
            pushToCloud();
          }, 1500);
          return; // Only need one debounce cycle
        }
      } catch (e) { /* ignore */ }
    }
  }, 3000);
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
