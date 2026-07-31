-- Fix RLS initplan performance: wrap auth.uid() in a subselect so it's
-- evaluated once per query instead of once per row (flagged by
-- `supabase db advisors` as auth_rls_initplan on public.profiles).
drop policy "Users can update their own profile" on public.profiles;

create policy "Users can update their own profile"
  on public.profiles for update
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- Fix role-change guard: auth.role() reads the JWT claim set by PostgREST,
-- which is NULL on a direct SQL connection (e.g. applying a migration via
-- the CLI/pooler), silently disabling the check in that path. The actual
-- Postgres session role (current_setting('role')) reflects service_role
-- consistently regardless of how the connection was made.
create or replace function public.prevent_role_change()
returns trigger as $$
begin
  if new.role <> old.role and current_setting('role', true) <> 'service_role' then
    raise exception 'role cannot be changed after account creation';
  end if;
  return new;
end;
$$ language plpgsql security definer set search_path = public;
