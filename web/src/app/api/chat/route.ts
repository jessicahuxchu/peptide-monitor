import { NextResponse } from "next/server";
import {
  generateChatResponse,
  type ChatMessage,
} from "@/lib/agent/chat-responder";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      messages?: ChatMessage[];
      locale?: "en" | "zh";
    };
    const messages = body.messages ?? [];
    const locale = body.locale ?? "zh";
    const reply = generateChatResponse(messages, locale);
    return NextResponse.json({ reply });
  } catch {
    return NextResponse.json({ error: "Chat failed" }, { status: 500 });
  }
}
