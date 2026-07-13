export const riskIndex = {
  value: 2.41,
  change: 0.4,
  status: "stable" as const,
  items: [
    { label: "auLogistics", status: "optimal" as const },
    { label: "suezTransit", status: "delayed" as const },
    { label: "coldChain", status: "optimal" as const, value: "100%" },
  ],
};

export const activeDemand = {
  product: "BPC-157",
  volume: "14.8k",
  price: 842.36,
  priceUnit: "g",
  sparkline: [42, 48, 45, 52, 58, 55, 62, 68, 65, 72, 78, 75],
};

export const mapNodes = [
  {
    id: "shanghai",
    labelKey: "shanghaiHub" as const,
    x: 50,
    y: 18,
    status: "normal" as const,
  },
  {
    id: "transit",
    labelKey: "inTransit" as const,
    x: 50,
    y: 50,
    status: "transit" as const,
  },
  {
    id: "sydney",
    labelKey: "sydneyPort" as const,
    x: 50,
    y: 82,
    status: "normal" as const,
  },
];

export const regulatoryBodies = [
  { code: "tga", regionKey: "australia" as const, status: "compliant" as const },
  { code: "fda", regionKey: "usa" as const, status: "compliant" as const },
  { code: "nmpa", regionKey: "china" as const, status: "attention" as const },
  { code: "ema", regionKey: "europe" as const, status: "compliant" as const },
];

export const agentInsights = [
  {
    id: "1",
    type: "riskAlert" as const,
    timeKey: "ago2m" as const,
    bodyKey: "riskAlertBody" as const,
    accent: "orange" as const,
  },
  {
    id: "2",
    type: "marketIntel" as const,
    timeKey: "ago1h" as const,
    bodyKey: "marketIntelBody" as const,
    accent: "teal" as const,
  },
];

export const navItems = [
  { key: "strategic" as const, href: "/" },
  { key: "finance" as const, href: "/finance" },
  { key: "supplyChain" as const, href: "/supply-chain" },
  { key: "productMonitor" as const, href: "/product-monitor" },
  { key: "intelligence" as const, href: "/intelligence" },
  { key: "regulatory" as const, href: "/regulatory" },
  { key: "relations" as const, href: "/relations" },
  { key: "risk" as const, href: "/risk" },
] as const;
