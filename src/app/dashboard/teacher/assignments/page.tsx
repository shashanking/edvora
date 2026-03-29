"use client";

import React, { useEffect, useState, useCallback } from "react";
import { createClient } from "@/src/lib/supabase/client";
import {
  ClipboardList,
  Plus,
  Calendar,
  Users,
  ChevronDown,
  Edit3,
  Eye,
  X,
  FileText,
  Download,
  Hash,
  CheckCircle2,
  Clock,
  Loader2,
  Trash2,
  Save,
} from "lucide-react";
import toast from "react-hot-toast";
import FileUpload from "@/src/components/shared/FileUpload";
import Link from "next/link";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface CourseOption {
  id: string;
  title: string;
}

interface SessionRow {
  id: string;
  session_number: number;
  title: string;
  scheduled_at: string | null;
  status: string;
  enrollment_id: string;
  assignment?: AssignmentRow | null;
}

interface AssignmentRow {
  id: string;
  title: string;
  description: string | null;
  type: string;
  due_date: string | null;
  file_urls: string[];
  allowed_file_types: string[];
  session_id: string;
  submission_count: number;
  pending_count: number;
}

interface SubmissionRow {
  id: string;
  student_name: string;
  student_email: string;
  submitted_at: string;
  file_urls: string[];
  content: string | null;
  grade: string | null;
  feedback: string | null;
  score: number | null;
  graded_at: string | null;
}

interface AssignmentForm {
  title: string;
  description: string;
  type: string;
  due_date: string;
  file_urls: string[];
  allowed_file_types: string[];
}

const defaultForm: AssignmentForm = {
  title: "",
  description: "",
  type: "homework",
  due_date: "",
  file_urls: [],
  allowed_file_types: [],
};

const FILE_TYPE_OPTIONS = [
  { value: "audio", label: "Audio" },
  { value: "video", label: "Video" },
  { value: "doc", label: "Documents" },
  { value: "image", label: "Images" },
];

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function TeacherAssignmentsPage() {
  const supabase = createClient() as any;

  const [userId, setUserId] = useState<string | null>(null);
  const [courses, setCourses] = useState<CourseOption[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [sessionsLoading, setSessionsLoading] = useState(false);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<AssignmentRow | null>(null);
  const [modalSessionId, setModalSessionId] = useState("");
  const [modalSessionNumber, setModalSessionNumber] = useState(0);
  const [form, setForm] = useState<AssignmentForm>(defaultForm);
  const [submitting, setSubmitting] = useState(false);

  // Submissions panel
  const [viewingAssignment, setViewingAssignment] = useState<AssignmentRow | null>(null);
  const [submissions, setSubmissions] = useState<SubmissionRow[]>([]);
  const [submissionsLoading, setSubmissionsLoading] = useState(false);
  const [savingGrade, setSavingGrade] = useState<string | null>(null);
  const [gradeInputs, setGradeInputs] = useState<
    Record<string, { grade: string; feedback: string; score: string }>
  >({});

  /* ---------- Load teacher courses ---------- */
  useEffect(() => {
    const load = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);

      const { data: ct } = await supabase
        .from("course_teachers")
        .select("course_id")
        .eq("teacher_id", user.id);

      const courseIds = ((ct as any[]) || []).map((x) => x.course_id);
      if (!courseIds.length) {
        setLoading(false);
        return;
      }

      const { data: coursesData } = await supabase
        .from("courses")
        .select("id, title")
        .in("id", courseIds)
        .order("title");

      const list: CourseOption[] = ((coursesData as any[]) || []).map((c) => ({
        id: c.id,
        title: c.title,
      }));
      setCourses(list);

      if (list.length > 0) {
        setSelectedCourseId(list[0].id);
      }
      setLoading(false);
    };
    load();
  }, []);

  /* ---------- Load sessions + assignments for selected course ---------- */
  const loadSessions = useCallback(async () => {
    if (!selectedCourseId || !userId) return;
    setSessionsLoading(true);

    // Get sessions for this course where this teacher is assigned
    const { data: sessionsData } = await supabase
      .from("live_sessions")
      .select("id, session_number, title, scheduled_at, status, enrollment_id")
      .eq("course_id", selectedCourseId)
      .eq("teacher_id", userId)
      .order("session_number", { ascending: true });

    const rows = (sessionsData as any[]) || [];
    const sessionIds = rows.map((s) => s.id);

    // Get assignments for these sessions
    let assignmentsMap = new Map<string, any>();
    if (sessionIds.length) {
      const { data: assignments } = await supabase
        .from("assignments")
        .select("*")
        .in("session_id", sessionIds);

      const assignmentRows = (assignments as any[]) || [];
      const assignmentIds = assignmentRows.map((a) => a.id);

      // Get submission counts
      let submissionMap = new Map<string, { total: number; pending: number }>();
      if (assignmentIds.length) {
        const { data: subs } = await supabase
          .from("assignment_submissions")
          .select("assignment_id, graded_at")
          .in("assignment_id", assignmentIds);

        ((subs as any[]) || []).forEach((s) => {
          const cur = submissionMap.get(s.assignment_id) || { total: 0, pending: 0 };
          cur.total++;
          if (!s.graded_at) cur.pending++;
          submissionMap.set(s.assignment_id, cur);
        });
      }

      assignmentRows.forEach((a) => {
        const stats = submissionMap.get(a.id) || { total: 0, pending: 0 };
        assignmentsMap.set(a.session_id, {
          id: a.id,
          title: a.title,
          description: a.description,
          type: a.type || "homework",
          due_date: a.due_date,
          file_urls: a.file_urls || [],
          allowed_file_types: a.allowed_file_types || [],
          session_id: a.session_id,
          submission_count: stats.total,
          pending_count: stats.pending,
        });
      });
    }

    setSessions(
      rows.map((s) => ({
        id: s.id,
        session_number: s.session_number || 0,
        title: s.title || `Session ${s.session_number || ""}`,
        scheduled_at: s.scheduled_at,
        status: s.status || "scheduled",
        enrollment_id: s.enrollment_id,
        assignment: assignmentsMap.get(s.id) || null,
      }))
    );

    setSessionsLoading(false);
  }, [selectedCourseId, userId]);

  useEffect(() => {
    if (selectedCourseId && userId) {
      loadSessions();
    }
  }, [selectedCourseId, userId, loadSessions]);

  /* ---------- Open create/edit modal ---------- */
  const openCreateModal = (sessionId: string, sessionNumber: number) => {
    setEditingAssignment(null);
    setModalSessionId(sessionId);
    setModalSessionNumber(sessionNumber);
    setForm(defaultForm);
    setShowModal(true);
  };

  const openEditModal = (assignment: AssignmentRow, sessionNumber: number) => {
    setEditingAssignment(assignment);
    setModalSessionId(assignment.session_id);
    setModalSessionNumber(sessionNumber);
    setForm({
      title: assignment.title,
      description: assignment.description || "",
      type: assignment.type || "homework",
      due_date: assignment.due_date
        ? new Date(assignment.due_date).toISOString().slice(0, 16)
        : "",
      file_urls: assignment.file_urls || [],
      allowed_file_types: assignment.allowed_file_types || [],
    });
    setShowModal(true);
  };

  /* ---------- Save assignment ---------- */
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;
    setSubmitting(true);

    const payload = {
      session_id: modalSessionId,
      course_id: selectedCourseId,
      teacher_id: userId,
      title: form.title,
      description: form.description || null,
      type: form.type,
      due_date: form.due_date ? new Date(form.due_date).toISOString() : null,
      file_urls: form.file_urls,
      allowed_file_types: form.allowed_file_types,
    };

    let error: any;
    if (editingAssignment) {
      ({ error } = await supabase
        .from("assignments")
        .update(payload)
        .eq("id", editingAssignment.id));
    } else {
      ({ error } = await supabase.from("assignments").insert(payload));
    }

    if (error) {
      toast.error("Failed to save: " + error.message);
    } else {
      toast.success(editingAssignment ? "Assignment updated" : "Assignment created");
      setShowModal(false);
      loadSessions();
    }
    setSubmitting(false);
  };

  /* ---------- File upload callback ---------- */
  const handleFileUploaded = (url: string) => {
    setForm((prev) => ({ ...prev, file_urls: [...prev.file_urls, url] }));
  };

  const removeUploadedFile = (index: number) => {
    setForm((prev) => ({
      ...prev,
      file_urls: prev.file_urls.filter((_, i) => i !== index),
    }));
  };

  /* ---------- Toggle allowed file type ---------- */
  const toggleFileType = (type: string) => {
    setForm((prev) => {
      const current = prev.allowed_file_types;
      return {
        ...prev,
        allowed_file_types: current.includes(type)
          ? current.filter((t) => t !== type)
          : [...current, type],
      };
    });
  };

  /* ---------- View submissions ---------- */
  const openSubmissions = async (assignment: AssignmentRow) => {
    setViewingAssignment(assignment);
    setSubmissionsLoading(true);
    setSubmissions([]);
    setGradeInputs({});

    const { data: subs } = await supabase
      .from("assignment_submissions")
      .select("*")
      .eq("assignment_id", assignment.id)
      .order("submitted_at", { ascending: false });

    const rows = (subs as any[]) || [];
    const studentIds = [...new Set(rows.map((s) => s.student_id))];

    let profileMap = new Map<string, { name: string; email: string }>();
    if (studentIds.length) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .in("id", studentIds);

      ((profiles as any[]) || []).forEach((p) => {
        profileMap.set(p.id, {
          name: p.full_name || "Unnamed",
          email: p.email || "",
        });
      });
    }

    const mapped: SubmissionRow[] = rows.map((s) => {
      const profile = profileMap.get(s.student_id) || {
        name: "Unknown",
        email: "",
      };
      return {
        id: s.id,
        student_name: profile.name,
        student_email: profile.email,
        submitted_at: s.submitted_at,
        file_urls: s.file_urls || [],
        content: s.content || null,
        grade: s.grade || null,
        feedback: s.feedback || null,
        score: s.score ?? null,
        graded_at: s.graded_at || null,
      };
    });

    const inputs: Record<string, { grade: string; feedback: string; score: string }> = {};
    mapped.forEach((s) => {
      inputs[s.id] = {
        grade: s.grade || "",
        feedback: s.feedback || "",
        score: s.score !== null ? String(s.score) : "",
      };
    });

    setSubmissions(mapped);
    setGradeInputs(inputs);
    setSubmissionsLoading(false);
  };

  /* ---------- Save grade for a submission ---------- */
  const handleSaveGrade = async (submissionId: string) => {
    const input = gradeInputs[submissionId];
    if (!input) return;
    setSavingGrade(submissionId);

    const { error } = await supabase
      .from("assignment_submissions")
      .update({
        grade: input.grade || null,
        feedback: input.feedback || null,
        score: input.score ? parseInt(input.score) : null,
        graded_at: new Date().toISOString(),
      })
      .eq("id", submissionId);

    if (error) {
      toast.error("Failed to save assessment: " + error.message);
    } else {
      toast.success("Assessment saved");
      // Update local state
      setSubmissions((prev) =>
        prev.map((s) =>
          s.id === submissionId
            ? {
                ...s,
                grade: input.grade || null,
                feedback: input.feedback || null,
                score: input.score ? parseInt(input.score) : null,
                graded_at: new Date().toISOString(),
              }
            : s
        )
      );
    }
    setSavingGrade(null);
  };

  /* ---------- Status badge ---------- */
  const statusBadge = (status: string) => {
    const styles: Record<string, string> = {
      scheduled: "bg-blue-100 text-blue-700",
      live: "bg-red-50 text-red-600 animate-pulse",
      completed: "bg-green-100 text-green-700",
      cancelled: "bg-gray-100 text-gray-500",
    };
    const labels: Record<string, string> = {
      scheduled: "Scheduled",
      live: "LIVE NOW",
      completed: "Completed",
      cancelled: "Cancelled",
    };
    return (
      <span
        className={`px-2.5 py-1 rounded-full text-xs font-medium ${styles[status] || "bg-gray-100 text-gray-500"}`}
      >
        {labels[status] || status}
      </span>
    );
  };

  const typeBadge = (type: string) => {
    const styles: Record<string, string> = {
      homework: "bg-purple-100 text-purple-700",
      classwork: "bg-teal-100 text-teal-700",
      assessment: "bg-amber-100 text-amber-700",
    };
    return (
      <span
        className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${styles[type] || "bg-gray-100 text-gray-500"}`}
      >
        {type}
      </span>
    );
  };

  /* ---------- Render ---------- */

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-[#1F4FD8]/30 border-t-[#1F4FD8] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-poppins font-bold text-[#1C1C28]">
          Assignments
        </h1>
        <p className="text-[#4D4D4D] text-sm mt-1">
          Manage session-based assignments and review submissions
        </p>
      </div>

      {/* Course Selector */}
      {courses.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <ClipboardList className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-[#4D4D4D] font-medium">No courses assigned</p>
          <p className="text-sm text-[#9CA3AF] mt-1">
            You need to be assigned to a course to manage assignments
          </p>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-[#1C1C28]">Course:</label>
            <div className="relative">
              <select
                value={selectedCourseId}
                onChange={(e) => setSelectedCourseId(e.target.value)}
                className="appearance-none pl-4 pr-10 py-2.5 border border-[#D4D4D4] rounded-xl bg-white text-[#1C1C28] focus:outline-none focus:ring-2 focus:ring-[#1F4FD8] focus:border-transparent text-sm font-medium min-w-[240px]"
              >
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF] pointer-events-none" />
            </div>
          </div>

          {/* Sessions List */}
          {sessionsLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-2 border-[#1F4FD8]/30 border-t-[#1F4FD8] rounded-full animate-spin" />
            </div>
          ) : sessions.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <ClipboardList className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-[#4D4D4D] font-medium">No sessions found</p>
              <p className="text-sm text-[#9CA3AF] mt-1">
                Sessions will appear here once they are created for this course
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {sessions.map((session) => (
                <div
                  key={session.id}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between gap-4">
                    {/* Session info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-[#1F4FD8] bg-[#1F4FD8]/10 px-2 py-0.5 rounded-full">
                          <Hash className="w-3 h-3" />
                          Session {session.session_number}
                        </span>
                        {statusBadge(session.status)}
                        {session.assignment && typeBadge(session.assignment.type)}
                      </div>
                      <h3 className="font-poppins font-semibold text-[#1C1C28]">
                        {session.title}
                      </h3>
                      <div className="flex items-center gap-4 mt-2 text-xs text-[#9CA3AF]">
                        {session.scheduled_at && (
                          <span className="inline-flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            {new Date(session.scheduled_at).toLocaleDateString()}
                          </span>
                        )}
                      </div>

                      {/* Assignment info */}
                      {session.assignment && (
                        <div className="mt-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                          <div className="flex items-center gap-2 mb-1">
                            <ClipboardList className="w-4 h-4 text-[#1F4FD8]" />
                            <span className="text-sm font-semibold text-[#1C1C28]">
                              {session.assignment.title}
                            </span>
                          </div>
                          {session.assignment.description && (
                            <p className="text-xs text-[#4D4D4D] line-clamp-2 ml-6">
                              {session.assignment.description}
                            </p>
                          )}
                          <div className="flex items-center gap-4 mt-2 ml-6 text-xs text-[#9CA3AF]">
                            {session.assignment.due_date && (
                              <span className="inline-flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5" />
                                Due:{" "}
                                {new Date(
                                  session.assignment.due_date
                                ).toLocaleDateString()}
                              </span>
                            )}
                            <span className="inline-flex items-center gap-1">
                              <Users className="w-3.5 h-3.5" />
                              {session.assignment.submission_count} submissions
                            </span>
                            {session.assignment.pending_count > 0 && (
                              <span className="text-amber-600 font-medium">
                                {session.assignment.pending_count} pending review
                              </span>
                            )}
                          </div>
                          {session.assignment.file_urls.length > 0 && (
                            <div className="flex items-center gap-1 mt-2 ml-6 text-xs text-[#9CA3AF]">
                              <FileText className="w-3.5 h-3.5" />
                              {session.assignment.file_urls.length} attachment(s)
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Action buttons */}
                    <div className="flex flex-col gap-2 flex-shrink-0">
                      {session.assignment ? (
                        <>
                          <button
                            onClick={() =>
                              openEditModal(
                                session.assignment!,
                                session.session_number
                              )
                            }
                            className="inline-flex items-center gap-2 px-4 py-2.5 border border-[#D4D4D4] text-[#1C1C28] text-sm font-semibold rounded-xl hover:bg-gray-50 transition-all"
                          >
                            <Edit3 className="w-4 h-4" />
                            Edit
                          </button>
                          <button
                            onClick={() => openSubmissions(session.assignment!)}
                            className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#1F4FD8]/10 text-[#1F4FD8] text-sm font-semibold rounded-xl hover:bg-[#1F4FD8]/20 transition-all"
                          >
                            <Eye className="w-4 h-4" />
                            Submissions
                          </button>
                          <Link
                            href={`/dashboard/teacher/assignments/${session.assignment.id}`}
                            className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#1F4FD8] text-white text-sm font-semibold rounded-xl hover:bg-[#1a45c2] transition-all shadow-md text-center justify-center"
                          >
                            <ClipboardList className="w-4 h-4" />
                            Details
                          </Link>
                        </>
                      ) : (
                        <button
                          onClick={() =>
                            openCreateModal(session.id, session.session_number)
                          }
                          className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#1F4FD8] text-white text-sm font-semibold rounded-xl hover:bg-[#1a45c2] transition-all shadow-md"
                        >
                          <Plus className="w-4 h-4" />
                          Create Assignment
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ===== Create / Edit Assignment Modal ===== */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-lg font-poppins font-semibold text-[#1C1C28]">
                {editingAssignment ? "Edit Assignment" : "Create Assignment"} --
                Session {modalSessionNumber}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-[#4D4D4D]" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-[#1C1C28] mb-1.5">
                  Title
                </label>
                <input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  required
                  placeholder="e.g. Week 3 Homework"
                  className="w-full px-4 py-3 border border-[#D4D4D4] rounded-xl bg-white text-[#1C1C28] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#1F4FD8] focus:border-transparent text-sm"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-[#1C1C28] mb-1.5">
                  Description
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  rows={3}
                  placeholder="Assignment instructions..."
                  className="w-full px-4 py-3 border border-[#D4D4D4] rounded-xl bg-white text-[#1C1C28] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#1F4FD8] focus:border-transparent text-sm resize-none"
                />
              </div>

              {/* Type */}
              <div>
                <label className="block text-sm font-medium text-[#1C1C28] mb-1.5">
                  Type
                </label>
                <select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                  className="w-full px-4 py-3 border border-[#D4D4D4] rounded-xl bg-white text-[#1C1C28] focus:outline-none focus:ring-2 focus:ring-[#1F4FD8] focus:border-transparent text-sm"
                >
                  <option value="homework">Homework</option>
                  <option value="classwork">Classwork</option>
                  <option value="assessment">Assessment</option>
                </select>
              </div>

              {/* Due date */}
              <div>
                <label className="block text-sm font-medium text-[#1C1C28] mb-1.5">
                  Due Date
                </label>
                <input
                  type="datetime-local"
                  value={form.due_date}
                  onChange={(e) =>
                    setForm({ ...form, due_date: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-[#D4D4D4] rounded-xl bg-white text-[#1C1C28] focus:outline-none focus:ring-2 focus:ring-[#1F4FD8] focus:border-transparent text-sm"
                />
              </div>

              {/* File Upload */}
              <div>
                <label className="block text-sm font-medium text-[#1C1C28] mb-1.5">
                  Assignment Attachments
                </label>
                {form.file_urls.length > 0 && (
                  <div className="space-y-2 mb-3">
                    {form.file_urls.map((url, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-3 p-2.5 bg-gray-50 rounded-xl border border-gray-200"
                      >
                        <FileText className="w-4 h-4 text-[#1F4FD8] flex-shrink-0" />
                        <a
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-[#1F4FD8] hover:underline truncate flex-1"
                        >
                          {decodeURIComponent(url.split("/").pop() || "File")}
                        </a>
                        <button
                          type="button"
                          onClick={() => removeUploadedFile(i)}
                          className="p-1 hover:bg-gray-200 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-red-500" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <FileUpload
                  bucket="assignments"
                  folder={`course-${selectedCourseId}/session-${modalSessionNumber}`}
                  onUpload={(url) => handleFileUploaded(url)}
                  label="Upload assignment attachment"
                  maxSizeMB={50}
                />
              </div>

              {/* Allowed file types for student submission */}
              <div>
                <label className="block text-sm font-medium text-[#1C1C28] mb-1.5">
                  Allowed Submission File Types
                </label>
                <div className="flex flex-wrap gap-3">
                  {FILE_TYPE_OPTIONS.map((opt) => (
                    <label
                      key={opt.value}
                      className="inline-flex items-center gap-2 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={form.allowed_file_types.includes(opt.value)}
                        onChange={() => toggleFileType(opt.value)}
                        className="w-4 h-4 rounded border-gray-300 text-[#1F4FD8] focus:ring-[#1F4FD8]"
                      />
                      <span className="text-sm text-[#4D4D4D]">{opt.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Submit */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-[#1F4FD8] text-white font-poppins font-semibold text-sm rounded-xl hover:bg-[#1a45c2] disabled:opacity-60 transition-all shadow-md"
                >
                  {submitting ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  {submitting
                    ? "Saving..."
                    : editingAssignment
                      ? "Update Assignment"
                      : "Create Assignment"}
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

      {/* ===== View Submissions Panel ===== */}
      {viewingAssignment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div>
                <h2 className="text-lg font-poppins font-semibold text-[#1C1C28]">
                  Submissions
                </h2>
                <p className="text-sm text-[#4D4D4D] mt-0.5">
                  {viewingAssignment.title}
                </p>
              </div>
              <button
                onClick={() => {
                  setViewingAssignment(null);
                  loadSessions();
                }}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-[#4D4D4D]" />
              </button>
            </div>

            <div className="p-6">
              {submissionsLoading ? (
                <div className="flex items-center justify-center py-10">
                  <div className="w-6 h-6 border-2 border-[#1F4FD8]/30 border-t-[#1F4FD8] rounded-full animate-spin" />
                </div>
              ) : submissions.length === 0 ? (
                <div className="text-center py-10">
                  <p className="text-[#4D4D4D] font-medium">
                    No submissions yet
                  </p>
                  <p className="text-sm text-[#9CA3AF] mt-1">
                    Students have not submitted work for this assignment
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {submissions.map((sub) => (
                    <div
                      key={sub.id}
                      className="bg-gray-50 rounded-2xl border border-gray-100 p-4"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className="font-semibold text-[#1C1C28] text-sm">
                            {sub.student_name}
                          </p>
                          <p className="text-xs text-[#9CA3AF]">
                            {sub.student_email}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-[#9CA3AF]">
                            Submitted{" "}
                            {new Date(sub.submitted_at).toLocaleString()}
                          </p>
                          {sub.graded_at && (
                            <span className="inline-flex items-center gap-1 text-xs text-green-600 font-medium mt-0.5">
                              <CheckCircle2 className="w-3 h-3" />
                              Graded
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Submitted files */}
                      {sub.file_urls.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-3">
                          {sub.file_urls.map((url, i) => (
                            <a
                              key={i}
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs text-[#1F4FD8] hover:bg-[#1F4FD8]/5 transition-colors"
                            >
                              <Download className="w-3 h-3" />
                              {decodeURIComponent(
                                url.split("/").pop() || `File ${i + 1}`
                              )}
                            </a>
                          ))}
                        </div>
                      )}

                      {sub.content && (
                        <p className="text-xs text-[#4D4D4D] bg-white p-2 rounded-lg border border-gray-100 mb-3">
                          {sub.content}
                        </p>
                      )}

                      {/* Grading form */}
                      <div className="grid grid-cols-2 gap-3 mt-3">
                        <div>
                          <label className="block text-xs font-medium text-[#1C1C28] mb-1">
                            Score (out of 100)
                          </label>
                          <input
                            type="number"
                            min={0}
                            max={100}
                            value={gradeInputs[sub.id]?.score || ""}
                            onChange={(e) =>
                              setGradeInputs((prev) => ({
                                ...prev,
                                [sub.id]: {
                                  ...prev[sub.id],
                                  score: e.target.value,
                                },
                              }))
                            }
                            placeholder="0-100"
                            className="w-full px-3 py-2 border border-[#D4D4D4] rounded-lg bg-white text-[#1C1C28] text-sm focus:outline-none focus:ring-2 focus:ring-[#1F4FD8] focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-[#1C1C28] mb-1">
                            Grade
                          </label>
                          <input
                            type="text"
                            value={gradeInputs[sub.id]?.grade || ""}
                            onChange={(e) =>
                              setGradeInputs((prev) => ({
                                ...prev,
                                [sub.id]: {
                                  ...prev[sub.id],
                                  grade: e.target.value,
                                },
                              }))
                            }
                            placeholder="e.g. A+, B-"
                            className="w-full px-3 py-2 border border-[#D4D4D4] rounded-lg bg-white text-[#1C1C28] text-sm focus:outline-none focus:ring-2 focus:ring-[#1F4FD8] focus:border-transparent"
                          />
                        </div>
                      </div>
                      <div className="mt-2">
                        <label className="block text-xs font-medium text-[#1C1C28] mb-1">
                          Feedback
                        </label>
                        <textarea
                          value={gradeInputs[sub.id]?.feedback || ""}
                          onChange={(e) =>
                            setGradeInputs((prev) => ({
                              ...prev,
                              [sub.id]: {
                                ...prev[sub.id],
                                feedback: e.target.value,
                              },
                            }))
                          }
                          rows={2}
                          placeholder="Write feedback for the student..."
                          className="w-full px-3 py-2 border border-[#D4D4D4] rounded-lg bg-white text-[#1C1C28] text-sm focus:outline-none focus:ring-2 focus:ring-[#1F4FD8] focus:border-transparent resize-none"
                        />
                      </div>
                      <button
                        onClick={() => handleSaveGrade(sub.id)}
                        disabled={savingGrade === sub.id}
                        className="mt-2 inline-flex items-center gap-2 px-4 py-2 bg-[#1F4FD8] text-white text-xs font-semibold rounded-lg hover:bg-[#1a45c2] disabled:opacity-60 transition-all"
                      >
                        {savingGrade === sub.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Save className="w-3.5 h-3.5" />
                        )}
                        {savingGrade === sub.id
                          ? "Saving..."
                          : "Save Assessment"}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
