# Admin & Student Course Flows

Reflects current `main` as of 2026-07-15 (commits through `ff6c1d7`).

## Roles
- **admin** — full control: courses, content, enrollment, sessions, homework, grading.
- **teacher** — scoped to their assigned enrollments: marks lesson completion, runs sessions, grades homework.
- **student** — no self-serve enrollment; consumes content, joins sessions, submits homework.

---

## Admin Flow

**1. Build the course**
- Create course (`draft → published → archived`) at `/dashboard/admin/courses/create`.
- Manage Content page (`[id]/content`) — add modules → lessons (ordered via `display_order`).
- Attach lesson documents: direct upload (50MB cap) or pick from the shared Materials library. Multiple docs per lesson supported (each lesson_document row is a direct upload XOR a materials link, never both).
- Optionally attach homework/classwork/assessment directly to a lesson while editing it — this closed the "admin homework gap" (previously only teachers could create assignments, and only tied to a session, not a lesson).

**2. Enroll a student**
- `/dashboard/admin/enrollments` — pick student + course + teacher, set weekly schedule (auto-checks for teacher schedule overlaps).
- Can pick a starting module other than Module 1 — prior modules get auto-marked complete for that student (admin can't write another user's progress directly under RLS, so this goes through a service-role endpoint).
- Live sessions get batch-created in Zoom, capped to the actual lesson count so you never end up with orphan sessions; if a batch partially fails it's surfaced instead of silently swallowed.
- Students no longer self-enroll — this is 100% an admin action now.

**3. During the course**
- Review and grade homework submissions (grade + written feedback).
- Lesson completion is teacher/admin-only — students can't self-mark lessons done anymore (prevents skipping ahead without doing the work). Teacher marks it via their dashboard; enforced server-side too.

---

## Student Flow

**1. Get enrolled** — admin does this; no action needed from the student, no "Enroll" button anymore.

**2. Work through the course**
- Course page auto-detects the "current module": the first module (in order) with an incomplete lesson. Everything before it is unlocked; once everything's done it falls back to showing the last module.
- Inside a lesson: video/content, attached documents (view-only), and any homework attached directly to that lesson shows up inline (not just buried in a separate Assignments tab).

**3. Live sessions**
- `/dashboard/student/live-classes` — Join button only appears within a short window before the scheduled start time.
- Students now see *all* their upcoming/past sessions regardless of date (previously a bug only showed sessions scheduled for "today," so anything admin-batch-created for later days was invisible until its day arrived).

**4. Homework**
- Submit via `/dashboard/student/assignments` — text/file per the assignment's allowed file types.
- See grade + feedback once a teacher/admin grades it.

**5. Progress**
- Tracked via enrollment progress %, per-lesson completion (teacher-set), attendance, and remarks — all read-only from the student's side.

---

## Key Constraints
- Upload limit: 50MB/file, same for lesson docs and materials.
- A lesson can have unlimited attached documents.
- Lesson completion authority sits with teacher/admin only, enforced at both UI and API level.
- Session-scheduling migrations and the doc-backfill migration are guarded to be idempotent (safe to re-run in the SQL editor) since this repo applies migrations manually, not via a runner.
