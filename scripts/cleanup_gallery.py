"""Remove remaining gallery code from hub-visuals.js and style.css."""

import re

def clean_js():
    with open('hub-visuals.js', 'r', encoding='utf-8') as f:
        text = f.read()
    
    original_len = len(text)
    
    # 1. Remove empty 'gallery:' from HUB_DEFAULTS (the array was removed, leaving just the key)
    # Look for pattern: gallery:\n  bentoLayout:
    text = re.sub(r'  gallery: \[\],\n  bentoLayout:', '  bentoLayout:', text)
    # Also try without trailing comma if the array items were removed
    text = re.sub(r'  gallery: \[\],\n', '', text)
    
    # 2. Remove the gallery popup section: from /* Gallery */ marker through the function
    # Find the entire openGalleryEditPopup function and _galleryPopupOpen variable
    pattern = r"/\* ─── Gallery ──────────────────────────────── \*/\n\nfunction openGalleryEditPopup[^;]*;\n\n"
    match = re.search(pattern, text)
    if match:
        text = text[:match.start()] + text[match.end():]
    else:
        # Try different pattern
        pattern2 = r"/\* ─── Gallery ──────────────────────────────── \*/let _galleryPopupOpen = false;\n\nfunction openGalleryEditPopup\([^)]+\) \{[^}]*\}[^}]*\}[^}]*\}[^}]*\}[^}]*\}[^}]*\}[^}]*\}[^}]*\}"
        match2 = re.search(pattern2, text, re.DOTALL)
        if match2:
            text = text[:match2.start()] + text[match2.end():]
    
    # 3. Remove event listener on .hub-gallery
    # Find: document.querySelector('.hub-gallery')?.addEventListener('click', ... )
    pattern3 = r"  document\.querySelector\('\.hub-gallery'\)\?\.addEventListener\('click', function\(e\) \{[^}]*\}(?:[^}]*\})*[^}]*\}[^}]*\})"
    match3 = re.search(pattern3, text, re.DOTALL)
    if match3:
        text = text[:match3.start()] + text[match3.end():]
    
    # 4. Remove the helper function: _renderHubGalleryCards or similar
    # Search for any remaining gallery-related functions
    text = re.sub(r'\nfunction openGalleryEditPopup\([^)]*\) \{[^}]*\}[^}]*\}[^}]*\}[^}]*\}[^}]*\}[^}]*\}', '', text, flags=re.DOTALL)
    
    # 5. Clean up any empty lines or orphaned markers
    text = re.sub(r'\n{3,}', '\n\n', text)
    
    with open('hub-visuals.js', 'w', encoding='utf-8', newline='\r\n') as f:
        f.write(text)
    
    print(f"hub-visuals.js: {original_len} -> {len(text)} chars")

def clean_css():
    with open('style.css', 'r', encoding='utf-8') as f:
        text = f.read()
    
    original_len = len(text)
    
    # Remove ALL lines containing .hub-gallery (including in media queries)
    lines = text.split('\n')
    filtered = []
    skip_block = False
    brace_depth = 0
    
    for line in lines:
        stripped = line.strip()
        
        # If we encounter a .hub-gallery rule start
        if '.hub-gallery' in line.lower() and '{' in stripped and stripped.endswith('{'):
            skip_block = True
            brace_depth = 1
            continue
        
        if skip_block:
            if '{' in stripped:
                brace_depth += stripped.count('{')
            if '}' in stripped:
                brace_depth -= stripped.count('}')
            if brace_depth <= 0:
                skip_block = False
            continue
        
        # Also remove single-line gallery rules
        if '.hub-gallery' in line.lower():
            continue
        
        filtered.append(line)
    
    text = '\n'.join(filtered)
    
    with open('style.css', 'w', encoding='utf-8', newline='\r\n') as f:
        f.write(text)
    
    print(f"style.css: {original_len} -> {len(text)} chars")

if __name__ == '__main__':
    import os
    os.chdir(r'C:\Users\ASUS\AI Apps\Hans Scedule')
    clean_js()
    clean_css()
    print("Done!")
