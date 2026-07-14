/** Monitored Reddit communities (high signal-to-noise for peptides). */
export const REDDIT_SUBREDDITS = [
  "Peptides",
  "PeptideScience",
  "Biohacking",
  "Supplements",
] as const;

export interface ProductAlias {
  /** Canonical product name written to DB / intelligence_signals */
  product: string;
  /** Lowercase match patterns (word-boundary aware where possible) */
  aliases: string[];
}

/** Core peptide dictionary for MVP heat aggregation. */
export const PRODUCT_ALIASES: ProductAlias[] = [
  {
    product: "BPC-157",
    aliases: ["bpc-157", "bpc157", "bpc 157", "body protection compound"],
  },
  {
    product: "TB-500",
    aliases: ["tb-500", "tb500", "tb 500", "thymosin beta-4", "thymosin beta 4"],
  },
  {
    product: "GHK-Cu",
    aliases: ["ghk-cu", "ghkcu", "ghk cu", "copper peptide"],
  },
  {
    product: "Semaglutide",
    aliases: ["semaglutide", "ozempic", "wegovy"],
  },
  {
    product: "Retatrutide",
    aliases: ["retatrutide", "reta-trutide", "ly3437943"],
  },
  {
    product: "Tirzepatide",
    aliases: ["tirzepatide", "mounjaro", "zepbound"],
  },
  {
    product: "CJC-1295",
    aliases: ["cjc-1295", "cjc1295", "cjc 1295"],
  },
  {
    product: "Ipamorelin",
    aliases: ["ipamorelin"],
  },
  {
    product: "Melanotan",
    aliases: ["melanotan", "mt-2", "mt2", "melanotan-2", "melanotan 2"],
  },
];

/** Keywords that elevate a post / signal to regulatory dimension. */
export const REGULATORY_KEYWORDS = [
  "tga",
  "fda",
  "ban",
  "banned",
  "seizure",
  "seized",
  "customs",
  "schedule 4",
  "schedule4",
  "s4",
  "dea",
  "enforcement",
  "raid",
  "illegal",
  "prescription only",
] as const;

/** AU / Australia context boost for region tagging. */
export const AU_KEYWORDS = [
  "australia",
  "australian",
  "aussie",
  "tga",
  "sydney",
  "melbourne",
  "brisbane",
  "perth",
  "nsw",
  "qld",
  "victoria",
] as const;

/** Heat → intelligence_signals promotion thresholds. */
export const HEAT_THRESHOLDS = {
  /** Min 24h mentions + relative lift vs 7d baseline */
  minMentions24h: 3,
  mentionLiftRatio: 1.5,
  /** Single-post engagement (score + 2*comments) to promote alone */
  highEngagement: 50,
  /** Always promote if regulatory keyword hit and at least this engagement */
  regulatoryMinEngagement: 5,
} as const;

/** How far back to pull on each daily scan (covers baseline window). */
export const SCAN_LOOKBACK_DAYS = 7;

export const BODY_MAX_CHARS = 4000;

/** Apify Reddit scraper — https://apify.com/trudax/reddit-scraper-lite */
export const APIFY_REDDIT_ACTOR_DEFAULT = "trudax/reddit-scraper-lite";

/** Keep MVP runs small/fast; raise later once daily cron is stable. */
export const APIFY_MAX_ITEMS = 120;
export const APIFY_MAX_POSTS_PER_URL = 25;
export const APIFY_RUN_TIMEOUT_MS = 20 * 60 * 1000;

/** Small-scope Apify revisit: refresh score/comments for known posts. */
export const ENGAGEMENT_REFRESH_MAX_POSTS = 40;
export const ENGAGEMENT_REFRESH_LOOKBACK_DAYS = 7;
/** Mark removed after this many consecutive revisit misses/failures. */
export const ENGAGEMENT_REFRESH_FAIL_LIMIT = 2;
/** Approximate Trudax lite list price for cost logs ($/result). */
export const ENGAGEMENT_REFRESH_COST_PER_RESULT_USD = 0.0034;

/** Hours between engagement refreshes by post age. */
export const ENGAGEMENT_REFRESH_INTERVAL_HOURS = {
  under24h: 12,
  day1to3: 24,
  day4to7: 48,
} as const;

/** Product keyword searches (encoded into Reddit search URLs). */
export const REDDIT_SEARCH_TERMS = [
  "BPC-157",
  "TB-500",
  "GHK-Cu",
  "Semaglutide peptide",
  "Tirzepatide",
  "Retatrutide",
] as const;

/** Apify Google News — https://apify.com/crawlerbros/google-news-scraper */
export const APIFY_GOOGLE_NEWS_ACTOR_DEFAULT = "crawlerbros/google-news-scraper";

/** Max articles per Google News query (MVP cost control). */
export const GOOGLE_NEWS_MAX_PER_QUERY = 12;

/** 7d volume threshold to promote non-regulatory product news. */
export const GOOGLE_NEWS_MIN_MENTIONS_7D = 3;

/**
 * Daily Google News search queries: category, products, AU/regs, manufacturing/R&D.
 * Kept English; AU/TGA coverage via dedicated queries.
 */
export const GOOGLE_NEWS_QUERIES = [
  // Category / industry
  "peptides",
  "peptide therapy",
  "peptide research",
  'peptide manufacturing OR "peptide synthesis" OR "peptide CDMO"',
  '"peptide pharmaceutical" (FDA OR TGA OR EMA)',
  // Products
  "BPC-157",
  "TB-500",
  'GHK-Cu OR "copper peptide"',
  "Semaglutide peptide",
  "Tirzepatide",
  "Retatrutide",
  "CJC-1295",
  "Ipamorelin",
  'Melanotan OR "MT-2"',
  // AU / regulatory focus
  '"TGA" peptide',
  "peptide Australia (ban OR regulation OR customs OR scheduling)",
  "FDA peptide (ban OR seize OR compounding OR GLP-1)",
] as const;
