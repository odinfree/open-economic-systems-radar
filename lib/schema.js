export const SNAPSHOT_SCHEMA_VERSION = "1.5.0";

export const ADOPTION_METRICS = [
  {
    id: "new-verified-integrations-30d",
    role: "MAIN PROOF",
    label: "New verified integrations / 30D",
    available: false,
    definition:
      "New public services or repositories with an inspectable x402 or MPP integration."
  },
  {
    id: "retained-integrations-30d-90d",
    role: "RETENTION CHECK",
    label: "Retained integrations / 30D and 90D",
    available: false,
    definition:
      "Verified integrations observed again 30 and 90 days after their first activity."
  },
  {
    id: "first-time-contributors-30d",
    role: "SUPPORTING CHECK",
    label: "First-time contributors / 30D",
    available: false,
    definition:
      "Unique non-bot contributors making their first accepted public contribution."
  },
  {
    id: "new-importing-repositories-30d",
    role: "SUPPORTING CHECK",
    label: "New importing repositories / 30D",
    available: false,
    definition:
      "New non-fork public repositories adding @x402/core or mppx as a direct dependency."
  }
];

export function applyRequiredSourceStatus(metrics, requiredFailures = []) {
  if (!requiredFailures.length) return metrics;
  return {
    ...metrics,
    verdict: {
      ...metrics.verdict,
      state: "DATA GAP",
      scoreAvailable: false,
      confidence: "LOW",
      summary:
        "Required sources are unavailable. The shift score is paused until a complete snapshot is available."
    }
  };
}

export function snapshotCacheControl(status) {
  return status === "partial"
    ? "no-store"
    : "public, max-age=0, s-maxage=21600, stale-while-revalidate=900";
}
