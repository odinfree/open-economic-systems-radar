import { describe, expect, it } from "vitest";
import {
  parseBazaar,
  parseCompactNumber,
  parseMppScan,
  parseX402Official,
  parseX402Scan
} from "../lib/parsers";

describe("public source parsers", () => {
  it("parses compact public counters", () => {
    expect(parseCompactNumber("75.41M")).toBe(75_410_000);
    expect(parseCompactNumber("$24.24M")).toBe(24_240_000);
    expect(parseCompactNumber("94.06K")).toBe(94_060);
  });

  it("parses x402scan summary, buckets, and server concentration rows", () => {
    const html = `
      <script>self.__next_f.push([1,"52:{\\"json\\":{\\"total_transactions\\":1000,\\"total_amount\\":250000000,\\"unique_buyers\\":80,\\"unique_sellers\\":30,\\"latest_block_timestamp\\":\\"2026-07-18T10:00:00.000Z\\"}}"])</script>
      <script>self.__next_f.push([1,"53:{\\"json\\":[{\\"bucket_start\\":\\"2026-07-17T00:00:00.000Z\\",\\"total_transactions\\":400,\\"total_amount\\":100000000,\\"unique_buyers\\":30,\\"unique_sellers\\":20}]}"])</script>
      <script>self.__next_f.push([1,"4c:{\\"json\\":{\\"items\\":[{\\"recipients\\":[\\"0x1\\"],\\"tx_count\\":700,\\"total_amount\\":175000000,\\"latest_block_timestamp\\":\\"2026-07-18T09:00:00.000Z\\",\\"unique_buyers\\":20}]}}"])</script>
    `;
    const parsed = parseX402Scan(html);
    expect(parsed.transactions30d).toBe(1000);
    expect(parsed.volume30dUsd).toBe(250);
    expect(parsed.buckets).toHaveLength(1);
    expect(parsed.buckets[0].volumeUsd).toBe(100);
    expect(parsed.topServers[0].transactions).toBe(700);
  });

  it("parses official x402 headline stats", () => {
    const html = `
      <h2 class="counter">75.41M</h2><div>Transactions</div>
      <h2 class="counter">$24.24M</h2><div>Volume</div>
      <h2 class="counter">94.06K</h2><div>Buyers</div>
      <h2 class="counter">22K</h2><div>Sellers</div>
    `;
    const parsed = parseX402Official(html);
    expect(parsed.transactions30d).toBe(75_410_000);
    expect(parsed.volume30dUsd).toBe(24_240_000);
    expect(parsed.sellers30d).toBe(22_000);
  });

  it("parses MPPscan summary and recent buckets", () => {
    const html = `
      <script>{\\"totalTransactions\\":154473,\\"totalVolume\\":29079.587039,\\"uniqueSenders\\":14567,\\"uniqueRecipients\\":471}</script>
      <script>{\\"bucket_start\\":\\"2026-07-18T08:00:00.000Z\\",\\"total_transactions\\":3818,\\"total_volume\\":576.386984,\\"unique_senders\\":1324,\\"unique_recipients\\":88}</script>
    `;
    const parsed = parseMppScan(html);
    expect(parsed.reportedTransactions).toBe(154_473);
    expect(parsed.reportedVolumeUsd).toBeCloseTo(29_079.587039);
    expect(parsed.buckets[0].recipients).toBe(88);
  });

  it("keeps Bazaar catalog totals separate from the newest sample", () => {
    const parsed = parseBazaar({
      items: [
        {
          resource: "https://example.com/paid",
          serviceName: "Example",
          lastUpdated: "2026-07-18T00:00:00Z",
          accepts: [{ network: "eip155:8453", amount: "1000", payTo: "0x1" }],
          quality: { l30DaysTotalCalls: 42, l30DaysUniquePayers: 7 }
        }
      ],
      pagination: { total: 24_816 }
    });
    expect(parsed.resourceCount).toBe(24_816);
    expect(parsed.newestSample).toHaveLength(1);
    expect(parsed.newestSample[0].calls30d).toBe(42);
  });
});
