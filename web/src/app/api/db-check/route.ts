import { NextResponse } from "next/server";
import { dbErrorPayload } from "@/lib/db/error-utils";
import { createServiceClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { dbUnavailableResponse } from "@/lib/api/auth";

const CHECK_TABLES = [
  "supply_chain_paths",
  "path_nodes",
  "product_monitor_records",
  "monitor_meta",
  "intelligence_signals",
  "sales_records",
] as const;

export async function GET() {
  if (!isSupabaseConfigured()) return dbUnavailableResponse();

  try {
    const supabase = createServiceClient();
    const tables: Record<string, { ok: boolean; count?: number; error?: string }> =
      {};

    for (const table of CHECK_TABLES) {
      const { count, error } = await supabase
        .from(table)
        .select("*", { count: "exact", head: true });

      if (error) {
        tables[table] = { ok: false, error: error.message };
      } else {
        tables[table] = { ok: true, count: count ?? 0 };
      }
    }

    const missing = Object.entries(tables)
      .filter(([, value]) => !value.ok)
      .map(([name]) => name);

    return NextResponse.json({
      ok: missing.length === 0,
      tables,
      missing,
      hint:
        missing.length > 0
          ? "Run supabase/migrations/001_initial.sql and 002_extended_modules.sql in Supabase SQL Editor."
          : undefined,
    });
  } catch (err) {
    return NextResponse.json(
      dbErrorPayload(err, "Database connection failed"),
      { status: 500 },
    );
  }
}
