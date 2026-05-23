-- Link live sessions to predefined course lessons and enrollments
ALTER TABLE live_sessions
  ADD COLUMN IF NOT EXISTS lesson_id uuid REFERENCES course_lessons(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS enrollment_id uuid REFERENCES enrollments(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS live_sessions_lesson_id_idx ON live_sessions(lesson_id);
CREATE INDEX IF NOT EXISTS live_sessions_enrollment_id_idx ON live_sessions(enrollment_id);
