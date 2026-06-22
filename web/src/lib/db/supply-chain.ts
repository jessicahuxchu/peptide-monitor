import { createServiceClient } from "@/lib/supabase/client";
import { buildSupplyChainState, mapNode } from "@/lib/db/mappers";
import type { PathNode } from "@/lib/supply-chain/types";

export async function fetchSupplyChainState() {
  const supabase = createServiceClient();

  const [pathsRes, nodesRes, edgesRes, docsRes] = await Promise.all([
    supabase.from("supply_chain_paths").select("*").order("id"),
    supabase.from("path_nodes").select("*").order("sequence"),
    supabase.from("path_edges").select("*").order("id"),
    supabase.from("documents").select("*").order("id"),
  ]);

  if (pathsRes.error) throw pathsRes.error;
  if (nodesRes.error) throw nodesRes.error;
  if (edgesRes.error) throw edgesRes.error;
  if (docsRes.error) throw docsRes.error;

  return buildSupplyChainState(
    pathsRes.data,
    nodesRes.data,
    edgesRes.data,
    docsRes.data,
  );
}

export async function updatePathNode(
  nodeId: string,
  updates: Partial<PathNode>,
): Promise<PathNode> {
  const supabase = createServiceClient();

  const row: Record<string, unknown> = {};
  if (updates.displayName !== undefined) row.display_name = updates.displayName;
  if (updates.region !== undefined) row.region = updates.region ?? null;
  if (updates.roleDescription !== undefined)
    row.role_description = updates.roleDescription ?? null;
  if (updates.entityName !== undefined) row.entity_name = updates.entityName ?? null;
  if (updates.notes !== undefined) row.notes = updates.notes ?? null;
  if (updates.riskLevel !== undefined) row.risk_level = updates.riskLevel;
  if (updates.status !== undefined) row.status = updates.status;
  if (updates.documentCompletion !== undefined)
    row.document_completion = updates.documentCompletion;

  const { data, error } = await supabase
    .from("path_nodes")
    .update(row)
    .eq("id", nodeId)
    .select()
    .single();

  if (error) throw error;
  return mapNode(data);
}

export async function logActivity(
  action: string,
  entityType: string,
  entityId: string | null,
  payload: unknown,
  actor = "system",
) {
  const supabase = createServiceClient();
  await supabase.from("activity_log").insert({
    action,
    entity_type: entityType,
    entity_id: entityId,
    payload: payload as Record<string, unknown>,
    actor,
  });
}
