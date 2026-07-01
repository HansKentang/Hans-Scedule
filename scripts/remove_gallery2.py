import re

with open('hub-visuals.js', 'r', encoding='utf-8', newline='') as f:
    content = f.read()

# Normalize line endings to \n
content = content.replace('\r\n', '\n')

# 1. Remove gallery from HUB_DEFAULTS
# Match: "  gallery: [" line, 5 entries, "  ]," line
content = re.sub(
    r'\n  gallery: \[\n(?:    \{.*?\},\n){5}  \],',
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

# 3. Remove renderHubGallery call from applyHubEditMode  
content = content.replace(
    "  renderHubGallery();\n",
    ''
)

# 4. Remove the entire renderHubGallery function
# Find function start and count braces to find proper end
func_start = content.find('function renderHubGallery() {')
if func_start >= 0:
    # Find the end by counting braces
    brace_count = 0
    i = func_start
    while i < len(content):
        if content[i] == '{':
            brace_count += 1
        elif content[i] == '}':
            brace_count -= 1
            if brace_count == 0:
                # Include the newline after the closing brace
                end = i + 1
                if end < len(content) and content[end] == '\n':
                    end += 1
                content = content[:func_start] + content[end:]
                break
        i += 1

# 5. Remove remaining standalone renderHubGallery() calls
content = re.sub(r'\n\s*renderHubGallery\(\);\s*\n', '\n', content)

# Convert back to \r\n
content = content.replace('\n', '\r\n')

with open('hub-visuals.js', 'w', encoding='utf-8', newline='') as f:
    f.write(content)

print('Done - gallery references removed from hub-visuals.js')
