"use client";

import React, { useEffect, useState } from "react";
import { createClient } from "@/src/lib/supabase/client";
import { Plus, Search, Edit2, Trash2, Eye, MoreVertical, FileText } from "lucide-react";
import Link from "next/link";

interface Course {
  id: string;
  title: string;
  description: string;
  thumbnail_url: string | null;
  price: number;
  currency: string;
  level: string | null;
  category: string | null;
  audience: string | null;
  landing_category: string | null;
  status: string;
  created_at: string;
}

export default function AdminCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showDeleteModal, setShowDeleteModal] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const supabase = createClient() as any;

  const fetchCourses = async () => {
    setLoading(true);
    let query = supabase
      .from("courses")
      .select("*")
      .order("created_at", { ascending: false });

    if (statusFilter !== "all") {
      query = query.eq("status", statusFilter);
    }

    if (search) {
      query = query.ilike("title", `%${search}%`);
    }

    const { data } = await query;
    setCourses((data as Course[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchCourses();
  }, [statusFilter, search]);

  const handleDelete = async (id: string) => {
    setDeleting(true);
    await supabase.from("courses").delete().eq("id", id);
    setShowDeleteModal(null);
    setDeleting(false);
    fetchCourses();
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      published: "bg-green-100 text-green-700",
      draft: "bg-gray-100 text-gray-600",
      archived: "bg-amber-100 text-amber-700",
    };
    return (
      <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${styles[status] || styles.draft}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-poppins font-bold text-[#1C1C28]">Courses</h1>
          <p className="text-[#4D4D4D] text-sm mt-1">Manage all courses on the platform</p>
        </div>
        <Link
          href="/dashboard/admin/courses/create"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#1F4FD8] text-white font-poppins font-semibold text-sm rounded-xl hover:bg-[#1a45c2] transition-all shadow-md"
        >
          <Plus className="w-4 h-4" />
          Create Course
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
          <input
            type="text"
            placeholder="Search courses..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-[#D4D4D4] rounded-xl bg-white text-[#1C1C28] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#1F4FD8] focus:border-transparent text-sm"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2.5 border border-[#D4D4D4] rounded-xl bg-white text-[#1C1C28] text-sm focus:outline-none focus:ring-2 focus:ring-[#1F4FD8]"
        >
          <option value="all">All Status</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-[#1F4FD8]/30 border-t-[#1F4FD8] rounded-full animate-spin" />
          </div>
        ) : courses.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <Eye className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-[#4D4D4D] font-medium">No courses found</p>
            <p className="text-sm text-[#9CA3AF] mt-1">Create your first course to get started</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 text-left">
                  <th className="px-6 py-4 text-xs font-semibold text-[#4D4D4D] uppercase tracking-wider">Course</th>
                  <th className="px-6 py-4 text-xs font-semibold text-[#4D4D4D] uppercase tracking-wider">Category</th>
                  <th className="px-6 py-4 text-xs font-semibold text-[#4D4D4D] uppercase tracking-wider">Audience</th>
                  <th className="px-6 py-4 text-xs font-semibold text-[#4D4D4D] uppercase tracking-wider">Landing</th>
                  <th className="px-6 py-4 text-xs font-semibold text-[#4D4D4D] uppercase tracking-wider">Level</th>
                  <th className="px-6 py-4 text-xs font-semibold text-[#4D4D4D] uppercase tracking-wider">Price</th>
                  <th className="px-6 py-4 text-xs font-semibold text-[#4D4D4D] uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-xs font-semibold text-[#4D4D4D] uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {courses.map((course) => (
                  <tr key={course.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0">
                          {course.thumbnail_url ? (
                            <img src={course.thumbnail_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                              <Eye className="w-5 h-5" />
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-[#1C1C28] text-sm">{course.title}</p>
                          <p className="text-xs text-[#9CA3AF] mt-0.5 line-clamp-1 max-w-[200px]">
                            {course.description}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-[#4D4D4D]">{course.category || "—"}</td>
                    <td className="px-6 py-4 text-sm text-[#4D4D4D] capitalize">{course.audience || "—"}</td>
                    <td className="px-6 py-4 text-sm text-[#4D4D4D] capitalize">{course.landing_category || "—"}</td>
                    <td className="px-6 py-4 text-sm text-[#4D4D4D] capitalize">{course.level || "—"}</td>
                    <td className="px-6 py-4 text-sm font-medium text-[#1C1C28]">
                      {course.currency} {Number(course.price).toFixed(2)}
                    </td>
                    <td className="px-6 py-4">{getStatusBadge(course.status)}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/dashboard/admin/courses/${course.id}/content`}
                          className="p-2 text-[#4D4D4D] hover:text-[#1F4FD8] hover:bg-blue-50 rounded-lg transition-all"
                          title="Manage Content"
                        >
                          <FileText className="w-4 h-4" />
                        </Link>
                        <Link
                          href={`/dashboard/admin/courses/${course.id}/edit`}
                          className="p-2 text-[#4D4D4D] hover:text-[#1F4FD8] hover:bg-blue-50 rounded-lg transition-all"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => setShowDeleteModal(course.id)}
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
        )}
      </div>

      {/* Delete confirmation modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <h3 className="text-lg font-poppins font-bold text-[#1C1C28] mb-2">Delete Course?</h3>
            <p className="text-sm text-[#4D4D4D] mb-6">
              This action cannot be undone. All related enrollments, assignments, and data will be permanently removed.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteModal(null)}
                className="px-4 py-2 text-sm font-medium text-[#4D4D4D] bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(showDeleteModal)}
                disabled={deleting}
                className="px-4 py-2 text-sm font-medium text-white bg-red-500 rounded-xl hover:bg-red-600 disabled:opacity-60 transition-colors"
              >
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
