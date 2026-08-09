export interface WeekBucket {
  /** Monday (YYYY-MM-DD) of the week */
  weekStart: string;
  count: number;
}

export interface GoalAdherence {
  applicable: number;
  met: number;
  /** Fraction 0..1, or null when there are no applicable weeks */
  percentage: number | null;
}

export interface GoalWeekRange {
  from: string;
  to: string;
}

const DAY_IN_MS = 86_400_000;
const DAYS_IN_WEEK = 7;

/**
 * Calendar-date helpers that operate purely on "YYYY-MM-DD" strings.
 * Activity completion dates are stored client-local calendar dates, so all
 * week math is anchored to those strings (and the client's local `today`)
 * rather than any server timezone.
 */

function toDayNumber(dateStr: string): number {
  const [year, month, day] = dateStr.split('-').map(Number);
  return Math.floor(Date.UTC(year, month - 1, day) / DAY_IN_MS);
}

function fromDayNumber(dayNumber: number): string {
  const date = new Date(dayNumber * DAY_IN_MS);
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function addDays(dateStr: string, days: number): string {
  return fromDayNumber(toDayNumber(dateStr) + days);
}

/**
 * Returns the Monday (YYYY-MM-DD) of the week containing the given date.
 * Weeks run Monday -> Sunday.
 */
export function getWeekStartMonday(dateStr: string): string {
  const dayNumber = toDayNumber(dateStr);
  // 1970-01-05 is a Monday (day number 4), so 0 => Monday, 6 => Sunday.
  const daysSinceMonday =
    (((dayNumber - 4) % DAYS_IN_WEEK) + DAYS_IN_WEEK) % DAYS_IN_WEEK;
  return fromDayNumber(dayNumber - daysSinceMonday);
}

/**
 * Returns the Mon-Sun range for the current week relative to `today`.
 */
export function getGoalWeekRange(today: string): GoalWeekRange {
  const weekStart = getWeekStartMonday(today);
  return { from: weekStart, to: addDays(weekStart, DAYS_IN_WEEK - 1) };
}

/**
 * Returns the Monday week-start of each of the last `weekCount` weeks,
 * ending on the current (possibly partial) week.
 */
export function getLastNWeekStarts(weekCount: number, today: string): string[] {
  const currentWeekStart = toDayNumber(getWeekStartMonday(today));
  const weekStarts: string[] = [];
  for (let i = weekCount - 1; i >= 0; i--) {
    weekStarts.push(fromDayNumber(currentWeekStart - i * DAYS_IN_WEEK));
  }
  return weekStarts;
}

/**
 * Counts completions per Monday-Sunday week.
 * The current week's end is capped at `today`, so the current partial week
 * only counts completions logged so far.
 */
export function getWeeklyCounts(
  eventDates: string[],
  weekStarts: string[],
  today: string,
): WeekBucket[] {
  const todayDayNumber = toDayNumber(today);

  return weekStarts.map((weekStart) => {
    const startDay = toDayNumber(weekStart);
    let endDay = startDay + DAYS_IN_WEEK - 1;
    if (endDay > todayDayNumber) {
      endDay = todayDayNumber;
    }

    let count = 0;
    for (const date of eventDates) {
      const day = toDayNumber(date);
      if (day >= startDay && day <= endDay) {
        count += 1;
      }
    }

    return { weekStart, count };
  });
}

/** Number of times the activity was completed during the current week. */
export function getCurrentWeekCount(
  eventDates: string[],
  today: string,
): number {
  const currentWeekStart = getWeekStartMonday(today);
  return getWeeklyCounts(eventDates, [currentWeekStart], today)[0].count;
}

/**
 * Monday of the week containing the activity's first completion,
 * or null if it has never been completed.
 */
export function getFirstCompletionWeek(eventDates: string[]): string | null {
  if (eventDates.length === 0) {
    return null;
  }
  const earliest = eventDates.reduce((a, b) => (a < b ? a : b));
  return getWeekStartMonday(earliest);
}

/**
 * Keeps only weeks from the activity's relevant history onward.
 * Weeks before the first completion are excluded (not treated as missed).
 */
export function filterApplicableWeeks(
  buckets: WeekBucket[],
  eventDates: string[],
): WeekBucket[] {
  const firstCompletionWeek = getFirstCompletionWeek(eventDates);
  if (firstCompletionWeek === null) {
    return [];
  }
  return buckets.filter((bucket) => bucket.weekStart >= firstCompletionWeek);
}

/**
 * Adherence = met / applicable weeks.
 * The current partial week is included. Returns percentage null (never a
 * misleading value) when there are no applicable weeks.
 */
export function computeAdherence(
  buckets: WeekBucket[],
  targetPerWeek: number,
): GoalAdherence {
  const applicable = buckets.length;
  if (applicable === 0) {
    return { applicable: 0, met: 0, percentage: null };
  }

  let met = 0;
  for (const bucket of buckets) {
    if (bucket.count >= targetPerWeek) {
      met += 1;
    }
  }

  return { applicable, met, percentage: met / applicable };
}

/**
 * Weekly buckets covering the previous ~6 months (26 weeks), including the
 * current partial week, excluding weeks before the activity's relevant history.
 * Returns [] when the activity has no completion history.
 */
export function computeHeatmapWeeks(
  eventDates: string[],
  today: string,
  weeksBack = 26,
): WeekBucket[] {
  const firstCompletionWeek = getFirstCompletionWeek(eventDates);
  if (firstCompletionWeek === null) {
    return [];
  }

  const weekStarts = getLastNWeekStarts(weeksBack, today);
  return getWeeklyCounts(eventDates, weekStarts, today).filter(
    (bucket) => bucket.weekStart >= firstCompletionWeek,
  );
}
