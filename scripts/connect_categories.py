#!/usr/bin/env python3
"""Connect category editing across schedule and activities pages.

Edits:
1. shared.js - addCustomCategory: mirror to custom tags + cardColors
2. shared.js - removeCustomCategory: mirror removal + cardColors cleanup
3. shared.js - initCustomCategories: also pick up custom tags
4. shared.js - add updateCustomCategory function
5. shared.js - add openCategoryEditPopup function
6. schedule.js - add edit button to pill chips
7. activities.js - add edit button to column headers
8. style.css - add CSS for edit popup
"""

import re
import sys
from pathlib import Path

PROJECT = Path(__file__).resolve().parent.parent

def read_file(path):
    with open(PROJECT / path, 'r', encoding='utf-8') as f:
        return f.read()

def write_file(path, content):
    with open(PROJECT / path, 'w', encoding='utf-8') as f:
        f.write(content)

# ─── 1. SHARED.JS: addCustomCategory ───────────────────
shared = read_file('shared.js')

old_add = '''function addCustomCategory(label, color) {
  const cats = loadCustomCategories();
  const id = 'cat-' + uid();
  cats.push({ id, label, color });
  saveCustomCategories(cats);
  TAG_ORDER.push(id);
  TAG_LABELS[id] = label;
  TAG_COLORS[id] = { text: color, bg: lightenColor(color, 0.85) };
  const subs = loadSubcategories();
  subs[id] = [];
  saveSubcategories(subs);
  return id;
}'''

new_add = '''function addCustomCategory(label, color) {
  const cats = loadCustomCategories();
  const id = 'cat-' + uid();
  cats.push({ id, label, color });
  saveCustomCategories(cats);
  // Mirror to custom tags for activities compatibility
  const customTags = loadCustomTags();
  if (!customTags.find(ct => ct.id === id)) {
    customTags.push({ id, name: label, color });
    saveCustomTags(customTags);
  }
  TAG_ORDER.push(id);
  TAG_LABELS[id] = label;
  TAG_COLORS[id] = { text: color, bg: lightenColor(color, 0.85) };
  cardColors[id] = { light: color, dark: lightenColor(color, 0.45) };
  applyCardColors();
  injectCustomTagStyles();
  const subs = loadSubcategories();
  subs[id] = [];
  saveSubcategories(subs);
  return id;
}'''

assert old_add in shared, "addCustomCategory not found!"
shared = shared.replace(old_add, new_add, 1)
print("[OK] addCustomCategory updated")

# ─── 2. SHARED.JS: removeCustomCategory ────────────────
old_remove = '''function removeCustomCategory(id) {
  let cats = loadCustomCategories();
  cats = cats.filter(c => c.id !== id);
  saveCustomCategories(cats);
  const idx = TAG_ORDER.indexOf(id);
  if (idx !== -1) TAG_ORDER.splice(idx, 1);
  delete TAG_LABELS[id];
  delete TAG_COLORS[id];
  const subs = loadSubcategories();
  delete subs[id];
  saveSubcategories(subs);
  state.tasks = state.tasks.filter(t => t.tag !== id);
  saveTasks();
}'''

new_remove = '''function removeCustomCategory(id) {
  let cats = loadCustomCategories();
  cats = cats.filter(c => c.id !== id);
  saveCustomCategories(cats);
  // Mirror removal from custom tags
  let customTags = loadCustomTags();
  customTags = customTags.filter(ct => ct.id !== id);
  saveCustomTags(customTags);
  const idx = TAG_ORDER.indexOf(id);
  if (idx !== -1) TAG_ORDER.splice(idx, 1);
  delete TAG_LABELS[id];
  delete TAG_COLORS[id];
  delete cardColors[id];
  const subs = loadSubcategories();
  delete subs[id];
  saveSubcategories(subs);
  state.tasks = state.tasks.filter(t => t.tag !== id);
  saveTasks();
  applyCardColors();
  injectCustomTagStyles();
}'''

assert old_remove in shared, "removeCustomCategory not found!"
shared = shared.replace(old_remove, new_remove, 1)
print("[OK] removeCustomCategory updated")

# ─── 3. SHARED.JS: initCustomCategories ─────────────────
old_init = '''function initCustomCategories() {
  const custom = loadCustomCategories();
  for (const cat of custom) {
    if (!TAG_ORDER.includes(cat.id)) {
      TAG_ORDER.push(cat.id);
      TAG_LABELS[cat.id] = cat.label;
      TAG_COLORS[cat.id] = { text: cat.color, bg: lightenColor(cat.color, 0.85) };
    }
  }
}'''

new_init = '''function initCustomCategories() {
  const custom = loadCustomCategories();
  for (const cat of custom) {
    if (!TAG_ORDER.includes(cat.id)) {
      TAG_ORDER.push(cat.id);
      TAG_LABELS[cat.id] = cat.label;
      TAG_COLORS[cat.id] = { text: cat.color, bg: lightenColor(cat.color, 0.85) };
    }
    if (!cardColors[cat.id]) {
      cardColors[cat.id] = { light: cat.color, dark: lightenColor(cat.color, 0.45) };
    }
  }
  // Also pick up any tags only stored in custom tags (for backward compat)
  const customTags = loadCustomTags();
  for (const ct of customTags) {
    if (TAG_ORDER.includes(ct.id)) continue;
    if (custom.find(c => c.id === ct.id)) continue;
    TAG_ORDER.push(ct.id);
    TAG_LABELS[ct.id] = ct.name;
    TAG_COLORS[ct.id] = { text: ct.color, bg: lightenColor(ct.color, 0.85) };
    if (!cardColors[ct.id]) {
      cardColors[ct.id] = { light: ct.color, dark: lightenColor(ct.color, 0.45) };
    }
  }
}

// ─── UPDATE / EDIT CUSTOM CATEGORY ──────────────────────
function updateCustomCategory(id, name, color) {
  // Update in categories storage
  let cats = loadCustomCategories();
  const cat = cats.find(c => c.id === id);
  if (cat) {
    cat.label = name;
    cat.color = color;
    saveCustomCategories(cats);
  }
  // Mirror to custom tags
  let customTags = loadCustomTags();
  const ct = customTags.find(t => t.id === id);
  if (ct) {
    ct.name = name;
    ct.color = color;
  } else {
    customTags.push({ id, name, color });
  }
  saveCustomTags(customTags);
  // Update in-memory maps
  TAG_LABELS[id] = name;
  TAG_COLORS[id] = { text: color, bg: lightenColor(color, 0.85) };
  cardColors[id] = { light: color, dark: lightenColor(color, 0.45) };
  applyCardColors();
  injectCustomTagStyles();
}

// ─── CATEGORY EDIT POPUP ────────────────────────────────
function openCategoryEditPopup(anchorEl, tagId) {
  const existing = document.getElementById('catEditPopup');
  if (existing) existing.remove();

  const curCat = loadCustomCategories().find(c => c.id === tagId) || loadCustomTags().find(t => t.id === tagId);
  if (!curCat) return;

  const popup = document.createElement('div');
  popup.id = 'catEditPopup';
  popup.className = 'cat-edit-popup';
  popup.innerHTML = `
    <div class="cat-edit-popup-header">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
      <span>Edit Category</span>
    </div>
    <div class="cat-edit-popup-body">
      <div class="tf-group">
        <label class="tf-label">Name</label>
        <input type="text" id="catEditName" class="form-input" value="${escapeHtml(curCat.label || curCat.name)}" autocomplete="off" maxlength="30">
      </div>
      <div class="tf-group">
        <label class="tf-label">Color</label>
        <div class="cat-edit-color-row">
          <input type="color" id="catEditColor" value="${curCat.color || '#6366f1'}">
        </div>
      </div>
      <div class="cat-edit-actions">
        <button class="tf-btn tf-btn-ghost" id="catEditCancel">Cancel</button>
        <button class="tf-btn tf-btn-primary" id="catEditSave">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg>
          Save
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(popup);

  requestAnimationFrame(() => {
    const rect = anchorEl.getBoundingClientRect();
    const pw = 240, ph = popup.offsetHeight || 280;
    let left = rect.right - pw;
    let top = rect.bottom + 4;
    if (left + pw > window.innerWidth - 8) left = window.innerWidth - pw - 8;
    if (left < 8) left = 8;
    if (top + ph > window.innerHeight - 8) top = rect.top - ph - 4;
    if (top < 8) top = 8;
    popup.style.left = left + 'px';
    popup.style.top = top + 'px';
    document.getElementById('catEditName')?.focus();
    document.getElementById('catEditName')?.select();
  });

  function saveEdit() {
    const nameEl = document.getElementById('catEditName');
    const colorEl = document.getElementById('catEditColor');
    if (!nameEl || !colorEl) return;
    const newName = nameEl.value.trim();
    if (!newName) {
      nameEl.focus();
      nameEl.classList.add('tpl-add-input-error');
      setTimeout(() => nameEl.classList.remove('tpl-add-input-error'), 2000);
      return;
    }
    updateCustomCategory(tagId, newName, colorEl.value);
    popup.remove();
    // Trigger re-render on both pages
    if (typeof renderSchTemplates === 'function') renderSchTemplates();
    if (typeof renderTags === 'function') renderTags();
    if (typeof renderActivities === 'function') renderActivities();
    if (typeof renderCalendar === 'function') renderCalendar();
    showToast(`Category updated to "<strong>${escapeHtml(newName)}</strong>"`, 'success', 2000);
  }

  document.getElementById('catEditCancel')?.addEventListener('click', () => popup.remove());
  document.getElementById('catEditSave')?.addEventListener('click', saveEdit);
  popup.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { popup.remove(); }
    if (e.key === 'Enter') { e.preventDefault(); saveEdit(); }
  });

  // Close on outside click
  setTimeout(() => {
    function closeOnOutside(e) {
      if (!popup.contains(e.target) && !anchorEl.contains(e.target)) {
        popup.remove();
        document.removeEventListener('click', closeOnOutside);
      }
    }
    document.addEventListener('click', closeOnOutside);
  }, 0);
}'''

assert old_init in shared, "initCustomCategories not found!"
shared = shared.replace(old_init, new_init, 1)
print("[OK] initCustomCategories + updateCustomCategory + openCategoryEditPopup added")

write_file('shared.js', shared)
print("[OK] shared.js saved")

# ─── 6. SCHEDULE.JS: edit button on pill chips ──────────
sched = read_file('schedule.js')

old_chip = '''      ${!isBuiltin ? `<button class="sch-pm-chip-del" data-del-tag="${tag}" title="Delete category">✕</button>` : ''}
    </button>`;'''

new_chip = '''      ${!isBuiltin ? `<button class="sch-pm-chip-edit" data-edit-tag="${tag}" title="Edit category">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
        </button>` : ''}
      ${!isBuiltin ? `<button class="sch-pm-chip-del" data-del-tag="${tag}" title="Delete category">✕</button>` : ''}
    </button>`;'''

assert old_chip in sched, "Schedule chip HTML not found!"
sched = sched.replace(old_chip, new_chip, 1)

# Add edit button handler in renderSchTemplates (after delete handler)
old_del_handler_end = '''  // Delete button on custom category chips
  container.querySelectorAll('.sch-pm-chip-del').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const tag = btn.dataset.delTag;
      if (!tag) return;
      const label = TAG_LABELS[tag] || tag;
      if (confirm(`Delete category "${label}"? All tasks with this category will also be permanently removed.`)) {
        removeCustomCategory(tag);
        if (state._openPmTag === tag) {
          state._openPmTag = TAG_ORDER[0] || null;
        }
        renderSchTemplates();
        if (state._openPmTag) showSubcategoryBubble(state._openPmTag);
        renderCalendar();
        showToast(`"${label}" deleted`, 'info', 2000);
      }
    });
  });

}'''

new_del_handler_end = '''  // Delete button on custom category chips
  container.querySelectorAll('.sch-pm-chip-del').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const tag = btn.dataset.delTag;
      if (!tag) return;
      const label = TAG_LABELS[tag] || tag;
      if (confirm(`Delete category "${label}"? All tasks with this category will also be permanently removed.`)) {
        removeCustomCategory(tag);
        if (state._openPmTag === tag) {
          state._openPmTag = TAG_ORDER[0] || null;
        }
        renderSchTemplates();
        if (state._openPmTag) showSubcategoryBubble(state._openPmTag);
        renderCalendar();
        showToast(`"${label}" deleted`, 'info', 2000);
      }
    });
  });

  // Edit button on custom category chips
  container.querySelectorAll('.sch-pm-chip-edit').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const tag = btn.dataset.editTag;
      if (!tag) return;
      openCategoryEditPopup(btn, tag);
    });
  });

}'''

assert old_del_handler_end in sched, "Schedule delete handler end not found!"
sched = sched.replace(old_del_handler_end, new_del_handler_end, 1)
write_file('schedule.js', sched)
print("[OK] schedule.js updated")

# ─── 7. ACTIVITIES.JS: edit button on column headers ────
act = read_file('activities.js')

old_header = '''        ${!isBuiltin ? `<button class="tag-col-del" data-del-cat="${tag}" title="Delete category">✕</button>` : ''}
        <button class="btn btn-ghost tag-color-btn" data-tag="${tag}" title="Change card color" style="margin-left:auto;padding:2px;line-height:0">'''

new_header = '''        ${!isBuiltin ? `<button class="tag-col-edit" data-edit-cat="${tag}" title="Edit category">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
        </button>` : ''}
        ${!isBuiltin ? `<button class="tag-col-del" data-del-cat="${tag}" title="Delete category">✕</button>` : ''}
        <button class="btn btn-ghost tag-color-btn" data-tag="${tag}" title="Change card color" style="margin-left:auto;padding:2px;line-height:0">'''

assert old_header in act, "Activities header HTML not found!"
act = act.replace(old_header, new_header, 1)

# Add edit button handler (after delete category handler)
old_del_cat_handler_end = '''  // Delete category button
  boardInner.querySelectorAll('[data-del-cat]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const tag = btn.dataset.delCat;
      if (!tag || BUILTIN_TAGS.includes(tag)) return;
      const label = TAG_LABELS[tag] || tag;
      if (confirm(`Delete category "${label}"? All tasks with this category will also be deleted.`)) {
        removeCustomCategory(tag);
        renderActivities();
        showToast(`"${label}" deleted`, 'info', 2000);
      }
    });
  });

  // Add task button'''

new_del_cat_handler_end = '''  // Delete category button
  boardInner.querySelectorAll('[data-del-cat]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const tag = btn.dataset.delCat;
      if (!tag || BUILTIN_TAGS.includes(tag)) return;
      const label = TAG_LABELS[tag] || tag;
      if (confirm(`Delete category "${label}"? All tasks with this category will also be deleted.`)) {
        removeCustomCategory(tag);
        renderActivities();
        showToast(`"${label}" deleted`, 'info', 2000);
      }
    });
  });

  // Edit category button
  boardInner.querySelectorAll('[data-edit-cat]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const tag = btn.dataset.editCat;
      if (!tag || BUILTIN_TAGS.includes(tag)) return;
      openCategoryEditPopup(btn, tag);
    });
  });

  // Add task button'''

assert old_del_cat_handler_end in act, "Activities delete handler end not found!"
act = act.replace(old_del_cat_handler_end, new_del_cat_handler_end, 1)
write_file('activities.js', act)
print("[OK] activities.js updated")

# ─── 8. STYLE.CSS: add edit popup CSS ──────────────────
css = read_file('style.css')

edit_popup_css = '''

/* ─── CATEGORY EDIT POPUP ───────────────────────────── */
.cat-edit-popup {
  position: fixed;
  z-index: 9999;
  background: var(--surface-container-high);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 16px 20px;
  width: 240px;
  box-shadow: var(--shadow-lg);
  animation: catEditPopupIn 200ms cubic-bezier(0.16, 1, 0.3, 1);
}
@keyframes catEditPopupIn {
  from { opacity: 0; transform: translateY(8px) scale(0.96); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}
.cat-edit-popup-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--border-subtle);
}
.cat-edit-popup-header svg {
  flex-shrink: 0;
  opacity: 0.6;
}
.cat-edit-popup-body .tf-group {
  margin-bottom: 10px;
}
.cat-edit-popup-body .tf-label {
  display: block;
  font-size: 0.6rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--text-tertiary);
  margin-bottom: 4px;
}
.cat-edit-popup-body .form-input {
  width: 100%;
  padding: 6px 10px;
  border: 1px solid var(--border-subtle);
  border-radius: 6px;
  background: var(--bg-primary);
  color: var(--text-primary);
  font-size: 0.82rem;
  font-family: var(--font-family);
  outline: none;
  transition: border-color var(--t-fast);
  box-sizing: border-box;
}
.cat-edit-popup-body .form-input:focus {
  border-color: var(--border-focus);
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--primary) 15%, transparent);
}
.cat-edit-color-row {
  display: flex;
  align-items: center;
  gap: 8px;
}
.cat-edit-color-row input[type="color"] {
  width: 32px;
  height: 32px;
  border: 2px solid var(--border-subtle);
  border-radius: 8px;
  cursor: pointer;
  padding: 0;
  background: transparent;
}
.cat-edit-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  margin-top: 12px;
  padding-top: 10px;
  border-top: 1px solid var(--border-subtle);
}

/* ─── Schedule pill edit button ─────────────────────── */
.sch-pm-chip-edit {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  border: none;
  background: transparent;
  color: var(--text-tertiary);
  cursor: pointer;
  border-radius: 3px;
  padding: 0;
  opacity: 0;
  transition: all var(--t-fast);
  flex-shrink: 0;
  margin-left: 2px;
}
.sch-pm-chip:hover .sch-pm-chip-edit {
  opacity: 0.6;
}
.sch-pm-chip-edit:hover {
  opacity: 1 !important;
  color: var(--accent);
  background: color-mix(in srgb, var(--accent) 12%, transparent);
}
.sch-pm-chip-edit svg {
  width: 10px;
  height: 10px;
}

/* ─── Activities column edit button ─────────────────── */
.tag-col-edit {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  border: none;
  background: transparent;
  color: var(--text-tertiary);
  cursor: pointer;
  border-radius: 3px;
  padding: 0;
  opacity: 0;
  transition: all var(--t-fast);
  flex-shrink: 0;
  margin: 0 1px;
}
.tag-column-header:hover .tag-col-edit {
  opacity: 0.5;
}
.tag-col-edit:hover {
  opacity: 1 !important;
  color: var(--accent);
  background: color-mix(in srgb, var(--accent) 12%, transparent);
}
.tag-col-edit svg {
  width: 10px;
  height: 10px;
}
'''

# Insert before the last closing of the CSS file or near similar popup styles
# Find a good insertion point - near the add-cat-popup styles
anchor = '.tag-column[data-board-tag='
if anchor in css:
    idx = css.find(anchor)
    # Find the nearest style section boundary before this
    # Just append to the file instead
    css += edit_popup_css
else:
    css += edit_popup_css

write_file('style.css', css)
print("[OK] style.css updated")

print("\n✅ All edits complete!")
