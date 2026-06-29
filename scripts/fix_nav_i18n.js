const fs = require('fs');
const files = ['index.html','schedule.html','activities.html','analytics.html','goals.html','finance.html','gallery.html','friends.html'];
const fixMap = {
  'hub.viewSchedule':'nav.schedule',
  'hub.viewActivities':'nav.activities',
  'hub.viewAnalytics':'nav.analytics',
  'hub.viewGoals':'nav.goals',
  'sch.title':'nav.schedule',
  'acts.title':'nav.activities',
  'an.title':'nav.analytics',
  'gl.title':'nav.goals',
  'fin.title':'nav.finance',
  'gal.title':'nav.gallery',
  'fr.title':'nav.friends'
};
for (let f of files) {
  let html = fs.readFileSync(f, 'utf8');
  for (let oldKey in fixMap) {
    let newKey = fixMap[oldKey];
    html = html.split('data-i18n="' + oldKey + '"').join('data-i18n="' + newKey + '"');
  }
  fs.writeFileSync(f, html);
  console.log(f + ': fixed');
}
