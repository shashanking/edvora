// Shared "relative deadline" math for assignments — see migration 013.
//
// Assignments no longer carry a single fixed calendar due_date shared by
// every student (that column is still on the table, just unused). Instead
// `assignments.duration_days` holds "submit within N days of starting",
// and every screen (admin/teacher/student) computes each student's own
// effective due date from their own start reference:
//   - session-linked assignments -> that student's live_sessions.scheduled_at
//   - lesson-linked assignments   -> that student's enrollments.enrolled_at
// See the migration file for why those two references were chosen.
//
// `duration_days == null` means "no deadline" (same as null due_date did
// under the old model) — every function here treats that as "not
// applicable" rather than throwing.

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * A student's actual due date = their start reference + duration_days.
 * Returns null when there's nothing to compute from (no start reference,
 * or an open-ended assignment with no duration set).
 */
export function computeEffectiveDueDate(
  startReference: string | null | undefined,
  durationDays: number | null | undefined
): string | null {
  if (!startReference || durationDays === null || durationDays === undefined) return null;
  const start = new Date(startReference).getTime();
  if (Number.isNaN(start)) return null;
  return new Date(start + durationDays * MS_PER_DAY).toISOString();
}

/**
 * Whole days remaining until `dueDateIso`, rounded up (so "due in 6 hours"
 * reads as 1 day left, not 0). Negative once overdue. Null if there's no
 * due date to compare against.
 */
export function daysRemaining(dueDateIso: string | null | undefined, now: Date = new Date()): number | null {
  if (!dueDateIso) return null;
  const diff = new Date(dueDateIso).getTime() - now.getTime();
  return Math.ceil(diff / MS_PER_DAY);
}

export function isPastDue(dueDateIso: string | null | undefined, now: Date = new Date()): boolean {
  if (!dueDateIso) return false;
  return new Date(dueDateIso).getTime() < now.getTime();
}

export function isDueSoon(
  dueDateIso: string | null | undefined,
  thresholdDays = 3,
  now: Date = new Date()
): boolean {
  if (!dueDateIso) return false;
  const diff = new Date(dueDateIso).getTime() - now.getTime();
  return diff > 0 && diff < thresholdDays * MS_PER_DAY;
}

/** Compact "Due in 3 days" / "Due today" / "3 days overdue" label. */
export function formatDueInWords(dueDateIso: string | null | undefined, now: Date = new Date()): string | null {
  const days = daysRemaining(dueDateIso, now);
  if (days === null) return null;
  if (days > 1) return `Due in ${days} days`;
  if (days === 1) return "Due tomorrow";
  if (days === 0) return "Due today";
  if (days === -1) return "1 day overdue";
  return `${Math.abs(days)} days overdue`;
}

/**
 * How a submission landed relative to the student's effective deadline.
 * Returns null when there's no deadline to judge against — callers should
 * just show a plain "Submitted" state with no on-time/late badge then.
 */
export function submissionTimeliness(
  dueDateIso: string | null | undefined,
  submittedAtIso: string
): { onTime: boolean; daysLate: number } | null {
  if (!dueDateIso) return null;
  const due = new Date(dueDateIso).getTime();
  const submitted = new Date(submittedAtIso).getTime();
  if (submitted <= due) return { onTime: true, daysLate: 0 };
  return { onTime: false, daysLate: Math.ceil((submitted - due) / MS_PER_DAY) };
}
