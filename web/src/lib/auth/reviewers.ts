/**
 * @deprecated Prefer `@/lib/auth/roles` + platform_users.
 * Kept for any lingering imports; Jessica remains bootstrap admin.
 */
import {
  BOOTSTRAP_ADMIN_EMAILS,
  canConfirmReviewCategory,
  isBootstrapAdmin,
  type ReviewCategory,
} from "@/lib/auth/roles";

export const INBOX_REVIEWER_EMAILS = BOOTSTRAP_ADMIN_EMAILS;

/** Admin / bootstrap-only check (does not cover sales/procurement role confirmers). */
export function canReviewInbox(email: string | null | undefined): boolean {
  return isBootstrapAdmin(email);
}

export function canReviewCategory(
  email: string | null | undefined,
  category: ReviewCategory,
  roles: import("@/lib/auth/roles").PlatformRole[] = [],
): boolean {
  return canConfirmReviewCategory(roles, category, email);
}
