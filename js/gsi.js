// ─── Firebase Configuration ────────────────────────────
var FIREBASE_CONFIG = {
  apiKey: "AIzaSyDhGJuLw9TW7i6GUQkhVQwOSRkX4nAoS8g",
  authDomain: "haven-schedule-c8fec.firebaseapp.com",
  projectId: "haven-schedule-c8fec",
  storageBucket: "haven-schedule-c8fec.firebasestorage.app",
  messagingSenderId: "372760068715",
  appId: "1:372760068715:web:e18957b41d42b727ab272e",
  measurementId: "G-QD3WMGTYVS"
};

// ─── Auth (Local profiles) ──────────────────────────────
var AUTH_USERS_KEY = 'haven-gsi-accounts';
var AUTH_ACTIVE_KEY = 'haven-gsi-active';
var localUsers = [];
var authInitialized = false;

function loadUsers() {
  try { localUsers = JSON.parse(localStorage.getItem(AUTH_USERS_KEY) || '[]'); } catch (e) { localUsers = []; }
  var guests = localUsers.filter(function(u) { return u && u.name === 'Guest'; });
  if (guests.length <= 1) return;
  var activeId = getActiveUserId();
  var keep = guests.find(function(u) { return u.id === activeId; }) || guests[0];
  var removed = false;
  localUsers = localUsers.filter(function(u) {
    if (u && u.name === 'Guest' && u !== keep) {
      var prefix = u.id + ':';
      var doomed = [];
      try {
        // Collect first, then remove — removing during iteration shifts the
        // raw store's live length and permanently skips ~half the keys.
        for (var i = 0; i < __origLS.length; i++) {
          var key = __origLS.key(i);
          if (key && key.indexOf(prefix) === 0) doomed.push(key);
        }
        for (var j = 0; j < doomed.length; j++) __origLS.removeItem(doomed[j]);
      } catch (e) { /* ignore */ }
      removed = true;
      return false;
    }
    return true;
  });
  if (removed) {
    saveUsers();
    if (activeId && !localUsers.some(function(u) { return u.id === activeId; })) {
      setActiveUserId(keep.id);
    }
  }
}

function saveUsers() {
  localStorage.setItem(AUTH_USERS_KEY, JSON.stringify(localUsers));
}

function getActiveUserId() {
  try { return localStorage.getItem(AUTH_ACTIVE_KEY); } catch (e) { return null; }
}

function setActiveUserId(id) {
  function _clearImages() {
    try {
      if (typeof forceFreeImageCache === 'function') {
        forceFreeImageCache(__origLS.length || 100000);
      } else {
        for (var i = __origLS.length - 1; i >= 0; i--) {
          var k = __origLS.key(i);
          if (k && (k.indexOf('haven-image-') === 0 || k.indexOf('hub-image-') === 0)) {
            __origLS.removeItem(k);
          }
        }
      }
    } catch(e) {}
  }
  if (id) {
    localStorage.setItem(AUTH_ACTIVE_KEY, id);
    if (localStorage.getItem(AUTH_ACTIVE_KEY) !== id) {
      _clearImages();
      localStorage.setItem(AUTH_ACTIVE_KEY, id);
    }
  } else {
    localStorage.removeItem(AUTH_ACTIVE_KEY);
  }
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

function _syncMenuProfile(activeUser, isGuest) {
  var nameEl = document.getElementById('menuName');
  var emailEl = document.getElementById('menuEmail');
  var avatarEl = document.getElementById('menuAvatar');
  if (!nameEl) return;
  if (activeUser) {
    nameEl.textContent = activeUser.name || 'User';
    if (emailEl) emailEl.textContent = activeUser.email || '';
    if (avatarEl) {
      var initials = getInitials(activeUser.name);
      var color = activeUser._color || getColorForId(activeUser.id);
      if (activeUser.picture) {
        avatarEl.innerHTML = '<img src="' + activeUser.picture + '" style="width:100%;height:100%;border-radius:50%;object-fit:cover">';
      } else {
        avatarEl.textContent = initials;
        avatarEl.style.background = color;
      }
    }
  } else {
    nameEl.textContent = 'Guest';
    if (emailEl) emailEl.textContent = '';
    if (avatarEl) { avatarEl.textContent = 'G'; avatarEl.style.background = '#fff'; avatarEl.style.color = '#3f3f3a'; }
  }
}

function renderAuthUI() {
  var container = document.getElementById('gsiContainer');
  if (!container) return;
  var activeId = getActiveUserId();
  var activeUser = localUsers.find(function(u) { return u.id === activeId; });

  var guestProfile = isGuestMode();
  if (activeUser) {
    var initials = getInitials(activeUser.name);
    var color = activeUser._color || getColorForId(activeUser.id);
    var avatarHtml = activeUser.picture
      ? '<img class="gsi-avatar" src="' + activeUser.picture + '" alt="' + escapeHtml(activeUser.name) + '">'
      : (guestProfile
        ? '<div class="gsi-avatar gsi-avatar-local" style="background:#fff"><span class="gsi-avatar-initials" style="color:#3f3f3a">G</span></div>'
        : '<div class="gsi-avatar gsi-avatar-local" style="background:' + color + '"><span class="gsi-avatar-initials">' + escapeHtml(initials) + '</span></div>');
    container.innerHTML =
      '<div class="gsi-avatar-wrap" id="gsiAvatarWrap">' + avatarHtml +
        '<div class="gsi-avatar-name">' + escapeHtml(activeUser.name) + '</div>' +
      '</div>';
    container.querySelector('#gsiAvatarWrap').addEventListener('click', function(e) {
      e.stopPropagation();
      openAccountPopup();
    });
  } else if (isGuestMode()) {
    container.innerHTML =
      '<div class="gsi-avatar-wrap" id="gsiAvatarWrap" style="cursor:default">' +
        '<div class="gsi-avatar gsi-avatar-local" style="background:#fff"><span class="gsi-avatar-initials" style="color:#3f3f3a">G</span></div>' +
        '<div class="gsi-avatar-name" style="opacity:0.5">Guest</div>' +
      '</div>';
    container.querySelector('#gsiAvatarWrap').addEventListener('click', function(e) {
      e.stopPropagation();
      openAccountPopup();
    });
  } else {
    container.innerHTML =
      '<div class="gsi-signin-wrap"><div id="gsiButton" class="gsi-signin-btn">' +
        '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>' +
        '<span>Create profile</span></div></div>';
    container.querySelector('#gsiButton').addEventListener('click', openAccountPopup);
  }
  _syncMenuProfile(activeUser, guestProfile);
}

/* ════════════════════════════════════════════════════════════
   ACCOUNT POPUP — centered card for switching / adding /
   removing profiles, Google sign-in, and guest sessions
   ════════════════════════════════════════════════════════════ */
var _accPopup = null;
var _accPopupView = 'list';
var _accPopupRemoveId = null;

function openAccountPopup() {
  if (_accPopup) { closeAccountPopup(); return; }
  _accPopupView = 'list';
  _accPopupRemoveId = null;

  var overlay = document.createElement('div');
  overlay.className = 'accpop-overlay';
  overlay.id = 'accPopupOverlay';
  overlay.addEventListener('click', function(e) { if (e.target === overlay) closeAccountPopup(); });

  var card = document.createElement('div');
  card.className = 'accpop-card';
  card.id = 'accPopupCard';
  overlay.appendChild(card);
  document.body.appendChild(overlay);
  _accPopup = overlay;

  renderAccountPopup();
  requestAnimationFrame(function() { overlay.classList.add('open'); });

  document.addEventListener('keydown', _accPopupKeyHandler);
}

function _accPopupKeyHandler(e) {
  if (e.key === 'Escape') closeAccountPopup();
}

function closeAccountPopup() {
  if (!_accPopup) return;
  var el = _accPopup;
  _accPopup = null;
  el.classList.remove('open');
  setTimeout(function() { el.remove(); }, 180);
  document.removeEventListener('keydown', _accPopupKeyHandler);
}

function _accPopupGo(view, removeId) {
  _accPopupView = view;
  _accPopupRemoveId = removeId || null;
  renderAccountPopup();
}

function renderAccountPopup() {
  var card = document.getElementById('accPopupCard');
  if (!card) return;
  var activeId = getActiveUserId();
  var activeUser = localUsers.find(function(u) { return u.id === activeId; });
  var guest = isGuestMode();
  var hasFirebase = false;
  try { hasFirebase = typeof firebase !== 'undefined' && typeof firebase.auth === 'function' && firebase.apps && firebase.apps.length > 0; } catch (e) {}

  if (_accPopupView === 'add') {
    _accPopupRenderAdd(card);
    return;
  }
  if (_accPopupView === 'confirm-remove') {
    _accPopupRenderConfirmRemove(card);
    return;
  }

  var html = '';

  // Header: active account identity
  html += '<div class="accpop-header">';
  if (activeUser) {
    var init = getInitials(activeUser.name);
    var col = activeUser._color || getColorForId(activeUser.id);
    html += activeUser.picture
      ? '<img class="accpop-acc-avatar accpop-acc-avatar-lg" src="' + escapeHtml(activeUser.picture) + '" alt="">'
      : '<div class="accpop-acc-avatar accpop-acc-avatar-lg" style="background:' + col + '">' + escapeHtml(init) + '</div>';
    html += '<div class="accpop-header-info">' +
      '<div class="accpop-header-name">' + escapeHtml(activeUser.name) + '</div>' +
      (activeUser.email ? '<div class="accpop-header-sub">' + escapeHtml(activeUser.email) + '</div>' : '<div class="accpop-header-sub">Current account</div>') +
      '</div>';
  } else if (guest) {
    html += '<div class="accpop-acc-avatar accpop-acc-avatar-lg" style="background:#fff;color:#3f3f3a">G</div>' +
      '<div class="accpop-header-info">' +
      '<div class="accpop-header-name">Guest</div>' +
      '<div class="accpop-header-sub">Temporary session</div>' +
      '</div>';
  } else {
    html += '<div class="accpop-header-info"><div class="accpop-header-name">Accounts</div>' +
      '<div class="accpop-header-sub">Choose an account</div></div>';
  }
  html +=
    '<button class="accpop-close" id="accPopClose" title="Close">' +
      '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>' +
    '</button>';
  html += '</div>';

  // Account list
  if (localUsers.length > 0) {
    html += '<div class="accpop-list">';
    localUsers.forEach(function(u) {
      var isActive = u.id === activeId;
      var i2 = getInitials(u.name);
      var c2 = u._color || getColorForId(u.id);
      var av = u.picture
        ? '<img class="accpop-acc-avatar" src="' + escapeHtml(u.picture) + '" alt="">'
        : '<div class="accpop-acc-avatar" style="background:' + c2 + '">' + escapeHtml(i2) + '</div>';
      html += '<div class="accpop-item' + (isActive ? ' active' : '') + '" data-accpop-switch="' + u.id + '" role="button" tabindex="0">' +
        av +
        '<div class="accpop-item-info">' +
          '<div class="accpop-item-name">' + escapeHtml(u.name) + '</div>' +
          (u.email ? '<div class="accpop-item-sub">' + escapeHtml(u.email) + '</div>' : '') +
        '</div>' +
        (isActive
          ? '<svg class="accpop-check" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>'
          : '<button class="accpop-item-remove" data-accpop-remove="' + u.id + '" title="Remove account">' +
              '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>' +
            '</button>') +
        '</div>';
    });
    html += '</div>';
  }

  // Actions
  html += '<div class="accpop-actions">';
  html +=
    '<button class="accpop-add-btn" id="accPopAdd">' +
      '<span class="accpop-add-plus">' +
        '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>' +
      '</span>' +
      '<span>Add account</span>' +
    '</button>';
  html +=
    '<button class="accpop-google-btn" id="accPopGoogle">' +
      '<svg viewBox="0 0 48 48" fill="none"><path d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z" fill="#FFC107"/><path d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z" fill="#FF3D00"/><path d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0124 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z" fill="#4CAF50"/><path d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 01-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z" fill="#1976D2"/></svg>' +
      '<span>' + (guest ? 'Sign in with Google (keep guest data)' : 'Sign in with Google') + '</span>' +
    '</button>';
  if (!guest && hasFirebase) {
    html +=
      '<button class="accpop-guest-btn" id="accPopGuest">' +
        '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>' +
        '<span>Continue as guest</span>' +
      '</button>';
  }
  if (guest) {
    html +=
      '<button class="accpop-guest-btn accpop-guest-exit" id="accPopGuestExit">' +
        '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>' +
        '<span>Exit guest session</span>' +
      '</button>';
  }
  html += '</div>';

  html += '<div class="accpop-footer">Manage your accounts on this device</div>';

  html += '<button class="accpop-remove-all" id="accPopRemoveAll">Remove all accounts</button>';

  card.innerHTML = html;

  // Wire events
  card.querySelector('#accPopClose').addEventListener('click', closeAccountPopup);
  card.querySelectorAll('[data-accpop-switch]').forEach(function(el) {
    el.addEventListener('click', function(e) {
      if (e.target.closest('[data-accpop-remove]')) return;
      var id = el.dataset.accpopSwitch;
      if (id !== activeId) {
        closeAccountPopup();
        switchAccount(id);
      } else {
        closeAccountPopup();
      }
    });
  });
  card.querySelectorAll('[data-accpop-remove]').forEach(function(btn) {
    btn.addEventListener('click', function(e) {
      e.stopPropagation();
      _accPopupGo('confirm-remove', btn.dataset.accpopRemove);
    });
  });
  card.querySelector('#accPopAdd').addEventListener('click', function() { _accPopupGo('add'); });
  var gBtn = card.querySelector('#accPopGoogle');
  if (gBtn) gBtn.addEventListener('click', function() { closeAccountPopup(); gsiSignIn(); });
  var guestBtn = card.querySelector('#accPopGuest');
  if (guestBtn) guestBtn.addEventListener('click', function() { closeAccountPopup(); location.href = 'login.html'; });
  var removeAllBtn = card.querySelector('#accPopRemoveAll');
  if (removeAllBtn) removeAllBtn.addEventListener('click', function(e) { e.stopPropagation(); removeAllProfiles(); });
  var guestExitBtn = card.querySelector('#accPopGuestExit');
  if (guestExitBtn) guestExitBtn.addEventListener('click', function() { closeAccountPopup(); guestSignOut(); });
}

function _accPopupRenderAdd(card) {
  var html =
    '<div class="accpop-header">' +
      '<div class="accpop-header-info">' +
        '<div class="accpop-header-name">Add account</div>' +
        '<div class="accpop-header-sub">Create a local profile on this device</div>' +
      '</div>' +
      '<button class="accpop-back" id="accPopBack" title="Back">' +
        '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>' +
      '</button>' +
    '</div>' +
    '<div class="accpop-form">' +
      '<label class="accpop-label" for="accPopName">Profile name</label>' +
      '<input class="accpop-input" id="accPopName" type="text" placeholder="e.g. Alex" maxlength="30" spellcheck="false" autocomplete="off">' +
      '<button class="accpop-primary-btn" id="accPopCreate" disabled>Create profile</button>' +
      '<div class="accpop-or"><span>or</span></div>' +
      '<button class="accpop-google-btn" id="accPopGoogleFull">' +
        '<svg viewBox="0 0 48 48" fill="none"><path d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z" fill="#FFC107"/><path d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z" fill="#FF3D00"/><path d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0124 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z" fill="#4CAF50"/><path d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 01-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z" fill="#1976D2"/></svg>' +
        '<span>Sign in with Google instead</span>' +
      '</button>' +
    '</div>';
  card.innerHTML = html;

  card.querySelector('#accPopBack').addEventListener('click', function() { _accPopupGo('list'); });
  var input = card.querySelector('#accPopName');
  var createBtn = card.querySelector('#accPopCreate');
  input.addEventListener('input', function() { createBtn.disabled = !input.value.trim(); });
  input.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' && !createBtn.disabled) createBtn.click();
  });
  createBtn.addEventListener('click', function() {
    var name = input.value.trim();
    if (!name) return;
    createLocalProfile(name);
  });
  card.querySelector('#accPopGoogleFull').addEventListener('click', function() {
    closeAccountPopup();
    gsiSignIn();
  });
  requestAnimationFrame(function() { input.focus(); });
}

function _accPopupRenderConfirmRemove(card) {
  var user = localUsers.find(function(u) { return u.id === _accPopupRemoveId; });
  if (!user) { _accPopupGo('list'); return; }
  var activeId = getActiveUserId();
  var isActive = user.id === activeId;
  var remaining = localUsers.filter(function(u) { return u.id !== user.id; });
  var i2 = getInitials(user.name);
  var c2 = user._color || getColorForId(user.id);
  var av = user.picture
    ? '<img class="accpop-acc-avatar accpop-acc-avatar-lg" src="' + escapeHtml(user.picture) + '" alt="">'
    : '<div class="accpop-acc-avatar accpop-acc-avatar-lg" style="background:' + c2 + '">' + escapeHtml(i2) + '</div>';

  var html =
    '<div class="accpop-header">' +
      '<div class="accpop-header-info">' +
        '<div class="accpop-header-name">Remove account?</div>' +
        '<div class="accpop-header-sub">This cannot be undone</div>' +
      '</div>' +
      '<button class="accpop-back" id="accPopBack" title="Back">' +
        '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>' +
      '</button>' +
    '</div>' +
    '<div class="accpop-confirm">' +
      av +
      '<div class="accpop-confirm-name">' + escapeHtml(user.name) + '</div>' +
      (user.email ? '<div class="accpop-confirm-sub">' + escapeHtml(user.email) + '</div>' : '') +
      '<div class="accpop-confirm-warn">All data for this profile on this device will be deleted' +
      (isActive && remaining.length > 0 ? ' and you will be switched to <strong>' + escapeHtml(remaining[0].name) + '</strong>' : '') +
      '.</div>' +
      '<div class="accpop-confirm-btns">' +
        '<button class="accpop-cancel-btn" id="accPopCancel">Cancel</button>' +
        '<button class="accpop-danger-btn" id="accPopConfirmRemove">Remove account</button>' +
      '</div>' +
    '</div>';
  card.innerHTML = html;

  card.querySelector('#accPopBack').addEventListener('click', function() { _accPopupGo('list'); });
  card.querySelector('#accPopCancel').addEventListener('click', function() { _accPopupGo('list'); });
  card.querySelector('#accPopConfirmRemove').addEventListener('click', function() {
    closeAccountPopup();
    performRemoveProfile(user.id);
  });
}

function gsiSignIn() {
  if (typeof firebase === 'undefined' || typeof firebase.auth !== 'function') {
    showToast('Firebase SDK not loaded. Refresh the page.', 'error');
    return;
  }
  if (!firebase.apps.length && typeof FIREBASE_CONFIG !== 'undefined') {
    firebase.initializeApp(FIREBASE_CONFIG);
  }
  var provider = new firebase.auth.GoogleAuthProvider();
  provider.addScope('profile');
  provider.addScope('email');
  firebase.auth().signInWithPopup(provider).then(function(result) {
    var user = result.user;
    if (!user) return;
    var gdata = {
      name: user.displayName || '',
      email: user.email || '',
      picture: user.photoURL || '',
      googleId: user.uid || ''
    };
    completeGoogleSignIn(gdata);
  }).catch(function(error) {
    if (error.code === 'auth/popup-closed-by-user') return;
    if (error.code === 'auth/unauthorized-domain') {
      showToast('Domain not authorized. Add this domain in Firebase Console \u2192 Authentication \u2192 Settings \u2192 Authorized domains.', 'error', 4000);
      return;
    }
    console.error('Google sign-in error:', error);
    showToast('Google sign-in failed: ' + (error.message || 'unknown error'), 'error');
  });
}

// Entry point for Google sign-in flows that already have the profile payload
// (login page, local-auth popup). Normalizes and delegates to the shared path.
function googleSignIn(gdata) {
  if (!gdata || !gdata.googleId) {
    showToast('Google sign-in failed: missing account id', 'error');
    return;
  }
  completeGoogleSignIn({
    name: gdata.name || '',
    email: gdata.email || '',
    picture: gdata.picture || '',
    googleId: gdata.googleId
  });
}

// Shared finish for every Google sign-in. Creates or reuses the Google-backed
// account, then activates it. While in a guest session, the guest's data is
// bled into the account first (account's own data wins on conflicts).
function completeGoogleSignIn(gdata) {
  var finish = function(targetId) {
    setActiveUserId(targetId);
    if (typeof state !== 'undefined') state.currentUserId = targetId;
    renderAuthUI();
    if (isLoginPage()) {
      location.href = 'index.html';
    } else {
      location.reload();
    }
  };
  var existing = localUsers.find(function(u) { return u.googleId === gdata.googleId; });
  if (existing) {
    if (isGuestMode()) {
      recordDeviceAccess(existing);
      bleedGuestDataInto(existing.id).then(function() { finish(existing.id); }).catch(function() { finish(existing.id); });
    } else {
      switchAccount(existing.id);
    }
    return;
  }
  var newUser = {
    id: generateId(),
    name: gdata.name || (gdata.email ? gdata.email.split('@')[0] : 'Google User'),
    email: gdata.email || '',
    picture: gdata.picture || '',
    googleId: gdata.googleId,
    _color: getColorForId(generateId())
  };
  migrateExistingData(newUser.id);
  recordDeviceAccess(newUser);
  localUsers.push(newUser);
  saveUsers();
  if (isGuestMode()) {
    bleedGuestDataInto(newUser.id).then(function() { finish(newUser.id); }).catch(function() { finish(newUser.id); });
  } else {
    finish(newUser.id);
  }
}

function _openImageDBByName(dbName) {
  return new Promise(function(resolve, reject) {
    var req = indexedDB.open(dbName, 1);
    req.onupgradeneeded = function(e) {
      var db = e.target.result;
      if (!db.objectStoreNames.contains('images')) db.createObjectStore('images');
    };
    req.onsuccess = function(e) { resolve(e.target.result); };
    req.onerror = function(e) { reject(e.target.error); };
  });
}

function _deleteImageDBByName(dbName) {
  try { indexedDB.deleteDatabase(dbName); } catch (e) {}
}

// Copy guest image entries the target account does not have yet, then remove
// the guest's image database so no blob storage stays behind.
function _bleedGuestImages(srcDbName, targetId) {
  return new Promise(function(resolve) {
    if (!srcDbName || !targetId) { resolve(); return; }
    var srcName = srcDbName;
    var dstName = 'haven-images-' + targetId;
    var src = null, dst = null;
    _openImageDBByName(srcName).then(function(db) {
      src = db;
      return _openImageDBByName(dstName);
    }).then(function(db) {
      dst = db;
      return new Promise(function(res2, rej2) {
        var tx = src.transaction('images', 'readonly');
        var store = tx.objectStore('images');
        var req = store.openCursor();
        var copied = 0;
        req.onsuccess = function(e) {
          var cursor = e.target.result;
          if (!cursor) { res2(copied); return; }
          var putTx = dst.transaction('images', 'readwrite');
          var dstStore = putTx.objectStore('images');
          var getReq = dstStore.get(cursor.key);
          getReq.onsuccess = function() {
            if (getReq.result === undefined || getReq.result === null) {
              dstStore.put(cursor.value, cursor.key);
              copied++;
            }
          };
          putTx.oncomplete = function() { cursor.continue(); };
          putTx.onerror = function() { cursor.continue(); };
        };
        req.onerror = function() { res2(copied); };
      });
    }).then(function() {
      try { if (src) src.close(); } catch (e) {}
      try { if (dst) dst.close(); } catch (e) {}
      _deleteImageDBByName(srcName);
      resolve();
    }).catch(function() {
      try { if (src) src.close(); } catch (e) {}
      try { if (dst) dst.close(); } catch (e) {}
      resolve();
    });
  });
}

// Move the active guest's data into the target account's namespace. The guest
// session is temporary, so its data follows into the account the guest signed
// in with. The account's own existing values always win: only keys the account
// does not have yet are filled from the guest. The guest profile (or raw
// session keys when the guest had no profile), its image database, and the
// guest flag are removed afterwards so nothing stays shared.
function bleedGuestDataInto(targetId) {
  return new Promise(function(resolve) {
    if (!targetId || !isGuestMode()) { resolve(); return; }
    var activeId = getActiveUserId();
    var guestUser = activeId ? localUsers.find(function(u) { return u.id === activeId && u.name === 'Guest'; }) : null;
    var targetPrefix = targetId + ':';
    var moved = 0;
    var keys = [];
    var guestPrefix = null;
    if (guestUser) {
      guestPrefix = guestUser.id + ':';
      for (var i = 0; i < __origLS.length; i++) {
        var key = __origLS.key(i);
        if (key && key.indexOf(guestPrefix) === 0) keys.push(key);
      }
    } else {
      for (var j = 0; j < __origLS.length; j++) {
        var rawKey = __origLS.key(j);
        if (rawKey && rawKey.indexOf('haven-') === 0 && rawKey.indexOf(':') === -1 &&
            rawKey.indexOf('haven-gsi-') !== 0 && rawKey !== 'haven-gsi-migrated' &&
            rawKey !== 'haven-device-id' && rawKey !== 'haven-device-label' &&
            rawKey !== 'haven-admin-password' && rawKey !== 'haven-guest-default-template') {
          keys.push(rawKey);
        }
      }
    }
    for (var k = 0; k < keys.length; k++) {
      var shortKey = guestPrefix ? keys[k].slice(guestPrefix.length) : keys[k];
      if (shortKey.indexOf('haven-gsi-') === 0 || shortKey === 'haven-gsi-migrated') continue;
      if (shortKey === 'haven-synced-at' || shortKey === 'haven-device-id' || shortKey === 'haven-device-label') continue;
      if (shortKey === 'haven-admin-password' || shortKey === 'haven-guest-default-template') continue;
      var existingVal = __origLS.getItem(targetPrefix + shortKey);
      if (existingVal === null || existingVal === undefined) {
        var val = __origLS.getItem(keys[k]);
        if (val !== null && val !== undefined) {
          __origLS.setItem(targetPrefix + shortKey, val);
          moved++;
        }
      }
      __origLS.removeItem(keys[k]);
    }

    var finishLS = function() {
      if (guestUser) {
        localUsers = localUsers.filter(function(u) { return u.id !== guestUser.id; });
        saveUsers();
      }
      try { sessionStorage.removeItem('haven-guest'); } catch (e) {}
      try {
        if (typeof firebase !== 'undefined' && typeof firebase.auth === 'function' && firebase.apps && firebase.apps.length) {
          firebase.auth().signOut().catch(function() {});
        }
      } catch (e) {}
      if (moved > 0 && typeof showToast === 'function') {
        showToast('Guest data moved to your account (' + moved + ' items)', 'info', 3000);
      }
      resolve();
    };

    var guestImgDb = guestUser ? ('haven-images-' + guestUser.id) : (activeId ? ('haven-images-' + activeId) : 'haven-images');
    _bleedGuestImages(guestImgDb, targetId).then(finishLS).catch(finishLS);
  });
}

function guestSignOut() {
  sessionStorage.removeItem('haven-guest');
  try {
    if (typeof firebase !== 'undefined' && firebase.auth && firebase.apps.length) {
      firebase.auth().signOut().catch(function() {});
    }
  } catch (e) {}
  var others = localUsers.filter(function(u) { return u.name !== 'Guest'; });
  if (others.length > 0) {
    switchAccount(others[0].id);
    return;
  }
  var activeId = getActiveUserId();
  var activeUser = localUsers.find(function(u) { return u.id === activeId; });
  if (activeUser && activeUser.name === 'Guest') {
    localUsers = localUsers.filter(function(u) { return u.id !== activeId; });
    saveUsers();
    setActiveUserId(null);
    if (typeof state !== 'undefined') state.currentUserId = null;
    location.href = 'login.html';
    return;
  }
  location.href = 'login.html';
}





// ─── Local profile ────────────────────────────────────
function createLocalProfile(name) {
  if (!name || !name.trim()) return;
  name = name.trim();
  if (name === 'Guest') {
    var existingGuest = localUsers.find(function(u) { return u.name === 'Guest'; });
    if (existingGuest) {
      recordDeviceAccess(existingGuest);
      setActiveUserId(existingGuest.id);
      if (typeof state !== 'undefined') state.currentUserId = existingGuest.id;
      renderAuthUI();
      if (isLoginPage()) location.href = 'index.html';
      else location.reload();
      return;
    }
  }
  var user = { id: generateId(), name: name, _color: getColorForId(generateId()) };
  migrateExistingData(user.id);
  recordDeviceAccess(user);
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
  recordDeviceAccess(user);
  setActiveUserId(id);
  if (typeof state !== 'undefined') state.currentUserId = id;
  renderAuthUI();
  showToast('Switched to ' + user.name, 'info', 1500);
  location.reload();
}

function removeProfile(id) {
  var user = localUsers.find(function(u) { return u.id === id; });
  if (!user) return;
  var isActive = getActiveUserId() === id;
  var remaining = localUsers.filter(function(u) { return u.id !== id; });
  var msg = 'Remove "' + user.name + '" and all their data?';
  if (isActive && remaining.length > 0) msg += '\n\nYou will be switched to "' + remaining[0].name + '".';
  if (!confirm(msg)) return;
  performRemoveProfile(id);
}

function performRemoveProfile(id) {
  var user = localUsers.find(function(u) { return u.id === id; });
  if (!user) return;
  var isActive = getActiveUserId() === id;
  // Sign out of Firebase Auth if this was a Google-authenticated user
  try {
    if (typeof firebase !== 'undefined' && typeof firebase.auth === 'function' && firebase.apps && firebase.apps.length) {
      firebase.auth().signOut().catch(function() {});
    }
  } catch (e) {}
  var prefix = user.id + ':';
  var doomed = [];
  try {
    // Collect first, then remove — removing during iteration shifts the raw
    // store's live length and permanently skips ~half the keys.
    for (var i = 0; i < __origLS.length; i++) {
      var key = __origLS.key(i);
      if (key && key.indexOf(prefix) === 0) doomed.push(key);
    }
    for (var j = 0; j < doomed.length; j++) __origLS.removeItem(doomed[j]);
  } catch (e) { /* ignore */ }
  _deleteImageDBByName('haven-images-' + user.id);
  localUsers = localUsers.filter(function(u) { return u.id !== id; });
  saveUsers();
  if (isActive) {
    if (localUsers.length > 0) {
      var next = localUsers[0];
      setActiveUserId(next.id);
      if (typeof state !== 'undefined') state.currentUserId = next.id;
    } else {
      setActiveUserId(null);
      if (typeof state !== 'undefined') state.currentUserId = null;
      try { sessionStorage.removeItem('haven-guest'); } catch (e) {}
    }
  }
  renderAuthUI();
  if (isActive && localUsers.length > 0) {
    showToast('Switched to ' + localUsers[0].name, 'info', 1500);
    setTimeout(function() { location.reload(); }, 700);
  } else if (isActive) {
    location.href = 'login.html';
  } else {
    showToast('Profile removed', 'info', 1500);
    setTimeout(function() { location.reload(); }, 700);
  }
}

function migrateExistingData(id) {
  var prefix = id + ':';
  try { if (__origLS.getItem('haven-gsi-migrated') === '1') return; } catch (e) { return; }
  var keys = [];
  for (var i = 0; i < __origLS.length; i++) {
    var key = __origLS.key(i);
    if (key && key.indexOf('haven-') === 0 && key.indexOf('haven-gsi-') !== 0 && key.indexOf(prefix) !== 0 && key.indexOf(':') === -1) {
      keys.push(key);
    }
  }
  for (var j = 0; j < keys.length; j++) {
    if (keys[j].indexOf('image') !== -1) continue; // skip image data from migration
    var val = __origLS.getItem(keys[j]);
    try { if (val) __origLS.setItem(prefix + keys[j], val); } catch (e) {}
  }
  try { __origLS.setItem('haven-gsi-migrated', '1'); } catch (e) {}
}

function removeAllProfiles() {
  if (!confirm('Remove ALL accounts and data from this device?\n\nThis cannot be undone.')) return;
  try {
    if (typeof firebase !== 'undefined' && typeof firebase.auth === 'function' && firebase.apps && firebase.apps.length) {
      firebase.auth().signOut().catch(function() {});
    }
  } catch (e) {}
  localUsers.forEach(function(u) {
    var prefix = u.id + ':';
    var keysToRemove = [];
    for (var i = 0; i < __origLS.length; i++) {
      var key = __origLS.key(i);
      if (key && key.indexOf(prefix) === 0) keysToRemove.push(key);
    }
    for (var j = 0; j < keysToRemove.length; j++) __origLS.removeItem(keysToRemove[j]);
    try { _deleteImageDBByName('haven-images-' + u.id); } catch(e) {}
  });
  localUsers = [];
  saveUsers();
  try { localStorage.removeItem(AUTH_ACTIVE_KEY); } catch (e) {}
  try { sessionStorage.removeItem('haven-guest'); } catch (e) {}
  try { localStorage.removeItem('haven-gsi-migrated'); } catch (e) {}
  if (typeof state !== 'undefined') {
    state.currentUserId = null;
    state.localUsers = [];
  }
  closeAccountPopup();
  location.href = 'login.html';
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
  if (sessionStorage.getItem('haven-guest') === '1') return true;
  try {
    if (typeof firebase !== 'undefined' && firebase.auth && firebase.auth().currentUser && firebase.auth().currentUser.isAnonymous) return true;
  } catch (e) {}
  return false;
}

// ─── Device helpers ─────────────────────────
var _deviceId = null;
var _deviceLabel = null;
function getDeviceId() {
  if (_deviceId) return _deviceId;
  var d = null;
  try { d = __origLS.getItem('haven-device-id'); } catch (e) {}
  if (!d) { d = 'dev' + Date.now().toString(36) + Math.random().toString(36).slice(2,6); try { __origLS.setItem('haven-device-id', d); } catch (e) { try { sessionStorage.setItem('haven-device-id', d); } catch (e2) {} } }
  _deviceId = d;
  return d;
}
function getDeviceLabel() {
  if (_deviceLabel) return _deviceLabel;
  var stored = null;
  try { stored = __origLS.getItem('haven-device-label'); } catch (e) {}
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
  try { __origLS.setItem('haven-device-label', label); }
  catch (e) { try { sessionStorage.setItem('haven-device-label', label); } catch (e2) {} }
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
    { id: 'language', label: 'Language & Format', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg>' },
    { id: 'behavior', label: 'General', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/></svg>' },
    { id: 'sound', label: 'Sound & Feedback', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 010 14.14"/><path d="M15.54 8.46a5 5 0 010 7.07"/></svg>' },
    { id: 'shortcuts', label: 'Shortcuts', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M6 8h.01M10 8h.01M14 8h.01M18 8h.01M6 12h.01M18 12h.01M6 16h.01M18 16h.01M9 16h6"/></svg>' },
    { id: 'ai', label: 'AI Assistant', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a4 4 0 014 4c0 2-2 3-2 3h-4s-2-1-2-3a4 4 0 014-4z"/><path d="M8 15h8v2a2 2 0 01-2 2h-4a2 2 0 01-2-2v-2z"/><line x1="12" y1="19" x2="12" y2="22"/></svg>' },
    { id: 'privacy', label: 'Storage & Privacy', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/></svg>' },
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
    case 'language': renderLanguageSettings(content); break;
    case 'behavior': renderBehaviorSettings(content); break;
    case 'sound': renderSoundSettings(content); break;
    case 'shortcuts': renderShortcutsSettings(content); break;
    case 'ai': renderAISettings(content); break;
    case 'privacy': renderPrivacySettings(content); break;
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

  // Avatar + profile fields
  var avatarHtml = '';
  var connectedHtml = '';
  if (guest) {
    avatarHtml = '<div class="set-avatar-initials" style="background:#fff;color:#3f3f3a">G</div>' +
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
    listHtml += '<div class="set-acc-item"><div class="set-acc-initials" style="background:#fff;color:#3f3f3a">G</div><div class="set-acc-info"><div class="set-acc-name" style="opacity:0.5">Guest</div></div></div>';
  }


  el.innerHTML =
    '<h3>My Account</h3>' +
    // Editable profile
    '<div class="set-group">' +
      '<div class="set-avatar-row">' + avatarHtml + '</div>' +
      (connectedHtml || '') +
    '</div>' +
    '<div class="set-divider"></div>' +
    '<div class="set-group">' +
      '<div class="set-row">' +
        '<div class="set-row-left"><div class="set-row-label">Timezone</div><div class="set-row-desc">Detected from browser</div></div>' +
        '<div class="set-row-control"><div class="set-readonly">' + escapeHtml(tz) + '</div></div>' +
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
      
      '<button class="set-link-btn" id="setAddLocal"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>Add local profile</button>' +
    '</div>' +
    '<div class="set-divider"></div>' +
    // Sign out
    '<div class="set-logout">' +
      '<button class="set-btn set-btn-danger" id="setSignOut">Sign Out</button>' +
    '</div>';
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

  // Export
  document.getElementById('accExport')?.addEventListener('click', function() {
    if (typeof exportAllData === 'function') { exportAllData(); return; }
    // Fallback: collect all storage keys (active account, prefix-stripped)
    var data = {};
    var front = (typeof getStoragePrefix === 'function') ? getStoragePrefix() : '';
    for (var i = 0; i < __origLS.length; i++) {
      var k = __origLS.key(i);
      if (!k) continue;
      var short = front && k.indexOf(front) === 0 ? k.slice(front.length) : (front ? null : k);
      if (!short) continue;
      if (short.indexOf('haven-') !== 0) continue;
      var rawv = __origLS.getItem(k);
      if (rawv === null) continue;
      try { data[short] = JSON.parse(rawv); } catch (e) { data[short] = rawv; }
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
    if (!confirmAction('This will permanently delete ALL your data (tasks, habits, goals, finance, gallery, settings).\n\nThis cannot be undone. Are you sure?')) return;
    if (!confirmAction('Final confirmation: delete all data?')) return;
    var keys = [];
    // Physical keys are '{userId}:haven-...' when signed in — match the
    // current account's prefix (or unprefixed guest keys) via the raw store.
    var pre = (typeof getStoragePrefix === 'function') ? getStoragePrefix() : '';
    for (var i = 0; i < __origLS.length; i++) {
      var k = __origLS.key(i);
      if (!k) continue;
      var short = pre && k.indexOf(pre) === 0 ? k.slice(pre.length) : k;
      if (short.indexOf('haven-') !== 0) continue;
      if (short.indexOf('haven-gsi-') === 0) continue;
      keys.push(k);
    }
    keys.forEach(function(k) { try { __origLS.removeItem(k); } catch (e) { /* ignore */ } });
    if (typeof _deleteImageDBByName === 'function' && typeof getStoragePrefix === 'function') {
      var _pre = getStoragePrefix();
      if (_pre) { try { _deleteImageDBByName('haven-images-' + _pre.slice(0, -1)); } catch (e) {} }
    }
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
    document.getElementById('setAddLocal')?.addEventListener('click', function() { closeSettingsPanel(); gsiSignIn(); });
  document.getElementById('setSignOut')?.addEventListener('click', function() { closeSettingsPanel(); removeProfile(activeId); });
}

function renderAppearanceSettings(el) {
  var prefersDark = typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches;
  var isDark = state.darkMode === null ? prefersDark : state.darkMode;
  var accent = typeof state !== 'undefined' && state.accentColor ? state.accentColor : null;

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
      '<div class="set-acc-body"></div>' +
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

  var accBody = el.querySelector('.set-acc-body');
  if (accBody && typeof renderAccentColorPicker === 'function') {
    renderAccentColorPicker(accBody);
  }

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
    '<h3>AI Assistant</h3>' +
    '<div class="set-desc">Configure the AI assistant provider and API key</div>' +
    '<div class="set-group">' +
      '<div class="set-row">' +
        '<div class="set-row-left"><div class="set-row-label">Enable AI Assistant</div><div class="set-row-desc">Turn the assistant on or off app-wide</div></div>' +
        '<button class="set-toggle' + (state.aiEnabled !== false ? ' on' : '') + '" id="setAiEnabledToggle"></button>' +
      '</div>' +
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
      '<div class="set-row-label set-acc-header" onclick="var n=this.nextElementSibling;n.classList.toggle(\'collapsed\');this.classList.toggle(\'collapsed\')">PROFILE &amp; LEARNING <span class="set-acc-toggle">\u203A</span></div>' +
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

  document.getElementById('setAiEnabledToggle').addEventListener('click', function() {
    state.aiEnabled = !(state.aiEnabled !== false);
    this.classList.toggle('on', state.aiEnabled);
    saveState();
  });

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

function renderLanguageSettings(el) {
  var savedLang = 'en'; try { savedLang = localStorage.getItem('haven-language') || 'en'; } catch(e) {}
  var savedWeekStart = 'monday'; try { savedWeekStart = localStorage.getItem('haven-week-start') || 'monday'; } catch(e) {}
  var savedTimeFormat = '12h'; try { savedTimeFormat = localStorage.getItem('haven-time-format') || '12h'; } catch(e) {}

  el.innerHTML =
    '<h3>Language & Format</h3>' +
    '<div class="set-desc">Choose how the app displays language and time</div>' +
    '<div class="set-group">' +
      '<div class="set-row">' +
        '<div class="set-row-left"><div class="set-row-label">Language</div><div class="set-row-desc">UI language</div></div>' +
        '<div class="set-row-control"><select class="set-select" id="setLang"><option value="en">' + t('lang.en') + '</option><option value="id">' + t('lang.id') + '</option><option value="zh">' + t('lang.zh') + '</option></select></div>' +
      '</div>' +
      '<div class="set-row">' +
        '<div class="set-row-left"><div class="set-row-label">Week starts on</div><div class="set-row-desc">First day of the week on calendars</div></div>' +
        '<div class="set-row-control"><select class="set-select" id="setWeekStart"><option value="monday">Monday</option><option value="sunday">Sunday</option></select></div>' +
      '</div>' +
      '<div class="set-row">' +
        '<div class="set-row-left"><div class="set-row-label">Time format</div><div class="set-row-desc">12-hour or 24-hour clock</div></div>' +
        '<div class="set-row-control"><select class="set-select" id="setTimeFormat"><option value="12h">12h</option><option value="24h">24h</option></select></div>' +
      '</div>' +
    '</div>';

  document.getElementById('setLang').value = savedLang;
  document.getElementById('setWeekStart').value = savedWeekStart;
  document.getElementById('setTimeFormat').value = savedTimeFormat;

  document.getElementById('setLang').addEventListener('change', function() {
    if (typeof safeSetItem === 'function') safeSetItem('haven-language', this.value);
    else try { localStorage.setItem('haven-language', this.value); } catch (e) {}
    if (typeof applyLanguage === 'function') applyLanguage(this.value);
  });
  document.getElementById('setWeekStart').addEventListener('change', function() {
    if (typeof safeSetItem === 'function') safeSetItem('haven-week-start', this.value);
    else try { localStorage.setItem('haven-week-start', this.value); } catch (e) {}
  });
  document.getElementById('setTimeFormat').addEventListener('change', function() {
    if (typeof safeSetItem === 'function') safeSetItem('haven-time-format', this.value);
    else try { localStorage.setItem('haven-time-format', this.value); } catch (e) {}
  });
}

function renderBehaviorSettings(el) {
  el.innerHTML =
    '<h3>General</h3>' +
    '<div class="set-desc">App-wide behavior and interface density</div>' +
    '<div class="set-group">' +
      '<div class="set-row">' +
        '<div class="set-row-left"><div class="set-row-label">Animations</div><div class="set-row-desc">Motion effects across the app</div></div>' +
        '<button class="set-toggle' + (state.animations !== false ? ' on' : '') + '" id="setAnimationsToggle"></button>' +
      '</div>' +
      '<div class="set-row">' +
        '<div class="set-row-left"><div class="set-row-label">Compact mode</div><div class="set-row-desc">Tighter spacing throughout the app</div></div>' +
        '<button class="set-toggle' + (state.compactMode ? ' on' : '') + '" id="setCompactToggle"></button>' +
      '</div>' +
      '<div class="set-row">' +
        '<div class="set-row-left"><div class="set-row-label">Confirm before deleting</div><div class="set-row-desc">Ask for confirmation on destructive actions</div></div>' +
        '<button class="set-toggle' + (state.confirmBeforeDelete !== false ? ' on' : '') + '" id="setConfirmToggle"></button>' +
      '</div>' +
    '</div>';

  document.getElementById('setAnimationsToggle').addEventListener('click', function() {
    state.animations = !(state.animations !== false);
    this.classList.toggle('on', state.animations);
    applyBehaviorClasses();
    saveState();
  });
  document.getElementById('setCompactToggle').addEventListener('click', function() {
    state.compactMode = !state.compactMode;
    this.classList.toggle('on', state.compactMode);
    applyBehaviorClasses();
    saveState();
  });
  document.getElementById('setConfirmToggle').addEventListener('click', function() {
    state.confirmBeforeDelete = !(state.confirmBeforeDelete !== false);
    this.classList.toggle('on', state.confirmBeforeDelete);
    saveState();
  });
}

function renderSoundSettings(el) {
  var chimeCategories = [
    { name:'Bells', keys:['classic','dingdong','elegant','jingle','phone'] },
    { name:'Notifications', keys:['notif','notif_klick','notif_bim','notif_good'] },
    { name:'UI', keys:['click','soft','triple','warp'] },
    { name:'Achievement', keys:['modern','success','level_done'] }
  ];
  var favorites = [];
  try { favorites = JSON.parse(localStorage.getItem('haven-chime-favorites') || '[]'); } catch(e) {}

  function chimeChip(k) {
    var c = CHIME_SOUNDS[k];
    if (!c) return '';
    var active = (state.chimeSound || 'success') === k;
    var isFav = favorites.indexOf(k) !== -1;
    return '<button class="ch-btn' + (active ? ' ch-btn-on' : '') + '" data-chime="' + k + '" style="display:inline-flex;align-items:center;justify-content:center;padding:6px 10px;border:1px solid var(--border-subtle);background:var(--bg-secondary);border-radius:6px;font-size:.78rem;color:var(--text-primary);cursor:pointer;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' +
      (active ? '\u2713 ' : '') +
      '<span>' + c.label + '</span>' +
    '</button>';
  }

  var chimeHtml = chimeCategories.map(function(cat) {
    var chips = cat.keys.map(chimeChip).join('');
    return '<div class="ch-cat"><div class="ch-cat-label">' + cat.name + '</div><div class="ch-cat-grid">' + chips + '</div></div>';
  }).join('');

  var favHtml = '';
  if (favorites.length > 0) {
    var favChips = favorites.filter(function(k) { return CHIME_SOUNDS[k]; }).map(chimeChip).join('');
    if (favChips) favHtml = '<div class="ch-cat"><div class="ch-cat-label">Favorites</div><div class="ch-cat-grid">' + favChips + '</div></div>';
  }

  var vol = typeof state.chimeVolume === 'number' && isFinite(state.chimeVolume) ? Math.max(0, Math.min(1, state.chimeVolume)) : 0.5;
  var volPct = Math.round(vol * 100);
  var volIcon = vol === 0 ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>' :
                 vol < 0.5 ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>' :
                 '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>';

  el.innerHTML =
    '<h3>Sound & Feedback</h3>' +
    '<div class="set-desc">Audio, notifications, and vibration</div>' +
    '<div class="set-group">' +
      '<div class="set-row">' +
        '<div class="set-row-left"><div class="set-row-label">Pomodoro sound</div><div class="set-row-desc">Play a chime when a timer completes</div></div>' +
        '<button class="set-toggle' + (state.soundEnabled !== false ? ' on' : '') + '" id="setSoundToggle"></button>' +
      '</div>' +
    '</div>' +

    '<div class="set-group" style="margin-top:10px">' +
      '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">' +
        '<div class="set-row-label">Completion chime</div>' +
        '<button id="chimeTestAll" class="ch-test-all" title="Test all sounds">Test All</button>' +
      '</div>' +
      '<div id="chimePicker" class="chime-picker">' + favHtml + chimeHtml + '</div>' +
    '</div>' +

    '<div class="set-group" style="margin-top:10px">' +
      '<div class="set-row" style="border:none">' +
        '<div class="set-row-left"><div class="set-row-label">Volume</div></div>' +
        '<div class="ch-vol-wrap">' +
          '<span class="ch-vol-icon" id="chVolIcon">' + volIcon + '</span>' +
          '<div class="ch-vol-bar-wrap"><div class="ch-vol-bar" id="chVolBar" style="width:' + volPct + '%"></div></div>' +
          '<span class="ch-vol-val" id="setChimeVolumeVal">' + volPct + '%</span>' +
        '</div>' +
      '</div>' +
      '<input type="range" id="setChimeVolume" min="0" max="1" step="0.01" value="' + vol.toFixed(2) + '" style="width:100%;margin-top:4px;accent-color:var(--accent)">' +
      '<div class="ch-active-label" id="setChimeName">' + (CHIME_SOUNDS[state.chimeSound] ? CHIME_SOUNDS[state.chimeSound].label : 'Success') + '</div>' +
    '</div>' +

    '<div class="set-group" style="margin-top:10px">' +
      '<div class="set-row">' +
        '<div class="set-row-left"><div class="set-row-label">Browser notifications</div><div class="set-row-desc">Reminders for tasks and timers</div></div>' +
        '<button class="set-toggle' + (state.notifications !== false ? ' on' : '') + '" id="setNotifToggle"></button>' +
      '</div>' +
      '<div class="set-row">' +
        '<div class="set-row-left"><div class="set-row-label">Vibration</div><div class="set-row-desc">Haptic feedback on supported devices</div></div>' +
        '<button class="set-toggle' + (state.vibrate !== false ? ' on' : '') + '" id="setVibrateToggle"></button>' +
      '</div>' +
      '<div class="set-row">' +
        '<div class="set-row-left"><div class="set-row-label">Toast duration</div><div class="set-row-desc">How long notifications stay on screen</div></div>' +
        '<div class="set-row-control"><select class="set-select" id="setToastDur"><option value="2000">2s</option><option value="4000">4s</option><option value="6000">6s</option></select></div>' +
      '</div>' +
    '</div>';

  document.getElementById('setSoundToggle').addEventListener('click', function() {
    state.soundEnabled = !(state.soundEnabled !== false);
    this.classList.toggle('on', state.soundEnabled);
    saveState();
  });

  var chimePreview = new Audio();
  var _testAllTimer = null;

  function playPreview(k, cb) {
    if (!CHIME_SOUNDS[k]) return;
    chimePreview.src = CHIME_SOUNDS[k].file;
    chimePreview.volume = state.chimeVolume;
    chimePreview.currentTime = 0;
    var pr = chimePreview.play();
    if (pr && pr.catch) pr.catch(function() {});
    if (cb) chimePreview.onended = cb;
  }

  function selectChime(key) {
    if (!CHIME_SOUNDS[key]) return;
    state.chimeSound = key;
    document.querySelectorAll('.ch-btn').forEach(function(b) {
      b.classList.remove('ch-btn-on');
      var txt = b.getAttribute('data-chime');
      b.textContent = CHIME_SOUNDS[txt] ? CHIME_SOUNDS[txt].label : txt;
    });
    var btn = document.querySelector('.ch-btn[data-chime="' + key + '"]');
    if (btn) {
      btn.classList.add('ch-btn-on');
      btn.textContent = '\u2713 ' + CHIME_SOUNDS[key].label;
    }
    saveState();
    playChime();
    var nameEl = document.getElementById('setChimeName');
    if (nameEl) nameEl.textContent = CHIME_SOUNDS[key].label;
  }

  document.getElementById('chimePicker').addEventListener('click', function(e) {
    var btn = e.target.closest('.ch-btn');
    if (!btn) return;
    var key = btn.getAttribute('data-chime');
    if (!key) return;
    playPreview(key);
    selectChime(key);
  });

  var testAllBtn = document.getElementById('chimeTestAll');
  if (testAllBtn) {
    testAllBtn.addEventListener('click', function() {
      if (_testAllTimer) { clearInterval(_testAllTimer); _testAllTimer = null; testAllBtn.textContent = 'Test All'; return; }
      var allKeys = [];
      chimeCategories.forEach(function(cat) { cat.keys.forEach(function(k) { allKeys.push(k); }); });
      var i = 0;
      testAllBtn.textContent = 'Stop';
      function playNext() {
        if (i >= allKeys.length) { _testAllTimer = null; testAllBtn.textContent = 'Test All'; return; }
        var card = document.querySelector('.ch-btn[data-chime="' + allKeys[i] + '"]');
        if (card) { card.classList.add('ch-testing'); setTimeout(function() { card.classList.remove('ch-testing'); }, 600); }
        playPreview(allKeys[i], function() { i++; playNext(); });
      }
      playNext();
    });
  }

  var volEl = document.getElementById('setChimeVolume');
  var volValEl = document.getElementById('setChimeVolumeVal');
  var volBar = document.getElementById('chVolBar');
  var volIconEl = document.getElementById('chVolIcon');
  function updateVolIcon(v) {
    if (!volIconEl) return;
    volIconEl.innerHTML = v === 0 ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>' :
      v < 0.5 ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>' :
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>';
  }
  if (volEl) {
    volEl.addEventListener('input', function() {
      var v = parseFloat(this.value);
      if (!isFinite(v)) { v = 0.5; }
      v = Math.max(0, Math.min(1, v));
      state.chimeVolume = v;
      if (volValEl) volValEl.textContent = Math.round(v * 100) + '%';
      if (volBar) volBar.style.width = Math.round(v * 100) + '%';
      updateVolIcon(v);
      saveState();
    });
  }

  document.getElementById('setNotifToggle').addEventListener('click', function() {
    state.notifications = !(state.notifications !== false);
    this.classList.toggle('on', state.notifications);
    if (state.notifications) requestNotifPermission();
    saveState();
  });
  document.getElementById('setVibrateToggle').addEventListener('click', function() {
    state.vibrate = !(state.vibrate !== false);
    this.classList.toggle('on', state.vibrate);
    saveState();
  });
  document.getElementById('setToastDur').value = String(state.toastDuration || 4000);
  document.getElementById('setToastDur').addEventListener('change', function() {
    state.toastDuration = parseInt(this.value, 10) || 4000;
    saveState();
  });
}

function renderShortcutsSettings(el) {
  var mk = function(k, d) { return '<div class="shortcut-row"><kbd class="shortcut-key">' + k + '</kbd><span class="shortcut-desc">' + d + '</span></div>'; };
  var items = [
    mk(shortcutDisplay('I'), 'Open AI Assistant'),
    mk('?', 'Toggle help panel'),
    mk(shortcutDisplay('K'), 'Open AI chat'),
    mk('Q', 'Quick new task'),
    mk('T', 'Toggle dark/light theme'),
    mk('F', 'Toggle focus mode'),
    mk('Ctrl+K', 'Open command palette'),
    mk('Ctrl+Z / Ctrl+Shift+Z', 'Undo / Redo (hub)'),
    mk('Esc', 'Close any open modal')
  ];
  if (typeof state !== 'undefined' && state.editMode) {
    items.push(mk('Ctrl+D', 'Duplicate selected bubble'), mk('\u2191 \u2193 \u2190 \u2192', 'Nudge bubble'));
  }
  el.innerHTML =
    '<h3>Shortcuts</h3>' +
    '<div class="set-desc">Available keyboard shortcuts</div>' +
    '<div class="set-group">' +
      '<div class="set-row-label" style="font-size:0.72rem;color:var(--text-tertiary);margin-bottom:6px">KEYBOARD</div>' +
      items.join('') +
    '</div>';
}

function renderPrivacySettings(el) {
  var keys = [];
  var front = (typeof getStoragePrefix === 'function') ? getStoragePrefix() : '';
  for (var i = 0; i < __origLS.length; i++) {
    var k = __origLS.key(i);
    if (!k) continue;
    if (front) {
      if (k.indexOf(front) === 0) keys.push(k.slice(front.length));
    } else if (k.indexOf('haven-') === 0 && k.indexOf(':') === -1) {
      keys.push(k);
    }
  }
  var totalBytes = 0;
  keys.forEach(function(k) { try { totalBytes += (__origLS.getItem(front + k) || '').length; } catch(e) {} });
  var kb = totalBytes > 1024 ? (totalBytes / 1024).toFixed(1) + ' KB' : totalBytes + ' B';

  var listHtml = keys.length === 0
    ? '<div class="set-empty">No stored data found</div>'
    : keys.map(function(k) {
        var len = 0; try { len = (localStorage.getItem(k) || '').length; } catch(e) {}
        var size = len > 1024 ? (len / 1024).toFixed(1) + ' KB' : len + ' B';
        return '<div class="set-stor-item" data-stor-key="' + escapeHtml(k) + '">' +
          '<div class="set-stor-body"><div class="set-stor-key">' + escapeHtml(k) + '</div>' +
          '<div class="set-stor-size">' + size + '</div></div>' +
          '<button class="set-stor-del" data-stor-del="' + escapeHtml(k) + '">\u2715</button></div>';
      }).join('');

  el.innerHTML =
    '<h3>Storage & Privacy</h3>' +
    '<div class="set-desc">View and manage the data stored on this device</div>' +
    '<div class="set-group">' +
      '<div class="set-row">' +
        '<div class="set-row-left"><div class="set-row-label">Local storage</div><div class="set-row-desc">' + keys.length + ' keys \u00B7 ' + kb + '</div></div>' +
        '<button class="set-btn" id="privacyRefresh">Refresh</button>' +
      '</div>' +
    '</div>' +
    '<div class="set-divider"></div>' +
    '<div class="set-group">' +
      '<div class="set-row-label" style="font-size:0.72rem;color:var(--text-tertiary);margin-bottom:6px">CLEAR DATA</div>' +
      '<div class="set-row">' +
        '<div class="set-row-left"><div class="set-row-label">Tasks & schedule</div></div>' +
        '<button class="set-btn" data-clear="tasks">Clear</button>' +
      '</div>' +
      '<div class="set-row">' +
        '<div class="set-row-left"><div class="set-row-label">Categories & tags</div></div>' +
        '<button class="set-btn" data-clear="categories">Clear</button>' +
      '</div>' +
      '<div class="set-row">' +
        '<div class="set-row-left"><div class="set-row-label">Sleep & routine</div></div>' +
        '<button class="set-btn" data-clear="sleep">Clear</button>' +
      '</div>' +
      '<div class="set-row">' +
        '<div class="set-row-left"><div class="set-row-label">Finance</div></div>' +
        '<button class="set-btn" data-clear="finance">Clear</button>' +
      '</div>' +
      '<div class="set-row">' +
        '<div class="set-row-left"><div class="set-row-label">Gallery images</div></div>' +
        '<button class="set-btn" data-clear="gallery">Clear</button>' +
      '</div>' +
    '</div>' +
    '<div class="set-divider"></div>' +
    '<div class="set-group">' +
      '<div class="set-row-label" style="font-size:0.72rem;color:var(--text-tertiary);margin-bottom:6px">STORAGE</div>' +
      listHtml +
    '</div>';

  var clearGroups = {
    tasks: ['haven-schedule-tasks'],
    categories: ['haven-schedule-categories', 'haven-subcategories', 'haven-custom-tags', 'haven-card-colors'],
    sleep: ['haven-schedule-sleep', 'haven-schedule-sleep-targets', 'haven-schedule-routine'],
    finance: ['haven-schedule-finance', 'haven-piggybank', 'haven-wallet'],
    gallery: ['haven-gallery-layout']
  };

  el.querySelectorAll('[data-clear]').forEach(function(btn) {
    btn.addEventListener('click', function() {
      var group = btn.dataset.clear;
      var list = clearGroups[group] || [];
      var found = list.filter(function(k) { return localStorage.getItem(k) !== null; });
      if (!confirmAction('Clear ' + group + ' data? This cannot be undone.')) return;
      found.forEach(function(k) { try { localStorage.removeItem(k); } catch(e) {} });
      if (group === 'tasks') { try { loadState(); } catch(e) {} }
      if (typeof showToast === 'function') showToast(found.length > 0 ? group + ' data cleared' : 'Nothing to clear');
      renderPrivacySettings(el);
    });
  });

  el.querySelectorAll('[data-stor-del]').forEach(function(btn) {
    btn.addEventListener('click', function() {
      var k = btn.dataset.storDel;
      if (!confirmAction('Delete "' + k + '"? This cannot be undone.')) return;
      try { localStorage.removeItem(k); } catch(e) {}
      if (k === 'haven-schedule-settings') { try { loadState(); } catch(e) {} }
      if (typeof showToast === 'function') showToast('Deleted ' + k);
      renderPrivacySettings(el);
    });
  });

  document.getElementById('privacyRefresh')?.addEventListener('click', function() { renderPrivacySettings(el); });
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
window.openSettingsBubble = openSettingsBubble;
