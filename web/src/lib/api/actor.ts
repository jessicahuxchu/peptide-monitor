import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";

export interface ActorIdentity {
  email: string;
  name: string;
  userId: string;
}

export async function requireSignedInActor(): Promise<
  { ok: true; actor: ActorIdentity } | { ok: false; response: NextResponse }
> {
  const user = await currentUser();
  const email = user?.emailAddresses[0]?.emailAddress?.trim().toLowerCase();
  if (!user?.id || !email) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Sign in required" }, { status: 401 }),
    };
  }
  return {
    ok: true,
    actor: {
      email,
      name: user.fullName ?? email,
      userId: user.id,
    },
  };
}

export async function getOptionalViewerEmail(): Promise<string | null> {
  const user = await currentUser();
  return user?.emailAddresses[0]?.emailAddress?.trim().toLowerCase() ?? null;
}
