import { createServiceClient } from "@/lib/supabase/client";
import { filterAlertsForViewer } from "@/lib/alerts/visibility";
import { resolveAssignee } from "@/lib/auth/team-members";
import { mapAlert } from "@/lib/db/platform-mappers";
import type { AlertItem } from "@/lib/supply-chain/seed-data";

function newId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export async function fetchAlertsForViewer(
  viewerEmail: string | null | undefined,
  opts?: { isAdmin?: boolean },
): Promise<AlertItem[]> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("alerts")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  const all = (data ?? []).map(mapAlert);
  return filterAlertsForViewer(all, viewerEmail, opts);
}

export async function fetchAllAlerts(): Promise<AlertItem[]> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("alerts")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapAlert);
}

export interface CreateManualAlertInput {
  priority: AlertItem["priority"];
  title: string;
  summary: string;
  suggestedActions?: string[];
  assignedToEmail?: string | null;
  assignedToName?: string | null;
  createdByEmail: string;
  createdByName: string;
}

export async function createManualAlert(
  input: CreateManualAlertInput,
): Promise<AlertItem> {
  const assignee = resolveAssignee(input.assignedToEmail, input.assignedToName);
  const supabase = createServiceClient();
  const id = newId("a");
  const row = {
    id,
    priority: input.priority,
    title_key: "alertManual",
    summary_key: "alertManualSummary",
    title_text: input.title.trim(),
    summary_text: input.summary.trim(),
    source: "manual" as const,
    status: "unread" as const,
    suggested_actions: input.suggestedActions?.filter(Boolean) ?? [],
    created_by_email: input.createdByEmail.trim().toLowerCase(),
    created_by_name: input.createdByName,
    assigned_to_email: assignee.email,
    assigned_to_name: assignee.name,
  };

  const { data, error } = await supabase.from("alerts").insert(row).select().single();
  if (error) throw error;
  return mapAlert(data);
}

export interface UpdateAlertInput {
  status?: AlertItem["status"];
  assignedToEmail?: string | null;
  assignedToName?: string | null;
}

export async function updateAlert(
  id: string,
  input: UpdateAlertInput,
): Promise<AlertItem> {
  const supabase = createServiceClient();
  const patch: Record<string, unknown> = {};

  if (input.status) patch.status = input.status;

  if (input.assignedToEmail !== undefined) {
    const assignee = resolveAssignee(input.assignedToEmail, input.assignedToName);
    patch.assigned_to_email = assignee.email;
    patch.assigned_to_name = assignee.name;
  }

  const { data, error } = await supabase
    .from("alerts")
    .update(patch)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return mapAlert(data);
}
