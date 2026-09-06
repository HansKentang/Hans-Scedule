const fs = require('fs');
const h = fs.readFileSync('progress.html', 'utf8');
const ids = {};
const dups = [];
const re = /\sid="([^"]+)"/g;
let m;
while ((m = re.exec(h)) !== null) {
  ids[m[1]] = (ids[m[1]] || 0) + 1;
  if (ids[m[1]] === 2) dups.push(m[1]);
}
console.log(dups.length ? ('DUP IDS: ' + dups.join(',')) : 'no duplicate ids');
const need = ['tagsBoardInner','boardView','timelineView','actTimeline','actLogList','activityChart','actChartLegend','actWeekLabel','actChartTotal','actWeekPrev','actWeekNext','boardTaskCount','tagsSummaryTotal','analyticsPeriodPills','statTasks','statTime','statDeep','statStudy','compRing','compRingPct','completionFill','compDone','compTotal','compPct','completionPeriod','streakDays','streakCurrent','streakBest','streakActive','trendChart','sleepAnalyticsDuration','sleepChart','sleepAnalyticsQuality','sleepQualityFill','analyticsTableBody','detailPeriodLabel','actHeroCount','accessHub','progress.js'];
const missing = need.filter(id => h.indexOf(id) === -1);
console.log(missing.length ? ('MISSING: ' + missing.join(',')) : 'all required ids present');
const order = ['actLogSection', 'analyticsPeriodPills', 'statTasks', 'compRing', 'trendChart', 'sleepChart', 'analyticsTableBody', 'accessHub'];
let lastPos = -1, ok = true;
for (const id of order) {
  const p = h.indexOf(id);
  if (p <= lastPos) { ok = false; console.log('ORDER PROBLEM at ' + id); }
  lastPos = p;
}
console.log(ok ? 'section order OK' : 'section order BAD');
const scripts = [];
const sre = /<script>([\s\S]*?)<\/script>/g;
let sm;
while ((sm = sre.exec(h)) !== null) { if (sm[1].trim()) scripts.push(sm[1]); }
let bad = 0;
scripts.forEach((s, i) => { try { new Function(s); } catch (e) { bad++; console.log('inline script ' + i + ' ERR: ' + e.message); } });
console.log(scripts.length + ' inline scripts, ' + (bad ? bad + ' BAD' : 'all OK'));
