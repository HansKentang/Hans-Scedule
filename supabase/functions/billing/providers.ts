/* Provider adapters for the billing Edge Function.

   Every adapter turns a provider-specific request/event into one normalised
   shape so index.ts never needs to know which provider is in use:

     NormalizedEvent {
       id                       provider event id (idempotency key)
       type                     normalised: activated|renewed|updated|canceled|expired|payment
       userId                   Havën user id (from metadata / custom_data)
       providerSubscriptionId
       providerCustomerId
       plan / interval
       status                   active|trialing|past_due|canceled|expired
       currentPeriodStart/End   ISO strings or null
       cancelAtPeriodEnd        boolean
       amountCents / currency
     }

   ⚠️  The Paddle and Dodo adapters are written against their public webhook
   and checkout APIs but have not been exercised against live accounts. Test
   them in each provider's sandbox before taking real money.
*/

export type Provider = 'mock' | 'paddle' | 'dodo';

export interface CheckoutInput {
  userId: string;
  plan: string;
  interval: string;
  priceId?: string;
  returnUrl: string;
}

export interface NormalizedEvent {
  id: string;
  type: 'activated' | 'renewed' | 'updated' | 'canceled' | 'expired' | 'payment';
  userId: string | null;
  providerSubscriptionId: string | null;
  providerCustomerId: string | null;
  plan: string | null;
  interval: string | null;
  status: string;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  amountCents: number | null;
  currency: string | null;
}

export interface ProviderAdapter {
  name: Provider;
  createCheckout(input: CheckoutInput): Promise<{ url: string; id?: string }>;
  createPortal(input: { userId: string; customerId: string | null; returnUrl: string }): Promise<{ url: string }>;
  verifyWebhook(raw: string, headers: Headers): Promise<NormalizedEvent | null>;
}

/* ─── Shared helpers ─────────────────────────────────────── */

const enc = new TextEncoder();

function toHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

function toBase64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}

async function hmac(keyBytes: Uint8Array | ArrayBuffer, message: string, hash = 'SHA-256'): Promise<ArrayBuffer> {
  const key = await crypto.subtle.importKey('raw', keyBytes, { name: 'HMAC', hash }, false, ['sign']);
  return crypto.subtle.sign('HMAC', key, enc.encode(message));
}

/* Timing-safe comparison for signatures of equal length. */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function env(name: string, fallback = ''): string {
  try { return Deno.env.get(name) ?? fallback; } catch { return fallback; }
}

/* ─── Mock adapter ───────────────────────────────────────── */
/* Writes an active subscription immediately. Used to test the deployed
   function end to end before a Paddle or Dodo account exists. */

const mockAdapter: ProviderAdapter = {
  name: 'mock',
  async createCheckout(input) {
    return { url: `${input.returnUrl}?mock_checkout=1&plan=${encodeURIComponent(input.plan)}` };
  },
  async createPortal() {
    return { url: '' };
  },
  async verifyWebhook() {
    return null;
  }
};

/* ─── Paddle adapter ─────────────────────────────────────── */

function paddleApiBase(): string {
  return env('PADDLE_ENVIRONMENT') === 'production' ? 'https://api.paddle.com' : 'https://sandbox-api.paddle.com';
}

function paddlePriceId(plan: string, explicit?: string): string {
  if (explicit) return explicit;
  if (plan === 'yearly') return env('PADDLE_PRICE_YEARLY');
  return env('PADDLE_PRICE_MONTHLY');
}

const paddleAdapter: ProviderAdapter = {
  name: 'paddle',

  async createCheckout(input) {
    const priceId = paddlePriceId(input.plan, input.priceId);
    if (!priceId) throw new Error(`No Paddle price id configured for plan "${input.plan}"`);

    const res = await fetch(`${paddleApiBase()}/transactions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env('PADDLE_API_KEY')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        items: [{ price_id: priceId, quantity: 1 }],
        custom_data: { user_id: input.userId, plan: input.plan },
        checkout: { url: input.returnUrl }
      })
    });

    const json = await res.json();
    const url = json?.data?.checkout?.url;
    if (!res.ok || !url) {
      throw new Error(json?.error?.detail || `Paddle checkout failed (${res.status})`);
    }
    return { url, id: json?.data?.id };
  },

  async createPortal(input) {
    if (!input.customerId) throw new Error('No Paddle customer on file yet');
    const res = await fetch(`${paddleApiBase()}/customers/${input.customerId}/portal-sessions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env('PADDLE_API_KEY')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({})
    });
    const json = await res.json();
    const url = json?.data?.urls?.general?.overview;
    if (!res.ok || !url) throw new Error(json?.error?.detail || 'Paddle portal failed');
    return { url };
  },

  /* Header: `Paddle-Signature: ts=1699999999;h1=<hex hmac>` */
  async verifyWebhook(raw, headers) {
    const secret = env('PADDLE_WEBHOOK_SECRET');
    if (!secret) throw new Error('PADDLE_WEBHOOK_SECRET not set');

    const header = headers.get('paddle-signature') || '';
    const parts: Record<string, string> = {};
    header.split(';').forEach((p) => {
      const i = p.indexOf('=');
      if (i > 0) parts[p.slice(0, i).trim()] = p.slice(i + 1).trim();
    });

    const ts = parts['ts'];
    const h1 = parts['h1'];
    if (!ts || !h1) throw new Error('Malformed Paddle signature header');

    /* Reject replayed deliveries older than 5 minutes. */
    if (Math.abs(Date.now() / 1000 - Number(ts)) > 300) throw new Error('Paddle signature timestamp out of range');

    const expected = toHex(await hmac(enc.encode(secret), `${ts}:${raw}`));
    if (!safeEqual(expected, h1)) throw new Error('Invalid Paddle signature');

    const body = JSON.parse(raw);
    const d = body?.data ?? {};
    const custom = d.custom_data ?? {};
    const period = d.current_billing_period ?? {};

    return {
      id: String(body?.event_id ?? `${body?.event_type}:${d.id ?? ''}`),
      type: String(body?.event_type || ''),
      userId: custom.user_id ?? null,
      providerSubscriptionId: d.id ?? null,
      providerCustomerId: d.customer_id ?? null,
      plan: custom.plan ?? null,
      interval: d.billing_cycle?.interval ?? null,
      status: d.status || 'active',
      currentPeriodStart: period.starts_at ?? null,
      currentPeriodEnd: period.ends_at ?? null,
      cancelAtPeriodEnd: d.scheduled_change?.action === 'cancel',
      amountCents: d.items?.[0]?.price?.unit_price?.amount ? Number(d.items[0].price.unit_price.amount) : null,
      currency: d.currency_code ?? d.items?.[0]?.price?.unit_price?.currency_code ?? null
    } as any;
  }
};

/* ─── Dodo Payments adapter ──────────────────────────────── */

function dodoApiBase(): string {
  return env('DODO_ENVIRONMENT') === 'live' ? 'https://live.dodopayments.com' : 'https://test.dodopayments.com';
}

function dodoProductId(plan: string, explicit?: string): string {
  if (explicit) return explicit;
  if (plan === 'yearly') return env('DODO_PRODUCT_YEARLY');
  return env('DODO_PRODUCT_MONTHLY');
}

const dodoAdapter: ProviderAdapter = {
  name: 'dodo',

  async createCheckout(input) {
    const productId = dodoProductId(input.plan, input.priceId);
    if (!productId) throw new Error(`No Dodo product id configured for plan "${input.plan}"`);

    const res = await fetch(`${dodoApiBase()}/checkout_sessions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env('DODO_API_KEY')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        product_cart: [{ product_id: productId, quantity: 1 }],
        return_url: input.returnUrl,
        metadata: { user_id: input.userId, plan: input.plan }
      })
    });

    const json = await res.json();
    const url = json?.checkout_url;
    if (!res.ok || !url) throw new Error(json?.message || `Dodo checkout failed (${res.status})`);
    return { url, id: json?.session_id };
  },

  async createPortal(input) {
    if (!input.customerId) throw new Error('No Dodo customer on file yet');
    const res = await fetch(`${dodoApiBase()}/customers/${input.customerId}/customer-portal/session`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env('DODO_API_KEY')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ return_url: input.returnUrl })
    });
    const json = await res.json();
    const url = json?.link || json?.url;
    if (!res.ok || !url) throw new Error(json?.message || 'Dodo portal failed');
    return { url };
  },

  /* Dodo delivers webhooks through Svix:
     headers: svix-id, svix-timestamp, svix-signature ("v1,<base64> [v1,<base64>]")
     signed content: `${svix-id}.${svix-timestamp}.${raw}`
     secret: "whsec_<base64>" */
  async verifyWebhook(raw, headers) {
    const secret = env('DODO_WEBHOOK_SECRET');
    if (!secret) throw new Error('DODO_WEBHOOK_SECRET not set');

    const id = headers.get('svix-id') || headers.get('webhook-id') || '';
    const ts = headers.get('svix-timestamp') || headers.get('webhook-timestamp') || '';
    const sigHeader = headers.get('svix-signature') || headers.get('webhook-signature') || '';
    if (!id || !ts || !sigHeader) throw new Error('Missing Svix signature headers');

    const secretBytes = Uint8Array.from(atob(secret.replace(/^whsec_/, '')), (c) => c.charCodeAt(0));
    const expected = toBase64(await hmac(secretBytes, `${id}.${ts}.${raw}`));

    const provided = sigHeader.split(' ').map((part) => part.split(',')[1]).filter(Boolean);
    if (!provided.some((sig) => safeEqual(sig, expected))) throw new Error('Invalid Dodo signature');

    const body = JSON.parse(raw);
    const d = body?.data ?? {};
    const meta = d.metadata ?? {};
    const rawType = String(body?.type || '');
    const statusByType: Record<string, string> = {
      'subscription.active': 'active',
      'subscription.renewed': 'active',
      'subscription.on_hold': 'past_due',
      'subscription.paused': 'past_due',
      'subscription.cancelled': 'canceled',
      'subscription.canceled': 'canceled',
      'subscription.expired': 'expired',
      'subscription.failed': 'past_due'
    };

    return {
      id: String(body?.id ?? `${rawType}:${d.subscription_id ?? d.payment_id ?? ''}`),
      type: rawType,
      userId: meta.user_id ?? null,
      providerSubscriptionId: d.subscription_id ?? null,
      providerCustomerId: d.customer?.customer_id ?? d.customer_id ?? null,
      plan: meta.plan ?? null,
      interval: null,
      status: statusByType[rawType] || 'active',
      currentPeriodStart: d.previous_billing_date ?? null,
      currentPeriodEnd: d.next_billing_date ?? null,
      cancelAtPeriodEnd: rawType === 'subscription.cancelled' || rawType === 'subscription.canceled',
      amountCents: typeof d.total_amount === 'number' ? d.total_amount : null,
      currency: d.currency ?? null
    } as any;
  }
};

export const adapters: Record<Provider, ProviderAdapter> = {
  mock: mockAdapter,
  paddle: paddleAdapter,
  dodo: dodoAdapter
};

export function getAdapter(name?: string): ProviderAdapter {
  const key = (name || env('PAYMENT_PROVIDER', 'mock')) as Provider;
  return adapters[key] || mockAdapter;
}
