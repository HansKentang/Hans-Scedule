/* ChickBot panel polish: keyboard shortcut, composer growth, busy state.
   Loaded after js/shared.js on every page that has #aiChatPanel.

   Deliberately additive. Nothing here replaces an existing behaviour: the
   shortcut calls the same showAIChat()/hideAIChat() the FAB uses, the composer
   growth only touches inline height, and the busy flag is a data attribute for
   CSS to read. If any of it fails the panel still works exactly as before. */

(function () {
  'use strict';

  var PANEL_ID = 'aiChatPanel';
  var INPUT_ID = 'aiChatInput';
  var MESSAGES_ID = 'aiChatMessages';

  function panel() { return document.getElementById(PANEL_ID); }
  function input() { return document.getElementById(INPUT_ID); }
  function messages() { return document.getElementById(MESSAGES_ID); }
  function isOpen() {
    var p = panel();
    return !!p && !p.classList.contains('hidden');
  }

  /* ─── Keyboard ───────────────────────────────────────────────
     Cmd/Ctrl+K opens the panel and drops the caret in the composer.
     Esc releases the composer first, and only closes the panel when the
     composer is not focused — so a long draft is never lost to one keypress. */

  function isMac() {
    return /mac|iphone|ipad/i.test(navigator.platform || navigator.userAgent);
  }

  function focusInput() {
    var el = input();
    if (!el) return;
    try { el.focus({ preventScroll: true }); } catch (e) { el.focus(); }
    var end = el.value.length;
    try { el.setSelectionRange(end, end); } catch (e) { /* ignore */ }
  }

  function openAndFocus() {
    if (!isOpen()) {
      if (typeof window.showAIChat !== 'function') return;
      window.showAIChat();
    }
    // showAIChat bails out when the premium gate or the missing-key screen
    // applies; only steal focus if the panel actually opened.
    setTimeout(function () { if (isOpen()) focusInput(); }, 90);
  }

  /* Capture phase on purpose. js/shared.js owns a bubble-phase Escape handler
     that closes the whole panel; running first lets this release the composer
     without the panel ever seeing the key. Every other Escape falls through
     untouched, so the existing close behaviour is unchanged. */
  document.addEventListener('keydown', function (event) {
    var key = (event.key || '').toLowerCase();
    if ((event.metaKey || event.ctrlKey) && !event.altKey && key === 'k') {
      event.preventDefault();
      openAndFocus();
      return;
    }
    if (event.key !== 'Escape') return;
    var el = input();
    if (!el || document.activeElement !== el) return;
    event.preventDefault();
    event.stopPropagation();
    el.blur();
  }, true);

  /* ─── Composer growth ────────────────────────────────────────
     Grow to the content, cap at ~6 lines, then scroll. Same 132px ceiling the
     CSS max-height uses, so the two never disagree. */

  var MAX_INPUT_HEIGHT = 132;

  function grow() {
    var el = input();
    /* Older copies of the composer markup were a single-line <input>, which
       ignores content height — writing one on it would just stretch the box. */
    if (!el || el.tagName !== 'TEXTAREA') return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, MAX_INPUT_HEIGHT) + 'px';
  }

  function wireComposer() {
    var el = input();
    if (!el || el.dataset.aiPolishWired === '1') return;
    el.dataset.aiPolishWired = '1';
    el.addEventListener('input', grow);
    grow();
  }

  /* ─── Busy state + streaming caret ───────────────────────────
     The panel already appends a .ai-typing bubble while waiting and then
     rewrites it in place. A MutationObserver turns that into a data attribute
     so CSS can pulse the status dot and draw a caret without the send path
     needing to know about presentation. */

  var observer = null;

  function syncBusy() {
    var p = panel();
    var list = messages();
    if (!p || !list) return;
    /* Two shapes of "working": the three dots before the first token, and the
       blinking .ai-cursor span once text starts arriving. shared.js swaps the
       first for the second in place, so both have to count. */
    var busy = !!list.querySelector('.ai-typing, .ai-cursor');
    if (busy) p.setAttribute('data-ai-busy', 'true');
    else p.removeAttribute('data-ai-busy');

    /* The typing bubble is itself a .ai-message-assistant > .ai-bubble, so it
       has to be excluded or the dots would also get the streaming ring. */
    var bubbles = list.querySelectorAll('.ai-message-assistant .ai-bubble');
    for (var i = 0; i < bubbles.length; i += 1) bubbles[i].classList.remove('is-streaming');
    if (!busy) return;
    for (var j = bubbles.length - 1; j >= 0; j -= 1) {
      if (bubbles[j].querySelector('.ai-typing')) continue;
      bubbles[j].classList.add('is-streaming');
      break;
    }
  }

  function wireBusy() {
    var list = messages();
    if (!list || observer) return;
    observer = new MutationObserver(function () {
      syncBusy();
      keepPinned();
    });
    observer.observe(list, { childList: true, subtree: true, characterData: true });
    syncBusy();
  }

  /* Keep the newest text in view while a reply streams, but never yank the
     viewport if the user has scrolled up to read something. */
  function keepPinned() {
    var list = messages();
    if (!list) return;
    var body = list.closest('.ai-panel-body') || list.parentElement;
    if (!body) return;
    var distance = body.scrollHeight - body.scrollTop - body.clientHeight;
    if (distance > 200) return;
    body.scrollTop = body.scrollHeight;
  }

  /* ─── Shortcut hint ──────────────────────────────────────────
     Injected rather than hard-coded into eight HTML files, and it reflects the
     actual modifier for the platform. */

  function wireHint() {
    var footer = document.querySelector('#' + PANEL_ID + ' .ai-panel-footer-hint');
    if (!footer || footer.querySelector('.ai-kbd')) return;
    var hint = document.createElement('span');
    hint.className = 'ai-kbd';
    hint.setAttribute('aria-hidden', 'true');
    var mod = document.createElement('kbd');
    mod.textContent = isMac() ? '\u2318' : 'Ctrl';
    var k = document.createElement('kbd');
    k.textContent = 'K';
    hint.appendChild(mod);
    hint.appendChild(k);
    footer.appendChild(hint);
  }

  function boot() {
    wireComposer();
    wireBusy();
    wireHint();
    syncBusy();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

  // Pages rebuild the panel footer on some navigations; re-check cheaply.
  window.addEventListener('pageshow', boot);
})();
