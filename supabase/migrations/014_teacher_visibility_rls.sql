-- Teacher visibility fixes (co-teaching + assigned-student RLS gaps).
--
-- Root cause: a course can have multiple teachers (course_teachers,
-- migration 001) but each *student* is individually assigned to exactly one
-- of them via enrollments.teacher_id (migration 004). Several tables that
-- hold per-student class content were still RLS-scoped only to
-- `teacher_id = auth.uid()` on the content row itself (assignments) or had
-- no teacher SELECT policy at all (student_schedules) — so a teacher other
-- than whoever happened to create/own a row couldn't see it even for their
-- own assigned student. Concretely: admin creates lesson-linked homework
-- from the Manage Content page and has to file it under *some* teacher_id
-- (see src/app/dashboard/admin/courses/[id]/content/page.tsx), which for a
-- co-taught course is effectively arbitrary — every other teacher on that
-- course was previously unable to see it at all, RLS included.
--
-- This adds READ (and, for submissions, grade) access for any teacher
-- assigned to the course via course_teachers, mirroring the existing
-- pattern already used for course_modules/course_lessons ("Teachers can
-- manage lessons for their courses"). These are additive/permissive
-- policies — Postgres RLS OR's all matching policies together, so existing
-- ownership-based policies (e.g. "Teachers can manage assignments in their
-- courses") are untouched.
--
-- student_schedules gets a narrower policy, scoped to enrollments.teacher_id
-- specifically (not course_teachers) — schedule/timing data is per-student,
-- and enrollments.teacher_id is the precise "assigned child" relationship,
-- not just "some teacher on this course".
--
-- NOTE: like prior migrations in this repo, this is NOT auto-applied — run
-- it manually via the Supabase SQL editor. Statements are idempotent
-- (DROP POLICY IF EXISTS + CREATE POLICY) and safe to run more than once.

-- ---- ASSIGNMENTS: any teacher on the course can view its assignments ----
DROP POLICY IF EXISTS "Teachers can view assignments in their courses" ON assignments;
CREATE POLICY "Teachers can view assignments in their courses"
  ON assignments FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM course_teachers ct
      WHERE ct.course_id = assignments.course_id AND ct.teacher_id = auth.uid()
    )
  );

-- ---- ASSIGNMENT_SUBMISSIONS: any teacher on the course can view/grade ----
DROP POLICY IF EXISTS "Teachers can view/grade submissions in their courses via course_teachers" ON assignment_submissions;
CREATE POLICY "Teachers can view/grade submissions in their courses via course_teachers"
  ON assignment_submissions FOR ALL USING (
    EXISTS (
      SELECT 1 FROM assignments a
      JOIN course_teachers ct ON ct.course_id = a.course_id
      WHERE a.id = assignment_submissions.assignment_id AND ct.teacher_id = auth.uid()
    )
  );

-- ---- STUDENT_SCHEDULES: teacher can view schedules of their assigned students ----
DROP POLICY IF EXISTS "Teachers can view schedules for their assigned students" ON student_schedules;
CREATE POLICY "Teachers can view schedules for their assigned students"
  ON student_schedules FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM enrollments e
      WHERE e.student_id = student_schedules.student_id
        AND e.course_id = student_schedules.course_id
        AND e.teacher_id = auth.uid()
    )
  );
