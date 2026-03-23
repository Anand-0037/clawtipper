#!/usr/bin/env node
/**
 * ClawTipper / GitReward Agent
 * Autonomous AI tipping bot for GitHub open-source contributors
 * Uses Tether WDK self-custodial wallet + LLM reasoning
 *
 * Usage:
 *   node index.js "https://github.com/owner/repo/pull/123" "0xRecipientAddress"
 *   node index.js "PR_URL" "0xRecipient" --dry-run
 */
import { runAgent } from './src/agent.js';
import {
  getWalletAddress,
  getUsdtBalanceFormatted,
  warnIfNetworkTokenMismatch,
} from './src/wallet.js';

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const filtered = args.filter((a) => !a.startsWith('--'));

  if (filtered.length < 1) {
    console.log(`
ClawTipper / GitReward Agent
Autonomous USDT tips for GitHub OSS contributors (Tether WDK)

Usage:
  node index.js <PR_URL> [RECIPIENT_ADDRESS] [--dry-run]

Examples:
  node index.js "https://github.com/user/repo/pull/42" "0x742d35Cc6634C0532925a3b8D9C5c8b7b6e5f6e5"
  node index.js "https://github.com/user/repo/pull/42"  # extracts address from PR body
  node index.js "https://github.com/user/repo/pull/42" "0x..." --dry-run

Environment (.env):
  MNEMONIC       - BIP-39 seed phrase
  GEMINI_API_KEY - For LLM evaluation (https://aistudio.google.com/apikey)
  GITHUB_TOKEN   - Optional, for higher rate limits
  TELEGRAM_BOT_TOKEN - Optional, for agent push notifications
  WATCH_REPOS    - For autonomous agent (npm run agent)
  CHAIN, PROVIDER_URL, USDT_ADDRESS - Network config
  MIN_WALLET_BALANCE_USDT, MAX_TIP_USDT - Budget guardrails
`);
    process.exit(1);
  }

  const [prUrl, recipientAddress] = filtered;
  const addressArg = recipientAddress?.trim();

  if (addressArg && (!addressArg.startsWith('0x') || addressArg.length !== 42)) {
    console.error('Invalid recipient address. Must be 0x + 40 hex chars, or omit to extract from PR body.');
    process.exit(1);
  }

  console.log('🐱 ClawTipper / GitReward Agent');
  console.log('   Agents as economic infrastructure → value settles onchain via WDK\n');

  try {
    warnIfNetworkTokenMismatch();
    const walletAddress = await getWalletAddress();
    console.log(`   Wallet: ${walletAddress}`);
    try {
      const balance = await getUsdtBalanceFormatted();
      console.log(`   Balance: ${balance.toFixed(2)} USDT`);
    } catch {
      console.log('   Balance: (check PROVIDER_URL & USDT_ADDRESS for your network)');
    }
    if (dryRun) console.log('   Mode: DRY RUN (no tx will be sent)\n');

    const result = await runAgent(prUrl, addressArg || null, dryRun);

    if (result.success) {
      if (result.dryRun) {
        console.log('\n✅ Dry run complete. Remove --dry-run to execute.');
      } else {
        console.log('\n✅ Done! Tip sent onchain.');
      }
    } else {
      process.exit(1);
    }
  } catch (err) {
    console.error('\n❌ Error:', err.message);
    if (err.response?.data) console.error(err.response.data);
    process.exit(1);
  }
}

main();
