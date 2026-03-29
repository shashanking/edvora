"use client";

import React, { useState, useEffect } from "react";
import { createClient } from "@/src/lib/supabase/client";
import { Calendar, Clock, CheckCircle, Loader2, Plus } from "lucide-react";
import toast from "react-hot-toast";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

interface Schedule {
  id: string;
  course_id: string;
  course_title?: string;
  day_of_week: number;
  preferred_start_time: string;
  preferred_end_time: string;
  confirmed_start_time: string | null;
  confirmed_end_time: string | null;
  status: "preferred" | "confirmed";
  notes: string | null;
}

interface CourseOption {
  id: string;
  title: string;
}

export default function StudentSchedulePage() {
  const supabase = createClient() as any;
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [courses, setCourses] = useState<CourseOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [selectedCourse, setSelectedCourse] = useState("");
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const [enrollmentsRes, schedulesRes] = await Promise.all([
      supabase
        .from("enrollments")
        .select("course_id, courses(id, title)")
        .eq("student_id", user.id)
        .eq("status", "active"),
      supabase
        .from("student_schedules")
        .select("*, courses(title)")
        .eq("student_id", user.id)
        .order("day_of_week", { ascending: true }),
    ]);

    if (enrollmentsRes.data) {
      setCourses(
        enrollmentsRes.data.map((e: any) => ({
          id: e.course_id,
          title: (e.courses as any)?.title || "Unknown Course",
        }))
      );
    }

    if (schedulesRes.data) {
      setSchedules(
        schedulesRes.data.map((s: any) => ({
          ...s,
          course_title: (s.courses as any)?.title || "Unknown Course",
        }))
      );
    }

    setLoading(false);
  };

  const toggleDay = (day: number) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedCourse) {
      toast.error("Please select a course");
      return;
    }
    if (selectedDays.length === 0) {
      toast.error("Please select at least one day");
      return;
    }
    if (startTime >= endTime) {
      toast.error("End time must be after start time");
      return;
    }

    setSaving(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setSaving(false);
      return;
    }

    const inserts = selectedDays.map((day) => ({
      student_id: user.id,
      course_id: selectedCourse,
      day_of_week: day,
      preferred_start_time: startTime,
      preferred_end_time: endTime,
      status: "preferred" as const,
    }));

    const { error: insertError } = await supabase
      .from("student_schedules")
      .insert(inserts as any);

    if (insertError) {
      toast.error(insertError.message);
    } else {
      toast.success(
        "Your preferred schedule has been submitted! The admin will confirm your schedule shortly."
      );
      setSelectedDays([]);
      setSelectedCourse("");
      setStartTime("09:00");
      setEndTime("10:00");
      fetchData();
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-[#1F4FD8]" />
      </div>
    );
  }

  const confirmedSchedules = schedules.filter((s) => s.status === "confirmed");
  const pendingSchedules = schedules.filter((s) => s.status === "preferred");

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-poppins font-bold text-[#1C1C28]">
          My Schedule
        </h1>
        <p className="text-[#4D4D4D] mt-1">
          Select your preferred days and times. Admin will confirm your fixed
          schedule.
        </p>
      </div>

      {/* Confirmed schedules */}
      {confirmedSchedules.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-[#1C1C28] mb-4 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-500" />
            Confirmed Schedule
          </h2>
          <div className="space-y-3">
            {confirmedSchedules.map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between p-4 bg-green-50 rounded-xl border border-green-100"
              >
                <div>
                  <p className="font-medium text-[#1C1C28]">
                    {s.course_title}
                  </p>
                  <p className="text-sm text-[#4D4D4D]">
                    {DAYS[s.day_of_week]} &middot;{" "}
                    {s.confirmed_start_time || s.preferred_start_time} &ndash;{" "}
                    {s.confirmed_end_time || s.preferred_end_time}
                  </p>
                </div>
                <span className="text-xs font-medium text-green-700 bg-green-100 px-3 py-1 rounded-full">
                  Confirmed
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pending preferred schedules */}
      {pendingSchedules.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-[#1C1C28] mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-amber-500" />
            Pending Confirmation
          </h2>
          <div className="space-y-3">
            {pendingSchedules.map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between p-4 bg-amber-50 rounded-xl border border-amber-100"
              >
                <div>
                  <p className="font-medium text-[#1C1C28]">
                    {s.course_title}
                  </p>
                  <p className="text-sm text-[#4D4D4D]">
                    {DAYS[s.day_of_week]} &middot; {s.preferred_start_time}{" "}
                    &ndash; {s.preferred_end_time}
                  </p>
                </div>
                <span className="text-xs font-medium text-amber-700 bg-amber-100 px-3 py-1 rounded-full">
                  Pending
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state when no schedules exist */}
      {schedules.length === 0 && (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <Calendar className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-[#4D4D4D] font-medium">No schedules yet</p>
          <p className="text-sm text-[#9CA3AF] mt-1">
            Add your preferred schedule below to get started
          </p>
        </div>
      )}

      {/* Submit new preferences */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-[#1C1C28] mb-4 flex items-center gap-2">
          <Plus className="w-5 h-5 text-[#1F4FD8]" />
          Add Schedule Preference
        </h2>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-[#1C1C28] mb-1.5">
              Course
            </label>
            <select
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              className="w-full px-4 py-3 border border-[#D4D4D4] rounded-xl bg-white text-[#1C1C28] text-sm focus:outline-none focus:ring-2 focus:ring-[#1F4FD8]"
            >
              <option value="">Select a course</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#1C1C28] mb-2">
              Select Days
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-7 gap-2">
              {DAYS.map((day, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => toggleDay(idx)}
                  className={`px-3 py-2.5 rounded-xl text-sm font-medium transition-all border ${
                    selectedDays.includes(idx)
                      ? "bg-[#1F4FD8] text-white border-[#1F4FD8]"
                      : "bg-white text-[#4D4D4D] border-[#D4D4D4] hover:border-[#1F4FD8]"
                  }`}
                >
                  {day.slice(0, 3)}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#1C1C28] mb-1.5">
                Preferred Start Time
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-4 py-3 border border-[#D4D4D4] rounded-xl bg-white text-[#1C1C28] text-sm focus:outline-none focus:ring-2 focus:ring-[#1F4FD8]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#1C1C28] mb-1.5">
                Preferred End Time
              </label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full px-4 py-3 border border-[#D4D4D4] rounded-xl bg-white text-[#1C1C28] text-sm focus:outline-none focus:ring-2 focus:ring-[#1F4FD8]"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full py-3 bg-[#1F4FD8] hover:bg-[#1a45c2] disabled:opacity-60 text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2"
          >
            {saving ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              "Submit Preferred Schedule"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
