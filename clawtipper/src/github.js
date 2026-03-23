/**
 * GitHub PR fetcher - fetches PR details for agent evaluation
 */
import axios from 'axios';
import { config } from './config.js';

/** Before recording demos: you should see "Found". "Missing" → 401 on private/higher-rate paths. */
console.log('[GITHUB] Token check:', config.githubToken ? 'Found' : 'Missing');

const GITHUB_API = 'https://api.github.com';

function getHeaders(useToken = true) {
  const headers = { Accept: 'application/vnd.github.v3+json' };
  if (useToken && config.githubToken) {
    headers.Authorization = `Bearer ${config.githubToken}`;
  }
  return headers;
}

/** GitHub request with 401 fallback to unauthenticated (for public repos) */
async function githubGet(url, options = {}) {
  try {
    const headers = getHeaders(true);
    const res = await axios.get(url, { ...options, headers });
    return res;
  } catch (err) {
    if (err.response?.status === 401 && config.githubToken) {
      console.warn(`[GITHUB] Token 401 for ${url}, falling back...`);
      return axios.get(url, { ...options, headers: getHeaders(false) });
    }
    throw err;
  }
}

/**
 * Parse PR URL to extract owner, repo, pull_number
 * @param {string} url - e.g. https://github.com/owner/repo/pull/123
 */
export function parsePrUrl(url) {
  const match = url.match(/github\.com\/([^/]+)\/([^/]+)\/pull\/(\d+)/i);
  if (!match) {
    throw new Error(`Invalid PR URL: ${url}. Expected format: https://github.com/owner/repo/pull/123`);
  }
  return { owner: match[1], repo: match[2], pullNumber: parseInt(match[3], 10) };
}

/**
 * Fetch PR details from GitHub API
 */
export async function fetchPrDetails(prUrl) {
  const { owner, repo, pullNumber } = parsePrUrl(prUrl);

  const { data } = await githubGet(`${GITHUB_API}/repos/${owner}/${repo}/pulls/${pullNumber}`);

  // Fetch diff stats if available
  let additions = 0;
  let deletions = 0;
  let filesChanged = 0;
  try {
    const filesRes = await githubGet(
      `${GITHUB_API}/repos/${owner}/${repo}/pulls/${pullNumber}/files`
    );
    filesChanged = filesRes.data.length;
    for (const f of filesRes.data) {
      additions += f.additions || 0;
      deletions += f.deletions || 0;
    }
  } catch {
    // Files endpoint may fail for some repos
  }

  let repoStars = 0;
  let authorFollowers = 0;
  try {
    const { data: repoData } = await githubGet(`${GITHUB_API}/repos/${owner}/${repo}`);
    repoStars = repoData.stargazers_count || 0;
  } catch {
    // Ignore
  }
  try {
    if (data.user?.login) {
      const { data: userData } = await githubGet(`${GITHUB_API}/users/${data.user.login}`);
      authorFollowers = userData.followers || 0;
    }
  } catch {
    // Ignore
  }

  return {
    title: data.title,
    body: data.body || '',
    state: data.state,
    merged: data.merged_at !== null,
    author: data.user?.login,
    authorUrl: data.user?.html_url,
    repo: data.base?.repo?.full_name || `${owner}/${repo}`,
    additions,
    deletions,
    filesChanged,
    url: data.html_url,
    repoStars,
    authorFollowers,
    prId: `${owner}/${repo}#${pullNumber}`,
  };
}

/**
 * Try to extract Ethereum address from PR body (some contributors add it)
 */
export function extractAddressFromBody(body) {
  if (!body) return null;
  const match = body.match(/0x[a-fA-F0-9]{40}/);
  return match ? match[0] : null;
}

/**
 * Fetch recent merged PRs from watched repos (for autonomous agent)
 * @param {string[]} repos - e.g. ["owner/repo1", "owner/repo2"]
 * @param {number} limitPerRepo - max PRs to fetch per repo (default 5)
 */
export async function fetchRecentMergedPRs(repos, limitPerRepo = 5) {
  const results = [];
  for (const fullName of repos) {
    const [owner, repo] = fullName.split('/');
    if (!owner || !repo) continue;

    try {
      const { data: pulls } = await githubGet(
        `${GITHUB_API}/repos/${owner}/${repo}/pulls`,
        {
          params: { state: 'closed', sort: 'updated', per_page: 20 },
        }
      );

      const merged = pulls.filter((p) => p.merged_at !== null).slice(0, limitPerRepo);

      let repoStars = 0;
      try {
        const { data: repoData } = await githubGet(`${GITHUB_API}/repos/${owner}/${repo}`);
        repoStars = repoData.stargazers_count || 0;
      } catch {
        // Ignore repo fetch errors
      }

      for (const pr of merged) {
        let additions = 0;
        let deletions = 0;
        let filesChanged = 0;
        try {
          const { data: files } = await githubGet(
            `${GITHUB_API}/repos/${owner}/${repo}/pulls/${pr.number}/files`
          );
          filesChanged = files.length;
          for (const f of files) {
            additions += f.additions || 0;
            deletions += f.deletions || 0;
          }
        } catch {
          // Ignore files fetch errors
        }

        let authorFollowers = 0;
        try {
          if (pr.user?.login) {
            const { data: userData } = await githubGet(`${GITHUB_API}/users/${pr.user.login}`);
            authorFollowers = userData.followers || 0;
          }
        } catch {
          // Ignore user fetch errors
        }

        results.push({
          url: pr.html_url,
          prId: `${owner}/${repo}#${pr.number}`,
          title: pr.title,
          body: pr.body || '',
          author: pr.user?.login,
          authorUrl: pr.user?.html_url,
          repo: `${owner}/${repo}`,
          state: pr.state,
          merged: true,
          additions,
          deletions,
          filesChanged,
          repoStars,
          authorFollowers,
        });
      }
    } catch (err) {
      console.warn(`Failed to fetch PRs for ${fullName}:`, err.message);
    }
  }
  return results;
}
