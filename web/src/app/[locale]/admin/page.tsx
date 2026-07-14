"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { CommandCard } from "@/components/ui/CommandCard";
import { useViewerProfile } from "@/hooks/useViewerProfile";
import {
  PLATFORM_ROLES,
  type PlatformRole,
} from "@/lib/auth/roles";
import { Loader2, Shield } from "lucide-react";
import { cn } from "@/lib/utils";

interface PlatformUserRow {
  id: string;
  email: string;
  name: string;
  roles: PlatformRole[];
  active: boolean;
}

export default function AdminPage() {
  const t = useTranslations("adminPage");
  const { isAdmin, loading: profileLoading } = useViewerProfile();
  const [users, setUsers] = useState<PlatformUserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newRoles, setNewRoles] = useState<PlatformRole[]>([]);

  async function loadUsers() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/users");
      if (res.status === 403) {
        setError(t("forbidden"));
        setUsers([]);
        return;
      }
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Load failed");
      }
      const data = (await res.json()) as { users: PlatformUserRow[] };
      setUsers(data.users);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Load failed");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (profileLoading) return;
    if (!isAdmin) {
      setLoading(false);
      return;
    }
    void loadUsers();
  }, [isAdmin, profileLoading]);

  function toggleRole(list: PlatformRole[], role: PlatformRole): PlatformRole[] {
    return list.includes(role)
      ? list.filter((r) => r !== role)
      : [...list, role];
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName,
          email: newEmail,
          roles: newRoles,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Create failed");
      }
      setNewName("");
      setNewEmail("");
      setNewRoles([]);
      await loadUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Create failed");
    } finally {
      setSaving(false);
    }
  }

  async function patchUser(
    id: string,
    patch: { roles?: PlatformRole[]; active?: boolean; name?: string },
  ) {
    setError(null);
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Update failed");
      }
      await loadUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed");
    }
  }

  if (profileLoading) {
    return (
      <div className="flex justify-center p-16">
        <Loader2 className="h-6 w-6 animate-spin text-command-teal" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-lg p-6">
        <CommandCard title={t("title")} subtitle={t("forbidden")}>
          <p className="text-sm text-command-text-muted">{t("forbiddenHint")}</p>
        </CommandCard>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4 p-4 md:p-6">
      <CommandCard
        title={t("title")}
        subtitle={t("subtitle")}
        action={
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-command-teal-bright">
            <Shield className="h-3.5 w-3.5" />
            Admin
          </span>
        }
      >
        <p className="mb-4 text-xs text-command-text-secondary">{t("hint")}</p>

        {error && (
          <p className="mb-3 rounded-lg border border-command-red/30 bg-command-red/5 px-3 py-2 text-xs text-command-red">
            {error}
          </p>
        )}

        <form
          onSubmit={handleCreate}
          className="mb-6 space-y-3 rounded-xl border border-command-border bg-command-card-elevated p-4"
        >
          <p className="text-xs font-semibold text-command-text">{t("addUser")}</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block space-y-1 text-[11px]">
              <span className="text-command-text-muted">{t("fieldName")}</span>
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                required
                className="w-full rounded-lg border border-command-border bg-command-bg px-3 py-2 text-sm text-command-text"
              />
            </label>
            <label className="block space-y-1 text-[11px]">
              <span className="text-command-text-muted">{t("fieldEmail")}</span>
              <input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                required
                className="w-full rounded-lg border border-command-border bg-command-bg px-3 py-2 text-sm text-command-text"
              />
            </label>
          </div>
          <div className="flex flex-wrap gap-2">
            {PLATFORM_ROLES.map((role) => (
              <button
                key={role}
                type="button"
                onClick={() => setNewRoles((prev) => toggleRole(prev, role))}
                className={cn(
                  "rounded-full border px-3 py-1 text-[11px] font-medium transition-colors",
                  newRoles.includes(role)
                    ? "border-command-teal/50 bg-command-teal/10 text-command-teal-bright"
                    : "border-command-border text-command-text-muted",
                )}
              >
                {t(`roles.${role}`)}
              </button>
            ))}
          </div>
          <button
            type="submit"
            disabled={saving || !newName.trim() || !newEmail.trim()}
            className="rounded-lg bg-command-teal px-4 py-2 text-sm font-semibold text-black disabled:opacity-50"
          >
            {saving ? t("saving") : t("create")}
          </button>
        </form>

        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-5 w-5 animate-spin text-command-teal" />
          </div>
        ) : users.length === 0 ? (
          <p className="py-6 text-center text-xs text-command-text-muted">
            {t("empty")}
          </p>
        ) : (
          <ul className="space-y-3">
            {users.map((user) => (
              <li
                key={user.id}
                className={cn(
                  "rounded-xl border bg-command-card-elevated p-4",
                  user.active
                    ? "border-command-border"
                    : "border-command-border/60 opacity-60",
                )}
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-command-text">{user.name}</p>
                    <p className="text-xs text-command-text-muted">{user.email}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      void patchUser(user.id, { active: !user.active })
                    }
                    className="rounded border border-command-border px-2 py-1 text-[10px] text-command-text-secondary"
                  >
                    {user.active ? t("deactivate") : t("activate")}
                  </button>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {PLATFORM_ROLES.map((role) => {
                    const on = user.roles.includes(role);
                    return (
                      <button
                        key={role}
                        type="button"
                        onClick={() => {
                          const next = toggleRole(user.roles, role);
                          void patchUser(user.id, { roles: next });
                        }}
                        className={cn(
                          "rounded-full border px-3 py-1 text-[11px] font-medium transition-colors",
                          on
                            ? "border-command-teal/50 bg-command-teal/10 text-command-teal-bright"
                            : "border-command-border text-command-text-muted",
                        )}
                      >
                        {t(`roles.${role}`)}
                      </button>
                    );
                  })}
                </div>
              </li>
            ))}
          </ul>
        )}
      </CommandCard>
    </div>
  );
}
