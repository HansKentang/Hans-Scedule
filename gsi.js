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
    var dropdownItems = localUsers.map(function(u) {
      var i2 = getInitials(u.name);
      var c2 = u._color || getColorForId(u.id);
      var icon = u.picture
        ? '<img class="gsi-dd-avatar" src="' + u.picture + '" alt="">'
        : '<span class="gsi-dd-initials" style="background:' + c2 + '">' + escapeHtml(i2) + '</span>';
      return '<div class="gsi-dd-item' + (u.id === activeId ? ' active' : '') + '" data-gsi-switch="' + u.id + '">' +
        icon + '<span class="gsi-dd-name">' + escapeHtml(u.name) + '</span></div>';
    }).join('');

    container.innerHTML =
      '<div class="gsi-avatar-wrap">' + avatarHtml +
        '<div class="gsi-avatar-name">' + escapeHtml(activeUser.name) + '</div>' +
        '<div class="gsi-avatar-dropdown" id="gsiDropdown">' +
          dropdownItems +
          '<div class="gsi-dd-divider"></div>' +
          '<div class="gsi-dd-item" id="gsiAddAccountBtn"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg><span>Add profile</span></div>' +
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
    container.querySelector('#gsiAddAccountBtn').addEventListener('click', function(e) {
      e.stopPropagation(); dropdown.classList.remove('open');
      gsiSignIn();
    });
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
      '<div class="settings-content" id="settingsContent"></div>' +
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

function renderSettingsNav() {
  var nav = document.getElementById('settingsNav');
  if (!nav) return;
  var cats = [
    { id: 'account', label: 'My Account', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>' },
    { id: 'appearance', label: 'Appearance', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/></svg>' },
    { id: 'ai', label: 'AI & API', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a4 4 0 014 4c0 2-2 3-2 3h-4s-2-1-2-3a4 4 0 014-4z"/><path d="M8 15h8v2a2 2 0 01-2 2h-4a2 2 0 01-2-2v-2z"/><line x1="12" y1="19" x2="12" y2="22"/></svg>' },
    { id: 'data', label: 'Data', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>' },
    { id: 'about', label: 'About', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>' }
  ];
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
  var content = document.getElementById('settingsContent');
  if (!content) return;
  settingsPanelActiveCategory = cat;
  switch (cat) {
    case 'account': renderAccountSettings(content); break;
    case 'appearance': renderAppearanceSettings(content); break;
    case 'ai': renderAISettings(content); break;
    case 'data': renderDataSettings(content); break;
    case 'about': renderAboutSettings(content); break;
  }
}

function renderAccountSettings(el) {
  var activeId = getActiveUserId();
  var activeUser = localUsers.find(function(u) { return u.id === activeId; });
  var guest = isGuestMode();

  var avatarHtml = '';
  if (guest) {
    avatarHtml = '<div class="set-avatar-initials" style="background:var(--text-tertiary);opacity:0.5">?</div><div class="set-avatar-info"><div class="set-avatar-name" style="opacity:0.5">Guest</div></div>';
  } else if (activeUser) {
    var initials = getInitials(activeUser.name);
    var color = activeUser._color || getColorForId(activeUser.id);
    var img = activeUser.picture ? '<img class="set-avatar" src="' + escapeHtml(activeUser.picture) + '">' : '<div class="set-avatar-initials" style="background:' + color + '">' + escapeHtml(initials) + '</div>';
    avatarHtml = img + '<div class="set-avatar-info"><div class="set-avatar-name">' + escapeHtml(activeUser.name) + '</div>' + (activeUser.email ? '<div class="set-avatar-email">' + escapeHtml(activeUser.email) + '</div>' : '') + '</div>';
  } else {
    avatarHtml = '<div style="font-size:0.78rem;color:var(--text-tertiary);padding:6px 0">No profile selected</div>';
  }

  // Account list
  var listHtml = localUsers.map(function(u) {
    var isActive = u.id === activeId;
    var init = getInitials(u.name);
    var col = u._color || getColorForId(u.id);
    var av = u.picture ? '<img class="set-acc-avatar" src="' + escapeHtml(u.picture) + '">' : '<div class="set-acc-initials" style="background:' + col + '">' + escapeHtml(init) + '</div>';
    return '<div class="set-acc-item' + (isActive ? ' active' : '') + '" data-acc-id="' + u.id + '">' +
      av +
      '<div class="set-acc-info"><div class="set-acc-name">' + escapeHtml(u.name) + '</div>' + (u.email ? '<div class="set-acc-email">' + escapeHtml(u.email) + '</div>' : '') + '</div>' +
      (!isActive ? '<button class="set-acc-remove" data-acc-remove="' + u.id + '">✕</button>' : '') +
    '</div>';
  }).join('');

  if (guest) {
    listHtml += '<div class="set-acc-item"><div class="set-acc-initials" style="background:var(--text-tertiary);opacity:0.5">?</div><div class="set-acc-info"><div class="set-acc-name" style="opacity:0.5">Guest</div></div></div>';
  }

  el.innerHTML =
    '<h3>My Account</h3>' +
    '<div class="set-group">' +
      '<div class="set-avatar-row">' + avatarHtml + '</div>' +
    '</div>' +
    '<div class="set-divider"></div>' +
    '<div class="set-group">' +
      '<div class="set-row-label" style="font-size:0.72rem;color:var(--text-tertiary);margin-bottom:6px">SWITCH ACCOUNT</div>' +
      listHtml +
      '<button class="set-link-btn" id="setAddGoogle"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="8" r="4"/><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/></svg>Sign in with Google</button>' +
      '<button class="set-link-btn" id="setAddLocal"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>Add local profile</button>' +
    '</div>' +
    '<div class="set-divider"></div>' +
    '<div class="set-logout">' +
      '<button class="set-btn set-btn-danger" id="setSignOut">Sign Out</button>' +
    '</div>';

  // Event listeners
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
  var isDark = typeof state === 'undefined' || state.darkMode !== false;
  var accent = typeof state !== 'undefined' && state.accentColor ? state.accentColor : null;
  var swatches = '';
  if (typeof ACCENT_PALETTE !== 'undefined') {
    ACCENT_PALETTE.forEach(function(c) {
      swatches += '<div class="set-swatch' + (accent === c.id ? ' active' : '') + '" data-acc-color="' + c.id + '" style="background:' + c.colors.dark + '"></div>';
    });
  }

  el.innerHTML =
    '<h3>Appearance</h3>' +
    '<div class="set-desc">Customize the theme and accent color</div>' +
    '<div class="set-group">' +
      '<div class="set-row">' +
        '<div class="set-row-left"><div class="set-row-label">Dark Mode</div><div class="set-row-desc">Switch between dark and light theme</div></div>' +
        '<button class="set-toggle' + (isDark ? ' on' : '') + '" id="setThemeToggle"></button>' +
      '</div>' +
    '</div>' +
    '<div class="set-group">' +
      '<div class="set-row-label" style="font-size:0.72rem;color:var(--text-tertiary);margin-bottom:6px">ACCENT COLOR</div>' +
      '<div class="set-swatches">' + swatches + '</div>' +
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
}

function renderAISettings(el) {
  var savedProvider = localStorage.getItem('haven-schedule-provider') || 'groq';
  var savedKey = localStorage.getItem('haven-schedule-apikey') || '';

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
      '<div class="set-about-ver">Version 1.0.0</div>' +
      '<div class="set-about-links">' +
        '<a href="https://github.com/HansKentang/Hans-Scedule" target="_blank" class="set-btn" style="text-decoration:none">GitHub</a>' +
      '</div>' +
    '</div>';
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
