/** Visibility: unassigned = team-wide; assigned = assignee + creator; admin sees all. */

export interface AlertVisibilityFields {
  assignedToEmail?: string | null;
  createdByEmail?: string | null;
}

export function normalizeEmail(email: string | null | undefined): string | null {
  if (!email?.trim()) return null;
  return email.trim().toLowerCase();
}

export function isAlertVisibleTo(
  alert: AlertVisibilityFields,
  viewerEmail: string | null | undefined,
  opts?: { isAdmin?: boolean },
): boolean {
  if (opts?.isAdmin) return true;

  const assigned = normalizeEmail(alert.assignedToEmail);
  if (!assigned) return true;

  const viewer = normalizeEmail(viewerEmail);
  if (!viewer) return false;

  const creator = normalizeEmail(alert.createdByEmail);
  return assigned === viewer || creator === viewer;
}

export function filterAlertsForViewer<T extends AlertVisibilityFields>(
  alerts: T[],
  viewerEmail: string | null | undefined,
  opts?: { isAdmin?: boolean },
): T[] {
  return alerts.filter((a) => isAlertVisibleTo(a, viewerEmail, opts));
}
