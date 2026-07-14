/** Platform roles. Admin is also a role stored on platform_users. */

export const PLATFORM_ROLES = ["admin", "procurement", "sales", "ops"] as const;
export type PlatformRole = (typeof PLATFORM_ROLES)[number];

/** Inbox structured-update review lane. */
export const REVIEW_CATEGORIES = ["procurement", "sales", "admin"] as const;
export type ReviewCategory = (typeof REVIEW_CATEGORIES)[number];

/** Bootstrap admins — always treated as admin even if DB is empty. */
export const BOOTSTRAP_ADMIN_EMAILS = ["jessica.huxchu@gmail.com"] as const;

export function normalizeEmail(email: string | null | undefined): string | null {
  if (!email?.trim()) return null;
  return email.trim().toLowerCase();
}

export function isBootstrapAdmin(email: string | null | undefined): boolean {
  const normalized = normalizeEmail(email);
  if (!normalized) return false;
  return BOOTSTRAP_ADMIN_EMAILS.some((e) => e.toLowerCase() === normalized);
}

export function isValidPlatformRole(value: string): value is PlatformRole {
  return (PLATFORM_ROLES as readonly string[]).includes(value);
}

export function sanitizeRoles(roles: unknown): PlatformRole[] {
  if (!Array.isArray(roles)) return [];
  const unique = new Set<PlatformRole>();
  for (const r of roles) {
    if (typeof r === "string" && isValidPlatformRole(r)) unique.add(r);
  }
  return [...unique];
}

export function hasRole(
  roles: PlatformRole[] | null | undefined,
  role: PlatformRole,
): boolean {
  return Boolean(roles?.includes(role));
}

export function isAdminRoles(
  roles: PlatformRole[] | null | undefined,
  email?: string | null,
): boolean {
  if (isBootstrapAdmin(email)) return true;
  return hasRole(roles, "admin");
}

/**
 * Confirm/reject ACL for inbox structured updates.
 * Admin always can. Procurement → supplier quotes. Sales → customer inquiries.
 * Category "admin" (regulatory/other) → admin only.
 */
export function canConfirmReviewCategory(
  roles: PlatformRole[] | null | undefined,
  category: ReviewCategory,
  email?: string | null,
): boolean {
  if (isAdminRoles(roles, email)) return true;
  if (category === "procurement") return hasRole(roles, "procurement");
  if (category === "sales") return hasRole(roles, "sales");
  return false;
}

/** Map AI Agent chat intent → review category. */
export function reviewCategoryFromIntent(
  intent: string | null | undefined,
): ReviewCategory {
  if (intent === "quote") return "procurement";
  if (intent === "inquiry") return "sales";
  return "admin";
}

/** Infer category from free text when intent is chat / missing. */
export function inferReviewCategoryFromContent(content: string): ReviewCategory {
  const lower = content.toLowerCase();
  if (
    lower.includes("inquiry") ||
    lower.includes("询盘") ||
    lower.includes("客户") ||
    lower.includes("customer") ||
    lower.includes("clinic") ||
    lower.includes("【客户询盘】")
  ) {
    return "sales";
  }
  if (
    lower.includes("supplier") ||
    lower.includes("quote") ||
    lower.includes("采购") ||
    lower.includes("供应商") ||
    lower.includes("【供应商报价】") ||
    /\$\s*[0-9.]+/.test(content)
  ) {
    return "procurement";
  }
  return "admin";
}

export function resolveReviewCategory(opts: {
  intent?: string | null;
  content?: string;
}): ReviewCategory {
  if (opts.intent && opts.intent !== "chat") {
    return reviewCategoryFromIntent(opts.intent);
  }
  if (opts.content?.trim()) {
    return inferReviewCategoryFromContent(opts.content);
  }
  return "admin";
}
