/* ============================================
   Havën Schedule — Schedule Page (Week Grid)
   ============================================ */

// ─── VIEW STATE ────────────────────────────────────────────
let currentView = 'week'; // 'week' | 'month' | 'agenda'
let currentMonthDate = new Date();
let mobileDayDate = null; // current day shown in mobile single-day view

function isMobileLayout() { return window.innerWidth < 640; }

// Mobile add-task FAB — create on demand
let _mobileAddFab = null;
function ensureMobileAddFab() {
  if (_mobileAddFab && _mobileAddFab.parentNode) return _mobileAddFab;
  _mobileAddFab = document.createElement('button');
  _mobileAddFab.id = 'mobileAddFab';
  _mobileAddFab.className = 'mobile-add-fab';
  _mobileAddFab.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>';
  _mobileAddFab.setAttribute('aria-label', 'Add task');
  _mobileAddFab.addEventListener('click', () => {
    const now = new Date();
    const snap = roundToNearest(now.getHours() * 60 + now.getMinutes(), SNAP_MINUTES);
    openNewTaskModal(mobileDayDate || formatDate(now), snap);
  });
  document.body.appendChild(_mobileAddFab);
  return _mobileAddFab;
}

function updateMobileAddFabVisibility() {
  const fab = document.getElementById('mobileAddFab') || _mobileAddFab;
  if (!fab) return;
  if (isMobileLayout() && currentView === 'week') {
    fab.classList.remove('hidden');
  } else {
    fab.classList.add('hidden');
  }
}

// Mobile day navigation — moves within the current week
function navigateMobileDay(direction) {
  const ws = state.currentWeekStart;
  const today = new Date();
  if (!mobileDayDate) mobileDayDate = formatDate(today);
  const current = new Date(mobileDayDate + 'T12:00:00');
  const next = addDays(current, direction);
  const nextStr = formatDate(next);
  const weekEnd = addDays(ws, 7);
  
  // Cross week boundary — advance the week directly (avoid recursion via goNext/goPrev)
  if (next < ws) {
    state.currentWeekStart = addDays(ws, -7);
    // Set to the last day of previous week (Saturday for Mon-based week)
    mobileDayDate = formatDate(addDays(ws, -1));
    renderCalendar();
    saveState();
    return;
  }
  if (next >= weekEnd) {
    state.currentWeekStart = addDays(ws, 7);
    // Set to the first day of next week (Sunday for Mon-based week)
    mobileDayDate = formatDate(weekEnd);
    renderCalendar();
    saveState();
    return;
  }
  
  mobileDayDate = nextStr;
  renderCalendar();
}

// Swipe state for mobile day view
let _mobileSwipeStartX = 0;
let _mobileSwipeStartY = 0;
let _mobileSwipeActive = false;

function initMobileDaySwipe() {
  const container = dom.container || document.getElementById('calendarContainer');
  if (!container) return;
  // Remove old listeners
  container.removeEventListener('touchstart', _onSwipeStart);
  container.removeEventListener('touchmove', _onSwipeMove);
  container.removeEventListener('touchend', _onSwipeEnd);
  container.addEventListener('touchstart', _onSwipeStart, { passive: true });
  container.addEventListener('touchmove', _onSwipeMove, { passive: true });
  container.addEventListener('touchend', _onSwipeEnd, { passive: true });
}

function _onSwipeStart(e) {
  if (!isMobileLayout() || currentView !== 'week') return;
  if (e.touches.length !== 1) return;
  _mobileSwipeStartX = e.touches[0].clientX;
  _mobileSwipeStartY = e.touches[0].clientY;
  _mobileSwipeActive = false;
}

function _onSwipeMove(e) {
  if (!isMobileLayout() || currentView !== 'week') return;
  if (e.touches.length !== 1) return;
  const dx = e.touches[0].clientX - _mobileSwipeStartX;
  const dy = e.touches[0].clientY - _mobileSwipeStartY;
  if (Math.abs(dx) < Math.abs(dy) * 1.5 && Math.abs(dy) > 10) {
    _mobileSwipeActive = false;
    return;
  }
  if (Math.abs(dx) > 10) _mobileSwipeActive = true;
}

function _onSwipeEnd(e) {
  if (!isMobileLayout() || currentView !== 'week' || !_mobileSwipeActive) {
    _mobileSwipeActive = false;
    return;
  }
  _mobileSwipeActive = false;
  const dx = (e.changedTouches?.[0]?.clientX || 0) - _mobileSwipeStartX;
  if (Math.abs(dx) > 40) {
    navigateMobileDay(dx < 0 ? 1 : -1);
  }
}

// ─── DOM REFS (page-specific) ──────────────────────────────
dom.grid          = $('#calendarGrid');
dom.container     = $('#calendarContainer');
dom.weekLabel     = $('#weekLabel');
dom.weekLabelHero = $('#weekLabelHero');
dom.taskCount     = $('#taskCount');
dom.localTz       = $('#localTz');
dom.utcTz         = $('#utcTz');



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

// Time helper: times < START_HOUR (5am) belong to the next day in the grid
function gridTime(str) {
  const m = parseTime(str);
  if (isNaN(m)) return m;
  return m < START_HOUR * 60 ? m + 1440 : m;
}
function gridEndTime(startStr, endStr) {
  const rawStart = parseTime(startStr);
  const rawEnd = endStr ? parseTime(endStr) : rawStart + 60;
  if (isNaN(rawStart)) return rawStart;
  if (isNaN(rawEnd)) return rawStart + 60;
  // If both are < START_HOUR (legacy "04:00" format), both are next-day
  if (rawStart < START_HOUR * 60 && rawEnd < START_HOUR * 60) return rawEnd + 1440;
  // If start is next-day but end isn't (e.g. "04:00"→"05:00"), push end too
  if (rawStart < START_HOUR * 60 && rawEnd >= START_HOUR * 60) return rawEnd + 1440;
  // If start ≥ START_HOUR but end is early next-day (e.g. "23:00"→"00:00"), push end
  if (rawEnd < START_HOUR * 60) return rawEnd + 1440;
  return rawEnd;
}

// Unified drag state — handles task-reschedule, quick-add→grid
let gridDrag = null;

// Resize state — handles task card bottom-edge resize
let resizeState = null;

// Task id of the card just placed by drag/drop (for a one-shot settle animation)
let lastDroppedTaskId = null;
let weekSelected = new Set();
let weekFocusedId = null;
let weekPrefs = { workHours: false, hideDone: false, didAutoScroll: false };
try {
  const p = JSON.parse(localStorage.getItem('haven-week-prefs') || '{}');
  if (p.workHours) weekPrefs.workHours = true;
  if (p.hideDone) weekPrefs.hideDone = true;
} catch (e) {}
function saveWeekPrefs() {
  try { localStorage.setItem('haven-week-prefs', JSON.stringify({ workHours: weekPrefs.workHours, hideDone: weekPrefs.hideDone })); } catch (e) {}
}
function getTagDur(tag) {
  try {
    const m = JSON.parse(localStorage.getItem('haven-tag-durations') || '{}');
    return m[tag] || 60;
  } catch (e) { return 60; }
}
function setTagDur(tag, mins) {
  try {
    const m = JSON.parse(localStorage.getItem('haven-tag-durations') || '{}');
    m[tag] = mins;
    localStorage.setItem('haven-tag-durations', JSON.stringify(m));
  } catch (e) {}
}
function fmtDur(mins) {
  if (mins <= 0) return '';
  if (mins < 60) return mins + 'm';
  const h = Math.floor(mins / 60), m = mins % 60;
  return m ? h + 'h ' + m + 'm' : h + 'h';
}
function slotAddBtnHTML(dateStr, mins) {
  return '<button class="slot-add" data-slot-add="' + dateStr + '|' + mins + '" title="Add task">+</button>';
}

// ─── PAGE CALLBACKS (called from shared.js) ─────────────────
pageAfterTaskSave = () => {
  try {
    const ed = state.editingTask ? getTask(state.editingTask) : null;
    if (ed && ed.tag && ed.startTime && ed.endTime) {
      const d = parseTime(ed.endTime) - parseTime(ed.startTime);
      if (d > 0) setTagDur(ed.tag, d);
    }
  } catch (e) {}
  renderCalendar();
};
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
  const pillMgr = document.getElementById('schPillManager');
  if (pillMgr) pillMgr.style.display = view === 'month' ? 'none' : '';
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
  if (currentView === 'month') {
    updateMobileAddFabVisibility();
    return renderMonthView();
  }
  if (currentView === 'agenda') {
    updateMobileAddFabVisibility();
    return renderAgendaView();
  }
  if (isMobileLayout()) {
    renderMobileDayView();
  } else {
    renderWeekView();
  }
  updateMobileAddFabVisibility();
}

function renderWeekView() {
  const weekStart = state.currentWeekStart;
  const days = getWeekRange(weekStart);
  let html = '';
  const visibleDays = state.showWeekends ? days : days.filter(d => !isWeekend(d));
  const colCount = visibleDays.length;
  const workOnly = weekPrefs.workHours;
  const hStart = workOnly ? 7 : START_HOUR;
  const hEnd = workOnly ? 21 : START_HOUR + VISIBLE_HOURS;
  dom.grid.style.gridTemplateColumns = `var(--time-axis-width) repeat(${colCount}, 1fr)`;
  dom.grid.style.gridTemplateRows = '';

  const dayStats = {};
  for (const day of visibleDays) {
    const ds = formatDate(day);
    const dt = state.tasks.filter(t => t.date === ds && !isWhiteboardTask(t));
    let mins = 0, done = 0, overlaps = 0;
    for (const t of dt) {
      if (!t.startTime || !t.endTime) continue;
      const d = parseTime(t.endTime) - parseTime(t.startTime);
      if (d > 0) mins += d;
      if (t.completed) done++;
    }
    const timed = dt.filter(t => t.startTime && t.endTime && !t.completed);
    for (let i = 0; i < timed.length; i++) {
      for (let j = i + 1; j < timed.length; j++) {
        const a = timed[i], b = timed[j];
        if (parseTime(a.startTime) < parseTime(b.endTime) && parseTime(b.startTime) < parseTime(a.endTime)) overlaps++;
      }
    }
    dayStats[ds] = { count: dt.length, mins, done, overlaps };
  }

  html += '<div class="day-header time-axis-header"></div>';
  for (const day of visibleDays) {
    const cls = ['day-header'];
    if (isToday(day)) cls.push('today');
    if (isWeekend(day)) cls.push('weekend');
    const ds = formatDate(day);
    const st = dayStats[ds] || { count: 0, mins: 0, overlaps: 0 };
    if (st.overlaps >= 2 || st.mins > 480) cls.push('day-crowded');
    const tot = st.mins > 0 ? fmtDur(st.mins) : (st.count ? st.count + ' task' + (st.count > 1 ? 's' : '') : '');
    html += `<div class="${cls.join(' ')}" data-date="${ds}">
      <span class="day-name">${getDayName(day, true)}</span>
      <span class="day-number">${day.getDate()}</span>
      ${tot ? `<span class="day-total">${tot}</span>` : ''}</div>`;
  }

  for (let h = hStart; h < hEnd; h++) {
    const h24 = h % 24;
    const disp = h24 % 12 === 0 ? 12 : h24 % 12;
    const ampm = h24 < 12 ? 'AM' : 'PM';
    const timeMins = h * 60;
    html += `<div class="time-axis time-slot${h % 2 === 0 ? '' : ' time-alt'}" data-time="${timeMins}" data-hour="${h}">
      <span>${disp} ${ampm}</span><span class="half-hour-marker"></span></div>`;
    for (const day of visibleDays) {
      const cls = ['day-column', 'hour-slot'];
      if (isWeekend(day)) cls.push('weekend');
      if (isToday(day)) cls.push('today-column');
      if (h % 2 !== 0) cls.push('hour-alt');
      html += `<div class="${cls.join(' ')}" data-date="${formatDate(day)}" data-time="${timeMins}" data-hour="${h}">
        <span class="half-hour-line"></span>${slotAddBtnHTML(formatDate(day), timeMins)}</div>`;
    }
  }

  dom.grid.innerHTML = html;
  renderTasks();
  renderCurrentTime();
  renderWeekExtras(days);

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
  attachTimeAxisTooltips();
}

// ─── MOBILE DAY VIEW ──────────────────────────────────────
function renderMobileDayView() {
  const weekStart = state.currentWeekStart;
  const days = getWeekRange(weekStart);
  const today = new Date();
  const todayStr = formatDate(today);

  // Determine which day to show
  if (!mobileDayDate) mobileDayDate = todayStr;
  // Ensure mobileDayDate is within the current week
  const md = new Date(mobileDayDate + 'T12:00:00');
  if (md < weekStart || md >= addDays(weekStart, 7)) {
    mobileDayDate = todayStr;
  }

  // Build the grid: time axis + 1 day column
  dom.grid.style.gridTemplateColumns = 'var(--time-axis-width) 1fr';
  dom.grid.style.gridTemplateRows = '';

  let html = '';

  // Day header (with today/weekend classes)
  const activeDay = new Date(mobileDayDate + 'T12:00:00');
  const headerCls = ['day-header'];
  if (isToday(activeDay)) headerCls.push('today');
  if (isWeekend(activeDay)) headerCls.push('weekend');
  const mdt = state.tasks.filter(t => t.date === mobileDayDate && !isWhiteboardTask(t));
  let mMins = 0;
  for (const t of mdt) {
    if (!t.startTime || !t.endTime) continue;
    const d = parseTime(t.endTime) - parseTime(t.startTime);
    if (d > 0) mMins += d;
  }
  const mTot = mMins > 0 ? fmtDur(mMins) : (mdt.length ? mdt.length + ' tasks' : '');
  html += `<div class="${headerCls.join(' ')}" data-date="${mobileDayDate}">
    <span class="day-name">${getDayName(activeDay, false)}</span>
    <span class="day-number">${activeDay.getDate()}</span>
    ${mTot ? `<span class="day-total">${mTot}</span>` : ''}
  </div>`;

  // Time slots
  for (let h = START_HOUR; h < START_HOUR + VISIBLE_HOURS; h++) {
    const h24 = h % 24;
    const disp = h24 % 12 === 0 ? 12 : h24 % 12;
    const ampm = h24 < 12 ? 'AM' : 'PM';
    const timeMins = h * 60;
    html += `<div class="time-axis time-slot${h % 2 === 0 ? '' : ' time-alt'}" data-time="${timeMins}" data-hour="${h}">
      <span>${disp} ${ampm}</span><span class="half-hour-marker"></span></div>`;

    const cls = ['day-column', 'hour-slot'];
    if (isWeekend(activeDay)) cls.push('weekend');
    if (mobileDayDate === todayStr) cls.push('today-column');
    if (h % 2 !== 0) cls.push('hour-alt');
    html += `<div class="${cls.join(' ')}" data-date="${mobileDayDate}" data-time="${timeMins}" data-hour="${h}">
      <span class="half-hour-line"></span></div>`;
  }

  dom.grid.innerHTML = html;

  // Render the day selector bar outside the grid
  renderMobileDayBar(weekStart, todayStr);

  // Mobile: add tap handler on day column for quick task creation
  dom.grid.querySelectorAll('.day-column').forEach(col => {
    col.addEventListener('click', function onClickSlot(e) {
      // Don't trigger if clicking on a task card
      if (e.target.closest('.calendar-task') || e.target.closest('.task-check') || e.target.closest('.task-title')) return;
      if (e.target.closest('.sch-mobile-day-chip')) return;
      const rect = this.getBoundingClientRect();
      const yOffset = e.clientY - rect.top;
      const hourHeight = rect.height;
      const rawMins = (yOffset / hourHeight) * 60 + START_HOUR * 60;
      const snapped = roundToNearest(Math.max(START_HOUR * 60, Math.min(rawMins, (START_HOUR + VISIBLE_HOURS) * 60 - SNAP_MINUTES)), SNAP_MINUTES);
      const date = this.dataset.date || mobileDayDate || formatDate(new Date());
      openNewTaskModal(date, snapped);
    });
  });

  // Render tasks & time line
  renderTasks();
  renderCurrentTime();

  // Update week label — show the selected day name
  const dayLabel = activeDay.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
  dom.weekLabel.textContent = dayLabel;
  if (dom.weekLabelHero) dom.weekLabelHero.textContent = dayLabel;
  dom.taskCount.textContent = state.tasks.filter(t => !isWhiteboardTask(t)).length;

  renderMiniWeek();
  attachTimeAxisTooltips();
  initMobileDaySwipe();

  // Show/hide mobile add FAB
  ensureMobileAddFab();
  updateMobileAddFabVisibility();
}

// ─── MOBILE DAY SELECTOR BAR (rendered outside the grid) ──
function renderMobileDayBar(weekStart, todayStr) {
  let bar = document.getElementById('schMobileDayBar');
  if (!bar) {
    bar = document.createElement('div');
    bar.id = 'schMobileDayBar';
    bar.className = 'sch-mobile-day-bar';
    const container = dom.container || document.getElementById('calendarContainer');
    if (container && container.parentNode) {
      container.parentNode.insertBefore(bar, container);
    }
  }
  
  let html = '';
  for (let i = 0; i < 7; i++) {
    const d = addDays(weekStart, i);
    const ds = formatDate(d);
    const cls = ['sch-mobile-day-chip'];
    if (ds === mobileDayDate) cls.push('active');
    if (ds === todayStr) cls.push('is-today');
    if (isWeekend(d) && !state.showWeekends) cls.push('sch-mob-day-hidden');

    const dayTaskCount = state.tasks.filter(t => t.date === ds && !isWhiteboardTask(t) && !t.completed).length;
    const dotHtml = dayTaskCount > 0 ? '<span class="sch-mob-day-dot"></span>' : '';

    html += `<button class="${cls.join(' ')}" data-date="${ds}" data-day-idx="${i}">
      <span class="sch-mob-day-name">${d.toLocaleDateString('en-US', { weekday: 'short' })}</span>
      <span class="sch-mob-day-num">${d.getDate()}</span>
      ${dotHtml}
    </button>`;
  }
  bar.innerHTML = html;
  
  // Bind day selector clicks
  bar.querySelectorAll('.sch-mobile-day-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const ds = chip.dataset.date;
      if (ds !== mobileDayDate) {
        mobileDayDate = ds;
        renderCalendar();
      }
    });
  });

  // Clean up bar when not in mobile layout
  if (!isMobileLayout()) {
    bar.style.display = 'none';
  } else {
    bar.style.display = '';
  }
}

const MONTH_MISSIONS_KEY = 'haven-month-missions';

function renderWeekExtras(days) {
  try { renderUnscheduledTray(); } catch (e) {}
  try { renderWeekProgress(days); } catch (e) {}
  try { updateWeekToolbar(); } catch (e) {}
  try { bindSlotCreate(); } catch (e) {}
  try { bindWeekKeys(); } catch (e) {}
  if (!weekPrefs.didAutoScroll) {
    setTimeout(scrollToNow, 120);
  }
}

function renderUnscheduledTray() {
  const tray = document.getElementById('unschedTray');
  const wrap = document.getElementById('unschedChips');
  const count = document.getElementById('unschedCount');
  if (!tray || !wrap) return;
  const all = state.tasks.filter(t => isWhiteboardTask(t));
  const list = all.slice(0, 20);
  if (!list.length) { tray.classList.remove('has-items'); wrap.innerHTML = ''; return; }
  tray.classList.add('has-items');
  if (count) count.textContent = all.length;
  wrap.innerHTML = '';
  for (const t of list) {
    const chip = document.createElement('div');
    chip.className = 'unsched-chip';
    chip.dataset.taskId = t.id;
    const label = document.createElement('span');
    label.textContent = t.title || 'Untitled';
    const btn = document.createElement('button');
    btn.textContent = 'Schedule';
    btn.addEventListener('click', (ev) => {
      ev.stopPropagation();
      const now = new Date();
      openNewTaskModal(formatDate(now), roundToNearest(now.getHours() * 60 + now.getMinutes(), SNAP_MINUTES), { title: t.title, tag: t.tag });
    });
    chip.appendChild(label);
    chip.appendChild(btn);
    chip.addEventListener('mousedown', (ev) => {
      if (ev.button !== 0 || ev.target.closest('button')) return;
      ev.stopPropagation();
      startDrag(ev, chip, { unschedTask: t, chipEl: chip });
    });
    chip.addEventListener('touchstart', (ev) => {
      if (ev.target.closest('button')) return;
      ev.stopPropagation();
      startDrag(ev, chip, { unschedTask: t, chipEl: chip });
    }, { passive: false });
    wrap.appendChild(chip);
  }
}

function renderWeekProgress(days) {
  const bar = document.getElementById('weekProgress');
  if (!bar) return;
  if (currentView !== 'week') { bar.classList.remove('show'); return; }
  const set = new Set(days.map(formatDate));
  const wt = state.tasks.filter(t => set.has(t.date) && !isWhiteboardTask(t));
  const done = wt.filter(t => t.completed).length;
  let mins = 0, doneMins = 0;
  for (const t of wt) {
    if (!t.startTime || !t.endTime) continue;
    const d = parseTime(t.endTime) - parseTime(t.startTime);
    if (d > 0) { mins += d; if (t.completed) doneMins += d; }
  }
  bar.classList.add('show');
  const pct = wt.length ? Math.round(done / wt.length * 100) : 0;
  const fill = document.getElementById('wpFill');
  const txt = document.getElementById('wpText');
  const tm = document.getElementById('wpTime');
  if (fill) fill.style.width = pct + '%';
  if (txt) txt.textContent = done + '/' + wt.length + ' done (' + pct + '%)';
  if (tm) tm.textContent = mins ? fmtDur(doneMins) + ' / ' + fmtDur(mins) : '';
}

function updateWeekToolbar() {
  const wh = document.getElementById('workHoursBtn');
  const hd = document.getElementById('hideDoneBtn');
  if (wh) wh.classList.toggle('active', !!weekPrefs.workHours);
  if (hd) hd.classList.toggle('active', !!weekPrefs.hideDone);
  updateBulkBar();
}

function updateBulkBar() {
  const bar = document.getElementById('bulkBar');
  if (!bar) return;
  const n = weekSelected.size;
  bar.classList.toggle('show', n > 0);
  const c = document.getElementById('bulkCount');
  if (c) c.textContent = n + ' selected';
  document.querySelectorAll('.calendar-task.task-selected').forEach(el => {
    if (!weekSelected.has(el.dataset.taskId)) el.classList.remove('task-selected');
  });
  weekSelected.forEach(id => {
    const el = document.querySelector('.calendar-task[data-task-id="' + id + '"]');
    if (el) el.classList.add('task-selected');
  });
}

function clearWeekSelection() {
  weekSelected.clear();
  updateBulkBar();
}

function toggleWeekSelect(id, el) {
  if (weekSelected.has(id)) weekSelected.delete(id);
  else weekSelected.add(id);
  if (el) el.classList.toggle('task-selected', weekSelected.has(id));
  updateBulkBar();
}

function scrollToNow() {
  const cont = dom.container;
  if (!cont || !dom.grid) return;
  weekPrefs.didAutoScroll = true;
  const line = dom.grid.querySelector('.current-time-line');
  if (line) {
    cont.scrollTop = Math.max(0, line.offsetTop - cont.clientHeight / 3);
    return;
  }
  const now = new Date();
  const mins = now.getHours() * 60 + now.getMinutes();
  const h = weekPrefs.workHours ? Math.max(7, Math.min(21, Math.floor(mins / 60))) : Math.floor(mins / 60);
  const slot = dom.grid.querySelector('.day-column[data-hour="' + h + '"]');
  if (slot) cont.scrollTop = Math.max(0, slot.offsetTop - cont.clientHeight / 3);
}

function showTaskCtx(x, y, taskId) {
  hideTaskCtx();
  const menu = document.createElement('div');
  menu.id = 'taskCtxMenu';
  menu.innerHTML = '<button data-a="edit">Edit</button><button data-a="dup">Duplicate</button><button data-a="done">Toggle done</button><button data-a="today">Move to today</button><button data-a="tomorrow">Move to tomorrow</button><button data-a="del" class="danger">Delete</button>';
  document.body.appendChild(menu);
  menu.style.left = Math.min(window.innerWidth - 180, x) + 'px';
  menu.style.top = Math.min(window.innerHeight - 220, y) + 'px';
  menu.classList.add('show');
  menu.addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    const t = getTask(taskId);
    hideTaskCtx();
    if (!t) return;
    const a = b.dataset.a;
    if (a === 'edit') openTaskModal(taskId);
    else if (a === 'dup') duplicateTask(taskId);
    else if (a === 'done') updateTask(taskId, { completed: !t.completed });
    else if (a === 'today') updateTask(taskId, { date: formatDate(new Date()) });
    else if (a === 'tomorrow') { const n = new Date(); n.setDate(n.getDate() + 1); updateTask(taskId, { date: formatDate(n) }); }
    else if (a === 'del') deleteTask(taskId);
  });
  setTimeout(() => document.addEventListener('click', hideTaskCtx, { once: true }), 0);
}

function hideTaskCtx() {
  document.getElementById('taskCtxMenu')?.remove();
}

function duplicateTask(taskId) {
  const t = getTask(taskId);
  if (!t) return;
  const ids = weekSelected.size > 1 && weekSelected.has(taskId) ? Array.from(weekSelected) : [taskId];
  pushUndo();
  for (const id of ids) {
    const s = getTask(id);
    if (!s) continue;
    const mins = s.startTime && s.endTime ? parseTime(s.endTime) - parseTime(s.startTime) : 60;
    const dur = mins > 0 ? mins : 60;
    const base = parseTime(s.endTime || s.startTime) || 0;
    const endM = Math.min(base + dur, 24 * 60);
    const startM = s.endTime && base + dur <= 24 * 60 ? base : Math.max(0, endM - dur);
    const copy = {
      id: uid(), title: s.title + ' (copy)', tag: s.tag, subcategory: s.subcategory || '',
      date: s.date, startTime: minutesToTime(startM), endTime: minutesToTime(endM),
      notes: s.notes || '', priority: s.priority || 0, completed: false
    };
    state.tasks.push(copy);
    lastDroppedTaskId = copy.id;
  }
  saveState();
  renderCalendar();
}

function cancelGridDrag() {
  if (!gridDrag) return;
  removeGridDragListeners();
  if (gridDrag.source) gridDrag.source.classList.remove('dragging');
  if (gridDrag.pressEl) gridDrag.pressEl.classList.remove('pressing');
  if (gridDrag.ghost) gridDrag.ghost.remove();
  removeDropPreview();
  clearConflictPreview();
  removeDragTooltip();
  document.body.style.cursor = '';
  gridDrag = null;
}

function removeGridDragListeners() {
  document.removeEventListener('mousemove', onDragMove);
  document.removeEventListener('mouseup', onDragEnd);
  document.removeEventListener('touchmove', onDragMove);
  document.removeEventListener('touchend', onDragEnd);
  document.removeEventListener('touchcancel', onDragEnd);
}

function moveFocused(mins) {
  if (!weekFocusedId) return;
  const t = getTask(weekFocusedId);
  if (!t || !t.startTime || !t.endTime) return;
  const a = parseTime(t.startTime) + mins, b = parseTime(t.endTime) + mins;
  if (a < 0 || b > 24 * 60) return;
  updateTask(weekFocusedId, { startTime: minutesToTime(a), endTime: minutesToTime(b) });
}

function bindSlotCreate() {
  dom.grid.querySelectorAll('[data-slot-add]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const parts = (btn.dataset.slotAdd || '').split('|');
      openNewTaskModal(parts[0], roundToNearest(Number(parts[1] || 0) + 15, SNAP_MINUTES));
    });
  });
  if (dom.grid.dataset.createBound) return;
  dom.grid.dataset.createBound = '1';
  let cDrag = null;
  const posToMins = (col, clientY) => {
    const r = col.getBoundingClientRect();
    const frac = Math.max(0, Math.min(1, (clientY - r.top) / Math.max(1, r.height)));
    return Number(col.dataset.time || 0) + frac * 60;
  };
  dom.grid.addEventListener('mousedown', (e) => {
    if (currentView !== 'week' || isMobileLayout()) return;
    if (e.button !== 0) return;
    const col = e.target.closest('.day-column.hour-slot');
    if (!col || e.target.closest('.calendar-task') || e.target.closest('.slot-add')) return;
    const startM = roundToNearest(posToMins(col, e.clientY), SNAP_MINUTES);
    cDrag = { col, date: col.dataset.date, startM, curM: startM, el: null, moved: false };
    e.preventDefault();
  });
  document.addEventListener('mousemove', (e) => {
    if (!cDrag) return;
    cDrag.moved = true;
    const cols = Array.from(dom.grid.querySelectorAll('.day-column.hour-slot[data-date="' + cDrag.date + '"]'));
    let best = cDrag.col, bestDist = Infinity;
    for (const c of cols) {
      const r = c.getBoundingClientRect();
      const d = e.clientY < r.top ? r.top - e.clientY : (e.clientY > r.bottom ? e.clientY - r.bottom : 0);
      if (d < bestDist) { bestDist = d; best = c; }
    }
    cDrag.col = best;
    cDrag.curM = roundToNearest(posToMins(best, e.clientY), SNAP_MINUTES);
    const a = Math.min(cDrag.startM, cDrag.curM), b = Math.max(cDrag.startM, cDrag.curM) + SNAP_MINUTES;
    if (!cDrag.el) {
      cDrag.el = document.createElement('div');
      cDrag.el.className = 'create-drag-preview';
      cDrag.el.innerHTML = '<span></span>';
    }
    if (cDrag.el.parentNode !== best) best.appendChild(cDrag.el);
    const px = actualHourHeight();
    cDrag.el.style.top = ((a - Number(best.dataset.time || 0)) / 60 * px) + 'px';
    cDrag.el.style.height = Math.max(18, (b - a) / 60 * px) + 'px';
    cDrag.el.querySelector('span').textContent = formatCompactTime(minutesToTime(a), minutesToTime(b));
    best.classList.add('slot-hover');
  });
  document.addEventListener('mouseup', (e) => {
    if (!cDrag) return;
    const d = cDrag;
    cDrag = null;
    document.querySelectorAll('.hour-slot.slot-hover').forEach(s => s.classList.remove('slot-hover'));
    if (d.el) d.el.remove();
    if (e.target.closest && e.target.closest('.slot-add')) return;
    const a = Math.min(d.startM, d.curM), b = Math.max(d.startM, d.curM) + SNAP_MINUTES;
    if (!d.moved || b - a <= SNAP_MINUTES) { openNewTaskModal(d.date, a); return; }
    openNewTaskModal(d.date, a, { start: minutesToTime(a), end: minutesToTime(b) });
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && gridDrag) { try { cancelGridDrag(); } catch (err) {} }
    if (e.key === 'Escape' && cDrag) { if (cDrag.el) cDrag.el.remove(); cDrag = null; }
    if (e.key === 'Escape' && weekSelected.size) clearWeekSelection();
    hideTaskCtx();
  });
}

function bindWeekKeys() {
  if (document.body.dataset.weekKeysBound) return;
  document.body.dataset.weekKeysBound = '1';
  document.addEventListener('keydown', (e) => {
    const tag = (e.target.tagName || '').toUpperCase();
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || e.target.isContentEditable) return;
    if (currentView !== 'week' || state.taskModalOpen) return;
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'd' && weekFocusedId) {
      e.preventDefault();
      duplicateTask(weekFocusedId);
      return;
    }
    if (!weekFocusedId) return;
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      e.preventDefault();
      moveFocused((e.key === 'ArrowUp' ? -1 : 1) * (e.shiftKey ? 60 : 15));
    } else if (e.key === 'Enter' || e.key.toLowerCase() === 'e') {
      e.preventDefault();
      openTaskModal(weekFocusedId);
    } else if (e.key === 'Delete' || e.key === 'Backspace') {
      e.preventDefault();
      deleteTask(weekFocusedId);
      weekFocusedId = null;
    }
  });
  document.getElementById('nowBtn')?.addEventListener('click', scrollToNow);
  document.getElementById('workHoursBtn')?.addEventListener('click', () => {
    weekPrefs.workHours = !weekPrefs.workHours;
    saveWeekPrefs();
    renderCalendar();
  });
  document.getElementById('hideDoneBtn')?.addEventListener('click', () => {
    weekPrefs.hideDone = !weekPrefs.hideDone;
    saveWeekPrefs();
    renderCalendar();
  });
  document.getElementById('bulkDone')?.addEventListener('click', () => {
    pushUndo();
    weekSelected.forEach(id => { const t = getTask(id); if (t) t.completed = true; });
    saveState(); renderCalendar();
  });
  document.getElementById('bulkDelete')?.addEventListener('click', () => {
    pushUndo();
    state.tasks = state.tasks.filter(t => !weekSelected.has(t.id));
    weekSelected.clear();
    saveState(); renderCalendar();
  });
  document.getElementById('bulkDup')?.addEventListener('click', () => {
    const first = Array.from(weekSelected)[0];
    if (first) duplicateTask(first);
    weekSelected.clear();
    updateBulkBar();
  });
  document.getElementById('bulkClear')?.addEventListener('click', clearWeekSelection);
}

function loadMonthMissions() {
  try {
    const raw = localStorage.getItem(MONTH_MISSIONS_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    if (!parsed || typeof parsed !== 'object') return {};
    for (const k of Object.keys(parsed)) {
      if (typeof parsed[k] === 'string') parsed[k] = [parsed[k]];
      if (!Array.isArray(parsed[k])) delete parsed[k];
    }
    return parsed;
  } catch (e) { return {}; }
}

function saveMonthMissions(missions) {
  try { localStorage.setItem(MONTH_MISSIONS_KEY, JSON.stringify(missions)); } catch (e) { /* ignore */ }
}

function getDayMissions(ds) {
  const v = loadMonthMissions()[ds];
  return Array.isArray(v) ? v : [];
}

function addDayMission(ds, text) {
  const clean = (text || '').trim().slice(0, 120);
  if (!clean) return;
  const missions = loadMonthMissions();
  if (!Array.isArray(missions[ds])) missions[ds] = [];
  missions[ds].push(clean);
  saveMonthMissions(missions);
}

function updateDayMission(ds, idx, text) {
  const clean = (text || '').trim().slice(0, 120);
  const missions = loadMonthMissions();
  if (!Array.isArray(missions[ds])) return;
  if (clean) missions[ds][idx] = clean;
  else missions[ds].splice(idx, 1);
  if (!missions[ds].length) delete missions[ds];
  saveMonthMissions(missions);
}

function deleteDayMission(ds, idx) {
  const missions = loadMonthMissions();
  if (!Array.isArray(missions[ds])) return;
  missions[ds].splice(idx, 1);
  if (!missions[ds].length) delete missions[ds];
  saveMonthMissions(missions);
}

function moveMonthMission(srcDs, srcIdx, dstDs, dstIdx) {
  if (srcDs === dstDs && srcIdx === dstIdx) return;
  const missions = loadMonthMissions();
  const src = missions[srcDs];
  if (!Array.isArray(src) || !src[srcIdx]) return;
  const [item] = src.splice(srcIdx, 1);
  if (!src.length) delete missions[srcDs];
  if (!Array.isArray(missions[dstDs])) missions[dstDs] = [];
  const insertAt = Math.max(0, Math.min(dstIdx == null ? missions[dstDs].length : dstIdx, missions[dstDs].length));
  missions[dstDs].splice(insertAt, 0, item);
  if (!missions[dstDs].length) delete missions[dstDs];
  saveMonthMissions(missions);
}

let _missionClickTimer = null;
let _missionDblFired = false;

function closeMissionEditor() {
  dom.grid?.querySelectorAll('.month-mission-editor').forEach(el => el.remove());
  dom.grid?.querySelectorAll('.month-mission-wrap.editing').forEach(el => el.classList.remove('editing'));
}

function openMissionEditor(cell, ds, existing, idx) {
  if (!cell) return;
  closeMissionEditor();
  const wrap = cell.querySelector('.month-mission-wrap');
  if (!wrap) return;
  wrap.classList.add('editing');
  const isEdit = typeof idx === 'number' && idx >= 0;
  const editor = document.createElement('div');
  editor.className = 'month-mission-editor';
  editor.innerHTML = `<textarea maxlength="120" placeholder="Today\u2019s mission\u2026">${escapeHtml(existing || '')}</textarea>
    <div class="month-mission-editor-row">
      <button class="month-mission-save">Save</button>
      <button class="month-mission-cancel">Cancel</button>
      ${isEdit ? '<button class="month-mission-clear">Delete</button>' : ''}
    </div>`;
  wrap.appendChild(editor);
  const ta = editor.querySelector('textarea');
  ta.focus();
  ta.select();
  const save = () => {
    if (isEdit) updateDayMission(ds, idx, ta.value);
    else addDayMission(ds, ta.value);
    renderMonthView();
  };
  editor.querySelector('.month-mission-save').addEventListener('click', (e) => { e.stopPropagation(); save(); });
  editor.querySelector('.month-mission-cancel').addEventListener('click', (e) => { e.stopPropagation(); renderMonthView(); });
  editor.querySelector('.month-mission-clear')?.addEventListener('click', (e) => {
    e.stopPropagation();
    deleteDayMission(ds, idx);
    renderMonthView();
  });
  ta.addEventListener('keydown', (e) => {
    e.stopPropagation();
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); save(); }
    if (e.key === 'Escape') renderMonthView();
  });
  ta.addEventListener('click', (e) => e.stopPropagation());
  editor.addEventListener('click', (e) => e.stopPropagation());
}

function renderMonthView() {
  const now = new Date();
  const year = currentMonthDate.getFullYear();
  const month = currentMonthDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startPad = firstDay.getDay();
  const daysInMonth = lastDay.getDate();
  const prevMonthLast = new Date(year, month, 0).getDate();
  const rows = Math.ceil((startPad + daysInMonth) / 7);
  const totalCells = rows * 7;

  const missions = loadMonthMissions();
  const todayStr = formatDate(now);
  const title = firstDay.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  dom.weekLabel.textContent = title;
  if (dom.weekLabelHero) dom.weekLabelHero.textContent = title;

  let visibleCount = 0;
  for (const [ds, list] of Object.entries(missions)) {
    const d = new Date(ds + 'T12:00:00');
    if (d.getFullYear() === year && d.getMonth() === month && Array.isArray(list)) visibleCount += list.length;
  }
  if (dom.taskCount) dom.taskCount.textContent = visibleCount;

  dom.grid.style.gridTemplateColumns = 'repeat(7, 1fr)';
  dom.grid.style.gridTemplateRows = `auto repeat(${rows}, minmax(110px, 1fr))`;
  let html = '';
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  for (const dn of dayNames) {
    html += `<div class="day-header month-head"><span class="day-name">${dn}</span></div>`;
  }

  for (let idx = 0; idx < totalCells; idx++) {
    let d, dayNum, adjacent = false;
    if (idx < startPad) {
      dayNum = prevMonthLast - startPad + 1 + idx;
      d = new Date(year, month - 1, dayNum);
      adjacent = true;
    } else if (idx < startPad + daysInMonth) {
      dayNum = idx - startPad + 1;
      d = new Date(year, month, dayNum);
    } else {
      dayNum = idx - (startPad + daysInMonth) + 1;
      d = new Date(year, month + 1, dayNum);
      adjacent = true;
    }
    const ds = formatDate(d);
    const cls = ['month-cell', 'mission-cell'];
    if (ds === todayStr) cls.push('month-today');
    if (adjacent) cls.push('month-adjacent');
    else if (isWeekend(d)) cls.push('month-weekend');

    const dayMissions = getDayMissions(ds);
    const compact = dayMissions.length > 3;
    const missionHtml = dayMissions
      .map((m, i) => `<div class="month-mission${compact ? ' month-mission-compact' : ''}" draggable="true" data-date="${ds}" data-idx="${i}" title="${escapeHtml(m)}"><span class="month-mission-text">${escapeHtml(m)}</span><button class="month-mission-del" title="Delete">\u00d7</button></div>`)
      .join('');
    html += `<div class="${cls.join(' ')}" data-date="${ds}">
      <div class="month-top"><span class="month-day-num">${dayNum}</span><button class="month-add-btn" title="Add mission">+</button></div>
      <div class="month-mission-wrap">${missionHtml}</div>
    </div>`;
  }

  dom.grid.innerHTML = html;

  dom.grid.querySelectorAll('.mission-cell').forEach(cell => {
    const ds = cell.dataset.date;
    const addBtn = cell.querySelector('.month-add-btn');

    addBtn?.addEventListener('click', (e) => { e.stopPropagation(); openMissionEditor(cell, ds, ''); });

    cell.addEventListener('click', (e) => {
      if (e.target.closest('.month-mission-editor') || e.target.closest('.month-mission-del') || e.target.closest('.month-add-btn') || e.target.closest('.month-mission')) return;
      if (_missionDblFired) return;
      clearTimeout(_missionClickTimer);
      _missionClickTimer = setTimeout(() => { if (!_missionDblFired) openMissionEditor(cell, ds, ''); }, 240);
    });
    cell.addEventListener('dblclick', () => {
      _missionDblFired = true;
      clearTimeout(_missionClickTimer);
      closeMissionEditor();
      const d = new Date(ds + 'T12:00:00');
      state.currentWeekStart = getMonday(d);
      switchView('week');
      setTimeout(() => { _missionDblFired = false; }, 400);
    });

    cell.querySelectorAll('.month-mission').forEach(chip => {
      const idx = parseInt(chip.dataset.idx, 10);

      chip.querySelector('.month-mission-del')?.addEventListener('click', (e) => {
        e.stopPropagation();
        deleteDayMission(ds, idx);
        renderMonthView();
      });

      chip.addEventListener('click', (e) => {
        if (e.target.closest('.month-mission-del')) return;
        e.stopPropagation();
        openMissionEditor(cell, ds, getDayMissions(ds)[idx] || '', idx);
      });

      chip.addEventListener('dragstart', (e) => {
        closeMissionEditor();
        e.dataTransfer.setData('text/plain', `${ds}|${idx}`);
        e.dataTransfer.effectAllowed = 'move';
        chip.classList.add('mission-drag-src');
      });
      chip.addEventListener('dragend', () => {
        chip.classList.remove('mission-drag-src');
        dom.grid?.querySelectorAll('.mission-drop-hl').forEach(el => el.classList.remove('mission-drop-hl'));
      });
    });

    cell.addEventListener('dragover', (e) => {
      if (!e.dataTransfer || ![...e.dataTransfer.types].includes('text/plain')) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      cell.classList.add('mission-drop-hl');
    });
    cell.addEventListener('dragleave', (e) => {
      if (!cell.contains(e.relatedTarget)) cell.classList.remove('mission-drop-hl');
    });
    cell.addEventListener('drop', (e) => {
      e.preventDefault();
      cell.classList.remove('mission-drop-hl');
      const raw = e.dataTransfer.getData('text/plain');
      if (!raw || !raw.includes('|')) return;
      const [srcDs, idxStr] = raw.split('|');
      const srcIdx = parseInt(idxStr, 10);
      if (!srcDs || isNaN(srcIdx)) return;
      const dayList = getDayMissions(ds);
      const overChip = e.target.closest('.month-mission');
      const targetIdx = overChip && overChip.dataset.date === ds
        ? parseInt(overChip.dataset.idx, 10)
        : dayList.length;
      moveMonthMission(srcDs, srcIdx, ds, targetIdx);
      renderMonthView();
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
  dom.grid.style.gridTemplateRows = '';
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
        const repeatIcon = task.repeat && task.repeat.type !== 'none' ? ' ⟳' : '';
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
  var h24 = p[0] % 24, m = p[1];
  var ampm = h24 < 12 ? 'a' : 'p';
  var h12 = h24 % 12 || 12;
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
  const isFirstTaskRender = !dom.grid.dataset.calRendered;
  dom.grid.dataset.calRendered = '1';
  $$('.calendar-task').forEach(el => el.remove());
  $$('.current-time-line').forEach(el => el.remove());


  // Expand recurring tasks for the visible week
  const ws = state.currentWeekStart;
  const we = addDays(ws, 7);
  const expanded = expandRecurringTasks(ws, we);
  let weekNextUpId = null;
  try {
    const now = new Date();
    const ts = formatDate(now);
    const nm = now.getHours() * 60 + now.getMinutes();
    let best = Infinity;
    for (const t of expanded) {
      if (t.completed || isWhiteboardTask(t) || !t.startTime || !t.date) continue;
      if (t.date < ts) continue;
      const sm = parseTime(t.startTime);
      const score = t.date === ts ? (sm >= nm ? sm - nm : Infinity) : (new Date(t.date + 'T12:00:00') - new Date(ts + 'T12:00:00')) / 60000 + sm;
      if (score < best) { best = score; weekNextUpId = t.id; }
    }
  } catch (e) {}

  const filtered = expanded.filter(t => {
    if (isWhiteboardTask(t)) return false;
    if (weekPrefs.hideDone && t.completed) return false;
    if (!state.showCompleted && t.completed) return false;
    if (state.selectedTag && t.tag !== state.selectedTag) return false;
    return true;
  });

  // Use actual rendered hour height for pixel-perfect positioning
  const actualHH = dom.grid.querySelector('.day-column')?.getBoundingClientRect().height || HOUR_HEIGHT;

  // Group tasks by date for overlap detection
  const tasksByDate = {};
  for (const task of filtered) {
    if (!task.date) continue;
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
    // Skip tasks without a valid startTime to prevent broken card layout
    const taskEntries = dateTasks
      .filter(t => t.startTime)
      .map(t => ({
        task: t,
        start: gridTime(t.startTime),
        end: gridEndTime(t.startTime, t.endTime),
      }))
      .filter(e => !isNaN(e.start));
    // Sort by start time, then longer duration first
    taskEntries.sort((a, b) => a.start - b.start || (b.end - b.start) - (a.end - a.start));

    // Side-by-side column layout: overlapping cards get their own column
    // so they appear next to each other instead of stacked on top
    const columns = [];
    for (let i = 0; i < taskEntries.length; i++) {
      const occupied = new Set();
      for (let j = 0; j < i; j++) {
        if (taskEntries[j].start < taskEntries[i].end && taskEntries[i].start < taskEntries[j].end) {
          occupied.add(columns[j]);
        }
      }
      let col = 0;
      while (occupied.has(col)) col++;
      columns[i] = col;
    }
    const maxCol = columns.length ? Math.max(...columns) + 1 : 1;

    for (let i = 0; i < taskEntries.length; i++) {
      const { task, start: startM, end: endM } = taskEntries[i];
      const dur = Math.max(endM - startM, SNAP_MINUTES);
      const top = ((startM - START_HOUR * 60) / 60) * actualHH;
      const height = (dur / 60) * actualHH;
      const zIdx = `;z-index:${5 + i}`;
      const restoreZ = 5 + i;

      const meta = TAG_COLORS[task.tag] || TAG_COLORS.meeting;
      const cls = ['calendar-task', `tag-${task.tag}`];
      if (isFirstTaskRender) cls.push('task-intro');
      if (task.id === lastDroppedTaskId) cls.push('task-settle');
      if (task.completed) cls.push('completed');
      if (dur <= 30) cls.push('task-xs');
      else if (dur <= 60) cls.push('task-sm');
      if (weekSelected.has(task.id)) cls.push('task-selected');
      if (task.priority === 1) cls.push('priority-1');

      const el = document.createElement('div');
      el.className = cls.join(' ');
      el.dataset.taskId = task.id;
      const colW = `(100% - 10px) / ${maxCol}`;
      const cardLeft = `calc(5px + ${columns[i]} * ${colW})`;
      const cardWidth = `calc(${colW})`;
      el.style.cssText = `top:${top}px;min-height:${height}px;left:${cardLeft};width:${cardWidth}${zIdx}`;
      el.dataset.restoreZ = restoreZ;
      const checked = task.completed ? ' checked' : '';
      const pCls = task.priority === 1 ? ' priority-1' : '';
      var tagLabelText = TAG_LABELS[task.tag] || task.tag;
      var durText = '';
      if (task.startTime && task.endTime) {
        var sh = Number(task.startTime.split(':')[0]), sm = Number(task.startTime.split(':')[1]);
        var eh = Number(task.endTime.split(':')[0]), em = Number(task.endTime.split(':')[1]);
        var d = (eh * 60 + em) - (sh * 60 + sm);
        if (d > 0) durText = d >= 60 ? (Math.floor(d / 60) + 'h' + (d % 60 ? ' ' + d % 60 + 'm' : '')) : d + 'm';
      }
      var shortTime = '';
      if (task.startTime) {
        shortTime = formatCompactTime(task.startTime, task.endTime);
        if (durText) shortTime += ' · ' + durText;
      }
      const prioIcon = task.priority === 1 ? `<span class="task-prio-icon prio-1" title="Urgent">!</span>` : '';
      el.innerHTML = `<div class="task-body${pCls}">
          <div class="task-row">
            <span class="task-check${checked}" data-toggle-complete="${task.id}"></span>
            ${prioIcon}
            <span class="task-title" data-task-id="${task.id}">${escapeHtml(task.title)}</span>
            <span class="task-time">${shortTime}</span>
          </div>
          <div class="task-meta">
            <span class="task-tag-chip" style="--chip-accent:${(TAG_COLORS[task.tag] || TAG_COLORS.meeting).text}">${escapeHtml(tagLabelText)}</span>
            <span class="task-duration">${durText}</span>
          </div>
          ${task.notes ? `<div class="task-notes">${escapeHtml(task.notes)}</div>` : ''}
        </div>
        <div class="task-resize-handle" data-task-id="${task.id}" title="Drag to resize"></div>`;

      const resolvedId = resolveTaskId(task.id);
      const tStart = task.startTime ? parseTime(task.startTime) : null;
      const tEnd = task.endTime ? parseTime(task.endTime) : null;
      const todayStr = formatDate(new Date());
      const nowMins = new Date().getHours() * 60 + new Date().getMinutes();
      if (task.date === todayStr && tStart != null && tEnd != null && !task.completed) {
        if (nowMins >= tStart && nowMins < tEnd) el.classList.add('task-now');
        if (tEnd <= nowMins) el.classList.add('task-past');
      } else if (task.date < todayStr && !task.completed) {
        el.classList.add('task-past');
      }
      if (task.id === weekNextUpId) el.classList.add('task-next');
      el.addEventListener('mousedown', (e) => {
        if (e.target.closest('[data-toggle-complete]')) return;
        if (e.target.closest('.task-resize-handle')) return;
        if (e.target.closest('.task-title.is-editing') || e.target.closest('.task-title-input')) return;
        weekFocusedId = resolvedId;
        if (e.shiftKey) {
          e.stopPropagation();
          toggleWeekSelect(task.id, el);
          return;
        }
        e.stopPropagation();
        startDrag(e, el);
      });
      el.addEventListener('touchstart', (e) => {
        if (e.target.closest('[data-toggle-complete]')) return;
        if (e.target.closest('.task-resize-handle')) return;
        if (e.target.closest('.task-title.is-editing') || e.target.closest('.task-title-input')) return;
        weekFocusedId = resolvedId;
        e.stopPropagation();
        startDrag(e, el);
      }, { passive: false });
      el.addEventListener('dblclick', (e) => {
        if (e.target.closest('.task-title')) return;
        e.stopPropagation(); openTaskModal(resolvedId);
      });
      el.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        e.stopPropagation();
        weekFocusedId = resolvedId;
        showTaskCtx(e.clientX, e.clientY, task.id);
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
  lastDroppedTaskId = null;
}


function showGridEmptyState(count) {
  const existing = dom.grid.querySelector('.grid-empty-state');
  if (existing) existing.remove();
  if (count > 0 || currentView !== 'week') return;
  const firstCol = dom.grid.querySelector('.day-column');
  if (!firstCol) return;
  const el = document.createElement('div');
  el.className = 'grid-empty-state';
  el.innerHTML = '<span>No tasks this week</span><small>Use the + button or drag a subcategory to add a task</small>';
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
// A pull this long (any direction) before the card lifts, so clicks never drag
const DRAG_THRESHOLD = 8;
function startDrag(e, source, preset) {
  if (e.button !== 0 && !isTouchEvent(e)) return;
  // Prevent synthetic mousedown from touch event (double-dispatch protection)
  if (!isTouchEvent(e) && Date.now() - _lastTouchDragTime < 300) return;
  if (isTouchEvent(e)) { _lastTouchDragTime = Date.now(); e.preventDefault(); }

  if (gridDrag) cancelGridDrag();

  const presetTask = preset && preset.unschedTask ? preset.unschedTask : null;
  const chipEl = preset && preset.chipEl ? preset.chipEl : null;
  const anchor = presetTask && chipEl ? chipEl : source;
  if (!anchor) return;
  const rect = anchor.getBoundingClientRect();

  const dragPos = getEventPos(e);
  gridDrag = {
    type: 'task',
    source: source || chipEl || null,
    presetTask,
    rect,
    ghost: null,
    offX: dragPos.x - rect.left,
    offY: dragPos.y - rect.top,
    startX: dragPos.x,
    startY: dragPos.y,
    dropDate: null,
    dropTime: null,
    moved: false,
    active: false,
  };

  // If dragging an unscheduled chip, convert to a real task on drop
  if (presetTask) {
    gridDrag.type = 'unsched';
    gridDrag.taskId = presetTask.id;
    const mins = presetTask.startTime && presetTask.endTime ? parseTime(presetTask.endTime) - parseTime(presetTask.startTime) : 60;
    gridDrag.duration = mins > 0 ? mins : 60;
    gridDrag.dragStartM = 0;
    gridDrag.dragEndM = gridDrag.duration;
    gridDrag.title = presetTask.title;
    gridDrag.tag = presetTask.tag;
  }

  // If dragging an existing task, store original values
  const taskEl = source ? source.closest('.calendar-task') : null;
  if (taskEl) {
    // Press feedback: the shadow loads up while the button is down
    taskEl.classList.add('pressing');
    gridDrag.pressEl = taskEl;
  }
  if (taskEl && taskEl.dataset.taskId) {
    const task = getTask(taskEl.dataset.taskId);
    if (task) {
      gridDrag.type = 'reschedule';
      gridDrag.taskId = task.id;
      gridDrag.dragStartM = gridTime(task.startTime);
      gridDrag.dragEndM = gridEndTime(task.startTime, task.endTime);
      gridDrag.startDate = task.date;
      gridDrag.startTime = task.startTime;
    }
  }

  // If dragging a subcategory pill, use its tag + subcategory name as title
  const scPill = source ? source.closest('.sch-sc-pill, .sch-sc-bar-pill') : null;
  if (scPill && scPill.dataset.tag) {
    gridDrag.type = 'quickadd';
    gridDrag.tag = scPill.dataset.tag;
    gridDrag.duration = getTagDur(scPill.dataset.tag);
    gridDrag.title = scPill.dataset.scName || '';
    gridDrag.ghostLabel = gridDrag.title || QUICK_ADD_TITLES[scPill.dataset.tag] || 'New Task';
  }

  document.addEventListener('mousemove', onDragMove);
  document.addEventListener('mouseup', onDragEnd);
  document.addEventListener('touchmove', onDragMove, { passive: false });
  document.addEventListener('touchend', onDragEnd);
  document.addEventListener('touchcancel', onDragEnd);
}

// Build the floating preview once the pointer has actually moved
function activateGridDrag() {
  if (!gridDrag || gridDrag.active) return;
  const { rect, presetTask } = gridDrag;
  const srcCard = gridDrag.source ? gridDrag.source.closest('.calendar-task') : null;
  const ghost = srcCard && !presetTask
    ? buildCardGhost(srcCard, rect)
    : buildNewTaskGhost(gridDrag, rect.width);
  ghost.style.left = `${rect.left}px`;
  ghost.style.top = `${rect.top}px`;
  document.body.appendChild(ghost);
  gridDrag.ghost = ghost;
  // Scale about the pixel you grabbed so the card never slips out from under the pointer
  ghost.style.transformOrigin = `${gridDrag.offX}px ${gridDrag.offY}px`;
  if (gridDrag.pressEl) gridDrag.pressEl.classList.remove('pressing');

  let ghostTag = null;
  if (gridDrag.type === 'reschedule') {
    const task = getTask(gridDrag.taskId);
    if (task) ghostTag = task.tag;
  } else if (gridDrag.tag) {
    ghostTag = gridDrag.tag;
  }
  if (ghostTag) {
    const meta = TAG_COLORS[ghostTag] || TAG_COLORS.meeting;
    ghost.style.setProperty('--task-accent', meta.text);
    if (gridDrag.type === 'quickadd') {
      ghost.style.background = meta.bg;
      ghost.style.color = meta.text;
    }
    // Border marks the tag; the lift shadow lives in the grab keyframes so it can animate
    ghost.style.border = `1.5px solid ${meta.text}`;
  }

  gridDrag.cols = captureDayColumns();
  if (gridDrag.source) gridDrag.source.classList.add('dragging');
  document.body.style.cursor = 'grabbing';
  gridDrag.active = true;
  gridDrag.moved = true;
}

// Clone a grid card so the lifted preview matches it exactly
function buildCardGhost(srcCard, rect) {
  const clone = srcCard.cloneNode(true);
  clone.classList.remove('dragging', 'resizing', 'task-selected', 'task-conflict',
    'task-intro', 'task-settle', 'task-now', 'task-past', 'task-next');
  const ghost = document.createElement('div');
  ghost.className = 'grid-drag-ghost ' + clone.className;
  ghost.innerHTML = clone.innerHTML;
  ghost.style.cssText = `position:fixed;width:${Math.max(rect.width, 120)}px;height:${rect.height}px;`;
  return ghost;
}

// Preview for tasks/quick-adds that have no card yet
function buildNewTaskGhost(drag, refWidth) {
  const meta = TAG_COLORS[drag.tag] || TAG_COLORS.meeting;
  const mins = drag.duration || 60;
  const ghost = document.createElement('div');
  ghost.className = 'grid-drag-ghost calendar-task';
  if (drag.type === 'unsched') {
    const col = dom.grid.querySelector('.day-column');
    const colRect = col ? col.getBoundingClientRect() : null;
    const hourH = colRect && colRect.height ? colRect.height : HOUR_HEIGHT;
    const width = Math.max((colRect ? colRect.width : 160) - 8, 120);
    ghost.innerHTML = `<div class="task-body">
        <div class="task-row">
          <span class="task-title">${escapeHtml(drag.title || 'New Task')}</span>
        </div>
        <div class="task-meta">
          <span class="task-tag-chip" style="--chip-accent:${meta.text}">${escapeHtml(TAG_LABELS[drag.tag] || drag.tag || '')}</span>
          <span class="task-duration">${fmtDur(mins)}</span>
        </div>
      </div>`;
    ghost.style.cssText = `position:fixed;width:${width}px;height:${(mins / 60) * hourH}px;`;
    return ghost;
  }
  ghost.textContent = drag.ghostLabel || drag.title || QUICK_ADD_TITLES[drag.tag] || 'New Task';
  ghost.style.cssText = `position:fixed;width:${Math.max(refWidth, 120)}px;`;
  return ghost;
}

// Column under the cursor — re-captures bounds if the grid was re-rendered mid-drag
function matchDayColumn(x) {
  if (!gridDrag) return null;
  let cols = gridDrag.cols || [];
  if (!cols.some(c => c.el.isConnected)) cols = gridDrag.cols = captureDayColumns();
  for (const c of cols) {
    if (x >= c.left && x < c.right) return c;
  }
  return null;
}

// Cache each day's bounds + rendered hour range for the duration of a drag
function captureDayColumns() {
  const cols = [];
  const byDate = new Map();
  dom.grid.querySelectorAll('.day-column[data-date]').forEach(col => {
    const date = col.dataset.date;
    const t = Number(col.dataset.time);
    if (!date || !Number.isFinite(t)) return;
    const entry = byDate.get(date);
    if (!entry) {
      const r = col.getBoundingClientRect();
      const fresh = { date, left: r.left, right: r.right, el: col, startM: t, endM: t + 60 };
      byDate.set(date, fresh);
      cols.push(fresh);
      return;
    }
    entry.endM = Math.max(entry.endM, t + 60);
    if (t < entry.startM) { entry.startM = t; entry.el = col; }
  });
  return cols;
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

function magneticSnap(date, snap, excludeId) {
  let best = snap, bestDist = 9, hit = false;
  for (const task of state.tasks) {
    if (task.id === excludeId || isWhiteboardTask(task) || task.completed) continue;
    if (task.date !== date || !task.startTime) continue;
    const edges = [gridTime(task.startTime), gridEndTime(task.startTime, task.endTime)];
    for (const em of edges) {
      if (isNaN(em)) continue;
      const d = Math.abs(em - snap);
      if (d < bestDist) { bestDist = d; best = em; hit = true; }
    }
  }
  return { mins: best, snapped: hit };
}

// ─── DROP PREVIEW (single card-like ghost in the grid) ────
function showDropPreview(col, spanStart, spanEnd, hlColor, label, snapped) {
  let el = document.getElementById('dropTaskPreview');
  if (!el) {
    el = document.createElement('div');
    el.id = 'dropTaskPreview';
    el.className = 'drop-task-preview';
    el.innerHTML = '<span class="drop-preview-time"></span>';
    col.appendChild(el);
  } else if (el.parentElement !== col) {
    col.appendChild(el);
  }
  const actualHH = col.getBoundingClientRect().height;
  const originM = Number(col.dataset.time || START_HOUR * 60);
  const top = ((spanStart - originM) / 60) * actualHH;
  const height = ((spanEnd - spanStart) / 60) * actualHH;
  el.style.top = `${top}px`;
  el.style.height = `${Math.max(height, 4)}px`;
  el.style.setProperty('--hl-color', hlColor);
  el.classList.toggle('snapped', !!snapped);
  const lbl = el.querySelector('.drop-preview-time');
  if (lbl) lbl.textContent = label || '';
}

function removeDropPreview() {
  const el = document.getElementById('dropTaskPreview');
  if (el) el.remove();
}

// ─── CONFLICT PREVIEW ─────────────────────────────────────
function previewConflicts(date, startM, endM, excludeId) {
  $$('.calendar-task.task-conflict').forEach(el => el.classList.remove('task-conflict'));

  for (const task of state.tasks) {
    if (task.id === excludeId || isWhiteboardTask(task) || task.completed) continue;
    if (task.date !== date) continue;
    if (!task.startTime) continue;
    const tStart = gridTime(task.startTime);
    const tEnd = gridEndTime(task.startTime, task.endTime);
    if (tEnd <= startM || tStart >= endM) continue;
    const el = document.querySelector(`.calendar-task[data-task-id="${task.id}"]`);
    if (el) el.classList.add('task-conflict');
  }
}

function clearConflictPreview() {
  $$('.calendar-task.task-conflict').forEach(el => el.classList.remove('task-conflict'));
}

function onDragMove(e) {
  if (!gridDrag) return;
  const pos = getEventPos(e);
  // Wait for a real pull (in any direction) before lifting the card
  if (!gridDrag.active) {
    if (Math.hypot(pos.x - gridDrag.startX, pos.y - gridDrag.startY) < DRAG_THRESHOLD) return;
    activateGridDrag();
    if (!gridDrag || !gridDrag.ghost) return;
  }
  const { ghost, offX, offY } = gridDrag;
  gridDrag.moved = true;
  ghost.style.left = `${pos.x - offX}px`;
  ghost.style.top = `${pos.y - offY}px`;

  // Auto-scroll grid near edges
  try {
    const cont = dom.container;
    if (cont) {
      const r = cont.getBoundingClientRect();
      if (pos.y < r.top + 60) cont.scrollTop -= 8;
      else if (pos.y > r.bottom - 60) cont.scrollTop += 8;
    }
  } catch (err) {}

  // Find which date column the cursor is over (column bounds cached at drag start)
  const matched = matchDayColumn(pos.x);

  if (matched) {
    const refCol = matched.el;
    const matchedDate = matched.date;
    const colRect = refCol.getBoundingClientRect();
    // The card keeps the spot you grabbed, so the drop follows its top edge
    const yOffset = pos.y - (gridDrag.offY || 0) - colRect.top;
    const actualHourHeight = colRect.height;
    // refCol is the day's first hour cell, so yOffset maps straight onto the whole day
    const dayStartM = Number(refCol.dataset.time || START_HOUR * 60);
    const dayEndM = matched.endM || dayStartM + VISIBLE_HOURS * 60;
    const rawMinutes = (yOffset / actualHourHeight) * 60 + dayStartM;
    const clampLo = dayStartM;
    const clampHi = dayEndM - SNAP_MINUTES;
    const clamped = Math.max(clampLo, Math.min(rawMinutes, clampHi));
    const base = roundToNearest(clamped, SNAP_MINUTES);
    const mag = magneticSnap(matchedDate, base, gridDrag.taskId || null);
    const snap = Math.max(clampLo, Math.min(mag.mins, clampHi));

    gridDrag.dropDate = matchedDate;
    gridDrag.dropTime = snap;
    document.body.style.cursor = gridDrag.type === 'quickadd' || gridDrag.type === 'unsched' ? 'copy' : 'grabbing';

    // Calculate the task span
    const dragEndM = gridDrag.dragEndM ?? (gridDrag.dropTime + (gridDrag.duration || 60));
    const durMins = dragEndM - (gridDrag.dragStartM ?? gridDrag.dropTime);
    const spanStart = snap;
    const spanEnd = Math.min(spanStart + durMins, (START_HOUR + VISIBLE_HOURS) * 60);

    // Single card-like preview at the drop position (replaces old overlay + line)
    previewConflicts(matchedDate, spanStart, spanEnd, gridDrag.taskId || null);
    const dragTask = gridDrag.taskId ? getTask(gridDrag.taskId) : null;
    const hlColor = dragTask ? (TAG_COLORS[dragTask.tag] || TAG_COLORS.meeting).text : 'var(--accent)';
    const rangeLabel = formatCompactTime(toTimeStr(spanStart), toTimeStr(spanEnd));
    showDropPreview(refCol, spanStart, spanEnd, hlColor, rangeLabel, mag.snapped);

    // Show live time tooltip
    const dayLabel = new Date(matchedDate + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short' });
    showDragTooltip(e, snap, durMins, mag.snapped, dayLabel + ' ' + formatCompactTime(toTimeStr(spanStart), toTimeStr(spanEnd)));
  } else {
    gridDrag.dropDate = null;
    gridDrag.dropTime = null;
    document.body.style.cursor = 'grabbing';
    removeDropPreview();
    clearConflictPreview();
    removeDragTooltip();
  }
}

function showDragTooltip(e, snap, durMins, snapped, fullLabel) {
  let tip = document.getElementById('dragTimeTooltip');
  if (!tip) {
    tip = document.createElement('div');
    tip.id = 'dragTimeTooltip';
    tip.className = 'drag-time-tooltip';
    document.body.appendChild(tip);
  }
  if (fullLabel) { tip.textContent = fullLabel; }
  else {
  const h = Math.floor(snap / 60);
  const m = snap % 60;
  const ampm = (h % 24) < 12 ? 'AM' : 'PM';
  const h12 = (h % 12) || 12;
  let text = `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
  if (durMins) {
    const dh = Math.floor(durMins / 60);
    const dm = durMins % 60;
    text += ` · ${dh}h${dm ? String(dm).padStart(2, '0') : ''}`;
  }
  tip.textContent = text;
  }
  tip.classList.toggle('snapped', !!snapped);
  const tipPos = getEventPos(e);
  tip.style.left = `${tipPos.x + 16}px`;
  tip.style.top = `${tipPos.y - 8}px`;
}

function removeDragTooltip() {
  const tip = document.getElementById('dragTimeTooltip');
  if (tip) tip.remove();
}

function attachTimeAxisTooltips() {
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
  removeGridDragListeners();

  // Clean up dragging feedback
  if (gridDrag.source) gridDrag.source.classList.remove('dragging');
  if (gridDrag.pressEl) gridDrag.pressEl.classList.remove('pressing');
  if (gridDrag.ghost) gridDrag.ghost.remove();
  removeDropPreview();
  clearConflictPreview();
  removeDragTooltip();
  document.body.style.cursor = '';

  if (!gridDrag.moved || !gridDrag.dropDate || gridDrag.dropTime === undefined) {
    gridDrag = null;
    return;
  }

  const endBoundary = (START_HOUR + VISIBLE_HOURS) * 60;
  const rawDur = gridDrag.type === 'quickadd' || gridDrag.type === 'unsched' ? (gridDrag.duration || 60) : (gridDrag.dragEndM - gridDrag.dragStartM || gridDrag.duration || 60);
  const dur = Math.min(rawDur, endBoundary - gridDrag.dropTime);
  const dropEndMins = gridDrag.dropTime + dur;

  // Apply all state changes without triggering re-render mid-way
  const savedCallback = pageAfterTaskSave;
  pageAfterTaskSave = null;

  pushUndo(); // snapshot BEFORE changes

  const excludeId = gridDrag.taskId || null;
  repelConflicts(gridDrag.dropDate, gridDrag.dropTime, dropEndMins, excludeId);

  if (gridDrag.type === 'reschedule') {
    const start = toTimeStr(gridDrag.dropTime);
    const end = toTimeStr(dropEndMins);
    const task = getTask(gridDrag.taskId);
    if (task && (gridDrag.dropDate !== gridDrag.startDate || start !== gridDrag.startTime)) {
      task.date = gridDrag.dropDate;
      task.startTime = start;
      task.endTime = end;
      lastDroppedTaskId = task.id;
    }
  } else if (gridDrag.type === 'quickadd') {
    const created = createTask({
      title: gridDrag.title || QUICK_ADD_TITLES[gridDrag.tag] || 'New Task',
      date: gridDrag.dropDate,
      startTime: toTimeStr(gridDrag.dropTime),
      endTime: toTimeStr(dropEndMins),
      tag: gridDrag.tag,
    });
    if (created && created.id) lastDroppedTaskId = created.id;
  } else if (gridDrag.type === 'unsched') {
    const task = getTask(gridDrag.taskId);
    if (task) {
      task.date = gridDrag.dropDate;
      task.startTime = toTimeStr(gridDrag.dropTime);
      task.endTime = toTimeStr(dropEndMins);
      lastDroppedTaskId = task.id;
    }
  }

  saveState();
  pageAfterTaskSave = savedCallback;
  if (typeof pageAfterTaskSave === 'function') pageAfterTaskSave();

  gridDrag = null;
}

// ─── REPEL: push conflicting tasks down on drop ────────────
function repelConflicts(date, startMins, endMins, excludeId, depth) {
  if (depth > 10) return; // safety: prevent infinite cascade
  const endBoundary = (START_HOUR + VISIBLE_HOURS) * 60;

  for (const task of state.tasks) {
    if (task.id === excludeId || isWhiteboardTask(task) || task.completed) continue;
    if (task.date !== date) continue;

    const tStart = gridTime(task.startTime);
    const tEnd = gridEndTime(task.startTime, task.endTime);
    if (isNaN(tStart) || isNaN(tEnd)) continue;
    if (tEnd <= startMins || tStart >= endMins) continue;

    const duration = tEnd - tStart;
    const newStart = endMins;
    const newEnd = Math.min(endMins + duration, endBoundary);

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
    startM: gridTime(task.startTime),
    endM: gridEndTime(task.startTime, task.endTime),
    originalEndM: gridEndTime(task.startTime, task.endTime),
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

  // Update visual height in real-time (min-height must follow so shrinking works)
  el.style.height = `${newHeight}px`;
  el.style.minHeight = `${newHeight}px`;

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
    const oldEndM = gridEndTime(task.startTime, task.endTime);
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

// ─── WEEK NAVIGATION ───────────────────────────────────────
function goToday() {
  if (currentView === 'month') {
    currentMonthDate = new Date();
    state.currentMonthDate = new Date(currentMonthDate);
    renderCalendar();
  } else {
    state.currentWeekStart = getMonday(new Date());
    if (isMobileLayout()) {
      mobileDayDate = formatDate(new Date());
    }
    renderCalendar();
  }
  saveState();
  if (!isMobileLayout()) {
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
}
function goPrev() {
  if (currentView === 'month') {
    currentMonthDate.setMonth(currentMonthDate.getMonth() - 1);
    state.currentMonthDate = new Date(currentMonthDate);
    renderCalendar();
  } else if (isMobileLayout()) {
    navigateMobileDay(-1);
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
  } else if (isMobileLayout()) {
    navigateMobileDay(1);
  } else {
    state.currentWeekStart = addDays(state.currentWeekStart, 7);
    renderCalendar();
  }
  saveState();
}

// ─── AUTO-SCROLL ──────────────────────────────────────────
function scrollToCurrentTime() {
  if (state.savedScrollPosition && dom.container && !weekPrefs.didAutoScroll) {
    dom.container.scrollTop = state.savedScrollPosition;
    weekPrefs.didAutoScroll = true;
    return;
  }
  weekPrefs.didAutoScroll = true;
  scrollToNow();
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
  if (e.key === 't' && !e.metaKey && !e.ctrlKey && !state.taskModalOpen && !state.settingsDrawerOpen && !state.helpModalOpen && !e.target.closest('input, textarea, select')) { toggleTheme(); }
  if (e.key === 'q' && !e.metaKey && !e.ctrlKey && !state.taskModalOpen && !state.settingsDrawerOpen && !state.helpModalOpen && !e.target.closest('input, textarea, select')) {
    const now = new Date(); openNewTaskModal(formatDate(now), roundToNearest(now.getHours() * 60 + now.getMinutes(), SNAP_MINUTES));
  }
  // Undo (Ctrl+Z)
  if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !state.taskModalOpen && !state.settingsDrawerOpen && !state.helpModalOpen && !e.target.closest('input, textarea, select')) {
    e.preventDefault();
    if (undo()) {
      showToast('Undo successful', 'info', 2000);
    }
  }
});

// ─── EVENT BINDING ─────────────────────────────────────────
function initPrioritySelect() {
  document.querySelectorAll('#prioritySelectGroup .tm-pr').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#prioritySelectGroup .tm-pr').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state._selectedPriority = parseInt(btn.dataset.priority) || 3;
    });
  });
}

function bindEvents() {
  dom.todayBtn?.addEventListener('click', goToday);
  dom.prevWeek?.addEventListener('click', goPrev);
  dom.nextWeek?.addEventListener('click', goNext);

  dom.taskOverlay?.addEventListener('click', hideTaskModal);
  dom.taskModal?.addEventListener('click', (e) => e.stopPropagation());
  dom.taskModalClose?.addEventListener('click', hideTaskModal);
  dom.taskCancelBtn?.addEventListener('click', hideTaskModal);
  dom.taskForm?.addEventListener('submit', handleTaskFormSubmit);
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
  // Init priority select + task modal dropdowns
  initPrioritySelect();
  initTaskDropdowns();

  renderSchTemplates();

  initCatAddModal();

  // ─── Add Category modal (mirrors task modal glass card, centered) ──
  let _catColor = '#6366f1';
  function catEls() {
    return {
      btn: document.getElementById('catAddBtn'),
      overlay: document.getElementById('catOverlay'),
      popup: document.getElementById('catPopup'),
      input: document.getElementById('catAddInput'),
      swatches: document.getElementById('catAddSwatches'),
      picker: document.getElementById('catColorPicker'),
      subs: document.getElementById('catAddSubcategories'),
      start: document.getElementById('catAddStartTime'),
      dur: document.getElementById('catAddDuration'),
      dup: document.getElementById('catAddDuplicate'),
      dupBtn: document.getElementById('catAddDuplicateBtn'),
      save: document.getElementById('catAddSave'),
      cancel: document.getElementById('catAddCancel'),
      close: document.getElementById('catModalClose'),
      err: document.getElementById('catAddError'),
      dot: document.getElementById('catAddDot'),
      prevCard: document.getElementById('catPreviewCard'),
      prevName: document.getElementById('catPreviewName'),
      prevTime: document.getElementById('catPreviewTime'),
      prevDur: document.getElementById('catPreviewDuration'),
      prevSubs: document.getElementById('catPreviewSubs'),
    };
  }
  function syncCatSwatches() {
    document.querySelectorAll('#catAddSwatches .cat-swatch').forEach(el => {
      el.classList.toggle('selected', (el.dataset.color || '').toLowerCase() === String(_catColor).toLowerCase());
    });
  }
  function readCatSubs() {
    const raw = document.getElementById('catAddSubcategories')?.value || '';
    const seen = new Set();
    return raw.split('\n').map(s => s.trim().slice(0, 40)).filter(s => {
      if (!s) return false;
      const k = s.toLowerCase();
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    }).slice(0, 20);
  }
  function updateCatPreview() {
    const e = catEls();
    const name = e.input?.value.trim() || 'New category';
    const start = e.start?.value || '09:00';
    const dur = Math.min(480, Math.max(5, Math.round((Number(e.dur?.value) || 60) / 5) * 5));
    if (e.prevName) e.prevName.textContent = name.slice(0, 30);
    if (e.prevTime) e.prevTime.textContent = start;
    if (e.prevDur) e.prevDur.textContent = dur + ' min';
    if (e.prevCard) e.prevCard.style.setProperty('--chip-accent', _catColor);
    if (e.dot) e.dot.style.background = _catColor;
    if (e.prevSubs) {
      const subs = readCatSubs();
      e.prevSubs.innerHTML = subs.length
        ? subs.map(v => '<span>' + escapeHtml(v) + '</span>').join('')
        : '<span class="cat-preview-empty">No subcategories yet</span>';
    }
  }
  function openCatModal() {
    const e = catEls();
    if (!e.overlay || !e.popup) return;
    _catColor = '#6366f1';
    if (e.input) e.input.value = '';
    if (e.subs) e.subs.value = '';
    if (e.start) e.start.value = '09:00';
    if (e.dur) e.dur.value = '60';
    if (e.picker) e.picker.value = '#6366f1';
    if (e.err) e.err.textContent = '';
    if (e.dup) {
      e.dup.innerHTML = '<option value="">Start from scratch</option>' + TAG_ORDER.map(tag =>
        '<option value="' + tag + '">' + escapeHtml(TAG_LABELS[tag] || tag) + '</option>').join('');
      e.dup.value = '';
    }
    syncCatSwatches();
    updateCatPreview();
    e.popup.classList.remove('hidden');
    e.overlay.classList.remove('hidden');
    state.catModalOpen = true;
    requestAnimationFrame(() => {
      e.overlay.classList.add('active');
      e.popup.classList.add('active');
    });
    setTimeout(() => e.input?.focus(), 120);
  }
  function closeCatModal() {
    const e = catEls();
    if (!e.overlay || !e.popup) return;
    e.overlay.classList.remove('active');
    e.popup.classList.remove('active');
    state.catModalOpen = false;
    setTimeout(() => {
      e.popup.classList.add('hidden');
      e.overlay.classList.add('hidden');
    }, 240);
  }
  function initCatAddModal() {
    const e = catEls();
    if (!e.btn || !e.popup || !e.overlay) return;
    const PRESETS = {
      focus: ['Deep Work', 'Planning', 'Review', 'Admin'],
      meetings: ['Standup', '1:1', 'Client Call', 'Brainstorm'],
      fitness: ['Cardio', 'Strength', 'Mobility', 'Recovery'],
      study: ['Reading', 'Notes', 'Practice', 'Review'],
      creative: ['Sketch', 'Draft', 'Edit', 'Publish'],
    };
    e.btn.addEventListener('click', (ev) => { ev.stopPropagation(); if (e.popup.classList.contains('active')) closeCatModal(); else openCatModal(); });
    e.cancel?.addEventListener('click', closeCatModal);
    e.close?.addEventListener('click', closeCatModal);
    e.overlay?.addEventListener('click', (ev) => {
      if (ev.target === e.overlay) closeCatModal();
    });
    e.popup?.addEventListener('click', (ev) => ev.stopPropagation());
    e.swatches?.addEventListener('click', (ev) => {
      const sw = ev.target.closest('.cat-swatch');
      if (!sw) return;
      _catColor = sw.dataset.color;
      if (e.picker) e.picker.value = _catColor;
      syncCatSwatches();
      updateCatPreview();
    });
    e.picker?.addEventListener('input', () => { _catColor = e.picker.value; syncCatSwatches(); updateCatPreview(); });
    [e.input, e.subs, e.start, e.dur].forEach(el => el?.addEventListener('input', updateCatPreview));
    document.getElementById('catAddPresets')?.addEventListener('click', (ev) => {
      const b = ev.target.closest('.cat-preset');
      if (!b) return;
      if (e.subs) e.subs.value = (PRESETS[b.dataset.preset] || []).join('\n');
      updateCatPreview();
    });
    e.dupBtn?.addEventListener('click', () => {
      const tag = e.dup?.value;
      if (!tag) return;
      const custom = loadCustomCategories().find(c => c.id === tag);
      const subs = loadSubcategories()[tag] || [];
      const defaults = getCategoryDefaults(tag);
      if (e.input) e.input.value = (TAG_LABELS[tag] || tag) + ' copy';
      _catColor = custom?.color || getCategoryColor(tag) || '#6366f1';
      if (e.picker) e.picker.value = /^#[0-9a-f]{6}$/i.test(_catColor) ? _catColor : '#6366f1';
      if (e.start) e.start.value = custom?.defaultStart || defaults.defaultStart || '09:00';
      if (e.dur) e.dur.value = custom?.duration || defaults.duration || 60;
      if (e.subs) e.subs.value = subs.join('\n');
      syncCatSwatches();
      updateCatPreview();
      e.input?.focus();
    });
    e.save?.addEventListener('click', () => {
      const name = e.input?.value.trim();
      if (!name) { if (e.err) e.err.textContent = 'Enter a category name.'; e.input?.focus(); return; }
      const start = (/^([01]\d|2[0-3]):[0-5]\d$/.test(e.start?.value || '')) ? e.start.value : '09:00';
      const dur = Math.min(480, Math.max(5, Math.round((Number(e.dur?.value) || 60) / 5) * 5));
      addCustomCategory(name, _catColor, { defaultStart: start, duration: dur, subcategories: readCatSubs() });
      renderSchTemplates();
      closeCatModal();
      showToast('Category "' + escapeHtml(name) + '" added', 'success', 2500);
    });
    e.popup?.addEventListener('keydown', (ev) => {
      if (ev.key === 'Escape') { ev.stopPropagation(); closeCatModal(); }
      if (ev.key === 'Enter' && ev.target.tagName !== 'TEXTAREA') { ev.preventDefault(); e.save?.click(); }
    });
  }
  // Apply access hub customization
  applyAccessHubConfig();


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
// ─── POMODORO TIMER ────────────────────────────────────────
let pomodoroInterval = null;

function setPomodoroPreset(mins) {
  if (!pomodoroState || (pomodoroState && !pomodoroState.isRunning && pomodoroState.elapsedSeconds === 0)) {
    document.querySelectorAll('.pomodoro-preset').forEach(b => b.classList.remove('active'));
    document.querySelector(`.pomodoro-preset[data-minutes="${mins}"]`)?.classList.add('active');
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
    const totalSeconds = pomodoroState.totalMinutes * 60;
    if (pomodoroState.elapsedSeconds >= totalSeconds) {
      pomodoroState.elapsedSeconds = 0;
      pomodoroState.completedCycles = (pomodoroState.completedCycles || 0) + 1;
    }
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
    if (pomodoroState.startedAt) {
      pomodoroState.elapsedSeconds = Math.floor((Date.now() - pomodoroState.startedAt) / 1000);
    }
    pomodoroState.isRunning = false;
    if (pomodoroInterval) clearInterval(pomodoroInterval);
    pomodoroInterval = null;
    pomodoroState.completedCycles = (pomodoroState.completedCycles || 0) + 1;
    savePomodoroState();
    updatePomodoroDisplay();
    document.getElementById('accessMain')?.classList.remove('running');
    const completeBtn = document.getElementById('pomodoroStartBtn');
    if (completeBtn) completeBtn.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="5 3 19 12 5 21 5 3"/></svg> Start`;
    document.getElementById('pomodoroStatus').textContent = '● Session complete!';
    const iconEl2 = document.getElementById('pomodoroPeriodIcon');
    if (iconEl2) iconEl2.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg>`;
    playPomodoroSound();
    if (typeof playCompletionChime === 'function') {
      playCompletionChime('focus');
    } else if (typeof _sendNotification === 'function') {
      _sendNotification('\uD83C\uDF89 Pomodoro Complete!', 'Time for a break!', { tag: 'pomodoro', vibratePattern: [200, 100, 200] });
    } else if ('Notification' in window && Notification.permission === 'granted' && state.notifications !== false) {
      try { new Notification('\uD83C\uDF89 Pomodoro Complete!', { body: 'Time for a break!' }); if (state.vibrate !== false && navigator.vibrate) navigator.vibrate([200, 100, 200]); } catch(e) {}
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
  if (typeof playChime === 'function') { playChime(); return; }
  if (state.soundEnabled === false) return;
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
      document.getElementById('accessMain')?.classList.add('running');
      document.getElementById('pomodoroStartBtn').innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="none"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg> Pause`;
    }
    if (pomodoroState.elapsedSeconds > 0 && !pomodoroState.isRunning) updatePomodoroDisplay();
  }
}

// ─── SUBCATEGORY BUBBLE ─────────────────────────────────────
function renderSubcategoryBarPill(subcatName, tag, col) {
  return `<span class="sch-sc-bar-pill" data-tag="${tag}" data-sc-name="${escapeHtml(subcatName)}" style="--sc-accent:${col.text}">
    <span class="sc-dot"></span>
    <span class="sc-drag-hint"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="10" cy="6" r="1.5"/><circle cx="14" cy="6" r="1.5"/><circle cx="10" cy="12" r="1.5"/><circle cx="14" cy="12" r="1.5"/><circle cx="10" cy="18" r="1.5"/><circle cx="14" cy="18" r="1.5"/></svg></span>
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
  bar.style.setProperty('--sc-accent', col.text);

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
    html += `<div class="sch-pm-chip${isOpen ? ' active' : ''}" data-pm-tag="${tag}"
      style="--chip-accent:${accent}" role="button" tabindex="0">
      <span class="sch-pm-chip-label">${TAG_LABELS[tag]}</span>
      ${subs.length > 0 ? `<span class="sch-pm-chip-count">${subs.length}</span>` : ''}
    </div>`;
  }
  container.innerHTML = html;

  // Chip click — toggle drawer
  container.querySelectorAll('.sch-pm-chip').forEach(chip => {
    function activateChip() {
      const tag = chip.dataset.pmTag;
      if (state._openPmTag === tag) {
        closeSubcategoryBubble();
      } else {
        state._openPmTag = tag;
        renderSchTemplates();
        showSubcategoryBubble(tag);
      }
    }
    chip.addEventListener('click', (e) => {
      if (chip.dataset._renaming === '1') return;
      activateChip();
    });
    chip.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); activateChip(); }
    });
  });

  // Double-click category label to rename inline
  container.querySelectorAll('.sch-pm-chip-label').forEach(label => {
    const chip = label.closest('.sch-pm-chip');
    const tag = chip?.dataset.pmTag;
    if (!tag) return;
    label.title = 'Double-click to rename';
    label.addEventListener('dblclick', (e) => {
      e.stopPropagation();
      chip.dataset._renaming = '1';
      const oldName = label.textContent;
      const input = document.createElement('input');
      input.type = 'text';
      input.className = 'sch-chip-rename-input';
      input.value = oldName;
      input.maxLength = 24;
      input.autocomplete = 'off';
      input.spellcheck = false;
      label.replaceWith(input);
      input.focus();
      input.select();
      const finish = () => {
        delete chip.dataset._renaming;
        const newName = input.value.trim();
        if (newName && newName !== oldName) {
          if (!BUILTIN_TAGS.includes(tag)) {
            updateCustomCategory(tag, newName, (TAG_COLORS[tag] || TAG_COLORS.meeting).text);
          } else {
            renameTag(tag, newName);
          }
          renderSchTemplates();
        } else {
          renderSchTemplates();
        }
      };
      input.addEventListener('blur', finish);
      input.addEventListener('keydown', (ev) => {
        if (ev.key === 'Enter') { ev.preventDefault(); input.blur(); }
        if (ev.key === 'Escape') { input.value = oldName; input.blur(); }
      });
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
  const pillMgr = document.getElementById('schPillManager');
  if (pillMgr) pillMgr.style.display = currentView === 'month' ? 'none' : '';
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
  window.addEventListener('beforeunload', function() { saveState(); });


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
    var bg1 = isDark ? '#0a0a0a' : '#f9f8f4';
    var bg2 = isDark ? '#111111' : '#f0ece6';
    var textPrimary = isDark ? '#e5e2e1' : '#1c1b1b';
    var textSecondary = isDark ? '#8c928d' : '#7a7670';
    var textTertiary = isDark ? '#6b6b6b' : '#a09c96';
    var borderColor = isDark ? '#2a2a2a' : '#d7d2ca';
    var borderLight = isDark ? '#1a1a1a' : '#e2ddd6';
    var accent = isDark ? '#ffffff' : '#1c1b1b';
    var accentLight = isDark ? '#d0d0d0' : '#3a3a3a';
    var white = '#ffffff';
    var todayColor = isDark ? '#ffffff' : '#1c1b1b';
    var weekendBg = isDark ? '#0d0d0d' : '#f4f2ed';
    var gridLineColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.07)';
    var headerBg = isDark ? '#000000' : '#ffffff';
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
    hdrGrad.addColorStop(0, isDark ? '#111111' : '#ffffff');
    hdrGrad.addColorStop(1, isDark ? '#0a0a0a' : '#f5f2ed');
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
      var h24 = hour % 24;
      var disp = h24 === 0 ? 12 : (h24 > 12 ? h24 - 12 : h24);
      var ampm = h24 < 12 ? 'AM' : 'PM';
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

      var startMins = gridTime(t.startTime);
      if (isNaN(startMins)) {
        var parts = t.startTime.split(':');
        startMins = parseInt(parts[0]) * 60 + parseInt(parts[1] || 0);
        if (startMins < START_HOUR * 60) startMins += 1440;
      }
      var endMins = gridTime(t.endTime);
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
      ctx.fillStyle = isDark ? '#161616' : '#ffffff';
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
      var h24 = parseInt(parts[0]) % 24;
      var m = parseInt(parts[1] || 0);
      var ampm = h24 < 12 ? 'AM' : 'PM';
      var h12 = h24 % 12 || 12;
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
