export function formatDbError(err: unknown, fallback: string): string {
  if (err instanceof Error && err.message) return err.message;
  if (err && typeof err === "object") {
    const record = err as Record<string, unknown>;
    const parts = [record.message, record.details, record.hint]
      .filter((part) => typeof part === "string" && part.length > 0)
      .map(String);
    if (parts.length > 0) return parts.join(" — ");
    if (typeof record.code === "string") return `${record.code}: ${fallback}`;
  }
  if (typeof err === "string" && err.length > 0) return err;
  return fallback;
}

export function dbErrorPayload(err: unknown, fallback: string) {
  const error = formatDbError(err, fallback);
  const payload: { error: string; code?: string; hint?: string } = { error };

  if (err && typeof err === "object") {
    const record = err as Record<string, unknown>;
    if (typeof record.code === "string") payload.code = record.code;
    if (typeof record.hint === "string") payload.hint = record.hint;
  }

  return payload;
}
