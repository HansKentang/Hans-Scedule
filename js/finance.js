/* ============================================
   Havën Schedule — Finance Advanced Charts
   Treemap, MoM, Heatmap, Waterfall, Merchants
   ============================================ */

// NOTE: loadFin(), fmtMoney(), escapeHtml() are already defined
// in the inline <script> of finance.html.
// formatDate() is available from shared.js.

const ADV_CAT_COLORS = ['#6366f1','#f59e0b','#ef4444','#22c55e','#06b6d4','#ec4899','#f97316','#8b5cf6','#14b8a6'];
let currentAdvView = 'treemap';

function initAdvancedCharts() {
  const tabs = document.querySelectorAll('.fin-adv-tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      currentAdvView = tab.dataset.view;
      renderAdvView();
    });
  });
  renderAdvView();
}

function renderAdvView() {
  const body = document.getElementById('finAdvBody');
  if (!body) return;
  const items = typeof filterByRange === 'function' ? filterByRange(loadFin(), currentRange) : loadFin();
  if (!items || !items.length) {
    body.innerHTML = `<div class="fin-empty"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg><p>Add transactions to unlock spending intelligence.</p><span class="sub">Your charts will appear here as you build your history.</span></div>`;
    return;
  }
  switch (currentAdvView) {
    case 'treemap': renderTreemap(body, items); break;
    case 'mom': renderMonthOverMonth(body, items); break;
    case 'heatmap': renderCalendarHeatmap(body, items); break;
    case 'waterfall': renderWaterfallChart(body, items); break;
    case 'merchants': renderTopMerchants(body, items); break;
  }
}

// ─── TREEMAP ────────────────────────────────────────────────

function renderTreemap(body, items) {
  const expenses = items.filter(x => x.type === 'expense');
  const totals = {};
  expenses.forEach(x => {
    const k = x.category || 'Other';
    totals[k] = (totals[k] || 0) + Number(x.amount || 0);
  });
  const data = Object.entries(totals).sort((a, b) => b[1] - a[1]);
  const total = data.reduce((s, [,v]) => s + v, 0);
  if (!data.length) {
    body.innerHTML = '<div class="fin-empty"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="15"/><rect x="3" y="14" width="7" height="4"/></svg><p>No expenses to visualize.</p></div>';
    return;
  }

  const items2 = data.map(([name, val]) => ({
    name, value: val,
    color: ADV_CAT_COLORS[data.findIndex(d => d[0] === name) % ADV_CAT_COLORS.length]
  }));
  const rects = squarify(items2, 0, 0, 600, 300);

  body.innerHTML = `
    <div class="fin-treemap-tooltip" id="finTreemapTooltip"></div>
    <svg class="fin-treemap-svg" viewBox="0 0 600 300" preserveAspectRatio="xMidYMid meet">
      ${rects.map(r => `
        <rect class="fin-treemap-rect"
          x="${r.x}" y="${r.y}" width="${r.w}" height="${r.h}"
          fill="${r.color}" opacity="0.85"
          data-name="${escapeHtml(r.name)}"
          data-amount="${r.value}"
          data-pct="${((r.value / total) * 100).toFixed(1)}"
          stroke="var(--bg-primary)" stroke-width="2"
          rx="4" ry="4"
        />
        ${r.w > 60 && r.h > 30 ? `<text class="fin-treemap-label" x="${r.x + r.w / 2}" y="${r.y + r.h / 2}" text-anchor="middle" dominant-baseline="central" fill="var(--text-inverse)" font-size="11" font-weight="600">${escapeHtml(r.name.length > 12 ? r.name.slice(0, 12) + '…' : r.name)}</text>` : ''}
        ${r.w > 60 && r.h > 50 ? `<text class="fin-treemap-label" x="${r.x + r.w / 2}" y="${r.y + r.h / 2 + 14}" text-anchor="middle" dominant-baseline="central" fill="var(--text-inverse)" font-size="9" opacity="0.8">${fmtMoney(r.value)}</text>` : ''}
      `).join('')}
    </svg>`;

  const svg = body.querySelector('.fin-treemap-svg');
  const tooltip = body.querySelector('#finTreemapTooltip');
  if (svg && tooltip) {
    svg.querySelectorAll('.fin-treemap-rect').forEach(rect => {
      rect.addEventListener('mouseenter', e => {
        tooltip.innerHTML = `<div class="tt-amount">${fmtMoney(Number(rect.dataset.amount))}</div><div class="tt-pct">${rect.dataset.pct}% · ${escapeHtml(rect.dataset.name)}</div>`;
        tooltip.style.display = 'block';
      });
      rect.addEventListener('mousemove', e => {
        tooltip.style.left = (e.clientX + 14) + 'px';
        tooltip.style.top = (e.clientY - 10) + 'px';
      });
      rect.addEventListener('mouseleave', () => { tooltip.style.display = 'none'; });
    });
  }
}

function squarify(items, x, y, w, h) {
  if (!items.length) return [];
  const total = items.reduce((s, i) => s + i.value, 0);
  const area = w * h;
  const scaled = items.map(i => ({ ...i, area: (i.value / total) * area }));
  return squarifyLayout(scaled, x, y, w, h);
}

function squarifyLayout(items, x, y, w, h) {
  if (!items.length) return [];
  if (items.length === 1) {
    return [{ x, y, w: Math.max(w, 1), h: Math.max(h, 1), name: items[0].name, value: items[0].value, color: items[0].color }];
  }

  const totalArea = items.reduce((s, i) => s + i.area, 0);
  const isHorizontal = w >= h;
  const side = isHorizontal ? h : w;
  const row = [];
  let rowArea = 0;
  let bestAspect = Infinity;

  for (let i = 0; i < items.length; i++) {
    const trial = [...row, items[i]];
    const trialArea = rowArea + items[i].area;
    const rowLength = trialArea / side;
    const worst = Math.max(...trial.map(it => Math.max(it.area / rowLength, rowLength / it.area)));
    if (worst <= bestAspect || row.length === 0) {
      row.push(items[i]);
      rowArea += items[i].area;
      bestAspect = worst;
    } else {
      break;
    }
  }

  const remaining = items.slice(row.length);
  const rowLen = rowArea / side;
  const result = [];

  if (isHorizontal) {
    let curY = y;
    for (const item of row) {
      result.push({ x, y: curY, w: rowLen, h: Math.max(item.area / rowLen, 1), name: item.name, value: item.value, color: item.color });
      curY += item.area / rowLen;
    }
    result.push(...squarifyLayout(remaining, x + rowLen, y, w - rowLen, h));
  } else {
    let curX = x;
    for (const item of row) {
      result.push({ x: curX, y, w: Math.max(item.area / rowLen, 1), h: rowLen, name: item.name, value: item.value, color: item.color });
      curX += item.area / rowLen;
    }
    result.push(...squarifyLayout(remaining, x, y + rowLen, w, h - rowLen));
  }

  return result;
}

// ─── MONTH-OVER-MONTH ──────────────────────────────────────

function renderMonthOverMonth(body, items) {
  const now = new Date();
  const curMonth = now.getMonth();
  const curYear = now.getFullYear();

  function monthExpenses(year, month) {
    const filtered = items.filter(x => {
      const d = new Date(x.date);
      return x.type === 'expense' && d.getFullYear() === year && d.getMonth() === month;
    });
    const cats = {};
    filtered.forEach(x => {
      const k = x.category || 'Other';
      cats[k] = (cats[k] || 0) + Number(x.amount || 0);
    });
    return cats;
  }

  const curCats = monthExpenses(curYear, curMonth);
  const prevM = curMonth === 0 ? 11 : curMonth - 1;
  const prevY = curMonth === 0 ? curYear - 1 : curYear;
  const prevCats = monthExpenses(prevY, prevM);

  const allCats = [...new Set([...Object.keys(curCats), ...Object.keys(prevCats)])];
  const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  if (!allCats.length) {
    body.innerHTML = '<div class="fin-empty"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/></svg><p>No expense data for this or last month.</p></div>';
    return;
  }

  body.innerHTML = `
    <div class="fin-mom-wrap">
      <div class="fin-mom-header">
        <span>Spending comparison</span>
        <div class="fin-mom-months">
          <span class="fin-mom-month" style="opacity:0.6">${escapeHtml(monthNames[prevM] + ' ' + prevY)}</span>
          <span style="color:var(--text-tertiary);font-size:0.65rem">vs</span>
          <span class="fin-mom-month">${escapeHtml(monthNames[curMonth] + ' ' + curYear)}</span>
        </div>
      </div>
      <div class="fin-mom-chart">
        ${allCats.sort((a, b) => (curCats[b] || 0) - (curCats[a] || 0)).map((cat, i) => {
          const cur = curCats[cat] || 0;
          const prev = prevCats[cat] || 0;
          const max = Math.max(cur, prev, 1);
          const prevPct = (prev / max) * 100;
          const curPct = (cur / max) * 100;
          const color = ADV_CAT_COLORS[i % ADV_CAT_COLORS.length];
          const delta = cur - prev;
          const deltaCls = delta > 0 ? 'up' : delta < 0 ? 'down' : '';
          const deltaSign = delta > 0 ? '+' : '';
          return `<div class="fin-mom-row">
            <div class="fin-mom-cat" title="${escapeHtml(cat)}">${escapeHtml(cat)}</div>
            <div class="fin-mom-bars">
              ${prev > 0 ? `<div class="fin-mom-bar prev" style="width:${prevPct}%;background:${color};flex:0 0 ${Math.max(prevPct, 2)}%"></div>` : ''}
              <div class="fin-mom-bar current" style="width:${curPct}%;background:${color};flex:0 0 ${Math.max(curPct, 2)}%"></div>
            </div>
            <div class="fin-mom-val">${fmtMoney(cur)}</div>
            <div class="fin-mom-delta ${deltaCls}">${deltaCls ? deltaSign + fmtMoney(Math.abs(delta)) : '—'}</div>
          </div>`;
        }).join('')}
      </div>
    </div>`;
}

// ─── CALENDAR HEATMAP ──────────────────────────────────────

function renderCalendarHeatmap(body, items) {
  const now = new Date();
  const startDate = new Date(now);
  startDate.setFullYear(now.getFullYear(), now.getMonth() - 5, 1);
  const endDate = new Date(now);

  const dailyExpenses = {};
  items.forEach(x => {
    if (x.type !== 'expense') return;
    const dt = new Date(x.date + 'T12:00:00');
    if (dt < startDate || dt > endDate) return;
    dailyExpenses[x.date] = (dailyExpenses[x.date] || 0) + Number(x.amount || 0);
  });

  const maxExp = Math.max(...Object.values(dailyExpenses), 1);
  const weeks = [];
  let cur = new Date(startDate);
  cur.setDate(cur.getDate() - cur.getDay());
  const monthLabels = [];

  while (cur <= endDate) {
    const week = [];
    for (let i = 0; i < 7; i++) {
      const ds = formatDate(cur);
      const exp = dailyExpenses[ds] || 0;
      const ratio = exp / maxExp;
      const level = exp > 0 ? (ratio > 0.75 ? 4 : ratio > 0.5 ? 3 : ratio > 0.25 ? 2 : 1) : 0;
      week.push({ date: ds, exp, level, isToday: ds === formatDate(now) });
      if (cur.getDate() === 1) monthLabels.push({ index: weeks.length, label: cur.toLocaleDateString('en-US', { month: 'short' }) });
      cur.setDate(cur.getDate() + 1);
    }
    weeks.push(week);
  }

  const heatColors = ['transparent', 'rgba(34,197,94,0.2)', 'rgba(34,197,94,0.4)', 'rgba(34,197,94,0.65)', 'rgba(34,197,94,0.9)'];

  body.innerHTML = `
    <div class="fin-heat-wrap">
      <div class="fin-heat-header">
        <div class="fin-heat-title">Daily spending · last 6 months</div>
        <div class="fin-heat-legend">
          <span>Less</span>
          ${heatColors.map((c, i) => `<div class="fin-heat-swatch" style="background:${c}"></div>`).join('')}
          <span>More</span>
        </div>
      </div>
      <div class="fin-heat-tooltip" id="finHeatTooltip"></div>
      <div class="fin-heat-grid">
        ${weeks.map((week, wi) => {
          const ml = monthLabels.find(m => m.index === wi);
          return `<div class="fin-heat-week">
            ${ml ? `<span class="fin-heat-month-label" style="width:28px">${ml.label}</span>` : '<span style="width:28px;flex-shrink:0"></span>'}
            ${week.map(day => `<div class="fin-heat-day" style="background:${heatColors[day.level]};${day.isToday ? 'outline:2px solid var(--accent);outline-offset:-1px' : ''}' data-date="${day.date}" data-exp="${day.exp}"></div>`).join('')}
          </div>`;
        }).join('')}
      </div>
    </div>`;

  const tooltip = body.querySelector('#finHeatTooltip');
  body.querySelectorAll('.fin-heat-day').forEach(el => {
    el.addEventListener('mouseenter', () => {
      const exp = Number(el.dataset.exp);
      if (!exp) { tooltip.style.display = 'none'; return; }
      const d = new Date(el.dataset.date + 'T12:00:00');
      tooltip.innerHTML = `${d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}: ${fmtMoney(exp)}`;
      tooltip.style.display = 'block';
    });
    el.addEventListener('mousemove', e => {
      tooltip.style.left = (e.clientX + 12) + 'px';
      tooltip.style.top = (e.clientY - 8) + 'px';
    });
    el.addEventListener('mouseleave', () => { tooltip.style.display = 'none'; });
  });
}

// ─── WATERFALL CHART ───────────────────────────────────────

function renderWaterfallChart(body, items) {
  const now = new Date();
  const curMonth = now.getMonth();
  const curYear = now.getFullYear();

  const months = [];
  for (let i = 5; i >= 0; i--) {
    let m = curMonth - i;
    let y = curYear;
    if (m < 0) { m += 12; y--; }
    const filtered = items.filter(x => {
      const d = new Date(x.date);
      return d.getFullYear() === y && d.getMonth() === m;
    });
    const income = filtered.filter(x => x.type === 'income').reduce((s, x) => s + Number(x.amount || 0), 0);
    const expenses = filtered.filter(x => x.type === 'expense').reduce((s, x) => s + Number(x.amount || 0), 0);
    months.push({
      label: new Date(y, m).toLocaleDateString('en-US', { month: 'short' }),
      income, expenses, net: income - expenses
    });
  }

  if (!months.some(m => m.income > 0 || m.expenses > 0)) {
    body.innerHTML = '<div class="fin-empty"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg><p>Add transactions to see your cash flow waterfall.</p></div>';
    return;
  }

  const maxAll = Math.max(...months.map(m => m.income + m.expenses), 1);
  const chartH = 240;

  body.innerHTML = `
    <div class="fin-waterfall-wrap">
      <div class="fin-wf-chart">
        ${months.map(m => {
          const ih = Math.max((m.income / maxAll) * (chartH - 40), m.income > 0 ? 8 : 0);
          const eh = Math.max((m.expenses / maxAll) * (chartH - 40), m.expenses > 0 ? 8 : 0);
          return `<div class="fin-wf-bar-group">
            ${m.income > 0 ? `<div class="fin-wf-bar income" style="height:${ih}px"><div class="fin-wf-value">${fmtMoney(m.income)}</div></div>` : ''}
            ${m.expenses > 0 ? `<div class="fin-wf-bar expense" style="height:${eh}px"><div class="fin-wf-value">${fmtMoney(m.expenses)}</div></div>` : ''}
            <div class="fin-wf-label">${m.label}${m.net >= 0 ? '<br><span style="color:var(--fin-income)">+'+fmtMoney(m.net)+'</span>' : '<br><span style="color:var(--fin-expense)">-'+fmtMoney(Math.abs(m.net))+'</span>'}</div>
          </div>`;
        }).join('')}
      </div>
    </div>`;
}

// ─── TOP MERCHANTS ─────────────────────────────────────────

function renderTopMerchants(body, items) {
  const expenses = items.filter(x => x.type === 'expense');
  const merchants = {};
  expenses.forEach(x => {
    const name = x.note && x.note.trim() ? x.note.trim() : '(Unlabeled)';
    if (!merchants[name]) merchants[name] = { total: 0, count: 0, categories: new Set() };
    merchants[name].total += Number(x.amount || 0);
    merchants[name].count++;
    merchants[name].categories.add(x.category || 'Other');
  });

  const sorted = Object.entries(merchants)
    .map(([name, data]) => ({ name, total: data.total, count: data.count, categories: [...data.categories] }))
    .sort((a, b) => b.total - a.total);

  if (!sorted.length) {
    body.innerHTML = '<div class="fin-empty"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg><p>Add notes to your expenses to track merchants.</p><span class="sub">The "Note" field in each transaction becomes the merchant name.</span></div>';
    return;
  }

  const maxTotal = sorted[0].total;
  const topN = sorted.slice(0, 20);
  const icons = ['shopping','food','fuel','store','pharmacy','film','delivery','electronics','home','clothing','books','coffee','car','travel','gaming','computer','fitness','music','nature','package'].map(function(n) {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:18px;height:18px"><circle cx="12" cy="12" r="10"/></svg>';
  });

  body.innerHTML = `
    <div class="fin-merch-wrap">
      <div class="fin-merch-header">
        <span>Top spend destinations</span>
        <span>${sorted.length} unique merchants</span>
      </div>
      <div class="fin-merch-list">
        ${topN.map((m, i) => {
          const rankCls = i === 0 ? 'top1' : i === 1 ? 'top2' : i === 2 ? 'top3' : '';
          const pct = (m.total / maxTotal) * 100;
          return `<div class="fin-merch-item">
            <div class="fin-merch-rank ${rankCls}">${i + 1}</div>
            <div class="fin-merch-icon">${icons[i % icons.length]}</div>
            <div class="fin-merch-info">
              <div class="fin-merch-name">${escapeHtml(m.name)}</div>
              <div class="fin-merch-count">${m.count} transaction${m.count !== 1 ? 's' : ''} · ${escapeHtml(m.categories[0] || 'Other')}</div>
            </div>
            <div class="fin-merch-track"><div class="fin-merch-fill" style="width:${pct}%;background:${ADV_CAT_COLORS[i % ADV_CAT_COLORS.length]}"></div></div>
            <div class="fin-merch-amount">${fmtMoney(m.total)}</div>
          </div>`;
        }).join('')}
      </div>
    </div>`;
}


// ─── INIT ──────────────────────────────────────────────────

function initFinance() {
  initAdvancedCharts();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initFinance);
} else {
  initFinance();
}
