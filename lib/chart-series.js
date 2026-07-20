const DAY_MS = 86_400_000;

export const CHART_CADENCES = {
  daily: {
    label: "Daily",
    shortLabel: "D",
    periodLabel: "day",
    trendWindow: 7,
    trendLabel: "7d mean"
  },
  weekly: {
    label: "Weekly",
    shortLabel: "W",
    periodLabel: "week",
    trendWindow: 4,
    trendLabel: "4w mean"
  },
  monthly: {
    label: "Monthly",
    shortLabel: "M",
    periodLabel: "month",
    trendWindow: 3,
    trendLabel: "3m mean"
  },
  yearly: {
    label: "Yearly",
    shortLabel: "Y",
    periodLabel: "year",
    trendWindow: 2,
    trendLabel: "2y mean"
  }
};

function utcDate(value) {
  const date = new Date(`${String(value).slice(0, 10)}T00:00:00Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function isoDay(date) {
  return date.toISOString().slice(0, 10);
}

function bucketDate(value, cadence) {
  const date = utcDate(value);
  if (!date) return null;

  if (cadence === "weekly") {
    const daysSinceMonday = (date.getUTCDay() + 6) % 7;
    date.setUTCDate(date.getUTCDate() - daysSinceMonday);
  } else if (cadence === "monthly") {
    date.setUTCDate(1);
  } else if (cadence === "yearly") {
    date.setUTCMonth(0, 1);
  }

  return isoDay(date);
}

export function chartSpanDays(rows) {
  if (!rows?.length || rows.length < 2) return 0;
  const sorted = [...rows].sort((left, right) => left.date.localeCompare(right.date));
  const start = utcDate(sorted[0].date);
  const end = utcDate(sorted.at(-1).date);
  return start && end ? Math.round((end.getTime() - start.getTime()) / DAY_MS) : 0;
}

export function completeCalendarYears(rows) {
  const dates = (rows || [])
    .map((row) => utcDate(row?.date))
    .filter(Boolean)
    .sort((left, right) => left.getTime() - right.getTime());
  if (dates.length < 2) return [];

  const first = dates[0];
  const last = dates.at(-1);
  const years = [];
  for (
    let year = first.getUTCFullYear();
    year <= last.getUTCFullYear();
    year += 1
  ) {
    const yearStart = Date.UTC(year, 0, 1);
    const yearEnd = Date.UTC(year, 11, 31);
    if (first.getTime() <= yearStart && last.getTime() >= yearEnd) {
      years.push(year);
    }
  }
  return years;
}

export function availableCadences(rows) {
  const cadences = ["daily", "weekly", "monthly"];
  if (completeCalendarYears(rows).length >= 2) cadences.push("yearly");
  return cadences;
}

export function trendKey(key) {
  return `${key}__trend`;
}

export function aggregateChartRows(rows, keys, cadence = "daily", method = "sum") {
  const buckets = new Map();
  const sorted = [...(rows || [])]
    .filter((row) => row?.date)
    .sort((left, right) => left.date.localeCompare(right.date));
  const completeYears =
    cadence === "yearly" ? new Set(completeCalendarYears(sorted)) : null;

  for (const row of sorted) {
    if (
      completeYears &&
      !completeYears.has(utcDate(row.date)?.getUTCFullYear())
    ) {
      continue;
    }
    const date = bucketDate(row.date, cadence);
    if (!date) continue;
    const bucket = buckets.get(date) || { date, __counts: {} };

    for (const key of keys) {
      if (row[key] === null || row[key] === undefined) continue;
      const value = Number(row[key]);
      if (!Number.isFinite(value)) continue;

      if (method === "last") {
        bucket[key] = value;
      } else if (method === "mean") {
        bucket[key] = Number(bucket[key] || 0) + value;
        bucket.__counts[key] = Number(bucket.__counts[key] || 0) + 1;
      } else {
        bucket[key] = Number(bucket[key] || 0) + value;
      }
    }

    buckets.set(date, bucket);
  }

  return [...buckets.values()].map((bucket) => {
    const output = { date: bucket.date };
    for (const key of keys) {
      if (bucket[key] === undefined) continue;
      output[key] =
        method === "mean"
          ? bucket[key] / Math.max(1, bucket.__counts[key] || 0)
          : bucket[key];
    }
    return output;
  });
}

export function prepareChartRows(rows, keys, cadence = "daily", method = "sum") {
  const aggregated = aggregateChartRows(rows, keys, cadence, method);
  const windowSize = CHART_CADENCES[cadence]?.trendWindow || 1;

  return aggregated.map((row, index) => {
    const output = { ...row };
    for (const key of keys) {
      const window = aggregated
        .slice(Math.max(0, index - windowSize + 1), index + 1)
        .map((item) => Number(item[key]))
        .filter(Number.isFinite);
      output[trendKey(key)] =
        window.length > 0
          ? window.reduce((sum, value) => sum + value, 0) / window.length
          : null;
    }
    return output;
  });
}

export function prepareRatioChartRows(
  rows,
  {
    numeratorKey,
    denominatorKey,
    outputKey,
    multiplier = 1
  },
  cadence = "daily"
) {
  const aggregated = aggregateChartRows(
    rows,
    [numeratorKey, denominatorKey],
    cadence,
    "sum"
  );
  const windowSize = CHART_CADENCES[cadence]?.trendWindow || 1;

  return aggregated.map((row, index) => {
    const window = aggregated
      .slice(Math.max(0, index - windowSize + 1), index + 1);
    const rollingNumerator = window.reduce(
      (sum, item) => sum + Number(item[numeratorKey] || 0),
      0
    );
    const rollingDenominator = window.reduce(
      (sum, item) => sum + Number(item[denominatorKey] || 0),
      0
    );
    const denominator = Number(row[denominatorKey] || 0);

    return {
      date: row.date,
      [outputKey]:
        denominator > 0
          ? (Number(row[numeratorKey] || 0) / denominator) * multiplier
          : 0,
      [trendKey(outputKey)]:
        rollingDenominator > 0
          ? (rollingNumerator / rollingDenominator) * multiplier
          : null
    };
  });
}
