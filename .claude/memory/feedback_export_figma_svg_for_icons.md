---
name: When matching a Figma icon, export the SVG from Figma — do not approximate with Material/Cupertino built-ins
description: For any Figma icon-alignment work, use `mcp__TalkToFigma__export_node_as_image` with `format: "SVG"` and bundle the exported asset. Do NOT substitute Material/Cupertino built-ins that "look similar" — they are close-but-wrong and produce visible regressions like off-axis chips, wrong glyph weight, generic shape, or missing brand mark detail.
type: feedback
---

When the task is "match Figma icon X", the workflow is:

1. `mcp__TalkToFigma__get_node_info` on the parent frame to find the icon's
   sub-node ID.
2. `mcp__TalkToFigma__export_node_as_image` with `format: "SVG"` (NOT PNG)
   on that node — SVG preserves the vector shape at any render size.
3. Save the SVG under `sdks/flutter/phoenix_flutter/assets/icons/`
   (or the package-appropriate asset dir) and register in pubspec.yaml.
4. Render via `flutter_svg`'s `SvgPicture.asset(...)` or `SvgPicture.string(...)`.
5. Tint at the call site via `colorFilter: ColorFilter.mode(<color>, BlendMode.srcIn)`
   so the same asset can render at multiple brand tints.

**Why:** Material `Icons.*` and Cupertino built-ins are general-purpose. Even
when they "look like" the Figma — e.g. `Icons.picture_as_pdf` vs the
Acrobat-style PDF mark in Figma 9225-26072 — there are always shape
differences (centering, weight, badge style, foldedness) that read as wrong
on visual review. Confirmed on 2026-05-27: shipped `Icons.picture_as_pdf`
as the PDF tile centre mark, user immediately rejected on simulator with
"why don't you export SVG icon from Figma?". The dispatch + rebuild cycle
to get back to the right answer cost ~5 minutes vs just doing it right
the first time.

**How to apply:**

- Trigger phrases: "match the Figma", "this should look like the design",
  any icon-alignment task. Default to SVG export, not approximation.
- The Figma MCP tools are only available in the main agent (not in
  phoenix-mobile or other sub-agents). Sequence: main agent exports +
  saves the SVG → sub-agent integrates it into phoenix_icons.dart and
  pubspec.yaml. Dispatch overhead is acceptable here because the work
  genuinely splits across the tool boundary.
- If the SVG references a copyrighted brand mark (Adobe Acrobat, Microsoft
  Office, etc.), the designer's choice IS the spec. Export it. Trademark
  fair-use for file-format identification covers redistribution at typical
  app-icon sizes; the IP concern is real but is the design team's call,
  not the engineer's. Do not silently substitute a generic icon to "play
  it safe" — flag it in the PR description if you're uncertain and let
  the design team or legal sign off.

Companion to [[feedback_dispatch_phoenix_agents_for_sdk_work]] — that
memory says "dispatch the domain agent for SDK work"; THIS memory says
"first export the SVG in main (where Figma MCP lives), THEN dispatch the
agent to wire it in".
