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

const MAX_CANVAS_HEIGHT = 10000;
let hubEditMode = localStorage.getItem(HUB_EDIT_KEY) === 'true';
let _bentoUidCounter = 0;
let _clockInterval = null;
let _timerIntervals = {};
let _pomodoroState = {};
let _calView = { year: 0, month: -1 }; // tracks displayed month/year for refresh
let _weatherFetched = false;
let _weatherLastData = null;
function _nextUid() { return 'b' + (++_bentoUidCounter) + '_' + Date.now(); }

/* ─── Section drag/drop reordering ─────────── */
function initHubLayout() {
  const container = document.querySelector('.hub-layout');
  if (!container) return;
  if (container._initHubLayoutWired) return;
  container._initHubLayoutWired = true;

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
  (layout || []).forEach(item => {
    const norm = typeof item === 'string' ? {t: item} : {...item};
    if (!norm.uid) norm.uid = _nextUid();
    if (norm.w === undefined || norm.h === undefined) {
      const sizeMap = {s:220, m:320, l:420, xl:540, full:600};
      norm.w = snap(sizeMap[norm.s] || 320);
      if (norm.t === 'images') {
        const imgLookup = norm.imageId || 'hub-tulips';
        const oldAspect = parent?.imageAspects?.[imgLookup] || parent?.imageAspect || 'landscape';
        const aspectRatios = {square:1, portrait:0.75, landscape:1.333, wide:1.778, tall:0.5625};
        const ratio = aspectRatios[oldAspect] || 1.333;
        norm.h = snap(norm.w / ratio);
      } else if (norm.t === 'spotify') {
        norm.h = snap(420);
      } else {
        norm.h = snap(280);
      }
      delete norm.s;
      // Migrate old imageAspect/imageAspects to per-item without mutating parent
      if (parent && parent.imageAspects) {
        result.forEach(function(n) {
          if (n.t === 'images' && !n.imageId) n.imageId = 'hub-tulips';
        });
      }
    }
    if (norm.hidden === undefined) norm.hidden = false;
    result.push(norm);
  });
  // Phase 1: position items that have x,y and resolve their collisions
  const placed = result.filter(i => i.x !== undefined && i.y !== undefined);
  const unplaced = result.filter(i => i.x === undefined || i.y === undefined);
  resolveBubbleCollisions(placed);
  // Phase 2: place new items below the lowest placed item
  let maxY = 24;
  placed.forEach(i => { maxY = Math.max(maxY, i.y + i.h); });
  unplaced.forEach(item => {
    item.x = snap(24);
    item.y = snap(maxY + 24);
    maxY = item.y + item.h;
  });
  // Phase 3: recombine and resolve any remaining collisions
  const combined = [...placed, ...unplaced];
  resolveBubbleCollisions(combined);
  return combined;
}

/* ─── Bubble collision push ────────────────── */
function rectsOverlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function resolveBubbleCollisions(layout, canvasWidth, canvasHeight, excludeUid) {
  layout = layout.filter(i => !i.hidden);
  // Determine canvas bounds
  if (canvasWidth === undefined) {
    var _gc = document.querySelector('.bento-grid');
    var _gr = _gc ? _gc.getBoundingClientRect() : null;
    canvasWidth = _gr ? _gr.width : 1800;
  }
  if (canvasHeight === undefined) canvasHeight = MAX_CANVAS_HEIGHT;
  function clamp(item) {
    if (item.uid === excludeUid) return;
    item.x = Math.max(0, Math.min(item.x, canvasWidth - item.w));
    item.y = Math.max(0, Math.min(item.y, canvasHeight - item.h));
  }
  let dirty = true;
  let maxIter = 40;
  while (dirty && maxIter-- > 0) {
    dirty = false;
    layout.sort((a, b) => a.y - b.y || a.x - b.x);
    for (let i = 0; i < layout.length; i++) {
      for (let j = i + 1; j < layout.length; j++) {
        if (!rectsOverlap(layout[i], layout[j])) continue;
        // Try rightward push first
        const pushX = snap(layout[i].x + layout[i].w + 24);
        if (pushX > layout[j].x && pushX - layout[j].x < (layout[i].y + layout[i].h + 24 - layout[j].y || 999)) {
          layout[j].x = pushX;
          dirty = true;
        } else {
          const pushY = snap(layout[i].y + layout[i].h + 24);
          if (pushY > layout[j].y) {
            layout[j].y = pushY;
            dirty = true;
          }
        }
        clamp(layout[j]);
      }
    }
  }
  // Final clamp for all items (except excluded)
  layout.forEach(clamp);
  return layout;
}

/* ─── Quote of the week bank ────────────────── */
const QUOTE_BANK = [
  { text: 'It does not matter how slowly you go as long as you do not stop.', author: 'Confucius' },
  { text: 'The only way to do great work is to love what you do.', author: 'Steve Jobs' },
  { text: 'Believe you can and you\'re halfway there.', author: 'Theodore Roosevelt' },
  { text: 'The future belongs to those who believe in the beauty of their dreams.', author: 'Eleanor Roosevelt' },
  { text: 'In the middle of every difficulty lies opportunity.', author: 'Albert Einstein' },
  { text: 'Success is not final, failure is not fatal: it is the courage to continue that counts.', author: 'Winston Churchill' },
  { text: 'What lies behind us and what lies before us are tiny matters compared to what lies within us.', author: 'Ralph Waldo Emerson' },
  { text: 'The only person you are destined to become is the person you decide to be.', author: 'Ralph Waldo Emerson' },
  { text: 'Everything you\'ve ever wanted is on the other side of fear.', author: 'George Addair' },
  { text: 'The best time to plant a tree was 20 years ago. The second best time is now.', author: 'Chinese Proverb' },
  { text: 'Your time is limited, don\'t waste it living someone else\'s life.', author: 'Steve Jobs' },
  { text: 'The journey of a thousand miles begins with a single step.', author: 'Lao Tzu' },
  { text: 'What you get by achieving your goals is not as important as what you become by achieving your goals.', author: 'Zig Ziglar' },
  { text: 'The only impossible journey is the one you never begin.', author: 'Tony Robbins' },
  { text: 'Act as if what you do makes a difference. It does.', author: 'William James' },
  { text: 'Do not wait to strike till the iron is hot; but make it hot by striking.', author: 'William Butler Yeats' },
  { text: 'Whether you think you can or you think you can\'t, you\'re right.', author: 'Henry Ford' },
  { text: 'The mind is everything. What you think you become.', author: 'Buddha' },
  { text: 'The best revenge is massive success.', author: 'Frank Sinatra' },
  { text: 'Fall seven times, stand up eight.', author: 'Japanese Proverb' },
  { text: 'Hardships often prepare ordinary people for an extraordinary destiny.', author: 'C.S. Lewis' },
  { text: 'It is during our darkest moments that we must focus to see the light.', author: 'Aristotle' },
  { text: 'Don\'t judge each day by the harvest you reap but by the seeds that you plant.', author: 'Robert Louis Stevenson' },
  { text: 'The secret of getting ahead is getting started.', author: 'Mark Twain' },
  { text: 'You miss 100% of the shots you don\'t take.', author: 'Wayne Gretzky' },
  { text: 'I have not failed. I\'ve just found 10,000 ways that won\'t work.', author: 'Thomas Edison' },
  { text: 'A person who never made a mistake never tried anything new.', author: 'Albert Einstein' },
  { text: 'The only limit to our realization of tomorrow will be our doubts of today.', author: 'Franklin D. Roosevelt' },
  { text: 'Do what you can, with what you have, where you are.', author: 'Theodore Roosevelt' },
  { text: 'Be yourself; everyone else is already taken.', author: 'Oscar Wilde' },
  { text: 'Two roads diverged in a wood, and I took the one less traveled by, and that has made all the difference.', author: 'Robert Frost' },
  { text: 'You must be the change you wish to see in the world.', author: 'Mahatma Gandhi' },
  { text: 'The purpose of our lives is to be happy.', author: 'Dalai Lama' },
  { text: 'Life is what happens when you\'re busy making other plans.', author: 'John Lennon' },
  { text: 'Get busy living or get busy dying.', author: 'Stephen King' },
  { text: 'In three words I can sum up everything I\'ve learned about life: it goes on.', author: 'Robert Frost' },
  { text: 'If you want to live a happy life, tie it to a goal, not to people or things.', author: 'Albert Einstein' },
  { text: 'We are what we repeatedly do. Excellence, then, is not an act, but a habit.', author: 'Aristotle' },
  { text: 'The only wealth which you will keep forever is the wealth you have given away.', author: 'Marcus Aurelius' },
  { text: 'First, have a definite, clear practical ideal; a goal, an objective. Second, have the necessary means to achieve your ends; wisdom, money, and methods. Third, adjust all your means to that end.', author: 'Aristotle' },
  { text: 'The greatest glory in living lies not in never falling, but in rising every time we fall.', author: 'Nelson Mandela' },
  { text: 'The way to get started is to quit talking and begin doing.', author: 'Walt Disney' },
  { text: 'Your time is limited, so don\'t waste it living someone else\'s life. Don\'t be trapped by dogma.', author: 'Steve Jobs' },
  { text: 'If you look at what you have in life, you\'ll always have more. If you look at what you don\'t have in life, you\'ll never have enough.', author: 'Oprah Winfrey' },
  { text: 'If you set your goals ridiculously high and it\'s a failure, you will fail above everyone else\'s success.', author: 'James Cameron' },
  { text: 'Life is either a daring adventure or nothing at all.', author: 'Helen Keller' },
  { text: 'Many of life\'s failures are people who did not realize how close they were to success when they gave up.', author: 'Thomas Edison' },
  { text: 'The scariest moment is always just before you start.', author: 'Stephen King' },
  { text: 'There is nothing impossible to they who will try.', author: 'Alexander the Great' },
  { text: 'The only way to discover the limits of the possible is to go beyond them into the impossible.', author: 'Arthur C. Clarke' },
  { text: 'Try not to become a man of success, but rather try to become a man of value.', author: 'Albert Einstein' },
  { text: 'Great minds discuss ideas; average minds discuss events; small minds discuss people.', author: 'Eleanor Roosevelt' },
  { text: 'If you cannot do great things, do small things in a great way.', author: 'Napoleon Hill' },
];

/* ─── Get current ISO week number ──────────── */
function getCurrentWeekNumber() {
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const days = Math.floor((now - startOfYear) / (24 * 60 * 60 * 1000));
  return Math.ceil((days + startOfYear.getDay() + 1) / 7);
}

/* ─── Get quote of the week ────────────────── */
function getQuoteOfTheWeek() {
  const weekNum = getCurrentWeekNumber();
  const idx = (weekNum - 1) % QUOTE_BANK.length;
  return { ...QUOTE_BANK[idx], weekNumber: weekNum };
}

/* ─── Default hub content ──────────────────── */
const HUB_DEFAULTS = {
  greeting: '',
  goals: ['develop emotional maturity', 'go to the gym + workout consistently', 'eat intentionally', 'learn finances via books'],
  priorities: ['mental and physical health', 'academics', 'self-development'],
  quote: getQuoteOfTheWeek(),
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
      if (!hc.quote) hc.quote = getQuoteOfTheWeek();
      else {
        // Auto-rotate quote of the week
        const currentWeek = getCurrentWeekNumber();
        if (!hc.quote.weekNumber || hc.quote.weekNumber !== currentWeek) {
          const weekly = getQuoteOfTheWeek();
          hc.quote.text = weekly.text;
          hc.quote.author = weekly.author;
          hc.quote.weekNumber = weekly.weekNumber;
        }
      }
      if (!hc.todos) hc.todos = defaults.todos.map(t => ({...t}));
      if (!hc.habits) hc.habits = [...defaults.habits];
      if (!hc.habitData) hc.habitData = {};
      if (hc.notes === undefined) hc.notes = '';
      if (!hc.links) hc.links = defaults.links.map(l => ({...l}));
      return hc;
    }
  } catch(e) { console.warn('[img] loadHubContent: error:', e); }
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
function toggleHubEdit(on) {
  // Blur any focused editable field to trigger save before we exit
  if (document.activeElement && document.activeElement.closest('[contenteditable],[data-edit],[data-save]')) {
    document.activeElement.blur();
  }
  // Sync live DOM bubble dimensions into the layout before saving
  if (hubEditMode) {
    document.querySelectorAll('.bento-bubble').forEach(function(el) {
      var uid = el.dataset.bubble;
      if (!uid) return;
      var w = el.offsetWidth;
      var h = el.offsetHeight;
      if (!w || !h) return;
      var item = hubContent.bentoLayout.find(function(i) { return i.uid === uid; });
      if (item) {
        item.w = Math.max(100, snap(w));
        item.h = Math.max(80, snap(h));
      }
    });
    resolveBubbleCollisions(hubContent.bentoLayout);
  }
  hubEditMode = on !== undefined ? on : !hubEditMode;
  localStorage.setItem(HUB_EDIT_KEY, hubEditMode);
  if (!hubEditMode) saveHubContent();
  // Sync with global state.editMode when exiting edit mode
  if (!hubEditMode && typeof state !== 'undefined' && state.editMode) {
    state.editMode = false;
    document.documentElement.classList.remove('edit-mode');
    var ind = document.getElementById('editModeIndicator');
    if (ind) { ind.classList.remove('active'); setTimeout(function() { ind.classList.add('hidden'); }, 300); }
    document.dispatchEvent(new CustomEvent('editModeChange'));
  }
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
  resetBentoInteractions();
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
      ? `<div class="bento-resize-edge" data-resize-axis="e" data-resize-bubble="${uid}"></div><div class="bento-resize-edge" data-resize-axis="s" data-resize-bubble="${uid}"></div><div class="bento-resize-handle" data-resize-axis="se" data-resize-bubble="${uid}"></div>`
      : '';
    const editUI = isEdit
      ? `<div class="bento-bubble-handle" draggable="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="width:14px;height:14px"><circle cx="8" cy="6" r="1.5"/><circle cx="16" cy="6" r="1.5"/><circle cx="8" cy="12" r="1.5"/><circle cx="16" cy="12" r="1.5"/><circle cx="8" cy="18" r="1.5"/><circle cx="16" cy="18" r="1.5"/></svg></div>
         <button class="bento-bubble-btn" data-duplicate-bubble="${uid}" title="Duplicate" style="right:34px"><svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="6" y="6" width="10" height="10" rx="1"/><path d="M4 14V5a1 1 0 0 1 1-1h9"/></svg></button>
         <button class="bento-bubble-btn" data-copy-bubble="${uid}" title="Copy" style="right:62px"><svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="4" y="8" width="10" height="10" rx="1"/><path d="M8 4V3a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1h-1"/></svg></button>
         <button class="bento-bubble-remove" data-remove-bubble="${uid}">×</button>${resizeHandle}`
      : '';
    const clampY = Math.max(0, Math.min(y, MAX_CANVAS_HEIGHT - h));
    const clampH = Math.min(h, MAX_CANVAS_HEIGHT - clampY);
    const dimStyle = `left:${x}px;top:${clampY}px;width:${w}px;height:${clampH}px;overflow:auto`;

    switch (type) {
      case 'goals':
        return `<div class="bento-bubble" data-bubble="${uid}" style="${dimStyle};background:var(--surface-container);padding:var(--gutter);border:1px solid var(--border-color)">
          ${editUI}
          <div class="w-head"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg><span>Goals</span></div>
          <div class="w-list" id="hubGoalsList">
            ${hubContent.goals.map((g, i) =>
              `<div class="w-item" data-idx="${i}">
                <span class="w-item-num">${i+1}</span>
                <span class="w-item-text${isEdit ? ' hub-editable' : ''}" contenteditable="${isEdit}" data-edit="goals" data-idx="${i}">${e(g)}</span>
                ${isEdit ? `<button class="hub-edit-item-btn del" data-del="goals" data-idx="${i}">×</button>` : ''}
              </div>`
            ).join('')}
            <button class="w-add-btn" data-add="goals"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>Add goal</button>
          </div>
        </div>`;
      case 'images':
        const imgId = item.imageId || 'hub-tulips';
        const imgInfo = typeof getImageWithStyle === 'function' ? getImageWithStyle(imgId) : { url: getImage(imgId), fit: 'cover' };
        const imgUrl = imgInfo.url;
        const imgFit = imgInfo.fit;
        const hasImg = !!imgUrl;
        return `<div class="bento-bubble" data-bubble="${uid}" style="${dimStyle};padding:var(--gutter);border:1px solid var(--border-color);background:var(--surface-container)">
          ${editUI}
          <div class="bento-img-wrap" style="width:100%;height:100%" data-img-picker="${imgId}">
            <img data-image-id="${imgId}" src="${e(imgUrl)}" alt="" style="width:100%;height:100%;object-fit:${imgFit};display:${hasImg ? 'block' : 'none'}">
            <div class="bento-img-placeholder" style="display:${hasImg ? 'none' : 'flex'}">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
              <span>Click to add photo</span>
            </div>
          </div>
        </div>`;
      case 'priorities':
        const priColors = ['#ef4444','#f59e0b','#10b981','#3b82f6','#8b5cf6'];
        return `<div class="bento-bubble" data-bubble="${uid}" style="${dimStyle};background:var(--surface-container);padding:var(--gutter);border:1px solid var(--border-color)">
          ${editUI}
          <div class="w-head"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg><span>Priorities</span></div>
          <div class="w-list" id="hubPrioritiesList">
            ${hubContent.priorities.map((p, i) =>
              `<div class="w-item w-item-card" data-idx="${i}">
                <span class="w-pri-dot" style="background:${priColors[i % priColors.length]}"></span>
                <span class="w-item-text${isEdit ? ' hub-editable' : ''}" contenteditable="${isEdit}" data-edit="priorities" data-idx="${i}">${e(p)}</span>
                ${isEdit ? `<button class="hub-edit-item-btn del" data-del="priorities" data-idx="${i}">×</button>` : ''}
              </div>`
            ).join('')}
            <button class="w-add-btn" data-add="priorities"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>Add priority</button>
          </div>
        </div>`;
      case 'quote':
        const q = hubContent.quote;
        return `<div class="bento-bubble" data-bubble="${uid}" style="${dimStyle};background:var(--surface-container-lowest);padding:var(--gutter);border:1px solid var(--border-color)">
          ${editUI}
          <div class="w-head"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z"/><path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z"/></svg><span>Quote</span><button class="w-shuffle-btn" data-quote-shuffle title="Random quote"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:12px;height:12px"><polyline points="16 3 21 3 21 8"/><line x1="4" y1="20" x2="21" y2="3"/><polyline points="21 16 21 21 16 21"/><line x1="15" y1="15" x2="21" y2="21"/><line x1="4" y1="4" x2="9" y2="9"/></svg></button></div>
          <div class="w-quote-content">
            <span class="w-quote-mark">\u201C</span>
            <div class="w-quote-text${isEdit ? ' hub-editable' : ''}" contenteditable="${isEdit}">${e(q.text)}</div>
          </div>
          ${q.author ? `<div class="w-quote-attribution">&mdash; ${e(q.author)}</div>` : ''}
          <div class="w-quote-bar"></div>
        </div>`;
      case 'todos':
        return `<div class="bento-bubble" data-bubble="${uid}" style="${dimStyle};background:var(--surface-container);padding:var(--gutter);border:1px solid var(--border-color)">
          ${editUI}
          <div class="w-head"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg><span>To Do's</span></div>
          <div class="w-list" id="hubTodoList">
            ${hubContent.todos.map((t, i) =>
              `<div class="w-item" data-idx="${i}">
                ${isEdit ? '<span class="w-todo-drag-handle" draggable="true" data-todo-drag="' + i + '">\u283F</span>' : ''}
                <span class="w-todo-box ${t.done ? 'w-todo-checked' : ''}">
                  ${t.done ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>' : ''}
                </span>
                <span class="w-item-text ${t.done ? 'w-todo-done' : ''}${isEdit ? ' hub-editable' : ''}" contenteditable="${isEdit}" data-edit="todos" data-idx="${i}">${e(t.text)}</span>
                ${isEdit ? `<button class="hub-edit-item-btn del" data-del="todos" data-idx="${i}">×</button>` : ''}
              </div>`
            ).join('')}
            <button class="w-add-btn" data-add="todos"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>Add to-do</button>
          </div>
        </div>`;
      case 'text':
        return `<div class="bento-bubble" data-bubble="${uid}" style="${dimStyle};background:var(--surface-container);padding:var(--gutter);border:1px solid var(--border-color)">
          ${editUI}
          <div class="w-text-wrap">
            <div class="${isEdit ? 'hub-editable' : ''}" contenteditable="${isEdit}" data-save="text">${e(hubContent.text || 'Write something...')}</div>
          </div>
        </div>`;
      case 'habits':
        const todayKey = new Date().toISOString().slice(0,10);
        const habitDone = hubContent.habitData?.[todayKey] || {};
        return `<div class="bento-bubble" data-bubble="${uid}" style="${dimStyle};background:var(--surface-container);padding:var(--gutter);border:1px solid var(--border-color)">
          ${editUI}
          <div class="w-head"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg><span>Habits</span></div>
          <div class="w-habit-grid" id="hubHabitsList">
            ${hubContent.habits.map((h, i) => {
              const checked = habitDone[i] ? ' w-habit-checked' : '';
              return `<div class="w-habit-chip" data-idx="${i}">
                <span class="w-habit-check${checked}" data-habit-toggle="${i}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></span>
                <span class="${isEdit ? 'hub-editable' : ''}" contenteditable="${isEdit}" data-edit="habits" data-idx="${i}">${e(h)}</span>
                ${isEdit ? `<button class="hub-edit-item-btn del" data-del="habits" data-idx="${i}">×</button>` : ''}
              </div>`;
            }).join('')}
            <button class="w-add-btn" data-add="habits"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>Add habit</button>
          </div>
        </div>`;
      case 'notes':
        return `<div class="bento-bubble" data-bubble="${uid}" style="${dimStyle};background:var(--surface-container);padding:var(--gutter);border:1px solid var(--border-color)">
          ${editUI}
          <div class="w-head"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/></svg><span>Notes</span></div>
          <div class="w-notes-wrap">
            <div class="${isEdit ? 'hub-editable' : ''}" contenteditable="${isEdit}" data-save="notes">${e(hubContent.notes || '')}</div>
          </div>
        </div>`;
      case 'links':
        return `<div class="bento-bubble" data-bubble="${uid}" style="${dimStyle};background:var(--surface-container);padding:var(--gutter);border:1px solid var(--border-color)">
          ${editUI}
          <div class="w-head"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg><span>Links</span></div>
          <div class="w-list" id="hubLinksList">
            ${hubContent.links.map((l, i) =>
              `<div class="w-link-card" data-idx="${i}">
                <div class="w-link-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg></div>
                <div style="flex:1;min-width:0;display:flex;flex-direction:column;gap:2px">
                  <span class="${isEdit ? 'hub-editable' : ''}" contenteditable="${isEdit}" data-edit="links-label" data-idx="${i}" style="font-size:0.78rem;font-weight:500;color:var(--text-primary)">${e(l.label)}</span>
                  <span style="display:flex;align-items:center;gap:4px">
                    <span class="${isEdit ? 'hub-editable' : ''}" contenteditable="${isEdit}" data-edit="links-url" data-idx="${i}" style="font-size:0.65rem;color:var(--text-tertiary);flex:1">${e(l.url)}</span>
                    <a href="${e(l.url)}" target="_blank" rel="noopener" style="flex-shrink:0;color:var(--text-tertiary);display:flex"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:10px;height:10px"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg></a>
                  </span>
                </div>
                ${isEdit ? `<button class="hub-edit-item-btn del" data-del="links" data-idx="${i}">×</button>` : ''}
              </div>`
            ).join('')}
            <button class="w-add-btn" data-add="links"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>Add link</button>
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
        return `<div class="bento-bubble" data-bubble="${uid}" style="${dimStyle};background:var(--surface-container);padding:var(--gutter);border:1px solid var(--border-color)">
          ${editUI}
          <div class="w-head" style="color:var(--primary)"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg><span>Progress</span></div>
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
        return `<div class="bento-bubble" data-bubble="${uid}" style="${dimStyle};background:var(--surface-container);padding:var(--gutter);border:1px solid var(--border-color)">
          ${editUI}
          <div class="clock-face" data-clock-uid="${uid}">
            <div class="clock-row"><span class="clock-time">${hh}:${mm}</span><span class="clock-seconds">${ss}</span></div>
            <span class="clock-date">${dateStr}</span>
          </div>
        </div>`;
      case 'weather':
        return `<div class="bento-bubble" data-bubble="${uid}" style="${dimStyle};background:var(--surface-container);padding:var(--gutter);border:1px solid var(--border-color)">
          ${editUI}
          <div class="weather-widget" data-weather-uid="${uid}">
            <div class="weather-loading">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="width:20px;height:20px"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
              <span>Fetching weather...</span>
            </div>
          </div>
        </div>`;
      case 'calendar':
        const calBase = new Date();
        const calOff = typeof item.calOffset === 'number' ? item.calOffset : 0;
        const calDate = new Date(calBase.getFullYear(), calBase.getMonth() + calOff, 1);
        const calYear = calDate.getFullYear();
        const calMonth = calDate.getMonth();
        const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
        const firstDay = new Date(calYear, calMonth, 1).getDay();
        const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
        const isCurrentMonth = calOff === 0;
        const today = calBase.getDate();
        const dayHeaders = ['S','M','T','W','T','F','S'];
        const allTasks = typeof loadTasks === 'function' ? loadTasks() : [];
        const daysWithTasks = {};
        allTasks.forEach(function(t) {
          if (t.date && t.date.startsWith(calYear + '-' + String(calMonth + 1).padStart(2, '0'))) {
            daysWithTasks[parseInt(t.date.slice(8))] = true;
          }
        });
        let cells = '';
        for (let i = 0; i < firstDay; i++) { cells += '<span class="cal-cell cal-empty"></span>'; }
        for (let d = 1; d <= daysInMonth; d++) {
          var cls = 'cal-cell';
          if (isCurrentMonth && d === today) cls += ' cal-today';
          if (daysWithTasks[d]) cls += ' cal-has-tasks';
          var dot = daysWithTasks[d] ? '<span class="cal-dot"></span>' : '';
          cells += `<span class="${cls}" data-cal-day="${calYear}-${String(calMonth+1).padStart(2,'0')}-${String(d).padStart(2,'0')}">${d}${dot}</span>`;
        }
        return `<div class="bento-bubble" data-bubble="${uid}" style="${dimStyle};background:var(--surface-container);padding:var(--gutter);border:1px solid var(--border-color)">
          ${editUI}
          <div class="cal-widget">
            <div class="cal-header">
              <button class="cal-nav" data-cal-nav="-1" title="Previous month"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="width:14px;height:14px"><polyline points="15 18 9 12 15 6"/></svg></button>
              <span><span class="cal-month">${monthNames[calMonth]}</span> <span class="cal-year">${calYear}</span></span>
              <button class="cal-nav" data-cal-nav="1" title="Next month"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="width:14px;height:14px"><polyline points="9 18 15 12 9 6"/></svg></button>
            </div>
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
        var presetsHtml = tStatus === 'idle' ? '<div class="timer-presets"><button class="timer-preset" data-timer-preset="60" data-timer-uid="' + uid + '">1m</button><button class="timer-preset" data-timer-preset="300" data-timer-uid="' + uid + '">5m</button><button class="timer-preset" data-timer-preset="900" data-timer-uid="' + uid + '">15m</button><button class="timer-preset" data-timer-preset="1800" data-timer-uid="' + uid + '">30m</button></div>' : '';
        return `<div class="bento-bubble" data-bubble="${uid}" style="${dimStyle};background:var(--surface-container);padding:var(--gutter);border:1px solid var(--border-color)">
          ${editUI}
          <div class="timer-widget" data-timer-uid="${uid}">
            ${presetsHtml}
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
        return `<div class="bento-bubble" data-bubble="${uid}" style="${dimStyle};background:var(--surface-container);padding:var(--gutter);border:1px solid var(--border-color)">
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
        var _spActiveId = null;
        try { _spActiveId = localStorage.getItem('haven-spotify-active') || null; } catch(e) {}
        var _spPlaylists = [];
        try { _spPlaylists = JSON.parse(localStorage.getItem('haven-spotify-playlists') || '[]'); } catch(e) {}
        var _spActivePlaylist = _spPlaylists.find(function(p) { return p.id === _spActiveId; });
        if (_spActivePlaylist) {
          var spotUrl = 'https://open.spotify.com/embed/playlist/' + _spActivePlaylist.id + '?utm_source=generator';
          return `<div class="bento-bubble" data-bubble="${uid}" style="${dimStyle};background:var(--surface-container-low);padding:0;border:1px solid var(--border-color);overflow:hidden">
            ${editUI}
            <div class="spotify-widget">
              <div class="spotify-header">
                <svg viewBox="0 0 24 24" fill="currentColor" style="width:12px;height:12px;flex-shrink:0"><path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.5 17.3c-.24.36-.66.48-1.02.24-2.82-1.74-6.36-2.1-10.56-1.14-.42.12-.78-.18-.9-.54-.12-.42.18-.78.54-.9 4.56-1.02 8.52-.6 11.64 1.32.42.18.48.66.3 1.02zm1.44-3.3c-.3.42-.84.6-1.26.3-3.24-1.98-8.16-2.58-11.94-1.38-.48.12-1.02-.12-1.14-.6-.12-.48.12-1.02.6-1.14 4.2-1.26 9.6-.6 13.32 1.68.36.18.54.78.24 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.3c-.6.18-1.2-.18-1.38-.72-.18-.6.18-1.2.72-1.38 4.26-1.26 11.28-1.02 15.72 1.62.54.3.72 1.02.42 1.56-.3.42-1.02.6-1.56.3z"/></svg>
                <span>${_spActivePlaylist.name}</span>
              </div>
              <iframe src="${e(spotUrl)}" frameborder="0" allowtransparency="true" allow="encrypted-media; autoplay" referrerpolicy="no-referrer" loading="lazy" style="display:block;width:100%;border:none"></iframe>
            </div>
          </div>`;
        } else {
          return `<div class="bento-bubble" data-bubble="${uid}" style="${dimStyle};background:var(--surface-container-low);padding:var(--gutter);border:1px solid var(--border-color)">
            ${editUI}
            <div class="spotify-widget spotify-empty">
              <svg viewBox="0 0 24 24" fill="currentColor" style="width:24px;height:24px;opacity:0.25"><path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.5 17.3c-.24.36-.66.48-1.02.24-2.82-1.74-6.36-2.1-10.56-1.14-.42.12-.78-.18-.9-.54-.12-.42.18-.78.54-.9 4.56-1.02 8.52-.6 11.64 1.32.42.18.48.66.3 1.02zm1.44-3.3c-.3.42-.84.6-1.26.3-3.24-1.98-8.16-2.58-11.94-1.38-.48.12-1.02-.12-1.14-.6-.12-.48.12-1.02.6-1.14 4.2-1.26 9.6-.6 13.32 1.68.36.18.54.78.24 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.3c-.6.18-1.2-.18-1.38-.72-.18-.6.18-1.2.72-1.38 4.26-1.26 11.28-1.02 15.72 1.62.54.3.72 1.02.42 1.56-.3.42-1.02.6-1.56.3z"/></svg>
              <span style="font-size:0.75rem">No playlist linked</span>
              <span class="spotify-hint">Add playlists via sidebar</span>
            </div>
          </div>`;
        }
      default:
        return `<div class="bento-bubble" data-bubble="${uid}" style="${dimStyle};padding:24px;background:var(--surface-container);border:1px dashed var(--border-color)">
          <div style="text-align:center;color:var(--text-tertiary);font-size:0.75rem">Unknown bubble</div>
        </div>`;
    }
  }

  const visible = layout.filter(i => !i.hidden);
  visible.forEach(item => {
    try {
      var html = bubbleHtml(item);
      var accent = hubContent.bubbleColors && hubContent.bubbleColors[item.uid];
      if (accent) {
        html = html.replace(/style="(left:[^"]+)"/, function(m, p1) { return 'style="' + p1 + ';--bubble-accent:' + accent + '"'; });
      }
      grid.insertAdjacentHTML('beforeend', html);
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

  // Wire duplicate-bubble buttons
  grid.querySelectorAll('[data-duplicate-bubble]').forEach(function(btn) {
    btn.addEventListener('click', function(e) {
      e.stopPropagation();
      var uid = this.dataset.duplicateBubble;
      var layout2 = normalizeBentoLayout(hubContent.bentoLayout, hubContent);
      var src = layout2.find(function(it) { return it.uid === uid; });
      if (!src) return;
      var copy = JSON.parse(JSON.stringify(src));
      copy.uid = 'bubble-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6);
      copy.x = src.x + 24;
      copy.y = src.y + 24;
      // Duplicate image if present
      if (copy.imageId) {
        var newId = copy.imageId;
        while (layout2.find(function(it) { return it.imageId === newId; }) || (hubContent.images && hubContent.images[newId])) {
          var parts = newId.split('-');
          var num = parseInt(parts[parts.length - 1]) || 1;
          parts[parts.length - 1] = String(num + 1);
          newId = parts.join('-');
        }
        copy.imageId = newId;
      }
      layout2.push(copy);
      resolveBubbleCollisions(layout2);
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
    addBtn.style.cssText = `position:absolute;left:24px;width:calc(100% - 48px)`;
    grid.appendChild(addBtn);
    updateAddBtnPosition();
    addBtn.addEventListener('click', showHubAddPopup);

    // Done Editing button
    var doneBtn = document.createElement('button');
    doneBtn.className = 'bento-edit-done-btn';
    doneBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg> Done Editing';
    grid.appendChild(doneBtn);
    doneBtn.addEventListener('click', function() { toggleHubEdit(); });

    // Register grid-level event listeners only once (guard via _hubEventsWired)
    if (!grid._hubEventsWired) {
      grid._hubEventsWired = true;

      // Right-click paste support for contenteditable fields only
      grid.addEventListener('contextmenu', function(e) {
        var editable = e.target.closest('[contenteditable]');
        if (editable) return; // allow default paste context menu on contenteditable
        e.preventDefault();
      });

      // Selection click handler — click a bubble to select, click elsewhere to deselect
      grid.addEventListener('click', function(e) {
        if (e.target.closest('.bento-bubble[data-suppress-click]')) return;
        if (!hubEditMode) return;
        var bubble = e.target.closest('.bento-bubble');
        if (!bubble) { grid.querySelectorAll('.bento-bubble.selected').forEach(function(b) { b.classList.remove('selected'); }); return; }
        // Don't select when clicking interactive elements inside the bubble
        if (e.target.closest('button, a, input, select, textarea, iframe, [contenteditable], [data-remove-bubble], [data-duplicate-bubble], [data-copy-bubble], [data-habit-toggle], [data-timer-action], [data-timer-preset], [data-pomo-action], [data-cal-nav], [data-quote-shuffle], .bento-bubble-handle, .bento-bubble-btn, .bento-resize-handle, .bento-resize-edge, .w-add-btn, .hub-edit-item-btn')) return;
        var wasSelected = bubble.classList.contains('selected');
        grid.querySelectorAll('.bento-bubble.selected').forEach(function(b) { b.classList.remove('selected'); });
        if (!wasSelected) bubble.classList.add('selected');
      });

      // Bubble context menu (right-click)
      grid.addEventListener('contextmenu', function(e) {
      var editable = e.target.closest('[contenteditable]');
      if (editable) return; // allow default paste menu
      // Handles/buttons area -> snap preset menu handles this, skip bubble menu
      if (e.target.closest('.bento-bubble-handle, .bento-bubble-remove, .bento-bubble-btn')) return;
      var bubble = e.target.closest('.bento-bubble');
      if (!bubble) { e.preventDefault(); return; }
      e.preventDefault();
      // Remove existing context menus
      var old = grid.querySelector('.bento-context-menu');
      if (old) old.remove();
      var uid = bubble.dataset.bubble;
      var menu = document.createElement('div');
      menu.className = 'bento-context-menu';
      menu.style.left = Math.min(e.offsetX || e.clientX - grid.getBoundingClientRect().left, grid.clientWidth - 160) + 'px';
      menu.style.top = (e.offsetY || e.clientY - grid.getBoundingClientRect().top) + 'px';
      menu.innerHTML =
        '<button data-action="duplicate" data-uid="' + uid + '"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:12px;height:12px"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>Duplicate</button>' +
        '<button data-action="remove" data-uid="' + uid + '"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:12px;height:12px"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>Remove</button>' +
        '<button data-action="reset-size" data-uid="' + uid + '"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:12px;height:12px"><polyline points="1 4 1 10 7 10"/><polyline points="23 20 23 14 17 14"/><path d="M20.49 9A9 9 0 005.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 013.51 15"/></svg>Reset Size</button>' +
        '<button data-action="move-front" data-uid="' + uid + '"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:12px;height:12px"><polyline points="18 15 12 9 6 15"/></svg>Bring Forward</button>' +
        '<button data-action="move-back" data-uid="' + uid + '"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:12px;height:12px"><polyline points="6 9 12 15 18 9"/></svg>Send Backward</button>';
      grid.appendChild(menu);

      // Close menu on click anywhere else
      var closeMenu = function(ev) {
        if (!menu.contains(ev.target)) { menu.remove(); document.removeEventListener('mousedown', closeMenu); }
      };
      setTimeout(function() { document.addEventListener('mousedown', closeMenu); }, 0);

      // Handle menu actions
      menu.querySelectorAll('button').forEach(function(btn) {
        btn.addEventListener('click', function(ev) {
          ev.stopPropagation();
          var action = this.dataset.action;
          var uid = this.dataset.uid;
          menu.remove();
          if (action === 'duplicate') {
            var dupBtn = grid.querySelector('[data-duplicate-bubble="' + uid + '"]');
            if (dupBtn) dupBtn.click();
          } else if (action === 'remove') {
            var rmBtn = grid.querySelector('[data-remove-bubble="' + uid + '"]');
            if (rmBtn) rmBtn.click();
          } else if (action === 'reset-size') {
            var layout = normalizeBentoLayout(hubContent.bentoLayout, hubContent);
            var item = layout.find(function(i) { return i.uid === uid; });
            if (item) {
              item.w = snap(320);
              item.h = item.t === 'spotify' ? snap(420) : item.t === 'images' ? snap(320 / 1.333) : snap(280);
              item.x = snap(24);
              item.y = snap(24);
              resolveBubbleCollisions(layout);
              hubContent.bentoLayout = layout;
              saveHubContent();
              renderHubBento();
            }
          } else if (action === 'move-front') {
            var el = grid.querySelector('[data-bubble="' + uid + '"]');
            if (el) {
              var maxZ = 0;
              grid.querySelectorAll('.bento-bubble').forEach(function(b) {
                var z = parseInt(b.style.zIndex) || 0;
                if (z > maxZ) maxZ = z;
              });
              el.style.zIndex = maxZ + 1;
            }
          } else if (action === 'move-back') {
            var el = grid.querySelector('[data-bubble="' + uid + '"]');
            if (el) {
              var minZ = 0;
              grid.querySelectorAll('.bento-bubble').forEach(function(b) {
                var z = parseInt(b.style.zIndex) || 0;
                if (z < minZ) minZ = z;
              });
              el.style.zIndex = minZ - 1;
            }
          }
        });
      });
    });
    }
  }

  if (visible.length > 0) {
    var lowest = visible.reduce(function(max, i) { return Math.max(max, i.y + (i.h || 240)); }, 0);
    grid.style.minHeight = Math.min(Math.max(800, lowest + 480), MAX_CANVAS_HEIGHT) + 'px';
  }

  document.querySelectorAll('img[data-image-id]').forEach(el => {
    el.src = getImage(el.dataset.imageId) || '';
  });

  // ─── Timer / Pomodoro wiring ──────────────────
  if (!grid._timerWired) {
    grid._timerWired = true;
    grid.addEventListener('click', function(e) {
      var shuffleBtn = e.target.closest('[data-quote-shuffle]');
      if (shuffleBtn) {
        var randQ = QUOTE_BANK[Math.floor(Math.random() * QUOTE_BANK.length)];
        hubContent.quote = { text: randQ.text, author: randQ.author, weekNumber: getCurrentWeekNumber() };
        saveHubContent();
        renderHubBento();
        return;
      }
      var presetBtn = e.target.closest('[data-timer-preset]');
      if (presetBtn) {
        var puid = presetBtn.dataset.timerUid;
        if (!puid) return;
        var ps = _timerState(puid);
        ps.elapsed = parseInt(presetBtn.dataset.timerPreset);
        _renderTimer(puid);
        return;
      }
      var toggleBtn = e.target.closest('[data-timer-action="toggle"]');
      if (toggleBtn) {
        var uid = toggleBtn.dataset.timerUid;
        var s = _timerIntervals[uid];
        if (!s) return;
        if (s.running) {
          s.elapsed = s.elapsed + (Date.now() - s.startTs);
          s.startTs = null;
          s.running = false;
          _timerClearTickIfIdle();
        } else {
          s.startTs = Date.now();
          s.running = true;
          if (!_timerIntervals._tick) {
            _timerIntervals._tick = setInterval(function() {
              Object.keys(_timerIntervals).forEach(function(k) {
                if (k === '_tick') return;
                var ts = _timerIntervals[k];
                if (ts.running && ts.startTs) {
                  ts.elapsed = ts.elapsed + (Date.now() - ts.startTs);
                  ts.startTs = Date.now();
                  _renderTimer(k);
                }
              });
            }, 200);
          }
        }
        _renderTimer(uid);
        return;
      }
      var resetBtn = e.target.closest('[data-timer-action="reset"]');
      if (resetBtn) {
        var uid2 = resetBtn.dataset.timerUid;
        var s2 = _timerIntervals[uid2];
        if (s2) { s2.elapsed = 0; s2.running = false; s2.startTs = null; }
        _renderTimer(uid2);
        return;
      }
      var pomoToggle = e.target.closest('[data-pomo-action="toggle"]');
      if (pomoToggle) {
        var puid = pomoToggle.dataset.pomoUid;
        var ps = _pomodoroState[puid];
        if (!ps) return;
        if (ps.running) {
          var elapsed = (Date.now() - ps.startTs) / 1000;
          ps.remaining = Math.max(0, ps.remaining - elapsed);
          ps.startTs = null;
          ps.running = false;
          _pomoClearTickIfIdle();
        } else {
          if (ps.remaining <= 0) {
            ps.remaining = ps.total;
          }
          ps.startTs = Date.now();
          ps.running = true;
          if (!_pomodoroState._tick) {
            _pomodoroState._tick = setInterval(function() {
              Object.keys(_pomodoroState).forEach(function(k) {
                if (k === '_tick') return;
                var ps2 = _pomodoroState[k];
                if (!ps2.running || !ps2.startTs) return;
                var now = Date.now();
                var elapsed = now - ps2.startTs;
                ps2.startTs = now;
                ps2.remaining = Math.max(0, ps2.remaining - elapsed / 1000);
                if (ps2.remaining <= 0) {
                  ps2.running = false;
                  ps2.startTs = null;
                  ps2.remaining = 0;
                  _advancePomoPhase(k);
                }
                _renderPomo(k);
              });
            }, 200);
          }
        }
        _renderPomo(puid);
        return;
      }
      var pomoSkip = e.target.closest('[data-pomo-action="skip"]');
      if (pomoSkip) {
        var puid2 = pomoSkip.dataset.pomoUid;
        var ps2 = _pomodoroState[puid2];
        if (ps2) {
          ps2.running = false;
          ps2.startTs = null;
          _advancePomoPhase(puid2);
        }
        _renderPomo(puid2);
        return;
      }
    });
  }

  // ─── Clock updater ────────────────────────────
  const clockFaces = grid.querySelectorAll('.clock-face[data-clock-uid]');
  if (clockFaces.length > 0) {
    if (_clockInterval) {
      // Interval already running, no need to restart
    } else {
      var _calMonthCheck = -1;
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
      // Auto-refresh calendar when month changes
      var cm = n.getMonth() + n.getFullYear() * 12;
      if (_calMonthCheck >= 0 && _calMonthCheck !== cm && grid.querySelector('.cal-nav')) {
        renderHubBento();
      }
      _calMonthCheck = cm;
    }, 1000);
    }
  }

  // ─── Weather fetcher (runs at most once) ──────
  const weatherWidgets = grid.querySelectorAll('.weather-widget[data-weather-uid]');
  if (weatherWidgets.length > 0) {
    // Apply cached data immediately if available
    if (_weatherLastData) {
      weatherWidgets.forEach(function(w) { updateWeatherWidget(w, _weatherLastData); });
    } else if (!_weatherFetched && typeof navigator !== 'undefined' && navigator.geolocation) {
      _weatherFetched = true;
      navigator.geolocation.getCurrentPosition(function(pos) {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        const cacheKey = 'hub-weather-' + Math.round(lat * 10) + '-' + Math.round(lon * 10);
        var cached = null;
        try { cached = JSON.parse(localStorage.getItem(cacheKey)); } catch(e) {}
        if (cached && Date.now() - cached.ts < 600000) {
          _weatherLastData = cached.data;
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
          _weatherLastData = wd;
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
  }

  setupBubbleDragDrop();
  setupBubbleResize();

  // Global keyboard shortcuts for edit mode
  if (isEdit && !grid._editKeysWired) {
    grid._editKeysWired = true;
    document.addEventListener('keydown', function(e) {
      if (!hubEditMode) return;
      // Ctrl+D: duplicate selected bubble
      if (e.ctrlKey && e.key === 'd') {
        e.preventDefault();
        var sel = grid.querySelector('.bento-bubble.selected');
        if (!sel) return;
        var uid = sel.dataset.bubble;
        var dupBtn = grid.querySelector('[data-duplicate-bubble="' + uid + '"]');
        if (dupBtn) dupBtn.click();
        return;
      }
      // Escape: deselect + close shortcuts panel
      if (e.key === 'Escape') {
        grid.querySelectorAll('.bento-bubble.selected').forEach(function(b) { b.classList.remove('selected'); });
        var sp = document.getElementById('bentoShortcutsPanel');
        if (sp) sp.remove();
        return;
      }
      // Arrow keys: nudge selected bubble
      var arrowMap = { ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0] };
      var dir = arrowMap[e.key];
      if (!dir) return;
      var sel = grid.querySelector('.bento-bubble.selected');
      if (!sel) return;
      e.preventDefault();
      var step = e.shiftKey ? 1 : 20;
      var dx = dir[0] * step;
      var dy = dir[1] * step;
      var x = parseInt(sel.style.left) || 0;
      var y = parseInt(sel.style.top) || 0;
      var w = sel.offsetWidth || parseInt(sel.style.width) || 320;
      var h = sel.offsetHeight || parseInt(sel.style.height) || 240;
      var gridRect = grid.getBoundingClientRect();
      x = Math.max(0, Math.min(x + dx, gridRect.width - w));
      y = Math.max(0, Math.min(y + dy, Math.min(gridRect.height, MAX_CANVAS_HEIGHT) - h));
      sel.style.left = x + 'px';
      sel.style.top = y + 'px';
      // Save to layout
      var uid = sel.dataset.bubble;
      var layout = normalizeBentoLayout(hubContent.bentoLayout, hubContent);
      var item = layout.find(function(i) { return i.uid === uid; });
      if (item) {
        item.x = x;
        item.y = y;
        resolveBubbleCollisions(layout);
        hubContent.bentoLayout = layout;
        // Update pushed bubbles' DOM positions
        layout.forEach(function(it) {
          if (it.uid === uid) return;
          var el = grid.querySelector('[data-bubble="' + it.uid + '"]');
          if (el) { el.style.left = it.x + 'px'; el.style.top = it.y + 'px'; }
        });
        saveHubContent();
      }
    });

    // Keyboard shortcuts reference button
    var shortBtn = document.createElement('button');
    shortBtn.className = 'bento-shortcuts-btn';
    shortBtn.id = 'bentoShortcutsBtn';
    shortBtn.textContent = '?';
    shortBtn.title = 'Keyboard shortcuts';
    document.body.appendChild(shortBtn);
    shortBtn.addEventListener('click', function() {
      var existing = document.getElementById('bentoShortcutsPanel');
      if (existing) { existing.remove(); return; }
      var panel = document.createElement('div');
      panel.className = 'bento-shortcuts-panel';
      panel.id = 'bentoShortcutsPanel';
      panel.innerHTML =
        '<div class="bento-shortcuts-title">Keyboard Shortcuts</div>' +
        '<div class="bento-shortcut-row"><kbd>Ctrl+D</kbd><span>Duplicate selected bubble</span></div>' +
        '<div class="bento-shortcut-row"><kbd>↑ ↓ ← →</kbd><span>Nudge by 20px</span></div>' +
        '<div class="bento-shortcut-row"><kbd>Shift+↑ ↓ ← →</kbd><span>Nudge by 1px</span></div>' +
        '<div class="bento-shortcut-row"><kbd>Escape</kbd><span>Deselect / Cancel drag</span></div>' +
        '<div class="bento-shortcut-row"><kbd>Double-click</kbd><span>Cancel drag / resize</span></div>';
      document.body.appendChild(panel);
      // Close on click outside
      var closer = function(ev) {
        if (!panel.contains(ev.target) && ev.target !== shortBtn) { panel.remove(); document.removeEventListener('mousedown', closer); }
      };
      setTimeout(function() { document.addEventListener('mousedown', closer); }, 0);
    });
  }
}

/* ─── Helper: keep add button below lowest widget ── */
function updateAddBtnPosition() {
  var btn = document.getElementById('bentoAddBubble');
  if (!btn) return;
  var g = document.querySelector('.bento-grid');
  if (!g) return;
  var lowest = 0;
  g.querySelectorAll('.bento-bubble').forEach(function(b) {
    var btm = b.offsetTop + b.offsetHeight;
    if (btm > lowest) lowest = btm;
  });
  btn.style.top = Math.min(Math.max(lowest + 50, 50), MAX_CANVAS_HEIGHT - 50) + 'px';
}

/* ─── Bubble drag/resize ───────────────────── */
let _bubbleDragData = null;
let _bubbleDragInitialized = false;
let _bubbleResizeData = null;
let _bubbleResizeInitialized = false;
let _handleLastClickTime = 0;

function resetBentoInteractions() {
  // Only clear active state — NEVER reset initialization flags,
  // otherwise event listeners get duplicated on each edit toggle.
  _bubbleDragData = null;
  _bubbleResizeData = null;
  // Clean up dragging and selected classes from any stuck bubbles
  document.querySelectorAll('.bento-bubble.dragging').forEach(function(el) { el.classList.remove('dragging'); });
  document.querySelectorAll('.bento-bubble.selected').forEach(function(el) { el.classList.remove('selected'); });
}

function setupBubbleDragDrop() {
  if (!hubEditMode) return;
  if (_bubbleDragInitialized) return;
  _bubbleDragInitialized = true;

  const grid = document.querySelector('.bento-grid');
  if (!grid) return;

  grid.addEventListener('mousedown', function(e) {
    // Drag can only be initiated from the 6-dots handle
    var dragZone = e.target.closest('.bento-bubble-handle');
    if (!dragZone) return;
    // Double-click on handle cancels any pending/active drag and un-holds the widget
    var now = Date.now();
    if (now - _handleLastClickTime < 400) {
      _handleLastClickTime = 0;
      cancelDrag();
      return;
    }
    _handleLastClickTime = now;
    // Don't start drag if clicking interactive elements inside the zone
    if (e.target.closest('button, a, input, select, textarea, iframe, [contenteditable], .w-add-btn, .hub-edit-item-btn, .bento-bubble-btn, .bento-bubble-remove, [data-habit-toggle], [data-timer-action], [data-timer-preset], [data-pomo-action], [data-cal-nav], [data-quote-shuffle], [data-copy-bubble], [data-duplicate-bubble], .bento-resize-edge')) return;
    const bubble = dragZone.closest('.bento-bubble');
    if (!bubble) return;
    var gr = grid.getBoundingClientRect();
    _bubbleDragData = {
      bubble,
      offsetX: e.clientX - bubble.getBoundingClientRect().left,
      offsetY: e.clientY - bubble.getBoundingClientRect().top,
      gridLeft: gr.left,
      gridTop: gr.top,
      startMouseX: e.clientX,
      startMouseY: e.clientY,
      originalX: parseInt(bubble.style.left) || 0,
      originalY: parseInt(bubble.style.top) || 0,
      active: false,
      cancelled: false
    };
  });

  // Cancel helper — restores original position/size
  function cancelDrag() {
    if (_bubbleDragData) {
      if (_bubbleDragData.active) {
        _bubbleDragData.bubble.style.left = _bubbleDragData.originalX + 'px';
        _bubbleDragData.bubble.style.top = _bubbleDragData.originalY + 'px';
        _bubbleDragData.bubble.classList.remove('dragging');
      }
      _bubbleDragData.cancelled = true;
      _bubbleDragData = null;
    }
    if (_bubbleResizeData) {
      _bubbleResizeData.bubble.style.width = _bubbleResizeData.originalW + 'px';
      _bubbleResizeData.bubble.style.height = _bubbleResizeData.originalH + 'px';
      _bubbleResizeData.cancelled = true;
      _bubbleResizeData.bubble.classList.remove('dragging');
      var tip = document.querySelector('.bento-resize-tooltip');
      if (tip) tip.style.display = 'none';
      _bubbleResizeData = null;
    }
    updateAddBtnPosition();
  }

  // Double-click on the grid cancels any held drag/resize
  grid.addEventListener('dblclick', function(e) {
    cancelDrag();
  });

  // Escape cancels drag/resize
  document.addEventListener('keydown', function _escCancel(e) {
    if (e.key === 'Escape' && (_bubbleDragData || _bubbleResizeData)) {
      cancelDrag();
    }
  });

  // Window blur cancels drag/resize (mouseup lost when clicking outside browser)
  window.addEventListener('blur', cancelDrag);

  document.addEventListener('mousemove', function(e) {
    if (!_bubbleDragData || _bubbleDragData.cancelled) return;
    // Lazily activate drag on first meaningful movement (5px threshold)
    if (!_bubbleDragData.active) {
      var dx = e.clientX - _bubbleDragData.startMouseX;
      var dy = e.clientY - _bubbleDragData.startMouseY;
      if (dx * dx + dy * dy < 25) return;
      _bubbleDragData.active = true;
      _bubbleDragData.dragLayout = normalizeBentoLayout(hubContent.bentoLayout, hubContent);
      _bubbleDragData.bubble.classList.add('dragging');
    }
    let newX = snap(e.clientX - _bubbleDragData.offsetX - _bubbleDragData.gridLeft);
    let newY = Math.max(0, snap(e.clientY - _bubbleDragData.offsetY - _bubbleDragData.gridTop));
    _bubbleDragData.bubble.style.left = newX + 'px';
    _bubbleDragData.bubble.style.top = newY + 'px';
    const dragLayout = _bubbleDragData.dragLayout;
    const dragItem = dragLayout.find(i => i.uid === _bubbleDragData.bubble.dataset.bubble);
    if (dragItem) {
      dragItem.x = newX;
      dragItem.y = newY;
      // Real-time collision push during drag
      resolveBubbleCollisions(dragLayout, undefined, undefined, _bubbleDragData.bubble.dataset.bubble);
      grid.querySelectorAll('.bento-bubble').forEach(function(el) {
        var it = dragLayout.find(i => i.uid === el.dataset.bubble);
        if (it && it.uid !== _bubbleDragData.bubble.dataset.bubble) {
          el.style.left = it.x + 'px';
          el.style.top = it.y + 'px';
        }
      });
      updateAddBtnPosition();
    }
  });

  document.addEventListener('mouseup', function(e) {
    if (!_bubbleDragData) return;
    // If drag was never activated, it was a click — let it pass through
    if (!_bubbleDragData.active || _bubbleDragData.cancelled) {
      _bubbleDragData = null;
      return;
    }
    _bubbleDragData.bubble.classList.remove('dragging');
    const bubble = _bubbleDragData.bubble;
    const gridRect = grid.getBoundingClientRect();
    const bRect = bubble.getBoundingClientRect();
    const bw = bRect.width, bh = bRect.height;
    let x = parseInt(bubble.style.left) || 0;
    let y = parseInt(bubble.style.top) || 0;
    x = Math.max(0, Math.min(snap(x), gridRect.width - bw));
    y = Math.max(0, Math.min(snap(y), Math.min(gridRect.height, MAX_CANVAS_HEIGHT) - bh));
    bubble.style.left = x + 'px';
    bubble.style.top = y + 'px';
    const uid = bubble.dataset.bubble;
    // Use the live dragLayout (accumulated from real-time pushes) instead of a fresh copy
    const dragLayout = _bubbleDragData.dragLayout;
    const item = dragLayout.find(i => i.uid === uid);
    if (item) {
      item.x = Math.max(0, x);
      item.y = Math.max(0, y);
      // Re-run collision one final time at the dropped position
      resolveBubbleCollisions(dragLayout);
      hubContent.bentoLayout = dragLayout;
      saveHubContent();
      // Update all bubbles' DOM positions without full re-render
      if (grid) {
        dragLayout.forEach(function(it) {
          var el = grid.querySelector('[data-bubble="' + it.uid + '"]');
          if (el) {
            el.style.left = it.x + 'px';
            el.style.top = it.y + 'px';
          }
        });
      }
    }
    updateAddBtnPosition();
    _bubbleDragData = null;
    bubble.classList.remove('selected');
    bubble.setAttribute('data-suppress-click', '1');
    setTimeout(function() { bubble.removeAttribute('data-suppress-click'); }, 50);
  });
}

function setupBubbleResize() {
  if (!hubEditMode) return;
  if (_bubbleResizeInitialized) return;
  _bubbleResizeInitialized = true;

  const grid = document.querySelector('.bento-grid');
  if (!grid) return;

  // Create resize tooltip
  var resizeTip = document.createElement('div');
  resizeTip.className = 'bento-resize-tooltip';
  document.body.appendChild(resizeTip);

  grid.addEventListener('mousedown', function(e) {
    const handle = e.target.closest('[data-resize-bubble]');
    if (!handle) return;
    e.preventDefault();
    e.stopPropagation();
    const bubble = handle.closest('.bento-bubble');
    if (!bubble) return;
    const rect = bubble.getBoundingClientRect();
    var axis = (handle.dataset.resizeAxis || 'se');
    _bubbleResizeData = {
      bubble,
      axis: axis,
      startW: rect.width,
      startH: rect.height,
      originalW: rect.width,
      originalH: rect.height,
      startX: e.clientX,
      startY: e.clientY,
      cancelled: false,
      resizeLayout: JSON.parse(JSON.stringify(normalizeBentoLayout(hubContent.bentoLayout, hubContent)))
    };
    bubble.classList.add('dragging');
    resizeTip.style.display = 'block';
    resizeTip.textContent = Math.round(rect.width) + ' × ' + Math.round(rect.height);
    resizeTip.style.left = (e.clientX + 12) + 'px';
    resizeTip.style.top = (e.clientY - 32) + 'px';
  });

  document.addEventListener('mousemove', function(e) {
    if (!_bubbleResizeData) return;
    const bubble = _bubbleResizeData.bubble;
    const gridRect = grid.getBoundingClientRect();
    const left = parseInt(bubble.style.left) || 0;
    const top = parseInt(bubble.style.top) || 0;
    const dx = e.clientX - _bubbleResizeData.startX;
    const dy = e.clientY - _bubbleResizeData.startY;
    var axis = _bubbleResizeData.axis;
    var curW = _bubbleResizeData.bubble.offsetWidth || parseInt(bubble.style.width) || 320;
    var curH = _bubbleResizeData.bubble.offsetHeight || parseInt(bubble.style.height) || 240;
    if (axis === 'e' || axis === 'se') {
      let newW = snap(Math.max(100, _bubbleResizeData.startW + dx));
      newW = Math.min(newW, gridRect.width - left);
      _bubbleResizeData.bubble.style.width = newW + 'px';
    }
    if (axis === 's' || axis === 'se') {
      let newH = snap(Math.max(80, _bubbleResizeData.startH + dy));
      newH = Math.min(newH, Math.min(gridRect.height, MAX_CANVAS_HEIGHT) - top);
      _bubbleResizeData.bubble.style.height = newH + 'px';
    }
    var finalW = parseInt(bubble.style.width) || curW;
    var finalH = parseInt(bubble.style.height) || curH;
    resizeTip.textContent = Math.round(finalW) + ' × ' + Math.round(finalH);
    resizeTip.style.left = (e.clientX + 12) + 'px';
    resizeTip.style.top = (e.clientY - 32) + 'px';
    // Real-time collision push during resize
    var resizeLayout = _bubbleResizeData.resizeLayout;
    var resizeUid = bubble.dataset.bubble;
    var resizeItem = resizeLayout.find(function(i) { return i.uid === resizeUid; });
    if (resizeItem) {
      if (axis === 'e' || axis === 'se') resizeItem.w = finalW;
      if (axis === 's' || axis === 'se') resizeItem.h = finalH;
      resolveBubbleCollisions(resizeLayout, undefined, undefined, resizeUid);
      grid.querySelectorAll('.bento-bubble').forEach(function(el) {
        var it = resizeLayout.find(function(i) { return i.uid === el.dataset.bubble; });
        if (it && it.uid !== resizeUid) {
          el.style.left = it.x + 'px';
          el.style.top = it.y + 'px';
        }
      });
      updateAddBtnPosition();
    }
  });

  document.addEventListener('mouseup', function() {
    if (!_bubbleResizeData) return;
    var cancelled = _bubbleResizeData.cancelled;
    _bubbleResizeData.bubble.classList.remove('dragging');
    if (cancelled) { resizeTip.style.display = 'none'; _bubbleResizeData = null; return; }
    const bubble = _bubbleResizeData.bubble;
    const gridRect = grid.getBoundingClientRect();
    const left = parseInt(bubble.style.left) || 0;
    const top = parseInt(bubble.style.top) || 0;
    var axis = _bubbleResizeData.axis;
    let w = parseInt(bubble.style.width) || 320;
    let h = parseInt(bubble.style.height) || 240;
    w = Math.min(w, gridRect.width - left);
    h = Math.min(h, Math.min(gridRect.height, MAX_CANVAS_HEIGHT) - top);
    const uid = bubble.dataset.bubble;
    const layout = normalizeBentoLayout(hubContent.bentoLayout, hubContent);
    const item = layout.find(i => i.uid === uid);
    if (item) {
      if (axis === 'e' || axis === 'se') item.w = Math.max(100, snap(w));
      if (axis === 's' || axis === 'se') item.h = Math.max(80, snap(h));
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
    updateAddBtnPosition();
    resizeTip.style.display = 'none';
    _bubbleResizeData = null;
    bubble.classList.remove('selected');
    bubble.setAttribute('data-suppress-click', '1');
    setTimeout(function() { bubble.removeAttribute('data-suppress-click'); }, 50);
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
  const allT = typeof loadTasks === 'function' ? loadTasks() : [];
  const now = new Date();
  const ws = new Date(now);
  ws.setDate(ws.getDate() - ((ws.getDay() + 6) % 7));
  ws.setHours(0,0,0,0);
  const dayLabels = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  const daily = [0,0,0,0,0,0,0];
  let totalDone = 0, totalAll = 0;
  let streak = 0;
  for (let i = 0; i < 7; i++) {
    const d = new Date(ws);
    d.setDate(d.getDate() + i);
    const dateStr = d.toISOString().slice(0,10);
    const dayTasks = allT.filter(t => t.date === dateStr);
    const done = dayTasks.filter(t => t.completed).length;
    daily[i] = Math.min(done, 20);
    totalDone += done;
    totalAll += dayTasks.length;
  }
  for (let i = 6; i >= 0; i--) {
    if (daily[i] > 0) streak++;
    else break;
  }
  const rate = totalAll > 0 ? Math.round((totalDone / totalAll) * 100) : 0;
  return { daily, total: totalDone, streak, rate, count: totalAll };
}

/* ─── Add bubble types ─────────────────────── */
function addBubbleTypes(types) {
  // Start from fresh normalized layout
  const layout = normalizeBentoLayout(hubContent.bentoLayout, hubContent);
  // Get grid width for gap-finding
  var gridEl = document.querySelector('.bento-grid');
  var gridWidth = gridEl ? gridEl.clientWidth : 800;
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
    item.w = snap(320);
    item.h = item.t === 'spotify' ? snap(420) : item.t === 'images' ? snap(320 / 1.333) : snap(280);
    // Smart gap-filling: find first horizontal gap that fits this item
    var pos = findBentoGap(layout, item.w, item.h, gridWidth);
    item.x = pos.x;
    item.y = pos.y;
    layout.push(item);
  });
  // Force all collisions to be resolved — this will push the new item down if needed
  resolveBubbleCollisions(layout);
  hubContent.bentoLayout = layout;
  saveHubContent();
  renderHubBento();
}

function findBentoGap(layout, bubbleW, bubbleH, gridWidth) {
  var items = layout.filter(function(i) { return !i.hidden; });
  if (items.length === 0) return { x: snap(24), y: snap(24) };
  // Collect unique start Y positions, sorted top to bottom
  var rows = {};
  items.forEach(function(i) {
    var rowKey = i.y;
    if (!rows[rowKey]) rows[rowKey] = [];
    rows[rowKey].push(i);
  });
  var sortedYs = Object.keys(rows).map(Number).sort(function(a, b) { return a - b; });
  // For each existing row, try to find a gap
  for (var yi = 0; yi < sortedYs.length; yi++) {
    var rowY = sortedYs[yi];
    var rowItems = rows[rowY].sort(function(a, b) { return a.x - b.x; });
    // Compute the effective bottom of this row (tallest item)
    var rowBottom = rowY;
    rowItems.forEach(function(i) { rowBottom = Math.max(rowBottom, i.y + i.h); });
    // Scan for gaps within the row
    var cursor = snap(24);
    for (var ri = 0; ri < rowItems.length; ri++) {
      // Check gap before this item
      if (cursor + bubbleW + 24 <= rowItems[ri].x) {
        // Also check that the item fits vertically in this row
        if (rowBottom - rowY >= bubbleH || rowY + bubbleH <= rowBottom + 48) {
          return { x: snap(cursor), y: snap(rowY) };
        }
      }
      cursor = Math.max(cursor, rowItems[ri].x + rowItems[ri].w + 24);
    }
    // Check gap after last item in this row
    if (cursor + bubbleW + 24 <= gridWidth) {
      if (rowBottom - rowY >= bubbleH || rowY + bubbleH <= rowBottom + 48) {
        return { x: snap(cursor), y: snap(rowY) };
      }
    }
    // Also try placing at the next row's Y if this row's height can't fit the bubble
    if (rowBottom - rowY < bubbleH && yi + 1 < sortedYs.length) {
      var nextRowY = sortedYs[yi + 1];
      // Can we fit between this row's bottom and the next row's top?
      if (nextRowY - rowBottom >= bubbleH) {
        var c2 = snap(24);
        for (var ri2 = 0; ri2 < rowItems.length; ri2++) {
          if (c2 + bubbleW + 24 <= rowItems[ri2].x) {
            return { x: snap(c2), y: snap(rowBottom + 24) };
          }
          c2 = Math.max(c2, rowItems[ri2].x + rowItems[ri2].w + 24);
        }
        if (c2 + bubbleW + 24 <= gridWidth) {
          return { x: snap(c2), y: snap(rowBottom + 24) };
        }
      }
    }
  }
  // Fallback: place below the lowest item
  var lowest = items.reduce(function(m, i) { return Math.max(m, i.y + i.h); }, 0);
  return { x: snap(24), y: snap(lowest + 30) };
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

function _timerClearTickIfIdle() {
  var anyRunning = false;
  for (var k in _timerIntervals) {
    if (k !== '_tick' && _timerIntervals[k].running) { anyRunning = true; break; }
  }
  if (!anyRunning && _timerIntervals._tick) {
    clearInterval(_timerIntervals._tick);
    delete _timerIntervals._tick;
  }
}
function _pomoClearTickIfIdle() {
  var anyRunning = false;
  for (var k in _pomodoroState) {
    if (k !== '_tick' && _pomodoroState[k].running) { anyRunning = true; break; }
  }
  if (!anyRunning && _pomodoroState._tick) {
    clearInterval(_pomodoroState._tick);
    delete _pomodoroState._tick;
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

  const labels = { goals:'Goals', images:'Images', priorities:'Priorities', quote:'Quote', todos:'To-Dos', text:'Text', habits:'Habits', notes:'Notes', links:'Links', progress:'Progress', clock:'Clock', weather:'Weather', calendar:'Calendar', timer:'Timer', pomodoro:'Pomodoro', spotify:'Spotify' };
  const types = ['goals','priorities','todos','habits','progress','clock','weather','calendar','timer','pomodoro','spotify','quote','text','notes','images','links'];

  popup.innerHTML = `
    <div class="add-title">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v8"/><path d="M8 12h8"/></svg>
      Add to Canvas
    </div>

    <div class="add-list">
      ${types.map(t => {
        const disabled = t !== 'images' && has(t);
        return `<button class="add-row${!disabled ? ' add-row-toggle' : ''}" data-btype="${t}" ${disabled ? 'disabled' : ''} type="button">
          <span class="add-row-icon">${bubbleTypeIcon(t)}</span>
          <span class="add-row-label">${labels[t] || t}</span>
          <span class="add-row-check">${disabled ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="width:12px;height:12px"><polyline points="20 6 9 17 4 12"/></svg>' : '<svg class="add-check-empty" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:12px;height:12px"><circle cx="12" cy="12" r="10"/></svg><svg class="add-check-fill" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="width:12px;height:12px;display:none"><polyline points="20 6 9 17 4 12"/></svg>'}</span>
        </button>`;
      }).join('')}
    </div>

    <div class="hub-edit-popup-actions" id="hubAddActions"><button class="cancel primary" id="hubAddConfirm">Add Selected</button></div>
  `;
  document.body.appendChild(popup);

  var selected = {};
  // Toggle selection on click
  popup.querySelectorAll('.add-row-toggle').forEach(function(el) {
    el.addEventListener('click', function(ev) {
      ev.stopPropagation();
      var t = this.dataset.btype;
      selected[t] = !selected[t];
      this.classList.toggle('add-row-selected', selected[t]);
      this.querySelector('.add-check-empty').style.display = selected[t] ? 'none' : '';
      this.querySelector('.add-check-fill').style.display = selected[t] ? '' : 'none';
    });
  });
  // Confirm: add all selected types
  document.getElementById('hubAddConfirm').addEventListener('click', function() {
    var typesToAdd = Object.keys(selected).filter(function(k) { return selected[k]; });
    if (typesToAdd.length === 0) { popup.remove(); overlay.remove(); return; }
    addBubbleTypes(typesToAdd);
    popup.remove();
    overlay.remove();
  });
  // Also close on overlay click (already handled above)
}

/* ─── HIDE popup ───────────────────────────── */
function showHubHidePopup() {
  const existing = document.querySelector('.hub-hide-popup');
  if (existing) { existing.remove(); document.querySelector('.hub-popup-overlay')?.remove(); return; }

  const overlay = document.createElement('div');
  overlay.className = 'hub-popup-overlay';
  overlay.addEventListener('click', () => { overlay.remove(); popup.remove(); });
  document.body.appendChild(overlay);

  const layout = JSON.parse(JSON.stringify(normalizeBentoLayout(hubContent.bentoLayout, hubContent)));
  const popup = document.createElement('div');
  popup.className = 'hub-edit-popup hub-hide-popup';

  const labels = { goals:'Goals', images:'Images', priorities:'Priorities', quote:'Quote', todos:'To-Dos', text:'Text', habits:'Habits', notes:'Notes', links:'Links', progress:'Progress', clock:'Clock', weather:'Weather', calendar:'Calendar', timer:'Timer', pomodoro:'Pomodoro', spotify:'Spotify' };

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
  const allGalleryTasks = typeof loadTasks === 'function' ? loadTasks() : [];
  const now = new Date();
  const ws = new Date(now);
  ws.setDate(ws.getDate() - ((ws.getDay() + 6) % 7));
  ws.setHours(0,0,0,0);
  const we = new Date(ws);
  we.setDate(we.getDate() + 7);
  const galleryWeekTasks = allGalleryTasks.filter(t => {
    const d = new Date(t.date + 'T12:00:00');
    return d >= ws && d < we;
  });
  nav.innerHTML = hubContent.gallery.map((c, i) => {
    let countHtml = '';
    if (c.href === 'schedule.html') {
      countHtml = `<span class="hub-gallery-count" id="hubWeekTasks">${galleryWeekTasks.length} this week</span>`;
    } else if (c.href === 'activities.html') {
      countHtml = `<span class="hub-gallery-count" id="hubTotalTasks">${allGalleryTasks.length} total</span>`;
    }
    return `<a href="${escapeHtml(c.href)}" class="hub-gallery-card" data-idx="${i}">
      <div class="hub-gallery-cover" style="background:${c.bg}">
        <div class="hub-gallery-cover-bg" style="background:linear-gradient(135deg, ${c.color}, transparent)"></div>
        ${icons[c.icon] || icons.calendar}
      </div>
      <div class="hub-gallery-body">
        <div class="hub-gallery-title">${escapeHtml(c.label)}</div>
        <p class="hub-gallery-desc">${escapeHtml(c.desc)}</p>
        <div class="hub-gallery-meta">
          ${countHtml}
          <span class="hub-gallery-link">Open <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg></span>
        </div>
      </div>
      ${isEdit ? `<div class="hub-edit-badge" data-edit-gallery="${i}" title="Edit card">\u270E</div>` : ''}
    </a>`;
  }).join('');
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
var _hubEditEventsWired = false;
function setupHubEditEvents() {
  if (_hubEditEventsWired) return;
  _hubEditEventsWired = true;
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
    if (!span) return;
    if (!hubEditMode) return;
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
    const q = e.target.closest('.w-quote-text');
    if (!q || !hubEditMode) return;
    hubContent.quote.text = q.textContent.trim().replace(/^["\u201C]|["\u201D]$/g, '');
    saveHubContent();
  }, true);

  document.querySelector('.bento-grid')?.addEventListener('blur', function(e) {
    const el = e.target.closest('[data-save]');
    if (!el || !hubEditMode) return;
    const field = el.dataset.save;
    if (field === 'notes') {
      hubContent.notes = el.textContent.trim();
      saveHubContent();
    } else if (field === 'text') {
      hubContent.text = el.textContent.trim();
      saveHubContent();
    }
  }, true);

  document.getElementById('hubGreeting')?.addEventListener('blur', function() {
    if (!hubEditMode) return;
    hubContent.greeting = this.textContent.trim();
    hubContent.greeting = hubContent.greeting === 'Good morning' || hubContent.greeting === 'Good afternoon' || hubContent.greeting === 'Good evening' ? '' : hubContent.greeting;
    saveHubContent();
  });

  var _todoDragIdx = null;
  document.querySelector('.bento-grid')?.addEventListener('dragstart', function(e) {
    var handle = e.target.closest('[data-todo-drag]');
    if (!handle) return;
    _todoDragIdx = parseInt(handle.dataset.todoDrag);
    e.dataTransfer.effectAllowed = 'move';
  });
  document.querySelector('.bento-grid')?.addEventListener('dragover', function(e) {
    var item = e.target.closest('.w-item[data-idx]');
    if (_todoDragIdx === null || !item) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    document.querySelectorAll('.w-item.drag-over').forEach(function(el) { el.classList.remove('drag-over'); });
    item.classList.add('drag-over');
  });
  document.querySelector('.bento-grid')?.addEventListener('drop', function(e) {
    var item = e.target.closest('.w-item[data-idx]');
    if (_todoDragIdx === null || !item) return;
    e.preventDefault();
    var toIdx = parseInt(item.dataset.idx);
    if (toIdx !== _todoDragIdx) {
      var arr = hubContent.todos;
      var moved = arr.splice(_todoDragIdx, 1)[0];
      arr.splice(toIdx, 0, moved);
      saveHubContent();
      renderHubBento();
    }
    _todoDragIdx = null;
    document.querySelectorAll('.w-item.drag-over').forEach(function(el) { el.classList.remove('drag-over'); });
  });
  document.querySelector('.bento-grid')?.addEventListener('dragend', function(e) {
    if (_todoDragIdx !== null) {
      _todoDragIdx = null;
      document.querySelectorAll('.w-item.drag-over').forEach(function(el) { el.classList.remove('drag-over'); });
    }
  });

  document.querySelector('.bento-grid')?.addEventListener('click', function(e) {
    if (e.target.closest('.bento-bubble[data-suppress-click]')) return;
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
    if (e.target.closest('.bento-bubble[data-suppress-click]')) return;
    const addBtn = e.target.closest('[data-add]');
    if (!addBtn) return;
    const field = addBtn.dataset.add;
    if (field === 'goals') { hubContent.goals.push('new goal'); saveHubContent(); renderHubBento(); setTimeout(() => { const els = document.querySelectorAll('.w-item-text[data-edit="goals"]'); const last = els[els.length - 1]; if (last) { last.focus(); } }, 50); }
    else if (field === 'priorities') { hubContent.priorities.push('new priority'); saveHubContent(); renderHubBento(); setTimeout(() => { const els = document.querySelectorAll('.w-item-text[data-edit="priorities"]'); const last = els[els.length - 1]; if (last) { last.focus(); } }, 50); }
    else if (field === 'todos') { hubContent.todos.push({ text: 'new item', done: false }); saveHubContent(); renderHubBento(); setTimeout(() => { const els = document.querySelectorAll('.w-item-text[data-edit="todos"]'); const last = els[els.length - 1]; if (last) { last.focus(); } }, 50); }
    else if (field === 'habits') { hubContent.habits.push('new habit'); saveHubContent(); renderHubBento(); setTimeout(() => { const els = document.querySelectorAll('.hub-editable[data-edit="habits"]'); const last = els[els.length - 1]; if (last) { last.focus(); } }, 50); }
    else if (field === 'links') { hubContent.links.push({ label: 'new link', url: 'https://' }); saveHubContent(); renderHubBento(); setTimeout(() => { const els = document.querySelectorAll('.hub-editable[data-edit="links-label"]'); const last = els[els.length - 1]; if (last) { last.focus(); } }, 50); }
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

  // Snap-presets submenu on right-click of bubble handle/button area in edit mode
  document.querySelector('.bento-grid')?.addEventListener('contextmenu', function(e) {
    var handle = e.target.closest('.bento-bubble-handle, .bento-bubble-remove, .bento-bubble-btn');
    if (!handle || !hubEditMode) return;
    e.preventDefault();
    var bubble = handle.closest('.bento-bubble');
    if (!bubble) return;
    var uid = bubble.dataset.bubble;

    // Remove any existing snap menu
    var old = document.querySelector('.snap-preset-menu');
    if (old) old.remove();

    var menu = document.createElement('div');
    menu.className = 'snap-preset-menu';
    var colors = ['#4fc3f7','#81c784','#ffb74d','#e57373','#ba68c8','#a1887f','#90a4ae','var(--text-primary)'];
    var itemColor = hubContent.bubbleColors && hubContent.bubbleColors[uid];
    menu.innerHTML =
      '<div class="snap-preset-head">Resize</div>' +
      '<div class="snap-preset-item" data-snap-preset="' + uid + '" data-snap-size="small">Small (160×100)</div>' +
      '<div class="snap-preset-item" data-snap-preset="' + uid + '" data-snap-size="medium">Medium (240×160)</div>' +
      '<div class="snap-preset-item" data-snap-preset="' + uid + '" data-snap-size="large">Large (340×240)</div>' +
      '<div class="snap-preset-head" style="margin-top:4px">Accent Color</div>' +
      '<div class="snap-preset-colors">' + colors.map(function(c) {
        var checked = c === itemColor ? ' data-checked="1"' : '';
        return '<div class="snap-color-swatch' + (c === itemColor ? ' snap-color-active' : '') + '" data-bubble-color="' + uid + '" data-color="' + (c === 'var(--text-primary)' ? '' : c) + '" style="background:' + c + '"' + checked + '></div>';
      }).join('') + '</div>';
    var menuW = 180, menuH = 250;
    menu.style.left = Math.min(e.pageX, window.innerWidth - menuW - 8) + 'px';
    menu.style.top = Math.min(e.pageY, window.innerHeight - menuH - 8) + 'px';
    document.body.appendChild(menu);
    setTimeout(function() { menu.addEventListener('wheel', function(we) { we.stopPropagation(); }); }, 0);
  });
  document.addEventListener('click', function(e) {
    var snapItem = e.target.closest('[data-snap-preset]');
    if (snapItem) {
      e.preventDefault();
      var uid = snapItem.dataset.snapPreset;
      var layout = normalizeBentoLayout(hubContent.bentoLayout, hubContent);
      var item = layout.find(function(i) { return i.uid === uid; });
      if (item) {
        var presets = {small:{w:snap(160),h:snap(100)}, medium:{w:snap(240),h:snap(160)}, large:{w:snap(340),h:snap(240)}};
        var p = presets[snapItem.dataset.snapSize] || presets.medium;
        item.w = p.w; item.h = p.h;
        hubContent.bentoLayout = layout;
        saveHubContent();
        renderHubBento();
      }
      var menu = document.querySelector('.snap-preset-menu');
      if (menu) menu.remove();
      return;
    }
    var colorSwatch = e.target.closest('[data-bubble-color]');
    if (colorSwatch) {
      var uid = colorSwatch.dataset.bubbleColor;
      var color = colorSwatch.dataset.color || '';
      hubContent.bubbleColors = hubContent.bubbleColors || {};
      hubContent.bubbleColors[uid] = color;
      saveHubContent();
      renderHubBento();
      var menu = document.querySelector('.snap-preset-menu');
      if (menu) menu.remove();
      return;
    }
    if (!e.target.closest('.snap-preset-menu')) {
      var menu = document.querySelector('.snap-preset-menu');
      if (menu) menu.remove();
    }
  }, true);

  document.querySelector('.bento-grid')?.addEventListener('click', function(e) {
    if (e.target.closest('.bento-bubble[data-suppress-click]')) return;
    const copyBtn = e.target.closest('[data-copy-bubble]');
    if (copyBtn) {
      var uid = copyBtn.dataset.copyBubble;
      var layout = normalizeBentoLayout(hubContent.bentoLayout, hubContent);
      var item = layout.find(i => i.uid === uid);
      if (item) {
        var text = '';
        switch (item.t) {
          case 'todos': case 'goals': case 'priorities': text = (hubContent[item.t] || []).map(function(x) { return typeof x === 'string' ? x : x.text; }).join('\n'); break;
          case 'quote': var q = hubContent.quote || {}; text = (q.text || '') + (q.author ? ' — ' + q.author : ''); break;
          case 'notes': text = hubContent.notes || ''; break;
          case 'habits': text = (hubContent.habits || []).join('\n'); break;
          default: text = '';
        }
        if (text) navigator.clipboard.writeText(text).catch(function() {});
      }
      return;
    }
    const todoBox = e.target.closest('.w-todo-box');
    if (todoBox) {
      const item = todoBox.closest('.w-item');
      if (!item) return;
      const idx = parseInt(item.dataset.idx);
      if (isNaN(idx) || !hubContent.todos[idx]) return;
      hubContent.todos[idx].done = !hubContent.todos[idx].done;
      saveHubContent();
      renderHubBento();
      return;
    }
    const calNav = e.target.closest('[data-cal-nav]');
    if (calNav) {
      e.preventDefault();
      const bubble = calNav.closest('.bento-bubble');
      if (!bubble) return;
      const uid = bubble.dataset.bubble;
      const layout = normalizeBentoLayout(hubContent.bentoLayout, hubContent);
      const item = layout.find(i => i.uid === uid);
      if (item) {
        item.calOffset = (item.calOffset || 0) + parseInt(calNav.dataset.calNav);
        hubContent.bentoLayout = layout;
        saveHubContent();
        renderHubBento();
      }
      return;
    }
    const calDay = e.target.closest('[data-cal-day]');
    if (calDay) {
      var oldTip = document.querySelector('.cal-tooltip');
      if (oldTip) oldTip.remove();
      var dateStr = calDay.dataset.calDay;
      var tasks = (typeof loadTasks === 'function' ? loadTasks() : []).filter(function(t) { return t.date === dateStr; });
      if (tasks.length === 0) return;
      var tip = document.createElement('div');
      tip.className = 'cal-tooltip';
      tip.innerHTML = '<div class="cal-tooltip-head">' + dateStr + ' — ' + tasks.length + ' task' + (tasks.length !== 1 ? 's' : '') + '</div><div class="cal-tooltip-body">' + tasks.slice(0, 5).map(function(t) { return '<div class="cal-tooltip-item' + (t.completed ? ' cal-done' : '') + '">' + escapeHtml(t.title) + '</div>'; }).join('') + (tasks.length > 5 ? '<div class="cal-tooltip-more">+' + (tasks.length - 5) + ' more</div>' : '') + '</div>';
      document.body.appendChild(tip);
      var r = calDay.getBoundingClientRect();
      tip.style.left = Math.min(r.left + r.width / 2 - tip.offsetWidth / 2, window.innerWidth - tip.offsetWidth - 8) + 'px';
      tip.style.top = (r.bottom + 6) + 'px';
      function closeTip(e2) { if (!e2.target.closest('.cal-tooltip')) { tip.remove(); document.removeEventListener('mousedown', closeTip); } }
      setTimeout(function() { document.addEventListener('mousedown', closeTip); }, 0);
      return;
    }
    const habitToggle = e.target.closest('[data-habit-toggle]');
    if (habitToggle) {
      const idx = parseInt(habitToggle.dataset.habitToggle);
      if (!isNaN(idx)) {
        const todayKey = new Date().toISOString().slice(0,10);
        if (!hubContent.habitData) hubContent.habitData = {};
        if (!hubContent.habitData[todayKey]) hubContent.habitData[todayKey] = {};
        hubContent.habitData[todayKey][idx] = !hubContent.habitData[todayKey][idx];
        saveHubContent();
        renderHubBento();
      }
      return;
    }
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

/* ─── Spotify sidebar sync ──────────────────── */
(function initSpotifySync() {
  var _origNav = window.spSideNav;
  if (typeof _origNav === 'function') {
    window.spSideNav = function(dir) {
      _origNav(dir);
      _updateSpotifyBubbles();
    };
  }
  // Also patch spAddPlaylist / spRemovePlaylist
  var _origAdd = window.spAddPlaylist;
  if (typeof _origAdd === 'function') {
    window.spAddPlaylist = function() {
      _origAdd();
      _updateSpotifyBubbles();
    };
  }
  var _origDel = window.spDeletePlaylist;
  if (typeof _origDel === 'function') {
    window.spDeletePlaylist = function(id) {
      _origDel(id);
      _updateSpotifyBubbles();
    };
  }
  function _updateSpotifyBubbles() {
    var _id = null, _playlists = [];
    try { _id = localStorage.getItem('haven-spotify-active') || null; } catch(e) {}
    try { _playlists = JSON.parse(localStorage.getItem('haven-spotify-playlists') || '[]'); } catch(e) {}
    var _active = _playlists.find(function(p) { return p.id === _id; });
    document.querySelectorAll('.spotify-widget').forEach(function(w) {
      var ifr = w.querySelector('iframe');
      if (ifr && _active) {
        ifr.src = 'https://open.spotify.com/embed/playlist/' + _active.id + '?utm_source=generator';
        ifr.style.height = 'calc(100% - 32px)';
      } else if (w.querySelector('.spotify-empty') && _active) {
        // Had empty state, now has playlist — re-render to get the iframe
        renderHubBento();
      } else if (ifr && !_active) {
        // Had playlist, now empty — re-render to show empty state
        renderHubBento();
      }
    });
  }
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
