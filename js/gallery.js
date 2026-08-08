/* ============================================
   Havën Schedule — Gallery / Vision Board
   Freeform vision-board canvas: images keep their
   natural aspect ratio and can be dragged around
   (edit mode only), like the hub bento canvas.
   ============================================ */

const GALLERY_LAYOUT_KEY = 'haven-gallery-layout';
const GALLERY_HERO_PREFIX = 'gallery-image-';

// ─── DEFAULTS ──────────────────────────────────────────────
const GALLERY_DEFAULT_IMAGES = [];

// ─── CANVAS CONSTANTS ─────────────────────────────────────
const GAL_PAD = 24;          // canvas padding
const GAL_GAP = 24;          // gap between items
const GAL_DEFAULT_W = 300;   // width used before the image loads
const GAL_DEFAULT_H = 225;   // 4:3 fallback height
const GAL_DEFAULT_AR = 4 / 3;
const GAL_MAX_W = 340;       // wider images scale down to this
const GAL_MIN_W = 120;       // tiny images keep at least this width
const GAL_MAX_H = 720;       // cap for very tall images
const GAL_CANVAS_HEIGHT = 10000;

// Self-contained canvas helpers (gallery.html does not load hub-visuals.js)
function galSnap(v) { return Math.round(v / 20) * 20; }

function galRectsOverlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

// Push overlapping items apart (same algorithm as the hub bento canvas).
// When a `fixedUid` is given, that item is never moved — overlapping cards
// get pushed around it instead (keeps the card you just dropped in place).
function resolveGalleryCollisions(layout, cw, ch, fixedUid) {
  if (cw === undefined) cw = canvasWidth() || 1080;
  if (ch === undefined) ch = GAL_CANVAS_HEIGHT;
  function isFixed(it) { return it.uid === fixedUid; }
  function clamp(item) {
    if (isFixed(item)) return; // the fixed (dragged) card stays where it is
    item.x = Math.max(0, Math.min(item.x, cw - item.w));
    item.y = Math.max(0, Math.min(item.y, ch - item.h));
  }
  // Push the non-fixed item out from under the fixed one
  function pushAway(blocker, mover) {
    const pushX = galSnap(blocker.x + blocker.w + GAL_GAP);
    if (pushX > mover.x && pushX - mover.x < (blocker.y + blocker.h + GAL_GAP - mover.y || 999)) {
      mover.x = pushX;
    } else {
      const pushY = galSnap(blocker.y + blocker.h + GAL_GAP);
      if (pushY > mover.y) mover.y = pushY;
    }
    clamp(mover);
  }
  let dirty = true, maxIter = 40;
  while (dirty && maxIter-- > 0) {
    dirty = false;
    layout.sort((a, b) => a.y - b.y || a.x - b.x);
    for (let i = 0; i < layout.length; i++) {
      for (let j = i + 1; j < layout.length; j++) {
        if (!galRectsOverlap(layout[i], layout[j])) continue;
        if (isFixed(layout[i])) {
          // fixed card overlaps j → push j away
          pushAway(layout[i], layout[j]);
        } else if (isFixed(layout[j])) {
          // i overlaps the fixed card → move i out of the way
          pushAway(layout[j], layout[i]);
        } else {
          pushAway(layout[i], layout[j]);
        }
        dirty = true;
      }
    }
  }
  layout.forEach(clamp);
  return layout;
}

let _galUidCounter = 0;
function galUid() {
  return 'g' + (++_galUidCounter) + '_' + Date.now().toString(36);
}

// ─── CLEANUP OLD PICSUM DEFAULTS ──────────────────────────
function cleanupOldPicsumDefaults() {
  // Remove any old picsum.photos URLs stored for gallery images
  for (var key in state.images) {
    if (key.indexOf('gallery-image-') === 0 && state.images[key] && state.images[key].indexOf('https://picsum.photos/') === 0) {
      delete state.images[key];
      try { localStorage.removeItem('haven-image-' + key); } catch (e) {}
    }
  }
  // Also clean up any standalone localStorage keys
  try {
    for (var i = localStorage.length - 1; i >= 0; i--) {
      var k = localStorage.key(i);
      if (k && k.indexOf('haven-image-gallery-image-') === 0) {
        var val = localStorage.getItem(k);
        if (val && val.indexOf('https://picsum.photos/') === 0) {
          localStorage.removeItem(k);
        }
      }
    }
  } catch (e) {}
}

// ─── LAYOUT CRUD ─────────────────────────────────────────
// Layout items: { id, uid, x, y, w, h, ar }  (px, snapped to 20px)
function makeGalItem(id) {
  // x/y undefined until flowPlaceGallery() (or addGalleryImage) positions them
  return { id, uid: galUid(), x: undefined, y: undefined, w: GAL_DEFAULT_W, h: GAL_DEFAULT_H, ar: GAL_DEFAULT_AR };
}

function loadGalleryLayout() {
  try {
    const raw = localStorage.getItem(GALLERY_LAYOUT_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return migrateGalleryLayout(parsed);
    }
  } catch (e) { /* ignore */ }
  return null;
}

function migrateGalleryLayout(parsed) {
  if (parsed.length === 0) return parsed;
  // Old format: flat array of image-ID strings → convert to canvas items
  if (typeof parsed[0] === 'string') {
    const items = parsed.map(id => makeGalItem(id));
    flowPlaceGallery(items);
    saveGalleryLayout(items);
    return items;
  }
  const items = parsed.map(it => ({ ...it, uid: it.uid || galUid() }));
  // Ensure every item has a position (e.g. partial/corrupt saves)
  if (items.some(it => it.x === undefined || it.y === undefined)) {
    flowPlaceGallery(items);
    saveGalleryLayout(items);
  }
  return items;
}

function saveGalleryLayout(layout) {
  try { safeSetItem(GALLERY_LAYOUT_KEY, JSON.stringify(layout)); } catch (e) { /* ignore */ }
}

function getGalleryLayout() {
  const saved = loadGalleryLayout();
  if (saved) return saved;
  // First visit: create empty layout with 6 placeholder slots
  if (!state.images) loadImages();
  const defaults = [];
  for (let i = 0; i < 6; i++) defaults.push(makeGalItem(GALLERY_HERO_PREFIX + (i + 1)));
  flowPlaceGallery(defaults, canvasWidth());
  saveGalleryLayout(defaults);
  return defaults;
}

function canvasWidth() {
  const el = document.getElementById('galGrid');
  return el ? (el.clientWidth || 1080) : 1080;
}

// Grid-flow placement for items without x/y (migration, first visit)
function flowPlaceGallery(layout, cw) {
  const wMax = Math.max(260, (cw || canvasWidth() || 1080) - GAL_PAD);
  let startY = GAL_PAD;
  layout.forEach(it => {
    if (it.x !== undefined && it.y !== undefined) startY = Math.max(startY, it.y + (it.h || GAL_DEFAULT_H));
  });
  let x = GAL_PAD, y = startY, rowH = 0, placed = false;
  layout.forEach(it => {
    if (it.x !== undefined && it.y !== undefined) return;
    const w = it.w || GAL_DEFAULT_W;
    const h = it.h || GAL_DEFAULT_H;
    if (x + w > wMax) { x = GAL_PAD; y += rowH + GAL_GAP; rowH = 0; }
    it.x = galSnap(x); it.y = galSnap(y);
    rowH = Math.max(rowH, h);
    x += w + GAL_GAP;
    placed = true;
  });
  return placed;
}

function addGalleryImage() {
  const layout = getGalleryLayout();
  // Find next available number
  let maxNum = 0;
  for (const it of layout) {
    const m = parseInt(it.id.replace(GALLERY_HERO_PREFIX, ''), 10);
    if (!isNaN(m) && m > maxNum) maxNum = m;
  }
  const newId = GALLERY_HERO_PREFIX + (maxNum + 1);
  const item = makeGalItem(newId);
  // Leave new slot empty (user adds their own image via the picker)
  let maxY = GAL_PAD;
  for (const it of layout) maxY = Math.max(maxY, (it.y || 0) + (it.h || GAL_DEFAULT_H));
  item.x = galSnap(GAL_PAD);
  item.y = galSnap(maxY + GAL_GAP);
  layout.push(item);
  saveGalleryLayout(layout);
  return newId;
}

function removeGalleryImage(id) {
  let layout = getGalleryLayout();
  layout = layout.filter(i => i.id !== id);
  saveGalleryLayout(layout);
  // Reset to default (remove custom)
  resetImage(id);
}

// ─── RENDER ────────────────────────────────────────────────
function renderGallery() {
  const canvas = document.getElementById('galGrid');
  if (!canvas) return;

  const layout = getGalleryLayout();
  const isEdit = state.editMode;

  // Update counts
  const countEl = document.getElementById('galCount');
  const imageCountEl = document.getElementById('galImageCount');
  const metaEl = document.getElementById('galPageMeta');
  const heroSubEl = document.getElementById('galHeroSub');
  const resetBtn = document.getElementById('galResetBtn');

  if (countEl) countEl.textContent = layout.length + ' image' + (layout.length !== 1 ? 's' : '');
  if (imageCountEl) imageCountEl.textContent = layout.length + ' image' + (layout.length !== 1 ? 's' : '');
  if (metaEl) metaEl.textContent = layout.length > 0 ? 'Vision Board' : 'Start your collection';
  if (heroSubEl) heroSubEl.textContent = layout.length > 0 ? 'Your designs & posters' : 'Add your first image';

  // Show reset button if any images are custom
  if (resetBtn) {
    let hasCustom = false;
    for (const it of layout) {
      const url = getImage(it.id);
      if (url && isCustomImage(it.id, url)) { hasCustom = true; break; }
    }
    resetBtn.style.display = hasCustom ? 'inline-flex' : 'none';
  }

  if (layout.length === 0) {
    canvas.innerHTML = `
      <div class="gal-empty">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
        </svg>
        <p>Your vision board is empty</p>
        <div class="sub">Add your first image to get started</div>
        <button class="btn btn-outline" onclick="handleAddImage()">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Add Image
        </button>
      </div>
    `;
    canvas.style.minHeight = '';
    return;
  }

  let html = '';
  for (const it of layout) {
    const id = it.id;
    const url = getImage(id);
    const hasImg = !!url;
    const style = 'left:' + (it.x || GAL_PAD) + 'px;top:' + (it.y || GAL_PAD) + 'px;width:' + (it.w || GAL_DEFAULT_W) + 'px;height:' + (it.h || GAL_DEFAULT_H) + 'px;';
    const handle = isEdit ? galDragHandle() : '';
    const dupBtn = isEdit && hasImg ? galDupButton(id) : '';

    if (!hasImg) {
      html += `
        <div class="gal-item gal-item-placeholder" data-gallery-id="${id}" style="${style}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
          </svg>
          <span>Click to add photo</span>
          ${handle}
        </div>`;
    } else {
      html += `
        <div class="gal-item" data-gallery-id="${id}" style="${style}">
          <img data-image-id="${id}" src="${escapeHtml(url || '')}" alt="" loading="lazy">
          <div class="gal-item-remove" data-action="remove" data-gallery-id="${id}" title="Remove image">×</div>
          ${dupBtn}
          ${handle}
        </div>`;
    }
  }

  canvas.innerHTML = html;
  updateCanvasSize();

  // Keep each image's box at its natural aspect ratio (capped width)
  canvas.querySelectorAll('.gal-item img[data-image-id]').forEach(img => {
    img.addEventListener('load', onGalImageLoad);
    if (img.complete && img.naturalWidth) onGalImageLoad.call(img);
  });

  // ─── CLICK HANDLERS ───────────────────────────
  // Click on image opens picker
  canvas.querySelectorAll('.gal-item img').forEach(el => {
    el.addEventListener('click', function(e) {
      e.stopPropagation();
      const card = this.closest('.gal-item');
      if (card && card.hasAttribute('data-suppress-click')) return;
      if (e.target.closest('.gal-item-remove')) return;
      const id = card && card.dataset.galleryId;
      if (id) openImagePicker(id);
    });
  });

  // Click on placeholder opens picker
  canvas.querySelectorAll('.gal-item-placeholder').forEach(el => {
    el.addEventListener('click', function(e) {
      if (this.hasAttribute('data-suppress-click')) return;
      const id = this.dataset.galleryId;
      if (id) openImagePicker(id);
    });
  });

  // Remove buttons
  canvas.querySelectorAll('[data-action="remove"]').forEach(el => {
    el.addEventListener('click', function(e) {
      e.stopPropagation();
      const id = this.dataset.galleryId;
      removeGalleryImage(id);
      renderGallery();
      showToast('Image removed from gallery', 'info', 1500);
    });
  });

  // Duplicate buttons (hub-style plus, edit mode only)
  canvas.querySelectorAll('[data-gal-dup]').forEach(btn => {
    btn.addEventListener('click', function(e) {
      e.stopPropagation();
      const srcId = this.dataset.galDup;
      if (srcId) duplicateGalleryImage(srcId);
    });
  });

  // Edit-mode hint mentions dragging
  if (isEdit) {
    const ind = document.getElementById('editModeIndicator');
    const sp = ind && ind.querySelector('span');
    if (sp) sp.textContent = 'Edit Mode — drag to move · tap to change';
  }

  // ─── CANVAS DRAG (idempotent) ──────────────────
  setupGalleryCanvasDrag();
}

function galDragHandle() {
  return `<div class="gal-item-drag" title="Drag to move">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="width:14px;height:14px"><circle cx="8" cy="6" r="1.5"/><circle cx="16" cy="6" r="1.5"/><circle cx="8" cy="12" r="1.5"/><circle cx="16" cy="12" r="1.5"/><circle cx="8" cy="18" r="1.5"/><circle cx="16" cy="18" r="1.5"/></svg>
  </div>`;
}

function galDupButton(id) {
  return `<button class="bento-bubble-btn gal-item-dup" data-gal-dup="${id}" title="Duplicate image">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
  </button>`;
}

// Duplicate an image card (like the hub bubble duplicate): new slot offset
// +24/+24 with the same photo, then collisions are resolved.
function duplicateGalleryImage(id) {
  const layout = getGalleryLayout();
  const src = layout.find(i => i.id === id);
  if (!src) return;
  let maxNum = 0;
  for (const it of layout) {
    const m = parseInt(it.id.replace(GALLERY_HERO_PREFIX, ''), 10);
    if (!isNaN(m) && m > maxNum) maxNum = m;
  }
  const newId = GALLERY_HERO_PREFIX + (maxNum + 1);
  const url = getImage(id);
  if (url) setImage(newId, url);
  const copy = { ...src, id: newId, uid: galUid(), x: (src.x || GAL_PAD) + GAL_GAP, y: (src.y || GAL_PAD) + GAL_GAP };
  layout.push(copy);
  resolveGalleryCollisions(layout, canvasWidth(), GAL_CANVAS_HEIGHT);
  saveGalleryLayout(layout);
  renderGallery();
  showToast('Image duplicated', 'info', 1500);
}

function updateCanvasSize(layout) {
  const canvas = document.getElementById('galGrid');
  if (!canvas) return;
  const items = layout || getGalleryLayout();
  let maxY = 0;
  for (const it of items) maxY = Math.max(maxY, (it.y || 0) + (it.h || GAL_DEFAULT_H));
  canvas.style.minHeight = Math.max(420, maxY + GAL_PAD) + 'px';
}

// Recompute an image's box from its natural dimensions once loaded
function onGalImageLoad() {
  const img = this;
  const card = img.closest('.gal-item');
  if (!card) return;
  const id = card.dataset.galleryId;
  const layout = getGalleryLayout();
  const item = layout.find(i => i.id === id);
  if (!item) return;
  const nw = img.naturalWidth, nh = img.naturalHeight;
  if (!nw || !nh) return;
  const ar = nw / nh;
  if (Math.abs((item.ar || GAL_DEFAULT_AR) - ar) < 0.001) {
    // Same image — keep height in sync with the stored width
    const wantH = Math.max(80, Math.round(item.w / ar));
    if (Math.abs(item.h - wantH) > 1) {
      item.h = wantH;
      saveGalleryLayout(layout);
      card.style.height = wantH + 'px';
      updateCanvasSize();
    }
    return;
  }
  // New image (or first load): size to natural aspect ratio, capped
  let w = Math.round(Math.max(GAL_MIN_W, Math.min(nw, GAL_MAX_W)));
  let h = Math.round(w / ar);
  if (h > GAL_MAX_H) { h = GAL_MAX_H; w = Math.round(h * ar); }
  w = Math.max(80, w);
  item.w = w; item.h = h; item.ar = ar;
  saveGalleryLayout(layout);
  card.style.width = w + 'px';
  card.style.height = h + 'px';
  updateCanvasSize();
  scheduleGalleryReflow();
}

// ─── CANVAS DRAG (edit mode only) ─────────────────────────
let _galDrag = null;
let _galReflowTimer = null;

function scheduleGalleryReflow() {
  clearTimeout(_galReflowTimer);
  _galReflowTimer = setTimeout(reflowGallery, 250);
}

function reflowGallery() {
  const canvas = document.getElementById('galGrid');
  if (!canvas) return;
  if (_galDrag) return; // never reflow mid-drag
  const layout = getGalleryLayout();
  if (!layout.length) return;
  resolveGalleryCollisions(layout, canvas.clientWidth, GAL_CANVAS_HEIGHT);
  saveGalleryLayout(layout);
  layout.forEach(it => {
    const el = canvas.querySelector('[data-gallery-id="' + it.id + '"]');
    if (el) { el.style.left = it.x + 'px'; el.style.top = it.y + 'px'; }
  });
  updateCanvasSize(layout);
}

// Apply a layout's positions to the DOM (only for cards that exist)
function applyGalleryPositions(layout) {
  const canvas = document.getElementById('galGrid');
  if (!canvas) return;
  layout.forEach(it => {
    const el = canvas.querySelector('[data-gallery-id="' + it.id + '"]');
    if (el) { el.style.left = it.x + 'px'; el.style.top = it.y + 'px'; }
  });
}

function cancelGalDrag() {
  if (!_galDrag) return;
  const d = _galDrag;
  _galDrag = null;
  if (d.active) {
    // Restore EVERY card to its pre-drag position (not just the dragged one)
    if (d.snapshot) applyGalleryPositions(d.snapshot);
    d.card.classList.remove('dragging');
    d.card.style.zIndex = '';
    canvasEl().classList.remove('gal-live-drag');
    if (d._ghost && d._ghost.parentNode) d._ghost.parentNode.removeChild(d._ghost);
    updateCanvasSize();
  }
}

function canvasEl() {
  return document.getElementById('galGrid');
}

function setupGalleryCanvasDrag() {
  const canvas = canvasEl();
  if (!canvas) return;
  if (canvas._galDragWired) return;
  canvas._galDragWired = true;

  canvas.addEventListener('pointerdown', function(e) {
    if (!state.editMode) return;
    if (e.target.closest('[data-action="remove"], [data-gal-dup]')) return;
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    if (e.pointerType === 'touch' && !e.isPrimary) return;
    const card = e.target.closest('.gal-item');
    if (!card) return;
    const id = card.dataset.galleryId;
    const layout = getGalleryLayout();
    const item = layout.find(i => i.id === id);
    if (!item) return;
    // Keep receiving pointer events even when the cursor leaves the canvas
    try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
    const cr = card.getBoundingClientRect();
    const gr = canvas.getBoundingClientRect();
    _galDrag = {
      card,
      itemId: id,
      itemUid: item.uid,
      offsetX: e.clientX - cr.left,
      offsetY: e.clientY - cr.top,
      startX: e.clientX,
      startY: e.clientY,
      pointerId: e.pointerId,
      active: false,
      dragLayout: null,
      snapshot: null,
      elements: null,
      lastX: null,
      lastY: null,
      _ghost: null
    };
  });

  function moveDrag(e) {
    if (!_galDrag || e.pointerId !== _galDrag.pointerId) return;
    if (!state.editMode) { cancelGalDrag(); return; }
    const d = _galDrag;
    // Lazily activate drag on first meaningful movement (5px threshold)
    if (!d.active) {
      const dx = e.clientX - d.startX, dy = e.clientY - d.startY;
      if (dx * dx + dy * dy < 25) return;
      d.active = true;
      // Only capture the pointer once the drag actually starts, so plain
      // clicks are never retargeted away from the image/picker handlers.
      try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
      // Working copy of the layout + full snapshot for cancel/restore
      d.dragLayout = getGalleryLayout().map(i => ({ ...i }));
      d.snapshot = d.dragLayout.map(i => ({ ...i }));
      d.dragItem = d.dragLayout.find(i => i.id === d.itemId);
      // Cache element refs once (no querySelector per item per frame)
      d.elements = {};
      d.dragLayout.forEach(it => {
        d.elements[it.id] = canvas.querySelector('[data-gallery-id="' + it.id + '"]');
      });
      d.card.classList.add('dragging');
      d.card.style.zIndex = '9999';
      canvas.classList.add('gal-live-drag');
      // Origin ghost marker
      const ghost = document.createElement('div');
      ghost.className = 'gal-drag-origin';
      ghost.style.left = d.card.offsetLeft + 'px';
      ghost.style.top = d.card.offsetTop + 'px';
      ghost.style.width = d.card.offsetWidth + 'px';
      ghost.style.height = d.card.offsetHeight + 'px';
      d._ghost = ghost;
      canvas.appendChild(ghost);
    }
    const gr = canvas.getBoundingClientRect();
    const newX = Math.max(0, galSnap(e.clientX - d.offsetX - gr.left));
    const newY = Math.max(0, galSnap(e.clientY - d.offsetY - gr.top));
    // Skip all work when the snapped position hasn't changed (20px grid)
    if (newX === d.lastX && newY === d.lastY) return;
    d.lastX = newX;
    d.lastY = newY;
    const di = d.dragItem;
    if (di) { di.x = newX; di.y = newY; }
    // LIVE collision: other cards slide out of the way as you drag
    resolveGalleryCollisions(d.dragLayout, gr.width, GAL_CANVAS_HEIGHT, d.itemUid);
    d.dragLayout.forEach(it => {
      const el = d.elements[it.id];
      if (el) { el.style.left = it.x + 'px'; el.style.top = it.y + 'px'; }
    });
    // Grow the canvas live so the drop zone is always reachable
    updateCanvasSize(d.dragLayout);
  }

  function endDrag(e) {
    if (!_galDrag || e.pointerId !== _galDrag.pointerId) return;
    const d = _galDrag;
    _galDrag = null;
    // If drag was never activated, it was a click — let it pass through
    if (!d.active) return;
    if (d._ghost && d._ghost.parentNode) d._ghost.parentNode.removeChild(d._ghost);
    d.card.classList.remove('dragging');
    d.card.style.zIndex = '';
    canvas.classList.remove('gal-live-drag');
    const gr = canvas.getBoundingClientRect();
    let x = Math.max(0, Math.min(galSnap(parseInt(d.card.style.left, 10) || 0), gr.width - d.card.offsetWidth));
    // Freeform canvas: clamp to the tall canvas, not the current content height,
    // so dragging below existing cards never snaps the drop upward.
    let y = Math.max(0, Math.min(galSnap(parseInt(d.card.style.top, 10) || 0), GAL_CANVAS_HEIGHT - d.card.offsetHeight));
    const layout = getGalleryLayout();
    const item = layout.find(i => i.id === d.itemId);
    if (item) {
      item.x = x;
      item.y = y;
      // Resolve collisions but keep the dropped card exactly where it landed
      resolveGalleryCollisions(layout, gr.width, GAL_CANVAS_HEIGHT, item.uid);
      saveGalleryLayout(layout);
      applyGalleryPositions(layout);
      // Drop bounce
      d.card.classList.add('drop-bounce');
      setTimeout(function() { d.card.classList.remove('drop-bounce'); }, 500);
      updateCanvasSize(layout);
      showToast('Position saved', 'info', 800);
    }
    d.card.setAttribute('data-suppress-click', '1');
    setTimeout(function() { d.card.removeAttribute('data-suppress-click'); }, 120);
  }

  document.addEventListener('pointermove', moveDrag);
  document.addEventListener('pointerup', endDrag);
  // Interrupted pointer (e.g. touch scroll grab) → cancel, don't commit
  document.addEventListener('pointercancel', function(e) {
    if (_galDrag && e.pointerId === _galDrag.pointerId) cancelGalDrag();
  });

  // Escape cancels drag
  document.addEventListener('keydown', function galEsc(e) {
    if (e.key === 'Escape' && _galDrag) cancelGalDrag();
  });
  // Window blur cancels drag (pointerup lost outside the browser)
  window.addEventListener('blur', cancelGalDrag);
}

// ─── HANDLERS ────────────────────────────────────────────
function handleAddImage() {
  const newId = addGalleryImage();
  renderGallery();
  // Open the picker for the newly added image
  setTimeout(() => openImagePicker(newId), 100);
}

function handleResetAll() {
  const layout = getGalleryLayout();
  let count = 0;
  for (const it of layout) {
    const url = getImage(it.id);
    if (url && isCustomImage(it.id, url)) {
      resetImage(it.id);
      count++;
    }
  }
  renderGallery();
  if (count > 0) showToast('Reset ' + count + ' custom images to default', 'info', 2000);
  else showToast('No custom images to reset', 'info', 1500);
}

// ─── INIT ─────────────────────────────────────────────────
function init() {
  loadState();
  applyTheme();

  // Clean up old picsum.photos defaults for existing users
  cleanupOldPicsumDefaults();

  // Load hero images
  document.querySelectorAll('img[data-image-id]').forEach(el => {
    el.src = getImage(el.dataset.imageId) || '';
  });

  // ─── Sidebar buttons ──────────────────────
  document.getElementById('themeBtnSidebar')?.addEventListener('click', toggleTheme);
  // settingsBtnSidebar removed

  // ─── AI Chat setup ────────────────────────
  dom.aiChatBtn = document.getElementById('aiChatBtnSidebar');
  dom.aiChatPanel = document.getElementById('aiChatPanel');
  dom.aiChatOverlay = document.getElementById('aiChatOverlay');
  dom.aiChatMessages = document.getElementById('aiChatMessages');
  dom.aiChatInput = document.getElementById('aiChatInput');
  dom.aiChatInputWrapper = document.getElementById('aiChatInputWrapper');
  dom.aiChatSend = document.getElementById('aiChatSend');
  dom.aiChatClose = document.getElementById('aiChatClose');

  dom.aiChatOverlay?.addEventListener('click', hideAIChat);
  dom.aiChatClose?.addEventListener('click', hideAIChat);
  dom.aiChatSend?.addEventListener('click', sendAIMessage);
  dom.aiChatInput?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendAIMessage(); }
  });
  dom.aiChatBtn?.addEventListener('click', openSettingsBubble);

  // ─── Gallery actions ──────────────────────
  document.getElementById('galAddBtn')?.addEventListener('click', handleAddImage);
  document.getElementById('galResetBtn')?.addEventListener('click', handleResetAll);

  // ─── Access hub (white floating FAB, like hub & schedule) ──
  // The plus bubble has a single action: Edit mode
  document.getElementById('accessMain')?.addEventListener('click', toggleAccessHub);
  document.getElementById('galFabEdit')?.addEventListener('click', () => { toggleAccessHub(); toggleEditMode(); });

  // Close the access hub on outside click or Escape
  document.addEventListener('click', (e) => {
    const hub = document.getElementById('accessHub');
    if (hub && !hub.contains(e.target)) {
      document.getElementById('accessItems')?.classList.remove('open');
      document.getElementById('accessMain')?.classList.remove('open');
    }
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      document.getElementById('accessItems')?.classList.remove('open');
      document.getElementById('accessMain')?.classList.remove('open');
    }
  });

  // ─── Edit mode image picking ───────────────
  // In edit mode, clicking any image opens the picker
  document.addEventListener('click', function(e) {
    if (!state.editMode) return;
    const imgEl = e.target.closest('img[data-image-id]');
    if (imgEl && !e.target.closest('.gal-item-remove')) {
      openImagePicker(imgEl.dataset.imageId);
    }
  });

  // ─── Page transition ──────────────────────
  const content = document.querySelector('.hub-content');
  if (content) {
    requestAnimationFrame(() => {
      content.classList.add('transitioning-in');
      requestAnimationFrame(() => { content.classList.add('active'); });
    });
  }

  // ─── Re-render on edit mode toggle ─────────
  document.addEventListener('editModeChange', () => renderGallery());

  // ─── Re-render after the image picker saves ──
  window._onImageSaved = function(id, url) {
    renderGallery();
  };

  // ─── Render gallery ────────────────────────
  renderGallery();

  // ─── Export/import ─────────────────────────
  document.getElementById('exportBtn')?.addEventListener('click', exportData);
  document.getElementById('importBtn')?.addEventListener('click', () => document.getElementById('drawerImportFile')?.click());
  document.getElementById('focusToggleBtn')?.addEventListener('click', toggleFocusMode);

  pageAfterImport = () => { renderGallery(); };
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
