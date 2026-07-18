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

The first OpenNext archive then exposed a production-only `require is not
defined` exception because it contained the adapter's unbundled entrypoint. The
final build adds Wrangler's bundling pass before packaging and was separately
tested with bundling disabled at runtime; the page, icon, and live snapshot API
all returned HTTP 200 in that final package form.

# Five-cycle RCI record — brand and horizon revision

Review date: 2026-07-18

## RCI 1 — Historical data truth

- Problem: the earlier global 7D/30D/90D/1Y selector implied that every source
  could support every horizon.
- Evidence: machine explorers expose 31 days, while stablecoin and DEX sources
  expose longer histories and the npm endpoint clamps large requests to roughly
  18 months.
- Consequence: a selected one-year window could still show only one month
  without stating why.
- Smallest fix: give machine charts their full source window and a visible
  coverage statement; use 90D, 1Y, and 18M only for eligible history charts.
- Verification: the production snapshot reports 31 machine days, 548
  stablecoin days, 548 DEX days, and 547 npm coverage days.

## RCI 2 — Trend legibility

- Problem: raw daily series hid medium- and long-horizon direction in noise.
- Evidence: DEX volume and package downloads are highly variable; month-only
  charts emphasized spikes.
- Consequence: readers could react to a transient peak instead of a sustained
  change.
- Smallest fix: default to 1Y, add 30-day means to stablecoin and DEX charts,
  four-week means to npm, and seven-day means to the short machine series.
- Verification: the 18M browser interaction updates both eligible chart groups,
  and long x-axes show month plus year.

## RCI 3 — Brand fidelity

- Problem: the earlier interface mixed graphite, serif type, green, blue, and
  violet signals, while the supplied reference uses a deep-violet field and one
  orange signal.
- Evidence: the old design contract and favicon still named or encoded the
  previous palette.
- Consequence: the dashboard did not read as part of the supplied welttowelt
  design system.
- Smallest fix: adopt the exact reference palette, IBM Plex Sans, square
  surfaces, left-led hierarchy, restrained orange, and update the favicon and
  design contract.
- Verification: computed production styles match `#0C0A18`, `#E86A2D`,
  `#151225`, `#2A2640`, IBM Plex Sans, and zero-radius chart panels.

## RCI 4 — Responsive and accessible behavior

- Problem: the redesigned verdict panel initially lost useful inner spacing at
  the phone breakpoint.
- Evidence: the mobile rule used horizontal padding of zero.
- Consequence: the orange structure line and score visualization sat too close
  to the viewport edge.
- Smallest fix: restore 20px panel padding, stack section actions on mobile,
  preserve visible focus, and keep charts labelled with adjacent text summaries.
- Verification: the 390 × 844 production pass has a 390px scroll width, hidden
  desktop navigation, one-column metric layout, and zero console errors.

## RCI 5 — Public source and deployment truth

- Problem: the live site existed before a public `welttowelt` source repository,
  and the documentation still described the previous design.
- Evidence: Git only had the private hosting remote; the README did not link a
  public source of record.
- Consequence: readers could not audit or reuse the implementation from the
  requested GitHub account.
- Smallest fix: create the public GitHub repository, link it in the header,
  sources section, footer, and README, then deploy the identical tested commit.
- Verification: 11/11 tests pass, the Cloudflare OpenNext production build
  completes, the local worker returns HTTP 200 with schema 1.2.0 and 9/9 healthy
  sources, and browser QA reports no horizontal overflow at 390px, 1280px, or
  1440px.

# Plain-language revision

Review date: 2026-07-18

- Removed rhetorical questions, slogan-like section titles, repeated refresh
  details, the redundant source note, and abstract labels such as `developer
  pull` and `open-rail capacity`.
- Replaced those labels with the measured objects: software payment value,
  stablecoin supply, DEX volume, package downloads, addresses, and provider
  totals.
- Added 26 small explanation controls for technical statistics, score logic,
  source periods, and evidence limits. Every control has a unique accessible
  target, opens on click or keyboard focus, and closes with Escape.
- Tightened factual boundaries: buyer and seller figures are addresses, the MPP
  card is an overall reported total, its recent comparison is 3 days versus the
  prior 3 days, and the Base study is not applied to current explorer totals.
- Added wording regression tests for the page, metric labels, source
  descriptions, and metadata.
- Verification: 13/13 tests pass; the packaged worker returns HTTP 200 with
  schema 1.3.0, 9/9 healthy sources, six ratios with stable IDs, and zero source
  failures. Desktop browser QA found no horizontal overflow or runtime errors.
