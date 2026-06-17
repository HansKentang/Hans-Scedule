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
let _clockInterval = null;
let _timerIntervals = {};
let _pomodoroState = {};
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
    console.warn('[img] loadHubContent: raw from localStorage:', raw ? raw.slice(0, 200) + '...' : 'null');
    if (raw) {
      const hc = JSON.parse(raw);
      console.warn('[img] loadHubContent: parsed, bentoLayout length:', hc.bentoLayout ? hc.bentoLayout.length : 0);
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
      console.warn('[img] loadHubContent: returning custom layout');
      return hc;
    }
  } catch(e) { console.warn('[img] loadHubContent: error:', e); }
  console.warn('[img] loadHubContent: returning DEFAULTS');
  return JSON.parse(JSON.stringify(HUB_DEFAULTS));
}

function saveHubContent() {
  var _hadImages = hubContent._images;
  delete hubContent._images;
  try {
    localStorage.setItem(HUB_CONTENT_KEY, JSON.stringify(hubContent));
    console.warn('[img] saveHubContent: SAVED, bentoLayout length:', (hubContent.bentoLayout || []).length);
  } catch(e) { console.warn('[img] saveHubContent failed:', e); }
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
        const imgUrl = getImage(imgId);
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
      case 'progress':
        const progData = generateProgressData();
        const maxVal = Math.max(...progData.daily, 1);
        const chartBars = progData.daily.map((v, i) => {
          const pct = Math.max(4, (v / maxVal) * 100);
          const dayLabels = ['M','T','W','T','F','S','S'];
          return `<div class="prog-bar-col"><div class="prog-bar" style="height:${pct}%"></div><span class="prog-bar-label">${dayLabels[i]}</span></div>`;
        }).join('');
        return `<div class="bento-bubble" data-bubble="${uid}" style="${dimStyle};background:var(--surface-container-low);padding:var(--gutter);border:1px solid var(--border-color)">
          ${editUI}
          <div style="font-family:var(--font-sans);font-size:0.75rem;font-weight:600;text-transform:uppercase;letter-spacing:0.1em;color:var(--primary);margin-bottom:var(--gutter)">Progress</div>
          <div class="prog-stats-row">
            <div class="prog-stat"><span class="prog-stat-val">${progData.total}</span><span class="prog-stat-lbl">completed</span></div>
            <div class="prog-stat"><span class="prog-stat-val">${progData.streak}</span><span class="prog-stat-lbl">day streak</span></div>
            <div class="prog-stat"><span class="prog-stat-val">${progData.rate}%</span><span class="prog-stat-lbl">rate</span></div>
          </div>
          <div class="prog-chart">${chartBars}</div>
        </div>`;
      case 'clock':
        const now = new Date();
        const hh = String(now.getHours()).padStart(2,'0');
        const mm = String(now.getMinutes()).padStart(2,'0');
        const ss = String(now.getSeconds()).padStart(2,'0');
        const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
        const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
        const dateStr = days[now.getDay()] + ', ' + months[now.getMonth()] + ' ' + now.getDate();
        return `<div class="bento-bubble" data-bubble="${uid}" style="${dimStyle};background:var(--surface-container-low);padding:var(--gutter);border:1px solid var(--border-color)">
          ${editUI}
          <div class="clock-face" data-clock-uid="${uid}">
            <div class="clock-row"><span class="clock-time">${hh}:${mm}</span><span class="clock-seconds">${ss}</span></div>
            <span class="clock-date">${dateStr}</span>
          </div>
        </div>`;
      case 'weather':
        return `<div class="bento-bubble" data-bubble="${uid}" style="${dimStyle};background:var(--surface-container-low);padding:var(--gutter);border:1px solid var(--border-color)">
          ${editUI}
          <div class="weather-widget" data-weather-uid="${uid}">
            <div class="weather-loading">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="width:20px;height:20px"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
              <span>Fetching weather...</span>
            </div>
          </div>
        </div>`;
      case 'calendar':
        const calNow = new Date();
        const calYear = calNow.getFullYear();
        const calMonth = calNow.getMonth();
        const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
        const firstDay = new Date(calYear, calMonth, 1).getDay();
        const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
        const today = calNow.getDate();
        const dayHeaders = ['S','M','T','W','T','F','S'];
        let cells = '';
        for (let i = 0; i < firstDay; i++) { cells += '<span class="cal-cell cal-empty"></span>'; }
        for (let d = 1; d <= daysInMonth; d++) {
          cells += `<span class="cal-cell ${d === today ? 'cal-today' : ''}">${d}</span>`;
        }
        return `<div class="bento-bubble" data-bubble="${uid}" style="${dimStyle};background:var(--surface-container-low);padding:var(--gutter);border:1px solid var(--border-color)">
          ${editUI}
          <div class="cal-widget">
            <div class="cal-header">${monthNames[calMonth]} <span class="cal-year">${calYear}</span></div>
            <div class="cal-grid">
              ${dayHeaders.map(d => `<span class="cal-day-header">${d}</span>`).join('')}
              ${cells}
            </div>
          </div>
        </div>`;
      case 'timer':
        var ts = _timerState(uid);
        var tDisplay = _fmtTime(ts.elapsed);
        var tStatus = ts.running ? 'running' : (ts.elapsed > 0 ? 'paused' : 'idle');
        return `<div class="bento-bubble" data-bubble="${uid}" style="${dimStyle};background:var(--surface-container-low);padding:var(--gutter);border:1px solid var(--border-color)">
          ${editUI}
          <div class="timer-widget" data-timer-uid="${uid}">
            <div class="timer-display">${tDisplay}</div>
            <div class="timer-controls">
              <button class="timer-btn ${tStatus === 'running' ? 'timer-btn-active' : ''}" data-timer-action="toggle" data-timer-uid="${uid}">${ts.running ? 'Pause' : 'Start'}</button>
              <button class="timer-btn timer-btn-reset" data-timer-action="reset" data-timer-uid="${uid}">Reset</button>
            </div>
          </div>
        </div>`;
      case 'pomodoro':
        var ps = _pomoState(uid);
        var pDisplay = _fmtTime(ps.remaining);
        var phaseLabels = { focus:'Focus', short:'Short Break', long:'Long Break' };
        var pct = ps.total > 0 ? ((ps.total - ps.remaining) / ps.total) * 100 : 0;
        var pPhase = phaseLabels[ps.phase] || 'Focus';
        var pCycles = ps.cycle + 1;
        var pRunning = ps.running;
        return `<div class="bento-bubble" data-bubble="${uid}" style="${dimStyle};background:var(--surface-container-low);padding:var(--gutter);border:1px solid var(--border-color)">
          ${editUI}
          <div class="pomo-widget" data-pomo-uid="${uid}">
            <div class="pomo-header"><span class="pomo-phase">${pPhase}</span><span class="pomo-cycle">#${pCycles}</span></div>
            <div class="pomo-ring"><svg viewBox="0 0 120 120"><circle class="pomo-ring-bg" cx="60" cy="60" r="52"/><circle class="pomo-ring-fg" cx="60" cy="60" r="52" stroke-dasharray="326.73" stroke-dashoffset="${326.73 - (326.73 * pct / 100)}"/></svg><span class="pomo-time">${pDisplay}</span></div>
            <div class="pomo-controls">
              <button class="timer-btn ${pRunning ? 'timer-btn-active' : ''}" data-pomo-action="toggle" data-pomo-uid="${uid}">${pRunning ? 'Pause' : 'Start'}</button>
              <button class="timer-btn timer-btn-reset" data-pomo-action="skip" data-pomo-uid="${uid}">Skip</button>
            </div>
          </div>
        </div>`;
      case 'spotify':
        var spotUrl = hubContent.spotifyUrl || 'https://open.spotify.com/embed/playlist/37i9dQZF1DXcBWIGoYBM5M?utm_source=generator';
        return `<div class="bento-bubble" data-bubble="${uid}" style="${dimStyle};background:var(--surface-container-low);padding:0;border:1px solid var(--border-color);overflow:hidden">
          ${editUI}
          <div class="spotify-widget">
            <iframe src="${e(spotUrl)}" width="100%" height="100%" frameborder="0" allowtransparency="true" allow="encrypted-media"></iframe>
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

  // ─── Clock updater ────────────────────────────
  if (_clockInterval) { clearInterval(_clockInterval); _clockInterval = null; }
  const clockFaces = grid.querySelectorAll('.clock-face[data-clock-uid]');
  if (clockFaces.length > 0) {
    _clockInterval = setInterval(function() {
      const n = new Date();
      const hh = String(n.getHours()).padStart(2,'0');
      const mm = String(n.getMinutes()).padStart(2,'0');
      const ss = String(n.getSeconds()).padStart(2,'0');
      const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
      const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
      const dateStr = days[n.getDay()] + ', ' + months[n.getMonth()] + ' ' + n.getDate();
      document.querySelectorAll('.clock-face[data-clock-uid]').forEach(function(el) {
        const timeEl = el.querySelector('.clock-time');
        const secEl = el.querySelector('.clock-seconds');
        const dateEl = el.querySelector('.clock-date');
        if (timeEl) timeEl.textContent = hh + ':' + mm;
        if (secEl) secEl.textContent = ss;
        if (dateEl) dateEl.textContent = dateStr;
      });
    }, 1000);
  }

  // ─── Weather fetcher ──────────────────────────
  const weatherWidgets = grid.querySelectorAll('.weather-widget[data-weather-uid]');
  if (weatherWidgets.length > 0 && typeof navigator !== 'undefined' && navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(function(pos) {
      const lat = pos.coords.latitude;
      const lon = pos.coords.longitude;
      const cacheKey = 'hub-weather-' + Math.round(lat * 10) + '-' + Math.round(lon * 10);
      var cached = null;
      try { cached = JSON.parse(localStorage.getItem(cacheKey)); } catch(e) {}
      if (cached && Date.now() - cached.ts < 600000) {
        weatherWidgets.forEach(function(w) { updateWeatherWidget(w, cached.data); });
        return;
      }
      var url = 'https://api.open-meteo.com/v1/forecast?latitude=' + lat + '&longitude=' + lon + '&current_weather=true&timezone=auto';
      fetch(url).then(function(r) { return r.json(); }).then(function(data) {
        if (!data || !data.current_weather) return;
        var wd = {
          temp: data.current_weather.temperature,
          code: data.current_weather.weathercode,
          wind: data.current_weather.windspeed
        };
        try { localStorage.setItem(cacheKey, JSON.stringify({ts: Date.now(), data: wd})); } catch(e) {}
        weatherWidgets.forEach(function(w) { updateWeatherWidget(w, wd); });
      }).catch(function() {
        weatherWidgets.forEach(function(w) {
          w.innerHTML = '<div class="weather-error"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="width:16px;height:16px"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg><span>Could not load weather</span></div>';
        });
      });
    }, function() {
      weatherWidgets.forEach(function(w) {
        w.innerHTML = '<div class="weather-error"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="width:16px;height:16px"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg><span>Location access needed</span></div>';
      });
    }, {timeout: 8000, enableHighAccuracy: false});
  } else if (weatherWidgets.length > 0) {
    weatherWidgets.forEach(function(w) {
      w.innerHTML = '<div class="weather-error"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="width:16px;height:16px"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg><span>Geolocation unavailable</span></div>';
    });
  }

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
    links: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg>',
    progress: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>',
    clock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
    weather: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/></svg>',
    calendar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>',
    timer: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/><line x1="22" y1="2" x2="18" y2="6"/></svg>',
    pomodoro: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="M2 12h2"/><path d="M20 12h2"/></svg>',
    spotify: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/><line x1="12" y1="2" x2="12" y2="7"/><line x1="12" y1="17" x2="12" y2="22"/><line x1="2" y1="12" x2="7" y2="12"/><line x1="17" y1="12" x2="22" y2="12"/></svg>'
  };
  return icons[t] || '';
}

/* ─── Weather widget updater ────────────────── */
function updateWeatherWidget(widget, data) {
  var codes = {
    0:'Clear',1:'Clear',2:'Cloudy',3:'Overcast',
    45:'Foggy',48:'Foggy',
    51:'Drizzle',53:'Drizzle',55:'Drizzle',
    61:'Rain',63:'Rain',65:'Rain',
    71:'Snow',73:'Snow',75:'Snow',
    80:'Showers',81:'Showers',82:'Showers',
    95:'Storm',96:'Storm',99:'Storm'
  };
  var icons = {
    'Clear':'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="width:28px;height:28px"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>',
    'Cloudy':'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="width:28px;height:28px"><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/></svg>',
    'Overcast':'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="width:28px;height:28px"><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/></svg>',
    'Foggy':'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="width:28px;height:28px"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="21" y2="6"/></svg>',
    'Drizzle':'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="width:28px;height:28px"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/><line x1="8" y1="16" x2="8" y2="18"/><line x1="12" y1="16" x2="12" y2="18"/><line x1="16" y1="16" x2="16" y2="18"/></svg>',
    'Rain':'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="width:28px;height:28px"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/><line x1="8" y1="16" x2="8" y2="20"/><line x1="12" y1="16" x2="12" y2="20"/><line x1="16" y1="16" x2="16" y2="20"/></svg>',
    'Snow':'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="width:28px;height:28px"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/><line x1="8" y1="19" x2="8" y2="21"/><line x1="12" y1="19" x2="12" y2="21"/><line x1="16" y1="19" x2="16" y2="21"/></svg>',
    'Showers':'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="width:28px;height:28px"><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/><line x1="10" y1="16" x2="10" y2="18"/><line x1="14" y1="16" x2="14" y2="18"/></svg>',
    'Storm':'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="width:28px;height:28px"><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/><polyline points="13 7 9 13 13 13 11 19"/></svg>'
  };
  var cond = codes[data.code] || 'Clear';
  var icon = icons[cond] || icons['Clear'];
  widget.innerHTML = '<div class="weather-main">' + icon + '<span class="weather-temp">' + Math.round(data.temp) + '&deg;</span></div><div class="weather-cond">' + cond + '</div>';
}

/* ─── Progress chart data generator ─────────── */
function generateProgressData() {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0=Sun
  const seed = now.getFullYear() * 1000 + (now.getMonth() + 1) * 100 + now.getDate();
  const rng = (n) => ((seed * (n + 1) * 9301 + 49297) % 233280) / 233280;
  const daily = [];
  let total = 0;
  let streak = 0;
  for (let i = 6; i >= 0; i--) {
    const val = Math.floor(rng(i) * 8) + 1;
    daily.push(val);
    total += val;
  }
  // Calculate streak from today backwards
  for (let i = 6; i >= 0; i--) {
    if (daily[i] >= 3) streak++;
    else break;
  }
  const rate = Math.round((total / (7 * 8)) * 100);
  return { daily, total, streak, rate };
}

/* ─── Add bubble types ─────────────────────── */
function addBubbleTypes(types) {
  const layout = normalizeBentoLayout(hubContent.bentoLayout, hubContent);
  types.forEach(t => {
    const item = {t, uid: _nextUid()};
    if (t === 'images') {
      let maxNum = 0;
      layout.filter(i => i.t === 'images').forEach(i => {
        const m = parseInt((i.imageId || '').replace('hub-image-', ''), 10);
        if (!isNaN(m) && m > maxNum) maxNum = m;
      });
      if (typeof state !== 'undefined' && state.images) {
        for (const k of Object.keys(state.images)) {
          const m = parseInt(k.replace('hub-image-', ''), 10);
          if (!isNaN(m) && m > maxNum) maxNum = m;
        }
      }
      item.imageId = 'hub-image-' + (maxNum + 1);
    } else {
      if (layout.find(i => i.t === t)) return;
    }
    layout.push(item);
  });
  hubContent.bentoLayout = layout;
  saveHubContent();
  renderHubBento();
}

/* ─── Timer / Pomodoro helpers ────────────────── */
function _timerState(uid) {
  if (!_timerIntervals[uid]) _timerIntervals[uid] = { elapsed: 0, running: false, startTs: null };
  var s = _timerIntervals[uid];
  if (s.running && s.startTs) {
    s.elapsed = s.elapsed + (Date.now() - s.startTs);
    s.startTs = Date.now();
  }
  return s;
}
function _pomoState(uid) {
  if (!_pomodoroState[uid]) _pomodoroState[uid] = { phase:'focus', remaining:1500, total:1500, running:false, startTs:null, cycle:0 };
  var s = _pomodoroState[uid];
  if (s.running && s.startTs) {
    var delta = Math.floor((Date.now() - s.startTs) / 1000);
    s.remaining = Math.max(0, s.remaining - delta);
    s.startTs = Date.now();
    if (s.remaining <= 0) {
      s.running = false;
      s.startTs = null;
      _advancePomoPhase(uid);
      _renderPomo(uid);
    }
  }
  return s;
}
function _advancePomoPhase(uid) {
  var s = _pomodoroState[uid];
  if (!s) return;
  if (s.phase === 'focus') {
    s.cycle++;
    if (s.cycle % 4 === 0) {
      s.phase = 'long';
      s.total = 900; // 15 min
    } else {
      s.phase = 'short';
      s.total = 300; // 5 min
    }
  } else {
    s.phase = 'focus';
    s.total = 1500; // 25 min
  }
  s.remaining = s.total;
  s.startTs = null;
}
function _fmtTime(seconds) {
  var m = Math.floor(seconds / 60);
  var sec = seconds % 60;
  return String(m).padStart(2,'0') + ':' + String(sec).padStart(2,'0');
}
function _renderPomo(uid) {
  var el = document.querySelector('.pomo-widget[data-pomo-uid="' + uid + '"]');
  if (!el) return;
  var s = _pomodoroState[uid];
  if (!s) return;
  var phaseLabels = { focus:'Focus', short:'Short Break', long:'Long Break' };
  var pct = s.total > 0 ? ((s.total - s.remaining) / s.total) * 100 : 0;
  var pRunning = s.running;
  el.querySelector('.pomo-time').textContent = _fmtTime(s.remaining);
  el.querySelector('.pomo-phase').textContent = phaseLabels[s.phase] || 'Focus';
  el.querySelector('.pomo-cycle').textContent = '#' + (s.cycle + 1);
  var fg = el.querySelector('.pomo-ring-fg');
  if (fg) fg.style.strokeDashoffset = 326.73 - (326.73 * pct / 100);
  var btn = el.querySelector('[data-pomo-action="toggle"]');
  if (btn) {
    btn.textContent = pRunning ? 'Pause' : 'Start';
    btn.classList.toggle('timer-btn-active', pRunning);
  }
}
function _renderTimer(uid) {
  var el = document.querySelector('.timer-widget[data-timer-uid="' + uid + '"]');
  if (!el) return;
  var s = _timerIntervals[uid];
  if (!s) return;
  el.querySelector('.timer-display').textContent = _fmtTime(s.elapsed);
  var btn = el.querySelector('[data-timer-action="toggle"]');
  if (btn) {
    btn.textContent = s.running ? 'Pause' : 'Start';
    btn.classList.toggle('timer-btn-active', s.running);
  }
}

/* ─── ADD popup (hide-popup style) ──────────── */
function showHubAddPopup(e) {
  const existing = document.querySelector('.hub-add-popup');
  if (existing) { existing.remove(); document.querySelector('.hub-popup-overlay')?.remove(); return; }

  const overlay = document.createElement('div');
  overlay.className = 'hub-popup-overlay';
  overlay.addEventListener('click', () => { overlay.remove(); popup.remove(); });
  document.body.appendChild(overlay);

  const popup = document.createElement('div');
  popup.className = 'hub-edit-popup hub-add-popup';

  const layout = normalizeBentoLayout(hubContent.bentoLayout, hubContent);
  const has = t => layout.some(i => i.t === t);

  const labels = { goals:'Goals', images:'Images', priorities:'Priorities', quote:'Quote', todos:'To-Dos', text:'Text', habits:'Habits', notes:'Notes', links:'Links', progress:'Progress', clock:'Clock', weather:'Weather', calendar:'Calendar' };
  const types = ['goals','priorities','todos','habits','progress','clock','weather','calendar','quote','text','notes','images','links'];

  popup.innerHTML = `
    <div class="add-title">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v8"/><path d="M8 12h8"/></svg>
      Add to Canvas
    </div>

    <div class="hub-add-layouts">
      <button class="hub-add-layout-btn" data-layout="focus" title="Goals + Priorities + To-Dos">
        <span class="lcon">${bubbleTypeIcon('goals')}</span>
        <span class="llabel">Focus Dashboard</span>
        <span class="ldesc">Goals, priorities &amp; todos</span>
      </button>
      <button class="hub-add-layout-btn" data-layout="tracker" title="Habits + Progress + To-Dos">
        <span class="lcon">${bubbleTypeIcon('habits')}</span>
        <span class="llabel">Daily Tracker</span>
        <span class="ldesc">Habits, progress &amp; journal</span>
      </button>
      <button class="hub-add-layout-btn" data-layout="creative" title="Images + Quote + Notes">
        <span class="lcon">${bubbleTypeIcon('images')}</span>
        <span class="llabel">Creative Board</span>
        <span class="ldesc">Images, quotes &amp; notes</span>
      </button>
      <button class="hub-add-layout-btn" data-layout="all" title="All bubble types">
        <span class="lcon">${bubbleTypeIcon('todos')}</span>
        <span class="llabel">Everything</span>
        <span class="ldesc">All 10 bubble types</span>
      </button>
    </div>

    <div class="add-divider"></div>

    <div class="add-list">
      ${types.map(t => {
        const disabled = t !== 'images' && has(t);
        return `<button class="add-row" data-btype="${t}" ${disabled ? 'disabled' : ''} type="button">
          <span class="add-row-icon">${bubbleTypeIcon(t)}</span>
          <span class="add-row-label">${labels[t] || t}</span>
          ${disabled ? '<span class="add-row-check"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="width:12px;height:12px"><polyline points="20 6 9 17 4 12"/></svg></span>' : ''}
        </button>`;
      }).join('')}
    </div>

    <div class="hub-edit-popup-actions"><button class="cancel" id="hubAddCancel">Done</button></div>
  `;
  document.body.appendChild(popup);

  popup.querySelectorAll('.add-row:not([disabled])').forEach(el => {
    el.addEventListener('click', () => {
      addBubbleTypes([el.dataset.btype]);
      popup.remove();
      overlay.remove();
    });
  });
  popup.querySelectorAll('.hub-add-layout-btn').forEach(el => {
    el.addEventListener('click', () => {
      const map = {
        focus: ['goals','priorities','todos','clock'],
        tracker: ['habits','progress','todos','text'],
        creative: ['images','quote','notes','calendar'],
        all: ['goals','images','priorities','quote','todos','text','habits','notes','links','progress','clock','weather','calendar']
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
  overlay.addEventListener('click', () => { overlay.remove(); popup.remove(); });
  document.body.appendChild(overlay);

  const layout = normalizeBentoLayout(hubContent.bentoLayout, hubContent);
  hubContent.bentoLayout = layout;
  const popup = document.createElement('div');
  popup.className = 'hub-edit-popup hub-hide-popup';

  const labels = { goals:'Goals', images:'Images', priorities:'Priorities', quote:'Quote', todos:'To-Dos', text:'Text', habits:'Habits', notes:'Notes', links:'Links', progress:'Progress', clock:'Clock', weather:'Weather', calendar:'Calendar' };

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

  // (No longer syncing hubEditMode from state.editMode — they are independent)
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
