import { createClient } from "@/src/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Check if a teacher has schedule overlaps with given days/times.
 *
 * Body: { teacher_id, schedule: [{ dayOfWeek, startTime, endTime }] }
 * Returns: { overlaps: [{ day, existing_student, existing_course, time }] }
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = (await createClient()) as any;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { teacher_id, schedule } = body as {
      teacher_id: string;
      schedule: { dayOfWeek: number; startTime: string; endTime: string }[];
    };

    if (!teacher_id || !schedule?.length) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    // Get all existing confirmed schedules for this teacher
    // We check via enrollments where teacher_id matches, then find student_schedules
    const { data: teacherEnrollments } = await supabase
      .from("enrollments")
      .select("id, course_id, student_id")
      .eq("teacher_id", teacher_id)
      .eq("status", "active");

    if (!teacherEnrollments || teacherEnrollments.length === 0) {
      return NextResponse.json({ overlaps: [] });
    }

    // Get schedules for these enrollments
    const studentIds = teacherEnrollments.map((e: any) => e.student_id);
    const courseIds = teacherEnrollments.map((e: any) => e.course_id);

    const { data: existingSchedules } = await supabase
      .from("student_schedules")
      .select("*")
      .in("student_id", studentIds)
      .in("course_id", courseIds);

    if (!existingSchedules || existingSchedules.length === 0) {
      return NextResponse.json({ overlaps: [] });
    }

    // Get student/course names for overlap messages
    const { data: students } = await supabase
      .from("profiles")
      .select("id, full_name")
      .in("id", studentIds);
    const { data: courses } = await supabase
      .from("courses")
      .select("id, title")
      .in("id", courseIds);

    const studentMap = new Map((students || []).map((s: any) => [s.id, s.full_name]));
    const courseMap = new Map((courses || []).map((c: any) => [c.id, c.title]));

    const overlaps: any[] = [];

    for (const newSlot of schedule) {
      for (const existing of existingSchedules as any[]) {
        if (existing.day_of_week !== newSlot.dayOfWeek) continue;

        const existStart = existing.confirmed_start_time || existing.preferred_start_time;
        const existEnd = existing.confirmed_end_time || existing.preferred_end_time;

        // Check time overlap
        if (timesOverlap(newSlot.startTime, newSlot.endTime, existStart, existEnd)) {
          overlaps.push({
            day: newSlot.dayOfWeek,
            existing_student: studentMap.get(existing.student_id) || "Unknown",
            existing_course: courseMap.get(existing.course_id) || "Unknown",
            existing_time: `${existStart} - ${existEnd}`,
            requested_time: `${newSlot.startTime} - ${newSlot.endTime}`,
          });
        }
      }
    }

    return NextResponse.json({ overlaps });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

function timesOverlap(s1: string, e1: string, s2: string, e2: string): boolean {
  const toMins = (t: string) => {
    const [h, m] = t.split(":").map(Number);
    return h * 60 + m;
  };
  const start1 = toMins(s1), end1 = toMins(e1);
  const start2 = toMins(s2), end2 = toMins(e2);
  return start1 < end2 && start2 < end1;
}
