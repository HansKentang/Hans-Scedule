import sys, os

sys.stdout.reconfigure(encoding='utf-8', errors='replace')

with open('login.html', 'r', encoding='utf-8') as f:
    content = f.read()

changes = []

# ─── FIX 1: Add active-slide / inactive-slide CSS for real 3D effect ───
target_auth_slide = """    .auth-carousel-slide {
      flex: 0 0 100%;
      min-width: 0;
      transition: transform 0.8s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.5s ease;
    }
    .auth-carousel-slide svg {
      width: 100%; height: auto;
      display: block;
      border-radius: 10px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.3);
    }"""

replacement_slide = """    .auth-carousel-slide {
      flex: 0 0 100%;
      min-width: 0;
      transition: transform 0.8s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.6s ease;
    }
    .auth-carousel-slide svg {
      width: 100%; height: auto;
      display: block;
      border-radius: 10px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.3);
    }
    .auth-carousel-slide.active-slide {
      transform: scale(1) translateZ(0);
      opacity: 1;
    }
    .auth-carousel-slide.inactive-slide {
      transform: scale(0.92) translateZ(-30px) rotateY(-2deg);
      opacity: 0.4;
    }"""

if target_auth_slide in content:
    content = content.replace(target_auth_slide, replacement_slide)
    changes.append("+ FIX 1: Added 3D active/inactive slide styles")
else:
    changes.append("! FAILED: slide CSS not found")

# ─── FIX 2: Update goToSlide to toggle 3D classes ───
old_gotoslide = """          var label = document.getElementById('carouselLabel');
          var idxEl = document.getElementById('carouselIndex');
          var names = ['Schedule', 'Hub', 'Finance', 'Analytics', 'Goals', 'Activities'];
          if (label) label.textContent = names[index];
          if (idxEl) idxEl.textContent = (index + 1) + ' / ' + slideCount;"""

new_gotoslide = """          var label = document.getElementById('carouselLabel');
          var idxEl = document.getElementById('carouselIndex');
          var names = ['Schedule', 'Hub', 'Finance', 'Analytics', 'Goals', 'Activities'];
          if (label) label.textContent = names[index];
          if (idxEl) idxEl.textContent = (index + 1) + ' / ' + slideCount;
          // 3D effect - scale active slide, shrink inactive
          var allSlides = document.querySelectorAll('.auth-carousel-slide');
          allSlides.forEach(function(s, i) {
            s.classList.toggle('active-slide', i === index);
            s.classList.toggle('inactive-slide', i !== index);
          });"""

if old_gotoslide in content:
    content = content.replace(old_gotoslide, new_gotoslide)
    changes.append("+ FIX 2: Updated JS to toggle 3D slide classes")
else:
    changes.append("! FAILED: goToSlide label update not found")

# ─── FIX 3: Move floating badges INSIDE .auth-carousel (fix positioning) ───
# Find badges HTML and move them inside .auth-carousel (after dots)
old_badges_html = """      <!-- Floating badges -->
      <div class="auth-float-badge auth-float-badge-1">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
        <span>5 active</span>
      </div>
      <div class="auth-float-badge auth-float-badge-2">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
        <span>24h tracked</span>
      </div>
      <!-- Gradient Overlay + Quote -->"""

# Remove badges from old location
if old_badges_html in content:
    content = content.replace(old_badges_html, '      <!-- Gradient Overlay + Quote -->')
    changes.append("+ FIX 3: Removed badges from old location")
else:
    changes.append("! FAILED: badges HTML not found in old location")

# Insert badges inside .auth-carousel (after the carousel-track closing div)
# Find the closing of carousel-track + carousel dots, insert before carousel closing
old_carousel_close = '      </div>\n      <!-- Carousel dots -->'
# Actually the carousel closes after the track and dots. Let me find where to insert.
# The structure is:
# <div class="auth-carousel">
#   <div class="auth-carousel-label">...</div>
#   <div class="auth-carousel-track" id="carouselTrack">
#     ...slides...
#   </div>
# </div>
# <div class="auth-carousel-dots">...</div>
# 
# So the carousel closes before the dots. I should insert badges inside the carousel, after the track.

# Find the closing </div> of .auth-carousel that comes before .auth-carousel-dots
old_auth_end = '        </div>\n      </div>\n      <!-- Carousel dots -->'
new_auth_end = """        </div>
      </div>
      <!-- Floating badges inside carousel -->
      <div class="auth-float-badge auth-float-badge-1">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
        <span>5 active</span>
      </div>
      <div class="auth-float-badge auth-float-badge-2">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
        <span>24h tracked</span>
      </div>
      <!-- Carousel dots -->"""

if old_auth_end in content:
    content = content.replace(old_auth_end, new_auth_end)
    changes.append("+ FIX 3b: Inserted badges inside carousel (before dots)")
else:
    changes.append("! FAILED: could not find carousel closing")

# ─── FIX 4: Update badge CSS positioning to be relative to .auth-carousel ───
# The badges now need to be positioned relative to .auth-carousel
# .auth-carousel has position: relative so absolute children will work
# But the badges need different positioning since they're inside the carousel now
old_badge_1 = "    .auth-float-badge-1 {\n      top: 12%; right: 6%;"
new_badge_1 = "    .auth-float-badge-1 {\n      top: 8%; right: 4%;"
if old_badge_1 in content:
    content = content.replace(old_badge_1, new_badge_1)
    changes.append("+ FIX 4: Updated badge-1 positioning")
else:
    changes.append("! FAILED: badge-1 CSS not found")

old_badge_2 = "    .auth-float-badge-2 {\n      bottom: 22%; left: 5%;"
new_badge_2 = "    .auth-float-badge-2 {\n      bottom: 16%; left: 3%;"
if old_badge_2 in content:
    content = content.replace(old_badge_2, new_badge_2)
    changes.append("+ FIX 4b: Updated badge-2 positioning")
else:
    changes.append("! FAILED: badge-2 CSS not found")

# ─── FIX 5: Polish glass frame - lighter shadow, less padding ───
old_glass = "      box-shadow: 0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06);\n      perspective: 1000px;"
new_glass = "      box-shadow: 0 4px 24px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.05);\n      perspective: 1000px;"
if old_glass in content:
    content = content.replace(old_glass, new_glass)
    changes.append("+ FIX 5: Polish glass frame shadow")
else:
    changes.append("! FAILED: glass frame shadow not found")

# ─── FIX 6: Add initial active-slide class to first slide ───
old_first_slide = '<!-- Slide 1: Schedule -->\n          <div class="auth-carousel-slide">'
new_first_slide = '<!-- Slide 1: Schedule -->\n          <div class="auth-carousel-slide active-slide">'
if old_first_slide in content:
    content = content.replace(old_first_slide, new_first_slide)
    changes.append("+ FIX 6: Added active-slide to first slide")
else:
    changes.append("! FAILED: first slide not found")

# ─── FIX 7: Add inactive-slide to all other slides ───
for i in range(2, 7):
    old = f'<!-- Slide {i}:'
    new = old.replace('<!--', '<!--')
    # Just check if slide exists and add inactive-slide
    slide_marker = f'<div class="auth-carousel-slide">'
    # Find each non-first slide and add inactive-slide
    # Actually let me just do this for slide 2 only since the others get toggled by JS
    if i == 2:
        old_s2 = f'<!-- Slide 2: Hub -->\n          <div class="auth-carousel-slide">'
        new_s2 = f'<!-- Slide 2: Hub -->\n          <div class="auth-carousel-slide inactive-slide">'
        if old_s2 in content:
            content = content.replace(old_s2, new_s2)
            # changes.append("  Added inactive-slide to slide 2")

# ─── Write back ───
with open('login.html', 'w', encoding='utf-8') as f:
    f.write(content)

print("Fixes applied:")
for c in changes:
    print(c)
print("Done!")
