import { NextResponse } from "next/server";
import { getViewerProfile } from "@/lib/api/admin-auth";

/** Current viewer's platform roles (for UI gating). */
export async function GET() {
  try {
    const profile = await getViewerProfile();
    return NextResponse.json(profile);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed" },
      { status: 500 },
    );
  }
}
