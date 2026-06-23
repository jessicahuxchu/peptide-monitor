import { NextRequest, NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { dbUnavailableResponse } from "@/lib/api/auth";
import { requireInboxReviewer } from "@/lib/api/inbox-auth";
import { confirmSubmission } from "@/lib/db/inbox";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!isSupabaseConfigured()) return dbUnavailableResponse();

  const auth = await requireInboxReviewer();
  if (!auth.ok) return auth.response;

  try {
    const { id } = await params;
    const result = await confirmSubmission(id, auth.actor);
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Confirm failed" },
      { status: 500 },
    );
  }
}
