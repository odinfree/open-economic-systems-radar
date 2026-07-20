import { describe, expect, it } from "vitest";
import {
  aggregateChartRows,
  availableCadences,
  prepareChartRows,
  prepareRatioChartRows,
  trendKey
} from "../lib/chart-series";

describe("chart cadence aggregation", () => {
  it("always offers daily, weekly, and monthly, then adds yearly with one year of history", () => {
    expect(
      availableCadences([
        { date: "2026-01-01" },
        { date: "2026-12-31" }
      ])
    ).toEqual(["daily", "weekly", "monthly"]);

    expect(
      availableCadences([
        { date: "2025-01-01" },
        { date: "2026-01-01" }
      ])
    ).toEqual(["daily", "weekly", "monthly", "yearly"]);
  });

  it("sums flow values into Monday-based weekly buckets", () => {
    expect(
      aggregateChartRows(
        [
          { date: "2026-07-13", value: 2 },
          { date: "2026-07-14", value: 3 },
          { date: "2026-07-20", value: 7 }
        ],
        ["value"],
        "weekly",
        "sum"
      )
    ).toEqual([
      { date: "2026-07-13", value: 5 },
      { date: "2026-07-20", value: 7 }
    ]);
  });

  it("uses the closing observation for stock values", () => {
    expect(
      aggregateChartRows(
        [
          { date: "2026-07-01", supply: 100 },
          { date: "2026-07-19", supply: 120 },
          { date: "2026-08-01", supply: 130 }
        ],
        ["supply"],
        "monthly",
        "last"
      )
    ).toEqual([
      { date: "2026-07-01", supply: 120 },
      { date: "2026-08-01", supply: 130 }
    ]);
  });

  it("recalculates the moving mean at the selected cadence", () => {
    const rows = Array.from({ length: 8 }, (_, index) => ({
      date: `2026-07-${String(index + 1).padStart(2, "0")}`,
      value: index + 1
    }));
    const prepared = prepareChartRows(rows, ["value"], "daily", "sum");
    expect(prepared.at(-1)[trendKey("value")]).toBe(5);
  });

  it("calculates density from period sums instead of averaging daily ratios", () => {
    const prepared = prepareRatioChartRows(
      [
        { date: "2026-07-13", value: 100, records: 10 },
        { date: "2026-07-14", value: 100, records: 90 }
      ],
      {
        numeratorKey: "value",
        denominatorKey: "records",
        outputKey: "density",
        multiplier: 1_000
      },
      "weekly"
    );

    expect(prepared).toHaveLength(1);
    expect(prepared[0].density).toBe(2_000);
    expect(prepared[0][trendKey("density")]).toBe(2_000);
  });

  it("calculates the density trend from rolling sums instead of mean ratios", () => {
    const prepared = prepareRatioChartRows(
      [
        { date: "2026-07-06", value: 100, records: 10 },
        { date: "2026-07-13", value: 100, records: 90 }
      ],
      {
        numeratorKey: "value",
        denominatorKey: "records",
        outputKey: "density",
        multiplier: 1_000
      },
      "weekly"
    );

    expect(prepared.at(-1).density).toBeCloseTo(1_111.11, 2);
    expect(prepared.at(-1)[trendKey("density")]).toBe(2_000);
  });

  it("keeps explicit data gaps out of daily totals", () => {
    const prepared = prepareChartRows(
      [{ date: "2026-07-12", value: null }],
      ["value"],
      "daily",
      "sum"
    );

    expect(prepared[0].value).toBeUndefined();
    expect(prepared[0][trendKey("value")]).toBeNull();
  });
});
