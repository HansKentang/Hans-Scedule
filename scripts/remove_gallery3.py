import re

with open('hub-visuals.js', 'r', encoding='utf-8', newline='') as f:
    content = f.read()

content = content.replace('\r\n', '\n')

# 1. Remove gallery default data (the array definition with 5 items)
content = re.sub(
    r'  gallery: \[\n(?:    \{.*?\},\n){5}  \],\n',
    '',
    content,
    count=1,
    flags=re.DOTALL
)

# 2. Remove gallery init in loadHubContent
content = content.replace(
    "      if (!hc.gallery) hc.gallery = defaults.gallery.map(g => ({...g}));\n",
    ''
)

# 3. Remove renderHubGallery call
content = content.replace(
    "  renderHubGallery();\n",
    ''
)

# 4. Remove the entire renderHubGallery function (brace-counting)
func_start = content.find('function renderHubGallery() {')
if func_start >= 0:
    depth = 0
    i = func_start
    while i < len(content):
        if content[i] == '{':
            depth += 1
        elif content[i] == '}':
            depth -= 1
            if depth == 0:
                i += 1
                while i < len(content) and content[i] in '\n\r ':
                    i += 1
                content = content[:func_start] + content[i:]
                break
        i += 1

# 5. Remove all lines containing renderHubGallery() calls  
content = re.sub(r'\n\s*renderHubGallery\(\);\s*', '\n', content)

# 6. Remove _galleryPopupOpen and related functions
content = re.sub(r'let _galleryPopupOpen = false;\n\n', '', content)
content = re.sub(r'function openGalleryEditPopup\(idx\) \{[^}]*?\}\n\n', '', content, flags=re.DOTALL)

# 7. Remove gallery event handler
content = re.sub(
    r"\n  // Gallery card click handler.*?\n  document\.querySelector\('\.hub-gallery'\)\?\.addEventListener\('click', function\(e\) \{[^}]*?\}\);\n",
    '\n',
    content,
    flags=re.DOTALL
)

# 8. Remove gallery-related code from hubContent references
# Remove references to hubContent.gallery
lines = content.split('\n')
filtered = []
skip_next = False
for i, line in enumerate(lines):
    if skip_next:
        skip_next = False
        continue
    # Skip lines with gallery edits in edit mode
    if 'data-edit-gallery' in line:
        continue
    if '_galleryPopupOpen' in line:
        continue
    if 'hubContent.gallery' in line or 'hc.gallery' in line:
        # Remove entire if block referencing gallery
        if line.strip().startswith('if') and 'gallery' in line:
            # Check if it's a single-line if
            if '{' in line and '}' not in line:
                skip_next = True
            continue
        continue
    filtered.append(line)
content = '\n'.join(filtered)

content = content.replace('\n\n\n', '\n\n')

with open('hub-visuals.js', 'w', encoding='utf-8', newline='') as f:
    f.write(content.replace('\n', '\r\n'))

print('Done')
