/**
 * Parse indexer amount: micro-USDT (6 decimals) vs human decimal string.
 */
export function normalizeUsdtAmount(raw: string | number | undefined): number {
  if (raw == null || raw === "") return 0;
  const s = String(raw).trim();
  if (s.includes(".")) {
    const f = parseFloat(s);
    return Number.isFinite(f) ? f : 0;
  }
  if (/^\d+$/.test(s)) {
    const n = parseFloat(s);
    if (n >= 1_000_000) return n / 1e6;
    return n;
  }
  const f = parseFloat(s);
  return Number.isFinite(f) ? f : 0;
}

type RawTransfer = Record<string, unknown>;

export function mapIndexerRow(t: RawTransfer): {
  hash: string;
  from: string;
  to: string;
  timestamp: string;
  amount: number;
} | null {
  const hash = String(
    t.txHash ?? t.transaction_hash ?? t.transactionHash ?? ""
  ).trim();
  if (!hash) return null;
  const from = String(t.from ?? "").trim();
  const to = String(t.to ?? "").trim();
  let timestamp: string;
  const ts = t.timestamp;
  if (typeof ts === "number") {
    timestamp =
      ts > 1e12 ? new Date(ts).toISOString() : new Date(ts * 1000).toISOString();
  } else if (typeof ts === "string") {
    timestamp = ts;
  } else {
    timestamp = new Date().toISOString();
  }
  const amount = normalizeUsdtAmount(
    (t.amount ?? t.value ?? "0") as string | number
  );
  return { hash, from, to, timestamp, amount };
}

export function extractTransferArrays(json: unknown): RawTransfer[] {
  if (!json || typeof json !== "object") return [];
  const o = json as Record<string, unknown>;
  if (Array.isArray(o.tokenTransfers)) return o.tokenTransfers as RawTransfer[];
  if (Array.isArray(o.transfers)) return o.transfers as RawTransfer[];
  return [];
}
