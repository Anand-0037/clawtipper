"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingDown, TrendingUp } from "lucide-react";

function Bar({
  label,
  value,
  max,
  tone,
}: {
  label: string;
  value: number;
  max: number;
  tone: "low" | "high";
}) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  return (
    <div className="space-y-1">
      <div className="flex justify-between font-mono text-[10px] text-slate-500">
        <span>{label}</span>
        <span className="text-slate-700">{value.toLocaleString()}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-200">
        <motion.div
          className={
            tone === "high"
              ? "h-full rounded-full bg-gradient-to-r from-[#166534] to-[#22c55e]"
              : "h-full rounded-full bg-gradient-to-r from-rose-900 to-rose-600/80"
          }
          initial={{ width: 0 }}
          whileInView={{ width: `${pct}%` }}
          viewport={{ once: true }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>
    </div>
  );
}

const rejectExample = {
  title: "Trivial README tweak",
  additions: 1,
  deletions: 0,
  stars: 240_000,
  followers: 120,
  score: 0.3,
  outcome: "Rejected: ROI < threshold (agent refuses low-signal diffs)",
};

const approveExample = {
  title: "Refactor payment module",
  additions: 420,
  deletions: 88,
  stars: 18_500,
  followers: 890,
  score: 3.8,
  outcome: "Approved: strong economic value · within wallet budget",
};

const MAX_LINES = 500;
const MAX_STARS = 300_000;
const MAX_FOLLOWERS = 2000;
const MAX_SCORE = 5;

function MiniScore({
  data,
  positive,
}: {
  data: typeof rejectExample;
  positive: boolean;
}) {
  return (
    <Card
      className={
        positive
          ? "border-emerald-200 bg-emerald-50/60"
          : "border-rose-200 bg-rose-50/60"
      }
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-sm font-medium text-slate-900">
            {data.title}
          </CardTitle>
          {positive ? (
            <TrendingUp className="h-5 w-5 shrink-0 text-emerald-600" />
          ) : (
            <TrendingDown className="h-5 w-5 shrink-0 text-rose-600" />
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-2 font-mono text-[11px] text-slate-600">
          <div>
            <span className="text-slate-500">additions</span>
            <div className="text-slate-900">{data.additions}</div>
          </div>
          <div>
            <span className="text-slate-500">deletions</span>
            <div className="text-slate-900">{data.deletions}</div>
          </div>
        </div>
        <Bar
          label="Change magnitude (lines)"
          value={data.additions + data.deletions}
          max={MAX_LINES}
          tone={positive ? "high" : "low"}
        />
        <Bar
          label="Repo stars (signal)"
          value={data.stars}
          max={MAX_STARS}
          tone={positive ? "high" : "low"}
        />
        <Bar
          label="Author followers"
          value={data.followers}
          max={MAX_FOLLOWERS}
          tone={positive ? "high" : "low"}
        />
        <Bar
          label="Computed ROI score"
          value={data.score}
          max={MAX_SCORE}
          tone={positive ? "high" : "low"}
        />
        <p
          className={
            positive ? "text-sm text-emerald-800" : "text-sm text-rose-800"
          }
        >
          {data.outcome}
        </p>
      </CardContent>
    </Card>
  );
}

export function ScoreShowcase() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      className="space-y-6"
    >
      <div>
        <h2 className="text-2xl font-extrabold tracking-tight text-slate-950">
          Economic engine
        </h2>
        <p className="mt-2 max-w-2xl text-base font-medium leading-relaxed text-slate-800">
          Signals from the diff, repository reach, and contributor reputation
          roll into an ROI score — then hard filters and the LLM decide if USDT
          should move.
        </p>
        <p className="mt-3 font-mono text-sm font-semibold text-blue-900">
          score ≈ f(additions, deletions, repo ★, followers, …)
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <MiniScore data={rejectExample} positive={false} />
        <MiniScore data={approveExample} positive />
      </div>
    </motion.div>
  );
}
