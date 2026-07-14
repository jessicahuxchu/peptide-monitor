"use client";

import { useEffect, useMemo, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useLocale, useTranslations } from "next-intl";
import { CommandCard } from "@/components/ui/CommandCard";
import { useDbResource } from "@/hooks/useDbResource";
import { useViewerProfile } from "@/hooks/useViewerProfile";
import { filterAlertsForViewer } from "@/lib/alerts/visibility";
import { alerts as fallbackAlerts, type AlertItem } from "@/lib/supply-chain/seed-data";
import { cn, formatDate } from "@/lib/utils";

const priorityStyle = {
  P0: "border-command-red/40 text-command-red",
  P1: "border-command-orange/40 text-command-orange",
  P2: "border-command-border text-command-text-secondary",
};

type TeamMember = { name: string; email: string };
type FilterTab = "all" | "assigned" | "created";

function alertTitle(alert: AlertItem, t: ReturnType<typeof useTranslations>) {
  if (alert.titleText?.trim()) return alert.titleText;
  return t(alert.titleKey);
}

function alertSummary(alert: AlertItem, t: ReturnType<typeof useTranslations>) {
  if (alert.summaryText?.trim()) return alert.summaryText;
  return t(alert.summaryKey);
}

export default function AlertsPage() {
  const t = useTranslations();
  const locale = useLocale() as "en" | "zh";
  const { user, isSignedIn } = useUser();
  const viewerEmail = user?.primaryEmailAddress?.emailAddress ?? null;
  const { isAdmin } = useViewerProfile();

  const scopedFallback = useMemo(
    () => filterAlertsForViewer(fallbackAlerts, viewerEmail, { isAdmin }),
    [viewerEmail, isAdmin],
  );

  const { data: alerts, usingDb, reload } = useDbResource("/api/alerts", scopedFallback);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [filter, setFilter] = useState<FilterTab>("all");
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [priority, setPriority] = useState<AlertItem["priority"]>("P2");
  const [assigneeEmail, setAssigneeEmail] = useState("");
  const [actionDraft, setActionDraft] = useState("");

  useEffect(() => {
    void reload();
  }, [viewerEmail, reload]);

  useEffect(() => {
    void fetch("/api/team")
      .then((r) => r.json())
      .then((json: { members?: TeamMember[] }) => setMembers(json.members ?? []))
      .catch(() => setMembers([]));
  }, []);

  const sorted = useMemo(() => {
    const priorityOrder = { P0: 0, P1: 1, P2: 2 };
    let list = [...alerts];
    const email = viewerEmail?.toLowerCase() ?? "";
    if (filter === "assigned" && email) {
      list = list.filter((a) => a.assignedToEmail?.toLowerCase() === email);
    } else if (filter === "created" && email) {
      list = list.filter((a) => a.createdByEmail?.toLowerCase() === email);
    }
    return list.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
  }, [alerts, filter, viewerEmail]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!isSignedIn) {
      setError(t("alertsPage.signInRequired"));
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const selected = members.find((m) => m.email === assigneeEmail);
      const res = await fetch("/api/alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          summary,
          priority,
          assignedToEmail: assigneeEmail || null,
          assignedToName: selected?.name ?? null,
          suggestedActions: actionDraft
            .split("\n")
            .map((s) => s.trim())
            .filter(Boolean),
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Create failed");
      }
      setTitle("");
      setSummary("");
      setPriority("P2");
      setAssigneeEmail("");
      setActionDraft("");
      setShowForm(false);
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Create failed");
    } finally {
      setSaving(false);
    }
  }

  async function patchAlert(
    id: string,
    body: { status?: AlertItem["status"]; assignedToEmail?: string | null; assignedToName?: string | null },
  ) {
    setError(null);
    try {
      const res = await fetch(`/api/alerts/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error ?? "Update failed");
      }
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed");
    }
  }

  return (
    <div className="mx-auto max-w-[960px] space-y-4 p-4 md:p-6">
      <CommandCard
        title={t("pages.alerts.title")}
        subtitle={t("pages.alerts.description")}
        action={
          <button
            type="button"
            onClick={() => setShowForm((v) => !v)}
            className="rounded-lg border border-command-teal/40 px-3 py-1.5 text-xs font-semibold text-command-teal-bright transition-colors hover:bg-command-teal/10"
          >
            {showForm ? t("alertsPage.cancel") : t("alertsPage.create")}
          </button>
        }
      >
        <div className="mb-4 flex flex-wrap items-center gap-2">
          {(
            [
              ["all", t("alertsPage.filterAll")],
              ["assigned", t("alertsPage.filterAssigned")],
              ["created", t("alertsPage.filterCreated")],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setFilter(key)}
              className={cn(
                "rounded-full border px-3 py-1 text-[11px] font-medium transition-colors",
                filter === key
                  ? "border-command-teal/50 bg-command-teal/10 text-command-teal-bright"
                  : "border-command-border text-command-text-secondary hover:text-command-text",
              )}
            >
              {label}
            </button>
          ))}
          {!usingDb && (
            <span className="text-[10px] text-command-text-muted">{t("alertsPage.offlineHint")}</span>
          )}
        </div>

        {showForm && (
          <form
            onSubmit={handleCreate}
            className="mb-5 space-y-3 rounded-xl border border-command-border bg-command-bg/40 p-4"
          >
            <p className="text-xs text-command-text-muted">{t("alertsPage.createHint")}</p>
            <div className="grid gap-3 md:grid-cols-2">
              <label className="block text-xs">
                <span className="text-command-text-muted">{t("alertsPage.fieldTitle")}</span>
                <input
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-command-border bg-command-card px-3 py-2 text-sm text-command-text outline-none focus:border-command-teal/50"
                />
              </label>
              <label className="block text-xs">
                <span className="text-command-text-muted">{t("alertsPage.fieldPriority")}</span>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as AlertItem["priority"])}
                  className="mt-1 w-full rounded-lg border border-command-border bg-command-card px-3 py-2 text-sm text-command-text outline-none focus:border-command-teal/50"
                >
                  <option value="P0">P0</option>
                  <option value="P1">P1</option>
                  <option value="P2">P2</option>
                </select>
              </label>
            </div>
            <label className="block text-xs">
              <span className="text-command-text-muted">{t("alertsPage.fieldSummary")}</span>
              <textarea
                required
                rows={3}
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                className="mt-1 w-full rounded-lg border border-command-border bg-command-card px-3 py-2 text-sm text-command-text outline-none focus:border-command-teal/50"
              />
            </label>
            <label className="block text-xs">
              <span className="text-command-text-muted">{t("alertsPage.fieldAssignee")}</span>
              <select
                value={assigneeEmail}
                onChange={(e) => setAssigneeEmail(e.target.value)}
                className="mt-1 w-full rounded-lg border border-command-border bg-command-card px-3 py-2 text-sm text-command-text outline-none focus:border-command-teal/50"
              >
                <option value="">{t("alertsPage.assigneeEveryone")}</option>
                {members.map((m) => (
                  <option key={m.email} value={m.email}>
                    {m.name} ({m.email})
                  </option>
                ))}
              </select>
              <span className="mt-1 block text-[10px] text-command-text-muted">
                {t("alertsPage.assigneeHint")}
              </span>
            </label>
            <label className="block text-xs">
              <span className="text-command-text-muted">{t("alertsPage.fieldActions")}</span>
              <textarea
                rows={2}
                value={actionDraft}
                onChange={(e) => setActionDraft(e.target.value)}
                placeholder={t("alertsPage.actionsPlaceholder")}
                className="mt-1 w-full rounded-lg border border-command-border bg-command-card px-3 py-2 text-sm text-command-text outline-none focus:border-command-teal/50"
              />
            </label>
            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-command-teal/20 px-4 py-2 text-xs font-semibold text-command-teal-bright transition-colors hover:bg-command-teal/30 disabled:opacity-50"
              >
                {saving ? t("alertsPage.saving") : t("alertsPage.submit")}
              </button>
              {!isSignedIn && (
                <span className="text-[11px] text-command-orange">{t("alertsPage.signInRequired")}</span>
              )}
            </div>
          </form>
        )}

        {error && (
          <p className="mb-3 text-xs text-command-red">{error}</p>
        )}

        <ul className="space-y-4">
          {sorted.length === 0 && (
            <li className="rounded-xl border border-dashed border-command-border p-6 text-center text-sm text-command-text-muted">
              {t("alertsPage.empty")}
            </li>
          )}
          {sorted.map((alert) => (
            <li
              key={alert.id}
              className={cn(
                "rounded-xl border bg-command-card-elevated p-4",
                alert.status === "unread" && "border-command-teal/30",
              )}
            >
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={cn(
                    "rounded border px-1.5 py-0.5 text-[10px] font-bold",
                    priorityStyle[alert.priority],
                  )}
                >
                  {alert.priority}
                </span>
                <span className="text-[10px] uppercase text-command-text-muted">
                  {t(`alertSource.${alert.source}`)}
                </span>
                <span className="text-[10px] text-command-text-muted">
                  {formatDate(alert.createdAt, locale)}
                </span>
                {alert.assignedToName || alert.assignedToEmail ? (
                  <span className="rounded bg-command-teal/10 px-1.5 py-0.5 text-[10px] text-command-teal-bright">
                    {t("alertsPage.assignedTo", {
                      name: alert.assignedToName ?? alert.assignedToEmail ?? "",
                    })}
                  </span>
                ) : (
                  <span className="rounded bg-command-card px-1.5 py-0.5 text-[10px] text-command-text-muted">
                    {t("alertsPage.teamWide")}
                  </span>
                )}
                {alert.createdByName && (
                  <span className="text-[10px] text-command-text-muted">
                    {t("alertsPage.createdBy", { name: alert.createdByName })}
                  </span>
                )}
                {alert.status === "unread" && (
                  <span className="ml-auto h-2 w-2 rounded-full bg-command-teal animate-pulse-dot" />
                )}
              </div>

              <h3 className="mt-2 font-semibold">{alertTitle(alert, t)}</h3>
              <p className="mt-1 text-sm text-command-text-secondary">
                {alertSummary(alert, t)}
              </p>

              {alert.suggestedActions.length > 0 && (
                <div className="mt-3">
                  <p className="text-[10px] font-medium uppercase tracking-wider text-command-text-muted">
                    {t("alertsPage.suggestedActions")}
                  </p>
                  <ul className="mt-1 space-y-1">
                    {alert.suggestedActions.map((action) => (
                      <li
                        key={action}
                        className="flex items-center gap-2 text-xs text-command-text-secondary"
                      >
                        <span className="h-1 w-1 rounded-full bg-command-teal" />
                        {action}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="mt-3 flex flex-wrap gap-2">
                {alert.status === "unread" && (
                  <button
                    type="button"
                    onClick={() => void patchAlert(alert.id, { status: "read" })}
                    className="rounded border border-command-border px-2 py-1 text-[10px] text-command-text-secondary hover:border-command-teal/40 hover:text-command-text"
                  >
                    {t("alertsPage.markRead")}
                  </button>
                )}
                {alert.status !== "in_progress" && alert.status !== "done" && (
                  <button
                    type="button"
                    onClick={() => void patchAlert(alert.id, { status: "in_progress" })}
                    className="rounded border border-command-border px-2 py-1 text-[10px] text-command-text-secondary hover:border-command-teal/40 hover:text-command-text"
                  >
                    {t("alertsPage.markInProgress")}
                  </button>
                )}
                {alert.status !== "done" && (
                  <button
                    type="button"
                    onClick={() => void patchAlert(alert.id, { status: "done" })}
                    className="rounded border border-command-border px-2 py-1 text-[10px] text-command-text-secondary hover:border-command-teal/40 hover:text-command-text"
                  >
                    {t("alertsPage.markDone")}
                  </button>
                )}
                {isSignedIn && members.length > 0 && (
                  <select
                    aria-label={t("alertsPage.reassign")}
                    defaultValue=""
                    onChange={(e) => {
                      const value = e.target.value;
                      if (!value) return;
                      const member = members.find((m) => m.email === value);
                      void patchAlert(alert.id, {
                        assignedToEmail: value === "__everyone__" ? null : value,
                        assignedToName: value === "__everyone__" ? null : member?.name ?? null,
                      });
                      e.target.value = "";
                    }}
                    className="rounded border border-command-border bg-command-card px-2 py-1 text-[10px] text-command-text-secondary outline-none"
                  >
                    <option value="">{t("alertsPage.reassign")}</option>
                    <option value="__everyone__">{t("alertsPage.assigneeEveryone")}</option>
                    {members.map((m) => (
                      <option key={m.email} value={m.email}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </li>
          ))}
        </ul>
      </CommandCard>
    </div>
  );
}
