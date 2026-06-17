/* ============================================
   Havën Schedule — Activities Page
   Chronological task list + Kanban board (merged Tags)
   ============================================ */

// ─── DOM REFS ──────────────────────────────────────────────
const activitiesList = document.getElementById('activitiesList');
const actTagFilter = document.getElementById('actTagFilter');
const actDateFilter = document.getElementById('actDateFilter');
const boardInner = document.getElementById('tagsBoardInner');
const tagsSummaryTotal = document.getElementById('tagsSummaryTotal');
const activitiesView = document.getElementById('activitiesView');
const boardView = document.getElementById('boardView');
const actSearch = document.getElementById('actSearch');
const actSearchClear = document.getElementById('actSearchClear');
const actInsights = document.getElementById('actInsights');

let currentView = 'timeline';
let searchDebounceTimer = null;
let _lastSearchQuery = '';

// ─── BATCH MODE ─────────────────────────────────────────────────
let batchMode = false;
let batchSelected = new Set();

// ─── UNDO ───────────────────────────────────────────────────────
let _undoTimer = null;

// ─── DAY COLLAPSE STATE ────────────────────────────────────────
let collapsedDays = new Set();

// ─── DAY JOURNAL STORAGE ───────────────────────────────────────
const DAY_JOURNAL_KEY = 'haven-activities-journal';
function loadDayJournals() {
  try { return JSON.parse(localStorage.getItem(DAY_JOURNAL_KEY)) || {}; }
  catch(e) { return {}; }
}
function saveDayJournals(j) {
  try { localStorage.setItem(DAY_JOURNAL_KEY, JSON.stringify(j)); }
  catch(e) {}
}

// ─── UNDO TOAST ─────────────────────────────────────────────────
function showUndoToast(msg, onUndo) {
  const el = document.getElementById('actUndoToast');
  const msgEl = document.getElementById('actUndoMsg');
  const btn = document.getElementById('actUndoBtn');
  if (!el || !msgEl || !btn) return;
  if (_undoTimer) clearTimeout(_undoTimer);
  msgEl.textContent = msg;
  el.classList.remove('hidden');
  const handler = () => {
    if (typeof onUndo === 'function') onUndo();
    el.classList.add('hidden');
    btn.removeEventListener('click', handler);
  };
  btn.addEventListener('click', handler, { once: true });
  _undoTimer = setTimeout(() => { el.classList.add('hidden'); }, 5000);
}

// ─── BATCH MODE ─────────────────────────────────────────────────
function enterBatchMode() {
  batchMode = true;
  batchSelected.clear();
  document.body.classList.add('act-batch-mode');
  document.getElementById('actBatchBar')?.classList.remove('hidden');
  updateBatchCount();
  renderActivities();
}
function exitBatchMode() {
  batchMode = false;
  batchSelected.clear();
  document.body.classList.remove('act-batch-mode');
  document.getElementById('actBatchBar')?.classList.add('hidden');
  renderActivities();
}
function toggleBatchSelect(id) {
  if (batchSelected.has(id)) batchSelected.delete(id);
  else batchSelected.add(id);
  updateBatchCount();
  const cards = document.querySelectorAll(`.act-card[data-task-id="${id}"]`);
  cards.forEach(c => {
    const chk = c.querySelector('.act-bchk');
    if (chk) chk.classList.toggle('sel', batchSelected.has(id));
  });
}
function updateBatchCount() {
  const el = document.getElementById('actBatchCount');
  if (el) el.textContent = `${batchSelected.size} selected`;
}
function batchComplete() {
  const ids = [...batchSelected];
  if (ids.length === 0) return;
  const prev = JSON.parse(JSON.stringify(state.tasks));
  ids.forEach(id => { const t = getTask(id); if (t && !t.completed) toggleComplete(id); });
  exitBatchMode();
  showUndoToast(`Completed ${ids.length} task${ids.length > 1 ? 's' : ''}`, () => {
    state.tasks = prev;
    saveState();
    renderCurrentView();
  });
}
function batchDelete() {
  const ids = [...batchSelected];
  if (ids.length === 0) return;
  const prev = JSON.parse(JSON.stringify(state.tasks));
  ids.forEach(id => deleteTask(id));
  exitBatchMode();
  showUndoToast(`Deleted ${ids.length} task${ids.length > 1 ? 's' : ''}`, () => {
    state.tasks = prev;
    saveState();
    renderCurrentView();
  });
}

// ─── CONFETTI POOL ─────────────────────────────────────────
const CONFETTI_COLORS = ['#6366f1','#3b82f6','#ef4444','#10b981','#f59e0b','#b4ccbc','#dfc1a6','#a5b4fc','#fca5a5','#6ee7b7','#fcd34d'];
function fireConfetti(originX, originY) {
  const container = document.createElement('div');
  container.className = 'act-confetti-container';
  document.body.appendChild(container);
  for (let i = 0; i < 50; i++) {
    const piece = document.createElement('div');
    piece.className = 'confetti-piece';
    const color = CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)];
    const size = 4 + Math.random() * 6;
    const x = (originX || window.innerWidth / 2) + (Math.random() - 0.5) * 200;
    const dur = 1.5 + Math.random() * 1.5;
    const delay = Math.random() * 0.3;
    const shapes = ['50%','2px','0'];
    piece.style.cssText = `
      left:${x}px;top:${originY || window.innerHeight * 0.6}px;
      width:${size}px;height:${size * (0.4 + Math.random() * 0.8)}px;
      background:${color};border-radius:${shapes[Math.floor(Math.random() * 3)]};
      --cf-dur:${dur}s;animation-delay:${delay}s;
      transform:rotate(${Math.random() * 360}deg);
    `;
    container.appendChild(piece);
  }
  setTimeout(() => container.remove(), 3500);
}

function celebrateComplete() {
  // Confetti burst
  fireConfetti(window.innerWidth / 2, window.innerHeight * 0.5);
  // Text animation
  const el = document.createElement('div');
  el.className = 'act-celebration';
  const msgs = ['✦ Done!','✓ Completed!','🎯 Nailed it!','✨ Well done!','⭐ Great!','💪 Awesome!'];
  el.textContent = msgs[Math.floor(Math.random() * msgs.length)];
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 1500);
}

pageAfterTaskSave = () => { renderCurrentView(); };
pageAfterImport = () => { renderCurrentView(); };

// ─── VIEW SWITCHING ────────────────────────────────────────
function switchActivitiesView(view) {
  currentView = view;
  document.querySelectorAll('.act-view-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.view === view);
  });
  activitiesView.classList.toggle('hidden', view !== 'timeline');
  boardView.classList.toggle('hidden', view !== 'board');
  renderCurrentView();
}

function renderCurrentView() {
  if (currentView === 'board') {
    renderTags();
  } else {
    renderActivities();
  }
  renderActivityStats();
  renderInsights();
}

// ─── RENDER TIMELINE ────────────────────────────────────────
function renderActivities() {
  if (!activitiesList) return;
  let tasks = state.tasks.filter(t => !isWhiteboardTask(t));
  const tagFilter = actTagFilter?.value || '';
  const dateFilter = actDateFilter?.value || 'all';
  const searchQuery = (actSearch?.value || '').toLowerCase().trim();

  if (tagFilter) tasks = tasks.filter(t => t.tag === tagFilter);
  if (searchQuery) {
    tasks = tasks.filter(t =>
      t.title.toLowerCase().includes(searchQuery) ||
      (t.notes && t.notes.toLowerCase().includes(searchQuery))
    );
  }

  const now = new Date();
  const today = formatDate(now);
  const ws = getMonday(now);
  const we = addDays(ws, 7);

  if (dateFilter === 'today') tasks = tasks.filter(t => t.date === today);
  else if (dateFilter === 'week') tasks = tasks.filter(t => { const d = new Date(t.date + 'T12:00:00'); return d >= ws && d < we; });
  else if (dateFilter === 'month') {
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    tasks = tasks.filter(t => { const d = new Date(t.date + 'T12:00:00'); return d >= monthStart && d < monthEnd; });
  }

  tasks.sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date);
    return parseTime(a.startTime) - parseTime(b.startTime);
  });

  // Update result count and search clear before early return
  const resultCount = document.getElementById('actResultCount');
  if (resultCount) resultCount.textContent = `${tasks.length} result${tasks.length !== 1 ? 's' : ''}`;
  if (actSearchClear) actSearchClear.classList.toggle('visible', !!searchQuery);

  if (tasks.length === 0) {
    activitiesList.innerHTML = `<div class="act-empty">
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>
      <p>No activities found</p>
      <p class="sub">Try changing your filter or create tasks in the Schedule view</p>
    </div>`;
    updateActCount();
    renderActivityStats();
    renderInsights();
    return;
  }

  // Group by day
  const groups = [];
  let currentDate = null;
  let currentGroup = null;
  const journals = loadDayJournals();

  for (const task of tasks) {
    if (task.date !== currentDate) {
      currentDate = task.date;
      currentGroup = { date: task.date, tasks: [] };
      groups.push(currentGroup);
    }
    currentGroup.tasks.push(task);
  }

  let html = '';
  for (const group of groups) {
    const d = new Date(group.date + 'T12:00:00');
    const dayLabel = isToday(d) ? 'Today' : isYesterday(d) ? 'Yesterday' : getDayName(d, false);
    const dateLabel = `${dayLabel}, ${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
    const isPast = d < new Date(new Date().toDateString());
    const isCollapsed = collapsedDays.has(group.date);
    const dayJournal = journals[group.date] || '';
    const totalDayMins = group.tasks.reduce((sum, t) => sum + getDurationMinutes(t), 0);
    const dayHrs = Math.floor(totalDayMins / 60);
    const dayMins = totalDayMins % 60;
    const dayTimeStr = dayHrs > 0 ? `${dayHrs}h${dayMins > 0 ? ` ${dayMins}m` : ''}` : `${dayMins}m`;

    html += `<div class="act-day${isCollapsed ? ' collapsed' : ''}" data-date="${group.date}">
      <div class="act-day-stamp">
        <div class="act-day-toggle" data-toggle-day="${group.date}">
          <svg class="act-day-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="9 18 15 12 9 6"/></svg>
          <span class="act-day-label">${dateLabel}</span>
        </div>
        <span class="act-day-meta">
          <span class="act-day-dot${isToday(d) ? ' today' : isPast ? ' past' : ''}"></span>
          ${group.tasks.length} tasks · ${dayTimeStr}
        </span>
      </div>
      <div class="act-day-body">
        ${dayJournal ? `<div class="act-day-notes" data-day-journal="${group.date}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          <span class="act-dn-display">${escapeHtml(dayJournal)}</span>
          <textarea class="act-dn-input" rows="1" placeholder="Journal entry for this day...">${escapeHtml(dayJournal)}</textarea>
        </div>` : `<div class="act-day-notes" data-day-journal="${group.date}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          <span class="act-dn-display">${group.date === formatDate(new Date()) ? 'Write a note for today...' : 'Add a note for this day...'}</span>
          <textarea class="act-dn-input" rows="1" placeholder="Journal entry for this day..."></textarea>
        </div>`}
        <div style="position:relative">
          <div class="act-tl-line"></div>`;

    for (const task of group.tasks) {
      const meta = getTagMeta(task.tag);
      const isCompleted = task.completed;
      const durMins = getDurationMinutes(task);
      const durPct = Math.min(durMins / 240 * 100, 100);
      const pr = task.priority || 3;
      html += `<div class="act-card tag-${task.tag}${isCompleted ? ' completed' : ''}${batchMode ? ' batch-mode' : ''}" data-task-id="${task.id}">
        <span class="act-bchk${batchSelected.has(task.id) ? ' sel' : ''}" data-batch-toggle="${task.id}"></span>
        <div class="act-card-time">${task.startTime}<br>${task.endTime}</div>
        <div class="act-card-body">
          <div class="act-card-header">
            <span class="act-card-check${isCompleted ? ' checked' : ''}" data-toggle-complete="${task.id}"></span>
            <div class="act-card-title-inline">
              <span class="act-card-title-display" data-inline-edit="${task.id}">${escapeHtml(task.title)}</span>
            </div>
            <span class="act-pr p${pr}">${PRIORITY_SHORT[pr] || 'P3'}</span>
            <span class="act-card-tag" style="background:color-mix(in srgb, ${meta.text} 15%, transparent);color:${meta.text}">${task.tag}</span>
          </div>
          ${task.notes ? `<div class="act-card-notes">${escapeHtml(task.notes)}</div>` : ''}
          <div class="act-card-bar" style="width:${durPct}%"></div>
        </div>
        <button class="act-card-del" data-task-id="${task.id}" title="Delete">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>`;
    }
    html += '</div></div></div>';
  }

  activitiesList.innerHTML = html;

  // Fit text to activity cards
  requestAnimationFrame(() => { fitTextAll('.act-card', 14, 9); });

  // ─── EVENT LISTENERS ──────────────────────────────────────
  // Collapse toggle
  activitiesList.querySelectorAll('.act-day-toggle').forEach(el => {
    el.addEventListener('click', () => {
      const date = el.dataset.toggleDay;
      if (!date) return;
      const day = el.closest('.act-day');
      if (!day) return;
      if (collapsedDays.has(date)) collapsedDays.delete(date);
      else collapsedDays.add(date);
      day.classList.toggle('collapsed');
    });
  });

  // Day journal
  activitiesList.querySelectorAll('.act-day-notes').forEach(el => {
    const display = el.querySelector('.act-dn-display');
    const input = el.querySelector('.act-dn-input');
    if (!display || !input) return;
    display.addEventListener('click', (e) => {
      if (e.target.closest('.act-dn-input')) return;
      el.classList.add('editing');
      input.focus();
      input.setSelectionRange(input.value.length, input.value.length);
    });
    input.addEventListener('blur', () => { saveDayJournal(el); el.classList.remove('editing'); });
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); input.blur(); }
      if (e.key === 'Escape') { e.preventDefault(); saveDayJournal(el, true); el.classList.remove('editing'); }
    });
  });

  // Batch select
  if (batchMode) {
    activitiesList.querySelectorAll('.act-bchk').forEach(el => {
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = el.dataset.batchToggle;
        if (id) toggleBatchSelect(id);
      });
    });
    activitiesList.querySelectorAll('.act-card').forEach(el => {
      el.addEventListener('click', (e) => {
        if (e.target.closest('.act-bchk')) return;
        if (e.target.closest('.act-card-check')) return;
        if (e.target.closest('.act-card-del')) return;
        const id = el.dataset.taskId;
        if (id) toggleBatchSelect(id);
      });
    });
  }

  // Card events (only when NOT in batch mode)
  if (!batchMode) {
    activitiesList.querySelectorAll('.act-card').forEach(el => {
      const taskId = el.dataset.taskId;
      el.addEventListener('click', (e) => {
        if (e.target.closest('.act-card-check')) return;
        if (e.target.closest('.act-card-del')) return;
        if (e.target.closest('.act-bchk')) return;
        openTaskModal(taskId);
      });
    });
  }

  activitiesList.querySelectorAll('.act-card-check').forEach(el => {
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      const tid = el.dataset.toggleComplete;
      const task = getTask(tid);
      const wasCompleted = task?.completed;
      const prev = JSON.parse(JSON.stringify(state.tasks));
      toggleComplete(tid);
      if (!wasCompleted && task) {
        setTimeout(() => celebrateComplete(), 100);
      }
      renderActivities();
    });
  });

  activitiesList.querySelectorAll('.act-card-del').forEach(el => {
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      const tid = el.dataset.taskId;
      const task = getTask(tid);
      if (!task) return;
      const prev = JSON.parse(JSON.stringify(state.tasks));
      const title = task.title;
      deleteTask(tid);
      renderActivities();
      showUndoToast(`Deleted "${title.length > 30 ? title.slice(0, 30) + '...' : title}"`, () => {
        state.tasks = prev;
        saveState();
        renderCurrentView();
      });
    });
  });

  // Inline edit: double-click to edit title
  activitiesList.querySelectorAll('.act-card-title-display').forEach(el => {
    el.addEventListener('dblclick', (e) => {
      e.stopPropagation();
      const card = el.closest('.act-card');
      if (!card) return;
      const taskId = card.dataset.taskId;
      startInlineEdit(taskId, el);
    });
  });

  updateActCount();
  renderActivityStats();
  renderInsights();
}

// ─── DAY JOURNAL SAVE ────────────────────────────────────────
function saveDayJournal(el, revert) {
  const date = el.dataset.dayJournal;
  if (!date) return;
  const input = el.querySelector('.act-dn-input');
  const display = el.querySelector('.act-dn-display');
  if (!input || !display) return;
  if (revert) { input.value = display.textContent; return; }
  const val = input.value.trim();
  const journals = loadDayJournals();
  if (val) {
    journals[date] = val;
    display.textContent = val;
  } else {
    delete journals[date];
    display.textContent = date === formatDate(new Date()) ? 'Write a note for today...' : 'Add a note for this day...';
  }
  saveDayJournals(journals);
}

// ─── INLINE EDIT (module-level) ──────────────────────────────
function startInlineEdit(taskId, displayEl) {
  const currentTitle = displayEl.textContent;
  const input = document.createElement('input');
  input.type = 'text';
  input.value = currentTitle;
  input.style.cssText = 'width:100%;border:none;background:transparent;font-size:0.88rem;font-weight:500;color:var(--text-primary);font-family:var(--font-family);outline:none;border-bottom:1px solid var(--border-focus);padding:0;margin:0';
  displayEl.style.display = 'none';
  displayEl.parentNode.insertBefore(input, displayEl);
  input.focus();
  input.select();

  function finishEdit(save) {
    if (save) {
      const val = input.value.trim();
      if (val && val !== currentTitle) {
        updateTask(taskId, { title: val });
        displayEl.textContent = val;
      }
    }
    input.remove();
    displayEl.style.display = '';
  }

  input.addEventListener('blur', () => finishEdit(true));
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); finishEdit(true); }
    if (e.key === 'Escape') { e.preventDefault(); finishEdit(false); }
  });
}

// ─── TAGS BOARD HELPERS ─────────────────────────────────────
function getTagColumnMeta(tag) {
  const c = cardColors[tag] || DEFAULT_TAG_COLORS[tag];
  const isDark = document.documentElement.classList.contains('dark');
  if (isDark) {
    return { color: darkenColor(c.light, 0.82), textColor: c.dark || lightenColor(c.light, 0.45), darkColor: darkenColor(c.light, 0.82), darkText: c.dark || lightenColor(c.light, 0.45) };
  }
  return { color: lightenColor(c.light, 0.85), textColor: c.light, darkColor: darkenColor(c.light, 0.82), darkText: c.dark || lightenColor(c.light, 0.45) };
}

function formatHrs(mins) {
  const h = Math.floor(mins / 60); const m = mins % 60;
  if (h === 0) return `${m}m`; if (m === 0) return `${h}h`; return `${h}h ${m}m`;
}

// ─── RENDER TAGS BOARD ──────────────────────────────────────
function renderTags() {
  if (!boardInner) return;
  // Gather stats per tag
  const tagData = {};
  for (const tag of TAG_ORDER) {
    tagData[tag] = { count: 0, totalMinutes: 0, completed: 0, tasks: [] };
  }

  const scheduled = state.tasks.filter(t => !isWhiteboardTask(t));
  for (const t of scheduled) {
    if (tagData[t.tag]) {
      tagData[t.tag].count++;
      if (t.completed) tagData[t.tag].completed++;
      const start = parseTime(t.startTime);
      const end = parseTime(t.endTime) || start + 60;
      tagData[t.tag].totalMinutes += Math.max(end - start, 15);
      tagData[t.tag].tasks.push(t);
    }
  }

  const totalAll = Object.values(tagData).reduce((s, d) => s + d.totalMinutes, 0) || 1;
  const isDark = document.documentElement.classList.contains('dark');

  let html = '';
  let grandTotal = 0;

  for (const tag of TAG_ORDER) {
    const d = tagData[tag];
    const meta = getTagColumnMeta(tag);
    const pct = Math.round((d.totalMinutes / totalAll) * 100);
    const colColor = meta.color;
    const txtColor = meta.textColor;
    const accentColor = cardColors[tag]?.light || DEFAULT_TAG_COLORS[tag].light;
    grandTotal += d.count;

    html += `<div class="tag-column">
      <div class="tag-column-header">
        <span class="tag-column-dot" style="background:${colColor}"></span>
        <span class="tag-column-name" style="color:${txtColor}">${TAG_LABELS[tag]}</span>
        <span class="tag-column-count">${d.count}</span>
        <button class="btn btn-ghost tag-color-btn" data-tag="${tag}" title="Change card color" style="margin-left:auto;padding:2px;line-height:0">
          <span class="tag-color-swatch" style="background:${accentColor};display:inline-block;width:10px;height:10px;border-radius:50%;border:1.5px solid var(--border-color)"></span>
        </button>
      </div>
      <div class="tag-column-stats">
        <div class="tag-column-stat">
          <div class="val" style="color:${txtColor}">${formatHrs(d.totalMinutes)}</div>
          <div class="lbl">Time</div>
        </div>
        <div class="tag-column-stat">
          <div class="val">${d.completed}</div>
          <div class="lbl">Done / ${d.count}</div>
        </div>
      </div>
      <div class="tag-column-progress">
        <div class="fill" style="width:${pct}%;background:${txtColor}"></div>
      </div>
      <div class="tag-column-tasks" data-tag="${tag}">
        ${d.tasks.length === 0 ? '<div class="tag-column-empty">No tasks</div>' : ''}
        ${d.tasks.map(t => {
          const isComp = t.completed;
          const accent = txtColor;
          return `<div class="tag-col-task${isComp ? ' completed' : ''}" data-task-id="${t.id}" style="--tct-accent:${accent}">
            <div class="tct-title${isComp ? ' done' : ''}">
              <span class="tct-check${isComp ? ' checked' : ''}" data-toggle-complete="${t.id}"></span>
              ${escapeHtml(t.title)}
            </div>
            <div class="tct-meta">
              <span>${t.startTime}–${t.endTime}</span>
              <span>${t.date}</span>
            </div>
          </div>`;
        }).join('')}
      </div>
    </div>`;
  }

  boardInner.innerHTML = html;

  if (tagsSummaryTotal) {
    tagsSummaryTotal.textContent = `${grandTotal} tasks across all categories`;
  }    updateActCount();
    renderActivityStats();
    renderInsights();

  // Fit text to cards
  requestAnimationFrame(() => { fitTextAll('.tag-col-task', 13, 8); });

  // Event listeners
  boardInner.querySelectorAll('.tag-col-task').forEach(el => {
    const taskId = el.dataset.taskId;
    el.addEventListener('click', (e) => {
      if (e.target.closest('[data-toggle-complete]')) return;
      openTaskModal(taskId);
    });
  });

  boardInner.querySelectorAll('[data-toggle-complete]').forEach(el => {
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      const tid = el.dataset.toggleComplete;
      const task = getTask(tid);
      const wasCompleted = task?.completed;
      toggleComplete(tid);
      if (!wasCompleted && task) {
        setTimeout(() => celebrateComplete(), 100);
      }
      renderTags();
    });
  });

  // Color picker buttons
  boardInner.querySelectorAll('.tag-color-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const tag = btn.dataset.tag;
      const curColor = cardColors[tag]?.light || DEFAULT_TAG_COLORS[tag].light;
      openCardColorPicker(btn, tag, curColor, () => { renderTags(); });
    });
  });
}

// ─── IS YESTERDAY ─────────────────────────────────────────
function isYesterday(d) {
  const y = new Date(); y.setDate(y.getDate() - 1);
  return d.getFullYear() === y.getFullYear() && d.getMonth() === y.getMonth() && d.getDate() === y.getDate();
}

// ─── WEEKLY SPARKLINE ──────────────────────────────────────────
function renderWeeklySparkline() {
  const el = document.getElementById('actWeeklySpark');
  if (!el) return;
  const today = new Date();
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today); d.setDate(d.getDate() - i);
    days.push(formatDate(d));
  }
  const vals = days.map(ds => {
    const dayTasks = state.tasks.filter(t => t.date === ds && !isWhiteboardTask(t));
    return dayTasks.reduce((sum, t) => sum + getDurationMinutes(t), 0);
  });
  const max = Math.max(...vals, 1);
  const w = 140, h = 28;
  const points = vals.map((v, i) => {
    const x = (i / (vals.length - 1)) * w;
    const y = h - (v / max) * h;
    return `${x},${y}`;
  }).join(' ');
  el.innerHTML = `<svg viewBox="0 0 ${w} ${h}" fill="none" xmlns="http://www.w3.org/2000/svg">
    <polyline points="${points}" stroke="var(--accent)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" opacity="0.6"/>
    <polyline points="${points}" stroke="var(--accent)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" opacity="0.15"/>
  </svg>`;
}

// ─── ACTIVITY STATS ──────────────────────────────────────────
function computeActivityStats() {
  const tasks = state.tasks.filter(t => !isWhiteboardTask(t));
  const total = tasks.length;
  const completed = tasks.filter(t => t.completed).length;
  const completionRate = total > 0 ? Math.round(completed / total * 100) : 0;

  // Streak: count consecutive days (going backwards from today) with at least one completed task
  const today = new Date();
  let streak = 0;
  let bestStreak = 0;
  let currentStreak = 0;
  const checkDate = new Date(today);
  // Go back 365 days and find streaks
  const completedByDate = {};
  for (const t of tasks) {
    if (t.completed && t.date) {
      completedByDate[t.date] = (completedByDate[t.date] || 0) + 1;
    }
  }
  // Find current streak
  for (let i = 0; i < 365; i++) {
    const ds = formatDate(checkDate);
    if (completedByDate[ds]) {
      streak++;
    } else if (i > 0) {
      break; // gap in current streak
    } else {
      // Today hasn't had any completions yet, skip to yesterday
    }
    checkDate.setDate(checkDate.getDate() - 1);
  }
  // Since we started from today and may have no completions today, adjust
  if (!completedByDate[formatDate(today)]) {
    streak = 0;
    checkDate.setTime(today.getTime());
    checkDate.setDate(checkDate.getDate() - 1);
    for (let i = 0; i < 365; i++) {
      const ds = formatDate(checkDate);
      if (completedByDate[ds]) {
        streak++;
      } else {
        break;
      }
      checkDate.setDate(checkDate.getDate() - 1);
    }
  }

  // Best streak
  let run = 0;
  const allDates = Object.keys(completedByDate).sort();
  for (let i = 0; i < allDates.length; i++) {
    if (i === 0) { run = 1; continue; }
    const prev = new Date(allDates[i-1] + 'T12:00:00');
    const curr = new Date(allDates[i] + 'T12:00:00');
    const diff = (curr - prev) / (1000 * 60 * 60 * 24);
    if (diff === 1) {
      run++;
    } else {
      bestStreak = Math.max(bestStreak, run);
      run = 1;
    }
  }
  bestStreak = Math.max(bestStreak, run);

  // Best tag by total time
  const tagTime = {};
  for (const t of tasks) {
    if (!t.tag) continue;
    const dur = getDurationMinutes(t);
    tagTime[t.tag] = (tagTime[t.tag] || 0) + dur;
  }
  let bestTag = '';
  let bestTagMins = 0;
  for (const [tag, mins] of Object.entries(tagTime)) {
    if (mins > bestTagMins) {
      bestTagMins = mins;
      bestTag = tag;
    }
  }

  return { total, completed, completionRate, streak, bestStreak, bestTag: bestTag || 'meeting', bestTagHours: Math.round(bestTagMins / 60) };
}

function renderActivityStats() {
  const stats = computeActivityStats();
  const elTotal = document.getElementById('actStatTotal');
  const elCompleted = document.getElementById('actStatCompleted');
  const elRate = document.getElementById('actStatRate');
  const elStreak = document.getElementById('actStatStreak');
  const elBestStreak = document.getElementById('actStatBestStreak');
  const elTopTag = document.getElementById('actStatTopTag');
  const elTopCount = document.getElementById('actStatTopCount');

  if (elTotal) elTotal.textContent = stats.total;
  if (elCompleted) elCompleted.textContent = stats.completed;
  if (elRate) elRate.textContent = `${stats.completionRate}% rate`;
  if (elStreak) elStreak.textContent = stats.streak;
  if (elBestStreak) elBestStreak.textContent = `Best: ${stats.bestStreak}`;
  if (elTopTag) {
    elTopTag.innerHTML = `<span style="color:${TAG_COLORS[stats.bestTag]?.text || 'var(--text-primary)'}">${TAG_LABELS[stats.bestTag] || stats.bestTag}</span>`;
  }
  if (elTopCount) elTopCount.textContent = `${stats.bestTagHours}h total`;
  renderWeeklySparkline();
}

// ─── INSIGHTS ─────────────────────────────────────────────────
function generateInsights() {
  const tasks = state.tasks.filter(t => !isWhiteboardTask(t));
  if (tasks.length < 2) return [];

  const insights = [];
  const today = new Date();
  const todayStr = formatDate(today);

  // Weekly comparison
  const thisWeekTasks = tasks.filter(t => {
    if (!t.date) return false;
    const d = new Date(t.date + 'T12:00:00');
    const weekStart = getMonday(today);
    return d >= weekStart && d < addDays(weekStart, 7);
  });
  const lastWeekTasks = tasks.filter(t => {
    if (!t.date) return false;
    const d = new Date(t.date + 'T12:00:00');
    const weekStart = addDays(getMonday(today), -7);
    return d >= weekStart && d < addDays(weekStart, 7);
  });
  const thisCount = thisWeekTasks.length;
  const lastCount = lastWeekTasks.length;
  if (lastCount > 0 && thisCount > 0) {
    const diff = thisCount - lastCount;
    if (diff > 0) insights.push({ icon: '📈', text: `<strong>${diff}</strong> more tasks than last week` });
    else if (diff < 0) insights.push({ icon: '📉', text: `<strong>${Math.abs(diff)}</strong> fewer tasks than last week` });
    else insights.push({ icon: '➡️', text: `<strong>Same</strong> number of tasks as last week` });
  } else if (thisCount > 0) {
    insights.push({ icon: '🎯', text: `<strong>${thisCount}</strong> tasks this week — keep going!` });
  }

  // Today's completions
  const todayDone = tasks.filter(t => t.date === todayStr && t.completed);
  if (todayDone.length > 0) {
    insights.push({ icon: '✅', text: `<strong>${todayDone.length}</strong> tasks completed today` });
  }

  // Most active day of week
  const dowCounts = {};
  for (const t of tasks) {
    if (!t.date) continue;
    const d = new Date(t.date + 'T12:00:00');
    const dayName = d.toLocaleDateString('en-US', { weekday: 'long' });
    dowCounts[dayName] = (dowCounts[dayName] || 0) + 1;
  }
  let bestDay = '';
  let bestDayCount = 0;
  for (const [day, count] of Object.entries(dowCounts)) {
    if (count > bestDayCount) { bestDayCount = count; bestDay = day; }
  }
  if (bestDay && bestDayCount >= 3) {
    insights.push({ icon: '📅', text: `Most productive on <strong>${bestDay}s</strong> (${bestDayCount} tasks)` });
  }

  // Tag preference insight
  const tagCounts = {};
  for (const t of tasks) {
    if (t.tag) tagCounts[t.tag] = (tagCounts[t.tag] || 0) + 1;
  }
  const sortedTags = Object.entries(tagCounts).sort((a, b) => b[1] - a[1]);
  if (sortedTags.length > 0) {
    const [topTag, topCount] = sortedTags[0];
    insights.push({ icon: '🏷️', text: `Most used category: <strong>${TAG_LABELS[topTag] || topTag}</strong> (${topCount}x)` });
  }

  return insights.slice(0, 5);
}

function renderInsights() {
  if (!actInsights) return;
  const insights = generateInsights();
  if (insights.length === 0) {
    actInsights.innerHTML = '';
    return;
  }
  actInsights.innerHTML = insights.map(ins =>
    `<span class="act-insight">${ins.icon} <span>${ins.text}</span></span>`
  ).join('');
}

// ─── TASK COUNT UPDATE ─────────────────────────────────────
function updateActCount() {
  const el = document.getElementById('actPageCount');
  const hero = document.getElementById('actHeroCount');
  const count = state.tasks.filter(t => !isWhiteboardTask(t)).length;
  if (el) el.textContent = `${count} tasks`;
  if (hero) hero.textContent = `${count} tasks`;
}

// ─── FAB & QUICK ADD ──────────────────────────────────────
function toggleQuickAdd() {
  const form = document.getElementById('actQuickForm');
  const overlay = document.getElementById('actQuickOverlay');
  const fab = document.getElementById('actFab');
  if (!form || !overlay) return;
  const isOpen = form.classList.contains('open');
  if (isOpen) {
    closeQuickAdd();
  } else {
    form.classList.add('open');
    overlay.classList.add('active');
    fab?.classList.add('open');
    document.getElementById('qfTitle')?.focus();
    // Set default times
    const now = new Date();
    const currentMins = now.getHours() * 60 + now.getMinutes();
    const snap = roundToNearest(currentMins + 30, SNAP_MINUTES);
    document.getElementById('qfStart').value = toTimeStr(snap);
    document.getElementById('qfEnd').value = toTimeStr(snap + 60);
  }
}
function closeQuickAdd() {
  const form = document.getElementById('actQuickForm');
  const overlay = document.getElementById('actQuickOverlay');
  const fab = document.getElementById('actFab');
  form?.classList.remove('open');
  overlay?.classList.remove('active');
  fab?.classList.remove('open');
}
function submitQuickAdd() {
  const title = document.getElementById('qfTitle')?.value?.trim();
  if (!title) { document.getElementById('qfTitle')?.focus(); return; }
  const startTime = document.getElementById('qfStart')?.value || '09:00';
  const endTime = document.getElementById('qfEnd')?.value || '10:00';
  const activeTag = document.querySelector('.qf-tag.active');
  const tag = activeTag ? activeTag.dataset.tag : 'meeting';
  const today = formatDate(new Date());
  pushUndo();
  createTask({ title, date: today, startTime, endTime, tag });
  closeQuickAdd();
  document.getElementById('qfTitle').value = '';
  renderCurrentView();
  showToast(`✨ Added "${title}"`, 'success', 2000);
}

// ─── SETUP ────────────────────────────────────────────
function setupPage() {
  dom.importFileInput = document.getElementById('importFileInput');
  dom.aiChatBtn = document.getElementById('aiChatBtnSidebar');
  dom.aiChatPanel = document.getElementById('aiChatPanel');
  dom.aiChatOverlay = document.getElementById('aiChatOverlay');
  dom.aiChatMessages = document.getElementById('aiChatMessages');
  dom.aiChatInput = document.getElementById('aiChatInput');
  dom.aiChatInputWrapper = document.getElementById('aiChatInputWrapper');
  dom.aiChatSend = document.getElementById('aiChatSend');
  dom.aiChatClose = document.getElementById('aiChatClose');

  // Help modal
  dom.helpBtn = document.getElementById('helpBtn');
  dom.helpOverlay = document.getElementById('helpOverlay');
  dom.helpModal = document.getElementById('helpModal');
  dom.helpModalClose = document.getElementById('helpModalClose');
  dom.helpBtn?.addEventListener('click', showHelpModal);
  dom.helpOverlay?.addEventListener('click', hideHelpModal);
  dom.helpModalClose?.addEventListener('click', hideHelpModal);
  populateShortcuts();

  document.getElementById('themeBtnSidebar')?.addEventListener('click', toggleTheme);
  document.getElementById('settingsBtnSidebar')?.addEventListener('click', openSettingsDrawer);
  document.getElementById('bcThemeBtn')?.addEventListener('click', toggleTheme);
  document.getElementById('bcSettingsBtn')?.addEventListener('click', openSettingsDrawer);
  dom.importFileInput?.addEventListener('change', importData);
  document.getElementById('importDataBtn')?.addEventListener('click', () => { if (dom.importFileInput) { dom.importFileInput.value = ''; dom.importFileInput.click(); } });

  dom.aiChatBtn?.addEventListener('click', showAIChat);
  document.getElementById('bcAiChatBtn')?.addEventListener('click', showAIChat);
  dom.aiChatOverlay?.addEventListener('click', hideAIChat);
  dom.aiChatClose?.addEventListener('click', hideAIChat);
  dom.aiChatSend?.addEventListener('click', sendAIMessage);
  dom.aiChatInput?.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendAIMessage(); } });

  // ─── Quick Add tag pills ───────────────────────────────
  document.querySelectorAll('.qf-tag').forEach(el => {
    el.addEventListener('click', () => {
      document.querySelectorAll('.qf-tag').forEach(t => t.classList.remove('active'));
      el.classList.add('active');
    });
  });

  // ─── Quick Add keyboard: Enter to submit ───────────────
  document.getElementById('qfTitle')?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); submitQuickAdd(); }
  });

  const viewToggleEls = document.querySelectorAll('.act-view-btn');
  viewToggleEls.forEach(btn => {
    btn.addEventListener('click', () => switchActivitiesView(btn.dataset.view));
  });

  // Search with debounce
  actSearch?.addEventListener('input', () => {
    clearTimeout(searchDebounceTimer);
    searchDebounceTimer = setTimeout(() => {
      _lastSearchQuery = actSearch.value;
      renderActivities();
    }, 200);
  });
  actSearchClear?.addEventListener('click', () => {
    if (actSearch) actSearch.value = '';
    _lastSearchQuery = '';
    actSearchClear.classList.remove('visible');
    renderActivities();
    actSearch?.focus();
  });

  // Keyboard shortcut: N for new task
  document.addEventListener('keydown', (e) => {
    if (e.key === 'n' && !e.ctrlKey && !e.metaKey && !e.altKey) {
      // Don't trigger if typing in input/textarea/select
      const tag = e.target.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (state.taskModalOpen || state.settingsDrawerOpen || state.helpModalOpen || state.cmdPaletteOpen || state.aiChatOpen) return;
      const now = new Date();
      const currentMins = now.getHours() * 60 + now.getMinutes();
      const snap = roundToNearest(currentMins, SNAP_MINUTES);
      openNewTaskModal(formatDate(now), snap);
    }
  });

  // Re-render on theme change for board
  const observer = new MutationObserver(() => {
    if (currentView === 'board') renderTags();
    renderActivityStats();
  });
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

  updateActCount();
}

// ─── INIT ──────────────────────────────────────────────────
function init() {
  loadState();
  applyTheme();
  document.querySelectorAll('img[data-image-id]').forEach(el => { el.src = getImage(el.dataset.imageId) || ''; });
  renderActivityStats();
  renderInsights();
  renderActivities();

  actTagFilter?.addEventListener('change', () => { renderActivities(); renderActivityStats(); renderInsights(); });
  actDateFilter?.addEventListener('change', () => { renderActivities(); renderActivityStats(); renderInsights(); });

  setupPage();
  document.getElementById('exportBtn')?.addEventListener('click', exportData);
  document.getElementById('importBtn')?.addEventListener('click', () => { document.getElementById('importFileInput')?.click(); });

  // ─── FAB ──────────────────────────────────────────────────
  document.getElementById('actFab')?.addEventListener('click', toggleQuickAdd);
  document.getElementById('actQuickOverlay')?.addEventListener('click', closeQuickAdd);
  document.getElementById('qfCancel')?.addEventListener('click', closeQuickAdd);
  document.getElementById('qfSubmit')?.addEventListener('click', submitQuickAdd);

  // ─── Batch toolbar ───────────────────────────────────────
  document.getElementById('actBatchComplete')?.addEventListener('click', batchComplete);
  document.getElementById('actBatchDelete')?.addEventListener('click', batchDelete);
  document.getElementById('actBatchExit')?.addEventListener('click', exitBatchMode);

  // ─── Keyboard shortcuts ──────────────────────────────────
  document.addEventListener('keydown', (e) => {
    // Escape closes quick-add
    if (e.key === 'Escape') {
      const qf = document.getElementById('actQuickForm');
      if (qf?.classList.contains('open')) { closeQuickAdd(); e.preventDefault(); return; }
      if (batchMode) { exitBatchMode(); e.preventDefault(); return; }
    }
    // B for batch mode (only in timeline view)
    if (e.key === 'b' && !e.ctrlKey && !e.metaKey && !e.altKey) {
      const tag = e.target.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (currentView === 'timeline') {
        e.preventDefault();
        if (batchMode) exitBatchMode(); else enterBatchMode();
      }
    }
  });

}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
else init();
