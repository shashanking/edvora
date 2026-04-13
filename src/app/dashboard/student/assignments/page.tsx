"use client";

import React, { useEffect, useState, useCallback } from "react";
import { createClient } from "@/src/lib/supabase/client";
import toast from "react-hot-toast";
import FileUpload from "@/src/components/shared/FileUpload";
import {
  ClipboardList,
  Clock,
  CheckCircle,
  Lock,
  ChevronDown,
  BookOpen,
  Download,
  FileText,
  Send,
  Loader2,
  Award,
  AlertCircle,
} from "lucide-react";

/* ---------- types ---------- */

interface EnrolledCourse {
  enrollment_id: string;
  course_id: string;
  course_title: string;
}

interface LiveSession {
  id: string;
  title: string;
  session_number: number;
  scheduled_at: string;
  status: string; // scheduled | live | completed | cancelled
}

interface Assignment {
  id: string;
  session_id: string;
  title: string;
  description: string;
  type: string | null; // homework | classwork | assessment
  due_date: string | null;
  file_urls: string[] | null;
  allowed_file_types: string[] | null;
}

interface Submission {
  id: string;
  assignment_id: string;
  content: string | null;
  file_url: string | null;
  file_urls: string[] | null;
  grade: string | null;
  feedback: string | null;
  submitted_at: string;
  graded_at: string | null;
}

/* ---------- helpers ---------- */

function typeBadgeColor(type: string | null) {
  switch (type) {
    case "classwork":
      return "bg-purple-50 text-purple-600";
    case "assessment":
      return "bg-red-50 text-red-600";
    default:
      return "bg-[#1F4FD8]/10 text-[#1F4FD8]";
  }
}

function fileNameFromUrl(url: string) {
  try {
    const decoded = decodeURIComponent(url.split("/").pop() || "file");
    // strip timestamp prefix added by FileUpload (e.g. "1716000000000_filename.pdf")
    return decoded.replace(/^\d+_/, "");
  } catch {
    return "file";
  }
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function formatDateTime(iso: string) {
  const d = new Date(iso);
  return (
    d.toLocaleDateString(undefined, { month: "short", day: "numeric" }) +
    " at " +
    d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  );
}

/* ---------- component ---------- */

export default function StudentAssignmentsPage() {
  const supabase = createClient() as any;

  const [userId, setUserId] = useState<string | null>(null);
  const [courses, setCourses] = useState<EnrolledCourse[]>([]);
  const [selectedEnrollmentId, setSelectedEnrollmentId] = useState<string>("");
  const [sessions, setSessions] = useState<LiveSession[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<Map<string, Submission>>(new Map());

  const [loadingCourses, setLoadingCourses] = useState(true);
  const [loadingData, setLoadingData] = useState(false);

  // submission form state keyed by assignment id
  const [draftContent, setDraftContent] = useState<Record<string, string>>({});
  const [draftFiles, setDraftFiles] = useState<Record<string, string[]>>({});
  const [submitting, setSubmitting] = useState<Record<string, boolean>>({});

  /* ---- 1. load enrolled courses ---- */
  useEffect(() => {
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);

      const { data: enrollments } = await supabase
        .from("enrollments")
        .select("id, course_id, courses(title)")
        .eq("student_id", user.id)
        .in("status", ["active", "completed"]);

      const rows = (enrollments as any[]) || [];
      const mapped: EnrolledCourse[] = rows.map((e) => ({
        enrollment_id: e.id,
        course_id: e.course_id,
        course_title: (e.courses as any)?.title || "Untitled Course",
      }));

      setCourses(mapped);
      setLoadingCourses(false);

      // auto-select first course
      if (mapped.length > 0) {
        setSelectedEnrollmentId(mapped[0].enrollment_id);
      }
    })();
  }, []);

  /* ---- 2. fetch sessions + assignments + submissions when course changes ---- */
  const fetchCourseData = useCallback(
    async (enrollmentId: string) => {
      if (!userId || !enrollmentId) return;
      setLoadingData(true);

      // Get all live_sessions for this enrollment
      const { data: sessionData } = await supabase
        .from("live_sessions")
        .select("id, title, session_number, scheduled_at, status")
        .eq("enrollment_id", enrollmentId)
        .order("session_number", { ascending: true });

      const sessionRows: LiveSession[] = (sessionData as any[]) || [];
      setSessions(sessionRows);

      const sessionIds = sessionRows.map((s) => s.id);

      if (sessionIds.length === 0) {
        setAssignments([]);
        setSubmissions(new Map());
        setLoadingData(false);
        return;
      }

      // Fetch assignments linked to these sessions
      const { data: assignmentData } = await supabase
        .from("assignments")
        .select("id, session_id, title, description, type, due_date, file_urls, allowed_file_types")
        .in("session_id", sessionIds);

      const assignmentRows: Assignment[] = (assignmentData as any[]) || [];
      setAssignments(assignmentRows);

      // Fetch student submissions for these assignments
      const assignmentIds = assignmentRows.map((a) => a.id);
      if (assignmentIds.length > 0) {
        const { data: submissionData } = await supabase
          .from("assignment_submissions")
          .select("id, assignment_id, content, file_url, file_urls, grade, feedback, submitted_at, graded_at")
          .eq("student_id", userId)
          .in("assignment_id", assignmentIds);

        const subMap = new Map<string, Submission>();
        ((submissionData as any[]) || []).forEach((s) => subMap.set(s.assignment_id, s));
        setSubmissions(subMap);
      } else {
        setSubmissions(new Map());
      }

      setLoadingData(false);
    },
    [userId, supabase]
  );

  useEffect(() => {
    if (selectedEnrollmentId) {
      fetchCourseData(selectedEnrollmentId);
    }
  }, [selectedEnrollmentId, fetchCourseData]);

  /* ---- 3. submit assignment ---- */
  const handleSubmit = async (assignment: Assignment) => {
    if (!userId) return;

    const content = draftContent[assignment.id]?.trim() || null;
    const fileUrls = draftFiles[assignment.id] || [];

    if (!content && fileUrls.length === 0) {
      toast.error("Please add some content or upload a file before submitting.");
      return;
    }

    setSubmitting((prev) => ({ ...prev, [assignment.id]: true }));

    const { data, error } = await supabase
      .from("assignment_submissions")
      .insert({
        assignment_id: assignment.id,
        student_id: userId,
        content,
        file_url: fileUrls[0] || null,
        file_urls: fileUrls.length > 0 ? fileUrls : null,
        submitted_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      toast.error("Submission failed: " + error.message);
      setSubmitting((prev) => ({ ...prev, [assignment.id]: false }));
      return;
    }

    toast.success("Assignment submitted successfully!");

    // Update local state
    setSubmissions((prev) => {
      const next = new Map(prev);
      next.set(assignment.id, data as Submission);
      return next;
    });

    // Clear draft
    setDraftContent((prev) => {
      const next = { ...prev };
      delete next[assignment.id];
      return next;
    });
    setDraftFiles((prev) => {
      const next = { ...prev };
      delete next[assignment.id];
      return next;
    });
    setSubmitting((prev) => ({ ...prev, [assignment.id]: false }));
  };

  /* ---- helpers for rendering ---- */
  const getAssignmentForSession = (sessionId: string) =>
    assignments.find((a) => a.session_id === sessionId) || null;

  const isDueSoon = (date: string | null) => {
    if (!date) return false;
    const diff = new Date(date).getTime() - Date.now();
    return diff > 0 && diff < 3 * 24 * 60 * 60 * 1000;
  };

  const isPastDue = (date: string | null) => {
    if (!date) return false;
    return new Date(date).getTime() < Date.now();
  };

  /* ---------- render ---------- */

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-poppins font-bold text-[#1C1C28]">Assignments</h1>
        <p className="text-[#4D4D4D] text-sm mt-1">View and submit your session assignments</p>
      </div>

      {/* Loading courses */}
      {loadingCourses ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-[#1F4FD8]/30 border-t-[#1F4FD8] rounded-full animate-spin" />
        </div>
      ) : courses.length === 0 ? (
        /* No courses empty state */
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <BookOpen className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-[#4D4D4D] font-medium">No enrolled courses</p>
          <p className="text-sm text-[#9CA3AF] mt-1">
            Enroll in a course to see assignments here
          </p>
        </div>
      ) : (
        <>
          {/* Course selector */}
          <div className="relative w-full max-w-sm">
            <select
              value={selectedEnrollmentId}
              onChange={(e) => setSelectedEnrollmentId(e.target.value)}
              className="w-full appearance-none bg-white border border-gray-200 rounded-xl px-4 py-3 pr-10 text-sm font-medium text-[#1C1C28] shadow-sm focus:outline-none focus:ring-2 focus:ring-[#1F4FD8]/30 focus:border-[#1F4FD8] transition-all cursor-pointer"
            >
              {courses.map((c) => (
                <option key={c.enrollment_id} value={c.enrollment_id}>
                  {c.course_title}
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-[#4D4D4D] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Content area */}
          {loadingData ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-2 border-[#1F4FD8]/30 border-t-[#1F4FD8] rounded-full animate-spin" />
            </div>
          ) : sessions.length === 0 ? (
            /* No sessions empty state */
            <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <ClipboardList className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-[#4D4D4D] font-medium">No sessions scheduled</p>
              <p className="text-sm text-[#9CA3AF] mt-1">
                Sessions for this course will appear here
              </p>
            </div>
          ) : (
            /* Session list */
            <div className="space-y-4">
              {sessions.map((session) => {
                const isCompleted = session.status === "completed";
                const assignment = getAssignmentForSession(session.id);
                const submission = assignment ? submissions.get(assignment.id) : null;

                return (
                  <div
                    key={session.id}
                    className={`bg-white rounded-2xl border shadow-sm transition-shadow ${
                      isCompleted
                        ? "border-gray-100 hover:shadow-md"
                        : "border-gray-100 opacity-70"
                    }`}
                  >
                    {/* Session header */}
                    <div className="px-5 py-4 flex items-center justify-between gap-3 border-b border-gray-50">
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                            isCompleted
                              ? "bg-[#1F4FD8]/10"
                              : "bg-gray-100"
                          }`}
                        >
                          {isCompleted ? (
                            <ClipboardList className="w-4.5 h-4.5 text-[#1F4FD8]" />
                          ) : (
                            <Lock className="w-4 h-4 text-gray-400" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-poppins font-semibold text-[#1C1C28] text-sm truncate">
                            Session {session.session_number}: {session.title}
                          </h3>
                          <p className="text-xs text-[#9CA3AF] mt-0.5">
                            {formatDate(session.scheduled_at)}
                          </p>
                        </div>
                      </div>

                      {/* Session status badge */}
                      <span
                        className={`flex-shrink-0 text-xs font-medium px-2.5 py-1 rounded-full ${
                          session.status === "completed"
                            ? "bg-green-50 text-green-600"
                            : session.status === "live"
                            ? "bg-red-50 text-red-600 animate-pulse"
                            : session.status === "cancelled"
                            ? "bg-gray-100 text-gray-500"
                            : "bg-amber-50 text-amber-600"
                        }`}
                      >
                        {session.status === "completed"
                          ? "Completed"
                          : session.status === "live"
                          ? "Live"
                          : session.status === "cancelled"
                          ? "Cancelled"
                          : "Scheduled"}
                      </span>
                    </div>

                    {/* Session body */}
                    <div className="px-5 py-4">
                      {!isCompleted ? (
                        /* Locked state */
                        <div className="flex items-center gap-2 text-sm text-[#9CA3AF]">
                          <Lock className="w-4 h-4" />
                          <span>Assignment will be available after session completes</span>
                        </div>
                      ) : !assignment ? (
                        /* No assignment for this session */
                        <div className="flex items-center gap-2 text-sm text-[#9CA3AF]">
                          <ClipboardList className="w-4 h-4" />
                          <span>No assignment for this session</span>
                        </div>
                      ) : (
                        /* Assignment content */
                        <div className="space-y-4">
                          {/* Assignment info */}
                          <div>
                            <div className="flex flex-wrap items-center gap-2 mb-2">
                              <h4 className="font-poppins font-semibold text-[#1C1C28]">
                                {assignment.title}
                              </h4>
                              {assignment.type && (
                                <span
                                  className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${typeBadgeColor(
                                    assignment.type
                                  )}`}
                                >
                                  {assignment.type}
                                </span>
                              )}
                              {assignment.due_date && isDueSoon(assignment.due_date) && !submission && (
                                <span className="text-xs font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                                  <AlertCircle className="w-3 h-3" /> Due soon
                                </span>
                              )}
                            </div>
                            {assignment.description && (
                              <p className="text-sm text-[#4D4D4D] leading-relaxed">
                                {assignment.description}
                              </p>
                            )}
                            {assignment.due_date && (
                              <p
                                className={`text-xs mt-2 flex items-center gap-1 ${
                                  isPastDue(assignment.due_date) && !submission
                                    ? "text-red-500"
                                    : "text-[#9CA3AF]"
                                }`}
                              >
                                <Clock className="w-3.5 h-3.5" />
                                Due: {formatDateTime(assignment.due_date)}
                              </p>
                            )}
                          </div>

                          {/* Teacher attached files */}
                          {assignment.file_urls && assignment.file_urls.length > 0 && (
                            <div className="space-y-1.5">
                              <p className="text-xs font-medium text-[#4D4D4D] uppercase tracking-wide">
                                Attached Files
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {assignment.file_urls.map((url, i) => (
                                  <a
                                    key={i}
                                    href={url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg text-xs text-[#1C1C28] font-medium transition-colors"
                                  >
                                    <Download className="w-3.5 h-3.5 text-[#1F4FD8]" />
                                    {fileNameFromUrl(url)}
                                  </a>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Submission area */}
                          {!submission ? (
                            /* Submission form */
                            <div className="border border-gray-200 rounded-xl p-4 space-y-3 bg-gray-50/50">
                              <p className="text-xs font-medium text-[#4D4D4D] uppercase tracking-wide">
                                Your Submission
                              </p>

                              {/* Text content (optional) */}
                              <textarea
                                placeholder="Add notes or answer text (optional)"
                                value={draftContent[assignment.id] || ""}
                                onChange={(e) =>
                                  setDraftContent((prev) => ({
                                    ...prev,
                                    [assignment.id]: e.target.value,
                                  }))
                                }
                                rows={3}
                                className="w-full px-3 py-2.5 text-sm text-[#1C1C28] bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1F4FD8]/30 focus:border-[#1F4FD8] resize-none transition-all placeholder:text-[#9CA3AF]"
                              />

                              {/* File upload */}
                              <FileUpload
                                bucket="submissions"
                                folder={`student-${userId}/assignment-${assignment.id}`}
                                accept={
                                  assignment.allowed_file_types && assignment.allowed_file_types.length > 0
                                    ? assignment.allowed_file_types.join(",")
                                    : undefined
                                }
                                label="Upload your file"
                                onUpload={(url) => {
                                  setDraftFiles((prev) => ({
                                    ...prev,
                                    [assignment.id]: [
                                      ...(prev[assignment.id] || []),
                                      url,
                                    ],
                                  }));
                                }}
                              />

                              {/* Uploaded file list */}
                              {(draftFiles[assignment.id] || []).length > 0 && (
                                <div className="flex flex-wrap gap-2">
                                  {draftFiles[assignment.id].map((url, i) => (
                                    <span
                                      key={i}
                                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-gray-200 rounded-lg text-xs text-[#4D4D4D]"
                                    >
                                      <FileText className="w-3 h-3" />
                                      {fileNameFromUrl(url)}
                                    </span>
                                  ))}
                                </div>
                              )}

                              {/* Submit button */}
                              <button
                                onClick={() => handleSubmit(assignment)}
                                disabled={submitting[assignment.id]}
                                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#1F4FD8] text-white text-sm font-semibold rounded-xl hover:bg-[#1a45c2] transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {submitting[assignment.id] ? (
                                  <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Submitting...
                                  </>
                                ) : (
                                  <>
                                    <Send className="w-4 h-4" />
                                    Submit Assignment
                                  </>
                                )}
                              </button>
                            </div>
                          ) : (
                            /* Already submitted */
                            <div className="border border-gray-200 rounded-xl p-4 space-y-3">
                              <div className="flex items-center justify-between flex-wrap gap-2">
                                <div className="flex items-center gap-2">
                                  <CheckCircle className="w-4.5 h-4.5 text-green-500" />
                                  <span className="text-sm font-semibold text-green-600">
                                    Submitted
                                  </span>
                                  <span className="text-xs text-[#9CA3AF]">
                                    on {formatDateTime(submission.submitted_at)}
                                  </span>
                                </div>
                                {submission.graded_at ? (
                                  <span className="inline-flex items-center gap-1 text-xs font-medium text-green-600 bg-green-50 px-2.5 py-1 rounded-full">
                                    <Award className="w-3.5 h-3.5" />
                                    Graded
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full">
                                    <Clock className="w-3.5 h-3.5" />
                                    Pending review
                                  </span>
                                )}
                              </div>

                              {/* Show submitted content */}
                              {submission.content && (
                                <div className="text-sm text-[#4D4D4D] bg-gray-50 rounded-lg p-3">
                                  {submission.content}
                                </div>
                              )}

                              {/* Show submitted files */}
                              {submission.file_urls && submission.file_urls.length > 0 && (
                                <div className="flex flex-wrap gap-2">
                                  {submission.file_urls.map((url, i) => (
                                    <a
                                      key={i}
                                      href={url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg text-xs text-[#1C1C28] font-medium transition-colors"
                                    >
                                      <FileText className="w-3.5 h-3.5 text-[#1F4FD8]" />
                                      {fileNameFromUrl(url)}
                                    </a>
                                  ))}
                                </div>
                              )}

                              {/* Grade & feedback */}
                              {submission.graded_at && (
                                <div className="bg-green-50/60 border border-green-100 rounded-xl p-4 space-y-2">
                                  {submission.grade && (
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs font-medium text-[#4D4D4D] uppercase tracking-wide">
                                        Grade:
                                      </span>
                                      <span className="text-sm font-bold text-green-700">
                                        {submission.grade}
                                      </span>
                                    </div>
                                  )}
                                  {submission.feedback && (
                                    <div>
                                      <span className="text-xs font-medium text-[#4D4D4D] uppercase tracking-wide">
                                        Teacher Feedback
                                      </span>
                                      <p className="text-sm text-[#1C1C28] mt-1 leading-relaxed italic">
                                        &quot;{submission.feedback}&quot;
                                      </p>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
