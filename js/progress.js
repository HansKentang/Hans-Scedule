/* ============================================
   Haven Schedule — Progress Page
   Board + Timeline + Log + Analytics
   ============================================ */

// --- VIEW STATE -------------------------------------------------------------
let activitiesView = 'board'; // 'board' | 'timeline'
let weekOffset = 0; // 0 = current week, -1 = last week, +1 = next week
let actSearchInput = null;
function getActivitiesWeekStart() {
  const today = new Date();
  return addDays(getMonday(today), weekOffset * 7);
}

// --- DOM REFS -------------------------------------------------------------
const boardInner = document.getElementById('tagsBoardInner');
const tagsSummaryTotal = document.getElementById('tagsSummaryTotal');
const boardView = document.getElementById('boardView');
const boardTaskCount = document.getElementById('boardTaskCount');
const timelineView = document.getElementById('timelineView');
const actTimeline = document.getElementById('actTimeline');
const actLogList = document.getElementById('actLogList');
const actLogCount = document.getElementById('actLogCount');

pageAfterTaskSave = () => { renderActivities(); renderAnalytics(); };
pageAfterImport = () => { renderActivities(); renderAnalytics(); };

// --- ACTIVITY LOG STATE ----------------------------------------------------
// Store completed_at timestamps per task in localStorage
const COMPLETION_LOG_KEY = 'haven-activities-completions';
let completionLog = [];

function loadCompletionLog() {
  try {
    const data = localStorage.getItem(COMPLETION_LOG_KEY);
    completionLog = data ? JSON.parse(data) : [];
  } catch (e) {
    completionLog = [];
  }
}

function saveCompletionLog() {
  try {
    safeSetItem(COMPLETION_LOG_KEY, JSON.stringify(completionLog));
  } catch (e) { /* ignore */ }
}

function addCompletionEntry(taskId, taskTitle, tag, completedAt) {
  // Remove any existing entry for this task (in case of re-toggle)
  completionLog = completionLog.filter(e => e.taskId !== taskId);
  completionLog.unshift({
    taskId,
    title: taskTitle,
    tag: tag || 'meeting',
    completedAt: completedAt || new Date().toISOString(),
  });
  // Keep max 100 entries
  if (completionLog.length > 100) completionLog = completionLog.slice(0, 100);
  saveCompletionLog();
}

function removeCompletionEntry(taskId) {
  completionLog = completionLog.filter(e => e.taskId !== taskId);
  saveCompletionLog();
}

function getCompletionLog() {
  loadCompletionLog();
  return completionLog;
}

// --- FORMAT HELPERS --------------------------------------------------------
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
      renderActivities();
    });
    popover.appendChild(btn);
  }

  const rect = anchorEl.getBoundingClientRect();
  popover.style.position = 'fixed';
  popover.style.left = `${rect.left}px`;
  popover.style.top = `${rect.bottom + 4}px`;
  document.body.appendChild(popover);

  const close = (e) => {
    if (!popover.contains(e.target)) {
      popover.remove();
      document.removeEventListener('click', close);
    }
  };
  setTimeout(() => document.addEventListener('click', close), 0);
}

// --- RENDER ALL ACTIVITIES ------------------------------------------------
function renderActivities() {
  renderTags();
  renderTimeline();
  renderActivityLog();
  renderActivityChart();
  updateView();
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

  let html = '';
  let grandTotal = 0;
  const todayStr = formatDate(new Date());

  for (const tag of TAG_ORDER) {
    const d = tagData[tag];
    const pct = d.count > 0 ? Math.round((d.completed / d.count) * 100) : 0;
    grandTotal += d.count;

    const isBuiltin = BUILTIN_TAGS.includes(tag);
    html += `<div class="tag-column" data-board-tag="${tag}">
      <div class="tag-column-header">
        <span class="tag-column-dot"></span>
        <span class="tag-column-name">${TAG_LABELS[tag]}</span>
        <span class="tag-column-count">${d.count}</span>

        ${!isBuiltin ? `<button class="tag-col-del" data-del-cat="${tag}" data-label="Delete"><svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>` : ''}
        <button class="btn btn-ghost tag-color-btn" data-tag="${tag}" title="Change card color" style="margin-left:auto;padding:2px;line-height:0">
          <span class="tag-color-swatch" style="display:inline-block;width:10px;height:10px;border-radius:50%;border:1.5px solid var(--border-color)"></span>
        </button>
      </div>
      <div class="tag-column-stats">
        <div class="tag-column-stat">
          <div class="val">${formatHrs(d.totalMinutes)}</div>
          <div class="lbl">Time</div>
        </div>
        <div class="tag-column-stat">
          <div class="val">${d.completed}</div>
          <div class="lbl">Done / ${d.count}</div>
        </div>
      </div>
      <div class="tag-column-progress" title="${pct}% complete">
        <div class="fill" style="width:${pct}%"></div>
      </div>
      <div class="tag-column-tasks" data-tag="${tag}">
        ${d.tasks.length === 0 ? '<div class="tag-column-empty">No tasks</div>' : ''}
        ${d.tasks.map(t => {
          const isComp = t.completed;
          return `<div class="tag-col-task${isComp ? ' completed' : ''}" data-task-id="${t.id}" data-tag="${t.tag}" draggable="true">
            <button class="tct-delete" data-delete-task="${t.id}" title="Delete task">
              <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
            <div class="tct-title${isComp ? ' done' : ''}">
              <span class="tct-check${isComp ? ' checked' : ''}" data-toggle-complete="${t.id}"></span>
              <span class="tct-title-text" data-inline-edit="${t.id}">${escapeHtml(t.title)}</span>
            </div>
            <div class="tct-meta">
              <span class="tct-tag" data-switch-tag="${t.id}">${t.tag}</span>
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

  // Add category column
  html += `<div class="tag-column-add" id="addCategoryCol" title="Add new category">
    <div class="tag-column-add-inner">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
      <span>Category</span>
    </div>
  </div>`;

  boardInner.innerHTML = html;
  if (tagsSummaryTotal) tagsSummaryTotal.textContent = `${grandTotal} tasks across all categories`;
  if (boardTaskCount) boardTaskCount.textContent = `${grandTotal} tasks`;
  const heroCount = document.getElementById('actHeroCount');
  if (heroCount) heroCount.textContent = `${grandTotal} tasks`;

  // Kernel line — data-driven status strip
  const kernel = document.getElementById('kernelFocusLine');
  if (kernel) {
    let kbits = [];
    const topTag = TAG_ORDER.map(t => ({ t, c: tagData[t]?.count || 0 })).sort((a, b) => b.c - a.c)[0];
    if (topTag && topTag.c > 0) kbits.push(`most active in ${TAG_LABELS[topTag.t]}`);
    const doneAll = tagData[TAG_ORDER[0]]?.count > 0 && tagData[TAG_ORDER[0]].completed === tagData[TAG_ORDER[0]].count;
    if (doneAll) kbits.push('deep work column fully cleared');
    const over = state.tasks.filter(t => !isWhiteboardTask(t) && t.completed).length;
    kbits.push(`${over} total completions`);

    const tNow = new Date();
    const hh = tNow.getHours() * 60 + tNow.getMinutes();
    const todayTasks = state.tasks.filter(t => !isWhiteboardTask(t) && t.date === formatDate(tNow));
    const nowTask = todayTasks
      .find(t => parseTime(t.startTime) <= hh && hh <= (parseTime(t.endTime) || parseTime(t.startTime) + 60));
    let slotsTxt = 'hear what you planned';
    if (nowTask) slotsTxt = `right now: ${nowTask.title}`;
    else if (todayTasks.length === 0) slotsTxt = 'no events today — the plan is open';

    const line = [`${kbits.join(' · ') || 'a quiet session'}`, slotsTxt].join(' — ');
    kernel.textContent = line;
  }

  // Fit text
  requestAnimationFrame(() => { fitTextAll('.tag-col-task', 13, 8); });

  // --- EVENT LISTENERS ----------------------------------------------------

  // Delete task
  boardInner.querySelectorAll('[data-delete-task]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const tid = btn.dataset.deleteTask;
      const task = getTask(tid);
      if (task && confirm(`Delete "${task.title}"?`)) {
        // Remove log entry first, then deleteTask (which triggers render via callback)
        removeCompletionEntry(tid);
        const savedCallback = pageAfterTaskSave;
        pageAfterTaskSave = null;
        deleteTask(tid);
        pageAfterTaskSave = savedCallback;
        renderActivities();
        showToast('Task deleted', 'info', 2000);
      }
    });
  });

  // Click card to open modal
  boardInner.querySelectorAll('.tag-col-task').forEach(el => {
    const taskId = el.dataset.taskId;
    el.addEventListener('click', (e) => {
      if (e.target.closest('[data-toggle-complete]')) return;
      if (e.target.closest('[data-inline-edit]')) return;
      if (e.target.closest('[data-switch-tag]')) return;
      if (e.target.closest('[data-delete-task]')) return;
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
      
      // Suspend page callback to avoid double render
      const savedCallback = pageAfterTaskSave;
      pageAfterTaskSave = null;
      toggleComplete(tid);
      pageAfterTaskSave = savedCallback;
      
      // Update completion log
      if (!wasCompleted && task) {
        addCompletionEntry(tid, task.title, task.tag);
        if (typeof celebrateComplete === 'function') setTimeout(() => celebrateComplete(), 100);
      } else if (wasCompleted && task) {
        removeCompletionEntry(tid);
      }
      renderActivities();
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
      openCardColorPicker(btn, tag, curColor, () => { renderActivities(); });
    });
  });

  // Delete category button
  boardInner.querySelectorAll('[data-del-cat]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const tag = btn.dataset.delCat;
      if (!tag || BUILTIN_TAGS.includes(tag)) return;
      const label = TAG_LABELS[tag] || tag;
      if (confirm(`Delete category "${label}"? All tasks with this category will also be removed.`)) {
        removeCustomCategory(tag);
        renderActivities();
        showToast(`"${label}" deleted`, 'info', 2000);
      }
    });
  });



  // Double-click category name to rename inline
  boardInner.querySelectorAll('.tag-column-name').forEach(el => {
    const col = el.closest('.tag-column');
    const tag = col?.dataset.boardTag;
    if (!tag) return;
    el.title = 'Double-click to rename';
    el.addEventListener('dblclick', (e) => {
      e.stopPropagation();
      const oldName = el.textContent;
      const input = document.createElement('input');
      input.type = 'text';
      input.className = 'tag-column-name-input';
      input.value = oldName;
      input.maxLength = 24;
      input.autocomplete = 'off';
      input.spellcheck = false;
      el.replaceWith(input);
      input.focus();
      input.select();
      const finish = () => {
        const newName = input.value.trim();
        if (newName && newName !== oldName) {
          if (!BUILTIN_TAGS.includes(tag)) {
            updateCustomCategory(tag, newName, (TAG_COLORS[tag] || TAG_COLORS.meeting).text);
          } else {
            renameTag(tag, newName);
          }
          renderActivities();
        } else {
          renderActivities();
        }
      };
      input.addEventListener('blur', finish);
      input.addEventListener('keydown', (ev) => {
        if (ev.key === 'Enter') { ev.preventDefault(); input.blur(); }
        if (ev.key === 'Escape') { input.value = oldName; input.blur(); }
      });
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
      renderActivities();
      // Auto-edit title after creation
      setTimeout(() => {
        const el = document.querySelector(`.tag-col-task[data-task-id="${task.id}"] [data-inline-edit]`);
        if (el) { el.dispatchEvent(new MouseEvent('dblclick', { bubbles: true })); }
      }, 100);
    });
  });

  // --- DRAG & DROP EVENT LISTENERS -----------------------------------------
  setupBoardDragDrop();

  // Add category column click
  const addCol = document.getElementById('addCategoryCol');
  if (addCol) {
    addCol.addEventListener('click', () => {
      openAddCategoryPopup(addCol);
    });
  }
}

// --- ADD CATEGORY POPUP ---------------------------------------------------
function openAddCategoryPopup(anchorEl) {
  const existing = document.getElementById('addCatPopup');
  if (existing) existing.remove();

  const popup = document.createElement('div');
  popup.id = 'addCatPopup';
  popup.className = 'add-cat-popup';
  popup.innerHTML = `
    <div class="add-cat-popup-header">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
      <span>New Category</span>
    </div>
    <div class="add-cat-popup-body">
      <div class="tf-group">
        <label class="tf-label">Name</label>
        <input type="text" id="addCatName" class="form-input" placeholder="e.g. Reading" autocomplete="off" maxlength="30">
      </div>
      <div class="tf-group">
        <label class="tf-label">Color</label>
        <div class="add-cat-color-row">
          <button class="cpop-trigger" id="addCatColorBtn"><span class="cpop-trigger-dot" style="background:#6366f1"></span><span class="cpop-trigger-hex">#6366f1</span></button>
          <input type="hidden" id="addCatColor" value="#6366f1">
        </div>
      </div>
      <div class="add-cat-actions">
        <button class="tf-btn tf-btn-ghost" id="addCatCancel">Cancel</button>
        <button class="tf-btn tf-btn-primary" id="addCatSave">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg>
          Add
        </button>
      </div>
    </div>
  `;
  document.body.appendChild(popup);

  requestAnimationFrame(() => {
    const rect = anchorEl.getBoundingClientRect();
    const pw = 240, ph = popup.offsetHeight || 280;
    let left = rect.right - pw;
    let top = rect.top;
    if (left + pw > window.innerWidth - 8) left = window.innerWidth - pw - 8;
    if (left < 8) left = 8;
    if (top + ph > window.innerHeight - 8) top = window.innerHeight - ph - 8;
    if (top < 8) top = 8;
    popup.style.left = left + 'px';
    popup.style.top = top + 'px';
    document.getElementById('addCatName')?.focus();
  });

  document.getElementById('addCatCancel')?.addEventListener('click', () => popup.remove());
  document.getElementById('addCatSave')?.addEventListener('click', saveNewCategory);
  document.getElementById('addCatColorBtn')?.addEventListener('click', (ev) => {
    ev.stopPropagation();
    const btn = document.getElementById('addCatColorBtn');
    const hidden = document.getElementById('addCatColor');
    if (typeof openColorPopup !== 'function' || !btn || !hidden) return;
    openColorPopup(btn, { title: 'Category color', value: hidden.value, onPick: function(hex) {
      hidden.value = hex;
      const dot = btn.querySelector('.cpop-trigger-dot');
      const label = btn.querySelector('.cpop-trigger-hex');
      if (dot) dot.style.background = hex;
      if (label) label.textContent = hex;
    } });
  });
  popup.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { popup.remove(); }
    if (e.key === 'Enter') { e.preventDefault(); saveNewCategory(); }
  });
}

function saveNewCategory() {
  const nameEl = document.getElementById('addCatName');
  const colorEl = document.getElementById('addCatColor');
  if (!nameEl || !colorEl) return;
  const name = nameEl.value.trim();
  if (!name) {
    nameEl.focus();
    nameEl.classList.add('tpl-add-input-error');
    setTimeout(() => nameEl.classList.remove('tpl-add-input-error'), 2000);
    return;
  }
  const hex = colorEl.value;
  addCustomCategory(name, hex);
  document.getElementById('addCatPopup')?.remove();
  renderActivities();
  showToast(`Category "<strong>${escapeHtml(name)}</strong>" created`, 'success', 2000);
}

// --- DRAG & DROP BETWEEN COLUMNS -------------------------------------------
function setupBoardDragDrop() {
  // Drag start
  boardInner.querySelectorAll('.tag-col-task').forEach(el => {
    el.addEventListener('dragstart', (e) => {
      e.dataTransfer.setData('text/plain', el.dataset.taskId);
      e.dataTransfer.effectAllowed = 'move';
      el.classList.add('dragging');
      // Add a slight delay for the ghost image
      setTimeout(() => {
        el.style.opacity = '0.4';
      }, 0);
    });
    el.addEventListener('dragend', (e) => {
      el.classList.remove('dragging');
      el.style.opacity = '';
      document.querySelectorAll('.tag-column.drag-over').forEach(c => c.classList.remove('drag-over'));
    });
  });

  // ─── Touch drag-and-drop (mobile fallback) ─────
  var _actTouchDrag = null;
  
  boardInner.querySelectorAll('.tag-col-task').forEach(el => {
    el.addEventListener('touchstart', function(e) {
      if (e.touches.length !== 1) return;
      _actTouchDrag = {
        element: this,
        taskId: this.dataset.taskId,
        startX: e.touches[0].clientX,
        startY: e.touches[0].clientY,
        dragOverCol: null
      };
      this.classList.add('dragging');
      this.style.opacity = '0.4';
    }, { passive: true });
    
    el.addEventListener('touchmove', function(e) {
      if (!_actTouchDrag || _actTouchDrag.element !== this) return;
      if (e.touches.length !== 1) return;
      e.preventDefault();
      
      // Find which column we're over
      var touch = e.touches[0];
      var cols = boardInner.querySelectorAll('.tag-column');
      var foundCol = null;
      cols.forEach(function(col) {
        var r = col.getBoundingClientRect();
        if (touch.clientX >= r.left && touch.clientX <= r.right &&
            touch.clientY >= r.top && touch.clientY <= r.bottom) {
          foundCol = col;
        }
      });
      
      // Update drag-over state
      cols.forEach(function(c) { c.classList.remove('drag-over'); });
      if (foundCol) {
        foundCol.classList.add('drag-over');
        _actTouchDrag.dragOverCol = foundCol;
      } else {
        _actTouchDrag.dragOverCol = null;
      }
    }, { passive: false });
    
    el.addEventListener('touchend', function(e) {
      if (!_actTouchDrag || _actTouchDrag.element !== this) return;
      this.classList.remove('dragging');
      this.style.opacity = '';
      
      boardInner.querySelectorAll('.tag-column.drag-over').forEach(function(c) { c.classList.remove('drag-over'); });
      
      var taskId = _actTouchDrag.taskId;
      var targetCol = _actTouchDrag.dragOverCol;
      _actTouchDrag = null;
      
      if (!targetCol) return;
      var newTag = targetCol.dataset.boardTag;
      if (!newTag) return;
      
      var task = getTask(taskId);
      if (!task || task.tag === newTag) return;
      
      updateTask(taskId, { tag: newTag });
      renderActivities();
      showToast('Moved to <strong>' + TAG_LABELS[newTag] + '</strong>', 'success', 2000);
    }, { passive: true });
  });
  
    // Column drop zones
  boardInner.querySelectorAll('.tag-column').forEach(col => {
    col.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      col.classList.add('drag-over');
    });
    col.addEventListener('dragleave', (e) => {
      // Only remove if we're actually leaving the column
      if (!e.currentTarget.contains(e.relatedTarget)) {
        col.classList.remove('drag-over');
      }
    });
    col.addEventListener('drop', (e) => {
      e.preventDefault();
      col.classList.remove('drag-over');

      const taskId = e.dataTransfer.getData('text/plain');
      if (!taskId) return;

      const newTag = col.dataset.boardTag;
      if (!newTag) return;

      const task = getTask(taskId);
      if (!task || task.tag === newTag) {
        // Reset opacity if same tag
        const draggedEl = document.querySelector(`.tag-col-task[data-task-id="${taskId}"]`);
        if (draggedEl) draggedEl.style.opacity = '';
        return;
      }

      updateTask(taskId, { tag: newTag });
      renderActivities();
      showToast(`Moved to <strong>${TAG_LABELS[newTag]}</strong>`, 'success', 2000);
    });
  });
}

// --- RENDER TIMELINE VIEW --------------------------------------------------
function renderTimeline() {
  if (!actTimeline) return;

  const today = new Date();
  const weekStart = getActivitiesWeekStart();
  const days = getWeekRange(weekStart);
  const todayStr = formatDate(today);

  const firstStr = weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const lastStr = addDays(weekStart, 6).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  let html = `<div class="act-tl-weeklabel">${firstStr} – ${lastStr}</div>`;

  for (const day of days) {
    const ds = formatDate(day);
    const dayTasks = state.tasks.filter(t => t.date === ds && !isWhiteboardTask(t));
    if (dayTasks.length === 0) continue;

    // Sort by start time
    dayTasks.sort((a, b) => parseTime(a.startTime) - parseTime(b.startTime));

    const isT = ds === todayStr;
    const dayLabel = day.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });

    html += `<div class="act-timeline-day">
      <div class="act-timeline-day-header">
        <span class="act-timeline-day-label${isT ? ' today' : ''}">${dayLabel}</span>
        <span class="act-timeline-day-count">${dayTasks.length} task${dayTasks.length !== 1 ? 's' : ''}</span>
      </div>
      <div class="act-timeline-tasks">`;

    for (const task of dayTasks) {
      const startM = parseTime(task.startTime);
      const endM = parseTime(task.endTime) || startM + 60;
      const durMins = endM - startM;
      const durStr = durMins >= 60
        ? `${Math.floor(durMins / 60)}h${durMins % 60 ? ` ${durMins % 60}m` : ''}`
        : `${durMins}m`;
      const doneCls = task.completed ? ' completed' : '';

      html += `<div class="act-timeline-task${doneCls}" data-task-id="${task.id}" data-tag="${task.tag}">
        <div class="act-tl-check">
          <span class="tct-check${task.completed ? ' checked' : ''}" data-toggle-complete="${task.id}"></span>
        </div>
        <div class="act-timeline-time">
          <span class="act-tl-time-range">${task.startTime}–${task.endTime}</span>
          <span class="act-tl-dur">${durStr}</span>
        </div>
        <div class="act-timeline-body">
          <div class="act-tl-title">${escapeHtml(task.title)}</div>
          <div class="act-tl-meta">
            <span class="act-tl-tag" data-tag="${task.tag}">${task.tag}</span>
          </div>
        </div>
        <button class="act-timeline-delete" data-delete-task="${task.id}" title="Delete task">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>`;
    }

    html += `</div></div>`;
  }

  if (html === '') {
    html = `<div class="act-timeline-empty">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="opacity:0.3;margin-bottom:8px"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
      <div>No scheduled tasks this week</div>
    </div>`;
  }

  actTimeline.innerHTML = html;

  // Delete task
  actTimeline.querySelectorAll('[data-delete-task]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const tid = btn.dataset.deleteTask;
      const task = getTask(tid);
      if (task && confirm(`Delete "${task.title}"?`)) {
        // Remove log entry first, then deleteTask (which triggers render via callback)
        removeCompletionEntry(tid);
        const savedCallback = pageAfterTaskSave;
        pageAfterTaskSave = null;
        deleteTask(tid);
        pageAfterTaskSave = savedCallback;
        renderActivities();
        showToast('Task deleted', 'info', 2000);
      }
    });
  });

  // Event handlers
  actTimeline.querySelectorAll('.act-timeline-task').forEach(el => {
    el.addEventListener('click', (e) => {
      if (e.target.closest('[data-toggle-complete]')) {
        const tid = e.target.closest('[data-toggle-complete]').dataset.toggleComplete;
        const task = getTask(tid);
        const wasCompleted = task?.completed;
        
        // Suspend page callback to avoid double render
        const savedCallback = pageAfterTaskSave;
        pageAfterTaskSave = null;
        toggleComplete(tid);
        pageAfterTaskSave = savedCallback;
        
        if (!wasCompleted && task) {
          addCompletionEntry(tid, task.title, task.tag);
        } else if (wasCompleted && task) {
          removeCompletionEntry(tid);
        }
        renderActivities();
        return;
      }
      if (e.target.closest('[data-delete-task]')) return;
      const taskId = el.dataset.taskId;
      if (taskId) openTaskModal(taskId);
    });
  });
}

// --- RENDER ACTIVITY LOG ---------------------------------------------------
function renderActivityLog() {
  if (!actLogList) return;

  const weekStart = getActivitiesWeekStart();
  const weekEnd = addDays(weekStart, 6);
  weekEnd.setHours(23, 59, 59, 999);
  const log = getCompletionLog().filter(entry => {
    const d = new Date(entry.completedAt);
    return d >= weekStart && d <= weekEnd;
  });
  if (actLogCount) actLogCount.textContent = `${log.length} completed this week`;

  if (log.length === 0) {
    actLogList.innerHTML = '<div class="act-log-empty">Complete a task to see it here</div>';
    return;
  }

  let html = '';
  for (const entry of log) {
    const date = new Date(entry.completedAt);
    const timeStr = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    html += `<div class="act-log-item" data-task-id="${entry.taskId}" data-tag="${entry.tag}">
      <span class="act-log-item-dot"></span>
      <span class="act-log-item-title done">${escapeHtml(entry.title)}</span>
      <span class="act-log-item-time">${dateStr} ${timeStr}</span>
      <button class="act-log-item-undo" data-undo-task="${entry.taskId}" title="Undo completion">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 102.13-9.36L1 10"/></svg>
      </button>
    </div>`;
  }

  actLogList.innerHTML = html;

  // Undo completion handler
  actLogList.querySelectorAll('[data-undo-task]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const tid = btn.dataset.undoTask;
      const task = getTask(tid);
      if (task) {
        updateTask(tid, { completed: false });
        removeCompletionEntry(tid);
        renderActivities();
        showToast('Completion undone', 'info', 2000);
      }
    });
  });
}

// --- VIEW TOGGLE -----------------------------------------------------------
function switchActivitiesView(view) {
  activitiesView = view;
  document.querySelectorAll('.act-view-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.view === view);
  });
  updateView();
}

// --- WEEKLY ACTIVITY CHART (stacked bar by tag) ----------------------------
function renderActivityChart() {
  // Clean up any lingering tooltip before re-render
  hideChartTooltip();
  
  const chart = document.getElementById('activityChart');
  const totalEl = document.getElementById('actChartTotal');
  const legendEl = document.getElementById('actChartLegend');
  const weekLabel = document.getElementById('actWeekLabel');
  if (!chart) return;

  const now = new Date();
  const weekStart = getActivitiesWeekStart();
  const todayStr = formatDate(now);

  // Update week label
  if (weekLabel) {
    const offset = weekOffset;
    const firstDay = weekStart;
    const lastDay = addDays(weekStart, 6);
    const monthLabel = firstDay.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const endLabel = lastDay.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    if (offset === 0) {
      weekLabel.textContent = 'This Week';
    } else {
      weekLabel.textContent = `${monthLabel} – ${endLabel}`;
    }
  }
  const dayLabels = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  const tags = TAG_ORDER;

  const dayData = [];
  let grandTotal = 0;
  let maxDayTotal = 0;

  for (let i = 0; i < 7; i++) {
    const d = addDays(weekStart, i);
    const ds = formatDate(d);
    const dayTasks = state.tasks.filter(t => t.date === ds && !isWhiteboardTask(t));

    const tagMins = {};
    let dayTotal = 0;
    for (const tag of tags) tagMins[tag] = 0;

    for (const t of dayTasks) {
      const start = parseTime(t.startTime);
      const end = parseTime(t.endTime) || start + 60;
      const dur = Math.max(end - start, 15);
      if (tagMins[t.tag] !== undefined) {
        tagMins[t.tag] += dur;
        dayTotal += dur;
      }
    }

    grandTotal += dayTotal;
    if (dayTotal > maxDayTotal) maxDayTotal = dayTotal;

    dayData.push({ date: ds, isToday: ds === todayStr, total: dayTotal, tagMins });
  }

  if (maxDayTotal === 0) {
    chart.innerHTML = '<div class="act-chart-empty"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg><div class="act-chart-empty-title">Nothing scheduled</div><div class="act-chart-empty-sub">Add tasks in Schedule to see your week here</div></div>';
    if (totalEl) totalEl.textContent = 'No tasks this week';
    if (legendEl) legendEl.innerHTML = '';
    return;
  }

  const avgDaily = Math.round(grandTotal / 7);

  const tagTotals = {};
  for (const tag of tags) tagTotals[tag] = 0;
  for (const dd of dayData) for (const tag of tags) tagTotals[tag] += dd.tagMins[tag] || 0;
  const activeTags = tags.filter(t => tagTotals[t] > 0).sort((a, b) => tagTotals[b] - tagTotals[a]);

  const R = 60, CIRC = 2 * Math.PI * R;
  let acc = 0, segs = '';
  for (const tag of activeTags) {
    const frac = tagTotals[tag] / grandTotal;
    const len = Math.max(frac * CIRC - 2.5, 1);
    segs += `<circle class="act-pie-seg" data-tag="${tag}" cx="70" cy="70" r="${R}" fill="none" stroke-width="22" stroke-dasharray="${len} ${CIRC - len}" stroke-dashoffset="${-acc}" transform="rotate(-90 70 70)" data-mins="${tagTotals[tag]}" data-pct="${Math.round(frac * 100)}"><title>${TAG_LABELS[tag]}: ${formatDuration(tagTotals[tag])}</title></circle>`;
    acc += frac * CIRC;
  }
  let bars = '';
  for (let i = 0; i < 7; i++) {
    const dd = dayData[i];
    const d = addDays(weekStart, i);
    const h = maxDayTotal > 0 ? Math.max((dd.total / maxDayTotal) * 100, 6) : 6;
    const todayCls = dd.isToday ? ' today' : '';
    const sortedTags = [...tags].filter(tag => dd.tagMins[tag] > 0);
    sortedTags.sort((a, b) => dd.tagMins[b] - dd.tagMins[a]);
    let segs = '';
    for (const tag of sortedTags) {
      const pct = (dd.tagMins[tag] / dd.total) * 100;
      segs += `<div class="act-chart-bar-segment" data-tag="${tag}" style="height:${pct}%" title="${TAG_LABELS[tag]}: ${formatDuration(dd.tagMins[tag])}"></div>`;
    }
    bars += `<div class="act-chart-bar-col${todayCls}">` +
      `<span class="act-chart-bar-val">${dd.total > 0 ? formatDuration(dd.total) : ''}</span>` +
      (dd.total > 0
        ? `<div class="act-chart-bar" style="height:${h}%" title="${dayLabels[i]}: ${formatDuration(dd.total)}">${segs}</div>`
        : `<div class="act-chart-bar-empty"></div>`) +
      `<span class="act-chart-bar-label">${dayLabels[i]} <small>${d.getDate()}</small></span></div>`;
  }
  chart.innerHTML = `<div class="act-pie-wrap"><svg class="act-pie" viewBox="0 0 140 140" role="img" aria-label="Time by category">${segs}</svg><div class="act-pie-center"><span class="act-pie-total">${formatDuration(grandTotal)}</span><span class="act-pie-sub">this week</span></div></div><div class="act-daybars">${bars}</div>`;

  if (totalEl) totalEl.textContent = `${formatDuration(grandTotal)} total · avg ${formatDuration(avgDaily)}/day`;

  // Legend
  let legendHtml = '';
  for (const tag of activeTags) {
    const pct = Math.round((tagTotals[tag] / grandTotal) * 100);
    legendHtml += `<span class="act-chart-legend-item">
      <span class="act-chart-legend-dot" data-tag="${tag}"></span>
      ${TAG_LABELS[tag]}
      <span class="act-chart-legend-val">${formatDuration(tagTotals[tag])} · ${pct}%</span>
    </span>`;
  }
  if (legendEl) legendEl.innerHTML = legendHtml;

  // ─── HOVER TOOLTIP ─────────────────────────────────
  chart.querySelectorAll('.act-pie-seg').forEach(function(seg) {
    seg.addEventListener('mouseenter', function(e) {
      showPieTooltip(e, seg);
    });
    seg.addEventListener('mousemove', function(e) {
      moveChartTooltip(e);
    });
    seg.addEventListener('mouseleave', function() {
      hideChartTooltip();
    });
  });
  chart.querySelectorAll('.act-daybars .act-chart-bar-col').forEach(function(col, i) {
    var dd = dayData[i];
    if (!dd || dd.total === 0) return;
    var colBar = col.querySelector('.act-chart-bar');
    if (!colBar) return;
    colBar.addEventListener('mouseenter', function(e) {
      showChartTooltip(e, dd, dayLabels[i]);
    });
    colBar.addEventListener('mousemove', function(e) {
      moveChartTooltip(e);
    });
    colBar.addEventListener('mouseleave', function() {
      hideChartTooltip();
    });
  });
}

// ─── CHART TOOLTIP ──────────────────────────────────────
var _chartTooltipEl = null;

function showChartTooltip(e, dayData, dayLabel) {
  hideChartTooltip();
  var tip = document.createElement('div');
  tip.className = 'act-chart-tooltip';

  var html = '<div class="act-chart-tooltip-title">' + dayLabel + ' — ' + formatDuration(dayData.total) + '</div>';
  
  var sortedTags = TAG_ORDER.filter(function(tag) { return dayData.tagMins[tag] > 0; });
  sortedTags.sort(function(a, b) { return dayData.tagMins[b] - dayData.tagMins[a]; });
  
  for (var ti = 0; ti < sortedTags.length; ti++) {
    var tag = sortedTags[ti];
    var pct = Math.round((dayData.tagMins[tag] / dayData.total) * 100);
    html += '<div class="act-chart-tooltip-row">' +
      '<span class="act-chart-tooltip-dot" style="background:' + (TAG_COLORS[tag] ? TAG_COLORS[tag].text : '#888') + '"></span>' +
      '<span>' + TAG_LABELS[tag] + '</span>' +
      '<span class="val">' + formatDuration(dayData.tagMins[tag]) + ' (' + pct + '%)</span>' +
      '</div>';
  }
  
  html += '<div class="act-chart-tooltip-total"><span>Total</span><span>' + formatDuration(dayData.total) + '</span></div>';
  
  tip.innerHTML = html;
  document.body.appendChild(tip);
  _chartTooltipEl = tip;
  positionChartTooltip(e);
}

function moveChartTooltip(e) {
  if (_chartTooltipEl) positionChartTooltip(e);
}

function positionChartTooltip(e) {
  if (!_chartTooltipEl) return;
  var w = _chartTooltipEl.offsetWidth;
  var h = _chartTooltipEl.offsetHeight;
  var x = e.clientX + 12;
  var y = e.clientY - h - 12;
  if (x + w > window.innerWidth - 8) x = e.clientX - w - 12;
  if (y < 8) y = e.clientY + 12;
  _chartTooltipEl.style.left = x + 'px';
  _chartTooltipEl.style.top = y + 'px';
}

function hideChartTooltip() {
  if (_chartTooltipEl) {
    _chartTooltipEl.remove();
    _chartTooltipEl = null;
  }
}

function showPieTooltip(e, seg) {
  hideChartTooltip();
  var tag = seg.dataset.tag;
  var mins = parseInt(seg.dataset.mins, 10) || 0;
  var pct = seg.dataset.pct || 0;
  var tip = document.createElement('div');
  tip.className = 'act-chart-tooltip';
  tip.innerHTML = '<div class="act-chart-tooltip-row">' +
    '<span class="act-chart-tooltip-dot" style="background:' + (TAG_COLORS[tag] ? TAG_COLORS[tag].text : '#888') + '"></span>' +
    '<span>' + ((typeof TAG_LABELS !== 'undefined' && TAG_LABELS[tag]) ? TAG_LABELS[tag] : tag) + '</span>' +
    '<span class="val">' + formatDuration(mins) + ' (' + pct + '%)</span></div>';
  document.body.appendChild(tip);
  _chartTooltipEl = tip;
  positionChartTooltip(e);
}

function updateView() {
  if (!boardView || !timelineView) return;
  if (activitiesView === 'board') {
    boardView.style.display = '';
    timelineView.style.display = 'none';
  } else {
    boardView.style.display = 'none';
    timelineView.style.display = '';
  }
}

// --- THEME CLASS HOOK ----------------------------------------------------
// The progress page ships its own design tokens (css/progress-desert.css,
// css/progress-mono.css). Reflect the active theme on <html> so the design
// can re-theme without touching the DOM layout.
const PAGE_THEME_ATTR = 'data-pg-theme';
function applyPageTheme() {
  const root = document.documentElement;
  const mono = !!document.querySelector('.mono-hero') && state.darkMode !== false;
  const el = mono ? 'mono' : (state.darkMode === false ? 'light' : 'dark');
  root.setAttribute(PAGE_THEME_ATTR, el);
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
  // dom.helpBtn removed
  dom.helpOverlay = document.getElementById('helpOverlay');
  dom.helpModal = document.getElementById('helpModal');
  dom.helpModalClose = document.getElementById('helpModalClose');
  // helpBtn listener removed
  dom.helpOverlay?.addEventListener('click', hideHelpModal);
  dom.helpModalClose?.addEventListener('click', hideHelpModal);
  populateShortcuts();

  document.getElementById('themeBtnSidebar')?.addEventListener('click', toggleTheme);
  // settingsBtnSidebar removed
  dom.importFileInput?.addEventListener('change', importData);
  document.getElementById('importBtn')?.addEventListener('click', () => { if (dom.importFileInput) { dom.importFileInput.value = ''; dom.importFileInput.click(); } });

  dom.aiChatBtn?.addEventListener('click', openSettingsBubble);
  dom.aiChatOverlay?.addEventListener('click', hideAIChat);
  dom.aiChatClose?.addEventListener('click', hideAIChat);
  dom.aiChatSend?.addEventListener('click', sendAIMessage);
  dom.aiChatInput?.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendAIMessage(); } });

  // Week navigation
  document.getElementById('actWeekPrev')?.addEventListener('click', () => { weekOffset--; renderActivities(); });
  document.getElementById('actWeekNext')?.addEventListener('click', () => { weekOffset++; renderActivities(); });

  // Access Hub (FAB)
  document.getElementById('accessMain')?.addEventListener('click', toggleAccessHub);
  document.getElementById('actAccessExport')?.addEventListener('click', () => {
    toggleAccessHub();
    exportData();
  });
  document.getElementById('actAccessAIChat')?.addEventListener('click', () => {
    toggleAccessHub();
    if (typeof showAIChat === 'function') showAIChat();
  });
  document.getElementById('actAccessReset')?.addEventListener('click', () => {
    toggleAccessHub();
    weekOffset = 0;
    renderActivities();
  });
  document.addEventListener('click', (e) => {
    const hub = document.getElementById('accessHub');
    if (hub && !hub.contains(e.target)) {
      document.getElementById('accessItems')?.classList.remove('open');
      document.getElementById('accessMain')?.classList.remove('open');
    }
  });

  // View toggle
  document.querySelectorAll('.act-view-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      switchActivitiesView(btn.dataset.view);
    });
  });

  // Search filter (board + timeline)
  actSearchInput = document.getElementById('actSearchInput');
  if (actSearchInput) {
    actSearchInput.addEventListener('input', () => {
      const q = actSearchInput.value.trim().toLowerCase();
      document.querySelectorAll('.tag-col-task, .act-timeline-task').forEach(el => {
        const title = el.querySelector('.tct-title-text, .act-tl-title');
        const match = !q || (title && title.textContent.toLowerCase().includes(q));
        el.style.display = match ? '' : 'none';
      });
    });
  }

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
  const observer = new MutationObserver(() => { applyPageTheme(); renderActivities(); });
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
}

// --- INIT ------------------------------------------------------------------
function init() {
  loadState();
  applyTheme();
  applyPageTheme();
  loadCompletionLog();
  document.querySelectorAll('img[data-image-id]').forEach(el => { const url = getImage(el.dataset.imageId) || ''; el.src = url; el.style.display = url ? 'block' : 'none'; });
  window._onImageSaved = function(id, url) {
    document.querySelectorAll('img[data-image-id="' + id + '"]').forEach(el => {
      el.src = url || '';
      el.style.display = url ? 'block' : 'none';
    });
  };
  document.addEventListener('click', function(e) {
    if (!state.editMode) return;
    const imgEl = e.target.closest('.mono-hero.has-image .hero-img');
    if (!imgEl || !imgEl.dataset.imageId) return;
    openImagePicker(imgEl.dataset.imageId);
  });
  weekOffset = 0;
  renderActivities();
  renderAnalytics();
  setupPage();
  document.getElementById('exportBtn')?.addEventListener('click', exportData);
  document.getElementById('importBtn')?.addEventListener('click', () => { document.getElementById('importFileInput')?.click(); });
  document.getElementById('analyticsPeriodPills')?.addEventListener('click', (e) => {
    const pill = e.target.closest('.an-period-pill');
    if (!pill) return;
    document.querySelectorAll('.an-period-pill').forEach(p => p.classList.remove('active'));
    pill.classList.add('active');
    currentPeriod = pill.dataset.period;
    renderAnalytics();
  });
  setupTrendHover();
  window.addEventListener('resize', renderAnalytics);
  const _analyticsThemeObserver = new MutationObserver(() => { applyPageTheme(); renderAnalytics(); });
  _analyticsThemeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
else init();



let currentPeriod = 'week';
const trendCanvas = document.getElementById('trendChart');


function getTagColorHex(tag) {
  const c = cardColors[tag] || DEFAULT_TAG_COLORS[tag];
  const isDark = document.documentElement.classList.contains('dark');
  const bg = isDark ? darkenColor(c.light, 0.82) : lightenColor(c.light, 0.85);
  const text = c.dark || lightenColor(c.light, 0.45);
  return { bg, text: c.light, dark: darkenColor(c.light, 0.82) };
}

// ─── FILTERING ─────────────────────────────────────────────
function getFilteredTasks() {
  const period = currentPeriod;
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  let startDate = null;

  if (period === 'week') {
    startDate = getMonday(today);
  } else if (period === 'month') {
    startDate = new Date(now.getFullYear(), now.getMonth(), 1);
  }

  return state.tasks.filter(t => {
    if (isWhiteboardTask(t)) return false;
    if (startDate) {
      const d = new Date(t.date + 'T12:00:00');
      if (d < startDate) return false;
    }
    return true;
  });
}

function getTaskDuration(task) {
  const start = parseTime(task.startTime);
  const end = parseTime(task.endTime) || start + 60;
  return Math.max(end - start, 15);
}


// ─── SUMMARY STATS ─────────────────────────────────────────
function getPeriodStartDate(period, refDate) {
  const now = refDate ? new Date(refDate) : new Date();
  if (period === 'week') return getMonday(now);
  if (period === 'month') return new Date(now.getFullYear(), now.getMonth(), 1);
  return null;
}

function getPreviousPeriodTasks(period) {
  if (period === 'all') return [];
  const now = new Date();
  const start = getPeriodStartDate(period);
  let prevStart;
  let prevEnd;
  if (period === 'week') {
    prevStart = addDays(start, -7);
    prevEnd = addDays(start, -1);
  } else {
    prevStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    prevEnd = new Date(now.getFullYear(), now.getMonth(), 0);
  }
  prevEnd.setHours(23, 59, 59, 999);
  return state.tasks.filter(t => {
    if (isWhiteboardTask(t)) return false;
    const d = new Date(t.date + 'T12:00:00');
    return d >= prevStart && d <= prevEnd;
  });
}

function setKpiTrend(elId, current, previous) {
  const el = document.getElementById(elId);
  if (!el) return;
  if (!previous || currentPeriod === 'all') {
    el.className = 'an-kpi-trend flat';
    el.textContent = '';
    return;
  }
  if (previous === 0) {
    el.className = 'an-kpi-trend flat';
    el.textContent = 'new';
    return;
  }
  const pct = Math.round(((current - previous) / previous) * 100);
  if (pct === 0) {
    el.className = 'an-kpi-trend flat';
    el.textContent = '=';
  } else {
    el.className = 'an-kpi-trend ' + (pct > 0 ? 'up' : 'down');
    el.textContent = (pct > 0 ? '+' : '') + pct + '%';
  }
}

function renderSummary(tasks) {
  const el = (id) => document.getElementById(id);
  let totalMins = 0;
  let doneCount = 0;
  let deepMins = 0;
  let studyMins = 0;

  for (const t of tasks) {
    const dur = getTaskDuration(t);
    totalMins += dur;
    if (t.completed) doneCount++;
    if (t.tag === 'deep-work') deepMins += dur;
    if (t.tag === 'study') studyMins += dur;
  }

  el('statTime').textContent = formatHrs(totalMins);
  if (el('statTimeKpi')) el('statTimeKpi').textContent = formatHrs(totalMins);
  if (el('statDeep')) el('statDeep').textContent = formatHrs(deepMins);
  if (el('statStudy')) el('statStudy').textContent = formatHrs(studyMins);

  const sub = el('statTasksSub');
  if (sub) sub.textContent = `${doneCount} done of ${tasks.length}`;
  if (el('statTasks')) el('statTasks').textContent = `${doneCount} done of ${tasks.length}`;
  if (el('statTasksSubKpi')) el('statTasksSubKpi').textContent = `${doneCount} done of ${tasks.length}`;

  const pct = tasks.length > 0 ? Math.round((doneCount / tasks.length) * 100) : 0;
  if (el('compKpi')) el('compKpi').textContent = `${pct}%`;
  if (el('compKpiSub')) el('compKpiSub').textContent = `${doneCount} done of ${tasks.length}`;

  const prev = getPreviousPeriodTasks(currentPeriod);
  const sumMins = (list) => list.reduce((s, t) => s + getTaskDuration(t), 0);
  const sumTag = (list, tag) => list.reduce((s, t) => s + (t.tag === tag ? getTaskDuration(t) : 0), 0);
  setKpiTrend('statTimeTrend', totalMins, sumMins(prev));
  setKpiTrend('statDeepTrend', deepMins, sumTag(prev, 'deep-work'));
  setKpiTrend('statStudyTrend', studyMins, sumTag(prev, 'study'));
}

// ─── COMPLETION RATE ───────────────────────────────────────
function renderCompletion(tasks) {
  const el = (id) => document.getElementById(id);
  let completed = 0;
  for (const t of tasks) {
    if (t.completed) completed++;
  }

  const total = tasks.length;
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

  el('compDone').textContent = completed;
  el('compTotal').textContent = total;
  el('completionFill').style.width = `${pct}%`;
  const ring = el('compRing');
  if (ring) ring.style.background = `conic-gradient(var(--primary) ${pct}%, var(--bg-secondary) ${pct}%)`;
  const ringPct = el('compRingPct');
  if (ringPct) ringPct.textContent = `${pct}%`;
  const compPctEl = el('compPct');
  if (compPctEl) {
    compPctEl.className = 'an-kpi-trend flat';
    compPctEl.textContent = `${pct}%`;
  }
}

// ─── STREAK CARD ───────────────────────────────────────────
function renderStreak(tasks) {
  const el = (id) => document.getElementById(id);
  const streakDaysEl = el('streakDays');

  // Get last 7 days
  const days = [];
  const now = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    days.push({
      date: formatDate(d),
      label: d.toLocaleDateString('en-US', { weekday: 'short' }).charAt(0),
      isToday: i === 0
    });
  }

  // Check which days have tasks
  const dayHasTasks = days.map(day => {
    return tasks.some(t => t.date === day.date);
  });

  // Render day dots
  streakDaysEl.innerHTML = days.map((day, i) => {
    const classes = ['an-streak-day'];
    if (dayHasTasks[i]) classes.push('active');
    if (day.isToday) classes.push('today');
    return `<div class="${classes.join(' ')}">${day.label}</div>`;
  }).join('');

  // Calculate streaks (scoped to the 7-day window shown)
  let currentStreak = 0;
  let bestStreak = 0;
  let tempStreak = 0;
  let daysActive = 0;

  // Count from today backwards for current streak
  for (let i = days.length - 1; i >= 0; i--) {
    if (dayHasTasks[i]) {
      currentStreak++;
    } else {
      break;
    }
  }

  // Calculate best streak and total active days
  for (let i = 0; i < days.length; i++) {
    if (dayHasTasks[i]) {
      tempStreak++;
      daysActive++;
      bestStreak = Math.max(bestStreak, tempStreak);
    } else {
      tempStreak = 0;
    }
  }

  el('streakCurrent').textContent = currentStreak;
  el('streakBest').textContent = bestStreak;
  const activeEl = el('streakActive');
  if (activeEl) activeEl.textContent = daysActive;
}

// ─── CHART THEME HELPERS ──────────────────────────────────
function chartFont(size, weight) {
  return `${weight ? weight + ' ' : ''}${size}px "Hanken Grotesk", Inter, sans-serif`;
}

function hexToRgba(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function chartTheme() {
  return {
    isDark: true,
    textColor: '#8a8a8a',
    gridColor: '#262626',
    holeColor: '#000000',
    labelColor: '#ffffff',
    accent: '#ffffff'
  };
}

// ─── TREND LINE GRAPH ─────────────────────────────────────
function renderTrendChart(tasks) {
  if (!trendCanvas) return;
  const ctx = trendCanvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const rect = trendCanvas.getBoundingClientRect();
  if (rect.width === 0) return;
  trendCanvas.width = rect.width * dpr;
  trendCanvas.height = rect.height * dpr;
  ctx.scale(dpr, dpr);
  const w = rect.width;
  const h = rect.height;
  trendCanvas.__trendData = null;

  ctx.clearRect(0, 0, w, h);

  const theme = chartTheme();
  const accent = theme.accent;

  // Last 30 days, scheduled time per day in minutes
  const days = [];
  const now = new Date();
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    days.push(formatDate(d));
  }
  const dayMins = days.map(date => {
    let total = 0;
    for (const t of tasks) {
      if (t.date === date) total += getTaskDuration(t);
    }
    return total;
  });

  // Empty state
  if (dayMins.every(m => m === 0)) {
    ctx.fillStyle = theme.textColor;
    ctx.font = chartFont(12);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('No scheduled time in the last 30 days', w / 2, h / 2);
    return;
  }

  // Y scale in hours, nice ceiling of 1/2/4/6/8/10/12
  const maxHours = Math.max(...dayMins) / 60;
  const steps = [2, 4, 6, 8, 10, 12];
  let topHours = steps.find(s => maxHours <= s) || Math.ceil(maxHours);
  const niceMax = topHours * 60;

  const pad = { top: 14, right: 12, bottom: 26, left: 34 };
  const chartW = w - pad.left - pad.right;
  const chartH = h - pad.top - pad.bottom;
  const xAt = i => pad.left + (chartW / (days.length - 1)) * i;
  const yAt = mins => pad.top + chartH - (Math.min(mins, niceMax) / niceMax) * chartH;

  // Horizontal gridlines with hour labels on the left
  const hstep = topHours % 3 === 0 ? topHours / 3 : 2;
  ctx.font = chartFont(9);
  ctx.textBaseline = 'middle';
  for (let hrs = 0; hrs <= topHours; hrs += hstep) {
    const y = yAt(hrs * 60);
    ctx.strokeStyle = theme.gridColor;
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 4]);
    ctx.beginPath();
    ctx.moveTo(pad.left, y);
    ctx.lineTo(w - pad.right, y);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = theme.textColor;
    ctx.textAlign = 'right';
    ctx.fillText(hrs + 'h', pad.left - 6, y);
  }

  // Average scheduled time (dashed line + label)
  const activeMins = dayMins.filter(m => m > 0);
  const avgMins = activeMins.reduce((a, b) => a + b, 0) / activeMins.length;
  const avgY = yAt(avgMins);
  ctx.strokeStyle = theme.textColor;
  ctx.globalAlpha = 0.45;
  ctx.lineWidth = 1;
  ctx.setLineDash([5, 4]);
  ctx.beginPath();
  ctx.moveTo(pad.left, avgY);
  ctx.lineTo(w - pad.right, avgY);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.globalAlpha = 1;
  ctx.font = chartFont(9, 'bold');
  ctx.textAlign = 'left';
  ctx.fillStyle = theme.textColor;
  ctx.fillText('avg ' + formatDuration(Math.round(avgMins)), pad.left + 4, avgY - 7);

  // Area fill under the line
  const pts = dayMins.map((m, i) => ({ x: xAt(i), y: yAt(m) }));
  const grad = ctx.createLinearGradient(0, pad.top, 0, pad.top + chartH);
  grad.addColorStop(0, hexToRgba(accent, theme.isDark ? 0.20 : 0.15));
  grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pad.top + chartH);
  pts.forEach(p => ctx.lineTo(p.x, p.y));
  ctx.lineTo(pts[pts.length - 1].x, pad.top + chartH);
  ctx.closePath();
  ctx.fillStyle = grad;
  ctx.fill();

  // Straight segments line — reads exactly, no smoothing distortion
  ctx.beginPath();
  pts.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
  ctx.strokeStyle = accent;
  ctx.lineWidth = 2;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.stroke();

  // Dots — today emphasized
  pts.forEach((p, i) => {
    const isToday = i === pts.length - 1;
    ctx.beginPath();
    ctx.arc(p.x, p.y, isToday ? 3.5 : 2, 0, Math.PI * 2);
    ctx.fillStyle = accent;
    ctx.fill();
    if (isToday) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, 7, 0, Math.PI * 2);
      ctx.fillStyle = hexToRgba(accent, theme.isDark ? 0.25 : 0.18);
      ctx.fill();
    }
  });

  // X labels — first, today, and every 7th day between
  ctx.font = chartFont(9);
  ctx.fillStyle = theme.textColor;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText('30d ago', pts[0].x, h - 8);
  for (let i = 7; i < days.length - 1; i += 7) {
    const d = new Date(days[i] + 'T12:00:00');
    ctx.fillText(d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), pts[i].x, h - 8);
  }
  ctx.font = chartFont(9, 'bold');
  ctx.fillText('Today', pts[pts.length - 1].x, h - 8);

  // Hover crosshair + tooltip (points stored for hit testing)
  trendCanvas.__trendData = { pts, dayMins, days, pad, chartW, chartH, theme };
}

function hideTrendHover() {
  if (trendCanvas && trendCanvas.__hoverMarker) {
    trendCanvas.__hoverMarker.remove();
    trendCanvas.__hoverMarker = null;
  }
  hideChartTooltip();
}

function moveTrendHover(e) {
  const canvas = trendCanvas;
  const data = canvas && canvas.__trendData;
  if (!data) return;
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  let best = 0;
  for (let i = 1; i < data.pts.length; i++) {
    if (Math.abs(data.pts[i].x - x) < Math.abs(data.pts[best].x - x)) best = i;
  }
  const p = data.pts[best];
  const date = new Date(data.days[best] + 'T12:00:00');
  const label = date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

  hideChartTooltip();
  const tip = document.createElement('div');
  tip.className = 'act-chart-tooltip an-trend-tip';
  tip.innerHTML = '<div class="act-chart-tooltip-title">' + label + '</div>' +
    '<div class="act-chart-tooltip-row"><span class="act-chart-tooltip-dot" style="background:' + data.theme.accent + '"></span>' +
    '<span>Scheduled</span><span class="val">' + formatDuration(data.dayMins[best]) + '</span></div>' +
    (data.dayMins[best] === 0 ? '<div class="act-chart-tooltip-row" style="opacity:0.6"><span></span><span>Nothing planned</span></div>' : '');
  document.body.appendChild(tip);
  _chartTooltipEl = tip;

  if (!canvas.__hoverMarker) {
    const marker = document.createElement('div');
    marker.style.cssText = 'position:absolute;top:0;bottom:0;width:1px;background:var(--border-color);pointer-events:none';
    canvas.parentNode.style.position = 'relative';
    canvas.parentNode.appendChild(marker);
    canvas.__hoverMarker = marker;
  }
  canvas.__hoverMarker.style.left = (canvas.offsetLeft + p.x) + 'px';
  canvas.__hoverMarker.style.display = 'block';

  positionChartTooltip(e);
}

function setupTrendHover() {
  if (!trendCanvas) return;
  trendCanvas.addEventListener('mousemove', moveTrendHover);
  trendCanvas.addEventListener('mouseleave', hideTrendHover);
}

// ─── DAY-BY-DAY TABLE ──────────────────────────────────────
function renderTable(tasks) {
  const tbody = document.getElementById('analyticsTableBody');
  if (!tbody) return;

  // Group tasks by date
  const dateMap = {};
  for (const t of tasks) {
    if (!dateMap[t.date]) dateMap[t.date] = [];
    dateMap[t.date].push(t);
  }

  const sortedDates = Object.keys(dateMap).sort().reverse();
  if (sortedDates.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:var(--text-tertiary)">No data</td></tr>';
    return;
  }

  let html = '';
  for (const date of sortedDates.slice(0, 30)) {
    const dayTasks = dateMap[date];
    const activeTasks = dayTasks.filter(t => !t.completed);
    const doneCount = dayTasks.length - activeTasks.length;
    let totalMins = 0;
    let deepMins = 0;
    let studyMins = 0;

    for (const t of activeTasks) {
      const dur = getTaskDuration(t);
      totalMins += dur;
      if (t.tag === 'deep-work') deepMins += dur;
      if (t.tag === 'study') studyMins += dur;
    }

    const d = new Date(date + 'T12:00:00');
    const label = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    const otherMins = totalMins - deepMins - studyMins;
    const rowColor = totalMins > 0
      ? getTagColorHex(deepMins >= studyMins ? 'deep-work' : 'study').text
      : 'transparent';

    html += `<tr style="--row-accent:${rowColor}">
      <td>${label}</td>
      <td class="num">${activeTasks.length}</td>
      <td class="num">${doneCount ? doneCount : '–'}</td>
      <td class="num">${formatHrs(totalMins)}</td>
      <td class="num">${formatHrs(deepMins)}</td>
      <td class="num">${formatHrs(studyMins)}</td>
      <td class="num">${formatHrs(otherMins)}</td>
    </tr>`;
  }
  tbody.innerHTML = html;
}


// ─── SLEEP CHARTS ─────────────────────────────────────────
const sleepCanvas = document.getElementById('sleepChart');

function renderSleepAnalytics() {
  const now = new Date();

  // Get last 7 days
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    days.push(formatDate(d));
  }

  const weekLogs = [];
  for (const ds of days) {
    const log = getSleepLog(ds);
    if (log) weekLogs.push(log);
  }

  // Duration stats
  const durEl = document.getElementById('sleepAnalyticsDuration');
  const durSubEl = document.getElementById('sleepAnalyticsDurationSub');
  if (weekLogs.length > 0) {
    const totalMins = weekLogs.reduce((s, l) => s + l.duration, 0);
    const avgMins = Math.round(totalMins / weekLogs.length);
    durEl.textContent = formatSleepMinutes(avgMins);
    durSubEl.textContent = 'Average across ' + weekLogs.length + ' nights';
  } else {
    durEl.textContent = '—';
    durSubEl.textContent = 'No sleep data';
  }

  // Quality stats + per-night dots
  const qEl = document.getElementById('sleepAnalyticsQuality');
  const qSubEl = document.getElementById('sleepAnalyticsQualitySub');
  const dotsEl = document.getElementById('qualityDots');
  if (weekLogs.length > 0) {
    const avgQ = weekLogs.reduce((s, l) => s + l.quality, 0) / weekLogs.length;
    qEl.textContent = avgQ.toFixed(1) + ' / 5';
    qSubEl.textContent = 'Average sleep quality';
    const qFill = document.getElementById('sleepQualityFill');
    if (qFill) qFill.style.width = Math.round((avgQ / 5) * 100) + '%';
  } else {
    qEl.textContent = '—';
    qSubEl.textContent = 'No sleep data';
    const qFill = document.getElementById('sleepQualityFill');
    if (qFill) qFill.style.width = '0%';
  }
  if (dotsEl) {
    dotsEl.innerHTML = days.map(ds => {
      const log = getSleepLog(ds);
      const q = log ? log.quality : 0;
      const label = new Date(ds + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'narrow' });
      const color = log
        ? 'color-mix(in srgb, var(--primary) ' + Math.round((q / 5) * 100) + '%, var(--bg-secondary))'
        : '';
      return '<div class="an-quality-dot" title="' + label + (log ? ': ' + q + '/5 · ' + formatSleepMinutes(log.duration) : ': no log') + '">' +
        '<i style="' + (color ? 'background:' + color : '') + '"></i><span>' + label + '</span></div>';
    }).join('');
  }

  // Sleep chart
  renderSleepChart(weekLogs, days);
}

function renderSleepChart(weekLogs, days) {
  if (!sleepCanvas) return;
  const ctx = sleepCanvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const rect = sleepCanvas.getBoundingClientRect();
  sleepCanvas.width = rect.width * dpr;
  sleepCanvas.height = rect.height * dpr;
  ctx.scale(dpr, dpr);
  const w = rect.width;
  const h = rect.height;

  ctx.clearRect(0, 0, w, h);

  const theme = chartTheme();
  const isDark = theme.isDark;
  const textColor = theme.textColor;
  const gridColor = theme.gridColor;
  const accentColor = theme.accent;

  // Build day data
  const dayData = days.map((ds, i) => {
    const log = weekLogs.find(l => l.date === ds);
    return {
      label: new Date(ds + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'narrow' }),
      mins: log ? log.duration : 0,
      quality: log ? log.quality : 0,
      hasData: !!log
    };
  });

  const maxMins = Math.max(...dayData.map(d => d.mins), 480);

  const pad = { top: 10, bottom: 20, left: 5, right: 5 };
  const chartW = w - pad.left - pad.right;
  const chartH = h - pad.top - pad.bottom;

  // Grid lines
  ctx.strokeStyle = gridColor;
  ctx.lineWidth = 1;
  ctx.setLineDash([2, 4]);
  for (let i = 0; i <= 3; i++) {
    const y = pad.top + (chartH / 3) * i;
    ctx.beginPath();
    ctx.moveTo(pad.left, y);
    ctx.lineTo(w - pad.right, y);
    ctx.stroke();
  }
  ctx.setLineDash([]);

  // Bars
  const barW = Math.min(24, chartW / days.length * 0.55);
  const gap = chartW / days.length;

  for (let i = 0; i < dayData.length; i++) {
    const d = dayData[i];
    if (!d.hasData) continue;
    const x = pad.left + gap * i + (gap - barW) / 2;
    const barH = (d.mins / maxMins) * chartH;
    const y = pad.top + chartH - barH;

    // Bar with rounded top
    ctx.beginPath();
    ctx.roundRect(x, y, barW, barH, [2, 2, 0, 0]);
    ctx.fillStyle = accentColor;
    ctx.globalAlpha = 0.4 + (d.quality / 5) * 0.6;
    ctx.fill();
    ctx.globalAlpha = 1;

    // Label
    ctx.fillStyle = textColor;
    ctx.font = chartFont(9);
    ctx.textAlign = 'center';
    ctx.fillText(d.label, x + barW / 2, h - pad.bottom + 12);
  }

  // 8-hour reference line
  const refY = pad.top + chartH - (480 / maxMins) * chartH;
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
  ctx.lineWidth = 1;
  ctx.setLineDash([3, 3]);
  ctx.beginPath();
  ctx.moveTo(pad.left, refY);
  ctx.lineTo(w - pad.right, refY);
  ctx.stroke();
  ctx.setLineDash([]);

  // "8h" label
  ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
  ctx.font = chartFont(8);
  ctx.textAlign = 'left';
  ctx.fillText('8h', w - pad.right - 14, refY - 2);
}

// Add roundRect polyfill for canvas
if (!CanvasRenderingContext2D.prototype.roundRect) {
  CanvasRenderingContext2D.prototype.roundRect = function(x, y, w, h, radii) {
    const r = Array.isArray(radii) ? radii : [radii, radii, radii, radii];
    const [tl, tr, br, bl] = r.map(v => Math.min(v || 0, Math.min(w, h) / 2));
    this.moveTo(x + tl, y);
    this.lineTo(x + w - tr, y);
    this.quadraticCurveTo(x + w, y, x + w, y + tr);
    this.lineTo(x + w, y + h - br);
    this.quadraticCurveTo(x + w, y + h, x + w - br, y + h);
    this.lineTo(x + bl, y + h);
    this.quadraticCurveTo(x, y + h, x, y + h - bl);
    this.lineTo(x, y + tl);
    this.quadraticCurveTo(x, y, x + tl, y);
    this.closePath();
  };
}

// ─── MAIN RENDER ───────────────────────────────────────────
function renderAnalytics() {
  const tasks = getFilteredTasks();
  renderSummary(tasks);
  renderCompletion(tasks);
  renderStreak(tasks);
  renderTrendChart(state.tasks.filter(t => !isWhiteboardTask(t)));
  renderTable(tasks);
  renderSleepAnalytics();

  const labelEl = document.getElementById('detailPeriodLabel');
  if (labelEl) {
    const map = { week: 'This Week', month: 'This Month', all: 'All Time' };
    labelEl.textContent = map[currentPeriod] || 'All Time';
  }
  const periodLine = document.getElementById('completionPeriod');
  if (periodLine) {
    const map = { week: 'this week', month: 'this month', all: 'all time' };
    periodLine.textContent = map[currentPeriod] || 'all time';
  }
}

