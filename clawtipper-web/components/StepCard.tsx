"use client";

import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Radar, Scale, Coins } from "lucide-react";

const steps = [
  {
    icon: Radar,
    title: "Detect",
    body: "Scans merged PRs in watched repos in near real-time.",
    delay: 0,
  },
  {
    icon: Scale,
    title: "Evaluate",
    body: "Economic logic: ROI score, reputation, anti-spam filters.",
    delay: 0.1,
  },
  {
    icon: Coins,
    title: "Reward",
    body: "Sends USDT on-chain via Tether WDK self-custodial wallet.",
    delay: 0.2,
  },
];

export function StepRow() {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {steps.map(({ icon: Icon, title, body, delay }) => (
        <motion.div
          key={title}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.45, delay }}
        >
          <Card className="h-full border-blue-200 bg-gradient-to-b from-white to-slate-50">
            <CardContent className="p-6 pt-8">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
                <Icon className="h-6 w-6" />
              </div>
              <h3 className="mb-2 text-lg font-bold text-slate-950">{title}</h3>
              <p className="text-base font-medium leading-relaxed text-slate-800">
                {body}
              </p>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}
