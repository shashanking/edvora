-- Assignment submission type: audio / video / doc / image.
--
-- `assignments.allowed_file_types` already lets the author tick which kinds
-- of file a student may hand in (Audio / Video / Documents / Images). Until
-- now that choice did nothing at submit time and nothing at review time.
-- The student submit form now renders one labelled upload slot per ticked
-- type, and records which kind was handed in here so the teacher's review
-- UI can show it back with the right player — audio element, video element,
-- inline image preview, or a document link.
--
-- This is a new column rather than a reuse of the existing
-- `assignment_submissions.file_type`: everywhere else in this schema
-- `file_type` holds a file *extension* ("pdf", "docx" — see
-- course_materials.file_type and the MaterialViewer component), whereas
-- this is the student's declared *category* of submission. Overloading one
-- column with two meanings would break the extension-keyed icon/viewer
-- lookups that already read `file_type`. The existing column is unused by
-- any current code path (every row is NULL) and is left untouched.
--
-- The allowed values match the keys stored in allowed_file_types
-- (FILE_TYPE_OPTIONS in the teacher assignment modal) so both sides of the
-- feature speak the same vocabulary — note "doc", not "document".
--
-- Nullable on purpose. Submissions made before this migration have no
-- declared type, and the student/teacher pages fall back to inferring the
-- category from each file's extension when it is NULL, so old rows keep
-- rendering correctly.
--
-- NOTE: like prior migrations in this repo, this is NOT auto-applied — run
-- it manually via the Supabase SQL editor. Both statements are idempotent
-- and safe to run more than once.

ALTER TABLE assignment_submissions
  ADD COLUMN IF NOT EXISTS submission_type TEXT;

-- Postgres has no `ADD CONSTRAINT IF NOT EXISTS`, so guard on pg_constraint
-- the same way the storage/RLS migrations guard on pg_policies.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'assignment_submissions'::regclass
      AND conname = 'assignment_submissions_submission_type_check'
  ) THEN
    ALTER TABLE assignment_submissions
      ADD CONSTRAINT assignment_submissions_submission_type_check
      CHECK (submission_type IS NULL OR submission_type IN ('audio', 'video', 'doc', 'image'));
  END IF;
END $$;
