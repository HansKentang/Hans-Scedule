/* ChickBot's hands on the Hub canvas. Loaded ONLY on index.html, after
   hub-visuals.js, so it can use that file's globals directly. */

(function () {
  'use strict';

  var TYPES = [
    'goals','priorities','todos','today','upcoming','habits','streak','focuslog','progress','assistant',
    'homework','study','weekplan','grades','attendance','exams','flashcards',
    'sleep-score','sleepdebt','airquality','breathing','strava',
    'budget','savings','currency','money',
    'clock','worldclock','weather','calendar','prayertime','bmkgquake','timer','alarm','pomodoro','countdown','calculator',
    'spotify','flightradar','images','headlines','watchlist','musicviz',
    'quote','notes','links','reading',
    'friends-live','birthdays','github',
    'pet','garden','xp','badges','doodle'
  ];

  var BACKUP_KEY = 'haven-ai-hub-backup';

  function ready() {
    return typeof hubContent !== 'undefined' && !!hubContent;
  }
  function layout() {
    return normalizeBentoLayout(hubContent.bentoLayout, hubContent);
  }
  function tile(type) {
    var list = layout();
    for (var i = 0; i < list.length; i++) if (list[i].t === type) return list[i];
    return null;
  }
  function commitLayout(list) {
    hubContent.bentoLayout = list;
    saveHubContent();
    renderHubBento();
  }
  function ok(msg) { return { ok: true, message: msg }; }
  function no(msg) { return { ok: false, message: msg }; }
  function str(v) { return v == null ? '' : String(v); }
  function trim(s) { return str(s).trim(); }

  /* Content fields the AI may edit. Each entry knows how to add, read,
     tick and clear one item, so the same code serves every action. */
  function field(widget) {
    if (!ready()) return null;
    var hc = hubContent;
    if (widget === 'todos') return {
      list: function () { return hc.todos || (hc.todos = []); },
      make: function (d) { return { text: trim(d.text || d.title || d.name), done: false }; },
      text: function (it) { return str(it.text); },
      done: function (it, v) { it.done = !!v; },
      update: function (it, d) {
        if (d.text != null || d.title != null) it.text = trim(d.text != null ? d.text : d.title);
        if (d.done != null) it.done = !!d.done;
        return '';
      }
    };
    if (widget === 'today') return {
      list: function () { return _todayTodosItems(); },
      make: function (d) { return { text: trim(d.text || d.title || d.name), done: false }; },
      text: function (it) { return str(it.text); },
      done: function (it, v) { it.done = !!v; },
      update: function (it, d) {
        if (d.text != null || d.title != null) it.text = trim(d.text != null ? d.text : d.title);
        if (d.done != null) it.done = !!d.done;
        return '';
      }
    };
    if (widget === 'goals' || widget === 'priorities' || widget === 'habits') return {
      list: function () { return hc[widget] || (hc[widget] = []); },
      make: function (d) { return trim(d.text || d.title || d.name); },
      text: function (it) { return str(it); },
      done: null
    };
    if (widget === 'notes') return {
      list: function () { return _notesData(); },
      make: function (d) {
        return {
          id: _notesNewId(), title: trim(d.title || d.text || d.name), body: trim(d.body),
          color: '', pinned: false, created: Date.now(), updated: Date.now()
        };
      },
      text: function (it) { return str(it.title); },
      done: null,
      update: function (it, d) {
        if (d.title != null || d.text != null) it.title = trim(d.title != null ? d.title : d.text);
        if (d.body != null) it.body = str(d.body).slice(0, 5000);
        if (d.pinned != null) it.pinned = !!d.pinned;
        it.updated = Date.now();
        return '';
      }
    };
    if (widget === 'links') return {
      list: function () { return hc.links || (hc.links = []); },
      make: function (d) { return { label: trim(d.label || d.title || d.name), url: trim(d.url) }; },
      text: function (it) { return str(it.label); },
      done: null,
      update: function (it, d) {
        if (d.label != null || d.text != null) it.label = trim(d.label != null ? d.label : d.text);
        if (d.url != null) {
          var u = trim(d.url);
          if (!/^https?:\/\//i.test(u)) return 'Links need a real http:// or https:// URL.';
          it.url = u;
        }
        return '';
      }
    };
    if (widget === 'reading') return {
      list: function () { return hc.reading || (hc.reading = []); },
      make: function (d) { return { title: trim(d.title || d.text || d.name), author: trim(d.author), done: false }; },
      text: function (it) { return str(it.title); },
      done: function (it, v) { it.done = !!v; },
      update: function (it, d) {
        if (d.title != null || d.text != null) it.title = trim(d.title != null ? d.title : d.text);
        if (d.author != null) it.author = trim(d.author);
        if (d.done != null) it.done = !!d.done;
        return '';
      }
    };
    if (widget === 'homework') return {
      list: function () { return hc.homework || (hc.homework = []); },
      make: function (d) {
        return {
          text: trim(d.text || d.title || d.name), subject: trim(d.subject),
          due: trim(d.due), priority: trim(d.priority) || 'medium', done: false
        };
      },
      text: function (it) { return str(it.text); },
      done: function (it, v) { it.done = !!v; },
      update: function (it, d) {
        if (d.text != null || d.title != null) it.text = trim(d.text != null ? d.text : d.title);
        if (d.subject != null) it.subject = trim(d.subject);
        if (d.due != null) it.due = trim(d.due);
        if (d.priority != null) it.priority = trim(d.priority) || 'medium';
        if (d.done != null) it.done = !!d.done;
        return '';
      }
    };
    if (widget === 'countdown') return {
      list: function () { return hc.countdown || (hc.countdown = []); },
      make: function (d) { return { label: trim(d.label || d.title || d.name), date: trim(d.date) }; },
      text: function (it) { return str(it.label); },
      done: null,
      update: function (it, d) {
        if (d.label != null || d.text != null) it.label = trim(d.label != null ? d.label : d.text);
        if (d.date != null) {
          var dt = trim(d.date);
          if (!/^\d{4}-\d{2}-\d{2}$/.test(dt)) return 'Countdown dates must be YYYY-MM-DD.';
          it.date = dt;
        }
        return '';
      }
    };
    return null;
  }

  function findExact(f, match) {
    var list = f.list(), hits = [];
    if (typeof match !== 'string' || !match.trim()) return { list: list, hits: hits };
    var want = match.trim();
    for (var i = 0; i < list.length; i++) if (f.text(list[i]).trim() === want) hits.push(i);
    return { list: list, hits: hits };
  }

  /* Resolve a subject name strictly. Never guess: exactly one match or refuse. */
  function findSubject(name) {
    var subs = _ensureStudy();
    var want = trim(name).toLowerCase();
    if (!want) return { subs: subs, match: null, reason: 'No subject name given.' };
    var exact = [], partial = [];
    for (var i = 0; i < subs.length; i++) {
      var n = str(subs[i].name), low = n.trim().toLowerCase();
      if (low === want) exact.push(i);
      else if (low.indexOf(want) !== -1 || want.indexOf(low) !== -1) partial.push(i);
    }
    var use = exact.length ? exact : partial;
    if (use.length === 1) return { subs: subs, match: subs[use[0]], reason: '' };
    var names = subs.map(function (s) { return '"' + str(s.name) + '"'; }).join(', ');
    if (!use.length) return { subs: subs, match: null, reason: 'No subject matches "' + trim(name) + '". Your subjects: ' + names + '.' };
    return { subs: subs, match: null, reason: '"' + trim(name) + '" is ambiguous. Your subjects: ' + names + '.' };
  }

  function applySyllabus(d) {
    if (!ready()) return no('Hub data is not ready yet.');
    var r = findSubject(d.subject);
    if (!r.match) return no(r.reason);
    var subj = r.match;
    var chapters = Array.isArray(d.chapters) ? d.chapters : [];
    if (!chapters.length) return no('No chapters were provided.');
    if (chapters.length > 40) return no('Too many chapters in one go (limit 40).');
    if (!Array.isArray(subj.chapters)) subj.chapters = [];

    var seen = {};
    subj.chapters.forEach(function (c) { seen[str(c.name).trim().toLowerCase()] = 1; });

    var addedCh = 0, addedItems = 0, skipped = 0;
    for (var i = 0; i < chapters.length; i++) {
      var name = trim(chapters[i] && chapters[i].name);
      if (!name) continue;
      var key = name.toLowerCase();
      if (seen[key]) { skipped++; continue; }
      var items = Array.isArray(chapters[i].items) ? chapters[i].items : [];
      if (items.length > 200) return no('Too many subtopics in "' + name + '" (limit 200).');
      var leaf = [];
      for (var j = 0; j < items.length; j++) {
        var t = trim(items[j]);
        if (t) leaf.push({ id: _studyUid('si'), text: t, done: false });
      }
      subj.chapters.push({ id: _studyUid('ch'), name: name, collapsed: false, items: leaf });
      seen[key] = 1;
      addedCh++; addedItems += leaf.length;
    }
    if (!addedCh) return no('Nothing added — all ' + skipped + ' chapters already exist in "' + str(subj.name) + '".');
    subj.collapsed = false;
    saveHubContent();
    renderHubBento();
    return ok('Added ' + addedCh + ' chapter' + (addedCh === 1 ? '' : 's') + ' / ' + addedItems +
      ' subtopic' + (addedItems === 1 ? '' : 's') + ' to "' + str(subj.name) + '"' +
      (skipped ? ' (' + skipped + ' already existed and were skipped)' : '') + '.');
  }

  function apply(action) {
    if (!ready()) return no('Hub canvas is not ready yet.');
    var d = action && action.data ? action.data : {};
    var type = action && action.type;

    if (type === 'addStudySyllabus') return applySyllabus(d);

    /* ---- arrange ---- */
    if (type === 'addWidget') {
      var wt = trim(d.type || d.widget);
      if (TYPES.indexOf(wt) === -1) return no('"' + wt + '" is not a valid widget type.');
      if (tile(wt) && wt !== 'images' && wt !== 'text') return no('A ' + wt + ' widget is already on the canvas.');
      if (typeof _hubCanAddWidget === 'function' && !_hubCanAddWidget(1))
        return no('The free plan allows 8 widgets per canvas. Remove one first.');
      var before = layout().length;
      var pos = null;
      if (typeof d.x === 'number' && typeof d.y === 'number') pos = { x: d.x, y: d.y };
      addBubbleTypes([wt], pos);
      return layout().length > before ? ok('Added a ' + wt + ' widget.') : no('Could not add the ' + wt + ' widget.');
    }
    if (type === 'moveWidget' || type === 'resizeWidget' || type === 'removeWidget') {
      var mt = trim(d.type || d.widget);
      var list = layout(), found = null;
      for (var i = 0; i < list.length; i++) if (list[i].t === mt) { found = list[i]; break; }
      if (!found) return no('No ' + mt + ' widget on the canvas.');
      pushUndoState();
      if (type === 'removeWidget') {
        list = list.filter(function (x) { return x !== found; });
        commitLayout(list);
        return ok('Removed the ' + mt + ' tile. Its saved data is kept.');
      }
      if (type === 'moveWidget') {
        if (typeof d.x !== 'number' || typeof d.y !== 'number') return no('Missing x/y position.');
        found.x = snap(Math.max(0, d.x)); found.y = snap(Math.max(0, d.y));
      } else {
        if (typeof d.w !== 'number' || typeof d.h !== 'number') return no('Missing w/h size.');
        found.w = snap(Math.max(160, d.w)); found.h = snap(Math.max(100, d.h));
      }
      resolveBubbleCollisions(list);
      commitLayout(list);
      return ok(type === 'moveWidget' ? 'Moved ' + mt + '.' : 'Resized ' + mt + '.');
    }
    if (type === 'changeWidgetStyle') {
      var st = trim(d.type || d.widget), reg = WIDGET_STYLES[st];
      if (!reg) return no('The ' + st + ' widget has no changeable designs.');
      var want = trim(d.style);
      if (reg.list.indexOf(want) === -1) return no('"' + want + '" is not a design for ' + st + '.');
      var t = tile(st);
      if (!t) return no('No ' + st + ' widget on the canvas.');
      reg.set(t.uid, want);
      renderHubBento();
      return ok('Changed ' + st + ' design to "' + want + '".');
    }
    if (type === 'setHubSkin') {
      var skin = trim(d.skin || d.id);
      var valid = HUB_SKINS.some(function (s) { return s.id === skin; });
      if (!valid) return no('"' + skin + '" is not a canvas style.');
      applyHubSkin(skin);
      return ok('Changed canvas style to "' + skin + '".');
    }
    if (type === 'clearCanvas') {
      pushUndoState();
      commitLayout([]);
      return ok('Removed every widget tile. All saved data is kept.');
    }

    /* ---- content ---- */
    var widget = trim(d.widget || d.type);
    if (type === 'setWidgetSetting') {
      var f = trim(d.field), v = d.value;
      var pairs = {
        'budget.monthly': function () {
          if (!hubContent.budget) hubContent.budget = { monthly: 0 };
          hubContent.budget.monthly = Math.max(0, parseFloat(v) || 0);
        },
        'savings.name': function () { if (!hubContent.savings) hubContent.savings = {}; hubContent.savings.name = str(v).slice(0, 40); },
        'savings.target': function () { if (!hubContent.savings) hubContent.savings = {}; hubContent.savings.target = Math.max(0, parseFloat(v) || 0); },
        'savings.saved': function () { if (!hubContent.savings) hubContent.savings = {}; hubContent.savings.saved = Math.max(0, parseFloat(v) || 0); },
        'currency.from': function () { if (!hubContent.currency) hubContent.currency = { from: 'USD', to: 'EUR', amount: 1 }; hubContent.currency.from = str(v).slice(0, 6); },
        'currency.to': function () { if (!hubContent.currency) hubContent.currency = { from: 'USD', to: 'EUR', amount: 1 }; hubContent.currency.to = str(v).slice(0, 6); },
        'currency.amount': function () { if (!hubContent.currency) hubContent.currency = { from: 'USD', to: 'EUR', amount: 1 }; hubContent.currency.amount = Math.max(0, parseFloat(v) || 0); },
        'github.username': function () { if (!hubContent.github) hubContent.github = {}; hubContent.github.username = str(v).trim().slice(0, 39); },
        'pomodoro.sessionMinutes': function () { if (!hubContent.focusCfg) hubContent.focusCfg = {}; hubContent.focusCfg.sessionMinutes = Math.min(240, Math.max(1, parseFloat(v) || 25)); },
        'upcoming.days': function () { if (!hubContent.upcoming) hubContent.upcoming = {}; hubContent.upcoming.days = Math.min(60, Math.max(1, parseInt(v, 10) || 14)); }
      };
      var fn = pairs[widget + '.' + f] || (f.indexOf('.') !== -1 ? pairs[f] : null);
      if (!fn) return no('"' + widget + '.' + f + '" is not an allowed setting.');
      fn();
      saveHubContent();
      renderHubBento();
      return ok('Set ' + widget + '.' + f + ' to ' + str(v) + '.');
    }

    if (widget === 'study' && type === 'addWidgetItem') {
      var sname = trim(d.name || d.text || d.title);
      if (!sname) return no('A subject name is required.');
      var subs = _ensureStudy();
      subs.push({ id: _studyUid('sj'), name: sname, color: '', collapsed: false, chapters: [] });
      saveHubContent(); renderHubBento();
      return ok('Added subject "' + sname + '".');
    }

    var F = field(widget);
    if (!F) return no('The ' + widget + ' widget has no editable items.');

    if (type === 'addWidgetItem') {
      var item = F.make(d);
      if (!F.text(item).trim()) return no('The new item needs text.');
      F.list().push(item);
      saveHubContent(); renderHubBento();
      return ok('Added "' + F.text(item) + '" to ' + widget + '.');
    }
    if (type === 'clearWidgetContent') {
      F.list().length = 0;
      saveHubContent(); renderHubBento();
      return ok('Cleared all items in ' + widget + '.');
    }
    if (type === 'updateWidgetItem' || type === 'completeWidgetItem' || type === 'removeWidgetItem') {
      var r = findExact(F, d.match);
      if (!r.hits.length) return no('No item exactly matches "' + trim(d.match) + '" in ' + widget + '.');
      if (r.hits.length > 1) return no('More than one item matches "' + trim(d.match) + '". Use the exact text.');
      var idx = r.hits[0];
      if (type === 'removeWidgetItem') {
        var label = F.text(r.list[idx]);
        r.list.splice(idx, 1);
        saveHubContent(); renderHubBento();
        return ok('Removed "' + label + '" from ' + widget + '.');
      }
      if (type === 'completeWidgetItem') {
        if (!F.done) return no('Items in ' + widget + ' cannot be ticked off.');
        F.done(r.list[idx], d.done === undefined ? true : !!d.done);
        saveHubContent(); renderHubBento();
        return ok('Ticked off "' + F.text(r.list[idx]) + '" in ' + widget + '.');
      }
      var old = F.text(r.list[idx]);
      if (F.update) {
        var err = F.update(r.list[idx], d);
        if (err) return no(err);
      } else {
        var nt = trim(d.text || d.title || d.label || d.name);
        if (!nt) return no('A replacement text is required.');
        if (typeof r.list[idx] === 'string') r.list[idx] = nt;
        else if ('text' in r.list[idx]) r.list[idx].text = nt;
        else if ('title' in r.list[idx]) r.list[idx].title = nt;
        else if ('label' in r.list[idx]) r.list[idx].label = nt;
        else return no('Items in ' + widget + ' cannot be edited.');
      }
      saveHubContent(); renderHubBento();
      return ok('Updated "' + old + '" in ' + widget + '.');
    }

    return no('"' + str(type) + '" is not supported by the Hub canvas.');
  }

  function context() {
    if (!ready()) return 'Hub canvas data is not ready.';
    var list = layout();
    var lines = [];
    lines.push('WIDGET TILES (' + list.length + '):');
    if (!list.length) lines.push('  (canvas is empty)');
    list.forEach(function (b) {
      var reg = WIDGET_STYLES[b.t];
      var style = reg ? ' design=' + reg.get(b.uid) : '';
      lines.push('  - ' + b.t + ' @ ' + (b.x || 0) + ',' + (b.y || 0) + ' size ' + (b.w || 0) + 'x' + (b.h || 0) + style);
    });
    lines.push('CANVAS STYLE: ' + _readHubSkin());
    lines.push('WIDGETS HOLDING YOUR DATA (never clear these on a vague request):');
    var holders = [];
    [['todos', hubContent.todos], ['goals', hubContent.goals], ['priorities', hubContent.priorities],
     ['habits', hubContent.habits], ['notes', hubContent.notesList], ['links', hubContent.links],
     ['reading', hubContent.reading], ['homework', hubContent.homework], ['countdown', hubContent.countdown],
     ['study', hubContent.study]].forEach(function (p) {
      if (Array.isArray(p[1]) && p[1].length) holders.push('  - ' + p[0] + ': ' + p[1].length + ' item' + (p[1].length === 1 ? '' : 's'));
    });
    lines.push.apply(lines, holders.length ? holders : ['  (none yet)']);
    var subs = _ensureStudy();
    lines.push('STUDY SUBJECTS (exact names — use one verbatim for addStudySyllabus.subject):');
    if (!subs.length) lines.push('  (no subjects yet)');
    subs.forEach(function (s) {
      var n = 0; (s.chapters || []).forEach(function (c) { n += (c.items || []).length; });
      lines.push('  - "' + str(s.name) + '": ' + (s.chapters || []).length + ' chapters / ' + n + ' subtopics');
    });
    return lines.join('\n');
  }

  /* Raw localStorage (bypassing the prefix/cloud shims) keeps the undo
     snapshot on this device only — it must never bloat the synced blob. */
  function rawGet(k) {
    try { if (typeof __origLS !== 'undefined' && __origLS.getItem) return __origLS.getItem(k); } catch (e) {}
    try { return localStorage.getItem(k); } catch (e) { return null; }
  }
  function rawSet(k, v) {
    try { if (typeof __origLS !== 'undefined' && __origLS.setItem) { __origLS.setItem(k, v); return true; } } catch (e) {}
    try { localStorage.setItem(k, v); return true; } catch (e) { return false; }
  }
  function backup() {
    if (!ready()) return false;
    try {
      var snap = { hub: JSON.parse(JSON.stringify(hubContent)), skin: _readHubSkin() };
      return rawSet(BACKUP_KEY, JSON.stringify(snap));
    } catch (e) { return false; }
  }
  function hasBackup() {
    try { return !!rawGet(BACKUP_KEY); } catch (e) { return false; }
  }
  function restore() {
    try {
      var raw = rawGet(BACKUP_KEY);
      if (!raw) return { ok: false, message: 'No backup found.' };
      var snap = JSON.parse(raw);
      if (!snap || !snap.hub) return { ok: false, message: 'Backup is unreadable.' };
      hubContent = snap.hub;
      saveHubContent();
      if (snap.skin) applyHubSkin(snap.skin, true);
      renderHubBento();
      return { ok: true, message: 'Hub canvas restored.' };
    } catch (e) { return { ok: false, message: 'Could not restore the backup.' }; }
  }

  window.HubAI = {
    available: ready,
    catalogString: function () { return TYPES.join(', '); },
    styleOptions: function (type) { var r = WIDGET_STYLES[type]; return r ? r.list.slice() : []; },
    skinOptions: function () { return HUB_SKINS.map(function (s) { return s.id; }); },
    context: context,
    apply: apply,
    backup: backup,
    hasBackup: hasBackup,
    restore: restore,
    subjectNames: function () { return ready() ? _ensureStudy().map(function (s) { return str(s.name); }) : []; },
    resolveSubject: function (name) {
      if (!ready()) return { name: '', reason: 'Hub data is not ready yet.' };
      var r = findSubject(name);
      return r.match ? { name: str(r.match.name), reason: '' } : { name: '', reason: r.reason };
    }
  };
})();
