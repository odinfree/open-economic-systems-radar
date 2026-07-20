import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import evidence from "../data/open-economic-systems-2026-07-20.json";

describe("blog evidence contract", () => {
  it("publishes a complete dated snapshot with three claims on each side", () => {
    expect(evidence.meta.status).toBe("ready");
    expect(evidence.meta.articleSourceHealth).toBe("6/6");
    expect(Object.keys(evidence.bullish)).toHaveLength(3);
    expect(Object.keys(evidence.bearish)).toHaveLength(3);
  });

  it("keeps package fetches separate from people and integrations", () => {
    expect(evidence.bullish.packages.evidenceGrade).toBe("LOW");
    expect(evidence.bullish.packages.uniqueDevelopersAvailable).toBe(false);
  });

  it("records the mixed explorer coverage behind payment density", () => {
    expect(evidence.bullish.paymentDensity.coverage.days).toBe(31);
    expect(evidence.bullish.paymentDensity.excludedMppObservedDays).toBe(8);
  });

  it("marks shared npm registry gaps as missing observations", () => {
    const packages = evidence.bullish.packages;
    expect(packages.observedDays).toBeLessThan(packages.windowDays);
    expect(packages.gapDates).toContain("2026-07-12");
    expect(
      packages.series.find((row) => row.date === "2026-07-12")
    ).toMatchObject({ x402: null, mpp: null });
  });

  it("keeps fixed-window shares internally consistent", () => {
    const authenticityTotal = evidence.bearish.authenticity.segments.reduce(
      (sum, segment) => sum + segment.value,
      0
    );
    const concentrationTotal = evidence.bearish.concentration.segments.reduce(
      (sum, segment) => sum + segment.value,
      0
    );

    expect(authenticityTotal).toBeCloseTo(1);
    expect(concentrationTotal).toBeCloseTo(1);
    expect(evidence.bearish.providerGap.transactionRatio).toBeGreaterThan(1);
    expect(evidence.bearish.providerGap.volumeRatio).toBeGreaterThan(1);
  });

  it("keeps personal names out of the public article", async () => {
    const page = await readFile(
      new URL("../app/blog/page.jsx", import.meta.url),
      "utf8"
    );
    expect(page.toLowerCase()).not.toMatch(/olivier|freuler/);
    expect(JSON.stringify(evidence.sources).toLowerCase()).not.toMatch(
      /olivier|freuler/
    );
  });
});
