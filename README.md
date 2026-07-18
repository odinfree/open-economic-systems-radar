# Open Economic Systems Radar

Public dashboard for detecting an early shift toward open, programmable economic
activity. It refreshes source data in six-hour cache windows and distinguishes:

- machine-payment activity;
- stablecoin settlement capacity;
- open-market activity;
- developer adoption;
- merchant and payer breadth;
- concentration and provider disagreement;
- authenticity research;
- short-baseline anomaly, count-value correlation, value density, and protocol-diversity diagnostics;
- 90-day, one-year, and 18-month trend views with explicit source-coverage limits.

The public source of record is
[welttowelt/open-economic-systems-radar](https://github.com/welttowelt/open-economic-systems-radar).

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
when nobody requested the dashboard.

Rails, DEX, and developer charts default to one year and can switch between
90 days, one year, and 18 months. Machine-payment explorers currently expose a
much shorter history, so those charts show the full available source window and
print its exact coverage instead of stretching it into a false long-term series.

No private keys, wallet addresses, internal product data, or paid API keys are
required.
