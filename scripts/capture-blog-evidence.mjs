import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const sourceUrl = process.argv[2] || process.env.RADAR_SNAPSHOT_URL;
if (!sourceUrl) {
  throw new Error(
    "Pass the radar snapshot URL as an argument or RADAR_SNAPSHOT_URL"
  );
}
const outputPath = path.resolve(
  process.cwd(),
  process.argv[3] || "data/open-economic-systems-2026-07-20.json"
);

const response = await fetch(sourceUrl, {
  headers: {
    accept: "application/json"
  }
});

if (!response.ok) {
  throw new Error(`Snapshot request failed with ${response.status}`);
}

const snapshot = await response.json();

if (snapshot?.meta?.status !== "ready") {
  throw new Error("Refusing to publish a partial evidence snapshot");
}

const articleSourceIds = [
  "x402scan",
  "x402official",
  "mppscan",
  "stablecoins",
  "npm",
  "authenticity"
];
const articleSources = articleSourceIds.map((id) =>
  snapshot.sourceHealth?.find((source) => source.id === id)
);
const unavailableArticleSourceIds = articleSourceIds.filter(
  (id) => !snapshot.sourceHealth?.find((source) => source.id === id)?.ok
);
if (unavailableArticleSourceIds.length > 0) {
  throw new Error(
    `Refusing to capture unavailable article sources: ${unavailableArticleSourceIds.join(
      ", "
    )}`
  );
}

const authenticity = snapshot.quality.authenticityBenchmark;
const topOne = snapshot.quality.top1TxShare;
const topFive = snapshot.quality.top5TxShare;
const npmDaily = snapshot.series.npmDaily;
const machineDaily = snapshot.series.machineDaily;
const firstX402PackageDate = npmDaily.find((row) => Number(row.x402 || 0) > 0)?.date;
const firstMppPackageDate = npmDaily.find((row) => Number(row.mpp || 0) > 0)?.date;
const bothPackagesActiveFrom =
  firstX402PackageDate && firstMppPackageDate
    ? [firstX402PackageDate, firstMppPackageDate].sort().at(-1)
    : null;
const packageGapDates = npmDaily
  .filter(
    (row) =>
      bothPackagesActiveFrom &&
      row.date >= bothPackagesActiveFrom &&
      Number(row.x402 || 0) === 0 &&
      Number(row.mpp || 0) === 0
  )
  .map((row) => row.date);
const packageGapSet = new Set(packageGapDates);
const packageWindowDays = 28;
const latestPackageRows = npmDaily.slice(-packageWindowDays);
const packageObservedDays = latestPackageRows.filter(
  (row) => !packageGapSet.has(row.date)
).length;
const latestX402Rows = machineDaily.slice(-7);
const x402Value7dUsd = latestX402Rows.reduce(
  (sum, row) => sum + Number(row.x402VolumeUsd || 0),
  0
);
const x402Records7d = latestX402Rows.reduce(
  (sum, row) => sum + Number(row.x402Transactions || 0),
  0
);
const mppObservedDays = machineDaily.filter(
  ({ mppVolumeUsd, mppTransactions }) =>
    Number(mppVolumeUsd || 0) > 0 || Number(mppTransactions || 0) > 0
).length;

const articleEvidence = {
  meta: {
    capturedAt: new Date().toISOString(),
    generatedAt: snapshot.meta.generatedAt,
    methodologyVersion: snapshot.meta.methodologyVersion,
    schemaVersion: snapshot.meta.schemaVersion,
    sourceHealth: `${snapshot.meta.healthySourceCount}/${snapshot.meta.sourceCount}`,
    articleSourceHealth: `${articleSources.length}/${articleSources.length}`,
    status: snapshot.meta.status
  },
  bullish: {
    stablecoins: {
      currentSupplyUsd: snapshot.headline.stablecoinSupplyUsd,
      growth1yPct: snapshot.analytics.stablecoinSupplyGrowth1yPct,
      growth90dPct: snapshot.analytics.stablecoinSupplyGrowth90dPct,
      chainsOver1b: snapshot.rails.chainsOver1b,
      coverage: snapshot.coverage.stablecoins,
      series: snapshot.series.stablecoinSupply.map(({ date, supplyUsd }) => ({
        date,
        supplyUsd
      }))
    },
    packages: {
      x402Fetches28d: snapshot.packageActivity.x402Downloads28d,
      mppFetches28d: snapshot.packageActivity.mppDownloads28d,
      evidenceGrade: snapshot.packageActivity.evidenceGrade,
      uniqueDevelopersAvailable: snapshot.packageActivity.uniqueDevelopersAvailable,
      windowDays: packageWindowDays,
      observedDays: packageObservedDays,
      gapDates: packageGapDates,
      coverage: snapshot.coverage.npm,
      series: npmDaily.map(({ date, x402, mpp }) => ({
        date,
        x402: packageGapSet.has(date) ? null : x402,
        mpp: packageGapSet.has(date) ? null : mpp
      }))
    },
    paymentDensity: {
      valuePerThousand7d:
        x402Records7d > 0 ? (x402Value7dUsd / x402Records7d) * 1_000 : 0,
      paymentValue7dUsd: x402Value7dUsd,
      paymentRecords7d: x402Records7d,
      excludedMppObservedDays: mppObservedDays,
      coverage: snapshot.coverage.machine,
      series: machineDaily.map(
        ({ date, x402VolumeUsd, x402Transactions }) => ({
          date,
          volumeUsd: Number(x402VolumeUsd || 0),
          records: Number(x402Transactions || 0)
        })
      )
    }
  },
  bearish: {
    authenticity: {
      windowDays: authenticity.windowDays,
      coverage: {
        start: "2025-09-17",
        end: "2026-06-23"
      },
      totalBaseVolumeUsd: authenticity.totalBaseVolumeUsd,
      independentValueFloorShare: authenticity.independentValueFloorShare,
      independentValueCeilingShare: authenticity.independentValueCeilingShare,
      segments: [
        {
          label: "Fictitious",
          value: authenticity.fictitiousTxShare
        },
        {
          label: "Internal cluster",
          value: authenticity.internalClusterShare
        },
        {
          label: "Unattributed",
          value:
            1 -
            authenticity.fictitiousTxShare -
            authenticity.internalClusterShare
        }
      ]
    },
    concentration: {
      window: "x402scan 30-day explorer window",
      transactions: snapshot.protocols.x402.transactions30d,
      segments: [
        {
          label: "Largest listed server",
          value: topOne
        },
        {
          label: "Servers 2 to 5",
          value: topFive - topOne
        },
        {
          label: "All other servers",
          value: 1 - topFive
        }
      ]
    },
    providerGap: {
      window: "Current reported 30-day totals",
      transactionRatio: snapshot.quality.providerTxGap,
      volumeRatio: snapshot.quality.providerVolumeGap,
      comparisons: [
        {
          label: "Transactions",
          valueType: "number",
          x402scan: snapshot.protocols.x402.transactions30d,
          official: snapshot.protocols.x402.officialTransactions30d
        },
        {
          label: "Payment value",
          valueType: "currency",
          x402scan: snapshot.protocols.x402.volume30dUsd,
          official: snapshot.protocols.x402.officialVolume30dUsd
        }
      ]
    }
  },
  sources: [
    {
      label: "Live Open Economic Systems Radar",
      url: "/"
    },
    {
      label: "Frozen evidence snapshot",
      url: "https://github.com/odinfree/open-economic-systems-radar/blob/main/data/open-economic-systems-2026-07-20.json"
    },
    {
      label: "npm download-count methodology",
      url: "https://github.com/npm/registry/blob/main/docs/download-counts.md"
    },
    {
      label: "x402 authenticity study",
      url: "https://arxiv.org/abs/2607.12575"
    },
    {
      label: "x402 Foundation",
      url: "https://www.x402.org/"
    },
    {
      label: "x402scan",
      url: "https://www.x402scan.com/"
    },
    {
      label: "DeFiLlama stablecoins",
      url: "https://defillama.com/stablecoins"
    }
  ]
};

await mkdir(path.dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(articleEvidence, null, 2)}\n`);

console.log(
  `Captured ${articleEvidence.meta.generatedAt} evidence to ${outputPath}`
);
