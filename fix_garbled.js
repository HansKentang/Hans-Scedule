const fs = require('fs');
const path = 'Hans Scedule/schedule.js';
let js = fs.readFileSync(path, 'utf8');

// Remove the garbled "ssList.add('active');" text and extra closing braces
// The bug is: after the correct tag pill forEach, there's leftover text from incorrect offset calculation
const garbled = "  });ssList.add('active');\n    });\n  });\n  \n  // Template add popup - duration buttons";
const fixed = "  });\n  \n  // Template add popup - duration buttons";

if (js.includes(garbled)) {
  js = js.replace(garbled, fixed);
  fs.writeFileSync(path, js, 'utf8');
  console.log('✓ Fixed garbled text');
} else {
  console.log('✗ Could not find garbled text, searching for alternative...');
  // Try with \r\n
  const garbled2 = "  });ssList.add('active');\r\n    });\r\n  });\r\n  \r\n  // Template add popup - duration buttons";
  const fixed2 = "  });\r\n  \r\n  // Template add popup - duration buttons";
  if (js.includes(garbled2)) {
    js = js.replace(garbled2, fixed2);
    fs.writeFileSync(path, js, 'utf8');
    console.log('✓ Fixed garbled text (CRLF)');
  } else {
    console.log('✗ Pattern not found with either line endings');
    // Just remove the ssList text
    const simpler = "ssList.add('active');\n    });\n  });\n  \n  // Template add popup";
    if (js.includes(simpler)) {
      js = js.replace(simpler, "\n  \n  // Template add popup");
      fs.writeFileSync(path, js, 'utf8');
      console.log('✓ Fixed via simpler approach');
    }
  }
}
