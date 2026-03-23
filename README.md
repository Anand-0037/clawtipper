# Tether / DoraHacks — ClawTipper

**Autonomous economic agent:** turns merged GitHub work into **programmable USDT settlement** via **Tether WDK** on **Polygon** — with **rejections**, **budget guardrails**, and a **self-custodial** agent wallet.

| | |
| :--- | :--- |
| **Why** | Cuts the **~90% friction** in rewarding OSS contributors: rules in code, payout on-chain, no manual invoicing. |
| **Stack** | **Tether WDK**, **Gemini** (1.5 Flash by default), **Next.js 14**, **Polygon** USDT, optional **Telegram** control plane. |
| **Security** | **Self-custodial** mnemonic; **min balance**, **max tip**, **daily % cap**, **ROI floor**, **trivial-change** hard gate. |
| **Business** | Optional **platform fee** (e.g. **10%** per tip) → B2B / pool-funded incentives, not a one-off hack. |

### Proof of settlement (fill after golden TX)

Replace with your real explorer link before submit:

`https://polygonscan.com/tx/<YOUR_TX_HASH>`

*How to generate: fund agent wallet → PR with your `0x` in body → `npm run agent` (live) → capture hash.*

**DoraHacks:** fill public URLs in [`SUBMISSION.md`](SUBMISSION.md) (repository + demo video only).

---

Monorepo layout:

| Path | Description |
|------|-------------|
| `clawtipper/` | Node agent — GitHub, Gemini, Tether WDK, Telegram, auto-runner |
| `clawtipper-web/` | Next.js 14 landing — marketing UI + optional `/api/activity` |
| `SUBMISSION.md` | **Hackathon form copy** — judge-optimized descriptions + WDK survey hints |
| `JUDGE_EXECUTION.md` | **2-hour execution plan** + **winning demo video script** |
| `AGENTS.md` | **AI / contributor context** — WDK links, MCP, monorepo map |
| `.cursor/mcp.json` | **WDK Docs MCP** — `https://docs.wallet.tether.io/~gitbook/mcp` |
| `.cursor/rules/wdk.mdc` | **Cursor rules** for `@tetherto/*` conventions |

### Agent

```bash
cd clawtipper
cp .env.example .env   # then edit secrets
npm install
npm run agent:dry      # or: node index.js "<PR_URL>" "0x..." --dry-run
# Video / judge path (single PR, deterministic):
# node index.js "https://github.com/you/repo/pull/1" "0xYour..." --dry-run
# node index.js "https://github.com/you/repo/pull/1" "0xYour..."
```

### Web

```bash
cd clawtipper-web
cp .env.example .env.local   # optional: NEXT_PUBLIC_SITE_URL, NEXT_PUBLIC_GITHUB_REPO
npm install
npm run dev                  # http://localhost:3000
```

Configure **`ACTIVITY_SOURCE_URL`** in Vercel (or `.env.local`) to a **public raw JSON** (e.g. Gist of `transactions.json`) so judges see the **Live system** badge and real rows. If unset, the site uses **demo + simulation** (still fine for narrative—say so in video).

**WDK Indexer (optional, recommended):** In `clawtipper-web`, set **`WDK_INDEXER_API_KEY`** and **`AGENT_WALLET_ADDRESS`** (same Polygon `0x` as your agent). The site then loads **`/api/txs`** → real **USDT transfer history** for on-chain proof (hybrid with JSON logs, not a replacement for them). See `clawtipper-web/.env.example`.

**Real-only UI (default):** do **not** set `ALLOW_ACTIVITY_DEMO` on Vercel. The API serves **only** hosted **`ACTIVITY_SOURCE_URL`** or local **`clawtipper/logs`** — **no** fake seed. For local demos with simulation, set **`ALLOW_ACTIVITY_DEMO=true`**. See **[`JUDGE_EXECUTION.md`](JUDGE_EXECUTION.md)**.

**Golden tx (required for top tier):** fund wallet → run **`node index.js "<PR>" "0x..."`** (not only dry-run) → put Polygonscan link in README.

**Before recording:** one agent process only (`pkill -f node` if Telegram **409**). Confirm `[GITHUB] Token check: Found` in the console.
