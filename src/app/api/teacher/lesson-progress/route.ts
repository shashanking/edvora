import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/src/lib/supabase/server";

// Teacher-authorized endpoint for marking a lesson complete/incomplete on
// behalf of a student. Lesson completion now drives module progression
// (see 0779ad6), so this is a grading decision — it must be teacher-
// controlled, not self-reported by the student. The RLS policy on
// lesson_progress ("Students can manage own lesson progress") only allows
// student_id = auth.uid() writes, so a teacher cannot write another user's
// row via the normal client; this route authenticates + authorizes the
// teacher server-side, then uses the service-role client to perform the
// write (same pattern as /api/admin/force-verify).
export async function POST(req: NextRequest) {
  const serverSupabase = (await createServerClient()) as any;
  const {
    data: { user },
  } = await serverSupabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await serverSupabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "teacher" && profile?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const { studentId, lessonId, completed } = (body || {}) as {
    studentId?: string;
    lessonId?: string;
    completed?: boolean;
  };

  if (!studentId || !lessonId || typeof completed !== "boolean") {
    return NextResponse.json(
      { error: "studentId, lessonId and completed are required" },
      { status: 400 }
    );
  }

  // Resolve the lesson's course so we can confirm this teacher is actually
  // assigned to this student for this course before letting them write.
  const { data: lesson, error: lessonError } = await serverSupabase
    .from("course_lessons")
    .select("id, module_id")
    .eq("id", lessonId)
    .single();

  if (lessonError || !lesson) {
    return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
  }

  const { data: courseModule, error: moduleError } = await serverSupabase
    .from("course_modules")
    .select("id, course_id")
    .eq("id", lesson.module_id)
    .single();

  if (moduleError || !courseModule) {
    return NextResponse.json({ error: "Module not found" }, { status: 404 });
  }

  // Admins can act on any course; teachers must be the assigned teacher on
  // this specific student's enrollment for this course (1:1 pacing model —
  // see enrollments.teacher_id, added in 004).
  if (profile.role === "teacher") {
    const { data: enrollment } = await serverSupabase
      .from("enrollments")
      .select("id")
      .eq("student_id", studentId)
      .eq("course_id", courseModule.course_id)
      .eq("teacher_id", user.id)
      .in("status", ["active", "completed"])
      .maybeSingle();

    if (!enrollment) {
      return NextResponse.json(
        { error: "You are not assigned to teach this student in this course" },
        { status: 403 }
      );
    }
  }

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { error } = await supabaseAdmin.from("lesson_progress").upsert(
    {
      student_id: studentId,
      lesson_id: lessonId,
      completed,
      completed_at: completed ? new Date().toISOString() : null,
    },
    { onConflict: "student_id,lesson_id" }
  );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  // Marking a lesson complete means the teacher is confirming the student
  // actually took that class, so it should also mark attendance as Present
  // for today — these were previously two entirely disconnected systems
  // (a teacher could mark lessons complete all day and attendance stayed
  // empty unless separately filled in via the Sessions tab / Attendance
  // page). Only wired for the completed=true direction: un-completing a
  // lesson is a correction to progress tracking, not a statement that the
  // student was actually absent, so it intentionally leaves any existing
  // attendance record alone.
  //
  // There's no session_id in scope here (lesson completion isn't tied to a
  // specific live_sessions row), so "today" (server date) is used as the
  // attendance date — the same date-keyed shape the Sessions tab and
  // Attendance page already write to (attendance is unique per
  // course_id/student_id/date).
  let attendanceMarked = false;
  if (completed) {
    const todayStr = new Date().toISOString().split("T")[0];
    const { error: attendanceError } = await supabaseAdmin.from("attendance").upsert(
      {
        course_id: courseModule.course_id,
        student_id: studentId,
        teacher_id: user.id,
        date: todayStr,
        status: "present",
      },
      { onConflict: "course_id,student_id,date" }
    );
    if (!attendanceError) {
      attendanceMarked = true;
    }
    // Best-effort — a failure here shouldn't fail the lesson-progress
    // write, which is the primary action the teacher took.
  }

  return NextResponse.json({ success: true, attendanceMarked });
}
