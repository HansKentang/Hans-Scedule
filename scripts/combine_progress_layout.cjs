const fs = require('fs');
let h = fs.readFileSync('progress.html', 'utf8').replace(/\r/g, '');
function assert(c, m) { if (!c) { console.error('ASSERT FAIL: ' + m); process.exit(1); } }

const chartStart = h.indexOf('        <!-- Weekly Activity Chart (stacked by tag) -->');
assert(chartStart !== -1, 'chart block start');
const chartEndMarker = '        <!-- ─── BOARD VIEW (Tags kanban) ─────────────────── -->';
const chartEnd = h.indexOf(chartEndMarker, chartStart);
assert(chartEnd !== -1, 'chart block end');
const chartBlock = h.slice(chartStart, chartEnd);
assert(chartBlock.includes('id="activityChart"'), 'chart has chart div');
assert(chartBlock.includes('id="actChartLegend"'), 'chart has legend');
h = h.slice(0, chartStart) + h.slice(chartEnd);

const tlClose = '        <!-- ─── ACTIVITY LOG ───────────────────────────── -->';
const tlIdx = h.indexOf(tlClose);
assert(tlIdx !== -1, 'log marker');
h = h.slice(0, tlIdx) + chartBlock + h.slice(tlIdx);

const toggleMarker = '        <!-- View toggle + header -->';
const tgIdx = h.indexOf(toggleMarker);
assert(tgIdx !== -1, 'toggle marker');
const actHead = '        <div class="pg-section-head hub-anim-in hub-anim-in-1">\n'
  + '          <div><h2>Activities</h2><p>Boards, week review and log</p></div>\n'
  + '        </div>\n\n';
h = h.slice(0, tgIdx) + actHead + h.slice(tgIdx);

const filterBlock = '        <div class="an-filter-bar hub-anim-in hub-anim-in-2">\n'
  + '          <div class="an-period-pills" id="analyticsPeriodPills">\n'
  + '            <button class="an-period-pill active" data-period="week" data-i18n="an.weekly">Week</button>\n'
  + '            <button class="an-period-pill" data-period="month" data-i18n="an.thisMonth">Month</button>\n'
  + '            <button class="an-period-pill" data-period="all" data-i18n="an.all">All</button>\n'
  + '          </div>\n'
  + '        </div>\n';
assert(h.includes(filterBlock), 'filter block');
const anHead = '        <div class="pg-section-head hub-anim-in hub-anim-in-2">\n'
  + '          <div><h2>Analytics</h2><p>Numbers for the selected period</p></div>\n'
  + '          <div class="an-period-pills" id="analyticsPeriodPills">\n'
  + '            <button class="an-period-pill active" data-period="week" data-i18n="an.weekly">Week</button>\n'
  + '            <button class="an-period-pill" data-period="month" data-i18n="an.thisMonth">Month</button>\n'
  + '            <button class="an-period-pill" data-period="all" data-i18n="an.all">All</button>\n'
  + '          </div>\n'
  + '        </div>\n';
h = h.replace(filterBlock, anHead);

const gridStart = h.indexOf('        <!-- Charts -->');
assert(gridStart !== -1, 'canvas grid start');
const gridEndMarker = '        <!-- Weekly Trend (full-width) -->';
const gridEnd = h.indexOf(gridEndMarker, gridStart);
assert(gridEnd !== -1, 'canvas grid end');
const gridBlock = h.slice(gridStart, gridEnd);
assert(gridBlock.includes('id="pieChart"') && gridBlock.includes('id="barChart"'), 'grid has canvases');
h = h.slice(0, gridStart) + h.slice(gridEnd);

const cssAnchor = '    /* Empty state */';
assert(h.includes(cssAnchor), 'css anchor');
const pgCss = '    .pg-section-head {\n'
  + '      display: flex; align-items: flex-end; justify-content: space-between;\n'
  + '      gap: var(--space-3); margin: var(--space-6) 0 var(--space-3);\n'
  + '      padding-top: var(--space-4); border-top: 1px solid var(--border-subtle);\n'
  + '    }\n'
  + '    .hub-content > .pg-section-head:first-of-type { border-top: none; padding-top: 0; margin-top: 0; }\n'
  + '    .pg-section-head h2 { font-family: var(--font-serif); font-size: 1.35rem; font-weight: 500; letter-spacing: -0.01em; margin: 0; }\n'
  + '    .pg-section-head p { font-size: 0.68rem; color: var(--text-tertiary); margin: 2px 0 0; }\n'
  + '    .pg-section-head .an-period-pills { flex-shrink: 0; }\n'
  + '    @media (max-width: 640px) {\n'
  + '      .pg-section-head { margin: var(--space-4) 0 var(--space-2); }\n'
  + '      .pg-section-head h2 { font-size: 1.1rem; }\n'
  + '    }\n\n';
h = h.replace(cssAnchor, pgCss + cssAnchor);

assert(h.indexOf('id="pieChart"') === -1, 'pie canvas gone');
assert(h.indexOf('id="barChart"') === -1, 'bar canvas gone');
assert(h.indexOf('id="analyticsPeriodPills"') !== -1 && h.indexOf('id="analyticsPeriodPills"') === h.lastIndexOf('id="analyticsPeriodPills"'), 'pills exactly once');
assert(h.indexOf('pg-section-head') !== -1, 'headers present');
const order = ['>Activities</h2>', 'boardView', 'timelineView', 'activityChartWrap', 'actLogSection', '>Analytics</h2>', 'analyticsPeriodPills', 'statTasks', 'compRing', 'trendChart', 'sleepChart', 'analyticsTableBody'];
let last = -1;
for (const k of order) {
  const p = h.indexOf(k);
  assert(p > last, 'order at ' + k);
  last = p;
}
fs.writeFileSync('progress.html', h.replace(/\n/g, '\r\n'));
console.log('layout combined OK');
