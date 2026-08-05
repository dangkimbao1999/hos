# My Account: profile media, social links, achievements, services — design

## Problem

In My Profile / My Account, several controls are non-functional placeholders:
cover photo and thumbnail images can't be uploaded (clicking does nothing),
"Add Social Link" doesn't add a row, and the social platform dropdown only
offers two hardcoded options per row. None of this data has anywhere to
persist, and none of it is displayed on the public-facing detail pages
either — the "About Talent" tab and the event page's "About Organizer" tab
are largely mock/hardcoded today.

This was scoped by cross-referencing the running app against the Figma file
(`Hos`, fileKey `00Utf5n3qgXjBgwEn7wure`) — specifically the `Talent -
Account - My Profile` (node `3471:15132`), `Organizer - Account - My
Profile` (node `3436:13827`), `Agency - Account - My Profile` (node
`3549:21725`), `Organizer - View Talents Detail - About` (node
`3535:17898`), and `Talent - Event Detail - About` (node `3535:17627`,
labeled "About Organizer" in-app) frames, plus a reference screenshot of the
live "About Talent" tab supplied by the user.

## Scope

### In scope
- Cover photo upload (**Talent only**)
- Thumbnail gallery: 5 fixed slots, upload/replace/remove (**all roles**)
- Social Profile: dynamic add/remove rows, broadened platform list
  (**all roles** — Talent, Organizer, Agency)
- Achievement: reshaped to title + subtitle pairs (**Talent only**)
- Services: free-text list (**Talent only**), wired into the "Service
  Provided" checklist on the public Talent page (replacing hardcoded mock
  data)
- Date of Birth + Genre: new Basic Information fields (**Talent only**)
- Display wiring: Talent detail page (hero, gallery, About Talent tab) and
  the event page's "About Organizer" tab (fixed to show the organizer's
  actual profile, not the event's description)
- Minimal test tooling (`bun:test`) so this can be committed without
  disabling the repo's TDD commit hook

### Explicitly out of scope
- Top Songs (About Talent tab) — needs a real track/audio data model,
  no upload mechanism exists or is implied anywhere; separate future
  feature.
- Organizer's "ESTABLISHED FROM" date — not requested.
- Agency's cover photo — Agency's Figma frame does not show one; skipped
  per instruction, same non-treatment as Organizer.
- A public Agency detail page — none exists in the app today; Agency's new
  fields (thumbnails, social links) save correctly but have nowhere to
  render, same as every other Agency-specific gap already in the app.
- Organizer's own personal cover/gallery display — Organizer has no
  personal profile page; only the event-scoped "About Organizer" tab, which
  does not have a slot for a wide cover banner (only a square photo, filled
  from the gallery).

## Data model

New migration `supabase/migrations/0016_profile_media_social.sql`, adding
to `profiles` (columns exist for every role; the UI gates which ones are
editable per role):

```sql
alter table public.profiles
  add column cover_url text,
  add column gallery_urls text[] not null default '{}',
  add column social_links jsonb not null default '[]',
  add column achievements jsonb not null default '[]',
  add column services text[] not null default '{}',
  add column date_of_birth date,
  add column genre text;

alter table public.profiles
  add constraint gallery_urls_max_5 check (array_length(gallery_urls, 1) is null or array_length(gallery_urls, 1) <= 5);
```

Shapes:
- `social_links`: `{ platform: string; url: string }[]`
- `achievements`: `{ title: string; subtitle: string }[]` — matches the
  real display ("2023 Nominee - BET Award" / "Video Director of the Year"),
  not the free-text-plus-year fields shown in the My Account edit mockup.
- `services`: `string[]` — one free-text entry per service, same shape as
  `keywords`.

New public storage bucket `profile-media` (RLS mirrors the existing
`avatars` bucket exactly — public read, owner-only write under
`<user id>/...`). Paths:
- `<uid>/cover.<ext>`
- `<uid>/gallery/<timestamp>.<ext>` (same `Date.now()` naming convention
  `uploadKycDocument` already uses, since multiple files need unique names)

## Server actions

`src/lib/supabase/storage-actions.ts`:
- `uploadCover(formData)` — mirrors `uploadAvatar` exactly (KYC-gated,
  validates image, uploads to `profile-media`, updates `cover_url`,
  immediate save). Talent-only in the UI, but not role-enforced server-side
  beyond what KYC already requires — no schema reason to restrict further.
- `uploadGalleryImage(formData)` — appends to `gallery_urls`, rejects if
  already at 5.
- `removeGalleryImage(formData)` — takes the URL to remove, splices it out
  of `gallery_urls`. Does not attempt to delete the underlying storage
  object (consistent with how avatar replacement already leaves the old
  file orphaned — not a new pattern).

`src/lib/supabase/profile-actions.ts`:
- Extend `updateProfile` to also accept `socialLinks`, `achievements`,
  `services`, `dateOfBirth`, `genre` — same parse/validate/trim/filter-empty
  pattern already used for `keywords`. All of these stay in local component
  state and only hit the database when "Save changes" is submitted.

## My Account UI (`src/components/account/profile-content.tsx`)

- **Talent**: cover banner (click-to-upload/replace, immediate save,
  camera-icon hover affordance matching the existing avatar button) with
  the avatar overlapping at the bottom-left, exactly like today's layout.
- **Organizer / Agency**: remove the banner container entirely — avatar and
  name/subtitle render directly with no strip behind them, matching their
  Figma frames (neither has a `Rectangle 92` background element).
- **Thumbnail Image** (all roles): 5 fixed slots. Filled slots show the
  image with a remove-on-hover ✕; the next empty slot is the click target
  for upload. Immediate save per action, same as avatar/cover.
- **Social Profile** (all roles, replacing the current
  `role === "talent" ? ... : ...` branch that gives Social Profile only to
  Organizer/Agency): dynamic add/remove rows, staying in local state until
  Save. Platform dropdown: Instagram, Facebook, TikTok, YouTube, Spotify,
  SoundCloud, X (Twitter), LinkedIn, Threads, Behance, Website — one shared
  constant, replacing the two different hardcoded 2-option dropdowns
  currently in the code.
- **Achievement** (Talent only): each row becomes two text inputs — Title,
  Subtitle — add/remove, staged in local state until Save.
- **Services** (Talent only, new section): single free-text field per row,
  add/remove, staged in local state until Save.
- **Basic Information** (Talent only): add Date of Birth (date input) and
  Genre (text input) fields alongside the existing Category/Sub-Category
  selects.

## Types (`src/lib/supabase/types.ts`)

Extend `Profile` with `cover_url`, `gallery_urls`, `social_links`,
`achievements`, `services`, `date_of_birth`, `genre` (all nullable/optional
as appropriate — the same profile row serves every role, most fields are
simply unused outside their owning role).

## Public display wiring

**Talent detail page** (`src/components/talent-detail/talent-detail-content.tsx`):
- Hero banner → `talent.cover_url` (falls back to the existing `ImageIcon`
  placeholder when absent, same conditional pattern the avatar circle
  already uses).
- Overview tab's big image + 3-thumb grid → `talent.gallery_urls`
  (`gallery_urls[0]` for the big image, `gallery_urls[1..3]` for the small
  grid; section stays hidden when the array is empty, same as the existing
  `keywords.length > 0` guard).
- "Service Provided" (both Overview and About Talent tabs) → `talent.services`,
  replacing `mock.services`.
- About Talent tab: STORY → `talent.bio` (unchanged, already wired); add a
  social icon/handle row from `talent.social_links`; add LOCATION (existing
  `talent.location`) / DOB (`talent.date_of_birth`) / GENRE (`talent.genre`)
  fields; Achievement list → `talent.achievements`, rendered as
  title/subtitle rows with a checkmark icon (decorative, no per-item data
  needed).
- Icons: checked the installed `lucide-react` (1.28.0) — it ships no
  brand/social glyphs at all (Facebook/Instagram/Youtube/etc. don't exist
  in this version). Every platform renders with the same generic `Link`
  icon next to the `platform: value` text instead of a per-brand icon.

**Event detail page** (`src/components/event-detail/event-detail-content.tsx`),
"About Organizer" tab — corrected to actually be the organizer's profile,
not event data:
- `getEventBySlug` (`src/lib/supabase/events.ts`) widens its organizer
  select from `full_name, location` to
  `full_name, location, bio, gallery_urls, social_links`, and
  `EventWithSlots["organizer"]` widens to match.
- STORY text switches from `event.description` to `organizer.bio` (the
  current code incorrectly shows the event's description here — this was
  the actual bug behind the "About Organizer" tab, per the user's
  correction that this tab represents the organizer's profile, not the
  event).
- Add a square photo (`organizer.gallery_urls[0]`, matching the 289×289
  photo box in the Figma frame) and the same social icon/handle row used
  on About Talent, built from `organizer.social_links`.
- No cover photo here — Organizer doesn't have one at all (see Scope).

## Testing

The repo currently has zero test files and no test runner configured, and
`.claude/hooks/tdd-enforce.sh` blocks `git commit` on any staged
`.ts`/`.tsx` file lacking a sibling test. To land this work at all, this
task adds a minimal test setup using Bun's built-in test runner
(`bun:test`) with `happy-dom` and `@testing-library/react`, and covers
the genuinely pure/testable logic:
- Row parsing/validation for `socialLinks`, `achievements`, `services` in
  `updateProfile` (trim, drop empty rows, reject unknown platforms).
- The `gallery_urls` 5-item cap in `uploadGalleryImage`.
- The shared social-platform constant/icon-lookup fallback behavior.

Upload flows that require real Supabase Storage (cover/avatar/gallery
upload, KYC gating) are not unit-testable without a live backend and won't
be — verified manually against the running dev server instead, per the
project's own guidance to test UI changes in a real browser before
reporting them done.

## Known limitations (accepted, not fixed here)

- No public Agency detail page exists, so Agency's new fields save but
  don't render anywhere yet.
- Organizer has no personal profile page of their own; their profile only
  surfaces through the event-scoped "About Organizer" tab, which has no
  slot for a cover banner.
- Top Songs remains 100% mock data — needs its own feature design.
