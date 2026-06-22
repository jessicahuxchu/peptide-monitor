import { withDbHandler } from "@/lib/api/with-db";
import { fetchRelationsData } from "@/lib/db/queries";

export async function GET() {
  return withDbHandler(() => fetchRelationsData());
}
