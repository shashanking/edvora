"use client";

import React, { useState, useEffect } from "react";
import { createClient } from "@/src/lib/supabase/client";
import {
  FolderOpen,
  Upload,
  Trash2,
  Loader2,
  FileText,
  Video,
  Music,
  Image,
  Download,
  X,
  Filter,
} from "lucide-react";
import toast from "react-hot-toast";
import FileUpload from "@/src/components/shared/FileUpload";

interface Material {
  id: string;
  course_id: string;
  course_title: string;
  title: string;
  description: string | null;
  file_url: string;
  file_type: string | null;
  file_size: number | null;
  created_at: string;
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

function getFileTypeBadge(fileType: string | null) {
  if (!fileType) return "Other";
  const upper = fileType.toUpperCase();
  return upper;
}

export default function AdminMaterialsPage() {
  const supabase = createClient() as any;
  const [materials, setMaterials] = useState<Material[]>([]);
  const [courses, setCourses] = useState<CourseOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState<string | null>(null);
  const [filterCourseId, setFilterCourseId] = useState("");

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
    const [materialsRes, coursesRes] = await Promise.all([
      supabase
        .from("course_materials")
        .select("*, courses(title)")
        .order("created_at", { ascending: false }),
      supabase.from("courses").select("id, title").order("title"),
    ]);

    if (materialsRes.data) {
      setMaterials(
        materialsRes.data.map((m: any) => ({
          ...m,
          course_title: m.courses?.title || "Unknown",
        }))
      );
    }
    if (coursesRes.data) {
      setCourses(coursesRes.data as CourseOption[]);
    }
    setLoading(false);
  };

  const handleSave = async () => {
    if (!form.course_id || !form.title || !form.file_url) {
      toast.error("Course, title, and file are required");
      return;
    }

    setSaving(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setSaving(false);
      return;
    }

    const { error: insertError } = await supabase
      .from("course_materials")
      .insert({
        course_id: form.course_id,
        uploaded_by: user.id,
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

  const deleteMaterial = async (id: string) => {
    await supabase.from("course_materials").delete().eq("id", id);
    setShowDeleteModal(null);
    toast.success("Material deleted");
    fetchData();
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
          <h1 className="text-2xl font-poppins font-bold text-[#1C1C28]">Course Materials</h1>
          <p className="text-[#4D4D4D] text-sm mt-1">
            Upload and manage course documents and resources
          </p>
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

      {/* Materials Table */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center shadow-sm">
          <FolderOpen className="w-12 h-12 text-[#D4D4D4] mx-auto mb-3" />
          <p className="text-[#4D4D4D] font-medium">No materials found</p>
          <p className="text-sm text-[#9CA3AF] mt-1">Upload your first material to get started</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 text-left">
                  <th className="px-6 py-4 text-xs font-semibold text-[#4D4D4D] uppercase tracking-wider">
                    Title
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold text-[#4D4D4D] uppercase tracking-wider">
                    Course
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold text-[#4D4D4D] uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold text-[#4D4D4D] uppercase tracking-wider">
                    Size
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold text-[#4D4D4D] uppercase tracking-wider">
                    Uploaded
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold text-[#4D4D4D] uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((m) => (
                  <tr key={m.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0">
                          {FILE_ICONS[m.file_type || ""] || (
                            <FileText className="w-5 h-5 text-gray-400" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-[#1C1C28] text-sm">{m.title}</p>
                          {m.description && (
                            <p className="text-xs text-[#9CA3AF] mt-0.5 line-clamp-1 max-w-[200px]">
                              {m.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-[#4D4D4D]">{m.course_title}</td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 bg-gray-100 text-[#4D4D4D] text-xs font-medium rounded-full">
                        {getFileTypeBadge(m.file_type)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-[#4D4D4D]">
                      {formatFileSize(m.file_size)}
                    </td>
                    <td className="px-6 py-4 text-sm text-[#9CA3AF]">
                      {new Date(m.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1">
                        <a
                          href={m.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 text-[#1F4FD8] hover:bg-blue-50 rounded-lg transition-all"
                          title="Download"
                        >
                          <Download className="w-4 h-4" />
                        </a>
                        <button
                          onClick={() => setShowDeleteModal(m.id)}
                          className="p-2 text-[#4D4D4D] hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <h3 className="text-lg font-poppins font-bold text-[#1C1C28] mb-2">Delete Material?</h3>
            <p className="text-sm text-[#4D4D4D] mb-6">
              This will permanently remove this material.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteModal(null)}
                className="px-4 py-2 text-sm font-medium text-[#4D4D4D] bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteMaterial(showDeleteModal)}
                className="px-4 py-2 text-sm font-medium text-white bg-red-500 rounded-xl hover:bg-red-600 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
