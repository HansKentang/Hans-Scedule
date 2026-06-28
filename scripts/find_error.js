const fs = require('fs');
const c = fs.readFileSync('Hans Scedule/schedule.js', 'utf8');
const lines = c.split('\n');

// Track brace/paren balance per line
let openB = 0, closeB = 0;
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  for (let j = 0; j < line.length; j++) {
    if (line[j] === '{') openB++;
    else if (line[j] === '}') closeB++;
  }
  const bDiff = openB - closeB;
  if (bDiff < 0) {
    console.log('NEGATIVE brace balance at line', (i+1), '(too many closing braces)');
    console.log('  Line:', line.substring(0, 120));
    break;
  }
}
console.log('Final brace diff:', openB - closeB);

// Also check parens
let openP = 0, closeP = 0;
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  for (let j = 0; j < line.length; j++) {
    if (line[j] === '(') openP++;
    else if (line[j] === ')') closeP++;
  }
  const pDiff = openP - closeP;
  if (pDiff < 0) {
    console.log('NEGATIVE paren balance at line', (i+1), '(too many closing parens)');
    console.log('  Line:', line.substring(0, 120));
    break;
  }
}
console.log('Final paren diff:', openP - closeP);
