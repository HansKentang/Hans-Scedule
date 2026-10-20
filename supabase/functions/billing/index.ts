/* Havën Schedule — billing Edge Function

   One function, three adapters (mock / paddle / dodo). It is the only place
   that holds provider secrets, so the browser never sees them.

   Routes:
     GET  /health                            → { provider }  (unauthenticated)
     POST /checkout  → { plan, interval, price_id, return_url } → { url }
     POST /portal    → { return_url } → { url }
     POST /cancel    → marks the caller's active subscription canceled
     POST /webhook?provider=paddle|dodo → verifies signature, grants/updates premium

   Authentication: /checkout and /portal require the caller's own Supabase
   access token as `Authorization: Bearer <token>`. The user's id is taken
   from that verified token and is never read from the request body. The
   /webhook route is the exception — providers cannot send a Supabase JWT, so
   the function is deployed `--no-verify-jwt` and webhooks are authenticated
   by HMAC signature instead.

   Deploy (JWT verification stays off so the webhook route works):

     supabase functions deploy billing --no-verify-jwt

   Secrets:

     supabase secrets set \
       PAYMENT_PROVIDER=paddle \
       APP_URL=https://your-app-url \
       SUPABASE_ANON_KEY=eyJ... \
       PADDLE_ENVIRONMENT=sandbox \
       PADDLE_API_KEY=... PADDLE_WEBHOOK_SECRET=... \
       PADDLE_PRICE_MONTHLY=pri_... PADDLE_PRICE_YEARLY=pri_... \
       SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=...

   Local testing with the mock adapter additionally requires
   ALLOW_MOCK_GRANTS=true, and can only ever grant to the caller's own id.
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

/* subscriptions.user_id / orders.user_id hold the app's profile id (a random
   string), while the JWT identifies the Supabase auth uid (a uuid). The
   entitlement check (premium_status) reads by profile id, so every billing
   write has to translate. Accept either value so webhooks created before this
   translation existed still resolve. */
async function resolveProfileId(db: ReturnType<typeof adminClient>, idOrAuthUid: string): Promise<string> {
  const { data: byId } = await db.from('profiles').select('id').eq('id', idOrAuthUid).maybeSingle();
  if (byId?.id) return byId.id;
  const { data: byAuth } = await db.from('profiles').select('id').eq('auth_uid', idOrAuthUid).maybeSingle();
  return byAuth?.id || idOrAuthUid;
}

/* The RLS read policy is `auth_uid = auth.uid()`, so rows written with the
   service role must carry the auth uid explicitly — auth.uid() is null there. */
async function authUidForProfile(db: ReturnType<typeof adminClient>, profileId: string): Promise<string | null> {
  const { data } = await db.from('profiles').select('auth_uid').eq('id', profileId).maybeSingle();
  return data?.auth_uid ?? null;
}

/* ─── Caller authentication ────────────────────────────────
   The webhook route is called by payment providers, which cannot send a
   Supabase JWT, so the function is deployed with `--no-verify-jwt` and the
   gateway does no auth work for us. Every user-facing route must therefore
   verify the bearer token itself, and must derive the user's identity from
   that verified token and never from the request body — otherwise anyone
   could act on any other account. */

function bearerToken(req: Request): string | null {
  const h = req.headers.get('authorization') ?? '';
  const m = /^Bearer\s+(.+)$/i.exec(h.trim());
  return m && m[1] ? m[1].trim() : null;
}

async function requireUser(req: Request): Promise<string> {
  const token = bearerToken(req);
  if (!token) throw new Unauthorized('Missing bearer token');

  const url = Deno.env.get('SUPABASE_URL') ?? '';
  const key = Deno.env.get('SUPABASE_ANON_KEY') ?? Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  if (!url || !key) throw new Error('SUPABASE_URL / SUPABASE_ANON_KEY not set');

  const anon = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
  const { data, error } = await anon.auth.getUser(token);
  if (error || !data?.user?.id) throw new Unauthorized('Invalid or expired token');
  return data.user.id;
}

class Unauthorized extends Error {}

/* ─── Checkout ───────────────────────────────────────────── */

async function handleCheckout(req: Request): Promise<Response> {
  let userId: string;
  try {
    userId = await requireUser(req);
  } catch (e) {
    if (e instanceof Unauthorized) return json({ error: e.message }, 401);
    return json({ error: e instanceof Error ? e.message : 'Auth unavailable' }, 500);
  }

  const body = await req.json().catch(() => ({}));
  const { plan, interval, price_id, return_url } = body ?? {};
  if (!plan) return json({ error: 'plan is required' }, 400);

  const appUrl = (Deno.env.get('APP_URL') ?? '').replace(/\/+$/, '');
  const returnUrl = return_url || `${appUrl}/premium.html`;

  try {
    const db = adminClient();
    const profileId = await resolveProfileId(db, userId);
    const authUid = await authUidForProfile(db, profileId);
    const adapter = getAdapter();
    /* Keep the adapter's URL. Paddle and Dodo return their hosted checkout
       page here; returning `returnUrl` instead would bounce the user straight
       back to premium.html without ever reaching a payment form. The mock
       adapter returns the app's own URL, so this works for all three. */
    const result = await adapter.createCheckout({ userId: profileId, plan, interval: interval || 'year', priceId: price_id, returnUrl: returnUrl });

    /* The mock adapter has no external checkout page. It used to grant an
       active subscription immediately so the deployed function could be
       tested end to end — with an unverified request body that was an open
       entitlement bypass. Grants are now opt-in per environment, and can
       only ever be written for the authenticated caller's own account. */
    if (adapter.name === 'mock' && Deno.env.get('ALLOW_MOCK_GRANTS') === 'true') {
      const end = new Date();
      if (interval === 'month') end.setMonth(end.getMonth() + 1);
      else end.setFullYear(end.getFullYear() + 1);

      const { error: insertErr } = await db.from('subscriptions').insert({
        user_id: profileId,
        auth_uid: authUid,
        provider: 'mock',
        plan,
        interval: interval || 'year',
        status: 'active',
        price_id: 'mock_' + plan,
        currency: 'USD',
        amount_cents: 0,
        provider_subscription_id: `mock_sub_${profileId}_${Date.now()}`,
        current_period_start: new Date().toISOString(),
        current_period_end: end.toISOString()
      });
      if (insertErr) return json({ error: insertErr.message }, 500);
    }

    return json({ url: result.url, id: result.id ?? null });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : 'Checkout failed' }, 502);
  }
}

/* ─── Customer portal ────────────────────────────────────── */

async function handlePortal(req: Request): Promise<Response> {
  let userId: string;
  try {
    userId = await requireUser(req);
  } catch (e) {
    if (e instanceof Unauthorized) return json({ error: e.message }, 401);
    return json({ error: e instanceof Error ? e.message : 'Auth unavailable' }, 500);
  }

  const body = await req.json().catch(() => ({}));
  const { return_url } = body ?? {};

  const db = adminClient();
  const profileId = await resolveProfileId(db, userId);
  const { data: sub } = await db
    .from('subscriptions')
    .select('provider_customer_id')
    .eq('user_id', profileId)
    .not('provider_customer_id', 'is', null)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  try {
    const adapter = getAdapter();
    const result = await adapter.createPortal({
      userId: profileId,
      customerId: sub?.provider_customer_id ?? null,
      returnUrl: return_url || `${(Deno.env.get('APP_URL') ?? '').replace(/\/+$/, '')}/premium.html`
    });
    return json({ url: result.url });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : 'Portal failed' }, 502);
  }
}

/* ─── Cancel ─────────────────────────────────────────────── */

/* Cancelling used to be a client-side UPDATE on `subscriptions`. The go-live
   lock-down drops the mock update policy, so that write is now rejected for
   every account. Move it here, where the service role can apply it to the
   authenticated caller's own row only. */
async function handleCancel(req: Request): Promise<Response> {
  let userId: string;
  try {
    userId = await requireUser(req);
  } catch (e) {
    if (e instanceof Unauthorized) return json({ error: e.message }, 401);
    return json({ error: e instanceof Error ? e.message : 'Auth unavailable' }, 500);
  }

  const db = adminClient();
  const profileId = await resolveProfileId(db, userId);
  const { error } = await db
    .from('subscriptions')
    .update({
      status: 'canceled',
      cancel_at_period_end: true,
      canceled_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('user_id', profileId)
    .eq('status', 'active');

  if (error) return json({ error: error.message }, 500);
  return json({ ok: true });
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

  /* Normalise to the profile id the entitlement check reads, and carry the
     auth uid so the owner-read RLS policy can see the row. */
  userId = await resolveProfileId(db, userId);
  const authUid = await authUidForProfile(db, userId);

  const isPayment = /payment|transaction/.test(event.type) && /active|completed|paid|succeeded|billed/.test((event.status || '').toLowerCase());
  const status = normalizeStatus(event.status, event.type);

  const payload = {
    user_id: userId,
    auth_uid: authUid,
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
    if (route === 'cancel' && req.method === 'POST') return await handleCancel(req);
    if (route === 'webhook' && req.method === 'POST') return await handleWebhook(req);
    return json({ error: 'Not found', route }, 404);
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : 'Unexpected error' }, 500);
  }
});
