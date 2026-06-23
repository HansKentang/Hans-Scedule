const fs = require('fs');
const js = fs.readFileSync('Hans Scedule/schedule.js', 'utf8');

// Find startEditTemplate function
const fnIdx = js.indexOf('function startEditTemplate');
console.log('startEditTemplate at:', fnIdx);

// Find save callback
const saveIdx = js.indexOf('const save', fnIdx);
console.log('const save at:', saveIdx);
if (saveIdx > 0) {
  console.log('--- Save handler (first 600 chars) ---');
  console.log(js.substring(saveIdx, saveIdx + 600));
}

// Find tag click handler
const tagClickIdx = js.indexOf("tplEditTagPills", fnIdx);
console.log('\n--- tplEditTagPills at:', tagClickIdx);
if (tagClickIdx > 0) {
  console.log('--- Tag click handler context ---');
  console.log(js.substring(tagClickIdx - 50, tagClickIdx + 300));
}
