const fs = require('fs');
let content = fs.readFileSync('shared.js', 'utf-8');

// The current loadImages incorrectly has applyImages() BEFORE state init
// Current content:
// function loadImages() {
//   // After restoring, re-apply images...
//   try { applyImages(); } catch(e) { }
//   state.images = { ...DEFAULT_IMAGES };
//   try { restoreDirectImageKeys(); } catch(e) { }
// }
// 
// Should be:
// function loadImages() {
//   state.images = { ...DEFAULT_IMAGES };
//   try { restoreDirectImageKeys(); } catch(e) { }
//   // After restoring...
//   try { applyImages(); } catch(e) { }
// }

// Find the buggy section
var badPattern = 'function loadImages() {\n  // After restoring, re-apply images to the DOM in case DOM is ready\n  try { applyImages(); } catch(e) { /* DOM may not be ready yet */ }\n  state.images = { ...DEFAULT_IMAGES };\n  try { restoreDirectImageKeys(); } catch(e) { /* skip */ }\n}';

var goodPattern = 'function loadImages() {\n  state.images = { ...DEFAULT_IMAGES };\n  try { restoreDirectImageKeys(); } catch(e) { /* skip */ }\n  // After restoring, re-apply images to the DOM in case DOM is ready\n  try { applyImages(); } catch(e) { /* DOM may not be ready yet */ }\n}';

if (content.includes(badPattern)) {
  content = content.replace(badPattern, goodPattern);
  fs.writeFileSync('shared.js', content, 'utf-8');
  console.log('Fixed loadImages ordering');
} else if (content.includes(goodPattern)) {
  console.log('loadImages ordering is already correct');
} else {
  console.log('Could not find the expected patterns. Checking actual content...');
  var loadIdx = content.indexOf('function loadImages()');
  if (loadIdx >= 0) {
    console.log(content.slice(loadIdx, loadIdx + 300));
  }
}
