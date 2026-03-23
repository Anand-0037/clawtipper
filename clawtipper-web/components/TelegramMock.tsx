"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useActivity } from "@/components/activity-context";

export function TelegramMock() {
  const { telegramMessages, allowClientSimulation } = useActivity();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    requestAnimationFrame(() => {
      el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    });
  }, [telegramMessages]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
    >
      <Card className="mx-auto max-w-sm overflow-hidden border-slate-300 shadow-lg">
        <CardHeader className="border-b-2 border-slate-200 bg-slate-100 py-4">
          <CardTitle className="text-center text-base font-bold text-slate-950">
            ClawTipper Bot
          </CardTitle>
          <p className="text-center text-xs font-semibold text-slate-700">
            {allowClientSimulation
              ? "UI preview — mirrors page simulation + “Run live demo”"
              : "UI preview only — real Telegram is a separate process (skip in judge video if not wired)"}
          </p>
        </CardHeader>
        <CardContent className="bg-white p-0">
          <div
            ref={scrollRef}
            className="max-h-[320px] min-h-[200px] space-y-3 overflow-y-auto overflow-x-hidden p-4 overscroll-contain"
          >
            <p className="pb-1 text-center text-xs font-bold uppercase tracking-wide text-slate-600">
              Today
            </p>
            {telegramMessages.length === 0 ? (
              <p className="text-center text-sm font-medium leading-relaxed text-slate-800">
                {allowClientSimulation ? (
                  <>
                    Waiting for events… click{" "}
                    <strong className="text-slate-950">Run live demo</strong>
                  </>
                ) : (
                  <>
                    No simulated stream. Show{" "}
                    <strong className="text-slate-950">real bot</strong> in
                    terminal or skip this panel.
                  </>
                )}
              </p>
            ) : (
              telegramMessages.map((m) => (
                <div key={m.id} className="flex justify-start">
                  <div className="max-w-[95%] rounded-2xl rounded-bl-md border-2 border-sky-300 bg-sky-100 px-3 py-2.5 shadow-sm">
                    <div className="mb-1 font-mono text-xs font-bold text-sky-900">
                      {m.time}
                    </div>
                    <span className="text-sm font-medium leading-snug text-slate-900">
                      {m.text}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="border-t-2 border-slate-200 p-3 text-center font-mono text-xs font-semibold text-slate-700">
            Real bot: /status · /wallet · /logs
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
