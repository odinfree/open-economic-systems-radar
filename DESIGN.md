# Open Economic Systems Radar — Design Contract

## Purpose

Detect an early shift from closed, account-bound software commerce toward open,
programmable economic activity. The dashboard must separate economic activity
from capacity, developer interest, and manipulable transaction counters.

## Audience

Crypto product, strategy, research, and investment teams scanning for a change
in machine-native commerce before it becomes obvious.

## Visual direction

Follow the
[welttowelt brand reference](https://welttowelt-brand-sample-v18093.netlify.app/):
a deep-violet field (`#0C0A18`), controlled violet surfaces, signal white,
mist-grey body text, and one ember-orange accent (`#E86A2D`). IBM Plex Sans
carries the interface; IBM Plex Mono is reserved for measurements. Use strict
grid logic, square panels, generous whitespace, left-led hierarchy, and fewer,
larger visual moves.

## Information hierarchy

1. Current shift state and confidence
2. High-signal economic and behavioral indicators
3. Machine-payment movement
4. Open-rail capacity and open-market activity
5. Developer momentum
6. Concentration, source divergence, and authenticity warnings
7. Ratios, definitions, and source provenance

## Interaction

- Eligible history charts default to one year and offer 90D, 1Y, and 18M views.
- Machine-payment charts show their complete explorer window because no honest
  medium- or long-term public series exists yet.
- Every chart offers daily, weekly, and monthly aggregation. Yearly appears
  only when the selected source window spans at least two calendar years.
- Flow charts sum each selected period. Stock charts use the period close.
- Trend lines recalculate from the selected cadence instead of retaining a
  daily-only average.
- Metric definitions are visible without requiring a hidden help center.
- Source links open the underlying public source.
- Refresh requests use the current six-hour UTC window.

## Accessibility

- Minimum WCAG AA contrast for text and controls.
- Visible keyboard focus.
- Charts have concise text summaries and adjacent exact-value tables.
- Motion is disabled under `prefers-reduced-motion`.
- Color is never the only state signal.

## Claim boundaries

- The shift score is a transparent heuristic, not a forecast.
- Stablecoin supply is capacity, not commerce.
- DEX volume is open-market activity, not agent activity.
- npm downloads are developer interest, not production adoption.
- x402 and MPP source windows are labelled and never blended silently.
- Raw transaction counts receive concentration and authenticity context.
