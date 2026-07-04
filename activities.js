/* ============================================
   Haven Schedule — Activities Page
   Kanban Board + Timeline + Activity Log
   ============================================ */

// --- VIEW STATE -------------------------------------------------------------
let activitiesView = 'board'; // 'board' | 'timeline'
let weekOffset = 0; // 0 = current week, -1 = last week, +1 = next week
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

pageAfterTaskSave = () => { renderActivities(); };
pageAfterImport = () => { renderActivities(); };

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

  const totalAll = Object.values(tagData).reduce((s, d) => s + d.totalMinutes, 0) || 1;

  let html = '';
  let grandTotal = 0;
  const todayStr = formatDate(new Date());

  for (const tag of TAG_ORDER) {
    const d = tagData[tag];
    const pct = Math.round((d.totalMinutes / totalAll) * 100);
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
      <div class="tag-column-progress">
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
          <input type="color" id="addCatColor" value="#6366f1">
          <span style="font-size:0.65rem;color:var(--text-tertiary);opacity:0.6">Pick a color</span>
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
    chart.innerHTML = '';
    if (totalEl) totalEl.textContent = 'No tasks this week';
    if (legendEl) legendEl.innerHTML = '';
    return;
  }

  const avgDaily = Math.round(grandTotal / 7);
  const busiestIdx = dayData.reduce((best, d, i) => d.total > dayData[best].total ? i : best, 0);

  let html = '';
  for (let i = 0; i < 7; i++) {
    const dd = dayData[i];
    const d = addDays(weekStart, i);
    const todayCls = dd.isToday ? ' today' : '';
    const isBusiest = i === busiestIdx && dd.total > 0;
    const barHeight = maxDayTotal > 0 ? Math.max((dd.total / maxDayTotal) * 100, 8) : 8;
    const dayNum = d.getDate();

    html += `<div class="act-chart-bar-col${todayCls}">`;
    html += `<span class="act-chart-bar-val">${dd.total > 0 ? formatDuration(dd.total) : '—'}</span>`;

    if (dd.total > 0) {
      html += `<div class="act-chart-bar${isBusiest ? ' busiest' : ''}" style="height:${barHeight}%" title="${dayLabels[i]}: ${formatDuration(dd.total)}">`;
      const sortedTags = [...tags].filter(tag => dd.tagMins[tag] > 0);
      sortedTags.sort((a, b) => dd.tagMins[b] - dd.tagMins[a]);
      for (const tag of sortedTags) {
        const pct = (dd.tagMins[tag] / dd.total) * 100;
        html += `<div class="act-chart-bar-segment" data-tag="${tag}" style="height:${pct}%" title="${TAG_LABELS[tag]}: ${formatDuration(dd.tagMins[tag])}"></div>`;
      }
      html += `</div>`;
    } else {
      html += `<div class="act-chart-bar-empty" style="height:${barHeight}%"></div>`;
    }

    html += `<span class="act-chart-bar-label">${dayLabels[i]} <small>${dayNum}</small></span>`;
    html += `</div>`;
  }
  chart.innerHTML = html;

  if (totalEl) totalEl.textContent = `${formatDuration(grandTotal)} total · avg ${formatDuration(avgDaily)}/day`;

  let legendHtml = '';
  for (const tag of tags) {
    const hasAny = dayData.some(dd => dd.tagMins[tag] > 0);
    if (!hasAny) continue;
    legendHtml += `<span class="act-chart-legend-item">
      <span class="act-chart-legend-dot" data-tag="${tag}"></span>
      ${TAG_LABELS[tag]}
    </span>`;
  }
  if (legendEl) legendEl.innerHTML = legendHtml;
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
  const observer = new MutationObserver(() => { renderActivities(); });
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
}

// --- INIT ------------------------------------------------------------------
function init() {
  loadState();
  if (!hasSeenTutorial('activities') && typeof startTutorial === "function") {
    try { setTimeout(function() { startTutorial(ACTIVITIES_TUTORIAL_STEPS); }, 300); } catch(e) {}
  }
  applyTheme();
  loadCompletionLog();
  document.querySelectorAll('img[data-image-id]').forEach(el => { el.src = getImage(el.dataset.imageId) || ''; });
  weekOffset = 0;
  renderActivities();
  setupPage();
  document.getElementById('exportBtn')?.addEventListener('click', exportData);
  document.getElementById('importBtn')?.addEventListener('click', () => { document.getElementById('importFileInput')?.click(); });
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
else init();
