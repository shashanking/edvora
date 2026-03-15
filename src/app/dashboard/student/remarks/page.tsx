"use client";

import React, { useEffect, useState } from "react";
import { createClient } from "@/src/lib/supabase/client";
import { MessageSquare, User, BookOpen, Calendar } from "lucide-react";

interface RemarkView {
  id: string;
  content: string;
  type: string;
  created_at: string;
  course_title: string;
  teacher_name: string;
}

export default function StudentRemarksPage() {
  const supabase = createClient();
  const [remarks, setRemarks] = useState<RemarkView[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("remarks")
        .select("*")
        .eq("student_id", user.id)
        .order("created_at", { ascending: false });

      const rows = (data as any[]) || [];
      const courseIds = [...new Set(rows.map((r) => r.course_id))];
      const teacherIds = [...new Set(rows.map((r) => r.teacher_id))];

      const { data: courses } = courseIds.length
        ? await supabase.from("courses").select("id, title").in("id", courseIds)
        : { data: [] };

      const { data: teachers } = teacherIds.length
        ? await supabase
            .from("profiles")
            .select("id, full_name")
            .in("id", teacherIds)
        : { data: [] };

      const courseMap = new Map(((courses as any[]) || []).map((c) => [c.id, c.title]));
      const teacherMap = new Map(((teachers as any[]) || []).map((t) => [t.id, t.full_name]));

      setRemarks(
        rows.map((r) => ({
          id: r.id,
          content: r.content,
          type: r.type,
          created_at: r.created_at,
          course_title: courseMap.get(r.course_id) || "Unknown",
          teacher_name: teacherMap.get(r.teacher_id) || "Teacher",
        }))
      );

      setLoading(false);
    };
    fetch();
  }, []);

  const typeBadge = (type: string) => {
    const styles: Record<string, string> = {
      feedback: "bg-green-100 text-green-700",
      remark: "bg-blue-100 text-blue-700",
      note: "bg-amber-100 text-amber-700",
    };
    return (
      <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${styles[type] || "bg-gray-100 text-gray-600"}`}>
        {type}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-poppins font-bold text-[#1C1C28]">Remarks & Feedback</h1>
        <p className="text-[#4D4D4D] text-sm mt-1">View feedback shared by your teachers</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-[#1F4FD8]/30 border-t-[#1F4FD8] rounded-full animate-spin" />
        </div>
      ) : remarks.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <MessageSquare className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-[#4D4D4D] font-medium">No remarks yet</p>
          <p className="text-sm text-[#9CA3AF] mt-1">Teacher feedback will appear here</p>
        </div>
      ) : (
        <div className="space-y-3">
          {remarks.map((r) => (
            <div key={r.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    {typeBadge(r.type)}
                    <span className="text-xs text-[#1F4FD8] bg-[#1F4FD8]/10 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                      <BookOpen className="w-3 h-3" /> {r.course_title}
                    </span>
                    <span className="text-xs text-[#9CA3AF] inline-flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> {new Date(r.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm text-[#1C1C28] leading-relaxed">{r.content}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <div className="w-9 h-9 bg-[#1F4FD8] rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-bold">{r.teacher_name?.charAt(0)?.toUpperCase() || "T"}</span>
                  </div>
                  <div className="hidden sm:block">
                    <p className="text-sm font-medium text-[#1C1C28]">{r.teacher_name}</p>
                    <p className="text-xs text-[#9CA3AF]">Teacher</p>
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
