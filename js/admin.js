/* ============================================
   Havën Schedule — Admin Panel Logic
   v2.0 — Full-featured admin experience
   ============================================ */
(function() {
  'use strict';

  /* ─── Constants ─────────────────────────────────────── */
  var ADMIN_PASS_KEY = 'haven-admin-password';
  var ADMIN_PASS_DEFAULT = 'MjcwODEw';
  var ADMIN_PRESETS_KEY = 'haven-admin-presets';
  var ACTIVE_PRESET_KEY = 'haven-active-preset';
  var HUB_CONTENT_KEY = 'haven-hub-content';

  /* ─── State ──────────────────────────────────────────── */
  var _currentTab = 'dashboard';
  var _adminAuthed = sessionStorage.getItem('haven-admin-authed') === 'true';
  var _dashVisible = true;
  var toastTimeout = null;

  /* ─── Helpers ────────────────────────────────────────── */
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

  function getLSItem(key) {
    try { return localStorage.getItem(key); } catch(e) { return null; }
  }

  function setLSItem(key, val) {
    try { localStorage.setItem(key, val); return true; } catch(e) { return false; }
  }

  function removeLSItem(key) {
    try { localStorage.removeItem(key); return true; } catch(e) { return false; }
  }

  function getLSJSON(key) {
    try {
      var v = localStorage.getItem(key);
      return v ? JSON.parse(v) : null;
    } catch(e) { return null; }
  }

  function setLSJSON(key, obj) {
    try { localStorage.setItem(key, JSON.stringify(obj)); return true; } catch(e) { return false; }
  }

  function _safeBtoa(s) {
    try { return btoa(unescape(encodeURIComponent(s))); } catch(e) { return btoa(s); }
  }

  function requireAuth() {
    var storedPass;
    try { storedPass = localStorage.getItem(ADMIN_PASS_KEY) || ADMIN_PASS_DEFAULT; } catch(e) { storedPass = ADMIN_PASS_DEFAULT; }
    if (_adminAuthed) return true;
    var entered = prompt('Enter admin password:');
    if (!entered) return false;
    try {
      if (_safeBtoa(entered) === storedPass) {
        _adminAuthed = true;
        try { sessionStorage.setItem('haven-admin-authed', 'true'); } catch(e) {}
        return true;
      }
    } catch(e) {}
    showError('Incorrect password');
    return false;
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
    try { storedPass = localStorage.getItem(ADMIN_PASS_KEY) || ADMIN_PASS_DEFAULT; } catch(e) { storedPass = ADMIN_PASS_DEFAULT; }
    if (_safeBtoa(cur.value) !== storedPass) { showError('Current password is incorrect'); return; }
    if (!nw.value || nw.value.length < 3) { showError('New password must be at least 3 characters'); return; }
    if (nw.value !== confirm.value) { showError('Passwords do not match'); return; }
    setLSItem(ADMIN_PASS_KEY, _safeBtoa(nw.value));
    showToast('Password changed successfully', 'success');
    closeModal();
  };

  /* ─── Tab System ────────────────────────────────────── */
  var TAB_DEFS = [
    { id: 'dashboard', label: 'Dashboard', icon: '<rect x="3" y="3" width="7" height="9"/><rect x="14" y="3" width="7" height="5"/><rect x="14" y="12" width="7" height="9"/><rect x="3" y="16" width="7" height="5"/>' },
    { id: 'storage', label: 'Storage', icon: '<path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 002 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/><line x1="17" y1="13" x2="7" y2="13"/>' },
    { id: 'tasks', label: 'Tasks', icon: '<path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>' },
    { id: 'data', label: 'Data', icon: '<path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>' },
    { id: 'sleep', label: 'Sleep', icon: '<path d="M17 17h.01"/><path d="M21 12h.01"/><path d="M7 17h.01"/><path d="M12 21h.01"/><circle cx="12" cy="12" r="9"/><circle cx="12" cy="7.5" r="1.5"/>' },
    { id: 'finance', label: 'Finance', icon: '<line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>' },
    { id: 'activity', label: 'Activity', icon: '<polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>' },
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
    _currentTab = id;
    // Update tab bar
    $('adminTabBar').querySelectorAll('.admin-tab').forEach(function(b) {
      b.classList.toggle('active', b.dataset.tab === id);
    });
    // Show/hide content panels
    $('adminContent').querySelectorAll('.admin-content-panel').forEach(function(p) {
      p.classList.toggle('hidden', p.dataset.panel !== id);
    });
    // Render current panel
    renderPanel(id);
  }

  function renderPanel(id) {
    switch(id) {
      case 'dashboard': renderDashboard(); break;
      case 'storage': renderStorageExplorer(); break;
      case 'tasks': renderTaskManager(); break;
      case 'data': renderDataManager(); break;
      case 'sleep': renderSleepPanel(); break;
      case 'finance': renderFinancePanel(); break;
      case 'activity': renderActivityPanel(); break;
      case 'ai': renderAIPanel(); break;
      case 'settings': renderSettingsEditor(); break;
      case 'system': renderSystemPanel(); break;
    }
  }

  /* ─── DASHBOARD TAB ──────────────────────────────────── */
  function renderDashboard() {
    var el = $('panelDashboard');
    if (!el) return;
    var settings = getLSJSON('haven-schedule-settings');
    var tasks = getLSJSON('haven-schedule-tasks') || [];
    var cats = getLSJSON('haven-schedule-categories') || [];
    var customTags = getLSJSON('haven-custom-tags') || [];
    var completions = getLSJSON('haven-activities-completions') || [];
    var sleepLogs = getLSJSON('haven-schedule-sleep') || [];
    var piggy = 0;
    try { var pData = getLSJSON('haven-piggybank'); if (pData) piggy = pData.balance || 0; } catch(e) {}
    var wallet = 0;
    try { var wData = getLSJSON('haven-wallet'); if (wData) wallet = wData.balance || 0; } catch(e) {}

    // Storage
    var keyCount = localStorage.length;
    var totalSize = 0;
    try { for (var i = 0; i < localStorage.length; i++) { var k = localStorage.key(i); if (k) { var v = localStorage.getItem(k); if (v) totalSize += k.length + v.length; } } } catch(e) {}

    // Tasks stats
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

    // AI usage
    var aiUsage = getLSJSON('haven-schedule-ai-usage') || {};
    var aiTokens = aiUsage.totalTokens || 0;

    var html = '<div class="ad-dash-grid">';

    // KPI row
    var kpis = [
      { label: 'Storage', value: (totalSize / 1024).toFixed(1) + ' KB', sub: keyCount + ' keys used' },
      { label: 'Tasks', value: tasks.length, sub: todayTasks.length + ' today, ' + completedToday + ' done' },
      { label: 'Categories', value: cats.length + 5, sub: customTags.length + ' custom tags' },
      { label: 'Completions', value: completions.length, sub: 'all time activities' },
      { label: 'Sleep Logs', value: sleepLogs.length, sub: 'nights tracked' },
      { label: 'Finance', value: '$' + (piggy + wallet).toFixed(2), sub: 'Piggy: $' + piggy.toFixed(2) + ' / Wallet: $' + wallet.toFixed(2) },
      { label: 'AI Usage', value: aiTokens.toLocaleString(), sub: 'tokens used' },
      { label: 'Week Progress', value: completedWeek + '/' + weekTasks.length, sub: 'tasks completed this week' },
    ];
    kpis.forEach(function(k) {
      html += '<div class="ad-dash-card"><div class="ad-dash-label">' + esc(k.label) + '</div><div class="ad-dash-value">' + esc(String(k.value)) + '</div><div class="ad-dash-sub">' + esc(k.sub) + '</div></div>';
    });

    // Task by tag breakdown
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

    // Recent activity
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

    // Recent sleep
    var recentSleeps = sleepLogs.slice(-5).reverse();
    html += '<div class="ad-dash-card half"><div class="ad-dash-label">Recent Sleep</div>';
    if (recentSleeps.length === 0) {
      html += '<div class="ad-dash-sub" style="margin-top:6px">No sleep logs yet</div>';
    } else {
      recentSleeps.forEach(function(s) {
        html += '<div class="ad-dash-act"><span class="ad-dash-act-dot" style="background:#6366f1"></span><span>' + esc(s.date || '') + ' — ' + esc(s.bedtime || '') + ' to ' + esc(s.wakeTime || '') + '</span><span class="ad-dash-sub" style="margin-left:auto">' + (s.quality ? '★'.repeat(s.quality) : '') + '</span></div>';
      });
    }
    html += '</div>';

    // Quick Actions
    html += '<div class="ad-dash-card full"><div class="ad-dash-label">Quick Actions</div><div class="ad-dash-actions">';
    html += '<button class="admin-btn primary small" onclick="switchTab(\'storage\')">Browse Storage</button>';
    html += '<button class="admin-btn small" onclick="switchTab(\'tasks\')">Manage Tasks</button>';
    html += '<button class="admin-btn small" onclick="switchTab(\'data\')">Backup Data</button>';
    html += '<button class="admin-btn small" onclick="switchTab(\'system\')">System Info</button>';
    html += '<button class="admin-btn small" onclick="window._adSaveCurrentPreset()">Save Bento Preset</button>';
    html += '<button class="admin-btn small" onclick="openPasswordChangeModal()">Change Password</button>';
    html += '</div></div>';

    html += '</div>';
    el.innerHTML = html;
  }

  /* ─── STORAGE EXPLORER TAB ───────────────────────────── */
  function renderStorageExplorer() {
    var el = $('panelStorage');
    if (!el) return;
    var searchTerm = ($('adStorageSearch') || {}).value || '';
    var keys = [];
    try {
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i);
        if (k) keys.push(k);
      }
    } catch(e) {}
    keys.sort();

    if (searchTerm) {
      keys = keys.filter(function(k) { return k.toLowerCase().indexOf(searchTerm.toLowerCase()) !== -1; });
    }

    var html = '<div class="ad-toolbar">';
    html += '<input class="admin-search" id="adStorageSearch" type="text" placeholder="Search keys..." value="' + esc(searchTerm) + '" oninput="window._adminRenderTimeout && clearTimeout(window._adminRenderTimeout); window._adminRenderTimeout=setTimeout(function(){renderStorageExplorer()},200)">';
    html += '<button class="admin-btn small" onclick="renderStorageExplorer()"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/></svg> Refresh</button>';
    html += '</div>';

    html += '<div class="ad-table-wrap"><table class="ad-table"><thead><tr><th style="width:40%">Key</th><th style="width:15%">Size</th><th style="width:15%">Type</th><th style="width:30%">Actions</th></tr></thead><tbody>';
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
      html += '<tr><td class="ad-tcell-key" title="' + esc(key) + '">' + esc(key.length > 50 ? key.slice(0, 50) + '...' : key) + '</td>';
      html += '<td>' + sizeStr + '</td>';
      html += '<td>' + typeStr + '</td>';
      html += '<td class="ad-tcell-actions">';
      html += '<button class="admin-btn small" onclick="window._adViewKey(\'' + esc(key.replace(/'/g, "\\'")) + '\')">View</button>';
      html += '<button class="admin-btn small" onclick="window._adEditKey(\'' + esc(key.replace(/'/g, "\\'")) + '\')">Edit</button>';
      html += '<button class="admin-btn small danger" onclick="window._adDeleteKey(\'' + esc(key.replace(/'/g, "\\'")) + '\')">Del</button>';
      html += '</td></tr>';
    });
    html += '</tbody></table></div>';
    html += '<div class="ad-toolbar" style="margin-top:8px"><button class="admin-btn primary small" onclick="window._adAddKey()">+ Add Key</button><button class="admin-btn small danger" onclick="window._adClearAll()">Clear All Storage</button></div>';
    el.innerHTML = html;

    // Wire global handlers
    window._adViewKey = function(key) {
      var val = getLSItem(key);
      if (!val) { showError('Key not found'); return; }
      var pretty = '';
      try { var obj = JSON.parse(val); pretty = JSON.stringify(obj, null, 2); } catch(e) { pretty = val; }
      _openModal('View: ' + key, '<textarea class="ad-raw-input" readonly style="min-height:300px;font-size:0.72rem">' + esc(pretty) + '</textarea>',
        '<button class="admin-btn" onclick="closeModal()">Close</button>');
    };
    window._adEditKey = function(key) {
      var val = getLSItem(key) || '';
      _openModal('Edit: ' + key,
        '<label class="ad-modal-label">Value</label><textarea class="ad-raw-input" id="adEditVal" style="min-height:200px;font-size:0.72rem;font-family:var(--font-mono)">' + esc(val) + '</textarea>',
        '<button class="admin-btn" onclick="closeModal()">Cancel</button><button class="admin-btn primary" onclick="window._adSaveEdit(\'' + esc(key.replace(/'/g, "\\'")) + '\')">Save</button>');
    };
    window._adSaveEdit = function(key) {
      var val = $('adEditVal');
      if (!val) return;
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
      try { localStorage.clear(); } catch(e) {}
      showToast('All storage cleared', 'success');
      renderStorageExplorer();
    };
  }

  /* ─── TASK MANAGER TAB ──────────────────────────────── */
  function renderTaskManager() {
    var el = $('panelTasks');
    if (!el) return;
    var tasks = getLSJSON('haven-schedule-tasks') || [];
    var filterTag = ($('adTaskFilterTag') || {}).value || 'all';
    var filterStatus = ($('adTaskFilterStatus') || {}).value || 'all';
    var search = ($('adTaskSearch') || {}).value || '';
    var sortBy = ($('adTaskSort') || {}).value || 'date';

    // Filter
    var filtered = tasks.filter(function(t) {
      if (filterTag !== 'all' && (t.tag || 'none') !== filterTag) return false;
      if (filterStatus === 'done' && !t.completed) return false;
      if (filterStatus === 'pending' && t.completed) return false;
      if (search && t.title && t.title.toLowerCase().indexOf(search.toLowerCase()) === -1) return false;
      return true;
    });

    // Sort
    filtered.sort(function(a, b) {
      if (sortBy === 'date') return (a.date || '').localeCompare(b.date || '');
      if (sortBy === 'title') return (a.title || '').localeCompare(b.title || '');
      if (sortBy === 'tag') return (a.tag || '').localeCompare(b.tag || '');
      return 0;
    });

    // Collect unique tags
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

    // Bulk actions bar
    html += '<div class="ad-bulk-bar" id="adBulkBar">';
    html += '<span id="adBulkCount" style="font-size:0.72rem;color:var(--text-tertiary)">0 selected</span>';
    html += '<button class="admin-btn small" onclick="window._adBulkComplete()">Mark Done</button>';
    html += '<button class="admin-btn small" onclick="window._adBulkPending()">Mark Pending</button>';
    html += '<button class="admin-btn small danger" onclick="window._adBulkDelete()">Delete</button>';
    html += '<button class="admin-btn small" onclick="window._adBulkClear()">Clear</button>';
    html += '</div>';

    // Table
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
      var timeStr = task.startTime ? (formatTimeAMPM(task.startTime) + (task.endTime ? ' - ' + formatTimeAMPM(task.endTime) : '')) : '—';
      html += '<tr class="' + (task.completed ? 'ad-row-done' : '') + '">';
      html += '<td><input type="checkbox" class="ad-task-cb" data-id="' + task.id + '" onchange="window._adUpdateBulkBar()"></td>';
      html += '<td><span class="ad-tcell-title">' + esc(task.title || 'Untitled') + '</span></td>';
      html += '<td><span class="ad-tag-chip" style="background:var(--tag-' + task.tag + '-bg,var(--accent-soft));color:var(--tag-' + task.tag + '-text,var(--text-secondary))">' + esc(tagLabel) + '</span></td>';
      html += '<td>' + esc(task.date || '—') + '</td>';
      html += '<td style="font-size:0.7rem;color:var(--text-tertiary)">' + timeStr + '</td>';
      html += '<td><input type="checkbox" ' + checked + ' onchange="window._adToggleTask(\'' + task.id + '\',this.checked)"></td>';
      html += '<td><button class="admin-btn small" onclick="window._adDeleteTask(\'' + task.id + '\')" title="Delete">✕</button></td>';
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

  /* ─── DATA MANAGER TAB ──────────────────────────────── */
  function renderDataManager() {
    var el = $('panelData');
    if (!el) return;

    // Collect all data sections
    var sections = [
      { key: 'haven-schedule-tasks', label: 'Tasks', dangerous: false },
      { key: 'haven-schedule-categories', label: 'Categories', dangerous: false },
      { key: 'haven-schedule-settings', label: 'Settings', dangerous: false },
      { key: 'haven-custom-tags', label: 'Custom Tags', dangerous: false },
      { key: 'haven-subcategories', label: 'Subcategories', dangerous: false },
      { key: 'haven-activities-completions', label: 'Activity Completions', dangerous: false },
      { key: 'haven-schedule-sleep', label: 'Sleep Logs', dangerous: false },
      { key: 'haven-piggybank', label: 'Piggy Bank', dangerous: false },
      { key: 'haven-wallet', label: 'Wallet', dangerous: false },
      { key: 'haven-hub-content', label: 'Hub Content / Bento Layout', dangerous: false },
      { key: 'haven-schedule-ai-usage', label: 'AI Usage', dangerous: false },
      { key: 'haven-schedule-profile', label: 'User Profile / AI Memory', dangerous: false },
      { key: 'haven-schedule-chat', label: 'Chat History', dangerous: false },
      { key: 'haven-card-colors', label: 'Card Colors', dangerous: false },
      { key: 'haven-renamed-labels', label: 'Renamed Labels', dangerous: false },
    ];

    var html = '<div class="ad-dash-grid">';

    // Export card
    html += '<div class="ad-dash-card full"><div class="ad-dash-label">Export All Data</div>';
    html += '<div class="ad-dash-sub" style="margin-bottom:10px">Download a complete JSON backup of all your Havën data</div>';
    html += '<button class="admin-btn primary" onclick="window._adExportAll()"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg> Export All</button>';
    html += '<button class="admin-btn" style="margin-left:8px" onclick="window._adExportSelected()">Export Selected</button>';
    html += '</div>';

    // Import card
    html += '<div class="ad-dash-card full"><div class="ad-dash-label">Import Data</div>';
    html += '<div class="ad-dash-sub" style="margin-bottom:10px">Restore from a JSON backup file. This will overwrite existing data for each section.</div>';
    html += '<div class="ad-dash-row"><input type="file" id="adImportFile" accept=".json" style="font-size:0.75rem;color:var(--text-secondary)"><button class="admin-btn primary small" onclick="window._adImportData()" style="margin-left:8px">Import</button></div>';
    html += '</div>';

    // Backup to file
    html += '<div class="ad-dash-card half"><div class="ad-dash-label">Quick Backup</div>';
    html += '<div class="ad-dash-sub" style="margin-bottom:8px">Backup core data to localStorage backup keys</div>';
    html += '<button class="admin-btn small" onclick="window._adQuickBackup()">Create Backup</button>';
    html += '<button class="admin-btn small" style="margin-left:4px" onclick="window._adQuickRestore()">Restore Backup</button>';
    html += '</div>';

    // Clear all
    html += '<div class="ad-dash-card half"><div class="ad-dash-label">Clear App Data</div>';
    html += '<div class="ad-dash-sub" style="margin-bottom:8px">⚠️ Only clears Havën-related keys (keeps other apps)</div>';
    html += '<button class="admin-btn small danger" onclick="window._adClearAppData()">Clear App Data</button>';
    html += '</div>';

    // Per-section management
    html += '<div class="ad-dash-card full"><div class="ad-dash-label">Data Sections</div>';
    html += '<table class="ad-table" style="margin-top:4px"><thead><tr><th>Section</th><th>Size</th><th>Actions</th></tr></thead><tbody>';
    sections.forEach(function(s) {
      var val = getLSItem(s.key);
      var size = val ? (s.key.length + val.length) : 0;
      var sizeStr = size > 1024 ? (size / 1024).toFixed(1) + ' KB' : size + ' B';
      html += '<tr><td>' + esc(s.label) + '</td><td>' + sizeStr + '</td><td>';
      html += '<button class="admin-btn small" onclick="window._adViewSection(\'' + s.key + '\')">View</button>';
      html += '<button class="admin-btn small danger" onclick="window._adClearSection(\'' + s.key + '\',\'' + esc(s.label) + '\')" title="Delete this data">Clear</button>';
      html += '</td></tr>';
    });
    html += '</tbody></table></div>';

    html += '</div>';
    el.innerHTML = html;

    // Wire
    window._adExportAll = function() { _adExport(sections.map(function(s) { return s.key; })); };
    window._adExportSelected = function() { _adExport(sections.map(function(s) { return s.key; })); };
    window._adViewSection = function(key) {
      var val = getLSItem(key);
      if (!val) { showError('Empty'); return; }
      var pretty = '';
      try { pretty = JSON.stringify(JSON.parse(val), null, 2); } catch(e) { pretty = val; }
      _openModal('Data: ' + key, '<textarea class="ad-raw-input" readonly style="min-height:300px;font-size:0.72rem">' + esc(pretty) + '</textarea>',
        '<button class="admin-btn" onclick="closeModal()">Close</button>');
    };
    window._adClearSection = function(key, label) {
      if (!confirm('Clear "' + label + '" data? This cannot be undone.')) return;
      removeLSItem(key);
      showToast('Cleared: ' + label, 'success');
      renderDataManager();
    };
    window._adClearAppData = function() {
      if (!confirm('Clear ALL Havën app data? This will remove tasks, settings, everything!')) return;
      if (!confirm('Are you sure?')) return;
      var havenKeys = [];
      try { for (var i = 0; i < localStorage.length; i++) { var k = localStorage.key(i); if (k && k.indexOf('haven-') === 0) havenKeys.push(k); } } catch(e) {}
      havenKeys.forEach(function(k) { removeLSItem(k); });
      showToast('Cleared ' + havenKeys.length + ' Havën keys', 'success');
      renderDataManager();
    };
    window._adQuickBackup = function() {
      var backup = {};
      var count = 0;
      try {
        for (var i = 0; i < localStorage.length; i++) {
          var k = localStorage.key(i);
          if (k && k.indexOf('haven-') === 0) { backup[k] = localStorage.getItem(k); count++; }
        }
      } catch(e) {}
      setLSJSON('haven-admin-backup-' + formatDate(new Date()), backup);
      showToast('Backup saved (' + count + ' keys)', 'success');
    };
    window._adQuickRestore = function() {
      var backupKeys = [];
      try { for (var i = 0; i < localStorage.length; i++) { var k = localStorage.key(i); if (k && k.indexOf('haven-admin-backup-') === 0) backupKeys.push(k); } } catch(e) {}
      if (backupKeys.length === 0) { showError('No backups found'); return; }
      var latest = backupKeys.sort().pop();
      var backup = getLSJSON(latest);
      if (!backup) { showError('Invalid backup'); return; }
      var count = 0;
      Object.keys(backup).forEach(function(k) { setLSItem(k, backup[k]); count++; });
      showToast('Restored ' + count + ' keys from ' + latest, 'success');
    };
    window._adImportData = function() {
      var fileInput = $('adImportFile');
      if (!fileInput || !fileInput.files || !fileInput.files[0]) { showError('Select a file first'); return; }
      var reader = new FileReader();
      reader.onload = function(e) {
        try {
          var data = JSON.parse(e.target.result);
          var count = 0;
          if (data._exportDate) delete data._exportDate;
          if (data._version) delete data._version;
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

  function _adExport(keys) {
    var data = {};
    keys.forEach(function(k) {
      var val = getLSItem(k);
      if (val) {
        try { data[k] = JSON.parse(val); } catch(e) { data[k] = val; }
      }
    });
    data._exportDate = new Date().toISOString();
    data._version = '2.0';
    var blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'haven-backup-' + formatDate(new Date()) + '.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function() { URL.revokeObjectURL(url); }, 1000);
    showToast('Export downloaded', 'success');
  }

  /* ─── SLEEP TAB ──────────────────────────────────────── */
  function renderSleepPanel() {
    var el = $('panelSleep');
    if (!el) return;
    var logs = getLSJSON('haven-schedule-sleep') || [];
    var html = '<div class="ad-toolbar"><span class="ad-dash-sub">' + logs.length + ' total logs</span></div>';
    html += '<div class="ad-table-wrap" style="max-height:60vh"><table class="ad-table"><thead><tr><th>Date</th><th>Bedtime</th><th>Wake</th><th>Duration</th><th>Quality</th><th>Notes</th><th>Actions</th></tr></thead><tbody>';
    if (logs.length === 0) {
      html += '<tr><td colspan="7" style="text-align:center;padding:24px;color:var(--text-tertiary)">No sleep logs yet</td></tr>';
    }
    var sorted = logs.slice().sort(function(a, b) { return (b.date || '').localeCompare(a.date || ''); });
    sorted.forEach(function(log) {
      var durStr = log.duration ? (Math.floor(log.duration/60) + 'h ' + (log.duration%60) + 'm') : '—';
      var stars = '';
      for (var q = 0; q < (log.quality || 0); q++) stars += '★';
      html += '<tr><td>' + esc(log.date || '—') + '</td><td>' + esc(log.bedtime || '—') + '</td><td>' + esc(log.wakeTime || '—') + '</td><td>' + durStr + '</td><td>' + stars + '</td><td style="max-width:150px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + esc((log.notes || '').slice(0, 40)) + '</td>';
      html += '<td><button class="admin-btn small danger" onclick="window._adDeleteSleep(\'' + log.id + '\')">Del</button></td></tr>';
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

  /* ─── FINANCE TAB ────────────────────────────────────── */
  function renderFinancePanel() {
    var el = $('panelFinance');
    if (!el) return;
    var piggy = getLSJSON('haven-piggybank') || { balance: 0, history: [] };
    var wallet = getLSJSON('haven-wallet') || { balance: 0, history: [] };

    var html = '<div class="ad-dash-grid">';
    html += '<div class="ad-dash-card"><div class="ad-dash-label">Piggy Bank</div><div class="ad-dash-value">$' + (piggy.balance || 0).toFixed(2) + '</div><div class="ad-dash-sub">' + ((piggy.history || []).length) + ' transactions</div></div>';
    html += '<div class="ad-dash-card"><div class="ad-dash-label">Wallet</div><div class="ad-dash-value">$' + (wallet.balance || 0).toFixed(2) + '</div><div class="ad-dash-sub">' + ((wallet.history || []).length) + ' transactions</div></div>';
    html += '<div class="ad-dash-card"><div class="ad-dash-label">Net Worth</div><div class="ad-dash-value">$' + ((piggy.balance || 0) + (wallet.balance || 0)).toFixed(2) + '</div><div class="ad-dash-sub">Combined total</div></div>';
    html += '<div class="ad-dash-card full"><div class="ad-dash-label">Edit Balance</div><div class="ad-dash-row">';
    html += '<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap"><span style="font-size:0.72rem">Piggy:</span><input type="number" id="adPiggyVal" step="0.01" value="' + (piggy.balance || 0).toFixed(2) + '" class="ad-raw-input" style="width:100px"><button class="admin-btn small" onclick="window._adSetPiggy()">Set</button></div>';
    html += '<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap"><span style="font-size:0.72rem">Wallet:</span><input type="number" id="adWalletVal" step="0.01" value="' + (wallet.balance || 0).toFixed(2) + '" class="ad-raw-input" style="width:100px"><button class="admin-btn small" onclick="window._adSetWallet()">Set</button></div>';
    html += '</div></div>';

    // Recent history
    var allHistory = [];
    (piggy.history || []).forEach(function(h) { allHistory.push({ source: 'Piggy', date: h.date, amount: h.amount, note: h.note || '' }); });
    (wallet.history || []).forEach(function(h) { allHistory.push({ source: 'Wallet', date: h.date, amount: h.amount, note: h.note || '' }); });
    allHistory.sort(function(a, b) { return (b.date || '').localeCompare(a.date || ''); });

    html += '<div class="ad-dash-card full"><div class="ad-dash-label">Transaction History</div>';
    html += '<table class="ad-table" style="margin-top:4px"><thead><tr><th>Date</th><th>Source</th><th>Amount</th><th>Note</th></tr></thead><tbody>';
    if (allHistory.length === 0) {
      html += '<tr><td colspan="4" style="text-align:center;color:var(--text-tertiary);padding:16px">No transactions</td></tr>';
    }
    allHistory.slice(0, 30).forEach(function(h) {
      html += '<tr><td>' + esc(h.date || '—') + '</td><td>' + h.source + '</td><td style="color:' + (h.amount >= 0 ? 'var(--accent)' : '#ef4444') + '">' + (h.amount >= 0 ? '+' : '') + '$' + Number(h.amount).toFixed(2) + '</td><td>' + esc(h.note || '') + '</td></tr>';
    });
    html += '</tbody></table></div>';
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

  /* ─── ACTIVITY TAB ───────────────────────────────────── */
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
      var tagLabel = (typeof TAG_LABELS !== 'undefined' && TAG_LABELS[c.tag]) ? TAG_LABELS[c.tag] : (c.tag || '—');
      var dateStr = c.date || (c.completedAt ? c.completedAt.slice(0, 10) : '—');
      html += '<tr><td>' + esc(dateStr) + '</td><td>' + esc(c.title || 'Untitled') + '</td><td><span class="ad-tag-chip">' + esc(tagLabel) + '</span></td><td style="font-size:0.7rem;color:var(--text-tertiary)">' + esc(c.completedAt ? c.completedAt.slice(11, 19) : '') + '</td></tr>';
    });
    html += '</tbody></table></div>';
    el.innerHTML = html;
  }

  /* ─── AI TAB ─────────────────────────────────────────── */
  function renderAIPanel() {
    var el = $('panelAI');
    if (!el) return;
    var usage = getLSJSON('haven-schedule-ai-usage') || {};
    var profile = getLSJSON('haven-schedule-profile') || {};
    var chatHistory = getLSJSON('haven-schedule-chat') || [];
    var memory = profile.conversationMemory || [];

    var html = '<div class="ad-dash-grid">';
    html += '<div class="ad-dash-card"><div class="ad-dash-label">Total Tokens</div><div class="ad-dash-value">' + (usage.totalTokens || 0).toLocaleString() + '</div></div>';
    html += '<div class="ad-dash-card"><div class="ad-dash-label">Total Calls</div><div class="ad-dash-value">' + (usage.totalCalls || 0) + '</div></div>';
    html += '<div class="ad-dash-card"><div class="ad-dash-label">Chat Messages</div><div class="ad-dash-value">' + chatHistory.length + '</div></div>';
    html += '<div class="ad-dash-card"><div class="ad-dash-label">AI Memories</div><div class="ad-dash-value">' + memory.length + '</div></div>';

    // Chat history
    html += '<div class="ad-dash-card full"><div class="ad-dash-label">Chat History</div>';
    html += '<div class="ad-table-wrap" style="max-height:200px"><table class="ad-table"><thead><tr><th>Role</th><th>Preview</th><th>Time</th></tr></thead><tbody>';
    if (chatHistory.length === 0) {
      html += '<tr><td colspan="3" style="text-align:center;color:var(--text-tertiary);padding:16px">No chat history</td></tr>';
    }
    chatHistory.slice(-30).reverse().forEach(function(msg) {
      html += '<tr><td style="font-weight:' + (msg.role === 'user' ? '600' : '400') + '">' + esc(msg.role || '—') + '</td><td style="max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + esc((msg.content || '').slice(0, 60)) + '</td><td style="font-size:0.7rem;color:var(--text-tertiary)">' + esc(msg.timestamp ? msg.timestamp.slice(11, 19) : '') + '</td></tr>';
    });
    html += '</tbody></table></div></div>';

    // AI Memory
    html += '<div class="ad-dash-card full"><div class="ad-dash-label">AI Conversation Memory</div>';
    if (memory.length === 0) {
      html += '<div class="ad-dash-sub" style="margin-top:6px">No stored facts</div>';
    } else {
      memory.slice(-20).forEach(function(fact, idx) {
        html += '<div class="ad-dash-act"><span class="ad-dash-act-dot" style="background:#8b5cf6"></span>';
        html += '<span style="font-size:0.72rem">' + esc(typeof fact === 'string' ? fact : fact.text || fact.content || JSON.stringify(fact)) + '</span>';
        html += '</div>';
      });
    }
    html += '</div>';

    // Reset button
    html += '<div class="ad-dash-card full"><div class="ad-dash-label">Danger Zone</div>';
    html += '<div class="ad-dash-row"><button class="admin-btn small danger" onclick="window._adResetAIUsage()">Reset Usage Stats</button>';
    html += '<button class="admin-btn small danger" onclick="window._adClearChatHistory()">Clear Chat History</button>';
    html += '<button class="admin-btn small danger" onclick="window._adClearAIMemory()">Clear AI Memory</button></div></div>';

    html += '</div>';
    el.innerHTML = html;

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

  /* ─── SETTINGS EDITOR TAB ───────────────────────────── */
  function renderSettingsEditor() {
    var el = $('panelSettings');
    if (!el) return;
    var settings = getLSJSON('haven-schedule-settings') || {};

    var html = '<div class="ad-dash-grid">';

    // Visual settings
    html += '<div class="ad-dash-card full"><div class="ad-dash-label">Theme & Appearance</div>';
    html += '<div class="ad-dash-row" style="flex-wrap:wrap;gap:10px;margin-top:8px">';
    html += '<div><label style="font-size:0.68rem;color:var(--text-tertiary)">Accent Color</label><br><input type="color" id="adSetAccent" value="' + esc(settings.accentColor || '#a5b4fc') + '" onchange="window._adPreviewAccent(this.value)"></div>';
    html += '<div><label style="font-size:0.68rem;color:var(--text-tertiary)">Dark Mode</label><br><select class="ad-select" id="adSetDarkMode" onchange="window._adUpdateSetting()">';
    html += '<option value="system"' + (settings.darkMode === undefined || settings.darkMode === null ? ' selected' : '') + '>System</option>';
    html += '<option value="true"' + (settings.darkMode === true ? ' selected' : '') + '>Dark</option>';
    html += '<option value="false"' + (settings.darkMode === false ? ' selected' : '') + '>Light</option>';
    html += '</select></div>';
    html += '<div><label style="font-size:0.68rem;color:var(--text-tertiary)">Preview</label><br><div class="ad-swatch-preview" id="adSwatchPreview" style="background:' + esc(settings.accentColor || '#a5b4fc') + ';width:32px;height:32px;border-radius:8px;border:1px solid var(--border-color)"></div></div>';
    html += '</div></div>';

    // Notification settings
    html += '<div class="ad-dash-card full"><div class="ad-dash-label">Notifications</div>';
    html += '<div class="ad-dash-row" style="flex-wrap:wrap;gap:10px;margin-top:8px">';
    html += '<label style="font-size:0.72rem;display:flex;align-items:center;gap:6px"><input type="checkbox" id="adSetNotif"' + (settings.notifications !== false ? ' checked' : '') + '> Enable Notifications</label>';
    html += '<label style="font-size:0.72rem;display:flex;align-items:center;gap:6px"><input type="checkbox" id="adSetBriefing"' + (settings.dailyBriefing !== false ? ' checked' : '') + '> Daily Briefing</label>';
    html += '</div></div>';

    // Task defaults
    html += '<div class="ad-dash-card full"><div class="ad-dash-label">Task Defaults</div>';
    html += '<div class="ad-dash-row" style="flex-wrap:wrap;gap:10px;margin-top:8px">';
    html += '<div><label style="font-size:0.68rem;color:var(--text-tertiary)">Default Duration (min)</label><br><input class="ad-raw-input" id="adSetDuration" type="number" value="' + (settings.defaultDuration || 60) + '" style="width:80px"></div>';
    html += '<div><label style="font-size:0.68rem;color:var(--text-tertiary)">Grid Start Hour</label><br><input class="ad-raw-input" id="adSetGridStart" type="number" min="0" max="23" value="' + (settings.gridStartHour || 5) + '" style="width:60px"></div>';
    html += '<div><label style="font-size:0.68rem;color:var(--text-tertiary)">Grid End Hour</label><br><input class="ad-raw-input" id="adSetGridEnd" type="number" min="0" max="23" value="' + (settings.gridEndHour || 21) + '" style="width:60px"></div>';
    html += '</div></div>';

    // Sleep targets
    html += '<div class="ad-dash-card full"><div class="ad-dash-label">Sleep Defaults</div>';
    html += '<div class="ad-dash-row" style="flex-wrap:wrap;gap:10px;margin-top:8px">';
    var sleepTargets = getLSJSON('haven-schedule-sleep-targets') || {};
    html += '<div><label style="font-size:0.68rem;color:var(--text-tertiary)">Target Bedtime</label><br><input class="ad-raw-input" id="adSetBedtime" type="time" value="' + esc(sleepTargets.targetBedtime || '23:00') + '"></div>';
    html += '<div><label style="font-size:0.68rem;color:var(--text-tertiary)">Target Wake</label><br><input class="ad-raw-input" id="adSetWake" type="time" value="' + esc(sleepTargets.targetWakeTime || '07:00') + '"></div>';
    html += '<div><label style="font-size:0.68rem;color:var(--text-tertiary)">Wind-down Reminder (min)</label><br><input class="ad-raw-input" id="adSetWindDown" type="number" value="' + (sleepTargets.windDownReminderMins || 30) + '" style="width:60px"></div>';
    html += '</div></div>';

    // Save button
    html += '<div class="ad-dash-card full"><div class="ad-dash-label">Save Changes</div>';
    html += '<button class="admin-btn primary" onclick="window._adSaveSettings()">Save All Settings</button>';
    html += '<button class="admin-btn small" style="margin-left:8px" onclick="window._adResetSettings()">Reset to Defaults</button>';
    html += '<button class="admin-btn small" style="margin-left:8px" onclick="openPasswordChangeModal()">Change Password</button>';
    html += '</div>';

    // Raw settings viewer
    html += '<div class="ad-dash-card full"><div class="ad-dash-label">Raw Settings JSON</div>';
    html += '<textarea class="ad-raw-input" id="adRawSettings" style="min-height:120px;font-size:0.72rem;font-family:var(--font-mono)">' + esc(JSON.stringify(settings, null, 2)) + '</textarea>';
    html += '<button class="admin-btn small" style="margin-top:4px" onclick="window._adApplyRawSettings()">Apply Raw JSON</button>';
    html += '</div>';

    html += '</div>';
    el.innerHTML = html;

    window._adUpdateSetting = function() { /* placeholder */ };
    window._adPreviewAccent = function(color) {
      var swatch = $('adSwatchPreview');
      if (swatch) swatch.style.background = color;
    };
    window._adSaveSettings = function() {
      var s = {};
      s.accentColor = ($('adSetAccent') || {}).value || '#a5b4fc';
      var dm = ($('adSetDarkMode') || {}).value;
      s.darkMode = dm === 'true' ? true : (dm === 'false' ? false : null);
      s.notifications = ($('adSetNotif') || {}).checked;
      s.dailyBriefing = ($('adSetBriefing') || {}).checked;
      s.defaultDuration = parseInt(($('adSetDuration') || {}).value) || 60;
      s.gridStartHour = parseInt(($('adSetGridStart') || {}).value) || 5;
      s.gridEndHour = parseInt(($('adSetGridEnd') || {}).value) || 21;
      setLSJSON('haven-schedule-settings', s);
      // Sleep targets
      var st = {};
      st.targetBedtime = ($('adSetBedtime') || {}).value || '23:00';
      st.targetWakeTime = ($('adSetWake') || {}).value || '07:00';
      st.windDownReminderMins = parseInt(($('adSetWindDown') || {}).value) || 30;
      setLSJSON('haven-schedule-sleep-targets', st);
      // Apply
      if (typeof applyTheme === 'function') applyTheme();
      showToast('Settings saved', 'success');
    };
    window._adResetSettings = function() {
      if (!confirm('Reset all settings to defaults?')) return;
      removeLSItem('haven-schedule-settings');
      removeLSItem('haven-schedule-sleep-targets');
      renderSettingsEditor();
      showToast('Settings reset', 'success');
    };
    window._adApplyRawSettings = function() {
      try {
        var raw = $('adRawSettings');
        if (!raw) return;
        var obj = JSON.parse(raw.value);
        setLSJSON('haven-schedule-settings', obj);
        showToast('Raw settings applied', 'success');
      } catch(e) { showError('Invalid JSON: ' + e.message); }
    };
  }

  /* ─── SYSTEM TAB ─────────────────────────────────────── */
  function renderSystemPanel() {
    var el = $('panelSystem');
    if (!el) return;
    var html = '<div class="ad-dash-grid">';

    // Browser info
    html += '<div class="ad-dash-card"><div class="ad-dash-label">Browser</div><div class="ad-dash-value" style="font-size:0.85rem">' + esc(navigator.userAgent.slice(0, 60)) + '</div></div>';
    html += '<div class="ad-dash-card"><div class="ad-dash-label">Platform</div><div class="ad-dash-value" style="font-size:0.85rem">' + esc(navigator.platform) + '</div></div>';
    html += '<div class="ad-dash-card"><div class="ad-dash-label">Language</div><div class="ad-dash-value" style="font-size:0.85rem">' + esc(navigator.language) + '</div></div>';
    html += '<div class="ad-dash-card"><div class="ad-dash-label">Online</div><div class="ad-dash-value" style="font-size:0.85rem">' + (navigator.onLine ? 'Online' : 'Offline') + '</div></div>';

    // Storage
    var keyCount = localStorage.length;
    var totalSize = 0;
    var largestKeys = [];
    try {
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i);
        if (k) {
          var v = localStorage.getItem(k);
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

    // Largest keys
    html += '<div class="ad-dash-card full"><div class="ad-dash-label">Top Storage Consumers</div>';
    largestKeys.slice(0, 8).forEach(function(item) {
      var fill = Math.min(100, (item.size / (totalSize || 1)) * 100);
      html += '<div class="ad-sys-bar-row"><span class="ad-sys-bar-label">' + esc(item.key.length > 35 ? item.key.slice(0, 35) + '...' : item.key) + '</span>';
      html += '<div class="ad-sys-bar-track"><div class="ad-sys-bar-fill" style="width:' + fill.toFixed(0) + '%"></div></div>';
      html += '<span class="ad-sys-bar-val">' + (item.size / 1024).toFixed(1) + ' KB</span></div>';
    });
    html += '</div>';

    // Screen info
    html += '<div class="ad-dash-card"><div class="ad-dash-label">Screen</div><div class="ad-dash-value" style="font-size:0.85rem">' + screen.width + '×' + screen.height + '</div><div class="ad-dash-sub">' + (window.devicePixelRatio || 1) + 'x DPR</div></div>';

    // Network
    var conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    var connType = conn ? conn.effectiveType : 'N/A';
    var connSpeed = conn && conn.downlink ? conn.downlink + ' Mbps' : '';
    html += '<div class="ad-dash-card"><div class="ad-dash-label">Connection</div><div class="ad-dash-value" style="font-size:0.82rem">' + connType + '</div><div class="ad-dash-sub">' + connSpeed + '</div></div>';

    // Memory estimate
    html += '<div class="ad-dash-card"><div class="ad-dash-label">Memory (est.)</div><div class="ad-dash-value" style="font-size:0.82rem">' + ((navigator.deviceMemory) ? navigator.deviceMemory + ' GB' : 'N/A') + '</div><div class="ad-dash-sub">device RAM (if available)</div></div>';

    // Pixel & viewport
    html += '<div class="ad-dash-card"><div class="ad-dash-label">Viewport</div><div class="ad-dash-value" style="font-size:0.85rem">' + window.innerWidth + '×' + window.innerHeight + '</div><div class="ad-dash-sub">current window size</div></div>';

    // App info
    html += '<div class="ad-dash-card full"><div class="ad-dash-label">App Information</div>';
    html += '<div class="ad-dash-row" style="flex-direction:column;align-items:flex-start;gap:4px;margin-top:4px">';
    html += '<span style="font-size:0.72rem">App: Havën Schedule</span>';
    html += '<span style="font-size:0.72rem">Page: Admin Panel v2.0</span>';
    html += '<span style="font-size:0.72rem">Time: ' + new Date().toLocaleString() + '</span>';
    html += '<span style="font-size:0.72rem">Timezone: ' + Intl.DateTimeFormat().resolvedOptions().timeZone + ' (UTC' + (new Date().getTimezoneOffset() < 0 ? '+' : '') + (-new Date().getTimezoneOffset() / 60) + ')</span>';
    html += '</div></div>';

    // Actions
    html += '<div class="ad-dash-card full"><div class="ad-dash-label">Actions</div>';
    html += '<div class="ad-dash-row"><button class="admin-btn small" onclick="window._adCheckUpdate()">Check for Updates</button>';
    html += '<button class="admin-btn small" onclick="navigator.storage && navigator.storage.estimate && navigator.storage.estimate().then(function(e){showToast(\'Quota: \'+(e.usage/1024/1024).toFixed(1)+\'MB / \'+(e.quota/1024/1024).toFixed(1)+\'MB\')})">Storage Estimate</button>';
    html += '<button class="admin-btn small danger" onclick="if(confirm(\'Clear all caches?\')){caches&&caches.keys().then(function(ks){ks.forEach(function(k){caches.delete(k)})});showToast(\'Caches cleared\')}">Clear Caches</button>';
    html += '<button class="admin-btn small" onclick="navigator.serviceWorker&&navigator.serviceWorker.getRegistration().then(function(r){showToast(r?\'SW registered\':\'No SW\')})">SW Status</button></div></div>';

    html += '</div>';
    el.innerHTML = html;



    window._adCheckUpdate = function() {
      showToast('Already up to date');
    };
  }

  /* ─── Preset Management ──────────────────────────────── */
  window._adSaveCurrentPreset = function() {
    var hc = getLSJSON('haven-hub-content');
    if (!hc || !hc.bentoLayout || hc.bentoLayout.length === 0) {
      showError('No bento layout found to save');
      return;
    }
    var name = prompt('Name this preset:');
    if (!name || !name.trim()) return;
    var presets = loadAdminPresets();
    presets.push({
      id: uid(),
      name: name.trim(),
      createdAt: new Date().toISOString(),
      data: JSON.parse(JSON.stringify(hc))
    });
    saveAdminPresets(presets);
    showToast('Preset "' + name.trim() + '" saved', 'success');
  };

  function loadAdminPresets() {
    try {
      var raw = localStorage.getItem(ADMIN_PRESETS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch(e) { return []; }
  }

  function saveAdminPresets(presets) {
    try { localStorage.setItem(ADMIN_PRESETS_KEY, JSON.stringify(presets)); } catch(e) {}
  }

  /* ─── Modal System ───────────────────────────────────── */
  function _openModal(title, bodyHtml, footerHtml) {
    var existing = document.getElementById('adModalOverlay');
    if (existing) existing.remove();
    var ov = document.createElement('div');
    ov.id = 'adModalOverlay';
    ov.className = 'ad-modal-overlay';
    ov.innerHTML = '<div class="ad-modal"><div class="ad-modal-header"><h3 class="ad-modal-title">' + title + '</h3><button class="ad-modal-close" onclick="closeModal()">&times;</button></div><div class="ad-modal-body">' + bodyHtml + '</div><div class="ad-modal-footer">' + (footerHtml || '') + '</div></div>';
    document.body.appendChild(ov);
    requestAnimationFrame(function() { ov.classList.add('show'); });
    // Close on overlay click
    ov.addEventListener('click', function(e) { if (e.target === ov) closeModal(); });
    // Close on Escape
    var handler = function(e) { if (e.key === 'Escape') { closeModal(); document.removeEventListener('keydown', handler); } };
    document.addEventListener('keydown', handler);
  }

  window.closeModal = function() {
    var ov = document.getElementById('adModalOverlay');
    if (ov) { ov.classList.remove('show'); setTimeout(function() { ov.remove(); }, 200); }
  };

  /* ─── Init ───────────────────────────────────────────── */
  function init() {
    if (!requireAuth()) {
      document.body.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100vh;background:var(--bg-primary);color:var(--text-secondary);font-size:0.9rem">Access denied. Refresh to try again.</div>';
      return;
    }
    initTabs();
    switchTab('dashboard');

    // Wire existing buttons
    var btnDash = $('btnDashboard');
    if (btnDash) btnDash.addEventListener('click', function() { switchTab('dashboard'); });

    // Hamburger menu
    var hamburger = $('hubHamburger');
    var sidebar = $('hubSidebar');
    var overlay = $('hubSidebarOverlay');
    if (hamburger && sidebar && overlay) {
      hamburger.addEventListener('click', function() {
        sidebar.classList.toggle('open');
        overlay.classList.toggle('visible');
      });
      overlay.addEventListener('click', function() {
        sidebar.classList.remove('open');
        overlay.classList.remove('visible');
      });
    }

    // Theme toggle
    var themeBtn = $('themeBtnSidebar');
    if (themeBtn) {
      themeBtn.addEventListener('click', function() {
        document.documentElement.classList.toggle('light');
        try { localStorage.setItem('haven-theme', document.documentElement.classList.contains('light') ? 'light' : 'dark'); } catch(e) {}
      });
    }

    // Settings button
    var aiBtn = $('aiChatBtnSidebar');
    if (aiBtn) {
      aiBtn.addEventListener('click', function() { switchTab('settings'); });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
