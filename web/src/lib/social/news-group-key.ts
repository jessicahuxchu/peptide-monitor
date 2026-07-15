import { PRODUCT_ALIASES, REGULATORY_KEYWORDS } from "./config";
import {
  buildProductMatchText,
  matchProducts,
  productMentionedInTitle,
} from "./matcher";
import type { NormalizedSocialPost } from "./types";

/** Whitelisted combo products from product monitor — not arbitrary multi-product sets. */
export const MONITORED_PRODUCT_COMBOS: Array<{
  label: string;
  aliases: string[];
  products: string[];
}> = [
  {
    label: "KLOW",
    aliases: ["klow", "klow blend", "klow80", "klow 80"],
    products: ["KLOW"],
  },
  {
    label: "GLOW",
    aliases: ["glow", "glow blend", "glow70", "glow 70", "glow rejuvenation"],
    products: ["GLOW"],
  },
  {
    label: "BPC-157 + TB-500",
    aliases: [
      "bpc-157 + tb-500",
      "bpc157 + tb500",
      "bpc157 tb500",
      "bpc-157/tb-500",
      "bpc157/tb500",
      "bpc tb blend",
      "bpc-157 tb-500 blend",
      "bpc157 tb500 blend",
      "regeno blend",
    ],
    products: ["BPC-157 + TB-500"],
  },
  {
    label: "CJC-1295 + Ipamorelin",
    aliases: [
      "cjc-1295 + ipamorelin",
      "cjc1295 ipamorelin",
      "cjc-1295/ipamorelin",
      "cjc ipamorelin",
      "cjc1295 + ipamorelin",
      "mod grf 1-29 ipamorelin",
    ],
    products: ["CJC-1295 + Ipamorelin"],
  },
];

/** Agency tags appended to generic Peptides groups (Peptides-only posts). */
export const REGULATORY_AGENCY_TAGS: Array<{ tag: string; keywords: string[] }> =
  [
    { tag: "FDA", keywords: ["fda"] },
    { tag: "TGA", keywords: ["tga"] },
    { tag: "DEA", keywords: ["dea"] },
    { tag: "EMA", keywords: ["ema"] },
  ];

export interface NewsGroupKey {
  /** Display label, e.g. "BPC-157" or "Peptides+FDA" */
  label: string;
  /** Stable slug for signal ids */
  slug: string;
  products: string[];
  /** True when grouped as generic peptides (no specific product). */
  isGenericPeptides: boolean;
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function aliasPattern(alias: string): RegExp {
  return new RegExp(
    `(^|[^a-z0-9])${escapeRegex(alias)}([^a-z0-9]|$)`,
    "i",
  );
}

function textMatchesAlias(text: string, alias: string): boolean {
  return aliasPattern(alias).test(text.toLowerCase());
}

function matchMonitoredCombo(text: string): (typeof MONITORED_PRODUCT_COMBOS)[number] | null {
  for (const combo of MONITORED_PRODUCT_COMBOS) {
    if (combo.aliases.some((alias) => textMatchesAlias(text, alias))) {
      return combo;
    }
  }
  return null;
}

function mentionsPeptide(text: string): boolean {
  return /\bpeptides?\b/i.test(text);
}

function matchAgencyTags(text: string): string[] {
  const lower = text.toLowerCase();
  const tags: string[] = [];
  for (const entry of REGULATORY_AGENCY_TAGS) {
    if (entry.keywords.some((kw) => lower.includes(kw))) {
      tags.push(entry.tag);
    }
  }
  return tags.sort();
}

/** Pick a single canonical product when no whitelisted combo matches. */
function pickPrimaryProduct(
  post: Pick<NormalizedSocialPost, "title" | "body" | "subreddit" | "products">,
): string | null {
  const matched = matchProducts(
    buildProductMatchText(post.title, post.body, post.subreddit),
    post.subreddit,
  );
  if (matched.length === 0) return null;

  const inTitle = matched.filter((p) =>
    productMentionedInTitle(post.title, p),
  );
  const pool = inTitle.length > 0 ? inTitle : matched;
  const order = PRODUCT_ALIASES.map((e) => e.product);
  pool.sort((a, b) => order.indexOf(a) - order.indexOf(b));
  return pool[0] ?? null;
}

export function resolveNewsGroupKey(
  post: Pick<
    NormalizedSocialPost,
    "title" | "body" | "subreddit" | "products" | "hasRegulatory"
  >,
): NewsGroupKey | null {
  const text = buildProductMatchText(post.title, post.body, post.subreddit);

  const combo = matchMonitoredCombo(text);
  if (combo) {
    return {
      label: combo.label,
      slug: combo.label.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      products: combo.products,
      isGenericPeptides: false,
    };
  }

  const product = pickPrimaryProduct(post);
  if (product) {
    return {
      label: product,
      slug: product.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      products: [product],
      isGenericPeptides: false,
    };
  }

  if (!mentionsPeptide(text)) return null;

  const agencyTags = matchAgencyTags(text);
  const label =
    agencyTags.length > 0 ? `Peptides+${agencyTags.join("+")}` : "Peptides";
  const slug =
    agencyTags.length > 0
      ? `peptides-${agencyTags.map((t) => t.toLowerCase()).join("-")}`
      : "peptides";

  return {
    label,
    slug,
    products: ["Peptides"],
    isGenericPeptides: true,
  };
}

export function groupKeyEquals(a: NewsGroupKey, b: NewsGroupKey): boolean {
  return a.slug === b.slug;
}

export function newsGroupKeyFromSignal(
  signal: Pick<{ id: string; products: string[]; title: string }, "id" | "products" | "title">,
): NewsGroupKey | null {
  if (
    !signal.id.startsWith("news-digest-") &&
    !signal.id.startsWith("news-legal-vol-")
  ) {
    return null;
  }

  if (signal.id.startsWith("news-digest-")) {
    const withoutPrefix = signal.id.slice("news-digest-".length);
    const match = withoutPrefix.match(/^(.+)-(\d{4}-\d{2}-\d{2})$/);
    if (!match) return null;
    const slug = match[1];
    const labelFromTitle = signal.title.match(/^News — (.+?) 近 7 日/)?.[1];
    return {
      label: labelFromTitle ?? signal.products[0] ?? slug,
      slug,
      products: signal.products.length > 0 ? signal.products : ["Peptides"],
      isGenericPeptides: slug.startsWith("peptides"),
    };
  }

  // Legacy volume digest id: news-legal-vol-{productSlug}-{date}
  const legacy = signal.id.slice("news-legal-vol-".length);
  const match = legacy.match(/^(.+)-(\d{4}-\d{2}-\d{2})$/);
  if (!match) return null;
  const product = signal.products[0] ?? match[1].replace(/-/g, " ");
  return {
    label: product,
    slug: match[1],
    products: signal.products.length > 0 ? signal.products : [product],
    isGenericPeptides: false,
  };
}

export function postMatchesNewsGroup(
  post: NormalizedSocialPost,
  group: NewsGroupKey,
): boolean {
  const key = resolveNewsGroupKey(post);
  return key !== null && groupKeyEquals(key, group);
}

export function postsForNewsGroup(
  posts: NormalizedSocialPost[],
  group: NewsGroupKey,
  window?: { startMs: number; endMs: number },
): NormalizedSocialPost[] {
  return posts
    .filter((p) => {
      if (p.platform !== "google_news") return false;
      if (!postMatchesNewsGroup(p, group)) return false;
      if (!window) return true;
      const t = new Date(p.postedAt).getTime();
      if (Number.isNaN(t)) return false;
      return t >= window.startMs && t <= window.endMs;
    })
    .sort(
      (a, b) =>
        new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime(),
    );
}

/** Whether text hits any regulatory keyword (for digest kind scoring). */
export function hasRegulatoryContent(text: string): boolean {
  const lower = text.toLowerCase();
  return REGULATORY_KEYWORDS.some((kw) => {
    if (kw.includes(" ")) return lower.includes(kw);
    return new RegExp(
      `(^|[^a-z0-9])${escapeRegex(kw)}([^a-z0-9]|$)`,
      "i",
    ).test(lower);
  });
}
