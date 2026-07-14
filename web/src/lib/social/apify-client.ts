import {
  APIFY_MAX_ITEMS,
  APIFY_MAX_POSTS_PER_URL,
  APIFY_REDDIT_ACTOR_DEFAULT,
  APIFY_RUN_TIMEOUT_MS,
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

export type ApifyRunStatus = "RUNNING" | "SUCCEEDED" | "FAILED" | "ABORTED" | "TIMED-OUT";

interface ApifyRedditItem {
  id?: string;
  parsedId?: string;
  url?: string;
  username?: string;
  title?: string;
  communityName?: string;
  parsedCommunityName?: string;
  body?: string;
  numberOfComments?: number;
  upVotes?: number;
  createdAt?: string;
  dataType?: string;
}

function truncate(s: string, max: number): string {
  if (s.length <= max) return s;
  return `${s.slice(0, max)}…`;
}

function apifyActorId(): string {
  const raw = process.env.APIFY_REDDIT_ACTOR || APIFY_REDDIT_ACTOR_DEFAULT;
  return raw.replace("/", "~");
}

function apifyToken(): string | null {
  return process.env.APIFY_API_TOKEN || null;
}

export function isApifyConfigured(): boolean {
  return Boolean(apifyToken());
}

function sourceCounts() {
  return {
    subredditPulls: Math.min(2, REDDIT_SUBREDDITS.length),
    searchPulls: Math.min(2, REDDIT_SEARCH_TERMS.length),
  };
}

function postDateLimit(): string {
  const d = new Date(Date.now() - SCAN_LOOKBACK_DAYS * 24 * 60 * 60 * 1000);
  return d.toISOString().slice(0, 10);
}

function buildStartUrls(): { url: string }[] {
  const coreSubs = REDDIT_SUBREDDITS.slice(0, 2);
  const coreSearches = REDDIT_SEARCH_TERMS.slice(0, 2);
  const subs = coreSubs.map((sub) => ({
    url: `https://www.reddit.com/r/${sub}/new/`,
  }));
  const searches = coreSearches.map((term) => ({
    url: `https://www.reddit.com/search/?q=${encodeURIComponent(term)}&sort=new&t=week`,
  }));
  return [...subs, ...searches];
}

function buildActorInput() {
  return {
    startUrls: buildStartUrls(),
    maxItems: APIFY_MAX_ITEMS,
    maxPostCount: APIFY_MAX_POSTS_PER_URL,
    maxComments: 0,
    includeMediaLinks: false,
    skipComments: true,
    skipUserPosts: true,
    skipCommunity: true,
    postDateLimit: postDateLimit(),
    proxy: { useApifyProxy: true },
  };
}

async function apifyFetch(path: string, init?: RequestInit): Promise<Response> {
  const token = apifyToken();
  if (!token) throw new Error("APIFY_API_TOKEN not set");

  const url = path.startsWith("http")
    ? path
    : `https://api.apify.com/v2${path}`;

  return fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });
}

export async function startApifyRedditRun(): Promise<{
  runId: string;
  datasetId: string;
}> {
  const actorId = apifyActorId();
  const startRes = await apifyFetch(`/acts/${actorId}/runs`, {
    method: "POST",
    body: JSON.stringify(buildActorInput()),
  });

  if (!startRes.ok) {
    const text = await startRes.text();
    throw new Error(`Apify start failed (${startRes.status}): ${text.slice(0, 300)}`);
  }

  const startJson = (await startRes.json()) as {
    data: { id: string; defaultDatasetId: string };
  };

  return {
    runId: startJson.data.id,
    datasetId: startJson.data.defaultDatasetId,
  };
}

function buildEngagementRefreshInput(urls: string[]) {
  return {
    startUrls: urls.map((url) => ({ url })),
    maxItems: urls.length,
    maxPostCount: 1,
    maxComments: 0,
    includeMediaLinks: false,
    skipComments: true,
    skipUserPosts: true,
    skipCommunity: true,
    proxy: { useApifyProxy: true },
  };
}

/** Start a small Apify run that revisits known post URLs only. */
export async function startApifyEngagementRefreshRun(
  urls: string[],
): Promise<{ runId: string; datasetId: string }> {
  if (urls.length === 0) {
    throw new Error("startApifyEngagementRefreshRun requires at least one URL");
  }

  const actorId = apifyActorId();
  const startRes = await apifyFetch(`/acts/${actorId}/runs`, {
    method: "POST",
    body: JSON.stringify(buildEngagementRefreshInput(urls)),
  });

  if (!startRes.ok) {
    const text = await startRes.text();
    throw new Error(
      `Apify engagement refresh start failed (${startRes.status}): ${text.slice(0, 300)}`,
    );
  }

  const startJson = (await startRes.json()) as {
    data: { id: string; defaultDatasetId: string };
  };

  return {
    runId: startJson.data.id,
    datasetId: startJson.data.defaultDatasetId,
  };
}

export interface ApifyEngagementSnapshot {
  externalId: string;
  url: string;
  title: string;
  body: string;
  score: number;
  numComments: number;
  removed: boolean;
}

function isRemovedContent(title: string, body: string): boolean {
  const t = title.trim().toLowerCase();
  const b = body.trim().toLowerCase();
  if (t === "[deleted]" || t === "[removed]") return true;
  if (b === "[deleted]" || b === "[removed]") return true;
  if (!t && (b === "[deleted]" || b === "[removed]")) return true;
  return false;
}

/** Parse dataset items for engagement refresh (no product filter). */
export function parseEngagementSnapshots(
  items: ApifyRedditItem[],
): ApifyEngagementSnapshot[] {
  const byId = new Map<string, ApifyEngagementSnapshot>();

  for (const item of items) {
    if (item.dataType && item.dataType !== "post") continue;

    const externalId = item.id || (item.parsedId ? `t3_${item.parsedId}` : "");
    if (!externalId) continue;

    const title = item.title ?? "";
    const body = item.body ?? "";
    const url =
      item.url?.startsWith("http")
        ? item.url
        : item.parsedId
          ? `https://www.reddit.com/comments/${item.parsedId}/`
          : "";

    byId.set(externalId, {
      externalId,
      url,
      title,
      body,
      score: item.upVotes ?? 0,
      numComments: item.numberOfComments ?? 0,
      removed: isRemovedContent(title, body),
    });
  }

  return [...byId.values()];
}

/** Local CLI: start engagement refresh and block until complete. */
export async function fetchEngagementSnapshotsViaApify(
  urls: string[],
): Promise<{
  snapshots: ApifyEngagementSnapshot[];
  configured: boolean;
  runId?: string;
  errors: string[];
}> {
  if (!isApifyConfigured()) {
    return {
      snapshots: [],
      configured: false,
      errors: ["APIFY_API_TOKEN not set"],
    };
  }

  if (urls.length === 0) {
    return { snapshots: [], configured: true, errors: [] };
  }

  try {
    const { runId } = await startApifyEngagementRefreshRun(urls);
    console.log(`[apify-refresh] started run ${runId} urls=${urls.length}`);
    const datasetId = await waitForApifyRun(runId);
    console.log(`[apify-refresh] succeeded, dataset=${datasetId}`);
    const items = await fetchDatasetItems(datasetId);
    console.log(`[apify-refresh] raw items=${items.length}`);
    return {
      snapshots: parseEngagementSnapshots(items),
      configured: true,
      runId,
      errors: [],
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      snapshots: [],
      configured: true,
      errors: [msg],
    };
  }
}

export async function getApifyRunStatus(runId: string): Promise<{
  status: ApifyRunStatus;
  datasetId: string | null;
  statusMessage?: string;
}> {
  const res = await apifyFetch(`/actor-runs/${runId}`);
  if (!res.ok) {
    throw new Error(`Apify status check failed (${res.status})`);
  }

  const json = (await res.json()) as {
    data: {
      status: ApifyRunStatus;
      statusMessage?: string;
      defaultDatasetId: string | null;
    };
  };

  return {
    status: json.data.status,
    datasetId: json.data.defaultDatasetId,
    statusMessage: json.data.statusMessage,
  };
}

async function waitForApifyRun(runId: string): Promise<string> {
  const deadline = Date.now() + APIFY_RUN_TIMEOUT_MS;

  while (Date.now() < deadline) {
    const { status, datasetId, statusMessage } = await getApifyRunStatus(runId);
    if (status === "SUCCEEDED" && datasetId) return datasetId;
    if (status === "FAILED" || status === "ABORTED" || status === "TIMED-OUT") {
      throw new Error(`Apify run ${status}: ${statusMessage ?? "unknown error"}`);
    }
    await new Promise((r) => setTimeout(r, 5000));
  }

  throw new Error("Apify run timed out waiting for completion");
}

async function fetchDatasetItems(datasetId: string): Promise<ApifyRedditItem[]> {
  const res = await apifyFetch(
    `/datasets/${datasetId}/items?clean=true&format=json`,
  );
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Apify dataset fetch failed (${res.status}): ${text.slice(0, 200)}`);
  }
  return (await res.json()) as ApifyRedditItem[];
}

function parseSubreddit(item: ApifyRedditItem): string {
  if (item.parsedCommunityName) return item.parsedCommunityName;
  if (item.communityName?.startsWith("r/")) {
    return item.communityName.slice(2);
  }
  return item.communityName ?? "";
}

function normalizeApifyItem(item: ApifyRedditItem): NormalizedSocialPost | null {
  if (item.dataType && item.dataType !== "post") return null;
  if (!item.title && !item.body) return null;

  const title = item.title ?? "";
  const body = truncate(item.body ?? "", BODY_MAX_CHARS);
  const text = `${title}\n${body}`;
  const products = matchProducts(text, parseSubreddit(item));
  if (products.length === 0) return null;

  const externalId = item.id || (item.parsedId ? `t3_${item.parsedId}` : "");
  if (!externalId) return null;

  const permalink = item.url?.startsWith("http")
    ? item.url
    : item.parsedId
      ? `https://www.reddit.com/comments/${item.parsedId}/`
      : "";

  if (!permalink) return null;

  const score = item.upVotes ?? 0;
  const numComments = item.numberOfComments ?? 0;
  const postedAt = item.createdAt
    ? new Date(item.createdAt).toISOString()
    : new Date().toISOString();

  return {
    id: `reddit-${externalId}`,
    platform: "reddit",
    externalId,
    subreddit: parseSubreddit(item),
    title,
    body,
    score,
    numComments,
    author: item.username && item.username !== "[deleted]" ? item.username : null,
    permalink,
    url: permalink,
    postedAt,
    products,
    hasRegulatory: hasRegulatoryKeyword(text),
    engagement: engagementScore(score, numComments),
    auContext: hasAuContext(text),
  };
}

function withinLookback(postedAt: string, days: number): boolean {
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  return new Date(postedAt).getTime() >= cutoff;
}

export function itemsToSocialFetchResult(
  items: ApifyRedditItem[],
  errors: string[] = [],
): SocialFetchResult {
  const byId = new Map<string, NormalizedSocialPost>();
  for (const item of items) {
    const post = normalizeApifyItem(item);
    if (!post) continue;
    if (!withinLookback(post.postedAt, SCAN_LOOKBACK_DAYS)) continue;
    byId.set(post.externalId, post);
  }

  return {
    posts: [...byId.values()],
    configured: true,
    provider: "apify",
    sources: sourceCounts(),
    errors,
  };
}

export async function fetchApifyDatasetPosts(
  datasetId: string,
): Promise<SocialFetchResult> {
  const items = await fetchDatasetItems(datasetId);
  return itemsToSocialFetchResult(items);
}

/** Local CLI: start Apify and block until complete. */
export async function fetchRedditPeptidePostsViaApify(): Promise<SocialFetchResult> {
  if (!isApifyConfigured()) {
    return {
      posts: [],
      configured: false,
      provider: "none",
      sources: { subredditPulls: 0, searchPulls: 0 },
      errors: ["APIFY_API_TOKEN not set"],
    };
  }

  const errors: string[] = [];

  try {
    const { runId } = await startApifyRedditRun();
    console.log(`[apify] started run ${runId}`);
    const datasetId = await waitForApifyRun(runId);
    console.log(`[apify] succeeded, dataset=${datasetId}`);
    const items = await fetchDatasetItems(datasetId);
    console.log(`[apify] raw items=${items.length}`);
    return itemsToSocialFetchResult(items, errors);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    errors.push(msg);
    return {
      posts: [],
      configured: true,
      provider: "apify",
      sources: sourceCounts(),
      errors,
    };
  }
}
