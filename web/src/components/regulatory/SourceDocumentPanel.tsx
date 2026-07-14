"use client";

import type { SourceStatusRow } from "@/lib/regulatory/compliance-matrix-v6";
import { getSourceDisplay, localizeJurisdiction, type MatrixLocale } from "@/lib/regulatory/matrix-i18n";
import {
  getSourceExcerpt,
  renderHighlightedExcerpt,
} from "@/lib/regulatory/source-excerpts";

interface SourceDocumentPanelProps {
  source: SourceStatusRow;
  locale: MatrixLocale;
  title: string;
  annotationLabel: string;
  openUrlLabel: string;
  federalLabel: string;
}

export function SourceDocumentPanel({
  source,
  locale,
  title,
  annotationLabel,
  openUrlLabel,
  federalLabel,
}: SourceDocumentPanelProps) {
  const display = getSourceDisplay(source, locale);
  const excerpt = getSourceExcerpt(source, locale);
  const { segments } = renderHighlightedExcerpt(excerpt);

  return (
    <div className="space-y-3 text-sm">
      <div>
        <p className="text-xs font-semibold text-command-teal-bright">{display.name}</p>
        <p className="mt-0.5 text-[10px] text-command-text-muted">
          {localizeJurisdiction(source.jurisdiction, locale, federalLabel)} · {source.asOf}
        </p>
      </div>

      <div className="max-h-[420px] overflow-y-auto rounded-lg border border-command-border bg-[#050505] p-3">
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-command-text-muted">
          {title}
        </p>
        <div className="whitespace-pre-wrap text-xs leading-relaxed text-command-text-secondary">
          {segments.map((seg, i) =>
            seg.highlight ? (
              <mark
                key={i}
                className="rounded-sm bg-yellow-400/35 px-0.5 text-command-text"
                title={seg.highlight.note}
              >
                {seg.text}
              </mark>
            ) : (
              <span key={i}>{seg.text}</span>
            ),
          )}
        </div>
      </div>

      {excerpt.highlights.length > 0 && (
        <div className="space-y-2">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-command-text-muted">
            {annotationLabel}
          </p>
          {excerpt.highlights.map((h) => (
            <div
              key={h.phrase}
              className="rounded-lg border border-yellow-500/25 bg-yellow-500/5 p-2.5"
            >
              <p className="line-clamp-2 text-[10px] font-medium text-yellow-200/90">
                「{h.phrase}」
              </p>
              <p className="mt-1 text-xs text-command-text-secondary">{h.note}</p>
            </div>
          ))}
        </div>
      )}

      {source.url && (
        <a
          href={source.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block text-xs text-command-teal-bright hover:underline"
        >
          {openUrlLabel} →
        </a>
      )}
    </div>
  );
}
