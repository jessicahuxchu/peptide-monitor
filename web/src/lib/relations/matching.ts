export interface SupplierProfile {
  id: string;
  name: string;
  contact: string;
  email: string;
  products: string[];
  price: number;
  unit: string;
  moq: string;
  documents: string[];
  country: string;
  region: string;
}

export interface CustomerDemand {
  id: string;
  name: string;
  contact: string;
  email: string;
  product: string;
  quantity: string;
  targetPrice: number;
  priceUnit: string;
  requiredDocuments: string[];
  country: string;
  region: string;
  status: "active" | "negotiating" | "prospect";
}

export const supplierProfiles: SupplierProfile[] = [
  {
    id: "sup1",
    name: "Wuhan PeptideTech Co.",
    contact: "Li Wei",
    email: "li.wei@peptidetech.cn",
    products: ["BPC-157", "TB-500"],
    price: 12,
    unit: "USD/mg",
    moq: "100g",
    documents: ["gmp_cert", "coa", "quality_cert"],
    country: "CN",
    region: "Hubei",
  },
  {
    id: "sup2",
    name: "Hybio Pharmaceutical",
    contact: "Zhang Hao",
    email: "zhang@hybio.com",
    products: ["BPC-157", "GHK-Cu"],
    price: 11.5,
    unit: "USD/mg",
    moq: "50g",
    documents: ["gmp_cert", "coa"],
    country: "CN",
    region: "Jiangsu",
  },
  {
    id: "sup3",
    name: "Shanghai BioExport Trading",
    contact: "Chen Ming",
    email: "chen@bioexport.cn",
    products: ["BPC-157"],
    price: 14.5,
    unit: "USD/mg",
    moq: "50g",
    documents: ["coa", "invoice_packing", "certificate_of_origin"],
    country: "CN",
    region: "Shanghai",
  },
  {
    id: "sup4",
    name: "Suzhou BioPeptide Labs",
    contact: "Wang Mei",
    email: "wang@biopeptide.cn",
    products: ["TB-500", "GHK-Cu"],
    price: 13,
    unit: "USD/mg",
    moq: "100g",
    documents: ["coa", "gmp_cert"],
    country: "CN",
    region: "Jiangsu",
  },
];

export const customerDemands: CustomerDemand[] = [
  {
    id: "cust1",
    name: "Precision Compounding VIC",
    contact: "James O'Brien",
    email: "james@precisioncomp.vic.au",
    product: "BPC-157",
    quantity: "500g/month",
    targetPrice: 800,
    priceUnit: "AUD/g",
    requiredDocuments: ["gmp_cert", "coa", "quality_cert"],
    country: "AU",
    region: "VIC",
    status: "negotiating",
  },
  {
    id: "cust2",
    name: "Metro Clinic Group",
    contact: "Dr. Anna Park",
    email: "anna@metroclinic.au",
    product: "BPC-157",
    quantity: "200g/month",
    targetPrice: 842,
    priceUnit: "AUD/g",
    requiredDocuments: ["gmp_cert", "coa", "customer_specific"],
    country: "AU",
    region: "VIC",
    status: "active",
  },
  {
    id: "cust3",
    name: "Brisbane Peptide Pharmacy",
    contact: "Mark Stevens",
    email: "mark@brispeptide.au",
    product: "BPC-157",
    quantity: "300g/month",
    targetPrice: 780,
    priceUnit: "AUD/g",
    requiredDocuments: ["gmp_cert", "coa", "pharmacy_license"],
    country: "AU",
    region: "QLD",
    status: "prospect",
  },
  {
    id: "cust4",
    name: "Melbourne Sports Recovery Clinic",
    contact: "Dr. Anna Park",
    email: "anna@metroclinic.au",
    product: "TB-500",
    quantity: "50g/month",
    targetPrice: 1150,
    priceUnit: "AUD/g",
    requiredDocuments: ["coa", "tga_approval", "import_permit"],
    country: "AU",
    region: "VIC",
    status: "active",
  },
  {
    id: "cust5",
    name: "Sydney Compounding Hub",
    contact: "Lisa Tran",
    email: "lisa@sydneycompound.au",
    product: "GHK-Cu",
    quantity: "100g/month",
    targetPrice: 620,
    priceUnit: "AUD/g",
    requiredDocuments: ["coa", "gmp_cert"],
    country: "AU",
    region: "NSW",
    status: "negotiating",
  },
];

export function matchSuppliersForDemand(
  demand: CustomerDemand,
  suppliers: SupplierProfile[] = supplierProfiles,
): SupplierProfile[] {
  return suppliers.filter((s) => {
    if (!s.products.includes(demand.product)) return false;
    return demand.requiredDocuments.every((doc) => s.documents.includes(doc));
  });
}
