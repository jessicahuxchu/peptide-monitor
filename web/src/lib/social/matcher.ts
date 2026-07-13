import {
  AU_KEYWORDS,
  PRODUCT_ALIASES,
  REGULATORY_KEYWORDS,
  type ProductAlias,
} from "./config";

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function aliasPattern(alias: string): RegExp {
  return new RegExp(
    `(^|[^a-z0-9])${escapeRegex(alias)}([^a-z0-9]|$)`,
    "i",
  );
}

function productEntry(product: string): ProductAlias | undefined {
  return PRODUCT_ALIASES.find((entry) => entry.product === product);
}

/** Text used for product keyword matching (title, body, optional subreddit). */
export function buildProductMatchText(
  title: string,
  body: string,
  subreddit?: string,
): string {
  const parts = [title, body];
  if (subreddit?.trim()) {
    parts.push(`r/${subreddit.trim()}`);
  }
  return parts.join("\n");
}

/** Match product aliases in free text; returns canonical product names. */
export function matchProducts(
  text: string,
  subreddit?: string,
): string[] {
  const combined = subreddit ? `${text}\nr/${subreddit.trim()}` : text;
  const lower = combined.toLowerCase();
  const hit = new Set<string>();

  for (const entry of PRODUCT_ALIASES) {
    for (const alias of entry.aliases) {
      if (aliasPattern(alias).test(lower)) {
        hit.add(entry.product);
        break;
      }
    }
  }

  return [...hit];
}

/** True when the product alias appears in the post title (not body-only mention). */
export function productMentionedInTitle(
  title: string,
  product: string,
): boolean {
  const entry = productEntry(product);
  if (!entry) return false;
  const lower = title.toLowerCase();
  return entry.aliases.some((alias) => aliasPattern(alias).test(lower));
}

/** Posts tagged with many products at once (glossaries / stack roundups). */
export const ROUNDUP_MAX_PRODUCT_TAGS = 4;

function isBroadRoundupPost(products: string[]): boolean {
  return products.length > ROUNDUP_MAX_PRODUCT_TAGS;
}

/** Whether a post should count toward a product's heat / representative pool. */
export function postCountsForProduct(
  post: { title: string; products: string[] },
  product: string,
): boolean {
  if (!post.products.includes(product)) return false;
  if (!isBroadRoundupPost(post.products)) return true;
  return productMentionedInTitle(post.title, product);
}

/**
 * Pick representative post: prefer title mentions, then highest engagement.
 * Skips broad roundup posts unless the product is in the title.
 */
export function pickRepresentativePost<
  T extends { title: string; engagement: number; products: string[] },
>(pool: T[], product: string): T | null {
  const eligible = pool.filter((p) => postCountsForProduct(p, product));
  if (eligible.length === 0) return null;

  const inTitle = eligible.filter((p) => productMentionedInTitle(p.title, product));
  if (inTitle.length === 0) return null;

  return [...inTitle].sort((a, b) => b.engagement - a.engagement)[0] ?? null;
}

export function hasRegulatoryKeyword(text: string): boolean {
  const lower = text.toLowerCase();
  return REGULATORY_KEYWORDS.some((kw) => {
    if (kw.includes(" ")) {
      return lower.includes(kw);
    }
    const pattern = new RegExp(`(^|[^a-z0-9])${escapeRegex(kw)}([^a-z0-9]|$)`, "i");
    return pattern.test(lower);
  });
}

export function hasAuContext(text: string): boolean {
  const lower = text.toLowerCase();
  return AU_KEYWORDS.some((kw) => lower.includes(kw));
}

export function engagementScore(score: number, numComments: number): number {
  return score + 2 * numComments;
}
