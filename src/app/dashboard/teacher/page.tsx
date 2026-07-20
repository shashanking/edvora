import { createClient } from "@/src/lib/supabase/server";
import { redirect } from "next/navigation";
import { BookOpen, Users, ClipboardList, Video, Calendar, MessageSquare } from "lucide-react";

export default async function TeacherDashboardPage() {
  const supabase = (await createClient()) as any;
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = (await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .single()) as { data: { full_name: string } | null };

  // "Active Students" must be scoped to enrollments.teacher_id — the actual
  // per-student assignment (migration 004) — not course_teachers (which
  // only says this teacher is *one of possibly several* teachers attached
  // to the course). The previous query tried to express that via an
  // embedded `course_teachers!inner(...)` join on the enrollments table,
  // but there is no FK between enrollments and course_teachers for
  // PostgREST to embed on, so it silently errored and always returned 0 —
  // this was the root cause of the teacher dashboard showing no assigned
  // students at all.
  const [
    { count: courseCount },
    { data: myEnrollments },
    { count: pendingSubmissions },
  ] = await Promise.all([
    supabase
      .from("course_teachers")
      .select("*", { count: "exact", head: true })
      .eq("teacher_id", user.id),
    supabase
      .from("enrollments")
      .select("id, student_id, course_id, enrolled_at")
      .eq("teacher_id", user.id)
      .eq("status", "active")
      .order("enrolled_at", { ascending: false }),
    supabase
      .from("assignment_submissions")
      .select("*, assignments!inner(teacher_id)", { count: "exact", head: true })
      .eq("assignments.teacher_id", user.id)
      .is("graded_at", null),
  ]);

  const enrollmentRows = myEnrollments || [];
  const studentCount = enrollmentRows.length;

  // Resolve names for the "My Assigned Students" list below.
  let assignedStudents: { name: string; course: string; enrolledAt: string }[] = [];
  if (enrollmentRows.length > 0) {
    const studentIds = [...new Set(enrollmentRows.map((e: any) => e.student_id))];
    const courseIds = [...new Set(enrollmentRows.map((e: any) => e.course_id))];
    const [{ data: studentsData }, { data: coursesData }] = await Promise.all([
      supabase.from("profiles").select("id, full_name").in("id", studentIds),
      supabase.from("courses").select("id, title").in("id", courseIds),
    ]);
    const studentMap = new Map(((studentsData as any[]) || []).map((s) => [s.id, s.full_name]));
    const courseMap = new Map(((coursesData as any[]) || []).map((c) => [c.id, c.title]));
    assignedStudents = enrollmentRows.slice(0, 5).map((e: any) => ({
      name: studentMap.get(e.student_id) || "Unknown",
      course: courseMap.get(e.course_id) || "Unknown",
      enrolledAt: e.enrolled_at,
    }));
  }

  const stats = [
    { label: "Assigned Courses", value: courseCount ?? 0, icon: <BookOpen className="w-6 h-6" />, color: "bg-blue-50 text-[#1F4FD8]" },
    { label: "Active Students", value: studentCount ?? 0, icon: <Users className="w-6 h-6" />, color: "bg-green-50 text-green-600" },
    { label: "Pending Reviews", value: pendingSubmissions ?? 0, icon: <ClipboardList className="w-6 h-6" />, color: "bg-amber-50 text-amber-600" },
    { label: "Upcoming Sessions", value: 0, icon: <Video className="w-6 h-6" />, color: "bg-purple-50 text-purple-600" },
  ];

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-poppins font-bold text-[#1C1C28]">
          {greeting()}, {profile?.full_name?.split(" ")[0] || "Teacher"} 👋
        </h1>
        <p className="text-[#4D4D4D] mt-1">Here&apos;s your teaching overview</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-3">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.color}`}>
                {stat.icon}
              </div>
            </div>
            <p className="text-2xl font-poppins font-bold text-[#1C1C28]">{stat.value}</p>
            <p className="text-sm text-[#4D4D4D] mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      <div>
        <h2 className="text-lg font-poppins font-semibold text-[#1C1C28] mb-4">My Assigned Students</h2>
        {assignedStudents.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 text-center">
            <p className="text-sm text-[#9CA3AF]">No students assigned to you yet.</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-50">
            {assignedStudents.map((s, i) => (
              <div key={i} className="flex items-center justify-between px-5 py-3.5">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#1F4FD8]/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-[#1F4FD8]">{s.name.charAt(0)}</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[#1C1C28]">{s.name}</p>
                    <p className="text-xs text-[#9CA3AF]">{s.course}</p>
                  </div>
                </div>
                <span className="text-xs text-[#9CA3AF]">
                  Enrolled {new Date(s.enrolledAt).toLocaleDateString()}
                </span>
              </div>
            ))}
            {studentCount > assignedStudents.length && (
              <div className="px-5 py-2.5 text-center">
                <a
                  href="/dashboard/teacher/students"
                  className="text-xs text-[#1F4FD8] hover:underline font-medium"
                >
                  View all {studentCount} students
                </a>
              </div>
            )}
          </div>
        )}
      </div>

      <div>
        <h2 className="text-lg font-poppins font-semibold text-[#1C1C28] mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { label: "Mark Attendance", href: "/dashboard/teacher/attendance", icon: <Calendar className="w-5 h-5" />, desc: "Record today's attendance" },
            { label: "Review Assignments", href: "/dashboard/teacher/assignments", icon: <ClipboardList className="w-5 h-5" />, desc: "Grade pending submissions" },
            { label: "Add Remarks", href: "/dashboard/teacher/remarks", icon: <MessageSquare className="w-5 h-5" />, desc: "Provide student feedback" },
          ].map((action) => (
            <a
              key={action.label}
              href={action.href}
              className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md hover:border-[#1F4FD8]/20 transition-all group"
            >
              <div className="w-10 h-10 bg-[#1F4FD8]/10 rounded-xl flex items-center justify-center text-[#1F4FD8] mb-3 group-hover:bg-[#1F4FD8] group-hover:text-white transition-all">
                {action.icon}
              </div>
              <h3 className="font-poppins font-semibold text-[#1C1C28] mb-1">{action.label}</h3>
              <p className="text-sm text-[#4D4D4D]">{action.desc}</p>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
