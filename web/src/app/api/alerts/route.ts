import { withDbHandler } from "@/lib/api/with-db";
import { fetchAlerts } from "@/lib/db/queries";

export async function GET() {
  return withDbHandler(() => fetchAlerts());
}
