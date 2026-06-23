const fs = require('fs');
const c = fs.readFileSync('Hans Scedule/schedule.js', 'utf8');
let openB = 0, closeB = 0, openP = 0, closeP = 0;
let lineNum = 1;
const lines = c.split('\n');
for (let i = 0; i < c.length; i++) {
  if (c[i] === '\n') lineNum++;
  if (c[i] === '{') openB++;
  else if (c[i] === '}') closeB++;
  else if (c[i] === '(') openP++;
  else if (c[i] === ')') closeP++;
}
console.log('Braces: {', openB, '} =', closeB, 'diff:', openB - closeB);
console.log('Parens: (', openP, ') =', closeP, 'diff:', openP - closeP);

// Find line with mismatched backticks
let btick = 0;
for (let i = 0; i < lines.length; i++) {
  for (let j = 0; j < lines[i].length; j++) {
    if (lines[i][j] === '`') btick++;
  }
  if (btick % 2 !== 0) {
    console.log('Unmatched backtick on line', i + 1, ':', lines[i].substring(0, 120));
    break;
  }
}
if (btick % 2 === 0) console.log('Backticks: even (' + btick + ')');
