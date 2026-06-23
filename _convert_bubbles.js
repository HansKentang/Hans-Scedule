const fs = require('fs');

// ==========================================================
// 1. Update schedule.html - replace select with bubble pills
// ==========================================================
let html = fs.readFileSync('Hans Scedule/schedule.html', 'utf8');
const oldHtmlSelect = `<div class=\"tf-group\">\n            <label class=\"tf-label\">Subcategory (optional)</label>\n            <select id=\"tplAddSubcategory\" class=\"form-input\">\n              <option value=\"\">None</option>\n            </select>\n          </div>`;
const newHtmlPills = `<div class=\"tf-group\">\n            <label class=\"tf-label\">Subcategory (optional)</label>\n            <div class=\"tf-tags\" id=\"tplAddSubcategoryPills\">\n              <button type=\"button\" class=\"tf-tag active\" data-subcat=\"\" style=\"--tag-c:var(--text-tertiary);--tag-b:var(--bg-secondary)\">None</button>\n            </div>\n          </div>`;
if (html.includes(oldHtmlSelect)) {
  html = html.replace(oldHtmlSelect, newHtmlPills);
  fs.writeFileSync('Hans Scedule/schedule.html', html, 'utf8');
  console.log('✓ schedule.html: replaced select with bubble pills');
} else {
  console.log('✗ schedule.html: pattern not found');
}

// ==========================================================
// 2. Update schedule.js - all subcategory dropdown → pills
// ==========================================================
let js = fs.readFileSync('Hans Scedule/schedule.js', 'utf8');

// 2a. Replace select in startEditTemplate with bubble pills
const oldEditSelect = `<select id=\"tplEditSubcategory\" class=\"form-input\">\n          <option value=\"\">None</option>\n        </select>`;
const newEditPills = `<div class=\"tf-tags\" id=\"tplEditSubcategoryPills\">\n          <button type=\"button\" class=\"tf-tag active\" data-subcat=\"\" style=\"--tag-c:var(--text-tertiary);--tag-b:var(--bg-secondary)\">None</button>\n        </div>`;
if (js.includes(oldEditSelect)) {
  js = js.replace(oldEditSelect, newEditPills);
  console.log('✓ startEditTemplate: replaced select with bubble pills');
} else {
  console.log('✗ startEditTemplate: select not found');
}

// 2b. Update startEditTemplate - tag click to refresh subcategory pills
const oldEditTagRefresh = `const editSubcat2 = document.getElementById('tplEditSubcategory');\n      if (editSubcat2) {\n        const newTag = p.dataset.tag;\n        const newSubs = SUBCATEGORIES[newTag] || [];\n        editSubcat2.innerHTML = '<option value=\"\">None</option>' + newSubs.map(s => \`<option value=\"\${s}\">\${s}</option>\`).join('');\n      }`;
const newEditTagRefresh = `refreshSubcatPills('tplEditSubcategoryPills', p.dataset.tag);`;
if (js.includes(oldEditTagRefresh)) {
  js = js.replace(oldEditTagRefresh, newEditTagRefresh);
  console.log('✓ startEditTemplate: updated tag click to refresh pills');
} else {
  console.log('✗ startEditTemplate: tag refresh pattern not found');
  // Try alternative with different escaping
  const altEditTag = `const editSubcat2 = document.getElementById('tplEditSubcategory');\n      if (editSubcat2) {\n        const newTag = p.dataset.tag;\n        const newSubs = SUBCATEGORIES[newTag] || [];\n        editSubcat2.innerHTML = '<option value=\"\">None</option>' + newSubs.map(s => '<option value=\"' + s + '\">' + s + '<\\/option>').join('');\n      }`;
  if (js.includes(altEditTag)) {
    js = js.replace(altEditTag, newEditTagRefresh);
    console.log('✓ startEditTemplate: updated tag click (alt pattern)');
  } else {
    console.log('✗ startEditTemplate: alt pattern also not found');
  }
}

// 2c. Update startEditTemplate - save logic to read active bubble pill
const oldEditSave = `const editSubcatVal = document.getElementById('tplEditSubcategory');\n    tpl.subcategory = editSubcatVal ? editSubcatVal.value || undefined : tpl.subcategory;`;
const newEditSave = `const editSubcatActive = document.querySelector('#tplEditSubcategoryPills .tf-tag.active');\n    tpl.subcategory = editSubcatActive ? editSubcatActive.dataset.subcat || undefined : tpl.subcategory;`;
if (js.includes(oldEditSave)) {
  js = js.replace(oldEditSave, newEditSave);
  console.log('✓ startEditTemplate: updated save to read active pill');
} else {
  console.log('✗ startEditTemplate: save pattern not found');
}

// 2d. Update startEditTemplate - initial population (tplEditSubcategory → tplEditSubcategoryPills)
const oldEditInit = `const editSubcat = document.getElementById('tplEditSubcategory');\n    if (editSubcat) {\n      const subs = SUBCATEGORIES[tpl.tag] || [];\n      editSubcat.innerHTML = '<option value=\"\">None</option>' + subs.map(s => \`<option value="\${s}"\${s === tpl.subcategory ? ' selected' : ''}>\${s}</option>\`).join('');\n    }`;
const newEditInit = `refreshSubcatPills('tplEditSubcategoryPills', tpl.tag, tpl.subcategory);`;
if (js.includes(oldEditInit)) {
  js = js.replace(oldEditInit, newEditInit);
  console.log('✓ startEditTemplate: updated initial population');
} else {
  console.log('✗ startEditTemplate: init pattern not found');
  // Try alternative
  const altEditInit = `const editSubcat = document.getElementById('tplEditSubcategory');\n    if (editSubcat) {\n      const subs = SUBCATEGORIES[tpl.tag] || [];\n      editSubcat.innerHTML = '<option value=\"\">None</option>' + subs.map(s => '<option value=\"' + s + '\"' + (s === tpl.subcategory ? ' selected' : '') + '>' + s + '<\\/option>').join('');\n    }`;
  if (js.includes(altEditInit)) {
    js = js.replace(altEditInit, newEditInit);
    console.log('✓ startEditTemplate: updated init (alt pattern)');
  }
}

// 2e. Update saveAddTemplate to read from bubble pills instead of select
const oldSaveRead = `// Get subcategory\n  const subcatEl = document.getElementById('tplAddSubcategory');\n  const subcategory = subcatEl ? subcatEl.value : '';`;
const newSaveRead = `// Get subcategory from active bubble pill\n  const subcatPill = document.querySelector('#tplAddSubcategoryPills .tf-tag.active');\n  const subcategory = subcatPill ? subcatPill.dataset.subcat || '' : '';`;
if (js.includes(oldSaveRead)) {
  js = js.replace(oldSaveRead, newSaveRead);
  console.log('✓ saveAddTemplate: updated to read from active pill');
} else {
  console.log('✗ saveAddTemplate: pattern not found');
}

// 2f. Update openAddTemplatePopup - reset logic for bubble pills
const oldOpenReset = `// Reset and populate subcategory dropdown with default tag\n  const subcatEl = document.getElementById('tplAddSubcategory');\n  if (subcatEl) {\n    const defaultTag = document.querySelector('#tplAddTagPills .tf-tag.active')?.dataset?.tag || 'deep-work';\n    const defaultSubs = typeof SUBCATEGORIES !== 'undefined' ? (SUBCATEGORIES[defaultTag] || []) : [];\n    subcatEl.innerHTML = '<option value=\"\">None</option>' + defaultSubs.map(function(s) { return '<option value=\"' + s + '\">' + s + '</option>'; }).join('');\n    subcatEl.value = '';\n  }`;
const newOpenReset = `// Reset and populate subcategory bubble pills with default tag\n  const defaultTag = document.querySelector('#tplAddTagPills .tf-tag.active')?.dataset?.tag || 'deep-work';\n  refreshSubcatPills('tplAddSubcategoryPills', defaultTag);`;
if (js.includes(oldOpenReset)) {
  js = js.replace(oldOpenReset, newOpenReset);
  console.log('✓ openAddTemplatePopup: updated reset to use bubble pills');
} else {
  console.log('✗ openAddTemplatePopup: pattern not found');
  // Try the original pattern (before the 'Any' fix)
  const oldOpenReset2 = `// Reset subcategory dropdown\n  const subcatEl = document.getElementById('tplAddSubcategory');\n  if (subcatEl) { subcatEl.innerHTML = '<option value=\"\">Any</option>'; subcatEl.value = ''; }`;
  if (js.includes(oldOpenReset2)) {
    js = js.replace(oldOpenReset2, newOpenReset);
    console.log('✓ openAddTemplatePopup: updated reset (alt pattern)');
  }
}

// 2g. Update bindEvents tag pills handler to refresh bubble pills
const oldTagPillHandler = `document.querySelectorAll('#tplAddTagPills .tf-tag').forEach(pill => {\n    pill.addEventListener('click', () => {\n      document.querySelectorAll('#tplAddTagPills .tf-tag').forEach(b => b.classList.remove('active'));\n      pill.classList.add('active');\n      // Refresh subcategory dropdown for selected tag\n      const subcatEl = document.getElementById('tplAddSubcategory');\n      if (subcatEl) {\n        const tag = pill.dataset.tag;\n        const subs = typeof SUBCATEGORIES !== 'undefined' ? (SUBCATEGORIES[tag] || []) : [];\n        subcatEl.innerHTML = '<option value=\"\">None</option>' + subs.map(s => '<option value=\"' + s + '\">' + s + '</option>').join('');\n        subcatEl.value = '';\n      }\n    });\n  });`;
const newTagPillHandler = `document.querySelectorAll('#tplAddTagPills .tf-tag').forEach(pill => {\n    pill.addEventListener('click', () => {\n      document.querySelectorAll('#tplAddTagPills .tf-tag').forEach(b => b.classList.remove('active'));\n      pill.classList.add('active');\n      // Refresh subcategory bubble pills for selected tag\n      refreshSubcatPills('tplAddSubcategoryPills', pill.dataset.tag);\n    });\n  });`;
if (js.includes(oldTagPillHandler)) {
  js = js.replace(oldTagPillHandler, newTagPillHandler);
  console.log('✓ bindEvents: updated tag pills to refresh bubble pills');
} else {
  console.log('✗ bindEvents: tag pills handler not found');
}

// 2h. Add refreshSubcatPills helper function (insert before startEditTemplate or after renderPmPill)
if (!js.includes('function refreshSubcatPills')) {
  const helperFunc = `
// ─── REFRESH SUBCATEGORY PILLS ──────────────────────────────
function refreshSubcatPills(containerId, tag, selectedSubcat) {
  const container = document.getElementById(containerId);
  if (!container) return;
  const subs = typeof SUBCATEGORIES !== 'undefined' ? (SUBCATEGORIES[tag] || []) : [];
  let html = '<button type=\"button\" class=\"tf-tag' + (!selectedSubcat ? ' active' : '') + '\" data-subcat=\"\" style=\"--tag-c:var(--text-tertiary);--tag-b:var(--bg-secondary)\">None</button>';
  for (const s of subs) {
    const active = s === selectedSubcat ? ' active' : '';
    html += '<button type=\"button\" class=\"tf-tag' + active + '\" data-subcat=\"' + s + '\" style=\"--tag-c:var(--text-secondary);--tag-b:var(--accent-soft)\">' + s + '</button>';
  }
  container.innerHTML = html;
  // Attach click handlers
  container.querySelectorAll('.tf-tag').forEach(btn => {
    btn.addEventListener('click', () => {
      container.querySelectorAll('.tf-tag').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });
}
`;
  // Insert before startEditTemplate
  const insertPoint = js.indexOf('function startEditTemplate');
  if (insertPoint >= 0) {
    js = js.substring(0, insertPoint) + helperFunc + js.substring(insertPoint);
    console.log('✓ Added refreshSubcatPills helper function');
  } else {
    // Insert before renderSchTemplates
    const insertPoint2 = js.indexOf('function renderSchTemplates');
    if (insertPoint2 >= 0) {
      js = js.substring(0, insertPoint2) + helperFunc + js.substring(insertPoint2);
      console.log('✓ Added refreshSubcatPills helper (before renderSchTemplates)');
    }
  }
}

fs.writeFileSync('Hans Scedule/schedule.js', js, 'utf8');
console.log('✓ schedule.js saved');

// ==========================================================
// 3. Add CSS for subcategory bubble pills
// ==========================================================
// The pills use the existing .tf-tag styles which already handle styling.
// No additional CSS needed - reusing tf-tag styling.

console.log('\\nAll changes complete!');
