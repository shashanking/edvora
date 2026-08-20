/**
 * Current-week helpers.
 *
 * Classes at Edvora are scheduled on a weekly recurring pattern (see
 * `student_schedules` — day_of_week + confirmed times), so "this week" is the
 * unit teachers and students actually think in. The portal used to render
 * every session / assignment / material ever created in one flat list, which
 * buried what was happening now.
 *
 * Weeks run Monday 00:00 -> Sunday 23:59:59.999 in the viewer's local time.
 * Local, not UTC: a Monday 09:00 IST class must count as Monday's class for a
 * user in IST, and comparing against UTC boundaries would shift it.
 */

export interface WeekRange {
  /** Monday 00:00:00.000 local */
  start: Date;
  /** Sunday 23:59:59.999 local */
  end: Date;
}

/** The Monday-to-Sunday week containing `reference` (default: now). */
export function getWeekRange(reference: Date = new Date()): WeekRange {
  const start = new Date(reference);
  // getDay(): 0=Sun..6=Sat. Sunday belongs to the week that began 6 days ago.
  const daysSinceMonday = (start.getDay() + 6) % 7;
  start.setDate(start.getDate() - daysSinceMonday);
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  end.setHours(23, 59, 59, 999);

  return { start, end };
}

/** True when `value` (ISO string or Date) falls inside `range`. */
export function isInWeek(
  value: string | Date | null | undefined,
  range: WeekRange
): boolean {
  if (!value) return false;
  const time = (value instanceof Date ? value : new Date(value)).getTime();
  if (Number.isNaN(time)) return false;
  return time >= range.start.getTime() && time <= range.end.getTime();
}

/** True when `value` falls inside the week containing now. */
export function isThisWeek(value: string | Date | null | undefined): boolean {
  return isInWeek(value, getWeekRange());
}

/** Short human label for a week, e.g. "18 – 24 Aug". */
export function formatWeekRange(range: WeekRange = getWeekRange()): string {
  const day = (d: Date) => d.getDate();
  const month = (d: Date) =>
    d.toLocaleDateString(undefined, { month: "short" });

  return month(range.start) === month(range.end)
    ? `${day(range.start)} – ${day(range.end)} ${month(range.end)}`
    : `${day(range.start)} ${month(range.start)} – ${day(range.end)} ${month(range.end)}`;
}
