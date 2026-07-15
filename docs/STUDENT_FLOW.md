# Student Flow — Addify Academy

Reflects `main` as of 2026-07-15 (through `ff6c1d7`).

## 1. Getting enrolled
- Done entirely by admin — no self-enroll button anymore. Nothing for the student to do here.

## 2. Working through the course
- Course page auto-detects the "current module": the first module (in order) that still has an incomplete lesson. Everything before it is unlocked; once everything's done, it shows the last module.
- Inside a lesson: video/content, attached documents (view-only, can be multiple now), and any homework attached directly to that lesson shows up inline — not buried only in the separate Assignments tab.

## 3. Live sessions
- `/dashboard/student/live-classes` — Join button appears only within a short window before the scheduled start time.
- Now shows *all* upcoming/past sessions regardless of date — previously a bug only surfaced sessions scheduled for "today," so anything admin-batch-created for a later day was invisible until its day arrived.

## 4. Homework
- Submit via `/dashboard/student/assignments` — text and/or files, restricted to the assignment's allowed file types.
- Grade + feedback show up once a teacher/admin grades it.

## 5. Progress
- Tracked via enrollment progress %, per-lesson completion (set by teacher, not self-reported), attendance, and remarks — all read-only on the student side.
