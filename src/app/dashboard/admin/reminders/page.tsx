"use client";

import React, { useState, useEffect } from "react";
import { createClient } from "@/src/lib/supabase/client";
import { Bell, Plus, Loader2, CheckCircle, Clock, Send } from "lucide-react";

interface Reminder {
  id: string;
  student_id: string;
  student_name: string;
  student_email: string;
  course_id: string;
  course_title: string;
  reminder_type: string;
  next_due_date: string | null;
  sent_at: string | null;
  status: "pending" | "sent" | "acknowledged";
  notes: string | null;
  created_at: string;
}

interface StudentOption { id: string; full_name: string; email: string; }
interface CourseOption { id: string; title: string; }

export default function AdminRemindersPage() {
  const supabase = createClient() as any;
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [courses, setCourses] = useState<CourseOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<"all" | "pending" | "sent">("all");

  const [form, setForm] = useState({
    student_id: "",
    course_id: "",
    reminder_type: "upcoming",
    next_due_date: "",
    notes: "",
  });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    const [remRes, stuRes, crsRes] = await Promise.all([
      supabase
        .from("payment_reminders")
        .select("*, profiles(full_name, email), courses(title)")
        .order("created_at", { ascending: false }),
      supabase.from("profiles").select("id, full_name, email").eq("role", "student"),
      supabase.from("courses").select("id, title"),
    ]);

    if (remRes.data) {
      setReminders(remRes.data.map((r: any) => ({
        ...r,
        student_name: r.profiles?.full_name || "Unknown",
        student_email: r.profiles?.email || "",
        course_title: r.courses?.title || "Unknown",
      })));
    }
    if (stuRes.data) setStudents(stuRes.data as StudentOption[]);
    if (crsRes.data) setCourses(crsRes.data as CourseOption[]);
    setLoading(false);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!form.student_id || !form.course_id) {
      setError("Student and course are required");
      return;
    }
    setSaving(true);
    const { error: insertError } = await supabase
      .from("payment_reminders")
      .insert({
        student_id: form.student_id,
        course_id: form.course_id,
        reminder_type: form.reminder_type,
        next_due_date: form.next_due_date || null,
        notes: form.notes || null,
        status: "pending",
      } as any);

    if (insertError) {
      setError(insertError.message);
    } else {
      setShowForm(false);
      setForm({ student_id: "", course_id: "", reminder_type: "upcoming", next_due_date: "", notes: "" });
      fetchData();
    }
    setSaving(false);
  };

  const markSent = async (id: string) => {
    await supabase
      .from("payment_reminders")
      .update({ status: "sent", sent_at: new Date().toISOString() } as any)
      .eq("id", id);
    fetchData();
  };

  const filtered = reminders.filter((r) => filter === "all" || r.status === filter);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-[#1F4FD8]" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-poppins font-bold text-[#1C1C28]">Payment Reminders</h1>
          <p className="text-[#4D4D4D] mt-1">Create and track payment reminders for students</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#1F4FD8] text-white font-semibold rounded-xl hover:bg-[#1a45c2] transition-all text-sm"
        >
          <Plus className="w-4 h-4" />
          New Reminder
        </button>
      </div>

      <div className="flex gap-2">
        {(["all", "pending", "sent"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              filter === f ? "bg-[#1F4FD8] text-white" : "bg-white text-[#4D4D4D] border border-[#D4D4D4] hover:border-[#1F4FD8]"
            }`}
          >
            {f === "all" ? "All" : f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {showForm && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-[#1C1C28] mb-4">Create Reminder</h2>
          {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">{error}</div>}
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#1C1C28] mb-1.5">Student</label>
                <select value={form.student_id} onChange={(e) => setForm({ ...form, student_id: e.target.value })} className="w-full px-4 py-3 border border-[#D4D4D4] rounded-xl bg-white text-[#1C1C28] text-sm focus:outline-none focus:ring-2 focus:ring-[#1F4FD8]">
                  <option value="">Select student</option>
                  {students.map((s) => <option key={s.id} value={s.id}>{s.full_name} ({s.email})</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1C1C28] mb-1.5">Course</label>
                <select value={form.course_id} onChange={(e) => setForm({ ...form, course_id: e.target.value })} className="w-full px-4 py-3 border border-[#D4D4D4] rounded-xl bg-white text-[#1C1C28] text-sm focus:outline-none focus:ring-2 focus:ring-[#1F4FD8]">
                  <option value="">Select course</option>
                  {courses.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#1C1C28] mb-1.5">Type</label>
                <select value={form.reminder_type} onChange={(e) => setForm({ ...form, reminder_type: e.target.value })} className="w-full px-4 py-3 border border-[#D4D4D4] rounded-xl bg-white text-[#1C1C28] text-sm focus:outline-none focus:ring-2 focus:ring-[#1F4FD8]">
                  <option value="upcoming">Upcoming Payment</option>
                  <option value="overdue">Overdue Payment</option>
                  <option value="renewal">Renewal</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1C1C28] mb-1.5">Due Date</label>
                <input type="date" value={form.next_due_date} onChange={(e) => setForm({ ...form, next_due_date: e.target.value })} className="w-full px-4 py-3 border border-[#D4D4D4] rounded-xl bg-white text-[#1C1C28] text-sm focus:outline-none focus:ring-2 focus:ring-[#1F4FD8]" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#1C1C28] mb-1.5">Notes</label>
              <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} placeholder="Optional notes" className="w-full px-4 py-3 border border-[#D4D4D4] rounded-xl bg-white text-[#1C1C28] placeholder:text-[#9CA3AF] text-sm focus:outline-none focus:ring-2 focus:ring-[#1F4FD8]" />
            </div>
            <div className="flex gap-3">
              <button type="submit" disabled={saving} className="px-6 py-2.5 bg-[#1F4FD8] text-white font-semibold rounded-xl hover:bg-[#1a45c2] disabled:opacity-60 transition-all text-sm">
                {saving ? "Creating..." : "Create Reminder"}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="px-6 py-2.5 text-[#4D4D4D] border border-[#D4D4D4] rounded-xl hover:bg-gray-50 transition-all text-sm">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center shadow-sm">
          <Bell className="w-12 h-12 text-[#D4D4D4] mx-auto mb-3" />
          <p className="text-[#4D4D4D] font-medium">No reminders found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((r) => (
            <div key={r.id} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${r.status === "sent" ? "bg-green-100" : "bg-amber-100"}`}>
                  {r.status === "sent" ? <CheckCircle className="w-5 h-5 text-green-600" /> : <Clock className="w-5 h-5 text-amber-600" />}
                </div>
                <div>
                  <p className="font-medium text-sm text-[#1C1C28]">{r.student_name}</p>
                  <p className="text-xs text-[#9CA3AF]">
                    {r.course_title} &middot; {r.reminder_type} &middot; {r.next_due_date ? `Due ${new Date(r.next_due_date).toLocaleDateString()}` : "No due date"}
                  </p>
                  {r.notes && <p className="text-xs text-[#4D4D4D] mt-0.5">{r.notes}</p>}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs font-medium px-3 py-1 rounded-full ${
                  r.status === "sent" ? "text-green-700 bg-green-100" :
                  r.status === "acknowledged" ? "text-blue-700 bg-blue-100" :
                  "text-amber-700 bg-amber-100"
                }`}>
                  {r.status}
                </span>
                {r.status === "pending" && (
                  <button onClick={() => markSent(r.id)} className="p-2 text-[#1F4FD8] hover:bg-blue-50 rounded-lg transition-all" title="Mark as sent">
                    <Send className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
