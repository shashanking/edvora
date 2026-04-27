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
  Calendar,
  ClipboardList,
  MessageSquare,
  FolderOpen,
  ExternalLink,
  Eye,
  Star,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import toast, { Toaster } from "react-hot-toast";
import MaterialViewer from "@/src/components/shared/MaterialViewer";

type Tab = "lessons" | "sessions" | "assignments" | "remarks" | "materials";

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

interface Session {
  id: string;
  title: string;
  scheduled_at: string;
  duration_minutes: number;
  status: string;
  zoom_join_url: string | null;
  recording_url: string | null;
}

interface AssignmentData {
  id: string;
  title: string;
  description: string;
  type: string;
  due_date: string | null;
  file_urls: any[];
  created_at: string;
  submission?: {
    id: string;
    content: string | null;
    file_urls: any[];
    grade: string | null;
    feedback: string | null;
    submitted_at: string;
    graded_at: string | null;
  } | null;
}

interface RemarkData {
  id: string;
  content: string;
  type: string;
  created_at: string;
  teacher: { full_name: string; avatar_url: string | null } | null;
}

interface MaterialData {
  id: string;
  title: string;
  description: string | null;
  file_url: string;
  file_type: string | null;
  created_at: string;
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
  const [activeTab, setActiveTab] = useState<Tab>("lessons");

  // Session data
  const [sessions, setSessions] = useState<Session[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);

  // Assignment data
  const [assignments, setAssignments] = useState<AssignmentData[]>([]);
  const [assignmentsLoading, setAssignmentsLoading] = useState(false);

  // Remarks data
  const [remarks, setRemarks] = useState<RemarkData[]>([]);
  const [remarksLoading, setRemarksLoading] = useState(false);

  // Materials data
  const [materials, setMaterials] = useState<MaterialData[]>([]);
  const [materialsLoading, setMaterialsLoading] = useState(false);
  const [viewingMaterial, setViewingMaterial] = useState<MaterialData | null>(null);

  const totalLessons = Object.values(lessons).reduce((sum, arr) => sum + arr.length, 0);
  const completedLessons = Object.values(progress).filter(Boolean).length;
  const progressPercent = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

  const now = new Date();

  // Helper: session end time has passed
  const isSessionOver = (s: Session) =>
    new Date(s.scheduled_at).getTime() + s.duration_minutes * 60 * 1000 <= now.getTime();

  // Only truly upcoming sessions (time hasn't passed)
  const isUpcoming = (s: Session) =>
    (s.status === "scheduled" || s.status === "live") && !isSessionOver(s);

  // Only the very next upcoming session
  const nextSession = sessions
    .filter((s) => isUpcoming(s))
    .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime())[0] || null;

  // Past = completed, cancelled, or time has passed
  const pastSessions = sessions.filter(
    (s) => s.status === "completed" || s.status === "cancelled" || isSessionOver(s)
  );

  const upcomingAssignments = assignments.filter(
    (a) => a.due_date && new Date(a.due_date) >= now && !a.submission
  );
  const pastAssignments = assignments.filter(
    (a) => a.submission || (a.due_date && new Date(a.due_date) < now) || !a.due_date
  );

  // Auto-complete sessions on load
  const autoCompleteSessions = useCallback(async () => {
    try {
      await fetch("/api/sessions/auto-complete", { method: "POST" });
    } catch {}
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);

    await autoCompleteSessions();

    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      setLoading(false);
      return;
    }
    setUser(userData.user);

    const { data: courseData } = await supabase
      .from("courses")
      .select("id, title, description, thumbnail_url")
      .eq("id", courseId)
      .single();
    if (courseData) setCourse(courseData as CourseInfo);

    const { data: enrollmentData } = await supabase
      .from("enrollments")
      .select("id, status")
      .eq("student_id", userData.user.id)
      .eq("course_id", courseId)
      .in("status", ["active", "completed"])
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
    if (mods.length > 0) setExpandedModules(new Set([mods[0].id]));

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

  // Fetch sessions
  const fetchSessions = useCallback(async () => {
    if (!user) return;
    setSessionsLoading(true);
    const { data } = await supabase
      .from("live_sessions")
      .select("id, title, scheduled_at, duration_minutes, status, zoom_join_url, recording_url")
      .eq("course_id", courseId)
      .order("scheduled_at", { ascending: false });
    setSessions((data as Session[]) || []);
    setSessionsLoading(false);
  }, [courseId, user]);

  // Fetch assignments
  const fetchAssignments = useCallback(async () => {
    if (!user) return;
    setAssignmentsLoading(true);
    const { data: assignData } = await supabase
      .from("assignments")
      .select("id, title, description, type, due_date, file_urls, created_at")
      .eq("course_id", courseId)
      .order("created_at", { ascending: false });

    const assignList = (assignData as any[]) || [];
    if (assignList.length > 0) {
      const assignmentIds = assignList.map((a) => a.id);
      const { data: subData } = await supabase
        .from("assignment_submissions")
        .select("id, assignment_id, content, file_urls, grade, feedback, submitted_at, graded_at")
        .eq("student_id", user.id)
        .in("assignment_id", assignmentIds);

      const subMap = new Map<string, any>();
      for (const s of (subData as any[]) || []) {
        subMap.set(s.assignment_id, s);
      }

      setAssignments(
        assignList.map((a) => ({ ...a, submission: subMap.get(a.id) || null }))
      );
    } else {
      setAssignments([]);
    }
    setAssignmentsLoading(false);
  }, [courseId, user]);

  // Fetch remarks
  const fetchRemarks = useCallback(async () => {
    if (!user) return;
    setRemarksLoading(true);
    const { data } = await supabase
      .from("remarks")
      .select("id, content, type, created_at, teacher_id")
      .eq("course_id", courseId)
      .eq("student_id", user.id)
      .order("created_at", { ascending: false });

    const remarksList = (data as any[]) || [];
    if (remarksList.length > 0) {
      const teacherIds = [...new Set(remarksList.map((r: any) => r.teacher_id))];
      const { data: teachers } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url")
        .in("id", teacherIds);

      const teacherMap = new Map<string, any>();
      for (const t of (teachers as any[]) || []) {
        teacherMap.set(t.id, t);
      }

      setRemarks(
        remarksList.map((r: any) => ({
          ...r,
          teacher: teacherMap.get(r.teacher_id) || null,
        }))
      );
    } else {
      setRemarks([]);
    }
    setRemarksLoading(false);
  }, [courseId, user]);

  // Fetch materials
  const fetchMaterials = useCallback(async () => {
    setMaterialsLoading(true);
    const { data: cm } = await supabase
      .from("course_materials")
      .select("id, title, description, file_url, file_type, created_at")
      .eq("course_id", courseId)
      .order("created_at", { ascending: false });

    const { data: lm } = await supabase
      .from("learning_materials")
      .select("id, title, description, file_url, file_type, created_at")
      .eq("course_id", courseId)
      .order("created_at", { ascending: false });

    setMaterials([...((cm as MaterialData[]) || []), ...((lm as MaterialData[]) || [])]);
    setMaterialsLoading(false);
  }, [courseId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Fetch tab data when tab changes or user is loaded
  useEffect(() => {
    if (!user) return;
    if (activeTab === "sessions") fetchSessions();
    if (activeTab === "assignments") fetchAssignments();
    if (activeTab === "remarks") fetchRemarks();
    if (activeTab === "materials") fetchMaterials();
  }, [activeTab, user]);

  useEffect(() => {
    if (!enrollmentId || totalLessons === 0) return;
    const updateEnrollmentProgress = async () => {
      const updateData: Record<string, any> = { progress: progressPercent };
      if (progressPercent === 100) {
        updateData.status = "completed";
        updateData.completed_at = new Date().toISOString();
      } else {
        updateData.status = "active";
        updateData.completed_at = null;
      }
      await supabase
        .from("enrollments")
        .update(updateData)
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
    setProgress((prev) => ({ ...prev, [lessonId]: newCompleted }));

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
      const ytMatch = url.match(
        /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
      );
      if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`;
      const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
      if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
      return url;
    } catch {
      return url;
    }
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

  const formatDateTime = (d: string) =>
    new Date(d).toLocaleString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const typeBadge = (type: string) => {
    const styles: Record<string, string> = {
      homework: "bg-blue-100 text-blue-700",
      classwork: "bg-purple-100 text-purple-700",
      assessment: "bg-red-100 text-red-700",
      feedback: "bg-green-100 text-green-700",
      remark: "bg-blue-100 text-blue-700",
      note: "bg-amber-100 text-amber-700",
    };
    return (
      <span
        className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${styles[type] || "bg-gray-100 text-gray-500"}`}
      >
        {type}
      </span>
    );
  };

  const statusBadge = (status: string) => {
    const styles: Record<string, string> = {
      scheduled: "bg-blue-100 text-blue-700",
      live: "bg-red-100 text-red-600",
      completed: "bg-green-100 text-green-700",
      cancelled: "bg-gray-100 text-gray-500",
    };
    return (
      <span
        className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${styles[status] || "bg-gray-100 text-gray-500"}`}
      >
        {status === "live" ? "LIVE NOW" : status}
      </span>
    );
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
            You are not enrolled in this course.
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

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: "lessons", label: "Lessons", icon: <BookOpen className="w-4 h-4" /> },
    { key: "sessions", label: "Sessions", icon: <Video className="w-4 h-4" /> },
    { key: "assignments", label: "Assignments", icon: <ClipboardList className="w-4 h-4" /> },
    { key: "remarks", label: "Remarks", icon: <MessageSquare className="w-4 h-4" /> },
    { key: "materials", label: "Materials", icon: <FolderOpen className="w-4 h-4" /> },
  ];

  return (
    <div className="space-y-6">
      <Toaster position="top-right" />

      <MaterialViewer
        open={!!viewingMaterial}
        title={viewingMaterial?.title || ""}
        fileUrl={viewingMaterial?.file_url || ""}
        fileType={viewingMaterial?.file_type || null}
        onClose={() => setViewingMaterial(null)}
      />

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

      {/* Progress Bar */}
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

      {/* Tabs */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex border-b border-gray-100 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium whitespace-nowrap transition-all border-b-2 ${
                activeTab === tab.key
                  ? "border-[#1F4FD8] text-[#1F4FD8]"
                  : "border-transparent text-[#9CA3AF] hover:text-[#4D4D4D]"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-5">
          {/* ==================== LESSONS TAB ==================== */}
          {activeTab === "lessons" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Sidebar */}
              <div className="lg:col-span-1 space-y-3">
                {modules.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-[#9CA3AF]">No content available yet</p>
                  </div>
                ) : (
                  modules.map((mod, modIdx) => {
                    const modLessons = lessons[mod.id] || [];
                    const isExpanded = expandedModules.has(mod.id);
                    const modCompleted = modLessons.filter((l) => progress[l.id]).length;

                    return (
                      <div key={mod.id} className="border border-gray-100 rounded-xl overflow-hidden">
                        <button
                          onClick={() => toggleModule(mod.id)}
                          className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50/50 transition-colors"
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
                                    className="flex-shrink-0"
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

              {/* Main Content */}
              <div className="lg:col-span-2">
                {activeLesson ? (
                  <div className="border border-gray-100 rounded-xl overflow-hidden">
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
                    </div>
                  </div>
                ) : (
                  <div className="border border-gray-100 rounded-xl flex items-center justify-center py-20">
                    <div className="text-center">
                      <div className="w-16 h-16 mx-auto mb-4 bg-[#1F4FD8]/5 rounded-full flex items-center justify-center">
                        <Play className="w-8 h-8 text-[#1F4FD8]/40 ml-1" />
                      </div>
                      <p className="text-[#4D4D4D] font-medium font-poppins">Select a lesson to begin</p>
                      <p className="text-sm text-[#9CA3AF] mt-1">
                        Choose a lesson from the sidebar
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ==================== SESSIONS TAB ==================== */}
          {activeTab === "sessions" && (
            <div className="space-y-6">
              {sessionsLoading ? (
                <div className="flex justify-center py-12">
                  <div className="w-6 h-6 border-2 border-[#1F4FD8]/30 border-t-[#1F4FD8] rounded-full animate-spin" />
                </div>
              ) : sessions.length === 0 ? (
                <div className="text-center py-12">
                  <Video className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-[#9CA3AF]">No sessions scheduled yet</p>
                </div>
              ) : (
                <>
                  {/* Next Session Highlight */}
                  {nextSession && (
                    <div className="bg-gradient-to-r from-[#1F4FD8]/5 to-[#1F4FD8]/10 border border-[#1F4FD8]/20 rounded-xl p-5">
                      <div className="flex items-center gap-2 mb-3">
                        <Calendar className="w-4 h-4 text-[#1F4FD8]" />
                        <span className="text-sm font-semibold text-[#1F4FD8]">Next Session</span>
                        {statusBadge(nextSession.status)}
                      </div>
                      <h3 className="font-poppins font-bold text-[#1C1C28] text-lg">{nextSession.title}</h3>
                      <p className="text-sm text-[#4D4D4D] mt-1">
                        {formatDateTime(nextSession.scheduled_at)} &middot; {nextSession.duration_minutes} min
                      </p>
                      {nextSession.zoom_join_url && (
                        <a
                          href={nextSession.zoom_join_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 mt-3 px-4 py-2 bg-[#1F4FD8] text-white text-sm font-semibold rounded-xl hover:bg-[#1a45c2] transition-all"
                        >
                          <Video className="w-4 h-4" />
                          Join Session
                        </a>
                      )}
                    </div>
                  )}

                  {/* Past Sessions */}
                  {pastSessions.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-[#1C1C28] mb-3">Past Sessions</h3>
                      <div className="space-y-2">
                        {pastSessions.map((s) => (
                          <div key={s.id} className="flex items-center justify-between border border-gray-100 rounded-xl px-4 py-3">
                            <div>
                              <p className="text-sm font-medium text-[#1C1C28]">{s.title}</p>
                              <p className="text-xs text-[#9CA3AF]">{formatDateTime(s.scheduled_at)} &middot; {s.duration_minutes} min</p>
                            </div>
                            <div className="flex items-center gap-2">
                              {statusBadge(s.status)}
                              {s.recording_url && (
                                <a href={s.recording_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-[#1F4FD8] hover:underline">
                                  <Play className="w-3 h-3" /> Recording
                                </a>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* ==================== ASSIGNMENTS TAB ==================== */}
          {activeTab === "assignments" && (
            <div className="space-y-6">
              {assignmentsLoading ? (
                <div className="flex justify-center py-12">
                  <div className="w-6 h-6 border-2 border-[#1F4FD8]/30 border-t-[#1F4FD8] rounded-full animate-spin" />
                </div>
              ) : assignments.length === 0 ? (
                <div className="text-center py-12">
                  <ClipboardList className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-[#9CA3AF]">No assignments yet</p>
                </div>
              ) : (
                <>
                  {/* Upcoming / Pending */}
                  {upcomingAssignments.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-[#1C1C28] mb-3">Pending Assignments</h3>
                      <div className="space-y-3">
                        {upcomingAssignments.map((a) => {
                          const isDueSoon = a.due_date && (new Date(a.due_date).getTime() - now.getTime()) < 3 * 24 * 60 * 60 * 1000;
                          return (
                            <div key={a.id} className="border border-gray-100 rounded-xl p-4">
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <h4 className="font-medium text-[#1C1C28] text-sm">{a.title}</h4>
                                    {typeBadge(a.type)}
                                  </div>
                                  <p className="text-xs text-[#4D4D4D] line-clamp-2">{a.description}</p>
                                  {a.due_date && (
                                    <p className={`text-xs mt-1 ${isDueSoon ? "text-red-500 font-medium" : "text-[#9CA3AF]"}`}>
                                      Due: {formatDate(a.due_date)} {isDueSoon && " - Due soon!"}
                                    </p>
                                  )}
                                </div>
                                <Link
                                  href="/dashboard/student/assignments"
                                  className="text-xs text-[#1F4FD8] hover:underline font-medium flex-shrink-0"
                                >
                                  Submit
                                </Link>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Past / Submitted */}
                  {pastAssignments.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-[#1C1C28] mb-3">Past Assignments</h3>
                      <div className="space-y-3">
                        {pastAssignments.map((a) => (
                          <div key={a.id} className="border border-gray-100 rounded-xl p-4">
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <h4 className="font-medium text-[#1C1C28] text-sm">{a.title}</h4>
                                  {typeBadge(a.type)}
                                </div>
                                <p className="text-xs text-[#4D4D4D] line-clamp-2">{a.description}</p>
                                {a.due_date && (
                                  <p className="text-xs text-[#9CA3AF] mt-1">Due: {formatDate(a.due_date)}</p>
                                )}
                              </div>
                              <div className="flex-shrink-0 text-right">
                                {a.submission ? (
                                  a.submission.graded_at ? (
                                    <div>
                                      <span className="inline-flex items-center gap-1 text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                                        <Star className="w-3 h-3" /> {a.submission.grade || "Graded"}
                                      </span>
                                      {a.submission.feedback && (
                                        <p className="text-xs text-[#4D4D4D] mt-1 max-w-[200px] line-clamp-2">
                                          {a.submission.feedback}
                                        </p>
                                      )}
                                    </div>
                                  ) : (
                                    <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full font-medium">
                                      Pending review
                                    </span>
                                  )
                                ) : (
                                  <span className="text-xs text-gray-400">Not submitted</span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* ==================== REMARKS TAB ==================== */}
          {activeTab === "remarks" && (
            <div className="space-y-4">
              {remarksLoading ? (
                <div className="flex justify-center py-12">
                  <div className="w-6 h-6 border-2 border-[#1F4FD8]/30 border-t-[#1F4FD8] rounded-full animate-spin" />
                </div>
              ) : remarks.length === 0 ? (
                <div className="text-center py-12">
                  <MessageSquare className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-[#9CA3AF]">No remarks yet</p>
                </div>
              ) : (
                remarks.map((r) => (
                  <div key={r.id} className="border border-gray-100 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-full bg-[#1F4FD8]/10 flex items-center justify-center flex-shrink-0">
                        {r.teacher?.avatar_url ? (
                          <img src={r.teacher.avatar_url} alt="" className="w-9 h-9 rounded-full object-cover" />
                        ) : (
                          <span className="text-sm font-bold text-[#1F4FD8]">
                            {r.teacher?.full_name?.charAt(0) || "T"}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium text-[#1C1C28]">
                            {r.teacher?.full_name || "Teacher"}
                          </span>
                          {typeBadge(r.type)}
                          <span className="text-xs text-[#9CA3AF]">{formatDate(r.created_at)}</span>
                        </div>
                        <p className="text-sm text-[#4D4D4D] whitespace-pre-wrap">{r.content}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* ==================== MATERIALS TAB ==================== */}
          {activeTab === "materials" && (
            <div className="space-y-3">
              {materialsLoading ? (
                <div className="flex justify-center py-12">
                  <div className="w-6 h-6 border-2 border-[#1F4FD8]/30 border-t-[#1F4FD8] rounded-full animate-spin" />
                </div>
              ) : materials.length === 0 ? (
                <div className="text-center py-12">
                  <FolderOpen className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-[#9CA3AF]">No study materials yet</p>
                </div>
              ) : (
                materials.map((m) => (
                  <div key={m.id} className="flex items-center justify-between border border-gray-100 rounded-xl px-4 py-3">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-10 h-10 rounded-lg bg-[#1F4FD8]/10 flex items-center justify-center flex-shrink-0">
                        <FileText className="w-5 h-5 text-[#1F4FD8]" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-[#1C1C28] truncate">{m.title}</p>
                        {m.description && (
                          <p className="text-xs text-[#9CA3AF] truncate">{m.description}</p>
                        )}
                        <p className="text-xs text-[#9CA3AF]">
                          {m.file_type && <span className="uppercase">{m.file_type}</span>}
                          {m.file_type && " · "}
                          {formatDate(m.created_at)}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setViewingMaterial(m)}
                      className="p-2 text-[#1F4FD8] hover:bg-[#1F4FD8]/10 rounded-lg transition-colors flex-shrink-0"
                      aria-label="View material"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
