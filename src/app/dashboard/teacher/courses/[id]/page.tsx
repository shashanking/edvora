"use client";

import React, { useEffect, useState, useCallback } from "react";
import { createClient } from "@/src/lib/supabase/client";
import {
  ArrowLeft,
  BookOpen,
  Video,
  ClipboardList,
  MessageSquare,
  FolderOpen,
  Calendar,
  Users,
  Clock,
  Play,
  FileText,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ChevronDown,
  ChevronRight,
  Plus,
  Save,
  Star,
  Download,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import toast, { Toaster } from "react-hot-toast";

type Tab = "sessions" | "assignments" | "remarks" | "materials";

interface CourseInfo {
  id: string;
  title: string;
  description: string;
  thumbnail_url: string | null;
  status: string;
}

interface Session {
  id: string;
  title: string;
  scheduled_at: string;
  duration_minutes: number;
  status: string;
  zoom_start_url: string | null;
  zoom_join_url: string | null;
  recording_url: string | null;
  student_id: string | null;
}

interface StudentInfo {
  id: string;
  full_name: string;
  email: string;
  avatar_url: string | null;
}

interface AttendanceRecord {
  id?: string;
  student_id: string;
  status: string;
}

interface AssignmentData {
  id: string;
  title: string;
  description: string;
  type: string;
  due_date: string | null;
  created_at: string;
  submission_count: number;
  graded_count: number;
}

interface RemarkData {
  id: string;
  content: string;
  type: string;
  created_at: string;
  student: { full_name: string; avatar_url: string | null } | null;
}

interface MaterialData {
  id: string;
  title: string;
  description: string | null;
  file_url: string;
  file_type: string | null;
  created_at: string;
}

export default function TeacherCourseDetailPage() {
  const params = useParams();
  const courseId = params.id as string;
  const supabase = createClient() as any;

  const [user, setUser] = useState<any>(null);
  const [course, setCourse] = useState<CourseInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("sessions");

  // Sessions
  const [sessions, setSessions] = useState<Session[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [enrolledStudents, setEnrolledStudents] = useState<StudentInfo[]>([]);

  // Post-session: attendance
  const [expandedSession, setExpandedSession] = useState<string | null>(null);
  const [attendanceMap, setAttendanceMap] = useState<Record<string, Record<string, string>>>({});
  const [savingAttendance, setSavingAttendance] = useState(false);

  // Post-session: remarks
  const [remarkSessionId, setRemarkSessionId] = useState<string | null>(null);
  const [remarkStudentId, setRemarkStudentId] = useState("");
  const [remarkContent, setRemarkContent] = useState("");
  const [remarkType, setRemarkType] = useState("feedback");
  const [savingRemark, setSavingRemark] = useState(false);

  // Assignments
  const [assignments, setAssignments] = useState<AssignmentData[]>([]);
  const [assignmentsLoading, setAssignmentsLoading] = useState(false);

  // Remarks
  const [remarks, setRemarks] = useState<RemarkData[]>([]);
  const [remarksLoading, setRemarksLoading] = useState(false);
  const [showAddRemark, setShowAddRemark] = useState(false);
  const [newRemarkStudent, setNewRemarkStudent] = useState("");
  const [newRemarkContent, setNewRemarkContent] = useState("");
  const [newRemarkType, setNewRemarkType] = useState("feedback");

  // Materials
  const [materials, setMaterials] = useState<MaterialData[]>([]);
  const [materialsLoading, setMaterialsLoading] = useState(false);

  // Stats
  const [studentCount, setStudentCount] = useState(0);
  const [sessionCount, setSessionCount] = useState(0);

  const now = new Date();

  // Helper: is session end time in the past?
  const isSessionOver = (s: Session) =>
    new Date(s.scheduled_at).getTime() + s.duration_minutes * 60 * 1000 <= now.getTime();

  // Helper: is session truly upcoming (hasn't ended yet)?
  const isUpcoming = (s: Session) =>
    (s.status === "scheduled" || s.status === "live") && !isSessionOver(s);

  // Helper: needs teacher action (time passed but still marked scheduled/live)
  const needsEndAction = (s: Session) =>
    (s.status === "scheduled" || s.status === "live") && isSessionOver(s);

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
      .select("id, title, description, thumbnail_url, status")
      .eq("id", courseId)
      .single();
    if (courseData) setCourse(courseData as CourseInfo);

    // Enrolled students
    const { data: enrollments } = await supabase
      .from("enrollments")
      .select("student_id")
      .eq("course_id", courseId)
      .eq("status", "active");

    const studentIds = ((enrollments as any[]) || []).map((e) => e.student_id);
    setStudentCount(studentIds.length);

    if (studentIds.length > 0) {
      const { data: students } = await supabase
        .from("profiles")
        .select("id, full_name, email, avatar_url")
        .in("id", studentIds);
      setEnrolledStudents((students as StudentInfo[]) || []);
    }

    setLoading(false);
  }, [courseId]);

  // Fetch sessions
  const fetchSessions = useCallback(async () => {
    if (!user) return;
    setSessionsLoading(true);
    const { data } = await supabase
      .from("live_sessions")
      .select("id, title, scheduled_at, duration_minutes, status, zoom_start_url, zoom_join_url, recording_url, student_id")
      .eq("course_id", courseId)
      .eq("teacher_id", user.id)
      .order("scheduled_at", { ascending: false });

    const sessionsList = (data as Session[]) || [];
    setSessions(sessionsList);
    setSessionCount(sessionsList.length);
    setSessionsLoading(false);
  }, [courseId, user]);

  // Fetch attendance for a session
  const fetchAttendanceForSession = useCallback(
    async (sessionId: string, sessionDate: string) => {
      const dateStr = new Date(sessionDate).toISOString().split("T")[0];
      const { data } = await supabase
        .from("attendance")
        .select("id, student_id, status")
        .eq("course_id", courseId)
        .eq("date", dateStr);

      const map: Record<string, string> = {};
      for (const a of (data as AttendanceRecord[]) || []) {
        map[a.student_id] = a.status;
      }
      setAttendanceMap((prev) => ({ ...prev, [sessionId]: map }));
    },
    [courseId]
  );

  // Fetch assignments
  const fetchAssignments = useCallback(async () => {
    if (!user) return;
    setAssignmentsLoading(true);
    const { data: assignData } = await supabase
      .from("assignments")
      .select("id, title, description, type, due_date, created_at")
      .eq("course_id", courseId)
      .eq("teacher_id", user.id)
      .order("created_at", { ascending: false });

    const list = (assignData as any[]) || [];
    if (list.length > 0) {
      const assignmentIds = list.map((a) => a.id);
      const { data: subs } = await supabase
        .from("assignment_submissions")
        .select("assignment_id, graded_at")
        .in("assignment_id", assignmentIds);

      const subCountMap = new Map<string, number>();
      const gradedCountMap = new Map<string, number>();
      for (const s of (subs as any[]) || []) {
        subCountMap.set(s.assignment_id, (subCountMap.get(s.assignment_id) || 0) + 1);
        if (s.graded_at) gradedCountMap.set(s.assignment_id, (gradedCountMap.get(s.assignment_id) || 0) + 1);
      }

      setAssignments(
        list.map((a) => ({
          ...a,
          submission_count: subCountMap.get(a.id) || 0,
          graded_count: gradedCountMap.get(a.id) || 0,
        }))
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
      .select("id, content, type, created_at, student_id")
      .eq("course_id", courseId)
      .eq("teacher_id", user.id)
      .order("created_at", { ascending: false });

    const list = (data as any[]) || [];
    if (list.length > 0) {
      const studentIds = [...new Set(list.map((r: any) => r.student_id))];
      const { data: students } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url")
        .in("id", studentIds);

      const studentMap = new Map<string, any>();
      for (const s of (students as any[]) || []) {
        studentMap.set(s.id, s);
      }

      setRemarks(
        list.map((r: any) => ({
          ...r,
          student: studentMap.get(r.student_id) || null,
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

  useEffect(() => {
    if (!user) return;
    if (activeTab === "sessions") fetchSessions();
    if (activeTab === "assignments") fetchAssignments();
    if (activeTab === "remarks") fetchRemarks();
    if (activeTab === "materials") fetchMaterials();
  }, [activeTab, user]);

  // End session manually
  const endSession = async (sessionId: string) => {
    const { error } = await supabase
      .from("live_sessions")
      .update({ status: "completed" })
      .eq("id", sessionId);

    if (error) {
      toast.error("Failed to end session");
    } else {
      toast.success("Session marked as completed");
      setSessions((prev) =>
        prev.map((s) => (s.id === sessionId ? { ...s, status: "completed" } : s))
      );
    }
  };

  // Toggle session expansion for attendance
  const toggleSessionExpand = async (sessionId: string, sessionDate: string) => {
    if (expandedSession === sessionId) {
      setExpandedSession(null);
    } else {
      setExpandedSession(sessionId);
      if (!attendanceMap[sessionId]) {
        await fetchAttendanceForSession(sessionId, sessionDate);
      }
    }
  };

  // Save attendance
  const saveAttendance = async (sessionId: string, sessionDate: string) => {
    if (!user) return;
    setSavingAttendance(true);
    const dateStr = new Date(sessionDate).toISOString().split("T")[0];
    const sessionAttendance = attendanceMap[sessionId] || {};

    for (const student of enrolledStudents) {
      const status = sessionAttendance[student.id];
      if (!status) continue;

      const { data: existing } = await supabase
        .from("attendance")
        .select("id")
        .eq("course_id", courseId)
        .eq("student_id", student.id)
        .eq("date", dateStr)
        .single();

      if (existing) {
        await supabase.from("attendance").update({ status }).eq("id", existing.id);
      } else {
        await supabase.from("attendance").insert({
          course_id: courseId,
          student_id: student.id,
          teacher_id: user.id,
          date: dateStr,
          status,
        });
      }
    }

    toast.success("Attendance saved!");
    setSavingAttendance(false);
  };

  // Save remark from session context
  const saveSessionRemark = async () => {
    if (!user || !remarkStudentId || !remarkContent.trim()) return;
    setSavingRemark(true);

    const { error } = await supabase.from("remarks").insert({
      student_id: remarkStudentId,
      teacher_id: user.id,
      course_id: courseId,
      content: remarkContent.trim(),
      type: remarkType,
    });

    if (error) {
      toast.error("Failed to save remark");
    } else {
      toast.success("Remark added!");
      setRemarkContent("");
      setRemarkStudentId("");
      setRemarkSessionId(null);
    }
    setSavingRemark(false);
  };

  // Save remark from remarks tab
  const saveNewRemark = async () => {
    if (!user || !newRemarkStudent || !newRemarkContent.trim()) return;
    setSavingRemark(true);

    const { error } = await supabase.from("remarks").insert({
      student_id: newRemarkStudent,
      teacher_id: user.id,
      course_id: courseId,
      content: newRemarkContent.trim(),
      type: newRemarkType,
    });

    if (error) {
      toast.error("Failed to save remark");
    } else {
      toast.success("Remark added!");
      setNewRemarkContent("");
      setNewRemarkStudent("");
      setShowAddRemark(false);
      fetchRemarks();
    }
    setSavingRemark(false);
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

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
      <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${styles[type] || "bg-gray-100 text-gray-500"}`}>
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
      <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${styles[status] || "bg-gray-100 text-gray-500"}`}>
        {status === "live" ? "LIVE NOW" : status}
      </span>
    );
  };

  // Only the very next upcoming session (time hasn't passed yet)
  const nextSession = sessions
    .filter((s) => isUpcoming(s))
    .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime())[0] || null;

  // Sessions that are completed OR whose time has passed (need end action)
  const pastSessions = sessions.filter(
    (s) => s.status === "completed" || s.status === "cancelled" || needsEndAction(s)
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-[#1F4FD8]/30 border-t-[#1F4FD8] rounded-full animate-spin" />
      </div>
    );
  }

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: "sessions", label: "Sessions", icon: <Video className="w-4 h-4" /> },
    { key: "assignments", label: "Assignments", icon: <ClipboardList className="w-4 h-4" /> },
    { key: "remarks", label: "Remarks", icon: <MessageSquare className="w-4 h-4" /> },
    { key: "materials", label: "Materials", icon: <FolderOpen className="w-4 h-4" /> },
  ];

  return (
    <div className="space-y-6">
      <Toaster position="top-right" />

      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/teacher/courses"
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

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <div className="flex items-center gap-2 mb-1">
            <Users className="w-4 h-4 text-[#1F4FD8]" />
            <span className="text-xs text-[#9CA3AF]">Students</span>
          </div>
          <p className="text-xl font-bold text-[#1C1C28]">{studentCount}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <div className="flex items-center gap-2 mb-1">
            <Video className="w-4 h-4 text-[#1F4FD8]" />
            <span className="text-xs text-[#9CA3AF]">Sessions</span>
          </div>
          <p className="text-xl font-bold text-[#1C1C28]">{sessionCount}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <div className="flex items-center gap-2 mb-1">
            <ClipboardList className="w-4 h-4 text-[#1F4FD8]" />
            <span className="text-xs text-[#9CA3AF]">Assignments</span>
          </div>
          <p className="text-xl font-bold text-[#1C1C28]">{assignments.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <div className="flex items-center gap-2 mb-1">
            <MessageSquare className="w-4 h-4 text-[#1F4FD8]" />
            <span className="text-xs text-[#9CA3AF]">Remarks</span>
          </div>
          <p className="text-xl font-bold text-[#1C1C28]">{remarks.length}</p>
        </div>
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
                  <p className="text-sm text-[#9CA3AF]">No sessions yet</p>
                  <Link
                    href="/dashboard/teacher/live-classes"
                    className="inline-flex items-center gap-2 mt-3 text-sm text-[#1F4FD8] hover:underline"
                  >
                    <Plus className="w-4 h-4" /> Schedule a session
                  </Link>
                </div>
              ) : (
                <>
                  {/* Next Session Highlight — only ONE */}
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
                      {nextSession.zoom_start_url && (
                        <a
                          href={nextSession.zoom_start_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 mt-3 px-4 py-2 bg-[#1F4FD8] text-white text-sm font-semibold rounded-xl hover:bg-[#1a45c2] transition-all"
                        >
                          <Video className="w-4 h-4" />
                          Start Session
                        </a>
                      )}
                    </div>
                  )}

                  {/* Past / Completed Sessions with Post-Session Flow */}
                  {pastSessions.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-[#1C1C28] mb-3">Past Sessions</h3>
                      <div className="space-y-3">
                        {pastSessions.map((s) => {
                          const isStillOpen = needsEndAction(s);
                          return (
                          <div key={s.id} className={`border rounded-xl overflow-hidden ${isStillOpen ? "border-amber-200 bg-amber-50/30" : "border-gray-100"}`}>
                            {/* Session header */}
                            <div className="flex items-center justify-between px-4 py-3">
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-[#1C1C28]">{s.title}</p>
                                <p className="text-xs text-[#9CA3AF]">
                                  {formatDateTime(s.scheduled_at)} &middot; {s.duration_minutes} min
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                {isStillOpen && (
                                  <button
                                    onClick={() => endSession(s.id)}
                                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-amber-100 text-amber-700 text-xs font-semibold rounded-lg hover:bg-amber-200 transition-all"
                                  >
                                    <XCircle className="w-3.5 h-3.5" /> End Session
                                  </button>
                                )}
                                {statusBadge(s.status)}
                                {s.recording_url && (
                                  <a href={s.recording_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-[#1F4FD8] hover:underline">
                                    <Play className="w-3 h-3" /> Recording
                                  </a>
                                )}
                                <button
                                  onClick={() => toggleSessionExpand(s.id, s.scheduled_at)}
                                  className="inline-flex items-center gap-1 text-xs text-[#1F4FD8] hover:underline font-medium"
                                >
                                  {expandedSession === s.id ? (
                                    <>
                                      <ChevronDown className="w-3 h-3" /> Close
                                    </>
                                  ) : (
                                    <>
                                      <ChevronRight className="w-3 h-3" /> Attendance & Remarks
                                    </>
                                  )}
                                </button>
                              </div>
                            </div>

                            {/* Expanded: Attendance + Remark */}
                            {expandedSession === s.id && (
                              <div className="border-t border-gray-100 p-4 bg-gray-50/50 space-y-4">
                                {/* Attendance */}
                                <div>
                                  <h4 className="text-xs font-semibold text-[#1C1C28] uppercase tracking-wide mb-2">
                                    Mark Attendance
                                  </h4>
                                  {enrolledStudents.length === 0 ? (
                                    <p className="text-xs text-[#9CA3AF]">No enrolled students</p>
                                  ) : (
                                    <div className="space-y-2">
                                      {enrolledStudents.map((student) => {
                                        const currentStatus = attendanceMap[s.id]?.[student.id] || "";
                                        return (
                                          <div key={student.id} className="flex items-center justify-between bg-white rounded-lg px-3 py-2 border border-gray-100">
                                            <div className="flex items-center gap-2">
                                              <div className="w-7 h-7 rounded-full bg-[#1F4FD8]/10 flex items-center justify-center">
                                                <span className="text-xs font-bold text-[#1F4FD8]">
                                                  {student.full_name.charAt(0)}
                                                </span>
                                              </div>
                                              <span className="text-sm text-[#1C1C28]">{student.full_name}</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                              {(["present", "absent", "late"] as const).map((status) => (
                                                <button
                                                  key={status}
                                                  onClick={() =>
                                                    setAttendanceMap((prev) => ({
                                                      ...prev,
                                                      [s.id]: {
                                                        ...prev[s.id],
                                                        [student.id]: status,
                                                      },
                                                    }))
                                                  }
                                                  className={`px-2.5 py-1 rounded-lg text-xs font-medium capitalize transition-all ${
                                                    currentStatus === status
                                                      ? status === "present"
                                                        ? "bg-green-100 text-green-700 ring-1 ring-green-300"
                                                        : status === "absent"
                                                          ? "bg-red-100 text-red-700 ring-1 ring-red-300"
                                                          : "bg-amber-100 text-amber-700 ring-1 ring-amber-300"
                                                      : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                                                  }`}
                                                >
                                                  {status}
                                                </button>
                                              ))}
                                            </div>
                                          </div>
                                        );
                                      })}
                                      <button
                                        onClick={() => saveAttendance(s.id, s.scheduled_at)}
                                        disabled={savingAttendance}
                                        className="inline-flex items-center gap-2 px-4 py-2 bg-[#1F4FD8] text-white text-sm font-medium rounded-xl hover:bg-[#1a45c2] transition-all disabled:opacity-50"
                                      >
                                        <Save className="w-4 h-4" />
                                        {savingAttendance ? "Saving..." : "Save Attendance"}
                                      </button>
                                    </div>
                                  )}
                                </div>

                                {/* Add Remark for this session */}
                                <div className="border-t border-gray-200 pt-4">
                                  <h4 className="text-xs font-semibold text-[#1C1C28] uppercase tracking-wide mb-2">
                                    Add Remark
                                  </h4>
                                  {remarkSessionId === s.id ? (
                                    <div className="space-y-2">
                                      <select
                                        value={remarkStudentId}
                                        onChange={(e) => setRemarkStudentId(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1F4FD8]/20"
                                      >
                                        <option value="">Select student</option>
                                        {enrolledStudents.map((st) => (
                                          <option key={st.id} value={st.id}>
                                            {st.full_name}
                                          </option>
                                        ))}
                                      </select>
                                      <div className="flex gap-2">
                                        {(["feedback", "remark", "note"] as const).map((t) => (
                                          <button
                                            key={t}
                                            onClick={() => setRemarkType(t)}
                                            className={`px-3 py-1 rounded-lg text-xs font-medium capitalize ${
                                              remarkType === t
                                                ? t === "feedback"
                                                  ? "bg-green-100 text-green-700"
                                                  : t === "remark"
                                                    ? "bg-blue-100 text-blue-700"
                                                    : "bg-amber-100 text-amber-700"
                                                : "bg-gray-100 text-gray-500"
                                            }`}
                                          >
                                            {t}
                                          </button>
                                        ))}
                                      </div>
                                      <textarea
                                        value={remarkContent}
                                        onChange={(e) => setRemarkContent(e.target.value)}
                                        placeholder="Write your remark..."
                                        rows={3}
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1F4FD8]/20 resize-none"
                                      />
                                      <div className="flex gap-2">
                                        <button
                                          onClick={saveSessionRemark}
                                          disabled={savingRemark || !remarkStudentId || !remarkContent.trim()}
                                          className="inline-flex items-center gap-2 px-4 py-2 bg-[#1F4FD8] text-white text-sm font-medium rounded-xl hover:bg-[#1a45c2] transition-all disabled:opacity-50"
                                        >
                                          <Save className="w-4 h-4" />
                                          {savingRemark ? "Saving..." : "Save Remark"}
                                        </button>
                                        <button
                                          onClick={() => setRemarkSessionId(null)}
                                          className="px-4 py-2 text-sm text-[#4D4D4D] hover:bg-gray-100 rounded-xl"
                                        >
                                          Cancel
                                        </button>
                                      </div>
                                    </div>
                                  ) : (
                                    <button
                                      onClick={() => setRemarkSessionId(s.id)}
                                      className="inline-flex items-center gap-2 text-sm text-[#1F4FD8] hover:underline"
                                    >
                                      <Plus className="w-4 h-4" /> Add remark for this session
                                    </button>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* ==================== ASSIGNMENTS TAB ==================== */}
          {activeTab === "assignments" && (
            <div className="space-y-4">
              {assignmentsLoading ? (
                <div className="flex justify-center py-12">
                  <div className="w-6 h-6 border-2 border-[#1F4FD8]/30 border-t-[#1F4FD8] rounded-full animate-spin" />
                </div>
              ) : assignments.length === 0 ? (
                <div className="text-center py-12">
                  <ClipboardList className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-[#9CA3AF]">No assignments yet</p>
                  <Link
                    href="/dashboard/teacher/assignments"
                    className="inline-flex items-center gap-2 mt-3 text-sm text-[#1F4FD8] hover:underline"
                  >
                    <Plus className="w-4 h-4" /> Create assignment
                  </Link>
                </div>
              ) : (
                <>
                  <div className="flex justify-end">
                    <Link
                      href="/dashboard/teacher/assignments"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-[#1F4FD8] text-white text-sm font-medium rounded-xl hover:bg-[#1a45c2] transition-all"
                    >
                      <Plus className="w-4 h-4" /> Manage Assignments
                    </Link>
                  </div>
                  {assignments.map((a) => (
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
                        <div className="flex-shrink-0 text-right space-y-1">
                          <p className="text-xs text-[#4D4D4D]">
                            <span className="font-medium">{a.submission_count}</span> submissions
                          </p>
                          <p className="text-xs text-green-600">
                            <span className="font-medium">{a.graded_count}</span> graded
                          </p>
                          {a.submission_count > a.graded_count && (
                            <p className="text-xs text-amber-600 font-medium">
                              {a.submission_count - a.graded_count} pending
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          )}

          {/* ==================== REMARKS TAB ==================== */}
          {activeTab === "remarks" && (
            <div className="space-y-4">
              {/* Add remark button */}
              <div className="flex justify-end">
                <button
                  onClick={() => setShowAddRemark(!showAddRemark)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-[#1F4FD8] text-white text-sm font-medium rounded-xl hover:bg-[#1a45c2] transition-all"
                >
                  <Plus className="w-4 h-4" /> Add Remark
                </button>
              </div>

              {/* Add remark form */}
              {showAddRemark && (
                <div className="border border-[#1F4FD8]/20 bg-[#1F4FD8]/5 rounded-xl p-4 space-y-3">
                  <select
                    value={newRemarkStudent}
                    onChange={(e) => setNewRemarkStudent(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1F4FD8]/20"
                  >
                    <option value="">Select student</option>
                    {enrolledStudents.map((st) => (
                      <option key={st.id} value={st.id}>
                        {st.full_name}
                      </option>
                    ))}
                  </select>
                  <div className="flex gap-2">
                    {(["feedback", "remark", "note"] as const).map((t) => (
                      <button
                        key={t}
                        onClick={() => setNewRemarkType(t)}
                        className={`px-3 py-1 rounded-lg text-xs font-medium capitalize ${
                          newRemarkType === t
                            ? t === "feedback"
                              ? "bg-green-100 text-green-700"
                              : t === "remark"
                                ? "bg-blue-100 text-blue-700"
                                : "bg-amber-100 text-amber-700"
                            : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                  <textarea
                    value={newRemarkContent}
                    onChange={(e) => setNewRemarkContent(e.target.value)}
                    placeholder="Write your remark..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1F4FD8]/20 resize-none"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={saveNewRemark}
                      disabled={savingRemark || !newRemarkStudent || !newRemarkContent.trim()}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-[#1F4FD8] text-white text-sm font-medium rounded-xl hover:bg-[#1a45c2] transition-all disabled:opacity-50"
                    >
                      <Save className="w-4 h-4" />
                      {savingRemark ? "Saving..." : "Save"}
                    </button>
                    <button
                      onClick={() => setShowAddRemark(false)}
                      className="px-4 py-2 text-sm text-[#4D4D4D] hover:bg-gray-100 rounded-xl"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

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
                        <span className="text-sm font-bold text-[#1F4FD8]">
                          {r.student?.full_name?.charAt(0) || "S"}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium text-[#1C1C28]">
                            {r.student?.full_name || "Student"}
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
              <div className="flex justify-end">
                <Link
                  href="/dashboard/teacher/materials"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-[#1F4FD8] text-white text-sm font-medium rounded-xl hover:bg-[#1a45c2] transition-all"
                >
                  <Plus className="w-4 h-4" /> Manage Materials
                </Link>
              </div>

              {materialsLoading ? (
                <div className="flex justify-center py-12">
                  <div className="w-6 h-6 border-2 border-[#1F4FD8]/30 border-t-[#1F4FD8] rounded-full animate-spin" />
                </div>
              ) : materials.length === 0 ? (
                <div className="text-center py-12">
                  <FolderOpen className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-[#9CA3AF]">No materials uploaded yet</p>
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
                    <a
                      href={m.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 text-[#1F4FD8] hover:bg-[#1F4FD8]/10 rounded-lg transition-colors flex-shrink-0"
                    >
                      <Download className="w-4 h-4" />
                    </a>
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
