/**
 * ClawTipper Logger - transaction and processed PR tracking
 */
import fs from 'fs/promises';
import path from 'path';

const LOGS_DIR = 'logs';
const TRANSACTIONS_FILE = path.join(LOGS_DIR, 'transactions.json');
const PROCESSED_FILE = path.join(LOGS_DIR, 'processed.json');

async function ensureLogsDir() {
  await fs.mkdir(LOGS_DIR, { recursive: true });
}

async function readJsonSafe(filePath, defaultValue) {
  try {
    const data = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(data);
  } catch {
    return defaultValue;
  }
}

async function writeJson(filePath, data) {
  await ensureLogsDir();
  await fs.writeFile(filePath, JSON.stringify(data, null, 2));
}

/**
 * Append a transaction log entry
 * @param {Object} entry - { pr, author, amount, reason, txHash, timestamp, url }
 */
export async function appendTransaction(entry) {
  const transactions = await readJsonSafe(TRANSACTIONS_FILE, []);
  transactions.push({
    ...entry,
    timestamp: entry.timestamp || new Date().toISOString(),
  });
  await writeJson(TRANSACTIONS_FILE, transactions);
}

/**
 * Append a rejected evaluation (for traceability)
 * @param {Object} entry - { pr, author, reason, worthy, suggestedAmount, url }
 */
export async function appendRejected(entry) {
  const transactions = await readJsonSafe(TRANSACTIONS_FILE, []);
  transactions.push({
    ...entry,
    status: 'rejected',
    timestamp: new Date().toISOString(),
  });
  await writeJson(TRANSACTIONS_FILE, transactions);
}

/**
 * Get processed PR IDs (e.g. ["owner/repo#123"])
 */
export async function getProcessedIds() {
  const ids = await readJsonSafe(PROCESSED_FILE, []);
  return new Set(ids);
}

/**
 * Mark a PR as processed
 * @param {string} prId - e.g. "owner/repo#123"
 */
export async function addProcessed(prId) {
  const ids = await readJsonSafe(PROCESSED_FILE, []);
  if (!ids.includes(prId)) {
    ids.push(prId);
    await writeJson(PROCESSED_FILE, ids);
  }
}

/**
 * Get last N transactions
 */
export async function getLastTransactions(n = 5) {
  const transactions = await readJsonSafe(TRANSACTIONS_FILE, []);
  return transactions.slice(-n).reverse();
}

/**
 * Get agent memory / stats for /status
 */
export async function getAgentStats() {
  const transactions = await readJsonSafe(TRANSACTIONS_FILE, []);
  const tipped = transactions.filter((t) => t.amount != null && t.status !== 'rejected');
  const rejected = transactions.filter((t) => t.status === 'rejected' || !t.amount);
  const totalTipped = tipped.reduce((s, t) => s + (t.amount || 0), 0);
  const total = tipped.length + rejected.length;
  const rejectionRate = total > 0 ? ((rejected.length / total) * 100).toFixed(1) : '0';

  return {
    totalTipped,
    avgTip: tipped.length ? totalTipped / tipped.length : 0,
    tippedCount: tipped.length,
    rejectedCount: rejected.length,
    totalEvaluated: total,
    rejectionRate,
  };
}
