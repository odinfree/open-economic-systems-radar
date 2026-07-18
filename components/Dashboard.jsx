"use client";

import { useCallback, useEffect, useId, useMemo, useState } from "react";
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

const RANGE_DAYS = { "90D": 90, "1Y": 365, "18M": 548 };

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

function InfoTip({ label, children }) {
  const [open, setOpen] = useState(false);
  const id = useId();

  return (
    <span
      className={`info-tip ${open ? "is-open" : ""}`}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
      }}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          setOpen(false);
          event.currentTarget.querySelector("button")?.focus();
        }
      }}
    >
      <button
        type="button"
        aria-label={`Explain ${label}`}
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((current) => !current)}
      >
        ?
      </button>
      <span className="info-popover" id={id} role="tooltip">
        {children}
      </span>
    </span>
  );
}

function LabelWithHelp({ label, help }) {
  return (
    <span className="label-with-help">
      <span>{label}</span>
      {help && <InfoTip label={label}>{help}</InfoTip>}
    </span>
  );
}

function MetricCard({ eyebrow, value, note, delta, tone = "default", help }) {
  return (
    <article className={`metric-card ${tone}`}>
      <div className="metric-eyebrow">
        <LabelWithHelp label={eyebrow} help={help} />
      </div>
      <div className="metric-value">{value}</div>
      <div className="metric-foot">
        <span>{note}</span>
        {delta !== undefined && <Delta value={delta} />}
      </div>
    </article>
  );
}

function ChartCard({ kicker, title, subtitle, legend, children, summary, help }) {
  return (
    <article className="chart-card">
      <header className="card-header">
        <div>
          <div className="section-kicker">{kicker}</div>
          <h3>
            <LabelWithHelp label={title} help={help} />
          </h3>
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

function AnalyticCard({ label, value, note, help, tone = "" }) {
  return (
    <article className={`analytic-card ${tone}`.trim()}>
      <LabelWithHelp label={label} help={help} />
      <strong>{value}</strong>
      <p>{note}</p>
    </article>
  );
}

function RangeSwitch({ value, onChange }) {
  return (
    <div className="range-control">
      <span>HISTORY</span>
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

function ratioRead(id, value) {
  if (id === "machine-dex-share") {
    return value < 0.001
      ? "Software payments are still tiny beside DEX volume."
      : "Software payments now equal a visible share of DEX volume.";
  }
  if (id === "x402-top-server-share") {
    return value > 0.5 ? "One server drives much of the count." : "Several services contribute to the count.";
  }
  if (id === "x402-provider-gap") {
    return value > 1.25 || value < 0.8
      ? "Provider totals disagree."
      : "Provider totals are close.";
  }
  if (id === "dex-stablecoin-turnover") {
    return value > 1 ? "Monthly DEX volume exceeds stablecoin supply." : "Stablecoin supply exceeds monthly DEX volume.";
  }
  return "Read the value together with its denominator.";
}

function correlationRead(value) {
  if (value >= 0.6) return "Counts and value are moving together.";
  if (value <= 0) return "Counts and value are diverging.";
  return "Counts and value have only a weak link.";
}

function LoadingState() {
  return (
    <main className="loading-shell">
      <div className="radar-mark">OES / RADAR</div>
      <div className="loading-grid">
        <div className="loading-orbit" />
        <div>
          <div className="section-kicker">LOADING PUBLIC DATA</div>
          <h1>Checking the open economy.</h1>
          <p>x402, MPP, stablecoins, DEXs, npm, and data quality</p>
        </div>
      </div>
    </main>
  );
}

export default function Dashboard() {
  const [snapshot, setSnapshot] = useState(null);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [range, setRange] = useState("1Y");
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
      machine: snapshot.series.machineDaily,
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
        <h1>Public data is unavailable.</h1>
        <p>{error}</p>
        <button type="button" className="signal-button" onClick={() => load(true)}>
          Try again
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
    mppMachineValueShare: 0,
    stablecoinSupplyGrowth90dPct: 0,
    stablecoinSupplyGrowth1yPct: 0,
    dexVolume90dChangePct: 0,
    dexVolume1yChangePct: 0
  };
  const coverage = snapshot.coverage || {
    machine: { days: snapshot.series.machineDaily.length, start: null, end: null },
    stablecoins: { days: snapshot.series.stablecoinSupply.length, start: null, end: null },
    dex: { days: snapshot.series.dexDaily.length, start: null, end: null },
    npm: { days: snapshot.series.npmWeekly.length * 7, start: null, end: null }
  };
  const healthPct = (snapshot.meta.healthySourceCount / snapshot.meta.sourceCount) * 100;
  const authentic = quality.authenticityBenchmark;
  const machineLegend = [
    { name: "x402", color: "var(--signal)" },
    { name: "MPP", color: "var(--text)" }
  ];

  return (
    <main>
      <header className="topbar">
        <a className="radar-mark" href="#top" aria-label="Open Economic Systems Radar home">
          OES <span>/</span> RADAR
        </a>
        <nav aria-label="Dashboard sections">
          <a href="#machine">Payments</a>
          <a href="#rails">Markets</a>
          <a href="#quality">Quality</a>
          <a href="#sources">Sources</a>
          <a
            href="https://github.com/welttowelt/open-economic-systems-radar"
            target="_blank"
            rel="noreferrer"
          >
            GitHub ↗
          </a>
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
          <div className="section-kicker">OPEN ECONOMIC SYSTEMS / DAILY RADAR</div>
          <h1>Track software paying on open networks.</h1>
          <p className="hero-deck">
            Public data refreshed four times a day. Follow software payments, the money
            and markets they can use, and signs of independent activity.
          </p>
          <div className="freshness-line">
            <span className={`status-dot ${snapshot.meta.status}`} />
            <span>
              Updated {formatDateTime(snapshot.meta.generatedAt)} / next check{" "}
              {formatDateTime(snapshot.meta.nextRefreshAt)}
            </span>
            <span className="source-health">
              {snapshot.meta.healthySourceCount}/{snapshot.meta.sourceCount} sources healthy
            </span>
          </div>
          {snapshot.meta.status === "partial" && (
            <div className="partial-alert" role="status">
              Missing sources: {snapshot.failures.map((failure) => failure.id).join(", ")}.
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
            <span className="verdict-confidence">
              Confidence: {verdict.confidence}
              <InfoTip label="confidence">
                {verdict.confidence === "CONTESTED"
                  ? "Two public x402 providers report totals that differ enough to lower confidence."
                  : "The main public sources broadly agree. The market is still young and incomplete."}
              </InfoTip>
            </span>
          </div>
        </div>
      </section>

      <section className="ticker-strip" aria-label="Current high-signal indicators">
        <div>
          <span>7D SOFTWARE PAYMENTS</span>
          <strong>{formatCurrency(headline.machineVolume7d)}</strong>
        </div>
        <div>
          <span>7D PAYMENT COUNT</span>
          <strong>{formatNumber(headline.machineTransactions7d)}</strong>
        </div>
        <div>
          <span>STABLECOIN SUPPLY</span>
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
            <div className="section-kicker">CURRENT LEVELS</div>
            <h2 id="primary-indicators">What the data shows now.</h2>
          </div>
        </div>
        <div className="metrics-grid">
          <MetricCard
            eyebrow="SOFTWARE PAYMENT VALUE / 7D"
            value={formatCurrency(headline.machineVolume7d)}
            note="x402 and MPP explorers"
            delta={protocols.x402.volumeChange7dPct}
            tone="signal"
            help="The dollar value recorded by the public x402 and MPP explorers during the last seven days."
          />
          <MetricCard
            eyebrow="SOFTWARE PAYMENT COUNT / 7D"
            value={formatNumber(headline.machineTransactions7d)}
            note="x402 and MPP explorer records"
            delta={protocols.x402.txChange7dPct}
            help="The number of explorer records. One server can create many records, so the score reduces their weight when activity is concentrated."
          />
          <MetricCard
            eyebrow="X402 BUYER ADDRESSES / 30D"
            value={formatNumber(headline.x402Buyers30d)}
            note="public addresses"
            help="These are blockchain addresses seen paying through x402. One person or company can control several addresses."
          />
          <MetricCard
            eyebrow="STABLECOIN SUPPLY"
            value={formatCurrency(headline.stablecoinSupplyUsd)}
            note="global circulating supply"
            delta={rails.supplyGrowth.d30}
            help="The dollar value of stablecoins in circulation. It shows available settlement capacity, not software spending."
          />
          <MetricCard
            eyebrow="DEX VOLUME / 30D"
            value={formatCurrency(headline.dexVolume30dUsd)}
            note="all covered DEX trading"
            delta={rails.dexChange30dPct}
            help="Trading volume on decentralized exchanges. It shows open-market use, but it is not a measure of software payments."
          />
          <MetricCard
            eyebrow="INDEPENDENT X402 VALUE / BASE STUDY"
            value={`${formatPercent(authentic.independentValueFloorShare, 2)}–${formatPercent(
              authentic.independentValueCeilingShare,
              1
            )}`}
            note="share of value in a 280-day study"
            tone="warning"
            help="Researchers estimated the share of Base x402 value linked to named, independent services. This is a historical range, not a discount applied to today’s explorer totals."
          />
        </div>
      </section>

      <section className="section-shell" id="machine" aria-labelledby="machine-title">
        <div className="section-heading">
          <div>
            <div className="section-kicker">SOFTWARE PAYMENTS</div>
            <h2 id="machine-title">Payment value and count.</h2>
          </div>
          <p className="section-note">
            Explorer history starts {coverage.machine.start || "with the first available day"}.
            The lines show a seven-day average across {coverage.machine.days} days.
          </p>
        </div>
        <div className="chart-grid">
          <ChartCard
            kicker="DAILY VALUE"
            title="Software payment value"
            subtitle="x402 and MPP, USD"
            legend={machineLegend}
            summary={`Latest 7d: ${formatCurrency(
              headline.machineVolume7d
            )} combined. Solid lines show 7d averages.`}
            help="x402 and MPP let software pay for online services through public networks. This chart adds the value reported by their explorers."
          >
            <TrendChart
              data={ranged.machine}
              valueType="currency"
              lines={[
                {
                  key: "x402VolumeUsd",
                  name: "x402 daily",
                  color: "var(--signal)",
                  opacity: 0.22
                },
                {
                  key: "x402VolumeUsdMa7",
                  name: "x402 7d mean",
                  color: "var(--signal)",
                  area: false,
                  strokeWidth: 2.5
                },
                {
                  key: "mppVolumeUsd",
                  name: "MPP daily",
                  color: "var(--body)",
                  area: false,
                  opacity: 0.22
                },
                {
                  key: "mppVolumeUsdMa7",
                  name: "MPP 7d mean",
                  color: "var(--text)",
                  area: false,
                  strokeWidth: 2.5
                }
              ]}
              ariaLabel="Daily x402 and MPP payment value"
            />
          </ChartCard>
          <ChartCard
            kicker="DAILY COUNT"
            title="Software payment count"
            subtitle="x402 and MPP explorer records"
            legend={machineLegend}
            summary={`x402 top server represents ${formatPercent(quality.top1TxShare)} of explorer transactions.`}
            help="A transaction is one explorer record. Counts can rise even when little money changes hands, and one server can generate a large share."
          >
            <TrendChart
              data={ranged.machine}
              lines={[
                {
                  key: "x402Transactions",
                  name: "x402 daily",
                  color: "var(--signal)",
                  opacity: 0.22
                },
                {
                  key: "x402TransactionsMa7",
                  name: "x402 7d mean",
                  color: "var(--signal)",
                  area: false,
                  strokeWidth: 2.5
                },
                {
                  key: "mppTransactions",
                  name: "MPP daily",
                  color: "var(--body)",
                  area: false,
                  opacity: 0.22
                },
                {
                  key: "mppTransactionsMa7",
                  name: "MPP 7d mean",
                  color: "var(--text)",
                  area: false,
                  strokeWidth: 2.5
                }
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
              <div>
                <dt>
                  <LabelWithHelp
                    label="Bazaar resources"
                    help="Paid HTTP services listed in Coinbase’s public x402 catalog."
                  />
                </dt>
                <dd>{formatNumber(protocols.bazaar.resourceCount)}</dd>
              </div>
            </dl>
          </article>
          <article className="protocol-card">
            <div className="protocol-id">
              <LabelWithHelp
                label="MPP / REPORTED TOTAL"
                help="MPPscan exposes an overall total. The trend charts above use its recent payment buckets."
              />
            </div>
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
                <dt>3d value vs prior 3d</dt>
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
            <div className="section-kicker">CHECKS BEHIND THE HEADLINE</div>
            <h2 id="statistics-title">Trend checks.</h2>
          </div>
          <p className="section-note note-with-help">
            These checks describe the public data. They do not predict the future.
            <InfoTip label="statistical checks">
              The calculations compare recent values with earlier periods. They can flag
              unusual movement, but they cannot tell us what caused it.
            </InfoTip>
          </p>
        </div>
        <div className="analytics-grid">
          <AnalyticCard
            label="X402 VALUE CHANGE / 7D VS PRIOR 21D"
            value={
              <>
                {analytics.x402ValueAnomaly.zScore > 0 ? "+" : ""}
                {analytics.x402ValueAnomaly.zScore.toFixed(2)}σ
              </>
            }
            note={
              Math.abs(analytics.x402ValueAnomaly.zScore) >= 2
                ? "The latest seven-day average is unusual beside the prior 21 days."
                : "The latest seven-day average is not unusual for this short history."
            }
            help="This uses a z-score. A value near 0 is normal for this short history. A value above +2 or below -2 is unusual."
          />
          <AnalyticCard
            label="X402 COUNT AND VALUE LINK / 30D"
            value={analytics.x402CountValueCorrelation.toFixed(2)}
            note={correlationRead(analytics.x402CountValueCorrelation)}
            help="Correlation shows whether payment count and payment value move together. 1 means they move together, 0 means no clear link, and -1 means they move in opposite directions."
          />
          <AnalyticCard
            label="VALUE PER 1,000 PAYMENTS / 7D"
            value={formatCurrency(analytics.machineValuePerThousandPayments, true)}
            note="Shows whether a higher count also carries more money."
            help="Seven-day x402 and MPP payment value divided by payment count, then multiplied by 1,000."
          />
          <AnalyticCard
            label="MPP SHARE OF PAYMENT VALUE / 7D"
            value={formatPercent(analytics.mppMachineValueShare, 2)}
            note="Shows how much value comes from the second tracked protocol."
            help="MPP payment value divided by combined x402 and MPP payment value."
          />
          <AnalyticCard
            label="STABLECOIN SUPPLY / 1Y"
            value={
              <span className={signedClass(analytics.stablecoinSupplyGrowth1yPct)}>
                {formatPctPoint(analytics.stablecoinSupplyGrowth1yPct)}
              </span>
            }
            note="Change in circulating supply over one year."
            help="Stablecoins can settle payments on public networks. More supply increases capacity, but does not prove software is using it."
            tone="long-horizon"
          />
          <AnalyticCard
            label="STABLECOIN SUPPLY / 90D"
            value={
              <span className={signedClass(analytics.stablecoinSupplyGrowth90dPct)}>
                {formatPctPoint(analytics.stablecoinSupplyGrowth90dPct)}
              </span>
            }
            note="Change in circulating supply over 90 days."
            tone="long-horizon"
          />
          <AnalyticCard
            label="DEX VOLUME / 90D VS PRIOR 90D"
            value={
              <span className={signedClass(analytics.dexVolume90dChangePct)}>
                {formatPctPoint(analytics.dexVolume90dChangePct)}
              </span>
            }
            note="Compares the latest 90 days with the previous 90."
            help="DEX means decentralized exchange. This tracks trading on open networks, not software payments."
            tone="long-horizon"
          />
          <AnalyticCard
            label="PUBLIC PAYMENT HISTORY"
            value={`${coverage.machine.days}D`}
            note="The available explorer history limits every short-term comparison."
            help="The public explorers currently expose only this many daily observations. The dashboard will preserve each future snapshot."
            tone="long-horizon"
          />
        </div>
      </section>

      <section className="section-shell" id="rails" aria-labelledby="rails-title">
        <div className="section-heading">
          <div>
            <div className="section-kicker">SETTLEMENT AND TRADING</div>
            <h2 id="rails-title">Money available and traded.</h2>
          </div>
          <div className="section-actions">
            <p className="section-note">
              Charts start at one year. Switch to 90D or 18M.
            </p>
            <RangeSwitch value={range} onChange={setRange} />
          </div>
        </div>
        <div className="chart-grid">
          <ChartCard
            kicker="SETTLEMENT CAPACITY"
            title="Stablecoin supply"
            subtitle={`${rails.chainsOver1b} chains above $1B. USDT ${formatPercent(
              rails.usdtShare
            )}. USDC ${formatPercent(rails.usdcShare)}.`}
            summary={`One-year change: ${formatPctPoint(
              analytics.stablecoinSupplyGrowth1yPct
            )}. Orange line: 30d average.`}
            help="Stablecoins are digital dollars and similar assets that move on public networks. Supply shows how much value is available for settlement."
          >
            <TrendChart
              data={ranged.stablecoins}
              valueType="currency"
              lines={[
                {
                  key: "supplyUsd",
                  name: "Daily supply",
                  color: "var(--body)",
                  opacity: 0.22
                },
                {
                  key: "supplyUsdMa30",
                  name: "30d mean",
                  color: "var(--signal)",
                  area: false,
                  strokeWidth: 2.5
                }
              ]}
              ariaLabel="Global stablecoin circulating supply"
            />
          </ChartCard>
          <ChartCard
            kicker="OPEN TRADING"
            title="Daily DEX volume"
            subtitle={`${formatNumber(rails.dexProtocols)} protocols in source coverage`}
            summary={`90d versus prior 90d: ${formatPctPoint(
              analytics.dexVolume90dChangePct
            )}. Orange line: 30d average.`}
            help="DEX means decentralized exchange. The chart totals trading reported by DeFiLlama across the covered exchanges."
          >
            <TrendChart
              data={ranged.dex}
              valueType="currency"
              lines={[
                {
                  key: "volumeUsd",
                  name: "Daily volume",
                  color: "var(--body)",
                  opacity: 0.22
                },
                {
                  key: "volumeUsdMa30",
                  name: "30d mean",
                  color: "var(--signal)",
                  area: false,
                  strokeWidth: 2.5
                }
              ]}
              ariaLabel="Daily decentralized exchange volume"
            />
          </ChartCard>
        </div>
      </section>

      <section className="section-shell" aria-labelledby="developer-title">
        <div className="section-heading">
          <div>
            <div className="section-kicker">DEVELOPER INTEREST</div>
            <h2 id="developer-title">Package downloads.</h2>
          </div>
          <div className="section-actions">
            <p className="section-note">
              npm counts automated and repeat downloads. Switch between 90D, 1Y, and 18M.
            </p>
            <RangeSwitch value={range} onChange={setRange} />
          </div>
        </div>
        <div className="developer-layout">
          <ChartCard
            kicker="WEEKLY DOWNLOADS"
            title="x402 and MPP packages"
            subtitle="@x402/core and mppx, grouped by week"
            legend={machineLegend}
            summary={`Latest 28d: ${formatNumber(developer.x402Downloads28d)} x402 core / ${formatNumber(
              developer.mppDownloads28d
            )} mppx. Solid lines show 4w averages. The current UTC week is partial.`}
            help="Developers install these npm packages to build with x402 and MPP. Downloads show interest, but they do not prove live services or paying users."
          >
            <TrendChart
              data={ranged.npm}
              lines={[
                {
                  key: "x402",
                  name: "@x402/core weekly",
                  color: "var(--signal)",
                  opacity: 0.2
                },
                {
                  key: "x402Ma4",
                  name: "@x402/core 4w mean",
                  color: "var(--signal)",
                  area: false,
                  strokeWidth: 2.5
                },
                {
                  key: "mpp",
                  name: "mppx weekly",
                  color: "var(--body)",
                  area: false,
                  opacity: 0.2
                },
                {
                  key: "mppMa4",
                  name: "mppx 4w mean",
                  color: "var(--text)",
                  area: false,
                  strokeWidth: 2.5
                }
              ]}
              ariaLabel="Weekly npm downloads for x402 core and mppx"
            />
          </ChartCard>
          <div className="momentum-stack">
            <article>
              <span>@x402/core / 13W VS PRIOR 13W</span>
              <strong className={signedClass(developer.x402Growth13wPct)}>
                {formatPctPoint(developer.x402Growth13wPct)}
              </strong>
              <Bar value={50 + developer.x402Growth13wPct / 2} />
            </article>
            <article>
              <span>mppx / 13W VS PRIOR 13W</span>
              <strong className={signedClass(developer.mppGrowth13wPct)}>
                {formatPctPoint(developer.mppGrowth13wPct)}
              </strong>
              <Bar value={50 + developer.mppGrowth13wPct / 2} color="var(--text)" />
            </article>
            <article className="proxy-warning">
              <span>LIMIT</span>
              <p>
                Downloads can rise before deployment. They do not prove live services,
                paying users, or repeat use.
              </p>
            </article>
          </div>
        </div>
      </section>

      <section className="section-shell" id="quality" aria-labelledby="quality-title">
        <div className="section-heading">
          <div>
            <div className="section-kicker">DATA QUALITY</div>
            <h2 id="quality-title">Signal reliability.</h2>
          </div>
          <p className="section-note">
            The score falls when one server dominates or public providers disagree.
          </p>
        </div>

        <div className="quality-grid">
          <article className="quality-card alert">
            <div className="quality-label">
              <LabelWithHelp
                label="X402 TOP-SERVER SHARE"
                help="The largest listed x402 server’s share of all x402scan transactions. A high share means one service can move the headline count."
              />
            </div>
            <strong>{formatPercent(quality.top1TxShare)}</strong>
            <Bar value={quality.top1TxShare * 100} />
            <p>One server drives this share of reported transactions.</p>
          </article>
          <article className="quality-card">
            <div className="quality-label">
              <LabelWithHelp
                label="X402 PROVIDER GAP"
                help="x402.org’s 30-day transaction total divided by x402scan’s total. A result of 1 means the providers match."
              />
            </div>
            <strong>{formatRatio(quality.providerTxGap)}</strong>
            <div className="provider-pair">
              <span>x402.org {formatNumber(protocols.x402.officialTransactions30d)}</span>
              <span>x402scan {formatNumber(protocols.x402.transactions30d)}</span>
            </div>
            <p>Different coverage rules produce different totals.</p>
          </article>
          <article className="quality-card research">
            <div className="quality-label">
              <LabelWithHelp
                label="INDEPENDENT VALUE / BASE STUDY"
                help="An academic study separated named independent services from internal transfers and activity classified as fictitious."
              />
            </div>
            <strong>
              {formatCurrency(authentic.independentValueFloorUsd)}–{formatCurrency(
                authentic.independentValueCeilingUsd
              )}
            </strong>
            <div className="provider-pair">
              <span>{formatPercent(authentic.fictitiousTxShare)} fictitious</span>
              <span>{formatPercent(authentic.internalClusterShare)} internal cluster</span>
            </div>
            <p>A 280-day historical range. It is not applied to today’s totals.</p>
          </article>
        </div>

        <div className="signal-matrix">
          <header>
            <div>
              <div className="section-kicker">SCORE INPUTS</div>
              <h3>How the score is built.</h3>
            </div>
            <span className="matrix-note">
              Rule-based score
              <InfoTip label="rule-based score">
                Each row has a fixed weight and range. The score summarizes current public
                data. It is not a forecast or a statistical probability.
              </InfoTip>
            </span>
          </header>
          {snapshot.components.map((component) => (
            <div className="component-row" key={component.id}>
              <div>
                <strong>{component.label}</strong>
                <span>
                  {component.available === false ? "SOURCE UNAVAILABLE / " : ""}
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
            <h2 id="ratios-title">Scale and concentration.</h2>
          </div>
          <p className="section-note">
            Ratios compare each headline with the base that produced it.
          </p>
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
                <tr key={row.id}>
                  <td>{row.label}</td>
                  <td className="table-value">{ratioValue(row)}</td>
                  <td>{row.definition}</td>
                  <td>{ratioRead(row.id, row.value)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="section-shell source-section" id="sources" aria-labelledby="sources-title">
        <div className="section-heading">
          <div>
            <div className="section-kicker">PUBLIC SOURCES</div>
            <h2 id="sources-title">Check the underlying data.</h2>
          </div>
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
              <span className="source-link">Open page ↗</span>
            </a>
          ))}
        </div>
        <div className="methodology-note">
          <div className="methodology-index">01</div>
          <p>
            <strong>A stronger signal</strong>
            Software payment value rises across more buyer and seller addresses. Stablecoin
            supply, DEX volume, or package downloads rise in the same period.
          </p>
          <div className="methodology-index">02</div>
          <p>
            <strong>A weaker signal</strong>
            One operator drives the count, providers disagree, sources go stale, or payments
            loop within the same group.
          </p>
        </div>
      </section>

      <footer>
        <div className="radar-mark">OES <span>/</span> RADAR</div>
        <p>Methodology v{snapshot.meta.methodologyVersion}</p>
        <a
          href="https://github.com/welttowelt/open-economic-systems-radar"
          target="_blank"
          rel="noreferrer"
        >
          welttowelt / source ↗
        </a>
        <p>Refresh windows: {snapshot.meta.refreshWindowsUtc.join(" / ")} UTC</p>
      </footer>
    </main>
  );
}
