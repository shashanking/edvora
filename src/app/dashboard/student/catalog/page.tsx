"use client";

import React, { useEffect, useState } from "react";
import { createClient } from "@/src/lib/supabase/client";
import { BookOpen, Clock, Star, Loader2, CheckCircle } from "lucide-react";
import RazorpayCheckout from "@/src/components/payments/RazorpayCheckout";
import { useSearchParams } from "next/navigation";

interface Course {
  id: string;
  title: string;
  description: string;
  price: number;
  currency: string;
  duration: string | null;
  level: string | null;
  category: string | null;
  thumbnail_url: string | null;
  rating: number | null;
  audience: string | null;
  landing_category: string | null;
}

export default function StudentCatalogPage() {
  const supabase = createClient() as any;
  const searchParams = useSearchParams();
  const [courses, setCourses] = useState<Course[]>([]);
  const [user, setUser] = useState<any>(null);
  const [enrolledCourseIds, setEnrolledCourseIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const { data: userData } = await supabase.auth.getUser();
    if (userData.user) setUser(userData.user);

    // Fetch published courses
    const { data: courseData } = await supabase
      .from("courses")
      .select("*")
      .eq("status", "published")
      .order("display_order", { ascending: true })
      .order("created_at", { ascending: false });

    const coursesList = (courseData as Course[]) || [];

    // Fetch user's enrollments if logged in
    if (userData.user) {
      const { data: enrollments } = await supabase
        .from("enrollments")
        .select("course_id")
        .eq("student_id", userData.user.id);

      const enrolledIds = new Set(((enrollments as any[]) || []).map((e) => e.course_id));
      setEnrolledCourseIds(enrolledIds);
    }

    setCourses(coursesList);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-[#1F4FD8]" />
      </div>
    );
  }

  const enrolledSuccess = searchParams.get("enrolled") === "success";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-poppins font-bold text-[#1C1C28]">Course Catalog</h1>
        <p className="text-[#4D4D4D] text-sm mt-1">Discover and enroll in new courses</p>
      </div>

      {enrolledSuccess && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-green-700 text-sm flex items-center gap-2">
          <CheckCircle className="w-5 h-5" />
          Enrollment successful! Your course is now available in My Courses.
        </div>
      )}

      {courses.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <BookOpen className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-[#4D4D4D] font-medium">No courses available</p>
          <p className="text-sm text-[#9CA3AF] mt-1">Check back later for new courses</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => {
            const isEnrolled = enrolledCourseIds.has(course.id);
            return (
              <div
                key={course.id}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="h-48 bg-gradient-to-br from-[#1F4FD8]/10 to-[#1F4FD8]/5 relative">
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
                  {course.rating && (
                    <span className="absolute top-3 right-3 px-2.5 py-1 bg-white/90 backdrop-blur-sm rounded-full text-xs font-medium flex items-center gap-1">
                      <Star className="w-3 h-3 fill-[#FFC83D] text-[#FFC83D]" />
                      {course.rating}
                    </span>
                  )}
                </div>
                <div className="p-5 space-y-4">
                  <div>
                    <h3 className="font-poppins font-semibold text-[#1C1C28] line-clamp-2">
                      {course.title}
                    </h3>
                    <p className="text-sm text-[#4D4D4D] line-clamp-2 mt-1">
                      {course.description}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-[#9CA3AF]">
                    {course.duration && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" /> {course.duration}
                      </span>
                    )}
                    {course.level && (
                      <span className="capitalize">{course.level}</span>
                    )}
                    {course.audience && (
                      <span className="capitalize">{course.audience}</span>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                    <div>
                      <p className="text-lg font-bold text-[#1C1C28]">
                        {course.currency} {course.price.toFixed(2)}
                      </p>
                      {course.landing_category && (
                        <p className="text-xs text-[#9CA3AF] capitalize mt-0.5">
                          {course.landing_category}
                        </p>
                      )}
                    </div>

                    {isEnrolled ? (
                      <div className="px-4 py-2 bg-green-100 text-green-700 text-sm font-medium rounded-xl">
                        Enrolled
                      </div>
                    ) : user ? (
                      <RazorpayCheckout
                        courseId={course.id}
                        courseTitle={course.title}
                        price={course.price}
                        currency={course.currency}
                        userName={user.user_metadata?.full_name || user.email}
                        userEmail={user.email}
                      />
                    ) : (
                      <div className="px-4 py-2 bg-gray-100 text-gray-500 text-sm font-medium rounded-xl">
                        Login to enroll
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
