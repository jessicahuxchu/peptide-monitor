import { NextRequest, NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { dbUnavailableResponse, requireApiKey } from "@/lib/api/auth";
import { runRedditHeatScan } from "@/lib/social/heat-aggregator";

export async function POST(request: NextRequest) {
  const authErr = requireApiKey(request);
  if (authErr) return authErr;
  if (!isSupabaseConfigured()) return dbUnavailableResponse();

  try {
    const result = await runRedditHeatScan();
    const status = result.ok ? 200 : 503;
    return NextResponse.json(result, { status });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Reddit heat scan failed" },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  return POST(request);
}
