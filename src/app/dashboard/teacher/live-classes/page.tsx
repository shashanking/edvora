"use client";

import React, { useEffect, useState } from "react";
import { createClient } from "@/src/lib/supabase/client";
import { Video, Plus, Calendar, Clock, ExternalLink } from "lucide-react";

interface SessionRow {
  id: string;
  title: string;
  scheduled_at: string;
  duration_minutes: number;
  status: string;
  zoom_join_url: string | null;
  zoom_start_url: string | null;
  course_title: string;
}

export default function TeacherLiveClassesPage() {
  const supabase = createClient();
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("live_sessions")
        .select("*")
        .eq("teacher_id", user.id)
        .in("status", ["scheduled", "live"])
        .order("scheduled_at", { ascending: true });

      const rows = (data as any[]) || [];
      const courseIds = [...new Set(rows.map((s) => s.course_id))];

      const { data: courses } = courseIds.length
        ? await supabase.from("courses").select("id, title").in("id", courseIds)
        : { data: [] };

      const courseMap = new Map(((courses as any[]) || []).map((c) => [c.id, c.title]));

      setSessions(
        rows.map((s) => ({
          id: s.id,
          title: s.title,
          scheduled_at: s.scheduled_at,
          duration_minutes: s.duration_minutes,
          status: s.status,
          zoom_join_url: s.zoom_join_url,
          zoom_start_url: s.zoom_start_url,
          course_title: courseMap.get(s.course_id) || "Unknown",
        }))
      );

      setLoading(false);
    };

    fetch();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-poppins font-bold text-[#1C1C28]">Live Classes</h1>
          <p className="text-[#4D4D4D] text-sm mt-1">Manage your live teaching sessions</p>
        </div>
        <button className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#1F4FD8] text-white font-poppins font-semibold text-sm rounded-xl hover:bg-[#1a45c2] transition-all shadow-md">
          <Plus className="w-4 h-4" />
          Schedule Session
        </button>
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
          <p className="text-[#4D4D4D] font-medium">No upcoming sessions</p>
          <p className="text-sm text-[#9CA3AF] mt-1">Schedule your first live class</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sessions.map((s) => (
            <div key={s.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium text-[#1F4FD8] bg-[#1F4FD8]/10 px-2 py-0.5 rounded-full">
                      {s.course_title}
                    </span>
                    {s.status === "live" && (
                      <span className="text-xs font-medium text-red-600 bg-red-50 px-2 py-0.5 rounded-full animate-pulse">
                        LIVE NOW
                      </span>
                    )}
                  </div>
                  <h3 className="font-poppins font-semibold text-[#1C1C28]">{s.title}</h3>
                  <div className="flex items-center gap-4 mt-2 text-xs text-[#9CA3AF]">
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(s.scheduled_at).toLocaleDateString()}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {new Date(s.scheduled_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                    <span>{s.duration_minutes} min</span>
                  </div>
                </div>
                {s.zoom_start_url && (
                  <a
                    href={s.zoom_start_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#1F4FD8] text-white text-sm font-semibold rounded-xl hover:bg-[#1a45c2] transition-all shadow-md"
                  >
                    <Video className="w-4 h-4" />
                    Start
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
