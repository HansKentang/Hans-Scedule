/* ============================================
   Havën Schedule — Goals & Resolutions
   ============================================ */

const GOALS_STORAGE = 'haven-schedule-goals';

// ─── DEFAULTS ────────────────────────────────────────────────
function getDefaultGoals() {
  return [
    {
      id: 'g1', title: 'Emotional Maturity',
      description: 'Developing self-awareness and regulation through intentional reflection.',
      icon: 'psychology', status: 'active', color: '#6366f1',
      targetDate: '',
      journal: [],
      tasks: [
        { text: 'Morning meditation (15m)', done: true },
        { text: 'Evening journaling session', done: true },
        { text: 'Bi-weekly therapy integration', done: false },
      ],
    },
    {
      id: 'g2', title: 'Fitness & Vitality',
      description: 'Building a resilient body through consistent movement and nutrition.',
      icon: 'fitness_center', status: 'in-progress', color: '#ef4444',
      targetDate: '',
      journal: [],
      tasks: [
        { text: '4 workouts per week', done: true },
        { text: 'Meal prep Sundays', done: false },
        { text: 'Reach 10k steps daily', done: false },
      ],
    },
    {
      id: 'g3', title: 'Wealth & Freedom',
      description: 'Securing the future through wise investments and mindful spending.',
      icon: 'account_balance', status: 'milestone', color: '#10b981',
      targetDate: '',
      journal: [],
      tasks: [
        { text: 'Automated monthly investment', done: true },
        { text: 'Read finance books', done: true },
        { text: 'Review portfolio quarterly', done: false },
      ],
    },
    {
      id: 'g4', title: 'Lifelong Learning',
      description: 'Expanding the mind through diverse subjects and new skills.',
      icon: 'school', status: 'active', color: '#f59e0b',
      targetDate: '',
      journal: [],
      tasks: [
        { text: 'Complete UI Design Course', done: true },
        { text: 'Learn a new language', done: false },
        { text: 'Read 12 books this year', done: false },
      ],
    },
  ];
}

function getDefaultManifesto() {
  return { text: 'Focus on the process, let go of the attachment to the outcome. Peace is the priority.', author: '' };
}

function getDefaultResolutions() {
  const weekKey = (offset) => {
    const d = new Date();
    d.setDate(d.getDate() - (d.getDay() + 6) % 7 - offset * 7);
    return d.toISOString().slice(0, 10);
  };
  return [
    {
      id: 'r1', title: 'No phone before bed', category: 'mindful',
      weekChecks: { [weekKey(0)]: true, [weekKey(1)]: true, [weekKey(2)]: true },
    },
    {
      id: 'r2', title: 'Read 20 mins daily', category: 'mental',
      weekChecks: { [weekKey(0)]: true, [weekKey(1)]: true },
    },
    {
      id: 'r3', title: 'Stretch every morning', category: 'physical',
      weekChecks: { [weekKey(0)]: true },
    },
  ];
}

const GOAL_ICONS = [
  'psychology', 'fitness_center', 'account_balance', 'school', 'menu_book',
  'palette', 'language', 'music_note', 'travel_explore', 'self_improvement',
  'diversity_3', 'monitoring', 'nutrition', 'pill', 'cycle',
];

const GOAL_COLORS = [
  '#6366f1', '#ef4444', '#10b981', '#f59e0b', '#ec4899',
  '#06b6d4', '#f97316', '#8b5cf6', '#14b8a6', '#e11d48',
];

const GOAL_STATUS_LABELS = {
  'active': { label: 'Active', cls: 'gl-status-active' },
  'in-progress': { label: 'In Progress', cls: 'gl-status-in-progress' },
  'milestone': { label: 'Milestone', cls: 'gl-status-milestone' },
  'done': { label: 'Completed', cls: 'gl-status-done' },
};

const RESOLUTION_CATEGORIES = [
  { id: 'mindful', label: 'Mindful', color: '#6366f1' },
  { id: 'physical', label: 'Physical', color: '#ef4444' },
  { id: 'financial', label: 'Financial', color: '#10b981' },
  { id: 'mental', label: 'Mental', color: '#f59e0b' },
  { id: 'social', label: 'Social', color: '#ec4899' },
  { id: 'creative', label: 'Creative', color: '#06b6d4' },
];

const MOODS = [
  { emoji: '\u{1F929}', label: 'Amazing' },
  { emoji: '\u{1F60A}', label: 'Good' },
  { emoji: '\u{1F610}', label: 'Okay' },
  { emoji: '\u{1F641}', label: 'Tough' },
  { emoji: '\u{1F622}', label: 'Rough' },
];

// ─── DATA ────────────────────────────────────────────────────
let goalsData = null;

function loadGoals() {
  try {
    const raw = localStorage.getItem(GOALS_STORAGE);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.goals && Array.isArray(parsed.goals)) {
        goalsData = parsed;
        goalsData.resolutions = goalsData.resolutions || getDefaultResolutions();
        goalsData.goals.forEach(g => { g.targetDate = g.targetDate || ''; g.journal = g.journal || []; });
        return;
      }
    }
  } catch (e) { /* ignore */ }
  try {
    const hubRaw = localStorage.getItem('haven-hub-content');
    if (hubRaw) {
      const hub = JSON.parse(hubRaw);
      if (hub.goals && hub.goals.length > 0) {
        goalsData = {
          goals: hub.goals.map((g, i) => ({
            id: 'gm_' + i, title: g, description: '', icon: GOAL_ICONS[i % GOAL_ICONS.length],
            status: 'active', color: GOAL_COLORS[i % GOAL_COLORS.length],
            targetDate: '', journal: [], tasks: [],
          })),
          manifesto: hub.quote || getDefaultManifesto(),
          resolutions: getDefaultResolutions(),
        };
        saveGoals();
        return;
      }
    }
  } catch (e) { /* ignore */ }
  goalsData = { goals: getDefaultGoals(), manifesto: getDefaultManifesto(), resolutions: getDefaultResolutions() };
  saveGoals();
}

function saveGoals() {
  try { safeSetItem(GOALS_STORAGE, JSON.stringify(goalsData)); } catch (e) { /* ignore */ }
}

function getGoals() { return goalsData.goals; }
function getGoal(id) { return goalsData.goals.find(g => g.id === id); }
function getResolutions() { return goalsData.resolutions; }

function addGoal(data) {
  const goal = {
    id: 'g_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    title: data.title || 'New Goal',
    description: data.description || '',
    icon: data.icon || 'star', status: data.status || 'active',
    color: data.color || GOAL_COLORS[0],
    targetDate: data.targetDate || '',
    journal: [],
    tasks: data.tasks || [],
  };
  goalsData.goals.push(goal);
  saveGoals();
  return goal;
}

function updateGoal(id, data) {
  const idx = goalsData.goals.findIndex(g => g.id === id);
  if (idx === -1) return null;
  goalsData.goals[idx] = { ...goalsData.goals[idx], ...data };
  saveGoals();
  return goalsData.goals[idx];
}

function deleteGoal(id) {
  goalsData.goals = goalsData.goals.filter(g => g.id !== id);
  saveGoals();
}

function addGoalTask(goalId, text) {
  const goal = getGoal(goalId);
  if (!goal) return null;
  const task = { text: text.trim(), done: false };
  goal.tasks.push(task);
  saveGoals();
  return task;
}

function toggleGoalTask(goalId, taskIdx) {
  const goal = getGoal(goalId);
  if (!goal || taskIdx < 0 || taskIdx >= goal.tasks.length) return;
  goal.tasks[taskIdx].done = !goal.tasks[taskIdx].done;
  saveGoals();
}

function deleteGoalTask(goalId, taskIdx) {
  const goal = getGoal(goalId);
  if (!goal) return;
  goal.tasks.splice(taskIdx, 1);
  saveGoals();
}

function calcProgress(goal) {
  if (!goal.tasks || goal.tasks.length === 0) return 0;
  const done = goal.tasks.filter(t => t.done).length;
  return Math.round((done / goal.tasks.length) * 100);
}

function addJournalEntry(goalId, text, mood) {
  const goal = getGoal(goalId);
  if (!goal) return;
  goal.journal.push({ date: new Date().toISOString().slice(0, 10), text: text.trim(), mood: mood || '' });
  saveGoals();
}

// ─── RESOLUTIONS ─────────────────────────────────────────────
function addResolution(data) {
  const r = {
    id: 'r_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    title: data.title || 'New Resolution',
    category: data.category || 'mindful',
    weekChecks: {},
  };
  goalsData.resolutions.push(r);
  saveGoals();
  return r;
}

function updateResolution(id, data) {
  const idx = goalsData.resolutions.findIndex(r => r.id === id);
  if (idx === -1) return;
  goalsData.resolutions[idx] = { ...goalsData.resolutions[idx], ...data };
  saveGoals();
}

function deleteResolution(id) {
  goalsData.resolutions = goalsData.resolutions.filter(r => r.id !== id);
  saveGoals();
}

function toggleResolutionWeek(resId, weekKey) {
  const r = goalsData.resolutions.find(x => x.id === resId);
  if (!r) return;
  if (r.weekChecks[weekKey]) delete r.weekChecks[weekKey];
  else r.weekChecks[weekKey] = true;
  saveGoals();
}

function calcResolutionStreak(res) {
  const weeks = getWeekKeys();
  let streak = 0;
  for (let i = 0; i < weeks.length; i++) {
    if (res.weekChecks[weeks[i]]) streak++;
    else if (i > 6) break; // only count recent streak
    else streak = 0;
  }
  return streak;
}

function calcResolutionBestStreak(res) {
  const weeks = getWeekKeys();
  let best = 0, cur = 0;
  for (const w of weeks) {
    if (res.weekChecks[w]) { cur++; best = Math.max(best, cur); }
    else cur = 0;
  }
  return best;
}

function getWeekKeys() {
  const keys = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - (d.getDay() + 6) % 7 - i * 7);
    keys.push(d.toISOString().slice(0, 10));
  }
  return keys;
}

function getCategoryMeta(catId) {
  return RESOLUTION_CATEGORIES.find(c => c.id === catId) || RESOLUTION_CATEGORIES[0];
}

// ─── RENDER ──────────────────────────────────────────────────
function renderAll() {
  renderStats();
  renderBento();
  renderManifesto();
  renderResolutions();
  renderCounts();
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function statusClass(status) {
  const m = GOAL_STATUS_LABELS[status] || GOAL_STATUS_LABELS['active'];
  return m.cls;
}

function statusLabel(status) {
  const m = GOAL_STATUS_LABELS[status] || GOAL_STATUS_LABELS['active'];
  return m.label;
}

// ─── PROGRESS RING SVG ──────────────────────────────────────
function progressRing(pct, color, size) {
  const s = size || 48;
  const stroke = 3.5;
  const r = (s - stroke) / 2 - 1;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  return `
    <svg width="${s}" height="${s}" viewBox="0 0 ${s} ${s}" style="flex-shrink:0">
      <circle cx="${s/2}" cy="${s/2}" r="${r}" fill="none" stroke="var(--bg-secondary)" stroke-width="${stroke}"/>
      <circle cx="${s/2}" cy="${s/2}" r="${r}" fill="none" stroke="${color}" stroke-width="${stroke}"
        stroke-dasharray="${circ}" stroke-dashoffset="${offset}" stroke-linecap="round"
        transform="rotate(-90 ${s/2} ${s/2})" style="transition: stroke-dashoffset 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)"/>
      <text x="${s/2}" y="${s/2}" text-anchor="middle" dominant-baseline="central"
        fill="${pct >= 100 ? color : 'var(--text-tertiary)'}"
        font-size="${s * 0.28}" font-weight="700" font-variant-numeric="tabular-nums">${pct}%</text>
    </svg>`;
}

// ─── STATS DASHBOARD ──────────────────────────────────────
function renderStats() {
  const container = document.getElementById('glStats');
  if (!container) return;
  const goals = getGoals();
  const total = goals.length;
  const active = goals.filter(g => g.status !== 'done').length;
  const completed = goals.filter(g => g.status === 'done').length;
  const overdue = goals.filter(g => g.targetDate && new Date(g.targetDate + 'T23:59:59') < new Date() && calcProgress(g) < 100).length;
  const avgProgress = total > 0 ? Math.round(goals.reduce((s, g) => s + calcProgress(g), 0) / total) : 0;

  const stats = [
    { value: total, label: 'Total Goals', color: 'var(--primary)' },
    { value: active, label: 'Active', color: '#6366f1' },
    { value: completed, label: 'Completed', color: '#10b981' },
    { value: overdue > 0 ? overdue : avgProgress + '%', label: overdue > 0 ? 'Overdue' : 'Avg Progress', color: overdue > 0 ? '#ef4444' : 'var(--primary)' },
  ];

  container.innerHTML = stats.map(s => `
    <div class="gl-stat" style="--stat-color:${s.color}">
      <span class="gl-stat-value">${escapeHtml(s.value.toString())}</span>
      <span class="gl-stat-label">${escapeHtml(s.label)}</span>
    </div>
  `).join('');
}

// ─── BENTO ──────────────────────────────────────────────────
function renderBento() {
  const container = document.getElementById('glBento');
  if (!container) return;
  const goals = getGoals();
  const isEdit = state.editMode;

  if (goals.length === 0) {
    container.innerHTML = `<div class="gl-empty" style="grid-column:span 12"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg><p>No goals yet</p><div class="sub">Add your first goal to start tracking</div></div>`;
    return;
  }

  // Sort by target date (upcoming first), then by progress ascending
  const sorted = [...goals].sort((a, b) => {
    if (a.targetDate && b.targetDate) return a.targetDate.localeCompare(b.targetDate);
    if (a.targetDate) return -1;
    if (b.targetDate) return 1;
    return calcProgress(a) - calcProgress(b);
  });

  let html = '';
  for (let i = 0; i < sorted.length; i++) {
    const g = sorted[i];
    const progress = calcProgress(g);
    const statusInfo = statusClass(g.status);
    const ring = progressRing(progress, g.color, 52);

    const dateLabel = g.targetDate
      ? new Date(g.targetDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      : '';
    const isOverdue = g.targetDate && new Date(g.targetDate + 'T23:59:59') < new Date() && progress < 100;
    const journalCount = g.journal.length;

    const tasksHtml = g.tasks.map((t, ti) => `
      <div class="gl-task-wrap" style="position:relative">
        <div class="gl-task ${t.done ? 'done' : ''}" data-goal-id="${g.id}" data-task-idx="${ti}">
          <div class="gl-task-check ${t.done ? 'checked' : ''}" data-action="toggle-task" data-goal-id="${g.id}" data-task-idx="${ti}"></div>
          <span class="gl-task-text">${escapeHtml(t.text)}</span>
          ${isEdit ? `<button class="gl-task-del" data-action="del-task" data-goal-id="${g.id}" data-task-idx="${ti}">\u00d7</button>` : ''}
        </div>
      </div>
    `).join('');

    const editOverlay = isEdit ? `
      <div class="gl-edit-overlay">
        <button class="gl-edit-item-btn" data-action="edit-goal" data-goal-id="${g.id}" title="Edit goal">\u270e</button>
        <button class="gl-edit-item-btn del" data-action="del-goal" data-goal-id="${g.id}" title="Delete goal">\u00d7</button>
      </div>
    ` : '';

    const size = sorted.length <= 3 ? 'gl-card-md' : 'gl-card-sm';

    html += `
      <div class="gl-card ${size}" style="--gl-accent:${g.color}" data-goal-id="${g.id}">
        ${editOverlay}
        <div class="gl-card-header">
          <div class="gl-card-icon"><span class="material-symbols-outlined">${g.icon}</span></div>
          <div class="gl-card-title-group">
            <div class="gl-card-title-row">
              <span class="gl-card-title">${escapeHtml(g.title)}</span>
              <span class="gl-status-badge ${statusInfo}">${statusLabel(g.status)}</span>
            </div>
          </div>
        </div>
        ${g.description ? `<div class="gl-card-desc">${escapeHtml(g.description)}</div>` : ''}
        <div class="gl-tasks">
          ${tasksHtml}
          <button class="gl-add-task-btn" data-action="add-task" data-goal-id="${g.id}">+ Add task</button>
          <input type="text" class="gl-add-task-input" data-goal-id="${g.id}" placeholder="Task description..." data-task-input>
        </div>
        <div class="gl-card-footer">
          <div class="gl-ring-wrap">
            ${ring}
            <div class="gl-ring-meta">
              <span class="gl-ring-pct">${progress}%</span>
              ${dateLabel ? `<span class="gl-ring-date ${isOverdue ? 'overdue' : ''}">${isOverdue ? '\u26a0 ' : ''}${dateLabel}</span>` : ''}
              ${journalCount > 0 ? `<span class="gl-ring-journal">${journalCount} journal${journalCount > 1 ? 's' : ''}</span>` : ''}
            </div>
          </div>
        </div>
      </div>
    `;
  }

  if (isEdit) {
    html += `
      <button class="gl-add-goal-btn" id="glAddGoalBtn" data-action="add-goal">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        New Goal
      </button>
    `;
  }

  container.innerHTML = html;

  // ─── Event Delegation ──────────────────────────────
  container.querySelectorAll('[data-action="toggle-task"]').forEach(el => {
    el.addEventListener('click', function(e) {
      e.stopPropagation();
      toggleGoalTask(this.dataset.goalId, parseInt(this.dataset.taskIdx));
      renderBento();
    });
  });

  container.querySelectorAll('[data-action="del-task"]').forEach(el => {
    el.addEventListener('click', function(e) {
      e.stopPropagation();
      deleteGoalTask(this.dataset.goalId, parseInt(this.dataset.taskIdx));
      renderAll();
    });
  });

  container.querySelectorAll('[data-action="add-task"]').forEach(el => {
    el.addEventListener('click', function(e) {
      e.stopPropagation();
      const input = this.parentElement.querySelector('[data-task-input]');
      if (input) { input.classList.add('show'); input.focus(); }
    });
  });

  container.querySelectorAll('[data-task-input]').forEach(el => {
    el.addEventListener('keydown', function(e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        const text = this.value.trim();
        if (text) {
          addGoalTask(this.dataset.goalId, text);
          this.value = ''; this.classList.remove('show');
          renderAll();
        }
      }
      if (e.key === 'Escape') { this.value = ''; this.classList.remove('show'); }
    });
    el.addEventListener('blur', function() { setTimeout(() => { this.classList.remove('show'); }, 200); });
  });

  container.querySelectorAll('[data-action="edit-goal"]').forEach(el => {
    el.addEventListener('click', function(e) {
      e.stopPropagation();
      showGoalEditPopup(this.dataset.goalId, this);
    });
  });

  container.querySelectorAll('[data-action="del-goal"]').forEach(el => {
    el.addEventListener('click', function(e) {
      e.stopPropagation();
      const id = this.dataset.goalId;
      if (confirm('Delete this goal and all its tasks?')) { deleteGoal(id); renderAll(); }
    });
  });

  const addBtn = document.getElementById('glAddGoalBtn');
  if (addBtn) {
    addBtn.addEventListener('click', function() {
      const g = addGoal({ title: 'New Goal', description: 'Describe this goal...' });
      renderAll();
      setTimeout(() => {
        const el = document.querySelector(`[data-action="edit-goal"][data-goal-id="${g.id}"]`);
        if (el) showGoalEditPopup(g.id, el);
      }, 100);
    });
  }

  if (!isEdit) {
    container.querySelectorAll('.gl-card').forEach(el => {
      el.addEventListener('click', function() {
        const id = this.dataset.goalId;
        if (id) showGoalJournalPopup(id);
      });
    });
  }
}

// ─── GOAL EDIT POPUP ──────────────────────────────────────
let _goalPopup = null;

function showGoalEditPopup(goalId, anchorEl) {
  closeGoalPopup();
  const goal = getGoal(goalId);
  if (!goal) return;

  const popup = document.createElement('div');
  popup.className = 'gl-edit-popup';

  const colorSwatches = GOAL_COLORS.map(c =>
    `<span class="gl-color-swatch ${c === goal.color ? 'active' : ''}" style="background:${c}" data-color="${c}"></span>`
  ).join('');

  const iconOptions = GOAL_ICONS.map(ic =>
    `<option value="${ic}" ${ic === goal.icon ? 'selected' : ''}>${ic}</option>`
  ).join('');

  const statusOptions = Object.entries(GOAL_STATUS_LABELS).map(([k, v]) =>
    `<option value="${k}" ${k === goal.status ? 'selected' : ''}>${v.label}</option>`
  ).join('');

  popup.innerHTML = `
    <div style="font-size:0.72rem;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;color:var(--text-tertiary);margin-bottom:10px">Edit Goal</div>
    <input type="text" id="gepTitle" value="${escapeHtml(goal.title)}" placeholder="Goal title">
    <textarea id="gepDesc" placeholder="Description (optional)" rows="2">${escapeHtml(goal.description)}</textarea>
    <div style="margin-bottom:var(--space-2)">
      <label style="font-size:0.6rem;color:var(--text-tertiary);display:block;margin-bottom:4px">Color</label>
      <div class="gl-color-picker">${colorSwatches}</div>
    </div>
    <div class="gep-row" style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-2);margin-bottom:var(--space-2)">
      <div>
        <label style="font-size:0.6rem;color:var(--text-tertiary);display:block;margin-bottom:4px">Icon</label>
        <select id="gepIcon">${iconOptions}</select>
      </div>
      <div>
        <label style="font-size:0.6rem;color:var(--text-tertiary);display:block;margin-bottom:4px">Status</label>
        <select id="gepStatus">${statusOptions}</select>
      </div>
    </div>
    <div style="margin-bottom:var(--space-2)">
      <label style="font-size:0.6rem;color:var(--text-tertiary);display:block;margin-bottom:4px">Target Date (optional)</label>
      <input type="date" id="gepTarget" value="${goal.targetDate || ''}">
    </div>
    <div class="gl-edit-popup-actions">
      <button class="danger" id="gepDelete">Delete</button>
      <button class="cancel" id="gepCancel">Cancel</button>
      <button class="primary" id="gepSave">Save</button>
    </div>
  `;

  document.body.appendChild(popup);

  const rect = anchorEl.getBoundingClientRect();
  popup.style.top = Math.min(rect.bottom + 4, window.innerHeight - 360) + 'px';
  popup.style.left = Math.max(8, Math.min(rect.left - 100, window.innerWidth - 280)) + 'px';

  popup.querySelectorAll('.gl-color-swatch').forEach(el => {
    el.addEventListener('click', function() {
      popup.querySelectorAll('.gl-color-swatch').forEach(s => s.classList.remove('active'));
      this.classList.add('active');
    });
  });

  document.getElementById('gepSave').addEventListener('click', function() {
    const newColor = popup.querySelector('.gl-color-swatch.active')?.dataset.color || goal.color;
    updateGoal(goalId, {
      title: document.getElementById('gepTitle').value.trim() || goal.title,
      description: document.getElementById('gepDesc').value.trim(),
      color: newColor,
      icon: document.getElementById('gepIcon').value,
      status: document.getElementById('gepStatus').value,
      targetDate: document.getElementById('gepTarget').value || '',
    });
    closeGoalPopup();
    renderAll();
  });

  document.getElementById('gepCancel').addEventListener('click', closeGoalPopup);

  document.getElementById('gepDelete').addEventListener('click', function() {
    if (confirm('Delete this goal?')) { deleteGoal(goalId); closeGoalPopup(); renderAll(); }
  });

  function onKey(e) { if (e.key === 'Escape') closeGoalPopup(); }
  document.addEventListener('keydown', onKey);

  _goalPopup = { popup, onKey };
  setTimeout(() => document.getElementById('gepTitle')?.focus(), 100);
}

// ─── GOAL JOURNAL POPUP ─────────────────────────────────────
function showGoalJournalPopup(goalId) {
  closeGoalPopup();
  const goal = getGoal(goalId);
  if (!goal) return;

  const progress = calcProgress(goal);
  const popup = document.createElement('div');
  popup.className = 'gl-edit-popup';
  popup.style.maxHeight = '80vh';
  popup.style.overflowY = 'auto';

  const journalHtml = goal.journal.length > 0
    ? goal.journal.map(j => {
        const moodObj = MOODS.find(m => m.emoji === j.mood);
        return `
          <div class="gj-entry">
            <div class="gj-entry-head">
              <span class="gj-entry-date">${j.date}</span>
              ${moodObj ? `<span class="gj-entry-mood" title="${moodObj.label}">${moodObj.emoji}</span>` : ''}
            </div>
            <div class="gj-entry-text">${escapeHtml(j.text)}</div>
          </div>`;
      }).join('')
    : '<div class="gj-empty">No check-ins yet. How\'s this goal going?</div>';

  const moodBtns = MOODS.map(m =>
    `<button class="gj-mood-btn" data-mood="${m.emoji}" title="${m.label}">${m.emoji}</button>`
  ).join('');

  const dateLabel = goal.targetDate
    ? new Date(goal.targetDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    : '';

  popup.innerHTML = `
    <div class="gj-header">
      <div style="display:flex;align-items:center;gap:var(--space-2)">
        <div style="width:32px;height:32px;border-radius:var(--radius-md);display:flex;align-items:center;justify-content:center;background:color-mix(in srgb, ${goal.color} 15%, transparent);color:${goal.color}">
          <span class="material-symbols-outlined" style="font-size:1rem">${goal.icon}</span>
        </div>
        <div style="flex:1">
          <div style="font-weight:600;font-size:0.9rem">${escapeHtml(goal.title)}</div>
          <div style="font-size:0.65rem;color:var(--text-tertiary)">
            ${progress}% complete ${dateLabel ? '\u00b7 Due ' + dateLabel : ''}
          </div>
        </div>
      </div>
      <button class="gj-close-btn" id="gjClose">&times;</button>
    </div>
    ${goal.description ? `<div class="gj-desc">${escapeHtml(goal.description)}</div>` : ''}
    <div class="gj-section-label">Check-In Journal</div>
    <div class="gj-list">${journalHtml}</div>
    <div class="gj-section-label" style="margin-top:var(--space-3)">New Check-In</div>
    <div class="gj-mood-row">${moodBtns}</div>
    <textarea class="gj-input" id="gjInput" rows="2" placeholder="How is this goal going? Any wins or struggles..."></textarea>
    <div class="gj-actions">
      <button class="gj-save-btn" id="gjSaveBtn">Log Check-In</button>
    </div>
  `;

  document.body.appendChild(popup);
  popup.style.top = '50%';
  popup.style.left = '50%';
  popup.style.transform = 'translate(-50%, -50%)';
  popup.style.minWidth = '340px';
  popup.style.maxWidth = '440px';

  let selectedMood = '';
  popup.querySelectorAll('.gj-mood-btn').forEach(el => {
    el.addEventListener('click', function() {
      popup.querySelectorAll('.gj-mood-btn').forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      selectedMood = this.dataset.mood;
    });
  });

  document.getElementById('gjSaveBtn').addEventListener('click', function() {
    const text = document.getElementById('gjInput').value.trim();
    if (!text) return;
    addJournalEntry(goalId, text, selectedMood);
    closeGoalPopup();
    showGoalJournalPopup(goalId);
    renderAll();
  });

  document.getElementById('gjClose').addEventListener('click', closeGoalPopup);

  function onKey(e) { if (e.key === 'Escape') closeGoalPopup(); }
  document.addEventListener('keydown', onKey);
  _goalPopup = { popup, onKey };
}

function closeGoalPopup() {
  if (_goalPopup) {
    document.removeEventListener('keydown', _goalPopup.onKey);
    _goalPopup.popup.remove();
    _goalPopup = null;
  }
}

// ─── MANIFESTO ──────────────────────────────────────────────
function renderManifesto() {
  const el = document.getElementById('glManifestoText');
  if (!el) return;
  const text = goalsData.manifesto?.text || getDefaultManifesto().text;
  if (!document.activeElement || document.activeElement !== el) {
    el.innerHTML = `&ldquo;${escapeHtml(text)}&rdquo;`;
  }
}

function saveManifesto() {
  const el = document.getElementById('glManifestoText');
  if (!el) return;
  const raw = el.textContent || '';
  const clean = raw.replace(/^["\u201C\u201D\s]+|["\u201C\u201D\s]+$/g, '');
  goalsData.manifesto = goalsData.manifesto || {};
  goalsData.manifesto.text = clean;
  saveGoals();
}

// ─── RESOLUTIONS ────────────────────────────────────────────
function renderResolutions() {
  const container = document.getElementById('glResolutions');
  if (!container) return;
  const resolutions = getResolutions();
  const isEdit = state.editMode;
  const weekKeys = getWeekKeys();

  const firstWeek = weekKeys[0] ? new Date(weekKeys[0] + 'T00:00:00') : new Date();
  const lastWeek = weekKeys[weekKeys.length - 1] ? new Date(weekKeys[weekKeys.length - 1] + 'T00:00:00') : new Date();
  const monthLabel = firstWeek.toLocaleDateString('en-US', { month: 'short' }) + ' ' +
    firstWeek.toLocaleDateString('en-US', { day: 'numeric' }) + ' \u2013 ' +
    lastWeek.toLocaleDateString('en-US', { month: 'short' }) + ' ' +
    lastWeek.toLocaleDateString('en-US', { day: 'numeric' });

  const totalChecks = resolutions.reduce((s, r) => s + weekKeys.filter(w => r.weekChecks[w]).length, 0);
  const totalPossible = resolutions.length * weekKeys.length;
  const overallPct = totalPossible > 0 ? Math.round((totalChecks / totalPossible) * 100) : 0;

  if (resolutions.length === 0) {
    container.innerHTML = `
      <div class="gl-res-head">
        <div class="gl-res-head-left">
          <span class="gl-res-title-label">Resolutions</span>
          <span class="gl-res-head-badge">0%</span>
        </div>
        <span class="gl-res-head-sub">Weekly commitments</span>
      </div>
      <div class="gl-empty"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg><p>No resolutions yet</p><div class="sub">Add weekly commitments to build consistent habits</div></div>
      ${isEdit ? `<button class="gl-add-resolution-btn" id="glAddResBtn">+ Add Resolution</button>` : ''}`;
    if (isEdit) bindAddResBtn();
    return;
  }

  let html = `
    <div class="gl-res-head">
      <div class="gl-res-head-left">
        <span class="gl-res-title-label">Resolutions</span>
        <span class="gl-res-head-badge">${overallPct}% consistency</span>
      </div>
      <span class="gl-res-head-sub">${monthLabel}</span>
    </div>
  `;

  for (const r of resolutions) {
    const cat = getCategoryMeta(r.category);
    const streak = calcResolutionStreak(r);
    const doneCount = weekKeys.filter(w => r.weekChecks[w]).length;
    const pct = weekKeys.length > 0 ? Math.round((doneCount / weekKeys.length) * 100) : 0;

    const weekDots = weekKeys.map(w => {
      const d = new Date(w + 'T00:00:00');
      const isFuture = d > new Date();
      const checked = r.weekChecks[w];
      let cls = 'gl-res-dot';
      if (isFuture) cls += ' future';
      else if (checked) cls += ' checked';
      else cls += ' empty';
      return `<span class="${cls}" data-res-id="${r.id}" data-week="${w}" title="${w}${checked ? ' \u2713' : isFuture ? ' (ahead)' : ''}"></span>`;
    }).join('');

    html += `
      <div class="gl-res-card" data-res-id="${r.id}">
        <div class="gl-res-row1">
          <span class="gl-res-cat" style="--cat-color:${cat.color}">${cat.label}</span>
          <span class="gl-res-title">${escapeHtml(r.title)}</span>
          <span class="gl-res-stat">Streak <strong>${streak}</strong></span>
          ${isEdit ? `
            <div class="gl-res-actions">
              <button class="gl-res-edit-btn" data-action="edit-res" data-res-id="${r.id}" title="Edit">\u270e</button>
              <button class="gl-res-del-btn" data-action="del-res" data-res-id="${r.id}" title="Delete">\u00d7</button>
            </div>` : ''}
        </div>
        <div class="gl-res-row2">
          <div class="gl-res-bar-wrap">
            <div class="gl-res-bar-track"><div class="gl-res-bar-fill" style="width:${pct}%"></div></div>
          </div>
          <div class="gl-res-grid">${weekDots}</div>
        </div>
      </div>`;
  }

  if (isEdit) {
    html += `<button class="gl-add-resolution-btn" id="glAddResBtn">+ Add Resolution</button>`;
  }

  container.innerHTML = html;

  container.querySelectorAll('.gl-res-dot:not(.future)').forEach(el => {
    el.addEventListener('click', function() {
      if (state.editMode) return;
      toggleResolutionWeek(this.dataset.resId, this.dataset.week);
      renderResolutions();
    });
  });

  container.querySelectorAll('[data-action="edit-res"]').forEach(el => {
    el.addEventListener('click', function(e) { e.stopPropagation(); showResolutionEditPopup(this.dataset.resId, this); });
  });
  container.querySelectorAll('[data-action="del-res"]').forEach(el => {
    el.addEventListener('click', function(e) { e.stopPropagation(); if (confirm('Delete this resolution?')) { deleteResolution(this.dataset.resId); renderResolutions(); } });
  });

  if (isEdit) bindAddResBtn();
}

function bindAddResBtn() {
  const btn = document.getElementById('glAddResBtn');
  if (!btn) return;
  btn.addEventListener('click', function() {
    const r = addResolution({ title: 'New Resolution', category: 'mindful' });
    renderResolutions();
    setTimeout(() => {
      const el = document.querySelector(`[data-action="edit-res"][data-res-id="${r.id}"]`);
      if (el) showResolutionEditPopup(r.id, el);
    }, 100);
  });
}

function showResolutionEditPopup(resId, anchorEl) {
  closeGoalPopup();
  const res = goalsData.resolutions.find(r => r.id === resId);
  if (!res) return;

  const popup = document.createElement('div');
  popup.className = 'gl-edit-popup';

  const catOptions = RESOLUTION_CATEGORIES.map(c =>
    `<option value="${c.id}" ${c.id === res.category ? 'selected' : ''}>${c.label}</option>`
  ).join('');

  popup.innerHTML = `
    <div style="font-size:0.72rem;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;color:var(--text-tertiary);margin-bottom:10px">Edit Resolution</div>
    <input type="text" id="repTitle" value="${escapeHtml(res.title)}" placeholder="Resolution title">
    <div style="margin-bottom:var(--space-2)">
      <label style="font-size:0.6rem;color:var(--text-tertiary);display:block;margin-bottom:4px">Category</label>
      <select id="repCategory">${catOptions}</select>
    </div>
    <div class="gl-edit-popup-actions">
      <button class="danger" id="repDelete">Delete</button>
      <button class="cancel" id="repCancel">Cancel</button>
      <button class="primary" id="repSave">Save</button>
    </div>
  `;

  document.body.appendChild(popup);

  const rect = anchorEl.getBoundingClientRect();
  popup.style.top = Math.min(rect.bottom + 4, window.innerHeight - 260) + 'px';
  popup.style.left = Math.max(8, Math.min(rect.left - 100, window.innerWidth - 280)) + 'px';

  document.getElementById('repSave').addEventListener('click', function() {
    const title = document.getElementById('repTitle').value.trim();
    if (!title) return;
    updateResolution(resId, { title, category: document.getElementById('repCategory').value });
    closeGoalPopup();
    renderResolutions();
  });

  document.getElementById('repCancel').addEventListener('click', closeGoalPopup);

  document.getElementById('repDelete').addEventListener('click', function() {
    if (confirm('Delete this resolution?')) { deleteResolution(resId); closeGoalPopup(); renderResolutions(); }
  });

  function onKey(e) { if (e.key === 'Escape') closeGoalPopup(); }
  document.addEventListener('keydown', onKey);
  _goalPopup = { popup, onKey };
  setTimeout(() => document.getElementById('repTitle')?.focus(), 100);
}

// ─── COUNTS ──────────────────────────────────────────────────
function renderCounts() {
  const goals = getGoals();
  const countEl = document.getElementById('glGoalCount');
  if (countEl) countEl.textContent = `${goals.length} goal${goals.length !== 1 ? 's' : ''}`;

  const metaEl = document.getElementById('glPageMeta');
  if (metaEl) {
    const activeCount = goals.filter(g => g.status !== 'done').length;
    const completedCount = goals.filter(g => g.status === 'done').length;
    if (goals.length === 0) metaEl.textContent = 'Define what matters';
    else if (completedCount === goals.length) metaEl.textContent = 'All goals achieved!';
    else metaEl.textContent = `${activeCount} active · ${completedCount} completed`;
  }

  const heroEl = document.getElementById('glHeroSub');
  if (heroEl) {
    const totalProgress = goals.length > 0
      ? Math.round(goals.reduce((s, g) => s + calcProgress(g), 0) / goals.length)
      : 0;
    const overdueCount = goals.filter(g => g.targetDate && new Date(g.targetDate + 'T23:59:59') < new Date() && calcProgress(g) < 100).length;
    const extra = overdueCount > 0 ? ` · ${overdueCount} overdue` : '';
    heroEl.textContent = goals.length > 0 ? `${totalProgress}% overall${extra}` : 'Track your aspirations';
  }

  // Hero ring
  const ringWrap = document.getElementById('glHeroRingWrap');
  if (ringWrap) {
    const totalProgress = goals.length > 0
      ? Math.round(goals.reduce((s, g) => s + calcProgress(g), 0) / goals.length)
      : 0;
    ringWrap.innerHTML = progressRing(totalProgress, 'var(--primary)', 48) +
      `<div class="gl-hero-ring-label"><strong>${totalProgress}%</strong>overall</div>`;
  }
}

// ─── INIT ──────────────────────────────────────────────────
function init() {
  loadState();
  if (!hasSeenTutorial('goals') && typeof startTutorial === "function") {
    try { setTimeout(function() { startTutorial(GOALS_TUTORIAL_STEPS); }, 300); } catch(e) {}
  }
  applyTheme();
  loadGoals();

  document.querySelectorAll('img[data-image-id]').forEach(el => {
    const url = getImage(el.dataset.imageId) || '';
    el.src = url;
    if (url) {
      el.style.display = 'block';
      const wrap = el.closest('.gl-vision-img-wrap');
      if (wrap) {
        const ph = wrap.querySelector('.gl-vision-img-placeholder');
        if (ph) ph.style.display = 'none';
      }
    }
  });

  const manifestoEl = document.getElementById('glManifestoText');
  if (manifestoEl) {
    manifestoEl.addEventListener('blur', saveManifesto);
    manifestoEl.addEventListener('keydown', function(e) {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); this.blur(); }
      if (e.key === 'Escape') this.blur();
    });
  }

  document.getElementById('themeBtnSidebar')?.addEventListener('click', toggleTheme);

  dom.aiChatBtn = document.getElementById('aiChatBtnSidebar');
  dom.aiChatPanel = document.getElementById('aiChatPanel');
  dom.aiChatOverlay = document.getElementById('aiChatOverlay');
  dom.aiChatMessages = document.getElementById('aiChatMessages');
  dom.aiChatInput = document.getElementById('aiChatInput');
  dom.aiChatInputWrapper = document.getElementById('aiChatInputWrapper');
  dom.aiChatSend = document.getElementById('aiChatSend');
  dom.aiChatClose = document.getElementById('aiChatClose');

  dom.aiChatOverlay?.addEventListener('click', hideAIChat);
  dom.aiChatClose?.addEventListener('click', hideAIChat);
  dom.aiChatSend?.addEventListener('click', sendAIMessage);
  dom.aiChatInput?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendAIMessage(); }
  });
  dom.aiChatBtn?.addEventListener('click', openSettingsBubble);

  const content = document.querySelector('.hub-content');
  if (content) {
    requestAnimationFrame(() => {
      content.classList.add('transitioning-in');
      requestAnimationFrame(() => { content.classList.add('active'); });
    });
  }

  renderAll();

  document.addEventListener('editModeChange', () => renderAll());
}

document.addEventListener('click', function(e) {
  if (!state.editMode) return;
  const imgEl = e.target.closest('img[data-image-id]');
  if (imgEl) openImagePicker(imgEl.dataset.imageId);
});

document.getElementById('exportBtn')?.addEventListener('click', exportData);
document.getElementById('importBtn')?.addEventListener('click', () => document.getElementById('drawerImportFile')?.click());
document.getElementById('focusToggleBtn')?.addEventListener('click', toggleFocusMode);

pageAfterImport = () => { loadGoals(); renderAll(); };

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}