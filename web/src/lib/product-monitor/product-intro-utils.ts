import type { LocalizedText } from "./types";

export function introFullForLocale(
  intro: LocalizedText | undefined,
  locale: string,
): string | undefined {
  if (!intro) return undefined;
  return locale.startsWith("zh") ? intro.zh : intro.en;
}

/** Short table-cell copy; falls back to first sentence of full intro. */
export function introBriefForLocale(
  intro: LocalizedText | undefined,
  locale: string,
): string | undefined {
  if (!intro) return undefined;
  const zh = locale.startsWith("zh");
  if (intro.brief) return zh ? intro.brief.zh : intro.brief.en;

  const full = zh ? intro.zh : intro.en;
  const parts = full.split(zh ? "。" : ". ");
  const first = parts[0]?.trim();
  if (!first) return full;
  return zh ? `${first}。` : `${first}.`;
}
