/**
 * GitHub contribution-calendar maths, shared.
 *
 * These helpers used to live inside `app/components/GitHubContributions.tsx`,
 * which is v2's and v3's copy of one calendar. v5 draws a second one, in a
 * different shape, and the two of them disagreed by exactly the amount that
 * duplicate calendar code always drifts by - so the arithmetic moved here and
 * both import it.
 *
 * Nothing here knows how a calendar looks. These functions answer three questions
 * and return plain data:
 *
 *   - which days does this window cover, padded to whole weeks
 *   - which week column carries a month label
 *   - what does a day total add up to
 */

/** GitHub's rolling window is 53 weeks; a calendar year needs 53 or 54. */
export const WEEKS = 53;

export interface ContributionPoint {
  date: string;
  count: number;
  level: number;
}

/**
 * Minimum columns between two month labels.
 *
 * A month boundary can fall one or two columns after another, and the labels are
 * three-letter abbreviations sitting over 10px columns - close enough that they
 * overlap into an unreadable pair. Three is the smallest gap that clears a
 * "Sep" at the size the labels render.
 */
export const MIN_LABEL_GAP = 3;

const CURRENT_YEAR = new Date().getUTCFullYear();

/**
 * The period filter's options.
 *
 * `null` is GitHub's rolling last-12-months window, which is the default. The
 * calendar years come after it in descending order.
 *
 * The sparse years are kept on purpose: this account has 17 active days in 2023
 * and 4 in 2024, against 165 in 2025. Filtering those out would misrepresent the
 * history rather than tidy it.
 */
export const YEAR_OPTIONS: Array<number | null> = [
  null,
  ...Array.from({ length: 4 }, (_, index) => CURRENT_YEAR - index),
];

export function toDateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

/**
 * Builds the day cells the grid renders, padded out to whole weeks so every
 * column is seven days and the shape stays rectangular.
 *
 * Two windows, because "last 12 months" and "2023" are different questions.
 *
 * Rolling (`year === null`): 53 weeks ending on the last day the feed reported.
 * The feed ends on today's weekday, so a fixed 371 would append up to three
 * future days at the right edge - hence deriving the length from the real
 * window rather than assuming it.
 *
 * Calendar year: the whole of Jan 1 to Dec 31, from the Sunday on or before
 * January 1. Anchored on the last point in the payload, a 2023 request used to
 * render 2022-12-31 through 2023-12-27: a week of December 2022 sitting under a
 * "2023" filter, and the last four days of the year dropped off the right edge
 * entirely. The figure under the calendar was right (it comes from the API) and
 * the picture next to it was not.
 *
 * The final week is padded forward to Sunday, so a year view can end on up to six
 * days of January that follow it. GitHub's own year view does the same, and those
 * cells carry no contributions - they read as the trailing gap of the last column
 * rather than as data.
 */
export function buildContributionDays(
  points: ContributionPoint[],
  year: number | null,
) {
  if (points.length === 0) return [];

  const sortedPoints = [...points].sort((a, b) => a.date.localeCompare(b.date));
  const latestPoint = sortedPoints[sortedPoints.length - 1];
  const pointsByDate = new Map(sortedPoints.map((point) => [point.date, point]));

  /*
    All UTC. Taking the weekday from a local-time Date with `getDay()` but writing
    the key with `toISOString()` puts every key a day behind the weekday that
    positioned it east of UTC, and the last column falls off the end of the year.
  */
  let start: Date;
  let totalDays: number;

  if (year === null) {
    const latestDate = new Date(`${latestPoint.date}T00:00:00Z`);
    start = new Date(latestDate);
    start.setUTCDate(
      start.getUTCDate() - (latestDate.getUTCDay() + (WEEKS - 1) * 7),
    );

    /*
      Rounded up to whole weeks, like the calendar-year branch below. Deriving the
      count as `latest - start + 1` only ever landed on a multiple of seven when
      the feed happened to end on a Saturday: `getUTCDay() + 365` is 367 for a
      feed ending mid-week, and 367 is 52 weeks plus three days, so the 53rd
      column rendered three cells and four empty rows - which reads as a broken
      final column rather than as the trailing gap it is.
    */
    const spanDays = Math.round(
      (latestDate.getTime() - start.getTime()) / 86400000,
    );
    totalDays = (Math.floor(spanDays / 7) + 1) * 7;
  } else {
    const yearStart = new Date(Date.UTC(year, 0, 1));
    const yearEnd = new Date(Date.UTC(year, 11, 31));
    start = new Date(yearStart);
    start.setUTCDate(start.getUTCDate() - yearStart.getUTCDay());

    /*
      `floor(span / 7) + 1`, not `ceil(span / 7) + 1`.

      The count is "how many week boundaries does this span cross, counting the one
      it starts on". A year that begins and ends mid-week is 53 columns; the two
      agree whenever Dec 31 lands exactly on the Sunday the grid started on and
      disagree by a whole column otherwise, which is most years - 2024 came out at
      54 columns and 2025 at 54.
    */
    const spanDays = Math.round(
      (yearEnd.getTime() - start.getTime()) / 86400000,
    );
    totalDays = (Math.floor(spanDays / 7) + 1) * 7;
  }

  return Array.from({ length: totalDays }, (_, index) => {
    const date = new Date(start);
    date.setUTCDate(start.getUTCDate() + index);
    const dateKey = toDateKey(date);
    return (
      pointsByDate.get(dateKey) ?? {
        date: dateKey,
        count: 0,
        level: 0,
      }
    );
  });
}

/** Splits a flat day list into week columns of seven. */
export function groupIntoWeeks(days: ContributionPoint[]) {
  const result: ContributionPoint[][] = [];
  for (let index = 0; index < days.length; index += 7) {
    result.push(days.slice(index, index + 7));
  }
  return result;
}

/**
 * Month labels, one per week column, or `null` for a column that is not a
 * labelled month.
 *
 * Four rules, in order:
 *
 *   1. Label only where a month actually begins - the week whose first day falls
 *      in a different month to the previous week's first day.
 *   2. Never label within `MIN_LABEL_GAP` columns of the previous label.
 *   3. Never use the same month name twice in one grid. A 53-week window that
 *      opens mid-October runs to the following October, so both ends are month
 *      boundaries and the first and last columns both want to say "Oct". They are
 *      51 columns apart, so the gap rule does not touch them - they are not
 *      adjacent, just redundant, and the second one reads as a stray label at the
 *      right edge. The first occurrence wins.
 *   4. Column 0 and the first visible column are always candidates, so the left
 *      edge of the field is never unlabelled.
 */
export function buildMonthLabels(
  weeks: ContributionPoint[][],
  visibleWeekCount = weeks.length,
) {
  const result: Array<string | null> = [];
  const used = new Set<string>();
  let lastLabelled = -Infinity;

  weeks.forEach((week, index) => {
    const firstDay = week[0];
    if (!firstDay) {
      result.push(null);
      return;
    }

    const previous = weeks[index - 1]?.[0];
    const startsMonth =
      index === 0 ||
      !previous ||
      previous.date.slice(0, 7) !== firstDay.date.slice(0, 7);
    const isFirstVisible = index === weeks.length - visibleWeekCount;

    if (!startsMonth && !isFirstVisible) {
      result.push(null);
      return;
    }
    if (index - lastLabelled < MIN_LABEL_GAP) {
      result.push(null);
      return;
    }

    const label = new Intl.DateTimeFormat("en", { month: "short" }).format(
      new Date(`${firstDay.date}T12:00:00`),
    );

    if (used.has(label)) {
      result.push(null);
      return;
    }

    used.add(label);
    lastLabelled = index;
    result.push(label);
  });

  return result;
}

/**
 * How many weeks of the rendered grid are actually on screen.
 *
 * Every week is always in the DOM and the overflow is scrolled to the right edge
 * on mount, because the trailing weeks are the recent ones and the leading ones
 * are a year ago. This reads the visible count back off the DOM rather than
 * predicting it from a width, so the number reported is the number that is
 * actually visible rather than a second, parallel calculation of it.
 *
 * `cellSelector` exists because the pitch has to be measured off something that
 * is one grid column wide. v2 and v3's first child is a `.gh-week` wrapper, which
 * is; v5's first child is a month label, which is not - it is as wide as its three
 * letters - so measuring it would report a pitch several columns too narrow and
 * the visible-week count would come out at roughly a third of the truth. v5
 * passes the cell selector so the measurement is taken off a real cell.
 */
export function countVisibleWeeks(
  grid: HTMLElement | null,
  cellSelector?: string,
) {
  if (!grid || grid.clientWidth === 0) return null;

  const probe = cellSelector
    ? grid.querySelector<HTMLElement>(cellSelector)
    : (grid.firstElementChild as HTMLElement | null);
  if (!probe) return null;

  const gap = Number.parseFloat(getComputedStyle(grid).columnGap) || 0;
  const pitch = probe.offsetWidth + gap;
  if (pitch <= 0) return null;

  return Math.min(WEEKS, Math.max(1, Math.round(grid.clientWidth / pitch)));
}

export function sumContributions(days: ContributionPoint[]) {
  return days.reduce((total, day) => total + day.count, 0);
}

/** The run of consecutive contribution days ending at the last day reported. */
export function calculateCurrentStreak(points: ContributionPoint[]) {
  if (points.length === 0) return 0;

  const sortedPoints = [...points].sort((a, b) => a.date.localeCompare(b.date));
  const today = toDateKey(new Date());
  let index = sortedPoints.length - 1;

  if (sortedPoints[index].date === today && sortedPoints[index].count === 0) {
    index -= 1;
  }

  let streak = 0;
  for (; index >= 0; index -= 1) {
    if (sortedPoints[index].count === 0) break;
    streak += 1;
  }

  return streak;
}

/** "N contributions on <date>", the same phrasing for the cell tooltip and its label. */
export function describeDay(day: ContributionPoint) {
  return day.count === 0
    ? `No contributions on ${day.date}`
    : `${day.count} contribution${day.count === 1 ? "" : "s"} on ${day.date}`;
}

/** The caption under the calendar, which has to say which window it is describing. */
export function describeWindow(
  total: number,
  year: number | null,
  format: (value: number) => string,
) {
  return `${format(total)} contributions ${
    year === null
      ? "in the last year"
      : year === CURRENT_YEAR
        ? `so far in ${year}`
        : `in ${year}`
  }`;
}

export { CURRENT_YEAR };

/**
 * The payload `/api/github-profile` answers with, narrowed to what a calendar
 * actually reads. The route returns more - repo counts, stars - and a design that
 * shows those will widen this rather than re-declaring the shape.
 */
export interface ContributionProfile {
  contributions: ContributionPoint[];
  contributionsAvailable: boolean;
  totalContributions: number;
  createdAt: string | null;
}

export interface ContributionResponse {
  ok?: boolean;
  profile?: Partial<ContributionProfile> | null;
}