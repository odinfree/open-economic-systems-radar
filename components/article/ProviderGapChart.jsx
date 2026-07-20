import {
  formatCurrency,
  formatNumber,
  formatRatio
} from "@/lib/format";

function displayValue(value, valueType) {
  return valueType === "currency"
    ? formatCurrency(value, true)
    : formatNumber(value, true);
}

function ComparisonRows({ comparison }) {
  const max = Math.max(comparison.official, comparison.x402scan, 1);
  const rows = [
    {
      label: "x402.org",
      value: comparison.official,
      color: "var(--signal)"
    },
    {
      label: "x402scan",
      value: comparison.x402scan,
      color: "var(--body)"
    }
  ];

  return (
    <div className="essay-provider-group">
      <div className="essay-provider-heading">
        <strong>{comparison.label}</strong>
        <span>
          {formatRatio(comparison.official / Math.max(1, comparison.x402scan))} gap
        </span>
      </div>
      <div
        className="essay-provider-bars"
        role="img"
        aria-label={`${comparison.label}. x402.org ${displayValue(
          comparison.official,
          comparison.valueType
        )}. x402scan ${displayValue(
          comparison.x402scan,
          comparison.valueType
        )}.`}
      >
        {rows.map((row) => (
          <div className="essay-provider-row" key={row.label}>
            <span>{row.label}</span>
            <div aria-hidden="true">
              <i
                style={{
                  width: `${Math.max(1.5, (row.value / max) * 100)}%`,
                  background: row.color
                }}
              />
            </div>
            <b>{displayValue(row.value, comparison.valueType)}</b>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ProviderGapChart({ comparisons }) {
  return (
    <div className="essay-provider-chart">
      {comparisons.map((comparison) => (
        <ComparisonRows comparison={comparison} key={comparison.label} />
      ))}
    </div>
  );
}
