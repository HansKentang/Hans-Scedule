import re

path = r'C:\Users\ASUS\AI Apps\Hans Scedule\shared.js'

with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add currentView and currentMonthDate to state object
old1 = '  currentUserId: null,'
new1 = """  currentView: 'week',
  currentMonthDate: null,
  currentUserId: null,"""
content = content.replace(old1, new1, 1)

# 2. Add new fields to saveState() settings
old2 = '      accentRemovedPresets: state.accentRemovedPresets\n    }));'
new2 = """      accentRemovedPresets: state.accentRemovedPresets,
      currentView: state.currentView || 'week',
      currentWeekStart: state.currentWeekStart ? formatDate(state.currentWeekStart) : null,
      currentMonthDate: state.currentMonthDate ? formatDate(state.currentMonthDate) : null
    }));"""
content = content.replace(old2, new2, 1)

# 3. Restore fields in loadState()
old3 = '      state.accentRemovedPresets = s.accentRemovedPresets || [];\n      // Images are restored via haven-image-* keys directly'
new3 = """      state.accentRemovedPresets = s.accentRemovedPresets || [];
      state.currentView = (s.currentView && ['week','month','agenda'].includes(s.currentView)) ? s.currentView : 'week';
      if (s.currentWeekStart) state.currentWeekStart = new Date(s.currentWeekStart + 'T00:00:00');
      if (s.currentMonthDate) state.currentMonthDate = new Date(s.currentMonthDate + 'T00:00:00');
      // Images are restored via haven-image-* keys directly"""
content = content.replace(old3, new3, 1)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print('shared.js changes applied successfully')
