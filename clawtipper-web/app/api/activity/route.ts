import { NextResponse } from "next/server";
import {
  buildPayload,
  parseRemoteBody,
} from "@/lib/activity-build";
import type { ActivityPayload } from "@/lib/activity-types";
import { getDemoPayload } from "@/lib/mock-activity";

export const dynamic = "force-dynamic";

import fs from "node:fs/promises";
import path from "node:path";

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * Fake seed + client simulation are OPT-IN only.
 * Set `ALLOW_ACTIVITY_DEMO=true` for local marketing builds.
 * Legacy: `STRICT_REAL_FEED=false` also enables demo fallback.
 * Default (nothing set): real-only — empty or remote JSON / local logs.
 */
function isDemoFallbackEnabled(): boolean {
  const legacyStrict = process.env.STRICT_REAL_FEED?.trim().toLowerCase();
  if (
    legacyStrict === "1" ||
    legacyStrict === "true" ||
    legacyStrict === "yes"
  ) {
    return false;
  }
  const allow = process.env.ALLOW_ACTIVITY_DEMO?.trim().toLowerCase();
  if (allow === "1" || allow === "true" || allow === "yes") {
    return true;
  }
  if (
    legacyStrict === "0" ||
    legacyStrict === "false" ||
    legacyStrict === "no"
  ) {
    return true;
  }
  return false;
}

function withSimPolicy(
  payload: ActivityPayload,
  demoFallback: boolean
): ActivityPayload {
  return {
    ...payload,
    allowClientSimulation: demoFallback,
  };
}

export async function GET() {
  await delay(200 + Math.random() * 300);
  const demoFallback = isDemoFallbackEnabled();

  // 1. Local agent logs (monorepo dev)
  try {
    const logsPath = path.join(process.cwd(), "..", "clawtipper", "logs", "transactions.json");
    const content = await fs.readFile(logsPath, "utf-8");
    const json = JSON.parse(content);
    const entries = parseRemoteBody(json);
    if (entries.length > 0) {
      return NextResponse.json(
        withSimPolicy(buildPayload(entries, "remote"), demoFallback)
      );
    }
  } catch {
    // continue
  }

  const url = process.env.ACTIVITY_SOURCE_URL?.trim();

  if (url) {
    const ctrl = new AbortController();
    const to = setTimeout(() => ctrl.abort(), 12_000);
    try {
      const res = await fetch(url, {
        cache: "no-store",
        signal: ctrl.signal,
        headers: { Accept: "application/json" },
      });

      if (!res.ok) {
        return NextResponse.json(
          withSimPolicy(
            demoFallback ? getDemoPayload() : buildPayload([], "empty"),
            demoFallback
          )
        );
      }

      const json: unknown = await res.json();
      const entries = parseRemoteBody(json);

      if (entries.length > 0) {
        return NextResponse.json(
          withSimPolicy(buildPayload(entries, "remote"), demoFallback)
        );
      }

      return NextResponse.json(
        withSimPolicy(buildPayload([], "empty"), demoFallback)
      );
    } catch {
      return NextResponse.json(
        withSimPolicy(
          demoFallback ? getDemoPayload() : buildPayload([], "empty"),
          demoFallback
        )
      );
    } finally {
      clearTimeout(to);
    }
  }

  return NextResponse.json(
    withSimPolicy(
      demoFallback ? getDemoPayload() : buildPayload([], "empty"),
      demoFallback
    )
  );
}
