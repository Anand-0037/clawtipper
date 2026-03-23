import type { ActivityEntry } from "@/lib/activity-types";
import { buildPayload, normalizeRaw } from "@/lib/activity-build";

/** Seed rows when no ACTIVITY_SOURCE_URL — realistic shapes matching the agent log. */
const DEMO_RAW: unknown[] = [
  {
    pr: "https://github.com/octocat/Hello-World/pull/1",
    prId: "octocat/Hello-World#1",
    author: "octocat",
    title: "Update README",
    reason: "No wallet address in PR body",
    status: "rejected",
    timestamp: new Date(Date.now() - 86_400_000).toISOString(),
  },
  {
    pr: "https://github.com/facebook/react/pull/28401",
    prId: "facebook/react#28401",
    author: "devon",
    title: "Fix scheduler edge case in concurrent mode",
    amount: 1.5,
    txHash:
      "0x4a7f8c2e1d9b4a6e5f0c8d2b1a9e7f3c5d8b2a1e4f6c9d0b3a5e8f2c7d1b4a6",
    explorerUrl:
      "https://polygonscan.com/tx/0x4a7f8c2e1d9b4a6e5f0c8d2b1a9e7f3c5d8b2a1e4f6c9d0b3a5e8f2c7d1b4a6",
    timestamp: new Date(Date.now() - 43_200_000).toISOString(),
  },
  {
    pr: "https://github.com/vercel/next.js/pull/61234",
    prId: "vercel/next.js#61234",
    author: "rauchg",
    reason: "Low economic value (ROI score 0.8 < 1.5)",
    roiScore: 0.8,
    status: "low_roi",
    timestamp: new Date(Date.now() - 3600_000).toISOString(),
  },
];

export function getDemoPayload() {
  const entries = normalizeRaw(DEMO_RAW);
  return buildPayload(entries, "demo");
}

/** Presentation-only tx when no on-chain row (Polygon-style hash). */
export const MOCK_PRESENTATION_TX = {
  txHash:
    "0x7a3f8c2e1d9b4a6e5f0c8d2b1a9e7f3c5d8b2a1e4f6c9d0b3a5e8f2c7d1b4a6",
  explorerUrl:
    "https://polygonscan.com/tx/0x7a3f8c2e1d9b4a6e5f0c8d2b1a9e7f3c5d8b2a1e4f6c9d0b3a5e8f2c7d1b4a6",
  amount: 1.2,
  prId: "demo/illustrative",
};

type RotationTemplate = () => Omit<
  ActivityEntry,
  "timestamp" | "simulated"
> & { terminalLine: string; telegramLine: string };

function randHash(): string {
  const hex = () => Math.floor(Math.random() * 16).toString(16);
  let s = "0x";
  for (let i = 0; i < 64; i++) s += hex();
  return s;
}

const ROTATION: RotationTemplate[] = [
  () => ({
    pr: "https://github.com/sindresorhus/awesome/pull/3021",
    prId: "sindresorhus/awesome#3021",
    repo: "sindresorhus/awesome",
    author: `contrib-${(Math.random() * 99) | 0}`,
    title: "Add CLI observability section",
    reason: "Trivial change detected — additions and deletions both below threshold",
    status: "spam_filter",
    terminalLine:
      "[agent] ❌ Rejected sindresorhus/awesome#3021 — trivial diff (spam filter)",
    telegramLine: "❌ Rejected awesome#3021 — trivial change",
  }),
  () => ({
    pr: "https://github.com/facebook/react/pull/29102",
    prId: "facebook/react#29102",
    repo: "facebook/react",
    author: "sebmarkbage",
    title: "Improve useDeferredValue typings",
    reason: "Low economic value (ROI score 1.1 < 1.5)",
    roiScore: 1.1,
    status: "low_roi",
    terminalLine:
      "[agent] ❌ Rejected facebook/react#29102 — ROI 1.1 < threshold 1.5",
    telegramLine: "❌ ROI too low on react#29102",
  }),
  () => ({
    pr: "https://github.com/vercel/next.js/pull/62001",
    prId: "vercel/next.js#62001",
    repo: "vercel/next.js",
    author: "timer",
    title: "Optimize dev server cold start",
    amount: 1.35,
    txHash: randHash(),
    explorerUrl: "",
    status: "settled",
    terminalLine:
      "[agent] ✅ Tip 1.35 USDT → vercel/next.js#62001 · TX confirmed",
    telegramLine: "💸 Sent 1.35 USDT · next.js#62001",
  }),
  () => ({
    pr: "https://github.com/octocat/Hello-World/pull/42",
    prId: "octocat/Hello-World#42",
    repo: "octocat/Hello-World",
    author: "newbie",
    title: "Fix typo in README",
    reason: "No wallet address in PR body",
    status: "rejected",
    terminalLine: "[agent] ❌ octocat/Hello-World#42 — no 0x payout address",
    telegramLine: "❌ No wallet in PR body · Hello-World#42",
  }),
  () => ({
    pr: "https://github.com/torvalds/linux/pull/999001",
    prId: "torvalds/linux#999001",
    repo: "torvalds/linux",
    author: "kernel-dev",
    title: "mm: compaction heuristic tweak",
    reason: "Low economic value (ROI score 1.2 < 1.5)",
    roiScore: 1.2,
    status: "low_roi",
    terminalLine: "[agent] ❌ linux#999001 — ROI 1.2 below allocator floor",
    telegramLine: "❌ linux PR below ROI gate",
  }),
  () => ({
    pr: "https://github.com/microsoft/vscode/pull/198432",
    prId: "microsoft/vscode#198432",
    repo: "microsoft/vscode",
    author: "vscode-bot",
    title: "Editor: bracket pair color stability",
    amount: 2.1,
    txHash: randHash(),
    status: "settled",
    terminalLine: "[agent] ✅ vscode#198432 · 2.10 USDT · contributor paid",
    telegramLine: "💸 2.10 USDT · vscode",
  }),
  () => ({
    pr: "https://github.com/golang/go/pull/61200",
    prId: "golang/go#61200",
    repo: "golang/go",
    author: "gopher",
    title: "runtime: reduce lock contention in scheduler",
    reason: "Evaluating ROI + LLM…",
    status: "evaluating",
    terminalLine: "[agent] Scoring golang/go#61200 — merged, awaiting LLM",
    telegramLine: "🔔 go#61200 in review",
  }),
  () => ({
    pr: "https://github.com/rust-lang/rust/pull/118800",
    prId: "rust-lang/rust#118800",
    repo: "rust-lang/rust",
    author: "rustc",
    title: "borrowck: improved diagnostics",
    amount: 1.75,
    txHash: randHash(),
    status: "settled",
    terminalLine: "[agent] ✅ rust#118800 · 1.75 USDT settled",
    telegramLine: "💸 rust-lang tip sent",
  }),
  () => ({
    pr: "https://github.com/nodejs/node/pull/51234",
    prId: "nodejs/node#51234",
    repo: "nodejs/node",
    author: "nodejs",
    title: "http2: fix stream reset edge case",
    reason: "Trivial change detected — additions and deletions both below threshold",
    status: "spam_filter",
    terminalLine: "[agent] ❌ node#51234 — spam / trivial gate",
    telegramLine: "❌ node PR rejected (trivial)",
  }),
  () => ({
    pr: "https://github.com/apache/kafka/pull/14221",
    prId: "apache/kafka#14221",
    repo: "apache/kafka",
    author: "streamer",
    title: "Consumer group rebalance metrics",
    amount: 1.9,
    txHash: randHash(),
    status: "settled",
    terminalLine: "[agent] ✅ kafka#14221 · 1.90 USDT",
    telegramLine: "💸 kafka contributor paid",
  }),
  () => ({
    pr: "https://github.com/kubernetes/kubernetes/pull/120001",
    prId: "kubernetes/kubernetes#120001",
    repo: "kubernetes/kubernetes",
    author: "k8s-ci",
    title: "kubelet: image pull QPS tuning",
    reason: "No wallet address in PR body",
    status: "rejected",
    terminalLine: "[agent] ❌ k8s#120001 — missing payout address",
    telegramLine: "❌ k8s PR — no 0x",
  }),
  () => ({
    pr: "https://github.com/ethereum/go-ethereum/pull/28444",
    prId: "ethereum/go-ethereum#28444",
    repo: "ethereum/go-ethereum",
    author: "geth-dev",
    title: "core: state prefetch batching",
    amount: 2.45,
    txHash: randHash(),
    status: "settled",
    terminalLine: "[agent] ✅ geth#28444 · 2.45 USDT",
    telegramLine: "💸 geth tip confirmed",
  }),
  () => ({
    pr: "https://github.com/hashicorp/terraform/pull/34210",
    prId: "hashicorp/terraform#34210",
    repo: "hashicorp/terraform",
    author: "tf-maintainer",
    title: "provider: schema cache invalidation",
    reason: "Low economic value (ROI score 1.35 < 1.5)",
    roiScore: 1.35,
    status: "low_roi",
    terminalLine: "[agent] ❌ terraform#34210 — ROI 1.35",
    telegramLine: "❌ terraform ROI low",
  }),
  () => ({
    pr: "https://github.com/tailwindlabs/tailwindcss/pull/12340",
    prId: "tailwindlabs/tailwindcss#12340",
    repo: "tailwindlabs/tailwindcss",
    author: "adamwathan",
    title: "v4: color-mix() utilities",
    amount: 1.6,
    txHash: randHash(),
    status: "settled",
    terminalLine: "[agent] ✅ tailwind#12340 · 1.60 USDT",
    telegramLine: "💸 tailwind payout",
  }),
  () => ({
    pr: "https://github.com/openai/openai-python/pull/912",
    prId: "openai/openai-python#912",
    repo: "openai/openai-python",
    author: "sdk-user",
    title: "Retries: respect Retry-After header",
    reason: "Polling watchlist…",
    status: "evaluating",
    terminalLine: "[agent] Polling… openai-python#912 surfaced",
    telegramLine: "🔔 New merged PR",
  }),
  () => ({
    pr: "https://github.com/supabase/supabase/pull/20102",
    prId: "supabase/supabase#20102",
    repo: "supabase/supabase",
    author: "supa",
    title: "studio: query latency chart",
    amount: 1.25,
    txHash: randHash(),
    status: "settled",
    terminalLine: "[agent] ✅ supabase#20102 · 1.25 USDT",
    telegramLine: "💸 supabase tip",
  }),
];

/** Recent template indices — avoids back-to-back identical “loops”. */
const recentIdx: string[] = [];

function pickTemplate(): RotationTemplate {
  const avoid = new Set(recentIdx);
  const poolIdx = ROTATION.map((_, i) => i).filter((i) => !avoid.has(String(i)));
  const use = poolIdx.length ? poolIdx : ROTATION.map((_, i) => i);
  const idx = use[(Math.random() * use.length) | 0];
  recentIdx.push(String(idx));
  if (recentIdx.length > 8) recentIdx.shift();
  return ROTATION[idx];
}

export function nextSimulatedEntry(): ActivityEntry & {
  terminalLine: string;
  telegramLine: string;
} {
  const t = pickTemplate()();
  const tx = t.txHash
    ? {
        ...t,
        explorerUrl:
          t.explorerUrl ||
          `https://polygonscan.com/tx/${t.txHash}`,
      }
    : t;
  const ts = new Date().toISOString();
  return {
    ...tx,
    timestamp: ts,
    simulated: true,
    terminalLine: tx.terminalLine,
    telegramLine: tx.telegramLine,
  };
}

/** Burst used by “Run live demo” — fast sequence. */
export const DEMO_BURST: Array<
  ActivityEntry & { terminalLine: string; telegramLine: string }
> = [
  {
    pr: "https://github.com/facebook/react/pull/45210",
    prId: "facebook/react#45210",
    repo: "facebook/react",
    author: "acdlite",
    title: "Refactor lane prioritization",
    reason: "Polling watchlist…",
    status: "evaluating",
    timestamp: new Date().toISOString(),
    simulated: true,
    terminalLine: "[agent] Polling repos… facebook/react, vercel/next.js, …",
    telegramLine: "🔔 Polling merged PRs…",
  },
  {
    pr: "https://github.com/facebook/react/pull/45210",
    prId: "facebook/react#45210",
    repo: "facebook/react",
    author: "acdlite",
    title: "Refactor lane prioritization",
    reason: "Evaluating ROI + LLM…",
    status: "evaluating",
    timestamp: new Date().toISOString(),
    simulated: true,
    terminalLine: "[agent] PR detected: facebook/react#45210 — scoring…",
    telegramLine: "🔔 New PR: react#45210",
  },
  {
    pr: "https://github.com/facebook/react/pull/45210",
    prId: "facebook/react#45210",
    repo: "facebook/react",
    author: "acdlite",
    title: "Refactor lane prioritization",
    reason: "Trivial change detected — additions and deletions both below threshold",
    status: "spam_filter",
    timestamp: new Date().toISOString(),
    simulated: true,
    terminalLine: "[agent] ❌ Rejected — trivial change (ROI 0.3)",
    telegramLine: "❌ Rejected — trivial change",
  },
  {
    pr: "https://github.com/vercel/next.js/pull/61234",
    prId: "vercel/next.js#61234",
    repo: "vercel/next.js",
    author: "ijjk",
    title: "Turbopack: cache invalidation",
    reason: "Worthy · budget check OK",
    status: "evaluating",
    timestamp: new Date().toISOString(),
    simulated: true,
    terminalLine: "[agent] PR detected: vercel/next.js#61234",
    telegramLine: "🔔 New PR: next.js#61234",
  },
  {
    pr: "https://github.com/vercel/next.js/pull/61234",
    prId: "vercel/next.js#61234",
    repo: "vercel/next.js",
    author: "ijjk",
    title: "Turbopack: cache invalidation",
    amount: 1.2,
    txHash: MOCK_PRESENTATION_TX.txHash,
    explorerUrl: MOCK_PRESENTATION_TX.explorerUrl,
    status: "settled",
    timestamp: new Date().toISOString(),
    simulated: true,
    terminalLine:
      "[agent] ✅ Approved 1.20 USDT · broadcasting tx…",
    telegramLine: "✅ Approved 1.20 USDT · signing…",
  },
  {
    pr: "https://github.com/vercel/next.js/pull/61234",
    prId: "vercel/next.js#61234",
    repo: "vercel/next.js",
    author: "ijjk",
    title: "Turbopack: cache invalidation",
    amount: 1.2,
    txHash: MOCK_PRESENTATION_TX.txHash,
    explorerUrl: MOCK_PRESENTATION_TX.explorerUrl,
    status: "settled",
    timestamp: new Date().toISOString(),
    simulated: true,
    terminalLine:
      "[agent] TX confirmed → polygonscan.com/tx/0x7a3f8c…",
    telegramLine: "💸 Tip confirmed on Polygon",
  },
];
