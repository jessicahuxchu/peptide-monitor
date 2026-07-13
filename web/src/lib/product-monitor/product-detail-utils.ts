/** Merge tier action, stocking logic, and spec notes into one summary block. */
export function buildStrategicSummary(
  actionAdvice: string | undefined,
  stockingLogic: string | undefined,
  specNotes: string | undefined,
): string | undefined {
  const parts: string[] = [];

  if (actionAdvice?.trim()) {
    parts.push(
      actionAdvice
        .trim()
        .replace(/^Suggest\s+[^—–-]+[—–-]\s*/i, "")
        .replace(/^建议[^—–-]+[—–-]\s*/, ""),
    );
  }
  if (stockingLogic?.trim()) parts.push(stockingLogic.trim());
  if (specNotes?.trim()) parts.push(specNotes.trim());

  if (parts.length === 0) return undefined;
  return parts.join(" ");
}

export interface MarketSpecItem {
  form: string;
  dosage?: string;
  isConsensus: boolean;
}

const FORM_KEYWORDS: [RegExp, string][] = [
  [/capsules?|胶囊/i, "胶囊"],
  [/spray|喷雾/i, "喷雾"],
  [/biostrip/i, "BioStrips"],
  [/strip/i, "BioStrips"],
  [/cream|面霜/i, "面霜"],
  [/serum|精华/i, "精华"],
  [/tablet/i, "片剂"],
  [/预混冻干/i, "预混冻干粉"],
  [/冻干|lyoph/i, "冻干粉"],
];

function isConsensusSpec(spec: string, consensusSpec: string): boolean {
  if (consensusSpec.includes(spec)) return true;
  const firstSegment = consensusSpec.split("、")[0]?.trim() ?? "";
  return spec === firstSegment || firstSegment.startsWith(`${spec} `);
}

function inferFormFromSpec(
  spec: string,
  consensusSpec: string,
  forms: string[],
): { form: string; dosage?: string } {
  for (const [pattern, form] of FORM_KEYWORDS) {
    if (pattern.test(spec)) {
      const dosage = spec.replace(pattern, "").replace(/\s+/g, " ").trim() || undefined;
      return { form, dosage };
    }
  }

  const segments = consensusSpec
    .split(/[、,;]/)
    .map((s) => s.trim())
    .filter(Boolean);
  const match = segments.find(
    (seg) => seg === spec || seg.startsWith(`${spec} `) || seg.includes(spec),
  );
  if (match) {
    const formPart = match.replace(spec, "").trim();
    const form =
      formPart ||
      forms.find((f) => /冻干|lyoph/i.test(f)) ||
      forms[0] ||
      spec;
    return { form, dosage: /mg|mcg|µg|ug/i.test(spec) ? spec : undefined };
  }

  if (/mg|mcg|µg|ug/i.test(spec)) {
    const lyoph = forms.find((f) => /冻干|lyoph/i.test(f)) || "冻干粉";
    return { form: lyoph, dosage: spec };
  }

  return { form: spec };
}

/** Build per-form market spec rows; unmatched forms appear as standalone entries. */
export function buildMarketSpecItems(
  primarySpecs: string[],
  consensusSpec: string,
  forms: string[] = [],
): MarketSpecItem[] {
  const items: MarketSpecItem[] = [];
  const usedForms = new Set<string>();

  for (const spec of primarySpecs) {
    const { form, dosage } = inferFormFromSpec(spec, consensusSpec, forms);
    items.push({
      form,
      dosage,
      isConsensus: isConsensusSpec(spec, consensusSpec),
    });
    usedForms.add(form);
  }

  for (const form of forms) {
    if (!usedForms.has(form)) {
      items.push({ form, isConsensus: false });
    }
  }

  return items;
}
