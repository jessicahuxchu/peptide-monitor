import { NextRequest, NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { dbUnavailableResponse, requireApiKey } from "@/lib/api/auth";
import { runEngagementRefresh } from "@/lib/social/engagement-refresh";

/** Apify revisit of up to ~40 posts can exceed 60s; align with Pro plan limits. */
export const maxDuration = 300;

async function handle(request: NextRequest) {
  const authErr = requireApiKey(request);
  if (authErr) return authErr;
  if (!isSupabaseConfigured()) return dbUnavailableResponse();

  try {
    const result = await runEngagementRefresh();
    return NextResponse.json(result, { status: result.ok ? 200 : 503 });
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : "Engagement refresh failed",
      },
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
