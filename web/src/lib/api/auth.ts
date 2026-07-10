import { NextRequest, NextResponse } from "next/server";

function acceptedCronSecrets(): string[] {
  return [process.env.MCP_API_KEY, process.env.CRON_SECRET].filter(
    (value): value is string => Boolean(value),
  );
}

/** Auth for cron/MCP routes. Accepts MCP_API_KEY or CRON_SECRET (Vercel Cron). */
export function requireApiKey(request: NextRequest): NextResponse | null {
  const keys = acceptedCronSecrets();
  if (keys.length === 0) return null; // no key configured — allow in dev

  const auth = request.headers.get("authorization");
  const bearer = auth?.startsWith("Bearer ") ? auth.slice(7) : null;
  const headerKey = request.headers.get("x-api-key");

  if ((bearer && keys.includes(bearer)) || (headerKey && keys.includes(headerKey))) {
    return null;
  }

  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
