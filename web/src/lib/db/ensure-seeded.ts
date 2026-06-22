import { seedDatabase } from "@/lib/db/seed";
import { createServiceClient } from "@/lib/supabase/client";

let seeding: Promise<void> | null = null;

export async function isDatabaseEmpty(): Promise<boolean> {
  const supabase = createServiceClient();
  const { count, error } = await supabase
    .from("supply_chain_paths")
    .select("*", { count: "exact", head: true });
  if (error) throw error;
  return (count ?? 0) === 0;
}

export async function ensureSeeded(): Promise<void> {
  if (!(await isDatabaseEmpty())) return;

  if (!seeding) {
    seeding = seedDatabase().then(() => undefined);
  }
  await seeding;
}
