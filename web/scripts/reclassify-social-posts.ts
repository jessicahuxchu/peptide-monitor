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
  const { reclassifyStoredSocialPosts } = await import(
    "../src/lib/social/heat-aggregator"
  );
  console.log("[reclassify-social-posts] starting…");
  const result = await reclassifyStoredSocialPosts();
  console.log(JSON.stringify(result, null, 2));
  if (result.signalAudit?.length) {
    const issues = result.signalAudit.filter((a) => a.issue);
    console.log("\n[signal-audit] promoted:", result.signalAudit.filter((a) => a.promote).length);
    if (issues.length === 0) {
      console.log("[signal-audit] no representative-post mismatches");
    } else {
      console.log("[signal-audit] issues:");
      for (const row of issues) {
        console.log(`  - ${row.product}: ${row.issue}`);
        console.log(`    top: ${row.topTitle?.slice(0, 70)}`);
      }
    }
  }
  process.exit(result.ok ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
