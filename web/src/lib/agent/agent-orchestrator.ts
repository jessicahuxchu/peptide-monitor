import "server-only";

import { isSupabaseConfigured } from "@/lib/supabase/client";
import type { ChatMessage } from "./chat-responder";
import {
  inferDataDomains,
  queryAgentPlatformData,
} from "./agent-data";
import {
  AGENT_TOOL_DEFINITIONS,
  type AgentToolCallRecord,
  executeAgentTool,
  type AgentToolContext,
} from "./agent-tools";
import { isWebSearchConfigured } from "./web-search";

const SYSTEM_PROMPT_ZH = `你是 Peptide Monitor 平台的 AI Agent（Hermes + Qwen）。

你的四项职责：
1. **平台数据问答**：用 query_platform_database 读取 Supabase 中的真实数据（舆论情报、Reddit 社交热度、产品监控、供应链、财务、关系、风险、合规矩阵）后回答。平台已接入数据库与 Reddit 热度聚合——禁止声称「未接入实时舆论」或编造 Semaglutide 等不在库中的排名。
2. **功能与规则解释**：用 get_platform_knowledge 查阅平台源码与业务规则，解释评分、矩阵、页面功能。
3. **结构化更新**：用户提交报价、询盘、监管更新或运营信息时，用 submit_structured_update 生成待确认提案（需人工审核后落库）。
4. **外部联网查询**：仅当平台数据库与知识库都没有答案时，用 web_search 查询公开互联网信息，并注明来源。

回答要求：简洁、专业、可操作；引用工具返回的数据；法律结论须提醒需澳洲律师复核。`;

const SYSTEM_PROMPT_EN = `You are the Peptide Monitor AI Agent (Hermes + Qwen).

Four responsibilities:
1. **Platform data Q&A** — use query_platform_database for live Supabase data (intelligence, Reddit social heat, product monitor, supply chain, finance, relations, risk, regulatory). The platform IS connected — never claim social/intel is unavailable or invent rankings.
2. **Feature & rule explanations** — use get_platform_knowledge for scoring rules and platform behavior.
3. **Structured updates** — use submit_structured_update for quotes, inquiries, regulatory notes (queued for human review).
4. **Web search** — use web_search only when platform DB and knowledge cannot answer; cite sources.

Be concise and actionable. Legal conclusions require Australian counsel review.`;

const MAX_TOOL_ROUNDS = 4;

interface ApiMessage {
  role: "system" | "user" | "assistant" | "tool";
  content?: string;
  tool_calls?: {
    id: string;
    type: "function";
    function: { name: string; arguments: string };
  }[];
  tool_call_id?: string;
}

export interface AgentOrchestratorRequest {
  messages: ChatMessage[];
  locale?: "en" | "zh";
  intent?: "chat" | "quote" | "inquiry" | "regulatory";
  attachmentText?: string;
  author?: string;
}

export interface AgentOrchestratorResult {
  reply: string;
  provider: "hermes-qwen" | "fallback";
  toolCalls: AgentToolCallRecord[];
  inboxSubmission?: {
    content: string;
    proposedChanges: ReturnType<typeof import("./inbox-parser").parseInboxContent>;
  };
  knowledgeSources?: { id: string; filePath: string; description: string }[];
}

function buildUserPayload(req: AgentOrchestratorRequest): string {
  const last = [...req.messages].reverse().find((m) => m.role === "user");
  const base = last?.content ?? "";
  if (!req.attachmentText?.trim()) return base;
  return `${base}\n\n--- 附件内容 ---\n${req.attachmentText.trim()}`;
}

function buildRuntimeContext(locale: "en" | "zh"): string {
  const dbStatus = isSupabaseConfigured()
    ? locale === "zh"
      ? "Supabase 已连接，可查询实时数据。"
      : "Supabase is connected — live data available."
    : locale === "zh"
      ? "Supabase 未配置，工具将回退到 seed 数据。"
      : "Supabase not configured — tools fall back to seed data.";

  const webStatus = isWebSearchConfigured()
    ? locale === "zh"
      ? "联网搜索已配置（Tavily/Serper）。"
      : "Web search configured (Tavily/Serper)."
    : locale === "zh"
      ? "联网搜索使用 DuckDuckGo 基础回退；可配置 TAVILY_API_KEY 增强。"
      : "Web search uses DuckDuckGo fallback; set TAVILY_API_KEY for richer results.";

  return `\n\n--- Runtime ---\n${dbStatus}\n${webStatus}`;
}

async function prefetchDataContext(userText: string): Promise<string> {
  const domains = inferDataDomains(userText);
  if (domains.length === 0) return "";

  const snippets: string[] = [];
  for (const domain of domains.slice(0, 2)) {
    const { source, data } = await queryAgentPlatformData({ domain, limit: 5 });
    snippets.push(
      `### Prefetch ${domain} (${source})\n${JSON.stringify(data, null, 2)}`,
    );
  }

  return `\n\n--- 预取平台数据（供参考，仍应调用工具验证） ---\n${snippets.join("\n\n")}`;
}

function getGatewayConfig() {
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
    process.env.HERMES_MODEL ?? process.env.QWEN_MODEL ?? "qwen-plus";

  return { gateway, apiKey, model };
}

export async function runAgentOrchestrator(
  req: AgentOrchestratorRequest,
): Promise<AgentOrchestratorResult> {
  const locale = req.locale ?? "zh";
  const intent = req.intent ?? "chat";
  const author = req.author ?? "User";
  const userPayload = buildUserPayload(req);
  const toolCalls: AgentToolCallRecord[] = [];
  let inboxSubmission: AgentOrchestratorResult["inboxSubmission"];
  let knowledgeSources: AgentOrchestratorResult["knowledgeSources"];

  const ctx: AgentToolContext = { locale, author, intent };
  const { gateway, apiKey, model } = getGatewayConfig();

  if (!gateway || !apiKey) {
    const { generateChatResponse } = await import("./chat-responder");
    return {
      reply: await generateChatResponse(req.messages, locale, userPayload, {
        author,
        intent,
      }),
      provider: "fallback",
      toolCalls: [],
    };
  }

  const prefetch = await prefetchDataContext(userPayload);
  const systemContent =
    (locale === "zh" ? SYSTEM_PROMPT_ZH : SYSTEM_PROMPT_EN) +
    buildRuntimeContext(locale) +
    prefetch;

  const apiMessages: ApiMessage[] = [
    { role: "system", content: systemContent },
    ...req.messages.slice(0, -1).map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
    { role: "user", content: userPayload },
  ];

  let reply: string | null = null;

  for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
    const res = await fetch(`${gateway.replace(/\/$/, "")}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: apiMessages,
        tools: AGENT_TOOL_DEFINITIONS,
        tool_choice: round === 0 && inferDataDomains(userPayload).length > 0 ? "auto" : "auto",
        temperature: 0.3,
      }),
    });

    if (!res.ok) break;

    const data = (await res.json()) as {
      choices?: {
        message?: ApiMessage & { content?: string | null };
        finish_reason?: string;
      }[];
    };

    const message = data.choices?.[0]?.message;
    if (!message) break;

    const toolCallList = message.tool_calls ?? [];
    if (toolCallList.length === 0) {
      reply = message.content?.trim() ?? null;
      break;
    }

    apiMessages.push({
      role: "assistant",
      content: message.content ?? "",
      tool_calls: toolCallList,
    });

    for (const call of toolCallList) {
      const { content, record } = await executeAgentTool(
        call.function.name,
        call.function.arguments,
        ctx,
      );
      toolCalls.push(record);

      if (call.function.name === "get_platform_knowledge") {
        const parsed = JSON.parse(content) as {
          sources?: { id: string; filePath: string; description: string }[];
        };
        knowledgeSources = parsed.sources;
      }

      if (call.function.name === "submit_structured_update") {
        const parsed = JSON.parse(content) as {
          proposedChanges: import("./inbox-parser").ProposedChange[];
        };
        inboxSubmission = {
          content: userPayload,
          proposedChanges: parsed.proposedChanges,
        };
      }

      apiMessages.push({
        role: "tool",
        tool_call_id: call.id,
        content,
      });
    }
  }

  if (!reply) {
    const { generateChatResponse } = await import("./chat-responder");
    reply = await generateChatResponse(req.messages, locale, userPayload, {
      author,
      intent,
    });
  }

  if (
    !inboxSubmission &&
    intent !== "chat" &&
    (intent === "quote" || intent === "inquiry" || intent === "regulatory")
  ) {
    const { parseInboxContent } = await import("./inbox-parser");
    inboxSubmission = {
      content: userPayload,
      proposedChanges: parseInboxContent(userPayload, author),
    };
  }

  return {
    reply,
    provider: "hermes-qwen",
    toolCalls,
    inboxSubmission,
    knowledgeSources,
  };
}
