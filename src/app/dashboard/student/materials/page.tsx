"use client";

import React, { useEffect, useState } from "react";
import { createClient } from "@/src/lib/supabase/client";
import {
  FileText,
  Download,
  BookOpen,
  Loader2,
  Filter,
  Video,
  Music,
  Image,
  FolderOpen,
} from "lucide-react";

interface MaterialRow {
  id: string;
  title: string;
  description: string | null;
  file_url: string;
  file_type: string | null;
  file_size: number | null;
  created_at: string;
  course_id: string;
  course_title: string;
}

interface CourseOption {
  id: string;
  title: string;
}

const FILE_ICONS: Record<string, React.ReactNode> = {
  pdf: <FileText className="w-5 h-5 text-red-500" />,
  doc: <FileText className="w-5 h-5 text-blue-500" />,
  docx: <FileText className="w-5 h-5 text-blue-500" />,
  mp4: <Video className="w-5 h-5 text-purple-500" />,
  mp3: <Music className="w-5 h-5 text-green-500" />,
  wav: <Music className="w-5 h-5 text-green-500" />,
  jpg: <Image className="w-5 h-5 text-amber-500" />,
  jpeg: <Image className="w-5 h-5 text-amber-500" />,
  png: <Image className="w-5 h-5 text-amber-500" />,
};

function formatFileSize(bytes: number | null) {
  if (!bytes) return "—";
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

export default function StudentMaterialsPage() {
  const supabase = createClient() as any;
  const [materials, setMaterials] = useState<MaterialRow[]>([]);
  const [courses, setCourses] = useState<CourseOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterCourseId, setFilterCourseId] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    // Get student's enrolled course IDs
    const { data: enrollments } = await supabase
      .from("enrollments")
      .select("course_id")
      .eq("student_id", user.id);

    const courseIds = (enrollments as any[] || []).map((e: any) => e.course_id);

    if (courseIds.length === 0) {
      setMaterials([]);
      setCourses([]);
      setLoading(false);
      return;
    }

    // Fetch courses and materials in parallel
    const [coursesRes, materialsRes] = await Promise.all([
      supabase.from("courses").select("id, title").in("id", courseIds).order("title"),
      supabase
        .from("course_materials")
        .select("*, courses(title)")
        .in("course_id", courseIds)
        .order("created_at", { ascending: false }),
    ]);

    if (coursesRes.data) {
      setCourses(coursesRes.data as CourseOption[]);
    }

    if (materialsRes.data) {
      setMaterials(
        (materialsRes.data as any[]).map((m: any) => ({
          id: m.id,
          title: m.title,
          description: m.description,
          file_url: m.file_url,
          file_type: m.file_type,
          file_size: m.file_size,
          created_at: m.created_at,
          course_id: m.course_id,
          course_title: m.courses?.title || "Unknown",
        }))
      );
    }

    setLoading(false);
  };

  const filtered = materials.filter((m) => {
    if (!filterCourseId) return true;
    return m.course_id === filterCourseId;
  });

  // Group materials by course for organized display
  const groupedByCourse = filtered.reduce<Record<string, MaterialRow[]>>((acc, m) => {
    const key = m.course_title;
    if (!acc[key]) acc[key] = [];
    acc[key].push(m);
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-[#1F4FD8]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-poppins font-bold text-[#1C1C28]">Course Materials</h1>
        <p className="text-[#4D4D4D] text-sm mt-1">
          Access study materials for your enrolled courses
        </p>
      </div>

      {/* Course Filter */}
      <div className="flex items-center gap-3">
        <Filter className="w-4 h-4 text-[#4D4D4D]" />
        <select
          value={filterCourseId}
          onChange={(e) => setFilterCourseId(e.target.value)}
          className="px-4 py-2.5 border border-[#D4D4D4] rounded-xl bg-white text-[#1C1C28] text-sm focus:outline-none focus:ring-2 focus:ring-[#1F4FD8] focus:border-transparent min-w-[220px]"
        >
          <option value="">All Courses</option>
          {courses.map((c) => (
            <option key={c.id} value={c.id}>
              {c.title}
            </option>
          ))}
        </select>
        {filterCourseId && (
          <button
            onClick={() => setFilterCourseId("")}
            className="text-xs text-[#1F4FD8] hover:underline"
          >
            Clear filter
          </button>
        )}
      </div>

      {/* Materials */}
      {filtered.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <FolderOpen className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-[#4D4D4D] font-medium">No materials available</p>
          <p className="text-sm text-[#9CA3AF] mt-1">
            Materials will appear here when your teachers upload them
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedByCourse).map(([courseName, items]) => (
            <div key={courseName}>
              <div className="flex items-center gap-2 mb-4">
                <BookOpen className="w-4 h-4 text-[#1F4FD8]" />
                <h2 className="text-base font-poppins font-semibold text-[#1C1C28]">
                  {courseName}
                </h2>
                <span className="text-xs text-[#9CA3AF] ml-1">
                  ({items.length} {items.length === 1 ? "material" : "materials"})
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {items.map((m) => (
                  <div
                    key={m.id}
                    className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 bg-[#1F4FD8]/10 rounded-xl flex items-center justify-center flex-shrink-0">
                        {FILE_ICONS[m.file_type || ""] || (
                          <FileText className="w-6 h-6 text-[#1F4FD8]" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-poppins font-semibold text-[#1C1C28] text-sm line-clamp-1">
                          {m.title}
                        </h3>
                        {m.description && (
                          <p className="text-xs text-[#4D4D4D] mt-1 line-clamp-2">
                            {m.description}
                          </p>
                        )}
                        <div className="flex items-center gap-3 mt-2 flex-wrap">
                          {m.file_type && (
                            <span className="px-2 py-0.5 bg-gray-100 text-[#4D4D4D] text-xs font-medium rounded-full uppercase">
                              {m.file_type}
                            </span>
                          )}
                          {m.file_size && (
                            <span className="text-xs text-[#9CA3AF]">
                              {formatFileSize(m.file_size)}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[#9CA3AF] mt-1.5">
                          {new Date(m.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <a
                      href={m.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 w-full inline-flex items-center justify-center gap-2 px-3 py-2 bg-gray-50 hover:bg-gray-100 text-[#1C1C28] text-xs font-medium rounded-lg transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Download
                    </a>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
