"use client";

import React, { useEffect, useState } from "react";
import { createClient } from "@/src/lib/supabase/client";
import {
  Users, GraduationCap, BookOpen, CreditCard, DollarSign,
  TrendingUp, Calendar, BarChart3, Loader2,
} from "lucide-react";

interface EnrollmentByCourse {
  course_title: string;
  count: number;
}

interface RecentEnrollment {
  id: string;
  student_name: string;
  course_title: string;
  enrolled_at: string;
  status: string;
}

export default function AdminReportsPage() {
  const supabase = createClient() as any;
  const [loading, setLoading] = useState(true);

  // Stats
  const [totalStudents, setTotalStudents] = useState(0);
  const [totalTeachers, setTotalTeachers] = useState(0);
  const [totalCourses, setTotalCourses] = useState(0);
  const [totalEnrollments, setTotalEnrollments] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [completedPayments, setCompletedPayments] = useState(0);
  const [pendingPayments, setPendingPayments] = useState(0);
  const [failedPayments, setFailedPayments] = useState(0);

  // Data
  const [enrollmentsByCourse, setEnrollmentsByCourse] = useState<EnrollmentByCourse[]>([]);
  const [recentEnrollments, setRecentEnrollments] = useState<RecentEnrollment[]>([]);
  const [attendanceRate, setAttendanceRate] = useState<number | null>(null);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    // Fetch all stats in parallel
    const [
      studentsRes,
      teachersRes,
      coursesRes,
      enrollmentsRes,
      paymentsRes,
      attendanceRes,
      recentEnrollRes,
    ] = await Promise.all([
      supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .eq("role", "student"),
      supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .eq("role", "teacher"),
      supabase
        .from("courses")
        .select("*", { count: "exact", head: true }),
      supabase
        .from("enrollments")
        .select("id, course_id, courses(title)")
        .order("enrolled_at", { ascending: false }),
      supabase
        .from("payments")
        .select("amount, status, currency"),
      supabase
        .from("attendance")
        .select("status"),
      supabase
        .from("enrollments")
        .select("id, student_id, course_id, enrolled_at, status, profiles(full_name), courses(title)")
        .order("enrolled_at", { ascending: false })
        .limit(10),
    ]);

    setTotalStudents(studentsRes.count ?? 0);
    setTotalTeachers(teachersRes.count ?? 0);
    setTotalCourses(coursesRes.count ?? 0);

    // Enrollments
    const enrollments = enrollmentsRes.data || [];
    setTotalEnrollments(enrollments.length);

    // Enrollments by course
    const courseMap: Record<string, number> = {};
    enrollments.forEach((e: any) => {
      const title = e.courses?.title || "Unknown";
      courseMap[title] = (courseMap[title] || 0) + 1;
    });
    const byCourseSorted = Object.entries(courseMap)
      .map(([course_title, count]) => ({ course_title, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
    setEnrollmentsByCourse(byCourseSorted);

    // Payments
    const payments = (paymentsRes.data || []) as any[];
    const completed = payments.filter((p) => p.status === "completed");
    const pending = payments.filter((p) => p.status === "pending");
    const failed = payments.filter((p) => p.status === "failed");
    setCompletedPayments(completed.length);
    setPendingPayments(pending.length);
    setFailedPayments(failed.length);
    setTotalRevenue(completed.reduce((sum: number, p: any) => sum + Number(p.amount), 0));

    // Attendance rate
    const attRecords = (attendanceRes.data || []) as any[];
    if (attRecords.length > 0) {
      const presentCount = attRecords.filter(
        (a) => a.status === "present" || a.status === "late"
      ).length;
      setAttendanceRate(Math.round((presentCount / attRecords.length) * 100));
    }

    // Recent enrollments
    const recent = (recentEnrollRes.data || []).map((e: any) => ({
      id: e.id,
      student_name: e.profiles?.full_name || "Unknown",
      course_title: e.courses?.title || "Unknown",
      enrolled_at: e.enrolled_at,
      status: e.status,
    }));
    setRecentEnrollments(recent);

    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-[#1F4FD8]" />
      </div>
    );
  }

  const maxEnrollment = enrollmentsByCourse.length > 0 ? enrollmentsByCourse[0].count : 1;

  const statCards = [
    { label: "Total Students", value: totalStudents, icon: <Users className="w-6 h-6" />, color: "bg-blue-50 text-[#1F4FD8]" },
    { label: "Total Teachers", value: totalTeachers, icon: <GraduationCap className="w-6 h-6" />, color: "bg-amber-50 text-amber-600" },
    { label: "Total Courses", value: totalCourses, icon: <BookOpen className="w-6 h-6" />, color: "bg-green-50 text-green-600" },
    { label: "Total Enrollments", value: totalEnrollments, icon: <TrendingUp className="w-6 h-6" />, color: "bg-purple-50 text-purple-600" },
    { label: "Revenue", value: `$${totalRevenue.toFixed(2)}`, icon: <DollarSign className="w-6 h-6" />, color: "bg-emerald-50 text-emerald-600" },
    { label: "Attendance Rate", value: attendanceRate !== null ? `${attendanceRate}%` : "N/A", icon: <Calendar className="w-6 h-6" />, color: "bg-cyan-50 text-cyan-600" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-poppins font-bold text-[#1C1C28]">Reports & Analytics</h1>
        <p className="text-[#4D4D4D] text-sm mt-1">Platform overview and insights</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map((stat) => (
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Enrollment by Course */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <h2 className="text-lg font-poppins font-semibold text-[#1C1C28] mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-[#1F4FD8]" />
            Enrollment by Course
          </h2>
          {enrollmentsByCourse.length === 0 ? (
            <p className="text-sm text-[#9CA3AF]">No enrollment data yet</p>
          ) : (
            <div className="space-y-3">
              {enrollmentsByCourse.map((item) => (
                <div key={item.course_title}>
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm text-[#1C1C28] font-medium truncate max-w-[70%]">{item.course_title}</p>
                    <span className="text-sm font-bold text-[#1F4FD8]">{item.count}</span>
                  </div>
                  <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#1F4FD8] rounded-full transition-all duration-500"
                      style={{ width: `${(item.count / maxEnrollment) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Payment Status Breakdown */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <h2 className="text-lg font-poppins font-semibold text-[#1C1C28] mb-4 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-green-600" />
            Payment Breakdown
          </h2>
          {completedPayments + pendingPayments + failedPayments === 0 ? (
            <p className="text-sm text-[#9CA3AF]">No payment data yet</p>
          ) : (
            <div className="space-y-4">
              {[
                { label: "Completed", count: completedPayments, color: "bg-green-500", textColor: "text-green-700" },
                { label: "Pending", count: pendingPayments, color: "bg-amber-500", textColor: "text-amber-700" },
                { label: "Failed", count: failedPayments, color: "bg-red-500", textColor: "text-red-700" },
              ].map((item) => {
                const total = completedPayments + pendingPayments + failedPayments;
                const pct = total > 0 ? Math.round((item.count / total) * 100) : 0;
                return (
                  <div key={item.label}>
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm text-[#1C1C28] font-medium">{item.label}</p>
                      <span className={`text-sm font-bold ${item.textColor}`}>
                        {item.count} ({pct}%)
                      </span>
                    </div>
                    <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${item.color} rounded-full transition-all duration-500`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}

              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-[#4D4D4D]">Total Revenue (completed)</p>
                  <p className="text-lg font-poppins font-bold text-green-600">${totalRevenue.toFixed(2)}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Recent Enrollments */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-poppins font-semibold text-[#1C1C28] flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-[#1F4FD8]" />
            Recent Enrollments
          </h2>
        </div>
        {recentEnrollments.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-sm text-[#9CA3AF]">No enrollments yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 text-left">
                  <th className="px-6 py-4 text-xs font-semibold text-[#4D4D4D] uppercase tracking-wider">Student</th>
                  <th className="px-6 py-4 text-xs font-semibold text-[#4D4D4D] uppercase tracking-wider">Course</th>
                  <th className="px-6 py-4 text-xs font-semibold text-[#4D4D4D] uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-xs font-semibold text-[#4D4D4D] uppercase tracking-wider">Enrolled</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {recentEnrollments.map((e) => (
                  <tr key={e.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-[#1C1C28]">{e.student_name}</td>
                    <td className="px-6 py-4 text-sm text-[#4D4D4D]">{e.course_title}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${
                          e.status === "active"
                            ? "bg-green-100 text-green-700"
                            : e.status === "completed"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {e.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-[#9CA3AF]">
                      {new Date(e.enrolled_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
