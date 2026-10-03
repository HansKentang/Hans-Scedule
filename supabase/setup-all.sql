-- ════════════════════════════════════════════════════════════════════
--  Havën Schedule — COMPLETE Supabase setup
--  Paste this entire file into the Supabase SQL Editor and press Run.
--
--  Safe to run more than once. Every statement is idempotent, and it
--  drops the old wide-open policies from the first draft.
--
--  Security model: rows are private to their owner, identified by the
--  Supabase auth uid. Rows with no owner (guest / signed-out) are not
--  readable or writable from the browser at all.
-- ════════════════════════════════════════════════════════════════════

-- ────────────────────────────────────────────────────────────────────
--  PART 1 — CORE TABLES (7)
-- ────────────────────────────────────────────────────────────────────

-- Public profile, one per signed-in app user.
-- NOTE: no email column. Email never leaves the device.
create table if not exists public.profiles (
  id text primary key,
  auth_uid uuid,
  display_name text,
  photo_url text,
  avatar_color text default '#b4ccbc',
  friend_code text,
  status text default 'offline',
  status_message text,
  stats jsonb default '{}'::jsonb,
  last_seen timestamptz default now(),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Drop the email column if an earlier draft created it.
alter table public.profiles drop column if exists email;

-- Entitlement mirror, kept current by a trigger on subscriptions.
alter table public.profiles add column if not exists premium_plan text;
alter table public.profiles add column if not exists premium_until timestamptz;
alter table public.profiles add column if not exists premium_provider text;
alter table public.profiles add column if not exists premium_cancel_at_period_end boolean default false;

-- One JSON blob per user holding every syncable haven-* key.
create table if not exists public.app_data (
  user_id text primary key,
  auth_uid uuid default auth.uid(),
  data jsonb not null default '{}'::jsonb,
  synced_at bigint not null default 0,
  version int not null default 1
);

-- Friendship link or pending request. users = [idA, idB].
create table if not exists public.friends (
  id text primary key,
  users text[] not null default '{}',
  status text not null default 'pending',
  initiated_by text,
  created_at timestamptz default now(),
  accepted_at timestamptz
);

-- Direct message thread between two users.
create table if not exists public.conversations (
  id text primary key,
  participants text[] not null default '{}',
  last_message jsonb,
  unread_count jsonb not null default '{}'::jsonb,
  last_read jsonb not null default '{}'::jsonb,
  typing jsonb not null default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Messages inside a conversation.
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id text not null,
  sender_id text not null,
  text text not null,
  read_by text[] not null default '{}',
  created_at timestamptz default now()
);

-- Friend challenges.
create table if not exists public.challenges (
  id uuid primary key default gen_random_uuid(),
  title text,
  description text,
  target int default 10,
  progress int default 0,
  status text default 'active',
  participants text[] not null default '{}',
  participant_names text[] not null default '{}',
  created_by text,
  created_at timestamptz default now()
);

-- Friend activity feed.
create table if not exists public.activity (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  user_name text,
  avatar_color text,
  text text,
  created_at timestamptz default now()
);

-- ────────────────────────────────────────────────────────────────────
--  PART 2 — BILLING TABLES (3)
-- ────────────────────────────────────────────────────────────────────

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  auth_uid uuid default auth.uid(),
  provider text not null default 'mock',
  plan text not null default 'yearly',
  interval text not null default 'year',
  status text not null default 'incomplete',
  price_id text,
  currency text not null default 'USD',
  amount_cents int not null default 0,
  provider_customer_id text,
  provider_subscription_id text,
  provider_checkout_id text,
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  canceled_at timestamptz,
  trial_end timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  auth_uid uuid default auth.uid(),
  provider text not null default 'mock',
  plan text,
  provider_order_id text,
  provider_transaction_id text,
  status text not null default 'pending',
  currency text not null default 'USD',
  amount_cents int not null default 0,
  receipt_url text,
  created_at timestamptz default now()
);

-- Written only by the billing Edge Function (service role). No client access.
create table if not exists public.webhook_events (
  id text primary key,
  provider text,
  event_type text,
  payload jsonb,
  received_at timestamptz default now()
);

-- ────────────────────────────────────────────────────────────────────
--  PART 3 — INDEXES
-- ────────────────────────────────────────────────────────────────────

create index if not exists messages_conversation_created_idx on public.messages (conversation_id, created_at);
create index if not exists activity_created_idx on public.activity (created_at desc);
create index if not exists profiles_auth_uid_idx on public.profiles (auth_uid);
-- One row per signed-in account. js/supabase.js upserts profiles on this
-- column, which Postgres can only infer when a unique index exists here.
create unique index if not exists profiles_auth_uid_key on public.profiles (auth_uid);
create index if not exists friends_users_idx on public.friends using gin (users);
create index if not exists conversations_participants_idx on public.conversations using gin (participants);
create index if not exists challenges_participants_idx on public.challenges using gin (participants);
create index if not exists subscriptions_user_idx on public.subscriptions (user_id);
create index if not exists subscriptions_active_idx on public.subscriptions (user_id, status, current_period_end);
create unique index if not exists subscriptions_provider_sub_idx
  on public.subscriptions (provider, provider_subscription_id) where provider_subscription_id is not null;
create index if not exists orders_user_idx on public.orders (user_id, created_at desc);
create unique index if not exists orders_provider_order_idx
  on public.orders (provider, provider_order_id) where provider_order_id is not null;
create unique index if not exists profiles_friend_code_idx on public.profiles (friend_code) where friend_code is not null;

-- ────────────────────────────────────────────────────────────────────
--  PART 3b — PER-ACCOUNT ISOLATION
-- ────────────────────────────────────────────────────────────────────

-- Backfill the owner on any app_data row written before RLS existed. Without
-- this, an ownerless row is invisible to RLS (auth_uid = auth.uid() never
-- matches null) and the account can never read or save its own blob again.
update public.app_data a
   set auth_uid = p.auth_uid
  from public.profiles p
 where a.auth_uid is null
   and p.auth_uid is not null
   and p.id = a.user_id;

-- app_data rows are keyed by a device-local id (user_id), which the browser
-- supplies, so the id alone is not a security boundary. This trigger pins
-- every row to the signed-in account: it forces auth_uid from the JWT and
-- rejects a user_id that belongs to a different profile, so one account can
-- never insert a row under another account's key.
create or replace function public.app_data_force_owner()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  pid text;
begin
  /* No JWT (service role / SQL editor) — leave the row untouched. */
  if auth.uid() is null then
    return new;
  end if;
  new.auth_uid := auth.uid();
  pid := public.current_profile_id();
  if pid is not null and new.user_id is distinct from pid then
    raise exception 'app_data row must belong to the signed-in account';
  end if;
  return new;
end;
$$;

drop trigger if exists app_data_force_owner on public.app_data;
create trigger app_data_force_owner
  before insert or update on public.app_data
  for each row execute function public.app_data_force_owner();

-- Safe, public projection of profiles. The client reads other users through
-- this view so their auth_uid and premium/billing columns are never exposed.
-- The view is NOT security_invoker, so it runs with the owner's privileges and
-- can see every row while only emitting the safe columns.
create or replace view public.profiles_public as
  select id,
         display_name,
         photo_url,
         avatar_color,
         friend_code,
         status,
         status_message,
         stats,
         last_seen
    from public.profiles;

grant select on public.profiles_public to authenticated;

-- ────────────────────────────────────────────────────────────────────
--  PART 4 — IDENTITY + ENTITLEMENT HELPERS
-- ────────────────────────────────────────────────────────────────────

-- Maps the signed-in Supabase auth uid to this app's local profile id.
-- SECURITY DEFINER so it can read profiles without tripping its own RLS.
create or replace function public.current_profile_id()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select p.id from public.profiles p where p.auth_uid = auth.uid() limit 1;
$$;

-- True when the user has an active, trialing, or still-paid-through subscription.
create or replace function public.has_premium(p_user_id text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.subscriptions s
    where s.user_id = p_user_id
      and s.status in ('active', 'trialing', 'canceled')
      and (s.current_period_end is null or s.current_period_end > now())
  );
$$;

-- Entitlement for the CALLER only. The p_user_id argument is accepted for
-- backwards compatibility and deliberately ignored — asking about someone
-- else's account returns your own status, never theirs.
create or replace function public.premium_status(p_user_id text default null)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  pid text;
  result jsonb;
begin
  pid := public.current_profile_id();
  if pid is null then
    return jsonb_build_object('premium', false);
  end if;

  select jsonb_build_object(
           'premium', true,
           'plan', s.plan,
           'interval', s.interval,
           'status', s.status,
           'provider', s.provider,
           'until', s.current_period_end,
           'cancel_at_period_end', s.cancel_at_period_end
         )
    into result
    from public.subscriptions s
   where s.user_id = pid
     and s.status in ('active', 'trialing', 'canceled')
     and (s.current_period_end is null or s.current_period_end > now())
   order by s.current_period_end desc nulls first
   limit 1;

  return coalesce(result, jsonb_build_object('premium', false));
end;
$$;

-- Mirror entitlement onto the profile row for fast reads.
create or replace function public.refresh_profile_premium(p_user_id text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  s record;
begin
  select * into s
    from public.subscriptions
   where user_id = p_user_id
     and status in ('active', 'trialing', 'canceled')
     and (current_period_end is null or current_period_end > now())
   order by current_period_end desc nulls first
   limit 1;

  update public.profiles
     set premium_plan = s.plan,
         premium_until = s.current_period_end,
         premium_provider = s.provider,
         premium_cancel_at_period_end = coalesce(s.cancel_at_period_end, false),
         updated_at = now()
   where id = p_user_id;
end;
$$;

create or replace function public.sync_premium_to_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.refresh_profile_premium(coalesce(new.user_id, old.user_id));
  return null;
end;
$$;

drop trigger if exists subscriptions_sync_profile on public.subscriptions;
create trigger subscriptions_sync_profile
  after insert or update or delete on public.subscriptions
  for each row execute function public.sync_premium_to_profile();

-- ────────────────────────────────────────────────────────────────────
--  PART 5 — ROW LEVEL SECURITY
-- ────────────────────────────────────────────────────────────────────

alter table public.profiles       enable row level security;
alter table public.app_data       enable row level security;
alter table public.friends        enable row level security;
alter table public.conversations  enable row level security;
alter table public.messages       enable row level security;
alter table public.challenges     enable row level security;
alter table public.activity       enable row level security;
alter table public.subscriptions  enable row level security;
alter table public.orders         enable row level security;
alter table public.webhook_events enable row level security;

-- Remove the wide-open policies from the first draft.
do $$
declare t text;
begin
  foreach t in array array['profiles','app_data','friends','conversations','messages',
                           'challenges','activity','subscriptions','orders','webhook_events'] loop
    execute format('drop policy if exists "haven_all" on public.%I', t);
  end loop;
end $$;

drop policy if exists "haven_premium_read" on public.subscriptions;
drop policy if exists "haven_premium_test_write" on public.subscriptions;
drop policy if exists "haven_orders_read" on public.orders;
drop policy if exists "haven_orders_test_write" on public.orders;
drop policy if exists "haven_webhook_read" on public.webhook_events;

-- ── profiles: the owner may read their own full row (including billing
--    mirror). Other users are discovered through public.profiles_public,
--    which exposes only the safe columns.
drop policy if exists "profiles_select" on public.profiles;
create policy "profiles_select" on public.profiles
  for select to authenticated using (auth_uid = auth.uid());

drop policy if exists "profiles_insert" on public.profiles;
create policy "profiles_insert" on public.profiles
  for insert to authenticated with check (auth_uid = auth.uid());

drop policy if exists "profiles_update" on public.profiles;
create policy "profiles_update" on public.profiles
  for update to authenticated
  using (auth_uid = auth.uid()) with check (auth_uid = auth.uid());

drop policy if exists "profiles_delete" on public.profiles;
create policy "profiles_delete" on public.profiles
  for delete to authenticated using (auth_uid = auth.uid());

-- ── app_data: strictly the owner. This is what protects the synced blob.
drop policy if exists "app_data_owner" on public.app_data;
create policy "app_data_owner" on public.app_data
  for all to authenticated
  using (auth_uid = auth.uid()) with check (auth_uid = auth.uid());

-- ── friends: visible and writable only to the two people in the pair.
drop policy if exists "friends_pair" on public.friends;
create policy "friends_pair" on public.friends
  for all to authenticated
  using (public.current_profile_id() = any(users))
  with check (public.current_profile_id() = any(users));

-- ── conversations: participants only.
drop policy if exists "conversations_members" on public.conversations;
create policy "conversations_members" on public.conversations
  for all to authenticated
  using (public.current_profile_id() = any(participants))
  with check (public.current_profile_id() = any(participants));

-- ── messages: readable and writable by members of the thread.
drop policy if exists "messages_members" on public.messages;
create policy "messages_members" on public.messages
  for all to authenticated
  using (
    exists (
      select 1 from public.conversations c
      where c.id = messages.conversation_id
        and public.current_profile_id() = any(c.participants)
    )
  )
  with check (
    sender_id = public.current_profile_id()
    and exists (
      select 1 from public.conversations c
      where c.id = messages.conversation_id
        and public.current_profile_id() = any(c.participants)
    )
  );

-- ── challenges: participants can read and progress; creator can delete.
drop policy if exists "challenges_select" on public.challenges;
create policy "challenges_select" on public.challenges
  for select to authenticated
  using (public.current_profile_id() = any(participants) or created_by = public.current_profile_id());

drop policy if exists "challenges_insert" on public.challenges;
create policy "challenges_insert" on public.challenges
  for insert to authenticated
  with check (created_by = public.current_profile_id());

drop policy if exists "challenges_update" on public.challenges;
create policy "challenges_update" on public.challenges
  for update to authenticated
  using (public.current_profile_id() = any(participants))
  with check (public.current_profile_id() = any(participants));

drop policy if exists "challenges_delete" on public.challenges;
create policy "challenges_delete" on public.challenges
  for delete to authenticated using (created_by = public.current_profile_id());

-- ── activity: readable by the author and their accepted friends only — not by
--    every signed-in user. Writable by the author.
drop policy if exists "activity_select" on public.activity;
create policy "activity_select" on public.activity
  for select to authenticated
  using (
    user_id = public.current_profile_id()
    or exists (
      select 1 from public.friends f
       where f.status = 'accepted'
         and public.current_profile_id() = any(f.users)
         and activity.user_id = any(f.users)
    )
  );

drop policy if exists "activity_insert" on public.activity;
create policy "activity_insert" on public.activity
  for insert to authenticated with check (user_id = public.current_profile_id());

drop policy if exists "activity_delete" on public.activity;
create policy "activity_delete" on public.activity
  for delete to authenticated using (user_id = public.current_profile_id());

-- ── subscriptions / orders: the owner can read. Writes are limited to the
--    TEST 'mock' provider so you can try the whole flow before going live.
--    Real grants come from the billing Edge Function using the service role.
drop policy if exists "subscriptions_owner_read" on public.subscriptions;
create policy "subscriptions_owner_read" on public.subscriptions
  for select to authenticated using (auth_uid = auth.uid());

drop policy if exists "subscriptions_mock_insert" on public.subscriptions;
create policy "subscriptions_mock_insert" on public.subscriptions
  for insert to authenticated
  with check (auth_uid = auth.uid() and provider = 'mock');

drop policy if exists "subscriptions_mock_update" on public.subscriptions;
create policy "subscriptions_mock_update" on public.subscriptions
  for update to authenticated
  using (auth_uid = auth.uid() and provider = 'mock')
  with check (auth_uid = auth.uid() and provider = 'mock');

drop policy if exists "subscriptions_mock_delete" on public.subscriptions;
create policy "subscriptions_mock_delete" on public.subscriptions
  for delete to authenticated using (auth_uid = auth.uid() and provider = 'mock');

drop policy if exists "orders_owner_read" on public.orders;
create policy "orders_owner_read" on public.orders
  for select to authenticated using (auth_uid = auth.uid());

drop policy if exists "orders_mock_insert" on public.orders;
create policy "orders_mock_insert" on public.orders
  for insert to authenticated
  with check (auth_uid = auth.uid() and provider = 'mock');

-- ── webhook_events: NO policies on purpose. Only the service role (used by the
--    Edge Function) can touch it; every browser request is denied.

-- ── profiles_public: safe directory for friend search / chat / leaderboard.
-- Runs as the view owner so it bypasses the owner-only policy on profiles,
-- but exposes no premium / billing columns and no auth_uid.
create or replace view public.profiles_public
with (security_invoker = false) as
select
  id,
  display_name,
  photo_url,
  avatar_color,
  friend_code,
  status,
  status_message,
  last_seen,
  stats
from public.profiles;

-- ── Grants. RLS decides which ROWS you may touch; these decide which tables.
grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on public.profiles,
      public.app_data, public.friends, public.conversations, public.messages,
      public.challenges, public.activity, public.subscriptions, public.orders
  to authenticated;
grant select on public.profiles_public to authenticated;
grant execute on function public.current_profile_id() to authenticated;
grant execute on function public.premium_status(text) to authenticated;
grant execute on function public.has_premium(text) to authenticated;

-- ────────────────────────────────────────────────────────────────────
--  PART 6 — REALTIME
-- ────────────────────────────────────────────────────────────────────
-- If a line here says "already member of publication", ignore it.
alter publication supabase_realtime add table public.friends;
alter publication supabase_realtime add table public.conversations;
alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.challenges;
alter publication supabase_realtime add table public.activity;
alter publication supabase_realtime add table public.subscriptions;

-- ════════════════════════════════════════════════════════════════════
--  PART 7 — GO-LIVE LOCK-DOWN  (run AFTER the billing function works)
-- ════════════════════════════════════════════════════════════════════
-- Uncomment the two blocks below and Run once more when you switch from the
-- test 'mock' provider to Paddle or Dodo Payments. After this, nobody can
-- grant themselves Premium from the browser — only a verified webhook can.
--
-- drop policy if exists "subscriptions_mock_insert" on public.subscriptions;
-- drop policy if exists "subscriptions_mock_update" on public.subscriptions;
-- drop policy if exists "subscriptions_mock_delete" on public.subscriptions;
-- drop policy if exists "orders_mock_insert" on public.orders;
--
-- Then in js/premium-config.js set:
--   provider: 'paddle'   (or 'dodo')
--   mode: 'live'
