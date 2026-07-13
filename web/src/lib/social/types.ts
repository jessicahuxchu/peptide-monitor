export interface SocialPost {
  id: string;
  platform: string;
  externalId: string;
  subreddit: string | null;
  title: string;
  body: string;
  score: number;
  numComments: number;
  author: string | null;
  permalink: string;
  url: string;
  postedAt: string;
  products: string[];
  hasRegulatory: boolean;
  engagement: number;
  fetchedAt: string;
  regulatoryReason?: string | null;
  classifiedBy?: "agent" | "rules" | null;
  auContext?: boolean;
}

export interface NormalizedSocialPost {
  id: string;
  platform: "reddit";
  externalId: string;
  subreddit: string;
  title: string;
  body: string;
  score: number;
  numComments: number;
  author: string | null;
  permalink: string;
  url: string;
  postedAt: string;
  products: string[];
  hasRegulatory: boolean;
  engagement: number;
  auContext: boolean;
  regulatoryReason?: string | null;
  classifiedBy?: "agent" | "rules" | null;
}

export interface SocialFetchResult {
  posts: NormalizedSocialPost[];
  configured: boolean;
  provider: "apify" | "reddit" | "none";
  sources: { subredditPulls: number; searchPulls: number };
  errors: string[];
}

export interface SocialPostsResponse {
  posts: SocialPost[];
  total: number;
}
