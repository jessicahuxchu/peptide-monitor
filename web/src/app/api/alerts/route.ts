import { NextResponse } from "next/server";
import { withDbHandler } from "@/lib/api/with-db";
import { getOptionalViewerEmail, requireSignedInActor } from "@/lib/api/actor";
import { createManualAlert, fetchAlertsForViewer } from "@/lib/db/alerts";
import { viewerIsAdmin } from "@/lib/db/platform-users";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { dbUnavailableResponse } from "@/lib/api/auth";
import type { AlertItem } from "@/lib/supply-chain/seed-data";

export async function GET() {
  const viewerEmail = await getOptionalViewerEmail();
  const isAdmin = await viewerIsAdmin(viewerEmail);
  return withDbHandler(() =>
    fetchAlertsForViewer(viewerEmail, { isAdmin }),
  );
}

export async function POST(request: Request) {
  if (!isSupabaseConfigured()) return dbUnavailableResponse();

  const auth = await requireSignedInActor();
  if (!auth.ok) return auth.response;

  try {
    const body = (await request.json()) as {
      priority?: AlertItem["priority"];
      title?: string;
      summary?: string;
      suggestedActions?: string[];
      assignedToEmail?: string | null;
      assignedToName?: string | null;
    };

    const title = body.title?.trim() ?? "";
    const summary = body.summary?.trim() ?? "";
    const priority = body.priority ?? "P2";

    if (!title || !summary) {
      return NextResponse.json(
        { error: "title and summary are required" },
        { status: 400 },
      );
    }
    if (!["P0", "P1", "P2"].includes(priority)) {
      return NextResponse.json({ error: "Invalid priority" }, { status: 400 });
    }

    const alert = await createManualAlert({
      priority,
      title,
      summary,
      suggestedActions: body.suggestedActions,
      assignedToEmail: body.assignedToEmail,
      assignedToName: body.assignedToName,
      createdByEmail: auth.actor.email,
      createdByName: auth.actor.name,
    });

    return NextResponse.json(alert, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Create failed" },
      { status: 500 },
    );
  }
}
