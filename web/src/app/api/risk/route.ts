import { withDbHandler } from "@/lib/api/with-db";
import { fetchRiskSignals } from "@/lib/db/queries";

export async function GET() {
  return withDbHandler(() => fetchRiskSignals());
}
