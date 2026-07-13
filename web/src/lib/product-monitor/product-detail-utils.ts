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

/** Resolve a market spec variant to its full form description (e.g. 50mg → 50mg 冻干粉). */
export function resolveSpecVariantLabel(
  spec: string,
  consensusSpec: string,
  forms: string[] = [],
): string {
  const segments = consensusSpec
    .split(/[、,;]/)
    .map((s) => s.trim())
    .filter(Boolean);

  const exact = segments.find(
    (seg) => seg === spec || seg.startsWith(`${spec} `) || seg.startsWith(`${spec}\u00A0`),
  );
  if (exact) return exact;

  const partial = segments.find((seg) => seg.includes(spec));
  if (partial) return partial;

  if (/capsule|tablet|喷雾|精华|面霜|cream|serum|spray|strip|胶囊/i.test(spec)) {
    return spec;
  }

  if (forms.length === 1) {
    return `${spec} ${forms[0]}`;
  }

  const lyophilized = forms.find((f) => /冻干|lyoph/i.test(f));
  if (lyophilized && /mg|mcg|µg|ug/i.test(spec)) {
    return `${spec} ${lyophilized}`;
  }

  return spec;
}

export function specVariantFormLabel(
  spec: string,
  resolvedLabel: string,
  forms: string[] = [],
): string {
  if (resolvedLabel !== spec) {
    const suffix = resolvedLabel.startsWith(spec)
      ? resolvedLabel.slice(spec.length).trim()
      : resolvedLabel;
    if (suffix) return suffix;
  }

  if (forms.length > 0) {
    return forms.join("、");
  }

  return "—";
}
