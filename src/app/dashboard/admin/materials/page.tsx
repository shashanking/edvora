"use client";

import React, { useState, useEffect } from "react";
import { createClient } from "@/src/lib/supabase/client";
import { FolderOpen, Upload, Trash2, Loader2, FileText, Video, Music, Image } from "lucide-react";

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
  video: <Video className="w-5 h-5 text-purple-500" />,
  audio: <Music className="w-5 h-5 text-green-500" />,
  image: <Image className="w-5 h-5 text-amber-500" />,
};

export default function AdminMaterialsPage() {
  const supabase = createClient() as any;
  const [materials, setMaterials] = useState<Material[]>([]);
  const [courses, setCourses] = useState<CourseOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    course_id: "",
    title: "",
    description: "",
    file_url: "",
    file_type: "pdf",
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

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!form.course_id || !form.title || !form.file_url) {
      setError("Course, title, and file URL are required");
      return;
    }

    setUploading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setUploading(false); return; }

    const { error: insertError } = await supabase
      .from("course_materials")
      .insert({
        course_id: form.course_id,
        uploaded_by: user.id,
        title: form.title,
        description: form.description || null,
        file_url: form.file_url,
        file_type: form.file_type,
      } as any);

    if (insertError) {
      setError(insertError.message);
    } else {
      setShowForm(false);
      setForm({ course_id: "", title: "", description: "", file_url: "", file_type: "pdf" });
      fetchData();
    }
    setUploading(false);
  };

  const deleteMaterial = async (id: string) => {
    if (!confirm("Delete this material?")) return;
    await supabase.from("course_materials").delete().eq("id", id);
    fetchData();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-[#1F4FD8]" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-poppins font-bold text-[#1C1C28]">Course Materials</h1>
          <p className="text-[#4D4D4D] mt-1">Upload and manage course documents and resources</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#1F4FD8] text-white font-semibold rounded-xl hover:bg-[#1a45c2] transition-all text-sm"
        >
          <Upload className="w-4 h-4" />
          Upload Material
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-[#1C1C28] mb-4">Upload New Material</h2>
          {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">{error}</div>}
          <form onSubmit={handleUpload} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#1C1C28] mb-1.5">Course</label>
                <select
                  value={form.course_id}
                  onChange={(e) => setForm({ ...form, course_id: e.target.value })}
                  className="w-full px-4 py-3 border border-[#D4D4D4] rounded-xl bg-white text-[#1C1C28] text-sm focus:outline-none focus:ring-2 focus:ring-[#1F4FD8]"
                >
                  <option value="">Select course</option>
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>{c.title}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1C1C28] mb-1.5">File Type</label>
                <select
                  value={form.file_type}
                  onChange={(e) => setForm({ ...form, file_type: e.target.value })}
                  className="w-full px-4 py-3 border border-[#D4D4D4] rounded-xl bg-white text-[#1C1C28] text-sm focus:outline-none focus:ring-2 focus:ring-[#1F4FD8]"
                >
                  <option value="pdf">PDF</option>
                  <option value="doc">DOC/DOCX</option>
                  <option value="video">Video</option>
                  <option value="audio">Audio</option>
                  <option value="image">Image</option>
                  <option value="other">Other</option>
                </select>
              </div>
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
              <label className="block text-sm font-medium text-[#1C1C28] mb-1.5">Description (optional)</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Brief description"
                rows={2}
                className="w-full px-4 py-3 border border-[#D4D4D4] rounded-xl bg-white text-[#1C1C28] placeholder:text-[#9CA3AF] text-sm focus:outline-none focus:ring-2 focus:ring-[#1F4FD8]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#1C1C28] mb-1.5">File URL</label>
              <input
                value={form.file_url}
                onChange={(e) => setForm({ ...form, file_url: e.target.value })}
                placeholder="https://... or Supabase Storage URL"
                className="w-full px-4 py-3 border border-[#D4D4D4] rounded-xl bg-white text-[#1C1C28] placeholder:text-[#9CA3AF] text-sm focus:outline-none focus:ring-2 focus:ring-[#1F4FD8]"
              />
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={uploading}
                className="px-6 py-2.5 bg-[#1F4FD8] text-white font-semibold rounded-xl hover:bg-[#1a45c2] disabled:opacity-60 transition-all text-sm flex items-center gap-2"
              >
                {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                Upload
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-6 py-2.5 text-[#4D4D4D] border border-[#D4D4D4] rounded-xl hover:bg-gray-50 transition-all text-sm"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {materials.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center shadow-sm">
          <FolderOpen className="w-12 h-12 text-[#D4D4D4] mx-auto mb-3" />
          <p className="text-[#4D4D4D] font-medium">No materials uploaded yet</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {materials.map((m) => (
            <div key={m.id} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
                  {FILE_ICONS[m.file_type || "other"] || <FileText className="w-5 h-5 text-gray-400" />}
                </div>
                <div>
                  <p className="font-medium text-[#1C1C28] text-sm">{m.title}</p>
                  <p className="text-xs text-[#9CA3AF]">
                    {m.course_title} &middot; {m.file_type?.toUpperCase()} &middot; {new Date(m.created_at).toLocaleDateString()}
                  </p>
                  {m.description && <p className="text-xs text-[#4D4D4D] mt-0.5">{m.description}</p>}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={m.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 text-xs font-medium text-[#1F4FD8] hover:bg-blue-50 rounded-lg transition-all"
                >
                  View
                </a>
                <button
                  onClick={() => deleteMaterial(m.id)}
                  className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
