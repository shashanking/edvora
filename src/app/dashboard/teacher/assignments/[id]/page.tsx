"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/src/lib/supabase/client";
import {
  ArrowLeft,
  Calendar,
  ClipboardList,
  Clock,
  CheckCircle2,
  Download,
  FileText,
  Hash,
  Loader2,
  Save,
  Users,
} from "lucide-react";
import toast from "react-hot-toast";
import Link from "next/link";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface AssignmentDetail {
  id: string;
  title: string;
  description: string | null;
  type: string;
  due_date: string | null;
  file_urls: string[];
  allowed_file_types: string[];
  course_id: string;
  session_id: string;
  course_title: string;
  session_number: number;
  session_title: string;
}

interface SubmissionRow {
  id: string;
  student_id: string;
  student_name: string;
  student_email: string;
  submitted_at: string;
  file_urls: string[];
  content: string | null;
  grade: string | null;
  feedback: string | null;
  score: number | null;
  graded_at: string | null;
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function AssignmentDetailPage() {
  const supabase = createClient() as any;
  const params = useParams();
  const router = useRouter();
  const assignmentId = params.id as string;

  const [assignment, setAssignment] = useState<AssignmentDetail | null>(null);
  const [submissions, setSubmissions] = useState<SubmissionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingGrade, setSavingGrade] = useState<string | null>(null);
  const [gradeInputs, setGradeInputs] = useState<
    Record<string, { grade: string; feedback: string; score: string }>
  >({});

  /* ---------- Load assignment + submissions ---------- */
  useEffect(() => {
    const load = async () => {
      if (!assignmentId) return;

      // Fetch assignment
      const { data: aData, error: aError } = await supabase
        .from("assignments")
        .select("*")
        .eq("id", assignmentId)
        .single();

      if (aError || !aData) {
        toast.error("Assignment not found");
        setLoading(false);
        return;
      }

      const a = aData as any;

      // Fetch course title
      const { data: courseData } = await supabase
        .from("courses")
        .select("title")
        .eq("id", a.course_id)
        .single();

      // Fetch session info
      const { data: sessionData } = await supabase
        .from("live_sessions")
        .select("session_number, title")
        .eq("id", a.session_id)
        .single();

      const detail: AssignmentDetail = {
        id: a.id,
        title: a.title,
        description: a.description,
        type: a.type || "homework",
        due_date: a.due_date,
        file_urls: a.file_urls || [],
        allowed_file_types: a.allowed_file_types || [],
        course_id: a.course_id,
        session_id: a.session_id,
        course_title: (courseData as any)?.title || "Unknown",
        session_number: (sessionData as any)?.session_number || 0,
        session_title: (sessionData as any)?.title || "Unknown Session",
      };
      setAssignment(detail);

      // Fetch submissions
      const { data: subsData } = await supabase
        .from("assignment_submissions")
        .select("*")
        .eq("assignment_id", assignmentId)
        .order("submitted_at", { ascending: false });

      const rows = (subsData as any[]) || [];
      const studentIds = [...new Set(rows.map((s) => s.student_id))];

      let profileMap = new Map<string, { name: string; email: string }>();
      if (studentIds.length) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, full_name, email")
          .in("id", studentIds);

        ((profiles as any[]) || []).forEach((p) => {
          profileMap.set(p.id, {
            name: p.full_name || "Unnamed",
            email: p.email || "",
          });
        });
      }

      const mapped: SubmissionRow[] = rows.map((s) => {
        const profile = profileMap.get(s.student_id) || {
          name: "Unknown",
          email: "",
        };
        return {
          id: s.id,
          student_id: s.student_id,
          student_name: profile.name,
          student_email: profile.email,
          submitted_at: s.submitted_at,
          file_urls: s.file_urls || [],
          content: s.content || null,
          grade: s.grade || null,
          feedback: s.feedback || null,
          score: s.score ?? null,
          graded_at: s.graded_at || null,
        };
      });

      const inputs: Record<
        string,
        { grade: string; feedback: string; score: string }
      > = {};
      mapped.forEach((s) => {
        inputs[s.id] = {
          grade: s.grade || "",
          feedback: s.feedback || "",
          score: s.score !== null ? String(s.score) : "",
        };
      });

      setSubmissions(mapped);
      setGradeInputs(inputs);
      setLoading(false);
    };

    load();
  }, [assignmentId]);

  /* ---------- Save grade ---------- */
  const handleSaveGrade = async (submissionId: string) => {
    const input = gradeInputs[submissionId];
    if (!input) return;
    setSavingGrade(submissionId);

    const { error } = await supabase
      .from("assignment_submissions")
      .update({
        grade: input.grade || null,
        feedback: input.feedback || null,
        score: input.score ? parseInt(input.score) : null,
        graded_at: new Date().toISOString(),
      })
      .eq("id", submissionId);

    if (error) {
      toast.error("Failed to save assessment: " + error.message);
    } else {
      toast.success("Assessment saved");
      setSubmissions((prev) =>
        prev.map((s) =>
          s.id === submissionId
            ? {
                ...s,
                grade: input.grade || null,
                feedback: input.feedback || null,
                score: input.score ? parseInt(input.score) : null,
                graded_at: new Date().toISOString(),
              }
            : s
        )
      );
    }
    setSavingGrade(null);
  };

  /* ---------- Helpers ---------- */
  const typeBadge = (type: string) => {
    const styles: Record<string, string> = {
      homework: "bg-purple-100 text-purple-700",
      classwork: "bg-teal-100 text-teal-700",
      assessment: "bg-amber-100 text-amber-700",
    };
    return (
      <span
        className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${styles[type] || "bg-gray-100 text-gray-500"}`}
      >
        {type}
      </span>
    );
  };

  const extractFileName = (url: string) => {
    try {
      const raw = url.split("/").pop() || "File";
      // Remove timestamp prefix if present (e.g. "1234567890_filename.pdf")
      const decoded = decodeURIComponent(raw);
      const match = decoded.match(/^\d+_(.+)$/);
      return match ? match[1] : decoded;
    } catch {
      return "File";
    }
  };

  /* ---------- Render ---------- */

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-[#1F4FD8]/30 border-t-[#1F4FD8] rounded-full animate-spin" />
      </div>
    );
  }

  if (!assignment) {
    return (
      <div className="space-y-6">
        <Link
          href="/dashboard/teacher/assignments"
          className="inline-flex items-center gap-2 text-sm text-[#1F4FD8] hover:underline"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Assignments
        </Link>
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <ClipboardList className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-[#4D4D4D] font-medium">Assignment not found</p>
        </div>
      </div>
    );
  }

  const gradedCount = submissions.filter((s) => s.graded_at).length;

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link
        href="/dashboard/teacher/assignments"
        className="inline-flex items-center gap-2 text-sm text-[#1F4FD8] hover:underline font-medium"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Assignments
      </Link>

      {/* Assignment Info Card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="text-xs font-medium text-[#1F4FD8] bg-[#1F4FD8]/10 px-2.5 py-0.5 rounded-full">
                {assignment.course_title}
              </span>
              <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-600 bg-gray-100 px-2.5 py-0.5 rounded-full">
                <Hash className="w-3 h-3" />
                Session {assignment.session_number}
              </span>
              {typeBadge(assignment.type)}
            </div>

            <h1 className="text-2xl font-poppins font-bold text-[#1C1C28]">
              {assignment.title}
            </h1>

            {assignment.description && (
              <p className="text-[#4D4D4D] text-sm mt-2 leading-relaxed">
                {assignment.description}
              </p>
            )}

            <div className="flex items-center gap-5 mt-4 text-sm text-[#9CA3AF]">
              {assignment.due_date && (
                <span className="inline-flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" />
                  Due: {new Date(assignment.due_date).toLocaleDateString()}{" "}
                  {new Date(assignment.due_date).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              )}
              <span className="inline-flex items-center gap-1.5">
                <Users className="w-4 h-4" />
                {submissions.length} submission{submissions.length !== 1 ? "s" : ""}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                {gradedCount} graded
              </span>
            </div>

            {assignment.allowed_file_types.length > 0 && (
              <div className="mt-3">
                <span className="text-xs text-[#9CA3AF]">
                  Accepted submission types:{" "}
                </span>
                {assignment.allowed_file_types.map((t) => (
                  <span
                    key={t}
                    className="inline-block px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full mr-1 capitalize"
                  >
                    {t}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Attached files */}
        {assignment.file_urls.length > 0 && (
          <div className="mt-5 pt-5 border-t border-gray-100">
            <h3 className="text-sm font-semibold text-[#1C1C28] mb-3">
              Attached Files
            </h3>
            <div className="flex flex-wrap gap-2">
              {assignment.file_urls.map((url, i) => (
                <a
                  key={i}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm text-[#1C1C28] hover:bg-[#1F4FD8]/5 hover:border-[#1F4FD8]/20 transition-colors"
                >
                  <FileText className="w-4 h-4 text-[#1F4FD8]" />
                  <span className="truncate max-w-[200px]">
                    {extractFileName(url)}
                  </span>
                  <Download className="w-3.5 h-3.5 text-[#9CA3AF]" />
                </a>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Submissions Section */}
      <div>
        <h2 className="text-lg font-poppins font-semibold text-[#1C1C28] mb-4">
          Student Submissions
          {submissions.length > 0 && (
            <span className="ml-2 text-sm font-normal text-[#9CA3AF]">
              ({submissions.length})
            </span>
          )}
        </h2>

        {submissions.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
            <div className="w-14 h-14 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <Users className="w-7 h-7 text-gray-400" />
            </div>
            <p className="text-[#4D4D4D] font-medium">No submissions yet</p>
            <p className="text-sm text-[#9CA3AF] mt-1">
              Students have not submitted work for this assignment
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {submissions.map((sub) => (
              <div
                key={sub.id}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow"
              >
                {/* Student header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#1F4FD8]/10 rounded-full flex items-center justify-center">
                      <span className="text-sm font-bold text-[#1F4FD8]">
                        {sub.student_name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-semibold text-[#1C1C28] text-sm">
                        {sub.student_name}
                      </p>
                      <p className="text-xs text-[#9CA3AF]">
                        {sub.student_email}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-[#9CA3AF] inline-flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(sub.submitted_at).toLocaleString()}
                    </p>
                    {sub.graded_at && (
                      <p className="inline-flex items-center gap-1 text-xs text-green-600 font-medium mt-0.5 ml-3">
                        <CheckCircle2 className="w-3 h-3" />
                        Graded
                        {sub.score !== null && (
                          <span className="ml-1 font-bold">{sub.score}/100</span>
                        )}
                      </p>
                    )}
                  </div>
                </div>

                {/* Content */}
                {sub.content && (
                  <div className="mb-4 p-3 bg-gray-50 rounded-xl border border-gray-100">
                    <p className="text-xs font-medium text-[#9CA3AF] mb-1">
                      Submission Text
                    </p>
                    <p className="text-sm text-[#1C1C28] whitespace-pre-wrap">
                      {sub.content}
                    </p>
                  </div>
                )}

                {/* Submitted files */}
                {sub.file_urls.length > 0 && (
                  <div className="mb-4">
                    <p className="text-xs font-medium text-[#9CA3AF] mb-2">
                      Submitted Files
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {sub.file_urls.map((url, i) => (
                        <a
                          key={i}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs text-[#1F4FD8] hover:bg-[#1F4FD8]/5 transition-colors"
                        >
                          <Download className="w-3.5 h-3.5" />
                          {extractFileName(url)}
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Assessment form */}
                <div className="pt-4 border-t border-gray-100">
                  <p className="text-xs font-semibold text-[#1C1C28] mb-3 uppercase tracking-wide">
                    Assessment
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-[#1C1C28] mb-1">
                        Score (out of 100)
                      </label>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={gradeInputs[sub.id]?.score || ""}
                        onChange={(e) =>
                          setGradeInputs((prev) => ({
                            ...prev,
                            [sub.id]: {
                              ...prev[sub.id],
                              score: e.target.value,
                            },
                          }))
                        }
                        placeholder="0-100"
                        className="w-full px-3 py-2.5 border border-[#D4D4D4] rounded-xl bg-white text-[#1C1C28] text-sm focus:outline-none focus:ring-2 focus:ring-[#1F4FD8] focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[#1C1C28] mb-1">
                        Grade
                      </label>
                      <input
                        type="text"
                        value={gradeInputs[sub.id]?.grade || ""}
                        onChange={(e) =>
                          setGradeInputs((prev) => ({
                            ...prev,
                            [sub.id]: {
                              ...prev[sub.id],
                              grade: e.target.value,
                            },
                          }))
                        }
                        placeholder="e.g. A+, B-, Pass"
                        className="w-full px-3 py-2.5 border border-[#D4D4D4] rounded-xl bg-white text-[#1C1C28] text-sm focus:outline-none focus:ring-2 focus:ring-[#1F4FD8] focus:border-transparent"
                      />
                    </div>
                  </div>
                  <div className="mt-3">
                    <label className="block text-xs font-medium text-[#1C1C28] mb-1">
                      Feedback
                    </label>
                    <textarea
                      value={gradeInputs[sub.id]?.feedback || ""}
                      onChange={(e) =>
                        setGradeInputs((prev) => ({
                          ...prev,
                          [sub.id]: {
                            ...prev[sub.id],
                            feedback: e.target.value,
                          },
                        }))
                      }
                      rows={3}
                      placeholder="Write detailed feedback for the student..."
                      className="w-full px-3 py-2.5 border border-[#D4D4D4] rounded-xl bg-white text-[#1C1C28] text-sm focus:outline-none focus:ring-2 focus:ring-[#1F4FD8] focus:border-transparent resize-none"
                    />
                  </div>
                  <button
                    onClick={() => handleSaveGrade(sub.id)}
                    disabled={savingGrade === sub.id}
                    className="mt-3 inline-flex items-center gap-2 px-5 py-2.5 bg-[#1F4FD8] text-white text-sm font-semibold rounded-xl hover:bg-[#1a45c2] disabled:opacity-60 transition-all shadow-md"
                  >
                    {savingGrade === sub.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    {savingGrade === sub.id
                      ? "Saving..."
                      : "Save Assessment"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
