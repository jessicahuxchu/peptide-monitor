import { NextRequest, NextResponse } from "next/server";

export function requireApiKey(request: NextRequest): NextResponse | null {
  const key = process.env.MCP_API_KEY;
  if (!key) return null; // no key configured — allow in dev

  const auth = request.headers.get("authorization");
  const bearer = auth?.startsWith("Bearer ") ? auth.slice(7) : null;
  const headerKey = request.headers.get("x-api-key");

  if (bearer !== key && headerKey !== key) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}

export function dbUnavailableResponse() {
  return NextResponse.json(
    {
      error: "Database not configured",
      hint: "Copy web/.env.example to web/.env.local and set Supabase credentials.",
    },
    { status: 503 },
  );
}
