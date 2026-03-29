"use client";

import React, { useState, useEffect } from "react";
import { createClient } from "@/src/lib/supabase/client";
import { Calendar, CheckCircle, Clock, Loader2, X, Search } from "lucide-react";
import toast from "react-hot-toast";
import { sendScheduleConfirmedEmail } from "@/src/lib/emailjs";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

interface Schedule {
  id: string;
  student_id: string;
  student_name: string;
  student_email: string;
  course_id: string;
  course_title: string;
  day_of_week: number;
  preferred_start_time: string;
  preferred_end_time: string;
  confirmed_start_time: string | null;
  confirmed_end_time: string | null;
  status: "preferred" | "confirmed";
  notes: string | null;
}

export default function AdminSchedulesPage() {
  const supabase = createClient() as any;
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "preferred" | "confirmed">("all");
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTime, setEditTime] = useState({ start: "", end: "", notes: "" });
  const [saving, setSaving] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState<string | null>(null);

  useEffect(() => {
    fetchSchedules();
  }, []);

  const fetchSchedules = async () => {
    const { data } = await supabase
      .from("student_schedules")
      .select("*, profiles(full_name, email), courses(title)")
      .order("status", { ascending: true })
      .order("day_of_week", { ascending: true });

    if (data) {
      setSchedules(
        data.map((s: any) => ({
          id: s.id,
          student_id: s.student_id,
          student_name: s.profiles?.full_name || "Unknown",
          student_email: s.profiles?.email || "",
          course_id: s.course_id,
          course_title: s.courses?.title || "Unknown Course",
          day_of_week: s.day_of_week,
          preferred_start_time: s.preferred_start_time,
          preferred_end_time: s.preferred_end_time,
          confirmed_start_time: s.confirmed_start_time,
          confirmed_end_time: s.confirmed_end_time,
          status: s.status,
          notes: s.notes,
        }))
      );
    }
    setLoading(false);
  };

  const startEdit = (schedule: Schedule) => {
    setEditingId(schedule.id);
    setEditTime({
      start: schedule.confirmed_start_time || schedule.preferred_start_time,
      end: schedule.confirmed_end_time || schedule.preferred_end_time,
      notes: schedule.notes || "",
    });
  };

  const quickConfirm = async (schedule: Schedule) => {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();

    const { error } = await supabase
      .from("student_schedules")
      .update({
        confirmed_start_time: schedule.preferred_start_time,
        confirmed_end_time: schedule.preferred_end_time,
        status: "confirmed",
        confirmed_by: user?.id,
      } as any)
      .eq("id", schedule.id);

    if (!error) {
      toast.success("Schedule confirmed with preferred times");
      sendScheduleConfirmedEmail({
        studentName: schedule.student_name,
        studentEmail: schedule.student_email,
        courseName: schedule.course_title,
        day: DAYS[schedule.day_of_week],
        time: `${schedule.preferred_start_time} - ${schedule.preferred_end_time}`,
      });
      fetchSchedules();
    } else {
      toast.error(error.message);
    }
    setSaving(false);
  };

  const confirmSchedule = async (id: string) => {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();

    const { error } = await supabase
      .from("student_schedules")
      .update({
        confirmed_start_time: editTime.start,
        confirmed_end_time: editTime.end,
        notes: editTime.notes || null,
        status: "confirmed",
        confirmed_by: user?.id,
      } as any)
      .eq("id", id);

    if (!error) {
      toast.success("Schedule confirmed");
      const schedule = schedules.find((s) => s.id === id);
      if (schedule) {
        sendScheduleConfirmedEmail({
          studentName: schedule.student_name,
          studentEmail: schedule.student_email,
          courseName: schedule.course_title,
          day: DAYS[schedule.day_of_week],
          time: `${editTime.start} - ${editTime.end}`,
        });
      }
      setEditingId(null);
      fetchSchedules();
    } else {
      toast.error(error.message);
    }
    setSaving(false);
  };

  const deleteSchedule = async (id: string) => {
    await supabase.from("student_schedules").delete().eq("id", id);
    setShowDeleteModal(null);
    toast.success("Schedule deleted");
    fetchSchedules();
  };

  const filtered = schedules.filter((s) => {
    const matchesFilter = filter === "all" || s.status === filter;
    const matchesSearch = !search ||
      s.student_name.toLowerCase().includes(search.toLowerCase()) ||
      s.course_title.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-[#1F4FD8]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-poppins font-bold text-[#1C1C28]">Student Schedules</h1>
        <p className="text-[#4D4D4D] text-sm mt-1">Review student preferences and confirm fixed weekly schedules</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
          <input
            type="text"
            placeholder="Search by student or course..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-[#D4D4D4] rounded-xl bg-white text-[#1C1C28] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#1F4FD8] focus:border-transparent text-sm"
          />
        </div>
        <div className="flex gap-2">
          {(["all", "preferred", "confirmed"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                filter === f
                  ? "bg-[#1F4FD8] text-white"
                  : "bg-white text-[#4D4D4D] border border-[#D4D4D4] hover:border-[#1F4FD8]"
              }`}
            >
              {f === "all" ? "All" : f === "preferred" ? "Pending" : "Confirmed"}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center shadow-sm">
          <Calendar className="w-12 h-12 text-[#D4D4D4] mx-auto mb-3" />
          <p className="text-[#4D4D4D] font-medium">No schedules found</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 text-left">
                  <th className="px-6 py-4 text-xs font-semibold text-[#4D4D4D] uppercase tracking-wider">Student</th>
                  <th className="px-6 py-4 text-xs font-semibold text-[#4D4D4D] uppercase tracking-wider">Course</th>
                  <th className="px-6 py-4 text-xs font-semibold text-[#4D4D4D] uppercase tracking-wider">Day</th>
                  <th className="px-6 py-4 text-xs font-semibold text-[#4D4D4D] uppercase tracking-wider">Preferred Time</th>
                  <th className="px-6 py-4 text-xs font-semibold text-[#4D4D4D] uppercase tracking-wider">Confirmed Time</th>
                  <th className="px-6 py-4 text-xs font-semibold text-[#4D4D4D] uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-xs font-semibold text-[#4D4D4D] uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-[#1C1C28]">{s.student_name}</p>
                      <p className="text-xs text-[#9CA3AF]">{s.student_email}</p>
                    </td>
                    <td className="px-6 py-4 text-sm text-[#4D4D4D]">{s.course_title}</td>
                    <td className="px-6 py-4 text-sm font-medium text-[#1C1C28]">{DAYS[s.day_of_week]}</td>
                    <td className="px-6 py-4 text-sm text-[#4D4D4D]">
                      {s.preferred_start_time} - {s.preferred_end_time}
                    </td>
                    <td className="px-6 py-4">
                      {editingId === s.id ? (
                        <div className="flex gap-2 items-center">
                          <input
                            type="time"
                            value={editTime.start}
                            onChange={(e) => setEditTime({ ...editTime, start: e.target.value })}
                            className="px-2 py-1 border border-[#D4D4D4] rounded-lg text-sm w-24"
                          />
                          <span className="text-[#9CA3AF]">-</span>
                          <input
                            type="time"
                            value={editTime.end}
                            onChange={(e) => setEditTime({ ...editTime, end: e.target.value })}
                            className="px-2 py-1 border border-[#D4D4D4] rounded-lg text-sm w-24"
                          />
                        </div>
                      ) : s.confirmed_start_time ? (
                        <span className="text-sm text-green-700 font-medium">
                          {s.confirmed_start_time} - {s.confirmed_end_time}
                        </span>
                      ) : (
                        <span className="text-sm text-[#9CA3AF]">--</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {s.status === "confirmed" ? (
                        <span className="text-xs font-medium text-green-700 bg-green-100 px-3 py-1 rounded-full">Confirmed</span>
                      ) : (
                        <span className="text-xs font-medium text-amber-700 bg-amber-100 px-3 py-1 rounded-full">Pending</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1">
                        {editingId === s.id ? (
                          <>
                            <button
                              onClick={() => confirmSchedule(s.id)}
                              disabled={saving}
                              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-all"
                              title="Save & Confirm"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="p-2 text-[#4D4D4D] hover:bg-gray-100 rounded-lg transition-all"
                              title="Cancel"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </>
                        ) : (
                          <>
                            {s.status === "preferred" && (
                              <button
                                onClick={() => quickConfirm(s)}
                                disabled={saving}
                                className="px-3 py-1.5 text-xs font-medium text-green-600 hover:bg-green-50 rounded-lg transition-all"
                                title="Confirm with preferred times"
                              >
                                Confirm
                              </button>
                            )}
                            <button
                              onClick={() => startEdit(s)}
                              className="px-3 py-1.5 text-xs font-medium text-[#1F4FD8] hover:bg-blue-50 rounded-lg transition-all"
                            >
                              {s.status === "confirmed" ? "Edit" : "Set Time"}
                            </button>
                            <button
                              onClick={() => setShowDeleteModal(s.id)}
                              className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all"
                              title="Delete"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <h3 className="text-lg font-poppins font-bold text-[#1C1C28] mb-2">Delete Schedule?</h3>
            <p className="text-sm text-[#4D4D4D] mb-6">
              This will permanently remove this schedule entry.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteModal(null)}
                className="px-4 py-2 text-sm font-medium text-[#4D4D4D] bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteSchedule(showDeleteModal)}
                className="px-4 py-2 text-sm font-medium text-white bg-red-500 rounded-xl hover:bg-red-600 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
