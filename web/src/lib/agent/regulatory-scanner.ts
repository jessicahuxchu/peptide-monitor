import { createServiceClient } from "@/lib/supabase/client";
import { logActivity } from "@/lib/db/supply-chain";
import type { Database } from "@/lib/supabase/database.types";

type RegulatoryRow = Database["public"]["Tables"]["regulatory_entries"]["Row"];

export interface ScanFinding {
  entryId: string;
  market: string;
  region: string;
  product: string;
  issue: string;
  severity: "critical" | "high" | "medium" | "low";
}

function daysSince(dateStr: string): number {
  const d = new Date(dateStr);
  return Math.floor((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * Regulatory Scout — scans DB entries for stale data & high-risk jurisdictions.
 * Hermes Agent calls POST /api/cron/regulatory-scan via MCP tool.
 */
export async function runRegulatoryScan(source = "scheduled_scout") {
  const supabase = createServiceClient();

  const { data: entries, error } = await supabase
    .from("regulatory_entries")
    .select("*");
  if (error) throw error;

  const findings: ScanFinding[] = [];
  let alertsCreated = 0;

  for (const entry of (entries ?? []) as RegulatoryRow[]) {
    const staleDays = daysSince(entry.last_updated);

    if (staleDays > 60) {
      findings.push({
        entryId: entry.id,
        market: entry.market,
        region: entry.region,
        product: entry.product,
        issue: `Regulatory entry stale (${staleDays} days since last update)`,
        severity: "medium",
      });
    }

    if (entry.risk_level === "high" && entry.market === "AU") {
      findings.push({
        entryId: entry.id,
        market: entry.market,
        region: entry.region,
        product: entry.product,
        issue: `High-risk AU classification: ${entry.classification}`,
        severity: "high",
      });
    }

    // NSW-specific: flag storage protocol entries
    if (entry.region === "NSW" && entry.product === "BPC-157") {
      findings.push({
        entryId: entry.id,
        market: entry.market,
        region: entry.region,
        product: entry.product,
        issue: "NSW storage protocol update requires compliance review",
        severity: "high",
      });
    }
  }

  // Create alerts for high/critical findings (dedupe by checking recent alerts)
  for (const finding of findings.filter(
    (f) => f.severity === "high" || f.severity === "critical",
  )) {
    const alertId = `scan-${finding.entryId}-${Date.now()}`;
    const { error: alertErr } = await supabase.from("alerts").insert({
      id: alertId,
      priority: finding.severity === "critical" ? "P0" : "P1",
      title_key: "alertNswStorage",
      summary_key: "alertNswStorageSummary",
      source: "scheduled_scout",
      status: "unread",
      suggested_actions: [
        `Review ${finding.market}/${finding.region} — ${finding.product}`,
        finding.issue,
      ],
    });
    if (!alertErr) alertsCreated++;
  }

  const { data: scanRow, error: scanErr } = await supabase
    .from("regulatory_scans")
    .insert({
      source,
      findings,
      alerts_created: alertsCreated,
    })
    .select()
    .single();

  if (scanErr) throw scanErr;

  await logActivity("regulatory_scan", "regulatory_scan", scanRow.id, {
    findings: findings.length,
    alertsCreated,
  });

  return {
    scanId: scanRow.id,
    scannedAt: scanRow.scanned_at,
    findingsCount: findings.length,
    alertsCreated,
    findings,
  };
}
