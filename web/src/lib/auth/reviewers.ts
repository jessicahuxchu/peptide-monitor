/** Users allowed to confirm/reject inbox submissions. */
export const INBOX_REVIEWER_EMAILS = ["jessica.huxchu@gmail.com"] as const;

export function canReviewInbox(email: string | null | undefined): boolean {
  if (!email) return false;
  const normalized = email.trim().toLowerCase();
  return INBOX_REVIEWER_EMAILS.some((e) => e.toLowerCase() === normalized);
}
