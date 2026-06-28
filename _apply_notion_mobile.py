import re

# ─── 1. Add bottom nav bar JS to shared.js ───
with open('shared.js', 'r', encoding='utf-8') as f:
    js = f.read()

# Find a good insertion point - after the PAGE TRANSITIONS section
insert_marker = "// ─── PAGE CALLBACK FALLBACK ───────────────────────────────"
notion_js = """
// ─── MOBILE BOTTOM NAV BAR (Notion-style) ─────────────────
function initMobileBottomNav() {
  if (window.innerWidth > 768) return;
  var existing = document.getElementById('hubMobileBottomNav');
  if (existing) return;

  var sidebar = document.querySelector('.hub-sidebar-nav');
  if (!sidebar) return;

  var nav = document.createElement('nav');
  nav.id = 'hubMobileBottomNav';
  nav.className = 'hub-mobile-bottom-nav';

  var items = sidebar.querySelectorAll('.hub-snav-item');
  var currentPage = location.pathname.split('/').pop() || 'index.html';

  items.forEach(function(item) {
    var href = item.getAttribute('href');
    if (!href) return;
    var clone = item.cloneNode(true);
    clone.classList.remove('active');
    if (href === currentPage) clone.classList.add('active');
    // Remove drag handles, hide buttons, etc.
    clone.querySelectorAll('.snav-drag-handle, .snav-hide-btn').forEach(function(el) { el.remove(); });
    // Add bottom bar specific class
    clone.classList.add('hub-mbb-item');
    nav.appendChild(clone);
  });

  // Handle resize - remove/add on breakpoint
  var handler = function() {
    var nb = document.getElementById('hubMobileBottomNav');
    if (window.innerWidth <= 768) {
      if (!nb) initMobileBottomNav();
    } else {
      if (nb) nb.remove();
    }
  };
  window.addEventListener('resize', debounce(handler, 300));

  document.body.appendChild(nav);
}

function debounce(fn, delay) {
  var timer = null;
  return function() {
    var args = arguments;
    var ctx = this;
    clearTimeout(timer);
    timer = setTimeout(function() { fn.apply(ctx, args); }, delay);
  };
}

// Init on load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initMobileBottomNav);
} else {
  initMobileBottomNav();
}
"""

if insert_marker in js:
    js = js.replace(insert_marker, notion_js + '\n' + insert_marker)
    with open('shared.js', 'w', encoding='utf-8') as f:
        f.write(js)
    print('✓ Added bottom nav JS to shared.js')
else:
    print('✗ Could not find insertion point in shared.js')

# ─── 2. Add Notion-style mobile CSS to end of style.css ───
with open('style.css', 'r', encoding='utf-8') as f:
    css = f.read()

# Remove existing MOBILE RESPONSIVE sections (they're from previous work, we're replacing them)
# Actually, let's keep them and add our Notion styles at the very end

notion_css = """

/* ════════════════════════════════════════════════════════════
   NOTION MOBILE — Responsive redesign (mobile only)
   ════════════════════════════════════════════════════════════ */

/* ─── BOTTOM NAV BAR (Notion-style) ─────────────────── */
.hub-mobile-bottom-nav {
  display: none;
}

@media (max-width: 768px) {
  /* Hide sidebar on mobile - only shown via overlay */
  .hub-sidebar {
    position: fixed !important;
    left: 0 !important;
    top: 0 !important;
    width: 270px !important;
    min-width: 270px !important;
    height: 100dvh !important;
    transform: translateX(-100%);
    transition: transform 280ms cubic-bezier(0.16, 1, 0.3, 1);
    z-index: 20 !important;
    box-shadow: none !important;
    border-right: 1px solid var(--border-color);
  }
  .hub-sidebar.open {
    transform: translateX(0);
    box-shadow: 8px 0 40px rgba(0,0,0,0.25);
  }

  /* Force sidebar content visible when open */
  .hub-sidebar.open .hub-workspace-name,
  .hub-sidebar.open .hub-snav-item .snav-label,
  .hub-sidebar.open .hub-sidebar-section-label,
  .hub-sidebar.open .hub-sidebar-footer .btn span { display: block; }
  .hub-sidebar.open .hub-snav-item { justify-content: flex-start; padding: var(--space-1) var(--space-2); }
  .hub-sidebar.open .hub-sidebar-footer .btn { padding: var(--space-2); }
  .hub-sidebar.open .hub-snav-stagger > * { animation: slideUpSpring 0.4s cubic-bezier(0.16, 1, 0.3, 1) both; }
  .hub-sidebar.open .hub-snav-stagger > *:nth-child(1) { animation-delay: 0.03s; }
  .hub-sidebar.open .hub-snav-stagger > *:nth-child(2) { animation-delay: 0.06s; }

  /* ─── Bottom Nav Bar ────────────────────────────── */
  .hub-mobile-bottom-nav {
    display: flex !important;
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    z-index: 100;
    background: var(--bg-sidebar);
    border-top: 1px solid var(--border-color);
    padding: 4px env(safe-area-inset-right, 8px) env(safe-area-inset-bottom, 8px) env(safe-area-inset-left, 8px);
    justify-content: space-around;
    align-items: center;
    box-shadow: 0 -2px 12px rgba(0,0,0,0.06);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
  }

  .hub-mbb-item {
    display: flex !important;
    flex-direction: column !important;
    align-items: center !important;
    justify-content: center !important;
    gap: 2px !important;
    padding: 4px 8px !important;
    min-width: 48px;
    min-height: 44px;
    border-radius: 8px;
    color: var(--text-tertiary) !important;
    background: transparent !important;
    text-decoration: none;
    font-size: 0.55rem !important;
    font-weight: 500 !important;
    transition: all 150ms ease;
    cursor: pointer;
    position: relative;
  }
  .hub-mbb-item .snav-icon {
    width: 20px !important;
    height: 20px !important;
    opacity: 0.65 !important;
    display: flex !important;
    align-items: center;
    justify-content: center;
  }
  .hub-mbb-item .snav-icon svg {
    width: 18px;
    height: 18px;
  }
  .hub-mbb-item .snav-label {
    font-size: 0.5rem !important;
    display: block !important;
    opacity: 0.7;
    text-align: center;
    line-height: 1.1;
    white-space: nowrap;
  }
  .hub-mbb-item:active {
    transform: scale(0.92);
  }
  .hub-mbb-item.active {
    color: var(--accent) !important;
  }
  .hub-mbb-item.active .snav-icon {
    opacity: 1 !important;
    color: var(--accent) !important;
  }
  .hub-mbb-item.active .snav-label {
    opacity: 1;
    font-weight: 600;
  }
  .hub-mbb-item.active::after {
    content: '';
    position: absolute;
    top: -1px;
    left: 50%;
    transform: translateX(-50%);
    width: 20px;
    height: 2px;
    border-radius: 2px;
    background: var(--accent);
  }

  /* ─── Main area: padding for bottom bar + safe area ── */
  .hub-layout {
    padding-bottom: 60px;
  }
  .hub-main {
    height: 100dvh;
  }
  .hub-content {
    padding-bottom: 8px;
  }

  /* ─── Minimal hero ───────────────────────────────── */
  .hub-main > section:first-child {
    height: 100px !important;
    min-height: 100px !important;
  }
  .hub-main > section:first-child img[data-image-id] {
    display: none !important;
  }
  .hub-main > section:first-child [style*="position:absolute;inset:0;background:linear-gradient"] {
    background: transparent !important;
  }
  .hub-main > section:first-child h1 {
    font-size: 1.3rem !important;
    letter-spacing: -0.02em !important;
  }
  .hub-main > section:first-child .glass-card {
    display: none !important;
  }
  .hub-main > section:first-child [style*="gap:var(--space-4)"] {
    display: flex !important;
    flex-wrap: wrap !important;
    gap: 4px !important;
    margin-top: 2px !important;
  }
  .hub-main > section:first-child [style*="gap:var(--space-4)"] > * {
    font-size: 0.65rem !important;
    padding: 2px 8px !important;
  }

  /* ─── Schedule page header ────────────────────── */
  #calendarHeader {
    padding: var(--space-2) var(--space-3) !important;
    flex-wrap: wrap;
    gap: var(--space-1);
  }
  .header-left { gap: var(--space-2); }
  .header-right { gap: var(--space-2); }
  #weekLabel { font-size: 0.85rem !important; }

  /* ─── Analytics page ──────────────────────────── */
  .an-kpi-row { grid-template-columns: repeat(2, 1fr) !important; gap: var(--space-2) !important; }
  .an-completion-row { flex-direction: column !important; gap: var(--space-3) !important; }
  .an-chart-grid { grid-template-columns: 1fr !important; gap: var(--space-3) !important; }
  .an-table-card { overflow-x: auto !important; }
  .an-period-pills { gap: var(--space-1) !important; flex-wrap: wrap; }
  .an-period-pill { font-size: 0.65rem !important; padding: var(--space-1) var(--space-2) !important; }

  /* ─── Finance page ────────────────────────────── */
  .fin-hero { height: 120px !important; }
  .fin-kpi-row { grid-template-columns: 1fr 1fr !important; gap: var(--space-2) !important; }
  .fin-savings-row { flex-direction: column !important; gap: var(--space-3) !important; }
  .fin-table-wrap { overflow-x: auto !important; }
  .fin-toolbar { flex-direction: column !important; gap: var(--space-2) !important; }
  .fin-toolbar .fin-tabs { width: 100%; overflow-x: auto; }
  .fin-toolbar .fin-tabs button { flex: 1; font-size: 0.65rem; padding: var(--space-1) var(--space-2); }
  .fin-add-form { width: 100% !important; }

  /* ─── Activities page ─────────────────────────── */
  .act-view-toggle { gap: var(--space-1) !important; }
  .act-view-toggle button { flex: 1; font-size: 0.72rem !important; padding: var(--space-1) var(--space-2) !important; }
  .act-board { flex-direction: column !important; gap: var(--space-3) !important; }
  .act-timeline .act-tl-day { padding: var(--space-2) var(--space-2) !important; }
  .act-timeline .act-tl-task { flex-wrap: wrap; gap: var(--space-1); }
  .act-log-header { flex-direction: column !important; align-items: flex-start !important; gap: var(--space-1) !important; }
  .act-chart-wrap { min-height: 120px !important; }

  /* ─── Goals page ──────────────────────────────── */
  .gl-bento { grid-template-columns: 1fr !important; gap: var(--space-3) !important; }
  .gl-vision-grid { grid-template-columns: 1fr !important; gap: var(--space-2) !important; }

  /* ─── Gallery page ────────────────────────────── */
  .gal-grid { grid-template-columns: repeat(2, 1fr) !important; gap: var(--space-2) !important; }

  /* ─── Settings drawer ─────────────────────────── */
  .settings-content { padding: var(--space-4) !important; }
  .settings-section { padding: var(--space-3) !important; }

  /* ─── Section headers (Notion-like clean) ──────── */
  .hub-section-header { padding: var(--space-2) var(--space-2) !important; }
  .hub-section-label { font-size: 0.7rem !important; }
  .hub-section-wrap { margin-bottom: var(--space-3) !important; }

  /* ─── Calendar/mobile adjustments ─────────────── */
  :root { --hour-height: 44px; --time-axis-width: 40px; --container-padding: 12px; }
  .day-header { min-height: 34px !important; padding: var(--space-1) var(--space-1) !important; }
  .day-header.today .day-number { width: 22px; height: 22px; font-size: 0.78rem; }
  .calendar-task { padding: var(--space-1) var(--space-2) !important; }
  .calendar-task .task-title { font-size: 0.65rem !important; }
  .calendar-task .task-time { display: none !important; }
  .calendar-task .task-tag-badge { display: none !important; }
  .time-slot { font-size: 0.6rem !important; padding: 1px var(--space-1) 0 0 !important; }

  /* ─── General cleanup ─────────────────────────── */
  .hub-ambient { display: none !important; }
  .hub-ambient-dots { display: none !important; }
  .hub-ambient-gradient { display: none !important; }

  /* ─── Page padding consistency ────────────────── */
  .hub-content { padding-left: var(--container-padding); padding-right: var(--container-padding); }
}

@media (max-width: 480px) {
  .hub-mbb-item {
    padding: 3px 4px !important;
    min-width: 40px;
  }
  .hub-mbb-item .snav-icon { width: 18px !important; height: 18px !important; }
  .hub-mbb-item .snav-icon svg { width: 16px; height: 16px; }
  .hub-mbb-item .snav-label { font-size: 0.45rem !important; }
  .hub-mobile-bottom-nav { padding: 3px 4px env(safe-area-inset-bottom, 6px) 4px; gap: 2px; }
  .hub-main > section:first-child { height: 80px !important; min-height: 80px !important; }
  .hub-main > section:first-child h1 { font-size: 1.1rem !important; }
  #weekLabel { font-size: 0.78rem !important; }
  :root { --hour-height: 38px; --time-axis-width: 36px; --container-padding: 8px; }
  .an-kpi-row { grid-template-columns: 1fr 1fr !important; gap: var(--space-1) !important; }
  .fin-kpi-row { grid-template-columns: 1fr 1fr !important; gap: var(--space-1) !important; }
  .gal-grid { grid-template-columns: repeat(2, 1fr) !important; gap: var(--space-1) !important; }
  .hub-content { padding-left: 8px; padding-right: 8px; }
  .hub-layout { padding-bottom: 52px; }
}

/* ─── Hamburger visibility on mobile ───────────── */
@media (max-width: 768px) {
  .hub-hamburger { display: flex !important; }
}
@media (min-width: 769px) {
  .hub-hamburger { display: none; }
}
"""

# Append to end of style.css
with open('style.css', 'a', encoding='utf-8') as f:
    f.write(notion_css)

print('✓ Added Notion mobile CSS to style.css')
print('Done!')
