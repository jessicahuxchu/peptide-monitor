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
