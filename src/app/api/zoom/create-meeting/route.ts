import { createClient } from "@/src/lib/supabase/server";
import { createZoomMeeting } from "@/src/lib/zoom";
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
    const body = await req.json();
    const { course_id, title, scheduled_at, duration_minutes, student_id } =
      body as {
        course_id: string;
        title: string;
        scheduled_at: string;
        duration_minutes: number;
        student_id?: string;
      };

    if (!course_id || !title || !scheduled_at || !duration_minutes) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // ---------- Create Zoom meeting ----------
    const startTimeISO = new Date(scheduled_at).toISOString();
    const zoom = await createZoomMeeting(
      title,
      startTimeISO,
      duration_minutes,
      user.email! // teacher's email as host
    );

    // ---------- Insert into live_sessions ----------
    const insertPayload: Record<string, any> = {
      course_id,
      teacher_id: user.id,
      title,
      scheduled_at: startTimeISO,
      duration_minutes,
      zoom_meeting_id: zoom.meeting_id,
      zoom_join_url: zoom.join_url,
      zoom_start_url: zoom.start_url,
      status: "scheduled",
    };

    if (student_id) {
      insertPayload.student_id = student_id;
    }

    const { data: session, error: insertError } = await supabase
      .from("live_sessions")
      .insert(insertPayload)
      .select("*")
      .single();

    if (insertError) {
      return NextResponse.json(
        { error: insertError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ session });
  } catch (err: any) {
    console.error("Zoom create-meeting error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
