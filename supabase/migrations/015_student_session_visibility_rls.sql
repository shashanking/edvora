-- Fix live_sessions student visibility: sessions are 1:1 per enrollment
-- (migration 004), but the original SELECT policy from 001_initial_schema
-- only checked "is this student enrolled in this course" — not "is this
-- session actually theirs". In any course with more than one 1:1 enrollment
-- (the normal case), every enrolled student could read every other
-- student's live_sessions rows for that course, including their Zoom
-- zoom_join_url — a real cross-family data leak, found while investigating
-- a report of the student Sessions tab showing "No sessions scheduled yet"
-- for a student whose sessions simply didn't exist yet (see
-- src/app/dashboard/student/courses/[id]/page.tsx fetchSessions, updated in
-- the same change to filter by enrollment_id instead of course_id).
--
-- live_sessions.student_id (migration 003) is populated on every row
-- created via the batch-create flow (src/app/api/zoom/batch-create/route.ts),
-- so scoping directly on it is simpler and tighter than joining through
-- enrollments.
--
-- NOTE: like prior migrations in this repo, this is NOT auto-applied — run
-- it manually via the Supabase SQL editor. Statements are idempotent
-- (DROP POLICY IF EXISTS + CREATE POLICY) and safe to run more than once.

DROP POLICY IF EXISTS "Students can view sessions in enrolled courses" ON live_sessions;
CREATE POLICY "Students can view their own sessions"
  ON live_sessions FOR SELECT USING (
    student_id = auth.uid()
  );
