"use client";

import React, { useEffect, useMemo, useState } from "react";
import { createClient } from "@/src/lib/supabase/client";
import { Users, Search, Phone, Clock, ChevronDown, ChevronRight } from "lucide-react";

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

interface ScheduleRow {
  day_of_week: number;
  start_time: string;
  end_time: string;
}

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function TeacherStudentsPage() {
  const supabase = createClient() as any;
  const [rows, setRows] = useState<StudentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [schedules, setSchedules] = useState<Record<string, ScheduleRow[]>>({});
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // "My students" means the students actually assigned to this teacher
      // (enrollments.teacher_id, migration 004) — a course can have several
      // co-teachers (course_teachers), but each student is 1:1 with a
      // single assigned teacher, so scoping off course_teachers here would
      // show every co-teacher's students, not just this teacher's own.
      const { data: enrollments } = await supabase
        .from("enrollments")
        .select("student_id, course_id, progress, enrolled_at")
        .eq("teacher_id", user.id)
        .eq("status", "active");

      const enr = (enrollments as any[]) || [];
      if (enr.length === 0) {
        setRows([]);
        setLoading(false);
        return;
      }

      const studentIds = [...new Set(enr.map((e) => e.student_id))];
      const courseIds = [...new Set(enr.map((e) => e.course_id))];

      const [{ data: students }, { data: courses }, { data: scheduleData }] = await Promise.all([
        supabase
          .from("profiles")
          .select("id, full_name, email, phone")
          .in("id", studentIds.length ? studentIds : ["__none__"]),
        supabase.from("courses").select("id, title").in("id", courseIds),
        supabase
          .from("student_schedules")
          .select("student_id, course_id, day_of_week, preferred_start_time, preferred_end_time, confirmed_start_time, confirmed_end_time")
          .in("student_id", studentIds.length ? studentIds : ["__none__"])
          .in("course_id", courseIds),
      ]);

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

      // Class timings, keyed by student (a student is only assigned to one
      // course under this teacher in practice, but key by student_id so it
      // still reads correctly if that ever changes).
      const schedMap: Record<string, ScheduleRow[]> = {};
      for (const s of (scheduleData as any[]) || []) {
        if (!schedMap[s.student_id]) schedMap[s.student_id] = [];
        schedMap[s.student_id].push({
          day_of_week: s.day_of_week,
          start_time: s.confirmed_start_time || s.preferred_start_time,
          end_time: s.confirmed_end_time || s.preferred_end_time,
        });
      }
      for (const list of Object.values(schedMap)) {
        list.sort((a, b) => a.day_of_week - b.day_of_week);
      }
      setSchedules(schedMap);

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
        <p className="text-[#4D4D4D] text-sm mt-1">Students assigned to you</p>
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
                  <th className="px-6 py-4 text-xs font-semibold text-[#4D4D4D] uppercase tracking-wider">Class Timings</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((r, idx) => {
                  const rowKey = `${r.id}-${r.course_id}-${idx}`;
                  const studentSchedule = schedules[r.id] || [];
                  const isExpanded = expandedId === rowKey;
                  return (
                    <React.Fragment key={rowKey}>
                      <tr className="hover:bg-gray-50/50 transition-colors">
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
                        <td className="px-6 py-4">
                          {studentSchedule.length === 0 ? (
                            <span className="text-xs text-[#9CA3AF]">Not set</span>
                          ) : (
                            <button
                              onClick={() => setExpandedId(isExpanded ? null : rowKey)}
                              className="inline-flex items-center gap-1 text-xs font-medium text-[#1F4FD8] hover:underline"
                            >
                              <Clock className="w-3.5 h-3.5" />
                              {studentSchedule.length} slot{studentSchedule.length !== 1 ? "s" : ""}/week
                              {isExpanded ? (
                                <ChevronDown className="w-3.5 h-3.5" />
                              ) : (
                                <ChevronRight className="w-3.5 h-3.5" />
                              )}
                            </button>
                          )}
                        </td>
                      </tr>
                      {isExpanded && studentSchedule.length > 0 && (
                        <tr className="bg-[#F8F9FB]">
                          <td colSpan={7} className="px-6 py-3">
                            <div className="flex flex-wrap gap-2">
                              {studentSchedule.map((s, i) => (
                                <span
                                  key={i}
                                  className="inline-flex items-center gap-1.5 text-xs font-medium text-[#1C1C28] bg-white border border-gray-200 rounded-lg px-2.5 py-1"
                                >
                                  {DAY_NAMES[s.day_of_week]}
                                  <span className="text-[#1F4FD8] font-mono">
                                    {s.start_time}–{s.end_time}
                                  </span>
                                </span>
                              ))}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
