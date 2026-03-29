"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/src/lib/supabase/client";
import {
  ArrowLeft, User, Mail, Phone, Calendar, CreditCard,
  BookOpen, Clock, Loader2, MessageSquare, Plus,
} from "lucide-react";
import toast from "react-hot-toast";

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
  const [attendance, setAttendance] = useState<any[]>([]);
  const [remarks, setRemarks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "payments" | "attendance" | "remarks">("overview");

  // Remark form
  const [showRemarkForm, setShowRemarkForm] = useState(false);
  const [remarkText, setRemarkText] = useState("");
  const [remarkSaving, setRemarkSaving] = useState(false);

  useEffect(() => {
    if (id) fetchAll();
  }, [id]);

  const fetchAll = async () => {
    const [profileRes, enrollRes, payRes, schedRes, attRes, remarkRes] = await Promise.all([
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
        .limit(30),
      supabase
        .from("student_remarks")
        .select("*, profiles!student_remarks_created_by_fkey(full_name)")
        .eq("student_id", id)
        .order("created_at", { ascending: false }),
    ]);

    if (profileRes.data) setStudent(profileRes.data as any);
    if (enrollRes.data) setEnrollments(enrollRes.data);
    if (payRes.data) setPayments(payRes.data);
    if (schedRes.data) setSchedules(schedRes.data);
    if (attRes.data) setAttendance(attRes.data);
    if (remarkRes.data) setRemarks(remarkRes.data);
    setLoading(false);
  };

  const addRemark = async () => {
    if (!remarkText.trim()) return;
    setRemarkSaving(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setRemarkSaving(false); return; }

    const { error } = await supabase
      .from("student_remarks")
      .insert({
        student_id: id,
        created_by: user.id,
        remark: remarkText.trim(),
      } as any);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Remark added");
      setRemarkText("");
      setShowRemarkForm(false);
      // Refetch remarks
      const { data } = await supabase
        .from("student_remarks")
        .select("*, profiles!student_remarks_created_by_fkey(full_name)")
        .eq("student_id", id)
        .order("created_at", { ascending: false });
      if (data) setRemarks(data);
    }
    setRemarkSaving(false);
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
        <Link href="/dashboard/admin/students" className="text-[#1F4FD8] text-sm mt-2 inline-block">
          Back to students
        </Link>
      </div>
    );
  }

  const phoneDisplay = student.country_code && student.phone
    ? `${student.country_code} ${student.phone}`
    : student.phone || "Not provided";

  const totalPaid = payments
    .filter((p: any) => p.status === "completed")
    .reduce((sum: number, p: any) => sum + Number(p.amount), 0);

  const attendanceRate = attendance.length > 0
    ? Math.round(
        (attendance.filter((a: any) => a.status === "present" || a.status === "late").length / attendance.length) * 100
      )
    : null;

  const tabs = [
    { key: "overview" as const, label: "Overview" },
    { key: "payments" as const, label: `Payments (${payments.length})` },
    { key: "attendance" as const, label: `Attendance (${attendance.length})` },
    { key: "remarks" as const, label: `Remarks (${remarks.length})` },
  ];

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
          <div className="w-16 h-16 bg-[#1F4FD8] rounded-2xl flex items-center justify-center flex-shrink-0">
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
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mt-6">
          {[
            { label: "Courses", value: enrollments.length, icon: <BookOpen className="w-4 h-4 text-[#1F4FD8]" /> },
            { label: "Payments", value: payments.length, icon: <CreditCard className="w-4 h-4 text-green-600" /> },
            { label: "Total Paid", value: `$${totalPaid.toFixed(2)}`, icon: <CreditCard className="w-4 h-4 text-amber-500" /> },
            { label: "Attendance", value: attendanceRate !== null ? `${attendanceRate}%` : "N/A", icon: <Calendar className="w-4 h-4 text-purple-500" /> },
            { label: "Remarks", value: remarks.length, icon: <MessageSquare className="w-4 h-4 text-cyan-500" /> },
          ].map((stat) => (
            <div key={stat.label} className="bg-gray-50 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-1">{stat.icon}<span className="text-xs text-[#9CA3AF]">{stat.label}</span></div>
              <p className="text-lg font-bold text-[#1C1C28]">{stat.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-100 pb-0">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2.5 text-sm font-medium transition-all border-b-2 ${
              activeTab === tab.key
                ? "text-[#1F4FD8] border-[#1F4FD8]"
                : "text-[#4D4D4D] border-transparent hover:text-[#1C1C28]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "overview" && (
        <div className="space-y-6">
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
                        {s.confirmed_start_time || s.preferred_start_time} - {s.confirmed_end_time || s.preferred_end_time}
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
        </div>
      )}

      {activeTab === "payments" && (
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
                    <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-3 text-sm text-[#1C1C28]">{(p.courses as any)?.title}</td>
                      <td className="px-4 py-3 text-sm font-medium text-[#1C1C28]">{p.currency} {Number(p.amount).toFixed(2)}</td>
                      <td className="px-4 py-3 text-sm text-[#4D4D4D] capitalize">{p.payment_provider || "—"}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
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
      )}

      {activeTab === "attendance" && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-[#1C1C28] mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-purple-500" />
            Attendance Records
          </h2>
          {attendance.length === 0 ? (
            <p className="text-sm text-[#9CA3AF]">No attendance records yet</p>
          ) : (
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
                  <p className="text-xs text-[#9CA3AF] mt-0.5 truncate">{(a.courses as any)?.title}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "remarks" && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-[#1C1C28] flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-cyan-500" />
              Remarks
            </h2>
            <button
              onClick={() => setShowRemarkForm(!showRemarkForm)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#1F4FD8] text-white text-sm font-medium rounded-xl hover:bg-[#1a45c2] transition-all"
            >
              <Plus className="w-4 h-4" />
              Add Remark
            </button>
          </div>

          {showRemarkForm && (
            <div className="mb-4 p-4 bg-gray-50 rounded-xl">
              <textarea
                value={remarkText}
                onChange={(e) => setRemarkText(e.target.value)}
                placeholder="Write a remark about this student..."
                rows={3}
                className="w-full px-4 py-3 border border-[#D4D4D4] rounded-xl bg-white text-[#1C1C28] placeholder:text-[#9CA3AF] text-sm focus:outline-none focus:ring-2 focus:ring-[#1F4FD8]"
              />
              <div className="flex gap-2 mt-3">
                <button
                  onClick={addRemark}
                  disabled={remarkSaving || !remarkText.trim()}
                  className="px-4 py-2 bg-[#1F4FD8] text-white text-sm font-medium rounded-xl hover:bg-[#1a45c2] disabled:opacity-60 transition-all"
                >
                  {remarkSaving ? "Saving..." : "Save Remark"}
                </button>
                <button
                  onClick={() => { setShowRemarkForm(false); setRemarkText(""); }}
                  className="px-4 py-2 text-sm text-[#4D4D4D] bg-white border border-[#D4D4D4] rounded-xl hover:bg-gray-50 transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {remarks.length === 0 ? (
            <p className="text-sm text-[#9CA3AF]">No remarks yet</p>
          ) : (
            <div className="space-y-3">
              {remarks.map((r: any) => (
                <div key={r.id} className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-sm text-[#1C1C28]">{r.remark}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs text-[#9CA3AF]">
                      By {r.profiles?.full_name || "Admin"}
                    </span>
                    <span className="text-xs text-[#D4D4D4]">|</span>
                    <span className="text-xs text-[#9CA3AF]">
                      {new Date(r.created_at).toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
