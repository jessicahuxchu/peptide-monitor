import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase/client";

export async function GET() {
  return NextResponse.json({
    ok: true,
    supabase: isSupabaseConfigured(),
    version: "peptide-command-v4",
  });
}
