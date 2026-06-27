import re

with open('schedule.js', 'r', encoding='utf-8', newline='') as f:
    content = f.read()

old = '''    // Browser notification
    if ('Notification' in window && Notification.permission === 'granted') {
      try { new Notification('🎉 Pomodoro Complete!', { body: 'Time for a break!' }); } catch(e) {}
    }'''

new = '''    // Browser notification with vibration
    if (typeof _sendNotification === 'function') {
      _sendNotification('\\uD83C\\uDF89 Pomodoro Complete!', 'Time for a break!', { tag: 'pomodoro', vibratePattern: [200, 100, 200] });
    } else if ('Notification' in window && Notification.permission === 'granted') {
      try { new Notification('\\uD83C\\uDF89 Pomodoro Complete!', { body: 'Time for a break!' }); if (navigator.vibrate) navigator.vibrate([200, 100, 200]); } catch(e) {}
    }'''

# Normalize both to the same line ending
old_norm = old.replace('\r\n', '\n')
content_norm = content.replace('\r\n', '\n')
new_norm = new.replace('\r\n', '\n')

if old_norm in content_norm:
    content_norm = content_norm.replace(old_norm, new_norm, 1)
    # Preserve original line endings
    if '\r\n' in content:
        content = content_norm.replace('\n', '\r\n')
    else:
        content = content_norm
    with open('schedule.js', 'w', encoding='utf-8', newline='') as f:
        f.write(content)
    print("SUCCESS: Pomodoro notification replaced")
else:
    print("ERROR: Could not find the pomodoro notification code")
    # Debug: find the position
    marker = "Pomodoro Complete"
    if marker in content_norm:
        idx = content_norm.index(marker)
        snippet = content_norm[idx-50:idx+100]
        print(f"Found around position {idx}:\\n{snippet}")
    else:
        print("Could not find 'Pomodoro Complete' marker")
