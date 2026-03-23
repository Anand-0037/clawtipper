"use client";

import { Terminal } from "@/components/Terminal";
import { ActivityFeed } from "@/components/ActivityFeed";
import { StepRow } from "@/components/StepCard";
import { ScoreShowcase } from "@/components/ScoreCard";
import { TxCard } from "@/components/TxCard";
import { TelegramMock } from "@/components/TelegramMock";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/Navbar";
import { StatsStrip } from "@/components/StatsStrip";
import { SystemStatus } from "@/components/SystemStatus";
import { WalletStats } from "@/components/WalletStats";
import { SectionFade } from "@/components/SectionFade";
import { useActivity } from "@/components/activity-context";
import { Github, Play, Loader2 } from "lucide-react";

const GITHUB_URL =
  process.env.NEXT_PUBLIC_GITHUB_REPO || "https://github.com";

export function ClawtipperLanding() {
  const { runLiveDemo, demoInitializing, allowClientSimulation } = useActivity();

  return (
    <>
      {allowClientSimulation && demoInitializing && (
        <div className="pointer-events-none fixed inset-x-0 top-16 z-[60] flex justify-center px-4">
          <div className="flex items-center gap-2 rounded-full border-2 border-emerald-600 bg-white px-4 py-2.5 font-mono text-sm font-bold text-emerald-950 shadow-xl">
            <Loader2 className="h-3.5 w-3.5 animate-spin text-emerald-600" />
            Initializing agent…
          </div>
        </div>
      )}
      <Navbar />
      <main className="relative bg-grid">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white via-slate-100/30 to-transparent" />

        <section className="relative mx-auto max-w-6xl px-4 pb-16 pt-8 md:pt-12">
          <div className="mb-6 flex flex-wrap items-center gap-3">
            <SystemStatus />
          </div>
          <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
            <div>
              <p className="mb-3 font-mono text-xs font-semibold uppercase tracking-widest text-blue-800">
                Interface layer · autonomous agent
              </p>
              <h1 className="text-balance text-4xl font-extrabold tracking-tight text-slate-950 md:text-5xl lg:text-[3.25rem] lg:leading-[1.12]">
                Autonomous capital allocator for{" "}
                {/* Solid fallback — gradient clip often fails / invisible in some views */}
                <span className="text-emerald-800 underline decoration-emerald-600/40 decoration-2 underline-offset-4">
                  open source
                </span>
              </h1>
              <p className="mt-5 max-w-xl text-lg font-medium leading-relaxed text-slate-700">
                ClawTipper detects valuable GitHub contributions and rewards them
                with USDT — automatically — via Tether WDK on Polygon.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                {allowClientSimulation ? (
                  <Button
                    size="lg"
                    onClick={runLiveDemo}
                    disabled={demoInitializing}
                  >
                    {demoInitializing ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Play className="h-4 w-4" />
                    )}
                    Run live demo
                  </Button>
                ) : (
                  <p className="max-w-md rounded-lg border-2 border-slate-400 bg-slate-100 px-4 py-3 text-sm font-bold text-slate-900">
                    Real-only mode: set{" "}
                    <code className="font-mono">ACTIVITY_SOURCE_URL</code> to raw{" "}
                    <code className="font-mono">transactions.json</code>. For fake
                    feed + simulation (local only), set{" "}
                    <code className="font-mono">ALLOW_ACTIVITY_DEMO=true</code>.
                  </p>
                )}
                <Button variant="outline" size="lg" asChild>
                  <a
                    href={GITHUB_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Github className="h-4 w-4" />
                    View GitHub
                  </a>
                </Button>
              </div>
              <StatsStrip />
            </div>
            <Terminal />
          </div>
        </section>

        <SectionFade
          id="activity"
          className="relative mx-auto max-w-6xl border-t border-slate-200 px-4 py-20"
        >
          <ActivityFeed />
        </SectionFade>

        <SectionFade className="relative mx-auto max-w-6xl border-t border-slate-200 px-4 py-20">
          <h2 className="mb-10 text-2xl font-semibold text-slate-900">
            How it works
          </h2>
          <StepRow />
        </SectionFade>

        <SectionFade className="relative mx-auto max-w-6xl border-t-2 border-slate-300 px-4 py-20">
          <div className="grid gap-14 lg:grid-cols-2 lg:items-start">
            <ScoreShowcase />
            <div>
              <h2 className="mb-6 text-2xl font-extrabold tracking-tight text-slate-950">
                Telegram control
              </h2>
              <TelegramMock />
            </div>
          </div>
        </SectionFade>

        <SectionFade className="relative mx-auto max-w-6xl border-t-2 border-slate-300 px-4 py-20">
          <WalletStats />
          <div className="grid gap-10 lg:grid-cols-2">
            <TxCard />
            <div className="flex flex-col justify-center rounded-xl border-2 border-slate-300 bg-white p-8 shadow-md">
              <h2 className="text-2xl font-extrabold text-slate-950">Business model</h2>
              <ul className="mt-6 space-y-4 text-base font-medium leading-relaxed text-slate-800">
                <li className="flex gap-3">
                  <span className="font-mono text-emerald-600">01</span>
                  Companies fund reward pools for ecosystems they care about.
                </li>
                <li className="flex gap-3">
                  <span className="font-mono text-emerald-600">02</span>
                  The agent evaluates merged PRs and moves USDT on-chain.
                </li>
                <li className="flex gap-3">
                  <span className="font-mono text-emerald-600">03</span>
                  Platform fee on each tip (optional) — sustainable operations.
                </li>
              </ul>
            </div>
          </div>
        </SectionFade>

        <footer className="border-t-2 border-slate-300 bg-white px-4 py-12">
          <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 text-sm font-semibold text-slate-800 md:flex-row">
            <span className="font-mono text-sm text-slate-800">
              ClawTipper · Tether WDK · Polygon USDT
            </span>
            <div className="flex flex-wrap justify-center gap-8">
              <a
                href={GITHUB_URL}
                className="text-slate-900 underline decoration-2 underline-offset-4 hover:text-emerald-800"
                target="_blank"
                rel="noopener noreferrer"
              >
                GitHub
              </a>
              <span className="text-slate-600">Demo video</span>
              <span className="text-slate-600">Docs</span>
            </div>
          </div>
        </footer>
      </main>
    </>
  );
}
