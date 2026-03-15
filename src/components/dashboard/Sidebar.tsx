"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/src/lib/supabase/client";
import type { UserRole } from "@/src/types/database";
import {
  LayoutDashboard,
  BookOpen,
  Users,
  ClipboardList,
  Calendar,
  MessageSquare,
  Video,
  FileText,
  CreditCard,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  BarChart3,
  Star,
  FolderOpen,
  Bell,
  Menu,
  X,
} from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

const NAV_ITEMS: Record<UserRole, NavItem[]> = {
  student: [
    { label: "Dashboard", href: "/dashboard/student", icon: <LayoutDashboard className="w-5 h-5" /> },
    { label: "Catalog", href: "/dashboard/student/catalog", icon: <BookOpen className="w-5 h-5" /> },
    { label: "My Courses", href: "/dashboard/student/courses", icon: <BookOpen className="w-5 h-5" /> },
    { label: "Assignments", href: "/dashboard/student/assignments", icon: <ClipboardList className="w-5 h-5" /> },
    { label: "Attendance", href: "/dashboard/student/attendance", icon: <Calendar className="w-5 h-5" /> },
    { label: "Live Classes", href: "/dashboard/student/live-classes", icon: <Video className="w-5 h-5" /> },
    { label: "Remarks", href: "/dashboard/student/remarks", icon: <MessageSquare className="w-5 h-5" /> },
    { label: "Schedule", href: "/dashboard/student/schedule", icon: <Calendar className="w-5 h-5" /> },
    { label: "Payments", href: "/dashboard/student/payments", icon: <CreditCard className="w-5 h-5" /> },
    { label: "Settings", href: "/dashboard/student/settings", icon: <Settings className="w-5 h-5" /> },
  ],
  teacher: [
    { label: "Dashboard", href: "/dashboard/teacher", icon: <LayoutDashboard className="w-5 h-5" /> },
    { label: "My Courses", href: "/dashboard/teacher/courses", icon: <BookOpen className="w-5 h-5" /> },
    { label: "Students", href: "/dashboard/teacher/students", icon: <Users className="w-5 h-5" /> },
    { label: "Assignments", href: "/dashboard/teacher/assignments", icon: <ClipboardList className="w-5 h-5" /> },
    { label: "Attendance", href: "/dashboard/teacher/attendance", icon: <Calendar className="w-5 h-5" /> },
    { label: "Live Classes", href: "/dashboard/teacher/live-classes", icon: <Video className="w-5 h-5" /> },
    { label: "Remarks", href: "/dashboard/teacher/remarks", icon: <MessageSquare className="w-5 h-5" /> },
    { label: "Materials", href: "/dashboard/teacher/materials", icon: <FileText className="w-5 h-5" /> },
    { label: "Settings", href: "/dashboard/teacher/settings", icon: <Settings className="w-5 h-5" /> },
  ],
  admin: [
    { label: "Dashboard", href: "/dashboard/admin", icon: <LayoutDashboard className="w-5 h-5" /> },
    { label: "Courses", href: "/dashboard/admin/courses", icon: <BookOpen className="w-5 h-5" /> },
    { label: "Teachers", href: "/dashboard/admin/teachers", icon: <GraduationCap className="w-5 h-5" /> },
    { label: "Students", href: "/dashboard/admin/students", icon: <Users className="w-5 h-5" /> },
    { label: "Enrollments", href: "/dashboard/admin/enrollments", icon: <ClipboardList className="w-5 h-5" /> },
    { label: "Schedules", href: "/dashboard/admin/schedules", icon: <Calendar className="w-5 h-5" /> },
    { label: "Materials", href: "/dashboard/admin/materials", icon: <FolderOpen className="w-5 h-5" /> },
    { label: "Payments", href: "/dashboard/admin/payments", icon: <CreditCard className="w-5 h-5" /> },
    { label: "Reminders", href: "/dashboard/admin/reminders", icon: <Bell className="w-5 h-5" /> },
    { label: "Reports", href: "/dashboard/admin/reports", icon: <BarChart3 className="w-5 h-5" /> },
    { label: "Settings", href: "/dashboard/admin/settings", icon: <Settings className="w-5 h-5" /> },
  ],
};

interface SidebarProps {
  role: UserRole;
  userName: string;
  userEmail: string;
}

export default function Sidebar({ role, userName, userEmail }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const items = NAV_ITEMS[role];

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  const isActive = (href: string) => {
    if (href === `/dashboard/${role}`) return pathname === href;
    return pathname.startsWith(href);
  };

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-gray-100">
        <div className="w-10 h-10 flex-shrink-0">
          <img src="/image 1.png" alt="Addify Academy" className="w-full h-full object-cover rounded-full" />
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <h2 className="text-sm font-poppins font-bold text-[#1C1C28] truncate">Addify Academy</h2>
            <p className="text-xs text-[#4D4D4D] capitalize">{role} Portal</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setMobileOpen(false)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
              isActive(item.href)
                ? "bg-[#1F4FD8] text-white shadow-md shadow-[#1F4FD8]/20"
                : "text-[#4D4D4D] hover:bg-gray-100 hover:text-[#1C1C28]"
            }`}
          >
            <span className="flex-shrink-0">{item.icon}</span>
            {!collapsed && <span className="truncate">{item.label}</span>}
          </Link>
        ))}
      </nav>

      {/* User info & Logout */}
      <div className="border-t border-gray-100 p-4 space-y-3">
        {!collapsed && (
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-[#1F4FD8] rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white text-sm font-bold">
                {userName?.charAt(0)?.toUpperCase() || "U"}
              </span>
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-medium text-[#1C1C28] truncate">{userName || "User"}</p>
              <p className="text-xs text-[#4D4D4D] truncate">{userEmail}</p>
            </div>
          </div>
        )}
        <button
          onClick={handleLogout}
          className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition-all duration-200 ${collapsed ? "justify-center" : ""}`}
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {!collapsed && <span>Sign Out</span>}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile hamburger */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-xl shadow-lg border border-gray-100"
      >
        <Menu className="w-5 h-5 text-[#1C1C28]" />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/40 z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={`lg:hidden fixed top-0 left-0 h-full w-72 bg-white border-r border-gray-100 z-50 transform transition-transform duration-300 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <button
          onClick={() => setMobileOpen(false)}
          className="absolute top-4 right-4 p-1 text-[#4D4D4D] hover:text-[#1C1C28]"
        >
          <X className="w-5 h-5" />
        </button>
        {sidebarContent}
      </aside>

      {/* Desktop sidebar */}
      <aside
        className={`hidden lg:flex flex-col bg-white border-r border-gray-100 h-screen sticky top-0 transition-all duration-300 ${
          collapsed ? "w-[72px]" : "w-64"
        }`}
      >
        {sidebarContent}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-20 w-6 h-6 bg-white border border-gray-200 rounded-full flex items-center justify-center shadow-sm hover:shadow-md transition-all"
        >
          {collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
        </button>
      </aside>
    </>
  );
}
