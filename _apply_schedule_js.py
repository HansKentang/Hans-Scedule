path = r'C:\Users\ASUS\AI Apps\Hans Scedule\schedule.js'

with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. switchView() - add state.currentView + saveState()
old_switch = """function switchView(view) {
  currentView = view;
  $$('.view-toggle-btn').forEach(b => b.classList.toggle('active', b.dataset.view === view));
  renderCalendar();
}"""
new_switch = """function switchView(view) {
  currentView = view;
  state.currentView = view;
  $$('.view-toggle-btn').forEach(b => b.classList.toggle('active', b.dataset.view === view));
  renderCalendar();
  saveState();
}"""
content = content.replace(old_switch, new_switch, 1)

# 2. goToday() - add state.currentMonthDate + saveState()
old_today = """function goToday() {
  if (currentView === 'month') {
    currentMonthDate = new Date();
    renderCalendar();
  } else {
    state.currentWeekStart = getMonday(new Date());
    renderCalendar();
  }"""
new_today = """function goToday() {
  if (currentView === 'month') {
    currentMonthDate = new Date();
    state.currentMonthDate = new Date(currentMonthDate);
    renderCalendar();
  } else {
    state.currentWeekStart = getMonday(new Date());
    renderCalendar();
  }
  saveState();"""
content = content.replace(old_today, new_today, 1)

# 3. goPrev() - add state.currentMonthDate + saveState()
old_prev = """function goPrev() {
  if (currentView === 'month') {
    currentMonthDate.setMonth(currentMonthDate.getMonth() - 1);
    renderCalendar();
  } else {
    state.currentWeekStart = addDays(state.currentWeekStart, -7);
    renderCalendar();
  }
}"""
new_prev = """function goPrev() {
  if (currentView === 'month') {
    currentMonthDate.setMonth(currentMonthDate.getMonth() - 1);
    state.currentMonthDate = new Date(currentMonthDate);
    renderCalendar();
  } else {
    state.currentWeekStart = addDays(state.currentWeekStart, -7);
    renderCalendar();
  }
  saveState();
}"""
content = content.replace(old_prev, new_prev, 1)

# 4. goNext() - add state.currentMonthDate + saveState()
old_next = """function goNext() {
  if (currentView === 'month') {
    currentMonthDate.setMonth(currentMonthDate.getMonth() + 1);
    renderCalendar();
  } else {
    state.currentWeekStart = addDays(state.currentWeekStart, 7);
    renderCalendar();
  }
}"""
new_next = """function goNext() {
  if (currentView === 'month') {
    currentMonthDate.setMonth(currentMonthDate.getMonth() + 1);
    state.currentMonthDate = new Date(currentMonthDate);
    renderCalendar();
  } else {
    state.currentWeekStart = addDays(state.currentWeekStart, 7);
    renderCalendar();
  }
  saveState();
}"""
content = content.replace(old_next, new_next, 1)

# 5. Init - restore saved view, month date, and update toggle buttons
old_init = """  loadState();
  applyTheme();
  if (!state.currentWeekStart) {
    state.currentWeekStart = getMonday(new Date());
  }
  renderCalendar();"""
new_init = """  loadState();
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
  renderCalendar();"""
content = content.replace(old_init, new_init, 1)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print('schedule.js changes applied successfully')
