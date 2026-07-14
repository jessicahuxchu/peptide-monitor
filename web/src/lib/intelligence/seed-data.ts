export type SignalDimension = "demand" | "regulatory" | "competitive";
export type SignalCredibility = "high" | "medium" | "low";
export type SignalHorizon = "immediate" | "weeks" | "months";

export interface IntelSignal {
  id: string;
  source: "news_legal" | "insider" | "social" | "platform_2c";
  title: string;
  summary: string;
  date: string;
  region?: string;
  products: string[];
  /** Which decision variable this signal may move */
  dimension: SignalDimension;
  /** Human-readable impact direction */
  directionLabel: string;
  /** Deprecated: matrix is enacted-law only; intelligence never queues matrix updates */
  pendingMatrixUpdate: boolean;
  credibility: SignalCredibility;
  horizon: SignalHorizon;
  heatImpact?: number;
  regulatoryImpact?: number;
  trend?: "up" | "down" | "stable";
  url?: string;
}

export const intelligenceSignals: IntelSignal[] = [
  {
    id: "il1",
    source: "news_legal",
    title: "TGA 发布 BPC-157 进口许可续期窗口通知",
    summary: "联邦层面开放续期申请，预计 6 月底前完成审批。",
    date: "2026-06-15",
    region: "AU Federal",
    products: ["BPC-157"],
    dimension: "regulatory",
    directionLabel: "监管利好 · 许可续期窗口",
    pendingMatrixUpdate: false,
    credibility: "high",
    horizon: "weeks",
    heatImpact: 15,
    regulatoryImpact: -10,
    trend: "up",
  },
  {
    id: "il2",
    source: "news_legal",
    title: "NSW Health 更新配制药房多肽存储协议",
    summary: "新协议要求冷链存储文档升级，立即生效。属舆论/监管传闻信号，不自动写入合规矩阵。",
    date: "2026-06-12",
    region: "NSW",
    products: ["BPC-157", "TB-500"],
    dimension: "regulatory",
    directionLabel: "监管收紧 · 文档门槛上升",
    pendingMatrixUpdate: false,
    credibility: "high",
    horizon: "immediate",
    heatImpact: -5,
    regulatoryImpact: 35,
    trend: "down",
  },
  {
    id: "il3",
    source: "news_legal",
    title: "TB-500 列入 Schedule 4 处方药分类",
    summary: "所有进口路径需处方医生授权，合规门槛提高。已反映于联邦矩阵。",
    date: "2026-04-20",
    region: "AU Federal",
    products: ["TB-500"],
    dimension: "regulatory",
    directionLabel: "监管收紧 · S4 分类",
    pendingMatrixUpdate: false,
    credibility: "high",
    horizon: "immediate",
    heatImpact: -20,
    regulatoryImpact: 50,
    trend: "down",
  },
  {
    id: "il4",
    source: "insider",
    title: "大型药企推动某 GLP-1 类多肽合法化进程",
    summary: "业务线获悉某跨国药企正与 TGA 磋商 Semaglutide 配制框架，可能 2026 Q4 有进展。",
    date: "2026-06-10",
    region: "AU Federal",
    products: ["Semaglutide"],
    dimension: "regulatory",
    directionLabel: "监管利好 · 合法化预期",
    pendingMatrixUpdate: false,
    credibility: "medium",
    horizon: "months",
    heatImpact: 40,
    regulatoryImpact: -25,
    trend: "up",
  },
  {
    id: "il5",
    source: "insider",
    title: "悉尼监管收紧，多家 pharmacy 迁往昆士兰",
    summary: "NSW 执法力度加大，至少 3 家 compounding pharmacy 正在 QLD 申请新牌照。",
    date: "2026-06-08",
    region: "NSW → QLD",
    products: ["BPC-157", "GHK-Cu"],
    dimension: "regulatory",
    directionLabel: "渠道迁移 · 州际路径变化",
    pendingMatrixUpdate: false,
    credibility: "medium",
    horizon: "weeks",
    heatImpact: 10,
    regulatoryImpact: 20,
    trend: "stable",
  },
  {
    id: "il6",
    source: "insider",
    title: "墨尔本竞品降价 6%，B2B 客户议价压力上升",
    summary: "Metro Clinic 收到更低报价，要求重新谈判。",
    date: "2026-06-05",
    region: "VIC",
    products: ["BPC-157"],
    dimension: "competitive",
    directionLabel: "竞争压力 · 价格下行",
    pendingMatrixUpdate: false,
    credibility: "high",
    horizon: "immediate",
    heatImpact: 5,
    regulatoryImpact: 0,
    trend: "stable",
  },
  {
    id: "il7",
    source: "social",
    title: "Reddit r/Peptides — BPC-157 讨论热度月增 32%",
    summary: "澳洲用户讨论集中在运动恢复和关节修复场景，TB-500 关注度下降。",
    date: "2026-06-14",
    region: "AU",
    products: ["BPC-157", "TB-500"],
    dimension: "demand",
    directionLabel: "需求利好 · 讨论量上升",
    pendingMatrixUpdate: false,
    credibility: "medium",
    horizon: "weeks",
    heatImpact: 32,
    regulatoryImpact: 5,
    trend: "up",
  },
  {
    id: "il8",
    source: "social",
    title: "IG #peptideaustralia — GHK-Cu 护肤话题爆发",
    summary: "美容护肤类多肽在 25-40 岁女性群体中讨论量激增。",
    date: "2026-06-11",
    region: "AU",
    products: ["GHK-Cu"],
    dimension: "demand",
    directionLabel: "需求利好 · 护肤场景",
    pendingMatrixUpdate: false,
    credibility: "medium",
    horizon: "weeks",
    heatImpact: 45,
    regulatoryImpact: 0,
    trend: "up",
  },
  {
    id: "il9",
    source: "social",
    title: "PeptideDirect AU 遭 TGA 查封传闻在社媒扩散",
    summary: "灰色渠道用户恐慌性转向 B2B 合规路径，短期需求波动。待核实后可能更新监管矩阵。",
    date: "2026-06-09",
    region: "AU",
    products: ["BPC-157"],
    dimension: "regulatory",
    directionLabel: "执法传闻 · 灰色渠道风险",
    pendingMatrixUpdate: false,
    credibility: "low",
    horizon: "immediate",
    heatImpact: -15,
    regulatoryImpact: 40,
    trend: "down",
  },
  {
    id: "il10",
    source: "platform_2c",
    title: "PeptideHub.com.au 上线 BPC-157 + TB-500 组合包",
    summary: "2C 平台新品上架，定价 AUD 299/套，含处方咨询链接。",
    date: "2026-06-13",
    region: "AU",
    products: ["BPC-157", "TB-500"],
    dimension: "demand",
    directionLabel: "需求信号 · 2C 上新",
    pendingMatrixUpdate: false,
    credibility: "high",
    horizon: "weeks",
    heatImpact: 20,
    regulatoryImpact: 10,
    trend: "up",
  },
  {
    id: "il11",
    source: "platform_2c",
    title: "BioRestore 平台新增 GHK-Cu 精华液 SKU",
    summary: "下游 2C 美容平台扩展品类，月销预估 200+ 单位。",
    date: "2026-06-07",
    region: "AU",
    products: ["GHK-Cu"],
    dimension: "demand",
    directionLabel: "需求信号 · 美容品类扩展",
    pendingMatrixUpdate: false,
    credibility: "high",
    horizon: "weeks",
    heatImpact: 25,
    regulatoryImpact: 0,
    trend: "up",
  },
];

export function getSignalsBySource(
  source: IntelSignal["source"],
  signals: IntelSignal[] = [],
) {
  return signals.filter((s) => s.source === source);
}

export function getSignalsByDimension(
  dimension: SignalDimension,
  signals: IntelSignal[] = [],
) {
  return signals.filter((s) => s.dimension === dimension);
}

export function calcAggregateImpact(signals: IntelSignal[]) {
  if (signals.length === 0) return { heat: 0, regulatory: 0 };
  const heat = Math.round(
    signals.reduce((s, i) => s + (i.heatImpact ?? 0), 0) / signals.length,
  );
  const regulatory = Math.round(
    signals.reduce((s, i) => s + (i.regulatoryImpact ?? 0), 0) / signals.length,
  );
  return { heat, regulatory };
}

/** Count of regulatory-dimension signals (rumor / chatter). Matrix stays separate. */
export function countPendingMatrixUpdates(signals: IntelSignal[] = []) {
  return signals.filter((s) => s.dimension === "regulatory").length;
}
