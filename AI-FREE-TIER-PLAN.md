# Free AI for every user — plan and cost model

**Date:** 2026-10-04
**Question:** can Havën give every user a free AI assistant, and what does it cost?

**Short answer:** yes, and it's cheaper than you'd guess — roughly **2 US cents per active user per month**. But the average user isn't the problem. The tail is. Cap the tail and this is affordable; skip the cap and one person can cost you as much as a thousand.

---

## 1. Where you are today

AI is **bring-your-own-key**. The user pastes a Groq or Gemini key into Settings; it lands in `localStorage` under `haven-schedule-apikey`; the browser calls Groq directly (`shared.js:7666`).

Three consequences:

1. **Nobody will do it.** Asking a Semarang student to go to `console.groq.com/keys`, make an account, and paste a 50-character string is a wall. Realistically this kills AI adoption on its own.
2. **`sendAIMessage()` silently returns when there's no key** (`shared.js:7065`). No key = no reply, no explanation. The chat box just does nothing.
3. **`PREMIUM_FEATURES.ai.enforce` is `true`** (`premium-config.js`). AI is currently meant to be a Pro-only feature. So "free AI for everyone" is a **business decision**, not just a plumbing change — see §5.

The good news: you've already built two of the three pieces this needs.

- **`localCommandParser()`** (`shared.js:7370`) already answers free-time / task-count / workload / task-list / clear-schedule queries **with zero API calls**, and it runs *before* the API (`shared.js:7084`).
- **`supabase/functions/billing`** is already a working Edge Function with secrets, CORS, and the service-role pattern. The AI proxy is the same shape.

---

## 2. What NOT to do

**Do not ship your own API key inside the app.** Not obfuscated, not base64'd, not in a "hidden" JS file. Anyone can open DevTools, read the key off the network tab, and use it. Your key gets scraped within days of any public launch, and you find out when the bill arrives. This is the single most common way small apps die on AI costs.

The key must live on a server you control. Everything below follows from that one rule.

---

## 3. The design that works

Put a **Supabase Edge Function between the browser and Groq**. It's the only place the key exists.

```
Browser  ──►  Edge Function "ai"  ──►  Groq
              (holds the key)
```

Per request the function does six things:

1. **Verify the caller's JWT** → get a real user id. No JWT, no AI.
2. **Check the daily quota** — atomic increment against an `ai_usage` table. Free users get 15 messages/day, Pro gets 300.
3. **Build the messages** and call Groq with the server-side key.
4. **Log tokens and cost** to `ai_logs` so you can see the bill before it arrives.
5. **Return the reply** in the exact shape `callAIAgent()` already expects: `{ text, actions }`.
6. **Fail closed** — if the quota table is unreachable, refuse the request rather than let it through unmetered.

Why this slots into your code with almost no surgery: `callAIChat()` (`shared.js:7615`) is a **single choke point**. Every AI call in the app goes through it. Swap its body to call the Edge Function instead of Groq, and everything downstream — plan mode, `executeActions`, chat history, the confirm/cancel buttons — keeps working untouched.

### The one wrinkle: guests have no JWT

Guests and local-only profiles have no `authUid`, so they have no Supabase token, so the function can't identify them or count their usage.

Two ways out:

- **(a) Require sign-in for free AI.** Simplest. Also good for you: it converts anonymous visitors into accounts, and you get an email.
- **(b) Turn on anonymous auth** and call `supabase.auth.signInAnonymously()` on first load. Every visitor gets a real `auth.users` row and a JWT — still countable and rate-limitable — and can upgrade to a full account later with `linkIdentity()`. No wall, no lost user.

**Recommendation: (b).** It keeps the "just open the app and it works" feel, and it also fixes the awkward guest/local/cloud split in your storage model.

---

## 4. What it costs

### Per-message cost

Your `callAIAgent()` prompt is large. Roughly:

| Part | Tokens |
|---|---|
| System prompt (persona, rules, action schema, schedule context) | ~1,850 |
| User message | ~20 |
| **Input total** | **~1,870** |
| Output JSON (`{"text":…,"actions":[…]}`) | ~250 |

At your current default model (Groq Llama 3.3 70B, **$0.59 / $0.79 per million** tokens):

```
input   1,870 × $0.59/1M  = $0.001103
output    250 × $0.79/1M  = $0.000198
                            ─────────
                            $0.001301   per message
```

"Schedule my week" turns are heavier (~1,200 output tokens) → ~$0.0021. Blend the two:

> **≈ $0.0014 per AI message — about $1.40 per 1,000 messages.**

### Per user, per month

A moderately engaged user sends ~15 messages/month.

> **≈ $0.021 per active user per month.**

### By scale

| Monthly active users | Messages/mo | AI cost/mo |
|---:|---:|---:|
| 100 | 1,500 | $2 |
| 1,000 | 15,000 | $21 |
| 5,000 | 75,000 | $105 |
| 10,000 | 150,000 | $210 |
| 50,000 | 750,000 | $1,050 |

Note this is **active** users, not signups. Dormant accounts cost nothing.

### The infrastructure is free until you're big

Supabase Edge Functions: **500,000 invocations/month on the free plan**, then $2 per million. At 10,000 active users you're using 150,000 — comfortably inside free. You won't pay Supabase anything for this until roughly 33,000 active users.

**So the whole cost is tokens. There is no fixed cost.**

---

## 5. The uncomfortable part

Free AI is cheap per user. The question is whether it pays for itself.

Your yearly plan is Rp 199,000 ≈ **$12.36/year ≈ $1.03/month** per paying user (at Rp 16,100/USD).

```
Cost per active free user:      $0.021 / month
Revenue per paying user:        $1.03  / month
Break-even conversion:          0.021 ÷ 1.03 = 2.0%
```

**You need ~2% of active users paying just to cover the AI.** That's before Supabase compute, payment processing (3–5%), and your own time. Realistically **3%**.

If your revenue model assumed 2% conversion, free AI moves the goalposts to 3–4%. That's the honest trade: free AI is a growth lever that raises your break-even.

**But** — AI is the feature most likely to *raise* conversion in the first place. A scheduling app with a working assistant is a different product from one with a chat box that does nothing without an API key. My read: worth it, but decide it deliberately, not by accident.

### The tail is the real risk

The average is fine. One bad actor is not:

```
1 account × 500 messages/day × 30 days = 15,000 messages = $21/month
```

One scripted account costs the same as **1,000 normal users**. Ten of them cost as much as your first 10,000 users.

**This is why the quota table is not optional.** The daily cap barely touches normal use (a typical user sends one message every other day) — it exists purely to cut the tail off.

---

## 6. Free vs Pro

Don't give away the whole feature. Split it so free is genuinely useful and Pro is genuinely better:

| | Free | Pro |
|---|---|---|
| Messages/day | 15 | 300 |
| Model | Llama 3.3 70B | better planning model |
| Image/file analysis | no | yes |
| Everything else | full | full |
| **Bring your own key** | **yes, unlimited** | yes, unlimited |

That last row matters. BYOK already exists and it costs you nothing — keep it as the escape hatch for power users. Someone who wants unlimited AI can paste their own key and you never pay a cent. Three tiers, one code path:

- **Free** — his key, capped. Zero setup for the user.
- **BYOK** — their key, uncapped. Zero cost for you.
- **Pro** — his key, uncapped, better model. Revenue.

This also means `PREMIUM_FEATURES.ai` stops being an on/off gate and becomes a quota gate. `enforce` stays `true`, but the thing it enforces changes from "no AI" to "15 messages/day".

---

## 7. Cutting the cost roughly in half

Two changes, both worth doing before launch:

**1. Route local first.** You already do this — `localCommandParser()` answers free-time, task-count, workload, task-list and clear-schedule queries for free. Extend it to cover more of the obvious stuff ("what's tomorrow look like", "how many hours of math this week"). A scheduling assistant gets a lot of repetitive questions; every one you catch locally is a message you don't pay for. **Catching 30% of traffic is a 30% cost cut.**

**2. Trim the system prompt.** At 1,850 tokens it's **80% of your per-message cost**, and it's re-sent on every single message. The `EXAMPLES:` block and the prose in `TASK RULES:` are the fat — a well-written action schema doesn't need worked examples. Getting to ~1,200 tokens cuts input by 36%, which cuts total cost by **~29%**.

Together:

```
$0.0014  →  × 0.70 (local-first)  × 0.71 (prompt trim)  ≈  $0.0007 per message
$0.021   →  $0.0105 per active user per month
break-even conversion: 2.0%  →  ~1.0%
```

**Do the cheap engineering first, and free AI costs about half of what it looks like on paper.** That's the difference between "this raises my break-even" and "this is basically free."

One more: keep the output cap low (900 tokens). Output is only ~14% of cost, but it's where a runaway response can blow up a single call.

---

## 8. What I've built for you

Three files, all additive — nothing existing is touched, nothing breaks:

| File | What it is |
|---|---|
| `supabase/functions/ai/index.ts` | The proxy. Deploy-ready. |
| `supabase/ai-quota.sql` | The `ai_usage` + `ai_logs` tables and the atomic quota function. |
| `AI-FREE-TIER-PLAN.md` | This document. |

I have **not** touched `shared.js`. Flipping the client to the proxy before the function is deployed would break AI for you immediately. That change comes after the deploy — it's about 25 lines, and I'll do it when you say go.

---

## 9. Going live

You'll need to do these; I can't do them without your accounts.

**1. Sign up for the free providers** (see §10 for the comparison):

- **Cloudflare Workers AI** — `dash.cloudflare.com` → AI → Workers AI. Note your **Account ID**, create an API token. Biggest free allowance, no privacy clause. **Start here.**
- **Groq** — `console.groq.com/keys`. Free plan, but watch the 200K tokens/day cap.
- **Gemini** — `aistudio.google.com/api-keys`. Optional, and read the privacy note in §10 first.

**2. Run the SQL.** Supabase dashboard → SQL Editor → paste `supabase/ai-quota.sql` → Run.

**3. Deploy the function.**
```
supabase functions deploy ai --no-verify-jwt
```
(`--no-verify-jwt` because the browser sends a user token, not a Supabase service token — the function verifies the user itself.)

**4. Set the secrets.**
```
supabase secrets set \
  AI_PROVIDER_CHAIN=cloudflare,gemini,groq \
  CLOUDFLARE_ACCOUNT_ID=... CLOUDFLARE_API_TOKEN=... \
  GROQ_API_KEY=gsk_... \
  AI_FREE_DAILY=15 \
  AI_PRO_DAILY=300 \
  AI_MAX_OUTPUT_TOKENS=900
```
Only list providers you actually created keys for — leave the others out of the chain. `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are injected automatically.

**5. Enable anonymous sign-in.** Supabase → Authentication → Providers → Anonymous → on. (Only if you go with option (b) in §3.)

**6. Tell me, and I'll wire the client.** Then we test with a fresh account.

---

## 10. Can it be completely free?

**Yes — for roughly your first 2,000–2,400 active users.** Past that it starts costing money, but by then you have enough users to pay for it.

### The arithmetic that decides everything

Free tiers are limited **per project**, not per user. Every request from every one of your users comes out of the *same* bucket. So the question isn't "how many free messages do I get" — it's "how many free messages do I get *in total, per day*."

And your prompt is expensive by free-tier standards: ~1,870 tokens in, ~250 out.

### The three genuinely free options

| Provider | Free allowance | What that means for you |
|---|---|---|
| **Cloudflare Workers AI** | 10,000 Neurons/day | **~420–615 messages/day** — best by far |
| **Gemini** (Flash-Lite) | 500 requests/day | 500 messages/day — but see the privacy problem |
| **Groq** (free plan) | 1,000 req/day **but 200K tokens/day** | **~94 messages/day** — the token cap binds, not the request cap |

Worked out:

```
Cloudflare   llama-3.2-3b-instruct   1,870 in × 4,625/M + 250 out × 30,475/M
                                      = 16.3 neurons per message
                                      10,000 ÷ 16.3 ≈ 613 messages/day

Gemini       flash-lite               500 requests/day, counted per request
                                      = 500 messages/day

Groq         gpt-oss-120b             1,870 + 250 = 2,120 tokens per message
                                      200,000 ÷ 2,120 ≈ 94 messages/day
```

**Stacked: ~1,000–1,200 messages/day, free.** At 15 messages per active user per month (about one every other day), that's **~2,400 active users** before you pay anything.

Two things push that ceiling higher:

- **Groq's prompt caching** is automatic and **cached input tokens don't count towards rate limits**. Your system prompt is mostly static — if ~1,200 of those 1,870 tokens get cached, Groq's allowance goes from ~94 to ~220 messages/day.
- **Cloudflare's cheaper models.** `granite-4.0-h-micro` would stretch 10,000 Neurons to ~1,800 messages/day, but it's a tiny model and probably can't hold your JSON action schema together. Test before trusting it.

### The three catches

**1. It's one shared pool, so one person can drain it for everyone.** This is why the per-user quota table isn't optional — it was protecting your wallet, and now it's protecting *everyone else's* free messages too. Already built.

**2. Gemini's free tier has a privacy cost you have to decide about.** Google's terms say content sent through an **unpaid** project can be used to improve their products, and human reviewers can process it. For an app holding someone's schedule, goals, and finance, that's not a technical footnote — it's something you'd have to disclose. Separately, Google's terms **require paid services** if you offer a Gemini client to users in the EEA, Switzerland, or the UK.

My recommendation: **put Cloudflare first and leave Gemini out, or last.** Cloudflare doesn't carry that clause.

**3. Free tiers change without warning.** One of the sources I read while checking this was literally titled *"Groq Free Tier 2026: 1,000 Requests a Day, Llama Is Gone"* — Groq dropped Llama from its free plan, and the model your app currently defaults to (`llama-3.3-70b-versatile`) is **not on the free plan at all**. A single-provider free setup will break on you eventually. **The provider chain is what makes free survivable** — when one runs out or changes, the next one answers.

### The one option with genuinely no ceiling

Running a small model **inside the browser** (WebLLM, transformers.js, via WebGPU) is the only setup that is free forever, has no quota, works offline, and never sends the user's data anywhere. For a privacy-first personal app that's genuinely attractive.

But: a 1–2 GB model download, WebGPU support on mid-range Android is unreliable, slow first load, and a 1–3B model will struggle with your scheduling logic. Not the main path today. Worth revisiting later as an offline fallback, especially for the local-only command parsing you already do.

### What I changed in the code

The proxy now walks a **provider chain**, cheapest first:

```
AI_PROVIDER_CHAIN=cloudflare,gemini,groq
```

If a provider is down, rate-limited, or out of free quota, it moves to the next one. Only the last resort costs money — so the app is free until it isn't, and it never breaks.

Three fixes to what I shipped earlier, all found while checking this:

1. **The default Groq model was wrong.** `llama-3.3-70b-versatile` isn't on Groq's free plan. Changed to `openai/gpt-oss-120b`.
2. **Added `ai_refund_usage`.** A reserved turn is now handed back if every provider fails, so a user is never charged quota for an outage that had nothing to do with them.
3. **Dropped `response_format: json_object`.** It isn't supported consistently across the three providers. Your prompt already says "RESPOND with ONLY valid JSON", and the client already has a `/\{[\s\S]*\}/` fallback — so it wasn't buying much and was costing portability.

### What you'd sign up for

| Service | Where | Free? |
|---|---|---|
| Cloudflare Workers AI | `dash.cloudflare.com` → AI → Workers AI | Yes, 10,000 Neurons/day |
| Groq | `console.groq.com/keys` | Yes, but check the token cap |
| Gemini | `aistudio.google.com/api-keys` | Yes, with the privacy trade-off |

Cloudflare is the one to start with — biggest allowance, no privacy clause, and it also gives you a free Workers tier if you ever want to move the proxy off Supabase.

---

## 11. Risks, stated plainly

- **Cost creep.** You will not notice $21/month. You *will* notice the month a scraper finds you. Set a billing alert on the Groq account on day one, and check `ai_logs` weekly for the first month.
- **Prompt injection.** A user can type instructions that make the model emit `clearAllTasks`. You already defend against this — plan mode makes the user confirm destructive actions before `executeActions` runs. **Keep that.** Never let the proxy auto-execute actions.
- **`ai_logs` growth.** One row per message. At 150,000/month it's fine for a while, but add a cleanup job or a 90-day retention policy before it becomes a 500MB-database problem.
- **Lock-in.** Groq-specific fields are confined to one function. Swapping to Gemini or OpenRouter is a ~20-line change in `index.ts`.
- **Quality.** A free tier invites "the AI is dumb" complaints. If 15 messages/day feels stingy, raise the cap before you downgrade the model — users blame the model, not the limit.

---

## 12. Two smaller things I noticed while reading

Not urgent, but worth knowing:

- There appear to be **two Gemini call paths** — `shared.js:4606` and `shared.js:7719` — both hitting `generativelanguage.googleapis.com`. If that's a duplicate, one is dead code. Worth a look.
- `state.apiModel` and `state.apiProvider` are read in the AI path but I couldn't find where `apiProvider` is initialised on boot (only written from the settings dropdown). If a user never opens Settings, the provider may be `undefined` and silently fall through to Groq. Related to why AI "does nothing" for some people.
