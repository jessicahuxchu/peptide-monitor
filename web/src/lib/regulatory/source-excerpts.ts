import type { SourceStatusRow } from "./compliance-matrix-v6";

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
const EXCERPTS: Record<string, SourceExcerpt> = {
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
        note: "BPC-157、TB-500 等治疗用途多肽通常落入 S4；进口与配制需处方链路。",
      },
      {
        phrase: "verify the current Federal Register of Legislation",
        note: "矩阵核对必须以 FRL 最新 instrument 文本为准，不可用过期版本。",
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
        note: "无 ARTG 且不符合豁免路径的供应构成未注册治疗品风险。",
      },
      {
        phrase: "Advertising of prescription-only substances to consumers is prohibited",
        note: "B2C 宣传与功效宣称是执法高频点，直接影响 SKU 可达性。",
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
        note: "州级 S4 供应叠加：即使联邦允许进口，NSW 仍可能增加持有/储存要求。",
      },
      {
        phrase: "cold-chain documentation for compounded peptides",
        note: "与平台 NSW 存储协议风险信号直接相关，需同步文件矩阵。",
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
        note: "VIC 配制路径的核心约束：处方来源 + 药房资质。",
      },
      {
        phrase: "unregistered peptide compounding",
        note: "配制注册缺口是本平台 path-b2b 节点的关键文件风险。",
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
        note: "QLD 对 S4 买入/持有的州级 overlay，影响药房迁移决策。",
      },
      {
        phrase: "Migration of compounding activity from NSW to QLD",
        note: "与情报层「悉尼监管收紧 → QLD 迁移」信号一致。",
      },
    ],
  },
};

const FALLBACK_TEMPLATE = (row: SourceStatusRow): SourceExcerpt => ({
  body: `${row.source}\n\nJurisdiction: ${row.jurisdiction}\nPurpose: ${row.purpose}\n\nThis excerpt is a working summary for internal compliance review. Refer to the official source URL for the authoritative legal text. Lawyer review is required before any operational "green light" conclusion.`,
  highlights: [
    {
      phrase: row.purpose,
      note: "本文件在矩阵中的引用目的 — 需律师对照正式法条复核。",
    },
  ],
});

export function getSourceExcerpt(row: SourceStatusRow): SourceExcerpt {
  return EXCERPTS[sourceKey(row)] ?? FALLBACK_TEMPLATE(row);
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
