const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'schedule.js');
let content = fs.readFileSync(filePath, 'utf8');

// The marker comments that bookend the screenshot function + helpers
const startMarker = '  /* ─── Screenshot week (enhanced) ────────────── */';
const endMarker   = '  /* ─── Copy week to next week ──────────────── */';

const startIdx = content.indexOf(startMarker);
const endIdx   = content.indexOf(endMarker);

if (startIdx === -1 || endIdx === -1) {
  console.error('Could not find markers in file');
  process.exit(1);
}

// The new implementation
const newCode = `  /* ─── Screenshot week (premium) ──────────────────── */
  window.captureWeekScreenshot = function() {
    if (!state || !state.tasks) return;
    const weekStart = state.currentWeekStart || getMonday(new Date());
    const days = getWeekRange(weekStart);
    const visibleDays = state.showWeekends !== false ? days : days.filter(d => d.getDay() !== 0 && d.getDay() !== 6);
    const colCount = visibleDays.length;
    if (!colCount) return;

    const now = new Date();
    const todayStr = formatDate(now);
    const currentMins = now.getHours() * 60 + now.getMinutes();

    const isDark = document.documentElement.classList.contains('dark') ||
      (!document.documentElement.classList.contains('light') &&
       window.matchMedia('(prefers-color-scheme: dark)').matches);

    // ─── Layout ───
    const ACCENT_BAR_H = 4, HEADER_H = 64, DAY_HDR_H = 54, ROW_H = 38;
    const TIME_W = 56, COL_W = 148;
    const totalHours = typeof VISIBLE_HOURS !== 'undefined' ? VISIBLE_HOURS : 23;
    const startH = typeof START_HOUR !== 'undefined' ? START_HOUR : 5;
    const topH = ACCENT_BAR_H + HEADER_H + DAY_HDR_H;
    const innerW = TIME_W + colCount * COL_W;
    const innerH = topH + totalHours * ROW_H;

    // ─── Theme ───
    const C = {
      bg: isDark ? '#1a1a1a' : '#faf9f5',
      cardBg: isDark ? '#222' : '#fff',
      text: isDark ? '#e8e6e3' : '#1b1b1b',
      textSec: isDark ? '#8c928d' : '#78756e',
      textTer: isDark ? '#6b6b6b' : '#a09c96',
      border: isDark ? '#3a3a3a' : '#ddd8d0',
      accent: '#4d6356',
      accentLight: isDark ? '#b4ccbc' : '#d4e8d8',
      white: '#fff',
      today: '#3b82f6',
      todayDark: '#2563eb',
      weekend: isDark ? '#1f1f1f' : '#f4f3ee',
      grid: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.07)',
      rowAlt: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)',
      timeBg: isDark ? '#1f1f1f' : '#f0ece6',
      headerBg: isDark ? '#151515' : '#fff',
      currentTime: '#ef4444',
    };

    // ─── Canvas ───
    const PAD = 24, RADIUS = 16, scale = 2;
    const outerW = innerW + PAD * 2, outerH = innerH + PAD * 2 + 52;
    const c = document.createElement('canvas');
    c.width = outerW * scale;
    c.height = outerH * scale;
    const ctx = c.getContext('2d');
    ctx.scale(scale, scale);

    // Ambient background glow
    const glow = ctx.createRadialGradient(outerW/2, outerH/2, 0, outerW/2, outerH/2, outerW*0.7);
    glow.addColorStop(0, isDark ? 'rgba(100,100,120,0.15)' : 'rgba(200,195,185,0.3)');
    glow.addColorStop(1, isDark ? 'rgba(0,0,0,0)' : 'rgba(0,0,0,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, outerW, outerH);

    // Shadow behind the card
    ctx.shadowColor = \`rgba(0,0,0,\${isDark ? 0.5 : 0.12})\`;
    ctx.shadowBlur = 40; ctx.shadowOffsetY = 8;
    ctx.beginPath(); roundedRect(ctx, PAD, PAD, innerW, innerH + 52, RADIUS); ctx.fillStyle = C.bg; ctx.fill();
    ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;

    // Clip
    ctx.save();
    ctx.beginPath(); roundedRect(ctx, PAD, PAD, innerW, innerH + 52, RADIUS); ctx.clip();

    const ox = PAD, oy = PAD;

    // ─── ACCENT BAR (top) ───
    const accGrad = ctx.createLinearGradient(ox, 0, ox + innerW, 0);
    accGrad.addColorStop(0, C.accent);
    accGrad.addColorStop(0.5, C.accentLight);
    accGrad.addColorStop(1, C.accent);
    ctx.fillStyle = accGrad;
    ctx.fillRect(ox, oy, innerW, ACCENT_BAR_H);

    // ─── APP HEADER ───
    const hdrGrad = ctx.createLinearGradient(0, oy + ACCENT_BAR_H, 0, oy + ACCENT_BAR_H + HEADER_H);
    hdrGrad.addColorStop(0, isDark ? '#222' : '#fff');
    hdrGrad.addColorStop(1, isDark ? '#1a1a1a' : '#f5f2ed');
    ctx.fillStyle = hdrGrad;
    ctx.fillRect(ox, oy + ACCENT_BAR_H, innerW, HEADER_H);
    ctx.fillStyle = C.border;
    ctx.fillRect(ox, oy + ACCENT_BAR_H + HEADER_H - 1, innerW, 1);

    // Logo
    ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.font = '700 15px -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif';
    ctx.fillStyle = C.text;
    ctx.fillText('Havën', ox + 18, oy + ACCENT_BAR_H + HEADER_H/2 - 9);
    ctx.font = '400 9px -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif';
    ctx.fillStyle = C.textSec;
    ctx.fillText('Schedule', ox + 18, oy + ACCENT_BAR_H + HEADER_H/2 + 11);

    // Decorative small square next to logo
    ctx.fillStyle = C.accent;
    ctx.globalAlpha = 0.4;
    ctx.fillRect(ox + 18, oy + ACCENT_BAR_H + 8, 2, 2);
    ctx.globalAlpha = 1;

    // Week range on right
    const firstLabel = visibleDays[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const lastLabel = visibleDays[visibleDays.length-1].toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
    ctx.font = '600 13px -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif';
    ctx.fillStyle = C.text;
    ctx.fillText(firstLabel + ' \\u2014 ' + lastLabel, ox + innerW - 18, oy + ACCENT_BAR_H + HEADER_H/2);

    // ─── MAIN GRID AREA ───
    ctx.fillStyle = C.bg;
    ctx.fillRect(ox, oy + topH, innerW, innerH - topH);

    // Alternating row stripes
    ctx.fillStyle = C.rowAlt;
    for (let ri = 0; ri < totalHours; ri += 2)
      ctx.fillRect(ox + TIME_W, oy + topH + ri * ROW_H, innerW - TIME_W, ROW_H);

    // Horizontal grid
    ctx.strokeStyle = C.grid; ctx.lineWidth = 0.5;
    for (let i = 0; i <= totalHours; i++) {
      const y = oy + topH + i * ROW_H;
      ctx.beginPath(); ctx.moveTo(ox, y); ctx.lineTo(ox + innerW, y); ctx.stroke();
    }

    // Vertical grid
    for (let j = 0; j <= colCount; j++) {
      const x = ox + TIME_W + j * COL_W;
      ctx.beginPath(); ctx.moveTo(x, oy + topH); ctx.lineTo(x, oy + topH + totalHours * ROW_H); ctx.stroke();
    }

    // ─── DAY HEADERS ───
    // Compute task counts per day
    const dayTaskCounts = {};
    for (let ti = 0; ti < state.tasks.length; ti++) {
      const t = state.tasks[ti];
      if (t.date && t.date >= formatDate(weekStart) && t.date < formatDate(addDays(weekStart, 7)) && !isWhiteboardTask(t)) {
        dayTaskCounts[t.date] = (dayTaskCounts[t.date] || 0) + 1;
      }
    }

    for (let k = 0; k < visibleDays.length; k++) {
      const d = visibleDays[k];
      const ds = formatDate(d);
      const isT = ds === todayStr;
      const isWE = isWeekend(d);
      const x = ox + TIME_W + k * COL_W;

      if (isWE) { ctx.fillStyle = C.weekend; ctx.fillRect(x, oy + ACCENT_BAR_H + HEADER_H, COL_W, innerH - ACCENT_BAR_H - HEADER_H); }

      // Day header bg
      ctx.fillStyle = isT ? C.today : (isDark ? '#2a2a2a' : '#f0f0f0');
      ctx.fillRect(x, oy + ACCENT_BAR_H + HEADER_H, COL_W, DAY_HDR_H);

      if (isT) { ctx.fillStyle = C.todayDark; ctx.fillRect(x, oy + ACCENT_BAR_H + HEADER_H + DAY_HDR_H - 3, COL_W, 3); }

      // Day name
      const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.font = (isT ? 'bold 10px ' : '600 10px ') + '-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif';
      ctx.fillStyle = isT ? C.white : C.textSec;
      ctx.fillText(dayName.toUpperCase(), x + COL_W/2, oy + ACCENT_BAR_H + HEADER_H + DAY_HDR_H/2 - 9);

      // Day number
      if (isT) {
        const cx = x + COL_W/2, cy = oy + ACCENT_BAR_H + HEADER_H + DAY_HDR_H/2 + 10;
        ctx.beginPath(); ctx.arc(cx, cy, 11, 0, Math.PI * 2);
        ctx.fillStyle = C.today; ctx.fill();
        ctx.fillStyle = C.white; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.font = 'bold 12px -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif';
        ctx.fillText(String(d.getDate()), cx, cy);
      } else {
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillStyle = C.text; ctx.font = '600 14px -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif';
        ctx.fillText(String(d.getDate()), x + COL_W/2, oy + ACCENT_BAR_H + HEADER_H + DAY_HDR_H/2 + 10);
      }

      // Task count badge
      const dayTotal = dayTaskCounts[ds] || 0;
      if (dayTotal > 0 && !isT) {
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.font = '400 7px -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif';
        ctx.fillStyle = C.textTer;
        ctx.fillText(dayTotal + ' tasks', x + COL_W/2, oy + ACCENT_BAR_H + HEADER_H + DAY_HDR_H/2 + 24);
      }
    }

    // ─── TIME AXIS ───
    ctx.fillStyle = C.timeBg;
    ctx.fillRect(ox, oy + ACCENT_BAR_H + HEADER_H, TIME_W, innerH - ACCENT_BAR_H - HEADER_H);

    ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
    ctx.fillStyle = C.textSec;
    for (let hh = 0; hh < totalHours; hh++) {
      const hour = startH + hh;
      const disp = hour === 0 ? 12 : (hour > 12 ? hour - 12 : hour);
      const ampm = hour < 12 ? 'AM' : 'PM';
      ctx.font = '9px -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif';
      ctx.fillText(disp + ' ' + ampm, ox + TIME_W - 8, oy + topH + hh * ROW_H + ROW_H/2);

      // Half-hour dot
      ctx.fillStyle = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';
      ctx.beginPath();
      ctx.arc(ox + TIME_W - 3, oy + topH + hh * ROW_H + ROW_H/2 + ROW_H/2, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // ─── CURRENT TIME ───
    if (currentMins >= startH * 60 && currentMins < (startH + totalHours) * 60) {
      const lineY = oy + topH + ((currentMins - startH * 60) / 60) * ROW_H;
      ctx.save();
      // Glow effect
      ctx.shadowColor = C.currentTime + '60';
      ctx.shadowBlur = 8;
      ctx.strokeStyle = C.currentTime;
      ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(ox + TIME_W, lineY); ctx.lineTo(ox + innerW, lineY); ctx.stroke();
      ctx.shadowColor = 'transparent';
      // Circle dot
      ctx.fillStyle = C.currentTime;
      ctx.beginPath(); ctx.arc(ox + TIME_W + 4, lineY, 4, 0, Math.PI * 2); ctx.fill();
      // Inner white dot
      ctx.fillStyle = C.white;
      ctx.beginPath(); ctx.arc(ox + TIME_W + 4, lineY, 1.5, 0, Math.PI * 2); ctx.fill();
      ctx.restore();

      // "Now" label
      ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      ctx.font = 'bold 6px -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif';
      ctx.fillStyle = C.currentTime;
      ctx.fillText('NOW', ox + TIME_W + 9, lineY - 9);
    }

    // ─── TASKS ───
    const ds = formatDate(weekStart);
    const de = formatDate(addDays(weekStart, 7));
    const weekTasks = [];
    for (let ti = 0; ti < state.tasks.length; ti++) {
      const t = state.tasks[ti];
      if (t.date && t.date >= ds && t.date < de && !isWhiteboardTask(t)) weekTasks.push(t);
    }

    // Tag hex color resolver
    function getTagHex(tag) {
      const fallback = '#8b5cf6';
      if (typeof TAG_COLORS === 'undefined' || !TAG_COLORS[tag]) return fallback;
      let c = TAG_COLORS[tag].text;
      if (!c) return fallback;
      if (typeof c === 'string' && c.startsWith('var(')) {
        const varName = c.slice(4, -1).trim();
        const val = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
        if (val) return val;
        const defaults = { 'deep-work': '#6366f1', 'meeting': '#3b82f6', 'exercise': '#ef4444', 'study': '#10b981', 'hobby': '#f59e0b' };
        return defaults[tag] || fallback;
      }
      return c;
    }

    function getTagLabel(tag) {
      if (typeof TAG_LABELS !== 'undefined' && TAG_LABELS[tag]) return TAG_LABELS[tag];
      return tag;
    }

    const PRIORITY_COLORS = { 1: '#ef4444', 2: '#f59e0b', 3: '#3b82f6' };
    const PRIORITY_LABELS = { 1: '!!', 2: '!', 3: '' };
    const tagTimeTotals = {};

    for (let ti = 0; ti < weekTasks.length; ti++) {
      const t = weekTasks[ti];
      let dayIdx = -1;
      for (let di = 0; di < visibleDays.length; di++) {
        if (formatDate(visibleDays[di]) === t.date) { dayIdx = di; break; }
      }
      if (dayIdx === -1) continue;

      let startMins = parseTime(t.startTime);
      if (isNaN(startMins)) { const p = t.startTime.split(':'); startMins = parseInt(p[0])*60 + parseInt(p[1]||0); }
      let endMins = parseTime(t.endTime);
      if (isNaN(endMins)) endMins = startMins + 60;
      if (startMins >= endMins) endMins = startMins + 30;
      const gStart = startH * 60, gEnd = (startH + totalHours) * 60;
      if (startMins < gStart) startMins = gStart;
      if (endMins > gEnd) endMins = gEnd;
      if (startMins >= endMins) continue;

      // Track time for breakdown
      tagTimeTotals[t.tag] = (tagTimeTotals[t.tag] || 0) + (endMins - startMins);

      const y1 = oy + topH + ((startMins - gStart) / 60) * ROW_H;
      const y2 = oy + topH + ((endMins - gStart) / 60) * ROW_H;
      const x1 = ox + TIME_W + dayIdx * COL_W + 5;
      const bw = COL_W - 10;
      const bh = Math.max(y2 - y1, 22);

      const tagColor = getTagHex(t.tag);
      const isComp = t.completed || false;
      ctx.globalAlpha = isComp ? 0.5 : 1;

      // Card shadow
      ctx.shadowColor = isDark ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.08)';
      ctx.shadowBlur = 6; ctx.shadowOffsetX = 0; ctx.shadowOffsetY = 2;

      // Card bg
      const r = 6;
      ctx.beginPath(); roundedRect(ctx, x1, y1, bw, bh, r);
      ctx.fillStyle = isDark ? '#2a2a2a' : C.white; ctx.fill();

      ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0; ctx.shadowOffsetX = 0; ctx.shadowOffsetY = 0;

      // Subtle border
      ctx.strokeStyle = tagColor + (isDark ? '40' : '30');
      ctx.lineWidth = 0.5;
      ctx.beginPath(); roundedRect(ctx, x1, y1, bw, bh, r); ctx.stroke();

      // Left accent bar
      ctx.fillStyle = tagColor;
      ctx.beginPath(); roundedRect(ctx, x1 + 1, y1 + 4, 3, bh - 8, 1.5); ctx.fill();

      // Tag tint
      ctx.fillStyle = tagColor + (isDark ? '12' : '08');
      ctx.beginPath(); roundedRect(ctx, x1, y1, bw, bh, r); ctx.fill();

      // Title
      const title = t.title || '';
      ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      ctx.font = (isComp ? '500 10px ' : '600 10px ') + '-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif';
      ctx.fillStyle = isComp ? (isDark ? '#777' : '#999') : C.text;

      ctx.save();
      ctx.beginPath(); ctx.rect(x1 + 10, y1 + 4, bw - 20, bh - 8); ctx.clip();

      const textX = x1 + 10, textY = y1 + bh/2;
      if (isComp) {
        ctx.fillText(title, textX, textY);
        ctx.strokeStyle = isDark ? '#777' : '#999';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(textX, textY);
        ctx.lineTo(textX + Math.min(ctx.measureText(title).width, bw - 22), textY);
        ctx.stroke();
      } else {
        ctx.fillText(title, textX, textY);
      }
      ctx.restore();

      // Priority badge (top-right)
      if (t.priority && t.priority < 3 && !isComp) {
        const priColor = PRIORITY_COLORS[t.priority] || '#f59e0b';
        const priLabel = PRIORITY_LABELS[t.priority] || '';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.font = 'bold 7px -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif';
        ctx.fillStyle = priColor;
        ctx.fillText(priLabel, x1 + bw - 11, y1 + 9);
      }

      // Notes preview
      if (t.notes && t.notes.trim() && bh >= 42 && !isComp) {
        const noteText = t.notes.trim().slice(0, 40);
        ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
        ctx.font = '400 7px -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif';
        ctx.fillStyle = C.textTer;
        ctx.save(); ctx.beginPath(); ctx.rect(x1 + 10, y1 + bh - 16, bw - 20, 14); ctx.clip();
        ctx.fillText(noteText, x1 + 10, y1 + bh - 9);
        ctx.restore();
      }

      // Time badge
      if (bh >= 38 && !isComp) {
        const timeStr = formatTimeRangeShort(t.startTime, t.endTime);
        ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
        ctx.font = '400 7px -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif';
        ctx.fillStyle = tagColor;
        ctx.save(); ctx.beginPath(); ctx.rect(x1 + 10, y1 + bh - 14, ctx.measureText(timeStr).width + 4, 10); ctx.clip();
        ctx.fillText(timeStr, x1 + 10, y1 + bh - 9);
        ctx.restore();
      }

      ctx.globalAlpha = 1;
    }

    // ─── TAG LEGEND ───
    const legendY = oy + innerH + 4;
    const usedTags = [];
    for (let ti = 0; ti < weekTasks.length; ti++) {
      const t = weekTasks[ti];
      if (usedTags.indexOf(t.tag) === -1) usedTags.push(t.tag);
    }

    if (usedTags.length > 0) {
      const legendX = ox + 16;
      ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      ctx.font = '400 9px -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif';
      ctx.fillStyle = C.textTer;
      ctx.fillText('TAGS', legendX, legendY + 4);

      let lx = legendX + 36;
      for (let ui = 0; ui < usedTags.length; ui++) {
        const tag = usedTags[ui];
        const color = getTagHex(tag);
        const label = getTagLabel(tag);

        // Color dot
        ctx.fillStyle = color;
        ctx.beginPath(); ctx.arc(lx + 5, legendY + 4, 4, 0, Math.PI * 2); ctx.fill();

        // Label
        ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
        ctx.font = '400 9px -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif';
        ctx.fillStyle = C.textSec;
        ctx.fillText(label, lx + 13, legendY + 4);

        lx += ctx.measureText(label).width + 28;
      }
    }

    // ─── TIME BREAKDOWN BAR ───
    const totalMins = Object.values(tagTimeTotals).reduce((a, b) => a + b, 0);
    if (totalMins > 0 && usedTags.length > 0) {
      const barX = ox + 16, barY = legendY + 20;
      const barW = innerW - 32, barH = 10;

      // Background track
      ctx.fillStyle = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)';
      ctx.beginPath(); roundedRect(ctx, barX, barY, barW, barH, 5); ctx.fill();

      // Colored segments
      let segX = barX;
      for (let ui = 0; ui < usedTags.length; ui++) {
        const tag = usedTags[ui];
        const mins = tagTimeTotals[tag] || 0;
        if (mins === 0) continue;
        const segW = (mins / totalMins) * barW;
        if (segW < 2) continue;
        ctx.fillStyle = getTagHex(tag);
        ctx.beginPath(); roundedRect(ctx, segX, barY, segW, barH, 4); ctx.fill();
        segX += segW;
      }

      // Total label
      const fmtMins = (m) => {
        const h = Math.floor(m / 60); const min = m % 60;
        if (h === 0) return min + 'm';
        if (min === 0) return h + 'h';
        return h + 'h ' + min + 'm';
      };
      ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
      ctx.font = '500 9px -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif';
      ctx.fillStyle = C.textSec;
      ctx.fillText(fmtMins(totalMins) + ' total', ox + innerW - 16, barY + 5);

      // Day-wise count on right
      ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
      ctx.font = '400 8px -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif';
      ctx.fillStyle = C.textTer;
      const taskCount = weekTasks.length;
      const doneCount = weekTasks.filter(t => t.completed).length;
      let countText = taskCount + ' task' + (taskCount !== 1 ? 's' : '');
      if (doneCount > 0) countText += ' \\u00B7 ' + doneCount + ' done';
      ctx.fillText(countText, ox + innerW - 16, barY + 22);
    }

    // ─── Branding footer ───
    const footerY = oy + innerH + 42;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = '400 7px -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif';
    ctx.fillStyle = isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)';
    ctx.fillText('Generated by Hav\\u00ebn Schedule', ox + innerW/2, footerY);

    // ─── EXPORT ───
    ctx.restore(); // undo clip

    c.toBlob(function(blob) {
      const link = document.createElement('a');
      link.download = 'Haven-Schedule-' + formatDate(now) + '.png';
      link.href = URL.createObjectURL(blob);
      document.body.appendChild(link);
      link.click();
      setTimeout(function() { document.body.removeChild(link); URL.revokeObjectURL(link.href); }, 100);
      if (typeof showToast === 'function') {
        showToast('\\uD83D\\uDCF7 Schedule screenshot saved!', 'success', 2000);
      }
    }, 'image/png', 0.96);
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
    function fmt(t) {
      var parts = t.split(':');
      var h = parseInt(parts[0]);
      var m = parts[1] || '00';
      var ampm = h < 12 ? 'AM' : 'PM';
      var h12 = h % 12 || 12;
      return h12 + ':' + m + ' ' + ampm;
    }
    return fmt(start) + '\\u2013' + fmt(end).replace(/ [AP]M$/, '');
  }

`;

const before = content.substring(0, startIdx);
const after  = content.substring(endIdx);

const newContent = before + newCode + after;

fs.writeFileSync(filePath, newContent, 'utf8');
console.log('✓ Screenshot function replaced successfully');
console.log('Total file length:', newContent.length, 'chars');
