# Recently Added link fix + app-wide toast notifications — design

## Problem

While manually verifying the previous PR (#14), the user found:

1. Homepage "Recently Added" list items aren't clickable.
2. Avatar doesn't appear to update after upload.
3. The public Talent detail page appears to show no real content in any tab.
4. No mutating action (upload, save, accept/reject, checkout, etc.) tells the
   user whether it succeeded or failed — errors are easy to miss (small
   inline text, if shown at all) and successes are often silent.

Investigation (reading code + querying the dev database directly with the
already-configured anon key, which is sufficient since `profiles` is
publicly readable) found:

- **#1 is a real, pre-existing bug**, unrelated to PR #14: `ListingRow` (the
  compact row component "Recently Added" renders) has no `href` prop and no
  `Link` wrapper at all — it's a plain `<div>`. `ListingCard` (used by "Most
  Popular"/"Editor Choice") already supports an optional `href`; `ListingRow`
  was never given the same treatment when PR #12 wired it to real data.
- **#2 has no visible code bug**: the test account's `avatars` storage
  bucket folder is completely empty — no file was ever uploaded, not "was
  uploaded but isn't showing." The account does have other real data
  (gallery image, a Facebook link, a bio), confirming uploads in general
  work for that account. The most likely explanation is a previously-silent
  upload failure (wrong file/too large/transient error) that #4 will make
  visible next time it happens — no code fix is prescribed here beyond that.
- **#3 has no visible code bug either**: every *Talent* test account in the
  dev DB currently has completely empty profile data (no bio, gallery,
  services, etc.) — the account the user populated with real data during
  testing is an *Organizer* account. A Talent detail page correctly shows
  only placeholders/mock fallback for a talent with nothing entered. Once a
  Talent account has real data, the page should show it (this was verified
  by task-level review during PR #14 with real fixture data in tests).
- **#4 is confirmed, real, and substantial**: none of the ~30 mutating
  server actions across 18 client components surface a toast today.

Given the size of #4, this was scoped with the user via `superpowers:brainstorming`
before any implementation.

## Scope

### In scope
- Fix `ListingRow` to support an optional `href` (mirroring `ListingCard`),
  and wire it into the "Recently Added" section in `home-content.tsx`.
- Add a toast notification system (`sonner`, shadcn/ui's current recommended
  toast component — nothing toast-related exists in this repo yet) and
  retrofit **every existing mutating server action call site in the app**
  (not just the ones touched by PR #14) to report success/error via toast.

### Explicitly out of scope
- Any code fix for #2 (avatar) or #3 (talent detail) beyond what's already
  in `main` — both are believed to be non-bugs (see Problem above). The user
  will re-verify both once toasts exist and make failures visible, and after
  populating a real Talent account's profile data.
- Redesigning the inline pending/disabled-button states already present at
  each call site (e.g. `disabled={pending}`) — those stay; only the
  success/error *messaging* changes.
- A generic retry/undo affordance on toasts — out of scope, not requested.

## Why a single wrapper works here

Every one of the ~30 actions below already returns the same shape:
`Promise<{ error: string } | { success: true; ...extra }>` (two exceptions:
`signIn`/`signOut`, which return `void` and redirect on success — a toast
after a successful redirect would never render anyway, so only their error
path needs a toast). This uniformity means a single generic helper can wrap
any call site without per-action special-casing.

## Design

### 1. Toast library

Add `sonner` (`bun add sonner`) and a shadcn-style wrapper component
`src/components/ui/sonner.tsx` (the standard shadcn `Toaster` wrapper that
reads the app's dark/light theme — this repo doesn't have a theme
provider/toggle today, so it renders in a fixed theme matching the app's
existing all-dark visual style; revisit if a theme toggle is ever added).
Mount `<Toaster />` once in `src/app/layout.tsx` (the root layout, so it's
available on every route regardless of role).

### 2. The wrapper helper

New file `src/lib/toast-action.ts`:

```ts
"use client";

import { toast } from "sonner";

export async function runAction<T>(
  promise: Promise<T>,
  options: { success?: string } = {}
): Promise<T> {
  const result = await promise;
  if (result && typeof result === "object" && "error" in result && typeof result.error === "string") {
    toast.error(result.error);
  } else if (options.success) {
    toast.success(options.success);
  }
  return result;
}
```

Every call site changes from this shape:

```ts
const result = await someAction(formData);
if ("error" in result) setError(result.error);
else setSaved(true);
```

to:

```ts
const result = await runAction(someAction(formData), { success: "Profile updated." });
if ("error" in result) setError(result.error);
```

The existing `if ("error" in result)` follow-up logic is untouched — the
wrapper doesn't change control flow, it only adds the toast side effect and
returns the same value.

### 3. Retrofit principle (what happens to existing inline success/error text)

- **Remove** inline text that says nothing beyond generic success/failure
  (e.g. `profile-content.tsx`'s `{saved && <span>Saved.</span>}` and
  `{error && <span>{error}</span>}` lines) — the toast replaces it, net
  simplification (fewer state variables).
  `profile-content.tsx`'s `avatarError`/`coverError`/`galleryError` local
  state and their inline rendering fall into this category too, since they
  only ever showed the same string the action already returns.
- **Keep** inline text/UI that conveys something the toast doesn't (e.g. a
  disabled button while `pending`, a field-level validation message that's
  more specific than the action's top-level error, or a dialog closing
  itself). Toast is additive there, not a replacement.
- **Add both** where nothing exists today: several call sites
  (`removeFromCart` in `cart-button.tsx`, `markNotificationsRead` in
  `notification-button.tsx`) don't even capture the action's result today —
  those need the result captured and wrapped for the first time.

### 4. Full call-site inventory (18 files, all in scope)

| File | Action(s) | Suggested success message |
|---|---|---|
| `src/app/(auth)/sign-in/page.tsx` | `signIn` | — (redirects on success; error-only toast) |
| `src/app/(auth)/sign-up/page.tsx` | `signUp`, `resendSignUpEmail` | "Account created — check your email to confirm." / "Confirmation email resent." |
| `src/app/(auth)/forgot-password/page.tsx` | `requestPasswordReset`, `updatePassword` | "Reset link sent." / "Password updated." |
| `src/app/organizer/create/page.tsx` | `createEvent` | "Event created." |
| `src/components/account/event-applications-panel.tsx` | `acceptApplication`, `rejectApplication` | "Application accepted." / "Application rejected." |
| `src/components/account/orders-content.tsx` | `acceptBooking`, `rejectBooking` | "Booking accepted." / "Booking rejected." |
| `src/components/account/packages-content.tsx` | `deletePackage` | "Package deleted." |
| `src/components/account/profile-content.tsx` | `updateProfile`, `uploadAvatar`, `uploadCover`, `uploadGalleryImage`, `removeGalleryImage` | "Profile updated." / "Avatar updated." / "Cover updated." / "Image uploaded." / "Image removed." |
| `src/components/account/quotations-content.tsx` | `respondToQuotation`, `declineQuotation`, `rejectQuotation`, `acceptQuotation` | "Quote sent." / "Quotation declined." / "Quotation rejected." / "Quotation accepted." |
| `src/components/checkout/checkout-content.tsx` | `removeFromCart`, `checkoutCart` | "Removed from cart." / "Order placed." |
| `src/components/create-package/create-package-dialog.tsx` | `createPackage`, `updatePackage` | "Package created." / "Package updated." |
| `src/components/event-detail/apply-dialog.tsx` | `applyToSlot` | "Application submitted." |
| `src/components/kyc/kyc-wizard.tsx` | `submitKyc`, `uploadKycDocument` (5 document slots via a shared `uploadSlotHandler` factory) | "KYC submission received." / "Document uploaded." |
| `src/components/shared/review-dialog.tsx` | `submitReview` | "Review submitted." |
| `src/components/shell/cart-button.tsx` | `removeFromCart` | "Removed from cart." |
| `src/components/shell/notification-button.tsx` | `markNotificationsRead` | — (silent success is fine; error still toasts) |
| `src/components/talent-detail/booking-panel.tsx` | `addToCart` | "Added to cart." |
| `src/components/talent-detail/request-quote-dialog.tsx` | `requestQuotation` | "Quote request sent." |

Exact wording may be adjusted per file during implementation to match
surrounding copy tone — the table above is the intent, not verbatim
required text.

## Testing

Following this repo's existing `bun:test` + `@testing-library/react`
convention (established in the previous PR):
- `runAction` gets pure unit tests (`src/lib/toast-action.test.ts`) using
  `mock.module("sonner", ...)` to verify it calls `toast.error`/`toast.success`
  correctly for the error/success/no-success-message cases, and always
  returns the original result unchanged.
- The `ListingRow` href fix gets a new RTL test confirming it renders an
  anchor when `href` is passed and a plain div when it isn't. (Checked:
  `listing-card.test.tsx` today only covers the pure `formatPriceRange`
  helper, not `ListingCard`'s own href-wrapping behavior — there's no
  existing precedent test to mirror, so this is a fresh test file.)
- **Correction from initial scoping**: only 1 of the 18 retrofitted files
  (`profile-content.tsx`) currently has a test file. This repo's
  `tdd-enforce.sh` commit hook blocks staging any `.ts`/`.tsx` file that
  lacks a sibling test — so the other 17 files each need a new test file
  regardless, not as extra rigor but as a hard requirement to commit at
  all. Given that, each retrofitted file gets one targeted RTL test that
  mocks the relevant action(s) and `sonner`, triggers the mutating action,
  and asserts `toast.success`/`toast.error` fired with the expected
  message — this directly tests what changed (the retrofit itself) rather
  than being a disconnected smoke test, and doesn't re-litigate `runAction`'s
  own already-covered branch logic. Each file's *existing* tests (where
  present) must still pass unchanged.
