import re

path = r'C:\Users\ASUS\AI Apps\Hans Scedule\schedule.js'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Remove the dom.dailyChart line
content = content.replace("dom.dailyChart     = $('#dailyChart');\n", "")

# 2. Remove the DAILY CHART section - from the comment to the blank line before CALENDAR RENDERING
# Find and remove the entire renderChart function
start_marker = "// ─── DAILY CHART ────────────────────────────────────────────\n"
end_marker = "\n// ─── CALENDAR RENDERING"
start_idx = content.find(start_marker)
end_idx = content.find(end_marker)
if start_idx >= 0 and end_idx >= 0:
    content = content[:start_idx] + content[end_idx:]
    print(f"Removed renderChart function ({end_idx - start_idx} chars)")
else:
    print(f"Could not find markers: start={start_idx}, end={end_idx}")

# 3. Remove renderChart() calls
for call in ["  renderChart();\n  renderWhiteboard();\n}\n\n// ─── MONTH VIEW",
             "  renderMiniWeek();\n  renderChart();\n  renderWhiteboard();\n}\n\n// ─── AGENDA VIEW",
             "  renderMiniWeek();\n  renderChart();\n  renderWhiteboard();\n}\n\n// ─── INITIALIZATION"]:
    if call in content:
        replacement = call.replace("  renderChart();\n", "")
        content = content.replace(call, replacement)
        print(f"Replaced: {call[:50]}...")
    else:
        print(f"Pattern not found: {call[:50]}...")

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

# Verify
for line in content.split('\n'):
    if 'dailyChart' in line or 'renderChart()' in line:
        print(f"STILL PRESENT: {line.strip()[:80]}")
        
print("Done")
