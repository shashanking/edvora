"use client";

import React, { useEffect, useState } from "react";
import { createClient } from "@/src/lib/supabase/client";
import {
  FileText,
  Upload,
  Download,
  BookOpen,
  Loader2,
  X,
  Filter,
  Video,
  Music,
  Image,
  FolderOpen,
} from "lucide-react";
import toast from "react-hot-toast";
import FileUpload from "@/src/components/shared/FileUpload";

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
  source: "course_materials" | "learning_materials";
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

export default function TeacherMaterialsPage() {
  const supabase = createClient() as any;
  const [materials, setMaterials] = useState<MaterialRow[]>([]);
  const [courses, setCourses] = useState<CourseOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [filterCourseId, setFilterCourseId] = useState("");
  const [userId, setUserId] = useState("");

  const [form, setForm] = useState({
    course_id: "",
    title: "",
    description: "",
    file_url: "",
    file_type: "",
    file_size: 0,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    setUserId(user.id);

    // Get teacher's course IDs from course_teachers
    const { data: teacherCourses } = await supabase
      .from("course_teachers")
      .select("course_id")
      .eq("teacher_id", user.id);

    const courseIds = (teacherCourses as any[] || []).map((tc: any) => tc.course_id);

    if (courseIds.length === 0) {
      setMaterials([]);
      setCourses([]);
      setLoading(false);
      return;
    }

    // Fetch courses, course_materials, and learning_materials in parallel
    const [coursesRes, courseMaterialsRes, learningMaterialsRes] = await Promise.all([
      supabase.from("courses").select("id, title").in("id", courseIds).order("title"),
      supabase
        .from("course_materials")
        .select("*, courses(title)")
        .in("course_id", courseIds)
        .order("created_at", { ascending: false }),
      supabase
        .from("learning_materials")
        .select("*")
        .in("course_id", courseIds)
        .order("created_at", { ascending: false }),
    ]);

    if (coursesRes.data) {
      setCourses(coursesRes.data as CourseOption[]);
    }

    const courseMap = new Map(
      ((coursesRes.data as any[]) || []).map((c: any) => [c.id, c.title])
    );

    const cmRows: MaterialRow[] = ((courseMaterialsRes.data as any[]) || []).map((m: any) => ({
      id: m.id,
      title: m.title,
      description: m.description,
      file_url: m.file_url,
      file_type: m.file_type,
      file_size: m.file_size,
      created_at: m.created_at,
      course_id: m.course_id,
      course_title: m.courses?.title || courseMap.get(m.course_id) || "Unknown",
      source: "course_materials" as const,
    }));

    const lmRows: MaterialRow[] = ((learningMaterialsRes.data as any[]) || []).map((m: any) => ({
      id: m.id,
      title: m.title,
      description: m.description,
      file_url: m.file_url,
      file_type: m.file_type,
      file_size: m.file_size || null,
      created_at: m.created_at,
      course_id: m.course_id,
      course_title: courseMap.get(m.course_id) || "Unknown",
      source: "learning_materials" as const,
    }));

    // Combine and sort by date descending
    const all = [...cmRows, ...lmRows].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    setMaterials(all);
    setLoading(false);
  };

  const handleSave = async () => {
    if (!form.course_id || !form.title || !form.file_url) {
      toast.error("Course, title, and file are required");
      return;
    }

    setSaving(true);

    const { error: insertError } = await supabase.from("course_materials").insert({
      course_id: form.course_id,
      uploaded_by: userId,
      title: form.title,
      description: form.description || null,
      file_url: form.file_url,
      file_type: form.file_type || null,
      file_size: form.file_size || null,
    } as any);

    if (insertError) {
      toast.error(insertError.message);
    } else {
      toast.success("Material uploaded successfully");
      setShowModal(false);
      setForm({ course_id: "", title: "", description: "", file_url: "", file_type: "", file_size: 0 });
      fetchData();
    }
    setSaving(false);
  };

  const filtered = materials.filter((m) => {
    if (!filterCourseId) return true;
    return m.course_id === filterCourseId;
  });

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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-poppins font-bold text-[#1C1C28]">Learning Materials</h1>
          <p className="text-[#4D4D4D] text-sm mt-1">Upload and manage course materials</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#1F4FD8] text-white font-poppins font-semibold text-sm rounded-xl hover:bg-[#1a45c2] transition-all shadow-md"
        >
          <Upload className="w-4 h-4" />
          Upload Material
        </button>
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

      {/* Materials Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <FolderOpen className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-[#4D4D4D] font-medium">No materials found</p>
          <p className="text-sm text-[#9CA3AF] mt-1">Upload your first learning material</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((m) => (
            <div
              key={`${m.source}-${m.id}`}
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
                    <p className="text-xs text-[#4D4D4D] mt-1 line-clamp-2">{m.description}</p>
                  )}
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <span className="text-xs text-[#1F4FD8] bg-[#1F4FD8]/10 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                      <BookOpen className="w-3 h-3" /> {m.course_title}
                    </span>
                    {m.file_type && (
                      <span className="px-2 py-0.5 bg-gray-100 text-[#4D4D4D] text-xs font-medium rounded-full uppercase">
                        {m.file_type}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-1.5">
                    {m.file_size && (
                      <span className="text-xs text-[#9CA3AF]">{formatFileSize(m.file_size)}</span>
                    )}
                    <span className="text-xs text-[#9CA3AF]">
                      {new Date(m.created_at).toLocaleDateString()}
                    </span>
                  </div>
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
      )}

      {/* Upload Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-poppins font-bold text-[#1C1C28]">Upload Material</h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-[#4D4D4D]" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#1C1C28] mb-1.5">Course</label>
                <select
                  value={form.course_id}
                  onChange={(e) => setForm({ ...form, course_id: e.target.value })}
                  className="w-full px-4 py-3 border border-[#D4D4D4] rounded-xl bg-white text-[#1C1C28] text-sm focus:outline-none focus:ring-2 focus:ring-[#1F4FD8]"
                >
                  <option value="">Select course</option>
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#1C1C28] mb-1.5">Title</label>
                <input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Material title"
                  className="w-full px-4 py-3 border border-[#D4D4D4] rounded-xl bg-white text-[#1C1C28] placeholder:text-[#9CA3AF] text-sm focus:outline-none focus:ring-2 focus:ring-[#1F4FD8]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#1C1C28] mb-1.5">
                  Description (optional)
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Brief description of the material"
                  rows={3}
                  className="w-full px-4 py-3 border border-[#D4D4D4] rounded-xl bg-white text-[#1C1C28] placeholder:text-[#9CA3AF] text-sm focus:outline-none focus:ring-2 focus:ring-[#1F4FD8]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#1C1C28] mb-1.5">File</label>
                <FileUpload
                  bucket="materials"
                  folder={form.course_id ? `course-${form.course_id}` : ""}
                  accept="*"
                  maxSizeMB={50}
                  onUpload={(url, _fileName, fileType, fileSize) => {
                    setForm((prev) => ({
                      ...prev,
                      file_url: url,
                      file_type: fileType,
                      file_size: fileSize,
                    }));
                  }}
                  label="Click to upload a file"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-6 py-2.5 bg-[#1F4FD8] text-white font-semibold rounded-xl hover:bg-[#1a45c2] disabled:opacity-60 transition-all text-sm flex items-center gap-2"
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Upload className="w-4 h-4" />
                  )}
                  Save Material
                </button>
                <button
                  onClick={() => setShowModal(false)}
                  className="px-6 py-2.5 text-[#4D4D4D] border border-[#D4D4D4] rounded-xl hover:bg-gray-50 transition-all text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
