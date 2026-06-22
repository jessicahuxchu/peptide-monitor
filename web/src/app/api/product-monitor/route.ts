import { withDbHandler } from "@/lib/api/with-db";
import { fetchProductMonitorData } from "@/lib/db/queries";

export async function GET() {
  return withDbHandler(() => fetchProductMonitorData());
}
