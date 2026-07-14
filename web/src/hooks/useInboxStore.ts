"use client";

import { useCallback, useEffect, useState } from "react";
import type { ProposedChange } from "@/lib/agent/inbox-parser";
import type { ReviewCategory } from "@/lib/auth/roles";
import { inboxMessages } from "@/lib/supply-chain/seed-data";

export interface InboxSubmissionView {
  id: string;
  author: string;
  content: string;
  status: "pending" | "confirmed" | "rejected";
  proposedChanges: ProposedChange[];
  reviewCategory: ReviewCategory;
  createdAt: string;
  committedAt?: string;
}

function seedToView(): InboxSubmissionView[] {
  return inboxMessages.map((m) => ({
    id: m.id,
    author: m.author,
    content: m.content,
    status: m.status,
    proposedChanges: (m.proposedUpdates ?? []).map((summary) => ({
      action: "create_alert" as const,
      payload: {},
      summary,
    })),
    reviewCategory: "admin" as ReviewCategory,
    createdAt: m.timestamp,
  }));
}

export function useInboxStore() {
  const [submissions, setSubmissions] = useState<InboxSubmissionView[]>([]);
  const [loading, setLoading] = useState(true);
  const [usingDb, setUsingDb] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/inbox");
      if (res.status === 503) {
        setUsingDb(false);
        setSubmissions(seedToView());
        setError(null);
        return;
      }
      if (!res.ok) throw new Error("Failed to load inbox");
      const data = (await res.json()) as InboxSubmissionView[];
      setSubmissions(
        data.map((row) => ({
          ...row,
          reviewCategory: row.reviewCategory ?? "admin",
        })),
      );
      setUsingDb(true);
      setError(null);
    } catch (e) {
      setUsingDb(false);
      setSubmissions(seedToView());
      setError(e instanceof Error ? e.message : "Load failed");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const submit = useCallback(
    async (author: string, content: string) => {
      if (!usingDb) {
        setSubmissions((prev) => [
          {
            id: `local-${Date.now()}`,
            author,
            content,
            status: "pending",
            proposedChanges: [],
            reviewCategory: "admin",
            createdAt: new Date().toISOString(),
          },
          ...prev,
        ]);
        return;
      }
      const res = await fetch("/api/inbox", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ author, content }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Submit failed");
      }
      await load();
    },
    [usingDb, load],
  );

  const confirm = useCallback(
    async (id: string) => {
      if (!usingDb) {
        setSubmissions((prev) =>
          prev.map((s) =>
            s.id === id ? { ...s, status: "confirmed" as const } : s,
          ),
        );
        return;
      }
      const res = await fetch(`/api/inbox/${id}/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ actor: "user" }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Confirm failed");
      }
      await load();
    },
    [usingDb, load],
  );

  const reject = useCallback(
    async (id: string) => {
      if (!usingDb) {
        setSubmissions((prev) =>
          prev.map((s) =>
            s.id === id ? { ...s, status: "rejected" as const } : s,
          ),
        );
        return;
      }
      const res = await fetch(`/api/inbox/${id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ actor: "user" }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Reject failed");
      }
      await load();
    },
    [usingDb, load],
  );

  return {
    submissions,
    loading,
    usingDb,
    error,
    submit,
    confirm,
    reject,
    reload: load,
  };
}
