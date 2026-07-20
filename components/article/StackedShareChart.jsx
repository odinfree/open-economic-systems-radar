import { formatPercent } from "@/lib/format";

const SEGMENT_COLORS = [
  "var(--signal)",
  "var(--body)",
  "var(--separator)",
  "var(--hairline)"
];

export default function StackedShareChart({ segments, ariaLabel }) {
  const summary = segments
    .map((segment) => `${segment.label} ${formatPercent(segment.value, 2)}`)
    .join(", ");

  return (
    <div className="essay-share-chart">
      <div
        className="essay-share-bar"
        role="img"
        aria-label={`${ariaLabel}. ${summary}.`}
      >
        {segments.map((segment, index) => (
          <span
            key={segment.label}
            style={{
              width: `${segment.value * 100}%`,
              background: SEGMENT_COLORS[index % SEGMENT_COLORS.length]
            }}
          />
        ))}
      </div>
      <div className="essay-share-axis" aria-hidden="true">
        <span>0%</span>
        <span>50%</span>
        <span>100%</span>
      </div>
      <dl className="essay-share-legend">
        {segments.map((segment, index) => (
          <div key={segment.label}>
            <dt>
              <i
                aria-hidden="true"
                style={{
                  background: SEGMENT_COLORS[index % SEGMENT_COLORS.length]
                }}
              />
              {segment.label}
            </dt>
            <dd>{formatPercent(segment.value, 2)}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
