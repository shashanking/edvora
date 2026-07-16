"use client";

import React, { useCallback, useEffect, useState } from "react";
import { createClient } from "@/src/lib/supabase/client";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Video,
  ExternalLink,
  Calendar,
  Clock,
  BookOpen,
} from "lucide-react";

interface SessionRow {
  id: string;
  session_number: number;
  title: string;
  scheduled_at: string;
  duration_minutes: number;
  status: string;
  zoom_join_url: string | null;
  zoom_start_url: string | null;
  lesson_id: string | null;
  lesson_title: string | null;
}

interface StudentGroup {
  enrollment_id: string;
  student_name: string;
  teacher_name: string;
  sessions: SessionRow[];
}

function statusBadge(status: string) {
  const styles: Record<string, string> = {
    scheduled: "bg-blue-100 text-blue-700",
    live: "bg-red-50 text-red-600 animate-pulse",
    completed: "bg-green-100 text-green-700",
    cancelled: "bg-gray-100 text-gray-500",
  };
  return (
    <span
      className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
        styles[status] || "bg-gray-100 text-gray-500"
      }`}
    >
      {status}
    </span>
  );
}

export default function AdminCourseLiveSessionsPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.id as string;
  const supabase = createClient() as any;

  const [courseTitle, setCourseTitle] = useState("");
  const [groups, setGroups] = useState<StudentGroup[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);

    const { data: course } = await supabase
      .from("courses")
      .select("title")
      .eq("id", courseId)
      .single();
    setCourseTitle(course?.title || "Course");

    const { data: enrollmentRows } = await supabase
      .from("enrollments")
      .select("id, student_id, teacher_id")
      .eq("course_id", courseId);
    const enrollments = (enrollmentRows as { id: string; student_id: string; teacher_id: string | null }[]) || [];

    const profileIds = [
      ...new Set(enrollments.flatMap((e) => [e.student_id, e.teacher_id].filter(Boolean))),
    ] as string[];
    const profileMap = new Map<string, string>();
    if (profileIds.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", profileIds);
      ((profiles as { id: string; full_name: string }[]) || []).forEach((p) =>
        profileMap.set(p.id, p.full_name || "Unnamed")
      );
    }

    const { data: sessionRows } = await supabase
      .from("live_sessions")
      .select("id, enrollment_id, session_number, title, scheduled_at, duration_minutes, status, zoom_join_url, zoom_start_url, lesson_id")
      .eq("course_id", courseId)
      .order("session_number", { ascending: true });
    const sessions = (sessionRows as any[]) || [];

    const lessonIds = [...new Set(sessions.map((s) => s.lesson_id).filter(Boolean))] as string[];
    const lessonTitleMap = new Map<string, string>();
    if (lessonIds.length > 0) {
      const { data: lessonRows } = await supabase
        .from("course_lessons")
        .select("id, title")
        .in("id", lessonIds);
      ((lessonRows as { id: string; title: string }[]) || []).forEach((l) =>
        lessonTitleMap.set(l.id, l.title)
      );
    }

    const sessionsByEnrollment = new Map<string, SessionRow[]>();
    for (const s of sessions) {
      const row: SessionRow = {
        id: s.id,
        session_number: s.session_number,
        title: s.title,
        scheduled_at: s.scheduled_at,
        duration_minutes: s.duration_minutes,
        status: s.status,
        zoom_join_url: s.zoom_join_url,
        zoom_start_url: s.zoom_start_url,
        lesson_id: s.lesson_id,
        lesson_title: s.lesson_id ? lessonTitleMap.get(s.lesson_id) || null : null,
      };
      const key = s.enrollment_id || "unassigned";
      if (!sessionsByEnrollment.has(key)) sessionsByEnrollment.set(key, []);
      sessionsByEnrollment.get(key)!.push(row);
    }

    const groupRows: StudentGroup[] = enrollments.map((e) => ({
      enrollment_id: e.id,
      student_name: profileMap.get(e.student_id) || "Unknown Student",
      teacher_name: e.teacher_id ? profileMap.get(e.teacher_id) || "Unknown Teacher" : "No teacher assigned",
      sessions: (sessionsByEnrollment.get(e.id) || []).sort((a, b) => a.session_number - b.session_number),
    }));

    // Sessions with no enrollment_id (e.g. a teacher-created whole-class
    // session) get their own group so they're not silently dropped.
    const unassigned = sessionsByEnrollment.get("unassigned") || [];
    if (unassigned.length > 0) {
      groupRows.push({
        enrollment_id: "unassigned",
        student_name: "Whole-class / unassigned sessions",
        teacher_name: "",
        sessions: unassigned,
      });
    }

    setGroups(groupRows);
    setLoading(false);
  }, [courseId, supabase]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div className="space-y-6">
      <div>
        <button
          onClick={() => router.push("/dashboard/admin/courses")}
          className="inline-flex items-center gap-2 text-sm text-[#4D4D4D] hover:text-[#1F4FD8] mb-3"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Courses
        </button>
        <h1 className="text-2xl font-poppins font-bold text-[#1C1C28]">Live Sessions</h1>
        <p className="text-[#4D4D4D] text-sm mt-1">{courseTitle} — Zoom links and lesson pairing per student</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-[#1F4FD8]/30 border-t-[#1F4FD8] rounded-full animate-spin" />
        </div>
      ) : groups.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <Video className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-[#4D4D4D] font-medium">No enrollments yet</p>
          <p className="text-sm text-[#9CA3AF] mt-1">
            Live sessions are created automatically when a student is enrolled.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {groups.map((g) => (
            <div key={g.enrollment_id} className="bg-white rounded-2xl border border-gray-100 shadow-sm">
              <div className="px-5 py-4 border-b border-gray-50">
                <h3 className="font-poppins font-semibold text-[#1C1C28] text-sm">{g.student_name}</h3>
                {g.teacher_name && (
                  <p className="text-xs text-[#9CA3AF] mt-0.5">Teacher: {g.teacher_name}</p>
                )}
              </div>
              {g.sessions.length === 0 ? (
                <div className="px-5 py-4 text-sm text-[#9CA3AF]">No sessions created yet</div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {g.sessions.map((s) => (
                    <div key={s.id} className="px-5 py-3 flex items-center justify-between gap-4 flex-wrap">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-medium text-[#4D4D4D]">Session {s.session_number}</span>
                          {statusBadge(s.status)}
                          {s.lesson_title ? (
                            <span className="inline-flex items-center gap-1 text-xs text-[#1F4FD8]">
                              <BookOpen className="w-3 h-3" />
                              {s.lesson_title}
                            </span>
                          ) : (
                            <span className="text-xs text-amber-600">No lesson linked</span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-xs text-[#9CA3AF]">
                          <span className="inline-flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(s.scheduled_at).toLocaleDateString()}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(s.scheduled_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </span>
                          <span>{s.duration_minutes} min</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {s.zoom_join_url && (
                          <a
                            href={s.zoom_join_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg text-xs text-[#1C1C28] font-medium transition-colors"
                          >
                            Join link <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                        {s.zoom_start_url && (
                          <a
                            href={s.zoom_start_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#1F4FD8]/10 hover:bg-[#1F4FD8]/20 border border-[#1F4FD8]/20 rounded-lg text-xs text-[#1F4FD8] font-medium transition-colors"
                          >
                            Start link <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                        {!s.zoom_join_url && !s.zoom_start_url && (
                          <span className="text-xs text-gray-400">No Zoom link</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
