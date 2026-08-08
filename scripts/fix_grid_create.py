import sys

with open('schedule.js', 'r', encoding='utf-8') as f:
    content = f.read()

changes = 0

# 1. Remove month view click handler
old1 = '  // Attach click handlers\n  dom.grid.querySelectorAll(\'.month-cell:not(.month-cell-empty)\').forEach(cell => {\n    cell.addEventListener(\'click\', (e) => {\n      if (isTouchEvent(e)) return;\n      const date = cell.dataset.date;\n      const mins = 9 * 60;\n      instantCreateTask(date, mins);\n    });\n    cell.addEventListener(\'dblclick\', () => {'
new1 = '  // Attach click handlers (dblclick navigates to week view)\n  dom.grid.querySelectorAll(\'.month-cell:not(.month-cell-empty)\').forEach(cell => {\n    cell.addEventListener(\'dblclick\', () => {'
if old1 in content:
    content = content.replace(old1, new1, 1)
    changes += 1
    print('1. Month view click handler removed')
else:
    print('1. FAILED: month view click handler not found')

# 2. Remove week view slot handlers from attachSlotHandlersWithCreate
old2 = '// Unified slot handler: click-to-create + drag-to-create + TZ tooltip\nfunction attachSlotHandlersWithCreate() {\n  $$(\'.hour-slot\').forEach(slot => {\n    slot.addEventListener(\'mousedown\', (e) => {\n      if (e.button !== 0) return;\n      if (e.target.closest(\'.calendar-task\')) return;\n      const date = slot.dataset.date;\n      const base = parseInt(slot.dataset.time);\n      const slotRect = slot.getBoundingClientRect();\n      const pct = (e.clientY - slotRect.top) / slotRect.height;\n      const precise = base + pct * 60;\n      const snap = roundToNearest(precise, SNAP_MINUTES);\n      startDragCreate(e, date, snap);\n    });\n    slot.addEventListener(\'touchstart\', (e) => {\n      if (e.target.closest(\'.calendar-task\')) return;\n      const date = slot.dataset.date;\n      const base = parseInt(slot.dataset.time);\n      const slotRect = slot.getBoundingClientRect();\n      const pos = getEventPos(e);\n      const pct = (pos.y - slotRect.top) / slotRect.height;\n      const precise = base + pct * 60;\n      const snap = roundToNearest(precise, SNAP_MINUTES);\n      startDragCreate(e, date, snap);\n    }, { passive: false });\n  });\n  // TZ tooltip for time axis'
new2 = '// TZ tooltip for time axis\nfunction attachSlotHandlersWithCreate() {\n  // TZ tooltip for time axis'
if old2 in content:
    content = content.replace(old2, new2, 1)
    changes += 1
    print('2. Slot create handlers removed')
else:
    print('2. FAILED: slot handlers not found')

# 3. Update empty state text
old3 = "  el.innerHTML = '<span>No tasks this week</span><small>Click any slot or use <kbd>Ctrl+K</kbd> to add one</small>';"
new3 = "  el.innerHTML = '<span>No tasks this week</span><small>Press <kbd>Ctrl+K</kbd> or use the + button to add one</small>';"
if old3 in content:
    content = content.replace(old3, new3, 1)
    changes += 1
    print('3. Empty state text updated')
else:
    print('3. FAILED: empty state text not found')

# 4. Rename call site
old4 = '  attachSlotHandlersWithCreate();'
new4 = '  attachTimeAxisTooltips();'
if old4 in content:
    content = content.replace(old4, new4, 1)
    changes += 1
    print('4. Call site renamed')
else:
    print('4. FAILED: call site not found')

# 5. Rename function definition
old5 = 'function attachSlotHandlersWithCreate() {'
new5 = 'function attachTimeAxisTooltips() {'
if old5 in content:
    content = content.replace(old5, new5, 1)
    changes += 1
    print('5. Function definition renamed')
else:
    print('5. FAILED: function definition not found')

# 6. Remove dead code section: DRAG TO CREATE
old6 = "// ─── DRAG TO CREATE ──────────────────────────────────────"
idx_start = content.find(old6)
if idx_start >= 0:
    idx_end = content.find("// Unified slot handler:", idx_start)
    if idx_end < 0:
        idx_end = content.find("function onDragEnd()", idx_start)
    if idx_end < 0:
        print('6. FAILED: cannot find end of drag-create section')
    else:
        content = content[:idx_start] + content[idx_end:]
        changes += 1
        print('6. Dead drag-create functions removed')
else:
    print('6. FAILED: drag-create section not found')

# 7. Remove instantCreateTask function
old7 = "// Instant create — click any empty slot to create a 1-hour task right away"
idx_start7 = content.find(old7)
if idx_start7 >= 0:
    idx_end7 = content.find("const QUICK_ADD_TITLES", idx_start7)
    if idx_end7 >= 0:
        content = content[:idx_start7] + content[idx_end7:]
        changes += 1
        print('7. instantCreateTask removed')
    else:
        print('7. FAILED: cannot find end of instantCreateTask')
else:
    print('7. FAILED: instantCreateTask not found')

with open('schedule.js', 'w', encoding='utf-8') as f:
    f.write(content)

print(f'\nDone! {changes} changes applied.')
