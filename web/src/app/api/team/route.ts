import { NextResponse } from "next/server";
import { getTeamMembersAsync } from "@/lib/auth/team-members";

/** Active platform users for alert assignee pickers. */
export async function GET() {
  const members = await getTeamMembersAsync();
  return NextResponse.json({ members });
}
