/* ============================================
   Havën Schedule — Activities Page
   Chronological task list grouped by day
   ============================================ */

// ─── DOM REFS ──────────────────────────────────────────────
const activitiesList = document.getElementById('activitiesList');
const actTagFilter = document.getElementById('actTagFilter');
const actDateFilter = document.getElementById('actDateFilter');

pageAfterTaskSave = () => { renderActivities(); };
pageAfterImport = () => { renderActivities(); };

// ─── RENDER ────────────────────────────────────────────────
function renderActivities() {
  if (!activitiesList) return;
  let tasks = state.tasks.filter(t => !isWhiteboardTask(t));
  const tagFilter = actTagFilter?.value || '';
  const dateFilter = actDateFilter?.value || 'all';

  if (tagFilter) tasks = tasks.filter(t => t.tag === tagFilter);

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

  if (tasks.length === 0) {
    activitiesList.innerHTML = `<div class="act-empty">
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>
      <p>No activities found</p>
      <p class="sub">Try changing your filter or create tasks in the Schedule view</p>
    </div>`;
    return;
  }

  // Group by day
  const groups = [];
  let currentDate = null;
  let currentGroup = null;

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
    const dayLabel = isToday(d) ? 'Today' : getDayName(d, false);
    const dateLabel = `${dayLabel}, ${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
    const isPast = d < new Date(new Date().toDateString());

    html += `<div class="act-day">
      <div class="act-day-stamp">
        <span class="act-day-label">${dateLabel}</span>
        <span class="act-day-meta">
          <span class="act-day-dot${isToday(d) ? ' today' : isPast ? ' past' : ''}"></span>
          ${group.tasks.length} tasks
        </span>
      </div>`;

    for (const task of group.tasks) {
      const meta = getTagMeta(task.tag);
      const isCompleted = task.completed;
      html += `<div class="act-card tag-${task.tag}${isCompleted ? ' completed' : ''}" data-task-id="${task.id}">
        <div class="act-card-time">${task.startTime}<br>${task.endTime}</div>
        <div class="act-card-body">
          <div class="act-card-header">
            <span class="act-card-check${isCompleted ? ' checked' : ''}" data-toggle-complete="${task.id}"></span>
            <span class="act-card-title">${escapeHtml(task.title)}</span>
            <span class="act-card-tag" style="background:color-mix(in srgb, ${meta.text} 15%, transparent);color:${meta.text}">${task.tag}</span>
          </div>
          ${task.notes ? `<div class="act-card-notes">${escapeHtml(task.notes)}</div>` : ''}
        </div>
        <button class="act-card-del" data-task-id="${task.id}" title="Delete">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>`;
    }
    html += '</div>';
  }

  activitiesList.innerHTML = html;

  // Fit text to activity cards
  requestAnimationFrame(() => { fitTextAll('.act-card', 14, 9); });

  // Event listeners
  activitiesList.querySelectorAll('.act-card').forEach(el => {
    const taskId = el.dataset.taskId;
    el.addEventListener('click', (e) => {
      if (e.target.closest('.act-card-check')) return;
      if (e.target.closest('.act-card-del')) return;
      openTaskModal(taskId);
    });
  });

  activitiesList.querySelectorAll('.act-card-check').forEach(el => {
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      const tid = el.dataset.toggleComplete;
      toggleComplete(tid);
      renderActivities();
    });
  });

  activitiesList.querySelectorAll('.act-card-del').forEach(el => {
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      const tid = el.dataset.taskId;
      deleteTask(tid);
      renderActivities();
    });
  });
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

  // Update task count in page header
  function updateActCount() {
    const el = document.getElementById('actPageCount');
    const hero = document.getElementById('actHeroCount');
    const count = state.tasks.filter(t => !isWhiteboardTask(t)).length;
    if (el) el.textContent = `${count} tasks`;
    if (hero) hero.textContent = `${count} tasks`;
  }
  // Override pageAfterTaskSave to also update count
  const originalSave = pageAfterTaskSave;
  pageAfterTaskSave = () => { if (typeof originalSave === 'function') originalSave(); updateActCount(); };
  updateActCount();
}

// ─── INIT ──────────────────────────────────────────────────
function init() {
  loadState();
  applyTheme();
  document.querySelectorAll('img[data-image-id]').forEach(el => { el.src = getImage(el.dataset.imageId) || ''; });
  renderActivities();

  actTagFilter?.addEventListener('change', renderActivities);
  actDateFilter?.addEventListener('change', renderActivities);

  setupPage();
  document.getElementById('exportBtn')?.addEventListener('click', exportData);
  document.getElementById('importBtn')?.addEventListener('click', () => { document.getElementById('importFileInput')?.click(); });
  spInit();
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
else init();
