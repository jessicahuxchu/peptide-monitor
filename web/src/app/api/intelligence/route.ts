import { withDbHandler } from "@/lib/api/with-db";
import { fetchIntelligenceData } from "@/lib/db/queries";

export async function GET() {
  return withDbHandler(() => fetchIntelligenceData());
}

export const dynamic = "force-dynamic";
export const revalidate = 0;
