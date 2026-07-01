import re

with open('hub-visuals.js', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Remove gallery from HUB_DEFAULTS (lines with gallery: [ ... ])
content = re.sub(
    r'\n  gallery: \[\n(?:    \{.*?\},\n){5}  \],\n',
    '\n',
    content
)

# 2. Remove gallery init in loadHubContent
content = content.replace(
    "if (!hc.gallery) hc.gallery = defaults.gallery.map(g => ({...g}));\n      ",
    ''
)

# 3. Remove renderHubGallery call from applyHubEditMode
content = content.replace(
    "renderHubBento();\n  renderHubGallery();\n  applyHubVisibility();",
    'renderHubBento();\n  applyHubVisibility();'
)

# 4. Remove renderHubGallery() function definition and all its calls
# First, remove the function itself (starts with "function renderHubGallery() {" and ends with "}\n\n")
content = re.sub(
    r'function renderHubGallery\(\) \{[^}]*?\}\n\n',
    '',
    content,
    flags=re.DOTALL
)

# 5. Remove remaining renderHubGallery() calls (on their own lines)
content = re.sub(r'\n\s*renderHubGallery\(\);\s*\n', '\n\n', content)

with open('hub-visuals.js', 'w', encoding='utf-8') as f:
    f.write(content)

print('Done - gallery references removed from hub-visuals.js')
