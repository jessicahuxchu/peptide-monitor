"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ChatMessage } from "@/lib/agent/chat-responder";

export interface ChatSessionView {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
}

function storageKey(userId: string) {
  return `peptide-agent-chat-sessions-${userId}`;
}

function loadLocalSessions(userId: string): ChatSessionView[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(storageKey(userId));
    if (!raw) return [];
    return JSON.parse(raw) as ChatSessionView[];
  } catch {
    return [];
  }
}

function saveLocalSessions(userId: string, sessions: ChatSessionView[]) {
  localStorage.setItem(storageKey(userId), JSON.stringify(sessions));
}

function newLocalId() {
  return `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function deriveTitle(messages: ChatMessage[], fallback: string): string {
  const firstUser = messages.find((m) => m.role === "user");
  if (!firstUser?.content.trim()) return fallback;
  const text = firstUser.content.trim().replace(/\s+/g, " ");
  return text.length > 42 ? `${text.slice(0, 42)}…` : text;
}

export function useChatSessions(
  userId: string | undefined,
  welcomeMessage: string,
  newChatTitle: string,
) {
  const [sessions, setSessions] = useState<ChatSessionView[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [usingDb, setUsingDb] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bootstrappedRef = useRef(false);

  const activeSession = sessions.find((s) => s.id === activeId) ?? null;

  const createLocalSession = useCallback(
    (messages: ChatMessage[]): ChatSessionView => {
      const now = new Date().toISOString();
      return {
        id: newLocalId(),
        title: deriveTitle(messages, newChatTitle),
        messages,
        createdAt: now,
        updatedAt: now,
      };
    },
    [newChatTitle],
  );

  const load = useCallback(async () => {
    if (!userId) {
      setSessions([]);
      setActiveId(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/chat/sessions");
      if (res.status === 401) {
        setSessions([]);
        setActiveId(null);
        setError(null);
        setUsingDb(false);
        return;
      }
      if (res.status === 503) {
        const local = loadLocalSessions(userId);
        setUsingDb(false);
        setSessions(local);
        setActiveId(local[0]?.id ?? null);
        setError(null);
        return;
      }
      if (!res.ok) throw new Error("Failed to load chat history");

      const data = (await res.json()) as ChatSessionView[];
      setUsingDb(true);
      setSessions(data);
      setActiveId(data[0]?.id ?? null);
      setError(null);
    } catch (e) {
      const local = loadLocalSessions(userId);
      setUsingDb(false);
      setSessions(local);
      setActiveId(local[0]?.id ?? null);
      setError(e instanceof Error ? e.message : "Load failed");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    bootstrappedRef.current = false;
    void load();
  }, [load]);

  useEffect(() => {
    if (!userId || loading || bootstrappedRef.current) return;
    if (sessions.length > 0) {
      bootstrappedRef.current = true;
      return;
    }

    bootstrappedRef.current = true;
    void (async () => {
      const welcome: ChatMessage[] = [{ role: "assistant", content: welcomeMessage }];
      if (usingDb) {
        const res = await fetch("/api/chat/sessions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: welcome, title: newChatTitle }),
        });
        if (res.ok) {
          const session = (await res.json()) as ChatSessionView;
          setSessions([session]);
          setActiveId(session.id);
          return;
        }
      }

      const session = createLocalSession(welcome);
      setSessions([session]);
      setActiveId(session.id);
      saveLocalSessions(userId, [session]);
    })();
  }, [
    userId,
    loading,
    sessions.length,
    usingDb,
    welcomeMessage,
    newChatTitle,
    createLocalSession,
  ]);

  const createSession = useCallback(async () => {
    if (!userId) return null;
    const welcome: ChatMessage[] = [{ role: "assistant", content: welcomeMessage }];

    if (usingDb) {
      const res = await fetch("/api/chat/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: welcome, title: newChatTitle }),
      });
      if (!res.ok) return null;
      const session = (await res.json()) as ChatSessionView;
      setSessions((prev) => [session, ...prev]);
      setActiveId(session.id);
      return session;
    }

    const session = createLocalSession(welcome);
    setSessions((prev) => {
      const next = [session, ...prev];
      saveLocalSessions(userId, next);
      return next;
    });
    setActiveId(session.id);
    return session;
  }, [userId, usingDb, welcomeMessage, newChatTitle, createLocalSession]);

  const saveMessages = useCallback(
    async (sessionId: string, messages: ChatMessage[]) => {
      if (!userId) return;

      const title = deriveTitle(messages, newChatTitle);
      const updatedAt = new Date().toISOString();

      if (usingDb) {
        const res = await fetch(`/api/chat/sessions/${sessionId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages, title }),
        });
        if (!res.ok) return;
        const session = (await res.json()) as ChatSessionView;
        setSessions((prev) => {
          const next = prev.map((s) => (s.id === sessionId ? session : s));
          return [...next].sort(
            (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
          );
        });
        return;
      }

      setSessions((prev) => {
        const next = prev.map((s) =>
          s.id === sessionId
            ? { ...s, messages, title, updatedAt }
            : s,
        );
        const sorted = [...next].sort(
          (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
        );
        saveLocalSessions(userId, sorted);
        return sorted;
      });
    },
    [userId, usingDb, newChatTitle],
  );

  const removeSession = useCallback(
    async (sessionId: string) => {
      if (!userId) return;

      if (usingDb) {
        const res = await fetch(`/api/chat/sessions/${sessionId}`, { method: "DELETE" });
        if (!res.ok) return;
      }

      setSessions((prev) => {
        const next = prev.filter((s) => s.id !== sessionId);
        if (!usingDb) saveLocalSessions(userId, next);
        setActiveId((current) => (current === sessionId ? next[0]?.id ?? null : current));
        return next;
      });
    },
    [userId, usingDb],
  );

  return {
    sessions,
    activeId,
    activeSession,
    loading,
    usingDb,
    error,
    createSession,
    saveMessages,
    removeSession,
    selectSession: setActiveId,
    reload: load,
  };
}
