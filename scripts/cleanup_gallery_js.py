"""Remove the remaining gallery data, popup code, and event listener from hub-visuals.js."""

import re

with open('hub-visuals.js', 'r', encoding='utf-8') as f:
    text = f.read()

# 1. Remove gallery data array from HUB_DEFAULTS
# Pattern: the "gallery: [" line through "  ],"
old = """  notes: '',
  links: [{ label: 'GitHub', url: 'https://github.com' }, { label: 'Reddit', url: 'https://reddit.com' }],
  gallery: [
    { label: 'Schedule', desc: 'Time-blocking grid with drag & drop, AI command palette, and week/month/agenda views.', href: 'schedule.html', icon: 'calendar', color: 'var(--tag-deep-work-text)', bg: 'var(--tag-deep-work-bg)' },
    { label: 'Activities', desc: 'Chronological feed grouped by day with tag and date filters.', href: 'activities.html', icon: 'checklist', color: 'var(--tag-meeting-text)', bg: 'var(--tag-meeting-bg)' },
    { label: 'Activities + Board', desc: 'Timeline and Kanban board merged into one page with a view toggle.', href: 'activities.html', icon: 'tag', color: 'var(--tag-study-text)', bg: 'var(--tag-study-bg)' },
    { label: 'Analytics', desc: 'Charts with category distribution, daily breakdowns, and day-by-day metrics.', href: 'analytics.html', icon: 'chart', color: 'var(--tag-hobby-text)', bg: 'var(--tag-hobby-bg)' },
    { label: 'Goals', desc: 'Track goals with progress bars, sub-tasks, and vision board.', href: 'goals.html', icon: 'star', color: 'var(--tag-deep-work-text)', bg: 'var(--tag-deep-work-bg)' }
  ],
  bentoLayout:"""
new = """  notes: '',
  links: [{ label: 'GitHub', url: 'https://github.com' }, { label: 'Reddit', url: 'https://reddit.com' }],
  bentoLayout:"""

if old in text:
    text = text.replace(old, new, 1)
    print("1. Removed gallery data array from HUB_DEFAULTS")
else:
    print("1. WARNING: Could not find gallery data array pattern")

# 2. Remove showGalleryPopup function and _galleryPopupOpen variable
# Remove from "// Gallery card images" comment through end of showGalleryPopup function
# Let's find and remove showGalleryPopup function
pattern = r"function showGalleryPopup\([^)]+\) \{[^}]*\}[^}]*\}[^}]*\}[^}]*\}[^}]*\}[^}]*\}[^}]*\}[^}]*\}[^}]*\}[^}]*\}[^}]*\}"
match = re.search(pattern, text, re.DOTALL)
if match:
    text = text[:match.start()] + text[match.end():]
    print("2. Removed showGalleryPopup function")
else:
    # Try a simpler match
    parts = text.split('function showGalleryPopup(')
    if len(parts) > 1:
        # Find the end of the function by counting braces
        rest = 'function showGalleryPopup(' + parts[1]
        brace_count = 0
        end_idx = 0
        for i, ch in enumerate(rest):
            if ch == '{': brace_count += 1
            elif ch == '}':
                brace_count -= 1
                if brace_count == 0:
                    end_idx = i + 1
                    break
        text = parts[0] + rest[end_idx:]
        print("2. Removed showGalleryPopup function (fallback)")
    else:
        print("2. No showGalleryPopup function found")

# 3. Remove .hub-gallery-cover event listener
pattern2 = r"    var cover = e\.target\.closest\('.hub-gallery-cover'\)[^;]*;"
text = re.sub(pattern2, '', text)
print("3. Cleaned gallery-cover event listener")

# 4. Remove any remaining references to _galleryPopupOpen
text = re.sub(r'\n\s*let _galleryPopupOpen = false;', '', text)
text = re.sub(r'\n\s*if \(!_galleryPopupOpen\) [^;]*;', '', text)
text = re.sub(r'\n\s*_galleryPopupOpen = (true|false);', '', text)

# 5. Remove any gallery related comment blocks
text = re.sub(r"// Gallery card images.*", '', text)

# Clean up multiple blank lines
text = re.sub(r'\n{3,}', '\n\n', text)

with open('hub-visuals.js', 'w', encoding='utf-8', newline='\r\n') as f:
    f.write(text)

# Count remaining gallery references
count = text.lower().count('gallery')
print(f"\nRemaining 'gallery' references: {count}")
if count > 0:
    for i, line in enumerate(text.split('\n')):
        if 'gallery' in line.lower():
            print(f"  Leftover line {i+1}: {line.strip()[:100]}")
