import type {
  DocumentRecord,
  RegulatoryEntry,
  SupplyChainState,
} from "./types";

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
  nodes: [
    {
      id: "n1",
      pathId: "path-b2b-compounding",
      sequence: 1,
      nodeType: "manufacturer",
      displayName: "Wuhan PeptideTech Co.",
      region: "CN-HB",
      roleDescription: "BPC-157 API production",
      riskLevel: "low",
      status: "active",
      entityName: "Wuhan PeptideTech Co.",
      documentCompletion: 100,
    },
    {
      id: "n2",
      pathId: "path-b2b-compounding",
      sequence: 2,
      nodeType: "exporter",
      displayName: "Shanghai BioExport Trading",
      region: "CN-SH",
      roleDescription: "Export declaration entity",
      riskLevel: "low",
      status: "active",
      entityName: "Shanghai BioExport Trading",
      documentCompletion: 85,
    },
    {
      id: "n3",
      pathId: "path-b2b-compounding",
      sequence: 3,
      nodeType: "freight_forwarder",
      displayName: "Pacific Cold Chain Logistics",
      region: "CN-SH → AU",
      roleDescription: "Cold-chain air freight",
      riskLevel: "medium",
      status: "active",
      entityName: "Pacific Cold Chain Logistics",
      documentCompletion: 90,
    },
    {
      id: "n4",
      pathId: "path-b2b-compounding",
      sequence: 4,
      nodeType: "customs_broker_au",
      displayName: "Melbourne Customs Partners",
      region: "VIC",
      roleDescription: "Import customs clearance",
      riskLevel: "medium",
      status: "active",
      entityName: "Melbourne Customs Partners",
      documentCompletion: 75,
    },
    {
      id: "n5",
      pathId: "path-b2b-compounding",
      sequence: 5,
      nodeType: "import_permit_holder",
      displayName: "AusPharm Import Holdings",
      region: "AU",
      roleDescription: "TGA import permit holder",
      riskLevel: "medium",
      status: "active",
      entityName: "AusPharm Import Holdings",
      documentCompletion: 80,
    },
    {
      id: "n6",
      pathId: "path-b2b-compounding",
      sequence: 6,
      nodeType: "warehouse_bonded",
      displayName: "Port Melbourne Licensed Storage",
      region: "VIC",
      roleDescription: "Licensed bonded warehouse",
      riskLevel: "low",
      status: "active",
      documentCompletion: 100,
    },
    {
      id: "n7",
      pathId: "path-b2b-compounding",
      sequence: 7,
      nodeType: "quality_testing_lab",
      displayName: "National Analytical Labs",
      region: "VIC",
      roleDescription: "Third-party COA verification",
      riskLevel: "low",
      status: "active",
      entityName: "National Analytical Labs",
      documentCompletion: 100,
    },
    {
      id: "n8",
      pathId: "path-b2b-compounding",
      sequence: 8,
      nodeType: "compounding_pharmacy",
      displayName: "Precision Compounding VIC",
      region: "VIC",
      roleDescription: "Receives API, compounds finished product",
      riskLevel: "medium",
      status: "active",
      entityName: "Precision Compounding VIC",
      documentCompletion: 67,
    },
    {
      id: "n9",
      pathId: "path-b2b-compounding",
      sequence: 9,
      nodeType: "wholesale_distributor",
      displayName: "MedSupply Australia Wholesale",
      region: "AU",
      roleDescription: "B2B bulk distribution",
      riskLevel: "low",
      status: "active",
      entityName: "MedSupply Australia Wholesale",
      documentCompletion: 90,
    },
    {
      id: "n10",
      pathId: "path-b2b-compounding",
      sequence: 10,
      nodeType: "end_customer_b2b",
      displayName: "Metro Clinic Group",
      region: "VIC",
      roleDescription: "Bulk B2B buyer",
      riskLevel: "low",
      status: "active",
      entityName: "Metro Clinic Group",
      documentCompletion: 100,
    },
    // Alternative path — clinic / prescriber (shares n1-n8)
    {
      id: "n11",
      pathId: "path-clinic-prescriber",
      sequence: 1,
      nodeType: "manufacturer",
      displayName: "Wuhan PeptideTech Co.",
      region: "CN-HB",
      riskLevel: "low",
      status: "active",
      documentCompletion: 100,
    },
    {
      id: "n12",
      pathId: "path-clinic-prescriber",
      sequence: 2,
      nodeType: "exporter",
      displayName: "Shanghai BioExport Trading",
      region: "CN-SH",
      riskLevel: "low",
      status: "active",
      documentCompletion: 85,
    },
    {
      id: "n13",
      pathId: "path-clinic-prescriber",
      sequence: 3,
      nodeType: "freight_forwarder",
      displayName: "Pacific Cold Chain Logistics",
      region: "CN-SH → AU",
      riskLevel: "medium",
      status: "active",
      documentCompletion: 90,
    },
    {
      id: "n14",
      pathId: "path-clinic-prescriber",
      sequence: 4,
      nodeType: "customs_broker_au",
      displayName: "Melbourne Customs Partners",
      region: "VIC",
      riskLevel: "medium",
      status: "active",
      documentCompletion: 75,
    },
    {
      id: "n15",
      pathId: "path-clinic-prescriber",
      sequence: 5,
      nodeType: "compounding_pharmacy",
      displayName: "Precision Compounding VIC",
      region: "VIC",
      roleDescription: "Patient-specific compounding",
      riskLevel: "medium",
      status: "active",
      documentCompletion: 67,
    },
    {
      id: "n16",
      pathId: "path-clinic-prescriber",
      sequence: 6,
      nodeType: "doctor_prescriber",
      displayName: "Dr. Sarah Mitchell — Sports Med",
      region: "VIC",
      roleDescription: "Prescription source",
      riskLevel: "medium",
      status: "active",
      documentCompletion: 100,
    },
    {
      id: "n17",
      pathId: "path-clinic-prescriber",
      sequence: 7,
      nodeType: "clinic",
      displayName: "Melbourne Sports Recovery Clinic",
      region: "VIC",
      roleDescription: "Patient delivery point",
      riskLevel: "low",
      status: "active",
      documentCompletion: 100,
    },
    // High risk grey retail path
    {
      id: "n18",
      pathId: "path-grey-retail",
      sequence: 1,
      nodeType: "manufacturer",
      displayName: "Wuhan PeptideTech Co.",
      region: "CN-HB",
      riskLevel: "low",
      status: "active",
      documentCompletion: 100,
    },
    {
      id: "n19",
      pathId: "path-grey-retail",
      sequence: 2,
      nodeType: "freight_forwarder",
      displayName: "Express Courier AU",
      region: "CN → AU",
      riskLevel: "high",
      status: "active",
      documentCompletion: 40,
    },
    {
      id: "n20",
      pathId: "path-grey-retail",
      sequence: 3,
      nodeType: "grey_market_retail",
      displayName: "PeptideDirect AU (Online)",
      region: "AU",
      roleDescription: "Unregulated online grey channel",
      riskLevel: "high",
      status: "active",
      notes: "Regulatory enforcement risk — monitor TGA actions",
      documentCompletion: 20,
    },
  ],
  edges: [
    {
      id: "e1",
      pathId: "path-b2b-compounding",
      fromNodeId: "n1",
      toNodeId: "n2",
      transportMode: "domestic",
      estimatedDays: 2,
      incoterms: "EXW",
      checkpointDescription: "Export prep & QC release",
      requiredDocuments: ["coa", "gmp_cert"],
      riskLevel: "low",
      status: "active",
    },
    {
      id: "e2",
      pathId: "path-b2b-compounding",
      fromNodeId: "n2",
      toNodeId: "n3",
      transportMode: "air",
      estimatedDays: 1,
      incoterms: "FOB",
      checkpointDescription: "Customs export CN",
      requiredDocuments: ["invoice_packing", "certificate_of_origin"],
      riskLevel: "low",
      status: "active",
    },
    {
      id: "e3",
      pathId: "path-b2b-compounding",
      fromNodeId: "n3",
      toNodeId: "n4",
      transportMode: "air",
      estimatedDays: 3,
      incoterms: "CIF",
      checkpointDescription: "AU border arrival",
      requiredDocuments: ["import_permit", "customs_declaration"],
      riskLevel: "medium",
      status: "active",
    },
    {
      id: "e4",
      pathId: "path-b2b-compounding",
      fromNodeId: "n4",
      toNodeId: "n5",
      transportMode: "domestic",
      estimatedDays: 1,
      checkpointDescription: "TGA permit verification",
      requiredDocuments: ["tga_approval", "import_permit"],
      riskLevel: "medium",
      status: "active",
    },
    {
      id: "e5",
      pathId: "path-b2b-compounding",
      fromNodeId: "n5",
      toNodeId: "n6",
      transportMode: "domestic",
      estimatedDays: 1,
      requiredDocuments: ["warehouse_bonded"],
      riskLevel: "low",
      status: "active",
    },
    {
      id: "e6",
      pathId: "path-b2b-compounding",
      fromNodeId: "n6",
      toNodeId: "n7",
      transportMode: "domestic",
      estimatedDays: 2,
      requiredDocuments: ["coa"],
      riskLevel: "low",
      status: "active",
    },
    {
      id: "e7",
      pathId: "path-b2b-compounding",
      fromNodeId: "n7",
      toNodeId: "n8",
      transportMode: "domestic",
      estimatedDays: 1,
      checkpointDescription: "Pharmacy receipt & compounding registration",
      requiredDocuments: ["compounding_registration", "pharmacy_license"],
      riskLevel: "medium",
      status: "active",
    },
    {
      id: "e8",
      pathId: "path-b2b-compounding",
      fromNodeId: "n8",
      toNodeId: "n9",
      transportMode: "domestic",
      estimatedDays: 1,
      riskLevel: "low",
      status: "active",
      requiredDocuments: [],
    },
    {
      id: "e9",
      pathId: "path-b2b-compounding",
      fromNodeId: "n9",
      toNodeId: "n10",
      transportMode: "domestic",
      estimatedDays: 1,
      riskLevel: "low",
      status: "active",
      requiredDocuments: ["customer_specific"],
    },
    // Clinic / prescriber path edges
    {
      id: "e10",
      pathId: "path-clinic-prescriber",
      fromNodeId: "n11",
      toNodeId: "n12",
      transportMode: "domestic",
      estimatedDays: 2,
      requiredDocuments: ["coa", "gmp_cert"],
      riskLevel: "low",
      status: "active",
    },
    {
      id: "e11",
      pathId: "path-clinic-prescriber",
      fromNodeId: "n12",
      toNodeId: "n13",
      transportMode: "air",
      estimatedDays: 3,
      requiredDocuments: ["import_permit"],
      riskLevel: "medium",
      status: "active",
    },
    {
      id: "e12",
      pathId: "path-clinic-prescriber",
      fromNodeId: "n13",
      toNodeId: "n14",
      transportMode: "air",
      estimatedDays: 1,
      requiredDocuments: ["customs_declaration"],
      riskLevel: "medium",
      status: "active",
    },
    {
      id: "e13",
      pathId: "path-clinic-prescriber",
      fromNodeId: "n14",
      toNodeId: "n15",
      transportMode: "domestic",
      estimatedDays: 2,
      requiredDocuments: ["pharmacy_license"],
      riskLevel: "medium",
      status: "active",
    },
    {
      id: "e14",
      pathId: "path-clinic-prescriber",
      fromNodeId: "n15",
      toNodeId: "n16",
      transportMode: "domestic",
      estimatedDays: 1,
      requiredDocuments: ["compounding_registration"],
      riskLevel: "medium",
      status: "alternative",
    },
    {
      id: "e15",
      pathId: "path-clinic-prescriber",
      fromNodeId: "n16",
      toNodeId: "n17",
      transportMode: "courier",
      estimatedDays: 1,
      requiredDocuments: ["state_specific"],
      riskLevel: "medium",
      status: "alternative",
    },
    // Grey retail path edges
    {
      id: "e16",
      pathId: "path-grey-retail",
      fromNodeId: "n18",
      toNodeId: "n19",
      transportMode: "courier",
      estimatedDays: 7,
      requiredDocuments: ["coa"],
      riskLevel: "high",
      status: "alternative",
    },
    {
      id: "e17",
      pathId: "path-grey-retail",
      fromNodeId: "n19",
      toNodeId: "n20",
      transportMode: "courier",
      estimatedDays: 2,
      requiredDocuments: [],
      riskLevel: "high",
      status: "alternative",
    },
  ],
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
      linkedNodeId: "n5",
      linkedProduct: "BPC-157",
      status: "expiring_soon",
      expiryDate: "2026-08-15",
      gapNote: "Renewal application pending",
    },
    {
      id: "d4",
      docType: "tga_approval",
      linkedNodeId: "n5",
      linkedProduct: "BPC-157",
      status: "valid",
      expiryDate: "2027-01-20",
    },
    {
      id: "d5",
      docType: "compounding_registration",
      linkedNodeId: "n8",
      linkedProduct: "BPC-157",
      status: "missing",
      gapNote: "Pharmacy awaiting updated state registration",
    },
    {
      id: "d6",
      docType: "pharmacy_license",
      linkedNodeId: "n8",
      linkedProduct: "BPC-157",
      status: "valid",
      expiryDate: "2026-12-01",
    },
    {
      id: "d7",
      docType: "customs_declaration",
      linkedNodeId: "n4",
      linkedProduct: "BPC-157",
      status: "pending",
    },
    {
      id: "d8",
      docType: "customer_specific",
      linkedNodeId: "n10",
      linkedProduct: "BPC-157",
      status: "missing",
      gapNote: "Metro Clinic requires updated quality questionnaire",
    },
  ],
};

export const regulatoryEntries: RegulatoryEntry[] = [
  {
    id: "r1",
    market: "AU",
    region: "Federal",
    product: "BPC-157",
    regulatoryBody: "TGA",
    classification: "Unregistered therapeutic good",
    requirements: ["Import permit", "GMP evidence", "COA per batch"],
    riskLevel: "medium",
    lastUpdated: "2026-06-10",
    source: "TGA Guidance",
  },
  {
    id: "r2",
    market: "AU",
    region: "VIC",
    product: "BPC-157",
    regulatoryBody: "DHHS Victoria",
    classification: "Compounded medicine",
    requirements: ["Pharmacy license", "Compounding registration", "Prescriber oversight"],
    riskLevel: "medium",
    lastUpdated: "2026-05-28",
    source: "State pharmacy board",
  },
  {
    id: "r3",
    market: "AU",
    region: "NSW",
    product: "BPC-157",
    regulatoryBody: "NSW Health",
    classification: "Compounded medicine",
    requirements: ["Storage protocol update (2026)", "Batch traceability"],
    riskLevel: "high",
    lastUpdated: "2026-06-15",
    source: "NSW regulatory bulletin",
  },
  {
    id: "r4",
    market: "AU",
    region: "Federal",
    product: "TB-500",
    regulatoryBody: "TGA",
    classification: "Schedule 4 (Prescription only)",
    requirements: ["TGA approval", "Import permit", "Prescriber authorization"],
    riskLevel: "high",
    lastUpdated: "2026-04-20",
    source: "TGA Scheduling",
  },
];

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
