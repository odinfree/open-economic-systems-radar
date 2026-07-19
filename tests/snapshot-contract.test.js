import { describe, expect, it } from "vitest";
import {
  ADOPTION_METRICS,
  applyRequiredSourceStatus,
  snapshotCacheControl
} from "../lib/schema.js";

describe("snapshot contract", () => {
  it("pauses the score when a required source is unavailable", () => {
    const metrics = {
      verdict: {
        score: 55,
        scoreAvailable: true,
        state: "WATCH",
        confidence: "MODERATE",
        summary: "Complete snapshot."
      }
    };
    const partial = applyRequiredSourceStatus(metrics, [{ id: "dex" }]);

    expect(partial.verdict).toMatchObject({
      score: 55,
      scoreAvailable: false,
      state: "DATA GAP",
      confidence: "LOW"
    });
    expect(applyRequiredSourceStatus(metrics, [])).toBe(metrics);
  });

  it("does not cache partial snapshots", () => {
    expect(snapshotCacheControl("partial")).toBe("no-store");
    expect(snapshotCacheControl("ready")).toContain("s-maxage=21600");
  });

  it("keeps adoption outcomes explicitly unavailable", () => {
    expect(ADOPTION_METRICS).toHaveLength(4);
    expect(ADOPTION_METRICS.every((metric) => metric.available === false)).toBe(true);
    expect(ADOPTION_METRICS.map((metric) => metric.role)).not.toContain("PRIMARY");
  });
});
