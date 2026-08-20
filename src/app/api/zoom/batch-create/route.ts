import { createClient } from "@/src/lib/supabase/server";
import { createZoomMeeting, deleteZoomMeeting } from "@/src/lib/zoom";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

interface ScheduleDay {
  dayOfWeek: number; // 0=Sun, 1=Mon, ...6=Sat
  startTime: string; // "HH:mm"
  endTime: string;   // "HH:mm"
}

/**
 * Batch-create Zoom meetings + live_sessions rows for a course enrollment.
 *
 * Two call shapes:
 *
 *  1. Enrollment wizard (admin > Enrollments > Enroll Student) passes the
 *     full payload it already has in hand.
 *
 *  2. Backfill / retry ("Generate sessions" on the enrollments table) passes
 *     only `{ enrollment_id }`. Everything else — teacher, course, weekly
 *     schedule, duration — is resolved server-side from the enrollment and
 *     its `student_schedules` rows.
 *
 * The route is idempotent: session numbers that already exist for the
 * enrollment are skipped, so a failed run can simply be re-run. It only
 * reports success when at least one session was actually written; a run that
 * creates nothing returns a non-2xx so the caller can't mistake a broken
 * enrollment for a working one.
 *
 * Body: {
 *   enrollment_id: string,           // required
 *   course_id?: string,
 *   teacher_id?: string,
 *   student_id?: string,
 *   course_title?: string,
 *   total_sessions?: number,
 *   classes_per_week?: number,
 *   schedule?: ScheduleDay[],        // weekly recurring days+times
 *   start_date?: string,             // ISO date: first possible session date
 *   duration_minutes?: number,
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
    const { enrollment_id } = body as { enrollment_id?: string };

    if (!enrollment_id) {
      return NextResponse.json({ error: "enrollment_id is required" }, { status: 400 });
    }

    // The enrollment row is the source of truth for who/what/which teacher.
    // Trusting the client payload for these let a mismatched body write
    // sessions against the wrong enrollment.
    const { data: enrollment, error: enrErr } = await supabase
      .from("enrollments")
      .select("id, student_id, course_id, teacher_id, classes_per_week, enrolled_at")
      .eq("id", enrollment_id)
      .single();

    if (enrErr || !enrollment) {
      return NextResponse.json({ error: "Enrollment not found" }, { status: 404 });
    }

    const course_id: string = enrollment.course_id;
    const student_id: string = enrollment.student_id;
    const teacher_id: string = body.teacher_id || enrollment.teacher_id;

    if (!teacher_id) {
      return NextResponse.json(
        { error: "This enrollment has no teacher assigned. Assign a teacher before scheduling sessions." },
        { status: 400 }
      );
    }

    // ---- Weekly schedule: from the request, else from student_schedules ----
    let schedule: ScheduleDay[] = Array.isArray(body.schedule) ? body.schedule : [];

    if (!schedule.length) {
      const { data: schedRows, error: schedErr } = await supabase
        .from("student_schedules")
        .select("day_of_week, preferred_start_time, preferred_end_time, confirmed_start_time, confirmed_end_time")
        .eq("student_id", student_id)
        .eq("course_id", course_id)
        .order("day_of_week", { ascending: true });

      if (schedErr) {
        return NextResponse.json(
          { error: "Failed to read the weekly schedule: " + schedErr.message },
          { status: 500 }
        );
      }

      schedule = ((schedRows as any[]) || []).map((r) => ({
        dayOfWeek: r.day_of_week,
        startTime: trimTime(r.confirmed_start_time || r.preferred_start_time),
        endTime: trimTime(r.confirmed_end_time || r.preferred_end_time),
      }));
    }

    if (!schedule.length) {
      return NextResponse.json(
        {
          error:
            "No weekly schedule found for this enrollment. Set the student's weekly days and times before generating sessions.",
        },
        { status: 400 }
      );
    }

    const classes_per_week: number | undefined =
      body.classes_per_week ?? enrollment.classes_per_week ?? undefined;

    if (classes_per_week && schedule.length !== classes_per_week) {
      return NextResponse.json(
        { error: `Expected ${classes_per_week} weekly schedule slot${classes_per_week > 1 ? "s" : ""}, found ${schedule.length}.` },
        { status: 400 }
      );
    }

    // ---- Course + teacher lookups ----
    const [{ data: teacher }, { data: course }] = await Promise.all([
      supabase.from("profiles").select("email").eq("id", teacher_id).single(),
      supabase.from("courses").select("title, total_sessions").eq("id", course_id).single(),
    ]);

    if (!teacher) {
      return NextResponse.json({ error: "Teacher not found" }, { status: 404 });
    }

    const course_title: string = body.course_title || course?.title || "Course";

    // Fetch ordered lessons for this course (via course_modules join)
    const { data: lessonsData, error: lessonsErr } = await supabase
      .from("course_lessons")
      .select("id, title, module_id, display_order, course_modules(title, display_order)")
      .eq("course_modules.course_id", course_id)
      .order("display_order", { ascending: true });

    if (lessonsErr) {
      return NextResponse.json({ error: "Failed to fetch course lessons: " + lessonsErr.message }, { status: 500 });
    }

    // Filter to lessons that belong to this course (join may return nulls for unmatched rows)
    const lessons = ((lessonsData as any[]) || []).filter((l: any) => l.course_modules !== null);

    // Sort by module display_order then lesson display_order
    lessons.sort((a: any, b: any) => {
      const modA = a.course_modules?.display_order ?? 0;
      const modB = b.course_modules?.display_order ?? 0;
      if (modA !== modB) return modA - modB;
      return (a.display_order ?? 0) - (b.display_order ?? 0);
    });

    // `total_sessions` (course setting) and the actual number of lessons
    // built in Manage Content are independent admin inputs today. If the
    // admin set total_sessions higher than the lessons that actually exist,
    // pairing sessions 1:1 by array index (below) would run past the end of
    // `lessons` and create sessions with no valid lesson attached. Cap the
    // number of sessions we create at the number of real lessons so every
    // created session always has a lesson_id — never create orphaned
    // sessions. Surface the shortfall to the caller instead of failing
    // silently.
    const requestedSessionCount =
      body.total_sessions ?? course?.total_sessions ?? lessons.length;

    if (lessons.length === 0) {
      return NextResponse.json(
        {
          error:
            "This course has no lessons yet. Add lessons in Manage Content before enrolling students.",
        },
        { status: 400 }
      );
    }

    const sessionCount = Math.min(requestedSessionCount, lessons.length);
    const lessonShortfall = requestedSessionCount > lessons.length;

    // ---- Idempotency: never duplicate a session that already exists ----
    // A retry after a partial failure must top up the missing sessions, not
    // create a second full set. Session numbers are 1..sessionCount and are
    // unique per enrollment.
    const { data: existingSessions, error: existingErr } = await supabase
      .from("live_sessions")
      .select("session_number")
      .eq("enrollment_id", enrollment_id);

    if (existingErr) {
      return NextResponse.json(
        { error: "Failed to read existing sessions: " + existingErr.message },
        { status: 500 }
      );
    }

    const existingNumbers = new Set(
      ((existingSessions as { session_number: number }[]) || []).map((s) => s.session_number)
    );

    // Default the start date to today so the backfill/retry path schedules
    // forward rather than into the past.
    const startDate = body.start_date ? new Date(body.start_date) : new Date();

    // Generate session dates based on lesson count
    const sessionDates = generateSessionDates(startDate, schedule, sessionCount);

    const created: any[] = [];
    const failed: { session_number: number; error: string }[] = [];
    let skipped = 0;

    for (let i = 0; i < sessionDates.length; i++) {
      const { date, daySchedule } = sessionDates[i];
      const sessionNum = i + 1;

      if (existingNumbers.has(sessionNum)) {
        skipped++;
        continue;
      }

      const lesson = lessons[i] as any | undefined;

      // Build scheduled_at datetime
      const [hours, mins] = daySchedule.startTime.split(":").map(Number);
      const scheduledAt = new Date(date);
      scheduledAt.setHours(hours, mins, 0, 0);

      const topic = lesson
        ? `Session ${lesson.course_modules?.title} - ${lesson.title}`
        : `${course_title} - Session ${sessionNum}`;
      const dur =
        body.duration_minutes || computeDuration(daySchedule.startTime, daySchedule.endTime);

      let zoomMeetingId: string | null = null;
      try {
        // Create Zoom meeting
        const zoom = await createZoomMeeting(
          topic,
          scheduledAt.toISOString(),
          dur,
          teacher.email
        );
        zoomMeetingId = zoom.meeting_id;

        // Insert live_session
        const { data: session, error } = await supabase
          .from("live_sessions")
          .insert({
            course_id,
            teacher_id,
            student_id,
            enrollment_id,
            lesson_id: lesson?.id ?? null,
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
        created.push(session);
      } catch (err: any) {
        console.error(`Failed to create session ${sessionNum}:`, err?.message);

        // The Zoom meeting may have been created before the DB insert failed.
        // Leaving it behind would clutter the teacher's Zoom account with
        // meetings no session row points at, and a retry would create a
        // second one, so drop it on the way out.
        if (zoomMeetingId) {
          await deleteZoomMeeting(zoomMeetingId).catch(() => {});
        }

        failed.push({ session_number: sessionNum, error: err?.message || "Unknown error" });
      }
    }

    const payload = {
      total_created: created.length,
      total_skipped: skipped,
      total_requested: sessionCount,
      total_sessions_target: requestedSessionCount,
      lesson_shortfall: lessonShortfall,
      failed,
      sessions: created,
    };

    // An enrollment with zero sessions is a broken enrollment — the student's
    // portal shows nothing at all. Report that as a failure so the caller
    // surfaces a real error and can retry, rather than showing a success
    // toast over an empty schedule.
    if (created.length === 0 && skipped === 0) {
      return NextResponse.json(
        {
          ...payload,
          error:
            failed.length > 0
              ? `No sessions could be created. First error: ${failed[0].error}`
              : "No sessions could be created for this enrollment.",
        },
        { status: 502 }
      );
    }

    return NextResponse.json(payload);
  } catch (err: any) {
    console.error("Batch create error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/** Postgres `time` comes back as "HH:MM:SS"; the schedule math wants "HH:MM". */
function trimTime(value: string | null): string {
  if (!value) return "00:00";
  const [h, m] = value.split(":");
  return `${h}:${m}`;
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

  const from = new Date(startDate);
  from.setHours(0, 0, 0, 0);

  // Cap at 52 weeks to prevent infinite loops
  const maxIterations = 52 * 7;
  let iterations = 0;

  while (results.length < totalSessions && iterations < maxIterations) {
    const dayOfWeek = current.getDay();
    const matchingDay = sortedDays.find((d) => d.dayOfWeek === dayOfWeek);

    if (matchingDay && current >= from) {
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
