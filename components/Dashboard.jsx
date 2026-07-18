"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import TrendChart from "@/components/TrendChart";
import {
  formatCurrency,
  formatDateTime,
  formatNumber,
  formatPctPoint,
  formatPercent,
  formatRatio,
  signedClass
} from "@/lib/format";

const RANGE_DAYS = { "7D": 7, "30D": 30, "90D": 90, "1Y": 365 };

function filterRange(rows, days) {
  if (!rows?.length) return [];
  const last = new Date(`${rows.at(-1).date}T23:59:59Z`).getTime();
  const cutoff = last - days * 86_400_000;
  return rows.filter((row) => new Date(`${row.date}T00:00:00Z`).getTime() >= cutoff);
}

function Delta({ value, suffix = "" }) {
  return (
    <span className={`delta ${signedClass(value)}`}>
      {formatPctPoint(value)}
      {suffix}
    </span>
  );
}

function MetricCard({ eyebrow, value, note, delta, tone = "default" }) {
  return (
    <article className={`metric-card ${tone}`}>
      <div className="metric-eyebrow">{eyebrow}</div>
      <div className="metric-value">{value}</div>
      <div className="metric-foot">
        <span>{note}</span>
        {delta !== undefined && <Delta value={delta} />}
      </div>
    </article>
  );
}

function ChartCard({ kicker, title, subtitle, legend, children, summary }) {
  return (
    <article className="chart-card">
      <header className="card-header">
        <div>
          <div className="section-kicker">{kicker}</div>
          <h3>{title}</h3>
          <p>{subtitle}</p>
        </div>
        {legend && (
          <div className="chart-legend">
            {legend.map((item) => (
              <span key={item.name}>
                <i style={{ background: item.color }} />
                {item.name}
              </span>
            ))}
          </div>
        )}
      </header>
      {children}
      {summary && <p className="chart-summary">{summary}</p>}
    </article>
  );
}

function RangeSwitch({ value, onChange }) {
  return (
    <div className="range-switch" aria-label="Chart date range">
      {Object.keys(RANGE_DAYS).map((range) => (
        <button
          type="button"
          key={range}
          className={range === value ? "active" : ""}
          aria-pressed={range === value}
          onClick={() => onChange(range)}
        >
          {range}
        </button>
      ))}
    </div>
  );
}

function ScoreDial({ score, state }) {
  return (
    <div
      className="score-dial"
      style={{ "--score": `${score * 3.6}deg` }}
      aria-label={`Shift score ${score} out of 100, state ${state}`}
    >
      <div className="score-dial-inner">
        <strong>{score}</strong>
        <span>/ 100</span>
      </div>
    </div>
  );
}

function Bar({ value, color = "var(--signal)" }) {
  return (
    <div className="microbar" aria-hidden="true">
      <span style={{ width: `${Math.max(2, Math.min(100, value))}%`, background: color }} />
    </div>
  );
}

function ratioValue(row) {
  if (row.format === "percent") return formatPercent(row.value, row.value < 0.001 ? 4 : 1);
  return formatRatio(row.value);
}

function ratioRead(label, value) {
  if (label === "Machine value / DEX volume") {
    return value < 0.001 ? "Machine commerce remains economically tiny." : "Machine value is entering visible onchain scale.";
  }
  if (label === "x402 top-server transaction share") {
    return value > 0.5 ? "High concentration; headline growth may be operator-specific." : "Activity is distributed across several services.";
  }
  if (label === "x402 provider transaction gap") {
    return value > 1.25 || value < 0.8
      ? "Coverage definitions disagree; confidence is reduced."
      : "Providers are broadly aligned.";
  }
  if (label === "DEX turnover / stablecoin supply") {
    return value > 1 ? "Open-market turnover exceeds current stablecoin capacity each month." : "Settlement capacity is growing faster than turnover.";
  }
  return "Track the direction and denominator together.";
}

function correlationRead(value) {
  if (value >= 0.6) return "Counts and value are moving together.";
  if (value <= 0) return "Counts and value are diverging.";
  return "Only weak count-value confirmation.";
}

function LoadingState() {
  return (
    <main className="loading-shell">
      <div className="radar-mark">OES / RADAR</div>
      <div className="loading-grid">
        <div className="loading-orbit" />
        <div>
          <div className="section-kicker">CALIBRATING PUBLIC SOURCES</div>
          <h1>Scanning the edge of the open economy.</h1>
          <p>x402 · MPP · stablecoins · DEXs · npm · evidence quality</p>
        </div>
      </div>
    </main>
  );
}

export default function Dashboard() {
  const [snapshot, setSnapshot] = useState(null);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [range, setRange] = useState("90D");
  const [slot, setSlot] = useState(() => Math.floor(Date.now() / 21_600_000));

  const load = useCallback(async (manual = false) => {
    setRefreshing(true);
    try {
      const currentSlot = Math.floor(Date.now() / 21_600_000);
      const response = await fetch(`/api/snapshot?slot=${currentSlot}`, {
        cache: manual ? "no-store" : "default"
      });
      if (!response.ok) throw new Error(`Snapshot request failed: ${response.status}`);
      setSnapshot(await response.json());
      setError(null);
      setSlot(currentSlot);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : String(loadError));
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const timer = setInterval(() => {
      const currentSlot = Math.floor(Date.now() / 21_600_000);
      if (currentSlot !== slot) load();
    }, 60_000);
    return () => clearInterval(timer);
  }, [load, slot]);

  const ranged = useMemo(() => {
    if (!snapshot) return {};
    const days = RANGE_DAYS[range];
    return {
      machine: filterRange(snapshot.series.machineDaily, days),
      stablecoins: filterRange(snapshot.series.stablecoinSupply, days),
      dex: filterRange(snapshot.series.dexDaily, days),
      npm: filterRange(snapshot.series.npmWeekly, days)
    };
  }, [snapshot, range]);

  if (!snapshot && !error) return <LoadingState />;

  if (!snapshot && error) {
    return (
      <main className="error-shell">
        <div className="radar-mark">OES / RADAR</div>
        <h1>Public sources did not answer.</h1>
        <p>{error}</p>
        <button type="button" className="signal-button" onClick={() => load(true)}>
          Retry scan
        </button>
      </main>
    );
  }

  const { verdict, headline, protocols, rails, developer, quality } = snapshot;
  const analytics = snapshot.analytics || {
    x402ValueAnomaly: {
      zScore: 0,
      currentMean: 0,
      baselineMean: 0,
      observations: 0
    },
    x402CountValueCorrelation: 0,
    machineValuePerThousandPayments: 0,
    mppMachineValueShare: 0
  };
  const healthPct = (snapshot.meta.healthySourceCount / snapshot.meta.sourceCount) * 100;
  const authentic = quality.authenticityBenchmark;
  const machineLegend = [
    { name: "x402", color: "var(--signal)" },
    { name: "MPP", color: "var(--acid)" }
  ];

  return (
    <main>
      <header className="topbar">
        <a className="radar-mark" href="#top" aria-label="Open Economic Systems Radar home">
          OES <span>/</span> RADAR
        </a>
        <nav aria-label="Dashboard sections">
          <a href="#machine">Machine</a>
          <a href="#rails">Rails</a>
          <a href="#quality">Quality</a>
          <a href="#sources">Sources</a>
        </nav>
        <button
          type="button"
          className="refresh-button"
          onClick={() => load(true)}
          disabled={refreshing}
          aria-busy={refreshing}
        >
          <span className={refreshing ? "spin" : ""}>↻</span>
          {refreshing ? "Refreshing" : "Refresh"}
        </button>
      </header>

      <section className="hero" id="top">
        <div className="hero-copy">
          <div className="section-kicker">OPEN ECONOMIC SYSTEMS / EARLY-WARNING INSTRUMENT</div>
          <h1>Is software beginning to transact outside closed platforms?</h1>
          <p className="hero-deck">
            A public read across four six-hour UTC windows on economic activity,
            counterparty breadth, programmable settlement, developer pull, concentration,
            and authenticity.
          </p>
          <div className="freshness-line">
            <span className={`status-dot ${snapshot.meta.status}`} />
            <span>
              Snapshot {formatDateTime(snapshot.meta.generatedAt)} · next window{" "}
              {formatDateTime(snapshot.meta.nextRefreshAt)}
            </span>
            <span className="source-health">
              {snapshot.meta.healthySourceCount}/{snapshot.meta.sourceCount} sources healthy
            </span>
          </div>
          <p className="refresh-contract">{snapshot.meta.note}</p>
          {snapshot.meta.status === "partial" && (
            <div className="partial-alert" role="status">
              Partial snapshot: {snapshot.failures.map((failure) => failure.id).join(", ")} unavailable.
            </div>
          )}
        </div>
        <div className="verdict-panel">
          <ScoreDial score={verdict.score} state={verdict.state} />
          <div className="verdict-copy">
            <div className="verdict-label">CURRENT READ</div>
            <div className={`verdict-state state-${verdict.state.toLowerCase().replace(" ", "-")}`}>
              {verdict.state}
            </div>
            <p>{verdict.summary}</p>
            <span>Confidence: {verdict.confidence}</span>
          </div>
        </div>
      </section>

      <section className="ticker-strip" aria-label="Current high-signal indicators">
        <div>
          <span>7D MACHINE VALUE</span>
          <strong>{formatCurrency(headline.machineVolume7d)}</strong>
        </div>
        <div>
          <span>7D MACHINE PAYMENTS</span>
          <strong>{formatNumber(headline.machineTransactions7d)}</strong>
        </div>
        <div>
          <span>STABLECOIN CAPACITY</span>
          <strong>{formatCurrency(headline.stablecoinSupplyUsd)}</strong>
        </div>
        <div>
          <span>X402 TOP-SERVER SHARE</span>
          <strong>{formatPercent(quality.top1TxShare)}</strong>
        </div>
        <div>
          <span>SOURCE HEALTH</span>
          <strong>{healthPct.toFixed(0)}%</strong>
        </div>
      </section>

      <section className="section-shell" aria-labelledby="primary-indicators">
        <div className="section-heading">
          <div>
            <div className="section-kicker">PRIMARY INDICATORS</div>
            <h2 id="primary-indicators">Scale only counts when behavior follows.</h2>
          </div>
          <RangeSwitch value={range} onChange={setRange} />
        </div>
        <div className="metrics-grid">
          <MetricCard
            eyebrow="MACHINE SETTLEMENT / 7D"
            value={formatCurrency(headline.machineVolume7d)}
            note="x402 + MPP public explorers"
            delta={protocols.x402.volumeChange7dPct}
            tone="signal"
          />
          <MetricCard
            eyebrow="MACHINE PAYMENTS / 7D"
            value={formatNumber(headline.machineTransactions7d)}
            note="count receives concentration penalty"
            delta={protocols.x402.txChange7dPct}
          />
          <MetricCard
            eyebrow="OBSERVED X402 BUYERS / 30D"
            value={formatNumber(headline.x402Buyers30d)}
            note="addresses, not verified operators"
          />
          <MetricCard
            eyebrow="OPEN-RAIL CAPACITY"
            value={formatCurrency(headline.stablecoinSupplyUsd)}
            note="stablecoin circulating supply"
            delta={rails.supplyGrowth.d30}
          />
          <MetricCard
            eyebrow="OPEN-MARKET ACTIVITY / 30D"
            value={formatCurrency(headline.dexVolume30dUsd)}
            note="DEX volume, not agent commerce"
            delta={rails.dexChange30dPct}
          />
          <MetricCard
            eyebrow="NAMEABLE INDEPENDENT VALUE"
            value={`${formatPercent(authentic.independentValueFloorShare, 2)}–${formatPercent(
              authentic.independentValueCeilingShare,
              1
            )}`}
            note="research bound for Base x402, 280d"
            tone="warning"
          />
        </div>
      </section>

      <section className="section-shell" id="machine" aria-labelledby="machine-title">
        <div className="section-heading">
          <div>
            <div className="section-kicker">MACHINE COMMERCE</div>
            <h2 id="machine-title">Payment traffic, value, and breadth.</h2>
          </div>
          <p className="section-note">Rolling public explorer observations; windows are labelled.</p>
        </div>
        <div className="chart-grid">
          <ChartCard
            kicker="DAILY VALUE"
            title="Machine-payment value"
            subtitle="x402 and MPP, USD"
            legend={machineLegend}
            summary={`Latest 7d: ${formatCurrency(headline.machineVolume7d)} combined.`}
          >
            <TrendChart
              data={ranged.machine}
              valueType="currency"
              lines={[
                { key: "x402VolumeUsd", name: "x402", color: "var(--signal)" },
                { key: "mppVolumeUsd", name: "MPP", color: "var(--acid)", area: false }
              ]}
              ariaLabel="Daily x402 and MPP payment value"
            />
          </ChartCard>
          <ChartCard
            kicker="DAILY COUNT"
            title="Machine-payment transactions"
            subtitle="Raw counts; inspect concentration before interpreting"
            legend={machineLegend}
            summary={`x402 top server represents ${formatPercent(quality.top1TxShare)} of explorer transactions.`}
          >
            <TrendChart
              data={ranged.machine}
              lines={[
                { key: "x402Transactions", name: "x402", color: "var(--signal)" },
                { key: "mppTransactions", name: "MPP", color: "var(--acid)", area: false }
              ]}
              ariaLabel="Daily x402 and MPP payment transactions"
            />
          </ChartCard>
        </div>

        <div className="protocol-grid">
          <article className="protocol-card">
            <div className="protocol-id">x402 / 30D EXPLORER WINDOW</div>
            <div className="protocol-main">
              <strong>{formatNumber(protocols.x402.transactions30d)}</strong>
              <span>transactions</span>
            </div>
            <dl>
              <div><dt>Volume</dt><dd>{formatCurrency(protocols.x402.volume30dUsd)}</dd></div>
              <div><dt>Buyers</dt><dd>{formatNumber(protocols.x402.buyers30d)}</dd></div>
              <div><dt>Sellers</dt><dd>{formatNumber(protocols.x402.sellers30d)}</dd></div>
              <div><dt>Average payment</dt><dd>{formatCurrency(protocols.x402.avgPaymentUsd, true)}</dd></div>
              <div><dt>Transactions / buyer</dt><dd>{formatRatio(protocols.x402.transactionsPerBuyer)}</dd></div>
              <div><dt>Bazaar resources</dt><dd>{formatNumber(protocols.bazaar.resourceCount)}</dd></div>
            </dl>
          </article>
          <article className="protocol-card">
            <div className="protocol-id">MPP / REPORTED TOTAL</div>
            <div className="protocol-main">
              <strong>{formatNumber(protocols.mpp.reportedTransactions)}</strong>
              <span>transactions</span>
            </div>
            <dl>
              <div><dt>Volume</dt><dd>{formatCurrency(protocols.mpp.reportedVolumeUsd)}</dd></div>
              <div><dt>Senders</dt><dd>{formatNumber(protocols.mpp.uniqueSenders)}</dd></div>
              <div><dt>Recipients</dt><dd>{formatNumber(protocols.mpp.uniqueRecipients)}</dd></div>
              <div><dt>Average payment</dt><dd>{formatCurrency(protocols.mpp.avgPaymentUsd, true)}</dd></div>
              <div><dt>Transactions / sender</dt><dd>{formatRatio(protocols.mpp.transactionsPerSender)}</dd></div>
              <div>
                <dt>Recent value change</dt>
                <dd className={signedClass(protocols.mpp.recentVolumeChangePct)}>
                  {formatPctPoint(protocols.mpp.recentVolumeChangePct)}
                </dd>
              </div>
            </dl>
          </article>
        </div>
      </section>

      <section className="section-shell" aria-labelledby="statistics-title">
        <div className="section-heading">
          <div>
            <div className="section-kicker">STATISTICAL CONFIRMATION</div>
            <h2 id="statistics-title">Is the movement unusual—and economically coherent?</h2>
          </div>
          <p className="section-note">
            Descriptive diagnostics for early detection; they do not establish causality.
          </p>
        </div>
        <div className="analytics-grid">
          <article className="analytic-card">
            <span>X402 VALUE ANOMALY / 7D VS PRIOR 21D</span>
            <strong>
              {analytics.x402ValueAnomaly.zScore > 0 ? "+" : ""}
              {analytics.x402ValueAnomaly.zScore.toFixed(2)}σ
            </strong>
            <p>
              {Math.abs(analytics.x402ValueAnomaly.zScore) >= 2
                ? "The recent daily mean is statistically unusual against its short baseline."
                : "The recent daily mean remains inside a two-sigma short-baseline range."}
            </p>
          </article>
          <article className="analytic-card">
            <span>X402 COUNT–VALUE CORRELATION / 30D</span>
            <strong>{analytics.x402CountValueCorrelation.toFixed(2)}</strong>
            <p>{correlationRead(analytics.x402CountValueCorrelation)}</p>
          </article>
          <article className="analytic-card">
            <span>MACHINE VALUE / 1K PAYMENTS / 7D</span>
            <strong>{formatCurrency(analytics.machineValuePerThousandPayments, true)}</strong>
            <p>Value density; rising counts with a collapsing figure are weaker evidence.</p>
          </article>
          <article className="analytic-card">
            <span>MPP SHARE OF MACHINE VALUE / 7D</span>
            <strong>{formatPercent(analytics.mppMachineValueShare, 2)}</strong>
            <p>Protocol diversity check; one protocol should not define the entire signal.</p>
          </article>
        </div>
      </section>

      <section className="section-shell" id="rails" aria-labelledby="rails-title">
        <div className="section-heading">
          <div>
            <div className="section-kicker">RAILS + OPEN MARKETS</div>
            <h2 id="rails-title">Capacity, turnover, and route breadth.</h2>
          </div>
          <p className="section-note">These indicators confirm the environment, not agent adoption by themselves.</p>
        </div>
        <div className="chart-grid">
          <ChartCard
            kicker="SETTLEMENT CAPACITY"
            title="Stablecoin circulating supply"
            subtitle={`${rails.chainsOver1b} chains above $1B · USDT ${formatPercent(
              rails.usdtShare
            )} · USDC ${formatPercent(rails.usdcShare)}`}
            summary={`Thirty-day supply change: ${formatPctPoint(rails.supplyGrowth.d30)}.`}
          >
            <TrendChart
              data={ranged.stablecoins}
              valueType="currency"
              lines={[{ key: "supplyUsd", name: "Stablecoin supply", color: "var(--blue)" }]}
              ariaLabel="Global stablecoin circulating supply"
            />
          </ChartCard>
          <ChartCard
            kicker="OPEN-MARKET FLOW"
            title="Daily DEX volume"
            subtitle={`${formatNumber(rails.dexProtocols)} protocols in source coverage`}
            summary={`Thirty-day turnover equals ${formatRatio(rails.dexTurnover30d)} of stablecoin supply.`}
          >
            <TrendChart
              data={ranged.dex}
              valueType="currency"
              lines={[{ key: "volumeUsd", name: "DEX volume", color: "var(--violet)" }]}
              ariaLabel="Daily decentralized exchange volume"
            />
          </ChartCard>
        </div>
      </section>

      <section className="section-shell" aria-labelledby="developer-title">
        <div className="section-heading">
          <div>
            <div className="section-kicker">DEVELOPER PULL</div>
            <h2 id="developer-title">SDK demand before production evidence.</h2>
          </div>
          <p className="section-note">npm downloads include CI, mirrors, and repeat installs.</p>
        </div>
        <div className="developer-layout">
          <ChartCard
            kicker="WEEKLY DOWNLOADS"
            title="Canonical machine-payment packages"
            subtitle="@x402/core and mppx"
            legend={machineLegend}
            summary={`Latest 28d: ${formatNumber(developer.x402Downloads28d)} x402 core · ${formatNumber(
              developer.mppDownloads28d
            )} mppx. The current UTC week is partial.`}
          >
            <TrendChart
              data={ranged.npm}
              lines={[
                { key: "x402", name: "@x402/core", color: "var(--signal)" },
                { key: "mpp", name: "mppx", color: "var(--acid)", area: false }
              ]}
              ariaLabel="Weekly npm downloads for x402 core and mppx"
            />
          </ChartCard>
          <div className="momentum-stack">
            <article>
              <span>@x402/core / 4W MOMENTUM</span>
              <strong className={signedClass(developer.x402GrowthPct)}>
                {formatPctPoint(developer.x402GrowthPct)}
              </strong>
              <Bar value={50 + developer.x402GrowthPct / 2} />
            </article>
            <article>
              <span>mppx / 4W MOMENTUM</span>
              <strong className={signedClass(developer.mppGrowthPct)}>
                {formatPctPoint(developer.mppGrowthPct)}
              </strong>
              <Bar value={50 + developer.mppGrowthPct / 2} color="var(--acid)" />
            </article>
            <article className="proxy-warning">
              <span>INTERPRETATION</span>
              <p>
                Package growth can lead deployment, but it cannot establish paying users,
                independent counterparties, or retained economic behavior.
              </p>
            </article>
          </div>
        </div>
      </section>

      <section className="section-shell" id="quality" aria-labelledby="quality-title">
        <div className="section-heading">
          <div>
            <div className="section-kicker">EVIDENCE QUALITY</div>
            <h2 id="quality-title">The anti-hype layer.</h2>
          </div>
          <p className="section-note">Counts are discounted when concentration or source disagreement rises.</p>
        </div>

        <div className="quality-grid">
          <article className="quality-card alert">
            <div className="quality-label">X402 TOP-SERVER TRANSACTION SHARE</div>
            <strong>{formatPercent(quality.top1TxShare)}</strong>
            <Bar value={quality.top1TxShare * 100} />
            <p>High concentration can make one operator look like an ecosystem-wide shift.</p>
          </article>
          <article className="quality-card">
            <div className="quality-label">X402 PROVIDER TRANSACTION GAP</div>
            <strong>{formatRatio(quality.providerTxGap)}</strong>
            <div className="provider-pair">
              <span>x402.org {formatNumber(protocols.x402.officialTransactions30d)}</span>
              <span>x402scan {formatNumber(protocols.x402.transactions30d)}</span>
            </div>
            <p>Different attribution and coverage definitions reduce confidence in absolute totals.</p>
          </article>
          <article className="quality-card research">
            <div className="quality-label">INDEPENDENT VALUE BOUND / BASE STUDY</div>
            <strong>
              {formatCurrency(authentic.independentValueFloorUsd)}–{formatCurrency(
                authentic.independentValueCeilingUsd
              )}
            </strong>
            <div className="provider-pair">
              <span>{formatPercent(authentic.fictitiousTxShare)} fictitious</span>
              <span>{formatPercent(authentic.internalClusterShare)} internal cluster</span>
            </div>
            <p>Research bound for a 280-day Base population; not a haircut applied to current explorer totals.</p>
          </article>
        </div>

        <div className="signal-matrix">
          <header>
            <div>
              <div className="section-kicker">SHIFT-SCORE COMPONENTS</div>
              <h3>Transparent weights, visible weak links.</h3>
            </div>
            <span>Heuristic · not a forecast</span>
          </header>
          {snapshot.components.map((component) => (
            <div className="component-row" key={component.id}>
              <div>
                <strong>{component.label}</strong>
                <span>
                  {component.available === false ? "SOURCE UNAVAILABLE · " : ""}
                  {component.detail}
                </span>
              </div>
              <div className="component-weight">{Math.round(component.weight * 100)}%</div>
              <Bar
                value={component.score}
                color={component.score >= 60 ? "var(--acid)" : "var(--signal)"}
              />
              <div className="component-score">{Math.round(component.score)}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="section-shell" aria-labelledby="ratios-title">
        <div className="section-heading">
          <div>
            <div className="section-kicker">RATIOS</div>
            <h2 id="ratios-title">Denominators that stop big numbers from fooling us.</h2>
          </div>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Indicator</th>
                <th>Current</th>
                <th>Definition</th>
                <th>Read</th>
              </tr>
            </thead>
            <tbody>
              {snapshot.ratios.map((row) => (
                <tr key={row.label}>
                  <td>{row.label}</td>
                  <td className="table-value">{ratioValue(row)}</td>
                  <td>{row.definition}</td>
                  <td>{ratioRead(row.label, row.value)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="section-shell source-section" id="sources" aria-labelledby="sources-title">
        <div className="section-heading">
          <div>
            <div className="section-kicker">SOURCES + DEFINITIONS</div>
            <h2 id="sources-title">Every headline should lead back to evidence.</h2>
          </div>
          <p className="section-note">No wallet keys, paid API credentials, or internal product data.</p>
        </div>
        <div className="source-grid">
          {snapshot.sourceHealth.map((source) => (
            <a
              className="source-card"
              href={source.url}
              target="_blank"
              rel="noreferrer"
              key={source.id}
            >
              <div className="source-card-top">
                <span className={`status-dot ${source.ok ? "ready" : "partial"}`} />
                <span>{source.category}</span>
                <b>
                  {source.ok ? (source.mode || "checked").toUpperCase() : "UNAVAILABLE"}
                </b>
              </div>
              <strong>{source.name}</strong>
              <p>{source.definition}</p>
              <span className="source-link">Open source ↗</span>
            </a>
          ))}
        </div>
        <div className="methodology-note">
          <div className="methodology-index">01</div>
          <p>
            <strong>What triggers a stronger signal?</strong> Machine-payment value and
            counterparty breadth must rise alongside stablecoin capacity or open-market
            activity, while developer pull strengthens and concentration falls. Raw counts
            alone cannot produce a breakout state.
          </p>
          <div className="methodology-index">02</div>
          <p>
            <strong>What can break the signal?</strong> One operator dominating transactions,
            provider definitions diverging, subsidized loops, self-payment clusters, stale
            sources, or rising infrastructure capacity without repeated external economic use.
          </p>
        </div>
      </section>

      <footer>
        <div className="radar-mark">OES <span>/</span> RADAR</div>
        <p>Open Economic Systems Radar · methodology v{snapshot.meta.methodologyVersion}</p>
        <p>Refresh windows: {snapshot.meta.refreshWindowsUtc.join(" · ")} UTC</p>
      </footer>
    </main>
  );
}
