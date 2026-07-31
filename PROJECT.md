# Heart of Show (Hos) — Project Overview

Read this before starting work in a new session. It explains what this app is,
what's built, what's mocked, and the traps that have already bitten us once.

## What this is

A talent-booking marketplace frontend (Next.js, no backend yet) connecting
three user roles:

- **Organizer** — books talent for events (posts events, browses talent, applies budget/slots)
- **Talent** — an individual performer who lists packages and applies to events
- **Agency** — represents a roster of talents, applies to events on their behalf

Design source of truth is a Figma file: fileKey `00Utf5n3qgXjBgwEn7wure`
("Hos"). There is no running backend — everything is mock data in `src/lib/mock-*.ts`.

## Tech stack

- Next.js 16, App Router, TypeScript
- Tailwind CSS v4
- shadcn/ui (Nova preset, Radix primitives) — components live in `src/components/ui/`
- Dark theme only, red/black brand palette

⚠️ **`AGENTS.md` at the repo root says this Next.js version has breaking API
changes from what training data assumes.** Check `node_modules/next/dist/docs/`
before relying on memory for App Router conventions.

## Role-based routing (no backend — read this first)

Each role has its own route tree: `/organizer/*`, `/talent/*`, `/agency/*`.
There is no auth/session yet, so a **`RoleSwitcher`** dropdown in the topbar
(`src/components/shell/role-switcher.tsx`) lets you manually swap roles for
testing. It uses `getEquivalentPath()` in `src/lib/role-switch.ts` to map the
current URL to the equivalent route under a different role (e.g.
`/organizer/account/events` ↔ `/talent/account/packages`). When real
role-based auth exists, this switcher and mapping should be deleted.

Route trees are **not** just copy-pasted per role — Organizer and Talent/Agency
are genuinely different designs in Figma (different homescreen, different
Discover filters, etc.). Don't assume a component works for all three roles
without checking the actual Figma screenshots; this mistake was made once
already for the entire Talent/Agency flow and had to be redone.

Shared logic across roles takes a `role: Role` prop (`Role =
"organizer" | "talent" | "agency"` in `src/lib/nav-items.ts`) and branches
internally, rather than being duplicated per-route, e.g. `EventDetailContent`,
`AccountShell`, `CreatePackageDialog`.

## Directory map

```
src/app/                     route trees per role (thin pages that render *-content components)
  (auth)/                    sign-in, sign-up, forgot-password (shared, role-less)
  organizer/ talent/ agency/ page.tsx (home), discover/, create/, kyc/, events|talents/[slug]/,
                              account/{page,orders,schedule,billing,packages|events}/
  organizer/checkout/        organizer-only checkout flow

src/components/
  shell/                     topbar, sidebar, nav, home/discover content, filter popovers,
                              notification/cart dropdowns, event listing cards
  account/                   the 5-6 tabs under "My Account" (profile/packages/orders/schedule/billing[/talents])
  event-detail/ talent-detail/  event & talent detail pages + apply flow
  create-package/            single-dialog package creation (not a page wizard)
  kyc/ auth/ checkout/       self-explanatory
  ui/                        shadcn primitives — don't hand-roll a component that exists here

src/lib/
  nav-items.ts                Role type, sidebar categories, create-CTA copy
  role-switch.ts               RoleSwitcher path-mapping (see above)
  mock-*.ts                    all mock data — event listings/detail, roster, notifications,
                                account (packages/orders/schedule/transactions/invoices), checkout
```

## Design-fidelity notes (things that look generic but aren't)

- **Filter popovers** (`src/components/shell/price-range-filter.tsx`,
  `time-range-filter.tsx`, `hashtag-filter.tsx`) were rebuilt from real Figma
  screenshots — they are NOT simple `<select>`-style dropdowns. Price Range is
  a dual-handle slider in VND; Time is a month calendar + start/end time
  inputs; Hashtag is a search input with removable pill tags. Default state
  matters: Time defaults to "All Time" (`end: null`), Hashtag defaults to
  none selected — both had bugs where they rendered as if a value were
  already picked.
- **Notification/Cart dropdowns** (`notification-button.tsx`, `cart-button.tsx`)
  are Popovers, not plain buttons. Cart is **Organizer-only** — Talent/Agency
  topbars do not show a cart icon (see `topbar.tsx`: `{role === "organizer" &&
  <CartButton .../>}`).
- **Organizer** Discover filters: Sort by / Sub-Category / Location / Price
  Range / Time / Hashtag. **Talent/Agency** Discover filters: Sort by /
  Category / Location / Time / Hashtag (no Price Range, no category tabs) —
  these two are intentionally different, confirmed against Figma.
- **Schedule calendar** (`src/components/account/schedule-content.tsx`) uses a
  two-layer architecture: a grid-lines layer (hour labels, day headers,
  borders) plus an absolutely-positioned event-overlay layer where each
  event's `top`/`height`/`left` are computed from real `day`/`startHour`/
  `endHour` values (`FIRST_HOUR=8, LAST_HOUR=23, ROW_HEIGHT=56`). Don't
  regress to hardcoded `gridRow` positioning — that's what broke it the first
  time.
- Talent/Agency's sidebar **Category tree defaults collapsed**; Organizer's
  defaults expanded (`sidebar.tsx`: `useState(role === "organizer")`).
- Talent/Agency category taxonomy (`talentCategories` in `nav-items.ts`) is
  borrowed from the Organizer sidebar and **not yet confirmed** against
  Figma — flagged in a comment in that file. Check before trusting it.

## Working with Figma

The Figma Dev Mode MCP server and the Figma REST API **share the same
Starter-plan rate limit** (~6 calls/month) — do not assume switching between
them gives you more quota. When you do get access:

- The REST API supports **comma-separated node IDs in one call** —
  `/v1/files/{key}/nodes?ids=A,B,C` and `/v1/images/{key}?ids=A,B,C&format=png`
  — batch every screen you need into one or two calls, not one per screen.
- Fetched PNGs at scale=1 can exceed the Read tool's resolution limit; resize
  locally with PowerShell (`System.Drawing.Bitmap` + `HighQualityBicubic`)
  rather than re-fetching at a lower scale.
- If quota is exhausted, ask the user for reference screenshots rather than
  guessing — this happened for the filter/dropdown rebuild
  (`C:\Users\dangk\Downloads\fix-screen\`) and worked well.
- `FIGMA_TOKEN` lives in `.env.local` (gitignored).

## Testing in-browser (claude-in-chrome)

Radix primitives (Popover/Dialog/Tabs/DropdownMenu) listen for `pointerdown`,
not just `click`. A plain `.click()` via `javascript_tool` sometimes silently
no-ops. Dispatch the full sequence:

```js
el.dispatchEvent(new MouseEvent('pointerdown', {bubbles:true}));
el.dispatchEvent(new MouseEvent('mousedown', {bubbles:true}));
el.dispatchEvent(new MouseEvent('mouseup', {bubbles:true}));
el.dispatchEvent(new MouseEvent('click', {bubbles:true}));
```

Always verify visually with a screenshot after — don't trust that a dispatched
click "worked" just because it didn't throw.

## What's mocked vs. real

Everything is mock data — no API calls, no persistence, no real auth. Forms
(sign-in, create-package, apply-dialog, checkout) update local component
state only and don't submit anywhere. Treat any "Save"/"Submit"/"Checkout"
button as UI-complete but backend-less.

## Git

Remote: `git@github.com:dangkimbao1999/hos.git`, branch `main`. One commit so
far beyond the `create-next-app` scaffold — this is a young repo, not a
long-lived one with history to respect yet, but still follow normal
commit-only-when-asked discipline.

## Suggested starting point for a new session

1. Skim this file and `AGENTS.md`/`CLAUDE.md`.
2. If picking up visual/design work, ask the user whether they have new
   reference screenshots before spending Figma quota.
3. If picking up a new role/screen, check whether Organizer and Talent/Agency
   actually share a design before reusing an Organizer component — they
   often don't.
4. Run `npx tsc --noEmit` and `npm run lint` after changes; there's no test
   suite yet.
