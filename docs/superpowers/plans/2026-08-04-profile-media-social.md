# Profile Media, Social Links, Achievements & Services Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make My Account's cover/thumbnail uploads and Social Profile controls actually work, extend Talent's profile with Achievement/Services/DOB/Genre, and wire all of it into the public Talent detail page and the event page's "About Organizer" tab.

**Architecture:** New `profiles` columns + a new public `profile-media` storage bucket, extending the existing `uploadAvatar`/`updateProfile` server-action patterns. Client-side row state (social links, achievements, services) mirrors the existing `keywords` pattern — staged locally, persisted on "Save changes". Pure validation/parsing logic is extracted into plain (non-`"use server"`) modules so it's unit-testable without a live Supabase connection.

**Tech Stack:** Next.js 16 (App Router) + React 19, Supabase (Postgres + Storage + RLS), Tailwind, shadcn/radix UI, `bun` as package manager and test runner (`bun:test` + `@testing-library/react` + `happy-dom`).

## Global Constraints

- Never use `npm`/`npx` — this project uses `bun` exclusively (`bun add`, `bun run`, `bun test`).
- `.claude/hooks/tdd-enforce.sh` blocks `git commit` on any staged `.ts`/`.tsx` file that lacks a sibling `*.test.ts(x)` file (on disk or staged in the same commit). Every task below accounts for this.
- Stage specific files only — never `git add -A` / `git add .`.
- Typecheck (`bun run build` or `bunx tsc --noEmit` — see Task 11) before the final commit of each task where feasible; always before the plan's final commit.
- Path alias: `@/*` → `./src/*` (already configured in `tsconfig.json`).
- Cover photo is **Talent-only**. Thumbnail gallery (5 slots) and Social Profile are **all three roles**. Achievement, Services, Date of Birth, and Genre are **Talent-only**. Organizer/Agency's My Account banner area has no cover and no decorative strip — just the avatar + name.
- Top Songs and Organizer's "ESTABLISHED FROM" date are explicitly out of scope — do not add them.
- `lucide-react` 1.28.0 (the version installed in this repo) ships no brand/social icons. Use the generic `Link` icon for every social platform — do not try to import `Facebook`/`Instagram`/etc., they don't exist in this package.

---

## File Structure

New files:
- `happydom.ts`, `bunfig.toml` — test harness bootstrap
- `supabase/migrations/0016_profile_media_social.sql` — schema + storage bucket
- `src/lib/social-platforms.ts` (+ `.test.ts`) — shared platform list
- `src/lib/supabase/storage-validation.ts` (+ `.test.ts`) — pure image/gallery validation, extracted out of the `"use server"` file so it's unit-testable
- `src/lib/supabase/profile-parsing.ts` (+ `.test.ts`) — pure row parsing for social links/achievements/services

Modified files:
- `package.json` — devDependencies + `test` script
- `src/lib/supabase/types.ts` — `Profile`/`EventWithSlots` extensions (no test needed, excluded by the TDD hook)
- `src/lib/supabase/storage-actions.ts` (+ new `.test.ts`) — `uploadCover`, `uploadGalleryImage`, `removeGalleryImage`
- `src/lib/supabase/profile-actions.ts` (+ new `.test.ts`) — `updateProfile` extended
- `src/lib/supabase/events.ts` (+ new `.test.ts`) — `getEventBySlug` organizer select widened
- `src/components/account/profile-content.tsx` (+ new `.test.tsx`) — the My Account form
- `src/components/talent-detail/talent-detail-content.tsx` (+ new `.test.tsx`) — public Talent page
- `src/components/event-detail/event-detail-content.tsx` (+ new `.test.tsx`) — "About Organizer" tab

---

### Task 1: Test tooling (bun:test + happy-dom + React Testing Library)

**Files:**
- Create: `happydom.ts`
- Create: `bunfig.toml`
- Modify: `package.json`

**Interfaces:**
- Produces: `bun test` runs every `*.test.ts`/`*.test.tsx` file with a DOM available globally, and `expect(...)` extended with `@testing-library/jest-dom` matchers (`toBeInTheDocument`, etc.) — every later task's test files depend on this.

- [ ] **Step 1: Install test dependencies**

Run: `bun add -d @testing-library/react @testing-library/jest-dom @happy-dom/global-registrator`

- [ ] **Step 2: Create the happy-dom + jest-dom preload script**

`happydom.ts` (repo root):

```ts
import { GlobalRegistrator } from "@happy-dom/global-registrator";
import { expect } from "bun:test";
import * as matchers from "@testing-library/jest-dom/matchers";

GlobalRegistrator.register();
expect.extend(matchers);
```

- [ ] **Step 3: Register the preload in bunfig.toml**

`bunfig.toml` (repo root):

```toml
[test]
preload = ["./happydom.ts"]
```

- [ ] **Step 4: Add the `test` script**

Modify `package.json` — add `"test": "bun test"` to `"scripts"`:

```json
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint",
    "test": "bun test"
  },
```

- [ ] **Step 5: Verify the harness loads cleanly**

Run: `bun test`
Expected: completes with `0 pass 0 fail` (no test files exist yet) and no errors from the preload script itself. If `GlobalRegistrator.register()` throws, the dependency install in Step 1 didn't complete — re-run it.

- [ ] **Step 6: Commit**

```bash
git add happydom.ts bunfig.toml package.json bun.lock
git commit -m "$(cat <<'EOF'
Add bun:test + happy-dom + React Testing Library harness

The repo had no test runner at all, which blocks every later task in
this plan under the TDD commit hook. Bun's built-in test runner avoids
pulling in a second bundler (vite) alongside Next's own toolchain.

Author: Claude Code <noreply@anthropic.com>
EOF
)"
```

---

### Task 2: Database migration + storage bucket

**Files:**
- Create: `supabase/migrations/0016_profile_media_social.sql`

**Interfaces:**
- Produces: `profiles.cover_url`, `profiles.gallery_urls`, `profiles.social_links`, `profiles.achievements`, `profiles.services`, `profiles.date_of_birth`, `profiles.genre` columns, and a public `profile-media` storage bucket — every later task depends on these existing in the database.

- [ ] **Step 1: Write the migration**

`supabase/migrations/0016_profile_media_social.sql`:

```sql
-- Profile media (cover/thumbnails), social links, achievements, services,
-- and two new Talent-only Basic Information fields. Columns live on every
-- role's profile row; the app UI gates which ones are editable per role.
alter table public.profiles
  add column cover_url text,
  add column gallery_urls text[] not null default '{}',
  add column social_links jsonb not null default '[]',
  add column achievements jsonb not null default '[]',
  add column services text[] not null default '{}',
  add column date_of_birth date,
  add column genre text;

alter table public.profiles
  add constraint gallery_urls_max_5
  check (array_length(gallery_urls, 1) is null or array_length(gallery_urls, 1) <= 5);

-- Storage: cover + gallery images, multiple files per user under
-- `<user id>/...` — same layout convention as the `avatars` bucket.
insert into storage.buckets (id, name, public)
values ('profile-media', 'profile-media', true)
on conflict (id) do nothing;

create policy "Profile media is publicly accessible"
  on storage.objects for select
  using (bucket_id = 'profile-media');

create policy "Users can upload their own profile media"
  on storage.objects for insert
  with check (
    bucket_id = 'profile-media'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can update their own profile media"
  on storage.objects for update
  using (
    bucket_id = 'profile-media'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can delete their own profile media"
  on storage.objects for delete
  using (
    bucket_id = 'profile-media'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
```

- [ ] **Step 2: Apply the migration**

There is no `supabase` CLI and no `supabase/config.toml` in this repo — this project runs against a hosted Supabase project (see `.env.local`), not a local instance. This migration file **cannot be applied automatically from this session**. Before Task 5 onward can be manually verified in the browser, run this file against the project's Supabase instance (Supabase Dashboard SQL editor, or `supabase db push` from a machine with the CLI linked to the project). Flag this explicitly to the user rather than assuming it's been applied.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/0016_profile_media_social.sql
git commit -m "$(cat <<'EOF'
Add profile media/social/achievements/services columns + storage bucket

Adds cover_url, gallery_urls (max 5), social_links, achievements,
services, date_of_birth, and genre to profiles, plus a public
profile-media storage bucket mirroring the existing avatars bucket's
RLS policies.

Author: Claude Code <noreply@anthropic.com>
EOF
)"
```

---

### Task 3: Types

**Files:**
- Modify: `src/lib/supabase/types.ts:5-22`

**Interfaces:**
- Produces: `Profile.cover_url: string | null`, `Profile.gallery_urls: string[]`, `Profile.social_links: SocialLink[]`, `Profile.achievements: Achievement[]`, `Profile.services: string[]`, `Profile.date_of_birth: string | null`, `Profile.genre: string | null`; new exported interfaces `SocialLink { platform: string; url: string }` and `Achievement { title: string; subtitle: string }`; `EventWithSlots["organizer"]` widened to include `bio`, `gallery_urls`, `social_links`.
- Consumes: nothing new.

No test file needed — `src/lib/supabase/types.ts` matches the TDD hook's `*/types.ts` skip pattern.

- [ ] **Step 1: Extend `Profile` and add the new shape interfaces**

Modify `src/lib/supabase/types.ts`, replacing lines 5-17:

```ts
export interface SocialLink {
  platform: string;
  url: string;
}

export interface Achievement {
  title: string;
  subtitle: string;
}

export interface Profile {
  id: string;
  role: Role;
  slug: string;
  full_name: string;
  avatar_url: string | null;
  bio: string | null;
  location: string | null;
  keywords: string[];
  kyc_status: KycStatus;
  notifications_read_at: string | null;
  created_at: string;
  cover_url: string | null;
  gallery_urls: string[];
  social_links: SocialLink[];
  achievements: Achievement[];
  services: string[];
  date_of_birth: string | null;
  genre: string | null;
}
```

- [ ] **Step 2: Widen `EventWithSlots["organizer"]`**

Modify `src/lib/supabase/types.ts` (the `EventWithSlots` interface, originally around line 90):

```ts
/** Full event detail: the event row, its slots, and the organizer's profile. */
export interface EventWithSlots extends EventRow {
  slots: EventSlotRow[];
  organizer: Pick<Profile, "full_name" | "location" | "bio" | "gallery_urls" | "social_links">;
}
```

- [ ] **Step 3: Typecheck**

Run: `bunx tsc --noEmit`
Expected: fails — every file that constructs a `Profile`/`CurrentUser` or `EventWithSlots["organizer"]` literal (mock data, other tasks not yet done) doesn't have the new fields yet. That's expected at this point in the plan; each later task fixes its own file. Confirm the errors are only in files this plan will touch in later tasks (`profile-content.tsx`, `talent-detail-content.tsx`, `event-detail-content.tsx`, `events.ts`) and not somewhere unexpected.

- [ ] **Step 4: Commit**

```bash
git add src/lib/supabase/types.ts
git commit -m "$(cat <<'EOF'
Extend Profile and EventWithSlots types for profile media/social/achievements

Author: Claude Code <noreply@anthropic.com>
EOF
)"
```

---

### Task 4: Shared social platform list

**Files:**
- Create: `src/lib/social-platforms.ts`
- Test: `src/lib/social-platforms.test.ts`

**Interfaces:**
- Produces: `SOCIAL_PLATFORMS: readonly string[]` (11 platforms).
- Consumed by: Task 8 (`profile-content.tsx`'s Social Profile dropdown).

- [ ] **Step 1: Write the failing test**

`src/lib/social-platforms.test.ts`:

```ts
import { describe, expect, it } from "bun:test";
import { SOCIAL_PLATFORMS } from "@/lib/social-platforms";

describe("SOCIAL_PLATFORMS", () => {
  it("includes the platforms called out in the bug report", () => {
    expect(SOCIAL_PLATFORMS).toContain("Instagram");
    expect(SOCIAL_PLATFORMS).toContain("Facebook");
    expect(SOCIAL_PLATFORMS).toContain("SoundCloud");
    expect(SOCIAL_PLATFORMS).toContain("Spotify");
  });

  it("has 11 platforms with no duplicates", () => {
    expect(SOCIAL_PLATFORMS.length).toBe(11);
    expect(new Set(SOCIAL_PLATFORMS).size).toBe(11);
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `bun test src/lib/social-platforms.test.ts`
Expected: FAIL — `src/lib/social-platforms.ts` doesn't exist yet (module not found).

- [ ] **Step 3: Implement**

`src/lib/social-platforms.ts`:

```ts
export const SOCIAL_PLATFORMS = [
  "Instagram",
  "Facebook",
  "TikTok",
  "YouTube",
  "Spotify",
  "SoundCloud",
  "X (Twitter)",
  "LinkedIn",
  "Threads",
  "Behance",
  "Website",
] as const;
```

- [ ] **Step 4: Run it to verify it passes**

Run: `bun test src/lib/social-platforms.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/social-platforms.ts src/lib/social-platforms.test.ts
git commit -m "$(cat <<'EOF'
Add shared social platform list for the Social Profile dropdown

Author: Claude Code <noreply@anthropic.com>
EOF
)"
```

---

### Task 5: Cover + gallery upload server actions

**Files:**
- Create: `src/lib/supabase/storage-validation.ts`
- Test: `src/lib/supabase/storage-validation.test.ts`
- Modify: `src/lib/supabase/storage-actions.ts`
- Test: `src/lib/supabase/storage-actions.test.ts`

**Interfaces:**
- Consumes: `assertKycVerified` from `@/lib/supabase/kyc` (existing), `createClient` from `@/lib/supabase/server` (existing).
- Produces: `validateImage(file: FormDataEntryValue | null): { error: string } | { file: File }`, `canAddGalleryImage(current: string[]): boolean` (both from `storage-validation.ts`); `uploadCover(formData: FormData): Promise<{ error: string } | { success: true; url: string }>`, `uploadGalleryImage(formData: FormData): Promise<{ error: string } | { success: true; url: string }>`, `removeGalleryImage(formData: FormData): Promise<{ error: string } | { success: true }>` (all from `storage-actions.ts`) — consumed by Task 8.

`storage-actions.ts` has a `"use server"` directive, which requires every exported value to be an async function — pure helpers can't live there, hence the split into `storage-validation.ts`.

- [ ] **Step 1: Write the failing tests for the pure validation module**

`src/lib/supabase/storage-validation.test.ts`:

```ts
import { describe, expect, it } from "bun:test";
import { canAddGalleryImage, validateImage } from "@/lib/supabase/storage-validation";

function makeFile(name: string, type: string, sizeBytes: number): File {
  return new File([new Uint8Array(sizeBytes)], name, { type });
}

describe("validateImage", () => {
  it("rejects a missing file", () => {
    expect(validateImage(null)).toEqual({ error: "Choose an image to upload." });
  });

  it("rejects an unsupported type", () => {
    const result = validateImage(makeFile("a.gif", "image/gif", 100));
    expect("error" in result).toBe(true);
  });

  it("rejects a file over 5MB", () => {
    const result = validateImage(makeFile("a.png", "image/png", 6 * 1024 * 1024));
    expect("error" in result).toBe(true);
  });

  it("accepts a valid png under 5MB", () => {
    const result = validateImage(makeFile("a.png", "image/png", 1024));
    expect("file" in result).toBe(true);
  });
});

describe("canAddGalleryImage", () => {
  it("allows adding when under 5 images", () => {
    expect(canAddGalleryImage(["a", "b"])).toBe(true);
  });

  it("blocks adding at exactly 5 images", () => {
    expect(canAddGalleryImage(["a", "b", "c", "d", "e"])).toBe(false);
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `bun test src/lib/supabase/storage-validation.test.ts`
Expected: FAIL — module doesn't exist yet.

- [ ] **Step 3: Extract the pure validation module**

`src/lib/supabase/storage-validation.ts`:

```ts
const MAX_FILE_BYTES = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);

export function validateImage(file: FormDataEntryValue | null): { error: string } | { file: File } {
  if (!(file instanceof File) || file.size === 0) return { error: "Choose an image to upload." };
  if (!ALLOWED_IMAGE_TYPES.has(file.type)) return { error: "Only PNG, JPEG, or WebP images are allowed." };
  if (file.size > MAX_FILE_BYTES) return { error: "Image must be under 5MB." };
  return { file };
}

export function canAddGalleryImage(current: string[]): boolean {
  return current.length < 5;
}
```

- [ ] **Step 4: Run it to verify it passes**

Run: `bun test src/lib/supabase/storage-validation.test.ts`
Expected: PASS (6 tests).

- [ ] **Step 5: Write the failing auth-guard test for the server actions**

`src/lib/supabase/storage-actions.test.ts`:

```ts
import { describe, expect, it, mock } from "bun:test";

mock.module("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: { getUser: async () => ({ data: { user: null } }) },
  }),
}));

import { removeGalleryImage, uploadCover, uploadGalleryImage } from "@/lib/supabase/storage-actions";

describe("storage actions — signed-out guard", () => {
  it("uploadCover rejects when not signed in", async () => {
    expect(await uploadCover(new FormData())).toEqual({ error: "You must be signed in." });
  });

  it("uploadGalleryImage rejects when not signed in", async () => {
    expect(await uploadGalleryImage(new FormData())).toEqual({ error: "You must be signed in." });
  });

  it("removeGalleryImage rejects when not signed in", async () => {
    expect(await removeGalleryImage(new FormData())).toEqual({ error: "You must be signed in." });
  });
});
```

- [ ] **Step 6: Run it to verify it fails**

Run: `bun test src/lib/supabase/storage-actions.test.ts`
Expected: FAIL — `uploadCover`, `uploadGalleryImage`, `removeGalleryImage` don't exist yet in `storage-actions.ts`.

- [ ] **Step 7: Implement the server actions**

Modify `src/lib/supabase/storage-actions.ts` — replace the top of the file (the `MAX_FILE_BYTES`/`ALLOWED_IMAGE_TYPES`/`validateImage` block, originally lines 7-15) with an import from the new module, and append the three new actions after `uploadAvatar`:

```ts
"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { assertKycVerified } from "@/lib/supabase/kyc";
import { canAddGalleryImage, validateImage } from "@/lib/supabase/storage-validation";

export async function uploadAvatar(
  formData: FormData
): Promise<{ error: string } | { success: true; url: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };
  const kycError = await assertKycVerified(supabase, user.id);
  if (kycError) return kycError;

  const validated = validateImage(formData.get("avatar"));
  if ("error" in validated) return validated;
  const { file } = validated;

  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `${user.id}/avatar.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(path, file, { upsert: true, contentType: file.type });
  if (uploadError) return { error: uploadError.message };

  const {
    data: { publicUrl },
  } = supabase.storage.from("avatars").getPublicUrl(path);
  const url = `${publicUrl}?v=${Date.now()}`;

  const { data: profile, error } = await supabase
    .from("profiles")
    .update({ avatar_url: url })
    .eq("id", user.id)
    .select("role")
    .single();
  if (error) return { error: error.message };

  revalidatePath(`/${profile.role}`, "layout");
  return { success: true, url };
}

/** Cover photo upload — Talent only in the UI, but not role-restricted server-side beyond the KYC gate every mutating action already requires. */
export async function uploadCover(
  formData: FormData
): Promise<{ error: string } | { success: true; url: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };
  const kycError = await assertKycVerified(supabase, user.id);
  if (kycError) return kycError;

  const validated = validateImage(formData.get("cover"));
  if ("error" in validated) return validated;
  const { file } = validated;

  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `${user.id}/cover.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("profile-media")
    .upload(path, file, { upsert: true, contentType: file.type });
  if (uploadError) return { error: uploadError.message };

  const {
    data: { publicUrl },
  } = supabase.storage.from("profile-media").getPublicUrl(path);
  const url = `${publicUrl}?v=${Date.now()}`;

  const { data: profile, error } = await supabase
    .from("profiles")
    .update({ cover_url: url })
    .eq("id", user.id)
    .select("role")
    .single();
  if (error) return { error: error.message };

  revalidatePath(`/${profile.role}`, "layout");
  return { success: true, url };
}

export async function uploadGalleryImage(
  formData: FormData
): Promise<{ error: string } | { success: true; url: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };
  const kycError = await assertKycVerified(supabase, user.id);
  if (kycError) return kycError;

  const { data: existing } = await supabase
    .from("profiles")
    .select("gallery_urls")
    .eq("id", user.id)
    .single();
  const current = existing?.gallery_urls ?? [];
  if (!canAddGalleryImage(current)) return { error: "You can upload at most 5 thumbnail images." };

  const validated = validateImage(formData.get("image"));
  if ("error" in validated) return validated;
  const { file } = validated;

  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `${user.id}/gallery/${Date.now()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("profile-media")
    .upload(path, file, { contentType: file.type });
  if (uploadError) return { error: uploadError.message };

  const {
    data: { publicUrl },
  } = supabase.storage.from("profile-media").getPublicUrl(path);
  const url = `${publicUrl}?v=${Date.now()}`;
  const nextGallery = [...current, url];

  const { data: updated, error } = await supabase
    .from("profiles")
    .update({ gallery_urls: nextGallery })
    .eq("id", user.id)
    .select("role")
    .single();
  if (error) return { error: error.message };

  revalidatePath(`/${updated.role}`, "layout");
  return { success: true, url };
}

export async function removeGalleryImage(
  formData: FormData
): Promise<{ error: string } | { success: true }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };
  const kycError = await assertKycVerified(supabase, user.id);
  if (kycError) return kycError;

  const url = String(formData.get("url") ?? "");
  if (!url) return { error: "Missing image to remove." };

  const { data: existing } = await supabase
    .from("profiles")
    .select("gallery_urls")
    .eq("id", user.id)
    .single();
  const current: string[] = existing?.gallery_urls ?? [];
  const nextGallery = current.filter((u) => u !== url);

  const { data: updated, error } = await supabase
    .from("profiles")
    .update({ gallery_urls: nextGallery })
    .eq("id", user.id)
    .select("role")
    .single();
  if (error) return { error: error.message };

  revalidatePath(`/${updated.role}`, "layout");
  return { success: true };
}

/** Uploads a KYC ID/selfie image to the private kyc-documents bucket. Returns the storage path (not a URL — the bucket isn't public). */
export async function uploadKycDocument(
  formData: FormData
): Promise<{ error: string } | { success: true; path: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };

  const docType = String(formData.get("docType") ?? "");
  if (!docType) return { error: "Missing document type." };

  const validated = validateImage(formData.get("file"));
  if ("error" in validated) return validated;
  const { file } = validated;

  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `${user.id}/${docType}-${Date.now()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("kyc-documents")
    .upload(path, file, { contentType: file.type });
  if (uploadError) return { error: uploadError.message };

  return { success: true, path };
}
```

- [ ] **Step 8: Run it to verify it passes**

Run: `bun test src/lib/supabase/storage-actions.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 9: Run the full suite so far**

Run: `bun test`
Expected: all PASS.

- [ ] **Step 10: Commit**

```bash
git add src/lib/supabase/storage-validation.ts src/lib/supabase/storage-validation.test.ts src/lib/supabase/storage-actions.ts src/lib/supabase/storage-actions.test.ts
git commit -m "$(cat <<'EOF'
Add cover photo and gallery image upload/remove server actions

Extracts validateImage into a plain module (storage-validation.ts) so
it's unit-testable — a "use server" file can only export async
functions, so the pure helper couldn't live alongside the actions.

Author: Claude Code <noreply@anthropic.com>
EOF
)"
```

---

### Task 6: Extend `updateProfile` for social links, achievements, services, DOB, genre

**Files:**
- Create: `src/lib/supabase/profile-parsing.ts`
- Test: `src/lib/supabase/profile-parsing.test.ts`
- Modify: `src/lib/supabase/profile-actions.ts`
- Test: `src/lib/supabase/profile-actions.test.ts`

**Interfaces:**
- Consumes: `SocialLink`, `Achievement` types from `@/lib/supabase/types` (Task 3).
- Produces: `parseSocialLinks(raw: FormDataEntryValue): SocialLink[] | null`, `parseAchievements(raw: FormDataEntryValue): Achievement[] | null`, `parseServices(raw: FormDataEntryValue): string[] | null` (all from `profile-parsing.ts`, `null` means invalid JSON/shape) — consumed by Task 8's `handleSubmit` indirectly (it just sends JSON strings; these parsers run server-side in `updateProfile`).

- [ ] **Step 1: Write the failing tests for the pure parsers**

`src/lib/supabase/profile-parsing.test.ts`:

```ts
import { describe, expect, it } from "bun:test";
import { parseAchievements, parseServices, parseSocialLinks } from "@/lib/supabase/profile-parsing";

describe("parseSocialLinks", () => {
  it("drops rows missing a platform or url", () => {
    const raw = JSON.stringify([
      { platform: "Instagram", url: "https://instagram.com/x" },
      { platform: "", url: "https://example.com" },
      { platform: "Facebook", url: "  " },
    ]);
    expect(parseSocialLinks(raw)).toEqual([{ platform: "Instagram", url: "https://instagram.com/x" }]);
  });

  it("trims whitespace", () => {
    const raw = JSON.stringify([{ platform: " Instagram ", url: " https://instagram.com/x " }]);
    expect(parseSocialLinks(raw)).toEqual([{ platform: "Instagram", url: "https://instagram.com/x" }]);
  });

  it("returns null for malformed JSON", () => {
    expect(parseSocialLinks("not json")).toBeNull();
  });

  it("returns null when the JSON isn't an array", () => {
    expect(parseSocialLinks(JSON.stringify({ platform: "Instagram" }))).toBeNull();
  });
});

describe("parseAchievements", () => {
  it("drops rows missing a title", () => {
    const raw = JSON.stringify([
      { title: "2023 Nominee - BET Award", subtitle: "Video Director of the Year" },
      { title: "  ", subtitle: "no title" },
    ]);
    expect(parseAchievements(raw)).toEqual([
      { title: "2023 Nominee - BET Award", subtitle: "Video Director of the Year" },
    ]);
  });

  it("keeps a row with an empty subtitle", () => {
    const raw = JSON.stringify([{ title: "Award", subtitle: "" }]);
    expect(parseAchievements(raw)).toEqual([{ title: "Award", subtitle: "" }]);
  });

  it("returns null for malformed JSON", () => {
    expect(parseAchievements("not json")).toBeNull();
  });
});

describe("parseServices", () => {
  it("trims and drops empty entries", () => {
    const raw = JSON.stringify([" DJ Sets ", "", "  "]);
    expect(parseServices(raw)).toEqual(["DJ Sets"]);
  });

  it("returns null for malformed JSON", () => {
    expect(parseServices("not json")).toBeNull();
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `bun test src/lib/supabase/profile-parsing.test.ts`
Expected: FAIL — module doesn't exist yet.

- [ ] **Step 3: Implement the pure parsers**

`src/lib/supabase/profile-parsing.ts`:

```ts
import type { Achievement, SocialLink } from "@/lib/supabase/types";

function parseJsonArray(raw: FormDataEntryValue): unknown[] | null {
  try {
    const parsed = JSON.parse(String(raw));
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function parseSocialLinks(raw: FormDataEntryValue): SocialLink[] | null {
  const rows = parseJsonArray(raw);
  if (rows === null) return null;
  return rows
    .map((row) => {
      const r = row as { platform?: unknown; url?: unknown };
      return { platform: String(r?.platform ?? "").trim(), url: String(r?.url ?? "").trim() };
    })
    .filter((row) => row.platform && row.url);
}

export function parseAchievements(raw: FormDataEntryValue): Achievement[] | null {
  const rows = parseJsonArray(raw);
  if (rows === null) return null;
  return rows
    .map((row) => {
      const r = row as { title?: unknown; subtitle?: unknown };
      return { title: String(r?.title ?? "").trim(), subtitle: String(r?.subtitle ?? "").trim() };
    })
    .filter((row) => row.title);
}

export function parseServices(raw: FormDataEntryValue): string[] | null {
  const rows = parseJsonArray(raw);
  if (rows === null) return null;
  return rows.map((v) => String(v).trim()).filter(Boolean);
}
```

- [ ] **Step 4: Run it to verify it passes**

Run: `bun test src/lib/supabase/profile-parsing.test.ts`
Expected: PASS (8 tests).

- [ ] **Step 5: Write the failing auth-guard test for `updateProfile`**

`src/lib/supabase/profile-actions.test.ts`:

```ts
import { describe, expect, it, mock } from "bun:test";

mock.module("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: { getUser: async () => ({ data: { user: null } }) },
  }),
}));

import { updateProfile } from "@/lib/supabase/profile-actions";

describe("updateProfile — signed-out guard", () => {
  it("rejects when not signed in", async () => {
    const formData = new FormData();
    formData.set("fullName", "Test User");
    expect(await updateProfile(formData)).toEqual({ error: "You must be signed in." });
  });
});
```

This test already passes against the current implementation (the guard predates this task) — that's fine, it locks in behavior this task must not break while extending the function.

- [ ] **Step 6: Run it to verify it passes as-is**

Run: `bun test src/lib/supabase/profile-actions.test.ts`
Expected: PASS (1 test) — confirming the baseline before extending the function.

- [ ] **Step 7: Extend `updateProfile`**

Modify `src/lib/supabase/profile-actions.ts`:

```ts
"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { assertKycVerified } from "@/lib/supabase/kyc";
import { parseAchievements, parseServices, parseSocialLinks } from "@/lib/supabase/profile-parsing";
import type { Achievement, SocialLink } from "@/lib/supabase/types";

export async function updateProfile(
  formData: FormData
): Promise<{ error: string } | { success: true }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };
  const kycError = await assertKycVerified(supabase, user.id);
  if (kycError) return kycError;

  const fullName = String(formData.get("fullName") ?? "").trim();
  const bio = String(formData.get("bio") ?? "").trim() || null;
  const location = String(formData.get("location") ?? "").trim() || null;
  const dateOfBirth = String(formData.get("dateOfBirth") ?? "").trim() || null;
  const genre = String(formData.get("genre") ?? "").trim() || null;

  if (!fullName) return { error: "Display name is required." };

  const update: {
    full_name: string;
    bio: string | null;
    location: string | null;
    date_of_birth: string | null;
    genre: string | null;
    keywords?: string[];
    social_links?: SocialLink[];
    achievements?: Achievement[];
    services?: string[];
  } = {
    full_name: fullName,
    bio,
    location,
    date_of_birth: dateOfBirth,
    genre,
  };

  const keywordsRaw = formData.get("keywords");
  if (keywordsRaw !== null) {
    try {
      const parsed = JSON.parse(String(keywordsRaw));
      if (Array.isArray(parsed)) update.keywords = parsed.map(String);
    } catch {
      return { error: "Invalid keywords." };
    }
  }

  const socialLinksRaw = formData.get("socialLinks");
  if (socialLinksRaw !== null) {
    const parsed = parseSocialLinks(socialLinksRaw);
    if (parsed === null) return { error: "Invalid social links." };
    update.social_links = parsed;
  }

  const achievementsRaw = formData.get("achievements");
  if (achievementsRaw !== null) {
    const parsed = parseAchievements(achievementsRaw);
    if (parsed === null) return { error: "Invalid achievements." };
    update.achievements = parsed;
  }

  const servicesRaw = formData.get("services");
  if (servicesRaw !== null) {
    const parsed = parseServices(servicesRaw);
    if (parsed === null) return { error: "Invalid services." };
    update.services = parsed;
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .update(update)
    .eq("id", user.id)
    .select("role")
    .single();

  if (error) return { error: error.message };

  revalidatePath(`/${profile.role}/account`);
  return { success: true };
}
```

- [ ] **Step 8: Run the full suite**

Run: `bun test`
Expected: all PASS.

- [ ] **Step 9: Commit**

```bash
git add src/lib/supabase/profile-parsing.ts src/lib/supabase/profile-parsing.test.ts src/lib/supabase/profile-actions.ts src/lib/supabase/profile-actions.test.ts
git commit -m "$(cat <<'EOF'
Extend updateProfile with social links, achievements, services, DOB, genre

Row parsing/validation lives in profile-parsing.ts (a plain module, not
"use server") so it's unit-testable without a live Supabase connection.

Author: Claude Code <noreply@anthropic.com>
EOF
)"
```

---

### Task 7: Widen the event page's organizer query

**Files:**
- Modify: `src/lib/supabase/events.ts:15-24`
- Test: `src/lib/supabase/events.test.ts`

**Interfaces:**
- Consumes: `EventWithSlots["organizer"]` (Task 3).
- Produces: `getEventBySlug` now returns `organizer.bio`, `organizer.gallery_urls`, `organizer.social_links` in addition to `full_name`/`location` — consumed by Task 10.

- [ ] **Step 1: Write the failing test**

`src/lib/supabase/events.test.ts`:

```ts
import { describe, expect, it, mock } from "bun:test";

const eventRow = {
  id: "event-1",
  organizer_id: "org-1",
  slug: "my-event",
  name: "My Event",
};

function makeChain(resolved: unknown) {
  const chain: { select: () => typeof chain; eq: () => typeof chain; single: () => Promise<{ data: unknown }> } = {
    select: () => chain,
    eq: () => chain,
    single: async () => ({ data: resolved }),
  };
  return chain;
}

mock.module("@/lib/supabase/server", () => ({
  createClient: async () => ({
    from: (table: string) => {
      if (table === "events") return makeChain(eventRow);
      if (table === "event_slots") {
        const chain = {
          select: () => chain,
          eq: () => chain,
          order: async () => ({ data: [] }),
        };
        return chain;
      }
      if (table === "profiles") {
        return makeChain({
          full_name: "420 Ent.",
          location: "District 1, Ho Chi Minh City",
          bio: "The organizer's real bio.",
          gallery_urls: ["https://example.com/gallery/1.png"],
          social_links: [{ platform: "Instagram", url: "https://instagram.com/420ent" }],
        });
      }
      throw new Error(`unexpected table ${table}`);
    },
  }),
}));

import { getEventBySlug } from "@/lib/supabase/events";

describe("getEventBySlug", () => {
  it("includes the organizer's bio, gallery, and social links", async () => {
    const result = await getEventBySlug("my-event");
    expect(result?.organizer.bio).toBe("The organizer's real bio.");
    expect(result?.organizer.gallery_urls).toEqual(["https://example.com/gallery/1.png"]);
    expect(result?.organizer.social_links).toEqual([
      { platform: "Instagram", url: "https://instagram.com/420ent" },
    ]);
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `bun test src/lib/supabase/events.test.ts`
Expected: FAIL — `result?.organizer.bio` is `undefined` because the current `select("full_name, location")` doesn't fetch it.

- [ ] **Step 3: Widen the query**

Modify `src/lib/supabase/events.ts`, replacing the `getEventBySlug` body's data-fetching block:

```ts
export async function getEventBySlug(slug: string): Promise<EventWithSlots | null> {
  const supabase = await createClient();

  const { data: event } = await supabase.from("events").select("*").eq("slug", slug).single();
  if (!event) return null;

  const [{ data: slots }, { data: organizer }] = await Promise.all([
    supabase.from("event_slots").select("*").eq("event_id", event.id).order("created_at"),
    supabase
      .from("profiles")
      .select("full_name, location, bio, gallery_urls, social_links")
      .eq("id", event.organizer_id)
      .single(),
  ]);

  return {
    ...event,
    slots: slots ?? [],
    organizer: organizer ?? { full_name: "", location: null, bio: null, gallery_urls: [], social_links: [] },
  };
}
```

- [ ] **Step 4: Run it to verify it passes**

Run: `bun test src/lib/supabase/events.test.ts`
Expected: PASS.

- [ ] **Step 5: Run the full suite**

Run: `bun test`
Expected: all PASS.

- [ ] **Step 6: Commit**

```bash
git add src/lib/supabase/events.ts src/lib/supabase/events.test.ts
git commit -m "$(cat <<'EOF'
Fetch organizer bio/gallery/social links for the event detail page

Prerequisite for fixing the "About Organizer" tab, which currently
shows the event's own description instead of the organizer's profile.

Author: Claude Code <noreply@anthropic.com>
EOF
)"
```

---

### Task 8: My Account — cover, gallery, Social Profile, Achievement, Services, DOB/Genre

**Files:**
- Modify: `src/components/account/profile-content.tsx` (full rewrite of the file's body)
- Test: `src/components/account/profile-content.test.tsx`

**Interfaces:**
- Consumes: `uploadCover`, `uploadGalleryImage`, `removeGalleryImage` (Task 5); `SOCIAL_PLATFORMS` (Task 4); `Profile`/`CurrentUser` fields (Task 3); `updateProfile` (Task 6, unchanged call site — it already sends whatever's in the submitted `FormData` plus the JSON fields set explicitly).
- Produces: no new exports — this is a leaf UI component consumed by the account page route (unchanged call site).

This is one task despite touching many sections, because it's all one component with one responsibility (the My Account form) and splitting it across tasks would mean two tasks editing overlapping line ranges of the same file.

- [ ] **Step 1: Write the failing tests**

`src/components/account/profile-content.test.tsx`:

```tsx
import { afterEach, describe, expect, it, mock } from "bun:test";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

mock.module("next/navigation", () => ({
  useRouter: () => ({ refresh: () => {} }),
}));

mock.module("@/lib/supabase/profile-actions", () => ({
  updateProfile: async () => ({ success: true }),
}));

mock.module("@/lib/supabase/storage-actions", () => ({
  uploadAvatar: async () => ({ success: true, url: "https://example.com/avatar.png" }),
  uploadCover: async () => ({ success: true, url: "https://example.com/cover.png" }),
  uploadGalleryImage: async () => ({ success: true, url: "https://example.com/gallery.png" }),
  removeGalleryImage: async () => ({ success: true }),
}));

import { ProfileContent } from "@/components/account/profile-content";
import type { CurrentUser } from "@/lib/supabase/types";

afterEach(() => cleanup());

function makeProfile(overrides: Partial<CurrentUser> = {}): CurrentUser {
  return {
    id: "user-1",
    role: "talent",
    slug: "test-user",
    full_name: "Test User",
    avatar_url: null,
    bio: null,
    location: null,
    keywords: [],
    kyc_status: "verified",
    notifications_read_at: null,
    created_at: new Date().toISOString(),
    email: "test@example.com",
    cover_url: null,
    gallery_urls: [],
    social_links: [],
    achievements: [],
    services: [],
    date_of_birth: null,
    genre: null,
    ...overrides,
  };
}

describe("ProfileContent — Social Profile", () => {
  it("adds a row each time Add Social Link is clicked, for every role", () => {
    render(<ProfileContent role="organizer" profile={makeProfile({ role: "organizer" })} />);
    const addButton = screen.getByRole("button", { name: /add social link/i });
    expect(screen.queryAllByPlaceholderText("https://...")).toHaveLength(0);
    fireEvent.click(addButton);
    expect(screen.queryAllByPlaceholderText("https://...")).toHaveLength(1);
    fireEvent.click(addButton);
    expect(screen.queryAllByPlaceholderText("https://...")).toHaveLength(2);
  });

  it("renders Social Profile for Talent too, not just Organizer/Agency", () => {
    render(<ProfileContent role="talent" profile={makeProfile()} />);
    expect(screen.getByText("Social Profile")).toBeInTheDocument();
  });
});

describe("ProfileContent — Achievement", () => {
  it("adds a title + subtitle row when Add Achievement is clicked", () => {
    render(<ProfileContent role="talent" profile={makeProfile()} />);
    fireEvent.click(screen.getByRole("button", { name: /add achievement/i }));
    expect(screen.getByPlaceholderText("e.g. 2023 Nominee - BET Award")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("e.g. Video Director of the Year")).toBeInTheDocument();
  });
});

describe("ProfileContent — Services", () => {
  it("adds a free-text row when Add Services is clicked", () => {
    render(<ProfileContent role="talent" profile={makeProfile()} />);
    fireEvent.click(screen.getByRole("button", { name: /add services/i }));
    expect(screen.getByPlaceholderText(/rapper performs for music festival/i)).toBeInTheDocument();
  });
});

describe("ProfileContent — cover photo", () => {
  it("renders a cover upload input for Talent only", () => {
    render(<ProfileContent role="talent" profile={makeProfile()} />);
    expect(document.querySelectorAll('input[type="file"]')).toHaveLength(3);
  });

  it("renders no cover upload input for Organizer", () => {
    render(<ProfileContent role="organizer" profile={makeProfile({ role: "organizer" })} />);
    expect(document.querySelectorAll('input[type="file"]')).toHaveLength(2);
  });
});

describe("ProfileContent — thumbnail gallery", () => {
  it("shows an upload slot when under 5 images", () => {
    render(
      <ProfileContent role="talent" profile={makeProfile({ gallery_urls: ["https://x/1.png"] })} />
    );
    expect(screen.getAllByAltText("")).toHaveLength(1);
  });

  it("hides the upload slot once 5 images are present", () => {
    const urls = [1, 2, 3, 4, 5].map((n) => `https://x/${n}.png`);
    render(<ProfileContent role="talent" profile={makeProfile({ gallery_urls: urls })} />);
    expect(screen.getAllByAltText("")).toHaveLength(5);
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `bun test src/components/account/profile-content.test.tsx`
Expected: FAIL — the current component has no cover/gallery upload wiring, no Add Social Link handler, no Achievement/Services sections in their new shape, and `profile.cover_url` etc. don't exist on the type yet used correctly (Task 3 already added them, but the component doesn't read them yet).

- [ ] **Step 3: Rewrite the component**

Replace the full contents of `src/components/account/profile-content.tsx`:

```tsx
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, type FormEvent } from "react";
import { Camera, ImageIcon, KeyRound, Plus, ShieldCheck, User, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { talentCategories, type Role } from "@/lib/nav-items";
import { SOCIAL_PLATFORMS } from "@/lib/social-platforms";
import { updateProfile } from "@/lib/supabase/profile-actions";
import { removeGalleryImage, uploadAvatar, uploadCover, uploadGalleryImage } from "@/lib/supabase/storage-actions";
import type { CurrentUser } from "@/lib/supabase/types";
import { cn } from "@/lib/utils";

function Field({ label, ...props }: { label: string } & React.ComponentProps<"input">) {
  const id = label.toLowerCase().replace(/\s+/g, "-");
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id} className="text-sm text-muted-foreground">
        {label}
      </Label>
      <Input id={id} className="h-11 rounded-[6px]" {...props} />
    </div>
  );
}

export function ProfileContent({ role, profile }: { role: Role; profile: CurrentUser }) {
  const router = useRouter();
  const [keywords, setKeywords] = useState<string[]>(profile.keywords ?? []);
  const [keywordInput, setKeywordInput] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [saved, setSaved] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url);
  const [avatarPending, setAvatarPending] = useState(false);
  const [avatarError, setAvatarError] = useState<string | undefined>();
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const [coverUrl, setCoverUrl] = useState(profile.cover_url);
  const [coverPending, setCoverPending] = useState(false);
  const [coverError, setCoverError] = useState<string | undefined>();
  const coverInputRef = useRef<HTMLInputElement>(null);

  const [gallery, setGallery] = useState<string[]>(profile.gallery_urls ?? []);
  const [galleryPending, setGalleryPending] = useState(false);
  const [galleryError, setGalleryError] = useState<string | undefined>();
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const [socialLinks, setSocialLinks] = useState<{ platform: string; url: string }[]>(
    profile.social_links ?? []
  );
  const [achievements, setAchievements] = useState<{ title: string; subtitle: string }[]>(
    profile.achievements ?? []
  );
  const [services, setServices] = useState<string[]>(profile.services ?? []);

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarError(undefined);
    setAvatarPending(true);
    const formData = new FormData();
    formData.set("avatar", file);
    const result = await uploadAvatar(formData);
    setAvatarPending(false);
    if ("error" in result) setAvatarError(result.error);
    else {
      setAvatarUrl(result.url);
      router.refresh();
    }
    e.target.value = "";
  }

  async function handleCoverChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setCoverError(undefined);
    setCoverPending(true);
    const formData = new FormData();
    formData.set("cover", file);
    const result = await uploadCover(formData);
    setCoverPending(false);
    if ("error" in result) setCoverError(result.error);
    else {
      setCoverUrl(result.url);
      router.refresh();
    }
    e.target.value = "";
  }

  async function handleGalleryChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setGalleryError(undefined);
    setGalleryPending(true);
    const formData = new FormData();
    formData.set("image", file);
    const result = await uploadGalleryImage(formData);
    setGalleryPending(false);
    if ("error" in result) setGalleryError(result.error);
    else {
      setGallery((g) => [...g, result.url]);
      router.refresh();
    }
    e.target.value = "";
  }

  async function handleRemoveGalleryImage(url: string) {
    setGalleryError(undefined);
    setGalleryPending(true);
    const formData = new FormData();
    formData.set("url", url);
    const result = await removeGalleryImage(formData);
    setGalleryPending(false);
    if ("error" in result) setGalleryError(result.error);
    else {
      setGallery((g) => g.filter((u) => u !== url));
      router.refresh();
    }
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(undefined);
    setSaved(false);
    setPending(true);
    const formData = new FormData(e.currentTarget);
    formData.set("keywords", JSON.stringify(keywords));
    formData.set("socialLinks", JSON.stringify(socialLinks));
    formData.set("achievements", JSON.stringify(achievements));
    formData.set("services", JSON.stringify(services));
    const result = await updateProfile(formData);
    setPending(false);
    if ("error" in result) setError(result.error);
    else setSaved(true);
  }

  function addKeyword() {
    const trimmed = keywordInput.trim();
    if (trimmed && !keywords.includes(trimmed)) setKeywords((k) => [...k, trimmed]);
    setKeywordInput("");
  }

  function addSocialLink() {
    setSocialLinks((rows) => [...rows, { platform: SOCIAL_PLATFORMS[0], url: "" }]);
  }
  function updateSocialLink(index: number, patch: Partial<{ platform: string; url: string }>) {
    setSocialLinks((rows) => rows.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }
  function removeSocialLink(index: number) {
    setSocialLinks((rows) => rows.filter((_, i) => i !== index));
  }

  function addAchievement() {
    setAchievements((rows) => [...rows, { title: "", subtitle: "" }]);
  }
  function updateAchievement(index: number, patch: Partial<{ title: string; subtitle: string }>) {
    setAchievements((rows) => rows.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }
  function removeAchievement(index: number) {
    setAchievements((rows) => rows.filter((_, i) => i !== index));
  }

  function addService() {
    setServices((rows) => [...rows, ""]);
  }
  function updateService(index: number, value: string) {
    setServices((rows) => rows.map((row, i) => (i === index ? value : row)));
  }
  function removeService(index: number) {
    setServices((rows) => rows.filter((_, i) => i !== index));
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <div className="flex items-center justify-end gap-3">
        {error && <span className="text-sm text-destructive">{error}</span>}
        {saved && !error && <span className="text-sm text-muted-foreground">Saved.</span>}
        <Button asChild type="button" variant="secondary" className="h-9 rounded-[6px]">
          <Link href={`/${role}/kyc`}>
            <ShieldCheck className="size-4" />
            KYC Verification
          </Link>
        </Button>
        <Button type="button" variant="secondary" className="h-9 rounded-[6px]">
          <KeyRound className="size-4" />
          Change your Password
        </Button>
        <Button type="submit" disabled={pending} className="h-9 rounded-[6px]">
          {pending ? "Saving..." : "Save changes"}
        </Button>
      </div>

      <div className="overflow-hidden rounded-md bg-white/5">
        {role === "talent" && (
          <>
            <button
              type="button"
              onClick={() => coverInputRef.current?.click()}
              disabled={coverPending}
              className="group relative flex h-[120px] w-full items-center justify-center bg-white/10 text-muted-foreground"
            >
              {coverUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={coverUrl} alt="" className="size-full object-cover" />
              ) : (
                <ImageIcon className="size-8" />
              )}
              <span className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                <Camera className="size-5 text-white" />
              </span>
            </button>
            <input
              ref={coverInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={handleCoverChange}
              className="hidden"
            />
          </>
        )}
        <div className={cn("flex items-center gap-4 px-6 pb-6", role === "talent" ? "" : "pt-6")}>
          <button
            type="button"
            onClick={() => avatarInputRef.current?.click()}
            disabled={avatarPending}
            className={cn(
              "group relative flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-full border-4 border-card bg-white/10 text-muted-foreground",
              role === "talent" && "-mt-8"
            )}
          >
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatarUrl} alt="" className="size-full object-cover" />
            ) : (
              <User className="size-6" />
            )}
            <span className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
              <Camera className="size-5 text-white" />
            </span>
          </button>
          <input
            ref={avatarInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={handleAvatarChange}
            className="hidden"
          />
          <div className="flex flex-col pt-2">
            <span className="text-lg font-bold text-foreground">{profile.full_name || "Your Account"}</span>
            <span className="text-sm text-muted-foreground">
              {avatarPending
                ? "Uploading..."
                : avatarError
                  ? avatarError
                  : coverPending
                    ? "Uploading cover..."
                    : coverError
                      ? coverError
                      : "Manage your profile information, password and more"}
            </span>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-5 rounded-md bg-white/5 p-6">
        <h2 className="text-lg font-semibold text-foreground">Basic Information</h2>
        <div className="grid grid-cols-2 gap-5">
          <Field label="Display Name" name="fullName" defaultValue={profile.full_name} required />
          <Field label="Email" type="email" defaultValue={profile.email} disabled />
          <Field label="Phone number" type="tel" defaultValue="+84 90 123 4567" />
          <Field label="District" defaultValue="District 1" />
          <Field label="City/Province" name="location" defaultValue={profile.location ?? ""} />
          {role === "talent" && (
            <>
              <div className="flex flex-col gap-2">
                <Label className="text-sm text-muted-foreground">Category</Label>
                <select
                  defaultValue="Solo Singer"
                  className="h-11 rounded-[6px] border border-input bg-transparent px-3 text-sm text-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  {talentCategories.map((c) => (
                    <option key={c.label} value={c.label} className="bg-background">
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-2">
                <Label className="text-sm text-muted-foreground">Sub-Category</Label>
                <select
                  defaultValue="Rapper"
                  className="h-11 rounded-[6px] border border-input bg-transparent px-3 text-sm text-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  {["Rapper", "Ballad", "RnB", "Bolero"].map((s) => (
                    <option key={s} value={s} className="bg-background">
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              <Field
                label="Date of Birth"
                name="dateOfBirth"
                type="date"
                defaultValue={profile.date_of_birth ?? ""}
              />
              <Field
                label="Genre"
                name="genre"
                defaultValue={profile.genre ?? ""}
                placeholder="e.g. US/UK Hiphop/Rap"
              />
            </>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-5 rounded-md bg-white/5 p-6">
        <h2 className="text-lg font-semibold text-foreground">Bio</h2>
        <div className="flex flex-col gap-2">
          <Label className="text-sm text-muted-foreground">Description</Label>
          <Textarea rows={3} name="bio" className="rounded-[6px]" defaultValue={profile.bio ?? ""} />
        </div>
        <div className="flex flex-col gap-2">
          <Label className="text-sm text-muted-foreground">Thumbnail Image</Label>
          {galleryError && <span className="text-xs text-destructive">{galleryError}</span>}
          <div className="grid grid-cols-5 gap-3">
            {gallery.map((url) => (
              <div key={url} className="group relative aspect-square overflow-hidden rounded-[8px] bg-white/10">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt="" className="size-full object-cover" />
                <button
                  type="button"
                  onClick={() => handleRemoveGalleryImage(url)}
                  className="absolute right-1 top-1 flex size-5 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100"
                >
                  <X className="size-3" />
                </button>
              </div>
            ))}
            {gallery.length < 5 && (
              <button
                type="button"
                onClick={() => galleryInputRef.current?.click()}
                disabled={galleryPending}
                className="flex aspect-square items-center justify-center rounded-[8px] bg-white/10 text-muted-foreground hover:bg-white/15"
              >
                <ImageIcon className="size-5" />
              </button>
            )}
          </div>
          <input
            ref={galleryInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={handleGalleryChange}
            className="hidden"
          />
        </div>
      </div>

      {role === "talent" && (
        <div className="flex flex-col gap-4 rounded-md bg-white/5 p-6">
          <h2 className="text-lg font-semibold text-foreground">Keyword</h2>
          <div className="flex flex-wrap gap-2">
            {keywords.map((kw) => (
              <span
                key={kw}
                className="flex items-center gap-2 rounded-full bg-white/5 px-4 py-2 text-sm text-foreground"
              >
                {kw}
                <button
                  type="button"
                  onClick={() => setKeywords((k) => k.filter((x) => x !== kw))}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="size-3" />
                </button>
              </span>
            ))}
          </div>
          <div className="flex w-fit items-center gap-2">
            <Input
              value={keywordInput}
              onChange={(e) => setKeywordInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addKeyword();
                }
              }}
              placeholder="e.g. AcousticSet"
              className="h-9 w-48 rounded-[6px] text-xs"
            />
            <button
              type="button"
              onClick={addKeyword}
              className="flex shrink-0 items-center gap-1 rounded-[6px] bg-white/5 px-3 py-2 text-xs text-muted-foreground hover:bg-white/10"
            >
              <Plus className="size-3.5" /> Add Keyword
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-4 rounded-md bg-white/5 p-6">
        <h2 className="text-lg font-semibold text-foreground">Social Profile</h2>
        <div className="flex flex-col gap-3">
          {socialLinks.map((row, index) => (
            <div key={index} className="grid grid-cols-[1fr_2fr] gap-3">
              <select
                value={row.platform}
                onChange={(e) => updateSocialLink(index, { platform: e.target.value })}
                className="h-11 rounded-[6px] border border-input bg-transparent px-3 text-sm text-muted-foreground outline-none"
              >
                {SOCIAL_PLATFORMS.map((platform) => (
                  <option key={platform} value={platform} className="bg-background">
                    {platform}
                  </option>
                ))}
              </select>
              <div className="flex items-center gap-2">
                <Input
                  value={row.url}
                  onChange={(e) => updateSocialLink(index, { url: e.target.value })}
                  placeholder="https://..."
                  className="h-11 rounded-[6px]"
                />
                <button
                  type="button"
                  onClick={() => removeSocialLink(index)}
                  className="shrink-0 text-muted-foreground hover:text-foreground"
                >
                  <X className="size-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={addSocialLink}
          className="flex w-fit items-center gap-1 rounded-[6px] bg-white/5 px-3 py-2 text-xs text-muted-foreground hover:bg-white/10"
        >
          <Plus className="size-3.5" /> Add Social Link
        </button>
      </div>

      {role === "talent" && (
        <>
          <div className="flex flex-col gap-4 rounded-md bg-white/5 p-6">
            <h2 className="text-lg font-semibold text-foreground">Services</h2>
            <div className="flex flex-col gap-3">
              {services.map((value, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Input
                    value={value}
                    onChange={(e) => updateService(index, e.target.value)}
                    placeholder="e.g. Rapper performs for music festival, bar, club and pub."
                    className="h-11 rounded-[6px]"
                  />
                  <button
                    type="button"
                    onClick={() => removeService(index)}
                    className="shrink-0 text-muted-foreground hover:text-foreground"
                  >
                    <X className="size-4" />
                  </button>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={addService}
              className="flex w-fit items-center gap-1 rounded-[6px] bg-white/5 px-3 py-2 text-xs text-muted-foreground hover:bg-white/10"
            >
              <Plus className="size-3.5" /> Add Services
            </button>
          </div>

          <div className="flex flex-col gap-4 rounded-md bg-white/5 p-6">
            <h2 className="text-lg font-semibold text-foreground">Achievement</h2>
            <div className="flex flex-col gap-3">
              {achievements.map((row, index) => (
                <div key={index} className="grid grid-cols-[1fr_1fr] gap-3">
                  <Input
                    value={row.title}
                    onChange={(e) => updateAchievement(index, { title: e.target.value })}
                    placeholder="e.g. 2023 Nominee - BET Award"
                    className="h-11 rounded-[6px]"
                  />
                  <div className="flex items-center gap-2">
                    <Input
                      value={row.subtitle}
                      onChange={(e) => updateAchievement(index, { subtitle: e.target.value })}
                      placeholder="e.g. Video Director of the Year"
                      className="h-11 rounded-[6px]"
                    />
                    <button
                      type="button"
                      onClick={() => removeAchievement(index)}
                      className="shrink-0 text-muted-foreground hover:text-foreground"
                    >
                      <X className="size-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={addAchievement}
              className="flex w-fit items-center gap-1 rounded-[6px] bg-white/5 px-3 py-2 text-xs text-muted-foreground hover:bg-white/10"
            >
              <Plus className="size-3.5" /> Add Achievement
            </button>
          </div>
        </>
      )}
    </form>
  );
}
```

- [ ] **Step 4: Run it to verify it passes**

Run: `bun test src/components/account/profile-content.test.tsx`
Expected: PASS (8 tests).

- [ ] **Step 5: Typecheck**

Run: `bunx tsc --noEmit`
Expected: no errors originating from `profile-content.tsx` (errors may still exist in `talent-detail-content.tsx`/`event-detail-content.tsx` — those are fixed in Tasks 9-10).

- [ ] **Step 6: Run the full suite**

Run: `bun test`
Expected: all PASS.

- [ ] **Step 7: Commit**

```bash
git add src/components/account/profile-content.tsx src/components/account/profile-content.test.tsx
git commit -m "$(cat <<'EOF'
Wire up cover/thumbnail uploads and fix Social Profile in My Account

- Cover photo upload (Talent only), 5-slot thumbnail gallery upload/
  remove (all roles) — previously non-functional placeholders.
- Social Profile: "Add Social Link" now actually adds a row, the
  platform dropdown offers 11 platforms instead of 2 hardcoded ones,
  and the section now shows for Talent too, not just Organizer/Agency.
- Achievement reshaped to title + subtitle rows (matches the public
  About Talent display); new Services section; new Date of Birth and
  Genre fields.
- Organizer/Agency's banner strip removed entirely (no cover for
  those roles, matching their Figma frames).

Author: Claude Code <noreply@anthropic.com>
EOF
)"
```

---

### Task 9: Wire cover/gallery/services/social/achievements into the Talent detail page

**Files:**
- Modify: `src/components/talent-detail/talent-detail-content.tsx` (full rewrite)
- Test: `src/components/talent-detail/talent-detail-content.test.tsx`

**Interfaces:**
- Consumes: `Profile.cover_url`, `.gallery_urls`, `.social_links`, `.achievements`, `.services`, `.date_of_birth`, `.genre` (Task 3).
- Produces: no new exports — call site (the talent detail route) is unchanged.

- [ ] **Step 1: Write the failing tests**

`src/components/talent-detail/talent-detail-content.test.tsx`:

```tsx
import { afterEach, describe, expect, it, mock } from "bun:test";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

mock.module("@/components/talent-detail/booking-panel", () => ({
  BookingPanel: () => null,
}));
mock.module("@/components/talent-detail/request-quote-dialog", () => ({
  RequestQuoteDialog: () => null,
}));

import { TalentDetailContent } from "@/components/talent-detail/talent-detail-content";
import type { Profile } from "@/lib/supabase/types";
import type { TalentReviewSummary } from "@/lib/supabase/reviews";

afterEach(() => cleanup());

function makeTalent(overrides: Partial<Profile> = {}): Profile {
  return {
    id: "talent-1",
    role: "talent",
    slug: "test-talent",
    full_name: "Test Talent",
    avatar_url: null,
    bio: "A great performer.",
    location: null,
    keywords: [],
    kyc_status: "verified",
    notifications_read_at: null,
    created_at: new Date().toISOString(),
    cover_url: null,
    gallery_urls: [],
    social_links: [],
    achievements: [],
    services: [],
    date_of_birth: null,
    genre: null,
    ...overrides,
  };
}

const reviewSummary: TalentReviewSummary = { avgRating: 4.8, count: 0, reviews: [] };

describe("TalentDetailContent — cover photo", () => {
  it("renders the cover image in the hero when present", () => {
    render(
      <TalentDetailContent
        talent={makeTalent({ cover_url: "https://example.com/cover.png" })}
        packages={[]}
        reviewSummary={reviewSummary}
      />
    );
    const img = screen.getByAltText("") as HTMLImageElement;
    expect(img.src).toBe("https://example.com/cover.png");
  });
});

describe("TalentDetailContent — Overview tab", () => {
  it("shows real Service Provided entries instead of mock data", () => {
    render(
      <TalentDetailContent
        talent={makeTalent({ services: ["DJ Sets", "Live Vocals"] })}
        packages={[]}
        reviewSummary={reviewSummary}
      />
    );
    expect(screen.getByText("DJ Sets")).toBeInTheDocument();
    expect(screen.getByText("Live Vocals")).toBeInTheDocument();
  });
});

describe("TalentDetailContent — About Talent tab", () => {
  it("shows social links, location, DOB, genre, and achievements", () => {
    render(
      <TalentDetailContent
        talent={makeTalent({
          location: "Harlem, New York, United State",
          date_of_birth: "1988-10-03",
          genre: "US/UK Hiphop/Rap",
          social_links: [{ platform: "Instagram", url: "https://instagram.com/asaprocky" }],
          achievements: [{ title: "2023 Nominee - BET Award", subtitle: "Video Director of the Year" }],
        })}
        packages={[]}
        reviewSummary={reviewSummary}
      />
    );
    fireEvent.mouseDown(screen.getByRole("tab", { name: "About Talent" }));
    expect(screen.getByText("Instagram")).toBeInTheDocument();
    expect(screen.getByText("Harlem, New York, United State")).toBeInTheDocument();
    expect(screen.getByText("US/UK Hiphop/Rap")).toBeInTheDocument();
    expect(screen.getByText("2023 Nominee - BET Award")).toBeInTheDocument();
    expect(screen.getByText("Video Director of the Year")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `bun test src/components/talent-detail/talent-detail-content.test.tsx`
Expected: FAIL — hero/gallery/services still use the hardcoded `mock` data, and About Talent has none of the new fields.

- [ ] **Step 3: Rewrite the component**

Replace the full contents of `src/components/talent-detail/talent-detail-content.tsx`:

```tsx
"use client";

import { useState } from "react";
import { CalendarDays, CheckCircle2, ImageIcon, Link as LinkIcon } from "lucide-react";
import { CardCarousel } from "@/components/shell/card-carousel";
import { ListingCard } from "@/components/shell/listing-card";
import { BookingPanel } from "@/components/talent-detail/booking-panel";
import { RatingReviewCard } from "@/components/talent-detail/rating-review-card";
import { RequestQuoteDialog } from "@/components/talent-detail/request-quote-dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { mockTalentDetail } from "@/lib/mock-talent-detail";
import { mockFeaturedListings } from "@/lib/mock-listings";
import type { TalentReviewSummary } from "@/lib/supabase/reviews";
import type { PackageRow, Profile } from "@/lib/supabase/types";

const TABS = ["Overview", "Schedules", "Reviews", "About Talent"] as const;
type Tab = (typeof TABS)[number];

const mockAvailability = [
  { date: "12 Aug 2026", slot: "7:00 PM - 9:00 PM", status: "Available" },
  { date: "19 Aug 2026", slot: "8:00 PM - 10:00 PM", status: "Available" },
  { date: "26 Aug 2026", slot: "7:00 PM - 9:00 PM", status: "Booked" },
];

export function TalentDetailContent({
  talent,
  packages,
  reviewSummary,
}: {
  talent: Profile;
  packages: PackageRow[];
  reviewSummary: TalentReviewSummary;
}) {
  const [tab, setTab] = useState<Tab>("Overview");
  // Tagline/category have no real schema yet — kept as generic mock flavor
  // text alongside the real name/bio/packages/reviews/media/social data.
  const mock = mockTalentDetail;
  const bio = talent.bio || mock.bio;

  return (
    <div className="flex flex-col gap-6 py-8">
      <div className="relative flex h-[280px] w-full flex-col justify-end overflow-hidden rounded-md">
        {talent.cover_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={talent.cover_url} alt="" className="absolute inset-0 size-full object-cover" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-white/10 text-muted-foreground">
            <ImageIcon className="size-10" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
        <div className="relative flex flex-col gap-1 p-8">
          <h1 className="text-4xl font-bold tracking-[-0.03em] text-white">{talent.full_name}</h1>
          <span className="text-sm text-white/60">{mock.category}</span>
        </div>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)}>
        <TabsList className="h-auto w-fit gap-3 rounded-none bg-transparent p-0">
          {TABS.map((t) => (
            <TabsTrigger
              key={t}
              value={t}
              className="rounded-[8px] border-none bg-white/5 px-6 py-3 text-sm font-medium text-foreground shadow-none data-active:bg-foreground data-active:text-background dark:data-active:bg-foreground dark:data-active:text-background"
            >
              {t}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className="flex gap-8">
        <div className="flex min-w-0 flex-1 flex-col gap-8">
          {tab === "Overview" && (
            <>
              <RatingReviewCard
                avgRating={reviewSummary.avgRating}
                count={reviewSummary.count}
                reviews={reviewSummary.reviews}
              />

              <h2 className="text-2xl font-bold tracking-[-0.03em] text-foreground">{mock.tagline}</h2>

              <div className="flex flex-col gap-3">
                <div className="relative flex aspect-video w-full items-center justify-center overflow-hidden rounded-md bg-white/10 text-muted-foreground">
                  {talent.gallery_urls[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={talent.gallery_urls[0]} alt="" className="size-full object-cover" />
                  ) : (
                    <ImageIcon className="size-10" />
                  )}
                </div>
                {talent.gallery_urls.length > 1 && (
                  <div className="grid grid-cols-3 gap-3">
                    {talent.gallery_urls.slice(1, 4).map((url) => (
                      <div
                        key={url}
                        className="flex aspect-video items-center justify-center overflow-hidden rounded-md bg-white/10 text-muted-foreground"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={url} alt="" className="size-full object-cover" />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <p className="text-sm leading-relaxed text-muted-foreground">{bio}</p>

              {talent.keywords.length > 0 && (
                <div className="flex flex-col gap-3">
                  <h3 className="text-xl font-bold tracking-[-0.03em] text-foreground">Keyword</h3>
                  <div className="flex flex-wrap gap-2">
                    {talent.keywords.map((keyword) => (
                      <span
                        key={keyword}
                        className="rounded-full bg-white/5 px-4 py-2 text-sm text-foreground"
                      >
                        {keyword}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {talent.services.length > 0 && (
                <div className="flex flex-col gap-4">
                  <h3 className="text-xl font-bold tracking-[-0.03em] text-foreground">
                    Service Provided
                  </h3>
                  <div className="grid grid-cols-2 gap-x-8 gap-y-4 rounded-md bg-white/5 p-6">
                    {talent.services.map((service) => (
                      <div key={service} className="flex items-start gap-3">
                        <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-green-500" />
                        <span className="text-sm text-foreground">{service}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <CardCarousel title="More Related Talents" viewAllHref="/organizer/discover">
                {mockFeaturedListings.map((item) => (
                  <ListingCard key={item.id} data={item} />
                ))}
              </CardCarousel>
            </>
          )}

          {tab === "Schedules" && (
            <div className="flex flex-col gap-3">
              <h2 className="text-xl font-bold tracking-[-0.03em] text-foreground">
                Upcoming Availability
              </h2>
              {mockAvailability.map((slot) => (
                <div
                  key={slot.date}
                  className="flex items-center justify-between rounded-md bg-white/5 p-4"
                >
                  <div className="flex items-center gap-3">
                    <CalendarDays className="size-5 text-muted-foreground" />
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-foreground">{slot.date}</span>
                      <span className="text-xs text-muted-foreground">{slot.slot}</span>
                    </div>
                  </div>
                  <span
                    className={cn(
                      "rounded-full px-3 py-1 text-xs font-medium",
                      slot.status === "Available"
                        ? "bg-green-500/10 text-green-500"
                        : "bg-white/10 text-muted-foreground"
                    )}
                  >
                    {slot.status}
                  </span>
                </div>
              ))}
            </div>
          )}

          {tab === "Reviews" && (
            <div className="flex flex-col gap-4">
              <h2 className="text-xl font-bold tracking-[-0.03em] text-foreground">
                {reviewSummary.count} Review{reviewSummary.count === 1 ? "" : "s"}
              </h2>
              {reviewSummary.reviews.length === 0 ? (
                <p className="text-sm text-muted-foreground">No reviews yet.</p>
              ) : (
                reviewSummary.reviews.map((review) => (
                  <div key={review.id} className="flex flex-col gap-2 rounded-md bg-white/5 p-5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white/10 text-xs font-semibold text-foreground">
                          {review.reviewer_name
                            .split(" ")
                            .map((w) => w[0])
                            .slice(0, 2)
                            .join("")}
                        </div>
                        <span className="text-sm font-medium text-foreground">{review.reviewer_name}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(review.created_at).toLocaleDateString("en-US")}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">{review.comment || "No comment left."}</p>
                  </div>
                ))
              )}
            </div>
          )}

          {tab === "About Talent" && (
            <div className="flex flex-col gap-8">
              <div className="flex flex-col gap-3">
                <h2 className="text-xl font-bold tracking-[-0.03em] text-foreground">
                  About {talent.full_name}
                </h2>
                <p className="text-sm leading-relaxed text-muted-foreground">{bio}</p>
                {talent.social_links.length > 0 && (
                  <div className="flex flex-wrap gap-3">
                    {talent.social_links.map((link) => (
                      <a
                        key={`${link.platform}-${link.url}`}
                        href={link.url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-2 rounded-full bg-white/5 px-4 py-2 text-sm text-foreground hover:bg-white/10"
                      >
                        <LinkIcon className="size-4" />
                        {link.platform}
                      </a>
                    ))}
                  </div>
                )}
                <div className="flex flex-wrap gap-8">
                  {talent.location && (
                    <div className="flex flex-col gap-1">
                      <span className="text-xs uppercase text-muted-foreground">Location</span>
                      <span className="text-sm text-foreground">{talent.location}</span>
                    </div>
                  )}
                  {talent.date_of_birth && (
                    <div className="flex flex-col gap-1">
                      <span className="text-xs uppercase text-muted-foreground">DOB</span>
                      <span className="text-sm text-foreground">
                        {new Date(talent.date_of_birth).toLocaleDateString("en-US", {
                          day: "2-digit",
                          month: "long",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                  )}
                  {talent.genre && (
                    <div className="flex flex-col gap-1">
                      <span className="text-xs uppercase text-muted-foreground">Genre</span>
                      <span className="text-sm text-foreground">{talent.genre}</span>
                    </div>
                  )}
                </div>
              </div>

              {talent.services.length > 0 && (
                <div className="flex flex-col gap-4">
                  <h3 className="text-xl font-bold tracking-[-0.03em] text-foreground">
                    Service Provided
                  </h3>
                  <div className="grid grid-cols-2 gap-x-8 gap-y-4 rounded-md bg-white/5 p-6">
                    {talent.services.map((service) => (
                      <div key={service} className="flex items-start gap-3">
                        <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-green-500" />
                        <span className="text-sm text-foreground">{service}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {talent.achievements.length > 0 && (
                <div className="flex flex-col gap-4">
                  <h3 className="text-xl font-bold tracking-[-0.03em] text-foreground">Achievement</h3>
                  <div className="flex flex-col gap-3 rounded-md bg-white/5 p-6">
                    {talent.achievements.map((item, index) => (
                      <div key={index} className="flex items-start gap-3">
                        <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-green-500" />
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-foreground">{item.title}</span>
                          {item.subtitle && (
                            <span className="text-xs text-muted-foreground">{item.subtitle}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex h-fit w-[380px] shrink-0 flex-col gap-4">
          <BookingPanel talentName={talent.full_name} packages={packages} />
          <RequestQuoteDialog talentId={talent.id} talentName={talent.full_name} />
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run it to verify it passes**

Run: `bun test src/components/talent-detail/talent-detail-content.test.tsx`
Expected: PASS (3 tests).

- [ ] **Step 5: Typecheck**

Run: `bunx tsc --noEmit`
Expected: no errors from `talent-detail-content.tsx`.

- [ ] **Step 6: Run the full suite**

Run: `bun test`
Expected: all PASS.

- [ ] **Step 7: Commit**

```bash
git add src/components/talent-detail/talent-detail-content.tsx src/components/talent-detail/talent-detail-content.test.tsx
git commit -m "$(cat <<'EOF'
Wire cover/gallery/services/social links/achievements into Talent detail

Hero banner and Overview gallery now use the talent's real
cover_url/gallery_urls; "Service Provided" (Overview + About Talent) now
uses real services data instead of hardcoded mock text; About Talent
adds a social links row, Location/DOB/Genre, and the Achievement list.

Author: Claude Code <noreply@anthropic.com>
EOF
)"
```

---

### Task 10: Fix the event page's "About Organizer" tab

**Files:**
- Modify: `src/components/event-detail/event-detail-content.tsx`
- Test: `src/components/event-detail/event-detail-content.test.tsx`

**Interfaces:**
- Consumes: `EventWithSlots["organizer"].bio/.gallery_urls/.social_links` (Task 7).
- Produces: no new exports.

- [ ] **Step 1: Write the failing test**

`src/components/event-detail/event-detail-content.test.tsx`:

```tsx
import { afterEach, describe, expect, it, mock } from "bun:test";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

mock.module("@/components/event-detail/apply-panel", () => ({
  ApplyPanel: () => null,
}));

import { EventDetailContent } from "@/components/event-detail/event-detail-content";
import type { EventWithSlots } from "@/lib/supabase/types";

afterEach(() => cleanup());

function makeEvent(overrides: Partial<EventWithSlots> = {}): EventWithSlots {
  return {
    id: "event-1",
    organizer_id: "org-1",
    slug: "test-event",
    name: "Test Event",
    venue: "Test Venue",
    address: "123 Test St",
    event_date: "2026-08-04",
    start_time: "20:00",
    end_time: "22:00",
    tagline: null,
    description: "The event's own description.",
    budget_min_vnd: null,
    budget_max_vnd: null,
    contact_phone: null,
    expected_guests: null,
    special_requirements: null,
    status: "upcoming",
    created_at: new Date().toISOString(),
    slots: [],
    organizer: { full_name: "", location: null, bio: null, gallery_urls: [], social_links: [] },
    ...overrides,
  };
}

describe("EventDetailContent — About Organizer tab", () => {
  it("shows the organizer's own bio and social links, not the event's description", () => {
    render(
      <EventDetailContent
        role="talent"
        event={makeEvent({
          organizer: {
            full_name: "420 Ent.",
            location: "District 1, Ho Chi Minh City",
            bio: "The organizer's real bio.",
            gallery_urls: [],
            social_links: [{ platform: "Instagram", url: "https://instagram.com/420ent" }],
          },
        })}
        moreEvents={[]}
      />
    );
    fireEvent.mouseDown(screen.getByRole("tab", { name: "About Organizer" }));
    expect(screen.getByText("The organizer's real bio.")).toBeInTheDocument();
    expect(screen.getByText("Instagram")).toBeInTheDocument();
    expect(screen.queryByText("The event's own description.")).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `bun test src/components/event-detail/event-detail-content.test.tsx`
Expected: FAIL — the tab currently shows `event.description`, not `organizer.bio`, and has no social links row.

- [ ] **Step 3: Fix the tab**

Modify `src/components/event-detail/event-detail-content.tsx` — add `Link as LinkIcon` to the `lucide-react` import, and replace the `"About Organizer"` tab block:

```tsx
import { ImageIcon, Link as LinkIcon, MapPin } from "lucide-react";
```

```tsx
{tab === "About Organizer" && (
  <div className="flex gap-6">
    <div className="aspect-square w-[220px] shrink-0 overflow-hidden rounded-md bg-white/10">
      {event.organizer.gallery_urls[0] ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={event.organizer.gallery_urls[0]} alt="" className="size-full object-cover" />
      ) : (
        <div className="flex size-full items-center justify-center text-muted-foreground">
          <ImageIcon className="size-8" />
        </div>
      )}
    </div>
    <div className="flex flex-1 flex-col gap-4">
      <h2 className="text-xl font-bold tracking-[-0.03em] text-foreground">
        {event.organizer.full_name || "Organizer"}
      </h2>
      <div className="flex flex-col gap-3 rounded-md bg-white/5 p-5">
        {event.organizer.location && (
          <div className="flex items-center gap-3 text-sm text-foreground">
            <MapPin className="size-4 shrink-0 text-muted-foreground" />
            {event.organizer.location}
          </div>
        )}
        {event.contact_phone && (
          <div className="text-sm text-muted-foreground">Contact: {event.contact_phone}</div>
        )}
      </div>
      {event.organizer.bio && (
        <p className="text-sm leading-relaxed text-muted-foreground">{event.organizer.bio}</p>
      )}
      {event.organizer.social_links.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {event.organizer.social_links.map((link) => (
            <a
              key={`${link.platform}-${link.url}`}
              href={link.url}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 rounded-full bg-white/5 px-4 py-2 text-sm text-foreground hover:bg-white/10"
            >
              <LinkIcon className="size-4" />
              {link.platform}
            </a>
          ))}
        </div>
      )}
    </div>
  </div>
)}
```

This replaces the tab's previous body (which read `event.organizer.full_name`, `event.organizer.location`, `event.contact_phone`, and `event.description` — the last of those was the actual bug: the event's own description standing in for the organizer's bio).

- [ ] **Step 4: Run it to verify it passes**

Run: `bun test src/components/event-detail/event-detail-content.test.tsx`
Expected: PASS.

- [ ] **Step 5: Typecheck**

Run: `bunx tsc --noEmit`
Expected: no remaining errors anywhere in the project (this is the last file this plan touches).

- [ ] **Step 6: Run the full suite**

Run: `bun test`
Expected: all PASS.

- [ ] **Step 7: Commit**

```bash
git add src/components/event-detail/event-detail-content.tsx src/components/event-detail/event-detail-content.test.tsx
git commit -m "$(cat <<'EOF'
Fix About Organizer tab to show the organizer's profile, not the event's

Was showing event.description as if it were the organizer's bio. Now
shows organizer.bio, a representative photo from their gallery, and
their social links.

Author: Claude Code <noreply@anthropic.com>
EOF
)"
```

---

### Task 11: Final verification

**Files:** none (verification only)

- [ ] **Step 1: Full typecheck**

Run: `bunx tsc --noEmit`
Expected: no errors.

- [ ] **Step 2: Full test suite**

Run: `bun test`
Expected: all PASS, across every `.test.ts`/`.test.tsx` file added in Tasks 1-10.

- [ ] **Step 3: Lint**

Run: `bun run lint`
Expected: no errors (the `<img>` tags all carry the existing `eslint-disable-next-line @next/next/no-img-element` comment, matching the codebase's existing avatar-upload pattern).

- [ ] **Step 4: Manual browser verification (requires Task 2's migration applied first)**

Start the dev server (`bun run dev`) and, against each of the three roles, confirm in a real browser — this cannot be automated, per the spec's Testing section:
- Talent My Account: cover photo click opens a file picker and uploads; 5 thumbnail slots upload/replace/remove; Social Profile "Add Social Link" adds a row with the full platform list; Achievement/Services rows add/remove and persist only after "Save changes"; Date of Birth/Genre save.
- Organizer/Agency My Account: no cover banner rendered at all (just avatar + name); thumbnail gallery and Social Profile work identically to Talent's.
- Talent public detail page: hero shows the uploaded cover; Overview shows the uploaded gallery images and real "Service Provided" entries; About Talent tab shows social links, Location/DOB/Genre, and Achievements.
- Event detail page, About Organizer tab: shows the organizer's real bio (not the event's description) and their social links.

- [ ] **Step 5: Report results**

Summarize the manual verification outcome (pass/fail per bullet above) back to the user — do not claim the feature works end-to-end without having actually clicked through it, per the project's UI-verification requirement.
