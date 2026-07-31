# Domain Model — Securities Company (CTCK)

<Placeholder — this rule is EMPTY on purpose. Fill it in only once you've
read your actual database schema / API contracts, the way
`.claude/rules/insurance-schema.md` in the reference project documented a
verified entity chain (Insurer -> Plan -> PolicyPlan -> InsuredCertificate
-> Claim) with exact table/column names. Don't invent entity names here —
copy them from the real schema.>

## What this rule should contain once filled in

- **Core entity chain** — the exact sequence of tables/objects, e.g.
  Customer -> Trading Account -> Order -> Execution/Trade -> Settlement.
  State it the way the reference project stated its chain, so Claude Code
  never "skips a level" (e.g. never links an Order straight to a Customer
  bypassing Trading Account, if your schema doesn't allow that).
- **Key relationships** — 1:1 / 1:M / M:M, and which side owns which FK.
- **Conventions** — enum casing, numeric precision for price/quantity/cash
  fields, currency handling, timestamp/timezone conventions for trading
  hours.
- **Computed vs. cached values** — e.g. is available buying power computed
  at runtime from open orders + cash balance, or cached and invalidated?
  State the decision and why, so nobody "fixes" it into the other model by
  accident.
- **Regulatory/compliance identifiers** — KYC status, suitability
  classification, position limits — whatever your regulator (e.g. SSC in
  Vietnam) requires you to track.
- **Where to read the authoritative schema** — file paths to migrations /
  schema definitions / API schema (GraphQL SDL, OpenAPI, protobuf, ...) so
  future sessions verify against source instead of trusting this rule
  blindly once it drifts.

## Load this rule when

<Fill in once written, e.g.:>
- Writing or reviewing code that reads/writes trading accounts, orders,
  executions, or portfolio/holdings data.
- Adding a new order type, asset class, or settlement flow.
- Anything touching customer onboarding/KYC or regulatory reporting.

## Skip when

<Fill in once written, e.g.:>
- Pure UI/styling work with no data-shape implications.
- Infra-only changes.
