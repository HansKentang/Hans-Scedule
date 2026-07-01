"""Remove remaining gallery popup code from hub-visuals.js."""

import os

os.chdir(r'C:\Users\ASUS\AI Apps\Hans Scedule')

with open('hub-visuals.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

original_count = len(lines)
result = []
i = 0

while i < len(lines):
    line = lines[i]
    stripped = line.strip()
    
    # Remove _galleryPopupOpen variable declaration
    if stripped.startswith('let _galleryPopupOpen = false;'):
        i += 1
        continue
    
    # Remove openGalleryEditPopup function
    if stripped.startswith('function openGalleryEditPopup('):
        # Skip the function and its body
        i += 1
        depth = 1  # we already passed the opening brace line
        while i < len(lines) and depth > 0:
            depth += lines[i].count('{') - lines[i].count('}')
            i += 1
        continue
    
    # Remove references to _galleryPopupOpen and hubContent.gallery
    if '_galleryPopupOpen' in stripped or "hubContent.gallery" in stripped:
        # Need to check if it's a multi-line statement
        if stripped.endswith('{') or stripped.endswith('=>'):
            # Skip until the statement ends
            i += 1
            depth = 0
            while i < len(lines):
                depth += lines[i].count('{') - lines[i].count('}')
                i += 1
                if ';' in lines[i-1] and depth <= 0:
                    break
            continue
        if stripped.endswith(','):
            i += 1
            while i < len(lines) and lines[i].strip().endswith(','):
                i += 1
            continue
        i += 1
        continue
    
    # Remove event listener on .hub-gallery-cover
    if '.hub-gallery-cover' in stripped:
        i += 1
        continue
    
    result.append(line)
    i += 1

# Remove consecutive blank lines
final = []
blank_count = 0
for line in result:
    if line.strip() == '':
        blank_count += 1
        if blank_count <= 2:
            final.append(line)
    else:
        blank_count = 0
        final.append(line)

with open('hub-visuals.js', 'w', encoding='utf-8', newline='\r\n') as f:
    f.writelines(final)

print(f"hub-visuals.js: {original_count} lines -> {len(final)} lines")

# Verify no gallery references remain
with open('hub-visuals.js', 'r', encoding='utf-8') as f:
    content = f.read()

count = content.lower().count('gallery')
print(f"Remaining 'gallery' references: {count}")
if count > 0:
    for i, line in enumerate(content.split('\n')):
        if 'gallery' in line.lower():
            print(f"  Line {i+1}: {line.strip()[:100]}")
