import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/src/lib/supabase/server";

// Admin-only endpoint used when enrolling a student who is starting partway
// through a course (e.g. already learned modules 1-2 elsewhere, or is
// migrating from another system). Rather than inventing a new "starting
// module" concept, this pre-seeds lesson_progress with completed:true for
// every lesson in every module before the chosen starting module — the
// existing completion-based module progression (see 0779ad6) then naturally
// resolves the student's current module to the one they picked.
//
// The RLS policy on lesson_progress ("Students can manage own lesson
// progress") only allows student_id = auth.uid() writes, and admins only
// have a SELECT policy — so this can't be done from the admin's own client
// like the rest of the enrollment wizard. Same pattern as
// /api/admin/force-verify and /api/teacher/lesson-progress: authenticate +
// authorize server-side, then write with the service-role client.
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

  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const { studentId, courseId, startModuleId } = (body || {}) as {
    studentId?: string;
    courseId?: string;
    startModuleId?: string;
  };

  if (!studentId || !courseId || !startModuleId) {
    return NextResponse.json(
      { error: "studentId, courseId and startModuleId are required" },
      { status: 400 }
    );
  }

  const { data: modules, error: modulesError } = await serverSupabase
    .from("course_modules")
    .select("id, display_order")
    .eq("course_id", courseId)
    .order("display_order", { ascending: true });

  if (modulesError) {
    return NextResponse.json({ error: modulesError.message }, { status: 400 });
  }

  const mods = (modules as { id: string; display_order: number }[]) || [];
  const startModule = mods.find((m) => m.id === startModuleId);

  if (!startModule) {
    return NextResponse.json(
      { error: "startModuleId is not a module of this course" },
      { status: 400 }
    );
  }

  // Nothing to pre-complete if starting at the first module — behave
  // exactly as today (no lesson_progress rows inserted).
  const priorModuleIds = mods
    .filter((m) => m.display_order < startModule.display_order)
    .map((m) => m.id);

  if (priorModuleIds.length === 0) {
    return NextResponse.json({ success: true, seeded: 0 });
  }

  const { data: lessons, error: lessonsError } = await serverSupabase
    .from("course_lessons")
    .select("id")
    .in("module_id", priorModuleIds);

  if (lessonsError) {
    return NextResponse.json({ error: lessonsError.message }, { status: 400 });
  }

  const lessonRows = (lessons as { id: string }[]) || [];

  if (lessonRows.length === 0) {
    return NextResponse.json({ success: true, seeded: 0 });
  }

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const completedAt = new Date().toISOString();
  const upsertRows = lessonRows.map((l) => ({
    student_id: studentId,
    lesson_id: l.id,
    completed: true,
    completed_at: completedAt,
  }));

  const { error: upsertError } = await supabaseAdmin
    .from("lesson_progress")
    .upsert(upsertRows, { onConflict: "student_id,lesson_id" });

  if (upsertError) {
    return NextResponse.json({ error: upsertError.message }, { status: 400 });
  }

  return NextResponse.json({ success: true, seeded: upsertRows.length });
}
