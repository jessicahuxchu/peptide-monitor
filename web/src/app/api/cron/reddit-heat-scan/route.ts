import { NextRequest, NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { dbUnavailableResponse, requireApiKey } from "@/lib/api/auth";
import {
  runRedditHeatScan,
  type RedditHeatScanPhase,
} from "@/lib/social/heat-aggregator";

export const maxDuration = 60;

function parsePhase(value: string | null): RedditHeatScanPhase {
  if (value === "start" || value === "complete" || value === "sync") {
    return value;
  }
  return "sync";
}

async function handle(request: NextRequest) {
  const authErr = requireApiKey(request);
  if (authErr) return authErr;
  if (!isSupabaseConfigured()) return dbUnavailableResponse();

  const phase = parsePhase(request.nextUrl.searchParams.get("phase"));

  try {
    const result = await runRedditHeatScan(phase);
    const status =
      result.ok || phase === "start" || result.apifyStatus === "RUNNING"
        ? 200
        : 503;
    return NextResponse.json(result, { status });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Reddit heat scan failed" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  return handle(request);
}

export async function GET(request: NextRequest) {
  return handle(request);
}
