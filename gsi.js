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
  if (isLoginPage()) location.href = 'index.html';
  else location.reload();
}

function switchAccount(id) {
  var user = localUsers.find(function(u) { return u.id === id; });
  if (!user) return;
  setActiveUserId(id);
  if (typeof state !== 'undefined') state.currentUserId = id;
  renderAuthUI();
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
}

function isLoginPage() {
  return location.pathname.indexOf('login.html') !== -1;
}

function isGuestMode() {
  return sessionStorage.getItem('haven-guest') === '1';
}

// ─── Settings Bubble ───────────────────────────
function openSettingsBubble() {
  var existing = document.getElementById('settingsBubbleOverlay');
  if (existing) return;

  var overlay = document.createElement('div');
  overlay.className = 'settings-bubble-overlay';
  overlay.id = 'settingsBubbleOverlay';

  var popup = document.createElement('div');
  popup.className = 'settings-bubble';
  popup.id = 'settingsBubble';

  var activeId = getActiveUserId();
  var activeUser = localUsers.find(function(u) { return u.id === activeId; });

  var accHtml = localUsers.map(function(u) {
    var isActive = u.id === activeId;
    var initials = getInitials(u.name);
    var color = u._color || getColorForId(u.id);
    var avatar = u.picture
      ? '<img class="settings-bubble-acc-avatar" src="' + escapeHtml(u.picture) + '">'
      : '<div class="settings-bubble-acc-initials" style="background:' + color + '">' + escapeHtml(initials) + '</div>';
    return '<div class="settings-bubble-acc-item' + (isActive ? ' active' : '') + '" data-acc-id="' + u.id + '">' +
      avatar +
      '<div class="settings-bubble-acc-info">' +
        '<div class="settings-bubble-acc-name">' + escapeHtml(u.name) + '</div>' +
        (u.email ? '<div class="settings-bubble-acc-email">' + escapeHtml(u.email) + '</div>' : '') +
      '</div>' +
      (!isActive ? '<button class="settings-bubble-acc-remove" data-acc-remove="' + u.id + '">✕</button>' : '') +
    '</div>';
  }).join('');

  // Guest mode indicator
  if (isGuestMode()) {
    accHtml += '<div class="settings-bubble-acc-item">' +
      '<div class="settings-bubble-acc-initials" style="background:var(--text-tertiary);opacity:0.5">?</div>' +
      '<div class="settings-bubble-acc-info"><div class="settings-bubble-acc-name" style="opacity:0.5">Guest</div></div>' +
    '</div>';
  }

  var theme = typeof state !== 'undefined' && state.darkMode === false ? 'light' : 'dark';
  var accentSwatches = '';
  if (typeof ACCENT_PALETTE !== 'undefined') {
    ACCENT_PALETTE.forEach(function(c) {
      var active = (typeof state !== 'undefined' && state.accentColor === c.id) ? ' active' : '';
      accentSwatches += '<div class="settings-bubble-swatch' + active + '" data-acc-color="' + c.id + '" style="background:' + c.colors.dark + '"></div>';
    });
  }

  var tagHtml = '';
  if (typeof TAG_ORDER !== 'undefined') {
    TAG_ORDER.forEach(function(t) {
      if (t === 'deep-work' || t === 'meeting' || t === 'exercise' || t === 'study' || t === 'hobby' || t.indexOf('custom-') === 0) {
        var tagLabel = t.replace('custom-', '').replace('-', ' ');
        tagHtml += '<div class="settings-bubble-row"><span class="settings-bubble-label" style="text-transform:capitalize">' + tagLabel + '</span></div>';
      }
    });
  }

  popup.innerHTML =
    '<div class="settings-bubble-header">' +
      '<span>Settings</span>' +
      '<button class="settings-bubble-close" id="settingsBubbleClose"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>' +
    '</div>' +
    '<div class="settings-bubble-body">' +
      // Profile & Accounts
      '<div class="settings-bubble-section">' +
        '<div class="settings-bubble-section-title">Profile & Accounts</div>' +
        accHtml +
        '<button class="settings-bubble-add-btn" id="settingsBubbleAddGoogle"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="8" r="4"/><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/></svg>Sign in with Google</button>' +
        '<button class="settings-bubble-add-btn" id="settingsBubbleAddLocal" style="margin-top:4px"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>Add local profile</button>' +
      '</div>' +
      // Theme & Accent
      '<div class="settings-bubble-section">' +
        '<div class="settings-bubble-section-title">Theme & Accent</div>' +
        '<div class="settings-bubble-row">' +
          '<span class="settings-bubble-label">Theme</span>' +
          '<div class="settings-bubble-theme-chips">' +
            '<button class="settings-bubble-theme-chip' + (theme === 'dark' ? ' active' : '') + '" data-theme="dark">Dark</button>' +
            '<button class="settings-bubble-theme-chip' + (theme === 'light' ? ' active' : '') + '" data-theme="light">Light</button>' +
          '</div>' +
        '</div>' +
        '<div class="settings-bubble-swatches">' + accentSwatches + '</div>' +
      '</div>' +
      // AI
      '<div class="settings-bubble-section">' +
        '<div class="settings-bubble-section-title">AI</div>' +
        '<div class="settings-bubble-row">' +
          '<span class="settings-bubble-label">Provider</span>' +
          '<select class="settings-bubble-select" id="settingsBubbleProvider"><option value="groq">Groq</option><option value="gemini">Gemini</option></select>' +
        '</div>' +
        '<div class="settings-bubble-row">' +
          '<span class="settings-bubble-label">API Key</span>' +
          '<div class="settings-bubble-api-row"><input type="password" id="settingsBubbleApiKey" placeholder="Enter key" spellcheck="false"><button class="settings-bubble-btn" id="settingsBubbleApiToggle">Show</button></div>' +
        '</div>' +
      '</div>' +
      // Data
      '<div class="settings-bubble-section">' +
        '<div class="settings-bubble-section-title">Data</div>' +
        '<div class="settings-bubble-row">' +
          '<button class="settings-bubble-btn" id="settingsBubbleExport">Export</button>' +
          '<button class="settings-bubble-btn" id="settingsBubbleImport">Import</button>' +
        '</div>' +
      '</div>' +
    '</div>';

  document.body.appendChild(overlay);
  document.body.appendChild(popup);

  function closeBubble() {
    var o = document.getElementById('settingsBubbleOverlay');
    var p = document.getElementById('settingsBubble');
    if (o) o.remove();
    if (p) p.remove();
    document.removeEventListener('keydown', escapeHandler);
  }

  var escapeHandler = function(e) {
    if (e.key === 'Escape') closeBubble();
  };
  document.addEventListener('keydown', escapeHandler);

  overlay.addEventListener('click', closeBubble);
  document.getElementById('settingsBubbleClose').addEventListener('click', closeBubble);

  // Account switch
  popup.querySelectorAll('[data-acc-id]').forEach(function(el) {
    el.addEventListener('click', function() {
      var id = el.dataset.accId;
      if (id && id !== activeId) { switchAccount(id); closeBubble(); }
    });
  });

  // Account remove
  popup.querySelectorAll('[data-acc-remove]').forEach(function(el) {
    el.addEventListener('click', function(e) {
      e.stopPropagation();
      var id = el.dataset.accRemove;
      closeBubble();
      removeProfile(id);
    });
  });

  // Add Google
  document.getElementById('settingsBubbleAddGoogle').addEventListener('click', function() {
    closeBubble();
    firebaseSignIn();
  });

  // Add local
  document.getElementById('settingsBubbleAddLocal').addEventListener('click', function() {
    closeBubble();
    gsiSignIn();
  });

  // Theme
  popup.querySelectorAll('[data-theme]').forEach(function(el) {
    el.addEventListener('click', function() {
      if (typeof toggleTheme !== 'undefined') toggleTheme();
      setTimeout(function() {
        var chips = popup.querySelectorAll('[data-theme]');
        var isDark = typeof state !== 'undefined' && (state.darkMode !== false);
        chips.forEach(function(c) { c.classList.toggle('active', (isDark && c.dataset.theme === 'dark') || (!isDark && c.dataset.theme === 'light')); });
      }, 100);
    });
  });

  // Accent
  popup.querySelectorAll('[data-acc-color]').forEach(function(el) {
    el.addEventListener('click', function() {
      if (typeof state === 'undefined') return;
      state.accentColor = el.dataset.accColor;
      if (typeof applyAccentColor !== 'undefined') applyAccentColor();
      if (typeof saveState !== 'undefined') saveState();
      popup.querySelectorAll('[data-acc-color]').forEach(function(s) { s.classList.remove('active'); });
      el.classList.add('active');
    });
  });

  // Provider
  var savedProvider = localStorage.getItem('haven-schedule-provider');
  if (savedProvider) document.getElementById('settingsBubbleProvider').value = savedProvider;
  document.getElementById('settingsBubbleProvider').addEventListener('change', function() {
    localStorage.setItem('haven-schedule-provider', this.value);
    if (typeof state !== 'undefined') state.aiProvider = this.value;
  });

  // API key
  var savedKey = localStorage.getItem('haven-schedule-apikey');
  if (savedKey) document.getElementById('settingsBubbleApiKey').value = savedKey;
  document.getElementById('settingsBubbleApiKey').addEventListener('input', function() {
    localStorage.setItem('haven-schedule-apikey', this.value);
    if (typeof state !== 'undefined') state.apiKey = this.value;
  });
  document.getElementById('settingsBubbleApiToggle').addEventListener('click', function() {
    var input = document.getElementById('settingsBubbleApiKey');
    if (input.type === 'password') { input.type = 'text'; this.textContent = 'Hide'; }
    else { input.type = 'password'; this.textContent = 'Show'; }
  });

  // Export
  document.getElementById('settingsBubbleExport').addEventListener('click', function() {
    if (typeof exportData !== 'undefined') { closeBubble(); exportData(); }
    else if (typeof window.exportData === 'function') { closeBubble(); window.exportData(); }
  });

  // Import
  document.getElementById('settingsBubbleImport').addEventListener('click', function() {
    if (typeof importData !== 'undefined') { closeBubble(); importData(); }
    else if (typeof window.importData === 'function') { closeBubble(); window.importData(); }
  });
}

window.initGSI = initGSI;
window.gsiSignIn = gsiSignIn;
window.gsiSignOut = removeProfile;
window.switchGSIAccount = switchAccount;
window.getGSIActiveSub = getActiveUserId;
window.createLocalProfile = createLocalProfile;
window.firebaseSignIn = firebaseSignIn;
window.openSettingsBubble = openSettingsBubble;
