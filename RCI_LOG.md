# Five-cycle RCI record

Review date: 2026-07-18

## RCI 1 — Data truth

- Problem: address counts could produce an almost perfect counterparty-breadth
  score even though addresses are not verified independent merchants. Static
  research and site headline counters were also labelled `LIVE`.
- Evidence: the live breadth component scored 96 from 63.2K observed seller
  addresses; source cards did not distinguish live feeds, dated research,
  catalogs, or headline counters.
- Impact: the headline score could overstate economic breadth and source
  freshness.
- Fix: cap the unverified breadth component at 70, state the cap in the public
  methodology, add explicit source modes, and replace a reference-identity
  protocol merge with deterministic typed merges.
- Verification: 8/8 tests passed; the live breadth component fell to 70 and the
  overall score moved from 52 to 50.

## RCI 2 — Decision usefulness

- Problem: raw growth rates did not show whether a movement was unusual,
  economically coherent, or diversified across protocols.
- Evidence: the dashboard had trend lines and ratios but no short-baseline
  anomaly or count-value confirmation.
- Impact: an operator spike could look similar to an early structural shift.
- Fix: add a seven-day value anomaly against the prior 21 daily observations,
  30-day count-value correlation, value per 1,000 payments, and MPP share of
  seven-day machine-payment value.
- Verification: 9/9 tests passed, including exact correlation and anomaly
  fixtures.

## RCI 3 — Visual and interaction quality

- Problem: the initial build logged a workspace-root warning, charts formatted
  zero currency as `$0.000`, the favicon was missing, and a cached older API
  schema crashed the newly deployed client.
- Evidence: phone-width Playwright QA reproduced the schema mismatch and a
  browser exception.
- Impact: a routine deployment inside a six-hour cache window could temporarily
  take the dashboard offline.
- Fix: pin the Next.js project root, add the icon, format zero as `$0`, and add
  a backward-compatible analytics fallback.
- Verification: 390px phone rendering has no horizontal overflow, range controls
  update the charts, and the browser reports zero errors or warnings.

## RCI 4 — Resilience, accessibility, and security

- Problem: a simulated total source outage still produced an `EARLY BUILD`
  score because missing inputs were treated as neutral 50s.
- Evidence: the failure test expected `QUIET` and received `EARLY BUILD`.
- Impact: a data outage could manufacture a positive signal.
- Fix: missing inputs now contribute zero, unavailable score components are
  labelled, partial snapshots announce their status, refresh controls expose
  busy state, and baseline response-security headers are enabled.
- Verification: 10/10 tests passed; the zero-feed case is `QUIET`; production
  dependencies have zero high or critical advisories.

## RCI 5 — Public claims and provenance

- Problem: “four-times-daily” could imply a background job had run even with no
  request, and source freshness modes needed to remain visible.
- Evidence: the implementation uses demand-triggered six-hour revalidation.
- Impact: the public cadence claim could outrun the implementation.
- Fix: describe four six-hour UTC windows and visibly state that the first
  request in each window refreshes the cached snapshot. Keep `LIVE`, `HEADLINE`,
  `CATALOG`, and `DATED` labels on every source card.
- Verification: the final API reports schema 1.1.0, 9/9 healthy sources, zero
  failures, six ratios, six score components, four statistical diagnostics,
  and no invalid numbers. Seven source pages returned HTTP 200 to automated
  checks; DeFiLlama's two human-facing pages rejected the automated request
  while their underlying public APIs remained healthy. Final desktop and phone
  browser passes report zero console errors.

## Known implementation note

The public DEX overview response is slightly above Next.js's 2MB individual
fetch-cache limit. The final normalized dashboard snapshot is 79.9KB and the API
route itself carries a six-hour shared-cache contract, so the oversized upstream
response does not expand the browser payload.

The first hosting attempt compiled the Next.js application but failed at the
packaging boundary because no `dist` worker artifact existed. The source now
builds a supported Cloudflare OpenNext worker package. Local worker-runtime
verification returned HTTP 200 for the page, icon, and snapshot API, with 9/9
sources healthy and the six-hour cache headers intact.
