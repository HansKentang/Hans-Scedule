const fs = require('fs');
const js = fs.readFileSync('Hans Scedule/schedule.js', 'utf8');

// Find the tag click handler in startEditTemplate
const fnIdx = js.indexOf('function startEditTemplate');

// Find the tag event listener block
const idx = js.indexOf("tplEditTagPills .tf-tag').forEach(p =>", fnIdx);
if (idx > 0) {
  console.log('=== Tag click handler ===');
  console.log(js.substring(idx, idx + 250));
}

// Find the save handler
const saveIdx = js.indexOf('const save = ()', fnIdx);
if (saveIdx > 0) {
  const afterTag = js.indexOf('tpl.tag', saveIdx);
  const afterDur = js.indexOf('tpl.duration', saveIdx);
  console.log('\n=== Save handler (around tpl.tag) ===');
  console.log(js.substring(saveIdx, afterDur + 200));
}
