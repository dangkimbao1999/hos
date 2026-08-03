-- Real reviews, replacing the mock 4.8/53-reviews talent-detail data.
-- Reviewable when the engagement is a real one the organizer had with the
-- talent and its date has passed — there's no separate "completed" status
-- transition anywhere in the app yet, so "confirmed/accepted + date in the
-- past" is the real, non-fabricated signal for "this happened."
create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  reviewer_id uuid not null references public.profiles (id) on delete cascade,
  talent_id uuid not null references public.profiles (id) on delete cascade,
  booking_id uuid references public.package_bookings (id) on delete cascade,
  application_id uuid references public.event_applications (id) on delete cascade,
  rating int not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz not null default now(),
  constraint reviews_exactly_one_source check (
    (booking_id is not null)::int + (application_id is not null)::int = 1
  ),
  constraint reviews_one_per_booking unique (booking_id),
  constraint reviews_one_per_application unique (application_id)
);

create index reviews_talent_id_idx on public.reviews (talent_id);
create index reviews_reviewer_id_idx on public.reviews (reviewer_id);

alter table public.reviews enable row level security;

create policy "Reviews are publicly readable"
  on public.reviews for select
  to authenticated
  using (true);

create policy "Organizer can review after a completed booking or application"
  on public.reviews for insert
  to authenticated
  with check (
    reviewer_id = (select auth.uid())
    and (
      (
        booking_id is not null
        and application_id is null
        and talent_id = (
          select p.talent_id from public.package_bookings b
          join public.packages p on p.id = b.package_id
          where b.id = booking_id
        )
        and exists (
          select 1 from public.package_bookings b
          join public.packages p on p.id = b.package_id
          where b.id = booking_id
            and b.organizer_id = (select auth.uid())
            and b.status = 'confirmed'
            and coalesce(b.booked_date, p.start_date) < current_date
        )
      )
      or
      (
        application_id is not null
        and booking_id is null
        and talent_id = (
          select a.applicant_profile_id from public.event_applications a where a.id = application_id
        )
        and exists (
          select 1 from public.event_applications a
          join public.event_slots s on s.id = a.slot_id
          join public.events e on e.id = s.event_id
          where a.id = application_id
            and e.organizer_id = (select auth.uid())
            and a.status = 'accepted'
            and e.event_date < current_date
        )
      )
    )
  );
