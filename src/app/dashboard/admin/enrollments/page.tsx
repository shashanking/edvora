"use client";

import React, { useEffect, useState } from "react";
import { createClient } from "@/src/lib/supabase/client";
import { Search, ClipboardList } from "lucide-react";

interface Enrollment {
  id: string;
  student_id: string;
  course_id: string;
  status: string;
  progress: number;
  enrolled_at: string;
  student_name?: string;
  student_email?: string;
  course_title?: string;
}

export default function AdminEnrollmentsPage() {
  const supabase = createClient();
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");

  const fetchEnrollments = async () => {
    setLoading(true);

    let query = supabase
      .from("enrollments")
      .select("*")
      .order("enrolled_at", { ascending: false });

    if (statusFilter !== "all") {
      query = query.eq("status", statusFilter);
    }

    const { data } = await query;
    const rows = (data as Enrollment[]) || [];

    // Fetch associated names
    const studentIds = [...new Set(rows.map((r) => r.student_id))];
    const courseIds = [...new Set(rows.map((r) => r.course_id))];

    const { data: students } = await supabase
      .from("profiles")
      .select("id, full_name, email")
      .in("id", studentIds.length ? studentIds : ["__none__"]);

    const { data: courses } = await supabase
      .from("courses")
      .select("id, title")
      .in("id", courseIds.length ? courseIds : ["__none__"]);

    const studentMap = new Map((students as any[] || []).map((s: any) => [s.id, s]));
    const courseMap = new Map((courses as any[] || []).map((c: any) => [c.id, c]));

    const enriched = rows.map((e) => ({
      ...e,
      student_name: studentMap.get(e.student_id)?.full_name || "Unknown",
      student_email: studentMap.get(e.student_id)?.email || "",
      course_title: courseMap.get(e.course_id)?.title || "Unknown",
    }));

    setEnrollments(enriched);
    setLoading(false);
  };

  useEffect(() => {
    fetchEnrollments();
  }, [statusFilter]);

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      active: "bg-green-100 text-green-700",
      completed: "bg-blue-100 text-blue-700",
      cancelled: "bg-red-100 text-red-600",
    };
    return (
      <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${styles[status] || "bg-gray-100 text-gray-600"}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-poppins font-bold text-[#1C1C28]">Enrollments</h1>
        <p className="text-[#4D4D4D] text-sm mt-1">Track all student enrollments</p>
      </div>

      <div className="flex gap-3">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2.5 border border-[#D4D4D4] rounded-xl bg-white text-[#1C1C28] text-sm focus:outline-none focus:ring-2 focus:ring-[#1F4FD8]"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-[#1F4FD8]/30 border-t-[#1F4FD8] rounded-full animate-spin" />
          </div>
        ) : enrollments.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <ClipboardList className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-[#4D4D4D] font-medium">No enrollments found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 text-left">
                  <th className="px-6 py-4 text-xs font-semibold text-[#4D4D4D] uppercase tracking-wider">Student</th>
                  <th className="px-6 py-4 text-xs font-semibold text-[#4D4D4D] uppercase tracking-wider">Course</th>
                  <th className="px-6 py-4 text-xs font-semibold text-[#4D4D4D] uppercase tracking-wider">Progress</th>
                  <th className="px-6 py-4 text-xs font-semibold text-[#4D4D4D] uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-xs font-semibold text-[#4D4D4D] uppercase tracking-wider">Enrolled</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {enrollments.map((e) => (
                  <tr key={e.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-medium text-[#1C1C28] text-sm">{e.student_name}</p>
                      <p className="text-xs text-[#9CA3AF]">{e.student_email}</p>
                    </td>
                    <td className="px-6 py-4 text-sm text-[#4D4D4D]">{e.course_title}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#1F4FD8] rounded-full"
                            style={{ width: `${e.progress}%` }}
                          />
                        </div>
                        <span className="text-xs text-[#4D4D4D]">{e.progress}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">{getStatusBadge(e.status)}</td>
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
