const fs = require('fs');
const A = 'js/activities.js', B = 'js/analytics.js';
let a = fs.readFileSync(A, 'utf8').replace(/\r/g, '');
let b = fs.readFileSync(B, 'utf8').replace(/\r/g, '');
function assert(c, m) { if (!c) { console.error('ASSERT FAIL: ' + m); process.exit(1); } }

a = a.replace('Haven Schedule — Activities Page', 'Haven Schedule — Progress Page');
a = a.replace('Kanban Board + Timeline + Activity Log', 'Board + Timeline + Log + Analytics');
const aPageAfter = "pageAfterTaskSave = () => { renderActivities(); };\npageAfterImport = () => { renderActivities(); };";
assert(a.includes(aPageAfter), 'activities pageAfter block');
a = a.replace(aPageAfter, "pageAfterTaskSave = () => { renderActivities(); renderAnalytics(); };\npageAfterImport = () => { renderActivities(); renderAnalytics(); };");

const aInit = "function init() {\n  loadState();\n  applyTheme();\n  loadCompletionLog();\n  document.querySelectorAll('img[data-image-id]').forEach(el => { el.src = getImage(el.dataset.imageId) || ''; });\n  weekOffset = 0;\n  renderActivities();\n  setupPage();\n  document.getElementById('exportBtn')?.addEventListener('click', exportData);\n  document.getElementById('importBtn')?.addEventListener('click', () => { document.getElementById('importFileInput')?.click(); });\n}";
assert(a.includes(aInit), 'activities init block');
const mergedInit = "function init() {\n  loadState();\n  applyTheme();\n  loadCompletionLog();\n  document.querySelectorAll('img[data-image-id]').forEach(el => { el.src = getImage(el.dataset.imageId) || ''; });\n  weekOffset = 0;\n  renderActivities();\n  renderAnalytics();\n  setupPage();\n  document.getElementById('exportBtn')?.addEventListener('click', exportData);\n  document.getElementById('importBtn')?.addEventListener('click', () => { document.getElementById('importFileInput')?.click(); });\n  document.getElementById('analyticsPeriodPills')?.addEventListener('click', (e) => {\n    const pill = e.target.closest('.an-period-pill');\n    if (!pill) return;\n    document.querySelectorAll('.an-period-pill').forEach(p => p.classList.remove('active'));\n    pill.classList.add('active');\n    currentPeriod = pill.dataset.period;\n    renderAnalytics();\n  });\n  window.addEventListener('resize', renderAnalytics);\n  const _analyticsThemeObserver = new MutationObserver(() => { renderAnalytics(); });\n  _analyticsThemeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });\n}";
a = a.replace(aInit, mergedInit);

const bLines = b.split('\n');
assert(bLines.slice(0, 4).join('\n').includes('Analytics Dashboard'), 'analytics header');
assert(bLines[10] === 'pageAfterTaskSave = () => { renderAnalytics(); };', 'analytics pageAfterTaskSave got: ' + bLines[10]);
assert(bLines[11] === 'pageAfterImport = () => { renderAnalytics(); };', 'analytics pageAfterImport');
const fmtIdx = bLines.findIndex(l => l === 'function formatHrs(mins) {');
assert(fmtIdx > 0, 'formatHrs found');
assert(bLines[fmtIdx + 6] === '}', 'formatHrs end, got: ' + bLines[fmtIdx + 6]);
const setupIdx = bLines.findIndex(l => l.indexOf('// ─── SETUP') === 0);
assert(setupIdx > 0, 'analytics SETUP header');
const keep = bLines.filter((_, i) =>
  i >= 4 && i !== 10 && i !== 11 &&
  !(i >= fmtIdx && i <= fmtIdx + 6) &&
  !(i >= setupIdx)
).join('\n');
assert(keep.includes('function renderAnalytics()'), 'keeps renderAnalytics');
assert(keep.includes('const sleepCanvas'), 'keeps sleepCanvas');
assert(!keep.includes('function setupPage'), 'drops setupPage');
assert(!keep.includes('function init('), 'drops init');
assert(!keep.includes('DOMContentLoaded'), 'drops hook');
assert(keep.indexOf('function formatHrs') === -1, 'drops formatHrs definition');
fs.writeFileSync('js/progress.js', (a + '\n\n' + keep + '\n').replace(/\n/g, '\r\n'));
console.log('progress.js written:', fs.statSync('js/progress.js').size, 'bytes');
