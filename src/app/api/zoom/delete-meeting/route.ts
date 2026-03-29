import { createClient } from "@/src/lib/supabase/server";
import { deleteZoomMeeting } from "@/src/lib/zoom";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const supabase = (await createClient()) as any;

    // ---------- Auth ----------
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || !["teacher", "admin"].includes(profile.role)) {
      return NextResponse.json(
        { error: "Teacher or admin access required" },
        { status: 403 }
      );
    }

    // ---------- Body ----------
    const { meeting_id, session_id } = (await req.json()) as {
      meeting_id: string;
      session_id: string;
    };

    if (!meeting_id || !session_id) {
      return NextResponse.json(
        { error: "meeting_id and session_id are required" },
        { status: 400 }
      );
    }

    // ---------- Delete on Zoom ----------
    await deleteZoomMeeting(meeting_id);

    // ---------- Clear zoom fields in DB ----------
    const { error: updateError } = await supabase
      .from("live_sessions")
      .update({
        zoom_meeting_id: null,
        zoom_join_url: null,
        zoom_start_url: null,
      } as any)
      .eq("id", session_id);

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Zoom delete-meeting error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
