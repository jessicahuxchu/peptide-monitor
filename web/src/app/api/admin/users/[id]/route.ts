import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api/admin-auth";
import { updatePlatformUser } from "@/lib/db/platform-users";
import { sanitizeRoles, type PlatformRole } from "@/lib/auth/roles";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { dbUnavailableResponse } from "@/lib/api/auth";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  if (!isSupabaseConfigured()) return dbUnavailableResponse();

  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const { id } = await context.params;

  try {
    const body = (await request.json()) as {
      name?: string;
      roles?: PlatformRole[];
      active?: boolean;
    };

    const user = await updatePlatformUser(id, {
      name: body.name,
      roles: body.roles !== undefined ? sanitizeRoles(body.roles) : undefined,
      active: body.active,
    });

    return NextResponse.json(user);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Update failed" },
      { status: 500 },
    );
  }
}
