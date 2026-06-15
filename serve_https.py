import http.server
import ssl
import os

os.chdir(os.path.dirname(os.path.abspath(__file__)))

server_address = ('127.0.0.1', 8443)
httpd = http.server.HTTPServer(server_address, http.server.SimpleHTTPRequestHandler)

context = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
context.load_cert_chain('server.crt', 'server.key')
httpd.socket = context.wrap_socket(httpd.socket, server_side=True)

print("HTTPS server on https://127.0.0.1:8443")
httpd.serve_forever()
