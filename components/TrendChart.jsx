"use client";

import { useEffect, useId, useMemo, useState } from "react";
import {
  Area,
  CartesianGrid,
  Line,
  ComposedChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { formatCurrency, formatNumber } from "@/lib/format";
import {
  availableCadences,
  CHART_CADENCES,
  prepareChartRows,
  prepareRatioChartRows,
  trendKey
} from "@/lib/chart-series";

function formatPeriodDate(value, cadence, compact = false) {
  const date = new Date(`${value}T00:00:00Z`);
  if (cadence === "yearly") return String(date.getUTCFullYear());
  if (cadence === "monthly") {
    return date.toLocaleDateString("en-US", {
      month: compact ? "short" : "long",
      year: "numeric",
      timeZone: "UTC"
    });
  }
  const formatted = date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: compact ? undefined : "numeric",
    timeZone: "UTC"
  });
  return cadence === "weekly" && !compact ? `Week of ${formatted}` : formatted;
}

function TooltipPanel({ active, payload, label, valueType, cadence }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      <div className="chart-tooltip-date">{formatPeriodDate(label, cadence)}</div>
      {payload.map((item) => (
        <div className="chart-tooltip-row" key={item.dataKey}>
          <span className="legend-dot" style={{ background: item.color }} />
          <span>{item.name}</span>
          <strong>
            {valueType === "currency"
              ? formatCurrency(item.value, true)
              : formatNumber(item.value, true)}
          </strong>
        </div>
      ))}
    </div>
  );
}

export default function TrendChart({
  data,
  series,
  aggregation = "sum",
  defaultCadence = "daily",
  valueType = "number",
  height = 260,
  ariaLabel,
  measureLabel,
  ratio,
  partialPeriods = false,
  dataQualityNote,
  axisColor = "var(--muted)"
}) {
  const [cadence, setCadence] = useState(defaultCadence);
  const cadences = useMemo(() => availableCadences(data), [data]);
  useEffect(() => {
    if (!cadences.includes(cadence)) setCadence(cadences[0]);
  }, [cadence, cadences]);

  const chartData = useMemo(() => {
    if (ratio) return prepareRatioChartRows(data, ratio, cadence);
    return prepareChartRows(
      data,
      series.map((item) => item.key),
      cadence,
      aggregation
    );
  }, [aggregation, cadence, data, ratio, series]);
  const formatter = valueType === "currency" ? formatCurrency : formatNumber;
  const chartId = useId().replaceAll(":", "");
  const spanDays =
    chartData?.length > 1
      ? (new Date(chartData.at(-1).date).getTime() -
          new Date(chartData[0].date).getTime()) /
        86_400_000
      : 0;
  const dateFormatter = (value) => {
    if (cadence === "yearly") return formatPeriodDate(value, cadence, true);
    if (cadence === "monthly" || spanDays >= 300) {
      return new Date(`${value}T00:00:00Z`).toLocaleDateString("en-US", {
        month: "short",
        year: "2-digit",
        timeZone: "UTC"
      });
    }
    return formatPeriodDate(value, cadence, true);
  };
  const cadenceConfig = CHART_CADENCES[cadence];
  const yearlyAvailable = cadences.includes("yearly");
  const yearlyStatusId = `${chartId}-yearly-status`;
  const periodNote =
    cadence === "yearly"
      ? "COMPLETE CALENDAR YEARS ONLY"
      : partialPeriods && cadence !== "daily"
        ? "EDGE PERIODS MAY BE PARTIAL"
        : null;
  const chartNotes = [
    dataQualityNote,
    periodNote,
    !yearlyAvailable ? "YEARLY NEEDS 2 COMPLETE CALENDAR YEARS" : null
  ].filter(Boolean);

  return (
    <div className="chart-wrap">
      <div className="chart-cadence-row">
        <div className="chart-measure">
          <span>
            {measureLabel ||
              (aggregation === "last" ? "PERIOD CLOSE" : "PERIOD TOTAL")}{" "}
            /{" "}
            {cadenceConfig.trendLabel.toUpperCase()}
          </span>
          {chartNotes.length > 0 && (
            <small id={!yearlyAvailable ? yearlyStatusId : undefined}>
              {chartNotes.join(" / ")}
            </small>
          )}
        </div>
        <div
          className="chart-cadence-switch"
          role="group"
          aria-label={`${ariaLabel} cadence`}
          aria-describedby={!yearlyAvailable ? yearlyStatusId : undefined}
        >
          {Object.keys(CHART_CADENCES).map((option) => {
            const available = cadences.includes(option);
            const unavailableReason =
              option === "yearly"
                ? "Needs two complete calendar years of visible data"
                : "Unavailable";
            return (
              <button
                type="button"
                key={option}
                className={option === cadence ? "active" : ""}
                aria-pressed={option === cadence}
                aria-label={
                  available
                    ? CHART_CADENCES[option].label
                    : `${CHART_CADENCES[option].label} unavailable: ${unavailableReason}`
                }
                title={
                  available
                    ? CHART_CADENCES[option].label
                    : unavailableReason
                }
                disabled={!available}
                onClick={() => setCadence(option)}
              >
                {CHART_CADENCES[option].label}
              </button>
            );
          })}
        </div>
      </div>
      <div role="img" aria-label={`${ariaLabel}, ${cadenceConfig.label.toLowerCase()} view`}>
        <ResponsiveContainer width="100%" height={height}>
          <ComposedChart
            data={chartData}
            margin={{ top: 8, right: 20, left: 0, bottom: 0 }}
          >
          <defs>
            {series.map((line) => (
              <linearGradient
                key={line.key}
                id={`${chartId}-gradient-${line.key}`}
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop offset="0%" stopColor={line.color} stopOpacity={0.24} />
                <stop offset="100%" stopColor={line.color} stopOpacity={0} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid stroke="var(--grid)" vertical={false} />
          <XAxis
            dataKey="date"
            axisLine={false}
            tickLine={false}
            minTickGap={34}
            tick={{ fill: axisColor, fontSize: 11, fontFamily: "var(--mono)" }}
            tickFormatter={dateFormatter}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            width={64}
            tick={{ fill: axisColor, fontSize: 11, fontFamily: "var(--mono)" }}
            tickFormatter={formatter}
          />
          <Tooltip
            cursor={{ stroke: "var(--hairline)", strokeDasharray: "3 3" }}
            content={<TooltipPanel valueType={valueType} cadence={cadence} />}
          />
          {series.map((line, index) =>
            (line.area ?? index === 0) ? (
              <Area
                key={`raw-${line.key}`}
                type="monotone"
                dataKey={line.key}
                name={`${line.name} ${cadenceConfig.periodLabel}`}
                stroke={line.rawColor || line.color}
                fill={`url(#${chartId}-gradient-${line.key})`}
                strokeWidth={line.rawStrokeWidth || 1.5}
                opacity={line.rawOpacity ?? 0.22}
                dot={cadence === "yearly" ? { r: 3, strokeWidth: 0 } : false}
                activeDot={{ r: 4, strokeWidth: 0 }}
                isAnimationActive={false}
              />
            ) : (
              <Line
                key={`raw-${line.key}`}
                type="monotone"
                dataKey={line.key}
                name={`${line.name} ${cadenceConfig.periodLabel}`}
                stroke={line.rawColor || line.color}
                strokeWidth={line.rawStrokeWidth || 1.5}
                opacity={line.rawOpacity ?? 0.22}
                dot={cadence === "yearly" ? { r: 3, strokeWidth: 0 } : false}
                activeDot={{ r: 4, strokeWidth: 0 }}
                isAnimationActive={false}
              />
            )
          )}
          {series.map((line) => (
            <Line
              key={`trend-${line.key}`}
              type="monotone"
              dataKey={trendKey(line.key)}
              name={`${line.name} ${cadenceConfig.trendLabel}`}
              stroke={line.trendColor || line.color}
              strokeWidth={line.trendStrokeWidth || 2.5}
              dot={false}
              activeDot={{ r: 4, strokeWidth: 0 }}
              isAnimationActive={false}
            />
          ))}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
