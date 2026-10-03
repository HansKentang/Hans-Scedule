/* Havën Schedule — Premium / billing client
   Loaded AFTER shared.js + supabase.js + gsi.js, on every page.

   Responsibilities:
     • hold the user's entitlement (server is the source of truth, cached locally
       so gates still work offline)
     • render the upgrade sheet, pricing page and Pro badge
     • start checkout through a provider adapter (mock now, Paddle/Dodo later)

   Public API:
     isPremium()                  → boolean
     getPremium()                 → { premium, plan, until, ... }
     hasAccess('ai')              → boolean, false when the gate is enforced
     requirePremium('ai')         → true if allowed, else shows the sheet
     premiumCheckout('yearly')    → opens checkout
     premiumPortal()              → opens the provider's customer portal
     openPremiumSheet()           → opens the upgrade sheet
*/

var PREMIUM_CACHE_KEY_PREFIX = 'haven-premium-';
var _premium = { premium: false, plan: null, interval: null, status: null, provider: null, until: null, cancel_at_period_end: false, checkedAt: 0 };
var _premiumUnsubscribe = null;
var _premiumBusy = false;

function premiumUserId() {
  try {
    if (typeof state !== 'undefined' && state.currentUserId) return state.currentUserId;
  } catch (e) {}
  return null;
}

function _premiumCacheKey() {
  return PREMIUM_CACHE_KEY_PREFIX + (premiumUserId() || 'guest');
}

function premiumLoadCache() {
  try {
    var raw = localStorage.getItem(_premiumCacheKey());
    if (raw) {
      var parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') _premium = Object.assign(_premium, parsed);
    }
  } catch (e) {}
  return _premium;
}

function premiumSaveCache() {
  try {
    _premium.checkedAt = Date.now();
    localStorage.setItem(_premiumCacheKey(), JSON.stringify(_premium));
  } catch (e) {}
}

function getPremium() { return _premium; }

function isPremium() { return _premium.premium === true; }

/* ─── Access checks ──────────────────────────────────────── */

function premiumFeatureConfig(featureKey) {
  if (typeof PREMIUM_FEATURES === 'undefined') return null;
  return PREMIUM_FEATURES[featureKey] || null;
}

/* True when the user may use this feature. Returns true when the gate exists
   but is not enforced, so flipping `enforce` in premium-config.js is all it
   takes to turn gating on or off. */
function hasAccess(featureKey) {
  var cfg = premiumFeatureConfig(featureKey);
  if (!cfg) return true;
  /* Gate defined but not enforced = "Pro badge only" mode. */
  if (!cfg.enforce) return true;
  return isPremium();
}

/* Guard a gated action. Returns true when the caller should continue. */
function requirePremium(featureKey, opts) {
  if (hasAccess(featureKey)) return true;
  openPremiumSheet(opts && opts.reason ? opts.reason : null, featureKey);
  return false;
}

/* Free-plan numeric limits (custom tags, widgets, analytics range). */
function premiumLimit(name) {
  var limits = (typeof PREMIUM_CONFIG !== 'undefined' && PREMIUM_CONFIG.freeLimits) || {};
  return limits[name];
}

/* ─── Presentation + test-mode helpers ───────────────────── */

/* True while no real payment provider is connected, so the whole paid flow can
   be exercised without charging anyone. */
function premiumIsTestMode() {
  if (typeof PREMIUM_CONFIG === 'undefined' || !PREMIUM_CONFIG) return false;
  return PREMIUM_CONFIG.provider === 'mock' || PREMIUM_CONFIG.mode === 'test';
}

function premiumProviderLabel() {
  if (typeof PREMIUM_CONFIG === 'undefined' || !PREMIUM_CONFIG) return 'a payment provider';
  if (PREMIUM_CONFIG.provider === 'paddle') return 'Paddle';
  if (PREMIUM_CONFIG.provider === 'dodo') return 'Dodo Payments';
  return 'test mode';
}

function premiumTick() {
  return '<svg class="premium-tick" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>';
}

function premiumCmpIcon(on) {
  return on
    ? '<svg class="premium-cmp-icon is-on" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>'
    : '<svg class="premium-cmp-icon is-off" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
}

function premiumStarIcon() {
  return '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 2l2.9 6.3 6.9.8-5.1 4.7 1.4 6.8L12 17.3 5.9 20.6l1.4-6.8L2.2 9.1l6.9-.8z"/></svg>';
}

/* Per-month equivalent so the yearly card can be compared at a glance. */
function premiumPlanPerMonth(planId) {
  var plan = premiumPlan(planId);
  if (!plan || plan.interval !== 'year') return '';
  var price = plan.prices[premiumRegion()] || plan.prices.DEFAULT;
  var per = price.amount / 12;
  if (price.currency === 'IDR') return 'Rp ' + Math.round(per).toLocaleString('id-ID') + '/mo';
  var dollars = per / 100;
  return '$' + (dollars % 1 === 0 ? dollars.toFixed(0) : dollars.toFixed(2)) + '/mo';
}

/* Visible, honest badge so nobody thinks a test activation is a real purchase. */
function premiumTestChip(label) {
  if (!premiumIsTestMode()) return '';
  return '<span class="premium-test-chip" title="Test mode — nothing is charged. Real payments begin once ' +
    escapeHtml(premiumProviderLabel()) + ' is connected."><span class="premium-test-dot"></span>' +
    escapeHtml(label || 'Test mode') + '</span>';
}

/* The four enforced gates, described the same way in the sheet, the pricing page
   and the locked states. Free-side numbers come from PREMIUM_CONFIG.freeLimits
   so the copy can never drift from the code. */
function premiumCompareRows() {
  var widgets = premiumLimit('widgetsPerCanvas');
  var days = premiumLimit('analyticsRangeDays');
  var rows = [
    { label: 'AI assistant', free: 'Not included', freeOk: false, pro: 'Chat, schedule suggestions and daily plans' },
    { label: 'Advanced analytics', free: days ? 'Last ' + days + ' days' : 'Not included', freeOk: days > 0, pro: 'Full history, trends, streaks and sleep insight' },
    { label: 'Custom tags and widgets', free: (widgets ? widgets + ' widgets' : 'Built-in tags only') + ', no custom tags', freeOk: false, pro: 'No caps on tags, categories or widgets' },
    { label: 'Export and screenshots', free: 'Not included', freeOk: false, pro: 'Week screenshot, copy week, JSON export and import' }
  ];
  return rows;
}

/* Shared locked-state markup for gated panels (analytics, hub canvas, ...). */
function premiumLockCardHtml(featureKey, opts) {
  var feat = premiumFeatureConfig(featureKey) || {};
  var test = premiumIsTestMode();
  var label = feat.label || 'This feature';
  var reason = (opts && opts.reason) || null;
  var bullets = (opts && opts.bullets) || feat.bullets || [];
  var ticks = bullets.length
    ? '<ul class="premium-lock-ticks">' + bullets.map(function(b) {
        return '<li>' + premiumTick() + '<span>' + escapeHtml(b) + '</span></li>';
      }).join('') + '</ul>'
    : '';
  return '' +
    '<span class="premium-lock-icon" aria-hidden="true">' + premiumStarIcon() + '</span>' +
    '<span class="premium-lock-kicker">Premium</span>' +
    '<h3>' + escapeHtml(reason || label + ' is a Premium feature') + '</h3>' +
    '<p>' + escapeHtml(feat.blurb || 'Unlock this and everything else in Premium.') + '</p>' +
    ticks +
    (test ? '<div class="premium-lock-test">' + premiumTestChip('Test mode — activation is instant and free') + '</div>' : '') +
    '<div class="premium-lock-actions">' +
      '<button class="premium-cta" type="button" data-premium-action="upgrade">' +
        (test ? 'Activate Premium (free in test mode)' : 'Unlock ' + escapeHtml(label)) + '</button>' +
      '<a class="premium-cta secondary" href="premium.html">Compare plans</a>' +
    '</div>' +
    '<p class="premium-lock-footnote">Your schedules, habits, goals and history stay yours — nothing is deleted when Premium ends.</p>';
}

/* ─── Gating a whole panel ─────────────────────────────────
   premiumLockPanel() puts the lock card above a region and veils the region
   itself, so the user still sees a blurred preview of their own data instead of
   an empty page. premiumUnlockPanel() is the exact inverse, so both can be
   called on every render. */
function premiumLockPanel(region, featureKey, opts) {
  if (!region || !region.nodeType || !region.parentNode) return false;
  opts = opts || {};
  premiumUnlockPanel(region);

  var card = document.createElement('div');
  card.className = 'premium-lock-card';
  card.setAttribute('data-premium-lock', featureKey || 'true');
  card.innerHTML = premiumLockCardHtml(featureKey, opts);

  var cta = card.querySelector('.premium-cta[data-premium-action="upgrade"]');
  if (cta) {
    cta.addEventListener('click', function() {
      openPremiumSheet(opts.reason || null, featureKey || null);
    });
  }

  region.parentNode.insertBefore(card, region);
  region.classList.add('premium-locked-region');
  region.setAttribute('aria-hidden', 'true');
  if ('inert' in region) region.inert = true;
  return true;
}

function premiumUnlockPanel(region) {
  if (!region || !region.nodeType || !region.parentNode) return false;
  var removed = false;
  region.classList.remove('premium-locked-region');
  region.removeAttribute('aria-hidden');
  if ('inert' in region) region.inert = false;
  Array.prototype.slice.call(region.parentNode.children).forEach(function(el) {
    if (el !== region && el.hasAttribute && el.hasAttribute('data-premium-lock')) { el.remove(); removed = true; }
  });
  Array.prototype.slice.call(region.children).forEach(function(el) {
    if (el.hasAttribute && el.hasAttribute('data-premium-lock')) { el.remove(); removed = true; }
  });
  return removed;
}

/* ─── Sync with Supabase ─────────────────────────────────── */

function premiumRefresh() {
  var uid = premiumUserId();
  if (!uid) { _premium.premium = false; premiumSaveCache(); renderPremiumState(); return Promise.resolve(_premium); }

  var sb = typeof getSupabaseDb === 'function' ? getSupabaseDb() : null;
  if (!sb) { renderPremiumState(); return Promise.resolve(_premium); }

  return sb.rpc('premium_status', { p_user_id: uid }).then(function(res) {
    if (!res.error && res.data) {
      var d = res.data;
      _premium = {
        premium: d.premium === true,
        plan: d.plan || null,
        interval: d.interval || null,
        status: d.status || null,
        provider: d.provider || null,
        until: d.until || null,
        cancel_at_period_end: d.cancel_at_period_end === true,
        checkedAt: Date.now()
      };
      premiumSaveCache();
      renderPremiumState();
    }
    return _premium;
  }).catch(function() {
    /* Offline: keep whatever is cached. */
    return _premium;
  });
}

/* Live updates so an upgrade on one device unlocks the others. */
function premiumWatch() {
  if (_premiumUnsubscribe || typeof sbWatch !== 'function') return;
  _premiumUnsubscribe = sbWatch('subscriptions', function() { premiumRefresh(); });
}

function premiumStart() {
  premiumLoadCache();
  renderPremiumState();
  premiumInjectNav();
  premiumRefresh();
  premiumWatch();
  if (document.getElementById('premiumPageRoot')) renderPremiumPage();
  return premiumRefresh();
}

/* ─── Checkout ───────────────────────────────────────────── */

function premiumBillingUrl(path) {
  var base = (PREMIUM_CONFIG.billingEndpoint || '').replace(/\/+$/, '');
  return base + path;
}

function premiumCheckout(planId) {
  if (_premiumBusy) return Promise.resolve(null);
  var plan = premiumPlan(planId);
  if (!plan) { showToast('Unknown plan', 'error'); return Promise.resolve(null); }
  if (!premiumUserId()) {
    showToast('Sign in first to upgrade', 'info');
    setTimeout(function() { location.href = 'login.html'; }, 900);
    return Promise.resolve(null);
  }

  if (PREMIUM_CONFIG.provider === 'mock') return premiumMockCheckout(plan);

  _premiumBusy = true;
  premiumSetButtonState(true, 'Opening checkout...');

  return fetch(premiumBillingUrl('/checkout'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      user_id: premiumUserId(),
      plan: plan.id,
      interval: plan.interval,
      provider: PREMIUM_CONFIG.provider,
      price_id: (plan.priceId && plan.priceId[PREMIUM_CONFIG.provider]) || '',
      return_url: location.origin + '/' + PREMIUM_CONFIG.returnUrl
    })
  }).then(function(r) { return r.json(); }).then(function(data) {
    _premiumBusy = false;
    premiumSetButtonState(false);
    if (data && data.url) { location.href = data.url; return data; }
    showToast((data && data.error) || 'Could not start checkout', 'error');
    return null;
  }).catch(function() {
    _premiumBusy = false;
    premiumSetButtonState(false);
    showToast('Could not reach billing. Check your connection.', 'error');
    return null;
  });
}

/* Mock adapter — completes the purchase in the browser so the whole flow can be
   tested before a Paddle/Dodo account exists. Writes a real subscriptions row,
   so the entitlement behaves exactly like a live one. */
function premiumMockCheckout(plan) {
  var sb = typeof getSupabaseDb === 'function' ? getSupabaseDb() : null;
  if (!sb) { showToast('Database not configured', 'error'); return Promise.resolve(null); }

  var uid = premiumUserId();
  var now = new Date();
  var end = new Date(now.getTime());
  if (plan.interval === 'year') end.setFullYear(end.getFullYear() + 1);
  else end.setMonth(end.getMonth() + 1);

  var regionPrice = plan.prices[premiumRegion()] || plan.prices.DEFAULT;

  _premiumBusy = true;
  premiumSetButtonState(true, 'Processing (test mode)...');

  var subRow = {
    user_id: uid,
    provider: 'mock',
    plan: plan.id,
    interval: plan.interval,
    status: 'active',
    price_id: 'mock_' + plan.id,
    currency: regionPrice.currency,
    amount_cents: regionPrice.amount,
    provider_subscription_id: 'mock_sub_' + uid + '_' + Date.now(),
    current_period_start: now.toISOString(),
    current_period_end: end.toISOString()
  };
  var ordRow = {
    user_id: uid,
    provider: 'mock',
    plan: plan.id,
    status: 'paid',
    currency: regionPrice.currency,
    amount_cents: regionPrice.amount,
    provider_order_id: 'mock_order_' + uid + '_' + Date.now()
  };
  try {
    var au = null;
    if (typeof cloudActiveUser === 'function') au = cloudActiveUser();
    else if (typeof localUsers !== 'undefined') {
      for (var i = 0; i < localUsers.length; i++) {
        if (localUsers[i] && localUsers[i].id === uid && localUsers[i].authUid) { au = localUsers[i]; break; }
      }
    }
    if (au && au.authUid) { subRow.auth_uid = au.authUid; ordRow.auth_uid = au.authUid; }
  } catch (e) {}
  return sb.from('subscriptions').insert(subRow).then(function(res) {
    _premiumBusy = false;
    premiumSetButtonState(false);
    if (res.error) { showToast('Test checkout failed: ' + res.error.message, 'error'); return null; }
    return sb.from('orders').insert(ordRow).then(function() {
      return premiumRefresh().then(function() {
        premiumSheetSetView('success', {
          mode: 'activated',
          planLabel: plan.label + ' plan',
          price: premiumPriceLabel(plan.id, premiumRegion()) + ' per ' + (plan.interval === 'year' ? 'year' : 'month'),
          until: premiumUntilLabel()
        });
        showToast('Test mode: ' + plan.label + ' plan activated — no charge was made', 'success', 3200);
        return getPremium();
      });
    });
  }).catch(function(e) {
    _premiumBusy = false;
    premiumSetButtonState(false);
    showToast('Test checkout failed', 'error');
    return null;
  });
}

function premiumPortal() {
  if (!isPremium()) { openPremiumSheet(); return Promise.resolve(null); }
  if (PREMIUM_CONFIG.provider === 'mock') {
    showToast('Test mode: no billing portal. Use Manage plan to cancel.', 'info', 3000);
    return Promise.resolve(null);
  }
  return fetch(premiumBillingUrl('/portal'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: premiumUserId(), return_url: location.origin + '/' + PREMIUM_CONFIG.returnUrl })
  }).then(function(r) { return r.json(); }).then(function(data) {
    if (data && data.url) { location.href = data.url; return data; }
    showToast((data && data.error) || 'Could not open billing portal', 'error');
    return null;
  }).catch(function() { showToast('Could not reach billing', 'error'); return null; });
}

function premiumCancel(planId) {
  var sb = typeof getSupabaseDb === 'function' ? getSupabaseDb() : null;
  var uid = premiumUserId();
  if (!sb || !uid) return Promise.resolve(null);
  return sb.from('subscriptions')
    .update({ status: 'canceled', cancel_at_period_end: true, canceled_at: new Date().toISOString() })
    .eq('user_id', uid)
    .eq('status', 'active')
    .then(function(res) {
      if (res.error) { showToast('Could not cancel: ' + res.error.message, 'error'); return null; }
      showToast('Premium canceled — active until the end of the period', 'info', 3500);
      return premiumRefresh();
    });
}

/* ─── Formatting helpers ─────────────────────────────────── */

function premiumUntilLabel() {
  if (!_premium.until) return '';
  try {
    return new Date(_premium.until).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
  } catch (e) { return ''; }
}

function premiumPlanLabel() {
  if (!isPremium()) return 'Free';
  var plan = premiumPlan(_premium.plan);
  return plan ? plan.label : 'Premium';
}

function premiumRefreshStatus() {
  return premiumRefresh().then(function() {
    if (typeof showToast === 'function') showToast('Premium status refreshed', 'info', 1600);
    if (document.getElementById('premiumPageRoot')) renderPremiumPage();
    return getPremium();
  });
}

/* Removes the test subscription so the whole purchase flow can be replayed.
   RLS only allows this for the owner's own 'mock' rows. */
function premiumResetSubscription() {
  var sb = typeof getSupabaseDb === 'function' ? getSupabaseDb() : null;
  var uid = premiumUserId();
  if (!sb || !uid) return Promise.resolve(null);
  return sb.from('subscriptions').delete().eq('user_id', uid).then(function(res) {
    if (res.error) {
      showToast('Could not reset: ' + res.error.message, 'error');
      return null;
    }
    _premium = { premium: false, plan: null, interval: null, status: null, provider: null, until: null, cancel_at_period_end: false, checkedAt: Date.now() };
    premiumSaveCache();
    renderPremiumState();
    showToast('Test subscription removed — you are back on Free', 'info', 3000);
    return null;
  });
}

/* Inline confirmation state for destructive plan actions. Native confirm() is
   avoided so the flow stays inside the page on every device. */
var _premiumConfirm = null;

function premiumConfirmAsk(what) {
  _premiumConfirm = what;
  renderPremiumPage();
}

function premiumConfirmDrop() {
  _premiumConfirm = null;
  renderPremiumPage();
}

function premiumConfirmRun() {
  var what = _premiumConfirm;
  _premiumConfirm = null;
  if (what === 'reset') return premiumResetSubscription().then(function() { renderPremiumPage(); });
  if (what !== 'cancel') return Promise.resolve(null);
  return premiumCancel().then(function() { renderPremiumPage(); });
}

function premiumFaqHtml() {
  var test = premiumIsTestMode();
  var items = [
    { q: 'Does Premium charge me right now?', a: test
        ? 'No. This build runs in test mode with no payment provider connected, so activating Premium costs nothing and no card is stored. The subscription row is written exactly like a real one, which is why you can cancel and re-activate freely.'
        : 'Checkout is handled by ' + premiumProviderLabel() + '. You can cancel any time and keep access until the end of the period you paid for.' },
    { q: 'What happens when I cancel?', a: 'You keep every Premium feature until the end of the current period. After that the four Premium features lock again — your schedules, habits, goals and history stay exactly as they are.' },
    { q: 'Do I need an account?', a: 'Yes. Premium is attached to your profile so it follows you to every device, and it needs a signed-in session so the entitlement can be verified.' },
    { q: 'Is my data deleted if Premium ends?', a: 'No. Havën is local-first: everything stays in your browser even when you are signed out, and signing in keeps a copy in sync.' },
    { q: 'Which payment providers are planned?', a: 'Paddle and Dodo Payments. Both are already wired into the billing function — only the provider keys and the live-mode switch are missing.' },
    { q: 'Can I re-activate after cancelling?', a: 'Yes. Pick a plan again' + (test ? ' and it activates instantly in test mode.' : ' and checkout starts a new subscription.') }
  ];
  if (test) {
    items.push({ q: 'How do I reset the test subscription?', a: 'Use "Reset test subscription" in the plan actions above. It deletes the test subscription row and returns you to Free so you can replay the flow.' });
  }
  return items.map(function(it) {
    return '<details><summary>' + escapeHtml(it.q) + '</summary><p>' + escapeHtml(it.a) + '</p></details>';
  }).join('');
}

/* ─── Badge + nav ────────────────────────────────────────── */

function premiumSyncNavChip() {
  var item = document.querySelector('.hub-snav-premium');
  if (!item) return;
  var active = isPremium();
  var chip = item.querySelector('.premium-nav-chip');
  var dot = item.querySelector('.premium-nav-dot');
  if (chip) {
    chip.hidden = !active;
    chip.textContent = active ? 'PRO' : '';
    chip.title = active ? premiumPlanLabel() + ' plan active' : '';
  }
  if (dot) dot.style.display = active ? 'none' : '';
  item.title = active ? premiumPlanLabel() + ' plan active' : 'Upgrade to Premium';
}

var _premiumStateSignature = null;

/* Pages that render gated panels subscribe to this instead of polling
   premiumRefresh(). Only fires when the entitlement actually changed, so a
   normal page load does not trigger a second render. */
function premiumDispatchChange() {
  var sig = isPremium() ? 'pro:' + (_premium.plan || 'plan') : 'free:' + (_premium.status || 'none');
  var changed = _premiumStateSignature !== null && _premiumStateSignature !== sig;
  _premiumStateSignature = sig;
  if (!changed) return;
  try { document.dispatchEvent(new CustomEvent('premium:change', { detail: getPremium() })); } catch (e) {}
}

function renderPremiumState() {
  var active = isPremium();
  document.body.classList.toggle('has-premium', active);
  document.body.classList.toggle('premium-test-mode', premiumIsTestMode());
  document.querySelectorAll('.premium-badge').forEach(function(el) {
    el.style.display = active ? '' : 'none';
  });
  document.querySelectorAll('[data-premium-state]').forEach(function(el) {
    el.textContent = active ? premiumPlanLabel() : 'Free plan';
    el.classList.toggle('is-premium', active);
    el.title = active ? 'Premium active — ' + premiumPlanLabel() + ' plan' : 'Free plan';
  });
  premiumSyncNavChip();
  var heroSub = document.getElementById('premiumHeroSub');
  if (heroSub) {
    heroSub.textContent = active
      ? 'Your ' + premiumPlanLabel() + ' plan is active'
      : (premiumIsTestMode() ? 'Compare Free and Premium — activation is free in test mode' : 'Unlock everything Havën can do');
  }
  if (document.getElementById('premiumPageRoot')) renderPremiumPage();
  premiumDispatchChange();
}

function premiumInjectNav() {
  var stagger = document.querySelector('.hub-snav-stagger');
  if (!stagger) return;
  if (stagger.querySelector('.hub-snav-premium')) return;

  var a = document.createElement('a');
  a.href = 'premium.html';
  a.className = 'hub-snav-item hub-snav-premium';
  a.innerHTML =
    '<span class="snav-icon">' +
      '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
        '<path d="M12 2l2.9 6.3 6.9.8-5.1 4.7 1.4 6.8L12 17.3 5.9 20.6l1.4-6.8L2.2 9.1l6.9-.8z"/>' +
      '</svg>' +
    '</span>' +
    '<span class="snav-label">Premium</span>' +
    '<span class="premium-nav-chip" hidden></span>' +
    '<span class="premium-nav-dot"></span>';
  stagger.appendChild(a);
  premiumSyncNavChip();

  var currentPage = location.pathname.split('/').pop() || 'index.html';
  if (currentPage === 'premium.html') a.classList.add('active');
}

/* ─── Upgrade sheet ──────────────────────────────────────── */

/* Sheet chrome is shared by the plans view and the success view, so swapping
   views keeps the drag handle, the close button and the dialog semantics. */
function premiumSheetShell(innerHtml) {
  return '' +
    '<div class="premium-sheet-backdrop" data-premium-close></div>' +
    '<div class="premium-sheet" role="dialog" aria-modal="true" aria-labelledby="premiumSheetTitle" aria-describedby="premiumSheetSub">' +
      '<span class="premium-sheet-handle" aria-hidden="true"></span>' +
      '<button class="premium-sheet-close" data-premium-close aria-label="Close">' +
        '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>' +
      '</button>' +
      innerHtml +
    '</div>';
}

function premiumPlanCardsHtml(active) {
  var region = premiumRegion();
  return PREMIUM_PLANS.map(function(plan) {
    var isCurrent = active && _premium.plan === plan.id;
    var perMonth = premiumPlanPerMonth(plan.id);
    return '' +
      '<button class="premium-plan-card' + (plan.highlight ? ' is-highlight' : '') + (isCurrent ? ' is-current' : '') +
        '" data-plan="' + plan.id + '"' + (isCurrent ? ' disabled' : '') +
        ' aria-label="' + escapeHtml((isCurrent ? 'Current plan: ' : 'Choose the ') + plan.label + ' plan, ' +
          premiumPriceLabel(plan.id, region) + ' per ' + (plan.interval === 'year' ? 'year' : 'month')) + '">' +
        (plan.badge ? '<span class="premium-plan-badge">' + escapeHtml(plan.badge) + '</span>' : '') +
        '<span class="premium-plan-name">' + escapeHtml(plan.label) + '</span>' +
        '<span class="premium-plan-price">' + premiumPriceLabel(plan.id, region) +
          '<small>/' + (plan.interval === 'year' ? 'yr' : 'mo') + '</small></span>' +
        (perMonth ? '<span class="premium-plan-permonth">' + escapeHtml(perMonth) + '</span>' : '') +
        '<span class="premium-plan-blurb">' + (isCurrent ? 'Your current plan' : escapeHtml(plan.blurb)) + '</span>' +
      '</button>';
  }).join('');
}

function premiumSheetHtml(reason, featureKey) {
  var feature = featureKey ? premiumFeatureConfig(featureKey) : null;
  var heading = reason || (feature ? feature.label + ' is a Premium feature' : 'Go Premium');
  var test = premiumIsTestMode();
  var active = isPremium();

  var benefits = (typeof PREMIUM_BENEFITS !== 'undefined' ? PREMIUM_BENEFITS : []).slice(0, 4).map(function(b) {
    return '<li>' + premiumTick() + '<div><strong>' + escapeHtml(b.title) + '</strong><span>' +
      escapeHtml(b.body) + '</span></div></li>';
  }).join('');

  return premiumSheetShell(
      '<div class="premium-sheet-head">' +
        '<span class="premium-crown">✦</span>' +
        '<h2 id="premiumSheetTitle">' + escapeHtml(heading) + '</h2>' +
        '<p id="premiumSheetSub">' + escapeHtml(feature ? feature.blurb : 'Unlock everything Havën can do.') + '</p>' +
        (test ? premiumTestChip() : '') +
      '</div>' +
      '<ul class="premium-benefits">' + benefits + '</ul>' +
      '<p class="premium-sheet-plan-hint">' +
        (active
          ? 'Switching replaces your current plan immediately.'
          : (test ? 'Tap a plan to activate it instantly — no card, no charge.' : 'Choose a plan to continue to secure checkout.')) +
      '</p>' +
      '<div class="premium-plan-grid">' + premiumPlanCardsHtml(active) + '</div>' +
      '<div class="premium-sheet-actions">' +
        '<a class="premium-cta secondary" href="premium.html">Compare plans</a>' +
        '<button class="premium-cta secondary" type="button" data-premium-close>Not now</button>' +
      '</div>' +
      '<p class="premium-footnote">' +
        (test
          ? 'Test mode — activating Premium here is free and instant. Real payments start once Paddle or Dodo Payments is connected.'
          : 'Secure checkout handled by ' + escapeHtml(PREMIUM_CONFIG.provider === 'paddle' ? 'Paddle' : 'Dodo Payments') + '. Cancel anytime.') +
      '</p>'
  );
}

/* Post-action state, shown in place of the plans so the confirmation lands where
   the user acted and the receipt details are not a mystery. */
function premiumSheetSuccessHtml(info) {
  var test = premiumIsTestMode();
  var activated = info.mode === 'activated';
  var title = activated ? 'Premium is on' : (info.mode === 'reset' ? 'Back on the Free plan' : 'Plan canceled');
  var lead = activated
    ? 'Everything is unlocked right now — nothing to reload.'
    : (info.mode === 'reset'
        ? 'The test subscription is gone, so the Premium features are locked again.'
        : 'You keep every Premium feature until the end of the period you paid for.');

  var rows = [];
  if (info.planLabel) rows.push(['Plan', info.planLabel]);
  if (info.price) rows.push(['Price', info.price]);
  if (info.until) rows.push([activated ? 'Renews' : 'Access until', info.until]);
  if (activated) rows.push(['Billing', test ? 'Test mode — nothing was charged' : premiumProviderLabel()]);

  var unlocks = activated
    ? ['Advanced analytics, uncapped', 'AI assistant', 'Unlimited tags, categories and widgets', 'Export, screenshots and backups']
    : [];
  var tickList = unlocks.length
    ? '<ul class="premium-success-list">' + unlocks.map(function(u) {
        return '<li>' + premiumTick() + '<span>' + escapeHtml(u) + '</span></li>';
      }).join('') + '</ul>'
    : '';

  var rowsHtml = rows.length
    ? '<dl class="premium-success-rows">' + rows.map(function(r) {
        return '<div class="premium-success-row"><dt>' + escapeHtml(r[0]) + '</dt><dd>' + escapeHtml(r[1]) + '</dd></div>';
      }).join('') + '</dl>'
    : '';

  return premiumSheetShell(
      '<div class="premium-success">' +
        '<span class="premium-success-icon" aria-hidden="true">' +
          '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>' +
        '</span>' +
        '<h2 id="premiumSheetTitle">' + escapeHtml(title) + '</h2>' +
        '<p id="premiumSheetSub">' + escapeHtml(lead) + '</p>' +
        tickList +
        rowsHtml +
        '<button class="premium-cta premium-success-done" type="button" data-premium-close>Done</button>' +
        (test && activated ? '<p class="premium-footnote">Test mode — no card was stored and nothing was charged.</p>' : '') +
      '</div>'
  );
}

var _premiumSheetReturnFocus = null;
var _premiumSheetView = 'plans';
var _premiumSheetResult = null;
var _premiumSheetDragY = 0;

/* Everything clickable inside the sheet is wired here, so re-rendering the body
   (plans <-> confirmation) never leaves dead buttons behind. */
function premiumBindSheet(root) {
  root.querySelectorAll('[data-premium-close]').forEach(function(el) {
    el.addEventListener('click', closePremiumSheet);
  });
  root.querySelectorAll('.premium-plan-card[data-plan]:not([disabled])').forEach(function(card) {
    card.addEventListener('click', function() {
      premiumCheckout(card.getAttribute('data-plan'));
    });
  });
  var handle = root.querySelector('.premium-sheet-handle');
  if (handle) premiumSheetBindDrag(root, handle);
}

/* Swaps the sheet body between the plans and the confirmation state without
   unmounting the dialog, so focus and the page behind it stay put. */
function premiumSheetSetView(view, result) {
  _premiumSheetView = view;
  _premiumSheetResult = result || null;
  var root = document.getElementById('premiumSheetRoot');
  if (!root) return;
  var sheet = root.querySelector('.premium-sheet');
  if (!sheet) return;
  sheet.innerHTML = (view === 'success' && _premiumSheetResult)
    ? premiumSheetSuccessHtml(_premiumSheetResult)
    : premiumSheetHtml(root.getAttribute('data-premium-reason'), root.getAttribute('data-premium-feature'));
  premiumBindSheet(root);
  var focusTarget = sheet.querySelector('.premium-success-done') ||
    sheet.querySelector('.premium-plan-card[data-plan]:not([disabled])');
  if (focusTarget) { try { focusTarget.focus(); } catch (e) {} }
}

/* Focusable elements inside the dialog, used to keep Tab inside it. */
function premiumSheetFocusables(root) {
  var sel = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
  return Array.prototype.slice.call(root.querySelectorAll(sel)).filter(function(el) {
    return el.offsetWidth > 0 || el.offsetHeight > 0 || el === document.activeElement;
  });
}

function openPremiumSheet(reason, featureKey) {
  closePremiumSheet();
  _premiumSheetView = 'plans';
  _premiumSheetResult = null;
  _premiumSheetReturnFocus = (document.activeElement && document.activeElement !== document.body) ? document.activeElement : null;
  var root = document.createElement('div');
  root.className = 'premium-sheet-root';
  root.id = 'premiumSheetRoot';
  if (reason) root.setAttribute('data-premium-reason', reason);
  if (featureKey) root.setAttribute('data-premium-feature', featureKey);
  root.innerHTML = premiumSheetHtml(reason, featureKey);
  document.body.appendChild(root);
  document.body.classList.add('premium-sheet-scroll-lock');
  premiumBindSheet(root);
  document.addEventListener('keydown', premiumSheetKeydown);
  setTimeout(function() {
    var first = root.querySelector('.premium-plan-card[data-plan]:not([disabled])') || root.querySelector('.premium-cta');
    if (first) { try { first.focus(); } catch (e) {} }
  }, 30);
}

function closePremiumSheet() {
  var root = document.getElementById('premiumSheetRoot');
  if (root) root.remove();
  document.body.classList.remove('premium-sheet-scroll-lock');
  document.removeEventListener('keydown', premiumSheetKeydown);
  _premiumSheetView = 'plans';
  _premiumSheetResult = null;
  _premiumSheetDragY = 0;
  var back = _premiumSheetReturnFocus;
  _premiumSheetReturnFocus = null;
  if (back && typeof back.focus === 'function' && document.contains(back)) {
    try { back.focus(); } catch (e) {}
  }
}

/* Escape closes, Tab cycles inside the dialog instead of walking into the page. */
function premiumSheetKeydown(e) {
  var root = document.getElementById('premiumSheetRoot');
  if (!root) return;
  if (e.key === 'Escape') { closePremiumSheet(); return; }
  if (e.key !== 'Tab') return;
  var items = premiumSheetFocusables(root);
  if (!items.length) return;
  var first = items[0];
  var last = items[items.length - 1];
  var active = document.activeElement;
  if (!root.contains(active)) { e.preventDefault(); first.focus(); return; }
  if (e.shiftKey && active === first) { e.preventDefault(); last.focus(); }
  else if (!e.shiftKey && active === last) { e.preventDefault(); first.focus(); }
}

/* Drag the mobile sheet down by its handle to dismiss it. */
function premiumSheetBindDrag(root, handle) {
  var sheet = root.querySelector('.premium-sheet');
  if (!sheet || !window.PointerEvent) return;
  var startY = null;
  handle.addEventListener('pointerdown', function(e) {
    startY = e.clientY;
    sheet.classList.add('is-dragging');
    try { handle.setPointerCapture(e.pointerId); } catch (err) {}
  });
  handle.addEventListener('pointermove', function(e) {
    if (startY === null) return;
    _premiumSheetDragY = Math.max(0, e.clientY - startY);
    sheet.style.transform = 'translateY(' + _premiumSheetDragY + 'px)';
  });
  function endDrag() {
    if (startY === null) return;
    startY = null;
    sheet.classList.remove('is-dragging');
    sheet.style.transform = '';
    if (_premiumSheetDragY > 90) closePremiumSheet();
    _premiumSheetDragY = 0;
  }
  handle.addEventListener('pointerup', endDrag);
  handle.addEventListener('pointercancel', endDrag);
}

/* Busy state is scoped to the sheet (or the page plan list) and restores the
   exact label it replaced. */
function premiumSetButtonState(busy, label) {
  var scope = document.getElementById('premiumSheetRoot') ||
    document.getElementById('premiumPageRoot') || document.body;
  if (busy) scope.setAttribute('aria-busy', 'true');
  else scope.removeAttribute('aria-busy');
  scope.querySelectorAll('.premium-cta').forEach(function(btn) {
    if (btn.tagName === 'A') return;
    if (!btn.dataset.originalLabel) btn.dataset.originalLabel = btn.textContent;
    btn.classList.toggle('is-busy', !!busy);
    btn.disabled = !!busy;
    btn.textContent = busy ? (label || 'Working...') : btn.dataset.originalLabel;
  });
}

/* ─── Pricing page (premium.html) ────────────────────────── */

function renderPremiumPage() {
  var root = document.getElementById('premiumPageRoot');
  if (!root) return;
  var region = premiumRegion();
  var active = isPremium();

  var plans = PREMIUM_PLANS.map(function(plan) {
    var isCurrent = active && _premium.plan === plan.id;
    return '' +
      '<div class="premium-page-plan' + (plan.highlight ? ' is-highlight' : '') + '">' +
        (plan.badge ? '<span class="premium-plan-badge">' + escapeHtml(plan.badge) + '</span>' : '') +
        '<h3>' + escapeHtml(plan.label) + '</h3>' +
        '<div class="premium-page-price">' + premiumPriceLabel(plan.id, region) +
          '<small>/' + (plan.interval === 'year' ? 'year' : 'month') + '</small></div>' +
        '<p>' + escapeHtml(plan.blurb) + '</p>' +
        (isCurrent
          ? '<button class="premium-cta is-current" disabled>Current plan</button>'
          : '<button class="premium-cta" data-plan="' + plan.id + '">' +
              (active ? 'Switch to ' + escapeHtml(plan.label) : 'Get ' + escapeHtml(plan.label)) + '</button>') +
      '</div>';
  }).join('');

  var benefits = (typeof PREMIUM_BENEFITS !== 'undefined' ? PREMIUM_BENEFITS : []).map(function(b) {
    return '<div class="premium-benefit-card"><h4>' + escapeHtml(b.title) + '</h4><p>' + escapeHtml(b.body) + '</p></div>';
  }).join('');

  var status;
  if (active) {
    status = '' +
      '<div class="premium-status is-active">' +
        '<div><strong>Premium active</strong>' +
        '<span>' + escapeHtml(premiumPlanLabel()) + ' plan' +
          (premiumUntilLabel() ? ' · renews ' + escapeHtml(premiumUntilLabel()) : '') +
          (_premium.cancel_at_period_end ? ' · cancels at period end' : '') + '</span></div>' +
        '<div class="premium-status-actions">' +
          '<button class="premium-cta secondary" id="premiumPortalBtn">Manage billing</button>' +
          (PREMIUM_CONFIG.provider === 'mock' && !_premium.cancel_at_period_end
            ? '<button class="premium-cta secondary danger" id="premiumCancelBtn">Cancel plan</button>' : '') +
        '</div>' +
      '</div>';
  } else {
    status = '' +
      '<div class="premium-status">' +
        '<div><strong>You are on the Free plan</strong>' +
        '<span>Everything local still works. Premium adds the features below.</span></div>' +
      '</div>';
  }

  root.innerHTML = status + '<div class="premium-page-plans">' + plans + '</div>' +
    '<h3 class="premium-page-heading">What you get</h3>' +
    '<div class="premium-benefit-grid">' + benefits + '</div>';

  root.querySelectorAll('.premium-cta[data-plan]').forEach(function(btn) {
    btn.addEventListener('click', function() { premiumCheckout(btn.getAttribute('data-plan')); });
  });
  var portalBtn = document.getElementById('premiumPortalBtn');
  if (portalBtn) portalBtn.addEventListener('click', premiumPortal);
  var cancelBtn = document.getElementById('premiumCancelBtn');
  if (cancelBtn) cancelBtn.addEventListener('click', function() {
    if (confirm('Cancel your Premium plan? You keep access until the end of the paid period.')) premiumCancel();
  });
}

/* ─── Dev helpers ────────────────────────────────────────── */

window.__premium = {
  refresh: premiumRefresh,
  status: getPremium,
  activate: function(planId) { return premiumMockCheckout(premiumPlan(planId || 'yearly')); },
  cancel: premiumCancel,
  reset: function() {
    var sb = typeof getSupabaseDb === 'function' ? getSupabaseDb() : null;
    var uid = premiumUserId();
    if (!sb || !uid) return Promise.resolve();
    return sb.from('subscriptions').delete().eq('user_id', uid).then(function() {
      _premium = { premium: false, plan: null, interval: null, status: null, provider: null, until: null, cancel_at_period_end: false, checkedAt: Date.now() };
      premiumSaveCache();
      renderPremiumState();
      showToast('Premium reset to free', 'info');
    });
  },
  open: function() { openPremiumSheet(); }
};

function premiumBoot() {
  if (document.body && document.body.classList.contains('premium-disabled')) return;
  premiumStart();
}

if (typeof havenBoot === 'function') havenBoot(premiumBoot);
else if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', premiumBoot);
else premiumBoot();
