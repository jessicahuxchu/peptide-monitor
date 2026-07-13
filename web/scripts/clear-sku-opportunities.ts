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
  const supabase = createServiceClient();

  const { error, count } = await supabase
    .from("sku_opportunities")
    .delete({ count: "exact" })
    .neq("id", "");

  if (error) {
    console.error("Failed to clear sku_opportunities:", error.message);
    process.exit(1);
  }

  console.log(`Cleared sku_opportunities (${count ?? 0} rows removed).`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
