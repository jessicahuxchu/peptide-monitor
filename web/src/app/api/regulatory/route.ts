import { withDbHandler } from "@/lib/api/with-db";
import { fetchRegulatoryEntries } from "@/lib/db/queries";

export async function GET() {
  return withDbHandler(() => fetchRegulatoryEntries());
}
