import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/src/lib/supabase/server";

export async function POST(req: NextRequest) {
  const serverSupabase = await createServerClient();
  const { data: { user } } = await serverSupabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await serverSupabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single() as { data: { role: string } | null };

  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { userId } = await req.json();

  if (!userId) {
    return NextResponse.json({ error: "userId is required" }, { status: 400 });
  }

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Handle all FK constraints that block deletion (no ON DELETE CASCADE/SET NULL defined in schema)

  // courses.created_by is NOT NULL + RESTRICT — transfer ownership to the admin
  await supabaseAdmin
    .from("courses")
    .update({ created_by: user.id })
    .eq("created_by", userId);

  // enrollments.teacher_id has no ON DELETE clause (defaults to NO ACTION) — nullable, set to null
  await supabaseAdmin
    .from("enrollments")
    .update({ teacher_id: null })
    .eq("teacher_id", userId);

  // live_sessions.student_id has no ON DELETE clause — nullable, set to null
  await supabaseAdmin
    .from("live_sessions")
    .update({ student_id: null })
    .eq("student_id", userId);

  // student_schedules.confirmed_by has no ON DELETE clause — nullable, set to null
  await supabaseAdmin
    .from("student_schedules")
    .update({ confirmed_by: null })
    .eq("confirmed_by", userId);

  const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
