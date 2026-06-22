import { NextRequest, NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { dbUnavailableResponse, requireApiKey } from "@/lib/api/auth";
import { seedDatabase } from "@/lib/db/seed";
import { fetchSupplyChainState } from "@/lib/db/supply-chain";

export async function POST(request: NextRequest) {
  const authErr = requireApiKey(request);
  if (authErr) return authErr;
  if (!isSupabaseConfigured()) return dbUnavailableResponse();

  try {
    await seedDatabase();
    const state = await fetchSupplyChainState();
    return NextResponse.json({ ok: true, state });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Seed failed" },
      { status: 500 },
    );
  }
}
