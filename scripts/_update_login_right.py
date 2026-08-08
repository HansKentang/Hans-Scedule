import sys
sys.stdout.reconfigure(encoding='utf-8', errors='replace')

with open('login.html', 'r', encoding='utf-8') as f:
    content = f.read()

changes = []

# 1. Dark background
old = 'background: #fafafa;'
if old in content:
    content = content.replace(old, 'background: var(--bg);')
    changes.append('1. Dark bg')
else:
    # Try to find it without checking partial
    pass

# 2. Update gradients
content = content.replace('rgba(0,0,0,0.025)', 'rgba(255,255,255,0.025)')
content = content.replace('rgba(0,0,0,0.015)', 'rgba(255,255,255,0.015)')
changes.append('2. Gradients')

# 3. Carousel glass frame + perspective
old_c = '.auth-carousel {\n      position: relative;\n      z-index: 1;\n      width: 82%;\n      max-width: 480px;\n      overflow: hidden;\n      border-radius: 14px;\n    }'
new_c = '.auth-carousel {\n      position: relative;\n      z-index: 1;\n      width: 90%;\n      max-width: 520px;\n      background: rgba(255,255,255,0.03);\n      backdrop-filter: blur(20px);\n      -webkit-backdrop-filter: blur(20px);\n      border: 1px solid rgba(255,255,255,0.08);\n      border-radius: 16px;\n      padding: 14px 14px 10px;\n      box-shadow: 0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06);\n      perspective: 1000px;\n    }'
if old_c in content:
    content = content.replace(old_c, new_c)
    changes.append('3. Glass frame')
else:
    changes.append('3. FAILED carousel CSS')

# 4. Track preserve-3d
old_t = 'transition: transform 0.65s cubic-bezier(0.22, 1, 0.36, 1);\n      will-change: transform;\n    }'
new_t = 'transition: transform 0.8s cubic-bezier(0.22, 1, 0.36, 1);\n      will-change: transform;\n      transform-style: preserve-3d;\n    }'
if old_t in content:
    content = content.replace(old_t, new_t)
    changes.append('4. Preserve-3d')
else:
    changes.append('4. FAILED track')

# 5. Slide styles
old_s = '.auth-carousel-slide {\n      flex: 0 0 100%;\n      min-width: 0;\n    }\n    .auth-carousel-slide svg {\n      width: 100%; height: auto;\n      display: block;\n      filter: drop-shadow(0 8px 24px rgba(0,0,0,0.06));\n    }'
new_s = '.auth-carousel-slide {\n      flex: 0 0 100%;\n      min-width: 0;\n      transition: transform 0.8s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.5s ease;\n    }\n    .auth-carousel-slide svg {\n      width: 100%; height: auto;\n      display: block;\n      border-radius: 10px;\n      box-shadow: 0 4px 20px rgba(0,0,0,0.3);\n    }'
if old_s in content:
    content = content.replace(old_s, new_s)
    changes.append('5. Slide 3D')
else:
    changes.append('5. FAILED slide')

# 6. Add label strip CSS
label_css = '\n    /* --- Carousel Label Strip --- */\n    .auth-carousel-label {\n      display: flex;\n      align-items: center;\n      justify-content: space-between;\n      padding: 0 2px 8px;\n      border-bottom: 1px solid rgba(255,255,255,0.04);\n      margin-bottom: 8px;\n    }\n    .auth-carousel-label-name {\n      font-size: 0.6rem;\n      font-weight: 600;\n      color: rgba(255,255,255,0.35);\n      letter-spacing: 0.08em;\n      text-transform: uppercase;\n    }\n    .auth-carousel-label-name span {\n      color: rgba(255,255,255,0.15);\n      font-weight: 400;\n    }\n    .auth-carousel-label-index {\n      font-size: 0.55rem;\n      color: rgba(255,255,255,0.12);\n      font-family: var(--font-mono);\n    }'
old_d = '    /* Carousel dots */'
if old_d in content:
    content = content.replace(old_d, label_css + '\n' + old_d)
    changes.append('6. Label CSS')
else:
    changes.append('6. FAILED label CSS')

# 7. Dots - dark bg
content = content.replace('background: rgba(0,0,0,0.12);', 'background: rgba(255,255,255,0.15);')
content = content.replace('background: rgba(0,0,0,0.5);', 'background: rgba(255,255,255,0.6);')
content = content.replace('background: rgba(0,0,0,0.3);', 'background: rgba(255,255,255,0.3);')
changes.append('7. Dot colors')

# 8. Overlay colors
content = content.replace(
    "background: linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.06) 100%);",
    "background: linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.5) 100%);"
)
content = content.replace('color: rgba(0,0,0,0.6);', 'color: rgba(255,255,255,0.5);')
content = content.replace('color: rgba(0,0,0,0.35);', 'color: rgba(255,255,255,0.25);')
content = content.replace('background: rgba(0,0,0,0.4);', 'background: rgba(255,255,255,0.3);')
changes.append('8. Overlay colors')

# 9. Floating badges CSS
fb_css = '\n    /* --- Floating Badges --- */\n    .auth-float-badge {\n      position: absolute;\n      z-index: 5;\n      background: rgba(255,255,255,0.04);\n      backdrop-filter: blur(12px);\n      -webkit-backdrop-filter: blur(12px);\n      border: 1px solid rgba(255,255,255,0.08);\n      border-radius: 8px;\n      padding: 4px 8px;\n      display: flex;\n      align-items: center;\n      gap: 4px;\n      pointer-events: none;\n      opacity: 0;\n      animation: badgeAppear 0.6s cubic-bezier(0.22, 1, 0.36, 1) forwards,\n                 badgeDrift 6s ease-in-out infinite 1s;\n    }\n    @keyframes badgeAppear {\n      0% { opacity: 0; transform: translateY(8px) scale(0.95); }\n      100% { opacity: 1; transform: translateY(0) scale(1); }\n    }\n    @keyframes badgeDrift {\n      0%, 100% { transform: translateY(0); }\n      50% { transform: translateY(-4px); }\n    }\n    .auth-float-badge svg {\n      width: 10px; height: 10px;\n      color: rgba(255,255,255,0.35);\n    }\n    .auth-float-badge span {\n      font-size: 0.5rem;\n      color: rgba(255,255,255,0.35);\n      font-weight: 500;\n      letter-spacing: 0.03em;\n    }\n    .auth-float-badge-1 {\n      top: 12%; right: 6%;\n      animation-delay: 1.5s, 0.5s;\n    }\n    .auth-float-badge-2 {\n      bottom: 22%; left: 5%;\n      animation-delay: 2s, 1.2s;\n    }'
old_g = '    /* --- Google Setup Dialog --- */'
# Try to find the actual marker
old_g2 = '    .gsetup-overlay {'
inserted = False
for old_gs in [old_g, old_g2]:
    if old_gs in content:
        content = content.replace(old_gs, fb_css + '\n' + old_gs)
        inserted = True
        break
if inserted:
    changes.append('9. Badges CSS')
else:
    changes.append('9. FAILED badges CSS')

# 10. Label HTML
old_l = '        <div class="auth-carousel-track" id="carouselTrack">'
new_l = '        <div class="auth-carousel-label">\n          <span class="auth-carousel-label-name" id="carouselLabel">Schedule</span>\n          <span class="auth-carousel-label-index" id="carouselIndex">1 / 6</span>\n        </div>\n        <div class="auth-carousel-track" id="carouselTrack">'
if old_l in content:
    content = content.replace(old_l, new_l)
    changes.append('10. Label HTML')
else:
    changes.append('10. FAILED label HTML')

# 11. Badges HTML
old_b = '      <!-- Gradient Overlay + Quote -->'
new_b = '      <!-- Floating badges -->\n      <div class="auth-float-badge auth-float-badge-1">\n        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>\n        <span>5 active</span>\n      </div>\n      <div class="auth-float-badge auth-float-badge-2">\n        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>\n        <span>24h tracked</span>\n      </div>\n      <!-- Gradient Overlay + Quote -->'
if old_b in content:
    content = content.replace(old_b, new_b)
    changes.append('11. Badges HTML')
else:
    changes.append('11. FAILED badges HTML')

# 12. Update goToSlide JS
old_js = '        function goToSlide(index) {\n          if (index < 0) index = slideCount - 1;\n          if (index >= slideCount) index = 0;\n          currentSlide = index;\n          track.style.transform = \'translateX(-\', + (index * 100) + \'%)\';\n          dots.forEach(function(d, i) {\n            d.classList.toggle(\'active\', i === index);\n          });\n        }'
# Find the actual goToSlide function
import re as re_mod
# Try to find it with regex
js_match = re_mod.search(r'function goToSlide\(index\) \{.*?\n        \}', content, re_mod.DOTALL)
if js_match:
    old_js = js_match.group(0)
    new_js = old_js + '\n          // Update label\n          var label = document.getElementById(\'carouselLabel\');\n          var idxEl = document.getElementById(\'carouselIndex\');\n          var names = [\'Schedule\', \'Hub\', \'Finance\', \'Analytics\', \'Goals\', \'Activities\'];\n          if (label) label.textContent = names[index];\n          if (idxEl) idxEl.textContent = (index + 1) + \' / \' + slideCount;\n        '
    # Don't replace - just modify the original
    # Actually the match includes the closing, let me just find the right spot
    changes.append('12. JS: will check manually')

# Now write
with open('login.html', 'w', encoding='utf-8') as f:
    f.write(content)

print('Changes applied:')
for c in changes:
    print(' -', c)
print('Done!')
