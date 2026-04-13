import { createClient } from "@/src/lib/supabase/server";
import { createZoomMeeting } from "@/src/lib/zoom";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

interface ScheduleDay {
  dayOfWeek: number; // 0=Sun, 1=Mon, ...6=Sat
  startTime: string; // "HH:mm"
  endTime: string;   // "HH:mm"
}

/**
 * Batch-create Zoom meetings for all sessions in a course enrollment.
 *
 * Body: {
 *   enrollment_id: string,
 *   course_id: string,
 *   teacher_id: string,
 *   student_id: string,
 *   course_title: string,
 *   total_sessions: number,
 *   classes_per_week: number,
 *   schedule: ScheduleDay[],         // weekly recurring days+times
 *   start_date: string,              // ISO date: first possible session date
 *   duration_minutes: number,
 * }
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = (await createClient()) as any;

    // Auth: admin only
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    if (!profile || profile.role !== "admin") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const body = await req.json();
    const {
      enrollment_id,
      course_id,
      teacher_id,
      student_id,
      course_title,
      total_sessions,
      classes_per_week,
      schedule,
      start_date,
      duration_minutes,
    } = body as {
      enrollment_id: string;
      course_id: string;
      teacher_id: string;
      student_id: string;
      course_title: string;
      total_sessions: number;
      classes_per_week: number;
      schedule: ScheduleDay[];
      start_date: string;
      duration_minutes: number;
    };

    if (!enrollment_id || !course_id || !teacher_id || !student_id || !schedule?.length || !total_sessions) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (classes_per_week && schedule.length !== classes_per_week) {
      return NextResponse.json(
        { error: `Expected ${classes_per_week} weekly schedule slot${classes_per_week > 1 ? "s" : ""}.` },
        { status: 400 }
      );
    }

    // Get teacher email for Zoom host
    const { data: teacher } = await supabase
      .from("profiles")
      .select("email")
      .eq("id", teacher_id)
      .single();
    if (!teacher) {
      return NextResponse.json({ error: "Teacher not found" }, { status: 404 });
    }

    // Generate session dates
    const sessionDates = generateSessionDates(
      new Date(start_date),
      schedule,
      total_sessions
    );

    const createdSessions = [];

    for (let i = 0; i < sessionDates.length; i++) {
      const { date, daySchedule } = sessionDates[i];
      const sessionNum = i + 1;

      // Build scheduled_at datetime
      const [hours, mins] = daySchedule.startTime.split(":").map(Number);
      const scheduledAt = new Date(date);
      scheduledAt.setHours(hours, mins, 0, 0);

      const topic = `${course_title} - Session ${sessionNum}`;
      const dur = duration_minutes || computeDuration(daySchedule.startTime, daySchedule.endTime);

      try {
        // Create Zoom meeting
        const zoom = await createZoomMeeting(
          topic,
          scheduledAt.toISOString(),
          dur,
          teacher.email
        );

        // Insert live_session
        const { data: session, error } = await supabase
          .from("live_sessions")
          .insert({
            course_id,
            teacher_id,
            student_id,
            enrollment_id,
            title: topic,
            scheduled_at: scheduledAt.toISOString(),
            duration_minutes: dur,
            session_number: sessionNum,
            zoom_meeting_id: zoom.meeting_id,
            zoom_join_url: zoom.join_url,
            zoom_start_url: zoom.start_url,
            status: "scheduled",
          })
          .select("*")
          .single();

        if (error) throw error;
        createdSessions.push(session);
      } catch (err: any) {
        console.error(`Failed to create session ${sessionNum}:`, err.message);
        // Continue creating remaining sessions even if one fails
        createdSessions.push({ session_number: sessionNum, error: err.message });
      }
    }

    return NextResponse.json({
      total_created: createdSessions.filter((s) => !("error" in s)).length,
      total_requested: total_sessions,
      sessions: createdSessions,
    });
  } catch (err: any) {
    console.error("Batch create error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/**
 * Given a start date, weekly schedule, and total count, compute the actual
 * dates for each session.
 */
function generateSessionDates(
  startDate: Date,
  schedule: ScheduleDay[],
  totalSessions: number
): { date: Date; daySchedule: ScheduleDay }[] {
  const results: { date: Date; daySchedule: ScheduleDay }[] = [];
  const sortedDays = [...schedule].sort((a, b) => a.dayOfWeek - b.dayOfWeek);

  const current = new Date(startDate);
  current.setHours(0, 0, 0, 0);

  // Cap at 52 weeks to prevent infinite loops
  const maxIterations = 52 * 7;
  let iterations = 0;

  while (results.length < totalSessions && iterations < maxIterations) {
    const dayOfWeek = current.getDay();
    const matchingDay = sortedDays.find((d) => d.dayOfWeek === dayOfWeek);

    if (matchingDay && current >= startDate) {
      results.push({ date: new Date(current), daySchedule: matchingDay });
    }

    current.setDate(current.getDate() + 1);
    iterations++;
  }

  return results;
}

function computeDuration(startTime: string, endTime: string): number {
  const [sh, sm] = startTime.split(":").map(Number);
  const [eh, em] = endTime.split(":").map(Number);
  return (eh * 60 + em) - (sh * 60 + sm);
}
