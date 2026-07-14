-- Allow a lesson's document to reference an existing course_materials row
-- instead of (or in addition to) uploading a new file to lesson-pdfs.
-- Nullable, additive, non-destructive. ON DELETE SET NULL so deleting a
-- material doesn't cascade-delete the lesson, it just unlinks it.
ALTER TABLE course_lessons
  ADD COLUMN IF NOT EXISTS material_id UUID REFERENCES course_materials(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_course_lessons_material_id ON course_lessons(material_id);
