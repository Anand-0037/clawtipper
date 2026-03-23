/** Normalized USDT transfer from WDK Indexer (or client consumption of /api/txs). */
export type IndexerOutgoingTx = {
  hash: string;
  amount: number;
  timestamp: string;
  from: string;
  to: string;
};

export type IndexerTxsPayload = {
  items: IndexerOutgoingTx[];
  /** Most recent outbound USDT from the configured agent wallet (tips). */
  latestOutgoing: IndexerOutgoingTx | null;
  outgoingTotalUsdt: number;
  outgoingCount: number;
  /** True when API key + wallet env are set (may still return empty on error). */
  configured: boolean;
  error?: string;
};

export const emptyIndexerPayload: IndexerTxsPayload = {
  items: [],
  latestOutgoing: null,
  outgoingTotalUsdt: 0,
  outgoingCount: 0,
  configured: false,
};
