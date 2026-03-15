"use client";

import React, { useEffect, useState } from "react";
import { createClient } from "@/src/lib/supabase/client";
import { Search, UserPlus, Mail, Trash2, GraduationCap } from "lucide-react";

interface Teacher {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  created_at: string;
}

export default function AdminTeachersPage() {
  const supabase = createClient();
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({ full_name: "", email: "", password: "" });
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState<string | null>(null);

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
    setTeachers((data as Teacher[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchTeachers();
  }, [search]);

  const handleAddTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddLoading(true);
    setAddError("");

    // Create user via Supabase auth (admin should use service role in production)
    const { error } = await supabase.auth.signUp({
      email: addForm.email,
      password: addForm.password,
      options: {
        data: {
          full_name: addForm.full_name,
          role: "teacher",
        },
      },
    });

    if (error) {
      setAddError(error.message);
      setAddLoading(false);
      return;
    }

    setShowAddModal(false);
    setAddForm({ full_name: "", email: "", password: "" });
    setAddLoading(false);
    // Refresh after a short delay to allow trigger to create profile
    setTimeout(fetchTeachers, 1500);
  };

  const handleDelete = async (id: string) => {
    await supabase.from("profiles").delete().eq("id", id);
    setShowDeleteModal(null);
    fetchTeachers();
  };

  return (
    <div className="space-y-6">
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

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
        <input
          type="text"
          placeholder="Search teachers..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 border border-[#D4D4D4] rounded-xl bg-white text-[#1C1C28] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#1F4FD8] focus:border-transparent text-sm"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-[#1F4FD8]/30 border-t-[#1F4FD8] rounded-full animate-spin" />
          </div>
        ) : teachers.length === 0 ? (
          <div className="col-span-full text-center py-20">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <GraduationCap className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-[#4D4D4D] font-medium">No teachers found</p>
            <p className="text-sm text-[#9CA3AF] mt-1">Add your first teacher to get started</p>
          </div>
        ) : (
          teachers.map((teacher) => (
            <div key={teacher.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="w-12 h-12 bg-[#1F4FD8] rounded-xl flex items-center justify-center">
                  <span className="text-white text-lg font-bold">
                    {teacher.full_name?.charAt(0)?.toUpperCase() || "T"}
                  </span>
                </div>
                <button
                  onClick={() => setShowDeleteModal(teacher.id)}
                  className="p-1.5 text-[#9CA3AF] hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <h3 className="font-poppins font-semibold text-[#1C1C28]">{teacher.full_name}</h3>
              <div className="flex items-center gap-1.5 mt-1">
                <Mail className="w-3.5 h-3.5 text-[#9CA3AF]" />
                <p className="text-sm text-[#4D4D4D] truncate">{teacher.email}</p>
              </div>
              <p className="text-xs text-[#9CA3AF] mt-2">
                Joined {new Date(teacher.created_at).toLocaleDateString()}
              </p>
            </div>
          ))
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
                  className="w-full px-4 py-2.5 border border-[#D4D4D4] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1F4FD8]"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1C1C28] mb-1">Email</label>
                <input
                  type="email"
                  value={addForm.email}
                  onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                  className="w-full px-4 py-2.5 border border-[#D4D4D4] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1F4FD8]"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1C1C28] mb-1">Temporary Password</label>
                <input
                  type="password"
                  value={addForm.password}
                  onChange={(e) => setAddForm({ ...addForm, password: e.target.value })}
                  className="w-full px-4 py-2.5 border border-[#D4D4D4] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1F4FD8]"
                  required
                  minLength={6}
                />
              </div>
              <div className="flex gap-3 justify-end pt-2">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 text-sm text-[#4D4D4D] bg-gray-100 rounded-xl hover:bg-gray-200">
                  Cancel
                </button>
                <button type="submit" disabled={addLoading} className="px-4 py-2 text-sm text-white bg-[#1F4FD8] rounded-xl hover:bg-[#1a45c2] disabled:opacity-60">
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
            <p className="text-sm text-[#4D4D4D] mb-6">This will remove the teacher profile. This action cannot be undone.</p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setShowDeleteModal(null)} className="px-4 py-2 text-sm text-[#4D4D4D] bg-gray-100 rounded-xl hover:bg-gray-200">Cancel</button>
              <button onClick={() => handleDelete(showDeleteModal)} className="px-4 py-2 text-sm text-white bg-red-500 rounded-xl hover:bg-red-600">Remove</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
