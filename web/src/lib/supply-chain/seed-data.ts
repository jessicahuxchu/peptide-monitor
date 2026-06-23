import type {
  DocumentRecord,
  SupplyChainState,
} from "./types";
import { matrixRowsToRegulatoryEntries } from "@/lib/regulatory/compliance-matrix-v6";
import { pathGraphEdges, pathGraphNodes } from "./path-graph-seed";

export const regulatoryEntries = matrixRowsToRegulatoryEntries();

export const supplyChainState: SupplyChainState = {
  paths: [
    {
      id: "path-b2b-compounding",
      nameKey: "b2bCompounding",
      descriptionKey: "b2bCompoundingDesc",
      market: "AU",
      pathType: "primary",
    },
    {
      id: "path-clinic-prescriber",
      nameKey: "clinicPrescriber",
      descriptionKey: "clinicPrescriberDesc",
      market: "AU",
      pathType: "alternative",
    },
    {
      id: "path-grey-retail",
      nameKey: "greyRetail",
      descriptionKey: "greyRetailDesc",
      market: "AU",
      pathType: "high_risk",
    },
  ],
  nodes: pathGraphNodes,
  edges: pathGraphEdges,
  documents: [
    {
      id: "d1",
      docType: "gmp_cert",
      linkedNodeId: "n1",
      linkedProduct: "BPC-157",
      status: "valid",
      expiryDate: "2027-03-15",
    },
    {
      id: "d2",
      docType: "coa",
      linkedNodeId: "n1",
      linkedProduct: "BPC-157",
      status: "valid",
      expiryDate: "2026-09-01",
    },
    {
      id: "d3",
      docType: "import_permit",
      linkedNodeId: "n3",
      linkedProduct: "BPC-157",
      status: "expiring_soon",
      expiryDate: "2026-08-15",
      gapNote: "Renewal application pending",
    },
    {
      id: "d4",
      docType: "tga_approval",
      linkedNodeId: "n3",
      linkedProduct: "BPC-157",
      status: "valid",
      expiryDate: "2027-01-20",
    },
    {
      id: "d5",
      docType: "compounding_registration",
      linkedNodeId: "n5",
      linkedProduct: "BPC-157",
      status: "missing",
      gapNote: "Pharmacy awaiting updated state registration",
    },
    {
      id: "d6",
      docType: "pharmacy_license",
      linkedNodeId: "n5",
      linkedProduct: "BPC-157",
      status: "valid",
      expiryDate: "2026-12-01",
    },
  ],
};


export function getPathNodes(pathId: string) {
  return supplyChainState.nodes
    .filter((n) => n.pathId === pathId)
    .sort((a, b) => a.sequence - b.sequence);
}

export function getPathEdges(pathId: string) {
  return supplyChainState.edges.filter((e) => e.pathId === pathId);
}

export function calcPathDocumentCompletion(pathId: string): number {
  const nodes = getPathNodes(pathId);
  if (nodes.length === 0) return 0;
  const total = nodes.reduce((sum, n) => sum + n.documentCompletion, 0);
  return Math.round(total / nodes.length);
}

export function calcOverallKpis() {
  const activePaths = supplyChainState.paths.filter(
    (p) => p.pathType !== "high_risk",
  );
  const feasiblePaths = activePaths.filter(
    (p) => calcPathDocumentCompletion(p.id) >= 60,
  );
  const allDocs = supplyChainState.documents;
  const docCompletion = Math.round(
    (allDocs.filter((d) => d.status === "valid").length / allDocs.length) * 100,
  );
  const openAlerts = alerts.filter((a) => a.status !== "done").length;

  return {
    feasiblePaths: feasiblePaths.length,
    totalActivePaths: activePaths.length,
    docCompletion,
    openAlerts,
    topSku: "BPC-157",
  };
}

export interface AlertItem {
  id: string;
  priority: "P0" | "P1" | "P2";
  titleKey: string;
  summaryKey: string;
  source: "agent" | "manual" | "scheduled_scout";
  status: "unread" | "read" | "in_progress" | "done" | "dismissed";
  createdAt: string;
  suggestedActions: string[];
}

export const alerts: AlertItem[] = [
  {
    id: "a1",
    priority: "P0",
    titleKey: "alertNswStorage",
    summaryKey: "alertNswStorageSummary",
    source: "scheduled_scout",
    status: "unread",
    createdAt: "2026-06-17T14:30:00Z",
    suggestedActions: ["Review NSW storage protocol", "Update Document Tracker"],
  },
  {
    id: "a2",
    priority: "P1",
    titleKey: "alertImportPermit",
    summaryKey: "alertImportPermitSummary",
    source: "agent",
    status: "unread",
    createdAt: "2026-06-16T09:00:00Z",
    suggestedActions: ["Submit renewal application", "Notify AusPharm Import Holdings"],
  },
  {
    id: "a3",
    priority: "P1",
    titleKey: "alertCompetitorPrice",
    summaryKey: "alertCompetitorPriceSummary",
    source: "agent",
    status: "read",
    createdAt: "2026-06-15T11:20:00Z",
    suggestedActions: ["Review Melbourne pricing", "Adjust quote for Metro Clinic"],
  },
  {
    id: "a4",
    priority: "P2",
    titleKey: "alertCompoundingReg",
    summaryKey: "alertCompoundingRegSummary",
    source: "manual",
    status: "in_progress",
    createdAt: "2026-06-14T08:00:00Z",
    suggestedActions: ["Follow up with Precision Compounding VIC"],
  },
];

export interface EntityRecord {
  id: string;
  type: "supplier" | "customer" | "intermediary";
  name: string;
  country: string;
  region?: string;
  contact: string;
  email: string;
  products: string[];
  cooperationStatus: "prospect" | "negotiating" | "active" | "paused" | "terminated";
  latestQuote?: { price: number; unit: string; moq: string; date: string };
  riskNotes?: string;
}

export const entities: EntityRecord[] = [
  {
    id: "ent1",
    type: "supplier",
    name: "Wuhan PeptideTech Co.",
    country: "CN",
    region: "Hubei",
    contact: "Li Wei",
    email: "li.wei@peptidetech.cn",
    products: ["BPC-157", "TB-500"],
    cooperationStatus: "active",
    latestQuote: { price: 12, unit: "USD/mg", moq: "100g", date: "2026-06-10" },
  },
  {
    id: "ent2",
    type: "intermediary",
    name: "Shanghai BioExport Trading",
    country: "CN",
    region: "Shanghai",
    contact: "Chen Ming",
    email: "chen@bioexport.cn",
    products: ["BPC-157"],
    cooperationStatus: "active",
    latestQuote: { price: 14.5, unit: "USD/mg", moq: "50g", date: "2026-06-08" },
  },
  {
    id: "ent3",
    type: "customer",
    name: "Precision Compounding VIC",
    country: "AU",
    region: "VIC",
    contact: "James O'Brien",
    email: "james@precisioncomp.vic.au",
    products: ["BPC-157"],
    cooperationStatus: "negotiating",
    riskNotes: "Awaiting compounding registration update",
  },
  {
    id: "ent4",
    type: "customer",
    name: "Metro Clinic Group",
    country: "AU",
    region: "VIC",
    contact: "Dr. Anna Park",
    email: "anna@metroclinic.au",
    products: ["BPC-157", "TB-500"],
    cooperationStatus: "active",
    latestQuote: { price: 842, unit: "AUD/g", moq: "10g", date: "2026-06-12" },
  },
];

export interface SkuOpportunity {
  id: string;
  product: string;
  demandScore: number;
  localPrice: number;
  competitivePrice: number;
  regulatorySensitivity: number;
  opportunityScore: number;
  trend: "up" | "down" | "stable";
  sparkline: number[];
}

export const skuOpportunities: SkuOpportunity[] = [
  {
    id: "sku1",
    product: "BPC-157",
    demandScore: 85,
    localPrice: 842,
    competitivePrice: 790,
    regulatorySensitivity: 0.35,
    opportunityScore: 72,
    trend: "up",
    sparkline: [42, 48, 45, 52, 58, 55, 62, 68, 65, 72, 78, 75],
  },
  {
    id: "sku2",
    product: "TB-500",
    demandScore: 62,
    localPrice: 1200,
    competitivePrice: 1150,
    regulatorySensitivity: 0.55,
    opportunityScore: 48,
    trend: "stable",
    sparkline: [30, 32, 31, 33, 34, 33, 35, 36, 34, 35, 36, 35],
  },
  {
    id: "sku3",
    product: "GHK-Cu",
    demandScore: 71,
    localPrice: 650,
    competitivePrice: 620,
    regulatorySensitivity: 0.25,
    opportunityScore: 68,
    trend: "up",
    sparkline: [20, 22, 25, 28, 30, 32, 35, 38, 40, 42, 45, 48],
  },
  {
    id: "sku4",
    product: "Semaglutide",
    demandScore: 90,
    localPrice: 450,
    competitivePrice: 380,
    regulatorySensitivity: 0.85,
    opportunityScore: 35,
    trend: "down",
    sparkline: [80, 78, 75, 72, 70, 68, 65, 60, 58, 55, 52, 50],
  },
];

export interface RiskSignal {
  id: string;
  type: string;
  severity: "critical" | "high" | "medium" | "low";
  titleKey: string;
  bodyKey: string;
  affectedNodes: string[];
  status: "open" | "monitoring" | "resolved";
}

export const riskSignals: RiskSignal[] = [
  {
    id: "rs1",
    type: "state_new_requirement",
    severity: "high",
    titleKey: "riskNswStorage",
    bodyKey: "riskNswStorageBody",
    affectedNodes: ["n8", "n15"],
    status: "open",
  },
  {
    id: "rs2",
    type: "document_gap_critical",
    severity: "high",
    titleKey: "riskCompoundingReg",
    bodyKey: "riskCompoundingRegBody",
    affectedNodes: ["n8"],
    status: "open",
  },
  {
    id: "rs3",
    type: "regulatory_tightening",
    severity: "medium",
    titleKey: "riskTb500Schedule",
    bodyKey: "riskTb500ScheduleBody",
    affectedNodes: ["n5"],
    status: "monitoring",
  },
  {
    id: "rs4",
    type: "enforcement_action",
    severity: "critical",
    titleKey: "riskGreyEnforcement",
    bodyKey: "riskGreyEnforcementBody",
    affectedNodes: ["n20"],
    status: "monitoring",
  },
];

export interface InboxMessage {
  id: string;
  author: string;
  content: string;
  timestamp: string;
  status: "pending" | "confirmed" | "rejected";
  proposedUpdates?: string[];
}

export const inboxMessages: InboxMessage[] = [
  {
    id: "in1",
    author: "Jessica",
    content:
      "New supplier XYZ Peptides — BPC-157 quote $11/mg, MOQ 100g, has COA and GMP.",
    timestamp: "2026-06-18T10:15:00Z",
    status: "pending",
    proposedUpdates: [
      "Create supplier: XYZ Peptides (CN)",
      "Update Market Intel: BPC-157 competitive price",
      "Link to Path Node: Manufacturer (path-b2b-compounding)",
    ],
  },
  {
    id: "in2",
    author: "Nick",
    content:
      "Metro Clinic wants updated quality questionnaire before next order. Due by June 25.",
    timestamp: "2026-06-17T16:40:00Z",
    status: "pending",
    proposedUpdates: [
      "Create document gap: customer_specific for Metro Clinic Group",
      "Generate Alert P1",
    ],
  },
  {
    id: "in3",
    author: "Steven",
    content: "Confirmed — Precision Compounding VIC registration expected by July.",
    timestamp: "2026-06-16T11:00:00Z",
    status: "confirmed",
    proposedUpdates: ["Update node n8 document status"],
  },
];

export const PATH_PRIMARY = "path-b2b-compounding";

export function getInitialState(): SupplyChainState {
  return JSON.parse(JSON.stringify(supplyChainState)) as SupplyChainState;
}

export const seedRegulatory = regulatoryEntries;
