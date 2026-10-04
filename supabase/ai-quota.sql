/* Havën Schedule — AI quota + usage log

   Run once in the Supabase SQL Editor. Safe to re-run.

   Creates:
     ai_usage  — one row per user per day. The quota counter.
     ai_logs   — one row per AI message. Token + cost accounting.
     ai_bump_usage(p_user, p_limit) — atomic "increment and check".

   Why the function instead of a plain UPDATE: two messages sent at the same
   moment would both read count=14, both decide they're under a 15 limit, and
   both write 15. You'd get 16 messages for a 15 limit, and under a scraper the
   error compounds fast. This does the increment and the check in one statement,
   inside one transaction, so the race can't happen.

   Only the service role can call it — the browser can't touch these tables at
   all, which is the point.
*/

/* ── Day boundary ───────────────────────────────────────────
   Quotas reset at midnight in this timezone. Asia/Jakarta matches the primary
   user base. Change it here and in ai_bump_usage below if that changes. */

create table if not exists public.ai_usage (
  user_id    uuid        not null,
  day        date        not null,
  turns      int         not null default 0,
  in_tokens  bigint      not null default 0,
  out_tokens bigint      not null default 0,
  updated_at timestamptz not null default now(),
  primary key (user_id, day)
);

create index if not exists ai_usage_day_idx on public.ai_usage (day);

create table if not exists public.ai_logs (
  id         bigserial   primary key,
  user_id    uuid        not null,
  model      text,
  in_tokens  int         not null default 0,
  out_tokens int         not null default 0,
  cost_usd   numeric(10,6) not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists ai_logs_created_idx on public.ai_logs (created_at desc);
create index if not exists ai_logs_user_idx    on public.ai_logs (user_id, created_at desc);

/* ── Atomic increment + check ───────────────────────────────
   Returns the user's message count for today after incrementing.
   Returns -1 when the request is over the limit (and rolls the count back,
   so a blocked request doesn't inflate the number the user sees). */

create or replace function public.ai_bump_usage(p_user uuid, p_limit int)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_day   date := (now() at time zone 'Asia/Jakarta')::date;
  v_turns int;
begin
  insert into public.ai_usage (user_id, day, turns)
  values (p_user, v_day, 1)
  on conflict (user_id, day)
  do update set turns = ai_usage.turns + 1,
                updated_at = now()
  returning turns into v_turns;

  if v_turns > p_limit then
    update public.ai_usage
       set turns = turns - 1,
           updated_at = now()
     where user_id = p_user
       and day = v_day;
    return -1;
  end if;

  return v_turns;
end;
$$;

/* Record token usage after a successful call. Best-effort — never blocks a reply. */
create or replace function public.ai_log_turn(
  p_user uuid,
  p_model text,
  p_in int,
  p_out int,
  p_cost numeric
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.ai_logs (user_id, model, in_tokens, out_tokens, cost_usd)
  values (p_user, p_model, coalesce(p_in,0), coalesce(p_out,0), coalesce(p_cost,0));

  update public.ai_usage
     set in_tokens  = in_tokens  + coalesce(p_in,0),
         out_tokens = out_tokens + coalesce(p_out,0)
   where user_id = p_user
     and day = (now() at time zone 'Asia/Jakarta')::date;
end;
$$;

/* Hand a reserved turn back. Called when every provider failed or the request
   was rejected after the reserve — so a user is never charged quota for an
   outage that had nothing to do with them. */
create or replace function public.ai_refund_usage(p_user uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.ai_usage
     set turns = greatest(turns - 1, 0),
         updated_at = now()
   where user_id = p_user
     and day = (now() at time zone 'Asia/Jakarta')::date;
end;
$$;

/* ── Lock it down ───────────────────────────────────────────
   RLS on, no policies, and execute revoked from every browser-facing role.
   The Edge Function uses the service-role key, which bypasses both. */

alter table public.ai_usage enable row level security;
alter table public.ai_logs  enable row level security;

revoke all on function public.ai_bump_usage(uuid, int)      from public, anon, authenticated;
revoke all on function public.ai_refund_usage(uuid)         from public, anon, authenticated;
revoke all on function public.ai_log_turn(uuid, text, int, int, numeric) from public, anon, authenticated;

/* ── Handy: what did this month cost? ───────────────────────
   select date_trunc('month', created_at) as month,
          count(*)              as messages,
          sum(in_tokens)        as in_tok,
          sum(out_tokens)       as out_tok,
          round(sum(cost_usd),2) as cost_usd
     from public.ai_logs
    group by 1 order by 1 desc;

   ── Handy: who is hammering it? ────────────────────────────
   select user_id, sum(turns) as turns_30d
     from public.ai_usage
    where day > current_date - 30
    group by 1 order by 2 desc limit 20;

   ── Retention: keep 90 days of logs ────────────────────────
   delete from public.ai_logs  where created_at < now() - interval '90 days';
   delete from public.ai_usage where day        < current_date - interval '90 days';
*/
