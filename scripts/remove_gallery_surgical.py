"""Surgically remove gallery cards code from hub-visuals.js, style.css, and shared.js."""

import re

def remove_gallery_js():
    with open('hub-visuals.js', 'r', encoding='utf-8') as f:
        text = f.read()
    
    original_len = len(text)
    changes = []
    
    # 1. Remove gallery: [...] from HUB_DEFAULTS
    pattern = r"  gallery: \[\n(?:    \{ [^}]+\},\n){5}  \],\n"
    match = re.search(pattern, text)
    if match:
        text = text[:match.start()] + text[match.end():]
        changes.append(f"Removed gallery array from HUB_DEFAULTS ({len(match.group())} chars)")
    
    # 2. Remove gallery init in loadHubContent
    old = '      if (!hc.gallery) hc.gallery = defaults.gallery.map(g => ({...g}));\n      '
    if old in text:
        text = text.replace(old, '', 1)
        changes.append("Removed gallery init in loadHubContent")
    
    # 3. Remove renderHubGallery() calls
    for call in ['\n  renderHubGallery();', '\n    renderHubGallery();']:
        count = text.count(call)
        if count > 0:
            text = text.replace(call, '', count)
            changes.append(f"Removed {count}x 'renderHubGallery()' call")
    
    # 4. Remove renderHubGallery function definition
    func_start_pattern = r"\nfunction renderHubGallery\(\) \{\n"
    func_start_match = re.search(func_start_pattern, text)
    if func_start_match:
        start = func_start_match.start()
        # Find the matching closing brace by counting braces
        brace_count = 0
        i = start
        while i < len(text):
            if text[i] == '{':
                brace_count += 1
            elif text[i] == '}':
                brace_count -= 1
                if brace_count == 0:
                    # Include the trailing newlines after the function
                    end = i + 1
                    while end < len(text) and text[end] in '\n\r':
                        end += 1
                    text = text[:start] + text[end:]
                    changes.append(f"Removed renderHubGallery() function ({end - start} chars)")
                    break
            i += 1
    
    # 5. Remove gallery popup functions: openGalleryEditPopup, and _galleryPopupOpen variable
    patterns_to_remove = [
        r"\nlet _galleryPopupOpen = false;.*?(?=\nfunction|\nlet |\nconst |\nvar |\n/\\*)",
    ]
    for pattern in patterns_to_remove:
        match = re.search(pattern, text, re.DOTALL)
        if match:
            text = text[:match.start()] + text[match.end():]
            changes.append(f"Removed gallery popup variable/marker")
    
    # 6. Look for openGalleryEditPopup function
    func_pattern = r"\nfunction openGalleryEditPopup\([^)]+\) \{[^}]*\}[^}]*\}[^}]*\}[^}]*\}[^}]*\}[^}]*\}[^}]*\}"
    match = re.search(func_pattern, text, re.DOTALL)
    if match:
        text = text[:match.start()] + text[match.end():]
        changes.append("Removed openGalleryEditPopup function")
    
    # 7. Remove any remaining gallery-related event listeners (search for data-edit-gallery)
    text = re.sub(r'\n\s+// Gallery card edit popup[^;]*;', '', text)
    text = re.sub(r'\n\s+// Open gallery edit popup[^;]*;', '', text)
    
    with open('hub-visuals.js', 'w', encoding='utf-8', newline='\r\n') as f:
        f.write(text)
    
    print(f"hub-visuals.js: {original_len} -> {len(text)} chars")
    for c in changes:
        print(f"  {c}")

def remove_gallery_css():
    with open('style.css', 'r', encoding='utf-8') as f:
        text = f.read()
    
    original_len = len(text)
    
    # Remove all lines containing .hub-gallery
    lines = text.split('\n')
    filtered_lines = []
    removed = 0
    skip_until_brace = False
    for line in lines:
        if skip_until_brace:
            filtered_lines.append(line)
            if '}' in line and not line.strip().startswith('.'):
                # Check if this closes a gallery rule
                pass
            continue
        
        if '.hub-gallery' in line.lower():
            removed += 1
            # If it starts a rule block, skip until closing brace
            if '{' in line and '}' not in line:
                skip_until_brace = True
            continue
        
        if skip_until_brace and '}' in line:
            skip_until_brace = False
            continue
        
        filtered_lines.append(line)
    
    text = '\n'.join(filtered_lines)
    
    with open('style.css', 'w', encoding='utf-8', newline='\r\n') as f:
        f.write(text)
    
    print(f"style.css: {original_len} -> {len(text)} chars, removed {removed} gallery lines")

def remove_gallery_shared():
    with open('shared.js', 'r', encoding='utf-8') as f:
        text = f.read()
    
    original_len = len(text)
    
    # Remove .hub-gallery-card from the selector
    old = "'.hub-snav-item, .hub-gallery-card'"
    new = "'.hub-snav-item'"
    if old in text:
        text = text.replace(old, new, 1)
        print("Removed .hub-gallery-card from selector")
    
    # Remove gallery i18n keys from all 3 languages
    # Pattern: 'hub.galleryTasks':'...','hub.galleryTotal':'...','hub.galleryCategories':'...','hub.galleryGoals':'...','hub.galleryOpen':'...','hub.galleryView':'...',
    gallery_i18n_pattern = r"'hub\.galleryTasks':'[^']*','hub\.galleryTotal':'[^']*','hub\.galleryCategories':'[^']*','hub\.galleryGoals':'[^']*','hub\.galleryOpen':'[^']*','hub\.galleryView':'[^']*',"
    count = len(re.findall(gallery_i18n_pattern, text))
    if count > 0:
        text = re.sub(gallery_i18n_pattern, '', text)
        print(f"Removed {count} gallery i18n key groups")
    
    with open('shared.js', 'w', encoding='utf-8', newline='\r\n') as f:
        f.write(text)
    
    print(f"shared.js: {original_len} -> {len(text)} chars")


if __name__ == '__main__':
    import os
    os.chdir(r'C:\Users\ASUS\AI Apps\Hans Scedule')
    remove_gallery_js()
    remove_gallery_css()
    remove_gallery_shared()
    print("\nDone!")
