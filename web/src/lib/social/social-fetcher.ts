import { fetchRedditPeptidePostsViaApify, isApifyConfigured } from "./apify-client";
import { fetchRedditPeptidePostsViaOAuth } from "./reddit-client";
import type { SocialFetchResult } from "./types";

/**
 * Social fetch entry point — Apify (preferred) → Reddit OAuth fallback.
 */
export async function fetchSocialPeptidePosts(): Promise<SocialFetchResult> {
  if (isApifyConfigured()) {
    return fetchRedditPeptidePostsViaApify();
  }
  return fetchRedditPeptidePostsViaOAuth();
}

export { isApifyConfigured };
