import {
  BODY_MAX_CHARS,
  REDDIT_SEARCH_TERMS,
  REDDIT_SUBREDDITS,
  SCAN_LOOKBACK_DAYS,
} from "./config";
import {
  engagementScore,
  hasAuContext,
  hasRegulatoryKeyword,
  matchProducts,
} from "./matcher";
import type { NormalizedSocialPost, SocialFetchResult } from "./types";

interface RedditListingChild {
  kind: string;
  data: {
    id: string;
    name: string;
    subreddit: string;
    title: string;
    selftext?: string;
    score: number;
    num_comments: number;
    author: string;
    permalink: string;
    created_utc: number;
  };
}

function truncate(s: string, max: number): string {
  if (s.length <= max) return s;
  return `${s.slice(0, max)}…`;
}

function userAgent(): string {
  return process.env.REDDIT_USER_AGENT || "PeptideMonitor/0.1 (read-only)";
}

function isRedditOAuthConfigured(): boolean {
  return Boolean(
    process.env.REDDIT_CLIENT_ID &&
      process.env.REDDIT_CLIENT_SECRET &&
      process.env.REDDIT_USER_AGENT,
  );
}

let cachedToken: { value: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string> {
  const clientId = process.env.REDDIT_CLIENT_ID;
  const clientSecret = process.env.REDDIT_CLIENT_SECRET;
  const ua = process.env.REDDIT_USER_AGENT;

  if (!clientId || !clientSecret || !ua) {
    throw new Error(
      "Reddit OAuth not configured. Set REDDIT_CLIENT_ID, REDDIT_CLIENT_SECRET, REDDIT_USER_AGENT.",
    );
  }

  if (cachedToken && Date.now() < cachedToken.expiresAt - 60_000) {
    return cachedToken.value;
  }

  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const res = await fetch("https://www.reddit.com/api/v1/access_token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": ua,
    },
    body: "grant_type=client_credentials",
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Reddit OAuth failed (${res.status}): ${text.slice(0, 200)}`);
  }

  const json = (await res.json()) as {
    access_token: string;
    expires_in: number;
  };

  cachedToken = {
    value: json.access_token,
    expiresAt: Date.now() + json.expires_in * 1000,
  };
  return cachedToken.value;
}

async function redditGet(path: string, params: Record<string, string>): Promise<unknown> {
  const token = await getAccessToken();
  const qs = new URLSearchParams(params).toString();
  const url = `https://oauth.reddit.com${path}?${qs}`;

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      "User-Agent": userAgent(),
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Reddit API ${path} failed (${res.status}): ${text.slice(0, 200)}`);
  }

  return res.json();
}

function normalizeChild(child: RedditListingChild): NormalizedSocialPost | null {
  if (child.kind !== "t3" || !child.data?.id) return null;

  const d = child.data;
  const title = d.title ?? "";
  const body = truncate(d.selftext ?? "", BODY_MAX_CHARS);
  const text = `${title}\n${body}`;
  const products = matchProducts(text);
  if (products.length === 0) return null;

  const permalink = d.permalink.startsWith("http")
    ? d.permalink
    : `https://www.reddit.com${d.permalink}`;

  return {
    id: `reddit-${d.name || d.id}`,
    platform: "reddit",
    externalId: d.name || `t3_${d.id}`,
    subreddit: d.subreddit,
    title,
    body,
    score: d.score ?? 0,
    numComments: d.num_comments ?? 0,
    author: d.author && d.author !== "[deleted]" ? d.author : null,
    permalink,
    url: permalink,
    postedAt: new Date((d.created_utc ?? 0) * 1000).toISOString(),
    products,
    hasRegulatory: hasRegulatoryKeyword(text),
    engagement: engagementScore(d.score ?? 0, d.num_comments ?? 0),
    auContext: hasAuContext(text),
  };
}

function extractChildren(payload: unknown): RedditListingChild[] {
  const listing = payload as { data?: { children?: RedditListingChild[] } };
  return listing.data?.children ?? [];
}

async function fetchSubredditNew(
  subreddit: string,
  limit: number,
): Promise<NormalizedSocialPost[]> {
  const payload = await redditGet(`/r/${subreddit}/new`, {
    limit: String(limit),
    raw_json: "1",
  });
  return extractChildren(payload)
    .map(normalizeChild)
    .filter((p): p is NormalizedSocialPost => p !== null);
}

async function searchProductPosts(
  productQuery: string,
  limit: number,
): Promise<NormalizedSocialPost[]> {
  const payload = await redditGet("/search", {
    q: productQuery,
    sort: "new",
    t: "week",
    limit: String(limit),
    type: "link",
    raw_json: "1",
  });
  return extractChildren(payload)
    .map(normalizeChild)
    .filter((p): p is NormalizedSocialPost => p !== null);
}

function withinLookback(postedAt: string, days: number): boolean {
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  return new Date(postedAt).getTime() >= cutoff;
}

/** Legacy Reddit OAuth fetch (fallback when Apify is not configured). */
export async function fetchRedditPeptidePostsViaOAuth(): Promise<SocialFetchResult> {
  if (!isRedditOAuthConfigured()) {
    return {
      posts: [],
      configured: false,
      provider: "none",
      sources: { subredditPulls: 0, searchPulls: 0 },
      errors: ["Set APIFY_API_TOKEN or Reddit OAuth credentials"],
    };
  }

  const byId = new Map<string, NormalizedSocialPost>();
  const errors: string[] = [];
  let subredditPulls = 0;
  let searchPulls = 0;

  for (const sub of REDDIT_SUBREDDITS) {
    try {
      const posts = await fetchSubredditNew(sub, 100);
      subredditPulls += 1;
      for (const p of posts) {
        if (withinLookback(p.postedAt, SCAN_LOOKBACK_DAYS)) {
          byId.set(p.externalId, p);
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`subreddit ${sub}: ${msg.slice(0, 120)}`);
    }
    await new Promise((r) => setTimeout(r, 600));
  }

  for (const term of REDDIT_SEARCH_TERMS) {
    try {
      const posts = await searchProductPosts(term, 50);
      searchPulls += 1;
      for (const p of posts) {
        if (withinLookback(p.postedAt, SCAN_LOOKBACK_DAYS)) {
          byId.set(p.externalId, p);
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`search "${term}": ${msg.slice(0, 120)}`);
    }
    await new Promise((r) => setTimeout(r, 600));
  }

  return {
    posts: [...byId.values()],
    configured: true,
    provider: "reddit",
    sources: { subredditPulls, searchPulls },
    errors,
  };
}

export { isRedditOAuthConfigured };
