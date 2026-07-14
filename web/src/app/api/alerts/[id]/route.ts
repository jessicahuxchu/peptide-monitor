import { NextResponse } from "next/server";
import { requireSignedInActor } from "@/lib/api/actor";
import { isAlertVisibleTo } from "@/lib/alerts/visibility";
import { fetchAllAlerts, updateAlert } from "@/lib/db/alerts";
import { viewerIsAdmin } from "@/lib/db/platform-users";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { dbUnavailableResponse } from "@/lib/api/auth";
import type { AlertItem } from "@/lib/supply-chain/seed-data";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  if (!isSupabaseConfigured()) return dbUnavailableResponse();

  const auth = await requireSignedInActor();
  if (!auth.ok) return auth.response;

  const { id } = await context.params;
  const isAdmin = await viewerIsAdmin(auth.actor.email);

  try {
    const body = (await request.json()) as {
      status?: AlertItem["status"];
      assignedToEmail?: string | null;
      assignedToName?: string | null;
    };

    const all = await fetchAllAlerts();
    const existing = all.find((a) => a.id === id);
    if (!existing) {
      return NextResponse.json({ error: "Alert not found" }, { status: 404 });
    }
    if (!isAlertVisibleTo(existing, auth.actor.email, { isAdmin })) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (body.status && !["unread", "read", "in_progress", "done", "dismissed"].includes(body.status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const updated = await updateAlert(id, {
      status: body.status,
      assignedToEmail: body.assignedToEmail,
      assignedToName: body.assignedToName,
    });

    if (!isAlertVisibleTo(updated, auth.actor.email, { isAdmin })) {
      return NextResponse.json(
        { alert: updated, removedFromView: true },
        { status: 200 },
      );
    }

    return NextResponse.json(updated);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Update failed" },
      { status: 500 },
    );
  }
}
