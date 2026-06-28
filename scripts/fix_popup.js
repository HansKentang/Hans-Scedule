const fs = require('fs');
const path = 'Hans Scedule/schedule.js';
let js = fs.readFileSync(path, 'utf8');

// Fix: populate subcategory dropdown with default tag's subcategories on initial open
const target = `  // Reset subcategory dropdown
  const subcatEl = document.getElementById('tplAddSubcategory');
  if (subcatEl) { subcatEl.innerHTML = '<option value="">None</option>'; subcatEl.value = ''; }`;

const replacement = `  // Reset and populate subcategory dropdown with default tag
  const subcatEl = document.getElementById('tplAddSubcategory');
  if (subcatEl) {
    const defaultTag = document.querySelector('#tplAddTagPills .tf-tag.active')?.dataset?.tag || 'deep-work';
    const defaultSubs = typeof SUBCATEGORIES !== 'undefined' ? (SUBCATEGORIES[defaultTag] || []) : [];
    subcatEl.innerHTML = '<option value="">None</option>' + defaultSubs.map(function(s) { return '<option value="' + s + '">' + s + '</option>'; }).join('');
    subcatEl.value = '';
  }`;

if (js.includes(target)) {
  js = js.replace(target, replacement);
  fs.writeFileSync(path, js, 'utf8');
  console.log('✓ Fixed: subcategory dropdown now populated on initial open');
} else {
  console.log('✗ Target not found');
}
