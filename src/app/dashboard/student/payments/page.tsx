import { createClient } from "@/src/lib/supabase/server";
import { redirect } from "next/navigation";
import { CreditCard, DollarSign, TrendingUp } from "lucide-react";

interface PaymentRow {
  id: string;
  amount: number;
  currency: string;
  status: string;
  payment_method: string | null;
  created_at: string;
  course_id: string;
}

function StatusBadge({ status }: { status: string }) {
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
}

export default async function StudentPaymentsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Fetch payments for the logged-in student
  const { data: paymentsData } = await supabase
    .from("payments")
    .select("*")
    .eq("student_id", user.id)
    .order("created_at", { ascending: false });

  const rows = (paymentsData as unknown as PaymentRow[]) || [];

  // Fetch related course titles
  const courseIds = [...new Set(rows.map((p) => p.course_id))];
  const { data: courses } = courseIds.length
    ? await supabase.from("courses").select("id, title").in("id", courseIds)
    : { data: [] };

  const courseMap = new Map(
    ((courses as { id: string; title: string }[]) || []).map((c) => [c.id, c.title])
  );

  const payments = rows.map((p) => ({
    id: p.id,
    amount: p.amount,
    currency: p.currency,
    status: p.status,
    payment_method: p.payment_method,
    created_at: p.created_at,
    course_title: courseMap.get(p.course_id) || "Unknown Course",
  }));

  // Calculate summary
  const totalPaid = payments
    .filter((p) => p.status === "completed")
    .reduce((sum, p) => sum + Number(p.amount), 0);

  const totalPending = payments
    .filter((p) => p.status === "pending")
    .reduce((sum, p) => sum + Number(p.amount), 0);

  const completedCount = payments.filter((p) => p.status === "completed").length;

  // Determine primary currency for display
  const primaryCurrency =
    payments.length > 0 ? payments[0].currency : "USD";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-poppins font-bold text-[#1C1C28]">
          Payments
        </h1>
        <p className="text-[#4D4D4D] text-sm mt-1">
          View your course purchase history
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-green-50 text-green-600">
              <DollarSign className="w-6 h-6" />
            </div>
          </div>
          <p className="text-2xl font-poppins font-bold text-[#1C1C28]">
            {primaryCurrency} {totalPaid.toFixed(2)}
          </p>
          <p className="text-sm text-[#4D4D4D] mt-0.5">Total Paid</p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-amber-50 text-amber-600">
              <CreditCard className="w-6 h-6" />
            </div>
          </div>
          <p className="text-2xl font-poppins font-bold text-[#1C1C28]">
            {primaryCurrency} {totalPending.toFixed(2)}
          </p>
          <p className="text-sm text-[#4D4D4D] mt-0.5">Pending</p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-blue-50 text-[#1F4FD8]">
              <TrendingUp className="w-6 h-6" />
            </div>
          </div>
          <p className="text-2xl font-poppins font-bold text-[#1C1C28]">
            {completedCount}
          </p>
          <p className="text-sm text-[#4D4D4D] mt-0.5">Completed Payments</p>
        </div>
      </div>

      {/* Payments table */}
      {payments.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <CreditCard className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-[#4D4D4D] font-medium">No payments yet</p>
          <p className="text-sm text-[#9CA3AF] mt-1">
            Once you purchase a course, it will show here
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 text-left">
                  <th className="px-6 py-4 text-xs font-semibold text-[#4D4D4D] uppercase tracking-wider">
                    Course
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold text-[#4D4D4D] uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold text-[#4D4D4D] uppercase tracking-wider">
                    Method
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold text-[#4D4D4D] uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold text-[#4D4D4D] uppercase tracking-wider">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {payments.map((p) => (
                  <tr
                    key={p.id}
                    className="hover:bg-gray-50/50 transition-colors"
                  >
                    <td className="px-6 py-4 text-sm font-medium text-[#1C1C28]">
                      {p.course_title}
                    </td>
                    <td className="px-6 py-4 text-sm text-[#1C1C28] font-semibold">
                      {p.currency} {Number(p.amount).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-sm text-[#4D4D4D] capitalize">
                      {p.payment_method || "\u2014"}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={p.status} />
                    </td>
                    <td className="px-6 py-4 text-sm text-[#9CA3AF]">
                      {new Date(p.created_at).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
