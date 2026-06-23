const fs = require('fs');
const jsPath = 'Hans Scedule/schedule.js';
let js = fs.readFileSync(jsPath, 'utf8');

// Helper to find a function body by name
function findFunc(content, name) {
  const idx = content.indexOf('function ' + name + '(');
  if (idx < 0) return null;
  const brace = content.indexOf('{', idx);
  if (brace < 0) return null;
  let depth = 1, pos = brace + 1;
  while (depth > 0 && pos < content.length) {
    if (content[pos] === '{') depth++;
    else if (content[pos] === '}') depth--;
    pos++;
  }
  return { start: idx, end: pos, body: content.substring(idx, pos) };
}

// ============================================================
// 1. REPLACE renderSchTemplates - draggable chips + subcategory grouping
// ============================================================
const renderOld = findFunc(js, 'renderSchTemplates');
if (renderOld) {
  const renderNew = `function renderSchTemplates() {
  const container = document.getElementById('pmChips');
  if (!container) return;
  const templates = loadTemplates();
  let html = '';
  for (const tag of TAG_ORDER) {
    const tpls = templates.filter(t => t.tag === tag);
    const col = TAG_COLORS[tag] || TAG_COLORS.meeting;
    const accent = col.text;
    const isOpen = state._openPmTag === tag;
    html += \`<button class="sch-pm-chip\${isOpen ? ' active' : ''}" data-pm-tag="\${tag}"
      style="--chip-accent:\${accent}" draggable="true" data-pm-chip="\${tag}">
      <span class="sch-pm-chip-dot" style="background:\${accent}"></span>
      \${TAG_LABELS[tag]}
      \${tpls.length > 0 ? \`<span class="sch-pm-chip-count">\${tpls.length}</span>\` : ''}
    </button>\`;
  }
  container.innerHTML = html;
  
  // Chip click — toggle dropdown
  container.querySelectorAll('.sch-pm-chip').forEach(chip => {
    chip.addEventListener('click', (e) => {
      e.stopPropagation();
      const tag = chip.dataset.pmTag;
      if (state._openPmTag === tag) {
        closePmDropdown();
      } else {
        state._openPmTag = tag;
        renderSchTemplates();
        showPmDropdown(tag);
      }
    });
  });
  
  // Make chip-row buttons draggable to calendar
  container.querySelectorAll('.sch-pm-chip').forEach(chip => {
    chip.addEventListener('mousedown', (e) => {
      if (e.button !== 0 || e.target.closest('.sch-pm-chip') !== chip) return;
      // Only start drag if user explicitly moves (don't interfere with click)
      const startX = e.clientX, startY = e.clientY;
      let moved = false;
      const onMove = (ev) => {
        if (Math.abs(ev.clientX - startX) > 5 || Math.abs(ev.clientY - startY) > 5) {
          moved = true;
          document.removeEventListener('mousemove', onMove);
          document.removeEventListener('mouseup', onUp);
          // Simulate startDrag with a fake source
          const tag = chip.dataset.pmTag;
          const fakePill = document.createElement('div');
          fakePill.dataset.tag = tag;
          fakePill.dataset.duration = '60';
          fakePill.dataset.templateTitle = TAG_LABELS[tag] || tag;
          startDrag(ev, fakePill);
        }
      };
      const onUp = () => {
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
        if (!moved) {
          // It was a click, let click handler handle it
          chip.click();
        }
      };
      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
    });
  });
}`;
  js = js.substring(0, renderOld.start) + renderNew + js.substring(renderOld.end);
  console.log('✓ Updated renderSchTemplates with draggable chips');
}

// ============================================================
// 2. REPLACE showPmDropdown - group by subcategory
// ============================================================
const dropOld = findFunc(js, 'showPmDropdown');
if (dropOld) {
  const dropNew = `function showPmDropdown(tag) {
  // Remove any existing dropdown
  document.getElementById('schPmDropdown')?.remove();
  document.removeEventListener('click', closePmDropdown);
  
  const pm = document.getElementById('schPillManager');
  if (!pm || !tag) return;
  
  const templates = loadTemplates();
  const tpls = templates.filter(t => t.tag === tag);
  const col = TAG_COLORS[tag] || TAG_COLORS.meeting;
  
  const dropdown = document.createElement('div');
  dropdown.className = 'sch-pm-dropdown';
  dropdown.id = 'schPmDropdown';
  
  let html = \`<div class="sch-pm-dropdown-header">
    <span class="dp-header-dot" style="background:\${col.text}"></span>
    \${TAG_LABELS[tag]} — \${tpls.length} template\${tpls.length !== 1 ? 's' : ''}
  </div>\`;
  
  if (tpls.length === 0) {
    html += \`<span class="sch-pm-dropdown-empty">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
      No templates in this category
    </span>\`;
  } else {
    // Group templates by subcategory
    const subcats = SUBCATEGORIES[tag] || [];
    const grouped = {};
    const uncategorized = [];
    for (const tpl of tpls) {
      if (tpl.subcategory && subcats.includes(tpl.subcategory)) {
        if (!grouped[tpl.subcategory]) grouped[tpl.subcategory] = [];
        grouped[tpl.subcategory].push(tpl);
      } else {
        uncategorized.push(tpl);
      }
    }
    
    // Render grouped templates
    for (const subcat of subcats) {
      const groupTpls = grouped[subcat];
      if (!groupTpls || groupTpls.length === 0) continue;
      html += \`<div class="sch-pm-subcat-group">
        <span class="sch-pm-subcat-label">\${subcat}</span>
        <div class="sch-pm-subcat-pills">\`;
      for (const tpl of groupTpls) {
        html += renderPmPill(tpl, col);
      }
      html += \`</div></div>\`;
    }
    
    // Render uncategorized templates
    if (uncategorized.length > 0) {
      html += \`<div class="sch-pm-subcat-group">
        <span class="sch-pm-subcat-label">Other</span>
        <div class="sch-pm-subcat-pills">\`;
      for (const tpl of uncategorized) {
        html += renderPmPill(tpl, col);
      }
      html += \`</div></div>\`;
    }
  }
  
  dropdown.innerHTML = html;
  pm.appendChild(dropdown);
  
  // Event handlers for pills
  dropdown.querySelectorAll('.sch-pm-dropdown-pill').forEach(pill => {
    pill.addEventListener('click', (e) => {
      if (e.target.closest('[data-delete-template]') || e.target.closest('[data-edit-template]')) return;
      const id = pill.dataset.templateId;
      const tpl = tpls.find(t => t.id === id);
      if (tpl) { showCmdPalette(); if (dom.cmdInput) { dom.cmdInput.value = tpl.title || tpl.name; dom.cmdInput.focus(); } }
    });
    const editBtn = pill.querySelector('[data-edit-template]');
    if (editBtn) editBtn.addEventListener('click', (e) => { e.stopPropagation(); startEditTemplate(pill, pill.dataset.templateId); });
    const delBtn = pill.querySelector('[data-delete-template]');
    if (delBtn) delBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const name = pill.querySelector('.dp-name')?.textContent || 'template';
      if (confirm(\`Delete template \` + JSON.stringify(name) + '?')) {
        deleteTemplate(pill.dataset.templateId);
      }
    });
    pill.addEventListener('mousedown', (e) => {
      if (e.button !== 0 || e.target.closest('[data-delete-template]') || e.target.closest('[data-edit-template]')) return;
      startDrag(e, pill);
    });
  });
  
  // Close on outside click
  setTimeout(() => document.addEventListener('click', closePmDropdown), 0);
}`;
  js = js.substring(0, dropOld.start) + dropNew + js.substring(dropOld.end);
  console.log('✓ Updated showPmDropdown with subcategory groups');
}

// ============================================================
// 3. Add renderPmPill helper function (insert before showPmDropdown)
// ============================================================
if (!js.includes('function renderPmPill')) {
  const insertBefore = 'function showPmDropdown(tag) {';
  const idx = js.indexOf(insertBefore);
  if (idx >= 0) {
    const helper = `
// ─── RENDER PILL HELPER (for subcategory groups) ─────────────
function renderPmPill(tpl, col) {
  const dur = formatDuration(tpl.duration);
  return \`<button class="sch-pm-dropdown-pill" data-template-id="\${tpl.id}"
    data-tag="\${tpl.tag}" data-duration="\${tpl.duration}" data-template-title="\${escapeHtml(tpl.title || tpl.name)}"
    style="--dp-accent:\${col.text}">
    <span class="dp-dot" style="background:\${col.text}"></span>
    <span class="dp-name">\${escapeHtml(tpl.name)}</span>
    <span class="dp-dur">\${dur}</span>
    <span class="dp-edit" data-edit-template="\${tpl.id}" title="Edit template">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
    </span>
    <span class="dp-del" data-delete-template="\${tpl.id}" title="Delete template">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
    </span>
  </button>\`;
}
`;
    js = js.substring(0, idx) + helper + js.substring(idx);
    console.log('✓ Added renderPmPill helper function');
  }
}

// ============================================================
// 4. UPDATE startDrag to handle chip drag (tag-only, no task)
// ============================================================
// The chip drag is already partially handled by the mousedown in renderSchTemplates
// which calls startDrag with a fake pill. The existing quickadd handling in startDrag
// will work because the fake pill has dataset.tag, dataset.duration, dataset.templateTitle.

// ============================================================
// 5. UPDATE saveAddTemplate - include subcategory
// ============================================================
const saveOld = findFunc(js, 'saveAddTemplate');
if (saveOld) {
  const saveNew = `function saveAddTemplate() {
  const nameEl = document.getElementById('tplAddName');
  const titleEl = document.getElementById('tplAddTitle');
  if (!nameEl || !titleEl) return;
  
  const name = nameEl.value.trim();
  const title = titleEl.value.trim() || name;
  if (!name) {
    nameEl.focus();
    nameEl.classList.add('tpl-add-input-error');
    setTimeout(() => nameEl.classList.remove('tpl-add-input-error'), 2000);
    return;
  }
  
  const tag = document.querySelector('#tplAddTagPills .tf-tag.active')?.dataset?.tag || 'deep-work';
  const durEl = document.querySelector('.tpl-add-dur.active');
  const duration = durEl ? parseInt(durEl.dataset.minutes) : 60;
  
  // Get subcategory
  const subcatEl = document.getElementById('tplAddSubcategory');
  const subcategory = subcatEl ? subcatEl.value : '';
  
  const templates = loadTemplates();
  const newTpl = {
    id: 'tpl-' + uid(),
    name,
    title,
    tag,
    subcategory: subcategory || undefined,
    duration,
    priority: 3,
  };
  templates.push(newTpl);
  saveTemplates(templates);
  renderSchTemplates();
  closeAddTemplatePopup();
  showToast(\`Template "\${escapeHtml(name)}" created\`, 'success');
}`;
  js = js.substring(0, saveOld.start) + saveNew + js.substring(saveOld.end);
  console.log('✓ Updated saveAddTemplate with subcategory');
}

// ============================================================
// 6. UPDATE openAddTemplatePopup - reset subcategory
// ============================================================
const openOld = findFunc(js, 'openAddTemplatePopup');
if (openOld) {
  // Insert subcategory reset before the closing of the function
  const openNew = openOld.body.replace(
    `document.getElementById('tplAddName').value = '';
  document.getElementById('tplAddTitle').value = '';`,
    `document.getElementById('tplAddName').value = '';
  document.getElementById('tplAddTitle').value = '';
  // Reset subcategory dropdown
  const subcatEl = document.getElementById('tplAddSubcategory');
  if (subcatEl) { subcatEl.innerHTML = '<option value="">Any</option>'; subcatEl.value = ''; }`
  );
  js = js.substring(0, openOld.start) + openNew + js.substring(openOld.end);
  console.log('✓ Updated openAddTemplatePopup with subcategory reset');
}

// ============================================================
// 7. UPDATE startEditTemplate - include subcategory field
// ============================================================
const editOld = findFunc(js, 'startEditTemplate');
if (editOld) {
  // Add subcategory field after the duration buttons in the edit popup
  let editNew = editOld.body;
  
  // Add subcategory dropdown HTML after duration buttons
  const durButtonsEnd = editNew.indexOf(`<div class="tpl-edit-popup-actions">`);
  if (durButtonsEnd >= 0) {
    const subcatField = `
      <div class="tf-group">
        <label class="tf-label">Subcategory</label>
        <select id="tplEditSubcategory" class="form-input">
          <option value="">None</option>
        </select>
      </div>
      `;
    editNew = editNew.substring(0, durButtonsEnd) + subcatField + editNew.substring(durButtonsEnd);
  }
  
  // Add subcategory population + save logic
  editNew = editNew.replace(
    `// Focus name field
    document.getElementById('tplEditName')?.focus();`,
    `// Populate subcategory dropdown
    const editSubcat = document.getElementById('tplEditSubcategory');
    if (editSubcat) {
      const subs = SUBCATEGORIES[tpl.tag] || [];
      editSubcat.innerHTML = '<option value="">None</option>' + subs.map(s => \`<option value="\${s}"\${s === tpl.subcategory ? ' selected' : ''}>\${s}</option>\`).join('');
    }
    // Focus name field
    document.getElementById('tplEditName')?.focus();`
  );
  
  // Update tag click to refresh subcategory dropdown
  editNew = editNew.replace(
    `popup.querySelectorAll('#tplEditTagPills .tf-tag').forEach(p => {
    p.addEventListener('click', () => {
      popup.querySelectorAll('#tplEditTagPills .tf-tag').forEach(b => b.classList.remove('active'));
      p.classList.add('active');
    });
  });`,
    `popup.querySelectorAll('#tplEditTagPills .tf-tag').forEach(p => {
    p.addEventListener('click', () => {
      popup.querySelectorAll('#tplEditTagPills .tf-tag').forEach(b => b.classList.remove('active'));
      p.classList.add('active');
      // Refresh subcategory dropdown for new tag
      const editSubcat2 = document.getElementById('tplEditSubcategory');
      if (editSubcat2) {
        const newTag = p.dataset.tag;
        const newSubs = SUBCATEGORIES[newTag] || [];
        editSubcat2.innerHTML = '<option value="">None</option>' + newSubs.map(s => \`<option value="\${s}">\${s}</option>\`).join('');
      }
    });
  });`
  );
  
  // Update save to include subcategory
  editNew = editNew.replace(
    `tpl.name = name;
    tpl.title = title;
    tpl.tag = tag;
    tpl.duration = duration;`,
    `tpl.name = name;
    tpl.title = title;
    tpl.tag = tag;
    tpl.duration = duration;
    const editSubcatVal = document.getElementById('tplEditSubcategory');
    tpl.subcategory = editSubcatVal ? editSubcatVal.value || undefined : tpl.subcategory;`
  );
  
  js = js.substring(0, editOld.start) + editNew + js.substring(editOld.end);
  console.log('✓ Updated startEditTemplate with subcategory');
}

// ============================================================
// 8. UPDATE bindEvents - update template add popup tag pills to also refresh subcategory dropdown
// ============================================================
// This is already handled by the chip click event bubbling

fs.writeFileSync(jsPath, js, 'utf8');
console.log('✓ schedule.js saved');
