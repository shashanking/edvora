import { createClient } from "@/src/lib/supabase/server";
import { redirect } from "next/navigation";
import { BookOpen, Users, GraduationCap, CreditCard, Plus, BarChart3 } from "lucide-react";

export default async function AdminDashboardPage() {
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

  const { count: totalCourses } = await supabase
    .from("courses")
    .select("*", { count: "exact", head: true });

  const { count: totalStudents } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .eq("role", "student");

  const { count: totalTeachers } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .eq("role", "teacher");

  const { count: totalPayments } = await supabase
    .from("payments")
    .select("*", { count: "exact", head: true })
    .eq("status", "completed");

  const stats = [
    { label: "Total Courses", value: totalCourses ?? 0, icon: <BookOpen className="w-6 h-6" />, color: "bg-blue-50 text-[#1F4FD8]" },
    { label: "Total Students", value: totalStudents ?? 0, icon: <Users className="w-6 h-6" />, color: "bg-green-50 text-green-600" },
    { label: "Total Teachers", value: totalTeachers ?? 0, icon: <GraduationCap className="w-6 h-6" />, color: "bg-amber-50 text-amber-600" },
    { label: "Completed Payments", value: totalPayments ?? 0, icon: <CreditCard className="w-6 h-6" />, color: "bg-purple-50 text-purple-600" },
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
          {greeting()}, {profile?.full_name?.split(" ")[0] || "Admin"} 👋
        </h1>
        <p className="text-[#4D4D4D] mt-1">Here&apos;s your platform overview</p>
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
            { label: "Create Course", href: "/dashboard/admin/courses", icon: <Plus className="w-5 h-5" />, desc: "Add a new course to the platform" },
            { label: "Manage Teachers", href: "/dashboard/admin/teachers", icon: <GraduationCap className="w-5 h-5" />, desc: "Add or manage teacher accounts" },
            { label: "View Reports", href: "/dashboard/admin/reports", icon: <BarChart3 className="w-5 h-5" />, desc: "Platform analytics and insights" },
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
