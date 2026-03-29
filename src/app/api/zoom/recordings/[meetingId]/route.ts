import { createClient } from "@/src/lib/supabase/server";
import { getZoomRecordings } from "@/src/lib/zoom";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ meetingId: string }> }
) {
  try {
    const { meetingId } = await params;
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

    // ---------- Fetch recordings from Zoom ----------
    const recordings = await getZoomRecordings(meetingId);

    // ---------- Persist first recording URL ----------
    if (recordings.length > 0) {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);

      await supabase
        .from("live_sessions")
        .update({
          recording_url: recordings[0].download_url,
          recording_expires_at: expiresAt.toISOString(),
        } as any)
        .eq("zoom_meeting_id", meetingId);
    }

    return NextResponse.json({ recordings });
  } catch (err: any) {
    console.error("Zoom recordings error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
