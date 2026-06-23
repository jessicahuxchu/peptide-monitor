import type { NodeType, RiskLevel } from "./types";

export interface SupplyChainRole {
  id: string;
  roleType: NodeType;
  roleLabelKey: string;
  region: string;
  country: string;
  riskLevel: RiskLevel;
  documentCompletion: number;
  requiredDocuments: string[];
  riskNotes?: string;
}

export interface SupplyChainCompany {
  id: string;
  roleId: string;
  name: string;
  contact: string;
  status: "active" | "prospect" | "paused";
}

export interface FormedChain {
  id: string;
  name: string;
  pathId: string;
  pathType: "primary" | "alternative" | "high_risk";
  companyIds: string[];
  status: "active" | "forming" | "blocked";
  notes?: string;
}

/** Role types included in each supply chain path */
export const PATH_ROLE_TYPES: Record<string, NodeType[]> = {
  "path-b2b-compounding": [
    "manufacturer",
    "exporter",
    "import_permit_holder",
    "quality_testing_lab",
    "compounding_pharmacy",
    "telehealth_platform",
    "end_customer_b2c",
  ],
  "path-clinic-prescriber": [
    "manufacturer",
    "exporter",
    "import_permit_holder",
    "quality_testing_lab",
    "compounding_pharmacy",
    "ruo_platform",
    "research_end_user",
  ],
  "path-grey-retail": [
    "manufacturer",
    "exporter",
    "quality_testing_lab",
    "end_customer_b2c",
  ],
};

export const supplyChainRoles: SupplyChainRole[] = [
  {
    id: "role-manufacturer-cn",
    roleType: "manufacturer",
    roleLabelKey: "cnManufacturer",
    region: "CN-HB / CN-JS",
    country: "CN",
    riskLevel: "low",
    documentCompletion: 95,
    requiredDocuments: ["gmp_cert", "coa", "quality_cert"],
  },
  {
    id: "role-exporter-cn",
    roleType: "exporter",
    roleLabelKey: "cnExporter",
    region: "CN-SH",
    country: "CN",
    riskLevel: "low",
    documentCompletion: 85,
    requiredDocuments: ["invoice_packing", "certificate_of_origin"],
  },
  {
    id: "role-import-permit",
    roleType: "import_permit_holder",
    roleLabelKey: "importPermitHolder",
    region: "AU Federal",
    country: "AU",
    riskLevel: "medium",
    documentCompletion: 80,
    requiredDocuments: ["tga_approval", "import_permit"],
  },
  {
    id: "role-lab",
    roleType: "quality_testing_lab",
    roleLabelKey: "testingLab",
    region: "VIC",
    country: "AU",
    riskLevel: "low",
    documentCompletion: 100,
    requiredDocuments: ["coa"],
  },
  {
    id: "role-compounding",
    roleType: "compounding_pharmacy",
    roleLabelKey: "compoundingPharmacy",
    region: "VIC / NSW / QLD",
    country: "AU",
    riskLevel: "medium",
    documentCompletion: 67,
    requiredDocuments: ["pharmacy_license", "compounding_registration", "state_specific"],
    riskNotes: "NSW storage protocol update — several pharmacies relocating to QLD",
  },
  {
    id: "role-telehealth",
    roleType: "telehealth_platform",
    roleLabelKey: "telehealthPlatform",
    region: "AU",
    country: "AU",
    riskLevel: "medium",
    documentCompletion: 90,
    requiredDocuments: ["state_specific"],
  },
  {
    id: "role-ruo",
    roleType: "ruo_platform",
    roleLabelKey: "ruoPlatform",
    region: "AU",
    country: "AU",
    riskLevel: "medium",
    documentCompletion: 75,
    requiredDocuments: ["customer_specific"],
  },
  {
    id: "role-research",
    roleType: "research_end_user",
    roleLabelKey: "researchEndUser",
    region: "AU",
    country: "AU",
    riskLevel: "medium",
    documentCompletion: 85,
    requiredDocuments: [],
  },
  {
    id: "role-patient",
    roleType: "end_customer_b2c",
    roleLabelKey: "patient",
    region: "AU",
    country: "AU",
    riskLevel: "low",
    documentCompletion: 100,
    requiredDocuments: [],
  },
];

export const supplyChainCompanies: SupplyChainCompany[] = [
  { id: "co-wuhan", roleId: "role-manufacturer-cn", name: "Wuhan PeptideTech Co.", contact: "Li Wei", status: "active" },
  { id: "co-hybio", roleId: "role-manufacturer-cn", name: "Hybio Pharmaceutical", contact: "Zhang Hao", status: "active" },
  { id: "co-shanghai-export", roleId: "role-exporter-cn", name: "Shanghai BioExport Trading", contact: "Chen Ming", status: "active" },
  { id: "co-auspharm", roleId: "role-import-permit", name: "AusPharm Import Holdings", contact: "Michael Chen", status: "active" },
  { id: "co-nal", roleId: "role-lab", name: "National Analytical Labs", contact: "Dr. Patel", status: "active" },
  { id: "co-precision-vic", roleId: "role-compounding", name: "Precision Compounding VIC", contact: "James O'Brien", status: "active" },
  { id: "co-compound-qld", roleId: "role-compounding", name: "Brisbane Peptide Pharmacy", contact: "Mark Stevens", status: "prospect" },
  { id: "co-telehealth", roleId: "role-telehealth", name: "MedConnect Telehealth AU", contact: "Dr. Lee", status: "active" },
  { id: "co-ruo-hub", roleId: "role-ruo", name: "PeptideRUO Supply Hub", contact: "Alex Turner", status: "active" },
  { id: "co-research-lab", roleId: "role-research", name: "Melbourne Peptide Research Lab", contact: "Dr. Kim", status: "active" },
];

export const formedChains: FormedChain[] = [
  {
    id: "chain-b2b2c-prescriber",
    name: "B2B2C-处方医生",
    pathId: "path-b2b-compounding",
    pathType: "primary",
    companyIds: ["co-wuhan", "co-shanghai-export", "co-auspharm", "co-nal", "co-precision-vic", "co-telehealth"],
    status: "active",
    notes: "生产制造商 → 出口商 → 进口许可 → 质检 → 配制药房 → 问诊平台",
  },
  {
    id: "chain-ruo",
    name: "B2B2C-RUO平台",
    pathId: "path-clinic-prescriber",
    pathType: "alternative",
    companyIds: ["co-wuhan", "co-shanghai-export", "co-auspharm", "co-nal", "co-precision-vic", "co-ruo-hub", "co-research-lab"],
    status: "active",
    notes: "研究用途供应路径",
  },
  {
    id: "chain-b2c-retail",
    name: "B2C-跨境零售",
    pathId: "path-grey-retail",
    pathType: "high_risk",
    companyIds: ["co-wuhan", "co-shanghai-export"],
    status: "blocked",
    notes: "跨境直邮 — 质量检测实验室可选",
  },
];

export function getCompaniesForRole(roleId: string) {
  return supplyChainCompanies.filter((c) => c.roleId === roleId);
}

export function getRolesForPath(pathId: string) {
  const types = PATH_ROLE_TYPES[pathId] ?? [];
  return supplyChainRoles.filter((r) => types.includes(r.roleType));
}

export function getChainsForPath(pathId: string) {
  return formedChains.filter((c) => c.pathId === pathId);
}

export function getRoleForCompany(companyId: string) {
  const company = supplyChainCompanies.find((c) => c.id === companyId);
  if (!company) return undefined;
  return supplyChainRoles.find((r) => r.id === company.roleId);
}

export interface ChainNodeOverride {
  companyName: string;
  documentCompletion: number;
}

/** Map path nodes to companies from a formed chain (matched by role type). */
export function getChainNodeOverrides(
  chain: FormedChain,
  nodes: { id: string; nodeType: NodeType }[],
): Map<string, ChainNodeOverride> {
  const map = new Map<string, ChainNodeOverride>();
  const companies = chain.companyIds
    .map((id) => supplyChainCompanies.find((c) => c.id === id))
    .filter((c): c is SupplyChainCompany => Boolean(c));
  const usedCompanyIds = new Set<string>();

  for (const node of nodes) {
    const company = companies.find((c) => {
      if (usedCompanyIds.has(c.id)) return false;
      const role = supplyChainRoles.find((r) => r.id === c.roleId);
      return role?.roleType === node.nodeType;
    });
    if (!company) continue;
    usedCompanyIds.add(company.id);
    const role = supplyChainRoles.find((r) => r.id === company.roleId);
    map.set(node.id, {
      companyName: company.name,
      documentCompletion: role?.documentCompletion ?? 0,
    });
  }

  return map;
}
