/* ============================================
   Havën Schedule — Hub Visuals (bento canvas,
   edit mode, ADD/HIDE popups, drag & resize)
   Shared across all pages
   ============================================ */

/* ─── Snap helper (20px grid) ─────────────── */
function snap(v) { return Math.round(v / 20) * 20; }

/* ─── Storage keys ─────────────────────────── */
const HUB_LAYOUT_KEY = 'haven-schedule-hub-layout';
const HUB_EDIT_KEY = 'haven-hub-edit';
const HUB_VIS_KEY = 'haven-hub-visibility';
const HUB_CONTENT_KEY = 'haven-hub-content';

let hubEditMode = localStorage.getItem(HUB_EDIT_KEY) === 'true';
let _bentoUidCounter = 0;
function _nextUid() { return 'b' + (++_bentoUidCounter) + '_' + Date.now(); }

/* ─── Section drag/drop reordering ─────────── */
function initHubLayout() {
  const container = document.querySelector('.hub-layout');
  if (!container) return;

  const savedOrder = loadHubLayout();
  if (savedOrder && savedOrder.length) {
    const wraps = container.querySelectorAll('.hub-section-wrap');
    const wrapMap = {};
    wraps.forEach(w => { wrapMap[w.dataset.hubSection] = w; });
    savedOrder.forEach(id => {
      const w = wrapMap[id];
      if (w) container.appendChild(w);
    });
  }

  container.querySelectorAll('.hub-section-drag-handle').forEach(handle => {
    handle.addEventListener('dragstart', onDragStart);
    handle.addEventListener('dragend', onDragEnd);
  });

  container.querySelectorAll('.hub-section-wrap').forEach(wrap => {
    wrap.addEventListener('dragover', onDragOver);
    wrap.addEventListener('dragenter', onDragEnter);
    wrap.addEventListener('dragleave', onDragLeave);
    wrap.addEventListener('drop', onDrop);
  });

  updateSectionHandles();
}

function loadHubLayout() {
  try {
    const raw = localStorage.getItem(HUB_LAYOUT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function saveHubLayout(order) {
  localStorage.setItem(HUB_LAYOUT_KEY, JSON.stringify(order));
}

let dragSrcWrap = null;

function onDragStart(e) {
  dragSrcWrap = e.target.closest('.hub-section-wrap');
  if (!dragSrcWrap) return;
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/plain', dragSrcWrap.dataset.hubSection);
  dragSrcWrap.classList.add('hub-section-dragging');
}

function onDragEnd(e) {
  e.target.closest('.hub-section-wrap')?.classList.remove('hub-section-dragging');
  document.querySelectorAll('.hub-section-drag-over').forEach(el => el.classList.remove('hub-section-drag-over'));
  dragSrcWrap = null;
}

function onDragOver(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
}

function onDragEnter(e) {
  e.preventDefault();
  const wrap = e.target.closest('.hub-section-wrap');
  if (wrap && wrap !== dragSrcWrap) wrap.classList.add('hub-section-drag-over');
}

function onDragLeave(e) {
  const wrap = e.target.closest('.hub-section-wrap');
  if (wrap && wrap !== dragSrcWrap) wrap.classList.remove('hub-section-drag-over');
}

function onDrop(e) {
  e.preventDefault();
  const targetWrap = e.target.closest('.hub-section-wrap');
  if (!targetWrap || !dragSrcWrap || targetWrap === dragSrcWrap) return;
  targetWrap.classList.remove('hub-section-drag-over');

  const container = document.querySelector('.hub-layout');
  if (!container) return;

  container.insertBefore(dragSrcWrap, targetWrap);

  const order = [];
  container.querySelectorAll('.hub-section-wrap').forEach(w => order.push(w.dataset.hubSection));
  saveHubLayout(order);
}

/* ─── Bento layout normalization ───────────── */
function normalizeBentoLayout(layout, parent) {
  const result = [];
  let maxY = 24;
  (layout || []).forEach(item => {
    const norm = typeof item === 'string' ? {t: item} : {...item};
    if (!norm.uid) norm.uid = _nextUid();
    if (norm.x !== undefined && norm.y !== undefined) {
      maxY = Math.max(maxY, norm.y + (norm.h || 240));
    }
    result.push(norm);
  });
  result.forEach(item => {
    if (item.hidden === undefined) item.hidden = false;
    if (item.x === undefined || item.y === undefined) {
      item.x = snap(24);
      item.y = snap(maxY);
      maxY += (item.h || 240) + 24;
    }
    if (item.w === undefined || item.h === undefined) {
      const sizeMap = {s:220, m:320, l:420, xl:540, full:600};
      item.w = snap(sizeMap[item.s] || 320);
      if (item.t === 'images') {
        const imgLookup = item.imageId || 'hub-tulips';
        const oldAspect = parent?.imageAspects?.[imgLookup] || parent?.imageAspect || 'landscape';
        const aspectRatios = {square:1, portrait:0.75, landscape:1.333, wide:1.778, tall:0.5625};
        const ratio = aspectRatios[oldAspect] || 1.333;
        item.h = snap(item.w / ratio);
      } else {
        item.h = snap(280);
      }
      delete item.s;
      if (parent) { delete parent.imageAspect; delete parent.imageAspects; }
    }
  });
  return result;
}

/* ─── Bubble collision push ────────────────── */
function rectsOverlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function resolveBubbleCollisions(layout) {
  layout = layout.filter(i => !i.hidden);
  let dirty = true;
  let maxIter = 30;
  while (dirty && maxIter-- > 0) {
    dirty = false;
    layout.sort((a, b) => a.y - b.y || a.x - b.x);
    for (let i = 0; i < layout.length; i++) {
      for (let j = i + 1; j < layout.length; j++) {
        if (!rectsOverlap(layout[i], layout[j])) continue;
        const pushY = snap(layout[i].y + layout[i].h + 24);
        if (pushY > layout[j].y) {
          layout[j].y = pushY;
          dirty = true;
        }
      }
    }
  }
  return layout;
}

/* ─── Default hub content ──────────────────── */
const HUB_DEFAULTS = {
  greeting: '',
  goals: ['develop emotional maturity', 'go to the gym + workout consistently', 'eat intentionally', 'learn finances via books'],
  priorities: ['mental and physical health', 'academics', 'self-development'],
  quote: { text: 'It takes discipline to be the person you want to be.', author: '' },
  todos: [{ text: 'get driver\'s license', done: false }, { text: 'get gym membership', done: false }],
  habits: ['drink water', 'exercise', 'read'],
  text: 'Write something...',
  notes: '',
  links: [{ label: 'GitHub', url: 'https://github.com' }, { label: 'Reddit', url: 'https://reddit.com' }],
  gallery: [
    { label: 'Schedule', desc: 'Time-blocking grid with drag & drop, AI command palette, and week/month/agenda views.', href: 'schedule.html', icon: 'calendar', color: 'var(--tag-deep-work-text)', bg: 'var(--tag-deep-work-bg)' },
    { label: 'Activities', desc: 'Chronological feed grouped by day with tag and date filters.', href: 'activities.html', icon: 'checklist', color: 'var(--tag-meeting-text)', bg: 'var(--tag-meeting-bg)' },
    { label: 'Activities + Board', desc: 'Timeline and Kanban board merged into one page with a view toggle.', href: 'activities.html', icon: 'tag', color: 'var(--tag-study-text)', bg: 'var(--tag-study-bg)' },
    { label: 'Analytics', desc: 'Charts with category distribution, daily breakdowns, and day-by-day metrics.', href: 'analytics.html', icon: 'chart', color: 'var(--tag-hobby-text)', bg: 'var(--tag-hobby-bg)' },
    { label: 'Goals', desc: 'Track goals with progress bars, sub-tasks, and vision board.', href: 'goals.html', icon: 'star', color: 'var(--tag-deep-work-text)', bg: 'var(--tag-deep-work-bg)' }
  ],
  bentoLayout: [{t:'goals',x:24,y:24},{t:'images',x:24,y:264},{t:'priorities',x:364,y:24},{t:'quote',x:364,y:264},{t:'todos',x:24,y:504}]
};

let hubContent = loadHubContent();

function loadHubContent() {
  const defaults = HUB_DEFAULTS;
  try {
    const raw = localStorage.getItem(HUB_CONTENT_KEY);
    if (raw) {
      const hc = JSON.parse(raw);
      hc.bentoLayout = normalizeBentoLayout(hc.bentoLayout, hc);
      if (!hc.bentoLayout || !hc.bentoLayout.length) hc.bentoLayout = defaults.bentoLayout.map(i => ({...i}));
      if (!hc.gallery) hc.gallery = defaults.gallery.map(g => ({...g}));
      if (!hc.goals) hc.goals = [...defaults.goals];
      if (!hc.priorities) hc.priorities = [...defaults.priorities];
      if (!hc.quote) hc.quote = {...defaults.quote};
      if (!hc.todos) hc.todos = defaults.todos.map(t => ({...t}));
      if (!hc.habits) hc.habits = [...defaults.habits];
      if (hc.notes === undefined) hc.notes = '';
      if (!hc.links) hc.links = defaults.links.map(l => ({...l}));
      return hc;
    }
  } catch {}
  return JSON.parse(JSON.stringify(HUB_DEFAULTS));
}

function saveHubContent() {
  var _hadImages = hubContent._images;
  delete hubContent._images;
  try { localStorage.setItem(HUB_CONTENT_KEY, JSON.stringify(hubContent)); } catch(e) { console.warn('[img] saveHubContent failed:', e); }
  if (_hadImages !== undefined) hubContent._images = _hadImages;
}

function loadHubVisibility() {
  try {
    const raw = localStorage.getItem(HUB_VIS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return {};
}

function saveHubVisibility(vis) {
  try { localStorage.setItem(HUB_VIS_KEY, JSON.stringify(vis)); } catch {}
}

/* ─── Edit mode ────────────────────────────── */
function toggleHubEdit() {
  hubEditMode = !hubEditMode;
  localStorage.setItem(HUB_EDIT_KEY, hubEditMode);
  // Sync shared state.editMode so other components stay consistent
  if (typeof state !== 'undefined' && state) state.editMode = hubEditMode;
  try { applyHubEditMode(); } catch (e) { console.error('applyHubEditMode error:', e); }
}

function applyHubEditMode() {
  const btn = document.getElementById('hubEditToggle');
  if (btn) btn.classList.toggle('active', hubEditMode);
  document.documentElement.classList.toggle('hub-edit', hubEditMode);
  document.querySelectorAll('.hub-section-header').forEach(h => {
    h.classList.toggle('visible', hubEditMode);
  });
  const greetEl = document.getElementById('hubGreeting');
  if (greetEl) greetEl.contentEditable = hubEditMode ? 'true' : 'false';
  if (hubEditMode) greetEl?.classList.add('hub-editable');
  else greetEl?.classList.remove('hub-editable');
  updateSectionHandles();
  renderHubBento();
  renderHubGallery();
  applyHubVisibility();
}

function applyHubVisibility() {
  const vis = loadHubVisibility();
  document.querySelectorAll('.hub-section-wrap').forEach(wrap => {
    const id = wrap.dataset.hubSection;
    if (id === 'bento') return; // always show canvas
    const hidden = vis[id] === false;
    wrap.classList.toggle('hidden-section', hidden);
    const toggle = wrap.querySelector('.hub-section-vis-toggle');
    if (toggle) toggle.textContent = hidden ? '\u25CB' : '\u25C9';
  });
}

function toggleSectionVis(id) {
  if (id === 'bento') return; // canvas can't be hidden
  const vis = loadHubVisibility();
  vis[id] = vis[id] === false ? true : false;
  saveHubVisibility(vis);
  applyHubVisibility();
}

function renderHubGreeting() {
  const el = document.getElementById('hubGreeting');
  if (!el) return;
  if (hubContent.greeting) {
    el.textContent = hubContent.greeting;
  } else {
    const h = new Date().getHours();
    el.textContent = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
  }
}

/* ─── Bento render ─────────────────────────── */
function renderHubBento() {
  // Ensure images are loaded before rendering bubbles (only on first render)
  if (!state.images && typeof loadImages === 'function') loadImages();
  const grid = document.querySelector('.bento-grid');
  if (!grid) return;
  const layout = normalizeBentoLayout(hubContent.bentoLayout, hubContent);
  hubContent.bentoLayout = layout;
  const isEdit = hubEditMode;

  grid.innerHTML = '';

  function bubbleHtml(item) {
    const {t: type, x, y, w, h, uid} = item;
    const e = (s) => escapeHtml(s);
    const resizeHandle = isEdit
      ? `<div class="bento-resize-handle" data-resize-bubble="${uid}"></div>`
      : '';
    const editUI = isEdit
      ? `<div class="bento-bubble-handle" draggable="true">⠿</div><button class="bento-bubble-remove" data-remove-bubble="${uid}">×</button>${resizeHandle}`
      : '';
    const dimStyle = `left:${x}px;top:${y}px;width:${w}px;height:${h}px;overflow:auto`;

    switch (type) {
      case 'goals':
        return `<div class="bento-bubble" data-bubble="${uid}" style="${dimStyle};background:var(--surface-container-low);border-top:2px solid var(--primary);padding:var(--gutter);border:1px solid var(--border-color)">
          ${editUI}
          <div style="font-family:var(--font-sans);font-size:0.75rem;font-weight:600;text-transform:uppercase;letter-spacing:0.1em;color:var(--primary);margin-bottom:var(--gutter)">Goals</div>
          <ul id="hubGoalsList" style="list-style:none;padding:0;margin:0;font-size:0.9rem;line-height:1.6;color:var(--text-primary)">
            ${hubContent.goals.map((g, i) =>
              `<li style="display:flex;gap:var(--space-2);padding:var(--stack-sm) 0;align-items:center;position:relative" data-idx="${i}">
                <span style="color:var(--primary);font-weight:700">${i+1}.</span>
                <span class="${isEdit ? 'hub-editable' : ''}" data-edit="goals" data-idx="${i}">${e(g)}</span>
                ${isEdit ? `<button class="hub-edit-item-btn del" data-del="goals" data-idx="${i}" title="Delete">×</button>` : ''}
              </li>`
            ).join('')}
            ${isEdit ? `<li style="display:flex;gap:var(--space-2);padding:var(--stack-sm) 0"><button class="hub-add-btn" data-add="goals">+ Add goal</button></li>` : ''}
          </ul>
        </div>`;
      case 'images':
        const imgId = item.imageId || 'hub-tulips';
        const imgUrl = item._imgUrl || getImage(imgId);
        const hasImg = !!imgUrl;
        return `<div class="bento-bubble" data-bubble="${uid}" style="${dimStyle};padding:var(--gutter);border:1px solid var(--border-color);background:var(--surface-container)">
          ${editUI}
          <div class="bento-img-wrap" style="width:100%;height:100%" data-img-picker="${imgId}">
            <img data-image-id="${imgId}" src="${e(imgUrl)}" alt="" style="width:100%;height:100%;object-fit:cover;display:${hasImg ? 'block' : 'none'}">
            <div class="bento-img-placeholder" style="display:${hasImg ? 'none' : 'flex'}">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
              <span>Click to add photo</span>
            </div>
          </div>
        </div>`;
      case 'priorities':
        return `<div class="bento-bubble" data-bubble="${uid}" style="${dimStyle};background:var(--surface-container-low);padding:var(--gutter);border:1px solid var(--border-color)">
          ${editUI}
          <div style="font-family:var(--font-sans);font-size:0.75rem;font-weight:600;text-transform:uppercase;letter-spacing:0.1em;color:var(--text-tertiary);margin-bottom:var(--gutter)">Priorities</div>
          <div id="hubPrioritiesList" style="display:flex;flex-direction:column;gap:var(--stack-sm)">
            ${hubContent.priorities.map((p, i) =>
              `<div style="display:flex;align-items:center;gap:var(--space-2);padding:var(--stack-md);background:var(--surface-container);border-radius:var(--radius-sm);position:relative" data-idx="${i}">
                <span class="material-symbols-outlined" style="font-size:1rem;color:var(--primary)">radio_button_checked</span>
                <span class="${isEdit ? 'hub-editable' : ''}" style="font-size:0.82rem" data-edit="priorities" data-idx="${i}">${e(p)}</span>
                ${isEdit ? `<button class="hub-edit-item-btn del" data-del="priorities" data-idx="${i}" title="Delete">×</button>` : ''}
              </div>`
            ).join('')}
            ${isEdit ? `<div style="display:flex;align-items:center;gap:var(--space-2);padding:var(--stack-sm) 0"><button class="hub-add-btn" data-add="priorities">+ Add priority</button></div>` : ''}
          </div>
        </div>`;
      case 'quote':
        return `<div class="bento-bubble" data-bubble="${uid}" style="${dimStyle};background:var(--surface-container-lowest);padding:var(--gutter);border:1px solid var(--border-color)">
          ${editUI}
          <div style="font-family:var(--font-sans);font-size:0.75rem;font-weight:600;text-transform:uppercase;letter-spacing:0.1em;color:var(--text-tertiary);margin-bottom:var(--gutter)">Quote</div>
          <div class="hub-bento-quote${isEdit ? ' hub-editable' : ''}" style="font-family:var(--font-serif);font-size:1.1rem;font-style:italic;line-height:1.5;color:var(--secondary);padding:var(--stack-md) 0" ${isEdit ? 'contenteditable="true"' : ''}>${isEdit ? e(hubContent.quote.text) : '\u201C' + e(hubContent.quote.text) + '\u201D'}</div>
          <div style="width:48px;height:1px;background:var(--outline);margin-top:var(--stack-md)"></div>
        </div>`;
      case 'todos':
        return `<div class="bento-bubble" data-bubble="${uid}" style="${dimStyle};background:var(--surface-container-low);padding:var(--gutter);border:1px solid var(--border-color)">
          ${editUI}
          <div style="font-family:var(--font-sans);font-size:0.75rem;font-weight:600;text-transform:uppercase;letter-spacing:0.1em;color:var(--text-tertiary);margin-bottom:var(--gutter)">To Do's</div>
          <div id="hubTodoList" style="display:flex;flex-direction:column;gap:var(--stack-sm)">
            ${hubContent.todos.map((t, i) =>
              `<div style="display:flex;align-items:center;gap:var(--space-2);padding:var(--stack-sm) 0;border-bottom:1px solid var(--border-subtle);font-size:0.85rem;position:relative" data-idx="${i}">
                <span style="color:var(--primary);font-weight:700;margin-right:var(--space-1)">${i+1}.</span>
                <span class="${isEdit ? 'hub-editable' : ''}" data-edit="todos" data-idx="${i}" style="${t.done ? 'text-decoration:line-through;opacity:0.5' : ''}">${e(t.text)}</span>
                ${isEdit ? `<button class="hub-edit-item-btn del" data-del="todos" data-idx="${i}" title="Delete">×</button>` : ''}
              </div>`
            ).join('')}
            ${isEdit ? `<div style="padding:var(--stack-sm) 0"><button class="hub-add-btn" data-add="todos">+ Add to-do</button></div>` : ''}
          </div>
        </div>`;
      case 'text':
        return `<div class="bento-bubble" data-bubble="${uid}" style="${dimStyle};background:var(--surface-container);padding:var(--gutter);border:1px solid var(--border-color)">
          ${editUI}
          <div class="hub-editable" contenteditable="true" data-save="text" style="font-size:0.9rem;line-height:1.6;color:var(--text-primary);min-height:60px;outline:none">${e(hubContent.text || 'Write something...')}</div>
        </div>`;
      case 'habits':
        return `<div class="bento-bubble" data-bubble="${uid}" style="${dimStyle};background:var(--surface-container-low);padding:var(--gutter);border:1px solid var(--border-color)">
          ${editUI}
          <div style="font-family:var(--font-sans);font-size:0.75rem;font-weight:600;text-transform:uppercase;letter-spacing:0.1em;color:var(--primary);margin-bottom:var(--gutter)">Habits</div>
          <div id="hubHabitsList" style="display:flex;flex-direction:column;gap:var(--stack-sm)">
            ${hubContent.habits.map((h, i) =>
              `<div style="display:flex;align-items:center;gap:var(--space-2);padding:var(--stack-sm) 0;font-size:0.85rem;position:relative" data-idx="${i}">
                <span style="color:var(--primary)">\u2713</span>
                <span class="${isEdit ? 'hub-editable' : ''}" data-edit="habits" data-idx="${i}">${e(h)}</span>
                ${isEdit ? `<button class="hub-edit-item-btn del" data-del="habits" data-idx="${i}" title="Delete">×</button>` : ''}
              </div>`
            ).join('')}
            ${isEdit ? `<div style="padding:var(--stack-sm) 0"><button class="hub-add-btn" data-add="habits">+ Add habit</button></div>` : ''}
          </div>
        </div>`;
      case 'notes':
        return `<div class="bento-bubble" data-bubble="${uid}" style="${dimStyle};background:var(--surface-container);padding:var(--gutter);border:1px solid var(--border-color)">
          ${editUI}
          <div style="font-family:var(--font-sans);font-size:0.75rem;font-weight:600;text-transform:uppercase;letter-spacing:0.1em;color:var(--text-tertiary);margin-bottom:var(--gutter)">Notes</div>
          <div class="hub-editable" contenteditable="true" data-save="notes" style="font-size:0.85rem;line-height:1.6;color:var(--text-primary);min-height:80px;outline:none;white-space:pre-wrap">${e(hubContent.notes || '')}</div>
        </div>`;
      case 'links':
        return `<div class="bento-bubble" data-bubble="${uid}" style="${dimStyle};background:var(--surface-container-low);padding:var(--gutter);border:1px solid var(--border-color)">
          ${editUI}
          <div style="font-family:var(--font-sans);font-size:0.75rem;font-weight:600;text-transform:uppercase;letter-spacing:0.1em;color:var(--text-tertiary);margin-bottom:var(--gutter)">Links</div>
          <div id="hubLinksList" style="display:flex;flex-direction:column;gap:var(--stack-sm)">
            ${hubContent.links.map((l, i) =>
              `<div style="display:flex;align-items:center;gap:var(--space-2);padding:var(--stack-sm) 0;font-size:0.85rem;position:relative" data-idx="${i}">
                <span style="color:var(--primary);flex-shrink:0">\u2197</span>
                ${isEdit
                  ? `<span class="hub-editable" data-edit="links-label" data-idx="${i}" style="flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis">${e(l.label)}</span>
                     <span style="color:var(--text-tertiary);font-size:0.75rem">/</span>
                     <span class="hub-editable" data-edit="links-url" data-idx="${i}" style="flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;color:var(--text-secondary);font-size:0.75rem">${e(l.url)}</span>`
                  : `<a href="${e(l.url)}" target="_blank" rel="noopener" style="color:var(--primary);text-decoration:none;flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis">${e(l.label)}</a>`}
                ${isEdit ? `<button class="hub-edit-item-btn del" data-del="links" data-idx="${i}" title="Delete">×</button>` : ''}
              </div>`
            ).join('')}
            ${isEdit ? `<div style="padding:var(--stack-sm) 0"><button class="hub-add-btn" data-add="links">+ Add link</button></div>` : ''}
          </div>
        </div>`;
      default:
        return `<div class="bento-bubble" data-bubble="${uid}" style="${dimStyle};padding:24px;background:var(--surface-container);border:1px dashed var(--border-color)">
          <div style="text-align:center;color:var(--text-tertiary);font-size:0.75rem">Unknown bubble</div>
        </div>`;
    }
  }

  const visible = layout.filter(i => !i.hidden);
  visible.forEach(item => {
    try {
      grid.insertAdjacentHTML('beforeend', bubbleHtml(item));
    } catch (e) {
      console.warn('Bento bubble render error:', item.t, e);
    }
  });

  // Wire remove-bubble buttons directly (fires in target phase, not bubbled)
  grid.querySelectorAll('[data-remove-bubble]').forEach(function(btn) {
    btn.addEventListener('click', function(e) {
      e.stopPropagation();
      var uid = this.dataset.removeBubble;
      var layout2 = normalizeBentoLayout(hubContent.bentoLayout, hubContent);
      var idx = layout2.findIndex(function(it) { return it.uid === uid; });
      if (idx !== -1) layout2.splice(idx, 1);
      hubContent.bentoLayout = layout2;
      saveHubContent();
      renderHubBento();
    });
  });

  if (isEdit) {
    const addBtn = document.createElement('button');
    addBtn.className = 'bento-add-bubble-btn';
    addBtn.id = 'bentoAddBubble';
    addBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>Add Bubble';
    const lastItem = visible.length > 0 ? visible[visible.length-1] : null;
    const addY = lastItem ? lastItem.y + (lastItem.h || 240) + 24 : 24;
    addBtn.style.cssText = `position:absolute;left:24px;top:${addY}px;width:calc(100% - 48px)`;
    grid.appendChild(addBtn);
    addBtn.addEventListener('click', showHubAddPopup);
  }

  if (visible.length > 0) {
    const last = visible[visible.length-1];
    grid.style.minHeight = Math.max(800, last.y + (last.h || 240) + 160) + 'px';
  }

  document.querySelectorAll('img[data-image-id]').forEach(el => {
    el.src = getImage(el.dataset.imageId) || '';
  });

  resetBentoInteractions();
  setupBubbleDragDrop();
  setupBubbleResize();
}

/* ─── Bubble drag/resize ───────────────────── */
let _bubbleDragData = null;
let _bubbleDragInitialized = false;
let _bubbleResizeData = null;
let _bubbleResizeInitialized = false;
let _suppressClick = false;

function resetBentoInteractions() {
  _bubbleDragInitialized = false;
  _bubbleDragData = null;
  _bubbleResizeInitialized = false;
  _bubbleResizeData = null;
}

function setupBubbleDragDrop() {
  if (!hubEditMode) return;
  if (_bubbleDragInitialized) return;
  _bubbleDragInitialized = true;

  const grid = document.querySelector('.bento-grid');
  if (!grid) return;

  grid.addEventListener('mousedown', function(e) {
    const handle = e.target.closest('.bento-bubble-handle');
    if (!handle) return;
    e.preventDefault();
    const bubble = handle.closest('.bento-bubble');
    if (!bubble) return;
    const rect = bubble.getBoundingClientRect();
    const gridRect = grid.getBoundingClientRect();
    _bubbleDragData = {
      bubble,
      offsetX: e.clientX - rect.left,
      offsetY: e.clientY - rect.top,
      startX: rect.left - gridRect.left,
      startY: rect.top - gridRect.top
    };
    bubble.classList.add('dragging');
  });

  document.addEventListener('mousemove', function(e) {
    if (!_bubbleDragData) return;
    const gridRect = grid.getBoundingClientRect();
    let newX = e.clientX - _bubbleDragData.offsetX - gridRect.left;
    let newY = e.clientY - _bubbleDragData.offsetY - gridRect.top;
    newX = Math.max(0, snap(newX));
    newY = Math.max(0, snap(newY));
    _bubbleDragData.bubble.style.left = newX + 'px';
    _bubbleDragData.bubble.style.top = newY + 'px';
  });

  document.addEventListener('mouseup', function(e) {
    if (!_bubbleDragData) return;
    _bubbleDragData.bubble.classList.remove('dragging');
    const bubble = _bubbleDragData.bubble;
    const x = parseInt(bubble.style.left) || 0;
    const y = parseInt(bubble.style.top) || 0;
    const uid = bubble.dataset.bubble;
    const layout = normalizeBentoLayout(hubContent.bentoLayout, hubContent);
    const item = layout.find(i => i.uid === uid);
    if (item) {
      item.x = Math.max(0, x);
      item.y = Math.max(0, y);
      resolveBubbleCollisions(layout);
      hubContent.bentoLayout = layout;
      saveHubContent();
      // Update pushed bubbles' DOM positions without full re-render
      var grid = document.querySelector('.bento-grid');
      if (grid) {
        layout.forEach(function(it) {
          var el = grid.querySelector('[data-bubble="' + it.uid + '"]');
          if (el) {
            el.style.left = it.x + 'px';
            el.style.top = it.y + 'px';
          }
        });
      }
    }
    _bubbleDragData = null;
    _suppressClick = true;
    setTimeout(function() { _suppressClick = false; }, 100);
  });
}

function setupBubbleResize() {
  if (!hubEditMode) return;
  if (_bubbleResizeInitialized) return;
  _bubbleResizeInitialized = true;

  const grid = document.querySelector('.bento-grid');
  if (!grid) return;

  grid.addEventListener('mousedown', function(e) {
    const handle = e.target.closest('[data-resize-bubble]');
    if (!handle) return;
    e.preventDefault();
    e.stopPropagation();
    const bubble = handle.closest('.bento-bubble');
    if (!bubble) return;
    const rect = bubble.getBoundingClientRect();
    _bubbleResizeData = {
      bubble,
      startW: rect.width,
      startH: rect.height,
      startX: e.clientX,
      startY: e.clientY
    };
    bubble.classList.add('dragging');
  });

  document.addEventListener('mousemove', function(e) {
    if (!_bubbleResizeData) return;
    const dx = e.clientX - _bubbleResizeData.startX;
    const dy = e.clientY - _bubbleResizeData.startY;
    let newW = snap(Math.max(100, _bubbleResizeData.startW + dx));
    let newH = snap(Math.max(80, _bubbleResizeData.startH + dy));
    _bubbleResizeData.bubble.style.width = newW + 'px';
    _bubbleResizeData.bubble.style.height = newH + 'px';
  });

  document.addEventListener('mouseup', function() {
    if (!_bubbleResizeData) return;
    _bubbleResizeData.bubble.classList.remove('dragging');
    const bubble = _bubbleResizeData.bubble;
    const w = parseInt(bubble.style.width) || 320;
    const h = parseInt(bubble.style.height) || 240;
    const uid = bubble.dataset.bubble;
    const layout = normalizeBentoLayout(hubContent.bentoLayout, hubContent);
    const item = layout.find(i => i.uid === uid);
    if (item) {
      item.w = Math.max(100, snap(w));
      item.h = Math.max(80, snap(h));
      resolveBubbleCollisions(layout);
      hubContent.bentoLayout = layout;
      saveHubContent();
      // Update pushed bubbles' DOM positions without full re-render
      var grid = document.querySelector('.bento-grid');
      if (grid) {
        layout.forEach(function(it) {
          var el = grid.querySelector('[data-bubble="' + it.uid + '"]');
          if (el) {
            el.style.left = it.x + 'px';
            el.style.top = it.y + 'px';
          }
        });
      }
    }
    _bubbleResizeData = null;
  });
}

/* ─── Bubble type icons ────────────────────── */
function bubbleTypeIcon(t) {
  const icons = {
    goals: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>',
    images: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>',
    priorities: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
    quote: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z"/><path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z"/></svg>',
    todos: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>',
    text: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>',
    habits: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>',
    notes: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>',
    links: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg>'
  };
  return icons[t] || '';
}

/* ─── Add bubble types ─────────────────────── */
function addBubbleTypes(types) {
  const layout = normalizeBentoLayout(hubContent.bentoLayout, hubContent);
  types.forEach(t => {
    const item = {t, uid: _nextUid()};
    if (t === 'images') {
      const existing = layout.filter(i => i.t === 'images').length;
      item.imageId = 'hub-image-' + (existing + 1);
    } else {
      if (layout.find(i => i.t === t)) return;
    }
    layout.push(item);
  });
  hubContent.bentoLayout = layout;
  saveHubContent();
  renderHubBento();
}

/* ─── ADD popup ────────────────────────────── */
function showHubAddPopup(e) {
  const existing = document.querySelector('.hub-add-popup');
  if (existing) { existing.remove(); document.querySelector('.hub-popup-overlay')?.remove(); return; }

  const overlay = document.createElement('div');
  overlay.className = 'hub-popup-overlay';
  overlay.style.cssText = 'position:fixed;inset:0;z-index:1001;background:rgba(0,0,0,0.3)';
  overlay.addEventListener('click', () => { overlay.remove(); popup.remove(); });
  document.body.appendChild(overlay);

  const popup = document.createElement('div');
  popup.className = 'hub-edit-popup hub-add-popup';

  const layout = normalizeBentoLayout(hubContent.bentoLayout, hubContent);
  const has = t => layout.some(i => i.t === t);

  const gridBtn = (t, l) => {
    const disabled = t !== 'images' && has(t);
    return `<button class="hub-add-grid-btn" data-btype="${t}" ${disabled ? 'disabled style="opacity:0.35;cursor:default"' : ''}>
      <span class="icon">${bubbleTypeIcon(t)}</span>
      <span>${l}</span>
    </button>`;
  };

  popup.innerHTML = `
    <div class="add-title">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v8"/><path d="M8 12h8"/></svg>
      Add to Canvas
    </div>

    <div class="hub-add-layouts">
      <button class="hub-add-layout-btn" data-layout="focus" title="Goals + Priorities + To-Dos">
        <span class="lcon" style="background:color-mix(in srgb, var(--primary) 14%, transparent);color:var(--primary)">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:14px;height:14px"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
        </span>
        Focus Dashboard
        <small class="ldesc">Goals, priorities &amp; todos</small>
      </button>
      <button class="hub-add-layout-btn" data-layout="creative" title="Images + Quote + Notes">
        <span class="lcon" style="background:color-mix(in srgb, var(--tag-study-text) 14%, transparent);color:var(--tag-study-text)">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:14px;height:14px"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
        </span>
        Creative Board
        <small class="ldesc">Images, quotes &amp; notes</small>
      </button>
      <button class="hub-add-layout-btn" data-layout="tracker" title="Habits + To-Dos + Text">
        <span class="lcon" style="background:color-mix(in srgb, var(--tag-meeting-text) 14%, transparent);color:var(--tag-meeting-text)">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:14px;height:14px"><polyline points="20 6 9 17 4 12"/></svg>
        </span>
        Daily Tracker
        <small class="ldesc">Habits, todos &amp; journal</small>
      </button>
      <button class="hub-add-layout-btn" data-layout="all" title="All bubble types">
        <span class="lcon" style="background:color-mix(in srgb, var(--tag-deep-work-text) 14%, transparent);color:var(--tag-deep-work-text)">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:14px;height:14px"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg>
        </span>
        Everything
        <small class="ldesc">All 9 bubble types</small>
      </button>
    </div>

    <div class="hub-add-section prod">Productivity</div>
    <div class="hub-add-grid">
      ${gridBtn('goals','Goals')}
      ${gridBtn('priorities','Priorities')}
      ${gridBtn('todos','To-Dos')}
      ${gridBtn('habits','Habits')}
    </div>

    <div class="hub-add-section inspire">Inspiration</div>
    <div class="hub-add-grid">
      ${gridBtn('quote','Quote')}
      ${gridBtn('text','Text')}
      ${gridBtn('notes','Notes')}
    </div>

    <div class="hub-add-section media">Media</div>
    <div class="hub-add-grid">
      ${gridBtn('images','Images')}
      ${gridBtn('links','Links')}
    </div>

    <div class="hub-edit-popup-actions" style="margin-top:8px"><button class="cancel" id="hubAddCancel">Done</button></div>
  `;
  document.body.appendChild(popup);
  popup.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);z-index:1002';

  popup.querySelectorAll('.hub-add-grid-btn:not([disabled])').forEach(el => {
    el.addEventListener('click', () => {
      addBubbleTypes([el.dataset.btype]);
      popup.remove();
      overlay.remove();
    });
  });
  popup.querySelectorAll('.hub-add-layout-btn').forEach(el => {
    el.addEventListener('click', () => {
      const map = {
        focus: ['goals','priorities','todos'],
        creative: ['images','quote','notes'],
        tracker: ['habits','todos','text'],
        all: ['goals','images','priorities','quote','todos','text','habits','notes','links']
      };
      addBubbleTypes(map[el.dataset.layout]);
      popup.remove();
      overlay.remove();
    });
  });
  document.getElementById('hubAddCancel')?.addEventListener('click', () => { popup.remove(); overlay.remove(); });
}

/* ─── HIDE popup ───────────────────────────── */
function showHubHidePopup() {
  const existing = document.querySelector('.hub-hide-popup');
  if (existing) { existing.remove(); document.querySelector('.hub-popup-overlay')?.remove(); return; }

  const overlay = document.createElement('div');
  overlay.className = 'hub-popup-overlay';
  overlay.style.cssText = 'position:fixed;inset:0;z-index:1001;background:rgba(0,0,0,0.3)';
  overlay.addEventListener('click', () => { overlay.remove(); popup.remove(); });
  document.body.appendChild(overlay);

  const layout = normalizeBentoLayout(hubContent.bentoLayout, hubContent);
  hubContent.bentoLayout = layout;
  const popup = document.createElement('div');
  popup.className = 'hub-edit-popup hub-hide-popup';

  const labels = { goals:'Goals', images:'Images', priorities:'Priorities', quote:'Quote', todos:'To-Dos', text:'Text', habits:'Habits', notes:'Notes', links:'Links' };

  popup.innerHTML = `
    <div class="hide-title">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:16px;height:16px"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
      Hide Bubbles
    </div>
    <div class="hide-list">
      ${layout.map(item => `
        <label class="hide-row" data-btype="${item.t}">
          <span class="hide-icon">${bubbleTypeIcon(item.t)}</span>
          <span class="hide-label">${labels[item.t] || item.t}</span>
          <span class="hide-toggle ${item.hidden ? 'off' : 'on'}"><span class="hide-knob"></span></span>
        </label>
      `).join('')}
    </div>
    <div class="hub-edit-popup-actions"><button class="cancel" id="hubHideCancel">Done</button></div>
  `;
  document.body.appendChild(popup);
  popup.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);z-index:1002';

  popup.querySelectorAll('.hide-row').forEach(row => {
    row.addEventListener('click', () => {
      const type = row.dataset.btype;
      const item = layout.find(i => i.t === type);
      if (!item) return;
      item.hidden = !item.hidden;
      row.querySelector('.hide-toggle').className = 'hide-toggle ' + (item.hidden ? 'off' : 'on');
      hubContent.bentoLayout = layout;
      saveHubContent();
      renderHubBento();
    });
  });
  document.getElementById('hubHideCancel')?.addEventListener('click', () => { popup.remove(); overlay.remove(); });
}

/* ─── Gallery ──────────────────────────────── */
function renderHubGallery() {
  const nav = document.querySelector('.hub-gallery');
  if (!nav) return;
  const icons = {
    calendar: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>',
    checklist: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>',
    tag: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>',
    chart: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>'
  };
  const isEdit = hubEditMode;
  nav.innerHTML = hubContent.gallery.map((c, i) =>
    `<a href="${escapeHtml(c.href)}" class="hub-gallery-card" data-idx="${i}">
      <div class="hub-gallery-cover" style="background:${c.bg}">
        <div class="hub-gallery-cover-bg" style="background:linear-gradient(135deg, ${c.color}, transparent)"></div>
        ${icons[c.icon] || icons.calendar}
      </div>
      <div class="hub-gallery-body">
        <div class="hub-gallery-title">${escapeHtml(c.label)}</div>
        <p class="hub-gallery-desc">${escapeHtml(c.desc)}</p>
        <div class="hub-gallery-meta">
          <span class="hub-gallery-link">Open <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg></span>
        </div>
      </div>
      ${isEdit ? `<div class="hub-edit-badge" data-edit-gallery="${i}" title="Edit card">\u270E</div>` : ''}
    </a>`
  ).join('');
  if (isEdit) {
    nav.insertAdjacentHTML('beforeend', `<div style="display:flex;align-items:center;justify-content:center;min-height:100px"><button class="hub-add-btn" data-add="gallery">+ Add card</button></div>`);
  }
}

let _galleryPopupOpen = false;

function showGalleryPopup(idx, anchor) {
  if (_galleryPopupOpen) { document.querySelector('.hub-edit-popup')?.remove(); _galleryPopupOpen = false; return; }
  const card = hubContent.gallery[idx];
  const popup = document.createElement('div');
  popup.className = 'hub-edit-popup';
  popup.innerHTML = `
    <input type="text" id="gpLabel" value="${escapeHtml(card.label)}" placeholder="Label">
    <input type="text" id="gpDesc" value="${escapeHtml(card.desc)}" placeholder="Description">
    <input type="text" id="gpHref" value="${escapeHtml(card.href)}" placeholder="Link URL">
    <input type="text" id="gpColor" value="${card.color}" placeholder="Accent color (CSS var)">
    <div class="hub-edit-popup-actions">
      <button class="cancel" id="gpCancel">Cancel</button>
      <button class="primary" id="gpSave">Save</button>
    </div>
  `;
  document.body.appendChild(popup);
  _galleryPopupOpen = true;
  const rect = anchor.getBoundingClientRect();
  popup.style.top = Math.min(rect.bottom + 4, window.innerHeight - 260) + 'px';
  popup.style.right = '24px';

  document.getElementById('gpCancel')?.addEventListener('click', () => { popup.remove(); _galleryPopupOpen = false; });
  document.getElementById('gpSave')?.addEventListener('click', () => {
    hubContent.gallery[idx] = {
      label: document.getElementById('gpLabel')?.value || card.label,
      desc: document.getElementById('gpDesc')?.value || card.desc,
      href: document.getElementById('gpHref')?.value || card.href,
      icon: card.icon,
      color: document.getElementById('gpColor')?.value || card.color,
      bg: card.bg
    };
    saveHubContent();
    renderHubGallery();
    popup.remove();
    _galleryPopupOpen = false;
  });
}

/* ─── Event wiring ─────────────────────────── */
function setupHubEditEvents() {
  document.getElementById('hubEditToggle')?.addEventListener('click', toggleHubEdit);
  document.getElementById('hubAddToggle')?.addEventListener('click', showHubAddPopup);
  document.getElementById('hubHideToggle')?.addEventListener('click', showHubHidePopup);

  // Hub FAB speed-dial
  const _fabMain = document.getElementById('hubAccessMain');
  if (_fabMain && !_fabMain.dataset._fabWired) {
    _fabMain.dataset._fabWired = '1';
    _fabMain.addEventListener('click', toggleHubAccess);
    document.getElementById('hubFabEdit')?.addEventListener('click', function() { toggleHubAccess(); showHubEditToggle(); });
    document.getElementById('hubFabAdd')?.addEventListener('click', function() { toggleHubAccess(); showHubAddPopup(); });
    document.getElementById('hubFabHide')?.addEventListener('click', function() { toggleHubAccess(); showHubHidePopup(); });
  }
  document.addEventListener('click', function(e) {
    const hub = document.getElementById('hubAccessHub');
    if (hub && !hub.contains(e.target)) {
      document.getElementById('hubAccessItems')?.classList.remove('open');
      document.getElementById('hubAccessMain')?.classList.remove('open');
    }
  });

  document.addEventListener('blur', function(e) {
    const span = e.target.closest('[data-edit]');
    if (!span || !hubEditMode) return;
    const field = span.dataset.edit;
    const idx = parseInt(span.dataset.idx);
    if (field === 'goals' && !isNaN(idx)) {
      hubContent.goals[idx] = span.textContent.trim();
      saveHubContent();
    } else if (field === 'priorities' && !isNaN(idx)) {
      hubContent.priorities[idx] = span.textContent.trim();
      saveHubContent();
    } else if (field === 'todos' && !isNaN(idx)) {
      hubContent.todos[idx].text = span.textContent.trim();
      saveHubContent();
    } else if (field === 'habits' && !isNaN(idx)) {
      hubContent.habits[idx] = span.textContent.trim();
      saveHubContent();
    } else if (field === 'links-label' && !isNaN(idx)) {
      hubContent.links[idx].label = span.textContent.trim();
      saveHubContent();
    } else if (field === 'links-url' && !isNaN(idx)) {
      hubContent.links[idx].url = span.textContent.trim();
      saveHubContent();
    }
  }, true);

  document.querySelector('.bento-grid')?.addEventListener('blur', function(e) {
    const q = e.target.closest('.hub-bento-quote');
    if (!q || !hubEditMode) return;
    hubContent.quote.text = q.textContent.trim().replace(/^["\u201C]|["\u201D]$/g, '');
    saveHubContent();
  }, true);

  document.querySelector('.bento-grid')?.addEventListener('blur', function(e) {
    const el = e.target.closest('[data-save]');
    if (!el || !hubEditMode) return;
    const field = el.dataset.save;
    if (field === 'text') {
      hubContent.text = el.textContent.trim();
      saveHubContent();
    } else if (field === 'notes') {
      hubContent.notes = el.textContent.trim();
      saveHubContent();
    }
  }, true);

  document.getElementById('hubGreeting')?.addEventListener('blur', function() {
    if (!hubEditMode) return;
    hubContent.greeting = this.textContent.trim();
    hubContent.greeting = hubContent.greeting === 'Good morning' || hubContent.greeting === 'Good afternoon' || hubContent.greeting === 'Good evening' ? '' : hubContent.greeting;
    saveHubContent();
  });

  document.querySelector('.bento-grid')?.addEventListener('click', function(e) {
    if (_suppressClick) return;
    const delBtn = e.target.closest('[data-del]');
    if (!delBtn || !hubEditMode) return;
    const field = delBtn.dataset.del;
    const idx = parseInt(delBtn.dataset.idx);
    if (isNaN(idx)) return;
    if (field === 'goals') { hubContent.goals.splice(idx, 1); saveHubContent(); renderHubBento(); }
    else if (field === 'priorities') { hubContent.priorities.splice(idx, 1); saveHubContent(); renderHubBento(); }
    else if (field === 'todos') { hubContent.todos.splice(idx, 1); saveHubContent(); renderHubBento(); }
    else if (field === 'habits') { hubContent.habits.splice(idx, 1); saveHubContent(); renderHubBento(); }
    else if (field === 'links') { hubContent.links.splice(idx, 1); saveHubContent(); renderHubBento(); }
  });

  document.querySelector('.bento-grid')?.addEventListener('click', function(e) {
    if (_suppressClick) return;
    const addBtn = e.target.closest('[data-add]');
    if (!addBtn || !hubEditMode) return;
    const field = addBtn.dataset.add;
    if (field === 'goals') { hubContent.goals.push('new goal'); saveHubContent(); renderHubBento(); }
    else if (field === 'priorities') { hubContent.priorities.push('new priority'); saveHubContent(); renderHubBento(); }
    else if (field === 'todos') { hubContent.todos.push({ text: 'new item', done: false }); saveHubContent(); renderHubBento(); }
    else if (field === 'habits') { hubContent.habits.push('new habit'); saveHubContent(); renderHubBento(); }
    else if (field === 'links') { hubContent.links.push({ label: 'new link', url: 'https://' }); saveHubContent(); renderHubBento(); }
  });

  document.querySelector('.hub-layout')?.addEventListener('click', function(e) {
    const toggle = e.target.closest('.hub-section-vis-toggle');
    if (!toggle || !hubEditMode) return;
    const wrap = toggle.closest('.hub-section-wrap');
    if (wrap) toggleSectionVis(wrap.dataset.hubSection);
  });

  document.querySelector('.hub-gallery')?.addEventListener('click', function(e) {
    const editBtn = e.target.closest('[data-edit-gallery]');
    if (!editBtn || !hubEditMode) return;
    const idx = parseInt(editBtn.dataset.editGallery);
    if (isNaN(idx)) return;
    showGalleryPopup(idx, editBtn);
  });

  document.querySelector('.hub-gallery')?.addEventListener('click', function(e) {
    const addBtn = e.target.closest('[data-add="gallery"]');
    if (!addBtn || !hubEditMode) return;
    hubContent.gallery.push({ label: 'New View', desc: 'Description', href: '#', icon: 'chart', color: 'var(--text-secondary)', bg: 'var(--surface-container)' });
    saveHubContent();
    renderHubGallery();
  });

  document.querySelector('.bento-grid')?.addEventListener('click', function(e) {
    if (_suppressClick) return;
    const wrap = e.target.closest('[data-img-picker]');
    if (!wrap) return;
    openImagePicker(wrap.dataset.imgPicker);
  });
}

/* ─── Hub FAB (speed-dial) ──────────────────── */
function positionHubFAB() {
  const hub = document.getElementById('hubAccessHub');
  if (!hub) return;
  const allItems = hub.querySelectorAll('.access-item');
  const btn = document.getElementById('hubAccessMain');
  if (!btn || !allItems.length) return;
  const items = Array.from(allItems).filter(el => el.style.display !== 'none');
  if (!items.length) return;

  const S = 40;
  const N = items.length;
  const br = btn.getBoundingClientRect();
  const cx = br.left + br.width / 2;
  const cy = br.top + br.height / 2;

  const maxL = cx - S / 2;
  const maxT = cy - S / 2;

  const startAngle = Math.PI;
  const arcSpan = Math.PI / 2;
  const step = N > 1 ? arcSpan / (N - 1) : 0;
  let maxR = Infinity;
  for (let i = 0; i < N; i++) {
    const a = startAngle + i * step;
    const dx = Math.cos(a), dy = Math.sin(a);
    let r = Infinity;
    if (dx < -0.001) r = Math.min(r, maxL / -dx);
    if (dy < -0.001) r = Math.min(r, maxT / -dy);
    maxR = Math.min(maxR, r);
  }

  const R = Math.round(Math.max(48, Math.min(100, maxR)));

  const hr = hub.getBoundingClientRect();
  const ox = hr.right - 26;
  const oy = hr.bottom - 26;

  allItems.forEach(el => {
    if (el.style.display === 'none') {
      el.style.setProperty('--x', '0px');
      el.style.setProperty('--y', '0px');
    }
  });
  for (let i = 0; i < N; i++) {
    const a = startAngle + i * step;
    items[i].style.setProperty('--x', Math.round(cx + Math.cos(a) * R + S / 2 - ox) + 'px');
    items[i].style.setProperty('--y', Math.round(cy + Math.sin(a) * R + S / 2 - oy) + 'px');
    items[i].style.setProperty('--dl-open', (0.02 + i * 0.035).toFixed(3) + 's');
    items[i].style.setProperty('--dl', ((N - 1 - i) * 0.035 + 0.02).toFixed(3) + 's');
  }
}

function toggleHubAccess() {
  const items = document.getElementById('hubAccessItems');
  const btn = document.getElementById('hubAccessMain');
  if (items && btn) {
    const opening = !items.classList.contains('open');
    if (opening) positionHubFAB();
    items.classList.toggle('open');
    btn.classList.toggle('open');
  }
}

/* ─── Edit mode toggle pill ─────────────────── */
function showHubEditToggle() {
  if (typeof state !== 'undefined' && state) hubEditMode = !!state.editMode;
  // Toggle edit mode directly
  toggleHubEdit();
  // Show the toggle pill reflecting current state
  const existing = document.getElementById('hubEditTogglePill');
  if (existing) { existing.remove(); return; }
  const pill = document.createElement('div');
  pill.id = 'hubEditTogglePill';
  pill.innerHTML = `
    <span class="hep-label">Edit Mode</span>
    <button class="hep-switch">${hubEditMode ? 'ON' : 'OFF'}</button>
    <button class="hep-close">&times;</button>
  `;
  pill.className = 'hub-edit-pill';
  pill.querySelector('.hep-switch').addEventListener('click', function() {
    toggleHubEdit();
    this.textContent = hubEditMode ? 'ON' : 'OFF';
  });
  pill.querySelector('.hep-close').addEventListener('click', function() { pill.remove(); });
  document.body.appendChild(pill);
  setTimeout(function() {
    document.addEventListener('click', function _dismiss(e) {
      if (!pill.contains(e.target) && document.getElementById('hubEditTogglePill')) {
        pill.remove();
        document.removeEventListener('click', _dismiss);
      }
    });
  }, 0);
}
function initHubEditMode() {
  // Ensure canvas is always visible
  document.querySelectorAll('.hub-section-wrap[data-hub-section="bento"]').forEach(w => w.classList.remove('hidden-section'));
  document.querySelectorAll('.hub-section-wrap').forEach(wrap => {
    const header = wrap.querySelector('.hub-section-header');
    if (header && !header.querySelector('.hub-section-vis-toggle')) {
      const toggle = document.createElement('button');
      toggle.className = 'hub-section-vis-toggle';
      toggle.title = 'Toggle section visibility';
      header.appendChild(toggle);
    }
  });
  setupHubEditEvents();
  renderHubGreeting();
  renderHubGallery();
  applyHubEditMode();

  // Sync hubEditMode when shared edit mode changes (sidebar button, etc.)
  document.addEventListener('editModeChange', function() {
    const wasEdit = hubEditMode;
    hubEditMode = typeof state !== 'undefined' && state ? !!state.editMode : hubEditMode;
    if (wasEdit !== hubEditMode) {
      localStorage.setItem(HUB_EDIT_KEY, hubEditMode);
      document.documentElement.classList.toggle('hub-edit', hubEditMode);
      renderHubBento();
      renderHubGallery();
      applyHubVisibility();
      updateSectionHandles();
    }
  });
}

/* ─── Initialize hub FAB positioning ────────── */
if (document.getElementById('hubAccessHub')) {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', positionHubFAB);
  } else {
    positionHubFAB();
  }
  window.addEventListener('resize', positionHubFAB);

  // Directly wire the FAB toggle + outside-close (skip if already wired by setupHubEditEvents)
  const _wireHubFab = () => {
    const main = document.getElementById('hubAccessMain');
    const items = document.getElementById('hubAccessItems');
    if (main && items && !main.dataset._fabWired) {
      main.dataset._fabWired = '1';
      main.addEventListener('click', function(e) {
        const opening = !items.classList.contains('open');
        if (opening) positionHubFAB();
        items.classList.toggle('open');
        main.classList.toggle('open');
      });
      document.addEventListener('click', function(e) {
        const hub = document.getElementById('hubAccessHub');
        if (hub && !hub.contains(e.target)) {
          items.classList.remove('open');
          main.classList.remove('open');
        }
      });
      document.getElementById('hubFabEdit')?.addEventListener('click', function() { try { toggleHubAccess(); showHubEditToggle(); } catch(e) { console.error('Edit error:', e); } });
      document.getElementById('hubFabAdd')?.addEventListener('click', function() { toggleHubAccess(); showHubAddPopup(); });
      document.getElementById('hubFabHide')?.addEventListener('click', function() { toggleHubAccess(); showHubHidePopup(); });
    }
  };
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', _wireHubFab);
  } else {
    _wireHubFab();
  }
}

/* ─── Auto-save canvas on page unload ─────────── */
(function initCanvasAutoSave() {
  window.addEventListener('beforeunload', function() {
    if (typeof saveHubContent === 'function') {
      try { saveHubContent(); } catch(e) {}
    }
  });
})();

/* ─── Patch updateSectionHandles ────────────── */
const _origUpdateHandles = typeof updateSectionHandles === 'function' ? updateSectionHandles : function() {};
updateSectionHandles = function() {
  if (typeof _origUpdateHandles === 'function') _origUpdateHandles();
  if (hubEditMode) {
    document.querySelectorAll('.hub-section-header').forEach(h => h.classList.add('visible'));
    document.querySelectorAll('.hub-section-drag-handle').forEach(h => h.classList.add('hub-section-drag-handle-visible'));
  }
};
