# Admin Flow — Addify Academy

Reflects `main` as of 2026-07-15 (through `ff6c1d7`).

## 1. Build the course
- Create course at `/dashboard/admin/courses/create` — status moves `draft → published → archived`.
- Manage Content (`[id]/content`): add modules → lessons, ordered.
- Attach documents to a lesson — direct upload (50MB cap) or pick from the shared Materials library. Unlimited docs per lesson now (was capped at 1).
- Attach homework/classwork/assessment directly to a lesson while editing it. This closes the old gap where only teachers could create assignments, and only against a session (not a lesson) — admin now has a proper UI for it.

## 2. Enroll a student
- `/dashboard/admin/enrollments` — pick student + course + teacher, set weekly schedule.
- Overlap check runs automatically against the teacher's existing schedule.
- Can start a student from a module other than Module 1 — everything before that module gets auto-marked complete for them.
- Zoom sessions batch-create automatically, capped to the real lesson count (no orphan sessions). Partial batch failures are surfaced, not swallowed silently.
- Students can no longer self-enroll — enrollment is admin-only now.

## 3. During the course
- Review and grade homework submissions (grade + written feedback).
- Mark lesson completion — this moved from student to teacher/admin-only, so students can't self-report progress and skip ahead. Enforced both in the UI and at the API layer.

## Constraints to know
- Upload cap: 50MB/file.
- A lesson can carry unlimited attached documents (each is either a direct upload or a Materials link, never both).
- Migrations in this repo are applied manually via the SQL editor, so recent ones are written idempotent (safe to paste twice).
