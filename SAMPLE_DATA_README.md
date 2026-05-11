# Sample Data for Addify Academy LMS

This document explains how to populate your LMS with realistic sample data for demonstration and testing purposes.

## 📋 What's Included

### Courses (6)
- **Young Learners**: English for Kids, Math Fundamentals, Science Explorer
- **Adult Learners**: Business English, IELTS Preparation, Advanced Mathematics
- Each course includes pricing, duration, ratings, and thumbnail images

### Users (9 total)
- **Students** (5): Emma Wilson, Raj Patel, Sophia Chen, James Brown, Maria Garcia
- **Teachers** (3): Sarah Johnson, David Lee, Priya Sharma  
- **Admin** (1): System Administrator
- All users have realistic profiles with avatars and phone numbers

### Enrollments & Payments
- 8 active enrollments across different courses
- Completed Razorpay payments for all enrollments
- Various progress levels (20% - 90%)

### Live Sessions
- **Upcoming**: 2 scheduled sessions
- **Live Now**: 1 currently active session
- **Completed**: 5 past sessions with recordings
- Realistic Zoom links and meeting IDs

### Session Ratings
- 5-star ratings with detailed comments
- Demonstrates rating feedback system

### Student Schedules
- **Confirmed**: 7 schedules with actual class times
- **Pending**: 2 schedules awaiting admin confirmation
- Various days and time preferences

### Assignments
- **Homework**: 4 assignments with different subjects
- **Classwork**: 2 assignments for in-class completion
- **Assessments**: 2 formal assessments
- **Sub-assignments**: 3 parts of a larger assignment
- Multiple file types supported (PDF, DOC, images, audio, video)

### Assignment Submissions
- 7 submissions with various file types
- Graded submissions with marks and feedback
- Ungraded submissions pending review

### Course Materials
- 13 files across all courses
- File types: PDF, DOC, MP3, MP4, JPG
- Organized by course with descriptions

### Payment Reminders
- **Pending**: 2 upcoming payment reminders
- **Sent**: 2 reminders already sent
- **Acknowledged**: 2 reminders confirmed by students

### Attendance Records
- 13 attendance records
- Present, absent, and late statuses
- Detailed remarks for each session

### Remarks
- 8 teacher remarks
- Positive feedback, improvement areas, general observations

## 🚀 Quick Start

### Option 1: SQL Migration (Recommended)
```bash
# Apply the sample data migration
npx supabase db push
```
This will run the `002_sample_data.sql` migration file.

### Option 2: Node.js Script
```bash
# Install dependencies if not already installed
npm install @supabase/supabase-js dotenv

# Run the seeding script
node scripts/seed-sample-data.js
```

### Option 3: Manual SQL Execution
```sql
-- Execute the SQL file directly in Supabase SQL Editor
-- File: supabase/migrations/002_sample_data.sql
```

## 🔐 Authentication Setup

The sample data includes user accounts. Here are the login credentials:

### Student Accounts
| Email | Password | Role |
|-------|----------|------|
| emma.wilson@email.com | password123 | Student |
| raj.patel@email.com | password123 | Student |
| sophia.chen@email.com | password123 | Student |
| james.brown@email.com | password123 | Student |
| maria.garcia@email.com | password123 | Student |

### Teacher Accounts
| Email | Password | Role |
|-------|----------|------|
| sarah.johnson@academy.com | password123 | Teacher |
| david.lee@academy.com | password123 | Teacher |
| priya.sharma@academy.com | password123 | Teacher |

### Admin Account
| Email | Password | Role |
|-------|----------|------|
| admin@addify-academy.com | password123 | Admin |

⚠️ **Security Note**: These passwords are for demonstration only. Change them in production.

## 🎯 Demo Scenarios

### 1. Student Experience
1. **Login** as any student (e.g., emma.wilson@email.com)
2. **Browse Catalog** → See 6 published courses
3. **View My Courses** → See enrolled courses with progress
4. **Check Schedule** → View confirmed class times
5. **Live Classes** → Join upcoming sessions, rate past ones
6. **Assignments** → View and submit homework
7. **Payments** → View payment history

### 2. Admin Experience
1. **Login** as admin@addify-academy.com
2. **Student Database** → Click "View" on any student
   - See detailed profile, enrollments, payments, schedule
3. **Schedules** → Confirm pending schedules
4. **Materials** → View uploaded course documents
5. **Reminders** → Create and track payment reminders
6. **Courses** → Manage course catalog

### 3. Teacher Experience
1. **Login** as any teacher (e.g., sarah.johnson@academy.com)
2. **My Courses** → View assigned courses
3. **Students** → See enrolled students
4. **Assignments** → Create and grade assignments
5. **Remarks** → Add student feedback

## 📊 Data Visualization

### Dashboard Statistics
- **Total Students**: 5
- **Active Courses**: 6
- **Upcoming Sessions**: 2
- **Pending Schedules**: 2
- **Ungraded Submissions**: 2
- **Payment Reminders**: 6 (2 pending, 2 sent, 2 acknowledged)

### Course Enrollment Breakdown
- **English for Kids**: 2 students (Emma, James)
- **Math Fundamentals**: 1 student (Raj)
- **Science Explorer**: 2 students (Emma, Maria)
- **Business English**: 1 student (Sophia)
- **IELTS Preparation**: 1 student (Raj)
- **Advanced Mathematics**: 1 student (Maria)

### Session Schedule Overview
- **Monday**: Emma (English), Sophia (Business)
- **Tuesday**: Raj (Math), Maria (Science)
- **Wednesday**: Sophia (IELTS - pending)
- **Friday**: Emma (Math - pending), Maria (Advanced)

## 🎨 Visual Features

### Course Cards
- Thumbnail images for each course
- Rating stars and pricing
- Category badges and audience tags
- Enrollment status indicators

### User Profiles
- Avatar images for all users
- Country phone codes
- Role-based color coding

### Session Cards
- Live session indicators
- Recording availability
- Rating widgets for past sessions
- Zoom integration buttons

### Schedule Management
- Calendar view with time slots
- Status badges (preferred/confirmed)
- Admin approval workflow

## 🔧 Customization

### Adding More Data
```javascript
// Add more courses
const newCourse = {
  id: 'course-7',
  title: 'Your Course Title',
  description: 'Course description',
  price: 9999,
  // ... other fields
};

// Add more students
const newStudent = {
  id: 'student-6',
  email: 'new.student@email.com',
  full_name: 'New Student',
  // ... other fields
};
```

### Modifying Existing Data
```sql
-- Update course prices
UPDATE courses SET price = 7999 WHERE id = 'course-1';

-- Change student progress
UPDATE enrollments SET progress = 95 WHERE student_id = 'student-1';

-- Add new sessions
INSERT INTO live_sessions (id, course_id, title, ...)
VALUES ('session-new', 'course-1', 'New Session', ...);
```

### Resetting Data
```sql
-- Clear all sample data
TRUNCATE TABLE session_ratings, student_schedules, payment_reminders, 
course_materials, assignment_submissions, assignments, attendance, 
remarks, live_sessions, payments, enrollments, course_teachers, 
profiles, courses RESTART IDENTITY CASCADE;

-- Then re-run the sample data script
```

## 🚀 Production Considerations

### Before Production
1. **Change all passwords** from the default `password123`
2. **Update email addresses** to use your domain
3. **Replace placeholder URLs** with actual resources
4. **Review phone numbers** for realistic data
5. **Set up proper file storage** for materials and recordings

### Data Privacy
- All sample data uses fictional information
- Email addresses are non-functional
- Phone numbers are formatted but not real
- Images use placeholder services

### Performance
- Sample data is optimized for demonstration
- Consider data volume for production scaling
- Indexes are included for optimal query performance

## 📞 Support

For issues with sample data:
1. Check the migration logs for errors
2. Verify Supabase connection settings
3. Ensure proper environment variables
4. Review SQL syntax for compatibility

## 🎉 Enjoy!

This sample data provides a comprehensive demonstration of all LMS features. Use it to:
- Test user workflows
- Demonstrate capabilities to stakeholders
- Validate feature implementations
- Train new users on the system
