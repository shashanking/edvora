"use client";

import React, { useEffect, useState } from "react";
import { createClient } from "@/src/lib/supabase/client";
import { Calendar, CheckCircle, XCircle, Clock } from "lucide-react";

interface AttendanceRecord {
  id: string;
  date: string;
  status: string;
  course_title: string;
}

export default function StudentAttendancePage() {
  const supabase = createClient() as any;
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
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
        .eq("student_id", user.id)
        .order("date", { ascending: false });

      const rows = (data as any[]) || [];
      const courseIds = [...new Set(rows.map((r) => r.course_id))];

      const { data: courses } = courseIds.length
        ? await supabase.from("courses").select("id, title").in("id", courseIds)
        : { data: [] };

      const courseMap = new Map(((courses as any[]) || []).map((c) => [c.id, c.title]));

      setRecords(
        rows.map((r) => ({
          id: r.id,
          date: r.date,
          status: r.status,
          course_title: courseMap.get(r.course_id) || "Unknown",
        }))
      );
      setLoading(false);
    };
    fetch();
  }, []);

  const total = records.length;
  const present = records.filter((r) => r.status === "present").length;
  const absent = records.filter((r) => r.status === "absent").length;
  const late = records.filter((r) => r.status === "late").length;
  const percentage = total > 0 ? Math.round((present / total) * 100) : 0;

  const statusIcon = (status: string) => {
    if (status === "present") return <CheckCircle className="w-4 h-4 text-green-600" />;
    if (status === "absent") return <XCircle className="w-4 h-4 text-red-500" />;
    return <Clock className="w-4 h-4 text-amber-500" />;
  };

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
      <div>
        <h1 className="text-2xl font-poppins font-bold text-[#1C1C28]">Attendance</h1>
        <p className="text-[#4D4D4D] text-sm mt-1">Track your attendance history</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm text-center">
          <p className="text-2xl font-bold text-[#1F4FD8]">{percentage}%</p>
          <p className="text-xs text-[#4D4D4D] mt-1">Overall</p>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm text-center">
          <p className="text-2xl font-bold text-green-600">{present}</p>
          <p className="text-xs text-[#4D4D4D] mt-1">Present</p>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm text-center">
          <p className="text-2xl font-bold text-red-500">{absent}</p>
          <p className="text-xs text-[#4D4D4D] mt-1">Absent</p>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm text-center">
          <p className="text-2xl font-bold text-amber-500">{late}</p>
          <p className="text-xs text-[#4D4D4D] mt-1">Late</p>
        </div>
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
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 text-left">
                  <th className="px-6 py-4 text-xs font-semibold text-[#4D4D4D] uppercase tracking-wider">Date</th>
                  <th className="px-6 py-4 text-xs font-semibold text-[#4D4D4D] uppercase tracking-wider">Course</th>
                  <th className="px-6 py-4 text-xs font-semibold text-[#4D4D4D] uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {records.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 text-sm text-[#1C1C28] font-medium">
                      {new Date(r.date).toLocaleDateString("en-US", {
                        weekday: "short",
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </td>
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
