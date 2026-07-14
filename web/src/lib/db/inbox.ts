import { createServiceClient } from "@/lib/supabase/client";
import { logActivity } from "@/lib/db/supply-chain";
import type { ProposedChange } from "@/lib/agent/inbox-parser";
import {
  resolveReviewCategory,
  type ReviewCategory,
} from "@/lib/auth/roles";

function newId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export async function commitProposedChanges(
  changes: ProposedChange[],
  actor: string,
): Promise<{ applied: string[]; errors: string[] }> {
  const supabase = createServiceClient();
  const applied: string[] = [];
  const errors: string[] = [];

  for (const change of changes) {
    try {
      switch (change.action) {
        case "update_node": {
          if (!change.target) throw new Error("Missing target node id");
          const row: Record<string, unknown> = {};
          const p = change.payload;
          if (p.displayName) row.display_name = p.displayName;
          if (p.documentCompletion !== undefined)
            row.document_completion = p.documentCompletion;
          if (p.notes !== undefined) row.notes = p.notes;
          if (p.riskLevel) row.risk_level = p.riskLevel;
          if (p.status) row.status = p.status;
          const { error } = await supabase
            .from("path_nodes")
            .update(row)
            .eq("id", change.target);
          if (error) throw error;
          applied.push(change.summary);
          break;
        }
        case "create_document": {
          const p = change.payload;
          const { error } = await supabase.from("documents").insert({
            id: newId("d"),
            doc_type: p.docType as string,
            linked_node_id: (p.linkedNodeId as string) ?? null,
            linked_product: (p.linkedProduct as string) ?? "BPC-157",
            status: (p.status as string) ?? "missing",
            expiry_date: (p.expiryDate as string) ?? null,
            gap_note: (p.gapNote as string) ?? null,
          });
          if (error) throw error;
          applied.push(change.summary);
          break;
        }
        case "create_alert": {
          const p = change.payload;
          const { error } = await supabase.from("alerts").insert({
            id: newId("a"),
            priority: p.priority as string,
            title_key: p.titleKey as string,
            summary_key: p.summaryKey as string,
            title_text: (p.titleText as string) ?? null,
            summary_text: (p.summaryText as string) ?? null,
            source: p.source as string,
            status: p.status as string,
            suggested_actions: p.suggestedActions ?? [],
            created_by_email: (p.createdByEmail as string) ?? null,
            created_by_name: (p.createdByName as string) ?? null,
            assigned_to_email: (p.assignedToEmail as string) ?? null,
            assigned_to_name: (p.assignedToName as string) ?? null,
          });
          if (error) throw error;
          applied.push(change.summary);
          break;
        }
        case "create_entity": {
          const p = change.payload;
          const { error } = await supabase.from("entities").insert({
            id: newId("ent"),
            type: p.type as string,
            name: p.name as string,
            country: p.country as string,
            region: (p.region as string) ?? null,
            contact: p.contact as string,
            email: p.email as string,
            products: p.products ?? [],
            cooperation_status: p.cooperationStatus as string,
            latest_quote: p.latestQuote ?? null,
            risk_notes: (p.riskNotes as string) ?? null,
          });
          if (error) throw error;
          applied.push(change.summary);
          break;
        }
        case "update_document": {
          if (!change.target) throw new Error("Missing document id");
          const { error } = await supabase
            .from("documents")
            .update(change.payload)
            .eq("id", change.target);
          if (error) throw error;
          applied.push(change.summary);
          break;
        }
        default:
          errors.push(`Unknown action: ${change.action}`);
      }
    } catch (err) {
      errors.push(
        `${change.summary}: ${err instanceof Error ? err.message : "Unknown error"}`,
      );
    }
  }

  await logActivity("commit_changes", "agent_submission", null, {
    applied,
    errors,
  }, actor);

  return { applied, errors };
}

export interface InboxSubmission {
  id: string;
  author: string;
  content: string;
  status: "pending" | "confirmed" | "rejected";
  proposedChanges: ProposedChange[];
  reviewCategory: ReviewCategory;
  createdAt: string;
  committedAt?: string;
}

function mapReviewCategory(value: unknown): ReviewCategory {
  if (value === "procurement" || value === "sales" || value === "admin") {
    return value;
  }
  return "admin";
}

export async function fetchInboxSubmissions(): Promise<InboxSubmission[]> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("agent_submissions")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;

  return (data ?? []).map((row) => ({
    id: row.id,
    author: row.author,
    content: row.content,
    status: row.status as InboxSubmission["status"],
    proposedChanges: (row.proposed_changes as ProposedChange[]) ?? [],
    reviewCategory: mapReviewCategory(
      (row as { review_category?: string }).review_category,
    ),
    createdAt: row.created_at,
    committedAt: row.committed_at ?? undefined,
  }));
}

export async function fetchInboxSubmissionById(
  id: string,
): Promise<InboxSubmission | null> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("agent_submissions")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return {
    id: data.id,
    author: data.author,
    content: data.content,
    status: data.status as InboxSubmission["status"],
    proposedChanges: (data.proposed_changes as ProposedChange[]) ?? [],
    reviewCategory: mapReviewCategory(
      (data as { review_category?: string }).review_category,
    ),
    createdAt: data.created_at,
    committedAt: data.committed_at ?? undefined,
  };
}

export async function createInboxSubmission(
  author: string,
  content: string,
  opts?: { intent?: string | null; reviewCategory?: ReviewCategory },
): Promise<InboxSubmission> {
  const { parseInboxContent } = await import("@/lib/agent/inbox-parser");
  const proposedChanges = parseInboxContent(content, author);
  const reviewCategory =
    opts?.reviewCategory ??
    resolveReviewCategory({ intent: opts?.intent, content });
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("agent_submissions")
    .insert({
      author,
      content,
      status: "pending",
      proposed_changes: proposedChanges,
      review_category: reviewCategory,
    })
    .select()
    .single();

  if (error) throw error;

  return {
    id: data.id,
    author: data.author,
    content: data.content,
    status: "pending",
    proposedChanges,
    reviewCategory: mapReviewCategory(
      (data as { review_category?: string }).review_category,
    ),
    createdAt: data.created_at,
  };
}

export async function confirmSubmission(
  id: string,
  actor: string,
): Promise<{ applied: string[]; errors: string[] }> {
  const supabase = createServiceClient();
  const { data: sub, error: fetchErr } = await supabase
    .from("agent_submissions")
    .select("*")
    .eq("id", id)
    .single();

  if (fetchErr) throw fetchErr;
  if (sub.status !== "pending") {
    throw new Error(`Submission already ${sub.status}`);
  }

  const changes = (sub.proposed_changes as ProposedChange[]) ?? [];
  const result = await commitProposedChanges(changes, actor);

  const { error: updateErr } = await supabase
    .from("agent_submissions")
    .update({
      status: "confirmed",
      committed_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (updateErr) throw updateErr;
  return result;
}

export async function rejectSubmission(id: string, actor: string) {
  const supabase = createServiceClient();
  const { error } = await supabase
    .from("agent_submissions")
    .update({ status: "rejected" })
    .eq("id", id);
  if (error) throw error;
  await logActivity("reject_submission", "agent_submission", id, {}, actor);
}
