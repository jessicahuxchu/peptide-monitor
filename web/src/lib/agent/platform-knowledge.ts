import "server-only";

import fs from "fs";
import path from "path";

export interface KnowledgeSource {
  id: string;
  /** Relative to `web/` or repo root */
  filePath: string;
  description: string;
  topics: string[];
  maxChars?: number;
  /** For JSON message files — extract one top-level key only */
  jsonKey?: string;
}

export interface RetrievedKnowledge {
  context: string;
  sources: { id: string; filePath: string; description: string }[];
}

const DOMAIN_TERMS = [
  "综合评判",
  "可行性",
  "viability",
  "市场信号",
  "平台覆盖深度",
  "平台验证",
  "平台深度",
  "平台覆盖",
  "运营可行",
  "合规空间",
  "供应可行性",
  "周转",
  "评分",
  "评分标准",
  "评判",
  "拆解",
  "权重",
  "机会分",
  "opportunity",
  "合规矩阵",
  "监管",
  "regulatory",
  "matrix",
  "stockmode",
  "备货",
  "leadtime",
  "交付",
  "stockweeks",
  "库存",
  "上架深度",
  "presence",
  "档位",
  "tier",
  "产品监控",
  "product monitor",
  "舆论",
  "情报",
  "热度",
  "social",
  "reddit",
  "heat",
  "bpc-157",
  "ghk-cu",
  "功能",
  "规则",
  "怎么算",
  "计算公式",
];

const KNOWLEDGE_SOURCES: KnowledgeSource[] = [
  {
    id: "viability",
    filePath: "src/lib/product-monitor/viability.ts",
    description: "综合评判四维评分、行动档位、市场信号与平台深度",
    topics: [
      "综合评判",
      "viability",
      "可行性",
      "市场信号",
      "平台覆盖",
      "平台深度",
      "平台验证",
      "运营可行",
      "合规空间",
      "评分",
      "权重",
      "档位",
      "action",
      "tier",
      "market",
      "signal",
      "operational",
      "regulatory",
      "allowance",
    ],
    maxChars: 6000,
  },
  {
    id: "scoring",
    filePath: "src/lib/product-monitor/scoring.ts",
    description: "运营可行子分、composite score、模拟供应链数据开关",
    topics: [
      "运营可行",
      "供应可行性",
      "周转",
      "stockmode",
      "leadtime",
      "stockweeks",
      "综合分",
      "composite",
      "模拟",
      "supply",
      "turnover",
    ],
    maxChars: 5000,
  },
  {
    id: "regulatory-matrix",
    filePath: "src/lib/regulatory/matrix.ts",
    description: "合规矩阵产品风险聚合（合规空间唯一来源）",
    topics: [
      "合规矩阵",
      "监管",
      "regulatory",
      "合规空间",
      "matrix",
      "风险",
      "risk",
      "tga",
      "合规",
    ],
    maxChars: 3500,
  },
  {
    id: "types",
    filePath: "src/lib/product-monitor/types.ts",
    description: "产品监控类型：备货模式、平台上架等级、档位枚举",
    topics: [
      "stockmode",
      "备货",
      "presence",
      "上架",
      "tier",
      "类型",
      "platform",
      "enum",
    ],
    maxChars: 3500,
  },
  {
    id: "i18n-zh",
    filePath: "messages/zh.json",
    description: "产品监控中文文案与维度说明",
    topics: ["文案", "label", "说明", "图例", "评判", "机会分", "覆盖"],
    jsonKey: "productMonitor",
    maxChars: 4500,
  },
  {
    id: "seed-data",
    filePath: "src/lib/product-monitor/seed-data.ts",
    description: "各 SKU 平台上架深度与供应链字段示例数据",
    topics: [
      "bpc",
      "ghk",
      "产品",
      "sku",
      "上架",
      "presence",
      "示例",
      "对比",
      "为什么",
    ],
    maxChars: 7000,
  },
  {
    id: "heat-aggregator",
    filePath: "src/lib/social/heat-aggregator.ts",
    description: "Reddit 帖子热度聚合、heatImpact 计算与 intelligence_signals 写入",
    topics: [
      "舆论",
      "情报",
      "热度",
      "heat",
      "social",
      "reddit",
      "提及",
      "engagement",
      "聚合",
      "信号",
    ],
    maxChars: 4500,
  },
  {
    id: "hermes-agent",
    filePath: "src/lib/agent/hermes-client.ts",
    description: "AI Agent 对话入口与系统提示",
    topics: ["agent", "hermes", "对话", "聊天", "inbox", "收件箱"],
    maxChars: 2500,
  },
];

const TOTAL_CONTEXT_BUDGET = 18_000;

function resolveFilePath(relativePath: string): string | null {
  const cwd = process.cwd();
  const candidates = [
    path.join(cwd, relativePath),
    path.join(cwd, "web", relativePath),
    path.join(cwd, "..", "web", relativePath),
  ];
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate;
  }
  return null;
}

export function extractQueryKeywords(query: string): string[] {
  const lower = query.toLowerCase();
  const keywords = new Set<string>();

  for (const term of DOMAIN_TERMS) {
    if (lower.includes(term.toLowerCase())) {
      keywords.add(term.toLowerCase());
    }
  }

  for (const match of lower.matchAll(/[a-z][a-z0-9_-]{2,}/g)) {
    keywords.add(match[0]);
  }

  for (const match of query.matchAll(/[\u4e00-\u9fff]{2,}/g)) {
    const phrase = match[0];
    if (phrase.length <= 6) keywords.add(phrase);
  }

  return [...keywords];
}

function scoreSource(source: KnowledgeSource, keywords: string[]): number {
  if (keywords.length === 0) return 1;

  let score = 0;
  const blob = `${source.description} ${source.topics.join(" ")}`.toLowerCase();

  for (const kw of keywords) {
    if (blob.includes(kw)) score += 3;
    for (const topic of source.topics) {
      if (topic.toLowerCase().includes(kw) || kw.includes(topic.toLowerCase())) {
        score += 2;
      }
    }
  }

  return score;
}

function excerptByKeywords(content: string, keywords: string[], maxChars: number): string {
  if (content.length <= maxChars) return content;
  if (keywords.length === 0) return `${content.slice(0, maxChars)}\n…（已截断）`;

  const lines = content.split("\n");
  const hitIndexes = new Set<number>();

  for (let i = 0; i < lines.length; i++) {
    const lineLower = lines[i].toLowerCase();
    if (keywords.some((kw) => lineLower.includes(kw))) {
      for (let j = Math.max(0, i - 12); j <= Math.min(lines.length - 1, i + 12); j++) {
        hitIndexes.add(j);
      }
    }
  }

  if (hitIndexes.size === 0) {
    return `${content.slice(0, maxChars)}\n…（已截断）`;
  }

  const sorted = [...hitIndexes].sort((a, b) => a - b);
  const chunks: string[] = [];
  let last = -2;
  for (const idx of sorted) {
    if (idx > last + 1 && last >= 0) chunks.push("…");
    chunks.push(lines[idx]);
    last = idx;
  }

  let excerpt = chunks.join("\n");
  if (excerpt.length > maxChars) {
    excerpt = `${excerpt.slice(0, maxChars)}\n…（已截断）`;
  }
  return excerpt;
}

function loadSourceContent(source: KnowledgeSource, keywords: string[]): string | null {
  const absolutePath = resolveFilePath(source.filePath);
  if (!absolutePath) return null;

  const raw = fs.readFileSync(absolutePath, "utf8");
  let content = raw;

  if (source.jsonKey && source.filePath.endsWith(".json")) {
    try {
      const parsed = JSON.parse(raw) as Record<string, unknown>;
      content = JSON.stringify(parsed[source.jsonKey] ?? {}, null, 2);
    } catch {
      content = raw;
    }
  }

  const maxChars = source.maxChars ?? 4000;
  return excerptByKeywords(content, keywords, maxChars);
}

export function isPlatformKnowledgeQuery(query: string): boolean {
  const q = query.toLowerCase();
  if (
    /功能|规则|怎么算|如何算|评分|标准|公式|权重|维度|为什么|什么是|what is|how (is|does)|score|scoring|viability/i.test(
      q,
    )
  ) {
    return true;
  }
  return extractQueryKeywords(query).length > 0;
}

/** Retrieve relevant platform source excerpts for the user question. */
export function retrievePlatformKnowledge(
  query: string,
  options: { maxSources?: number } = {},
): RetrievedKnowledge {
  const keywords = extractQueryKeywords(query);
  const maxSources = options.maxSources ?? 4;

  const ranked = KNOWLEDGE_SOURCES.map((source) => ({
    source,
    score: scoreSource(source, keywords),
  }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, maxSources);

  const picked =
    ranked.length > 0
      ? ranked
      : KNOWLEDGE_SOURCES.filter((s) =>
          ["viability", "scoring", "regulatory-matrix", "i18n-zh"].includes(s.id),
        ).map((source) => ({ source, score: 1 }));

  const sources: RetrievedKnowledge["sources"] = [];
  const sections: string[] = [];
  let usedChars = 0;

  for (const { source } of picked) {
    if (usedChars >= TOTAL_CONTEXT_BUDGET) break;

    const content = loadSourceContent(source, keywords);
    if (!content) continue;

    const budget = Math.min(source.maxChars ?? 4000, TOTAL_CONTEXT_BUDGET - usedChars);
    const slice =
      content.length > budget ? `${content.slice(0, budget)}\n…（已截断）` : content;

    sections.push(
      `### ${source.filePath}\n${source.description}\n\`\`\`\n${slice}\n\`\`\``,
    );
    sources.push({
      id: source.id,
      filePath: source.filePath,
      description: source.description,
    });
    usedChars += slice.length;
  }

  const context =
    sections.length > 0
      ? sections.join("\n\n")
      : "（未能加载平台源码，请检查部署环境是否包含 web/src 目录。）";

  return { context, sources };
}

export function buildKnowledgeSystemAddon(
  query: string,
  locale: "en" | "zh",
): { addon: string; sources: RetrievedKnowledge["sources"] } {
  if (!isPlatformKnowledgeQuery(query)) {
    return { addon: "", sources: [] };
  }

  const { context, sources } = retrievePlatformKnowledge(query);

  if (locale === "zh") {
    return {
      sources,
      addon: `
你可以查阅以下平台源码与配置片段（已与用户问题匹配）。回答「功能、规则、评分怎么算」类问题时：
1. 必须优先依据这些源码回答，可引用文件路径；
2. 若源码中没有答案，明确说明「当前代码未定义」，不要编造；
3. 区分「设计意图」与「当前模拟/占位数据」（如 USE_SIMULATED_SUPPLY_METRICS）。

--- 平台源码摘录 ---
${context}
--- 摘录结束 ---`,
    };
  }

  return {
    sources,
    addon: `
Use the following matched platform source excerpts when answering questions about features, rules, or scoring:
1. Base answers on this code; cite file paths when helpful;
2. If the code does not define something, say so — do not invent rules;
3. Distinguish implemented logic from placeholders (e.g. USE_SIMULATED_SUPPLY_METRICS).

--- Platform source excerpts ---
${context}
--- end excerpts ---`,
  };
}
