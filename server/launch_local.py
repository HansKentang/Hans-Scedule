"""
One-click launcher for Havën Schedule.

Double-click the desktop shortcut (or run this file) and it will:
  1. check whether the local server is already running on 127.0.0.1:8321
  2. start it in the background if it is not (no console window)
  3. open the app in its own Chrome window (app mode, no address bar)

Safe to run repeatedly - it never starts a second copy of the server.
"""

import os
import subprocess
import sys
import time
import urllib.error
import urllib.request

HOST = '127.0.0.1'
PORT = 8321
URL = 'http://%s:%s/' % (HOST, PORT)

HERE = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(HERE)
SERVER = os.path.join(HERE, 'serve_local.py')

CHROME_CANDIDATES = [
    r'C:\Program Files\Google\Chrome\Application\chrome.exe',
    r'C:\Program Files (x86)\Google\Chrome\Application\chrome.exe',
    r'C:\Program Files\Microsoft\Edge\Application\msedge.exe',
    r'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe',
]


def server_alive(timeout=1.0):
    """True only if OUR server answers 200.

    Deliberately strict: an earlier version treated any HTTP error as "alive",
    which means anything else squatting on the port (or a proxy returning 502)
    would make the launcher skip starting the real server. Proxies are disabled
    so a stray HTTP_PROXY cannot be mistaken for the server either.
    """
    opener = urllib.request.build_opener(urllib.request.ProxyHandler({}))
    try:
        with opener.open(URL, timeout=timeout) as resp:
            return resp.status == 200
    except Exception:
        return False


def find_pythonw():
    """Prefer pythonw.exe next to the interpreter running this script."""
    exe = sys.executable
    for name in ('pythonw.exe', 'python.exe'):
        candidate = os.path.join(os.path.dirname(exe), name)
        if os.path.exists(candidate):
            return candidate
    return exe


def start_server():
    pythonw = find_pythonw()
    flags = 0
    if os.name == 'nt':
        DETACHED_PROCESS = 0x00000008
        CREATE_NEW_PROCESS_GROUP = 0x00000200
        CREATE_NO_WINDOW = 0x08000000
        flags = DETACHED_PROCESS | CREATE_NEW_PROCESS_GROUP | CREATE_NO_WINDOW
    log = open(os.path.join(HERE, 'server.log'), 'ab')
    subprocess.Popen(
        [pythonw, SERVER],
        cwd=PROJECT_ROOT,
        stdout=log,
        stderr=log,
        stdin=subprocess.DEVNULL,
        creationflags=flags,
        close_fds=True,
    )


def wait_for_server(seconds=15.0):
    deadline = time.time() + seconds
    while time.time() < deadline:
        if server_alive(0.6):
            return True
        time.sleep(0.25)
    return False


def find_browser():
    for path in CHROME_CANDIDATES:
        if os.path.exists(path):
            return path
    return None


def main():
    server_only = '--server-only' in sys.argv

    if not server_alive():
        start_server()
        if not wait_for_server():
            print('Could not start the local server.')
            print('Try running it directly:  python server/serve_local.py')
            return 1

    if server_only:
        return 0

    browser = find_browser()
    if not browser:
        import webbrowser
        webbrowser.open(URL)
        return 0

    subprocess.Popen(
        [browser, '--app=' + URL, '--new-window'],
        cwd=PROJECT_ROOT,
        close_fds=True,
    )
    return 0


if __name__ == '__main__':
    sys.exit(main())
