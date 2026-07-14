import { NextRequest, NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { dbUnavailableResponse } from "@/lib/api/auth";
import { requireInboxConfirmPermission } from "@/lib/api/admin-auth";
import {
  confirmSubmission,
  fetchInboxSubmissionById,
} from "@/lib/db/inbox";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!isSupabaseConfigured()) return dbUnavailableResponse();

  try {
    const { id } = await params;
    const submission = await fetchInboxSubmissionById(id);
    if (!submission) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const auth = await requireInboxConfirmPermission(submission.reviewCategory);
    if (!auth.ok) return auth.response;

    const result = await confirmSubmission(id, auth.actor);
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Confirm failed" },
      { status: 500 },
    );
  }
}
