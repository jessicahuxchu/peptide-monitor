import { withDbHandler } from "@/lib/api/with-db";
import { fetchFinanceData } from "@/lib/db/queries";

export async function GET() {
  return withDbHandler(() => fetchFinanceData());
}
