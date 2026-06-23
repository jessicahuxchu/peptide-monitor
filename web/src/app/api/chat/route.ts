import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { callHermesChat, type ChatIntent } from "@/lib/agent/hermes-client";
import type { ChatMessage } from "@/lib/agent/chat-responder";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { createInboxSubmission } from "@/lib/db/inbox";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      messages?: ChatMessage[];
      locale?: "en" | "zh";
      intent?: ChatIntent;
      attachmentText?: string;
    };

    const messages = body.messages ?? [];
    const locale = body.locale ?? "zh";
    const intent = body.intent ?? "chat";

    const user = await currentUser();
    const author =
      user?.fullName ??
      user?.emailAddresses[0]?.emailAddress ??
      "User";

    const result = await callHermesChat({
      messages,
      locale,
      intent,
      attachmentText: body.attachmentText,
    });

    let inboxQueued = false;
    if (result.shouldQueueInbox && result.inboxContent && isSupabaseConfigured()) {
      try {
        await createInboxSubmission(author, result.inboxContent);
        inboxQueued = true;
      } catch {
        inboxQueued = false;
      }
    }

    return NextResponse.json({
      reply: result.reply,
      provider: result.provider,
      inboxQueued,
    });
  } catch {
    return NextResponse.json({ error: "Chat failed" }, { status: 500 });
  }
}
