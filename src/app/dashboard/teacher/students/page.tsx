"use client";

import React, { useEffect, useMemo, useState } from "react";
import { createClient } from "@/src/lib/supabase/client";
import { Users, Search, Phone } from "lucide-react";

interface StudentRow {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  course_title: string;
  course_id: string;
  progress: number;
  enrolled_at: string;
}

export default function TeacherStudentsPage() {
  const supabase = createClient() as any;
  const [rows, setRows] = useState<StudentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: ct } = await supabase
        .from("course_teachers")
        .select("course_id")
        .eq("teacher_id", user.id);

      const courseIds = ((ct as any[]) || []).map((x) => x.course_id);
      if (courseIds.length === 0) {
        setRows([]);
        setLoading(false);
        return;
      }

      const { data: enrollments } = await supabase
        .from("enrollments")
        .select("student_id, course_id, progress, enrolled_at")
        .in("course_id", courseIds)
        .eq("status", "active");

      const enr = (enrollments as any[]) || [];
      const studentIds = [...new Set(enr.map((e) => e.student_id))];

      const { data: students } = await supabase
        .from("profiles")
        .select("id, full_name, email, phone")
        .in("id", studentIds.length ? studentIds : ["__none__"]);

      const { data: courses } = await supabase
        .from("courses")
        .select("id, title")
        .in("id", courseIds);

      const studentMap = new Map(((students as any[]) || []).map((s) => [s.id, s]));
      const courseMap = new Map(((courses as any[]) || []).map((c) => [c.id, c]));

      const merged: StudentRow[] = enr.map((e) => ({
        id: e.student_id,
        full_name: studentMap.get(e.student_id)?.full_name || "Unknown",
        email: studentMap.get(e.student_id)?.email || "",
        phone: studentMap.get(e.student_id)?.phone || null,
        course_title: courseMap.get(e.course_id)?.title || "Unknown",
        course_id: e.course_id,
        progress: e.progress ?? 0,
        enrolled_at: e.enrolled_at,
      }));

      setRows(merged);
      setLoading(false);
    };

    fetchData();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) =>
      `${r.full_name} ${r.email} ${r.course_title}`.toLowerCase().includes(q)
    );
  }, [rows, search]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-poppins font-bold text-[#1C1C28]">Students</h1>
        <p className="text-[#4D4D4D] text-sm mt-1">Students enrolled in your courses</p>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, email, or course..."
          className="w-full pl-10 pr-4 py-2.5 border border-[#D4D4D4] rounded-xl bg-white text-[#1C1C28] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#1F4FD8] focus:border-transparent text-sm"
        />
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-[#1F4FD8]/30 border-t-[#1F4FD8] rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <Users className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-[#4D4D4D] font-medium">No students found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 text-left">
                  <th className="px-6 py-4 text-xs font-semibold text-[#4D4D4D] uppercase tracking-wider">Student</th>
                  <th className="px-6 py-4 text-xs font-semibold text-[#4D4D4D] uppercase tracking-wider">Email</th>
                  <th className="px-6 py-4 text-xs font-semibold text-[#4D4D4D] uppercase tracking-wider">Phone</th>
                  <th className="px-6 py-4 text-xs font-semibold text-[#4D4D4D] uppercase tracking-wider">Course</th>
                  <th className="px-6 py-4 text-xs font-semibold text-[#4D4D4D] uppercase tracking-wider">Progress</th>
                  <th className="px-6 py-4 text-xs font-semibold text-[#4D4D4D] uppercase tracking-wider">Enrolled</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((r, idx) => (
                  <tr key={`${r.id}-${r.course_id}-${idx}`} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-[#1C1C28]">{r.full_name}</td>
                    <td className="px-6 py-4 text-sm text-[#4D4D4D]">{r.email}</td>
                    <td className="px-6 py-4 text-sm text-[#4D4D4D]">
                      {r.phone ? (
                        <span className="inline-flex items-center gap-1">
                          <Phone className="w-3.5 h-3.5 text-[#9CA3AF]" />
                          {r.phone}
                        </span>
                      ) : (
                        <span className="text-[#9CA3AF]">--</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-medium text-[#1F4FD8] bg-[#1F4FD8]/10 px-2 py-0.5 rounded-full">
                        {r.course_title}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2.5 min-w-[120px]">
                        <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#1F4FD8] rounded-full transition-all"
                            style={{ width: `${Math.min(r.progress, 100)}%` }}
                          />
                        </div>
                        <span className="text-xs font-medium text-[#4D4D4D] w-9 text-right">
                          {r.progress}%
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-[#4D4D4D]">
                      {new Date(r.enrolled_at).toLocaleDateString()}
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
