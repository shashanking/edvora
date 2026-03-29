"use client";

import React, { useEffect, useState, useCallback } from "react";
import { createClient } from "@/src/lib/supabase/client";
import {
  ArrowLeft,
  BookOpen,
  ChevronDown,
  ChevronRight,
  Clock,
  Video,
  CheckCircle2,
  Circle,
  Play,
  FileText,
  TrendingUp,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import toast, { Toaster } from "react-hot-toast";

interface CourseInfo {
  id: string;
  title: string;
  description: string;
  thumbnail_url: string | null;
}

interface Module {
  id: string;
  title: string;
  description: string | null;
  display_order: number;
}

interface Lesson {
  id: string;
  module_id: string;
  title: string;
  content: string | null;
  video_url: string | null;
  duration_minutes: number | null;
  display_order: number;
}

interface ProgressRecord {
  lesson_id: string;
  completed: boolean;
}

export default function StudentCourseDetailPage() {
  const params = useParams();
  const courseId = params.id as string;
  const supabase = createClient() as any;

  const [user, setUser] = useState<any>(null);
  const [course, setCourse] = useState<CourseInfo | null>(null);
  const [enrolled, setEnrolled] = useState<boolean | null>(null);
  const [enrollmentId, setEnrollmentId] = useState<string | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [lessons, setLessons] = useState<Record<string, Lesson[]>>({});
  const [progress, setProgress] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  const [togglingProgress, setTogglingProgress] = useState<Set<string>>(new Set());

  const totalLessons = Object.values(lessons).reduce((sum, arr) => sum + arr.length, 0);
  const completedLessons = Object.values(progress).filter(Boolean).length;
  const progressPercent = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

  const fetchData = useCallback(async () => {
    setLoading(true);

    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      setLoading(false);
      return;
    }
    setUser(userData.user);

    // Fetch course info
    const { data: courseData } = await supabase
      .from("courses")
      .select("id, title, description, thumbnail_url")
      .eq("id", courseId)
      .single();
    if (courseData) setCourse(courseData as CourseInfo);

    // Check enrollment
    const { data: enrollmentData } = await supabase
      .from("enrollments")
      .select("id, status")
      .eq("student_id", userData.user.id)
      .eq("course_id", courseId)
      .eq("status", "active")
      .single();

    if (!enrollmentData) {
      setEnrolled(false);
      setLoading(false);
      return;
    }
    setEnrolled(true);
    setEnrollmentId(enrollmentData.id);

    // Fetch modules
    const { data: modulesData } = await supabase
      .from("course_modules")
      .select("*")
      .eq("course_id", courseId)
      .order("display_order", { ascending: true });

    const mods = (modulesData as Module[]) || [];
    setModules(mods);

    // Expand first module by default
    if (mods.length > 0) {
      setExpandedModules(new Set([mods[0].id]));
    }

    // Fetch lessons
    if (mods.length > 0) {
      const moduleIds = mods.map((m) => m.id);
      const { data: lessonsData } = await supabase
        .from("course_lessons")
        .select("*")
        .in("module_id", moduleIds)
        .order("display_order", { ascending: true });

      const grouped: Record<string, Lesson[]> = {};
      const allLessons = (lessonsData as Lesson[]) || [];
      for (const lesson of allLessons) {
        if (!grouped[lesson.module_id]) grouped[lesson.module_id] = [];
        grouped[lesson.module_id].push(lesson);
      }
      setLessons(grouped);

      // Fetch progress
      if (allLessons.length > 0) {
        const lessonIds = allLessons.map((l) => l.id);
        const { data: progressData } = await supabase
          .from("lesson_progress")
          .select("lesson_id, completed")
          .eq("student_id", userData.user.id)
          .in("lesson_id", lessonIds);

        const progressMap: Record<string, boolean> = {};
        for (const p of (progressData as ProgressRecord[]) || []) {
          progressMap[p.lesson_id] = p.completed;
        }
        setProgress(progressMap);
      }
    }

    setLoading(false);
  }, [courseId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Update enrollment progress whenever progress changes
  useEffect(() => {
    if (!enrollmentId || totalLessons === 0) return;
    const updateEnrollmentProgress = async () => {
      await supabase
        .from("enrollments")
        .update({ progress: progressPercent })
        .eq("id", enrollmentId);
    };
    updateEnrollmentProgress();
  }, [progressPercent, enrollmentId, totalLessons]);

  const toggleModule = (id: string) => {
    setExpandedModules((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleLessonCompletion = async (lessonId: string) => {
    if (!user) return;
    setTogglingProgress((prev) => new Set(prev).add(lessonId));

    const isCurrentlyCompleted = progress[lessonId] || false;
    const newCompleted = !isCurrentlyCompleted;

    // Optimistic update
    setProgress((prev) => ({ ...prev, [lessonId]: newCompleted }));

    // Check if record exists
    const { data: existing } = await supabase
      .from("lesson_progress")
      .select("id")
      .eq("student_id", user.id)
      .eq("lesson_id", lessonId)
      .single();

    if (existing) {
      const { error } = await supabase
        .from("lesson_progress")
        .update({
          completed: newCompleted,
          completed_at: newCompleted ? new Date().toISOString() : null,
        })
        .eq("id", existing.id);

      if (error) {
        // Revert on error
        setProgress((prev) => ({ ...prev, [lessonId]: isCurrentlyCompleted }));
        toast.error("Failed to update progress");
      }
    } else {
      const { error } = await supabase.from("lesson_progress").insert({
        student_id: user.id,
        lesson_id: lessonId,
        completed: newCompleted,
        completed_at: newCompleted ? new Date().toISOString() : null,
      });

      if (error) {
        setProgress((prev) => ({ ...prev, [lessonId]: isCurrentlyCompleted }));
        toast.error("Failed to update progress");
      }
    }

    setTogglingProgress((prev) => {
      const next = new Set(prev);
      next.delete(lessonId);
      return next;
    });
  };

  const getEmbedUrl = (url: string): string | null => {
    try {
      // YouTube
      const ytMatch = url.match(
        /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
      );
      if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`;

      // Vimeo
      const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
      if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`;

      // Already an embed URL or other
      return url;
    } catch {
      return url;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-[#1F4FD8]/30 border-t-[#1F4FD8] rounded-full animate-spin" />
      </div>
    );
  }

  if (enrolled === false) {
    return (
      <div className="space-y-6">
        <Toaster position="top-right" />
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
          <div className="w-16 h-16 mx-auto mb-4 bg-amber-50 rounded-full flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-amber-500" />
          </div>
          <h2 className="text-lg font-poppins font-bold text-[#1C1C28] mb-2">Not Enrolled</h2>
          <p className="text-sm text-[#4D4D4D] mb-6 max-w-md mx-auto">
            You are not enrolled in this course. Browse the catalog to find and enroll in courses.
          </p>
          <Link
            href="/dashboard/student/catalog"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#1F4FD8] text-white font-poppins font-semibold text-sm rounded-xl hover:bg-[#1a45c2] transition-all shadow-md"
          >
            <BookOpen className="w-4 h-4" />
            Browse Catalog
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Toaster position="top-right" />

      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/student/courses"
          className="p-2 text-[#4D4D4D] hover:text-[#1F4FD8] hover:bg-blue-50 rounded-xl transition-all"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-poppins font-bold text-[#1C1C28] truncate">
            {course?.title || "Course"}
          </h1>
          {course?.description && (
            <p className="text-[#4D4D4D] text-sm mt-0.5 line-clamp-1">{course.description}</p>
          )}
        </div>
      </div>

      {/* Progress Bar Card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[#1F4FD8]" />
            <span className="text-sm font-medium text-[#1C1C28]">Course Progress</span>
          </div>
          <span className="text-sm font-bold text-[#1F4FD8]">{progressPercent}%</span>
        </div>
        <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#1F4FD8] to-[#3B6FF0] rounded-full transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <p className="text-xs text-[#9CA3AF] mt-2">
          {completedLessons} of {totalLessons} lessons completed
        </p>
      </div>

      {/* Two-column layout on larger screens */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sidebar - Module/Lesson list */}
        <div className="lg:col-span-1 space-y-3">
          {modules.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
              <FileText className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-[#9CA3AF]">No content available yet</p>
            </div>
          ) : (
            modules.map((mod, modIdx) => {
              const modLessons = lessons[mod.id] || [];
              const isExpanded = expandedModules.has(mod.id);
              const modCompleted = modLessons.filter((l) => progress[l.id]).length;

              return (
                <div
                  key={mod.id}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
                >
                  <button
                    onClick={() => toggleModule(mod.id)}
                    className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-gray-50/50 transition-colors"
                  >
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4 text-[#4D4D4D] flex-shrink-0" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-[#4D4D4D] flex-shrink-0" />
                    )}
                    <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-[#1F4FD8]/10 text-[#1F4FD8] text-xs font-bold font-poppins flex-shrink-0">
                      {modIdx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-poppins font-semibold text-[#1C1C28] text-sm truncate">
                        {mod.title}
                      </h3>
                      <p className="text-xs text-[#9CA3AF] mt-0.5">
                        {modCompleted}/{modLessons.length} lessons
                      </p>
                    </div>
                  </button>

                  {isExpanded && modLessons.length > 0 && (
                    <div className="border-t border-gray-100 divide-y divide-gray-50">
                      {modLessons.map((lesson) => {
                        const isCompleted = progress[lesson.id] || false;
                        const isActive = activeLesson?.id === lesson.id;

                        return (
                          <div
                            key={lesson.id}
                            className={`flex items-center gap-2.5 px-4 py-2.5 cursor-pointer transition-colors ${
                              isActive
                                ? "bg-[#1F4FD8]/5 border-l-2 border-l-[#1F4FD8]"
                                : "hover:bg-gray-50/50"
                            }`}
                          >
                            <button
                              onClick={() => toggleLessonCompletion(lesson.id)}
                              disabled={togglingProgress.has(lesson.id)}
                              className="flex-shrink-0 transition-colors"
                            >
                              {isCompleted ? (
                                <CheckCircle2 className="w-5 h-5 text-green-500" />
                              ) : (
                                <Circle className="w-5 h-5 text-[#D4D4D4] hover:text-[#1F4FD8]" />
                              )}
                            </button>
                            <button
                              onClick={() => setActiveLesson(lesson)}
                              className="flex-1 min-w-0 text-left"
                            >
                              <p
                                className={`text-sm truncate ${
                                  isCompleted
                                    ? "text-[#9CA3AF] line-through"
                                    : "text-[#1C1C28] font-medium"
                                }`}
                              >
                                {lesson.title}
                              </p>
                              <div className="flex items-center gap-2 mt-0.5">
                                {lesson.duration_minutes && (
                                  <span className="flex items-center gap-0.5 text-xs text-[#9CA3AF]">
                                    <Clock className="w-3 h-3" /> {lesson.duration_minutes}m
                                  </span>
                                )}
                                {lesson.video_url && (
                                  <span className="flex items-center gap-0.5 text-xs text-[#1F4FD8]">
                                    <Video className="w-3 h-3" /> Video
                                  </span>
                                )}
                              </div>
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Main Content Area */}
        <div className="lg:col-span-2">
          {activeLesson ? (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              {/* Video embed */}
              {activeLesson.video_url && (
                <div className="aspect-video bg-black">
                  <iframe
                    src={getEmbedUrl(activeLesson.video_url) || ""}
                    title={activeLesson.title}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              )}

              {/* Lesson info */}
              <div className="p-6">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <h2 className="text-xl font-poppins font-bold text-[#1C1C28]">
                    {activeLesson.title}
                  </h2>
                  <button
                    onClick={() => toggleLessonCompletion(activeLesson.id)}
                    disabled={togglingProgress.has(activeLesson.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium transition-all flex-shrink-0 ${
                      progress[activeLesson.id]
                        ? "bg-green-50 text-green-600 hover:bg-green-100"
                        : "bg-gray-100 text-[#4D4D4D] hover:bg-[#1F4FD8]/10 hover:text-[#1F4FD8]"
                    }`}
                  >
                    {progress[activeLesson.id] ? (
                      <>
                        <CheckCircle2 className="w-4 h-4" /> Completed
                      </>
                    ) : (
                      <>
                        <Circle className="w-4 h-4" /> Mark Complete
                      </>
                    )}
                  </button>
                </div>

                {activeLesson.duration_minutes && (
                  <div className="flex items-center gap-1.5 text-sm text-[#9CA3AF] mb-4">
                    <Clock className="w-4 h-4" />
                    {activeLesson.duration_minutes} minutes
                  </div>
                )}

                {activeLesson.content && (
                  <div className="prose prose-sm max-w-none text-[#4D4D4D] leading-relaxed whitespace-pre-wrap">
                    {activeLesson.content}
                  </div>
                )}

                {!activeLesson.content && !activeLesson.video_url && (
                  <p className="text-sm text-[#9CA3AF] italic">No content available for this lesson.</p>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex items-center justify-center py-20">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-[#1F4FD8]/5 rounded-full flex items-center justify-center">
                  <Play className="w-8 h-8 text-[#1F4FD8]/40 ml-1" />
                </div>
                <p className="text-[#4D4D4D] font-medium font-poppins">Select a lesson to begin</p>
                <p className="text-sm text-[#9CA3AF] mt-1">
                  Choose a lesson from the sidebar to view its content
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
