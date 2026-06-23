import matrixJson from "./compliance-matrix-v6.json";
import type { RegulatoryEntry, RiskLevel } from "@/lib/supply-chain/types";

export interface MatrixCellV6 {
  raw: string;
  classification: string;
  riskLabel: string;
  basisRef?: string;
  riskLevel: RiskLevel;
  operationalConsequence: string;
  regulator: string;
  isIncremental: boolean;
}

export interface MatrixRowV6 {
  product: string;
  type: string;
  productLogic: string;
  cells: Record<string, MatrixCellV6>;
}

export interface StateFrameworkRow {
  jurisdiction: string;
  regulator: string;
  legalBasis: string;
  incrementalClassification: string;
  difference: string;
  action: string;
  sourceType: string;
}

export interface ProductLogicRow {
  product: string;
  type: string;
  federalClassification: string;
  baseRisk: string;
  productQualification: string;
  classificationBasis: string;
  inheritance: string;
  s4BasisType: string;
  artgStatus: string;
}

export interface SourceStatusRow {
  jurisdiction: string;
  source: string;
  url: string;
  purpose: string;
  sourceType: string;
  asOf: string;
  reviewer: string;
  reviewDate: string;
  reviewStatus: string;
}

export interface ComplianceMatrixV6 {
  asOf: string;
  version: string;
  disclaimer: string;
  escalationRule: string;
  lawyerReviewItems: string;
  regions: string[];
  matrixRows: MatrixRowV6[];
  stateFramework: StateFrameworkRow[];
  productLogic: ProductLogicRow[];
  sources: SourceStatusRow[];
}

export const COMPLIANCE_MATRIX_V6 = matrixJson as ComplianceMatrixV6;

/** Map product-monitor SKU names to matrix row product names. */
const PRODUCT_ALIASES: Record<string, string[]> = {
  "GHK-Cu": ["GHK-Cu 外用", "GHK-Cu 注射/复方"],
};

export function resolveMatrixProducts(monitorProduct: string): string[] {
  if (PRODUCT_ALIASES[monitorProduct]) {
    return PRODUCT_ALIASES[monitorProduct];
  }

  const matrixProducts = COMPLIANCE_MATRIX_V6.matrixRows.map((r) => r.product);
  if (matrixProducts.includes(monitorProduct)) {
    return [monitorProduct];
  }

  const normalized = monitorProduct.replace(/\s+/g, "").toLowerCase();
  const match = matrixProducts.find(
    (p) => p.replace(/\s+/g, "").toLowerCase() === normalized,
  );
  return match ? [match] : [];
}

export function matrixRowsToRegulatoryEntries(): RegulatoryEntry[] {
  const entries: RegulatoryEntry[] = [];
  let id = 1;

  for (const row of COMPLIANCE_MATRIX_V6.matrixRows) {
    for (const [region, cell] of Object.entries(row.cells)) {
      entries.push({
        id: `v6-${id++}`,
        market: "AU",
        region,
        product: row.product,
        regulatoryBody: cell.regulator,
        classification: cell.classification,
        requirements: cell.basisRef ? [`依据: ${cell.basisRef}`] : [],
        operationalConsequence: cell.operationalConsequence,
        riskLevel: cell.riskLevel,
        lastUpdated: COMPLIANCE_MATRIX_V6.asOf,
        source: `Matrix ${COMPLIANCE_MATRIX_V6.version}`,
      });
    }
  }

  return entries;
}

export function getMatrixRow(product: string): MatrixRowV6 | undefined {
  return COMPLIANCE_MATRIX_V6.matrixRows.find((r) => r.product === product);
}

export function getProductLogic(product: string): ProductLogicRow | undefined {
  return COMPLIANCE_MATRIX_V6.productLogic.find((p) => p.product === product);
}

export function isLawyerPending(value: string): boolean {
  return !value || value.includes("待律师填");
}
