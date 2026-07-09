import { withDbHandler } from "@/lib/api/with-db";
import { fetchSocialPosts } from "@/lib/db/queries";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const platform = searchParams.get("platform") ?? undefined;
  const product = searchParams.get("product") ?? undefined;
  const limitRaw = searchParams.get("limit");
  const limit = limitRaw ? Math.min(Number(limitRaw) || 100, 500) : 100;

  return withDbHandler(() =>
    fetchSocialPosts({ platform, product, limit }),
  );
}
