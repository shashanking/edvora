"use client";

import React, { useEffect, useState, useCallback } from "react";
import { createClient } from "@/src/lib/supabase/client";
import { useSearchParams } from "next/navigation";
import {
  Search,
  ClipboardList,
  Plus,
  X,
  Trash2,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Check,
  AlertTriangle,
  Calendar,
  Clock,
  User,
  BookOpen,
  Users,
} from "lucide-react";
import toast from "react-hot-toast";
import { sendEnrollmentEmail } from "@/src/lib/emailjs";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Enrollment {
  id: string;
  student_id: string;
  course_id: string;
  teacher_id?: string;
  classes_per_week?: number;
  status: string;
  progress: number;
  enrolled_at: string;
  student_name?: string;
  student_email?: string;
  course_title?: string;
  teacher_name?: string;
}

interface StudentOption {
  id: string;
  full_name: string;
  email: string;
}

interface CourseOption {
  id: string;
  title: string;
  classes_per_week: number;
  total_sessions: number;
  duration: string;
}

interface TeacherOption {
  id: string;
  full_name: string;
  email: string;
}

interface ScheduleSlot {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

interface OverlapWarning {
  day: number;
  existing_student: string;
  existing_course: string;
  existing_time: string;
  requested_time: string;
}

interface TeacherExistingSchedule {
  day_of_week: number;
  start_time: string;
  end_time: string;
  student_name: string;
  course_title: string;
}

const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const DAY_OPTIONS = [
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
  { value: 0, label: "Sunday" },
];

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function AdminEnrollmentsPage() {
  const supabase = createClient() as any;
  const searchParams = useSearchParams();
  const preselectedStudentId = searchParams.get("student") || "";

  /* ---------- list state ---------- */
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusMenuId, setStatusMenuId] = useState<string | null>(null);

  /* ---------- wizard state ---------- */
  const [showModal, setShowModal] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [enrolling, setEnrolling] = useState(false);

  // Step 1
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [courses, setCourses] = useState<CourseOption[]>([]);
  const [selectedStudent, setSelectedStudent] = useState("");
  const [selectedCourse, setSelectedCourse] = useState("");
  const [selectedCourseData, setSelectedCourseData] =
    useState<CourseOption | null>(null);
  const [selectedClassesPerWeek, setSelectedClassesPerWeek] = useState(2);

  // Step 2
  const [teachers, setTeachers] = useState<TeacherOption[]>([]);
  const [selectedTeacher, setSelectedTeacher] = useState("");
  const [loadingTeachers, setLoadingTeachers] = useState(false);

  // Step 3
  const [schedule, setSchedule] = useState<ScheduleSlot[]>([]);
  const [startDate, setStartDate] = useState("");
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [overlaps, setOverlaps] = useState<OverlapWarning[]>([]);
  const [checkingOverlap, setCheckingOverlap] = useState(false);
  const [teacherSchedule, setTeacherSchedule] = useState<TeacherExistingSchedule[]>([]);
  const [loadingTeacherSchedule, setLoadingTeacherSchedule] = useState(false);

  /* ================================================================ */
  /*  Enrollment list                                                  */
  /* ================================================================ */

  const fetchEnrollments = useCallback(async () => {
    setLoading(true);

    let query = supabase
      .from("enrollments")
      .select("*")
      .order("enrolled_at", { ascending: false });

    if (statusFilter !== "all") {
      query = query.eq("status", statusFilter);
    }

    const { data } = await query;
    const rows = (data as Enrollment[]) || [];

    const studentIds = [...new Set(rows.map((r) => r.student_id))];
    const courseIds = [...new Set(rows.map((r) => r.course_id))];
    const teacherIds = [
      ...new Set(rows.map((r) => r.teacher_id).filter(Boolean)),
    ];

    const [{ data: studentsData }, { data: coursesData }, { data: teachersData }] =
      await Promise.all([
        supabase
          .from("profiles")
          .select("id, full_name, email")
          .in("id", studentIds.length ? studentIds : ["__none__"]),
        supabase
          .from("courses")
          .select("id, title")
          .in("id", courseIds.length ? courseIds : ["__none__"]),
        supabase
          .from("profiles")
          .select("id, full_name")
          .in("id", teacherIds.length ? teacherIds : ["__none__"]),
      ]);

    const studentMap = new Map(
      ((studentsData as any[]) || []).map((s: any) => [s.id, s])
    );
    const courseMap = new Map(
      ((coursesData as any[]) || []).map((c: any) => [c.id, c])
    );
    const teacherMap = new Map(
      ((teachersData as any[]) || []).map((t: any) => [t.id, t.full_name])
    );

    const enriched = rows.map((e) => ({
      ...e,
      student_name: studentMap.get(e.student_id)?.full_name || "Unknown",
      student_email: studentMap.get(e.student_id)?.email || "",
      course_title: courseMap.get(e.course_id)?.title || "Unknown",
      teacher_name: e.teacher_id
        ? teacherMap.get(e.teacher_id) || "Unknown"
        : "-",
    }));

    setEnrollments(enriched);
    setLoading(false);
  }, [statusFilter]);

  useEffect(() => {
    fetchEnrollments();
  }, [statusFilter]);

  /* ================================================================ */
  /*  Modal helpers                                                    */
  /* ================================================================ */

  const fetchModalData = async () => {
    const [{ data: studentsData }, { data: coursesData }] = await Promise.all([
      supabase
        .from("profiles")
        .select("id, full_name, email")
        .eq("role", "student")
        .order("full_name"),
      supabase
        .from("courses")
        .select("id, title, classes_per_week, total_sessions, duration")
        .eq("status", "published")
        .order("title"),
    ]);
    setStudents((studentsData as StudentOption[]) || []);
    setCourses((coursesData as CourseOption[]) || []);
  };

  const fetchTeachers = async (courseId: string) => {
    setLoadingTeachers(true);
    const { data: ctRows } = await supabase
      .from("course_teachers")
      .select("teacher_id")
      .eq("course_id", courseId);

    if (!ctRows || ctRows.length === 0) {
      setTeachers([]);
      setLoadingTeachers(false);
      return;
    }

    const tIds = (ctRows as any[]).map((r: any) => r.teacher_id);
    const { data: tProfiles } = await supabase
      .from("profiles")
      .select("id, full_name, email")
      .in("id", tIds)
      .order("full_name");

    setTeachers((tProfiles as TeacherOption[]) || []);
    setLoadingTeachers(false);
  };

  const fetchTeacherSchedule = async (teacherId: string) => {
    setLoadingTeacherSchedule(true);
    setTeacherSchedule([]);

    // Find all active enrollments for this teacher
    const { data: tEnrollments } = await supabase
      .from("enrollments")
      .select("student_id, course_id")
      .eq("teacher_id", teacherId)
      .eq("status", "active");

    if (!tEnrollments || tEnrollments.length === 0) {
      setLoadingTeacherSchedule(false);
      return;
    }

    const studentIds = tEnrollments.map((e: any) => e.student_id);
    const courseIds = tEnrollments.map((e: any) => e.course_id);

    // Fetch confirmed schedules for those students+courses
    const { data: schedules } = await supabase
      .from("student_schedules")
      .select("*")
      .in("student_id", studentIds)
      .in("course_id", courseIds);

    if (!schedules || schedules.length === 0) {
      setLoadingTeacherSchedule(false);
      return;
    }

    // Get student names and course titles for display
    const [{ data: studentsData }, { data: coursesData }] = await Promise.all([
      supabase.from("profiles").select("id, full_name").in("id", studentIds),
      supabase.from("courses").select("id, title").in("id", courseIds),
    ]);
    const sMap = new Map(((studentsData as any[]) || []).map((s: any) => [s.id, s.full_name]));
    const cMap = new Map(((coursesData as any[]) || []).map((c: any) => [c.id, c.title]));

    const mapped: TeacherExistingSchedule[] = (schedules as any[]).map((s: any) => ({
      day_of_week: s.day_of_week,
      start_time: s.confirmed_start_time || s.preferred_start_time,
      end_time: s.confirmed_end_time || s.preferred_end_time,
      student_name: sMap.get(s.student_id) || "Unknown",
      course_title: cMap.get(s.course_id) || "Unknown",
    }));

    // Sort by day then start time
    mapped.sort((a, b) => a.day_of_week - b.day_of_week || a.start_time.localeCompare(b.start_time));
    setTeacherSchedule(mapped);
    setLoadingTeacherSchedule(false);
  };

  useEffect(() => {
    if (preselectedStudentId) {
      setSelectedStudent(preselectedStudentId);
      setShowModal(true);
      fetchModalData();
    }
  }, [preselectedStudentId]);

  const openModal = () => {
    setWizardStep(1);
    setSelectedStudent(preselectedStudentId || "");
    setSelectedCourse("");
    setSelectedCourseData(null);
    setSelectedClassesPerWeek(2);
    setSelectedTeacher("");
    setTeachers([]);
    setSchedule([]);
    setStartDate("");
    setDurationMinutes(60);
    setOverlaps([]);
    setShowModal(true);
    fetchModalData();
  };

  const closeModal = () => {
    setShowModal(false);
    setWizardStep(1);
    setSelectedStudent("");
    setSelectedCourse("");
    setSelectedCourseData(null);
    setSelectedClassesPerWeek(2);
    setSelectedTeacher("");
    setTeachers([]);
    setSchedule([]);
    setStartDate("");
    setDurationMinutes(60);
    setOverlaps([]);
    setTeacherSchedule([]);
  };

  /* ================================================================ */
  /*  Course selection handler                                         */
  /* ================================================================ */

  const handleCourseSelect = (courseId: string) => {
    setSelectedCourse(courseId);
    const c = courses.find((x) => x.id === courseId) || null;
    setSelectedCourseData(c);
  };

  /* ================================================================ */
  /*  Step navigation                                                  */
  /* ================================================================ */

  const goToStep2 = () => {
    if (!selectedStudent || !selectedCourse) {
      toast.error("Please select both a student and a course.");
      return;
    }
    fetchTeachers(selectedCourse);
    setWizardStep(2);
  };

  const goToStep3 = () => {
    if (!selectedTeacher) {
      toast.error("Please select a teacher.");
      return;
    }
    const cpw = selectedClassesPerWeek;
    if (schedule.length !== cpw) {
      setSchedule(
        Array.from({ length: cpw }, () => ({
          dayOfWeek: 1,
          startTime: "09:00",
          endTime: "10:00",
        }))
      );
    }
    setOverlaps([]);
    setWizardStep(3);
  };

  const goToStep4 = () => {
    const cpw = selectedClassesPerWeek;
    if (schedule.length !== cpw) {
      toast.error(
        `Please configure exactly ${cpw} schedule slot${cpw > 1 ? "s" : ""}.`
      );
      return;
    }

    for (let i = 0; i < schedule.length; i++) {
      const s = schedule[i];
      if (!s.startTime || !s.endTime) {
        toast.error(`Slot ${i + 1}: please set both start and end time.`);
        return;
      }
      if (s.endTime <= s.startTime) {
        toast.error(`Slot ${i + 1}: end time must be after start time.`);
        return;
      }
    }

    if (!startDate) {
      toast.error("Please select a start date.");
      return;
    }

    setWizardStep(4);
  };

  /* ================================================================ */
  /*  Overlap check (auto-runs when schedule changes)                  */
  /* ================================================================ */

  const checkOverlap = useCallback(async (silent = false) => {
    if (!selectedTeacher || schedule.length === 0) return;
    // Don't auto-check if slots are incomplete
    const allValid = schedule.every((s) => s.startTime && s.endTime && s.endTime > s.startTime);
    if (!allValid) return;

    setCheckingOverlap(true);
    try {
      const res = await fetch("/api/teacher/check-overlap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teacher_id: selectedTeacher, schedule }),
      });
      const data = await res.json();
      setOverlaps(data.overlaps || []);
      if (!silent && data.overlaps?.length) {
        toast.error(
          `Found ${data.overlaps.length} schedule overlap(s). Review warnings below.`
        );
      }
    } catch {
      if (!silent) toast.error("Failed to check overlaps.");
    }
    setCheckingOverlap(false);
  }, [selectedTeacher, schedule]);

  // Auto-run overlap check when schedule slots change in step 3
  useEffect(() => {
    if (wizardStep !== 3) return;
    const allValid = schedule.every((s) => s.startTime && s.endTime && s.endTime > s.startTime);
    if (!allValid || !selectedTeacher) return;

    const timer = setTimeout(() => checkOverlap(true), 500);
    return () => clearTimeout(timer);
  }, [schedule, wizardStep, selectedTeacher, checkOverlap]);

  /* ================================================================ */
  /*  Confirm & Create                                                 */
  /* ================================================================ */

  const handleConfirm = async () => {
    setEnrolling(true);

    try {
      // 1. Duplicate check
      const { data: existing } = await supabase
        .from("enrollments")
        .select("id")
        .eq("student_id", selectedStudent)
        .eq("course_id", selectedCourse)
        .maybeSingle();

      if (existing) {
        toast.error("This student is already enrolled in this course.");
        setEnrolling(false);
        return;
      }

      // 2. Insert enrollment
      const { data: enrollment, error: enrErr } = await supabase
        .from("enrollments")
        .insert({
          student_id: selectedStudent,
          course_id: selectedCourse,
          teacher_id: selectedTeacher,
          classes_per_week: selectedClassesPerWeek,
          status: "active",
          progress: 0,
        })
        .select("id")
        .single();

      if (enrErr) {
        toast.error("Failed to create enrollment. " + enrErr.message);
        setEnrolling(false);
        return;
      }

      // 3. Insert student_schedules
      const scheduleRows = schedule.map((s) => ({
        student_id: selectedStudent,
        course_id: selectedCourse,
        day_of_week: s.dayOfWeek,
        preferred_start_time: s.startTime,
        preferred_end_time: s.endTime,
        confirmed_start_time: s.startTime,
        confirmed_end_time: s.endTime,
        status: "confirmed",
      }));

      const { error: schedErr } = await supabase
        .from("student_schedules")
        .insert(scheduleRows);

      if (schedErr) {
        console.error("Schedule insert error:", schedErr.message);
        toast.error("Enrollment created but schedule save failed.");
      }

      // 4. Batch create Zoom sessions
      const courseTitle =
        courses.find((c) => c.id === selectedCourse)?.title || "Course";
      const totalSessions =
        selectedCourseData?.total_sessions || 8;

      let sessionsCreated = 0;
      try {
        const res = await fetch("/api/zoom/batch-create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            enrollment_id: enrollment.id,
            course_id: selectedCourse,
            teacher_id: selectedTeacher,
            student_id: selectedStudent,
            course_title: courseTitle,
            total_sessions: totalSessions,
            classes_per_week: selectedClassesPerWeek,
            schedule,
            start_date: startDate,
            duration_minutes: durationMinutes,
          }),
        });
        const zoomData = await res.json();
        sessionsCreated = zoomData.total_created || 0;
      } catch {
        console.error("Zoom batch-create failed");
      }

      // 5. Send enrollment email
      const student = students.find((s) => s.id === selectedStudent);
      if (student) {
        sendEnrollmentEmail({
          studentName: student.full_name,
          studentEmail: student.email,
          courseName: courseTitle,
        });
      }

      // 6. Success
      toast.success(
        `Enrollment created! ${sessionsCreated} session${sessionsCreated !== 1 ? "s" : ""} scheduled.`
      );

      closeModal();
      fetchEnrollments();
    } catch (err: any) {
      toast.error("Something went wrong: " + err.message);
    }

    setEnrolling(false);
  };

  /* ================================================================ */
  /*  Table helpers                                                    */
  /* ================================================================ */

  const handleStatusChange = async (
    enrollmentId: string,
    newStatus: string
  ) => {
    const { error } = await supabase
      .from("enrollments")
      .update({ status: newStatus })
      .eq("id", enrollmentId);

    if (error) {
      toast.error("Failed to update status.");
      return;
    }

    toast.success(`Status updated to ${newStatus}.`);
    setStatusMenuId(null);
    fetchEnrollments();
  };

  const handleDelete = async (enrollmentId: string) => {
    if (
      !confirm(
        "Delete this enrollment? This will also remove its weekly schedules, all scheduled sessions, and the associated Zoom meetings."
      )
    )
      return;

    // 1. Look up the enrollment so we know which student/course schedules to clear.
    const { data: enrollment, error: fetchErr } = await supabase
      .from("enrollments")
      .select("student_id, course_id")
      .eq("id", enrollmentId)
      .single();

    if (fetchErr || !enrollment) {
      toast.error("Enrollment not found.");
      return;
    }

    // 2. Delete Zoom meetings for every live_session attached to this enrollment.
    //    The DB rows themselves cascade-delete via the enrollment_id FK in step 4,
    //    so here we only need to tell Zoom to drop the meetings.
    const { data: sessions } = await supabase
      .from("live_sessions")
      .select("id, zoom_meeting_id")
      .eq("enrollment_id", enrollmentId);

    if (sessions?.length) {
      await Promise.all(
        sessions
          .filter((s: any) => s.zoom_meeting_id)
          .map((s: any) =>
            fetch("/api/zoom/delete-meeting", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                meeting_id: s.zoom_meeting_id,
                session_id: s.id,
              }),
            }).catch(() => {})
          )
      );
    }

    // 3. Delete student_schedules for this student+course (no FK to enrollments).
    const { error: schedDelErr } = await supabase
      .from("student_schedules")
      .delete()
      .eq("student_id", enrollment.student_id)
      .eq("course_id", enrollment.course_id);

    if (schedDelErr) {
      console.error("Schedule delete error:", schedDelErr.message);
    }

    // 4. Delete the enrollment — live_sessions cascade via ON DELETE CASCADE.
    const { error } = await supabase
      .from("enrollments")
      .delete()
      .eq("id", enrollmentId);

    if (error) {
      toast.error("Failed to delete enrollment.");
      return;
    }

    toast.success("Enrollment, sessions, and schedules deleted.");
    fetchEnrollments();
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      active: "bg-green-100 text-green-700",
      completed: "bg-blue-100 text-blue-700",
      cancelled: "bg-red-100 text-red-600",
    };
    return (
      <span
        className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${styles[status] || "bg-gray-100 text-gray-600"}`}
      >
        {status}
      </span>
    );
  };

  const filteredEnrollments = enrollments.filter((e) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      e.student_name?.toLowerCase().includes(q) ||
      e.student_email?.toLowerCase().includes(q) ||
      e.course_title?.toLowerCase().includes(q) ||
      e.teacher_name?.toLowerCase().includes(q)
    );
  });

  /* ================================================================ */
  /*  Schedule slot updater                                            */
  /* ================================================================ */

  const updateSlot = (
    idx: number,
    field: keyof ScheduleSlot,
    value: string | number
  ) => {
    setSchedule((prev) =>
      prev.map((s, i) => (i === idx ? { ...s, [field]: value } : s))
    );
    setOverlaps([]);
  };

  /* ================================================================ */
  /*  Wizard step labels                                               */
  /* ================================================================ */

  const stepLabels = ["Student & Course", "Teacher", "Schedule", "Review"];

  /* ================================================================ */
  /*  Render helpers                                                   */
  /* ================================================================ */

  const selectedStudentData = students.find((s) => s.id === selectedStudent);
  const selectedTeacherData = teachers.find((t) => t.id === selectedTeacher);

  /* ================================================================ */
  /*  JSX                                                              */
  /* ================================================================ */

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-poppins font-bold text-[#1C1C28]">
            Enrollments
          </h1>
          <p className="text-[#4D4D4D] text-sm mt-1">
            Track and manage all student enrollments
          </p>
        </div>
        <button
          onClick={openModal}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#1F4FD8] text-white text-sm font-medium rounded-xl hover:bg-[#1a44be] transition-colors"
        >
          <Plus className="w-4 h-4" />
          Enroll Student
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative max-w-xs flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
          <input
            type="text"
            placeholder="Search enrollments..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-[#D4D4D4] rounded-xl bg-white text-[#1C1C28] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#1F4FD8] focus:border-transparent text-sm"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2.5 border border-[#D4D4D4] rounded-xl bg-white text-[#1C1C28] text-sm focus:outline-none focus:ring-2 focus:ring-[#1F4FD8]"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-[#1F4FD8]/30 border-t-[#1F4FD8] rounded-full animate-spin" />
          </div>
        ) : filteredEnrollments.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <ClipboardList className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-[#4D4D4D] font-medium">No enrollments found</p>
            <p className="text-sm text-[#9CA3AF] mt-1">
              Click &quot;Enroll Student&quot; to add one manually
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 text-left">
                  <th className="px-6 py-4 text-xs font-semibold text-[#4D4D4D] uppercase tracking-wider">
                    Student
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold text-[#4D4D4D] uppercase tracking-wider">
                    Course
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold text-[#4D4D4D] uppercase tracking-wider">
                    Teacher
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold text-[#4D4D4D] uppercase tracking-wider">
                    Progress
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold text-[#4D4D4D] uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold text-[#4D4D4D] uppercase tracking-wider">
                    Enrolled
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold text-[#4D4D4D] uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredEnrollments.map((e) => (
                  <tr
                    key={e.id}
                    className="hover:bg-gray-50/50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <p className="font-medium text-[#1C1C28] text-sm">
                        {e.student_name}
                      </p>
                      <p className="text-xs text-[#9CA3AF]">
                        {e.student_email}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-sm text-[#4D4D4D]">
                      {e.course_title}
                    </td>
                    <td className="px-6 py-4 text-sm text-[#4D4D4D]">
                      {e.teacher_name}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#1F4FD8] rounded-full"
                            style={{ width: `${e.progress}%` }}
                          />
                        </div>
                        <span className="text-xs text-[#4D4D4D]">
                          {e.progress}%
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">{getStatusBadge(e.status)}</td>
                    <td className="px-6 py-4 text-sm text-[#9CA3AF]">
                      {new Date(e.enrolled_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1">
                        <div className="relative">
                          <button
                            onClick={() =>
                              setStatusMenuId(
                                statusMenuId === e.id ? null : e.id
                              )
                            }
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-[#4D4D4D] hover:bg-gray-100 rounded-lg transition-all"
                          >
                            Status
                            <ChevronDown className="w-3 h-3" />
                          </button>
                          {statusMenuId === e.id && (
                            <div className="absolute right-0 top-full mt-1 w-36 bg-white border border-gray-200 rounded-xl shadow-lg z-20 py-1">
                              {["active", "completed", "cancelled"]
                                .filter((s) => s !== e.status)
                                .map((s) => (
                                  <button
                                    key={s}
                                    onClick={() =>
                                      handleStatusChange(e.id, s)
                                    }
                                    className="w-full text-left px-4 py-2 text-sm text-[#1C1C28] hover:bg-gray-50 capitalize"
                                  >
                                    {s}
                                  </button>
                                ))}
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => handleDelete(e.id)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-red-500 hover:bg-red-50 rounded-lg transition-all"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Close status menu on outside click */}
      {statusMenuId && (
        <div
          className="fixed inset-0 z-10"
          onClick={() => setStatusMenuId(null)}
        />
      )}

      {/* ============================================================ */}
      {/*  Multi-step Enrollment Wizard Modal                           */}
      {/* ============================================================ */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={closeModal}
          />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] flex flex-col">
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100">
              <h2 className="text-lg font-poppins font-bold text-[#1C1C28]">
                Enroll Student
              </h2>
              <button
                onClick={closeModal}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-[#4D4D4D]" />
              </button>
            </div>

            {/* Step indicators */}
            <div className="px-6 pt-4 pb-2">
              <div className="flex items-center gap-1">
                {stepLabels.map((label, i) => {
                  const step = i + 1;
                  const isActive = wizardStep === step;
                  const isDone = wizardStep > step;
                  return (
                    <React.Fragment key={step}>
                      <div className="flex items-center gap-1.5">
                        <div
                          className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-colors ${
                            isDone
                              ? "bg-green-500 text-white"
                              : isActive
                                ? "bg-[#1F4FD8] text-white"
                                : "bg-gray-100 text-[#9CA3AF]"
                          }`}
                        >
                          {isDone ? (
                            <Check className="w-3.5 h-3.5" />
                          ) : (
                            step
                          )}
                        </div>
                        <span
                          className={`text-xs hidden sm:block ${isActive ? "text-[#1C1C28] font-medium" : "text-[#9CA3AF]"}`}
                        >
                          {label}
                        </span>
                      </div>
                      {i < stepLabels.length - 1 && (
                        <div
                          className={`flex-1 h-0.5 mx-1 rounded ${isDone ? "bg-green-500" : "bg-gray-100"}`}
                        />
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
            </div>

            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {/* ---- Step 1: Student & Course ---- */}
              {wizardStep === 1 && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-[#1C1C28] mb-1.5">
                      <User className="w-4 h-4 inline mr-1.5 text-[#1F4FD8]" />
                      Student
                    </label>
                    <select
                      value={selectedStudent}
                      onChange={(e) => setSelectedStudent(e.target.value)}
                      className="w-full px-4 py-2.5 border border-[#D4D4D4] rounded-xl bg-white text-[#1C1C28] text-sm focus:outline-none focus:ring-2 focus:ring-[#1F4FD8]"
                    >
                      <option value="">Select a student...</option>
                      {students.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.full_name} ({s.email})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#1C1C28] mb-1.5">
                      <BookOpen className="w-4 h-4 inline mr-1.5 text-[#1F4FD8]" />
                      Course
                    </label>
                    <select
                      value={selectedCourse}
                      onChange={(e) => handleCourseSelect(e.target.value)}
                      className="w-full px-4 py-2.5 border border-[#D4D4D4] rounded-xl bg-white text-[#1C1C28] text-sm focus:outline-none focus:ring-2 focus:ring-[#1F4FD8]"
                    >
                      <option value="">Select a course...</option>
                      {courses.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.title}
                        </option>
                      ))}
                    </select>
                  </div>

                  {selectedCourseData && (
                    <div className="bg-[#F8F9FB] rounded-xl p-4 space-y-1.5">
                      <p className="text-xs font-semibold text-[#4D4D4D] uppercase tracking-wider mb-2">
                        Course Details
                      </p>
                      <p className="text-sm text-[#1C1C28]">
                        <span className="text-[#4D4D4D]">
                          Classes per week:
                        </span>{" "}
                        <strong>
                          {selectedClassesPerWeek}
                        </strong>
                      </p>
                      <p className="text-sm text-[#1C1C28]">
                        <span className="text-[#4D4D4D]">
                          Total sessions:
                        </span>{" "}
                        <strong>{selectedCourseData.total_sessions}</strong>
                      </p>
                      <p className="text-sm text-[#1C1C28]">
                        <span className="text-[#4D4D4D]">Duration:</span>{" "}
                        <strong>{selectedCourseData.duration}</strong>
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* ---- Step 2: Teacher ---- */}
              {wizardStep === 2 && (
                <div className="space-y-4">
                  <p className="text-sm text-[#4D4D4D]">
                    Choose the weekly class count and select a teacher assigned to{" "}
                    <strong>
                      {courses.find((c) => c.id === selectedCourse)?.title}
                    </strong>
                    :
                  </p>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-[#1C1C28]">
                      Classes per week
                    </label>
                    <div className="flex flex-wrap gap-3">
                      {[2, 3, 4].map((count) => (
                        <button
                          key={count}
                          type="button"
                          onClick={() => {
                            setSelectedClassesPerWeek(count);
                            setSchedule((prev) => {
                              const next = prev.slice(0, count);
                              while (next.length < count) {
                                next.push({
                                  dayOfWeek: 1,
                                  startTime: "09:00",
                                  endTime: "10:00",
                                });
                              }
                              return next;
                            });
                          }}
                          className={`px-4 py-2 rounded-full border text-sm font-medium transition-all ${
                            selectedClassesPerWeek === count
                              ? "bg-[#1F4FD8] text-white border-[#1F4FD8]"
                              : "bg-white text-[#1C1C28] border-[#D4D4D4] hover:border-[#1F4FD8]"
                          }`}
                        >
                          {count} classes/week
                        </button>
                      ))}
                    </div>
                  </div>

                  {loadingTeachers ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="w-6 h-6 border-2 border-[#1F4FD8]/30 border-t-[#1F4FD8] rounded-full animate-spin" />
                    </div>
                  ) : teachers.length === 0 ? (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-amber-800">
                          No teachers assigned
                        </p>
                        <p className="text-xs text-amber-600 mt-1">
                          This course has no assigned teachers yet. Please
                          assign a teacher to the course first from the
                          Courses management page.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {teachers.map((t) => (
                        <label
                          key={t.id}
                          className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                            selectedTeacher === t.id
                              ? "border-[#1F4FD8] bg-[#1F4FD8]/5"
                              : "border-[#D4D4D4] hover:border-[#1F4FD8]/40"
                          }`}
                        >
                          <input
                            type="radio"
                            name="teacher"
                            value={t.id}
                            checked={selectedTeacher === t.id}
                            onChange={() => {
                              setSelectedTeacher(t.id);
                              fetchTeacherSchedule(t.id);
                            }}
                            className="accent-[#1F4FD8]"
                          />
                          <div>
                            <p className="text-sm font-medium text-[#1C1C28]">
                              {t.full_name}
                            </p>
                            <p className="text-xs text-[#9CA3AF]">
                              {t.email}
                            </p>
                          </div>
                        </label>
                      ))}
                    </div>
                  )}

                  {/* Teacher's existing schedule */}
                  {selectedTeacher && (
                    <div className="mt-4">
                      <p className="text-xs font-semibold text-[#4D4D4D] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-[#1F4FD8]" />
                        Teacher&apos;s Current Schedule
                      </p>
                      {loadingTeacherSchedule ? (
                        <div className="flex items-center gap-2 py-3 text-sm text-[#9CA3AF]">
                          <div className="w-4 h-4 border-2 border-[#1F4FD8]/30 border-t-[#1F4FD8] rounded-full animate-spin" />
                          Loading schedule...
                        </div>
                      ) : teacherSchedule.length === 0 ? (
                        <div className="bg-green-50 border border-green-200 rounded-xl p-3">
                          <p className="text-sm text-green-700 flex items-center gap-1.5">
                            <Check className="w-4 h-4" />
                            This teacher has no existing sessions scheduled. All slots are free.
                          </p>
                        </div>
                      ) : (
                        <div className="bg-[#F8F9FB] rounded-xl p-3 space-y-1.5 max-h-48 overflow-y-auto">
                          {teacherSchedule.map((ts, i) => (
                            <div
                              key={i}
                              className="flex items-center gap-2 text-sm py-1 border-b border-gray-100 last:border-0"
                            >
                              <span className="font-medium text-[#1C1C28] w-24 shrink-0">
                                {DAY_NAMES[ts.day_of_week]}
                              </span>
                              <span className="text-[#1F4FD8] font-mono text-xs bg-[#1F4FD8]/10 px-2 py-0.5 rounded">
                                {ts.start_time} - {ts.end_time}
                              </span>
                              <span className="text-[#4D4D4D] truncate">
                                {ts.student_name}
                              </span>
                              <span className="text-[#9CA3AF] text-xs truncate ml-auto">
                                {ts.course_title}
                              </span>
                            </div>
                          ))}
                          <p className="text-xs text-[#9CA3AF] mt-2 pt-2 border-t border-gray-200">
                            {teacherSchedule.length} existing slot{teacherSchedule.length !== 1 ? "s" : ""} booked. Avoid overlapping times in the next step.
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* ---- Step 3: Schedule ---- */}
              {wizardStep === 3 && (
                <div className="space-y-5">
                  <p className="text-sm text-[#4D4D4D]">
                    Configure{" "}
                    <strong>
                      {selectedClassesPerWeek}
                    </strong>{" "}
                    weekly class slot
                    {selectedClassesPerWeek > 1
                      ? "s"
                      : ""}
                    :
                  </p>

                  {schedule.map((slot, idx) => (
                    <div
                      key={idx}
                      className="bg-[#F8F9FB] rounded-xl p-4 space-y-3"
                    >
                      <p className="text-xs font-semibold text-[#4D4D4D] uppercase tracking-wider">
                        Slot {idx + 1}
                      </p>
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <label className="block text-xs text-[#4D4D4D] mb-1">
                            Day
                          </label>
                          <select
                            value={slot.dayOfWeek}
                            onChange={(e) =>
                              updateSlot(
                                idx,
                                "dayOfWeek",
                                Number(e.target.value)
                              )
                            }
                            className="w-full px-3 py-2 border border-[#D4D4D4] rounded-lg bg-white text-[#1C1C28] text-sm focus:outline-none focus:ring-2 focus:ring-[#1F4FD8]"
                          >
                            {DAY_OPTIONS.map((d) => (
                              <option key={d.value} value={d.value}>
                                {d.label}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs text-[#4D4D4D] mb-1">
                            Start Time
                          </label>
                          <input
                            type="time"
                            value={slot.startTime}
                            onChange={(e) =>
                              updateSlot(idx, "startTime", e.target.value)
                            }
                            className="w-full px-3 py-2 border border-[#D4D4D4] rounded-lg bg-white text-[#1C1C28] text-sm focus:outline-none focus:ring-2 focus:ring-[#1F4FD8]"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-[#4D4D4D] mb-1">
                            End Time
                          </label>
                          <input
                            type="time"
                            value={slot.endTime}
                            onChange={(e) =>
                              updateSlot(idx, "endTime", e.target.value)
                            }
                            className="w-full px-3 py-2 border border-[#D4D4D4] rounded-lg bg-white text-[#1C1C28] text-sm focus:outline-none focus:ring-2 focus:ring-[#1F4FD8]"
                          />
                        </div>
                      </div>
                      {slot.endTime &&
                        slot.startTime &&
                        slot.endTime <= slot.startTime && (
                          <p className="text-xs text-red-500 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            End time must be after start time
                          </p>
                        )}
                    </div>
                  ))}

                  {/* Teacher's booked slots reference */}
                  {teacherSchedule.length > 0 && (
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
                      <p className="text-xs font-semibold text-blue-700 uppercase tracking-wider mb-2">
                        {selectedTeacherData?.full_name}&apos;s booked slots
                      </p>
                      <div className="grid grid-cols-1 gap-1">
                        {teacherSchedule.map((ts, i) => (
                          <div key={i} className="flex items-center gap-2 text-xs text-blue-800">
                            <span className="font-medium w-20">{DAY_NAMES[ts.day_of_week]}</span>
                            <span className="font-mono bg-blue-100 px-1.5 py-0.5 rounded">
                              {ts.start_time}-{ts.end_time}
                            </span>
                            <span className="text-blue-600 truncate">{ts.student_name} / {ts.course_title}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Overlap status */}
                  {checkingOverlap && (
                    <div className="flex items-center gap-2 text-sm text-[#9CA3AF]">
                      <div className="w-4 h-4 border-2 border-[#1F4FD8]/30 border-t-[#1F4FD8] rounded-full animate-spin" />
                      Checking for overlaps...
                    </div>
                  )}

                  {overlaps.length > 0 && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4 space-y-2">
                      <p className="text-sm font-medium text-red-700 flex items-center gap-1.5">
                        <AlertTriangle className="w-4 h-4" />
                        Schedule Overlaps Detected
                      </p>
                      {overlaps.map((o, i) => (
                        <p key={i} className="text-xs text-red-600">
                          {DAY_NAMES[o.day]}: {o.requested_time} overlaps
                          with {o.existing_student} ({o.existing_course}) at{" "}
                          {o.existing_time}
                        </p>
                      ))}
                    </div>
                  )}

                  {/* Start date & duration */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-[#1C1C28] mb-1.5">
                        <Calendar className="w-4 h-4 inline mr-1.5 text-[#1F4FD8]" />
                        Start Date
                      </label>
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full px-3 py-2.5 border border-[#D4D4D4] rounded-xl bg-white text-[#1C1C28] text-sm focus:outline-none focus:ring-2 focus:ring-[#1F4FD8]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#1C1C28] mb-1.5">
                        <Clock className="w-4 h-4 inline mr-1.5 text-[#1F4FD8]" />
                        Duration (min)
                      </label>
                      <input
                        type="number"
                        min={15}
                        max={240}
                        value={durationMinutes}
                        onChange={(e) =>
                          setDurationMinutes(Number(e.target.value))
                        }
                        className="w-full px-3 py-2.5 border border-[#D4D4D4] rounded-xl bg-white text-[#1C1C28] text-sm focus:outline-none focus:ring-2 focus:ring-[#1F4FD8]"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* ---- Step 4: Review ---- */}
              {wizardStep === 4 && (
                <div className="space-y-4">
                  <p className="text-sm text-[#4D4D4D] mb-2">
                    Please review the enrollment details before confirming:
                  </p>

                  <div className="bg-[#F8F9FB] rounded-xl p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-[#1F4FD8]" />
                      <span className="text-sm text-[#4D4D4D]">Student:</span>
                      <span className="text-sm font-medium text-[#1C1C28]">
                        {selectedStudentData?.full_name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-[#1F4FD8]" />
                      <span className="text-sm text-[#4D4D4D]">Course:</span>
                      <span className="text-sm font-medium text-[#1C1C28]">
                        {courses.find((c) => c.id === selectedCourse)?.title}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-[#1F4FD8]" />
                      <span className="text-sm text-[#4D4D4D]">Teacher:</span>
                      <span className="text-sm font-medium text-[#1C1C28]">
                        {selectedTeacherData?.full_name}
                      </span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Calendar className="w-4 h-4 text-[#1F4FD8] mt-0.5" />
                      <div>
                        <span className="text-sm text-[#4D4D4D]">
                          Schedule:
                        </span>
                        <div className="mt-1 space-y-1">
                          {schedule.map((s, i) => (
                            <p
                              key={i}
                              className="text-sm font-medium text-[#1C1C28]"
                            >
                              {DAY_NAMES[s.dayOfWeek]} {s.startTime} -{" "}
                              {s.endTime}
                            </p>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-[#1F4FD8]" />
                      <span className="text-sm text-[#4D4D4D]">
                        Start Date:
                      </span>
                      <span className="text-sm font-medium text-[#1C1C28]">
                        {new Date(startDate + "T00:00:00").toLocaleDateString(
                          undefined,
                          {
                            weekday: "long",
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          }
                        )}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-[#1F4FD8]" />
                      <span className="text-sm text-[#4D4D4D]">
                        Total Sessions:
                      </span>
                      <span className="text-sm font-medium text-[#1C1C28]">
                        {selectedCourseData?.total_sessions || 8}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-[#1F4FD8]" />
                      <span className="text-sm text-[#4D4D4D]">
                        Duration per session:
                      </span>
                      <span className="text-sm font-medium text-[#1C1C28]">
                        {durationMinutes} minutes
                      </span>
                    </div>
                  </div>

                  {overlaps.length > 0 && (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                      <p className="text-xs text-amber-700">
                        Warning: {overlaps.length} schedule overlap(s) were
                        detected. The enrollment will still be created.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer buttons */}
            <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
              {wizardStep > 1 && (
                <button
                  onClick={() => setWizardStep((s) => s - 1)}
                  disabled={enrolling}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 border border-[#D4D4D4] text-[#4D4D4D] text-sm font-medium rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Back
                </button>
              )}

              <div className="flex-1" />

              {wizardStep === 1 && (
                <>
                  <button
                    onClick={closeModal}
                    className="px-4 py-2.5 border border-[#D4D4D4] text-[#4D4D4D] text-sm font-medium rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={goToStep2}
                    className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-[#1F4FD8] text-white text-sm font-medium rounded-xl hover:bg-[#1a44be] transition-colors"
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </>
              )}

              {wizardStep === 2 && (
                <button
                  onClick={goToStep3}
                  disabled={!selectedTeacher || teachers.length === 0}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-[#1F4FD8] text-white text-sm font-medium rounded-xl hover:bg-[#1a44be] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}

              {wizardStep === 3 && (
                <button
                  onClick={goToStep4}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-[#1F4FD8] text-white text-sm font-medium rounded-xl hover:bg-[#1a44be] transition-colors"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}

              {wizardStep === 4 && (
                <button
                  onClick={handleConfirm}
                  disabled={enrolling}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#1F4FD8] text-white text-sm font-medium rounded-xl hover:bg-[#1a44be] transition-colors disabled:opacity-50"
                >
                  {enrolling ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      Confirm & Create
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
