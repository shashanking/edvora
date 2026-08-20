/**
 * One-off backfill: create the missing live_sessions (and their Zoom
 * meetings) for an enrollment that has none.
 *
 * This mirrors src/app/api/zoom/batch-create/route.ts exactly — same lesson
 * ordering, same session-date generation, same idempotency (existing session
 * numbers are skipped). It exists because the route requires an authenticated
 * admin browser session, and this needs to run from a terminal against an
 * enrollment that is already broken in production.
 *
 * Prefer the admin UI ("Sessions" action on the Enrollments table) for normal
 * use. This script is for the initial cleanup.
 *
 * Usage:
 *   node scripts/backfill-enrollment-sessions.mjs <enrollment_id> [start_date]
 *   DRY_RUN=1 node scripts/backfill-enrollment-sessions.mjs <enrollment_id>
 *
 * start_date defaults to tomorrow so nothing is scheduled into the past.
 */

import fs from "fs";
import path from "path";

/* ------------------------------------------------------------------ */
/*  Env                                                                */
/* ------------------------------------------------------------------ */

function loadEnv(file) {
  if (!fs.existsSync(file)) return {};
  return Object.fromEntries(
    fs
      .readFileSync(file, "utf8")
      .split("\n")
      .filter((l) => l.includes("=") && !l.trim().startsWith("#"))
      .map((l) => {
        const i = l.indexOf("=");
        return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
      })
  );
}

const env = { ...loadEnv(path.resolve(".env")), ...loadEnv(path.resolve(".env.local")) };

const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;
const ZOOM_ACCOUNT_ID = env.ZOOM_ACCOUNT_ID;
const ZOOM_CLIENT_ID = env.ZOOM_CLIENT_ID;
const ZOOM_CLIENT_SECRET = env.ZOOM_CLIENT_SECRET;
const ZOOM_HOST_EMAIL = env.ZOOM_HOST_EMAIL || "me";

const DRY_RUN = process.env.DRY_RUN === "1";

const enrollmentId = process.argv[2];
if (!enrollmentId) {
  console.error("Usage: node scripts/backfill-enrollment-sessions.mjs <enrollment_id> [start_date]");
  process.exit(1);
}

for (const [k, v] of Object.entries({ SUPABASE_URL, SERVICE_KEY })) {
  if (!v) {
    console.error(`Missing required env: ${k}`);
    process.exit(1);
  }
}

/* ------------------------------------------------------------------ */
/*  Supabase (service role — bypasses RLS)                             */
/* ------------------------------------------------------------------ */

async function sb(pathAndQuery, options = {}) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${pathAndQuery}`, {
    ...options,
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
      ...(options.headers || {}),
    },
  });
  const text = await res.text();
  let body;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }
  if (!res.ok) throw new Error(`Supabase ${res.status}: ${text}`);
  return body;
}

/* ------------------------------------------------------------------ */
/*  Zoom (same flow as src/lib/zoom.ts)                                */
/* ------------------------------------------------------------------ */

let cachedToken = null;
let tokenExpiresAt = 0;

async function zoomToken() {
  if (cachedToken && Date.now() < tokenExpiresAt - 60_000) return cachedToken;
  const credentials = Buffer.from(`${ZOOM_CLIENT_ID}:${ZOOM_CLIENT_SECRET}`).toString("base64");
  const res = await fetch("https://zoom.us/oauth/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "account_credentials",
      account_id: ZOOM_ACCOUNT_ID,
    }),
  });
  if (!res.ok) throw new Error(`Zoom OAuth error (${res.status}): ${await res.text()}`);
  const data = await res.json();
  cachedToken = data.access_token;
  tokenExpiresAt = Date.now() + data.expires_in * 1000;
  return cachedToken;
}

async function zoomFetch(p, options = {}) {
  const token = await zoomToken();
  return fetch(`https://api.zoom.us/v2${p}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
}

async function createZoomMeeting(topic, startTime, duration, hostEmail) {
  const fallbackHost = ZOOM_HOST_EMAIL;
  const teacherHost = hostEmail?.trim();
  const primaryHost = teacherHost || fallbackHost;

  const baseSettings = {
    auto_recording: "cloud",
    join_before_host: false,
    waiting_room: false,
    meeting_authentication: false,
  };

  const requestBody = {
    topic,
    type: 2,
    start_time: startTime,
    duration,
    timezone: "UTC",
    settings: { ...baseSettings },
  };

  let res = await zoomFetch(`/users/${encodeURIComponent(primaryHost)}/meetings`, {
    method: "POST",
    body: JSON.stringify(requestBody),
  });

  if (!res.ok && teacherHost && teacherHost !== fallbackHost && res.status === 404) {
    console.warn(`  ! Zoom user "${teacherHost}" not found; falling back to "${fallbackHost}"`);
    res = await zoomFetch(`/users/${encodeURIComponent(fallbackHost)}/meetings`, {
      method: "POST",
      body: JSON.stringify({
        ...requestBody,
        settings: { ...baseSettings, alternative_hosts: teacherHost },
      }),
    });

    // Mirrors src/lib/zoom.ts: an alternative host must be a licensed user on
    // the same Zoom account, so this retry fails (400 / code 1114) for exactly
    // the teacher it was meant to help. Last resort is the owner with no
    // alternative host.
    if (!res.ok && res.status === 400) {
      console.warn(
        `  ! Zoom refused "${teacherHost}" as alternative host (${await res.clone().text()}). ` +
          `Scheduling under "${fallbackHost}" with none.`
      );
      res = await zoomFetch(`/users/${encodeURIComponent(fallbackHost)}/meetings`, {
        method: "POST",
        body: JSON.stringify(requestBody),
      });
    }
  }

  if (!res.ok) throw new Error(`Zoom create meeting error (${res.status}): ${await res.text()}`);

  const data = await res.json();
  if (data.settings?.auto_recording !== "cloud") {
    console.warn(
      `  ! Zoom set auto_recording="${data.settings?.auto_recording}" on meeting ${data.id} — it will NOT be recorded.`
    );
  }
  return { meeting_id: String(data.id), join_url: data.join_url, start_url: data.start_url };
}

async function deleteZoomMeeting(meetingId) {
  await zoomFetch(`/meetings/${meetingId}`, { method: "DELETE" });
}

/* ------------------------------------------------------------------ */
/*  Session date generation (identical to the API route)               */
/* ------------------------------------------------------------------ */

function generateSessionDates(startDate, schedule, totalSessions) {
  const results = [];
  const sortedDays = [...schedule].sort((a, b) => a.dayOfWeek - b.dayOfWeek);
  const current = new Date(startDate);
  current.setHours(0, 0, 0, 0);
  const from = new Date(startDate);
  from.setHours(0, 0, 0, 0);

  let iterations = 0;
  while (results.length < totalSessions && iterations < 52 * 7) {
    const match = sortedDays.find((d) => d.dayOfWeek === current.getDay());
    if (match && current >= from) results.push({ date: new Date(current), daySchedule: match });
    current.setDate(current.getDate() + 1);
    iterations++;
  }
  return results;
}

const computeDuration = (start, end) => {
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  return eh * 60 + em - (sh * 60 + sm);
};

const trimTime = (v) => (v ? v.split(":").slice(0, 2).join(":") : "00:00");

/* ------------------------------------------------------------------ */
/*  Main                                                               */
/* ------------------------------------------------------------------ */

const [enrollment] = await sb(
  `enrollments?id=eq.${enrollmentId}&select=id,student_id,course_id,teacher_id,classes_per_week`
);
if (!enrollment) throw new Error("Enrollment not found");

const [student] = await sb(`profiles?id=eq.${enrollment.student_id}&select=full_name,email`);
const [teacher] = await sb(`profiles?id=eq.${enrollment.teacher_id}&select=full_name,email`);
const [course] = await sb(`courses?id=eq.${enrollment.course_id}&select=title,total_sessions`);

console.log(`Student : ${student.full_name} <${student.email}>`);
console.log(`Course  : ${course.title} (total_sessions=${course.total_sessions})`);
console.log(`Teacher : ${teacher.full_name} <${teacher.email}>`);

const schedRows = await sb(
  `student_schedules?student_id=eq.${enrollment.student_id}&course_id=eq.${enrollment.course_id}` +
    `&select=day_of_week,preferred_start_time,preferred_end_time,confirmed_start_time,confirmed_end_time&order=day_of_week.asc`
);
const schedule = schedRows.map((r) => ({
  dayOfWeek: r.day_of_week,
  startTime: trimTime(r.confirmed_start_time || r.preferred_start_time),
  endTime: trimTime(r.confirmed_end_time || r.preferred_end_time),
}));
if (!schedule.length) throw new Error("No student_schedules rows for this enrollment");
console.log(
  `Schedule: ${schedule.map((s) => `day${s.dayOfWeek} ${s.startTime}-${s.endTime}`).join(", ")}`
);

// Lessons, ordered by module then lesson (same as the route).
const modules = await sb(
  `course_modules?course_id=eq.${enrollment.course_id}&select=id,title,display_order`
);
const moduleById = new Map(modules.map((m) => [m.id, m]));
const lessons = (
  await sb(
    `course_lessons?module_id=in.(${modules.map((m) => m.id).join(",")})&select=id,title,module_id,display_order`
  )
).sort((a, b) => {
  const modA = moduleById.get(a.module_id)?.display_order ?? 0;
  const modB = moduleById.get(b.module_id)?.display_order ?? 0;
  if (modA !== modB) return modA - modB;
  return (a.display_order ?? 0) - (b.display_order ?? 0);
});
if (!lessons.length) throw new Error("Course has no lessons");

const requested = course.total_sessions ?? lessons.length;
const sessionCount = Math.min(requested, lessons.length);
if (requested > lessons.length) {
  console.warn(
    `! total_sessions=${requested} but only ${lessons.length} lessons exist — capping at ${sessionCount}.`
  );
}

const existing = await sb(`live_sessions?enrollment_id=eq.${enrollmentId}&select=session_number`);
const existingNumbers = new Set(existing.map((e) => e.session_number));
console.log(`Existing sessions: ${existing.length}`);

const startDate = process.argv[3]
  ? new Date(process.argv[3])
  : (() => {
      const d = new Date();
      d.setDate(d.getDate() + 1);
      return d;
    })();

const dates = generateSessionDates(startDate, schedule, sessionCount);

console.log(`\n${DRY_RUN ? "DRY RUN — would create" : "Creating"} ${dates.length} session(s):\n`);

let created = 0;
const failures = [];

for (let i = 0; i < dates.length; i++) {
  const { date, daySchedule } = dates[i];
  const sessionNum = i + 1;
  if (existingNumbers.has(sessionNum)) {
    console.log(`  ${sessionNum}. SKIP (already exists)`);
    continue;
  }

  const lesson = lessons[i];
  const [h, m] = daySchedule.startTime.split(":").map(Number);
  const scheduledAt = new Date(date);
  scheduledAt.setHours(h, m, 0, 0);

  const topic = lesson
    ? `Session ${moduleById.get(lesson.module_id)?.title} - ${lesson.title}`
    : `${course.title} - Session ${sessionNum}`;
  const dur = computeDuration(daySchedule.startTime, daySchedule.endTime);

  console.log(`  ${sessionNum}. ${scheduledAt.toString()}  (${dur}m)  "${topic}"`);

  if (DRY_RUN) continue;

  let meetingId = null;
  try {
    const zoom = await createZoomMeeting(topic, scheduledAt.toISOString(), dur, teacher.email);
    meetingId = zoom.meeting_id;
    await sb("live_sessions", {
      method: "POST",
      body: JSON.stringify({
        course_id: enrollment.course_id,
        teacher_id: enrollment.teacher_id,
        student_id: enrollment.student_id,
        enrollment_id: enrollment.id,
        lesson_id: lesson?.id ?? null,
        title: topic,
        scheduled_at: scheduledAt.toISOString(),
        duration_minutes: dur,
        session_number: sessionNum,
        zoom_meeting_id: zoom.meeting_id,
        zoom_join_url: zoom.join_url,
        zoom_start_url: zoom.start_url,
        status: "scheduled",
      }),
    });
    created++;
    console.log(`     -> created (zoom ${zoom.meeting_id})`);
  } catch (err) {
    if (meetingId) await deleteZoomMeeting(meetingId).catch(() => {});
    failures.push({ sessionNum, error: err.message });
    console.error(`     -> FAILED: ${err.message}`);
  }
}

console.log(`\nCreated ${created} session(s). Failures: ${failures.length}`);
if (failures.length) process.exitCode = 1;
