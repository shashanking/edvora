import { createClient } from "@/src/lib/supabase/server";
import { redirect } from "next/navigation";
import { BookOpen, Users, ClipboardList, Video, Calendar, MessageSquare } from "lucide-react";

export default async function TeacherDashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = (await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .single()) as { data: { full_name: string } | null };

  const { count: courseCount } = await supabase
    .from("course_teachers")
    .select("*", { count: "exact", head: true })
    .eq("teacher_id", user.id);

  const { count: studentCount } = await supabase
    .from("enrollments")
    .select("*, course_teachers!inner(teacher_id)", { count: "exact", head: true })
    .eq("course_teachers.teacher_id", user.id)
    .eq("status", "active");

  const { count: pendingSubmissions } = await supabase
    .from("assignment_submissions")
    .select("*, assignments!inner(teacher_id)", { count: "exact", head: true })
    .eq("assignments.teacher_id", user.id)
    .is("graded_at", null);

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
