/* Page loading state.
 *
 * <html class="pg-loading"> is baked into each page's markup, so the skeleton
 * rules in style.css apply from the very first paint — no JS needed to show
 * them. This file only decides when to take them away, and adds the thin top
 * bar that appears the instant a nav link is clicked.
 *
 * Timing rules:
 *   - never flash: hold the skeleton for at least MIN_MS from navigation start
 *   - never stick:  hard clear at MAX_MS even if a page forgets to signal
 */
(function () {
  'use strict';

  var MIN_MS = 300;
  var MAX_MS = 8000;
  var NAV_SAFETY_MS = 6000;

  function now() {
    return (window.performance && performance.now) ? performance.now() : Date.now();
  }

  var cleared = false;

  function clear() {
    var el = document.documentElement;
    if (!el || !el.classList.contains('pg-loading')) return;
    cleared = true;
    el.classList.remove('pg-loading');
    el.classList.remove('pg-ready');
  }

  window.pageReady = function () {
    if (cleared) return;
    var elapsed = now();
    var wait = MIN_MS - elapsed;
    if (wait > 0) setTimeout(clear, wait);
    else clear();
  };

  setTimeout(clear, MAX_MS);

  document.addEventListener('click', function (e) {
    var a = e.target && e.target.closest ? e.target.closest('a[href]') : null;
    if (!a) return;
    if (a.target === '_blank' || a.hasAttribute('download')) return;
    var href = a.getAttribute('href') || '';
    if (!href || href.charAt(0) === '#' || /^(mailto|tel|javascript):/i.test(href)) return;
    var url;
    try { url = new URL(href, location.href); } catch (err) { return; }
    if (url.origin !== location.origin) return;
    if (url.pathname === location.pathname && url.search === location.search) return;
    document.documentElement.classList.add('pg-nav');
    setTimeout(function () {
      document.documentElement.classList.remove('pg-nav');
    }, NAV_SAFETY_MS);
  }, true);

  window.addEventListener('pageshow', function (e) {
    if (!e.persisted) return;
    document.documentElement.classList.remove('pg-nav');
    clear();
  });
})();
