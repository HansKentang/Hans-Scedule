const fs = require('fs');
const path = require('path');

// ─── FIX CSS ────────────────────────────────────────────────
let css = fs.readFileSync('style.css', 'utf8');

// 1. Replace .bento-bubble.dragging rule
const oldDragCSS = '.bento-bubble.dragging { opacity:0.92; z-index:1000; transform:translateY(-4px); box-shadow:0 16px 48px rgba(0,0,0,0.18); transition:opacity 0.2s, box-shadow 0.2s, transform 0.15s, left 0s, top 0s; cursor:grabbing; will-change:left,top,transform; }';
const newDragCSS = `.bento-bubble.dragging {
  opacity:0.95;
  z-index:1000;
  transform:scale(1.02) rotate(-0.5deg);
  box-shadow:
    0 20px 60px rgba(0,0,0,0.30),
    0 8px 24px rgba(0,0,0,0.15),
    0 0 0 1px rgba(255,255,255,0.06);
  transition:opacity 0.15s ease, box-shadow 0.2s ease, transform 0.15s cubic-bezier(0.34, 1.56, 0.64, 1), left 0s, top 0s;
  cursor:grabbing;
  will-change:transform, left, top;
  -webkit-backdrop-filter:blur(4px);
  backdrop-filter:blur(4px);
  border-color:var(--accent);
  border-radius:var(--radius-lg);
  pointer-events:none;
  user-select:none;
}`;

if (css.includes(oldDragCSS)) {
  css = css.replace(oldDragCSS, newDragCSS);
  console.log('✓ Updated .bento-bubble.dragging CSS');
} else {
  console.log('✗ Could not find .bento-bubble.dragging CSS pattern');
  // Try to find any variant
  const idx = css.indexOf('.bento-bubble.dragging');
  if (idx >= 0) {
    console.log('  Found at position', idx, '— checking nearby text');
    console.log('  Context:', css.substring(idx, idx + 300));
  }
}

// 2. Add drop-bounce animation (insert before .bento-bubble.drag-over)
const dropAnimCSS = `
/* ─── BUBBLE DRAG DROP BOUNCE ──────────────────── */
@keyframes bubbleDropBounce {
  0% { transform:scale(1.02) rotate(-0.5deg); }
  25% { transform:scale(1.04); box-shadow:0 20px 60px rgba(0,0,0,0.25); }
  50% { transform:scale(0.97); }
  75% { transform:scale(1.01); }
  100% { transform:scale(1) rotate(0deg); }
}
.bento-bubble.drop-bounce {
  animation:bubbleDropBounce 0.45s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
  z-index:100;
}

/* ─── BUBBLE DRAG TOOLTIP ─────────────────────── */
.bento-drag-tooltip {
  position:fixed;
  z-index:calc(var(--z-dragging) + 5);
  pointer-events:none;
  background:var(--text-primary);
  color:var(--bg-primary);
  font-size:0.7rem;
  font-weight:600;
  padding:4px 10px;
  border-radius:var(--radius-md);
  box-shadow:var(--shadow-lg);
  font-variant-numeric:tabular-nums;
  white-space:nowrap;
  transform:translateY(-100%);
  transition:opacity 0.15s ease;
}

/* ─── BUBBLE DRAG ORIGIN GHOST ─────────────────── */
.bento-drag-origin {
  position:absolute;
  z-index:2;
  pointer-events:none;
  border-radius:var(--radius-lg);
  border:2px dashed var(--accent);
  opacity:0.35;
  background:color-mix(in srgb, var(--accent) 4%, transparent);
  animation:bubbleOriginPulse 1s ease-in-out infinite alternate;
}
@keyframes bubbleOriginPulse {
  0% { opacity:0.25; border-color:color-mix(in srgb, var(--accent) 40%, transparent); }
  100% { opacity:0.45; border-color:color-mix(in srgb, var(--accent) 70%, transparent); }
}

`;

// Insert after the .bento-bubble.dragging rule
const dragOverMarker = '.bento-bubble.drag-over {';
if (css.includes(dragOverMarker)) {
  css = css.replace(dragOverMarker, dropAnimCSS + '\n' + dragOverMarker);
  console.log('✓ Added drop-bounce, tooltip, and origin ghost CSS');
} else {
  console.log('✗ Could not find .bento-bubble.drag-over marker');
}

fs.writeFileSync('style.css', css, 'utf8');
console.log('✓ style.css saved');

// ─── FIX HUB-VISUALS.JS ─────────────────────────────────────
let js = fs.readFileSync('hub-visuals.js', 'utf8');

// 1. Add tooltip creation, origin ghost, and drop animation to setupBubbleDragDrop
// We need to modify the mousemove handler to show a tooltip, and mouseup to add animation

// Find the mousemove handler where we set left/top on the bubble during drag
const dragMovePattern = `_bubbleDragData.bubble.style.left = newX + 'px';`;
if (js.includes(dragMovePattern)) {
  // Add tooltip update after the position update
  const tooltipCode = `
    // Update drag tooltip
    var _tip = document.getElementById('bentoDragTooltip');
    if (!_tip) {
      _tip = document.createElement('div');
      _tip.className = 'bento-drag-tooltip';
      _tip.id = 'bentoDragTooltip';
      document.body.appendChild(_tip);
    }
    var _bw = _bubbleDragData.bubble.offsetWidth;
    var _bh = _bubbleDragData.bubble.offsetHeight;
    _tip.textContent = _bw + ' \\u00D7 ' + _bh;
    _tip.style.display = 'block';
    _tip.style.left = (e.clientX + 16) + 'px';
    _tip.style.top = (e.clientY - 12) + 'px';`;

  // Insert after the position update line
  js = js.replace(`_bubbleDragData.bubble.style.left = newX + 'px';
    _bubbleDragData.bubble.style.top = newY + 'px';`,
    `_bubbleDragData.bubble.style.left = newX + 'px';
    _bubbleDragData.bubble.style.top = newY + 'px';${tooltipCode}`);
  console.log('✓ Added drag tooltip update in mousemove');
} else {
  console.log('✗ Could not find drag position update pattern');
}

// 2. Add origin ghost creation when drag activates (inside the lazily-activate block)
const dragActivatePattern = `_bubbleDragData.bubble.classList.add('dragging');`;
if (js.includes(dragActivatePattern)) {
  // Find the specific one inside the mousemove handler (not mouseup)
  // We need to add origin ghost creation right after the dragging class is added
  const originCode = `
      // Create origin ghost marker
      var _originGhost = document.createElement('div');
      _originGhost.className = 'bento-drag-origin';
      var _origRect = _bubbleDragData.bubble.getBoundingClientRect();
      var _gridRect = grid.getBoundingClientRect();
      _originGhost.style.left = (_bubbleDragData.bubble.offsetLeft || 0) + 'px';
      _originGhost.style.top = (_bubbleDragData.bubble.offsetTop || 0) + 'px';
      _originGhost.style.width = _bubbleDragData.bubble.offsetWidth + 'px';
      _originGhost.style.height = _bubbleDragData.bubble.offsetHeight + 'px';
      _bubbleDragData._originGhost = _originGhost;
      grid.appendChild(_originGhost);`;

  // Insert after the first occurrence of dragging class in mousemove
  const firstDragActivate = js.indexOf(dragActivatePattern);
  // Only insert if this is in the mousemove handler (not mouseup cancel)
  const mouseMoveSection = js.indexOf('document.addEventListener(\'mousemove\', function(e)');
  const mouseUpSection = js.indexOf('document.addEventListener(\'mouseup\', function(e)');
  
  if (firstDragActivate > mouseMoveSection && firstDragActivate < mouseUpSection) {
    js = js.substring(0, firstDragActivate + dragActivatePattern.length) + originCode + js.substring(firstDragActivate + dragActivatePattern.length);
    console.log('✓ Added origin ghost creation on drag activate');
  } else {
    console.log('✗ Could not find correct dragging activation point');
  }
} else {
  console.log('✗ Could not find .dragging class addition pattern');
}

// 3. Clean up origin ghost and tooltip on drag end (mouseup)
const dragEndCleanup = `_bubbleDragData.bubble.classList.remove('dragging');`;
if (js.includes(dragEndCleanup)) {
  // Find the first occurrence in mouseup handler (should be right at the start of mouseup handling)
  const firstCleanup = js.indexOf(dragEndCleanup);
  // Find the mouseup section
  const mouseUpSection2 = js.indexOf('document.addEventListener(\'mouseup\', function(e)');
  
  if (firstCleanup > mouseUpSection2 && firstCleanup < mouseUpSection2 + 200) {
    const cleanupCode = `
    // Remove origin ghost
    var _og = document.querySelector('.bento-drag-origin');
    if (_og) _og.remove();
    // Remove tooltip
    var _tip = document.getElementById('bentoDragTooltip');
    if (_tip) _tip.style.display = 'none';`;
    
    js = js.substring(0, firstCleanup) + cleanupCode + '\n    ' + js.substring(firstCleanup);
    console.log('✓ Added origin ghost and tooltip cleanup on mouseup');
  } else {
    // Try another approach - find the one after the active check
    // Just find any occurrence
    const allOccurrences = [];
    let idx = -1;
    while ((idx = js.indexOf(dragEndCleanup, idx + 1)) !== -1) {
      allOccurrences.push(idx);
    }
    // Check the last occurrence (in mouseup) vs first (in cancelDrag)
    if (allOccurrences.length >= 2) {
      const lastIdx = allOccurrences[allOccurrences.length - 1];
      const cleanupCode = `
    // Remove origin ghost
    var _og = document.querySelector('.bento-drag-origin');
    if (_og) _og.remove();
    // Remove tooltip
    var _tip = document.getElementById('bentoDragTooltip');
    if (_tip) _tip.style.display = 'none';`;
      js = js.substring(0, lastIdx) + cleanupCode + '\n    ' + js.substring(lastIdx);
      console.log('✓ Added origin ghost and tooltip cleanup on mouseup (alt)');
    } else {
      console.log('✗ Could not find correct cleanup point');
    }
  }
} else {
  console.log('✗ Could not find .dragging class removal pattern');
}

// 4. Add drop-bounce animation on mouseup (after position is finalized)
// Find where we set the final position and save
const finalPosAndSave = `hubContent.bentoLayout = dragLayout;
      saveHubContent();`;
if (js.includes(finalPosAndSave)) {
  const bounceCode = `
      // Trigger drop-bounce animation
      _bubbleDragData.bubble.classList.remove('dragging');
      _bubbleDragData.bubble.classList.add('drop-bounce');
      setTimeout(function() {
        var _db = _bubbleDragData ? null : document.querySelector('.bento-bubble.drop-bounce');
        if (_db) _db.classList.remove('drop-bounce');
      }, 500);`;
  
  // Insert before the dragLayout save
  js = js.replace('hubContent.bentoLayout = dragLayout;', bounceCode + '\n      hubContent.bentoLayout = dragLayout;');
  console.log('✓ Added drop-bounce animation on mouseup');
} else {
  console.log('✗ Could not find final save pattern');
}

// 5. Also clean up in the cancelDrag function
const cancelCode = `    if (_bubbleDragData) {
      if (_bubbleDragData.active) {
        _bubbleDragData.bubble.style.left = _bubbleDragData.originalX + 'px';
        _bubbleDragData.bubble.style.top = _bubbleDragData.originalY + 'px';
        _bubbleDragData.bubble.classList.remove('dragging');
        _bubbleDragData.bubble.style.zIndex = '';`;
if (js.includes(cancelCode)) {
  const cancelCleanup = `
      // Remove origin ghost
      var _og = document.querySelector('.bento-drag-origin');
      if (_og) _og.remove();
      // Remove tooltip
      var _tip = document.getElementById('bentoDragTooltip');
      if (_tip) _tip.style.display = 'none';`;
  
  js = js.replace(cancelCode, cancelCode + cancelCleanup);
  console.log('✓ Added cleanup in cancelDrag');
} else {
  console.log('✗ Could not find cancelDrag function');
}

fs.writeFileSync('hub-visuals.js', js, 'utf8');
console.log('✓ hub-visuals.js saved');
console.log('\n✅ All drag improvements applied!');
