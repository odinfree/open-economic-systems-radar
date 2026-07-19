import { describe, expect, it } from "vitest";
import {
  addMovingAverage,
  aggregateDaily,
  buildMetrics,
  pearsonCorrelation,
  pctChange,
  safeDivide,
  scaleScore,
  seriesCoverage,
  trailingWindowChange,
  windowShiftZ
} from "../lib/metrics";
import { formatCurrency } from "../lib/format";

function days(count, start = "2026-05-20") {
  const first = new Date(`${start}T00:00:00Z`);
  return Array.from({ length: count }, (_, index) => {
    const date = new Date(first.getTime() + index * 86_400_000)
      .toISOString()
      .slice(0, 10);
    return date;
  });
}

describe("metric model", () => {
  it("handles ratios and score scaling safely", () => {
    expect(safeDivide(10, 2)).toBe(5);
    expect(safeDivide(10, 0)).toBe(0);
    expect(pctChange(120, 100)).toBe(20);
    expect(scaleScore(0, -10, 0, 10)).toBe(50);
    expect(formatCurrency(0)).toBe("$0");
  });

  it("aggregates irregular buckets by UTC day", () => {
    const result = aggregateDaily(
      [
        { timestamp: "2026-07-18T01:00:00Z", transactions: 2, volumeUsd: 1 },
        { timestamp: "2026-07-18T05:00:00Z", transactions: 3, volumeUsd: 4 }
      ],
      ["transactions", "volumeUsd"]
    );
    expect(result).toEqual([{ date: "2026-07-18", transactions: 5, volumeUsd: 5 }]);
  });

  it("computes bounded descriptive statistics", () => {
    const rows = days(28).map((date, index) => ({
      date,
      transactions: index + 1,
      volumeUsd: index + 1
    }));
    const anomaly = windowShiftZ(rows, "volumeUsd");
    expect(anomaly.observations).toBe(28);
    expect(anomaly.zScore).toBeGreaterThan(2);
    expect(pearsonCorrelation(rows, "transactions", "volumeUsd")).toBeCloseTo(1);
  });

  it("builds honest mid- and long-horizon helpers", () => {
    const rows = days(6).map((date, index) => ({ date, value: index + 1 }));
    const smoothed = addMovingAverage(rows, "value", "mean3", 3);
    expect(smoothed.at(-1).mean3).toBe(5);
    expect(trailingWindowChange(rows, "value", 3)).toMatchObject({
      current: 15,
      previous: 6,
      changePct: 150,
      complete: true
    });
    expect(seriesCoverage(rows)).toEqual({
      start: rows[0].date,
      end: rows.at(-1).date,
      days: 6,
      points: 6
    });
  });

  it("degrades to a zeroed snapshot when every feed is unavailable", () => {
    const output = buildMetrics({}, new Date("2026-07-18T12:00:00Z"));
    expect(output.verdict.state).toBe("QUIET");
    expect(output.headline.machineVolume7d).toBe(0);
    expect(output.series.machineDaily).toEqual([]);
    expect(output.series.stablecoinSupply).toEqual([]);
    expect(output.analytics.x402ValueAnomaly.observations).toBe(0);
  });

  it("builds a bounded, concentration-aware shift score", () => {
    const dateRows = days(70);
    const npmX402 = dateRows.map((date, index) => ({
      date,
      downloads: index < 35 ? 100 : 180
    }));
    const npmMpp = dateRows.map((date, index) => ({
      date,
      downloads: index < 35 ? 40 : 70
    }));
    const stablecoinChart = dateRows.map((date, index) => ({
      date,
      supplyUsd: 250_000_000_000 + index * 100_000_000
    }));
    const x402Buckets = dateRows.slice(-30).map((date, index) => ({
      timestamp: `${date}T12:00:00Z`,
      transactions: index < 16 ? 100 : 180,
      volumeUsd: index < 16 ? 20 : 50
    }));
    const mppBuckets = dateRows.slice(-7).map((date, index) => ({
      timestamp: `${date}T12:00:00Z`,
      transactions: 50 + index * 5,
      volumeUsd: 10 + index * 2
    }));

    const output = buildMetrics(
      {
        x402Scan: {
          transactions30d: 10_000,
          volume30dUsd: 3_000,
          buyers30d: 1_000,
          sellers30d: 500,
          buckets: x402Buckets,
          topServers: [{ transactions: 7_000, volumeUsd: 2_000, buyers: 50 }]
        },
        x402Official: {
          transactions30d: 12_000,
          volume30dUsd: 3_600
        },
        bazaar: { resourceCount: 1_000 },
        mpp: {
          reportedTransactions: 2_000,
          reportedVolumeUsd: 500,
          uniqueSenders: 200,
          uniqueRecipients: 40,
          buckets: mppBuckets
        },
        stablecoinChart,
        stablecoinAssets: [
          { symbol: "USDT", currentUsd: 150_000_000_000 },
          { symbol: "USDC", currentUsd: 75_000_000_000 }
        ],
        stablecoinChains: [
          { chain: "A", supplyUsd: 100_000_000_000 },
          { chain: "B", supplyUsd: 2_000_000_000 }
        ],
        dex: {
          volume24hUsd: 1_000,
          volume7dUsd: 7_000,
          volume30dUsd: 30_000,
          change30dPct: 12,
          protocolCount: 100,
          chart: dateRows.map((date) => ({ date, volumeUsd: 1_000 }))
        },
        npmX402,
        npmMpp
      },
      new Date("2026-07-29T23:59:59Z")
    );

    expect(output.verdict.score).toBeGreaterThanOrEqual(0);
    expect(output.verdict.score).toBeLessThanOrEqual(100);
    expect(output.quality.top1TxShare).toBeCloseTo(0.7);
    expect(output.ratios).toHaveLength(6);
    expect(new Set(output.ratios.map((ratio) => ratio.id)).size).toBe(6);
    expect(output.series.npmDaily).toHaveLength(70);
    expect(output.series.npmWeekly.length).toBeGreaterThan(5);
    expect(output.coverage.machine.days).toBe(30);
    expect(output.series.stablecoinSupply.at(-1)).toHaveProperty("supplyUsdMa30");
    expect(output.series.dexDaily.at(-1)).toHaveProperty("volumeUsdMa30");
    expect(output.series.npmWeekly.at(-1)).toHaveProperty("x402Ma4");
    expect(output.rails.supplyGrowth).toHaveProperty("d365");
    expect(output.developer).toHaveProperty("x402Growth13wPct");
    expect(output.analytics.x402CountValueCorrelation).toBeGreaterThanOrEqual(-1);
    expect(output.analytics.x402CountValueCorrelation).toBeLessThanOrEqual(1);
    expect(output.components.find((component) => component.id === "breadth")?.score).toBeLessThanOrEqual(
      70
    );
    expect(output.series.machineDaily.at(-1)).toMatchObject({
      x402Transactions: expect.any(Number),
      mppTransactions: expect.any(Number)
    });
  });
});
