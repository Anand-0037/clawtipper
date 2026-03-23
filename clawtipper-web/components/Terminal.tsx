"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Terminal as TerminalIcon } from "lucide-react";
import {
  RUN_DEMO_EVENT,
  TERMINAL_APPEND_EVENT,
} from "@/lib/demo-events";
import { useActivity } from "@/components/activity-context";

const SCRIPT: string[] = [
  "[17:02:05] Polling repos… facebook/react, vercel/next.js, octocat/Hello-World",
  "[17:02:12] PR detected: facebook/react#45210 (+842 / -120 lines)",
  "[17:02:13] Evaluating ROI + LLM budget rules…",
  "[17:02:14] ❌ Rejected — trivial change",
  "[17:02:14]    ROI score: 0.3 (threshold 1.5)",
  "[17:02:18] PR detected: vercel/next.js#61234",
  "[17:02:19] LLM: worthy · minLines OK · ROI 3.2",
  "[17:02:20] ✅ Approved: sending 1.20 USDT",
  "[17:02:22] TX sent → polygonscan.com/tx/0x7a3f8c…",
];

function lineClass(line: string) {
  if (line.includes("❌") || line.includes("Rejected")) return "text-rose-300";
  if (line.includes("ROI score")) return "text-amber-300";
  if (line.includes("Evaluating") || line.includes("LLM"))
    return "text-amber-200";
  if (line.includes("Polling")) return "text-slate-400";
  if (line.includes("[live]") || line.includes("[indexer]"))
    return "text-cyan-300";
  if (line.includes("✅") || line.includes("Approved") || line.includes("TX sent"))
    return "text-emerald-400";
  return "text-slate-200";
}

export function Terminal() {
  const { feedTruth, allowClientSimulation } = useActivity();
  const [, setTick] = useState(0);
  const cursor = useRef(true);
  const machine = useRef({
    completed: [] as string[],
    line: "",
    charIndex: 0,
    queue: [] as string[],
  });

  /** No scripted loop when live feed is connected or client preview is disabled. */
  const suppressFakeLoop =
    feedTruth === "live" || allowClientSimulation === false;
  const rerender = useCallback(() => setTick((t) => t + 1), []);

  const hardReset = useCallback(() => {
    machine.current = {
      completed: [],
      line: "",
      charIndex: 0,
      queue: [...SCRIPT],
    };
    rerender();
  }, [rerender]);

  useEffect(() => {
    hardReset();
  }, [hardReset]);

  useEffect(() => {
    const onRun = () => hardReset();
    const onAppend = (e: Event) => {
      const detail = (e as CustomEvent<string>).detail;
      if (typeof detail === "string" && detail.trim()) {
        machine.current.queue.push(detail.trim());
        rerender();
      }
    };
    window.addEventListener(RUN_DEMO_EVENT, onRun);
    window.addEventListener(TERMINAL_APPEND_EVENT, onAppend as EventListener);
    return () => {
      window.removeEventListener(RUN_DEMO_EVENT, onRun);
      window.removeEventListener(
        TERMINAL_APPEND_EVENT,
        onAppend as EventListener
      );
    };
  }, [hardReset, rerender]);

  useEffect(() => {
    const id = setInterval(() => {
      cursor.current = !cursor.current;
      rerender();
    }, 520);
    return () => clearInterval(id);
  }, [rerender]);

  useEffect(() => {
    const id = setInterval(() => {
      const m = machine.current;
      if (m.line && m.charIndex < m.line.length) {
        m.charIndex += 1;
      } else if (m.line) {
        m.completed.push(m.line);
        m.line = m.queue.shift() ?? "";
        m.charIndex = 0;
      } else {
        m.line = m.queue.shift() ?? "";
        m.charIndex = 0;
      }

      if (m.completed.length > 24) {
        m.completed = m.completed.slice(-24);
      }

      if (
        m.queue.length === 0 &&
        !m.line &&
        m.completed.length > 0 &&
        !suppressFakeLoop
      ) {
        m.queue.push(...SCRIPT);
        m.completed = [];
      }

      rerender();
    }, 18);
    return () => clearInterval(id);
  }, [rerender, suppressFakeLoop]);

  useEffect(() => {
    const ms = suppressFakeLoop ? 120_000 : 16_000;
    const id = setInterval(() => {
      hardReset();
    }, ms);
    return () => clearInterval(id);
  }, [hardReset, suppressFakeLoop]);

  const m = machine.current;
  const visibleCurrent = m.line.slice(0, m.charIndex);

  return (
    <motion.div
      id="terminal-window"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="relative overflow-hidden rounded-xl border-2 border-slate-700 bg-slate-900 shadow-xl"
    >
      <div className="flex items-center gap-2 border-b border-slate-600 bg-slate-800 px-4 py-3">
        <div className="flex gap-1.5">
          <span className="h-3 w-3 rounded-full bg-red-500" />
          <span className="h-3 w-3 rounded-full bg-amber-400" />
          <span className="h-3 w-3 rounded-full bg-emerald-500" />
        </div>
        <span className="ml-2 flex items-center gap-2 font-mono text-xs font-medium text-slate-200">
          <TerminalIcon className="h-3.5 w-3.5 text-slate-300" />
          clawtipper-agent — zsh
        </span>
        {feedTruth === "live" && (
          <span className="ml-auto rounded border border-cyan-600/60 bg-cyan-950/50 px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wide text-cyan-200">
            Live feed lines mixed in
          </span>
        )}
        {allowClientSimulation === false && feedTruth !== "live" && (
          <span className="ml-auto rounded border border-slate-500/80 bg-slate-800/80 px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wide text-slate-200">
            Sample output · backend not connected
          </span>
        )}
      </div>
      <div className="max-h-[min(340px,50vh)] min-h-[240px] overflow-y-auto overscroll-contain bg-slate-950 p-4 font-mono text-sm leading-relaxed text-slate-200">
        <div className="mb-2 text-slate-400">$ npm run agent:dry</div>
        {m.completed.map((line, i) => (
          <div key={`d-${i}-${line.slice(0, 20)}`} className={lineClass(line)}>
            {line}
          </div>
        ))}
        {visibleCurrent && (
          <div className={lineClass(m.line)}>
            {visibleCurrent}
            <span className="text-emerald-400">{cursor.current ? "▌" : ""}</span>
          </div>
        )}
        {!visibleCurrent && m.queue.length === 0 && m.completed.length === 0 && (
          <span className="text-emerald-400">{cursor.current ? "▌" : ""}</span>
        )}
      </div>
      <button
        type="button"
        onClick={hardReset}
        className="absolute bottom-3 right-3 rounded-md border border-slate-600 bg-slate-800 px-2.5 py-1 font-mono text-xs font-medium text-slate-200 transition hover:border-emerald-500 hover:text-white"
      >
        Replay sample
      </button>
    </motion.div>
  );
}
