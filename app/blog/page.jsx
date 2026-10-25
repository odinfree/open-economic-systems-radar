import Link from "next/link";
import TrendChart from "@/components/TrendChart";
import InlineTermTip from "@/components/article/InlineTermTip";
import ProviderGapChart from "@/components/article/ProviderGapChart";
import StackedShareChart from "@/components/article/StackedShareChart";
import evidence from "@/data/open-economic-systems-2026-07-20.json";
import {
  formatCurrency,
  formatDateTime,
  formatNumber,
  formatPctPoint,
  formatPercent,
  formatRatio
} from "@/lib/format";

export const metadata = {
  title: "Machine-payment rails are live. Independent demand is unproven.",
  description:
    "Three bullish signals and three bearish constraints for open economic systems, each backed by a chart.",
  openGraph: {
    title: "Machine-payment rails are live. Independent demand is unproven.",
    description:
      "A six-chart field note on open economic systems, machine payments, settlement capacity, concentration, and data quality.",
    type: "article",
    publishedTime: "2026-07-20T00:00:00.000Z"
  }
};

const frozenEvidenceHref =
  "https://github.com/odinfree/open-economic-systems-radar/blob/main/data/open-economic-systems-2026-07-20.json";

function SourceLine({ window, source, href, note }) {
  return (
    <div className="essay-source-line">
      <span>{window}</span>
      <a href={href} target="_blank" rel="noreferrer">
        {source} ↗
      </a>
      {note && <span>{note}</span>}
    </div>
  );
}

function SeriesLegend({ items }) {
  return (
    <div className="essay-series-legend" aria-label="Chart series">
      {items.map((item) => (
        <span key={item.label}>
          <i aria-hidden="true" style={{ background: item.color }} />
          {item.label}
        </span>
      ))}
    </div>
  );
}

function FixedWindowChart({ label, children }) {
  return (
    <div>
      <div className="essay-fixed-window">{label} / NO DAILY SERIES PUBLISHED</div>
      {children}
    </div>
  );
}

function EvidencePoint({
  side,
  index,
  eyebrow,
  title,
  children,
  chart,
  source
}) {
  return (
    <article className={`essay-point essay-point-${side}`}>
      <div className="essay-point-copy">
        <div className="essay-point-index">
          <span>{side.toUpperCase()}</span>
          <b>{String(index).padStart(2, "0")}</b>
        </div>
        <div className="section-kicker">{eyebrow}</div>
        <h2>{title}</h2>
        <div className="essay-point-body">{children}</div>
      </div>
      <figure className="essay-figure">
        {chart}
        <figcaption>{source}</figcaption>
      </figure>
    </article>
  );
}

const stablecoins = evidence.bullish.stablecoins;
const packages = evidence.bullish.packages;
const density = evidence.bullish.paymentDensity;
const authenticity = evidence.bearish.authenticity;
const concentration = evidence.bearish.concentration;
const providerGap = evidence.bearish.providerGap;

export default function BlogPage() {
  return (
    <main className="essay-page">
      <header className="topbar essay-topbar">
        <Link className="radar-mark" href="/" aria-label="Open Economic Systems Radar">
          OES <span>/</span> RADAR
        </Link>
        <nav aria-label="Article navigation">
          <a href="#bull">Bull case</a>
          <a href="#bear">Bear case</a>
          <a href="#threshold">Threshold</a>
        </nav>
        <details className="essay-mobile-nav">
          <summary>Read</summary>
          <div>
            <a href="#bull">Bull case</a>
            <a href="#bear">Bear case</a>
            <a href="#threshold">Threshold</a>
          </div>
        </details>
        <Link className="essay-live-link" href="/">
          Live radar
        </Link>
      </header>

      <article>
        <header className="essay-hero">
          <div className="essay-hero-grid">
            <div className="section-kicker">FIELD NOTE / 20 JUL 2026</div>
            <div className="essay-hero-meta">
              <span>METHOD v{evidence.meta.methodologyVersion}</span>
              <span>{evidence.meta.articleSourceHealth} ARTICLE SOURCES</span>
              <span>SNAPSHOT {formatDateTime(evidence.meta.generatedAt)}</span>
            </div>
          </div>
          <h1>Machine-payment rails are live. Independent demand is unproven.</h1>
          <p className="essay-deck">
            Settlement capacity and early usage are visible. Public data still
            cannot show whether independently operated buyers return to
            independently operated sellers.
          </p>
          <div className="essay-current-read">
            <div>
              <span>BULLISH SIGNALS</span>
              <strong>3</strong>
            </div>
            <div>
              <span>BEARISH CONSTRAINTS</span>
              <strong>3</strong>
            </div>
            <div>
              <span>ARTICLE SOURCES</span>
              <strong>{evidence.meta.articleSourceHealth}</strong>
            </div>
            <p>
              The article freezes one dated snapshot. The live radar can change
              after publication.
            </p>
          </div>
        </header>

        <section className="essay-intro">
          <div className="essay-intro-label">THE CLAIM</div>
          <div>
            <p className="essay-lead">
              An agent operating inside one company&apos;s stack can use API
              keys, cards, and a database. Crypto adds a distinct capability
              when software must hold assets or settle across operators without
              one platform controlling access.
            </p>
            <p>
              We use{" "}
              <InlineTermTip label="open economic systems">
                Networks where independently operated software can find
                counterparties, pay, and get paid without one platform
                controlling access and settlement.
              </InlineTermTip>{" "}
              for that narrower design space. Stablecoin supply provides
              settlement capacity. Package requests and explorer records show
              use, but neither identifies repeat business between unrelated
              actors.
            </p>
          </div>
        </section>

        <section className="essay-case-heading" id="bull">
          <span>01 / BULL CASE</span>
          <h2>Infrastructure before a broad economy.</h2>
          <p>
            These charts show capacity and early use. None of them measures
            retained independent customers.
          </p>
        </section>

        <EvidencePoint
          side="bull"
          index={1}
          eyebrow="SETTLEMENT CAPACITY"
          title={`Stablecoin supply grew ${Math.round(
            stablecoins.growth1yPct
          )}% over one year.`}
          source={
            <SourceLine
              window={`${stablecoins.coverage.start} to ${stablecoins.coverage.end}`}
              source="DeFiLlama stablecoins"
              href="https://defillama.com/stablecoins"
              note="PERIOD CLOSE"
            />
          }
          chart={
            <TrendChart
              data={stablecoins.series}
              aggregation="last"
              defaultCadence="monthly"
              valueType="currency"
              height={330}
              axisColor="var(--body)"
              partialPeriods
              series={[
                {
                  key: "supplyUsd",
                  name: "Stablecoin supply",
                  color: "var(--signal)"
                }
              ]}
              ariaLabel="Global stablecoin supply"
            />
          }
        >
          <p>
            Stablecoin supply stood at{" "}
            <strong>{formatCurrency(stablecoins.currentSupplyUsd)}</strong>, up{" "}
            <strong>{formatPctPoint(stablecoins.growth1yPct)}</strong> over one
            year. <strong>{formatNumber(stablecoins.chainsOver1b)}</strong>{" "}
            chains held more than $1 billion each.
          </p>
          <p>
            The number describes settlement capacity available to software. It
            does not measure software spending. The 90-day change was{" "}
            <strong>{formatPctPoint(stablecoins.growth90dPct)}</strong>, so the
            positive read comes from the longer horizon.
          </p>
        </EvidencePoint>

        <EvidencePoint
          side="bull"
          index={2}
          eyebrow="REGISTRY REQUEST ACTIVITY / LOW CONFIDENCE"
          title={`npm recorded at least ${formatNumber(
            packages.x402Fetches28d
          )} @x402/core fetches in 28 days.`}
          source={
            <SourceLine
              window={`${packages.coverage.start} to ${packages.coverage.end}`}
              source="npm download API"
              href="https://github.com/npm/registry/blob/main/docs/download-counts.md"
              note={`${packages.observedDays} / ${packages.windowDays} DAYS OBSERVED`}
            />
          }
          chart={
            <div>
              <SeriesLegend
                items={[
                  { label: "@x402/core", color: "var(--signal)" },
                  { label: "mppx", color: "var(--text)" }
                ]}
              />
              <TrendChart
                data={packages.series}
                defaultCadence="weekly"
                height={330}
                axisColor="var(--body)"
                measureLabel="OBSERVED PERIOD TOTAL"
                partialPeriods
                dataQualityNote="REGISTRY GAP DAYS OMITTED"
                series={[
                  {
                    key: "x402",
                    name: "@x402/core",
                    color: "var(--signal)"
                  },
                  {
                    key: "mpp",
                    name: "mppx",
                    color: "var(--text)",
                    rawColor: "var(--body)",
                    area: false
                  }
                ]}
                ariaLabel="@x402/core and mppx package fetches"
              />
            </div>
          }
        >
          <p>
            <InlineTermTip label="x402">
              A protocol for attaching a payment request to an HTTP response.
            </InlineTermTip>{" "}
            package requests reached at least{" "}
            <strong>{formatNumber(packages.x402Fetches28d)}</strong> for{" "}
            <code>@x402/core</code> and{" "}
            <strong>{formatNumber(packages.mppFetches28d)}</strong> for{" "}
            <code>mppx</code> in the latest 28-day window.
          </p>
          <p>
            These are registry requests, not people. CI, disposable builds,
            mirrors, transitive installs, robots, and repeats can add to the
            count. The API returned a shared gap on{" "}
            {packages.gapDates.join(", ")}, so totals containing that date are
            lower bounds. The metric cannot identify fresh developers or
            production integrations.
          </p>
        </EvidencePoint>

        <EvidencePoint
          side="bull"
          index={3}
          eyebrow="PAYMENT DENSITY / SOURCE-LIMITED"
          title={`x402scan reported ${formatCurrency(
            density.paymentValue7dUsd
          )} in seven-day payment value.`}
          source={
            <SourceLine
              window={`${density.coverage.start} to ${density.coverage.end}`}
              source="Frozen x402scan evidence"
              href={frozenEvidenceHref}
              note={`${density.coverage.days} DAYS AVAILABLE`}
            />
          }
          chart={
            <TrendChart
              data={density.series}
              defaultCadence="weekly"
              valueType="currency"
              height={330}
              axisColor="var(--body)"
              measureLabel="VALUE / 1,000 RECORDS"
              partialPeriods
              ratio={{
                numeratorKey: "volumeUsd",
                denominatorKey: "records",
                outputKey: "valuePerThousand",
                multiplier: 1_000
              }}
              series={[
                {
                  key: "valuePerThousand",
                  name: "Value per 1,000 records",
                  color: "var(--signal)"
                }
              ]}
              ariaLabel="Software payment value per 1,000 explorer records"
            />
          }
        >
          <p>
            Across x402scan, the latest seven days contained{" "}
            <strong>{formatCurrency(density.paymentValue7dUsd)}</strong> in
            reported value, equal to{" "}
            <strong>{formatCurrency(density.valuePerThousand7d, true)}</strong>{" "}
            per 1,000 records. This is gross explorer-reported activity. It
            cannot verify revenue between independent parties.
          </p>
          <p>
            <InlineTermTip label="Payment density">
              Payment value divided by explorer records, then multiplied by
              1,000. It checks whether a larger count also carries more money.
            </InlineTermTip>{" "}
            uses x402scan&apos;s {density.coverage.days}-day series. MPPscan has
            only {formatNumber(density.excludedMppObservedDays)} observed days
            in this snapshot, so it is excluded from the trend instead of
            zero-filled. The available window cannot establish a medium-term
            trend.
          </p>
        </EvidencePoint>

        <section className="essay-case-heading essay-case-heading-bear" id="bear">
          <span>02 / BEAR CASE</span>
          <h2>The activity is hard to authenticate.</h2>
          <p>
            The strongest negative evidence concerns independence,
            concentration, and incompatible provider totals.
          </p>
        </section>

        <EvidencePoint
          side="bear"
          index={1}
          eyebrow="DATED STUDY / 280 DAYS"
          title="A 280-day Base study classified most settlements as internal."
          source={
            <SourceLine
              window={`${authenticity.coverage.start} to ${authenticity.coverage.end}`}
              source="How Agentic Is Agentic Commerce?"
              href="https://arxiv.org/abs/2607.12575"
              note="PREPRINT"
            />
          }
          chart={
            <FixedWindowChart label="FIXED 280-DAY STUDY TOTAL">
              <StackedShareChart
                segments={authenticity.segments}
                ariaLabel="Historical x402 transaction classification"
              />
            </FixedWindowChart>
          }
        >
          <p>
            In the study&apos;s Base dataset, researchers classified{" "}
            <strong>{formatPercent(authenticity.segments[0].value, 2)}</strong>{" "}
            of settlements as fictitious and{" "}
            <strong>{formatPercent(authenticity.segments[1].value, 2)}</strong>{" "}
            as{" "}
            <InlineTermTip label="internal cluster">
              Payments between addresses the researchers linked into the same
              operational cluster. This does not identify a legal owner.
            </InlineTermTip>
            .
          </p>
          <p>
            At least{" "}
            <strong>
              {formatPercent(authenticity.independentValueFloorShare, 2)}
            </strong>{" "}
            of value demonstrably reached a nameable service. At most{" "}
            <strong>
              {formatPercent(authenticity.independentValueCeilingShare, 1)}
            </strong>
            {" "}was not provably manufactured; that ceiling is not verified
            independent commerce. The study is historical and should not be
            applied mechanically to current explorer totals.
          </p>
        </EvidencePoint>

        <EvidencePoint
          side="bear"
          index={2}
          eyebrow="POINT IN TIME / TRANSACTION COUNT"
          title="One server accounts for four in five records."
          source={
            <SourceLine
              window={concentration.window}
              source="x402scan"
              href="https://www.x402scan.com/"
              note={`${formatNumber(concentration.transactions)} RECORDS`}
            />
          }
          chart={
            <FixedWindowChart label="CURRENT 30-DAY AGGREGATE">
              <StackedShareChart
                segments={concentration.segments}
                ariaLabel="x402scan transaction concentration by listed server"
              />
            </FixedWindowChart>
          }
        >
          <p>
            x402scan attributed{" "}
            <strong>{formatPercent(concentration.segments[0].value, 1)}</strong>{" "}
            of its 30-day transaction count to the largest listed server. The
            next four servers accounted for{" "}
            <strong>{formatPercent(concentration.segments[1].value, 1)}</strong>
            .
          </p>
          <p>
            This is concentration in explorer-record count. It does not measure
            payment value or establish common ownership. The result provides no
            evidence that transaction count is broadly distributed.
          </p>
        </EvidencePoint>

        <EvidencePoint
          side="bear"
          index={3}
          eyebrow="POINT IN TIME / PROVIDER GAP"
          title="Public providers do not agree on market size."
          source={
            <SourceLine
              window={providerGap.window}
              source="x402.org and x402scan"
              href="https://www.x402.org/"
              note={`${formatRatio(providerGap.transactionRatio)} TX / ${formatRatio(
                providerGap.volumeRatio
              )} VALUE`}
            />
          }
          chart={
            <FixedWindowChart label="CURRENT 30-DAY PROVIDER TOTALS">
              <ProviderGapChart comparisons={providerGap.comparisons} />
            </FixedWindowChart>
          }
        >
          <p>
            x402.org&apos;s totals were{" "}
            <strong>
              {formatRatio(providerGap.transactionRatio)}{" "}
              x402scan&apos;s
              transaction count
            </strong>{" "}
            and{" "}
            <strong>{formatRatio(providerGap.volumeRatio)} its value</strong>{" "}
            for their reported 30-day windows.
          </p>
          <p>
            Coverage, indexing, timing, and definitions may explain part of the
            gap. Until the providers reconcile, no single headline total can
            size the market with high confidence.
          </p>
        </EvidencePoint>

        <section className="essay-threshold" id="threshold">
          <div className="section-kicker">WHAT CHANGES THE CALL</div>
          <h2>The decisive evidence comes from outcomes.</h2>
          <p>
            Confidence should rise only after several sources show repeat
            transactions between independently operated buyers and sellers.
          </p>
          <ol>
            <li>
              <span>01</span>
              <div>
                <strong>Repeat independent revenue</strong>
                <p>
                  New integrations return after 30 and 90 days. Independent
                  buyers pay more than one independent seller.
                </p>
              </div>
            </li>
            <li>
              <span>02</span>
              <div>
                <strong>Broader distribution</strong>
                <p>
                  The largest listed server falls below half of transaction
                  count while value and repeat use keep growing.
                </p>
              </div>
            </li>
            <li>
              <span>03</span>
              <div>
                <strong>Totals that reconcile</strong>
                <p>
                  Providers publish compatible coverage definitions and their
                  transaction and value totals converge.
                </p>
              </div>
            </li>
          </ol>
          <div className="essay-final-call">
            <p>
              Crypto is useful when software must hold assets or settle across
              independent operators without one platform acting as gatekeeper.
              Agents operating inside one platform can use conventional rails.
            </p>
            <Link href="/">Open the live radar ↗</Link>
          </div>
        </section>

        <section className="essay-sources" aria-labelledby="essay-sources-title">
          <div>
            <div className="section-kicker">SOURCES AND METHOD</div>
            <h2 id="essay-sources-title">Inspect the data and sources.</h2>
          </div>
          <div className="essay-source-list">
            {evidence.sources.map((source, index) => (
              <a
                href={source.url}
                target="_blank"
                rel="noreferrer"
                key={source.label}
              >
                <span>{String(index + 1).padStart(2, "0")}</span>
                <strong>{source.label}</strong>
                <b>↗</b>
              </a>
            ))}
          </div>
        </section>
      </article>

      <footer className="essay-footer">
        <div className="radar-mark">
          OES <span>/</span> RADAR
        </div>
        <p>Published 20 Jul 2026</p>
        <Link href="/">Live radar</Link>
        <a
          href="https://github.com/odinfree/open-economic-systems-radar"
          target="_blank"
          rel="noreferrer"
        >
          Source ↗
        </a>
      </footer>
    </main>
  );
}
