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
    mood: data.mood || [],
    env: data.env || [],
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

// ─── SLEEP TARGETS ────────────────────────────────────────────
const SLEEP_TARGET_KEY = 'haven-schedule-sleep-targets';

function loadSleepTargets() {
  try {
    const data = localStorage.getItem(SLEEP_TARGET_KEY);
    return data ? JSON.parse(data) : getDefaultSleepTargets();
  } catch (e) {
    return getDefaultSleepTargets();
  }
}

function saveSleepTargets(targets) {
  try {
    localStorage.setItem(SLEEP_TARGET_KEY, JSON.stringify(targets));
  } catch (e) { /* ignore */ }
}

function getDefaultSleepTargets() {
  return {
    targetBedtime: '23:00',
    targetWakeTime: '07:00',
    targetDuration: 480, // 8 hours in minutes
    windDownReminder: false,
    windDownReminderMins: 30,
  };
}

// ─── SLEEP CONSISTENCY ────────────────────────────────────────
function getSleepConsistencyScore(logs, daysBack) {
  daysBack = daysBack || 7;
  const now = new Date();
  const recent = [];
  for (let i = daysBack - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const ds = formatDate(d);
    const log = getSleepLog(ds);
    if (log) recent.push(log);
  }
  if (recent.length < 3) return null;

  // Calculate variance in bedtimes (converted to minutes from midnight)
  const bedMins = [];
  const wakeMins = [];
  const durs = [];
  for (const log of recent) {
    const [bh, bm] = log.bedtime.split(':').map(Number);
    let bTotal = bh * 60 + bm;
    if (bTotal < 720) bTotal += 1440; // normalize past midnight bedtimes
    bedMins.push(bTotal);
    const [wh, wm] = log.wakeTime.split(':').map(Number);
    wakeMins.push(wh * 60 + wm);
    durs.push(log.duration);
  }

  const bedStdDev = calculateStdDev(bedMins);
  const wakeStdDev = calculateStdDev(wakeMins);
  const durStdDev = calculateStdDev(durs);

  // Score 0-100: lower variance = higher consistency
  const bedScore = Math.max(0, 100 - bedStdDev * 2.5);
  const wakeScore = Math.max(0, 100 - wakeStdDev * 2.5);
  const durScore = Math.max(0, 100 - durStdDev);

  const avgScore = Math.round((bedScore + wakeScore + durScore) / 3);
  return {
    score: avgScore,
    bedVariance: Math.round(bedStdDev),
    wakeVariance: Math.round(wakeStdDev),
    durVariance: Math.round(durStdDev),
    nightsLogged: recent.length
  };
}

function calculateStdDev(values) {
  const avg = values.reduce((s, v) => s + v, 0) / values.length;
  const sqDiffs = values.map(v => Math.pow(v - avg, 2));
  return Math.sqrt(sqDiffs.reduce((s, v) => s + v, 0) / values.length);
}

// ─── SLEEP DEBT ───────────────────────────────────────────────
function getSleepDebt(logs, targets) {
  const targetDur = targets ? targets.targetDuration : 480;
  const now = new Date();
  let totalDebt = 0;
  let daysWithData = 0;
  // Look at last 14 days
  for (let i = 13; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const ds = formatDate(d);
    const log = logs.find(l => l.date === ds);
    if (log) {
      totalDebt += log.duration - targetDur;
      daysWithData++;
    }
  }
  return {
    totalDebt: totalDebt,
    avgSurplus: daysWithData > 0 ? Math.round(totalDebt / daysWithData) : 0,
    daysWithData: daysWithData
  };
}

// ─── SLEEP INSIGHTS ───────────────────────────────────────────
function generateSleepInsights(logs) {
  const insights = [];
  if (logs.length < 3) return [{ icon: '💤', text: 'Log at least 3 nights to see sleep insights.' }];

  // Sort logs by date (most recent first)
  const sorted = [...logs].sort((a, b) => a.date.localeCompare(b.date));

  // 1. Best quality analysis
  const highQuality = sorted.filter(l => l.quality >= 4);
  const lowQuality = sorted.filter(l => l.quality <= 2);
  if (highQuality.length >= 3 && lowQuality.length >= 2) {
    // Compare bedtimes
    const hqBeds = highQuality.map(l => parseTime(l.bedtime));
    const lqBeds = lowQuality.map(l => parseTime(l.bedtime));
    const hqAvg = hqBeds.reduce((s, v) => s + v, 0) / hqBeds.length;
    const lqAvg = lqBeds.reduce((s, v) => s + v, 0) / lqBeds.length;
    const diff = Math.round(Math.abs(hqAvg - lqAvg));
    if (diff >= 30) {
      const hqTime = toTimeStr(Math.round(hqAvg));
      const lqTime = toTimeStr(Math.round(lqAvg));
      insights.push({
        icon: '🌙',
        text: `You sleep better when you go to bed around ${formatTimeAMPM(hqTime)} vs ${formatTimeAMPM(lqTime)}.`
      });
    }
  }

  // 2. Duration sweet spot
  const durBuckets = {};
  for (const log of sorted) {
    const bucket = Math.round(log.duration / 30) * 30; // round to nearest 30 min
    if (!durBuckets[bucket]) durBuckets[bucket] = { count: 0, totalQ: 0 };
    durBuckets[bucket].count++;
    durBuckets[bucket].totalQ += log.quality;
  }
  let bestBucket = null;
  let bestAvgQ = 0;
  for (const [dur, data] of Object.entries(durBuckets)) {
    if (data.count >= 2) {
      const avgQ = data.totalQ / data.count;
      if (avgQ > bestAvgQ) {
        bestAvgQ = avgQ;
        bestBucket = parseInt(dur);
      }
    }
  }
  if (bestBucket) {
    insights.push({
      icon: '⏰',
      text: `Your optimal sleep duration seems to be around ${formatSleepMinutes(bestBucket)} — your highest quality nights.`
    });
  }

  // 3. Consistency matters
  const consistency = getSleepConsistencyScore(logs);
  if (consistency && consistency.nightsLogged >= 5) {
    if (consistency.score >= 80) {
      insights.push({
        icon: '🌟',
        text: `Great consistency! Your bedtime varies by only ~${consistency.bedVariance}min.`
      });
    } else if (consistency.score < 50) {
      insights.push({
        icon: '📊',
        text: `Your bedtime varies by ~${consistency.bedVariance}min. A regular wind-down routine can improve sleep quality.`
      });
    }
  }

  // 4. Weekday vs weekend
  const weekdayLogs = sorted.filter(l => {
    const d = new Date(l.date + 'T12:00:00');
    const day = d.getDay();
    return day >= 1 && day <= 5;
  });
  const weekendLogs = sorted.filter(l => {
    const d = new Date(l.date + 'T12:00:00');
    return d.getDay() === 0 || d.getDay() === 6;
  });
  if (weekdayLogs.length >= 3 && weekendLogs.length >= 2) {
    const wdAvg = weekdayLogs.reduce((s, l) => s + l.duration, 0) / weekdayLogs.length;
    const weAvg = weekendLogs.reduce((s, l) => s + l.duration, 0) / weekendLogs.length;
    if (Math.abs(wdAvg - weAvg) >= 60) {
      insights.push({
        icon: '📅',
        text: `You sleep ${formatSleepMinutes(Math.round(Math.abs(wdAvg - weAvg)))} ${weAvg > wdAvg ? 'more' : 'less'} on weekends vs weekdays.`
      });
    }
  }

  // 5. Recent trend
  const recent7 = sorted.slice(-7);
  if (recent7.length >= 3) {
    const first3 = recent7.slice(0, 3);
    const last3 = recent7.slice(-3);
    const avgFirst = first3.reduce((s, l) => s + l.duration, 0) / first3.length;
    const avgLast = last3.reduce((s, l) => s + l.duration, 0) / last3.length;
    const diff = Math.round(avgLast - avgFirst);
    if (Math.abs(diff) >= 30) {
      insights.push({
        icon: diff > 0 ? '📈' : '📉',
        text: `Your sleep duration has ${diff > 0 ? 'increased' : 'decreased'} by ~${formatSleepMinutes(Math.abs(diff))} over the last week.`
      });
    }
  }

  // 6. Quality vs duration check
  if (recent7.length >= 3) {
    const highDur = recent7.filter(l => l.duration >= 420); // 7h+
    const lowDur = recent7.filter(l => l.duration < 420);
    if (highDur.length >= 2 && lowDur.length >= 2) {
      const hqAvg = highDur.reduce((s, l) => s + l.quality, 0) / highDur.length;
      const lqAvg = lowDur.reduce((s, l) => s + l.quality, 0) / lowDur.length;
      if (hqAvg - lqAvg >= 1) {
        insights.push({
          icon: '💪',
          text: `Nights with 7h+ sleep score ${(hqAvg - lqAvg).toFixed(1)} points higher in quality than shorter nights.`
        });
      }
    }
  }

  if (insights.length === 0) {
    insights.push({ icon: '📝', text: 'Keep logging to receive personalized sleep insights!' });
  }

  return insights.slice(0, 5); // Max 5 insights
}

function formatTimeAMPM(timeStr) {
  const [h, m] = timeStr.split(':').map(Number);
  const ampm = h < 12 ? 'AM' : 'PM';
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, '0')}${ampm}`;
}


const TAG_ORDER = ['deep-work', 'meeting', 'exercise', 'study', 'hobby'];
const BUILTIN_TAGS = ['deep-work', 'meeting', 'exercise', 'study', 'hobby'];

const ACCENT_PALETTE = [
  { name: 'Rose', dark: '#e8b8c0', light: '#905a68', group: 'pink' },
  { name: 'Blush', dark: '#e8c0d0', light: '#905a6e', group: 'pink' },
  { name: 'Coral', dark: '#e8a8a0', light: '#a04840', group: 'pink' },
  { name: 'Bubblegum', dark: '#e8b0d0', light: '#904870', group: 'pink' },
  { name: 'Peach', dark: '#e8d0b8', light: '#90784a', group: 'peach' },
  { name: 'Apricot', dark: '#e8c8a0', light: '#906040', group: 'peach' },
  { name: 'Cantaloupe', dark: '#e8d8b0', light: '#907848', group: 'peach' },
  { name: 'Nectarine', dark: '#e8c0a0', light: '#906048', group: 'peach' },
  { name: 'Gold', dark: '#e8d8a8', light: '#90804a', group: 'yellow' },
  { name: 'Butter', dark: '#e8e0a0', light: '#908040', group: 'yellow' },
  { name: 'Lemon', dark: '#e8e8b0', light: '#909048', group: 'yellow' },
  { name: 'Honey', dark: '#e8d090', light: '#907840', group: 'yellow' },
  { name: 'Mint', dark: '#b8e8c8', light: '#5a906a', group: 'green' },
  { name: 'Sage', dark: '#b4ccbc', light: '#4d6356', group: 'green' },
  { name: 'Pine', dark: '#90b8a0', light: '#386050', group: 'green' },
  { name: 'Lime', dark: '#c8e0a0', light: '#608040', group: 'green' },
  { name: 'Teal', dark: '#a8d8d0', light: '#487a7e', group: 'teal' },
  { name: 'Ocean', dark: '#90c8d0', light: '#387080', group: 'teal' },
  { name: 'Seafoam', dark: '#a0d8c8', light: '#407870', group: 'teal' },
  { name: 'Lagoon', dark: '#88c8c8', light: '#387070', group: 'teal' },
  { name: 'Sky', dark: '#a8c8e8', light: '#4878a0', group: 'blue' },
  { name: 'Blue', dark: '#b0bce8', light: '#505c90', group: 'blue' },
  { name: 'Indigo', dark: '#a0a8e0', light: '#404890', group: 'blue' },
  { name: 'Denim', dark: '#8898c8', light: '#384878', group: 'blue' },
  { name: 'Lavender', dark: '#c8b8e8', light: '#6a5a90', group: 'purple' },
  { name: 'Plum', dark: '#d0b8e8', light: '#6e4a90', group: 'purple' },
  { name: 'Violet', dark: '#c0a8e0', light: '#604890', group: 'purple' },
  { name: 'Mauve', dark: '#d8b8d0', light: '#785878', group: 'purple' },
  { name: 'Ruby', dark: '#d8a0a0', light: '#784848', group: 'red' },
  { name: 'Brick', dark: '#d0a090', light: '#784838', group: 'red' },
  { name: 'Apple', dark: '#e0a8a0', light: '#804840', group: 'red' },
  { name: 'Wine', dark: '#c898a0', light: '#704850', group: 'red' },
  { name: 'Taupe', dark: '#c8b8b0', light: '#786860', group: 'neutral' },
  { name: 'Slate', dark: '#a8b8c0', light: '#486070', group: 'neutral' },
  { name: 'Charcoal', dark: '#9aa8b0', light: '#485868', group: 'neutral' },
  { name: 'Cream', dark: '#e8e0d8', light: '#908070', group: 'neutral' },
];

const ACCENT_GROUPS = [
  { id: 'pink', label: 'Pinks' },
  { id: 'red', label: 'Reds' },
  { id: 'peach', label: 'Peaches' },
  { id: 'yellow', label: 'Yellows' },
  { id: 'green', label: 'Greens' },
  { id: 'teal', label: 'Teals' },
  { id: 'blue', label: 'Blues' },
  { id: 'purple', label: 'Purples' },
  { id: 'neutral', label: 'Neutrals' },
];

// ─── SUBCATEGORIES (editable, localStorage-backed) ──────────
const SUBCATEGORIES_KEY = 'haven-subcategories';

function getDefaultSubcategories() {
  return {
    'deep-work': ['Coding', 'Writing', 'Design', 'Research', 'Planning', 'Deep Reading'],
    'meeting': ['Team Standup', '1:1', 'Client Call', 'Brainstorm', 'Review', 'Planning', 'Retro'],
    'exercise': ['Chest Day', 'Back Day', 'Leg Day', 'Shoulder Day', 'Arm Day', 'Cardio', 'HIIT', 'Yoga', 'Stretching', 'Running', 'Swimming', 'Cycling', 'Full Body'],
    'study': ['Math', 'Science', 'Language', 'History', 'Programming', 'Reading', 'Exam Prep', 'Coursework'],
    'hobby': ['Music', 'Art', 'Gaming', 'Reading', 'Cooking', 'Photography', 'Gardening', 'DIY', 'Writing'],
  };
}

function loadSubcategories() {
  try {
    const data = localStorage.getItem(SUBCATEGORIES_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      // Merge with defaults so new categories always have defaults
      const defaults = getDefaultSubcategories();
      for (const tag of Object.keys(defaults)) {
        if (!parsed[tag]) parsed[tag] = [...defaults[tag]];
      }
      return parsed;
    }
  } catch (e) { /* ignore */ }
  return getDefaultSubcategories();
}

function saveSubcategories(subcats) {
  try {
    localStorage.setItem(SUBCATEGORIES_KEY, JSON.stringify(subcats));
  } catch (e) { /* ignore */ }
}

function addSubcategory(tag, name) {
  const subcats = loadSubcategories();
  if (!subcats[tag]) subcats[tag] = [];
  if (!subcats[tag].includes(name)) {
    subcats[tag].push(name);
    saveSubcategories(subcats);
  }
  return subcats;
}

function removeSubcategory(tag, name) {
  const subcats = loadSubcategories();
  if (subcats[tag]) {
    subcats[tag] = subcats[tag].filter(s => s !== name);
    saveSubcategories(subcats);
  }
  return subcats;
}

function renameSubcategory(tag, oldName, newName) {
  if (!newName.trim() || oldName === newName) return;
  const subcats = loadSubcategories();
  if (subcats[tag]) {
    const idx = subcats[tag].indexOf(oldName);
    if (idx !== -1) {
      subcats[tag][idx] = newName.trim();
      saveSubcategories(subcats);
    }
  }
  return subcats;
}

// ─── CUSTOM CATEGORIES (editable, localStorage-backed) ─────
const CUSTOM_CATEGORIES_KEY = 'haven-schedule-categories';

function loadCustomCategories() {
  try {
    const data = localStorage.getItem(CUSTOM_CATEGORIES_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) { return []; }
}

function saveCustomCategories(cats) {
  try { localStorage.setItem(CUSTOM_CATEGORIES_KEY, JSON.stringify(cats)); } catch (e) { }
}

function addCustomCategory(label, color) {
  const cats = loadCustomCategories();
  const id = 'cat-' + uid();
  cats.push({ id, label, color });
  saveCustomCategories(cats);
  TAG_ORDER.push(id);
  TAG_LABELS[id] = label;
  TAG_COLORS[id] = { text: color, bg: lightenColor(color, 0.85) };
  const subs = loadSubcategories();
  subs[id] = [];
  saveSubcategories(subs);
  return id;
}

function removeCustomCategory(id) {
  let cats = loadCustomCategories();
  cats = cats.filter(c => c.id !== id);
  saveCustomCategories(cats);
  const idx = TAG_ORDER.indexOf(id);
  if (idx !== -1) TAG_ORDER.splice(idx, 1);
  delete TAG_LABELS[id];
  delete TAG_COLORS[id];
  const subs = loadSubcategories();
  delete subs[id];
  saveSubcategories(subs);
  state.tasks = state.tasks.filter(t => t.tag !== id);
  saveTasks();
}

function initCustomCategories() {
  const custom = loadCustomCategories();
  for (const cat of custom) {
    if (!TAG_ORDER.includes(cat.id)) {
      TAG_ORDER.push(cat.id);
      TAG_LABELS[cat.id] = cat.label;
      TAG_COLORS[cat.id] = { text: cat.color, bg: lightenColor(cat.color, 0.85) };
    }
  }
}

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
  // Focus mode state is tracked via focusModeActive variable
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

// ─── CUSTOM TAGS ─────────────────────────────────────────────
const CUSTOM_TAGS_KEY = 'haven-custom-tags';

function loadCustomTags() {
  try {
    const data = localStorage.getItem(CUSTOM_TAGS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) { return []; }
}

function saveCustomTags(tags) {
  try { localStorage.setItem(CUSTOM_TAGS_KEY, JSON.stringify(tags)); } catch (e) {}
}

function initCustomTags() {
  const customTags = loadCustomTags();
  for (const ct of customTags) {
    if (TAG_ORDER.includes(ct.id)) continue;
    TAG_ORDER.push(ct.id);
    TAG_LABELS[ct.id] = ct.name;
    TAG_COLORS[ct.id] = { bg: `var(--tag-${ct.id}-bg)`, text: `var(--tag-${ct.id}-text)` };
  }
  injectCustomTagStyles();
}

function addCustomTag(name, hexColor) {
  const customTags = loadCustomTags();
  const id = 'c' + Date.now().toString(36);
  customTags.push({ id, name, color: hexColor });
  saveCustomTags(customTags);
  TAG_ORDER.push(id);
  TAG_LABELS[id] = name;
  TAG_COLORS[id] = { bg: `var(--tag-${id}-bg)`, text: `var(--tag-${id}-text)` };
  cardColors[id] = { light: hexColor, dark: lightenColor(hexColor, 0.45) };
  applyCardColors();
  injectCustomTagStyles();
  return id;
}

function removeCustomTag(id) {
  let customTags = loadCustomTags();
  customTags = customTags.filter(ct => ct.id !== id);
  saveCustomTags(customTags);
  const idx = TAG_ORDER.indexOf(id);
  if (idx > -1) TAG_ORDER.splice(idx, 1);
  delete TAG_LABELS[id];
  delete TAG_COLORS[id];
  delete cardColors[id];
  for (const task of state.tasks) {
    if (task.tag === id) task.tag = 'meeting';
  }
  saveState();
  applyCardColors();
  injectCustomTagStyles();
}

function injectCustomTagStyles() {
  const existing = document.getElementById('custom-tag-styles');
  if (existing) existing.remove();
  const customTags = loadCustomTags();
  if (customTags.length === 0) return;
  let css = '';
  for (const ct of customTags) {
    const id = ct.id;
    css += `
.tag-column[data-board-tag="${id}"] { --ctc: var(--tag-${id}-text); --ctb: var(--tag-${id}-bg); }
.tag-col-task[data-tag="${id}"] { --tct-accent: var(--tag-${id}-text); }
.act-timeline-task[data-tag="${id}"] .tct-check.checked { --tct-accent: var(--tag-${id}-text); }
.act-tl-tag[data-tag="${id}"] { background: var(--tag-${id}-bg); color: var(--tag-${id}-text); }
.act-log-item[data-tag="${id}"] .act-log-item-dot { background: var(--tag-${id}-text); }
.act-chart-bar-segment[data-tag="${id}"] { background: var(--tag-${id}-text); }
.act-chart-legend-dot[data-tag="${id}"] { background: var(--tag-${id}-text); }`;
  }
  const style = document.createElement('style');
  style.id = 'custom-tag-styles';
  style.textContent = css;
  document.head.appendChild(style);
}

function loadCardColors() {
  try {
    const stored = localStorage.getItem(CARD_COLORS_KEY);
    cardColors = stored ? JSON.parse(stored) : {};
    for (const tag of TAG_ORDER) {
      if (!cardColors[tag]) {
        if (DEFAULT_TAG_COLORS[tag]) {
          cardColors[tag] = { ...DEFAULT_TAG_COLORS[tag] };
        } else {
          const customTags = loadCustomTags();
          const ct = customTags.find(c => c.id === tag);
          const hex = ct ? ct.color : '#6366f1';
          cardColors[tag] = { light: hex, dark: lightenColor(hex, 0.45) };
        }
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
  const colors = JSON.parse(JSON.stringify(DEFAULT_TAG_COLORS));
  const customTags = loadCustomTags();
  for (const ct of customTags) {
    colors[ct.id] = { light: ct.color, dark: lightenColor(ct.color, 0.45) };
  }
  saveCardColors(colors);
}

function applyCardColors() {
  const root = document.documentElement;
  for (const tag of TAG_ORDER) {
    const c = cardColors[tag] || DEFAULT_TAG_COLORS[tag];
    if (!c) continue;
    // Use same color in both light and dark mode
    root.style.setProperty(`--tag-${tag}-text`, c.light);
    root.style.setProperty(`--tag-${tag}-bg`, lightenColor(c.light, 0.88));
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
let _dailyBriefingNotifiedDate = '';

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
  var baseTitle = document.title.replace(/^\(\d+\)\s*/, '');
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
  var today = formatDate(new Date());
  if (_dailyBriefingNotifiedDate === today || !('Notification' in window) || Notification.permission !== 'granted') return;
  _dailyBriefingNotifiedDate = today;
  var todayTasks = state.tasks.filter(function(t) { return t.date === today && !t.completed && !isWhiteboardTask(t); });
  if (todayTasks.length === 0) return;
  var tagCounts = {};
  for (var ti = 0; ti < todayTasks.length; ti++) {
    var label = TAG_LABELS[todayTasks[ti].tag] || todayTasks[ti].tag;
    tagCounts[label] = (tagCounts[label] || 0) + 1;
  }
  var entries = Object.entries(tagCounts).sort(function(a, b) { return b[1] - a[1]; }).slice(0, 3);
  var tagSummary = entries.map(function(e) { return e[0] + ': ' + e[1]; }).join(' \u00B7 ');
  _sendNotification('\u2600\uFE0F Good morning! ' + todayTasks.length + ' task' + (todayTasks.length !== 1 ? 's' : '') + ' today', tagSummary, { tag: 'daily-brief', vibrate: false });
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
      _sendNotification('\u23F0 ' + task.title, formatTimeRange(task.startTime, task.endTime) + ' \u2014 ' + (TAG_LABELS[task.tag] || task.tag), {
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
      _sendNotification('Starting soon: ' + task.title, 'At ' + timeStr + ' \u00B7 ' + formatDuration(getDurationMinutes(task)), { tag: 'upcoming-' + task.id });
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


// ─── MOBILE BOTTOM NAV BAR (Notion-style) ─────────────────
function initMobileBottomNav() {
  if (window.innerWidth > 768) return;
  var existing = document.getElementById('hubMobileBottomNav');
  if (existing) return;

  var sidebar = document.querySelector('.hub-sidebar-nav');
  if (!sidebar) return;

  var nav = document.createElement('nav');
  nav.id = 'hubMobileBottomNav';
  nav.className = 'hub-mobile-bottom-nav';

  var items = sidebar.querySelectorAll('.hub-snav-item');
  var currentPage = location.pathname.split('/').pop() || 'index.html';

  items.forEach(function(item) {
    var href = item.getAttribute('href');
    if (!href) return;
    var clone = item.cloneNode(true);
    clone.classList.remove('active');
    if (href === currentPage) clone.classList.add('active');
    // Remove drag handles, hide buttons, etc.
    clone.querySelectorAll('.snav-drag-handle, .snav-hide-btn').forEach(function(el) { el.remove(); });
    // Add bottom bar specific class
    clone.classList.add('hub-mbb-item');
    nav.appendChild(clone);
  });

  // Handle resize - remove/add on breakpoint
  if (window._notionNavInit) window.removeEventListener('resize', window._notionNavInit);
  window._notionNavInit = _notionDebounce(function() {
    var nb = document.getElementById('hubMobileBottomNav');
    if (window.innerWidth <= 768) {
      if (!nb) initMobileBottomNav();
    } else {
      if (nb) nb.remove();
    }
  }, 300);
  window.addEventListener('resize', window._notionNavInit);

  if (nav.children.length === 0) return;
  document.body.appendChild(nav);
}

function _notionDebounce(fn, delay) {
  var timer = null;
  return function() {
    var args = arguments;
    var ctx = this;
    clearTimeout(timer);
    timer = setTimeout(function() { fn.apply(ctx, args); }, delay);
  };
}

// Init on load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initMobileBottomNav);
} else {
  initMobileBottomNav();
}


// ─── MOBILE SIDEBAR SWIPE (edge-swipe to open, swipe-left to close) ─
function initSidebarSwipe() {
  if (window.innerWidth > 768) return;

  var touchStartX = 0, touchStartY = 0;
  var touchCurrentX = 0;
  var isSwiping = false;
  var sidebarEl = document.querySelector('.hub-sidebar');
  var overlayEl = document.querySelector('.hub-sidebar-overlay');
  if (!sidebarEl) return;

  var SWIPE_THRESHOLD = 60;
  var EDGE_THRESHOLD = 35;

  document.addEventListener('touchstart', function(e) {
    if (e.touches.length !== 1) return;
    var t = e.touches[0];
    touchStartX = t.clientX;
    touchStartY = t.clientY;
    touchCurrentX = t.clientX;
    isSwiping = false;
  }, { passive: true });

  document.addEventListener('touchmove', function(e) {
    if (e.touches.length !== 1) { isSwiping = false; return; }
    var t = e.touches[0];
    touchCurrentX = t.clientX;
    var dx = t.clientX - touchStartX;
    var dy = t.clientY - touchStartY;

    // Only horizontal swipes (ignore vertical scrolling)
    if (Math.abs(dx) < Math.abs(dy) * 1.5 && Math.abs(dy) > 10) {
      isSwiping = false;
      return;
    }
    if (Math.abs(dx) < 10) return;
    isSwiping = true;
  }, { passive: true });

  document.addEventListener('touchend', function(e) {
    if (window.innerWidth > 768) return;
    if (!isSwiping) return;
    isSwiping = false;

    var dx = touchCurrentX - touchStartX;
    var sidebarOpen = sidebarEl.classList.contains('open');
    // Only edge swipe from left (Notion-style)
    if (dx > SWIPE_THRESHOLD && touchStartX < EDGE_THRESHOLD && !sidebarOpen) {
      sidebarEl.classList.add('open');
      if (overlayEl) overlayEl.classList.add('active');
      return;
    }
    // Swipe left when sidebar is open
    if (dx < -SWIPE_THRESHOLD && sidebarOpen) {
      sidebarEl.classList.remove('open');
      if (overlayEl) overlayEl.classList.remove('active');
    }

    // Swipe right from left edge → open sidebar
    if (dx > SWIPE_THRESHOLD && touchStartX < EDGE_THRESHOLD && !sidebarOpen) {
      sidebarEl.classList.add('open');
      if (overlayEl) overlayEl.classList.add('active');
      return;
    }

    // Swipe left when sidebar is open → close sidebar
    if (dx < -SWIPE_THRESHOLD && sidebarOpen) {
      sidebarEl.classList.remove('open');
      if (overlayEl) overlayEl.classList.remove('active');
      return;
    }

    // Swipe right from anywhere (not just edge) when sidebar is closed
    // — only if it's a clear intentional swipe (larger threshold)
    if (dx > SWIPE_THRESHOLD * 1.5 && !sidebarOpen) {
      sidebarEl.classList.add('open');
      if (overlayEl) overlayEl.classList.add('active');
    }
  }, { passive: true });
}

// Init swipe on load (after bottom nav)
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function() {
    setTimeout(initSidebarSwipe, 100);
    setTimeout(initMobileHamburger, 50);
  });
} else {
  setTimeout(initSidebarSwipe, 100);
  setTimeout(initMobileHamburger, 50);
}

function initMobileHamburger() {
  if (window.innerWidth > 768) return;
  if (document.getElementById('hubMobileMenuBtn')) return;
  var btn = document.createElement('button');
  btn.id = 'hubMobileMenuBtn';
  btn.className = 'hub-mobile-menu-btn';
  btn.setAttribute('aria-label', 'Menu');
  btn.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>';
  btn.addEventListener('click', function(e) {
    e.stopPropagation();
    e.preventDefault();
    toggleMobileSidebar();
  });
  document.body.appendChild(btn);
}

function toggleMobileSidebar() {
  var sidebar = document.querySelector('.hub-sidebar');
  var overlay = document.querySelector('.hub-sidebar-overlay');
  if (!sidebar) return;
  var opening = !sidebar.classList.contains('open');
  sidebar.classList.toggle('open');
  if (overlay) overlay.classList.toggle('active');
  var menuBtn = document.getElementById('hubMobileMenuBtn');
  if (menuBtn) {
    menuBtn.classList.toggle('hidden-btn', opening);
  }
}

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
  accentColor: null,
  accentCustomColors: [],
  accentRemovedPresets: [],
  userProfile: null,
  editMode: false,
  accessBubbles: {},
  currentView: 'week',
  currentMonthDate: null,
  savedScrollPosition: null,
  currentUserId: null,
  localUsers: [],
};

// ─── GSI STORAGE PREFIX ──────────────────────────────
function getStoragePrefix() {
  return state && state.currentUserId ? state.currentUserId + ':' : '';
}

var __origLS = {};
(function() {
  __origLS.getItem = localStorage.getItem.bind(localStorage);
  __origLS.setItem = localStorage.setItem.bind(localStorage);
  __origLS.removeItem = localStorage.removeItem.bind(localStorage);
  __origLS.key = localStorage.key.bind(localStorage);
  Object.defineProperty(__origLS, 'length', { get: function() { return localStorage.length; }, enumerable: true, configurable: true });
  function _p(key) {
    var pre = getStoragePrefix();
    if (!pre) return key;
    if (typeof key === 'string') {
      if (key.indexOf('haven-gsi-') === 0) return key;
      if (key.indexOf('firestore_') === 0 || key.indexOf('firebase_') === 0) return key;
    }
    return pre + key;
  }
  localStorage.getItem = function(key) { return __origLS.getItem(_p(key)); };
  localStorage.setItem = function(key, val) {
    var pKey = _p(key);
    __origLS.setItem(pKey, val);
  };
  localStorage.removeItem = function(key) { return __origLS.removeItem(_p(key)); };
})();



// Safe localStorage write with auto-cleanup on quota exceeded
function safeSetItem(key, val) {
  try { localStorage.setItem(key, val); return true; } catch (e) {
    if (e.name === 'QuotaExceededError' || e.code === 22) {
      // Try freeing space by removing old direct image keys
      try {
        var freed = 0;
        for (var i = localStorage.length - 1; i >= 0; i--) {
          var k = localStorage.key(i);
          if (k && k.indexOf('haven-image-') === 0) {
            localStorage.removeItem(k);
            freed++;
            if (freed >= 10) break; // free up to 10 images per write
          }
        }
        if (freed > 0) { localStorage.setItem(key, val); return true; }
      } catch (e2) { /* ignore */ }
    }
    return false;
  }
}

// ─── I18N — Minimal translation system ─────────────────
const LANG = {
  en: {
    'settings.account':'My Account','settings.appearance':'Appearance','settings.ai':'AI & API','settings.data':'Data','settings.about':'About','settings.access':'Access Hub',
    'appearance.title':'Appearance','appearance.desc':'Customize the theme, accent color, and visuals','appearance.dark':'Dark Mode','appearance.darkDesc':'Switch between dark and light theme','appearance.accent':'ACCENT COLOR','appearance.edit':'Edit Mode','appearance.editDesc':'Tap any image to customize throughout the app',
    'account.title':'My Account','account.preferences':'PREFERENCES','account.language':'Language','account.langDesc':'UI language','account.timezone':'Timezone','account.tzDesc':'Detected from browser','account.weekStart':'Week starts on','account.timeFormat':'Time format',
    'account.dataPrivacy':'DATA & PRIVACY','account.export':'Export','account.exportDesc':'Download all your data as JSON','account.delete':'Delete all data','account.deleteDesc':'Permanently remove everything',
    'account.switch':'SWITCH ACCOUNT','account.google':'Sign in with Google','account.local':'Add local profile','account.signOut':'Sign Out',
    'account.connected':'Connected to','account.save':'Save','account.name':'Name','account.email':'Email','account.noProfile':'No profile selected','account.device':'This device',
    'ai.title':'AI & API','ai.desc':'Configure the AI assistant provider and API key','ai.provider':'Provider','ai.providerDesc':'Select which AI service to use','ai.apiKey':'API Key','ai.apiKeyDesc':'Your API key for the selected provider',
    'ai.profile':'AI PROFILE & LEARNING','ai.aboutYou':'ABOUT YOU','ai.pronouns':'Pronouns','ai.occupation':'Occupation','ai.goals':'Goals','ai.routines':'Routines','ai.preferences':'Preferences','ai.schedule':'Daily Schedule','ai.saveProfile':'Save Profile',
    'ai.learned':"WHAT I'VE LEARNED",'ai.addMemory':'+ Add Memory','ai.learningData':'LEARNING DATA','ai.tasks':'tasks','ai.sessions':'sessions','ai.keywords':'keywords','ai.memories':'memories','ai.planAcc':'plan acc.',
    'ai.clearMem':'Clear Memories','ai.resetLearn':'Reset Learning','ai.extra':'EXTRA INSTRUCTIONS','ai.extraPlaceholder':'Extra instructions for the AI (optional)...','ai.saveInstructions':'Save Instructions','ai.noMemories':'No memories yet. Chat with ChickBot to build your profile.',
    'data.title':'Data','data.desc':'Export your data or import from a backup','data.export':'Export Data','data.import':'Import Data',
    'about.title':'About','about.desc':'Hav\u00ebn Schedule \u2014 your personal smart scheduler',
    'nav.hub':'Hub','nav.schedule':'Schedule','nav.activities':'Activities','nav.analytics':'Analytics','nav.goals':'Goals','nav.finance':'Finance','nav.gallery':'Gallery','nav.friends':'Friends',
    'hub.greeting':'Good morning','hub.today':'TODAY','hub.week':'WEEK','hub.edit':'Edit','hub.add':'Add','hub.guide':'Guide','hub.sectionGoals':'Goals & Priorities','hub.sectionSleep':'Sleep','hub.sectionViews':'Views','hub.viewSchedule':'Schedule','hub.viewActivities':'Activities','hub.viewTags':'Tags Board','hub.viewAnalytics':'Analytics','hub.viewGoals':'Goals','hub.galleryTasks':'this week','hub.galleryTotal':'total','hub.galleryCategories':'categories','hub.galleryGoals':'goals','hub.galleryOpen':'Open','hub.galleryView':'View','hub.footer':'Hav\u00ebn Schedule v1.0','hub.export':'Export','hub.import':'Import','hub.focus':'Focus',
    'sleep.log':'+ Log Sleep','sleep.overview':'Overview','sleep.history':'History','sleep.insights':'Insights','sleep.targets':'Targets','sleep.score':'Score','sleep.lastNight':'last night','sleep.avg7':'7-Day Avg','sleep.avgQuality':'Avg Quality','sleep.consistency':'Consistency','sleep.thisWeek':'This Week\u0027s Sleep','sleep.noData':'No data yet','sleep.noLogs':'No sleep logs yet. Log your first night!','sleep.targetBedtime':'Target Bedtime','sleep.targetWake':'Target Wake Time','sleep.targetDuration':'Target Duration','sleep.saveTargets':'Save Targets','sleep.routine':'Bedtime Routine','sleep.routineItem1':'Screen off 30min before','sleep.routineItem2':'Read / unwind','sleep.routineItem3':'Meditate / breathe','sleep.routineItem4':'Journal / reflect','sleep.routineItem5':'No caffeine after 5pm','sleep.routineItem6':'Drink water','sleep.routineItem7':'Darken the room','sleep.routineItem8':'Light stretch','sleep.saveRoutine':'Save Routine','sleep.qualityLabel':'Log 3+ nights',
    'spotify.title':'Spotify','spotify.noPlaylist':'No playlist linked','spotify.addPlaylist':'Add playlist','spotify.playlist':'Playlist','spotify.toggle':'Toggle player','spotify.prev':'Previous playlist','spotify.next':'Next playlist','spotify.settings':'Manage playlists',
    'sidebar.theme':'Theme','sidebar.settings':'Settings','sidebar.visuals':'Visuals','sidebar.editNav':'Edit sidebar nav',
    'chat.title':'ChickBot','chat.subtitle':'Your smart schedule buddy','chat.placeholder':'Ask about your schedule...','chat.natural':'Natural language scheduling','chat.settings':'Settings','chat.close':'Close', 'chat.send':'Send',
    'sch.title':'Schedule','sch.today':'Today','sch.tasks':'tasks','sch.holiday':'Holiday','sch.school':'School','sch.apiNoKey':'No key','sch.apiActive':'Active','sch.viewWeek':'Week view','sch.viewMonth':'Month view','sch.viewAgenda':'Agenda view','sch.week':'Week','sch.addCategory':'Add category','sch.catName':'Category name','sch.pickColor':'Pick a colour','sch.cancel':'Cancel','sch.add':'Add','sch.focus':'Focus','sch.ai':'AI','sch.ss':'Screenshot','sch.copyWeek':'Copy Week','sch.cmdPalette':'Command palette',
    'menu.pages':'Pages','menu.actions':'Actions','menu.today':'Today','menu.newTask':'New Task','menu.theme':'Theme',
    'acts.title':'Activities','acts.board':'Board','acts.timeline':'Timeline','acts.week':'This Week','acts.total':'total','acts.avgDay':'avg/day','acts.log':'Activity Log','acts.addCat':'+ Category','acts.noTasks':'No tasks yet','acts.completed':'Completed',
    'an.title':'Analytics','an.all':'All','an.tasks':'Tasks','an.time':'Time','an.deep':'Deep Work','an.study':'Study','an.completion':'Completion','an.streak':'Streak','an.daily':'Daily','an.weekly':'Weekly','an.pie':'Pie','an.bar':'Bar','an.trend':'Trend','an.sleep':'Sleep','an.duration':'Duration','an.quality':'Quality','an.table':'Day-by-Day','an.current':'Current','an.best':'Best','an.days':'days','an.day':'Day','an.total':'Total','an.completed':'Completed','an.logged':'Logged','an.nights':'nights','an.night':'Night','an.active':'Active','an.past7':'Past 7 days','an.thisMonth':'This Month','an.breakdown':'Breakdown','an.distribution':'Distribution',
    'gl.title':'Goals','gl.addGoal':'Add Goal','gl.editGoal':'Edit Goal','gl.deleteGoal':'Delete Goal','gl.vision':'Vision Board','gl.manifesto':'Monthly Manifesto','gl.related':'Related Tasks','gl.noGoals':'No goals yet','gl.progress':'Progress','gl.subtasks':'Sub-tasks','gl.due':'Due','gl.target':'Target',
    'fin.title':'Finance','fin.income':'Income','fin.expense':'Expense','fin.piggy':'Piggy Bank','fin.wallet':'Wallet','fin.add':'Add','fin.subtract':'Subtract','fin.save':'Save','fin.amount':'Amount','fin.category':'Category','fin.date':'Date','fin.note':'Note','fin.type':'Type','fin.search':'Search','fin.exportCSV':'Export CSV','fin.noTransactions':'No transactions yet','fin.period7d':'7D','fin.period30d':'30D','fin.periodMonth':'Month','fin.periodAll':'All','fin.intelligence':'Spending Intelligence','fin.treemap':'Treemap','fin.mom':'MoM','fin.heatmap':'Heatmap','fin.flow':'Flow','fin.merchants':'Merchants',
    'gal.title':'Gallery','gal.add':'+ Add Image','gal.reset':'Reset','gal.noImages':'No images yet','gal.vision':'Vision Board','gal.custom':'Custom designs',
    'fr.title':'Friends','fr.add':'Add Friend','fr.code':'Friend Code','fr.copy':'Copy','fr.paste':'Paste','fr.pending':'Pending','fr.accepted':'Accepted','fr.empty':'No connections yet','fr.search':'Search','fr.send':'Send','fr.message':'Message','fr.share':'Share Code','fr.connect':'Connect','fr.enterCode':'Enter friend code','fr.yourCode':'Your Code','fr.connections':'Connections',
    'common.monday':'Monday','common.sunday':'Sunday','common.save':'Save','common.cancel':'Cancel','common.delete':'Delete','common.show':'Show','common.hide':'Hide','common.enterKey':'Enter key','common.quickActions':'Quick Actions','common.customize':'Customize','common.help':'Help','common.settings':'Settings','common.menu':'Menu','common.pages':'Pages','common.add':'Add','common.edit':'Edit','common.close':'Close','common.search':'Search','common.noData':'No data','appearance.title':'Appearance',
    'common.done':'Done','common.stop':'Stop','common.send':'Send','common.name':'Name','common.note':'Note','common.url':'URL','common.today':'Today','common.all':'All','hub.editMode':'Edit Mode','hub.duplicate':'Duplicate','hub.bringForward':'Bring Forward','hub.doneEditing':'Done Editing','hub.hideBubbles':'Hide Bubbles','hub.sizeSmall':'Small (160x100)','hub.weatherError':'Could not load weather','hub.geoUnavail':'Geolocation unavailable','common.completed':'completed','an.learning':'learning','pomo.ready':'Ready to focus','pomo.paused':'Paused','pomo.focusSession':'Focus Session','sch.noTasks':'No tasks this week','chat.noKey':'Configure an API key in Settings to chat...','an.surplus':'Surplus over 14 days','an.avgAcross':'Average across','acts.deleted':'Task deleted','gl.noRelated':'No related tasks','gl.allDone':'All goals achieved!','gal.designs':'Your designs & posters','gal.removed':'Image removed from gallery','gal.noReset':'No custom images to reset','fr.ownCode':'That\'s your own friend code!','fr.adding':'Adding...','fr.noServer':'Could not connect to server. Try again later.','fr.noUser':'No user found with that friend code','fr.requestSent':'Friend request already sent. Waiting for them to accept.','fr.sentTo':'Friend request sent to','fr.removeFriend':'Remove this friend connection?','fr.needSignIn':'You need to be signed in to add friends','fr.alreadyFriends':'You are already friends with','sch.addToCal':'Add to Calendar','about.version':'Version 1.0.0','account.deletedAll':'All data deleted','account.nameReq':'Name is required','toast.synced':'Synced from cloud','toast.undoOk':'Undo successful','toast.noFirebase':'Firebase SDK not loaded. Refresh the page.','toast.signInFail':'Sign-in failed','toast.switched':'Switched to','toast.initCloud':'Initializing cloud storage...','toast.noGoogle':'No Google-authenticated profile found','toast.syncing':'Syncing...','toast.focusOn':'Focus mode activated','toast.ssSaved':'Screenshot saved!','toast.noTasksWeek':'No uncompleted tasks this week','toast.copied':'Copied','pomo.willPush':'Will push','img.enterBoth':'Enter both a label and URL','img.storageFull':'Could not save: localStorage might be full','toast.editOn':'Edit Mode ON','img.storageFull2':'Could not save image: storage full','img.paste':'Paste an image (Ctrl+V) or type a URL','img.notImage':'Not an image file','img.processing':'Processing image...','img.loaded':'Image loaded - click Save to apply','img.urlLoaded':'URL loaded - click Save to apply','fin.addTransactions':'Add transactions to unlock spending intelligence.','fin.noExpenses':'No expenses to visualize.','fin.noFlow':'Add transactions to see your cash flow waterfall.','fin.noMerchants':'Add notes to your expenses to track merchants.','chat.signIn':'Sign in to chat','common.remove':'Remove','common.task':'task','sch.toNextWeek':'to next week','hub.idea':'Idea',
    'lang.en':'English','lang.id':'Bahasa Indonesia','lang.zh':'\u4e2d\u6587',
  },
  id: {
    'settings.account':'Akun Saya','settings.appearance':'Tampilan','settings.ai':'AI & API','settings.data':'Data','settings.about':'Tentang','settings.access':'Access Hub',
    'appearance.title':'Tampilan','appearance.desc':'Sesuaikan tema, warna aksen, dan visual','appearance.dark':'Mode Gelap','appearance.darkDesc':'Beralih antara tema gelap dan terang','appearance.accent':'WARNA AKSEN','appearance.edit':'Mode Edit','appearance.editDesc':'Ketuk gambar untuk menyesuaikan di seluruh aplikasi',
    'account.title':'Akun Saya','account.preferences':'PREFERENSI','account.language':'Bahasa','account.langDesc':'Bahasa antarmuka','account.timezone':'Zona Waktu','account.tzDesc':'Terdeteksi dari browser','account.weekStart':'Mulai minggu pada','account.timeFormat':'Format waktu',
    'account.dataPrivacy':'DATA & PRIVASI','account.export':'Ekspor','account.exportDesc':'Unduh semua data sebagai JSON','account.delete':'Hapus semua data','account.deleteDesc':'Hapus permanen semua data',
    'account.switch':'GANTI AKUN','account.google':'Masuk dengan Google','account.local':'Tambah profil lokal','account.signOut':'Keluar',
    'account.connected':'Terhubung ke','account.save':'Simpan','account.name':'Nama','account.email':'Email','account.noProfile':'Tidak ada profil dipilih','account.device':'Perangkat ini',
    'ai.title':'AI & API','ai.desc':'Konfigurasi penyedia AI dan kunci API','ai.provider':'Penyedia','ai.providerDesc':'Pilih layanan AI yang digunakan','ai.apiKey':'Kunci API','ai.apiKeyDesc':'Kunci API untuk penyedia yang dipilih',
    'ai.profile':'PROFIL & PEMBELAJARAN AI','ai.aboutYou':'TENTANG ANDA','ai.pronouns':'Kata ganti','ai.occupation':'Pekerjaan','ai.goals':'Tujuan','ai.routines':'Rutinitas','ai.preferences':'Preferensi','ai.schedule':'Jadwal Harian','ai.saveProfile':'Simpan Profil',
    'ai.learned':'YANG SAYA PELAJARI','ai.addMemory':'+ Tambah Memori','ai.learningData':'DATA PEMBELAJARAN','ai.tasks':'tugas','ai.sessions':'sesi','ai.keywords':'kata kunci','ai.memories':'memori','ai.planAcc':'akurasi renc.',
    'ai.clearMem':'Hapus Memori','ai.resetLearn':'Reset Pembelajaran','ai.extra':'INSTRUKSI TAMBAHAN','ai.extraPlaceholder':'Instruksi tambahan untuk AI (opsional)...','ai.saveInstructions':'Simpan Instruksi','ai.noMemories':'Belum ada memori. Ngobrol dengan ChickBot untuk membangun profil Anda.',
    'data.title':'Data','data.desc':'Ekspor data Anda atau impor dari cadangan','data.export':'Ekspor Data','data.import':'Impor Data',
    'about.title':'Tentang','about.desc':'Hav\u00ebn Schedule \u2014 penjadwal pintar pribadi Anda',
    'nav.hub':'Beranda','nav.schedule':'Jadwal','nav.activities':'Aktivitas','nav.analytics':'Analitik','nav.goals':'Tujuan','nav.finance':'Keuangan','nav.gallery':'Galeri','nav.friends':'Teman',
    'hub.greeting':'Selamat pagi','hub.today':'HARI INI','hub.week':'MINGGU INI','hub.edit':'Edit','hub.add':'Tambah','hub.guide':'Panduan','hub.sectionGoals':'Tujuan & Prioritas','hub.sectionSleep':'Tidur','hub.sectionViews':'Tampilan','hub.viewSchedule':'Jadwal','hub.viewActivities':'Aktivitas','hub.viewTags':'Papan Tag','hub.viewAnalytics':'Analitik','hub.viewGoals':'Tujuan','hub.galleryTasks':'minggu ini','hub.galleryTotal':'total','hub.galleryCategories':'kategori','hub.galleryGoals':'tujuan','hub.galleryOpen':'Buka','hub.galleryView':'Lihat','hub.footer':'Hav\u00ebn Schedule v1.0','hub.export':'Ekspor','hub.import':'Impor','hub.focus':'Fokus',
    'sleep.log':'+ Catat Tidur','sleep.overview':'Ringkasan','sleep.history':'Riwayat','sleep.insights':'Wawasan','sleep.targets':'Target','sleep.score':'Skor','sleep.lastNight':'tadi malam','sleep.avg7':'Rata-rata 7 Hari','sleep.avgQuality':'Rata Kualitas','sleep.consistency':'Konsistensi','sleep.thisWeek':'Tidur Minggu Ini','sleep.noData':'Belum ada data','sleep.noLogs':'Belum ada catatan tidur. Catat malam pertama Anda!','sleep.targetBedtime':'Target Tidur','sleep.targetWake':'Target Bangun','sleep.targetDuration':'Target Durasi','sleep.saveTargets':'Simpan Target','sleep.routine':'Rutinitas Tidur','sleep.routineItem1':'Matikan layar 30 menit sebelum','sleep.routineItem2':'Baca / rileks','sleep.routineItem3':'Meditasi / tarik napas','sleep.routineItem4':'Jurnal / refleksi','sleep.routineItem5':'Tidak ada kafein setelah jam 5 sore','sleep.routineItem6':'Minum air','sleep.routineItem7':'Gelapkan ruangan','sleep.routineItem8':'Peregangan ringan','sleep.saveRoutine':'Simpan Rutinitas','sleep.qualityLabel':'Catat 3+ malam',
    'spotify.title':'Spotify','spotify.noPlaylist':'Tidak ada playlist','spotify.addPlaylist':'Tambah playlist','spotify.playlist':'Playlist','spotify.toggle':'Buka/tutup pemutar','spotify.prev':'Playlist sebelumnya','spotify.next':'Playlist berikutnya','spotify.settings':'Kelola playlist',
    'sidebar.theme':'Tema','sidebar.settings':'Pengaturan','sidebar.visuals':'Visual','sidebar.editNav':'Edit navigasi sidebar',
    'chat.title':'ChickBot','chat.subtitle':'Teman jadwal pintar Anda','chat.placeholder':'Tanya tentang jadwal Anda...','chat.natural':'Penjadwalan bahasa alami','chat.settings':'Pengaturan','chat.close':'Tutup','chat.send':'Kirim',
    'sch.title':'Jadwal','sch.today':'Hari Ini','sch.tasks':'tugas','sch.holiday':'Libur','sch.school':'Sekolah','sch.apiNoKey':'Tidak ada kunci','sch.apiActive':'Aktif','sch.viewWeek':'Tampilan minggu','sch.viewMonth':'Tampilan bulan','sch.viewAgenda':'Tampilan agenda','sch.week':'Minggu','sch.addCategory':'Tambah kategori','sch.catName':'Nama kategori','sch.pickColor':'Pilih warna','sch.cancel':'Batal','sch.add':'Tambah','sch.focus':'Fokus','sch.ai':'AI','sch.ss':'Screenshot','sch.copyWeek':'Salin Minggu','sch.cmdPalette':'Palet perintah',
    'menu.pages':'Halaman','menu.actions':'Aksi','menu.today':'Hari Ini','menu.newTask':'Tugas Baru','menu.theme':'Tema',
    'acts.title':'Aktivitas','acts.board':'Papan','acts.timeline':'Garis Waktu','acts.week':'Minggu Ini','acts.total':'total','acts.avgDay':'rata/hari','acts.log':'Log Aktivitas','acts.addCat':'+ Kategori','acts.noTasks':'Belum ada tugas','acts.completed':'Selesai',
    'an.title':'Analitik','an.all':'Semua','an.tasks':'Tugas','an.time':'Waktu','an.deep':'Deep Work','an.study':'Belajar','an.completion':'Penyelesaian','an.streak':'Rantai','an.daily':'Harian','an.weekly':'Mingguan','an.pie':'Lingkaran','an.bar':'Batang','an.trend':'Tren','an.sleep':'Tidur','an.duration':'Durasi','an.quality':'Kualitas','an.table':'Hari per Hari','an.current':'Saat Ini','an.best':'Terbaik','an.days':'hari','an.day':'Hari','an.total':'Total','an.completed':'Selesai','an.logged':'Tercatat','an.nights':'malam','an.night':'Malam','an.active':'Aktif','an.past7':'7 hari terakhir','an.thisMonth':'Bulan Ini','an.breakdown':'Rincian','an.distribution':'Distribusi',
    'gl.title':'Tujuan','gl.addGoal':'Tambah Tujuan','gl.editGoal':'Edit Tujuan','gl.deleteGoal':'Hapus Tujuan','gl.vision':'Papan Visi','gl.manifesto':'Manifesto Bulanan','gl.related':'Tugas Terkait','gl.noGoals':'Belum ada tujuan','gl.progress':'Kemajuan','gl.subtasks':'Sub-tugas','gl.due':'Jatuh tempo','gl.target':'Target',
    'fin.title':'Keuangan','fin.income':'Pemasukan','fin.expense':'Pengeluaran','fin.piggy':'Celengan','fin.wallet':'Dompet','fin.add':'Tambah','fin.subtract':'Kurangi','fin.save':'Simpan','fin.amount':'Jumlah','fin.category':'Kategori','fin.date':'Tanggal','fin.note':'Catatan','fin.type':'Tipe','fin.search':'Cari','fin.exportCSV':'Ekspor CSV','fin.noTransactions':'Belum ada transaksi','fin.period7d':'7H','fin.period30d':'30H','fin.periodMonth':'Bulan','fin.periodAll':'Semua','fin.intelligence':'Intelijen Pengeluaran','fin.treemap':'Treemap','fin.mom':'MoM','fin.heatmap':'Peta Panas','fin.flow':'Arus','fin.merchants':'Merchant',
    'gal.title':'Galeri','gal.add':'+ Tambah Gambar','gal.reset':'Reset','gal.noImages':'Belum ada gambar','gal.vision':'Papan Visi','gal.custom':'Desain kustom',
    'fr.title':'Teman','fr.add':'Tambah Teman','fr.code':'Kode Teman','fr.copy':'Salin','fr.paste':'Tempel','fr.pending':'Menunggu','fr.accepted':'Diterima','fr.empty':'Belum ada koneksi','fr.search':'Cari','fr.send':'Kirim','fr.message':'Pesan','fr.share':'Bagikan Kode','fr.connect':'Hubungkan','fr.enterCode':'Masukkan kode teman','fr.yourCode':'Kode Anda','fr.connections':'Koneksi',
    'common.monday':'Senin','common.sunday':'Minggu','common.save':'Simpan','common.cancel':'Batal','common.delete':'Hapus','common.show':'Tampilkan','common.hide':'Sembunyikan','common.enterKey':'Masukkan kunci','common.quickActions':'Aksi Cepat','common.customize':'Sesuaikan','common.help':'Bantuan','common.settings':'Pengaturan','common.menu':'Menu','common.pages':'Halaman','common.add':'Tambah','common.edit':'Edit','common.close':'Tutup','common.search':'Cari','common.noData':'Tidak ada data','appearance.title':'Tampilan',
    'common.done':'Selesai','common.stop':'Berhenti','common.send':'Kirim','common.name':'Nama','common.note':'Catatan','common.url':'URL','common.today':'Hari Ini','common.all':'Semua','hub.editMode':'Mode Edit','hub.duplicate':'Duplikat','hub.bringForward':'Bawa ke Depan','hub.doneEditing':'Selesai Edit','hub.hideBubbles':'Sembunyikan Gelembung','hub.sizeSmall':'Kecil (160x100)','hub.weatherError':'Gagal memuat cuaca','hub.geoUnavail':'Geolokasi tidak tersedia','common.completed':'selesai','an.learning':'pembelajaran','pomo.ready':'Siap fokus','pomo.paused':'Dijeda','pomo.focusSession':'Sesi Fokus','sch.noTasks':'Tidak ada tugas minggu ini','chat.noKey':'Konfigurasi kunci API di Pengaturan untuk mengobrol...','an.surplus':'Surplus selama 14 hari','an.avgAcross':'Rata-rata','acts.deleted':'Tugas dihapus','gl.noRelated':'Tidak ada tugas terkait','gl.allDone':'Semua tujuan tercapai!','gal.designs':'Desain & poster Anda','gal.removed':'Gambar dihapus dari galeri','gal.noReset':'Tidak ada gambar kustom untuk direset','fr.ownCode':'Itu kode teman Anda sendiri!','fr.adding':'Menambah...','fr.noServer':'Tidak dapat terhubung ke server. Coba lagi nanti.','fr.noUser':'Tidak ada pengguna dengan kode teman itu','fr.requestSent':'Permintaan pertemanan sudah dikirim. Menunggu diterima.','fr.sentTo':'Permintaan pertemanan dikirim ke','fr.removeFriend':'Hapus koneksi teman ini?','sch.addToCal':'Tambah ke Kalender','about.version':'Versi 1.0.0','account.deletedAll':'Semua data dihapus','account.nameReq':'Nama wajib diisi','toast.synced':'Sinkron dari cloud','toast.undoOk':'Urungkan berhasil','toast.noFirebase':'Firebase SDK tidak dimuat. Muat ulang halaman.','toast.signInFail':'Gagal masuk','toast.switched':'Beralih ke','toast.initCloud':'Menginisialisasi penyimpanan cloud...','toast.noGoogle':'Tidak ada profil terautentikasi Google ditemukan','toast.syncing':'Menyinkronkan...','toast.focusOn':'Mode fokus diaktifkan','toast.ssSaved':'Screenshot tersimpan!','toast.noTasksWeek':'Tidak ada tugas belum selesai minggu ini','toast.copied':'Disalin','pomo.willPush':'Akan mendorong','img.paste':'Tempel gambar (Ctrl+V) atau ketik URL','img.notImage':'Bukan file gambar','img.processing':'Memproses gambar...','img.loaded':'Gambar dimuat - klik Simpan untuk terapkan','img.urlLoaded':'URL dimuat - klik Simpan untuk terapkan','fin.addTransactions':'Tambah transaksi untuk membuka intelijen belanja.','fin.noExpenses':'Tidak ada pengeluaran untuk divisualisasikan.','fin.noFlow':'Tambah transaksi untuk melihat aliran kas Anda.','fin.noMerchants':'Tambah catatan ke pengeluaran untuk melacak merchant.','chat.signIn':'Masuk untuk mengobrol','common.remove':'Hapus','common.task':'tugas','sch.toNextWeek':'ke minggu depan','hub.idea':'Ide','fr.needSignIn':'Anda harus masuk untuk menambah teman','fr.alreadyFriends':'Anda sudah berteman dengan','img.enterBoth':'Masukkan label dan URL','img.storageFull':'Gagal menyimpan: localStorage mungkin penuh','toast.editOn':'Mode Edit AKTIF','img.storageFull2':'Gagal menyimpan gambar: penyimpanan penuh',
    'lang.en':'English','lang.id':'Bahasa Indonesia','lang.zh':'\u4e2d\u6587',
  },
  zh: {
    'settings.account':'\u6211\u7684\u8d26\u6237','settings.appearance':'\u5916\u89c2','settings.ai':'AI & API','settings.data':'\u6570\u636e','settings.about':'\u5173\u4e8e','settings.access':'Access Hub',
    'appearance.title':'\u5916\u89c2','appearance.desc':'\u81ea\u5b9a\u4e49\u4e3b\u9898\u3001\u5f3a\u8c03\u8272\u548c\u89c6\u89c9\u6548\u679c','appearance.dark':'\u6df1\u8272\u6a21\u5f0f','appearance.darkDesc':'\u5207\u6362\u6df1\u8272\u548c\u6d45\u8272\u4e3b\u9898','appearance.accent':'\u5f3a\u8c03\u8272','appearance.edit':'\u7f16\u8f91\u6a21\u5f0f','appearance.editDesc':'\u70b9\u51fb\u4efb\u610f\u56fe\u7247\u53ef\u5728\u6574\u4e2a\u5e94\u7528\u4e2d\u81ea\u5b9a\u4e49',
    'account.title':'\u6211\u7684\u8d26\u6237','account.preferences':'\u504f\u597d\u8bbe\u7f6e','account.language':'\u8bed\u8a00','account.langDesc':'\u754c\u9762\u8bed\u8a00','account.timezone':'\u65f6\u533a','account.tzDesc':'\u4ece\u6d4f\u89c8\u5668\u68c0\u6d4b','account.weekStart':'\u4e00\u5468\u5f00\u59cb\u4e8e','account.timeFormat':'\u65f6\u95f4\u683c\u5f0f',
    'account.dataPrivacy':'\u6570\u636e\u548c\u9690\u79c1','account.export':'\u5bfc\u51fa','account.exportDesc':'\u4e0b\u8f7d\u6240\u6709\u6570\u636e\u4e3a JSON','account.delete':'\u5220\u9664\u6240\u6709\u6570\u636e','account.deleteDesc':'\u6c38\u4e45\u5220\u9664\u6240\u6709\u5185\u5bb9',
    'account.switch':'\u5207\u6362\u8d26\u6237','account.google':'\u4f7f\u7528 Google \u767b\u5f55','account.local':'\u6dfb\u52a0\u672c\u5730\u8d26\u6237','account.signOut':'\u9000\u51fa\u767b\u5f55',
    'account.connected':'\u8fde\u63a5\u5230','account.save':'\u4fdd\u5b58','account.name':'\u59d3\u540d','account.email':'\u90ae\u7bb1','account.noProfile':'\u672a\u9009\u62e9\u4e2a\u4eba\u8d44\u6599','account.device':'\u6b64\u8bbe\u5907',
    'ai.title':'AI & API','ai.desc':'\u914d\u7f6e AI \u52a9\u624b\u63d0\u4f9b\u5546\u548c API \u5bc6\u94a5','ai.provider':'\u63d0\u4f9b\u5546','ai.providerDesc':'\u9009\u62e9\u4f7f\u7528\u7684 AI \u670d\u52a1','ai.apiKey':'API \u5bc6\u94a5','ai.apiKeyDesc':'\u6240\u9009\u63d0\u4f9b\u5546\u7684 API \u5bc6\u94a5',
    'ai.profile':'AI \u8d44\u6599\u548c\u5b66\u4e60','ai.aboutYou':'\u5173\u4e8e\u4f60','ai.pronouns':'\u4ee3\u8bcd','ai.occupation':'\u804c\u4e1a','ai.goals':'\u76ee\u6807','ai.routines':'\u65e5\u5e38','ai.preferences':'\u504f\u597d','ai.schedule':'\u6bcf\u65e5\u65e5\u7a0b','ai.saveProfile':'\u4fdd\u5b58\u8d44\u6599',
    'ai.learned':'\u6211\u4e86\u89e3\u5230\u7684','ai.addMemory':'+ \u6dfb\u52a0\u8bb0\u5fc6','ai.learningData':'\u5b66\u4e60\u6570\u636e','ai.tasks':'\u4efb\u52a1','ai.sessions':'\u4f1a\u8bdd','ai.keywords':'\u5173\u952e\u8bcd','ai.memories':'\u8bb0\u5fc6','ai.planAcc':'\u8ba1\u5212\u51c6\u786e\u7387',
    'ai.clearMem':'\u6e05\u9664\u8bb0\u5fc6','ai.resetLearn':'\u91cd\u7f6e\u5b66\u4e60','ai.extra':'\u989d\u5916\u6307\u4ee4','ai.extraPlaceholder':'\u7ed9 AI \u7684\u989d\u5916\u6307\u4ee4\uff08\u53ef\u9009\uff09...','ai.saveInstructions':'\u4fdd\u5b58\u6307\u4ee4','ai.noMemories':'\u6682\u65e0\u8bb0\u5fc6\u3002\u4e0e ChickBot \u804a\u5929\u6765\u5efa\u7acb\u4f60\u7684\u8d44\u6599\u3002',
    'data.title':'\u6570\u636e','data.desc':'\u5bfc\u51fa\u6570\u636e\u6216\u4ece\u5907\u4efd\u5bfc\u5165','data.export':'\u5bfc\u51fa\u6570\u636e','data.import':'\u5bfc\u5165\u6570\u636e',
    'about.title':'\u5173\u4e8e','about.desc':'Hav\u00ebn Schedule \u2014 \u4f60\u7684\u4e2a\u4eba\u667a\u80fd\u65e5\u7a0b\u7ba1\u7406',
    'nav.hub':'\u9996\u9875','nav.schedule':'\u65e5\u7a0b','nav.activities':'\u6d3b\u52a8','nav.analytics':'\u5206\u6790','nav.goals':'\u76ee\u6807','nav.finance':'\u8d22\u52a1','nav.gallery':'\u753b\u5eca','nav.friends':'\u670b\u53cb',
    'hub.greeting':'\u65e9\u4e0a\u597d','hub.today':'\u4eca\u5929','hub.week':'\u672c\u5468','hub.edit':'\u7f16\u8f91','hub.add':'\u6dfb\u52a0','hub.guide':'\u6307\u5357','hub.sectionGoals':'\u76ee\u6807\u4e0e\u4f18\u5148\u7ea7','hub.sectionSleep':'\u7761\u7720','hub.sectionViews':'\u89c6\u56fe','hub.viewSchedule':'\u65e5\u7a0b','hub.viewActivities':'\u6d3b\u52a8','hub.viewTags':'\u6807\u7b7e\u677f','hub.viewAnalytics':'\u5206\u6790','hub.viewGoals':'\u76ee\u6807','hub.galleryTasks':'\u672c\u5468','hub.galleryTotal':'\u603b\u8ba1','hub.galleryCategories':'\u5206\u7c7b','hub.galleryGoals':'\u76ee\u6807','hub.galleryOpen':'\u6253\u5f00','hub.galleryView':'\u67e5\u770b','hub.footer':'Hav\u00ebn Schedule v1.0','hub.export':'\u5bfc\u51fa','hub.import':'\u5bfc\u5165','hub.focus':'\u4e13\u6ce8',
    'sleep.log':'+ \u8bb0\u5f55\u7761\u7720','sleep.overview':'\u6982\u89c8','sleep.history':'\u5386\u53f2','sleep.insights':'\u6d1e\u5bdf','sleep.targets':'\u76ee\u6807','sleep.score':'\u5f97\u5206','sleep.lastNight':'\u6628\u665a','sleep.avg7':'7\u5929\u5e73\u5747','sleep.avgQuality':'\u5e73\u5747\u8d28\u91cf','sleep.consistency':'\u8fde\u7eed\u6027','sleep.thisWeek':'\u672c\u5468\u7761\u7720','sleep.noData':'\u6682\u65e0\u6570\u636e','sleep.noLogs':'\u8fd8\u6ca1\u6709\u7761\u7720\u8bb0\u5f55\u3002\u8bb0\u5f55\u4f60\u7684\u7b2c\u4e00\u4e2a\u591c\u665a\uff01','sleep.targetBedtime':'\u76ee\u6807\u7761\u7720\u65f6\u95f4','sleep.targetWake':'\u76ee\u6807\u9192\u6765\u65f6\u95f4','sleep.targetDuration':'\u76ee\u6807\u7761\u7720\u65f6\u957f','sleep.saveTargets':'\u4fdd\u5b58\u76ee\u6807','sleep.routine':'\u7761\u524d\u60ef\u4f8b','sleep.routineItem1':'\u5e8a\u524d30\u5206\u949f\u5173\u5c4f','sleep.routineItem2':'\u9605\u8bfb / \u653e\u677e','sleep.routineItem3':'\u51a5\u60f3 / \u547c\u5438','sleep.routineItem4':'\u5199\u65e5\u8bb0 / \u53cd\u601d','sleep.routineItem5':'\u4e0b\u53485\u70b9\u540e\u4e0d\u559d\u5496\u5561','sleep.routineItem6':'\u996e\u6c34','sleep.routineItem7':'\u63a9\u906e\u706f\u5149','sleep.routineItem8':'\u8f7b\u5fae\u62c9\u4f38','sleep.saveRoutine':'\u4fdd\u5b58\u60ef\u4f8b','sleep.qualityLabel':'\u8bb0\u5f553+\u4e2a\u591c\u665a',
    'spotify.title':'Spotify','spotify.noPlaylist':'\u6ca1\u6709\u64ad\u653e\u5217\u8868','spotify.addPlaylist':'\u6dfb\u52a0\u64ad\u653e\u5217\u8868','spotify.playlist':'\u64ad\u653e\u5217\u8868','spotify.toggle':'\u5207\u6362\u64ad\u653e\u5668','spotify.prev':'\u4e0a\u4e00\u4e2a\u64ad\u653e\u5217\u8868','spotify.next':'\u4e0b\u4e00\u4e2a\u64ad\u653e\u5217\u8868','spotify.settings':'\u7ba1\u7406\u64ad\u653e\u5217\u8868',
    'sidebar.theme':'\u4e3b\u9898','sidebar.settings':'\u8bbe\u7f6e','sidebar.visuals':'\u89c6\u89c9','sidebar.editNav':'\u7f16\u8f91\u4fa7\u680f\u5bfc\u822a',
    'chat.title':'ChickBot','chat.subtitle':'\u4f60\u7684\u667a\u80fd\u65e5\u7a0b\u4f19\u4f34','chat.placeholder':'\u54a8\u8be2\u4f60\u7684\u65e5\u7a0b...','chat.natural':'\u81ea\u7136\u8bed\u8a00\u7f16\u6392\u65e5\u7a0b','chat.settings':'\u8bbe\u7f6e','chat.close':'\u5173\u95ed','chat.send':'\u53d1\u9001',
    'sch.title':'\u65e5\u7a0b','sch.today':'\u4eca\u5929','sch.tasks':'\u4efb\u52a1','sch.holiday':'\u5047\u671f','sch.school':'\u5b66\u6821','sch.apiNoKey':'\u672a\u8bbe\u7f6e\u5bc6\u94a5','sch.apiActive':'\u5df2\u6fc0\u6d3b','sch.viewWeek':'\u5468\u89c6\u56fe','sch.viewMonth':'\u6708\u89c6\u56fe','sch.viewAgenda':'\u8bae\u7a0b\u89c6\u56fe','sch.week':'\u5468','sch.addCategory':'\u6dfb\u52a0\u5206\u7c7b','sch.catName':'\u5206\u7c7b\u540d\u79f0','sch.pickColor':'\u9009\u62e9\u989c\u8272','sch.cancel':'\u53d6\u6d88','sch.add':'\u6dfb\u52a0','sch.focus':'\u4e13\u6ce8','sch.ai':'AI','sch.ss':'\u622a\u56fe','sch.copyWeek':'\u590d\u5236\u672c\u5468','sch.cmdPalette':'\u547d\u4ee4\u9762\u677f',
    'menu.pages':'\u9875\u9762','menu.actions':'\u64cd\u4f5c','menu.today':'\u4eca\u5929','menu.newTask':'\u65b0\u4efb\u52a1','menu.theme':'\u4e3b\u9898',
    'acts.title':'\u6d3b\u52a8','acts.board':'\u770b\u677f','acts.timeline':'\u65f6\u95f4\u7ebf','acts.week':'\u672c\u5468','acts.total':'\u603b\u8ba1','acts.avgDay':'\u5e73\u5747/\u5929','acts.log':'\u6d3b\u52a8\u65e5\u5fd7','acts.addCat':'+ \u5206\u7c7b','acts.noTasks':'\u6682\u65e0\u4efb\u52a1','acts.completed':'\u5df2\u5b8c\u6210',
    'an.title':'\u5206\u6790','an.all':'\u5168\u90e8','an.tasks':'\u4efb\u52a1','an.time':'\u65f6\u95f4','an.deep':'\u6df1\u5ea6\u5de5\u4f5c','an.study':'\u5b66\u4e60','an.completion':'\u5b8c\u6210\u7387','an.streak':'\u8fde\u7eed\u8bb0\u5f55','an.daily':'\u6bcf\u65e5','an.weekly':'\u6bcf\u5468','an.pie':'\u997c\u56fe','an.bar':'\u6761\u5f62\u56fe','an.trend':'\u8d8b\u52bf','an.sleep':'\u7761\u7720','an.duration':'\u65f6\u957f','an.quality':'\u8d28\u91cf','an.table':'\u9010\u65e5\u8868','an.current':'\u5f53\u524d','an.best':'\u6700\u4f73','an.days':'\u5929','an.day':'\u5929','an.total':'\u603b\u8ba1','an.completed':'\u5df2\u5b8c\u6210','an.logged':'\u5df2\u8bb0\u5f55','an.nights':'\u665a','an.night':'\u591c\u665a','an.active':'\u6d3b\u8dc3','an.past7':'\u8fc7\u53bb7\u5929','an.thisMonth':'\u672c\u6708','an.breakdown':'\u5206\u89e3','an.distribution':'\u5206\u5e03',
    'gl.title':'\u76ee\u6807','gl.addGoal':'\u6dfb\u52a0\u76ee\u6807','gl.editGoal':'\u7f16\u8f91\u76ee\u6807','gl.deleteGoal':'\u5220\u9664\u76ee\u6807','gl.vision':'\u613f\u666f\u677f','gl.manifesto':'\u6708\u5ea6\u5ba3\u8a00','gl.related':'\u76f8\u5173\u4efb\u52a1','gl.noGoals':'\u6682\u65e0\u76ee\u6807','gl.progress':'\u8fdb\u5c55','gl.subtasks':'\u5b50\u4efb\u52a1','gl.due':'\u622a\u6b62','gl.target':'\u76ee\u6807',
    'fin.title':'\u8d22\u52a1','fin.income':'\u6536\u5165','fin.expense':'\u652f\u51fa','fin.piggy':'\u5b58\u94b1\u7f50','fin.wallet':'\u94b1\u5305','fin.add':'\u6dfb\u52a0','fin.subtract':'\u51cf\u5c11','fin.save':'\u4fdd\u5b58','fin.amount':'\u91d1\u989d','fin.category':'\u5206\u7c7b','fin.date':'\u65e5\u671f','fin.note':'\u5907\u6ce8','fin.type':'\u7c7b\u578b','fin.search':'\u641c\u7d22','fin.exportCSV':'\u5bfc\u51fa CSV','fin.noTransactions':'\u6682\u65e0\u4ea4\u6613','fin.period7d':'7\u5929','fin.period30d':'30\u5929','fin.periodMonth':'\u6708','fin.periodAll':'\u5168\u90e8','fin.intelligence':'\u6d88\u8d39\u667a\u80fd','fin.treemap':'\u6811\u56fe','fin.mom':'\u73af\u6bd4','fin.heatmap':'\u70ed\u529b\u56fe','fin.flow':'\u6d41\u5411','fin.merchants':'\u5546\u6237',
    'gal.title':'\u753b\u5eca','gal.add':'+ \u6dfb\u52a0\u56fe\u7247','gal.reset':'\u91cd\u7f6e','gal.noImages':'\u6682\u65e0\u56fe\u7247','gal.vision':'\u613f\u666f\u677f','gal.custom':'\u81ea\u5b9a\u4e49\u8bbe\u8ba1',
    'fr.title':'\u670b\u53cb','fr.add':'\u6dfb\u52a0\u670b\u53cb','fr.code':'\u670b\u53cb\u7801','fr.copy':'\u590d\u5236','fr.paste':'\u7c98\u8d34','fr.pending':'\u5f85\u63a5\u53d7','fr.accepted':'\u5df2\u63a5\u53d7','fr.empty':'\u6682\u65e0\u8054\u7cfb','fr.search':'\u641c\u7d22','fr.send':'\u53d1\u9001','fr.message':'\u6d88\u606f','fr.share':'\u5206\u4eab\u7801','fr.connect':'\u8fde\u63a5','fr.enterCode':'\u8f93\u5165\u670b\u53cb\u7801','fr.yourCode':'\u4f60\u7684\u7801','fr.connections':'\u8054\u7cfb',
    'common.monday':'\u661f\u671f\u4e00','common.sunday':'\u661f\u671f\u65e5','common.save':'\u4fdd\u5b58','common.cancel':'\u53d6\u6d88','common.delete':'\u5220\u9664','common.show':'\u663e\u793a','common.hide':'\u9690\u85cf','common.enterKey':'\u8f93\u5165\u5bc6\u94a5','common.quickActions':'\u5feb\u901f\u64cd\u4f5c','common.customize':'\u81ea\u5b9a\u4e49','common.help':'\u5e2e\u52a9','common.settings':'\u8bbe\u7f6e','common.menu':'\u83dc\u5355','common.pages':'\u9875\u9762','common.add':'\u6dfb\u52a0','common.edit':'\u7f16\u8f91','common.close':'\u5173\u95ed','common.search':'\u641c\u7d22','common.noData':'\u6682\u65e0\u6570\u636e','appearance.title':'\u5916\u89c2',
    'common.done':'完成','common.stop':'停止','common.send':'发送','common.name':'姓名','common.note':'备注','common.url':'网址','common.today':'今天','common.all':'全部','hub.editMode':'编辑模式','hub.duplicate':'复制','hub.bringForward':'前移一层','hub.doneEditing':'完成编辑','hub.hideBubbles':'隐藏气泡','hub.sizeSmall':'小 (160x100)','hub.weatherError':'无法加载天气','hub.geoUnavail':'地理位置不可用','common.completed':'已完成','an.learning':'学习','pomo.ready':'准备专注','pomo.paused':'已暂停','pomo.focusSession':'专注会话','sch.noTasks':'本周没有任务','chat.noKey':'在设置中配置 API 密钥即可聊天...','an.surplus':'14天盈余','an.avgAcross':'平均','acts.deleted':'任务已删除','gl.noRelated':'没有相关任务','gl.allDone':'所有目标已达成！','gal.designs':'你的设计 & 海报','gal.removed':'图片已从画廊删除','gal.noReset':'没有自定义图片可重置','fr.ownCode':'那是你自己的好友码！','fr.adding':'添加中...','fr.noServer':'无法连接到服务器。请稍后再试。','fr.noUser':'未找到该好友码对应的用户','fr.requestSent':'好友请求已发送。等待对方接受。','fr.sentTo':'好友请求已发送至','fr.removeFriend':'删除此好友连接？','sch.addToCal':'添加到日历','about.version':'版本 1.0.0','account.deletedAll':'所有数据已删除','account.nameReq':'姓名为必填项','toast.synced':'已从云端同步','toast.undoOk':'撤销成功','toast.noFirebase':'Firebase SDK 未加载。请刷新页面。','toast.signInFail':'登录失败','toast.switched':'已切换至','toast.initCloud':'正在初始化云存储...','toast.noGoogle':'未找到 Google 认证的个人资料','toast.syncing':'同步中...','toast.focusOn':'专注模式已激活','toast.ssSaved':'截图已保存！','toast.noTasksWeek':'本周没有未完成的任务','toast.copied':'已复制','pomo.willPush':'推送中','img.paste':'粘贴图片 (Ctrl+V) 或输入网址','img.notImage':'不是图片文件','img.processing':'处理图片中...','img.loaded':'图片已加载 - 点击保存应用','img.urlLoaded':'网址已加载 - 点击保存应用','fin.addTransactions':'添加交易以解锁消费智能分析。','fin.noExpenses':'没有可可视化的支出。','fin.noFlow':'添加交易以查看现金流瀑布图。','fin.noMerchants':'添加备注到支出来跟踪商户。','chat.signIn':'登录以聊天','common.remove':'删除','common.task':'任务','sch.toNextWeek':'到下周','hub.idea':'灵感','fr.needSignIn':'需要登录才能添加好友','fr.alreadyFriends':'你们已经是好友了','img.enterBoth':'请输入标签和网址','img.storageFull':'无法保存：localStorage 可能已满','toast.editOn':'编辑模式已开启','img.storageFull2':'无法保存图片：存储已满',
    'lang.en':'English','lang.id':'Bahasa Indonesia','lang.zh':'\u4e2d\u6587',
  },
};

var _currentLang = 'en';

function getLang() {
  var saved = 'en';
  try { saved = localStorage.getItem('haven-language') || 'en'; } catch (e) {}
  if (!LANG[saved]) saved = 'en';
  return saved;
}

function t(key) {
  var lang = getLang();
  var dict = LANG[lang] || LANG.en;
  return dict[key] || LANG.en[key] || key;
}

function applyLanguage(lang) {
  if (!lang) lang = getLang();
  if (!LANG[lang]) lang = 'en';
  _currentLang = lang;
  try { localStorage.setItem('haven-language', lang); } catch (e) {}
  document.documentElement.lang = lang === 'zh' ? 'zh-CN' : lang === 'id' ? 'id' : 'en';
  document.querySelectorAll('[data-i18n]').forEach(function(el) {
    var key = el.dataset.i18n;
    var text = t(key);
    if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
      el.placeholder = text;
    } else if (el.tagName === 'LABEL' || el.tagName === 'BUTTON') {
      el.textContent = text;
    } else {
      el.textContent = text;
    }
  });
  // Translate sidebar nav labels by href
  document.querySelectorAll('.hub-snav-item .snav-label').forEach(function(el) {
    var a = el.closest('a');
    if (!a) return;
    var href = a.getAttribute('href');
    var map = { 'index.html':'nav.hub','schedule.html':'nav.schedule','activities.html':'nav.activities','analytics.html':'nav.analytics','goals.html':'nav.goals','finance.html':'nav.finance','gallery.html':'nav.gallery' };
    var key = map[href];
    if (key) el.textContent = t(key);
  });
  // Translate sidebar footer buttons
  var footerBtnMap = {};
  footerBtnMap['Theme'] = 'sidebar.theme'; footerBtnMap['Settings'] = 'sidebar.settings'; footerBtnMap['Visuals'] = 'sidebar.visuals';
  document.querySelectorAll('.hub-footer-btns .btn span').forEach(function(el) {
    var txt = (el.textContent || '').trim();
    var key = footerBtnMap[txt];
    if (key) el.textContent = t(key);
  });
  // Translate theme/settings/help buttons in menu panel
  document.querySelectorAll('.hub-menu-panel-item').forEach(function(el) {
    var txt = (el.textContent || '').trim();
    var map = { 'Theme':'appearance.title','Settings':'common.settings','Help':'common.help' };
    var key = map[txt];
    if (key) {
      var textNode = el.childNodes[el.childNodes.length - 1];
      if (textNode) textNode.textContent = t(key);
    }
  });
  // Translate hamburger menu "Quick Actions", "Customize"
  var qa = document.getElementById('menuPlus');
  if (qa) { var qaSpan = qa.querySelector('span'); if (qaSpan) qaSpan.textContent = t('common.quickActions'); }
  var cust = document.getElementById('menuPlusCustLabel');
  if (cust) cust.textContent = t('common.customize');
  // Translate Menu panel title and Pages section label
  var mTitle = document.querySelector('.hub-menu-panel-title');
  if (mTitle) mTitle.textContent = t('common.menu');
  var ppLabel = document.querySelector('.hub-sidebar-section-label');
  if (ppLabel) ppLabel.textContent = t('common.pages');
  // Translate old settings drawer nav items
  document.querySelectorAll('.settings-nav-item').forEach(function(el) {
    var section = el.dataset.section;
    var map = { 'ai':'ai.title','profile':'account.title','appearance':'appearance.title','access':'settings.access','data':'data.title' };
    var key = map[section];
    var span = el.querySelector('span');
    if (key && span) span.textContent = t(key);
  });
  var drawerLabel = document.querySelector('.settings-nav-section-label');
  if (drawerLabel) drawerLabel.textContent = t('common.settings');
  // Translate spotify sidebar elements
  var spHeader = document.querySelector('.sp-header-text');
  if (spHeader) spHeader.textContent = t('spotify.title');
  var spLabel = document.querySelector('.sp-controls-label');
  if (spLabel) spLabel.textContent = t('spotify.playlist');
  // Translate hub hero greeting
  var hubGreeting = document.getElementById('hubGreeting');
  if (hubGreeting) hubGreeting.textContent = t('hub.greeting');
  // Translate TODAY/WEEK stat labels
  var todayLabel = document.querySelector('.glass-card.dark-stat:first-child div:last-child');
  if (todayLabel) todayLabel.textContent = t('hub.today');
  var weekLabel = document.querySelectorAll('.glass-card.dark-stat')[1];
  if (weekLabel) {
    var weekDiv = weekLabel.querySelector('div:last-child');
    if (weekDiv) weekDiv.textContent = t('hub.week');
  }
  // Translate sch-menu-popup labels
  document.querySelectorAll('.sch-menu-label').forEach(function(el) {
    var txt = (el.textContent || '').trim();
    var map = { 'Pages':'menu.pages', 'Actions':'menu.actions' };
    if (map[txt]) el.textContent = t(map[txt]);
  });
  document.querySelectorAll('.sch-menu-item').forEach(function(el) {
    var txt = (el.textContent || '').trim();
    var map = { 'Hub':'nav.hub','Schedule':'nav.schedule','Activities':'nav.activities','Analytics':'nav.analytics','Goals':'nav.goals','Finance':'nav.finance','Gallery':'nav.gallery','Today':'menu.today','New Task':'menu.newTask','Theme':'menu.theme' };
    if (map[txt]) {
      var textNode = el.childNodes[el.childNodes.length - 1];
      if (textNode) textNode.textContent = t(map[txt]);
    }
  });
  // Translate AI chat panel
  var chatTitle = document.querySelector('.ai-panel-title');
  if (chatTitle) chatTitle.textContent = t('chat.title');
  var chatSub = document.querySelector('.ai-panel-subtitle');
  if (chatSub) chatSub.textContent = t('chat.subtitle');
  var chatInput = document.getElementById('aiChatInput');
  if (chatInput) chatInput.placeholder = t('chat.placeholder');
  var chatHint = document.querySelector('.ai-panel-footer-hint span');
  if (chatHint) chatHint.textContent = t('chat.natural');
  // Re-render open settings bubble nav + content
  if (typeof renderSettingsNav === 'function' && document.getElementById('settingsNav')) {
    renderSettingsNav();
  }
  if (typeof settingsPanelActiveCategory !== 'undefined' && settingsPanelActiveCategory && typeof switchSettingsCategory === 'function') {
    switchSettingsCategory(settingsPanelActiveCategory);
  }
  // Auto-translate remaining text nodes
  translateTextNodes();
}

// ─── AUTO-TRANSLATE SYSTEM ────────────────────────────
// Maps English text patterns to i18n keys for auto-translation
var _ENG_TXT = {
  // Common
  'Done':'common.done','Start':'common.start','Pause':'common.pause','Resume':'common.resume',
  'Stop':'common.stop','Close':'common.close','Save':'common.save','Cancel':'common.cancel',
  'Delete':'common.delete','Add':'common.add','Edit':'common.edit','Search':'common.search',
  'Send':'common.send','Share':'common.share','Copy':'common.copy','Paste':'common.paste',
  'Name':'common.name','Email':'common.email','Date':'common.date','Time':'common.time',
  'Note':'common.note','Type':'common.type','Status':'common.status','Link':'common.link',
  'URL':'common.url','Image':'common.image','Images':'common.images','Label':'common.label',
  'Settings':'common.settings','Theme':'appearance.title','Help':'common.help',
  'Today':'common.today','Week':'common.week','Month':'common.month','Year':'common.year',
  'All':'common.all','None':'common.none',
  // Hub
  'Good morning':'hub.greeting','Good afternoon':'hub.greetingPM','Good evening':'hub.greetingPM',
  'Edit Mode':'hub.editMode','ON':'common.on','OFF':'common.off',
  'Edit':'hub.edit','Add':'hub.add','Guide':'hub.guide',
  'Goals & Priorities':'hub.sectionGoals','Sleep':'hub.sectionSleep','Views':'hub.sectionViews',
  'TODAY':'hub.today','WEEK':'hub.week',
  'Export':'hub.export','Import':'hub.import','Focus':'hub.focus',
  'Duplicate':'hub.duplicate','Remove':'hub.remove','Reset Size':'hub.resetSize',
  'Bring Forward':'hub.bringForward','Send Backward':'hub.sendBackward',
  'Done Editing':'hub.doneEditing','Customize':'common.customize',
  'Hide Bubbles':'hub.hideBubbles',
  'Small (160x100)':'hub.sizeSmall','Medium (240x160)':'hub.sizeMedium','Large (340x240)':'hub.sizeLarge',
  'Could not load weather':'hub.weatherError','Location access needed':'hub.geoNeeded',
  'Geolocation unavailable':'hub.geoUnavail',
  // Chart common
  'completed':'common.completed','scheduled':'common.scheduled','focus time':'an.focusTime',
  'learning':'an.learning','All Time':'an.allTime',
  'No data':'common.noData','No sleep data':'sleep.noData',
  // Schedule
  'No key':'sch.apiNoKey','School':'sch.school','Holiday':'sch.holiday','tasks':'sch.tasks',
  'Ready to focus':'pomo.ready','Focusing...':'pomo.focusing','Break time':'pomo.break',
  'Paused':'pomo.paused','Session complete!':'pomo.complete',
  'Focus Session':'pomo.focusSession',
  'No tasks this week':'sch.noTasks','No subcategories':'sch.noSubcats',
  'Category name':'sch.catName','Pick a colour':'sch.pickColor','Add category':'sch.addCategory',
  'Copy Week':'sch.copyWeek','Screenshot':'sch.ss',
  // Sleep
  '+ Log Sleep':'sleep.log','Overview':'sleep.overview','History':'sleep.history',
  'Insights':'sleep.insights','Targets':'sleep.targets','Score':'sleep.score',
  'last night':'sleep.lastNight','7-Day Avg':'sleep.avg7','Avg Quality':'sleep.avgQuality',
  'Consistency':'sleep.consistency','This Week\'s Sleep':'sleep.thisWeek',
  'No data yet':'sleep.noData','No sleep logs yet. Log your first night!':'sleep.noLogs',
  'Target Bedtime':'sleep.targetBedtime','Target Wake Time':'sleep.targetWake',
  'Target Duration':'sleep.targetDuration','Save Targets':'sleep.saveTargets',
  'Bedtime Routine':'sleep.routine','Save Routine':'sleep.saveRoutine',
  'Log 3+ nights':'sleep.qualityLabel',
  // Spotify
  'Spotify':'spotify.title','Playlist':'spotify.playlist',
  'No playlist linked':'spotify.noPlaylist','Add playlist':'spotify.addPlaylist',
  // AI / Chat
  'ChickBot':'chat.title','Your smart schedule buddy':'chat.subtitle',
  'Ask about your schedule...':'chat.placeholder','Natural language scheduling':'chat.natural',
  'Configure an API key in Settings to chat...':'chat.noKey',
  // Analytics
  'Tasks':'an.tasks','Time':'an.time','Deep Work':'an.deep','Study':'an.study',
  'Completion':'an.completion','Streak':'an.streak','Daily Breakdown':'an.daily',
  'Distribution':'an.distribution','Weekly Trend':'an.trend','Duration':'an.duration',
  'Quality':'an.quality','Day-by-Day':'an.table','Active':'an.active',
  'This Week':'an.weekly','This Month':'an.thisMonth',
  'Past 7 days':'an.past7','Current':'an.current','Best':'an.best','days':'an.days','night':'an.night',
  'Surplus over 14 days':'an.surplus','Deficit over 14 days':'an.deficit','Balanced':'an.balanced',
  'Average across':'an.avgAcross','Log 3+ nights to calculate':'an.logMore',
  // Activities
  'Board':'acts.board','Timeline':'acts.timeline',
  'Activity Log':'acts.log','No tasks yet':'acts.noTasks','Complete a task to see it here':'acts.empty',
  'Task deleted':'acts.deleted','Completion undone':'acts.undone','tasks across all categories':'acts.across',
  // Goals
  'No goals yet':'gl.noGoals','Add your first goal to start tracking':'gl.addFirst',
  'No related tasks':'gl.noRelated','Define what matters':'gl.define',
  'All goals achieved!':'gl.allDone','active':'gl.active','completed':'gl.completed',
  'overall progress':'gl.progress','Track your aspirations':'gl.track',
  'Vision Board':'gl.vision','Monthly Manifesto':'gl.manifesto','Related Tasks':'gl.related',
  // Gallery
  'Vision Board':'gal.vision','Start your collection':'gal.start',
  'Your designs & posters':'gal.designs','Add your first image':'gal.addFirst',
  'Image removed from gallery':'gal.removed','Gallery reordered':'gal.reordered',
  'No custom images to reset':'gal.noReset','image':'gal.image','images':'gal.images',
  // Friends
  'Please enter a friend code':'fr.enterCode',
  'You need to be signed in to add friends':'fr.needSignIn',
  'That\'s your own friend code!':'fr.ownCode',
  'Adding...':'fr.adding','Looking up friend code...':'fr.looking',
  'Could not connect to server. Try again later.':'fr.noServer',
  'No user found with that friend code':'fr.noUser',
  'You are already friends with':'fr.alreadyFriends',
  'Friend request already sent. Waiting for them to accept.':'fr.requestSent',
  'Friend request sent to':'fr.sentTo','connections':'fr.connections','friends':'fr.friends',
  'Remove this friend connection?':'fr.removeFriend',
  'Pending':'fr.pending','Accepted':'fr.accepted',
  // Finance
  'Income':'fin.income','Expense':'fin.expense','Piggy Bank':'fin.piggy','Wallet':'fin.wallet',
  'Amount':'fin.amount','Category':'fin.category','Date':'fin.date','Note':'fin.note',
  'Search':'fin.search','Export CSV':'fin.exportCSV',
  'Spending Intelligence':'fin.intelligence',
  // Pages
  'Hub':'nav.hub','Schedule':'nav.schedule','Activities':'nav.activities',
  'Analytics':'nav.analytics','Goals':'nav.goals','Finance':'nav.finance',
  'Gallery':'nav.gallery','Friends':'nav.friends',
  'Pages':'common.pages','Actions':'common.actions','Menu':'common.menu','Quick Actions':'common.quickActions',
  // Schedule menu
  'New Task':'menu.newTask','Theme':'menu.theme',
  // Sidebar
  'Theme':'sidebar.theme','Settings':'sidebar.settings','Visuals':'sidebar.visuals',
  // Buttons
  'Add to Calendar':'sch.addToCal',
  // Settings
  'My Account':'account.title','Appearance':'appearance.title','AI & API':'ai.title',
  'Data':'data.title','About':'about.title','Access Hub':'settings.access',
  'PREFERENCES':'account.preferences','Language':'account.language','Timezone':'account.timezone',
  'Week starts on':'account.weekStart','Time format':'account.timeFormat',
  'DATA & PRIVACY':'account.dataPrivacy',
  'Sign in with Google':'account.google','Add local profile':'account.local','Sign Out':'account.signOut',
  'Export Data':'data.export','Import Data':'data.import',
  'Version 1.0.0':'about.version','GitHub':'about.github',
  'All data deleted':'account.deletedAll','Profile updated':'account.updated',
  'Name is required':'account.nameReq','Data exported':'account.dataExported',
  // Toast / status
  'Synced from cloud':'toast.synced','Cloud write failed':'toast.writeFailed',
  'Undo successful':'toast.undoOk','Settings saved':'toast.saved','API key cleared':'toast.keyCleared',
  'Firebase SDK not loaded. Refresh the page.':'toast.noFirebase',
  'Sign-in failed':'toast.signInFail','Signed in as':'toast.signedIn',
  'Switched to':'toast.switched','Profile removed':'toast.profileRemoved',
  'Initializing cloud storage...':'toast.initCloud',
  'No Google-authenticated profile found':'toast.noGoogle',
  'Syncing...':'toast.syncing','All data synced!':'toast.synced',
  // Focus mode
  'Focus mode activated':'toast.focusOn','Focus mode deactivated':'toast.focusOff',
  'Screenshot saved!':'toast.ssSaved','No week loaded':'toast.noWeek',
  'No uncompleted tasks this week':'toast.noTasksWeek',
  'Copied':'toast.copied',
  // Pomodoro
  'Will push':'pomo.willPush',
  // Image picker
  'Paste an image (Ctrl+V) or type a URL':'img.paste',
  'Not an image file':'img.notImage','Image too large (max 2MB)':'img.tooLarge',
  'Processing image...':'img.processing',
  'Image loaded - click Save to apply':'img.loaded',
  'URL loaded - click Save to apply':'img.urlLoaded','Saved!':'img.saved',
  'Enter both a label and URL':'img.enterBoth',
  'Could not save: localStorage might be full':'img.storageFull',
  'Edit Mode ON':'toast.editOn','Edit Mode OFF':'toast.editOff',
  'Could not save image: storage full':'img.storageFull2',
  // Fin toasts
  'Add transactions to unlock spending intelligence.':'fin.addTransactions',
  'No expenses to visualize.':'fin.noExpenses',
  'Add transactions to see your cash flow waterfall.':'fin.noFlow',
  'Add notes to your expenses to track merchants.':'fin.noMerchants',
  // Chat
  'Sign in to chat':'chat.signIn','No conversations yet':'chat.noConvos',
  // Confirm dialogs
  'Remove':'common.remove',
  // Copy Week
  'task':'common.task','task(s)':'common.tasks',
  'to next week':'sch.toNextWeek',
  // Access Hub
  'Focus':'hub.focus','AI':'sch.ai','Screenshot':'sch.ss','Templates':'sch.templates',
  'Idea':'hub.idea',
};

// Auto-translate a string by looking up its i18n key
function tStr(text) {
  if (!text || typeof text !== 'string') return text;
  var trimmed = text.trim();
  // Check exact match
  if (_ENG_TXT[trimmed]) return t(_ENG_TXT[trimmed]);
  // Check with a leading number: "5 tasks" -> translate "tasks"
  var numMatch = trimmed.match(/^(\d+)\s+(.+)/);
  if (numMatch) {
    var num = numMatch[1];
    var rest = numMatch[2];
    if (_ENG_TXT[rest]) return num + ' ' + t(_ENG_TXT[rest]);
  }
  // Check with trailing number: "tasks across all categories" -> full match already handled above
  // Check possessive: "Friend request sent to Name" -> translate "Friend request sent to"
  for (var key in _ENG_TXT) {
    if (trimmed.indexOf(key) === 0) {
      var after = trimmed.slice(key.length);
      return t(_ENG_TXT[key]) + after;
    }
  }
  return text;
}

// Walk DOM text nodes and auto-translate known text
function translateTextNodes(root) {
  if (!root) root = document.body;
  if (!root) return;
  var walker = document.createTreeWalker(root, 4, null, false); // NodeFilter.SHOW_TEXT
  var node;
  var nodes = [];
  while (node = walker.nextNode()) nodes.push(node);
  for (var i = 0; i < nodes.length; i++) {
    var n = nodes[i];
    if (!n.parentNode) continue;
    var el = n.parentNode;
    if (el.nodeType === 1) {
      var tag = el.tagName;
      if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'SVG' || tag === 'PATH' ||
          tag === 'TEXTAREA' || tag === 'INPUT' || tag === 'OPTION') continue;
      if (el.closest && (el.closest('svg') || el.closest('style') || el.closest('script'))) continue;
      if (el.hasAttribute && el.hasAttribute('data-i18n')) continue;
    }
    var txt = n.nodeValue;
    if (!txt || !txt.trim()) continue;
    // Skip if contains only numbers or symbols
    if (/^[\d\s\.,\-:;!?%°#@$€£¥₩\/()\[\]{}'"]+$/.test(txt.trim())) continue;
    var translated = tStr(txt);
    if (translated !== txt) {
      n.nodeValue = translated;
    }
  }
}

// ─── WRAP NATIVE DIALOGS ──────────────────────────────
var _origConfirm = window.confirm;
var _origPrompt = window.prompt;
var _origAlert = window.alert;
window.confirm = function(msg) { return _origConfirm(tStr(msg)); };
window.prompt = function(msg, def) { return _origPrompt(tStr(msg), def); };
window.alert = function(msg) { _origAlert(tStr(msg)); };

var DEFAULT_ACCESS_BUBBLES = {
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
    conversationMemory: {},   // { key: { fact, date, source } }
    planStats: { accepted: 0, rejected: 0, total: 0 },
    suggestedTitles: {},      // { tag: [titles the user tends to use] }
    isHoliday: false,
  };
}

function saveUserProfile() {
  try {
    localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(state.userProfile));
  } catch (e) { /* ignore */ }
}

function getHolidayMode() {
  if (!state.userProfile) loadUserProfile();
  return state.userProfile && state.userProfile.isHoliday === true;
}

function toggleHolidayMode() {
  if (!state.userProfile) loadUserProfile();
  state.userProfile.isHoliday = !state.userProfile.isHoliday;
  saveUserProfile();
  return state.userProfile.isHoliday;
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

function getPreferredTag() {
  const tags = state.userProfile?.tags;
  if (!tags) return null;
  let bestTag = null, bestCount = 0;
  for (const [tag, data] of Object.entries(tags)) {
    if (data.count > bestCount) { bestCount = data.count; bestTag = tag; }
  }
  return bestTag;
}

function getPreferredTitle(tag) {
  const t = state.userProfile?.tags?.[tag];
  return t && t.titles.length > 0 ? getModeValue(t.titles) : null;
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
  if (p.totalTasksCreated === 0 && p.totalSessions === 0) return getConversationMemory() + getScheduleInsights() + getPlanLearning();

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

  return '\n' + lines.join('\n') + getConversationMemory() + getScheduleInsights() + getPlanLearning();
}

// ─── CONVERSATION MEMORY (AI learns from chats) ──────────
function storeMemory(key, fact, source) {
  if (!state.userProfile) loadUserProfile();
  if (!state.userProfile.conversationMemory) state.userProfile.conversationMemory = {};
  state.userProfile.conversationMemory[key] = {
    fact: String(fact).slice(0, 500),
    date: formatDate(new Date()),
    source: source || 'chat',
    updated: Date.now()
  };
  saveUserProfile();
}

function getConversationMemory() {
  if (!state.userProfile?.conversationMemory) return '';
  const mems = state.userProfile.conversationMemory;
  const keys = Object.keys(mems);
  if (keys.length === 0) return '';
  const lines = keys.map(k => {
    const m = mems[k];
    return `- ${k}: ${m.fact}`;
  });
  return '\n\nTHINGS I\'VE LEARNED ABOUT YOU:\n' + lines.join('\n');
}

function trackPlanResult(accepted) {
  if (!state.userProfile) loadUserProfile();
  if (!state.userProfile.planStats) state.userProfile.planStats = { accepted: 0, rejected: 0, total: 0 };
  state.userProfile.planStats.total++;
  if (accepted) state.userProfile.planStats.accepted++;
  else state.userProfile.planStats.rejected++;
  saveUserProfile();
}

function getPlanLearning() {
  if (!state.userProfile?.planStats || state.userProfile.planStats.total === 0) return '';
  const s = state.userProfile.planStats;
  const acceptRate = Math.round((s.accepted / s.total) * 100);
  return `\nPlan acceptance rate: ${acceptRate}% (${s.accepted} accepted, ${s.rejected} rejected out of ${s.total})`;
}

// Deeper schedule pattern analysis
function getScheduleInsights() {
  const tasks = state.tasks;
  if (!tasks || tasks.length < 3) return '';

  const lines = [];
  // Most common task durations by tag
  const durByTag = {};
  for (const t of tasks) {
    if (!t.startTime || !t.endTime || isWhiteboardTask(t)) continue;
    const d = getDurationMinutes(t);
    if (!durByTag[t.tag]) durByTag[t.tag] = [];
    durByTag[t.tag].push(d);
  }
  const durInsights = [];
  for (const [tag, durs] of Object.entries(durByTag)) {
    if (durs.length >= 3) {
      const avg = Math.round(durs.reduce((s, v) => s + v, 0) / durs.length);
      const label = TAG_LABELS[tag] || tag;
      durInsights.push(`${label}: avg ${formatDuration(avg)}`);
    }
  }
  if (durInsights.length > 0) {
    lines.push('\nAVERAGE DURATIONS BY TYPE:');
    lines.push(durInsights.join(', '));
  }

  // Task density — how many tasks per day on average
  const taskDates = {};
  for (const t of tasks) {
    if (!t.date || isWhiteboardTask(t)) continue;
    taskDates[t.date] = (taskDates[t.date] || 0) + 1;
  }
  const dateCounts = Object.values(taskDates);
  if (dateCounts.length > 0) {
    const avgPerDay = Math.round(dateCounts.reduce((s, v) => s + v, 0) / dateCounts.length * 10) / 10;
    lines.push(`Avg tasks per day: ${avgPerDay}`);
  }

  // Completion rate
  const total = tasks.filter(t => !isWhiteboardTask(t)).length;
  const completed = tasks.filter(t => t.completed).length;
  if (total > 0) {
    const compRate = Math.round((completed / total) * 100);
    lines.push(`Overall completion rate: ${compRate}% (${completed}/${total})`);
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
    safeSetItem(STORAGE_KEY, JSON.stringify(state.tasks));
    safeSetItem(SETTINGS_KEY, JSON.stringify({
      showWeekends: state.showWeekends,
      showCompleted: state.showCompleted,
      darkMode: state.darkMode,
      accessBubbles: state.accessBubbles,
      accentColor: state.accentColor,
      accentCustomColors: state.accentCustomColors,
      accentRemovedPresets: state.accentRemovedPresets,
      currentView: state.currentView || 'week',
      currentWeekStart: state.currentWeekStart ? formatDate(state.currentWeekStart) : null,
      currentMonthDate: state.currentMonthDate ? formatDate(state.currentMonthDate) : null,
      savedScrollPosition: state.savedScrollPosition ?? null
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
      state.accentColor = s.accentColor || null;
      state.accentCustomColors = s.accentCustomColors || [];
      state.accentRemovedPresets = s.accentRemovedPresets || [];
      state.currentView = (s.currentView && ['week','month','agenda'].includes(s.currentView)) ? s.currentView : 'week';
      if (s.currentWeekStart) state.currentWeekStart = new Date(s.currentWeekStart + 'T00:00:00');
      if (s.currentMonthDate) state.currentMonthDate = new Date(s.currentMonthDate + 'T00:00:00');
      state.savedScrollPosition = s.savedScrollPosition ?? null;
      // Images are restored via haven-image-* keys directly
    }
    const key = localStorage.getItem(API_KEY_STORAGE);
    if (key) state.apiKey = key;
    const model = localStorage.getItem(API_MODEL_STORAGE);
    if (model) state.apiModel = model;
    const provider = localStorage.getItem(API_PROVIDER_STORAGE);
    if (provider) state.apiProvider = provider;
    initCustomTags();
    initCustomCategories();
    loadCardColors();
    loadUserProfile();
    loadImages();
    // Clean up deprecated ai mode storage
    try { localStorage.removeItem('haven-schedule-ai-mode'); } catch (e) { /* ignore */ }
  } catch (e) { console.warn('[img] loadState failed:', e); /* fresh start */ }
}

// ─── CUSTOM IMAGES ─────────────────────────────────────────
const DEFAULT_IMAGES = {
  'hub-hero': '',
  'hub-tulips': '',
  'hub-desk-water': '',
  'hub-lamp': '',
  'hub-skyline': '',
  'hub-bedroom': '',
  'weekly-coffee': '',
  'weekly-journal': '',
  'brain-linen': '',
  'brain-desk-light': '',
  'goals-tulips': '',
  'goals-book': '',
  'goals-studio': '',
  'schedule-hero': '',
  'schedule-coffee': '',
  'activities-hero': '',
  'tags-hero': '',
  'tags-studio': '',
  'analytics-hero': '',
  'finance-hero': '',
  'goals-hero': '',
  'hub-image-1': '',
  'hub-image-2': '',
  'hub-image-3': '',
  'hub-image-4': '',
  'hub-image-5': '',
  'hub-image-6': '',
  'hub-image-7': '',
  'hub-image-8': '',
  'hub-image-9': '',
  'hub-image-10': '',
  'friends-hero': '',
  'gallery-hero': '',
  'sidebar-schedule': '',
  'sidebar-activities': '',
  'sidebar-analytics': '',
  'sidebar-goals': '',
  'sidebar-finance': '',
  'sidebar-tags': '',
  'sidebar-index': '',
  'sidebar-gallery': '',
  'gallery-schedule': '',
  'gallery-activities': '',
  'gallery-tags': '',
  'gallery-analytics': '',
  'gallery-goals': ''
};

// ─── INDEXEDDB FOR IMAGES (unlimited storage) ──────────────
var _IMG_DB = null;
var _IMG_DB_PENDING = null;
function _imgDB() {
  if (_IMG_DB) return Promise.resolve(_IMG_DB);
  if (_IMG_DB_PENDING) return _IMG_DB_PENDING;
  _IMG_DB_PENDING = new Promise(function(resolve, reject) {
    var pre = getStoragePrefix();
    var dbName = pre ? 'haven-images-' + pre.slice(0, -1) : 'haven-images';
    var req = indexedDB.open(dbName, 1);
    req.onupgradeneeded = function(e) {
      var db = e.target.result;
      if (!db.objectStoreNames.contains('images')) db.createObjectStore('images');
    };
    req.onsuccess = function(e) {
      _IMG_DB = e.target.result;
      _IMG_DB_PENDING = null;
      resolve(_IMG_DB);
    };
    req.onerror = function(e) { reject(e.target.error); };
  });
  return _IMG_DB_PENDING;
}
function _imgDBPut(id, url) {
  return _imgDB().then(function(db) {
    return new Promise(function(resolve, reject) {
      var tx = db.transaction('images', 'readwrite');
      tx.objectStore('images').put(url, id);
      tx.oncomplete = function() { resolve(); };
      tx.onerror = function(e) { reject(e.target.error); };
    });
  });
}
function _imgDBGet(id) {
  return _imgDB().then(function(db) {
    return new Promise(function(resolve, reject) {
      var tx = db.transaction('images', 'readonly');
      var req = tx.objectStore('images').get(id);
      req.onsuccess = function() { resolve(req.result); };
      req.onerror = function(e) { reject(e.target.error); };
    });
  });
}
function _imgDBDelete(id) {
  return _imgDB().then(function(db) {
    return new Promise(function(resolve, reject) {
      var tx = db.transaction('images', 'readwrite');
      tx.objectStore('images').delete(id);
      tx.oncomplete = function() { resolve(); };
      tx.onerror = function(e) { reject(e.target.error); };
    });
  });
}
function _imgDBGetAll() {
  return _imgDB().then(function(db) {
    return new Promise(function(resolve, reject) {
      var tx = db.transaction('images', 'readonly');
      var store = tx.objectStore('images');
      var req = store.openCursor();
      var results = {};
      req.onsuccess = function(e) {
        var cursor = e.target.result;
        if (cursor) { results[cursor.key] = cursor.value; cursor.continue(); }
        else resolve(results);
      };
      req.onerror = function(e) { reject(e.target.error); };
    });
  });
}

function loadImages() {
  state.images = { ...DEFAULT_IMAGES };
  try { restoreDirectImageKeys(); } catch(e) { /* skip */ }
  // After restoring, re-apply images to the DOM in case DOM is ready
  try { applyImages(); } catch(e) { /* DOM may not be ready yet */ }
  // Async: load from IndexedDB (unlimited storage) and merge in
  _imgDBGetAll().then(function(dbImages) {
    var changed = false;
    for (var k in dbImages) {
      if (dbImages.hasOwnProperty(k) && state.images[k] !== dbImages[k]) {
        state.images[k] = dbImages[k];
        changed = true;
      }
    }
    if (changed) try { applyImages(); } catch(e) {}
  }).catch(function() {});
}

// --- APPLY IMAGES TO DOM ---
function applyImages() {
  var _isLanding = location.pathname.split('/').pop() === 'landing.html';
  document.querySelectorAll("img[data-image-id]").forEach(function(el) {
    var _id = el.dataset.imageId;
    if (_id) {
      var url = getImage(_id);
      if (url) {
        el.src = url;
        el.style.display = "block";
        el.removeAttribute("data-empty-img");
        var wrap = el.closest(".bento-img-wrap");
        if (wrap) {
          var placeholder = wrap.querySelector(".bento-img-placeholder");
          if (placeholder) placeholder.style.display = "none";
        }
        // Remove any .img-empty-placeholder sibling when image is set
        var _parent = el.parentElement;
        if (_parent) {
          var _emptyPh = _parent.querySelector(".img-empty-placeholder");
          if (_emptyPh) _emptyPh.remove();
        }
      } else {
        el.src = "";
        el.style.display = "none";
        el.setAttribute("data-empty-img", "");
        var wrap = el.closest(".bento-img-wrap");
        if (!wrap) {
          if (_isLanding) return;
          var parent = el.parentElement;
          if (parent && !parent.querySelector(".img-empty-placeholder")) {
            var ph = document.createElement("div");
            ph.className = "img-empty-placeholder";
            ph.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="width:20px;height:20px;opacity:0.4"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg><span>Use visuals to add images</span>';
            parent.insertBefore(ph, el);
          }
        } else {
          var placeholder = wrap.querySelector(".bento-img-placeholder");
          if (placeholder) placeholder.style.display = _isLanding ? "none" : "flex";
        }
      }
    }
  });
}

function restoreDirectImageKeys() {
  if (!state || !state.images) return;
  var _found = 0;
  var _prefix = getStoragePrefix();
  for (var _j = 0; _j < localStorage.length; _j++) {
    var _key = localStorage.key(_j);
    if (!_key) continue;
    var _imgId = null;
    if (_key.indexOf('haven-image-') === 0) {
      _imgId = _key.slice('haven-image-'.length);
    } else if (_prefix && _key.indexOf(_prefix + 'haven-image-') === 0) {
      _imgId = _key.slice((_prefix + 'haven-image-').length);
    }
    if (_imgId) {
      var _val = __origLS.getItem(_key);
      if (_val) { state.images[_imgId] = _val; _found++; }
    }
  }
}



// ─── TOUCH UTILITY ─────────────────────────────────────────
function getEventPos(e) {
  if (e.changedTouches && e.changedTouches.length > 0) {
    return { x: e.changedTouches[0].clientX, y: e.changedTouches[0].clientY };
  }
  if (e.touches && e.touches.length > 0) {
    return { x: e.touches[0].clientX, y: e.touches[0].clientY };
  }
  return { x: e.clientX, y: e.clientY };
}

function isTouchEvent(e) {
  return !!(e && (e.changedTouches || e.touches));
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
  // Primary: save to IndexedDB (unlimited storage)
  _imgDBPut(id, url).catch(function() {
    // IndexedDB failed, fall back to localStorage
    try { localStorage.setItem('haven-image-' + id, url); } catch(e) {
      console.warn('[img] storage quota exceeded for image:', id, e);
      if (typeof showToast === 'function') showToast('Could not save image: storage full. Try a smaller image.', 'error', 4000);
    }
  });
  // Best-effort localStorage cache (silent if full — IndexedDB has the image)
  try { localStorage.setItem('haven-image-' + id, url); } catch(e) { /* ignore */ }
  document.querySelectorAll('img[data-image-id="' + id + '"]').forEach(function(el) {
    el.src = url;
    el.style.display = url ? 'block' : 'none';
    var wrap = el.closest('.bento-img-wrap');
    if (wrap) {
      var placeholder = wrap.querySelector('.bento-img-placeholder');
      if (placeholder) placeholder.style.display = url ? 'none' : 'flex';
    }
    if (url) {
      var _parent = el.parentElement;
      if (_parent) {
        var _emptyPh = _parent.querySelector('.img-empty-placeholder');
        if (_emptyPh) _emptyPh.remove();
      }
    }
  });

  // If this is a sidebar image, also update sidebar config (mirrors resetImage sync)
  if (id && id.indexOf('sidebar-') === 0) {
    var pageName = id.replace('sidebar-', '');
    if (pageName) {
      var cfg = loadSidebarConfig();
      if (cfg.images) {
        for (var i = 0; i < cfg.images.length; i++) {
          if ((cfg.images[i].page || '') === pageName) {
            cfg.images[i].url = url;
            break;
          }
        }
      }
      saveSidebarConfig(cfg);
    }
  }
}

function resetImage(id) {
  if (!state.images) loadImages();
  delete state.images[id];
  _imgDBDelete(id).catch(function() {});
  try { localStorage.removeItem('haven-image-' + id); } catch(e) { /* ignore */ }
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

  // If this is a sidebar image, also update sidebar config
  if (id && id.indexOf('sidebar-') === 0) {
    var pageName = id.replace('sidebar-', '');
    if (pageName) {
      var cfg = loadSidebarConfig();
      var sidebarUrl = url;
      if (!sidebarUrl) {
        var _sbDef = SIDEBAR_IMAGE_DEFAULTS.find(function(d) { return d.page === pageName; });
        if (_sbDef) sidebarUrl = _sbDef.url;
      }
      if (cfg.images) {
        for (var i = 0; i < cfg.images.length; i++) {
          if ((cfg.images[i].page || '') === pageName) {
            cfg.images[i].url = sidebarUrl;
            break;
          }
        }
      }
      saveSidebarConfig(cfg);
    }
  }
}

function imageLabel(id) {
  const map = {
    'hub-hero': 'Hub Hero', 'hub-tulips': 'Hub Tulips', 'hub-desk-water': 'Hub Desk Water', 'hub-lamp': 'Hub Lamp',
    'hub-skyline': 'Hub Skyline', 'hub-bedroom': 'Hub Bedroom',
    'weekly-coffee': 'Weekly Coffee', 'weekly-journal': 'Weekly Journal',
    'brain-linen': 'Brain Linen', 'brain-desk-light': 'Brain Desk Light',
    'goals-tulips': 'Goals Tulips', 'goals-book': 'Goals Book', 'goals-studio': 'Goals Studio',
    'schedule-hero': 'Schedule Hero', 'schedule-coffee': 'Schedule Coffee',
    'activities-hero': 'Activities Hero',
    'tags-hero': 'Tags Hero', 'tags-studio': 'Tags Studio',
    'analytics-hero': 'Analytics Hero',
    'finance-hero': 'Finance Hero',
    'goals-hero': 'Goals Hero',
    'gallery-hero': 'Gallery Hero',
    'sidebar-index': 'Hub Sidebar',
    'sidebar-schedule': 'Schedule Sidebar',
    'sidebar-activities': 'Activities Sidebar',
    'sidebar-analytics': 'Analytics Sidebar',
    'sidebar-goals': 'Goals Sidebar',
    'sidebar-finance': 'Finance Sidebar',
    'sidebar-tags': 'Tags Sidebar',
    'sidebar-gallery': 'Gallery Sidebar'
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

// --- IMAGE COMPRESSION ---
function resizeImageDataUrl(dataUrl, maxWidth, maxHeight, quality) {
  return new Promise(function(resolve) {
    var img = new Image();
    img.onload = function() {
      var w = img.width, h = img.height;
      if (w <= maxWidth && h <= maxHeight) {
        resolve(dataUrl);
        return;
      }
      var ratio = Math.min(maxWidth / w, maxHeight / h, 1);
      var cw = Math.round(w * ratio);
      var ch = Math.round(h * ratio);
      var canvas = document.createElement("canvas");
      canvas.width = cw;
      canvas.height = ch;
      var ctx = canvas.getContext("2d");
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(img, 0, 0, cw, ch);
      var resized = canvas.toDataURL("image/jpeg", quality || 0.82);
      resolve(resized);
    };
    img.onerror = function() { resolve(dataUrl); };
    img.src = dataUrl;
  });
}
function handleImagePickerFile(e) {
  const status = document.getElementById('imagePickerStatus');
  const preview = document.getElementById('imagePickerPreview');
  const file = e.target.files?.[0];
  if (!file) return;
  if (!file.type.startsWith('image/')) {
    if (status) { status.textContent = 'Not an image file'; status.style.color = '#ef4444'; }
    return;
  }
  if (file.size > 2 * 1024 * 1024) {
    if (status) { status.textContent = 'Image too large (max 2MB)'; status.style.color = '#ef4444'; }
    return;
  }
  if (status) { status.textContent = 'Processing image...'; status.style.color = 'var(--text-tertiary)'; }
  const reader = new FileReader();
  reader.onload = function(ev) {
    resizeImageDataUrl(ev.target.result, 800, 800, 0.78).then(function(resizedUrl) {
      if (preview) preview.src = resizedUrl;
      if (preview) preview.style.display = 'block';
      if (preview) preview.dataset.pasted = resizedUrl;
      if (status) { status.textContent = 'Image loaded — click Save to apply'; status.style.color = 'var(--primary)'; }
      var _urlInput = document.getElementById('imagePickerUrl');
      if (_urlInput) _urlInput.value = '';
    });
  };
  reader.readAsDataURL(file);
  e.target.value = '';
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
      if (status) { status.textContent = "Processing image..."; status.style.color = "var(--text-tertiary)"; }
      const reader = new FileReader();
      reader.onload = function(ev) {
        var fullDataUrl = ev.target.result;
        // Resize to max 800px to keep localStorage usage manageable
        resizeImageDataUrl(fullDataUrl, 800, 800, 0.78).then(function(resizedUrl) {
          if (preview) preview.src = resizedUrl;
          if (preview) preview.style.display = "block";
          if (preview) preview.dataset.pasted = resizedUrl;
          if (status) { status.textContent = "Image loaded — click Save to apply"; status.style.color = "var(--primary)"; }
          // Clear URL input so pasted image takes priority in handleImagePickerSave
          var _urlInput = document.getElementById("imagePickerUrl");
          if (_urlInput) _urlInput.value = "";
        });
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
  if (typeof window._onImageSaved === 'function') {
    window._onImageSaved(id, urlVal || (preview?.dataset.pasted) || null);
  }
  setTimeout(closeImagePicker, 400);
}

function handleImagePickerReset() {
  const id = _pickerImageId;
  if (!id) return;
  resetImage(id);
  if (typeof window._onImageSaved === 'function') {
    window._onImageSaved(id, null);
  }
  closeImagePicker();
}


// ─── THEME ──────────────────────────────────────────────────
function darkenColor(hex, amount) {
  var r = parseInt(hex.slice(1,3), 16), g = parseInt(hex.slice(3,5), 16), b = parseInt(hex.slice(5,7), 16);
  var f = 1 - amount;
  return '#' + [r,g,b].map(function(v) { return Math.max(0, Math.min(255, Math.round(v * f))).toString(16).padStart(2,'0'); }).join('');
}

function applyAccentColor() {
  const hex = state.accentColor;
  const el = document.documentElement;
  if (!hex) { el.style.removeProperty('--user-primary'); el.style.removeProperty('--accent-soft'); return; }
  const palette = ACCENT_PALETTE.find(p => p.dark === hex);
  if (palette) {
    el.style.setProperty('--user-primary', palette.dark);
    el.style.setProperty('--accent-soft', palette.light);
  } else {
    el.style.setProperty('--user-primary', hex);
    el.style.setProperty('--accent-soft', lightenColor(hex, 0.5));
  }
}

function applyTheme() {
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const isDark = state.darkMode === null ? prefersDark : state.darkMode;
  document.documentElement.classList.toggle('light', !isDark);
  document.documentElement.classList.toggle('dark', isDark);
  applyCardColors();
  applyAccentColor();
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
    subcategory: data.subcategory || '',
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
- tag: string (${TAG_ORDER.map(t => `"${t}"`).join(' | ')})
- subcategory: string (optional, use a known subcategory name if the user mentions one)

Tag labels: ${TAG_ORDER.map(t => `"${t}" = "${TAG_LABELS[t]}"`).join(', ')}
${(() => {
  const subcatMap = loadSubcategories();
  const parts = [];
  for (const t of TAG_ORDER) {
    const subs = subcatMap[t] || [];
    if (subs.length > 0) parts.push(`"${t}" subcategories: ${subs.map(s => `"${s}"`).join(', ')}`);
  }
  return parts.length > 0 ? 'Known subcategories:\n' + parts.join('\n') : '';
})()}
Tag rules: "deep work"/"focus"/"heads down" = deep-work. "gym"/"workout"/"run"/"cardio"/"exercise" = exercise. "math"/"english"/"class"/"chemistry"/"physics"/"mandarin"/"study" = study. "design"/"movie"/"build"/"app"/"hobby" = hobby. Default tag = "meeting".
Default duration: 1 hour. Default time: 9 AM. "tomorrow" = next day. Day names = next occurrence. "morning" ≈ 9am, "afternoon" ≈ 2pm, "evening" ≈ 7pm.

IMPORTANT: Choose a time slot that does NOT conflict with existing tasks shown above. If the user's requested time is taken, shift to the nearest free slot.

USER'S EXTRA INSTRUCTIONS:
${(() => { try { return localStorage.getItem('haven-ai-extra-instructions') || ''; } catch (e) { return ''; } })()}

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
    return { title: p.title, date: p.date, startTime: p.startTime, endTime: p.endTime, tag: p.tag || 'meeting', subcategory: p.subcategory || '' };
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
      <div class="ai-usage-stat"><span class="ai-usage-value">${aiUsage.chatMessagesSent}</span><span class="ai-usage-label">Chats</span></div>
      <div class="ai-usage-stat"><span class="ai-usage-value">${aiUsage.totalAPICalls}</span><span class="ai-usage-label">API Calls</span></div>
      <div class="ai-usage-stat"><span class="ai-usage-value">${totalDays}</span><span class="ai-usage-label">Days Used</span></div>
      <div class="ai-usage-stat"><span class="ai-usage-value">${avgPerDay}</span><span class="ai-usage-label">Avg/Day</span></div>
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

function renderAccentPickerInSettings() {
  var container = document.getElementById('settingsAccentColor');
  if (!container) return;
  var selected = state.accentColor;
  var custom = state.accentCustomColors || [];
  var removed = state.accentRemovedPresets || [];
  var html = '<div class="acc-swatches">';
  html += '<div class="acc-swatch' + (selected ? '' : ' active') + '" data-acc="" title="Default">';
  html += '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
  html += '</div>';
  for (var i = 0; i < ACCENT_PALETTE.length; i++) {
    var c = ACCENT_PALETTE[i];
    if (removed.indexOf(c.dark) !== -1) continue;
    var isOn = selected === c.dark;
    html += '<div class="acc-swatch' + (isOn ? ' active' : '') + '" data-acc="' + c.dark + '" data-acc-preset="' + c.dark + '" title="' + c.name + ' — right-click to remove" style="background:' + c.dark + '"></div>';
  }
  for (var ci = 0; ci < custom.length; ci++) {
    var isOn = selected === custom[ci];
    html += '<div class="acc-swatch acc-swatch-custom' + (isOn ? ' active' : '') + '" data-acc-custom="' + ci + '" data-acc="' + custom[ci] + '" title="Right-click to remove" style="background:' + custom[ci] + '"></div>';
  }
  html += '</div>';
  if (removed.length > 0) {
    html += '<div style="display:flex;justify-content:center;margin-top:6px"><button class="acc-custom-add" id="accResetPresetsBtn">Reset palette</button></div>';
  }
  html += '<div class="acc-custom-hint">Right-click any swatch to remove it</div>';
  html += '<div class="acc-custom-row"><input type="color" id="accCustomPicker" value="#a8c8e8" class="acc-custom-picker"><input type="text" id="accCustomHex" class="acc-custom-hex" value="#a8c8e8" maxlength="7" placeholder="#hex"><button class="acc-custom-add" id="accCustomAddBtn">Save</button></div>';
  container.innerHTML = html;
  if (!container._accInit) {
    container._accInit = true;
    container.addEventListener('click', function(e) {
      var swatch = e.target.closest('.acc-swatch');
      if (!swatch) return;
      var val = swatch.dataset.acc || null;
      state.accentColor = val;
      container.querySelectorAll('.acc-swatch').forEach(function(s) { s.classList.remove('active'); });
      if (val) swatch.classList.add('active');
      else container.querySelector('.acc-swatch[data-acc=""]')?.classList.add('active');
      applyAccentColor();
      saveState();
    });
    container.addEventListener('contextmenu', function(e) {
      var swatch = e.target.closest('.acc-swatch');
      if (!swatch) return;
      var acc = swatch.dataset.acc;
      if (!acc) return;
      e.preventDefault();
      var idx = swatch.dataset.accCustom;
      if (idx !== undefined) {
        state.accentCustomColors.splice(parseInt(idx), 1);
      } else if (swatch.dataset.accPreset) {
        state.accentRemovedPresets.push(swatch.dataset.accPreset);
      }
      if (state.accentColor === acc) state.accentColor = null;
      saveState();
      applyAccentColor();
      renderAccentPickerInSettings();
    });
  }
  document.getElementById('accResetPresetsBtn')?.addEventListener('click', function() {
    state.accentRemovedPresets = [];
    saveState();
    renderAccentPickerInSettings();
  });
  var picker = document.getElementById('accCustomPicker');
  var hexInput = document.getElementById('accCustomHex');
  if (picker && hexInput) {
    picker.addEventListener('input', function() { hexInput.value = this.value; });
    hexInput.addEventListener('input', function() { if (/^#[0-9a-f]{6}$/i.test(this.value)) picker.value = this.value; });
    document.getElementById('accCustomAddBtn')?.addEventListener('click', function() {
      var hex = hexInput.value.trim();
      if (!/^#[0-9a-f]{6}$/i.test(hex)) { showToast('Invalid hex color', 'error', 2000); return; }
      if (state.accentCustomColors.indexOf(hex) !== -1) { showToast('Color already saved', 'info', 2000); return; }
      state.accentCustomColors.push(hex);
      state.accentColor = hex;
      saveState();
      applyAccentColor();
      renderAccentPickerInSettings();
    });
  }
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
      ${!DEFAULT_TAG_COLORS[tag] ? `<button class="cc-swatch-del" data-del-tag="${tag}" title="Delete category">
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>` : ''}
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
    ids: ['hub-hero', 'hub-tulips', 'hub-desk-water', 'hub-lamp', 'hub-skyline', 'hub-bedroom']
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
    ids: ['activities-hero']
  },
  {
    label: 'Tags',
    ids: ['tags-hero', 'tags-studio']
  },
  {
    label: 'Analytics',
    ids: ['analytics-hero']
  },
  {
    label: 'Goals',
    ids: ['goals-hero', 'goals-tulips', 'goals-book', 'goals-studio']
  },
  {
    label: 'Finance',
    ids: ['finance-hero']
  },
  {
    label: 'Brain',
    ids: ['brain-linen', 'brain-desk-light']
  },
  {
    label: 'Canvas',
    ids: ['hub-image-1', 'hub-image-2', 'hub-image-3', 'hub-image-4', 'hub-image-5',
           'hub-image-6', 'hub-image-7', 'hub-image-8', 'hub-image-9', 'hub-image-10']
  },
  {
    label: 'Gallery',
    ids: ['gallery-hero', 'gallery-schedule', 'gallery-activities', 'gallery-tags', 'gallery-analytics', 'gallery-goals']
  }
];

function openSettingsDrawer() {
  dom.settingsApiKey = document.getElementById('drawerApiKey');
  // Reset to first section
  var firstNav = document.querySelector('.settings-nav-item');
  if (firstNav) switchSettingsSection(firstNav.dataset.section);
  dom.settingsProvider = document.getElementById('drawerProvider');
  dom.settingsModel = document.getElementById('drawerModel');
  dom.settingsKeyStatus = document.getElementById('drawerKeyStatus');
  dom.settingsKeyStatusText = document.getElementById('drawerKeyStatusText');
  dom.settingsClearBtn = document.getElementById('drawerClearBtn');
  dom.settingsAIUsage = document.getElementById('drawerAIUsage');
  const drawer = document.getElementById('settingsDrawer');
  const overlay = document.getElementById('settingsDrawerOverlay');
  if (!drawer || !overlay) return;
  if (dom.settingsApiKey) dom.settingsApiKey.value = state.apiKey || '';
  if (dom.settingsProvider) dom.settingsProvider.value = state.apiProvider || 'groq';
  try { updateModelOptions(); } catch (e) { console.warn('drawer: updateModelOptions', e); }
  try { updateSettingsKeyStatus(); } catch (e) { console.warn('drawer: updateSettingsKeyStatus', e); }
  try { loadAIUsage(); } catch (e) { console.warn('drawer: loadAIUsage', e); }
  try { renderAIUsage(); } catch (e) { console.warn('drawer: renderAIUsage', e); }
  try { renderAccentPickerInSettings(); } catch (e) { console.warn('drawer: renderAccentPickerInSettings', e); }
  try { renderCardColorsInSettings(); } catch (e) { console.warn('drawer: renderCardColorsInSettings', e); }
  try { renderBubbleConfigInSettings(); } catch (e) { console.warn('drawer: renderBubbleConfigInSettings', e); }
  overlay.classList.remove('hidden');
  drawer.classList.remove('hidden');
  requestAnimationFrame(() => {
    overlay.classList.add('active');
    drawer.classList.add('open');
  });
  state.settingsDrawerOpen = true;
  // Close on Escape (remove old listener first to prevent duplicates)
  if (drawer._escListener) document.removeEventListener('keydown', drawer._escListener);
  function _onSettingsKeydown(e) {
    if (e.key === 'Escape') closeSettingsDrawer();
  }
  document.addEventListener('keydown', _onSettingsKeydown);
  drawer._escListener = _onSettingsKeydown;
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
  // Remove escape listener
  if (drawer._escListener) {
    document.removeEventListener('keydown', drawer._escListener);
    delete drawer._escListener;
  }
}

function switchSettingsSection(sectionId) {
  // Update nav items
  document.querySelectorAll('.settings-nav-item').forEach(function(item) {
    item.classList.toggle('active', item.dataset.section === sectionId);
  });
  // Update content sections
  document.querySelectorAll('.settings-content-section').forEach(function(section) {
    section.classList.toggle('active', section.id === 'settingsSection-' + sectionId);
  });
  // Reset search
  var searchInput = document.getElementById('settingsSearch');
  if (searchInput) searchInput.value = '';
  document.querySelectorAll('.settings-content-section').forEach(function(s) { s.style.display = ''; });
}

function filterSettingsSections(query) {
  var q = (query || '').toLowerCase().trim();
  document.querySelectorAll('.settings-nav-item').forEach(function(item) {
    var label = item.querySelector('span')?.textContent?.toLowerCase() || '';
    if (!q || label.indexOf(q) !== -1) {
      item.style.display = '';
    } else {
      item.style.display = 'none';
    }
  });
  document.querySelectorAll('.settings-content-section').forEach(function(section) {
    if (!q) {
      // Restore CSS-controlled visibility
      section.style.display = '';
      return;
    }
    var text = section.textContent?.toLowerCase() || '';
    section.style.display = text.indexOf(q) !== -1 ? '' : 'none';
  });
  // Show first visible nav item as active if search active
  if (q) {
    var visibleNav = null;
    document.querySelectorAll('.settings-nav-item').forEach(function(item) {
      if (!visibleNav && item.style.display !== 'none') visibleNav = item;
    });
    if (visibleNav && visibleNav.dataset.section) {
      switchSettingsSection(visibleNav.dataset.section);
    }
  }
}

function handleSettingsSubmit(e) {
  e.preventDefault();
  const key = dom.settingsApiKey?.value?.trim() || '';
  const provider = dom.settingsProvider?.value || 'groq';
  const model = dom.settingsModel?.value || PROVIDER_MODELS[provider]?.[0]?.value || '';
  state.apiKey = key;
  state.apiProvider = provider;
  state.apiModel = model;
  try { localStorage.setItem(API_KEY_STORAGE, key); } catch (e) { /* ignore */ }
  saveApiProvider(provider);
  try { localStorage.setItem('haven-schedule-model', model); } catch (e) { /* ignore */ }
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
    var _existingSettings = {};
    try { _existingSettings = JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}'); } catch(e) {}
    Object.assign(_existingSettings, { showWeekends: state.showWeekends, showCompleted: state.showCompleted, darkMode: state.darkMode, accessBubbles: state.accessBubbles, accentColor: state.accentColor, accentCustomColors: state.accentCustomColors, accentRemovedPresets: state.accentRemovedPresets });
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(_existingSettings));
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

const SIDEBAR_IMAGE_DEFAULTS = [
  { id: '_img_hub', label: 'Hub', page: 'index', url: 'https://images.unsplash.com/photo-1752503650851-cbc3f8b00679?auto=format&fit=crop&w=440&q=80' },
  { id: '_img_schedule', label: 'Schedule', page: 'schedule', url: 'https://images.unsplash.com/photo-1562537218-26057ef20502?auto=format&fit=crop&w=440&q=80' },
  { id: '_img_activities', label: 'Activities', page: 'activities', url: 'https://images.unsplash.com/photo-1742055700759-e393a5314287?auto=format&fit=crop&w=440&q=80' },
  { id: '_img_analytics', label: 'Analytics', page: 'analytics', url: 'https://images.unsplash.com/photo-1759210358926-4673cc44d35f?auto=format&fit=crop&w=440&q=80' },
  { id: '_img_goals', label: 'Goals', page: 'goals', url: 'https://images.unsplash.com/photo-1731176497854-f9ea4dd52eb6?auto=format&fit=crop&w=440&q=80' },
  { id: '_img_finance', label: 'Finance', page: 'finance', url: 'https://images.unsplash.com/photo-1533038590840-1cde6e668a91?auto=format&fit=crop&w=440&q=80' },
  { id: '_img_tags', label: 'Tags', page: 'tags', url: 'https://images.unsplash.com/photo-1768527049008-85f2cc0166be?auto=format&fit=crop&w=440&q=80' },
  { id: '_img_gallery', label: 'Gallery', page: 'gallery', url: 'https://images.unsplash.com/photo-1545569341-9eb8b30979d9?auto=format&fit=crop&w=440&q=80' }
];

function getCurrentPage() {
  var p = location.pathname.split('/').pop() || 'index.html';
  return p.replace('.html', '');
}

function loadSidebarConfig() {
  try {
    const raw = localStorage.getItem(SIDEBAR_CONFIG_KEY);
    if (raw) {
      const config = JSON.parse(raw);
      // Migrate v0/v1 to v2: seed default images for all pages
      if (!config._v || config._v < 2) {
        config._v = 2;
        config.images = SIDEBAR_IMAGE_DEFAULTS.map(function(d) { return { id: d.id, label: d.label, page: d.page, url: d.url }; });
        saveSidebarConfig(config);
      }
      // Ensure every page has at least one image
      if (!config.images) config.images = [];
      var _needsSave = false;
      var defaultPages = ['index','schedule','activities','analytics','goals','finance','tags','gallery'];
      for (var p = 0; p < defaultPages.length; p++) {
        var pageName = defaultPages[p];
        var has = false;
        for (var i = 0; i < config.images.length; i++) {
          if (config.images[i].page === pageName) {
            has = true;
            // Unhide entries that match a default — likely accidentally hidden
            if (config.images[i].hidden) {
              config.images[i].hidden = false;
              _needsSave = true;
            }
            break;
          }
        }
        if (!has) {
          for (var d = 0; d < SIDEBAR_IMAGE_DEFAULTS.length; d++) {
            if (SIDEBAR_IMAGE_DEFAULTS[d].page === pageName) {
              config.images.push({ id: SIDEBAR_IMAGE_DEFAULTS[d].id, label: SIDEBAR_IMAGE_DEFAULTS[d].label, page: SIDEBAR_IMAGE_DEFAULTS[d].page, url: SIDEBAR_IMAGE_DEFAULTS[d].url });
              _needsSave = true;
              break;
            }
          }
        }
      }
      if (_needsSave) saveSidebarConfig(config);
      return config;
    }
  } catch {}
  // Fresh start
  return {
    order: [], visibility: {}, customLinks: [], footerOrder: [], _v: 2,
    images: SIDEBAR_IMAGE_DEFAULTS.map(function(d) { return { id: d.id, label: d.label, page: d.page, url: d.url }; })
  };
}

function saveSidebarConfig(config) {
  try {
    var str = JSON.stringify(config);
    localStorage.setItem(SIDEBAR_CONFIG_KEY, str);
  } catch(e) {
    if (typeof showToast === 'function') showToast('Could not save: localStorage might be full', 'error');
  }
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

  // Apply footer button order
  const btns = document.querySelector('.hub-footer-btns');
  if (btns && config.footerOrder && config.footerOrder.length > 0) {
    const btnMap = {};
    btns.querySelectorAll(':scope > button').forEach(btn => {
      if (btn.id) btnMap[btn.id] = btn;
    });
    for (const id of config.footerOrder) {
      const btn = btnMap[id];
      if (btn) btns.appendChild(btn);
    }
  }

  // Render image section
  renderSidebarImages();
}

function toggleSidebarEditMode() {
  sidebarEditMode = !sidebarEditMode;
  document.documentElement.classList.toggle('sidebar-edit-mode', sidebarEditMode);
  const btn = document.getElementById('hubSidebarEditBtn');
  if (btn) btn.classList.toggle('active', sidebarEditMode);

  if (sidebarEditMode) {
    renderSidebarEditControls();
    renderSidebarImages();
    showToast('✎ Sidebar edit ON — drag to reorder, click ● to hide', 'info', 2500);
  } else {
    removeSidebarEditControls();
    renderSidebarImages();
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

  // Add drag handles to footer action buttons only
  const footerBtns = document.querySelector('.hub-footer-btns');
  if (footerBtns) {
    footerBtns.querySelectorAll(':scope > button').forEach(btn => {
      if (btn.querySelector('.sidebar-footer-handle')) return;
      const handle = document.createElement('span');
      handle.className = 'snav-drag-handle sidebar-footer-handle';
      handle.innerHTML = '⠿';
      handle.draggable = true;
      handle.title = 'Drag to reorder';
      btn.prepend(handle);
    });
    setupSidebarFooterDrag();
  }

  // Show image edit controls (remove buttons + add button)
  renderSidebarImageEditControls();
}

function removeSidebarEditControls() {
  document.querySelectorAll('.snav-drag-handle, .snav-hide-btn, .snav-add-link-btn, .sidebar-footer-handle').forEach(el => el.remove());
  // Reset opacity on hidden items
  document.querySelectorAll('.hub-snav-item').forEach(item => {
    item.style.opacity = '';
  });
  // Remove image remove buttons + add button
  document.querySelectorAll('.hub-sidebar-image-remove, .hub-sidebar-image-toggle, .hub-sidebar-image-edit').forEach(el => el.remove());
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

/* ─── Sidebar footer drag reorder ──────────── */
function setupSidebarFooterDrag() {
  const btns = document.querySelector('.hub-footer-btns');
  if (!btns) return;
  const handles = btns.querySelectorAll('.sidebar-footer-handle');
  handles.forEach(handle => {
    handle.addEventListener('dragstart', function(e) {
      sidebarDragSrc = this.closest('button');
      e.dataTransfer.effectAllowed = 'move';
    });
    handle.addEventListener('dragend', function() {
      sidebarDragSrc = null;
      btns.querySelectorAll('.snav-drag-over').forEach(el => el.classList.remove('snav-drag-over'));
    });
  });
  btns.querySelectorAll(':scope > button').forEach(btn => {
    btn.addEventListener('dragover', function(e) { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; });
    btn.addEventListener('dragenter', function(e) { e.preventDefault(); if (this !== sidebarDragSrc) this.classList.add('snav-drag-over'); });
    btn.addEventListener('dragleave', function() { this.classList.remove('snav-drag-over'); });
    btn.addEventListener('drop', function(e) {
      e.preventDefault(); this.classList.remove('snav-drag-over');
      if (!sidebarDragSrc || this === sidebarDragSrc) return;
      btns.insertBefore(sidebarDragSrc, this);
      persistSidebarFooterOrder();
    });
  });
}

function persistSidebarFooterOrder() {
  const btns = document.querySelector('.hub-footer-btns');
  if (!btns) return;
  const config = loadSidebarConfig();
  config.footerOrder = [];
  btns.querySelectorAll(':scope > button').forEach(btn => {
    config.footerOrder.push(btn.id);
  });
  saveSidebarConfig(config);
}

/* ─── Sidebar image section ────────────────── */
function renderSidebarImages() {
  const container = document.querySelector('.hub-sidebar-images');
  if (!container) return;
  const config = loadSidebarConfig();
  const currentPage = getCurrentPage();
  var images = (config.images || []).filter(function(img) {
    return !img.page || img.page === currentPage;
  });
  // Only one image per page
  images = images.slice(0, 1);
  // In normal mode, hide hidden images; in edit mode, show them dimmed
  if (!sidebarEditMode) {
    images = images.filter(function(img) { return !img.hidden; });
  }
  container.innerHTML = '';
  if (images.length === 0 && !sidebarEditMode) {
    container.style.display = '';
    container.style.flex = 'none';
    container.style.height = '0';
    container.style.maxHeight = '';
    container.classList.add('collapsed');
    return;
  }
  container.style.display = '';
  var spEl = document.querySelector('.sp-sidebar');
  // Apply saved height (never more than space above Spotify)
  if (config.imageSectionHeight) {
    var spH = spEl ? spEl.offsetHeight : 100;
    var parentH = container.parentElement ? container.parentElement.offsetHeight : 600;
    var clampedH = Math.min(config.imageSectionHeight, Math.max(16, Math.min(200, parentH - spH)));
    container.style.flex = 'none';
    container.style.height = clampedH + 'px';
    container.style.maxHeight = 'none';
    container.classList.toggle('collapsed', clampedH <= 16);
  } else {
    container.style.flex = '';
    container.style.height = '';
    container.style.maxHeight = '';
    container.classList.remove('collapsed');
  }
  // Render image items FIRST
  if (images.length > 0) {
    images.forEach(img => {
      var sidebarId = 'sidebar-' + currentPage;
      // Use URL from sidebar config, fall back to main image system (haven-image-sidebar-*)
      var url = img.url || getImage(sidebarId);
      if (!url) {
        var _sbDef = SIDEBAR_IMAGE_DEFAULTS.find(function(d) { return d.page === currentPage; });
        if (_sbDef) url = _sbDef.url;
      }
      // Sync to state.images so Visuals image picker shows correct URL
      if (state.images) state.images[sidebarId] = url;

      const item = document.createElement('div');
      item.className = 'hub-sidebar-image-item';
      if (img.hidden) item.classList.add('hub-sidebar-image-hidden');
      item.dataset.imageId = img.id;
      const label = img.label || img.id;
      item.innerHTML = (url ? '<img src="' + url + '" alt="' + label + '" data-image-id="' + sidebarId + '">' : '<div class="hub-sidebar-image-empty"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="width:16px;height:16px;opacity:0.5"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg><span>Use visuals to add images</span></div>') +
        '<span class="hub-sidebar-image-label">' + label + '</span>';
      // Click: in Visuals edit mode → image picker
      item.addEventListener('click', function() {
        if (state.editMode) {
          openImagePicker(sidebarId);
        }
      });
      container.appendChild(item);
    });
  }
  // ─── RESIZE HANDLE (at top of images container, sticking to image) ───
  var oldHandle = document.querySelector('.hub-sidebar-image-resize-handle');
  if (oldHandle) oldHandle.remove();
  const handle = document.createElement('div');
  handle.className = 'hub-sidebar-image-resize-handle';
  handle.innerHTML = '<div class="hub-sidebar-image-resize-handle-dots"><span></span><span></span><span></span></div>';
  container.insertBefore(handle, container.firstChild);
  setupSidebarImageResize(container, handle);
  // ───────────────────────────────────────────────────────────────────
}

function renderSidebarImageEditControls() {
  const container = document.querySelector('.hub-sidebar-images');
  if (!container) return;
  container.querySelectorAll('.hub-sidebar-image-item').forEach(function(item) {
    if (item.querySelector('.hub-sidebar-image-remove')) return;
    // Replace/edit button
    const editBtn = document.createElement('button');
    editBtn.className = 'hub-sidebar-image-edit';
    editBtn.innerHTML = '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M17 3a2.83 2.83 0 114 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>';
    editBtn.title = 'Replace image';
    editBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      showSidebarImageReplacePopup(item.dataset.imageId);
    });
    item.appendChild(editBtn);
    // Hide/show toggle button
    const toggleBtn = document.createElement('button');
    toggleBtn.className = 'hub-sidebar-image-toggle';
    var isHidden = false;
    var imgId = item.dataset.imageId;
    var cfg = loadSidebarConfig();
    if (cfg.images) {
      var found = cfg.images.find(function(i) { return i.id === imgId; });
      if (found && found.hidden) isHidden = true;
    }
    toggleBtn.innerHTML = isHidden ? '○' : '●';
    toggleBtn.title = isHidden ? 'Show in sidebar' : 'Hide from sidebar';
    toggleBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      toggleSidebarImageHidden(imgId);
    });
    item.appendChild(toggleBtn);
    // Remove button
    const removeBtn = document.createElement('button');
    removeBtn.className = 'hub-sidebar-image-remove';
    removeBtn.innerHTML = '×';
    removeBtn.title = 'Remove image';
    removeBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      removeSidebarImage(item.dataset.imageId);
    });
    item.appendChild(removeBtn);
  });
}

function showSidebarImagePastePopup() {
  const existing = document.querySelector('.sidebar-paste-popup');
  if (existing) { existing.remove(); return; }
  const popup = document.createElement('div');
  popup.className = 'sidebar-paste-popup';
  popup.innerHTML = '<div style="font-size:0.65rem;font-weight:600;text-transform:uppercase;letter-spacing:0.06em;color:var(--text-tertiary);margin-bottom:6px">Paste Image</div>' +
    '<input type="text" id="sidebarPasteInput" placeholder="Paste URL or Ctrl+V" autofocus>' +
    '<select id="sidebarPastePage" style="width:100%;margin-top:4px;padding:3px 4px;font-size:0.7rem;background:var(--bg-surface);color:var(--text-primary);border:1px solid var(--border-color);border-radius:4px">' +
    '<option value="">All pages</option>' +
    '<option value="index">Hub</option>' +
    '<option value="schedule">Schedule</option>' +
    '<option value="activities">Activities</option>' +
    '<option value="analytics">Analytics</option>' +
    '<option value="goals">Goals</option>' +
    '<option value="finance">Finance</option>' +
    '<option value="tags">Tags</option>' +
    '</select>' +
    '<div class="sidebar-paste-hint" style="font-size:0.6rem;color:var(--text-tertiary);margin-top:4px">Paste a URL or use Ctrl+V to paste from clipboard</div>' +
    '<div class="hub-edit-popup-actions" style="margin-top:6px">' +
    '<button class="cancel" id="sidebarPasteCancel">Cancel</button>' +
    '<button class="primary" id="sidebarPasteSave">Add</button></div>';
  var addBtn = document.querySelector('.hub-sidebar-image-add');
  if (addBtn) addBtn.parentNode.insertBefore(popup, addBtn.nextSibling);
  else document.querySelector('.hub-sidebar-images').appendChild(popup);
  var input = document.getElementById('sidebarPasteInput');
  if (input) { input.focus(); }
  document.getElementById('sidebarPasteSave').addEventListener('click', function() {
    var val = document.getElementById('sidebarPasteInput')?.value?.trim();
    if (val) addSidebarImage('_custom_' + Date.now(), val);
    popup.remove();
  });
  document.getElementById('sidebarPasteCancel').addEventListener('click', function() { popup.remove(); });
  // Paste from clipboard — capture paste event
  if (input) {
    input.addEventListener('paste', function(e) {
      var items = e.clipboardData.items;
      for (var i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          var blob = items[i].getAsFile();
          var reader = new FileReader();
          reader.onload = function(ev) {
            input.value = ev.target.result;
          };
          reader.readAsDataURL(blob);
          break;
        }
      }
    });
  }
}

function addSidebarImage(id, url) {
  if (url) {
    // Custom pasted image — store URL directly
    if (url.length > 500000) {
      if (typeof showToast === 'function') showToast('Image too large, try a smaller one', 'error');
      return;
    }
  } else {
    // Built-in image ID
    if (!getImage(id)) {
      if (typeof showToast === 'function') showToast('Image not found: ' + id, 'error');
      return;
    }
  }
  const config = loadSidebarConfig();
  if (!config.images) config.images = [];
  if (config.images.some(function(i) { return i.id === id; })) {
    if (typeof showToast === 'function') showToast('Image already added', 'info');
    return;
  }
  var label = id;
  if (!url) { label = imageLabel(id); }
  else { label = 'Custom Image'; }
  config.images.push({ id: id, label: label, url: url || undefined });
  saveSidebarConfig(config);
  renderSidebarImages();
}

function removeSidebarImage(id) {
  const config = loadSidebarConfig();
  config.images = (config.images || []).filter(function(i) { return i.id !== id; });
  saveSidebarConfig(config);
  renderSidebarImages();
}

function openImageLightbox(url, label) {
  var existing = document.querySelector('.sidebar-lightbox');
  if (existing) existing.remove();
  var overlay = document.createElement('div');
  overlay.className = 'sidebar-lightbox';
  overlay.innerHTML = '<div class="sidebar-lightbox-backdrop"></div>' +
    '<div class="sidebar-lightbox-content">' +
    '<button class="sidebar-lightbox-close">' + '\u00D7' + '</button>' +
    '<img src="' + url + '" alt="' + (label || '') + '">' +
    '</div>';
  document.body.appendChild(overlay);
  requestAnimationFrame(function() { overlay.classList.add('active'); });
  overlay.querySelector('.sidebar-lightbox-backdrop').addEventListener('click', function() {
    overlay.classList.remove('active');
    setTimeout(function() { overlay.remove(); }, 200);
  });
  overlay.querySelector('.sidebar-lightbox-close').addEventListener('click', function() {
    overlay.classList.remove('active');
    setTimeout(function() { overlay.remove(); }, 200);
  });
}

// ─── RESIZE HANDLE DRAG ───────────────────────
var _sidebarResizeData = null;

function setupSidebarImageResize(container, handle) {
  handle.addEventListener('mousedown', function(e) {
    e.preventDefault();
    var startH = container.offsetHeight;
    _sidebarResizeData = { container: container, startY: e.clientY, startH: startH };
    document.addEventListener('mousemove', _onResizeMove);
    document.addEventListener('mouseup', _onResizeUp);
  });
}

function _onResizeMove(e) {
  if (!_sidebarResizeData) return;
  var diff = e.clientY - _sidebarResizeData.startY;
  var parent = _sidebarResizeData.container.parentElement;
  var sp = parent ? parent.querySelector('.sp-sidebar') : null;
  var spH = sp ? sp.offsetHeight : 100;
  var parentH = parent ? parent.offsetHeight : 600;
  var maxH = Math.min(200, Math.max(60, parentH - spH));
  var newH = Math.max(16, Math.min(maxH, _sidebarResizeData.startH - diff));
  _sidebarResizeData.container.style.flex = 'none';
  _sidebarResizeData.container.style.height = newH + 'px';
  _sidebarResizeData.container.style.maxHeight = 'none';
  _sidebarResizeData.container.classList.toggle('collapsed', newH <= 16);
}

function _onResizeUp() {
  if (!_sidebarResizeData) return;
  document.removeEventListener('mousemove', _onResizeMove);
  document.removeEventListener('mouseup', _onResizeUp);
  var h = _sidebarResizeData.container.offsetHeight;
  var parent = _sidebarResizeData.container.parentElement;
  var sp = parent ? parent.querySelector('.sp-sidebar') : null;
  var spH = sp ? sp.offsetHeight : 100;
  var parentH = parent ? parent.offsetHeight : 600;
  h = Math.max(16, Math.min(h, Math.min(200, parentH - spH)));
  _sidebarResizeData.container.style.height = h + 'px';
  _sidebarResizeData.container.classList.toggle('collapsed', h <= 16);
  var config = loadSidebarConfig();
  config.imageSectionHeight = h;
  saveSidebarConfig(config);
  _sidebarResizeData = null;
}

function showSidebarImageReplacePopup(imgId) {
  const config = loadSidebarConfig();
  var imgData = null;
  if (config.images) {
    for (var i = 0; i < config.images.length; i++) {
      if (config.images[i].id === imgId) { imgData = config.images[i]; break; }
    }
  }
  if (!imgData) return;
  const existing = document.querySelector('.sidebar-paste-popup');
  if (existing) existing.remove();
  const popup = document.createElement('div');
  popup.className = 'sidebar-paste-popup';
  popup.innerHTML = '<div style="font-size:0.65rem;font-weight:600;text-transform:uppercase;letter-spacing:0.06em;color:var(--text-tertiary);margin-bottom:6px">Replace Image</div>' +
    '<input type="text" id="sidebarPasteInput" placeholder="Paste new image URL" value="' + (imgData.url || '') + '" autofocus>' +
    '<div class="sidebar-paste-hint" style="font-size:0.6rem;color:var(--text-tertiary);margin-top:4px">Enter a new URL or use Ctrl+V to paste from clipboard</div>' +
    '<div class="hub-edit-popup-actions" style="margin-top:6px">' +
    '<button class="cancel" id="sidebarPasteCancel">Cancel</button>' +
    '<button class="primary" id="sidebarPasteSave">Replace</button></div>';
  var addBtn = document.querySelector('.hub-sidebar-image-add');
  if (addBtn) addBtn.parentNode.insertBefore(popup, addBtn.nextSibling);
  else document.querySelector('.hub-sidebar-images').appendChild(popup);
  var input = document.getElementById('sidebarPasteInput');
  if (input) { input.focus(); input.select(); }
  document.getElementById('sidebarPasteSave').addEventListener('click', function() {
    var val = document.getElementById('sidebarPasteInput')?.value?.trim();
    if (val) {
      imgData.url = val;
      saveSidebarConfig(config);
      renderSidebarImages();
    }
    popup.remove();
  });
  document.getElementById('sidebarPasteCancel').addEventListener('click', function() { popup.remove(); });
  if (input) {
    input.addEventListener('paste', function(e) {
      var items = e.clipboardData.items;
      for (var i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          var blob = items[i].getAsFile();
          var reader = new FileReader();
          reader.onload = function(ev) { input.value = ev.target.result; };
          reader.readAsDataURL(blob);
          break;
        }
      }
    });
  }
}

function toggleSidebarImageHidden(id) {
  const config = loadSidebarConfig();
  if (!config.images) return;
  for (var i = 0; i < config.images.length; i++) {
    if (config.images[i].id === id) {
      config.images[i].hidden = !config.images[i].hidden;
      break;
    }
  }
  saveSidebarConfig(config);
  renderSidebarImages();
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



// ─── Hamburger Side Panel ─────────────────────────────
function closeHubMenu() {
  var p = document.getElementById('hubMenuPanel');
  var o = document.getElementById('hubMenuOverlay');
  if (p) p.classList.remove('open');
  if (o) o.classList.remove('active');
}
function openHubMenu() {
  var p = document.getElementById('hubMenuPanel');
  var o = document.getElementById('hubMenuOverlay');
  if (p) { p.classList.remove('hidden'); requestAnimationFrame(function() { p.classList.add('open'); }); }
  if (o) o.classList.add('active');
}
(function initHamburgerMenu() {
  document.getElementById('hubMenuOverlay')?.addEventListener('click', closeHubMenu);
  document.getElementById('hubMenuClose')?.addEventListener('click', closeHubMenu);
  document.addEventListener('keydown', function(e) { if (e.key === 'Escape') closeHubMenu(); });
  // Generic action listeners (only attach if element exists)
  var t = document.getElementById('menuTheme');
  if (t) t.addEventListener('click', function() { closeHubMenu(); if (typeof toggleTheme === 'function') toggleTheme(); });
  var s = document.getElementById('menuSettings');
  if (s) s.addEventListener('click', function() { closeHubMenu(); if (typeof openSettingsBubble === 'function') openSettingsBubble(); });
  var h = document.getElementById('menuHelp');
  if (h) h.addEventListener('click', function() { closeHubMenu(); if (typeof showHelpModal === 'function') showHelpModal(); });
  var p = document.getElementById('menuProfile');
  if (p) p.addEventListener('click', function() { closeHubMenu(); if (typeof openSettingsBubble === 'function') openSettingsBubble(); });
  // Populate profile
  try {
    var activeId = typeof getActiveUserId === 'function' ? getActiveUserId() : null;
    var activeUser = activeId && Array.isArray(localUsers) ? localUsers.find(function(u) { return u.id === activeId; }) : null;
    var nameEl = document.getElementById('menuName');
    var emailEl = document.getElementById('menuEmail');
    var avatarEl = document.getElementById('menuAvatar');
    if (nameEl) {
      if (activeUser) {
        nameEl.textContent = activeUser.name || 'User';
        if (emailEl) emailEl.textContent = activeUser.email || '';
        if (avatarEl) {
          var initials = typeof getInitials === 'function' ? getInitials(activeUser.name) : (activeUser.name ? activeUser.name[0].toUpperCase() : '?');
          var color = activeUser._color || (typeof getColorForId === 'function' ? getColorForId(activeUser.id) : 'var(--accent)');
          if (activeUser.picture) { avatarEl.innerHTML = '<img src="' + activeUser.picture + '" style="width:100%;height:100%;border-radius:50%;object-fit:cover">'; }
          else { avatarEl.textContent = initials; avatarEl.style.background = color; }
        }
      } else {
        nameEl.textContent = 'Guest';
        if (emailEl) emailEl.textContent = '';
        if (avatarEl) { avatarEl.textContent = '?'; avatarEl.style.background = ''; }
      }
    }
  } catch (e) {}
})();

// Delegated click: sidebar buttons + edit mode image picker
document.addEventListener('click', function(e) {
  const sidebarEditBtn = e.target.closest('#hubSidebarEditBtn');
  if (sidebarEditBtn) { toggleSidebarEditMode(); return; }
  const visualsBtn = e.target.closest('#bcVisualsBtn');
  if (visualsBtn) { toggleEditMode(); return; }
  const settingsBtn = e.target.closest('.hamburger-settings-btn');
  if (settingsBtn) { return; }

  // Hamburger toggle
  const hamburger = e.target.closest('.hub-hamburger, #schHamburger, .hub-mobile-menu-btn');
  if (hamburger) {
    e.stopPropagation();
    if (window.innerWidth <= 768) {
      toggleMobileSidebar();
    } else {
      const panel = document.getElementById('hubMenuPanel');
      if (panel && panel.classList.contains('open')) { closeHubMenu(); }
      else { openHubMenu(); }
    }
    return;
  }

  // Overlay click closes sidebar
  const overlayEl = e.target.closest('.hub-sidebar-overlay');
  if (overlayEl) {
    const layout = overlayEl.closest('.hub-layout');
    if (!layout) return;
    const sidebar = layout.querySelector('.hub-sidebar');
    if (!sidebar) return;
    sidebar.classList.remove('open');
    overlayEl.classList.remove('active');
    var menuBtn = document.getElementById('hubMobileMenuBtn');
    if (menuBtn) menuBtn.classList.remove('hidden-btn');
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
    var menuBtn = document.getElementById('hubMobileMenuBtn');
    if (menuBtn) menuBtn.classList.remove('hidden-btn');
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
- tag: string (${TAG_ORDER.map(t => `"${t}"`).join(' | ')})
- subcategory: string (optional, use a known subcategory name if the user mentions one)

Tag labels: ${TAG_ORDER.map(t => `"${t}" = "${TAG_LABELS[t]}"`).join(', ')}
${(() => {
  const subcatMap = loadSubcategories();
  const parts = [];
  for (const t of TAG_ORDER) {
    const subs = subcatMap[t] || [];
    if (subs.length > 0) parts.push(`"${t}" subcategories: ${subs.map(s => `"${s}"`).join(', ')}`);
  }
  return parts.length > 0 ? 'Known subcategories:\n' + parts.join('\n') : '';
})()}
Tag rules: "deep work"/"focus"/"heads down" = deep-work. "gym"/"workout"/"run"/"cardio"/"exercise" = exercise. "math"/"english"/"class"/"chemistry"/"physics"/"mandarin"/"study" = study. "design"/"movie"/"build"/"app"/"hobby" = hobby. Default tag = "meeting".
Default duration: 1 hour. Default time: 9 AM. "tomorrow" = next day. Day names = next occurrence. "morning" ≈ 9am, "afternoon" ≈ 2pm, "evening" ≈ 7pm.

USER'S EXTRA INSTRUCTIONS:
${(() => { try { return localStorage.getItem('haven-ai-extra-instructions') || ''; } catch (e) { return ''; } })()}

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
    return { title: p.title, date: p.date, startTime: p.startTime, endTime: p.endTime, tag: p.tag || 'meeting', subcategory: p.subcategory || '' };
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

  // Tag detection — match built-in keywords, then custom tag labels
  let tag = 'meeting';
  if (lower.includes('deep work') || lower.includes('focus') || lower.includes('heads down') || lower.includes('concentrate')) tag = 'deep-work';
  else if (lower.includes('gym') || lower.includes('workout') || lower.includes('cardio') || lower.includes('run') || lower.includes('running') || lower.includes('jog') || lower.includes('exercise') || lower.includes('fitness') || lower.includes('yoga') || lower.includes('swim')) tag = 'exercise';
  else if (lower.includes('study') || lower.includes('math') || lower.includes('english') || lower.includes('chemistry') || lower.includes('biology') || lower.includes('physics') || lower.includes('mandarin') || lower.includes('class') || lower.includes('lesson') || lower.includes('tutor') || lower.includes('read') || lower.includes('learn') || lower.includes('homework')) tag = 'study';
  else if (lower.includes('design') || lower.includes('movie') || lower.includes('film') || lower.includes('hobby') || lower.includes('app') || lower.includes('build') || lower.includes('project') || lower.includes('creative') || lower.includes('art') || lower.includes('music') || lower.includes('game')) tag = 'hobby';
  // Match custom tag labels
  for (const t of TAG_ORDER) {
    if (t === 'deep-work' || t === 'meeting' || t === 'exercise' || t === 'study' || t === 'hobby') continue;
    const label = (TAG_LABELS[t] || '').toLowerCase();
    if (label && lower.includes(label)) { tag = t; break; }
  }
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
    if (slot) { return { title, date: dateStr, startTime: slot.startTime, endTime: slot.endTime, tag, subcategory: '', _adjusted: true }; }
  }
  return { title, date: dateStr, startTime: `${String(startH).padStart(2,'0')}:${String(startM).padStart(2,'0')}`, endTime: `${String(endH).padStart(2,'0')}:${String(endM).padStart(2,'0')}`, tag, subcategory: '' };
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

function resetAIChat() {
  if (!confirm('Clear all chat history?')) return;
  aiChatHistory = [];
  attachedFile = null;
  try { localStorage.removeItem(CHAT_HISTORY_KEY); } catch(e) {}
  hideAIChat();
  setTimeout(showAIChat, 100);
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

  // Add reset button to header if not already present
  if (!document.getElementById('aiChatResetBtn')) {
    var _actions = dom.aiChatPanel.querySelector('.ai-panel-header-actions');
    if (_actions) {
      var _resetBtn = document.createElement('button');
      _resetBtn.id = 'aiChatResetBtn';
      _resetBtn.className = 'ai-panel-icon-btn';
      _resetBtn.title = 'Clear chat history';
      _resetBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>';
      _resetBtn.addEventListener('click', resetAIChat);
      _actions.insertBefore(_resetBtn, _actions.querySelector('#aiChatClose'));
    }
  }

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

  var borderColor = 'var(--border-color)';
  var bgColor = 'var(--bg-card)';
  if (type === 'error') { borderColor = 'var(--danger,#ef4444)'; bgColor = 'color-mix(in srgb, var(--danger,#ef4444) 10%, var(--bg-card))'; }
  else if (type === 'success') { borderColor = 'var(--success,#22c55e)'; bgColor = 'color-mix(in srgb, var(--success,#22c55e) 10%, var(--bg-card))'; }
  else if (type === 'warning') { borderColor = 'var(--warning,#f59e0b)'; bgColor = 'color-mix(in srgb, var(--warning,#f59e0b) 10%, var(--bg-card))'; }
  else if (type === 'info') { borderColor = 'var(--accent)'; bgColor = 'color-mix(in srgb, var(--accent) 10%, var(--bg-card))'; }

  toast.style.cssText = `
    position: fixed; bottom: 100px; right: 28px; z-index: 9999;
    padding: 10px 18px; border-radius: 10px;
    font-size: 0.82rem; font-family: var(--font-family); font-weight: 500;
    background: ${bgColor}; border: 1px solid ${borderColor};
    color: var(--text-primary);
    box-shadow: 0 8px 30px rgba(0,0,0,0.15);
    display: flex; align-items: center; gap: 8px;
    animation: slideUp 200ms cubic-bezier(0.16, 1, 0.3, 1);
    max-width: 360px;
  `;
  toast.innerHTML = tStr(message);
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
    } else if (action.type === 'rememberFact') {
      var key = action.data.key;
      var fact = action.data.fact;
      if (key && fact) {
        storeMemory(key, fact, 'ai');
        actionSummary.push(`🧠 Noted: ${escapeHtml(key)} — ${escapeHtml(fact)}`);
      }
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
        trackPlanResult(true);
        showToast('✅ Plan executed', 'success', 2000);
      });
      msgEl.querySelector('.ai-plan-cancel')?.addEventListener('click', () => {
        msgEl.querySelector('.ai-bubble').innerHTML = response.text + '\n\n<em style="color:var(--text-tertiary)">✖ Plan cancelled</em>';
        trackPlanResult(false);
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

function renderMD(text) {
  // Simple markdown → HTML for AI responses (safe: doesn't break existing HTML)
  var t = text
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/```(\w*)\n?([\s\S]*?)```/g, '<pre><code>$2</code></pre>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
    .split(/\n{2,}/).map(function(b) {
      b = b.trim();
      if (!b) return '';
      if (/^[\-\*]\s/.test(b)) {
        var items = b.split('\n').map(function(l) { return '<li>' + l.replace(/^[\-\*]\s/, '') + '</li>'; }).join('');
        return '<ul>' + items + '</ul>';
      }
      if (/^\d+\.\s/.test(b)) {
        var items = b.split('\n').map(function(l) { return '<li>' + l.replace(/^\d+\.\s/, '') + '</li>'; }).join('');
        return '<ol>' + items + '</ol>';
      }
      return '<p>' + b.replace(/\n/g, '<br>') + '</p>';
    }).join('');
  return t;
}

function appendAIMessage(role, html) {
  if (!dom.aiChatMessages) return;
  const div = document.createElement('div');
  if (role === 'user') {
    div.className = 'ai-message ai-message-user';
    div.innerHTML = `<div class="ai-bubble">${escapeHtml(html)}</div>`;
  } else if (role === 'assistant') {
    var content = html;
    // Only render markdown if no HTML tags present (plain text responses)
    if (content.indexOf('<') === -1 || content.indexOf('>') === -1) {
      content = renderMD(content);
    }
    div.className = 'ai-message ai-message-assistant';
    div.innerHTML = `<div class="ai-avatar"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="5" width="16" height="14" rx="4"/><path d="M12 5V3"/><circle cx="12" cy="3" r="1.5"/><circle cx="9" cy="10" r="1" fill="currentColor"/><circle cx="15" cy="10" r="1" fill="currentColor"/><path d="M8 14a4 4 0 007 0"/></svg></div><div class="ai-bubble">${content}</div>`;
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

Today's date is ${today}. Current time: ${new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}. The user's timezone is ${Intl.DateTimeFormat().resolvedOptions().timeZone}.${getHolidayMode() ? '\n\nThe user is currently on HOLIDAY — no school commitments. When scheduling, suggest lighter workloads, more free time, flexible timing, and focus on hobbies, exercise, social activities, and relaxation. Weekdays and weekends are more similar.' : '\n\nThe user is currently in SCHOOL mode — they have regular school/class commitments on weekdays. When scheduling, prioritize study sessions, deep work, and structured activities during weekdays.'}${learningContext}${profileSection}

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
8. **LEARN AND REMEMBER** — You get smarter over time. When the user tells you something about themselves (preferences, habits, routines, personal facts), use the "rememberFact" action to store it permanently. In future conversations, you'll see everything you've learned in the "THINGS I'VE LEARNED ABOUT YOU" section above. Proactively apply what you know — if they told you they're vegetarian, don't suggest cooking tasks; if they said they work remote Tuesdays, remember that.

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

Available tags: ${TAG_ORDER.map(t => `"${t}"`).join(', ')} (default: "meeting")
Tag labels: ${TAG_ORDER.map(t => `"${t}" = "${TAG_LABELS[t]}"`).join(', ')}
${(() => {
  const subcatMap = loadSubcategories();
  const parts = [];
  for (const t of TAG_ORDER) {
    const subs = subcatMap[t] || [];
    if (subs.length > 0) parts.push(`"${t}" subcategories: ${subs.map(s => `"${s}"`).join(', ')}`);
  }
  return parts.length > 0 ? 'SUBCATEGORIES per tag:\n' + parts.join('\n') : '';
})()}
Default duration: 60 minutes. Default time: 09:00.
Tomorrow = next day from today. Day names = next occurrence.
When creating a task, if the user mentions a known subcategory, include "subcategory" in the data.

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
        "tag": "tag-name",
        "subcategory": "subcategory-name or empty"
      }
    }
  ]
}

AVAILABLE ACTION TYPES:
- "createTask": create a new task. data: { title, date, startTime, endTime, tag, subcategory? }
- "updateTask": modify an existing task. data: { id, changes: { title?, date?, startTime?, endTime?, tag?, subcategory?, completed? } }
- "deleteTask": delete a single task by its id. data: { id }
- "clearAllTasks": delete EVERY task on the schedule (keeps whiteboard ideas). data: {} (empty)
- "clearDate": delete all tasks on a specific date. data: { date: "YYYY-MM-DD" }
- "clearCompletedTasks": delete all completed tasks. data: {} (empty)
- "deleteTasksByTag": delete all tasks of a specific tag type. data: { tag: "tag-name" }
- "deleteTasksByQuery": delete all tasks whose title contains the given text. data: { query: "search text" }
- "rememberFact": store something you learned about the user for future conversations. data: { key: "short-unique-key", fact: "the fact to remember" }. Use this when the user shares personal info, preferences, habits, or anything useful to recall later. Example: { type: "rememberFact", data: { key: "work-hours", fact: "works 10am-6pm Tue-Sat" } }

EXAMPLES:
- "Clear my whole schedule" → use "clearAllTasks"
- "Delete everything on Friday" → use { type: "clearDate", data: { date: "2026-06-12" } }
- "Remove all completed tasks" → use "clearCompletedTasks"
- "Delete all my gym tasks" → use { type: "deleteTasksByTag", data: { tag: "exercise" } }
 - "Delete any task about laundry" → use { type: "deleteTasksByQuery", data: { query: "laundry" } }

USER'S EXTRA INSTRUCTIONS FOR YOU:
${(() => { try { return localStorage.getItem('haven-ai-extra-instructions') || ''; } catch (e) { return ''; } })()}

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

// Render sidebar images on all pages on load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function() {
    positionAccessItems();
    if (typeof renderSidebarImages === 'function') renderSidebarImages();
  });
} else {
  positionAccessItems();
  if (typeof renderSidebarImages === 'function') renderSidebarImages();
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
  if (typeof applyLanguage === 'function') applyLanguage();
};

window.applyAccessHubConfig = applyAccessHubConfig;

var DEFAULT_BUBBLES = {
  focusMode: { label: 'Focus', color: '#fff' },
  aiChat: { label: 'AI', color: '#fff' },
  screenshot: { label: 'Screenshot', color: '#fff' },
  copyWeek: { label: 'Copy Week', color: '#fff' }
};

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
      dark: lightenColor(currentColor, 0.45),
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
    } else {
      const customTags = loadCustomTags();
      const ct = customTags.find(c => c.id === tag);
      if (ct) currentColor = ct.color;
    }
    hue = hexToHsv(currentColor).h;
    updatePicker();
    pickColor();
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
    embed.src = active.embedUrl || 'https://open.spotify.com/embed/playlist/' + active.id + '?utm_source=generator';
    if (controls) controls.style.display = 'flex';
  } else {
    empty.style.display = 'flex';
    wrap.style.display = 'none';
    if (controls) controls.style.display = 'none';
  }
  spUpdateNav();
}

function spSidePrev() { 
  if (typeof window.spSideNav === 'function') window.spSideNav(-1);
  else spSideNav(-1);
}
function spSideNext() { 
  if (typeof window.spSideNav === 'function') window.spSideNav(1);
  else spSideNav(1);
}
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
  if (modalEmbed && playlist) modalEmbed.src = playlist.embedUrl || 'https://open.spotify.com/embed/playlist/' + playlist.id + '?utm_source=generator';
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
  if (modalEmbed && active) modalEmbed.src = active.embedUrl || 'https://open.spotify.com/embed/playlist/' + active.id + '?utm_source=generator';
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
  if (modalEmbed && playlist) modalEmbed.src = playlist.embedUrl || 'https://open.spotify.com/embed/playlist/' + playlist.id + '?utm_source=generator';
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
  if (e.key === 'Escape') {
    var overlay = document.getElementById('spOverlay');
    if (overlay && !overlay.classList.contains('hidden')) spCloseSettings();
  }
}

