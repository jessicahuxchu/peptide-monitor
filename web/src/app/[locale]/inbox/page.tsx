"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { CommandCard } from "@/components/ui/CommandCard";
import { useInboxStore } from "@/hooks/useInboxStore";
import { formatDateTime } from "@/lib/utils";
import { Check, X, Send, Database, Loader2 } from "lucide-react";

export default function InboxPage() {
  const t = useTranslations();
  const locale = useLocale() as "en" | "zh";
  const { submissions, loading, usingDb, error, submit, confirm, reject } =
    useInboxStore();
  const [input, setInput] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    setSubmitting(true);
    try {
      await submit("You", input.trim());
      setInput("");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Submit failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirm = async (id: string) => {
    setBusyId(id);
    try {
      await confirm(id);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Confirm failed");
    } finally {
      setBusyId(null);
    }
  };

  const handleReject = async (id: string) => {
    setBusyId(id);
    try {
      await reject(id);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Reject failed");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="mx-auto max-w-[960px] p-4 md:p-6">
      {!usingDb && (
        <p className="mb-4 rounded-lg border border-command-orange/30 bg-command-orange/5 px-4 py-2 text-xs text-command-orange">
          {t("inboxPage.offlineMode")}
        </p>
      )}
      {usingDb && (
        <p className="mb-4 flex items-center gap-2 text-xs text-command-teal-bright">
          <Database className="h-3.5 w-3.5" />
          {t("inboxPage.dbConnected")}
        </p>
      )}
      {error && (
        <p className="mb-4 text-xs text-command-red">{error}</p>
      )}

      <CommandCard title={t("pages.inbox.title")} subtitle={t("pages.inbox.description")}>
        <form onSubmit={handleSubmit} className="mb-6 flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t("inboxPage.placeholder")}
            disabled={submitting}
            className="flex-1 rounded-lg border border-command-border bg-command-bg px-4 py-2.5 text-sm text-command-text placeholder:text-command-text-muted focus:border-command-teal/50 focus:outline-none disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={submitting}
            className="flex items-center gap-1.5 rounded-lg bg-command-teal px-4 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-command-teal-bright disabled:opacity-50"
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            {t("inboxPage.send")}
          </button>
        </form>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-command-teal" />
          </div>
        ) : (
          <ul className="space-y-4">
            {submissions.map((msg) => (
              <li
                key={msg.id}
                className="rounded-xl border border-command-border bg-command-card-elevated p-4"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-command-teal-bright">
                    {msg.author}
                  </span>
                  <span className="text-[10px] text-command-text-muted">
                    {formatDateTime(msg.createdAt, locale)}
                  </span>
                </div>
                <p className="mt-2 text-sm text-command-text">{msg.content}</p>

                {msg.proposedChanges.length > 0 && (
                  <div className="mt-3 rounded-lg border border-command-border bg-command-bg p-3">
                    <p className="text-[10px] font-medium uppercase tracking-wider text-command-text-muted">
                      {t("inboxPage.proposedUpdates")}
                    </p>
                    <ul className="mt-2 space-y-1">
                      {msg.proposedChanges.map((change) => (
                        <li
                          key={change.summary}
                          className="text-xs text-command-text-secondary"
                        >
                          → {change.summary}
                        </li>
                      ))}
                    </ul>

                    {msg.status === "pending" && (
                      <div className="mt-3 flex gap-2">
                        <button
                          type="button"
                          disabled={busyId === msg.id}
                          onClick={() => handleConfirm(msg.id)}
                          className="inline-flex items-center gap-1 rounded-lg border border-command-green/40 bg-command-green/10 px-3 py-1.5 text-xs font-medium text-command-green disabled:opacity-50"
                        >
                          <Check className="h-3 w-3" />
                          {t("inboxPage.confirm")}
                        </button>
                        <button
                          type="button"
                          disabled={busyId === msg.id}
                          onClick={() => handleReject(msg.id)}
                          className="inline-flex items-center gap-1 rounded-lg border border-command-border px-3 py-1.5 text-xs font-medium text-command-text-secondary disabled:opacity-50"
                        >
                          <X className="h-3 w-3" />
                          {t("inboxPage.reject")}
                        </button>
                      </div>
                    )}

                    {msg.status === "confirmed" && (
                      <p className="mt-2 text-[10px] font-medium uppercase text-command-green">
                        {t("inboxPage.confirmed")}
                      </p>
                    )}
                    {msg.status === "rejected" && (
                      <p className="mt-2 text-[10px] font-medium uppercase text-command-text-muted">
                        {t("inboxPage.rejected")}
                      </p>
                    )}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </CommandCard>
    </div>
  );
}
