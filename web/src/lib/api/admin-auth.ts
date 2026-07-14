import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import {
  canConfirmReviewCategory,
  type ReviewCategory,
} from "@/lib/auth/roles";
import {
  getPlatformUserByEmail,
  getRolesForEmail,
  viewerIsAdmin,
} from "@/lib/db/platform-users";

export async function requireAdmin() {
  const user = await currentUser();
  const email = user?.emailAddresses[0]?.emailAddress;
  const isAdmin = await viewerIsAdmin(email);
  if (!isAdmin) {
    return {
      ok: false as const,
      response: NextResponse.json({ error: "Admin permission required" }, { status: 403 }),
    };
  }
  return {
    ok: true as const,
    actor: {
      email: email!.trim().toLowerCase(),
      name: user?.fullName ?? email!,
      userId: user!.id,
    },
  };
}

/**
 * Confirm/reject inbox submission: admin OR role matching review_category.
 */
export async function requireInboxConfirmPermission(
  category: ReviewCategory,
) {
  const user = await currentUser();
  const email = user?.emailAddresses[0]?.emailAddress;
  const roles = await getRolesForEmail(email);
  if (!canConfirmReviewCategory(roles, category, email)) {
    return {
      ok: false as const,
      response: NextResponse.json(
        { error: "Review permission required for this update type" },
        { status: 403 },
      ),
    };
  }
  return {
    ok: true as const,
    actor: user?.fullName ?? email ?? "reviewer",
    email: email?.trim().toLowerCase() ?? null,
    roles,
  };
}

export async function getViewerProfile() {
  const user = await currentUser();
  const email = user?.emailAddresses[0]?.emailAddress ?? null;
  const platformUser = await getPlatformUserByEmail(email);
  const roles = await getRolesForEmail(email);
  const isAdmin = await viewerIsAdmin(email);
  return {
    email,
    name: user?.fullName ?? platformUser?.name ?? email,
    roles,
    isAdmin,
    active: platformUser?.active ?? isAdmin,
  };
}
