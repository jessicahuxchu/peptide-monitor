import type { SourceStatusRow } from "./compliance-matrix-v6";
import { getSourceDisplay, type MatrixLocale } from "./matrix-i18n";

export interface SourceHighlight {
  phrase: string;
  note: string;
}

export interface SourceExcerpt {
  body: string;
  highlights: SourceHighlight[];
}

function sourceKey(row: Pick<SourceStatusRow, "jurisdiction" | "source">): string {
  return `${row.jurisdiction}::${row.source}`;
}

/** Curated legislative excerpts with highlight annotations for the sources tab. */
const EXCERPTS_EN: Record<string, SourceExcerpt> = {
  "Federal::Poisons Standard / SUSMP": {
    body: `The Poisons Standard (also known as the Standard for the Uniform Scheduling of Medicines and Poisons, SUSMP) is a legislative instrument made under the Therapeutic Goods Act 1989.

Schedule 4 (S4) — Prescription Only Medicine
A substance specified in this Schedule is a prescription-only medicine. Supply is restricted to authorised prescribers and pharmacists in accordance with State and Territory poisons legislation.

Schedule 3 (S3) — Pharmacist Only Medicine
Where applicable, supply requires pharmacist intervention. Cosmetic or research-use claims must be assessed against therapeutic goods boundaries.

For peptide APIs and compounded preparations, classification depends on schedule entry, intended therapeutic use, and route of administration. Importers must verify the current Federal Register of Legislation (FRL) instrument text before relying on any schedule position.`,
    highlights: [
      {
        phrase: "Schedule 4 (S4) — Prescription Only Medicine",
        note: "Therapeutic peptides such as BPC-157 and TB-500 usually fall under Schedule 4; import and compounding need a prescription chain.",
      },
      {
        phrase: "verify the current Federal Register of Legislation",
        note: "Matrix checks must rely on the latest FRL instrument text, not outdated versions.",
      },
    ],
  },
  "Federal::TGA unapproved therapeutic goods / advertising / ARTG pathways": {
    body: `Therapeutic Goods Act 1989 — Unapproved therapeutic goods
A therapeutic good must be included in the Australian Register of Therapeutic Goods (ARTG) before lawful supply in Australia, unless a valid exemption applies (e.g. compounding for an individual patient under applicable frameworks, clinical trial, or authorised access pathway).

Advertising of prescription-only substances to consumers is prohibited. Claims relating to injury repair, performance enhancement, or disease treatment may re-classify a product from cosmetic/research boundary into therapeutic goods.

Importers and compounders should monitor TGA compliance updates, infringement notices, and border enforcement actions affecting unapproved peptide products.`,
    highlights: [
      {
        phrase: "included in the Australian Register of Therapeutic Goods (ARTG)",
        note: "Supply without ARTG listing or a valid exemption creates unregistered therapeutic goods risk.",
      },
      {
        phrase: "Advertising of prescription-only substances to consumers is prohibited",
        note: "Consumer advertising and efficacy claims are high-enforcement risks and affect SKU reachability.",
      },
    ],
  },
  "NSW::Poisons and Therapeutic Goods Act 1966 No 31": {
    body: `Poisons and Therapeutic Goods Act 1966 (NSW)

Section 16 — Restricted substances
A person must not possess a restricted substance unless authorised by regulation or licence.

Section 17A — Supply of restricted substances
Supply of Schedule 4 substances is restricted to authorised prescribers, pharmacists, and persons acting in accordance with the Poisons and Therapeutic Goods Regulation.

State storage, record-keeping, and compounding pharmacy obligations may exceed federal baseline. NSW Health may issue updated guidance on cold-chain documentation for compounded peptides.`,
    highlights: [
      {
        phrase: "Section 17A — Supply of restricted substances",
        note: "State Schedule 4 supply overlay: even if federal import is allowed, NSW may add possession/storage requirements.",
      },
      {
        phrase: "cold-chain documentation for compounded peptides",
        note: "Linked to NSW storage-protocol risk signals; keep document matrix in sync.",
      },
    ],
  },
  "VIC::Drugs, Poisons and Controlled Substances Act 1981": {
    body: `Drugs, Poisons and Controlled Substances Act 1981 (Vic)

Part 3 — Poisons and controlled substances
The Secretary may make Poisons Code provisions adopting Standard for the Uniform Scheduling of Medicines and Poisons with Victorian modifications.

Schedule 4 poisons may only be supplied on prescription or in accordance with statutory authority. Wholesale, compounding, and possession offences apply where licence or authorisation is absent.

Victorian compounding pharmacies must maintain registration and storage compliance; enforcement may target unregistered peptide compounding.`,
    highlights: [
      {
        phrase: "Schedule 4 poisons may only be supplied on prescription",
        note: "Core VIC compounding constraint: prescription source plus pharmacy credentials.",
      },
      {
        phrase: "unregistered peptide compounding",
        note: "Compounding registration gaps are a key document risk for B2B path nodes.",
      },
    ],
  },
  "QLD::Medicines and Poisons Act 2019": {
    body: `Medicines and Poisons Act 2019 (Qld)

Chapter 4 — Regulated substances
Sections 34–35 regulate purchase, possession, and supply of Schedule 4 medicines. Stock custody and record requirements apply to wholesalers and pharmacies.

QLD may impose additional obligations on regulated substances storage and security compared with other states. Migration of compounding activity from NSW to QLD should be assessed against QLD licence and premises requirements.`,
    highlights: [
      {
        phrase: "Sections 34–35 regulate purchase, possession, and supply of Schedule 4",
        note: "QLD state overlay on Schedule 4 purchase/possession; affects pharmacy migration decisions.",
      },
      {
        phrase: "Migration of compounding activity from NSW to QLD",
        note: "Aligns with intel signals about Sydney regulatory tightening and potential QLD migration.",
      },
    ],
  },
};

const EXCERPTS_ZH: Record<string, SourceExcerpt> = {
  "Federal::Poisons Standard / SUSMP": {
    body: `《毒物标准》（又称《统一药品与毒物附表标准》）是依据《1989年治疗用品法》制定的立法文书。

附表四——仅限处方药
列入该附表的物质为仅限处方药。供应仅限于获授权开方者与药剂师，并须遵守各州与领地毒物法规。

附表三——仅限药剂师药
适用情况下，供应须经药剂师介入。化妆品或研究用途宣称须对照治疗用品边界评估。

多肽原料与复方制剂的分类，取决于附表条目、预期治疗用途与给药途径。进口商在援引任何附表结论前，须核对联邦立法登记册最新文书文本。`,
    highlights: [
      {
        phrase: "附表四——仅限处方药",
        note: "BPC-157、TB-500 等治疗用途多肽通常落入附表四；进口与配制需处方链路。",
      },
      {
        phrase: "须核对联邦立法登记册最新文书文本",
        note: "矩阵核对必须以联邦立法登记册最新文书为准，不可用过期版本。",
      },
    ],
  },
  "Federal::TGA unapproved therapeutic goods / advertising / ARTG pathways": {
    body: `《1989年治疗用品法》——未注册治疗用品
治疗用品须列入澳大利亚治疗用品登记册后，方可在澳合法供应，除非适用有效豁免（例如为个别患者配制、临床试验或获批准入路径）。

禁止向消费者广告仅限处方物质。涉及损伤修复、运动表现增强或疾病治疗的宣称，可能使产品从化妆品或研究边界重新归入治疗用品。

进口商与配制方应持续关注治疗用品管理局合规更新、处罚通知及针对未批准多肽产品的边境执法。`,
    highlights: [
      {
        phrase: "须列入澳大利亚治疗用品登记册后，方可在澳合法供应",
        note: "无登记且不符合豁免路径的供应构成未注册治疗品风险。",
      },
      {
        phrase: "禁止向消费者广告仅限处方物质",
        note: "面向消费者的宣传与功效宣称是执法高频点，直接影响品项可达性。",
      },
    ],
  },
  "NSW::Poisons and Therapeutic Goods Act 1966 No 31": {
    body: `《1966年毒物与治疗用品法》（新南威尔士州）

第16条——限制物质
任何人不得持有限制物质，除非获得条例或许可授权。

第17A条——限制物质的供应
附表四物质的供应仅限于获授权开方者、药剂师，以及依《毒物与治疗用品条例》行事的人员。

州级储存、记录与配制药房义务可严于联邦基线。新州卫生厅可能更新复方多肽冷链文件指引。`,
    highlights: [
      {
        phrase: "第17A条——限制物质的供应",
        note: "州级附表四供应叠加：即使联邦允许进口，新州仍可能增加持有或储存要求。",
      },
      {
        phrase: "复方多肽冷链文件指引",
        note: "与平台新州存储协议风险信号直接相关，需同步文件矩阵。",
      },
    ],
  },
  "VIC::Drugs, Poisons and Controlled Substances Act 1981": {
    body: `《1981年毒品、毒物与受控物质法》（维多利亚州）

第3部分——毒物与受控物质
部长可制定《毒物法典》条款，采纳《统一药品与毒物附表标准》并加以维多利亚州调整。

附表四毒物仅可凭处方或依法定授权供应。无许可或授权时，批发、配制与持有均可构成违法。

维多利亚州配制药房须维持注册与储存合规；执法可能重点针对未注册多肽配制。`,
    highlights: [
      {
        phrase: "附表四毒物仅可凭处方或依法定授权供应",
        note: "维多利亚州配制路径的核心约束：处方来源与药房资质。",
      },
      {
        phrase: "未注册多肽配制",
        note: "配制注册缺口是本平台企业路径节点的关键文件风险。",
      },
    ],
  },
  "QLD::Medicines and Poisons Act 2019": {
    body: `《2019年药品与毒物法》（昆士兰州）

第4章——受管制物质
第34至35条规范附表四药品的购入、持有与供应。批发商与药房适用库存保管与记录要求。

相对其他州，昆州可能对受管制物质的储存与安保施加额外义务。若配制业务自新州迁至昆州，应对照昆州许可与场所要求评估。`,
    highlights: [
      {
        phrase: "第34至35条规范附表四药品的购入、持有与供应",
        note: "昆州对附表四购入或持有的州级叠加，影响药房迁移决策。",
      },
      {
        phrase: "若配制业务自新州迁至昆州",
        note: "与情报层「悉尼监管收紧 → 迁往昆州」信号一致。",
      },
    ],
  },
};

function fallbackTemplate(row: SourceStatusRow, locale: MatrixLocale): SourceExcerpt {
  const display = getSourceDisplay(row, locale);
  if (locale === "zh") {
    return {
      body: `${display.name}\n\n辖区：${row.jurisdiction}\n用途：${display.purpose}\n\n本摘录为内部合规审阅用工作摘要。正式法条以官方来源链接为准。作出任何经营放行结论前须经律师复核。`,
      highlights: [
        {
          phrase: display.purpose,
          note: "本文件在矩阵中的引用目的——需律师对照正式法条复核。",
        },
      ],
    };
  }
  return {
    body: `${row.source}\n\nJurisdiction: ${row.jurisdiction}\nPurpose: ${row.purpose}\n\nThis excerpt is a working summary for internal compliance review. Refer to the official source URL for the authoritative legal text. Lawyer review is required before any operational "green light" conclusion.`,
    highlights: [
      {
        phrase: row.purpose,
        note: "Purpose of this citation in the matrix — confirm against the official statute with counsel.",
      },
    ],
  };
}

export function getSourceExcerpt(
  row: SourceStatusRow,
  locale: MatrixLocale = "en",
): SourceExcerpt {
  const key = sourceKey(row);
  const pool = locale === "zh" ? EXCERPTS_ZH : EXCERPTS_EN;
  return pool[key] ?? fallbackTemplate(row, locale);
}

export function renderHighlightedExcerpt(excerpt: SourceExcerpt): {
  segments: { text: string; highlight?: SourceHighlight }[];
} {
  const segments: { text: string; highlight?: SourceHighlight }[] = [];
  let remaining = excerpt.body;

  while (remaining.length > 0) {
    let earliest: { index: number; highlight: SourceHighlight } | null = null;
    for (const h of excerpt.highlights) {
      const index = remaining.indexOf(h.phrase);
      if (index === -1) continue;
      if (!earliest || index < earliest.index) {
        earliest = { index, highlight: h };
      }
    }

    if (!earliest) {
      segments.push({ text: remaining });
      break;
    }

    if (earliest.index > 0) {
      segments.push({ text: remaining.slice(0, earliest.index) });
    }
    segments.push({
      text: earliest.highlight.phrase,
      highlight: earliest.highlight,
    });
    remaining = remaining.slice(earliest.index + earliest.highlight.phrase.length);
  }

  return { segments };
}
