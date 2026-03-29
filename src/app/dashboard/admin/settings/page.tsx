"use client";

import React, { useEffect, useState } from "react";
import { createClient } from "@/src/lib/supabase/client";
import { User, Lock, Loader2, Save } from "lucide-react";
import toast from "react-hot-toast";

export default function AdminSettingsPage() {
  const supabase = createClient() as any;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [profile, setProfile] = useState({
    full_name: "",
    phone: "",
    email: "",
  });

  const [passwords, setPasswords] = useState({
    current: "",
    new_password: "",
    confirm: "",
  });
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("profiles")
      .select("full_name, phone, email")
      .eq("id", user.id)
      .single();

    if (data) {
      setProfile({
        full_name: (data as any).full_name || "",
        phone: (data as any).phone || "",
        email: (data as any).email || user.email || "",
      });
    }
    setLoading(false);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSaving(false); return; }

    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: profile.full_name,
        phone: profile.phone || null,
      })
      .eq("id", user.id);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Profile updated successfully");
    }
    setSaving(false);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (passwords.new_password !== passwords.confirm) {
      toast.error("Passwords do not match");
      return;
    }

    if (passwords.new_password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setChangingPassword(true);

    const { error } = await supabase.auth.updateUser({
      password: passwords.new_password,
    });

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Password updated successfully");
      setPasswords({ current: "", new_password: "", confirm: "" });
    }
    setChangingPassword(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-[#1F4FD8]" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-poppins font-bold text-[#1C1C28]">Settings</h1>
        <p className="text-[#4D4D4D] text-sm mt-1">Manage your account settings</p>
      </div>

      {/* Profile Settings */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
        <h2 className="text-lg font-poppins font-semibold text-[#1C1C28] mb-4 flex items-center gap-2">
          <User className="w-5 h-5 text-[#1F4FD8]" />
          Profile Information
        </h2>
        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#1C1C28] mb-1.5">Email</label>
            <input
              type="email"
              value={profile.email}
              disabled
              className="w-full px-4 py-3 border border-[#D4D4D4] rounded-xl bg-gray-50 text-[#9CA3AF] text-sm cursor-not-allowed"
            />
            <p className="text-xs text-[#9CA3AF] mt-1">Email cannot be changed</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-[#1C1C28] mb-1.5">Full Name</label>
            <input
              type="text"
              value={profile.full_name}
              onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
              placeholder="Your full name"
              className="w-full px-4 py-3 border border-[#D4D4D4] rounded-xl bg-white text-[#1C1C28] placeholder:text-[#9CA3AF] text-sm focus:outline-none focus:ring-2 focus:ring-[#1F4FD8]"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#1C1C28] mb-1.5">Phone</label>
            <input
              type="tel"
              value={profile.phone}
              onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
              placeholder="+1 234 567 8900"
              className="w-full px-4 py-3 border border-[#D4D4D4] rounded-xl bg-white text-[#1C1C28] placeholder:text-[#9CA3AF] text-sm focus:outline-none focus:ring-2 focus:ring-[#1F4FD8]"
            />
          </div>
          <div className="pt-2">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#1F4FD8] text-white font-semibold text-sm rounded-xl hover:bg-[#1a45c2] disabled:opacity-60 transition-all"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>

      {/* Change Password */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
        <h2 className="text-lg font-poppins font-semibold text-[#1C1C28] mb-4 flex items-center gap-2">
          <Lock className="w-5 h-5 text-[#1F4FD8]" />
          Change Password
        </h2>
        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#1C1C28] mb-1.5">New Password</label>
            <input
              type="password"
              value={passwords.new_password}
              onChange={(e) => setPasswords({ ...passwords, new_password: e.target.value })}
              placeholder="Min 6 characters"
              className="w-full px-4 py-3 border border-[#D4D4D4] rounded-xl bg-white text-[#1C1C28] placeholder:text-[#9CA3AF] text-sm focus:outline-none focus:ring-2 focus:ring-[#1F4FD8]"
              required
              minLength={6}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#1C1C28] mb-1.5">Confirm New Password</label>
            <input
              type="password"
              value={passwords.confirm}
              onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
              placeholder="Repeat new password"
              className="w-full px-4 py-3 border border-[#D4D4D4] rounded-xl bg-white text-[#1C1C28] placeholder:text-[#9CA3AF] text-sm focus:outline-none focus:ring-2 focus:ring-[#1F4FD8]"
              required
              minLength={6}
            />
          </div>
          <div className="pt-2">
            <button
              type="submit"
              disabled={changingPassword}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#1F4FD8] text-white font-semibold text-sm rounded-xl hover:bg-[#1a45c2] disabled:opacity-60 transition-all"
            >
              {changingPassword ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
              {changingPassword ? "Updating..." : "Update Password"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
