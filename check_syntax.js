/**
 * check_syntax.js — Validate all JS files with node --check
 *
 * Usage:        node check_syntax.js
 * Usage (quiet): node check_syntax.js --quiet
 *
 * Scans all .js files in the project (excluding node_modules, .git)
 * and reports syntax errors. Exits with code 1 if any file has errors.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = __dirname;
const quiet = process.argv.includes('--quiet');

// Directories and files to skip
const SKIP_DIRS = new Set(['node_modules', '.git', '.github']);
const SKIP_FILES = new Set(['check_syntax.js']); // don't check ourselves

let total = 0;
let passed = 0;
let failed = 0;
const errors = [];

/**
 * Recursively collect .js files
 */
function collectJSFiles(dir) {
  const files = [];
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return files;
  }
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!SKIP_DIRS.has(entry.name)) {
        files.push(...collectJSFiles(full));
      }
    } else if (entry.isFile() && entry.name.endsWith('.js') && !SKIP_FILES.has(entry.name)) {
      files.push(full);
    }
  }
  return files;
}

/**
 * Check a single file with node --check
 */
function checkFile(filePath) {
  const relative = path.relative(ROOT, filePath);
  try {
    execSync(`node --check "${filePath}"`, { stdio: 'pipe', timeout: 10000 });
    if (!quiet) console.log(`  ✓  ${relative}`);
    return true;
  } catch (err) {
    // Extract the actual error message from stderr
    const msg = (err.stderr || '').toString().trim() || err.message;
    errors.push({ file: relative, message: msg });
    if (!quiet) console.log(`  ✗  ${relative}`);
    return false;
  }
}

// ─── Main ──────────────────────────────────────────────────

console.log('');
console.log('┌─────────────────────────────────────────────┐');
console.log('│  JS Syntax Checker                          │');
console.log('└─────────────────────────────────────────────┘');
console.log('');

const start = Date.now();
const files = collectJSFiles(ROOT);
total = files.length;

for (const file of files) {
  const ok = checkFile(file);
  if (ok) passed++;
  else failed++;
}

const elapsed = ((Date.now() - start) / 1000).toFixed(1);
console.log('');
console.log(`Checked ${total} files in ${elapsed}s`);

if (failed === 0) {
  console.log('✅  All files pass syntax check!');
  process.exit(0);
} else {
  console.log(`❌  ${failed} file(s) have syntax errors:\n`);
  for (const err of errors) {
    console.log(`   ${err.file}`);
    console.log(`   ${err.message}`);
    console.log('');
  }
  process.exit(1);
}
