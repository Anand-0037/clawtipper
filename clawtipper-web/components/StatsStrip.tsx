"use client";

import { motion } from "framer-motion";
import { useActivity } from "@/components/activity-context";
import { Loader2 } from "lucide-react";
import { useCountUp } from "@/hooks/use-count-up";

export function StatsStrip() {
  const { stats, source, loading, feedTruth } = useActivity();

  const animTip = useCountUp(stats.totalTippedUsdt, 900);
  const animProcessed = useCountUp(stats.processed, 700);
  const animReject = useCountUp(stats.rejectionRatePercent, 750);

  const items = [
    {
      label: "Total tipped",
      value: `${animTip.toFixed(2)} USDT`,
    },
    {
      label: "PRs processed",
      value: String(Math.round(animProcessed)),
    },
    {
      label: "Rejection rate",
      value:
        stats.processed > 0 ? `${animReject.toFixed(1)}%` : "—",
    },
  ];

  const badge =
    feedTruth === "live"
      ? { text: "Stats from live activity feed", cls: "bg-emerald-200 text-emerald-950" }
      : source === "demo"
        ? { text: "Demo mode — stats mix demo + sim", cls: "bg-amber-200 text-amber-950" }
        : { text: "No live URL — demo / simulation", cls: "bg-slate-300 text-slate-900" };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-8 grid grid-cols-1 gap-3 rounded-xl border-2 border-slate-300 bg-white px-4 py-5 shadow-md sm:grid-cols-3"
    >
      {items.map((item) => (
        <div
          key={item.label}
          className="border-b border-slate-200 pb-3 text-center last:border-0 last:pb-0 sm:border-b-0 sm:pb-0 sm:text-left"
        >
          <div className="text-xs font-bold uppercase tracking-wide text-slate-700">
            {item.label}
          </div>
          <div className="mt-1.5 flex min-h-[2rem] items-center justify-center gap-2 font-mono text-xl font-bold tabular-nums text-slate-950 sm:justify-start">
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin text-slate-500" />
            ) : (
              item.value
            )}
          </div>
        </div>
      ))}
      <div className="col-span-full flex flex-col items-center gap-2 border-t border-slate-200 pt-4 sm:col-span-3 sm:flex-row sm:justify-between">
        <span className={`rounded-full px-3 py-1 text-xs font-bold ${badge.cls}`}>
          {badge.text}
        </span>
        <span className="text-center text-xs font-medium text-slate-700 sm:text-left">
          {feedTruth === "live"
            ? "Live feed: stats from real rows only (no fake ticker)"
            : "Demo: stats merge API + jitter simulation (~2–4s)"}
        </span>
      </div>
    </motion.div>
  );
}
