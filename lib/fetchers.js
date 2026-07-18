import {
  parseBazaar,
  parseDexOverview,
  parseMppScan,
  parseNpmRange,
  parseStablecoinAssets,
  parseStablecoinChains,
  parseStablecoinChart,
  parseX402Official,
  parseX402Scan
} from "@/lib/parsers";
import { buildMetrics } from "@/lib/metrics";

const SIX_HOURS = 21_600;
const REQUEST_TIMEOUT_MS = 18_000;

export const SOURCE_REGISTRY = [
  {
    id: "x402scan",
    name: "x402scan",
    category: "Machine payments",
    mode: "live",
    url: "https://www.x402scan.com/",
    definition: "x402 transaction totals, payment value, users, servers, and daily history."
  },
  {
    id: "x402official",
    name: "x402 Foundation",
    category: "Machine payments",
    mode: "headline",
    url: "https://www.x402.org/",
    definition: "Official x402 totals used to check x402scan coverage."
  },
  {
    id: "bazaar",
    name: "Coinbase x402 Bazaar",
    category: "Service breadth",
    mode: "catalog",
    url: "https://docs.cdp.coinbase.com/x402/bazaar",
    definition: "Count of x402 services listed in Coinbase’s public catalog."
  },
  {
    id: "mppscan",
    name: "MPPscan",
    category: "Machine payments",
    mode: "live",
    url: "https://mppscan.com/",
    definition: "MPP transaction totals, payment value, users, and recent history."
  },
  {
    id: "stablecoins",
    name: "DeFiLlama stablecoins",
    category: "Settlement capacity",
    mode: "live",
    url: "https://defillama.com/stablecoins",
    definition: "Stablecoin supply by asset and chain, with daily history."
  },
  {
    id: "dex",
    name: "DeFiLlama DEX volumes",
    category: "Open trading",
    mode: "live",
    url: "https://defillama.com/dexs",
    definition: "Decentralized exchange volume with daily history."
  },
  {
    id: "npm",
    name: "npm downloads",
    category: "Developer interest",
    mode: "live",
    url: "https://github.com/npm/registry/blob/main/docs/download-counts.md",
    definition: "Daily @x402/core and mppx downloads. Downloads do not prove live use."
  },
  {
    id: "authenticity",
    name: "x402 authenticity study",
    category: "Evidence quality",
    mode: "dated",
    url: "https://arxiv.org/abs/2607.12575",
    definition: "July 2026 study of fictitious, internal, and independent x402 activity."
  },
  {
    id: "visa",
    name: "Visa / Artemis benchmark",
    category: "Market benchmark",
    mode: "dated",
    url: "https://www.visa.com/en-us/thought-leadership/innovation/agentic-payments-from-the-ground-up",
    definition: "Adjusted x402 and MPP totals through April 21, 2026."
  }
];

async function fetchResponse(url, responseType = "json") {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: responseType === "json" ? "application/json" : "text/html,*/*",
        "User-Agent": "Open-Economic-Systems-Radar/0.1"
      },
      next: { revalidate: SIX_HOURS }
    });
    if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
    return responseType === "json" ? response.json() : response.text();
  } finally {
    clearTimeout(timer);
  }
}

function dateOnly(date) {
  return date.toISOString().slice(0, 10);
}

function rangeUrl(packageName, now) {
  const end = new Date(now.getTime() - 86_400_000);
  const start = new Date(end.getTime() - 729 * 86_400_000);
  return `https://api.npmjs.org/downloads/range/${dateOnly(start)}:${dateOnly(end)}/${encodeURIComponent(packageName)}`;
}

async function sourceTask(id, run) {
  try {
    const data = await run();
    return { id, ok: true, data };
  } catch (error) {
    return {
      id,
      ok: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

export async function buildPublicSnapshot(now = new Date()) {
  const tasks = await Promise.all([
    sourceTask("x402scan", async () =>
      parseX402Scan(await fetchResponse("https://www.x402scan.com/", "text"))
    ),
    sourceTask("x402official", async () =>
      parseX402Official(await fetchResponse("https://www.x402.org/", "text"))
    ),
    sourceTask("bazaar", async () =>
      parseBazaar(
        await fetchResponse(
          "https://api.cdp.coinbase.com/platform/v2/x402/discovery/resources?limit=20&offset=0"
        )
      )
    ),
    sourceTask("mppscan", async () =>
      parseMppScan(await fetchResponse("https://mppscan.com/", "text"))
    ),
    sourceTask("stablecoinAssets", async () =>
      parseStablecoinAssets(
        await fetchResponse("https://stablecoins.llama.fi/stablecoins?includePrices=true")
      )
    ),
    sourceTask("stablecoinChart", async () =>
      parseStablecoinChart(
        await fetchResponse("https://stablecoins.llama.fi/stablecoincharts/all")
      )
    ),
    sourceTask("stablecoinChains", async () =>
      parseStablecoinChains(
        await fetchResponse("https://stablecoins.llama.fi/stablecoinchains")
      )
    ),
    sourceTask("dex", async () =>
      parseDexOverview(
        await fetchResponse(
          "https://api.llama.fi/overview/dexs?excludeTotalDataChart=false&excludeTotalDataChartBreakdown=true"
        )
      )
    ),
    sourceTask("npmX402", async () =>
      parseNpmRange(await fetchResponse(rangeUrl("@x402/core", now)))
    ),
    sourceTask("npmMpp", async () =>
      parseNpmRange(await fetchResponse(rangeUrl("mppx", now)))
    )
  ]);

  const raw = {};
  for (const task of tasks) {
    if (task.ok) raw[task.id] = task.data;
  }

  const metrics = buildMetrics(
    {
      x402Scan: raw.x402scan,
      x402Official: raw.x402official,
      bazaar: raw.bazaar,
      mpp: raw.mppscan,
      stablecoinAssets: raw.stablecoinAssets,
      stablecoinChart: raw.stablecoinChart,
      stablecoinChains: raw.stablecoinChains,
      dex: raw.dex,
      npmX402: raw.npmX402,
      npmMpp: raw.npmMpp
    },
    now
  );

  const slotStartMs = Math.floor(now.getTime() / (SIX_HOURS * 1000)) * SIX_HOURS * 1000;
  const nextRefreshAt = new Date(slotStartMs + SIX_HOURS * 1000).toISOString();
  const failures = tasks.filter((task) => !task.ok);
  const requiredIds = new Set([
    "x402scan",
    "mppscan",
    "stablecoinChart",
    "dex",
    "npmX402",
    "npmMpp"
  ]);
  const requiredFailures = failures.filter((task) => requiredIds.has(task.id));

  const healthByGroup = {
    x402scan: tasks.find((task) => task.id === "x402scan")?.ok,
    x402official: tasks.find((task) => task.id === "x402official")?.ok,
    bazaar: tasks.find((task) => task.id === "bazaar")?.ok,
    mppscan: tasks.find((task) => task.id === "mppscan")?.ok,
    stablecoins:
      tasks.find((task) => task.id === "stablecoinChart")?.ok &&
      tasks.find((task) => task.id === "stablecoinAssets")?.ok,
    dex: tasks.find((task) => task.id === "dex")?.ok,
    npm:
      tasks.find((task) => task.id === "npmX402")?.ok &&
      tasks.find((task) => task.id === "npmMpp")?.ok,
    authenticity: true,
    visa: true
  };

  return {
    meta: {
      title: "Open Economic Systems Radar",
      generatedAt: now.toISOString(),
      nextRefreshAt,
      cadenceHours: 6,
      refreshWindowsUtc: ["00:00", "06:00", "12:00", "18:00"],
      status: requiredFailures.length ? "partial" : "ready",
      sourceCount: SOURCE_REGISTRY.length,
      healthySourceCount: Object.values(healthByGroup).filter(Boolean).length,
      schemaVersion: "1.2.0",
      methodologyVersion: "0.3.0",
      note:
        "The first request in each six-hour UTC window refreshes the public data."
    },
    ...metrics,
    benchmarks: {
      visaArtemis: {
        asOf: "2026-04-21",
        x402AdjustedTransactions: 109_600_000,
        x402AdjustedVolumeUsd: 15_000_000,
        mppTransactions: 115_000,
        mppVolumeUsd: 25_000
      }
    },
    sourceHealth: SOURCE_REGISTRY.map((source) => ({
      ...source,
      ok: Boolean(healthByGroup[source.id]),
      checkedAt: now.toISOString()
    })),
    failures: failures.map(({ id, error }) => ({ id, error }))
  };
}
