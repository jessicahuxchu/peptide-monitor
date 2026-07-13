"use client";

import { useEffect, useRef, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useLocale, useTranslations } from "next-intl";
import { ChatMarkdown } from "@/components/chat/ChatMarkdown";
import { CommandCard } from "@/components/ui/CommandCard";
import { useInboxStore } from "@/hooks/useInboxStore";
import { canReviewInbox } from "@/lib/auth/reviewers";
import { formatDateTime } from "@/lib/utils";
import type { ChatMessage } from "@/lib/agent/chat-responder";
import type { ChatIntent } from "@/lib/agent/hermes-client";
import {
  Bot,
  Check,
  FileText,
  Loader2,
  Paperclip,
  Send,
  User,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

const PROMPT_INTENTS: { intent: ChatIntent; key: string }[] = [
  { intent: "quote", key: "promptQuote" },
  { intent: "inquiry", key: "promptInquiry" },
  { intent: "regulatory", key: "promptRegulatory" },
];

export default function InboxPage() {
  const t = useTranslations();
  const locale = useLocale() as "en" | "zh";
  const { user } = useUser();
  const userEmail = user?.primaryEmailAddress?.emailAddress;
  const canReview = canReviewInbox(userEmail);

  const { submissions, loading, usingDb, error, confirm, reject, reload, submit } =
    useInboxStore();

  const [busyId, setBusyId] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatIntent, setChatIntent] = useState<ChatIntent>("chat");
  const [attachmentName, setAttachmentName] = useState<string | null>(null);
  const [attachmentText, setAttachmentText] = useState<string | null>(null);
  const [chatLoading, setChatLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatMessages.length === 0) {
      setChatMessages([
        { role: "assistant", content: t("inboxPage.chatWelcome") },
      ]);
    }
  }, [chatMessages.length, t]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, chatLoading]);

  const pendingSubmissions = submissions.filter((s) => s.status === "pending");

  const handleFile = async (file: File | null) => {
    if (!file) {
      setAttachmentName(null);
      setAttachmentText(null);
      return;
    }
    const text = await file.text().catch(() => null);
    if (!text) {
      setAttachmentName(file.name);
      setAttachmentText(`[附件: ${file.name} — 无法解析为文本，请粘贴主要内容到对话框]`);
      return;
    }
    setAttachmentName(file.name);
    setAttachmentText(text.slice(0, 12000));
  };

  const applyPrompt = (intent: ChatIntent, key: string) => {
    setChatIntent(intent);
    setChatInput(t(`inboxPage.${key}`));
  };

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || chatLoading) return;

    const userMsg: ChatMessage = { role: "user", content: chatInput.trim() };
    const nextMessages = [...chatMessages, userMsg];
    setChatMessages(nextMessages);
    const intent = chatIntent;
    setChatInput("");
    setChatIntent("chat");
    setChatLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: nextMessages,
          locale,
          intent,
          attachmentText: attachmentText ?? undefined,
        }),
      });
      if (!res.ok) throw new Error("Chat failed");
      const data = (await res.json()) as {
        reply: string;
        inboxQueued?: boolean;
        knowledgeSources?: { filePath: string }[];
      };
      let reply = data.reply;
      if (data.knowledgeSources?.length) {
        const paths = data.knowledgeSources.map((s) => s.filePath).join(", ");
        reply += `\n\n---\n${t("inboxPage.knowledgeSources", { paths })}`;
      }
      if (data.inboxQueued) {
        reply += `\n\n${t("inboxPage.inboxQueued")}`;
        await reload();
      } else if (intent !== "chat" && !usingDb) {
        const payload = attachmentText
          ? `${userMsg.content}\n\n--- 附件 ---\n${attachmentText}`
          : userMsg.content;
        await submit(user?.fullName ?? userEmail ?? "User", payload);
        reply += `\n\n${t("inboxPage.inboxQueued")}`;
      }
      setChatMessages((prev) => [...prev, { role: "assistant", content: reply }]);
      setAttachmentName(null);
      setAttachmentText(null);
      if (fileRef.current) fileRef.current.value = "";
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
    <div className="mx-auto flex min-h-[calc(100dvh-7rem)] max-w-6xl flex-col p-4 md:min-h-[calc(100dvh-3.5rem)] md:p-6">
      {!usingDb && (
        <p className="mb-4 rounded-lg border border-command-orange/30 bg-command-orange/5 px-4 py-2 text-xs text-command-orange">
          {t("inboxPage.offlineMode")}
        </p>
      )}
      {error && <p className="mb-4 text-xs text-command-red">{error}</p>}

      <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[minmax(240px,300px)_minmax(0,1fr)] lg:items-stretch">
        <CommandCard
          title={t("inboxPage.pendingTitle")}
          subtitle={t("inboxPage.pendingSubtitle")}
          className="flex max-h-[36vh] flex-col lg:max-h-none lg:min-h-0"
        >
          {!canReview && (
            <p className="mb-3 rounded-lg border border-command-border bg-command-card-elevated px-3 py-2 text-[10px] text-command-text-muted">
              {t("inboxPage.reviewRestricted")}
            </p>
          )}
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-command-teal" />
            </div>
          ) : pendingSubmissions.length === 0 ? (
            <p className="py-6 text-center text-xs text-command-text-muted">
              {t("inboxPage.noPending")}
            </p>
          ) : (
            <ul className="min-h-0 flex-1 space-y-2 overflow-y-auto">
              {pendingSubmissions.map((msg) => (
                <li
                  key={msg.id}
                  className="rounded-lg border border-command-border bg-command-card-elevated p-3"
                >
                  <p className="line-clamp-3 text-xs text-command-text">{msg.content}</p>
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
                  {canReview && (
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
                  )}
                </li>
              ))}
            </ul>
          )}
        </CommandCard>

        <CommandCard
          title={t("inboxPage.chatTitle")}
          subtitle={t("inboxPage.chatSubtitle")}
          className="flex min-h-[min(60vh,480px)] flex-1 flex-col lg:min-h-0"
        >
          <div className="mb-3 flex flex-wrap gap-2">
            {PROMPT_INTENTS.map(({ intent, key }) => (
              <button
                key={intent}
                type="button"
                onClick={() => applyPrompt(intent, key)}
                className={cn(
                  "rounded-full border px-3 py-1 text-[11px] font-medium transition-colors",
                  chatIntent === intent
                    ? "border-command-teal/40 bg-command-teal/10 text-command-teal-bright"
                    : "border-command-border text-command-text-muted hover:text-command-text-secondary",
                )}
              >
                {t(`inboxPage.${key}Label`)}
              </button>
            ))}
          </div>

          <div className="flex min-h-0 flex-1 flex-col">
            <div className="min-h-0 flex-1 space-y-3 overflow-y-auto rounded-lg border border-command-border bg-[#050505] p-4">
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
                      "max-w-[85%] rounded-xl px-3 py-2 text-sm",
                      msg.role === "user"
                        ? "whitespace-pre-wrap bg-command-teal/20 text-command-text"
                        : "bg-command-card-elevated text-command-text-secondary",
                    )}
                  >
                    {msg.role === "assistant" ? (
                      <ChatMarkdown content={msg.content} />
                    ) : (
                      msg.content
                    )}
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

            {attachmentName && (
              <div className="mt-2 flex items-center gap-2 rounded-lg border border-command-border bg-command-card-elevated px-3 py-2 text-xs text-command-text-secondary">
                <FileText className="h-3.5 w-3.5 text-command-teal-bright" />
                {attachmentName}
                <button
                  type="button"
                  onClick={() => handleFile(null)}
                  className="ml-auto text-command-text-muted hover:text-command-text"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            )}

            <form onSubmit={handleChatSubmit} className="mt-3 space-y-2">
              <textarea
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder={t("inboxPage.chatPlaceholder")}
                disabled={chatLoading}
                rows={3}
                className="w-full resize-none rounded-lg border border-command-border bg-command-bg px-4 py-2.5 text-sm text-command-text placeholder:text-command-text-muted focus:border-command-teal/50 focus:outline-none disabled:opacity-50"
              />
              <div className="flex items-center gap-2">
                <input
                  ref={fileRef}
                  type="file"
                  accept=".txt,.md,.csv,.json,.pdf"
                  className="hidden"
                  onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
                />
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-command-border px-3 py-2 text-xs text-command-text-muted hover:text-command-text-secondary"
                >
                  <Paperclip className="h-3.5 w-3.5" />
                  {t("inboxPage.attachFile")}
                </button>
                <button
                  type="submit"
                  disabled={chatLoading || !chatInput.trim()}
                  className="ml-auto flex items-center gap-1.5 rounded-lg bg-command-teal px-4 py-2 text-sm font-semibold text-black transition-colors hover:bg-command-teal-bright disabled:opacity-50"
                >
                  <Send className="h-4 w-4" />
                  {t("inboxPage.send")}
                </button>
              </div>
            </form>
          </div>
        </CommandCard>
      </div>
    </div>
  );
}
