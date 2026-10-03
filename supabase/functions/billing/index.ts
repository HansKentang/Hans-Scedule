/* Havën Schedule — billing Edge Function

   One function, three adapters (mock / paddle / dodo). It is the only place
   that holds provider secrets, so the browser never sees them.

   Routes:
     GET  /health    → which provider is configured
     POST /checkout  → { user_id, plan, interval, price_id, return_url } → { url }
     POST /portal    → { user_id, return_url } → { url }
     POST /webhook?provider=paddle|dodo → verifies signature, grants/updates premium

   Deploy (webhooks need JWT verification off, because providers cannot send a
   Supabase JWT):

     supabase functions deploy billing --no-verify-jwt

   Secrets:

     supabase secrets set \
       PAYMENT_PROVIDER=paddle \
       APP_URL=https://your-app-url \
       PADDLE_ENVIRONMENT=sandbox \
       PADDLE_API_KEY=... PADDLE_WEBHOOK_SECRET=... \
       PADDLE_PRICE_MONTHLY=pri_... PADDLE_PRICE_YEARLY=pri_... \
       SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=...
*/

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getAdapter, type NormalizedEvent } from './providers.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, paddle-signature, svix-id, svix-timestamp, svix-signature, webhook-id, webhook-timestamp, webhook-signature',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS'
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

function adminClient() {
  const url = Deno.env.get('SUPABASE_URL') ?? '';
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  if (!url || !key) throw new Error('SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not set');
  return createClient(url, key, { auth: { persistSession: false } });
}

/* ─── Checkout ───────────────────────────────────────────── */

async function handleCheckout(req: Request): Promise<Response> {
  const body = await req.json().catch(() => ({}));
  const { user_id, plan, interval, price_id, return_url } = body ?? {};
  if (!user_id || !plan) return json({ error: 'user_id and plan are required' }, 400);

  const appUrl = (Deno.env.get('APP_URL') ?? '').replace(/\/+$/, '');
  const returnUrl = return_url || `${appUrl}/premium.html`;

  try {
    const adapter = getAdapter();
    const result = await adapter.createCheckout({ userId: user_id, plan, interval: interval || 'year', priceId: price_id, returnUrl: returnUrl });

    /* Mock has no external page — grant immediately so the deployed function is
       testable end to end. Remove this branch when going live. */
    if (adapter.name === 'mock') {
      const db = adminClient();
      const end = new Date();
      if (interval === 'month') end.setMonth(end.getMonth() + 1);
      else end.setFullYear(end.getFullYear() + 1);

      await db.from('subscriptions').insert({
        user_id,
        provider: 'mock',
        plan,
        interval: interval || 'year',
        status: 'active',
        price_id: 'mock_' + plan,
        currency: 'USD',
        amount_cents: 0,
        provider_subscription_id: `mock_sub_${user_id}_${Date.now()}`,
        current_period_start: new Date().toISOString(),
        current_period_end: end.toISOString()
      });
    }

    return json({ url: result.url, id: result.id ?? null });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : 'Checkout failed' }, 502);
  }
}

/* ─── Customer portal ────────────────────────────────────── */

async function handlePortal(req: Request): Promise<Response> {
  const body = await req.json().catch(() => ({}));
  const { user_id, return_url } = body ?? {};
  if (!user_id) return json({ error: 'user_id is required' }, 400);

  const db = adminClient();
  const { data: sub } = await db
    .from('subscriptions')
    .select('provider_customer_id')
    .eq('user_id', user_id)
    .not('provider_customer_id', 'is', null)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  try {
    const adapter = getAdapter();
    const result = await adapter.createPortal({
      userId: user_id,
      customerId: sub?.provider_customer_id ?? null,
      returnUrl: return_url || `${(Deno.env.get('APP_URL') ?? '').replace(/\/+$/, '')}/premium.html`
    });
    return json({ url: result.url });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : 'Portal failed' }, 502);
  }
}

/* ─── Webhook ────────────────────────────────────────────── */

async function handleWebhook(req: Request): Promise<Response> {
  const raw = await req.text();
  const url = new URL(req.url);
  const adapter = getAdapter(url.searchParams.get('provider') ?? undefined);

  let event: NormalizedEvent | null = null;
  try {
    event = await adapter.verifyWebhook(raw, req.headers);
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : 'Invalid signature' }, 401);
  }

  /* Mock events are only accepted when the mock adapter is selected. */
  if (!event || adapter.name === 'mock') return json({ ok: true, skipped: 'no event' });

  const db = adminClient();

  /* Idempotency: a replayed provider event must not double-apply. */
  const { error: dupErr } = await db.from('webhook_events').insert({
    id: event.id,
    provider: adapter.name,
    event_type: event.type,
    payload: JSON.parse(raw)
  });
  if (dupErr) return json({ ok: true, duplicate: true });

  /* Resolve the user: metadata first, otherwise the existing subscription row. */
  let userId = event.userId;
  if (!userId && event.providerSubscriptionId) {
    const { data: existing } = await db
      .from('subscriptions')
      .select('user_id')
      .eq('provider', adapter.name)
      .eq('provider_subscription_id', event.providerSubscriptionId)
      .maybeSingle();
    userId = existing?.user_id ?? null;
  }
  if (!userId) return json({ ok: true, skipped: 'unknown user' });

  const isPayment = /payment|transaction/.test(event.type) && /active|completed|paid|succeeded|billed/.test((event.status || '').toLowerCase());
  const status = normalizeStatus(event.status, event.type);

  const payload = {
    user_id: userId,
    provider: adapter.name,
    plan: event.plan ?? 'yearly',
    interval: event.interval ?? 'year',
    status,
    price_id: null,
    currency: event.currency ?? 'USD',
    amount_cents: event.amountCents ?? 0,
    provider_customer_id: event.providerCustomerId,
    provider_subscription_id: event.providerSubscriptionId,
    current_period_start: event.currentPeriodStart,
    current_period_end: event.currentPeriodEnd,
    cancel_at_period_end: event.cancelAtPeriodEnd,
    canceled_at: status === 'canceled' ? new Date().toISOString() : null,
    updated_at: new Date().toISOString()
  };

  if (event.providerSubscriptionId) {
    const { data: existing } = await db
      .from('subscriptions')
      .select('id')
      .eq('provider', adapter.name)
      .eq('provider_subscription_id', event.providerSubscriptionId)
      .maybeSingle();

    if (existing) {
      const { error } = await db.from('subscriptions').update(payload).eq('id', existing.id);
      if (error) return json({ error: error.message }, 500);
    } else {
      const { error } = await db.from('subscriptions').insert(payload);
      if (error) return json({ error: error.message }, 500);
    }
  }

  if (isPayment) {
    await db.from('orders').insert({
      user_id: userId,
      provider: adapter.name,
      plan: event.plan ?? null,
      status: 'paid',
      currency: event.currency ?? 'USD',
      amount_cents: event.amountCents ?? 0,
      provider_order_id: event.id,
      provider_transaction_id: event.providerSubscriptionId
    });
  }

  return json({ ok: true });
}

/* Providers use different words for the same state. Collapse them. */
function normalizeStatus(status: string, type: string): string {
  const s = (status || '').toLowerCase();
  if (s === 'active' || s === 'trialing' || s === 'trial') return s === 'trial' ? 'trialing' : s;
  if (s === 'past_due' || s === 'on_hold' || s === 'paused' || s === 'failed') return 'past_due';
  if (s === 'canceled' || s === 'cancelled') return 'canceled';
  if (s === 'expired') return 'expired';
  if (/cancel/.test(type)) return 'canceled';
  if (/expire/.test(type)) return 'expired';
  return 'incomplete';
}

/* ─── Router ─────────────────────────────────────────────── */

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const path = new URL(req.url).pathname.replace(/\/+$/, '');
  const route = path.split('/').pop() || '';

  try {
    if (route === 'health') {
      return json({ ok: true, provider: getAdapter().name });
    }
    if (route === 'checkout' && req.method === 'POST') return await handleCheckout(req);
    if (route === 'portal' && req.method === 'POST') return await handlePortal(req);
    if (route === 'webhook' && req.method === 'POST') return await handleWebhook(req);
    return json({ error: 'Not found', route }, 404);
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : 'Unexpected error' }, 500);
  }
});
