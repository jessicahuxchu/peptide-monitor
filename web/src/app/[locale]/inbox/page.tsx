"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { CommandCard } from "@/components/ui/CommandCard";
import { useInboxStore } from "@/hooks/useInboxStore";
import { formatDateTime } from "@/lib/utils";
import type { ChatMessage } from "@/lib/agent/chat-responder";
import { Bot, Check, Loader2, Send, User, X } from "lucide-react";
import { cn } from "@/lib/utils";

export default function InboxPage() {
  const t = useTranslations();
  const locale = useLocale() as "en" | "zh";
  const { submissions, loading, usingDb, error, submit, confirm, reject } =
    useInboxStore();

  const [inboxInput, setInboxInput] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatMessages.length === 0) {
      setChatMessages([
        {
          role: "assistant",
          content: t("inboxPage.chatWelcome"),
        },
      ]);
    }
  }, [chatMessages.length, t]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, chatLoading]);

  const pendingSubmissions = submissions.filter((s) => s.status === "pending");

  const handleInboxSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inboxInput.trim()) return;
    setSubmitting(true);
    try {
      await submit("You", inboxInput.trim());
      setInboxInput("");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Submit failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || chatLoading) return;

    const userMsg: ChatMessage = { role: "user", content: chatInput.trim() };
    const nextMessages = [...chatMessages, userMsg];
    setChatMessages(nextMessages);
    setChatInput("");
    setChatLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextMessages, locale }),
      });
      if (!res.ok) throw new Error("Chat failed");
      const data = (await res.json()) as { reply: string };
      setChatMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
    } catch {
      setChatMessages((prev) => [
        ...prev,
        { role: "assistant", content: t("inboxPage.chatError") },
      ]);
    } finally {
      setChatLoading(false);
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
    <div className="mx-auto max-w-6xl p-4 md:p-6">
      {!usingDb && (
        <p className="mb-4 rounded-lg border border-command-orange/30 bg-command-orange/5 px-4 py-2 text-xs text-command-orange">
          {t("inboxPage.offlineMode")}
        </p>
      )}
      {error && <p className="mb-4 text-xs text-command-red">{error}</p>}

      <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
        {/* Simplified inbox */}
        <CommandCard title={t("inboxPage.pendingTitle")} subtitle={t("inboxPage.pendingSubtitle")}>
          <form onSubmit={handleInboxSubmit} className="mb-4 flex gap-2">
            <input
              type="text"
              value={inboxInput}
              onChange={(e) => setInboxInput(e.target.value)}
              placeholder={t("inboxPage.placeholder")}
              disabled={submitting}
              className="flex-1 rounded-lg border border-command-border bg-command-bg px-3 py-2 text-xs text-command-text placeholder:text-command-text-muted focus:border-command-teal/50 focus:outline-none disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-command-teal px-3 py-2 text-command-bg transition-colors hover:bg-command-teal-bright disabled:opacity-50"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </button>
          </form>

          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-command-teal" />
            </div>
          ) : pendingSubmissions.length === 0 ? (
            <p className="py-6 text-center text-xs text-command-text-muted">
              {t("inboxPage.noPending")}
            </p>
          ) : (
            <ul className="max-h-[420px] space-y-2 overflow-y-auto">
              {pendingSubmissions.map((msg) => (
                <li
                  key={msg.id}
                  className="rounded-lg border border-command-border bg-command-card-elevated p-3"
                >
                  <p className="line-clamp-2 text-xs text-command-text">{msg.content}</p>
                  <p className="mt-1 text-[10px] text-command-text-muted">
                    {formatDateTime(msg.createdAt, locale)}
                  </p>
                  {msg.proposedChanges.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {msg.proposedChanges.slice(0, 2).map((change) => (
                        <p key={change.summary} className="text-[10px] text-command-text-secondary">
                          → {change.summary}
                        </p>
                      ))}
                    </div>
                  )}
                  <div className="mt-2 flex gap-1.5">
                    <button
                      type="button"
                      disabled={busyId === msg.id}
                      onClick={() => handleConfirm(msg.id)}
                      className="inline-flex items-center gap-1 rounded border border-command-green/40 bg-command-green/10 px-2 py-1 text-[10px] font-medium text-command-green disabled:opacity-50"
                    >
                      <Check className="h-3 w-3" />
                      {t("inboxPage.confirm")}
                    </button>
                    <button
                      type="button"
                      disabled={busyId === msg.id}
                      onClick={() => handleReject(msg.id)}
                      className="inline-flex items-center gap-1 rounded border border-command-border px-2 py-1 text-[10px] font-medium text-command-text-secondary disabled:opacity-50"
                    >
                      <X className="h-3 w-3" />
                      {t("inboxPage.reject")}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CommandCard>

        {/* AI chat */}
        <CommandCard title={t("inboxPage.chatTitle")} subtitle={t("inboxPage.chatSubtitle")}>
          <div className="flex h-[480px] flex-col">
            <div className="flex-1 space-y-3 overflow-y-auto rounded-lg border border-command-border bg-[#050505] p-4">
              {chatMessages.map((msg, i) => (
                <div
                  key={`${msg.role}-${i}`}
                  className={cn(
                    "flex gap-2",
                    msg.role === "user" ? "justify-end" : "justify-start",
                  )}
                >
                  {msg.role === "assistant" && (
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-command-teal/20">
                      <Bot className="h-3.5 w-3.5 text-command-teal-bright" />
                    </div>
                  )}
                  <div
                    className={cn(
                      "max-w-[85%] rounded-xl px-3 py-2 text-sm whitespace-pre-wrap",
                      msg.role === "user"
                        ? "bg-command-teal/20 text-command-text"
                        : "bg-command-card-elevated text-command-text-secondary",
                    )}
                  >
                    {msg.content}
                  </div>
                  {msg.role === "user" && (
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-command-border">
                      <User className="h-3.5 w-3.5 text-command-text-muted" />
                    </div>
                  )}
                </div>
              ))}
              {chatLoading && (
                <div className="flex items-center gap-2 text-xs text-command-text-muted">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  {t("inboxPage.analyzing")}
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            <form onSubmit={handleChatSubmit} className="mt-3 flex gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder={t("inboxPage.chatPlaceholder")}
                disabled={chatLoading}
                className="flex-1 rounded-lg border border-command-border bg-command-bg px-4 py-2.5 text-sm text-command-text placeholder:text-command-text-muted focus:border-command-teal/50 focus:outline-none disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={chatLoading || !chatInput.trim()}
                className="flex items-center gap-1.5 rounded-lg bg-command-teal px-4 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-command-teal-bright disabled:opacity-50"
              >
                <Send className="h-4 w-4" />
                {t("inboxPage.send")}
              </button>
            </form>
          </div>
        </CommandCard>
      </div>
    </div>
  );
}
