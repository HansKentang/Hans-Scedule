// ─── Google Sign-In ──────────────────────────────────────
const GSI_ACCOUNTS_KEY = 'haven-gsi-accounts';
const GSI_ACTIVE_KEY = 'haven-gsi-active';
const GSI_CLIENT_ID = '111398603822-qucnj9i3bipbcbgjmmr98b43gjusk4ph.apps.googleusercontent.com';

let gsiAccounts = [];
let gsiInitialized = false;

function loadGSIAccounts() {
  try { gsiAccounts = JSON.parse(localStorage.getItem(GSI_ACCOUNTS_KEY) || '[]'); } catch (e) { gsiAccounts = []; }
}

function saveGSIAccounts() {
  localStorage.setItem(GSI_ACCOUNTS_KEY, JSON.stringify(gsiAccounts));
}

function getGSIActiveSub() {
  try { return localStorage.getItem(GSI_ACTIVE_KEY); } catch (e) { return null; }
}

function setGSIActiveSub(sub) {
  if (sub) { localStorage.setItem(GSI_ACTIVE_KEY, sub); }
  else { localStorage.removeItem(GSI_ACTIVE_KEY); }
}

function renderGSIUI() {
  const container = document.getElementById('gsiContainer');
  if (!container) return;
  const activeSub = getGSIActiveSub();
  const activeAccount = gsiAccounts.find(a => a.sub === activeSub);

  if (activeAccount) {
    container.innerHTML = `
      <div class="gsi-avatar-wrap">
        <img class="gsi-avatar" src="${activeAccount.picture}" alt="${escapeHtml(activeAccount.name)}" title="${escapeHtml(activeAccount.name)}">
        <div class="gsi-avatar-name">${escapeHtml(activeAccount.name)}</div>
        <div class="gsi-avatar-dropdown" id="gsiDropdown">
          ${gsiAccounts.map(a => `
            <div class="gsi-dd-item${a.sub === activeSub ? ' active' : ''}" data-gsi-switch="${a.sub}">
              <img class="gsi-dd-avatar" src="${escapeHtml(a.picture)}" alt="">
              <span class="gsi-dd-name">${escapeHtml(a.name)}</span>
              <span class="gsi-dd-email">${escapeHtml(a.email)}</span>
            </div>
          `).join('')}
          <div class="gsi-dd-divider"></div>
          <div class="gsi-dd-item" id="gsiAddAccountBtn">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            <span>Add account</span>
          </div>
          <div class="gsi-dd-item danger" id="gsiSignOutBtn">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            <span>Sign out</span>
          </div>
        </div>
      </div>`;

    container.querySelector('#gsiDropdown');
    // Toggle dropdown on avatar click
    const avatar = container.querySelector('.gsi-avatar');
    const dropdown = container.querySelector('#gsiDropdown');
    avatar.addEventListener('click', (e) => {
      e.stopPropagation();
      dropdown.classList.toggle('open');
    });
    dropdown.querySelectorAll('[data-gsi-switch]').forEach(el => {
      el.addEventListener('click', () => { switchGSIAccount(el.dataset.gsiSwitch); });
    });
    container.querySelector('#gsiAddAccountBtn')?.addEventListener('click', (e) => {
      e.stopPropagation();
      dropdown.classList.remove('open');
      gsiSignIn();
    });
    container.querySelector('#gsiSignOutBtn')?.addEventListener('click', (e) => {
      e.stopPropagation();
      dropdown.classList.remove('open');
      gsiSignOut(activeSub);
    });
    // Close dropdown on outside click (each render adds one, so remove old first)
    var existing = document._gsiOutsideClick;
    if (existing) document.removeEventListener('click', existing);
    document._gsiOutsideClick = function(e) {
      var dd = document.getElementById('gsiDropdown');
      if (dd && !dd.contains(e.target) && !e.target.closest('.gsi-avatar')) dd.classList.remove('open');
    };
    document.addEventListener('click', document._gsiOutsideClick);
  } else {
    container.innerHTML = `
      <div class="gsi-signin-wrap">
        <div id="gsiButton" class="gsi-signin-btn">
          <svg viewBox="0 0 24 24" width="16" height="16"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.95 1 11.02 1 13s.43 4.05 1.18 5.93l2.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
          <span>Sign in with Google</span>
        </div>
      </div>`;
    container.querySelector('#gsiButton')?.addEventListener('click', gsiSignIn);
  }
}

function gsiSignIn() {
  if (typeof google === 'undefined' || !google.accounts) return;
  const client = google.accounts.oauth2.initTokenClient({
    client_id: GSI_CLIENT_ID,
    scope: 'openid profile email',
    callback: (response) => {
      if (response.error) return;
      // Decode the JWT to get user info
      const payload = JSON.parse(atob(response.access_token.split('.')[1]));
      handleGSICredential(payload);
    },
  });
  client.requestAccessToken();
}

function handleGSICredential(payload) {
  const sub = payload.sub;
  // If already signed in, skip
  if (gsiAccounts.some(a => a.sub === sub)) {
    switchGSIAccount(sub);
    return;
  }
  const account = {
    sub,
    name: payload.name || '',
    email: payload.email || '',
    picture: payload.picture || '',
  };
  gsiAccounts.push(account);
  saveGSIAccounts();
  // Set active user and apply prefix
  setGSIActiveSub(sub);
  if (typeof state !== 'undefined') {
    state.currentUserSub = sub;
  }
  // Migrate existing un-prefixed data to prefixed keys (first sign-in)
  migrateExistingData(sub);
  renderGSIUI();
  showToast('Signed in as ' + account.name, 'info', 2000);
  // Reload the page to pick up data from prefixed keys
  location.reload();
}

function migrateExistingData(sub) {
  var prefix = sub + ':';
  var migrated = 0;
  for (var i = 0; i < __origLS.length; i++) {
    var key = __origLS.key(i);
    if (key && key.indexOf('haven-') === 0 && key.indexOf('haven-gsi-') !== 0 && key.indexOf(prefix) !== 0) {
      var val = __origLS.getItem(key);
      if (val) {
        __origLS.setItem(prefix + key, val);
        migrated++;
      }
    }
  }
  if (migrated > 0) console.warn('[gsi] migrated ' + migrated + ' keys to user ' + sub);
}

function switchGSIAccount(sub) {
  const account = gsiAccounts.find(a => a.sub === sub);
  if (!account) return;
  setGSIActiveSub(sub);
  if (typeof state !== 'undefined') {
    state.currentUserSub = sub;
  }
  renderGSIUI();
  showToast('Switched to ' + account.name, 'info', 1500);
  if (typeof loadState === 'function') {
    location.reload();
  }
}

function gsiSignOut(sub) {
  gsiAccounts = gsiAccounts.filter(a => a.sub !== sub);
  saveGSIAccounts();
  const active = getGSIActiveSub();
  if (active === sub) {
    if (gsiAccounts.length > 0) {
      setGSIActiveSub(gsiAccounts[0].sub);
      if (typeof state !== 'undefined') state.currentUserSub = gsiAccounts[0].sub;
    } else {
      setGSIActiveSub(null);
      if (typeof state !== 'undefined') state.currentUserSub = null;
    }
  }
  renderGSIUI();
  showToast('Signed out', 'info', 1500);
  if (typeof loadState === 'function') {
    // Reload to use un-prefixed or other user's keys
    location.reload();
  }
}

function initGSI() {
  loadGSIAccounts();
  const activeSub = getGSIActiveSub();
  if (typeof state !== 'undefined') {
    state.currentUserSub = activeSub || null;
    state.gsiAccounts = gsiAccounts;
  }
  renderGSIUI();
  gsiInitialized = true;
}

// Expose for inline onclick usage
window.initGSI = initGSI;
window.gsiSignIn = gsiSignIn;
window.gsiSignOut = gsiSignOut;
window.switchGSIAccount = switchGSIAccount;
window.getGSIActiveSub = getGSIActiveSub;

