import { createHash } from "crypto";
import {
  APIFY_GOOGLE_NEWS_ACTOR_DEFAULT,
  BODY_MAX_CHARS,
  GOOGLE_NEWS_MAX_PER_QUERY,
  GOOGLE_NEWS_QUERIES,
  SCAN_LOOKBACK_DAYS,
} from "./config";
import {
  fetchApifyDatasetItems,
  isApifyConfigured,
  startApifyActorRun,
  waitForApifyRun,
} from "./apify-client";
import {
  hasAuContext,
  hasRegulatoryKeyword,
  matchProducts,
} from "./matcher";
import type { GoogleNewsFetchResult, NormalizedSocialPost } from "./types";

interface ApifyGoogleNewsItem {
  query?: string;
  title?: string;
  url?: string;
  link?: string;
  source?: string;
  domain?: string;
  publishedAt?: string;
  date?: string;
  snippet?: string;
  scrapedAt?: string;
}

function truncate(s: string, max: number): string {
  if (s.length <= max) return s;
  return `${s.slice(0, max)}…`;
}

function googleNewsActorPath(): string {
  return process.env.APIFY_GOOGLE_NEWS_ACTOR || APIFY_GOOGLE_NEWS_ACTOR_DEFAULT;
}

function buildGoogleNewsInput() {
  return {
    queries: [...GOOGLE_NEWS_QUERIES],
    maxResultsPerQuery: GOOGLE_NEWS_MAX_PER_QUERY,
    language: "en",
    country: "US",
    dateRange: "7d",
    extractFullText: false,
    includeImages: false,
  };
}

function stableUrlHash(url: string): string {
  return createHash("sha256").update(url).digest("hex").slice(0, 16);
}

function articleUrl(item: ApifyGoogleNewsItem): string {
  const raw = (item.url || item.link || "").trim();
  return raw.startsWith("http") ? raw : "";
}

function mentionsPeptide(text: string): boolean {
  return /\bpeptides?\b/i.test(text);
}

function withinLookback(postedAt: string, days: number): boolean {
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  return new Date(postedAt).getTime() >= cutoff;
}

export function normalizeGoogleNewsItem(
  item: ApifyGoogleNewsItem,
): NormalizedSocialPost | null {
  const title = (item.title ?? "").trim();
  const body = truncate((item.snippet ?? "").trim(), BODY_MAX_CHARS);
  if (!title && !body) return null;

  const url = articleUrl(item);
  if (!url) return null;

  const text = `${title}\n${body}`;
  const products = matchProducts(text);
  if (products.length === 0 && !mentionsPeptide(text)) return null;

  const postedRaw = item.publishedAt || item.date;
  const postedAt = postedRaw
    ? new Date(postedRaw).toISOString()
    : new Date().toISOString();

  const externalId = stableUrlHash(url);
  const publisher = (item.source || item.domain || "").trim();

  return {
    id: `google_news-${externalId}`,
    platform: "google_news",
    externalId,
    subreddit: publisher,
    title,
    body,
    score: 0,
    numComments: 0,
    author: null,
    permalink: url,
    url,
    postedAt,
    products,
    hasRegulatory: hasRegulatoryKeyword(text),
    engagement: 0,
    auContext: hasAuContext(text),
  };
}

export function itemsToGoogleNewsFetchResult(
  items: ApifyGoogleNewsItem[],
  errors: string[] = [],
): GoogleNewsFetchResult {
  const byId = new Map<string, NormalizedSocialPost>();
  for (const item of items) {
    const post = normalizeGoogleNewsItem(item);
    if (!post) continue;
    if (!withinLookback(post.postedAt, SCAN_LOOKBACK_DAYS)) continue;
    byId.set(post.externalId, post);
  }

  return {
    posts: [...byId.values()],
    configured: true,
    provider: "apify",
    queryCount: GOOGLE_NEWS_QUERIES.length,
    errors,
  };
}

export async function startApifyGoogleNewsRun(): Promise<{
  runId: string;
  datasetId: string;
}> {
  return startApifyActorRun(googleNewsActorPath(), buildGoogleNewsInput());
}

export async function fetchApifyGoogleNewsDataset(
  datasetId: string,
): Promise<GoogleNewsFetchResult> {
  const items = await fetchApifyDatasetItems<ApifyGoogleNewsItem>(datasetId);
  return itemsToGoogleNewsFetchResult(items);
}

/** Local CLI: start Google News Actor and block until complete. */
export async function fetchGoogleNewsPeptideArticles(): Promise<GoogleNewsFetchResult> {
  if (!isApifyConfigured()) {
    return {
      posts: [],
      configured: false,
      provider: "none",
      queryCount: 0,
      errors: ["APIFY_API_TOKEN not set"],
    };
  }

  const errors: string[] = [];
  try {
    const { runId } = await startApifyGoogleNewsRun();
    console.log(`[google-news] started run ${runId}`);
    const datasetId = await waitForApifyRun(runId);
    console.log(`[google-news] succeeded, dataset=${datasetId}`);
    const items = await fetchApifyDatasetItems<ApifyGoogleNewsItem>(datasetId);
    console.log(`[google-news] raw items=${items.length}`);
    return itemsToGoogleNewsFetchResult(items, errors);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    errors.push(msg);
    return {
      posts: [],
      configured: true,
      provider: "apify",
      queryCount: GOOGLE_NEWS_QUERIES.length,
      errors,
    };
  }
}
