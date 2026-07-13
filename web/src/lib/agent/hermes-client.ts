import "server-only";

import { generateChatResponse, type ChatMessage } from "./chat-responder";
import { buildKnowledgeSystemAddon } from "./platform-knowledge";

const SYSTEM_PROMPT_ZH = `你是 Peptide Monitor 平台的 AI Agent（Hermes + Qwen 模式）。
你帮助用户处理多肽跨境供应链、AU 监管合规矩阵、供应商报价与客户询盘。
你可以根据注入的平台源码摘录，回答产品监控、综合评判、评分规则、页面功能等问题。
回答应简洁、专业、可操作。涉及法律结论时必须提醒需澳洲律师复核。
当用户提交报价、询盘或监管更新时，提炼关键字段并说明将生成待确认的结构化更新。`;

const SYSTEM_PROMPT_EN = `You are the Peptide Monitor AI Agent (Hermes + Qwen mode).
You assist with peptide cross-border supply chain, AU regulatory compliance, supplier quotes and customer inquiries.
You may use injected platform source excerpts to explain product monitor features, viability scoring, and business rules.
Be concise and actionable. Remind users that legal conclusions require Australian counsel review.
When users submit quotes, inquiries or regulatory updates, extract key fields and note that a pending structured update will be created.`;

export type ChatIntent = "chat" | "quote" | "inquiry" | "regulatory";

export interface HermesChatRequest {
  messages: ChatMessage[];
  locale?: "en" | "zh";
  intent?: ChatIntent;
  attachmentText?: string;
}

export interface HermesChatResult {
  reply: string;
  provider: "hermes-qwen" | "fallback";
  shouldQueueInbox: boolean;
  inboxContent?: string;
  knowledgeSources?: { id: string; filePath: string; description: string }[];
}

function buildUserPayload(req: HermesChatRequest): string {
  const last = [...req.messages].reverse().find((m) => m.role === "user");
  const base = last?.content ?? "";
  if (!req.attachmentText?.trim()) return base;
  return `${base}\n\n--- 附件内容 ---\n${req.attachmentText.trim()}`;
}

export async function callHermesChat(req: HermesChatRequest): Promise<HermesChatResult> {
  const locale = req.locale ?? "zh";
  const intent = req.intent ?? "chat";
  const messages = req.messages;
  const userPayload = buildUserPayload(req);
  const { addon: knowledgeAddon, sources: knowledgeSources } =
    buildKnowledgeSystemAddon(userPayload, locale);

  const gateway =
    process.env.HERMES_GATEWAY_URL ??
    process.env.OPENAI_BASE_URL ??
    (process.env.DASHSCOPE_API_KEY
      ? "https://dashscope.aliyuncs.com/compatible-mode/v1"
      : undefined);

  const apiKey =
    process.env.HERMES_API_KEY ??
    process.env.DASHSCOPE_API_KEY ??
    process.env.OPENAI_API_KEY;

  const model =
    process.env.HERMES_MODEL ??
    process.env.QWEN_MODEL ??
    "qwen-plus";

  let reply: string | null = null;

  if (gateway && apiKey) {
    try {
      const systemContent =
        (locale === "zh" ? SYSTEM_PROMPT_ZH : SYSTEM_PROMPT_EN) + knowledgeAddon;

      const apiMessages = [
        {
          role: "system" as const,
          content: systemContent,
        },
        ...messages.slice(0, -1),
        { role: "user" as const, content: userPayload },
      ];

      const res = await fetch(`${gateway.replace(/\/$/, "")}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: apiMessages,
          temperature: 0.4,
        }),
      });

      if (res.ok) {
        const data = (await res.json()) as {
          choices?: { message?: { content?: string } }[];
        };
        reply = data.choices?.[0]?.message?.content?.trim() ?? null;
      }
    } catch {
      reply = null;
    }
  }

  if (!reply) {
    reply = generateChatResponse(messages, locale, userPayload);
  }

  const shouldQueueInbox = intent !== "chat";
  const inboxContent = shouldQueueInbox ? userPayload : undefined;

  return {
    reply,
    provider: reply && gateway && apiKey ? "hermes-qwen" : "fallback",
    shouldQueueInbox,
    inboxContent,
    knowledgeSources: knowledgeSources.length > 0 ? knowledgeSources : undefined,
  };
}
