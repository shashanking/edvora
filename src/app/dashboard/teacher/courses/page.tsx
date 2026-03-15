"use client";

import React, { useEffect, useState } from "react";
import { createClient } from "@/src/lib/supabase/client";
import { BookOpen, Users, ClipboardList } from "lucide-react";

interface TeacherCourse {
  course_id: string;
  title: string;
  description: string;
  thumbnail_url: string | null;
  status: string;
  student_count: number;
  assignment_count: number;
}

export default function TeacherCoursesPage() {
  const supabase = createClient();
  const [courses, setCourses] = useState<TeacherCourse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: ct } = await supabase
        .from("course_teachers")
        .select("course_id")
        .eq("teacher_id", user.id);

      const courseIds = ((ct as any[]) || []).map((x) => x.course_id);
      if (courseIds.length === 0) {
        setCourses([]);
        setLoading(false);
        return;
      }

      const { data: courseData } = await supabase
        .from("courses")
        .select("id, title, description, thumbnail_url, status")
        .in("id", courseIds);

      const { data: enrollments } = await supabase
        .from("enrollments")
        .select("course_id")
        .in("course_id", courseIds)
        .eq("status", "active");

      const { data: assignments } = await supabase
        .from("assignments")
        .select("course_id")
        .in("course_id", courseIds)
        .eq("teacher_id", user.id);

      const studentCountMap = new Map<string, number>();
      ((enrollments as any[]) || []).forEach((e) => {
        studentCountMap.set(e.course_id, (studentCountMap.get(e.course_id) || 0) + 1);
      });

      const assignmentCountMap = new Map<string, number>();
      ((assignments as any[]) || []).forEach((a) => {
        assignmentCountMap.set(a.course_id, (assignmentCountMap.get(a.course_id) || 0) + 1);
      });

      const rows: TeacherCourse[] = ((courseData as any[]) || []).map((c) => ({
        course_id: c.id,
        title: c.title,
        description: c.description,
        thumbnail_url: c.thumbnail_url,
        status: c.status,
        student_count: studentCountMap.get(c.id) || 0,
        assignment_count: assignmentCountMap.get(c.id) || 0,
      }));

      setCourses(rows);
      setLoading(false);
    };

    fetch();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-poppins font-bold text-[#1C1C28]">My Courses</h1>
        <p className="text-[#4D4D4D] text-sm mt-1">Courses you teach and manage</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-[#1F4FD8]/30 border-t-[#1F4FD8] rounded-full animate-spin" />
        </div>
      ) : courses.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <BookOpen className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-[#4D4D4D] font-medium">No assigned courses</p>
          <p className="text-sm text-[#9CA3AF] mt-1">Admin will assign courses to you</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {courses.map((c) => (
            <div key={c.course_id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
              <div className="h-36 bg-gradient-to-br from-[#1F4FD8]/10 to-[#1F4FD8]/5">
                {c.thumbnail_url ? (
                  <img src={c.thumbnail_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <BookOpen className="w-12 h-12 text-[#1F4FD8]/30" />
                  </div>
                )}
              </div>
              <div className="p-5 space-y-3">
                <h3 className="font-poppins font-semibold text-[#1C1C28] line-clamp-1">{c.title}</h3>
                <p className="text-sm text-[#4D4D4D] line-clamp-2">{c.description}</p>
                <div className="flex items-center gap-4 text-xs text-[#9CA3AF]">
                  <span className="inline-flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {c.student_count} students</span>
                  <span className="inline-flex items-center gap-1"><ClipboardList className="w-3.5 h-3.5" /> {c.assignment_count} assignments</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
