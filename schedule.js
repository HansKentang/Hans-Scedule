/* ============================================
   Havën Schedule — Schedule Page (Week Grid)
   ============================================ */

// ─── VIEW STATE ────────────────────────────────────────────
let currentView = 'week'; // 'week' | 'month' | 'agenda'
let currentMonthDate = new Date();

// ─── DOM REFS (page-specific) ──────────────────────────────
dom.grid          = $('#calendarGrid');
dom.container     = $('#calendarContainer');
dom.weekLabel     = $('#weekLabel');
dom.weekLabelHero = $('#weekLabelHero');
dom.taskCount     = $('#taskCount');
dom.localTz       = $('#localTz');
dom.utcTz         = $('#utcTz');

dom.cmdOverlay    = $('#cmdOverlay');
dom.cmdPalette    = $('#cmdPalette');
dom.cmdInput      = $('#cmdInput');
dom.cmdResults    = $('#cmdResults');
dom.cmdBtn        = $('#cmdBtn');
dom.cmdPaletteBtn = $('#cmdPaletteBtn');

dom.taskOverlay    = $('#taskOverlay');
dom.taskModal      = $('#taskModal');
dom.taskModalTitle = $('#taskModalTitle');
dom.taskForm       = $('#taskForm');
dom.taskTitle      = $('#taskTitle');
dom.taskDate       = $('#taskDate');
dom.taskStart      = $('#taskStart');
dom.taskEnd        = $('#taskEnd');
dom.taskTag        = $('#taskTag');
dom.taskNotes      = $('#taskNotes');
dom.taskSaveBtn    = $('#taskSaveBtn');
dom.taskCancelBtn  = $('#taskCancelBtn');
dom.taskDeleteBtn  = $('#taskDeleteBtn');
dom.taskModalClose = $('#taskModalClose');
dom.taskRepeat = $('#taskRepeat');
dom.taskReminder = $('#taskReminder');

dom.filterSearchInput = $('#filterSearchInput');
dom.filterSearchClear = $('#filterSearchClear');
dom.todayBtn       = $('#todayBtn');
dom.prevWeek       = $('#prevWeek');
dom.nextWeek       = $('#nextWeek');
dom.quickTaskBtn   = $('#quickTaskBtn');
dom.dailyChart     = $('#dailyChart');
dom.apiStatus      = $('#apiStatus');
dom.apiStatusText  = $('#apiStatusText');
dom.tzTooltip      = $('#tzTooltip');
dom.addIdeaBtn     = $('#addIdeaBtn');
dom.filterTagList  = $('#filterTagList');
dom.filterShowWeekends = $('#filterShowWeekends');
dom.filterShowCompleted = $('#filterShowCompleted');
dom.filterTodayBtn = $('#filterTodayBtn');
  dom.whiteboardList = $('#whiteboardList');
  dom.themeBtn       = $('#themeBtnSidebar');
  dom.settingsBtn    = $('#settingsBtnSidebar');
  dom.helpBtn        = $('#helpBtn');
  dom.helpOverlay    = $('#helpOverlay');
  dom.helpModal      = $('#helpModal');
  dom.helpModalClose = $('#helpModalClose');
  dom.exportDataBtn  = $('#exportDataBtn');
  dom.importDataBtn  = $('#importDataBtn');
  dom.importFileInput= $('#importFileInput');
  dom.aiChatBtn      = $('#aiChatBtnSidebar');
  dom.aiChatPanel    = $('#aiChatPanel');
  dom.aiChatOverlay  = $('#aiChatOverlay');
  dom.aiChatMessages = $('#aiChatMessages');
  dom.aiChatInput    = $('#aiChatInput');
  dom.aiChatInputWrapper = $('#aiChatInputWrapper');
  dom.aiChatSend     = $('#aiChatSend');
  dom.aiChatClose    = $('#aiChatClose');

// Unified drag state — handles task-reschedule, whiteboard→grid, quick-add→grid
let gridDrag = null;

// Resize state — handles task card bottom-edge resize
let resizeState = null;

// ─── PAGE CALLBACKS (called from shared.js) ─────────────────
pageAfterTaskSave = () => { renderCalendar(); renderWhiteboard(); };
pageAfterImport = () => { renderCalendar(); renderWhiteboard(); };

// ─── API STATUS ────────────────────────────────────────────
function updateApiStatus() {
  const hasKey = state.apiKey && state.apiKey.length > 0;
  dom.apiStatus?.classList.toggle('active', hasKey);
  if (dom.apiStatusText) dom.apiStatusText.textContent = hasKey ? 'AI ready' : 'No key';
}

// ─── VIEW SWITCH ──────────────────────────────────────────
function switchView(view) {
  currentView = view;
  $$('.view-toggle-btn').forEach(b => b.classList.toggle('active', b.dataset.view === view));
  renderCalendar();
}

// ─── TZ DISPLAY ────────────────────────────────────────────
function updateTzDisplay() {
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const offset = -new Date().getTimezoneOffset();
  const sign = offset >= 0 ? '+' : '-';
  const hours = String(Math.floor(Math.abs(offset) / 60)).padStart(2, '0');
  const mins = String(Math.abs(offset) % 60).padStart(2, '0');
  if (dom.localTz) dom.localTz.textContent = `${tz} (UTC${sign}${hours}:${mins})`;
  if (dom.utcTz) dom.utcTz.textContent = `UTC${sign}${hours}:${mins}`;
}

// ─── DAILY CHART ────────────────────────────────────────────
function renderChart() {
  if (!dom.dailyChart) return;
  const today = formatDate(new Date());
  const todayTasks = state.tasks.filter(t => t.date === today && !t.completed);

  if (todayTasks.length === 0) {
    dom.dailyChart.innerHTML = '<div class="chart-empty">No tasks today</div>';
    return;
  }

  const tagMinutes = {};
  for (const tag of TAG_ORDER) tagMinutes[tag] = 0;
  for (const task of todayTasks) {
    const start = parseTime(task.startTime);
    const end = parseTime(task.endTime) || start + 60;
    const dur = Math.max(end - start, SNAP_MINUTES);
    if (tagMinutes[task.tag] !== undefined) tagMinutes[task.tag] += dur;
  }

  const total = Object.values(tagMinutes).reduce((a, b) => a + b, 0);
  if (total === 0) { dom.dailyChart.innerHTML = '<div class="chart-empty">No tasks today</div>'; return; }

  const formatHrs = (mins) => {
    const h = Math.floor(mins / 60); const m = mins % 60;
    if (h === 0) return `${m}m`; if (m === 0) return `${h}h`; return `${h}h ${m}m`;
  };

  let html = '<div class="chart-bar-group">';
  for (const tag of TAG_ORDER) {
    const mins = tagMinutes[tag]; if (mins === 0) continue;
    const pct = Math.round((mins / total) * 100);
    html += `<div class="chart-bar-row"><span class="chart-bar-label">${TAG_LABELS[tag].slice(0, 4)}</span>
      <div class="chart-bar-track"><div class="chart-bar-fill ${tag}" style="width:${pct}%"></div></div>
      <span class="chart-bar-value">${formatHrs(mins)}</span></div>`;
  }
  html += `</div><div class="chart-total">Total <span>${formatHrs(total)}</span></div>`;
  dom.dailyChart.innerHTML = html;
}

// ─── CALENDAR RENDERING ────────────────────────────────────
function renderMiniWeek() {
  const mini = document.getElementById('miniWeekDays');
  if (!mini) return;
  const ws = state.currentWeekStart;
  const todayStr = formatDate(new Date());
  let html = '';
  for (let i = 0; i < 7; i++) {
    const d = addDays(ws, i);
    const ds = formatDate(d);
    const cls = ['sch-mini-day'];
    if (ds === todayStr) cls.push('today');
    const dayTasks = state.tasks.filter(t => t.date === ds && !isWhiteboardTask(t) && !t.completed);
    if (dayTasks.length > 0) cls.push('has-tasks');
    html += `<span class="${cls.join(' ')}">${d.toLocaleDateString('en-US', { weekday: 'narrow' })}</span>`;
  }
  mini.innerHTML = html;
  // Click to navigate to that day's week
  mini.querySelectorAll('.sch-mini-day').forEach((el, i) => {
    el.addEventListener('click', () => {
      const ws = state.currentWeekStart;
      const target = addDays(ws, i);
      // Only navigate if clicking a different week
      if (formatDate(target) !== formatDate(ws)) {
        state.currentWeekStart = getMonday(target);
        renderCalendar();
      }
    });
  });
}

function renderCalendar() {
  if (currentView === 'month') return renderMonthView();
  if (currentView === 'agenda') return renderAgendaView();
  renderWeekView();
}

function renderWeekView() {
  const weekStart = state.currentWeekStart;
  const days = getWeekRange(weekStart);
  let html = '';
  const visibleDays = state.showWeekends ? days : days.filter(d => !isWeekend(d));
  const colCount = visibleDays.length;
  dom.grid.style.gridTemplateColumns = `var(--time-axis-width) repeat(${colCount}, 1fr)`;

  html += '<div class="day-header time-axis-header"></div>';
  for (const day of visibleDays) {
    const cls = ['day-header'];
    if (isToday(day)) cls.push('today');
    if (isWeekend(day)) cls.push('weekend');
    html += `<div class="${cls.join(' ')}" data-date="${formatDate(day)}">
      <span class="day-name">${getDayName(day, true)}</span>
      <span class="day-number">${day.getDate()}</span></div>`;
  }

  for (let h = START_HOUR; h < START_HOUR + VISIBLE_HOURS; h++) {
    const disp = h % 12 === 0 ? 12 : h % 12;
    const ampm = h < 12 ? 'AM' : 'PM';
    const timeMins = h * 60;
    html += `<div class="time-axis time-slot${h % 2 === 0 ? '' : ' time-alt'}" data-time="${timeMins}" data-hour="${h}">
      <span>${disp} ${ampm}</span><span class="half-hour-marker"></span></div>`;
    for (const day of visibleDays) {
      const cls = ['day-column', 'hour-slot'];
      if (isWeekend(day)) cls.push('weekend');
      if (isToday(day)) cls.push('today-column');
      if (h % 2 !== 0) cls.push('hour-alt');
      html += `<div class="${cls.join(' ')}" data-date="${formatDate(day)}" data-time="${timeMins}" data-hour="${h}">
        <span class="half-hour-line"></span></div>`;
    }
  }

  dom.grid.innerHTML = html;
  renderTasks();
  renderCurrentTime();

  const firstDay = days[0];
  const lastDay = days[6];
  const monthLabel = formatDateLabel(firstDay);
  if (firstDay.getMonth() !== lastDay.getMonth()) {
    const endLabel = lastDay.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
    dom.weekLabel.textContent = `${monthLabel} – ${endLabel}`;
    if (dom.weekLabelHero) dom.weekLabelHero.textContent = dom.weekLabel.textContent;
  } else {
    dom.weekLabel.textContent = `${monthLabel.slice(0, -5)} ${firstDay.getDate()} – ${lastDay.getDate()}, ${firstDay.getFullYear()}`;
    if (dom.weekLabelHero) dom.weekLabelHero.textContent = dom.weekLabel.textContent;
  }
  dom.taskCount.textContent = state.tasks.filter(t => !isWhiteboardTask(t)).length;
  renderMiniWeek();
  attachSlotHandlersWithCreate();
  renderChart();
  renderWhiteboard();
}

// ─── MONTH VIEW ────────────────────────────────────────────
function renderMonthView() {
  const now = new Date();
  const year = currentMonthDate.getFullYear();
  const month = currentMonthDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startPad = firstDay.getDay();
  const totalCells = startPad + lastDay.getDate();
  const rows = Math.ceil(totalCells / 7);

  // Expand recurring tasks for this month
  const monthStart = new Date(year, month, 0);
  const monthEnd = new Date(year, month + 1, 1);
  const allTasks = expandRecurringTasks(monthStart, monthEnd);

  const todayStr = formatDate(now);
  const title = firstDay.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  dom.weekLabel.textContent = title;
  if (dom.weekLabelHero) dom.weekLabelHero.textContent = title;
  dom.taskCount.textContent = state.tasks.filter(t => !isWhiteboardTask(t)).length;

  dom.grid.style.gridTemplateColumns = 'repeat(7, 1fr)';
  let html = '';
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  for (const dn of dayNames) {
    html += `<div class="day-header" style="border-left:1px solid var(--border-subtle);background:var(--bg-secondary)">
      <span class="day-name">${dn}</span></div>`;
  }

  let dayCount = 1;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < 7; c++) {
      const idx = r * 7 + c;
      if (idx < startPad || dayCount > lastDay.getDate()) {
        html += `<div class="month-cell month-cell-empty"></div>`;
        continue;
      }
      const d = new Date(year, month, dayCount);
      const ds = formatDate(d);
      const cls = ['month-cell'];
      if (ds === todayStr) cls.push('month-today');
      if (isWeekend(d)) cls.push('month-weekend');

      // Gather tasks for this day (filter by tag, search, completed)
      const dayTasks = allTasks.filter(t => t.date === ds && !isWhiteboardTask(t));
      const filtered = dayTasks.filter(t => {
        if (!state.showCompleted && t.completed) return false;
        if (state.selectedTag && t.tag !== state.selectedTag) return false;
        return true;
      });
      const count = filtered.length;

      html += `<div class="${cls.join(' ')}" data-date="${ds}">
        <span class="month-day-num">${dayCount}</span>
        <div class="month-tasks">`;
      // Show up to 3 mini task labels
      for (let i = 0; i < Math.min(filtered.length, 3); i++) {
        const t = filtered[i];
        const meta = TAG_COLORS[t.tag] || TAG_COLORS.meeting;
        const doneCls = t.completed ? 'month-task-done' : '';
        html += `<div class="month-task ${doneCls}" style="--mtag:${meta.text}" title="${escapeHtml(t.title)}">${escapeHtml(t.title)}</div>`;
      }
      if (filtered.length > 3) {
        html += `<div class="month-task-more">+${filtered.length - 3} more</div>`;
      }
      html += `</div></div>`;
      dayCount++;
    }
  }

  dom.grid.innerHTML = html;

  // Attach click handlers
  dom.grid.querySelectorAll('.month-cell:not(.month-cell-empty)').forEach(cell => {
    cell.addEventListener('click', () => {
      const date = cell.dataset.date;
      const mins = 9 * 60;
      instantCreateTask(date, mins);
    });
    cell.addEventListener('dblclick', () => {
      const date = cell.dataset.date;
      const d = new Date(date + 'T12:00:00');
      // Navigate to that week
      state.currentWeekStart = getMonday(d);
      switchView('week');
    });
  });

  renderMiniWeek();
  renderChart();
  renderWhiteboard();
}

// ─── AGENDA VIEW ───────────────────────────────────────────
function renderAgendaView() {
  const weekStart = state.currentWeekStart;
  const weekEnd = addDays(weekStart, 7);
  const now = new Date();
  const todayStr = formatDate(now);

  // Expand recurring tasks for this week
  const allTasks = expandRecurringTasks(
    new Date(weekStart.getTime() - 86400000),
    new Date(weekEnd.getTime() + 86400000)
  );

  // Filter to this week
  const dayTasks = {};
  for (let i = 0; i < 7; i++) {
    const d = addDays(weekStart, i);
    if (!state.showWeekends && isWeekend(d)) continue;
    const ds = formatDate(d);
    dayTasks[ds] = allTasks.filter(t => {
      if (isWhiteboardTask(t)) return false;
      if (t.date !== ds) return false;
      if (!state.showCompleted && t.completed) return false;
      if (state.selectedTag && t.tag !== state.selectedTag) return false;
      return true;
    });
  }

  const firstDay = weekStart;
  const lastDay = addDays(weekStart, 6);
  const monthLabel = formatDateLabel(firstDay);
  let label;
  if (firstDay.getMonth() !== lastDay.getMonth()) {
    const endLabel = lastDay.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
    label = `${monthLabel} – ${endLabel}`;
  } else {
    label = `${monthLabel.slice(0, -5)} ${firstDay.getDate()} – ${lastDay.getDate()}, ${firstDay.getFullYear()}`;
  }
  dom.weekLabel.textContent = label;
  if (dom.weekLabelHero) dom.weekLabelHero.textContent = label;
  dom.taskCount.textContent = state.tasks.filter(t => !isWhiteboardTask(t)).length;

  dom.grid.style.gridTemplateColumns = '1fr';
  let html = '';

  for (const [date, tasks] of Object.entries(dayTasks)) {
    const d = new Date(date + 'T12:00:00');
    const dayLabel = d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
    const isT = date === todayStr;
    const cls = ['agenda-day'];
    if (isT) cls.push('agenda-today');

    html += `<div class="${cls.join(' ')}" data-date="${date}">
      <div class="agenda-day-header">
        <span class="agenda-day-label">${dayLabel}</span>
        <span class="agenda-day-count">${tasks.length} task${tasks.length !== 1 ? 's' : ''}</span>
      </div>`;

    if (tasks.length === 0) {
      html += `<div class="agenda-empty">No tasks</div>`;
    } else {
      tasks.sort((a, b) => parseTime(a.startTime) - parseTime(b.startTime));
      for (const task of tasks) {
        const meta = TAG_COLORS[task.tag] || TAG_COLORS.meeting;
        const doneCls = task.completed ? 'agenda-task-done' : '';
        const repeatIcon = task.repeat && task.repeat.type !== 'none' ? ' 🔄' : '';
        html += `<div class="agenda-task ${doneCls}" data-task-id="${task.id}">
          <div class="agenda-task-time">
            <span class="agenda-task-start">${formatTimeRange(task.startTime, task.endTime)}</span>
          </div>
          <div class="agenda-task-body">
            <div class="agenda-task-title">
              <span class="task-check ${task.completed ? 'checked' : ''}" data-toggle-complete="${task.id}"></span>
              ${escapeHtml(task.title)}${repeatIcon}
            </div>
            <div class="agenda-task-meta">
              <span class="agenda-tag" style="color:${meta.text};background:color-mix(in srgb, ${meta.text} 15%, transparent)">${task.tag}</span>
              ${task.notes ? `<span class="agenda-notes">${escapeHtml(task.notes.slice(0, 60))}${task.notes.length > 60 ? '…' : ''}</span>` : ''}
            </div>
          </div>
          <button class="agenda-delete" data-task-id="${task.id}" title="Delete">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>`;
      }
    }
    html += `</div>`;
  }

  dom.grid.innerHTML = html;

  // Event handlers
  dom.grid.querySelectorAll('.agenda-task').forEach(el => {
    el.addEventListener('click', (e) => {
      if (e.target.closest('[data-toggle-complete]')) {
        const id = e.target.closest('[data-toggle-complete]').dataset.toggleComplete;
        const task = getTask(id);
        if (task) updateTask(id, { completed: !task.completed });
        return;
      }
      if (e.target.closest('.agenda-delete')) {
        const id = e.target.closest('.agenda-delete').dataset.taskId;
        deleteTask(id);
        return;
      }
      const id = el.dataset.taskId;
      if (id) openTaskModal(id);
    });
  });

  renderMiniWeek();
  renderChart();
  renderWhiteboard();
}

function renderTasks() {
  $$('.calendar-task').forEach(el => el.remove());
  $$('.current-time-line').forEach(el => el.remove());

  // Search query
  const searchQ = (state.searchQuery || '').toLowerCase().trim();

  // Expand recurring tasks for the visible week
  const ws = state.currentWeekStart;
  const we = addDays(ws, 7);
  const expanded = expandRecurringTasks(ws, we);

  const filtered = expanded.filter(t => {
    if (isWhiteboardTask(t)) return false;
    if (state.selectedTag && t.tag !== state.selectedTag) return false;
    if (searchQ) {
      const inTitle = t.title.toLowerCase().includes(searchQ);
      const inTag = t.tag.toLowerCase().includes(searchQ);
      const inNotes = (t.notes || '').toLowerCase().includes(searchQ);
      const inDate = t.date.includes(searchQ);
      if (!inTitle && !inTag && !inNotes && !inDate) return false;
    }
    return true;
  });

  // Use actual rendered hour height for pixel-perfect positioning
  const actualHH = dom.grid.querySelector('.day-column')?.getBoundingClientRect().height || HOUR_HEIGHT;

  // Group tasks by date for overlap detection
  const tasksByDate = {};
  for (const task of filtered) {
    const td = new Date(task.date + 'T' + task.startTime);
    if (td < ws || td >= we) continue;
    if (!state.showWeekends && isWeekend(td)) continue;

    if (!tasksByDate[task.date]) tasksByDate[task.date] = [];
    tasksByDate[task.date].push(task);
  }

  // Render each day's tasks with overlap layout
  for (const [date, dateTasks] of Object.entries(tasksByDate)) {
    const col = dom.grid.querySelector(`.day-column[data-date="${date}"]`);
    if (!col) continue;

    // Build task entries with parsed times for overlap detection
    const taskEntries = dateTasks.map(t => ({
      task: t,
      start: parseTime(t.startTime),
      end: parseTime(t.endTime) || parseTime(t.startTime) + 60,
    }));
    // Sort by start time, then longer duration first
    taskEntries.sort((a, b) => a.start - b.start || (b.end - b.start) - (a.end - a.start));

    // Stack overlapping cards full-width, increasing z-index per overlap group
    // Each overlapping chain gets a unique group z-index so overlapping cards sit on top of each other
    const zStack = [];
    for (let i = 0; i < taskEntries.length; i++) {
      let group = i;
      for (let j = 0; j < i; j++) {
        if (taskEntries[j].start < taskEntries[i].end && taskEntries[i].start < taskEntries[j].end) {
          group = Math.min(group, zStack[j]);
        }
      }
      zStack[i] = group;
    }

    for (let i = 0; i < taskEntries.length; i++) {
      const { task, start: startM, end: endM } = taskEntries[i];
      const dur = Math.max(endM - startM, SNAP_MINUTES);
      const top = ((startM - START_HOUR * 60) / 60) * actualHH;
      const height = (dur / 60) * actualHH;
      // z-index: base of 5 + group + position in sort (last on top)
      const zIdx = `;z-index:${5 + zStack[i]}`;
      const restoreZ = 5 + zStack[i];

      const meta = TAG_COLORS[task.tag] || TAG_COLORS.meeting;
      const cls = ['calendar-task', `tag-${task.tag}`];
      if (task.completed) cls.push('completed');
      if (dur <= 60) cls.push('task-sm');
      if (task.priority) cls.push(`priority-${task.priority}`);

      const el = document.createElement('div');
      el.className = cls.join(' ');
      el.dataset.taskId = task.id;
      el.style.cssText = `top:${top}px;height:${height}px;left:5px;width:calc(100% - 10px)${zIdx}`;
      el.dataset.restoreZ = restoreZ;
      const checked = task.completed ? ' checked' : '';
      el.innerHTML = `          <div class="task-title">
          <span class="task-check${checked}" data-toggle-complete="${task.id}"></span>
          ${escapeHtml(task.title)}
        </div>
        <div class="task-time">${formatTimeRange(task.startTime, task.endTime)}</div>
        <span class="task-tag-badge">${task.tag}</span>
        ${task.priority && task.priority < 3 ? `<span class="priority-badge p${task.priority}">${PRIORITY_SHORT[task.priority]}</span>` : ''}
        <div class="task-resize-handle" data-task-id="${task.id}" title="Drag to resize"></div>`;

      const resolvedId = resolveTaskId(task.id);
      el.addEventListener('mousedown', (e) => {
        if (e.target.closest('[data-toggle-complete]')) return;
        if (e.target.closest('.task-resize-handle')) return;
        e.stopPropagation();
        startDrag(e, el);
      });
      el.addEventListener('dblclick', (e) => { e.stopPropagation(); openTaskModal(resolvedId); });
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        const check = e.target.closest('[data-toggle-complete]');
        if (check) {
          const tid = resolveTaskId(check.dataset.toggleComplete);
          const taskObj = getTask(tid);
          if (taskObj) updateTask(tid, { completed: !taskObj.completed });
        }
      });
      col.appendChild(el);
    }
  }

  // Attach resize handle event listeners
  $$('.task-resize-handle').forEach(h => {
    h.addEventListener('mousedown', onResizeStart);
  });

  // Bring hovered card to front so resize handle is accessible over overlapping cards
  $$('.calendar-task').forEach(el => {
    el.addEventListener('mouseenter', () => {
      el.style.zIndex = '200';
    });
    el.addEventListener('mouseleave', () => {
      el.style.zIndex = el.dataset.restoreZ || '';
    });
  });

  // Fit text to task cards
  requestAnimationFrame(() => { fitTextAll('.calendar-task', 13, 8); });

  // Show empty state if no tasks visible
  showGridEmptyState(filtered.length);
}

function showGridEmptyState(count) {
  const existing = dom.grid.querySelector('.grid-empty-state');
  if (existing) existing.remove();
  if (count > 0 || currentView !== 'week') return;
  const firstCol = dom.grid.querySelector('.day-column');
  if (!firstCol) return;
  const el = document.createElement('div');
  el.className = 'grid-empty-state';
  el.innerHTML = '<span>No tasks this week</span><small>Click any slot or use <kbd>Ctrl+K</kbd> to add one</small>';
  firstCol.appendChild(el);
}

function renderCurrentTime() {
  const now = new Date();
  const col = dom.grid.querySelector(`.day-column[data-date="${formatDate(now)}"]`);
  if (!col) return;
  const mins = now.getHours() * 60 + now.getMinutes();
  const actualHH = dom.grid.querySelector('.day-column')?.getBoundingClientRect().height || HOUR_HEIGHT;
  const top = ((mins - START_HOUR * 60) / 60) * actualHH;
  if (mins >= START_HOUR * 60 && mins < (START_HOUR + VISIBLE_HOURS) * 60) {
    const line = document.createElement('div');
    line.className = 'current-time-line';
    line.style.top = `${top}px`;
    col.appendChild(line);
  }
}



// Instant create — click any empty slot to create a 1-hour task right away
function instantCreateTask(date, timeMins) {
  pushUndo();
  const snap = roundToNearest(timeMins, SNAP_MINUTES);
  // Smart tag guess based on time of day
  const hour = Math.floor(snap / 60);
  let tag = 'meeting';
  let title = 'New Task';
  if (hour < 9) { tag = 'deep-work'; title = 'Deep Work Session'; }
  else if (hour >= 6 && hour < 8) { tag = 'exercise'; title = 'Morning Workout'; }
  else if (hour >= 12 && hour < 13) { tag = 'hobby'; title = 'Break'; }
  else if (hour >= 17) { tag = 'hobby'; title = 'Personal Time'; }

  // Use learning engine for smarter defaults if available
  const preferredTag = getPreferredTag();
  if (preferredTag && hour >= 9 && hour < 17 && hour !== 12) {
    // Use the user's most common tag for this time range
    const preferredTime = getPreferredTime(preferredTag);
    if (preferredTime) {
      const prefH = parseInt(preferredTime.split(':')[0]);
      if (Math.abs(prefH - hour) <= 1) {
        tag = preferredTag;
        const preferredTitle = getPreferredTitle(tag);
        if (preferredTitle) title = preferredTitle;
      }
    }
  }

  const task = createTask({
    title,
    date,
    startTime: toTimeStr(snap),
    endTime: toTimeStr(snap + 60),
    tag,
  });
  pageAfterTaskSave();
  flashTaskOnGrid(task.id);
  showToast(`Created <strong>${escapeHtml(title)}</strong> — <span style="cursor:pointer;text-decoration:underline" onclick="openTaskModal('${task.id}')">edit</span>`, 'success', 3000);
}

// ─── UNIFIED DRAG AND DROP ────────────────────────────────
// One handler for all: task-reschedule, whiteboard→grid, quick-add→grid
function startDrag(e, source) {
  if (e.button !== 0) return;
  e.preventDefault();

  // Clean up any lingering bounce animations from previous drops
  $$('.calendar-task.task-drop-bounce').forEach(el => el.classList.remove('task-drop-bounce'));

  const rect = source.getBoundingClientRect();
  const ghost = source.cloneNode(true);
  ghost.classList.add('grid-drag-ghost');
  ghost.style.cssText = `left:${rect.left}px;top:${rect.top}px;width:${rect.width}px;`;
  document.body.appendChild(ghost);

  gridDrag = {
    type: 'task',
    source,
    ghost,
    offX: e.clientX - rect.left,
    offY: e.clientY - rect.top,
    dropDate: null,
    dropTime: null,
    moved: false,
  };

  // If dragging an existing task, store original values
  const taskEl = source.closest('.calendar-task');
  if (taskEl && taskEl.dataset.taskId) {
    const task = getTask(taskEl.dataset.taskId);
    if (task) {
      gridDrag.type = 'reschedule';
      gridDrag.taskId = task.id;
      gridDrag.dragStartM = parseTime(task.startTime);
      gridDrag.dragEndM = parseTime(task.endTime) || parseTime(task.startTime) + 60;
      gridDrag.startDate = task.date;
      gridDrag.startTime = task.startTime;
    }
  }

  // If dragging a quick-add pill, store tag
  const pill = source.closest('.sch-quickadd-pill');
  if (pill && pill.dataset.tag) {
    gridDrag.type = 'quickadd';
    gridDrag.tag = pill.dataset.tag;
    gridDrag.duration = 60; // default 1 hour
    ghost.innerHTML = `<span class="gg-plus">+</span> ${QUICK_ADD_TITLES[pill.dataset.tag] || 'New Task'}`;
  }

  // If dragging a whiteboard item
  const wbItem = source.closest('.whiteboard-item, .sch-whiteboard-item');
  if (wbItem && wbItem.dataset.taskId) {
    gridDrag.type = 'whiteboard';
    gridDrag.taskId = wbItem.dataset.taskId;
    const task = getTask(wbItem.dataset.taskId);
    if (task) {
      gridDrag.duration = getDurationMinutes(task);
    }
  }

  // Apply tag-based styling to ghost
  let ghostTag = null;
  if (gridDrag.type === 'reschedule') {
    const task = getTask(gridDrag.taskId);
    if (task) ghostTag = task.tag;
  } else if (gridDrag.type === 'quickadd' && gridDrag.tag) {
    ghostTag = gridDrag.tag;
  } else if (gridDrag.type === 'whiteboard') {
    const task = getTask(gridDrag.taskId);
    if (task) ghostTag = task.tag;
  }
  if (ghostTag) {
    const meta = TAG_COLORS[ghostTag] || TAG_COLORS.meeting;
    ghost.style.border = `2px solid ${meta.text}`;
    ghost.style.boxShadow = `0 4px 20px color-mix(in srgb, ${meta.text} 25%, transparent)`;
    // For non-task ghosts (quick-add, whiteboard), also set background/color
    if (gridDrag.type !== 'reschedule') {
      ghost.style.background = meta.bg;
      ghost.style.color = meta.text;
    }
  }

  document.body.style.cursor = 'grabbing';
  document.addEventListener('mousemove', onDragMove);
  document.addEventListener('mouseup', onDragEnd);
}

function getDragHlColor() {
  if (gridDrag) {
    if (gridDrag.type === 'quickadd' && gridDrag.tag) return (TAG_COLORS[gridDrag.tag] || TAG_COLORS.meeting).text;
    if (gridDrag.type === 'reschedule' || gridDrag.type === 'whiteboard') {
      const task = getTask(gridDrag.taskId);
      if (task) return (TAG_COLORS[task.tag] || TAG_COLORS.meeting).text;
    }
  }
  return TAG_COLORS.meeting.text;
}

// ─── DROP PREVIEW (single card-like ghost in the grid) ────
function showDropPreview(col, spanStart, spanEnd, hlColor) {
  let el = document.getElementById('dropTaskPreview');
  if (!el) {
    el = document.createElement('div');
    el.id = 'dropTaskPreview';
    el.className = 'drop-task-preview';
    col.appendChild(el);
  } else if (el.parentElement !== col) {
    col.appendChild(el);
  }
  const actualHH = col.getBoundingClientRect().height;
  const top = ((spanStart - START_HOUR * 60) / 60) * actualHH;
  const height = ((spanEnd - spanStart) / 60) * actualHH;
  el.style.top = `${top}px`;
  el.style.height = `${Math.max(height, 4)}px`;
  el.style.setProperty('--hl-color', hlColor);
}

function removeDropPreview() {
  const el = document.getElementById('dropTaskPreview');
  if (el) el.remove();
}

// ─── CONFLICT PREVIEW ─────────────────────────────────────
function previewConflicts(date, startM, endM, excludeId) {
  $$('.calendar-task.task-conflict').forEach(el => el.classList.remove('task-conflict'));
  const badge = document.getElementById('dropConflictBadge');
  if (badge) badge.remove();

  let count = 0;
  for (const task of state.tasks) {
    if (task.id === excludeId || isWhiteboardTask(task) || task.completed) continue;
    if (task.date !== date) continue;
    const tStart = parseTime(task.startTime);
    const tEnd = parseTime(task.endTime) || tStart + 60;
    if (tEnd <= startM || tStart >= endM) continue;
    const el = document.querySelector(`.calendar-task[data-task-id="${task.id}"]`);
    if (el) { el.classList.add('task-conflict'); count++; }
  }

  if (count > 0) {
    const b = document.createElement('div');
    b.id = 'dropConflictBadge';
    b.className = 'drop-conflict-badge';
    b.textContent = `Will push ${count} task${count > 1 ? 's' : ''}`;
    document.body.appendChild(b);
  }
}

function clearConflictPreview() {
  $$('.calendar-task.task-conflict').forEach(el => el.classList.remove('task-conflict'));
  const badge = document.getElementById('dropConflictBadge');
  if (badge) badge.remove();
}

function onDragMove(e) {
  if (!gridDrag) return;
  const { ghost, offX, offY } = gridDrag;
  gridDrag.moved = true;
  ghost.style.left = `${e.clientX - offX}px`;
  ghost.style.top = `${e.clientY - offY}px`;

  // Find which date column the cursor is over by checking X position
  const dayCols = dom.grid.querySelectorAll('.day-column');
  let matchedDate = null;
  for (const col of dayCols) {
    const rect = col.getBoundingClientRect();
    if (e.clientX >= rect.left && e.clientX < rect.right) {
      matchedDate = col.dataset.date;
      break;
    }
  }

  if (matchedDate) {
    const refCol = dom.grid.querySelector(`.day-column[data-date="${matchedDate}"]`);
    if (!refCol) {
      gridDrag.dropDate = null;
      gridDrag.dropTime = null;
      document.body.style.cursor = 'grabbing';
      removeDropPreview();
      clearConflictPreview();
      removeDragTooltip();
      return;
    }
    const colRect = refCol.getBoundingClientRect();
    const yOffset = e.clientY - colRect.top;
    const actualHourHeight = colRect.height;
    const rawMinutes = (yOffset / actualHourHeight) * 60 + START_HOUR * 60;
    const clamped = Math.max(START_HOUR * 60, Math.min(rawMinutes, (START_HOUR + VISIBLE_HOURS) * 60 - SNAP_MINUTES));
    const snap = roundToNearest(clamped, SNAP_MINUTES);

    gridDrag.dropDate = matchedDate;
    gridDrag.dropTime = snap;
    document.body.style.cursor = 'copy';

    // Calculate the task span
    const dragEndM = gridDrag.dragEndM ?? (gridDrag.dropTime + (gridDrag.duration || 60));
    const durMins = dragEndM - (gridDrag.dragStartM ?? gridDrag.dropTime);
    const spanStart = snap;
    const spanEnd = Math.min(spanStart + durMins, (START_HOUR + VISIBLE_HOURS) * 60);

    // Single card-like preview at the drop position (replaces old overlay + line)
    showDropPreview(refCol, spanStart, spanEnd, getDragHlColor());

    // Highlight tasks that would be pushed down
    previewConflicts(matchedDate, spanStart, spanEnd, gridDrag.taskId || null);

    // Move conflict badge with cursor
    const badge = document.getElementById('dropConflictBadge');
    if (badge) { badge.style.left = `${e.clientX + 16}px`; badge.style.top = `${e.clientY + 20}px`; }

    // Show live time tooltip
    showDragTooltip(e, snap, durMins);
  } else {
    gridDrag.dropDate = null;
    gridDrag.dropTime = null;
    document.body.style.cursor = 'grabbing';
    removeDropPreview();
    clearConflictPreview();
    removeDragTooltip();
  }
}

function showDragTooltip(e, snap, durMins) {
  let tip = document.getElementById('dragTimeTooltip');
  if (!tip) {
    tip = document.createElement('div');
    tip.id = 'dragTimeTooltip';
    tip.className = 'drag-time-tooltip';
    document.body.appendChild(tip);
  }
  const h = Math.floor(snap / 60);
  const m = snap % 60;
  const ampm = h < 12 ? 'AM' : 'PM';
  const h12 = h % 12 || 12;
  let text = `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
  if (durMins) {
    const dh = Math.floor(durMins / 60);
    const dm = durMins % 60;
    text += ` · ${dh}h${dm ? String(dm).padStart(2, '0') : ''}`;
  }
  tip.textContent = text;
  tip.style.left = `${e.clientX + 16}px`;
  tip.style.top = `${e.clientY - 8}px`;
}

function removeDragTooltip() {
  const tip = document.getElementById('dragTimeTooltip');
  if (tip) tip.remove();
}

// ─── DRAG TO CREATE ──────────────────────────────────────
let dragCreate = null;

function guessDragCreateMeta(mins) {
  const h = Math.floor(mins / 60);
  let tag = 'meeting', title = 'New Task';
  if (h < 9) { tag = 'deep-work'; title = 'Deep Work Session'; }
  else if (h >= 6 && h < 8) { tag = 'exercise'; title = 'Morning Workout'; }
  else if (h >= 12 && h < 13) { tag = 'hobby'; title = 'Break'; }
  else if (h >= 17) { tag = 'hobby'; title = 'Personal Time'; }
  return { tag, title, meta: TAG_COLORS[tag] || TAG_COLORS.meeting };
}

function startDragCreate(e, date, startMins) {
  dragCreate = {
    date,
    startMins,
    currentMins: startMins,
    moved: false,
    startX: e.clientX,
    startY: e.clientY,
    ghost: null,
  };
  document.addEventListener('mousemove', onDragCreateMove);
  document.addEventListener('mouseup', onDragCreateEnd);
  e.preventDefault();
}

function onDragCreateMove(e) {
  if (!dragCreate) return;
  dragCreate.moved = true;
  if (!dragCreate.ghost) {
    const startCol = dom.grid.querySelector(`.day-column[data-date="${dragCreate.date}"]`);
    if (startCol) {
      const actualHH = startCol.getBoundingClientRect().height;
      const top = ((dragCreate.startMins - START_HOUR * 60) / 60) * actualHH;
      const ghost = document.createElement('div');
      ghost.className = 'grid-drag-ghost drag-create-ghost';
      const { tag, title, meta } = guessDragCreateMeta(dragCreate.startMins);
      const h = Math.floor(dragCreate.startMins / 60);
      const m = dragCreate.startMins % 60;
      const ampm = h < 12 ? 'AM' : 'PM';
      const h12 = h % 12 || 12;
      ghost.innerHTML = `<span style="opacity:0.55">${h12}:${String(m).padStart(2, '0')} ${ampm}</span> ${title}`;
      ghost.style.cssText = `top:${top}px;left:5px;width:calc(100% - 10px);height:${actualHH * 0.25}px;background:${meta.bg};color:${meta.text};border-left-color:${meta.text}`;
      startCol.appendChild(ghost);
      dragCreate.ghost = ghost;
      dragCreate.col = startCol;
      dragCreate.actualHH = actualHH;
    }
  }

  if (!dragCreate.col) return;
  const { col, actualHH, startMins } = dragCreate;
  const colRect = col.getBoundingClientRect();
  const yOffset = e.clientY - colRect.top;
  const rawMins = (yOffset / actualHH) * 60 + START_HOUR * 60;
  const clamped = Math.max(startMins + SNAP_MINUTES, Math.min(rawMins, (START_HOUR + VISIBLE_HOURS) * 60));
  const snapped = roundToNearest(clamped, SNAP_MINUTES);
  dragCreate.currentMins = snapped;

  const dur = snapped - startMins;
  const top = ((startMins - START_HOUR * 60) / 60) * actualHH;
  const height = (dur / 60) * actualHH;
  dragCreate.ghost.style.top = `${top}px`;
  dragCreate.ghost.style.height = `${Math.max(height, actualHH * 0.25)}px`;

  // Single card-like preview at the drop position
  if (dur >= SNAP_MINUTES) {
    const { meta } = guessDragCreateMeta(startMins);
    showDropPreview(col, startMins, snapped, meta.text);
  } else {
    removeDropPreview();
  }

  showDragTooltip(e, snapped, dur);
  document.body.style.cursor = 'ns-resize';
}

function onDragCreateEnd(e) {
  document.removeEventListener('mousemove', onDragCreateMove);
  document.removeEventListener('mouseup', onDragCreateEnd);
  removeDropPreview();
  clearConflictPreview();
  removeDragTooltip();
  document.body.style.cursor = '';

  if (!dragCreate) return;
  if (dragCreate.ghost) dragCreate.ghost.remove();

  if (!dragCreate.moved) {
    // Click (no drag): delegate to instantCreateTask for smart defaults + consistent behavior
    instantCreateTask(dragCreate.date, dragCreate.startMins);
    dragCreate = null;
    return;
  }

  // Drag: create task with dragged duration
  const dur = dragCreate.currentMins - dragCreate.startMins;
  if (dur >= SNAP_MINUTES) {
    pushUndo();
    const hour = Math.floor(dragCreate.startMins / 60);
    let tag = 'meeting';
    let title = 'New Task';
    if (hour < 9) { tag = 'deep-work'; title = 'Deep Work Session'; }
    else if (hour >= 6 && hour < 8) { tag = 'exercise'; title = 'Morning Workout'; }
    else if (hour >= 12 && hour < 13) { tag = 'hobby'; title = 'Break'; }
    else if (hour >= 17) { tag = 'hobby'; title = 'Personal Time'; }

    const task = createTask({
      title,
      date: dragCreate.date,
      startTime: toTimeStr(dragCreate.startMins),
      endTime: toTimeStr(dragCreate.currentMins),
      tag,
    });
    pageAfterTaskSave();
    flashTaskOnGrid(task.id);
    showToast(`Created <strong>${escapeHtml(title)}</strong> — <span style="cursor:pointer;text-decoration:underline" onclick="openTaskModal('${task.id}')">edit</span>`, 'success', 3000);
  }
  dragCreate = null;
}

// Unified slot handler: click-to-create + drag-to-create + TZ tooltip
function attachSlotHandlersWithCreate() {
  $$('.hour-slot').forEach(slot => {
    slot.addEventListener('mousedown', (e) => {
      if (e.button !== 0) return;
      if (e.target.closest('.calendar-task')) return;
      const date = slot.dataset.date;
      const base = parseInt(slot.dataset.time);
      const slotRect = slot.getBoundingClientRect();
      const pct = (e.clientY - slotRect.top) / slotRect.height;
      const precise = base + pct * 60;
      const snap = roundToNearest(precise, SNAP_MINUTES);
      startDragCreate(e, date, snap);
    });
  });
  // TZ tooltip for time axis
  $$('.time-axis').forEach(el => {
    el.addEventListener('mouseenter', (e) => {
      if (!dom.tzTooltip) return;
      const hour = parseInt(el.dataset.hour);
      const off = -new Date().getTimezoneOffset();
      const utcH = ((hour * 60 - off) / 60 + 24) % 24;
      const utcHf = Math.floor(utcH);
      const utcM = Math.round((utcH % 1) * 60);
      const la = hour < 12 ? 'AM' : 'PM';
      const ua = utcHf < 12 ? 'AM' : 'PM';
      const h12 = hour % 12 || 12;
      const u12 = utcHf % 12 || 12;
      dom.tzTooltip.innerHTML = `<span class="tz-tooltip-main">${h12}${la} Local</span><span class="tz-tooltip-sub">${u12}:${String(utcM).padStart(2, '0')}${ua} UTC</span>`;
      dom.tzTooltip.classList.remove('hidden');
      dom.tzTooltip.style.left = `${e.clientX + 12}px`;
      dom.tzTooltip.style.top = `${e.clientY - 10}px`;
    });
    el.addEventListener('mousemove', (e) => {
      if (dom.tzTooltip) { dom.tzTooltip.style.left = `${e.clientX + 12}px`; dom.tzTooltip.style.top = `${e.clientY - 10}px`; }
    });
    el.addEventListener('mouseleave', () => { if (dom.tzTooltip) dom.tzTooltip.classList.add('hidden'); });
  });
}

function onDragEnd() {
  if (!gridDrag) return;
  document.removeEventListener('mousemove', onDragMove);
  document.removeEventListener('mouseup', onDragEnd);

  // Capture ghost rect BEFORE cleanup so FLIP can use it
  const oldGhostRect = gridDrag.ghost ? gridDrag.ghost.getBoundingClientRect() : null;

  // Clean up
  if (gridDrag.ghost) gridDrag.ghost.remove();
  removeDropPreview();
  clearConflictPreview();
  removeDragTooltip();
  document.body.style.cursor = '';

  if (!gridDrag.moved || !gridDrag.dropDate || gridDrag.dropTime === undefined) {
    gridDrag = null;
    return;
  }

  // FLIP: snapshot old task positions before any state changes
  const oldRects = {};
  document.querySelectorAll('.calendar-task[data-task-id]').forEach(el => {
    const r = el.getBoundingClientRect();
    oldRects[el.dataset.taskId] = { left: r.left, top: r.top, width: r.width, height: r.height };
  });

  const dropEndMins = gridDrag.type === 'quickadd'
    ? gridDrag.dropTime + 60
    : gridDrag.dropTime + (gridDrag.dragEndM - gridDrag.dragStartM || gridDrag.duration || 60);

  // Apply all state changes without triggering re-render mid-way
  const savedCallback = pageAfterTaskSave;
  pageAfterTaskSave = null;

  pushUndo(); // snapshot BEFORE changes

  const excludeId = gridDrag.taskId || null;
  let bounceTaskId = gridDrag.type === 'reschedule' || gridDrag.type === 'whiteboard' ? gridDrag.taskId : null;
  repelConflicts(gridDrag.dropDate, gridDrag.dropTime, dropEndMins, excludeId);

  if (gridDrag.type === 'reschedule') {
    const dur = gridDrag.dragEndM - gridDrag.dragStartM;
    const start = toTimeStr(gridDrag.dropTime);
    const end = toTimeStr(gridDrag.dropTime + dur);
    const task = getTask(gridDrag.taskId);
    if (task && (gridDrag.dropDate !== gridDrag.startDate || start !== gridDrag.startTime)) {
      task.date = gridDrag.dropDate;
      task.startTime = start;
      task.endTime = end;
    }
  } else if (gridDrag.type === 'quickadd') {
    const newTask = createTask({
      title: QUICK_ADD_TITLES[gridDrag.tag] || 'New Task',
      date: gridDrag.dropDate,
      startTime: toTimeStr(gridDrag.dropTime),
      endTime: toTimeStr(gridDrag.dropTime + 60),
      tag: gridDrag.tag,
    });
    bounceTaskId = newTask.id;
  } else if (gridDrag.type === 'whiteboard') {
    const task = getTask(gridDrag.taskId);
    if (task) {
      task.date = gridDrag.dropDate;
      task.startTime = toTimeStr(gridDrag.dropTime);
      task.endTime = toTimeStr(gridDrag.dropTime + (gridDrag.duration || 60));
    }
  }

  saveState();
  pageAfterTaskSave = savedCallback;
  if (typeof pageAfterTaskSave === 'function') pageAfterTaskSave();

  // FLIP: animate tasks from old positions to new positions
  requestAnimationFrame(() => {
    document.body.offsetHeight; // force layout
    requestAnimationFrame(() => {
      let moved = false;
      document.querySelectorAll('.calendar-task[data-task-id]').forEach(el => {
        const id = el.dataset.taskId;
        const old = oldRects[id];
        if (!old) return;
        const r = el.getBoundingClientRect();
        const dx = old.left - r.left;
        const dy = old.top - r.top;
        if (Math.abs(dx) > 1 || Math.abs(dy) > 1) {
          moved = true;
          el.style.transition = 'none';
          el.style.transform = `translate(${dx}px, ${dy}px)`;
          el.style.zIndex = '50';
          requestAnimationFrame(() => {
            el.style.transition = 'transform 400ms cubic-bezier(0.16, 1, 0.3, 1)';
            el.style.transform = '';
            setTimeout(() => {
              el.style.transition = '';
              el.style.zIndex = '';
            }, 450);
          });
        }
      });
      // Also animate the ghost into the drop position if it was a dragged task
      if (!moved && gridDrag.type === 'reschedule' && oldGhostRect && gridDrag.taskId) {
        const el = document.querySelector(`.calendar-task[data-task-id="${gridDrag.taskId}"]`);
        if (el) {
          const r = el.getBoundingClientRect();
          const dx = oldGhostRect.left - r.left;
          const dy = oldGhostRect.top - r.top;
          el.style.transition = 'none';
          el.style.transform = `translate(${dx}px, ${dy}px)`;
          el.style.zIndex = '50';
          requestAnimationFrame(() => {
            el.style.transition = 'transform 350ms cubic-bezier(0.16, 1, 0.3, 1)';
            el.style.transform = '';
            setTimeout(() => { el.style.transition = ''; el.style.zIndex = ''; }, 400);
          });
        }
      }
      // Drop bounce on the newly placed task
      if (bounceTaskId) {
        const bEl = document.querySelector(`.calendar-task[data-task-id="${bounceTaskId}"]`);
        if (bEl) {
          bEl.classList.add('task-drop-bounce');
          setTimeout(() => bEl.classList.remove('task-drop-bounce'), 500);
        }
      }
    });
  });

  gridDrag = null;
}

// ─── REPEL: push conflicting tasks down on drop ────────────
function repelConflicts(date, startMins, endMins, excludeId, depth) {
  if (depth > 10) return; // safety: prevent infinite cascade
  const endBoundary = (START_HOUR + VISIBLE_HOURS) * 60;

  for (const task of state.tasks) {
    if (task.id === excludeId || isWhiteboardTask(task) || task.completed) continue;
    if (task.date !== date) continue;

    const tStart = parseTime(task.startTime);
    const tEnd = parseTime(task.endTime) || tStart + 60;
    if (tEnd <= startMins || tStart >= endMins) continue;

    const duration = tEnd - tStart;
    const newStart = Math.min(endMins, endBoundary - duration);
    const newEnd = Math.min(newStart + duration, endBoundary);

    if (Math.abs(newStart - tStart) >= 1) {
      task.startTime = toTimeStr(newStart);
      task.endTime = toTimeStr(newEnd);
      repelConflicts(date, newStart, newEnd, task.id, (depth || 0) + 1);
    }
  }
}

// ─── REPEAT INSTANCE HELPERS ──────────────────────────────
function resolveTaskId(id) {
  if (!id || !id.includes('_')) return id;
  const orig = getTask(id);
  if (orig) return id;
  const origId = id.split('_')[0];
  return getTask(origId) ? origId : id;
}

// ─── RESIZE HANDLERS ───────────────────────────────────────
function onResizeStart(e) {
  e.preventDefault();
  e.stopPropagation();

  const taskId = e.currentTarget.dataset.taskId;
  const task = getTask(taskId);
  if (!task) return;

  const el = e.currentTarget.closest('.calendar-task');
  if (!el) return;

  const col = dom.grid.querySelector(`.day-column[data-date="${task.date}"]`);
  if (!col) return;

  const colRect = col.getBoundingClientRect();

  resizeState = {
    taskId,
    task,
    el,
    col,
    colRect,
    startM: parseTime(task.startTime),
    endM: parseTime(task.endTime) || parseTime(task.startTime) + 60,
    originalEndM: parseTime(task.endTime) || parseTime(task.startTime) + 60,
    startTop: colRect.top,
    hourHeight: colRect.height,
  };

  el.classList.add('resizing');

  document.addEventListener('mousemove', onResizeMove);
  document.addEventListener('mouseup', onResizeEnd);
}

function onResizeMove(e) {
  if (!resizeState) return;

  const { startM, endM, originalEndM, el, col, startTop, hourHeight } = resizeState;

  // Calculate new end time from mouse Y position relative to column
  const yOffset = e.clientY - startTop;
  const rawEndM = (yOffset / hourHeight) * 60 + START_HOUR * 60;
  const clamped = Math.max(startM + SNAP_MINUTES, Math.min(rawEndM, (START_HOUR + VISIBLE_HOURS) * 60));
  const snapped = roundToNearest(clamped, SNAP_MINUTES);
  const newDur = Math.max(snapped - startM, SNAP_MINUTES);
  const newHeight = (newDur / 60) * hourHeight;

  // Update visual height in real-time
  el.style.height = `${newHeight}px`;

  // Show delta highlight: the area between original end and new end
  const oldDelta = document.getElementById('resizeDeltaHighlight');
  if (oldDelta) oldDelta.remove();

  const deltaStart = Math.min(originalEndM, snapped);
  const deltaEnd = Math.max(originalEndM, snapped);
  if (Math.abs(snapped - originalEndM) >= SNAP_MINUTES) {
    const delta = document.createElement('div');
    delta.id = 'resizeDeltaHighlight';
    delta.className = 'resize-delta-highlight';
    const dTop = ((deltaStart - START_HOUR * 60) / 60) * hourHeight;
    const dHeight = ((deltaEnd - deltaStart) / 60) * hourHeight;
    delta.style.cssText = `top:${dTop}px;height:${dHeight}px`;
    const meta = TAG_COLORS[resizeState.task.tag] || TAG_COLORS.meeting;
    delta.style.setProperty('--hl-color', meta.text);
    col.appendChild(delta);
  }

  // Show time tooltip
  showResizeTooltip(e.clientX, e.clientY, startM, snapped);
}

function onResizeEnd(e) {
  if (!resizeState) return;

  document.removeEventListener('mousemove', onResizeMove);
  document.removeEventListener('mouseup', onResizeEnd);

  const { taskId, startM, el, startTop, hourHeight } = resizeState;
  el.classList.remove('resizing');
  const oldDelta = document.getElementById('resizeDeltaHighlight');
  if (oldDelta) oldDelta.remove();

  // Calculate final end time
  const yOffset = e.clientY - startTop;
  const rawEndM = (yOffset / hourHeight) * 60 + START_HOUR * 60;
  const snapped = roundToNearest(Math.max(startM + SNAP_MINUTES, Math.min(rawEndM, (START_HOUR + VISIBLE_HOURS) * 60)), SNAP_MINUTES);
  const newEndM = startM + Math.max(snapped - startM, SNAP_MINUTES);

  // Only update if changed significantly (>= 5 min difference)
  const task = getTask(taskId);
  if (task) {
    const oldEndM = parseTime(task.endTime) || parseTime(task.startTime) + 60;
    if (Math.abs(newEndM - oldEndM) >= 5) {
      updateTask(taskId, { endTime: toTimeStr(newEndM) });
    }
  }

  removeResizeTooltip();
  resizeState = null;
}

function showResizeTooltip(clientX, clientY, startM, endM) {
  let tip = document.getElementById('resizeTimeTooltip');
  if (!tip) {
    tip = document.createElement('div');
    tip.id = 'resizeTimeTooltip';
    tip.className = 'drag-time-tooltip';
    document.body.appendChild(tip);
  }

  const fmtMins = (m) => {
    const h = Math.floor(m / 60) % 24;
    const min = m % 60;
    const ampm = h < 12 ? 'AM' : 'PM';
    const h12 = h % 12 || 12;
    return `${h12}:${String(min).padStart(2, '0')} ${ampm}`;
  };

  const dur = Math.max(endM - startM, SNAP_MINUTES);
  const durStr = dur >= 60 ? `${Math.floor(dur / 60)}h${dur % 60 ? ` ${dur % 60}m` : ''}` : `${dur}m`;

  tip.textContent = `${fmtMins(startM)} – ${fmtMins(endM)} (${durStr})`;
  tip.style.left = `${clientX + 16}px`;
  tip.style.top = `${clientY - 8}px`;
}

function removeResizeTooltip() {
  const tip = document.getElementById('resizeTimeTooltip');
  if (tip) tip.remove();
}

// ─── COMMAND PALETTE RESULTS (no more ghost blocks — direct creation) ───
function showCommandResult(result) {
  if (!dom.cmdResults) return;
  const meta = TAG_COLORS[result.tag] || TAG_COLORS.meeting;
  dom.cmdResults.innerHTML = `<div class="cmd-result-item">
      <svg class="cmd-result-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/></svg>
      <div class="cmd-result-content">
        <div class="cmd-result-title">${escapeHtml(result.title)}</div>
        <div class="cmd-result-detail">${result.date} &middot; ${result.startTime} &ndash; ${result.endTime} &middot; <span style="color:${meta.text}">${result.tag}</span></div>
        <div class="cmd-result-actions">
          <button class="btn btn-primary cmd-confirm-btn">Add to Calendar</button>
          <button class="btn btn-outline cmd-cancel-btn">Cancel</button>
        </div>
      </div>
    </div>`;
  dom.cmdResults.querySelector('.cmd-confirm-btn').addEventListener('click', () => { confirmCmdTask(result); });
  dom.cmdResults.querySelector('.cmd-cancel-btn').addEventListener('click', () => { hideCmdPalette(); });
}

function showFindGapResult(result) {
  if (!dom.cmdResults) return;
  let currentResult = { ...result };
  const meta = TAG_COLORS[result.tag] || TAG_COLORS.meeting;
  function renderFindGapDisplay(res) {
    dom.cmdResults.innerHTML = `<div class="cmd-result-item">
      <svg class="cmd-result-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
      <div class="cmd-result-content">
        <div class="cmd-result-title">${escapeHtml(res.title)}</div>
        <div class="cmd-result-detail">${res.date} &middot; ${res.startTime} &ndash; ${res.endTime} (${res.durationMinutes}m) &middot; <span style="color:${meta.text}">${res.tag}</span></div>
        <div class="cmd-result-actions">
          <button class="btn btn-primary cmd-confirm-btn">Add to Calendar</button>
          <button class="btn btn-outline cmd-cancel-btn">Cancel</button>
          <button class="btn btn-ghost cmd-refresh-btn" title="Find another slot">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/></svg> Next</button>
        </div>
      </div>
    </div>`;
    dom.cmdResults.querySelector('.cmd-confirm-btn').addEventListener('click', () => { confirmCmdTask(res); });
    dom.cmdResults.querySelector('.cmd-cancel-btn').addEventListener('click', () => { hideCmdPalette(); });
    const refreshBtn = dom.cmdResults.querySelector('.cmd-refresh-btn');
    if (refreshBtn) refreshBtn.addEventListener('click', () => {
      const next = findNextSlot(currentResult);
      if (next) { currentResult = { ...next }; renderFindGapDisplay(currentResult); }
      else { dom.cmdResults.innerHTML = '<div class="cmd-error">No more free slots available on this day.</div>'; }
    });
  }
  renderFindGapDisplay(currentResult);
}

function confirmCmdTask(taskData) {
  const startM = parseTime(taskData.startTime);
  const endM = parseTime(taskData.endTime) || startM + 60;
  const conflict = findConflict(taskData.date, startM, endM);
  if (conflict) {
    const dur = endM - startM;
    const slot = findFreeSlot(taskData.date, dur);
    if (slot) {
      showToast(`"${escapeHtml(taskData.title)}" overlaps with ${escapeHtml(conflict.title)} — shifted to ${slot.startTime}–${slot.endTime}`, 'warning');
      taskData.startTime = slot.startTime;
      taskData.endTime = slot.endTime;
    } else {
      showToast(`No free slot on ${taskData.date} for this task`, 'error');
      return;
    }
  }
  createTask(taskData);
  if (state.cmdPaletteOpen) hideCmdPalette();
  pageAfterTaskSave();
}

// ─── WHITEBOARD ────────────────────────────────────────────
function renderWhiteboard() {
  if (!dom.whiteboardList) return;
  const wbTasks = state.tasks.filter(isWhiteboardTask);
  if (wbTasks.length === 0) {
    dom.whiteboardList.innerHTML = '<div class="whiteboard-empty">Drag ideas here or add unassigned tasks</div>';
    return;
  }
  let html = '';
  for (const task of wbTasks) {
    const meta = getTagMeta(task.tag);
    html += `<div class="whiteboard-item" data-task-id="${task.id}">
      <span class="w-title">${escapeHtml(task.title)}</span>
      <span class="w-tag" style="background:color-mix(in srgb, ${meta.text} 15%, transparent);color:${meta.text}">${task.tag}</span>
      <button class="w-delete" data-task-id="${task.id}" title="Delete">
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round">
          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
    </div>`;
  }
  dom.whiteboardList.innerHTML = html;
  dom.whiteboardList.querySelectorAll('.whiteboard-item').forEach(item => {
    const taskId = item.dataset.taskId;
    item.addEventListener('click', (e) => { if (e.target.closest('.w-delete')) return; openTaskModal(taskId); });
    const delBtn = item.querySelector('.w-delete');
    if (delBtn) delBtn.addEventListener('click', (e) => { e.stopPropagation(); deleteTask(taskId); });
    item.addEventListener('mousedown', (e) => { if (e.button !== 0 || e.target.closest('.w-delete')) return; startDrag(e, item); });
  });
}

function addWhiteboardTask() {
  const task = createTask({ title: 'New Idea', date: '', startTime: '09:00', endTime: '10:00', tag: 'meeting', notes: '' });
  openTaskModal(task.id);
}

// ─── QUICK IDEA INLINE FORM ───────────────────────────────
let quickIdeaTag = 'meeting';

function openQuickIdea() {
  closeQuickTpl();
  const popup = document.getElementById('quickIdea');
  if (!popup) { addWhiteboardTask(); return; }
  popup.classList.remove('hidden');
  const input = document.getElementById('quickIdeaInput');
  if (input) { input.value = ''; input.focus(); }
  quickIdeaTag = 'meeting';
  document.querySelectorAll('.quick-idea-tag').forEach(b => b.classList.remove('active'));
  document.querySelector('.quick-idea-tag[data-tag="meeting"]')?.classList.add('active');
}

function closeQuickIdea() {
  document.getElementById('quickIdea')?.classList.add('hidden');
}

function submitQuickIdea() {
  const input = document.getElementById('quickIdeaInput');
  if (!input || !input.value.trim()) return;
  const task = createTask({
    title: input.value.trim(),
    date: '',
    startTime: '09:00',
    endTime: '10:00',
    tag: quickIdeaTag,
    notes: '',
  });
  closeQuickIdea();
  openTaskModal(task.id);
  input.value = '';
}

// ─── WEEK NAVIGATION ───────────────────────────────────────
function goToday() {
  if (currentView === 'month') {
    currentMonthDate = new Date();
    renderCalendar();
  } else {
    state.currentWeekStart = getMonday(new Date());
    renderCalendar();
  }
  // Smooth scroll to today's column with flash indicator
  requestAnimationFrame(() => {
    const todayStr = formatDate(new Date());
    const col = document.querySelector(`[data-date="${todayStr}"]`);
    if (col) {
      col.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      col.classList.add('today-flash');
      setTimeout(() => col.classList.remove('today-flash'), 1200);
    }
  });
}
function goPrev() {
  if (currentView === 'month') {
    currentMonthDate.setMonth(currentMonthDate.getMonth() - 1);
    renderCalendar();
  } else {
    state.currentWeekStart = addDays(state.currentWeekStart, -7);
    renderCalendar();
  }
}
function goNext() {
  if (currentView === 'month') {
    currentMonthDate.setMonth(currentMonthDate.getMonth() + 1);
    renderCalendar();
  } else {
    state.currentWeekStart = addDays(state.currentWeekStart, 7);
    renderCalendar();
  }
}

// ─── AUTO-SCROLL ──────────────────────────────────────────
function scrollToCurrentTime() {
  const now = new Date();
  const mins = now.getHours() * 60 + now.getMinutes();
  const scrollTarget = ((mins - START_HOUR * 60) / 60) * HOUR_HEIGHT - 100;
  if (scrollTarget > 0 && dom.container) dom.container.scrollTop = scrollTarget;
}

// ─── KEYBOARD SHORTCUTS ────────────────────────────────────
document.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && state.cmdPaletteOpen && dom.cmdInput) {
    if (!dom.cmdResults.querySelector('.cmd-result-item')) processCommand(dom.cmdInput.value);
  }
  if (e.key === 't' && !e.metaKey && !e.ctrlKey && !state.cmdPaletteOpen && !state.taskModalOpen && !state.settingsDrawerOpen && !state.helpModalOpen && !e.target.closest('input, textarea, select')) { toggleTheme(); }
  if (e.key === 'q' && !e.metaKey && !e.ctrlKey && !state.cmdPaletteOpen && !state.taskModalOpen && !state.settingsDrawerOpen && !state.helpModalOpen && !e.target.closest('input, textarea, select')) {
    const now = new Date(); openNewTaskModal(formatDate(now), roundToNearest(now.getHours() * 60 + now.getMinutes(), SNAP_MINUTES));
  }
  if ((e.ctrlKey && e.key === ' ') && !state.cmdPaletteOpen && !state.taskModalOpen && !state.settingsDrawerOpen && !state.helpModalOpen) {
    e.preventDefault(); addWhiteboardTask();
  }
  // Undo (Ctrl+Z)
  if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !state.cmdPaletteOpen && !state.taskModalOpen && !state.settingsDrawerOpen && !state.helpModalOpen && !e.target.closest('input, textarea, select')) {
    e.preventDefault();
    if (undo()) {
      showToast('Undo successful', 'info', 2000);
    }
  }
});

// ─── EVENT BINDING ─────────────────────────────────────────
function bindEvents() {
  dom.todayBtn?.addEventListener('click', goToday);
  dom.prevWeek?.addEventListener('click', goPrev);
  dom.nextWeek?.addEventListener('click', goNext);
  dom.cmdBtn?.addEventListener('click', showCmdPalette);
  dom.cmdPaletteBtn?.addEventListener('click', showCmdPalette);
  dom.cmdOverlay?.addEventListener('click', hideCmdPalette);
  dom.cmdInput?.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); processCommand(dom.cmdInput.value); } });
  dom.taskOverlay?.addEventListener('click', hideTaskModal);
  dom.taskModalClose?.addEventListener('click', hideTaskModal);
  dom.taskCancelBtn?.addEventListener('click', hideTaskModal);
  dom.taskForm?.addEventListener('submit', handleTaskFormSubmit);
  dom.taskTag = document.getElementById('taskTag');
  document.querySelectorAll('.tf-tag').forEach(pill => {
    pill.addEventListener('click', () => {
      document.querySelectorAll('.tf-tag').forEach(b => b.classList.remove('active'));
      pill.classList.add('active');
      if (dom.taskTag) dom.taskTag.value = pill.dataset.tag;
      const meta = TAG_COLORS[pill.dataset.tag] || TAG_COLORS.meeting;
      const icon = document.getElementById('taskModalIcon');
      if (icon) icon.style.color = meta.text;
    });
  });
  dom.taskDeleteBtn?.addEventListener('click', handleTaskDelete);
  // Title character count
  dom.taskTitle?.addEventListener('input', () => {
    const el = document.getElementById('taskTitleChar');
    if (el) el.textContent = dom.taskTitle.value.length > 0 ? `${dom.taskTitle.value.length}` : '';
  });
  // Ctrl+Enter to submit from anywhere in modal
  dom.taskModal?.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { dom.taskForm?.requestSubmit(); }
  });
  // Auto-resize notes
  const notes = document.getElementById('taskNotes');
  if (notes) {
    const autoResize = () => { notes.style.height = 'auto'; notes.style.height = notes.scrollHeight + 'px'; };
    notes.addEventListener('input', autoResize);
  }
  dom.quickTaskBtn?.addEventListener('click', () => { const now = new Date(); openNewTaskModal(formatDate(now), roundToNearest(now.getHours() * 60 + now.getMinutes(), SNAP_MINUTES)); });
  dom.filterTagList?.addEventListener('click', (e) => {
    const pill = e.target.closest('.sch-filter-pill');
    if (pill) {
      const tag = pill.dataset.tag || null;
      state.selectedTag = state.selectedTag === tag ? null : tag;
      dom.filterTagList.querySelectorAll('.sch-filter-pill').forEach(p => p.classList.remove('active'));
      if (state.selectedTag) {
        dom.filterTagList.querySelector(`.sch-filter-pill[data-tag="${state.selectedTag}"]`)?.classList.add('active');
        dom.filterTagList.querySelector(`.sch-filter-pill[data-tag=""]`)?.classList.remove('active');
      } else {
        dom.filterTagList.querySelector(`.sch-filter-pill[data-tag=""]`)?.classList.add('active');
      }
      renderCalendar();
    }
  });
  dom.filterShowWeekends?.addEventListener('change', (e) => { state.showWeekends = e.target.checked; saveState(); renderCalendar(); });
  dom.filterShowCompleted?.addEventListener('change', (e) => { state.showCompleted = e.target.checked; saveState(); renderCalendar(); });
  dom.filterTodayBtn?.addEventListener('click', goToday);

  // Search with debounce
  let searchT;
  dom.filterSearchInput?.addEventListener('input', (e) => {
    const val = e.target.value;
    state.searchQuery = val;
    if (dom.filterSearchClear) {
      dom.filterSearchClear.classList.toggle('hidden', !val);
    }
    clearTimeout(searchT);
    searchT = setTimeout(renderCalendar, 100);
  });
  dom.filterSearchClear?.addEventListener('click', () => {
    if (dom.filterSearchInput) {
      dom.filterSearchInput.value = '';
      state.searchQuery = '';
      dom.filterSearchClear.classList.add('hidden');
      renderCalendar();
      dom.filterSearchInput.focus();
    }
  });
  dom.exportDataBtn?.addEventListener('click', exportData);
  dom.importDataBtn?.addEventListener('click', () => { if (dom.importFileInput) { dom.importFileInput.value = ''; dom.importFileInput.click(); } });
  dom.importFileInput?.addEventListener('change', importData);
  dom.themeBtn?.addEventListener('click', toggleTheme);
  dom.settingsBtn?.addEventListener('click', openSettingsDrawer);
  document.getElementById('schSettingsBtn')?.addEventListener('click', openSettingsDrawer);
  // bcVisualsBtn handled via delegation in shared.js
  dom.helpBtn?.addEventListener('click', showHelpModal);
  dom.helpOverlay?.addEventListener('click', hideHelpModal);
  dom.helpModalClose?.addEventListener('click', hideHelpModal);

  // AI Chat
  dom.aiChatBtn?.addEventListener('click', showAIChat);
  dom.aiChatOverlay?.addEventListener('click', hideAIChat);
  dom.aiChatClose?.addEventListener('click', hideAIChat);
  dom.aiChatSend?.addEventListener('click', sendAIMessage);
  dom.aiChatInput?.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendAIMessage(); } });
  dom.addIdeaBtn?.addEventListener('click', addWhiteboardTask);

  // Access Hub
  document.getElementById('accessMain')?.addEventListener('click', toggleAccessHub);
  document.getElementById('accessFocusTimer')?.addEventListener('click', () => { toggleAccessHub(); openPomodoro(); });
document.getElementById('accessTemplates')?.addEventListener('click', () => { toggleAccessHub(); openQuickTpl(); });
  document.getElementById('accessFocusMode')?.addEventListener('click', () => { toggleAccessHub(); toggleFocusMode(); showToast('🎯 Focus mode ' + (focusModeActive ? 'activated' : 'deactivated'), 'info', 2000); });
  document.getElementById('accessToday')?.addEventListener('click', () => { toggleAccessHub(); goToday(); });
  document.getElementById('accessIdea')?.addEventListener('click', () => { toggleAccessHub(); openQuickIdea(); });

  // Close Access Hub on outside click
  document.addEventListener('click', (e) => {
    const hub = document.getElementById('accessHub');
    if (hub && !hub.contains(e.target)) {
      document.getElementById('accessItems')?.classList.remove('open');
      document.getElementById('accessMain')?.classList.remove('open');
    }
  });

  // Init pomodoro
  initPomodoro();

  // Quick template bindings
  document.getElementById('quickTplClose')?.addEventListener('click', closeQuickTpl);
  // Close on Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { closeQuickTpl(); closeQuickIdea(); }
  });

  // Quick idea bindings
  document.getElementById('quickIdeaClose')?.addEventListener('click', closeQuickIdea);
  document.getElementById('quickIdeaInput')?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submitQuickIdea();
    }
    if (e.key === 'Escape') closeQuickIdea();
  });
  document.querySelectorAll('.quick-idea-tag').forEach(b => {
    b.addEventListener('click', () => {
      document.querySelectorAll('.quick-idea-tag').forEach(x => x.classList.remove('active'));
      b.classList.add('active');
      quickIdeaTag = b.dataset.tag;
    });
  });

  // Init priority select
  initPrioritySelect();

  // Render templates
  renderSchTemplates();

  // Load focus mode
  loadFocusMode();

  // Apply access hub customization
  applyAccessHubConfig();
  // F key to toggle focus mode (only when not in modals or input fields)
  document.addEventListener('keydown', (e) => {
    if (e.key === 'f' && !e.metaKey && !e.ctrlKey && !state.cmdPaletteOpen && !state.taskModalOpen && !state.settingsDrawerOpen && !state.helpModalOpen && !e.target.closest('input, textarea, select')) {
      e.preventDefault();
      toggleFocusMode();
      showToast('🎯 Focus mode ' + (focusModeActive ? 'activated' : 'deactivated'), 'info', 2000);
    }
  });

  // Quick add + whiteboard drag — unified via startDrag
  document.querySelectorAll('.sch-quickadd-pill, .whiteboard-item, .sch-whiteboard-item').forEach(el => {
    el.addEventListener('mousedown', (e) => {
      if (e.button !== 0 || e.target.closest('.w-delete, .w-del')) return;
      startDrag(e, el);
    });
  });

  // Mobile hamburger for schedule page
  const schHamburger = document.getElementById('schHamburger');
  const schSidebar = document.getElementById('hubSidebar');
  const schSidebarOverlay = document.getElementById('hubSidebarOverlay');
  function closeSchSidebar() { schSidebar?.classList.remove('open'); schSidebarOverlay?.classList.remove('active'); }
  schHamburger?.addEventListener('click', () => {
    const isOpen = schSidebar?.classList.toggle('open');
    schSidebarOverlay?.classList.toggle('active', isOpen);
  });
  schSidebarOverlay?.addEventListener('click', closeSchSidebar);
  schSidebar?.querySelectorAll('.hub-snav-item').forEach(item => {
    item.addEventListener('click', closeSchSidebar);
  });

  // Populate shortcuts dynamically
  populateShortcuts();

  let resizeT;
  window.addEventListener('resize', () => { clearTimeout(resizeT); resizeT = setTimeout(renderCalendar, 200); });
  setInterval(() => { if (gridDrag) return; $$('.current-time-line').forEach(el => el.remove()); renderCurrentTime(); }, 60000);
}  const QUICK_ADD_TITLES = {
  'deep-work': 'Deep Work Session',
  'meeting': 'Meeting',
  'exercise': 'Workout Session',
  'study': 'Study Session',
  'hobby': 'Hobby Time',
};

// ─── ACCESS HUB TOGGLE ──────────────────────────────────
function toggleAccessHub() {
  const items = document.getElementById('accessItems');
  const btn = document.getElementById('accessMain');
  if (items && btn) {
    const opening = !items.classList.contains('open');
    if (opening) positionAccessItems();
    items.classList.toggle('open');
    btn.classList.toggle('open');
  }
}

// ─── RENDER TEMPLATES ──────────────────────────────────────
function renderSchTemplates() {
  const container = document.getElementById('schTemplatePills');
  if (!container) return;
  const templates = loadTemplates();
  let html = '';
  for (const tpl of templates) {
    const c = TAG_COLORS[tpl.tag] || TAG_COLORS.meeting;
    html += `<button class="template-pill" data-template-id="${tpl.id}" title="${escapeHtml(tpl.title)} · ${formatDuration(tpl.duration)}">
      <span class="tpl-dot" style="background:${c.text}"></span>
      ${escapeHtml(tpl.name)}
    </button>`;
  }
  container.innerHTML = html;
  container.querySelectorAll('.template-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      const id = pill.dataset.templateId;
      const templates = loadTemplates();
      const tpl = templates.find(t => t.id === id);
      if (tpl) {
        // Show command palette prefilled
        showCmdPalette();
        if (dom.cmdInput) {
          dom.cmdInput.value = tpl.title;
          dom.cmdInput.focus();
        }
      }
    });
  });
}

// ─── QUICK TEMPLATE PICKER ───────────────────────────────
function openQuickTpl() {
  closeQuickIdea();
  const popup = document.getElementById('quickTpl');
  if (!popup) { showCmdPalette(); return; }
  const list = document.getElementById('quickTplList');
  if (!list) return;
  const templates = loadTemplates();
  list.innerHTML = '';
  for (const tpl of templates) {
    const c = TAG_COLORS[tpl.tag] || TAG_COLORS.meeting;
    const item = document.createElement('button');
    item.className = 'quick-tpl-item';
    item.innerHTML = `<span class="tpl-dot" style="background:${c.text}"></span>
      <span class="quick-tpl-item-title">${escapeHtml(tpl.name)}</span>
      <span class="quick-tpl-item-meta">${escapeHtml(tpl.title)} &middot; ${formatDuration(tpl.duration)}</span>`;
    item.addEventListener('click', () => {
      popup.classList.add('hidden');
      const today = formatDate(new Date());
      applyTemplate(tpl, today, null);
      renderCalendar();
      showToast(`Applied "${tpl.name}"`, 'success');
    });
    list.appendChild(item);
  }
  popup.classList.remove('hidden');
}

function closeQuickTpl() {
  document.getElementById('quickTpl')?.classList.add('hidden');
}

// ─── POMODORO TIMER ──────────────────────────────────────
let pomodoroInterval = null;

function openPomodoro() {
  const card = document.getElementById('pomodoroCard');
  if (card) {
    card.classList.toggle('hidden');
    if (!card.classList.contains('hidden')) loadPomodoroState();
  }
}

function getPomodoroDuration() {
  return pomodoroState ? pomodoroState.totalMinutes : 25;
}

function setPomodoroPreset(mins) {
  document.querySelectorAll('.pomodoro-preset').forEach(b => b.classList.remove('active'));
  document.querySelector(`.pomodoro-preset[data-minutes="${mins}"]`)?.classList.add('active');
  if (pomodoroState && !pomodoroState.isRunning && pomodoroState.elapsedSeconds === 0) {
    pomodoroState.totalMinutes = mins;
    savePomodoroState();
    updatePomodoroDisplay();
  }
}

function setPomodoroTaskName(name) {
  if (pomodoroState) { pomodoroState.taskTitle = name; pomodoroState.taskId = null; savePomodoroState(); }
}

function startPomodoro() {
  loadPomodoroState();
  if (!pomodoroState) {
    const today = formatDate(new Date());
    const focusTasks = state.tasks.filter(t => t.date === today && !t.completed && (t.tag === 'deep-work' || t.title.toLowerCase().includes('focus')));
    const bestTask = focusTasks.length > 0 ? focusTasks[0] : { id: null, title: 'Focus Session', startTime: '09:00' };
    const activePreset = parseInt(document.querySelector('.pomodoro-preset.active')?.dataset.minutes) || 25;
    createPomodoroSession(bestTask.id, bestTask.title, activePreset);
  }
  
  if (!pomodoroState.isRunning) {
    pomodoroState.isRunning = true;
    pomodoroState.startedAt = Date.now() - pomodoroState.elapsedSeconds * 1000;
    savePomodoroState();
    updatePomodoroDisplay();
    
    if (pomodoroInterval) clearInterval(pomodoroInterval);
    pomodoroInterval = setInterval(updatePomodoroDisplay, 1000);
    
    document.getElementById('pomodoroStartBtn').innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="none"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg> Pause`;
    document.getElementById('accessMain').classList.add('running');
    document.getElementById('pomodoroCard')?.classList.add('is-running');
  } else {
    pausePomodoro();
  }
}

function pausePomodoro() {
  if (pomodoroState) {
    pomodoroState.isRunning = false;
    savePomodoroState();
    if (pomodoroInterval) clearInterval(pomodoroInterval);
    document.getElementById('pomodoroStartBtn').innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="5 3 19 12 5 21 5 3"/></svg> Resume`;
    document.getElementById('accessMain').classList.remove('running');
    document.getElementById('pomodoroCard')?.classList.remove('is-running');
  }
}

function resetPomodoro() {
  if (pomodoroInterval) clearInterval(pomodoroInterval);
  const mins = pomodoroState ? pomodoroState.totalMinutes : 25;
  pomodoroState = null;
  savePomodoroState();
  document.getElementById('pomodoroTime').textContent = `${String(mins).padStart(2, '0')}:00`;
  document.getElementById('pomodoroStartBtn').innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="5 3 19 12 5 21 5 3"/></svg> Start`;
  document.getElementById('pomodoroStatus').textContent = 'Ready to focus';
  document.getElementById('accessMain').classList.remove('running');
  document.getElementById('pomodoroCard')?.classList.remove('is-running');
  document.getElementById('pomodoroPeriodIcon').innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`;
  updateRingProgress(0);
}

function updateRingProgress(pct) {
  const ring = document.getElementById('pomodoroRingFg');
  if (ring) {
    const circumference = 2 * Math.PI * 45;
    ring.style.strokeDashoffset = circumference - (pct / 100) * circumference;
  }
}

function playPomodoroSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.type = 'sine'; osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
    osc.start(); osc.stop(ctx.currentTime + 0.5);
  } catch (e) { /* sound unavailable */ }
}

function updatePomodoroDisplay() {
  if (!pomodoroState) return;
  
  if (pomodoroState.isRunning && pomodoroState.startedAt) {
    pomodoroState.elapsedSeconds = Math.floor((Date.now() - pomodoroState.startedAt) / 1000);
  }
  
  const totalSeconds = pomodoroState.totalMinutes * 60;
  const remaining = Math.max(0, totalSeconds - pomodoroState.elapsedSeconds);
  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;
  
  document.getElementById('pomodoroTime').textContent = 
    `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  document.getElementById('pomodoroTaskName').textContent = pomodoroState.taskTitle || 'Focus Session';
  
  const pct = ((totalSeconds - remaining) / totalSeconds) * 100;
  updateRingProgress(pct);
  
  if (pomodoroState.isRunning) {
    document.getElementById('pomodoroStatus').textContent = `Focusing... Cycle ${pomodoroState.completedCycles + 1}`;
    document.getElementById('pomodoroPeriodIcon').innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`;
  } else if (pomodoroState.elapsedSeconds > 0) {
    document.getElementById('pomodoroStatus').textContent = 'Paused';
    document.getElementById('pomodoroPeriodIcon').innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>`;
  } else {
    document.getElementById('pomodoroPeriodIcon').innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`;
  }
  
  if (remaining <= 0 && pomodoroState.elapsedSeconds > 0) {
    pausePomodoro();
    pomodoroState.completedCycles++;
    savePomodoroState();
    document.getElementById('pomodoroStatus').textContent = `✅ Completed! (${pomodoroState.completedCycles} cycle${pomodoroState.completedCycles > 1 ? 's' : ''})`;
    document.getElementById('pomodoroPeriodIcon').innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2" stroke-linecap="round"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`;
    playPomodoroSound();
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Pomodoro Complete!', { body: 'Great focus session. Take a break!', icon: '/icon.svg' });
    }
  }
}



function initPomodoro() {
  loadPomodoroState();
  // Fix stale startedAt on page reload — recalculate from elapsed
  if (pomodoroState && pomodoroState.isRunning && pomodoroState.startedAt) {
    pomodoroState.startedAt = Date.now() - (pomodoroState.elapsedSeconds || 0) * 1000;
    savePomodoroState();
  }
  // Pomodoro is opened via the access hub Focus Timer button
  document.getElementById('pomodoroClose')?.addEventListener('click', () => {
    document.getElementById('pomodoroCard')?.classList.add('hidden');
  });
  document.getElementById('pomodoroStartBtn')?.addEventListener('click', startPomodoro);
  document.getElementById('pomodoroResetBtn')?.addEventListener('click', resetPomodoro);
  
  // Preset buttons
  document.querySelectorAll('.pomodoro-preset').forEach(btn => {
    btn.addEventListener('click', () => {
      const mins = parseInt(btn.dataset.minutes);
      if (!pomodoroState || (pomodoroState && !pomodoroState.isRunning && pomodoroState.elapsedSeconds === 0)) {
        setPomodoroPreset(mins);
        if (pomodoroState && !pomodoroState.isRunning) {
          pomodoroState.totalMinutes = mins;
          savePomodoroState();
          updatePomodoroDisplay();
        }
        // If no state yet, update time display directly
        if (!pomodoroState) {
          document.getElementById('pomodoroTime').textContent = `${String(mins).padStart(2, '0')}:00`;
        }
      }
    });
  });
  
  // Restore state
  if (pomodoroState) {
    document.querySelector(`.pomodoro-preset[data-minutes="${pomodoroState.totalMinutes}"]`)?.classList.add('active');
    if (pomodoroState.isRunning) {
      updatePomodoroDisplay();
      if (pomodoroInterval) clearInterval(pomodoroInterval);
      pomodoroInterval = setInterval(updatePomodoroDisplay, 1000);
      document.getElementById('accessMain').classList.add('running');
      document.getElementById('pomodoroStartBtn').innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="none"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg> Pause`;
    }
    if (pomodoroState.elapsedSeconds > 0 && !pomodoroState.isRunning) updatePomodoroDisplay();
  }
}

// ─── HANDLE TASK MODAL PRIORITY ────────────────────────────
function initPrioritySelect() {
  const group = document.getElementById('prioritySelectGroup');
  if (!group) return;
  group.querySelectorAll('.tf-pr').forEach(opt => {
    opt.addEventListener('click', () => {
      group.querySelectorAll('.tf-pr').forEach(o => o.classList.remove('active'));
      opt.classList.add('active');
      state._selectedPriority = parseInt(opt.dataset.priority) || 3;
    });
  });
}

// ─── LEARNING HELPERS ─────────────────────────────────────
function getPreferredTag() {
  if (!state.userProfile?.tags) return null;
  let bestTag = null, bestCount = 0;
  for (const tag of TAG_ORDER) {
    const t = state.userProfile.tags[tag];
    if (t && t.count > bestCount) { bestCount = t.count; bestTag = tag; }
  }
  return bestTag;
}

function getPreferredTitle(tag) {
  const t = state.userProfile?.tags?.[tag];
  if (t && t.titles.length > 0) {
    return getModeValue(t.titles);
  }
  return null;
}

// ─── INIT ──────────────────────────────────────────────────
function init() {
  loadState();
  applyTheme();
  document.querySelectorAll('img[data-image-id]').forEach(el => { el.src = getImage(el.dataset.imageId) || ''; });
  if (dom.filterShowWeekends) dom.filterShowWeekends.checked = state.showWeekends;
  if (dom.filterShowCompleted) dom.filterShowCompleted.checked = state.showCompleted;
  state.currentWeekStart = getMonday(new Date());
  updateTzDisplay();
  updateApiStatus();
  renderCalendar();
  scrollToCurrentTime();
  bindEvents();
  requestNotifPermission();
  scheduleReminderCheck();
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => { if (state.darkMode === null) applyTheme(); });
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
else init();
