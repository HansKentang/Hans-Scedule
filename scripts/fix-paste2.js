const fs = require('fs');
let content = fs.readFileSync('shared.js', 'utf8');

// Use regex to find the pattern regardless of line endings
const regex = /(\s+if\s*\(preview\)\s*preview\.dataset\.pasted\s*=\s*dataUrl;\s*)\};\s*reader\.readAsDataURL\(blob\);/;
const match = content.match(regex);
if (match) {
  const fullMatch = match[0];
  const prefix = match[1];
  const replacement = prefix + 
    '        // Clear URL input so pasted image takes priority in handleImagePickerSave\n' +
    '        var _urlInput = document.getElementById(\'imagePickerUrl\');\n' +
    '        if (_urlInput) _urlInput.value = \'\';\n' +
    '      };\n' +
    '      reader.readAsDataURL(blob);';
  // Normalize line endings in the replacement
  const replacementNorm = replacement.replace(/\n/g, content.includes('\r\n') ? '\r\n' : '\n');
  content = content.replace(fullMatch, replacementNorm);
  console.log('Fixed: added URL input clearing after paste');
} else {
  console.log('Pattern not found. Checking context...');
  const idx = content.indexOf('preview.dataset.pasted = dataUrl');
  if (idx >= 0) {
    const snippet = content.substring(idx - 20, idx + 120);
    console.log('Context around match:', JSON.stringify(snippet));
  }
}

fs.writeFileSync('shared.js', content, 'utf8');
console.log('Done');
