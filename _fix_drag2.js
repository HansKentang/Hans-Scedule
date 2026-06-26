const fs = require('fs');
const js = fs.readFileSync('hub-visuals.js', 'utf8');
const lines = js.split(/\r?\n/);
let changes = 0;

// Helper to find a line index by content match
function findLine(pattern, start = 0) {
  for (let i = start; i < lines.length; i++) {
    if (lines[i].includes(pattern)) return i;
  }
  return -1;
}

// 1. Add tooltip creation + update in mousemove handler — after position update
const posLine = findLine("_bubbleDragData.bubble.style.top = newY + 'px';");
if (posLine >= 0) {
  // Check if tooltip code already exists nearby
  const nextLines = lines.slice(posLine + 1, posLine + 15).join('\n');
  if (!nextLines.includes('Update drag tooltip')) {
    const tooltipLines = [
      "    // Update drag tooltip",
      "    var _tip = document.getElementById('bentoDragTooltip');",
      "    if (!_tip) {",
      "      _tip = document.createElement('div');",
      "      _tip.className = 'bento-drag-tooltip';",
      "      _tip.id = 'bentoDragTooltip';",
      "      document.body.appendChild(_tip);",
      "    }",
      "    _tip.textContent = _bubbleDragData.bubble.offsetWidth + ' \\u00D7 ' + _bubbleDragData.bubble.offsetHeight;",
      "    _tip.style.display = 'block';",
      "    _tip.style.left = (e.clientX + 16) + 'px';",
      "    _tip.style.top = (e.clientY - 12) + 'px';",
    ];
    lines.splice(posLine + 1, 0, ...tooltipLines);
    changes++;
    console.log('✓ Added drag tooltip update in mousemove');
  } else {
    console.log('- Tooltip code already exists in mousemove');
  }
} else {
  console.log('✗ Could not find mousemove position update line');
}

// 2. Add drop-bounce after saveHubContent() + pushUndoState in mouseup handler
const saveLine = findLine("saveHubContent();");
if (saveLine >= 0) {
  // Verify this is the one in the drag mouseup handler
  const before = lines.slice(Math.max(0, saveLine - 5), saveLine).join('\n');
  const after = lines.slice(saveLine + 1, saveLine + 8).join('\n');
  if (before.includes('pushUndoState') && after.includes('Update all bubbles')) {
    const next5 = lines.slice(saveLine + 1, saveLine + 10).join('\n');
    if (!next5.includes('drop-bounce')) {
      const bounceLines = [
        "      // Trigger drop-bounce animation",
        "      bubble.classList.add('drop-bounce');",
        "      setTimeout(function() {",
        "        bubble.classList.remove('drop-bounce');",
        "      }, 500);",
      ];
      lines.splice(saveLine + 1, 0, ...bounceLines);
      changes++;
      console.log('✓ Added drop-bounce animation on mouseup');
    } else {
      console.log('- Drop-bounce already exists in mouseup');
    }
  } else {
    console.log('- saveHubContent() in mouseup not found via pattern, trying alternative...');
    // Try to find it by searching for the specific context
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes('saveHubContent()') && 
          lines.slice(Math.max(0,i-3), i).join(' ').includes('pushUndoState') && 
          lines.slice(i+1, i+6).join(' ').includes('dragLayout.forEach')) {
        const next5 = lines.slice(i + 1, i + 10).join('\n');
        if (!next5.includes('drop-bounce')) {
          const bounceLines = [
            "      // Trigger drop-bounce animation",
            "      bubble.classList.add('drop-bounce');",
            "      setTimeout(function() {",
            "        bubble.classList.remove('drop-bounce');",
            "      }, 500);",
          ];
          lines.splice(i + 1, 0, ...bounceLines);
          changes++;
          console.log('✓ Added drop-bounce animation on mouseup (alt)');
        }
        break;
      }
    }
  }
} else {
  console.log('✗ Could not find saveHubContent line');
}

// 3. Add cleanup in cancelDrag — after _bubbleDragData.bubble.style.zIndex = '';
const zIndexLine = findLine("_bubbleDragData.bubble.style.zIndex = '';");
if (zIndexLine >= 0) {
  // Check if this is inside the cancelDrag function (starts with "function cancelDrag")
  // and if cleanup hasn't been added yet
  const next3 = lines.slice(zIndexLine + 1, zIndexLine + 6).join('\n');
  if (!next3.includes('Remove origin ghost')) {
    const cleanupLines = [
      "      // Remove origin ghost",
      "      var _og = document.querySelector('.bento-drag-origin');",
      "      if (_og) _og.remove();",
      "      // Remove tooltip",
      "      var _tip = document.getElementById('bentoDragTooltip');",
      "      if (_tip) _tip.style.display = 'none';",
    ];
    lines.splice(zIndexLine + 1, 0, ...cleanupLines);
    changes++;
    console.log('✓ Added cleanup in cancelDrag');
  } else {
    console.log('- Cancel cleanup already exists');
  }
} else {
  console.log('✗ Could not find cancelDrag zIndex line');
}

fs.writeFileSync('hub-visuals.js', lines.join('\r\n'), 'utf8');
console.log(`\n✅ Done — ${changes} changes applied`);
