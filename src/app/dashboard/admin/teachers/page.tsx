"use client";

import React, { useEffect, useState } from "react";
import { createClient } from "@/src/lib/supabase/client";
import { Search, UserPlus, Mail, Phone, Trash2, GraduationCap, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

interface Teacher {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  created_at: string;
  course_count: number;
}

export default function AdminTeachersPage() {
  const supabase = createClient() as any;
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({ full_name: "", email: "", password: "", phone: "" });
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchTeachers = async () => {
    setLoading(true);
    let query = supabase
      .from("profiles")
      .select("id, full_name, email, phone, created_at")
      .eq("role", "teacher")
      .order("created_at", { ascending: false });

    if (search) {
      query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`);
    }

    const { data } = await query;
    const profiles = (data || []) as any[];

    // Fetch course counts from course_teachers
    const teacherIds = profiles.map((t) => t.id);
    let courseCounts: Record<string, number> = {};

    if (teacherIds.length > 0) {
      const { data: ctData } = await supabase
        .from("course_teachers")
        .select("teacher_id")
        .in("teacher_id", teacherIds);

      if (ctData) {
        (ctData as any[]).forEach((ct: any) => {
          courseCounts[ct.teacher_id] = (courseCounts[ct.teacher_id] || 0) + 1;
        });
      }
    }

    setTeachers(
      profiles.map((t) => ({
        ...t,
        course_count: courseCounts[t.id] || 0,
      }))
    );
    setLoading(false);
  };

  useEffect(() => {
    fetchTeachers();
  }, [search]);

  const handleAddTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddLoading(true);
    setAddError("");

    const { error } = await supabase.auth.signUp({
      email: addForm.email,
      password: addForm.password,
      options: {
        data: {
          full_name: addForm.full_name,
          role: "teacher",
          phone: addForm.phone || undefined,
        },
      },
    });

    if (error) {
      setAddError(error.message);
      setAddLoading(false);
      return;
    }

    toast.success("Teacher account created. They will receive a verification email.");
    setShowAddModal(false);
    setAddForm({ full_name: "", email: "", password: "", phone: "" });
    setAddLoading(false);
    // Refresh after a short delay to allow trigger to create profile
    setTimeout(fetchTeachers, 1500);
  };

  const handleDelete = async (id: string) => {
    setDeleting(true);
    await supabase.from("profiles").delete().eq("id", id);
    setShowDeleteModal(null);
    setDeleting(false);
    toast.success("Teacher removed");
    fetchTeachers();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-poppins font-bold text-[#1C1C28]">Teachers</h1>
          <p className="text-[#4D4D4D] text-sm mt-1">Manage teacher accounts</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#1F4FD8] text-white font-poppins font-semibold text-sm rounded-xl hover:bg-[#1a45c2] transition-all shadow-md"
        >
          <UserPlus className="w-4 h-4" />
          Add Teacher
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
        <input
          type="text"
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 border border-[#D4D4D4] rounded-xl bg-white text-[#1C1C28] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#1F4FD8] focus:border-transparent text-sm"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-[#1F4FD8]" />
          </div>
        ) : teachers.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <GraduationCap className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-[#4D4D4D] font-medium">No teachers found</p>
            <p className="text-sm text-[#9CA3AF] mt-1">Add your first teacher to get started</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 text-left">
                  <th className="px-6 py-4 text-xs font-semibold text-[#4D4D4D] uppercase tracking-wider">Name</th>
                  <th className="px-6 py-4 text-xs font-semibold text-[#4D4D4D] uppercase tracking-wider">Email</th>
                  <th className="px-6 py-4 text-xs font-semibold text-[#4D4D4D] uppercase tracking-wider">Phone</th>
                  <th className="px-6 py-4 text-xs font-semibold text-[#4D4D4D] uppercase tracking-wider">Courses</th>
                  <th className="px-6 py-4 text-xs font-semibold text-[#4D4D4D] uppercase tracking-wider">Joined</th>
                  <th className="px-6 py-4 text-xs font-semibold text-[#4D4D4D] uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {teachers.map((teacher) => (
                  <tr key={teacher.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-[#1F4FD8] rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-white text-sm font-bold">
                            {teacher.full_name?.charAt(0)?.toUpperCase() || "T"}
                          </span>
                        </div>
                        <p className="font-medium text-[#1C1C28] text-sm">{teacher.full_name}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-[#9CA3AF]" />
                        <span className="text-sm text-[#4D4D4D]">{teacher.email}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-[#9CA3AF]" />
                        <span className="text-sm text-[#4D4D4D]">{teacher.phone || "—"}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-[#1F4FD8] text-xs font-medium rounded-full">
                        <GraduationCap className="w-3 h-3" />
                        {teacher.course_count}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-[#9CA3AF]">
                      {new Date(teacher.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => setShowDeleteModal(teacher.id)}
                        className="p-2 text-[#4D4D4D] hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                        title="Remove"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Teacher Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl">
            <h3 className="text-lg font-poppins font-bold text-[#1C1C28] mb-4">Add New Teacher</h3>
            {addError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">{addError}</div>
            )}
            <form onSubmit={handleAddTeacher} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#1C1C28] mb-1">Full Name</label>
                <input
                  value={addForm.full_name}
                  onChange={(e) => setAddForm({ ...addForm, full_name: e.target.value })}
                  placeholder="John Doe"
                  className="w-full px-4 py-2.5 border border-[#D4D4D4] rounded-xl text-sm text-[#1C1C28] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#1F4FD8]"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1C1C28] mb-1">Email</label>
                <input
                  type="email"
                  value={addForm.email}
                  onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                  placeholder="teacher@example.com"
                  className="w-full px-4 py-2.5 border border-[#D4D4D4] rounded-xl text-sm text-[#1C1C28] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#1F4FD8]"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1C1C28] mb-1">Phone</label>
                <input
                  type="tel"
                  value={addForm.phone}
                  onChange={(e) => setAddForm({ ...addForm, phone: e.target.value })}
                  placeholder="+1 234 567 8900"
                  className="w-full px-4 py-2.5 border border-[#D4D4D4] rounded-xl text-sm text-[#1C1C28] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#1F4FD8]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1C1C28] mb-1">Temporary Password</label>
                <input
                  type="password"
                  value={addForm.password}
                  onChange={(e) => setAddForm({ ...addForm, password: e.target.value })}
                  placeholder="Min 6 characters"
                  className="w-full px-4 py-2.5 border border-[#D4D4D4] rounded-xl text-sm text-[#1C1C28] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#1F4FD8]"
                  required
                  minLength={6}
                />
              </div>
              <p className="text-xs text-[#9CA3AF]">
                The teacher will receive a verification email. The database trigger will auto-create their profile with role &quot;teacher&quot;.
              </p>
              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => { setShowAddModal(false); setAddError(""); }}
                  className="px-4 py-2 text-sm font-medium text-[#4D4D4D] bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addLoading}
                  className="px-4 py-2 text-sm font-medium text-white bg-[#1F4FD8] rounded-xl hover:bg-[#1a45c2] disabled:opacity-60 transition-colors"
                >
                  {addLoading ? "Adding..." : "Add Teacher"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <h3 className="text-lg font-poppins font-bold text-[#1C1C28] mb-2">Remove Teacher?</h3>
            <p className="text-sm text-[#4D4D4D] mb-6">
              This will remove the teacher profile. This action cannot be undone.
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
                {deleting ? "Removing..." : "Remove"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
