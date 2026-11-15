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
    if (menuOpen) {
      event.preventDefault();
      event.stopPropagation();
      closeMenu();
      return;
    }
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
      applyChick();
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

  /* ─── Live badge ─────────────────────────────────────────────
     "Thinking" only exists while a reply is in flight, so it lives in the
     header actions and is revealed purely by the data-ai-busy attribute the
     observer already maintains. No JS in the send path. */

  function wireLive() {
    var p = panel();
    if (!p) return;
    /* Anchored to the title/subtitle block, not the action row: it replaces the
       model name while a reply is in flight, so the header keeps its width. */
    var slot = p.querySelector('.ai-panel-header-left > div:last-child');
    if (!slot || slot.querySelector('.ai-live')) return;
    var badge = document.createElement('span');
    badge.className = 'ai-live';
    badge.textContent = 'Thinking';
    badge.setAttribute('aria-hidden', 'true');
    slot.appendChild(badge);
  }

  /* ─── Header overflow menu ───────────────────────────────────
     shared.js adds a reset button and a permissions button of its own, which
     made five icons in a 400px header — the close button was the smallest thing
     in a row of equals, and "clear all history" sat one stray click from the
     gear. Fold the two secondary actions into a menu; the originals stay in the
     DOM (hidden by CSS) so their existing click handlers keep working and the
     menu items just forward the click. */

  var menuOpen = false;

  function closeMenu() {
    var menu = document.querySelector('#' + PANEL_ID + ' .ai-menu');
    var btn = document.querySelector('#' + PANEL_ID + ' .ai-more');
    if (!menu || !menuOpen) return;
    menuOpen = false;
    menu.classList.remove('open');
    if (btn) btn.setAttribute('aria-expanded', 'false');
  }

  function toggleMenu(event) {
    var menu = document.querySelector('#' + PANEL_ID + ' .ai-menu');
    var btn = event.currentTarget;
    if (!menu) return;
    menuOpen = !menuOpen;
    menu.classList.toggle('open', menuOpen);
    btn.setAttribute('aria-expanded', menuOpen ? 'true' : 'false');
  }

  function forward(id) {
    var target = document.getElementById(id);
    closeMenu();
    if (target) target.click();
  }

  function buildMenu(actions) {
    var wrap = document.createElement('div');
    wrap.className = 'ai-menu-wrap';

    var more = document.createElement('button');
    more.type = 'button';
    more.className = 'ai-panel-icon-btn ai-more';
    more.title = 'More';
    more.setAttribute('aria-label', 'More actions');
    more.setAttribute('aria-haspopup', 'true');
    more.setAttribute('aria-expanded', 'false');
    more.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="19" cy="12" r="1.6"/></svg>';
    more.addEventListener('click', function (e) { e.stopPropagation(); toggleMenu(e); });

    var menu = document.createElement('div');
    menu.className = 'ai-menu';
    menu.setAttribute('role', 'menu');

    [
      { id: 'aiChatResetBtn', label: 'Clear chat history' },
      { id: 'aiPermBtn', label: 'What ChickBot can do' },
    ].forEach(function (item) {
      var row = document.createElement('button');
      row.type = 'button';
      row.className = 'ai-menu-item';
      row.setAttribute('role', 'menuitem');
      row.textContent = item.label;
      row.addEventListener('click', function () { forward(item.id); });
      menu.appendChild(row);
    });

    wrap.appendChild(more);
    wrap.appendChild(menu);
    actions.insertBefore(wrap, actions.querySelector('#aiChatClose'));
  }

  function wireOverflow() {
    var p = panel();
    if (!p) return;
    var actions = p.querySelector('.ai-panel-header-actions');
    if (!actions) return;
    if (!actions.querySelector('.ai-more')) buildMenu(actions);
    /* shared.js creates the reset/permissions buttons on the first open, which
       can land after this runs — re-check whenever the action row changes. */
    if (!actions.dataset.aiMenuObserved) {
      actions.dataset.aiMenuObserved = '1';
      new MutationObserver(function () {
        if (!actions.querySelector('.ai-more')) buildMenu(actions);
      }).observe(actions, { childList: true });
    }
  }

  document.addEventListener('click', function (event) {
    if (!menuOpen) return;
    if (event.target.closest('#' + PANEL_ID + ' .ai-menu-wrap')) return;
    closeMenu();
  });

  /* ─── Chick mark ─────────────────────────────────────────────
     Every bot avatar in the app is the same inline robot SVG, generated in a
     dozen places (panel header, message avatars, welcome card, footer hint).
     Rather than chase each generator, swap the paths inside the existing <svg>
     elements: same viewBox, same currentColor, so it scales and themes for free.
     Filled silhouette with the eyes punched out as holes — an outline version
     turned to mush at the 14px avatar size. */

  var CHICK =
    '<path fill-rule="evenodd" d="M11.2 20.8c-4.1 0-7.4-3.3-7.4-7.3s3.3-7.3 7.4-7.3 7.4 3.3 7.4 7.3-3.3 7.3-7.4 7.3z' +
    'M8.8 11.9a1.15 1.15 0 100 2.3 1.15 1.15 0 000-2.3z' +
    'M13 11.9a1.15 1.15 0 100 2.3 1.15 1.15 0 000-2.3z"/>' +
    '<path d="M17.6 13.2l3.6 1.9-3.6 1.9z"/>' +
    '<path d="M9.9 6.1C8.9 5 9 3.4 10.1 2.6c.7 1 .8 2.4.1 3.4z"/>' +
    '<path d="M12.5 6.1c1-1.1.9-2.7-.2-3.5-.7 1-.8 2.4-.1 3.4z"/>';

  function applyChick() {
    var svgs = document.querySelectorAll(
      '#' + PANEL_ID + ' .ai-panel-avatar svg,' +
      '#' + PANEL_ID + ' .ai-avatar svg,' +
      '#' + PANEL_ID + ' .ai-welcome-icon svg,' +
      '#' + PANEL_ID + ' .ai-panel-footer-hint svg'
    );
    for (var i = 0; i < svgs.length; i += 1) {
      var svg = svgs[i];
      if (svg.dataset.chick === '1') continue;
      svg.dataset.chick = '1';
      /* the originals are stroke-only; the mark is a fill, so both have to flip */
      svg.setAttribute('fill', 'currentColor');
      svg.setAttribute('stroke', 'none');
      svg.innerHTML = CHICK;
    }
  }

  /* ─── Header subtitle ────────────────────────────────────────
     shared.js writes "Nemotron 3.5 Lightning 30B (fast, recommended) · NVIDIA
     NIM", which cannot fit a 400px header and used to cut mid-word. Keep the
     model name, drop the parenthetical and the provider suffix (both are in the
     AI settings panel, and the full string stays in the title tooltip).
     Observing rather than rewriting once, because the provider can change. */

  function tidySubtitle() {
    var sub = document.querySelector('#' + PANEL_ID + ' .ai-panel-subtitle');
    if (!sub) return;
    var raw = sub.textContent;
    var short = raw.replace(/\s*\([^)]*\)/g, '').split(' \u00b7 ')[0].trim();
    if (short && short !== raw) sub.textContent = short;
  }

  function wireSubtitle() {
    var sub = document.querySelector('#' + PANEL_ID + ' .ai-panel-subtitle');
    if (!sub || sub.dataset.aiTidy === '1') return;
    sub.dataset.aiTidy = '1';
    tidySubtitle();
    new MutationObserver(tidySubtitle).observe(sub, { childList: true, characterData: true, subtree: true });
  }

  function boot() {
    wireComposer();
    wireBusy();
    wireHint();
    wireLive();
    wireOverflow();
    wireSubtitle();
    applyChick();
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
