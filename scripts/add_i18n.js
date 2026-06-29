const fs = require('fs');
const files = ['index.html','schedule.html','activities.html','analytics.html','goals.html','finance.html','gallery.html','friends.html'];

const textMap = {
  'index.html': {
    'Edit':'hub.edit','Add':'hub.add','Guide':'hub.guide',
    'Goals &amp; Priorities':'hub.sectionGoals','Sleep':'hub.sectionSleep','Views':'hub.sectionViews',
    'Overview':'sleep.overview','History':'sleep.history','Insights':'sleep.insights','Targets':'sleep.targets',
    'Score':'sleep.score','last night':'sleep.lastNight','7-Day Avg':'sleep.avg7','Avg Quality':'sleep.avgQuality','Consistency':'sleep.consistency',
    'Target Bedtime':'sleep.targetBedtime','Target Wake Time':'sleep.targetWake','Target Duration':'sleep.targetDuration',
    'Save Targets':'sleep.saveTargets','Save Routine':'sleep.saveRoutine',
    '+ Log Sleep':'sleep.log','Bedtime Routine':'sleep.routine',
    'Screen off 30min before':'sleep.routineItem1','Read / unwind':'sleep.routineItem2','Meditate / breathe':'sleep.routineItem3','Journal / reflect':'sleep.routineItem4','No caffeine after 5pm':'sleep.routineItem5','Drink water':'sleep.routineItem6','Darken the room':'sleep.routineItem7','Light stretch':'sleep.routineItem8',
    'Hav\u00ebn Schedule v1.0':'hub.footer',
    'Schedule':'hub.viewSchedule','Activities':'hub.viewActivities','Tags Board':'hub.viewTags','Analytics':'hub.viewAnalytics','Goals':'hub.viewGoals',
    'Export':'hub.export','Import':'hub.import','Focus':'hub.focus'
  },
  'schedule.html': {
    'Schedule':'sch.title','Today':'sch.today','Week':'sch.week',
    'No key':'sch.apiNoKey','tasks':'sch.tasks','School':'sch.school',
    'Focus':'sch.focus','AI':'sch.ai','Screenshot':'sch.ss','Copy Week':'sch.copyWeek',
    'Category name':'sch.catName','Pick a colour':'sch.pickColor','Cancel':'sch.cancel','Add':'sch.add','Add category':'sch.addCategory'
  },
  'activities.html': {
    'Activities':'acts.title','Board':'acts.board','Timeline':'acts.timeline',
    'This Week':'acts.week','Completed':'acts.completed','Activity Log':'acts.log'
  },
  'analytics.html': {
    'Analytics':'an.title','All':'an.all','Tasks':'an.tasks','Time':'an.time','Deep Work':'an.deep','Study':'an.study',
    'Completion':'an.completion','Streak':'an.streak','Daily Breakdown':'an.daily',
    'Distribution':'an.distribution','Weekly Trend':'an.trend','Sleep':'an.sleep',
    'Duration':'an.duration','Quality':'an.quality','Day-by-Day':'an.table',
    'Active':'an.active','This Week':'an.weekly','This Month':'an.thisMonth',
    'Week':'an.weekly','Month':'an.thisMonth'
  },
  'goals.html': {
    'Goals':'gl.title','Add Goal':'gl.addGoal','Vision Board':'gl.vision','Monthly Manifesto':'gl.manifesto','Related Tasks':'gl.related'
  },
  'finance.html': {
    'Finance':'fin.title','Income':'fin.income','Expense':'fin.expense',
    'Piggy Bank':'fin.piggy','Wallet':'fin.wallet','Amount':'fin.amount',
    'Category':'fin.category','Date':'fin.date','Note':'fin.note','Type':'fin.type',
    'Search':'fin.search','Export CSV':'fin.exportCSV',
    '7D':'fin.period7d','30D':'fin.period30d','Month':'fin.periodMonth','All':'fin.periodAll',
    'Spending Intelligence':'fin.intelligence','Treemap':'fin.treemap','MoM':'fin.mom','Heatmap':'fin.heatmap','Flow':'fin.flow','Merchants':'fin.merchants'
  },
  'gallery.html': {
    'Gallery':'gal.title','+ Add Image':'gal.add','Reset':'gal.reset','Vision Board':'gal.vision'
  },
  'friends.html': {
    'Friends':'fr.title','Add Friend':'fr.add','Friend Code':'fr.code',
    'Your Code':'fr.yourCode','Connections':'fr.connections','Pending':'fr.pending','Accepted':'fr.accepted',
    'Search':'fr.search','Send':'fr.send','Message':'fr.message','Share Code':'fr.share'
  }
};

function addDataI18n(html, map) {
  const keys = Object.keys(map).sort((a, b) => b.replace(/[<>&]/g,'').length - a.replace(/[<>&]/g,'').length);
  let result = html;
  for (const text of keys) {
    if (!text) continue;
    const key = map[text];
    // Match as text content between > and <, not inside existing data-i18n
    const escaped = text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    // Match elements: <tagname ...>TEXT</tagname> - only for visible elements
    const re = new RegExp('(<(?:span|div|h[1-6]|button|label|p|a|li|td|th|hgroup)(?:[^>]*?)>\\s*)(' + escaped + ')(\\s*</)', 'g');
    result = result.replace(re, (match, open, content, close) => {
      if (open.indexOf('data-i18n') >= 0) return match;
      if (open.indexOf('data-image-id') >= 0) return match;
      // Avoid nested SVGs and inline event handlers
      const newOpen = open.replace(/>\s*$/, ' data-i18n="' + key + '">');
      return newOpen + content + close;
    });
  }
  return result;
}

for (const f of files) {
  let html = fs.readFileSync(f, 'utf8');
  const map = textMap[f] || {};
  let result = addDataI18n(html, map);
  fs.writeFileSync(f, result, 'utf8');
  console.log(f + ': processed ' + Object.keys(map).length + ' keys');
}
