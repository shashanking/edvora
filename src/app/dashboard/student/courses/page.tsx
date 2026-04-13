"use client";

import React, { useEffect, useState } from "react";
import { createClient } from "@/src/lib/supabase/client";
import { BookOpen, CheckCircle, Clock, TrendingUp } from "lucide-react";
import Link from "next/link";

interface EnrolledCourse {
  id: string;
  course_id: string;
  status: string;
  progress: number;
  enrolled_at: string;
  title: string;
  description: string;
  thumbnail_url: string | null;
  duration: string | null;
  level: string | null;
  category: string | null;
}

export default function StudentCoursesPage() {
  const supabase = createClient() as any;
  const [courses, setCourses] = useState<EnrolledCourse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: enrollments } = await supabase
        .from("enrollments")
        .select("*")
        .eq("student_id", user.id)
        .in("status", ["active", "completed"])
        .order("enrolled_at", { ascending: false });

      const rows = (enrollments as any[]) || [];
      const courseIds = rows.map((e) => e.course_id);

      if (courseIds.length === 0) {
        setCourses([]);
        setLoading(false);
        return;
      }

      const { data: courseData } = await supabase
        .from("courses")
        .select("id, title, description, thumbnail_url, duration, level, category")
        .in("id", courseIds);

      const courseMap = new Map(
        ((courseData as any[]) || []).map((c) => [c.id, c])
      );

      const merged: EnrolledCourse[] = rows.map((e) => {
        const c = courseMap.get(e.course_id) || {};
        return {
          id: e.id,
          course_id: e.course_id,
          status: e.status,
          progress: e.progress,
          enrolled_at: e.enrolled_at,
          title: c.title || "Untitled",
          description: c.description || "",
          thumbnail_url: c.thumbnail_url || null,
          duration: c.duration || null,
          level: c.level || null,
          category: c.category || null,
        };
      });

      setCourses(merged);
      setLoading(false);
    };
    fetch();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-poppins font-bold text-[#1C1C28]">My Courses</h1>
        <p className="text-[#4D4D4D] text-sm mt-1">View and continue your enrolled courses</p>
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
          <p className="text-[#4D4D4D] font-medium">No enrolled courses yet</p>
          <p className="text-sm text-[#9CA3AF] mt-1">Your purchased courses will appear here</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {courses.map((course) => (
            <Link
              key={course.id}
              href={`/dashboard/student/courses/${course.course_id}`}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow block"
            >
              <div className="h-40 bg-gradient-to-br from-[#1F4FD8]/10 to-[#1F4FD8]/5 relative">
                {course.thumbnail_url ? (
                  <img
                    src={course.thumbnail_url}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <BookOpen className="w-12 h-12 text-[#1F4FD8]/30" />
                  </div>
                )}
                {course.category && (
                  <span className="absolute top-3 left-3 px-2.5 py-1 bg-white/90 backdrop-blur-sm rounded-full text-xs font-medium text-[#1F4FD8]">
                    {course.category}
                  </span>
                )}
              </div>
              <div className="p-5 space-y-3">
                <h3 className="font-poppins font-semibold text-[#1C1C28] line-clamp-1">
                  {course.title}
                </h3>
                <p className="text-sm text-[#4D4D4D] line-clamp-2">
                  {course.description}
                </p>
                <div className="flex items-center gap-4 text-xs text-[#9CA3AF]">
                  {course.duration && (
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> {course.duration}
                    </span>
                  )}
                  {course.level && (
                    <span className="capitalize">{course.level}</span>
                  )}
                </div>
                {/* Progress bar */}
                <div>
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="text-[#4D4D4D] font-medium flex items-center gap-1">
                      <TrendingUp className="w-3.5 h-3.5" /> Progress
                    </span>
                    {course.status === "completed" ? (
                      <span className="text-green-600 font-semibold flex items-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5" /> Completed
                      </span>
                    ) : (
                      <span className="text-[#1F4FD8] font-semibold">{course.progress}%</span>
                    )}
                  </div>
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${course.status === "completed" ? "bg-green-500" : "bg-[#1F4FD8]"}`}
                      style={{ width: `${course.progress}%` }}
                    />
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
