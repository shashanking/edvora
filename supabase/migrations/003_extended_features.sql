-- ============================================
-- Addify Academy LMS - Extended Features Migration
-- Adds: student_schedules, session_ratings, payment_reminders,
--        course_materials, course_modules, course_lessons
-- Alters: profiles, live_sessions, assignments, assignment_submissions
-- ============================================

-- ============================================
-- NEW ENUMS
-- ============================================
DO $$ BEGIN
  CREATE TYPE schedule_status AS ENUM ('preferred', 'confirmed');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE assignment_type AS ENUM ('homework', 'classwork', 'assessment');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE reminder_status AS ENUM ('pending', 'sent', 'acknowledged');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================
-- ALTER EXISTING TABLES
-- ============================================

-- Profiles: add country_code
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS country_code TEXT;

-- Live sessions: add recording support and student link
ALTER TABLE live_sessions ADD COLUMN IF NOT EXISTS recording_url TEXT;
ALTER TABLE live_sessions ADD COLUMN IF NOT EXISTS recording_expires_at TIMESTAMPTZ;
ALTER TABLE live_sessions ADD COLUMN IF NOT EXISTS student_id UUID REFERENCES profiles(id);

-- Assignments: add type, parent, files
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS type assignment_type DEFAULT 'homework';
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS parent_assignment_id UUID REFERENCES assignments(id);
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS file_urls TEXT[];
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS allowed_file_types TEXT[];

-- Assignment submissions: add multi-file support
ALTER TABLE assignment_submissions ADD COLUMN IF NOT EXISTS file_urls TEXT[];
ALTER TABLE assignment_submissions ADD COLUMN IF NOT EXISTS file_type TEXT;

-- ============================================
-- STUDENT SCHEDULES
-- ============================================
CREATE TABLE IF NOT EXISTS student_schedules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  preferred_start_time TIME NOT NULL,
  preferred_end_time TIME NOT NULL,
  confirmed_start_time TIME,
  confirmed_end_time TIME,
  status schedule_status NOT NULL DEFAULT 'preferred',
  confirmed_by UUID REFERENCES profiles(id),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- SESSION RATINGS
-- ============================================
CREATE TABLE IF NOT EXISTS session_ratings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES live_sessions(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(session_id, student_id)
);

-- ============================================
-- PAYMENT REMINDERS
-- ============================================
CREATE TABLE IF NOT EXISTS payment_reminders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  payment_id UUID REFERENCES payments(id),
  reminder_type TEXT NOT NULL DEFAULT 'upcoming',
  next_due_date DATE,
  sent_at TIMESTAMPTZ,
  status reminder_status NOT NULL DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- COURSE MATERIALS (admin-managed)
-- ============================================
CREATE TABLE IF NOT EXISTS course_materials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  uploaded_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  file_url TEXT NOT NULL,
  file_type TEXT,
  file_size BIGINT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- COURSE MODULES (for content structure)
-- ============================================
CREATE TABLE IF NOT EXISTS course_modules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- COURSE LESSONS (within modules)
-- ============================================
CREATE TABLE IF NOT EXISTS course_lessons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  module_id UUID NOT NULL REFERENCES course_modules(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT,
  video_url TEXT,
  duration_minutes INTEGER,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- LESSON PROGRESS (track student completion)
-- ============================================
CREATE TABLE IF NOT EXISTS lesson_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  lesson_id UUID NOT NULL REFERENCES course_lessons(id) ON DELETE CASCADE,
  completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(student_id, lesson_id)
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_student_schedules_student ON student_schedules(student_id);
CREATE INDEX IF NOT EXISTS idx_student_schedules_course ON student_schedules(course_id);
CREATE INDEX IF NOT EXISTS idx_session_ratings_session ON session_ratings(session_id);
CREATE INDEX IF NOT EXISTS idx_session_ratings_student ON session_ratings(student_id);
CREATE INDEX IF NOT EXISTS idx_payment_reminders_student ON payment_reminders(student_id);
CREATE INDEX IF NOT EXISTS idx_payment_reminders_status ON payment_reminders(status);
CREATE INDEX IF NOT EXISTS idx_course_materials_course ON course_materials(course_id);
CREATE INDEX IF NOT EXISTS idx_course_modules_course ON course_modules(course_id);
CREATE INDEX IF NOT EXISTS idx_course_modules_order ON course_modules(course_id, display_order);
CREATE INDEX IF NOT EXISTS idx_course_lessons_module ON course_lessons(module_id);
CREATE INDEX IF NOT EXISTS idx_course_lessons_order ON course_lessons(module_id, display_order);
CREATE INDEX IF NOT EXISTS idx_lesson_progress_student ON lesson_progress(student_id);
CREATE INDEX IF NOT EXISTS idx_lesson_progress_lesson ON lesson_progress(lesson_id);

-- ============================================
-- RLS POLICIES
-- ============================================

-- Student Schedules
ALTER TABLE student_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view own schedules"
  ON student_schedules FOR SELECT USING (student_id = auth.uid());

CREATE POLICY "Students can insert own schedules"
  ON student_schedules FOR INSERT WITH CHECK (student_id = auth.uid());

CREATE POLICY "Admins can manage all schedules"
  ON student_schedules FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Session Ratings
ALTER TABLE session_ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can manage own ratings"
  ON session_ratings FOR ALL USING (student_id = auth.uid());

CREATE POLICY "Admins can view all ratings"
  ON session_ratings FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Teachers can view ratings for their sessions"
  ON session_ratings FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM live_sessions ls
      WHERE ls.id = session_ratings.session_id AND ls.teacher_id = auth.uid()
    )
  );

-- Payment Reminders
ALTER TABLE payment_reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view own reminders"
  ON payment_reminders FOR SELECT USING (student_id = auth.uid());

CREATE POLICY "Admins can manage all reminders"
  ON payment_reminders FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Course Materials
ALTER TABLE course_materials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage all course materials"
  ON course_materials FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Teachers can manage materials they uploaded"
  ON course_materials FOR ALL USING (uploaded_by = auth.uid());

CREATE POLICY "Students can view materials for enrolled courses"
  ON course_materials FOR SELECT USING (
    EXISTS (SELECT 1 FROM enrollments WHERE course_id = course_materials.course_id AND student_id = auth.uid())
  );

-- Course Modules
ALTER TABLE course_modules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view modules of published courses"
  ON course_modules FOR SELECT USING (
    EXISTS (SELECT 1 FROM courses WHERE id = course_modules.course_id AND status = 'published')
  );

CREATE POLICY "Admins can manage all modules"
  ON course_modules FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Teachers can manage modules for their courses"
  ON course_modules FOR ALL USING (
    EXISTS (SELECT 1 FROM course_teachers WHERE course_id = course_modules.course_id AND teacher_id = auth.uid())
  );

-- Course Lessons
ALTER TABLE course_lessons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enrolled students can view lessons"
  ON course_lessons FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM course_modules cm
      JOIN enrollments e ON e.course_id = cm.course_id
      WHERE cm.id = course_lessons.module_id AND e.student_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all lessons"
  ON course_lessons FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Teachers can manage lessons for their courses"
  ON course_lessons FOR ALL USING (
    EXISTS (
      SELECT 1 FROM course_modules cm
      JOIN course_teachers ct ON ct.course_id = cm.course_id
      WHERE cm.id = course_lessons.module_id AND ct.teacher_id = auth.uid()
    )
  );

-- Lesson Progress
ALTER TABLE lesson_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can manage own lesson progress"
  ON lesson_progress FOR ALL USING (student_id = auth.uid());

CREATE POLICY "Admins can view all lesson progress"
  ON lesson_progress FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Teachers can view progress for their courses"
  ON lesson_progress FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM course_lessons cl
      JOIN course_modules cm ON cm.id = cl.module_id
      JOIN course_teachers ct ON ct.course_id = cm.course_id
      WHERE cl.id = lesson_progress.lesson_id AND ct.teacher_id = auth.uid()
    )
  );

-- ============================================
-- TRIGGERS
-- ============================================
CREATE TRIGGER set_updated_at_student_schedules
  BEFORE UPDATE ON student_schedules FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at_course_modules
  BEFORE UPDATE ON course_modules FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at_course_lessons
  BEFORE UPDATE ON course_lessons FOR EACH ROW EXECUTE FUNCTION update_updated_at();
