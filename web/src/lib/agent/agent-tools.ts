import "server-only";

import {
  type AgentDataDomain,
  queryAgentPlatformData,
} from "./agent-data";
import { parseInboxContent } from "./inbox-parser";
import { retrievePlatformKnowledge } from "./platform-knowledge";
import { webSearch } from "./web-search";

export interface AgentToolContext {
  locale: "en" | "zh";
  author: string;
  intent: "chat" | "quote" | "inquiry" | "regulatory";
}

export type AgentToolName =
  | "query_platform_database"
  | "get_platform_knowledge"
  | "submit_structured_update"
  | "web_search";

export const AGENT_TOOL_DEFINITIONS = [
  {
    type: "function" as const,
    function: {
      name: "query_platform_database",
      description:
        "Query live Peptide Monitor Supabase data: intelligence/social heat, product monitor, supply chain, finance, relations, risk, regulatory matrix. Use for factual questions about platform data (e.g. which product has highest social heat, opportunity scores, sales, risks).",
      parameters: {
        type: "object",
        properties: {
          domain: {
            type: "string",
            enum: [
              "intelligence",
              "social_heat",
              "product_monitor",
              "supply_chain",
              "finance",
              "relations",
              "risk",
              "regulatory",
            ],
            description:
              "Data domain. For 舆论情报/热度 use intelligence and/or social_heat.",
          },
          product: {
            type: "string",
            description: "Optional product filter, e.g. BPC-157",
          },
          limit: {
            type: "number",
            description: "Max rows to return (default 10)",
          },
        },
        required: ["domain"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "get_platform_knowledge",
      description:
        "Retrieve platform source code excerpts and business rules (viability scoring, compliance matrix logic, product monitor definitions). Use when explaining how features work or how scores are calculated.",
      parameters: {
        type: "object",
        properties: {
          question: {
            type: "string",
            description: "The user's question about platform rules or features",
          },
        },
        required: ["question"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "submit_structured_update",
      description:
        "Parse user-submitted quote, inquiry, regulatory update or operational note into structured inbox proposals for human review before DB commit. Use when user wants to log supplier quotes, customer requirements, node updates, or regulatory flags.",
      parameters: {
        type: "object",
        properties: {
          content: {
            type: "string",
            description: "Full structured or natural-language update content",
          },
          summary: {
            type: "string",
            description: "One-line summary of what will be queued",
          },
        },
        required: ["content"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "web_search",
      description:
        "Search the public internet for information NOT available in the platform database (external news, global regulatory changes, competitor public info). Do NOT use when platform DB tools can answer.",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "Search query" },
          max_results: { type: "number", description: "Max results (default 5)" },
        },
        required: ["query"],
      },
    },
  },
];

export interface AgentToolCallRecord {
  name: AgentToolName;
  args: Record<string, unknown>;
  resultPreview: string;
}

function safeJsonParse(value: string): Record<string, unknown> {
  try {
    return JSON.parse(value) as Record<string, unknown>;
  } catch {
    return {};
  }
}

export async function executeAgentTool(
  name: string,
  rawArgs: string,
  ctx: AgentToolContext,
): Promise<{ content: string; record: AgentToolCallRecord }> {
  const args = safeJsonParse(rawArgs);
  const toolName = name as AgentToolName;

  switch (toolName) {
    case "query_platform_database": {
      const domain = args.domain as AgentDataDomain;
      const result = await queryAgentPlatformData({
        domain,
        product: typeof args.product === "string" ? args.product : undefined,
        limit: typeof args.limit === "number" ? args.limit : 10,
      });
      const content = JSON.stringify(result, null, 2);
      return {
        content,
        record: {
          name: toolName,
          args,
          resultPreview: content.slice(0, 240),
        },
      };
    }

    case "get_platform_knowledge": {
      const question =
        typeof args.question === "string" ? args.question : "";
      const { context, sources } = retrievePlatformKnowledge(question);
      const payload = { sources, context };
      const content = JSON.stringify(payload, null, 2);
      return {
        content,
        record: {
          name: toolName,
          args,
          resultPreview: `sources: ${sources.map((s) => s.filePath).join(", ")}`,
        },
      };
    }

    case "submit_structured_update": {
      const contentText =
        typeof args.content === "string" ? args.content : "";
      const proposedChanges = parseInboxContent(contentText, ctx.author);
      const payload = {
        queued: true,
        intent: ctx.intent,
        summary:
          typeof args.summary === "string"
            ? args.summary
            : proposedChanges.map((c) => c.summary).join("; "),
        proposedChanges,
        note:
          ctx.locale === "zh"
            ? "将写入 agent_submissions 待人工确认后落库。"
            : "Will be written to agent_submissions for human review before commit.",
      };
      const content = JSON.stringify(payload, null, 2);
      return {
        content,
        record: {
          name: toolName,
          args,
          resultPreview: payload.summary,
        },
      };
    }

    case "web_search": {
      const query = typeof args.query === "string" ? args.query : "";
      const maxResults =
        typeof args.max_results === "number" ? args.max_results : 5;
      const result = await webSearch(query, maxResults);
      const content = JSON.stringify(result, null, 2);
      return {
        content,
        record: {
          name: toolName,
          args,
          resultPreview: `${result.provider}: ${result.results.length} hits`,
        },
      };
    }

    default:
      return {
        content: JSON.stringify({ error: `Unknown tool: ${name}` }),
        record: {
          name: toolName,
          args,
          resultPreview: `Unknown tool: ${name}`,
        },
      };
  }
}
