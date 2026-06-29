// ─── CLOUD SYNC — Wrapper for cloud-first storage ─────────────
// This file wraps the CLOUD_STORE system defined in shared.js.
// It provides status querying, manual sync trigger, and UI indicators.
// Must be loaded AFTER firestore.js, shared.js, and gsi.js.

// ─── INIT ─────────────────────────────────────────────────────
function initCloudSync(userId) {
  if (typeof initCloudStorage === 'function') {
    initCloudStorage(userId);
  }
}

function stopCloudSync() {
  if (typeof stopCloudStorage === 'function') {
    stopCloudStorage();
  }
}

function clearCloudData(userId) {
  if (!userId || typeof firebase === 'undefined') return Promise.resolve();
  try {
    if (typeof initFirestore === 'function') initFirestore();
    var db = typeof getFirestoreDb === 'function' ? getFirestoreDb() : null;
    if (!db) return Promise.resolve();
    return db.collection('userdata').doc(userId).delete().catch(function() {});
  } catch (e) {
    return Promise.resolve();
  }
}

window.initCloudSync = initCloudSync;
window.stopCloudSync = stopCloudSync;
window.clearCloudData = clearCloudData;

// ─── SYNC STATUS ──────────────────────────────────────────────
var CLOUD_SYNC_STATUS = {
  mode: 'off',
  connected: false,
  lastSyncTime: null,
  lastSyncAgo: null,
  lastError: null,
  lastErrorTime: null,
  protocol: window.location.protocol,
  hasGoogleUser: false,
  hasActiveUser: false,
  isGoogleUser: false,
};

function getCloudSyncStatus() {
  var activeId = null;
  try { activeId = typeof getActiveUserId === 'function' ? getActiveUserId() : localStorage.getItem('haven-gsi-active'); } catch (e) {}
  var isFirebase = activeId && activeId.indexOf('firebase-') === 0;
  var isLocal = activeId && activeId.indexOf('u') === 0;
  var guest = false;
  try { guest = sessionStorage.getItem('haven-guest') === '1'; } catch (e) {}

  var cs = typeof CLOUD_STORE !== 'undefined' ? CLOUD_STORE : null;

  CLOUD_SYNC_STATUS.protocol = window.location.protocol;
  CLOUD_SYNC_STATUS.hasActiveUser = !!activeId;
  CLOUD_SYNC_STATUS.isGoogleUser = !!isFirebase;
  CLOUD_SYNC_STATUS.guest = guest;
  CLOUD_SYNC_STATUS.code = activeId;

  // Determine mode
  if (guest) {
    CLOUD_SYNC_STATUS.mode = 'off';
    CLOUD_SYNC_STATUS.connected = false;
  } else if (isLocal) {
    CLOUD_SYNC_STATUS.mode = 'local';
    CLOUD_SYNC_STATUS.connected = false;
  } else if (isFirebase) {
    CLOUD_SYNC_STATUS.mode = 'cloud';
    CLOUD_SYNC_STATUS.connected = cs ? cs.initialized : false;
  } else {
    CLOUD_SYNC_STATUS.mode = 'off';
    CLOUD_SYNC_STATUS.connected = false;
  }

  // Last sync time from last successful write
  var lastSync = 0;
  if (CLOUD_STORE && CLOUD_STORE.lastFetch) {
    // Use the latest _updatedAt from the poll (written into lastFetch on flush)
  }
  CLOUD_SYNC_STATUS.lastSyncTime = null;
  CLOUD_SYNC_STATUS.lastSyncAgo = null;

  // Check for warnings
  CLOUD_SYNC_STATUS.warning = null;
  if (window.location.protocol === 'file:' && isFirebase) {
    CLOUD_SYNC_STATUS.warning = 'file-protocol';
  } else if (isLocal) {
    CLOUD_SYNC_STATUS.warning = 'local-profile';
  }

  return CLOUD_SYNC_STATUS;
}

// ─── MANUAL SYNC ──────────────────────────────────────────────
function triggerSyncNow() {
  if (typeof CLOUD_STORE === 'undefined' || !CLOUD_STORE.initialized) {
    var activeId = typeof getActiveUserId === 'function' ? getActiveUserId() : null;
    if (activeId && activeId.indexOf('firebase-') === 0) {
      if (typeof initCloudStorage === 'function') initCloudStorage(activeId);
      if (typeof showToast === 'function') showToast('Initializing cloud storage...', 'info', 2000);
    } else {
      if (typeof showToast === 'function') showToast('No Google-authenticated profile found', 'error', 3000);
    }
    return;
  }
  if (typeof showToast === 'function') showToast('Syncing...', 'info', 1500);
  // Force flush pending writes
  if (typeof _flushCloudWrites === 'function') {
    // Manually trigger flush immediately
    if (CLOUD_STORE.writeTimeout) {
      clearTimeout(CLOUD_STORE.writeTimeout);
      CLOUD_STORE.writeTimeout = null;
    }
    _flushCloudWrites();
  }
  if (typeof showToast === 'function') showToast('All data synced!', 'success', 2000);
}

// ─── SYNC STATUS DOT ──────────────────────────────────────────
function updateSyncStatusDot() {
  var dot = document.getElementById('syncStatusDot');
  if (!dot) return;
  var st = typeof getCloudSyncStatus === 'function' ? getCloudSyncStatus() : null;
  if (!st) { dot.className = 'sync-dot'; dot.title = 'Sync: unknown'; return; }
  dot.className = 'sync-dot';
  if (st.mode === 'cloud' && st.connected) {
    dot.classList.add('online');
    dot.title = 'Cloud storage: online';
  } else if (st.mode === 'cloud' && !st.connected) {
    dot.classList.add('error');
    dot.title = 'Cloud storage: initializing...';
  } else if (st.mode === 'local') {
    dot.title = 'Local profile \u2014 sign in with Google to sync';
  } else {
    dot.title = 'Sync: ' + st.mode;
  }
  if (st.warning === 'file-protocol') {
    dot.classList.add('file');
    dot.title += ' (file:// protocol)';
  }
  if (st.lastError && st.lastErrorTime && Date.now() - st.lastErrorTime < 300000) {
    dot.classList.add('error');
    dot.title += ' \u2014 Last error: ' + st.lastError;
  }
}

document.addEventListener('DOMContentLoaded', function() {
  updateSyncStatusDot();
  setInterval(updateSyncStatusDot, 10000);
});

window.getCloudSyncStatus = getCloudSyncStatus;
window.triggerSyncNow = triggerSyncNow;
window.updateSyncStatusDot = updateSyncStatusDot;
