import re

with open('shared.js', 'r', encoding='utf-8', newline='') as f:
    content = f.read()

old = '''// ─── NOTIFICATIONS ─────────────────────────────────────────
let notificationInterval = null;
let notifiedTaskIds = new Set();
function requestNotifPermission() {
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
  }
}
function scheduleReminderCheck() {
  if (notificationInterval) clearInterval(notificationInterval);
  notificationInterval = setInterval(checkReminders, 30000);
  setTimeout(checkReminders, 2000);
}
function checkReminders() {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  const now = new Date();
  const today = formatDate(now);
  const currentMins = now.getHours() * 60 + now.getMinutes();
  
  // Check task reminders
  for (const task of state.tasks) {
    if (task.completed || isWhiteboardTask(task) || !task.reminder) continue;
    if (task.date !== today) continue;
    const taskStart = parseTime(task.startTime);
    const remindAt = taskStart - task.reminder;
    if (remindAt <= currentMins && currentMins < remindAt + 1 && !notifiedTaskIds.has(task.id)) {
      notifiedTaskIds.add(task.id);
      try {
        new Notification(`Upcoming: ${task.title}`, {
          body: `${formatTimeRange(task.startTime, task.endTime)} — ${TAG_LABELS[task.tag] || task.tag}`,
          icon: '/favicon.ico',
        });
      } catch (e) { /* ignore */ }
    }
  }
  
  // Check wind-down reminder
  checkWindDownReminder(currentMins, today);
}

function checkWindDownReminder(currentMins, today) {
  try {
    const targets = loadSleepTargets();
    if (!targets.windDownReminder) return;
    const [bh, bm] = targets.targetBedtime.split(':').map(Number);
    let bedMins = bh * 60 + bm;
    if (bedMins < 720) bedMins += 1440; // normalize past midnight
    let nowMins = currentMins;
    if (nowMins < 720) nowMins += 1440;
    const windDownAt = bedMins - targets.windDownReminderMins;
    if (Math.abs(nowMins - windDownAt) <= 1) {
      const windKey = 'winddown-' + today;
      if (notifiedTaskIds.has(windKey)) return;
      notifiedTaskIds.add(windKey);
      try {
        new Notification('🛏️ Wind-down time', {
          body: `Your target bedtime is ${formatTimeAMPM(targets.targetBedtime)}. Start winding down!`,
          icon: '/favicon.ico',
        });
      } catch (e) { /* ignore */ }
    }
  } catch (e) { /* ignore */ }
}'''

new = '''// ─── NOTIFICATIONS ─────────────────────────────────────────
let notificationInterval = null;
let notifiedTaskIds = new Set();
let _dailyBriefingNotified = false;

// Centralized notification sender with vibration support
function _sendNotification(title, body, opts) {
  opts = opts || {};
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  try {
    var n = new Notification(title, {
      body: body,
      icon: opts.icon || '/favicon.ico',
      tag: opts.tag || ('haven-' + Date.now()),
    });
    n.onclick = function() { window.focus(); if (opts.onClick) opts.onClick(); };
    if (opts.vibrate !== false && 'vibrate' in navigator) {
      try { navigator.vibrate(opts.vibratePattern || [100, 50, 100]); } catch(e) {}
    }
  } catch (e) { /* ignore */ }
}

// Update document title with uncompleted task count
function _updateNotifBadge() {
  var today = formatDate(new Date());
  var count = state.tasks.filter(function(t) { return t.date === today && !t.completed && !isWhiteboardTask(t); }).length;
  var baseTitle = document.title.replace(/^\\(\\d+\\)\\s*/, '');
  document.title = count > 0 ? '(' + count + ') ' + baseTitle : baseTitle;
}

function requestNotifPermission() {
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
  }
}
function scheduleReminderCheck() {
  if (notificationInterval) clearInterval(notificationInterval);
  notificationInterval = setInterval(checkReminders, 30000);
  setTimeout(checkReminders, 2000);
  setTimeout(_updateNotifBadge, 1000);
  setInterval(_updateNotifBadge, 60000);
  setTimeout(_sendDailyBrief, 3000);
}
function _sendDailyBrief() {
  if (_dailyBriefingNotified || !('Notification' in window) || Notification.permission !== 'granted') return;
  _dailyBriefingNotified = true;
  var today = formatDate(new Date());
  var todayTasks = state.tasks.filter(function(t) { return t.date === today && !t.completed && !isWhiteboardTask(t); });
  if (todayTasks.length === 0) return;
  var tagCounts = {};
  for (var ti = 0; ti < todayTasks.length; ti++) {
    var label = TAG_LABELS[todayTasks[ti].tag] || todayTasks[ti].tag;
    tagCounts[label] = (tagCounts[label] || 0) + 1;
  }
  var entries = Object.entries(tagCounts).sort(function(a, b) { return b[1] - a[1]; }).slice(0, 3);
  var tagSummary = entries.map(function(e) { return e[0] + ': ' + e[1]; }).join(' \\u00B7 ');
  _sendNotification('\\u2600\\uFE0F Good morning! ' + todayTasks.length + ' task' + (todayTasks.length !== 1 ? 's' : '') + ' today', tagSummary, { tag: 'daily-brief', vibrate: false });
}
function checkReminders() {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  const now = new Date();
  const today = formatDate(now);
  const currentMins = now.getHours() * 60 + now.getMinutes();
  
  // Check task reminders
  for (const task of state.tasks) {
    if (task.completed || isWhiteboardTask(task) || !task.reminder) continue;
    if (task.date !== today) continue;
    const taskStart = parseTime(task.startTime);
    const remindAt = taskStart - task.reminder;
    if (remindAt <= currentMins && currentMins < remindAt + 1 && !notifiedTaskIds.has(task.id)) {
      notifiedTaskIds.add(task.id);
      _sendNotification('\\u23F0 ' + task.title, formatTimeRange(task.startTime, task.endTime) + ' \\u2014 ' + (TAG_LABELS[task.tag] || task.tag), {
        tag: 'task-remind-' + task.id,
        onClick: function() { if (typeof openTaskModal === 'function') openTaskModal(task.id); }
      });
    }
  }
  
  // Check for tasks starting within 5 minutes
  for (const task of state.tasks) {
    if (task.completed || isWhiteboardTask(task)) continue;
    if (task.date !== today) continue;
    if (notifiedTaskIds.has('upcoming-' + task.id)) continue;
    const taskStart = parseTime(task.startTime);
    const threshold = (task.reminder && task.reminder > 300) ? task.reminder : 300;
    if (currentMins >= taskStart - threshold && currentMins < taskStart - threshold + 1) {
      notifiedTaskIds.add('upcoming-' + task.id);
      var timeStr = formatTimeAMPM(task.startTime);
      _sendNotification('Starting soon: ' + task.title, 'At ' + timeStr + ' \\u00B7 ' + formatDuration(getDurationMinutes(task)), { tag: 'upcoming-' + task.id });
    }
  }
  
  // Check wind-down reminder
  checkWindDownReminder(currentMins, today);
  // Clean old notification keys
  _cleanNotifIds();
  _updateNotifBadge();
}

function _cleanNotifIds() {
  const today = formatDate(new Date());
  const toDelete = [];
  for (const key of notifiedTaskIds) {
    if (typeof key === 'string' && key.startsWith('winddown-') && !key.endsWith(today)) {
      toDelete.push(key);
    }
  }
  for (const key of toDelete) notifiedTaskIds.delete(key);
  if (notifiedTaskIds.size > 200) {
    const arr = Array.from(notifiedTaskIds);
    notifiedTaskIds = new Set(arr.slice(arr.length - 100));
  }
}

function checkWindDownReminder(currentMins, today) {
  try {
    const targets = loadSleepTargets();
    if (!targets.windDownReminder) return;
    const [bh, bm] = targets.targetBedtime.split(':').map(Number);
    let bedMins = bh * 60 + bm;
    if (bedMins < 720) bedMins += 1440;
    let nowMins = currentMins;
    if (nowMins < 720) nowMins += 1440;
    const windDownAt = bedMins - targets.windDownReminderMins;
    if (Math.abs(nowMins - windDownAt) <= 3) {
      const windKey = 'winddown-' + today;
      if (notifiedTaskIds.has(windKey)) return;
      notifiedTaskIds.add(windKey);
      _sendNotification('Wind-down time', 'Your target bedtime is ' + formatTimeAMPM(targets.targetBedtime) + '. Start winding down!', {
        tag: 'winddown',
        vibratePattern: [200, 100, 200, 100, 200]
      });
    }
  } catch (e) { /* ignore */ }
}'''

# Normalize both to the same line ending
old_norm = old.replace('\r\n', '\n')
content_norm = content.replace('\r\n', '\n')
new_norm = new.replace('\r\n', '\n')

if old_norm in content_norm:
    content_norm = content_norm.replace(old_norm, new_norm, 1)
    # Preserve original line endings
    if '\r\n' in content:
        content = content_norm.replace('\n', '\r\n')
    else:
        content = content_norm
    with open('shared.js', 'w', encoding='utf-8', newline='') as f:
        f.write(content)
    print("SUCCESS: Notification section replaced")
else:
    # Try to find where the section starts for debugging
    marker = "// ─── NOTIFICATIONS ─────────────────────────────────────────"
    if marker in content_norm:
        idx = content_norm.index(marker)
        print(f"Found NOTIFICATIONS section at position {idx}")
        # Show what's around that area
        snippet = content_norm[idx:idx+500]
        print(f"First 500 chars:\\n{snippet}")
    else:
        print("ERROR: Could not find NOTIFICATIONS marker in file")
