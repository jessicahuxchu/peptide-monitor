import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api/admin-auth";
import {
  listPlatformUsers,
  upsertPlatformUser,
} from "@/lib/db/platform-users";
import {
  PLATFORM_ROLES,
  sanitizeRoles,
  type PlatformRole,
} from "@/lib/auth/roles";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { dbUnavailableResponse } from "@/lib/api/auth";

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  try {
    const users = await listPlatformUsers();
    return NextResponse.json({
      users,
      roles: PLATFORM_ROLES,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to list users" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  if (!isSupabaseConfigured()) return dbUnavailableResponse();

  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  try {
    const body = (await request.json()) as {
      email?: string;
      name?: string;
      roles?: PlatformRole[];
      active?: boolean;
    };

    const email = body.email?.trim() ?? "";
    const name = body.name?.trim() ?? "";
    if (!email || !name) {
      return NextResponse.json(
        { error: "email and name are required" },
        { status: 400 },
      );
    }

    const user = await upsertPlatformUser({
      email,
      name,
      roles: sanitizeRoles(body.roles ?? []),
      active: body.active ?? true,
    });

    return NextResponse.json(user, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Create failed" },
      { status: 500 },
    );
  }
}
