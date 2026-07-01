import os

with open('hub-visuals.js', 'rb') as f:
    content = f.read()

# Split by both \r\n and \n
lines = content.replace(b'\r\n', b'\n').split(b'\n')

# Filter out lines containing 'gallery' (case-sensitive, but check both)
filtered = [l for l in lines if b'gallery' not in l.lower()]

output = b'\r\n'.join(filtered)

with open('hub-visuals.js', 'wb') as f:
    f.write(output)

print(f'Removed {len(lines) - len(filtered)} lines containing gallery')
