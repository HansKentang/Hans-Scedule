/* ============================================
   Havën Schedule — Gallery / Vision Board
   Customizable image grid with add/remove/reorder
   ============================================ */

const GALLERY_LAYOUT_KEY = 'haven-gallery-layout';
const GALLERY_HERO_PREFIX = 'gallery-image-';

// ─── DEFAULTS ──────────────────────────────────────────────
const GALLERY_DEFAULT_IMAGES = [
  'https://picsum.photos/seed/gallery-vision-1/600/400',
  'https://picsum.photos/seed/gallery-vision-2/600/400',
  'https://picsum.photos/seed/gallery-vision-3/600/400',
  'https://picsum.photos/seed/gallery-vision-4/600/400',
  'https://picsum.photos/seed/gallery-vision-5/600/400',
  'https://picsum.photos/seed/gallery-vision-6/600/400',
];

// ─── LAYOUT CRUD ─────────────────────────────────────────
function loadGalleryLayout() {
  try {
    const raw = localStorage.getItem(GALLERY_LAYOUT_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) { /* ignore */ }
  return null;
}

function saveGalleryLayout(layout) {
  try {
    localStorage.setItem(GALLERY_LAYOUT_KEY, JSON.stringify(layout));
  } catch (e) { /* ignore */ }
}

function getGalleryImages() {
  // Returns array of image IDs in order
  const saved = loadGalleryLayout();
  if (saved) return saved;
  // First visit: create default layout with 6 images
  const defaults = [];
  for (let i = 0; i < GALLERY_DEFAULT_IMAGES.length; i++) {
    const id = GALLERY_HERO_PREFIX + (i + 1);
    // Ensure default image is set in state.images
    if (!state.images) loadImages();
    if (state.images && !state.images[id]) {
      state.images[id] = GALLERY_DEFAULT_IMAGES[i];
    }
    defaults.push(id);
  }
  saveGalleryLayout(defaults);
  return defaults;
}

function addGalleryImage() {
  const layout = getGalleryImages();
  // Find next available number
  let maxNum = 0;
  for (const id of layout) {
    const m = parseInt(id.replace(GALLERY_HERO_PREFIX, ''), 10);
    if (!isNaN(m) && m > maxNum) maxNum = m;
  }
  const newId = GALLERY_HERO_PREFIX + (maxNum + 1);
  // Set a default image
  if (state.images) {
    state.images[newId] = 'https://picsum.photos/seed/gallery-' + newId + '/600/400';
    try { localStorage.setItem('haven-image-' + newId, state.images[newId]); } catch (e) { /* ignore */ }
  }
  layout.push(newId);
  saveGalleryLayout(layout);
  return newId;
}

function removeGalleryImage(id) {
  let layout = getGalleryImages();
  layout = layout.filter(i => i !== id);
  saveGalleryLayout(layout);
  // Reset to default (remove custom)
  resetImage(id);
}

function reorderGalleryImages(fromIdx, toIdx) {
  const layout = getGalleryImages();
  const [moved] = layout.splice(fromIdx, 1);
  layout.splice(toIdx, 0, moved);
  saveGalleryLayout(layout);
  return layout;
}

// ─── RENDER ────────────────────────────────────────────────
function renderGallery() {
  const grid = document.getElementById('galGrid');
  if (!grid) return;

  const layout = getGalleryImages();
  const isEdit = state.editMode;
  const imageIds = layout;

  // Update counts
  const countEl = document.getElementById('galCount');
  const imageCountEl = document.getElementById('galImageCount');
  const metaEl = document.getElementById('galPageMeta');
  const heroSubEl = document.getElementById('galHeroSub');
  const resetBtn = document.getElementById('galResetBtn');

  if (countEl) countEl.textContent = imageIds.length + ' image' + (imageIds.length !== 1 ? 's' : '');
  if (imageCountEl) imageCountEl.textContent = imageIds.length + ' image' + (imageIds.length !== 1 ? 's' : '');
  if (metaEl) metaEl.textContent = imageIds.length > 0 ? 'Vision Board' : 'Start your collection';
  if (heroSubEl) heroSubEl.textContent = imageIds.length > 0 ? 'Your designs & posters' : 'Add your first image';

  // Show reset button if any images are custom
  if (resetBtn) {
    let hasCustom = false;
    for (const id of imageIds) {
      const url = getImage(id);
      if (url && isCustomImage(id, url)) { hasCustom = true; break; }
    }
    resetBtn.style.display = hasCustom ? 'inline-flex' : 'none';
  }

  if (imageIds.length === 0) {
    grid.innerHTML = `
      <div class="gal-empty" style="grid-column:1/-1">
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
    return;
  }

  let html = '';
  for (let i = 0; i < imageIds.length; i++) {
    const id = imageIds[i];
    const url = getImage(id);
    const hasImg = !!url;

    if (!hasImg && isEdit) {
      // Show placeholder in edit mode
      html += `
        <div class="gal-item gal-item-placeholder" data-gallery-id="${id}" data-idx="${i}" draggable="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
          </svg>
          <span>Click to add photo</span>
        </div>`;
    } else {
      html += `
        <div class="gal-item" data-gallery-id="${id}" data-idx="${i}" draggable="true">
          <img data-image-id="${id}" src="${escapeHtml(url || '')}" alt="" loading="lazy" style="display:${hasImg ? 'block' : 'none'}">
          <div class="gal-item-remove" data-action="remove" data-gallery-id="${id}" title="Remove image">×</div>
        </div>`;
    }
  }

  grid.innerHTML = html;

  // ─── CLICK HANDLERS ───────────────────────────
  // Click on image opens picker
  grid.querySelectorAll('.gal-item img').forEach(el => {
    el.addEventListener('click', function(e) {
      if (e.target.closest('.gal-item-remove')) return;
      const id = this.closest('.gal-item')?.dataset.galleryId;
      if (id) openImagePicker(id);
    });
  });

  // Click on placeholder opens picker
  grid.querySelectorAll('.gal-item-placeholder').forEach(el => {
    el.addEventListener('click', function(e) {
      const id = this.dataset.galleryId;
      if (id) openImagePicker(id);
    });
  });

  // Remove buttons
  grid.querySelectorAll('[data-action="remove"]').forEach(el => {
    el.addEventListener('click', function(e) {
      e.stopPropagation();
      const id = this.dataset.galleryId;
      removeGalleryImage(id);
      renderGallery();
      showToast('Image removed from gallery', 'info', 1500);
    });
  });

  // ─── DRAG & DROP REORDER ────────────────────
  if (isEdit) {
    setupGalleryDrag(grid);
  }
}

// ─── DRAG & DROP ─────────────────────────────────────────
let _galDragSrc = null;

function setupGalleryDrag(grid) {
  var _galTouchDrag = null;
  
  // Touch-based drag reorder (mobile fallback)
  var items = grid.querySelectorAll('.gal-item[draggable="true"]');
  
  items.forEach(function(item) {
    item.addEventListener('touchstart', function(e) {
      if (e.touches.length !== 1) return;
      _galTouchDrag = {
        element: this,
        startIdx: parseInt(this.dataset.idx),
        startX: e.touches[0].clientX,
        startY: e.touches[0].clientY,
        lastMoveY: e.touches[0].clientY
      };
      this.classList.add('dragging');
      this.style.opacity = '0.4';
    }, { passive: true });
    
    item.addEventListener('touchmove', function(e) {
      if (!_galTouchDrag || _galTouchDrag.element !== this) return;
      if (e.touches.length !== 1) return;
      e.preventDefault();
      var touch = e.touches[0];
      _galTouchDrag.lastMoveY = touch.clientY;
      
      // Find which item we're over
      var targetItem = null;
      grid.querySelectorAll('.gal-item').forEach(function(el) {
        if (el === _galTouchDrag.element) return;
        var r = el.getBoundingClientRect();
        if (touch.clientY >= r.top && touch.clientY <= r.bottom &&
            touch.clientX >= r.left && touch.clientX <= r.right) {
          targetItem = el;
        }
      });
      
      grid.querySelectorAll('.drag-over').forEach(function(el) { el.classList.remove('drag-over'); });
      if (targetItem) targetItem.classList.add('drag-over');
    }, { passive: false });
    
    item.addEventListener('touchend', function(e) {
      if (!_galTouchDrag || _galTouchDrag.element !== this) return;
      this.classList.remove('dragging');
      this.style.opacity = '';
      grid.querySelectorAll('.drag-over').forEach(function(el) { el.classList.remove('drag-over'); });
      
      var fromIdx = _galTouchDrag.startIdx;
      var toIdx = -1;
      
      // Find the target by position
      var touch = e.changedTouches[0];
      grid.querySelectorAll('.gal-item').forEach(function(el) {
        if (el === _galTouchDrag.element) return;
        var r = el.getBoundingClientRect();
        if (touch.clientY >= r.top && touch.clientY <= r.bottom &&
            touch.clientX >= r.left && touch.clientX <= r.right) {
          toIdx = parseInt(el.dataset.idx);
        }
      });
      
      _galTouchDrag = null;
      
      if (isNaN(fromIdx) || toIdx < 0) return;
      
      reorderGalleryImages(fromIdx, toIdx);
      renderGallery();
      showToast('Gallery reordered', 'info', 1000);
    }, { passive: true });
  });
  
  // HTML5 drag-and-drop (desktop)
  items.forEach(function(item) {
    item.addEventListener('dragstart', function(e) {
      _galDragSrc = this;
      this.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
    });

    item.addEventListener('dragend', function(e) {
      this.classList.remove('dragging');
      grid.querySelectorAll('.drag-over').forEach(function(el) { el.classList.remove('drag-over'); });
      _galDragSrc = null;
    });

    item.addEventListener('dragover', function(e) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
    });

    item.addEventListener('dragenter', function(e) {
      e.preventDefault();
      if (this !== _galDragSrc) this.classList.add('drag-over');
    });

    item.addEventListener('dragleave', function(e) {
      this.classList.remove('drag-over');
    });

    item.addEventListener('drop', function(e) {
      e.preventDefault();
      this.classList.remove('drag-over');
      if (!_galDragSrc || this === _galDragSrc) return;

      const fromIdx = parseInt(_galDragSrc.dataset.idx);
      const toIdx = parseInt(this.dataset.idx);
      if (isNaN(fromIdx) || isNaN(toIdx)) return;

      reorderGalleryImages(fromIdx, toIdx);
      renderGallery();
      showToast('Gallery reordered', 'info', 1000);
    });
  });
}

// ─── HANDLERS ────────────────────────────────────────────
function handleAddImage() {
  const newId = addGalleryImage();
  renderGallery();
  // Open the picker for the newly added image
  setTimeout(() => openImagePicker(newId), 100);
}

function handleResetAll() {
  const layout = getGalleryImages();
  let count = 0;
  for (const id of layout) {
    const url = getImage(id);
    if (url && isCustomImage(id, url)) {
      resetImage(id);
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
