import type { NormalizedSocialPost } from "./types";

/** Daily mention counts for the last N days — oldest bucket on the left. */
export function buildDailyMentionSparkline(
  posts: NormalizedSocialPost[],
  product: string,
  days = 7,
): number[] {
  const buckets = Array<number>(days).fill(0);
  const now = Date.now();

  for (const post of posts) {
    if (!post.products.includes(product)) continue;
    const hours = (now - new Date(post.postedAt).getTime()) / (1000 * 60 * 60);
    if (hours < 0 || hours > days * 24) continue;
    const dayIndex = Math.floor(hours / 24);
    if (dayIndex < days) {
      buckets[days - 1 - dayIndex] += 1;
    }
  }

  return buckets;
}
