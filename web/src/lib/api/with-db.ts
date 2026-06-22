import { NextResponse } from "next/server";
import { dbErrorPayload } from "@/lib/db/error-utils";
import { ensureSeeded } from "@/lib/db/ensure-seeded";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { dbUnavailableResponse } from "@/lib/api/auth";

export async function withDbHandler<T>(
  handler: () => Promise<T>,
): Promise<NextResponse> {
  if (!isSupabaseConfigured()) return dbUnavailableResponse();

  try {
    await ensureSeeded();
    const data = await handler();
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json(
      dbErrorPayload(err, "Database request failed"),
      { status: 500 },
    );
  }
}
