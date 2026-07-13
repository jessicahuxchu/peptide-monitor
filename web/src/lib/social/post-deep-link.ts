/** Normalize Reddit URLs for stable matching between signals and stored posts. */
export function normalizeRedditUrl(url: string): string {
  try {
    const parsed = new URL(url);
    parsed.hash = "";
    parsed.search = "";
    const path = parsed.pathname.replace(/\/$/, "");
    return `${parsed.hostname}${path}`.toLowerCase();
  } catch {
    return url.replace(/\/$/, "").toLowerCase();
  }
}

export function socialPostAnchorId(postId: string): string {
  return `social-post-${postId}`;
}

export function socialPostsHref(options: {
  postId?: string | null;
  postUrl?: string | null;
}): string | null {
  if (options.postId) {
    return `/social-posts?post=${encodeURIComponent(options.postId)}`;
  }
  if (options.postUrl) {
    return `/social-posts?postUrl=${encodeURIComponent(options.postUrl)}`;
  }
  return null;
}

export function resolveSocialPostId(
  posts: { id: string; url: string }[],
  options: { postId?: string | null; postUrl?: string | null },
): string | null {
  if (options.postId) {
    const byId = posts.find((p) => p.id === options.postId);
    if (byId) return byId.id;
  }
  if (options.postUrl) {
    const norm = normalizeRedditUrl(options.postUrl);
    const byUrl = posts.find((p) => normalizeRedditUrl(p.url) === norm);
    if (byUrl) return byUrl.id;
  }
  return null;
}
