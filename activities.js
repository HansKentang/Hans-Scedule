/* ============================================
   Haven Schedule — Activities Page
   Kanban Board only (editable)
   ============================================ */

// --- DOM REFS -------------------------------------------------------------
const boardInner = document.getElementById('tagsBoardInner');
const tagsSummaryTotal = document.getElementById('tagsSummaryTotal');
const boardView = document.getElementById('boardView');
const boardTaskCount = document.getElementById('boardTaskCount');

pageAfterTaskSave = () => { renderTags(); };
pageAfterImport = () => { renderTags(); };

// --- TAGS BOARD HELPERS ---------------------------------------------------
function getTagColumnMeta(tag) {
  const c = cardColors[tag] || DEFAULT_TAG_COLORS[tag];
  const isDark = document.documentElement.classList.contains('dark');
  if (isDark) {
    return { color: darkenColor(c.light, 0.82), textColor: c.dark || lightenColor(c.light, 0.45), darkColor: darkenColor(c.light, 0.82), darkText: c.dark || lightenColor(c.light, 0.45) };
  }
  return { color: lightenColor(c.light, 0.85), textColor: c.light, darkColor: darkenColor(c.light, 0.82), darkText: c.dark || lightenColor(c.light, 0.45) };
}

function formatHrs(mins) {
  const h = Math.floor(mins / 60); const m = mins % 60;
  if (h === 0) return `${m}m`; if (m === 0) return `${h}h`; return `${h}h ${m}m`;
}

// --- INLINE EDIT ----------------------------------------------------------
function boardInlineEdit(taskId, titleEl) {
  const currentTitle = titleEl.textContent;
  const input = document.createElement('input');
  input.type = 'text';
  input.value = currentTitle;
  input.style.cssText = 'width:100%;border:none;background:transparent;font-size:0.72rem;font-weight:500;color:var(--text-primary);font-family:var(--font-family);outline:none;border-bottom:1px solid var(--border-focus);padding:0;margin:0';
  titleEl.style.display = 'none';
  titleEl.parentNode.insertBefore(input, titleEl);
  input.focus();
  input.select();

  function finish(save) {
    if (save) {
      const val = input.value.trim();
      if (val && val !== currentTitle) {
        updateTask(taskId, { title: val });
        titleEl.textContent = val;
      }
    }
    input.remove();
    titleEl.style.display = '';
  }

  input.addEventListener('blur', () => finish(true));
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); finish(true); }
    if (e.key === 'Escape') { e.preventDefault(); finish(false); }
  });
}

// --- TAG SWITCHER ---------------------------------------------------------
function showTagSwitcher(taskId, anchorEl) {
  const existing = document.querySelector('.board-tag-popover');
  if (existing) existing.remove();

  const popover = document.createElement('div');
  popover.className = 'board-tag-popover';
  popover.style.cssText = 'position:absolute;z-index:100;background:var(--surface-container-high);border:1px solid var(--border-color);border-radius:var(--radius-md);padding:4px;box-shadow:var(--shadow-lg);display:flex;gap:2px';

  for (const tag of TAG_ORDER) {
    const c = TAG_COLORS[tag] || TAG_COLORS.meeting;
    const btn = document.createElement('button');
    btn.style.cssText = `width:20px;height:20px;border-radius:50%;border:2px solid ${c.text};background:${c.text};cursor:pointer;transition:transform var(--t-fast);padding:0`;
    btn.title = TAG_LABELS[tag];
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      updateTask(taskId, { tag });
      popover.remove();
      renderTags();
    });
    popover.appendChild(btn);
  }

  // Position relative to anchor
  const rect = anchorEl.getBoundingClientRect();
  popover.style.position = 'fixed';
  popover.style.left = `${rect.left}px`;
  popover.style.top = `${rect.bottom + 4}px`;
  document.body.appendChild(popover);

  // Close on outside click
  const close = (e) => {
    if (!popover.contains(e.target)) {
      popover.remove();
      document.removeEventListener('click', close);
    }
  };
  setTimeout(() => document.addEventListener('click', close), 0);
}

// --- RENDER TAGS BOARD ----------------------------------------------------
function renderTags() {
  if (!boardInner) return;

  const tagData = {};
  for (const tag of TAG_ORDER) {
    tagData[tag] = { count: 0, totalMinutes: 0, completed: 0, tasks: [] };
  }

  const scheduled = state.tasks.filter(t => !isWhiteboardTask(t));
  for (const t of scheduled) {
    if (tagData[t.tag]) {
      tagData[t.tag].count++;
      if (t.completed) tagData[t.tag].completed++;
      const start = parseTime(t.startTime);
      const end = parseTime(t.endTime) || start + 60;
      tagData[t.tag].totalMinutes += Math.max(end - start, 15);
      tagData[t.tag].tasks.push(t);
    }
  }

  const totalAll = Object.values(tagData).reduce((s, d) => s + d.totalMinutes, 0) || 1;

  let html = '';
  let grandTotal = 0;
  const todayStr = formatDate(new Date());

  for (const tag of TAG_ORDER) {
    const d = tagData[tag];
    const meta = getTagColumnMeta(tag);
    const pct = Math.round((d.totalMinutes / totalAll) * 100);
    const colColor = meta.color;
    const txtColor = meta.textColor;
    const accentColor = cardColors[tag]?.light || DEFAULT_TAG_COLORS[tag].light;
    grandTotal += d.count;

    html += `<div class="tag-column" data-board-tag="${tag}">
      <div class="tag-column-header">
        <span class="tag-column-dot" style="background:${colColor}"></span>
        <span class="tag-column-name" style="color:${txtColor}">${TAG_LABELS[tag]}</span>
        <span class="tag-column-count">${d.count}</span>
        <button class="btn btn-ghost tag-color-btn" data-tag="${tag}" title="Change card color" style="margin-left:auto;padding:2px;line-height:0">
          <span class="tag-color-swatch" style="background:${accentColor};display:inline-block;width:10px;height:10px;border-radius:50%;border:1.5px solid var(--border-color)"></span>
        </button>
      </div>
      <div class="tag-column-stats">
        <div class="tag-column-stat">
          <div class="val" style="color:${txtColor}">${formatHrs(d.totalMinutes)}</div>
          <div class="lbl">Time</div>
        </div>
        <div class="tag-column-stat">
          <div class="val">${d.completed}</div>
          <div class="lbl">Done / ${d.count}</div>
        </div>
      </div>
      <div class="tag-column-progress">
        <div class="fill" style="width:${pct}%;background:${txtColor}"></div>
      </div>
      <div class="tag-column-tasks" data-tag="${tag}">
        ${d.tasks.length === 0 ? '<div class="tag-column-empty">No tasks</div>' : ''}
        ${d.tasks.map(t => {
          const isComp = t.completed;
          const accent = txtColor;
          return `<div class="tag-col-task${isComp ? ' completed' : ''}" data-task-id="${t.id}" style="--tct-accent:${accent}">
            <div class="tct-title${isComp ? ' done' : ''}">
              <span class="tct-check${isComp ? ' checked' : ''}" data-toggle-complete="${t.id}"></span>
              <span class="tct-title-text" data-inline-edit="${t.id}">${escapeHtml(t.title)}</span>
            </div>
            <div class="tct-meta">
              <span class="tct-tag" style="color:${accent};cursor:pointer" data-switch-tag="${t.id}">${t.tag}</span>
              <span>${t.startTime}-${t.endTime}</span>
            </div>
          </div>`;
        }).join('')}
        <button class="board-add-task" data-tag="${tag}" title="Add task to ${TAG_LABELS[tag]}">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Add task
        </button>
      </div>
    </div>`;
  }

  boardInner.innerHTML = html;
  if (tagsSummaryTotal) tagsSummaryTotal.textContent = `${grandTotal} tasks across all categories`;
  if (boardTaskCount) boardTaskCount.textContent = `${grandTotal} tasks`;
  const heroCount = document.getElementById('actHeroCount');
  if (heroCount) heroCount.textContent = `${grandTotal} tasks`;

  // Fit text
  requestAnimationFrame(() => { fitTextAll('.tag-col-task', 13, 8); });

  // --- EVENT LISTENERS ----------------------------------------------------

  // Click card to open modal
  boardInner.querySelectorAll('.tag-col-task').forEach(el => {
    const taskId = el.dataset.taskId;
    el.addEventListener('click', (e) => {
      if (e.target.closest('[data-toggle-complete]')) return;
      if (e.target.closest('[data-inline-edit]')) return;
      if (e.target.closest('[data-switch-tag]')) return;
      if (e.target.closest('.board-add-task')) return;
      openTaskModal(taskId);
    });
  });

  // Toggle complete
  boardInner.querySelectorAll('[data-toggle-complete]').forEach(el => {
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      const tid = el.dataset.toggleComplete;
      const task = getTask(tid);
      const wasCompleted = task?.completed;
      toggleComplete(tid);
      if (!wasCompleted && task && typeof celebrateComplete === 'function') setTimeout(() => celebrateComplete(), 100);
      renderTags();
    });
  });

  // Inline edit title
  boardInner.querySelectorAll('[data-inline-edit]').forEach(el => {
    el.addEventListener('dblclick', (e) => {
      e.stopPropagation();
      const taskId = el.dataset.inlineEdit;
      boardInlineEdit(taskId, el);
    });
  });

  // Switch tag
  boardInner.querySelectorAll('[data-switch-tag]').forEach(el => {
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      const taskId = el.dataset.switchTag;
      showTagSwitcher(taskId, el);
    });
  });

  // Color picker buttons
  boardInner.querySelectorAll('.tag-color-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const tag = btn.dataset.tag;
      const curColor = cardColors[tag]?.light || DEFAULT_TAG_COLORS[tag].light;
      openCardColorPicker(btn, tag, curColor, () => { renderTags(); });
    });
  });

  // Add task button
  boardInner.querySelectorAll('.board-add-task').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const tag = btn.dataset.tag;
      const now = new Date();
      const currentMins = now.getHours() * 60 + now.getMinutes();
      const snap = roundToNearest(currentMins, 15);
      const h = Math.floor(snap / 60);
      const m = snap % 60;
      const startTime = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
      const endH = h + 1;
      const endTime = `${String(endH).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
      pushUndo();
      const task = createTask({
        title: 'New Task',
        date: formatDate(now),
        startTime,
        endTime,
        tag,
      });
      renderTags();
      // Auto-edit title after creation
      setTimeout(() => {
        const el = document.querySelector(`.tag-col-task[data-task-id="${task.id}"] [data-inline-edit]`);
        if (el) { el.dispatchEvent(new MouseEvent('dblclick', { bubbles: true })); }
      }, 100);
    });
  });
}

// --- SETUP -----------------------------------------------------------------
function setupPage() {
  dom.importFileInput = document.getElementById('importFileInput');
  dom.aiChatBtn = document.getElementById('aiChatBtnSidebar');
  dom.aiChatPanel = document.getElementById('aiChatPanel');
  dom.aiChatOverlay = document.getElementById('aiChatOverlay');
  dom.aiChatMessages = document.getElementById('aiChatMessages');
  dom.aiChatInput = document.getElementById('aiChatInput');
  dom.aiChatInputWrapper = document.getElementById('aiChatInputWrapper');
  dom.aiChatSend = document.getElementById('aiChatSend');
  dom.aiChatClose = document.getElementById('aiChatClose');

  // Help modal
  dom.helpBtn = document.getElementById('helpBtn');
  dom.helpOverlay = document.getElementById('helpOverlay');
  dom.helpModal = document.getElementById('helpModal');
  dom.helpModalClose = document.getElementById('helpModalClose');
  dom.helpBtn?.addEventListener('click', showHelpModal);
  dom.helpOverlay?.addEventListener('click', hideHelpModal);
  dom.helpModalClose?.addEventListener('click', hideHelpModal);
  populateShortcuts();

  document.getElementById('themeBtnSidebar')?.addEventListener('click', toggleTheme);
  document.getElementById('settingsBtnSidebar')?.addEventListener('click', openSettingsDrawer);
  dom.importFileInput?.addEventListener('change', importData);
  document.getElementById('importDataBtn')?.addEventListener('click', () => { if (dom.importFileInput) { dom.importFileInput.value = ''; dom.importFileInput.click(); } });

  dom.aiChatBtn?.addEventListener('click', showAIChat);
  dom.aiChatOverlay?.addEventListener('click', hideAIChat);
  dom.aiChatClose?.addEventListener('click', hideAIChat);
  dom.aiChatSend?.addEventListener('click', sendAIMessage);
  dom.aiChatInput?.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendAIMessage(); } });

  // Keyboard shortcut: N for new task
  document.addEventListener('keydown', (e) => {
    if (e.key === 'n' && !e.ctrlKey && !e.metaKey && !e.altKey) {
      const tag = e.target.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (state.taskModalOpen || state.settingsDrawerOpen || state.helpModalOpen || state.aiChatOpen) return;
      const now = new Date();
      const currentMins = now.getHours() * 60 + now.getMinutes();
      const snap = roundToNearest(currentMins, 15);
      openNewTaskModal(formatDate(now), snap);
    }
  });

  // Re-render on theme change
  const observer = new MutationObserver(() => { renderTags(); });
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
}

// --- INIT ------------------------------------------------------------------
function init() {
  loadState();
  applyTheme();
  document.querySelectorAll('img[data-image-id]').forEach(el => { el.src = getImage(el.dataset.imageId) || ''; });
  renderTags();
  setupPage();
  document.getElementById('exportBtn')?.addEventListener('click', exportData);
  document.getElementById('importBtn')?.addEventListener('click', () => { document.getElementById('importFileInput')?.click(); });
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
else init();
