"use client";

import { useEffect, useRef, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useLocale, useTranslations } from "next-intl";
import { ChatMarkdown } from "@/components/chat/ChatMarkdown";
import { CommandCard } from "@/components/ui/CommandCard";
import { useChatSessions } from "@/hooks/useChatSessions";
import { useInboxStore } from "@/hooks/useInboxStore";
import { useViewerProfile } from "@/hooks/useViewerProfile";
import { canConfirmReviewCategory, type ReviewCategory } from "@/lib/auth/roles";
import { formatDateTime } from "@/lib/utils";
import type { ChatMessage } from "@/lib/agent/chat-responder";
import type { ChatIntent } from "@/lib/agent/hermes-client";
import {
  Bot,
  Check,
  FileText,
  Loader2,
  Paperclip,
  Plus,
  Send,
  Trash2,
  User,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

const PROMPT_INTENTS: { intent: ChatIntent; key: string }[] = [
  { intent: "quote", key: "promptQuote" },
  { intent: "inquiry", key: "promptInquiry" },
  { intent: "regulatory", key: "promptRegulatory" },
];

function categoryLabelKey(category: ReviewCategory): string {
  if (category === "procurement") return "categoryProcurement";
  if (category === "sales") return "categorySales";
  return "categoryAdmin";
}

export default function InboxPage() {
  const t = useTranslations();
  const locale = useLocale() as "en" | "zh";
  const { user, isLoaded } = useUser();
  const userEmail = user?.primaryEmailAddress?.emailAddress;
  const { profile } = useViewerProfile();
  const roles = profile?.roles ?? [];

  const { submissions, loading, usingDb, error, confirm, reject, reload, submit } =
    useInboxStore();

  const canConfirm = (category: ReviewCategory) =>
    canConfirmReviewCategory(roles, category, userEmail);

  const welcomeMessage = t("inboxPage.chatWelcome");
  const newChatTitle = t("inboxPage.newChat");

  const {
    sessions,
    activeId,
    activeSession,
    loading: sessionsLoading,
    usingDb: sessionsUsingDb,
    createSession,
    saveMessages,
    removeSession,
    selectSession,
  } = useChatSessions(user?.id, welcomeMessage, newChatTitle);

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatIntent, setChatIntent] = useState<ChatIntent>("chat");
  const [attachmentName, setAttachmentName] = useState<string | null>(null);
  const [attachmentText, setAttachmentText] = useState<string | null>(null);
  const [chatLoading, setChatLoading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const skipSessionSyncRef = useRef(false);

  useEffect(() => {
    if (!activeSession || skipSessionSyncRef.current) return;
    setChatMessages(activeSession.messages);
    setChatInput("");
    setChatIntent("chat");
    setAttachmentName(null);
    setAttachmentText(null);
    if (fileRef.current) fileRef.current.value = "";
  }, [activeSession?.id]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, chatLoading]);

  const pendingSubmissions = submissions.filter((s) => s.status === "pending");

  const persistMessages = async (sessionId: string, messages: ChatMessage[]) => {
    skipSessionSyncRef.current = true;
    await saveMessages(sessionId, messages);
    skipSessionSyncRef.current = false;
  };

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

  const handleNewChat = async () => {
    await createSession();
  };

  const handleSelectSession = (sessionId: string) => {
    selectSession(sessionId);
  };

  const handleDeleteSession = async (sessionId: string) => {
    const wasLast = sessions.length <= 1;
    await removeSession(sessionId);
    if (wasLast) {
      await createSession();
    }
  };

  const handleDeleteMessage = async (index: number) => {
    if (!activeId || chatLoading) return;
    const next = chatMessages.filter((_, i) => i !== index);
    setChatMessages(next);
    await persistMessages(activeId, next);
  };

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || chatLoading || !activeId) return;

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
      const finalMessages: ChatMessage[] = [
        ...nextMessages,
        { role: "assistant", content: reply },
      ];
      setChatMessages(finalMessages);
      await persistMessages(activeId, finalMessages);
      setAttachmentName(null);
      setAttachmentText(null);
      if (fileRef.current) fileRef.current.value = "";
    } catch {
      const errorMessages: ChatMessage[] = [
        ...nextMessages,
        { role: "assistant", content: t("inboxPage.chatError") },
      ];
      setChatMessages(errorMessages);
      await persistMessages(activeId, errorMessages);
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
    <div className="flex h-[calc(100dvh-7rem)] w-full flex-col p-3 sm:p-4 md:h-[calc(100dvh-3.5rem)] md:p-5 lg:p-6">
      {!usingDb && (
        <p className="mb-3 shrink-0 rounded-lg border border-command-orange/30 bg-command-orange/5 px-4 py-2 text-xs text-command-orange">
          {t("inboxPage.offlineMode")}
        </p>
      )}
      {error && <p className="mb-3 shrink-0 text-xs text-command-red">{error}</p>}

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 sm:gap-4 lg:grid-cols-[minmax(14rem,0.85fr)_minmax(12rem,0.7fr)_minmax(0,2.4fr)] lg:items-stretch">
        <CommandCard
          title={t("inboxPage.pendingTitle")}
          className="flex min-h-[12rem] flex-col lg:min-h-0 lg:h-full"
        >
          {loading ? (
            <div className="flex flex-1 items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-command-teal" />
            </div>
          ) : pendingSubmissions.length === 0 ? (
            <p className="flex flex-1 items-center justify-center py-6 text-center text-xs text-command-text-muted">
              {t("inboxPage.noPending")}
            </p>
          ) : (
            <ul className="min-h-0 flex-1 space-y-2 overflow-y-auto">
              {pendingSubmissions.map((msg) => (
                <li
                  key={msg.id}
                  className="rounded-lg border border-command-border bg-command-card-elevated p-3"
                >
                  <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
                    <span className="rounded border border-command-teal/30 bg-command-teal/10 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-command-teal-bright">
                      {t(`inboxPage.${categoryLabelKey(msg.reviewCategory)}`)}
                    </span>
                  </div>
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
                  {canConfirm(msg.reviewCategory) ? (
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
                  ) : (
                    <p className="mt-2 text-[10px] text-command-text-muted">
                      {t("inboxPage.reviewRestrictedForCategory", {
                        role: t(`inboxPage.${categoryLabelKey(msg.reviewCategory)}`),
                      })}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </CommandCard>

        <CommandCard
          title={t("inboxPage.historyTitle")}
          className="flex min-h-[10rem] flex-col lg:min-h-0 lg:h-full"
          action={
            <button
              type="button"
              onClick={() => void handleNewChat()}
              disabled={!isLoaded || !user}
              className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-command-teal/30 bg-command-teal/10 text-command-teal-bright transition-colors hover:bg-command-teal/20 disabled:opacity-50"
              aria-label={t("inboxPage.newChat")}
              title={t("inboxPage.newChat")}
            >
              <Plus className="h-4 w-4" />
            </button>
          }
        >
          {!isLoaded || !user ? (
            <p className="flex flex-1 items-center justify-center py-4 text-center text-xs text-command-text-muted">
              {t("inboxPage.historySignIn")}
            </p>
          ) : sessionsLoading ? (
            <div className="flex flex-1 items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-command-teal" />
            </div>
          ) : sessions.length === 0 ? (
            <p className="flex flex-1 items-center justify-center py-4 text-center text-xs text-command-text-muted">
              {t("inboxPage.historyEmpty")}
            </p>
          ) : (
            <ul className="min-h-0 flex-1 space-y-1.5 overflow-y-auto">
              {sessions.map((session) => {
                const isActive = session.id === activeId;
                return (
                  <li key={session.id}>
                    <div
                      className={cn(
                        "group flex items-start gap-1 rounded-lg border px-2.5 py-2 transition-colors",
                        isActive
                          ? "border-command-teal/40 bg-command-teal/10"
                          : "border-command-border bg-command-card-elevated hover:border-command-teal/20",
                      )}
                    >
                      <button
                        type="button"
                        onClick={() => handleSelectSession(session.id)}
                        className="min-w-0 flex-1 text-left"
                      >
                        <p
                          className={cn(
                            "line-clamp-2 text-xs font-medium",
                            isActive ? "text-command-teal-bright" : "text-command-text",
                          )}
                        >
                          {session.title}
                        </p>
                        <p className="mt-0.5 text-[10px] text-command-text-muted">
                          {formatDateTime(session.updatedAt, locale)}
                        </p>
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleDeleteSession(session.id)}
                        className="mt-0.5 rounded p-1 text-command-text-muted opacity-70 transition-opacity hover:bg-command-border hover:text-command-red sm:opacity-0 sm:group-hover:opacity-100"
                        aria-label={t("inboxPage.deleteChat")}
                        title={t("inboxPage.deleteChat")}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
          {user && !sessionsUsingDb && (
            <p className="mt-2 shrink-0 text-[10px] text-command-text-muted">
              {t("inboxPage.historyLocalOnly")}
            </p>
          )}
        </CommandCard>

        <CommandCard
          title={t("inboxPage.chatTitle")}
          className="flex min-h-[min(50vh,28rem)] flex-col lg:min-h-0 lg:h-full"
        >
          <div className="mb-3 flex shrink-0 flex-wrap gap-2">
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
            <div className="min-h-0 flex-1 space-y-3 overflow-y-auto rounded-lg border border-command-border bg-[#050505] p-3 sm:p-4">
              {chatMessages.map((msg, i) => (
                <div
                  key={`${msg.role}-${i}-${msg.content.slice(0, 12)}`}
                  className={cn(
                    "group/msg flex gap-2",
                    msg.role === "user" ? "justify-end" : "justify-start",
                  )}
                >
                  {msg.role === "assistant" && (
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-command-teal/20">
                      <Bot className="h-3.5 w-3.5 text-command-teal-bright" />
                    </div>
                  )}
                  <div className="relative max-w-[min(100%,42rem)]">
                    <div
                      className={cn(
                        "rounded-xl px-3 py-2 text-sm",
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
                    <button
                      type="button"
                      onClick={() => void handleDeleteMessage(i)}
                      disabled={chatLoading}
                      className="absolute right-1 top-1 rounded p-1 text-command-text-muted opacity-70 transition-opacity hover:bg-black/30 hover:text-command-red sm:opacity-0 sm:group-hover/msg:opacity-100 disabled:opacity-40"
                      aria-label={t("inboxPage.deleteMessage")}
                      title={t("inboxPage.deleteMessage")}
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
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
              <div className="mt-2 flex shrink-0 items-center gap-2 rounded-lg border border-command-border bg-command-card-elevated px-3 py-2 text-xs text-command-text-secondary">
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

            <form onSubmit={handleChatSubmit} className="mt-3 shrink-0 space-y-2">
              <textarea
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder={t("inboxPage.chatPlaceholder")}
                disabled={chatLoading || !activeId}
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
                  disabled={chatLoading || !chatInput.trim() || !activeId}
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
