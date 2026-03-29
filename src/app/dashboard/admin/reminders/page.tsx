"use client";

import React, { useState, useEffect } from "react";
import { createClient } from "@/src/lib/supabase/client";
import { Bell, Plus, Loader2, CheckCircle, Clock, Send, Trash2, Eye } from "lucide-react";
import toast from "react-hot-toast";
import { sendPaymentReminderEmail } from "@/src/lib/emailjs";

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
  const [filter, setFilter] = useState<"all" | "pending" | "sent" | "acknowledged">("all");
  const [showDeleteModal, setShowDeleteModal] = useState<string | null>(null);

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
      toast.success("Reminder created");
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

    // Send email notification
    const reminder = reminders.find((r) => r.id === id);
    if (reminder) {
      sendPaymentReminderEmail({
        studentName: reminder.student_name,
        studentEmail: reminder.student_email,
        courseName: reminder.course_title,
        dueDate: reminder.next_due_date || "N/A",
        notes: reminder.notes || undefined,
      });
    }

    toast.success("Reminder sent");
    fetchData();
  };

  const markAcknowledged = async (id: string) => {
    await supabase
      .from("payment_reminders")
      .update({ status: "acknowledged" } as any)
      .eq("id", id);
    toast.success("Marked as acknowledged");
    fetchData();
  };

  const handleDelete = async (id: string) => {
    await supabase.from("payment_reminders").delete().eq("id", id);
    setShowDeleteModal(null);
    toast.success("Reminder deleted");
    fetchData();
  };

  const filtered = reminders.filter((r) => filter === "all" || r.status === filter);

  const getTypeBadge = (type: string) => {
    const styles: Record<string, string> = {
      upcoming: "bg-blue-100 text-blue-700",
      overdue: "bg-red-100 text-red-700",
      renewal: "bg-purple-100 text-purple-700",
    };
    return (
      <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${styles[type] || "bg-gray-100 text-gray-600"}`}>
        {type}
      </span>
    );
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: "bg-amber-100 text-amber-700",
      sent: "bg-green-100 text-green-700",
      acknowledged: "bg-blue-100 text-blue-700",
    };
    return (
      <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${styles[status] || "bg-gray-100 text-gray-600"}`}>
        {status}
      </span>
    );
  };

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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-poppins font-bold text-[#1C1C28]">Payment Reminders</h1>
          <p className="text-[#4D4D4D] text-sm mt-1">Create and track payment reminders for students</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#1F4FD8] text-white font-poppins font-semibold text-sm rounded-xl hover:bg-[#1a45c2] transition-all shadow-md"
        >
          <Plus className="w-4 h-4" />
          New Reminder
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {(["all", "pending", "sent", "acknowledged"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              filter === f
                ? "bg-[#1F4FD8] text-white"
                : "bg-white text-[#4D4D4D] border border-[#D4D4D4] hover:border-[#1F4FD8]"
            }`}
          >
            {f === "all" ? "All" : f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Create Form */}
      {showForm && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <h2 className="text-lg font-poppins font-semibold text-[#1C1C28] mb-4">Create Reminder</h2>
          {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">{error}</div>}
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#1C1C28] mb-1.5">Student</label>
                <select
                  value={form.student_id}
                  onChange={(e) => setForm({ ...form, student_id: e.target.value })}
                  className="w-full px-4 py-3 border border-[#D4D4D4] rounded-xl bg-white text-[#1C1C28] text-sm focus:outline-none focus:ring-2 focus:ring-[#1F4FD8]"
                >
                  <option value="">Select student</option>
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>{s.full_name} ({s.email})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1C1C28] mb-1.5">Course</label>
                <select
                  value={form.course_id}
                  onChange={(e) => setForm({ ...form, course_id: e.target.value })}
                  className="w-full px-4 py-3 border border-[#D4D4D4] rounded-xl bg-white text-[#1C1C28] text-sm focus:outline-none focus:ring-2 focus:ring-[#1F4FD8]"
                >
                  <option value="">Select course</option>
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>{c.title}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#1C1C28] mb-1.5">Type</label>
                <select
                  value={form.reminder_type}
                  onChange={(e) => setForm({ ...form, reminder_type: e.target.value })}
                  className="w-full px-4 py-3 border border-[#D4D4D4] rounded-xl bg-white text-[#1C1C28] text-sm focus:outline-none focus:ring-2 focus:ring-[#1F4FD8]"
                >
                  <option value="upcoming">Upcoming Payment</option>
                  <option value="overdue">Overdue Payment</option>
                  <option value="renewal">Renewal</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1C1C28] mb-1.5">Due Date</label>
                <input
                  type="date"
                  value={form.next_due_date}
                  onChange={(e) => setForm({ ...form, next_due_date: e.target.value })}
                  className="w-full px-4 py-3 border border-[#D4D4D4] rounded-xl bg-white text-[#1C1C28] text-sm focus:outline-none focus:ring-2 focus:ring-[#1F4FD8]"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#1C1C28] mb-1.5">Notes</label>
              <textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                rows={2}
                placeholder="Optional notes"
                className="w-full px-4 py-3 border border-[#D4D4D4] rounded-xl bg-white text-[#1C1C28] placeholder:text-[#9CA3AF] text-sm focus:outline-none focus:ring-2 focus:ring-[#1F4FD8]"
              />
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2.5 bg-[#1F4FD8] text-white font-semibold rounded-xl hover:bg-[#1a45c2] disabled:opacity-60 transition-all text-sm"
              >
                {saving ? "Creating..." : "Create Reminder"}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-6 py-2.5 text-[#4D4D4D] border border-[#D4D4D4] rounded-xl hover:bg-gray-50 transition-all text-sm"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center shadow-sm">
          <Bell className="w-12 h-12 text-[#D4D4D4] mx-auto mb-3" />
          <p className="text-[#4D4D4D] font-medium">No reminders found</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 text-left">
                  <th className="px-6 py-4 text-xs font-semibold text-[#4D4D4D] uppercase tracking-wider">Student</th>
                  <th className="px-6 py-4 text-xs font-semibold text-[#4D4D4D] uppercase tracking-wider">Course</th>
                  <th className="px-6 py-4 text-xs font-semibold text-[#4D4D4D] uppercase tracking-wider">Type</th>
                  <th className="px-6 py-4 text-xs font-semibold text-[#4D4D4D] uppercase tracking-wider">Due Date</th>
                  <th className="px-6 py-4 text-xs font-semibold text-[#4D4D4D] uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-xs font-semibold text-[#4D4D4D] uppercase tracking-wider">Notes</th>
                  <th className="px-6 py-4 text-xs font-semibold text-[#4D4D4D] uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-[#1C1C28]">{r.student_name}</p>
                      <p className="text-xs text-[#9CA3AF]">{r.student_email}</p>
                    </td>
                    <td className="px-6 py-4 text-sm text-[#4D4D4D]">{r.course_title}</td>
                    <td className="px-6 py-4">{getTypeBadge(r.reminder_type)}</td>
                    <td className="px-6 py-4 text-sm text-[#4D4D4D]">
                      {r.next_due_date ? new Date(r.next_due_date).toLocaleDateString() : "—"}
                    </td>
                    <td className="px-6 py-4">{getStatusBadge(r.status)}</td>
                    <td className="px-6 py-4 text-sm text-[#4D4D4D] max-w-[200px] truncate">
                      {r.notes || "—"}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1">
                        {r.status === "pending" && (
                          <button
                            onClick={() => markSent(r.id)}
                            className="p-2 text-[#1F4FD8] hover:bg-blue-50 rounded-lg transition-all"
                            title="Mark as sent"
                          >
                            <Send className="w-4 h-4" />
                          </button>
                        )}
                        {r.status === "sent" && (
                          <button
                            onClick={() => markAcknowledged(r.id)}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-all"
                            title="Mark as acknowledged"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => setShowDeleteModal(r.id)}
                          className="p-2 text-[#4D4D4D] hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
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
            <h3 className="text-lg font-poppins font-bold text-[#1C1C28] mb-2">Delete Reminder?</h3>
            <p className="text-sm text-[#4D4D4D] mb-6">
              This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteModal(null)}
                className="px-4 py-2 text-sm font-medium text-[#4D4D4D] bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(showDeleteModal)}
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
