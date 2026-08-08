# -*- coding: utf-8 -*-
# One-off polish pass for login.html (preserves CRLF line endings).
# Uses only real newlines + chr() so there are no escape-sequence traps.
import io

PATH = 'login.html'

LF = chr(10)
CR = chr(13)
CRLF = CR + LF

# (old, new) pairs. Both use LF line endings; matched against the
# normalized (LF-only) copy of the file.
REPLACEMENTS = [
(
"""    /* ─── Left Panel ─── */
    .auth-left {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: clamp(16px, 3vh, 40px) clamp(16px, 4vw, 48px);
      position: relative;
      overflow-y: auto;
      overscroll-behavior: contain;
      animation: fadeIn 0.6s var(--bounce) both;
    }
    .auth-left::before {
      content: ''; position: absolute; inset: 0;
      background:
        radial-gradient(ellipse 70% 50% at 30% 20%, rgba(255,255,255,0.025) 0%, transparent 60%),
        radial-gradient(ellipse 50% 40% at 70% 80%, rgba(255,255,255,0.015) 0%, transparent 50%);
      pointer-events: none;
    }
    .auth-left::after {
      content: ''; position: absolute; right: 0; top: 8%; bottom: 8%;
      width: 1px;
      background: linear-gradient(180deg, transparent, var(--border), transparent);
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(6px); }
      to { opacity: 1; transform: translateY(0); }
    }
""",
"""    /* ─── Left Panel ─── */
    .auth-left {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: clamp(16px, 3vh, 40px) clamp(16px, 4vw, 48px);
      position: relative;
      overflow-x: hidden;
      overflow-y: auto;
      overscroll-behavior: contain;
      animation: fadeIn 0.7s var(--smooth) both;
    }
    .auth-left::before {
      content: ''; position: absolute; inset: 0;
      background:
        radial-gradient(ellipse 70% 50% at 30% 20%, rgba(255,255,255,0.03) 0%, transparent 60%),
        radial-gradient(ellipse 50% 40% at 70% 80%, rgba(255,255,255,0.02) 0%, transparent 50%);
      pointer-events: none;
    }
    .auth-left::after {
      content: ''; position: absolute; right: 0; top: 6%; bottom: 6%;
      width: 1px;
      background: linear-gradient(180deg, transparent, rgba(255,255,255,0.16), transparent);
      pointer-events: none;
    }
    .auth-glow {
      position: absolute;
      border-radius: 50%;
      filter: blur(72px);
      pointer-events: none;
      z-index: 0;
    }
    .auth-glow-1 {
      width: 360px; height: 360px;
      top: -90px; left: -110px;
      background: radial-gradient(circle, rgba(255,255,255,0.075) 0%, transparent 65%);
      animation: glowDrift1 16s ease-in-out infinite alternate;
    }
    .auth-glow-2 {
      width: 320px; height: 320px;
      bottom: -70px; right: -90px;
      background: radial-gradient(circle, rgba(255,255,255,0.055) 0%, transparent 65%);
      animation: glowDrift2 20s ease-in-out infinite alternate;
    }
    @keyframes glowDrift1 {
      0% { transform: translate(0, 0) scale(1); }
      100% { transform: translate(44px, 32px) scale(1.18); }
    }
    @keyframes glowDrift2 {
      0% { transform: translate(0, 0) scale(1.1); }
      100% { transform: translate(-34px, -22px) scale(0.92); }
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
    /* Staggered entrance */
    .auth-reveal {
      opacity: 0;
      animation: authReveal 0.7s var(--smooth) both;
      animation-delay: var(--d, 0s);
    }
    @keyframes authReveal {
      from { opacity: 0; transform: translateY(16px); filter: blur(6px); }
      to { opacity: 1; transform: translateY(0); filter: blur(0); }
    }
    .auth-swap {
      animation: authSwap 0.45s var(--smooth);
    }
    @keyframes authSwap {
      from { opacity: 0; transform: translateY(10px); filter: blur(4px); }
      to { opacity: 1; transform: translateY(0); filter: blur(0); }
    }
""",
),
(
"""    .auth-heading .hl-accent {
      background: linear-gradient(135deg, #fff 0%, rgba(255,255,255,0.55) 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
""",
"""    .auth-heading .hl-accent {
      background: linear-gradient(135deg, #fff 0%, rgba(255,255,255,0.5) 50%, #fff 100%);
      background-size: 200% 100%;
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      animation: accentShimmer 7s ease-in-out infinite;
    }
    @keyframes accentShimmer {
      0%, 100% { background-position: 0% 50%; }
      50% { background-position: 100% 50%; }
    }
""",
),
(
"""    .auth-input:focus {
      border-color: var(--border-light);
      background: rgba(255,255,255,0.06);
      box-shadow: 0 0 0 1px rgba(255,255,255,0.08);
    }
    .auth-input:hover { border-color: var(--border-light); }
""",
"""    .auth-input:hover:not(:focus) {
      border-color: var(--border-light);
      background: rgba(255,255,255,0.045);
    }
    .auth-input:focus {
      border-color: rgba(255,255,255,0.22);
      background: rgba(255,255,255,0.07);
      box-shadow: 0 0 0 3px rgba(255,255,255,0.06), 0 8px 24px -12px rgba(255,255,255,0.16);
      transform: translateY(-1px);
    }
    .auth-input.has-value { border-color: rgba(255,255,255,0.18); }
    .auth-input.invalid {
      border-color: rgba(255,120,110,0.65);
      box-shadow: 0 0 0 3px rgba(255,120,110,0.10);
      animation: shake 0.4s var(--smooth);
    }
    @keyframes shake {
      0%, 100% { transform: translateX(0); }
      20% { transform: translateX(-6px); }
      40% { transform: translateX(6px); }
      60% { transform: translateX(-4px); }
      80% { transform: translateX(4px); }
    }
    .auth-label { transition: color 0.25s var(--smooth); }
    .auth-label.has-value { color: var(--text); }
""",
),
(
"""    .auth-submit {
      width: 100%;
      padding: clamp(11px, 2vh, 16px) clamp(14px, 3vw, 24px);
      border: none;
      border-radius: 10px;
      background: var(--text);
      color: var(--bg);
      font-family: inherit;
      font-size: clamp(0.82rem, 1.2vw, 0.95rem);
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s var(--bounce);
      margin-top: clamp(2px, 0.5vh, 6px);
    }
    .auth-submit:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 6px 24px rgba(255,255,255,0.12);
    }
    .auth-submit:active:not(:disabled) { transform: scale(0.97); }
    .auth-submit:disabled {
      opacity: 0.2;
      cursor: default;
    }
""",
"""    .auth-submit {
      position: relative;
      overflow: hidden;
      width: 100%;
      padding: clamp(11px, 2vh, 16px) clamp(14px, 3vw, 24px);
      border: none;
      border-radius: 11px;
      background: linear-gradient(180deg, #ffffff, #e8e8e8);
      color: var(--bg);
      font-family: inherit;
      font-size: clamp(0.82rem, 1.2vw, 0.95rem);
      font-weight: 600;
      letter-spacing: 0.01em;
      cursor: pointer;
      transition: all 0.25s var(--bounce);
      margin-top: clamp(2px, 0.5vh, 6px);
      box-shadow: inset 0 1px 0 rgba(255,255,255,0.9), 0 4px 16px -6px rgba(255,255,255,0.25);
    }
    .auth-submit::before {
      content: ''; position: absolute; top: 0; left: -80%;
      width: 55%; height: 100%;
      background: linear-gradient(105deg, transparent, rgba(0,0,0,0.10), transparent);
      transform: skewX(-20deg);
      transition: left 0.6s var(--smooth);
      pointer-events: none;
    }
    .auth-submit:hover:not(:disabled)::before { left: 140%; }
    .auth-submit:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 10px 28px -10px rgba(255,255,255,0.28), inset 0 1px 0 rgba(255,255,255,0.9);
    }
    .auth-submit:active:not(:disabled) { transform: translateY(0) scale(0.98); }
    .auth-submit:disabled {
      opacity: 0.2;
      cursor: default;
    }
    .auth-submit.loading { pointer-events: none; }
    .auth-submit .auth-submit-label { transition: opacity 0.2s; }
    .auth-submit.loading .auth-submit-label { opacity: 0; }
""",
),
(
"""    .auth-divider::after {
      content: ''; position: absolute; inset: 0; top: 50%;
      z-index: 0;
      border-top: 1px solid var(--border);
    }
    .auth-divider span {
      position: relative; z-index: 1;
      background: var(--bg);
      padding: 0 12px;
      font-size: 0.72rem;
      color: var(--text-tertiary);
      text-transform: uppercase;
      letter-spacing: 0.06em;
    }
""",
"""    .auth-divider::after {
      content: ''; position: absolute; inset: 0; top: 50%;
      z-index: 0;
      height: 1px;
      background: linear-gradient(90deg, transparent, var(--border) 18%, var(--border) 82%, transparent);
    }
    .auth-divider span {
      position: relative; z-index: 1;
      background: var(--bg);
      padding: 0 12px;
      font-size: 0.66rem;
      color: var(--text-tertiary);
      text-transform: uppercase;
      letter-spacing: 0.16em;
      font-weight: 500;
    }
""",
),
(
"""    .auth-google-btn {
      display: flex; align-items: center; justify-content: center; gap: clamp(6px, 1vw, 10px);
      width: 100%; padding: clamp(10px, 1.5vh, 14px) clamp(12px, 2.5vw, 18px);
      border-radius: 10px;
      border: 1px solid var(--border);
      background: transparent;
      color: var(--text-secondary);
      font-family: inherit;
      font-size: clamp(0.8rem, 1.1vw, 0.9rem);
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s var(--bounce);
    }
    .auth-google-btn:hover {
      border-color: var(--border-light);
      color: var(--text);
      background: rgba(255,255,255,0.04);
      transform: translateY(-1px);
    }
    .auth-google-btn:active { transform: scale(0.97); }
    .auth-google-btn img, .auth-google-btn svg { width: 18px; height: 18px; }

    #googleButtonContainer {
      width: 100%; display: flex; justify-content: center;
      min-height: 36px;
    }
""",
"""    .auth-google-btn {
      position: relative;
      display: flex; align-items: center; justify-content: center; gap: clamp(8px, 1vw, 12px);
      width: 100%; padding: clamp(12px, 1.7vh, 16px) clamp(12px, 2.5vw, 18px);
      border-radius: 12px;
      border: 1px solid var(--border);
      background: linear-gradient(180deg, rgba(255,255,255,0.055), rgba(255,255,255,0.02));
      color: var(--text);
      font-family: inherit;
      font-size: clamp(0.82rem, 1.1vw, 0.92rem);
      font-weight: 500;
      cursor: pointer;
      overflow: hidden;
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      box-shadow: inset 0 1px 0 rgba(255,255,255,0.06);
      transition: all 0.3s var(--bounce);
    }
    .auth-google-btn::after {
      content: ''; position: absolute; top: 0; left: -80%;
      width: 55%; height: 100%;
      background: linear-gradient(105deg, transparent, rgba(255,255,255,0.09), transparent);
      transform: skewX(-20deg);
      transition: left 0.7s var(--smooth);
      pointer-events: none;
    }
    .auth-google-btn:hover::after { left: 140%; }
    .auth-google-btn:hover {
      border-color: rgba(255,255,255,0.22);
      background: linear-gradient(180deg, rgba(255,255,255,0.10), rgba(255,255,255,0.035));
      color: var(--text);
      transform: translateY(-2px);
      box-shadow: 0 12px 32px -14px rgba(255,255,255,0.22), inset 0 1px 0 rgba(255,255,255,0.09);
    }
    .auth-google-btn:active { transform: translateY(0) scale(0.98); }
    .auth-google-btn img, .auth-google-btn svg { width: 19px; height: 19px; flex-shrink: 0; transition: transform 0.4s var(--bounce); }
    .auth-google-btn:hover svg { transform: rotate(-8deg) scale(1.14); }
    .auth-google-btn .auth-btn-label { transition: opacity 0.2s; }
    .auth-google-btn.loading { pointer-events: none; opacity: 0.85; }
    .auth-google-btn.loading .auth-btn-label { opacity: 0; }
    .auth-guest-btn {
      opacity: 0.85;
      font-size: clamp(0.76rem, 1vw, 0.86rem);
      padding: clamp(10px, 1.5vh, 13px);
      border-radius: 10px;
    }
    .auth-guest-btn svg { opacity: 0.6; }
    .auth-guest-btn:hover { opacity: 1; }
    .auth-google-caption {
      display: flex; align-items: center; justify-content: center; gap: 5px;
      font-size: 0.62rem;
      color: var(--text-tertiary);
      margin-top: 9px;
      letter-spacing: 0.02em;
      opacity: 0.75;
    }
    .auth-google-caption svg { flex-shrink: 0; }

    /* Spinner (shared by submit / google / guest) */
    .spinner {
      position: absolute; left: 50%; top: 50%;
      width: 17px; height: 17px;
      margin: -8.5px 0 0 -8.5px;
      border: 2px solid rgba(0,0,0,0.20);
      border-top-color: rgba(0,0,0,0.85);
      border-radius: 50%;
      animation: spin 0.7s linear infinite;
      opacity: 0;
      pointer-events: none;
    }
    .loading > .spinner { opacity: 1; }
    .auth-google-btn .spinner {
      border-color: rgba(255,255,255,0.16);
      border-top-color: rgba(255,255,255,0.9);
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    .auth-submit:focus-visible,
    .auth-google-btn:focus-visible {
      outline: 2px solid rgba(255,255,255,0.4);
      outline-offset: 2px;
    }

    #googleButtonContainer {
      width: 100%; display: flex; justify-content: center;
      min-height: 36px;
    }
""",
),
(
"""    .auth-toggle {
      text-align: center;
      font-size: clamp(0.75rem, 1vw, 0.85rem);
      color: var(--text-tertiary);
      margin-top: clamp(4px, 0.8vh, 10px);
    }
    .auth-toggle button {
      background: none; border: none;
      color: var(--text-secondary);
      font-family: inherit;
      font-size: clamp(0.75rem, 1vw, 0.85rem);
      font-weight: 500;
      cursor: pointer;
      padding: 0 4px;
      transition: color 0.2s;
      text-decoration: underline;
      text-underline-offset: 2px;
    }
    .auth-toggle button:hover {
      color: var(--text);
    }
""",
"""    .auth-toggle {
      text-align: center;
      font-size: clamp(0.75rem, 1vw, 0.85rem);
      color: var(--text-tertiary);
      margin-top: clamp(10px, 1.4vh, 16px);
    }
    .auth-toggle button {
      background: none; border: none;
      color: var(--text-secondary);
      font-family: inherit;
      font-size: clamp(0.75rem, 1vw, 0.85rem);
      font-weight: 500;
      cursor: pointer;
      padding: 2px 4px;
      position: relative;
      transition: color 0.2s var(--smooth);
    }
    .auth-toggle button::after {
      content: '';
      position: absolute; left: 4px; right: 4px; bottom: 0;
      height: 1px;
      background: var(--text-secondary);
      transform: scaleX(0.3);
      opacity: 0;
      transition: all 0.3s var(--smooth);
    }
    .auth-toggle button:hover {
      color: var(--text);
    }
    .auth-toggle button:hover::after {
      transform: scaleX(1);
      opacity: 1;
    }
""",
),
(
"""    .auth-carousel-dot:hover {
      background: rgba(0,0,0,0.3);
    }
""",
"""    .auth-carousel-dot:hover {
      background: rgba(0,0,0,0.3);
    }

    /* Carousel autoplay progress */
    .auth-carousel-progress {
      position: absolute;
      bottom: 10px; left: 16px; right: 16px;
      height: 2px;
      border-radius: 2px;
      background: rgba(0,0,0,0.06);
      overflow: hidden;
      z-index: 3;
    }
    .auth-carousel-progress-bar {
      height: 100%;
      width: 0;
      border-radius: 2px;
      background: linear-gradient(90deg, rgba(0,0,0,0.28), rgba(0,0,0,0.55));
    }
    .auth-carousel-progress-bar.running {
      animation: carouselProgress var(--dur, 4s) linear forwards;
    }
    .auth-carousel-progress-bar.paused { animation-play-state: paused; }
    @keyframes carouselProgress {
      from { width: 0%; }
      to { width: 100%; }
    }

    /* Respect reduced-motion preferences */
    @media (prefers-reduced-motion: reduce) {
      .auth-left, .auth-right, .auth-reveal, .auth-swap,
      .auth-glow-1, .auth-glow-2, .auth-carousel-progress-bar.running,
      .auth-heading .hl-accent, .auth-input.invalid {
        animation: none !important;
        transition: none !important;
      }
      .auth-reveal { opacity: 1; }
    }
""",
),
(
"""    <div class="auth-left">
      <div class="auth-form-wrap">
""",
"""    <div class="auth-left">
      <div class="auth-glow auth-glow-1"></div>
      <div class="auth-glow auth-glow-2"></div>
      <div class="auth-form-wrap">
""",
),
(
"""        <div class="auth-brand">
""",
"""        <div class="auth-brand auth-reveal" style="--d:0.05s">
""",
),
(
"""        <h1 class="auth-heading" id="authHeading">Welcome <span class="hl-accent">back</span></h1>
        <p class="auth-sub" id="authSub">Enter your name to sign in to your account</p>
""",
"""        <h1 class="auth-heading auth-reveal" id="authHeading" style="--d:0.14s">Welcome <span class="hl-accent">back</span></h1>
        <p class="auth-sub auth-reveal" id="authSub" style="--d:0.22s">Enter your name to sign in to your account</p>
""",
),
(
"""        <div class="auth-fields">
""",
"""        <div class="auth-fields auth-reveal" style="--d:0.3s">
""",
),
(
"""          <button class="auth-submit" id="loginNameBtn" disabled>Sign In</button>
""",
"""          <button class="auth-submit" id="loginNameBtn" disabled>
            <span class="auth-submit-label">Sign In</span>
            <span class="spinner"></span>
          </button>
""",
),
(
"""              <span>Continue with Google</span>
            </button>
          </div>
""",
"""              <span class="auth-btn-label">Continue with Google</span>
              <span class="spinner"></span>
            </button>
            <div class="auth-google-caption">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
              <span>Secure sign-in · no password needed</span>
            </div>
          </div>
""",
),
(
"""          <button class="auth-google-btn" id="loginGuestBtn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:18px;height:18px;opacity:0.5"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            <span>Continue as Guest</span>
          </button>
""",
"""          <button class="auth-google-btn auth-guest-btn" id="loginGuestBtn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            <span class="auth-btn-label">Continue as Guest</span>
            <span class="spinner"></span>
          </button>
""",
),
(
"""        <p class="auth-toggle" id="authToggle">
""",
"""        <p class="auth-toggle auth-reveal" id="authToggle" style="--d:0.42s">
""",
),
(
"""        <button class="auth-carousel-dot" data-index="5"></button>
      </div>      <!-- Floating badges (outside carousel) -->
""",
"""        <button class="auth-carousel-dot" data-index="5"></button>
      </div>
      <!-- Autoplay progress -->
      <div class="auth-carousel-progress"><div class="auth-carousel-progress-bar" id="carouselProgress"></div></div>
      <!-- Floating badges (outside carousel) -->
""",
),
(
"""        // ─── Toggle Sign In / Sign Up ───
        function updateToggle() {
          var nameGroup = document.getElementById('loginNameGroup');
          if (isSignIn) {
            heading.innerHTML = 'Welcome <span class="hl-accent">back</span>';
            sub.textContent = 'Enter your email and password to sign in';
            nameBtn.textContent = 'Sign In';
            toggleText.innerHTML = "Don't have an account? <button id='authToggleBtn'>Sign up</button>";
            if (nameGroup) nameGroup.style.display = 'none';
          } else {
            heading.innerHTML = 'Create your <span class="hl-accent">account</span>';
            sub.textContent = 'Enter your details to get started';
            nameBtn.textContent = 'Sign Up';
            toggleText.innerHTML = "Already have an account? <button id='authToggleBtn'>Sign in</button>";
            if (nameGroup) nameGroup.style.display = 'block';
          }
        }
""",
"""        // ─── Toggle Sign In / Sign Up ───
        function setBtnLabel(btn, text) {
          if (!btn) return;
          var label = btn.querySelector('.auth-submit-label, .auth-btn-label');
          if (label) label.textContent = text;
          else btn.textContent = text;
        }
        function animateSwap(el) {
          if (!el) return;
          el.classList.remove('auth-swap');
          void el.offsetWidth;
          el.classList.add('auth-swap');
        }
        function updateToggle() {
          var nameGroup = document.getElementById('loginNameGroup');
          if (isSignIn) {
            heading.innerHTML = 'Welcome <span class="hl-accent">back</span>';
            sub.textContent = 'Enter your email and password to sign in';
            setBtnLabel(nameBtn, 'Sign In');
            toggleText.innerHTML = "Don't have an account? <button id='authToggleBtn'>Sign up</button>";
            if (nameGroup) nameGroup.style.display = 'none';
          } else {
            heading.innerHTML = 'Create your <span class="hl-accent">account</span>';
            sub.textContent = 'Enter your details to get started';
            setBtnLabel(nameBtn, 'Sign Up');
            toggleText.innerHTML = "Already have an account? <button id='authToggleBtn'>Sign in</button>";
            if (nameGroup) { nameGroup.style.display = 'block'; animateSwap(nameGroup); }
          }
          animateSwap(heading);
          animateSwap(sub);
        }
""",
),
(
"""        function updateBtn() {
          var valid = emailInput.value.trim() && passInput.value.length >= 6;
          if (!isSignIn) valid = valid && nameInput.value.trim();
          nameBtn.disabled = !valid;
        }
        updateBtn();
        emailInput.addEventListener('input', updateBtn);
        passInput.addEventListener('input', updateBtn);
        nameInput.addEventListener('input', updateBtn);
""",
"""        function syncInputState(input) {
          if (!input) return;
          var has = !!input.value.trim();
          input.classList.toggle('has-value', has);
          var group = input.closest('.auth-input-group');
          if (group) {
            var label = group.querySelector('.auth-label');
            if (label) label.classList.toggle('has-value', has);
          }
        }
        function shakeInput(input) {
          if (!input) return;
          input.classList.remove('invalid');
          void input.offsetWidth;
          input.classList.add('invalid');
          input.addEventListener('animationend', function h() {
            input.classList.remove('invalid');
            input.removeEventListener('animationend', h);
          });
        }
        function updateBtn() {
          var valid = emailInput.value.trim() && passInput.value.length >= 6;
          if (!isSignIn) valid = valid && nameInput.value.trim();
          nameBtn.disabled = !valid;
        }
        updateBtn();
        emailInput.addEventListener('input', function() { updateBtn(); syncInputState(emailInput); });
        passInput.addEventListener('input', function() { updateBtn(); syncInputState(passInput); });
        nameInput.addEventListener('input', function() { updateBtn(); syncInputState(nameInput); });
        syncInputState(emailInput); syncInputState(passInput);
""",
),
(
"""          if (!email || !password) { showToast('Please enter email and password', 'error'); return; }
          if (password.length < 6) { showToast('Password must be at least 6 characters', 'error'); return; }
          nameBtn.disabled = true;
          nameBtn.textContent = isSignIn ? 'Signing in…' : 'Creating account…';
""",
"""          if (!email || !password) { showToast('Please enter email and password', 'error'); shakeInput(document.getElementById('loginEmailInput')); return; }
          if (password.length < 6) { showToast('Password must be at least 6 characters', 'error'); shakeInput(document.getElementById('loginPasswordInput')); return; }
          nameBtn.disabled = true;
          nameBtn.classList.add('loading');
          setBtnLabel(nameBtn, isSignIn ? 'Signing in…' : 'Creating account…');
""",
),
(
"""            }).catch(function(error) {
              nameBtn.disabled = false;
              nameBtn.textContent = 'Sign In';
              if (error.code === 'auth/user-not-found') showToast('No account found with this email', 'error');
              else if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') showToast('Incorrect email or password', 'error');
              else if (error.code === 'auth/invalid-email') showToast('Invalid email address', 'error');
              else showToast('Sign in failed: ' + (error.message || 'unknown error'), 'error');
            });
""",
"""            }).catch(function(error) {
              nameBtn.disabled = false;
              nameBtn.classList.remove('loading');
              setBtnLabel(nameBtn, 'Sign In');
              if (error.code === 'auth/user-not-found') { showToast('No account found with this email', 'error'); shakeInput(document.getElementById('loginEmailInput')); }
              else if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') { showToast('Incorrect email or password', 'error'); shakeInput(document.getElementById('loginPasswordInput')); }
              else if (error.code === 'auth/invalid-email') { showToast('Invalid email address', 'error'); shakeInput(document.getElementById('loginEmailInput')); }
              else showToast('Sign in failed: ' + (error.message || 'unknown error'), 'error');
            });
""",
),
(
"""            }).catch(function(error) {
              nameBtn.disabled = false;
              nameBtn.textContent = 'Sign Up';
              if (error.code === 'auth/email-already-in-use') showToast('This email is already registered', 'error');
              else if (error.code === 'auth/weak-password') showToast('Password is too weak (min 6 characters)', 'error');
              else if (error.code === 'auth/invalid-email') showToast('Invalid email address', 'error');
              else showToast('Sign up failed: ' + (error.message || 'unknown error'), 'error');
            });
""",
"""            }).catch(function(error) {
              nameBtn.disabled = false;
              nameBtn.classList.remove('loading');
              setBtnLabel(nameBtn, 'Sign Up');
              if (error.code === 'auth/email-already-in-use') showToast('This email is already registered', 'error');
              else if (error.code === 'auth/weak-password') { showToast('Password is too weak (min 6 characters)', 'error'); shakeInput(document.getElementById('loginPasswordInput')); }
              else if (error.code === 'auth/invalid-email') { showToast('Invalid email address', 'error'); shakeInput(document.getElementById('loginEmailInput')); }
              else showToast('Sign up failed: ' + (error.message || 'unknown error'), 'error');
            });
""",
),
(
"""          // Update label
          var label = document.getElementById('carouselLabel');
          var idxEl = document.getElementById('carouselIndex');
          var names = ['Schedule', 'Hub', 'Finance', 'Analytics', 'Goals', 'Activities'];
          if (label) label.textContent = names[dotIndex];
          if (idxEl) idxEl.textContent = (dotIndex + 1) + ' / ' + REAL_SLIDE_COUNT;
""",
"""          // Update label
          var label = document.getElementById('carouselLabel');
          var idxEl = document.getElementById('carouselIndex');
          var names = ['Schedule', 'Hub', 'Finance', 'Analytics', 'Goals', 'Activities'];
          if (label) label.textContent = names[dotIndex];
          if (idxEl) idxEl.textContent = (dotIndex + 1) + ' / ' + REAL_SLIDE_COUNT;

          // Restart autoplay progress
          var progress = document.getElementById('carouselProgress');
          if (progress) {
            progress.classList.remove('running');
            void progress.offsetWidth;
            progress.style.setProperty('--dur', CAROUSEL_INTERVAL + 'ms');
            progress.classList.add('running');
          }
""",
),
(
"""          var carousel = document.querySelector('.auth-carousel');
          if (carousel) {
            carousel.addEventListener('mouseenter', function() {
              if (autoInterval) clearInterval(autoInterval);
              autoInterval = null;
            });
            carousel.addEventListener('mouseleave', function() {
              startAutoRotate();
            });
          }
""",
"""          var carousel = document.querySelector('.auth-carousel');
          var progressEl = document.getElementById('carouselProgress');
          if (carousel) {
            carousel.addEventListener('mouseenter', function() {
              if (autoInterval) clearInterval(autoInterval);
              autoInterval = null;
              if (progressEl) progressEl.classList.add('paused');
            });
            carousel.addEventListener('mouseleave', function() {
              startAutoRotate();
              if (progressEl) progressEl.classList.remove('paused');
            });
          }
""",
),
(
"""          var provider = new firebase.auth.GoogleAuthProvider();
          provider.addScope('profile');
          provider.addScope('email');
          firebase.auth().signInWithPopup(provider).then(function(result) {
""",
"""          var provider = new firebase.auth.GoogleAuthProvider();
          provider.addScope('profile');
          provider.addScope('email');
          googleBtn.classList.add('loading');
          firebase.auth().signInWithPopup(provider).then(function(result) {
""",
),
(
"""          }).catch(function(error) {
            if (error.code === 'auth/popup-closed-by-user') return;
            console.error('Firebase Google sign-in error:', error);
            showToast('Google sign-in failed: ' + (error.message || 'unknown error'), 'error');
          });
""",
"""          }).catch(function(error) {
            googleBtn.classList.remove('loading');
            if (error.code === 'auth/popup-closed-by-user') return;
            console.error('Firebase Google sign-in error:', error);
            showToast('Google sign-in failed: ' + (error.message || 'unknown error'), 'error');
          });
""",
),
(
"""            firebase.auth().signInAnonymously().then(function(result) {
""",
"""            guestBtn.classList.add('loading');
            firebase.auth().signInAnonymously().then(function(result) {
""",
),
(
"""            }).catch(function(error) {
              console.error('Firebase anonymous sign-in error:', error);
              showToast('Guest sign-in failed: ' + (error.message || 'unknown error'), 'error');
            });
""",
"""            }).catch(function(error) {
              guestBtn.classList.remove('loading');
              console.error('Firebase anonymous sign-in error:', error);
              showToast('Guest sign-in failed: ' + (error.message || 'unknown error'), 'error');
            });
""",
),
]


def main():
    with io.open(PATH, 'r', encoding='utf-8', newline='') as f:
        content = f.read()
    content = content.replace(CRLF, LF)

    count = 0
    missing = []
    for i, (old, new) in enumerate(REPLACEMENTS):
        if old not in content:
            missing.append(str(i))
            continue
        content = content.replace(old, new, 1)
        count += 1

    content = content.replace(LF, CRLF)

    with io.open(PATH, 'w', encoding='utf-8', newline='') as f:
        f.write(content)

    if missing:
        print('WARN: %d replacement(s) not found at indices: %s' % (len(missing), ','.join(missing)))
    print('Applied %d/%d replacements.' % (count, len(REPLACEMENTS)))


if __name__ == '__main__':
    main()
