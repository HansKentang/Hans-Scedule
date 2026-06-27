/* ============================================
   Havën Schedule — Goals & Resolutions
   ============================================ */

const GOALS_STORAGE = 'haven-schedule-goals';

// ─── DEFAULT DATA ──────────────────────────────────────────
function getDefaultGoals() {
  return [
    {
      id: 'g1', title: 'Emotional Maturity',
      description: 'Developing self-awareness and regulation through intentional reflection.',
      icon: 'psychology', status: 'active',
      color: '#6366f1',
      tasks: [
        { text: 'Morning meditation (15m)', done: true },
        { text: 'Evening journaling session', done: true },
        { text: 'Bi-weekly therapy integration', done: false },
      ],
    },
    {
      id: 'g2', title: 'Fitness & Vitality',
      description: 'Building a resilient body through consistent movement and nutrition.',
      icon: 'fitness_center', status: 'in-progress',
      color: '#ef4444',
      tasks: [
        { text: '4 workouts per week', done: true },
        { text: 'Meal prep Sundays', done: false },
        { text: 'Reach 10k steps daily', done: false },
      ],
    },
    {
      id: 'g3', title: 'Wealth & Freedom',
      description: 'Securing the future through wise investments and mindful spending.',
      icon: 'account_balance', status: 'milestone',
      color: '#10b981',
      tasks: [
        { text: 'Automated monthly investment', done: true },
        { text: 'Read finance books', done: true },
        { text: 'Review portfolio quarterly', done: false },
      ],
    },
    {
      id: 'g4', title: 'Lifelong Learning',
      description: 'Expanding the mind through diverse subjects and new skills.',
      icon: 'school', status: 'active',
      color: '#f59e0b',
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

// Available material icons for goals
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
  'milestone': { label: 'Milestone Near', cls: 'gl-status-milestone' },
  'done': { label: 'Completed', cls: 'gl-status-done' },
};

// ─── DATA CRUD ──────────────────────────────────────────────
let goalsData = null;

function loadGoals() {
  try {
    const raw = localStorage.getItem(GOALS_STORAGE);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.goals && Array.isArray(parsed.goals)) {
        goalsData = parsed;
        return;
      }
    }
  } catch (e) { /* ignore */ }
  // Migrate from hub content if available
  try {
    const hubRaw = localStorage.getItem('haven-hub-content');
    if (hubRaw) {
      const hub = JSON.parse(hubRaw);
      if (hub.goals && hub.goals.length > 0) {
        goalsData = {
          goals: hub.goals.map((g, i) => ({
            id: 'gm_' + i,
            title: g,
            description: '',
            icon: GOAL_ICONS[i % GOAL_ICONS.length],
            status: 'active',
            color: GOAL_COLORS[i % GOAL_COLORS.length],
            tasks: [],
          })),
          manifesto: hub.quote || getDefaultManifesto(),
        };
        saveGoals();
        return;
      }
    }
  } catch (e) { /* ignore */ }
  goalsData = { goals: getDefaultGoals(), manifesto: getDefaultManifesto() };
  saveGoals();
}

function saveGoals() {
  try {
    localStorage.setItem(GOALS_STORAGE, JSON.stringify(goalsData));
  } catch (e) { /* ignore */ }
}

function getGoals() { return goalsData.goals; }
function getGoal(id) { return goalsData.goals.find(g => g.id === id); }

function addGoal(data) {
  const goal = {
    id: 'g_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    title: data.title || 'New Goal',
    description: data.description || '',
    icon: data.icon || 'star',
    status: data.status || 'active',
    color: data.color || GOAL_COLORS[0],
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
  if (!goal) return;
  if (taskIdx < 0 || taskIdx >= goal.tasks.length) return;
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

// ─── RENDER ──────────────────────────────────────────────────
function renderAll() {
  renderBento();
  renderManifesto();
  renderDive();
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

function renderBento() {
  const container = document.getElementById('glBento');
  if (!container) return;
  const goals = getGoals();
  const isEdit = state.editMode;

  if (goals.length === 0) {
    container.innerHTML = `<div class="gl-empty" style="grid-column:span 12"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg><p>No goals yet</p><div class="sub">Add your first goal to start tracking</div></div>`;
    return;
  }

  let html = '';
  for (let i = 0; i < goals.length; i++) {
    const g = goals[i];
    const progress = calcProgress(g);
    const statusInfo = statusClass(g.status);
    const tasksHtml = g.tasks.map((t, ti) => `
      <div class="gl-task-wrap" style="position:relative">
        <div class="gl-task ${t.done ? 'done' : ''}" data-goal-id="${g.id}" data-task-idx="${ti}">
          <div class="gl-task-check ${t.done ? 'checked' : ''}" data-action="toggle-task" data-goal-id="${g.id}" data-task-idx="${ti}"></div>
          <span class="gl-task-text">${escapeHtml(t.text)}</span>
          ${isEdit ? `<button class="gl-task-del" data-action="del-task" data-goal-id="${g.id}" data-task-idx="${ti}">×</button>` : ''}
        </div>
      </div>
    `).join('');

    const editOverlay = isEdit ? `
      <div class="gl-edit-overlay">
        <button class="gl-edit-item-btn" data-action="edit-goal" data-goal-id="${g.id}" title="Edit goal">✎</button>
        <button class="gl-edit-item-btn del" data-action="del-goal" data-goal-id="${g.id}" title="Delete goal">×</button>
      </div>
    ` : '';

    const size = goals.length <= 3 ? 'gl-card-md' : 'gl-card-sm';

    html += `
      <div class="gl-card ${size}" style="--gl-accent:${g.color}" data-goal-id="${g.id}">
        ${editOverlay}
        <div class="gl-card-header">
          <div class="gl-card-icon"><span class="material-symbols-outlined">${g.icon}</span></div>
          <span class="gl-status-badge ${statusInfo}">${statusLabel(g.status)}</span>
        </div>
        <div class="gl-card-title">${escapeHtml(g.title)}</div>
        ${g.description ? `<div class="gl-card-desc">${escapeHtml(g.description)}</div>` : ''}
        <div class="gl-progress-wrap">
          <div class="gl-progress-header">
            <span class="gl-progress-label">Progress</span>
            <span class="gl-progress-pct">${progress}%</span>
          </div>
          <div class="gl-progress-track">
            <div class="gl-progress-fill" style="width:${progress}%"></div>
          </div>
        </div>
        <div class="gl-tasks">
          ${tasksHtml}
          <button class="gl-add-task-btn" data-action="add-task" data-goal-id="${g.id}">+ Add task</button>
          <input type="text" class="gl-add-task-input" data-goal-id="${g.id}" placeholder="Task description..." data-task-input>
        </div>
      </div>
    `;
  }

  // Add goal button (always visible in edit mode, also as small button in normal mode)
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
  // Toggle task
  container.querySelectorAll('[data-action="toggle-task"]').forEach(el => {
    el.addEventListener('click', function(e) {
      e.stopPropagation();
      toggleGoalTask(this.dataset.goalId, parseInt(this.dataset.taskIdx));
      renderBento();
    });
  });

  // Delete task
  container.querySelectorAll('[data-action="del-task"]').forEach(el => {
    el.addEventListener('click', function(e) {
      e.stopPropagation();
      deleteGoalTask(this.dataset.goalId, parseInt(this.dataset.taskIdx));
      renderAll();
    });
  });

  // Add task button
  container.querySelectorAll('[data-action="add-task"]').forEach(el => {
    el.addEventListener('click', function(e) {
      e.stopPropagation();
      const input = this.parentElement.querySelector('[data-task-input]');
      if (input) {
        input.classList.add('show');
        input.focus();
      }
    });
  });

  // Task input enter/submit
  container.querySelectorAll('[data-task-input]').forEach(el => {
    el.addEventListener('keydown', function(e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        const text = this.value.trim();
        if (text) {
          addGoalTask(this.dataset.goalId, text);
          this.value = '';
          this.classList.remove('show');
          renderAll();
        }
      }
      if (e.key === 'Escape') {
        this.value = '';
        this.classList.remove('show');
      }
    });
    el.addEventListener('blur', function() {
      setTimeout(() => { this.classList.remove('show'); }, 200);
    });
  });

  // Edit goal
  container.querySelectorAll('[data-action="edit-goal"]').forEach(el => {
    el.addEventListener('click', function(e) {
      e.stopPropagation();
      showGoalEditPopup(this.dataset.goalId, this);
    });
  });

  // Delete goal
  container.querySelectorAll('[data-action="del-goal"]').forEach(el => {
    el.addEventListener('click', function(e) {
      e.stopPropagation();
      const id = this.dataset.goalId;
      if (confirm('Delete this goal and all its tasks?')) {
        deleteGoal(id);
        renderAll();
      }
    });
  });

  // Add goal
  const addBtn = document.getElementById('glAddGoalBtn');
  if (addBtn) {
    addBtn.addEventListener('click', function() {
      const g = addGoal({ title: 'New Goal', description: 'Describe this goal...' });
      renderAll();
      // Open edit popup automatically
      setTimeout(() => {
        const el = document.querySelector(`[data-action="edit-goal"][data-goal-id="${g.id}"]`);
        if (el) showGoalEditPopup(g.id, el);
      }, 100);
    });
  }

  // Click card to edit (non-edit mode, just opens quick view)
  if (!isEdit) {
    container.querySelectorAll('.gl-card').forEach(el => {
      el.addEventListener('click', function() {
        const id = this.dataset.goalId;
        if (id) showGoalViewPopup(id);
      });
    });
  }
}

// ─── GOAL EDIT POPUP ──────────────────────────────────────
let _goalEditPopup = null;

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
    <div class="gl-edit-popup-actions">
      <button class="danger" id="gepDelete">Delete</button>
      <button class="cancel" id="gepCancel">Cancel</button>
      <button class="primary" id="gepSave">Save</button>
    </div>
  `;

  document.body.appendChild(popup);

  // Position near anchor
  const rect = anchorEl.getBoundingClientRect();
  popup.style.top = Math.min(rect.bottom + 4, window.innerHeight - 320) + 'px';
  popup.style.left = Math.max(8, Math.min(rect.left - 100, window.innerWidth - 280)) + 'px';

  // Color picker
  popup.querySelectorAll('.gl-color-swatch').forEach(el => {
    el.addEventListener('click', function() {
      popup.querySelectorAll('.gl-color-swatch').forEach(s => s.classList.remove('active'));
      this.classList.add('active');
    });
  });

  // Save
  document.getElementById('gepSave').addEventListener('click', function() {
    const newColor = popup.querySelector('.gl-color-swatch.active')?.dataset.color || goal.color;
    updateGoal(goalId, {
      title: document.getElementById('gepTitle').value.trim() || goal.title,
      description: document.getElementById('gepDesc').value.trim(),
      color: newColor,
      icon: document.getElementById('gepIcon').value,
      status: document.getElementById('gepStatus').value,
    });
    closeGoalPopup();
    renderAll();
  });

  // Cancel
  document.getElementById('gepCancel').addEventListener('click', closeGoalPopup);

  // Delete
  document.getElementById('gepDelete').addEventListener('click', function() {
    if (confirm('Delete this goal?')) {
      deleteGoal(goalId);
      closeGoalPopup();
      renderAll();
    }
  });

  // Close on escape
  function onKey(e) { if (e.key === 'Escape') closeGoalPopup(); }
  document.addEventListener('keydown', onKey);

  _goalEditPopup = { popup, onKey };

  // Focus title
  setTimeout(() => document.getElementById('gepTitle')?.focus(), 100);
}

function closeGoalPopup() {
  if (_goalEditPopup) {
    document.removeEventListener('keydown', _goalEditPopup.onKey);
    _goalEditPopup.popup.remove();
    _goalEditPopup = null;
  }
}

// ─── GOAL VIEW POPUP (quick view in non-edit mode) ────────
function showGoalViewPopup(goalId) {
  closeGoalPopup();
  const goal = getGoal(goalId);
  if (!goal) return;

  const progress = calcProgress(goal);
  const popup = document.createElement('div');
  popup.className = 'gl-edit-popup';
  popup.innerHTML = `
    <div style="display:flex;align-items:center;gap:var(--space-2);margin-bottom:var(--space-3)">
      <div style="width:32px;height:32px;border-radius:var(--radius-md);display:flex;align-items:center;justify-content:center;background:color-mix(in srgb, ${goal.color} 15%, transparent);color:${goal.color}">
        <span class="material-symbols-outlined" style="font-size:1rem">${goal.icon}</span>
      </div>
      <div style="flex:1">
        <div style="font-weight:600;font-size:0.9rem">${escapeHtml(goal.title)}</div>
        <div style="font-size:0.65rem;color:var(--text-tertiary)">${progress}% complete · ${statusLabel(goal.status)}</div>
      </div>
    </div>
    ${goal.description ? `<div style="font-size:0.78rem;color:var(--text-secondary);margin-bottom:var(--space-3);line-height:1.4">${escapeHtml(goal.description)}</div>` : ''}
    <div class="gl-progress-wrap" style="margin-bottom:var(--space-3)">
      <div class="gl-progress-track"><div class="gl-progress-fill" style="width:${progress}%;background:linear-gradient(90deg, ${goal.color}, color-mix(in srgb, ${goal.color} 60%, transparent))"></div></div>
    </div>
    <div style="font-size:0.65rem;font-weight:600;color:var(--text-tertiary);margin-bottom:var(--space-2)">Tasks (${goal.tasks.filter(t=>t.done).length}/${goal.tasks.length})</div>
    ${goal.tasks.length === 0 ? '<div style="font-size:0.72rem;color:var(--text-tertiary);padding:var(--space-2) 0">No tasks yet</div>' : ''}
    ${goal.tasks.map((t, ti) => `
      <div style="display:flex;align-items:center;gap:var(--space-2);padding:var(--space-1) 0;font-size:0.78rem;${t.done ? 'opacity:0.5;text-decoration:line-through' : ''}">
        <span style="color:${t.done ? goal.color : 'var(--text-tertiary)'}">${t.done ? '✓' : '○'}</span>
        <span>${escapeHtml(t.text)}</span>
      </div>
    `).join('')}
    <div class="gl-edit-popup-actions" style="margin-top:var(--space-3)">
      <button class="cancel" id="gepClose">Close</button>
    </div>
  `;

  document.body.appendChild(popup);

  // Center on screen
  popup.style.top = '50%';
  popup.style.left = '50%';
  popup.style.transform = 'translate(-50%, -50%)';

  document.getElementById('gepClose').addEventListener('click', closeGoalPopup);

  function onKey(e) { if (e.key === 'Escape') closeGoalPopup(); }
  document.addEventListener('keydown', onKey);
  _goalEditPopup = { popup, onKey };
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
  const clean = raw.replace(/^["""\u201C\u201D\s]+|["""\u201C\u201D\s]+$/g, '');
  goalsData.manifesto = goalsData.manifesto || {};
  goalsData.manifesto.text = clean;
  saveGoals();
}

// ─── TASK DEEP DIVE ────────────────────────────────────────
function renderDive() {
  const grid = document.getElementById('glDiveGrid');
  if (!grid) return;

  // Find tasks from schedule that might relate to goals
  // Use tag matching and title keyword matching
  const goalTitles = getGoals().map(g => g.title.toLowerCase());
  const goalKeywords = goalTitles.flatMap(t => t.split(/\s+/).filter(w => w.length > 3));

  // Filter relevant tasks from state.tasks
  const allTasks = state.tasks || [];
  const relevant = allTasks.filter(t => {
    if (!t.title) return false;
    const title = t.title.toLowerCase();
    // Match if title contains any goal-related keyword
    return goalKeywords.some(kw => title.includes(kw));
  }).slice(0, 6);

  const countEl = document.getElementById('glDiveCount');
  if (countEl) countEl.textContent = `${relevant.length} related task${relevant.length !== 1 ? 's' : ''}`;

  if (relevant.length === 0) {
    grid.innerHTML = `<div class="gl-empty"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg><p>No related tasks</p><div class="sub">Schedule tasks in the Schedule page linked to your goals.</div></div>`;
    return;
  }

  const tagMeta = (tag) => {
    const m = TAG_COLORS[tag] || TAG_COLORS.meeting;
    return m;
  };

  grid.innerHTML = relevant.map((t, idx) => {
    const meta = tagMeta(t.tag);
    const accentCls = idx % 2 === 0 ? 'gl-accent-primary' : 'gl-accent-secondary';
    return `
      <div class="gl-dive-card ${accentCls}">
        <div class="gl-dive-meta">
          <span style="color:${meta.text}">${TAG_LABELS[t.tag] || t.tag}</span>
          <span class="meta-dot" style="width:3px;height:3px;border-radius:50%;background:var(--text-tertiary);opacity:0.4"></span>
          <span>${t.date || 'No date'}</span>
        </div>
        <div class="gl-dive-card-title">${escapeHtml(t.title)}</div>
        ${t.notes ? `<div class="gl-dive-card-desc">${escapeHtml(t.notes)}</div>` : ''}
      </div>
    `;
  }).join('');
}

// ─── COUNTS ────────────────────────────────────────────────
function renderCounts() {
  const goals = getGoals();
  const countEl = document.getElementById('glGoalCount');
  if (countEl) countEl.textContent = `${goals.length} goal${goals.length !== 1 ? 's' : ''}`;

  const metaEl = document.getElementById('glPageMeta');
  if (metaEl) {
    const activeCount = goals.filter(g => g.status !== 'done').length;
    const completedCount = goals.filter(g => g.status === 'done').length;
    if (goals.length === 0) metaEl.textContent = 'Define what matters';
    else if (completedCount === goals.length) metaEl.textContent = 'All goals achieved! 🎉';
    else metaEl.textContent = `${activeCount} active · ${completedCount} completed`;
  }

  const heroEl = document.getElementById('glHeroSub');
  if (heroEl) {
    const totalProgress = goals.length > 0
      ? Math.round(goals.reduce((s, g) => s + calcProgress(g), 0) / goals.length)
      : 0;
    heroEl.textContent = goals.length > 0 ? `${totalProgress}% overall progress` : 'Track your aspirations';
  }
}

// ─── INIT ──────────────────────────────────────────────────
function init() {
  loadState();
  applyTheme();
  loadGoals();

  // Load images
  document.querySelectorAll('img[data-image-id]').forEach(el => {
    el.src = getImage(el.dataset.imageId) || '';
  });

  // Manifesto save on blur
  const manifestoEl = document.getElementById('glManifestoText');
  if (manifestoEl) {
    manifestoEl.addEventListener('blur', saveManifesto);
    manifestoEl.addEventListener('keydown', function(e) {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.blur();
      }
      if (e.key === 'Escape') this.blur();
    });
  }

  // Sidebar buttons (shared.js handles bcVisualsBtn via delegated click to avoid double-fire)
  document.getElementById('themeBtnSidebar')?.addEventListener('click', toggleTheme);
  document.getElementById('settingsBtnSidebar')?.addEventListener('click', openSettingsDrawer);

  // AI chat setup
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

  // Page transition
  const content = document.querySelector('.hub-content');
  if (content) {
    requestAnimationFrame(() => {
      content.classList.add('transitioning-in');
      requestAnimationFrame(() => { content.classList.add('active'); });
    });
  }

  // Render everything
  renderAll();

  // Re-render on edit mode toggle
  document.addEventListener('editModeChange', () => renderBento());
}

// Edit mode image picker (sidebar handling is in shared.js to avoid double-binding)
// Shared.js handles the edit mode toggle and indicator; we just re-render bento
document.addEventListener('click', function(e) {
  if (!state.editMode) return;
  const imgEl = e.target.closest('img[data-image-id]');
  if (imgEl) openImagePicker(imgEl.dataset.imageId);
});



// Import/export handlers
document.getElementById('exportBtn')?.addEventListener('click', exportData);
document.getElementById('importBtn')?.addEventListener('click', () => document.getElementById('importFileInput')?.click());

// Focus mode
document.getElementById('focusToggleBtn')?.addEventListener('click', toggleFocusMode);

// Page after import
pageAfterImport = () => { loadGoals(); renderAll(); };

// Init on ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
