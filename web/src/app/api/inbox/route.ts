import { NextRequest, NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { dbUnavailableResponse } from "@/lib/api/auth";
import { ensureSeeded } from "@/lib/db/ensure-seeded";
import {
  createInboxSubmission,
  fetchInboxSubmissions,
} from "@/lib/db/inbox";
import { withDbHandler } from "@/lib/api/with-db";

export async function GET() {
  return withDbHandler(() => fetchInboxSubmissions());
}

export async function POST(request: NextRequest) {
  if (!isSupabaseConfigured()) return dbUnavailableResponse();

  try {
    await ensureSeeded();
    const body = await request.json();
    const author = (body.author as string) || "You";
    const content = body.content as string;
    const intent = typeof body.intent === "string" ? body.intent : undefined;
    if (!content?.trim()) {
      return NextResponse.json({ error: "Content required" }, { status: 400 });
    }
    const submission = await createInboxSubmission(author, content.trim(), {
      intent,
    });
    return NextResponse.json(submission, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to create submission" },
      { status: 500 },
    );
  }
}
