/* ─── SUPABASE SYNC — Auto-sync all app data across devices ────────
   Loaded AFTER gsi.js. Mirrors every haven-* localStorage key to a
   single row per user in the app_data table, plus a profiles row. */

var SYNC_ENABLED = false;
var SYNC_DB = null;
var SYNC_PENDING = false;
var SYNC_STATUS = 'offline';
var SYNC_DEBOUNCE_TIMER = null;
var SYNC_DEBOUNCE_MS = 3000;
var SYNC_PULLED_ONCE = false;
var SYNC_PULLING = false;
var SYNC_PRESENCE_WIRED = false;
var SYNC_STATS_DIRTY = false;

/* Keys that must never leave the device. Everything here is either a secret or
   device-specific state — uploading an API key to the cloud would expose it to
   anyone able to read the row. */
var CLOUD_EXCLUDED_KEYS = [
  'haven-schedule-apikey',
  'haven-schedule-chat',
  'haven-admin-password',
  'haven-admin-presets',
  'haven-guest-default-template'
];

function initSync() {
  if (!isSupabaseConfigured()) {
    console.warn('[sync] Supabase not configured — sync disabled');
    setSyncStatus('noauth');
    return;
  }
  if (typeof state === 'undefined' || !state.currentUserId) {
    setSyncStatus('noauth');
    return;
  }
  if (typeof CLOUD_MODE !== 'undefined' && !CLOUD_MODE) {
    var me = getCurrentLocalUser();
    if (!me || !me.authUid) {
      setSyncStatus('noauth');
      return;
    }
  }

  var sb = getSupabaseDb();
  if (!sb) {
    console.warn('[sync] Supabase client unavailable');
    setSyncStatus('error');
    return;
  }
  setupSync(sb);
}

function setupSync(sb) {
  try {
    SYNC_DB = sb;
    SYNC_ENABLED = true;
    setSyncStatus('synced');

    syncUserProfileToSupabase();
    syncUserStatsToSupabase();

    if (typeof document !== 'undefined' && !SYNC_PRESENCE_WIRED) {
      SYNC_PRESENCE_WIRED = true;
      document.addEventListener('visibilitychange', function() {
        if (document.visibilityState === 'hidden') {
          setUserPresence('offline');
        } else {
          syncUserProfileToSupabase();
        }
      });
    }

    if (typeof CLOUD_MODE !== 'undefined' && CLOUD_MODE) {
      console.log('[sync] Cloud-only account — localStorage blob mirror disabled');
      return;
    }

    pullFromCloud();

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

/* ─── Pull data from Supabase → localStorage ───────────── */
function pullFromCloud() {
  if (!SYNC_ENABLED || !SYNC_DB || !state.currentUserId) return;
  if (typeof CLOUD_MODE !== 'undefined' && CLOUD_MODE) return;
  if (SYNC_PULLED_ONCE || SYNC_PULLING) return;

  SYNC_PULLING = true;
  setSyncStatus('syncing');

  SYNC_DB.from('app_data').select('data, synced_at').eq('user_id', state.currentUserId).maybeSingle()
    .then(function(res) {
      if (res.error) throw res.error;
      var row = res.data;
      if (!row || !row.data) {
        setSyncStatus('synced');
        SYNC_PULLED_ONCE = true;
        SYNC_PULLING = false;
        return;
      }

      var cloudData = row.data;
      var cloudSyncedAt = row.synced_at || cloudData._syncedAt || 0;
      var localSyncedAt = 0;
      var stampRaw = null;
      try { stampRaw = localStorage.getItem('haven-synced-at'); } catch (e) {}
      if (stampRaw !== null && stampRaw !== undefined && stampRaw !== '') {
        localSyncedAt = parseInt(stampRaw) || 0;
      } else {
        // The stamp used to be one device-wide value shared by every profile,
        // so the account you switch into inherited the previous account's
        // timestamp and its cloud copy never restored (then got overwritten by
        // the push that followed). Adopt the legacy value only when this profile
        // already owns local data — its own edits must not be reverted. A profile
        // with nothing on this device starts at 0 and pulls its copy freely.
        var legacy = 0;
        try { legacy = parseInt(__origLS.getItem('haven-synced-at') || '0') || 0; } catch (e) {}
        var ownsLocal = false;
        try {
          var pfx = state.currentUserId ? state.currentUserId + ':' : '';
          ownsLocal = typeof _hasAccountData === 'function' && _hasAccountData(pfx + 'haven-');
        } catch (e) {}
        localSyncedAt = ownsLocal ? legacy : 0;
      }

      if (cloudSyncedAt <= localSyncedAt) {
        setSyncStatus('synced');
        SYNC_PULLED_ONCE = true;
        SYNC_PULLING = false;
        return;
      }

      var restoredKeys = [];
      var SLEEP_GUARD_KEYS = ['haven-schedule-sleep', 'haven-schedule-sleep-targets', 'haven-schedule-sleep-routine'];
      for (var key in cloudData) {
        if (key === '_syncedAt' || key === '_version') continue;
        if (key.indexOf('haven-') !== 0) continue;
        if (key.indexOf('haven-image-') === 0 || key.indexOf('hub-image-') === 0) continue;
        /* Never let an old cloud blob overwrite a local credential. */
        if (CLOUD_EXCLUDED_KEYS.indexOf(key) !== -1) continue;
        if (key.indexOf('haven-fr24-key-') === 0 || key.indexOf('haven-strava-') === 0) continue;
        try {
          var val = cloudData[key];
          if (val === null || typeof val === 'undefined') continue;
          if (SLEEP_GUARD_KEYS.indexOf(key) !== -1 && isEmptyCloudValue(val) && !isEmptyLocalValue(key)) continue;
          localStorage.setItem(key, typeof val === 'string' ? val : JSON.stringify(val));
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

      if (typeof loadState === 'function') loadState();
      try {
        if (restoredKeys.indexOf('haven-spotify-playlists') !== -1 || restoredKeys.indexOf('haven-spotify-active') !== -1) {
          if (typeof spLoadState === 'function') spLoadState();
          if (typeof spRenderSidebar === 'function') spRenderSidebar();
          if (typeof window._updateSpotifyBubbles === 'function') window._updateSpotifyBubbles();
          else if (typeof renderHubBento === 'function' && document.querySelector('.bento-grid')) renderHubBento();
        }
      } catch (e) {}
      try {
        if (restoredKeys.indexOf('haven-schedule-sleep') !== -1 || restoredKeys.indexOf('haven-schedule-sleep-targets') !== -1 || restoredKeys.indexOf('haven-schedule-sleep-routine') !== -1) {
          if (typeof renderSleepHub === 'function') renderSleepHub();
          if (typeof renderSleepAnalytics === 'function') renderSleepAnalytics();
          if (typeof renderTargetEditor === 'function' && typeof loadSleepTargets === 'function') renderTargetEditor(loadSleepTargets());
          if (typeof renderSleepRoutine === 'function') renderSleepRoutine();
        }
      } catch (e) {}
    })
    .catch(function(err) {
      console.warn('[sync] Pull failed:', err);
      setSyncStatus('error');
      SYNC_PULLED_ONCE = true;
      SYNC_PULLING = false;
    });
}

function isEmptyCloudValue(val) {
  if (typeof val === 'string') return val === '' || val === '[]' || val === '{}';
  if (Array.isArray(val)) return val.length === 0;
  if (val && typeof val === 'object') return Object.keys(val).length === 0;
  return false;
}

function isEmptyLocalValue(key) {
  var raw = null;
  try { raw = localStorage.getItem(key); } catch (e) { return true; }
  if (raw === null || raw === '') return true;
  try {
    var parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed.length === 0;
    if (parsed && typeof parsed === 'object') return Object.keys(parsed).length === 0;
    return false;
  } catch (e) {
    return raw === '';
  }
}

/* ─── Push localStorage → Supabase ────────────────────── */
function pushToCloud() {
  if (!SYNC_ENABLED || !SYNC_DB || !state.currentUserId) return false;
  if (typeof CLOUD_MODE !== 'undefined' && CLOUD_MODE) return false;
  if (SYNC_PENDING || SYNC_PULLING || !SYNC_PULLED_ONCE) return false;

  SYNC_PENDING = true;

  try {
    var data = { _syncedAt: Date.now(), _version: 1 };

    var prefix = state.currentUserId ? state.currentUserId + ':' : '';
    var rawLength = (typeof __origLS !== 'undefined' && __origLS.length !== undefined) ? __origLS.length : localStorage.length;
    var rawKeyAt = function(i) {
      return (typeof __origLS !== 'undefined' && __origLS.key) ? __origLS.key(i) : localStorage.key(i);
    };
    var rawGet = function(k) {
      return (typeof __origLS !== 'undefined' && __origLS.getItem) ? __origLS.getItem(k) : localStorage.getItem(k);
    };

    for (var i = 0; i < rawLength; i++) {
      var key = rawKeyAt(i);
      if (!key) continue;
      if (prefix) {
        if (key.indexOf(prefix) !== 0) continue;
        key = key.slice(prefix.length);
      } else if (key.indexOf(':') !== -1) {
        continue;
      }
      if (key.indexOf('haven-') !== 0) continue;
      if (key.indexOf('haven-image-') === 0 || key.indexOf('hub-image-') === 0) continue;
      if (key.indexOf('haven-gsi-') === 0) continue;
      if (key === 'haven-device-id' || key === 'haven-device-label') continue;
      if (key === 'haven-synced-at') continue;
      /* Credentials must stay on this device. */
      if (CLOUD_EXCLUDED_KEYS.indexOf(key) !== -1) continue;
      if (key.indexOf('haven-fr24-key-') === 0 || key.indexOf('haven-strava-') === 0) continue;

      try {
        data[key] = JSON.parse(rawGet(prefix + key));
      } catch (e) {
        data[key] = rawGet(prefix + key);
      }
    }

    setSyncStatus('syncing');

    /* auth_uid is the owner column RLS checks; send it so the row is pinned to
       this account and can never overwrite another account's blob. */
    var owner = getCurrentLocalUser();
    var row = {
      user_id: state.currentUserId,
      data: data,
      synced_at: data._syncedAt,
      version: 1
    };
    if (owner && owner.authUid) row.auth_uid = owner.authUid;

    SYNC_DB.from('app_data').upsert(row, { onConflict: 'user_id' }).then(function(res) {
      if (res.error) throw res.error;
      localStorage.setItem('haven-synced-at', String(data._syncedAt));
      setSyncStatus('synced');
      SYNC_PENDING = false;
    }).catch(function(err) {
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

/* ─── User profile sync (profiles table) — powers Friends ── */
function getCurrentLocalUser() {
  if (typeof localUsers === 'undefined' || !Array.isArray(localUsers)) return null;
  if (!state.currentUserId) return null;
  for (var i = 0; i < localUsers.length; i++) {
    if (localUsers[i].id === state.currentUserId) return localUsers[i];
  }
  return null;
}

function syncUserProfileToSupabase() {
  if (!SYNC_ENABLED || !SYNC_DB || !state.currentUserId) return;
  var user = getCurrentLocalUser();
  var uid = state.currentUserId;
  var payload = {
    id: uid,
    display_name: user && user.name ? user.name : 'User',
    photo_url: user && user.picture ? user.picture : '',
    avatar_color: user && user._color ? user._color : '#b4ccbc',
    friend_code: generateFriendCode(uid),
    status: 'online',
    last_seen: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  if (user && user.authUid) payload.auth_uid = user.authUid;
  /* Email is never uploaded — see the note in js/supabase.js. */

  upsertProfileRow(SYNC_DB, payload).then(function(res) {
    if (res.error) console.warn('[sync] Profile sync failed:', res.error);
  }).catch(function(err) {
    console.warn('[sync] Profile sync failed:', err);
  });
}

function setUserPresence(status) {
  if (!SYNC_ENABLED || !SYNC_DB || !state.currentUserId) return;
  var user = getCurrentLocalUser();
  try {
    ownProfileFilter(
      SYNC_DB.from('profiles').update({ status: status, last_seen: new Date().toISOString() }),
      state.currentUserId,
      user && user.authUid ? user.authUid : ''
    ).then(function() {}).catch(function() {});
  } catch (e) {}
}

/* ─── User stats sync (profiles.stats) — powers friend cards ── */
function statDateKey(d) {
  var y = d.getFullYear();
  var m = String(d.getMonth() + 1).padStart(2, '0');
  var day = String(d.getDate()).padStart(2, '0');
  return y + '-' + m + '-' + day;
}

function statDateFromKey(key) {
  var parts = key.split('-');
  return new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
}

function computeUserStats() {
  var stats = { totalTasks: 0, currentStreak: 0, bestStreak: 0, completionRate: 0 };
  try {
    var tasks = [];
    try {
      var tasksRaw = localStorage.getItem('haven-schedule-tasks');
      tasks = tasksRaw ? JSON.parse(tasksRaw) : [];
    } catch (e) {}
    if (!Array.isArray(tasks)) tasks = [];

    var completed = 0;
    for (var i = 0; i < tasks.length; i++) {
      if (tasks[i] && tasks[i].completed) completed++;
    }
    stats.totalTasks = tasks.length;
    stats.completionRate = tasks.length > 0 ? Math.round((completed / tasks.length) * 100) : 0;

    var daySet = {};
    try {
      var logRaw = localStorage.getItem('haven-activities-completions');
      var log = logRaw ? JSON.parse(logRaw) : [];
      if (Array.isArray(log)) {
        for (var j = 0; j < log.length; j++) {
          if (log[j] && log[j].completedAt) {
            var d = new Date(log[j].completedAt);
            if (!isNaN(d.getTime())) daySet[statDateKey(d)] = true;
          }
        }
      }
    } catch (e) {}

    var dayKeys = Object.keys(daySet).sort();
    var now = new Date();
    var todayKey = statDateKey(now);
    var yesterdayKey = statDateKey(new Date(now.getTime() - 86400000));

    var anchor = daySet[todayKey] ? todayKey : (daySet[yesterdayKey] ? yesterdayKey : null);
    if (anchor) {
      var cur = 0;
      var cursor = statDateFromKey(anchor);
      while (daySet[statDateKey(cursor)]) {
        cur++;
        cursor = new Date(cursor.getTime() - 86400000);
      }
      stats.currentStreak = cur;
    }

    var best = 0;
    var run = 0;
    var prevKey = null;
    for (var k = 0; k < dayKeys.length; k++) {
      var expected = null;
      if (prevKey) {
        var prevDate = statDateFromKey(prevKey);
        prevDate.setDate(prevDate.getDate() + 1);
        expected = statDateKey(prevDate);
      }
      if (prevKey && expected === dayKeys[k]) run++;
      else run = 1;
      if (run > best) best = run;
      prevKey = dayKeys[k];
    }
    stats.bestStreak = best;
  } catch (e) {}
  return stats;
}

function syncUserStatsToSupabase() {
  if (!SYNC_ENABLED || !SYNC_DB || !state.currentUserId) return;
  var stats = computeUserStats();
  var user = getCurrentLocalUser();
  var payload = {
    id: state.currentUserId,
    stats: stats,
    last_seen: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  /* Always carry auth_uid: without it this upsert would insert a second,
     ownerless row for the same account instead of updating the real one. */
  if (user && user.authUid) payload.auth_uid = user.authUid;
  try {
    upsertProfileRow(SYNC_DB, payload).then(function(res) {
      if (res.error) console.warn('[sync] Stats sync failed:', res.error);
    }).catch(function(err) {
      console.warn('[sync] Stats sync failed:', err);
    });
  } catch (e) {}
}

/* ─── Watch for data changes via localStorage proxy ─────── */
function onDataChanged(rawKey) {
  if (!SYNC_ENABLED || !state.currentUserId) return;
  if (typeof CLOUD_MODE !== 'undefined' && CLOUD_MODE) { if (typeof cloudSchedulePush === 'function') cloudSchedulePush(); return; }
  if (SYNC_PULLING || !rawKey) return;

  var prefix = state.currentUserId ? state.currentUserId + ':' : '';
  var key = rawKey;
  if (prefix) {
    if (key.indexOf(prefix) !== 0) return;
    key = key.slice(prefix.length);
  } else if (key.indexOf(':') !== -1) {
    return;
  }

  if (key.indexOf('haven-') !== 0) return;
  if (key === 'haven-synced-at') return;
  if (key.indexOf('haven-gsi-') === 0) return;
  if (key.indexOf('haven-image-') === 0 || key.indexOf('hub-image-') === 0) return;

  if (key === 'haven-schedule-tasks' || key === 'haven-activities-completions') {
    SYNC_STATS_DIRTY = true;
  }

  if (SYNC_DEBOUNCE_TIMER) clearTimeout(SYNC_DEBOUNCE_TIMER);
  SYNC_DEBOUNCE_TIMER = setTimeout(function() {
    pushToCloud();
    if (SYNC_STATS_DIRTY) {
      SYNC_STATS_DIRTY = false;
      syncUserStatsToSupabase();
    }
  }, SYNC_DEBOUNCE_MS);
}

/* ─── Wrap localStorage.setItem to detect changes ───────── */
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

/* ─── Sync status indicator ─────────────────────────────── */
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

function reSync() {
  SYNC_PULLED_ONCE = false;
  SYNC_PULLING = false;
  SYNC_ENABLED = false;
  SYNC_DB = null;
  setTimeout(function() { initSync(); }, 500);
}

/* ─── Init on DOM ready ─────────────────────────────────── */
(function() {
  function patchOrigLS() {
    if (typeof __origLS !== 'undefined' && __origLS.setItem && __origLS.setItem.__patched) return;
    if (typeof __origLS !== 'undefined' && __origLS.setItem) {
      var origLSSet = __origLS.setItem;
      var origLSRemove = __origLS.removeItem;
      __origLS.setItem = function(key, value) {
        try { origLSSet(key, value); } catch (e) { return; }
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
