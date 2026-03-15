"use client";

import React, { useEffect, useState } from "react";
import { createClient } from "@/src/lib/supabase/client";
import { Save, User, Mail, Phone, Shield } from "lucide-react";

export default function TeacherSettingsPage() {
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
  });

  useEffect(() => {
    const fetch = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setLoading(false);
        return;
      }

      const { data: profile } = (await supabase
        .from("profiles")
        .select("full_name, email, phone")
        .eq("id", user.id)
        .single()) as { data: { full_name: string; email: string; phone: string | null } | null };

      setForm({
        full_name: profile?.full_name || "",
        email: profile?.email || user.email || "",
        phone: profile?.phone || "",
      });

      setLoading(false);
    };

    fetch();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess(false);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("Not authenticated");
      setSaving(false);
      return;
    }

    const { error: updateError } = await (supabase
      .from("profiles") as any)
      .update({
        full_name: form.full_name,
        phone: form.phone || null,
      })
      .eq("id", user.id);

    if (updateError) {
      setError(updateError.message);
      setSaving(false);
      return;
    }

    setSuccess(true);
    setSaving(false);
    setTimeout(() => setSuccess(false), 2500);
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-poppins font-bold text-[#1C1C28]">Settings</h1>
        <p className="text-[#4D4D4D] text-sm mt-1">Manage your profile information</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-[#1F4FD8]/30 border-t-[#1F4FD8] rounded-full animate-spin" />
        </div>
      ) : (
        <form onSubmit={handleSave} className="space-y-6">
          {(error || success) && (
            <div
              className={`p-4 rounded-xl text-sm border ${
                error
                  ? "bg-red-50 border-red-200 text-red-600"
                  : "bg-green-50 border-green-200 text-green-700"
              }`}
            >
              {error || "Saved successfully"}
            </div>
          )}

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
            <h2 className="text-lg font-poppins font-semibold text-[#1C1C28]">Profile</h2>

            <div>
              <label className="block text-sm font-medium text-[#1C1C28] mb-1.5">Full Name</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#9CA3AF]" />
                <input
                  value={form.full_name}
                  onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                  className="w-full pl-12 pr-4 py-3 border border-[#D4D4D4] rounded-xl bg-white text-[#1C1C28] focus:outline-none focus:ring-2 focus:ring-[#1F4FD8] focus:border-transparent text-sm"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#1C1C28] mb-1.5">Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#9CA3AF]" />
                <input
                  value={form.email}
                  readOnly
                  className="w-full pl-12 pr-4 py-3 border border-[#E5E7EB] rounded-xl bg-gray-50 text-[#6B7280] text-sm"
                />
              </div>
              <p className="text-xs text-[#9CA3AF] mt-1">
                Email is managed by authentication and cannot be changed here.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#1C1C28] mb-1.5">Phone</label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#9CA3AF]" />
                <input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full pl-12 pr-4 py-3 border border-[#D4D4D4] rounded-xl bg-white text-[#1C1C28] focus:outline-none focus:ring-2 focus:ring-[#1F4FD8] focus:border-transparent text-sm"
                  placeholder="+91 9XXXXXXXXX"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#1F4FD8] text-white font-poppins font-semibold text-sm rounded-xl hover:bg-[#1a45c2] disabled:opacity-60 transition-all shadow-md"
            >
              {saving ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-[#FFC83D]/15 text-[#E2531F] flex items-center justify-center">
                <Shield className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-poppins font-semibold text-[#1C1C28]">Security</h3>
                <p className="text-sm text-[#4D4D4D] mt-0.5">
                  To change your password, use the <a className="text-[#1F4FD8] font-semibold hover:underline" href="/forgot-password">Forgot password</a> flow.
                </p>
              </div>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
