import { NextRequest, NextResponse } from "next/server";
import { requireApiKey, dbUnavailableResponse } from "@/lib/api/auth";
import { withDbHandler } from "@/lib/api/with-db";
import { seedDatabase } from "@/lib/db/seed";
import { isSupabaseConfigured } from "@/lib/supabase/client";

export async function POST(request: NextRequest) {
  const authErr = requireApiKey(request);
  if (authErr) return authErr;
  if (!isSupabaseConfigured()) return dbUnavailableResponse();

  try {
    const result = await seedDatabase();
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Seed failed" },
      { status: 500 },
    );
  }
}

export async function GET() {
  return withDbHandler(async () => ({ ok: true, message: "Platform database ready" }));
}
