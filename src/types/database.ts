export type UserRole = "student" | "teacher" | "admin";
export type CourseStatus = "draft" | "published" | "archived";
export type EnrollmentStatus = "active" | "completed" | "cancelled";
export type PaymentStatus = "pending" | "completed" | "failed" | "refunded";
export type AttendanceStatus = "present" | "absent" | "late";
export type RemarkType = "feedback" | "remark" | "note";
export type SessionStatus = "scheduled" | "live" | "completed" | "cancelled";
export type ScheduleStatus = "preferred" | "confirmed";
export type AssignmentType = "homework" | "classwork" | "assessment";
export type ReminderStatus = "pending" | "sent" | "acknowledged";
export type CourseAudience = "young" | "adult";
export type CourseLandingCategory =
  | "core"
  | "specialized"
  | "exam"
  | "professional"
  | "academic";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string;
          email: string;
          phone: string | null;
          country_code: string | null;
          avatar_url: string | null;
          role: UserRole;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name: string;
          email: string;
          phone?: string | null;
          country_code?: string | null;
          avatar_url?: string | null;
          role?: UserRole;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string;
          email?: string;
          phone?: string | null;
          country_code?: string | null;
          avatar_url?: string | null;
          role?: UserRole;
          updated_at?: string;
        };
      };
      courses: {
        Row: {
          id: string;
          title: string;
          description: string;
          thumbnail_url: string | null;
          price: number;
          currency: string;
          duration: string | null;
          level: string | null;
          category: string | null;
          audience: CourseAudience | null;
          landing_category: CourseLandingCategory | null;
          rating: number;
          display_order: number;
          status: CourseStatus;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description: string;
          thumbnail_url?: string | null;
          price: number;
          currency?: string;
          duration?: string | null;
          level?: string | null;
          category?: string | null;
          audience?: CourseAudience | null;
          landing_category?: CourseLandingCategory | null;
          rating?: number;
          display_order?: number;
          status?: CourseStatus;
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          title?: string;
          description?: string;
          thumbnail_url?: string | null;
          price?: number;
          currency?: string;
          duration?: string | null;
          level?: string | null;
          category?: string | null;
          audience?: CourseAudience | null;
          landing_category?: CourseLandingCategory | null;
          rating?: number;
          display_order?: number;
          status?: CourseStatus;
          updated_at?: string;
        };
      };
      course_teachers: {
        Row: {
          id: string;
          course_id: string;
          teacher_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          course_id: string;
          teacher_id: string;
          created_at?: string;
        };
        Update: {
          course_id?: string;
          teacher_id?: string;
        };
      };
      enrollments: {
        Row: {
          id: string;
          student_id: string;
          course_id: string;
          status: EnrollmentStatus;
          progress: number;
          enrolled_at: string;
          completed_at: string | null;
        };
        Insert: {
          id?: string;
          student_id: string;
          course_id: string;
          status?: EnrollmentStatus;
          progress?: number;
          enrolled_at?: string;
          completed_at?: string | null;
        };
        Update: {
          status?: EnrollmentStatus;
          progress?: number;
          completed_at?: string | null;
        };
      };
      payments: {
        Row: {
          id: string;
          student_id: string;
          course_id: string;
          amount: number;
          currency: string;
          payment_method: string | null;
          stripe_payment_id: string | null;
          payment_provider: string | null;
          provider_order_id: string | null;
          provider_payment_id: string | null;
          provider_signature: string | null;
          status: PaymentStatus;
          paid_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          student_id: string;
          course_id: string;
          amount: number;
          currency?: string;
          payment_method?: string | null;
          stripe_payment_id?: string | null;
          payment_provider?: string | null;
          provider_order_id?: string | null;
          provider_payment_id?: string | null;
          provider_signature?: string | null;
          status?: PaymentStatus;
          paid_at?: string | null;
          created_at?: string;
        };
        Update: {
          status?: PaymentStatus;
          stripe_payment_id?: string | null;
          payment_provider?: string | null;
          provider_order_id?: string | null;
          provider_payment_id?: string | null;
          provider_signature?: string | null;
          paid_at?: string | null;
        };
      };
      assignments: {
        Row: {
          id: string;
          course_id: string;
          teacher_id: string;
          title: string;
          description: string;
          due_date: string | null;
          type: AssignmentType;
          parent_assignment_id: string | null;
          file_urls: Record<string, unknown>[];
          allowed_file_types: string[];
          created_at: string;
        };
        Insert: {
          id?: string;
          course_id: string;
          teacher_id: string;
          title: string;
          description: string;
          due_date?: string | null;
          type?: AssignmentType;
          parent_assignment_id?: string | null;
          file_urls?: Record<string, unknown>[];
          allowed_file_types?: string[];
          created_at?: string;
        };
        Update: {
          title?: string;
          description?: string;
          due_date?: string | null;
          type?: AssignmentType;
          parent_assignment_id?: string | null;
          file_urls?: Record<string, unknown>[];
          allowed_file_types?: string[];
        };
      };
      assignment_submissions: {
        Row: {
          id: string;
          assignment_id: string;
          student_id: string;
          content: string | null;
          file_url: string | null;
          file_urls: Record<string, unknown>[];
          file_type: string | null;
          grade: string | null;
          feedback: string | null;
          submitted_at: string;
          graded_at: string | null;
        };
        Insert: {
          id?: string;
          assignment_id: string;
          student_id: string;
          content?: string | null;
          file_url?: string | null;
          file_urls?: Record<string, unknown>[];
          file_type?: string | null;
          grade?: string | null;
          feedback?: string | null;
          submitted_at?: string;
          graded_at?: string | null;
        };
        Update: {
          content?: string | null;
          file_url?: string | null;
          file_urls?: Record<string, unknown>[];
          file_type?: string | null;
          grade?: string | null;
          feedback?: string | null;
          graded_at?: string | null;
        };
      };
      attendance: {
        Row: {
          id: string;
          course_id: string;
          student_id: string;
          teacher_id: string;
          date: string;
          status: AttendanceStatus;
          created_at: string;
        };
        Insert: {
          id?: string;
          course_id: string;
          student_id: string;
          teacher_id: string;
          date: string;
          status: AttendanceStatus;
          created_at?: string;
        };
        Update: {
          status?: AttendanceStatus;
        };
      };
      remarks: {
        Row: {
          id: string;
          student_id: string;
          teacher_id: string;
          course_id: string;
          content: string;
          type: RemarkType;
          created_at: string;
        };
        Insert: {
          id?: string;
          student_id: string;
          teacher_id: string;
          course_id: string;
          content: string;
          type?: RemarkType;
          created_at?: string;
        };
        Update: {
          content?: string;
          type?: RemarkType;
        };
      };
      live_sessions: {
        Row: {
          id: string;
          course_id: string;
          teacher_id: string;
          student_id: string | null;
          title: string;
          zoom_meeting_id: string | null;
          zoom_join_url: string | null;
          zoom_start_url: string | null;
          recording_url: string | null;
          recording_expires_at: string | null;
          scheduled_at: string;
          duration_minutes: number;
          status: SessionStatus;
          created_at: string;
        };
        Insert: {
          id?: string;
          course_id: string;
          teacher_id: string;
          student_id?: string | null;
          title: string;
          zoom_meeting_id?: string | null;
          zoom_join_url?: string | null;
          zoom_start_url?: string | null;
          recording_url?: string | null;
          recording_expires_at?: string | null;
          scheduled_at: string;
          duration_minutes?: number;
          status?: SessionStatus;
          created_at?: string;
        };
        Update: {
          title?: string;
          student_id?: string | null;
          zoom_meeting_id?: string | null;
          zoom_join_url?: string | null;
          zoom_start_url?: string | null;
          recording_url?: string | null;
          recording_expires_at?: string | null;
          scheduled_at?: string;
          duration_minutes?: number;
          status?: SessionStatus;
        };
      };
      learning_materials: {
        Row: {
          id: string;
          course_id: string;
          teacher_id: string;
          title: string;
          description: string | null;
          file_url: string;
          file_type: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          course_id: string;
          teacher_id: string;
          title: string;
          description?: string | null;
          file_url: string;
          file_type?: string | null;
          created_at?: string;
        };
        Update: {
          title?: string;
          description?: string | null;
          file_url?: string;
          file_type?: string | null;
        };
      };
      student_schedules: {
        Row: {
          id: string;
          student_id: string;
          course_id: string;
          day_of_week: number;
          preferred_start_time: string;
          preferred_end_time: string;
          confirmed_start_time: string | null;
          confirmed_end_time: string | null;
          status: ScheduleStatus;
          confirmed_by: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          student_id: string;
          course_id: string;
          day_of_week: number;
          preferred_start_time: string;
          preferred_end_time: string;
          confirmed_start_time?: string | null;
          confirmed_end_time?: string | null;
          status?: ScheduleStatus;
          confirmed_by?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          day_of_week?: number;
          preferred_start_time?: string;
          preferred_end_time?: string;
          confirmed_start_time?: string | null;
          confirmed_end_time?: string | null;
          status?: ScheduleStatus;
          confirmed_by?: string | null;
          notes?: string | null;
        };
      };
      session_ratings: {
        Row: {
          id: string;
          session_id: string;
          student_id: string;
          rating: number;
          comment: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          session_id: string;
          student_id: string;
          rating: number;
          comment?: string | null;
          created_at?: string;
        };
        Update: {
          rating?: number;
          comment?: string | null;
        };
      };
      payment_reminders: {
        Row: {
          id: string;
          student_id: string;
          course_id: string;
          payment_id: string | null;
          reminder_type: string;
          next_due_date: string | null;
          sent_at: string | null;
          status: ReminderStatus;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          student_id: string;
          course_id: string;
          payment_id?: string | null;
          reminder_type?: string;
          next_due_date?: string | null;
          sent_at?: string | null;
          status?: ReminderStatus;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          reminder_type?: string;
          next_due_date?: string | null;
          sent_at?: string | null;
          status?: ReminderStatus;
          notes?: string | null;
        };
      };
      course_materials: {
        Row: {
          id: string;
          course_id: string;
          uploaded_by: string;
          title: string;
          description: string | null;
          file_url: string;
          file_type: string | null;
          file_size: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          course_id: string;
          uploaded_by: string;
          title: string;
          description?: string | null;
          file_url: string;
          file_type?: string | null;
          file_size?: number | null;
          created_at?: string;
        };
        Update: {
          title?: string;
          description?: string | null;
          file_url?: string;
          file_type?: string | null;
          file_size?: number | null;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      user_role: UserRole;
      course_status: CourseStatus;
      enrollment_status: EnrollmentStatus;
      payment_status: PaymentStatus;
      attendance_status: AttendanceStatus;
      remark_type: RemarkType;
      session_status: SessionStatus;
      schedule_status: ScheduleStatus;
      assignment_type: AssignmentType;
      reminder_status: ReminderStatus;
    };
  };
}

// Helper types for easier usage
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Course = Database["public"]["Tables"]["courses"]["Row"];
export type CourseTeacher = Database["public"]["Tables"]["course_teachers"]["Row"];
export type Enrollment = Database["public"]["Tables"]["enrollments"]["Row"];
export type Payment = Database["public"]["Tables"]["payments"]["Row"];
export type Assignment = Database["public"]["Tables"]["assignments"]["Row"];
export type AssignmentSubmission = Database["public"]["Tables"]["assignment_submissions"]["Row"];
export type Attendance = Database["public"]["Tables"]["attendance"]["Row"];
export type Remark = Database["public"]["Tables"]["remarks"]["Row"];
export type LiveSession = Database["public"]["Tables"]["live_sessions"]["Row"];
export type LearningMaterial = Database["public"]["Tables"]["learning_materials"]["Row"];
export type StudentSchedule = Database["public"]["Tables"]["student_schedules"]["Row"];
export type SessionRating = Database["public"]["Tables"]["session_ratings"]["Row"];
export type PaymentReminder = Database["public"]["Tables"]["payment_reminders"]["Row"];
export type CourseMaterial = Database["public"]["Tables"]["course_materials"]["Row"];
