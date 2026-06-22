import { NextRequest, NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { dbUnavailableResponse, requireApiKey } from "@/lib/api/auth";
import { runRegulatoryScan } from "@/lib/agent/regulatory-scanner";

export async function POST(request: NextRequest) {
  const authErr = requireApiKey(request);
  if (authErr) return authErr;
  if (!isSupabaseConfigured()) return dbUnavailableResponse();

  try {
    const body = await request.json().catch(() => ({}));
    const source = (body.source as string) || "scheduled_scout";
    const result = await runRegulatoryScan(source);
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Scan failed" },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  return POST(request);
}
