"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ExternalLink, CheckCircle2, ShieldCheck, Satellite } from "lucide-react";
import { useActivity } from "@/components/activity-context";
import { MOCK_PRESENTATION_TX } from "@/lib/mock-activity";

export function TxCard() {
  const { latestTip, source, indexer, feedTruth, allowClientSimulation } =
    useActivity();

  const hasActivityTip = latestTip != null && latestTip.txHash.length > 10;
  const hasIndexerTip =
    indexer.latestOutgoing != null &&
    indexer.latestOutgoing.hash.length > 10 &&
    indexer.configured;

  const hasProof = hasIndexerTip || hasActivityTip;

  /** No fake hash / explorer link unless demo mode is explicitly enabled. */
  if (!hasProof && !allowClientSimulation) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
      >
        <Card className="border-2 border-slate-300 bg-gradient-to-b from-slate-50 to-white shadow-md">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-slate-950">
              On-chain proof
            </CardTitle>
            <p className="text-sm font-semibold text-slate-700">
              No verified outbound USDT yet. After you run a real tip, this card
              fills from your activity JSON or the WDK Indexer.
            </p>
          </CardHeader>
          <CardContent className="space-y-3 text-sm font-medium text-slate-800">
            <ul className="list-inside list-disc space-y-2">
              <li>
                Point <code className="rounded bg-slate-200 px-1">ACTIVITY_SOURCE_URL</code>{" "}
                at hosted <code className="rounded bg-slate-200 px-1">transactions.json</code>
              </li>
              <li>
                Or set <code className="rounded bg-slate-200 px-1">AGENT_WALLET_ADDRESS</code>{" "}
                + <code className="rounded bg-slate-200 px-1">WDK_INDEXER_API_KEY</code>
              </li>
            </ul>
            <p className="rounded-lg border border-slate-300 bg-slate-100 px-3 py-2 text-xs font-bold text-slate-900">
              Local marketing only: set{" "}
              <code className="font-mono">ALLOW_ACTIVITY_DEMO=true</code> to show
              a placeholder tx in this card.
            </p>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  /** Prefer WDK Indexer for “on-chain proof” when we have a real outbound row. */
  const display = hasIndexerTip
    ? {
        txHash: indexer.latestOutgoing!.hash,
        explorerUrl: `https://polygonscan.com/tx/${indexer.latestOutgoing!.hash}`,
        amount: indexer.latestOutgoing!.amount,
        prId: undefined as string | undefined,
      }
    : hasActivityTip
      ? {
          txHash: latestTip!.txHash,
          explorerUrl: latestTip!.explorerUrl,
          amount: latestTip!.amount,
          prId: latestTip!.prId,
        }
      : MOCK_PRESENTATION_TX;

  const illustrative = !hasIndexerTip && !hasActivityTip;
  const verifiedByIndexer = hasIndexerTip;

  const short = `${display.txHash.slice(0, 10)}…${display.txHash.slice(-8)}`;
  const explorer =
    display.explorerUrl ||
    `https://polygonscan.com/tx/${display.txHash}`;

  const ts = verifiedByIndexer
    ? new Date(indexer.latestOutgoing!.timestamp).toLocaleString([], {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : new Date().toLocaleString([], {
        dateStyle: "medium",
        timeStyle: "short",
      });

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
    >
      <Card className="border-2 border-emerald-300 bg-gradient-to-b from-emerald-50 to-white shadow-md">
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-200 text-xl font-bold text-emerald-900">
                ₮
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <CardTitle className="text-lg font-bold text-slate-950">
                    On-chain proof
                  </CardTitle>
                  {verifiedByIndexer ? (
                    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500 bg-emerald-100 px-2 py-1 text-xs font-bold uppercase tracking-wide text-emerald-950">
                      <Satellite className="h-3.5 w-3.5" />
                      WDK Indexer
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400 bg-emerald-100 px-2 py-1 text-xs font-bold uppercase tracking-wide text-emerald-950">
                      <ShieldCheck className="h-3.5 w-3.5" />
                      Polygon
                    </span>
                  )}
                </div>
                <p className="text-sm font-semibold text-slate-700">
                  USDT · ERC-20
                  {verifiedByIndexer && (
                    <span className="ml-2 font-mono text-xs text-slate-600">
                      Executed via WDK · verified on-chain
                    </span>
                  )}
                </p>
              </div>
            </div>
            <span className="flex items-center gap-1 font-mono text-xl font-bold text-emerald-800">
              <CheckCircle2 className="h-6 w-6 shrink-0" />+
              {display.amount.toFixed(2)} USDT
            </span>
          </div>
          <p className="mt-2 font-mono text-xs font-semibold text-slate-700">{ts}</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {verifiedByIndexer ? (
              <span className="rounded-full border border-emerald-500 bg-emerald-50 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-emerald-950">
                Indexer · live chain
              </span>
            ) : feedTruth === "live" ? (
              <span className="rounded-full border border-emerald-500 bg-emerald-50 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-emerald-950">
                Live activity feed
              </span>
            ) : (
              <span className="rounded-full border border-amber-500 bg-amber-50 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-amber-950">
                Illustration (demo opt-in)
              </span>
            )}
          </div>
          {illustrative && (
            <p className="rounded-lg border-2 border-amber-300 bg-amber-100 px-3 py-2 text-sm font-semibold text-amber-950">
              No indexer row yet — set{" "}
              <code className="rounded bg-amber-200 px-1">AGENT_WALLET_ADDRESS</code>{" "}
              + <code className="rounded bg-amber-200 px-1">WDK_INDEXER_API_KEY</code>{" "}
              for on-chain proof, or use activity feed (
              {source === "remote" ? "remote JSON" : "log / demo"}).
            </p>
          )}
          <div className="rounded-lg border-2 border-slate-300 bg-slate-100 p-4 font-mono text-sm">
            <div className="mb-1 text-xs font-bold uppercase tracking-wide text-slate-700">
              Transaction hash
            </div>
            <div className="break-all font-semibold text-blue-900">{short}</div>
            {display.prId && (
              <div className="mt-2 text-sm font-bold text-slate-800">
                PR {display.prId}
              </div>
            )}
            {verifiedByIndexer && indexer.latestOutgoing?.to && (
              <div className="mt-2 text-xs font-medium text-slate-600">
                To:{" "}
                <span className="font-mono text-slate-800">
                  {indexer.latestOutgoing.to.slice(0, 10)}…
                  {indexer.latestOutgoing.to.slice(-6)}
                </span>
              </div>
            )}
          </div>
          <a
            href={explorer}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-base font-bold text-blue-800 underline decoration-2 underline-offset-4 hover:text-blue-950"
          >
            View on Polygonscan
            <ExternalLink className="h-5 w-5" />
          </a>
          <p className="text-sm font-medium leading-relaxed text-slate-800">
            {verifiedByIndexer
              ? "Latest outbound USDT from the agent wallet, read from the Tether WDK Indexer API (not mock)."
              : hasActivityTip
                ? "Latest successful tip from merged activity feed."
                : "Placeholder hash for local UI only — not a real transaction."}
          </p>
        </CardContent>
      </Card>
    </motion.div>
  );
}
