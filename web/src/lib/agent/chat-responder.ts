import {
  buildKnowledgeSystemAddon,
  isPlatformKnowledgeQuery,
  retrievePlatformKnowledge,
} from "./platform-knowledge";
import {
  inferDataDomains,
  isPlatformDataQuery,
  queryAgentPlatformData,
} from "./agent-data";
import { webSearch } from "./web-search";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ChatResponderOptions {
  author?: string;
  intent?: "chat" | "quote" | "inquiry" | "regulatory";
}

const TOPICS: { pattern: RegExp; reply: string }[] = [
  {
    pattern: /bpc|157/i,
    reply:
      "BPC-157 目前在 AU 市场机会分最高（约 78），主要走 B2B → 配制药房路径。VIC/NSW 需求稳定，需关注 GMP、COA 及州级配制注册文件。",
  },
  {
    pattern: /供应|supplier|供应商/i,
    reply:
      "当前匹配供应商包括 Wuhan PeptideTech、Hybio Pharmaceutical 等，均提供多品类报价。可在「关系」页按客户需求筛选符合文件要求的供应商。",
  },
  {
    pattern: /监管|regulatory|tga|合规/i,
    reply:
      "AU 监管重点：TGA 批准、进口许可、州级配制注册。NSW 近期更新了冷链存储文档要求，建议检查相关节点文件完成度。",
  },
  {
    pattern: /路径|path|供应链/i,
    reply:
      "三条主路径：① B2B → 配制药房（优先）② 诊所/处方医生 ③ 灰色零售（高风险）。战略页和供应链页可查看完整节点流程。",
  },
  {
    pattern: /财务|销售|revenue|营收/i,
    reply:
      "2026 年 AU 市场 BPC-157 营收持续增长，VIC 贡献最大。可在「财务」页按州、品类、时间维度查看明细。",
  },
  {
    pattern: /风险|risk/i,
    reply:
      "当前开放风险包括 NSW 存储协议变更、配制注册缺口等。全球风险指数 2.41，状态稳定。",
  },
];

function buildKnowledgeFallbackReply(
  query: string,
  locale: "en" | "zh",
): string | null {
  if (!isPlatformKnowledgeQuery(query)) return null;

  const { context, sources } = retrievePlatformKnowledge(query);
  const sourceList = sources.map((s) => `- \`${s.filePath}\` — ${s.description}`).join("\n");

  if (locale === "zh") {
    return [
      "当前未连接 Hermes/Qwen，以下为根据你的问题从平台源码中检索到的相关片段（离线模式）。",
      "配置 `DASHSCOPE_API_KEY` 或 `HERMES_API_KEY` 后可获得自然语言解读。",
      "",
      "**已检索文件：**",
      sourceList || "（无）",
      "",
      "**源码摘录：**",
      context,
    ].join("\n");
  }

  return [
    "Hermes/Qwen is not configured — showing matched platform source excerpts (offline mode).",
    "Set `DASHSCOPE_API_KEY` or `HERMES_API_KEY` for natural-language answers.",
    "",
    "**Retrieved files:**",
    sourceList || "(none)",
    "",
    "**Excerpts:**",
    context,
  ].join("\n");
}

async function buildDataFallbackReply(
  query: string,
  locale: "en" | "zh",
): Promise<string | null> {
  if (!isPlatformDataQuery(query)) return null;

  const domains = inferDataDomains(query);
  const sections: string[] = [];

  for (const domain of domains.slice(0, 2)) {
    const { source, data } = await queryAgentPlatformData({ domain, limit: 8 });
    sections.push(`### ${domain} (${source})\n\`\`\`json\n${JSON.stringify(data, null, 2)}\n\`\`\``);
  }

  if (sections.length === 0) return null;

  if (locale === "zh") {
    return [
      "当前未连接 LLM，以下为从平台数据库/seed 直接查询的结果（离线模式）：",
      "",
      ...sections,
      "",
      "配置 `DASHSCOPE_API_KEY` 后可获得自然语言解读。",
    ].join("\n");
  }

  return [
    "LLM not configured — raw platform database query results (offline mode):",
    "",
    ...sections,
    "",
    "Set `DASHSCOPE_API_KEY` for natural-language answers.",
  ].join("\n");
}

export async function generateChatResponse(
  messages: ChatMessage[],
  locale: "en" | "zh" = "zh",
  latestUserText?: string,
  _options: ChatResponderOptions = {},
): Promise<string> {
  const lastUser = [...messages].reverse().find((m) => m.role === "user");
  if (!lastUser) {
    return locale === "zh"
      ? "你好，我是 Peptide Monitor 助手。可以问我供应链、监管、产品机会、评分规则或平台功能相关问题。"
      : "Hello, I'm the Peptide Monitor assistant. Ask about supply chain, regulatory, opportunities, scoring rules, or platform features.";
  }

  const text = latestUserText ?? lastUser.content;

  const dataReply = await buildDataFallbackReply(text, locale);
  if (dataReply) return dataReply;

  const knowledgeReply = buildKnowledgeFallbackReply(text, locale);
  if (knowledgeReply) return knowledgeReply;

  for (const topic of TOPICS) {
    if (topic.pattern.test(text)) {
      return topic.reply;
    }
  }

  if (/最新|新闻|news|today|2026/i.test(text)) {
    const search = await webSearch(text, 3);
    if (search.results.length > 0) {
      const lines = search.results.map(
        (r, i) => `${i + 1}. **${r.title}** — ${r.snippet.slice(0, 120)} (${r.url})`,
      );
      return locale === "zh"
        ? `平台库中未命中，已尝试联网检索（${search.provider}）：\n\n${lines.join("\n")}`
        : `No platform match — web search (${search.provider}):\n\n${lines.join("\n")}`;
    }
  }

  if (locale === "zh") {
    return `关于「${text.slice(0, 40)}${text.length > 40 ? "…" : ""}」，我建议：\n\n1. 在「舆论情报」页查看相关 SKU 热度与信号\n2. 在「供应链」页检查对应节点文件要求\n3. 如需录入新信息，可在此提交，我会帮你解析为结构化更新。\n\n也可直接问「哪个产品热度最高」「综合评判怎么算」等问题。`;
  }

  return `Regarding "${text.slice(0, 40)}${text.length > 40 ? "…" : ""}", I suggest:\n\n1. Check social heat and signals on Intelligence\n2. Review node document requirements on Supply Chain\n3. Submit updates here for structured parsing.\n\nYou can also ask e.g. "which product has the highest heat?" or how viability scoring works.`;
}
