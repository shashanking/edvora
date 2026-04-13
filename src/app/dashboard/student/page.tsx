import { createClient } from "@/src/lib/supabase/server";
import { redirect } from "next/navigation";
import { BookOpen, Calendar, ClipboardList, Video, TrendingUp, Clock } from "lucide-react";

export default async function StudentDashboardPage() {
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

  const { count: courseCount, error: courseCountError } = await supabase
    .from("enrollments")
    .select("*", { count: "exact", head: true })
    .eq("student_id", user.id)
    .in("status", ["active", "completed"]);

  const { count: assignmentCount, error: assignmentCountError } = await supabase
    .from("assignment_submissions")
    .select("*", { count: "exact", head: true })
    .eq("student_id", user.id);

  const { data: enrollments, error: enrollmentsError } = (await supabase
    .from("enrollments")
    .select("course_id")
    .eq("student_id", user.id)
    .in("status", ["active", "completed"])) as { data: { course_id: string }[] | null; error: unknown };

  const enrolledCourseIds = enrollments?.map((enrollment) => enrollment.course_id) ?? [];

  let upcomingClasses = 0;

  if (!enrollmentsError && enrolledCourseIds.length > 0) {
    const { count, error: upcomingClassesError } = await supabase
      .from("live_sessions")
      .select("*", { count: "exact", head: true })
      .in("course_id", enrolledCourseIds)
      .eq("status", "scheduled");

    if (!upcomingClassesError) {
      upcomingClasses = count ?? 0;
    }
  }

  const stats = [
    { label: "Enrolled Courses", value: courseCountError ? 0 : courseCount ?? 0, icon: <BookOpen className="w-6 h-6" />, color: "bg-blue-50 text-[#1F4FD8]" },
    { label: "Assignments", value: assignmentCountError ? 0 : assignmentCount ?? 0, icon: <ClipboardList className="w-6 h-6" />, color: "bg-amber-50 text-amber-600" },
    { label: "Upcoming Classes", value: upcomingClasses, icon: <Video className="w-6 h-6" />, color: "bg-green-50 text-green-600" },
    { label: "Avg. Progress", value: "0%", icon: <TrendingUp className="w-6 h-6" />, color: "bg-purple-50 text-purple-600" },
  ];

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  return (
    <div className="space-y-8">
      {/* Welcome header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-poppins font-bold text-[#1C1C28]">
          {greeting()}, {profile?.full_name?.split(" ")[0] || "Student"} 👋
        </h1>
        <p className="text-[#4D4D4D] mt-1">Here&apos;s an overview of your learning journey</p>
      </div>

      {/* Stats grid */}
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

      {/* Quick actions */}
      <div>
        <h2 className="text-lg font-poppins font-semibold text-[#1C1C28] mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { label: "View My Courses", href: "/dashboard/student/courses", icon: <BookOpen className="w-5 h-5" />, desc: "Access your enrolled courses" },
            { label: "Upcoming Classes", href: "/dashboard/student/live-classes", icon: <Clock className="w-5 h-5" />, desc: "Join your next live session" },
            { label: "My Attendance", href: "/dashboard/student/attendance", icon: <Calendar className="w-5 h-5" />, desc: "Check your attendance record" },
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
