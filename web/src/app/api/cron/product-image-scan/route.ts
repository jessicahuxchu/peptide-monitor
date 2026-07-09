import { NextRequest, NextResponse } from "next/server";
import { requireApiKey } from "@/lib/api/auth";
import { runProductImageScan } from "@/lib/product-images/monitor";

export async function POST(request: NextRequest) {
  const authErr = requireApiKey(request);
  if (authErr) return authErr;

  try {
    const body = await request.json().catch(() => ({}));
    const result = await runProductImageScan({
      configPath: body.configPath,
      statePath: body.statePath,
    });
    return NextResponse.json(result, { status: result.ok ? 200 : 207 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Product image scan failed" },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  return POST(request);
}
