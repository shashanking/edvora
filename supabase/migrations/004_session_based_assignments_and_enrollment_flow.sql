-- ============================================
-- Addify Academy LMS - Session-based assignments & enrollment flow
-- ============================================

-- Courses: add classes_per_week, total_sessions for auto session generation
ALTER TABLE courses ADD COLUMN IF NOT EXISTS classes_per_week INTEGER NOT NULL DEFAULT 2;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS total_sessions INTEGER NOT NULL DEFAULT 8;

-- Enrollments: add teacher_id so we know which teacher is assigned to this student-course pair
ALTER TABLE enrollments ADD COLUMN IF NOT EXISTS teacher_id UUID REFERENCES profiles(id);

-- Live sessions: add session_number for ordering, enrollment_id for linking
ALTER TABLE live_sessions ADD COLUMN IF NOT EXISTS session_number INTEGER;
ALTER TABLE live_sessions ADD COLUMN IF NOT EXISTS enrollment_id UUID REFERENCES enrollments(id) ON DELETE CASCADE;

-- Assignments: add session_id to link assignment to a specific session
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS session_id UUID REFERENCES live_sessions(id) ON DELETE SET NULL;

-- Attendance: add session_id to link attendance to a specific session
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS session_id UUID REFERENCES live_sessions(id) ON DELETE SET NULL;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_live_sessions_enrollment ON live_sessions(enrollment_id);
CREATE INDEX IF NOT EXISTS idx_live_sessions_session_number ON live_sessions(enrollment_id, session_number);
CREATE INDEX IF NOT EXISTS idx_assignments_session ON assignments(session_id);
CREATE INDEX IF NOT EXISTS idx_attendance_session ON attendance(session_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_teacher ON enrollments(teacher_id);
