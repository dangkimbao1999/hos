-- KYC gates every mutating action in the app (creating/applying/booking/
-- accepting) — only browsing stays open to unverified users. There's no
-- admin portal yet, so review happens by editing kyc_submissions.status
-- directly; the trigger below keeps profiles.kyc_status in sync with it
-- so that's the only place a reviewer (human or, later, an admin portal)
-- needs to touch.

alter table public.profiles
  add column kyc_status text not null default 'unverified'
  check (kyc_status in ('unverified', 'pending', 'verified', 'rejected'));

create table public.kyc_submissions (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  role public.role_type not null,
  submitted_data jsonb not null,
  status text not null default 'pending' check (status in ('pending', 'verified', 'rejected')),
  reviewer_note text,
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);

create index kyc_submissions_profile_id_idx on public.kyc_submissions (profile_id);

alter table public.kyc_submissions enable row level security;

create policy "Users can view their own KYC submissions"
  on public.kyc_submissions for select
  to authenticated
  using (profile_id = (select auth.uid()));

create policy "Users can submit their own KYC"
  on public.kyc_submissions for insert
  to authenticated
  with check (profile_id = (select auth.uid()));

-- Deliberately no update/delete policy for authenticated users: a
-- submission's status can only move by editing the database directly
-- (service role) until a real admin portal exists — a user must never be
-- able to self-approve.

create function public.sync_kyc_status()
returns trigger as $$
begin
  if new.status is distinct from old.status then
    update public.profiles set kyc_status = new.status where id = new.profile_id;
  end if;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger kyc_submissions_sync_status
  after update on public.kyc_submissions
  for each row execute function public.sync_kyc_status();
