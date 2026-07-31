---
name: figma-efficient-fetch
description: Fetch Figma design data (structure, screenshots, variables) for frontend implementation while minimizing API calls against tight rate limits. Use whenever implementing or fixing a UI against a Figma file, before making any Figma tool/API call.
---

# Figma Efficient Fetch — Detailed Procedure

Figma access (both the Dev Mode MCP server and the REST API) is commonly
rate-limited to a handful of calls per month on Starter-tier plans. **The MCP
server and the REST API share the same quota** — switching between them when
one 429s does not buy more budget. Treat every call as expensive from the
start; there is no "burn through it and recover" fallback mid-session.

## 1. Plan the entire fetch before making any call

List every screen/frame/component you'll need across the *whole* task —
not just the one you're about to build — before touching a Figma tool. If the
task is "build Talent and Agency home + discover + account", enumerate all of
those node IDs up front. Re-fetching later because you forgot a screen is
the single most common way this quota gets wasted.

Get node IDs cheaply first:
- `mcp__claude_ai_Figma__get_metadata` on the top-level frame/page to list
  child node IDs and names — this is far cheaper than pulling full design
  context or screenshots per-node just to discover what exists.

## 2. Batch every call that supports batching

The REST API endpoints both accept **comma-separated node IDs in one
request** — use this instead of one call per screen:

```
GET /v1/files/{fileKey}/nodes?ids=A,B,C
GET /v1/images/{fileKey}?ids=A,B,C&format=png&scale=1
```

31 screens fetched individually = 31 calls. The same 31 screens as two
batched calls (one `nodes` call for structure, one `images` call for
screenshots) = 2 calls. Always batch to the tool's max, not one ID at a time.

If using the Figma MCP tools instead of raw REST, check whether
`get_design_context` / `get_screenshot` accept multiple node IDs in one
call before calling them per-node — don't assume you need N calls for N
screens.

## 3. Fetch structure before pixels

Prefer `get_design_context` / `get_variable_defs` (structured JSON: layout,
spacing, color/type tokens, text content) over screenshots when you only
need spec values — it's cheaper and more precise than reading pixels off an
image. Reach for `get_screenshot` / image export specifically when you need
to *see* something structure can't tell you (visual hierarchy, an icon's
exact shape, a gradient, overlapping z-order).

## 4. Don't assume shared design across similar roles/variants

If a product has multiple similar-looking roles or variants (e.g. Organizer
vs. Talent vs. Agency in a marketplace app), **do not assume they share a
screen design** just because the app's IA looks parallel. Confirm each
variant's actual Figma frame before reusing a component wholesale — building
Talent/Agency screens as copies of Organizer's design (because "they looked
similar") was wrong in a prior session and required a full redo once the
real screenshots were reviewed. When in doubt, spend one `get_metadata` call
to confirm whether a separate frame actually exists for the other role
before deciding whether it needs its own fetch.

## 5. Cache aggressively within the session

Save every fetched screenshot/JSON to the scratchpad directory as soon as
it's fetched, and re-read from there for the rest of the session instead of
re-fetching. If a fetched PNG is too large for the Read tool (screens at
scale=1 can exceed its resolution limit), resize it **locally** — do not
re-fetch at a lower scale just to make it readable:

```powershell
Add-Type -AssemblyName System.Drawing
$img = [System.Drawing.Image]::FromFile("$src")
$ratio = 1200 / $img.Width
$bmp = New-Object System.Drawing.Bitmap([int]($img.Width*$ratio), [int]($img.Height*$ratio))
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.DrawImage($img, 0, 0, $bmp.Width, $bmp.Height)
$bmp.Save("${src}_sm.png", [System.Drawing.Imaging.ImageFormat]::Png)
```

## 6. When the quota is exhausted, stop calling and ask

A 429 response usually carries a `retry-after` header measured in days, not
minutes — do not retry-loop. When blocked:

1. Check whether you already have a cached screenshot/JSON for what you
   need (step 5) — often you do.
2. If not, ask the user for reference screenshots instead of guessing at
   the design from memory or approximating with a generic component. This
   worked well in practice: the user supplied exact reference PNGs for a
   set of dropdown/filter components after Figma access was exhausted, and
   implementing directly against those images produced a correct result on
   the first pass.
3. Never fabricate spacing/copy/behavior "close enough" to fill the gap
   silently — flag what's unverified instead.

## 7. Verify against the browser, not against Figma again

Once implemented, verify fidelity by rendering the actual app and comparing
screenshots (or comparing against the cached reference image from step 5) —
don't spend another Figma call to "double check" a design you've already
fetched.

## Load this skill when

- About to implement, fix, or visually verify a UI against a Figma design.
- About to call any Figma MCP tool or the Figma REST API.
- A prior Figma fetch in this session hit a 429/rate-limit response.

## Skip when

- The user has already supplied reference screenshots/specs directly and
  no further Figma access is needed.
- Pure logic/backend work with no visual design component.
