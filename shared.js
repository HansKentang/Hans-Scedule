/* ============================================
   Havën Schedule — Shared Library
   Common code across all pages
   ============================================ */

// ─── CONFIG ─────────────────────────────────────────────────
const STORAGE_KEY = 'haven-schedule-tasks';
const SETTINGS_KEY = 'haven-schedule-settings';
const API_KEY_STORAGE = 'haven-schedule-apikey';
const API_MODEL_STORAGE = 'haven-schedule-model';
const ROUTINE_STORAGE = 'haven-schedule-routine';
const CHAT_HISTORY_KEY = 'haven-schedule-chat';

const IS_MAC = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
const MOD_KEY = IS_MAC ? '⌘' : 'Ctrl';
const ALT_KEY = IS_MAC ? '⌥' : 'Alt';

function shortcutDisplay(key) {
  return `${MOD_KEY}+${key}`;
}

const API_PROVIDER_STORAGE = 'haven-schedule-provider';

const PROVIDER_MODELS = {
  groq: [
    { value: 'llama-3.3-70b-versatile', label: 'Llama 3.3 70B (recommended)' },
    { value: 'meta-llama/llama-4-scout-17b-16e-instruct', label: 'Llama 4 Scout 17B (vision, images)' },
    { value: 'llama-3.1-8b-instant', label: 'Llama 3.1 8B (fast)' },
  ],
  gemini: [
    { value: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash (balanced)' },
    { value: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro (most capable)' },
    { value: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash (fast)' },
  ],
};
const GROQ_VISION_MODELS = ['meta-llama/llama-4-scout-17b-16e-instruct'];

const PROVIDER_LABELS = { groq: 'Groq', gemini: 'Gemini' };
const PROVIDER_LINKS = {
  groq: { url: 'https://console.groq.com/keys', text: 'console.groq.com/keys' },
  gemini: { url: 'https://aistudio.google.com/apikey', text: 'aistudio.google.com/apikey' },
};

const HOUR_HEIGHT = 60;
const SNAP_MINUTES = 30;
const VISIBLE_HOURS = 23;
const START_HOUR = 5;

// ─── RATE LIMITER & RETRY ──────────────────────────────────
const rateLimiter = {
  _calls: [],
  _maxPerMin: 10,
  check() {
    const now = Date.now();
    this._calls = this._calls.filter(t => now - t < 60000);
    if (this._calls.length >= this._maxPerMin) {
      const oldest = this._calls[0];
      return 60000 - (now - oldest) + 200;
    }
    return 0;
  },
  record() { this._calls.push(Date.now()); },
  reset() { this._calls = []; }
};

function fetchWithRetry(url, options, retries = 2) {
  const delays = [2000, 4000];
  function attempt(n) {
    const waitMs = rateLimiter.check();
    const wait = waitMs > 0 ? new Promise(r => setTimeout(r, waitMs)) : Promise.resolve();
    return wait.then(() => {
      rateLimiter.record();
      return fetch(url, options).then(res => {
        if (res.status === 429 && n < retries) {
          return new Promise(r => setTimeout(r, delays[n])).then(() => attempt(n + 1));
        }
        return res;
      });
    });
  }
  return attempt(0);
}

const AI_USAGE_KEY = 'haven-schedule-ai-usage';

// ─── SLEEP TRACKING ──────────────────────────────────────────
const SLEEP_STORAGE_KEY = 'haven-schedule-sleep';

function loadSleepLogs() {
  try {
    const data = localStorage.getItem(SLEEP_STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
}

function saveSleepLogs(logs) {
  try {
    localStorage.setItem(SLEEP_STORAGE_KEY, JSON.stringify(logs));
  } catch (e) { /* ignore */ }
}

function addSleepLog(data) {
  const logs = loadSleepLogs();
  const log = {
    id: uid(),
    date: data.date || formatDate(new Date()),
    bedtime: data.bedtime || '23:00',
    wakeTime: data.wakeTime || '07:00',
    quality: data.quality || 3,
    notes: data.notes || '',
    createdAt: new Date().toISOString(),
  };
  log.duration = calculateSleepDuration(log.bedtime, log.wakeTime);
  logs.push(log);
  saveSleepLogs(logs);
  return log;
}

function updateSleepLog(id, data) {
  const logs = loadSleepLogs();
  const idx = logs.findIndex(l => l.id === id);
  if (idx === -1) return null;
  logs[idx] = { ...logs[idx], ...data };
  if (data.bedtime !== undefined || data.wakeTime !== undefined) {
    logs[idx].duration = calculateSleepDuration(logs[idx].bedtime, logs[idx].wakeTime);
  }
  saveSleepLogs(logs);
  return logs[idx];
}

function deleteSleepLog(id) {
  const logs = loadSleepLogs();
  saveSleepLogs(logs.filter(l => l.id !== id));
}

function getSleepLog(date) {
  const logs = loadSleepLogs();
  return logs.find(l => l.date === date) || null;
}

function calculateSleepDuration(bedtime, wakeTime) {
  const [bh, bm] = bedtime.split(':').map(Number);
  const [wh, wm] = wakeTime.split(':').map(Number);
  let bedMins = bh * 60 + bm;
  let wakeMins = wh * 60 + wm;
  if (wakeMins <= bedMins) wakeMins += 24 * 60;
  return wakeMins - bedMins;
}

function formatSleepMinutes(mins) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) return m + 'm';
  if (m === 0) return h + 'h';
  return h + 'h ' + m + 'm';
}

const SLEEP_QUALITY_LABELS = {
  1: 'Poor',
  2: 'Fair',
  3: 'Good',
  4: 'Great',
  5: 'Excellent',
};


const TAG_ORDER = ['deep-work', 'meeting', 'exercise', 'study', 'hobby'];

// ─── PRIORITY ────────────────────────────────────────────────
const PRIORITY_LEVELS = [1, 2, 3, 4];
const PRIORITY_LABELS = { 1: 'P1 - Critical', 2: 'P2 - High', 3: 'P3 - Normal', 4: 'P4 - Low' };
const PRIORITY_SHORT = { 1: 'P1', 2: 'P2', 3: 'P3', 4: 'P4' };
const PRIORITY_COLORS = {
  1: { text: '#ef4444', bg: '#fef2f2', border: '#fca5a5' },
  2: { text: '#f59e0b', bg: '#fffbeb', border: '#fcd34d' },
  3: { text: '#6366f1', bg: '#eef2ff', border: '#a5b4fc' },
  4: { text: '#6b7280', bg: '#f3f4f6', border: '#d1d5db' },
};

// ─── TASK TEMPLATES ──────────────────────────────────────────
const TEMPLATES_KEY = 'haven-schedule-templates';

function loadTemplates() {
  try {
    const data = localStorage.getItem(TEMPLATES_KEY);
    return data ? JSON.parse(data) : getDefaultTemplates();
  } catch (e) {
    return getDefaultTemplates();
  }
}

function getDefaultTemplates() {
  return [
    { id: 'tpl-dw', name: 'Deep Work Session', title: 'Deep Work: Focus session', tag: 'deep-work', duration: 120, priority: 2 },
    { id: 'tpl-mtg', name: 'Team Meeting', title: 'Team standup', tag: 'meeting', duration: 30, priority: 2 },
    { id: 'tpl-ex', name: 'Workout', title: 'Morning workout', tag: 'exercise', duration: 60, priority: 3 },
    { id: 'tpl-st', name: 'Study Session', title: 'Study session', tag: 'study', duration: 60, priority: 3 },
    { id: 'tpl-hb', name: 'Hobby Time', title: 'Personal project', tag: 'hobby', duration: 90, priority: 4 },
  ];
}

function saveTemplates(templates) {
  try {
    localStorage.setItem(TEMPLATES_KEY, JSON.stringify(templates));
  } catch (e) { /* ignore */ }
}

// ─── POMODORO TIMER ──────────────────────────────────────────
const POMODORO_KEY = 'haven-schedule-pomodoro';
let pomodoroState = null;

function loadPomodoroState() {
  try {
    const data = localStorage.getItem(POMODORO_KEY);
    pomodoroState = data ? JSON.parse(data) : null;
  } catch (e) {
    pomodoroState = null;
  }
}

function savePomodoroState() {
  try {
    localStorage.setItem(POMODORO_KEY, JSON.stringify(pomodoroState));
  } catch (e) { /* ignore */ }
}

function createPomodoroSession(taskId, taskTitle, durationMinutes) {
  pomodoroState = {
    taskId,
    taskTitle,
    totalMinutes: durationMinutes,
    elapsedSeconds: 0,
    isRunning: false,
    startedAt: null,
    completedCycles: 0,
    isBreak: false,
    breakMinutes: 5,
  };
  savePomodoroState();
  return pomodoroState;
}

// ─── FOCUS MODE ──────────────────────────────────────────────
const FOCUS_MODE_KEY = 'haven-schedule-focus';
let focusModeActive = false;

function updateFocusModeBubble() {
  const el = document.getElementById('accessFocusMode');
  if (!el) return;
  el.classList.toggle('active', focusModeActive);
}

function toggleFocusMode() {
  focusModeActive = !focusModeActive;
  document.documentElement.classList.toggle('focus-mode', focusModeActive);
  updateFocusModeBubble();
  try {
    localStorage.setItem(FOCUS_MODE_KEY, JSON.stringify(focusModeActive));
  } catch (e) { /* ignore */ }
}

function loadFocusMode() {
  try {
    const data = localStorage.getItem(FOCUS_MODE_KEY);
    focusModeActive = data ? JSON.parse(data) : false;
    if (focusModeActive) {
      document.documentElement.classList.add('focus-mode');
    }
    updateFocusModeBubble();
  } catch (e) {
    focusModeActive = false;
  }
}
const TAG_LABELS = {
  'deep-work': 'Deep Work',
  'meeting': 'Meeting',
  'exercise': 'Exercise',
  'study': 'Study',
  'hobby': 'Hobby',
};
const TAG_COLORS = {
  'deep-work': { bg: 'var(--tag-deep-work-bg)', text: 'var(--tag-deep-work-text)' },
  'meeting':   { bg: 'var(--tag-meeting-bg)',   text: 'var(--tag-meeting-text)' },
  'exercise':  { bg: 'var(--tag-exercise-bg)',  text: 'var(--tag-exercise-text)' },
  'study':     { bg: 'var(--tag-study-bg)',     text: 'var(--tag-study-text)' },
  'hobby':     { bg: 'var(--tag-hobby-bg)',     text: 'var(--tag-hobby-text)' },
};

const CARD_COLORS_KEY = 'haven-card-colors';

const DEFAULT_TAG_COLORS = {
  'deep-work': { light: '#6366f1', dark: '#a5b4fc' },
  'meeting':   { light: '#3b82f6', dark: '#93c5fd' },
  'exercise':  { light: '#ef4444', dark: '#fca5a5' },
  'study':     { light: '#10b981', dark: '#6ee7b7' },
  'hobby':     { light: '#f59e0b', dark: '#fcd34d' },
};

let cardColors = {};

function loadCardColors() {
  try {
    const stored = localStorage.getItem(CARD_COLORS_KEY);
    cardColors = stored ? JSON.parse(stored) : {};
    // Merge with defaults for any missing tags
    for (const tag of TAG_ORDER) {
      if (!cardColors[tag]) {
        cardColors[tag] = { ...DEFAULT_TAG_COLORS[tag] };
      }
    }
  } catch (e) {
    cardColors = {};
  }
  applyCardColors();
}

function saveCardColors(colors) {
  cardColors = colors;
  try { localStorage.setItem(CARD_COLORS_KEY, JSON.stringify(cardColors)); } catch (e) { /* ignore */ }
  applyCardColors();
}

function resetCardColors() {
  saveCardColors(JSON.parse(JSON.stringify(DEFAULT_TAG_COLORS)));
}

function applyCardColors() {
  const root = document.documentElement;
  const isDark = root.classList.contains('dark');
  for (const tag of TAG_ORDER) {
    const c = cardColors[tag] || DEFAULT_TAG_COLORS[tag];
    if (!c) continue;
    const darkText = c.dark || lightenColor(c.light, 0.45);
    const darkBg = darkenColor(c.light, 0.82);
    root.style.setProperty(`--tag-${tag}-text`, isDark ? darkText : c.light);
    root.style.setProperty(`--tag-${tag}-bg`, isDark ? darkBg : lightenColor(c.light, 0.88));
  }
}

function lightenColor(hex, amount) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const nr = Math.round(r + (255 - r) * amount);
  const ng = Math.round(g + (255 - g) * amount);
  const nb = Math.round(b + (255 - b) * amount);
  return `#${nr.toString(16).padStart(2, '0')}${ng.toString(16).padStart(2, '0')}${nb.toString(16).padStart(2, '0')}`;
}

function darkenColor(hex, amount) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const nr = Math.round(r * (1 - amount));
  const ng = Math.round(g * (1 - amount));
  const nb = Math.round(b * (1 - amount));
  return `#${nr.toString(16).padStart(2, '0')}${ng.toString(16).padStart(2, '0')}${nb.toString(16).padStart(2, '0')}`;
}

function hexToHsv(hex) {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0, v = max;
  const d = max - min;
  s = max === 0 ? 0 : d / max;
  if (max !== min) {
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) * 60; break;
      case g: h = ((b - r) / d + 2) * 60; break;
      case b: h = ((r - g) / d + 4) * 60; break;
    }
  }
  return { h, s, v };
}

function hsvToHex(h, s, v) {
  h = ((h % 360) + 360) % 360;
  const c = v * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = v - c;
  let r, g, b;
  if (h < 60) { r = c; g = x; b = 0; }
  else if (h < 120) { r = x; g = c; b = 0; }
  else if (h < 180) { r = 0; g = c; b = x; }
  else if (h < 240) { r = 0; g = x; b = c; }
  else if (h < 300) { r = x; g = 0; b = c; }
  else { r = c; g = 0; b = x; }
  const toHex = (n) => Math.round((n + m) * 255).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

// ─── UNDO STACK ────────────────────────────────────────────
const MAX_UNDO = 30;
let undoStack = [];
function pushUndo() {
  undoStack.push(JSON.parse(JSON.stringify(state.tasks)));
  if (undoStack.length > MAX_UNDO) undoStack.shift();
}
function undo() {
  if (undoStack.length === 0) return false;
  state.tasks = undoStack.pop();
  saveState();
  if (typeof pageAfterTaskSave === 'function') pageAfterTaskSave();
  return true;
}

// ─── NOTIFICATIONS ─────────────────────────────────────────
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
}

// ─── RECURRING TASK EXPANSION ─────────────────────────────
function expandRecurringTasks(dateStart, dateEnd) {
  const expanded = [];
  for (const task of state.tasks) {
    if (!task.repeat || task.repeat.type === 'none' || !task.date) {
      expanded.push(task);
      continue;
    }
    const r = task.repeat;
    const taskDate = new Date(task.date + 'T00:00:00');
    const start = new Date(dateStart);
    const end = new Date(dateEnd);
    let current = new Date(taskDate);
    let count = 0;
    const maxExpand = 365;

    while (current <= end && count < maxExpand) {
      if (current >= start) {
        const ds = formatDate(current);
        if (r.type === 'weekdays' && (current.getDay() === 0 || current.getDay() === 6)) {
          // skip weekends
        } else {
          expanded.push({ ...task, _repeatInstance: true, date: ds, id: task.id + '_' + ds });
        }
      }
      count++;
      if (r.type === 'daily') current.setDate(current.getDate() + (r.interval || 1));
      else if (r.type === 'weekdays') current.setDate(current.getDate() + 1);
      else if (r.type === 'weekly') current.setDate(current.getDate() + 7 * (r.interval || 1));
      else if (r.type === 'monthly') current.setMonth(current.getMonth() + (r.interval || 1));
      else break;

      if (r.endAfter && count >= r.endAfter) break;
      if (r.endDate && current > new Date(r.endDate + 'T00:00:00')) break;
    }
  }
  // Dedup: use original task id (strip repeat suffix) + date as key
  const seen = new Set();
  const merged = [];
  for (const t of expanded) {
    const origId = t._repeatInstance ? t.id.split('_')[0] : t.id;
    const key = origId + '|' + t.date;
    if (!seen.has(key)) { seen.add(key); merged.push(t); }
    // else: original takes precedence over duplicate repeat instance
  }
  return merged;
}

// ─── PAGE TRANSITIONS ──────────────────────────────────
// Fade-in on load + fade-out on sidebar nav click
(function initPageTransitions() {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupPageTransitions);
  } else {
    setupPageTransitions();
  }
  function setupPageTransitions() {
    const content = document.querySelector('.hub-content');
    if (!content) return;
    // Fade in on load
    requestAnimationFrame(() => {
      content.classList.add('transitioning-in');
      requestAnimationFrame(() => {
        content.classList.add('active');
      });
    });
    // Intercept sidebar nav + gallery card clicks for fade-out
    document.querySelectorAll('.hub-snav-item, .hub-gallery-card').forEach(item => {
      item.addEventListener('click', function(e) {
        const href = this.getAttribute('href');
        if (!href || href === location.pathname.split('/').pop()) return;
        e.preventDefault();
        content.classList.remove('active');
        content.classList.add('transitioning-out');
        setTimeout(() => {
          window.location.href = href;
        }, 200);
      });
    });
  }
})();

// ─── PAGE CALLBACK FALLBACK ───────────────────────────────
let pageAfterTaskSave = null;
let pageAfterImport = null;

// ─── STATE ──────────────────────────────────────────────────
let state = {
  tasks: [],
  currentWeekStart: null,
  selectedTag: null,
  editingTask: null,
  showWeekends: true,
  showCompleted: true,
  searchQuery: '',
  cmdPaletteOpen: false,
  taskModalOpen: false,
  helpModalOpen: false,
  aiChatOpen: false,
  apiKey: '',
  apiModel: 'llama-3.3-70b-versatile',
  apiProvider: 'groq',
  darkMode: null,
  userProfile: null,
  editMode: false,
  accessBubbles: {},
};

const DEFAULT_BUBBLES = {
  'focus-timer': { visible: true, label: 'Focus', color: '#fff' },
  'templates': { visible: true, label: 'Templates', color: '#fff' },
  'focus-mode': { visible: true, label: 'Focus', color: '#fff' },
  'today': { visible: true, label: 'Today', color: '#fff' },
  'idea': { visible: true, label: 'Idea', color: '#fff' },
};

// ─── USER PROFILE / LEARNING ENGINE ───────────────────────
const USER_PROFILE_KEY = 'haven-schedule-profile';

function loadUserProfile() {
  try {
    const data = localStorage.getItem(USER_PROFILE_KEY);
    state.userProfile = data ? JSON.parse(data) : createDefaultProfile();
  } catch (e) {
    state.userProfile = createDefaultProfile();
  }
}

function createDefaultProfile() {
  return {
    totalTasksCreated: 0,
    totalSessions: 0,
    lastSessionDate: null,
    tags: {},
    titleKeywords: {},
    completions: {},
  };
}

function saveUserProfile() {
  try {
    localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(state.userProfile));
  } catch (e) { /* ignore */ }
}

function trackTaskCreated(task) {
  if (!state.userProfile) loadUserProfile();
  const p = state.userProfile;
  p.totalTasksCreated++;

  // Track session
  const today = formatDate(new Date());
  if (p.lastSessionDate !== today) {
    p.lastSessionDate = today;
    p.totalSessions++;
  }

  // Per-tag stats
  const tag = task.tag || 'meeting';
  if (!p.tags[tag]) {
    p.tags[tag] = { count: 0, times: [], durations: [], titles: [] };
  }
  const t = p.tags[tag];
  t.count++;
  if (task.startTime) t.times.push(task.startTime);
  if (task.startTime && task.endTime) {
    const dur = getDurationMinutes(task);
    t.durations.push(dur);
  }
  if (task.title) t.titles.push(task.title);

  // Track title keywords → tag mapping for smart tag prediction
  const words = (task.title || '').toLowerCase().split(/[\s,]+/);
  for (const word of words) {
    if (word.length < 3) continue;
    if (!p.titleKeywords[word]) p.titleKeywords[word] = {};
    p.titleKeywords[word][tag] = (p.titleKeywords[word][tag] || 0) + 1;
  }

  // Limit keyword map size to prevent localStorage bloat
  const kwEntries = Object.entries(p.titleKeywords);
  if (kwEntries.length > 300) {
    // Keep only the 200 most-used keywords (by total count across all tags)
    kwEntries.sort((a, b) => {
      const sumA = Object.values(a[1]).reduce((s, v) => s + v, 0);
      const sumB = Object.values(b[1]).reduce((s, v) => s + v, 0);
      return sumB - sumA;
    });
    p.titleKeywords = Object.fromEntries(kwEntries.slice(0, 200));
  }

  saveUserProfile();
}

function trackTaskCompleted(task) {
  if (!state.userProfile) loadUserProfile();
  const p = state.userProfile;
  const tag = task.tag || 'meeting';
  if (!p.completions[tag]) {
    p.completions[tag] = { count: 0, totalDurationDiff: 0, durations: [] };
  }
  const c = p.completions[tag];
  c.count++;
  if (task.startTime && task.endTime) {
    c.durations.push(getDurationMinutes(task));
  }
  saveUserProfile();
}

function getModeValue(arr) {
  if (!arr || arr.length === 0) return null;
  const freq = {};
  let maxC = 0, mode = arr[0];
  for (const v of arr) { freq[v] = (freq[v] || 0) + 1; if (freq[v] > maxC) { maxC = freq[v]; mode = v; } }
  return mode;
}

function getPreferredTime(tag) {
  const t = state.userProfile?.tags?.[tag];
  return t && t.times.length > 0 ? getModeValue(t.times) : null;
}

function getPreferredDuration(tag) {
  const t = state.userProfile?.tags?.[tag];
  return t && t.durations.length > 0 ? getModeValue(t.durations) : null;
}

function predictTagFromTitle(title) {
  if (!title || !state.userProfile?.titleKeywords) return null;
  const words = title.toLowerCase().split(/[\s,]+/);
  const scores = {};
  for (const tag of TAG_ORDER) scores[tag] = 0;
  for (const word of words) {
    const kw = state.userProfile.titleKeywords[word];
    if (kw) {
      for (const [tag, count] of Object.entries(kw)) {
        if (scores[tag] !== undefined) scores[tag] += count;
      }
    }
  }
  let best = null, bestS = 0;
  for (const [tag, score] of Object.entries(scores)) {
    if (score > bestS) { bestS = score; best = tag; }
  }
  return bestS > 0 ? best : null;
}

function getLearningContext() {
  if (!state.userProfile) loadUserProfile();
  const p = state.userProfile;
  if (p.totalTasksCreated === 0) return '';

  const lines = [];
  lines.push(`USER'S LEARNED PATTERNS (based on ${p.totalTasksCreated} tasks across ${p.totalSessions} sessions):`);

  for (const tag of TAG_ORDER) {
    const t = p.tags[tag];
    if (!t || t.count === 0) continue;
    const prefs = [];
    const pt = getPreferredTime(tag);
    const pd = getPreferredDuration(tag);
    if (pt) prefs.push(`prefers ~${pt}`);
    if (pd) prefs.push(`typically ${formatDuration(pd)}`);
    const titleSummary = t.titles.length > 3
      ? ` (e.g. "${t.titles.slice(0, 3).join('", "')}")`
      : ` ("${t.titles.join('", "')}")`;
    lines.push(`- ${TAG_LABELS[tag]}: ${t.count} tasks${prefs.length ? ', ' + prefs.join(', ') : ''}${titleSummary}`);
    const comp = p.completions?.[tag];
    if (comp && comp.count >= 3) {
      const avgDur = Math.round(comp.durations.reduce((s, v) => s + v, 0) / comp.durations.length);
      lines.push(`  ↳ completed ${comp.count}x, avg duration ${formatDuration(avgDur)}`);
    }
  }

  // Compute active hours — when the user tends to schedule things
  const hourBuckets = {};
  for (const task of state.tasks) {
    if (!task.startTime || isWhiteboardTask(task)) continue;
    const h = parseInt(task.startTime.split(':')[0]);
    hourBuckets[h] = (hourBuckets[h] || 0) + 1;
  }
  const sortedHours = Object.entries(hourBuckets).sort((a, b) => b[1] - a[1]);
  if (sortedHours.length > 0) {
    const topHours = sortedHours.slice(0, 5).map(([h]) => {
      const ampm = h < 12 ? 'AM' : 'PM';
      const h12 = h % 12 || 12;
      return `${h12}${ampm}`;
    });
    lines.push(`\nMost active hours: ${topHours.join(', ')}`);
  }

  // Day-of-week patterns
  const dowCounts = {};
  for (const task of state.tasks) {
    if (!task.date || isWhiteboardTask(task)) continue;
    const d = new Date(task.date + 'T12:00:00');
    const dow = d.toLocaleDateString('en-US', { weekday: 'long' });
    dowCounts[dow] = (dowCounts[dow] || 0) + 1;
  }
  const activeDays = Object.entries(dowCounts).filter(([,c]) => c >= 3).map(([d]) => d);
  if (activeDays.length > 0) {
    lines.push(`\nBusiest days: ${activeDays.join(', ')}`);
  }

  // Learned keyword→tag mappings for smarter tag prediction
  if (p.titleKeywords) {
    const kwLines = [];
    for (const [word, tagMap] of Object.entries(p.titleKeywords)) {
      const sorted = Object.entries(tagMap).sort((a, b) => b[1] - a[1]);
      if (sorted.length > 0 && sorted[0][1] >= 2) {
        const tagLabel = TAG_LABELS[sorted[0][0]] || sorted[0][0];
        kwLines.push(`- "${word}" → ${tagLabel} (${sorted[0][1]}x)`);
      }
    }
    if (kwLines.length > 0) {
      lines.push(`\nLearned keyword mappings (words the user often uses for specific task types):`);
      lines.push(...kwLines.slice(0, 15));
    }
  }

  const routine = loadRoutine();
  if (routine) {
    lines.push(`\nUSER'S TYPICAL SCHEDULE (follow this routine when suggesting times):\n${routine}`);
  }

  return '\n' + lines.join('\n');
}

function getDailyBriefing() {
  const today = formatDate(new Date());
  const now = new Date();
  const currentMins = now.getHours() * 60 + now.getMinutes();
  const todayTasks = state.tasks.filter(t => t.date === today && !t.completed && !isWhiteboardTask(t));
  if (todayTasks.length === 0) return null;

  const occupied = todayTasks
    .filter(t => t.startTime && t.endTime)
    .map(t => ({ start: parseTime(t.startTime), end: parseTime(t.endTime) }))
    .sort((a, b) => a.start - b.start);

  if (occupied.length === 0) return null;

  const endOfDay = START_HOUR + VISIBLE_HOURS;
  const gaps = [];
  let cursor = currentMins;

  for (const block of occupied) {
    if (block.start > cursor + 30) {
      gaps.push({ start: cursor, end: block.start });
    }
    cursor = Math.max(cursor, block.end);
  }
  if (cursor < endOfDay * 60) {
    gaps.push({ start: cursor, end: endOfDay * 60 });
  }

  const relevantGaps = gaps.filter(g => (g.end - g.start) >= 30);
  if (relevantGaps.length === 0) return null;

  const biggest = relevantGaps.reduce((a, b) => (a.end - a.start > b.end - b.start ? a : b));
  const dur = Math.round((biggest.end - biggest.start) / 30) * 30;
  return {
    gapStart: toTimeStr(biggest.start),
    gapEnd: toTimeStr(biggest.start + dur),
    duration: dur,
    taskCount: todayTasks.length,
  };
}

// ─── DOM REFS (populated by each page) ──────────────────────
const dom = {};

// ─── UTILITY ────────────────────────────────────────────────
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

function uid() {
  return 'xxxx-xxxx-xxxx'.replace(/x/g, () => ((Math.random() * 36) | 0).toString(36));
}

function getMonday(d) {
  const date = new Date(d);
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

function addDays(date, n) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

function formatDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function parseTime(str) {
  const [h, m] = str.split(':').map(Number);
  return h * 60 + m;
}

function toTimeStr(minutes) {
  const h = Math.floor(minutes / 60) % 24;
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function roundToNearest(minutes, snap) {
  return Math.round(minutes / snap) * snap;
}

function getWeekRange(weekStart) {
  const days = [];
  for (let i = 0; i < 7; i++) days.push(addDays(weekStart, i));
  return days;
}

function formatDateLabel(d) {
  return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

function getDayName(d, short) {
  return d.toLocaleDateString('en-US', { weekday: short ? 'short' : 'long' });
}

function isToday(d) {
  const t = new Date();
  return d.getFullYear() === t.getFullYear() && d.getMonth() === t.getMonth() && d.getDate() === t.getDate();
}

function isWeekend(d) {
  return d.getDay() === 0 || d.getDay() === 6;
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function formatTimeRange(start, end) {
  const fmt = (t) => {
    const [h, m] = t.split(':').map(Number);
    const ampm = h < 12 ? 'AM' : 'PM';
    const h12 = h % 12 || 12;
    return `${h12}:${String(m).padStart(2, '0')}${ampm}`;
  };
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  const durMins = (eh * 60 + em) - (sh * 60 + sm);
  const durStr = durMins >= 60
    ? `${Math.floor(durMins / 60)}h${durMins % 60 ? ` ${durMins % 60}m` : ''}`
    : `${durMins}m`;
  return `${fmt(start)} – ${fmt(end)} · ${durStr}`;
}

function isWhiteboardTask(task) {
  return !task.date;
}

function getTagMeta(tag) {
  const m = TAG_COLORS[tag] || TAG_COLORS.meeting;
  const label = TAG_LABELS[tag] || tag;
  return { ...m, label };
}

function getDurationMinutes(task) {
  const start = parseTime(task.startTime);
  const end = parseTime(task.endTime) || start + 60;
  return Math.max(end - start, SNAP_MINUTES);
}

function formatDuration(mins) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

// ─── LOCAL STORAGE ──────────────────────────────────────────
function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.tasks));
    // Persist each custom image to its own localStorage key (single source of truth)
    var _customImgs = {};
    if (state.images) {
      for (var _ck of Object.keys(state.images)) { if (isCustomImage(_ck, state.images[_ck])) _customImgs[_ck] = state.images[_ck]; }
    }
    for (var _ck2 of Object.keys(_customImgs)) {
      try { localStorage.setItem('haven-image-' + _ck2, _customImgs[_ck2]); } catch(e) { /* skip */ }
    }
    localStorage.setItem(SETTINGS_KEY, JSON.stringify({
      showWeekends: state.showWeekends,
      showCompleted: state.showCompleted,
      darkMode: state.darkMode,
      accessBubbles: state.accessBubbles
    }));
  } catch (e) { console.warn('[img] saveState failed:', e); }
}

function loadState() {
  try {
    const tasks = localStorage.getItem(STORAGE_KEY);
    if (tasks) state.tasks = JSON.parse(tasks);
    const settings = localStorage.getItem(SETTINGS_KEY);
    if (settings) {
      const s = JSON.parse(settings);
      state.showWeekends = s.showWeekends ?? true;
      state.showCompleted = s.showCompleted ?? true;
      state.darkMode = s.darkMode !== undefined ? s.darkMode : null;
      state.accessBubbles = s.accessBubbles || {};
      // Images are restored via haven-image-* keys directly
    }
    const key = localStorage.getItem(API_KEY_STORAGE);
    if (key) state.apiKey = key;
    const model = localStorage.getItem(API_MODEL_STORAGE);
    if (model) state.apiModel = model;
    const provider = localStorage.getItem(API_PROVIDER_STORAGE);
    if (provider) state.apiProvider = provider;
    loadCardColors();
    loadUserProfile();
    loadImages();
    // Clean up deprecated ai mode storage
    try { localStorage.removeItem('haven-schedule-ai-mode'); } catch (e) { /* ignore */ }
  } catch (e) { console.warn('[img] loadState failed:', e); /* fresh start */ }
}

// ─── CUSTOM IMAGES ─────────────────────────────────────────
const DEFAULT_IMAGES = {
  'hub-hero': 'https://picsum.photos/seed/haven-hub-hero/1200/600',
  'hub-tulips': '',
  'hub-desk-water': '',
  'hub-lamp': '',
  'hub-ceramic': 'https://picsum.photos/seed/haven-hub-ceramic/400/400',
  'hub-skyline': 'https://picsum.photos/seed/haven-hub-skyline/800/500',
  'hub-bedroom': 'https://picsum.photos/seed/haven-hub-bedroom/600/400',
  'weekly-coffee': 'https://picsum.photos/seed/haven-weekly-coffee/400/400',
  'weekly-journal': 'https://picsum.photos/seed/haven-weekly-journal/400/400',
  'brain-linen': 'https://picsum.photos/seed/haven-brain-linen/600/400',
  'brain-desk-light': 'https://picsum.photos/seed/haven-brain-desk/600/400',
  'goals-tulips': 'https://picsum.photos/seed/haven-goals-tulips/400/400',
  'goals-book': 'https://picsum.photos/seed/haven-goals-book/600/400',
  'goals-studio': 'https://picsum.photos/seed/haven-goals-studio/400/400',
  'schedule-hero': 'https://picsum.photos/seed/haven-schedule-hero/1200/400',
  'schedule-coffee': 'https://picsum.photos/seed/haven-schedule-coffee/400/400',
  'activities-hero': 'https://picsum.photos/seed/haven-activities-hero/1200/500',
  'activities-desk': 'https://picsum.photos/seed/haven-activities-desk/400/400',
  'tags-hero': 'https://picsum.photos/seed/haven-tags-hero/1200/500',
  'tags-studio': 'https://picsum.photos/seed/haven-tags-studio/400/400',
  'analytics-hero': 'https://picsum.photos/seed/haven-analytics-hero/1200/400',
  'analytics-data': 'https://picsum.photos/seed/haven-analytics-data/400/400',
  'finance-hero': 'https://picsum.photos/seed/haven-finance-hero/1200/400',
  'finance-ceramic': 'https://picsum.photos/seed/haven-finance-ceramic/400/400',
  'goals-hero': 'https://picsum.photos/seed/haven-goals-hero/1200/500',
  'goals-ceramic': 'https://picsum.photos/seed/haven-goals-ceramic/400/400',
  'hub-image-1': 'https://picsum.photos/seed/haven-canvas-1/600/400',
  'hub-image-2': 'https://picsum.photos/seed/haven-canvas-2/600/400',
  'hub-image-3': 'https://picsum.photos/seed/haven-canvas-3/600/400',
  'hub-image-4': 'https://picsum.photos/seed/haven-canvas-4/600/400',
  'hub-image-5': 'https://picsum.photos/seed/haven-canvas-5/600/400',
  'hub-image-6': 'https://picsum.photos/seed/haven-canvas-6/600/400',
  'hub-image-7': 'https://picsum.photos/seed/haven-canvas-7/600/400',
  'hub-image-8': 'https://picsum.photos/seed/haven-canvas-8/600/400',
  'hub-image-9': 'https://picsum.photos/seed/haven-canvas-9/600/400',
  'hub-image-10': 'https://picsum.photos/seed/haven-canvas-10/600/400'
};

function loadImages() {
  state.images = { ...DEFAULT_IMAGES };
  try { restoreDirectImageKeys(); } catch(e) { /* skip */ }
}

function restoreDirectImageKeys() {
  var _found = 0;
  for (var _i = 0; _i < localStorage.length; _i++) {
    var _k = localStorage.key(_i);
    if (_k && _k.indexOf('haven-image-') === 0) {
      var _id = _k.slice(12);
      if (_id) { var _v = localStorage.getItem(_k); if (_v) { state.images[_id] = _v; _found++; } }
    }
  }
  if (_found) console.warn('[img] restoreDirectImageKeys found', _found, 'keys');
  else console.warn('[img] restoreDirectImageKeys: no haven-image-* keys found');
}

function isCustomImage(key, url) {
  // Returns true if the image differs from its default
  return url && url !== DEFAULT_IMAGES[key];
}

function saveImages() {
  for (const key of Object.keys(state.images || {})) {
    const val = state.images[key];
    if (!val) continue;
    try { localStorage.setItem('haven-image-' + key, val); } catch(e) { /* skip */ }
  }
}

function getImage(id) {
  if (!state.images) loadImages();
  // Use state.images as the single in-memory source of truth
  var url = state.images && state.images[id];
  if (url) return url;
  return DEFAULT_IMAGES[id] || '';
}

function setImage(id, url) {
  if (!state.images) loadImages();
  state.images[id] = url;
  try { localStorage.setItem('haven-image-' + id, url); } catch(e) { /* skip */ }
  if (typeof hubContent !== 'undefined' && hubContent && hubContent.bentoLayout) {
    var _item = hubContent.bentoLayout.find(function(i){return i.imageId === id;});
    if (_item) _item._imgUrl = url;
  }
  document.querySelectorAll('img[data-image-id="' + id + '"]').forEach(function(el) {
    el.src = url;
    el.style.display = url ? 'block' : 'none';
    var wrap = el.closest('.bento-img-wrap');
    if (wrap) {
      var placeholder = wrap.querySelector('.bento-img-placeholder');
      if (placeholder) placeholder.style.display = url ? 'none' : 'flex';
    }
  });
}

function resetImage(id) {
  if (!state.images) loadImages();
  delete state.images[id];
  try { localStorage.removeItem('haven-image-' + id); } catch(e) { /* ignore */ }
  if (typeof hubContent !== 'undefined' && hubContent && hubContent.bentoLayout) {
    const item = hubContent.bentoLayout.find(i => i.imageId === id);
    if (item && item._imgUrl) delete item._imgUrl;
  }
  const url = DEFAULT_IMAGES[id] || '';
  document.querySelectorAll(`img[data-image-id="${id}"]`).forEach(el => {
    el.src = url;
    el.style.display = url ? 'block' : 'none';
    const wrap = el.closest('.bento-img-wrap');
    if (wrap) {
      const placeholder = wrap.querySelector('.bento-img-placeholder');
      if (placeholder) placeholder.style.display = url ? 'none' : 'flex';
    }
  });
}

function imageLabel(id) {
  const map = {
    'hub-hero': 'Hub Hero', 'hub-tulips': 'Hub Tulips', 'hub-desk-water': 'Hub Desk Water', 'hub-lamp': 'Hub Lamp',
    'hub-ceramic': 'Hub Avatar', 'hub-skyline': 'Hub Skyline', 'hub-bedroom': 'Hub Bedroom',
    'weekly-coffee': 'Weekly Coffee', 'weekly-journal': 'Weekly Journal',
    'brain-linen': 'Brain Linen', 'brain-desk-light': 'Brain Desk Light',
    'goals-tulips': 'Goals Tulips', 'goals-book': 'Goals Book', 'goals-studio': 'Goals Studio',
    'schedule-hero': 'Schedule Hero', 'schedule-coffee': 'Schedule Coffee',
    'activities-hero': 'Activities Hero', 'activities-desk': 'Activities Desk',
    'tags-hero': 'Tags Hero', 'tags-studio': 'Tags Studio',
    'analytics-hero': 'Analytics Hero', 'analytics-data': 'Analytics Data',
    'finance-hero': 'Finance Hero', 'finance-ceramic': 'Finance Avatar',
    'goals-hero': 'Goals Hero', 'goals-ceramic': 'Goals Avatar'
  };
  return map[id] || id.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

let _pickerImageId = null;

function openImagePicker(id) {
  _pickerImageId = id;
  const overlay = document.getElementById('imagePickerOverlay');
  const preview = document.getElementById('imagePickerPreview');
  const urlInput = document.getElementById('imagePickerUrl');
  const status = document.getElementById('imagePickerStatus');
  if (!overlay) return;
  const url = getImage(id);
  if (preview) preview.src = url;
  if (preview) preview.style.display = 'block';
  if (urlInput) urlInput.value = url === DEFAULT_IMAGES[id] ? '' : url;
  if (status) status.textContent = 'Paste an image (Ctrl+V) or type a URL';
  overlay.classList.remove('hidden');
  requestAnimationFrame(() => overlay.classList.add('active'));
  if (urlInput) { urlInput.focus(); urlInput.select(); }
}

function closeImagePicker() {
  const overlay = document.getElementById('imagePickerOverlay');
  if (!overlay) return;
  overlay.classList.remove('active');
  setTimeout(() => overlay.classList.add('hidden'), 200);
  _pickerImageId = null;
}

function handleImagePickerPaste(e) {
  const status = document.getElementById('imagePickerStatus');
  const preview = document.getElementById('imagePickerPreview');
  const clipboardData = e.clipboardData || window.clipboardData;
  const items = clipboardData?.items;
  if (!items) return;
  for (let i = 0; i < items.length; i++) {
    if (items[i].type.startsWith('image/')) {
      e.preventDefault();
      const blob = items[i].getAsFile();
      if (!blob) return;
      if (blob.size > 2 * 1024 * 1024) {
        if (status) status.textContent = 'Image too large (max 2MB)';
        return;
      }
      const reader = new FileReader();
      reader.onload = function(ev) {
        const dataUrl = ev.target.result;
        if (preview) preview.src = dataUrl;
        if (preview) preview.style.display = 'block';
        if (status) { status.textContent = 'Image loaded — click Save to apply'; status.style.color = 'var(--primary)'; }
        if (preview) preview.dataset.pasted = dataUrl;
        // Clear URL input so pasted image takes priority in handleImagePickerSave
        var _urlInput = document.getElementById('imagePickerUrl');
        if (_urlInput) _urlInput.value = '';        

      };
      reader.readAsDataURL(blob);
      return;
    }
  }
}

// Global paste listener for the image picker — ensures Ctrl+V works even when the pastezone isn't focused
(function initImagePasteListener() {
  document.addEventListener('paste', function(e) {
    var _overlay = document.getElementById('imagePickerOverlay');
    if (!_overlay || _overlay.classList.contains('hidden')) return;
    // Let the URL input handle its own paste
    if (e.target && e.target.id === 'imagePickerUrl') return;
    // Prevent text from appearing in the contenteditable paste zone
    e.preventDefault();
    // Clear any residual text from the contenteditable paste zone
    var _zone = document.getElementById('imagePickerPasteZone');
    if (_zone) _zone.innerHTML = '';
    handleImagePickerPaste(e);
  });
})();

function handleImagePickerUrlInput() {
  const urlInput = document.getElementById('imagePickerUrl');
  const preview = document.getElementById('imagePickerPreview');
  const status = document.getElementById('imagePickerStatus');
  const val = urlInput?.value?.trim() || '';
  if (!val) {
    if (preview) { preview.src = ''; preview.style.display = 'none'; }
    if (status) { status.textContent = 'Paste an image (Ctrl+V) or type a URL'; status.style.color = ''; }
    return;
  }
  if (preview) { preview.src = val; preview.style.display = 'block'; }
  if (status) status.textContent = 'URL loaded — click Save to apply';
}

function handleImagePickerSave() {
  const id = _pickerImageId;
  if (!id) return;
  const preview = document.getElementById('imagePickerPreview');
  const urlInput = document.getElementById('imagePickerUrl');
  const status = document.getElementById('imagePickerStatus');
  const urlVal = urlInput?.value?.trim() || '';
  if (urlVal) {
    setImage(id, urlVal);
  } else if (preview?.dataset.pasted) {
    setImage(id, preview.dataset.pasted);
  } else {
    resetImage(id);
  }
  if (status) { status.textContent = 'Saved!'; status.style.color = 'var(--primary)'; }
  // Re-render image manager in settings drawer if open
  var _settingsDrawer = document.getElementById('settingsDrawer');
  if (_settingsDrawer && _settingsDrawer.classList.contains('open')) {
    renderImageManagerInSettings();
  }
  setTimeout(closeImagePicker, 400);
}

function handleImagePickerReset() {
  const id = _pickerImageId;
  if (!id) return;
  resetImage(id);
  // Re-render image manager in settings drawer if open
  var _settingsDrawer = document.getElementById('settingsDrawer');
  if (_settingsDrawer && _settingsDrawer.classList.contains('open')) {
    renderImageManagerInSettings();
  }
  closeImagePicker();
}


// ─── THEME ──────────────────────────────────────────────────
function applyTheme() {
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const isDark = state.darkMode === null ? prefersDark : state.darkMode;
  document.documentElement.classList.toggle('light', !isDark);
  document.documentElement.classList.toggle('dark', isDark);
  applyCardColors();
}

function toggleTheme() {
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const currentIsDark = state.darkMode === null ? prefersDark : state.darkMode;
  if (state.darkMode === null) state.darkMode = !prefersDark;
  else state.darkMode = !currentIsDark;
  applyTheme();
  saveState();
}

// ─── TASK CRUD ─────────────────────────────────────────────
function createTask(data) {
  pushUndo();
  const task = {
    id: uid(),
    title: data.title || 'Untitled',
    date: data.date || '',
    startTime: data.startTime || '09:00',
    endTime: data.endTime || '10:00',
    tag: data.tag || 'meeting',
    notes: data.notes || '',
    completed: false,
    createdAt: new Date().toISOString(),
    repeat: data.repeat || null,
    reminder: data.reminder || 0,
    priority: data.priority || 3,
  };
  state.tasks.push(task);
  saveState();
  trackTaskCreated(task);
  return task;
}

function updateTask(id, data) {
  const idx = state.tasks.findIndex(t => t.id === id);
  if (idx === -1) return null;
  pushUndo();
  state.tasks[idx] = { ...state.tasks[idx], ...data };
  saveState();
  if (typeof pageAfterTaskSave === 'function') pageAfterTaskSave();
  return state.tasks[idx];
}

function deleteTask(id) {
  pushUndo();
  state.tasks = state.tasks.filter(t => t.id !== id);
  saveState();
  if (typeof pageAfterTaskSave === 'function') pageAfterTaskSave();
}

function getTask(id) {
  return state.tasks.find(t => t.id === id);
}

function toggleComplete(id) {
  const task = getTask(id);
  if (task) {
    const wasCompleted = task.completed;
    updateTask(id, { completed: !wasCompleted });
    if (!wasCompleted) trackTaskCompleted(task);
  }
}

function callGeminiAPI(text) {
  const today = new Date();
  const todayStr = formatDate(today);
  const dayNames = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const taskSummary = buildTaskSummary();
  const learningContext = getLearningContext();
  const now = new Date();
  const nowStr = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
  const systemPrompt = `You are a smart calendar scheduling assistant. Today is ${todayStr} (${dayNames[now.getDay()]}). Current time: ${nowStr}.${learningContext}

CALENDAR GRID: The visible hours are ${toTimeStr(START_HOUR * 60)} – ${toTimeStr((START_HOUR + VISIBLE_HOURS) * 60)}. All times must snap to :00 or :30.

EXISTING TASKS (next 2 weeks):
${taskSummary || 'None'}

SMART SCHEDULING RULES — follow these strictly:
1. Choose a START TIME and END TIME that does NOT conflict with any existing task
2. Consider the time of day — different task types fit different times:
   - Deep work → best in morning (9-12), needs 2hr uninterrupted blocks
   - Exercise → morning (6-8) or late afternoon/evening (17-19)
   - Meetings → late morning or afternoon (10-11, 14-16), keep 30min default
   - Study → afternoon or evening, consistent schedule
   - Hobby → evening, weekends
3. Leave 15min buffer between consecutive tasks (don't back-to-back)
4. Don't schedule anything before 6am or after 11pm unless the user specifies
5. Prefer the user's established routine times from their typical schedule above
6. "Morning" = 6-12, "afternoon" = 12-17, "evening" = 17-21

TITLE QUALITY — make the task title specific and descriptive, not generic:
- Deep work: "Deep work: [concrete goal]" (e.g. "Deep work: Design system architecture")
- Exercise: "[specific activity]" (e.g. "Morning run 5k", "Gym: upper body", "Yoga flow")
- Meetings: "[purpose]" (e.g. "Team standup", "1:1 with Manager", "Sprint planning")
- Study: "Study [subject] — [topic]" (e.g. "Study Mandarin — lesson 12")
- Hobby: "[specific activity]" (e.g. "Read 'Atomic Habits'", "Practice guitar scales")
- NEVER use just the tag name as the title

Parse the user's request into a JSON object with these exact fields:
- title: string (event name)
- date: string (YYYY-MM-DD)
- startTime: string (HH:MM 24h)
- endTime: string (HH:MM 24h)
- tag: string ("meeting" | "deep-work" | "exercise" | "study" | "hobby")

Tag rules: "deep work"/"focus"/"heads down" = deep-work. "gym"/"workout"/"run"/"cardio"/"exercise" = exercise. "math"/"english"/"class"/"chemistry"/"physics"/"mandarin"/"study" = study. "design"/"movie"/"build"/"app"/"hobby" = hobby. Default tag = "meeting".
Default duration: 1 hour. Default time: 9 AM. "tomorrow" = next day. Day names = next occurrence. "morning" ≈ 9am, "afternoon" ≈ 2pm, "evening" ≈ 7pm.

IMPORTANT: Choose a time slot that does NOT conflict with existing tasks shown above. If the user's requested time is taken, shift to the nearest free slot.

Return ONLY valid JSON. No markdown, no code fences, no extra text.`;
  return fetchWithRetry(`https://generativelanguage.googleapis.com/v1beta/models/${state.apiModel}:generateContent?key=${state.apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: systemPrompt }] },
      contents: [{ role: 'user', parts: [{ text: 'User request: ' + text }] }],
      generationConfig: { temperature: 0.1, maxOutputTokens: 500 }
    })
  }).then(async res => {
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new Error(`API error: ${res.status}${body ? ' — ' + body.slice(0, 200) : ''}`);
    }
    return res.json();
  }).then(data => {
    const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!raw) throw new Error('Empty response');
    let p;
    try { p = JSON.parse(raw); } catch (e) {
      const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (fenced) try { p = JSON.parse(fenced[1]); } catch (e2) {}
      if (!p) {
        const m = raw.match(/\{[\s\S]*\}/);
        if (m) p = JSON.parse(m[0]);
        else throw new Error('Invalid JSON response');
      }
    }
    if (!p.title || !p.date || !p.startTime || !p.endTime) throw new Error('Incomplete data');
    if (isNaN(new Date(p.date + 'T' + p.startTime).getTime())) throw new Error('Invalid date');
    return { title: p.title, date: p.date, startTime: p.startTime, endTime: p.endTime, tag: p.tag || 'meeting' };
  });
}

// ─── API KEY MANAGEMENT ─────────────────────────────────────
function saveApiKey(key) {
  state.apiKey = key;
  try { localStorage.setItem(API_KEY_STORAGE, key); } catch (e) { /* ignore */ }
}

function saveApiModel(model) {
  state.apiModel = model;
  try { localStorage.setItem(API_MODEL_STORAGE, model); } catch (e) { /* ignore */ }
}

function clearApiKey() {
  state.apiKey = '';
  try { localStorage.removeItem(API_KEY_STORAGE); } catch (e) { /* ignore */ }
}

function saveRoutine(text) {
  try { localStorage.setItem(ROUTINE_STORAGE, text); } catch (e) { /* ignore */ }
}

function loadRoutine() {
  try { return localStorage.getItem(ROUTINE_STORAGE) || ''; } catch (e) { return ''; }
}



function saveApiProvider(provider) {
  state.apiProvider = provider;
  try { localStorage.setItem(API_PROVIDER_STORAGE, provider); } catch (e) { /* ignore */ }
}

// ─── AI USAGE TRACKING ────────────────────────────────────
let aiUsage = null;

function loadAIUsage() {
  try {
    const data = localStorage.getItem(AI_USAGE_KEY);
    aiUsage = data ? JSON.parse(data) : createDefaultAIUsage();
  } catch (e) {
    aiUsage = createDefaultAIUsage();
  }
}

function createDefaultAIUsage() {
  return {
    chatMessagesSent: 0,
    commandPaletteCalls: 0,
    filesUploaded: 0,
    tasksCreatedByAI: 0,
    totalAPICalls: 0,
    firstUsed: null,
    lastUsed: null,
    dailyUsage: {},
  };
}

function saveAIUsage() {
  try {
    localStorage.setItem(AI_USAGE_KEY, JSON.stringify(aiUsage));
  } catch (e) { /* ignore */ }
}

function trackAIUsage(event) {
  if (!aiUsage) loadAIUsage();
  const today = formatDate(new Date());
  
  if (!aiUsage.firstUsed) aiUsage.firstUsed = today;
  aiUsage.lastUsed = today;
  
  if (!aiUsage.dailyUsage[today]) {
    aiUsage.dailyUsage[today] = { chat: 0, api: 0, files: 0, tasks: 0 };
  }
  
  switch (event) {
    case 'chat':
      aiUsage.chatMessagesSent++;
      aiUsage.dailyUsage[today].chat++;
      break;
    case 'command':
      aiUsage.commandPaletteCalls++;
      break;
    case 'api':
      aiUsage.totalAPICalls++;
      aiUsage.dailyUsage[today].api++;
      break;
    case 'file':
      aiUsage.filesUploaded++;
      aiUsage.dailyUsage[today].files++;
      break;
    case 'task':
      aiUsage.tasksCreatedByAI++;
      aiUsage.dailyUsage[today].tasks++;
      break;
  }
  
  saveAIUsage();
}

function renderAIUsage() {
  if (!dom.settingsAIUsage || !aiUsage) return;
  if (aiUsage.totalAPICalls === 0 && aiUsage.chatMessagesSent === 0) {
    dom.settingsAIUsage.innerHTML = `<div class="ai-usage-empty">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <rect x="4" y="5" width="16" height="14" rx="4"/><path d="M12 5V3"/><circle cx="12" cy="3" r="1.5"/><circle cx="9" cy="10" r="1" fill="currentColor"/><circle cx="15" cy="10" r="1" fill="currentColor"/><path d="M8 14a4 4 0 007 0"/>
      </svg>
      <span>No AI usage yet. Start a chat or use the command palette!</span>
    </div>`;
    return;
  }
  const today = formatDate(new Date());
  const todayUsage = aiUsage.dailyUsage[today] || { chat: 0, api: 0, files: 0, tasks: 0 };
  const totalDays = Object.keys(aiUsage.dailyUsage).length;
  const avgPerDay = totalDays > 0 ? Math.round(aiUsage.totalAPICalls / totalDays) : 0;
  dom.settingsAIUsage.innerHTML = `
    <div class="ai-usage-grid">
      <div class="ai-usage-stat"><span class="val">${aiUsage.chatMessagesSent}</span><span class="lbl">Chats</span></div>
      <div class="ai-usage-stat"><span class="val">${aiUsage.totalAPICalls}</span><span class="lbl">API Calls</span></div>
      <div class="ai-usage-stat"><span class="val">${totalDays}</span><span class="lbl">Days Used</span></div>
      <div class="ai-usage-stat"><span class="val">${avgPerDay}</span><span class="lbl">Avg/Day</span></div>
    </div>
    <div class="ai-usage-today">
      <strong>Today</strong>
      <span>${todayUsage.chat} chats · ${todayUsage.api} API calls${todayUsage.tasks > 0 ? ` · ${todayUsage.tasks} tasks created` : ''}${todayUsage.files > 0 ? ` · ${todayUsage.files} files` : ''}</span>
    </div>
    ${aiUsage.firstUsed ? `<div class="ai-usage-footer">First used <strong>${escapeHtml(aiUsage.firstUsed)}</strong>${aiUsage.lastUsed !== aiUsage.firstUsed ? ` · Last used <strong>${escapeHtml(aiUsage.lastUsed)}</strong>` : ''}</div>` : ''}`;
}


// ─── DATA EXPORT/IMPORT ────────────────────────────────────
function exportData() {
  const sleepLogs = loadSleepLogs();
  const data = JSON.stringify({ tasks: state.tasks, sleepLogs: sleepLogs, version: 1 }, null, 2);
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `haven-schedule-backup-${formatDate(new Date())}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function importData(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (ev) => {
    try {
      const data = JSON.parse(ev.target.result);
      if (!data.tasks || !Array.isArray(data.tasks)) {
        alert('Invalid backup file: missing tasks array.');
        return;
      }
      state.tasks = data.tasks;
      if (data.sleepLogs && Array.isArray(data.sleepLogs)) {
        saveSleepLogs(data.sleepLogs);
      }
      saveState();
      dom.importFileInput.value = '';
      if (typeof pageAfterImport === 'function') pageAfterImport();
    } catch (err) {
      alert('Invalid backup file: ' + err.message);
    }
  };
  reader.readAsText(file);
}

// ─── HELP MODAL ────────────────────────────────────────────
function showHelpModal() {
  if (!dom.helpModal) return;
  populateShortcuts();
  dom.helpModal.classList.remove('hidden');
  dom.helpOverlay.classList.remove('hidden');
  requestAnimationFrame(() => {
    dom.helpOverlay.classList.add('active');
    dom.helpModal.classList.add('active');
  });
  state.helpModalOpen = true;
}

function hideHelpModal() {
  if (!dom.helpModal) return;
  dom.helpOverlay.classList.remove('active');
  dom.helpModal.classList.remove('active');
  setTimeout(() => {
    dom.helpModal.classList.add('hidden');
    dom.helpOverlay.classList.add('hidden');
  }, 200);
  state.helpModalOpen = false;
}

// ─── HELP SHORTCUTS POPULATOR ────────────────────────────
function populateShortcuts() {
  const grid = document.getElementById('helpShortcutsGrid');
  if (!grid) return;
  const mk = (k, d) => `<div class="shortcut-row"><kbd class="shortcut-key">${k}</kbd><span class="shortcut-desc">${d}</span></div>`;
  grid.innerHTML = [
    mk(shortcutDisplay('K'), 'Open command palette'),
    mk(shortcutDisplay('I'), 'Open AI Assistant'),
    mk('?', 'Toggle this help panel'),
    mk('Q', 'Quick new task'),
    mk('T', 'Toggle dark/light theme'),
    mk('F', 'Toggle focus mode'),
    mk('Esc', 'Close any open modal'),
  ].join('');
}

// ─── SETTINGS DRAWER ───────────────────────────────────────
function updateModelOptions() {
  if (!dom.settingsModel || !dom.settingsProvider) return;
  const provider = dom.settingsProvider.value;
  const models = PROVIDER_MODELS[provider] || PROVIDER_MODELS.groq;
  dom.settingsModel.innerHTML = models.map(m => `<option value="${m.value}">${m.label}</option>`).join('');
  if (!models.find(m => m.value === state.apiModel)) {
    state.apiModel = models[0].value;
  }
  dom.settingsModel.value = state.apiModel;
  const link = PROVIDER_LINKS[provider] || PROVIDER_LINKS.groq;
  const helpEl = dom.settingsApiKey?.closest('.form-group')?.querySelector('.form-help');
  if (helpEl) {
    helpEl.innerHTML = `Get a free key at <a href="${link.url}" target="_blank" class="form-link">${link.text}</a>.`;
  }
  if (dom.settingsApiKey) {
    dom.settingsApiKey.placeholder = provider === 'gemini' ? 'Enter your Gemini API key (AIza...)' : 'Enter your Groq API key';
  }
  const label = PROVIDER_LABELS[provider] || 'API';
  const statusText = dom.settingsKeyStatusText;
  if (statusText && state.apiKey) {
    statusText.textContent = `${label} key saved and active`;
  } else if (statusText) {
    statusText.textContent = `No ${label.toLowerCase()} API key configured`;
  }
}

function updateSettingsKeyStatus() {
  if (!dom.settingsKeyStatus) return;
  const hasKey = state.apiKey && state.apiKey.length > 0;
  const provider = dom.settingsProvider?.value || state.apiProvider || 'groq';
  const label = PROVIDER_LABELS[provider] || 'API';
  dom.settingsKeyStatus.className = 'settings-key-status ' + (hasKey ? 'active' : 'inactive');
  dom.settingsKeyStatusText.textContent = hasKey ? `${label} key saved and active` : `No ${label.toLowerCase()} API key configured`;
}

function renderCardColorsInSettings() {
  const container = document.getElementById('settingsCardColors');
  if (!container) return;
  let html = '<div class="cc-swatch-grid">';
  for (const tag of TAG_ORDER) {
    const c = cardColors[tag] || DEFAULT_TAG_COLORS[tag];
    const accent = c.light;
    html += `<div class="cc-swatch-item" data-tag="${tag}">
      <div class="cc-mini-card" style="--cc-accent:${accent}">
        <div class="cc-mini-border"></div>
        <div class="cc-mini-body">
          <div class="cc-mini-title">${TAG_LABELS[tag] || tag}</div>
          <div class="cc-mini-badge">${tag}</div>
        </div>
      </div>
      <span class="cc-swatch-dot" style="background:${accent}"></span>
    </div>`;
  }
  html += '</div>';
  container.innerHTML = html;
  container.querySelectorAll('.cc-swatch-item').forEach(el => {
    el.addEventListener('click', () => {
      const tag = el.dataset.tag;
      const curColor = cardColors[tag]?.light || DEFAULT_TAG_COLORS[tag].light;
      openCardColorPicker(el, tag, curColor, () => {
        renderCardColorsInSettings();
        if (typeof renderCalendar === 'function') renderCalendar();
        if (typeof renderTags === 'function') renderTags();
      });
    });
  });
}

// ─── IMAGE MANAGER (Settings Drawer) ────────────────────────
const IMAGE_MANAGER_GROUPS = [
  {
    label: 'Hub',
    ids: ['hub-hero', 'hub-ceramic', 'hub-tulips', 'hub-desk-water', 'hub-lamp', 'hub-skyline', 'hub-bedroom']
  },
  {
    label: 'Weekly',
    ids: ['weekly-coffee', 'weekly-journal']
  },
  {
    label: 'Schedule',
    ids: ['schedule-hero', 'schedule-coffee']
  },
  {
    label: 'Activities',
    ids: ['activities-hero', 'activities-desk']
  },
  {
    label: 'Tags',
    ids: ['tags-hero', 'tags-studio']
  },
  {
    label: 'Analytics',
    ids: ['analytics-hero', 'analytics-data']
  },
  {
    label: 'Goals',
    ids: ['goals-hero', 'goals-ceramic', 'goals-tulips', 'goals-book', 'goals-studio']
  },
  {
    label: 'Finance',
    ids: ['finance-hero', 'finance-ceramic']
  },
  {
    label: 'Brain',
    ids: ['brain-linen', 'brain-desk-light']
  },
  {
    label: 'Canvas',
    ids: ['hub-image-1', 'hub-image-2', 'hub-image-3', 'hub-image-4', 'hub-image-5',
           'hub-image-6', 'hub-image-7', 'hub-image-8', 'hub-image-9', 'hub-image-10']
  }
];

function renderImageManagerInSettings() {
  const container = document.getElementById('settingsImageManager');
  if (!container) return;

  if (!state.images) loadImages();

  // Count custom images
  var _customCount = 0;
  var _allImageIds = [];
  for (var _g = 0; _g < IMAGE_MANAGER_GROUPS.length; _g++) {
    var _group = IMAGE_MANAGER_GROUPS[_g];
    for (var _i = 0; _i < _group.ids.length; _i++) {
      var _id = _group.ids[_i];
      _allImageIds.push(_id);
      var _url = getImage(_id);
      if (_url && _url !== DEFAULT_IMAGES[_id]) _customCount++;
    }
  }

  var _html = '';

  // Header bar with count + reset all button
  _html += '<div class="img-mgr-header">';
  _html += '<span class="img-mgr-count">' + _customCount + ' custom / ' + _allImageIds.length + ' total</span>';
  if (_customCount > 0) {
    _html += '<button type="button" class="img-mgr-reset-all drawer-btn" onclick="handleImageManagerResetAll()">Reset All</button>';
  }
  _html += '</div>';

  // Grouped grid
  _html += '<div class="img-mgr-groups">';
  for (var _g = 0; _g < IMAGE_MANAGER_GROUPS.length; _g++) {
    var _group = IMAGE_MANAGER_GROUPS[_g];
    _html += '<div class="img-mgr-group">';
    _html += '<div class="img-mgr-group-label">' + _group.label + '</div>';
    _html += '<div class="img-mgr-grid" data-group="' + _group.label + '">';

    for (var _i = 0; _i < _group.ids.length; _i++) {
      var _id = _group.ids[_i];
      var _label = imageLabel(_id);
      var _url = getImage(_id);
      var _isCustom = _url && _url !== DEFAULT_IMAGES[_id];
      var _shortUrl = _url ? (_url.length > 50 ? _url.slice(0, 47) + '...' : _url) : '';

      _html += '<div class="img-mgr-item' + (_isCustom ? ' custom' : '') + '" data-image-id="' + _id + '" title="Click to customize ' + _label + '">';
      _html += '<div class="img-mgr-preview">';
      if (_url) {
        _html += '<img src="' + escapeHtml(_url) + '" alt="" loading="lazy" data-image-id="' + _id + '" onerror="this.style.display=\'none\';this.nextElementSibling.style.display=\'flex\'">';
        _html += '<div class="img-mgr-preview-fallback" style="display:none">';
        _html += '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>';
        _html += '</div>';
      } else {
        _html += '<div class="img-mgr-preview-fallback">';
        _html += '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>';
        _html += '</div>';
      }
      _html += '</div>';
      _html += '<div class="img-mgr-info">';
      _html += '<div class="img-mgr-name">' + _label + '</div>';
      _html += '<div class="img-mgr-meta">';
      if (_isCustom) {
        _html += '<span class="img-mgr-badge custom-badge">Custom</span>';
      } else {
        _html += '<span class="img-mgr-badge default-badge">Default</span>';
      }
      _html += '</div>';
      _html += '</div>';
      if (_isCustom) {
        _html += '<button type="button" class="img-mgr-reset-btn" title="Reset to default" onclick="handleImageManagerReset(\'' + _id + '\')">';
        _html += '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 102.13-9.36L1 10"/></svg>';
        _html += '</button>';
      }
      _html += '</div>';
    }

    _html += '</div>';
    _html += '</div>';
  }
  _html += '</div>';

  container.innerHTML = _html;

  // Wire click on image manager items to open the image picker
  container.querySelectorAll('.img-mgr-item').forEach(function(item) {
    item.addEventListener('click', function(e) {
      // Don't open picker if clicking the reset button
      if (e.target.closest('.img-mgr-reset-btn')) return;
      var id2 = this.dataset.imageId;
      if (id2) openImagePicker(id2);
    });
  });
}

function handleImageManagerReset(id) {
  resetImage(id);
  renderImageManagerInSettings();
  showToast('Reset ' + imageLabel(id) + ' to default', 'info');
}

function handleImageManagerResetAll() {
  if (!state.images) loadImages();
  var _count = 0;
  for (var _g = 0; _g < IMAGE_MANAGER_GROUPS.length; _g++) {
    var _group = IMAGE_MANAGER_GROUPS[_g];
    for (var _i = 0; _i < _group.ids.length; _i++) {
      var _id = _group.ids[_i];
      var _url = getImage(_id);
      if (_url && _url !== DEFAULT_IMAGES[_id]) {
        resetImage(_id);
        _count++;
      }
    }
  }
  renderImageManagerInSettings();
  showToast('Reset ' + _count + ' custom images to default', 'info');
}

function openSettingsDrawer() {
  dom.settingsApiKey = document.getElementById('drawerApiKey');
  dom.settingsProvider = document.getElementById('drawerProvider');
  dom.settingsModel = document.getElementById('drawerModel');
  dom.settingsRoutine = document.getElementById('drawerRoutine');
  dom.settingsKeyStatus = document.getElementById('drawerKeyStatus');
  dom.settingsKeyStatusText = document.getElementById('drawerKeyStatusText');
  dom.settingsClearBtn = document.getElementById('drawerClearBtn');
  dom.settingsAIUsage = document.getElementById('drawerAIUsage');
  const drawer = document.getElementById('settingsDrawer');
  const overlay = document.getElementById('settingsDrawerOverlay');
  if (!drawer || !overlay) return;
  if (dom.settingsApiKey) dom.settingsApiKey.value = state.apiKey || '';
  if (dom.settingsProvider) dom.settingsProvider.value = state.apiProvider || 'groq';
  if (dom.settingsRoutine) dom.settingsRoutine.value = loadRoutine();
  try { updateModelOptions(); } catch (e) { console.warn('drawer: updateModelOptions', e); }
  try { updateSettingsKeyStatus(); } catch (e) { console.warn('drawer: updateSettingsKeyStatus', e); }
  try { loadAIUsage(); } catch (e) { console.warn('drawer: loadAIUsage', e); }
  try { renderAIUsage(); } catch (e) { console.warn('drawer: renderAIUsage', e); }
  try { renderCardColorsInSettings(); } catch (e) { console.warn('drawer: renderCardColorsInSettings', e); }
  try { renderImageManagerInSettings(); } catch (e) { console.warn('drawer: renderImageManagerInSettings', e); }
  try { renderBubbleConfigInSettings(); } catch (e) { console.warn('drawer: renderBubbleConfigInSettings', e); }
  try { renderChickBotProfileInSettings(); } catch (e) { console.warn('drawer: renderChickBotProfileInSettings', e); }
  overlay.classList.remove('hidden');
  drawer.classList.remove('hidden');
  requestAnimationFrame(() => {
    overlay.classList.add('active');
    drawer.classList.add('open');
  });
  state.settingsDrawerOpen = true;
}

function closeSettingsDrawer() {
  const drawer = document.getElementById('settingsDrawer');
  const overlay = document.getElementById('settingsDrawerOverlay');
  if (!drawer || !overlay) return;
  overlay.classList.remove('active');
  drawer.classList.remove('open');
  setTimeout(() => {
    drawer.classList.add('hidden');
    overlay.classList.add('hidden');
  }, 300);
  state.settingsDrawerOpen = false;
}

function handleSettingsSubmit(e) {
  e.preventDefault();
  const key = dom.settingsApiKey?.value?.trim() || '';
  const provider = dom.settingsProvider?.value || 'groq';
  const model = dom.settingsModel?.value || PROVIDER_MODELS[provider]?.[0]?.value || '';
  const routine = dom.settingsRoutine?.value?.trim() || '';
  state.apiKey = key;
  state.apiProvider = provider;
  state.apiModel = model;
  try { localStorage.setItem(API_KEY_STORAGE, key); } catch (e) { /* ignore */ }
  saveApiProvider(provider);
  try { localStorage.setItem('haven-schedule-model', model); } catch (e) { /* ignore */ }
  saveRoutine(routine);
  // Save ChickBot profile from settings
  const cbName = document.getElementById('cb-name-settings')?.value?.trim();
  if (cbName) {
    saveChickBotProfile({
      name: cbName,
      pronouns: document.getElementById('cb-pronouns-settings')?.value?.trim() || '',
      occupation: document.getElementById('cb-occupation-settings')?.value?.trim() || '',
      goals: document.getElementById('cb-goals-settings')?.value?.trim() || '',
      routines: document.getElementById('cb-routines-settings')?.value?.trim() || '',
      preferences: document.getElementById('cb-preferences-settings')?.value?.trim() || ''
    });
  }
  updateSettingsKeyStatus();
  // Save bubble config from settings form
  const bubbleConfig = {};
  document.querySelectorAll('[data-bubble-config]').forEach(el => {
    const key = el.dataset.bubbleConfig;
    const visibleEl = document.getElementById(`bubble-visible-${key}`);
    const labelEl = document.getElementById(`bubble-label-${key}`);
    const colorEl = document.getElementById(`bubble-color-${key}`);
    if (!visibleEl && !labelEl && !colorEl) return;
    const overrides = {};
    if (visibleEl) overrides.visible = visibleEl.checked;
    if (labelEl) overrides.label = labelEl.value.trim() || DEFAULT_BUBBLES[key]?.label || key;
    if (colorEl) overrides.color = colorEl.value;
    if (Object.keys(overrides).length) bubbleConfig[key] = overrides;
  });
  state.accessBubbles = bubbleConfig;
  // Persist custom images to individual haven-image-* keys (single source of truth)
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify({ showWeekends: state.showWeekends, showCompleted: state.showCompleted, darkMode: state.darkMode, accessBubbles: state.accessBubbles }));
  } catch (e) {}
  if (state.images) {
    for (var _sk of Object.keys(state.images)) {
      if (state.images[_sk] && isCustomImage(_sk, state.images[_sk])) {
        try { localStorage.setItem('haven-image-' + _sk, state.images[_sk]); } catch(e) { /* skip */ }
      }
    }
  }
  applyAccessHubConfig();
  showToast('Settings saved', 'success');
  closeSettingsDrawer();
}

function handleSettingsClear() {
  state.apiKey = '';
  state.apiProvider = 'groq';
  state.apiModel = 'llama-3.3-70b-versatile';
  try { localStorage.removeItem(API_KEY_STORAGE); } catch (e) { /* ignore */ }
  try { localStorage.removeItem('haven-schedule-provider'); } catch (e) { /* ignore */ }
  try { localStorage.removeItem('haven-schedule-model'); } catch (e) { /* ignore */ }
  if (dom.settingsApiKey) dom.settingsApiKey.value = '';
  updateSettingsKeyStatus();
  showToast('API key cleared', 'info');
}

// ─── EDIT MODE ──────────────────────────────────────────────
function ensureEditModeIndicator() {
  let indicator = document.getElementById('editModeIndicator');
  if (indicator) return indicator;
  indicator = document.createElement('div');
  indicator.id = 'editModeIndicator';
  indicator.className = 'hidden';
  indicator.innerHTML = `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
      <path d="m15 5 4 4"/>
    </svg>
    <span>Edit Mode — tap any image to change</span>
    <button class="em-close" title="Exit edit mode">✕</button>
  `;
  document.body.appendChild(indicator);
  // Close button handler
  indicator.querySelector('.em-close').addEventListener('click', function(e) {
    e.stopPropagation();
    if (state.editMode) toggleEditMode();
  });
  return indicator;
}

function toggleEditMode() {
  state.editMode = !state.editMode;
  document.documentElement.classList.toggle('edit-mode', state.editMode);
  
  // Toggle floating indicator
  const indicator = ensureEditModeIndicator();
  if (state.editMode) {
    indicator.classList.remove('hidden');
    requestAnimationFrame(() => indicator.classList.add('active'));
  } else {
    indicator.classList.remove('active');
    setTimeout(() => indicator.classList.add('hidden'), 300);
  }
  
  if (state.editMode) {
    showToast('🖊️ Edit mode ON — tap any image to customize', 'info', 2500);
  } else {
    showToast('Edit mode OFF', 'info', 1500);
  }

  updateSectionHandles();

  // Notify other pages (e.g. goals page) about edit mode change
  document.dispatchEvent(new CustomEvent('editModeChange'));
}

// ─── SIDEBAR EDIT MODE ──────────────────────────────────────
const SIDEBAR_CONFIG_KEY = 'haven-sidebar-config';

let sidebarEditMode = false;

function loadSidebarConfig() {
  try {
    const raw = localStorage.getItem(SIDEBAR_CONFIG_KEY);
    return raw ? JSON.parse(raw) : { order: [], visibility: {}, customLinks: [] };
  } catch { return { order: [], visibility: {}, customLinks: [] }; }
}

function saveSidebarConfig(config) {
  try { localStorage.setItem(SIDEBAR_CONFIG_KEY, JSON.stringify(config)); } catch {}
}

function applySidebarConfig() {
  const stagger = document.querySelector('.hub-snav-stagger');
  if (!stagger) return;
  const config = loadSidebarConfig();

  // Apply saved order — reorder the nav items
  if (config.order && config.order.length > 0) {
    const items = stagger.querySelectorAll('.hub-snav-item');
    const itemMap = {};
    items.forEach(item => {
      const href = item.getAttribute('href');
      if (href) itemMap[href] = item;
    });
    // Reorder based on saved order (only for items that exist in both)
    for (const href of config.order) {
      const item = itemMap[href];
      if (item) stagger.appendChild(item);
    }
  }

  // Apply saved visibility (true = hidden)
  if (config.visibility) {
    const items = stagger.querySelectorAll('.hub-snav-item');
    items.forEach(item => {
      const href = item.getAttribute('href');
      if (href && config.visibility[href] === true) {
        item.style.display = 'none';
      }
    });
  }

  // Inject custom links at the end
  if (config.customLinks && config.customLinks.length > 0) {
    config.customLinks.forEach(link => {
      const existing = stagger.querySelector(`.hub-snav-item[href="${escapeHtml(link.url)}"]`);
      if (!existing) {
        const a = document.createElement('a');
        a.href = link.url;
        a.className = 'hub-snav-item hub-snav-custom';
        a.innerHTML = `<span class="snav-icon">${link.icon || '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg>'}</span><span class="snav-label">${escapeHtml(link.label)}</span>`;
        stagger.appendChild(a);
      }
    });
  }

  // Re-mark the active page
  const currentPage = location.pathname.split('/').pop() || 'index.html';
  stagger.querySelectorAll('.hub-snav-item').forEach(item => {
    item.classList.toggle('active', item.getAttribute('href') === currentPage);
  });
}

function toggleSidebarEditMode() {
  sidebarEditMode = !sidebarEditMode;
  document.documentElement.classList.toggle('sidebar-edit-mode', sidebarEditMode);
  const btn = document.getElementById('hubSidebarEditBtn');
  if (btn) btn.classList.toggle('active', sidebarEditMode);

  if (sidebarEditMode) {
    renderSidebarEditControls();
    showToast('✎ Sidebar edit ON — drag to reorder, click ● to hide', 'info', 2500);
  } else {
    removeSidebarEditControls();
    showToast('Sidebar edit OFF', 'info', 1500);
  }
}

function renderSidebarEditControls() {
  const stagger = document.querySelector('.hub-snav-stagger');
  if (!stagger) return;

  // Remove any existing edit controls first
  removeSidebarEditControls();

  // Add drag handle + hide toggle to each nav item (except custom links)
  stagger.querySelectorAll('.hub-snav-item').forEach(item => {
    // Drag handle
    const handle = document.createElement('span');
    handle.className = 'snav-drag-handle';
    handle.innerHTML = '⠿';
    handle.draggable = true;
    handle.title = 'Drag to reorder';
    item.prepend(handle);

    // Hide toggle
    const hideBtn = document.createElement('button');
    hideBtn.className = 'snav-hide-btn';
    const href = item.getAttribute('href');
    const config = loadSidebarConfig();
    const isHidden = config.visibility && config.visibility[href] === true;
    hideBtn.innerHTML = isHidden ? '○' : '●';
    hideBtn.title = isHidden ? 'Show in sidebar' : 'Hide from sidebar';
    item.appendChild(hideBtn);

    // If hidden, dim it
    if (isHidden) {
      item.style.display = '';
      item.style.opacity = '0.35';
    }
  });

  // Add "Add link" button at the bottom of nav
  const addBtn = document.createElement('button');
  addBtn.className = 'snav-add-link-btn';
  addBtn.innerHTML = '+ Add link';
  addBtn.addEventListener('click', showAddLinkPopup);
  stagger.appendChild(addBtn);

  // Setup drag events
  setupSidebarDrag();
}

function removeSidebarEditControls() {
  document.querySelectorAll('.snav-drag-handle, .snav-hide-btn, .snav-add-link-btn').forEach(el => el.remove());
  // Reset opacity on hidden items
  document.querySelectorAll('.hub-snav-item').forEach(item => {
    item.style.opacity = '';
  });
}

let sidebarDragSrc = null;

function setupSidebarDrag() {
  const handles = document.querySelectorAll('.snav-drag-handle');
  handles.forEach(handle => {
    handle.addEventListener('dragstart', function(e) {
      sidebarDragSrc = this.closest('.hub-snav-item');
      e.dataTransfer.effectAllowed = 'move';
      sidebarDragSrc.classList.add('snav-dragging');
    });
    handle.addEventListener('dragend', function() {
      sidebarDragSrc?.classList.remove('snav-dragging');
      sidebarDragSrc = null;
      document.querySelectorAll('.snav-drag-over').forEach(el => el.classList.remove('snav-drag-over'));
    });
  });

  const items = document.querySelectorAll('.hub-snav-item');
  items.forEach(item => {
    item.addEventListener('dragover', function(e) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
    });
    item.addEventListener('dragenter', function(e) {
      e.preventDefault();
      if (this !== sidebarDragSrc) this.classList.add('snav-drag-over');
    });
    item.addEventListener('dragleave', function() {
      this.classList.remove('snav-drag-over');
    });
    item.addEventListener('drop', function(e) {
      e.preventDefault();
      this.classList.remove('snav-drag-over');
      if (!sidebarDragSrc || this === sidebarDragSrc) return;
      const stagger = this.closest('.hub-snav-stagger');
      if (!stagger) return;
      stagger.insertBefore(sidebarDragSrc, this);
      persistSidebarOrder();
    });
  });
}

function persistSidebarOrder() {
  const stagger = document.querySelector('.hub-snav-stagger');
  if (!stagger) return;
  const config = loadSidebarConfig();
  config.order = [];
  stagger.querySelectorAll('.hub-snav-item').forEach(item => {
    const href = item.getAttribute('href');
    if (href) config.order.push(href);
  });
  saveSidebarConfig(config);
}

function showAddLinkPopup() {
  const existing = document.querySelector('.snav-add-popup');
  if (existing) { existing.remove(); return; }

  const popup = document.createElement('div');
  popup.className = 'hub-edit-popup snav-add-popup';
  popup.innerHTML = `
    <div style="font-size:0.72rem;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;color:var(--text-tertiary);margin-bottom:10px">Add Shortcut</div>
    <input type="text" id="snavLinkLabel" placeholder="Label (e.g. Journal)" autofocus>
    <input type="text" id="snavLinkUrl" placeholder="URL or path (e.g. journal.html)">
    <div class="hub-edit-popup-actions">
      <button class="cancel" id="snavLinkCancel">Cancel</button>
      <button class="primary" id="snavLinkSave">Add</button>
    </div>
  `;
  document.body.appendChild(popup);

  const addBtn = document.querySelector('.snav-add-link-btn');
  if (addBtn) {
    const rect = addBtn.getBoundingClientRect();
    popup.style.top = Math.min(rect.bottom + 4, window.innerHeight - 160) + 'px';
    popup.style.left = Math.max(8, Math.min(rect.left + rect.width / 2 - 120, window.innerWidth - 248)) + 'px';
  }

  document.getElementById('snavLinkCancel').addEventListener('click', () => popup.remove());
  document.getElementById('snavLinkSave').addEventListener('click', function() {
    const label = document.getElementById('snavLinkLabel').value.trim();
    const url = document.getElementById('snavLinkUrl').value.trim();
    if (!label || !url) { showToast('Enter both a label and URL', 'warning'); return; }
    const config = loadSidebarConfig();
    if (!config.customLinks) config.customLinks = [];
    config.customLinks.push({ label, url });
    saveSidebarConfig(config);
    popup.remove();
    applySidebarConfig();
    if (sidebarEditMode) renderSidebarEditControls();
    showToast(`Added ${escapeHtml(label)}`, 'success');
  });

  function onKey(e) { if (e.key === 'Escape') popup.remove(); }
  document.addEventListener('keydown', onKey);
  popup._onKey = onKey;
}

// Delegated click: handle hide buttons in sidebar edit mode
document.addEventListener('click', function(e) {
  const hideBtn = e.target.closest('.snav-hide-btn');
  if (!hideBtn) return;
  const item = hideBtn.closest('.hub-snav-item');
  if (!item) return;
  const href = item.getAttribute('href');
  const config = loadSidebarConfig();
  if (!config.visibility) config.visibility = {};
  const isHidden = config.visibility[href] === true;
  config.visibility[href] = !isHidden;
  saveSidebarConfig(config);
  if (isHidden) {
    item.style.opacity = '';
    hideBtn.innerHTML = '●';
    hideBtn.title = 'Hide from sidebar';
  } else {
    item.style.opacity = '0.35';
    hideBtn.innerHTML = '○';
    hideBtn.title = 'Show in sidebar';
  }
});

function updateSectionHandles() {
  const handles = document.querySelectorAll('.hub-section-drag-handle');
  if (!handles.length) return;
  const isEdit = state.editMode;
  handles.forEach(h => {
    h.classList.toggle('hub-section-drag-handle-visible', isEdit);
  });
}



// Delegated click: sidebar buttons + edit mode image picker
document.addEventListener('click', function(e) {
  const sidebarEditBtn = e.target.closest('#hubSidebarEditBtn');
  if (sidebarEditBtn) { toggleSidebarEditMode(); return; }
  const visualsBtn = e.target.closest('#bcVisualsBtn');
  if (visualsBtn) { toggleEditMode(); return; }
  const settingsBtn = e.target.closest('.hamburger-settings-btn');
  if (settingsBtn) { openSettingsDrawer(); return; }

  // Hamburger opens settings drawer
  const hamburger = e.target.closest('.hub-hamburger');
  if (hamburger) { openSettingsDrawer(); return; }

  // Overlay click closes sidebar
  const overlayEl = e.target.closest('.hub-sidebar-overlay');
  if (overlayEl) {
    const layout = overlayEl.closest('.hub-layout');
    if (!layout) return;
    const sidebar = layout.querySelector('.hub-sidebar');
    if (!sidebar) return;
    sidebar.classList.remove('open');
    overlayEl.classList.remove('active');
    return;
  }

  // Nav item click closes sidebar on mobile
  const navItem = e.target.closest('.hub-snav-item');
  if (navItem && window.innerWidth <= 768) {
    const sidebar = navItem.closest('.hub-sidebar');
    if (!sidebar) return;
    const layout = sidebar.closest('.hub-layout');
    if (!layout) return;
    sidebar.classList.remove('open');
    layout.querySelector('.hub-sidebar-overlay')?.classList.remove('active');
  }

  if (!state.editMode) return;
  if (document.documentElement.classList.contains('hub-edit')) return;
  let img = e.target.closest('img[data-image-id]');
  // If click is on an overlay sibling (e.g. gradient div), check parent for hero img
  if (!img && e.target.parentElement) {
    img = e.target.parentElement.querySelector('img[data-image-id]');
  }
  if (!img) return;
  openImagePicker(img.dataset.imageId);
});

// ─── TASK MODAL ────────────────────────────────────────────
function selectTagPill(tag) {
  document.querySelectorAll('.tf-tag').forEach(b => b.classList.remove('active'));
  const pill = document.querySelector(`.tf-tag[data-tag="${tag}"]`);
  if (pill) pill.classList.add('active');
  if (dom.taskTag) dom.taskTag.value = tag;
  const meta = TAG_COLORS[tag] || TAG_COLORS.meeting;
  const icon = document.getElementById('taskModalIcon');
  if (icon) icon.style.color = meta.text;
}

function openNewTaskModal(date, startMins) {
  if (!dom.taskForm) return;
  state.editingTask = null;
  state._selectedPriority = 3;
  const sr = roundToNearest(startMins, SNAP_MINUTES);
  dom.taskModalTitle.textContent = 'New Task';
  dom.taskTitle.value = '';
  dom.taskTitle.dispatchEvent(new Event('input'));
  dom.taskDate.value = date || formatDate(new Date());
  dom.taskStart.value = toTimeStr(sr);
  dom.taskEnd.value = toTimeStr(sr + 60);
  selectTagPill('meeting');
  dom.taskNotes.value = '';
  if (dom.taskRepeat) dom.taskRepeat.value = 'none';
  if (dom.taskReminder) dom.taskReminder.value = '0';
  dom.taskDeleteBtn.classList.add('hidden');
  document.getElementById('taskModalId').textContent = '';
  updatePriorityUI();
  showTaskModal();
}

function openTaskModal(id) {
  if (!dom.taskForm) return;
  const task = getTask(id);
  if (!task) return;
  state.editingTask = id;
  state._selectedPriority = task.priority || 3;
  dom.taskModalTitle.textContent = 'Edit Task';
  dom.taskTitle.value = task.title;
  dom.taskTitle.dispatchEvent(new Event('input'));
  dom.taskDate.value = task.date || formatDate(new Date());
  dom.taskStart.value = task.startTime;
  dom.taskEnd.value = task.endTime;
  selectTagPill(task.tag);
  dom.taskNotes.value = task.notes || '';
  if (dom.taskRepeat) dom.taskRepeat.value = task.repeat ? task.repeat.type : 'none';
  if (dom.taskReminder) dom.taskReminder.value = String(task.reminder || '0');
  dom.taskDeleteBtn.classList.remove('hidden');
  document.getElementById('taskModalId').textContent = `#${id.slice(0, 6)}`;
  updatePriorityUI();
  showTaskModal();
}

function updatePriorityUI() {
  const group = document.getElementById('prioritySelectGroup');
  if (!group) return;
  group.querySelectorAll('.tf-pr').forEach(o => {
    o.classList.toggle('active', parseInt(o.dataset.priority) === (state._selectedPriority || 3));
  });
}

function showTaskModal() {
  if (!dom.taskForm) return;
  dom.taskModal.classList.remove('hidden');
  dom.taskOverlay.classList.remove('hidden');
  requestAnimationFrame(() => {
    dom.taskOverlay.classList.add('active');
    dom.taskModal.classList.add('active');
  });
  state.taskModalOpen = true;
  dom.taskTitle.focus();
}

function hideTaskModal() {
  if (!dom.taskForm) return;
  dom.taskOverlay.classList.remove('active');
  dom.taskModal.classList.remove('active');
  setTimeout(() => {
    dom.taskModal.classList.add('hidden');
    dom.taskOverlay.classList.add('hidden');
  }, 200);
  state.taskModalOpen = false;
  state.editingTask = null;
}

function handleTaskFormSubmit(e) {
  e.preventDefault();
  const activePill = document.querySelector('.tf-tag.active');
  const tag = activePill ? activePill.dataset.tag : 'meeting';
  const data = {
    title: dom.taskTitle.value.trim(),
    date: dom.taskDate.value,
    startTime: dom.taskStart.value,
    endTime: dom.taskEnd.value,
    tag: tag,
    notes: dom.taskNotes.value.trim(),
    priority: state._selectedPriority || 3,
  };
  if (dom.taskRepeat) {
    const val = dom.taskRepeat.value;
    data.repeat = val === 'none' ? null : { type: val, interval: 1, endAfter: null, endDate: null };
  }
  if (dom.taskReminder) {
    data.reminder = parseInt(dom.taskReminder.value) || 0;
  }
  if (!data.title) { dom.taskTitle.focus(); return; }
  if (state.editingTask) updateTask(state.editingTask, data);
  else { pushUndo(); createTask(data); }
  hideTaskModal();
  if (typeof pageAfterTaskSave === 'function') pageAfterTaskSave();
}

function handleTaskDelete() {
  if (!state.editingTask) return;
  deleteTask(state.editingTask);
  hideTaskModal();
  if (typeof pageAfterTaskSave === 'function') pageAfterTaskSave();
}

// ─── COMMAND PALETTE ───────────────────────────────────────
function toggleCmdPalette() {
  if (!dom.cmdInput) return;
  state.cmdPaletteOpen ? hideCmdPalette() : showCmdPalette();
}

function showCmdPalette() {
  if (!dom.cmdInput) return;
  dom.cmdPalette.classList.remove('hidden');
  dom.cmdOverlay.classList.remove('hidden');
  requestAnimationFrame(() => {
    dom.cmdOverlay.classList.add('active');
    dom.cmdPalette.classList.add('active');
  });
  state.cmdPaletteOpen = true;
  dom.cmdInput.value = '';
  dom.cmdResults.innerHTML = `
    <div class="cmd-hint">
      <div class="cmd-hint-grid">
        <div class="cmd-example"><span class="cmd-example-text">"Team standup tomorrow 9am 30m"</span></div>
        <div class="cmd-example"><span class="cmd-example-text">"Design review Friday 2pm 1hr"</span></div>
        <div class="cmd-example"><span class="cmd-example-text">"Find a 1hr gap for deep work today"</span></div>
      </div>
    </div>`;
  dom.cmdInput.focus();
}

function hideCmdPalette() {
  if (!dom.cmdInput) return;
  dom.cmdOverlay.classList.remove('active');
  dom.cmdPalette.classList.remove('active');
  setTimeout(() => {
    dom.cmdPalette.classList.add('hidden');
    dom.cmdOverlay.classList.add('hidden');
  }, 200);
  state.cmdPaletteOpen = false;
  state._lastCommandText = null;
}

function callAI(text) {
  if (state.apiProvider === 'gemini') return callGeminiAPI(text);
  return callGroqAPI(text);
}

function processCommand(text) {
  if (!dom.cmdInput) return;
  const trimmed = text.trim();
  if (!trimmed) return;
  const lastCmd = state._lastCommandText;
  if (lastCmd && lastCmd === trimmed) {
    showToast('This command was already submitted — try something different', 'info');
    return;
  }
  state._lastCommandText = trimmed;
  const isFindGap = /find|gap|open|free|slot|available/i.test(trimmed);
  dom.cmdResults.innerHTML = `<div class="cmd-loading"><div class="cmd-spinner"></div><span>${isFindGap ? 'Searching for open slots...' : 'Parsing your command...'}</span></div>`;

  if (state.apiKey && !isFindGap) {
    trackAIUsage('command');
    trackAIUsage('api');
    callAI(trimmed)
      .then(result => showCommandResult(result))
      .catch((err) => {
        const errMsg = err?.message || '';
        if (errMsg.includes('429') || errMsg.includes('Rate limited')) {
          const parsed = localParse(trimmed);
          if (parsed) { showCommandResult(parsed); return; }
          showCommandError('AI is rate limited. Try again later or use a simpler format.');
          return;
        }
        const parsed = localParse(trimmed);
        if (parsed) showCommandResult(parsed);
        else showCommandError('AI unavailable. Try a simpler format.');
      });
  } else if (isFindGap) {
    const gapResult = parseFindGap(trimmed);
    if (gapResult) showFindGapResult(gapResult);
    else showCommandError('Could not understand the request. Try: "Find a 1hr gap for deep work tomorrow"');
  } else {
    showCommandResult(localParse(trimmed));
  }
}

function buildTaskSummary() {
  const today = formatDate(new Date());
  const weekFromNow = addDays(new Date(today + 'T00:00:00'), 14);
  const weekEnd = formatDate(weekFromNow);
  const upcoming = state.tasks.filter(t => t.date && t.date >= today && t.date <= weekEnd && !t.completed && !isWhiteboardTask(t));
  if (upcoming.length === 0) return 'No tasks scheduled.';
  const byDate = {};
  for (const t of upcoming) {
    if (!byDate[t.date]) byDate[t.date] = [];
    byDate[t.date].push(t);
  }
  const lines = [];
  for (const [d, ts] of Object.entries(byDate).sort()) {
    const times = ts.map(t => `${t.startTime}–${t.endTime} ${t.title} (${TAG_LABELS[t.tag] || t.tag})`).join(', ');
    lines.push(`  ${d}: ${times}`);
  }
  return lines.join('\n');
}

function getTimeOfDay(hours) {
  if (hours < 6) return 'night';
  if (hours < 12) return 'morning';
  if (hours < 14) return 'lunch';
  if (hours < 17) return 'afternoon';
  if (hours < 22) return 'evening';
  return 'night';
}

const TAG_TIME_SUGGESTIONS = {
  'deep-work': { defaultStart: '09:00', defaultDuration: 120, times: 'morning (best focus), early afternoon', note: 'needs uninterrupted block, no meetings around it' },
  'exercise': { defaultStart: '17:00', defaultDuration: 60, times: 'morning before work, late afternoon/evening', note: 'avoid right after meals' },
  'meeting': { defaultStart: '14:00', defaultDuration: 30, times: 'afternoon, late morning', note: 'keep short, schedule between deep work blocks' },
  'study': { defaultStart: '19:00', defaultDuration: 60, times: 'evening, late afternoon', note: 'consistent daily time helps retention' },
  'hobby': { defaultStart: '20:00', defaultDuration: 60, times: 'evening, weekends', note: 'good as wind-down activity' },
};

function callGroqAPI(text) {
  const today = new Date();
  const todayStr = formatDate(today);
  const nowStr = `${String(today.getHours()).padStart(2,'0')}:${String(today.getMinutes()).padStart(2,'0')}`;
  const dayNames = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const taskSummary = buildTaskSummary();
  const learningContext = getLearningContext();
  const systemPrompt = `You are a smart calendar scheduling assistant. Today is ${todayStr} (${dayNames[today.getDay()]}). Current time: ${nowStr}.${learningContext}

CALENDAR GRID: The visible hours are ${toTimeStr(START_HOUR * 60)} – ${toTimeStr((START_HOUR + VISIBLE_HOURS) * 60)}. All times must snap to :00 or :30.

EXISTING TASKS (next 2 weeks):
${taskSummary || 'None'}

SMART SCHEDULING RULES — follow these strictly:
1. Choose a START TIME and END TIME that does NOT conflict with any existing task
2. Consider the time of day — different task types fit different times:
   - Deep work → best in morning (9-12), needs 2hr uninterrupted blocks
   - Exercise → morning (6-8) or late afternoon/evening (17-19)
   - Meetings → late morning or afternoon (10-11, 14-16), keep 30min default
   - Study → afternoon or evening, consistent schedule
   - Hobby → evening, weekends
3. Leave 15min buffer between consecutive tasks (don't back-to-back)
4. Don't schedule anything before 6am or after 11pm unless the user specifies
5. Prefer the user's established routine times from their typical schedule above
6. "Morning" = 6-12, "afternoon" = 12-17, "evening" = 17-21

TITLE QUALITY — make the task title specific and descriptive, not generic:
- Deep work: "Deep work: [concrete goal]" (e.g. "Deep work: Design system architecture")
- Exercise: "[specific activity]" (e.g. "Morning run 5k", "Gym: upper body", "Yoga flow")
- Meetings: "[purpose]" (e.g. "Team standup", "1:1 with Manager", "Sprint planning")
- Study: "Study [subject] — [topic]" (e.g. "Study Mandarin — lesson 12")
- Hobby: "[specific activity]" (e.g. "Read 'Atomic Habits'", "Practice guitar scales")
- NEVER use just the tag name as the title

Parse the user's request into a JSON object with these exact fields:
- title: string (event name)
- date: string (YYYY-MM-DD)
- startTime: string (HH:MM 24h)
- endTime: string (HH:MM 24h)
- tag: string ("meeting" | "deep-work" | "exercise" | "study" | "hobby")

Tag rules: "deep work"/"focus"/"heads down" = deep-work. "gym"/"workout"/"run"/"cardio"/"exercise" = exercise. "math"/"english"/"class"/"chemistry"/"physics"/"mandarin"/"study" = study. "design"/"movie"/"build"/"app"/"hobby" = hobby. Default tag = "meeting".
Default duration: 1 hour. Default time: 9 AM. "tomorrow" = next day. Day names = next occurrence. "morning" ≈ 9am, "afternoon" ≈ 2pm, "evening" ≈ 7pm.

Return ONLY valid JSON. No markdown, no code fences, no extra text.`;
  return fetchWithRetry('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${state.apiKey}`
    },
    body: JSON.stringify({
      model: state.apiModel,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: text }
      ],
      temperature: 0.1,
      max_tokens: 200,
      response_format: { type: 'json_object' }
    })
  }).then(async res => {
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new Error(`API error: ${res.status}${body ? ' — ' + body.slice(0, 200) : ''}`);
    }
    return res.json();
  }).then(data => {
    const raw = data?.choices?.[0]?.message?.content;
    if (!raw) throw new Error('Empty response');
    let p;
    try { p = JSON.parse(raw); } catch (e) {
      const m = raw.match(/\{[\s\S]*\}/);
      if (m) p = JSON.parse(m[0]);
      else throw new Error('Invalid JSON response');
    }
    if (!p.title || !p.date || !p.startTime || !p.endTime) throw new Error('Incomplete data');
    if (isNaN(new Date(p.date + 'T' + p.startTime).getTime())) throw new Error('Invalid date');
    return { title: p.title, date: p.date, startTime: p.startTime, endTime: p.endTime, tag: p.tag || 'meeting' };
  });
}

function localParse(text) {
  const today = new Date();
  let targetDate = new Date(today);
  const lower = text.toLowerCase();

  // Detect "this friday" = upcoming, "next friday" = 7+ days
  const nextMatch = lower.match(/\bnext\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/);
  const thisMatch = lower.match(/\bthis\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/);

  if (lower.includes('tomorrow')) {
    targetDate.setDate(targetDate.getDate() + 1);
  } else if (nextMatch) {
    const dayNames = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];
    const idx = dayNames.indexOf(nextMatch[1]);
    let diff = idx - targetDate.getDay();
    if (diff <= 0) diff += 7;
    targetDate.setDate(targetDate.getDate() + diff + 7);
  } else if (thisMatch) {
    const dayNames = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];
    const idx = dayNames.indexOf(thisMatch[1]);
    let diff = idx - targetDate.getDay();
    if (diff <= 0) diff += 7;
    targetDate.setDate(targetDate.getDate() + diff);
  } else if (lower.includes('today')) {
    // keep today
  } else {
    const dayNames = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];
    const dayAbbr = ['sun','mon','tue','wed','thu','fri','sat'];
    let found = -1;
    for (let i = 0; i < 7; i++) { if (lower.includes(dayNames[i]) || lower.includes(dayAbbr[i])) { found = i; break; } }
    if (found >= 0) { let diff = found - targetDate.getDay(); if (diff <= 0) diff += 7; targetDate.setDate(targetDate.getDate() + diff); }
  }
  const dateStr = formatDate(targetDate);

  // Extract title — strip date/time/duration keywords
  let title = text;
  const cleanRegex = /\b(at|from|until|to|for|this|next|on|by|after)\b/gi;
  const kwMatch = text.search(cleanRegex);
  if (kwMatch >= 0) title = text.slice(0, kwMatch).trim();
  title = title.replace(/\b(today|tomorrow|monday|tuesday|wednesday|thursday|friday|saturday|sunday|mon|tue|wed|thu|fri|sat|sun)\b/gi, '').trim();
  title = title.replace(/\b(morning|afternoon|evening|night|noon|midnight|midday|lunch)\b/gi, '').trim();
  title = title.replace(/\b(in\s+\d+\s+(hour|minute|min|mins|minutes|hours?))\b/gi, '').trim();
  title = title.replace(/\b(?:for\s+)?(?:half\s+an?\s+hour|\d+\s*hours?\s*(?:and\s+\d+\s*mins?)?|an?\s+hour(?:\s+and\s+a\s+half)?|an?\s+hour)\b/gi, '').trim();
  title = title.replace(/^["']|["']$/g, '').trim();
  title = title.charAt(0).toUpperCase() + title.slice(1);

  // Parse start time — support "noon", "midnight", "morning", "afternoon", "evening", "hh:mm am/pm", "hh am/pm"
  const timeRegex = /(\d{1,2})(?::(\d{2}))?\s*(am|pm|a\.m\.|p\.m\.)/gi;
  const times = [...text.matchAll(timeRegex)];
  let startH = 9, startM = 0;
  if (lower.includes('noon') || lower.includes('midday')) {
    startH = 12; startM = 0;
  } else if (lower.includes('midnight')) {
    startH = 0; startM = 0;
  } else if (lower.includes('morning') && !times.length) {
    startH = 9; startM = 0;
  } else if ((lower.includes('afternoon') || lower.includes('lunch')) && !times.length) {
    startH = 14; startM = 0;
  } else if (lower.includes('evening') && !times.length) {
    startH = 19; startM = 0;
  }
  if (times.length >= 1) {
    let h = parseInt(times[0][1]); const m = times[0][2] ? parseInt(times[0][2]) : 0;
    const mer = (times[0][3] || '').charAt(0).toLowerCase();
    if (mer === 'p' && h < 12) h += 12; if (mer === 'a' && h === 12) h = 0;
    startH = h; startM = m;
  }
  // Default end = start + 1h, will be overridden by duration or second time
  let endH = startH + 1, endM = startM;
  if (times.length >= 2) {
    let h = parseInt(times[1][1]); const m = times[1][2] ? parseInt(times[1][2]) : 0;
    const mer = (times[1][3] || '').charAt(0).toLowerCase();
    if (mer === 'p' && h < 12) h += 12; if (mer === 'a' && h === 12) h = 0;
    endH = h; endM = m;
  }

  // Duration — handle "for 90 minutes", "for 2 hours", "half an hour", "an hour and a half"
  const durTotalMinutes = text.match(/(?:for\s+)?(\d+)\s*(?:hours?|hrs?|h)\s*(?:and\s+)?(\d+)?\s*(?:mins?|minutes?)?/i);
  if (durTotalMinutes && !times[1]) {
    let totalMins = parseInt(durTotalMinutes[1]) * 60;
    if (durTotalMinutes[2]) totalMins += parseInt(durTotalMinutes[2]);
    const total = startH * 60 + startM + totalMins;
    endH = Math.floor(total / 60); endM = total % 60;
  } else {
    const durH = text.match(/(?:for\s+)?(\d+)\s*hours?/i);
    const durM = text.match(/(?:for\s+)?(\d+)\s*(mins?|minutes?|m)\b/i);
    if (durM) { const mins = parseInt(durM[1]); const total = startH * 60 + startM + mins; endH = Math.floor(total / 60); endM = total % 60; }
    else if (durH) { endH = startH + parseInt(durH[1]); endM = startM; }
    else if (lower.includes('half an hour') || lower.includes('30 minutes') || lower.includes('30 mins')) {
      const total = startH * 60 + startM + 30; endH = Math.floor(total / 60); endM = total % 60;
    } else if (lower.includes('an hour and a half') || lower.includes('90 minutes')) {
      const total = startH * 60 + startM + 90; endH = Math.floor(total / 60); endM = total % 60;
    } else if (lower.includes('an hour') || lower.includes('one hour') || lower.includes('1 hour')) {
      endH = startH + 1;
    }
  }

  // Tag detection — with time-of-day smart defaults if no keyword match
  let tag = 'meeting';
  if (lower.includes('deep work') || lower.includes('focus') || lower.includes('heads down') || lower.includes('concentrate')) tag = 'deep-work';
  else if (lower.includes('gym') || lower.includes('workout') || lower.includes('cardio') || lower.includes('run') || lower.includes('running') || lower.includes('jog') || lower.includes('exercise') || lower.includes('fitness') || lower.includes('yoga') || lower.includes('swim')) tag = 'exercise';
  else if (lower.includes('study') || lower.includes('math') || lower.includes('english') || lower.includes('chemistry') || lower.includes('biology') || lower.includes('physics') || lower.includes('mandarin') || lower.includes('class') || lower.includes('lesson') || lower.includes('tutor') || lower.includes('read') || lower.includes('learn') || lower.includes('homework')) tag = 'study';
  else if (lower.includes('design') || lower.includes('movie') || lower.includes('film') || lower.includes('hobby') || lower.includes('app') || lower.includes('build') || lower.includes('project') || lower.includes('creative') || lower.includes('art') || lower.includes('music') || lower.includes('game')) tag = 'hobby';
  // Time-of-day smart default if no tag keyword matched
  if (tag === 'meeting') {
    if (startH >= 5 && startH < 12) tag = 'deep-work';
    else if (startH >= 17 && startH < 22) tag = 'hobby';
  }

  if (!title) title = 'Untitled Event';
  const tStartM = startH * 60 + startM;
  const tEndM = endH * 60 + endM;
  const conflict = findConflict(dateStr, tStartM, tEndM);
  if (conflict) {
    const dur = tEndM - tStartM;
    const slot = findFreeSlot(dateStr, dur);
    if (slot) { return { title, date: dateStr, startTime: slot.startTime, endTime: slot.endTime, tag, _adjusted: true }; }
  }
  return { title, date: dateStr, startTime: `${String(startH).padStart(2,'0')}:${String(startM).padStart(2,'0')}`, endTime: `${String(endH).padStart(2,'0')}:${String(endM).padStart(2,'0')}`, tag };
}

// ─── APPLY TEMPLATE ────────────────────────────────────────
function applyTemplate(tpl, date, startMins) {
  const endMins = startMins + tpl.duration;
  return createTask({
    title: tpl.title,
    tag: tpl.tag,
    priority: tpl.priority || 3,
    date: date || formatDate(new Date()),
    startTime: toTimeStr(startMins),
    endTime: toTimeStr(endMins),
  });
}

// ─── RENDER HUB TEMPLATES ────────────────────────────────
function renderHubTemplates() {
  const container = document.getElementById('hubTemplates');
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
        const now = new Date();
        const currentMins = now.getHours() * 60 + now.getMinutes();
        const snap = roundToNearest(currentMins + 30, SNAP_MINUTES);
        applyTemplate(tpl, formatDate(now), snap);
        if (typeof pageAfterTaskSave === 'function') pageAfterTaskSave();
        if (typeof updateHub === 'function') updateHub();
        showToast(`📌 Added ${escapeHtml(tpl.name)}`, 'success', 2000);
      }
    });
  });
}

function parseFindGap(text) {
  const lower = text.toLowerCase();
  let durationMinutes = 60;
  const durH = text.match(/(\d+)\s*hours?\s*(?:and\s+(\d+)\s*mins?)?/i);
  const durM = text.match(/(?:for\s+)?(\d+)\s*(mins?|minutes?|m)\b(?!\w)/i);
  if (durH) { durationMinutes = parseInt(durH[1]) * 60; if (durH[2]) durationMinutes += parseInt(durH[2]); }
  else if (durM) { durationMinutes = parseInt(durM[1]); }
  else if (lower.includes('half an hour') || lower.includes('30 minutes') || lower.includes('30 mins')) durationMinutes = 30;
  else if (lower.includes('an hour and a half') || lower.includes('90 minutes')) durationMinutes = 90;
  else if (lower.includes('two hours') || lower.includes('2 hours') || lower.includes('2hr')) durationMinutes = 120;
  let title = 'New Task';
  const titleMatch = text.match(/(?:for|a)\s+(.+?)(?:\s+(?:on|at|today|tomorrow|this|next))/i);
  if (titleMatch) title = titleMatch[1].trim();
  else { const lastKw = text.search(/\b(find|gap|free|open|slot|available)\b/i); if (lastKw >= 0) { const after = text.slice(lastKw).replace(/\b(find|gap|free|open|slot|available)\b/gi, '').trim(); if (after) title = after; } }
  title = title.replace(/\b(\d+)\s*(hours?|hr|mins?|minutes?|m)\b/gi, '').trim();
  if (!title || title.length < 2) title = 'New Task';
  title = title.charAt(0).toUpperCase() + title.slice(1);
  const today = new Date(); let targetDate = new Date(today);
  if (lower.includes('tomorrow')) targetDate.setDate(targetDate.getDate() + 1);
  else if (lower.includes('today')) { /* keep today */ }
  else { const dayNames = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday']; const dayAbbr = ['sun','mon','tue','wed','thu','fri','sat']; let found = -1; for (let i = 0; i < 7; i++) { if (lower.includes(dayNames[i]) || lower.includes(dayAbbr[i])) { found = i; break; } } if (found >= 0) { let diff = found - targetDate.getDay(); if (diff <= 0) diff += 7; targetDate.setDate(targetDate.getDate() + diff); } }
  let tag = 'meeting';
  if (lower.includes('deep work') || lower.includes('focus') || lower.includes('heads down')) tag = 'deep-work';
  else if (lower.includes('gym') || lower.includes('workout') || lower.includes('cardio') || lower.includes('run') || lower.includes('exercise') || lower.includes('fitness')) tag = 'exercise';
  else if (lower.includes('study') || lower.includes('math') || lower.includes('english') || lower.includes('chemistry') || lower.includes('biology') || lower.includes('physics') || lower.includes('mandarin') || lower.includes('class')) tag = 'study';
  else if (lower.includes('design') || lower.includes('movie') || lower.includes('film') || lower.includes('hobby') || lower.includes('app') || lower.includes('build')) tag = 'hobby';
  const dateStr = formatDate(targetDate);
  const slot = findFreeSlot(dateStr, durationMinutes);
  if (!slot) return null;
  return { title, date: dateStr, startTime: slot.startTime, endTime: slot.endTime, tag, durationMinutes, isGapFind: true };
}

function findFreeSlot(dateStr, durationMinutes) {
  const dayTasks = state.tasks.filter(t => t.date === dateStr && !t.completed && !isWhiteboardTask(t));
  const busy = [];
  for (const task of dayTasks) { const start = parseTime(task.startTime); const end = parseTime(task.endTime) || start + 60; busy.push({ start, end }); }
  busy.sort((a, b) => a.start - b.start);
  const startBoundary = START_HOUR * 60;
  const endBoundary = (START_HOUR + VISIBLE_HOURS) * 60;
  const buffer = 15; // 15min gap between tasks
  let cursor = startBoundary;
  if (busy.length === 0) {
    const now = new Date(); const currentMins = now.getHours() * 60 + now.getMinutes();
    const isToday = dateStr === formatDate(new Date());
    const startSlot = isToday ? roundToNearest(Math.max(currentMins + buffer, startBoundary), SNAP_MINUTES) : startBoundary;
    if (startSlot + durationMinutes <= endBoundary) return { startTime: toTimeStr(startSlot), endTime: toTimeStr(startSlot + durationMinutes) };
    return null;
  }
  for (const interval of busy) {
    if (cursor + durationMinutes <= interval.start - buffer) return { startTime: toTimeStr(cursor), endTime: toTimeStr(cursor + durationMinutes) };
    cursor = Math.max(cursor, interval.end + buffer);
  }
  if (cursor + durationMinutes <= endBoundary) return { startTime: toTimeStr(cursor), endTime: toTimeStr(cursor + durationMinutes) };
  return null;
}

function findConflict(dateStr, startM, endM, excludeId) {
  const buffer = 15;
  for (const task of state.tasks) {
    if (task.id === excludeId || task.completed || isWhiteboardTask(task)) continue;
    if (task.date !== dateStr) continue;
    const tStart = parseTime(task.startTime);
    const tEnd = parseTime(task.endTime) || tStart + 60;
    if (startM < tEnd + buffer && endM > tStart - buffer) return task;
  }
  return null;
}

function showCommandResult(result) {
  if (!dom.cmdResults) return;
  const meta = TAG_COLORS[result.tag] || TAG_COLORS.meeting;
  const adjustedNote = result._adjusted ? '<div class="cmd-adjusted-note">Time adjusted to avoid conflict</div>' : '';
  dom.cmdResults.innerHTML = `
    <div class="cmd-result-item">
      <svg class="cmd-result-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/></svg>
      <div class="cmd-result-content">
        <div class="cmd-result-title">${escapeHtml(result.title)}</div>
        <div class="cmd-result-detail">${result.date} &middot; ${result.startTime} &ndash; ${result.endTime} &middot; <span style="color:${meta.text}">${result.tag}</span></div>${adjustedNote}
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
    dom.cmdResults.innerHTML = `
    <div class="cmd-result-item">
      <svg class="cmd-result-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
      <div class="cmd-result-content">
        <div class="cmd-result-title">${escapeHtml(res.title)}</div>
        <div class="cmd-result-detail">${res.date} &middot; ${res.startTime} &ndash; ${res.endTime} (${res.durationMinutes}m) &middot; <span style="color:${meta.text}">${res.tag}</span></div>
        <div class="cmd-result-actions">
          <button class="btn btn-primary cmd-confirm-btn">Add to Calendar</button>
          <button class="btn btn-outline cmd-cancel-btn">Cancel</button>
          <button class="btn btn-ghost cmd-refresh-btn" title="Find another slot"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/></svg> Next</button>
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

function findNextSlot(prevResult) {
  const dayTasks = state.tasks.filter(t => t.date === prevResult.date && !t.completed && !isWhiteboardTask(t));
  const busy = [];
  const buffer = 15;
  for (const task of dayTasks) { const start = parseTime(task.startTime); const end = parseTime(task.endTime) || start + 60; busy.push({ start, end }); }
  busy.sort((a, b) => a.start - b.start);
  const prevEnd = parseTime(prevResult.endTime);
  const dur = prevResult.durationMinutes;
  const endBoundary = (START_HOUR + VISIBLE_HOURS) * 60;
  let cursor = prevEnd;
  for (const interval of busy) {
    if (interval.start <= cursor) { cursor = Math.max(cursor, interval.end + buffer); continue; }
    if (cursor + dur <= interval.start - buffer) return { ...prevResult, startTime: toTimeStr(cursor), endTime: toTimeStr(cursor + dur) };
    cursor = Math.max(cursor, interval.end + buffer);
  }
  if (cursor + dur <= endBoundary) return { ...prevResult, startTime: toTimeStr(cursor), endTime: toTimeStr(cursor + dur) };
  return null;
}

function showCommandError(msg) {
  if (!dom.cmdResults) return;
  dom.cmdResults.innerHTML = `<div class="cmd-error">${escapeHtml(msg)}</div>`;
  state._lastCommandText = null;
}

function confirmCmdTask(taskData) {
  const startM = parseTime(taskData.startTime);
  const endM = parseTime(taskData.endTime) || startM + 60;
  const dur = endM - startM;
  const conflict = findConflict(taskData.date, startM, endM);

  if (conflict) {
    const slot = findFreeSlot(taskData.date, dur);
    if (slot) {
      showToast(`"${escapeHtml(taskData.title)}" overlaps with ${escapeHtml(conflict.title)}. Suggest ${slot.startTime}–${slot.endTime}.`, 'warning');
      taskData.startTime = slot.startTime;
      taskData.endTime = slot.endTime;
    } else {
      showToast(`No free slot on ${taskData.date} for this task`, 'error');
      return;
    }
  }

  pushUndo();
  createTask(taskData);
  if (state.cmdPaletteOpen) hideCmdPalette();
  if (typeof pageAfterTaskSave === 'function') pageAfterTaskSave();
}

// ─── AI CHAT AGENT ──────────────────────────────────────────
let aiChatHistory = [];
let attachedFile = null;

function saveChatHistory() {
  try {
    const recent = aiChatHistory.slice(-50);
    localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(recent));
  } catch (e) { /* storage full or unavailable */ }
}

function loadChatHistory() {
  try {
    const data = localStorage.getItem(CHAT_HISTORY_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) { return []; }
}

function toggleAISendBtn() {
  const btn = dom.aiChatSend;
  const input = dom.aiChatInput;
  if (btn && input) {
    btn.classList.toggle('show', input.value.trim().length > 0);
  }
}

function showAIChat() {
  if (!dom.aiChatPanel) return;
  const provider = state.apiProvider || 'groq';
  const pLabel = PROVIDER_LABELS[provider] || 'Groq';
  const pLink = PROVIDER_LINKS[provider] || PROVIDER_LINKS.groq;
  // Show API key welcome if not configured
  if (!state.apiKey) {
    dom.aiChatMessages.innerHTML = `<div class="ai-welcome">
      <div class="ai-welcome-icon">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <rect x="4" y="5" width="16" height="14" rx="4"/><path d="M12 5V3"/><circle cx="12" cy="3" r="1.5"/><circle cx="9" cy="10" r="1" fill="currentColor"/><circle cx="15" cy="10" r="1" fill="currentColor"/><path d="M8 14a4 4 0 007 0"/>
        </svg>
      </div>
      <h3>Welcome to ChickBot</h3>
      <p>Your smart schedule buddy. Get started by adding your API key in Settings.</p>
      <button class="btn btn-primary" id="aiSetupBtn">Open Settings</button>
      <p class="ai-welcome-hint">Need a key? Get a free one at <a href="${pLink.url}" target="_blank" class="form-link">${pLink.text}</a>. Without it, basic parsing still works in the command palette (${shortcutDisplay('K')}).</p>
    </div>`;
    dom.aiChatInputWrapper.classList.add('disabled');
    dom.aiChatInput.disabled = true;
    dom.aiChatInput.placeholder = 'Configure an API key in Settings to chat...';
    document.getElementById('aiSetupBtn')?.addEventListener('click', () => { window.open(`${pLink.url}`, '_blank'); });
  } else {
    attachedFile = null;
    aiChatHistory = loadChatHistory();
    if (aiChatHistory.length > 0) {
      dom.aiChatMessages.innerHTML = '';
      aiChatHistory.forEach(msg => {
        if (msg.role === 'user') appendAIMessage('user', msg.text);
        else if (msg.role === 'assistant') appendAIMessage('assistant', msg.text);
      });
    } else if (!getChickBotProfile()) {
      startOnboarding();
    } else {
      dom.aiChatMessages.innerHTML = `<div class="ai-message ai-message-assistant">
        <div class="ai-avatar"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="5" width="16" height="14" rx="4"/><path d="M12 5V3"/><circle cx="12" cy="3" r="1.5"/><circle cx="9" cy="10" r="1" fill="currentColor"/><circle cx="15" cy="10" r="1" fill="currentColor"/><path d="M8 14a4 4 0 007 0"/></svg></div>
        <div class="ai-bubble">
          <p>Hi! Ask me anything about your schedule or tell me what to do.</p>
          <div class="ai-suggestions">
            <button class="ai-chip" data-prompt="What does my week look like?">What does my week look like?</button>
            <button class="ai-chip" data-prompt="Create a deep work session tomorrow at 9am for 2 hours">Schedule deep work tomorrow</button>
            <button class="ai-chip" data-prompt="Find a 1 hour gap for a meeting today">Find a gap today</button>
            <button class="ai-chip" data-prompt="How many tasks do I have this week?">Task count this week</button>
          </div>
        </div>
      </div>`;
      aiChatHistory = [];
      // Bind suggestion chips
      dom.aiChatMessages.querySelectorAll('.ai-chip').forEach(chip => {
        chip.addEventListener('click', () => {
          dom.aiChatInput.value = chip.dataset.prompt;
          toggleAISendBtn();
          sendAIMessage();
        });
      });
    }
    dom.aiChatInputWrapper.classList.remove('disabled');
    dom.aiChatInput.disabled = false;
    dom.aiChatInput.placeholder = 'Ask about your schedule...';
    toggleAISendBtn();
  }

  // Add file upload button dynamically
  let uploadBtn = dom.aiChatInputWrapper.querySelector('.ai-upload-btn');
  if (!uploadBtn) {
    uploadBtn = document.createElement('button');
    uploadBtn.className = 'ai-upload-btn';
    uploadBtn.type = 'button';
    uploadBtn.title = 'Attach file (image, PDF, text)';
    uploadBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"/>
    </svg>`;
    uploadBtn.addEventListener('click', () => {
      if (!dom.aiFileInput) {
        dom.aiFileInput = document.createElement('input');
        dom.aiFileInput.type = 'file';
        dom.aiFileInput.accept = 'image/*,.pdf,.txt,.csv,.json,.doc,.docx';
        dom.aiFileInput.style.display = 'none';
        document.body.appendChild(dom.aiFileInput);
        dom.aiFileInput.addEventListener('change', handleFileAttach);
      }
      dom.aiFileInput.click();
    });
    dom.aiChatInputWrapper.insertBefore(uploadBtn, dom.aiChatSend);
  }

  // Show file badge if file is attached
  updateFileBadge();

  dom.aiChatPanel.classList.remove('hidden');
  dom.aiChatOverlay.classList.remove('hidden');
  requestAnimationFrame(() => {
    dom.aiChatOverlay.classList.add('active');
    dom.aiChatPanel.classList.add('open');
  });
  state.aiChatOpen = true;
  dom.aiChatInput?.focus();

  // Toggle send button visibility based on input
  if (!dom.aiChatInput?.hasAttribute('data-ai-listener')) {
    dom.aiChatInput?.setAttribute('data-ai-listener', 'true');
    dom.aiChatInput?.addEventListener('input', toggleAISendBtn);
  }
  toggleAISendBtn();
}

// ─── FILE ATTACHMENT HELPERS ────────────────────────────────
function handleFileAttach(e) {
  const file = e.target?.files?.[0];
  if (!file) return;
  trackAIUsage('file');

  const reader = new FileReader();
  const isImage = file.type.startsWith('image/');

  reader.onload = (ev) => {
    const data = ev.target.result;
    attachedFile = {
      name: file.name,
      size: file.size,
      type: file.type,
      data: data,
      isImage: isImage,
    };
    updateFileBadge();

    // Add system message showing file was attached
    appendAIMessage('system', `Attached <strong>${escapeHtml(file.name)}</strong> (${formatFileSize(file.size)})`);
  };

  if (isImage) {
    reader.readAsDataURL(file);
  } else {
    reader.readAsText(file);
  }
}

function updateFileBadge() {
  let badge = dom.aiChatInputWrapper?.querySelector('.ai-file-badge');
  if (!attachedFile) {
    if (badge) badge.remove();
    return;
  }
  if (!badge) {
    badge = document.createElement('div');
    badge.className = 'ai-file-badge';
    dom.aiChatInputWrapper?.parentElement?.insertBefore(badge, dom.aiChatInputWrapper);
  }
  const icon = attachedFile.isImage ? '📷' : '📄';
  const thumbnailHtml = attachedFile.isImage
    ? `<img class="ai-file-thumbnail" src="${attachedFile.data}" alt="${escapeHtml(attachedFile.name)}">`
    : '';
  badge.innerHTML = `
    ${thumbnailHtml}
    <span>${escapeHtml(attachedFile.name)}</span>
    <button class="ai-file-remove" title="Remove file">
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
    </button>
  `;
  badge.querySelector('.ai-file-remove')?.addEventListener('click', () => {
    attachedFile = null;
    if (dom.aiFileInput) dom.aiFileInput.value = '';
    updateFileBadge();
  });
}

function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + 'B';
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + 'KB';
  return (bytes / 1048576).toFixed(1) + 'MB';
}

function hideAIChat() {
  if (!dom.aiChatPanel) return;
  saveChatHistory();
  dom.aiChatOverlay.classList.remove('active');
  dom.aiChatPanel.classList.remove('open');
  setTimeout(() => {
    dom.aiChatPanel.classList.add('hidden');
    dom.aiChatOverlay.classList.add('hidden');
  }, 200);
  state.aiChatOpen = false;
}

function toggleAIChat() {
  state.aiChatOpen ? hideAIChat() : showAIChat();
}

// ─── TOAST NOTIFICATIONS ──────────────────────────────────
function showToast(message, type, duration) {
  const existing = document.querySelector('.ai-toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = 'ai-toast';
  toast.style.cssText = `
    position: fixed; bottom: 100px; right: 28px; z-index: 9999;
    padding: 10px 18px; border-radius: 10px;
    font-size: 0.82rem; font-family: var(--font-family); font-weight: 500;
    background: var(--bg-card); border: 1px solid var(--border-color);
    color: var(--text-primary);
    box-shadow: 0 8px 30px rgba(0,0,0,0.15);
    display: flex; align-items: center; gap: 8px;
    animation: slideUp 200ms cubic-bezier(0.16, 1, 0.3, 1);
    max-width: 360px;
  `;
  toast.innerHTML = message;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.transition = 'opacity 200ms ease, transform 200ms ease';
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(8px)';
    setTimeout(() => toast.remove(), 200);
  }, duration || 4000);
}

// ─── FLASH AND SCROLL TO TASK ─────────────────────────────
function flashTaskOnGrid(taskId) {
  const el = document.querySelector(`.calendar-task[data-task-id="${taskId}"]`);
  if (!el) return;

  // Only flash if we're on the schedule page (calendar-task elements exist)
  const container = el.closest('#calendarContainer');
  if (!container) return;

  // Scroll container to show the task
  const taskTop = el.offsetTop - container.clientHeight / 3;
  container.scrollTo({ top: Math.max(0, taskTop), behavior: 'smooth' });

  // Flash highlight
  const origTransition = el.style.transition;
  el.style.transition = 'all 300ms ease';
  el.style.boxShadow = '0 0 0 3px var(--accent), 0 4px 20px rgba(0,0,0,0.2)';
  el.style.transform = 'scale(1.03)';
  el.style.zIndex = '50';
  setTimeout(() => {
    el.style.boxShadow = '';
    el.style.transform = '';
    el.style.zIndex = '';
    setTimeout(() => { el.style.transition = origTransition; }, 300);
  }, 1500);
}

function executeActions(actions, responseText) {
  let responseHtml = responseText;
  const actionSummary = [];
  let actionsModified = false;
  const createdTaskIds = [];

  for (const action of actions) {
    if (action.type === 'createTask') {
      trackAIUsage('task');
      const data = action.data;
      const startM = parseTime(data.startTime);
      const endM = parseTime(data.endTime) || startM + 60;
      const conflict = findConflict(data.date, startM, endM);
      if (conflict) {
        const dur = endM - startM;
        const slot = findFreeSlot(data.date, dur);
        if (slot) {
          data.startTime = slot.startTime;
          data.endTime = slot.endTime;
          actionSummary.push(`⚠️ ${escapeHtml(data.title)} shifted to ${slot.startTime}–${slot.endTime} (avoids conflict with "${escapeHtml(conflict.title)}")`);
        }
      }
      const task = createTask(data);
      createdTaskIds.push(task.id);
      const meta = getTagMeta(data.tag || 'meeting');
      actionSummary.push(`📌 <strong>${escapeHtml(data.title)}</strong> <span style="color:${meta.text}">${data.startTime}–${data.endTime}</span> on ${data.date}`);
    } else if (action.type === 'updateTask' && action.data.id) {
      updateTask(action.data.id, action.data.changes);
      actionSummary.push(`✏️ Updated: <strong>${escapeHtml(action.data.changes.title || 'task')}</strong>`);
      actionsModified = true;
    } else if (action.type === 'deleteTask' && action.data.id) {
      const t = getTask(action.data.id);
      deleteTask(action.data.id);
      actionSummary.push(`🗑️ Deleted: <strong>${escapeHtml(t?.title || 'task')}</strong>`);
      actionsModified = true;
    } else if (action.type === 'clearAllTasks') {
      pushUndo();
      const before = state.tasks.length;
      state.tasks = state.tasks.filter(isWhiteboardTask);
      saveState();
      const count = before - state.tasks.length;
      actionSummary.push(`🧹 Cleared <strong>${count}</strong> task${count !== 1 ? 's' : ''} from the schedule`);
      actionsModified = true;
    } else if (action.type === 'clearDate') {
      pushUndo();
      const date = action.data.date;
      const toRemove = state.tasks.filter(t => t.date === date && !isWhiteboardTask(t));
      const ids = new Set(toRemove.map(t => t.id));
      state.tasks = state.tasks.filter(t => !ids.has(t.id));
      saveState();
      actionSummary.push(`🧹 Cleared <strong>${toRemove.length}</strong> task${toRemove.length !== 1 ? 's' : ''} on ${date}`);
      actionsModified = true;
    } else if (action.type === 'clearCompletedTasks') {
      pushUndo();
      const before = state.tasks.filter(t => t.completed).length;
      state.tasks = state.tasks.filter(t => !t.completed);
      saveState();
      actionSummary.push(`🧹 Removed <strong>${before}</strong> completed task${before !== 1 ? 's' : ''}`);
      actionsModified = true;
    } else if (action.type === 'deleteTasksByTag') {
      pushUndo();
      const tag = action.data.tag;
      const toRemove = state.tasks.filter(t => t.tag === tag && !isWhiteboardTask(t));
      const ids = new Set(toRemove.map(t => t.id));
      state.tasks = state.tasks.filter(t => !ids.has(t.id));
      saveState();
      const label = TAG_LABELS[tag] || tag;
      actionSummary.push(`🧹 Deleted <strong>${toRemove.length}</strong> ${label} task${toRemove.length !== 1 ? 's' : ''}`);
      actionsModified = true;
    } else if (action.type === 'deleteTasksByQuery') {
      pushUndo();
      const query = action.data.query.toLowerCase();
      const toRemove = state.tasks.filter(t => !isWhiteboardTask(t) && t.title.toLowerCase().includes(query));
      const ids = new Set(toRemove.map(t => t.id));
      state.tasks = state.tasks.filter(t => !ids.has(t.id));
      saveState();
      actionSummary.push(`🧹 Deleted <strong>${toRemove.length}</strong> task${toRemove.length !== 1 ? 's' : ''} matching "${escapeHtml(action.data.query)}"`);
      actionsModified = true;
    }
  }

  if (actionSummary.length > 0) {
    responseHtml += '\n\n' + actionSummary.join('<br>');
  }

  if (typeof pageAfterTaskSave === 'function') pageAfterTaskSave();

  const taskCount = createdTaskIds.length;
  if (taskCount > 0) {
    showToast(`✅ Added <strong>${taskCount}</strong> task${taskCount > 1 ? 's' : ''} to the calendar`, 'success', 3000);
    setTimeout(() => { flashTaskOnGrid(createdTaskIds[0]); }, 400);
  } else if (actionsModified) {
    showToast('✅ Schedule updated', 'success', 2000);
  }

  return responseHtml;
}

function sendAIMessage() {
  if (!dom.aiChatInput || !dom.aiChatInput.value.trim() || !state.apiKey) return;
  const text = dom.aiChatInput.value.trim();
  dom.aiChatInput.value = '';
  toggleAISendBtn();

  appendAIMessage('user', text);

  const typingEl = document.createElement('div');
  typingEl.className = 'ai-message ai-message-assistant';
  typingEl.innerHTML = `<div class="ai-avatar"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="5" width="16" height="14" rx="4"/><path d="M12 5V3"/><circle cx="12" cy="3" r="1.5"/><circle cx="9" cy="10" r="1" fill="currentColor"/><circle cx="15" cy="10" r="1" fill="currentColor"/><path d="M8 14a4 4 0 007 0"/></svg></div><div class="ai-bubble"><div class="ai-typing"><span></span><span></span><span></span></div></div>`;
  dom.aiChatMessages.appendChild(typingEl);
  dom.aiChatMessages.scrollTop = dom.aiChatMessages.scrollHeight;

  if (onboardingState) {
    processOnboardingStep(text, typingEl);
    return;
  }

  trackAIUsage('chat');
  trackAIUsage('api');
  aiChatHistory.push({ role: 'user', text });
  saveChatHistory();
  callAIAgent(text).then(response => {
    typingEl.remove();

    const hasActions = response.actions && response.actions.length > 0;

    if (hasActions) {
      // Plan mode: show plan and wait for confirmation
      const planLines = response.actions.map(a => {
        if (a.type === 'createTask') {
          const meta = getTagMeta(a.data.tag || 'meeting');
          return `<span style="color:${meta.text}">●</span> <strong>${escapeHtml(a.data.title)}</strong> — ${a.data.date} ${a.data.startTime}–${a.data.endTime} <em style="color:var(--text-tertiary)">(${a.data.tag})</em>`;
        }
        if (a.type === 'clearAllTasks') return `🧹 Clear entire schedule`;
        if (a.type === 'clearDate') return `🧹 Clear tasks on ${a.data.date}`;
        if (a.type === 'clearCompletedTasks') return `🧹 Remove all completed tasks`;
        if (a.type === 'deleteTasksByTag') return `🧹 Delete all ${a.data.tag} tasks`;
        if (a.type === 'deleteTasksByQuery') return `🧹 Delete tasks matching "${escapeHtml(a.data.query)}"`;
        if (a.type === 'updateTask') return `✏️ Update task ${a.data.id}`;
        if (a.type === 'deleteTask') return `🗑️ Delete task ${a.data.id}`;
        return `⚡ ${a.type}`;
      }).join('<br>');

      const planHtml = `${response.text}
        <div class="ai-plan-bar">
          <div class="ai-plan-summary"><strong>Plan (${response.actions.length} action${response.actions.length > 1 ? 's' : ''})</strong></div>
          <div class="ai-plan-items">${planLines}</div>
          <div class="ai-plan-actions">
            <button class="btn btn-primary ai-plan-confirm" style="font-size:0.74rem;padding:3px 12px">Confirm</button>
            <button class="btn btn-outline ai-plan-cancel" style="font-size:0.74rem;padding:3px 12px">Cancel</button>
          </div>
        </div>`;

      appendAIMessage('assistant', planHtml);
      aiChatHistory.push({ role: 'assistant', text: response.text });
      saveChatHistory();

      // Wire up confirm/cancel buttons
      const msgEl = dom.aiChatMessages.lastElementChild;
      msgEl.querySelector('.ai-plan-confirm')?.addEventListener('click', () => {
        const resultHtml = executeActions(response.actions, response.text);
        msgEl.querySelector('.ai-bubble').innerHTML = resultHtml;
        showToast('✅ Plan executed', 'success', 2000);
      });
      msgEl.querySelector('.ai-plan-cancel')?.addEventListener('click', () => {
        msgEl.querySelector('.ai-bubble').innerHTML = response.text + '\n\n<em style="color:var(--text-tertiary)">✖ Plan cancelled</em>';
        showToast('Plan cancelled', 'info', 2000);
      });
    } else {
      // No actions — just show the response
      appendAIMessage('assistant', response.text);
      aiChatHistory.push({ role: 'assistant', text: response.text });
      saveChatHistory();
    }
  }).catch(err => {
    typingEl.remove();
    const msg = err.message || 'Something went wrong';
    const pLabel = PROVIDER_LABELS[state.apiProvider] || 'Groq';
    const isRateLimit = msg.includes('429') || msg.includes('Rate limited');
    const displayMsg = isRateLimit
      ? `❌ Rate limited. ${pLabel} API is temporarily overloaded.`
      : `❌ Error: ${escapeHtml(msg)}. Check your API key in Settings.`;
    appendAIMessage('system', displayMsg + `<br><br><button class="btn btn-outline ai-retry-btn" style="font-size:0.74rem;padding:3px 12px">Retry</button>`);
    // Wire up retry button
    const msgs = dom.aiChatMessages;
    if (msgs) {
      const last = msgs.lastElementChild;
      last.querySelector('.ai-retry-btn')?.addEventListener('click', () => {
        const lastUser = [...msgs.querySelectorAll('.ai-message-user')].pop();
        if (lastUser) {
          const txt = lastUser.querySelector('.ai-bubble')?.textContent;
          if (txt) {
            dom.aiChatInput.value = txt;
            sendAIMessage();
          }
        }
      });
    }
  });
}

function appendAIMessage(role, html) {
  if (!dom.aiChatMessages) return;
  const div = document.createElement('div');
  if (role === 'user') {
    div.className = 'ai-message ai-message-user';
    div.innerHTML = `<div class="ai-bubble">${escapeHtml(html)}</div>`;
  } else if (role === 'assistant') {
    div.className = 'ai-message ai-message-assistant';
    div.innerHTML = `<div class="ai-avatar"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="5" width="16" height="14" rx="4"/><path d="M12 5V3"/><circle cx="12" cy="3" r="1.5"/><circle cx="9" cy="10" r="1" fill="currentColor"/><circle cx="15" cy="10" r="1" fill="currentColor"/><path d="M8 14a4 4 0 007 0"/></svg></div><div class="ai-bubble">${html}</div>`;
  } else {
    div.className = 'ai-message ai-message-system';
    div.innerHTML = `<div class="ai-bubble">${html}</div>`;
  }
  dom.aiChatMessages.appendChild(div);
  dom.aiChatMessages.scrollTop = dom.aiChatMessages.scrollHeight;
}

// ─── ChickBot Profile System ─────────────────────────────
const CHICKBOT_PROFILE_KEY = 'chickbot_profile';

function getChickBotProfile() {
  try {
    const data = localStorage.getItem(CHICKBOT_PROFILE_KEY);
    return data ? JSON.parse(data) : null;
  } catch (e) { return null; }
}

function saveChickBotProfile(profile) {
  try {
    localStorage.setItem(CHICKBOT_PROFILE_KEY, JSON.stringify(profile));
  } catch (e) { /* ignore */ }
}

function buildChickBotProfileSection() {
  const profile = getChickBotProfile();
  if (!profile || !profile.name) return '';
  const lines = [
    'ABOUT YOU:',
    `- Name: ${profile.name}`,
    `- Pronouns: ${profile.pronouns || 'not specified'}`,
    `- Occupation: ${profile.occupation || 'not specified'}`,
    `- Goals: ${profile.goals || 'not specified'}`,
    `- Routines: ${profile.routines || 'not specified'}`,
    `- Preferences: ${profile.preferences || 'not specified'}`
  ];
  return '\n' + lines.join('\n');
}

// ─── ChickBot Onboarding Q&A ──────────────────────────
const ONBOARDING_STEPS = [
  { key: 'name', question: "What's your name?", required: true },
  { key: 'situation', question: "Are you currently in school, working, or both?", required: false },
  { key: 'break', question: "Do you have a holiday or break right now?", required: false },
  { key: 'hours', question: "What time do you usually start and end your day?", required: false },
  { key: 'commitments', question: "Any regular commitments I should know about? (e.g. classes, meetings, workouts)", required: false },
  { key: 'priorities', question: "What's most important for you to fit into your schedule?", required: false }
];

let onboardingState = null;

function startOnboarding() {
  onboardingState = { step: 0, profile: {} };
  dom.aiChatMessages.innerHTML = `<div class="ai-message ai-message-assistant">
    <div class="ai-avatar"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="5" width="16" height="14" rx="4"/><path d="M12 5V3"/><circle cx="12" cy="3" r="1.5"/><circle cx="9" cy="10" r="1" fill="currentColor"/><circle cx="15" cy="10" r="1" fill="currentColor"/><path d="M8 14a4 4 0 007 0"/></svg></div>
    <div class="ai-bubble"><p>Hi! I'm <strong>ChickBot</strong>, your personal schedule assistant!</p><p>Let's get to know each other first.</p><p><strong>${ONBOARDING_STEPS[0].question}</strong></p></div>
  </div>`;
}

function processOnboardingStep(userText, typingEl) {
  if (!onboardingState) return false;
  const step = ONBOARDING_STEPS[onboardingState.step];
  if (!step) return false;

  const val = userText.trim();
  if (step.required && !val) {
    typingEl.remove();
    appendAIMessage('assistant', `I need an answer for that one. ${step.question}`);
    return true;
  }

  onboardingState.profile[step.key] = val;
  onboardingState.step++;

  const nextStep = ONBOARDING_STEPS[onboardingState.step];
  if (!nextStep) {
    const profile = {
      name: onboardingState.profile.name || '',
      pronouns: '',
      occupation: onboardingState.profile.situation || '',
      goals: onboardingState.profile.priorities || '',
      routines: [onboardingState.profile.hours, onboardingState.profile.commitments, onboardingState.profile.break].filter(Boolean).join('; '),
      preferences: ''
    };
    saveChickBotProfile(profile);
    onboardingState = null;
    typingEl.remove();
    const msg = `<p>Thanks, <strong>${escapeHtml(profile.name)}</strong>! I'll keep all of that in mind.</p>
      <p>What would you like to do now?</p>
      <div class="ai-suggestions">
        <button class="ai-chip" data-prompt="What does my week look like?">What does my week look like?</button>
        <button class="ai-chip" data-prompt="Create a deep work session tomorrow at 9am for 2 hours">Schedule deep work tomorrow</button>
        <button class="ai-chip" data-prompt="Find a 1 hour gap for a meeting today">Find a gap today</button>
        <button class="ai-chip" data-prompt="How many tasks do I have this week?">Task count this week</button>
      </div>`;
    appendAIMessage('assistant', msg);
    dom.aiChatMessages.querySelectorAll('.ai-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        dom.aiChatInput.value = chip.dataset.prompt;
        toggleAISendBtn();
        sendAIMessage();
      });
    });
    return true;
  }

  typingEl.remove();
  appendAIMessage('assistant', `<strong>${nextStep.question}</strong>`);
  return true;
}

function renderChickBotProfileInSettings() {
  const profile = getChickBotProfile();
  const nameEl = document.getElementById('cb-name-settings');
  const pronounsEl = document.getElementById('cb-pronouns-settings');
  const occupationEl = document.getElementById('cb-occupation-settings');
  const goalsEl = document.getElementById('cb-goals-settings');
  const routinesEl = document.getElementById('cb-routines-settings');
  const preferencesEl = document.getElementById('cb-preferences-settings');
  if (!nameEl) return;
  if (profile) {
    nameEl.value = profile.name || '';
    pronounsEl.value = profile.pronouns || '';
    occupationEl.value = profile.occupation || '';
    goalsEl.value = profile.goals || '';
    routinesEl.value = profile.routines || '';
    preferencesEl.value = profile.preferences || '';
  } else {
    nameEl.value = '';
    pronounsEl.value = '';
    occupationEl.value = '';
    goalsEl.value = '';
    routinesEl.value = '';
    preferencesEl.value = '';
  }
}

function callAIAgent(userText) {
  const today = formatDate(new Date());
  const weekStart = getMonday(new Date());
  const weekEnd = addDays(weekStart, 14);

  // Build context about the user's schedule
  const allTasks = state.tasks;
  const todayTasks = allTasks.filter(t => t.date === today);
  const weekTasks = allTasks.filter(t => {
    if (!t.date) return false;
    const d = new Date(t.date + 'T12:00:00');
    return d >= weekStart && d < weekEnd;
  });
  const whiteboardTasks = allTasks.filter(t => !t.date);
  const completedTasks = allTasks.filter(t => t.completed);

  const tagSummary = {};
  for (const tag of TAG_ORDER) {
    const tasks = allTasks.filter(t => t.tag === tag && !isWhiteboardTask(t));
    const totalMin = tasks.reduce((sum, t) => sum + getDurationMinutes(t), 0);
    tagSummary[tag] = { count: tasks.length, totalMinutes: totalMin, label: TAG_LABELS[tag] };
  }

  // Build a richer task list — next 2 weeks with gaps
  const taskListStr = weekTasks.slice(0, 30).map(t =>
    `- ${t.title} (${t.date} ${t.startTime}-${t.endTime}, ${TAG_LABELS[t.tag] || t.tag}${t.completed ? ' ✓' : ''})`
  ).join('\n');

  // Compute free slots for today
  const dayNames = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const todayName = dayNames[new Date().getDay()];
  const todayTasksList = allTasks.filter(t => t.date === today && !t.completed && !isWhiteboardTask(t));
  const busySlots = todayTasksList.map(t => ({
    start: parseTime(t.startTime),
    end: parseTime(t.endTime) || parseTime(t.startTime) + 60
  })).sort((a, b) => a.start - b.start);
  const freeSlots = [];
  let cursor = START_HOUR * 60;
  for (const b of busySlots) {
    if (cursor + 30 <= b.start) freeSlots.push({ start: cursor, end: b.start });
    cursor = Math.max(cursor, b.end + 15);
  }
  const dayEnd = (START_HOUR + VISIBLE_HOURS) * 60;
  if (cursor + 30 <= dayEnd) freeSlots.push({ start: cursor, end: dayEnd });
  const freeSlotStr = freeSlots.length > 0
    ? freeSlots.map(s => {
        const st = toTimeStr(s.start);
        const et = toTimeStr(s.end);
        const dur = formatDuration(s.end - s.start);
        return `  ${st}-${et} (${dur} free)`;
      }).join('\n')
    : '  No free slots today';

  const context = `Today: ${today} (${todayName})
Grid hours: ${toTimeStr(START_HOUR * 60)} – ${toTimeStr((START_HOUR + VISIBLE_HOURS) * 60)} (30-min snap)
Total tasks: ${allTasks.length} (${completedTasks.length} completed)
Today's tasks: ${todayTasks.length}
Week tasks (2 weeks): ${weekTasks.length}
Whiteboard ideas: ${whiteboardTasks.length}

FREE TIME TODAY:
${freeSlotStr}

SCHEDULE (next 2 weeks):
${taskListStr || '(none)'}

TAG BREAKDOWN:
${TAG_ORDER.map(t => `- ${TAG_LABELS[t]}: ${tagSummary[t].count} tasks, ${formatDuration(tagSummary[t].totalMinutes)}`).join('\n')}`;

  const recentHistory = aiChatHistory.slice(-6).map(m => `${m.role}: ${m.text}`).join('\n');

  const learningContext = getLearningContext();

  // Build file context for the AI
  let fileContext = '';
  let hasImageAttachment = false;
  if (attachedFile) {
    if (attachedFile.isImage) {
      fileContext = `\n\n[User attached an image: ${attachedFile.name} (${formatFileSize(attachedFile.size)})]`;
      hasImageAttachment = true;
    } else {
      const textContent = attachedFile.data || '';
      const truncated = textContent.slice(0, 4000);
      fileContext = `\n\n[The user attached a file: ${attachedFile.name}]\nFile content:\n\`\`\`\n${truncated}\n\`\`\``;
    }
  }

  const fileAwareUserText = userText + fileContext;

  const profileSection = buildChickBotProfileSection();

  const systemPrompt = `You are ChickBot, a friendly smart-schedule assistant integrated into Havën Schedule.

Today's date is ${today}. Current time: ${new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}. The user's timezone is ${Intl.DateTimeFormat().resolvedOptions().timeZone}.${learningContext}${profileSection}

CURRENT SCHEDULE CONTEXT:
${context}

RECENT CONVERSATION HISTORY:
${recentHistory || '(no previous conversation)'}

CAPABILITIES:
1. Answer questions about the user's schedule (counts, summaries, breakdowns by tag, free time, etc.)
2. Suggest and INSTANTLY create new tasks on the calendar when the user asks
3. Find free time slots for new tasks
4. Help organize and prioritize tasks
5. Give advice on scheduling and time management
6. Process uploaded files — the user can attach images (photos of schedules, class timetables, handwritten notes), PDFs, or text files. When an image is attached, carefully examine the image contents and extract any schedule, task, or event information from it, then offer to add them to the calendar.
7. Understand natural language about time — "morning" = 6-12, "afternoon" = 12-17, "evening" = 17-21, "night" = 21-6

GRID RULES (the calendar grid runs ${toTimeStr(START_HOUR * 60)} – ${toTimeStr((START_HOUR + VISIBLE_HOURS) * 60)}):
- Tasks snap to 30-minute increments (0 or 30 past the hour)
- Earliest slot is ${toTimeStr(START_HOUR * 60)}, latest ends at ${toTimeStr((START_HOUR + VISIBLE_HOURS) * 60)}
- The grid wraps past midnight until 4am (next day)
- A task at 11:30 PM is valid; a task at 4:30 AM is not

NATURAL LANGUAGE EXAMPLES — understand these user phrasings:
- "What's on today?" → show today's tasks
- "Am I free tomorrow at 3?" → check specific time
- "Find me an hour for deep work" → find a 1h free slot
- "I need to fit in a workout" → find free time for exercise (45-60min)
- "How busy is my week?" → count tasks per day, show busy/free balance
- "Move my meeting to 2pm" → update task time
- "What does my morning look like?" → show tasks between 6-12
- "I have too many meetings" → count meetings, suggest consolidating
- "Schedule a study session for Wednesday" → create task on specific day
- "Can I fit another task today?" → check free time availability

SMART SCHEDULING RULES — apply these when creating tasks:
1. Never schedule a task that overlaps an existing task on the calendar
2. Consider what fits best at each time of day:
   - Deep work (2hr blocks) → morning 9-12 — peak focus hours
   - Exercise → morning 6-8 or late afternoon 17-19
   - Meetings → late morning 10-11 or afternoon 14-16, default 30min
   - Study → afternoon or evening, consistent daily time
   - Hobby → evening or weekends as wind-down
3. Leave 15min buffer between tasks so the user isn't rushing
4. Don't schedule anything before 6am or after 11pm unless the user explicitly says
5. Follow the user's routine from their typical schedule above — if they say they usually work out at 6pm, don't schedule it at 8am
6. If the user specifies a time but it's already taken, pick the nearest free slot (use the FREE TIME list above to find it)
7. When the user asks "find me time for X", look at the FREE TIME TODAY section and suggest the best-matching slot
8. Consider the user's MOST ACTIVE HOURS from their learned patterns — they tend to prefer those times

TASK TITLE QUALITY — make every task title specific and descriptive:
- Deep work: "Deep work: [concrete goal]" (e.g. "Deep work: Design system architecture", "Deep work: Write Q3 planning doc")
- Exercise: "[type of workout]" (e.g. "Morning run 5k", "Gym: upper body", "Evening yoga flow", "Swim laps")
- Meetings: "[purpose] sync/review" (e.g. "Team standup", "1:1 with Manager", "Design review: homepage", "Sprint planning")
- Study: "Study [subject] — [specific topic]" (e.g. "Study Mandarin — lesson 12 vocab", "Study physics — thermodynamics problems")
- Hobby: "[activity]" (e.g. "Read 'Atomic Habits'", "Practice guitar — scales", "Work on portfolio site", "Sketching practice")
- NEVER use generic titles like "Deep Work", "Meeting", "Study", "Exercise", "Hobby" alone — always add the specific goal or activity
- For weekly schedules, vary the tasks each day (don't repeat "Deep work: Project" 5 times identically)

WEEKLY SCHEDULE RULE: When the user says "schedule my week", "make a weekly schedule", or similar, create tasks for ALL 5-7 days (Monday through Sunday) unless they specify otherwise. Fill each day with a balanced mix: typically 1 deep work block, 1 meeting, 1 exercise, and optional study/hobby. The actions array can hold many tasks — don't limit yourself to 1-2 days. Aim for a complete, realistic week.

Available tags: "deep-work", "meeting", "exercise", "study", "hobby" (default: "meeting")
Default duration: 60 minutes. Default time: 09:00.
Tomorrow = next day from today. Day names = next occurrence.

You MUST return your response as VALID JSON with this exact format:
{
  "text": "Your friendly, natural response explaining what was done or answering the question. Use markdown.",
  "actions": [
    {
      "type": "createTask",
      "data": {
        "title": "Task Title",
        "date": "YYYY-MM-DD",
        "startTime": "HH:MM",
        "endTime": "HH:MM",
        "tag": "tag-name"
      }
    }
  ]
}

AVAILABLE ACTION TYPES:
- "createTask": create a new task. data: { title, date, startTime, endTime, tag }
- "updateTask": modify an existing task. data: { id, changes: { title?, date?, startTime?, endTime?, tag?, completed? } }
- "deleteTask": delete a single task by its id. data: { id }
- "clearAllTasks": delete EVERY task on the schedule (keeps whiteboard ideas). data: {} (empty)
- "clearDate": delete all tasks on a specific date. data: { date: "YYYY-MM-DD" }
- "clearCompletedTasks": delete all completed tasks. data: {} (empty)
- "deleteTasksByTag": delete all tasks of a specific tag type. data: { tag: "tag-name" }
- "deleteTasksByQuery": delete all tasks whose title contains the given text. data: { query: "search text" }

EXAMPLES:
- "Clear my whole schedule" → use "clearAllTasks"
- "Delete everything on Friday" → use { type: "clearDate", data: { date: "2026-06-12" } }
- "Remove all completed tasks" → use "clearCompletedTasks"
- "Delete all my gym tasks" → use { type: "deleteTasksByTag", data: { tag: "exercise" } }
- "Delete any task about laundry" → use { type: "deleteTasksByQuery", data: { query: "laundry" } }

IMPORTANT: Return ONLY valid JSON. No markdown fences, no extra text.`;

  return callAIChat(systemPrompt, fileAwareUserText, hasImageAttachment ? attachedFile : null);
}

function callAIChat(systemPrompt, userText, attachedImage) {
  if (state.apiProvider === 'gemini') return callGeminiChat(systemPrompt, userText, attachedImage);
  return callGroqChat(systemPrompt, userText, attachedImage);
}

function callGroqChat(systemPrompt, userText, attachedImage) {
  const hasVision = attachedImage && attachedImage.isImage;

  // Check if selected model supports vision
  if (hasVision && !GROQ_VISION_MODELS.includes(state.apiModel)) {
    return Promise.reject(new Error(`The selected model (${state.apiModel}) doesn't support image analysis. Switch to "Llama 4 Scout 17B" in Settings to use image attachments.`));
  }

  // Build messages array — Groq vision requires content as array when including images
  let messages;
  if (hasVision) {
    // Groq accepts full data URLs (e.g., "data:image/jpeg;base64,/9j...")
    const dataUrl = attachedImage.data;
    messages = [
      { role: 'system', content: systemPrompt },
      {
        role: 'user',
        content: [
          { type: 'text', text: userText },
          {
            type: 'image_url',
            image_url: {
              url: dataUrl
            }
          }
        ]
      }
    ];
  } else {
    messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userText }
    ];
  }

  // Vision models on Groq may not support response_format, so omit when sending images
  const body = {
    model: state.apiModel,
    messages,
    temperature: 0.3,
    max_tokens: 3000,
  };
  if (!hasVision) {
    body.response_format = { type: 'json_object' };
  }

  return fetchWithRetry('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${state.apiKey}`
    },
    body: JSON.stringify(body)
  }).then(async res => {
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new Error(`API error: ${res.status}${body ? ' — ' + body.slice(0, 200) : ''}`);
    }
    return res.json();
  }).then(data => {
    const raw = data?.choices?.[0]?.message?.content;
    if (!raw) throw new Error('Empty response from AI');
    let parsed;
    try { parsed = JSON.parse(raw); } catch (e) {
      const m = raw.match(/\{[\s\S]*\}/);
      if (m) parsed = JSON.parse(m[0]);
      else throw new Error('Invalid response format from AI');
    }
    if (!parsed.text) throw new Error('AI returned incomplete response');
    return { text: parsed.text, actions: parsed.actions || [] };
  });
}

function callGeminiChat(systemPrompt, userText, attachedImage) {
  const hasVision = attachedImage && attachedImage.isImage;

  // Build conversation history for Gemini (maps 'assistant' → 'model')
  const historyMessages = aiChatHistory.slice(-10).map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.text }]
  }));

  // Build the current user message parts
  let userParts;
  if (hasVision) {
    const base64Data = attachedImage.data.split(',')[1];
    userParts = [
      { text: userText },
      {
        inline_data: {
          mime_type: attachedImage.type,
          data: base64Data
        }
      }
    ];
  } else {
    userParts = [{ text: userText }];
  }

  return fetchWithRetry(`https://generativelanguage.googleapis.com/v1beta/models/${state.apiModel}:generateContent?key=${state.apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: systemPrompt }] },
      contents: [
        ...historyMessages,
        { role: 'user', parts: userParts }
      ],
      generationConfig: { temperature: 0.3, maxOutputTokens: 3000 }
    })
  }).then(async res => {
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new Error(`API error: ${res.status}${body ? ' — ' + body.slice(0, 200) : ''}`);
    }
    return res.json();
  }).then(data => {
    const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!raw) throw new Error('Empty response from AI');
    let parsed;
    try { parsed = JSON.parse(raw); } catch (e) {
      // Try extracting from markdown code fence
      const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (fenced) try { parsed = JSON.parse(fenced[1]); } catch (e2) {}
      // Fall back to object extraction
      if (!parsed) {
        const objMatch = raw.match(/\{[\s\S]*\}/);
        if (objMatch) parsed = JSON.parse(objMatch[0]);
        else throw new Error('Invalid response format from AI');
      }
    }
    if (!parsed.text) throw new Error('AI returned incomplete response');
    return { text: parsed.text, actions: parsed.actions || [] };
  });
}

// ─── KEYBOARD SHORTCUTS ────────────────────────────────────
document.addEventListener('keydown', (e) => {
  if ((e.metaKey || e.ctrlKey) && e.key === 'i') {
    e.preventDefault();
    if (!state.taskModalOpen && !state.helpModalOpen) toggleAIChat();
  }
  if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
    e.preventDefault();
    if (!state.taskModalOpen && !state.helpModalOpen && !state.aiChatOpen) toggleCmdPalette();
  }
  if (e.key === 'Escape') {
    if (state.cmdPaletteOpen) hideCmdPalette();
    else if (state.aiChatOpen) hideAIChat();
    else if (state.taskModalOpen) hideTaskModal();
    else if (state.helpModalOpen) hideHelpModal();
  }
  if (e.key === 'Enter' && state.cmdPaletteOpen && dom.cmdInput) {
    if (!dom.cmdResults.querySelector('.cmd-result-item')) processCommand(dom.cmdInput.value);
  }
  if (e.key === 'Enter' && state.aiChatOpen && dom.aiChatInput && !e.shiftKey) {
    e.preventDefault();
    sendAIMessage();
  }
  if (e.key === '?' && !e.metaKey && !e.ctrlKey && !e.target.closest('input, textarea, select')) {
    e.preventDefault();
    if (!state.taskModalOpen) state.helpModalOpen ? hideHelpModal() : showHelpModal();
  }
});

// ─── FIT TEXT: auto-scale text to container ────────────────
// Shrinks .task-title text to fit within the container when text overflows.
// Only sets inline font-size when a shrink is actually needed.
function fitText(container, maxSize, minSize) {
  const titleEl = container.querySelector('.task-title') || container.querySelector('.tct-title') || container.querySelector('.act-card-title');
  if (!titleEl) return;
  
  maxSize = maxSize || 14;
  minSize = minSize || 9;
  
  // Clear any previous inline size to get natural measurements
  titleEl.style.fontSize = '';
  
  const textWidth = titleEl.scrollWidth;
  const availableWidth = titleEl.clientWidth;
  
  // Only scale down when text actually overflows
  if (textWidth > availableWidth && availableWidth > 0) {
    const ratio = availableWidth / textWidth;
    let newSize = Math.max(minSize, Math.floor(maxSize * ratio));
    titleEl.style.fontSize = newSize + 'px';
  }
  // If text fits naturally, leave fontSize unset so CSS cascade handles it
}

function fitTextAll(selector, maxSize, minSize) {
  document.querySelectorAll(selector).forEach(el => fitText(el, maxSize, minSize));
}

window.fitTextAll = fitTextAll;
window.fitText = fitText;

// ─── ACCESS HUB: position items in an auto‑adjusting arc ──
function positionAccessItems() {
  const hub = document.getElementById('accessHub');
  const allItems = document.querySelectorAll('.access-item');
  if (!hub || !allItems.length) return;
  const btn = document.getElementById('accessMain');
  if (!btn) return;
  const items = Array.from(allItems).filter(el => el.style.display !== 'none');
  if (!items.length) return;

  const S = 40;
  const N = items.length;
  const br = btn.getBoundingClientRect();
  const cx = br.left + br.width / 2;
  const cy = br.top + br.height / 2;

  const maxL = cx - S / 2;
  const maxT = cy - S / 2;

  // 90-degree arc to the north-west (from 180° left to 270° up)
  const startAngle = Math.PI;      // 180° — left
  const arcSpan = Math.PI / 2;     // 90° — north-west quadrant
  const step = N > 1 ? arcSpan / (N - 1) : 0;
  let maxR = Infinity;
  for (let i = 0; i < N; i++) {
    const a = startAngle + i * step;
    const dx = Math.cos(a), dy = Math.sin(a);
    let r = Infinity;
    if (dx < -0.001) r = Math.min(r, maxL / -dx);
    if (dy < -0.001) r = Math.min(r, maxT / -dy);
    maxR = Math.min(maxR, r);
  }

  const R = Math.round(Math.max(48, Math.min(100, maxR)));

  const hr = hub.getBoundingClientRect();
  const ox = hr.right - 26;
  const oy = hr.bottom - 26;

  // Hide positions for invisible items
  allItems.forEach(el => { if (el.style.display === 'none') { el.style.setProperty('--x', '0px'); el.style.setProperty('--y', '0px'); } });
  for (let i = 0; i < N; i++) {
    const a = startAngle + i * step;
    items[i].style.setProperty('--x', Math.round(cx + Math.cos(a) * R + S / 2 - ox) + 'px');
    items[i].style.setProperty('--y', Math.round(cy + Math.sin(a) * R + S / 2 - oy) + 'px');
    items[i].style.setProperty('--dl-open', (0.02 + i * 0.035).toFixed(3) + 's');
    items[i].style.setProperty('--dl', ((N - 1 - i) * 0.035 + 0.02).toFixed(3) + 's');
  }
}

// Call on load and resize — items reposition so nothing clips
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', positionAccessItems);
} else {
  positionAccessItems();
}
window.addEventListener('resize', positionAccessItems);
window.positionAccessItems = positionAccessItems;

// ─── ACCESS HUB: apply user config from settings ────────────
function applyAccessHubConfig() {
  const items = document.querySelectorAll('.access-item');
  if (!items.length) return;
  const cfg = state.accessBubbles || {};
  items.forEach(el => {
    const key = el.dataset.action;
    const overrides = cfg[key];
    if (!overrides) {
      el.style.display = '';
      const icon = el.querySelector('.access-item-icon');
      if (icon) icon.style.background = '';
      const label = el.querySelector('.access-item-label');
      if (label) label.textContent = el.title || '';
      return;
    }
    el.style.display = overrides.visible === false ? 'none' : '';
    const icon = el.querySelector('.access-item-icon');
    if (icon && overrides.color) icon.style.background = overrides.color;
    const label = el.querySelector('.access-item-label');
    if (label && overrides.label) label.textContent = overrides.label;
  });
  positionAccessItems();
}

// Re-apply after DOM is ready (catches any config from loadState)
const _origLoadState = loadState;
loadState = function() {
  _origLoadState();
  if (document.querySelector('.access-item')) applyAccessHubConfig();
};

window.applyAccessHubConfig = applyAccessHubConfig;

function renderBubbleConfigInSettings() {
  const container = document.getElementById('bubbleConfigList');
  if (!container) return;
  const cfg = state.accessBubbles || {};
  container.innerHTML = '';
  Object.entries(DEFAULT_BUBBLES).forEach(([key, def]) => {
    const overrides = cfg[key] || {};
    const visible = overrides.visible !== false;
    const label = overrides.label || def.label;
    const color = overrides.color || def.color;
    const row = document.createElement('div');
    row.style.cssText = 'display:flex;align-items:center;gap:8px;padding:6px 8px;background:var(--surface);border-radius:8px;border:1px solid var(--border);';
    row.innerHTML = `
      <label style="display:flex;align-items:center;gap:4px;cursor:pointer;flex-shrink:0;font-size:13px;">
        <input type="checkbox" id="bubble-visible-${key}" data-bubble-config="${key}" ${visible ? 'checked' : ''}>
        Show
      </label>
      <input type="text" id="bubble-label-${key}" data-bubble-config="${key}" value="${label}" placeholder="${def.label}" style="flex:1;min-width:0;padding:4px 6px;border:1px solid var(--border);border-radius:4px;background:var(--bg);font-size:13px;">
      <input type="color" id="bubble-color-${key}" data-bubble-config="${key}" value="${color}" style="width:32px;height:28px;padding:0;border:1px solid var(--border);border-radius:4px;cursor:pointer;background:none;">
    `;
    container.appendChild(row);
  });
}

// ─── COLOR PICKER COMPONENT ────────────────────────────────
function renderHueStrip(canvas) {
  const ctx = canvas.getContext('2d');
  const h = canvas.height;
  for (let y = 0; y < h; y++) {
    const hue = (y / h) * 360;
    const hex = hsvToHex(hue, 1, 1);
    ctx.fillStyle = hex;
    ctx.fillRect(0, y, canvas.width, 1);
  }
}

function renderColorTriangle(canvas, hue) {
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  const imgData = ctx.createImageData(W, H);
  const data = imgData.data;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const u = x / W, v = y / H;
      if (u + v > 1) {
        // Outside triangle - transparent
        const idx = (y * W + x) * 4;
        data[idx] = 0; data[idx+1] = 0; data[idx+2] = 0; data[idx+3] = 0;
        continue;
      }
      const s = 1 - u;
      const val = 1 - v;
      const hex = hsvToHex(hue, s, val);
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      const idx = (y * W + x) * 4;
      data[idx] = r; data[idx+1] = g; data[idx+2] = b; data[idx+3] = 255;
    }
  }
  ctx.putImageData(imgData, 0, 0);
}

function getTriangleColor(canvas, hue, mx, my) {
  const W = canvas.width, H = canvas.height;
  const u = mx / W, v = my / H;
  if (u + v > 1) return null;
  const s = 1 - u;
  const val = 1 - v;
  return hsvToHex(hue, s, val);
}

function getHueFromY(canvas, my) {
  return Math.max(0, Math.min(360, (my / canvas.height) * 360));
}

function openCardColorPicker(anchorEl, tag, currentHex, onPick) {
  const existing = document.querySelector('.card-color-popover');
  if (existing) existing.remove();

  let hue = hexToHsv(currentHex).h;
  let currentColor = currentHex;

  const popover = document.createElement('div');
  popover.className = 'card-color-popover';
  popover.innerHTML = `<div class="ccp-header">
      <span class="ccp-swatch" style="background:${currentHex}"></span>
      <input type="text" class="ccp-hex" value="${currentHex}" maxlength="7" spellcheck="false">
      <button class="btn btn-ghost ccp-close"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
    </div>
    <div class="ccp-canvas-wrap">
      <canvas class="ccp-hue" width="16" height="150"></canvas>
      <canvas class="ccp-triangle" width="180" height="150"></canvas>
    </div>
    <div class="ccp-footer">
      <span class="ccp-tag-label">${TAG_LABELS[tag] || tag}</span>
      <button class="btn btn-ghost ccp-reset">Reset</button>
    </div>`;

  document.body.appendChild(popover);

  const hueCanvas = popover.querySelector('.ccp-hue');
  const triCanvas = popover.querySelector('.ccp-triangle');
  const swatch = popover.querySelector('.ccp-swatch');
  const hexInput = popover.querySelector('.ccp-hex');
  const closeBtn = popover.querySelector('.ccp-close');
  const resetBtn = popover.querySelector('.ccp-reset');

  hueCanvas.width = 16; hueCanvas.height = 150;
  triCanvas.width = 180; triCanvas.height = 150;

  let hueDrag = false, triDrag = false;

  function updatePicker() {
    renderHueStrip(hueCanvas);
    renderColorTriangle(triCanvas, hue);
    swatch.style.background = currentColor;
    hexInput.value = currentColor;
    drawMarkers();
  }

  function drawMarkers() {
    const hsv = hexToHsv(currentColor);
    const hsvHue = hsv.h;

    // Hue marker
    const ctx = hueCanvas.getContext('2d');
    const hy = (hsvHue / 360) * hueCanvas.height;
    ctx.clearRect(0, 0, hueCanvas.width, hueCanvas.height);
    renderHueStrip(hueCanvas);
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, hy - 3, hueCanvas.width, 6);

    // Triangle marker
    const tCtx = triCanvas.getContext('2d');
    renderColorTriangle(triCanvas, hue);
    const u = 1 - hsv.s, v = 1 - hsv.v;
    const mx = u * triCanvas.width;
    const my = v * triCanvas.height;
    if (u + v <= 1) {
      tCtx.beginPath();
      tCtx.arc(mx, my, 5, 0, Math.PI * 2);
      tCtx.strokeStyle = '#fff';
      tCtx.lineWidth = 2;
      tCtx.stroke();
      tCtx.beginPath();
      tCtx.arc(mx, my, 4, 0, Math.PI * 2);
      tCtx.strokeStyle = '#000';
      tCtx.lineWidth = 1;
      tCtx.stroke();
    }
  }

  function pickColor() {
    const allColors = { ...cardColors };
    allColors[tag] = {
      light: currentColor,
      dark: DEFAULT_TAG_COLORS[tag]?.dark || lightenColor(currentColor, 0.45),
    };
    saveCardColors(allColors);
    onPick(currentColor);
  }

  // Hue bar events
  function onHueDown(clientY) {
    hueDrag = true;
    const rect = hueCanvas.getBoundingClientRect();
    hue = getHueFromY(hueCanvas, clientY - rect.top);
    currentColor = hsvToHex(hue, hexToHsv(currentColor).s, hexToHsv(currentColor).v);
    updatePicker();
  }

  function onTriDown(clientX, clientY) {
    triDrag = true;
    const rect = triCanvas.getBoundingClientRect();
    const mx = clientX - rect.left;
    const my = clientY - rect.top;
    const c = getTriangleColor(triCanvas, hue, mx, my);
    if (c) { currentColor = c; updatePicker(); }
  }

  function onMove(clientX, clientY) {
    if (hueDrag) {
      const rect = hueCanvas.getBoundingClientRect();
      hue = getHueFromY(hueCanvas, Math.max(0, Math.min(clientY - rect.top, hueCanvas.height)));
      currentColor = hsvToHex(hue, hexToHsv(currentColor).s, hexToHsv(currentColor).v);
      updatePicker();
    }
    if (triDrag) {
      const rect = triCanvas.getBoundingClientRect();
      const mx = Math.max(0, Math.min(clientX - rect.left, triCanvas.width));
      const my = Math.max(0, Math.min(clientY - rect.top, triCanvas.height));
      const c = getTriangleColor(triCanvas, hue, mx, my);
      if (c) { currentColor = c; updatePicker(); }
    }
  }

  function onUp() {
    if (hueDrag || triDrag) {
      hueDrag = false; triDrag = false;
      pickColor();
    }
  }

  hueCanvas.addEventListener('mousedown', (e) => onHueDown(e.clientY));
  triCanvas.addEventListener('mousedown', (e) => onTriDown(e.clientX, e.clientY));
  document.addEventListener('mousemove', (e) => onMove(e.clientX, e.clientY));
  document.addEventListener('mouseup', onUp);

  hueCanvas.addEventListener('touchstart', (e) => { e.preventDefault(); const t = e.touches[0]; onHueDown(t.clientY); }, { passive: false });
  triCanvas.addEventListener('touchstart', (e) => { e.preventDefault(); const t = e.touches[0]; onTriDown(t.clientX, t.clientY); }, { passive: false });
  document.addEventListener('touchmove', (e) => { const t = e.touches[0]; onMove(t.clientX, t.clientY); }, { passive: false });
  document.addEventListener('touchend', onUp);

  // Hex input
  hexInput.addEventListener('input', () => {
    let val = hexInput.value.trim();
    if (/^#[0-9a-f]{6}$/i.test(val)) {
      currentColor = val.toLowerCase();
      hue = hexToHsv(currentColor).h;
      updatePicker();
      pickColor();
    }
  });

  closeBtn.addEventListener('click', () => popover.remove());
  resetBtn.addEventListener('click', () => {
    const def = DEFAULT_TAG_COLORS[tag];
    if (def) {
      currentColor = def.light;
      hue = hexToHsv(currentColor).h;
      updatePicker();
      pickColor();
    }
  });

  // Position
  requestAnimationFrame(() => {
    const anchorRect = anchorEl.getBoundingClientRect();
    const pw = 220, ph = popover.offsetHeight || 240;
    let left = anchorRect.left;
    let top = anchorRect.bottom + 4;
    if (left + pw > window.innerWidth - 8) left = window.innerWidth - pw - 8;
    if (top + ph > window.innerHeight - 8) top = anchorRect.top - ph - 4;
    popover.style.left = left + 'px';
    popover.style.top = top + 'px';
    popover.classList.add('active');
    updatePicker();
  });

  // Close on click outside
  setTimeout(() => {
    document.addEventListener('click', closeOutside, true);
  }, 0);
  function closeOutside(e) {
    if (!popover.contains(e.target) && e.target !== anchorEl) {
      popover.remove();
      document.removeEventListener('click', closeOutside, true);
    }
  }
}

/* ════════════════════════════════════════════════════════════
   SPOTIFY EMBED MODULE
   Minimal multi-playlist manager using Spotify Embed iframes
   ════════════════════════════════════════════════════════════ */

const SP_PLAYLISTS_KEY = 'haven-spotify-playlists';
const SP_ACTIVE_KEY = 'haven-spotify-active';
const SP_COLLAPSED_KEY = 'haven-spotify-collapsed';

let spPlaylists = [];
let spActiveId = null;
let spIsPlaying = false;
let spCollapsed = false;

function spInit() {
  spLoadState();
  spRenderSidebar();
  spRenderList();
  spUpdateNav();
  var el = document.getElementById('spSidebar');
  if (el && spCollapsed) el.classList.add('collapsed');
  document.addEventListener('keydown', spOnKey);
}

function spLoadState() {
  try { spPlaylists = JSON.parse(localStorage.getItem(SP_PLAYLISTS_KEY)) || []; }
  catch { spPlaylists = []; }
  spActiveId = localStorage.getItem(SP_ACTIVE_KEY) || null;
  spCollapsed = localStorage.getItem(SP_COLLAPSED_KEY) === '1';
}

function spSavePlaylists() {
  localStorage.setItem(SP_PLAYLISTS_KEY, JSON.stringify(spPlaylists));
}

function spSaveActive() {
  if (spActiveId) localStorage.setItem(SP_ACTIVE_KEY, spActiveId);
  else localStorage.removeItem(SP_ACTIVE_KEY);
}

function spRenderSidebar() {
  const empty = document.getElementById('spEmpty');
  const wrap = document.getElementById('spEmbedWrap');
  const embed = document.getElementById('spEmbed');
  const controls = document.getElementById('spControls');
  if (!empty || !wrap || !embed) return;
  const active = spPlaylists.find(p => p.id === spActiveId);
  if (active) {
    empty.style.display = 'none';
    wrap.style.display = 'block';
    embed.src = active.embedUrl;
    if (controls) controls.style.display = 'flex';
  } else {
    empty.style.display = 'flex';
    wrap.style.display = 'none';
    if (controls) controls.style.display = 'none';
  }
  spUpdateNav();
}

function spPostMessage(cmd) {
  document.querySelectorAll('#spEmbed, #spModalEmbed').forEach(ifr => {
    if (ifr.src && ifr.src.includes('spotify.com')) {
      try { ifr.contentWindow.postMessage({command: cmd}, '*'); } catch {}
    }
  });
}

function spTogglePlay() {
  spIsPlaying = !spIsPlaying;
  const btn = document.getElementById('spPlayBtn');
  if (btn) {
    const playIcon = btn.querySelector('.sp-play-icon');
    const pauseIcon = btn.querySelector('.sp-pause-icon');
    if (playIcon) playIcon.style.display = spIsPlaying ? 'none' : '';
    if (pauseIcon) pauseIcon.style.display = spIsPlaying ? '' : 'none';
  }
  spPostMessage('togglePlay');
}

function spSidePrev() { spSideNav(-1); }
function spSideNext() { spSideNav(1); }

function spSideNav(dir) {
  if (!spPlaylists.length) return;
  let idx = spPlaylists.findIndex(p => p.id === spActiveId);
  if (idx < 0) idx = 0;
  idx = (idx + dir + spPlaylists.length) % spPlaylists.length;
  spActiveId = spPlaylists[idx].id;
  spSaveActive();
  spIsPlaying = false;
  const btn = document.getElementById('spPlayBtn');
  if (btn) {
    const playIcon = btn.querySelector('.sp-play-icon');
    const pauseIcon = btn.querySelector('.sp-pause-icon');
    if (playIcon) playIcon.style.display = '';
    if (pauseIcon) pauseIcon.style.display = 'none';
  }
  spRenderSidebar();
  spRenderList();
  spUpdateNav();
  const modalEmbed = document.getElementById('spModalEmbed');
  const playlist = spPlaylists.find(p => p.id === spActiveId);
  if (modalEmbed && playlist) modalEmbed.src = playlist.embedUrl;
}

function spUpdateNav() {
  const prev = document.getElementById('spNavPrev');
  const next = document.getElementById('spNavNext');
  if (prev) prev.style.display = spPlaylists.length > 1 ? '' : 'none';
  if (next) next.style.display = spPlaylists.length > 1 ? '' : 'none';
}

function spToggleSection(force) {
  spCollapsed = force !== undefined ? force : !spCollapsed;
  localStorage.setItem(SP_COLLAPSED_KEY, spCollapsed ? '1' : '');
  const sidebar = document.getElementById('spSidebar');
  if (sidebar) sidebar.classList.toggle('collapsed', spCollapsed);
}

function spOpenSettings() {
  const overlay = document.getElementById('spOverlay');
  if (!overlay) return;
  overlay.classList.remove('hidden');
  spRenderList();
  const modalEmbed = document.getElementById('spModalEmbed');
  const active = spPlaylists.find(p => p.id === spActiveId);
  if (modalEmbed && active) modalEmbed.src = active.embedUrl;
}

function spCloseSettings() {
  const overlay = document.getElementById('spOverlay');
  if (overlay) overlay.classList.add('hidden');
}

function spAddPlaylist() {
  const input = document.getElementById('spAddInput');
  if (!input) return;
  let val = input.value.trim();
  if (!val) return;
  let playlistId = val;
  let embedUrl = val;
  const match = val.match(/(?:open\.spotify\.com\/(?:embed\/)?playlist\/|spotify:playlist:)([a-zA-Z0-9]+)/);
  if (match) {
    playlistId = match[1];
    embedUrl = 'https://open.spotify.com/embed/playlist/' + playlistId;
  } else if (/^[a-zA-Z0-9]{22}$/.test(val)) {
    playlistId = val;
    embedUrl = 'https://open.spotify.com/embed/playlist/' + playlistId;
  } else if (val.includes('playlist')) {
    const idMatch = val.match(/[a-zA-Z0-9]{22}/);
    if (idMatch) { playlistId = idMatch[0]; embedUrl = 'https://open.spotify.com/embed/playlist/' + playlistId; }
  }
  if (!playlistId || spPlaylists.some(p => p.id === playlistId)) return;
  spPlaylists.push({ id: playlistId, name: 'Playlist ' + playlistId.slice(0, 8), embedUrl });
  spSavePlaylists();
  input.value = '';
  if (!spActiveId) {
    spActiveId = playlistId;
    spSaveActive();
    spRenderSidebar();
  }
  spRenderList();
  spUpdateNav();
}

function spPlayPlaylist(id) {
  spActiveId = id;
  spSaveActive();
  spIsPlaying = false;
  const btn = document.getElementById('spPlayBtn');
  if (btn) {
    const playIcon = btn.querySelector('.sp-play-icon');
    const pauseIcon = btn.querySelector('.sp-pause-icon');
    if (playIcon) playIcon.style.display = '';
    if (pauseIcon) pauseIcon.style.display = 'none';
  }
  const modalEmbed = document.getElementById('spModalEmbed');
  const playlist = spPlaylists.find(p => p.id === id);
  if (modalEmbed && playlist) modalEmbed.src = playlist.embedUrl;
  spRenderSidebar();
  spRenderList();
  spUpdateNav();
}

function spDeletePlaylist(id) {
  spPlaylists = spPlaylists.filter(p => p.id !== id);
  spSavePlaylists();
  if (spActiveId === id) {
    spActiveId = spPlaylists.length ? spPlaylists[0].id : null;
    spSaveActive();
    spRenderSidebar();
  }
  spRenderList();
  spUpdateNav();
}

function spRenamePlaylist(id) {
  const item = document.querySelector('#spList .sp-list-item[data-sp-id="' + id + '"] .sp-name');
  if (!item) return;
  const current = item.textContent;
  const input = document.createElement('input');
  input.type = 'text';
  input.value = current;
  input.className = 'sp-rename-input';
  item.textContent = '';
  item.appendChild(input);
  input.focus();
  input.select();
  function done(name) {
    const p = spPlaylists.find(x => x.id === id);
    if (p) { p.name = name || current; spSavePlaylists(); }
    spRenderList();
  }
  input.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') { e.preventDefault(); done(input.value.trim() || current); }
    if (e.key === 'Escape') { done(current); }
    e.stopPropagation();
  });
  input.addEventListener('blur', function() { done(input.value.trim() || current); });
}

function spRenderList(filter) {
  const container = document.getElementById('spList');
  if (!container) return;
  const items = filter ? spPlaylists.filter(p => p.name.toLowerCase().includes(filter.toLowerCase())) : spPlaylists;
  container.innerHTML = items.map(function(p, i) {
    return '<div class="sp-list-item' + (p.id === spActiveId ? ' active' : '') + '" data-sp-id="' + p.id + '" draggable="true">' +
      '<span class="sp-drag-handle" data-index="' + i + '">' +
        '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="5" r="1.5"/><circle cx="15" cy="5" r="1.5"/><circle cx="9" cy="12" r="1.5"/><circle cx="15" cy="12" r="1.5"/><circle cx="9" cy="19" r="1.5"/><circle cx="15" cy="19" r="1.5"/></svg>' +
      '</span>' +
      '<span class="sp-indicator-dot' + (p.id === spActiveId ? ' on' : '') + '"></span>' +
      '<span class="sp-name" onclick="spRenamePlaylist(\'' + p.id + '\')">' + escapeHtml(p.name) + '</span>' +
      '<button class="sp-list-play-btn" onclick="event.stopPropagation();spPlayPlaylist(\'' + p.id + '\')" title="Play">' +
        '<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><polygon points="8,5 19,12 8,19"/></svg>' +
      '</button>' +
      '<button class="sp-list-del-btn" onclick="event.stopPropagation();spDeletePlaylist(\'' + p.id + '\')" title="Remove">' +
        '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>' +
      '</button>' +
    '</div>';
  }).join('');
  spSetupDragReorder(container);
}

function spSetupDragReorder(container) {
  let dragItem = null;
  container.querySelectorAll('.sp-list-item').forEach(function(item) {
    item.addEventListener('dragstart', function() { dragItem = this; this.style.opacity = '0.4'; });
    item.addEventListener('dragend', function() { this.style.opacity = ''; dragItem = null; container.querySelectorAll('.sp-list-item').forEach(function(el) { el.style.borderTop = ''; }); });
    item.addEventListener('dragover', function(e) { e.preventDefault(); if (dragItem && dragItem !== this) { container.querySelectorAll('.sp-list-item').forEach(function(el) { el.style.borderTop = ''; }); this.style.borderTop = '2px solid #1db954'; } });
    item.addEventListener('dragleave', function() { this.style.borderTop = ''; });
    item.addEventListener('drop', function(e) {
      e.preventDefault(); this.style.borderTop = '';
      if (dragItem && dragItem !== this) {
        var fromId = dragItem.dataset.spId;
        var toId = this.dataset.spId;
        var fromIdx = spPlaylists.findIndex(function(p) { return p.id === fromId; });
        var toIdx = spPlaylists.findIndex(function(p) { return p.id === toId; });
        if (fromIdx >= 0 && toIdx >= 0) {
          var moved = spPlaylists.splice(fromIdx, 1)[0];
          spPlaylists.splice(toIdx, 0, moved);
          spSavePlaylists();
          spRenderList();
        }
      }
    });
  });
}

function spOnKey(e) {
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) return;
  switch (e.key) {
    case ' ': e.preventDefault(); spTogglePlay(); break;
    case 'ArrowLeft': e.preventDefault(); spPostMessage('previous'); break;
    case 'ArrowRight': e.preventDefault(); spPostMessage('next'); break;
  }
}
