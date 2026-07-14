import { createServiceClient, isSupabaseConfigured } from "@/lib/supabase/client";
import {
  BOOTSTRAP_ADMIN_EMAILS,
  isAdminRoles,
  isBootstrapAdmin,
  normalizeEmail,
  sanitizeRoles,
  type PlatformRole,
} from "@/lib/auth/roles";

export interface PlatformUser {
  id: string;
  email: string;
  name: string;
  roles: PlatformRole[];
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

const DEFAULT_USERS: PlatformUser[] = [
  {
    id: "local-jessica",
    email: "jessica.huxchu@gmail.com",
    name: "Jessica",
    roles: ["admin"],
    active: true,
    createdAt: new Date(0).toISOString(),
    updatedAt: new Date(0).toISOString(),
  },
];

function mapRow(row: {
  id: string;
  email: string;
  name: string;
  roles: unknown;
  active: boolean;
  created_at: string;
  updated_at: string;
}): PlatformUser {
  const roles = sanitizeRoles(row.roles);
  if (isBootstrapAdmin(row.email) && !roles.includes("admin")) {
    roles.push("admin");
  }
  return {
    id: row.id,
    email: row.email.toLowerCase(),
    name: row.name,
    roles,
    active: row.active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function ensureBootstrapAdmin(): Promise<void> {
  if (!isSupabaseConfigured()) return;
  const supabase = createServiceClient();
  for (const email of BOOTSTRAP_ADMIN_EMAILS) {
    const { data } = await supabase
      .from("platform_users")
      .select("id, roles")
      .eq("email", email.toLowerCase())
      .maybeSingle();

    if (!data) {
      await supabase.from("platform_users").insert({
        email: email.toLowerCase(),
        name: "Jessica",
        roles: ["admin"],
        active: true,
      });
      continue;
    }
    const roles = sanitizeRoles(data.roles);
    if (!roles.includes("admin")) {
      await supabase
        .from("platform_users")
        .update({
          roles: [...roles, "admin"],
          active: true,
          updated_at: new Date().toISOString(),
        })
        .eq("id", data.id);
    }
  }
}

export async function listPlatformUsers(opts?: {
  activeOnly?: boolean;
}): Promise<PlatformUser[]> {
  if (!isSupabaseConfigured()) {
    return DEFAULT_USERS.filter((u) => (opts?.activeOnly ? u.active : true));
  }

  try {
    await ensureBootstrapAdmin();
    const supabase = createServiceClient();
    let query = supabase
      .from("platform_users")
      .select("*")
      .order("created_at", { ascending: true });
    if (opts?.activeOnly) query = query.eq("active", true);

    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []).map(mapRow);
  } catch {
    return DEFAULT_USERS.filter((u) => (opts?.activeOnly ? u.active : true));
  }
}

export async function getPlatformUserByEmail(
  email: string | null | undefined,
): Promise<PlatformUser | null> {
  const normalized = normalizeEmail(email);
  if (!normalized) return null;

  if (!isSupabaseConfigured()) {
    return DEFAULT_USERS.find((u) => u.email === normalized) ?? null;
  }

  try {
    await ensureBootstrapAdmin();
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from("platform_users")
      .select("*")
      .eq("email", normalized)
      .maybeSingle();
    if (error) throw error;
    if (!data) {
      if (isBootstrapAdmin(normalized)) {
        return {
          id: "bootstrap",
          email: normalized,
          name: "Jessica",
          roles: ["admin"],
          active: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
      }
      return null;
    }
    return mapRow(data);
  } catch {
    if (isBootstrapAdmin(normalized)) {
      return {
        id: "bootstrap",
        email: normalized,
        name: "Jessica",
        roles: ["admin"],
        active: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }
    return null;
  }
}

export async function getRolesForEmail(
  email: string | null | undefined,
): Promise<PlatformRole[]> {
  const user = await getPlatformUserByEmail(email);
  if (user && user.active) return user.roles;
  if (isBootstrapAdmin(email)) return ["admin"];
  return [];
}

export async function viewerIsAdmin(
  email: string | null | undefined,
): Promise<boolean> {
  const roles = await getRolesForEmail(email);
  return isAdminRoles(roles, email);
}

export interface UpsertPlatformUserInput {
  email: string;
  name: string;
  roles: PlatformRole[];
  active?: boolean;
}

export async function upsertPlatformUser(
  input: UpsertPlatformUserInput,
): Promise<PlatformUser> {
  if (!isSupabaseConfigured()) {
    throw new Error("Database not configured");
  }

  const email = normalizeEmail(input.email);
  if (!email) throw new Error("Email required");
  const name = input.name.trim();
  if (!name) throw new Error("Name required");

  let roles = sanitizeRoles(input.roles);
  if (isBootstrapAdmin(email) && !roles.includes("admin")) {
    roles = [...roles, "admin"];
  }

  const supabase = createServiceClient();
  const { data: existing } = await supabase
    .from("platform_users")
    .select("id")
    .eq("email", email)
    .maybeSingle();

  if (existing) {
    const { data, error } = await supabase
      .from("platform_users")
      .update({
        name,
        roles,
        active: input.active ?? true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id)
      .select("*")
      .single();
    if (error) throw error;
    return mapRow(data);
  }

  const { data, error } = await supabase
    .from("platform_users")
    .insert({
      email,
      name,
      roles,
      active: input.active ?? true,
    })
    .select("*")
    .single();
  if (error) throw error;
  return mapRow(data);
}

export async function updatePlatformUser(
  id: string,
  patch: {
    name?: string;
    roles?: PlatformRole[];
    active?: boolean;
  },
): Promise<PlatformUser> {
  if (!isSupabaseConfigured()) {
    throw new Error("Database not configured");
  }

  const supabase = createServiceClient();
  const { data: current, error: fetchErr } = await supabase
    .from("platform_users")
    .select("*")
    .eq("id", id)
    .single();
  if (fetchErr) throw fetchErr;

  const next: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };
  if (patch.name !== undefined) {
    const name = patch.name.trim();
    if (!name) throw new Error("Name required");
    next.name = name;
  }
  if (patch.roles !== undefined) {
    let roles = sanitizeRoles(patch.roles);
    if (isBootstrapAdmin(current.email) && !roles.includes("admin")) {
      roles = [...roles, "admin"];
    }
    next.roles = roles;
  }
  if (patch.active !== undefined) {
    if (isBootstrapAdmin(current.email) && patch.active === false) {
      throw new Error("Cannot deactivate bootstrap admin");
    }
    next.active = patch.active;
  }

  const { data, error } = await supabase
    .from("platform_users")
    .update(next)
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  return mapRow(data);
}
