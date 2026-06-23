const fs = require('fs');
const jsPath = 'Hans Scedule/schedule.js';
let js = fs.readFileSync(jsPath, 'utf8');

// Fix 1: Fix chip mousedown in renderSchTemplates 
// - Add .sch-pm-dropdown-pill class to fake pill
// - Remove chip.click() call (use data attribute flag instead)
// - Add dragstart prevention
const chipDragStart = `    // Make chip-row buttons draggable to calendar
  container.querySelectorAll('.sch-pm-chip').forEach(chip => {
    // Prevent native HTML5 drag from interfering
    chip.addEventListener('dragstart', (e) => e.preventDefault());
    
    chip.addEventListener('mousedown', (e) => {
      if (e.button !== 0 || e.target.closest('.sch-pm-chip') !== chip) return;
      const startX = e.clientX, startY = e.clientY;
      let moved = false;
      const onMove = (ev) => {
        if (Math.abs(ev.clientX - startX) > 5 || Math.abs(ev.clientY - startY) > 5) {
          moved = true;
          chip.dataset._dragMoved = 'true';
          document.removeEventListener('mousemove', onMove);
          document.removeEventListener('mouseup', onUp);
          const tag = chip.dataset.pmTag;
          const fakePill = document.createElement('div');
          fakePill.className = 'sch-pm-dropdown-pill';
          fakePill.dataset.tag = tag;
          fakePill.dataset.duration = '60';
          fakePill.dataset.templateTitle = TAG_LABELS[tag] || tag;
          startDrag(ev, fakePill);
        }
      };
      const onUp = () => {
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
      };
      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
    });
    
    // Check for drag in click handler via data attribute
    const origClick = chip._listeners?.click?.[0];
    if (!chip.dataset._dragPatched) {
      chip.dataset._dragPatched = 'true';
    }
  });
  
  // Patch chip click handlers to check for drag
  // (The click listeners are added above, so we need to wrap them)
  // Instead, we'll use event delegation or just use the _dragMoved flag approach
  // The chip click listener (from the first loop) will fire on native click.
  // If _dragMoved is 'true', the drag happened and we skip the click.
  // Since the first loop registers click listeners BEFORE this code runs,
  // we need to adjust the click listener itself.
  
  // Actually, the simplest approach: replace the click handler addition
  // to check _dragMoved at the start. Let me find and replace that section.
`;

// Replace the entire chip drag section
const oldChipDrag = js.match(/\/\/ Make chip-row buttons draggable to calendar[\s\S]*?\n  \}\);/);
if (oldChipDrag) {
  // Find the actual code block - it may differ from what I wrote above
  const chipMousedownStart = js.indexOf("// Make chip-row buttons draggable to calendar");
  if (chipMousedownStart >= 0) {
    // Find the end of the forEach block - look for the closing }); of the forEach
    let pos = chipMousedownStart;
    // Find the first forEach line
    const forEachStart = js.indexOf("container.querySelectorAll('.sch-pm-chip').forEach(chip => {", chipMousedownStart);
    if (forEachStart >= 0) {
      // Find matching closing brace - need to count
      let depth = 1;
      let p = forEachStart + "container.querySelectorAll('.sch-pm-chip').forEach(chip => {".length;
      while (depth > 0 && p < js.length) {
        if (js[p] === '{') depth++;
        else if (js[p] === '}') depth--;
        p++;
      }
      // Now p is past the closing brace of forEach, should be followed by );
      // The forEach block ends with }); so find the ); after the closing brace
      const endOfBlock = p + 2; // past });
      
      const newBlock = `  // Make chip-row buttons draggable to calendar
  container.querySelectorAll('.sch-pm-chip').forEach(chip => {
    // Prevent native HTML5 drag from interfering
    chip.addEventListener('dragstart', (e) => e.preventDefault());
    
    chip.addEventListener('mousedown', (e) => {
      if (e.button !== 0 || e.target.closest('.sch-pm-chip') !== chip) return;
      const startX = e.clientX, startY = e.clientY;
      const onMove = (ev) => {
        if (Math.abs(ev.clientX - startX) > 5 || Math.abs(ev.clientY - startY) > 5) {
          chip.dataset._dragMoved = 'true';
          document.removeEventListener('mousemove', onMove);
          document.removeEventListener('mouseup', onUp);
          const tag = chip.dataset.pmTag;
          const fakePill = document.createElement('div');
          fakePill.className = 'sch-pm-dropdown-pill';
          fakePill.dataset.tag = tag;
          fakePill.dataset.duration = '60';
          fakePill.dataset.templateTitle = TAG_LABELS[tag] || tag;
          startDrag(ev, fakePill);
        }
      };
      const onUp = () => {
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
      };
      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
    });
  });
  
  // Patch the chip click handler to skip if a drag just happened
  // We can't easily modify the already-registered handler, so use event delegation
  container.addEventListener('click', (e) => {
    const chip = e.target.closest('.sch-pm-chip');
    if (chip && chip.dataset._dragMoved === 'true') {
      e.stopImmediatePropagation();
      delete chip.dataset._dragMoved;
    }
  });`;
      
      js = js.substring(0, chipMousedownStart) + newBlock + js.substring(endOfBlock);
      console.log('✓ Fixed chip drag handler');
    }
  }
}

// Fix 2: Add subcategory refresh to add template tag pills in bindEvents
// Find the add template tag pills click handler in bindEvents
const tagPillsStart = js.indexOf("// Template add popup - tag pills");
if (tagPillsStart >= 0) {
  const tagPillsCode = js.substring(tagPillsStart, tagPillsStart + 400);
  const oldPillHandler = tagPillsCode.match(/document\.querySelectorAll\('#tplAddTagPills \.tf-tag'\)\.forEach\(pill => \{[\s\S]*?\n  \}\);/);
  
  if (oldPillHandler) {
    const newPillHandler = `document.querySelectorAll('#tplAddTagPills .tf-tag').forEach(pill => {
    pill.addEventListener('click', () => {
      document.querySelectorAll('#tplAddTagPills .tf-tag').forEach(b => b.classList.remove('active'));
      pill.classList.add('active');
      // Refresh subcategory dropdown for selected tag
      const subcatEl = document.getElementById('tplAddSubcategory');
      if (subcatEl) {
        const tag = pill.dataset.tag;
        const subs = typeof SUBCATEGORIES !== 'undefined' ? (SUBCATEGORIES[tag] || []) : [];
        subcatEl.innerHTML = '<option value="">None</option>' + subs.map(s => '<option value="' + s + '">' + s + '</option>').join('');
        subcatEl.value = '';
      }
    });
  });`;
    js = js.substring(0, tagPillsStart) + newPillHandler + js.substring(tagPillsStart + oldPillHandler[0].length);
    console.log('✓ Fixed add template tag pills to refresh subcategory dropdown');
  }
}

fs.writeFileSync(jsPath, js, 'utf8');
console.log('✓ Fixed');
