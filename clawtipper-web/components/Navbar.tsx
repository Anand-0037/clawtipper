"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Github, Play, Hexagon, Loader2 } from "lucide-react";
import { useActivity } from "@/components/activity-context";

const GITHUB_URL =
  process.env.NEXT_PUBLIC_GITHUB_REPO || "https://github.com";

export function Navbar() {
  const { runLiveDemo, demoInitializing, allowClientSimulation } = useActivity();

  return (
    <header className="sticky top-0 z-50 border-b-2 border-slate-300 bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <Link
          href="/"
          className="flex items-center gap-2 text-lg font-bold tracking-tight text-slate-950"
        >
          <Hexagon className="h-6 w-6 shrink-0 text-emerald-700" aria-hidden />
          <span>ClawTipper</span>
        </Link>
        <nav className="flex items-center gap-2 sm:gap-3">
          <Button variant="ghost" size="sm" className="hidden font-semibold sm:inline-flex" asChild>
            <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer">
              <Github className="h-4 w-4" />
              GitHub
            </a>
          </Button>
          <Button variant="ghost" size="sm" className="sm:hidden p-2" asChild>
            <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer" aria-label="GitHub">
              <Github className="h-4 w-4" />
            </a>
          </Button>
          {allowClientSimulation && (
            <Button size="sm" className="font-semibold" onClick={runLiveDemo} disabled={demoInitializing}>
              {demoInitializing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Play className="h-4 w-4" />
              )}
              Run live demo
            </Button>
          )}
        </nav>
      </div>
    </header>
  );
}
