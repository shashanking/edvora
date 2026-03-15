"use client";

import React, { useEffect, useMemo, useState } from "react";
import { createClient } from "@/src/lib/supabase/client";
import { Users, Search, Mail } from "lucide-react";

interface StudentRow {
  id: string;
  full_name: string;
  email: string;
  course_title: string;
  course_id: string;
}

export default function TeacherStudentsPage() {
  const supabase = createClient();
  const [rows, setRows] = useState<StudentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetch = async () => {
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
        .select("student_id, course_id")
        .in("course_id", courseIds)
        .eq("status", "active");

      const enr = (enrollments as any[]) || [];
      const studentIds = [...new Set(enr.map((e) => e.student_id))];

      const { data: students } = await supabase
        .from("profiles")
        .select("id, full_name, email")
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
        course_title: courseMap.get(e.course_id)?.title || "Unknown",
        course_id: e.course_id,
      }));

      setRows(merged);
      setLoading(false);
    };

    fetch();
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
                  <th className="px-6 py-4 text-xs font-semibold text-[#4D4D4D] uppercase tracking-wider">Course</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((r, idx) => (
                  <tr key={`${r.id}-${r.course_id}-${idx}`} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-[#1C1C28]">{r.full_name}</td>
                    <td className="px-6 py-4 text-sm text-[#4D4D4D]">{r.email}</td>
                    <td className="px-6 py-4 text-sm text-[#4D4D4D]">{r.course_title}</td>
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
