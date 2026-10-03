/* Supabase configuration + shared helpers for the Havën app.
   Loaded AFTER the Supabase CDN bundle and BEFORE gsi.js.
   The publishable (anon) key is safe to ship in the browser — never put a
   secret / service_role key here. */

var SUPABASE_CONFIG = {
  url: 'https://efirdijrhmfhaqlqnfsd.supabase.co',
  anonKey: 'sb_publishable_zD1RT08ZSdpzmpWL03nJ7A_idKHUt8T'
};

var SUPABASE_INITIALIZED = false;
var SUPABASE_DB = null;

function isSupabaseConfigured() {
  if (typeof SUPABASE_CONFIG === 'undefined' || !SUPABASE_CONFIG) return false;
  var url = String(SUPABASE_CONFIG.url || '');
  var key = String(SUPABASE_CONFIG.anonKey || '');
  if (!url || url.indexOf('YOUR-PROJECT-REF') !== -1) return false;
  if (!key || key.indexOf('YOUR-PUBLIC-ANON-KEY') !== -1) return false;
  if (key.indexOf('sb_secret_') === 0) return false;
  return true;
}

function initSupabase() {
  if (SUPABASE_INITIALIZED) return SUPABASE_DB;
  if (typeof window === 'undefined' || !window.supabase || typeof window.supabase.createClient !== 'function') {
    console.warn('[supabase] SDK not loaded');
    return null;
  }
  if (!isSupabaseConfigured()) {
    console.warn('[supabase] SUPABASE_CONFIG is missing the project URL or anon key');
    return null;
  }
  SUPABASE_DB = window.supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
  SUPABASE_INITIALIZED = true;
  return SUPABASE_DB;
}

function getSupabaseDb() {
  if (!SUPABASE_DB) initSupabase();
  return SUPABASE_DB;
}

function supabaseSignOut() {
  var sb = getSupabaseDb();
  if (!sb) return Promise.resolve();
  return sb.auth.signOut().catch(function() {});
}

/* Subscribe to all changes on a table. Returns an unsubscribe function. */
function sbWatch(table, handler) {
  var sb = getSupabaseDb();
  if (!sb) return function() {};
  var channel = sb.channel('haven-' + table + '-' + Math.random().toString(36).slice(2));
  channel.on('postgres_changes', { event: '*', schema: 'public', table: table }, handler).subscribe();
  return function() { try { sb.removeChannel(channel); } catch (e) {} };
}

/* Normalize any timestamp shape (Date | string | number | object) to millis. */
function tsMillis(v) {
  if (!v) return 0;
  if (v instanceof Date) return v.getTime();
  if (typeof v === 'number') return v;
  if (typeof v.toDate === 'function') return v.toDate().getTime();
  if (typeof v.toMillis === 'function') return v.toMillis();
  if (typeof v.seconds === 'number') return v.seconds * 1000;
  var d = new Date(v);
  return isNaN(d.getTime()) ? 0 : d.getTime();
}

/* Normalize a profiles row to the camelCase shape the UI code expects. */
function mapProfileRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    displayName: row.display_name || 'Unknown',
    photoURL: row.photo_url || '',
    avatarColor: row.avatar_color || '#b4ccbc',
    friendCode: row.friend_code || '',
    status: row.status || 'offline',
    statusMessage: row.status_message || '',
    lastSeen: row.last_seen || null,
    stats: row.stats || {},
    email: row.email || ''
  };
}

function generateFriendCode(userId) {
  if (!userId) return 'haven-';
  return 'haven-' + String(userId).slice(-7);
}

/* Upsert a profiles row on the column that actually identifies the account.
   profiles.id is a device-local id (generateId() — random per profile
   creation), so keying on it created a fresh row on every new session or
   device for the same signed-in account. auth_uid is the stable account key
   and is unique; guests have no auth_uid and keep keying on id. */
function upsertProfileRow(db, payload) {
  var target = payload.auth_uid ? 'auth_uid' : 'id';
  return db.from('profiles').upsert(payload, { onConflict: target }).then(function(res) {
    if (!res || !res.error || res.error.code !== '23505' || target !== 'auth_uid') return res;
    return db.from('profiles').upsert(payload, { onConflict: 'id' }).then(function(res2) {
      if (!res2 || !res2.error || res2.error.code !== '23505') return res2;
      var msg = String((res2.error && res2.error.message) || '');
      if (msg.indexOf('friend_code') === -1) return res2;
      var retry = {};
      for (var k in payload) {
        if (Object.prototype.hasOwnProperty.call(payload, k)) retry[k] = payload[k];
      }
      retry.friend_code = generateFriendCode(payload.id + Math.random().toString(36).slice(2, 6));
      return db.from('profiles').upsert(retry, { onConflict: 'id' });
    });
  });
}

/* Upsert the public profile row for a user (powers the Friends page). */
function syncUserToProfile(user) {
  var sb = getSupabaseDb();
  if (!sb || !user || !user.id) return Promise.resolve();
  var payload = {
    id: user.id,
    display_name: user.name || 'User',
    photo_url: user.picture || '',
    avatar_color: user._color || '#b4ccbc',
    friend_code: generateFriendCode(user.id),
    updated_at: new Date().toISOString()
  };
  /* Email deliberately never leaves this device — it lives only in
     haven-gsi-accounts, which is excluded from sync. */
  if (user.authUid) payload.auth_uid = user.authUid;
  return upsertProfileRow(sb, payload)
    .then(function(res) { if (res.error) console.warn('[supabase] syncUser failed:', res.error); })
    .catch(function(e) { console.warn('[supabase] syncUser error:', e); });
}

/* Filter for the caller's own profile row: auth_uid when the profile is tied
   to a Supabase account, the device-local id otherwise. */
function ownProfileFilter(q, userId, authUid) {
  return authUid ? q.eq('auth_uid', authUid) : q.eq('id', userId);
}

function updateUserStatus(userId, status, authUid) {
  var sb = getSupabaseDb();
  if (!sb || !userId) return Promise.resolve();
  try {
    return ownProfileFilter(
      sb.from('profiles').update({ status: status, last_seen: new Date().toISOString() }),
      userId,
      authUid || ''
    ).then(function() {}).catch(function() {});
  } catch (e) { return Promise.resolve(); }
}

function removeUserFromProfile(userId, authUid) {
  var sb = getSupabaseDb();
  if (!sb || !userId) return Promise.resolve();
  try {
    return ownProfileFilter(
      sb.from('profiles').delete(),
      userId,
      authUid || ''
    ).then(function() {}).catch(function() {});
  } catch (e) { return Promise.resolve(); }
}
