const fs = require('fs');

// 1. Fix schedule.html - replace select with bubble pills
let html = fs.readFileSync('Hans Scedule/schedule.html', 'utf8');
const oldHtml = `<select id="tplAddSubcategory" class="form-input">\n              <option value="">None</option>\n            </select>`;
const newHtml = `<div class="tf-tags" id="tplAddSubcategoryPills">\n              <button type="button" class="tf-tag active" data-subcat="" style="--tag-c:var(--text-tertiary);--tag-b:var(--bg-secondary)">None</button>\n            </div>`;
if (html.includes(oldHtml)) {
  html = html.replace(oldHtml, newHtml);
  fs.writeFileSync('Hans Scedule/schedule.html', html, 'utf8');
  console.log('✓ schedule.html: replaced select with bubble pills');
} else {
  console.log('✗ schedule.html: pattern not found');
  // Try without trailing spaces
  const altOld = `<select id="tplAddSubcategory" class="form-input">
              <option value="">None</option>
            </select>`;
  if (html.includes(altOld)) {
    html = html.replace(altOld, newHtml);
    fs.writeFileSync('Hans Scedule/schedule.html', html, 'utf8');
    console.log('✓ schedule.html: replaced select with bubble pills (alt)');
  } else {
    console.log('✗ schedule.html: alt pattern also not found');
  }
}

// 2. Fix schedule.js - startEditTemplate initial population + tag click handler
let js = fs.readFileSync('Hans Scedule/schedule.js', 'utf8');

// 2a. Fix tag click handler in startEditTemplate to update subcategory pills
// The tag pills click handler in the edit popup just toggles active, needs to also refresh subcats
const oldTagClick = `popup.querySelectorAll('#tplEditTagPills .tf-tag').forEach(p => {\n    p.addEventListener('click', () => {\n      popup.querySelectorAll('#tplEditTagPills .tf-tag').forEach(b => b.classList.remove('active'));\n      p.classList.add('active');\n    });\n  });`;
const newTagClick = `popup.querySelectorAll('#tplEditTagPills .tf-tag').forEach(p => {\n    p.addEventListener('click', () => {\n      popup.querySelectorAll('#tplEditTagPills .tf-tag').forEach(b => b.classList.remove('active'));\n      p.classList.add('active');\n      // Refresh subcategory pills for selected tag\n      refreshSubcatPills('tplEditSubcategoryPills', p.dataset.tag);\n    });\n  });`;
if (js.includes(oldTagClick)) {
  js = js.replace(oldTagClick, newTagClick);
  console.log('✓ startEditTemplate: tag click now refreshes subcategory pills');
} else {
  console.log('✗ startEditTemplate: tag click pattern not found');
}

// 2b. Fix initial population - add refreshSubcatPills call after popup is positioned
// Find where the tag pills event listeners are attached and add initial population before that
const initMarker = `// Tag pills\n  popup.querySelectorAll('#tplEditTagPills .tf-tag').forEach(p => {`;
const initCode = `// Populate subcategory pills for current template\n  refreshSubcatPills('tplEditSubcategoryPills', tpl.tag, tpl.subcategory);\n  \n  // Tag pills\n  popup.querySelectorAll('#tplEditTagPills .tf-tag').forEach(p => {`;
if (js.includes(initMarker)) {
  js = js.replace(initMarker, initCode);
  console.log('✓ startEditTemplate: added initial subcategory population');
} else {
  console.log('✗ startEditTemplate: init marker not found');
}

// 2c. Fix save handler in startEditTemplate to read active pill instead of select
const oldSaveSubcat = `tpl.subcategory = editSubcatVal ? editSubcatVal.value || undefined : tpl.subcategory;`;
const newSaveSubcat = `const editSubcatPill = popup.querySelector('#tplEditSubcategoryPills .tf-tag.active');\n    tpl.subcategory = editSubcatPill ? editSubcatPill.dataset.subcat || undefined : tpl.subcategory;`;
if (js.includes(oldSaveSubcat)) {
  js = js.replace(oldSaveSubcat, newSaveSubcat);
  console.log('✓ startEditTemplate: save now reads active subcategory pill');
} else {
  console.log('✗ startEditTemplate: save subcat pattern not found');
}

fs.writeFileSync('Hans Scedule/schedule.js', js, 'utf8');
console.log('✓ schedule.js saved');

// Verify syntax
try {
  new Function(js);
  console.log('✓ schedule.js: No syntax errors');
} catch(e) {
  console.log('✗ schedule.js SYNTAX ERROR:', e.message);
}

console.log('\nAll fixes applied!');
