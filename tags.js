/* ============================================
   Havën Schedule — Tags Board Page
   Kanban-style columns per tag category
   ============================================ */

const boardInner = document.getElementById('tagsBoardInner');
const tagsTotal = document.getElementById('tagsTotal');

pageAfterTaskSave = () => { renderTags(); };
pageAfterImport = () => { renderTags(); };

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

function renderTags() {
  // Gather stats per tag
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
  const isDark = document.documentElement.classList.contains('dark');

  let html = '';
  let grandTotal = 0;

  for (const tag of TAG_ORDER) {
    const d = tagData[tag];
    const meta = getTagColumnMeta(tag);
    const pct = Math.round((d.totalMinutes / totalAll) * 100);
    const colColor = meta.color;
    const txtColor = meta.textColor;
    const accentColor = cardColors[tag]?.light || DEFAULT_TAG_COLORS[tag].light;
    grandTotal += d.count;

    html += `<div class="tag-column">
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
              ${escapeHtml(t.title)}
            </div>
            <div class="tct-meta">
              <span>${t.startTime}–${t.endTime}</span>
              <span>${t.date}</span>
            </div>
          </div>`;
        }).join('')}
      </div>
    </div>`;
  }

  boardInner.innerHTML = html;
  const heroTotal = document.getElementById('tagsHeroTotal');
  if (tagsTotal) tagsTotal.textContent = `${grandTotal} tasks total`;
  if (heroTotal) heroTotal.textContent = `${grandTotal} tasks total`;
  
  // Fit text to cards
  requestAnimationFrame(() => { fitTextAll('.tag-col-task', 13, 8); });

  // Event listeners
  boardInner.querySelectorAll('.tag-col-task').forEach(el => {
    const taskId = el.dataset.taskId;
    el.addEventListener('click', (e) => {
      if (e.target.closest('[data-toggle-complete]')) return;
      openTaskModal(taskId);
    });
  });

  boardInner.querySelectorAll('[data-toggle-complete]').forEach(el => {
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      const tid = el.dataset.toggleComplete;
      toggleComplete(tid);
      renderTags();
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
}

// ─── SETUP ────────────────────────────────────────────
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
  document.getElementById('bcThemeBtn')?.addEventListener('click', toggleTheme);
  document.getElementById('bcSettingsBtn')?.addEventListener('click', openSettingsDrawer);
  dom.importFileInput?.addEventListener('change', importData);
  document.getElementById('importDataBtn')?.addEventListener('click', () => { if (dom.importFileInput) { dom.importFileInput.value = ''; dom.importFileInput.click(); } });

  dom.aiChatBtn?.addEventListener('click', openSettingsBubble);
  document.getElementById('bcAiChatBtn')?.addEventListener('click', showAIChat);
  dom.aiChatOverlay?.addEventListener('click', hideAIChat);
  dom.aiChatClose?.addEventListener('click', hideAIChat);
  dom.aiChatSend?.addEventListener('click', sendAIMessage);
  dom.aiChatInput?.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendAIMessage(); } });

  // Re-render on theme change
  const observer = new MutationObserver(() => renderTags());
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
}

// ─── INIT ──────────────────────────────────────────────────
function init() {
  loadState();
  applyTheme();
  document.querySelectorAll('img[data-image-id]').forEach(el => { el.src = getImage(el.dataset.imageId) || ''; });
  renderTags();
  setupPage();
  document.getElementById('exportBtn')?.addEventListener('click', exportData);
  document.getElementById('importBtn')?.addEventListener('click', () => { document.getElementById('importFileInput')?.click(); });
  // Update tags summary total
  function updateTagTotal() {
    const el = document.getElementById('tagsSummaryTotal');
    if (el) {
      const count = state.tasks.filter(t => !isWhiteboardTask(t)).length;
      el.textContent = `${count} tasks across all categories`;
    }
  }
  const origSave = pageAfterTaskSave;
  pageAfterTaskSave = () => { if (typeof origSave === 'function') origSave(); updateTagTotal(); };
  updateTagTotal();
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
else init();
