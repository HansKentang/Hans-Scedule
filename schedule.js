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

dom.todayBtn       = $('#todayBtn');
dom.prevWeek       = $('#prevWeek');
dom.nextWeek       = $('#nextWeek');
dom.quickTaskBtn   = $('#quickTaskBtn');
dom.apiStatus      = $('#apiStatus');
dom.apiStatusText  = $('#apiStatusText');
dom.tzTooltip      = $('#tzTooltip');
  dom.themeBtn       = $('#themeBtnSidebar');
  // removed settingsBtnSidebar and helpBtn
  dom.helpOverlay    = $('#helpOverlay');
  dom.helpModal      = $('#helpModal');
  dom.helpModalClose = $('#helpModalClose');
  dom.exportDataBtn  = $('#exportDataBtn');
  dom.importDataBtn  = $('#importDataBtn');
  dom.importFileInput= $('#drawerImportFile');
  dom.aiChatBtn      = $('#aiChatBtnSidebar');
  dom.aiChatPanel    = $('#aiChatPanel');
  dom.aiChatOverlay  = $('#aiChatOverlay');
  dom.aiChatMessages = $('#aiChatMessages');
  dom.aiChatInput    = $('#aiChatInput');
  dom.aiChatInputWrapper = $('#aiChatInputWrapper');
  dom.aiChatSend     = $('#aiChatSend');
  dom.aiChatClose    = $('#aiChatClose');

// Unified drag state — handles task-reschedule, quick-add→grid
let gridDrag = null;

// Resize state — handles task card bottom-edge resize
let resizeState = null;

// ─── PAGE CALLBACKS (called from shared.js) ─────────────────
pageAfterTaskSave = () => { renderCalendar(); };
pageAfterImport = () => { renderCalendar(); };

// ─── API STATUS ────────────────────────────────────────────
function updateApiStatus() {
  const hasKey = state.apiKey && state.apiKey.length > 0;
  dom.apiStatus?.classList.toggle('active', hasKey);
  if (dom.apiStatusText) dom.apiStatusText.textContent = hasKey ? 'AI ready' : 'No key';
}

function updateHolidayToggle() {
  var isHoliday = typeof getHolidayMode === 'function' && getHolidayMode();
  var el = document.getElementById('holidayToggle');
  var textEl = document.getElementById('holidayToggleText');
  var iconEl = document.getElementById('holidayToggleIcon');
  if (!el) return;
  el.classList.toggle('active', isHoliday);
  if (textEl) textEl.textContent = isHoliday ? 'Holiday' : 'School';
  if (iconEl) {
    iconEl.innerHTML = isHoliday
      ? '<circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>'
      : '<path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/>';
  }
}

// ─── VIEW SWITCH ──────────────────────────────────────────
function switchView(view) {
  currentView = view;
  state.currentView = view;
  $$('.view-toggle-btn').forEach(b => b.classList.toggle('active', b.dataset.view === view));
  renderCalendar();
  saveState();
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
      const target = addDays(state.currentWeekStart, i);
      const targetWeekStart = getMonday(target);
      if (formatDate(targetWeekStart) !== formatDate(state.currentWeekStart)) {
        state.currentWeekStart = targetWeekStart;
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
    cell.addEventListener('click', (e) => {
      if (isTouchEvent(e)) return;
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
}

function formatShortTime(t) {
  var p = t.split(':').map(Number);
  var h = p[0], m = p[1];
  var ampm = h < 12 ? 'a' : 'p';
  var h12 = h % 12 || 12;
  return m === 0 ? h12 + ampm : h12 + ':' + (m < 10 ? '0' : '') + m + ampm;
}
function formatCompactTime(start, end) {
  if (!start) return '';
  if (!end) return formatShortTime(start);
  var s = formatShortTime(start);
  var e = formatShortTime(end);
  return s === e ? s : s + '\u2013' + e;
}
function renderTasks() {
  $$('.calendar-task').forEach(el => el.remove());
  $$('.current-time-line').forEach(el => el.remove());


  // Expand recurring tasks for the visible week
  const ws = state.currentWeekStart;
  const we = addDays(ws, 7);
  const expanded = expandRecurringTasks(ws, we);

  const filtered = expanded.filter(t => {
    if (isWhiteboardTask(t)) return false;
    if (state.selectedTag && t.tag !== state.selectedTag) return false;
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
      const pCls = task.priority && task.priority < 3 ? ` priority-${task.priority}` : '';
      var shortTime = '';
      if (task.startTime) {
        shortTime = formatCompactTime(task.startTime, task.endTime);
      }
      var tagLabelText = TAG_LABELS[task.tag] || task.tag;
      var durText = '';
      if (task.startTime && task.endTime) {
        var sh = Number(task.startTime.split(':')[0]), sm = Number(task.startTime.split(':')[1]);
        var eh = Number(task.endTime.split(':')[0]), em = Number(task.endTime.split(':')[1]);
        var d = (eh * 60 + em) - (sh * 60 + sm);
        if (d > 0) durText = d >= 60 ? (Math.floor(d / 60) + 'h' + (d % 60 ? ' ' + d % 60 + 'm' : '')) : d + 'm';
      }
      el.innerHTML = `<div class="task-body${pCls}">
          <div class="task-row">
            <span class="task-check${checked}" data-toggle-complete="${task.id}"></span>
            <span class="task-dot"></span>
            <span class="task-title" data-task-id="${task.id}">${escapeHtml(task.title)}</span>
            <span class="task-time">${shortTime}</span>
          </div>
          <div class="task-meta">
            <span class="task-tag-chip" style="--chip-accent:${(TAG_COLORS[task.tag] || TAG_COLORS.meeting).text}">${escapeHtml(tagLabelText)}</span>
            <span class="task-duration">${durText}</span>
          </div>
        </div>
        <div class="task-resize-handle" data-task-id="${task.id}" title="Drag to resize"></div>`;

      const resolvedId = resolveTaskId(task.id);
      el.addEventListener('mousedown', (e) => {
        if (e.target.closest('[data-toggle-complete]')) return;
        if (e.target.closest('.task-resize-handle')) return;
        if (e.target.closest('.task-title')) return;
        e.stopPropagation();
        startDrag(e, el);
      });
      el.addEventListener('touchstart', (e) => {
        if (e.target.closest('[data-toggle-complete]')) return;
        if (e.target.closest('.task-resize-handle')) return;
        if (e.target.closest('.task-title')) return;
        e.stopPropagation();
        startDrag(e, el);
      }, { passive: false });
      el.addEventListener('dblclick', (e) => {
        if (e.target.closest('.task-title')) return;
        e.stopPropagation(); openTaskModal(resolvedId);
      });
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

      // Inline title editing: double-click title to edit
      (function(taskId, titleEl) {
        titleEl.addEventListener('dblclick', function(ev) {
          ev.stopPropagation();
          if (titleEl.classList.contains('is-editing')) return;
          titleEl.classList.add('is-editing');
          var orig = titleEl.textContent;
          var input = document.createElement('input');
          input.type = 'text';
          input.value = orig;
          input.className = 'task-title-input';
          input.style.width = Math.max(40, titleEl.offsetWidth - 10) + 'px';
          titleEl.textContent = '';
          titleEl.appendChild(input);
          input.focus();
          input.select();
          function done() {
            var val = input.value.trim();
            if (val && val !== orig) {
              var tid2 = resolveTaskId(taskId);
              var t = getTask(tid2);
              if (t) updateTask(tid2, { title: val });
            }
            titleEl.classList.remove('is-editing');
            titleEl.textContent = val || orig;
          }
          input.addEventListener('blur', done);
          input.addEventListener('keydown', function(ke) {
            if (ke.key === 'Enter') { input.blur(); }
            if (ke.key === 'Escape') { input.value = orig; input.blur(); }
          });
        });
      })(task.id, el.querySelector('.task-title'));
    }
  }

  // Attach resize handle event listeners
  $$('.task-resize-handle').forEach(h => {
    h.addEventListener('mousedown', onResizeStart);
    h.addEventListener('touchstart', onResizeStart, { passive: false });
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
  if (hour >= 6 && hour < 8) { tag = 'exercise'; title = 'Morning Workout'; }
  else if (hour < 9) { tag = 'deep-work'; title = 'Deep Work Session'; }
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

const QUICK_ADD_TITLES = {
  'deep-work': 'Deep Work Session',
  'meeting': 'Meeting',
  'exercise': 'Workout Session',
  'study': 'Study Session',
  'hobby': 'Hobby Time',
};

// ─── UNIFIED DRAG AND DROP ────────────────────────────────
// One handler for all: task-reschedule, whiteboard→grid, quick-add→grid
var _lastTouchDragTime = 0;
function startDrag(e, source) {
  if (e.button !== 0 && !isTouchEvent(e)) return;
  // Prevent synthetic mousedown from touch event (double-dispatch protection)
  if (!isTouchEvent(e) && Date.now() - _lastTouchDragTime < 300) return;
  if (isTouchEvent(e)) { _lastTouchDragTime = Date.now(); e.preventDefault(); }

  // Clean up any lingering bounce animations from previous drops
  $$('.calendar-task.task-drop-bounce').forEach(el => el.classList.remove('task-drop-bounce'));

  const rect = source.getBoundingClientRect();
  const ghost = source.cloneNode(true);
  ghost.classList.add('grid-drag-ghost');
  ghost.style.cssText = `left:${rect.left}px;top:${rect.top}px;width:${rect.width}px;`;
  document.body.appendChild(ghost);

  const dragPos = getEventPos(e);
  gridDrag = {
    type: 'task',
    source,
    ghost,
    offX: dragPos.x - rect.left,
    offY: dragPos.y - rect.top,
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

  // If dragging a subcategory pill, use its tag + subcategory name as title
  const scPill = source.closest('.sch-sc-pill, .sch-sc-bar-pill');
  if (scPill && scPill.dataset.tag) {
    gridDrag.type = 'quickadd';
    gridDrag.tag = scPill.dataset.tag;
    gridDrag.duration = 60;
    gridDrag.title = scPill.dataset.scName || '';
    ghost.innerHTML = gridDrag.title || QUICK_ADD_TITLES[scPill.dataset.tag] || 'New Task';
  }


  // Apply tag-based styling to ghost
  let ghostTag = null;
  if (gridDrag.type === 'reschedule') {
    const task = getTask(gridDrag.taskId);
    if (task) ghostTag = task.tag;
  } else if (gridDrag.type === 'quickadd' && gridDrag.tag) {
    ghostTag = gridDrag.tag;
  }

  if (ghostTag) {
    const meta = TAG_COLORS[ghostTag] || TAG_COLORS.meeting;
    // Quick-add ghost: white card with plain 'New Task'
    if (gridDrag.type === 'quickadd') {
      ghost.style.background = '#fff';
      ghost.style.color = '#333';
      ghost.style.border = '2px solid var(--border-color)';
      ghost.style.boxShadow = '0 4px 20px rgba(0,0,0,0.12)';
    } else {
      ghost.style.border = `2px solid ${meta.text}`;
      ghost.style.boxShadow = `0 4px 20px color-mix(in srgb, ${meta.text} 25%, transparent)`;
      // For non-task ghosts (quick-add), also set background/color
      if (gridDrag.type !== 'reschedule') {
        ghost.style.background = meta.bg;
        ghost.style.color = meta.text;
      }
    }
  }

  // Add visual drag feedback to source
  source.classList.add('dragging');

  document.body.style.cursor = 'grabbing';
  document.addEventListener('mousemove', onDragMove);
  document.addEventListener('mouseup', onDragEnd);
  document.addEventListener('touchmove', onDragMove, { passive: false });
  document.addEventListener('touchend', onDragEnd);
}

function getDragHlColor() {
  if (gridDrag) {
    if (gridDrag.type === 'quickadd' && gridDrag.tag) return (TAG_COLORS[gridDrag.tag] || TAG_COLORS.meeting).text;
    if (gridDrag.type === 'reschedule') {
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
  const pos = getEventPos(e);
  const { ghost, offX, offY } = gridDrag;
  gridDrag.moved = true;
  ghost.style.left = `${pos.x - offX}px`;
  ghost.style.top = `${pos.y - offY}px`;

  // Find which date column the cursor is over by checking X position
  const dayCols = dom.grid.querySelectorAll('.day-column');
  let matchedDate = null;
  for (const col of dayCols) {
    const rect = col.getBoundingClientRect();
    if (getEventPos(e).x >= rect.left && getEventPos(e).x < rect.right) {
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
    const yOffset = getEventPos(e).y - colRect.top;
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
    if (badge) { badge.style.left = `${pos.x + 16}px`; badge.style.top = `${pos.y + 20}px`; }

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
  const tipPos = getEventPos(e);
  tip.style.left = `${tipPos.x + 16}px`;
  tip.style.top = `${tipPos.y - 8}px`;
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
  if (h >= 6 && h < 8) { tag = 'exercise'; title = 'Morning Workout'; }
  else if (h < 9) { tag = 'deep-work'; title = 'Deep Work Session'; }
  else if (h >= 12 && h < 13) { tag = 'hobby'; title = 'Break'; }
  else if (h >= 17) { tag = 'hobby'; title = 'Personal Time'; }
  return { tag, title, meta: TAG_COLORS[tag] || TAG_COLORS.meeting };
}

function startDragCreate(e, date, startMins) {
  if (dragCreate) return;
  var pos = getEventPos(e);
  dragCreate = {
    date,
    startMins,
    currentMins: startMins,
    moved: false,
    startX: pos.x,
    startY: pos.y,
    ghost: null,
    isTouch: isTouchEvent(e),
  };
  document.addEventListener('mousemove', onDragCreateMove);
  document.addEventListener('mouseup', onDragCreateEnd);
  document.addEventListener('touchmove', onDragCreateMove, { passive: false });
  document.addEventListener('touchend', onDragCreateEnd);
  e.preventDefault();
}

function onDragCreateMove(e) {
  if (!dragCreate) return;
  if (isTouchEvent(e)) { e.preventDefault(); }
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
  const yOffset = getEventPos(e).y - colRect.top;
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
  document.removeEventListener('touchmove', onDragCreateMove);
  document.removeEventListener('touchend', onDragCreateEnd);
  removeDropPreview();
  clearConflictPreview();
  removeDragTooltip();
  document.body.style.cursor = '';

  if (!dragCreate) return;
  if (dragCreate.ghost) dragCreate.ghost.remove();

  if (!dragCreate.moved) {
    // On mobile/touch, skip instant create to avoid accidental task creation
    if (dragCreate.isTouch) { dragCreate = null; return; }
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
    if (hour >= 6 && hour < 8) { tag = 'exercise'; title = 'Morning Workout'; }
    else if (hour < 9) { tag = 'deep-work'; title = 'Deep Work Session'; }
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
    slot.addEventListener('touchstart', (e) => {
      if (e.target.closest('.calendar-task')) return;
      const date = slot.dataset.date;
      const base = parseInt(slot.dataset.time);
      const slotRect = slot.getBoundingClientRect();
      const pos = getEventPos(e);
      const pct = (pos.y - slotRect.top) / slotRect.height;
      const precise = base + pct * 60;
      const snap = roundToNearest(precise, SNAP_MINUTES);
      startDragCreate(e, date, snap);
    }, { passive: false });
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
  document.removeEventListener('touchmove', onDragMove);
  document.removeEventListener('touchend', onDragEnd);

  // Capture ghost rect BEFORE cleanup so FLIP can use it
  const oldGhostRect = gridDrag.ghost ? gridDrag.ghost.getBoundingClientRect() : null;

  // Clean up dragging feedback
  if (gridDrag.source) gridDrag.source.classList.remove('dragging');
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
  let bounceTaskId = gridDrag.type === 'reschedule' ? gridDrag.taskId : null;
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
      title: gridDrag.title || QUICK_ADD_TITLES[gridDrag.tag] || 'New Task',
      date: gridDrag.dropDate,
      startTime: toTimeStr(gridDrag.dropTime),
      endTime: toTimeStr(gridDrag.dropTime + 60),
      tag: gridDrag.tag,
    });
    bounceTaskId = newTask.id;
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
  document.addEventListener('touchmove', onResizeMove, { passive: false });
  document.addEventListener('touchend', onResizeEnd);
}

function onResizeMove(e) {
  if (!resizeState) return;

  const { startM, endM, originalEndM, el, col, startTop, hourHeight } = resizeState;

  // Calculate new end time from mouse Y position relative to column
  const pos = getEventPos(e);
  const yOffset = pos.y - startTop;
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
  var ep = getEventPos(e);
  showResizeTooltip(ep.x, ep.y, startM, snapped);
}

function onResizeEnd(e) {
  if (!resizeState) return;

  document.removeEventListener('mousemove', onResizeMove);
  document.removeEventListener('mouseup', onResizeEnd);
  document.removeEventListener('touchmove', onResizeMove);
  document.removeEventListener('touchend', onResizeEnd);

  const { taskId, startM, el, startTop, hourHeight } = resizeState;
  el.classList.remove('resizing');
  const oldDelta = document.getElementById('resizeDeltaHighlight');
  if (oldDelta) oldDelta.remove();

  // Calculate final end time
  const pos = getEventPos(e);
  const yOffset = pos.y - startTop;
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



// ─── WEEK NAVIGATION ───────────────────────────────────────
function goToday() {
  if (currentView === 'month') {
    currentMonthDate = new Date();
    state.currentMonthDate = new Date(currentMonthDate);
    renderCalendar();
  } else {
    state.currentWeekStart = getMonday(new Date());
    renderCalendar();
  }
  saveState();
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
    state.currentMonthDate = new Date(currentMonthDate);
    renderCalendar();
  } else {
    state.currentWeekStart = addDays(state.currentWeekStart, -7);
    renderCalendar();
  }
  saveState();
}
function goNext() {
  if (currentView === 'month') {
    currentMonthDate.setMonth(currentMonthDate.getMonth() + 1);
    state.currentMonthDate = new Date(currentMonthDate);
    renderCalendar();
  } else {
    state.currentWeekStart = addDays(state.currentWeekStart, 7);
    renderCalendar();
  }
  saveState();
}

// ─── AUTO-SCROLL ──────────────────────────────────────────
function scrollToCurrentTime() {
  // Restore saved scroll position, or scroll to current time
  if (state.savedScrollPosition && dom.container) {
    dom.container.scrollTop = state.savedScrollPosition;
    return;
  }
  const now = new Date();
  const mins = now.getHours() * 60 + now.getMinutes();
  const scrollTarget = ((mins - START_HOUR * 60) / 60) * HOUR_HEIGHT - 100;
  if (scrollTarget > 0 && dom.container) dom.container.scrollTop = scrollTarget;
}

// Save scroll position with debounce
let _scrollSaveTimer = null;
function saveScrollPosition() {
  if (_scrollSaveTimer) clearTimeout(_scrollSaveTimer);
  _scrollSaveTimer = setTimeout(function() {
    if (dom.container) {
      state.savedScrollPosition = dom.container.scrollTop;
      saveState();
    }
  }, 300);
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
  // Undo (Ctrl+Z)
  if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !state.cmdPaletteOpen && !state.taskModalOpen && !state.settingsDrawerOpen && !state.helpModalOpen && !e.target.closest('input, textarea, select')) {
    e.preventDefault();
    if (undo()) {
      showToast('Undo successful', 'info', 2000);
    }
  }
});

// ─── EVENT BINDING ─────────────────────────────────────────
function initPrioritySelect() {
  document.querySelectorAll('#prioritySelectGroup .tf-pr').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#prioritySelectGroup .tf-pr').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });
  document.querySelectorAll('#taskTagPills .tf-tag').forEach(pill => {
    pill.addEventListener('click', () => {
      document.querySelectorAll('#taskTagPills .tf-tag').forEach(b => b.classList.remove('active'));
      pill.classList.add('active');
    });
  });
}

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

  dom.exportDataBtn?.addEventListener('click', exportData);
  dom.importDataBtn?.addEventListener('click', () => { if (dom.importFileInput) { dom.importFileInput.value = ''; dom.importFileInput.click(); } });
  dom.importFileInput?.addEventListener('change', importData);
  dom.themeBtn?.addEventListener('click', toggleTheme);
  // bcVisualsBtn handled via delegation in shared.js
  dom.helpOverlay?.addEventListener('click', hideHelpModal);
  dom.helpModalClose?.addEventListener('click', hideHelpModal);

  // AI Chat
  dom.aiChatBtn?.addEventListener('click', openSettingsBubble);
  dom.aiChatOverlay?.addEventListener('click', hideAIChat);
  dom.aiChatClose?.addEventListener('click', hideAIChat);
  dom.aiChatSend?.addEventListener('click', sendAIMessage);
  dom.aiChatInput?.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendAIMessage(); } });

  // Access Hub
  document.getElementById('accessMain')?.addEventListener('click', toggleAccessHub);
  document.getElementById('accessFocusMode')?.addEventListener('click', () => { toggleAccessHub(); toggleFocusMode(); showToast('🎯 Focus mode ' + (focusModeActive ? 'activated' : 'deactivated'), 'info', 2000); });
  document.getElementById('accessAIChat')?.addEventListener('click', () => { toggleAccessHub(); if (typeof showAIChat === 'function') showAIChat(); });
  document.getElementById('accessScreenshot')?.addEventListener('click', () => { toggleAccessHub(); setTimeout(captureWeekScreenshot, 200); });
  document.getElementById('accessCopyWeek')?.addEventListener('click', () => { toggleAccessHub(); copyWeekToNext(); });

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

  // Quick idea bindings
  // Init priority select + task modal tag pills
  initPrioritySelect();

  renderSchTemplates();

  // ─── Add Category button + color picker ──
  let selectedCatColor = '#8b5cf6';
  const catAddBtn = document.getElementById('catAddBtn');
  const catAddPopup = document.getElementById('catAddPopup');
  const catAddInput = document.getElementById('catAddInput');
  const catAddColor = document.getElementById('catColorPicker');
  const catAddSave = document.getElementById('catAddSave');
  const catAddCancel = document.getElementById('catAddCancel');

  catAddColor?.addEventListener('input', () => { selectedCatColor = catAddColor.value; });

  function closeCatAddPopup() {
    catAddPopup?.classList.add('hidden');
  }

  catAddBtn?.addEventListener('click', (e) => {
    const rect = catAddBtn.getBoundingClientRect();
    catAddPopup.style.left = Math.min(rect.left, window.innerWidth - 220) + 'px';
    catAddPopup.style.top = (rect.bottom + 6) + 'px';
    catAddPopup.classList.toggle('hidden');
    if (!catAddPopup.classList.contains('hidden')) {
      catAddInput.value = '';
      selectedCatColor = '#8b5cf6';
      catAddColor.value = '#8b5cf6';
      catAddInput.focus();
    }
  });

  catAddInput?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); catAddSave?.click(); }
    if (e.key === 'Escape') closeCatAddPopup();
  });

  catAddSave?.addEventListener('click', () => {
    const name = catAddInput.value.trim();
    if (!name) return;
    addCustomCategory(name, selectedCatColor);
    renderSchTemplates();
    closeCatAddPopup();
    showToast(`Category "${name}" added`, 'success', 2000);
  });

  catAddCancel?.addEventListener('click', closeCatAddPopup);

  // Close add-category popup on outside click
  document.addEventListener('click', (e) => {
    if (!catAddPopup?.classList.contains('hidden') && !catAddPopup.contains(e.target) && e.target !== catAddBtn && !catAddBtn?.contains(e.target)) {
      closeCatAddPopup();
    }
  });

  // ─── Right-click delete category chip ──
  document.getElementById('pmChips')?.addEventListener('contextmenu', (e) => {
    const chip = e.target.closest('.sch-pm-chip');
    if (!chip) return;
    const tag = chip.dataset.pmTag;
    if (!tag || BUILTIN_TAGS.includes(tag)) return;
    e.preventDefault();
    const label = TAG_LABELS[tag] || tag;
    if (confirm(`Delete category "${label}"? All subcategories will be removed.`)) {
      removeCustomCategory(tag);
      if (state._openPmTag === tag) {
        state._openPmTag = TAG_ORDER[0];
      }
      showSubcategoryBubble(state._openPmTag);
      renderSchTemplates();
      showToast(`Category "${label}" deleted`, 'info', 2000);
    }
  });

  // ─── Long-press delete on mobile ──
  let longPressTimer = null;
  document.getElementById('pmChips')?.addEventListener('touchstart', (e) => {
    const chip = e.target.closest('.sch-pm-chip');
    if (!chip) return;
    const tag = chip.dataset.pmTag;
    if (!tag || BUILTIN_TAGS.includes(tag)) return;
    longPressTimer = setTimeout(() => {
      const label = TAG_LABELS[tag] || tag;
      if (confirm(`Delete category "${label}"? All subcategories will be removed.`)) {
        removeCustomCategory(tag);
        if (state._openPmTag === tag) {
          state._openPmTag = TAG_ORDER[0];
        }
        showSubcategoryBubble(state._openPmTag);
        renderSchTemplates();
        showToast(`Category "${label}" deleted`, 'info', 2000);
      }
    }, 600);
  });
  document.getElementById('pmChips')?.addEventListener('touchmove', () => { clearTimeout(longPressTimer); });
  document.getElementById('pmChips')?.addEventListener('touchend', () => { clearTimeout(longPressTimer); });

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


  // Schedule-specific menu handlers
  document.getElementById('menuToday')?.addEventListener('click', function() { closeHubMenu(); goToday(); });
  document.getElementById('menuNewTask')?.addEventListener('click', function() {
    closeHubMenu();
    var now = new Date();
    openNewTaskModal(formatDate(now), roundToNearest(now.getHours() * 60 + now.getMinutes(), SNAP_MINUTES));
  });

  // ─── Plus Bubble (schedule-specific) ───────────────
  const PLUS_BUBBLE_KEY = 'haven-plus-bubble-schedule';
  const PLUS_DEFAULTS = [
    { id: 'new-task', label: 'New Task', icon: '+', color: 'var(--accent)' },
    { id: 'today', label: 'Go to Today', icon: '◎', color: 'var(--text-primary)' },
    { id: 'pomodoro', label: 'Pomodoro', icon: '◉', color: 'var(--text-primary)' },
    { id: 'focus', label: 'Focus Mode', icon: '⊙', color: 'var(--text-primary)' },
  ];

  function loadPlusConfig() {
    try { return JSON.parse(localStorage.getItem(PLUS_BUBBLE_KEY)) || PLUS_DEFAULTS; }
    catch { return PLUS_DEFAULTS; }
  }

  function savePlusConfig(cfg) {
    safeSetItem(PLUS_BUBBLE_KEY, JSON.stringify(cfg));
  }

  function renderPlusPopup() {
    var list = document.getElementById('menuPlusList');
    if (!list) return;
    var cfg = loadPlusConfig();
    list.innerHTML = '';
    cfg.forEach(function(a) {
      if (a.visible === false) return;
      var btn = document.createElement('button');
      btn.className = 'plus-action-item';
      btn.innerHTML = '<span style="width:18px;text-align:center;flex-shrink:0;color:' + (a.color || 'var(--text-primary)') + '">' + a.icon + '</span>' + a.label;
      btn.addEventListener('click', function() {
        closeHubMenu();
        handlePlusAction(a.id);
      });
      list.appendChild(btn);
    });
  }

  function handlePlusAction(id) {
    switch (id) {
      case 'new-task':
        var now = new Date();
        openNewTaskModal(formatDate(now), roundToNearest(now.getHours() * 60 + now.getMinutes(), SNAP_MINUTES));
        break;
      case 'today':
        var t = document.getElementById('todayBtn');
        if (t) t.click();
        break;
      case 'pomodoro':
        var p = document.getElementById('pomodoroCard');
        if (p) { p.classList.remove('hidden'); p.classList.toggle('collapsed'); }
        break;
      case 'focus':
        var f = document.getElementById('accessFocusMode');
        if (f) f.click();
        break;
    }
  }

  var menuPlus = document.getElementById('menuPlus');
  var menuPlusPopup = document.getElementById('menuPlusPopup');
  var plusEditing = false;

  function renderPlusEditMode() {
    var list = document.getElementById('menuPlusList');
    if (!list) return;
    var cfg = loadPlusConfig();
    list.innerHTML = '';
    cfg.forEach(function(a, i) {
      var row = document.createElement('div');
      row.style.cssText = 'display:flex;align-items:center;gap:8px;padding:4px 8px;border-radius:6px;margin-bottom:2px';
      row.innerHTML =
        '<label style="display:flex;align-items:center;gap:8px;cursor:pointer;flex:1;font-size:0.8rem">' +
          '<input type="checkbox" data-plus-idx="' + i + '" ' + (a.visible !== false ? 'checked' : '') + ' style="margin:0">' +
          '<span>' + a.label + '</span>' +
        '</label>';
      row.querySelector('input')?.addEventListener('change', function() {
        var idx = parseInt(this.dataset.plusIdx);
        var c = loadPlusConfig();
        c[idx].visible = this.checked;
        savePlusConfig(c);
      });
      list.appendChild(row);
    });
  }

  if (menuPlus && menuPlusPopup) {
    menuPlus.addEventListener('click', function(e) {
      e.stopPropagation();
      plusEditing = false;
      renderPlusPopup();
      menuPlusPopup.classList.toggle('hidden');
    });
    document.getElementById('menuPlusCustomize')?.addEventListener('click', function(e) {
      e.stopPropagation();
      plusEditing = !plusEditing;
      var lbl = document.getElementById('menuPlusCustLabel');
      if (plusEditing) {
        if (lbl) lbl.textContent = 'Done';
        this.style.opacity = '1';
        renderPlusEditMode();
      } else {
        if (lbl) lbl.textContent = 'Customize';
        this.style.opacity = '0.6';
        renderPlusPopup();
      }
    });
    // Close popup on outside click
    document.addEventListener('click', function(e) {
      if (!menuPlus.contains(e.target) && !menuPlusPopup.contains(e.target)) {
        menuPlusPopup.classList.add('hidden');
        plusEditing = false;
        var cust = document.getElementById('menuPlusCustomize');
        var clbl = document.getElementById('menuPlusCustLabel');
        if (clbl) clbl.textContent = 'Customize';
        if (cust) cust.style.opacity = '0.6';
      }
    });
  }

  // Mobile sidebar (separate from hamburger popup)
  const schSidebar = document.getElementById('hubSidebar');
  const schSidebarOverlay = document.getElementById('hubSidebarOverlay');
  function closeSchSidebar() { schSidebar?.classList.remove('open'); schSidebarOverlay?.classList.remove('active'); }
  schSidebarOverlay?.addEventListener('click', closeSchSidebar);
  schSidebar?.querySelectorAll('.hub-snav-item').forEach(item => {
    item.addEventListener('click', closeSchSidebar);
  });

  // Populate shortcuts dynamically
  populateShortcuts();

  let resizeT;
  window.addEventListener('resize', () => { clearTimeout(resizeT); resizeT = setTimeout(renderCalendar, 200); });
  setInterval(() => { if (gridDrag) return; $$('.current-time-line').forEach(el => el.remove()); renderCurrentTime(); }, 60000);
}


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


// ─── POMODORO TIMER ────────────────────────────────────────
let pomodoroInterval = null;

function setPomodoroPreset(mins) {
  document.querySelectorAll('.pomodoro-preset').forEach(b => b.classList.remove('active'));
  document.querySelector(`.pomodoro-preset[data-minutes="${mins}"]`)?.classList.add('active');
  if (!pomodoroState || (pomodoroState && !pomodoroState.isRunning && pomodoroState.elapsedSeconds === 0)) {
    pomodoroState = createPomodoroSession(null, 'Focus Session', mins);
    if (!pomodoroState) return;
    pomodoroState.totalMinutes = mins;
    savePomodoroState();
    updatePomodoroDisplay();
  }
}

function startPomodoro() {
  loadPomodoroState();
  if (!pomodoroState) {
    // Find a task for this pomodoro
    const today = formatDate(new Date());
    const focusTask = state.tasks.find(t => t.date === today && !t.completed && (t.tag === 'deep-work' || t.title.toLowerCase().includes('focus')));
    const taskTitle = focusTask ? focusTask.title : 'Deep Work Session';
    createPomodoroSession(focusTask?.id || null, taskTitle, 25);
  }
  if (!pomodoroState) return;
  
  if (!pomodoroState.isRunning) {
    pomodoroState.isRunning = true;
    pomodoroState.startedAt = Date.now() - (pomodoroState.elapsedSeconds || 0) * 1000;
    savePomodoroState();
    updatePomodoroDisplay();
    if (pomodoroInterval) clearInterval(pomodoroInterval);
    pomodoroInterval = setInterval(updatePomodoroDisplay, 1000);
    document.getElementById('accessMain')?.classList.add('running');
    const btn = document.getElementById('pomodoroStartBtn');
    if (btn) btn.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="none"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg> Pause`;
  } else {
    pausePomodoro();
  }
}

function pausePomodoro() {
  if (!pomodoroState) return;
  pomodoroState.isRunning = false;
  if (pomodoroState.startedAt) {
    pomodoroState.elapsedSeconds = Math.floor((Date.now() - pomodoroState.startedAt) / 1000);
  }
  savePomodoroState();
  if (pomodoroInterval) clearInterval(pomodoroInterval);
  pomodoroInterval = null;
  updatePomodoroDisplay();
  document.getElementById('accessMain')?.classList.remove('running');
  const btn = document.getElementById('pomodoroStartBtn');
  if (btn) btn.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="5 3 19 12 5 21 5 3"/></svg> Resume`;
}

function resetPomodoro() {
  if (pomodoroInterval) clearInterval(pomodoroInterval);
  pomodoroInterval = null;
  const mins = pomodoroState?.totalMinutes || 25;
  pomodoroState = null;
  savePomodoroState();
  document.getElementById('pomodoroTime').textContent = `${String(mins).padStart(2, '0')}:00`;
  const btn = document.getElementById('pomodoroStartBtn');
  if (btn) btn.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="5 3 19 12 5 21 5 3"/></svg> Start`;
  document.getElementById('pomodoroStatus').textContent = 'Ready to focus';
  document.getElementById('accessMain')?.classList.remove('running');
  document.getElementById('pomodoroCard')?.classList.remove('is-running');
  const icon = document.getElementById('pomodoroPeriodIcon');
  if (icon) icon.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`;
  updateRingProgress(0);
}

function updatePomodoroDisplay() {
  if (!pomodoroState) return;
  if (pomodoroState.isRunning && pomodoroState.startedAt) {
    pomodoroState.elapsedSeconds = Math.floor((Date.now() - pomodoroState.startedAt) / 1000);
  }
  const total = pomodoroState.totalMinutes * 60;
  const elapsed = pomodoroState.elapsedSeconds || 0;
  const remaining = Math.max(0, total - elapsed);
  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;
  document.getElementById('pomodoroTime').textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  
  // Task name
  const taskEl = document.getElementById('pomodoroTaskName');
  if (taskEl) taskEl.textContent = pomodoroState.taskTitle || 'Focus Session';
  
  // Progress ring
  const pct = total > 0 ? (elapsed / total) : 0;
  updateRingProgress(pct);
  
  // Status
  const statusEl = document.getElementById('pomodoroStatus');
  if (pomodoroState.isRunning) {
    statusEl.textContent = pomodoroState.isBreak ? 'Break time' : 'Focusing...';
  } else if (elapsed > 0 && !pomodoroState.isRunning) {
    statusEl.textContent = 'Paused';
  } else {
    statusEl.textContent = 'Ready to focus';
  }
  
  // Period icon
  const iconEl = document.getElementById('pomodoroPeriodIcon');
  if (iconEl) {
    if (pomodoroState.isBreak) {
      iconEl.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 8h1a4 4 0 010 8h-1"/><path d="M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/></svg>`;
    } else {
      iconEl.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`;
    }
  }
  
  // Completion check
  if (remaining <= 0 && pomodoroState.isRunning) {
    pausePomodoro();
    pomodoroState.completedCycles = (pomodoroState.completedCycles || 0) + 1;
    savePomodoroState();
    statusEl.textContent = '🎉 Session complete!';
    const iconEl2 = document.getElementById('pomodoroPeriodIcon');
    if (iconEl2) iconEl2.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg>`;
    playPomodoroSound();
    // Browser notification with vibration
    if (typeof _sendNotification === 'function') {
      _sendNotification('\uD83C\uDF89 Pomodoro Complete!', 'Time for a break!', { tag: 'pomodoro', vibratePattern: [200, 100, 200] });
    } else if ('Notification' in window && Notification.permission === 'granted') {
      try { new Notification('\uD83C\uDF89 Pomodoro Complete!', { body: 'Time for a break!' }); if (navigator.vibrate) navigator.vibrate([200, 100, 200]); } catch(e) {}
    }
  }
}

function updateRingProgress(pct) {
  const ring = document.getElementById('pomodoroRingFg');
  if (!ring) return;
  const circumference = 282.74; // 2 * PI * 45
  const offset = circumference * (1 - Math.min(Math.max(pct, 0), 1));
  ring.style.strokeDashoffset = offset;
}

function playPomodoroSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 880;
    osc.type = 'sine';
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.5);
  } catch(e) { /* ignore */ }
}

function openPomodoro() {
  const card = document.getElementById('pomodoroCard');
  if (card) {
    card.classList.toggle('hidden');
    if (!card.classList.contains('hidden')) loadPomodoroState();
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

// ─── SUBCATEGORY BUBBLE ─────────────────────────────────────
function renderSubcategoryBarPill(subcatName, tag, col) {
  return `<span class="sch-sc-bar-pill" data-tag="${tag}" data-sc-name="${escapeHtml(subcatName)}" style="--sc-accent:${col.text}" draggable="true">
    <span class="sc-dot"></span>
    <span class="sc-name">${escapeHtml(subcatName)}</span>
    <button class="sc-bar-edit" data-sc-edit="${escapeHtml(subcatName)}" title="Rename">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
    </button>
    <button class="sc-bar-del" data-sc-del="${escapeHtml(subcatName)}" title="Delete">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
    </button>
  </span>`;
}

function showSubcategoryBubble(tag) {
  document.getElementById('schScBar')?.remove();
  document.removeEventListener('click', closeSubcategoryBubble);

  const pm = document.getElementById('schPillManager');
  if (!pm || !tag) return;

  const subcats = loadSubcategories();
  const subs = subcats[tag] || [];
  const col = TAG_COLORS[tag] || TAG_COLORS.meeting;

  const bar = document.createElement('div');
  bar.className = 'sch-sc-bar';
  bar.id = 'schScBar';

  if (subs.length === 0) {
    bar.innerHTML = `<span class="sch-sc-bar-empty">No subcategories</span>`;
  } else {
    for (const s of subs) {
      bar.innerHTML += renderSubcategoryBarPill(s, tag, col);
    }
  }

  // Add input row
  bar.innerHTML += `<span class="sch-sc-bar-add-row">
    <input type="text" class="sch-sc-bar-add-input" id="scAddInput" placeholder="Add..." maxlength="30" autocomplete="off">
    <button class="sch-sc-bar-add-btn" id="scAddBtn">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
    </button>
  </span>`;

  pm.parentNode.insertBefore(bar, pm.nextSibling);

  // Focus add input
  const addInput = bar.querySelector('#scAddInput');
  if (addInput) setTimeout(() => addInput.focus(), 50);

  // Add subcategory
  const addBtn = bar.querySelector('#scAddBtn');
  const doAdd = () => {
    const val = addInput?.value?.trim();
    if (!val) return;
    addSubcategory(tag, val);
    showSubcategoryBubble(tag);
  };
  addBtn?.addEventListener('click', doAdd);
  addInput?.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); doAdd(); } });

  // Edit subcategory (inline rename)
  bar.querySelectorAll('[data-sc-edit]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const oldName = btn.dataset.scEdit;
      const pill = btn.closest('.sch-sc-bar-pill');
      const nameEl = pill?.querySelector('.sc-name');
      if (!nameEl) return;

      const input = document.createElement('input');
      input.type = 'text';
      input.className = 'sch-sc-bar-add-input';
      input.value = oldName;
      input.maxLength = 30;
      input.style.width = '60px';

      nameEl.replaceWith(input);
      input.focus();
      input.select();

      const finish = () => {
        const newName = input.value.trim();
        if (newName && newName !== oldName) {
          renameSubcategory(tag, oldName, newName);
          showSubcategoryBubble(tag);
        } else {
          showSubcategoryBubble(tag);
        }
      };
      input.addEventListener('blur', finish);
      input.addEventListener('keydown', (ev) => {
        if (ev.key === 'Enter') { ev.preventDefault(); input.blur(); }
        if (ev.key === 'Escape') { input.value = oldName; input.blur(); }
      });
    });
  });

  // Delete subcategory
  bar.querySelectorAll('[data-sc-del]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const name = btn.dataset.scDel;
      removeSubcategory(tag, name);
      showSubcategoryBubble(tag);
    });
  });

  // Drag start on each pill
  bar.querySelectorAll('.sch-sc-bar-pill').forEach(pill => {
    pill.addEventListener('mousedown', (e) => {
      if (e.button !== 0 || e.target.closest('[data-sc-edit]') || e.target.closest('[data-sc-del]')) return;
      startDrag(e, pill);
    });
    pill.addEventListener('touchstart', (e) => {
      if (e.target.closest('[data-sc-edit]') || e.target.closest('[data-sc-del]')) return;
      startDrag(e, pill);
    }, { passive: false });
  });

  // Close on outside click
  setTimeout(() => document.addEventListener('click', closeSubcategoryBubble), 0);
}

function closeSubcategoryBubble(e) {
  const bar = document.getElementById('schScBar');
  const pm = document.getElementById('schPillManager');
  if (!bar) return;
  if (e && (pm?.contains(e.target) || bar?.contains(e.target))) return;
  bar.remove();
  state._openPmTag = null;
  document.removeEventListener('click', closeSubcategoryBubble);
  document.querySelectorAll('.sch-pm-chip').forEach(chip => chip.classList.remove('active'));
}

// ─── RENDER PILL MANAGER (category chips) ─────────────────
function renderSchTemplates() {
  const container = document.getElementById('pmChips');
  if (!container) return;
  const subcats = loadSubcategories();
  let html = '';
  for (const tag of TAG_ORDER) {
    const subs = subcats[tag] || [];
    const col = TAG_COLORS[tag] || TAG_COLORS.meeting;
    const accent = col.text;
    const isOpen = state._openPmTag === tag;
    const isBuiltin = BUILTIN_TAGS.includes(tag);
    html += `<button class="sch-pm-chip${isOpen ? ' active' : ''}" data-pm-tag="${tag}"
      style="--chip-accent:${accent}">
      <span class="sch-pm-chip-dot" style="background:${accent}"></span>
      ${TAG_LABELS[tag]}
      ${subs.length > 0 ? `<span class="sch-pm-chip-count">${subs.length}</span>` : ''}
      ${!isBuiltin ? `<button class="sch-pm-chip-del" data-del-tag="${tag}" title="Delete category">✕</button>` : ''}
    </button>`;
  }
  container.innerHTML = html;

  // Chip click — toggle drawer
  container.querySelectorAll('.sch-pm-chip').forEach(chip => {
    chip.addEventListener('click', (e) => {
      e.stopPropagation();
      const tag = chip.dataset.pmTag;
      if (state._openPmTag === tag) {
        closeSubcategoryBubble();
      } else {
        state._openPmTag = tag;
        renderSchTemplates();
        showSubcategoryBubble(tag);
      }
    });
  });

  // Delete button on custom category chips
  container.querySelectorAll('.sch-pm-chip-del').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const tag = btn.dataset.delTag;
      if (!tag) return;
      const label = TAG_LABELS[tag] || tag;
      if (confirm(`Delete category "${label}"? All tasks with this category will also be permanently removed.`)) {
        removeCustomCategory(tag);
        if (state._openPmTag === tag) {
          state._openPmTag = TAG_ORDER[0] || null;
        }
        renderSchTemplates();
        if (state._openPmTag) showSubcategoryBubble(state._openPmTag);
        renderCalendar();
        showToast(`"${label}" deleted`, 'info', 2000);
      }
    });
  });

}

// ─── INITIALIZATION ─────────────────────────────────────────
(function initSchedule() {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initSchedule);
    return;
  }
  loadState();
  applyTheme();
  if (!state.currentWeekStart) {
    state.currentWeekStart = getMonday(new Date());
  }
  // Restore saved view and month date
  if (state.currentView && ['week','month','agenda'].includes(state.currentView)) {
    currentView = state.currentView;
  }
  if (state.currentMonthDate) {
    currentMonthDate = new Date(state.currentMonthDate);
  }
  $$('.view-toggle-btn').forEach(b => b.classList.toggle('active', b.dataset.view === currentView));
  renderCalendar();
  bindEvents();
  updateApiStatus();
  updateHolidayToggle();
  updateTzDisplay();
  scrollToCurrentTime();
  // Save scroll position on user scroll
  if (dom.container) {
    dom.container.addEventListener('scroll', saveScrollPosition, { passive: true });
  }
  scheduleReminderCheck();
  requestNotifPermission();


  /* ─── Screenshot week (enhanced) ────────────── */
  window.captureWeekScreenshot = function() {
    if (!state || !state.tasks) return;
    var weekStart = state.currentWeekStart;
    if (!weekStart) weekStart = getMonday(new Date());
    var days = getWeekRange(weekStart);
    var visibleDays = state.showWeekends !== false ? days : days.filter(function(d) { return d.getDay() !== 0 && d.getDay() !== 6; });
    var colCount = visibleDays.length;
    if (!colCount) return;

    var now = new Date();
    var todayStr = formatDate(now);
    var currentMins = now.getHours() * 60 + now.getMinutes();

    // Check if it's dark mode
    var isDark = document.documentElement.classList.contains('dark') ||
                 (!document.documentElement.classList.contains('light') &&
                  window.matchMedia('(prefers-color-scheme: dark)').matches);

    // ─── Layout constants ───
    var HEADER_H = 60;      // app branding header
    var DAY_HDR_H = 52;     // day-of-week header row
    var ROW_H = 38;         // per-hour row
    var TIME_W = 56;        // time axis width
    var COL_W = 145;        // each day column
    var totalHours = (typeof VISIBLE_HOURS !== 'undefined' ? VISIBLE_HOURS : 23);
    var startH = (typeof START_HOUR !== 'undefined' ? START_HOUR : 5);
    var scale = 2;
    var topH = HEADER_H + DAY_HDR_H;
    var cw = TIME_W + colCount * COL_W;
    var ch = topH + totalHours * ROW_H;

    // Theme colours
    var bg1 = isDark ? '#1c1b1b' : '#f9f8f4';
    var bg2 = isDark ? '#2a2a2a' : '#f0ece6';
    var textPrimary = isDark ? '#e5e2e1' : '#1c1b1b';
    var textSecondary = isDark ? '#8c928d' : '#7a7670';
    var textTertiary = isDark ? '#6b6b6b' : '#a09c96';
    var borderColor = isDark ? '#3a3939' : '#d7d2ca';
    var borderLight = isDark ? '#2a2a2a' : '#e2ddd6';
    var accent = '#4d6356';
    var accentLight = isDark ? '#b4ccbc' : '#d4e8d8';
    var white = '#ffffff';
    var todayColor = '#3b82f6';
    var weekendBg = isDark ? '#222' : '#f4f2ed';
    var gridLineColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.07)';
    var headerBg = isDark ? '#131313' : '#ffffff';
    var rowAltBg = isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)';

    // Build canvas with outer rounded rect + shadow
    var PAD = 24;
    var RADIUS = 16;
    var innerW = cw;
    var innerH = ch;
    var outerW = innerW + PAD * 2;
    var outerH = innerH + PAD * 2;

    var c = document.createElement('canvas');
    c.width = outerW * scale;
    c.height = outerH * scale;
    var ctx = c.getContext('2d');
    ctx.scale(scale, scale);

    // Shadow behind the card
    ctx.shadowColor = 'rgba(0,0,0,' + (isDark ? '0.5' : '0.12') + ')';
    ctx.shadowBlur = 40;
    ctx.shadowOffsetY = 8;
    ctx.beginPath();
    roundedRect(ctx, PAD, PAD, innerW, innerH, RADIUS);
    ctx.fillStyle = bg1;
    ctx.fill();
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;

    // Clip to inner rounded rect
    ctx.save();
    ctx.beginPath();
    roundedRect(ctx, PAD, PAD, innerW, innerH, RADIUS);
    ctx.clip();

    var ox = PAD, oy = PAD;

    // ─── APP HEADER ───
    var hdrGrad = ctx.createLinearGradient(0, oy, 0, oy + HEADER_H);
    hdrGrad.addColorStop(0, isDark ? '#2a2a2a' : '#ffffff');
    hdrGrad.addColorStop(1, isDark ? '#1c1b1b' : '#f5f2ed');
    ctx.fillStyle = hdrGrad;
    ctx.fillRect(ox, oy, innerW, HEADER_H);

    // Bottom border under header
    ctx.fillStyle = borderColor;
    ctx.fillRect(ox, oy + HEADER_H - 1, innerW, 1);

    // "Havën" logo text
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.font = '600 13px -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif';
    ctx.fillStyle = textPrimary;
    ctx.fillText('Havën', ox + 16, oy + HEADER_H / 2 - 8);
    ctx.font = '400 9px -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif';
    ctx.fillStyle = textSecondary;
    ctx.fillText('Schedule', ox + 16, oy + HEADER_H / 2 + 10);

    // Week label on right side of header
    var firstDayMonth = visibleDays[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    var lastDayMonth = visibleDays[visibleDays.length - 1];
    var lastLabel = lastDayMonth.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.font = '600 12px -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif';
    ctx.fillStyle = textPrimary;
    ctx.fillText(firstDayMonth + ' — ' + lastLabel, ox + innerW - 16, oy + HEADER_H / 2);

    // ─── MAIN BACKGROUND ───
    ctx.fillStyle = bg1;
    ctx.fillRect(ox, oy + HEADER_H, innerW, innerH - HEADER_H);

    // Alternating hour stripes
    ctx.fillStyle = rowAltBg;
    for (var ri = 0; ri < totalHours; ri += 2) {
      ctx.fillRect(ox + TIME_W, oy + topH + ri * ROW_H, innerW - TIME_W, ROW_H);
    }

    // ─── HORIZONTAL GRID LINES ───
    ctx.strokeStyle = gridLineColor;
    ctx.lineWidth = 0.5;
    for (var i = 0; i <= totalHours; i++) {
      var y = oy + topH + i * ROW_H;
      ctx.beginPath();
      ctx.moveTo(ox, y);
      ctx.lineTo(ox + innerW, y);
      ctx.stroke();
    }

    // ─── VERTICAL GRID LINES ───
    for (var j = 0; j <= colCount; j++) {
      var x = ox + TIME_W + j * COL_W;
      ctx.beginPath();
      ctx.moveTo(x, oy + topH);
      ctx.lineTo(x, oy + topH + totalHours * ROW_H);
      ctx.stroke();
    }

    // ─── DAY HEADERS ───
    for (var k = 0; k < visibleDays.length; k++) {
      var d = visibleDays[k];
      var ds = formatDate(d);
      var isT = ds === todayStr;
      var isWE = isWeekend(d);
      var x = ox + TIME_W + k * COL_W;

      // Weekend column background (behind the whole column)
      if (isWE) {
        ctx.fillStyle = weekendBg;
        ctx.fillRect(x, oy + HEADER_H, COL_W, innerH - HEADER_H);
      }

      // Day header cell background
      ctx.fillStyle = isT ? todayColor : (isDark ? '#333' : '#f0f0f0');
      ctx.fillRect(x, oy + HEADER_H, COL_W, DAY_HDR_H);

      // Today accent bar at bottom of header
      if (isT) {
        ctx.fillStyle = '#2563eb';
        ctx.fillRect(x, oy + HEADER_H + DAY_HDR_H - 3, COL_W, 3);
      }

      // Day name label
      var dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = (isT ? 'bold 10px ' : '600 10px ') + '-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif';
      ctx.fillStyle = isT ? white : textSecondary;
      ctx.fillText(dayName.toUpperCase(), x + COL_W / 2, oy + HEADER_H + DAY_HDR_H / 2 - 8);

      // Day number
      ctx.font = (isT ? 'bold 16px ' : '600 14px ') + '-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif';
      if (isT) {
        // Circle for today's number
        ctx.fillStyle = white;
        var cx = x + COL_W / 2;
        var cy = oy + HEADER_H + DAY_HDR_H / 2 + 10;
        ctx.beginPath();
        ctx.arc(cx, cy, 11, 0, Math.PI * 2);
        ctx.fillStyle = todayColor;
        ctx.fill();
        ctx.fillStyle = white;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = 'bold 12px -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif';
        ctx.fillText(String(d.getDate()), cx, cy);
      } else {
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = textPrimary;
        ctx.font = '600 14px -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif';
        ctx.fillText(String(d.getDate()), x + COL_W / 2, oy + HEADER_H + DAY_HDR_H / 2 + 10);
      }
    }

    // ─── TIME AXIS ───
    ctx.fillStyle = isDark ? '#222' : '#f0ece6';
    ctx.fillRect(ox, oy + HEADER_H, TIME_W, innerH - HEADER_H);

    // Time labels
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.font = '9px -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif';
    ctx.fillStyle = textSecondary;
    for (var hh = 0; hh < totalHours; hh++) {
      var hour = startH + hh;
      var disp = hour === 0 ? 12 : (hour > 12 ? hour - 12 : hour);
      var ampm = hour < 12 ? 'AM' : 'PM';
      ctx.fillText(disp + ' ' + ampm, ox + TIME_W - 8, oy + topH + hh * ROW_H + ROW_H / 2);
    }

    // ─── CURRENT TIME LINE ───
    if (currentMins >= startH * 60 && currentMins < (startH + totalHours) * 60) {
      var lineY = oy + topH + ((currentMins - startH * 60) / 60) * ROW_H;
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(ox + TIME_W, lineY);
      ctx.lineTo(ox + innerW, lineY);
      ctx.stroke();
      // Small dot/circle at left edge
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(ox + TIME_W + 4, lineY, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    // ─── TASKS ───
    var ds = formatDate(weekStart);
    var de = formatDate(addDays(weekStart, 7));
    var weekTasks = [];
    for (var ti = 0; ti < state.tasks.length; ti++) {
      var t = state.tasks[ti];
      if (t.date && t.date >= ds && t.date < de && !isWhiteboardTask(t)) weekTasks.push(t);
    }

    // Resolve tag colors to actual hex values
    function getTagHex(tag) {
      var fallback = '#8b5cf6';
      if (typeof TAG_COLORS === 'undefined' || !TAG_COLORS[tag]) return fallback;
      var c = TAG_COLORS[tag].text;
      if (!c) return fallback;
      // If it's a CSS variable, try to read its computed value
      if (typeof c === 'string' && c.startsWith('var(')) {
        var varName = c.slice(4, -1).trim();
        var val = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
        if (val) return val;
        // Fallback defaults
        var defaults = { 'deep-work': '#6366f1', 'meeting': '#3b82f6', 'exercise': '#ef4444', 'study': '#10b981', 'hobby': '#f59e0b' };
        return defaults[tag] || fallback;
      }
      return c;
    }

    for (var ti = 0; ti < weekTasks.length; ti++) {
      var t = weekTasks[ti];
      var dayIdx = -1;
      for (var di = 0; di < visibleDays.length; di++) {
        if (formatDate(visibleDays[di]) === t.date) { dayIdx = di; break; }
      }
      if (dayIdx === -1) continue;

      var startMins = parseTime(t.startTime);
      if (isNaN(startMins)) {
        var parts = t.startTime.split(':');
        startMins = parseInt(parts[0]) * 60 + parseInt(parts[1] || 0);
      }
      var endMins = parseTime(t.endTime);
      if (isNaN(endMins)) endMins = startMins + 60;

      if (startMins >= endMins) endMins = startMins + 30;
      var gridStart = startH * 60;
      var gridEnd = (startH + totalHours) * 60;
      if (startMins < gridStart) startMins = gridStart;
      if (endMins > gridEnd) endMins = gridEnd;
      if (startMins >= endMins) continue;

      var y1 = oy + topH + ((startMins - gridStart) / 60) * ROW_H;
      var y2 = oy + topH + ((endMins - gridStart) / 60) * ROW_H;
      var x1 = ox + TIME_W + dayIdx * COL_W + 5;
      var bw = COL_W - 10;
      var bh = Math.max(y2 - y1, 20);

      var tagColor = getTagHex(t.tag);
      var isCompleted = t.completed || false;
      var taskOpacity = isCompleted ? 0.55 : 1;

      ctx.globalAlpha = taskOpacity;

      // Task card shadow
      ctx.shadowColor = isDark ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.08)';
      ctx.shadowBlur = 6;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 2;

      // Task card background (rounded rect)
      var r = 6;
      ctx.beginPath();
      roundedRect(ctx, x1, y1, bw, bh, r);
      ctx.fillStyle = isDark ? '#2a2a2a' : '#ffffff';
      ctx.fill();

      // Reset shadow for inner elements
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;

      // Task card border (subtle tag-colored)
      ctx.strokeStyle = tagColor + (isDark ? '40' : '30');
      ctx.lineWidth = 1;
      ctx.beginPath();
      roundedRect(ctx, x1, y1, bw, bh, r);
      ctx.stroke();

      // Left accent bar (3px thick)
      ctx.fillStyle = tagColor;
      ctx.beginPath();
      roundedRect(ctx, x1 + 1, y1 + 4, 3, bh - 8, 1.5);
      ctx.fill();

      // Subtle tag-colored background tint
      ctx.fillStyle = tagColor + (isDark ? '12' : '0A');
      ctx.beginPath();
      roundedRect(ctx, x1, y1, bw, bh, r);
      ctx.fill();

      // Title text
      var title = t.title || '';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.font = (isCompleted ? '500 10px ' : '600 10px ') + '-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif';
      ctx.fillStyle = isCompleted ? (isDark ? '#888' : '#999') : textPrimary;

      ctx.save();
      ctx.beginPath();
      ctx.rect(x1 + 10, y1 + 4, bw - 18, bh - 8);
      ctx.clip();

      if (isCompleted) {
        // Draw strikethrough line
        var textX = x1 + 10;
        var textY = y1 + bh / 2;
        ctx.fillText(title, textX, textY);
        var tw = ctx.measureText(title).width;
        ctx.strokeStyle = isDark ? '#888' : '#999';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(textX, textY);
        ctx.lineTo(textX + Math.min(tw, bw - 20), textY);
        ctx.stroke();
      } else {
        ctx.fillText(title, x1 + 10, y1 + bh / 2);
      }
      ctx.restore();

      // Time badge for taller tasks
      if (bh >= 36) {
        var timeStr = formatTimeRangeShort(t.startTime, t.endTime);
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.font = '400 8px -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif';
        ctx.fillStyle = tagColor;
        var badgeX = x1 + 10;
        var badgeY = y1 + bh - 8;
        ctx.save();
        ctx.beginPath();
        ctx.rect(badgeX - 1, badgeY - 5, ctx.measureText(timeStr).width + 6, 12);
        ctx.clip();
        ctx.fillText(timeStr, badgeX, badgeY + 1);
        ctx.restore();
      }

      ctx.globalAlpha = 1;
    }

    // ─── FOOTER: Task count summary ───
    var total = weekTasks.length;
    var completed = weekTasks.filter(function(t) { return t.completed; }).length;
    var footerY = oy + innerH - 2;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'bottom';
    ctx.font = '9px -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif';
    ctx.fillStyle = textTertiary;
    var footerText = total + ' task' + (total !== 1 ? 's' : '');
    if (completed > 0) footerText += ' \u00B7 ' + completed + ' completed';
    ctx.fillText(footerText, ox + innerW - 16, footerY - 4);

    // ─── EXPORT ───
    ctx.restore(); // remove clip

    c.toBlob(function(blob) {
      var link = document.createElement('a');
      link.download = 'Haven-Schedule-' + formatDate(now) + '.png';
      link.href = URL.createObjectURL(blob);
      document.body.appendChild(link);
      link.click();
      setTimeout(function() {
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);
      }, 100);
      if (typeof showToast === 'function') {
        showToast('\uD83D\uDCF7 Schedule screenshot saved!', 'success', 2000);
      }
    }, 'image/png', 0.95);
  };

  // Helper: rounded rect path
  function roundedRect(ctx, x, y, w, h, r) {
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  // Helper: short time range
  function formatTimeRangeShort(start, end) {
    var fmt = function(t) {
      var parts = t.split(':');
      var h = parseInt(parts[0]);
      var m = parseInt(parts[1] || 0);
      var ampm = h < 12 ? 'AM' : 'PM';
      var h12 = h % 12 || 12;
      return h12 + ':' + String(m).padStart(2, '0') + ampm;
    };
    return fmt(start) + ' \u2013 ' + fmt(end);
  }

  /* ─── Copy week to next week ──────────────── */
  window.copyWeekToNext = function() {
    if (typeof showToast !== 'function') return;
    var ws = state.currentWeekStart;
    if (!ws) { showToast('No week loaded', 'error'); return; }
    var weekEnd = addDays(ws, 7);
    var nextMon = addDays(ws, 7);
    var tasks = typeof loadTasks === 'function' ? loadTasks() : (state.tasks || []);
    var weekTasks = tasks.filter(function(t) {
      return t.date && t.date >= formatDate(ws) && t.date < formatDate(weekEnd) && !t.completed;
    });
    if (!weekTasks.length) { showToast('No uncompleted tasks this week', 'info', 2000); return; }
    var copied = 0;
    weekTasks.forEach(function(t) {
      var oldDate = new Date(t.date);
      var newDate = addDays(oldDate, 7);
      createTask({
        title: t.title,
        date: formatDate(newDate),
        startTime: t.startTime,
        endTime: t.endTime,
        tag: t.tag,
        subcategory: t.subcategory || '',
        notes: t.notes || '',
        priority: t.priority || 3
      });
      copied++;
    });
    if (typeof pageAfterTaskSave === 'function') pageAfterTaskSave();
    renderCalendar();
    showToast('Copied ' + copied + ' task' + (copied > 1 ? 's' : '') + ' to next week', 'success', 3000);
  };
})();
