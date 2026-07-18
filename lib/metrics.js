const DAY_MS = 86_400_000;

export function safeDivide(numerator, denominator, fallback = 0) {
  return denominator ? numerator / denominator : fallback;
}

export function pctChange(current, previous) {
  return previous ? ((current - previous) / previous) * 100 : 0;
}

export function clamp(value, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

export function mean(values) {
  if (!values?.length) return 0;
  return values.reduce((sum, value) => sum + Number(value || 0), 0) / values.length;
}

export function addMovingAverage(rows, field, targetField, windowSize) {
  return (rows || []).map((row, index, series) => {
    const window = series
      .slice(Math.max(0, index - windowSize + 1), index + 1)
      .map((item) => Number(item[field] || 0));
    return { ...row, [targetField]: mean(window) };
  });
}

export function trailingWindowChange(rows, field, windowSize) {
  const series = rows || [];
  const current = series
    .slice(-windowSize)
    .reduce((sum, row) => sum + Number(row[field] || 0), 0);
  const previous = series
    .slice(-windowSize * 2, -windowSize)
    .reduce((sum, row) => sum + Number(row[field] || 0), 0);
  return {
    current,
    previous,
    changePct: pctChange(current, previous),
    complete: series.length >= windowSize * 2
  };
}

export function seriesCoverage(rows) {
  if (!rows?.length) return { start: null, end: null, days: 0, points: 0 };
  const start = rows[0].date;
  const end = rows.at(-1).date;
  return {
    start,
    end,
    days: Math.round((new Date(end).getTime() - new Date(start).getTime()) / DAY_MS) + 1,
    points: rows.length
  };
}

export function standardDeviation(values) {
  if (!values?.length) return 0;
  const average = mean(values);
  const variance =
    values.reduce((sum, value) => sum + (Number(value || 0) - average) ** 2, 0) /
    values.length;
  return Math.sqrt(variance);
}

export function windowShiftZ(rows, field, currentDays = 7, baselineDays = 21) {
  const required = currentDays + baselineDays;
  const sample = (rows || []).slice(-required);
  if (sample.length < required) {
    return { zScore: 0, currentMean: 0, baselineMean: 0, observations: sample.length };
  }
  const baseline = sample.slice(0, baselineDays).map((row) => Number(row[field] || 0));
  const current = sample.slice(-currentDays).map((row) => Number(row[field] || 0));
  const baselineMean = mean(baseline);
  const deviation = standardDeviation(baseline);
  const currentMean = mean(current);
  return {
    zScore: deviation ? (currentMean - baselineMean) / deviation : 0,
    currentMean,
    baselineMean,
    observations: sample.length
  };
}

export function pearsonCorrelation(rows, xField, yField) {
  const pairs = (rows || [])
    .map((row) => [Number(row[xField]), Number(row[yField])])
    .filter(([x, y]) => Number.isFinite(x) && Number.isFinite(y));
  if (pairs.length < 2) return 0;
  const xMean = mean(pairs.map(([x]) => x));
  const yMean = mean(pairs.map(([, y]) => y));
  const numerator = pairs.reduce(
    (sum, [x, y]) => sum + (x - xMean) * (y - yMean),
    0
  );
  const xSpread = Math.sqrt(
    pairs.reduce((sum, [x]) => sum + (x - xMean) ** 2, 0)
  );
  const ySpread = Math.sqrt(
    pairs.reduce((sum, [, y]) => sum + (y - yMean) ** 2, 0)
  );
  return xSpread && ySpread ? numerator / (xSpread * ySpread) : 0;
}

export function scaleScore(value, low, neutral, high) {
  if (!Number.isFinite(value)) return 0;
  if (value <= neutral) {
    return clamp(((value - low) / (neutral - low || 1)) * 50);
  }
  return clamp(50 + ((value - neutral) / (high - neutral || 1)) * 50);
}

export function aggregateDaily(buckets, fields) {
  const byDay = new Map();
  for (const row of buckets || []) {
    const date = String(row.timestamp || row.date).slice(0, 10);
    if (!date) continue;
    const current = byDay.get(date) || { date };
    for (const field of fields) {
      current[field] = (current[field] || 0) + Number(row[field] || 0);
    }
    byDay.set(date, current);
  }
  return [...byDay.values()].sort((a, b) => a.date.localeCompare(b.date));
}

export function sumBetween(rows, field, start, end) {
  const from = new Date(start).getTime();
  const to = new Date(end).getTime();
  return (rows || []).reduce((sum, row) => {
    const timestamp = new Date(row.timestamp || row.date).getTime();
    return timestamp >= from && timestamp < to ? sum + Number(row[field] || 0) : sum;
  }, 0);
}

export function rollingComparison(rows, field, days, now = new Date()) {
  const end = now.getTime();
  const currentStart = end - days * DAY_MS;
  const previousStart = currentStart - days * DAY_MS;
  const current = sumBetween(rows, field, previousStart + days * DAY_MS, end);
  const previous = sumBetween(rows, field, previousStart, currentStart);
  return { current, previous, changePct: pctChange(current, previous) };
}

export function weeklySeries(rows, field) {
  const weeks = new Map();
  for (const row of rows || []) {
    const date = new Date(`${row.date}T00:00:00Z`);
    const day = date.getUTCDay();
    const mondayOffset = day === 0 ? -6 : 1 - day;
    date.setUTCDate(date.getUTCDate() + mondayOffset);
    const week = date.toISOString().slice(0, 10);
    weeks.set(week, (weeks.get(week) || 0) + Number(row[field] || 0));
  }
  return [...weeks.entries()]
    .map(([date, value]) => ({ date, value }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

function nearestDaysAgo(rows, field, days) {
  if (!rows?.length) return 0;
  const target = new Date(rows.at(-1).date).getTime() - days * DAY_MS;
  let best = rows[0];
  let distance = Infinity;
  for (const row of rows) {
    const candidate = Math.abs(new Date(row.date).getTime() - target);
    if (candidate < distance) {
      distance = candidate;
      best = row;
    }
  }
  return Number(best[field] || 0);
}

function recentSum(rows, days) {
  return (rows || []).slice(-days).reduce((sum, row) => sum + Number(row.downloads || 0), 0);
}

export function buildMetrics(raw, now = new Date()) {
  const x402 = raw.x402Scan;
  const x402Official = raw.x402Official;
  const mpp = raw.mpp;
  const stableSeries = raw.stablecoinChart || [];
  const stableAssets = raw.stablecoinAssets || [];
  const stableChains = raw.stablecoinChains || [];
  const dex = raw.dex;
  const npmX402 = raw.npmX402 || [];
  const npmMpp = raw.npmMpp || [];

  const x402Tx = rollingComparison(x402?.buckets || [], "transactions", 7, now);
  const x402Volume = rollingComparison(x402?.buckets || [], "volumeUsd", 7, now);
  const mppTx3d = rollingComparison(mpp?.buckets || [], "transactions", 3, now);
  const mppVolume3d = rollingComparison(mpp?.buckets || [], "volumeUsd", 3, now);
  const mppDaily = aggregateDaily(mpp?.buckets || [], ["transactions", "volumeUsd"]);
  const x402Daily = aggregateDaily(x402?.buckets || [], ["transactions", "volumeUsd"]);

  const machineDailyMap = new Map();
  function addMachineRows(rows, protocol) {
    for (const row of rows) {
      const current = machineDailyMap.get(row.date) || {
        date: row.date,
        x402Transactions: 0,
        x402VolumeUsd: 0,
        mppTransactions: 0,
        mppVolumeUsd: 0
      };
      if (protocol === "mpp") {
        current.mppTransactions += Number(row.transactions || 0);
        current.mppVolumeUsd += Number(row.volumeUsd || 0);
      } else {
        current.x402Transactions += Number(row.transactions || 0);
        current.x402VolumeUsd += Number(row.volumeUsd || 0);
      }
      machineDailyMap.set(row.date, current);
    }
  }
  addMachineRows(x402Daily, "x402");
  addMachineRows(mppDaily, "mpp");
  const machineDaily = [...machineDailyMap.values()].sort((a, b) =>
    a.date.localeCompare(b.date)
  );

  const latestSupply = Number(stableSeries.at(-1)?.supplyUsd || 0);
  const supply1d = nearestDaysAgo(stableSeries, "supplyUsd", 1);
  const supply7d = nearestDaysAgo(stableSeries, "supplyUsd", 7);
  const supply30d = nearestDaysAgo(stableSeries, "supplyUsd", 30);
  const supply90d = nearestDaysAgo(stableSeries, "supplyUsd", 90);
  const supply365d = nearestDaysAgo(stableSeries, "supplyUsd", 365);
  const supplyGrowth = {
    d1: pctChange(latestSupply, supply1d),
    d7: pctChange(latestSupply, supply7d),
    d30: pctChange(latestSupply, supply30d),
    d90: pctChange(latestSupply, supply90d),
    d365: pctChange(latestSupply, supply365d)
  };

  const totalAssetSupply = stableAssets.reduce((sum, row) => sum + row.currentUsd, 0);
  const assetShare = (symbol) =>
    safeDivide(
      stableAssets.find((row) => row.symbol === symbol)?.currentUsd || 0,
      totalAssetSupply
    );

  const x402Last28 = recentSum(npmX402, 28);
  const x402Prev28 = npmX402
    .slice(-56, -28)
    .reduce((sum, row) => sum + Number(row.downloads || 0), 0);
  const mppLast28 = recentSum(npmMpp, 28);
  const mppPrev28 = npmMpp
    .slice(-56, -28)
    .reduce((sum, row) => sum + Number(row.downloads || 0), 0);
  const npmGrowth = {
    x402: pctChange(x402Last28, x402Prev28),
    mpp: pctChange(mppLast28, mppPrev28)
  };

  const npmWeeklyMap = new Map();
  for (const row of weeklySeries(npmX402.map((d) => ({ ...d, value: d.downloads })), "value")) {
    npmWeeklyMap.set(row.date, { date: row.date, x402: row.value, mpp: 0 });
  }
  for (const row of weeklySeries(npmMpp.map((d) => ({ ...d, value: d.downloads })), "value")) {
    const current = npmWeeklyMap.get(row.date) || { date: row.date, x402: 0, mpp: 0 };
    current.mpp = row.value;
    npmWeeklyMap.set(row.date, current);
  }
  const npmWeekly = [...npmWeeklyMap.values()].sort((a, b) =>
    a.date.localeCompare(b.date)
  );
  const x402Growth13w = trailingWindowChange(npmWeekly, "x402", 13);
  const mppGrowth13w = trailingWindowChange(npmWeekly, "mpp", 13);
  const x402Growth52w = trailingWindowChange(npmWeekly, "x402", 52);
  const mppGrowth52w = trailingWindowChange(npmWeekly, "mpp", 52);
  const dex90d = trailingWindowChange(dex?.chart || [], "volumeUsd", 90);
  const dex365d = trailingWindowChange(dex?.chart || [], "volumeUsd", 365);

  const top1TxShare = safeDivide(
    x402?.topServers?.[0]?.transactions || 0,
    x402?.transactions30d || 0
  );
  const top5TxShare = safeDivide(
    (x402?.topServers || [])
      .slice(0, 5)
      .reduce((sum, row) => sum + row.transactions, 0),
    x402?.transactions30d || 0
  );
  const providerTxGap = safeDivide(
    x402Official?.transactions30d || 0,
    x402?.transactions30d || 0
  );
  const providerVolumeGap = safeDivide(
    x402Official?.volume30dUsd || 0,
    x402?.volume30dUsd || 0
  );

  const machineMomentumValue =
    0.7 * x402Volume.changePct + 0.3 * mppVolume3d.changePct;
  const developerMomentumValue = 0.65 * npmGrowth.x402 + 0.35 * npmGrowth.mpp;
  const qualityValue =
    100 -
    top1TxShare * 75 -
    Math.min(Math.abs(Math.log2(Math.max(providerTxGap, 0.01))), 5) * 8;
  const availability = {
    machine: Boolean(raw.x402Scan || raw.mpp),
    rails: stableSeries.length > 0,
    markets: Boolean(raw.dex),
    developers: npmX402.length > 0 || npmMpp.length > 0,
    breadth: Boolean(raw.x402Scan),
    quality: Boolean(raw.x402Scan && raw.x402Official)
  };

  const components = [
    {
      id: "machine",
      label: "Machine-payment momentum",
      weight: 0.3,
      value: machineMomentumValue,
      available: availability.machine,
      score: availability.machine
        ? scaleScore(machineMomentumValue, -40, 0, 60)
        : 0,
      detail: "x402 7d volume change plus MPP recent-volume change"
    },
    {
      id: "rails",
      label: "Stablecoin rail capacity",
      weight: 0.2,
      value: supplyGrowth.d30,
      available: availability.rails,
      score: availability.rails ? scaleScore(supplyGrowth.d30, -5, 0, 12) : 0,
      detail: "30d stablecoin supply growth"
    },
    {
      id: "markets",
      label: "Open-market activity",
      weight: 0.15,
      value: dex?.change30dPct || 0,
      available: availability.markets,
      score: availability.markets
        ? scaleScore(dex?.change30dPct || 0, -30, 0, 50)
        : 0,
      detail: "DEX volume versus the prior 30d"
    },
    {
      id: "developers",
      label: "Developer pull",
      weight: 0.15,
      value: developerMomentumValue,
      available: availability.developers,
      score: availability.developers
        ? scaleScore(developerMomentumValue, -30, 0, 70)
        : 0,
      detail: "canonical x402 and MPP npm downloads, latest 4w versus prior 4w"
    },
    {
      id: "breadth",
      label: "Counterparty breadth",
      weight: 0.1,
      value: x402?.sellers30d || 0,
      available: availability.breadth,
      score: availability.breadth
        ? clamp(
            Math.log10(Math.max(x402?.sellers30d || 1, 1)) * 15,
            0,
            70
          )
        : 0,
      detail:
        "observed x402 seller addresses; capped at 70 until independent merchants are verified"
    },
    {
      id: "quality",
      label: "Evidence quality",
      weight: 0.1,
      value: qualityValue,
      available: availability.quality,
      score: availability.quality ? clamp(qualityValue) : 0,
      detail: "penalizes top-server concentration and provider disagreement"
    }
  ];
  const score = Math.round(
    components.reduce((sum, component) => sum + component.score * component.weight, 0)
  );
  const positiveComponents = components.filter((component) => component.score >= 60).length;
  const state =
    score >= 70 && components[0].score >= 60 && positiveComponents >= 3
      ? "BREAKOUT"
      : score >= 55
        ? "WATCH"
        : score >= 40
          ? "EARLY BUILD"
          : "QUIET";

  const machineVolume7d =
    x402Volume.current +
    sumBetween(mpp?.buckets || [], "volumeUsd", now.getTime() - 7 * DAY_MS, now);
  const machineTransactions7d =
    x402Tx.current +
    sumBetween(mpp?.buckets || [], "transactions", now.getTime() - 7 * DAY_MS, now);
  const mppVolume7d = sumBetween(
    mpp?.buckets || [],
    "volumeUsd",
    now.getTime() - 7 * DAY_MS,
    now
  );
  const x402ValueAnomaly = windowShiftZ(x402Daily, "volumeUsd");
  const x402CountValueCorrelation = pearsonCorrelation(
    x402Daily.slice(-30),
    "transactions",
    "volumeUsd"
  );
  const machineSeries = addMovingAverage(
    addMovingAverage(
      addMovingAverage(
        addMovingAverage(machineDaily, "x402VolumeUsd", "x402VolumeUsdMa7", 7),
        "mppVolumeUsd",
        "mppVolumeUsdMa7",
        7
      ),
      "x402Transactions",
      "x402TransactionsMa7",
      7
    ),
    "mppTransactions",
    "mppTransactionsMa7",
    7
  );
  const stablecoinSeries = addMovingAverage(
    stableSeries.slice(-548),
    "supplyUsd",
    "supplyUsdMa30",
    30
  );
  const dexSeries = addMovingAverage(
    (dex?.chart || []).slice(-548),
    "volumeUsd",
    "volumeUsdMa30",
    30
  );
  const npmSeries = addMovingAverage(
    addMovingAverage(npmWeekly.slice(-80), "x402", "x402Ma4", 4),
    "mpp",
    "mppMa4",
    4
  );

  return {
    verdict: {
      score,
      state,
      positiveComponents,
      confidence:
        providerTxGap > 1.25 || providerTxGap < 0.8 ? "CONTESTED" : "MODERATE",
      summary:
        state === "BREAKOUT"
          ? "Multiple leading and economic indicators are accelerating together."
          : state === "WATCH"
            ? "Several leading indicators are rising, but economic confirmation is incomplete."
            : state === "EARLY BUILD"
              ? "Infrastructure and developer activity are building ahead of broad economic use."
              : "No broad shift is visible across independent indicators."
    },
    components,
    headline: {
      machineVolume7d,
      machineTransactions7d,
      stablecoinSupplyUsd: latestSupply,
      dexVolume30dUsd: dex?.volume30dUsd || 0,
      x402Buyers30d: x402?.buyers30d || 0,
      x402Sellers30d: x402?.sellers30d || 0
    },
    protocols: {
      x402: {
        transactions30d: x402?.transactions30d || 0,
        volume30dUsd: x402?.volume30dUsd || 0,
        buyers30d: x402?.buyers30d || 0,
        sellers30d: x402?.sellers30d || 0,
        avgPaymentUsd: safeDivide(x402?.volume30dUsd, x402?.transactions30d),
        transactionsPerBuyer: safeDivide(x402?.transactions30d, x402?.buyers30d),
        top1TxShare,
        top5TxShare,
        volume7dUsd: x402Volume.current,
        tx7d: x402Tx.current,
        volumeChange7dPct: x402Volume.changePct,
        txChange7dPct: x402Tx.changePct,
        officialTransactions30d: x402Official?.transactions30d || 0,
        officialVolume30dUsd: x402Official?.volume30dUsd || 0,
        providerTxGap,
        providerVolumeGap
      },
      mpp: {
        reportedTransactions: mpp?.reportedTransactions || 0,
        reportedVolumeUsd: mpp?.reportedVolumeUsd || 0,
        uniqueSenders: mpp?.uniqueSenders || 0,
        uniqueRecipients: mpp?.uniqueRecipients || 0,
        avgPaymentUsd: safeDivide(mpp?.reportedVolumeUsd, mpp?.reportedTransactions),
        transactionsPerSender: safeDivide(mpp?.reportedTransactions, mpp?.uniqueSenders),
        recentVolumeChangePct: mppVolume3d.changePct,
        recentTxChangePct: mppTx3d.changePct
      },
      bazaar: {
        resourceCount: raw.bazaar?.resourceCount || 0,
        newestUpdatedAt: raw.bazaar?.newestUpdatedAt || null
      }
    },
    rails: {
      stablecoinSupplyUsd: latestSupply,
      supplyGrowth,
      chainsOver100m: stableChains.filter((row) => row.supplyUsd >= 1e8).length,
      chainsOver1b: stableChains.filter((row) => row.supplyUsd >= 1e9).length,
      usdtShare: assetShare("USDT"),
      usdcShare: assetShare("USDC"),
      dexVolume24hUsd: dex?.volume24hUsd || 0,
      dexVolume7dUsd: dex?.volume7dUsd || 0,
      dexVolume30dUsd: dex?.volume30dUsd || 0,
      dexChange30dPct: dex?.change30dPct || 0,
      dexProtocols: dex?.protocolCount || 0,
      dexTurnover30d: safeDivide(dex?.volume30dUsd, latestSupply)
    },
    developer: {
      x402Downloads28d: x402Last28,
      mppDownloads28d: mppLast28,
      x402GrowthPct: npmGrowth.x402,
      mppGrowthPct: npmGrowth.mpp,
      x402Growth13wPct: x402Growth13w.changePct,
      mppGrowth13wPct: mppGrowth13w.changePct,
      x402Growth52wPct: x402Growth52w.changePct,
      mppGrowth52wPct: mppGrowth52w.changePct
    },
    analytics: {
      x402ValueAnomaly,
      x402CountValueCorrelation,
      machineValuePerThousandPayments:
        safeDivide(machineVolume7d, machineTransactions7d) * 1_000,
      mppMachineValueShare: safeDivide(mppVolume7d, machineVolume7d),
      stablecoinSupplyGrowth90dPct: supplyGrowth.d90,
      stablecoinSupplyGrowth1yPct: supplyGrowth.d365,
      dexVolume90dChangePct: dex90d.changePct,
      dexVolume1yChangePct: dex365d.changePct
    },
    quality: {
      top1TxShare,
      top5TxShare,
      providerTxGap,
      providerVolumeGap,
      authenticityBenchmark: {
        windowDays: 280,
        totalBaseVolumeUsd: 44_121_383.81,
        fictitiousTxShare: 0.212,
        internalClusterShare: 0.6378,
        independentValueFloorUsd: 187_861.35,
        independentValueCeilingUsd: 20_258_746.09,
        independentValueFloorShare: 187_861.35 / 44_121_383.81,
        independentValueCeilingShare: 20_258_746.09 / 44_121_383.81
      }
    },
    ratios: [
      {
        label: "Machine value / DEX volume",
        value: safeDivide(machineVolume7d, dex?.volume7dUsd),
        format: "percent",
        definition: "Seven-day x402 + MPP payment value divided by seven-day DEX volume."
      },
      {
        label: "DEX turnover / stablecoin supply",
        value: safeDivide(dex?.volume30dUsd, latestSupply),
        format: "ratio",
        definition: "Thirty-day DEX volume divided by current stablecoin supply."
      },
      {
        label: "x402 transactions / buyer",
        value: safeDivide(x402?.transactions30d, x402?.buyers30d),
        format: "ratio",
        definition: "Reported x402 transactions divided by observed buyer addresses."
      },
      {
        label: "x402 top-server transaction share",
        value: top1TxShare,
        format: "percent",
        definition: "Largest listed x402 server transactions divided by reported ecosystem transactions."
      },
      {
        label: "x402 provider transaction gap",
        value: providerTxGap,
        format: "ratio",
        definition: "Official x402.org 30d transactions divided by x402scan 30d transactions."
      },
      {
        label: "MPP sender / recipient breadth",
        value: safeDivide(mpp?.uniqueSenders, mpp?.uniqueRecipients),
        format: "ratio",
        definition: "Reported unique MPP senders divided by unique recipients."
      }
    ],
    series: {
      machineDaily: machineSeries,
      stablecoinSupply: stablecoinSeries,
      dexDaily: dexSeries,
      npmWeekly: npmSeries
    },
    coverage: {
      machine: seriesCoverage(machineSeries),
      stablecoins: seriesCoverage(stablecoinSeries),
      dex: seriesCoverage(dexSeries),
      npm: seriesCoverage(npmSeries)
    }
  };
}
