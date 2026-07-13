import "server-only";

import type { ChatMessage } from "@/lib/agent/chat-responder";
import { createServiceClient } from "@/lib/supabase/client";
import type { Database, Json } from "@/lib/supabase/database.types";

type SessionRow = Database["public"]["Tables"]["agent_chat_sessions"]["Row"];

export interface AgentChatSession {
  id: string;
  userId: string;
  title: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
}

function mapSession(row: SessionRow): AgentChatSession {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    messages: (row.messages as unknown as ChatMessage[]) ?? [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function deriveSessionTitle(messages: ChatMessage[], fallback: string): string {
  const firstUser = messages.find((m) => m.role === "user");
  if (!firstUser?.content.trim()) return fallback;
  const text = firstUser.content.trim().replace(/\s+/g, " ");
  return text.length > 42 ? `${text.slice(0, 42)}…` : text;
}

export async function fetchChatSessions(userId: string): Promise<AgentChatSession[]> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("agent_chat_sessions")
    .select("*")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapSession);
}

export async function fetchChatSession(
  userId: string,
  sessionId: string,
): Promise<AgentChatSession | null> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("agent_chat_sessions")
    .select("*")
    .eq("user_id", userId)
    .eq("id", sessionId)
    .maybeSingle();
  if (error) throw error;
  return data ? mapSession(data) : null;
}

export async function createChatSession(
  userId: string,
  messages: ChatMessage[],
  title?: string,
): Promise<AgentChatSession> {
  const supabase = createServiceClient();
  const resolvedTitle = title ?? deriveSessionTitle(messages, "New chat");
  const { data, error } = await supabase
    .from("agent_chat_sessions")
    .insert({
      user_id: userId,
      title: resolvedTitle,
      messages: messages as unknown as Json,
    })
    .select()
    .single();
  if (error) throw error;
  return mapSession(data);
}

export async function updateChatSession(
  userId: string,
  sessionId: string,
  patch: { messages?: ChatMessage[]; title?: string },
): Promise<AgentChatSession> {
  const supabase = createServiceClient();
  const row: Database["public"]["Tables"]["agent_chat_sessions"]["Update"] = {
    updated_at: new Date().toISOString(),
  };
  if (patch.messages) {
    row.messages = patch.messages as unknown as Json;
    if (!patch.title) {
      row.title = deriveSessionTitle(patch.messages, "New chat");
    }
  }
  if (patch.title) row.title = patch.title;

  const { data, error } = await supabase
    .from("agent_chat_sessions")
    .update(row)
    .eq("user_id", userId)
    .eq("id", sessionId)
    .select()
    .single();
  if (error) throw error;
  return mapSession(data);
}

export async function deleteChatSession(userId: string, sessionId: string): Promise<void> {
  const supabase = createServiceClient();
  const { error } = await supabase
    .from("agent_chat_sessions")
    .delete()
    .eq("user_id", userId)
    .eq("id", sessionId);
  if (error) throw error;
}
