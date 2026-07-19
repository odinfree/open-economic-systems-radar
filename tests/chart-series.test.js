import { describe, expect, it } from "vitest";
import {
  aggregateChartRows,
  availableCadences,
  prepareChartRows,
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
});
