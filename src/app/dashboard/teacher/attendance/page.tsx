"use client";

import React, { useEffect, useState } from "react";
import { createClient } from "@/src/lib/supabase/client";
import { Calendar, CheckCircle, XCircle, Clock } from "lucide-react";

interface AttendanceRow {
  id: string;
  date: string;
  student_name: string;
  course_title: string;
  status: string;
}

export default function TeacherAttendancePage() {
  const supabase = createClient();
  const [records, setRecords] = useState<AttendanceRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("attendance")
        .select("*")
        .eq("teacher_id", user.id)
        .order("date", { ascending: false })
        .limit(100);

      const rows = (data as any[]) || [];
      const studentIds = [...new Set(rows.map((r) => r.student_id))];
      const courseIds = [...new Set(rows.map((r) => r.course_id))];

      const { data: students } = studentIds.length
        ? await supabase
            .from("profiles")
            .select("id, full_name")
            .in("id", studentIds)
        : { data: [] };

      const { data: courses } = courseIds.length
        ? await supabase.from("courses").select("id, title").in("id", courseIds)
        : { data: [] };

      const studentMap = new Map(((students as any[]) || []).map((s) => [s.id, s.full_name]));
      const courseMap = new Map(((courses as any[]) || []).map((c) => [c.id, c.title]));

      setRecords(
        rows.map((r) => ({
          id: r.id,
          date: r.date,
          student_name: studentMap.get(r.student_id) || "Unknown",
          course_title: courseMap.get(r.course_id) || "Unknown",
          status: r.status,
        }))
      );

      setLoading(false);
    };

    fetch();
  }, []);

  const statusBadge = (status: string) => {
    const styles: Record<string, string> = {
      present: "bg-green-100 text-green-700",
      absent: "bg-red-100 text-red-600",
      late: "bg-amber-100 text-amber-700",
    };
    return (
      <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${styles[status] || "bg-gray-100"}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-poppins font-bold text-[#1C1C28]">Attendance</h1>
          <p className="text-[#4D4D4D] text-sm mt-1">Track and manage student attendance</p>
        </div>
        <button className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#1F4FD8] text-white font-poppins font-semibold text-sm rounded-xl hover:bg-[#1a45c2] transition-all shadow-md">
          <CheckCircle className="w-4 h-4" />
          Mark Attendance
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-[#1F4FD8]/30 border-t-[#1F4FD8] rounded-full animate-spin" />
          </div>
        ) : records.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <Calendar className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-[#4D4D4D] font-medium">No attendance records</p>
            <p className="text-sm text-[#9CA3AF] mt-1">Start marking attendance for your classes</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 text-left">
                  <th className="px-6 py-4 text-xs font-semibold text-[#4D4D4D] uppercase tracking-wider">Date</th>
                  <th className="px-6 py-4 text-xs font-semibold text-[#4D4D4D] uppercase tracking-wider">Student</th>
                  <th className="px-6 py-4 text-xs font-semibold text-[#4D4D4D] uppercase tracking-wider">Course</th>
                  <th className="px-6 py-4 text-xs font-semibold text-[#4D4D4D] uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {records.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-[#1C1C28]">
                      {new Date(r.date).toLocaleDateString("en-US", {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                      })}
                    </td>
                    <td className="px-6 py-4 text-sm text-[#4D4D4D]">{r.student_name}</td>
                    <td className="px-6 py-4 text-sm text-[#4D4D4D]">{r.course_title}</td>
                    <td className="px-6 py-4">{statusBadge(r.status)}</td>
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
