export const NODE_TYPES = [
  "manufacturer",
  "exporter",
  "freight_forwarder",
  "customs_broker_au",
  "import_permit_holder",
  "warehouse_bonded",
  "quality_testing_lab",
  "compounding_pharmacy",
  "wholesale_distributor",
  "clinic",
  "doctor_prescriber",
  "hospital",
  "retail_pharmacy",
  "grey_market_retail",
  "online_retailer",
  "end_customer_b2b",
  "end_customer_b2c",
  "regulatory_authority",
  "legal_counsel",
] as const;

export type NodeType = (typeof NODE_TYPES)[number];

export type RiskLevel = "low" | "medium" | "high";
export type NodeStatus = "active" | "inactive" | "blocked";
export type PathType = "primary" | "alternative" | "high_risk";
export type EdgeStatus = "active" | "alternative" | "deprecated" | "blocked";
export type TransportMode = "air" | "sea" | "courier" | "domestic";
export type DocStatus =
  | "valid"
  | "expiring_soon"
  | "expired"
  | "missing"
  | "pending";

export interface PathNode {
  id: string;
  pathId: string;
  sequence: number;
  nodeType: NodeType;
  displayName: string;
  region?: string;
  roleDescription?: string;
  riskLevel: RiskLevel;
  status: NodeStatus;
  notes?: string;
  entityName?: string;
  documentCompletion: number;
}

export interface PathEdge {
  id: string;
  pathId: string;
  fromNodeId: string;
  toNodeId: string;
  transportMode: TransportMode;
  estimatedDays: number;
  incoterms?: string;
  checkpointDescription?: string;
  requiredDocuments: string[];
  riskLevel: RiskLevel;
  status: EdgeStatus;
}

export interface SupplyChainPath {
  id: string;
  nameKey: string;
  descriptionKey: string;
  market: "AU";
  pathType: PathType;
}

export interface DocumentRecord {
  id: string;
  docType: string;
  linkedNodeId?: string;
  linkedProduct: string;
  status: DocStatus;
  expiryDate?: string;
  gapNote?: string;
}

export interface SupplyChainState {
  paths: SupplyChainPath[];
  nodes: PathNode[];
  edges: PathEdge[];
  documents: DocumentRecord[];
}

export interface RegulatoryEntry {
  id: string;
  market: string;
  region: string;
  product: string;
  regulatoryBody: string;
  classification: string;
  requirements: string[];
  riskLevel: RiskLevel;
  lastUpdated: string;
  source: string;
}
