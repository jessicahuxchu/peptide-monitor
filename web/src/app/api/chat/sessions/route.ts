import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { dbUnavailableResponse } from "@/lib/api/auth";
import { withDbHandler } from "@/lib/api/with-db";
import {
  createChatSession,
  fetchChatSessions,
} from "@/lib/db/chat-sessions";
import type { ChatMessage } from "@/lib/agent/chat-responder";

async function requireUserId(): Promise<string | NextResponse> {
  const user = await currentUser();
  if (!user?.id) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }
  return user.id;
}

export async function GET() {
  const userId = await requireUserId();
  if (userId instanceof NextResponse) return userId;
  return withDbHandler(() => fetchChatSessions(userId));
}

export async function POST(request: Request) {
  if (!isSupabaseConfigured()) return dbUnavailableResponse();

  const userId = await requireUserId();
  if (userId instanceof NextResponse) return userId;

  try {
    const body = (await request.json()) as {
      messages?: ChatMessage[];
      title?: string;
    };
    const messages = body.messages ?? [];
    const session = await createChatSession(userId, messages, body.title);
    return NextResponse.json(session, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to create session" },
      { status: 500 },
    );
  }
}

export const dynamic = "force-dynamic";
