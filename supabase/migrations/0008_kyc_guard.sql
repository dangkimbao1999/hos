-- The "Users can update their own profile" policy (0001) has no column
-- granularity, so without this a user could self-approve their own
-- kyc_status through the normal profile-update API call — same class of
-- hole as the role column, fixed the same way in 0002.
--
-- A user moving their own status to 'pending' is legitimate (that's what
-- submitting for review does, via their own authenticated session) — only
-- landing on 'verified' or 'rejected' must be reviewer-controlled.
--
-- Unlike the role guard, this one must still allow direct database edits
-- (SQL editor / dashboard, connecting as the postgres role), since that's
-- the only review mechanism until an admin portal exists — so it
-- blocklists the two Postgres roles PostgREST assigns to end-user API
-- requests ('authenticated', 'anon') rather than allowlisting service_role.
create function public.prevent_kyc_self_approval()
returns trigger as $$
begin
  if new.kyc_status is distinct from old.kyc_status
     and new.kyc_status in ('verified', 'rejected')
     and current_setting('role', true) in ('authenticated', 'anon') then
    raise exception 'kyc_status can only be set to verified or rejected by review';
  end if;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger profiles_prevent_kyc_self_approval
  before update on public.profiles
  for each row execute function public.prevent_kyc_self_approval();
