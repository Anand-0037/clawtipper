import { NextResponse } from "next/server";
import type { IndexerOutgoingTx, IndexerTxsPayload } from "@/lib/indexer-types";
import {
  extractTransferArrays,
  mapIndexerRow,
} from "@/lib/indexer-normalize";

/** Always run on server with fresh env (Indexer + wallet). */
export const dynamic = "force-dynamic";

function buildPayload(
  items: IndexerOutgoingTx[],
  walletLc: string,
  configured: boolean,
  error?: string
): IndexerTxsPayload {
  let outgoingTotalUsdt = 0;
  let outgoingCount = 0;
  for (const it of items) {
    if (it.from.toLowerCase() === walletLc) {
      outgoingTotalUsdt += it.amount;
      outgoingCount += 1;
    }
  }
  const latestOutgoing =
    items.find((it) => it.from.toLowerCase() === walletLc) ?? null;

  return {
    items,
    latestOutgoing,
    outgoingTotalUsdt: Math.round(outgoingTotalUsdt * 1e6) / 1e6,
    outgoingCount,
    configured,
    ...(error ? { error } : {}),
  };
}

/**
 * WDK Indexer: on-chain read layer for USDT transfers (not app state / DB).
 * @see https://wdk-api.tether.io — GET /api/v1/{chain}/{token}/{address}/token-transfers
 */
export async function GET() {
  const base =
    process.env.WDK_INDEXER_BASE_URL?.trim() || "https://wdk-api.tether.io";
  const key = process.env.WDK_INDEXER_API_KEY?.trim();
  const wallet =
    process.env.AGENT_WALLET_ADDRESS?.trim() ||
    process.env.INDEXER_WALLET_ADDRESS?.trim();
  const chain = process.env.WDK_INDEXER_CHAIN?.trim() || "polygon";
  const token = process.env.WDK_INDEXER_TOKEN?.trim() || "usdt";

  if (!key || !wallet) {
    return NextResponse.json(
      buildPayload([], "", false),
      { headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60" } }
    );
  }

  const walletLc = wallet.toLowerCase();
  const url = `${base.replace(/\/$/, "")}/api/v1/${encodeURIComponent(chain)}/${encodeURIComponent(token)}/${encodeURIComponent(wallet)}/token-transfers?limit=15&sort=desc`;

  try {
    const res = await fetch(url, {
      headers: { "x-api-key": key },
      next: { revalidate: 30 },
    });

    if (!res.ok) {
      return NextResponse.json(
        buildPayload([], walletLc, true, `indexer_http_${res.status}`),
        { headers: { "Cache-Control": "public, s-maxage=15" } }
      );
    }

    const json: unknown = await res.json();
    const rawList = extractTransferArrays(json);
    const items: IndexerOutgoingTx[] = [];
    for (const row of rawList) {
      const m = mapIndexerRow(row);
      if (!m) continue;
      items.push({
        hash: m.hash,
        amount: m.amount,
        timestamp: m.timestamp,
        from: m.from,
        to: m.to,
      });
    }

    return NextResponse.json(buildPayload(items, walletLc, true), {
      headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60" },
    });
  } catch {
    return NextResponse.json(
      buildPayload([], walletLc, true, "indexer_fetch_failed"),
      { headers: { "Cache-Control": "public, s-maxage=15" } }
    );
  }
}
