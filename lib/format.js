const compact = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 1
});

const compactPrecise = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 2
});

export function formatNumber(value, precise = false) {
  if (!Number.isFinite(Number(value))) return "—";
  return (precise ? compactPrecise : compact).format(Number(value));
}

export function formatCurrency(value, precise = false) {
  if (!Number.isFinite(Number(value))) return "—";
  const n = Number(value);
  if (n === 0) return "$0";
  if (Math.abs(n) < 0.01 && n !== 0) return `$${n.toExponential(1)}`;
  if (Math.abs(n) < 1) return `$${n.toFixed(3)}`;
  return `$${formatNumber(n, precise)}`;
}

export function formatPercent(value, digits = 1) {
  if (!Number.isFinite(Number(value))) return "—";
  return `${(Number(value) * 100).toFixed(digits)}%`;
}

export function formatPctPoint(value, digits = 1) {
  if (!Number.isFinite(Number(value))) return "—";
  const n = Number(value);
  return `${n > 0 ? "+" : ""}${n.toFixed(digits)}%`;
}

export function formatRatio(value, digits = 2) {
  if (!Number.isFinite(Number(value))) return "—";
  return `${Number(value).toFixed(digits)}×`;
}

export function formatDateTime(value) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
    timeZoneName: "short"
  }).format(new Date(value));
}

export function signedClass(value) {
  if (Number(value) > 0) return "positive";
  if (Number(value) < 0) return "negative";
  return "neutral";
}
