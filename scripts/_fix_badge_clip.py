import sys
sys.stdout.reconfigure(encoding='utf-8', errors='replace')

with open('login.html', 'r', encoding='utf-8') as f:
    content = f.read()

changes = []

# Remove badges from inside carousel (they were placed before carousel dots)
old_inside = """      <!-- Floating badges inside carousel -->
      <div class="auth-float-badge auth-float-badge-1">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
        <span>5 active</span>
      </div>
      <div class="auth-float-badge auth-float-badge-2">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
        <span>24h tracked</span>
      </div>
      <!-- Carousel dots -->"""

new_outside_inside = """      <!-- Carousel dots -->"""

if old_inside in content:
    content = content.replace(old_inside, new_outside_inside)
    changes.append("Removed badges from inside carousel")
else:
    changes.append("FAILED: badges not found inside carousel")

# Re-insert badges OUTSIDE carousel, inside .auth-right, after carousel dots
# Put them before the overlay
old_before_overlay = '      <!-- Gradient Overlay + Quote -->'
new_before_overlay = """      <!-- Floating badges (outside carousel) -->
      <div class="auth-float-badge auth-float-badge-1">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
        <span>5 active</span>
      </div>
      <div class="auth-float-badge auth-float-badge-2">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
        <span>24h tracked</span>
      </div>
      <!-- Gradient Overlay + Quote -->"""

if old_before_overlay in content:
    content = content.replace(old_before_overlay, new_before_overlay)
    changes.append("Inserted badges outside carousel (before overlay)")
else:
    changes.append("FAILED: overlay not found")

# Update badge positioning to be relative to .auth-right (the parent) with better coords
old_b1 = "    .auth-float-badge-1 {\n      top: 8%; right: 4%;"
new_b1 = "    .auth-float-badge-1 {\n      top: 10%; right: 7%;"
if old_b1 in content:
    content = content.replace(old_b1, new_b1)
    changes.append("Updated badge-1 position (relative to .auth-right)")
else:
    changes.append("FAILED: badge-1 CSS not found")

old_b2 = "    .auth-float-badge-2 {\n      bottom: 16%; left: 3%;"
new_b2 = "    .auth-float-badge-2 {\n      bottom: 24%; left: 6%;"
if old_b2 in content:
    content = content.replace(old_b2, new_b2)
    changes.append("Updated badge-2 position (relative to .auth-right)")
else:
    changes.append("FAILED: badge-2 CSS not found")

with open('login.html', 'w', encoding='utf-8') as f:
    f.write(content)

print("Badge fix applied:")
for c in changes:
    print("-", c)
print("Done!")
