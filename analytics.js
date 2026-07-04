/* ============================================
   Havën Schedule — Analytics Dashboard
   Canvas-based charts, stats, and day-by-day
   ============================================ */

let currentPeriod = 'week';
const pieCanvas = document.getElementById('pieChart');
const barCanvas = document.getElementById('barChart');
const trendCanvas = document.getElementById('trendChart');

pageAfterTaskSave = () => { renderAnalytics(); };
pageAfterImport = () => { renderAnalytics(); };

function getTagColorHex(tag) {
  const c = cardColors[tag] || DEFAULT_TAG_COLORS[tag];
  const isDark = document.documentElement.classList.contains('dark');
  const bg = isDark ? darkenColor(c.light, 0.82) : lightenColor(c.light, 0.85);
  const text = c.dark || lightenColor(c.light, 0.45);
  return { bg, text: c.light, dark: darkenColor(c.light, 0.82) };
}

// ─── FILTERING ─────────────────────────────────────────────
function getFilteredTasks() {
  const period = currentPeriod;
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  let startDate = null;

  if (period === 'week') {
    startDate = getMonday(today);
  } else if (period === 'month') {
    startDate = new Date(now.getFullYear(), now.getMonth(), 1);
  }

  return state.tasks.filter(t => {
    if (isWhiteboardTask(t)) return false;
    if (startDate) {
      const d = new Date(t.date + 'T12:00:00');
      if (d < startDate) return false;
    }
    return true;
  });
}

function getTaskDuration(task) {
  const start = parseTime(task.startTime);
  const end = parseTime(task.endTime) || start + 60;
  return Math.max(end - start, 15);
}

function formatHrs(mins) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

// ─── SUMMARY STATS ─────────────────────────────────────────
function renderSummary(tasks) {
  let totalMins = 0;
  let deepMins = 0;
  let studyMins = 0;
  let taskCount = 0;
  let completedCount = 0;

  for (const t of tasks) {
    if (t.completed) {
      completedCount++;
    } else {
      taskCount++;
      const dur = getTaskDuration(t);
      totalMins += dur;
      if (t.tag === 'deep-work') deepMins += dur;
      if (t.tag === 'study') studyMins += dur;
    }
  }

  const el = (id) => document.getElementById(id);
  el('statTasks').textContent = taskCount;
  el('statTime').textContent = formatHrs(totalMins);
  el('statDeep').textContent = formatHrs(deepMins);
  el('statStudy').textContent = formatHrs(studyMins);

  // Sub text
  el('statTasksSub').textContent = `${completedCount} completed`;
  el('statTimeSub').textContent = 'scheduled';
  el('statDeepSub').textContent = 'focus time';
  el('statStudySub').textContent = 'learning';
}

// ─── COMPLETION RATE ───────────────────────────────────────
function renderCompletion(tasks) {
  const el = (id) => document.getElementById(id);
  let completed = 0;
  let total = tasks.length;

  for (const t of tasks) {
    if (t.completed) completed++;
  }

  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

  el('compDone').textContent = completed;
  el('compTotal').textContent = total;
  el('compPct').textContent = `${pct}%`;
  el('completionFill').style.width = `${pct}%`;
  const ring = el('compRing');
  if (ring) ring.style.background = `conic-gradient(var(--accent) ${pct}%, var(--bg-secondary) ${pct}%)`;
  const ringPct = el('compRingPct');
  if (ringPct) ringPct.textContent = `${pct}%`;

  const period = currentPeriod;
  const periodMap = { week: 'This Week', month: 'This Month', all: 'All Time' };
  el('completionPeriod').textContent = periodMap[period] || 'All Time';
}

// ─── STREAK CARD ───────────────────────────────────────────
function renderStreak(tasks) {
  const el = (id) => document.getElementById(id);
  const streakDaysEl = el('streakDays');

  // Get last 7 days
  const days = [];
  const now = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    days.push({
      date: formatDate(d),
      label: d.toLocaleDateString('en-US', { weekday: 'short' }).charAt(0),
      isToday: i === 0
    });
  }

  // Check which days have tasks
  const dayHasTasks = days.map(day => {
    return tasks.some(t => t.date === day.date);
  });

  // Render day dots
  streakDaysEl.innerHTML = days.map((day, i) => {
    const classes = ['an-streak-day'];
    if (dayHasTasks[i]) classes.push('active');
    if (day.isToday) classes.push('today');
    return `<div class="${classes.join(' ')}">${day.label}</div>`;
  }).join('');

  // Calculate streaks (scoped to the 7-day window shown)
  let currentStreak = 0;
  let bestStreak = 0;
  let tempStreak = 0;
  let daysActive = 0;

  // Count from today backwards for current streak
  for (let i = days.length - 1; i >= 0; i--) {
    if (dayHasTasks[i]) {
      currentStreak++;
    } else {
      break;
    }
  }

  // Calculate best streak and total active days
  for (let i = 0; i < days.length; i++) {
    if (dayHasTasks[i]) {
      tempStreak++;
      daysActive++;
      bestStreak = Math.max(bestStreak, tempStreak);
    } else {
      tempStreak = 0;
    }
  }

  el('streakCurrent').textContent = currentStreak;
  el('streakBest').textContent = bestStreak;
  el('streakActive').textContent = daysActive;
}

// ─── PIE CHART ─────────────────────────────────────────────
function renderPieChart(tasks) {
  if (!pieCanvas) return;
  const ctx = pieCanvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const rect = pieCanvas.getBoundingClientRect();
  pieCanvas.width = rect.width * dpr;
  pieCanvas.height = rect.height * dpr;
  ctx.scale(dpr, dpr);
  const w = rect.width;
  const h = rect.height;

  ctx.clearRect(0, 0, w, h);

  const tagMins = {};
  for (const tag of TAG_ORDER) tagMins[tag] = 0;
  for (const t of tasks) {
    if (t.completed) continue;
    tagMins[t.tag] = (tagMins[t.tag] || 0) + getTaskDuration(t);
  }

  const total = Object.values(tagMins).reduce((a, b) => a + b, 0);
  if (total === 0) {
    ctx.fillStyle = 'var(--text-tertiary)';
    ctx.font = '13px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('No data', w / 2, h / 2);
    return;
  }

  const isDark = document.documentElement.classList.contains('dark');
  const cx = w * 0.35;
  const cy = h / 2;
  const r = Math.min(cx - 10, cy - 10, 80);

  let startAngle = -Math.PI / 2;
  const legend = [];

  for (const tag of TAG_ORDER) {
    const mins = tagMins[tag];
    if (mins === 0) continue;
    const pct = mins / total;
    const endAngle = startAngle + pct * Math.PI * 2;
    const color = isDark ? getTagColorHex(tag).dark : getTagColorHex(tag).bg;

    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, r, startAngle, endAngle);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();

    // Border
    ctx.strokeStyle = isDark ? '#1a1a1e' : '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();

    legend.push({ tag, pct: Math.round(pct * 100), color });
    startAngle = endAngle;
  }

  // Center hole
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.45, 0, Math.PI * 2);
  ctx.fillStyle = isDark ? '#1a1a1e' : '#ffffff';
  ctx.fill();

  ctx.fillStyle = isDark ? '#fafafa' : '#0a0a0b';
  ctx.font = 'bold 16px Inter, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(formatHrs(total), cx, cy);

  // Legend
  const legendEl = document.getElementById('pieLegend');
  if (legendEl) {
    legendEl.innerHTML = legend.map(l =>
      `<span class="an-legend-item">
        <span class="an-legend-dot" style="background:${l.color}"></span>
        ${TAG_LABELS[l.tag]} (${l.pct}%)
      </span>`
    ).join('');
  }
}

// ─── BAR CHART ─────────────────────────────────────────────
function renderBarChart(tasks) {
  if (!barCanvas) return;
  const ctx = barCanvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const rect = barCanvas.getBoundingClientRect();
  barCanvas.width = rect.width * dpr;
  barCanvas.height = rect.height * dpr;
  ctx.scale(dpr, dpr);
  const w = rect.width;
  const h = rect.height;

  ctx.clearRect(0, 0, w, h);

  const isDark = document.documentElement.classList.contains('dark');
  const textColor = isDark ? '#8a8a96' : '#6b6b78';
  const gridColor = isDark ? '#23232a' : '#e8e8ee';

  // Get last 7 days
  const days = [];
  const now = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    days.push(formatDate(d));
  }

  // Aggregate per-day minutes by tag
  const dayData = days.map(date => {
    const dayTasks = tasks.filter(t => t.date === date && !t.completed);
    const tags = {};
    let total = 0;
    for (const t of dayTasks) {
      const dur = getTaskDuration(t);
      tags[t.tag] = (tags[t.tag] || 0) + dur;
      total += dur;
    }
    return { date, tags, total };
  });

  const maxTotal = Math.max(...dayData.map(d => d.total), 1);

  const pad = { top: 15, bottom: 25, left: 5, right: 5 };
  const chartW = w - pad.left - pad.right;
  const chartH = h - pad.top - pad.bottom;
  const barW = chartW / days.length * 0.7;
  const gap = chartW / days.length * 0.3;

  // Grid lines
  ctx.strokeStyle = gridColor;
  ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i++) {
    const y = pad.top + (chartH / 4) * i;
    ctx.beginPath();
    ctx.moveTo(pad.left, y);
    ctx.lineTo(w - pad.right, y);
    ctx.stroke();
  }

  // Bars
  for (let i = 0; i < dayData.length; i++) {
    const x = pad.left + (chartW / days.length) * i + gap / 2;
    let yOffset = 0;

    const sortedTags = [...TAG_ORDER].reverse();
    for (const tag of sortedTags) {
      const mins = dayData[i].tags[tag] || 0;
      if (mins === 0) continue;
      const barH = (mins / maxTotal) * chartH;
      const color = isDark ? getTagColorHex(tag).dark : getTagColorHex(tag).bg;

      ctx.fillStyle = color;
      ctx.fillRect(x, pad.top + chartH - yOffset - barH, barW, barH);

      // Border
      ctx.strokeStyle = isDark ? '#1a1a1e' : '#ffffff';
      ctx.lineWidth = 1;
      ctx.strokeRect(x, pad.top + chartH - yOffset - barH, barW, barH);

      yOffset += barH;
    }

    // Date labels
    const date = new Date(dayData[i].date + 'T12:00:00');
    const label = date.toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 2);
    ctx.fillStyle = textColor;
    ctx.font = '10px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(label, x + barW / 2, h - pad.bottom + 14);
  }

  // Legend
  const legendEl = document.getElementById('barLegend');
  if (legendEl) {
    legendEl.innerHTML = TAG_ORDER.map(tag =>
      `<span class="an-legend-item">
        <span class="an-legend-dot" style="background:${isDark ? getTagColorHex(tag).dark : getTagColorHex(tag).bg}"></span>
        ${TAG_LABELS[tag]}
      </span>`
    ).join('');
  }
}

// ─── WEEKLY TREND CHART ────────────────────────────────────
function renderTrendChart(tasks) {
  if (!trendCanvas) return;
  const ctx = trendCanvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const rect = trendCanvas.getBoundingClientRect();
  trendCanvas.width = rect.width * dpr;
  trendCanvas.height = rect.height * dpr;
  ctx.scale(dpr, dpr);
  const w = rect.width;
  const h = rect.height;

  ctx.clearRect(0, 0, w, h);

  const isDark = document.documentElement.classList.contains('dark');
  const textColor = isDark ? '#8a8a96' : '#6b6b78';
  const gridColor = isDark ? '#23232a' : '#e8e8ee';

  // Get last 14 days for a better trend line
  const days = [];
  const now = new Date();
  for (let i = 13; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    days.push(formatDate(d));
  }

  // Count tasks per day
  const dayCounts = days.map(date => {
    return tasks.filter(t => t.date === date).length;
  });

  const maxCount = Math.max(...dayCounts, 1);

  const pad = { top: 20, bottom: 30, left: 5, right: 5 };
  const chartW = w - pad.left - pad.right;
  const chartH = h - pad.top - pad.bottom;

  // Grid lines
  ctx.strokeStyle = gridColor;
  ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i++) {
    const y = pad.top + (chartH / 4) * i;
    ctx.beginPath();
    ctx.moveTo(pad.left, y);
    ctx.lineTo(w - pad.right, y);
    ctx.stroke();
  }

  // Draw line chart
  const accentColor = isDark ? '#a5b4fc' : '#6366f1';
  const gradientTop = isDark ? 'rgba(165, 180, 252, 0.15)' : 'rgba(99, 102, 241, 0.1)';
  const gradientBottom = 'rgba(0, 0, 0, 0)';

  ctx.beginPath();
  ctx.moveTo(pad.left, pad.top + chartH);

  const points = dayCounts.map((count, i) => ({
    x: pad.left + (chartW / (days.length - 1)) * i,
    y: pad.top + chartH - (count / maxCount) * chartH
  }));

  // Fill area under curve
  ctx.beginPath();
  ctx.moveTo(points[0].x, pad.top + chartH);
  for (const p of points) {
    ctx.lineTo(p.x, p.y);
  }
  ctx.lineTo(points[points.length - 1].x, pad.top + chartH);
  ctx.closePath();

  const gradient = ctx.createLinearGradient(0, pad.top, 0, pad.top + chartH);
  gradient.addColorStop(0, gradientTop);
  gradient.addColorStop(1, gradientBottom);
  ctx.fillStyle = gradient;
  ctx.fill();

  // Draw line
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(points[i].x, points[i].y);
  }
  ctx.strokeStyle = accentColor;
  ctx.lineWidth = 2;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.stroke();

  // Draw dots
  for (const p of points) {
    ctx.beginPath();
    ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
    ctx.fillStyle = accentColor;
    ctx.fill();
    ctx.strokeStyle = isDark ? '#1a1a1e' : '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  // Date labels (every 3 days)
  ctx.fillStyle = textColor;
  ctx.font = '9px Inter, sans-serif';
  ctx.textAlign = 'center';
  for (let i = 0; i < days.length; i += 3) {
    const d = new Date(days[i] + 'T12:00:00');
    const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    ctx.fillText(label, points[i].x, h - pad.bottom + 14);
  }
}

// ─── DAY-BY-DAY TABLE ──────────────────────────────────────
function renderTable(tasks) {
  const tbody = document.getElementById('analyticsTableBody');
  if (!tbody) return;

  // Group tasks by date
  const dateMap = {};
  for (const t of tasks) {
    if (!dateMap[t.date]) dateMap[t.date] = [];
    dateMap[t.date].push(t);
  }

  const sortedDates = Object.keys(dateMap).sort().reverse();
  if (sortedDates.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:var(--text-tertiary)">No data</td></tr>';
    return;
  }

  let html = '';
  for (const date of sortedDates.slice(0, 30)) {
    const dayTasks = dateMap[date];
    const activeTasks = dayTasks.filter(t => !t.completed);
    let totalMins = 0;
    let deepMins = 0;
    let studyMins = 0;

    for (const t of activeTasks) {
      const dur = getTaskDuration(t);
      totalMins += dur;
      if (t.tag === 'deep-work') deepMins += dur;
      if (t.tag === 'study') studyMins += dur;
    }

    const d = new Date(date + 'T12:00:00');
    const label = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    const otherMins = totalMins - deepMins - studyMins;

    html += `<tr>
      <td>${label}</td>
      <td class="num">${activeTasks.length}</td>
      <td class="num">${formatHrs(totalMins)}</td>
      <td class="num">${formatHrs(deepMins)}</td>
      <td class="num">${formatHrs(studyMins)}</td>
      <td class="num">${formatHrs(otherMins)}</td>
    </tr>`;
  }
  tbody.innerHTML = html;
}


// ─── SLEEP CHARTS ─────────────────────────────────────────
const sleepCanvas = document.getElementById('sleepChart');

function renderSleepAnalytics() {
  const logs = loadSleepLogs();
  const now = new Date();
  const ws = getMonday(now);

  // Get last 7 days
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    days.push(formatDate(d));
  }

  const weekLogs = [];
  for (const ds of days) {
    const log = getSleepLog(ds);
    if (log) weekLogs.push(log);
  }

  // Duration stats
  const durEl = document.getElementById('sleepAnalyticsDuration');
  const durSubEl = document.getElementById('sleepAnalyticsDurationSub');
  if (weekLogs.length > 0) {
    const totalMins = weekLogs.reduce((s, l) => s + l.duration, 0);
    const avgMins = Math.round(totalMins / weekLogs.length);
    durEl.textContent = formatSleepMinutes(avgMins);
    durSubEl.textContent = 'Average across ' + weekLogs.length + ' nights';

    // Show target comparison
    const targets = loadSleepTargets();
    const targetDurEl = document.getElementById('sleepAnalyticsTarget');
    if (targetDurEl) {
      const diff = avgMins - targets.targetDuration;
      if (Math.abs(diff) < 30) {
        targetDurEl.textContent = 'On track with target (' + formatSleepMinutes(targets.targetDuration) + ')';
        targetDurEl.style.color = '#10b981';
      } else if (diff > 0) {
        targetDurEl.textContent = '+' + formatSleepMinutes(diff) + ' over ' + formatSleepMinutes(targets.targetDuration) + ' target';
        targetDurEl.style.color = '#10b981';
      } else {
        targetDurEl.textContent = formatSleepMinutes(Math.abs(diff)) + ' under ' + formatSleepMinutes(targets.targetDuration) + ' target';
        targetDurEl.style.color = '#ef4444';
      }
    }
  } else {
    durEl.textContent = '—';
    durSubEl.textContent = 'No sleep data';
  }

  // Consistency score
  const consistencyEl = document.getElementById('sleepAnalyticsConsistency');
  const consistencySubEl = document.getElementById('sleepAnalyticsConsistencySub');
  if (consistencyEl) {
    const consistency = getSleepConsistencyScore(logs);
    if (consistency) {
      consistencyEl.textContent = consistency.score;
      if (consistencySubEl) {
        consistencySubEl.textContent = 'Bedtime varies by ' + consistency.bedVariance + 'min, wake by ' + consistency.wakeVariance + 'min';
      }
    } else {
      consistencyEl.textContent = '—';
      if (consistencySubEl) consistencySubEl.textContent = 'Log 3+ nights to calculate';
    }
  }

  // Sleep debt
  const debtEl = document.getElementById('sleepAnalyticsDebt');
  const debtSubEl = document.getElementById('sleepAnalyticsDebtSub');
  if (debtEl) {
    const targets = loadSleepTargets();
    const debt = getSleepDebt(logs, targets);
    if (debt.daysWithData > 0) {
      const totalHours = Math.round(debt.totalDebt / 60 * 10) / 10;
      const sign = totalHours > 0 ? '+' : '';
      debtEl.textContent = sign + totalHours.toFixed(1) + 'h';
      debtEl.style.color = totalHours > 1 ? '#10b981' : totalHours < -1 ? '#ef4444' : 'var(--text-primary)';
      if (debtSubEl) debtSubEl.textContent = totalHours > 0 ? 'Surplus over 14 days' : totalHours < 0 ? 'Deficit over 14 days' : 'Balanced';
    } else {
      debtEl.textContent = '—';
      if (debtSubEl) debtSubEl.textContent = 'No sleep data';
    }
  }

  // Quality stats
  const qEl = document.getElementById('sleepAnalyticsQuality');
  const qSubEl = document.getElementById('sleepAnalyticsQualitySub');
  const qFillEl = document.getElementById('sleepQualityFill');
  const qScoreEl = document.getElementById('sleepQualityScore');
  const logCountEl = document.getElementById('sleepLogCount');
  const bestNightEl = document.getElementById('sleepBestNight');
  if (weekLogs.length > 0) {
    const avgQ = weekLogs.reduce((s, l) => s + l.quality, 0) / weekLogs.length;
    qEl.textContent = avgQ.toFixed(1) + ' / 5';
    qSubEl.textContent = 'Average sleep quality';
    qFillEl.style.width = (avgQ / 5 * 100) + '%';
    qScoreEl.textContent = avgQ.toFixed(1);
    logCountEl.textContent = weekLogs.length;
    const best = weekLogs.reduce((a, b) => a.quality > b.quality ? a : b, weekLogs[0]);
    bestNightEl.textContent = best ? formatSleepMinutes(best.duration) : '—';
  } else {
    qEl.textContent = '—';
    qSubEl.textContent = 'No sleep data';
    qFillEl.style.width = '0%';
    qScoreEl.textContent = '0';
    logCountEl.textContent = '0';
    bestNightEl.textContent = '—';
  }

  // Sleep chart
  renderSleepChart(weekLogs, days);
}

function renderSleepChart(weekLogs, days) {
  if (!sleepCanvas) return;
  const ctx = sleepCanvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const rect = sleepCanvas.getBoundingClientRect();
  sleepCanvas.width = rect.width * dpr;
  sleepCanvas.height = rect.height * dpr;
  ctx.scale(dpr, dpr);
  const w = rect.width;
  const h = rect.height;

  ctx.clearRect(0, 0, w, h);

  const isDark = document.documentElement.classList.contains('dark');
  const textColor = isDark ? '#8a8a96' : '#6b6b78';
  const gridColor = isDark ? '#23232a' : '#e8e8ee';
  const accentColor = isDark ? '#a5b4fc' : '#6366f1';
  const fillColor = isDark ? 'rgba(99, 102, 241, 0.15)' : 'rgba(99, 102, 241, 0.1)';

  // Build day data
  const dayData = days.map((ds, i) => {
    const log = weekLogs.find(l => l.date === ds);
    return {
      label: new Date(ds + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'narrow' }),
      mins: log ? log.duration : 0,
      quality: log ? log.quality : 0,
      hasData: !!log
    };
  });

  const maxMins = Math.max(...dayData.map(d => d.mins), 480);

  const pad = { top: 10, bottom: 20, left: 5, right: 5 };
  const chartW = w - pad.left - pad.right;
  const chartH = h - pad.top - pad.bottom;

  // Grid lines
  ctx.strokeStyle = gridColor;
  ctx.lineWidth = 1;
  for (let i = 0; i <= 3; i++) {
    const y = pad.top + (chartH / 3) * i;
    ctx.beginPath();
    ctx.moveTo(pad.left, y);
    ctx.lineTo(w - pad.right, y);
    ctx.stroke();
  }

  // Bars
  const barW = Math.min(24, chartW / days.length * 0.55);
  const gap = chartW / days.length;

  for (let i = 0; i < dayData.length; i++) {
    const d = dayData[i];
    if (!d.hasData) continue;
    const x = pad.left + gap * i + (gap - barW) / 2;
    const barH = (d.mins / maxMins) * chartH;
    const y = pad.top + chartH - barH;

    // Bar with rounded top
    ctx.beginPath();
    ctx.roundRect(x, y, barW, barH, [2, 2, 0, 0]);
    ctx.fillStyle = accentColor;
    ctx.globalAlpha = 0.4 + (d.quality / 5) * 0.6;
    ctx.fill();
    ctx.globalAlpha = 1;

    // Label
    ctx.fillStyle = textColor;
    ctx.font = '9px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(d.label, x + barW / 2, h - pad.bottom + 12);
  }

  // 8-hour reference line
  const refY = pad.top + chartH - (480 / maxMins) * chartH;
  ctx.strokeStyle = isDark ? 'rgba(239, 68, 68, 0.3)' : 'rgba(239, 68, 68, 0.2)';
  ctx.lineWidth = 1;
  ctx.setLineDash([3, 3]);
  ctx.beginPath();
  ctx.moveTo(pad.left, refY);
  ctx.lineTo(w - pad.right, refY);
  ctx.stroke();
  ctx.setLineDash([]);

  // "8h" label
  ctx.fillStyle = isDark ? 'rgba(239, 68, 68, 0.4)' : 'rgba(239, 68, 68, 0.3)';
  ctx.font = '8px Inter, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('8h', w - pad.right - 14, refY - 2);
}

// Add roundRect polyfill for canvas
if (!CanvasRenderingContext2D.prototype.roundRect) {
  CanvasRenderingContext2D.prototype.roundRect = function(x, y, w, h, radii) {
    const r = Array.isArray(radii) ? radii : [radii, radii, radii, radii];
    const [tl, tr, br, bl] = r.map(v => Math.min(v || 0, Math.min(w, h) / 2));
    this.moveTo(x + tl, y);
    this.lineTo(x + w - tr, y);
    this.quadraticCurveTo(x + w, y, x + w, y + tr);
    this.lineTo(x + w, y + h - br);
    this.quadraticCurveTo(x + w, y + h, x + w - br, y + h);
    this.lineTo(x + bl, y + h);
    this.quadraticCurveTo(x, y + h, x, y + h - bl);
    this.lineTo(x, y + tl);
    this.quadraticCurveTo(x, y, x + tl, y);
    this.closePath();
  };
}

// ─── MAIN RENDER ───────────────────────────────────────────
function renderAnalytics() {
  const tasks = getFilteredTasks();
  renderSummary(tasks);
  renderCompletion(tasks);
  renderStreak(tasks);
  renderPieChart(tasks);
  renderBarChart(tasks);
  renderTrendChart(tasks);
  renderTable(tasks);
  renderSleepAnalytics();

  const labelEl = document.getElementById('detailPeriodLabel');
  if (labelEl) {
    const map = { week: 'This Week', month: 'This Month', all: 'All Time' };
    labelEl.textContent = map[currentPeriod] || 'All Time';
  }
}

// ─── SETUP ────────────────────────────────────────────
function setupPage() {
  dom.importFileInput = document.getElementById('drawerImportFile');
  dom.aiChatBtn = document.getElementById('aiChatBtnSidebar');
  dom.aiChatPanel = document.getElementById('aiChatPanel');
  dom.aiChatOverlay = document.getElementById('aiChatOverlay');
  dom.aiChatMessages = document.getElementById('aiChatMessages');
  dom.aiChatInput = document.getElementById('aiChatInput');
  dom.aiChatInputWrapper = document.getElementById('aiChatInputWrapper');
  dom.aiChatSend = document.getElementById('aiChatSend');
  dom.aiChatClose = document.getElementById('aiChatClose');

  // Help modal
  // dom.helpBtn removed
  dom.helpOverlay = document.getElementById('helpOverlay');
  dom.helpModal = document.getElementById('helpModal');
  dom.helpModalClose = document.getElementById('helpModalClose');
  // helpBtn listener removed
  dom.helpOverlay?.addEventListener('click', hideHelpModal);
  dom.helpModalClose?.addEventListener('click', hideHelpModal);
  populateShortcuts();

  document.getElementById('themeBtnSidebar')?.addEventListener('click', toggleTheme);
  // settingsBtnSidebar removed
  dom.importFileInput?.addEventListener('change', importData);
  document.getElementById('importDataBtn')?.addEventListener('click', () => { if (dom.importFileInput) { dom.importFileInput.value = ''; dom.importFileInput.click(); } });

  dom.aiChatBtn?.addEventListener('click', openSettingsBubble);
  dom.aiChatOverlay?.addEventListener('click', hideAIChat);
  dom.aiChatClose?.addEventListener('click', hideAIChat);
  dom.aiChatSend?.addEventListener('click', sendAIMessage);
  dom.aiChatInput?.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendAIMessage(); } });
}

// ─── INIT ──────────────────────────────────────────────────
function init() {
  loadState();
  if (!hasSeenTutorial() && typeof startTutorial === "function") {
    try { setTimeout(function() { startTutorial(ANALYTICS_TUTORIAL_STEPS); }, 300); } catch(e) {}
  }
  applyTheme();
  document.querySelectorAll('img[data-image-id]').forEach(el => { el.src = getImage(el.dataset.imageId) || ''; });
  renderAnalytics();

  document.getElementById('analyticsPeriodPills')?.addEventListener('click', (e) => {
    const pill = e.target.closest('.an-period-pill');
    if (!pill) return;
    document.querySelectorAll('.an-period-pill').forEach(p => p.classList.remove('active'));
    pill.classList.add('active');
    currentPeriod = pill.dataset.period;
    renderAnalytics();
  });
  window.addEventListener('resize', renderAnalytics);

  // Re-render on theme toggle
  const observer = new MutationObserver(() => renderAnalytics());
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

  setupPage();
  document.getElementById('exportBtn')?.addEventListener('click', exportData);
  document.getElementById('importBtn')?.addEventListener('click', () => { document.getElementById('drawerImportFile')?.click(); });

}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
else init();