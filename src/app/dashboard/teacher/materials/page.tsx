"use client";

import React, { useEffect, useState } from "react";
import { createClient } from "@/src/lib/supabase/client";
import { FileText, Plus, Download, BookOpen } from "lucide-react";

interface MaterialRow {
  id: string;
  title: string;
  description: string | null;
  file_url: string;
  file_type: string | null;
  created_at: string;
  course_title: string;
}

export default function TeacherMaterialsPage() {
  const supabase = createClient();
  const [materials, setMaterials] = useState<MaterialRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("learning_materials")
        .select("*")
        .eq("teacher_id", user.id)
        .order("created_at", { ascending: false });

      const rows = (data as any[]) || [];
      const courseIds = [...new Set(rows.map((m) => m.course_id))];

      const { data: courses } = courseIds.length
        ? await supabase.from("courses").select("id, title").in("id", courseIds)
        : { data: [] };

      const courseMap = new Map(((courses as any[]) || []).map((c) => [c.id, c.title]));

      setMaterials(
        rows.map((m) => ({
          id: m.id,
          title: m.title,
          description: m.description,
          file_url: m.file_url,
          file_type: m.file_type,
          created_at: m.created_at,
          course_title: courseMap.get(m.course_id) || "Unknown",
        }))
      );

      setLoading(false);
    };

    fetch();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-poppins font-bold text-[#1C1C28]">Learning Materials</h1>
          <p className="text-[#4D4D4D] text-sm mt-1">Upload and manage course materials</p>
        </div>
        <button className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#1F4FD8] text-white font-poppins font-semibold text-sm rounded-xl hover:bg-[#1a45c2] transition-all shadow-md">
          <Plus className="w-4 h-4" />
          Upload Material
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-[#1F4FD8]/30 border-t-[#1F4FD8] rounded-full animate-spin" />
        </div>
      ) : materials.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <FileText className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-[#4D4D4D] font-medium">No materials yet</p>
          <p className="text-sm text-[#9CA3AF] mt-1">Upload your first learning material</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {materials.map((m) => (
            <div key={m.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 bg-[#1F4FD8]/10 rounded-xl flex items-center justify-center flex-shrink-0">
                  <FileText className="w-6 h-6 text-[#1F4FD8]" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-poppins font-semibold text-[#1C1C28] text-sm line-clamp-1">{m.title}</h3>
                  {m.description && (
                    <p className="text-xs text-[#4D4D4D] mt-1 line-clamp-2">{m.description}</p>
                  )}
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs text-[#1F4FD8] bg-[#1F4FD8]/10 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                      <BookOpen className="w-3 h-3" /> {m.course_title}
                    </span>
                  </div>
                  {m.file_type && (
                    <p className="text-xs text-[#9CA3AF] mt-1 uppercase">{m.file_type}</p>
                  )}
                  <p className="text-xs text-[#9CA3AF] mt-1">
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
      )}
    </div>
  );
}
