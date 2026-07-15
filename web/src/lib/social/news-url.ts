/**
 * URL helpers for Google News items — safe for client + server.
 */

/** Unwrap Google redirect wrappers to the publisher destination when present. */
export function unwrapGoogleNewsUrl(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return "";
  try {
    const u = new URL(trimmed);
    const host = u.hostname.toLowerCase();
    const isGoogle =
      host === "news.google.com" ||
      host.endsWith(".google.com") ||
      host === "google.com";
    if (isGoogle) {
      for (const key of ["url", "q", "u"]) {
        const nested = u.searchParams.get(key);
        if (nested && /^https?:\/\//i.test(nested)) {
          return unwrapGoogleNewsUrl(nested);
        }
      }
    }
    return trimmed;
  } catch {
    return trimmed;
  }
}

/**
 * True when URL looks like a specific article (not a bare homepage / locale root).
 * SEO spam outlets often resolve Google News to the site root — reject those.
 */
export function isConcreteArticleUrl(raw: string): boolean {
  try {
    const u = new URL(raw);
    if (u.protocol !== "http:" && u.protocol !== "https:") return false;
    const path = u.pathname.replace(/\/+$/, "");
    const segments = path.split("/").filter(Boolean);
    if (segments.length === 0) return false;
    if (
      segments.length === 1 &&
      /^[a-z]{2}(-[a-z]{2})?$/i.test(segments[0])
    ) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}
