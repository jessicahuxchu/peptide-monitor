import { createServiceClient } from "@/lib/supabase/client";
import { productRecordToRow } from "@/lib/db/platform-mappers";
import { nodeToRow } from "@/lib/db/mappers";
import { salesRecords } from "@/lib/finance/seed-data";
import {
  monitorMeta,
  platforms,
  productBlends,
  productMonitorRecords,
} from "@/lib/product-monitor/seed-data";
import {
  customerDemands,
  supplierProfiles,
} from "@/lib/relations/matching";
import {
  activeDemand,
  agentInsights,
  mapNodes,
  regulatoryBodies,
  riskIndex,
} from "@/lib/mock-data";
import {
  alerts,
  entities,
  inboxMessages,
  regulatoryEntries,
  riskSignals,
  skuOpportunities,
  supplyChainState,
} from "@/lib/supply-chain/seed-data";

export async function seedDatabase() {
  const supabase = createServiceClient();

  // Clear in dependency order
  await supabase.from("activity_log").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await supabase.from("agent_submissions").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await supabase.from("regulatory_scans").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await supabase.from("platform_config").delete().neq("key", "");
  await supabase.from("customer_demands").delete().neq("id", "");
  await supabase.from("supplier_profiles").delete().neq("id", "");
  await supabase.from("sales_records").delete().neq("id", "");
  await supabase.from("sku_opportunities").delete().neq("id", "");
  await supabase.from("product_blends").delete().neq("id", "");
  await supabase.from("product_monitor_records").delete().neq("id", "");
  await supabase.from("monitor_platforms").delete().neq("id", "");
  await supabase.from("monitor_meta").delete().neq("id", "");
  await supabase.from("path_edges").delete().neq("id", "");
  await supabase.from("documents").delete().neq("id", "");
  await supabase.from("path_nodes").delete().neq("id", "");
  await supabase.from("supply_chain_paths").delete().neq("id", "");
  await supabase.from("regulatory_entries").delete().neq("id", "");
  await supabase.from("alerts").delete().neq("id", "");
  await supabase.from("entities").delete().neq("id", "");
  await supabase.from("risk_signals").delete().neq("id", "");

  const { error: pathsErr } = await supabase.from("supply_chain_paths").insert(
    supplyChainState.paths.map((p) => ({
      id: p.id,
      name_key: p.nameKey,
      description_key: p.descriptionKey,
      market: p.market,
      path_type: p.pathType,
    })),
  );
  if (pathsErr) throw pathsErr;

  const { error: nodesErr } = await supabase
    .from("path_nodes")
    .insert(supplyChainState.nodes.map(nodeToRow));
  if (nodesErr) throw nodesErr;

  const { error: edgesErr } = await supabase.from("path_edges").insert(
    supplyChainState.edges.map((e) => ({
      id: e.id,
      path_id: e.pathId,
      from_node_id: e.fromNodeId,
      to_node_id: e.toNodeId,
      transport_mode: e.transportMode,
      estimated_days: e.estimatedDays,
      incoterms: e.incoterms ?? null,
      checkpoint_description: e.checkpointDescription ?? null,
      required_documents: e.requiredDocuments,
      risk_level: e.riskLevel,
      status: e.status,
    })),
  );
  if (edgesErr) throw edgesErr;

  const { error: docsErr } = await supabase.from("documents").insert(
    supplyChainState.documents.map((d) => ({
      id: d.id,
      doc_type: d.docType,
      linked_node_id: d.linkedNodeId ?? null,
      linked_product: d.linkedProduct,
      status: d.status,
      expiry_date: d.expiryDate ?? null,
      gap_note: d.gapNote ?? null,
    })),
  );
  if (docsErr) throw docsErr;

  const { error: regErr } = await supabase.from("regulatory_entries").insert(
    regulatoryEntries.map((r) => ({
      id: r.id,
      market: r.market,
      region: r.region,
      product: r.product,
      regulatory_body: r.regulatoryBody,
      classification: r.classification,
      requirements: r.requirements,
      risk_level: r.riskLevel,
      last_updated: r.lastUpdated,
      source: r.source,
    })),
  );
  if (regErr) throw regErr;

  const { error: alertsErr } = await supabase.from("alerts").insert(
    alerts.map((a) => ({
      id: a.id,
      priority: a.priority,
      title_key: a.titleKey,
      summary_key: a.summaryKey,
      source: a.source,
      status: a.status,
      suggested_actions: a.suggestedActions,
      created_at: a.createdAt,
    })),
  );
  if (alertsErr) throw alertsErr;

  const { error: entErr } = await supabase.from("entities").insert(
    entities.map((e) => ({
      id: e.id,
      type: e.type,
      name: e.name,
      country: e.country,
      region: e.region ?? null,
      contact: e.contact,
      email: e.email,
      products: e.products,
      cooperation_status: e.cooperationStatus,
      latest_quote: e.latestQuote ?? null,
      risk_notes: e.riskNotes ?? null,
    })),
  );
  if (entErr) throw entErr;

  const { error: riskErr } = await supabase.from("risk_signals").insert(
    riskSignals.map((r) => ({
      id: r.id,
      type: r.type,
      severity: r.severity,
      title_key: r.titleKey,
      body_key: r.bodyKey,
      affected_nodes: r.affectedNodes,
      status: r.status,
    })),
  );
  if (riskErr) throw riskErr;

  const { error: metaErr } = await supabase.from("monitor_meta").insert({
    id: "default",
    benchmark_date: monitorMeta.benchmarkDate,
    platform_count: monitorMeta.platformCount,
    product_type_count: monitorMeta.productTypeCount,
    listing_count: monitorMeta.listingCount,
    source_files: monitorMeta.sourceFiles,
    budget_split: monitorMeta.budgetSplit,
  });
  if (metaErr) throw metaErr;

  const { error: platErr } = await supabase.from("monitor_platforms").insert(
    platforms.map((p, i) => ({ id: p.id, name: p.name, sort_order: i })),
  );
  if (platErr) throw platErr;

  const { error: pmErr } = await supabase
    .from("product_monitor_records")
    .insert(productMonitorRecords.map(productRecordToRow));
  if (pmErr) throw pmErr;

  const { error: blendErr } = await supabase.from("product_blends").insert(
    productBlends.map((b) => ({
      id: b.id,
      name: b.name,
      components: b.components,
      platform_coverage: b.platformCoverage,
      platform_total: b.platformTotal,
      tier: b.tier,
      stock_mode: b.stockMode,
    })),
  );
  if (blendErr) throw blendErr;

  const { error: skuErr } = await supabase.from("sku_opportunities").insert(
    skuOpportunities.map((s) => ({
      id: s.id,
      product: s.product,
      demand_score: s.demandScore,
      local_price: s.localPrice,
      competitive_price: s.competitivePrice,
      regulatory_sensitivity: s.regulatorySensitivity,
      opportunity_score: s.opportunityScore,
      trend: s.trend,
      sparkline: s.sparkline,
    })),
  );
  if (skuErr) throw skuErr;

  const { error: salesErr } = await supabase.from("sales_records").insert(
    salesRecords.map((r) => ({
      id: r.id,
      sale_date: r.date,
      country: r.country,
      region: r.region,
      product: r.product,
      category: r.category,
      quantity: r.quantity,
      unit: r.unit,
      revenue: r.revenue,
      currency: r.currency,
    })),
  );
  if (salesErr) throw salesErr;

  const { error: supErr } = await supabase.from("supplier_profiles").insert(
    supplierProfiles.map((s) => ({
      id: s.id,
      name: s.name,
      contact: s.contact,
      email: s.email,
      products: s.products,
      price: s.productOffers[0]?.price ?? 0,
      unit: s.productOffers[0]?.unit ?? "USD/mg",
      moq: s.productOffers[0]?.moq ?? "100g",
      documents: s.documents,
      country: s.country,
      region: s.region,
    })),
  );
  if (supErr) throw supErr;

  const { error: demErr } = await supabase.from("customer_demands").insert(
    customerDemands.map((d) => ({
      id: d.id,
      name: d.name,
      contact: d.contact,
      email: d.email,
      product: d.product,
      quantity: d.quantity,
      target_price: d.targetPrice,
      price_unit: d.priceUnit,
      required_documents: d.requiredDocuments,
      country: d.country,
      region: d.region,
      status: d.status,
    })),
  );
  if (demErr) throw demErr;

  const { error: cfgErr } = await supabase.from("platform_config").insert([
    { key: "risk_index", value: riskIndex },
    { key: "active_demand", value: activeDemand },
    { key: "map_nodes", value: mapNodes },
    { key: "regulatory_bodies", value: regulatoryBodies },
    { key: "agent_insights", value: agentInsights },
  ]);
  if (cfgErr) throw cfgErr;

  const { parseInboxContent } = await import("@/lib/agent/inbox-parser");
  for (const msg of inboxMessages) {
    const changes = parseInboxContent(msg.content, msg.author);
    await supabase.from("agent_submissions").insert({
      author: msg.author,
      content: msg.content,
      status: msg.status,
      proposed_changes: changes,
      committed_at: msg.status === "confirmed" ? new Date().toISOString() : null,
    });
  }

  return { ok: true, message: "Database seeded successfully" };
}
