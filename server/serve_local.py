"""
Local server for Havën Schedule.

Serves the project root on http://127.0.0.1:8321 so the app can be opened (and
installed as an app) straight from this folder, with no deploy needed.

Why not `python -m http.server`:
  - it sends no gzip, so the app ships ~1.3 MB of JS instead of ~520 KB
  - it sends no Cache-Control, so every navigation re-reads everything

Run:      python server/serve_local.py
Launcher: server/launch_local.py  (starts this if needed, then opens the app)
"""

import http.server
import socketserver
import gzip
import io
import os
import sys

PORT = 8321
HOST = '127.0.0.1'

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(PROJECT_ROOT)

COMPRESSIBLE = {
    'text/html', 'text/css', 'text/plain', 'text/javascript',
    'application/javascript', 'application/json', 'image/svg+xml',
    'application/manifest+json'
}

EXTRA_TYPES = {
    '.js': 'application/javascript',
    '.mjs': 'application/javascript',
    '.json': 'application/json',
    '.webmanifest': 'application/manifest+json',
    '.svg': 'image/svg+xml',
    '.woff2': 'font/woff2',
    '.woff': 'font/woff',
    '.ico': 'image/x-icon',
    '.webp': 'image/webp',
    '.avif': 'image/avif',
}


class Handler(http.server.SimpleHTTPRequestHandler):
    protocol_version = 'HTTP/1.1'

    def guess_type(self, path):
        ext = os.path.splitext(str(path))[1].lower()
        if ext in EXTRA_TYPES:
            return EXTRA_TYPES[ext]
        return super().guess_type(path)

    def end_headers(self):
        # HTML must never be cached or edits never show up.
        if self.path.endswith('.html') or self.path.endswith('/'):
            self.send_header('Cache-Control', 'no-store')
        else:
            self.send_header('Cache-Control', 'no-cache')
        super().end_headers()

    def send_head(self):
        path = self.translate_path(self.path)
        if os.path.isdir(path):
            for index in ('index.html', 'index.htm'):
                candidate = os.path.join(path, index)
                if os.path.exists(candidate):
                    path = candidate
                    break
        if not os.path.isfile(path):
            return super().send_head()

        try:
            with open(path, 'rb') as fh:
                body = fh.read()
        except OSError:
            return super().send_head()

        ctype = self.guess_type(path)
        accepts_gzip = 'gzip' in (self.headers.get('Accept-Encoding') or '')
        if accepts_gzip and ctype.split(';')[0] in COMPRESSIBLE and len(body) > 1024:
            buf = io.BytesIO()
            with gzip.GzipFile(fileobj=buf, mode='wb', compresslevel=6) as gz:
                gz.write(body)
            compressed = buf.getvalue()
            if len(compressed) < len(body):
                body = compressed
                self.send_response(200)
                self.send_header('Content-Type', ctype)
                self.send_header('Content-Encoding', 'gzip')
                self.send_header('Content-Length', str(len(body)))
                self.end_headers()
                return io.BytesIO(body)

        self.send_response(200)
        self.send_header('Content-Type', ctype)
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        return io.BytesIO(body)

    def log_message(self, fmt, *args):
        if args and str(args[1] if len(args) > 1 else '').startswith(('4', '5')):
            sys.stderr.write('%s - %s\n' % (self.address_string(), fmt % args))


class Server(socketserver.ThreadingTCPServer):
    allow_reuse_address = True
    daemon_threads = True


def main():
    try:
        httpd = Server((HOST, PORT), Handler)
    except OSError as err:
        print('[error] could not bind %s:%s -> %s' % (HOST, PORT, err))
        print('        something else is already using that port.')
        return 1
    print('Havën Schedule running at http://%s:%s/' % (HOST, PORT))
    print('Serving: %s' % PROJECT_ROOT)
    print('Press Ctrl+C to stop.')
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print('\nstopped.')
    finally:
        httpd.server_close()
    return 0


if __name__ == '__main__':
    sys.exit(main())
