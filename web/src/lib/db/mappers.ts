import type {
  DocumentRecord,
  PathEdge,
  PathNode,
  SupplyChainPath,
  SupplyChainState,
} from "@/lib/supply-chain/types";
import type { Database } from "@/lib/supabase/database.types";

type PathRow = Database["public"]["Tables"]["supply_chain_paths"]["Row"];
type NodeRow = Database["public"]["Tables"]["path_nodes"]["Row"];
type EdgeRow = Database["public"]["Tables"]["path_edges"]["Row"];
type DocRow = Database["public"]["Tables"]["documents"]["Row"];

export function mapPath(row: PathRow): SupplyChainPath {
  return {
    id: row.id,
    nameKey: row.name_key,
    descriptionKey: row.description_key,
    market: row.market as "AU",
    pathType: row.path_type as SupplyChainPath["pathType"],
  };
}

export function mapNode(row: NodeRow): PathNode {
  return {
    id: row.id,
    pathId: row.path_id,
    sequence: row.sequence,
    nodeType: row.node_type as PathNode["nodeType"],
    displayName: row.display_name,
    region: row.region ?? undefined,
    roleDescription: row.role_description ?? undefined,
    riskLevel: row.risk_level as PathNode["riskLevel"],
    status: row.status as PathNode["status"],
    notes: row.notes ?? undefined,
    entityName: row.entity_name ?? undefined,
    documentCompletion: row.document_completion,
  };
}

export function mapEdge(row: EdgeRow): PathEdge {
  return {
    id: row.id,
    pathId: row.path_id,
    fromNodeId: row.from_node_id,
    toNodeId: row.to_node_id,
    transportMode: row.transport_mode as PathEdge["transportMode"],
    estimatedDays: row.estimated_days,
    incoterms: row.incoterms ?? undefined,
    checkpointDescription: row.checkpoint_description ?? undefined,
    requiredDocuments: (row.required_documents as string[]) ?? [],
    riskLevel: row.risk_level as PathEdge["riskLevel"],
    status: row.status as PathEdge["status"],
  };
}

export function mapDocument(row: DocRow): DocumentRecord {
  return {
    id: row.id,
    docType: row.doc_type,
    linkedNodeId: row.linked_node_id ?? undefined,
    linkedProduct: row.linked_product,
    status: row.status as DocumentRecord["status"],
    expiryDate: row.expiry_date ?? undefined,
    gapNote: row.gap_note ?? undefined,
  };
}

export function nodeToRow(
  node: PathNode,
): Database["public"]["Tables"]["path_nodes"]["Insert"] {
  return {
    id: node.id,
    path_id: node.pathId,
    sequence: node.sequence,
    node_type: node.nodeType,
    display_name: node.displayName,
    region: node.region ?? null,
    role_description: node.roleDescription ?? null,
    risk_level: node.riskLevel,
    status: node.status,
    notes: node.notes ?? null,
    entity_name: node.entityName ?? null,
    document_completion: node.documentCompletion,
  };
}

export function buildSupplyChainState(
  paths: PathRow[],
  nodes: NodeRow[],
  edges: EdgeRow[],
  documents: DocRow[],
): SupplyChainState {
  return {
    paths: paths.map(mapPath),
    nodes: nodes.map(mapNode),
    edges: edges.map(mapEdge),
    documents: documents.map(mapDocument),
  };
}
