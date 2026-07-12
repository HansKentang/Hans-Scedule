// ─── Auth (Firebase + local fallback) ────────────────
var AUTH_USERS_KEY = 'haven-gsi-accounts';
var AUTH_ACTIVE_KEY = 'haven-gsi-active';
var localUsers = [];
var authInitialized = false;

function loadUsers() {
  try { localUsers = JSON.parse(localStorage.getItem(AUTH_USERS_KEY) || '[]'); } catch (e) { localUsers = []; }
}

function saveUsers() {
  localStorage.setItem(AUTH_USERS_KEY, JSON.stringify(localUsers));
}

function getActiveUserId() {
  try { return localStorage.getItem(AUTH_ACTIVE_KEY); } catch (e) { return null; }
}

function setActiveUserId(id) {
  if (id) localStorage.setItem(AUTH_ACTIVE_KEY, id);
  else localStorage.removeItem(AUTH_ACTIVE_KEY);
}

// Initialize currentUserId synchronously BEFORE any page scripts call loadState()
// so that the localStorage key prefix (used by shared.js's IIFE wrapper) is correct
loadUsers();
var _activeId = getActiveUserId();
if (typeof state !== 'undefined') {
  state.currentUserId = _activeId || null;
}

function generateId() {
  return 'u' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

function getInitials(name) {
  return name.trim().split(/\s+/).slice(0, 2).map(function(s) { return s[0]; }).join('').toUpperCase() || '?';
}

function getColorForId(id) {
  var colors = ['#b4ccbc','#c4a4c8','#c8b88a','#a4c8c4','#c8a4a4','#a4b4c8','#b8c8a4','#c8b4a4'];
  var hash = 0;
  for (var i = 0; i < id.length; i++) hash = ((hash << 5) - hash) + id.charCodeAt(i);
  return colors[Math.abs(hash) % colors.length];
}

function renderAuthUI() {
  var container = document.getElementById('gsiContainer');
  if (!container) return;
  var activeId = getActiveUserId();
  var activeUser = localUsers.find(function(u) { return u.id === activeId; });

  if (activeUser) {
    var initials = getInitials(activeUser.name);
    var color = activeUser._color || getColorForId(activeUser.id);
    var avatarHtml = activeUser.picture
      ? '<img class="gsi-avatar" src="' + activeUser.picture + '" alt="' + escapeHtml(activeUser.name) + '">'
      : '<div class="gsi-avatar gsi-avatar-local" style="background:' + color + '"><span class="gsi-avatar-initials">' + escapeHtml(initials) + '</span></div>';
    var maxVisible = 3;
    var visibleUsers = localUsers.slice(0, maxVisible);
    var dropdownItems = visibleUsers.map(function(u) {
      var i2 = getInitials(u.name);
      var c2 = u._color || getColorForId(u.id);
      var icon = u.picture
        ? '<img class="gsi-dd-avatar" src="' + u.picture + '" alt="">'
        : '<span class="gsi-dd-initials" style="background:' + c2 + '">' + escapeHtml(i2) + '</span>';
      return '<div class="gsi-dd-item' + (u.id === activeId ? ' active' : '') + '" data-gsi-switch="' + u.id + '">' +
        icon + '<span class="gsi-dd-name">' + escapeHtml(u.name) + '</span></div>';
    }).join('');
    var extraCount = localUsers.length - maxVisible;
    if (extraCount > 0) {
      dropdownItems +=
        '<div class="gsi-dd-item" id="gsiViewAllAccounts"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg><span>View all accounts &rarr;</span></div>';
    }

    container.innerHTML =
      '<div class="gsi-avatar-wrap">' + avatarHtml +
        '<div class="gsi-avatar-name">' + escapeHtml(activeUser.name) + '</div>' +
        '<div class="gsi-avatar-dropdown" id="gsiDropdown">' +
          dropdownItems +
          '<div class="gsi-dd-divider"></div>' +
          (localUsers.length < maxVisible ? '<div class="gsi-dd-item" id="gsiAddAccountBtn"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg><span>Add account</span></div>' : '') +
          '<div class="gsi-dd-item danger" id="gsiSignOutBtn"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg><span>Remove profile</span></div>' +
        '</div></div>';

    var avatar = container.querySelector('.gsi-avatar, .gsi-avatar-local');
    var dropdown = container.querySelector('#gsiDropdown');
    avatar.addEventListener('click', function(e) {
      e.stopPropagation();
      dropdown.classList.toggle('open');
    });
    dropdown.querySelectorAll('[data-gsi-switch]').forEach(function(el) {
      el.addEventListener('click', function() { switchAccount(el.dataset.gsiSwitch); });
    });
    var addBtn = container.querySelector('#gsiAddAccountBtn');
    if (addBtn) {
      addBtn.addEventListener('click', function(e) {
        e.stopPropagation(); dropdown.classList.remove('open');
        gsiSignIn();
      });
    }
    var viewAllBtn = container.querySelector('#gsiViewAllAccounts');
    if (viewAllBtn) {
      viewAllBtn.addEventListener('click', function(e) {
        e.stopPropagation(); dropdown.classList.remove('open');
        if (typeof openSettingsBubble === 'function') {
          settingsPanelActiveCategory = 'account';
          openSettingsBubble();
        }
      });
    }
    container.querySelector('#gsiSignOutBtn').addEventListener('click', function(e) {
      e.stopPropagation(); dropdown.classList.remove('open');
      removeProfile(activeId);
    });
    var existing = document._gsiOutsideClick;
    if (existing) document.removeEventListener('click', existing);
    document._gsiOutsideClick = function(e) {
      var dd = document.getElementById('gsiDropdown');
      if (dd && !dd.contains(e.target) && !e.target.closest('.gsi-avatar') && !e.target.closest('.gsi-avatar-local')) dd.classList.remove('open');
    };
    document.addEventListener('click', document._gsiOutsideClick);
  } else if (isGuestMode()) {
    container.innerHTML =
      '<div class="gsi-avatar-wrap" style="cursor:default">' +
        '<div class="gsi-avatar gsi-avatar-local" style="background:var(--text-tertiary);opacity:0.5"><span class="gsi-avatar-initials" style="font-size:0.45rem">?</span></div>' +
        '<div class="gsi-avatar-name" style="opacity:0.5">Guest</div>' +
        '<div class="gsi-avatar-dropdown" id="gsiDropdown">' +
          '<div class="gsi-dd-item danger" id="gsiGuestSignOut">' +
            '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>' +
            '<span>Sign out</span>' +
          '</div>' +
        '</div></div>';
    var avatar = container.querySelector('.gsi-avatar-local');
    var dropdown = container.querySelector('#gsiDropdown');
    avatar.addEventListener('click', function(e) {
      e.stopPropagation();
      dropdown.classList.toggle('open');
    });
    container.querySelector('#gsiGuestSignOut').addEventListener('click', function(e) {
      e.stopPropagation(); dropdown.classList.remove('open');
      guestSignOut();
    });
    var existing = document._gsiOutsideClick;
    if (existing) document.removeEventListener('click', existing);
    document._gsiOutsideClick = function(e) {
      var dd = document.getElementById('gsiDropdown');
      if (dd && !dd.contains(e.target) && !e.target.closest('.gsi-avatar-local')) dd.classList.remove('open');
    };
    document.addEventListener('click', document._gsiOutsideClick);
  } else {
    container.innerHTML =
      '<div class="gsi-signin-wrap"><div id="gsiButton" class="gsi-signin-btn">' +
        '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>' +
        '<span>Create profile</span></div></div>';
    container.querySelector('#gsiButton').addEventListener('click', gsiSignIn);
  }
}

function gsiSignIn() {
  location.href = 'login.html';
}

function guestSignOut() {
  sessionStorage.removeItem('haven-guest');
  location.href = 'login.html';
}

// ─── Firebase Firestore sync ───────────────────────────
function syncProfileToFirestore(user) {
  if (typeof syncUserToFirestore === 'function') {
    syncUserToFirestore(user).catch(function() {});
  }
}

function removeProfileFromFirestore(id) {
  if (typeof removeUserFromFirestore === 'function') {
    removeUserFromFirestore(id).catch(function() {});
  }
}

// ─── Firebase Google Sign-In ──────────────────────────
var FIREBASE_CONFIG = {
  apiKey: "AIzaSyDhGJuLw9TW7i6GUQkhVQwOSRkX4nAoS8g",
  authDomain: "haven-schedule-c8fec.firebaseapp.com",
  projectId: "haven-schedule-c8fec",
  storageBucket: "haven-schedule-c8fec.firebasestorage.app",
  messagingSenderId: "372760068715",
  appId: "1:372760068715:web:e18957b41d42b727ab272e"
};

function firebaseSignIn() {
  if (typeof firebase === 'undefined') { showToast('Firebase SDK not loaded. Refresh the page.', 'error', 4000); return; }
  if (!firebase.apps.length) firebase.initializeApp(FIREBASE_CONFIG);
  var provider = new firebase.auth.GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  firebase.auth().signInWithPopup(provider)
    .then(function(result) { handleFirebaseUser(result.user); })
    .catch(function(error) {
      if (error.code !== 'auth/popup-closed-by-user') {
        showToast('Sign-in failed: ' + error.message, 'error', 4000);
      }
    });
}

function handleFirebaseUser(fbUser) {
  if (!fbUser) return;
  var uid = fbUser.uid;
  var existing = localUsers.find(function(u) { return u.id === 'firebase-' + uid; });
  if (existing) { switchAccount(existing.id); return; }
  var user = {
    id: 'firebase-' + uid,
    name: fbUser.displayName || fbUser.email || 'User',
    email: fbUser.email || '',
    picture: fbUser.photoURL || '',
    _color: getColorForId('firebase-' + uid)
  };
  recordDeviceAccess(user);
  localUsers.push(user);
  saveUsers();
  setActiveUserId(user.id);
  if (typeof state !== 'undefined') state.currentUserId = user.id;
  migrateExistingData(user.id);
  renderAuthUI();
  // Sync user profile to Firestore for the friend system
  syncProfileToFirestore(user);
  showToast('Signed in as ' + user.name, 'info', 2000);
  if (isLoginPage()) location.href = 'index.html';
  else location.reload();
}

// ─── Local profile ────────────────────────────────────
function createLocalProfile(name) {
  if (!name || !name.trim()) return;
  name = name.trim();
  var user = { id: generateId(), name: name, _color: getColorForId(generateId()) };
  recordDeviceAccess(user);
  localUsers.push(user);
  saveUsers();
  setActiveUserId(user.id);
  if (typeof state !== 'undefined') state.currentUserId = user.id;
  renderAuthUI();
  // Sync local profile to Firestore for the friend system
  syncProfileToFirestore(user);
  if (isLoginPage()) location.href = 'index.html';
  else location.reload();
}

function switchAccount(id) {
  var user = localUsers.find(function(u) { return u.id === id; });
  if (!user) return;
  recordDeviceAccess(user);
  setActiveUserId(id);
  if (typeof state !== 'undefined') state.currentUserId = id;
  renderAuthUI();
  // Sync the switched-to profile to Firestore
  syncProfileToFirestore(user);
  showToast('Switched to ' + user.name, 'info', 1500);
  location.reload();
}

function removeProfile(id) {
  var user = localUsers.find(function(u) { return u.id === id; });
  if (!user) return;
  if (!confirm('Remove "' + user.name + '" and all their data?')) return;
  var prefix = user.id + ':';
  for (var i = 0; i < __origLS.length; i++) {
    var key = __origLS.key(i);
    if (key && key.indexOf(prefix) === 0) __origLS.removeItem(key);
  }
  localUsers = localUsers.filter(function(u) { return u.id !== id; });
  saveUsers();
  // Remove user profile from Firestore
  removeProfileFromFirestore(id);
  var active = getActiveUserId();
  if (active === id) {
    if (localUsers.length > 0) {
      setActiveUserId(localUsers[0].id);
      if (typeof state !== 'undefined') state.currentUserId = localUsers[0].id;
    } else {
      setActiveUserId(null);
      if (typeof state !== 'undefined') state.currentUserId = null;
    }
  }
  renderAuthUI();
  showToast('Profile removed', 'info', 1500);
  location.reload();
}

function migrateExistingData(id) {
  var prefix = id + ':';
  for (var i = 0; i < __origLS.length; i++) {
    var key = __origLS.key(i);
    if (key && key.indexOf('haven-') === 0 && key.indexOf('haven-gsi-') !== 0 && key.indexOf(prefix) !== 0) {
      var val = __origLS.getItem(key);
      if (val) __origLS.setItem(prefix + key, val);
    }
  }
}

function initGSI() {
  // Initialize Firestore for the friend system
  if (typeof initFirestore === 'function') {
    initFirestore();
  }
  loadUsers();
  var activeId = getActiveUserId();
  if (typeof state !== 'undefined') {
    state.currentUserId = activeId || null;
    state.localUsers = localUsers;
  }
  renderAuthUI();
  authInitialized = true;

  if (isLoginPage()) {
    if (activeId) { location.href = 'index.html'; return; }
    return;
  }

  if (!activeId && !isGuestMode()) {
    location.href = 'login.html';
    return;
  }

  // Initialize chat badge for unread message count
  // Initialize chat badge for unread message count
  if (typeof initChatBadge === 'function') {
    initChatBadge();
  }
}

function isLoginPage() {
  return location.pathname.indexOf('login.html') !== -1;
}

function isGuestMode() {
  return sessionStorage.getItem('haven-guest') === '1';
}

// ─── Device helpers ─────────────────────────
var _deviceId = null;
var _deviceLabel = null;
function getDeviceId() {
  if (_deviceId) return _deviceId;
  var d = null;
  try { d = localStorage.getItem('haven-device-id'); } catch (e) {}
  if (!d) { d = 'dev' + Date.now().toString(36) + Math.random().toString(36).slice(2,6); try { localStorage.setItem('haven-device-id', d); } catch (e) { sessionStorage.setItem('haven-device-id', d); } }
  _deviceId = d;
  return d;
}
function getDeviceLabel() {
  if (_deviceLabel) return _deviceLabel;
  var stored = null;
  try { stored = localStorage.getItem('haven-device-label'); } catch (e) {}
  if (!stored) { try { stored = sessionStorage.getItem('haven-device-label'); } catch (e) {} }
  if (stored) { _deviceLabel = stored; return stored; }
  var ua = navigator.userAgent;
  var label = 'Unknown Device';
  if (/Windows/.test(ua)) label = 'Windows PC';
  else if (/iPad/.test(ua)) label = 'iPad';
  else if (/iPhone/.test(ua)) label = 'iPhone';
  else if (/Android/.test(ua)) label = 'Android';
  else if (/Mac/.test(ua)) label = 'Mac';
  else if (/Linux/.test(ua)) label = 'Linux';
  label += ' — ' + window.screen.width + '\u00D7' + window.screen.height;
  if (typeof safeSetItem === 'function') safeSetItem('haven-device-label', label);
  else { try { localStorage.setItem('haven-device-label', label); } catch (e) { try { sessionStorage.setItem('haven-device-label', label); } catch (e2) {} } }
  _deviceLabel = label;
  return label;
}
function recordDeviceAccess(user) {
  if (!user) return;
  var id = getDeviceId();
  var label = getDeviceLabel();
  user._devices = user._devices || {};
  user._devices[id] = { label: label, lastUsed: new Date().toISOString() };
  saveUsers();
}

// ─── Settings Panel (Discord-style) ──────────
var settingsPanelActiveCategory = 'account';
var _settingsEscHandler = null;

function openSettingsBubble() {
  if (document.getElementById('settingsOverlay')) return;

  var overlay = document.createElement('div');
  overlay.className = 'settings-overlay';
  overlay.id = 'settingsOverlay';

  var panel = document.createElement('div');
  panel.className = 'settings-panel';
  panel.id = 'settingsPanel';

  panel.innerHTML =
    '<div class="settings-panel-header">' +
      '<h2>Settings</h2>' +
      '<button class="settings-close-btn" id="settingsCloseBtn"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>' +
    '</div>' +
    '<div class="settings-body">' +
      '<nav class="settings-nav" id="settingsNav"></nav>' +
      '<div class="settings-content" id="settingsBubbleContent"></div>' +
    '</div>';

  document.body.appendChild(overlay);
  document.body.appendChild(panel);

  renderSettingsNav();
  switchSettingsCategory(settingsPanelActiveCategory);

  _settingsEscHandler = function(e) { if (e.key === 'Escape') closePanel(); };
  document.addEventListener('keydown', _settingsEscHandler);
  overlay.addEventListener('click', closePanel);
  document.getElementById('settingsCloseBtn').addEventListener('click', closePanel);

  function closePanel() {
    var o = document.getElementById('settingsOverlay');
    var p = document.getElementById('settingsPanel');
    if (o) o.remove(); if (p) p.remove();
    if (_settingsEscHandler) { document.removeEventListener('keydown', _settingsEscHandler); _settingsEscHandler = null; }
  }
}

var _adminTabRevealed = false;
var _adminClickCount = 0;
var _adminClickTimer = null;

function revealAdminTab() {
  _adminTabRevealed = true;
  var nav = document.getElementById('settingsNav');
  if (!nav) { renderSettingsNav(); return; }
  var existing = nav.querySelector('[data-cat="admin"]');
  if (existing) return;
  var adminItem = document.createElement('div');
  adminItem.className = 'settings-nav-item';
  adminItem.dataset.cat = 'admin';
  adminItem.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg><span>Admin</span>';
  adminItem.addEventListener('click', function() {
    var cat = adminItem.dataset.cat;
    if (!cat || cat === settingsPanelActiveCategory) return;
    settingsPanelActiveCategory = cat;
    nav.querySelectorAll('.settings-nav-item').forEach(function(i) { i.classList.remove('active'); });
    adminItem.classList.add('active');
    switchSettingsCategory(cat);
  });
  nav.appendChild(adminItem);
  showToast('Admin panel unlocked', 'success', 1500);
}

function renderSettingsNav() {
  var nav = document.getElementById('settingsNav');
  if (!nav) return;
  var cats = [
    { id: 'account', label: t('settings.account'), icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>' },
    { id: 'appearance', label: t('settings.appearance'), icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/></svg>' },
    { id: 'ai', label: t('settings.ai'), icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a4 4 0 014 4c0 2-2 3-2 3h-4s-2-1-2-3a4 4 0 014-4z"/><path d="M8 15h8v2a2 2 0 01-2 2h-4a2 2 0 01-2-2v-2z"/><line x1="12" y1="19" x2="12" y2="22"/></svg>' },
    { id: 'data', label: t('settings.data'), icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>' },
    { id: 'about', label: t('settings.about'), icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>' }
  ];
  // If admin was already revealed, include it
  if (_adminTabRevealed) {
    cats.push({ id: 'admin', label: 'Admin', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>' });
  }
  nav.innerHTML = cats.map(function(c) {
    return '<div class="settings-nav-item' + (c.id === settingsPanelActiveCategory ? ' active' : '') + '" data-cat="' + c.id + '">' + c.icon + '<span>' + c.label + '</span></div>';
  }).join('');
  nav.querySelectorAll('.settings-nav-item').forEach(function(el) {
    el.addEventListener('click', function() {
      var cat = el.dataset.cat;
      if (!cat || cat === settingsPanelActiveCategory) return;
      settingsPanelActiveCategory = cat;
      nav.querySelectorAll('.settings-nav-item').forEach(function(i) { i.classList.remove('active'); });
      el.classList.add('active');
      switchSettingsCategory(cat);
    });
  });
}

function switchSettingsCategory(cat) {
  var content = document.getElementById('settingsBubbleContent');
  if (!content) return;
  settingsPanelActiveCategory = cat;
  switch (cat) {
    case 'account': renderAccountSettings(content); break;
    case 'appearance': renderAppearanceSettings(content); break;
    case 'ai': renderAISettings(content); break;
    case 'data': renderDataSettings(content); break;
    case 'admin': renderAdminSettings(content); break;
    case 'about': renderAboutSettings(content); break;
  }
}

function renderAdminSettings(el) {
  var presets = typeof loadAdminPresets === 'function' ? loadAdminPresets() : [];
  var activeId = typeof getActivePresetId === 'function' ? getActivePresetId() : null;
  var presetsHtml = presets.length === 0
    ? '<div class="set-empty" style="padding:12px 0;font-size:0.78rem;color:var(--text-tertiary)">No presets saved yet. Press <kbd style="padding:1px 5px;background:var(--accent-soft);border-radius:3px;font-family:var(--font-family);font-size:0.7rem">Ctrl+Shift+D</kbd> on the hub page to save the current layout as a preset.</div>'
    : presets.map(function(p) {
        var isActive = p.id === activeId;
        var dateStr = p.updatedAt ? new Date(p.updatedAt).toLocaleDateString() : '';
        return '<div class="set-acc-item' + (isActive ? ' active' : '') + '" style="flex-wrap:wrap">' +
          '<div class="set-acc-initials" style="background:' + (isActive ? 'var(--accent)' : 'var(--surface-container-high)') + '">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" style="width:12px;height:12px"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>' +
          '</div>' +
          '<div class="set-acc-info" style="flex:1">' +
            '<div class="set-acc-name">' + escapeHtml(p.name) + '</div>' +
            '<div class="set-acc-email">' + dateStr + ' &middot; ' + (p.data && p.data.hubContent && p.data.hubContent.bentoLayout ? p.data.hubContent.bentoLayout.length + ' widgets' : 'no data') + '</div>' +
          '</div>' +
          '<div style="display:flex;gap:4px;align-items:center;flex-shrink:0;width:100%;margin-top:6px;padding-left:36px">' +
            (isActive
              ? '<button class="set-btn set-btn-small admin-preset-active" disabled style="font-size:0.6rem;padding:2px 8px;background:var(--accent);color:var(--text-inverse);border:none;border-radius:4px">Active</button>'
              : '<button class="set-btn set-btn-small" data-admin-activate="' + p.id + '" style="font-size:0.6rem;padding:2px 8px">Set Active</button>') +
            '<button class="set-btn set-btn-small" data-admin-apply="' + p.id + '" style="font-size:0.6rem;padding:2px 8px">Apply</button>' +
            '<button class="set-btn set-btn-small" data-admin-delete="' + p.id + '" style="font-size:0.6rem;padding:2px 8px;color:var(--danger,#ef4444)">Delete</button>' +
          '</div>' +
        '</div>';
      }).join('');

  el.innerHTML =
    '<h3>Admin</h3>' +
    '<div class="set-desc">Manage default layouts for new and guest users</div>' +
    '<div class="set-group">' +
      '<div class="set-row">' +
        '<div class="set-row-left"><div class="set-row-label">Save Current Layout as Preset</div><div class="set-row-desc">Capture the current hub layout, categories, tags, and settings</div></div>' +
        '<button class="set-btn" id="adminSavePresetBtn">Save Preset</button>' +
      '</div>' +
      '<div class="set-row">' +
        '<div class="set-row-left"><div class="set-row-label">Password</div><div class="set-row-desc">Change the admin password used to manage presets</div></div>' +
        '<button class="set-btn" id="adminChangePasswordBtn">Change</button>' +
      '</div>' +
    '</div>' +
    '<div class="set-divider"></div>' +
    '<div class="set-group">' +
      '<div class="set-row-label" style="font-size:0.72rem;color:var(--text-tertiary);margin-bottom:6px">PRESETS' +
      (presets.length > 0 ? ' <span style="font-size:0.6rem;padding:1px 6px;border-radius:8px;background:var(--accent-soft);margin-left:4px">' + presets.length + '</span>' : '') +
      '</div>' +
      presetsHtml +
      (presets.length > 0 ? '<button class="set-link-btn" id="adminClearActiveBtn" style="margin-top:6px">Clear Active Preset</button>' : '') +
    '</div>';

  // Wire events
  document.getElementById('adminSavePresetBtn')?.addEventListener('click', function() {
    var name = prompt('Enter a name for this preset:');
    if (name && typeof savePreset === 'function') savePreset(name.trim());
  });
  document.getElementById('adminChangePasswordBtn')?.addEventListener('click', function() {
    if (typeof changeAdminPassword === 'function') changeAdminPassword();
  });
  document.getElementById('adminClearActiveBtn')?.addEventListener('click', function() {
    if (typeof clearActivePreset === 'function') clearActivePreset();
  });
  el.querySelectorAll('[data-admin-activate]').forEach(function(btn) {
    btn.addEventListener('click', function() {
      if (typeof setActivePreset === 'function') setActivePreset(btn.dataset.adminActivate);
    });
  });
  el.querySelectorAll('[data-admin-apply]').forEach(function(btn) {
    btn.addEventListener('click', function() {
      if (typeof applyPresetToCurrentUser === 'function') applyPresetToCurrentUser(btn.dataset.adminApply);
    });
  });
  el.querySelectorAll('[data-admin-delete]').forEach(function(btn) {
    btn.addEventListener('click', function() {
      if (typeof deletePreset === 'function') deletePreset(btn.dataset.adminDelete);
    });
  });
}

function renderAccountSettings(el) {
  var activeId = getActiveUserId();
  var activeUser = localUsers.find(function(u) { return u.id === activeId; });
  var guest = isGuestMode();
  var tz = typeof Intl !== 'undefined' ? Intl.DateTimeFormat().resolvedOptions().timeZone : '—';
  var savedLang = 'en'; try { savedLang = localStorage.getItem('haven-language') || 'en'; } catch(e) {}
  var savedWeekStart = 'monday'; try { savedWeekStart = localStorage.getItem('haven-week-start') || 'monday'; } catch(e) {}
  var savedTimeFormat = '12h'; try { savedTimeFormat = localStorage.getItem('haven-time-format') || '12h'; } catch(e) {}

  // Avatar + profile fields
  var avatarHtml = '';
  var connectedHtml = '';
  if (guest) {
    avatarHtml = '<div class="set-avatar-initials" style="background:var(--text-tertiary);opacity:0.5">?</div>' +
      '<div class="set-avatar-info" style="flex:1">' +
      '<div class="set-acc-name" style="opacity:0.5;margin-bottom:4px">Guest</div>' +
      '</div>';
  } else if (activeUser) {
    var initials = getInitials(activeUser.name);
    var color = activeUser._color || getColorForId(activeUser.id);
    var img = activeUser.picture ? '<img class="set-avatar set-avatar-clickable" id="accAvatarImg" src="' + escapeHtml(activeUser.picture) + '">' : '<div class="set-avatar-initials set-avatar-clickable" id="accAvatarImg" style="background:' + color + '">' + escapeHtml(initials) + '</div>';
    // Build device label inline
    var deviceText = '';
    try {
      var ua = navigator.userAgent;
      var dLabel = 'Unknown Device';
      if (/Windows/.test(ua)) dLabel = 'Windows PC';
      else if (/iPad/.test(ua)) dLabel = 'iPad';
      else if (/iPhone/.test(ua)) dLabel = 'iPhone';
      else if (/Android/.test(ua)) dLabel = 'Android';
      else if (/Mac/.test(ua)) dLabel = 'Mac';
      else if (/Linux/.test(ua)) dLabel = 'Linux';
      dLabel += ' \u2014 ' + (window.screen ? window.screen.width + 'x' + window.screen.height : '');
      deviceText = dLabel;
    } catch (e) { deviceText = 'Unknown Device'; }
    avatarHtml = img +
      '<div class="set-avatar-info" style="flex:1">' +
      '<input class="set-input set-input-full" id="accName" value="' + escapeHtml(activeUser.name || '') + '" placeholder="Name" style="margin-bottom:3px">' +
      '<input class="set-input set-input-full" id="accEmail" value="' + escapeHtml(activeUser.email || '') + '" placeholder="Email (optional)">' +
      '</div>' +
      '<button class="set-btn" id="accProfileSave" style="align-self:flex-start">Save</button>';
    var connectedHtml = '<div class="set-acc-connected"><svg viewBox="0 0 24 24" width="10" height="10" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" style="flex-shrink:0"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>Connected to <span class="set-acc-connected-device">' + escapeHtml(deviceText) + '</span></div>';
  } else {
    avatarHtml = '<div style="font-size:0.78rem;color:var(--text-tertiary);padding:6px 0">No profile selected</div>';
  }

  // Account list
  var currentDeviceId = getDeviceId();
  var listHtml = localUsers.map(function(u) {
    var isActive = u.id === activeId;
    var init = getInitials(u.name);
    var col = u._color || getColorForId(u.id);
    var av = u.picture ? '<img class="set-acc-avatar" src="' + escapeHtml(u.picture) + '">' : '<div class="set-acc-initials" style="background:' + col + '">' + escapeHtml(init) + '</div>';
    var devicesHtml = '';
    if (u._devices) {
      var labels = Object.keys(u._devices).map(function(did) {
        var d = u._devices[did];
        var prefix = did === currentDeviceId ? 'This device — ' : '';
        return prefix + escapeHtml(d.label);
      });
      if (labels.length) devicesHtml = '<div class="set-acc-devices">' + labels.join('<br>') + '</div>';
    }
    return '<div class="set-acc-item' + (isActive ? ' active' : '') + '" data-acc-id="' + u.id + '">' +
      av +
      '<div class="set-acc-info"><div class="set-acc-name">' + escapeHtml(u.name) + '</div>' + (u.email ? '<div class="set-acc-email">' + escapeHtml(u.email) + '</div>' : '') + devicesHtml + '</div>' +
      (!isActive ? '<button class="set-acc-remove" data-acc-remove="' + u.id + '">\u2715</button>' : '') +
    '</div>';
  }).join('');

  if (guest) {
    listHtml += '<div class="set-acc-item"><div class="set-acc-initials" style="background:var(--text-tertiary);opacity:0.5">?</div><div class="set-acc-info"><div class="set-acc-name" style="opacity:0.5">Guest</div></div></div>';
  }


  el.innerHTML =
    '<h3>My Account</h3>' +
    // Editable profile
    '<div class="set-group">' +
      '<div class="set-avatar-row">' + avatarHtml + '</div>' +
      (connectedHtml || '') +
    '</div>' +
    '<div class="set-divider"></div>' +
    // Preferences
    '<div class="set-group">' +
      '<div class="set-row-label" style="font-size:0.72rem;color:var(--text-tertiary);margin-bottom:4px">PREFERENCES</div>' +
      '<div class="set-row">' +
        '<div class="set-row-left"><div class="set-row-label">Language</div><div class="set-row-desc">UI language</div></div>' +
        '<div class="set-row-control"><select class="set-select" id="accLang"><option value="en">' + t('lang.en') + '</option><option value="id">' + t('lang.id') + '</option><option value="zh">' + t('lang.zh') + '</option></select></div>' +
      '</div>' +
      '<div class="set-row">' +
        '<div class="set-row-left"><div class="set-row-label">Timezone</div><div class="set-row-desc">Detected from browser</div></div>' +
        '<div class="set-row-control"><div class="set-readonly">' + escapeHtml(tz) + '</div></div>' +
      '</div>' +
      '<div class="set-row">' +
        '<div class="set-row-left"><div class="set-row-label">Week starts on</div></div>' +
        '<div class="set-row-control"><select class="set-select" id="accWeekStart"><option value="monday">Monday</option><option value="sunday">Sunday</option></select></div>' +
      '</div>' +
      '<div class="set-row">' +
        '<div class="set-row-left"><div class="set-row-label">Time format</div></div>' +
        '<div class="set-row-control"><select class="set-select" id="accTimeFormat"><option value="12h">12h</option><option value="24h">24h</option></select></div>' +
      '</div>' +
    '</div>' +
    '<div class="set-divider"></div>' +
    // Data & Privacy
    '<div class="set-group">' +
      '<div class="set-row-label" style="font-size:0.72rem;color:var(--text-tertiary);margin-bottom:4px">DATA & PRIVACY</div>' +
      '<div class="set-row">' +
        '<div class="set-row-left"><div class="set-row-label">Export</div><div class="set-row-desc">Download all your data as JSON</div></div>' +
        '<button class="set-btn" id="accExport">Export</button>' +
      '</div>' +
      '<div class="set-row">' +
        '<div class="set-row-left"><div class="set-row-label" style="color:var(--danger,#ef4444)">Delete all data</div><div class="set-row-desc">Permanently remove everything</div></div>' +
        '<button class="set-btn" id="accDeleteAll" style="color:var(--danger,#ef4444);border-color:color-mix(in srgb, var(--danger,#ef4444) 40%, transparent)">Delete</button>' +
      '</div>' +
    '</div>' +
    '<div class="set-divider"></div>' +
    // Switch Account
    '<div class="set-group">' +
      '<div class="set-row-label" style="font-size:0.72rem;color:var(--text-tertiary);margin-bottom:6px">SWITCH ACCOUNT' +
      (localUsers.length > 0 ? ' <span class="set-acc-device-count">' + localUsers.length + '</span>' : '') +
      '</div>' +
      listHtml +
      '<button class="set-link-btn" id="setAddGoogle"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="8" r="4"/><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/></svg>Sign in with Google</button>' +
      '<button class="set-link-btn" id="setAddLocal"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>Add local profile</button>' +
    '</div>' +
    '<div class="set-divider"></div>' +
    // Sign out
    '<div class="set-logout">' +
      '<button class="set-btn set-btn-danger" id="setSignOut">Sign Out</button>' +
    '</div>';
  // Set saved values
  document.getElementById('accLang').value = savedLang;
  document.getElementById('accWeekStart').value = savedWeekStart;
  document.getElementById('accTimeFormat').value = savedTimeFormat;

  // Profile save
  document.getElementById('accProfileSave')?.addEventListener('click', function() {
    if (!activeUser) return;
    var name = document.getElementById('accName')?.value?.trim();
    if (!name) { if (typeof showToast === 'function') showToast('Name is required', 'error'); return; }
    var email = document.getElementById('accEmail')?.value?.trim() || '';
    activeUser.name = name;
    activeUser.email = email;
    saveUsers();
    if (typeof showToast === 'function') showToast('Profile updated');
  });

  // Avatar change
  document.getElementById('accAvatarImg')?.addEventListener('click', function() {
    var url = prompt('Enter image URL for your avatar:');
    if (!url || !activeUser) return;
    activeUser.picture = url.trim();
    saveUsers();
    // Re-render
    renderAccountSettings(el);
  });

  // Preferences save on change
  document.getElementById('accLang')?.addEventListener('change', function() {
    if (typeof safeSetItem === 'function') safeSetItem('haven-language', this.value);
    else try { localStorage.setItem('haven-language', this.value); } catch (e) {}
    if (typeof applyLanguage === 'function') applyLanguage(this.value);
  });
  document.getElementById('accWeekStart')?.addEventListener('change', function() {
    if (typeof safeSetItem === 'function') safeSetItem('haven-week-start', this.value);
    else try { localStorage.setItem('haven-week-start', this.value); } catch (e) {}
  });
  document.getElementById('accTimeFormat')?.addEventListener('change', function() {
    if (typeof safeSetItem === 'function') safeSetItem('haven-time-format', this.value);
    else try { localStorage.setItem('haven-time-format', this.value); } catch (e) {}
  });

  // Export
  document.getElementById('accExport')?.addEventListener('click', function() {
    if (typeof exportAllData === 'function') { exportAllData(); return; }
    // Fallback: collect all storage keys
    var data = {};
    for (var i = 0; i < localStorage.length; i++) {
      var k = localStorage.key(i);
      if (k && k.startsWith('haven-')) {
        try { data[k] = JSON.parse(localStorage.getItem(k)); } catch (e) { try { data[k] = localStorage.getItem(k); } catch(e2) { data[k] = null; } }
      }
    }
    var blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'haven-data-' + new Date().toISOString().slice(0, 10) + '.json';
    a.click();
    URL.revokeObjectURL(a.href);
    if (typeof showToast === 'function') showToast('Data exported');
  });

  // Delete all data
  document.getElementById('accDeleteAll')?.addEventListener('click', function() {
    if (!confirm('This will permanently delete ALL your data (tasks, habits, goals, finance, gallery, settings).\n\nThis cannot be undone. Are you sure?')) return;
    if (!confirm('Really delete everything? Type "yes" to confirm.') && false) return;
    if (!confirm('Final confirmation: delete all data?')) return;
    var keys = [];
    for (var i = 0; i < localStorage.length; i++) {
      var k = localStorage.key(i);
      if (k && k.startsWith('haven-')) keys.push(k);
    }
    keys.forEach(function(k) { try { localStorage.removeItem(k); } catch (e) { /* ignore */ } });
    // Also clear state
    if (typeof state !== 'undefined') {
      if (typeof loadState === 'function') loadState();
    }
    if (typeof showToast === 'function') showToast('All data deleted');
    setTimeout(function() { location.reload(); }, 1000);
  });

  // Account switching / remove
  el.querySelectorAll('[data-acc-id]').forEach(function(item) {
    item.addEventListener('click', function() {
      var id = item.dataset.accId;
      if (id && id !== activeId) { switchAccount(id); closeSettingsPanel(); }
    });
  });
  el.querySelectorAll('[data-acc-remove]').forEach(function(btn) {
    btn.addEventListener('click', function(e) {
      e.stopPropagation();
      closeSettingsPanel();
      removeProfile(btn.dataset.accRemove);
    });
  });
  document.getElementById('setAddGoogle')?.addEventListener('click', function() { closeSettingsPanel(); firebaseSignIn(); });
  document.getElementById('setAddLocal')?.addEventListener('click', function() { closeSettingsPanel(); gsiSignIn(); });
  document.getElementById('setSignOut')?.addEventListener('click', function() { closeSettingsPanel(); removeProfile(activeId); });
}

function renderAppearanceSettings(el) {
  var prefersDark = typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches;
  var isDark = state.darkMode === null ? prefersDark : state.darkMode;
  var accent = typeof state !== 'undefined' && state.accentColor ? state.accentColor : null;
  var swatchesHtml = '';
  if (typeof ACCENT_PALETTE !== 'undefined' && typeof ACCENT_GROUPS !== 'undefined') {
    ACCENT_GROUPS.forEach(function(g) {
      var groupColors = ACCENT_PALETTE.filter(function(c) { return c.group === g.id; });
      if (!groupColors.length) return;
      swatchesHtml += '<div class="set-swatch-group"><div class="set-swatch-group-label">' + g.label + '</div><div class="set-swatches">';
      groupColors.forEach(function(c) {
        swatchesHtml += '<div class="set-swatch' + (accent === c.dark ? ' active' : '') + '" data-acc-color="' + c.dark + '" style="background:' + c.dark + '" title="' + c.name + '"></div>';
      });
      swatchesHtml += '</div></div>';
    });
  }

  el.innerHTML =
    '<h3>Appearance</h3>' +
    '<div class="set-desc">Customize the theme, accent color, and visuals</div>' +
    '<div class="set-group">' +
      '<div class="set-row">' +
        '<div class="set-row-left"><div class="set-row-label">Dark Mode</div><div class="set-row-desc">Switch between dark and light theme</div></div>' +
        '<button class="set-toggle' + (isDark ? ' on' : '') + '" id="setThemeToggle"></button>' +
      '</div>' +
    '</div>' +
    '<div class="set-group set-group-collapse">' +
      '<div class="set-row-label set-acc-header" onclick="var n=this.nextElementSibling;n.classList.toggle(\'collapsed\');this.classList.toggle(\'collapsed\')">ACCENT COLOR <span class="set-acc-badge" style="background:' + (accent || '#888') + '"></span> <span class="set-acc-toggle">›</span></div>' +
      '<div class="set-acc-body">' + swatchesHtml + '</div>' +
    '</div>' +
    '<div class="set-group">' +
      '<div class="set-row">' +
        '<div class="set-row-left"><div class="set-row-label">Edit Mode</div><div class="set-row-desc">Tap any image to customize throughout the app</div></div>' +
        '<button class="set-toggle' + (typeof state !== 'undefined' && state.editMode ? ' on' : '') + '" id="setVisualsToggle"></button>' +
      '</div>' +
    '</div>';

  document.getElementById('setThemeToggle')?.addEventListener('click', function() {
    if (typeof toggleTheme !== 'undefined') toggleTheme();
    this.classList.toggle('on');
  });

  el.querySelectorAll('[data-acc-color]').forEach(function(el2) {
    el2.addEventListener('click', function() {
      if (typeof state === 'undefined') return;
      state.accentColor = el2.dataset.accColor;
      if (typeof applyAccentColor !== 'undefined') applyAccentColor();
      if (typeof saveState !== 'undefined') saveState();
      el.querySelectorAll('[data-acc-color]').forEach(function(s) { s.classList.remove('active'); });
      el2.classList.add('active');
    });
  });

  document.getElementById('setVisualsToggle')?.addEventListener('click', function() {
    if (typeof toggleEditMode !== 'undefined') toggleEditMode();
    this.classList.toggle('on');
  });
}

function renderAISettings(el) {
  var savedProvider = 'groq'; try { savedProvider = localStorage.getItem('haven-schedule-provider') || 'groq'; } catch(e) {}
  var savedKey = ''; try { savedKey = localStorage.getItem('haven-schedule-apikey') || ''; } catch(e) {}
  var profile = typeof getChickBotProfile === 'function' ? (getChickBotProfile() || {}) : {};
  var routine = typeof loadRoutine === 'function' ? loadRoutine() : '';

  // Build memory list
  var up = typeof state !== 'undefined' && state.userProfile ? state.userProfile : { conversationMemory: {} };
  var memObj = up.conversationMemory || {};
  var memKeys = Object.keys(memObj);
  var memHtml = memKeys.length === 0
    ? '<div class="set-empty">No memories yet. Chat with ChickBot to build your profile.</div>'
    : memKeys.map(function(k) {
        var m = memObj[k];
        return '<div class="set-mem-item" data-mem-key="' + escapeHtml(k) + '">' +
          '<div class="set-mem-body"><div class="set-mem-fact">' + escapeHtml(m.fact || '') + '</div>' +
          '<div class="set-mem-meta">' + escapeHtml(m.date || '') + (m.source ? ' \u00B7 ' + escapeHtml(m.source) : '') + '</div></div>' +
          '<button class="set-mem-del" data-mem-del="' + escapeHtml(k) + '">\u2715</button></div>';
      }).join('');

  // Stats
  var tasksTracked = up.totalTasksCreated || 0;
  var sessions = up.totalSessions || 0;
  var keywords = up.titleKeywords ? Object.keys(up.titleKeywords).length : 0;
  var memoryCount = memKeys.length;
  var ps = up.planStats || {};
  var planRate = ps.total > 0 ? Math.round((ps.accepted / ps.total) * 100) + '%' : '\u2014';
  var extra = ''; try { extra = localStorage.getItem('haven-ai-extra-instructions') || ''; } catch(e) {}

  el.innerHTML =
    '<h3>AI & API</h3>' +
    '<div class="set-desc">Configure the AI assistant provider and API key</div>' +
    '<div class="set-group">' +
      '<div class="set-row">' +
        '<div class="set-row-left"><div class="set-row-label">Provider</div><div class="set-row-desc">Select which AI service to use</div></div>' +
        '<div class="set-row-control"><select class="set-select" id="setAiProvider"><option value="groq">Groq</option><option value="gemini">Gemini</option></select></div>' +
      '</div>' +
      '<div class="set-row">' +
        '<div class="set-row-left"><div class="set-row-label">API Key</div><div class="set-row-desc">Your API key for the selected provider</div></div>' +
        '<div class="set-row-control"><div class="set-api-row"><input class="set-input" type="password" id="setApiKey" placeholder="Enter key" spellcheck="false"><button class="set-btn" id="setApiToggle">Show</button></div></div>' +
      '</div>' +
    '</div>' +
    '<div class="set-divider"></div>' +
    '<div class="set-group set-group-collapse">' +
      '<div class="set-row-label set-acc-header" onclick="var n=this.nextElementSibling;n.classList.toggle(\'collapsed\');this.classList.toggle(\'collapsed\')">AI PROFILE & LEARNING <span class="set-acc-toggle">\u203A</span></div>' +
      '<div class="set-acc-body">' +
        '<div class="set-subsection-label">ABOUT YOU</div>' +
        '<div class="set-ai-grid">' +
          '<div class="set-ai-field"><label class="set-ai-label">Name</label><input class="set-input set-input-full" id="ai-name" value="' + escapeHtml(profile.name || '') + '" placeholder="Your name"></div>' +
          '<div class="set-ai-field"><label class="set-ai-label">Pronouns</label><input class="set-input set-input-full" id="ai-pronouns" value="' + escapeHtml(profile.pronouns || '') + '" placeholder="e.g. they/them"></div>' +
        '</div>' +
        '<div class="set-ai-field"><label class="set-ai-label">Occupation</label><input class="set-input set-input-full" id="ai-occupation" value="' + escapeHtml(profile.occupation || '') + '" placeholder="e.g. Student, Designer"></div>' +
        '<div class="set-ai-grid">' +
          '<div class="set-ai-field"><label class="set-ai-label">Goals</label><textarea class="set-input set-input-full set-textarea" id="ai-goals" rows="2" placeholder="Your top goals...">' + escapeHtml(profile.goals || '') + '</textarea></div>' +
          '<div class="set-ai-field"><label class="set-ai-label">Routines</label><textarea class="set-input set-input-full set-textarea" id="ai-routines" rows="2" placeholder="Any routines...">' + escapeHtml(profile.routines || '') + '</textarea></div>' +
        '</div>' +
        '<div class="set-ai-field"><label class="set-ai-label">Preferences</label><textarea class="set-input set-input-full set-textarea" id="ai-preferences" rows="2" placeholder="Other preferences">' + escapeHtml(profile.preferences || '') + '</textarea></div>' +
        '<div class="set-ai-field"><label class="set-ai-label">Daily Schedule</label><textarea class="set-input set-input-full set-textarea" id="ai-routine" rows="2" placeholder="Describe a typical day...">' + escapeHtml(routine) + '</textarea></div>' +
        '<button class="set-btn set-btn-primary set-ai-save" id="aiProfileSave">Save Profile</button>' +
        '<div class="set-subsection-label" style="margin-top:10px">WHAT I\u2019VE LEARNED</div>' +
        '<div class="set-mem-list" id="aiMemList">' + memHtml + '</div>' +
        '<div style="display:flex;gap:4px;margin-top:4px"><button class="set-btn" id="aiMemAdd">+ Add Memory</button></div>' +
        '<div class="set-subsection-label" style="margin-top:10px">LEARNING DATA</div>' +
        '<div class="set-ai-stats">' +
          '<div class="set-ai-stat"><span class="set-ai-stat-val">' + tasksTracked + '</span> tasks</div>' +
          '<div class="set-ai-stat"><span class="set-ai-stat-val">' + sessions + '</span> sessions</div>' +
          '<div class="set-ai-stat"><span class="set-ai-stat-val">' + keywords + '</span> keywords</div>' +
          '<div class="set-ai-stat"><span class="set-ai-stat-val">' + memoryCount + '</span> memories</div>' +
          '<div class="set-ai-stat"><span class="set-ai-stat-val">' + planRate + '</span> plan acc.</div>' +
        '</div>' +
        '<div style="display:flex;gap:4px;margin-top:6px"><button class="set-btn" id="aiMemClear">Clear Memories</button><button class="set-btn" id="aiResetLearning">Reset Learning</button></div>' +
        '<div class="set-subsection-label" style="margin-top:10px">EXTRA INSTRUCTIONS</div>' +
        '<textarea class="set-input set-input-full set-textarea" id="aiExtraInstructions" rows="2" placeholder="Extra instructions for the AI (optional)...">' + escapeHtml(extra) + '</textarea>' +
        '<button class="set-btn set-ai-save" id="aiExtraSave" style="margin-top:4px">Save Instructions</button>' +
      '</div>' +
    '</div>';

  document.getElementById('setAiProvider').value = savedProvider;
  document.getElementById('setAiProvider').addEventListener('change', function() {
    localStorage.setItem('haven-schedule-provider', this.value);
    if (typeof state !== 'undefined') state.aiProvider = this.value;
  });

  document.getElementById('setApiKey').value = savedKey;
  document.getElementById('setApiKey').addEventListener('input', function() {
    localStorage.setItem('haven-schedule-apikey', this.value);
    if (typeof state !== 'undefined') state.apiKey = this.value;
  });
  document.getElementById('setApiToggle').addEventListener('click', function() {
    var input = document.getElementById('setApiKey');
    if (input.type === 'password') { input.type = 'text'; this.textContent = 'Hide'; }
    else { input.type = 'password'; this.textContent = 'Show'; }
  });

  document.getElementById('aiProfileSave').addEventListener('click', function() {
    if (typeof saveChickBotProfile !== 'function') return;
    saveChickBotProfile({
      name: document.getElementById('ai-name')?.value?.trim() || '',
      pronouns: document.getElementById('ai-pronouns')?.value?.trim() || '',
      occupation: document.getElementById('ai-occupation')?.value?.trim() || '',
      goals: document.getElementById('ai-goals')?.value?.trim() || '',
      routines: document.getElementById('ai-routines')?.value?.trim() || '',
      preferences: document.getElementById('ai-preferences')?.value?.trim() || ''
    });
    var r = document.getElementById('ai-routine')?.value?.trim() || '';
    if (r && typeof saveRoutine === 'function') saveRoutine(r);
    if (typeof showToast === 'function') showToast('Profile saved');
  });

  // Memory list event delegation
  var memList = document.getElementById('aiMemList');
  if (memList) {
    memList.addEventListener('click', function(e) {
      var btn = e.target.closest('[data-mem-del]');
      if (!btn) return;
      var key = btn.dataset.memDel;
      if (!key || !state.userProfile?.conversationMemory) return;
      delete state.userProfile.conversationMemory[key];
      if (typeof saveUserProfile === 'function') saveUserProfile();
      var item = btn.closest('.set-mem-item');
      if (item) item.remove();
      if (!Object.keys(state.userProfile.conversationMemory).length) {
        memList.innerHTML = '<div class="set-empty">No memories yet. Chat with ChickBot to build your profile.</div>';
      }
    });
  }

  // Reusable memory re-render helper
  function rerenderMemories() {
    var list = document.getElementById('aiMemList');
    if (!list) return;
    var obj = state.userProfile?.conversationMemory || {};
    var keys = Object.keys(obj);
    if (keys.length === 0) {
      list.innerHTML = '<div class="set-empty">No memories yet. Chat with ChickBot to build your profile.</div>';
    } else {
      list.innerHTML = keys.map(function(k) {
        var m = obj[k];
        return '<div class="set-mem-item" data-mem-key="' + escapeHtml(k) + '">' +
          '<div class="set-mem-body"><div class="set-mem-fact">' + escapeHtml(m.fact || '') + '</div>' +
          '<div class="set-mem-meta">' + escapeHtml(m.date || '') + (m.source ? ' \u00B7 ' + escapeHtml(m.source) : '') + '</div></div>' +
          '<button class="set-mem-del" data-mem-del="' + escapeHtml(k) + '">\u2715</button></div>';
      }).join('');
    }
  }

  document.getElementById('aiMemAdd')?.addEventListener('click', function() {
    var key = prompt('Give this memory a short label (e.g. "coffee-time"):');
    if (!key) return;
    var fact = prompt('What should I remember about you?');
    if (!fact) return;
    if (typeof storeMemory === 'function') storeMemory(key.trim(), fact.trim(), 'user');
    rerenderMemories();
  });

  document.getElementById('aiMemClear')?.addEventListener('click', function() {
    if (!state.userProfile) return;
    if (!confirm('Clear all AI memories?')) return;
    state.userProfile.conversationMemory = {};
    if (typeof saveUserProfile === 'function') saveUserProfile();
    rerenderMemories();
  });

  document.getElementById('aiResetLearning')?.addEventListener('click', function() {
    if (!confirm('Reset all learning data (tasks, keywords, memories)? This cannot be undone.')) return;
    if (typeof createDefaultProfile !== 'function') return;
    state.userProfile = createDefaultProfile();
    if (typeof saveUserProfile === 'function') saveUserProfile();
    if (typeof showToast === 'function') showToast('Learning data reset');
  });

  document.getElementById('aiExtraSave')?.addEventListener('click', function() {
    var val = document.getElementById('aiExtraInstructions')?.value?.trim() || '';
    try { localStorage.setItem('haven-ai-extra-instructions', val); } catch (e) { /* ignore */ }
    if (typeof showToast === 'function') showToast('Instructions saved');
  });
}

function renderDataSettings(el) {
  el.innerHTML =
    '<h3>Data</h3>' +
    '<div class="set-desc">Export your data or import from a backup</div>' +
    '<div class="set-group">' +
      '<div class="set-row">' +
        '<div class="set-row-left"><div class="set-row-label">Export</div><div class="set-row-desc">Download all your data as a JSON file</div></div>' +
        '<button class="set-btn" id="setExportBtn">Export</button>' +
      '</div>' +
      '<div class="set-row">' +
        '<div class="set-row-left"><div class="set-row-label">Import</div><div class="set-row-desc">Restore data from a JSON backup</div></div>' +
        '<button class="set-btn" id="setImportBtn">Import</button>' +
      '</div>' +
    '</div>';

  document.getElementById('setExportBtn')?.addEventListener('click', function() { closeSettingsPanel(); setTimeout(function() { if (typeof exportData !== 'undefined') exportData(); else if (typeof window.exportData === 'function') window.exportData(); }, 200); });
  document.getElementById('setImportBtn')?.addEventListener('click', function() { closeSettingsPanel(); setTimeout(function() { if (typeof importData !== 'undefined') importData(); else if (typeof window.importData === 'function') window.importData(); }, 200); });

}

function renderAboutSettings(el) {
  el.innerHTML =
    '<h3>About</h3>' +
    '<div class="set-about">' +
      '<div class="set-about-name">Havën Schedule</div>' +
      '<div class="set-about-ver" id="aboutVersionTap" style="cursor:default">Version 1.0.0</div>' +
      '<div class="set-about-links">' +
        '<a href="https://github.com/HansKentang/Hans-Scedule" target="_blank" class="set-btn" style="text-decoration:none">GitHub</a>' +
      '</div>' +
    '</div>';
  
  // Secret tap: click version 5 times to reveal admin tab
  var verEl = document.getElementById('aboutVersionTap');
  if (verEl && !_adminTabRevealed) {
    verEl.addEventListener('click', function() {
      _adminClickCount++;
      if (_adminClickTimer) clearTimeout(_adminClickTimer);
      _adminClickTimer = setTimeout(function() { _adminClickCount = 0; }, 2000);
      if (_adminClickCount >= 5) {
        _adminClickCount = 0;
        if (!_adminTabRevealed) {
          revealAdminTab();
        }
      }
    });
  }
}

function closeSettingsPanel() {
  var o = document.getElementById('settingsOverlay');
  var p = document.getElementById('settingsPanel');
  if (o) o.remove(); if (p) p.remove();
  if (_settingsEscHandler) { document.removeEventListener('keydown', _settingsEscHandler); _settingsEscHandler = null; }
}

window.initGSI = initGSI;
window.gsiSignIn = gsiSignIn;
window.gsiSignOut = removeProfile;
window.switchGSIAccount = switchAccount;
window.getGSIActiveSub = getActiveUserId;
window.createLocalProfile = createLocalProfile;
window.firebaseSignIn = firebaseSignIn;
window.openSettingsBubble = openSettingsBubble;
