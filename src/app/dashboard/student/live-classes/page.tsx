"use client";

import React, { useEffect, useState } from "react";
import { createClient } from "@/src/lib/supabase/client";
import { Video, Calendar, Clock, ExternalLink } from "lucide-react";

interface Session {
  id: string;
  title: string;
  scheduled_at: string;
  duration_minutes: number;
  status: string;
  zoom_join_url: string | null;
  course_title: string;
  rating?: number | null;
  rating_comment?: string | null;
}

const JOIN_LEAD_MINUTES = 5;

function isWithinJoinWindow(
  scheduledAt: string,
  durationMinutes: number,
  nowMs: number,
  leadMinutes = JOIN_LEAD_MINUTES
): boolean {
  const startMs = new Date(scheduledAt).getTime();
  const openMs = startMs - leadMinutes * 60 * 1000;
  const closeMs = startMs + durationMinutes * 60 * 1000;
  return nowMs >= openMs && nowMs <= closeMs;
}

export default function StudentLiveClassesPage() {
  const supabase = createClient() as any;
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    const t = setInterval(() => setNowMs(Date.now()), 30_000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const fetch = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: enrollments } = await supabase
        .from("enrollments")
        .select("course_id")
        .eq("student_id", user.id)
        .in("status", ["active", "completed"]);

      const courseIds = ((enrollments as any[]) || []).map((e) => e.course_id);
      if (courseIds.length === 0) {
        setSessions([]);
        setLoading(false);
        return;
      }

      // Auto-complete sessions whose time has passed
      try {
        await window.fetch("/api/sessions/auto-complete", { method: "POST" });
      } catch {}

      // Fetch every scheduled/live/completed session for this student across
      // their enrolled courses — NOT restricted to today. Sessions are
      // created ahead of time by the admin (batch Zoom creation, see
      // /api/zoom/batch-create) for whatever days/times were configured, so
      // a session scheduled for e.g. next Monday needs to show up now, not
      // just on the day it happens. (Previously this only fetched sessions
      // whose scheduled_at fell within today's UTC date range, so any
      // future-dated session an admin had set up was invisible here until
      // the day itself arrived — "upcoming" sessions never actually showed
      // as upcoming.)
      //
      // Scoped to student_id = this student OR null: live_sessions created
      // via batch-create are 1:1 (always have a student_id), but a teacher
      // can also create a session with no specific student via
      // /api/zoom/create-meeting (student_id left blank for a whole-class
      // session) — those still need to show up for every enrolled student,
      // so they're included via the `is.null` branch rather than excluded.
      const { data: sessionData } = await supabase
        .from("live_sessions")
        .select("*")
        .in("course_id", courseIds)
        .or(`student_id.is.null,student_id.eq.${user.id}`)
        .in("status", ["scheduled", "live", "completed"])
        .order("scheduled_at", { ascending: true });

      const rows = (sessionData as any[]) || [];

      const { data: courses } = await supabase
        .from("courses")
        .select("id, title")
        .in("id", courseIds);
      const courseMap = new Map(((courses as any[]) || []).map((c) => [c.id, c.title]));

      setSessions(
        rows.map((s: any) => ({
          id: s.id,
          title: s.title,
          scheduled_at: s.scheduled_at,
          duration_minutes: s.duration_minutes,
          status: s.status,
          zoom_join_url: s.zoom_join_url,
          course_title: courseMap.get(s.course_id) || "Unknown",
        }))
      );
      setLoading(false);
    };
    fetch();
  }, []);

  const isSessionOver = (s: Session) =>
    new Date(s.scheduled_at).getTime() + s.duration_minutes * 60 * 1000 <= nowMs;

  // Upcoming = scheduled/live and not yet ended, soonest first.
  const upcomingSessions = sessions
    .filter((s) => (s.status === "scheduled" || s.status === "live") && !isSessionOver(s))
    .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime());

  // Completed (or scheduled/live sessions whose time has simply passed —
  // auto-complete usually catches these, but don't hide them if it hasn't
  // run yet), most recent first.
  const completedSessions = sessions
    .filter((s) => s.status === "completed" || ((s.status === "scheduled" || s.status === "live") && isSessionOver(s)))
    .sort((a, b) => new Date(b.scheduled_at).getTime() - new Date(a.scheduled_at).getTime());

  const renderSessionCard = (s: Session) => (
    <div
      key={s.id}
      className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow"
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 min-w-0">
          <span className="text-xs font-medium text-[#1F4FD8] bg-[#1F4FD8]/10 px-2 py-0.5 rounded-full">
            {s.course_title}
          </span>
          {s.status === "live" && (
            <span className="ml-2 text-xs font-medium text-red-600 bg-red-50 px-2 py-0.5 rounded-full animate-pulse">
              LIVE NOW
            </span>
          )}
          <h3 className="font-poppins font-semibold text-[#1C1C28] mt-2">{s.title}</h3>
          <div className="flex items-center gap-4 mt-2 text-xs text-[#9CA3AF]">
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              {new Date(s.scheduled_at).toLocaleDateString()}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {new Date(s.scheduled_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </span>
            <span>{s.duration_minutes} min</span>
          </div>
        </div>
        {s.zoom_join_url ? (
          isWithinJoinWindow(s.scheduled_at, s.duration_minutes, nowMs) ? (
            <a
              href={s.zoom_join_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#1F4FD8] text-white text-sm font-semibold rounded-xl hover:bg-[#1a45c2] transition-all shadow-md"
            >
              <Video className="w-4 h-4" />
              Join
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          ) : (
            <span className="inline-flex items-center px-3 py-2 text-xs font-medium text-[#9CA3AF] bg-gray-100 rounded-xl">
              Available {JOIN_LEAD_MINUTES} min before start
            </span>
          )
        ) : null}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-poppins font-bold text-[#1C1C28]">Live Classes</h1>
        <p className="text-[#4D4D4D] text-sm mt-1">Join upcoming sessions and rate completed ones</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-[#1F4FD8]/30 border-t-[#1F4FD8] rounded-full animate-spin" />
        </div>
      ) : sessions.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <Video className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-[#4D4D4D] font-medium">No live classes</p>
          <p className="text-sm text-[#9CA3AF] mt-1">Scheduled sessions will appear here</p>
        </div>
      ) : (
        <div className="space-y-6">
          {upcomingSessions.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-lg font-semibold text-[#1C1C28] mb-3">
                Upcoming Classes
                <span className="ml-2 text-sm font-normal text-[#9CA3AF]">
                  ({upcomingSessions.length})
                </span>
              </h2>
              <div className="space-y-3">{upcomingSessions.map(renderSessionCard)}</div>
            </div>
          )}
          {completedSessions.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-lg font-semibold text-[#1C1C28] mb-3">Past Classes</h2>
              <div className="space-y-3">{completedSessions.map(renderSessionCard)}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
