import { createClient } from "@/src/lib/supabase/server";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const supabase = (await createClient()) as any;

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Find all scheduled/live sessions where scheduled_at + duration has passed
    const now = new Date().toISOString();

    const { data: sessions, error: fetchError } = await supabase
      .from("live_sessions")
      .select("id, scheduled_at, duration_minutes, status")
      .in("status", ["scheduled", "live"]);

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    const toComplete: string[] = [];
    for (const session of sessions || []) {
      const endTime = new Date(
        new Date(session.scheduled_at).getTime() +
          session.duration_minutes * 60 * 1000
      );
      if (endTime <= new Date(now)) {
        toComplete.push(session.id);
      }
    }

    if (toComplete.length > 0) {
      const { error: updateError } = await supabase
        .from("live_sessions")
        .update({ status: "completed" })
        .in("id", toComplete);

      if (updateError) {
        return NextResponse.json(
          { error: updateError.message },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({ completed: toComplete.length });
  } catch (err: any) {
    console.error("Auto-complete sessions error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
