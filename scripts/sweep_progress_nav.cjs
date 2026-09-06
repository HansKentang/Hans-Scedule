const fs = require('fs');
function load(f) {
  const raw = fs.readFileSync(f, 'utf8');
  return { eol: raw.includes('\r\n') ? '\r\n' : '\n', text: raw.replace(/\r/g, '') };
}
function save(f, o) { fs.writeFileSync(f, o.text.replace(/\n/g, o.eol)); }
function assert(c, m) { if (!c) { console.error('ASSERT FAIL: ' + m); process.exit(1); } }
function rep(o, oldS, newS, m) {
  assert(o.text.includes(oldS), m + ' :: old missing');
  assert(o.text.indexOf(oldS) === o.text.lastIndexOf(oldS), m + ' :: old not unique');
  o.text = o.text.replace(oldS, newS);
}

const BN_HEAD_OLD = '      <a href="activities.html" class="hub-bottom-nav-item" data-nav="activities">\n'
  + '        <span class="bnav-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg></span>\n';
const BN_HEAD_NEW = '      <a href="progress.html" class="hub-bottom-nav-item" data-nav="progress">\n'
  + '        <span class="bnav-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg></span>\n';
const BN_LBL_A = '        <span class="bnav-label" data-i18n="nav.activities">Activities</span>';
const BN_LBL_B = '        <span class="bnav-label">Activities</span>';
const BN_LBL_NEW = '        <span class="bnav-label">Progress</span>';

for (const f of ['schedule.html', 'finance.html', 'gallery.html', 'friends.html', 'goals.html', 'admin.html']) {
  const o = load(f);
  rep(o, BN_HEAD_OLD, BN_HEAD_NEW, f + ' bottom nav head');
  if (o.text.includes(BN_LBL_A)) rep(o, BN_LBL_A, BN_LBL_NEW, f + ' bottom nav label A');
  else rep(o, BN_LBL_B, BN_LBL_NEW, f + ' bottom nav label B');
  save(f, o);
  console.log('bottom nav ok: ' + f);
}

let g = load('goals.html');
rep(g,
  '<a href="activities.html" class="hub-snav-item"><span class="snav-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg></span><span class="snav-label">Progress</span></a>',
  '<a href="progress.html" class="hub-snav-item"><span class="snav-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg></span><span class="snav-label">Progress</span></a>',
  'goals sidebar href+icon');
{
  const anl = '<a href="analytics.html" class="hub-snav-item"><span class="snav-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg></span><span class="snav-label">Analytics</span></a>\n';
  assert(g.text.includes(anl), 'goals analytics line');
  g.text = g.text.replace(anl, '');
}
save('goals.html', g);
console.log('sidebar ok: goals.html');

let fr = load('friends.html');
{
  const anl = '<a href="analytics.html" class="hub-snav-item"><span class="snav-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg></span><span class="snav-label">Analytics</span></a>\n';
  assert(fr.text.includes(anl), 'friends analytics line');
  fr.text = fr.text.replace(anl, '');
}
save('friends.html', fr);
console.log('sidebar ok: friends.html');

let ga = load('gallery.html');
ga.text = ga.text.replace(/(\/a>)\n\n(\s*<a href="goals\.html")/, '$1\n$2');
save('gallery.html', ga);

let s = load('schedule.html');
const popA = '<a href="activities.html" class="sch-menu-item"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>Activities</a>';
const popB = '<a href="analytics.html" class="sch-menu-item"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>Analytics</a>';
const popPair = popA + '\n' + '              ' + popB;
assert(s.text.includes(popPair), 'schedule popup pair');
s.text = s.text.replace(popPair, '<a href="progress.html" class="sch-menu-item"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>Progress</a>');
save('schedule.html', s);
console.log('popup ok: schedule.html');

let sw = load('service-worker.js');
rep(sw, "  '/activities.html',\n  '/tags.html',\n  '/analytics.html',", "  '/progress.html',\n  '/tags.html',", 'sw pages');
rep(sw, "  '/js/activities.js',\n  '/js/tags.js',\n  '/js/analytics.js',", "  '/js/progress.js',\n  '/js/tags.js',", 'sw scripts');
save('service-worker.js', sw);
console.log('service worker ok');

let hv = load('js/hub-visuals.js');
const h1 = "    { label: 'Activities', desc: 'Chronological feed grouped by day with tag and date filters.', href: 'activities.html', icon: 'checklist', color: 'var(--tag-meeting-text)', bg: 'var(--tag-meeting-bg)' },";
const h2 = "    { label: 'Activities + Board', desc: 'Timeline and Kanban board merged into one page with a view toggle.', href: 'activities.html', icon: 'tag', color: 'var(--tag-study-text)', bg: 'var(--tag-study-bg)' },";
const h3 = "    { label: 'Analytics', desc: 'Charts with category distribution, daily breakdowns, and day-by-day metrics.', href: 'analytics.html', icon: 'chart', color: 'var(--tag-hobby-text)', bg: 'var(--tag-hobby-bg)' },";
assert(hv.text.includes(h1) && hv.text.includes(h2) && hv.text.includes(h3), 'hub gallery entries');
hv.text = hv.text
  .replace(h1 + '\n' + h2 + '\n' + h3, "    { label: 'Progress', desc: 'Board, timeline, log, and charts tracking what you do and how you are doing.', href: 'progress.html', icon: 'chart', color: 'var(--tag-hobby-text)', bg: 'var(--tag-hobby-bg)' },");
save('js/hub-visuals.js', hv);
console.log('hub-visuals ok');

let v = load('scripts/verify.js');
rep(v, "'index.html','schedule.html','activities.html','analytics.html','goals.html','finance.html','gallery.html','friends.html'", "'index.html','schedule.html','progress.html','goals.html','finance.html','gallery.html','friends.html'", 'verify list');
save('scripts/verify.js', v);
console.log('verify.js ok');
console.log('ALL SWEEP EDITS DONE');
