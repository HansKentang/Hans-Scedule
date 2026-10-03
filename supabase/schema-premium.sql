-- DEPRECATED — DO NOT RUN.
-- Billing tables and entitlement logic now live in supabase/setup-all.sql
-- (PART 2 + PART 4) with owner-only RLS. Running this old file would reopen
-- subscriptions/orders/webhook_events to anon. Use setup-all.sql instead.
select 'DEPRECATED: run supabase/setup-all.sql instead' as error;
