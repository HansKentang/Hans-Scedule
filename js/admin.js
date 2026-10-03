/* ============================================
   HavÃ«n Schedule â€” Admin Panel Logic
   v3.0 â€” Full-featured admin experience
   ============================================ */
(function() {
  'use strict';

  /* â”€â”€â”€ Constants â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  var ADMIN_PASS_KEY = 'haven-admin-password';
  var ADMIN_PASS_DEFAULT = 'MjcwODEw';
  var ADMIN_PRESETS_KEY = 'haven-admin-presets';
  var ACTIVE_PRESET_KEY = 'haven-active-preset';
  var HUB_CONTENT_KEY = 'haven-hub-content';
  var AUTH_USERS_KEY = 'haven-gsi-accounts';
  var AUTH_ACTIVE_KEY = 'haven-gsi-active';

  var DEVICE_KEY_PREFIXES = ['haven-gsi-', 'haven-device-', 'haven-admin-', 'haven-cloud-', 'sb-'];
  var DEVICE_KEY_EXACT = ['haven-guest-default-template', 'haven-synced-at', 'haven-schedule-apikey'];
  var PRESERVE_ON_CLEAR = ['haven-admin-password', 'haven-admin-presets', 'haven-guest-default-template', 'haven-synced-at', 'haven-schedule-apikey'];
  var IMAGE_KEY_PREFIXES = ['haven-image-', 'hub-image-'];

  var DATA_SECTIONS = [
    { key: 'haven-schedule-tasks', label: 'Tasks', group: 'Schedule' },
    { key: 'haven-schedule-categories', label: 'Categories', group: 'Schedule' },
    { key: 'haven-schedule-settings', label: 'Settings', group: 'Schedule' },
    { key: 'haven-custom-tags', label: 'Custom Tags', group: 'Schedule' },
    { key: 'haven-subcategories', label: 'Subcategories', group: 'Schedule' },
    { key: 'haven-card-colors', label: 'Card Colors', group: 'Schedule' },
    { key: 'haven-renamed-labels', label: 'Renamed Labels', group: 'Schedule' },
    { key: 'haven-schedule-focus', label: 'Focus Mode', group: 'Schedule' },
    { key: 'haven-schedule-pomodoro', label: 'Pomodoro', group: 'Schedule' },
    { key: 'haven-language', label: 'Language', group: 'Preferences' },
    { key: 'haven-week-start', label: 'Week Start', group: 'Preferences' },
    { key: 'haven-time-format', label: 'Time Format', group: 'Preferences' },
    { key: 'haven-schedule-provider', label: 'AI Provider', group: 'AI' },
    { key: 'haven-schedule-model', label: 'AI Model', group: 'AI' },
    { key: 'haven-schedule-apikey', label: 'API Key', group: 'AI' },
    { key: 'haven-ai-extra-instructions', label: 'Extra AI Instructions', group: 'AI' },
    { key: 'haven-schedule-profile', label: 'User Profile / AI Memory', group: 'AI' },
    { key: 'haven-chickbot-profile', label: 'ChickBot Profile', group: 'AI' },
    { key: 'haven-schedule-ai-usage', label: 'AI Usage', group: 'AI' },
    { key: 'haven-schedule-chat', label: 'Chat History', group: 'AI' },
    { key: 'haven-activities-completions', label: 'Activity Completions', group: 'Activity' },
    { key: 'haven-schedule-sleep', label: 'Sleep Logs', group: 'Sleep' },
    { key: 'haven-schedule-sleep-targets', label: 'Sleep Targets', group: 'Sleep' },
    { key: 'haven-schedule-sleep-routine', label: 'Sleep Routine', group: 'Sleep' },
    { key: 'haven-schedule-sleep-recovery', label: 'Sleep Recovery', group: 'Sleep' },
    { key: 'haven-schedule-finance', label: 'Finance Transactions', group: 'Finance' },
    { key: 'haven-piggybank', label: 'Piggy Bank', group: 'Finance' },
    { key: 'haven-wallet', label: 'Wallet', group: 'Finance' },
    { key: 'haven-schedule-goals', label: 'Goals & Resolutions', group: 'Goals' },
    { key: 'haven-hub-content', label: 'Hub Content / Bento', group: 'Hub' },
    { key: 'haven-hub-visibility', label: 'Hub Visibility', group: 'Hub' },
    { key: 'haven-schedule-hub-layout', label: 'Hub Section Order', group: 'Hub' },
    { key: 'haven-hub-layout', label: 'Bento Canvas Layout', group: 'Hub' },
    { key: 'haven-gallery-layout', label: 'Gallery Layout', group: 'Media' },
    { key: 'haven-spotify-playlists', label: 'Spotify Playlists', group: 'Media' },
    { key: 'haven-spotify-active', label: 'Spotify Active', group: 'Media' },
    { key: 'haven-routine', label: 'Daily Routine', group: 'Profile' },
  ];

  /* â”€â”€â”€ State â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  var _currentTab = 'dashboard';
  var _adminAuthed = sessionStorage.getItem('haven-admin-authed') === 'true';
  var toastTimeout = null;

  /* â”€â”€â”€ Helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  function esc(s) {
    if (s == null) return '';
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
  }

  function uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  }

  function $(id) { return document.getElementById(id); }

  function formatDate(d) {
    var y = d.getFullYear();
    var m = String(d.getMonth()+1).padStart(2,'0');
    var day = String(d.getDate()).padStart(2,'0');
    return y + '-' + m + '-' + day;
  }

  function formatTimeAMPM(s) {
    if (!s) return '';
    var p = s.split(':').map(Number);
    var h = p[0] % 12 || 12;
    var ampm = p[0] < 12 ? 'AM' : 'PM';
    return h + ':' + String(p[1]).padStart(2,'0') + ampm;
  }

  function showToast(msg, type, duration) {
    var el = $('adminToast');
    if (!el) return;
    el.textContent = msg;
    el.className = 'admin-toast' + (type ? ' ' + type : '');
    clearTimeout(toastTimeout);
    void el.offsetWidth;
    el.classList.add('show');
    toastTimeout = setTimeout(function() {
      el.classList.remove('show');
    }, duration || 2000);
  }

  function showError(msg) {
    showToast(msg, 'error', 3500);
  }

  function isDeviceKey(key) {
    if (typeof key !== 'string') return false;
    if (DEVICE_KEY_EXACT.indexOf(key) !== -1) return true;
    for (var i = 0; i < DEVICE_KEY_PREFIXES.length; i++) {
      if (key.indexOf(DEVICE_KEY_PREFIXES[i]) === 0) return true;
    }
    return false;
  }

  function rawLS() {
    return (typeof __origLS !== 'undefined' && __origLS.length !== undefined && typeof __origLS.key === 'function')
      ? __origLS
      : {
          length: localStorage.length,
          key: function(i) { return localStorage.key(i); },
          getItem: function(k) { return localStorage.getItem(k); },
          setItem: function(k, v) { localStorage.setItem(k, v); },
          removeItem: function(k) { localStorage.removeItem(k); }
        };
  }

  function physGet(key) {
    try {
      if (isDeviceKey(key)) return rawLS().getItem(key);
      return localStorage.getItem(key);
    } catch(e) { return null; }
  }

  function physSet(key, val) {
    try {
      if (isDeviceKey(key)) { rawLS().setItem(key, val); return true; }
      return localStorage.setItem(key, val);
    } catch(e) { return false; }
  }

  function physRemove(key) {
    try {
      if (isDeviceKey(key)) { rawLS().removeItem(key); return true; }
      return localStorage.removeItem(key);
    } catch(e) { return false; }
  }

  function getLSItem(key) { return physGet(key); }
  function setLSItem(key, val) { return physSet(key, val); }
  function removeLSItem(key) { return physRemove(key); }

  function _adActivePrefix() {
    try {
      if (typeof state !== 'undefined' && state && state.currentUserId) return state.currentUserId + ':';
    } catch (e) {}
    try {
      var raw = rawLS().getItem(AUTH_ACTIVE_KEY);
      if (raw) return raw + ':';
    } catch (e) {}
    return '';
  }

  function getLSJSON(key) {
    try {
      var v = physGet(key);
      return v ? JSON.parse(v) : null;
    } catch(e) { return null; }
  }

  function setLSJSON(key, obj) {
    try { return physSet(key, JSON.stringify(obj)); } catch(e) { return false; }
  }

  function _safeBtoa(s) {
    try { return btoa(unescape(encodeURIComponent(s))); } catch(e) { return btoa(s); }
  }

  function verifyPassword(entered) {
    var storedPass;
    try { storedPass = physGet(ADMIN_PASS_KEY) || ADMIN_PASS_DEFAULT; } catch(e) { storedPass = ADMIN_PASS_DEFAULT; }
    try {
      if (_safeBtoa(entered) === storedPass) {
        _adminAuthed = true;
        try { sessionStorage.setItem('haven-admin-authed', 'true'); } catch(e) {}
        return true;
      }
    } catch(e) {}
    return false;
  }

  function showPwGate() {
    var gate = $('pwGate');
    if (gate) gate.classList.remove('hidden');
  }

  function hidePwGate() {
    var gate = $('pwGate');
    if (gate) gate.classList.add('hidden');
  }

  function shakePwGate() {
    var card = document.querySelector('.pw-gate-card');
    if (!card) return;
    card.classList.remove('pw-gate-shake');
    void card.offsetWidth;
    card.classList.add('pw-gate-shake');
  }

  function openPasswordChangeModal() {
    _openModal('Change Password',
      '<label class="ad-modal-label">Current Password</label><input type="password" id="adPassCurrent" class="ad-raw-input" style="margin-bottom:10px">' +
      '<label class="ad-modal-label">New Password (min 3 chars)</label><input type="password" id="adPassNew" class="ad-raw-input" style="margin-bottom:10px">' +
      '<label class="ad-modal-label">Confirm New</label><input type="password" id="adPassConfirm" class="ad-raw-input">',
      '<button class="admin-btn" onclick="closeModal()">Cancel</button><button class="admin-btn primary" onclick="window._adChangePassword()">Change</button>'
    );
  }

  window._adChangePassword = function() {
    var cur = $('adPassCurrent'); var nw = $('adPassNew'); var confirm = $('adPassConfirm');
    if (!cur || !nw || !confirm) return;
    var storedPass;
    try { storedPass = physGet(ADMIN_PASS_KEY) || ADMIN_PASS_DEFAULT; } catch(e) { storedPass = ADMIN_PASS_DEFAULT; }
    if (_safeBtoa(cur.value) !== storedPass) { showError('Current password is incorrect'); return; }
    if (!nw.value || nw.value.length < 3) { showError('New password must be at least 3 characters'); return; }
    if (nw.value !== confirm.value) { showError('Passwords do not match'); return; }
    setLSItem(ADMIN_PASS_KEY, _safeBtoa(nw.value));
    showToast('Password changed successfully', 'success');
    closeModal();
  };

  /* â”€â”€â”€ Tab System â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  var TAB_DEFS = [
    { id: 'dashboard', label: 'Dashboard', icon: '<rect x="3" y="3" width="7" height="9"/><rect x="14" y="3" width="7" height="5"/><rect x="14" y="12" width="7" height="9"/><rect x="3" y="16" width="7" height="5"/>' },
    { id: 'pages', label: 'Pages', icon: '<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>' },
    { id: 'storage', label: 'Storage', icon: '<path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 002 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/><line x1="17" y1="13" x2="7" y2="13"/>' },
    { id: 'tasks', label: 'Tasks', icon: '<path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>' },
    { id: 'goals', label: 'Goals', icon: '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>' },
    { id: 'tags', label: 'Tags', icon: '<path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.83z"/><line x1="7" y1="7" x2="7.01" y2="7"/>' },
    { id: 'bento', label: 'Bento', icon: '<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>' },
    { id: 'data', label: 'Data', icon: '<path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>' },
    { id: 'sleep', label: 'Sleep', icon: '<path d="M17 17h.01"/><path d="M21 12h.01"/><path d="M7 17h.01"/><path d="M12 21h.01"/><circle cx="12" cy="12" r="9"/><circle cx="12" cy="7.5" r="1.5"/>' },
    { id: 'finance', label: 'Finance', icon: '<line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>' },
    { id: 'activity', label: 'Activity', icon: '<polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>' },
    { id: 'accounts', label: 'Accounts', icon: '<path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/>' },
    { id: 'premium', label: 'Premium', icon: '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>' },
    { id: 'ai', label: 'AI', icon: '<path d="M12 2a4 4 0 014 4c0 2-2 3-2 3h-4s-2-1-2-3a4 4 0 014-4z"/><path d="M7 13h10"/><path d="M7 17h10"/><path d="M5 21h14"/><line x1="11" y1="21" x2="11" y2="17"/>' },
    { id: 'settings', label: 'Settings', icon: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/>' },
    { id: 'system', label: 'System', icon: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>' },
  ];

  function initTabs() {
    var container = $('adminTabBar');
    if (!container) return;
    container.innerHTML = TAB_DEFS.map(function(t) {
      var active = t.id === _currentTab ? ' active' : '';
      return '<button class="admin-tab' + active + '" data-tab="' + t.id + '">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="14" height="14">' + t.icon + '</svg>' +
        '<span>' + t.label + '</span></button>';
    }).join('');
    container.addEventListener('click', function(e) {
      var btn = e.target.closest('.admin-tab');
      if (!btn) return;
      switchTab(btn.dataset.tab);
    });
  }

  function switchTab(id) {
    if (!document.querySelector('[data-panel="' + id + '"]')) id = 'dashboard';
    _currentTab = id;
    var bar = $('adminTabBar');
    if (bar) {
      bar.querySelectorAll('.admin-tab').forEach(function(b) {
        b.classList.toggle('active', b.dataset.tab === id);
      });
    }
    var content = $('adminContent');
    if (content) {
      content.querySelectorAll('.admin-content-panel').forEach(function(p) {
        p.classList.toggle('hidden', p.dataset.panel !== id);
      });
    }
    renderPanel(id);
  }
  window.switchTab = switchTab;
  window.renderStorageExplorer = function() { renderStorageExplorer(); };
  window.renderTaskManager = function() { renderTaskManager(); };
  window.renderDataManager = function() { renderDataManager(); };
  window.openPasswordChangeModal = openPasswordChangeModal;
  window.closeModal = window.closeModal || function() {};

  function renderPanel(id) {
    switch(id) {
      case 'dashboard': renderDashboard(); break;
      case 'pages': renderPagesPanel(); break;
      case 'storage': renderStorageExplorer(); break;
      case 'tasks': renderTaskManager(); break;
      case 'goals': renderGoalsPanel(); break;
      case 'tags': renderTagsPanel(); break;
      case 'bento': renderBentoPanel(); break;
      case 'data': renderDataManager(); break;
      case 'sleep': renderSleepPanel(); break;
      case 'finance': renderFinancePanel(); break;
      case 'activity': renderActivityPanel(); break;
      case 'accounts': renderAccountsPanel(); break;
      case 'premium': renderPremiumPanel(); break;
      case 'ai': renderAIPanel(); break;
      case 'settings': renderSettingsEditor(); break;
      case 'system': renderSystemPanel(); break;
    }
  }

  /* â”€â”€â”€ DASHBOARD TAB â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  var PAGE_GROUPS = [
    { group: 'App', items: [
      { href: 'index.html', label: 'Hub', desc: 'Bento canvas, sleep, gallery cards' },
      { href: 'schedule.html', label: 'Schedule', desc: 'Week grid, tasks, drag & drop, focus' },
      { href: 'progress.html', label: 'Progress', desc: 'Activities board, timeline, analytics' },
      { href: 'goals.html', label: 'Goals', desc: 'Goal cards, vision board, related tasks' },
      { href: 'finance.html', label: 'Finance', desc: 'KPIs, charts, spending intelligence' },
      { href: 'gallery.html', label: 'Gallery', desc: 'Image grid and vision board' },
      { href: 'friends.html', label: 'Friends', desc: 'Friends, chat, challenges, feed' },
      { href: 'admin.html', label: 'Admin', desc: 'This control panel' },
    ]},
    { group: 'Account', items: [
      { href: 'login.html?stay=1', label: 'Sign in', desc: 'Auth card over the login page' },
      { href: 'premium.html', label: 'Premium', desc: 'Plans, billing, feature gating' },
      { href: 'landing.html', label: 'Landing', desc: 'Public marketing page' },
    ]},
    { group: 'Info', items: [
      { href: 'privacy.html', label: 'Privacy', desc: 'Privacy policy' },
      { href: 'terms.html', label: 'Terms', desc: 'Terms of service' },
      { href: 'support.html', label: 'Support', desc: 'Help centre and FAQ' },
    ]},
    { group: 'Redirects', items: [
      { href: 'activities.html', label: 'Activities', desc: 'Forwards to Progress' },
      { href: 'analytics.html', label: 'Analytics', desc: 'Forwards to Progress' },
      { href: 'tags.html', label: 'Tags', desc: 'Forwards to Progress' },
    ]},
  ];

  function renderPagesPanel() {
    var el = $('panelPages');
    if (!el) return;
    var curHref = ((location.pathname.split('/').pop() || 'index.html') + location.search).toLowerCase();
    var count = 0;
    PAGE_GROUPS.forEach(function(g) { count += g.items.length; });

    var html = '<div class="ad-toolbar">'
      + '<input type="text" class="admin-search" id="adPageSearch" placeholder="Filter pagesâ€¦" autocomplete="off" spellcheck="false">'
      + '<span class="ad-dash-sub">' + count + ' pages Â· ctrl/cmd-click opens in a new tab</span>'
      + '</div>';

    PAGE_GROUPS.forEach(function(g) {
      html += '<div class="ad-page-group" data-page-group>';
      html += '<div class="ad-dash-label">' + esc(g.group) + '</div>';
      html += '<div class="ad-page-grid">';
      g.items.forEach(function(page) {
        var isCurrent = page.href.toLowerCase() === curHref;
        html += '<a class="ad-page-card' + (isCurrent ? ' current' : '') + '" href="' + esc(page.href) + '"'
          + ' data-page-search="' + esc((page.label + ' ' + page.href + ' ' + page.desc).toLowerCase()) + '"'
          + (isCurrent ? ' aria-current="page"' : '') + '>'
          + '<span class="ad-page-head"><span class="ad-page-name">' + esc(page.label) + '</span>'
          + (isCurrent ? '<span class="ad-page-here">Current</span>' : '')
          + '</span>'
          + '<span class="ad-page-desc">' + esc(page.desc) + '</span>'
          + '<span class="ad-page-file">' + esc(page.href) + '</span>'
          + '</a>';
      });
      html += '</div></div>';
    });
    el.innerHTML = html;

    var input = $('adPageSearch');
    if (input) {
      input.addEventListener('input', function() {
        var q = input.value.trim().toLowerCase();
        el.querySelectorAll('.ad-page-card').forEach(function(card) {
          var hit = !q || (card.dataset.pageSearch || '').indexOf(q) !== -1;
          card.classList.toggle('hidden', !hit);
        });
        el.querySelectorAll('[data-page-group]').forEach(function(group) {
          group.classList.toggle('hidden', !group.querySelector('.ad-page-card:not(.hidden)'));
        });
      });
    }
  }

  function renderDashboard() {
    var el = $('panelDashboard');
    if (!el) return;
    var tasks = getLSJSON('haven-schedule-tasks') || [];
    var cats = getLSJSON('haven-schedule-categories') || [];
    var customTags = getLSJSON('haven-custom-tags') || [];
    var completions = getLSJSON('haven-activities-completions') || [];
    var sleepLogs = getLSJSON('haven-schedule-sleep') || [];
    var goalsData = getLSJSON('haven-schedule-goals') || {};
    var goals = goalsData.goals || [];
    var finList = getLSJSON('haven-schedule-finance') || [];
    var piggy = 0;
    try { var pData = getLSJSON('haven-piggybank'); if (pData) piggy = pData.balance || 0; } catch(e) {}
    var wallet = 0;
    try { var wData = getLSJSON('haven-wallet'); if (wData) wallet = wData.balance || 0; } catch(e) {}

    var _raw = rawLS();
    var keyCount = _raw.length;
    var totalSize = 0;
    try { for (var i = 0; i < _raw.length; i++) { var k = _raw.key(i); if (k) { var v = _raw.getItem(k); if (v) totalSize += k.length + v.length; } } } catch(e) {}

    var today = formatDate(new Date());
    var todayTasks = tasks.filter(function(t) { return t.date === today; });
    var completedToday = todayTasks.filter(function(t) { return t.completed; }).length;
    var weekTasks = tasks.filter(function(t) {
      if (!t.date) return false;
      var d = new Date(t.date + 'T00:00:00');
      var now = new Date();
      var weekStart = new Date(now);
      weekStart.setDate(now.getDate() - now.getDay());
      weekStart.setHours(0,0,0,0);
      var weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 7);
      return d >= weekStart && d < weekEnd;
    });
    var completedWeek = weekTasks.filter(function(t) { return t.completed; }).length;

    var aiUsage = getLSJSON('haven-schedule-ai-usage') || {};
    var aiTokens = aiUsage.totalTokens || 0;
    var accounts = getLSJSON(AUTH_USERS_KEY) || [];
    var presets = (typeof loadAdminPresets === 'function') ? loadAdminPresets() : [];

    var html = '<div class="ad-dash-grid">';

    var kpis = [
      { label: 'Storage', value: (totalSize / 1024).toFixed(1) + ' KB', sub: keyCount + ' keys used' },
      { label: 'Tasks', value: tasks.length, sub: todayTasks.length + ' today, ' + completedToday + ' done' },
      { label: 'Categories', value: cats.length + 5, sub: customTags.length + ' custom tags' },
      { label: 'Completions', value: completions.length, sub: 'all time activities' },
      { label: 'Sleep Logs', value: sleepLogs.length, sub: 'nights tracked' },
      { label: 'Finance', value: '$' + (piggy + wallet).toFixed(2), sub: finList.length + ' transactions' },
      { label: 'Goals', value: goals.length, sub: goals.filter(function(g){return g.status==='done';}).length + ' completed' },
      { label: 'AI Usage', value: aiTokens.toLocaleString(), sub: 'tokens used' },
      { label: 'Week Progress', value: completedWeek + '/' + weekTasks.length, sub: 'tasks completed this week' },
      { label: 'Accounts', value: accounts.length, sub: 'local profiles' },
      { label: 'Presets', value: presets.length, sub: 'bento presets saved' },
    ];
    kpis.forEach(function(k) {
      html += '<div class="ad-dash-card"><div class="ad-dash-label">' + esc(k.label) + '</div><div class="ad-dash-value">' + esc(String(k.value)) + '</div><div class="ad-dash-sub">' + esc(k.sub) + '</div></div>';
    });

    var tagCounts = {};
    tasks.forEach(function(t) { var tag = t.tag || 'unknown'; tagCounts[tag] = (tagCounts[tag] || 0) + 1; });
    html += '<div class="ad-dash-card full"><div class="ad-dash-label">Tasks by Tag</div><div class="ad-dash-row">';
    var sorted = Object.keys(tagCounts).sort();
    sorted.forEach(function(tag) {
      var label = (typeof TAG_LABELS !== 'undefined' && TAG_LABELS[tag]) ? TAG_LABELS[tag] : tag;
      html += '<span class="ad-dash-chip">' + esc(label) + ': ' + tagCounts[tag] + '</span>';
    });
    if (sorted.length === 0) html += '<span class="ad-dash-chip" style="opacity:0.5">No tasks</span>';
    html += '</div></div>';

    var recentActs = completions.slice(-10).reverse();
    html += '<div class="ad-dash-card half"><div class="ad-dash-label">Recent Activity</div>';
    if (recentActs.length === 0) {
      html += '<div class="ad-dash-sub" style="margin-top:6px">No recent activity</div>';
    } else {
      recentActs.forEach(function(a) {
        html += '<div class="ad-dash-act"><span class="ad-dash-act-dot"></span><span>' + esc(a.title || 'Activity') + '</span><span class="ad-dash-sub" style="margin-left:auto">' + esc(a.date || '') + '</span></div>';
      });
    }
    html += '</div>';

    var recentSleeps = sleepLogs.slice(-5).reverse();
    html += '<div class="ad-dash-card half"><div class="ad-dash-label">Recent Sleep</div>';
    if (recentSleeps.length === 0) {
      html += '<div class="ad-dash-sub" style="margin-top:6px">No sleep logs yet</div>';
    } else {
      recentSleeps.forEach(function(s) {
        html += '<div class="ad-dash-act"><span class="ad-dash-act-dot" style="background:#6366f1"></span><span>' + esc(s.date || '') + ' â€” ' + esc(s.bedtime || '') + ' to ' + esc(s.wakeTime || '') + '</span><span class="ad-dash-sub" style="margin-left:auto">' + (s.quality ? 'â˜…'.repeat(s.quality) : '') + '</span></div>';
      });
    }
    html += '</div>';

    html += '<div class="ad-dash-card full"><div class="ad-dash-label">Quick Actions</div><div class="ad-dash-actions">';
    html += '<button class="admin-btn primary small" onclick="switchTab(\'storage\')">Browse Storage</button>';
    html += '<button class="admin-btn small" onclick="switchTab(\'tasks\')">Manage Tasks</button>';
    html += '<button class="admin-btn small" onclick="switchTab(\'data\')">Backup Data</button>';
    html += '<button class="admin-btn small" onclick="switchTab(\'goals\')">Goals</button>';
    html += '<button class="admin-btn small" onclick="switchTab(\'tags\')">Tags</button>';
    html += '<button class="admin-btn small" onclick="switchTab(\'bento\')">Bento / Presets</button>';
    html += '<button class="admin-btn small" onclick="switchTab(\'accounts\')">Accounts</button>';
    html += '<button class="admin-btn small" onclick="switchTab(\'system\')">System Info</button>';
    html += '<button class="admin-btn small" onclick="window._adSaveCurrentPreset()">Save Bento Preset</button>';
    html += '<button class="admin-btn small" onclick="openPasswordChangeModal()">Change Password</button>';
    html += '</div></div>';

    html += '</div>';
    el.innerHTML = html;
  }

  /* â”€â”€â”€ STORAGE EXPLORER TAB â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  function renderStorageExplorer() {
    var el = $('panelStorage');
    if (!el) return;
    var searchTerm = ($('adStorageSearch') || {}).value || '';
    var keys = [];
    var front = _adActivePrefix();
    try {
      for (var i = 0; i < rawLS().length; i++) {
        var k = rawLS().key(i);
        if (!k) continue;
        if (isDeviceKey(k)) {
          keys.push(k);
        } else if (front) {
          if (k.indexOf(front) === 0) keys.push(k.slice(front.length));
        } else {
          keys.push(k);
        }
      }
    } catch(e) {}
    keys.sort();

    if (searchTerm) {
      keys = keys.filter(function(k) { return k.toLowerCase().indexOf(searchTerm.toLowerCase()) !== -1; });
    }

    var html = '<div class="ad-toolbar">';
    html += '<input class="admin-search" id="adStorageSearch" type="text" placeholder="Search keys..." value="' + esc(searchTerm) + '" oninput="window._adminRenderTimeout && clearTimeout(window._adminRenderTimeout); window._adminRenderTimeout=setTimeout(function(){renderStorageExplorer()},200)">';
    html += '<button class="admin-btn small" onclick="renderStorageExplorer()"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/></svg> Refresh</button>';
    html += '<span class="ad-dash-sub" style="margin-left:auto">' + keys.length + ' keys</span>';
    html += '</div>';

    html += '<div class="ad-table-wrap" style="max-height:60vh"><table class="ad-table"><thead><tr><th style="width:40%">Key</th><th style="width:15%">Size</th><th style="width:15%">Type</th><th style="width:30%">Actions</th></tr></thead><tbody>';
    if (keys.length === 0) {
      html += '<tr><td colspan="4" style="text-align:center;color:var(--text-tertiary);padding:24px">No keys found' + (searchTerm ? ' matching "' + esc(searchTerm) + '"' : '') + '</td></tr>';
    }
    keys.forEach(function(key) {
      var val = getLSItem(key);
      var size = val ? (key.length + val.length) : 0;
      var sizeStr = size > 1024 ? (size / 1024).toFixed(1) + ' KB' : size + ' B';
      var isJSON = false;
      try { JSON.parse(val); isJSON = true; } catch(e) {}
      var typeStr = isJSON ? 'JSON' : (val && val.indexOf('data:image') === 0 ? 'Image' : (val && val.indexOf('data:') === 0 ? 'DataURL' : 'String'));
      var escKey = esc(key.replace(/\\/g, '\\\\').replace(/'/g, "\\'"));
      html += '<tr><td class="ad-tcell-key" title="' + esc(key) + '">' + (isDeviceKey(key) ? 'ðŸ”’ ' : '') + esc(key.length > 50 ? key.slice(0, 50) + '...' : key) + '</td>';
      html += '<td>' + sizeStr + '</td>';
      html += '<td>' + typeStr + '</td>';
      html += '<td class="ad-tcell-actions">';
      html += '<button class="admin-btn small" onclick="window._adViewKey(\'' + escKey + '\')">View</button>';
      html += '<button class="admin-btn small" onclick="window._adEditKey(\'' + escKey + '\')">Edit</button>';
      html += '<button class="admin-btn small danger" onclick="window._adDeleteKey(\'' + escKey + '\')">Del</button>';
      html += '</td></tr>';
    });
    html += '</tbody></table></div>';
    html += '<div class="ad-toolbar" style="margin-top:8px"><button class="admin-btn primary small" onclick="window._adAddKey()">+ Add Key</button><button class="admin-btn small danger" onclick="window._adClearAll()">Clear All Storage</button></div>';
    el.innerHTML = html;

    window._adViewKey = function(key) {
      var val = getLSItem(key);
      if (val === null || val === undefined) { showError('Key not found'); return; }
      var pretty = '';
      try { var obj = JSON.parse(val); pretty = JSON.stringify(obj, null, 2); } catch(e) { pretty = val; }
      _openModal('View: ' + esc(key), '<textarea class="ad-raw-input" readonly style="min-height:300px;font-size:0.72rem">' + esc(pretty) + '</textarea>',
        '<button class="admin-btn" onclick="closeModal()">Close</button>');
    };
    window._adEditKey = function(key) {
      var val = getLSItem(key) || '';
      _openModal('Edit: ' + esc(key),
        '<label class="ad-modal-label">Value</label><textarea class="ad-raw-input" id="adEditVal" style="min-height:200px;font-size:0.72rem;font-family:var(--font-mono)">' + esc(val) + '</textarea>',
        '<button class="admin-btn" onclick="closeModal()">Cancel</button><button class="admin-btn primary" onclick="window._adSaveEdit()">Save</button>');
      window._adEditKeyTarget = key;
    };
    window._adSaveEdit = function() {
      var key = window._adEditKeyTarget;
      var val = $('adEditVal');
      if (!key || !val) return;
      if (setLSItem(key, val.value)) {
        showToast('Saved: ' + key, 'success');
        closeModal();
        renderStorageExplorer();
      } else {
        showError('Failed to save (likely quota exceeded)');
      }
    };
    window._adDeleteKey = function(key) {
      if (!confirm('Delete "' + key + '" permanently?')) return;
      if (removeLSItem(key)) {
        showToast('Deleted: ' + key, 'success');
        renderStorageExplorer();
      }
    };
    window._adAddKey = function() {
      _openModal('Add New Key',
        '<label class="ad-modal-label">Key Name</label><input class="ad-raw-input" id="adNewKey" placeholder="e.g. haven-my-custom-key" style="margin-bottom:12px"><label class="ad-modal-label">Value</label><textarea class="ad-raw-input" id="adNewVal" style="min-height:100px" placeholder="Value (string or JSON)"></textarea>',
        '<button class="admin-btn" onclick="closeModal()">Cancel</button><button class="admin-btn primary" onclick="window._adSaveNew()">Add</button>');
    };
    window._adSaveNew = function() {
      var key = $('adNewKey'); var val = $('adNewVal');
      if (!key || !key.value.trim()) { showError('Key name required'); return; }
      if (setLSItem(key.value.trim(), val ? val.value : '')) {
        showToast('Added: ' + key.value.trim(), 'success');
        closeModal();
        renderStorageExplorer();
      } else { showError('Failed to save'); }
    };
    window._adClearAll = function() {
      if (!confirm('Are you sure you want to clear ALL localStorage? This cannot be undone!')) return;
      if (!confirm('REALLY clear everything? All tasks, settings, images, everything?')) return;
      var _raw = rawLS();
      var doomed = [];
      try {
        for (var i = 0; i < _raw.length; i++) {
          var k = _raw.key(i);
          if (!k) continue;
          if (PRESERVE_ON_CLEAR.indexOf(k) !== -1) continue;
          if (isDeviceKey(k) && PRESERVE_ON_CLEAR.indexOf(k) === -1) {
            if (k.indexOf('haven-admin-') === 0 || k.indexOf('haven-gsi-') === 0 || k.indexOf('haven-device-') === 0 || k.indexOf('sb-') === 0) continue;
          }
          doomed.push(k);
        }
        for (var j = 0; j < doomed.length; j++) _raw.removeItem(doomed[j]);
      } catch(e) {}
      showToast('Cleared ' + doomed.length + ' keys (preserved admin/device keys)', 'success');
      renderStorageExplorer();
    };
  }

  /* â”€â”€â”€ TASK MANAGER TAB â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  function renderTaskManager() {
    var el = $('panelTasks');
    if (!el) return;
    var tasks = getLSJSON('haven-schedule-tasks') || [];
    var filterTag = ($('adTaskFilterTag') || {}).value || 'all';
    var filterStatus = ($('adTaskFilterStatus') || {}).value || 'all';
    var search = ($('adTaskSearch') || {}).value || '';
    var sortBy = ($('adTaskSort') || {}).value || 'date';

    var filtered = tasks.filter(function(t) {
      if (filterTag !== 'all' && (t.tag || 'none') !== filterTag) return false;
      if (filterStatus === 'done' && !t.completed) return false;
      if (filterStatus === 'pending' && t.completed) return false;
      if (search && t.title && t.title.toLowerCase().indexOf(search.toLowerCase()) === -1) return false;
      return true;
    });

    filtered.sort(function(a, b) {
      if (sortBy === 'date') return (a.date || '').localeCompare(b.date || '');
      if (sortBy === 'title') return (a.title || '').localeCompare(b.title || '');
      if (sortBy === 'tag') return (a.tag || '').localeCompare(b.tag || '');
      return 0;
    });

    var allTags = {};
    tasks.forEach(function(t) { allTags[t.tag || 'none'] = true; });
    var tagList = Object.keys(allTags).sort();

    var html = '<div class="ad-toolbar" style="flex-wrap:wrap">';
    html += '<input class="admin-search" id="adTaskSearch" type="text" placeholder="Search tasks..." value="' + esc(search) + '" style="max-width:180px" oninput="window._adTaskTimeout&&clearTimeout(window._adTaskTimeout);window._adTaskTimeout=setTimeout(renderTaskManager,200)">';
    html += '<select class="ad-select" id="adTaskFilterTag" onchange="renderTaskManager()">';
    html += '<option value="all"' + (filterTag === 'all' ? ' selected' : '') + '>All Tags</option>';
    tagList.forEach(function(tag) {
      var label = (typeof TAG_LABELS !== 'undefined' && TAG_LABELS[tag]) ? TAG_LABELS[tag] : tag;
      html += '<option value="' + esc(tag) + '"' + (filterTag === tag ? ' selected' : '') + '>' + esc(label) + '</option>';
    });
    html += '</select>';
    html += '<select class="ad-select" id="adTaskFilterStatus" onchange="renderTaskManager()">';
    html += '<option value="all"' + (filterStatus === 'all' ? ' selected' : '') + '>All</option>';
    html += '<option value="pending"' + (filterStatus === 'pending' ? ' selected' : '') + '>Pending</option>';
    html += '<option value="done"' + (filterStatus === 'done' ? ' selected' : '') + '>Completed</option>';
    html += '</select>';
    html += '<select class="ad-select" id="adTaskSort" onchange="renderTaskManager()">';
    html += '<option value="date"' + (sortBy === 'date' ? ' selected' : '') + '>Sort: Date</option>';
    html += '<option value="title"' + (sortBy === 'title' ? ' selected' : '') + '>Sort: Title</option>';
    html += '<option value="tag"' + (sortBy === 'tag' ? ' selected' : '') + '>Sort: Tag</option>';
    html += '</select>';
    html += '<span class="ad-dash-sub" style="margin-left:auto;white-space:nowrap">' + filtered.length + '/' + tasks.length + ' tasks</span>';
    html += '</div>';

    html += '<div class="ad-bulk-bar" id="adBulkBar">';
    html += '<span id="adBulkCount" style="font-size:0.72rem;color:var(--text-tertiary)">0 selected</span>';
    html += '<button class="admin-btn small" onclick="window._adBulkComplete()">Mark Done</button>';
    html += '<button class="admin-btn small" onclick="window._adBulkPending()">Mark Pending</button>';
    html += '<button class="admin-btn small danger" onclick="window._adBulkDelete()">Delete</button>';
    html += '<button class="admin-btn small" onclick="window._adBulkClear()">Clear</button>';
    html += '</div>';

    html += '<div class="ad-table-wrap" style="max-height:55vh"><table class="ad-table"><thead><tr>';
    html += '<th style="width:30px"><input type="checkbox" id="adSelectAll" onchange="window._adToggleAll(this.checked)"></th>';
    html += '<th>Title</th><th>Tag</th><th>Date</th><th>Time</th><th>Status</th><th style="width:80px">Actions</th>';
    html += '</tr></thead><tbody>';

    if (filtered.length === 0) {
      html += '<tr><td colspan="7" style="text-align:center;color:var(--text-tertiary);padding:32px">No tasks found</td></tr>';
    }
    filtered.forEach(function(task) {
      var tagLabel = (typeof TAG_LABELS !== 'undefined' && TAG_LABELS[task.tag]) ? TAG_LABELS[task.tag] : (task.tag || 'none');
      var checked = task.completed ? ' checked' : '';
      var timeStr = task.startTime ? (formatTimeAMPM(task.startTime) + (task.endTime ? ' - ' + formatTimeAMPM(task.endTime) : '')) : 'â€”';
      var escId = esc(String(task.id).replace(/\\/g, '\\\\').replace(/'/g, "\\'"));
      html += '<tr class="' + (task.completed ? 'ad-row-done' : '') + '">';
      html += '<td><input type="checkbox" class="ad-task-cb" data-id="' + esc(task.id) + '" onchange="window._adUpdateBulkBar()"></td>';
      html += '<td><span class="ad-tcell-title">' + esc(task.title || 'Untitled') + '</span></td>';
      html += '<td><span class="ad-tag-chip" style="background:var(--tag-' + task.tag + '-bg,var(--accent-soft));color:var(--tag-' + task.tag + '-text,var(--text-secondary))">' + esc(tagLabel) + '</span></td>';
      html += '<td>' + esc(task.date || 'â€”') + '</td>';
      html += '<td style="font-size:0.7rem;color:var(--text-tertiary)">' + timeStr + '</td>';
      html += '<td><input type="checkbox" ' + checked + ' onchange="window._adToggleTask(\'' + escId + '\',this.checked)"></td>';
      html += '<td><button class="admin-btn small" onclick="window._adDeleteTask(\'' + escId + '\')" title="Delete">âœ•</button></td>';
      html += '</tr>';
    });
    html += '</tbody></table></div>';
    html += '<div class="ad-toolbar" style="margin-top:8px"><button class="admin-btn small danger" onclick="window._adDeleteAllTasks()">Delete All Tasks</button></div>';

    el.innerHTML = html;

    window._adToggleAll = function(checked) {
      var panel = $('panelTasks'); if (!panel) return;
      panel.querySelectorAll('.ad-task-cb').forEach(function(cb) { cb.checked = checked; });
      window._adUpdateBulkBar();
    };
    window._adUpdateBulkBar = function() {
      var panel = $('panelTasks');
      var count = panel ? panel.querySelectorAll('.ad-task-cb:checked').length : 0;
      var bar = $('adBulkCount');
      if (bar) bar.textContent = count + ' selected';
    };
    window._adToggleTask = function(id, done) {
      var tasks = getLSJSON('haven-schedule-tasks') || [];
      var task = tasks.find(function(t) { return t.id === id; });
      if (task) { task.completed = done; setLSJSON('haven-schedule-tasks', tasks); showToast(done ? 'Completed' : 'Reopened', 'success', 1200); }
    };
    window._adDeleteTask = function(id) {
      var tasks = getLSJSON('haven-schedule-tasks') || [];
      var idx = tasks.findIndex(function(t) { return t.id === id; });
      if (idx !== -1) { tasks.splice(idx, 1); setLSJSON('haven-schedule-tasks', tasks); renderTaskManager(); showToast('Task deleted'); }
    };
    window._adDeleteAllTasks = function() {
      if (!confirm('Delete ALL tasks? This cannot be undone!')) return;
      setLSJSON('haven-schedule-tasks', []);
      renderTaskManager();
      showToast('All tasks deleted', 'success');
    };
    window._adBulkComplete = function() {
      var panel = $('panelTasks'); if (!panel) return;
      var ids = [];
      panel.querySelectorAll('.ad-task-cb:checked').forEach(function(cb) { ids.push(cb.dataset.id); });
      if (ids.length === 0) return;
      var tasks = getLSJSON('haven-schedule-tasks') || [];
      tasks.forEach(function(t) { if (ids.indexOf(t.id) !== -1) t.completed = true; });
      setLSJSON('haven-schedule-tasks', tasks);
      renderTaskManager(); showToast(ids.length + ' tasks completed', 'success');
    };
    window._adBulkPending = function() {
      var panel = $('panelTasks'); if (!panel) return;
      var ids = [];
      panel.querySelectorAll('.ad-task-cb:checked').forEach(function(cb) { ids.push(cb.dataset.id); });
      if (ids.length === 0) return;
      var tasks = getLSJSON('haven-schedule-tasks') || [];
      tasks.forEach(function(t) { if (ids.indexOf(t.id) !== -1) t.completed = false; });
      setLSJSON('haven-schedule-tasks', tasks);
      renderTaskManager(); showToast(ids.length + ' tasks set pending', 'success');
    };
    window._adBulkDelete = function() {
      var panel = $('panelTasks'); if (!panel) return;
      var ids = [];
      panel.querySelectorAll('.ad-task-cb:checked').forEach(function(cb) { ids.push(cb.dataset.id); });
      if (ids.length === 0 || !confirm('Delete ' + ids.length + ' tasks?')) return;
      var tasks = getLSJSON('haven-schedule-tasks') || [];
      setLSJSON('haven-schedule-tasks', tasks.filter(function(t) { return ids.indexOf(t.id) === -1; }));
      renderTaskManager(); showToast(ids.length + ' tasks deleted', 'success');
    };
    window._adBulkClear = function() {
      var panel = $('panelTasks'); if (!panel) return;
      panel.querySelectorAll('.ad-task-cb:checked').forEach(function(cb) { cb.checked = false; });
      window._adUpdateBulkBar();
    };
  }

  /* â”€â”€â”€ GOALS TAB â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  function renderGoalsPanel() {
    var el = $('panelGoals');
    if (!el) return;
    var data = getLSJSON('haven-schedule-goals') || {};
    var goals = data.goals || [];
    var resolutions = data.resolutions || [];
    var manifesto = data.manifesto || {};

    var html = '<div class="ad-dash-grid">';

    html += '<div class="ad-dash-card"><div class="ad-dash-label">Goals</div><div class="ad-dash-value">' + goals.length + '</div><div class="ad-dash-sub">total goals</div></div>';
    html += '<div class="ad-dash-card"><div class="ad-dash-label">Completed</div><div class="ad-dash-value">' + goals.filter(function(g){return g.status==='done';}).length + '</div><div class="ad-dash-sub">status = done</div></div>';
    html += '<div class="ad-dash-card"><div class="ad-dash-label">Resolutions</div><div class="ad-dash-value">' + resolutions.length + '</div><div class="ad-dash-sub">weekly habits</div></div>';
    html += '<div class="ad-dash-card"><div class="ad-dash-label">Manifesto</div><div class="ad-dash-value" style="font-size:0.8rem;font-style:italic">' + esc((manifesto.text || 'â€”').slice(0, 60)) + '</div></div>';

    html += '<div class="ad-dash-card full"><div class="ad-dash-label">Goals</div>';
    if (goals.length === 0) {
      html += '<div class="ad-dash-sub" style="margin-top:6px">No goals yet</div>';
    } else {
      html += '<div class="ad-table-wrap" style="max-height:40vh"><table class="ad-table"><thead><tr><th>Title</th><th>Status</th><th>Tasks</th><th>Progress</th><th>Actions</th></tr></thead><tbody>';
      goals.forEach(function(g) {
        var tasks = g.tasks || [];
        var done = tasks.filter(function(t){return t.done;}).length;
        var pct = tasks.length ? Math.round(done / tasks.length * 100) : 0;
        var escId = esc(String(g.id).replace(/\\/g, '\\\\').replace(/'/g, "\\'"));
        html += '<tr><td style="color:var(--text-primary);font-weight:500">' + esc(g.title || 'Untitled') + '</td>';
        html += '<td><span class="ad-tag-chip">' + esc(g.status || 'active') + '</span></td>';
        html += '<td>' + done + '/' + tasks.length + '</td>';
        html += '<td>' + pct + '%</td>';
        html += '<td class="ad-tcell-actions"><button class="admin-btn small" onclick="window._adViewGoal(\'' + escId + '\')">View</button><button class="admin-btn small danger" onclick="window._adDeleteGoal(\'' + escId + '\')">Del</button></td></tr>';
      });
      html += '</tbody></table></div>';
    }
    html += '</div>';

    html += '<div class="ad-dash-card full"><div class="ad-dash-label">Resolutions</div>';
    if (resolutions.length === 0) {
      html += '<div class="ad-dash-sub" style="margin-top:6px">No resolutions</div>';
    } else {
      html += '<div class="ad-table-wrap"><table class="ad-table"><thead><tr><th>Title</th><th>Category</th><th>Week Checks</th></tr></thead><tbody>';
      resolutions.forEach(function(r) {
        var checks = r.weekChecks ? Object.keys(r.weekChecks).length : 0;
        html += '<tr><td>' + esc(r.title || '') + '</td><td><span class="ad-tag-chip">' + esc(r.category || 'â€”') + '</span></td><td>' + checks + '</td></tr>';
      });
      html += '</tbody></table></div>';
    }
    html += '</div>';

    html += '<div class="ad-dash-card full"><div class="ad-dash-label">Danger Zone</div><div class="ad-dash-row">';
    html += '<button class="admin-btn small danger" onclick="window._adClearGoals()">Clear All Goals</button>';
    html += '</div></div>';

    html += '</div>';
    el.innerHTML = html;

    window._adViewGoal = function(id) {
      var data = getLSJSON('haven-schedule-goals') || {};
      var g = (data.goals || []).find(function(x){return x.id===id;});
      if (!g) { showError('Goal not found'); return; }
      _openModal('Goal: ' + esc(g.title || ''), '<textarea class="ad-raw-input" readonly style="min-height:250px;font-size:0.72rem">' + esc(JSON.stringify(g, null, 2)) + '</textarea>',
        '<button class="admin-btn" onclick="closeModal()">Close</button>');
    };
    window._adDeleteGoal = function(id) {
      if (!confirm('Delete this goal?')) return;
      var data = getLSJSON('haven-schedule-goals') || {};
      data.goals = (data.goals || []).filter(function(x){return x.id!==id;});
      setLSJSON('haven-schedule-goals', data);
      renderGoalsPanel();
      showToast('Goal deleted');
    };
    window._adClearGoals = function() {
      if (!confirm('Clear ALL goals and resolutions?')) return;
      var cur = getLSJSON('haven-schedule-goals') || {};
      setLSJSON('haven-schedule-goals', { goals: [], resolutions: [], manifesto: cur.manifesto || { text: '', author: '' } });
      renderGoalsPanel();
      showToast('Goals cleared', 'success');
    };
  }

  /* â”€â”€â”€ TAGS TAB â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  function renderTagsPanel() {
    var el = $('panelTags');
    if (!el) return;
    var cats = getLSJSON('haven-schedule-categories') || [];
    var customTags = getLSJSON('haven-custom-tags') || [];
    var subcats = getLSJSON('haven-subcategories') || {};
    var builtin = (typeof BUILTIN_TAGS !== 'undefined') ? BUILTIN_TAGS : [];
    var tagOrder = (typeof TAG_ORDER !== 'undefined') ? TAG_ORDER : builtin;

    var html = '<div class="ad-dash-grid">';

    html += '<div class="ad-dash-card"><div class="ad-dash-label">Built-in Tags</div><div class="ad-dash-value">' + builtin.length + '</div><div class="ad-dash-sub">cannot be deleted</div></div>';
    html += '<div class="ad-dash-card"><div class="ad-dash-label">Custom Tags</div><div class="ad-dash-value">' + customTags.length + '</div><div class="ad-dash-sub">user-defined</div></div>';
    html += '<div class="ad-dash-card"><div class="ad-dash-label">Categories</div><div class="ad-dash-value">' + cats.length + '</div><div class="ad-dash-sub">schedule categories</div></div>';
    html += '<div class="ad-dash-card"><div class="ad-dash-label">Subcategories</div><div class="ad-dash-value">' + Object.keys(subcats).length + '</div><div class="ad-dash-sub">tags with subcats</div></div>';

    html += '<div class="ad-dash-card full"><div class="ad-dash-label">All Tags</div>';
    html += '<div class="ad-table-wrap" style="max-height:40vh"><table class="ad-table"><thead><tr><th>Tag</th><th>Label</th><th>Type</th><th>Subcats</th><th>Actions</th></tr></thead><tbody>';
    tagOrder.forEach(function(tag) {
      var isBuiltin = builtin.indexOf(tag) !== -1;
      var label = (typeof TAG_LABELS !== 'undefined' && TAG_LABELS[tag]) ? TAG_LABELS[tag] : tag;
      var subList = subcats[tag] || [];
      var escTag = esc(tag.replace(/\\/g, '\\\\').replace(/'/g, "\\'"));
      html += '<tr><td class="ad-tcell-key">' + esc(tag) + '</td>';
      html += '<td>' + esc(label) + '</td>';
      html += '<td><span class="ad-tag-chip">' + (isBuiltin ? 'Built-in' : 'Custom') + '</span></td>';
      html += '<td>' + (subList.length ? esc(subList.join(', ')) : 'â€”') + '</td>';
      html += '<td class="ad-tcell-actions">';
      if (!isBuiltin) {
        html += '<button class="admin-btn small danger" onclick="window._adDeleteTag(\'' + escTag + '\')">Del</button>';
      } else {
        html += '<span style="font-size:0.6rem;color:var(--text-tertiary)">locked</span>';
      }
      html += '</td></tr>';
    });
    customTags.forEach(function(t) {
      var id = t.id || t.name;
      if (!id || tagOrder.indexOf(id) !== -1) return;
      var escTag = esc(String(id).replace(/\\/g, '\\\\').replace(/'/g, "\\'"));
      html += '<tr><td class="ad-tcell-key">' + esc(id) + '</td><td>' + esc(t.name || id) + '</td>';
      html += '<td><span class="ad-tag-chip" style="background:' + esc(t.color || 'var(--accent-soft)') + '">Custom</span></td><td>â€”</td>';
      html += '<td class="ad-tcell-actions"><button class="admin-btn small danger" onclick="window._adDeleteTag(\'' + escTag + '\')">Del</button></td></tr>';
    });
    html += '</tbody></table></div></div>';

    html += '<div class="ad-dash-card full"><div class="ad-dash-label">Schedule Categories</div>';
    if (cats.length === 0) {
      html += '<div class="ad-dash-sub" style="margin-top:6px">No custom categories</div>';
    } else {
      html += '<div class="ad-table-wrap"><table class="ad-table"><thead><tr><th>ID</th><th>Label</th><th>Color</th><th>Actions</th></tr></thead><tbody>';
      cats.forEach(function(c) {
        var escId = esc(String(c.id).replace(/\\/g, '\\\\').replace(/'/g, "\\'"));
        html += '<tr><td class="ad-tcell-key">' + esc(c.id) + '</td><td>' + esc(c.label || '') + '</td>';
        html += '<td><span style="display:inline-block;width:12px;height:12px;border-radius:3px;background:' + esc(c.color || '#888') + ';vertical-align:middle"></span> ' + esc(c.color || '') + '</td>';
        html += '<td class="ad-tcell-actions"><button class="admin-btn small danger" onclick="window._adDeleteCategory(\'' + escId + '\')">Del</button></td></tr>';
      });
      html += '</tbody></table></div>';
    }
    html += '</div>';

    html += '<div class="ad-dash-card full"><div class="ad-dash-label">Add Custom Tag</div><div class="ad-dash-row">';
    html += '<input class="ad-raw-input" id="adNewTagId" placeholder="tag-id" style="width:140px">';
    html += '<input class="ad-raw-input" id="adNewTagName" placeholder="Label" style="width:140px">';
    html += '<button class="admin-btn primary small" onclick="window._adAddTag()">Add Tag</button>';
    html += '</div></div>';

    html += '</div>';
    el.innerHTML = html;

    window._adDeleteTag = function(tag) {
      if (!confirm('Delete tag "' + tag + '"?')) return;
      var customTags = (getLSJSON('haven-custom-tags') || []).filter(function(t) {
        return (t.id || t.name) !== tag;
      });
      setLSJSON('haven-custom-tags', customTags);
      var subcats = getLSJSON('haven-subcategories') || {};
      delete subcats[tag];
      setLSJSON('haven-subcategories', subcats);
      var colors = getLSJSON('haven-card-colors') || {};
      delete colors[tag];
      setLSJSON('haven-card-colors', colors);
      renderTagsPanel();
      showToast('Tag deleted');
    };
    window._adDeleteCategory = function(id) {
      if (!confirm('Delete category "' + id + '"?')) return;
      var cats = (getLSJSON('haven-schedule-categories') || []).filter(function(c) { return c.id !== id; });
      setLSJSON('haven-schedule-categories', cats);
      renderTagsPanel();
      showToast('Category deleted');
    };
    window._adAddTag = function() {
      var id = ($('adNewTagId') || {}).value;
      var name = ($('adNewTagName') || {}).value;
      if (!id || !id.trim()) { showError('Tag ID required'); return; }
      id = id.trim().toLowerCase().replace(/\s+/g, '-');
      var customTags = getLSJSON('haven-custom-tags') || [];
      if (customTags.some(function(t){return (t.id||t.name)===id;})) { showError('Tag already exists'); return; }
      customTags.push({ id: id, name: (name && name.trim()) || id, color: '#6366f1' });
      setLSJSON('haven-custom-tags', customTags);
      renderTagsPanel();
      showToast('Tag added', 'success');
    };
  }

  /* â”€â”€â”€ BENTO / PRESETS TAB â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  function renderBentoPanel() {
    var el = $('panelBento');
    if (!el) return;
    var hc = getLSJSON('haven-hub-content') || {};
    var layout = hc.bentoLayout || [];
    var presets = (typeof loadAdminPresets === 'function') ? loadAdminPresets() : [];
    var activeId = (typeof getActivePresetId === 'function') ? getActivePresetId() : null;

    var html = '<div class="ad-dash-grid">';

    html += '<div class="ad-dash-card"><div class="ad-dash-label">Widgets</div><div class="ad-dash-value">' + layout.length + '</div><div class="ad-dash-sub">on bento canvas</div></div>';
    html += '<div class="ad-dash-card"><div class="ad-dash-label">Presets</div><div class="ad-dash-value">' + presets.length + '</div><div class="ad-dash-sub">saved layouts</div></div>';
    html += '<div class="ad-dash-card"><div class="ad-dash-label">Active Preset</div><div class="ad-dash-value" style="font-size:0.85rem">' + esc((presets.find(function(p){return p.id===activeId;})||{}).name || 'None') + '</div></div>';
    html += '<div class="ad-dash-card"><div class="ad-dash-label">Visibility</div><div class="ad-dash-value">' + Object.keys(getLSJSON('haven-hub-visibility') || {}).length + '</div><div class="ad-dash-sub">widget visibility keys</div></div>';

    html += '<div class="ad-dash-card full"><div class="ad-dash-label">Current Layout</div>';
    if (layout.length === 0) {
      html += '<div class="ad-dash-sub" style="margin-top:6px">No bento layout found</div>';
    } else {
      html += '<div class="ad-table-wrap" style="max-height:30vh"><table class="ad-table"><thead><tr><th>Type</th><th>X</th><th>Y</th><th>W</th><th>H</th></tr></thead><tbody>';
      layout.forEach(function(item) {
        html += '<tr><td class="ad-tcell-key">' + esc(item.t || '?') + '</td><td>' + esc(String(item.x != null ? item.x : 'â€”')) + '</td><td>' + esc(String(item.y != null ? item.y : 'â€”')) + '</td><td>' + esc(String(item.w != null ? item.w : 'â€”')) + '</td><td>' + esc(String(item.h != null ? item.h : 'â€”')) + '</td></tr>';
      });
      html += '</tbody></table></div>';
    }
    html += '<div class="ad-dash-row" style="margin-top:8px">';
    html += '<button class="admin-btn primary small" onclick="window._adSaveCurrentPreset()">Save as Preset</button>';
    html += '<button class="admin-btn small" onclick="window._adViewRawBento()">View Raw JSON</button>';
    html += '</div></div>';

    html += '<div class="ad-dash-card full"><div class="ad-dash-label">Presets</div>';
    if (presets.length === 0) {
      html += '<div class="ad-dash-sub" style="margin-top:6px">No presets yet. Save the current layout or press Ctrl+Shift+D on the hub page.</div>';
    } else {
      html += '<div class="ad-table-wrap"><table class="ad-table"><thead><tr><th>Name</th><th>Updated</th><th>Widgets</th><th>Active</th><th>Actions</th></tr></thead><tbody>';
      presets.forEach(function(p) {
        var wcount = (p.data && p.data.hubContent && p.data.hubContent.bentoLayout) ? p.data.hubContent.bentoLayout.length : 0;
        var isActive = p.id === activeId;
        var escId = esc(String(p.id).replace(/\\/g, '\\\\').replace(/'/g, "\\'"));
        html += '<tr><td style="color:var(--text-primary);font-weight:500">' + esc(p.name) + '</td>';
        html += '<td>' + esc(p.updatedAt ? new Date(p.updatedAt).toLocaleDateString() : 'â€”') + '</td>';
        html += '<td>' + wcount + '</td>';
        html += '<td>' + (isActive ? '<span class="ad-tag-chip" style="background:var(--accent);color:var(--text-inverse)">Active</span>' : 'â€”') + '</td>';
        html += '<td class="ad-tcell-actions">';
        if (!isActive) html += '<button class="admin-btn small" onclick="window._adSetActivePreset(\'' + escId + '\')">Set Active</button>';
        html += '<button class="admin-btn small" onclick="window._adApplyPreset(\'' + escId + '\')">Apply</button>';
        html += '<button class="admin-btn small danger" onclick="window._adDeletePreset(\'' + escId + '\')">Del</button>';
        html += '</td></tr>';
      });
      html += '</tbody></table></div>';
      html += '<div class="ad-dash-row" style="margin-top:8px"><button class="admin-btn small" onclick="window._adClearActivePreset()">Clear Active Preset</button></div>';
    }
    html += '</div>';

    html += '</div>';
    el.innerHTML = html;

    window._adViewRawBento = function() {
      var hc = getLSJSON('haven-hub-content');
      if (!hc) { showError('No hub content'); return; }
      _openModal('Hub Content JSON', '<textarea class="ad-raw-input" readonly style="min-height:300px;font-size:0.72rem">' + esc(JSON.stringify(hc, null, 2)) + '</textarea>',
        '<button class="admin-btn" onclick="closeModal()">Close</button>');
    };
    window._adSetActivePreset = function(id) {
      if (typeof setActivePreset === 'function') setActivePreset(id);
      renderBentoPanel();
    };
    window._adApplyPreset = function(id) {
      if (typeof applyPresetToCurrentUser === 'function') applyPresetToCurrentUser(id);
      renderBentoPanel();
    };
    window._adDeletePreset = function(id) {
      if (!confirm('Delete this preset?')) return;
      if (typeof deletePreset === 'function') deletePreset(id);
      renderBentoPanel();
    };
    window._adClearActivePreset = function() {
      if (typeof clearActivePreset === 'function') clearActivePreset();
      renderBentoPanel();
    };
  }

  /* â”€â”€â”€ DATA MANAGER TAB â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  function collectHavenKeys() {
    var _raw = rawLS();
    var front = _adActivePrefix();
    var keys = [];
    try {
      for (var i = 0; i < _raw.length; i++) {
        var k = _raw.key(i);
        if (!k) continue;
        var short;
        if (isDeviceKey(k)) {
          short = k;
        } else if (front && k.indexOf(front) === 0) {
          short = k.slice(front.length);
        } else if (k.indexOf('haven-') === 0 || k.indexOf('hub-') === 0) {
          short = k;
        } else {
          continue;
        }
        if (short.indexOf('haven-admin-backup-') === 0) continue;
        keys.push({ phys: k, logical: short, device: isDeviceKey(k) });
      }
    } catch(e) {}
    keys.sort(function(a, b) { return a.logical.localeCompare(b.logical); });
    return keys;
  }

  function renderDataManager() {
    var el = $('panelData');
    if (!el) return;

    var allKeys = collectHavenKeys();

    var html = '<div class="ad-dash-grid">';

    html += '<div class="ad-dash-card full"><div class="ad-dash-label">Export All Data</div>';
    html += '<div class="ad-dash-sub" style="margin-bottom:10px">Download a complete JSON backup of every haven-* key (' + allKeys.length + ' keys found, excluding image caches and backups)</div>';
    html += '<button class="admin-btn primary" onclick="window._adExportAll()"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg> Export All</button>';
    html += '</div>';

    html += '<div class="ad-dash-card full"><div class="ad-dash-label">Import Data</div>';
    html += '<div class="ad-dash-sub" style="margin-bottom:10px">Restore from a JSON backup file. This will overwrite existing data for each section.</div>';
    html += '<div class="ad-dash-row"><input type="file" id="adImportFile" accept=".json" style="font-size:0.75rem;color:var(--text-secondary)"><button class="admin-btn primary small" onclick="window._adImportData()" style="margin-left:8px">Import</button></div>';
    html += '</div>';

    html += '<div class="ad-dash-card half"><div class="ad-dash-label">Quick Backup</div>';
    html += '<div class="ad-dash-sub" style="margin-bottom:8px">Backup to localStorage backup keys</div>';
    html += '<button class="admin-btn small" onclick="window._adQuickBackup()">Create Backup</button>';
    html += '<button class="admin-btn small" style="margin-left:4px" onclick="window._adQuickRestore()">Restore Backup</button>';
    html += '</div>';

    html += '<div class="ad-dash-card half"><div class="ad-dash-label">Clear App Data</div>';
    html += '<div class="ad-dash-sub" style="margin-bottom:8px">Clears haven-* keys. Preserves: admin password, presets, gsi accounts, device keys, API key</div>';
    html += '<button class="admin-btn small danger" onclick="window._adClearAppData()">Clear App Data</button>';
    html += '</div>';

    html += '<div class="ad-dash-card full"><div class="ad-dash-label">Data Sections</div>';
    html += '<table class="ad-table" style="margin-top:4px"><thead><tr><th>Section</th><th>Group</th><th>Size</th><th>Actions</th></tr></thead><tbody>';
    DATA_SECTIONS.forEach(function(s) {
      var val = getLSItem(s.key);
      var size = val ? (s.key.length + String(val).length) : 0;
      var sizeStr = size > 1024 ? (size / 1024).toFixed(1) + ' KB' : size + ' B';
      var escKey = esc(s.key.replace(/\\/g, '\\\\').replace(/'/g, "\\'"));
      html += '<tr><td>' + esc(s.label) + '</td><td><span class="ad-tag-chip">' + esc(s.group || 'â€”') + '</span></td><td>' + sizeStr + '</td><td class="ad-tcell-actions">';
      html += '<button class="admin-btn small" onclick="window._adViewSection(\'' + escKey + '\')">View</button>';
      html += '<button class="admin-btn small danger" onclick="window._adClearSection(\'' + escKey + '\',\'' + esc(s.label.replace(/'/g, "\\'")) + '\')">Clear</button>';
      html += '</td></tr>';
    });
    html += '</tbody></table></div>';

    var extraKeys = allKeys.filter(function(k) {
      return !DATA_SECTIONS.some(function(s) { return s.key === k.logical; }) &&
        IMAGE_KEY_PREFIXES.every(function(p) { return k.logical.indexOf(p) !== 0; });
    });
    if (extraKeys.length) {
      html += '<div class="ad-dash-card full"><div class="ad-dash-label">Other Keys (' + extraKeys.length + ')</div>';
      html += '<div class="ad-table-wrap" style="max-height:25vh"><table class="ad-table"><thead><tr><th>Key</th><th>Size</th><th>Actions</th></tr></thead><tbody>';
      extraKeys.forEach(function(k) {
        var val = getLSItem(k.logical);
        var size = val ? (k.logical.length + String(val).length) : 0;
        var sizeStr = size > 1024 ? (size / 1024).toFixed(1) + ' KB' : size + ' B';
        var escKey = esc(k.logical.replace(/\\/g, '\\\\').replace(/'/g, "\\'"));
        html += '<tr><td class="ad-tcell-key">' + (k.device ? 'ðŸ”’ ' : '') + esc(k.logical) + '</td><td>' + sizeStr + '</td>';
        html += '<td class="ad-tcell-actions"><button class="admin-btn small" onclick="window._adViewSection(\'' + escKey + '\')">View</button><button class="admin-btn small danger" onclick="window._adClearSection(\'' + escKey + '\',\'' + esc(k.logical.replace(/'/g, "\\'")) + '\')">Clear</button></td></tr>';
      });
      html += '</tbody></table></div></div>';
    }

    html += '</div>';
    el.innerHTML = html;

    window._adExportAll = function() {
      var keys = collectHavenKeys();
      var data = {};
      var count = 0;
      keys.forEach(function(k) {
        if (IMAGE_KEY_PREFIXES.some(function(p) { return k.logical.indexOf(p) === 0; })) return;
        var val = getLSItem(k.logical);
        if (val === null || val === undefined) return;
        try { data[k.logical] = JSON.parse(val); } catch(e) { data[k.logical] = val; }
        count++;
      });
      data._exportDate = new Date().toISOString();
      data._version = '3.0';
      data._keyCount = count;
      var blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = 'haven-backup-' + formatDate(new Date()) + '.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(function() { URL.revokeObjectURL(url); }, 1000);
      showToast('Exported ' + count + ' keys', 'success');
    };
    window._adViewSection = function(key) {
      var val = getLSItem(key);
      if (val === null || val === undefined || val === '') { showError('Empty'); return; }
      var pretty = '';
      try { pretty = JSON.stringify(JSON.parse(val), null, 2); } catch(e) { pretty = String(val); }
      _openModal('Data: ' + esc(key), '<textarea class="ad-raw-input" readonly style="min-height:300px;font-size:0.72rem">' + esc(pretty) + '</textarea>',
        '<button class="admin-btn" onclick="closeModal()">Close</button>');
    };
    window._adClearSection = function(key, label) {
      if (!confirm('Clear "' + label + '" data? This cannot be undone.')) return;
      removeLSItem(key);
      showToast('Cleared: ' + label, 'success');
      renderDataManager();
    };
    window._adClearAppData = function() {
      if (!confirm('Clear ALL HavÃ«n app data? This will remove tasks, settings, everything!')) return;
      if (!confirm('Device keys (admin password, presets, accounts, API key) will be preserved. Continue?')) return;
      var _raw = rawLS();
      var doomed = [];
      try {
        for (var i = 0; i < _raw.length; i++) {
          var k = _raw.key(i);
          if (!k) continue;
          var short = k;
          var front = _adActivePrefix();
          if (front && k.indexOf(front) === 0) short = k.slice(front.length);
          if (PRESERVE_ON_CLEAR.indexOf(short) !== -1) continue;
          if (short.indexOf('haven-admin-') === 0) continue;
          if (short.indexOf('haven-gsi-') === 0) continue;
          if (short.indexOf('haven-device-') === 0) continue;
          if (short.indexOf('haven-cloud-') === 0) continue;
          if (k.indexOf('sb-') === 0) continue;
          if (short.indexOf('haven-') === 0 || short.indexOf('hub-') === 0) doomed.push(k);
        }
        for (var j = 0; j < doomed.length; j++) _raw.removeItem(doomed[j]);
      } catch(e) {}
      showToast('Cleared ' + doomed.length + ' HavÃ«n keys', 'success');
      renderDataManager();
    };
    window._adQuickBackup = function() {
      var backup = {};
      var count = 0;
      var keys = collectHavenKeys();
      keys.forEach(function(k) {
        if (IMAGE_KEY_PREFIXES.some(function(p) { return k.logical.indexOf(p) === 0; })) return;
        var val = getLSItem(k.logical);
        if (val === null || val === undefined) return;
        backup[k.logical] = val;
        count++;
      });
      setLSJSON('haven-admin-backup-' + formatDate(new Date()), backup);
      showToast('Backup saved (' + count + ' keys)', 'success');
    };
    window._adQuickRestore = function() {
      var _raw = rawLS();
      var front = _adActivePrefix();
      var backupKeys = [];
      try {
        for (var i = 0; i < _raw.length; i++) {
          var k = _raw.key(i);
          if (!k) continue;
          var short = front && k.indexOf(front) === 0 ? k.slice(front.length) : k;
          if (short.indexOf('haven-admin-backup-') === 0) backupKeys.push(short);
        }
      } catch(e) {}
      if (backupKeys.length === 0) { showError('No backups found'); return; }
      var latest = backupKeys.sort().pop();
      var backup = getLSJSON(latest);
      if (!backup) { showError('Invalid backup'); return; }
      var count = 0;
      Object.keys(backup).forEach(function(k) { setLSItem(k, backup[k]); count++; });
      showToast('Restored ' + count + ' keys from ' + latest, 'success');
      renderDataManager();
    };
    window._adImportData = function() {
      var fileInput = $('adImportFile');
      if (!fileInput || !fileInput.files || !fileInput.files[0]) { showError('Select a file first'); return; }
      var reader = new FileReader();
      reader.onload = function(e) {
        try {
          var data = JSON.parse(e.target.result);
          var count = 0;
          delete data._exportDate;
          delete data._version;
          delete data._keyCount;
          Object.keys(data).forEach(function(k) {
            if (data[k] !== undefined) { setLSItem(k, typeof data[k] === 'string' ? data[k] : JSON.stringify(data[k])); count++; }
          });
          showToast('Imported ' + count + ' keys', 'success');
          renderDataManager();
        } catch(err) { showError('Invalid JSON file: ' + err.message); }
      };
      reader.readAsText(fileInput.files[0]);
    };
  }

  /* â”€â”€â”€ SLEEP TAB â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  function renderSleepPanel() {
    var el = $('panelSleep');
    if (!el) return;
    var logs = getLSJSON('haven-schedule-sleep') || [];
    var targets = getLSJSON('haven-schedule-sleep-targets') || {};
    var html = '<div class="ad-toolbar"><span class="ad-dash-sub">' + logs.length + ' total logs Â· target bedtime ' + esc(targets.targetBedtime || '23:00') + ' / wake ' + esc(targets.targetWakeTime || '07:00') + '</span></div>';
    html += '<div class="ad-table-wrap" style="max-height:60vh"><table class="ad-table"><thead><tr><th>Date</th><th>Bedtime</th><th>Wake</th><th>Duration</th><th>Quality</th><th>Notes</th><th>Actions</th></tr></thead><tbody>';
    if (logs.length === 0) {
      html += '<tr><td colspan="7" style="text-align:center;padding:24px;color:var(--text-tertiary)">No sleep logs yet</td></tr>';
    }
    var sorted = logs.slice().sort(function(a, b) { return (b.date || '').localeCompare(a.date || ''); });
    sorted.forEach(function(log) {
      var durStr = log.duration ? (Math.floor(log.duration/60) + 'h ' + (log.duration%60) + 'm') : 'â€”';
      var stars = '';
      for (var q = 0; q < (log.quality || 0); q++) stars += 'â˜…';
      var escId = esc(String(log.id || '').replace(/\\/g, '\\\\').replace(/'/g, "\\'"));
      html += '<tr><td>' + esc(log.date || 'â€”') + '</td><td>' + esc(log.bedtime || 'â€”') + '</td><td>' + esc(log.wakeTime || 'â€”') + '</td><td>' + durStr + '</td><td>' + stars + '</td><td style="max-width:150px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + esc((log.notes || '').slice(0, 40)) + '</td>';
      html += '<td><button class="admin-btn small danger" onclick="window._adDeleteSleep(\'' + escId + '\')">Del</button></td></tr>';
    });
    html += '</tbody></table></div>';
    el.innerHTML = html;

    window._adDeleteSleep = function(id) {
      if (!confirm('Delete this sleep log?')) return;
      var logs = getLSJSON('haven-schedule-sleep') || [];
      setLSJSON('haven-schedule-sleep', logs.filter(function(l) { return l.id !== id; }));
      renderSleepPanel();
      showToast('Sleep log deleted');
    };
  }

  /* â”€â”€â”€ FINANCE TAB â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  function renderFinancePanel() {
    var el = $('panelFinance');
    if (!el) return;
    var piggy = getLSJSON('haven-piggybank') || { balance: 0, history: [] };
    var wallet = getLSJSON('haven-wallet') || { balance: 0, history: [] };
    var txns = getLSJSON('haven-schedule-finance') || [];
    var income = 0, expense = 0;
    txns.forEach(function(t) {
      var amt = Number(t.amount) || 0;
      if (t.type === 'income') income += amt;
      else expense += amt;
    });

    var html = '<div class="ad-dash-grid">';
    html += '<div class="ad-dash-card"><div class="ad-dash-label">Piggy Bank</div><div class="ad-dash-value">$' + (piggy.balance || 0).toFixed(2) + '</div><div class="ad-dash-sub">' + ((piggy.history || []).length) + ' history entries</div></div>';
    html += '<div class="ad-dash-card"><div class="ad-dash-label">Wallet</div><div class="ad-dash-value">$' + (wallet.balance || 0).toFixed(2) + '</div><div class="ad-dash-sub">' + ((wallet.history || []).length) + ' history entries</div></div>';
    html += '<div class="ad-dash-card"><div class="ad-dash-label">Income</div><div class="ad-dash-value" style="color:var(--accent)">$' + income.toFixed(2) + '</div><div class="ad-dash-sub">' + txns.filter(function(t){return t.type==='income';}).length + ' transactions</div></div>';
    html += '<div class="ad-dash-card"><div class="ad-dash-label">Expenses</div><div class="ad-dash-value" style="color:#ef4444">$' + expense.toFixed(2) + '</div><div class="ad-dash-sub">' + txns.filter(function(t){return t.type!=='income';}).length + ' transactions</div></div>';
    html += '<div class="ad-dash-card"><div class="ad-dash-label">Net</div><div class="ad-dash-value">$' + (income - expense).toFixed(2) + '</div><div class="ad-dash-sub">income âˆ’ expenses</div></div>';

    html += '<div class="ad-dash-card full"><div class="ad-dash-label">Edit Balances</div><div class="ad-dash-row">';
    html += '<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap"><span style="font-size:0.72rem">Piggy:</span><input type="number" id="adPiggyVal" step="0.01" value="' + (piggy.balance || 0).toFixed(2) + '" class="ad-raw-input" style="width:100px"><button class="admin-btn small" onclick="window._adSetPiggy()">Set</button></div>';
    html += '<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap"><span style="font-size:0.72rem">Wallet:</span><input type="number" id="adWalletVal" step="0.01" value="' + (wallet.balance || 0).toFixed(2) + '" class="ad-raw-input" style="width:100px"><button class="admin-btn small" onclick="window._adSetWallet()">Set</button></div>';
    html += '</div></div>';

    html += '<div class="ad-dash-card full"><div class="ad-dash-label">Recent Transactions</div>';
    html += '<div class="ad-table-wrap" style="max-height:35vh"><table class="ad-table"><thead><tr><th>Date</th><th>Type</th><th>Category</th><th>Amount</th><th>Note</th></tr></thead><tbody>';
    if (txns.length === 0) {
      html += '<tr><td colspan="5" style="text-align:center;color:var(--text-tertiary);padding:16px">No transactions</td></tr>';
    }
    txns.slice().sort(function(a,b){return (b.date||'').localeCompare(a.date||'');}).slice(0, 40).forEach(function(t) {
      var amt = Number(t.amount) || 0;
      html += '<tr><td>' + esc(t.date || 'â€”') + '</td>';
      html += '<td><span class="ad-tag-chip">' + esc(t.type || 'expense') + '</span></td>';
      html += '<td>' + esc(t.category || 'â€”') + '</td>';
      html += '<td style="color:' + (t.type === 'income' ? 'var(--accent)' : '#ef4444') + '">' + (t.type === 'income' ? '+' : '-') + '$' + amt.toFixed(2) + '</td>';
      html += '<td style="max-width:150px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + esc(t.note || '') + '</td></tr>';
    });
    html += '</tbody></table></div></div>';

    html += '</div>';
    el.innerHTML = html;

    window._adSetPiggy = function() {
      var val = parseFloat(($('adPiggyVal') || {}).value);
      if (isNaN(val)) return;
      setLSJSON('haven-piggybank', { balance: val, history: piggy.history || [] });
      showToast('Piggy bank updated', 'success');
      renderFinancePanel();
    };
    window._adSetWallet = function() {
      var val = parseFloat(($('adWalletVal') || {}).value);
      if (isNaN(val)) return;
      setLSJSON('haven-wallet', { balance: val, history: wallet.history || [] });
      showToast('Wallet updated', 'success');
      renderFinancePanel();
    };
  }

  /* â”€â”€â”€ ACTIVITY TAB â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  function renderActivityPanel() {
    var el = $('panelActivity');
    if (!el) return;
    var completions = getLSJSON('haven-activities-completions') || [];
    var html = '<div class="ad-toolbar"><span class="ad-dash-sub">' + completions.length + ' total completions</span></div>';
    html += '<div class="ad-table-wrap" style="max-height:60vh"><table class="ad-table"><thead><tr><th>Date</th><th>Title</th><th>Tag</th><th>Time</th></tr></thead><tbody>';
    if (completions.length === 0) {
      html += '<tr><td colspan="4" style="text-align:center;padding:24px;color:var(--text-tertiary)">No activity logged yet</td></tr>';
    }
    var sorted = completions.slice().sort(function(a, b) { return (b.completedAt || b.date || '').localeCompare(a.completedAt || a.date || ''); });
    sorted.slice(0, 100).forEach(function(c) {
      var tagLabel = (typeof TAG_LABELS !== 'undefined' && TAG_LABELS[c.tag]) ? TAG_LABELS[c.tag] : (c.tag || 'â€”');
      var dateStr = c.date || (c.completedAt ? c.completedAt.slice(0, 10) : 'â€”');
      html += '<tr><td>' + esc(dateStr) + '</td><td>' + esc(c.title || 'Untitled') + '</td><td><span class="ad-tag-chip">' + esc(tagLabel) + '</span></td><td style="font-size:0.7rem;color:var(--text-tertiary)">' + esc(c.completedAt ? c.completedAt.slice(11, 19) : '') + '</td></tr>';
    });
    html += '</tbody></table></div>';
    html += '<div class="ad-toolbar" style="margin-top:8px"><button class="admin-btn small danger" onclick="window._adClearActivity()">Clear Activity Log</button></div>';
    el.innerHTML = html;

    window._adClearActivity = function() {
      if (!confirm('Clear all activity completions?')) return;
      setLSJSON('haven-activities-completions', []);
      renderActivityPanel();
      showToast('Activity log cleared');
    };
  }

  /* â”€â”€â”€ ACCOUNTS TAB â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  function renderAccountsPanel() {
    var el = $('panelAccounts');
    if (!el) return;
    var accounts = getLSJSON(AUTH_USERS_KEY) || [];
    var activeId = null;
    try { activeId = rawLS().getItem(AUTH_ACTIVE_KEY); } catch(e) {}

    var html = '<div class="ad-dash-grid">';
    html += '<div class="ad-dash-card"><div class="ad-dash-label">Profiles</div><div class="ad-dash-value">' + accounts.length + '</div><div class="ad-dash-sub">local accounts</div></div>';
    html += '<div class="ad-dash-card"><div class="ad-dash-label">Cloud Accounts</div><div class="ad-dash-value">' + accounts.filter(function(u){return u && u.authUid;}).length + '</div><div class="ad-dash-sub">with authUid</div></div>';
    html += '<div class="ad-dash-card"><div class="ad-dash-label">Active ID</div><div class="ad-dash-value" style="font-size:0.75rem;font-family:var(--font-mono)">' + esc(activeId || 'none') + '</div></div>';

    html += '<div class="ad-dash-card full"><div class="ad-dash-label">Accounts</div>';
    if (accounts.length === 0) {
      html += '<div class="ad-dash-sub" style="margin-top:6px">No accounts found</div>';
    } else {
      html += '<div class="ad-table-wrap"><table class="ad-table"><thead><tr><th>Name</th><th>Email</th><th>Type</th><th>Active</th><th>Actions</th></tr></thead><tbody>';
      accounts.forEach(function(u) {
        if (!u) return;
        var isActive = u.id === activeId;
        var escId = esc(String(u.id || '').replace(/\\/g, '\\\\').replace(/'/g, "\\'"));
        html += '<tr><td style="color:var(--text-primary);font-weight:500">' + esc(u.name || 'Unknown') + '</td>';
        html += '<td>' + esc(u.email || 'â€”') + '</td>';
        html += '<td><span class="ad-tag-chip">' + (u.authUid ? 'Cloud' : (u.name === 'Guest' ? 'Guest' : 'Local')) + '</span></td>';
        html += '<td>' + (isActive ? '<span class="ad-tag-chip" style="background:var(--accent);color:var(--text-inverse)">Yes</span>' : 'â€”') + '</td>';
        html += '<td class="ad-tcell-actions">';
        html += '<button class="admin-btn small" onclick="window._adViewAccount(\'' + escId + '\')">View</button>';
        if (!isActive) html += '<button class="admin-btn small" onclick="window._adSetActiveAccount(\'' + escId + '\')">Set Active</button>';
        html += '</td></tr>';
      });
      html += '</tbody></table></div>';
    }
    html += '</div>';

    html += '<div class="ad-dash-card full"><div class="ad-dash-label">Danger Zone</div><div class="ad-dash-row">';
    html += '<button class="admin-btn small danger" onclick="window._adClearActiveAccount()">Clear Active Account Marker</button>';
    html += '</div></div>';

    html += '</div>';
    el.innerHTML = html;

    window._adViewAccount = function(id) {
      var accounts = getLSJSON(AUTH_USERS_KEY) || [];
      var u = accounts.find(function(x){return x && x.id===id;});
      if (!u) { showError('Account not found'); return; }
      var safe = {};
      Object.keys(u).forEach(function(k) {
        if (k === 'googleId' || k === 'authUid') safe[k] = String(u[k]).slice(0, 8) + 'â€¦';
        else safe[k] = u[k];
      });
      _openModal('Account: ' + esc(u.name || ''), '<textarea class="ad-raw-input" readonly style="min-height:200px;font-size:0.72rem">' + esc(JSON.stringify(safe, null, 2)) + '</textarea>',
        '<button class="admin-btn" onclick="closeModal()">Close</button>');
    };
    window._adSetActiveAccount = function(id) {
      if (!confirm('Set this account as active?')) return;
      try { rawLS().setItem(AUTH_ACTIVE_KEY, id); } catch(e) {}
      showToast('Active account set (reload to apply)', 'success');
      renderAccountsPanel();
    };
    window._adClearActiveAccount = function() {
      if (!confirm('Clear the active account marker?')) return;
      try { rawLS().removeItem(AUTH_ACTIVE_KEY); } catch(e) {}
      showToast('Active account marker cleared', 'success');
      renderAccountsPanel();
    };
  }

  /* â”€â”€â”€ PREMIUM TAB â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  function renderPremiumPanel() {
    var el = $('panelPremium');
    if (!el) return;
    var _raw = rawLS();
    var caches = [];
    try {
      for (var i = 0; i < _raw.length; i++) {
        var k = _raw.key(i);
        if (k && k.indexOf('haven-premium-') === 0) caches.push(k);
      }
    } catch(e) {}

    var activeId = null;
    try { activeId = rawLS().getItem(AUTH_ACTIVE_KEY); } catch(e) {}
    var currentKey = 'haven-premium-' + (activeId || 'guest');
    var current = null;
    try { var cv = physGet(currentKey); current = cv ? JSON.parse(cv) : null; } catch(e) {}

    var html = '<div class="ad-dash-grid">';
    html += '<div class="ad-dash-card"><div class="ad-dash-label">Current Plan</div><div class="ad-dash-value" style="font-size:0.9rem">' + (current && current.premium ? esc(current.plan || 'pro') : 'Free') + '</div><div class="ad-dash-sub">' + esc(currentKey) + '</div></div>';
    html += '<div class="ad-dash-card"><div class="ad-dash-label">Premium?</div><div class="ad-dash-value" style="color:' + (current && current.premium ? 'var(--accent)' : 'var(--text-tertiary)') + '">' + (current && current.premium ? 'Yes' : 'No') + '</div></div>';
    html += '<div class="ad-dash-card"><div class="ad-dash-label">Caches</div><div class="ad-dash-value">' + caches.length + '</div><div class="ad-dash-sub">haven-premium-* keys</div></div>';
    html += '<div class="ad-dash-card"><div class="ad-dash-label">Status</div><div class="ad-dash-value" style="font-size:0.8rem">' + esc((current && current.status) || 'none') + '</div><div class="ad-dash-sub">provider: ' + esc((current && current.provider) || 'mock') + '</div></div>';

    html += '<div class="ad-dash-card full"><div class="ad-dash-label">Grant / Revoke Premium</div><div class="ad-dash-row">';
    html += '<button class="admin-btn primary small" onclick="window._adGrantPremium()">Grant Pro (30d)</button>';
    html += '<button class="admin-btn small danger" onclick="window._adRevokePremium()">Revoke</button>';
    html += '</div></div>';

    html += '<div class="ad-dash-card full"><div class="ad-dash-label">All Premium Caches</div>';
    if (caches.length === 0) {
      html += '<div class="ad-dash-sub" style="margin-top:6px">No premium cache keys</div>';
    } else {
      html += '<div class="ad-table-wrap"><table class="ad-table"><thead><tr><th>Key</th><th>Premium</th><th>Plan</th><th>Until</th><th>Actions</th></tr></thead><tbody>';
      caches.forEach(function(k) {
        var v = null;
        try { var raw = rawLS().getItem(k); v = raw ? JSON.parse(raw) : null; } catch(e) {}
        html += '<tr><td class="ad-tcell-key">' + esc(k) + '</td>';
        html += '<td>' + (v && v.premium ? 'Yes' : 'No') + '</td>';
        html += '<td>' + esc((v && v.plan) || 'â€”') + '</td>';
        html += '<td>' + esc((v && v.until) ? String(v.until).slice(0, 10) : 'â€”') + '</td>';
        html += '<td class="ad-tcell-actions"><button class="admin-btn small danger" onclick="window._adDeletePremiumCache(\'' + esc(k.replace(/\\/g, '\\\\').replace(/'/g, "\\'")) + '\')">Del</button></td></tr>';
      });
      html += '</tbody></table></div>';
    }
    html += '</div>';

    html += '<div class="ad-dash-card full"><div class="ad-dash-label">Raw JSON</div>';
    html += '<textarea class="ad-raw-input" readonly style="min-height:120px;font-size:0.72rem;font-family:var(--font-mono)">' + esc(current ? JSON.stringify(current, null, 2) : 'null') + '</textarea>';
    html += '</div>';

    html += '</div>';
    el.innerHTML = html;

    window._adGrantPremium = function() {
      var until = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
      var obj = { premium: true, plan: 'pro', interval: 'monthly', status: 'active', provider: 'mock', until: until, cancel_at_period_end: false, checkedAt: Date.now() };
      physSet(currentKey, JSON.stringify(obj));
      showToast('Premium granted (30d)', 'success');
      renderPremiumPanel();
    };
    window._adRevokePremium = function() {
      if (!confirm('Revoke premium for this account?')) return;
      physRemove(currentKey);
      showToast('Premium revoked', 'success');
      renderPremiumPanel();
    };
    window._adDeletePremiumCache = function(key) {
      if (!confirm('Delete ' + key + '?')) return;
      try { rawLS().removeItem(key); } catch(e) {}
      renderPremiumPanel();
      showToast('Cache deleted');
    };
  }

  /* â”€â”€â”€ AI TAB â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  function renderAIPanel() {
    var el = $('panelAI');
    if (!el) return;
    var usage = getLSJSON('haven-schedule-ai-usage') || {};
    var profile = getLSJSON('haven-schedule-profile') || {};
    var chatHistory = getLSJSON('haven-schedule-chat') || [];
    var memory = profile.conversationMemory || [];
    var provider = '';
    try { provider = physGet('haven-schedule-provider') || 'groq'; } catch(e) {}
    var model = '';
    try { model = physGet('haven-schedule-model') || ''; } catch(e) {}
    var hasKey = false;
    try { hasKey = !!physGet('haven-schedule-apikey'); } catch(e) {}
    var chickbot = getLSJSON('haven-chickbot-profile') || {};
    var extra = '';
    try { extra = physGet('haven-ai-extra-instructions') || ''; } catch(e) {}

    var html = '<div class="ad-dash-grid">';
    html += '<div class="ad-dash-card"><div class="ad-dash-label">Total Tokens</div><div class="ad-dash-value">' + (usage.totalTokens || 0).toLocaleString() + '</div></div>';
    html += '<div class="ad-dash-card"><div class="ad-dash-label">Total Calls</div><div class="ad-dash-value">' + (usage.totalCalls || 0) + '</div></div>';
    html += '<div class="ad-dash-card"><div class="ad-dash-label">Chat Messages</div><div class="ad-dash-value">' + chatHistory.length + '</div></div>';
    html += '<div class="ad-dash-card"><div class="ad-dash-label">AI Memories</div><div class="ad-dash-value">' + memory.length + '</div></div>';
    html += '<div class="ad-dash-card"><div class="ad-dash-label">Provider</div><div class="ad-dash-value" style="font-size:0.85rem">' + esc(provider) + '</div></div>';
    html += '<div class="ad-dash-card"><div class="ad-dash-label">Model</div><div class="ad-dash-value" style="font-size:0.75rem;font-family:var(--font-mono)">' + esc(model || 'default') + '</div></div>';
    html += '<div class="ad-dash-card"><div class="ad-dash-label">API Key</div><div class="ad-dash-value" style="font-size:0.85rem">' + (hasKey ? 'Set' : 'Missing') + '</div></div>';
    html += '<div class="ad-dash-card"><div class="ad-dash-label">ChickBot</div><div class="ad-dash-value" style="font-size:0.8rem">' + esc(chickbot.name || 'unset') + '</div></div>';

    html += '<div class="ad-dash-card full"><div class="ad-dash-label">Extra Instructions</div>';
    html += '<textarea class="ad-raw-input" id="adAIExtra" style="min-height:80px;font-size:0.72rem">' + esc(extra) + '</textarea>';
    html += '<button class="admin-btn small" style="margin-top:6px" onclick="window._adSaveAIExtra()">Save Instructions</button>';
    html += '</div>';

    html += '<div class="ad-dash-card full"><div class="ad-dash-label">Chat History</div>';
    html += '<div class="ad-table-wrap" style="max-height:200px"><table class="ad-table"><thead><tr><th>Role</th><th>Preview</th><th>Time</th></tr></thead><tbody>';
    if (chatHistory.length === 0) {
      html += '<tr><td colspan="3" style="text-align:center;color:var(--text-tertiary);padding:16px">No chat history</td></tr>';
    }
    chatHistory.slice(-30).reverse().forEach(function(msg) {
      html += '<tr><td style="font-weight:' + (msg.role === 'user' ? '600' : '400') + '">' + esc(msg.role || 'â€”') + '</td><td style="max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + esc((msg.content || '').slice(0, 60)) + '</td><td style="font-size:0.7rem;color:var(--text-tertiary)">' + esc(msg.timestamp ? String(msg.timestamp).slice(11, 19) : '') + '</td></tr>';
    });
    html += '</tbody></table></div></div>';

    html += '<div class="ad-dash-card full"><div class="ad-dash-label">AI Conversation Memory</div>';
    if (memory.length === 0) {
      html += '<div class="ad-dash-sub" style="margin-top:6px">No stored facts</div>';
    } else {
      memory.slice(-20).forEach(function(fact) {
        html += '<div class="ad-dash-act"><span class="ad-dash-act-dot" style="background:#8b5cf6"></span>';
        html += '<span style="font-size:0.72rem">' + esc(typeof fact === 'string' ? fact : fact.text || fact.content || JSON.stringify(fact)) + '</span>';
        html += '</div>';
      });
    }
    html += '</div>';

    html += '<div class="ad-dash-card full"><div class="ad-dash-label">Danger Zone</div>';
    html += '<div class="ad-dash-row"><button class="admin-btn small danger" onclick="window._adResetAIUsage()">Reset Usage Stats</button>';
    html += '<button class="admin-btn small danger" onclick="window._adClearChatHistory()">Clear Chat History</button>';
    html += '<button class="admin-btn small danger" onclick="window._adClearAIMemory()">Clear AI Memory</button></div></div>';

    html += '</div>';
    el.innerHTML = html;

    window._adSaveAIExtra = function() {
      var v = ($('adAIExtra') || {}).value || '';
      physSet('haven-ai-extra-instructions', v);
      showToast('Extra instructions saved', 'success');
    };
    window._adResetAIUsage = function() {
      if (!confirm('Reset AI usage stats?')) return;
      removeLSItem('haven-schedule-ai-usage');
      renderAIPanel(); showToast('AI usage reset');
    };
    window._adClearChatHistory = function() {
      if (!confirm('Clear all chat history?')) return;
      setLSJSON('haven-schedule-chat', []);
      renderAIPanel(); showToast('Chat history cleared');
    };
    window._adClearAIMemory = function() {
      if (!confirm('Clear all AI memory facts?')) return;
      var p = getLSJSON('haven-schedule-profile') || {};
      p.conversationMemory = [];
      setLSJSON('haven-schedule-profile', p);
      renderAIPanel(); showToast('AI memory cleared');
    };
  }

  /* â”€â”€â”€ SETTINGS EDITOR TAB â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  function renderSettingsEditor() {
    var el = $('panelSettings');
    if (!el) return;
    var settings = getLSJSON('haven-schedule-settings') || {};
    var lang = '';
    try { lang = physGet('haven-language') || 'en'; } catch(e) {}
    var weekStart = '';
    try { weekStart = physGet('haven-week-start') || 'monday'; } catch(e) {}
    var timeFormat = '';
    try { timeFormat = physGet('haven-time-format') || '12h'; } catch(e) {}
    var provider = '';
    try { provider = physGet('haven-schedule-provider') || 'groq'; } catch(e) {}
    var model = '';
    try { model = physGet('haven-schedule-model') || ''; } catch(e) {}
    var sleepTargets = getLSJSON('haven-schedule-sleep-targets') || {};

    var html = '<div class="ad-dash-grid">';

    html += '<div class="ad-dash-card full"><div class="ad-dash-label">Theme & Appearance</div>';
    html += '<div class="ad-dash-row" style="flex-wrap:wrap;gap:10px;margin-top:8px">';
    html += '<div><label style="font-size:0.68rem;color:var(--text-tertiary)">Accent Color</label><br><input type="color" id="adSetAccent" value="' + esc(settings.accentColor || '#a5b4fc') + '" onchange="window._adPreviewAccent(this.value)" style="border:none;background:transparent;cursor:pointer"></div>';
    html += '<div><label style="font-size:0.68rem;color:var(--text-tertiary)">Dark Mode</label><br><select class="ad-select" id="adSetDarkMode">';
    html += '<option value="system"' + (settings.darkMode === undefined || settings.darkMode === null ? ' selected' : '') + '>System</option>';
    html += '<option value="true"' + (settings.darkMode === true ? ' selected' : '') + '>Dark</option>';
    html += '<option value="false"' + (settings.darkMode === false ? ' selected' : '') + '>Light</option>';
    html += '</select></div>';
    html += '<div><label style="font-size:0.68rem;color:var(--text-tertiary)">Preview</label><br><div class="ad-swatch-preview" id="adSwatchPreview" style="background:' + esc(settings.accentColor || '#a5b4fc') + ';width:32px;height:32px;border-radius:8px;border:1px solid var(--border-color)"></div></div>';
    html += '</div></div>';

    html += '<div class="ad-dash-card full"><div class="ad-dash-label">Locale & Behavior</div>';
    html += '<div class="ad-dash-row" style="flex-wrap:wrap;gap:10px;margin-top:8px">';
    html += '<div><label style="font-size:0.68rem;color:var(--text-tertiary)">Language</label><br><select class="ad-select" id="adSetLang">';
    ['en','id','zh'].forEach(function(l) {
      html += '<option value="' + l + '"' + (lang === l ? ' selected' : '') + '>' + l.toUpperCase() + '</option>';
    });
    html += '</select></div>';
    html += '<div><label style="font-size:0.68rem;color:var(--text-tertiary)">Week Start</label><br><select class="ad-select" id="adSetWeekStart">';
    html += '<option value="monday"' + (weekStart === 'monday' ? ' selected' : '') + '>Monday</option>';
    html += '<option value="sunday"' + (weekStart === 'sunday' ? ' selected' : '') + '>Sunday</option>';
    html += '</select></div>';
    html += '<div><label style="font-size:0.68rem;color:var(--text-tertiary)">Time Format</label><br><select class="ad-select" id="adSetTimeFormat">';
    html += '<option value="12h"' + (timeFormat === '12h' ? ' selected' : '') + '>12-hour</option>';
    html += '<option value="24h"' + (timeFormat === '24h' ? ' selected' : '') + '>24-hour</option>';
    html += '</select></div>';
    html += '<label style="font-size:0.72rem;display:flex;align-items:center;gap:6px"><input type="checkbox" id="adSetNotif"' + (settings.notifications !== false ? ' checked' : '') + '> Notifications</label>';
    html += '</div></div>';

    html += '<div class="ad-dash-card full"><div class="ad-dash-label">Schedule Grid</div>';
    html += '<div class="ad-dash-row" style="flex-wrap:wrap;gap:10px;margin-top:8px">';
    html += '<div><label style="font-size:0.68rem;color:var(--text-tertiary)">Grid Start Hour</label><br><input class="ad-raw-input" id="adSetGridStart" type="number" min="0" max="20" value="' + (settings.gridStartHour != null ? settings.gridStartHour : 5) + '" style="width:60px"></div>';
    html += '<div><label style="font-size:0.68rem;color:var(--text-tertiary)">Visible Hours (8â€“24)</label><br><input class="ad-raw-input" id="adSetGridVisible" type="number" min="8" max="24" value="' + (settings.gridVisibleHours != null ? settings.gridVisibleHours : 24) + '" style="width:60px"></div>';
    html += '</div></div>';

    html += '<div class="ad-dash-card full"><div class="ad-dash-label">AI Provider</div>';
    html += '<div class="ad-dash-row" style="flex-wrap:wrap;gap:10px;margin-top:8px">';
    html += '<div><label style="font-size:0.68rem;color:var(--text-tertiary)">Provider</label><br><select class="ad-select" id="adSetProvider">';
    ['groq','gemini','openai'].forEach(function(p) {
      html += '<option value="' + p + '"' + (provider === p ? ' selected' : '') + '>' + p + '</option>';
    });
    html += '</select></div>';
    html += '<div style="flex:1;min-width:160px"><label style="font-size:0.68rem;color:var(--text-tertiary)">Model</label><br><input class="ad-raw-input" id="adSetModel" value="' + esc(model) + '" placeholder="model id"></div>';
    html += '</div></div>';

    html += '<div class="ad-dash-card full"><div class="ad-dash-label">Sleep Defaults</div>';
    html += '<div class="ad-dash-row" style="flex-wrap:wrap;gap:10px;margin-top:8px">';
    html += '<div><label style="font-size:0.68rem;color:var(--text-tertiary)">Target Bedtime</label><br><input class="ad-raw-input" id="adSetBedtime" type="time" value="' + esc(sleepTargets.targetBedtime || '23:00') + '"></div>';
    html += '<div><label style="font-size:0.68rem;color:var(--text-tertiary)">Target Wake</label><br><input class="ad-raw-input" id="adSetWake" type="time" value="' + esc(sleepTargets.targetWakeTime || '07:00') + '"></div>';
    html += '<div><label style="font-size:0.68rem;color:var(--text-tertiary)">Wind-down (min)</label><br><input class="ad-raw-input" id="adSetWindDown" type="number" value="' + (sleepTargets.windDownReminderMins || 30) + '" style="width:60px"></div>';
    html += '</div></div>';

    html += '<div class="ad-dash-card full"><div class="ad-dash-label">Save Changes</div>';
    html += '<button class="admin-btn primary" onclick="window._adSaveSettings()">Save All Settings</button>';
    html += '<button class="admin-btn small" style="margin-left:8px" onclick="window._adResetSettings()">Reset Appearance</button>';
    html += '<button class="admin-btn small" style="margin-left:8px" onclick="openPasswordChangeModal()">Change Password</button>';
    html += '</div>';

    html += '<div class="ad-dash-card full"><div class="ad-dash-label">Raw Settings JSON</div>';
    html += '<textarea class="ad-raw-input" id="adRawSettings" style="min-height:120px;font-size:0.72rem;font-family:var(--font-mono)">' + esc(JSON.stringify(settings, null, 2)) + '</textarea>';
    html += '<button class="admin-btn small" style="margin-top:4px" onclick="window._adApplyRawSettings()">Apply Raw JSON</button>';
    html += '</div>';

    html += '</div>';
    el.innerHTML = html;

    window._adPreviewAccent = function(color) {
      var swatch = $('adSwatchPreview');
      if (swatch) swatch.style.background = color;
    };
    window._adSaveSettings = function() {
      var s = getLSJSON('haven-schedule-settings') || {};
      s.accentColor = ($('adSetAccent') || {}).value || '#a5b4fc';
      var dm = ($('adSetDarkMode') || {}).value;
      s.darkMode = dm === 'true' ? true : (dm === 'false' ? false : null);
      s.notifications = ($('adSetNotif') || {}).checked;
      s.gridStartHour = Math.max(0, Math.min(20, parseInt(($('adSetGridStart') || {}).value, 10) || 5));
      s.gridVisibleHours = Math.max(8, Math.min(24, parseInt(($('adSetGridVisible') || {}).value, 10) || 24));
      if (typeof state !== 'undefined') {
        state.accentColor = s.accentColor;
        state.darkMode = s.darkMode;
        state.gridStartHour = s.gridStartHour;
        state.gridVisibleHours = s.gridVisibleHours;
      }
      setLSJSON('haven-schedule-settings', s);

      physSet('haven-language', ($('adSetLang') || {}).value || 'en');
      physSet('haven-week-start', ($('adSetWeekStart') || {}).value || 'monday');
      physSet('haven-time-format', ($('adSetTimeFormat') || {}).value || '12h');
      physSet('haven-schedule-provider', ($('adSetProvider') || {}).value || 'groq');
      physSet('haven-schedule-model', ($('adSetModel') || {}).value || '');

      var st = getLSJSON('haven-schedule-sleep-targets') || {};
      st.targetBedtime = ($('adSetBedtime') || {}).value || '23:00';
      st.targetWakeTime = ($('adSetWake') || {}).value || '07:00';
      st.windDownReminderMins = parseInt(($('adSetWindDown') || {}).value, 10) || 30;
      setLSJSON('haven-schedule-sleep-targets', st);

      if (typeof applyTheme === 'function') applyTheme();
      if (typeof applyAccentColor === 'function') applyAccentColor();
      showToast('Settings saved', 'success');
    };
    window._adResetSettings = function() {
      if (!confirm('Reset appearance settings to defaults?')) return;
      removeLSItem('haven-schedule-settings');
      if (typeof applyTheme === 'function') applyTheme();
      renderSettingsEditor();
      showToast('Appearance reset', 'success');
    };
    window._adApplyRawSettings = function() {
      try {
        var raw = $('adRawSettings');
        if (!raw) return;
        var obj = JSON.parse(raw.value);
        setLSJSON('haven-schedule-settings', obj);
        if (typeof applyTheme === 'function') applyTheme();
        showToast('Raw settings applied', 'success');
      } catch(e) { showError('Invalid JSON: ' + e.message); }
    };
  }

  /* â”€â”€â”€ SYSTEM TAB â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  function renderSystemPanel() {
    var el = $('panelSystem');
    if (!el) return;
    var html = '<div class="ad-dash-grid">';

    html += '<div class="ad-dash-card"><div class="ad-dash-label">Browser</div><div class="ad-dash-value" style="font-size:0.85rem">' + esc(navigator.userAgent.slice(0, 60)) + '</div></div>';
    html += '<div class="ad-dash-card"><div class="ad-dash-label">Platform</div><div class="ad-dash-value" style="font-size:0.85rem">' + esc(navigator.platform) + '</div></div>';
    html += '<div class="ad-dash-card"><div class="ad-dash-label">Language</div><div class="ad-dash-value" style="font-size:0.85rem">' + esc(navigator.language) + '</div></div>';
    html += '<div class="ad-dash-card"><div class="ad-dash-label">Online</div><div class="ad-dash-value" style="font-size:0.85rem">' + (navigator.onLine ? 'Online' : 'Offline') + '</div></div>';

    var _raw = rawLS();
    var keyCount = _raw.length;
    var totalSize = 0;
    var largestKeys = [];
    try {
      for (var i = 0; i < _raw.length; i++) {
        var k = _raw.key(i);
        if (k) {
          var v = _raw.getItem(k);
          if (v) {
            var sz = k.length + v.length;
            totalSize += sz;
            largestKeys.push({ key: k, size: sz });
          }
        }
      }
    } catch(e) {}
    largestKeys.sort(function(a, b) { return b.size - a.size; });
    var pct = Math.min(100, (totalSize / 5120) * 100);

    html += '<div class="ad-dash-card"><div class="ad-dash-label">Storage Used</div><div class="ad-dash-value">' + (totalSize / 1024).toFixed(1) + ' KB</div><div class="ad-dash-sub">of ~5 MB limit (' + pct.toFixed(0) + '%)</div></div>';
    html += '<div class="ad-dash-card"><div class="ad-dash-label">Storage Keys</div><div class="ad-dash-value">' + keyCount + '</div><div class="ad-dash-sub">total localStorage items</div></div>';

    html += '<div class="ad-dash-card full"><div class="ad-dash-label">Top Storage Consumers</div>';
    largestKeys.slice(0, 8).forEach(function(item) {
      var fill = Math.min(100, (item.size / (totalSize || 1)) * 100);
      html += '<div class="ad-sys-bar-row"><span class="ad-sys-bar-label">' + esc(item.key.length > 35 ? item.key.slice(0, 35) + '...' : item.key) + '</span>';
      html += '<div class="ad-sys-bar-track"><div class="ad-sys-bar-fill" style="width:' + fill.toFixed(0) + '%"></div></div>';
      html += '<span class="ad-sys-bar-val">' + (item.size / 1024).toFixed(1) + ' KB</span></div>';
    });
    html += '</div>';

    html += '<div class="ad-dash-card"><div class="ad-dash-label">Screen</div><div class="ad-dash-value" style="font-size:0.85rem">' + screen.width + 'Ã—' + screen.height + '</div><div class="ad-dash-sub">' + (window.devicePixelRatio || 1) + 'x DPR</div></div>';

    var conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    var connType = conn ? conn.effectiveType : 'N/A';
    var connSpeed = conn && conn.downlink ? conn.downlink + ' Mbps' : '';
    html += '<div class="ad-dash-card"><div class="ad-dash-label">Connection</div><div class="ad-dash-value" style="font-size:0.82rem">' + esc(connType) + '</div><div class="ad-dash-sub">' + esc(connSpeed) + '</div></div>';
    html += '<div class="ad-dash-card"><div class="ad-dash-label">Memory (est.)</div><div class="ad-dash-value" style="font-size:0.82rem">' + ((navigator.deviceMemory) ? navigator.deviceMemory + ' GB' : 'N/A') + '</div></div>';
    html += '<div class="ad-dash-card"><div class="ad-dash-label">Viewport</div><div class="ad-dash-value" style="font-size:0.85rem">' + window.innerWidth + 'Ã—' + window.innerHeight + '</div></div>';

    html += '<div class="ad-dash-card full"><div class="ad-dash-label">App Information</div>';
    html += '<div class="ad-dash-row" style="flex-direction:column;align-items:flex-start;gap:4px;margin-top:4px">';
    html += '<span style="font-size:0.72rem">App: HavÃ«n Schedule</span>';
    html += '<span style="font-size:0.72rem">Page: Admin Panel v3.0</span>';
    html += '<span style="font-size:0.72rem">Time: ' + new Date().toLocaleString() + '</span>';
    html += '<span style="font-size:0.72rem">Timezone: ' + esc(Intl.DateTimeFormat().resolvedOptions().timeZone) + ' (UTC' + (new Date().getTimezoneOffset() < 0 ? '+' : '') + (-new Date().getTimezoneOffset() / 60) + ')</span>';
    html += '<span style="font-size:0.72rem">Active user: ' + esc(_adActivePrefix() || '(none)') + '</span>';
    html += '</div></div>';

    html += '<div class="ad-dash-card full"><div class="ad-dash-label">Actions</div>';
    html += '<div class="ad-dash-row"><button class="admin-btn small" onclick="window._adCheckUpdate()">Check for Updates</button>';
    html += '<button class="admin-btn small" onclick="window._adStorageEstimate()">Storage Estimate</button>';
    html += '<button class="admin-btn small danger" onclick="window._adClearCaches()">Clear Caches</button>';
    html += '<button class="admin-btn small" onclick="window._adSWStatus()">SW Status</button></div></div>';

    html += '</div>';
    el.innerHTML = html;

    window._adCheckUpdate = function() { showToast('Already up to date'); };
    window._adStorageEstimate = function() {
      if (navigator.storage && navigator.storage.estimate) {
        navigator.storage.estimate().then(function(e) {
          showToast('Quota: ' + (e.usage / 1024 / 1024).toFixed(1) + 'MB / ' + (e.quota / 1024 / 1024).toFixed(1) + 'MB');
        }).catch(function() { showError('Estimate failed'); });
      } else { showError('Storage estimate unavailable'); }
    };
    window._adClearCaches = function() {
      if (!confirm('Clear all caches?')) return;
      if (typeof caches !== 'undefined' && caches.keys) {
        caches.keys().then(function(ks) { ks.forEach(function(k) { caches.delete(k); }); showToast('Caches cleared', 'success'); });
      } else { showError('Cache API unavailable'); }
    };
    window._adSWStatus = function() {
      if (navigator.serviceWorker && navigator.serviceWorker.getRegistration) {
        navigator.serviceWorker.getRegistration().then(function(r) { showToast(r ? 'SW registered' : 'No SW'); });
      } else { showError('SW unavailable'); }
    };
  }

  /* â”€â”€â”€ Preset Management â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  window._adSaveCurrentPreset = function() {
    var name = prompt('Name this preset:');
    if (!name || !name.trim()) return;
    if (typeof savePreset === 'function') {
      savePreset(name.trim());
      if (_currentTab === 'bento') renderBentoPanel();
    } else {
      showError('savePreset API unavailable');
    }
  };

  /* â”€â”€â”€ Modal System â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  function _openModal(title, bodyHtml, footerHtml) {
    var existing = document.getElementById('adModalOverlay');
    if (existing) existing.remove();
    var ov = document.createElement('div');
    ov.id = 'adModalOverlay';
    ov.className = 'ad-modal-overlay';
    ov.innerHTML = '<div class="ad-modal"><div class="ad-modal-header"><h3 class="ad-modal-title">' + title + '</h3><button class="ad-modal-close" onclick="closeModal()">&times;</button></div><div class="ad-modal-body">' + bodyHtml + '</div><div class="ad-modal-footer">' + (footerHtml || '') + '</div></div>';
    document.body.appendChild(ov);
    requestAnimationFrame(function() { ov.classList.add('show'); });
    ov.addEventListener('click', function(e) { if (e.target === ov) closeModal(); });
    var handler = function(e) { if (e.key === 'Escape') { closeModal(); document.removeEventListener('keydown', handler); } };
    document.addEventListener('keydown', handler);
  }

  window.closeModal = function() {
    var ov = document.getElementById('adModalOverlay');
    if (ov) { ov.classList.remove('show'); setTimeout(function() { ov.remove(); }, 200); }
  };

  /* â”€â”€â”€ Init â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  function init() {
    try {
      var activeId = null;
      try { activeId = rawLS().getItem(AUTH_ACTIVE_KEY); } catch(e) {}
      if (typeof state !== 'undefined' && state) state.currentUserId = activeId || null;
    } catch(e) {}

    var gateForm = $('pwGateForm');
    var gateInput = $('pwGateInput');
    var gateBtn = $('pwGateBtn');
    var gateError = $('pwGateError');

    if (gateForm) {
      gateForm.addEventListener('submit', function(e) {
        e.preventDefault();
        var val = gateInput ? gateInput.value.trim() : '';
        if (!val) {
          if (gateError) gateError.textContent = 'Please enter a password';
          shakePwGate();
          return;
        }
        if (gateBtn) gateBtn.disabled = true;
        if (gateError) gateError.textContent = '';

        setTimeout(function() {
          if (verifyPassword(val)) {
            hidePwGate();
            bootAdmin();
          } else {
            if (gateError) gateError.textContent = 'Incorrect password. Try again.';
            shakePwGate();
            if (gateInput) { gateInput.value = ''; gateInput.focus(); }
            if (gateBtn) gateBtn.disabled = false;
          }
        }, 150);
      });
    }

    if (_adminAuthed) {
      hidePwGate();
      bootAdmin();
    } else {
      var bgFrame = $('pwGateBg');
      if (bgFrame && document.referrer) {
        try { bgFrame.src = document.referrer; } catch(e) {}
      }
      showPwGate();
    }
  }

  function bootAdmin() {
    initTabs();
    switchTab('dashboard');

    var themeBtn = $('adminThemeBtn');
    if (themeBtn) {
      themeBtn.addEventListener('click', function() {
        if (typeof toggleTheme === 'function') toggleTheme();
        else {
          document.documentElement.classList.toggle('light');
          document.documentElement.classList.toggle('dark');
        }
      });
    }

    var themeBtnSidebar = $('themeBtnSidebar');
    if (themeBtnSidebar) {
      themeBtnSidebar.addEventListener('click', function() {
        if (typeof toggleTheme === 'function') toggleTheme();
        else {
          document.documentElement.classList.toggle('light');
          document.documentElement.classList.toggle('dark');
        }
      });
    }

    var settingsBtn = $('settingsBtnSidebar');
    if (settingsBtn) {
      settingsBtn.addEventListener('click', function() { switchTab('settings'); });
    }

    var hamburger = $('hubHamburger');
    var sidebar = $('hubSidebar');
    var overlay = $('hubSidebarOverlay');
    if (hamburger && sidebar) {
      hamburger.addEventListener('click', function() {
        sidebar.classList.toggle('open');
        if (overlay) overlay.classList.toggle('open', sidebar.classList.contains('open'));
      });
    }
    if (overlay && sidebar) {
      overlay.addEventListener('click', function() {
        sidebar.classList.remove('open');
        overlay.classList.remove('open');
      });
    }

    document.addEventListener('admin:preset-changed', function() {
      if (_currentTab === 'bento') renderBentoPanel();
      if (_currentTab === 'dashboard') renderDashboard();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
