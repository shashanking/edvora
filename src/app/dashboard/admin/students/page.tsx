"use client";

import React, { useEffect, useState } from "react";
import { createClient } from "@/src/lib/supabase/client";
import Link from "next/link";
import { Search, Users, Eye, UserPlus } from "lucide-react";

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
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
