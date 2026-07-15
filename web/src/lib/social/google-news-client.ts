import { createHash } from "crypto";
import {
  APIFY_GOOGLE_NEWS_ACTOR_DEFAULT,
  BODY_MAX_CHARS,
  GOOGLE_NEWS_DATE_RANGE,
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
import { isConcreteArticleUrl, unwrapGoogleNewsUrl } from "./news-url";
import type { GoogleNewsFetchResult, NormalizedSocialPost } from "./types";

interface ApifyGoogleNewsItem {
  query?: string;
  title?: string;
  url?: string;
  link?: string;
  articleUrl?: string;
  sourceUrl?: string;
  redirectUrl?: string;
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
    dateRange: GOOGLE_NEWS_DATE_RANGE,
    extractFullText: false,
    includeImages: false,
  };
}

function stableUrlHash(url: string): string {
  return createHash("sha256").update(url).digest("hex").slice(0, 16);
}

function articleUrl(item: ApifyGoogleNewsItem): string {
  const candidates = [
    item.articleUrl,
    item.sourceUrl,
    item.url,
    item.link,
    item.redirectUrl,
  ]
    .map((v) => (typeof v === "string" ? unwrapGoogleNewsUrl(v) : ""))
    .filter((v) => v.startsWith("http"));

  // Prefer the most path-specific candidate that looks like an article.
  const ranked = [...candidates].sort(
    (a, b) => b.replace(/\/+$/, "").length - a.replace(/\/+$/, "").length,
  );
  for (const candidate of ranked) {
    if (isConcreteArticleUrl(candidate)) return candidate;
  }
  return "";
}

function mentionsPeptide(text: string): boolean {
  return /\bpeptides?\b/i.test(text);
}

function withinLookback(postedAt: string, days: number): boolean {
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  return new Date(postedAt).getTime() >= cutoff;
}

/**
 * Parse Google News publish time into ISO. Never falls back to “now”
 * (that would mis-file older articles under the scrape day).
 */
export function parseGoogleNewsPublishedAt(
  raw?: string | null,
): string | null {
  if (!raw?.trim()) return null;
  const s = raw.trim();

  const relative = s.match(
    /^(\d+)\s+(minute|minutes|min|hour|hours|hr|hrs|day|days|week|weeks)\s+ago$/i,
  );
  if (relative) {
    const n = Number(relative[1]);
    const unit = relative[2].toLowerCase();
    const ms =
      unit.startsWith("min")
        ? n * 60_000
        : unit.startsWith("hour") || unit.startsWith("hr")
          ? n * 3_600_000
          : unit.startsWith("day")
            ? n * 86_400_000
            : n * 7 * 86_400_000;
    return new Date(Date.now() - ms).toISOString();
  }

  if (/^yesterday$/i.test(s)) {
    return new Date(Date.now() - 86_400_000).toISOString();
  }
  if (/^today$/i.test(s)) {
    return new Date().toISOString();
  }

  const parsed = Date.parse(s);
  if (!Number.isNaN(parsed)) return new Date(parsed).toISOString();
  return null;
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

  const postedAt = parseGoogleNewsPublishedAt(
    item.publishedAt || item.date,
  );
  // Without a real publish time we refuse the item — avoid labeling crawl day as publish day.
  if (!postedAt) return null;

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
