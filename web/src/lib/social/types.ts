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
}

export interface SocialPostsResponse {
  posts: SocialPost[];
  total: number;
}
