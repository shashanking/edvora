"use client";

import React, { useEffect, useState } from "react";
import { createClient } from "@/src/lib/supabase/client";
import Link from "next/link";
import { Search, Users, Eye, UserPlus, Trash2, KeyRound, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

interface Student {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  country_code: string | null;
  created_at: string;
}

export default function AdminStudentsPage() {
  const supabase = createClient() as any;
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState<Student | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);

  const fetchStudents = async () => {
    setLoading(true);
    let query = supabase
      .from("profiles")
      .select("id, full_name, email, phone, country_code, created_at")
      .eq("role", "student")
      .order("created_at", { ascending: false });

    if (search) {
      query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`);
    }

    const { data } = await query;
    setStudents((data as Student[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchStudents();
  }, [search]);

  const handleDelete = async (id: string) => {
    setDeleting(true);
    const res = await fetch("/api/admin/delete-user", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: id }),
    });
    setDeleting(false);
    setShowDeleteModal(null);
    if (res.ok) {
      toast.success("Student deleted");
      fetchStudents();
    } else {
      const data = await res.json();
      toast.error(data.error || "Failed to delete student");
    }
  };

  const handleChangePassword = async () => {
    if (!showPasswordModal) return;
    setPasswordSaving(true);
    const res = await fetch("/api/admin/change-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: showPasswordModal.id, newPassword }),
    });
    setPasswordSaving(false);
    if (res.ok) {
      toast.success("Password updated");
      setShowPasswordModal(null);
      setNewPassword("");
    } else {
      const data = await res.json();
      toast.error(data.error || "Failed to update password");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-poppins font-bold text-[#1C1C28]">Students</h1>
        <p className="text-[#4D4D4D] text-sm mt-1">View and manage all registered students</p>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
        <input
          type="text"
          placeholder="Search students..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 border border-[#D4D4D4] rounded-xl bg-white text-[#1C1C28] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#1F4FD8] focus:border-transparent text-sm"
        />
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-[#1F4FD8]/30 border-t-[#1F4FD8] rounded-full animate-spin" />
          </div>
        ) : students.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <Users className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-[#4D4D4D] font-medium">No students found</p>
            <p className="text-sm text-[#9CA3AF] mt-1">Students will appear here after registration</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 text-left">
                  <th className="px-6 py-4 text-xs font-semibold text-[#4D4D4D] uppercase tracking-wider">Student</th>
                  <th className="px-6 py-4 text-xs font-semibold text-[#4D4D4D] uppercase tracking-wider">Email</th>
                  <th className="px-6 py-4 text-xs font-semibold text-[#4D4D4D] uppercase tracking-wider">Phone</th>
                  <th className="px-6 py-4 text-xs font-semibold text-[#4D4D4D] uppercase tracking-wider">Joined</th>
                  <th className="px-6 py-4 text-xs font-semibold text-[#4D4D4D] uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {students.map((student) => (
                  <tr key={student.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-[#1F4FD8] rounded-full flex items-center justify-center">
                          <span className="text-white text-sm font-bold">
                            {student.full_name?.charAt(0)?.toUpperCase() || "S"}
                          </span>
                        </div>
                        <p className="font-medium text-[#1C1C28] text-sm">{student.full_name}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-[#4D4D4D]">{student.email}</td>
                    <td className="px-6 py-4 text-sm text-[#4D4D4D]">{student.country_code && student.phone ? `${student.country_code} ${student.phone}` : student.phone || "—"}</td>
                    <td className="px-6 py-4 text-sm text-[#9CA3AF]">
                      {new Date(student.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1">
                        <Link
                          href={`/dashboard/admin/students/${student.id}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#1F4FD8] hover:bg-blue-50 rounded-lg transition-all"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          View
                        </Link>
                        <Link
                          href={`/dashboard/admin/enrollments?student=${student.id}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#1F4FD8] hover:bg-blue-50 rounded-lg transition-all"
                        >
                          <UserPlus className="w-3.5 h-3.5" />
                          Enroll
                        </Link>
                        <button
                          onClick={() => { setShowPasswordModal(student); setNewPassword(""); }}
                          className="p-1.5 text-[#4D4D4D] hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-all"
                          title="Change Password"
                        >
                          <KeyRound className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setShowDeleteModal(student.id)}
                          className="p-1.5 text-[#4D4D4D] hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                          title="Delete Student"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
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
      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <h3 className="text-lg font-poppins font-bold text-[#1C1C28] mb-2">Delete Student?</h3>
            <p className="text-sm text-[#4D4D4D] mb-6">
              This will permanently delete the student and all their data. This cannot be undone.
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
                className="px-4 py-2 text-sm font-medium text-white bg-red-500 rounded-xl hover:bg-red-600 disabled:opacity-60 transition-colors flex items-center gap-2"
              >
                {deleting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <h3 className="text-lg font-poppins font-bold text-[#1C1C28] mb-1">Change Password</h3>
            <p className="text-sm text-[#4D4D4D] mb-4">Set a new password for <span className="font-medium text-[#1C1C28]">{showPasswordModal.full_name}</span>.</p>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="New password (min 6 characters)"
              className="w-full px-4 py-2.5 border border-[#D4D4D4] rounded-xl text-sm text-[#1C1C28] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#1F4FD8] mb-4"
              minLength={6}
            />
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => { setShowPasswordModal(null); setNewPassword(""); }}
                className="px-4 py-2 text-sm font-medium text-[#4D4D4D] bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleChangePassword}
                disabled={passwordSaving || newPassword.length < 6}
                className="px-4 py-2 text-sm font-medium text-white bg-[#1F4FD8] rounded-xl hover:bg-[#1a45c2] disabled:opacity-60 transition-colors flex items-center gap-2"
              >
                {passwordSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                {passwordSaving ? "Saving..." : "Update Password"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
