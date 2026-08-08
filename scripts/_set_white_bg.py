import re

def apply(path):
    with open(path, 'r', encoding='utf-8') as f:
        html = f.read()

    # Define the CSS region from "/* ─── Right Panel ─── */" to before "/* ─── Google Setup Dialog ─── */"
    # We'll target only the .auth-right / .auth-carousel / .auth-float-badge related selectors

    changes = {
        # --- .auth-right background ---
        'background: var(--bg);\n      animation: fadeIn': 'background: #fff;\n      animation: fadeIn',

        # --- ::before radial gradients (white -> black tones) ---
        'radial-gradient(ellipse 60% 40% at 50% 50%, rgba(255,255,255,0.025) 0%, transparent 60%),\n        radial-gradient(ellipse 30% 20% at 80% 20%, rgba(255,255,255,0.015) 0%, transparent 50%)':
        'radial-gradient(ellipse 60% 40% at 50% 50%, rgba(0,0,0,0.025) 0%, transparent 60%),\n        radial-gradient(ellipse 30% 20% at 80% 20%, rgba(0,0,0,0.015) 0%, transparent 50%)',

        # --- Carousel glass frame ---
        'background: rgba(255,255,255,0.03);\n      backdrop-filter: blur(20px);\n      -webkit-backdrop-filter: blur(20px);\n      border: 1px solid rgba(255,255,255,0.08);':
        'background: rgba(0,0,0,0.03);\n      backdrop-filter: blur(20px);\n      -webkit-backdrop-filter: blur(20px);\n      border: 1px solid rgba(0,0,0,0.08);',

        # --- Carousel label strip ---
        'border-bottom: 1px solid rgba(255,255,255,0.04);':
        'border-bottom: 1px solid rgba(0,0,0,0.04);',

        # --- Label name ---
        '.auth-carousel-label-name {\n      font-size: 0.6rem;\n      font-weight: 600;\n      color: rgba(255,255,255,0.35);':
        '.auth-carousel-label-name {\n      font-size: 0.6rem;\n      font-weight: 600;\n      color: rgba(0,0,0,0.35);',

        # --- Label name span ---
        '.auth-carousel-label-name span {\n      color: rgba(255,255,255,0.15);':
        '.auth-carousel-label-name span {\n      color: rgba(0,0,0,0.15);',

        # --- Label index ---
        '.auth-carousel-label-index {\n      font-size: 0.55rem;\n      color: rgba(255,255,255,0.12);':
        '.auth-carousel-label-index {\n      font-size: 0.55rem;\n      color: rgba(0,0,0,0.12);',

        # --- Dots ---
        '.auth-carousel-dot {\n      width: 6px; height: 6px;\n      border-radius: 50%;\n      background: rgba(255,255,255,0.15);':
        '.auth-carousel-dot {\n      width: 6px; height: 6px;\n      border-radius: 50%;\n      background: rgba(0,0,0,0.15);',

        '.auth-carousel-dot.active {\n      width: 20px;\n      border-radius: 3px;\n      background: rgba(255,255,255,0.6);':
        '.auth-carousel-dot.active {\n      width: 20px;\n      border-radius: 3px;\n      background: rgba(0,0,0,0.6);',

        '.auth-carousel-dot:hover {\n      background: rgba(255,255,255,0.3);':
        '.auth-carousel-dot:hover {\n      background: rgba(0,0,0,0.3);',

        # --- Overlay gradient ---
        'background: linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.5) 100%);':
        'background: linear-gradient(180deg, transparent 0%, rgba(255,255,255,0.5) 100%);',

        # --- Quote text ---
        '.auth-quote {\n      font-size: 0.9rem;\n      font-weight: 400;\n      color: rgba(255,255,255,0.5);':
        '.auth-quote {\n      font-size: 0.9rem;\n      font-weight: 400;\n      color: rgba(0,0,0,0.5);',

        # --- Quote cursor ---
        '.auth-quote-cursor {\n      display: inline-block;\n      width: 2px;\n      height: 1em;\n      background: rgba(255,255,255,0.3);':
        '.auth-quote-cursor {\n      display: inline-block;\n      width: 2px;\n      height: 1em;\n      background: rgba(0,0,0,0.3);',

        # --- Quote author ---
        '.auth-quote-author {\n      font-size: 0.7rem;\n      color: rgba(255,255,255,0.25);':
        '.auth-quote-author {\n      font-size: 0.7rem;\n      color: rgba(0,0,0,0.25);',

        # --- Badge background ---
        '.auth-float-badge {\n      position: absolute;\n      z-index: 5;\n      background: rgba(255,255,255,0.04);':
        '.auth-float-badge {\n      position: absolute;\n      z-index: 5;\n      background: rgba(0,0,0,0.04);',

        # --- Badge border ---
        'backdrop-filter: blur(12px);\n      -webkit-backdrop-filter: blur(12px);\n      border: 1px solid rgba(255,255,255,0.08);':
        'backdrop-filter: blur(12px);\n      -webkit-backdrop-filter: blur(12px);\n      border: 1px solid rgba(0,0,0,0.08);',

        # --- Badge text/icon color ---
        '.auth-float-badge svg {\n      width: 10px; height: 10px;\n      color: rgba(255,255,255,0.35);':
        '.auth-float-badge svg {\n      width: 10px; height: 10px;\n      color: rgba(0,0,0,0.35);',

        '.auth-float-badge span {\n      font-size: 0.5rem;\n      color: rgba(255,255,255,0.35);':
        '.auth-float-badge span {\n      font-size: 0.5rem;\n      color: rgba(0,0,0,0.35);',
    }

    count = 0
    for old, new in changes.items():
        if old in html:
            html = html.replace(old, new)
            count += 1
        else:
            print(f'  NOT FOUND: {old[:60]}...')

    with open(path, 'w', encoding='utf-8') as f:
        f.write(html)

    print(f'Applied {count}/{len(changes)} changes to {path}')

apply('login.html')
apply('haven-desktop/login.html')
