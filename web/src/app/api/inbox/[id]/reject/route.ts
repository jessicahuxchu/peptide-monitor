import { NextRequest, NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { dbUnavailableResponse } from "@/lib/api/auth";
import { rejectSubmission } from "@/lib/db/inbox";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!isSupabaseConfigured()) return dbUnavailableResponse();

  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const actor = (body.actor as string) || "user";
    await rejectSubmission(id, actor);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Reject failed" },
      { status: 500 },
    );
  }
}
