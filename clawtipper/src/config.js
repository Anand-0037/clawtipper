import dotenv from 'dotenv';
dotenv.config();

const watchReposEnv = process.env.WATCH_REPOS;
const defaultRepos = ['octocat/Hello-World'];

export const config = {
  mnemonic: process.env.MNEMONIC,
  geminiApiKey: process.env.GEMINI_API_KEY,
  githubToken: (process.env.GITHUB_TOKEN || '').trim() || null,
  telegramBotToken: process.env.TELEGRAM_BOT_TOKEN,
  geminiModel: process.env.GEMINI_MODEL || 'gemini-1.5-flash',
  chain: process.env.CHAIN || 'polygon',
  /** Default: Polygon mainnet RPC — must match USDT_ADDRESS network (see .env.example). */
  providerUrl: process.env.PROVIDER_URL || 'https://polygon.drpc.org',
  usdtAddress: process.env.USDT_ADDRESS || '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',
  minWalletBalanceUsdt: parseFloat(process.env.MIN_WALLET_BALANCE_USDT || '10'),
  maxTipUsdt: parseFloat(process.env.MAX_TIP_USDT || '3'),
  minTipUsdt: parseFloat(process.env.MIN_TIP_USDT || '0.5'),
  maxDailyPercent: parseFloat(process.env.MAX_DAILY_PERCENT || '5'),
  minRoiScore: parseFloat(process.env.MIN_ROI_SCORE || '1.5'),
  minLinesChange: parseInt(process.env.MIN_LINES_CHANGE || '5', 10),
  feePercent: parseFloat(process.env.FEE_PERCENT || '0'),
  platformWallet: process.env.PLATFORM_WALLET_ADDRESS || null,
  watchRepos: watchReposEnv ? watchReposEnv.split(',').map((r) => r.trim()).filter(Boolean) : defaultRepos,
  pollIntervalMs: parseInt(process.env.POLL_INTERVAL_MS || '60000', 10),
};

// USDT has 6 decimals
export const USDT_DECIMALS = 6;
export const USDT_BASE = 10n ** BigInt(USDT_DECIMALS);

export function usdtToBase(usdt) {
  return BigInt(Math.floor(usdt * 1e6));
}

export function baseToUsdt(base) {
  return Number(base) / 1e6;
}
