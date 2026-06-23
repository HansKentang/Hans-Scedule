const fs = require('fs');
const js = fs.readFileSync('Hans Scedule/schedule.js', 'utf8');

const fnIdx = js.indexOf('function startEditTemplate');
// Find all addEventListener calls after the function start
let pos = fnIdx;
let count = 0;
while (count < 15) {
  const next = js.indexOf('addEventListener', pos);
  if (next < 0 || next > fnIdx + 5000) break;
  console.log('addEventListener at', next, ':', js.substring(Math.max(0, next-40), next + 60));
  pos = next + 1;
  count++;
}
