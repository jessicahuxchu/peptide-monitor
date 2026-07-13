import "server-only";

import type { ChatMessage } from "./chat-responder";
import {
  runAgentOrchestrator,
  type AgentOrchestratorRequest,
} from "./agent-orchestrator";

export type ChatIntent = "chat" | "quote" | "inquiry" | "regulatory";

export interface HermesChatRequest {
  messages: ChatMessage[];
  locale?: "en" | "zh";
  intent?: ChatIntent;
  attachmentText?: string;
  author?: string;
}

export interface HermesChatResult {
  reply: string;
  provider: "hermes-qwen" | "fallback";
  shouldQueueInbox: boolean;
  inboxContent?: string;
  knowledgeSources?: { id: string; filePath: string; description: string }[];
  toolCalls?: { name: string; resultPreview: string }[];
}

export async function callHermesChat(req: HermesChatRequest): Promise<HermesChatResult> {
  const intent = req.intent ?? "chat";

  const orchestratorReq: AgentOrchestratorRequest = {
    messages: req.messages,
    locale: req.locale,
    intent,
    attachmentText: req.attachmentText,
    author: req.author,
  };

  const result = await runAgentOrchestrator(orchestratorReq);

  const shouldQueueInbox =
    intent !== "chat" || Boolean(result.inboxSubmission);

  return {
    reply: result.reply,
    provider: result.provider,
    shouldQueueInbox,
    inboxContent: result.inboxSubmission?.content ?? (shouldQueueInbox && intent !== "chat"
      ? buildUserPayload(req)
      : undefined),
    knowledgeSources: result.knowledgeSources,
    toolCalls: result.toolCalls.map((t) => ({
      name: t.name,
      resultPreview: t.resultPreview,
    })),
  };
}

function buildUserPayload(req: HermesChatRequest): string {
  const last = [...req.messages].reverse().find((m) => m.role === "user");
  const base = last?.content ?? "";
  if (!req.attachmentText?.trim()) return base;
  return `${base}\n\n--- 附件内容 ---\n${req.attachmentText.trim()}`;
}
