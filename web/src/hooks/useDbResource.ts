"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export function useDbResource<T>(endpoint: string, fallback: T) {
  const [data, setData] = useState<T>(fallback);
  const [usingDb, setUsingDb] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fallbackRef = useRef(fallback);
  fallbackRef.current = fallback;

  const load = useCallback(
    async (signal?: AbortSignal) => {
      setLoading(true);
      try {
        const res = await fetch(endpoint, {
          cache: "no-store",
          signal,
          headers: { "Cache-Control": "no-cache" },
        });

        if (signal?.aborted) return;

        if (res.status === 503) {
          setUsingDb(false);
          setData(fallbackRef.current);
          setError(null);
          return;
        }

        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error ?? "Failed to load data");
        }

        const json = (await res.json()) as T;
        if (signal?.aborted) return;

        setData(json);
        setUsingDb(true);
        setError(null);
      } catch (e) {
        if (e instanceof DOMException && e.name === "AbortError") return;
        if (signal?.aborted) return;
        setUsingDb(false);
        setData(fallbackRef.current);
        setError(e instanceof Error ? e.message : "Load failed");
      } finally {
        if (!signal?.aborted) {
          setLoading(false);
        }
      }
    },
    [endpoint],
  );

  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal);
    return () => controller.abort();
  }, [load]);

  const reload = useCallback(() => load(), [load]);

  return { data, usingDb, loading, error, reload };
}
