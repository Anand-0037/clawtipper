/** remote = ACTIVITY_SOURCE_URL, demo = server mock, empty = no rows */
export type ActivitySource = "remote" | "demo" | "empty";

export type ActivityEntry = {
  pr?: string;
  prId?: string;
  title?: string;
  repo?: string;
  reason?: string;
  status?: string;
  amount?: number;
  timestamp?: string;
  txHash?: string;
  explorerUrl?: string;
  author?: string;
  roiScore?: number;
  /** UI-only: client simulation layer */
  simulated?: boolean;
};

export type ActivityStats = {
  totalTippedUsdt: number;
  processed: number;
  rejectionRatePercent: number;
  approvedCount: number;
  rejectedCount: number;
};

export type LatestTip = {
  txHash: string;
  explorerUrl?: string;
  amount: number;
  prId?: string;
} | null;

/** Judge-friendly: remote JSON / local logs = live; demo seed = simulation. */
export type ActivityFeedTruth = "live" | "simulation";

export type ActivityPayload = {
  source: ActivitySource;
  /** Derived: `live` when `source === "remote"` (real hosted or sibling logs). */
  feedTruth: ActivityFeedTruth;
  entries: ActivityEntry[];
  stats: ActivityStats;
  latestTip: LatestTip;
  /**
   * When `false` on server: no client preview ticker or preview CTA.
   * `true` enables optional sample rows + Preview activity (local / staging).
   */
  allowClientSimulation?: boolean;
};

export function parseRoiFromReason(reason?: string): number | undefined {
  if (!reason) return undefined;
  const m = reason.match(/ROI score\s+([\d.]+)/i);
  if (m) return parseFloat(m[1]);
  return undefined;
}
