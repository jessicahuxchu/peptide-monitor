export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
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

export function generateChatResponse(
  messages: ChatMessage[],
  locale: "en" | "zh" = "zh",
): string {
  const lastUser = [...messages].reverse().find((m) => m.role === "user");
  if (!lastUser) {
    return locale === "zh"
      ? "你好，我是 Peptide Monitor 助手。可以问我供应链、监管、产品机会或供应商匹配相关问题。"
      : "Hello, I'm the Peptide Monitor assistant. Ask about supply chain, regulatory, product opportunities, or supplier matching.";
  }

  const text = lastUser.content;
  for (const topic of TOPICS) {
    if (topic.pattern.test(text)) {
      return topic.reply;
    }
  }

  if (locale === "zh") {
    return `关于「${text.slice(0, 40)}${text.length > 40 ? "…" : ""}」，我建议：\n\n1. 在「情报」页查看相关 SKU 机会分\n2. 在「供应链」页检查对应节点文件要求\n3. 如需录入新信息，可在左侧收件箱提交，我会帮你解析为结构化更新。`;
  }

  return `Regarding "${text.slice(0, 40)}${text.length > 40 ? "…" : ""}", I suggest:\n\n1. Check SKU opportunity scores on Intelligence\n2. Review node document requirements on Supply Chain\n3. Submit updates via the inbox on the left for structured parsing.`;
}
