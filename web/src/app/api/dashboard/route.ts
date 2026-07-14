import { withDbHandler } from "@/lib/api/with-db";
import { getOptionalViewerEmail } from "@/lib/api/actor";
import { fetchDashboardBundle } from "@/lib/db/queries";

export async function GET() {
  const viewerEmail = await getOptionalViewerEmail();
  return withDbHandler(() => fetchDashboardBundle(viewerEmail));
}
