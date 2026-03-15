"use client";

import React, { useEffect, useState } from "react";
import { createClient } from "@/src/lib/supabase/client";
import { ClipboardList, Plus, Calendar, Users } from "lucide-react";

interface AssignmentRow {
  id: string;
  title: string;
  description: string;
  due_date: string | null;
  course_title: string;
  submission_count: number;
  pending_count: number;
}

export default function TeacherAssignmentsPage() {
  const supabase = createClient();
  const [assignments, setAssignments] = useState<AssignmentRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("assignments")
        .select("*")
        .eq("teacher_id", user.id)
        .order("due_date", { ascending: true });

      const rows = (data as any[]) || [];
      const courseIds = [...new Set(rows.map((a) => a.course_id))];
      const assignmentIds = rows.map((a) => a.id);

      const { data: courses } = courseIds.length
        ? await supabase.from("courses").select("id, title").in("id", courseIds)
        : { data: [] };

      const { data: submissions } = assignmentIds.length
        ? await supabase
            .from("assignment_submissions")
            .select("assignment_id, graded_at")
            .in("assignment_id", assignmentIds)
        : { data: [] };

      const courseMap = new Map(((courses as any[]) || []).map((c) => [c.id, c.title]));

      const submissionMap = new Map<string, { total: number; pending: number }>();
      ((submissions as any[]) || []).forEach((s) => {
        const current = submissionMap.get(s.assignment_id) || { total: 0, pending: 0 };
        current.total++;
        if (!s.graded_at) current.pending++;
        submissionMap.set(s.assignment_id, current);
      });

      setAssignments(
        rows.map((a) => {
          const stats = submissionMap.get(a.id) || { total: 0, pending: 0 };
          return {
            id: a.id,
            title: a.title,
            description: a.description,
            due_date: a.due_date,
            course_title: courseMap.get(a.course_id) || "Unknown",
            submission_count: stats.total,
            pending_count: stats.pending,
          };
        })
      );

      setLoading(false);
    };

    fetch();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-poppins font-bold text-[#1C1C28]">Assignments</h1>
          <p className="text-[#4D4D4D] text-sm mt-1">Manage assignments and review submissions</p>
        </div>
        <button className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#1F4FD8] text-white font-poppins font-semibold text-sm rounded-xl hover:bg-[#1a45c2] transition-all shadow-md">
          <Plus className="w-4 h-4" />
          Create Assignment
        </button>
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
          <p className="text-sm text-[#9CA3AF] mt-1">Create your first assignment to get started</p>
        </div>
      ) : (
        <div className="space-y-3">
          {assignments.map((a) => (
            <div key={a.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium text-[#1F4FD8] bg-[#1F4FD8]/10 px-2 py-0.5 rounded-full">
                      {a.course_title}
                    </span>
                    {a.pending_count > 0 && (
                      <span className="text-xs font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                        {a.pending_count} pending review
                      </span>
                    )}
                  </div>
                  <h3 className="font-poppins font-semibold text-[#1C1C28]">{a.title}</h3>
                  <p className="text-sm text-[#4D4D4D] mt-1 line-clamp-2">{a.description}</p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-[#9CA3AF]">
                    {a.due_date && (
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        Due: {new Date(a.due_date).toLocaleDateString()}
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" />
                      {a.submission_count} submissions
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
