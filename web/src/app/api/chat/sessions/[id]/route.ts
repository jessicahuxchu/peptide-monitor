import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { dbUnavailableResponse } from "@/lib/api/auth";
import {
  deleteChatSession,
  fetchChatSession,
  updateChatSession,
} from "@/lib/db/chat-sessions";
import type { ChatMessage } from "@/lib/agent/chat-responder";

type RouteContext = { params: Promise<{ id: string }> };

async function requireUserId(): Promise<string | NextResponse> {
  const user = await currentUser();
  if (!user?.id) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }
  return user.id;
}

export async function GET(_request: Request, context: RouteContext) {
  if (!isSupabaseConfigured()) return dbUnavailableResponse();

  const userId = await requireUserId();
  if (userId instanceof NextResponse) return userId;

  const { id } = await context.params;
  try {
    const session = await fetchChatSession(userId, id);
    if (!session) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json(session);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load session" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  if (!isSupabaseConfigured()) return dbUnavailableResponse();

  const userId = await requireUserId();
  if (userId instanceof NextResponse) return userId;

  const { id } = await context.params;
  try {
    const body = (await request.json()) as {
      messages?: ChatMessage[];
      title?: string;
    };
    const session = await updateChatSession(userId, id, body);
    return NextResponse.json(session);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to update session" },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  if (!isSupabaseConfigured()) return dbUnavailableResponse();

  const userId = await requireUserId();
  if (userId instanceof NextResponse) return userId;

  const { id } = await context.params;
  try {
    await deleteChatSession(userId, id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to delete session" },
      { status: 500 },
    );
  }
}

export const dynamic = "force-dynamic";
