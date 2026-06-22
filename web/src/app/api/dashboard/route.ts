import { withDbHandler } from "@/lib/api/with-db";
import { fetchDashboardBundle } from "@/lib/db/queries";

export async function GET() {
  return withDbHandler(() => fetchDashboardBundle());
}
