import type {
  ActivityEntry,
  ActivityPayload,
  ActivityStats,
  LatestTip,
} from "@/lib/activity-types";
import { parseRoiFromReason } from "@/lib/activity-types";

export function normalizeRaw(raw: unknown[]): ActivityEntry[] {
  return raw.map((r) => {
    const o = r as Record<string, unknown>;
    const pr = String(o.pr || "");
    const match = pr.match(/github\.com\/([^/]+\/[^/]+)\/pull\/(\d+)/);
    const repo = match ? match[1] : String(o.prId || "").split("#")[0] || "—";
    const prIdStr = (o.prId as string) || pr || "event";
    const title =
      (o.title as string) ||
      (typeof o.reason === "string" && o.reason.length <= 72
        ? o.reason
        : `PR ${prIdStr}`);
    const reason = o.reason as string | undefined;
    const roiFromField =
      typeof o.roiScore === "number" ? o.roiScore : parseRoiFromReason(reason);

    return {
      pr,
      prId: (o.prId as string) || pr,
      title,
      repo,
      reason,
      status: o.status as string | undefined,
      amount: typeof o.amount === "number" ? o.amount : undefined,
      timestamp: o.timestamp as string | undefined,
      txHash: o.txHash as string | undefined,
      explorerUrl: o.explorerUrl as string | undefined,
      author: o.author as string | undefined,
      roiScore: roiFromField,
      simulated: o.simulated as boolean | undefined,
    };
  });
}

export function computeStats(entries: ActivityEntry[]): ActivityStats {
  const approved = entries.filter(
    (e) =>
      e.txHash != null &&
      e.txHash !== "" &&
      typeof e.amount === "number" &&
      e.amount > 0
  );

  const totalTippedUsdt = approved.reduce((s, e) => s + (e.amount || 0), 0);
  const processed = entries.length;
  const approvedCount = approved.length;
  const rejectedCount = Math.max(0, processed - approvedCount);
  const rejectionRatePercent =
    processed > 0 ? Math.round((rejectedCount / processed) * 1000) / 10 : 0;

  return {
    totalTippedUsdt: Math.round(totalTippedUsdt * 100) / 100,
    processed,
    rejectionRatePercent,
    approvedCount,
    rejectedCount,
  };
}

export function latestApproved(entries: ActivityEntry[]): LatestTip {
  const withTx = entries.filter(
    (e) => e.txHash && typeof e.amount === "number" && e.amount > 0
  );
  if (withTx.length === 0) return null;
  withTx.sort((a, b) => {
    const ta = a.timestamp ? new Date(a.timestamp).getTime() : 0;
    const tb = b.timestamp ? new Date(b.timestamp).getTime() : 0;
    return tb - ta;
  });
  const last = withTx[0];
  return {
    txHash: last.txHash!,
    explorerUrl: last.explorerUrl,
    amount: last.amount!,
    prId: last.prId,
  };
}

export function buildPayload(
  entries: ActivityEntry[],
  source: ActivityPayload["source"]
): ActivityPayload {
  const sorted = [...entries].sort((a, b) => {
    const ta = a.timestamp ? new Date(a.timestamp).getTime() : 0;
    const tb = b.timestamp ? new Date(b.timestamp).getTime() : 0;
    return tb - ta;
  });

  const feedTruth: ActivityPayload["feedTruth"] =
    source === "remote" ? "live" : "simulation";

  return {
    source,
    feedTruth,
    entries: sorted.slice(0, 24),
    stats: computeStats(sorted),
    latestTip: latestApproved(sorted),
  };
}

/** Remote body: raw `transactions.json` array or full ActivityPayload. */
export function parseRemoteBody(json: unknown): ActivityEntry[] {
  if (Array.isArray(json)) {
    return normalizeRaw(json);
  }
  if (
    json &&
    typeof json === "object" &&
    Array.isArray((json as ActivityPayload).entries)
  ) {
    return normalizeRaw((json as ActivityPayload).entries as unknown[]);
  }
  return [];
}
