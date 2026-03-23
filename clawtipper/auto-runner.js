#!/usr/bin/env node
/**
 * ClawTipper Autonomous Agent - polls repos for merged PRs and tips automatically
 * Requires: WATCH_REPOS, TELEGRAM_BOT_TOKEN (optional), other .env vars
 *
 * Usage: node auto-runner.js [--dry-run]
 */
import { config } from './src/config.js';
import { fetchRecentMergedPRs, extractAddressFromBody } from './src/github.js';
import { runAgent } from './src/agent.js';
import { getProcessedIds, addProcessed } from './src/logger.js';
import { startTelegramBot, createAgentNotifier, isPaused, setLastPollTime, incrementProcessed, notify } from './src/telegram.js';

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');

async function tick() {
  if (isPaused()) {
    console.log('Agent paused. Skipping poll.');
    return;
  }

  setLastPollTime(Date.now());
  const processed = await getProcessedIds();
  const repos = config.watchRepos;

  console.log(`\n[${new Date().toISOString()}] Polling ${repos.join(', ')}...`);

  const prs = await fetchRecentMergedPRs(repos, 5);

  for (const pr of prs) {
    const prId = pr.prId;
    if (processed.has(prId)) {
      continue;
    }

    const address = extractAddressFromBody(pr.body);
    if (!address) {
      console.log(`  Skip ${prId}: no wallet address in PR body`);
      await addProcessed(prId);
      continue;
    }

    console.log(`  Processing ${prId} -> ${address.slice(0, 10)}...`);

    try {
      const notifier = createAgentNotifier();
      const result = await runAgent(pr.url, address, dryRun, { notifier });

      await addProcessed(prId);

      if (result.success && !result.dryRun) {
        incrementProcessed();
      }

      if (result.success) {
        console.log(`  Done: ${result.dryRun ? 'dry-run' : 'tip sent'}`);
      } else {
        console.log(`  Rejected: ${result.reason}`);
      }
    } catch (err) {
      console.error(`  Error processing ${prId}:`, err.message);
      await notify(`❌ Error: ${prId}\n${err.message}`).catch(() => {});
    }
  }
}

async function main() {
  console.log('🐱 ClawTipper Autonomous Agent');
  console.log('   Agents as economic infrastructure → value settles onchain via WDK');
  console.log(`   Watching: ${config.watchRepos.join(', ')}`);
  if (dryRun) console.log('   Mode: DRY RUN');
  console.log('');

  await startTelegramBot();

  if (dryRun) {
    await notify('🔍 Agent started in DRY RUN mode. No real tips will be sent.').catch(() => {});
  } else {
    await notify('▶ Agent started. Live mode.').catch(() => {});
  }

  const run = async () => {
    try {
      await tick();
    } catch (err) {
      console.error('Poll error:', err);
      await notify(`❌ Poll error: ${err.message}`).catch(() => {});
    }
    setTimeout(run, config.pollIntervalMs);
  };

  await run();
}

main().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
