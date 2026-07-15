-- Allow multiple documents per lesson.
--
-- course_lessons.pdf_url / material_id (migrations 009, 010) only support a
-- single document per lesson — admins can't attach both a reading doc and a
-- homework doc to the same lesson. Move lesson documents into their own
-- table so a lesson can have any number of them, each either a direct
-- upload (pdf_url) or a link to an existing course_materials row
-- (material_id), same two source types the single-document UI already
-- supported.
--
-- course_lessons.pdf_url / material_id are left in place (not dropped) for
-- backward compatibility with any code path that hasn't been updated yet;
-- the admin UI and student/teacher lesson views now read/write
-- lesson_documents instead, falling back to the legacy columns only when a
-- lesson has no lesson_documents rows.
--
-- NOTE: like prior migrations in this repo, this is NOT auto-applied — run
-- it manually via the Supabase SQL editor.

CREATE TABLE IF NOT EXISTS lesson_documents (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references course_lessons(id) on delete cascade,
  title text,
  pdf_url text,
  material_id uuid references course_materials(id) on delete set null,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  constraint lesson_documents_source_check check (
    (pdf_url is not null and material_id is null) or
    (pdf_url is null and material_id is not null)
  )
);

CREATE INDEX IF NOT EXISTS lesson_documents_lesson_id_idx ON lesson_documents(lesson_id);

-- Backfill: carry over any lesson that already has a single document
-- attached via the old columns, so nothing already live gets orphaned when
-- the UI switches over to the new table.
INSERT INTO lesson_documents (lesson_id, pdf_url, material_id, display_order)
SELECT id, pdf_url, material_id, 0
FROM course_lessons
WHERE pdf_url IS NOT NULL OR material_id IS NOT NULL;

ALTER TABLE lesson_documents ENABLE ROW LEVEL SECURITY;

-- Mirrors the course_lessons RLS policies (migration 003): enrolled
-- students can read, admins can manage everything, teachers can manage
-- documents for lessons in courses they teach.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'lesson_documents'
      AND policyname = 'Enrolled students can view lesson documents'
  ) THEN
    CREATE POLICY "Enrolled students can view lesson documents"
      ON lesson_documents FOR SELECT USING (
        EXISTS (
          SELECT 1 FROM course_lessons cl
          JOIN course_modules cm ON cm.id = cl.module_id
          JOIN enrollments e ON e.course_id = cm.course_id
          WHERE cl.id = lesson_documents.lesson_id AND e.student_id = auth.uid()
        )
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'lesson_documents'
      AND policyname = 'Admins can manage all lesson documents'
  ) THEN
    CREATE POLICY "Admins can manage all lesson documents"
      ON lesson_documents FOR ALL USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'lesson_documents'
      AND policyname = 'Teachers can manage lesson documents for their courses'
  ) THEN
    CREATE POLICY "Teachers can manage lesson documents for their courses"
      ON lesson_documents FOR ALL USING (
        EXISTS (
          SELECT 1 FROM course_lessons cl
          JOIN course_modules cm ON cm.id = cl.module_id
          JOIN course_teachers ct ON ct.course_id = cm.course_id
          WHERE cl.id = lesson_documents.lesson_id AND ct.teacher_id = auth.uid()
        )
      );
  END IF;
END $$;
