-- Sample Data for LMS Feature Expansion Demo
-- This migration creates realistic test data for visualization

-- Insert Sample Courses
INSERT INTO courses (
  id, title, description, duration, level, category,
  audience, landing_category, rating, display_order, status, thumbnail_url,
  created_at, updated_at
) VALUES
  -- Young Learner Courses
  ('course-1', 'English for Kids - Beginner', 'Fun and interactive English learning for young children aged 6-8', '3 months', 'beginner', 'English', 'young', 'core', 4.5, 1, 'published', 'https://picsum.photos/seed/english-kids/400/300.jpg', NOW(), NOW()),
  ('course-2', 'Math Fundamentals for Kids', 'Build strong math foundations through games and activities', '3 months', 'beginner', 'Mathematics', 'young', 'core', 4.7, 2, 'published', 'https://picsum.photos/seed/math-kids/400/300.jpg', NOW(), NOW()),
  ('course-3', 'Science Explorer Junior', 'Discover the wonders of science through experiments', '4 months', 'intermediate', 'Science', 'young', 'specialized', 4.6, 3, 'published', 'https://picsum.photos/seed/science-kids/400/300.jpg', NOW(), NOW()),

  -- Adult Learner Courses
  ('course-4', 'Business English Professional', 'Master business communication and presentation skills', '6 months', 'advanced', 'English', 'adult', 'professional', 4.8, 4, 'published', 'https://picsum.photos/seed/business-english/400/300.jpg', NOW(), NOW()),
  ('course-5', 'IELTS Preparation Course', 'Comprehensive IELTS exam preparation with practice tests', '8 weeks', 'intermediate', 'English', 'adult', 'exam', 4.9, 5, 'published', 'https://picsum.photos/seed/ielts/400/300.jpg', NOW(), NOW()),
  ('course-6', 'Advanced Mathematics', 'Calculus, algebra, and statistics for professionals', '6 months', 'advanced', 'Mathematics', 'adult', 'academic', 4.4, 6, 'published', 'https://picsum.photos/seed/advanced-math/400/300.jpg', NOW(), NOW());

-- Insert Sample Students (Profiles)
INSERT INTO profiles (
  id, email, full_name, role, phone, country_code, avatar_url,
  created_at, updated_at
) VALUES 
  ('student-1', 'emma.wilson@email.com', 'Emma Wilson', 'student', '+1234567890', 'US', 'https://picsum.photos/seed/emma/100/100.jpg', NOW(), NOW()),
  ('student-2', 'raj.patel@email.com', 'Raj Patel', 'student', '+919876543210', 'IN', 'https://picsum.photos/seed/raj/100/100.jpg', NOW(), NOW()),
  ('student-3', 'sophia.chen@email.com', 'Sophia Chen', 'student', '+8613876543210', 'CN', 'https://picsum.photos/seed/sophia/100/100.jpg', NOW(), NOW()),
  ('student-4', 'james.brown@email.com', 'James Brown', 'student', '+447912345678', 'GB', 'https://picsum.photos/seed/james/100/100.jpg', NOW(), NOW()),
  ('student-5', 'maria.garcia@email.com', 'Maria Garcia', 'student', '+34678901234', 'ES', 'https://picsum.photos/seed/maria/100/100.jpg', NOW(), NOW());

-- Insert Sample Teachers
INSERT INTO profiles (
  id, email, full_name, role, phone, country_code, avatar_url,
  created_at, updated_at
) VALUES 
  ('teacher-1', 'sarah.johnson@academy.com', 'Sarah Johnson', 'teacher', '+12025551234', 'US', 'https://picsum.photos/seed/sarah/100/100.jpg', NOW(), NOW()),
  ('teacher-2', 'david.lee@academy.com', 'David Lee', 'teacher', '+61412345678', 'AU', 'https://picsum.photos/seed/david/100/100.jpg', NOW(), NOW()),
  ('teacher-3', 'priya.sharma@academy.com', 'Priya Sharma', 'teacher', '+91987654321', 'IN', 'https://picsum.photos/seed/priya/100/100.jpg', NOW(), NOW());

-- Insert Sample Admin
INSERT INTO profiles (
  id, email, full_name, role, phone, country_code, avatar_url,
  created_at, updated_at
) VALUES 
  ('admin-1', 'admin@addify-academy.com', 'System Administrator', 'admin', '+15551234567', 'US', 'https://picsum.photos/seed/admin/100/100.jpg', NOW(), NOW());

-- Insert Course Teachers (Assign teachers to courses)
INSERT INTO course_teachers (course_id, teacher_id, assigned_at) VALUES
  ('course-1', 'teacher-1', NOW()),
  ('course-2', 'teacher-2', NOW()),
  ('course-3', 'teacher-3', NOW()),
  ('course-4', 'teacher-1', NOW()),
  ('course-5', 'teacher-2', NOW()),
  ('course-6', 'teacher-3', NOW());

-- Insert Sample Enrollments
INSERT INTO enrollments (
  id, student_id, course_id, status, progress, enrolled_at, updated_at
) VALUES 
  ('enrollment-1', 'student-1', 'course-1', 'active', 75, DATE_SUB(NOW(), INTERVAL 45 DAY), NOW()),
  ('enrollment-2', 'student-1', 'course-3', 'active', 30, DATE_SUB(NOW(), INTERVAL 20 DAY), NOW()),
  ('enrollment-3', 'student-2', 'course-2', 'active', 90, DATE_SUB(NOW(), INTERVAL 60 DAY), NOW()),
  ('enrollment-4', 'student-2', 'course-5', 'active', 45, DATE_SUB(NOW(), INTERVAL 30 DAY), NOW()),
  ('enrollment-5', 'student-3', 'course-4', 'active', 60, DATE_SUB(NOW(), INTERVAL 40 DAY), NOW()),
  ('enrollment-6', 'student-4', 'course-1', 'active', 85, DATE_SUB(NOW(), INTERVAL 50 DAY), NOW()),
  ('enrollment-7', 'student-5', 'course-3', 'active', 40, DATE_SUB(NOW(), INTERVAL 25 DAY), NOW()),
  ('enrollment-8', 'student-5', 'course-6', 'active', 20, DATE_SUB(NOW(), INTERVAL 15 DAY), NOW());

-- Insert Sample Payments
INSERT INTO payments (
  id, student_id, course_id, amount, currency, status, provider,
  provider_order_id, provider_payment_id, paid_at, created_at, updated_at
) VALUES 
  ('payment-1', 'student-1', 'course-1', 4999.00, 'INR', 'completed', 'razorpay', 'order_course1_1', 'pay_course1_1', DATE_SUB(NOW(), INTERVAL 45 DAY), DATE_SUB(NOW(), INTERVAL 45 DAY), NOW()),
  ('payment-2', 'student-1', 'course-3', 5499.00, 'INR', 'completed', 'razorpay', 'order_course3_1', 'pay_course3_1', DATE_SUB(NOW(), INTERVAL 20 DAY), DATE_SUB(NOW(), INTERVAL 20 DAY), NOW()),
  ('payment-3', 'student-2', 'course-2', 3999.00, 'INR', 'completed', 'razorpay', 'order_course2_2', 'pay_course2_2', DATE_SUB(NOW(), INTERVAL 60 DAY), DATE_SUB(NOW(), INTERVAL 60 DAY), NOW()),
  ('payment-4', 'student-2', 'course-5', 12999.00, 'INR', 'completed', 'razorpay', 'order_course5_2', 'pay_course5_2', DATE_SUB(NOW(), INTERVAL 30 DAY), DATE_SUB(NOW(), INTERVAL 30 DAY), NOW()),
  ('payment-5', 'student-3', 'course-4', 9999.00, 'INR', 'completed', 'razorpay', 'order_course4_3', 'pay_course4_3', DATE_SUB(NOW(), INTERVAL 40 DAY), DATE_SUB(NOW(), INTERVAL 40 DAY), NOW()),
  ('payment-6', 'student-4', 'course-1', 4999.00, 'INR', 'completed', 'razorpay', 'order_course1_4', 'pay_course1_4', DATE_SUB(NOW(), INTERVAL 50 DAY), DATE_SUB(NOW(), INTERVAL 50 DAY), NOW()),
  ('payment-7', 'student-5', 'course-3', 5499.00, 'INR', 'completed', 'razorpay', 'order_course3_5', 'pay_course3_5', DATE_SUB(NOW(), INTERVAL 25 DAY), DATE_SUB(NOW(), INTERVAL 25 DAY), NOW()),
  ('payment-8', 'student-5', 'course-6', 8999.00, 'INR', 'completed', 'razorpay', 'order_course6_5', 'pay_course6_5', DATE_SUB(NOW(), INTERVAL 15 DAY), DATE_SUB(NOW(), INTERVAL 15 DAY), NOW());

-- Insert Sample Student Schedules
INSERT INTO student_schedules (
  id, student_id, course_id, day_of_week,
  preferred_start_time, preferred_end_time,
  confirmed_start_time, confirmed_end_time,
  status, notes, created_at
) VALUES 
  -- Emma Wilson schedules
  ('schedule-1', 'student-1', 'course-1', 1, '16:00:00', '17:00:00', '16:30:00', '17:30:00', 'confirmed', 'Student prefers afternoon sessions', DATE_SUB(NOW(), INTERVAL 44 DAY)),
  ('schedule-2', 'student-1', 'course-3', 3, '17:00:00', '18:00:00', '17:00:00', '18:00:00', 'confirmed', 'Science experiments need extra time', DATE_SUB(NOW(), INTERVAL 19 DAY)),
  
  -- Raj Patel schedules
  ('schedule-3', 'student-2', 'course-2', 2, '18:00:00', '19:00:00', '18:30:00', '19:30:00', 'confirmed', 'Evening sessions preferred', DATE_SUB(NOW(), INTERVAL 59 DAY)),
  ('schedule-4', 'student-2', 'course-5', 4, '19:00:00', '20:00:00', '19:00:00', '20:00:00', 'confirmed', 'IELTS practice sessions', DATE_SUB(NOW(), INTERVAL 29 DAY)),
  
  -- Sophia Chen schedules
  ('schedule-5', 'student-3', 'course-4', 1, '09:00:00', '10:00:00', '09:00:00', '10:00:00', 'confirmed', 'Morning sessions for business English', DATE_SUB(NOW(), INTERVAL 39 DAY)),
  
  -- James Brown schedules
  ('schedule-6', 'student-4', 'course-1', 5, '15:00:00', '16:00:00', '15:30:00', '16:30:00', 'confirmed', 'Friday afternoon sessions', DATE_SUB(NOW(), INTERVAL 49 DAY)),
  
  -- Maria Garcia schedules
  ('schedule-7', 'student-5', 'course-3', 2, '16:00:00', '17:00:00', '16:00:00', '17:00:00', 'confirmed', 'Regular science classes', DATE_SUB(NOW(), INTERVAL 24 DAY)),
  ('schedule-8', 'student-5', 'course-6', 4, '17:00:00', '18:00:00', '17:30:00', '18:30:00', 'confirmed', 'Advanced math sessions', DATE_SUB(NOW(), INTERVAL 14 DAY)),

  -- Some pending schedules for demo
  ('schedule-9', 'student-1', 'course-2', 5, '17:00:00', '18:00:00', NULL, NULL, 'preferred', 'Waiting for confirmation', DATE_SUB(NOW(), INTERVAL 10 DAY)),
  ('schedule-10', 'student-3', 'course-5', 3, '10:00:00', '11:00:00', NULL, NULL, 'preferred', 'Weekend preferred', DATE_SUB(NOW(), INTERVAL 5 DAY));

-- Insert Sample Live Sessions
INSERT INTO live_sessions (
  id, course_id, title, description, scheduled_at, duration_minutes,
  status, zoom_join_url, zoom_meeting_id, zoom_password, student_id,
  recording_url, recording_expires_at, created_at, updated_at
) VALUES 
  -- Upcoming sessions
  ('session-1', 'course-1', 'Introduction to Phonics', 'Learning basic English sounds and letters', DATE_ADD(NOW(), INTERVAL 2 DAY), 60, 'scheduled', 'https://zoom.us/j/123456789', '123456789', 'abc123', 'student-1', NULL, NULL, DATE_SUB(NOW(), INTERVAL 1 DAY), NOW()),
  ('session-2', 'course-2', 'Basic Addition and Subtraction', 'Fun math games with numbers', DATE_ADD(NOW(), INTERVAL 3 DAY), 45, 'scheduled', 'https://zoom.us/j/234567890', '234567890', 'def456', 'student-2', NULL, NULL, DATE_SUB(NOW(), INTERVAL 2 DAY), NOW()),
  ('session-3', 'course-4', 'Business Email Writing', 'Professional email communication skills', DATE_ADD(NOW(), INTERVAL 1 DAY), 60, 'live', 'https://zoom.us/j/345678901', '345678901', 'ghi789', 'student-3', NULL, NULL, DATE_SUB(NOW(), INTERVAL 1 DAY), NOW()),
  
  -- Completed sessions with recordings
  ('session-4', 'course-1', 'Storytelling Session', 'Reading and creating simple stories', DATE_SUB(NOW(), INTERVAL 7 DAY), 50, 'completed', 'https://zoom.us/j/456789012', '456789012', 'jkl012', 'student-1', 'https://storage.googleapis.com/recordings/session-4.mp4', DATE_ADD(NOW(), INTERVAL 23 DAY), DATE_SUB(NOW(), INTERVAL 8 DAY), NOW()),
  ('session-5', 'course-3', 'Plant Life Cycle', 'Understanding how plants grow', DATE_SUB(NOW(), INTERVAL 5 DAY), 55, 'completed', 'https://zoom.us/j/567890123', '567890123', 'mno345', 'student-5', 'https://storage.googleapis.com/recordings/session-5.mp4', DATE_ADD(NOW(), INTERVAL 25 DAY), DATE_SUB(NOW(), INTERVAL 6 DAY), NOW()),
  ('session-6', 'course-5', 'IELTS Speaking Practice', 'Speaking test preparation', DATE_SUB(NOW(), INTERVAL 3 DAY), 60, 'completed', 'https://zoom.us/j/678901234', '678901234', 'pqr678', 'student-2', 'https://storage.googleapis.com/recordings/session-6.mp4', DATE_ADD(NOW(), INTERVAL 27 DAY), DATE_SUB(NOW(), INTERVAL 4 DAY), NOW()),
  ('session-7', 'course-4', 'Presentation Skills', 'How to deliver effective presentations', DATE_SUB(NOW(), INTERVAL 2 DAY), 60, 'completed', 'https://zoom.us/j/789012345', '789012345', 'stu901', 'student-3', 'https://storage.googleapis.com/recordings/session-7.mp4', DATE_ADD(NOW(), INTERVAL 28 DAY), DATE_SUB(NOW(), INTERVAL 3 DAY), NOW()),
  ('session-8', 'course-2', 'Number Patterns', 'Discovering patterns in mathematics', DATE_SUB(NOW(), INTERVAL 1 DAY), 45, 'completed', 'https://zoom.us/j/890123456', '890123456', 'vwx234', 'student-2', 'https://storage.googleapis.com/recordings/session-8.mp4', DATE_ADD(NOW(), INTERVAL 29 DAY), DATE_SUB(NOW(), INTERVAL 2 DAY), NOW());

-- Insert Sample Session Ratings
INSERT INTO session_ratings (
  id, session_id, student_id, rating, comment, created_at
) VALUES 
  ('rating-1', 'session-4', 'student-1', 5, 'Excellent storytelling session! My child loved it.', DATE_SUB(NOW(), INTERVAL 6 DAY)),
  ('rating-2', 'session-5', 'student-5', 4, 'Good explanation of plant life cycle. Visuals were helpful.', DATE_SUB(NOW(), INTERVAL 4 DAY)),
  ('rating-3', 'session-6', 'student-2', 5, 'Very helpful speaking practice. Teacher gave great feedback.', DATE_SUB(NOW(), INTERVAL 2 DAY)),
  ('rating-4', 'session-7', 'student-3', 4, 'Learned a lot about presentations. More practice would be good.', DATE_SUB(NOW(), INTERVAL 1 DAY)),
  ('rating-5', 'session-8', 'student-2', 5, 'Fun way to learn number patterns!', DATE_SUB(NOW(), INTERVAL 1 DAY));

-- Insert Sample Assignments
INSERT INTO assignments (
  id, course_id, title, description, type, due_date,
  total_marks, parent_assignment_id, file_urls, allowed_file_types,
  created_at, updated_at
) VALUES 
  -- Homework assignments
  ('assignment-1', 'course-1', 'Phonics Practice', 'Practice the sounds we learned in class', 'homework', DATE_ADD(NOW(), INTERVAL 3 DAY), 100, NULL, NULL, ARRAY['pdf', 'doc', 'docx'], DATE_SUB(NOW(), INTERVAL 10 DAY), NOW()),
  ('assignment-2', 'course-2', 'Math Worksheet', 'Complete addition and subtraction problems', 'homework', DATE_ADD(NOW(), INTERVAL 2 DAY), 50, NULL, NULL, ARRAY['pdf', 'jpg', 'png'], DATE_SUB(NOW(), INTERVAL 8 DAY), NOW()),
  ('assignment-3', 'course-4', 'Email Draft', 'Write a professional business email', 'homework', DATE_ADD(NOW(), INTERVAL 5 DAY), 100, NULL, NULL, ARRAY['doc', 'docx', 'pdf'], DATE_SUB(NOW(), INTERVAL 5 DAY), NOW()),
  
  -- Classwork assignments
  ('assignment-4', 'course-1', 'Reading Comprehension', 'Read the story and answer questions', 'classwork', DATE_ADD(NOW(), INTERVAL 1 DAY), 50, NULL, NULL, ARRAY['pdf'], DATE_SUB(NOW(), INTERVAL 2 DAY), NOW()),
  ('assignment-5', 'course-3', 'Science Diagram', 'Draw and label a plant diagram', 'classwork', DATE_ADD(NOW(), INTERVAL 2 DAY), 75, NULL, NULL, ARRAY['jpg', 'png', 'pdf'], DATE_SUB(NOW(), INTERVAL 3 DAY), NOW()),
  
  -- Assessment assignments
  ('assignment-6', 'course-5', 'Speaking Test', 'Record yourself speaking about your hobby', 'assessment', DATE_ADD(NOW(), INTERVAL 7 DAY), 100, NULL, NULL, ARRAY['mp3', 'wav', 'mp4'], DATE_SUB(NOW(), INTERVAL 7 DAY), NOW()),
  ('assignment-7', 'course-2', 'Math Quiz', 'Complete the math quiz on patterns', 'assessment', DATE_ADD(NOW(), INTERVAL 4 DAY), 100, NULL, NULL, ARRAY['pdf'], DATE_SUB(NOW(), INTERVAL 4 DAY), NOW()),
  
  -- Sub-assignments (parts of larger assignments)
  ('assignment-8', 'course-4', 'Email Subject Lines', 'Practice writing effective subject lines', 'homework', DATE_ADD(NOW(), INTERVAL 1 DAY), 25, 'assignment-3', NULL, ARRAY['doc', 'docx'], DATE_SUB(NOW(), INTERVAL 1 DAY), NOW()),
  ('assignment-9', 'course-4', 'Email Body Structure', 'Structure the email body properly', 'homework', DATE_ADD(NOW(), INTERVAL 2 DAY), 50, 'assignment-3', NULL, ARRAY['doc', 'docx'], DATE_SUB(NOW(), INTERVAL 1 DAY), NOW()),
  ('assignment-10', 'course-4', 'Email Closing', 'Write professional email closings', 'homework', DATE_ADD(NOW(), INTERVAL 3 DAY), 25, 'assignment-3', NULL, ARRAY['doc', 'docx'], DATE_SUB(NOW(), INTERVAL 1 DAY), NOW());

-- Insert Sample Assignment Submissions
INSERT INTO assignment_submissions (
  id, assignment_id, student_id, submitted_at, file_urls,
  file_type, marks_obtained, feedback, graded_at, created_at, updated_at
) VALUES 
  -- Submitted and graded assignments
  ('submission-1', 'assignment-1', 'student-1', DATE_SUB(NOW(), INTERVAL 2 DAY), ARRAY['https://storage.googleapis.com/submissions/phonics-practice-emma.pdf'], 'pdf', 95, 'Excellent phonics practice! Clear pronunciation.', DATE_SUB(NOW(), INTERVAL 1 DAY), DATE_SUB(NOW(), INTERVAL 2 DAY), NOW()),
  ('submission-2', 'assignment-2', 'student-2', DATE_SUB(NOW(), INTERVAL 1 DAY), ARRAY['https://storage.googleapis.com/submissions/math-worksheet-raj.pdf'], 'pdf', 88, 'Good work! Review subtraction with borrowing.', DATE_SUB(NOW(), INTERVAL 1 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY), NOW()),
  ('submission-3', 'assignment-3', 'student-3', DATE_SUB(NOW(), INTERVAL 3 DAY), ARRAY['https://storage.googleapis.com/submissions/email-draft-sophia.docx'], 'docx', 92, 'Professional tone and structure. Minor formatting suggestions.', DATE_SUB(NOW(), INTERVAL 2 DAY), DATE_SUB(NOW(), INTERVAL 3 DAY), NOW()),
  
  -- Submitted but not graded
  ('submission-4', 'assignment-4', 'student-1', DATE_SUB(NOW(), INTERVAL 1 DAY), ARRAY['https://storage.googleapis.com/submissions/reading-emma.pdf'], 'pdf', NULL, NULL, NULL, DATE_SUB(NOW(), INTERVAL 1 DAY), NOW()),
  ('submission-5', 'assignment-5', 'student-5', DATE_SUB(NOW(), INTERVAL 1 DAY), ARRAY['https://storage.googleapis.com/submissions/plant-diagram-maria.jpg'], 'jpg', NULL, NULL, NULL, DATE_SUB(NOW(), INTERVAL 1 DAY), NOW()),
  
  -- Assessment submissions
  ('submission-6', 'assignment-6', 'student-2', DATE_SUB(NOW(), INTERVAL 2 DAY), ARRAY['https://storage.googleapis.com/submissions/speaking-test-raj.mp4'], 'mp4', 85, 'Good fluency and pronunciation. Work on vocabulary.', DATE_SUB(NOW(), INTERVAL 1 DAY), DATE_SUB(NOW(), INTERVAL 2 DAY), NOW()),
  ('submission-7', 'assignment-7', 'student-4', DATE_SUB(NOW(), INTERVAL 1 DAY), ARRAY['https://storage.googleapis.com/submissions/math-quiz-james.pdf'], 'pdf', 78, 'Good understanding of patterns. Review complex sequences.', DATE_SUB(NOW(), INTERVAL 1 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY), NOW());

-- Insert Sample Course Materials
INSERT INTO course_materials (
  id, course_id, uploaded_by, title, description, file_url,
  file_type, file_size, created_at
) VALUES 
  -- Course 1 materials
  ('material-1', 'course-1', 'teacher-1', 'Alphabet Flashcards', 'Printable alphabet flashcards for practice', 'https://storage.googleapis.com/materials/alphabet-flashcards.pdf', 'pdf', 2048000, DATE_SUB(NOW(), INTERVAL 30 DAY)),
  ('material-2', 'course-1', 'teacher-1', 'Phonics Songs', 'Collection of phonics learning songs', 'https://storage.googleapis.com/materials/phonics-songs.mp3', 'audio', 5242880, DATE_SUB(NOW(), INTERVAL 25 DAY)),
  ('material-3', 'course-1', 'teacher-1', 'Reading Practice Book', 'Short stories for reading practice', 'https://storage.googleapis.com/materials/reading-practice.pdf', 'pdf', 3072000, DATE_SUB(NOW(), INTERVAL 20 DAY)),
  
  -- Course 2 materials
  ('material-4', 'course-2', 'teacher-2', 'Number Charts', 'Visual number charts 1-100', 'https://storage.googleapis.com/materials/number-charts.pdf', 'pdf', 1536000, DATE_SUB(NOW(), INTERVAL 28 DAY)),
  ('material-5', 'course-2', 'teacher-2', 'Math Games Video', 'Interactive math games tutorial', 'https://storage.googleapis.com/materials/math-games.mp4', 'video', 10485760, DATE_SUB(NOW(), INTERVAL 22 DAY)),
  
  -- Course 4 materials
  ('material-6', 'course-4', 'teacher-1', 'Business Email Templates', 'Professional email templates', 'https://storage.googleapis.com/materials/email-templates.docx', 'doc', 256000, DATE_SUB(NOW(), INTERVAL 35 DAY)),
  ('material-7', 'course-4', 'teacher-1', 'Presentation Guide', 'How to create effective presentations', 'https://storage.googleapis.com/materials/presentation-guide.pdf', 'pdf', 4096000, DATE_SUB(NOW(), INTERVAL 30 DAY)),
  
  -- Course 5 materials
  ('material-8', 'course-5', 'teacher-2', 'IELTS Vocabulary', 'Essential vocabulary for IELTS', 'https://storage.googleapis.com/materials/ielts-vocab.pdf', 'pdf', 5120000, DATE_SUB(NOW(), INTERVAL 40 DAY)),
  ('material-9', 'course-5', 'teacher-2', 'Speaking Topics List', 'Common IELTS speaking topics', 'https://storage.googleapis.com/materials/speaking-topics.pdf', 'pdf', 1024000, DATE_SUB(NOW(), INTERVAL 35 DAY)),

  -- Course 3 materials
  ('material-10', 'course-3', 'teacher-3', 'Science Experiment Kit', 'List of materials for experiments', 'https://storage.googleapis.com/materials/experiment-kit.pdf', 'pdf', 768000, DATE_SUB(NOW(), INTERVAL 26 DAY)),
  ('material-11', 'course-3', 'teacher-3', 'Plant Growth Chart', 'Track plant growth over time', 'https://storage.googleapis.com/materials/growth-chart.pdf', 'pdf', 512000, DATE_SUB(NOW(), INTERVAL 21 DAY)),

  -- Course 6 materials
  ('material-12', 'course-6', 'teacher-3', 'Calculus Formulas', 'Essential calculus formula sheet', 'https://storage.googleapis.com/materials/calculus-formulas.pdf', 'pdf', 640000, DATE_SUB(NOW(), INTERVAL 32 DAY)),
  ('material-13', 'course-6', 'teacher-3', 'Statistics Examples', 'Real-world statistics examples', 'https://storage.googleapis.com/materials/statistics-examples.pdf', 'pdf', 3840000, DATE_SUB(NOW(), INTERVAL 28 DAY));

-- Insert Sample Payment Reminders
INSERT INTO payment_reminders (
  id, student_id, course_id, reminder_type, next_due_date,
  sent_at, status, notes, created_at
) VALUES 
  -- Pending reminders
  ('reminder-1', 'student-1', 'course-2', 'upcoming', DATE_ADD(NOW(), INTERVAL 15 DAY), NULL, 'pending', 'Monthly payment reminder for Math course', DATE_SUB(NOW(), INTERVAL 5 DAY)),
  ('reminder-2', 'student-3', 'course-5', 'upcoming', DATE_ADD(NOW(), INTERVAL 10 DAY), NULL, 'pending', 'IELTS course installment due', DATE_SUB(NOW(), INTERVAL 3 DAY)),
  
  -- Sent reminders
  ('reminder-3', 'student-2', 'course-2', 'overdue', DATE_SUB(NOW(), INTERVAL 5 DAY), DATE_SUB(NOW(), INTERVAL 4 DAY), 'sent', 'Payment overdue - follow up sent', DATE_SUB(NOW(), INTERVAL 6 DAY)),
  ('reminder-4', 'student-5', 'course-3', 'renewal', DATE_ADD(NOW(), INTERVAL 30 DAY), DATE_SUB(NOW(), INTERVAL 2 DAY), 'sent', 'Course renewal reminder sent', DATE_SUB(NOW(), INTERVAL 7 DAY)),
  
  -- Acknowledged reminders
  ('reminder-5', 'student-4', 'course-1', 'upcoming', DATE_ADD(NOW(), INTERVAL 20 DAY), DATE_SUB(NOW(), INTERVAL 3 DAY), 'acknowledged', 'Student confirmed payment schedule', DATE_SUB(NOW(), INTERVAL 8 DAY)),
  ('reminder-6', 'student-1', 'course-3', 'upcoming', DATE_ADD(NOW(), INTERVAL 25 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY), 'acknowledged', 'Parent acknowledged reminder', DATE_SUB(NOW(), INTERVAL 2 DAY));

-- Insert Sample Attendance Records
INSERT INTO attendance (
  id, student_id, course_id, session_date, status, remarks,
  created_at, updated_at
) VALUES 
  -- Recent attendance
  ('attendance-1', 'student-1', 'course-1', DATE_SUB(NOW(), INTERVAL 7 DAY), 'present', 'Active participation', DATE_SUB(NOW(), INTERVAL 7 DAY), NOW()),
  ('attendance-2', 'student-1', 'course-3', DATE_SUB(NOW(), INTERVAL 5 DAY), 'present', 'Asked good questions', DATE_SUB(NOW(), INTERVAL 5 DAY), NOW()),
  ('attendance-3', 'student-2', 'course-2', DATE_SUB(NOW(), INTERVAL 6 DAY), 'present', 'Completed all tasks', DATE_SUB(NOW(), INTERVAL 6 DAY), NOW()),
  ('attendance-4', 'student-2', 'course-5', DATE_SUB(NOW(), INTERVAL 3 DAY), 'present', 'Excellent speaking practice', DATE_SUB(NOW(), INTERVAL 3 DAY), NOW()),
  ('attendance-5', 'student-3', 'course-4', DATE_SUB(NOW(), INTERVAL 2 DAY), 'present', 'Good engagement', DATE_SUB(NOW(), INTERVAL 2 DAY), NOW()),
  ('attendance-6', 'student-4', 'course-1', DATE_SUB(NOW(), INTERVAL 4 DAY), 'absent', 'Student reported sick', DATE_SUB(NOW(), INTERVAL 4 DAY), NOW()),
  ('attendance-7', 'student-5', 'course-3', DATE_SUB(NOW(), INTERVAL 5 DAY), 'present', 'Enjoyed the experiment', DATE_SUB(NOW(), INTERVAL 5 DAY), NOW()),
  ('attendance-8', 'student-5', 'course-6', DATE_SUB(NOW(), INTERVAL 1 DAY), 'present', 'Good progress', DATE_SUB(NOW(), INTERVAL 1 DAY), NOW()),
  
  -- Older attendance
  ('attendance-9', 'student-1', 'course-1', DATE_SUB(NOW(), INTERVAL 14 DAY), 'present', 'Good session', DATE_SUB(NOW(), INTERVAL 14 DAY), NOW()),
  ('attendance-10', 'student-2', 'course-2', DATE_SUB(NOW(), INTERVAL 13 DAY), 'late', 'Joined 10 minutes late', DATE_SUB(NOW(), INTERVAL 13 DAY), NOW()),
  ('attendance-11', 'student-3', 'course-4', DATE_SUB(NOW(), INTERVAL 9 DAY), 'present', 'Very interactive', DATE_SUB(NOW(), INTERVAL 9 DAY), NOW()),
  ('attendance-12', 'student-4', 'course-1', DATE_SUB(NOW(), INTERVAL 11 DAY), 'present', 'Improved performance', DATE_SUB(NOW(), INTERVAL 11 DAY), NOW()),
  ('attendance-13', 'student-5', 'course-3', DATE_SUB(NOW(), INTERVAL 12 DAY), 'present', 'Curious and engaged', DATE_SUB(NOW(), INTERVAL 12 DAY), NOW());

-- Insert Sample Remarks
INSERT INTO remarks (
  id, student_id, course_id, teacher_id, remark_type, content,
  created_at, updated_at
) VALUES 
  -- Positive remarks
  ('remark-1', 'student-1', 'course-1', 'teacher-1', 'positive', 'Emma shows excellent progress in phonics. Her pronunciation has improved significantly.', DATE_SUB(NOW(), INTERVAL 7 DAY), NOW()),
  ('remark-2', 'student-2', 'course-2', 'teacher-2', 'positive', 'Raj demonstrates strong mathematical abilities and helps other students.', DATE_SUB(NOW(), INTERVAL 5 DAY), NOW()),
  ('remark-3', 'student-3', 'course-4', 'teacher-1', 'positive', 'Sophia''s business English skills are impressive. She writes professional emails.', DATE_SUB(NOW(), INTERVAL 3 DAY), NOW()),
  
  -- Areas for improvement
  ('remark-4', 'student-4', 'course-1', 'teacher-1', 'improvement', 'James needs more practice with reading comprehension. Additional worksheets provided.', DATE_SUB(NOW(), INTERVAL 4 DAY), NOW()),
  ('remark-5', 'student-5', 'course-6', 'teacher-3', 'improvement', 'Maria should review calculus basics before next session.', DATE_SUB(NOW(), INTERVAL 1 DAY), NOW()),
  
  -- General remarks
  ('remark-6', 'student-1', 'course-3', 'teacher-3', 'general', 'Emma is enthusiastic about science experiments and always comes prepared.', DATE_SUB(NOW(), INTERVAL 5 DAY), NOW()),
  ('remark-7', 'student-2', 'course-5', 'teacher-2', 'general', 'Raj is making good progress with IELTS preparation. Speaking skills improving.', DATE_SUB(NOW(), INTERVAL 2 DAY), NOW()),
  ('remark-8', 'student-3', 'course-4', 'teacher-1', 'general', 'Sophia actively participates in class discussions and asks thoughtful questions.', DATE_SUB(NOW(), INTERVAL 8 DAY), NOW());
