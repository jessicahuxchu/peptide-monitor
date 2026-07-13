import { readFileSync } from "fs";
import { resolve } from "path";

function loadEnvLocal() {
  const path = resolve(process.cwd(), ".env.local");
  const content = readFileSync(path, "utf8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx === -1) continue;
    const key = trimmed.slice(0, idx).trim();
    const val = trimmed.slice(idx + 1).trim();
    if (process.env[key] === undefined) process.env[key] = val;
  }
}

async function main() {
  loadEnvLocal();
  const { createServiceClient } = await import("../src/lib/supabase/client");
  const { syncSkuOpportunitiesFromStoredPosts } = await import(
    "../src/lib/social/sku-from-heat"
  );
  const supabase = createServiceClient();

  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const { data: dbPosts, error } = await supabase
    .from("social_posts")
    .select("*")
    .eq("platform", "reddit")
    .gte("posted_at", since);

  if (error) throw error;

  const posts = (dbPosts ?? []).map((row) => ({
    id: row.id,
    platform: "reddit" as const,
    externalId: row.external_id,
    subreddit: row.subreddit ?? "",
    title: row.title,
    body: row.body,
    score: row.score,
    numComments: row.num_comments,
    author: row.author,
    permalink: row.permalink,
    url: row.url,
    postedAt: row.posted_at,
    products: (row.products as string[]) ?? [],
    hasRegulatory: row.has_regulatory,
    engagement: row.engagement,
    auContext: row.au_context ?? false,
    regulatoryReason: row.regulatory_reason,
    classifiedBy: row.classified_by as "agent" | "rules" | undefined,
  }));

  const upserted = await syncSkuOpportunitiesFromStoredPosts(supabase, posts);
  console.log(
    `Synced ${upserted} sku_opportunities row(s) from ${posts.length} Reddit post(s).`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
