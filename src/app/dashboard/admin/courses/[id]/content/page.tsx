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
  Video,
  Clock,
  FileText,
  GripVertical,
  X,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import toast, { Toaster } from "react-hot-toast";

interface CourseModule {
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

interface ModuleFormData {
  title: string;
  description: string;
}

interface LessonFormData {
  title: string;
  content: string;
  video_url: string;
  duration_minutes: string;
}

export default function AdminCourseContentPage() {
  const params = useParams();
  const courseId = params.id as string;
  const supabase = createClient() as any;

  const [courseTitle, setCourseTitle] = useState("");
  const [modules, setModules] = useState<CourseModule[]>([]);
  const [lessons, setLessons] = useState<Record<string, CourseLesson[]>>({});
  const [loading, setLoading] = useState(true);
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());

  // Module modal state
  const [showModuleModal, setShowModuleModal] = useState(false);
  const [editingModule, setEditingModule] = useState<CourseModule | null>(null);
  const [moduleForm, setModuleForm] = useState<ModuleFormData>({ title: "", description: "" });
  const [savingModule, setSavingModule] = useState(false);

  // Lesson modal state
  const [showLessonModal, setShowLessonModal] = useState(false);
  const [lessonModuleId, setLessonModuleId] = useState<string | null>(null);
  const [editingLesson, setEditingLesson] = useState<CourseLesson | null>(null);
  const [lessonForm, setLessonForm] = useState<LessonFormData>({
    title: "",
    content: "",
    video_url: "",
    duration_minutes: "",
  });
  const [savingLesson, setSavingLesson] = useState(false);

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState<{
    type: "module" | "lesson";
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

    // Fetch modules
    const { data: modulesData } = await supabase
      .from("course_modules")
      .select("*")
      .eq("course_id", courseId)
      .order("display_order", { ascending: true });

    const mods = (modulesData as CourseModule[]) || [];
    setModules(mods);

    // Fetch all lessons for these modules
    if (mods.length > 0) {
      const moduleIds = mods.map((m) => m.id);
      const { data: lessonsData } = await supabase
        .from("course_lessons")
        .select("*")
        .in("module_id", moduleIds)
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

  const toggleModule = (id: string) => {
    setExpandedModules((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // --- Module CRUD ---
  const openAddModule = () => {
    setEditingModule(null);
    setModuleForm({ title: "", description: "" });
    setShowModuleModal(true);
  };

  const openEditModule = (mod: CourseModule) => {
    setEditingModule(mod);
    setModuleForm({ title: mod.title, description: mod.description || "" });
    setShowModuleModal(true);
  };

  const saveModule = async () => {
    if (!moduleForm.title.trim()) {
      toast.error("Module title is required");
      return;
    }
    setSavingModule(true);

    if (editingModule) {
      const { error } = await supabase
        .from("course_modules")
        .update({
          title: moduleForm.title.trim(),
          description: moduleForm.description.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", editingModule.id);

      if (error) {
        toast.error("Failed to update module");
      } else {
        toast.success("Module updated");
      }
    } else {
      const maxOrder = modules.length > 0 ? Math.max(...modules.map((m) => m.display_order)) : 0;
      const { error } = await supabase.from("course_modules").insert({
        course_id: courseId,
        title: moduleForm.title.trim(),
        description: moduleForm.description.trim() || null,
        display_order: maxOrder + 1,
      });

      if (error) {
        toast.error("Failed to create module");
      } else {
        toast.success("Module created");
      }
    }

    setSavingModule(false);
    setShowModuleModal(false);
    fetchData();
  };

  const deleteModule = async (id: string) => {
    setDeleting(true);
    // Delete lessons first, then module
    await supabase.from("course_lessons").delete().eq("module_id", id);
    const { error } = await supabase.from("course_modules").delete().eq("id", id);
    if (error) {
      toast.error("Failed to delete module");
    } else {
      toast.success("Module deleted");
    }
    setDeleting(false);
    setDeleteTarget(null);
    fetchData();
  };

  // --- Lesson CRUD ---
  const openAddLesson = (moduleId: string) => {
    setEditingLesson(null);
    setLessonModuleId(moduleId);
    setLessonForm({ title: "", content: "", video_url: "", duration_minutes: "" });
    setShowLessonModal(true);
  };

  const openEditLesson = (lesson: CourseLesson) => {
    setEditingLesson(lesson);
    setLessonModuleId(lesson.module_id);
    setLessonForm({
      title: lesson.title,
      content: lesson.content || "",
      video_url: lesson.video_url || "",
      duration_minutes: lesson.duration_minutes?.toString() || "",
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
      video_url: lessonForm.video_url.trim() || null,
      duration_minutes: lessonForm.duration_minutes ? parseInt(lessonForm.duration_minutes) : null,
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
      const currentLessons = lessons[lessonModuleId!] || [];
      const maxOrder =
        currentLessons.length > 0 ? Math.max(...currentLessons.map((l) => l.display_order)) : 0;

      const { error } = await supabase.from("course_lessons").insert({
        ...payload,
        module_id: lessonModuleId,
        display_order: maxOrder + 1,
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
            <h1 className="text-2xl font-poppins font-bold text-[#1C1C28]">Course Content</h1>
            <p className="text-[#4D4D4D] text-sm mt-0.5">{courseTitle || "Loading..."}</p>
          </div>
        </div>
        <button
          onClick={openAddModule}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#1F4FD8] text-white font-poppins font-semibold text-sm rounded-xl hover:bg-[#1a45c2] transition-all shadow-md"
        >
          <Plus className="w-4 h-4" />
          Add Module
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-[#1F4FD8]/30 border-t-[#1F4FD8] rounded-full animate-spin" />
        </div>
      ) : modules.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <FileText className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-[#4D4D4D] font-medium">No modules yet</p>
          <p className="text-sm text-[#9CA3AF] mt-1">Add your first module to start building course content</p>
        </div>
      ) : (
        <div className="space-y-4">
          {modules.map((mod, modIdx) => {
            const modLessons = lessons[mod.id] || [];
            const isExpanded = expandedModules.has(mod.id);

            return (
              <div
                key={mod.id}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
              >
                {/* Module header */}
                <div
                  className="flex items-center gap-3 px-6 py-4 cursor-pointer hover:bg-gray-50/50 transition-colors"
                  onClick={() => toggleModule(mod.id)}
                >
                  <div className="text-[#9CA3AF]">
                    <GripVertical className="w-4 h-4" />
                  </div>
                  <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#1F4FD8]/10 text-[#1F4FD8] text-sm font-bold font-poppins">
                    {modIdx + 1}
                  </div>
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4 text-[#4D4D4D]" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-[#4D4D4D]" />
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-poppins font-semibold text-[#1C1C28] text-sm">{mod.title}</h3>
                    {mod.description && (
                      <p className="text-xs text-[#9CA3AF] mt-0.5 line-clamp-1">{mod.description}</p>
                    )}
                  </div>
                  <span className="text-xs text-[#9CA3AF] mr-2">
                    {modLessons.length} lesson{modLessons.length !== 1 ? "s" : ""}
                  </span>
                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => openEditModule(mod)}
                      className="p-2 text-[#4D4D4D] hover:text-[#1F4FD8] hover:bg-blue-50 rounded-lg transition-all"
                      title="Edit Module"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setDeleteTarget({ type: "module", id: mod.id, title: mod.title })}
                      className="p-2 text-[#4D4D4D] hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                      title="Delete Module"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Lessons list */}
                {isExpanded && (
                  <div className="border-t border-gray-100">
                    {modLessons.length === 0 ? (
                      <div className="px-6 py-6 text-center text-sm text-[#9CA3AF]">
                        No lessons in this module yet
                      </div>
                    ) : (
                      <div className="divide-y divide-gray-50">
                        {modLessons.map((lesson, lesIdx) => (
                          <div
                            key={lesson.id}
                            className="flex items-center gap-3 px-6 py-3 hover:bg-gray-50/50 transition-colors"
                          >
                            <div className="w-5 text-center text-xs text-[#9CA3AF] font-medium">
                              {lesIdx + 1}
                            </div>
                            <FileText className="w-4 h-4 text-[#9CA3AF] flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-[#1C1C28] font-medium truncate">{lesson.title}</p>
                            </div>
                            {lesson.video_url && (
                              <span className="flex items-center gap-1 text-xs text-[#1F4FD8] bg-[#1F4FD8]/10 px-2 py-0.5 rounded-full">
                                <Video className="w-3 h-3" /> Video
                              </span>
                            )}
                            {lesson.duration_minutes && (
                              <span className="flex items-center gap-1 text-xs text-[#9CA3AF]">
                                <Clock className="w-3 h-3" /> {lesson.duration_minutes} min
                              </span>
                            )}
                            <div className="flex items-center gap-1">
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
                        onClick={() => openAddLesson(mod.id)}
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

      {/* Module Modal */}
      {showModuleModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-poppins font-bold text-[#1C1C28]">
                {editingModule ? "Edit Module" : "Add Module"}
              </h3>
              <button
                onClick={() => setShowModuleModal(false)}
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
                  value={moduleForm.title}
                  onChange={(e) => setModuleForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="e.g. Introduction to the Course"
                  className="w-full px-4 py-2.5 border border-[#D4D4D4] rounded-xl bg-white text-[#1C1C28] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#1F4FD8] focus:border-transparent text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1C1C28] mb-1.5">Description</label>
                <textarea
                  value={moduleForm.description}
                  onChange={(e) => setModuleForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="Brief description of this module"
                  rows={3}
                  className="w-full px-4 py-2.5 border border-[#D4D4D4] rounded-xl bg-white text-[#1C1C28] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#1F4FD8] focus:border-transparent text-sm resize-none"
                />
              </div>
            </div>
            <div className="flex gap-3 justify-end mt-6">
              <button
                onClick={() => setShowModuleModal(false)}
                className="px-4 py-2 text-sm font-medium text-[#4D4D4D] bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={saveModule}
                disabled={savingModule}
                className="px-5 py-2 text-sm font-semibold text-white bg-[#1F4FD8] rounded-xl hover:bg-[#1a45c2] disabled:opacity-60 transition-colors"
              >
                {savingModule ? "Saving..." : editingModule ? "Update" : "Create"}
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
                  placeholder="e.g. What is HTML?"
                  className="w-full px-4 py-2.5 border border-[#D4D4D4] rounded-xl bg-white text-[#1C1C28] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#1F4FD8] focus:border-transparent text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1C1C28] mb-1.5">Content</label>
                <textarea
                  value={lessonForm.content}
                  onChange={(e) => setLessonForm((f) => ({ ...f, content: e.target.value }))}
                  placeholder="Lesson content or notes..."
                  rows={6}
                  className="w-full px-4 py-2.5 border border-[#D4D4D4] rounded-xl bg-white text-[#1C1C28] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#1F4FD8] focus:border-transparent text-sm resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1C1C28] mb-1.5">Video URL</label>
                <input
                  type="url"
                  value={lessonForm.video_url}
                  onChange={(e) => setLessonForm((f) => ({ ...f, video_url: e.target.value }))}
                  placeholder="https://youtube.com/watch?v=..."
                  className="w-full px-4 py-2.5 border border-[#D4D4D4] rounded-xl bg-white text-[#1C1C28] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#1F4FD8] focus:border-transparent text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1C1C28] mb-1.5">
                  Duration (minutes)
                </label>
                <input
                  type="number"
                  min="0"
                  value={lessonForm.duration_minutes}
                  onChange={(e) => setLessonForm((f) => ({ ...f, duration_minutes: e.target.value }))}
                  placeholder="e.g. 15"
                  className="w-full px-4 py-2.5 border border-[#D4D4D4] rounded-xl bg-white text-[#1C1C28] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#1F4FD8] focus:border-transparent text-sm"
                />
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
              Delete {deleteTarget.type === "module" ? "Module" : "Lesson"}?
            </h3>
            <p className="text-sm text-[#4D4D4D] mb-1">
              Are you sure you want to delete <strong>{deleteTarget.title}</strong>?
            </p>
            {deleteTarget.type === "module" && (
              <p className="text-sm text-red-500 mb-6">
                All lessons inside this module will also be deleted.
              </p>
            )}
            {deleteTarget.type === "lesson" && <div className="mb-6" />}
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 text-sm font-medium text-[#4D4D4D] bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() =>
                  deleteTarget.type === "module"
                    ? deleteModule(deleteTarget.id)
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
