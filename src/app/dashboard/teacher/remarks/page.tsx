"use client";

import React, { useEffect, useState } from "react";
import { createClient } from "@/src/lib/supabase/client";
import { MessageSquare, Plus, User, BookOpen, X, Send } from "lucide-react";
import toast from "react-hot-toast";

interface RemarkRow {
  id: string;
  content: string;
  type: string;
  created_at: string;
  student_name: string;
  course_title: string;
}

interface StudentOption {
  id: string;
  full_name: string;
}

interface CourseOption {
  id: string;
  title: string;
}

const defaultForm = {
  student_id: "",
  course_id: "",
  type: "feedback" as "feedback" | "remark" | "note",
  content: "",
};

export default function TeacherRemarksPage() {
  const supabase = createClient() as any;
  const [remarks, setRemarks] = useState<RemarkRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [courses, setCourses] = useState<CourseOption[]>([]);
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [form, setForm] = useState(defaultForm);
  const [submitting, setSubmitting] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  const fetchRemarks = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    setUserId(user.id);

    const { data } = await supabase
      .from("remarks")
      .select("*")
      .eq("teacher_id", user.id)
      .order("created_at", { ascending: false });

    const rows = (data as any[]) || [];
    const studentIds = [...new Set(rows.map((r) => r.student_id))];
    const courseIds = [...new Set(rows.map((r) => r.course_id))];

    // Fetch teacher's courses for form
    const { data: ct } = await supabase
      .from("course_teachers")
      .select("course_id")
      .eq("teacher_id", user.id);

    const teacherCourseIds = ((ct as any[]) || []).map((x) => x.course_id);
    const allCourseIds = [...new Set([...courseIds, ...teacherCourseIds])];

    const { data: coursesData } = allCourseIds.length
      ? await supabase.from("courses").select("id, title").in("id", allCourseIds)
      : { data: [] };

    setCourses(((coursesData as any[]) || []).map((c) => ({ id: c.id, title: c.title })));

    // Fetch enrolled students across teacher's courses
    const { data: enrollments } = teacherCourseIds.length
      ? await supabase
          .from("enrollments")
          .select("student_id")
          .in("course_id", teacherCourseIds)
          .eq("status", "active")
      : { data: [] };

    const enrolledStudentIds = [...new Set(((enrollments as any[]) || []).map((e) => e.student_id))];
    const allStudentIds = [...new Set([...studentIds, ...enrolledStudentIds])];

    const { data: studentsData } = allStudentIds.length
      ? await supabase.from("profiles").select("id, full_name").in("id", allStudentIds)
      : { data: [] };

    setStudents(((studentsData as any[]) || []).map((s) => ({ id: s.id, full_name: s.full_name })));

    const studentMap = new Map(((studentsData as any[]) || []).map((s) => [s.id, s.full_name]));
    const courseMap = new Map(((coursesData as any[]) || []).map((c) => [c.id, c.title]));

    setRemarks(
      rows.map((r) => ({
        id: r.id,
        content: r.content,
        type: r.type,
        created_at: r.created_at,
        student_name: studentMap.get(r.student_id) || "Unknown",
        course_title: courseMap.get(r.course_id) || "Unknown",
      }))
    );

    setLoading(false);
  };

  useEffect(() => {
    fetchRemarks();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;
    setSubmitting(true);

    const { error } = await (supabase.from("remarks") as any).insert({
      student_id: form.student_id,
      teacher_id: userId,
      course_id: form.course_id,
      type: form.type,
      content: form.content,
    });

    if (error) {
      toast.error("Failed to add remark: " + error.message);
      setSubmitting(false);
      return;
    }

    toast.success("Remark added successfully!");
    setForm(defaultForm);
    setShowModal(false);
    setSubmitting(false);
    setLoading(true);
    fetchRemarks();
  };

  const typeBadge = (type: string) => {
    const styles: Record<string, string> = {
      feedback: "bg-green-100 text-green-700",
      remark: "bg-blue-100 text-blue-700",
      note: "bg-amber-100 text-amber-700",
    };
    return (
      <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${styles[type] || "bg-gray-100"}`}>
        {type}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-poppins font-bold text-[#1C1C28]">Remarks & Feedback</h1>
          <p className="text-[#4D4D4D] text-sm mt-1">Share feedback with your students</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#1F4FD8] text-white font-poppins font-semibold text-sm rounded-xl hover:bg-[#1a45c2] transition-all shadow-md"
        >
          <Plus className="w-4 h-4" />
          Add Remark
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-[#1F4FD8]/30 border-t-[#1F4FD8] rounded-full animate-spin" />
        </div>
      ) : remarks.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <MessageSquare className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-[#4D4D4D] font-medium">No remarks yet</p>
          <p className="text-sm text-[#9CA3AF] mt-1">Start adding feedback for your students</p>
        </div>
      ) : (
        <div className="space-y-3">
          {remarks.map((r) => (
            <div key={r.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    {typeBadge(r.type)}
                    <span className="text-xs text-[#1F4FD8] bg-[#1F4FD8]/10 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                      <BookOpen className="w-3 h-3" /> {r.course_title}
                    </span>
                    <span className="text-xs text-[#9CA3AF]">
                      {new Date(r.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm text-[#1C1C28] leading-relaxed">{r.content}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <div className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-[#4D4D4D]" />
                  </div>
                  <div className="hidden sm:block">
                    <p className="text-sm font-medium text-[#1C1C28]">{r.student_name}</p>
                    <p className="text-xs text-[#9CA3AF]">Student</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Remark Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-lg font-poppins font-semibold text-[#1C1C28]">Add Remark</h2>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
                <X className="w-5 h-5 text-[#4D4D4D]" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#1C1C28] mb-1.5">Student</label>
                <select
                  value={form.student_id}
                  onChange={(e) => setForm({ ...form, student_id: e.target.value })}
                  required
                  className="w-full px-4 py-3 border border-[#D4D4D4] rounded-xl bg-white text-[#1C1C28] focus:outline-none focus:ring-2 focus:ring-[#1F4FD8] focus:border-transparent text-sm"
                >
                  <option value="">Select a student</option>
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>{s.full_name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#1C1C28] mb-1.5">Course</label>
                <select
                  value={form.course_id}
                  onChange={(e) => setForm({ ...form, course_id: e.target.value })}
                  required
                  className="w-full px-4 py-3 border border-[#D4D4D4] rounded-xl bg-white text-[#1C1C28] focus:outline-none focus:ring-2 focus:ring-[#1F4FD8] focus:border-transparent text-sm"
                >
                  <option value="">Select a course</option>
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>{c.title}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#1C1C28] mb-1.5">Type</label>
                <select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value as any })}
                  className="w-full px-4 py-3 border border-[#D4D4D4] rounded-xl bg-white text-[#1C1C28] focus:outline-none focus:ring-2 focus:ring-[#1F4FD8] focus:border-transparent text-sm"
                >
                  <option value="feedback">Feedback</option>
                  <option value="remark">Remark</option>
                  <option value="note">Note</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#1C1C28] mb-1.5">Content</label>
                <textarea
                  value={form.content}
                  onChange={(e) => setForm({ ...form, content: e.target.value })}
                  required
                  rows={4}
                  placeholder="Write your remark or feedback here..."
                  className="w-full px-4 py-3 border border-[#D4D4D4] rounded-xl bg-white text-[#1C1C28] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#1F4FD8] focus:border-transparent text-sm resize-none"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-[#1F4FD8] text-white font-poppins font-semibold text-sm rounded-xl hover:bg-[#1a45c2] disabled:opacity-60 transition-all shadow-md"
                >
                  {submitting ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  {submitting ? "Submitting..." : "Submit Remark"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-6 py-3 border border-[#D4D4D4] text-[#4D4D4D] font-poppins font-semibold text-sm rounded-xl hover:bg-gray-50 transition-all"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
