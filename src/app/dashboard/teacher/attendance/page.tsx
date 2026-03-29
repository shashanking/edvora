"use client";

import React, { useEffect, useState } from "react";
import { createClient } from "@/src/lib/supabase/client";
import {
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  Users,
  Filter,
  X,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import toast from "react-hot-toast";

interface CourseOption {
  id: string;
  title: string;
}

interface Session {
  id: string;
  title: string;
  session_number: number | null;
  scheduled_at: string;
  status: string;
  course_id: string;
}

interface Student {
  id: string;
  full_name: string;
  email: string;
}

interface AttendanceRecord {
  id: string;
  student_id: string;
  status: string;
  session_id: string;
}

interface AttendanceForm {
  [studentId: string]: "present" | "absent" | "late";
}

interface Stats {
  total: number;
  present: number;
  absent: number;
  late: number;
}

export default function TeacherAttendancePage() {
  const supabase = createClient() as any;
  const [courses, setCourses] = useState<CourseOption[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [userId, setUserId] = useState("");

  // Attendance marking state
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [sessionStudents, setSessionStudents] = useState<Student[]>([]);
  const [existingAttendance, setExistingAttendance] = useState<Record<string, AttendanceRecord[]>>({});
  const [attendanceForm, setAttendanceForm] = useState<AttendanceForm>({});
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [saving, setSaving] = useState(false);

  // Stats
  const [stats, setStats] = useState<Stats>({ total: 0, present: 0, absent: 0, late: 0 });

  useEffect(() => {
    fetchCourses();
  }, []);

  useEffect(() => {
    if (selectedCourseId && userId) {
      fetchSessions();
    }
  }, [selectedCourseId, userId]);

  const fetchCourses = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    setUserId(user.id);

    const { data: teacherCourses } = await supabase
      .from("course_teachers")
      .select("course_id")
      .eq("teacher_id", user.id);

    const courseIds = (teacherCourses as any[] || []).map((tc: any) => tc.course_id);

    if (courseIds.length === 0) {
      setCourses([]);
      setLoading(false);
      return;
    }

    const { data: coursesData } = await supabase
      .from("courses")
      .select("id, title")
      .in("id", courseIds)
      .order("title");

    setCourses((coursesData as CourseOption[]) || []);

    // Also fetch overall attendance stats for this teacher
    const { data: allAttendance } = await supabase
      .from("attendance")
      .select("status")
      .eq("teacher_id", user.id);

    if (allAttendance) {
      const rows = allAttendance as any[];
      setStats({
        total: rows.length,
        present: rows.filter((r: any) => r.status === "present").length,
        absent: rows.filter((r: any) => r.status === "absent").length,
        late: rows.filter((r: any) => r.status === "late").length,
      });
    }

    setLoading(false);
  };

  const fetchSessions = async () => {
    setLoadingSessions(true);
    setActiveSessionId(null);

    const { data: sessionsData } = await supabase
      .from("live_sessions")
      .select("*")
      .eq("course_id", selectedCourseId)
      .eq("teacher_id", userId)
      .order("scheduled_at", { ascending: false })
      .limit(20);

    const sessionsList = (sessionsData as any[] || []).map((s: any, index: number) => ({
      id: s.id,
      title: s.title || `Session`,
      session_number: s.session_number || null,
      scheduled_at: s.scheduled_at,
      status: s.status || "scheduled",
      course_id: s.course_id,
    }));

    setSessions(sessionsList);

    // Fetch existing attendance for these sessions
    if (sessionsList.length > 0) {
      const sessionIds = sessionsList.map((s) => s.id);
      const { data: attendanceData } = await supabase
        .from("attendance")
        .select("*")
        .in("session_id", sessionIds);

      const grouped: Record<string, AttendanceRecord[]> = {};
      ((attendanceData as any[]) || []).forEach((a: any) => {
        if (!grouped[a.session_id]) grouped[a.session_id] = [];
        grouped[a.session_id].push({
          id: a.id,
          student_id: a.student_id,
          status: a.status,
          session_id: a.session_id,
        });
      });
      setExistingAttendance(grouped);
    }

    setLoadingSessions(false);
  };

  const openAttendancePanel = async (sessionId: string) => {
    if (activeSessionId === sessionId) {
      setActiveSessionId(null);
      return;
    }

    setActiveSessionId(sessionId);
    setLoadingStudents(true);

    // Get enrolled students for this course
    const { data: enrollments } = await supabase
      .from("enrollments")
      .select("student_id")
      .eq("course_id", selectedCourseId);

    const studentIds = (enrollments as any[] || []).map((e: any) => e.student_id);

    if (studentIds.length === 0) {
      setSessionStudents([]);
      setLoadingStudents(false);
      return;
    }

    const { data: studentsData } = await supabase
      .from("profiles")
      .select("id, full_name, email")
      .in("id", studentIds)
      .order("full_name");

    setSessionStudents((studentsData as Student[]) || []);

    // Pre-fill form with existing attendance data
    const existing = existingAttendance[sessionId] || [];
    const formData: AttendanceForm = {};
    existing.forEach((a) => {
      formData[a.student_id] = a.status as "present" | "absent" | "late";
    });
    setAttendanceForm(formData);

    setLoadingStudents(false);
  };

  const handleStatusChange = (studentId: string, status: "present" | "absent" | "late") => {
    setAttendanceForm((prev) => ({ ...prev, [studentId]: status }));
  };

  const saveAttendance = async (sessionId: string) => {
    const session = sessions.find((s) => s.id === sessionId);
    if (!session) return;

    const entries = Object.entries(attendanceForm);
    if (entries.length === 0) {
      toast.error("Please mark attendance for at least one student");
      return;
    }

    setSaving(true);

    // Delete existing attendance for this session first
    const existing = existingAttendance[sessionId] || [];
    if (existing.length > 0) {
      await supabase
        .from("attendance")
        .delete()
        .eq("session_id", sessionId);
    }

    // Insert new attendance records
    const records = entries.map(([studentId, status]) => ({
      course_id: selectedCourseId,
      student_id: studentId,
      teacher_id: userId,
      date: session.scheduled_at?.split("T")[0] || new Date().toISOString().split("T")[0],
      status,
      session_id: sessionId,
    }));

    const { error } = await supabase.from("attendance").insert(records as any);

    if (error) {
      toast.error("Failed to save: " + error.message);
    } else {
      toast.success("Attendance saved successfully");
      // Update local state
      setExistingAttendance((prev) => ({
        ...prev,
        [sessionId]: records.map((r, i) => ({
          id: `temp-${i}`,
          student_id: r.student_id,
          status: r.status,
          session_id: sessionId,
        })),
      }));
      // Refresh stats
      fetchCourses();
    }

    setSaving(false);
  };

  const isSessionMarked = (sessionId: string) => {
    return (existingAttendance[sessionId] || []).length > 0;
  };

  const statusBadge = (status: string) => {
    const styles: Record<string, string> = {
      present: "bg-green-100 text-green-700",
      absent: "bg-red-100 text-red-600",
      late: "bg-amber-100 text-amber-700",
    };
    return (
      <span
        className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${styles[status] || "bg-gray-100 text-gray-600"}`}
      >
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
      <div>
        <h1 className="text-2xl font-poppins font-bold text-[#1C1C28]">Attendance</h1>
        <p className="text-[#4D4D4D] text-sm mt-1">
          Track and manage student attendance by session
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#1F4FD8]/10 rounded-xl flex items-center justify-center">
              <Users className="w-5 h-5 text-[#1F4FD8]" />
            </div>
            <div>
              <p className="text-xs text-[#4D4D4D]">Total Records</p>
              <p className="text-lg font-poppins font-bold text-[#1C1C28]">{stats.total}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-[#4D4D4D]">Present</p>
              <p className="text-lg font-poppins font-bold text-green-700">{stats.present}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
              <XCircle className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <p className="text-xs text-[#4D4D4D]">Absent</p>
              <p className="text-lg font-poppins font-bold text-red-600">{stats.absent}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-xs text-[#4D4D4D]">Late</p>
              <p className="text-lg font-poppins font-bold text-amber-700">{stats.late}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Course Selector */}
      <div className="flex items-center gap-3">
        <Filter className="w-4 h-4 text-[#4D4D4D]" />
        <select
          value={selectedCourseId}
          onChange={(e) => setSelectedCourseId(e.target.value)}
          className="px-4 py-2.5 border border-[#D4D4D4] rounded-xl bg-white text-[#1C1C28] text-sm focus:outline-none focus:ring-2 focus:ring-[#1F4FD8] focus:border-transparent min-w-[260px]"
        >
          <option value="">Select a course</option>
          {courses.map((c) => (
            <option key={c.id} value={c.id}>
              {c.title}
            </option>
          ))}
        </select>
      </div>

      {/* Sessions */}
      {!selectedCourseId ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <Calendar className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-[#4D4D4D] font-medium">Select a course to view sessions</p>
          <p className="text-sm text-[#9CA3AF] mt-1">
            Choose a course from the dropdown above to mark attendance
          </p>
        </div>
      ) : loadingSessions ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-[#1F4FD8]" />
        </div>
      ) : sessions.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <Calendar className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-[#4D4D4D] font-medium">No sessions found</p>
          <p className="text-sm text-[#9CA3AF] mt-1">
            There are no live sessions for this course yet
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {sessions.map((session, index) => {
            const marked = isSessionMarked(session.id);
            const isActive = activeSessionId === session.id;
            const sessionAttendance = existingAttendance[session.id] || [];

            return (
              <div
                key={session.id}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
              >
                {/* Session Header */}
                <div className="flex items-center justify-between px-6 py-4">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-[#1F4FD8]/10 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Calendar className="w-5 h-5 text-[#1F4FD8]" />
                    </div>
                    <div>
                      <h3 className="font-poppins font-semibold text-[#1C1C28] text-sm">
                        {session.session_number
                          ? `Session ${session.session_number}: ${session.title}`
                          : session.title}
                      </h3>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className="text-xs text-[#9CA3AF]">
                          {new Date(session.scheduled_at).toLocaleDateString("en-US", {
                            weekday: "short",
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
                            session.status === "completed"
                              ? "bg-green-100 text-green-700"
                              : session.status === "live"
                                ? "bg-blue-100 text-blue-700"
                                : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {session.status}
                        </span>
                        {marked && (
                          <span className="text-xs text-green-600 flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" />
                            Attendance marked ({sessionAttendance.length} students)
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => openAttendancePanel(session.id)}
                    className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl transition-all ${
                      marked
                        ? "text-[#1F4FD8] border border-[#1F4FD8]/30 hover:bg-[#1F4FD8]/5"
                        : "bg-[#1F4FD8] text-white hover:bg-[#1a45c2] shadow-md"
                    }`}
                  >
                    {marked ? "View / Edit" : "Mark Attendance"}
                    {isActive ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </button>
                </div>

                {/* Attendance Panel */}
                {isActive && (
                  <div className="border-t border-gray-100 px-6 py-5 bg-gray-50/50">
                    {loadingStudents ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-6 h-6 animate-spin text-[#1F4FD8]" />
                      </div>
                    ) : sessionStudents.length === 0 ? (
                      <p className="text-sm text-[#9CA3AF] text-center py-4">
                        No students enrolled in this course
                      </p>
                    ) : (
                      <>
                        <div className="space-y-3">
                          {sessionStudents.map((student) => {
                            const currentStatus = attendanceForm[student.id] || "";
                            return (
                              <div
                                key={student.id}
                                className="flex items-center justify-between bg-white rounded-xl px-4 py-3 border border-gray-100"
                              >
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 bg-[#1F4FD8] rounded-full flex items-center justify-center flex-shrink-0">
                                    <span className="text-white text-xs font-bold">
                                      {student.full_name?.charAt(0)?.toUpperCase() || "?"}
                                    </span>
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-[#1C1C28]">
                                      {student.full_name}
                                    </p>
                                    <p className="text-xs text-[#9CA3AF]">{student.email}</p>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2">
                                  {(["present", "absent", "late"] as const).map((status) => (
                                    <label
                                      key={status}
                                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-all border ${
                                        currentStatus === status
                                          ? status === "present"
                                            ? "bg-green-100 text-green-700 border-green-300"
                                            : status === "absent"
                                              ? "bg-red-100 text-red-600 border-red-300"
                                              : "bg-amber-100 text-amber-700 border-amber-300"
                                          : "bg-white text-[#4D4D4D] border-gray-200 hover:bg-gray-50"
                                      }`}
                                    >
                                      <input
                                        type="radio"
                                        name={`attendance-${session.id}-${student.id}`}
                                        value={status}
                                        checked={currentStatus === status}
                                        onChange={() => handleStatusChange(student.id, status)}
                                        className="sr-only"
                                      />
                                      {status === "present" && <CheckCircle className="w-3.5 h-3.5" />}
                                      {status === "absent" && <XCircle className="w-3.5 h-3.5" />}
                                      {status === "late" && <Clock className="w-3.5 h-3.5" />}
                                      <span className="capitalize">{status}</span>
                                    </label>
                                  ))}
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        <div className="flex gap-3 mt-4">
                          <button
                            onClick={() => saveAttendance(session.id)}
                            disabled={saving}
                            className="px-6 py-2.5 bg-[#1F4FD8] text-white font-semibold rounded-xl hover:bg-[#1a45c2] disabled:opacity-60 transition-all text-sm flex items-center gap-2"
                          >
                            {saving ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <CheckCircle className="w-4 h-4" />
                            )}
                            Save Attendance
                          </button>
                          <button
                            onClick={() => setActiveSessionId(null)}
                            className="px-6 py-2.5 text-[#4D4D4D] border border-[#D4D4D4] rounded-xl hover:bg-gray-50 transition-all text-sm"
                          >
                            Close
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
