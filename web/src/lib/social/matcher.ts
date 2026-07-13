import {
  AU_KEYWORDS,
  PRODUCT_ALIASES,
  REGULATORY_KEYWORDS,
} from "./config";

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Match product aliases in free text; returns canonical product names. */
export function matchProducts(text: string): string[] {
  const lower = text.toLowerCase();
  const hit = new Set<string>();

  for (const entry of PRODUCT_ALIASES) {
    for (const alias of entry.aliases) {
      const pattern = new RegExp(
        `(^|[^a-z0-9])${escapeRegex(alias)}([^a-z0-9]|$)`,
        "i",
      );
      if (pattern.test(lower)) {
        hit.add(entry.product);
        break;
      }
    }
  }

  return [...hit];
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
