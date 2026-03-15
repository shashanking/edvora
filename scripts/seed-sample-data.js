#!/usr/bin/env node

/**
 * Sample Data Seeding Script for Addify Academy LMS
 * 
 * This script populates the database with realistic sample data for demonstration purposes.
 * Run with: node scripts/seed-sample-data.js
 * 
 * Environment variables required:
 * - NEXT_PUBLIC_SUPABASE_URL
 * - SUPABASE_SERVICE_ROLE_KEY (for admin operations)
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   - NEXT_PUBLIC_SUPABASE_URL');
  console.error('   - SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Sample data
const sampleData = {
  courses: [
    {
      id: 'course-1',
      title: 'English for Kids - Beginner',
      description: 'Fun and interactive English learning for young children aged 6-8',
      price: 4999,
      currency: 'INR',
      duration: '3 months',
      level: 'beginner',
      category: 'English',
      audience: 'young',
      landing_category: 'core',
      rating: 4.5,
      display_order: 1,
      status: 'published',
      thumbnail_url: 'https://picsum.photos/seed/english-kids/400/300.jpg'
    },
    {
      id: 'course-2',
      title: 'Math Fundamentals for Kids',
      description: 'Build strong math foundations through games and activities',
      price: 3999,
      currency: 'INR',
      duration: '3 months',
      level: 'beginner',
      category: 'Mathematics',
      audience: 'young',
      landing_category: 'core',
      rating: 4.7,
      display_order: 2,
      status: 'published',
      thumbnail_url: 'https://picsum.photos/seed/math-kids/400/300.jpg'
    },
    {
      id: 'course-3',
      title: 'Science Explorer Junior',
      description: 'Discover the wonders of science through experiments',
      price: 5499,
      currency: 'INR',
      duration: '4 months',
      level: 'intermediate',
      category: 'Science',
      audience: 'young',
      landing_category: 'specialized',
      rating: 4.6,
      display_order: 3,
      status: 'published',
      thumbnail_url: 'https://picsum.photos/seed/science-kids/400/300.jpg'
    },
    {
      id: 'course-4',
      title: 'Business English Professional',
      description: 'Master business communication and presentation skills',
      price: 9999,
      currency: 'INR',
      duration: '6 months',
      level: 'advanced',
      category: 'English',
      audience: 'adult',
      landing_category: 'professional',
      rating: 4.8,
      display_order: 4,
      status: 'published',
      thumbnail_url: 'https://picsum.photos/seed/business-english/400/300.jpg'
    },
    {
      id: 'course-5',
      title: 'IELTS Preparation Course',
      description: 'Comprehensive IELTS exam preparation with practice tests',
      price: 12999,
      currency: 'INR',
      duration: '8 weeks',
      level: 'intermediate',
      category: 'English',
      audience: 'adult',
      landing_category: 'exam',
      rating: 4.9,
      display_order: 5,
      status: 'published',
      thumbnail_url: 'https://picsum.photos/seed/ielts/400/300.jpg'
    },
    {
      id: 'course-6',
      title: 'Advanced Mathematics',
      description: 'Calculus, algebra, and statistics for professionals',
      price: 8999,
      currency: 'INR',
      duration: '6 months',
      level: 'advanced',
      category: 'Mathematics',
      audience: 'adult',
      landing_category: 'academic',
      rating: 4.4,
      display_order: 6,
      status: 'published',
      thumbnail_url: 'https://picsum.photos/seed/advanced-math/400/300.jpg'
    }
  ],

  students: [
    {
      id: 'student-1',
      email: 'emma.wilson@email.com',
      full_name: 'Emma Wilson',
      role: 'student',
      phone: '+1234567890',
      country_code: 'US',
      avatar_url: 'https://picsum.photos/seed/emma/100/100.jpg'
    },
    {
      id: 'student-2',
      email: 'raj.patel@email.com',
      full_name: 'Raj Patel',
      role: 'student',
      phone: '+919876543210',
      country_code: 'IN',
      avatar_url: 'https://picsum.photos/seed/raj/100/100.jpg'
    },
    {
      id: 'student-3',
      email: 'sophia.chen@email.com',
      full_name: 'Sophia Chen',
      role: 'student',
      phone: '+8613876543210',
      country_code: 'CN',
      avatar_url: 'https://picsum.photos/seed/sophia/100/100.jpg'
    },
    {
      id: 'student-4',
      email: 'james.brown@email.com',
      full_name: 'James Brown',
      role: 'student',
      phone: '+447912345678',
      country_code: 'GB',
      avatar_url: 'https://picsum.photos/seed/james/100/100.jpg'
    },
    {
      id: 'student-5',
      email: 'maria.garcia@email.com',
      full_name: 'Maria Garcia',
      role: 'student',
      phone: '+34678901234',
      country_code: 'ES',
      avatar_url: 'https://picsum.photos/seed/maria/100/100.jpg'
    }
  ],

  teachers: [
    {
      id: 'teacher-1',
      email: 'sarah.johnson@academy.com',
      full_name: 'Sarah Johnson',
      role: 'teacher',
      phone: '+12025551234',
      country_code: 'US',
      avatar_url: 'https://picsum.photos/seed/sarah/100/100.jpg'
    },
    {
      id: 'teacher-2',
      email: 'david.lee@academy.com',
      full_name: 'David Lee',
      role: 'teacher',
      phone: '+61412345678',
      country_code: 'AU',
      avatar_url: 'https://picsum.photos/seed/david/100/100.jpg'
    },
    {
      id: 'teacher-3',
      email: 'priya.sharma@academy.com',
      full_name: 'Priya Sharma',
      role: 'teacher',
      phone: '+91987654321',
      country_code: 'IN',
      avatar_url: 'https://picsum.photos/seed/priya/100/100.jpg'
    }
  ],

  admin: [
    {
      id: 'admin-1',
      email: 'admin@addify-academy.com',
      full_name: 'System Administrator',
      role: 'admin',
      phone: '+15551234567',
      country_code: 'US',
      avatar_url: 'https://picsum.photos/seed/admin/100/100.jpg'
    }
  ]
};

async function seedData() {
  console.log('🌱 Starting sample data seeding...\n');

  try {
    // 1. Insert Courses
    console.log('📚 Inserting courses...');
    for (const course of sampleData.courses) {
      const { error } = await supabase
        .from('courses')
        .upsert({
          ...course,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      
      if (error) {
        console.error(`❌ Error inserting course ${course.title}:`, error.message);
      } else {
        console.log(`✅ Course inserted: ${course.title}`);
      }
    }

    // 2. Insert Users (Students, Teachers, Admin)
    console.log('\n👥 Inserting users...');
    
    const allUsers = [...sampleData.students, ...sampleData.teachers, ...sampleData.admin];
    
    for (const user of allUsers) {
      // First, create the user in auth
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: user.email,
        email_confirm: true,
        user_metadata: {
          full_name: user.full_name,
          role: user.role,
          phone: user.phone,
          country_code: user.country_code
        }
      });

      if (authError && !authError.message.includes('already registered')) {
        console.error(`❌ Error creating auth user ${user.email}:`, authError.message);
        continue;
      }

      // Then insert/update the profile
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: authData.user?.id || user.id,
          email: user.email,
          full_name: user.full_name,
          role: user.role,
          phone: user.phone,
          country_code: user.country_code,
          avatar_url: user.avatar_url,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (profileError) {
        console.error(`❌ Error inserting profile ${user.full_name}:`, profileError.message);
      } else {
        console.log(`✅ User inserted: ${user.full_name} (${user.role})`);
      }
    }

    // 3. Create Enrollments
    console.log('\n📝 Creating enrollments...');
    const enrollments = [
      { student_id: 'student-1', course_id: 'course-1', progress: 75 },
      { student_id: 'student-1', course_id: 'course-3', progress: 30 },
      { student_id: 'student-2', course_id: 'course-2', progress: 90 },
      { student_id: 'student-2', course_id: 'course-5', progress: 45 },
      { student_id: 'student-3', course_id: 'course-4', progress: 60 },
      { student_id: 'student-4', course_id: 'course-1', progress: 85 },
      { student_id: 'student-5', course_id: 'course-3', progress: 40 },
      { student_id: 'student-5', course_id: 'course-6', progress: 20 }
    ];

    for (const enrollment of enrollments) {
      const { error } = await supabase
        .from('enrollments')
        .upsert({
          id: `enrollment-${enrollment.student_id}-${enrollment.course_id}`,
          student_id: enrollment.student_id,
          course_id: enrollment.course_id,
          status: 'active',
          progress: enrollment.progress,
          enrolled_at: new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date().toISOString()
        });

      if (error) {
        console.error(`❌ Error creating enrollment:`, error.message);
      } else {
        console.log(`✅ Enrollment created for student ${enrollment.student_id} in course ${enrollment.course_id}`);
      }
    }

    // 4. Create Live Sessions
    console.log('\n🎥 Creating live sessions...');
    const sessions = [
      {
        id: 'session-1',
        course_id: 'course-1',
        title: 'Introduction to Phonics',
        description: 'Learning basic English sounds and letters',
        scheduled_at: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        duration_minutes: 60,
        status: 'scheduled',
        zoom_join_url: 'https://zoom.us/j/123456789',
        student_id: 'student-1'
      },
      {
        id: 'session-2',
        course_id: 'course-2',
        title: 'Basic Addition and Subtraction',
        description: 'Fun math games with numbers',
        scheduled_at: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        duration_minutes: 45,
        status: 'scheduled',
        zoom_join_url: 'https://zoom.us/j/234567890',
        student_id: 'student-2'
      },
      {
        id: 'session-3',
        course_id: 'course-4',
        title: 'Business Email Writing',
        description: 'Professional email communication skills',
        scheduled_at: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
        duration_minutes: 60,
        status: 'live',
        zoom_join_url: 'https://zoom.us/j/345678901',
        student_id: 'student-3'
      },
      {
        id: 'session-4',
        course_id: 'course-1',
        title: 'Storytelling Session',
        description: 'Reading and creating simple stories',
        scheduled_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        duration_minutes: 50,
        status: 'completed',
        zoom_join_url: 'https://zoom.us/j/456789012',
        student_id: 'student-1',
        recording_url: 'https://storage.googleapis.com/recordings/session-4.mp4',
        recording_expires_at: new Date(Date.now() + 23 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'session-5',
        course_id: 'course-3',
        title: 'Plant Life Cycle',
        description: 'Understanding how plants grow',
        scheduled_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        duration_minutes: 55,
        status: 'completed',
        zoom_join_url: 'https://zoom.us/j/567890123',
        student_id: 'student-5',
        recording_url: 'https://storage.googleapis.com/recordings/session-5.mp4',
        recording_expires_at: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toISOString()
      }
    ];

    for (const session of sessions) {
      const { error } = await supabase
        .from('live_sessions')
        .upsert({
          ...session,
          zoom_meeting_id: session.zoom_join_url?.split('/').pop(),
          zoom_password: Math.random().toString(36).substring(2, 8),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (error) {
        console.error(`❌ Error creating session ${session.title}:`, error.message);
      } else {
        console.log(`✅ Session created: ${session.title} (${session.status})`);
      }
    }

    // 5. Create Session Ratings
    console.log('\n⭐ Creating session ratings...');
    const ratings = [
      { session_id: 'session-4', student_id: 'student-1', rating: 5, comment: 'Excellent storytelling session! My child loved it.' },
      { session_id: 'session-5', student_id: 'student-5', rating: 4, comment: 'Good explanation of plant life cycle. Visuals were helpful.' }
    ];

    for (const rating of ratings) {
      const { error } = await supabase
        .from('session_ratings')
        .upsert({
          id: `rating-${rating.session_id}-${rating.student_id}`,
          ...rating,
          created_at: new Date().toISOString()
        });

      if (error) {
        console.error(`❌ Error creating rating:`, error.message);
      } else {
        console.log(`✅ Rating created: ${rating.rating} stars`);
      }
    }

    // 6. Create Student Schedules
    console.log('\n📅 Creating student schedules...');
    const schedules = [
      {
        id: 'schedule-1',
        student_id: 'student-1',
        course_id: 'course-1',
        day_of_week: 1, // Monday
        preferred_start_time: '16:00:00',
        preferred_end_time: '17:00:00',
        confirmed_start_time: '16:30:00',
        confirmed_end_time: '17:30:00',
        status: 'confirmed',
        notes: 'Student prefers afternoon sessions'
      },
      {
        id: 'schedule-2',
        student_id: 'student-2',
        course_id: 'course-2',
        day_of_week: 2, // Tuesday
        preferred_start_time: '18:00:00',
        preferred_end_time: '19:00:00',
        confirmed_start_time: '18:30:00',
        confirmed_end_time: '19:30:00',
        status: 'confirmed',
        notes: 'Evening sessions preferred'
      },
      {
        id: 'schedule-3',
        student_id: 'student-1',
        course_id: 'course-2',
        day_of_week: 5, // Friday
        preferred_start_time: '17:00:00',
        preferred_end_time: '18:00:00',
        confirmed_start_time: null,
        confirmed_end_time: null,
        status: 'preferred',
        notes: 'Waiting for confirmation'
      }
    ];

    for (const schedule of schedules) {
      const { error } = await supabase
        .from('student_schedules')
        .upsert({
          ...schedule,
          created_at: new Date().toISOString()
        });

      if (error) {
        console.error(`❌ Error creating schedule:`, error.message);
      } else {
        console.log(`✅ Schedule created: ${schedule.status} for student ${schedule.student_id}`);
      }
    }

    console.log('\n🎉 Sample data seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`   - Courses: ${sampleData.courses.length}`);
    console.log(`   - Students: ${sampleData.students.length}`);
    console.log(`   - Teachers: ${sampleData.teachers.length}`);
    console.log(`   - Live Sessions: ${sessions.length}`);
    console.log(`   - Schedules: ${schedules.length}`);
    console.log(`   - Ratings: ${ratings.length}`);

  } catch (error) {
    console.error('❌ Unexpected error during seeding:', error);
    process.exit(1);
  }
}

// Run the seeding function
seedData().catch(console.error);
