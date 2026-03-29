"use client";

import React, { useEffect, useState } from "react";
import { createClient } from "@/src/lib/supabase/client";
import {
  CreditCard, DollarSign, CheckCircle, Clock, AlertTriangle, Loader2,
} from "lucide-react";
import toast from "react-hot-toast";

interface Payment {
  id: string;
  student_id: string;
  course_id: string;
  amount: number;
  currency: string;
  status: string;
  payment_method: string | null;
  payment_provider: string | null;
  created_at: string;
  student_name?: string;
  course_title?: string;
}

export default function AdminPaymentsPage() {
  const supabase = createClient() as any;
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");

  const fetchPayments = async () => {
    setLoading(true);

    let query = supabase
      .from("payments")
      .select("*")
      .order("created_at", { ascending: false });

    if (statusFilter !== "all") {
      query = query.eq("status", statusFilter);
    }

    const { data } = await query;
    const rows = (data as Payment[]) || [];

    const studentIds = [...new Set(rows.map((r) => r.student_id))];
    const courseIds = [...new Set(rows.map((r) => r.course_id))];

    const [studentsRes, coursesRes] = await Promise.all([
      studentIds.length
        ? supabase.from("profiles").select("id, full_name").in("id", studentIds)
        : { data: [] },
      courseIds.length
        ? supabase.from("courses").select("id, title").in("id", courseIds)
        : { data: [] },
    ]);

    const studentMap = new Map(
      ((studentsRes.data || []) as any[]).map((s: any) => [s.id, s])
    );
    const courseMap = new Map(
      ((coursesRes.data || []) as any[]).map((c: any) => [c.id, c])
    );

    const enriched = rows.map((p) => ({
      ...p,
      student_name: studentMap.get(p.student_id)?.full_name || "Unknown",
      course_title: courseMap.get(p.course_id)?.title || "Unknown",
    }));

    setPayments(enriched);
    setLoading(false);
  };

  useEffect(() => {
    fetchPayments();
  }, [statusFilter]);

  // Summary stats (computed from all payments, not just filtered)
  const allPayments = payments; // When filter is "all", this includes everything
  const totalRevenue = payments.filter((p) => p.status === "completed").reduce((sum, p) => sum + Number(p.amount), 0);
  const completedCount = payments.filter((p) => p.status === "completed").length;
  const pendingCount = payments.filter((p) => p.status === "pending").length;
  const failedCount = payments.filter((p) => p.status === "failed").length;

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      completed: "bg-green-100 text-green-700",
      pending: "bg-amber-100 text-amber-700",
      failed: "bg-red-100 text-red-600",
      refunded: "bg-gray-100 text-gray-600",
    };
    return (
      <span
        className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${styles[status] || "bg-gray-100 text-gray-600"}`}
      >
        {status}
      </span>
    );
  };

  const summaryCards = [
    {
      label: "Total Revenue",
      value: `$${totalRevenue.toFixed(2)}`,
      icon: <DollarSign className="w-6 h-6" />,
      color: "bg-green-50 text-green-600",
    },
    {
      label: "Completed",
      value: completedCount,
      icon: <CheckCircle className="w-6 h-6" />,
      color: "bg-blue-50 text-[#1F4FD8]",
    },
    {
      label: "Pending",
      value: pendingCount,
      icon: <Clock className="w-6 h-6" />,
      color: "bg-amber-50 text-amber-600",
    },
    {
      label: "Failed",
      value: failedCount,
      icon: <AlertTriangle className="w-6 h-6" />,
      color: "bg-red-50 text-red-500",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-poppins font-bold text-[#1C1C28]">Payments</h1>
        <p className="text-[#4D4D4D] text-sm mt-1">Monitor all payment transactions</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryCards.map((card) => (
          <div
            key={card.label}
            className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-3">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${card.color}`}>
                {card.icon}
              </div>
            </div>
            <p className="text-2xl font-poppins font-bold text-[#1C1C28]">{card.value}</p>
            <p className="text-sm text-[#4D4D4D] mt-0.5">{card.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2.5 border border-[#D4D4D4] rounded-xl bg-white text-[#1C1C28] text-sm focus:outline-none focus:ring-2 focus:ring-[#1F4FD8]"
        >
          <option value="all">All Status</option>
          <option value="completed">Completed</option>
          <option value="pending">Pending</option>
          <option value="failed">Failed</option>
          <option value="refunded">Refunded</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-[#1F4FD8]" />
          </div>
        ) : payments.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <CreditCard className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-[#4D4D4D] font-medium">No payments found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 text-left">
                  <th className="px-6 py-4 text-xs font-semibold text-[#4D4D4D] uppercase tracking-wider">Student</th>
                  <th className="px-6 py-4 text-xs font-semibold text-[#4D4D4D] uppercase tracking-wider">Course</th>
                  <th className="px-6 py-4 text-xs font-semibold text-[#4D4D4D] uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-4 text-xs font-semibold text-[#4D4D4D] uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-xs font-semibold text-[#4D4D4D] uppercase tracking-wider">Provider</th>
                  <th className="px-6 py-4 text-xs font-semibold text-[#4D4D4D] uppercase tracking-wider">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {payments.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-[#1C1C28]">{p.student_name}</td>
                    <td className="px-6 py-4 text-sm text-[#4D4D4D]">{p.course_title}</td>
                    <td className="px-6 py-4 text-sm font-medium text-[#1C1C28]">
                      {p.currency} {Number(p.amount).toFixed(2)}
                    </td>
                    <td className="px-6 py-4">{getStatusBadge(p.status)}</td>
                    <td className="px-6 py-4 text-sm text-[#4D4D4D] capitalize">
                      {p.payment_provider || p.payment_method || "—"}
                    </td>
                    <td className="px-6 py-4 text-sm text-[#9CA3AF]">
                      {new Date(p.created_at).toLocaleDateString()}
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
