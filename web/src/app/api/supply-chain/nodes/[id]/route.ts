import { NextRequest, NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { dbUnavailableResponse } from "@/lib/api/auth";
import { updatePathNode } from "@/lib/db/supply-chain";
import type { PathNode } from "@/lib/supply-chain/types";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!isSupabaseConfigured()) return dbUnavailableResponse();

  try {
    const { id } = await params;
    const updates = (await request.json()) as Partial<PathNode>;
    const node = await updatePathNode(id, updates);
    return NextResponse.json(node);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Update failed" },
      { status: 500 },
    );
  }
}
