"use client";

import React, { useEffect, useState } from "react";
import { createClient } from "@/src/lib/supabase/client";
import { ClipboardList, Clock, CheckCircle, AlertCircle } from "lucide-react";

interface AssignmentView {
  id: string;
  title: string;
  description: string;
  due_date: string | null;
  course_title: string;
  submitted: boolean;
  grade: string | null;
  feedback: string | null;
}

export default function StudentAssignmentsPage() {
  const supabase = createClient();
  const [assignments, setAssignments] = useState<AssignmentView[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // Get enrolled course IDs
      const { data: enrollments } = await supabase
        .from("enrollments")
        .select("course_id")
        .eq("student_id", user.id)
        .eq("status", "active");

      const courseIds = ((enrollments as any[]) || []).map((e) => e.course_id);
      if (courseIds.length === 0) {
        setAssignments([]);
        setLoading(false);
        return;
      }

      // Get assignments for those courses
      const { data: assignmentData } = await supabase
        .from("assignments")
        .select("*")
        .in("course_id", courseIds)
        .order("due_date", { ascending: true });

      const rows = (assignmentData as any[]) || [];

      // Get courses for titles
      const { data: courses } = await supabase
        .from("courses")
        .select("id, title")
        .in("id", courseIds);
      const courseMap = new Map(((courses as any[]) || []).map((c) => [c.id, c.title]));

      // Get submissions by this student
      const assignmentIds = rows.map((a) => a.id);
      const { data: submissions } = assignmentIds.length
        ? await supabase
            .from("assignment_submissions")
            .select("assignment_id, grade, feedback")
            .eq("student_id", user.id)
            .in("assignment_id", assignmentIds)
        : { data: [] };

      const submissionMap = new Map(
        ((submissions as any[]) || []).map((s) => [s.assignment_id, s])
      );

      const merged: AssignmentView[] = rows.map((a) => {
        const sub = submissionMap.get(a.id);
        return {
          id: a.id,
          title: a.title,
          description: a.description,
          due_date: a.due_date,
          course_title: courseMap.get(a.course_id) || "Unknown",
          submitted: !!sub,
          grade: sub?.grade || null,
          feedback: sub?.feedback || null,
        };
      });

      setAssignments(merged);
      setLoading(false);
    };
    fetch();
  }, []);

  const isDueSoon = (date: string | null) => {
    if (!date) return false;
    const diff = new Date(date).getTime() - Date.now();
    return diff > 0 && diff < 3 * 24 * 60 * 60 * 1000; // within 3 days
  };

  const isPastDue = (date: string | null) => {
    if (!date) return false;
    return new Date(date).getTime() < Date.now();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-poppins font-bold text-[#1C1C28]">Assignments</h1>
        <p className="text-[#4D4D4D] text-sm mt-1">View and submit your assignments</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-[#1F4FD8]/30 border-t-[#1F4FD8] rounded-full animate-spin" />
        </div>
      ) : assignments.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <ClipboardList className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-[#4D4D4D] font-medium">No assignments yet</p>
          <p className="text-sm text-[#9CA3AF] mt-1">Assignments from your courses will show here</p>
        </div>
      ) : (
        <div className="space-y-3">
          {assignments.map((a) => (
            <div
              key={a.id}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium text-[#1F4FD8] bg-[#1F4FD8]/10 px-2 py-0.5 rounded-full">
                      {a.course_title}
                    </span>
                    {a.due_date && isDueSoon(a.due_date) && !a.submitted && (
                      <span className="text-xs font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> Due soon
                      </span>
                    )}
                  </div>
                  <h3 className="font-poppins font-semibold text-[#1C1C28]">{a.title}</h3>
                  <p className="text-sm text-[#4D4D4D] mt-1 line-clamp-2">{a.description}</p>
                  {a.due_date && (
                    <p className={`text-xs mt-2 flex items-center gap-1 ${isPastDue(a.due_date) && !a.submitted ? "text-red-500" : "text-[#9CA3AF]"}`}>
                      <Clock className="w-3.5 h-3.5" />
                      Due: {new Date(a.due_date).toLocaleDateString()} at{" "}
                      {new Date(a.due_date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  )}
                  {a.grade && (
                    <p className="text-xs mt-1 text-green-600 font-medium">Grade: {a.grade}</p>
                  )}
                  {a.feedback && (
                    <p className="text-xs mt-1 text-[#4D4D4D] italic">&quot;{a.feedback}&quot;</p>
                  )}
                </div>
                <div className="flex-shrink-0">
                  {a.submitted ? (
                    <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    </div>
                  ) : (
                    <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                      <ClipboardList className="w-5 h-5 text-amber-600" />
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
