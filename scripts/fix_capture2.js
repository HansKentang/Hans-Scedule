const fs = require('fs');
const path = 'Hans Scedule/schedule.js';
let js = fs.readFileSync(path, 'utf8');
// Replace the bubble-phase handler with a capture-phase one
const target = "  container.addEventListener('click', (e) => {\n    const chip = e.target.closest('.sch-pm-chip');\n    if (chip && chip.dataset._dragMoved === 'true') {\n      e.stopImmediatePropagation();\n      delete chip.dataset._dragMoved;\n    }\n  });";
const replacement = "  container.addEventListener('click', (e) => {\n    const chip = e.target.closest('.sch-pm-chip');\n    if (chip && chip.dataset._dragMoved === 'true') {\n      e.stopImmediatePropagation();\n      delete chip.dataset._dragMoved;\n    }\n  }, { capture: true });";
if (js.includes(target)) {
  js = js.replace(target, replacement);
  fs.writeFileSync(path, js, 'utf8');
  console.log('✓ Fixed: capture phase added');
} else {
  console.log('✗ Target not found');
}
