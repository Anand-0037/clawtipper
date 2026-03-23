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
      '\n[WDK] ⚠️  PROVIDER_URL looks like Polygon Amoy but USDT_ADDRESS is Polygon *mainnet* USDT.\n' +
        '    Transfers/balances will fail. Use PROVIDER_URL=https://polygon.drpc.org (mainnet)\n' +
        '    or set USDT_ADDRESS to your Amoy test USDT contract.\n'
    );
  }
  if (looksMainnetPoly && !isMainnetUsdt && u.startsWith('0x')) {
    console.warn(
      '\n[WDK] ⚠️  Mainnet Polygon RPC with non-standard USDT address — confirm USDT_ADDRESS matches this network.\n'
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

/**
 * Send USDT tip to recipient.
 * @param {string} toAddress - Recipient EVM address (0x...)
 * @param {number} amountUsdt - Amount in USDT (e.g. 1.5)
 * @returns {{ hash: string, fee: bigint }}
 */
export async function sendTip(toAddress, amountUsdt) {
  const account = await getAccount();
  const amountBase = usdtToBase(amountUsdt);

  const result = await account.transfer({
    token: config.usdtAddress,
    to: toAddress,
    amount: amountBase,
  });

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
