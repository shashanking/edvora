# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start dev server
npm run build        # Production build
npm run lint         # ESLint (flat config, Next.js + TypeScript)
npm start            # Start production server
```

No test framework is configured.

## Architecture

**Addify Academy** — An LMS (Learning Management System) built with Next.js 16 (App Router), Supabase, Sanity CMS, Razorpay, and Zoom.

### Stack

- **Next.js 16** with App Router, React 19, TypeScript 5
- **Supabase** for database (Postgres + RLS), auth (cookie-based SSR sessions via `@supabase/ssr`), and file storage
- **Sanity CMS** for landing page content (hero, FAQ, testimonials, blog, etc.) — studio at `/studio`
- **Razorpay** for payment processing
- **Zoom** (Server-to-Server OAuth) for live classes and recordings
- **EmailJS** for transactional emails
- **Tailwind CSS v4** with PostCSS

### Key Directories

- `src/app/(auth)/` — Auth pages (login, register, password reset)
- `src/app/dashboard/{admin,teacher,student}/` — Role-based dashboards
- `src/app/api/` — API routes: Sanity content fetchers, payments, Zoom, recordings, contact
- `src/lib/supabase/` — Supabase clients (browser `client.ts`, server `server.ts`, `middleware.ts`)
- `src/lib/` — Integration wrappers: `razorpay.ts`, `zoom.ts`, `emailjs.ts`, `sanityClient.ts`
- `src/types/database.ts` — Generated Supabase types (Database schema, table types, enums)
- `sanity/schemaTypes/` — Sanity document schemas (16 types)

### Auth & Middleware

Middleware (`src/middleware.ts`) runs on every request:
- Refreshes Supabase session cookies
- Enforces role-based access: `/dashboard/admin/*` requires admin role, `/dashboard/teacher/*` requires teacher, `/dashboard/student/*` requires student
- Redirects authenticated users from public auth pages to their role-appropriate dashboard
- Public routes are whitelisted (/, /login, /register, /studio, etc.)

### Three-Role System

- **Admin**: Manages courses, enrollments, teachers, students, payments, schedules, reports, settings
- **Teacher**: Manages assignments, attendance, live classes (Zoom), materials, remarks, student views
- **Student**: Views courses, submits assignments, checks attendance/schedule, makes payments, views materials/remarks

### Database

Supabase Postgres with types in `src/types/database.ts`. Key tables: `profiles`, `courses`, `enrollments`, `payments`, `assignments`, `assignment_submissions`, `attendance`, `live_sessions`, `course_materials`, `remarks`, `student_schedules`. Enums: `UserRole`, `CourseStatus`, `EnrollmentStatus`, `PaymentStatus`, `AttendanceStatus`, `SessionStatus`.

### Dual Content System

- **Sanity CMS** powers all landing/marketing pages — API routes in `src/app/api/` fetch from Sanity
- **Supabase** powers all LMS data (courses, enrollments, users, etc.)

### Environment Variables

Public: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_SANITY_PROJECT_ID`, `NEXT_PUBLIC_SANITY_DATASET`, `NEXT_PUBLIC_EMAILJS_SERVICE_ID`, `NEXT_PUBLIC_EMAILJS_TEMPLATE_ID`, `NEXT_PUBLIC_EMAILJS_PUBLIC_KEY`

Server-only: `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `ZOOM_ACCOUNT_ID`, `ZOOM_CLIENT_ID`, `ZOOM_CLIENT_SECRET`

### Path Alias

`@/*` maps to project root (e.g., `@/src/lib/supabase/client`).
