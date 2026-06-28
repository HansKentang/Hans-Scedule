const fs = require('fs');
const path = 'Hans Scedule/schedule.js';
let js = fs.readFileSync(path, 'utf8');

// Fix: add { capture: true } to the _dragMoved handler
const oldCode = "  });\n}\n\n  // Make chip-row buttons draggable to calendar";
const newCode = "  }, { capture: true });\n}\n\n  // Make chip-row buttons draggable to calendar";

// Find the specific occurrence - the )}; pattern right before the next section
const target = "      delete chip.dataset._dragMoved;\n    }\n  });\n}\n\n  // Make chip-row";
const replacement = "      delete chip.dataset._dragMoved;\n    }\n  }, { capture: true });\n}\n\n  // Make chip-row";

if (js.includes(target)) {
  js = js.replace(target, replacement);
  console.log('✓ Fixed: added capture phase to _dragMoved handler');
} else {
  console.log('✗ Could not find target pattern');
  // Try alternative approach
  const altTarget = "delete chip.dataset._dragMoved;\n    }\n  });\n}\n\n  // Make chip-row";
  const altReplacement = "delete chip.dataset._dragMoved;\n    }\n  }, { capture: true });\n}\n\n  // Make chip-row";
  if (js.includes(altTarget)) {
    js = js.replace(altTarget, altReplacement);
    console.log('✓ Fixed (alt): added capture phase');
  } else {
    console.log('✗ Alternative also not found');
  }
}

// Also fix the "Any" vs "None" inconsistency in openAddTemplatePopup
const anyTarget = "subcatEl.innerHTML = '<option value=\"\">Any</option>';";
const anyReplacement = "subcatEl.innerHTML = '<option value=\"\">None</option>';";
if (js.includes(anyTarget)) {
  js = js.replace(anyTarget, anyReplacement);
  console.log('✓ Fixed: Any -> None');
}

fs.writeFileSync(path, js, 'utf8');
console.log('✓ Done');
