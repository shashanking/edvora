"use client";

import React, { useEffect, useState } from "react";
import { createClient } from "@/src/lib/supabase/client";
import {
  Video,
  Plus,
  Calendar,
  Clock,
  ExternalLink,
  X,
  Download,
  Trash2,
  Loader2,
} from "lucide-react";
import toast from "react-hot-toast";

interface SessionRow {
  id: string;
  title: string;
  scheduled_at: string;
  duration_minutes: number;
  status: string;
  zoom_meeting_id: string | null;
  zoom_join_url: string | null;
  zoom_start_url: string | null;
  recording_url: string | null;
  course_title: string;
  course_id: string;
  student_id: string | null;
}

interface CourseOption {
  id: string;
  title: string;
}

interface StudentOption {
  id: string;
  full_name: string;
  email: string;
}

const defaultForm = {
  course_id: "",
  title: "",
  scheduled_at: "",
  duration_minutes: 60,
  student_id: "",
};

export default function TeacherLiveClassesPage() {
  const supabase = createClient() as any;
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [courses, setCourses] = useState<CourseOption[]>([]);
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [form, setForm] = useState(defaultForm);
  const [submitting, setSubmitting] = useState(false);
  const [fetchingRecordings, setFetchingRecordings] = useState<string | null>(null);
  const [deletingSession, setDeletingSession] = useState<string | null>(null);

  const fetchSessions = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    // Auto-complete sessions whose time has passed
    try {
      await fetch("/api/sessions/auto-complete", { method: "POST" });
    } catch {}

    const { data } = await supabase
      .from("live_sessions")
      .select("*")
      .eq("teacher_id", user.id)
      .order("scheduled_at", { ascending: true });

    const rows = (data as any[]) || [];
    const courseIds = [...new Set(rows.map((s) => s.course_id))];

    // Also fetch teacher's courses for the form
    const { data: ct } = await supabase
      .from("course_teachers")
      .select("course_id")
      .eq("teacher_id", user.id);

    const teacherCourseIds = ((ct as any[]) || []).map((x) => x.course_id);
    const allCourseIds = [...new Set([...courseIds, ...teacherCourseIds])];

    const { data: coursesData } = allCourseIds.length
      ? await supabase.from("courses").select("id, title").in("id", allCourseIds)
      : { data: [] };

    const courseMap = new Map(((coursesData as any[]) || []).map((c) => [c.id, c.title]));
    setCourses(((coursesData as any[]) || []).map((c) => ({ id: c.id, title: c.title })));

    // Fetch students (profiles with role = student) for the form
    const { data: studentsData } = await supabase
      .from("profiles")
      .select("id, full_name, email")
      .eq("role", "student")
      .order("full_name");

    setStudents(
      ((studentsData as any[]) || []).map((s) => ({
        id: s.id,
        full_name: s.full_name || "Unnamed",
        email: s.email || "",
      }))
    );

    const now = Date.now();
    setSessions(
      rows
        .map((s: any) => ({
          id: s.id,
          title: s.title,
          scheduled_at: s.scheduled_at,
          duration_minutes: s.duration_minutes,
          status: s.status,
          zoom_meeting_id: s.zoom_meeting_id,
          zoom_join_url: s.zoom_join_url,
          zoom_start_url: s.zoom_start_url,
          recording_url: s.recording_url,
          course_title: courseMap.get(s.course_id) || "Unknown",
          course_id: s.course_id,
          student_id: s.student_id,
        }))
        .filter((s: SessionRow) =>
          (s.status === "scheduled" || s.status === "live") &&
          new Date(s.scheduled_at).getTime() + s.duration_minutes * 60 * 1000 > now
        )
    );

    setLoading(false);
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  // ------- Create session via Zoom API -------
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const res = await fetch("/api/zoom/create-meeting", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          course_id: form.course_id,
          title: form.title,
          scheduled_at: new Date(form.scheduled_at).toISOString(),
          duration_minutes: form.duration_minutes,
          student_id: form.student_id || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error("Failed to create session: " + (data.error || "Unknown error"));
        setSubmitting(false);
        return;
      }

      toast.success("Live session created with Zoom meeting!");
      setForm(defaultForm);
      setShowModal(false);
      setSubmitting(false);
      setLoading(true);
      fetchSessions();
    } catch (err: any) {
      toast.error("Network error: " + err.message);
      setSubmitting(false);
    }
  };

  // ------- Fetch recordings -------
  const handleFetchRecordings = async (session: SessionRow) => {
    if (!session.zoom_meeting_id) {
      toast.error("No Zoom meeting ID for this session");
      return;
    }

    setFetchingRecordings(session.id);

    try {
      const res = await fetch(
        `/api/zoom/recordings/${session.zoom_meeting_id}`
      );
      const data = await res.json();

      if (!res.ok) {
        toast.error("Failed to fetch recordings: " + (data.error || "Unknown error"));
        setFetchingRecordings(null);
        return;
      }

      if (data.recordings && data.recordings.length > 0) {
        toast.success(`Found ${data.recordings.length} recording(s)!`);
      } else {
        toast.error("No recordings found for this meeting yet.");
      }

      setFetchingRecordings(null);
      fetchSessions(); // refresh to show recording_url
    } catch (err: any) {
      toast.error("Network error: " + err.message);
      setFetchingRecordings(null);
    }
  };

  // ------- Delete meeting -------
  const handleDeleteMeeting = async (session: SessionRow) => {
    if (!session.zoom_meeting_id) return;

    const confirmed = window.confirm(
      "Delete this Zoom meeting? The session record will remain but Zoom links will be cleared."
    );
    if (!confirmed) return;

    setDeletingSession(session.id);

    try {
      const res = await fetch("/api/zoom/delete-meeting", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          meeting_id: session.zoom_meeting_id,
          session_id: session.id,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error("Failed to delete meeting: " + (data.error || "Unknown error"));
        setDeletingSession(null);
        return;
      }

      toast.success("Zoom meeting deleted.");
      setDeletingSession(null);
      fetchSessions();
    } catch (err: any) {
      toast.error("Network error: " + err.message);
      setDeletingSession(null);
    }
  };

  const upcoming = sessions;

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

  const renderSessionCard = (s: SessionRow) => (
    <div
      key={s.id}
      className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-xs font-medium text-[#1F4FD8] bg-[#1F4FD8]/10 px-2 py-0.5 rounded-full">
              {s.course_title}
            </span>
            {statusBadge(s.status)}
          </div>
          <h3 className="font-poppins font-semibold text-[#1C1C28]">
            {s.title}
          </h3>
          <div className="flex items-center gap-4 mt-2 text-xs text-[#9CA3AF]">
            <span className="inline-flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              {new Date(s.scheduled_at).toLocaleDateString()}
            </span>
            <span className="inline-flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {new Date(s.scheduled_at).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
            <span>{s.duration_minutes} min</span>
          </div>

          {/* Recording link */}
          {s.recording_url && (
            <a
              href={s.recording_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 mt-3 text-xs font-medium text-green-700 bg-green-50 px-3 py-1.5 rounded-lg hover:bg-green-100 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              View Recording
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex flex-col gap-2 flex-shrink-0">
          {/* Start / Join button for upcoming */}
          {(s.status === "scheduled" || s.status === "live") &&
            s.zoom_start_url && (
              <a
                href={s.zoom_start_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#1F4FD8] text-white text-sm font-semibold rounded-xl hover:bg-[#1a45c2] transition-all shadow-md"
              >
                <Video className="w-4 h-4" />
                Start
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}

          {(s.status === "scheduled" || s.status === "live") &&
            !s.zoom_start_url &&
            s.zoom_join_url && (
              <a
                href={s.zoom_join_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#1F4FD8] text-white text-sm font-semibold rounded-xl hover:bg-[#1a45c2] transition-all shadow-md"
              >
                <Video className="w-4 h-4" />
                Join
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}

          {/* Fetch Recordings button for completed sessions */}
          {s.status === "completed" && s.zoom_meeting_id && (
            <button
              onClick={() => handleFetchRecordings(s)}
              disabled={fetchingRecordings === s.id}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-green-600 text-white text-sm font-semibold rounded-xl hover:bg-green-700 disabled:opacity-60 transition-all shadow-md"
            >
              {fetchingRecordings === s.id ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              {fetchingRecordings === s.id
                ? "Fetching..."
                : "Fetch Recordings"}
            </button>
          )}

          {/* Delete Zoom meeting button */}
          {s.zoom_meeting_id && (
            <button
              onClick={() => handleDeleteMeeting(s)}
              disabled={deletingSession === s.id}
              className="inline-flex items-center gap-2 px-4 py-2.5 border border-red-200 text-red-600 text-sm font-semibold rounded-xl hover:bg-red-50 disabled:opacity-60 transition-all"
            >
              {deletingSession === s.id ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
              {deletingSession === s.id ? "Deleting..." : "Delete Meeting"}
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-poppins font-bold text-[#1C1C28]">
            Live Classes
          </h1>
          <p className="text-[#4D4D4D] text-sm mt-1">
            Manage your live teaching sessions
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#1F4FD8] text-white font-poppins font-semibold text-sm rounded-xl hover:bg-[#1a45c2] transition-all shadow-md"
        >
          <Plus className="w-4 h-4" />
          Schedule Session
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-[#1F4FD8]/30 border-t-[#1F4FD8] rounded-full animate-spin" />
        </div>
      ) : sessions.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <Video className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-[#4D4D4D] font-medium">No sessions yet</p>
          <p className="text-sm text-[#9CA3AF] mt-1">
            Schedule your first live class
          </p>
        </div>
      ) : (
        <>
          {/* Upcoming */}
          <div className="space-y-3">
            <h2 className="text-lg font-poppins font-semibold text-[#1C1C28]">
              Upcoming Sessions
              <span className="ml-2 text-sm font-normal text-[#9CA3AF]">
                ({upcoming.length})
              </span>
            </h2>
            {upcoming.map(renderSessionCard)}
          </div>
        </>
      )}

      {/* Create Session Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-lg font-poppins font-semibold text-[#1C1C28]">
                Schedule Session
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-[#4D4D4D]" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#1C1C28] mb-1.5">
                  Course
                </label>
                <select
                  value={form.course_id}
                  onChange={(e) =>
                    setForm({ ...form, course_id: e.target.value })
                  }
                  required
                  className="w-full px-4 py-3 border border-[#D4D4D4] rounded-xl bg-white text-[#1C1C28] focus:outline-none focus:ring-2 focus:ring-[#1F4FD8] focus:border-transparent text-sm"
                >
                  <option value="">Select a course</option>
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#1C1C28] mb-1.5">
                  Student (1-on-1 session)
                </label>
                <select
                  value={form.student_id}
                  onChange={(e) =>
                    setForm({ ...form, student_id: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-[#D4D4D4] rounded-xl bg-white text-[#1C1C28] focus:outline-none focus:ring-2 focus:ring-[#1F4FD8] focus:border-transparent text-sm"
                >
                  <option value="">Select a student (optional)</option>
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.full_name}
                      {s.email ? ` (${s.email})` : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#1C1C28] mb-1.5">
                  Session Title
                </label>
                <input
                  value={form.title}
                  onChange={(e) =>
                    setForm({ ...form, title: e.target.value })
                  }
                  required
                  placeholder="e.g. Week 3 - Grammar Review"
                  className="w-full px-4 py-3 border border-[#D4D4D4] rounded-xl bg-white text-[#1C1C28] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#1F4FD8] focus:border-transparent text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#1C1C28] mb-1.5">
                    Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    value={form.scheduled_at}
                    onChange={(e) =>
                      setForm({ ...form, scheduled_at: e.target.value })
                    }
                    required
                    className="w-full px-4 py-3 border border-[#D4D4D4] rounded-xl bg-white text-[#1C1C28] focus:outline-none focus:ring-2 focus:ring-[#1F4FD8] focus:border-transparent text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#1C1C28] mb-1.5">
                    Duration (min)
                  </label>
                  <input
                    type="number"
                    min={15}
                    max={300}
                    value={form.duration_minutes}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        duration_minutes: parseInt(e.target.value) || 60,
                      })
                    }
                    className="w-full px-4 py-3 border border-[#D4D4D4] rounded-xl bg-white text-[#1C1C28] focus:outline-none focus:ring-2 focus:ring-[#1F4FD8] focus:border-transparent text-sm"
                  />
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-100 rounded-xl p-3">
                <p className="text-xs text-blue-700">
                  A Zoom meeting will be created automatically with cloud
                  recording enabled. No need to enter Zoom URLs manually.
                </p>
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
                    <Plus className="w-4 h-4" />
                  )}
                  {submitting ? "Creating..." : "Create Session"}
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
