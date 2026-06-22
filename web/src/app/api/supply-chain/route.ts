import { NextResponse } from "next/server";
import { dbErrorPayload } from "@/lib/db/error-utils";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { dbUnavailableResponse } from "@/lib/api/auth";
import { fetchSupplyChainState } from "@/lib/db/supply-chain";
import { ensureSeeded } from "@/lib/db/ensure-seeded";

export async function GET() {
  if (!isSupabaseConfigured()) return dbUnavailableResponse();

  try {
    await ensureSeeded();
    const state = await fetchSupplyChainState();
    return NextResponse.json(state);
  } catch (err) {
    return NextResponse.json(
      dbErrorPayload(err, "Failed to fetch supply chain"),
      { status: 500 },
    );
  }
}
