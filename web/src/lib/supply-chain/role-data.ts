import type { RiskLevel } from "./types";

export interface SupplyChainRole {
  id: string;
  roleType: string;
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
  pathType: "primary" | "alternative" | "high_risk";
  companyIds: string[];
  status: "active" | "forming" | "blocked";
  notes?: string;
}

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
    id: "role-freight",
    roleType: "freight_forwarder",
    roleLabelKey: "freightForwarder",
    region: "CN → AU",
    country: "CN/AU",
    riskLevel: "medium",
    documentCompletion: 90,
    requiredDocuments: ["customs_declaration", "msds"],
    riskNotes: "Cold-chain integrity monitoring required",
  },
  {
    id: "role-customs-au",
    roleType: "customs_broker_au",
    roleLabelKey: "auCustomsBroker",
    region: "VIC / NSW",
    country: "AU",
    riskLevel: "medium",
    documentCompletion: 75,
    requiredDocuments: ["import_permit", "customs_declaration"],
    riskNotes: "NSW stricter than VIC for peptide imports",
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
    id: "role-warehouse",
    roleType: "warehouse_bonded",
    roleLabelKey: "bondedWarehouse",
    region: "VIC",
    country: "AU",
    riskLevel: "low",
    documentCompletion: 100,
    requiredDocuments: ["warehouse_bonded"],
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
    id: "role-wholesale",
    roleType: "wholesale_distributor",
    roleLabelKey: "wholesaleDistributor",
    region: "AU",
    country: "AU",
    riskLevel: "low",
    documentCompletion: 90,
    requiredDocuments: ["customer_specific"],
  },
  {
    id: "role-doctor",
    roleType: "doctor_prescriber",
    roleLabelKey: "prescriber",
    region: "VIC / NSW",
    country: "AU",
    riskLevel: "medium",
    documentCompletion: 100,
    requiredDocuments: ["state_specific"],
  },
  {
    id: "role-clinic",
    roleType: "clinic",
    roleLabelKey: "clinic",
    region: "VIC / NSW",
    country: "AU",
    riskLevel: "low",
    documentCompletion: 100,
    requiredDocuments: [],
  },
  {
    id: "role-grey-retail",
    roleType: "grey_market_retail",
    roleLabelKey: "greyRetail",
    region: "AU Online",
    country: "AU",
    riskLevel: "high",
    documentCompletion: 20,
    requiredDocuments: [],
    riskNotes: "TGA enforcement risk — monitor closely",
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
  { id: "co-suzhou", roleId: "role-manufacturer-cn", name: "Suzhou BioPeptide Labs", contact: "Wang Mei", status: "prospect" },
  { id: "co-shanghai-export", roleId: "role-exporter-cn", name: "Shanghai BioExport Trading", contact: "Chen Ming", status: "active" },
  { id: "co-pacific", roleId: "role-freight", name: "Pacific Cold Chain Logistics", contact: "Tom Richards", status: "active" },
  { id: "co-express", roleId: "role-freight", name: "Express Courier AU", contact: "Sarah Kim", status: "active" },
  { id: "co-melbourne-customs", roleId: "role-customs-au", name: "Melbourne Customs Partners", contact: "David Lee", status: "active" },
  { id: "co-sydney-customs", roleId: "role-customs-au", name: "Sydney Border Services", contact: "Emma Wilson", status: "active" },
  { id: "co-auspharm", roleId: "role-import-permit", name: "AusPharm Import Holdings", contact: "Michael Chen", status: "active" },
  { id: "co-port-melb", roleId: "role-warehouse", name: "Port Melbourne Licensed Storage", contact: "James O'Brien", status: "active" },
  { id: "co-nal", roleId: "role-lab", name: "National Analytical Labs", contact: "Dr. Patel", status: "active" },
  { id: "co-precision-vic", roleId: "role-compounding", name: "Precision Compounding VIC", contact: "James O'Brien", status: "active" },
  { id: "co-compound-nsw", roleId: "role-compounding", name: "Sydney Compounding Hub", contact: "Lisa Tran", status: "paused" },
  { id: "co-compound-qld", roleId: "role-compounding", name: "Brisbane Peptide Pharmacy", contact: "Mark Stevens", status: "prospect" },
  { id: "co-medsupply", roleId: "role-wholesale", name: "MedSupply Australia Wholesale", contact: "Anna Park", status: "active" },
  { id: "co-mitchell", roleId: "role-doctor", name: "Dr. Sarah Mitchell — Sports Med", contact: "Dr. Mitchell", status: "active" },
  { id: "co-metro-clinic", roleId: "role-clinic", name: "Melbourne Sports Recovery Clinic", contact: "Dr. Anna Park", status: "active" },
  { id: "co-peptide-direct", roleId: "role-grey-retail", name: "PeptideDirect AU (Online)", contact: "—", status: "active" },
];

export const formedChains: FormedChain[] = [
  {
    id: "chain-b2b-primary",
    name: "B2B 主路径",
    pathType: "primary",
    companyIds: ["co-wuhan", "co-shanghai-export", "co-pacific", "co-melbourne-customs", "co-auspharm", "co-port-melb", "co-nal", "co-precision-vic", "co-medsupply"],
    status: "active",
    notes: "优先低风险批量路径",
  },
  {
    id: "chain-clinic",
    name: "诊所 / 处方路径",
    pathType: "alternative",
    companyIds: ["co-wuhan", "co-shanghai-export", "co-pacific", "co-melbourne-customs", "co-precision-vic", "co-mitchell", "co-metro-clinic"],
    status: "active",
    notes: "患者定制配制",
  },
  {
    id: "chain-grey",
    name: "灰色零售路径",
    pathType: "high_risk",
    companyIds: ["co-wuhan", "co-express", "co-peptide-direct"],
    status: "blocked",
    notes: "监管执法风险高",
  },
  {
    id: "chain-hybio-qld",
    name: "Hybio → QLD 药房（筹建中）",
    pathType: "alternative",
    companyIds: ["co-hybio", "co-shanghai-export", "co-pacific", "co-sydney-customs", "co-compound-qld"],
    status: "forming",
    notes: "NSW 监管收紧后药房迁移趋势",
  },
];

export function getCompaniesForRole(roleId: string) {
  return supplyChainCompanies.filter((c) => c.roleId === roleId);
}

export function getRoleForCompany(companyId: string) {
  const company = supplyChainCompanies.find((c) => c.id === companyId);
  if (!company) return undefined;
  return supplyChainRoles.find((r) => r.id === company.roleId);
}
