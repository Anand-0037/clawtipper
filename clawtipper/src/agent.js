/**
 * ClawTipper Agent - LLM-based PR evaluation and tipping decision
 */
import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from './config.js';
import { getUsdtBalanceFormatted, sendTip, canAffordTip } from './wallet.js';
import { appendTransaction, appendRejected } from './logger.js';

let genAI = null;

function getModel() {
  if (!genAI) {
    if (!config.geminiApiKey) {
      throw new Error('GEMINI_API_KEY not set in .env. Get one at https://aistudio.google.com/apikey');
    }
    genAI = new GoogleGenerativeAI(config.geminiApiKey);
  }
  return genAI.getGenerativeModel({ model: config.geminiModel });
}

/**
 * Pre-LLM economic score (0-10) for ROI/reputation weighting
 */
export function computePreScore(prDetails) {
  const base = (prDetails.additions || 0) * 0.01 + (prDetails.deletions || 0) * 0.005;
  const repoBonus = (prDetails.repoStars || 0) * 0.001;
  const authorBonus = (prDetails.authorFollowers || 0) * 0.002;
  return Math.min(base + repoBonus + authorBonus, 10);
}

function getExplorerBase() {
  if (config.providerUrl?.includes('amoy')) return 'https://amoy.polygonscan.com';
  if (config.chain === 'polygon') return 'https://polygonscan.com';
  return 'https://sepolia.etherscan.io';
}

/**
 * Evaluate a PR and suggest tip amount with reasoning
 */
export async function evaluatePr(prDetails) {
  const model = getModel();
  const preScore = computePreScore(prDetails);

  const prompt = `You are a conservative hedge fund manager allocating a small USDT treasury to open-source contributors. Assume ~70% of merged PRs are low signal (noise): typo-only edits, cosmetic refactors, pure documentation churn, or marginal value. You only reward the top ~30% by real impact—code that moves the product, fixes serious bugs, or delivers non-trivial features.

Evaluate this merged PR as if declining is the default. Say worthy=true only when capital deployment is clearly justified.

PR Details:
- Title: ${prDetails.title}
- Author: @${prDetails.author}
- Repo: ${prDetails.repo} (stars: ${prDetails.repoStars || 0}, author followers: ${prDetails.authorFollowers || 0})
- State: ${prDetails.state} ${prDetails.merged ? '(MERGED)' : ''}
- Lines: +${prDetails.additions} / -${prDetails.deletions}
- Files changed: ${prDetails.filesChanged}
- Body preview: ${(prDetails.body || '').slice(0, 500)}...

Also consider:
- Author reputation (followers, contribution count)
- Repo importance (stars, popularity)
- REJECT by default: documentation-only, tiny refactors, style-only, or unclear ROI unless the change is substantial.
- Long-term value (architecture, security, major feature) vs short-term noise (comments, formatting).

Pre-computed heuristic score (0-10): ${preScore.toFixed(2)} — use as signal, not the only input.

Rules:
- worthy=false unless this PR clearly deserves payment; "nice to have" is not enough.
- If worthy=true, suggest tip between ${config.minTipUsdt} and ${config.maxTipUsdt} USDT proportional to demonstrated impact.
- If worthy=false, set amount to 0 and explain why capital was protected.
- Respond with ONLY valid JSON, no markdown:
{
  "worthy": true or false,
  "amount": number (${config.minTipUsdt}-${config.maxTipUsdt}, or 0 if not worthy),
  "reasoning": "2-3 sentence explanation — if reject, say how you protected capital / ROI too low"
}`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('LLM did not return valid JSON: ' + text);
  }
  return JSON.parse(jsonMatch[0]);
}

/**
 * Apply budget guardrails
 */
export function applyBudgetRules(suggestedAmount, walletBalance) {
  const minBalance = config.minWalletBalanceUsdt;
  const maxTip = config.maxTipUsdt;
  const minTip = config.minTipUsdt;

  if (walletBalance < minBalance) {
    return { approved: false, amount: 0, reason: `Wallet balance ${walletBalance.toFixed(2)} USDT below minimum ${minBalance} USDT. Refusing to tip to preserve funds.` };
  }

  let amount = Math.min(suggestedAmount, maxTip);
  amount = Math.max(amount, minTip);

  if (amount > walletBalance * 0.05) {
    amount = Math.min(amount, walletBalance * (config.maxDailyPercent / 100));
  }

  return { approved: true, amount, reason: `Budget rules passed. Tip: ${amount.toFixed(2)} USDT (max ${maxTip}, min balance ${minBalance})` };
}

/**
 * Full agent flow: evaluate PR, check budget, optionally execute tip
 * @param {string} prUrl - GitHub PR URL
 * @param {string|null} recipientAddress - EVM address; if null, extracts from PR body
 * @param {boolean} dryRun - If true, no tx sent
 * @param {Object} opts - Optional { notifier: (event, data) => void }
 */
export async function runAgent(prUrl, recipientAddress = null, dryRun = false, opts = {}) {
  const { fetchPrDetails, extractAddressFromBody } = await import('./github.js');
  const notifier = opts.notifier;

  const prDetails = await fetchPrDetails(prUrl);

  // Auto-extract address from PR body if not provided
  let address = recipientAddress;
  if (!address || address.trim() === '') {
    address = extractAddressFromBody(prDetails.body);
  }
  if (!address) {
    const reason = 'No wallet address in PR body';
    console.log(`\n❌ ${reason}. Add 0x... address to PR description to receive tips.`);
    if (notifier) notifier('rejected', { reason, prDetails });
    await appendRejected({
      pr: prDetails.url,
      prId: prDetails.prId,
      author: prDetails.author,
      reason,
      status: 'no_address',
    }).catch(() => {});
    return { success: false, reason };
  }

  const notify = (event, data) => {
    if (notifier && typeof notifier === 'function') notifier(event, data);
  };

  // Anti-spam hard filter (risk control)
  const adds = prDetails.additions || 0;
  const dels = prDetails.deletions || 0;
  if (adds < config.minLinesChange && dels < config.minLinesChange) {
    const reason = 'Trivial change detected — additions and deletions both below threshold';
    console.log(`\n❌ ${reason}`);
    notify('rejected', { reason });
    await appendRejected({
      pr: prDetails.url,
      prId: prDetails.prId,
      author: prDetails.author,
      reason,
      status: 'spam_filter',
    }).catch(() => {});
    return { success: false, reason };
  }

  // Economic justification layer — reject low-value contributions
  const roiScore = computePreScore(prDetails);
  if (roiScore < config.minRoiScore) {
    const reason = `Low economic value (ROI score ${roiScore.toFixed(1)} < ${config.minRoiScore})`;
    console.log(`\n❌ ${reason}`);
    notify('rejected', { reason });
    await appendRejected({
      pr: prDetails.url,
      prId: prDetails.prId,
      author: prDetails.author,
      reason,
      roiScore,
      status: 'low_roi',
    }).catch(() => {});
    return { success: false, reason };
  }

  notify('pr_detected', prDetails);

  console.log('\n📋 PR Details:');
  console.log(`   Title: ${prDetails.title}`);
  console.log(`   Author: @${prDetails.author}`);
  console.log(`   +${prDetails.additions} / -${prDetails.deletions} lines, ${prDetails.filesChanged} files`);
  console.log(`   Merged: ${prDetails.merged}`);

  const evaluation = await evaluatePr(prDetails);
  notify('evaluation', evaluation);

  console.log('\n🤖 Agent Evaluation:');
  console.log(`   Worthy: ${evaluation.worthy}`);
  console.log(`   Suggested: ${evaluation.amount} USDT`);
  console.log(`   Reasoning: ${evaluation.reasoning}`);

  let walletBalance;
  try {
    walletBalance = await getUsdtBalanceFormatted();
    console.log(`\n💰 Wallet Balance: ${walletBalance.toFixed(2)} USDT`);
  } catch (err) {
    if (dryRun) {
      walletBalance = 0;
      console.log(`\n💰 Wallet Balance: N/A (${err.message?.slice(0, 50)}... - check PROVIDER_URL & USDT_ADDRESS for your network)`);
    } else {
      throw err;
    }
  }

  const budgetResult = applyBudgetRules(evaluation.amount, walletBalance);
  console.log(`   Budget check: ${budgetResult.reason}`);

  if (!evaluation.worthy || !budgetResult.approved) {
    const reason = !evaluation.worthy ? 'PR not deemed worthy' : budgetResult.reason;
    console.log(`\n❌ Tip rejected: ${reason}`);
    notify('rejected', { reason });
    await appendRejected({
      pr: prDetails.url,
      prId: prDetails.prId,
      author: prDetails.author,
      reason,
      worthy: evaluation.worthy,
      suggestedAmount: evaluation.amount,
    }).catch(() => {});
    return { success: false, reason };
  }

  const grossAmount = budgetResult.amount;
  const feePercent = config.feePercent || 0;
  const platformFee = feePercent > 0 ? Math.round(grossAmount * (feePercent / 100) * 100) / 100 : 0;
  const contributorAmount = feePercent > 0 ? Math.round((grossAmount - platformFee) * 100) / 100 : grossAmount;

  if (dryRun) {
    const feeStr = feePercent > 0 ? ` (net ${contributorAmount.toFixed(2)} to contributor, ${platformFee.toFixed(2)} platform fee)` : '';
    console.log(`\n🔍 DRY RUN: Would send ${contributorAmount.toFixed(2)} USDT to ${address}${feeStr}`);
    return { success: true, dryRun: true, amount: contributorAmount, platformFee, prDetails };
  }

  const totalToSend = contributorAmount + (config.platformWallet && platformFee > 0 ? platformFee : 0);
  const canAfford = await canAffordTip(totalToSend);
  if (!canAfford) {
    console.log('\n❌ Insufficient balance (including gas buffer)');
    notify('rejected', { reason: 'Insufficient balance' });
    return { success: false, reason: 'Insufficient balance' };
  }

  console.log(`\n🚀 Sending ${contributorAmount.toFixed(2)} USDT to ${address}${platformFee > 0 ? ` (+ ${platformFee.toFixed(2)} platform fee)` : ''}...`);
  const txResult = await sendTip(address, contributorAmount);
  let platformTxHash = null;
  if (config.platformWallet && platformFee > 0) {
    try {
      const platformResult = await sendTip(config.platformWallet, platformFee);
      platformTxHash = platformResult.hash;
    } catch (err) {
      console.warn('Platform fee transfer failed:', err.message);
    }
  }
  const explorerBase = getExplorerBase();
  const explorerUrl = `${explorerBase}/tx/${txResult.hash}`;

  console.log(`   TX Hash: ${txResult.hash}`);
  if (platformTxHash) console.log(`   Platform fee TX: ${platformTxHash}`);
  console.log(`   ✅ Tip sent successfully!`);
  console.log(`   Explorer: ${explorerUrl}`);

  notify('tip_sent', { amount: contributorAmount, platformFee, txHash: txResult.hash, explorerUrl });

  await appendTransaction({
    pr: prDetails.url,
    prId: prDetails.prId,
    author: prDetails.author,
    amount: contributorAmount,
    platformFee: platformFee > 0 ? platformFee : undefined,
    reason: evaluation.reasoning,
    txHash: txResult.hash,
    explorerUrl,
  }).catch(() => {});

  return { success: true, txHash: txResult.hash, amount: contributorAmount, platformFee, prDetails };
}
