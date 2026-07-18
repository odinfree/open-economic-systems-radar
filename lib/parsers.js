const MICRO_UNITS = 1_000_000;

function normaliseFlight(html) {
  return html.replace(/\\"/g, '"').replace(/\\u0026/g, "&");
}

export function parseCompactNumber(value) {
  if (value === null || value === undefined) return null;
  const cleaned = String(value).trim().replace(/[$,\s]/g, "");
  const match = cleaned.match(/^(-?\d+(?:\.\d+)?)([KMBT])?$/i);
  if (!match) return null;
  const multipliers = { K: 1e3, M: 1e6, B: 1e9, T: 1e12 };
  return Number(match[1]) * (multipliers[(match[2] || "").toUpperCase()] || 1);
}

function captureNumber(text, key) {
  const match = text.match(new RegExp(`"${key}":([0-9.]+)`));
  return match ? Number(match[1]) : null;
}

export function parseX402Scan(html) {
  const text = normaliseFlight(html);
  const summaryMatch = text.match(
    /"total_transactions":(\d+),"total_amount":(\d+),"unique_buyers":(\d+),"unique_sellers":(\d+),"latest_block_timestamp":"([^"]+)"/
  );
  if (!summaryMatch) throw new Error("x402scan summary not found");

  const bucketRegex =
    /"bucket_start":"([^"]+)","total_transactions":(\d+),"total_amount":(\d+),"unique_buyers":(\d+),"unique_sellers":(\d+)/g;
  const buckets = [...text.matchAll(bucketRegex)].map((match) => ({
    timestamp: match[1],
    transactions: Number(match[2]),
    volumeUsd: Number(match[3]) / MICRO_UNITS,
    buyers: Number(match[4]),
    sellers: Number(match[5])
  }));

  const itemMarker = text.indexOf('"items":[{"recipients"');
  const itemText = itemMarker >= 0 ? text.slice(itemMarker) : "";
  const serverRegex =
    /"tx_count":(\d+),"total_amount":(\d+),"latest_block_timestamp":"[^"]+","unique_buyers":(\d+)/g;
  const servers = [...itemText.matchAll(serverRegex)].slice(0, 20).map((match) => ({
    transactions: Number(match[1]),
    volumeUsd: Number(match[2]) / MICRO_UNITS,
    buyers: Number(match[3])
  }));

  return {
    transactions30d: Number(summaryMatch[1]),
    volume30dUsd: Number(summaryMatch[2]) / MICRO_UNITS,
    buyers30d: Number(summaryMatch[3]),
    sellers30d: Number(summaryMatch[4]),
    latestAt: summaryMatch[5],
    buckets,
    topServers: servers
  };
}

export function parseX402Official(html) {
  const capture = (label) => {
    const regex = new RegExp(
      `<h2[^>]*>([^<]+)<\\/h2>\\s*<div[^>]*>${label}<\\/div>`,
      "i"
    );
    return parseCompactNumber(html.match(regex)?.[1]);
  };

  const data = {
    transactions30d: capture("Transactions"),
    volume30dUsd: capture("Volume"),
    buyers30d: capture("Buyers"),
    sellers30d: capture("Sellers")
  };

  if (!data.transactions30d || !data.volume30dUsd) {
    throw new Error("x402.org public statistics not found");
  }
  return data;
}

export function parseMppScan(html) {
  const text = normaliseFlight(html);
  const summaryMatch = text.match(
    /"totalTransactions":(\d+),"totalVolume":([0-9.]+),"uniqueSenders":(\d+),"uniqueRecipients":(\d+)/
  );
  if (!summaryMatch) throw new Error("MPPscan summary not found");

  const bucketRegex =
    /"bucket_start":"([^"]+)","total_transactions":(\d+),"total_volume":([0-9.]+),"unique_senders":(\d+),"unique_recipients":(\d+)/g;
  const buckets = [...text.matchAll(bucketRegex)].map((match) => ({
    timestamp: match[1],
    transactions: Number(match[2]),
    volumeUsd: Number(match[3]),
    senders: Number(match[4]),
    recipients: Number(match[5])
  }));

  return {
    reportedTransactions: Number(summaryMatch[1]),
    reportedVolumeUsd: Number(summaryMatch[2]),
    uniqueSenders: Number(summaryMatch[3]),
    uniqueRecipients: Number(summaryMatch[4]),
    buckets
  };
}

export function parseBazaar(payload) {
  const items = Array.isArray(payload?.items) ? payload.items : [];
  return {
    resourceCount: Number(payload?.pagination?.total || items.length),
    newestUpdatedAt: items
      .map((item) => item.lastUpdated)
      .filter(Boolean)
      .sort()
      .at(-1) || null,
    newestSample: items.slice(0, 20).map((item) => ({
      resource: item.resource,
      serviceName: item.serviceName || null,
      network: item.accepts?.[0]?.network || null,
      amount: item.accepts?.[0]?.amount || null,
      payTo: item.accepts?.[0]?.payTo || null,
      calls30d: Number(item.quality?.l30DaysTotalCalls || 0),
      payerObservations30d: Number(item.quality?.l30DaysUniquePayers || 0),
      lastCalledAt: item.quality?.lastCalledAt || null
    }))
  };
}

export function parseNpmRange(payload) {
  if (!Array.isArray(payload?.downloads)) throw new Error("npm range missing");
  return payload.downloads.map((row) => ({
    date: row.day,
    downloads: Number(row.downloads || 0)
  }));
}

export function parseStablecoinAssets(payload) {
  const rows = Array.isArray(payload?.peggedAssets) ? payload.peggedAssets : [];
  return rows
    .map((asset) => ({
      name: asset.name,
      symbol: asset.symbol,
      currentUsd: Number(asset.circulating?.peggedUSD || 0),
      prevDayUsd: Number(asset.circulatingPrevDay?.peggedUSD || 0),
      prevWeekUsd: Number(asset.circulatingPrevWeek?.peggedUSD || 0),
      prevMonthUsd: Number(asset.circulatingPrevMonth?.peggedUSD || 0)
    }))
    .filter((asset) => asset.currentUsd > 0)
    .sort((a, b) => b.currentUsd - a.currentUsd);
}

export function parseStablecoinChart(payload) {
  if (!Array.isArray(payload)) throw new Error("stablecoin chart missing");
  return payload
    .map((row) => ({
      date: new Date(Number(row.date) * 1000).toISOString().slice(0, 10),
      supplyUsd: Number(row.totalCirculatingUSD?.peggedUSD || 0)
    }))
    .filter((row) => Number.isFinite(row.supplyUsd) && row.supplyUsd > 0);
}

export function parseStablecoinChains(payload) {
  if (!Array.isArray(payload)) throw new Error("stablecoin chains missing");
  return payload
    .map((row) => ({
      chain: row.name,
      supplyUsd: Number(row.totalCirculatingUSD?.peggedUSD || 0)
    }))
    .filter((row) => row.supplyUsd > 0)
    .sort((a, b) => b.supplyUsd - a.supplyUsd);
}

export function parseDexOverview(payload) {
  const chart = Array.isArray(payload?.totalDataChart)
    ? payload.totalDataChart.map(([timestamp, value]) => ({
        date: new Date(Number(timestamp) * 1000).toISOString().slice(0, 10),
        volumeUsd: Number(value || 0)
      }))
    : [];

  return {
    volume24hUsd: Number(payload?.total24h || 0),
    volume7dUsd: Number(payload?.total7d || 0),
    volume30dUsd: Number(payload?.total30d || 0),
    change1dPct: Number(payload?.change_1d || 0),
    change7dPct: Number(payload?.change_7dover7d || payload?.change_7d || 0),
    change30dPct: Number(payload?.change_30dover30d || payload?.change_1m || 0),
    protocolCount: Number(payload?.protocols?.length || 0),
    chart
  };
}

export const __test = {
  normaliseFlight,
  captureNumber
};
