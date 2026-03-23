"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { ActivityEntry, ActivityPayload } from "@/lib/activity-types";
import {
  computeStats,
  latestApproved,
} from "@/lib/activity-build";
import {
  DEMO_BURST,
  nextSimulatedEntry,
} from "@/lib/mock-activity";
import { RUN_DEMO_EVENT, appendTerminalLine } from "@/lib/demo-events";
import {
  emptyIndexerPayload,
  type IndexerTxsPayload,
} from "@/lib/indexer-types";

const emptyPayload: ActivityPayload = {
  source: "empty",
  feedTruth: "simulation",
  allowClientSimulation: false,
  entries: [],
  stats: {
    totalTippedUsdt: 0,
    processed: 0,
    rejectionRatePercent: 0,
    approvedCount: 0,
    rejectedCount: 0,
  },
  latestTip: null,
};

export type TelegramBubble = {
  id: string;
  text: string;
  time: string;
};

type ActivityContextValue = ActivityPayload & {
  /** Merged view (API + optional client simulation rows). */
  entries: ActivityEntry[];
  loading: boolean;
  refresh: () => Promise<void>;
  demoInitializing: boolean;
  runLiveDemo: () => void;
  telegramMessages: TelegramBubble[];
  /** WDK Indexer-backed on-chain USDT transfers for the agent wallet */
  indexer: IndexerTxsPayload;
};

const ActivityContext = createContext<ActivityContextValue | null>(null);

function makeId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function ActivityProvider({ children }: { children: React.ReactNode }) {
  const [apiPayload, setApiPayload] = useState<ActivityPayload>(emptyPayload);
  const [simulated, setSimulated] = useState<ActivityEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [demoInitializing, setDemoInitializing] = useState(false);
  const [telegramMessages, setTelegramMessages] = useState<TelegramBubble[]>(
    []
  );
  const [indexerPayload, setIndexerPayload] = useState<IndexerTxsPayload>(
    emptyIndexerPayload
  );
  const pauseRotation = useRef(false);
  const simTimerRef = useRef<number | null>(null);
  const lastInjectedTip = useRef<string | null>(null);
  const lastInjectedIndexer = useRef<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [activityRes, txsRes] = await Promise.all([
        fetch("/api/activity", { cache: "no-store" }),
        fetch("/api/txs", { cache: "no-store" }),
      ]);
      if (!activityRes.ok) throw new Error("fetch failed");
      const raw = (await activityRes.json()) as ActivityPayload;
      if (raw && Array.isArray(raw.entries) && raw.stats) {
        const json: ActivityPayload = {
          ...raw,
          feedTruth:
            raw.feedTruth ??
            (raw.source === "remote" ? "live" : "simulation"),
          /** API must send `true` to opt in; missing/undefined = off (judge-safe). */
          allowClientSimulation: raw.allowClientSimulation === true,
        };
        setApiPayload(json);
        if (json.source === "remote" && json.entries.length > 0) {
          setSimulated([]);
        }
      }
      if (txsRes.ok) {
        const txsJson = (await txsRes.json()) as IndexerTxsPayload;
        if (txsJson && Array.isArray(txsJson.items)) {
          setIndexerPayload({
            ...emptyIndexerPayload,
            ...txsJson,
            items: txsJson.items,
          });
        }
      } else {
        setIndexerPayload(emptyIndexerPayload);
      }
    } catch {
      setApiPayload(emptyPayload);
      setIndexerPayload(emptyIndexerPayload);
    } finally {
      setLoading(false);
    }
  }, []);

  /** Blend real log lines into the terminal when feed / indexer updates. */
  useEffect(() => {
    const tip = apiPayload.latestTip;
    if (
      apiPayload.feedTruth === "live" &&
      tip?.txHash &&
      tip.txHash !== lastInjectedTip.current
    ) {
      lastInjectedTip.current = tip.txHash;
      appendTerminalLine(
        `[live] Activity feed · ${tip.amount.toFixed(2)} USDT · ${tip.txHash.slice(0, 12)}…`
      );
    }
  }, [apiPayload.latestTip, apiPayload.feedTruth]);

  useEffect(() => {
    const h = indexerPayload.latestOutgoing?.hash;
    if (
      !h ||
      h === lastInjectedIndexer.current ||
      !indexerPayload.configured ||
      indexerPayload.items.length === 0
    ) {
      return;
    }
    lastInjectedIndexer.current = h;
    appendTerminalLine(
      `[indexer] Outbound USDT · ${indexerPayload.latestOutgoing!.amount.toFixed(2)} USDT · ${h.slice(0, 12)}…`
    );
  }, [
    indexerPayload.latestOutgoing,
    indexerPayload.configured,
    indexerPayload.items.length,
  ]);

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, 60_000);
    return () => clearInterval(id);
  }, [refresh]);

  const pushSimulated = useCallback(
    (
      row: ActivityEntry & { terminalLine?: string; telegramLine?: string }
    ) => {
      const { terminalLine, telegramLine, ...rest } = row;
      const entry: ActivityEntry = {
        ...rest,
        timestamp: rest.timestamp || new Date().toISOString(),
      };
      setSimulated((s) => [entry, ...s].slice(0, 24));

      if (terminalLine) appendTerminalLine(terminalLine);
      if (telegramLine) {
        const time = new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        });
        setTelegramMessages((m) =>
          [...m, { id: makeId(), text: telegramLine, time }].slice(-50)
        );
      }
    },
    []
  );

  /** Auto simulation only when API allows it and feed is not live. Jitter 1.8–4.2s. */
  useEffect(() => {
    const schedule = () => {
      simTimerRef.current = null;
      if (!apiPayload.allowClientSimulation) {
        return;
      }
      if (pauseRotation.current) {
        simTimerRef.current = window.setTimeout(
          schedule,
          800 + Math.random() * 1200
        );
        return;
      }
      if (apiPayload.source === "remote") {
        return;
      }
      const n = nextSimulatedEntry();
      const { terminalLine, telegramLine, ...rest } = n;
      pushSimulated({ ...rest, terminalLine, telegramLine });
      const delay = 1800 + Math.random() * 2400;
      simTimerRef.current = window.setTimeout(schedule, delay);
    };
    schedule();
    return () => {
      if (simTimerRef.current) window.clearTimeout(simTimerRef.current);
    };
  }, [pushSimulated, apiPayload.source, apiPayload.allowClientSimulation]);

  const runLiveDemo = useCallback(() => {
    if (!apiPayload.allowClientSimulation) return;
    pauseRotation.current = true;
    setDemoInitializing(true);
    window.dispatchEvent(new CustomEvent(RUN_DEMO_EVENT));

    requestAnimationFrame(() => {
      document.getElementById("terminal-window")?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "nearest",
      });
    });

    DEMO_BURST.forEach((row, i) => {
      window.setTimeout(() => {
        const { terminalLine, telegramLine, ...rest } = row;
        pushSimulated({
          ...rest,
          timestamp: new Date(Date.now() + i).toISOString(),
          terminalLine,
          telegramLine,
        });
      }, i * 220);
    });

    window.setTimeout(() => setDemoInitializing(false), 1300);
    window.setTimeout(() => {
      pauseRotation.current = false;
    }, 4500);
  }, [pushSimulated, apiPayload.allowClientSimulation]);

  const statsSource = useMemo(() => {
    return [...simulated, ...apiPayload.entries].sort((a, b) => {
      const ta = a.timestamp ? new Date(a.timestamp).getTime() : 0;
      const tb = b.timestamp ? new Date(b.timestamp).getTime() : 0;
      return tb - ta;
    });
  }, [simulated, apiPayload.entries]);

  const mergedEntries = useMemo(() => statsSource.slice(0, 10), [statsSource]);

  const stats = useMemo(
    () => computeStats(statsSource.slice(0, 80)),
    [statsSource]
  );

  const latestTip = useMemo(
    () => latestApproved(statsSource.slice(0, 80)),
    [statsSource]
  );

  const value = useMemo(
    () => ({
      source: apiPayload.source,
      feedTruth: apiPayload.feedTruth,
      allowClientSimulation: apiPayload.allowClientSimulation !== false,
      entries: mergedEntries,
      stats,
      latestTip,
      loading,
      refresh,
      demoInitializing,
      runLiveDemo,
      telegramMessages,
      indexer: indexerPayload,
    }),
    [
      apiPayload.source,
      apiPayload.feedTruth,
      apiPayload.allowClientSimulation,
      mergedEntries,
      stats,
      latestTip,
      loading,
      refresh,
      demoInitializing,
      runLiveDemo,
      telegramMessages,
      indexerPayload,
    ]
  );

  return (
    <ActivityContext.Provider value={value}>
      {children}
    </ActivityContext.Provider>
  );
}

export function useActivity() {
  const ctx = useContext(ActivityContext);
  if (!ctx) {
    throw new Error("useActivity must be used within ActivityProvider");
  }
  return ctx;
}
