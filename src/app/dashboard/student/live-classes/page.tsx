"use client";

import React, { useEffect, useState } from "react";
import { createClient } from "@/src/lib/supabase/client";
import { Video, Calendar, Clock, ExternalLink } from "lucide-react";
import SessionRating from "@/src/components/sessions/SessionRating";

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

export default function StudentLiveClassesPage() {
  const supabase = createClient() as any;
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const userData = { user };

      const { data: enrollments } = await supabase
        .from("enrollments")
        .select("course_id")
        .eq("student_id", user.id)
        .eq("status", "active");

      const courseIds = ((enrollments as any[]) || []).map((e) => e.course_id);
      if (courseIds.length === 0) {
        setSessions([]);
        setLoading(false);
        return;
      }

      const { data: sessionData } = await supabase
        .from("live_sessions")
        .select("*")
        .in("course_id", courseIds)
        .order("scheduled_at", { ascending: true });

      const rows = (sessionData as any[]) || [];

      const { data: courses } = await supabase
        .from("courses")
        .select("id, title")
        .in("id", courseIds);
      const courseMap = new Map(((courses as any[]) || []).map((c) => [c.id, c.title]));

      // Fetch ratings for past sessions
      const pastSessionIds = rows.filter((s: any) => s.status === "completed").map((s: any) => s.id);
      let ratingsMap = new Map();
      if (pastSessionIds.length > 0 && userData.user) {
        const { data: ratingsData } = await supabase
          .from("session_ratings")
          .select("session_id, rating, comment")
          .eq("student_id", userData.user.id)
          .in("session_id", pastSessionIds);
        ratingsMap = new Map(((ratingsData as any[]) || []).map((r: any) => [r.session_id, { rating: r.rating, comment: r.comment }]));
      }

      setSessions(
        rows.map((s) => ({
          id: s.id,
          title: s.title,
          scheduled_at: s.scheduled_at,
          duration_minutes: s.duration_minutes,
          status: s.status,
          zoom_join_url: s.zoom_join_url,
          course_title: courseMap.get(s.course_id) || "Unknown",
          rating: ratingsMap.get(s.id)?.rating,
          rating_comment: ratingsMap.get(s.id)?.comment,
        }))
      );
      setLoading(false);
    };
    fetch();
  }, []);

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
        <div className="space-y-4">
          {/* Upcoming/Live sessions */}
          {sessions.filter((s) => s.status === "scheduled" || s.status === "live").length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-[#1C1C28] mb-3">Upcoming Classes</h2>
              <div className="space-y-3">
                {sessions.filter((s) => s.status === "scheduled" || s.status === "live").map((s) => (
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
                      {s.zoom_join_url && (
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
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Past sessions with ratings */}
          {sessions.filter((s) => s.status === "completed").length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-[#1C1C28] mb-3">Past Classes</h2>
              <div className="space-y-3">
                {sessions.filter((s) => s.status === "completed").map((s) => (
                  <div
                    key={s.id}
                    className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <span className="text-xs font-medium text-gray-600 bg-gray-100 px-2 py-0.5 rounded-full">
                          {s.course_title}
                        </span>
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
                      <div className="w-80">
                        <SessionRating
                          sessionId={s.id}
                          existingRating={s.rating}
                          existingComment={s.rating_comment}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
