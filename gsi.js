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
function firebaseSignIn() {
  if (typeof firebase === 'undefined') { showToast('Firebase SDK not loaded. Refresh the page.', 'error', 4000); return; }
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

window.initGSI = initGSI;
window.gsiSignIn = gsiSignIn;
window.gsiSignOut = removeProfile;
window.switchGSIAccount = switchAccount;
window.getGSIActiveSub = getActiveUserId;
window.createLocalProfile = createLocalProfile;
window.firebaseSignIn = firebaseSignIn;
window.handleFirebaseUser = handleFirebaseUser;
