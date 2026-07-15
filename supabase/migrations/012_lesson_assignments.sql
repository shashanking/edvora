-- Let assignments (homework/classwork/assessment — see assignment_type enum
-- in migration 003) be attached directly to a lesson, not just a session.
--
-- Admin has always had full RLS access to `assignments` ("Admins can manage
-- all assignments", migration 001) but there was no admin UI page for it —
-- only teachers could create assignments, and only scoped to a session
-- (migration 004's session_id). A lesson can exist before any session is
-- scheduled for it, and the client wants to attach homework while adding a
-- lesson in the admin portal, so this adds a lesson_id alongside the
-- existing session_id rather than requiring a session first.
--
-- No RLS changes needed: existing policies key off course_id/teacher_id,
-- not session_id/lesson_id, so they already cover this column.
--
-- NOTE: like prior migrations in this repo, this is NOT auto-applied — run
-- it manually via the Supabase SQL editor. Both statements are idempotent
-- (IF NOT EXISTS) and safe to run more than once.

ALTER TABLE assignments ADD COLUMN IF NOT EXISTS lesson_id UUID REFERENCES course_lessons(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_assignments_lesson ON assignments(lesson_id);
