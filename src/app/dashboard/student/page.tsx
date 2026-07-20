import { createClient } from "@/src/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { BookOpen, Calendar, ClipboardList, Video, TrendingUp, Clock, CheckCircle2 } from "lucide-react";
import {
  computeEffectiveDueDate,
  isPastDue,
  formatDueInWords,
} from "@/src/lib/assignment-deadline";

interface DashboardEnrollment {
  id: string;
  course_id: string;
  enrolled_at: string | null;
  courses: { title: string } | { title: string }[] | null;
}

interface DashboardSession {
  id: string;
  enrollment_id: string;
  scheduled_at: string;
  status: string;
}

interface DashboardAssignment {
  id: string;
  session_id: string | null;
  lesson_id: string | null;
  course_id: string;
  title: string;
  duration_days: number | null;
}

const PENDING_HOMEWORK_SHOWN_LIMIT = 5;

export default async function StudentDashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = (await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .single()) as { data: { full_name: string } | null };

  const [
    { count: courseCount, error: courseCountError },
    { count: assignmentCount, error: assignmentCountError },
    { data: enrollments, error: enrollmentsError },
  ] = await Promise.all([
    supabase
      .from("enrollments")
      .select("*", { count: "exact", head: true })
      .eq("student_id", user.id)
      .in("status", ["active", "completed"]),
    supabase
      .from("assignment_submissions")
      .select("*", { count: "exact", head: true })
      .eq("student_id", user.id),
    supabase
      .from("enrollments")
      .select("id, course_id, enrolled_at, courses(title)")
      .eq("student_id", user.id)
      .in("status", ["active", "completed"]) as unknown as Promise<{
      data: DashboardEnrollment[] | null;
      error: unknown;
    }>,
  ]);

  const enrolledCourseIds = enrollments?.map((enrollment) => enrollment.course_id) ?? [];
  const enrollmentIds = enrollments?.map((enrollment) => enrollment.id) ?? [];

  let upcomingClasses = 0;
  let sessions: DashboardSession[] = [];
  let assignments: DashboardAssignment[] = [];

  if (!enrollmentsError && enrolledCourseIds.length > 0) {
    const [
      { count, error: upcomingClassesError },
      { data: sessionData, error: sessionsError },
      { data: assignmentData, error: assignmentsError },
    ] = await Promise.all([
      supabase
        .from("live_sessions")
        .select("*", { count: "exact", head: true })
        .in("course_id", enrolledCourseIds)
        .eq("status", "scheduled"),
      supabase
        .from("live_sessions")
        .select("id, enrollment_id, scheduled_at, status")
        .in("enrollment_id", enrollmentIds) as unknown as Promise<{
        data: DashboardSession[] | null;
        error: unknown;
      }>,
      supabase
        .from("assignments")
        .select("id, session_id, lesson_id, course_id, title, duration_days")
        .in("course_id", enrolledCourseIds) as unknown as Promise<{
        data: DashboardAssignment[] | null;
        error: unknown;
      }>,
    ]);

    if (!upcomingClassesError) {
      upcomingClasses = count ?? 0;
    }
    if (!sessionsError) {
      sessions = sessionData ?? [];
    }
    if (!assignmentsError) {
      assignments = assignmentData ?? [];
    }
  }

  let submittedAssignmentIds = new Set<string>();

  if (assignments.length > 0) {
    const { data: submissionData, error: submissionsError } = await supabase
      .from("assignment_submissions")
      .select("assignment_id")
      .eq("student_id", user.id)
      .in(
        "assignment_id",
        assignments.map((a) => a.id)
      );

    if (!submissionsError) {
      submittedAssignmentIds = new Set(
        ((submissionData as { assignment_id: string }[] | null) ?? []).map((s) => s.assignment_id)
      );
    }
  }

  // Build lookups for pending homework: course title/enrolled_at per course,
  // and session status/scheduled_at per session. See assignment-deadline.ts
  // for why sessions vs. enrolled_at are used as the "start reference".
  const courseInfoById = new Map(
    (enrollments ?? []).map((e) => [
      e.course_id,
      {
        title: (Array.isArray(e.courses) ? e.courses[0]?.title : e.courses?.title) || "Untitled Course",
        enrolledAt: e.enrolled_at,
      },
    ])
  );
  const sessionById = new Map(sessions.map((s) => [s.id, s]));

  const pendingHomework = assignments
    .filter((a) => !submittedAssignmentIds.has(a.id))
    .filter((a) => {
      // Session-linked assignments only become actionable once the session
      // completes (mirrors the locked state on the Assignments tab).
      if (a.session_id) {
        const session = sessionById.get(a.session_id);
        return !!session && session.status === "completed";
      }
      return true;
    })
    .map((a) => {
      const startReference = a.session_id
        ? sessionById.get(a.session_id)?.scheduled_at ?? null
        : courseInfoById.get(a.course_id)?.enrolledAt ?? null;
      const dueDate = computeEffectiveDueDate(startReference, a.duration_days);
      return {
        id: a.id,
        title: a.title,
        courseTitle: courseInfoById.get(a.course_id)?.title ?? "Course",
        dueDate,
      };
    })
    .sort((a, b) => {
      if (a.dueDate === null && b.dueDate === null) return 0;
      if (a.dueDate === null) return 1;
      if (b.dueDate === null) return -1;
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    });

  const pendingHomeworkCount = pendingHomework.length;
  const pendingHomeworkShown = pendingHomework.slice(0, PENDING_HOMEWORK_SHOWN_LIMIT);

  const stats = [
    { label: "Enrolled Courses", value: courseCountError ? 0 : courseCount ?? 0, icon: <BookOpen className="w-6 h-6" />, color: "bg-blue-50 text-[#1F4FD8]" },
    { label: "Assignments", value: assignmentCountError ? 0 : assignmentCount ?? 0, icon: <ClipboardList className="w-6 h-6" />, color: "bg-amber-50 text-amber-600" },
    { label: "Upcoming Classes", value: upcomingClasses, icon: <Video className="w-6 h-6" />, color: "bg-green-50 text-green-600" },
    { label: "Avg. Progress", value: "0%", icon: <TrendingUp className="w-6 h-6" />, color: "bg-purple-50 text-purple-600" },
  ];

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  return (
    <div className="space-y-8">
      {/* Welcome header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-poppins font-bold text-[#1C1C28]">
          {greeting()}, {profile?.full_name?.split(" ")[0] || "Student"} 👋
        </h1>
        <p className="text-[#4D4D4D] mt-1">Here&apos;s an overview of your learning journey</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-3">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.color}`}>
                {stat.icon}
              </div>
            </div>
            <p className="text-2xl font-poppins font-bold text-[#1C1C28]">{stat.value}</p>
            <p className="text-sm text-[#4D4D4D] mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Pending Homework */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
        <div className="px-5 py-4 flex items-center justify-between gap-3 border-b border-gray-50">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-amber-50 text-amber-600">
              <ClipboardList className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="font-poppins font-semibold text-[#1C1C28]">Pending Homework</h2>
              <p className="text-xs text-[#9CA3AF] mt-0.5">
                {pendingHomeworkCount === 0
                  ? "Nothing waiting on you right now"
                  : `${pendingHomeworkCount} item${pendingHomeworkCount === 1 ? "" : "s"} awaiting submission`}
              </p>
            </div>
          </div>
          {pendingHomeworkCount > PENDING_HOMEWORK_SHOWN_LIMIT && (
            <Link
              href="/dashboard/student/assignments"
              className="flex-shrink-0 text-sm font-medium text-[#1F4FD8] hover:underline"
            >
              View all
            </Link>
          )}
        </div>

        <div className="p-5">
          {pendingHomeworkCount === 0 ? (
            /* Empty state, matching the convention used elsewhere on this dashboard/assignments tab */
            <div className="text-center py-8">
              <div className="w-14 h-14 mx-auto mb-3 bg-green-50 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-7 h-7 text-green-500" />
              </div>
              <p className="text-[#4D4D4D] font-medium">You&apos;re all caught up!</p>
              <p className="text-sm text-[#9CA3AF] mt-1">No pending homework or classwork right now</p>
            </div>
          ) : (
            <ul className="space-y-3">
              {pendingHomeworkShown.map((item) => {
                const overdue = isPastDue(item.dueDate);
                const dueLabel = formatDueInWords(item.dueDate);
                return (
                  <li key={item.id}>
                    <Link
                      href="/dashboard/student/assignments"
                      className="flex items-center justify-between gap-3 p-3 rounded-xl border border-gray-100 hover:border-[#1F4FD8]/30 hover:bg-gray-50/50 transition-all group"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-[#1C1C28] truncate group-hover:text-[#1F4FD8] transition-colors">
                          {item.title}
                        </p>
                        <p className="text-xs text-[#9CA3AF] mt-0.5 truncate">{item.courseTitle}</p>
                      </div>
                      {dueLabel && (
                        <span
                          className={`flex-shrink-0 text-xs font-medium px-2.5 py-1 rounded-full ${
                            overdue ? "bg-red-50 text-red-500" : "bg-amber-50 text-amber-600"
                          }`}
                        >
                          {dueLabel}
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      {/* Quick actions */}
      <div>
        <h2 className="text-lg font-poppins font-semibold text-[#1C1C28] mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { label: "View My Courses", href: "/dashboard/student/courses", icon: <BookOpen className="w-5 h-5" />, desc: "Access your enrolled courses" },
            { label: "Upcoming Classes", href: "/dashboard/student/live-classes", icon: <Clock className="w-5 h-5" />, desc: "Join your next live session" },
            { label: "My Attendance", href: "/dashboard/student/attendance", icon: <Calendar className="w-5 h-5" />, desc: "Check your attendance record" },
          ].map((action) => (
            <a
              key={action.label}
              href={action.href}
              className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md hover:border-[#1F4FD8]/20 transition-all group"
            >
              <div className="w-10 h-10 bg-[#1F4FD8]/10 rounded-xl flex items-center justify-center text-[#1F4FD8] mb-3 group-hover:bg-[#1F4FD8] group-hover:text-white transition-all">
                {action.icon}
              </div>
              <h3 className="font-poppins font-semibold text-[#1C1C28] mb-1">{action.label}</h3>
              <p className="text-sm text-[#4D4D4D]">{action.desc}</p>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
