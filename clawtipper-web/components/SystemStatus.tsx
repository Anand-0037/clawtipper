"use client";

import { useActivity } from "@/components/activity-context";

export function SystemStatus() {
  const { loading, source, stats, feedTruth } = useActivity();

  const remoteOk = !loading && source === "remote";
  const demo = !loading && source === "demo";
  const empty = !loading && source === "empty";

  const label = loading
    ? "Syncing feed…"
    : feedTruth === "live"
      ? "Live rows · no fake ticker"
      : remoteOk
        ? "Remote JSON"
        : demo
          ? "Demo mode · simulation ticker on"
          : empty
            ? "Waiting for data"
            : "Connecting…";

  const color =
    remoteOk ? "text-emerald-700" : demo ? "text-amber-700" : "text-amber-800";

  return (
    <div className="flex flex-wrap items-center gap-2">
      {remoteOk && (
        <span
          className="inline-flex items-center rounded-full border-2 border-emerald-600 bg-emerald-50 px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-emerald-900 shadow-sm"
          title="ACTIVITY_SOURCE_URL returned data — judges see real agent log rows"
        >
          Live system
        </span>
      )}
      <div
        className="inline-flex items-center gap-2 rounded-full border-2 border-slate-300 bg-white px-3 py-1.5 shadow-sm"
        title={`${stats.processed} rows in merged window`}
      >
        <span className={`relative flex h-2.5 w-2.5 shrink-0 ${color}`}>
          <span
            className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-40 ${
              remoteOk ? "bg-emerald-600" : "bg-amber-500"
            }`}
          />
          <span
            className={`relative inline-flex h-2.5 w-2.5 rounded-full ${
              remoteOk ? "bg-emerald-600" : "bg-amber-600"
            }`}
          />
        </span>
        <span className="text-xs font-semibold text-slate-800">{label}</span>
      </div>
    </div>
  );
}
