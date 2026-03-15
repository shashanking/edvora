"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/src/lib/supabase/client";
import {
  ArrowLeft, User, Mail, Phone, Calendar, CreditCard,
  BookOpen, Clock, Star, Loader2,
} from "lucide-react";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

interface StudentProfile {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  country_code: string | null;
  avatar_url: string | null;
  created_at: string;
}

export default function AdminStudentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const supabase = createClient() as any;
  const [student, setStudent] = useState<StudentProfile | null>(null);
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [ratings, setRatings] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) fetchAll();
  }, [id]);

  const fetchAll = async () => {
    const [profileRes, enrollRes, payRes, schedRes, attRes] = await Promise.all([
      supabase
        .from("profiles")
        .select("id, full_name, email, phone, country_code, avatar_url, created_at")
        .eq("id", id)
        .single(),
      supabase
        .from("enrollments")
        .select("*, courses(title)")
        .eq("student_id", id)
        .order("enrolled_at", { ascending: false }),
      supabase
        .from("payments")
        .select("*, courses(title)")
        .eq("student_id", id)
        .order("created_at", { ascending: false }),
      supabase
        .from("student_schedules")
        .select("*, courses(title)")
        .eq("student_id", id)
        .order("day_of_week"),
      supabase
        .from("attendance")
        .select("*, courses(title)")
        .eq("student_id", id)
        .order("date", { ascending: false })
        .limit(20),
    ]);

    if (profileRes.data) setStudent(profileRes.data as any);
    if (enrollRes.data) setEnrollments(enrollRes.data);
    if (payRes.data) setPayments(payRes.data);
    if (schedRes.data) setSchedules(schedRes.data);
    if (attRes.data) setAttendance(attRes.data);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-[#1F4FD8]" />
      </div>
    );
  }

  if (!student) {
    return (
      <div className="text-center py-20">
        <p className="text-[#4D4D4D]">Student not found</p>
        <Link href="/dashboard/admin/students" className="text-[#1F4FD8] text-sm mt-2 inline-block">← Back to students</Link>
      </div>
    );
  }

  const phoneDisplay = student.country_code && student.phone
    ? `${student.country_code} ${student.phone}`
    : student.phone || "Not provided";

  const totalPaid = payments
    .filter((p: any) => p.status === "completed")
    .reduce((sum: number, p: any) => sum + Number(p.amount), 0);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <Link
        href="/dashboard/admin/students"
        className="inline-flex items-center gap-1.5 text-sm text-[#4D4D4D] hover:text-[#1C1C28] transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Students
      </Link>

      {/* Profile Card */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
        <div className="flex items-start gap-5">
          <div className="w-16 h-16 bg-[#1F4FD8] rounded-2xl flex items-center justify-center">
            <span className="text-white text-2xl font-bold">
              {student.full_name?.charAt(0)?.toUpperCase() || "S"}
            </span>
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-poppins font-bold text-[#1C1C28]">{student.full_name}</h1>
            <div className="flex flex-wrap gap-4 mt-3 text-sm text-[#4D4D4D]">
              <span className="flex items-center gap-1.5"><Mail className="w-4 h-4" />{student.email}</span>
              <span className="flex items-center gap-1.5"><Phone className="w-4 h-4" />{phoneDisplay}</span>
              <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4" />Joined {new Date(student.created_at).toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
          {[
            { label: "Courses", value: enrollments.length, icon: <BookOpen className="w-4 h-4 text-[#1F4FD8]" /> },
            { label: "Payments", value: payments.length, icon: <CreditCard className="w-4 h-4 text-green-600" /> },
            { label: "Total Paid", value: `$${totalPaid.toFixed(2)}`, icon: <CreditCard className="w-4 h-4 text-amber-500" /> },
            { label: "Attendance", value: attendance.length, icon: <Calendar className="w-4 h-4 text-purple-500" /> },
          ].map((stat) => (
            <div key={stat.label} className="bg-gray-50 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-1">{stat.icon}<span className="text-xs text-[#9CA3AF]">{stat.label}</span></div>
              <p className="text-lg font-bold text-[#1C1C28]">{stat.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Schedule */}
      {schedules.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-[#1C1C28] mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-[#1F4FD8]" />
            Weekly Schedule
          </h2>
          <div className="space-y-2">
            {schedules.map((s: any) => (
              <div key={s.id} className={`flex items-center justify-between p-3 rounded-xl ${s.status === "confirmed" ? "bg-green-50 border border-green-100" : "bg-amber-50 border border-amber-100"}`}>
                <div>
                  <span className="font-medium text-sm text-[#1C1C28]">{DAYS[s.day_of_week]}</span>
                  <span className="text-sm text-[#4D4D4D] ml-2">
                    {s.confirmed_start_time || s.preferred_start_time} – {s.confirmed_end_time || s.preferred_end_time}
                  </span>
                  <span className="text-xs text-[#9CA3AF] ml-2">({(s.courses as any)?.title})</span>
                </div>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${s.status === "confirmed" ? "text-green-700 bg-green-100" : "text-amber-700 bg-amber-100"}`}>
                  {s.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Enrollments */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-[#1C1C28] mb-4 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-[#1F4FD8]" />
          Enrollments
        </h2>
        {enrollments.length === 0 ? (
          <p className="text-sm text-[#9CA3AF]">No enrollments yet</p>
        ) : (
          <div className="space-y-2">
            {enrollments.map((e: any) => (
              <div key={e.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <div>
                  <p className="font-medium text-sm text-[#1C1C28]">{(e.courses as any)?.title}</p>
                  <p className="text-xs text-[#9CA3AF]">Enrolled {new Date(e.enrolled_at).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full bg-[#1F4FD8] rounded-full" style={{ width: `${e.progress}%` }} />
                  </div>
                  <span className="text-xs font-medium text-[#4D4D4D]">{e.progress}%</span>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    e.status === "active" ? "text-green-700 bg-green-100" :
                    e.status === "completed" ? "text-blue-700 bg-blue-100" :
                    "text-red-700 bg-red-100"
                  }`}>
                    {e.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Payment History */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-[#1C1C28] mb-4 flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-green-600" />
          Payment History
        </h2>
        {payments.length === 0 ? (
          <p className="text-sm text-[#9CA3AF]">No payments yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 text-left">
                  <th className="px-4 py-3 text-xs font-semibold text-[#4D4D4D] uppercase">Course</th>
                  <th className="px-4 py-3 text-xs font-semibold text-[#4D4D4D] uppercase">Amount</th>
                  <th className="px-4 py-3 text-xs font-semibold text-[#4D4D4D] uppercase">Provider</th>
                  <th className="px-4 py-3 text-xs font-semibold text-[#4D4D4D] uppercase">Status</th>
                  <th className="px-4 py-3 text-xs font-semibold text-[#4D4D4D] uppercase">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {payments.map((p: any) => (
                  <tr key={p.id}>
                    <td className="px-4 py-3 text-sm text-[#1C1C28]">{(p.courses as any)?.title}</td>
                    <td className="px-4 py-3 text-sm font-medium text-[#1C1C28]">{p.currency} {Number(p.amount).toFixed(2)}</td>
                    <td className="px-4 py-3 text-sm text-[#4D4D4D] capitalize">{p.payment_provider || "—"}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        p.status === "completed" ? "text-green-700 bg-green-100" :
                        p.status === "pending" ? "text-amber-700 bg-amber-100" :
                        "text-red-700 bg-red-100"
                      }`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-[#9CA3AF]">{new Date(p.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Attendance */}
      {attendance.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-[#1C1C28] mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-purple-500" />
            Recent Attendance
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-2">
            {attendance.map((a: any) => (
              <div key={a.id} className={`p-3 rounded-xl text-center ${
                a.status === "present" ? "bg-green-50 border border-green-100" :
                a.status === "late" ? "bg-amber-50 border border-amber-100" :
                "bg-red-50 border border-red-100"
              }`}>
                <p className="text-xs text-[#9CA3AF]">{new Date(a.date).toLocaleDateString()}</p>
                <p className={`text-xs font-medium mt-0.5 capitalize ${
                  a.status === "present" ? "text-green-700" :
                  a.status === "late" ? "text-amber-700" :
                  "text-red-700"
                }`}>
                  {a.status}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
