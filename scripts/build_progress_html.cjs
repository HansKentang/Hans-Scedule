const fs = require('fs');
let a = fs.readFileSync('activities.html', 'utf8').replace(/\r/g, '');
const an = fs.readFileSync('analytics.html', 'utf8').replace(/\r/g, '');
function assert(c, m) { if (!c) { console.error('ASSERT FAIL: ' + m); process.exit(1); } }
function once(hay, needle, m) {
  const i = hay.indexOf(needle);
  assert(i !== -1, (m || needle) + ' missing');
  assert(hay.indexOf(needle, i + 1) === -1, (m || needle) + ' not unique');
  return i;
}

a = a.replace('<title>Havën Schedule — Activities</title>', '<title>Havën Schedule — Progress</title>');

const anStyleOpen = an.indexOf('<style>');
assert(anStyleOpen !== -1, 'analytics style open');
const anStyleClose = an.indexOf('</style>', anStyleOpen);
assert(anStyleClose !== -1, 'analytics style close');
const anStyle = an.slice(anStyleOpen, anStyleClose + '</style>'.length);
assert(anStyle.includes('.an-kpi-row'), 'analytics style is the right block');
const headClose = once(a, '</head>', 'activities head close');
a = a.slice(0, headClose) + '\n' + anStyle + '\n' + a.slice(headClose);

const actAnchor = '<a href="activities.html" class="hub-snav-item active">';
const anlAnchor = '<a href="analytics.html" class="hub-snav-item">';
const ai = once(a, actAnchor, 'sidebar activities anchor');
const ni = a.indexOf(anlAnchor, ai);
assert(ni !== -1, 'sidebar analytics anchor after activities');
const anlClose = a.indexOf('</a>', ni);
assert(anlClose !== -1, 'sidebar analytics anchor close');
const progressAnchor = '<a href="progress.html" class="hub-snav-item active">\n' +
  '            <span class="snav-icon">\n' +
  '              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">\n' +
  '                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>\n' +
  '              </svg>\n' +
  '            </span>\n' +
  '            <span class="snav-label">Progress</span>\n' +
  '          </a>';
a = a.slice(0, ai) + progressAnchor + a.slice(anlClose + '</a>'.length);

const heroH1 = 'data-i18n="nav.activities">Activities</h1>';
const hi = once(a, heroH1, 'hero h1');
a = a.replace(heroH1, '>Progress</h1>');

const fabMarker = '    <!-- Access Hub (FAB) -->';
const fi = once(a, fabMarker, 'FAB marker');
const secStart = an.indexOf('<!-- Period Filter -->');
assert(secStart !== -1, 'analytics sections start');
const secEnd = an.indexOf('<!-- Minimal footer -->', secStart);
assert(secEnd !== -1, 'analytics sections end');
const anSections = an.slice(secStart, secEnd).replace(/[ \t]+\n/g, '\n').replace(/\n+$/, '\n');
assert(anSections.includes('analyticsPeriodPills'), 'sections have period pills');
assert(anSections.includes('analyticsTableBody'), 'sections have table');
a = a.slice(0, fi) + anSections + '\n' + a.slice(fi);

const bnavAnchor = '<a href="activities.html" class="hub-bottom-nav-item active" data-nav="activities" aria-current="page">';
const bi = once(a, bnavAnchor, 'bottom nav activities anchor');
const bnavClose = a.indexOf('</a>', bi);
assert(bnavClose !== -1, 'bottom nav anchor close');
const progressBnav = '<a href="progress.html" class="hub-bottom-nav-item active" data-nav="progress" aria-current="page">\n' +
  '        <span class="bnav-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg></span>\n' +
  '        <span class="bnav-label">Progress</span>\n' +
  '      </a>';
a = a.slice(0, bi) + progressBnav + a.slice(bnavClose + '</a>'.length);

const scriptTag = '<script src="js/activities.js"></script>';
assert(a.includes(scriptTag), 'activities script tag');
a = a.replace(scriptTag, '<script src="js/progress.js"></script>');

assert(a.indexOf('activities.html') === -1, 'no leftover activities.html refs');
assert(a.indexOf('analytics.html') === -1, 'no leftover analytics.html refs');
assert(a.indexOf('js/activities.js') === -1, 'no leftover activities.js ref');
fs.writeFileSync('progress.html', a.replace(/\n/g, '\r\n'));
console.log('progress.html written:', fs.statSync('progress.html').size, 'bytes');
