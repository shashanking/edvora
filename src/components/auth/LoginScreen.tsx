"use client";

import React, { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/src/lib/supabase/client";
import { Eye, EyeOff, Mail, Lock, ArrowRight, Shield, GraduationCap, User } from "lucide-react";
import type { UserRole } from "@/src/types/database";

type LoginVariant = "student" | "teacher" | "admin";

interface LoginScreenProps {
  variant: LoginVariant;
}

const variantConfig: Record<LoginVariant, {
  title: string;
  subtitle: string;
  portalLabel: string;
  accent: string;
  accentDark: string;
  icon: React.ReactNode;
  allowedRoles: UserRole[];
  fallbackDashboard: string;
  alternateLinks: { href: string; label: string }[];
  showRegisterLink: boolean;
}> = {
  student: {
    title: "Welcome back",
    subtitle: "Sign in to continue your learning journey",
    portalLabel: "Student Portal",
    accent: "#1F4FD8",
    accentDark: "#102A72",
    icon: <User className="w-5 h-5" />,
    allowedRoles: ["student"],
    fallbackDashboard: "/dashboard/student",
    alternateLinks: [
      { href: "/login/teacher", label: "Teacher login" },
      { href: "/login/admin", label: "Admin login" },
    ],
    showRegisterLink: true,
  },
  teacher: {
    title: "Teacher sign in",
    subtitle: "Access your classes, assignments, attendance, and live sessions",
    portalLabel: "Teacher Portal",
    accent: "#7C3AED",
    accentDark: "#4C1D95",
    icon: <GraduationCap className="w-5 h-5" />,
    allowedRoles: ["teacher", "admin"],
    fallbackDashboard: "/dashboard/teacher",
    alternateLinks: [
      { href: "/login", label: "Student login" },
      { href: "/login/admin", label: "Admin login" },
    ],
    showRegisterLink: false,
  },
  admin: {
    title: "Admin sign in",
    subtitle: "Manage users, courses, enrollments, and platform operations",
    portalLabel: "Admin Portal",
    accent: "#E2531F",
    accentDark: "#7C2D12",
    icon: <Shield className="w-5 h-5" />,
    allowedRoles: ["admin"],
    fallbackDashboard: "/dashboard/admin",
    alternateLinks: [
      { href: "/login", label: "Student login" },
      { href: "/login/teacher", label: "Teacher login" },
    ],
    showRegisterLink: false,
  },
};

export default function LoginScreen({ variant }: LoginScreenProps) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#FAF9F8]">
          <div className="w-8 h-8 border-2 border-[#1F4FD8]/30 border-t-[#1F4FD8] rounded-full animate-spin" />
        </div>
      }
    >
      <LoginForm variant={variant} />
    </Suspense>
  );
}

function LoginForm({ variant }: LoginScreenProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") || "";
  const config = variantConfig[variant];

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const brandingGradient = useMemo(
    () => ({ backgroundImage: `linear-gradient(to bottom right, ${config.accent}, ${config.accentDark})` }),
    [config.accent, config.accentDark]
  );

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const supabase = createClient();
    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    if (data.user) {
      let { data: profile } = (await supabase
        .from("profiles")
        .select("role")
        .eq("id", data.user.id)
        .single()) as { data: { role: UserRole } | null };

      // If profile is missing (trigger may have failed), create it via API
      if (!profile) {
        const meta = data.user.user_metadata || {};
        await fetch("/api/auth/ensure-profile", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: data.user.id,
            full_name: meta.full_name || "",
            email: data.user.email,
            phone: meta.phone || null,
            country_code: meta.country_code || null,
            role: meta.role || "student",
          }),
        });
        profile = { role: meta.role || "student" };
      }

      const role = profile?.role || "student";

      if (!config.allowedRoles.includes(role)) {
        await supabase.auth.signOut();
        setError(`This account does not have access to the ${config.portalLabel.toLowerCase()}.`);
        setLoading(false);
        return;
      }

      const destination = redirectTo.startsWith("/dashboard")
        ? config.fallbackDashboard
        : redirectTo || config.fallbackDashboard;

      router.push(destination);
      router.refresh();
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden items-center justify-center p-12" style={brandingGradient}>
        <div className="absolute top-0 left-0 w-full h-full opacity-10">
          <div className="absolute top-20 left-20 w-72 h-72 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-[#FFC83D] rounded-full blur-3xl" />
        </div>
        <div className="relative z-10 text-center max-w-md">
          <div className="w-24 h-24 mx-auto mb-8">
            <img src="/image 1.png" alt="Addify Academy" className="w-full h-full object-cover rounded-full" />
          </div>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 text-white text-sm font-semibold mb-6">
            {config.icon}
            <span>{config.portalLabel}</span>
          </div>
          <h1 className="text-4xl font-poppins font-bold text-white mb-4">Addify Academy</h1>
          <p className="text-white/80 text-lg font-light leading-relaxed">{config.subtitle}</p>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 md:p-12 bg-[#FAF9F8]">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex justify-center mb-8">
            <div className="w-16 h-16">
              <img src="/image 1.png" alt="Addify Academy" className="w-full h-full object-cover rounded-full" />
            </div>
          </div>

          <div className="mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium mb-4" style={{ backgroundColor: `${config.accent}15`, color: config.accent }}>
              {config.icon}
              <span>{config.portalLabel}</span>
            </div>
            <h2 className="text-3xl font-poppins font-bold text-[#1C1C28]">{config.title}</h2>
            <p className="text-[#4D4D4D] mt-2">Use your {variant} account credentials to continue.</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-[#1C1C28] mb-1.5">Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#4D4D4D]" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="w-full pl-12 pr-4 py-3.5 border border-[#D4D4D4] rounded-xl bg-white text-[#1C1C28] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:border-transparent transition-all"
                  style={{ ['--tw-ring-color' as string]: config.accent }}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#1C1C28] mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#4D4D4D]" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full pl-12 pr-12 py-3.5 border border-[#D4D4D4] rounded-xl bg-white text-[#1C1C28] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:border-transparent transition-all"
                  style={{ ['--tw-ring-color' as string]: config.accent }}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#4D4D4D] hover:text-[#1C1C28] transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-end">
              <Link href="/forgot-password" className="text-sm hover:underline font-medium" style={{ color: config.accent }}>
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 disabled:opacity-60 disabled:cursor-not-allowed text-white font-poppins font-semibold rounded-xl transition-all duration-300 flex items-center justify-center gap-2 shadow-lg"
              style={{ backgroundColor: config.accent, boxShadow: `0 10px 20px ${config.accent}33` }}
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Sign In
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          {config.showRegisterLink && (
            <p className="mt-8 text-center text-[#4D4D4D]">
              Don&apos;t have an account? <Link href="/register" className="font-semibold hover:underline" style={{ color: config.accent }}>Sign up</Link>
            </p>
          )}

          <div className="mt-6 text-center space-y-2">
            <div className="flex items-center justify-center gap-4 text-sm text-[#4D4D4D] flex-wrap">
              {config.alternateLinks.map((link) => (
                <Link key={link.href} href={link.href} className="hover:underline font-medium" style={{ color: config.accent }}>
                  {link.label}
                </Link>
              ))}
            </div>
            <Link href="/" className="inline-block text-sm text-[#4D4D4D] hover:text-[#1C1C28] transition-colors">
              ← Back to home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
