import type {
  MatrixCellV6,
  SourceStatusRow,
  StateFrameworkRow,
} from "./compliance-matrix-v6";

export type MatrixLocale = "zh" | "en";

type SourceZh = {
  name: string;
  purpose: string;
  reviewStatus: string;
};

type FrameworkZh = {
  regulator: string;
  overlay: string;
  difference: string;
  action: string;
};

const SOURCE_ZH: Record<string, SourceZh> = {
  "Federal::Poisons Standard / SUSMP": {
    name: "《毒物标准》（统一药品与毒物附表标准）",
    purpose: "核对附表与产品名称；最终以联邦立法登记册最新文书复核。",
    reviewStatus: "待律师复核",
  },
  "Federal::TGA unapproved therapeutic goods / advertising / ARTG pathways": {
    name: "治疗用品管理局：未注册治疗品 / 广告 / 登记册路径",
    purpose: "治疗用品、未注册治疗品与处方药广告监管基线；需持续监控。",
    reviewStatus: "持续监控",
  },
  "NSW::Poisons and Therapeutic Goods Act 1966 No 31": {
    name: "《1966年毒物与治疗用品法》第31号",
    purpose: "第16/17A条：限制物质的持有与取得。",
    reviewStatus: "待律师复核",
  },
  "VIC::Drugs, Poisons and Controlled Substances Act 1981": {
    name: "《1981年毒品、毒物与受控物质法》",
    purpose: "毒物法典、附表四毒物、许可与授权人员框架。",
    reviewStatus: "待律师复核",
  },
  "QLD::Medicines and Poisons Act 2019": {
    name: "《2019年药品与毒物法》",
    purpose: "第34/35条：附表四的购入、持有、供应与库存保管。",
    reviewStatus: "待律师复核",
  },
  "WA::Medicines and Poisons Act 2014 / Regulations 2016": {
    name: "《2014年药品与毒物法》及2016年条例",
    purpose: "西澳许可、批发记录、标签与储存要求。",
    reviewStatus: "待律师复核",
  },
  "SA::Controlled Substances Act 1984; Controlled Substances (Poisons) Regulations 2026": {
    name: "《1984年受控物质法》及2026年毒物条例",
    purpose: "南澳法案与毒物条例；需律师确认最新生效文本。",
    reviewStatus: "法规更新中",
  },
  "TAS::Poisons Act 1971 / Poisons Regulations": {
    name: "《1971年毒物法》及毒物条例",
    purpose: "附表四处方药的持有、供应与使用。",
    reviewStatus: "待律师复核",
  },
  "ACT::Medicines, Poisons and Therapeutic Goods Act 2008": {
    name: "《2008年药品、毒物与治疗用品法》",
    purpose: "受管制物质的供应、处方、施用与持有授权。",
    reviewStatus: "待律师复核",
  },
  "NT::Medicines, Poisons and Therapeutic Goods Act 2012": {
    name: "《2012年药品、毒物与治疗用品法》",
    purpose: "获认可执业者、许可及偏远地区供应。",
    reviewStatus: "待律师复核",
  },
};

const FRAMEWORK_ZH: Record<string, FrameworkZh> = {
  Federal: {
    regulator: "治疗用品管理局 / 毒物标准",
    overlay: "全国基线",
    difference: "全国共同底线",
    action:
      "先弄清三点：是不是附表四、有没有登记或豁免、能走哪条合法途径（处方、临床、研究或批发）。不要对消费者做治疗功效宣传。",
  },
  NSW: {
    regulator: "新南威尔士州卫生厅",
    overlay: "附表四限制物质叠加",
    difference: "比联邦更严：持有与取得需新州本地授权",
    action:
      "入新州前确认对方有合法资质（批发、药房、开方或研究）。若是复方，还要备齐配制记录、冷链证明和批次档案。",
  },
  VIC: {
    regulator: "维多利亚州卫生与公共服务部",
    overlay: "附表四毒物/许可叠加",
    difference: "比联邦更严：须维多利亚州授权人员或许可",
    action: "须有维州认可人员或许可，并走药房渠道；不能摆到普通柜台零售或陈列。",
  },
  QLD: {
    regulator: "昆士兰州卫生厅",
    overlay: "附表四受管制物质/保管叠加",
    difference: "比联邦更严：无处方权不得持有未分配库存",
    action: "没有开方权就不能囤未分配库存。要能说清谁开方、谁供货，以及有没有本地授权。",
  },
  WA: {
    regulator: "西澳大利亚州卫生厅",
    overlay: "许可叠加",
    difference: "比联邦更严：批发与储存须西澳许可",
    action: "确认西澳毒物许可齐全，批发记录、标签和仓储要求一并跟上。",
  },
  SA: {
    regulator: "南澳大利亚州卫生厅",
    overlay: "受控物质叠加",
    difference: "比联邦更严：配制与批发须南澳授权",
    action: "核对客户资质、处方或订单链条、配制依据，以及批发商许可是否齐全。",
  },
  TAS: {
    regulator: "塔斯马尼亚州卫生厅",
    overlay: "无分类增量（本地授权仍需核验）",
    difference: "同联邦",
    action: "按联邦要求执行；发货前确认塔州收货人有本地授权。",
  },
  ACT: {
    regulator: "澳大利亚首都领地卫生厅",
    overlay: "无分类增量（本地授权仍需核验）",
    difference: "同联邦",
    action: "按联邦要求执行；货发到首都领地时，收货地授权也要一并确认。",
  },
  NT: {
    regulator: "北领地卫生厅",
    overlay: "无分类增量（本地授权仍需核验）",
    difference: "同联邦",
    action: "按联邦要求执行；偏远诊所、机构或研究项目建议一事一查。",
  },
};

const FRAMEWORK_EN: Record<string, FrameworkZh> = {
  Federal: {
    regulator: "TGA / Poisons Standard",
    overlay: "National baseline",
    difference: "Shared national floor",
    action:
      "Confirm Schedule 4 naming or implied S4 status, ARTG listing/exemption, and prescription/clinical/research/wholesale pathways; no consumer therapeutic marketing",
  },
  NSW: {
    regulator: "NSW Health",
    overlay: "S4 restricted substance overlay",
    difference: "Stricter than federal: possession/acquisition needs NSW local authority",
    action:
      "Verify NSW wholesale/pharmacy/prescription/research authority; for blends add compounding, cold-chain stability, and batch records",
  },
  VIC: {
    regulator: "DHHS VIC",
    overlay: "S4 poison / permit overlay",
    difference: "Stricter than federal: needs VIC authorised person or licence/permit",
    action:
      "Verify VIC authorised person, pharmacy pathway or licence/permit; no non-pharmacy retail/display",
  },
  QLD: {
    regulator: "Queensland Health",
    overlay: "S4 regulated substance / custody overlay",
    difference: "Stricter than federal: no unallocated stock without prescribing rights",
    action:
      "Non-prescribers must not hold unallocated stock; confirm prescriber/supplier control and local authority",
  },
  WA: {
    regulator: "WA Health",
    overlay: "Licence / permit overlay",
    difference: "Stricter than federal: wholesale/storage needs WA licence/permit",
    action: "Verify WA poisons licence/permit, wholesale records, labelling, and storage SOP",
  },
  SA: {
    regulator: "SA Health",
    overlay: "Controlled substances overlay",
    difference: "Stricter than federal: compounding/wholesale needs SA authority",
    action:
      "Verify customer credentials, prescription/order chain, compounding basis, and wholesaler licence",
  },
  TAS: {
    regulator: "Tasmania Health",
    overlay: "No classification delta (local authority still required)",
    difference: "Same as federal",
    action: "Follow federal baseline; verify TAS recipient local authority before dispatch",
  },
  ACT: {
    regulator: "ACT Health",
    overlay: "No classification delta (local authority still required)",
    difference: "Same as federal",
    action: "Follow federal baseline; for interstate dispatch also verify ACT destination authority",
  },
  NT: {
    regulator: "NT Health",
    overlay: "No classification delta (local authority still required)",
    difference: "Same as federal",
    action: "Follow federal baseline; verify remote clinic/institution/research projects case by case",
  },
};

/** Longer phrase first to avoid partial replacements. */
const CLASSIFICATION_ZH: [string, string][] = [
  [
    "S4 / Unregistered + S4 regulated substance / custody overlay",
    "附表四 / 未注册 + 附表四受管制物质/保管叠加",
  ],
  [
    "S4 / Unregistered + S4 poison / permit overlay",
    "附表四 / 未注册 + 附表四毒物/许可叠加",
  ],
  [
    "S4 / Unregistered + S4 restricted substance overlay",
    "附表四 / 未注册 + 附表四限制物质叠加",
  ],
  [
    "S4 / Unregistered + Controlled substances overlay",
    "附表四 / 未注册 + 受控物质叠加",
  ],
  ["S4 / Unregistered + Licence / permit overlay", "附表四 / 未注册 + 许可叠加"],
  ["Inherited S4 / Unregistered", "继承附表四 / 未注册"],
  ["S4 / Compounded medicine", "附表四 / 复方药"],
  ["S4 / Prescription peptide", "附表四 / 处方肽"],
  ["Cosmetic boundary（待定性）", "化妆品边界（待定性）"],
  ["S4 / Unregistered", "附表四 / 未注册"],
];

const REGULATOR_ZH: [string, string][] = [
  ["TGA / Poisons Standard", "治疗用品管理局 / 毒物标准"],
  ["Queensland Health", "昆士兰州卫生厅"],
  ["Tasmania Health", "塔斯马尼亚州卫生厅"],
  ["NSW Health", "新南威尔士州卫生厅"],
  ["ACT Health", "澳大利亚首都领地卫生厅"],
  ["NT Health", "北领地卫生厅"],
  ["WA Health", "西澳大利亚州卫生厅"],
  ["SA Health", "南澳大利亚州卫生厅"],
  ["DHHS VIC", "维多利亚州卫生与公共服务部"],
];

const CONSEQUENCE_ZH: [string, string][] = [
  ["authorised person", "授权人员"],
  ["licence/permit", "许可"],
  ["stock", "库存"],
  ["SOP", "作业规程"],
  ["RUO", "仅供研究用途"],
  ["ARTG", "治疗用品登记册"],
  ["S4", "附表四"],
];

function sourceKey(row: Pick<SourceStatusRow, "jurisdiction" | "source">): string {
  return `${row.jurisdiction}::${row.source}`;
}

function applyReplacements(text: string, pairs: [string, string][]): string {
  let out = text;
  for (const [from, to] of pairs) {
    out = out.split(from).join(to);
  }
  return out;
}

/** Display fields only — keep `source` identity keys unchanged for excerpt lookup. */
export function getSourceDisplay(
  row: SourceStatusRow,
  locale: MatrixLocale,
): { name: string; purpose: string; reviewStatus: string } {
  if (locale === "zh") {
    const zh = SOURCE_ZH[sourceKey(row)];
    if (zh) return zh;
  }
  return {
    name: row.source,
    purpose: row.purpose,
    reviewStatus: row.reviewStatus,
  };
}

export function localizeFramework(
  row: StateFrameworkRow,
  locale: MatrixLocale,
): StateFrameworkRow {
  const mapped = (locale === "zh" ? FRAMEWORK_ZH : FRAMEWORK_EN)[row.jurisdiction];
  if (!mapped) return row;
  return {
    ...row,
    regulator: mapped.regulator,
    incrementalClassification: mapped.overlay,
    difference: mapped.difference,
    action: mapped.action,
  };
}

/** Shared handling text for a jurisdiction (decision matrix first row + detail panel). */
export function localizeRegionHandling(region: string, locale: MatrixLocale): string {
  const mapped = (locale === "zh" ? FRAMEWORK_ZH : FRAMEWORK_EN)[region];
  return mapped?.action ?? "";
}

export function localizeClassification(text: string, locale: MatrixLocale): string {
  if (locale !== "zh") return text;
  return applyReplacements(text, CLASSIFICATION_ZH);
}

export function localizeRegulator(text: string, locale: MatrixLocale): string {
  if (locale !== "zh") return text;
  return applyReplacements(text, REGULATOR_ZH);
}

export function localizeConsequence(text: string, locale: MatrixLocale): string {
  if (locale !== "zh") return text;
  return applyReplacements(text, CONSEQUENCE_ZH);
}

export function localizeMatrixCell(cell: MatrixCellV6, locale: MatrixLocale): MatrixCellV6 {
  if (locale !== "zh") return cell;
  return {
    ...cell,
    classification: localizeClassification(cell.classification, locale),
    regulator: localizeRegulator(cell.regulator, locale),
    operationalConsequence: localizeConsequence(cell.operationalConsequence, locale),
  };
}

export function riskLevelLabel(
  level: "low" | "medium" | "high",
  locale: MatrixLocale,
  compact = false,
): string {
  if (locale === "zh") {
    if (compact) return level === "low" ? "低" : level === "medium" ? "中" : "高";
    return level === "low" ? "绿（低）" : level === "medium" ? "橙（中）" : "红（高）";
  }
  if (compact) return level === "low" ? "Low" : level === "medium" ? "Med" : "High";
  return level === "low" ? "Green (Low)" : level === "medium" ? "Orange (Med)" : "Red (High)";
}

const JURISDICTION_ZH: Record<string, string> = {
  NSW: "新南威尔士（NSW）",
  VIC: "维多利亚（VIC）",
  QLD: "昆士兰（QLD）",
  WA: "西澳大利亚（WA）",
  SA: "南澳大利亚（SA）",
  TAS: "塔斯马尼亚（TAS）",
  ACT: "首都领地（ACT）",
  NT: "北领地（NT）",
  AL: "阿拉巴马（AL）",
  AK: "阿拉斯加（AK）",
  AZ: "亚利桑那（AZ）",
  AR: "阿肯色（AR）",
  CA: "加利福尼亚（CA）",
  CO: "科罗拉多（CO）",
  CT: "康涅狄格（CT）",
  DE: "特拉华（DE）",
  FL: "佛罗里达（FL）",
  GA: "佐治亚（GA）",
  HI: "夏威夷（HI）",
  ID: "爱达荷（ID）",
  IL: "伊利诺伊（IL）",
  IN: "印第安纳（IN）",
  IA: "艾奥瓦（IA）",
  KS: "堪萨斯（KS）",
  KY: "肯塔基（KY）",
  LA: "路易斯安那（LA）",
  ME: "缅因（ME）",
  MD: "马里兰（MD）",
  MA: "马萨诸塞（MA）",
  MI: "密歇根（MI）",
  MN: "明尼苏达（MN）",
  MS: "密西西比（MS）",
  MO: "密苏里（MO）",
  MT: "蒙大拿（MT）",
  NE: "内布拉斯加（NE）",
  NV: "内华达（NV）",
  NH: "新罕布什尔（NH）",
  NJ: "新泽西（NJ）",
  NM: "新墨西哥（NM）",
  NY: "纽约（NY）",
  NC: "北卡罗来纳（NC）",
  ND: "北达科他（ND）",
  OH: "俄亥俄（OH）",
  OK: "俄克拉何马（OK）",
  OR: "俄勒冈（OR）",
  PA: "宾夕法尼亚（PA）",
  RI: "罗得岛（RI）",
  SC: "南卡罗来纳（SC）",
  SD: "南达科他（SD）",
  TN: "田纳西（TN）",
  TX: "得克萨斯（TX）",
  UT: "犹他（UT）",
  VT: "佛蒙特（VT）",
  VA: "弗吉尼亚（VA）",
  WV: "西弗吉尼亚（WV）",
  WI: "威斯康星（WI）",
  WY: "怀俄明（WY）",
};

export function localizeJurisdiction(
  code: string,
  locale: MatrixLocale,
  federalLabel: string,
  market: "au" | "us" = "au",
): string {
  if (code === "Federal") return federalLabel;
  if (locale !== "zh") return code;
  // WA is shared abbreviation: AU Western Australia vs US Washington
  if (code === "WA" && market === "us") return "华盛顿（WA）";
  return JURISDICTION_ZH[code] ?? code;
}
