/* Havën Schedule — Premium plan catalogue + feature gates
   Loaded BEFORE premium.js on every page.

   ── How to control what premium actually locks ──
   Each entry in PREMIUM_FEATURES has an `enforce` flag:
     enforce: true   → the feature is really blocked, users see the upgrade sheet
     enforce: false  → the gate exists but lets everyone through (soft / "Pro badge only")

   Setting every `enforce` to false gives you the "single Pro flag" mode: the
   billing plumbing, pricing page and Pro badge all work, nothing is blocked.

   ── How to go live ──
   1. Get approved by Paddle or Dodo Payments.
   2. Deploy supabase/functions/billing with the provider secrets.
   3. Set PREMIUM_CONFIG.provider to 'paddle' or 'dodo' and mode to 'live'.
   4. Fill in the price/product ids under PREMIUM_PLANS.
   5. Run the PRODUCTION LOCK-DOWN block in supabase/schema-premium.sql.
*/

var PREMIUM_CONFIG = {
  /* 'mock' | 'paddle' | 'dodo' */
  provider: 'mock',
  /* 'test' lets the mock adapter finish a checkout entirely in the browser.
     'live' always routes through the billing Edge Function. */
  mode: 'test',
  /* Base URL of the deployed billing Edge Function. */
  billingEndpoint: 'https://efirdijrhmfhaqlqnfsd.supabase.co/functions/v1/billing',
  /* Where the provider returns the user after checkout. */
  returnUrl: 'premium.html',
  /* Free plan limits used by the gated features below. */
  freeLimits: {
    customTags: 0,
    customCategories: 0,
    widgetsPerCanvas: 8,
    analyticsRangeDays: 7
  }
};

/* ─── Plans ────────────────────────────────────────────────
   Dual pricing to match HAVEN-REVENUE-MODEL.md:
   Indonesia Rp 199,000/yr, global $60/yr equivalent.
   Regional pricing is applied by the provider at checkout when available;
   `priceId` / `productId` are the provider-side identifiers. */
var PREMIUM_PLANS = [
  {
    id: 'monthly',
    label: 'Monthly',
    interval: 'month',
    badge: null,
    prices: { ID: { amount: 29000, currency: 'IDR' }, DEFAULT: { amount: 700, currency: 'USD' } },
    priceId: { paddle: '', dodo: '' },
    blurb: 'Cancel anytime. Best for trying things out.'
  },
  {
    id: 'yearly',
    label: 'Yearly',
    interval: 'year',
    badge: 'Save 28%',
    prices: { ID: { amount: 199000, currency: 'IDR' }, DEFAULT: { amount: 6000, currency: 'USD' } },
    priceId: { paddle: '', dodo: '' },
    blurb: 'Two months free compared with monthly.',
    highlight: true
  }
];

/* ─── Feature gates ────────────────────────────────────────
   Keys are referenced from app code via hasAccess('key'). */
var PREMIUM_FEATURES = {
  ai: {
    label: 'AI assistant',
    enforce: true,
    blurb: 'Chat with the assistant, get schedule suggestions and daily plans.',
    bullets: [
      'Ask for a plan and get tasks placed on your week',
      'Reshuffle a busy day in one sentence',
      'Remembers your routine and preferences'
    ]
  },
  analytics: {
    label: 'Advanced analytics',
    enforce: true,
    blurb: 'Full history, trends, streaks, sleep analytics and day-by-day breakdowns.',
    bullets: [
      'Every trend, streak and sleep insight uncapped',
      'Month and all-time breakdowns, not just 7 days',
      'Day-by-day table for any period'
    ]
  },
  unlimited_tags: {
    label: 'Unlimited tags, categories and widgets',
    enforce: true,
    blurb: 'Unlimited custom tags, custom schedule categories and bento widgets.',
    bullets: [
      'As many custom tags and categories as you like',
      'No cap on bento widgets per canvas',
      'Subcategory presets for every tag'
    ]
  },
  export: {
    label: 'Export, screenshots and backups',
    enforce: true,
    blurb: 'Screenshot your week, copy weeks between dates, export and import your data.',
    bullets: [
      'Week screenshots you can share',
      'Copy a whole week onto another date',
      'JSON export and import for real backups'
    ]
  }
};

/* Human-readable list shown on the pricing page. */
var PREMIUM_BENEFITS = [
  { title: 'Advanced analytics', body: 'Every trend, streak and sleep insight — no 7-day cap.', feature: 'analytics' },
  { title: 'AI assistant', body: 'Plan your week in a sentence and let the assistant fill it in.', feature: 'ai' },
  { title: 'Unlimited customisation', body: 'As many tags, categories and hub widgets as you want.', feature: 'unlimited_tags' },
  { title: 'Export and backups', body: 'Screenshots, week copy, JSON export and import.', feature: 'export' },
  { title: 'Cross-device sync', body: 'Your schedule, sleep and goals on every device you sign in on.', feature: null },
  { title: 'Support development', body: 'You keep an independent, local-first app alive.', feature: null }
];

/* Localised price string, e.g. "Rp 199.000" or "$60". */
function premiumPriceLabel(planId, region) {
  var plan = PREMIUM_PLANS.filter(function(p) { return p.id === planId; })[0];
  if (!plan) return '';
  var price = plan.prices[region] || plan.prices.DEFAULT;
  if (price.currency === 'IDR') {
    return 'Rp ' + price.amount.toLocaleString('id-ID');
  }
  return '$' + (price.amount / 100).toFixed(price.amount % 100 === 0 ? 0 : 2);
}

/* Detect the user's region for pricing. Falls back to global pricing. */
function premiumRegion() {
  try {
    var tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
    if (/Jakarta|Makassar|Jayapura|Pontianak/i.test(tz)) return 'ID';
    if (typeof navigator !== 'undefined' && /^id\b/i.test(navigator.language || '')) return 'ID';
  } catch (e) {}
  return 'DEFAULT';
}

function premiumPlan(planId) {
  return PREMIUM_PLANS.filter(function(p) { return p.id === planId; })[0] || null;
}
