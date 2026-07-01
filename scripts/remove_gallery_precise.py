"""Precisely remove all gallery cards code from hub-visuals.js, style.css, and shared.js."""

import os, re

os.chdir(r'C:\Users\ASUS\AI Apps\Hans Scedule')

def process_js():
    with open('hub-visuals.js', 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    original_count = len(lines)
    result = []
    skip = False
    skip_depth = 0
    i = 0
    
    while i < len(lines):
        line = lines[i]
        stripped = line.strip()
        
        # Detect start of gallery array in HUB_DEFAULTS
        if stripped == 'gallery: [' and not skip:
            # Skip this line and the 5 items + closing bracket
            i += 7  # gallery: [ + 5 items + ],
            continue
        
        # Detect gallery init in loadHubContent
        if "if (!hc.gallery) hc.gallery = defaults.gallery.map(g => ({...g}));" in stripped:
            i += 1
            continue
        
        # Detect renderHubGallery() calls
        if stripped == 'renderHubGallery();':
            i += 1
            continue
        
        # Detect renderHubGallery function definition
        if stripped == 'function renderHubGallery() {' and not skip:
            skip = True
            skip_depth = 1
            i += 1
            continue
        
        if skip:
            if '{' in stripped:
                skip_depth += stripped.count('{')
            if '}' in stripped:
                skip_depth -= stripped.count('}')
                if skip_depth <= 0:
                    skip = False
                    i += 1
                    continue
        
        # Detect gallery section comment + popup functions
        if stripped.startswith('/* ─── Gallery ──'):
            # We need to skip the _galleryPopupOpen variable and openGalleryEditPopup function
            i += 1
            # Skip _galleryPopupOpen line
            if i < len(lines) and '_galleryPopupOpen' in lines[i]:
                i += 1
            # Skip blank line
            if i < len(lines) and lines[i].strip() == '':
                i += 1
            # Skip function definition and body
            if i < len(lines) and lines[i].strip().startswith('function openGalleryEditPopup'):
                skip = True
                skip_depth = 0
                # Count braces in this line
                skip_depth += lines[i].count('{') - lines[i].count('}')
                i += 1
                while i < len(lines) and skip_depth > 0:
                    skip_depth += lines[i].count('{') - lines[i].count('}')
                    i += 1
                skip = False
            continue
        
        # Detect gallery event listeners
        if "document.querySelector('.hub-gallery')" in stripped:
            # Skip this line and the handler function
            skip = True
            skip_depth = 0
            skip_depth += line.count('{') - line.count('}')
            i += 1
            while i < len(lines) and skip_depth > 0:
                skip_depth += lines[i].count('{') - lines[i].count('}')
                i += 1
            skip = False
            continue
        
        result.append(line)
        i += 1
    
    with open('hub-visuals.js', 'w', encoding='utf-8', newline='\r\n') as f:
        f.writelines(result)
    
    print(f"hub-visuals.js: {original_count} lines -> {len(result)} lines")

def process_css():
    with open('style.css', 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    original_count = len(lines)
    result = []
    skip = False
    skip_depth = 0
    i = 0
    
    while i < len(lines):
        line = lines[i]
        stripped = line.strip()
        
        # Check if line contains .hub-gallery
        if '.hub-gallery' in stripped.lower():
            # If it starts a block, skip until closing brace
            if '{' in stripped and '}' not in stripped:
                skip = True
                skip_depth = 1
                i += 1
                while i < len(lines) and skip_depth > 0:
                    skip_depth += lines[i].count('{') - lines[i].count('}')
                    i += 1
                skip = False
                continue
            else:
                i += 1
                continue
        
        if skip:
            skip_depth += line.count('{') - line.count('}')
            i += 1
            if skip_depth <= 0:
                skip = False
            continue
        
        result.append(line)
        i += 1
    
    with open('style.css', 'w', encoding='utf-8', newline='\r\n') as f:
        f.writelines(result)
    
    print(f"style.css: {original_count} lines -> {len(result)} lines")

def process_shared():
    with open('shared.js', 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Remove .hub-gallery-card from selector
    content = content.replace("'.hub-snav-item, .hub-gallery-card'", "'.hub-snav-item'")
    
    # Remove gallery i18n keys: hub.galleryTasks, hub.galleryTotal, hub.galleryCategories, hub.galleryGoals, hub.galleryOpen, hub.galleryView
    # Pattern in English
    content = re.sub(r"'hub\.galleryTasks':'[^']*','hub\.galleryTotal':'[^']*','hub\.galleryCategories':'[^']*','hub\.galleryGoals':'[^']*','hub\.galleryOpen':'[^']*','hub\.galleryView':'[^']*',", '', content)
    
    # Also remove the comment
    content = content.replace('// Intercept sidebar nav + gallery card clicks for fade-out', '// Intercept sidebar nav clicks for fade-out')
    
    with open('shared.js', 'w', encoding='utf-8', newline='\r\n') as f:
        f.write(content)
    
    print(f"shared.js: processed")

if __name__ == '__main__':
    process_js()
    process_css()
    process_shared()
    print("Done!")
