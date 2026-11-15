(function () {
  'use strict';

  var TYPES = ['study', 'weekplan', 'grades', 'exams'];
  var FIELDS = ['study', 'weekplan', 'grades', 'exams'];
  var DEFAULT_LIST = [
    { id: 'ca1', name: 'CA1', date: '' },
    { id: 'ca2', name: 'CA2', date: '' },
    { id: 'fte1', name: 'FTE 1', date: '' }
  ];
  var PANEL_ID = 'currPanel';
  var STYLE_ID = 'currStyles';
  var panelAnchor = null;

  var BOOK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10L12 5 2 10l10 5 10-5z"/><path d="M6 12v5c0 1.7 2.7 3 6 3s6-1.3 6-3v-5"/></svg>';
  var CHEV = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>';
  var CHECK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>';
  var PENCIL = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/></svg>';
  var X = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';

  var CSS = [
    '.curr-btn{display:inline-flex;align-items:center;gap:5px;flex:0 0 auto;margin-left:auto;padding:4px 8px;border:1px solid var(--border-color,#3a3a3a);border-radius:999px;background:var(--bg-card,var(--surface-container,#242424));color:var(--text-secondary,#a8a8a8);font-size:11px;font-weight:500;line-height:1;cursor:pointer;white-space:nowrap;font-family:inherit;max-width:118px;transition:color 160ms ease,border-color 160ms ease,background 160ms ease}',
    '.curr-btn:hover{color:var(--text-primary,#f4f4f4);border-color:var(--text-tertiary,#777);background:var(--bg-secondary,var(--surface-container,#282828))}',
    '.w-head .curr-btn svg{width:12px;height:12px;opacity:1;stroke-width:2;color:currentColor;flex-shrink:0}',
    '.w-head .curr-btn .curr-btn-name{flex:0 0 auto;width:auto;font-size:11px;font-weight:500;line-height:1;text-transform:none;letter-spacing:0;color:inherit;font-family:inherit;opacity:1;overflow:hidden;text-overflow:ellipsis;max-width:62px}',
    '.curr-btn.curr-on{color:var(--text-primary,#f4f4f4);border-color:var(--text-secondary,#888)}',
    '.curr-widget .w-head > span{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-width:0}',
    '.curr-weekplan .w-head{gap:6px}',
    '.curr-weekplan .w-head > span{font-size:1.02rem;letter-spacing:0}',
    '.curr-weekplan .wk-range{font-size:0.54rem;letter-spacing:0}',
    '.curr-panel{position:fixed;z-index:1400;width:264px;max-height:min(70vh,460px);overflow-y:auto;background:var(--bg-card,var(--bg-secondary,#1d1d1d));border:1px solid var(--border-color,#3a3a3a);border-radius:14px;box-shadow:0 14px 44px rgba(0,0,0,.45);padding:10px;font-family:var(--font-sans,inherit);color:var(--text-primary,#f4f4f4);font-size:13px;animation:currIn 160ms cubic-bezier(.16,1,.3,1)}',
    '@keyframes currIn{from{opacity:0;transform:translateY(-5px)}to{opacity:1;transform:none}}',
    '.curr-head{display:flex;align-items:flex-start;gap:8px;padding:4px 6px 10px;border-bottom:1px solid var(--border-subtle,var(--border-color,#333));margin-bottom:6px}',
    '.curr-title{font-size:13px;font-weight:600;letter-spacing:.01em}',
    '.curr-sub{font-size:11px;color:var(--text-tertiary,#8c8c8c);margin-top:2px}',
    '.curr-head .curr-x{margin-left:auto;flex:0 0 auto;width:22px;height:22px;border:none;background:transparent;color:var(--text-tertiary,#999);cursor:pointer;display:flex;align-items:center;justify-content:center;border-radius:6px;padding:0}',
    '.curr-head .curr-x:hover{background:var(--bg-secondary,#2a2a2a);color:var(--text-primary,#fff)}',
    '.curr-head .curr-x svg{width:13px;height:13px}',
    '.curr-row{display:flex;align-items:center;gap:4px;border-radius:9px;padding:2px 4px}',
    '.curr-row:hover{background:var(--bg-secondary,rgba(255,255,255,.05))}',
    '.curr-row.is-active{background:color-mix(in srgb,var(--text-primary,#fff) 9%,transparent)}',
    '.curr-pick{flex:1 1 auto;min-width:0;display:flex;align-items:center;gap:8px;border:none;background:transparent;color:inherit;cursor:pointer;padding:7px 6px;text-align:left;font:inherit;border-radius:8px}',
    '.curr-pick-name{font-size:13px;font-weight:500;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
    '.curr-pick-date{font-size:10.5px;color:var(--text-tertiary,#8c8c8c);margin-left:auto;white-space:nowrap}',
    '.curr-active-dot{flex:0 0 auto;width:16px;height:16px;border-radius:50%;background:var(--text-primary,#f4f4f4);color:var(--bg-primary,#111);display:flex;align-items:center;justify-content:center}',
    '.curr-active-dot svg{width:10px;height:10px}',
    '.curr-mini{flex:0 0 auto;width:22px;height:22px;border:none;background:transparent;color:var(--text-tertiary,#888);cursor:pointer;display:flex;align-items:center;justify-content:center;border-radius:6px;padding:0;opacity:0;transition:opacity 140ms ease}',
    '.curr-row:hover .curr-mini{opacity:1}',
    '.curr-mini:hover{background:var(--bg-primary,#2a2a2a);color:var(--text-primary,#fff)}',
    '.curr-mini.curr-del:hover{color:#ef6b6b}',
    '.curr-mini svg{width:12px;height:12px}',
    '.curr-editform,.curr-addform{display:flex;flex-wrap:wrap;gap:5px;padding:6px 6px 8px}',
    '.curr-editform[hidden],.curr-addform[hidden]{display:none}',
    '.curr-in{flex:1 1 100px;min-width:0;background:var(--bg-primary,#151515);border:1px solid var(--border-color,#3a3a3a);border-radius:7px;color:var(--text-primary,#f4f4f4);font:inherit;font-size:11.5px;padding:6px 8px;outline:none}',
    '.curr-in:focus{border-color:var(--text-secondary,#888)}',
    '.curr-in-date{flex:1 1 80px;max-width:110px}',
    '.curr-save{flex:0 0 auto;border:1px solid var(--border-color,#3a3a3a);background:var(--bg-secondary,#2a2a2a);color:var(--text-primary,#f4f4f4);border-radius:7px;font:inherit;font-size:11px;padding:6px 11px;cursor:pointer}',
    '.curr-save:hover{border-color:var(--text-secondary,#888)}',
    '.curr-add{display:block;width:100%;text-align:left;border:none;border-top:1px solid var(--border-subtle,var(--border-color,#333));background:transparent;color:var(--text-secondary,#aaa);font:inherit;font-size:11.5px;padding:10px 8px 4px;cursor:pointer;margin-top:4px}',
    '.curr-add:hover{color:var(--text-primary,#fff)}',
    '.curr-foot{font-size:10.5px;line-height:1.5;color:var(--text-tertiary,#8c8c8c);padding:8px 8px 2px}'
  ].join('\n');

  function hc() { try { return (typeof hubContent !== 'undefined' && hubContent) ? hubContent : null; } catch (e) { return null; } }
  function clone(v) { try { return JSON.parse(JSON.stringify(v)); } catch (e) { return null; } }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function uid() { return 'a' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
  function find(c, id) { for (var i = 0; i < c.list.length; i++) if (c.list[i].id === id) return c.list[i]; return null; }
  function activeName(c) { var x = find(c, c.active); return x ? x.name : String(c.active); }

  function cfg() {
    var h = hc(); if (!h) return null;
    if (!h.curriculum || typeof h.curriculum !== 'object') h.curriculum = { active: 'fte1', list: clone(DEFAULT_LIST), vault: {} };
    var c = h.curriculum;
    if (!Array.isArray(c.list) || !c.list.length) c.list = clone(DEFAULT_LIST);
    if (!c.vault || typeof c.vault !== 'object') c.vault = {};
    if (!c.active || !find(c, c.active)) c.active = c.list[0].id;
    return c;
  }

  function persist() { try { if (typeof saveHubContent === 'function') saveHubContent(); } catch (e) {} }
  function toast(msg) { try { if (typeof showToast === 'function') showToast(msg); } catch (e) {} }

  function blankWeekplan() {
    try { if (typeof _weekplanBlank === 'function') return _weekplanBlank(); } catch (e) {}
    try { if (window._weekplanBlank) return window._weekplanBlank(); } catch (e) {}
    return { week: '', days: {} };
  }

  function subjectNameForNewTest(name) {
    var raw = String(name || 'Subject');
    var clean = raw.replace(/\s*(?:\b(?:CA|FTE|SA|YT|MID|FINAL)\s*\d*\s*)(?:\d+\s*)?$/i, '').trim();
    return clean || raw;
  }

  function seedSubjects() {
    var h = hc(), arr = (h && Array.isArray(h.study)) ? h.study : [];
    return arr.map(function (s) {
      return { id: s.id || uid(), name: subjectNameForNewTest(s.name), color: s.color || '', collapsed: false, chapters: [] };
    });
  }

  function freshSet() {
    return { study: seedSubjects(), weekplan: blankWeekplan(), grades: {}, exams: [] };
  }

  function snapshot(c) {
    var h = hc(); if (!h) return;
    c.vault[c.active] = {
      study: clone(h.study) || [],
      weekplan: clone(h.weekplan) || blankWeekplan(),
      grades: clone(h.grades) || {},
      exams: clone(h.exams) || []
    };
  }

  function activate(id) {
    var c = cfg(); if (!c) return;
    var target = find(c, id); if (!target) return;
    if (id === c.active) { closePanel(); return; }
    var h = hc(); if (!h) return;
    snapshot(c);
    var set = c.vault[id] || freshSet();
    FIELDS.forEach(function (f) { h[f] = clone(set[f]); });
    c.active = id;
    delete c.vault[id];
    persist();
    closePanel();
    toast('Switched to ' + target.name + ' — your other tests are saved');
    try { if (typeof renderHubBento === 'function') renderHubBento(); } catch (e) {}
  }

  function typeMap() {
    var h = hc(), m = {};
    if (!h || !Array.isArray(h.bentoLayout)) return m;
    h.bentoLayout.forEach(function (it) { if (it && it.uid) m[String(it.uid)] = it.t; });
    return m;
  }

  function inject() {
    var grid = document.querySelector('.bento-grid');
    if (!grid) return;
    var c = cfg(); if (!c) return;
    var label = activeName(c), map = typeMap(), isOpen = !!document.getElementById(PANEL_ID);
    Array.prototype.forEach.call(grid.querySelectorAll('.bento-bubble[data-bubble]'), function (b) {
      var t = map[b.getAttribute('data-bubble')];
      if (TYPES.indexOf(t) === -1) return;
      b.classList.add('curr-widget');
      if (t === 'weekplan') b.classList.add('curr-weekplan');
      var head = b.querySelector('.w-head');
      if (!head) return;
      var btn = head.querySelector('.curr-btn');
      if (!btn) {
        btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'curr-btn';
        btn.setAttribute('data-curr-open', '1');
        btn.addEventListener('mousedown', function (e) { e.stopPropagation(); });
        btn.addEventListener('click', function (e) { e.preventDefault(); e.stopPropagation(); openPanel(btn); });
        head.appendChild(btn);
      }
      btn.innerHTML = BOOK + '<span class="curr-btn-name">' + esc(label) + '</span>' + CHEV;
      btn.title = 'Curriculum — active: ' + label + '. Click to switch assessment.';
      btn.setAttribute('aria-label', btn.title);
      btn.classList.toggle('curr-on', isOpen);
    });
  }

  function injectStyles() {
    if (document.getElementById(STYLE_ID)) return;
    var s = document.createElement('style');
    s.id = STYLE_ID;
    s.textContent = CSS;
    document.head.appendChild(s);
  }

  function closePanel() {
    var p = document.getElementById(PANEL_ID);
    if (p) p.remove();
    panelAnchor = null;
    Array.prototype.forEach.call(document.querySelectorAll('.curr-btn.curr-on'), function (b) { b.classList.remove('curr-on'); });
  }

  function renderPanel(c) {
    var rows = c.list.map(function (x) {
      var active = x.id === c.active;
      return '<div class="curr-row' + (active ? ' is-active' : '') + '">' +
        '<button type="button" class="curr-pick" data-curr-pick="' + esc(x.id) + '">' +
          '<span class="curr-pick-name">' + esc(x.name) + '</span>' +
          (x.date ? '<span class="curr-pick-date">' + esc(x.date) + '</span>' : '') +
        '</button>' +
        (active ? '<span class="curr-active-dot" title="Active">' + CHECK + '</span>' : '') +
        '<button type="button" class="curr-mini" data-curr-edit="' + esc(x.id) + '" title="Rename / set date">' + PENCIL + '</button>' +
        (c.list.length > 1 && !active ? '<button type="button" class="curr-mini curr-del" data-curr-del="' + esc(x.id) + '" title="Delete this assessment and its data">' + X + '</button>' : '') +
      '</div>' +
      '<div class="curr-editform" data-curr-editform="' + esc(x.id) + '" hidden>' +
        '<input class="curr-in" data-curr-name value="' + esc(x.name) + '" placeholder="Name">' +
        '<input class="curr-in curr-in-date" data-curr-date value="' + esc(x.date || '') + '" placeholder="Date (optional)">' +
        '<button type="button" class="curr-save" data-curr-save="' + esc(x.id) + '">Save</button>' +
      '</div>';
    }).join('');
    return '<div class="curr-head"><div><div class="curr-title">Curriculum</div><div class="curr-sub">One test for Study, Study Plan, Grades &amp; Exams</div></div>' +
        '<button type="button" class="curr-x" data-curr-close title="Close">' + X + '</button></div>' +
      '<div class="curr-list">' + rows + '</div>' +
      '<button type="button" class="curr-add" data-curr-add>+ Add assessment</button>' +
      '<div class="curr-addform" data-curr-addform hidden>' +
        '<input class="curr-in" data-curr-newname placeholder="e.g. CA3 or FTE 2">' +
        '<input class="curr-in curr-in-date" data-curr-newdate placeholder="Date (optional)">' +
        '<button type="button" class="curr-save" data-curr-newsave>Add</button>' +
      '</div>' +
      '<div class="curr-foot">Switching saves the current test and opens another one. Nothing is deleted.</div>';
  }

  function position(p, anchor) {
    var r = anchor.getBoundingClientRect();
    var w = p.offsetWidth || 264, h = p.offsetHeight || 320;
    var left = Math.min(Math.max(8, r.right - w), Math.max(8, window.innerWidth - w - 8));
    var top = r.bottom + 8;
    if (top + h > window.innerHeight - 8) top = Math.max(8, r.top - h - 8);
    p.style.left = left + 'px';
    p.style.top = top + 'px';
  }

  function refreshPanel(p) {
    var c = cfg(); if (!c) return;
    p.innerHTML = renderPanel(c);
    inject();
  }

  function saveEdit(p, id) {
    var c = cfg(), x = find(c, id), f = p.querySelector('[data-curr-editform="' + id + '"]');
    if (!x || !f) return;
    var n = f.querySelector('[data-curr-name]'), d = f.querySelector('[data-curr-date]');
    var name = (n && n.value || '').trim(), date = (d && d.value || '').trim();
    if (name) x.name = name.slice(0, 40);
    x.date = date.slice(0, 40);
    persist();
    refreshPanel(p);
  }

  function addAssessment(p) {
    var c = cfg(), af = p.querySelector('[data-curr-addform]');
    if (!c || !af) return;
    var n = af.querySelector('[data-curr-newname]'), d = af.querySelector('[data-curr-newdate]');
    var name = (n && n.value || '').trim(), date = (d && d.value || '').trim();
    if (!name) { if (n) n.focus(); return; }
    c.list.push({ id: uid(), name: name.slice(0, 40), date: date.slice(0, 40) });
    persist();
    refreshPanel(p);
  }

  function deleteAssessment(p, id) {
    var c = cfg(), x = find(c, id);
    if (!x || c.list.length < 2 || id === c.active) return;
    var hasData = !!c.vault[id];
    if (!window.confirm('Delete "' + x.name + '"' + (hasData ? ' and all of its Study, Grades, Exams and Study Plan data' : '') + '? This cannot be undone.')) return;
    c.list = c.list.filter(function (z) { return z.id !== id; });
    delete c.vault[id];
    persist();
    refreshPanel(p);
  }

  function bind(p) {
    p.addEventListener('mousedown', function (e) { e.stopPropagation(); });
    p.addEventListener('click', function (e) {
      e.stopPropagation();
      var el = e.target, node;
      if ((node = el.closest('[data-curr-pick]'))) { activate(node.getAttribute('data-curr-pick')); return; }
      if (el.closest('[data-curr-close]')) { closePanel(); return; }
      if ((node = el.closest('[data-curr-edit]'))) {
        var id = node.getAttribute('data-curr-edit');
        var f = p.querySelector('[data-curr-editform="' + id + '"]');
        if (f) { f.hidden = !f.hidden; if (!f.hidden) { var i = f.querySelector('[data-curr-name]'); if (i) i.focus(); } }
        return;
      }
      if ((node = el.closest('[data-curr-save]'))) { saveEdit(p, node.getAttribute('data-curr-save')); return; }
      if ((node = el.closest('[data-curr-del]'))) { deleteAssessment(p, node.getAttribute('data-curr-del')); return; }
      if (el.closest('[data-curr-add]')) {
        var af = p.querySelector('[data-curr-addform]');
        if (af) { af.hidden = !af.hidden; if (!af.hidden) { var nn = af.querySelector('[data-curr-newname]'); if (nn) nn.focus(); } }
        return;
      }
      if (el.closest('[data-curr-newsave]')) { addAssessment(p); return; }
    });
    p.addEventListener('keydown', function (e) {
      e.stopPropagation();
      if (e.key !== 'Enter' || !e.target || !e.target.matches) return;
      if (e.target.matches('[data-curr-newname],[data-curr-newdate]')) { addAssessment(p); return; }
      if (e.target.matches('[data-curr-name],[data-curr-date]')) {
        var f = e.target.closest('[data-curr-editform]');
        if (f) saveEdit(p, f.getAttribute('data-curr-editform'));
      }
    });
  }

  function openPanel(anchor) {
    var existing = document.getElementById(PANEL_ID);
    if (existing) {
      var same = panelAnchor === anchor;
      closePanel();
      if (same) return;
    }
    var c = cfg(); if (!c) return;
    var p = document.createElement('div');
    p.id = PANEL_ID;
    p.className = 'curr-panel';
    p.innerHTML = renderPanel(c);
    document.body.appendChild(p);
    panelAnchor = anchor;
    anchor.classList.add('curr-on');
    position(p, anchor);
    bind(p);
  }

  function wrapRender() {
    if (typeof window.renderHubBento !== 'function' || window.renderHubBento.__currWrapped) return;
    var orig = window.renderHubBento;
    var wrapped = function () {
      var r = orig.apply(this, arguments);
      try {
        if (panelAnchor && !document.body.contains(panelAnchor)) closePanel();
        inject();
      } catch (e) {}
      return r;
    };
    wrapped.__currWrapped = true;
    window.renderHubBento = wrapped;
  }

  function watch() {
    var grid = document.querySelector('.bento-grid');
    if (!grid || grid.__currWatched) return;
    grid.__currWatched = true;
    var timer = null;
    var obs = new MutationObserver(function () {
      if (timer) clearTimeout(timer);
      timer = setTimeout(function () { try { inject(); } catch (e) {} }, 30);
    });
    obs.observe(grid, { childList: true });
  }

  function boot() {
    injectStyles();
    wrapRender();
    watch();
    inject();
    [250, 900, 2000].forEach(function (ms) { setTimeout(function () { try { wrapRender(); watch(); inject(); } catch (e) {} }, ms); });
  }

  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    if (!document.getElementById(PANEL_ID)) return;
    e.preventDefault();
    e.stopPropagation();
    closePanel();
  }, true);

  document.addEventListener('click', function (e) {
    if (!document.getElementById(PANEL_ID)) return;
    if (e.target.closest && e.target.closest('#' + PANEL_ID)) return;
    if (e.target.closest && e.target.closest('.curr-btn')) return;
    closePanel();
  }, true);

  window.HubCurriculum = {
    state: function () { var c = cfg(); return c ? clone(c) : null; },
    active: function () { var c = cfg(); return c ? c.active : null; },
    activate: activate,
    inject: inject,
    close: closePanel
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
