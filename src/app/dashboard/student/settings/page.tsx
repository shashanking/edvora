"use client";

import React, { useEffect, useState } from "react";
import { createClient } from "@/src/lib/supabase/client";
import { Save, User, Mail, Phone, Shield, Globe, Image, Lock, Eye, EyeOff } from "lucide-react";
import toast from "react-hot-toast";

const COUNTRY_CODES = [
  { code: "+1", label: "US / Canada (+1)" },
  { code: "+44", label: "UK (+44)" },
  { code: "+91", label: "India (+91)" },
  { code: "+61", label: "Australia (+61)" },
  { code: "+49", label: "Germany (+49)" },
  { code: "+33", label: "France (+33)" },
  { code: "+81", label: "Japan (+81)" },
  { code: "+86", label: "China (+86)" },
  { code: "+971", label: "UAE (+971)" },
  { code: "+966", label: "Saudi Arabia (+966)" },
  { code: "+65", label: "Singapore (+65)" },
  { code: "+60", label: "Malaysia (+60)" },
  { code: "+63", label: "Philippines (+63)" },
  { code: "+92", label: "Pakistan (+92)" },
  { code: "+880", label: "Bangladesh (+880)" },
  { code: "+94", label: "Sri Lanka (+94)" },
  { code: "+977", label: "Nepal (+977)" },
  { code: "+234", label: "Nigeria (+234)" },
  { code: "+27", label: "South Africa (+27)" },
  { code: "+254", label: "Kenya (+254)" },
  { code: "+55", label: "Brazil (+55)" },
  { code: "+52", label: "Mexico (+52)" },
  { code: "+82", label: "South Korea (+82)" },
  { code: "+39", label: "Italy (+39)" },
  { code: "+34", label: "Spain (+34)" },
  { code: "+7", label: "Russia (+7)" },
  { code: "+90", label: "Turkey (+90)" },
  { code: "+20", label: "Egypt (+20)" },
  { code: "+62", label: "Indonesia (+62)" },
  { code: "+84", label: "Vietnam (+84)" },
];

export default function StudentSettingsPage() {
  const supabase = createClient() as any;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    country_code: "+91",
    avatar_url: "",
  });

  const [passwordForm, setPasswordForm] = useState({
    oldPassword: "",
    newPassword: "",
  });

  useEffect(() => {
    const fetchProfile = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setLoading(false);
        return;
      }

      const { data: profile } = (await supabase
        .from("profiles")
        .select("full_name, email, phone, country_code, avatar_url")
        .eq("id", user.id)
        .single()) as {
        data: {
          full_name: string;
          email: string;
          phone: string | null;
          country_code: string | null;
          avatar_url: string | null;
        } | null;
      };

      setForm({
        full_name: profile?.full_name || "",
        email: profile?.email || user.email || "",
        phone: profile?.phone || "",
        country_code: profile?.country_code || "+91",
        avatar_url: profile?.avatar_url || "",
      });

      setLoading(false);
    };

    fetchProfile();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      toast.error("Not authenticated");
      setSaving(false);
      return;
    }

    const { error: updateError } = await (supabase.from("profiles") as any)
      .update({
        full_name: form.full_name,
        phone: form.phone || null,
        country_code: form.country_code,
        avatar_url: form.avatar_url || null,
      })
      .eq("id", user.id);

    if (updateError) {
      toast.error(updateError.message);
    } else {
      toast.success("Profile updated successfully");
    }

    setSaving(false);
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!passwordForm.newPassword || passwordForm.newPassword.length < 6) {
      toast.error("New password must be at least 6 characters");
      return;
    }

    setChangingPassword(true);

    // Verify old password by signing in
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.email) {
      toast.error("Unable to verify identity");
      setChangingPassword(false);
      return;
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: passwordForm.oldPassword,
    });

    if (signInError) {
      toast.error("Current password is incorrect");
      setChangingPassword(false);
      return;
    }

    // Update to new password
    const { error: updateError } = await supabase.auth.updateUser({
      password: passwordForm.newPassword,
    });

    if (updateError) {
      toast.error(updateError.message);
    } else {
      toast.success("Password updated successfully");
      setPasswordForm({ oldPassword: "", newPassword: "" });
    }

    setChangingPassword(false);
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-poppins font-bold text-[#1C1C28]">
          Settings
        </h1>
        <p className="text-[#4D4D4D] text-sm mt-1">
          Manage your profile information
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-[#1F4FD8]/30 border-t-[#1F4FD8] rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Profile section */}
          <form onSubmit={handleSave}>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
              <h2 className="text-lg font-poppins font-semibold text-[#1C1C28]">
                Profile
              </h2>

              {/* Full Name */}
              <div>
                <label className="block text-sm font-medium text-[#1C1C28] mb-1.5">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#9CA3AF]" />
                  <input
                    value={form.full_name}
                    onChange={(e) =>
                      setForm({ ...form, full_name: e.target.value })
                    }
                    className="w-full pl-12 pr-4 py-3 border border-[#D4D4D4] rounded-xl bg-white text-[#1C1C28] focus:outline-none focus:ring-2 focus:ring-[#1F4FD8] focus:border-transparent text-sm"
                    required
                  />
                </div>
              </div>

              {/* Email (read-only) */}
              <div>
                <label className="block text-sm font-medium text-[#1C1C28] mb-1.5">
                  Email
                </label>
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

              {/* Country Code + Phone */}
              <div>
                <label className="block text-sm font-medium text-[#1C1C28] mb-1.5">
                  Phone
                </label>
                <div className="flex gap-3">
                  <div className="relative w-48 flex-shrink-0">
                    <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#9CA3AF]" />
                    <select
                      value={form.country_code}
                      onChange={(e) =>
                        setForm({ ...form, country_code: e.target.value })
                      }
                      className="w-full pl-12 pr-4 py-3 border border-[#D4D4D4] rounded-xl bg-white text-[#1C1C28] focus:outline-none focus:ring-2 focus:ring-[#1F4FD8] focus:border-transparent text-sm appearance-none"
                    >
                      {COUNTRY_CODES.map((cc) => (
                        <option key={cc.code} value={cc.code}>
                          {cc.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="relative flex-1">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#9CA3AF]" />
                    <input
                      value={form.phone}
                      onChange={(e) =>
                        setForm({ ...form, phone: e.target.value })
                      }
                      className="w-full pl-12 pr-4 py-3 border border-[#D4D4D4] rounded-xl bg-white text-[#1C1C28] focus:outline-none focus:ring-2 focus:ring-[#1F4FD8] focus:border-transparent text-sm"
                      placeholder="9XXXXXXXXX"
                    />
                  </div>
                </div>
              </div>

              {/* Avatar URL */}
              <div>
                <label className="block text-sm font-medium text-[#1C1C28] mb-1.5">
                  Avatar URL
                </label>
                <div className="relative">
                  <Image className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#9CA3AF]" />
                  <input
                    value={form.avatar_url}
                    onChange={(e) =>
                      setForm({ ...form, avatar_url: e.target.value })
                    }
                    className="w-full pl-12 pr-4 py-3 border border-[#D4D4D4] rounded-xl bg-white text-[#1C1C28] focus:outline-none focus:ring-2 focus:ring-[#1F4FD8] focus:border-transparent text-sm"
                    placeholder="https://example.com/avatar.jpg"
                  />
                </div>
                {form.avatar_url && (
                  <div className="mt-3 flex items-center gap-3">
                    <img
                      src={form.avatar_url}
                      alt="Avatar preview"
                      className="w-12 h-12 rounded-full object-cover border-2 border-gray-100"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                    <p className="text-xs text-[#9CA3AF]">Avatar preview</p>
                  </div>
                )}
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
          </form>

          {/* Password change section */}
          <form onSubmit={handlePasswordChange}>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
              <div className="flex items-center gap-3 mb-1">
                <div className="w-11 h-11 rounded-xl bg-[#FFC83D]/15 text-[#E2531F] flex items-center justify-center">
                  <Shield className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-poppins font-semibold text-[#1C1C28]">
                    Change Password
                  </h3>
                  <p className="text-sm text-[#4D4D4D] mt-0.5">
                    Update your account password
                  </p>
                </div>
              </div>

              {/* Current password */}
              <div>
                <label className="block text-sm font-medium text-[#1C1C28] mb-1.5">
                  Current Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#9CA3AF]" />
                  <input
                    type={showOldPassword ? "text" : "password"}
                    value={passwordForm.oldPassword}
                    onChange={(e) =>
                      setPasswordForm({
                        ...passwordForm,
                        oldPassword: e.target.value,
                      })
                    }
                    className="w-full pl-12 pr-12 py-3 border border-[#D4D4D4] rounded-xl bg-white text-[#1C1C28] focus:outline-none focus:ring-2 focus:ring-[#1F4FD8] focus:border-transparent text-sm"
                    placeholder="Enter current password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowOldPassword(!showOldPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#4D4D4D]"
                  >
                    {showOldPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* New password */}
              <div>
                <label className="block text-sm font-medium text-[#1C1C28] mb-1.5">
                  New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#9CA3AF]" />
                  <input
                    type={showNewPassword ? "text" : "password"}
                    value={passwordForm.newPassword}
                    onChange={(e) =>
                      setPasswordForm({
                        ...passwordForm,
                        newPassword: e.target.value,
                      })
                    }
                    className="w-full pl-12 pr-12 py-3 border border-[#D4D4D4] rounded-xl bg-white text-[#1C1C28] focus:outline-none focus:ring-2 focus:ring-[#1F4FD8] focus:border-transparent text-sm"
                    placeholder="Enter new password (min 6 chars)"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#4D4D4D]"
                  >
                    {showNewPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={changingPassword}
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#1C1C28] text-white font-poppins font-semibold text-sm rounded-xl hover:bg-[#2d2d3a] disabled:opacity-60 transition-all shadow-md"
              >
                {changingPassword ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Lock className="w-4 h-4" />
                )}
                {changingPassword ? "Updating..." : "Update Password"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
