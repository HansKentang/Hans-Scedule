#!/usr/bin/env node
/**
 * sync-shared.js
 *
 * Copies shared files from the root project (../) into haven-desktop/
 * so both apps stay in sync. Run via `npm run prestart` or `node scripts/sync-shared.js`
 *
 * Root is the single source of truth for all shared files.
 */

const fs = require('fs');
const path = require('path');

const DESKTOP_DIR = path.resolve(__dirname, '..');
const ROOT_DIR = path.resolve(DESKTOP_DIR, '..');

// Files that are shared between root (web) and desktop (Electron)
// These get copied FROM root TO haven-desktop/
const SHARED_FILES = [
  // HTML pages
  'activities.html',
  'analytics.html',
  'finance.html',
  'gallery.html',
  'goals.html',
  'index.html',
  'login.html',
  'schedule.html',
  'tags.html',
  'landing.html',
  'clear-images.html',
  'admin.html',

  // JavaScript
  'activities.js',
  'analytics.js',
  'finance.js',
  'gallery.js',
  'goals.js',
  'hub-visuals.js',
  'schedule.js',
  'shared.js',
  'settings.js',
  'gsi.js',

  // Styles
  'style.css',
];

let copied = 0;
let skipped = 0;
let errors = [];

for (const file of SHARED_FILES) {
  const src = path.join(ROOT_DIR, file);
  const dest = path.join(DESKTOP_DIR, file);

  try {
    // Check if source exists
    if (!fs.existsSync(src)) {
      errors.push(`SOURCE MISSING: ${file} (not found in root)`);
      skipped++;
      continue;
    }

    // Copy the file
    fs.copyFileSync(src, dest);
    copied++;
    console.log(`  ✓ ${file}`);
  } catch (err) {
    errors.push(`${file}: ${err.message}`);
    skipped++;
  }
}

console.log(`\nSync complete: ${copied} copied, ${skipped} skipped, ${errors.length} errors`);
if (errors.length > 0) {
  console.error('\nErrors:');
  errors.forEach(e => console.error(`  ✗ ${e}`));
  process.exit(1);
}
