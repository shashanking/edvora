import { createClient } from "@/src/lib/supabase/server";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const supabase = await createClient() as any;

    // Delete recording URLs where recording_expires_at is in the past
    const now = new Date().toISOString();

    const { data: expired, error: fetchError } = await supabase
      .from("live_sessions")
      .select("id, recording_url")
      .not("recording_url", "is", null)
      .lt("recording_expires_at", now);

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    if (expired && expired.length > 0) {
      const ids = expired.map((s: any) => s.id);

      const { error: updateError } = await supabase
        .from("live_sessions")
        .update({ recording_url: null, recording_expires_at: null } as any)
        .in("id", ids);

      if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 500 });
      }

      return NextResponse.json({ cleaned: ids.length });
    }

    return NextResponse.json({ cleaned: 0 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
