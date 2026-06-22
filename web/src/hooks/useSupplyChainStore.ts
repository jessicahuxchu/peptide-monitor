"use client";

import { useCallback, useEffect, useState } from "react";
import { supplyChainState } from "@/lib/supply-chain/seed-data";
import type { PathNode, SupplyChainState } from "@/lib/supply-chain/types";

export function useSupplyChainStore() {
  const [state, setState] = useState<SupplyChainState>(supplyChainState);
  const [hydrated, setHydrated] = useState(false);
  const [usingDb, setUsingDb] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/supply-chain");
      if (res.status === 503) {
        setUsingDb(false);
        setState(supplyChainState);
        setError(null);
        return;
      }
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        const message = [body.error, body.hint].filter(Boolean).join(" — ");
        throw new Error(message || "Failed to load supply chain");
      }
      const data = (await res.json()) as SupplyChainState;
      setState(data);
      setUsingDb(true);
      setError(null);
    } catch (e) {
      setUsingDb(false);
      setState(supplyChainState);
      setError(e instanceof Error ? e.message : "Load failed");
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const updateNode = useCallback(
    async (nodeId: string, updates: Partial<PathNode>) => {
      setState((prev) => ({
        ...prev,
        nodes: prev.nodes.map((n) =>
          n.id === nodeId ? { ...n, ...updates } : n,
        ),
      }));

      if (!usingDb) return;

      try {
        const res = await fetch(`/api/supply-chain/nodes/${nodeId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updates),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error ?? "Update failed");
        }
        const updated = (await res.json()) as PathNode;
        setState((prev) => ({
          ...prev,
          nodes: prev.nodes.map((n) => (n.id === nodeId ? updated : n)),
        }));
      } catch (e) {
        setError(e instanceof Error ? e.message : "Update failed");
        await load();
      }
    },
    [usingDb, load],
  );

  const resetToSeed = useCallback(async () => {
    if (!usingDb) {
      setState(supplyChainState);
      return;
    }
    try {
      const res = await fetch("/api/supply-chain/seed", {
        method: "POST",
        headers: { "x-api-key": process.env.NEXT_PUBLIC_MCP_API_KEY ?? "" },
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Reset failed");
      }
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Reset failed");
    }
  }, [usingDb, load]);

  return { state, hydrated, usingDb, error, updateNode, resetToSeed, reload: load };
}
