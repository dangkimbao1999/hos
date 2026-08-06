# Recently Added Link Fix + App-Wide Toast Notifications Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the "Recently Added" homepage list's missing links, and give every mutating action in the app (~30 call sites across 18 files) a success/error toast so users always know whether an action worked.

**Architecture:** A single generic `runAction` wrapper (`src/lib/toast-action.ts`) around the app's already-uniform `{error: string} | {success: true, ...}` server-action return shape, backed by `sonner` (shadcn/ui's current toast component) mounted once in the root layout. Every call site changes from `const result = await someAction(x)` to `const result = await runAction(someAction(x), { success: "..." })` — no control-flow changes, just an added side effect.

**Tech Stack:** Next.js 16 (App Router) + React 19, `sonner` for toasts, `bun` as package manager and test runner (`bun run test` / `bun test --isolate`).

## Global Constraints

- Never use `npm`/`npx` — `bun` exclusively.
- Always run the test suite via `bun run test` or `bun test --isolate` — never bare `bun test` (Bun's `mock.module()` leaks mocked modules across test files without `--isolate`; see `AGENTS.md`).
- `.claude/hooks/tdd-enforce.sh` blocks `git commit` on any staged `.ts`/`.tsx` file lacking a sibling `*.test.ts(x)` file (on disk or staged in the same commit). Of the 18 files retrofitted in this plan, only `profile-content.tsx` currently has one — every other file needs a new test file as part of its own task, not as optional extra coverage.
- Stage specific files only — never `git add -A` / `git add .`.
- Retrofit principle: toast becomes the primary success/error signal. Remove inline "Saved."/generic error text that says nothing beyond what the toast already says. Keep inline text/UI that conveys something more specific (field-level validation, a dedicated "success" screen/step). Where a call site doesn't capture the action's result today, capture it for the first time.
- Path alias: `@/*` → `./src/*`.

---

## File Structure

New files:
- `src/components/ui/sonner.tsx` — shadcn-style `Toaster` wrapper
- `src/lib/toast-action.ts` (+ `.test.ts`) — the `runAction` wrapper
- One new `*.test.tsx` per retrofitted file that doesn't already have one (17 of 18 files)

Modified files:
- `package.json`, `bun.lock` — add `sonner`
- `src/app/layout.tsx` — mount `<Toaster />`
- `src/components/shell/listing-card.tsx`, `src/components/shell/listing-card.test.tsx` — `ListingRow` href support
- `src/components/shell/home-content.tsx` — pass `href` to `ListingRow`
- The 18 files listed in the spec's call-site inventory

---

### Task 1: Toast infrastructure

**Files:**
- Create: `src/components/ui/sonner.tsx`
- Modify: `src/app/layout.tsx`
- Create: `src/lib/toast-action.ts`
- Test: `src/lib/toast-action.test.ts`
- Modify: `package.json`, `bun.lock` (via `bun add`)

**Interfaces:**
- Produces: `runAction<T>(promise: Promise<T>, options?: { success?: string }): Promise<T>` — imported by every task in this plan (Tasks 3-7). `<Toaster />` mounted globally — no import needed elsewhere.

- [ ] **Step 1: Install sonner**

Run: `bun add sonner`

- [ ] **Step 2: Create the Toaster wrapper**

`src/components/ui/sonner.tsx`:

```tsx
"use client";

import { Toaster as Sonner, type ToasterProps } from "sonner";

export function Toaster(props: ToasterProps) {
  return (
    <Sonner
      theme="dark"
      className="toaster group"
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
        } as React.CSSProperties
      }
      {...props}
    />
  );
}
```

(No `next-themes` dependency exists in this repo — the root layout hardcodes `className="dark ..."` with no toggle, so the wrapper hardcodes `theme="dark"` to match rather than pulling in a theme provider for a single fixed value.)

- [ ] **Step 3: Mount it in the root layout**

Modify `src/app/layout.tsx`:

```tsx
import type { Metadata } from "next";
import { Be_Vietnam_Pro } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const beVietnamPro = Be_Vietnam_Pro({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "HOS",
  description: "Heart of Show",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`dark ${beVietnamPro.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
```

- [ ] **Step 4: Write the failing test for `runAction`**

`src/lib/toast-action.test.ts`:

```ts
import { beforeEach, describe, expect, it, mock } from "bun:test";

const calls: { type: "error" | "success"; message: string }[] = [];

mock.module("sonner", () => ({
  toast: {
    error: (message: string) => calls.push({ type: "error", message }),
    success: (message: string) => calls.push({ type: "success", message }),
  },
}));

import { runAction } from "@/lib/toast-action";

describe("runAction", () => {
  beforeEach(() => {
    calls.length = 0;
  });

  it("shows an error toast and returns the result when the action fails", async () => {
    const result = await runAction(Promise.resolve({ error: "Something broke." }), {
      success: "Should not show",
    });
    expect(result).toEqual({ error: "Something broke." });
    expect(calls).toEqual([{ type: "error", message: "Something broke." }]);
  });

  it("shows a success toast when a success message is provided and the action succeeds", async () => {
    const result = await runAction(Promise.resolve({ success: true as const }), {
      success: "It worked.",
    });
    expect(result).toEqual({ success: true });
    expect(calls).toEqual([{ type: "success", message: "It worked." }]);
  });

  it("shows no toast when the action succeeds and no success message is given", async () => {
    const result = await runAction(Promise.resolve({ success: true as const }));
    expect(result).toEqual({ success: true });
    expect(calls).toEqual([]);
  });

  it("passes through extra fields on a successful result unchanged", async () => {
    const result = await runAction(Promise.resolve({ success: true as const, slug: "my-event" }), {
      success: "Event created.",
    });
    expect(result).toEqual({ success: true, slug: "my-event" });
    expect(calls).toEqual([{ type: "success", message: "Event created." }]);
  });
});
```

- [ ] **Step 5: Run it to verify it fails**

Run: `bun test src/lib/toast-action.test.ts`
Expected: FAIL — `src/lib/toast-action.ts` doesn't exist yet.

- [ ] **Step 6: Implement `runAction`**

`src/lib/toast-action.ts`:

```ts
"use client";

import { toast } from "sonner";

export async function runAction<T>(
  promise: Promise<T>,
  options: { success?: string } = {}
): Promise<T> {
  const result = await promise;
  if (
    result &&
    typeof result === "object" &&
    "error" in result &&
    typeof (result as { error: unknown }).error === "string"
  ) {
    toast.error((result as { error: string }).error);
  } else if (options.success) {
    toast.success(options.success);
  }
  return result;
}
```

- [ ] **Step 7: Run it to verify it passes**

Run: `bun test src/lib/toast-action.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 8: Run the full suite**

Run: `bun test --isolate`
Expected: all PASS.

- [ ] **Step 9: Commit**

```bash
git add package.json bun.lock src/components/ui/sonner.tsx src/app/layout.tsx src/lib/toast-action.ts src/lib/toast-action.test.ts
git commit -m "$(cat <<'EOF'
Add sonner-based toast infrastructure and the runAction wrapper

Every server action in this app already returns the same
{error: string} | {success: true, ...} shape, so one generic wrapper
can add toast feedback to any call site without per-action logic.

Author: Claude Code <noreply@anthropic.com>
EOF
)"
```

---

### Task 2: Fix "Recently Added" — `ListingRow` has no link

**Files:**
- Modify: `src/components/shell/listing-card.tsx`
- Modify: `src/components/shell/listing-card.test.tsx`
- Modify: `src/components/shell/home-content.tsx`

**Interfaces:**
- Consumes: nothing new.
- Produces: `ListingRow({ data, href? }): JSX.Element` — `href` is optional and additive, so no other caller of `ListingRow` breaks.

- [ ] **Step 1: Write the failing tests**

Append to `src/components/shell/listing-card.test.tsx` (keep the existing `formatPriceRange` tests):

```tsx
import { describe, expect, test } from "bun:test";
import { render, screen } from "@testing-library/react";
import { formatPriceRange, ListingRow } from "@/components/shell/listing-card";

describe("formatPriceRange", () => {
  test("formats VND with no dollar sign", () => {
    expect(formatPriceRange(1_000_000, 5_000_000, "VND")).toBe("1,000,000 - 5,000,000 VND");
  });

  test("formats USD with a dollar sign", () => {
    expect(formatPriceRange(1500, 5200, "USD")).toBe("$ 1,500 - 5,200");
  });

  test("defaults to USD when currency is omitted", () => {
    expect(formatPriceRange(100, 200)).toBe("$ 100 - 200");
  });
});

const sampleData = {
  id: "pkg-1",
  title: "A$AP Rocky",
  category: "Solo Singer",
  priceMin: 5_000_000,
  priceMax: 10_000_000,
  currency: "VND" as const,
};

describe("ListingRow", () => {
  test("renders as a link when href is provided", () => {
    render(<ListingRow data={sampleData} href="/organizer/talents/asap-rocky" />);
    const link = screen.getByRole("link", { name: /A\$AP Rocky/ });
    expect(link).toHaveAttribute("href", "/organizer/talents/asap-rocky");
  });

  test("renders as a plain div (no link) when href is omitted", () => {
    render(<ListingRow data={sampleData} />);
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    expect(screen.getByText("A$AP Rocky")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `bun test src/components/shell/listing-card.test.tsx --isolate`
Expected: FAIL — `ListingRow` doesn't accept an `href` prop yet and never renders a link.

- [ ] **Step 3: Add href support to ListingRow**

Modify `src/components/shell/listing-card.tsx` — replace the `ListingRow` function (find it by its current signature `export function ListingRow({ data }: { data: ListingCardData })`):

```tsx
export function ListingRow({ data, href }: { data: ListingCardData; href?: string }) {
  const content = (
    <>
      <ImagePlaceholder className="size-[52px] shrink-0 rounded-[6px]" />
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-sm font-medium text-foreground">{data.title}</span>
        <span className="truncate text-xs text-muted-foreground">{data.category}</span>
      </div>
      <span className="shrink-0 text-sm font-semibold text-foreground">
        {data.currency === "VND"
          ? `${data.priceMin.toLocaleString("en-US")}+ VND`
          : `$${data.priceMin.toLocaleString()}+`}
      </span>
    </>
  );

  const className = "flex h-[76px] w-full items-center gap-4 rounded-md bg-white/5 px-3";

  if (href) {
    return (
      <Link href={href} className={className}>
        {content}
      </Link>
    );
  }

  return <div className={className}>{content}</div>;
}
```

(`Link` from `next/link` is already imported at the top of this file — no new import needed.)

- [ ] **Step 4: Pass href from the Recently Added section**

Modify `src/components/shell/home-content.tsx` — the `recent.map(...)` line:

```tsx
recent.map((pkg) => (
  <ListingRow key={pkg.id} data={toCardData(pkg)} href={`/${role}/talents/${pkg.talent_slug}`} />
))
```

(Matches how `ListingCard` builds its `href` two lines above in the same file.)

- [ ] **Step 5: Run it to verify it passes**

Run: `bun test src/components/shell/listing-card.test.tsx --isolate`
Expected: PASS (5 tests).

- [ ] **Step 6: Typecheck and full suite**

Run: `bunx tsc --noEmit` — expect clean.
Run: `bun test --isolate` — expect all PASS.

- [ ] **Step 7: Commit**

```bash
git add src/components/shell/listing-card.tsx src/components/shell/listing-card.test.tsx src/components/shell/home-content.tsx
git commit -m "$(cat <<'EOF'
Make Recently Added list items clickable

ListingRow never accepted an href or rendered a Link — it was a plain
div. ListingCard (Most Popular/Editor Choice) already had this.

Author: Claude Code <noreply@anthropic.com>
EOF
)"
```

---

### Task 3: Retrofit auth flows (sign-in, sign-up, forgot-password)

**Files:**
- Modify: `src/app/(auth)/sign-in/page.tsx`
- Test: `src/app/(auth)/sign-in/page.test.tsx`
- Modify: `src/app/(auth)/sign-up/page.tsx`
- Test: `src/app/(auth)/sign-up/page.test.tsx`
- Modify: `src/app/(auth)/forgot-password/page.tsx`
- Test: `src/app/(auth)/forgot-password/page.test.tsx`

**Interfaces:**
- Consumes: `runAction` from `@/lib/toast-action` (Task 1).

- [ ] **Step 1: Write the failing test for sign-in**

`src/app/(auth)/sign-in/page.test.tsx`:

```tsx
import { afterEach, describe, expect, it, mock } from "bun:test";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

const toastCalls: { type: "error" | "success"; message: string }[] = [];
mock.module("sonner", () => ({
  toast: {
    error: (message: string) => toastCalls.push({ type: "error", message }),
    success: (message: string) => toastCalls.push({ type: "success", message }),
  },
}));
mock.module("@/lib/supabase/actions", () => ({
  signIn: async () => ({ error: "Invalid email or password." }),
}));
mock.module("@/lib/supabase/client", () => ({
  createClient: () => ({ auth: { signInWithOAuth: async () => ({ error: null }) } }),
}));

import SignInPage from "@/app/(auth)/sign-in/page";

afterEach(() => {
  cleanup();
  toastCalls.length = 0;
});

describe("SignInPage", () => {
  it("shows an error toast when sign-in fails", async () => {
    render(<SignInPage />);
    fireEvent.change(screen.getByPlaceholderText("test@gmail.com"), { target: { value: "a@b.com" } });
    fireEvent.click(screen.getByRole("button", { name: /^sign in$/i }));
    await screen.findByText("Invalid email or password.");
    expect(toastCalls).toContainEqual({ type: "error", message: "Invalid email or password." });
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `bun test "src/app/(auth)/sign-in/page.test.tsx" --isolate`
Expected: FAIL — `signIn`'s result isn't passed through `runAction`, so no toast fires.

- [ ] **Step 3: Wrap the sign-in call**

Modify `src/app/(auth)/sign-in/page.tsx`:

```tsx
import { runAction } from "@/lib/toast-action";
import { signIn } from "@/lib/supabase/actions";
```

```tsx
  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(undefined);
    setPending(true);
    const result = await runAction(signIn(new FormData(e.currentTarget)));
    setPending(false);
    if (result?.error) setError(result.error);
  }
```

(No success message: `signIn` redirects on success, so a resolved value only ever happens on the error path. The inline `PasswordField`'s `error={error}` stays — it's field-level, richer than the toast.)

- [ ] **Step 4: Run it to verify it passes**

Run: `bun test "src/app/(auth)/sign-in/page.test.tsx" --isolate`
Expected: PASS.

- [ ] **Step 5: Write the failing test for sign-up**

`src/app/(auth)/sign-up/page.test.tsx`:

```tsx
import { afterEach, describe, expect, it, mock } from "bun:test";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

const toastCalls: { type: "error" | "success"; message: string }[] = [];
mock.module("sonner", () => ({
  toast: {
    error: (message: string) => toastCalls.push({ type: "error", message }),
    success: (message: string) => toastCalls.push({ type: "success", message }),
  },
}));
mock.module("@/lib/supabase/actions", () => ({
  signUp: async () => ({ success: true as const }),
  resendSignUpEmail: async () => ({ success: true as const }),
}));

import SignUpPage from "@/app/(auth)/sign-up/page";

afterEach(() => {
  cleanup();
  toastCalls.length = 0;
});

describe("SignUpPage", () => {
  it("shows a success toast when sign-up succeeds", async () => {
    render(<SignUpPage />);
    fireEvent.click(screen.getByRole("button", { name: /next step/i }));
    fireEvent.change(screen.getByPlaceholderText("Organizer Test"), { target: { value: "Test User" } });
    fireEvent.change(screen.getByPlaceholderText("test@gmail.com"), { target: { value: "a@b.com" } });
    fireEvent.change(screen.getByPlaceholderText("••••••••••"), { target: { value: "password123" } });
    fireEvent.click(screen.getByRole("button", { name: /^sign up$/i }));
    await screen.findByText("Verify your Email");
    expect(toastCalls).toContainEqual({
      type: "success",
      message: "Account created — check your email to confirm.",
    });
  });
});
```

- [ ] **Step 6: Run it to verify it fails**

Run: `bun test "src/app/(auth)/sign-up/page.test.tsx" --isolate`
Expected: FAIL — no toast fires today.

- [ ] **Step 7: Wrap both sign-up calls**

Modify `src/app/(auth)/sign-up/page.tsx`:

```tsx
import { runAction } from "@/lib/toast-action";
```

```tsx
      const result = await runAction(signUp(formData), {
        success: "Account created — check your email to confirm.",
      });
```

```tsx
          onClick={async () => {
            const result = await runAction(resendSignUpEmail(email), {
              success: "Confirmation email resent.",
            });
            if (!("error" in result)) setResent(true);
          }}
```

- [ ] **Step 8: Run it to verify it passes**

Run: `bun test "src/app/(auth)/sign-up/page.test.tsx" --isolate`
Expected: PASS.

- [ ] **Step 9: Write the failing test for forgot-password**

`src/app/(auth)/forgot-password/page.test.tsx`:

```tsx
import { afterEach, describe, expect, it, mock } from "bun:test";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

const toastCalls: { type: "error" | "success"; message: string }[] = [];
mock.module("sonner", () => ({
  toast: {
    error: (message: string) => toastCalls.push({ type: "error", message }),
    success: (message: string) => toastCalls.push({ type: "success", message }),
  },
}));
mock.module("@/lib/supabase/actions", () => ({
  requestPasswordReset: async () => ({ success: true as const }),
  updatePassword: async () => ({ success: true as const }),
}));

import ForgotPasswordPage from "@/app/(auth)/forgot-password/page";

afterEach(() => {
  cleanup();
  toastCalls.length = 0;
});

describe("ForgotPasswordPage", () => {
  it("shows a success toast when a reset link is requested", async () => {
    render(<ForgotPasswordPage />);
    fireEvent.change(screen.getByPlaceholderText("test@gmail.com"), { target: { value: "a@b.com" } });
    fireEvent.click(screen.getByRole("button", { name: /reset password/i }));
    await screen.findByText("Check your Email");
    expect(toastCalls).toContainEqual({ type: "success", message: "Reset link sent." });
  });
});
```

- [ ] **Step 10: Run it to verify it fails**

Run: `bun test "src/app/(auth)/forgot-password/page.test.tsx" --isolate`
Expected: FAIL.

- [ ] **Step 11: Wrap both forgot-password calls**

Modify `src/app/(auth)/forgot-password/page.tsx`:

```tsx
import { runAction } from "@/lib/toast-action";
```

```tsx
      const result = await runAction(requestPasswordReset(new FormData(e.currentTarget)), {
        success: "Reset link sent.",
      });
```

```tsx
      const result = await runAction(updatePassword(new FormData(e.currentTarget)), {
        success: "Password updated.",
      });
```

- [ ] **Step 12: Run it to verify it passes**

Run: `bun test "src/app/(auth)/forgot-password/page.test.tsx" --isolate`
Expected: PASS.

- [ ] **Step 13: Full suite + typecheck**

Run: `bunx tsc --noEmit` — expect clean.
Run: `bun test --isolate` — expect all PASS.

- [ ] **Step 14: Commit**

```bash
git add "src/app/(auth)/sign-in/page.tsx" "src/app/(auth)/sign-in/page.test.tsx" "src/app/(auth)/sign-up/page.tsx" "src/app/(auth)/sign-up/page.test.tsx" "src/app/(auth)/forgot-password/page.tsx" "src/app/(auth)/forgot-password/page.test.tsx"
git commit -m "$(cat <<'EOF'
Add toast feedback to sign-in, sign-up, and forgot-password flows

Author: Claude Code <noreply@anthropic.com>
EOF
)"
```

---

### Task 4: Retrofit Account/Profile (profile-content, applications, orders, packages, quotations)

**Files:**
- Modify: `src/components/account/profile-content.tsx`
- Modify: `src/components/account/profile-content.test.tsx` (already exists — add cases, don't replace)
- Modify: `src/components/account/event-applications-panel.tsx`
- Test: `src/components/account/event-applications-panel.test.tsx`
- Modify: `src/components/account/orders-content.tsx`
- Test: `src/components/account/orders-content.test.tsx`
- Modify: `src/components/account/packages-content.tsx`
- Test: `src/components/account/packages-content.test.tsx`
- Modify: `src/components/account/quotations-content.tsx`
- Test: `src/components/account/quotations-content.test.tsx`

**Interfaces:**
- Consumes: `runAction` from `@/lib/toast-action` (Task 1).

- [ ] **Step 1: Write the failing test (appended to the existing profile-content.test.tsx)**

Append to `src/components/account/profile-content.test.tsx` — add the `sonner` mock alongside the existing mocks at the top of the file (all `mock.module` calls must stay before the imports they affect):

```tsx
const toastCalls: { type: "error" | "success"; message: string }[] = [];
mock.module("sonner", () => ({
  toast: {
    error: (message: string) => toastCalls.push({ type: "error", message }),
    success: (message: string) => toastCalls.push({ type: "success", message }),
  },
}));
```

Add a new `afterEach` reset (or extend the existing one) so `toastCalls` clears between tests:

```tsx
afterEach(() => {
  cleanup();
  toastCalls.length = 0;
});
```

New test block:

```tsx
describe("ProfileContent — toasts", () => {
  it("shows a success toast when Save changes succeeds", async () => {
    render(<ProfileContent role="talent" profile={makeProfile()} />);
    fireEvent.click(screen.getByRole("button", { name: /save changes/i }));
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(toastCalls).toContainEqual({ type: "success", message: "Profile updated." });
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `bun test src/components/account/profile-content.test.tsx --isolate`
Expected: FAIL — no toast fires yet, `handleSubmit` doesn't call `runAction`.

- [ ] **Step 3: Rewrite profile-content.tsx's state/handlers to use runAction and drop redundant inline error/saved text**

Modify `src/components/account/profile-content.tsx`. Add the import:

```tsx
import { runAction } from "@/lib/toast-action";
```

Remove these four state declarations (they only ever held the same string the action already returns, now shown via toast instead):

```tsx
  const [error, setError] = useState<string | undefined>();
  const [saved, setSaved] = useState(false);
```

```tsx
  const [avatarError, setAvatarError] = useState<string | undefined>();
```

```tsx
  const [coverError, setCoverError] = useState<string | undefined>();
```

```tsx
  const [galleryError, setGalleryError] = useState<string | undefined>();
```

Replace each handler's body:

```tsx
  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarPending(true);
    const formData = new FormData();
    formData.set("avatar", file);
    const result = await runAction(uploadAvatar(formData), { success: "Avatar updated." });
    setAvatarPending(false);
    if (!("error" in result)) {
      setAvatarUrl(result.url);
      router.refresh();
    }
    e.target.value = "";
  }

  async function handleCoverChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setCoverPending(true);
    const formData = new FormData();
    formData.set("cover", file);
    const result = await runAction(uploadCover(formData), { success: "Cover updated." });
    setCoverPending(false);
    if (!("error" in result)) {
      setCoverUrl(result.url);
      router.refresh();
    }
    e.target.value = "";
  }

  async function handleGalleryChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setGalleryPending(true);
    const formData = new FormData();
    formData.set("image", file);
    const result = await runAction(uploadGalleryImage(formData), { success: "Image uploaded." });
    setGalleryPending(false);
    if (!("error" in result)) {
      setGallery((g) => [...g, result.url]);
      router.refresh();
    }
    e.target.value = "";
  }

  async function handleRemoveGalleryImage(url: string) {
    setGalleryPending(true);
    const formData = new FormData();
    formData.set("url", url);
    const result = await runAction(removeGalleryImage(formData), { success: "Image removed." });
    setGalleryPending(false);
    if (!("error" in result)) {
      setGallery((g) => g.filter((u) => u !== url));
      router.refresh();
    }
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    const formData = new FormData(e.currentTarget);
    formData.set("keywords", JSON.stringify(keywords));
    formData.set("socialLinks", JSON.stringify(socialLinks));
    formData.set("achievements", JSON.stringify(achievements));
    formData.set("services", JSON.stringify(services));
    await runAction(updateProfile(formData), { success: "Profile updated." });
    setPending(false);
  }
```

Remove the now-dead inline error/saved JSX at the top of the form:

```tsx
        {error && <span className="text-sm text-destructive">{error}</span>}
        {saved && !error && <span className="text-sm text-muted-foreground">Saved.</span>}
```

Simplify the avatar/cover status line (was a 4-deep ternary chaining `avatarError`/`coverError`, both now gone):

```tsx
            <span className="text-sm text-muted-foreground">
              {avatarPending
                ? "Uploading..."
                : coverPending
                  ? "Uploading cover..."
                  : "Manage your profile information, password and more"}
            </span>
```

Remove the now-dead inline gallery error line:

```tsx
          {galleryError && <span className="text-xs text-destructive">{galleryError}</span>}
```

- [ ] **Step 4: Run it to verify it passes**

Run: `bun test src/components/account/profile-content.test.tsx --isolate`
Expected: PASS (previous 8 tests + 1 new = 9).

- [ ] **Step 5: Write the failing test for event-applications-panel**

`src/components/account/event-applications-panel.test.tsx`:

```tsx
import { afterEach, describe, expect, it, mock } from "bun:test";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

const toastCalls: { type: "error" | "success"; message: string }[] = [];
mock.module("sonner", () => ({
  toast: {
    error: (message: string) => toastCalls.push({ type: "error", message }),
    success: (message: string) => toastCalls.push({ type: "success", message }),
  },
}));
mock.module("next/navigation", () => ({ useRouter: () => ({ refresh: () => {} }) }));
mock.module("@/lib/supabase/event-actions", () => ({
  acceptApplication: async () => ({ success: true as const }),
  rejectApplication: async () => ({ success: true as const }),
}));

import { EventApplicationsPanel } from "@/components/account/event-applications-panel";
import type { EventApplicationWithDetails } from "@/lib/supabase/types";

afterEach(() => {
  cleanup();
  toastCalls.length = 0;
});

function makeApplication(overrides: Partial<EventApplicationWithDetails> = {}): EventApplicationWithDetails {
  return {
    id: "app-1",
    slot_id: "slot-1",
    applicant_profile_id: "talent-1",
    offer_amount_usd: null,
    status: "pending",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    slot_category: "Solo Singer",
    slot_price_usd: 500,
    event_id: "event-1",
    event_name: "Test Event",
    event_date: "2026-12-01",
    applicant_name: "Test Talent",
    ...overrides,
  };
}

describe("EventApplicationsPanel — toasts", () => {
  it("shows a success toast when an application is accepted", async () => {
    render(<EventApplicationsPanel applications={[makeApplication()]} />);
    fireEvent.click(screen.getByRole("button", { name: /application/i }));
    fireEvent.click(screen.getByRole("button", { name: /^accept$/i }));
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(toastCalls).toContainEqual({ type: "success", message: "Application accepted." });
  });
});
```

- [ ] **Step 6: Run it to verify it fails**

Run: `bun test src/components/account/event-applications-panel.test.tsx --isolate`
Expected: FAIL.

- [ ] **Step 7: Wrap the accept/reject call**

Modify `src/components/account/event-applications-panel.tsx`:

```tsx
import { runAction } from "@/lib/toast-action";
```

```tsx
  async function handle(action: "accept" | "reject", id: string) {
    setError(undefined);
    setPendingId(id);
    const result = await runAction(action === "accept" ? acceptApplication(id) : rejectApplication(id), {
      success: action === "accept" ? "Application accepted." : "Application rejected.",
    });
    setPendingId(undefined);
    if ("error" in result) {
      setError(result.error);
      return;
    }
    router.refresh();
  }
```

- [ ] **Step 8: Run it to verify it passes**

Run: `bun test src/components/account/event-applications-panel.test.tsx --isolate`
Expected: PASS.

- [ ] **Step 9: Write the failing test for orders-content**

`src/components/account/orders-content.test.tsx`:

```tsx
import { afterEach, describe, expect, it, mock } from "bun:test";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

const toastCalls: { type: "error" | "success"; message: string }[] = [];
mock.module("sonner", () => ({
  toast: {
    error: (message: string) => toastCalls.push({ type: "error", message }),
    success: (message: string) => toastCalls.push({ type: "success", message }),
  },
}));
mock.module("next/navigation", () => ({ useRouter: () => ({ refresh: () => {} }) }));
mock.module("@/lib/supabase/package-actions", () => ({
  acceptBooking: async () => ({ success: true as const }),
  rejectBooking: async () => ({ success: true as const }),
}));

import { OrdersContent } from "@/components/account/orders-content";
import type { BookingWithNames } from "@/lib/supabase/types";

afterEach(() => {
  cleanup();
  toastCalls.length = 0;
});

function makeBooking(overrides: Partial<BookingWithNames> = {}): BookingWithNames {
  return {
    id: "booking-1",
    package_id: "pkg-1",
    organizer_id: "org-1",
    price_vnd: 5_000_000,
    booked_date: "2026-12-01",
    booked_time: "20:00",
    payment_method: "Prepaid",
    status: "pending",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    package_title: "Acoustic Set",
    organizer_name: "Test Organizer",
    talent_name: "Test Talent",
    ...overrides,
  };
}

describe("OrdersContent — toasts", () => {
  it("shows a success toast when a booking is accepted", async () => {
    render(<OrdersContent role="talent" bookings={[makeBooking()]} />);
    fireEvent.click(screen.getByRole("button", { name: /^accept$/i }));
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(toastCalls).toContainEqual({ type: "success", message: "Booking accepted." });
  });
});
```

- [ ] **Step 10: Run it to verify it fails**

Run: `bun test src/components/account/orders-content.test.tsx --isolate`
Expected: FAIL.

- [ ] **Step 11: Wrap the accept/reject call**

Modify `src/components/account/orders-content.tsx`:

```tsx
import { runAction } from "@/lib/toast-action";
```

```tsx
  async function handle(action: "accept" | "reject", id: string) {
    setError(undefined);
    setPendingId(id);
    const result = await runAction(action === "accept" ? acceptBooking(id) : rejectBooking(id), {
      success: action === "accept" ? "Booking accepted." : "Booking rejected.",
    });
    setPendingId(undefined);
    if ("error" in result) {
      setError(result.error);
      return;
    }
    router.refresh();
  }
```

- [ ] **Step 12: Run it to verify it passes**

Run: `bun test src/components/account/orders-content.test.tsx --isolate`
Expected: PASS.

- [ ] **Step 13: Write the failing test for packages-content**

`src/components/account/packages-content.test.tsx`:

```tsx
import { afterEach, describe, expect, it, mock } from "bun:test";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

const toastCalls: { type: "error" | "success"; message: string }[] = [];
mock.module("sonner", () => ({
  toast: {
    error: (message: string) => toastCalls.push({ type: "error", message }),
    success: (message: string) => toastCalls.push({ type: "success", message }),
  },
}));
mock.module("next/navigation", () => ({ useRouter: () => ({ refresh: () => {} }) }));
mock.module("@/lib/supabase/package-actions", () => ({
  deletePackage: async () => ({ success: true as const }),
}));

import { PackagesContent } from "@/components/account/packages-content";
import type { PackageRow } from "@/lib/supabase/types";

afterEach(() => {
  cleanup();
  toastCalls.length = 0;
  (globalThis as { confirm?: () => boolean }).confirm = () => true;
});

function makePackage(overrides: Partial<PackageRow & { bookingCount: number }> = {}): PackageRow & {
  bookingCount: number;
} {
  return {
    id: "pkg-1",
    talent_id: "talent-1",
    category: "Solo Singer",
    sub_category: "Rapper",
    title: "Acoustic Set",
    residency: null,
    location: "Ho Chi Minh City",
    repeat_on: false,
    repeat_days: null,
    start_date: "2026-12-01",
    end_date: "2026-12-01",
    start_time: "20:00",
    end_time: "22:00",
    description: null,
    price_min_vnd: 5_000_000,
    price_max_vnd: 10_000_000,
    payment_method: "Prepaid",
    status: "active",
    is_most_popular: false,
    is_editor_choice: false,
    created_at: new Date().toISOString(),
    bookingCount: 0,
    ...overrides,
  };
}

describe("PackagesContent — toasts", () => {
  it("shows a success toast when a package is deleted", async () => {
    (globalThis as { confirm?: () => boolean }).confirm = () => true;
    render(<PackagesContent role="talent" packages={[makePackage()]} />);
    fireEvent.click(screen.getByRole("button", { name: /delete/i }));
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(toastCalls).toContainEqual({ type: "success", message: "Package deleted." });
  });
});
```

- [ ] **Step 14: Run it to verify it fails**

Run: `bun test src/components/account/packages-content.test.tsx --isolate`
Expected: FAIL.

- [ ] **Step 15: Wrap the delete call**

Modify `src/components/account/packages-content.tsx`:

```tsx
import { runAction } from "@/lib/toast-action";
```

```tsx
  async function handleDelete(id: string) {
    if (!confirm("Delete this package? This can't be undone.")) return;
    setDeleteError(null);
    setDeletingId(id);
    const result = await runAction(deletePackage(id), { success: "Package deleted." });
    setDeletingId(null);
    if ("error" in result) {
      setDeleteError(result.error);
      return;
    }
    router.refresh();
  }
```

- [ ] **Step 16: Run it to verify it passes**

Run: `bun test src/components/account/packages-content.test.tsx --isolate`
Expected: PASS.

- [ ] **Step 17: Write the failing test for quotations-content**

`src/components/account/quotations-content.test.tsx`:

```tsx
import { afterEach, describe, expect, it, mock } from "bun:test";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

const toastCalls: { type: "error" | "success"; message: string }[] = [];
mock.module("sonner", () => ({
  toast: {
    error: (message: string) => toastCalls.push({ type: "error", message }),
    success: (message: string) => toastCalls.push({ type: "success", message }),
  },
}));
mock.module("next/navigation", () => ({ useRouter: () => ({ refresh: () => {} }) }));
mock.module("@/lib/supabase/quotation-actions", () => ({
  acceptQuotation: async () => ({ success: true as const }),
  declineQuotation: async () => ({ success: true as const }),
  rejectQuotation: async () => ({ success: true as const }),
  respondToQuotation: async () => ({ success: true as const }),
}));

import { QuotationsContent } from "@/components/account/quotations-content";
import type { QuotationWithNames } from "@/lib/supabase/types";

afterEach(() => {
  cleanup();
  toastCalls.length = 0;
});

function makeQuotation(overrides: Partial<QuotationWithNames> = {}): QuotationWithNames {
  return {
    id: "quote-1",
    organizer_id: "org-1",
    talent_id: "talent-1",
    event_name: "Wedding",
    event_date: "2026-12-01",
    venue: "Riverside Palace",
    description: null,
    budget_min_vnd: null,
    budget_max_vnd: null,
    status: "quoted",
    quoted_price_vnd: 10_000_000,
    talent_note: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    organizer_name: "Test Organizer",
    talent_name: "Test Talent",
    ...overrides,
  };
}

describe("QuotationsContent — toasts", () => {
  it("shows a success toast when an organizer accepts a quote", async () => {
    render(<QuotationsContent role="organizer" quotations={[makeQuotation()]} />);
    fireEvent.click(screen.getByRole("button", { name: /^accept$/i }));
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(toastCalls).toContainEqual({ type: "success", message: "Quotation accepted." });
  });
});
```

- [ ] **Step 18: Run it to verify it fails**

Run: `bun test src/components/account/quotations-content.test.tsx --isolate`
Expected: FAIL.

- [ ] **Step 19: Wrap the quotation calls**

Modify `src/components/account/quotations-content.tsx`:

```tsx
import { runAction } from "@/lib/toast-action";
```

```tsx
  async function handle(
    action: () => Promise<{ error: string } | { success: true }>,
    id: string,
    successMessage: string
  ) {
    setError(undefined);
    setPendingId(id);
    const result = await runAction(action(), { success: successMessage });
    setPendingId(undefined);
    if ("error" in result) {
      setError(result.error);
      return;
    }
    router.refresh();
  }
```

Update the three `handle(...)` call sites to pass the new third argument:

```tsx
                      onClick={() => handle(() => declineQuotation(q.id), q.id, "Quotation declined.")}
```

```tsx
                      onClick={() => handle(() => rejectQuotation(q.id), q.id, "Quotation rejected.")}
```

```tsx
                      onClick={() => handle(() => acceptQuotation(q.id), q.id, "Quotation accepted.")}
```

And in `RespondDialog`'s `handleSubmit`:

```tsx
    const result = await runAction(respondToQuotation(formData), { success: "Quote sent." });
```

- [ ] **Step 20: Run it to verify it passes**

Run: `bun test src/components/account/quotations-content.test.tsx --isolate`
Expected: PASS.

- [ ] **Step 21: Full suite + typecheck**

Run: `bunx tsc --noEmit` — expect clean.
Run: `bun test --isolate` — expect all PASS.

- [ ] **Step 22: Commit**

```bash
git add src/components/account/profile-content.tsx src/components/account/profile-content.test.tsx src/components/account/event-applications-panel.tsx src/components/account/event-applications-panel.test.tsx src/components/account/orders-content.tsx src/components/account/orders-content.test.tsx src/components/account/packages-content.tsx src/components/account/packages-content.test.tsx src/components/account/quotations-content.tsx src/components/account/quotations-content.test.tsx
git commit -m "$(cat <<'EOF'
Add toast feedback to My Account: profile, applications, orders,
packages, quotations

profile-content.tsx also drops its redundant inline error/"Saved."
text now that the toast carries that signal, simplifying its status
line from a 4-deep ternary to 2.

Author: Claude Code <noreply@anthropic.com>
EOF
)"
```

---

### Task 5: Retrofit events & packages (create event, apply to slot, create/update package)

**Files:**
- Modify: `src/app/organizer/create/page.tsx`
- Test: `src/app/organizer/create/page.test.tsx`
- Modify: `src/components/event-detail/apply-dialog.tsx`
- Test: `src/components/event-detail/apply-dialog.test.tsx`
- Modify: `src/components/create-package/create-package-dialog.tsx`
- Test: `src/components/create-package/create-package-dialog.test.tsx`

**Interfaces:**
- Consumes: `runAction` from `@/lib/toast-action` (Task 1).

- [ ] **Step 1: Write the failing test for create-event**

`src/app/organizer/create/page.test.tsx`:

```tsx
import { afterEach, describe, expect, it, mock } from "bun:test";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

const toastCalls: { type: "error" | "success"; message: string }[] = [];
mock.module("sonner", () => ({
  toast: {
    error: (message: string) => toastCalls.push({ type: "error", message }),
    success: (message: string) => toastCalls.push({ type: "success", message }),
  },
}));
mock.module("@/lib/supabase/event-actions", () => ({
  createEvent: async () => ({ success: true as const, slug: "test-event" }),
}));

import CreateEventPage from "@/app/organizer/create/page";

afterEach(() => {
  cleanup();
  toastCalls.length = 0;
});

describe("CreateEventPage — toasts", () => {
  it("shows a success toast when the event is created", async () => {
    render(<CreateEventPage />);

    // Step 1: "Event Details" — Event Name/Date/Time/Venue are required.
    fireEvent.change(screen.getByPlaceholderText("Summer Music Festival"), {
      target: { value: "Test Event" },
    });
    fireEvent.change(screen.getByLabelText("Date"), { target: { value: "2026-12-01" } });
    fireEvent.change(screen.getByLabelText("Time"), { target: { value: "20:00" } });
    fireEvent.change(screen.getByPlaceholderText("ABC Dance Zone, HCMC"), {
      target: { value: "Test Venue" },
    });
    fireEvent.click(screen.getByRole("button", { name: /next step/i }));

    // Step 2: "Add Photos" — nothing required.
    fireEvent.click(screen.getByRole("button", { name: /next step/i }));

    // Step 3: "Review & Budget" — Budget Min/Max and the one default talent
    // slot's Category/Price/Needed are all required.
    fireEvent.change(screen.getByPlaceholderText("10,000,000"), { target: { value: "10000000" } });
    fireEvent.change(screen.getByPlaceholderText("50,000,000"), { target: { value: "50000000" } });
    fireEvent.change(screen.getByLabelText("Category"), { target: { value: "Solo Singer" } });
    fireEvent.change(screen.getByLabelText("Price per Talent (USD)"), { target: { value: "500" } });
    fireEvent.change(screen.getByLabelText("Needed"), { target: { value: "1" } });
    fireEvent.click(screen.getByRole("button", { name: /create event/i }));

    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(toastCalls).toContainEqual({ type: "success", message: "Event created." });
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `bun test src/app/organizer/create/page.test.tsx --isolate`
Expected: FAIL — no toast fires yet.

- [ ] **Step 3: Wrap the createEvent call**

Modify `src/app/organizer/create/page.tsx`:

```tsx
import { runAction } from "@/lib/toast-action";
```

```tsx
    const result = await runAction(createEvent(formData), { success: "Event created." });
    setPending(false);
    if ("error" in result) {
      setError(result.error);
      return;
    }
    setDone(true);
```

- [ ] **Step 4: Run it to verify it passes**

Run: `bun test src/app/organizer/create/page.test.tsx --isolate`
Expected: PASS.

- [ ] **Step 5: Write the failing test for apply-dialog**

`src/components/event-detail/apply-dialog.test.tsx`:

```tsx
import { afterEach, describe, expect, it, mock } from "bun:test";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

const toastCalls: { type: "error" | "success"; message: string }[] = [];
mock.module("sonner", () => ({
  toast: {
    error: (message: string) => toastCalls.push({ type: "error", message }),
    success: (message: string) => toastCalls.push({ type: "success", message }),
  },
}));
mock.module("@/lib/supabase/event-actions", () => ({
  applyToSlot: async () => ({ success: true as const }),
}));

import { ApplyDialog } from "@/components/event-detail/apply-dialog";
import type { EventSlotRow, EventWithSlots } from "@/lib/supabase/types";

afterEach(() => {
  cleanup();
  toastCalls.length = 0;
});

const slot: EventSlotRow = {
  id: "slot-1",
  event_id: "event-1",
  category: "Solo Singer",
  price_usd: 500,
  slot_type: "Fulltime",
  quantity_total: 1,
  created_at: new Date().toISOString(),
};

const event: EventWithSlots = {
  id: "event-1",
  organizer_id: "org-1",
  slug: "test-event",
  name: "Test Event",
  venue: "Test Venue",
  address: "123 Test St",
  event_date: "2026-12-01",
  start_time: "20:00",
  end_time: "22:00",
  tagline: null,
  description: null,
  budget_min_vnd: null,
  budget_max_vnd: null,
  contact_phone: null,
  expected_guests: null,
  special_requirements: null,
  status: "upcoming",
  created_at: new Date().toISOString(),
  slots: [slot],
  organizer: { full_name: "Test Organizer", location: null, bio: null, gallery_urls: [], social_links: [] },
};

describe("ApplyDialog — toasts", () => {
  it("shows a success toast when the application is submitted", async () => {
    render(
      <ApplyDialog event={event} slot={slot} role="talent" open onOpenChange={() => {}} />
    );
    fireEvent.click(screen.getByRole("button", { name: /apply/i }));
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(toastCalls).toContainEqual({ type: "success", message: "Application submitted." });
  });
});
```

(`role="talent"` is not agency, so `ApplyDialog` opens directly on the "confirm" step — no talent-selection step to click through first. That step renders exactly one button matching "apply" — text "Apply", or "Applying..." while pending.)

- [ ] **Step 6: Run it to verify it fails**

Run: `bun test src/components/event-detail/apply-dialog.test.tsx --isolate`
Expected: FAIL.

- [ ] **Step 7: Wrap the applyToSlot call**

Modify `src/components/event-detail/apply-dialog.tsx`:

```tsx
import { runAction } from "@/lib/toast-action";
```

```tsx
    const result = await runAction(applyToSlot(formData), { success: "Application submitted." });
    setPending(false);
    if ("error" in result) {
      setError(result.error);
      return;
    }
    setStep("success");
```

- [ ] **Step 8: Run it to verify it passes**

Run: `bun test src/components/event-detail/apply-dialog.test.tsx --isolate`
Expected: PASS.

- [ ] **Step 9: Write the failing test for create-package-dialog**

`src/components/create-package/create-package-dialog.test.tsx`:

```tsx
import { afterEach, describe, expect, it, mock } from "bun:test";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

const toastCalls: { type: "error" | "success"; message: string }[] = [];
mock.module("sonner", () => ({
  toast: {
    error: (message: string) => toastCalls.push({ type: "error", message }),
    success: (message: string) => toastCalls.push({ type: "success", message }),
  },
}));
mock.module("@/lib/supabase/package-actions", () => ({
  createPackage: async () => ({ success: true as const }),
  updatePackage: async () => ({ success: true as const }),
}));

import { CreatePackageDialog } from "@/components/create-package/create-package-dialog";

afterEach(() => {
  cleanup();
  toastCalls.length = 0;
});

describe("CreatePackageDialog — toasts", () => {
  it("shows a success toast when a package is created", async () => {
    render(<CreatePackageDialog role="talent" open onOpenChange={() => {}} />);
    // role="talent" is not agency, so the dialog opens directly on the
    // "form" step (see the isAgency ? "choose-talent" : "form" initial
    // state) — no talent-selection step to click through first.
    fireEvent.change(screen.getByLabelText("Title"), { target: { value: "Acoustic Set" } });
    fireEvent.change(screen.getByLabelText("Start Date"), { target: { value: "2026-12-01" } });
    fireEvent.change(screen.getByLabelText("End Date"), { target: { value: "2026-12-01" } });
    fireEvent.change(screen.getByLabelText("Start Time"), { target: { value: "20:00" } });
    fireEvent.change(screen.getByLabelText("End Time"), { target: { value: "22:00" } });
    fireEvent.change(screen.getByLabelText("Price Min"), { target: { value: "5000000" } });
    fireEvent.change(screen.getByLabelText("Price Max"), { target: { value: "10000000" } });
    fireEvent.click(screen.getByRole("button", { name: /create new package/i }));
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(toastCalls).toContainEqual({ type: "success", message: "Package created." });
  });
});
```

(Category/Sub-Category/Residency/Location selects have no `required` attribute in `SelectField`, so they're safe to leave at their default empty option for this test — only the fields marked `required` in the component need a value to let the form submit.)

- [ ] **Step 10: Run it to verify it fails**

Run: `bun test src/components/create-package/create-package-dialog.test.tsx --isolate`
Expected: FAIL once the test body is filled in.

- [ ] **Step 11: Wrap the create/update package call**

Modify `src/components/create-package/create-package-dialog.tsx`:

```tsx
import { runAction } from "@/lib/toast-action";
```

```tsx
    const result = isEditing
      ? await runAction(updatePackage(editingPackage.id, formData), { success: "Package updated." })
      : await runAction(createPackage(formData), { success: "Package created." });
    setPending(false);
    if ("error" in result) {
      setError(result.error);
      return;
    }
    setStep("success");
```

- [ ] **Step 12: Run it to verify it passes**

Run: `bun test src/components/create-package/create-package-dialog.test.tsx --isolate`
Expected: PASS.

- [ ] **Step 13: Full suite + typecheck**

Run: `bunx tsc --noEmit` — expect clean.
Run: `bun test --isolate` — expect all PASS.

- [ ] **Step 14: Commit**

```bash
git add src/app/organizer/create/page.tsx src/app/organizer/create/page.test.tsx src/components/event-detail/apply-dialog.tsx src/components/event-detail/apply-dialog.test.tsx src/components/create-package/create-package-dialog.tsx src/components/create-package/create-package-dialog.test.tsx
git commit -m "$(cat <<'EOF'
Add toast feedback to create-event, apply-to-slot, create/update package

Author: Claude Code <noreply@anthropic.com>
EOF
)"
```

---

### Task 6: Retrofit checkout, cart, booking, quote request

**Files:**
- Modify: `src/components/checkout/checkout-content.tsx`
- Test: `src/components/checkout/checkout-content.test.tsx`
- Modify: `src/components/shell/cart-button.tsx`
- Test: `src/components/shell/cart-button.test.tsx`
- Modify: `src/components/talent-detail/booking-panel.tsx`
- Test: `src/components/talent-detail/booking-panel.test.tsx`
- Modify: `src/components/talent-detail/request-quote-dialog.tsx`
- Test: `src/components/talent-detail/request-quote-dialog.test.tsx`

**Interfaces:**
- Consumes: `runAction` from `@/lib/toast-action` (Task 1).

- [ ] **Step 1: Write the failing test for checkout-content**

`src/components/checkout/checkout-content.test.tsx`:

```tsx
import { afterEach, describe, expect, it, mock } from "bun:test";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

const toastCalls: { type: "error" | "success"; message: string }[] = [];
mock.module("sonner", () => ({
  toast: {
    error: (message: string) => toastCalls.push({ type: "error", message }),
    success: (message: string) => toastCalls.push({ type: "success", message }),
  },
}));
mock.module("next/navigation", () => ({ useRouter: () => ({ refresh: () => {} }) }));
mock.module("@/lib/supabase/package-actions", () => ({
  checkoutCart: async () => ({ success: true as const }),
  removeFromCart: async () => ({ success: true as const }),
}));

import { CheckoutContent } from "@/components/checkout/checkout-content";
import type { CartItemWithPackage } from "@/lib/supabase/types";

afterEach(() => {
  cleanup();
  toastCalls.length = 0;
});

function makeCartItem(overrides: Partial<CartItemWithPackage> = {}): CartItemWithPackage {
  return {
    id: "cart-1",
    organizer_id: "org-1",
    package_id: "pkg-1",
    price_vnd: 5_000_000,
    booked_date: "2026-12-01",
    booked_time: "20:00",
    created_at: new Date().toISOString(),
    package: { id: "pkg-1", title: "Acoustic Set", location: "Ho Chi Minh City" },
    talent: { id: "talent-1", full_name: "Test Talent" },
    ...overrides,
  };
}

describe("CheckoutContent — toasts", () => {
  it("shows a success toast when checkout succeeds", async () => {
    render(<CheckoutContent cartItems={[makeCartItem()]} />);
    fireEvent.click(screen.getByRole("button", { name: /send booking request/i }));
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(toastCalls).toContainEqual({ type: "success", message: "Booking request sent." });
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `bun test src/components/checkout/checkout-content.test.tsx --isolate`
Expected: FAIL.

- [ ] **Step 3: Wrap both cart calls**

Modify `src/components/checkout/checkout-content.tsx`:

```tsx
import { runAction } from "@/lib/toast-action";
```

```tsx
  async function handleRemove(id: string) {
    const result = await runAction(removeFromCart(id), { success: "Removed from cart." });
    if ("error" in result) return;
    router.refresh();
  }
```

```tsx
    const result = await runAction(checkoutCart(formData), { success: "Booking request sent." });
    setPending(false);
    if ("error" in result) {
      setError(result.error);
      return;
    }
    setSent(true);
    router.refresh();
```

- [ ] **Step 4: Run it to verify it passes**

Run: `bun test src/components/checkout/checkout-content.test.tsx --isolate`
Expected: PASS.

- [ ] **Step 5: Write the failing test for cart-button**

`src/components/shell/cart-button.test.tsx`:

```tsx
import { afterEach, describe, expect, it, mock } from "bun:test";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

const toastCalls: { type: "error" | "success"; message: string }[] = [];
mock.module("sonner", () => ({
  toast: {
    error: (message: string) => toastCalls.push({ type: "error", message }),
    success: (message: string) => toastCalls.push({ type: "success", message }),
  },
}));
mock.module("next/navigation", () => ({ useRouter: () => ({ refresh: () => {} }) }));
mock.module("@/lib/supabase/package-actions", () => ({
  removeFromCart: async () => ({ success: true as const }),
}));

import { CartButton } from "@/components/shell/cart-button";
import type { CartItemWithPackage } from "@/lib/supabase/types";

afterEach(() => {
  cleanup();
  toastCalls.length = 0;
});

function makeCartItem(overrides: Partial<CartItemWithPackage> = {}): CartItemWithPackage {
  return {
    id: "cart-1",
    organizer_id: "org-1",
    package_id: "pkg-1",
    price_vnd: 5_000_000,
    booked_date: "2026-12-01",
    booked_time: "20:00",
    created_at: new Date().toISOString(),
    package: { id: "pkg-1", title: "Acoustic Set", location: "Ho Chi Minh City" },
    talent: { id: "talent-1", full_name: "Test Talent" },
    ...overrides,
  };
}

describe("CartButton — toasts", () => {
  it("shows a success toast when an item is removed from the cart", async () => {
    render(<CartButton role="organizer" cartItems={[makeCartItem()]} />);
    fireEvent.click(screen.getByRole("button", { name: /cart/i }));
    fireEvent.click(screen.getByRole("button", { name: /remove item/i }));
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(toastCalls).toContainEqual({ type: "success", message: "Removed from cart." });
  });
});
```

- [ ] **Step 6: Run it to verify it fails**

Run: `bun test src/components/shell/cart-button.test.tsx --isolate`
Expected: FAIL.

- [ ] **Step 7: Wrap the removeFromCart call**

Modify `src/components/shell/cart-button.tsx`:

```tsx
import { runAction } from "@/lib/toast-action";
```

```tsx
  async function handleRemove(itemId: string) {
    const result = await runAction(removeFromCart(itemId), { success: "Removed from cart." });
    if ("error" in result) return;
    router.refresh();
  }
```

- [ ] **Step 8: Run it to verify it passes**

Run: `bun test src/components/shell/cart-button.test.tsx --isolate`
Expected: PASS.

- [ ] **Step 9: Write the failing test for booking-panel**

`src/components/talent-detail/booking-panel.test.tsx`:

```tsx
import { afterEach, describe, expect, it, mock } from "bun:test";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

const toastCalls: { type: "error" | "success"; message: string }[] = [];
mock.module("sonner", () => ({
  toast: {
    error: (message: string) => toastCalls.push({ type: "error", message }),
    success: (message: string) => toastCalls.push({ type: "success", message }),
  },
}));
mock.module("next/navigation", () => ({ useRouter: () => ({ push: () => {} }) }));
mock.module("@/lib/supabase/package-actions", () => ({
  addToCart: async () => ({ success: true as const }),
}));

import { BookingPanel } from "@/components/talent-detail/booking-panel";
import type { PackageRow } from "@/lib/supabase/types";

afterEach(() => {
  cleanup();
  toastCalls.length = 0;
});

function makePackage(overrides: Partial<PackageRow> = {}): PackageRow {
  return {
    id: "pkg-1",
    talent_id: "talent-1",
    category: "Solo Singer",
    sub_category: "Rapper",
    title: "Acoustic Set",
    residency: null,
    location: "Ho Chi Minh City",
    repeat_on: false,
    repeat_days: null,
    start_date: "2026-12-01",
    end_date: "2026-12-01",
    start_time: "20:00",
    end_time: "22:00",
    description: null,
    price_min_vnd: 5_000_000,
    price_max_vnd: 10_000_000,
    payment_method: "Prepaid",
    status: "active",
    is_most_popular: false,
    is_editor_choice: false,
    created_at: new Date().toISOString(),
    ...overrides,
  };
}

describe("BookingPanel — toasts", () => {
  it("shows a success toast when added to cart", async () => {
    render(<BookingPanel talentName="Test Talent" packages={[makePackage()]} />);
    fireEvent.change(screen.getByLabelText("Booking date"), { target: { value: "2026-12-01" } });
    fireEvent.click(screen.getByRole("button", { name: /add to cart/i }));
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(toastCalls).toContainEqual({ type: "success", message: "Added to cart." });
  });
});
```

- [ ] **Step 10: Run it to verify it fails**

Run: `bun test src/components/talent-detail/booking-panel.test.tsx --isolate`
Expected: FAIL.

- [ ] **Step 11: Wrap the addToCart call**

Modify `src/components/talent-detail/booking-panel.tsx`:

```tsx
import { runAction } from "@/lib/toast-action";
```

```tsx
    const result = await runAction(addToCart(formData), { success: "Added to cart." });
    setPending(false);
    if ("error" in result) {
      setError(result.error);
      return;
    }
    router.push("/organizer/checkout");
```

- [ ] **Step 12: Run it to verify it passes**

Run: `bun test src/components/talent-detail/booking-panel.test.tsx --isolate`
Expected: PASS.

- [ ] **Step 13: Write the failing test for request-quote-dialog**

`src/components/talent-detail/request-quote-dialog.test.tsx`:

```tsx
import { afterEach, describe, expect, it, mock } from "bun:test";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

const toastCalls: { type: "error" | "success"; message: string }[] = [];
mock.module("sonner", () => ({
  toast: {
    error: (message: string) => toastCalls.push({ type: "error", message }),
    success: (message: string) => toastCalls.push({ type: "success", message }),
  },
}));
mock.module("@/lib/supabase/quotation-actions", () => ({
  requestQuotation: async () => ({ success: true as const }),
}));

import { RequestQuoteDialog } from "@/components/talent-detail/request-quote-dialog";

afterEach(() => {
  cleanup();
  toastCalls.length = 0;
});

describe("RequestQuoteDialog — toasts", () => {
  it("shows a success toast when a quote request is sent", async () => {
    render(<RequestQuoteDialog talentId="talent-1" talentName="Test Talent" />);
    fireEvent.click(screen.getByRole("button", { name: /request a quote/i }));
    fireEvent.change(screen.getByPlaceholderText("Private Wedding Reception"), {
      target: { value: "My Event" },
    });
    fireEvent.click(screen.getByRole("button", { name: /send request/i }));
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(toastCalls).toContainEqual({ type: "success", message: "Quote request sent." });
  });
});
```

- [ ] **Step 14: Run it to verify it fails**

Run: `bun test src/components/talent-detail/request-quote-dialog.test.tsx --isolate`
Expected: FAIL.

- [ ] **Step 15: Wrap the requestQuotation call**

Modify `src/components/talent-detail/request-quote-dialog.tsx`:

```tsx
import { runAction } from "@/lib/toast-action";
```

```tsx
    const result = await runAction(requestQuotation(formData), { success: "Quote request sent." });
    setPending(false);
    if ("error" in result) {
      setError(result.error);
      return;
    }
    setSubmitted(true);
```

- [ ] **Step 16: Run it to verify it passes**

Run: `bun test src/components/talent-detail/request-quote-dialog.test.tsx --isolate`
Expected: PASS.

- [ ] **Step 17: Full suite + typecheck**

Run: `bunx tsc --noEmit` — expect clean.
Run: `bun test --isolate` — expect all PASS.

- [ ] **Step 18: Commit**

```bash
git add src/components/checkout/checkout-content.tsx src/components/checkout/checkout-content.test.tsx src/components/shell/cart-button.tsx src/components/shell/cart-button.test.tsx src/components/talent-detail/booking-panel.tsx src/components/talent-detail/booking-panel.test.tsx src/components/talent-detail/request-quote-dialog.tsx src/components/talent-detail/request-quote-dialog.test.tsx
git commit -m "$(cat <<'EOF'
Add toast feedback to checkout, cart, booking, and quote requests

Author: Claude Code <noreply@anthropic.com>
EOF
)"
```

---

### Task 7: Retrofit KYC, reviews, notifications

**Files:**
- Modify: `src/components/kyc/kyc-wizard.tsx`
- Test: `src/components/kyc/kyc-wizard.test.tsx`
- Modify: `src/components/shared/review-dialog.tsx`
- Test: `src/components/shared/review-dialog.test.tsx`
- Modify: `src/components/shell/notification-button.tsx`
- Test: `src/components/shell/notification-button.test.tsx`

**Interfaces:**
- Consumes: `runAction` from `@/lib/toast-action` (Task 1).

- [ ] **Step 1: Write the failing test for kyc-wizard**

`src/components/kyc/kyc-wizard.test.tsx`:

```tsx
import { afterEach, describe, expect, it, mock } from "bun:test";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

const toastCalls: { type: "error" | "success"; message: string }[] = [];
mock.module("sonner", () => ({
  toast: {
    error: (message: string) => toastCalls.push({ type: "error", message }),
    success: (message: string) => toastCalls.push({ type: "success", message }),
  },
}));
mock.module("@/lib/supabase/kyc-actions", () => ({
  submitKyc: async () => ({ success: true as const }),
}));
mock.module("@/lib/supabase/storage-actions", () => ({
  uploadKycDocument: async () => ({ success: true as const, path: "user-1/id-front-123.jpg" }),
}));

import { KycWizard } from "@/components/kyc/kyc-wizard";

afterEach(() => {
  cleanup();
  toastCalls.length = 0;
});

describe("KycWizard — toasts", () => {
  it("shows a success toast when a document uploads", async () => {
    render(<KycWizard role="talent" />);
    // role="talent" -> individual flow, starts on "Personal Info". All
    // fields are required, so all must be filled before "Next Step"
    // actually advances the step.
    fireEvent.change(screen.getByPlaceholderText("Dang Kim Bao"), { target: { value: "Test User" } });
    fireEvent.change(screen.getByLabelText("Date of Birth"), { target: { value: "1990-01-01" } });
    fireEvent.change(screen.getByPlaceholderText("Vietnamese"), { target: { value: "Vietnamese" } });
    fireEvent.change(screen.getByPlaceholderText("079xxxxxxxxx"), { target: { value: "079123456789" } });
    fireEvent.change(screen.getByPlaceholderText("114 Nam Ky Khoi Nghia Str, HCMC"), {
      target: { value: "123 Test St" },
    });
    fireEvent.click(screen.getByRole("button", { name: /next step/i }));

    // Now on "ID Document" — UploadSlot's <input type="file"> is visually
    // hidden with no accessible name, so it can't be queried by role/label;
    // the first file input in the DOM at this step is the "id-front" slot.
    const fileInput = document.querySelectorAll('input[type="file"]')[0] as HTMLInputElement;
    const file = new File(["id-front"], "id-front.jpg", { type: "image/jpeg" });
    fireEvent.change(fileInput, { target: { files: [file] } });

    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(toastCalls).toContainEqual({ type: "success", message: "Document uploaded." });
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `bun test src/components/kyc/kyc-wizard.test.tsx --isolate`
Expected: FAIL once the test body is filled in.

- [ ] **Step 3: Wrap both submitKyc and uploadKycDocument calls**

Modify `src/components/kyc/kyc-wizard.tsx`:

```tsx
import { runAction } from "@/lib/toast-action";
```

```tsx
  function uploadSlotHandler(
    docType: string,
    setSlot: React.Dispatch<React.SetStateAction<UploadState>>
  ) {
    return async (file: File) => {
      setSlot({ path: null, pending: true });
      const formData = new FormData();
      formData.set("file", file);
      formData.set("docType", docType);
      const result = await runAction(uploadKycDocument(formData), { success: "Document uploaded." });
      if ("error" in result) setSlot({ path: null, pending: false, error: result.error });
      else setSlot({ path: result.path, pending: false });
    };
  }
```

```tsx
    const result = await runAction(submitKyc(formData), { success: "KYC submission received." });
    setPending(false);
    if ("error" in result) {
      setError(result.error);
      return;
    }
    setSubmitted(true);
```

- [ ] **Step 4: Run it to verify it passes**

Run: `bun test src/components/kyc/kyc-wizard.test.tsx --isolate`
Expected: PASS.

- [ ] **Step 5: Write the failing test for review-dialog**

`src/components/shared/review-dialog.test.tsx`:

```tsx
import { afterEach, describe, expect, it, mock } from "bun:test";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

const toastCalls: { type: "error" | "success"; message: string }[] = [];
mock.module("sonner", () => ({
  toast: {
    error: (message: string) => toastCalls.push({ type: "error", message }),
    success: (message: string) => toastCalls.push({ type: "success", message }),
  },
}));
mock.module("@/lib/supabase/review-actions", () => ({
  submitReview: async () => ({ success: true as const }),
}));

import { ReviewDialog } from "@/components/shared/review-dialog";

afterEach(() => {
  cleanup();
  toastCalls.length = 0;
});

describe("ReviewDialog — toasts", () => {
  it("shows a success toast when a review is submitted", async () => {
    render(
      <ReviewDialog
        open
        onOpenChange={() => {}}
        sourceType="booking"
        sourceId="booking-1"
        talentName="Test Talent"
        onSubmitted={() => {}}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: /submit review/i }));
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(toastCalls).toContainEqual({ type: "success", message: "Review submitted." });
  });
});
```

- [ ] **Step 6: Run it to verify it fails**

Run: `bun test src/components/shared/review-dialog.test.tsx --isolate`
Expected: FAIL.

- [ ] **Step 7: Wrap the submitReview call**

Modify `src/components/shared/review-dialog.tsx`:

```tsx
import { runAction } from "@/lib/toast-action";
```

```tsx
    const result = await runAction(submitReview(formData), { success: "Review submitted." });
    setPending(false);
    if ("error" in result) {
      setError(result.error);
      return;
    }
    onOpenChange(false);
    onSubmitted();
```

- [ ] **Step 8: Run it to verify it passes**

Run: `bun test src/components/shared/review-dialog.test.tsx --isolate`
Expected: PASS.

- [ ] **Step 9: Write the failing test for notification-button**

`src/components/shell/notification-button.test.tsx`:

```tsx
import { afterEach, describe, expect, it, mock } from "bun:test";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

const toastCalls: { type: "error" | "success"; message: string }[] = [];
mock.module("sonner", () => ({
  toast: {
    error: (message: string) => toastCalls.push({ type: "error", message }),
    success: (message: string) => toastCalls.push({ type: "success", message }),
  },
}));
mock.module("@/lib/supabase/notification-actions", () => ({
  markNotificationsRead: async () => ({ error: "Could not mark notifications read." }),
}));

import { NotificationButton } from "@/components/shell/notification-button";
import type { NotificationItem } from "@/lib/supabase/types";

afterEach(() => {
  cleanup();
  toastCalls.length = 0;
});

describe("NotificationButton — toasts", () => {
  it("shows an error toast if marking notifications read fails, but no toast on success", async () => {
    const notifications: NotificationItem[] = [
      { id: "n1", kind: "booking_status", message: "Test", time: "1h ago", unread: true },
    ];
    render(<NotificationButton notifications={notifications} />);
    fireEvent.click(screen.getByRole("button", { name: /notifications/i }));
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(toastCalls).toContainEqual({
      type: "error",
      message: "Could not mark notifications read.",
    });
  });
});
```

- [ ] **Step 10: Run it to verify it fails**

Run: `bun test src/components/shell/notification-button.test.tsx --isolate`
Expected: FAIL.

- [ ] **Step 11: Wrap the markNotificationsRead call**

Modify `src/components/shell/notification-button.tsx`:

```tsx
import { runAction } from "@/lib/toast-action";
```

```tsx
  async function handleOpenChange(open: boolean) {
    if (open && hasUnread) {
      setItems((prev) => prev.map((n) => ({ ...n, unread: false })));
      await runAction(markNotificationsRead());
    }
  }
```

(No `success` option passed — a toast firing just because the notification bell was opened would be surprising UX; only a genuine failure toasts.)

- [ ] **Step 12: Run it to verify it passes**

Run: `bun test src/components/shell/notification-button.test.tsx --isolate`
Expected: PASS.

- [ ] **Step 13: Full suite + typecheck**

Run: `bunx tsc --noEmit` — expect clean.
Run: `bun test --isolate` — expect all PASS.

- [ ] **Step 14: Commit**

```bash
git add src/components/kyc/kyc-wizard.tsx src/components/kyc/kyc-wizard.test.tsx src/components/shared/review-dialog.tsx src/components/shared/review-dialog.test.tsx src/components/shell/notification-button.tsx src/components/shell/notification-button.test.tsx
git commit -m "$(cat <<'EOF'
Add toast feedback to KYC submission/uploads, reviews, and notifications

Author: Claude Code <noreply@anthropic.com>
EOF
)"
```

---

### Task 8: Final verification

**Files:** none (verification only)

- [ ] **Step 1: Full typecheck**

Run: `bunx tsc --noEmit`
Expected: no errors.

- [ ] **Step 2: Full test suite**

Run: `bun test --isolate`
Expected: all PASS, across every file touched in Tasks 1-7.

- [ ] **Step 3: Lint**

Run: `bun run lint`
Expected: no errors.

- [ ] **Step 4: Manual browser verification**

Start the dev server (`bun run dev`) and confirm in a real browser:
- Homepage "Recently Added" items are clickable and land on the correct talent's detail page.
- At least one action from each of Tasks 3-7 (sign-in error, a My Account save, a package delete, an accept/reject, a cart removal, a KYC document upload, a review submission) shows the expected toast.
- No action anywhere silently succeeds or fails without a toast (spot-check a few not explicitly listed above).
- Re-verify the two items the user flagged as likely non-bugs, now that failures are visible: retry an avatar upload and confirm either it succeeds and shows on the homepage, or it now shows a clear error toast explaining why it failed. Check a Talent account that has real profile data populated and confirm its public detail page shows that data in the relevant tabs.

- [ ] **Step 5: Report results**

Summarize the manual verification outcome (pass/fail per bullet above) back to the user — do not claim the feature works end-to-end without having actually clicked through it.
