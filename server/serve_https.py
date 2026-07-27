"""
Start an HTTPS server for local development.

Usage:
    python server/serve_https.py

Then open:  https://127.0.0.1:8443

NOTE: Since this uses a self-signed certificate, your browser will show
a security warning ("Your connection is not private"). This is EXPECTED
and safe for local development. Click through to continue:
  - Chrome:  "Advanced" → "Proceed to 127.0.0.1 (unsafe)"
  - Firefox: "Advanced" → "Accept the Risk and Continue"
  - Edge:    "Advanced" → "Continue to 127.0.0.1 (unsafe)"

To generate new certificates (or if server.crt/server.key are missing),
run:  python server/gen_cert.py

To trust the cert permanently and remove the browser warning, see the
instructions printed by gen_cert.py.
"""

import http.server
import ssl
import os
import sys

# Serve from the project root (parent of server/)
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(PROJECT_ROOT)

CERT_DIR = os.path.join(PROJECT_ROOT, 'server')
CERT_FILE = os.path.join(CERT_DIR, 'server.crt')
KEY_FILE  = os.path.join(CERT_DIR, 'server.key')

if not os.path.exists(CERT_FILE) or not os.path.exists(KEY_FILE):
    print('[error] Certificate files not found.')
    print(f'  Expected: {CERT_FILE}')
    print(f'  Expected: {KEY_FILE}')
    print()
    print('  Generate them first:  python server/gen_cert.py')
    sys.exit(1)

server_address = ('127.0.0.1', 8443)
httpd = http.server.HTTPServer(server_address, http.server.SimpleHTTPRequestHandler)

context = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
context.load_cert_chain(CERT_FILE, KEY_FILE)
httpd.socket = context.wrap_socket(httpd.socket, server_side=True)

print(f'Serving project at: {PROJECT_ROOT}')
print(f'HTTPS server on    https://127.0.0.1:8443')
print(f'Cert:              {CERT_FILE}')
print()
print('Browser warning is expected - it\'s a self-signed cert for local dev.')
print('Click "Advanced" -> "Proceed to 127.0.0.1 (unsafe)" to continue.')
print()
print('Press Ctrl+C to stop.')
httpd.serve_forever()
