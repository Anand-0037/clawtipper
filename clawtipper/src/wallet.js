/**
 * ClawTipper WDK Wallet Module
 * Self-custodial USDT transfers via Tether WDK
 */
import WDK from '@tetherto/wdk';
import WalletManagerEvm from '@tetherto/wdk-wallet-evm';
import { config, usdtToBase, baseToUsdt } from './config.js';

let wdkInstance = null;
let accountCache = null;

const POLYGON_MAINNET_USDT = '0xc2132d05d31c914a87c6611c10748aeb04b58e8f';

/**
 * Catch the #1 WDK footgun: Amoy RPC + mainnet USDT contract (or vice versa).
 */
export function warnIfNetworkTokenMismatch() {
  const p = (config.providerUrl || '').toLowerCase();
  const u = (config.usdtAddress || '').toLowerCase();
  if (!p || !u) return;
  const looksAmoy = p.includes('amoy');
  const looksMainnetPoly =
    p.includes('polygon.') &&
    !looksAmoy &&
    !p.includes('sepolia') &&
    !p.includes('mumbai');
  const isMainnetUsdt = u === POLYGON_MAINNET_USDT;
  if (looksAmoy && isMainnetUsdt) {
    console.warn(
      '\n[WDK] PROVIDER_URL looks like Polygon Amoy but USDT_ADDRESS is Polygon mainnet USDT.\n' +
        '    Transfers/balances will fail. Use PROVIDER_URL=https://polygon.drpc.org (mainnet)\n' +
        '    or set USDT_ADDRESS to your Amoy test USDT contract.\n'
    );
  }
  if (looksMainnetPoly && !isMainnetUsdt && u.startsWith('0x')) {
    console.warn(
      '\n[WDK] Mainnet Polygon RPC with non-standard USDT address — confirm USDT_ADDRESS matches this network.\n'
    );
  }
}

export async function getAccount() {
  if (!config.mnemonic) {
    throw new Error('MNEMONIC not set in .env');
  }
  if (accountCache) return accountCache;

  warnIfNetworkTokenMismatch();

  const evmOpts = {
    provider: config.providerUrl,
  };
  if (process.env.WDK_TRANSFER_MAX_FEE_WEI) {
    try {
      evmOpts.transferMaxFee = BigInt(process.env.WDK_TRANSFER_MAX_FEE_WEI.trim());
    } catch {
      console.warn('[WDK] Invalid WDK_TRANSFER_MAX_FEE_WEI — ignoring');
    }
  }

  wdkInstance = new WDK(config.mnemonic).registerWallet(config.chain, WalletManagerEvm, evmOpts);

  accountCache = await wdkInstance.getAccount(config.chain, 0);
  return accountCache;
}

export async function getWalletAddress() {
  const account = await getAccount();
  return account.getAddress();
}

export async function getNativeBalance() {
  const account = await getAccount();
  const balance = await account.getBalance();
  return balance;
}

export async function getUsdtBalance() {
  const account = await getAccount();
  const balance = await account.getTokenBalance(config.usdtAddress);
  return balance;
}

export async function getUsdtBalanceFormatted() {
  const balance = await getUsdtBalance();
  return baseToUsdt(balance);
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function intEnv(name, defaultVal) {
  const v = process.env[name]?.trim();
  if (v == null || v === '') return defaultVal;
  const n = parseInt(v, 10);
  return Number.isFinite(n) && n > 0 ? n : defaultVal;
}

/**
 * True only for errors where retrying the *unsigned* transfer call is unlikely to double-pay
 * (RPC/transport issues before a durable hash is returned).
 * @param {unknown} err
 */
function isRetriableTransferSendError(err) {
  const msg = (err && typeof err === 'object' && 'message' in err
    ? String(err.message)
    : String(err)
  ).toLowerCase();
  if (msg.includes('insufficient funds')) return false;
  if (msg.includes('revert') || msg.includes('reverted')) return false;
  if (msg.includes('user rejected') || msg.includes('user denied')) return false;
  if (msg.includes('nonce too low') || msg.includes('replacement')) return false;
  return (
    msg.includes('timeout') ||
    msg.includes('etimedout') ||
    msg.includes('econnreset') ||
    msg.includes('enotfound') ||
    msg.includes('fetch failed') ||
    msg.includes('network') ||
    msg.includes('socket') ||
    msg.includes('429') ||
    msg.includes('502') ||
    msg.includes('503') ||
    msg.includes('504')
  );
}

function receiptSucceeded(receipt) {
  if (receipt == null) return false;
  const s = receipt.status;
  if (s === 1 || s === true) return true;
  if (typeof s === 'bigint') return s === 1n;
  if (typeof s === 'number') return s === 1;
  return false;
}

/**
 * Poll until receipt exists and status is success (or throw on revert / timeout).
 * @param {{ getTransactionReceipt: (hash: string) => Promise<{ status?: number | bigint | boolean } | null> }} account
 * @param {string} hash
 */
export async function waitForTransferConfirmation(account, hash, options = {}) {
  const pollMs = options.pollMs ?? intEnv('WDK_TX_CONFIRM_POLL_MS', 3000);
  const timeoutMs = options.timeoutMs ?? intEnv('WDK_TX_CONFIRM_TIMEOUT_MS', 120000);
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const receipt = await account.getTransactionReceipt(hash);
    if (receipt) {
      if (!receiptSucceeded(receipt)) {
        throw new Error(`Transaction reverted on-chain: ${hash}`);
      }
      return receipt;
    }
    await sleep(pollMs);
  }
  throw new Error(
    `Timeout waiting for confirmation (${timeoutMs}ms): ${hash}. Check the explorer; the tx may still confirm.`
  );
}

/**
 * Send USDT tip to recipient: retries only on transport/RPC errors before a hash is returned,
 * then waits for on-chain success.
 * @param {string} toAddress - Recipient EVM address (0x...)
 * @param {number} amountUsdt - Amount in USDT (e.g. 1.5)
 * @returns {Promise<{ hash: string, fee: bigint }>}
 */
export async function sendTip(toAddress, amountUsdt, options = {}) {
  const maxRetries = options.maxRetries ?? intEnv('WDK_TX_MAX_RETRIES', 3);
  const baseDelayMs = options.retryDelayMs ?? intEnv('WDK_TX_RETRY_DELAY_MS', 1500);
  const account = await getAccount();
  const amountBase = usdtToBase(amountUsdt);
  const transferOpts = {
    token: config.usdtAddress,
    to: toAddress,
    amount: amountBase,
  };

  let result;
  let lastErr;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      result = await account.transfer(transferOpts);
      break;
    } catch (err) {
      lastErr = err;
      const retriable = attempt < maxRetries && isRetriableTransferSendError(err);
      const msg = err && typeof err === 'object' && 'message' in err ? String(err.message) : String(err);
      if (!retriable) {
        throw new Error(`USDT transfer failed: ${msg}`);
      }
      const delay = baseDelayMs * 2 ** (attempt - 1);
      console.warn(`[WDK] transfer send attempt ${attempt}/${maxRetries} failed (${msg.slice(0, 120)}) — retry in ${delay}ms`);
      await sleep(delay);
    }
  }

  if (!result) {
    const m = lastErr && typeof lastErr === 'object' && 'message' in lastErr ? String(lastErr.message) : String(lastErr);
    throw new Error(`USDT transfer failed after ${maxRetries} attempts: ${m}`);
  }

  try {
    await waitForTransferConfirmation(account, result.hash, options);
  } catch (confirmErr) {
    const c = confirmErr && typeof confirmErr === 'object' && 'message' in confirmErr ? String(confirmErr.message) : String(confirmErr);
    throw new Error(
      `Tx broadcast (${result.hash}) but confirmation step failed: ${c} If the hash appears on Polygonscan, the transfer may still succeed.`
    );
  }

  return result;
}

/**
 * Check if wallet has sufficient balance for tip + gas buffer
 */
export async function canAffordTip(amountUsdt, gasBufferUsdt = 0.1) {
  const usdtBalance = await getUsdtBalanceFormatted();
  const nativeBalance = await getNativeBalance();
  // Need some native token for gas
  const hasGas = nativeBalance > 0n;
  return hasGas && usdtBalance >= amountUsdt + gasBufferUsdt;
}
