# Open Economic Systems Radar

Public dashboard for detecting an early shift toward open, programmable economic
activity. It refreshes source data in six-hour cache windows and distinguishes:

- machine-payment activity;
- stablecoin settlement capacity;
- open-market activity;
- package fetch activity as a low-confidence proxy;
- merchant and payer breadth;
- concentration and provider disagreement;
- authenticity research;
- short-baseline anomaly, count-value correlation, value density, and protocol-diversity diagnostics;
- 90-day, one-year, 18-month, and five-year trend views where source history permits;
- daily, weekly, and monthly aggregation on every chart, plus yearly aggregation
  when the visible source history contains two complete calendar years.

The public source of record is
[welttowelt/open-economic-systems-radar](https://github.com/odinfree/open-economic-systems-radar).

## Field note

`/blog` is a dated, static analysis of the three strongest bullish signals and
the three strongest bearish constraints in the current public data. Every claim
has an adjacent chart. The article uses a frozen evidence file so its prose,
values, source windows, and chart inputs remain reproducible after the live
radar changes.

Refresh the frozen evidence deliberately with:

```bash
RADAR_SNAPSHOT_URL=https://your-radar.example/api/snapshot npm run capture:blog
```

The three historical charts offer daily, weekly, and monthly aggregation. The
stablecoin chart also offers yearly aggregation because its source supplies
complete calendar years; npm's 18-month API limit does not. The three bearish
charts use fixed study or current 30-day aggregates because no underlying daily
history is published; the article labels that limit instead of manufacturing a
time series.

## Sources

- x402scan public explorer
- x402 Foundation public statistics
- Coinbase x402 Bazaar
- MPPscan public explorer
- DeFiLlama stablecoin and DEX APIs
- npm downloads API
- Visa / Artemis agentic-payments benchmark
- July 2026 x402 authenticity paper

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Test and build

```bash
npm test
npm run build
```

`npm run build` produces both the Next.js build and a Cloudflare OpenNext worker
package in `dist/`. Test the worker runtime with:

```bash
npm run preview:worker
```

## Refresh contract

Public source requests are cached for 21,600 seconds. The first dashboard request
inside each UTC six-hour window produces or retrieves that window's snapshot.
The dashboard exposes `generatedAt`, source health, and the next refresh window.
This is demand-triggered revalidation, not a claim that a background cron ran
when nobody requested the dashboard. A partial snapshot is not cached. If a
required source fails, the dashboard shows `DATA GAP` and pauses the score
instead of treating missing data as economic weakness.

Rails, DEX, and package-activity charts default to one year. Rails and DEX can
switch through five years; package activity stops at the npm API's 18-month
limit. Machine-payment explorers currently expose a
much shorter history, so those charts show the full available source window and
print its exact coverage instead of stretching it into a false long-term series.

Every chart can aggregate its visible history by day, week, or month. The
Yearly control enables only when the selected source window contains at least
two complete calendar years. Partial edge years are excluded. Payment, volume,
and download flows are summed within each period; stablecoin supply uses the
last observation in the period.

npm's public download API counts successful package tarball responses, not
unique people. CI, disposable Docker builds, mirrors, robots, transitive
installs, and local caches can all change the count. Package fetch activity
therefore receives 5% of the score and its component score is capped at 40.
Verified new integrations, retained integrations, first-time contributors, and
new importing repositories remain explicitly unmeasured until a defensible
public series exists.

No private keys, wallet addresses, internal product data, or paid API keys are
required.
