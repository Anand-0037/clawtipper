/**
 * ClawTipper Telegram Bot - push events and control commands
 */
import TelegramBot from 'node-telegram-bot-api';
import { config } from './config.js';
import { getWalletAddress, getUsdtBalanceFormatted } from './wallet.js';
import { getLastTransactions, getAgentStats } from './logger.js';

let chatId = null;
let paused = false;
let lastPollTime = null;
let processedCount = 0;
let bot = null;

/**
 * Send message to registered chat (no-op if Telegram not configured)
 */
export async function notify(message) {
  if (!chatId || !bot) return;
  try {
    await bot.sendMessage(chatId, message, { parse_mode: 'HTML', disable_web_page_preview: true });
  } catch (err) {
    console.warn('Telegram notify failed:', err.message);
  }
}

/**
 * Create notifier for agent - converts (event, data) to formatted messages
 */
export function createAgentNotifier() {
  return (event, data) => {
    let msg = '';
    switch (event) {
      case 'pr_detected':
        msg = `📥 <b>New PR detected</b>\n${data.title}\n<a href="${data.url}">${data.url}</a>`;
        break;
      case 'evaluation':
        msg = `🤖 <b>Evaluation</b>\nWorthy: ${data.worthy ? 'Yes' : 'No'}\nAmount: ${data.amount} USDT\n\n${data.reasoning}`;
        break;
      case 'tip_sent':
        msg = `💸 <b>Tip sent</b>\n${data.amount.toFixed(2)} USDT\n\nTX: <a href="${data.explorerUrl}">${data.explorerUrl}</a>`;
        break;
      case 'rejected':
        msg = `❌ <b>Rejected</b>\n${data.reason}`;
        break;
      default:
        msg = JSON.stringify(data);
    }
    if (msg) notify(msg);
  };
}

export function isPaused() {
  return paused;
}

export function setPaused(value) {
  paused = !!value;
}

export function setLastPollTime(t) {
  lastPollTime = t;
}

export function incrementProcessed() {
  processedCount += 1;
}

export function getProcessedCount() {
  return processedCount;
}

/**
 * Start Telegram bot and begin polling (call once at startup)
 */
export async function startTelegramBot() {
  if (!config.telegramBotToken) {
    console.log('Telegram: TELEGRAM_BOT_TOKEN not set — running without bot');
    return;
  }

  // 409 Conflict = another process is already polling this bot (second terminal, IDE runner, etc.)
  console.log(
    '[TELEGRAM] Starting bot. If you see 409 errors, stop duplicate agents: pkill -f node (then run only npm run agent in one terminal).'
  );
  bot = new TelegramBot(config.telegramBotToken, { polling: true });

  bot.onText(/\/start/, async (msg) => {
    chatId = msg.chat.id;
    await bot.sendMessage(chatId, "🤖 Agent connected. You'll receive live updates.", { parse_mode: 'HTML' });
  });

  bot.onText(/\/status/, async (msg) => {
    const targetChat = msg.chat.id;
    const status = paused ? '⏸ Paused' : '▶ Running';
    const lastPoll = lastPollTime ? new Date(lastPollTime).toISOString() : 'Never';
    let stats = { totalTipped: 0, avgTip: 0, rejectionRate: '0' };
    try {
      stats = await getAgentStats();
    } catch {}
    const totalTippedStr = stats.totalTipped.toFixed(2);
    const avgTipStr = stats.avgTip.toFixed(2);
    await bot.sendMessage(
      targetChat,
      `📊 <b>Status</b>\n${status}\nLast poll: ${lastPoll}\n\n` +
        `💰 Total tipped: ${totalTippedStr} USDT\n` +
        `📈 Avg tip: ${avgTipStr} USDT\n` +
        `❌ Rejection rate: ${stats.rejectionRate}%\n` +
        `📋 PRs processed: ${processedCount}`,
      { parse_mode: 'HTML' }
    );
  });

  bot.onText(/\/wallet/, async (msg) => {
    const targetChat = msg.chat.id;
    try {
      const address = await getWalletAddress();
      let balance = 0;
      try {
        balance = await getUsdtBalanceFormatted();
      } catch {
        balance = 'N/A';
      }
      const balStr = typeof balance === 'number' ? balance.toFixed(2) : balance;
      await bot.sendMessage(targetChat, `💰 <b>Wallet</b>\n${address}\n\nBalance: ${balStr} USDT`, { parse_mode: 'HTML' });
    } catch (err) {
      await bot.sendMessage(targetChat, `Error: ${err.message}`);
    }
  });

  bot.onText(/\/logs/, async (msg) => {
    const targetChat = msg.chat.id;
    try {
      const txns = await getLastTransactions(5);
      if (txns.length === 0) {
        await bot.sendMessage(targetChat, 'No transactions yet.');
        return;
      }
      const lines = txns.map((t, i) => {
        const amt = t.amount != null ? `${t.amount} USDT` : t.status || 'rejected';
        const link = t.explorerUrl ? `\n<a href="${t.explorerUrl}">TX</a>` : '';
        return `${i + 1}. ${t.pr || t.prId || '?'} — ${amt}${link}`;
      });
      await bot.sendMessage(targetChat, `📜 <b>Last 5</b>\n\n${lines.join('\n\n')}`, { parse_mode: 'HTML', disable_web_page_preview: true });
    } catch (err) {
      await bot.sendMessage(targetChat, `Error: ${err.message}`);
    }
  });

  bot.onText(/\/pause/, async (msg) => {
    const targetChat = msg.chat.id;
    paused = true;
    await bot.sendMessage(targetChat, '⏸ Agent paused. Use /resume to continue.');
  });

  bot.onText(/\/resume/, async (msg) => {
    const targetChat = msg.chat.id;
    paused = false;
    await bot.sendMessage(targetChat, '▶ Agent resumed.');
  });

  console.log('Telegram bot started. Send /start to your bot to receive updates.');
}
