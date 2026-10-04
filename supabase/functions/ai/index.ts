/* Havën Schedule — AI proxy Edge Function

   The browser never sees an AI provider key. This function holds the keys,
   counts every message against a per-user daily quota, then tries a CHAIN of
   providers cheapest-first. Free tiers are used before anything that costs
   money, so the app can run for free until it outgrows the free allowances.

   Routes:
     POST /  { system, user, image? }  →  { text, actions, used, limit, plan, provider }
           Authorization: Bearer <user JWT>

   Deploy:
     supabase functions deploy ai --no-verify-jwt

   --no-verify-jwt because the caller sends a *user* token, not a Supabase
   service token. This function verifies that user itself via auth.getUser().

   ── Which providers are actually free (verified 2026-10-04) ──
   Cloudflare Workers AI   10,000 Neurons/day free, resets 00:00 UTC.
                           ~420-615 messages/day at this app's prompt size.
                           The best free allowance of the three by a wide margin.
   Gemini (Flash-Lite)     500 requests/day free on an unpaid project.
                           CAVEAT: unpaid content may be used to improve Google
                           products and reviewed by humans. Do not route personal
                           schedule/finance data through it without disclosing
                           that. Paid services are required for users in the
                           EEA, Switzerland and the UK.
   Groq (free plan)        1,000 requests/day, but only 200K tokens/day — about
                           94 messages at this prompt size. The token cap binds
                           long before the request cap.
                           NOTE: the free plan does not include Llama models.
                           Use openai/gpt-oss-120b or qwen/qwen3.8-27b.

   Prompt caching (Groq, automatic, on by default) does not count cached input
   tokens towards rate limits, which materially raises the free ceiling.
   See AI-FREE-TIER-PLAN.md §10 for the arithmetic.

   Secrets:
     supabase secrets set \
       AI_PROVIDER_CHAIN=cloudflare,gemini,groq \
       CLOUDFLARE_ACCOUNT_ID=... CLOUDFLARE_API_TOKEN=... \
       GEMINI_API_KEY=... \
       GROQ_API_KEY=... \
       AI_FREE_DAILY=15 AI_PRO_DAILY=300 AI_MAX_OUTPUT_TOKENS=900

   Only the providers you set keys for need to be listed in the chain.
*/

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

type Provider = 'cloudflare' | 'gemini' | 'groq';

type Result = {
  content: string;
  inTok: number;
  outTok: number;
  model: string;
  provider: Provider;
};

/* Per 1M tokens, for the cost column in ai_logs. Free tiers log a nominal cost. */
const PRICE_IN = Number(Deno.env.get('AI_PRICE_IN') ?? '0.59');
const PRICE_OUT = Number(Deno.env.get('AI_PRICE_OUT') ?? '0.79');

const DEFAULT_MODELS: Record<Provider, string> = {
  cloudflare: '@cf/meta/llama-3.2-3b-instruct',
  gemini: 'gemini-2.5-flash-lite',
  groq: 'openai/gpt-oss-120b'
};

/* Which providers can accept an image. Cloudflare's small text models cannot. */
function supportsVision(p: Provider): boolean {
  return p === 'gemini' || p === 'groq';
}

function modelFor(p: Provider): string {
  return Deno.env.get(`AI_MODEL_${p.toUpperCase()}`) ?? DEFAULT_MODELS[p];
}

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

function openAIMessages(system: string, user: string, image: string): unknown[] {
  const messages: unknown[] = [];
  if (system) messages.push({ role: 'system', content: system });
  if (image) {
    messages.push({
      role: 'user',
      content: [
        { type: 'text', text: user },
        { type: 'image_url', image_url: { url: image } }
      ]
    });
  } else {
    messages.push({ role: 'user', content: user });
  }
  return messages;
}

/* ─── Cloudflare Workers AI ────────────────────────────────
   10,000 Neurons/day free is roughly 615 messages at this app's prompt size,
   against ~94 for Groq's free plan. Cheapest free tier of the three. */

async function callCloudflare(
  system: string,
  user: string,
  model: string,
  maxOut: number
): Promise<Result> {
  const token = Deno.env.get('CLOUDFLARE_API_TOKEN') ?? '';
  const account = Deno.env.get('CLOUDFLARE_ACCOUNT_ID') ?? '';
  if (!token || !account) throw new Error('CLOUDFLARE_API_TOKEN / CLOUDFLARE_ACCOUNT_ID not set');

  const res = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${account}/ai/run/${model}`,
    {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: openAIMessages(system, user, ''),
        max_tokens: maxOut,
        temperature: 0.2
      })
    }
  );

  const d = await res.json().catch(() => null);
  if (!res.ok || d?.success === false) {
    throw new Error(`cloudflare ${res.status}: ${JSON.stringify(d?.errors ?? d).slice(0, 200)}`);
  }

  const r = d?.result ?? {};
  const content: string = r.response ?? r?.choices?.[0]?.message?.content ?? '';
  if (!content) throw new Error('cloudflare: empty response');

  return {
    content,
    inTok: Number(r?.usage?.prompt_tokens ?? 0),
    outTok: Number(r?.usage?.completion_tokens ?? 0),
    model,
    provider: 'cloudflare'
  };
}

/* ─── Google Gemini ────────────────────────────────────────
   500 requests/day free on the Flash-Lite models. Read the privacy note at the
   top of this file before routing personal data through it. */

async function callGemini(
  system: string,
  user: string,
  image: string,
  model: string,
  maxOut: number
): Promise<Result> {
  const key = Deno.env.get('GEMINI_API_KEY') ?? '';
  if (!key) throw new Error('GEMINI_API_KEY not set');

  const parts: unknown[] = [{ text: user }];
  if (image) {
    const m = /^data:(image\/[a-z0-9.+-]+);base64,(.*)$/i.exec(image);
    if (m) parts.push({ inline_data: { mime_type: m[1], data: m[2] } });
  }

  const body: Record<string, unknown> = {
    contents: [{ role: 'user', parts }],
    generationConfig: { maxOutputTokens: maxOut, temperature: 0.2 }
  };
  if (system) body.systemInstruction = { parts: [{ text: system }] };

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    }
  );

  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`gemini ${res.status}: ${detail.slice(0, 200)}`);
  }

  const d = await res.json();
  const content: string = (d?.candidates?.[0]?.content?.parts ?? [])
    .map((p: { text?: string }) => p.text ?? '')
    .join('');
  if (!content) throw new Error('gemini: empty response');

  return {
    content,
    inTok: Number(d?.usageMetadata?.promptTokenCount ?? 0),
    outTok: Number(d?.usageMetadata?.candidatesTokenCount ?? 0),
    model,
    provider: 'gemini'
  };
}

/* ─── Groq ─────────────────────────────────────────────────
   OpenAI-compatible. On the free plan use gpt-oss-120b or qwen3.8-27b — the
   Llama models are not included in it. */

async function callGroq(
  system: string,
  user: string,
  image: string,
  model: string,
  maxOut: number
): Promise<Result> {
  const key = Deno.env.get('GROQ_API_KEY') ?? '';
  if (!key) throw new Error('GROQ_API_KEY not set');

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      messages: openAIMessages(system, user, image),
      temperature: 0.2,
      max_tokens: maxOut
    })
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`groq ${res.status}: ${detail.slice(0, 200)}`);
  }

  const d = await res.json();
  const content: string = d?.choices?.[0]?.message?.content ?? '';
  if (!content) throw new Error('groq: empty response');

  return {
    content,
    inTok: Number(d?.usage?.prompt_tokens ?? 0),
    outTok: Number(d?.usage?.completion_tokens ?? 0),
    model,
    provider: 'groq'
  };
}

/* Give the turn back when no answer was produced. Otherwise a user is charged
   quota for a provider outage they had nothing to do with. */
async function refundTurn(
  admin: ReturnType<typeof adminClient>,
  profileId: string
): Promise<void> {
  try {
    await admin.rpc('ai_refund_usage', { p_user: profileId });
  } catch { /* ignore */ }
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);

  const url = Deno.env.get('SUPABASE_URL') ?? '';
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
  if (!url || !anonKey) return json({ error: 'server_not_configured' }, 500);

  const freeDaily = Number(Deno.env.get('AI_FREE_DAILY') ?? '15');
  const proDaily = Number(Deno.env.get('AI_PRO_DAILY') ?? '300');
  const maxOut = Number(Deno.env.get('AI_MAX_OUTPUT_TOKENS') ?? '900');

  const chain = (Deno.env.get('AI_PROVIDER_CHAIN') ?? 'cloudflare,gemini,groq')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter((s): s is Provider => s === 'cloudflare' || s === 'gemini' || s === 'groq');

  if (chain.length === 0) return json({ error: 'no_providers_configured' }, 500);

  /* ── 1. Identify the caller ─────────────────────────────── */
  const authHeader = req.headers.get('Authorization') ?? '';
  if (!authHeader.startsWith('Bearer ')) return json({ error: 'sign_in_required' }, 401);

  const userClient = createClient(url, anonKey, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false }
  });

  const { data: authData, error: authErr } = await userClient.auth.getUser();
  if (authErr || !authData?.user) return json({ error: 'sign_in_required' }, 401);
  const authUid = authData.user.id;

  const admin = adminClient();

  /* ── 2. Map auth user → Havën profile, check plan ─────────
     profiles.auth_uid is the Supabase auth id; profiles.id is the app's own
     user id, which is what premium_status() and ai_usage expect. */
  let profileId = authUid;
  let isPro = false;
  try {
    const { data: prof } = await admin
      .from('profiles')
      .select('id')
      .eq('auth_uid', authUid)
      .maybeSingle();
    if (prof?.id) profileId = prof.id;

    const { data: status } = await admin.rpc('premium_status', { p_user_id: profileId });
    isPro = !!(status && (status as { premium?: boolean }).premium === true);
  } catch {
    /* Unknown plan → treat as free. Never fail open to Pro. */
  }

  const limit = isPro ? proDaily : freeDaily;

  /* ── 3. Reserve a turn BEFORE spending anything ───────────
     Fail closed: if the quota table can't be reached, refuse. Failing open
     would turn an outage into an unbounded bill — and on free tiers, into one
     caller draining every other user's shared allowance. */
  let used = 0;
  try {
    const { data: bumped, error: qErr } = await admin.rpc('ai_bump_usage', {
      p_user: profileId,
      p_limit: limit
    });
    if (qErr) throw qErr;
    used = Number(bumped ?? 0);
  } catch (e) {
    return json({ error: 'quota_unavailable', detail: String(e) }, 503);
  }

  if (used < 0) {
    return json(
      { error: 'daily_limit_reached', limit, plan: isPro ? 'pro' : 'free', used: limit },
      429
    );
  }

  /* ── 4. Read the request ────────────────────────────────── */
  const body = await req.json().catch(() => ({}));
  const system = typeof body?.system === 'string' ? body.system : '';
  const userText = typeof body?.user === 'string' ? body.user : '';
  const image =
    typeof body?.image === 'string' && body.image.startsWith('data:image/') ? body.image : '';

  if (!userText) {
    await refundTurn(admin, profileId);
    return json({ error: 'empty_prompt' }, 400);
  }

  /* Images cost real money and are a Pro feature. */
  if (image && !isPro) {
    await refundTurn(admin, profileId);
    return json({ error: 'images_are_pro', plan: 'free' }, 403);
  }

  /* ── 5. Walk the chain, cheapest first ──────────────────── */
  const candidates = image ? chain.filter(supportsVision) : chain;
  const failures: string[] = [];
  let result: Result | null = null;

  for (const provider of candidates) {
    const model = modelFor(provider);
    try {
      if (provider === 'cloudflare') {
        result = await callCloudflare(system, userText, model, maxOut);
      } else if (provider === 'gemini') {
        result = await callGemini(system, userText, image, model, maxOut);
      } else {
        result = await callGroq(system, userText, image, model, maxOut);
      }
      break;
    } catch (e) {
      /* A provider being down, rate-limited, or out of free quota is expected
         on free tiers. Record it and try the next one. */
      failures.push(String(e));
    }
  }

  if (!result) {
    await refundTurn(admin, profileId);
    return json(
      { error: 'all_providers_failed', tried: candidates, detail: failures },
      502
    );
  }

  /* ── 6. Log it. Never let logging break a reply. ────────── */
  const cost = (result.inTok / 1e6) * PRICE_IN + (result.outTok / 1e6) * PRICE_OUT;

  try {
    await admin.rpc('ai_log_turn', {
      p_user: profileId,
      p_model: `${result.provider}:${result.model}`,
      p_in: result.inTok,
      p_out: result.outTok,
      p_cost: cost
    });
  } catch { /* ignore */ }

  /* The client parses this exactly like it parses a direct Groq response. */
  return json({
    text: result.content,
    model: result.model,
    provider: result.provider,
    used,
    limit,
    plan: isPro ? 'pro' : 'free'
  });
});
