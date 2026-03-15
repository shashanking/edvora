"use client";

import React, { useState } from "react";
import Link from "next/link";
import { createClient } from "@/src/lib/supabase/client";
import { Mail, ArrowRight, ArrowLeft } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const supabase = createClient();
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      email,
      { redirectTo: `${window.location.origin}/reset-password` }
    );

    if (resetError) {
      setError(resetError.message);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAF9F8] p-6">
        <div className="w-full max-w-md text-center">
          <div className="w-20 h-20 mx-auto mb-6 bg-blue-100 rounded-full flex items-center justify-center">
            <Mail className="w-10 h-10 text-[#1F4FD8]" />
          </div>
          <h2 className="text-2xl font-poppins font-bold text-[#1C1C28] mb-3">Check your email</h2>
          <p className="text-[#4D4D4D] mb-8 leading-relaxed">
            We&apos;ve sent a password reset link to <strong>{email}</strong>. Click the link to reset your password.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 px-8 py-3.5 bg-[#1F4FD8] text-white font-poppins font-semibold rounded-xl hover:bg-[#1a45c2] transition-all shadow-lg shadow-[#1F4FD8]/20"
          >
            Back to Login
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAF9F8] p-6">
      <div className="w-full max-w-md">
        <div className="mb-2">
          <Link href="/login" className="inline-flex items-center gap-1 text-sm text-[#4D4D4D] hover:text-[#1C1C28] transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to login
          </Link>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          <div className="mb-8">
            <h2 className="text-2xl font-poppins font-bold text-[#1C1C28]">Forgot password?</h2>
            <p className="text-[#4D4D4D] mt-2 text-sm">No worries, we&apos;ll send you a reset link.</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleReset} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-[#1C1C28] mb-1.5">Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#4D4D4D]" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="w-full pl-12 pr-4 py-3.5 border border-[#D4D4D4] rounded-xl bg-white text-[#1C1C28] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#1F4FD8] focus:border-transparent transition-all"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-[#1F4FD8] hover:bg-[#1a45c2] disabled:opacity-60 disabled:cursor-not-allowed text-white font-poppins font-semibold rounded-xl transition-all duration-300 flex items-center justify-center gap-2 shadow-lg shadow-[#1F4FD8]/20"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Send Reset Link
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
