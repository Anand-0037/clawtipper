"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  GitPullRequest,
  CheckCircle2,
  XCircle,
  Loader2,
  Banknote,
  AlertCircle,
} from "lucide-react";
import { useActivity } from "@/components/activity-context";
import type { ActivityEntry } from "@/lib/activity-types";

function isApproved(e: ActivityEntry) {
  return (
    e.txHash != null &&
    e.txHash !== "" &&
    typeof e.amount === "number" &&
    e.amount > 0
  );
}

function isPending(e: ActivityEntry) {
  return (
    e.status === "evaluating" ||
    (e.reason?.includes("Polling") ?? false) ||
    (e.reason?.includes("Evaluating") ?? false)
  );
}

function displayRoi(e: ActivityEntry): string | null {
  if (e.roiScore != null) return e.roiScore.toFixed(1);
  const m = e.reason?.match(/([\d.]+)\s*[<≥]/);
  if (m) return m[1];
  return null;
}

export function ActivityFeed() {
  const { entries, loading, feedTruth, indexer, allowClientSimulation } =
    useActivity();
  const [spotlight, setSpotlight] = useState(0);

  const list = useMemo(() => entries, [entries]);

  useEffect(() => {
    if (list.length === 0) {
      setSpotlight(0);
      return;
    }
    const id = setInterval(() => {
      setSpotlight((s) => (s + 1) % list.length);
    }, 2600);
    return () => clearInterval(id);
  }, [list.length]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="text-2xl font-extrabold tracking-tight text-slate-950">
          Activity
        </h2>
        {loading && <Loader2 className="h-5 w-5 animate-spin text-slate-600" />}
        {feedTruth === "live" ? (
          <span className="inline-flex items-center rounded-full border-2 border-emerald-600 bg-emerald-50 px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-emerald-950">
            Live activity data
          </span>
        ) : (
          <span className="inline-flex items-center rounded-full border-2 border-amber-500 bg-amber-50 px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-amber-950">
            Activity backend offline
          </span>
        )}
        {indexer.configured && indexer.items.length > 0 && (
          <span className="inline-flex items-center rounded-full border border-cyan-600 bg-cyan-50 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-cyan-950">
            Indexer OK
          </span>
        )}
        <span className="max-w-xl font-mono text-xs font-medium leading-snug text-slate-700">
          Newest first · max 10 ·{" "}
          {feedTruth === "live"
            ? "rows from ACTIVITY_SOURCE_URL or linked agent logs"
            : "connect ACTIVITY_SOURCE_URL when the agent export is hosted"}
        </span>
      </div>

      {list.length === 0 && !loading ? (
        <div className="rounded-xl border-2 border-dashed border-slate-400 bg-white p-8 text-center shadow-inner">
          {allowClientSimulation === false ? (
            <p className="text-base font-semibold leading-relaxed text-slate-900">
              <strong className="text-amber-900">Activity feed not wired to this deployment.</strong>{" "}
              When your agent backend is live, publish{" "}
              <code className="rounded bg-slate-200 px-1.5 py-0.5 font-mono text-sm">
                transactions.json
              </code>{" "}
              and set{" "}
              <code className="rounded bg-slate-200 px-1.5 py-0.5 font-mono text-sm">
                ACTIVITY_SOURCE_URL
              </code>{" "}
              in hosting (e.g. Vercel) environment variables.
            </p>
          ) : (
            <p className="text-base font-medium leading-relaxed text-slate-800">
              Set{" "}
              <code className="rounded bg-slate-200 px-1.5 py-0.5 font-mono text-sm font-bold text-slate-900">
                ACTIVITY_SOURCE_URL
              </code>{" "}
              or use{" "}
              <strong className="text-slate-950">Preview activity</strong> for
              sample rows only.
            </p>
          )}
        </div>
      ) : (
        <div className="grid gap-3">
          <AnimatePresence initial={false}>
            {list.map((item, i) => {
              const approved = isApproved(item);
              const pending = isPending(item);
              const rejected = !approved && !pending;
              const roi = rejected ? displayRoi(item) : null;
              const active = list.length > 0 && i === spotlight;
              const newest = i === 0;

              return (
                <motion.div
                  key={`${item.prId}-${item.timestamp}-${item.simulated ? "s" : "r"}-${i}`}
                  layout
                  initial={{ opacity: 0, y: 28 }}
                  animate={{
                    opacity: 1,
                    y: 0,
                    scale: active ? 1.02 : 1,
                  }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ type: "spring", stiffness: 380, damping: 28 }}
                  className={active ? "relative z-10" : ""}
                >
                  <Card
                    className={`overflow-hidden transition-shadow duration-300 ${
                      approved
                        ? "border-emerald-400/70 shadow-md shadow-emerald-600/10"
                        : pending
                          ? "border-amber-400/60 shadow-md shadow-amber-500/10"
                          : "border-rose-400/60 shadow-md shadow-rose-500/10"
                    } ${newest ? "ring-1 ring-blue-400/40" : ""}`}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2 text-slate-800">
                          <GitPullRequest className="h-4 w-4 shrink-0 text-blue-700" />
                          <span className="font-mono text-sm font-semibold">
                            {item.repo}
                          </span>
                          {item.simulated && (
                            <span className="rounded bg-slate-200 px-1.5 py-0.5 font-mono text-xs font-bold text-slate-800">
                              preview
                            </span>
                          )}
                        </div>
                        {approved ? (
                          <span className="flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800">
                            <Banknote className="h-3.5 w-3.5" />
                            Approved
                          </span>
                        ) : pending ? (
                          <span className="flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-900">
                            <AlertCircle className="h-3.5 w-3.5" />
                            In flight
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 rounded-full bg-rose-100 px-2 py-0.5 text-xs font-medium text-rose-800">
                            <XCircle className="h-3.5 w-3.5" />
                            Rejected
                          </span>
                        )}
                      </div>
                      <CardTitle className="pt-1 text-lg font-bold text-slate-950">
                        {item.title || item.reason || item.prId}
                      </CardTitle>
                      {item.author && (
                        <p className="mt-1 font-mono text-sm font-medium text-slate-700">
                          @{item.author}
                        </p>
                      )}
                      {rejected && (
                        <div className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2">
                          <p className="text-xs font-semibold uppercase tracking-wide text-rose-700">
                            ❌ Rejection
                          </p>
                          <p className="mt-1 text-sm text-rose-900">
                            {item.reason || "No reason recorded"}
                          </p>
                          {roi != null && (
                            <p className="mt-2 font-mono text-xs text-rose-800">
                              ROI score: {roi}
                            </p>
                          )}
                        </div>
                      )}
                    </CardHeader>
                    <CardContent className="text-base font-medium text-slate-800">
                      {approved ? (
                        <span className="flex items-center gap-2 font-mono text-emerald-700">
                          <CheckCircle2 className="h-4 w-4 shrink-0" />
                          {item.amount?.toFixed(2)} USDT on Polygon
                          {item.txHash && (
                            <span className="text-slate-500">
                              · {item.txHash.slice(0, 10)}…
                            </span>
                          )}
                        </span>
                      ) : pending ? (
                        <span className="font-semibold text-amber-950">{item.reason}</span>
                      ) : (
                        <span className="text-slate-500">
                          Economic / policy gate blocked payout.
                        </span>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
