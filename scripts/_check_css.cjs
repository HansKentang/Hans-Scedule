const fs = require('fs');
const file = process.argv[2] || 'css/style.css';
const raw = fs.readFileSync(file, 'utf8');
const lines = raw.split(/\r?\n/);
let cleaned = '';
let inComment = false;
for (let i = 0; i < lines.length; i++) {
  const ln = lines[i];
  let s = '';
  for (let j = 0; j < ln.length; j++) {
    const c = ln[j], n = ln[j + 1];
    if (inComment) { if (c === '*' && n === '/') { inComment = false; j++; } continue; }
    if (c === '/' && n === '*') { inComment = true; j++; continue; }
    if (c === '"' || c === "'") {
      const q = c; j++;
      while (j < ln.length && ln[j] !== q) { if (ln[j] === '\\') j++; j++; }
      continue;
    }
    s += c;
  }
  cleaned += s + '\n';
}
const C = cleaned.split('\n');
let depth = 0;
const strays = [];
const orphanDecl = [];
let prevSignificant = '';
C.forEach((ln, i) => {
  const original = lines[i] || '';
  const trimmed = original.trim();
  const isCommentLine = /^\s*(\/\*|\*)/.test(original);
  if (!trimmed || isCommentLine) return;
  for (const c of ln) {
    if (c === '{') depth++;
    else if (c === '}') {
      depth--;
      if (depth < 0) { strays.push((i + 1) + ': STRAY-CLOSE >> ' + trimmed.slice(0, 100)); depth = 0; }
    }
  }
  const startsWithDecl = /^-?[a-zA-Z][a-zA-Z0-9-]*\s*:/.test(trimmed);
  if (startsWithDecl && /}\s*$/.test(prevSignificant)) {
    orphanDecl.push((i + 1) + ': ORPHAN-DECL (prev ended with }) >> ' + trimmed.slice(0, 100));
  }
  prevSignificant = ln.trim();
});
console.log('file:', file);
console.log('final depth =', depth, '(0 is balanced)');
if (strays.length) console.log('--- stray closing braces ---\n' + strays.join('\n'));
if (orphanDecl.length) console.log('--- orphan declaration blocks ---\n' + orphanDecl.join('\n'));

const from = parseInt(process.argv[3] || '0', 10);
const to = parseInt(process.argv[4] || '0', 10);
if (from && to) {
  let d2 = 0;
  console.log('--- depth map ' + from + '..' + to + ' ---');
  C.forEach((ln, i) => {
    for (const c of ln) {
      if (c === '{') d2++;
      else if (c === '}') d2--;
    }
    if (i + 1 >= from && i + 1 <= to) console.log('d=' + d2 + ' ' + (i + 1) + ': ' + (lines[i] || '').slice(0, 95));
  });
}
