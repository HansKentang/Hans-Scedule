var CLOUD_TABLE = 'app_data';
var CLOUD_IMAGE_BUCKET = 'haven-user-images';
var CLOUD_PUSH_DEBOUNCE_MS = 1200;
var CLOUD_HYDRATE_TIMEOUT_MS = 15000;

var CLOUD_MODE = false;
var CLOUD_NEEDED = false;
var CLOUD_HYDRATED = false;
var CLOUD_STARTED = false;
var CLOUD_MEM = {};
var CLOUD_DEFERRED = null;
var CLOUD_PUSH_TIMER = null;
var CLOUD_PUSHING = false;
var CLOUD_BLOCKED_EL = null;
// The account CLOUD_MEM was hydrated for. Account switches flip
// state.currentUserId while this page is still tearing down, so every write
// that carries the blob (pagehide flush, image ops) must target the account
// that actually owns the data in memory.
var CLOUD_MEM_UID = null;

function cloudUid() {
  return CLOUD_MEM_UID || state.currentUserId;
}

var CLOUD_DEVICE_KEYS = [
  'haven-device-id',
  'haven-device-label',
  'haven-synced-at',
  'haven-admin-password',
  'haven-admin-presets',
  'haven-schedule-apikey',
  'haven-schedule-chat',
  'haven-guest-default-template',
  'haven-gsi-migrated'
];

function cloudActiveUser() {
  if (typeof localUsers === 'undefined' || !Array.isArray(localUsers)) return null;
  var id = null;
  try { id = getActiveUserId(); } catch (e) { id = null; }
  if (!id) return null;
  for (var i = 0; i < localUsers.length; i++) {
    if (localUsers[i] && localUsers[i].id === id) return localUsers[i];
  }
  return null;
}

function isCloudAccount() {
  try { if (isGuestMode()) return false; } catch (e) { /* gsi not ready */ }
  var user = cloudActiveUser();
  return !!(user && user.authUid);
}

function cloudIsAppKey(key) {
  if (typeof key !== 'string') return false;
  if (key.indexOf('haven-') !== 0) return false;
  if (key.indexOf('haven-gsi-') === 0) return false;
  if (key.indexOf('haven-device-') === 0) return false;
  if (key.indexOf('haven-image-') === 0) return false;
  if (key.indexOf('hub-image-') === 0) return false;
  if (key.indexOf('haven-fr24-key-') === 0) return false;
  if (key.indexOf('haven-strava-') === 0) return false;
  if (key.indexOf('haven-cloud-') === 0) return false;
  for (var i = 0; i < CLOUD_DEVICE_KEYS.length; i++) {
    if (CLOUD_DEVICE_KEYS[i] === key) return false;
  }
  return true;
}

function cloudCollectLocalData(uid) {
  var out = {};
  var prefix = uid + ':';
  try {
    for (var i = 0; i < __origLS.length; i++) {
      var k = __origLS.key(i);
      if (!k || k.indexOf(prefix) !== 0) continue;
      var short = k.slice(prefix.length);
      if (!cloudIsAppKey(short)) continue;
      var val = __origLS.getItem(k);
      if (val === null || typeof val === 'undefined' || val === '') continue;
      out[short] = val;
    }
  } catch (e) { /* ignore */ }
  return out;
}

function cloudPurgeLocal(uid) {
  var prefix = uid + ':';
  var doomed = [];
  try {
    for (var i = 0; i < __origLS.length; i++) {
      var k = __origLS.key(i);
      if (!k || k.indexOf(prefix) !== 0) continue;
      var short = k.slice(prefix.length);
      if (cloudIsAppKey(short) || short.indexOf('haven-image-') === 0 || short.indexOf('hub-image-') === 0) {
        doomed.push(k);
      }
    }
    for (var j = 0; j < doomed.length; j++) __origLS.removeItem(doomed[j]);
  } catch (e) { /* ignore */ }
}

function cloudSetSyncStatus(status) {
  if (typeof setSyncStatus === 'function') { try { setSyncStatus(status); return; } catch (e) { /* ignore */ } }
}

function cloudMakeDeferred() {
  var d = {};
  d.promise = new Promise(function(resolve) { d.resolve = resolve; });
  return d;
}

function cloudReady() {
  if (!CLOUD_NEEDED) return Promise.resolve();
  if (!CLOUD_DEFERRED) CLOUD_DEFERRED = cloudMakeDeferred();
  if (!CLOUD_STARTED) {
    CLOUD_STARTED = true;
    cloudHydrate();
    setTimeout(function() {
      if (!CLOUD_HYDRATED) cloudBlocked('Still waiting for your cloud data.');
    }, CLOUD_HYDRATE_TIMEOUT_MS);
  }
  return CLOUD_DEFERRED.promise;
}

function cloudHydrate() {
  var sb = getSupabaseDb();
  if (!sb) { cloudBlocked('Cloud storage is unavailable in this browser.'); return; }
  var uid = state.currentUserId;
  if (!uid) { cloudBlocked('No account is active.'); return; }
  CLOUD_MEM_UID = uid;

  cloudSetSyncStatus('syncing');
  var localData = cloudCollectLocalData(uid);
  var hadLocal = false;
  for (var lk in localData) { if (Object.prototype.hasOwnProperty.call(localData, lk)) { hadLocal = true; break; } }

  sb.from(CLOUD_TABLE).select('data, synced_at').eq('user_id', uid).maybeSingle()
    .then(function(res) {
      if (res && res.error) throw res.error;
      var row = res ? res.data : null;
      var cloud = (row && row.data) ? row.data : null;

      var mem = {};
      if (cloud) {
        for (var ck in cloud) {
          if (!Object.prototype.hasOwnProperty.call(cloud, ck)) continue;
          if (ck === '_syncedAt' || ck === '_version') continue;
          if (!cloudIsAppKey(ck)) continue;
          var cv = cloud[ck];
          if (cv === null || typeof cv === 'undefined' || cv === '') continue;
          mem[ck] = (typeof cv === 'string') ? cv : JSON.stringify(cv);
        }
      }
      for (var key in localData) {
        if (Object.prototype.hasOwnProperty.call(localData, key)) mem[key] = localData[key];
      }

      CLOUD_MEM = mem;
      CLOUD_HYDRATED = true;
      cloudHideBlocked();

      if (hadLocal) {
        cloudSchedulePush(0);
        try { if (typeof showToast === 'function') showToast('Device data moved to your account', 'success', 3000); } catch (e) {}
      }
      cloudPurgeLocal(uid);
      cloudStartImageSync();
      cloudSetSyncStatus('synced');
      if (CLOUD_DEFERRED) CLOUD_DEFERRED.resolve();
    })
    .catch(function(err) {
      console.warn('[cloud] hydrate failed:', err);
      cloudBlocked('Could not load your cloud data.');
    });
}

function cloudSchedulePush(delay) {
  if (!CLOUD_MODE || !CLOUD_HYDRATED) return;
  if (CLOUD_PUSH_TIMER) clearTimeout(CLOUD_PUSH_TIMER);
  CLOUD_PUSH_TIMER = setTimeout(function() {
    CLOUD_PUSH_TIMER = null;
    cloudPushNow();
  }, typeof delay === 'number' ? delay : CLOUD_PUSH_DEBOUNCE_MS);
}

function cloudPushNow() {
  var uid = cloudUid();
  if (!CLOUD_MODE || !CLOUD_HYDRATED || !uid) return false;
  var sb = getSupabaseDb();
  if (!sb) return false;

  var data = { _syncedAt: Date.now(), _version: 1 };
  for (var k in CLOUD_MEM) {
    if (!Object.prototype.hasOwnProperty.call(CLOUD_MEM, k)) continue;
    if (!cloudIsAppKey(k)) continue;
    var raw = CLOUD_MEM[k];
    if (raw === null || typeof raw === 'undefined' || raw === '') continue;
    try { data[k] = JSON.parse(raw); } catch (e) { data[k] = raw; }
  }

  /* auth_uid is the real owner column that RLS checks; send it explicitly so
     the row is always pinned to this account even without the DB trigger. */
  var owner = cloudActiveUser();
  var row = {
    user_id: uid,
    data: data,
    synced_at: data._syncedAt,
    version: 1
  };
  if (owner && owner.authUid) row.auth_uid = owner.authUid;

  CLOUD_PUSHING = true;
  cloudSetSyncStatus('syncing');
  sb.from(CLOUD_TABLE).upsert(row, { onConflict: 'user_id' }).then(function(res) {
    CLOUD_PUSHING = false;
    if (res && res.error) {
      console.warn('[cloud] push failed:', res.error);
      cloudSetSyncStatus('error');
      return;
    }
    cloudSetSyncStatus('synced');
  }).catch(function(err) {
    CLOUD_PUSHING = false;
    console.warn('[cloud] push failed:', err);
    cloudSetSyncStatus('error');
  });
  return true;
}

function cloudFlush() {
  if (CLOUD_PUSH_TIMER) { clearTimeout(CLOUD_PUSH_TIMER); CLOUD_PUSH_TIMER = null; }
  cloudPushNow();
}

function cloudBlocked(message) {
  if (CLOUD_HYDRATED || CLOUD_BLOCKED_EL) return;
  var el = document.createElement('div');
  el.id = 'cloudBlockedOverlay';
  el.setAttribute('style', 'position:fixed;inset:0;z-index:99999;display:flex;align-items:center;justify-content:center;background:var(--bg-primary,#141414);color:var(--text-primary,#eee);font-family:inherit;padding:24px;text-align:center');
  el.innerHTML =
    '<div style="max-width:360px">' +
      '<div style="font-size:1.05rem;font-weight:600;margin-bottom:8px">Cloud data unavailable</div>' +
      '<div id="cloudBlockedMsg" style="font-size:0.85rem;opacity:0.7;margin-bottom:20px">' + String(message || '') + '</div>' +
      '<button id="cloudRetryBtn" style="padding:10px 20px;border-radius:8px;border:none;background:var(--accent,#b4ccbc);color:#141414;font-weight:600;cursor:pointer">Retry</button>' +
      '<div style="margin-top:14px"><button id="cloudSignOutBtn" style="font-size:0.8rem;opacity:0.6;color:inherit;background:none;border:none;cursor:pointer">Sign out</button></div>' +
    '</div>';
  document.body.appendChild(el);
  CLOUD_BLOCKED_EL = el;
  var out = document.getElementById('cloudSignOutBtn');
  if (out) {
    out.addEventListener('click', function() {
      if (typeof signOutKeepProfile === 'function') { try { signOutKeepProfile(); return; } catch (e) { /* fall through */ } }
      location.href = 'login.html';
    });
  }
  var btn = document.getElementById('cloudRetryBtn');
  if (btn) {
    btn.addEventListener('click', function() {
      btn.disabled = true;
      btn.textContent = 'Retrying...';
      var msg = document.getElementById('cloudBlockedMsg');
      if (msg) msg.textContent = 'Reconnecting...';
      cloudHydrate();
      setTimeout(function() {
        if (CLOUD_HYDRATED) return;
        btn.disabled = false;
        btn.textContent = 'Retry';
        if (msg) msg.textContent = 'Still unavailable. Check your connection.';
      }, CLOUD_HYDRATE_TIMEOUT_MS);
    });
  }
}

function cloudHideBlocked() {
  if (CLOUD_BLOCKED_EL && CLOUD_BLOCKED_EL.parentNode) CLOUD_BLOCKED_EL.parentNode.removeChild(CLOUD_BLOCKED_EL);
  CLOUD_BLOCKED_EL = null;
}

function havenBoot(fn) {
  if (typeof fn !== 'function') return;
  var start = function() {
    cloudReady().then(function() {
      try { fn(); } catch (e) { console.error('[boot] init failed:', e); }
    });
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
}

/* ─── IMAGES → SUPABASE STORAGE ─────────────────────────── */

function cloudStorageFolder() {
  var u = null;
  try { u = cloudActiveUser(); } catch (e) { u = null; }
  if (u && u.authUid) return u.authUid;
  return cloudUid();
}

function cloudLegacyFolder() {
  var cur = null;
  try { cur = cloudUid(); } catch (e) { cur = null; }
  var main = null;
  try { main = cloudStorageFolder(); } catch (e) { main = cur; }
  return (cur && main && cur !== main) ? cur : null;
}

function cloudImagePath(id) {
  return cloudStorageFolder() + '/' + encodeURIComponent(String(id)) + '.txt';
}

function cloudUploadImage(id, url) {
  if (!CLOUD_MODE || !CLOUD_HYDRATED) return Promise.resolve();
  var sb = getSupabaseDb();
  if (!sb || !cloudStorageFolder()) return Promise.resolve();
  if (typeof id !== 'string' || !id) return Promise.resolve();
  if (!url) return cloudDeleteImage(id);
  var blob = cloudValueToBlob(url);
  return sb.storage.from(CLOUD_IMAGE_BUCKET)
    .upload(cloudImagePath(id), blob, { upsert: true, contentType: blob.type })
    .then(function(res) { if (res && res.error) throw res.error; })
    .catch(function(e) { console.warn('[cloud] image upload failed:', id, e); });
}

function cloudReadBlobText(blob) {
  if (typeof blob.text === 'function') return blob.text();
  return new Promise(function(resolve, reject) {
    var reader = new FileReader();
    reader.onload = function() { resolve(String(reader.result || '')); };
    reader.onerror = function() { reject(reader.error); };
    reader.readAsText(blob);
  });
}

function cloudReadBlobBuffer(blob) {
  if (typeof blob.arrayBuffer === 'function') return blob.arrayBuffer();
  return new Promise(function(resolve, reject) {
    var reader = new FileReader();
    reader.onload = function() { resolve(reader.result); };
    reader.onerror = function() { reject(reader.error); };
    reader.readAsArrayBuffer(blob);
  });
}

function cloudDataUrlToBlob(value) {
  var comma = value.indexOf(',');
  if (value.slice(0, 5) !== 'data:' || comma < 0) return null;
  var meta = value.slice(5, comma);
  if (meta.indexOf(';base64') === -1) return null;
  var mime = meta.split(';')[0] || 'image/jpeg';
  var binary;
  try { binary = atob(value.slice(comma + 1)); } catch (e) { return null; }
  var bytes = new Uint8Array(binary.length);
  for (var i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}

function cloudValueToBlob(value) {
  var blob = cloudDataUrlToBlob(String(value));
  if (blob) return blob;
  return new Blob([String(value)], { type: 'image/jpeg' });
}

function cloudBlobToDataUrl(blob) {
  return cloudReadBlobBuffer(blob).then(function(buffer) {
    var bytes = new Uint8Array(buffer);
    var binary = '';
    for (var i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
    return 'data:' + (blob.type || 'image/jpeg') + ';base64,' + btoa(binary);
  });
}

function cloudDecodeImageBlob(blob) {
  if (!blob) return Promise.resolve('');
  return cloudReadBlobText(blob.slice(0, 32)).then(function(head) {
    if (/^(data:|https?:\/\/)/i.test(head)) return cloudReadBlobText(blob);
    return cloudBlobToDataUrl(blob);
  }).catch(function() { return ''; });
}

function cloudDeleteImage(id) {
  if (!CLOUD_MODE || !CLOUD_HYDRATED) return Promise.resolve();
  var sb = getSupabaseDb();
  if (!sb || !cloudStorageFolder()) return Promise.resolve();
  var targets = [cloudImagePath(id)];
  var legacy = cloudLegacyFolder();
  if (legacy) targets.push(legacy + '/' + encodeURIComponent(String(id)) + '.txt');
  return sb.storage.from(CLOUD_IMAGE_BUCKET).remove(targets)
    .then(function() {}).catch(function(e) { console.warn('[cloud] image delete failed:', id, e); });
}

function cloudImageManifestKey() {
  return 'haven-cloud-imgmeta-' + cloudStorageFolder();
}

function cloudReadImageManifest() {
  try {
    var raw = localStorage.getItem(cloudImageManifestKey());
    var parsed = raw ? JSON.parse(raw) : null;
    return (parsed && typeof parsed === 'object') ? parsed : {};
  } catch (e) { return {}; }
}

function cloudWriteImageManifest(manifest) {
  try { localStorage.setItem(cloudImageManifestKey(), JSON.stringify(manifest)); } catch (e) { /* ignore */ }
}

function cloudDownloadImages() {
  var empty = { images: {}, removed: [] };
  if (!CLOUD_MODE || !CLOUD_HYDRATED) return Promise.resolve(empty);
  var sb = getSupabaseDb();
  if (!sb || !cloudStorageFolder()) return Promise.resolve(empty);
  var uid = cloudStorageFolder();
  var legacy = cloudLegacyFolder();
  var manifest = cloudReadImageManifest();
  var next = {};
  var out = {};
  var removed = [];
  var listMain = sb.storage.from(CLOUD_IMAGE_BUCKET).list(uid, { limit: 1000 });
  var listLegacy = legacy ? sb.storage.from(CLOUD_IMAGE_BUCKET).list(legacy, { limit: 1000 }).catch(function() { return { data: [] }; }) : Promise.resolve({ data: [] });
  return Promise.all([listMain, listLegacy])
    .then(function(all) {
      var res = all[0];
      var resLegacy = all[1];
      if (res && res.error) throw res.error;
      var files = (res && res.data) ? res.data.slice() : [];
      var legacyFiles = (resLegacy && resLegacy.data) ? resLegacy.data : [];
      var seen = {};
      files.forEach(function(f) { if (f && f.name) seen[f.name] = true; });
      legacyFiles.forEach(function(f) {
        if (f && f.name && !seen[f.name]) files.push({ name: f.name, updated_at: f.updated_at, created_at: f.created_at, _folder: legacy });
      });
      files.forEach(function(f) { if (f && !f._folder) f._folder = uid; });
      var chain = Promise.resolve();
      files.forEach(function(file) {
        var name = file && file.name ? String(file.name) : '';
        if (!name || name.slice(-4) !== '.txt') return;
        var id = name.slice(0, -4);
        try { id = decodeURIComponent(id); } catch (e) { /* keep raw */ }
        var stamp = String(file.updated_at || file.created_at || file.last_modified || '');
        next[id] = stamp;
        if (stamp && manifest[id] === stamp) return;
        chain = chain.then(function() {
          return sb.storage.from(CLOUD_IMAGE_BUCKET).download(file._folder + '/' + name)
            .then(function(dl) {
              if (dl && dl.error) throw dl.error;
              return cloudDecodeImageBlob(dl && dl.data);
            })
            .then(function(text) { if (text) out[id] = text; })
            .catch(function() {});
        });
      });
      for (var prevId in manifest) {
        if (!Object.prototype.hasOwnProperty.call(manifest, prevId)) continue;
        if (!Object.prototype.hasOwnProperty.call(next, prevId)) removed.push(prevId);
      }
      return chain;
    })
    .then(function() {
      cloudWriteImageManifest(next);
      return { images: out, removed: removed };
    })
    .catch(function(e) {
      console.warn('[cloud] image list failed:', e);
      return empty;
    });
}

function cloudLoadImagesIntoState() {
  if (!CLOUD_MODE || !CLOUD_HYDRATED) return Promise.resolve();
  return cloudDownloadImages().then(function(bundle) {
    if (!state.images) state.images = {};
    var changed = false;
    for (var id in bundle.images) {
      if (!Object.prototype.hasOwnProperty.call(bundle.images, id)) continue;
      if (state.images[id] !== bundle.images[id]) {
        state.images[id] = bundle.images[id];
        changed = true;
      }
      if (typeof _imgDBPut === 'function') { try { _imgDBPut(id, bundle.images[id]); } catch (e) {} }
    }
    bundle.removed.forEach(function(removedId) {
      if (state.images[removedId]) { state.images[removedId] = ''; changed = true; }
      if (typeof _imgDBDelete === 'function') { try { _imgDBDelete(removedId); } catch (e) {} }
    });
    if (changed) { try { if (typeof applyImages === 'function') applyImages(); } catch (e) {} }
  });
}

function cloudDeleteRemoteData(uid) {
  if (!uid) return Promise.resolve();
  var authUid = null;
  try {
    if (typeof localUsers !== 'undefined' && Array.isArray(localUsers)) {
      for (var i = 0; i < localUsers.length; i++) {
        if (localUsers[i] && localUsers[i].id === uid && localUsers[i].authUid) { authUid = localUsers[i].authUid; break; }
      }
    }
  } catch (e) { authUid = null; }
  if (!authUid) return Promise.resolve();
  var sb = getSupabaseDb();
  if (!sb) return Promise.resolve();
  var jobs = [];
  try { jobs.push(sb.from(CLOUD_TABLE).delete().eq('user_id', uid)); } catch (e) { /* ignore */ }
  try { jobs.push(sb.from(CLOUD_TABLE).delete().eq('auth_uid', authUid)); } catch (e) { /* ignore */ }
  var folders = [authUid];
  if (uid !== authUid) folders.push(uid);
  folders.forEach(function(folder) {
    try {
      jobs.push(sb.storage.from(CLOUD_IMAGE_BUCKET).list(folder, { limit: 1000 }).then(function(res) {
        var files = (res && res.data) ? res.data : [];
        var paths = [];
        files.forEach(function(file) { if (file && file.name) paths.push(folder + '/' + file.name); });
        if (!paths.length) return;
        return sb.storage.from(CLOUD_IMAGE_BUCKET).remove(paths);
      }));
    } catch (e) { /* ignore */ }
    try { localStorage.removeItem('haven-cloud-imgmeta-' + folder); } catch (e) { /* ignore */ }
    try { localStorage.removeItem('haven-cloud-imgmig-' + folder); } catch (e) { /* ignore */ }
  });
  return Promise.all(jobs).catch(function(e) { console.warn('[cloud] remote delete failed:', e); });
}

function cloudStartImageSync() {
  if (!CLOUD_MODE) return;
  var folder = null;
  try { folder = cloudStorageFolder(); } catch (e) { folder = null; }
  if (!folder) return;
  var marker = null;
  try { marker = localStorage.getItem('haven-cloud-imgmig-' + folder); } catch (e) { marker = null; }
  if (marker === '1') return;
  if (typeof _imgDBGetAll !== 'function') return;
  _imgDBGetAll().then(function(localImages) {
    var chain = Promise.resolve();
    for (var id in localImages) {
      if (!Object.prototype.hasOwnProperty.call(localImages, id)) continue;
      (function(imageId, url) {
        if (!url) return;
        chain = chain.then(function() { return cloudUploadImage(imageId, url); });
      })(id, localImages[id]);
    }
    return chain;
  }).then(function() {
    try { localStorage.setItem('haven-cloud-imgmig-' + folder, '1'); } catch (e) {}
  }).catch(function(e) { console.warn('[cloud] image migration failed:', e); });
}

/* ─── STORAGE SHIM ──────────────────────────────────────── */

var _cloudBaseGetItem = localStorage.getItem;
var _cloudBaseSetItem = localStorage.setItem;
var _cloudBaseRemoveItem = localStorage.removeItem;

localStorage.getItem = function(key) {
  if (CLOUD_MODE && cloudIsAppKey(key)) {
    return Object.prototype.hasOwnProperty.call(CLOUD_MEM, key) ? CLOUD_MEM[key] : null;
  }
  return _cloudBaseGetItem.call(localStorage, key);
};

localStorage.setItem = function(key, val) {
  if (CLOUD_MODE && cloudIsAppKey(key)) {
    if (val === null || typeof val === 'undefined' || val === '') {
      if (Object.prototype.hasOwnProperty.call(CLOUD_MEM, key)) delete CLOUD_MEM[key];
    } else {
      CLOUD_MEM[key] = String(val);
    }
    cloudSchedulePush();
    return true;
  }
  return _cloudBaseSetItem.call(localStorage, key, val);
};

localStorage.removeItem = function(key) {
  if (CLOUD_MODE && cloudIsAppKey(key)) {
    if (Object.prototype.hasOwnProperty.call(CLOUD_MEM, key)) delete CLOUD_MEM[key];
    cloudSchedulePush();
    return;
  }
  return _cloudBaseRemoveItem.call(localStorage, key);
};

/* ─── BOOT ──────────────────────────────────────────────── */

CLOUD_MODE = isCloudAccount();
CLOUD_NEEDED = CLOUD_MODE;

(function() {
  function wire() {
    if (typeof document === 'undefined') return;
    window.addEventListener('pagehide', cloudFlush);
    document.addEventListener('visibilitychange', function() {
      if (document.visibilityState === 'hidden') cloudFlush();
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', wire);
  else wire();
})();
