# Design QA — brand and long-horizon revision

Reference: https://welttowelt-brand-sample-v18093.netlify.app/

Review date: 2026-07-19

| Surface | Viewport | Check | Result |
| --- | ---: | --- | --- |
| Brand reference | 1280 × 720 | Palette, type, grid, hierarchy, panel shape | Captured and compared |
| Dashboard | 1280 × 720 | Same visual language and information hierarchy | Passed |
| Brand reference | 390 × 844 | Mobile type scale and left-led rhythm | Captured and compared |
| Dashboard | 390 × 844 | Responsive header, hero, verdict, and no horizontal overflow | Passed |
| Dashboard | 1440 × 1000 | Wide composition and three-column metric grid | Passed |

## Brand fidelity

- Exact foundation and signal colors: `#0C0A18` and `#E86A2D`.
- Supporting surfaces and text use the reference palette: `#13102A`,
  `#151225`, `#1E1A30`, `#2A2640`, `#FFFFFF`, `#B0ACC0`, and `#7A7490`.
- IBM Plex Sans carries the interface; IBM Plex Mono is limited to data and
  instrumentation.
- Panels are square, the layout is left-led, and orange is reserved for the
  primary signal and a small number of structural accents.
- No secondary green, blue, or violet signal colors remain.

## Horizon and behavior checks

- Eligible charts default to 1Y and switch between 90D, 1Y, and 18M.
- The 18M interaction updates both rails and package-activity views and exposes
  year-aware x-axis labels.
- Stablecoin and DEX charts use 30-day moving averages.
- npm charts show registry fetches, not unique developers, using four-week
  moving averages and 13-week comparisons.
- Package fetches carry a 5% score weight and a 40/100 component cap.
- Daily, weekly, monthly, and yearly package-chart states render correctly.
- Machine-payment charts show the full 31-day explorer window and state that
  coverage limit beside the charts.
- The production browser reported zero console errors or warnings.

## Copy and explanation checks

- Section headings state the subject directly and contain no rhetorical
  questions.
- The hero refresh note, primary-indicator note, and repeated source note were
  removed.
- Technical concepts use 26 compact explanation controls with plain
  definitions.
- The four unmeasured adoption checks collapse to compact rows with explanation
  controls at phone width.
- Every explanation control has a unique target, supports click and keyboard
  use, closes with Escape, and stays within the desktop viewport.
- Header anchors stop below the 72px sticky navigation.

Final result: passed.
