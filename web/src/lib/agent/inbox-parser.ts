export type ProposedChangeAction =
  | "update_node"
  | "create_document"
  | "create_alert"
  | "create_entity"
  | "update_document";

export interface ProposedChange {
  action: ProposedChangeAction;
  target?: string;
  payload: Record<string, unknown>;
  summary: string;
}

/**
 * Rule-based inbox parser (P2 placeholder for Hermes Inbox Agent).
 * Maps natural-language patterns to structured DB change proposals.
 */
export function parseInboxContent(
  content: string,
  author: string,
): ProposedChange[] {
  const changes: ProposedChange[] = [];
  const lower = content.toLowerCase();

  // Supplier / quote patterns
  const supplierMatch = content.match(
    /(?:new\s+)?supplier\s+([A-Za-z0-9\s&.-]+?)(?:\s*[—–-]|\s+quote|\s+BPC)/i,
  );
  const priceMatch = content.match(/\$([0-9.]+)\s*\/?\s*(mg|g)/i);
  const productMatch = content.match(/(BPC-157|TB-500|GHK-Cu|Semaglutide)/i);

  if (supplierMatch || (lower.includes("supplier") && lower.includes("quote"))) {
    const name = supplierMatch?.[1]?.trim() ?? "New Supplier";
    changes.push({
      action: "create_entity",
      payload: {
        type: "supplier",
        name,
        country: lower.includes("cn") || lower.includes("china") ? "CN" : "AU",
        contact: author,
        email: `${name.toLowerCase().replace(/\s+/g, ".")}@example.com`,
        products: productMatch ? [productMatch[1]] : ["BPC-157"],
        cooperationStatus: "prospect",
        latestQuote: priceMatch
          ? {
              price: parseFloat(priceMatch[1]),
              unit: `USD/${priceMatch[2]}`,
              moq: "100g",
              date: new Date().toISOString().slice(0, 10),
            }
          : undefined,
      },
      summary: `Create supplier: ${name}`,
    });
    if (priceMatch && productMatch) {
      changes.push({
        action: "create_alert",
        payload: {
          priority: "P2",
          titleKey: "alertCompetitorPrice",
          summaryKey: "alertCompetitorPriceSummary",
          source: "agent",
          status: "unread",
          suggestedActions: [`Review ${productMatch[1]} competitive pricing`],
        },
        summary: `Update Market Intel: ${productMatch[1]} competitive price $${priceMatch[1]}/${priceMatch[2]}`,
      });
    }
  }

  // Document gap / customer requirement
  if (
    lower.includes("questionnaire") ||
    lower.includes("document") ||
    lower.includes("quality")
  ) {
    const clinicMatch = content.match(/([A-Za-z\s]+(?:Clinic|Group|Pharmacy))/i);
    const entityName = clinicMatch?.[1]?.trim() ?? "Customer";
    changes.push({
      action: "create_document",
      payload: {
        docType: "customer_specific",
        linkedProduct: "BPC-157",
        status: "missing",
        gapNote: content.slice(0, 120),
      },
      summary: `Create document gap: customer_specific for ${entityName}`,
    });
    changes.push({
      action: "create_alert",
      payload: {
        priority: "P1",
        titleKey: "alertImportPermit",
        summaryKey: "alertImportPermitSummary",
        source: "agent",
        status: "unread",
        suggestedActions: ["Follow up on customer document requirement"],
      },
      summary: "Generate Alert P1",
    });
  }

  // Node / registration update
  if (
    lower.includes("registration") ||
    lower.includes("compounding") ||
    lower.includes("precision")
  ) {
    changes.push({
      action: "update_node",
      target: "n8",
      payload: { documentCompletion: 75, notes: content.slice(0, 200) },
      summary: "Update node n8 (Precision Compounding VIC) document status",
    });
  }

  // Regulatory keywords
  if (lower.includes("regulatory") || lower.includes("tga") || lower.includes("nsw")) {
    changes.push({
      action: "create_alert",
      payload: {
        priority: "P0",
        titleKey: "alertNswStorage",
        summaryKey: "alertNswStorageSummary",
        source: "agent",
        status: "unread",
        suggestedActions: ["Review regulatory update", "Update compliance matrix"],
      },
      summary: "Flag regulatory update for review",
    });
  }

  if (changes.length === 0) {
    changes.push({
      action: "create_alert",
      payload: {
        priority: "P2",
        titleKey: "alertCompetitorPrice",
        summaryKey: "alertCompetitorPriceSummary",
        source: "agent",
        status: "unread",
        suggestedActions: ["Manual review required — no auto-classification match"],
      },
      summary: `Log input from ${author} for manual triage`,
    });
  }

  return changes;
}
