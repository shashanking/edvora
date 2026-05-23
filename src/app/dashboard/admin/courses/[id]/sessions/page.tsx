"use client";

import React, { useEffect, useState, useCallback } from "react";
import { createClient } from "@/src/lib/supabase/client";
import {
  ArrowLeft,
  Plus,
  Edit2,
  Trash2,
  ChevronDown,
  ChevronRight,
  Clock,
  FileText,
  BookOpen,
  X,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import toast, { Toaster } from "react-hot-toast";

interface CourseSession {
  id: string;
  course_id: string;
  title: string;
  description: string | null;
  display_order: number;
  created_at: string;
}

interface CourseLesson {
  id: string;
  module_id: string;
  title: string;
  content: string | null;
  video_url: string | null;
  duration_minutes: number | null;
  display_order: number;
  created_at: string;
}

interface SessionFormData {
  title: string;
  description: string;
  display_order: string;
}

interface LessonFormData {
  title: string;
  content: string;
  duration_minutes: string;
  display_order: string;
}

export default function AdminCourseSessionsPage() {
  const params = useParams();
  const courseId = params.id as string;
  const supabase = createClient() as any;

  const [courseTitle, setCourseTitle] = useState("");
  const [sessions, setSessions] = useState<CourseSession[]>([]);
  const [lessons, setLessons] = useState<Record<string, CourseLesson[]>>({});
  const [loading, setLoading] = useState(true);
  const [expandedSessions, setExpandedSessions] = useState<Set<string>>(new Set());

  // Session modal state
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [editingSession, setEditingSession] = useState<CourseSession | null>(null);
  const [sessionForm, setSessionForm] = useState<SessionFormData>({
    title: "",
    description: "",
    display_order: "",
  });
  const [savingSession, setSavingSession] = useState(false);

  // Lesson modal state
  const [showLessonModal, setShowLessonModal] = useState(false);
  const [lessonSessionId, setLessonSessionId] = useState<string | null>(null);
  const [editingLesson, setEditingLesson] = useState<CourseLesson | null>(null);
  const [lessonForm, setLessonForm] = useState<LessonFormData>({
    title: "",
    content: "",
    duration_minutes: "",
    display_order: "",
  });
  const [savingLesson, setSavingLesson] = useState(false);

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState<{
    type: "session" | "lesson";
    id: string;
    title: string;
  } | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);

    // Fetch course title
    const { data: course } = await supabase
      .from("courses")
      .select("title")
      .eq("id", courseId)
      .single() as { data: { title: string } | null };
    if (course) setCourseTitle(course.title);

    // Fetch sessions (course_modules)
    const { data: sessionsData } = await supabase
      .from("course_modules")
      .select("*")
      .eq("course_id", courseId)
      .order("display_order", { ascending: true });

    const sess = (sessionsData as CourseSession[]) || [];
    setSessions(sess);

    // Fetch all lessons for these sessions
    if (sess.length > 0) {
      const sessionIds = sess.map((s) => s.id);
      const { data: lessonsData } = await supabase
        .from("course_lessons")
        .select("*")
        .in("module_id", sessionIds)
        .order("display_order", { ascending: true });

      const grouped: Record<string, CourseLesson[]> = {};
      for (const lesson of (lessonsData as CourseLesson[]) || []) {
        if (!grouped[lesson.module_id]) grouped[lesson.module_id] = [];
        grouped[lesson.module_id].push(lesson);
      }
      setLessons(grouped);
    } else {
      setLessons({});
    }

    setLoading(false);
  }, [courseId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const toggleSession = (id: string) => {
    setExpandedSessions((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // --- Session CRUD ---
  const openAddSession = () => {
    setEditingSession(null);
    const nextOrder =
      sessions.length > 0 ? Math.max(...sessions.map((s) => s.display_order)) + 1 : 1;
    setSessionForm({ title: "", description: "", display_order: nextOrder.toString() });
    setShowSessionModal(true);
  };

  const openEditSession = (sess: CourseSession) => {
    setEditingSession(sess);
    setSessionForm({
      title: sess.title,
      description: sess.description || "",
      display_order: sess.display_order.toString(),
    });
    setShowSessionModal(true);
  };

  const saveSession = async () => {
    if (!sessionForm.title.trim()) {
      toast.error("Session title is required");
      return;
    }
    setSavingSession(true);

    const orderValue = parseInt(sessionForm.display_order) || 1;

    if (editingSession) {
      const { error } = await supabase
        .from("course_modules")
        .update({
          title: sessionForm.title.trim(),
          description: sessionForm.description.trim() || null,
          display_order: orderValue,
          updated_at: new Date().toISOString(),
        })
        .eq("id", editingSession.id);

      if (error) {
        toast.error("Failed to update session");
      } else {
        toast.success("Session updated");
      }
    } else {
      const { error } = await supabase.from("course_modules").insert({
        course_id: courseId,
        title: sessionForm.title.trim(),
        description: sessionForm.description.trim() || null,
        display_order: orderValue,
      });

      if (error) {
        toast.error("Failed to create session");
      } else {
        toast.success("Session created");
      }
    }

    setSavingSession(false);
    setShowSessionModal(false);
    fetchData();
  };

  const deleteSession = async (id: string) => {
    setDeleting(true);
    await supabase.from("course_lessons").delete().eq("module_id", id);
    const { error } = await supabase.from("course_modules").delete().eq("id", id);
    if (error) {
      toast.error("Failed to delete session");
    } else {
      toast.success("Session deleted");
    }
    setDeleting(false);
    setDeleteTarget(null);
    fetchData();
  };

  // --- Lesson CRUD ---
  const openAddLesson = (sessionId: string) => {
    setEditingLesson(null);
    setLessonSessionId(sessionId);
    const currentLessons = lessons[sessionId] || [];
    const nextOrder =
      currentLessons.length > 0 ? Math.max(...currentLessons.map((l) => l.display_order)) + 1 : 1;
    setLessonForm({ title: "", content: "", duration_minutes: "", display_order: nextOrder.toString() });
    setShowLessonModal(true);
  };

  const openEditLesson = (lesson: CourseLesson) => {
    setEditingLesson(lesson);
    setLessonSessionId(lesson.module_id);
    setLessonForm({
      title: lesson.title,
      content: lesson.content || "",
      duration_minutes: lesson.duration_minutes?.toString() || "",
      display_order: lesson.display_order.toString(),
    });
    setShowLessonModal(true);
  };

  const saveLesson = async () => {
    if (!lessonForm.title.trim()) {
      toast.error("Lesson title is required");
      return;
    }
    setSavingLesson(true);

    const payload = {
      title: lessonForm.title.trim(),
      content: lessonForm.content.trim() || null,
      duration_minutes: lessonForm.duration_minutes ? parseInt(lessonForm.duration_minutes) : null,
      display_order: parseInt(lessonForm.display_order) || 1,
    };

    if (editingLesson) {
      const { error } = await supabase
        .from("course_lessons")
        .update({ ...payload, updated_at: new Date().toISOString() })
        .eq("id", editingLesson.id);

      if (error) {
        toast.error("Failed to update lesson");
      } else {
        toast.success("Lesson updated");
      }
    } else {
      const { error } = await supabase.from("course_lessons").insert({
        ...payload,
        module_id: lessonSessionId,
      });

      if (error) {
        toast.error("Failed to create lesson");
      } else {
        toast.success("Lesson created");
      }
    }

    setSavingLesson(false);
    setShowLessonModal(false);
    fetchData();
  };

  const deleteLesson = async (id: string) => {
    setDeleting(true);
    const { error } = await supabase.from("course_lessons").delete().eq("id", id);
    if (error) {
      toast.error("Failed to delete lesson");
    } else {
      toast.success("Lesson deleted");
    }
    setDeleting(false);
    setDeleteTarget(null);
    fetchData();
  };

  return (
    <div className="space-y-6">
      <Toaster position="top-right" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/admin/courses"
            className="p-2 text-[#4D4D4D] hover:text-[#1F4FD8] hover:bg-blue-50 rounded-xl transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-poppins font-bold text-[#1C1C28]">Sessions &amp; Lessons</h1>
            <p className="text-[#4D4D4D] text-sm mt-0.5">{courseTitle || "Loading..."}</p>
          </div>
        </div>
        <button
          onClick={openAddSession}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#1F4FD8] text-white font-poppins font-semibold text-sm rounded-xl hover:bg-[#1a45c2] transition-all shadow-md"
        >
          <Plus className="w-4 h-4" />
          Add Session
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-[#1F4FD8]/30 border-t-[#1F4FD8] rounded-full animate-spin" />
        </div>
      ) : sessions.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <BookOpen className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-[#4D4D4D] font-medium">No sessions yet</p>
          <p className="text-sm text-[#9CA3AF] mt-1">Add your first session to start structuring the course curriculum</p>
          <button
            onClick={openAddSession}
            className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 bg-[#1F4FD8] text-white font-poppins font-semibold text-sm rounded-xl hover:bg-[#1a45c2] transition-all"
          >
            <Plus className="w-4 h-4" />
            Add Session
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {sessions.map((sess) => {
            const sessLessons = lessons[sess.id] || [];
            const isExpanded = expandedSessions.has(sess.id);

            return (
              <div
                key={sess.id}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
              >
                {/* Session header */}
                <div
                  className="flex items-center gap-3 px-6 py-4 cursor-pointer hover:bg-gray-50/50 transition-colors"
                  onClick={() => toggleSession(sess.id)}
                >
                  <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#1F4FD8]/10 text-[#1F4FD8] text-sm font-bold font-poppins flex-shrink-0">
                    {sess.display_order}
                  </div>
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4 text-[#4D4D4D] flex-shrink-0" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-[#4D4D4D] flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-poppins font-semibold text-[#1C1C28] text-sm">{sess.title}</h3>
                    {sess.description && (
                      <p className="text-xs text-[#9CA3AF] mt-0.5 line-clamp-1">{sess.description}</p>
                    )}
                  </div>
                  <span className="text-xs text-[#9CA3AF] mr-2 flex-shrink-0">
                    {sessLessons.length} lesson{sessLessons.length !== 1 ? "s" : ""}
                  </span>
                  <div className="flex items-center gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => openEditSession(sess)}
                      className="p-2 text-[#4D4D4D] hover:text-[#1F4FD8] hover:bg-blue-50 rounded-lg transition-all"
                      title="Edit Session"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setDeleteTarget({ type: "session", id: sess.id, title: sess.title })}
                      className="p-2 text-[#4D4D4D] hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                      title="Delete Session"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Lessons list */}
                {isExpanded && (
                  <div className="border-t border-gray-100">
                    {sessLessons.length === 0 ? (
                      <div className="px-6 py-6 text-center text-sm text-[#9CA3AF]">
                        No lessons in this session yet
                      </div>
                    ) : (
                      <div className="divide-y divide-gray-50">
                        {sessLessons.map((lesson) => (
                          <div
                            key={lesson.id}
                            className="flex items-center gap-3 px-6 py-3 hover:bg-gray-50/50 transition-colors"
                          >
                            <div className="w-6 h-6 flex items-center justify-center rounded-md bg-gray-100 text-xs text-[#9CA3AF] font-medium flex-shrink-0">
                              {lesson.display_order}
                            </div>
                            <FileText className="w-4 h-4 text-[#9CA3AF] flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-[#1C1C28] font-medium truncate">{lesson.title}</p>
                              {lesson.content && (
                                <p className="text-xs text-[#9CA3AF] mt-0.5 line-clamp-1">{lesson.content}</p>
                              )}
                            </div>
                            {lesson.duration_minutes != null && (
                              <span className="flex items-center gap-1 text-xs text-[#9CA3AF] flex-shrink-0">
                                <Clock className="w-3 h-3" /> {lesson.duration_minutes} min
                              </span>
                            )}
                            <div className="flex items-center gap-1 flex-shrink-0">
                              <button
                                onClick={() => openEditLesson(lesson)}
                                className="p-1.5 text-[#4D4D4D] hover:text-[#1F4FD8] hover:bg-blue-50 rounded-lg transition-all"
                                title="Edit Lesson"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() =>
                                  setDeleteTarget({ type: "lesson", id: lesson.id, title: lesson.title })
                                }
                                className="p-1.5 text-[#4D4D4D] hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                title="Delete Lesson"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Add Lesson button */}
                    <div className="px-6 py-3 border-t border-gray-100">
                      <button
                        onClick={() => openAddLesson(sess.id)}
                        className="inline-flex items-center gap-1.5 text-sm text-[#1F4FD8] hover:text-[#1a45c2] font-medium transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                        Add Lesson
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Session Modal */}
      {showSessionModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-poppins font-bold text-[#1C1C28]">
                {editingSession ? "Edit Session" : "Add Session"}
              </h3>
              <button
                onClick={() => setShowSessionModal(false)}
                className="p-1.5 text-[#9CA3AF] hover:text-[#4D4D4D] hover:bg-gray-100 rounded-lg transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#1C1C28] mb-1.5">Title *</label>
                <input
                  type="text"
                  value={sessionForm.title}
                  onChange={(e) => setSessionForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="e.g. Introduction to the Course"
                  className="w-full px-4 py-2.5 border border-[#D4D4D4] rounded-xl bg-white text-[#1C1C28] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#1F4FD8] focus:border-transparent text-sm"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1C1C28] mb-1.5">Description</label>
                <textarea
                  value={sessionForm.description}
                  onChange={(e) => setSessionForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="Brief description of this session"
                  rows={3}
                  className="w-full px-4 py-2.5 border border-[#D4D4D4] rounded-xl bg-white text-[#1C1C28] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#1F4FD8] focus:border-transparent text-sm resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1C1C28] mb-1.5">Display Order</label>
                <input
                  type="number"
                  min="1"
                  value={sessionForm.display_order}
                  onChange={(e) => setSessionForm((f) => ({ ...f, display_order: e.target.value }))}
                  placeholder="e.g. 1"
                  className="w-full px-4 py-2.5 border border-[#D4D4D4] rounded-xl bg-white text-[#1C1C28] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#1F4FD8] focus:border-transparent text-sm"
                />
              </div>
            </div>
            <div className="flex gap-3 justify-end mt-6">
              <button
                onClick={() => setShowSessionModal(false)}
                className="px-4 py-2 text-sm font-medium text-[#4D4D4D] bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={saveSession}
                disabled={savingSession}
                className="px-5 py-2 text-sm font-semibold text-white bg-[#1F4FD8] rounded-xl hover:bg-[#1a45c2] disabled:opacity-60 transition-colors"
              >
                {savingSession ? "Saving..." : editingSession ? "Update" : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lesson Modal */}
      {showLessonModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-poppins font-bold text-[#1C1C28]">
                {editingLesson ? "Edit Lesson" : "Add Lesson"}
              </h3>
              <button
                onClick={() => setShowLessonModal(false)}
                className="p-1.5 text-[#9CA3AF] hover:text-[#4D4D4D] hover:bg-gray-100 rounded-lg transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#1C1C28] mb-1.5">Title *</label>
                <input
                  type="text"
                  value={lessonForm.title}
                  onChange={(e) => setLessonForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="e.g. What is this session about?"
                  className="w-full px-4 py-2.5 border border-[#D4D4D4] rounded-xl bg-white text-[#1C1C28] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#1F4FD8] focus:border-transparent text-sm"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1C1C28] mb-1.5">Content</label>
                <textarea
                  value={lessonForm.content}
                  onChange={(e) => setLessonForm((f) => ({ ...f, content: e.target.value }))}
                  placeholder="Lesson content or notes..."
                  rows={5}
                  className="w-full px-4 py-2.5 border border-[#D4D4D4] rounded-xl bg-white text-[#1C1C28] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#1F4FD8] focus:border-transparent text-sm resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#1C1C28] mb-1.5">
                    Duration (minutes)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={lessonForm.duration_minutes}
                    onChange={(e) => setLessonForm((f) => ({ ...f, duration_minutes: e.target.value }))}
                    placeholder="e.g. 45"
                    className="w-full px-4 py-2.5 border border-[#D4D4D4] rounded-xl bg-white text-[#1C1C28] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#1F4FD8] focus:border-transparent text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#1C1C28] mb-1.5">Display Order</label>
                  <input
                    type="number"
                    min="1"
                    value={lessonForm.display_order}
                    onChange={(e) => setLessonForm((f) => ({ ...f, display_order: e.target.value }))}
                    placeholder="e.g. 1"
                    className="w-full px-4 py-2.5 border border-[#D4D4D4] rounded-xl bg-white text-[#1C1C28] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#1F4FD8] focus:border-transparent text-sm"
                  />
                </div>
              </div>
            </div>
            <div className="flex gap-3 justify-end mt-6">
              <button
                onClick={() => setShowLessonModal(false)}
                className="px-4 py-2 text-sm font-medium text-[#4D4D4D] bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={saveLesson}
                disabled={savingLesson}
                className="px-5 py-2 text-sm font-semibold text-white bg-[#1F4FD8] rounded-xl hover:bg-[#1a45c2] disabled:opacity-60 transition-colors"
              >
                {savingLesson ? "Saving..." : editingLesson ? "Update" : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <h3 className="text-lg font-poppins font-bold text-[#1C1C28] mb-2">
              Delete {deleteTarget.type === "session" ? "Session" : "Lesson"}?
            </h3>
            <p className="text-sm text-[#4D4D4D] mb-2">
              Are you sure you want to delete <strong>{deleteTarget.title}</strong>?
            </p>
            {deleteTarget.type === "session" ? (
              <p className="text-sm text-red-500 mb-6">
                All lessons inside this session will also be permanently deleted.
              </p>
            ) : (
              <div className="mb-6" />
            )}
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 text-sm font-medium text-[#4D4D4D] bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() =>
                  deleteTarget.type === "session"
                    ? deleteSession(deleteTarget.id)
                    : deleteLesson(deleteTarget.id)
                }
                disabled={deleting}
                className="px-4 py-2 text-sm font-medium text-white bg-red-500 rounded-xl hover:bg-red-600 disabled:opacity-60 transition-colors"
              >
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
