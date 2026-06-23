import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { canReviewInbox } from "@/lib/auth/reviewers";

export async function requireInboxReviewer() {
  const user = await currentUser();
  const email = user?.emailAddresses[0]?.emailAddress;
  if (!canReviewInbox(email)) {
    return {
      ok: false as const,
      response: NextResponse.json({ error: "Review permission required" }, { status: 403 }),
    };
  }
  return {
    ok: true as const,
    actor: user?.fullName ?? email ?? "reviewer",
  };
}
