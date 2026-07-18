"use client";

import { useId } from "react";
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

function TooltipPanel({ active, payload, label, valueType }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      <div className="chart-tooltip-date">{label}</div>
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
  lines,
  valueType = "number",
  height = 260,
  ariaLabel
}) {
  const formatter = valueType === "currency" ? formatCurrency : formatNumber;
  const chartId = useId().replaceAll(":", "");
  const spanDays =
    data?.length > 1
      ? (new Date(data.at(-1).date).getTime() - new Date(data[0].date).getTime()) /
        86_400_000
      : 0;
  const dateFormatter = (value) =>
    spanDays >= 300
      ? new Date(`${value}T00:00:00Z`).toLocaleDateString("en-US", {
          month: "short",
          year: "2-digit",
          timeZone: "UTC"
        })
      : value.slice(5);
  return (
    <div className="chart-wrap" role="img" aria-label={ariaLabel}>
      <ResponsiveContainer width="100%" height={height}>
        <ComposedChart data={data} margin={{ top: 8, right: 4, left: 0, bottom: 0 }}>
          <defs>
            {lines.map((line) => (
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
            tick={{ fill: "var(--muted)", fontSize: 11, fontFamily: "var(--mono)" }}
            tickFormatter={dateFormatter}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            width={64}
            tick={{ fill: "var(--muted)", fontSize: 11, fontFamily: "var(--mono)" }}
            tickFormatter={formatter}
          />
          <Tooltip
            cursor={{ stroke: "var(--hairline)", strokeDasharray: "3 3" }}
            content={<TooltipPanel valueType={valueType} />}
          />
          {lines.map((line, index) =>
            index === 0 && line.area !== false ? (
              <Area
                key={line.key}
                type="monotone"
                dataKey={line.key}
                name={line.name}
                stroke={line.color}
                fill={`url(#${chartId}-gradient-${line.key})`}
                strokeWidth={line.strokeWidth || 2}
                strokeDasharray={line.dash}
                opacity={line.opacity ?? 1}
                dot={false}
                activeDot={{ r: 4, strokeWidth: 0 }}
                isAnimationActive={false}
              />
            ) : (
              <Line
                key={line.key}
                type="monotone"
                dataKey={line.key}
                name={line.name}
                stroke={line.color}
                strokeWidth={line.strokeWidth || 2}
                strokeDasharray={line.dash}
                opacity={line.opacity ?? 1}
                dot={false}
                activeDot={{ r: 4, strokeWidth: 0 }}
                isAnimationActive={false}
              />
            )
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
