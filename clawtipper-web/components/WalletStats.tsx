"use client";

import { motion } from "framer-motion";
import { useActivity } from "@/components/activity-context";
import { Loader2, Radio, Database } from "lucide-react";
import { useCountUp } from "@/hooks/use-count-up";

export function WalletStats() {
  const { loading, indexer } = useActivity();

  const total = useCountUp(indexer.outgoingTotalUsdt, 800);
  const count = useCountUp(indexer.outgoingCount, 600);

  const hasLive =
    indexer.configured &&
    indexer.items.length > 0 &&
    !indexer.error;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="mb-10 rounded-xl border-2 border-slate-300 bg-white px-4 py-5 shadow-md"
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Database className="h-5 w-5 text-emerald-700" aria-hidden />
          <h2 className="text-lg font-extrabold text-slate-950">
            Wallet · on-chain stats
          </h2>
        </div>
        <span
          className={`inline-flex items-center gap-1.5 rounded-full border-2 px-2.5 py-1 text-xs font-bold uppercase tracking-wide ${
            hasLive
              ? "border-emerald-500 bg-emerald-50 text-emerald-950"
              : indexer.configured
                ? "border-amber-400 bg-amber-50 text-amber-950"
                : "border-slate-300 bg-slate-100 text-slate-800"
          }`}
        >
          <Radio className="h-3.5 w-3.5" aria-hidden />
          {hasLive
            ? "WDK Indexer"
            : indexer.configured
              ? "Indexer · no rows / error"
              : "Configure AGENT_WALLET + WDK_INDEXER_API_KEY"}
        </span>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border-2 border-slate-200 bg-slate-50 px-4 py-3">
          <div className="text-xs font-bold uppercase tracking-wide text-slate-600">
            Outgoing USDT (tips)
          </div>
          <div className="mt-1 font-mono text-2xl font-bold tabular-nums text-slate-950">
            {loading ? (
              <Loader2 className="h-6 w-6 animate-spin text-slate-500" />
            ) : (
              `${total.toFixed(2)} USDT`
            )}
          </div>
          <p className="mt-1 text-xs font-medium text-slate-600">
            Sum of outbound transfers from your agent address (indexer).
          </p>
        </div>
        <div className="rounded-lg border-2 border-slate-200 bg-slate-50 px-4 py-3">
          <div className="text-xs font-bold uppercase tracking-wide text-slate-600">
            Outbound transfers
          </div>
          <div className="mt-1 font-mono text-2xl font-bold tabular-nums text-slate-950">
            {loading ? (
              <Loader2 className="h-6 w-6 animate-spin text-slate-500" />
            ) : (
              String(Math.round(count))
            )}
          </div>
          <p className="mt-1 text-xs font-medium text-slate-600">
            Hybrid model: JSON logs = decisions; indexer = proof.
          </p>
        </div>
      </div>
      {indexer.error && indexer.configured && (
        <p className="mt-3 text-xs font-semibold text-amber-900">
          Indexer note: {indexer.error} — check env, chain, and API key.
        </p>
      )}
    </motion.div>
  );
}
