const fs = require('fs');
const path = 'Hans Scedule/shared.js';
let content = fs.readFileSync(path, 'utf8');

// Update getDefaultTemplates with subcategory field
const funcRegex = /function getDefaultTemplates\(\) \{\s+return \[\s+[^\]+]+\];\s+\}/;
const match = content.match(funcRegex);
if (match) {
  const newFunc = `function getDefaultTemplates() {
  return [
    { id: 'tpl-dw', name: 'Deep Work Session', title: 'Deep Work: Focus session', tag: 'deep-work', subcategory: 'Coding', duration: 120, priority: 2 },
    { id: 'tpl-mtg', name: 'Team Meeting', title: 'Team standup', tag: 'meeting', subcategory: 'Team Standup', duration: 30, priority: 2 },
    { id: 'tpl-ex', name: 'Workout', title: 'Morning workout', tag: 'exercise', subcategory: 'Full Body', duration: 60, priority: 3 },
    { id: 'tpl-ex-chest', name: 'Chest Day', title: 'Chest workout', tag: 'exercise', subcategory: 'Chest Day', duration: 60, priority: 3 },
    { id: 'tpl-ex-back', name: 'Back Day', title: 'Back workout', tag: 'exercise', subcategory: 'Back Day', duration: 60, priority: 3 },
    { id: 'tpl-ex-leg', name: 'Leg Day', title: 'Leg workout', tag: 'exercise', subcategory: 'Leg Day', duration: 60, priority: 3 },
    { id: 'tpl-ex-cardio', name: 'Cardio', title: 'Cardio session', tag: 'exercise', subcategory: 'Cardio', duration: 45, priority: 3 },
    { id: 'tpl-ex-yoga', name: 'Yoga Flow', title: 'Yoga & stretching', tag: 'exercise', subcategory: 'Yoga', duration: 45, priority: 3 },
    { id: 'tpl-st', name: 'Study Session', title: 'Study session', tag: 'study', subcategory: 'Reading', duration: 60, priority: 3 },
    { id: 'tpl-hb', name: 'Hobby Time', title: 'Personal project', tag: 'hobby', subcategory: 'Music', duration: 90, priority: 4 },
  ];
}`;
  content = content.replace(match[0], newFunc);
  console.log('✓ Updated getDefaultTemplates with subcategories');
} else {
  console.log('✗ Could not match getDefaultTemplates');
}

fs.writeFileSync(path, content, 'utf8');
console.log('✓ File saved');
