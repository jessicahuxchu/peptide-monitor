/** Platform team roster for alert assignment — prefers platform_users table. */

import { isSupabaseConfigured } from "@/lib/supabase/client";
import { listPlatformUsers } from "@/lib/db/platform-users";

export interface TeamMember {
  name: string;
  email: string;
}

const DEFAULT_TEAM_MEMBERS: TeamMember[] = [
  { name: "Jessica", email: "jessica.huxchu@gmail.com" },
];

function parseEnvMembers(): TeamMember[] | null {
  const raw = process.env.TEAM_MEMBERS_JSON;
  if (!raw?.trim()) return null;
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return null;
    const members = parsed
      .map((item) => {
        if (!item || typeof item !== "object") return null;
        const row = item as Record<string, unknown>;
        const name = typeof row.name === "string" ? row.name.trim() : "";
        const email = typeof row.email === "string" ? row.email.trim() : "";
        if (!name || !email) return null;
        return { name, email };
      })
      .filter((m): m is TeamMember => Boolean(m));
    return members.length > 0 ? members : null;
  } catch {
    return null;
  }
}

/** Sync fallback when DB unavailable. Prefer getTeamMembersAsync in API routes. */
export function getTeamMembers(): TeamMember[] {
  return parseEnvMembers() ?? DEFAULT_TEAM_MEMBERS;
}

export async function getTeamMembersAsync(): Promise<TeamMember[]> {
  if (isSupabaseConfigured()) {
    try {
      const users = await listPlatformUsers({ activeOnly: true });
      if (users.length > 0) {
        return users.map((u) => ({ name: u.name, email: u.email }));
      }
    } catch {
      // fall through
    }
  }
  return getTeamMembers();
}

export function findTeamMemberByEmail(
  email: string | null | undefined,
): TeamMember | undefined {
  if (!email) return undefined;
  const normalized = email.trim().toLowerCase();
  return getTeamMembers().find((m) => m.email.toLowerCase() === normalized);
}

export function resolveAssignee(
  email: string | null | undefined,
  nameHint?: string | null,
): { email: string | null; name: string | null } {
  if (!email?.trim()) {
    return { email: null, name: null };
  }
  const normalized = email.trim().toLowerCase();
  const known = findTeamMemberByEmail(normalized);
  return {
    email: normalized,
    name: known?.name ?? nameHint?.trim() ?? normalized.split("@")[0] ?? normalized,
  };
}
