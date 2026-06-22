"use client";

import { useCallback, useEffect, useState } from "react";

export function useDbResource<T>(endpoint: string, fallback: T) {
  const [data, setData] = useState<T>(fallback);
  const [usingDb, setUsingDb] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(endpoint);
      if (res.status === 503) {
        setUsingDb(false);
        setData(fallback);
        setError(null);
        return;
      }
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Failed to load data");
      }
      const json = (await res.json()) as T;
      setData(json);
      setUsingDb(true);
      setError(null);
    } catch (e) {
      setUsingDb(false);
      setData(fallback);
      setError(e instanceof Error ? e.message : "Load failed");
    } finally {
      setLoading(false);
    }
  }, [endpoint, fallback]);

  useEffect(() => {
    load();
  }, [load]);

  return { data, usingDb, loading, error, reload: load };
}
