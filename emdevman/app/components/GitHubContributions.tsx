"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowUpRight, GitCommitHorizontal, Github } from "lucide-react";

import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent } from "@/app/components/ui/card";
import { Section } from "@/app/components/ui/Section";

const GITHUB_USERNAME = "emsanity-md";
const GITHUB_PROFILE_URL = `https://github.com/${GITHUB_USERNAME}`;
const WEEKS = 53;

/**
 * Minimum columns between two month labels.
 *
 * A month boundary can fall one or two columns after another, and the labels are
 * three-letter abbreviations sitting over 10px columns - close enough that they
 * overlap into an unreadable pair. Three is the smallest gap that clears a
 * "Sep" at `text-micro`.
 */
const MIN_LABEL_GAP = 3;

const CURRENT_YEAR = new Date().getUTCFullYear();

/*
  `null` is GitHub's rolling last-12-months window, which is the default. The
  calendar years come after it in descending order.

  The sparse years are kept on purpose: this account has 17 active days in 2023
  and 4 in 2024, against 165 in 2025. Filtering those out would misrepresent the
  history rather than tidy it.
*/
const YEAR_OPTIONS: Array<number | null> = [
  null,
  ...Array.from({ length: 4 }, (_, index) => CURRENT_YEAR - index),
];

interface ContributionPoint {
  date: string;
  count: number;
  level: number;
}

/**
 * Stats come from `api.github.com` and are `null` whenever that call failed -
 * almost always rate limiting, since unauthenticated it allows 60 requests an
 * hour. Contributions come from the github.com *website*, which has no such
 * limit, so the calendar survives a stats failure. These fields are nullable
 * for that reason: an absent number is a dash, not a zero.
 */
interface ProfileData {
  publicRepos: number | null;
  followers: number | null;
  following: number | null;
  totalStars: number | null;
  totalForks: number | null;
  topLanguage: string | null;
  statsAvailable: boolean;
  contributionsAvailable: boolean;
  totalContributions: number;
  contributions: ContributionPoint[];
  /** `null` is the rolling last-12-months window; a number is a calendar year. */
  window: { year: number | null };
}

interface ProfileResponse {
  ok?: boolean;
  profile?: ProfileData | null;
}

/*
  The heat scale is a token per level, so v3 can swap GitHub's green ramp for
  the grey one without this file knowing. The old version hardcoded five
  dark-mode hex values alongside a zinc light ramp.

  Two scales, because v2 and v3 now draw different shapes. v2 keeps filled
  squares; v3 draws a halftone field, where a day's level reads as the size and
  density of its dot rather than as a filled tile.
*/
const levelClasses = [
  "border-gh-0 bg-gh-0",
  "border-gh-1 bg-gh-1",
  "border-gh-2 bg-gh-2",
  "border-gh-3 bg-gh-3",
  "border-gh-4 bg-gh-4",
];

/* v3's dots. One class per level; the size and the ink both come from CSS. */
const dotClasses = ["gh-dot-0", "gh-dot-1", "gh-dot-2", "gh-dot-3", "gh-dot-4"];

function toDateKey(date: Date) {
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
 * January 1. This branch did not exist before, and the rolling arithmetic was
 * being applied to year-scoped data as well - which is where the grid went
 * wrong. Anchored on the last point in the payload, a 2023 request rendered
 * 2022-12-31 through 2023-12-27: a week of December 2022 sitting under a "2023"
 * filter, and the last four days of the year dropped off the right edge
 * entirely. The figure under the calendar was right (it comes from the API) and
 * the picture next to it was not.
 *
 * The final week is padded forward to Sunday, so a year view can end on up to
 * six days of January that follow it. GitHub's own year view does the same, and
 * those cells carry no contributions - they read as the trailing gap of the last
 * column rather than as data.
 */
function buildContributionDays(points: ContributionPoint[], year: number | null) {
  if (points.length === 0) return [];

  const sortedPoints = [...points].sort((a, b) => a.date.localeCompare(b.date));
  const latestPoint = sortedPoints[sortedPoints.length - 1];
  const pointsByDate = new Map(sortedPoints.map((point) => [point.date, point]));

  /*
    All UTC. The previous version took the weekday from a local-time Date with
    `getDay()` but wrote the key with `toISOString()`, so east of UTC every key
    was one day behind the weekday that positioned it, and the last column
    fell off the end of the year.
  */
  let start: Date;
  let totalDays: number;

  if (year === null) {
    const latestDate = new Date(`${latestPoint.date}T00:00:00Z`);
    start = new Date(latestDate);
    start.setUTCDate(start.getUTCDate() - (latestDate.getUTCDay() + (WEEKS - 1) * 7));

    /*
      Rounded up to whole weeks, like the calendar-year branch below.

      The count used to be derived as `latest - start + 1` to avoid appending
      future days to the right edge, which is right as far as it goes - but it
      only ever landed on a multiple of seven when the feed happened to end on a
      Saturday. `getUTCDay() + 365` is 367 for a feed ending mid-week, and 367 is
      52 weeks plus three days: the 53rd column rendered three cells and four
      empty rows, which reads as a broken final column rather than as the
      trailing gap it is.

      53 columns either way now, padded forward to the Sunday that closes the
      last one - the same thing GitHub does with its own rolling view.
    */
    const spanDays = Math.round((latestDate.getTime() - start.getTime()) / 86400000);
    totalDays = (Math.floor(spanDays / 7) + 1) * 7;
  } else {
    const yearStart = new Date(Date.UTC(year, 0, 1));
    const yearEnd = new Date(Date.UTC(year, 11, 31));
    start = new Date(yearStart);
    start.setUTCDate(start.getUTCDate() - yearStart.getUTCDay());

    /*
      `floor(span / 7) + 1`, not `ceil(span / 7) + 1`.

      The count is "how many week boundaries does this span cross, counting the
      one it starts on". A year that begins and ends mid-week is 53 columns; the
      two agree whenever Dec 31 lands exactly on the Sunday the grid started on
      and disagree by a whole column otherwise, which is most years - 2024 came
      out at 54 columns and 2025 at 54.
    */
    const spanDays = Math.round((yearEnd.getTime() - start.getTime()) / 86400000);
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

function formatNumber(value: number) {
  return new Intl.NumberFormat("en", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

function formatDayCount(value: number) {
  return `${value} ${value === 1 ? "day" : "days"}`;
}

function calculateCurrentStreak(points: ContributionPoint[]) {
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

export default function GitHubContributions() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileFailed, setProfileFailed] = useState(false);
  const calendarRef = useRef<HTMLAnchorElement>(null);
  /*
    How many weeks the rendered grid is actually showing, read back off the DOM
    after mount. Starts at the full year so the server and the first client
    render agree; corrected by the effect below once there is a layout to read.
  */
  const [visibleWeekCount, setVisibleWeekCount] = useState(WEEKS);
  /* null = GitHub's rolling last-12-months window. */
  const [year, setYear] = useState<number | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    const loadProfile = async () => {
      setProfileLoading(true);
      try {
        const query = year === null ? "" : `?year=${year}`;
        const response = await fetch(`/api/github-profile${query}`, {
          signal: controller.signal,
          cache: "no-store",
        });
        if (!response.ok) throw new Error("Profile request failed");
        const result = (await response.json()) as ProfileResponse;
        if (!result.profile) throw new Error("Profile unavailable");
        /*
          No `result.ok` check. The route now reports `ok: true` for any request
          it answered, and flags the stats separately with `statsAvailable` - a
          rate-limited stats call leaves the contributions intact, and the
          calendar is the part of this section that has to survive. Treating a
          partial payload as a total failure is what blanked the whole section.
        */
        setProfile(result.profile);
        setProfileFailed(false);
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setProfileFailed(true);
      } finally {
        setProfileLoading(false);
      }
    };

    void loadProfile();
    return () => controller.abort();
  }, [year]);

  const days = useMemo(
    () => buildContributionDays(profile?.contributions ?? [], year),
    [profile?.contributions, year],
  );
  const weeks = useMemo(() => {
    const result: ContributionPoint[][] = [];
    for (let index = 0; index < days.length; index += 7) {
      result.push(days.slice(index, index + 7));
    }
    return result;
  }, [days]);

  const totalContributions = useMemo(
    () => days.reduce((total, day) => total + day.count, 0),
    [days],
  );
  const currentStreak = useMemo(
    () => calculateCurrentStreak(profile?.contributions ?? []),
    [profile?.contributions],
  );
  /*
    The caption reports how much of the year is actually on screen, and it reads
    that back off the rendered grid rather than predicting it from a width.

    The count itself is CSS's job now. All 53 weeks are always in the DOM, the
    grid is `1fr` columns, and the overflow is clipped from the left - the
    correct end to clip, since the trailing weeks are the recent ones and the
    leading ones are a year ago.

    This used to be a ResizeObserver feeding a column count into an inline
    `grid-template-columns`, which meant the number of weeks in the DOM depended
    on a measurement taken after mount: the server emitted 50 columns (it has no
    width, so it fell back to 640px) and the client immediately replaced them
    with 26 on a phone. The grid is the tallest element in the section, so that
    was a visible jump on every mobile load - the symptom that looked like the
    sections overlapping.

    Measuring the rendered pitch instead of the container means there is nothing
    to keep in sync with the CSS, and the number in the caption is the number
    that is actually visible rather than a second, parallel calculation of it.
  */
  useEffect(() => {
    const node = calendarRef.current;
    if (!node) return;

    const report = () => {
      const grid = node.querySelector<HTMLElement>(".gh-grid");
      const first = grid?.firstElementChild as HTMLElement | null;
      if (!grid || !first) return;

      /*
        Zero width means the anchor is not on screen - the v3 grid is inside a
        `display: none` wrapper whenever v1 or v2 is the active design - and the
        division below would round to a single visible week. That number feeds
        `monthLabels`, so a stray "1" under v2 put a forced label near the right
        edge of a grid that does not clip at all. Nothing to measure; leave the
        full width in place.
      */
      if (grid.clientWidth === 0) return;

      const gap = Number.parseFloat(getComputedStyle(grid).columnGap) || 0;
      const pitch = first.offsetWidth + gap;
      if (pitch <= 0) return;

      const shown = Math.min(WEEKS, Math.max(1, Math.round(grid.clientWidth / pitch)));
      setVisibleWeekCount((current) => (current === shown ? current : shown));
    };

    report();

    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(report);
    observer.observe(node);
    return () => observer.disconnect();
  }, [weeks.length]);

  /* Weeks the CSS clip has pushed off the left edge. Reported, not hidden. */
  const hiddenWeeks = Math.max(0, weeks.length - visibleWeekCount);

  /*
    Month labels, one per week column, or `null` for a column that is not a
    labelled month.

    Four rules, in order:

      1. Label only where a month actually begins - the week whose first day
         falls in a different month to the previous week's first day.
      2. Never label within `MIN_LABEL_GAP` columns of the previous label. A
         month boundary can land one or two columns after another, and two
         three-letter abbreviations sitting over adjacent columns overlap.
      3. Never use the same month name twice in one grid. A 53-week window that
         opens mid-October runs to the following October, so both ends are month
         boundaries and the first and last columns both want to say "Oct". They
         are 51 columns apart, so the gap rule does not touch them - they are
         not adjacent, just redundant, and the second one reads as a stray label
         at the right edge. The first occurrence wins.
      4. Column 0 and v3's first visible column are always candidates, so the
         left edge of the field is never unlabelled.

    Shared with v3, which draws the label inside each week column and clips its
    grid from the left - which is why rule 4's second clause exists.
  */
  const monthLabels = (() => {
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
  })();

  const calendarUnavailable = Boolean(
    !profileLoading && !profileFailed && profile && !profile.contributionsAvailable,
  );
  const hasProfile = !profileLoading && Boolean(profile);
  /*
    Four states, not five.

    `statsAvailable` used to drive a "Repo stats rate-limited" branch here, and
    the stat cards it belonged to are gone. A badge that warns about a number
    the section no longer shows is worse than no badge - the reader is being
    told something is wrong with data they cannot see. The calendar is the only
    thing left that can fail, so it is the only thing the badge reports on.
  */
  const statusLabel = profileLoading
    ? "Syncing public data"
    : profileFailed
      ? "Profile data unavailable"
      : calendarUnavailable
        ? "Calendar unavailable"
        : "Live public data";
  const statusDotClass = profileLoading
    ? "animate-pulse bg-status-pending"
    : profileFailed || calendarUnavailable
      ? "bg-faint"
      : "status-dot";
  return (
    <Section
      id="github"
      index="02"
      eyebrow="github"
      action={{ label: "@emsanity-md", href: GITHUB_PROFILE_URL }}
      both
      wide
      icon={<Github className="section-badge-icon" aria-hidden="true" />}
      title="GitHub activity"
      description="A closer look at the public work, experiments, and small consistent contributions behind the projects."
    >
      <div
        aria-hidden="true"
        className="activity-glow pointer-events-none absolute -right-32 -top-32 -z-10 size-[30rem] rounded-full bg-success-surface blur-3xl"
      />

      <div className="relative">
          <div className="v2-only flex flex-col items-start gap-4 lg:items-end">
            <Badge
              variant="muted"
              className="gap-2 bg-background/70 px-3 py-1.5 font-mono text-micro backdrop-blur"
            >
              <span className={`size-1.5 rounded-full ${statusDotClass}`} aria-hidden="true" />
              {statusLabel}
            </Badge>
            <Button asChild variant="outline" className="rounded-full">
              <a href={GITHUB_PROFILE_URL} target="_blank" rel="noopener noreferrer">
                Open GitHub
                <ArrowUpRight aria-hidden="true" />
              </a>
            </Button>
          </div>

          {/*
            v2 has no stat row here either. The four cards it used to carry -
            public repositories, contributions, active days, stars - are gone for
            the same reason v3's three went: the calendar below already answers
            "how much", and the profile link above answers "how many repos"
            without a number standing in for it. What is left is the one thing
            this section is actually good at showing.
          */}
        </div>

        {/*
          v2 is the calendar and nothing else.

          This used to be a two-column layout - calendar plus a rhythm chart on
          the left, three profile cards on the right - under a four-up stat row.
          All of it is removed. The rhythm chart re-plotted the last seven days
          that the calendar's rightmost column already shows, and the three
          profile cards were third-party images repeating facts the stat row had
          just put into numbers.

          The wrapper is now single-column, so the calendar gets the full
          measure. At 53 weeks it needs the width: the grid carries a 760px
          minimum and scrolls below that.
        */}
        <div className="v2-only mt-10">
          <Card className="min-w-0 overflow-hidden border-border bg-card/90 shadow-sm backdrop-blur">
            <CardContent className="p-5 sm:p-7">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <GitCommitHorizontal
                      className="size-5 text-muted-foreground"
                      aria-hidden="true"
                    />
                    <h3 className="text-xl font-bold tracking-tight sm:text-heading">
                      Contribution calendar
                    </h3>
                  </div>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                    A live mirror of GitHub&apos;s public contribution calendar. Cell
                    levels and daily counts come directly from GitHub.
                  </p>
                </div>
                {/*
                  The period filter.

                  Replaces a badge that read "Last 53 weeks", which the filter
                  made false: pick a year and the grid is that year's weeks, not
                  a rolling 53. The select says the same thing the badge used to,
                  but it is now also the control.

                  The id is `gh-year-v2` rather than the v3 select's `gh-year` on
                  purpose. Both branches are in the document at once - CSS picks
                  which one is on screen - so sharing the id would give the
                  document two elements with the same id and leave the v2 label
                  pointing at the v3 select.
                */}
                <div className="flex items-center gap-2">
                  <label htmlFor="gh-year-v2" className="eyebrow text-muted-foreground">
                    Period
                  </label>
                  <select
                    id="gh-year-v2"
                    name="gh-year-v2"
                    value={year === null ? "rolling" : String(year)}
                    onChange={(event) => {
                      const next = event.target.value;
                      setYear(next === "rolling" ? null : Number(next));
                    }}
                    className="rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium text-foreground outline-none transition-colors hover:border-line-strong focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {YEAR_OPTIONS.map((option) => (
                      <option
                        key={option === null ? "rolling" : option}
                        value={option === null ? "rolling" : option}
                      >
                        {option === null ? "Last 12 months" : option}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div
                className="mt-8 overflow-x-auto pb-2"
                role="region"
                aria-label="GitHub public contribution calendar"
                tabIndex={0}
              >
                {profileLoading ? (
                  <div
                    className="grid min-w-[722px] gap-[3px]"
                    style={{
                      gridTemplateColumns: `repeat(${WEEKS}, minmax(0, 1fr))`,
                      gridTemplateRows: "auto repeat(7, auto)",
                      gridAutoFlow: "column",
                    }}
                    aria-label="Loading contribution calendar"
                  >
                    {Array.from({ length: WEEKS * 7 }, (_, index) => (
                      <span
                        key={index}
                        className="aspect-square animate-pulse rounded-[2px] bg-muted"
                      />
                    ))}
                  </div>
                ) : profileFailed || calendarUnavailable ? (
                  <div className="rounded-xl border border-dashed border-border bg-muted/30 p-8 text-center">
                    <p className="text-sm font-medium">
                      GitHub&apos;s contribution calendar is temporarily unavailable.
                    </p>
                    <a
                      href={GITHUB_PROFILE_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-success hover:underline"
                    >
                      Open the live GitHub calendar
                      <ArrowUpRight className="size-4" aria-hidden="true" />
                    </a>
                  </div>
                ) : (
                  /*
                    722px is the floor, not a round number: 53 columns at a 10px
                    cell plus 52 gaps of 3px, plus the 28px day-label column and
                    its 8px gutter. Below it the cells start shrinking under 10px,
                    which is where they stop being distinguishable at all, so the
                    wrapper scrolls instead.
                  */
                  <div className="flex min-w-[722px] gap-2">
                    {/*
                      Day labels, in their own fixed-width column.

                      Its row template is identical to the grid's - `auto` for the
                      header, then seven `auto` rows - and it sits in the same
                      flex row at the same 3px gap, so each label's box lands on
                      the same line as the cells it names. GitHub labels the odd
                      rows only: Mon, Wed, Fri.

                      The empty children are not filler, they are the other rows.
                      A grid item's row is its position in the flow, so skipping
                      them would shift every label up by one day.
                    */}
                    <div
                      aria-hidden="true"
                      className="grid w-7 shrink-0 gap-[3px] text-micro text-muted-foreground"
                      style={{ gridTemplateRows: "auto repeat(7, auto)" }}
                    >
                      {/* Header row, left blank to line up with the month labels. */}
                      <span />
                      {/* Sunday */}
                      <span />
                      <span className="flex items-center">Mon</span>
                      {/* Tuesday */}
                      <span />
                      <span className="flex items-center">Wed</span>
                      {/* Thursday */}
                      <span />
                      <span className="flex items-center">Fri</span>
                      {/* Saturday */}
                      <span />
                    </div>

                    {/*
                      The heatmap: one grid, header row plus seven day rows.

                      `repeat(n, minmax(0, 1fr))` is what makes it fill the card
                      and scale with it - the previous version fixed every cell at
                      `size-2.5` and left the remaining card width empty. Cells are
                      `aspect-square`, so they stay square at whatever width the
                      column resolves to.

                      The month labels are cells in row 1 of this same grid, each
                      pinned with `grid-column`, rather than a separate flex row
                      measured against a different pitch. That is the whole fix for
                      the labels drifting out from over their columns: there is one
                      column template now, so a label at column 12 is by
                      construction above the twelfth week.

                      Row 1 is filled for every column - the unlabelled ones render
                      an empty string - which is what lets `grid-auto-flow: column`
                      do the cell placement. The flow cursor starts at row 1 and
                      skips occupied cells, so the days begin at row 2 and fill
                      columns 1..n in order. Nothing else is placed in the grid, so
                      an eighth row cannot exist.
                    */}
                    <div
                      role="grid"
                      className="grid min-w-0 flex-1 gap-[3px]"
                      style={{
                        gridTemplateColumns: `repeat(${weeks.length}, minmax(0, 1fr))`,
                        gridTemplateRows: "auto repeat(7, auto)",
                        gridAutoFlow: "column",
                      }}
                    >
                      {weeks.map((_, index) => (
                        <span
                          key={`month-${index}`}
                          style={{ gridColumn: index + 1, gridRow: 1 }}
                          className="whitespace-nowrap text-micro text-muted-foreground"
                        >
                          {monthLabels[index] ?? ""}
                        </span>
                      ))}

                      {weeks.map((week) =>
                        week.map((day) => {
                          const label =
                            day.count === 0
                              ? `No contributions on ${day.date}`
                              : `${day.count} contribution${day.count === 1 ? "" : "s"} on ${day.date}`;
                          return (
                            <div
                              key={day.date}
                              title={label}
                              aria-label={label}
                              data-date={day.date}
                              data-level={day.level}
                              className={`aspect-square rounded-[2px] border transition-[transform,background-color,border-color] duration-300 motion-reduce:transition-none hover:scale-125 ${levelClasses[day.level] ?? levelClasses[0]}`}
                            />
                          );
                        }),
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-5 flex flex-col gap-3 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2">
                  <span>Less</span>
                  {levelClasses.map((levelClass, index) => (
                    <span
                      key={index}
                      className={`size-2.5 rounded-[2px] border ${levelClass}`}
                    />
                  ))}
                  <span>More</span>
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1">
                  {/*
                    The streak is only shown on the rolling window.

                    `calculateCurrentStreak` walks backwards from the last point
                    in whatever data it is given, so on a selected year's
                    payload it returns that year's trailing run - not the
                    reader's current one. Labelling that "Current streak" would
                    be a small lie, so the line simply is not drawn for a
                    specific year. "Public contributions" is unaffected: the
                    figure is scoped to the window on screen either way.
                  */}
                  {year === null ? (
                    <p>
                      Current streak: {hasProfile ? formatDayCount(currentStreak) : "—"}
                    </p>
                  ) : null}
                  <p>
                    Public contributions: {hasProfile ? formatNumber(profile?.totalContributions ?? 0) : "—"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

      {/*
        v3: the calendar is the whole section. A period filter, then the dot
        field itself, wrapped in a single link to the profile, then a count
        line - which is the shape the reference uses for its GitHub block. No
        stat cards, no "Contribution calendar" heading, no day-of-week column,
        no rhythm chart, no profile summary images.

        The field is a halftone rather than a tile grid. A filled square per day
        is GitHub's own treatment, and it reads as a UI; a dot that grows with
        the level is the design language's texture motif carrying the data, so
        a busy month reads as density and a quiet one as open paper - the same
        way a printed halftone reads, and the reason the design reserves dots
        for things that are meant to be looked at rather than clicked.
      */}
      <div className="v3-only">
        {/* No top margin: .section-head-v3 supplies the gap under the marker. */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <label
            htmlFor="gh-year"
            className="font-mono text-[10px] uppercase tracking-wider text-faint"
          >
            Period
          </label>
          <select
            id="gh-year"
            name="gh-year"
            value={year === null ? "rolling" : String(year)}
            onChange={(event) => {
              const next = event.target.value;
              setYear(next === "rolling" ? null : Number(next));
            }}
            className="v3-select font-mono text-[11px] uppercase tracking-wider"
          >
            {YEAR_OPTIONS.map((option) => (
              <option
                key={option === null ? "rolling" : option}
                value={option === null ? "rolling" : String(option)}
              >
                {option === null ? "last 12 months" : option}
              </option>
            ))}
          </select>

          {hiddenWeeks > 0 ? (
            <p className="font-mono text-[10px] uppercase tracking-wider text-faint">
              Showing the last {visibleWeekCount} weeks
            </p>
          ) : null}
        </div>

        <a
          ref={calendarRef}
          href={GITHUB_PROFILE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="gh-calendar group section-block block"
        >
          <span className="sr-only">
            Open {GITHUB_USERNAME}&apos;s GitHub profile
          </span>
          {profileLoading ? (
            <div
              className="gh-grid gh-grid--loading"
              aria-label="Loading contribution calendar"
            >
              {Array.from({ length: WEEKS }, (_, index) => (
                <div key={index} className="gh-week">
                  <span className="gh-month" />
                  {Array.from({ length: 7 }, (__, day) => (
                    <span key={day} className="gh-dot gh-dot-0" />
                  ))}
                </div>
              ))}
            </div>
          ) : profileFailed || calendarUnavailable ? (
            <p className="py-8 text-center text-[14px] text-muted-foreground">
              GitHub&apos;s contribution calendar is temporarily unavailable.
            </p>
          ) : (
            <div className="gh-grid" role="grid" aria-label="Contribution calendar">
              {weeks.map((week, weekIndex) => (
                <div key={weekIndex} className="gh-week" role="row">
                  <span className="gh-month" aria-hidden="true">
                    {monthLabels[weekIndex]}
                  </span>
                  {week.map((day) => {
                    const label =
                      day.count === 0
                        ? `No contributions on ${day.date}`
                        : `${day.count} contribution${day.count === 1 ? "" : "s"} on ${day.date}`;
                    return (
                      <span
                        key={day.date}
                        role="gridcell"
                        title={label}
                        aria-label={label}
                        data-level={day.level}
                        className={`gh-dot ${dotClasses[day.level] ?? dotClasses[0]}`}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          )}
        </a>

        <p className="section-note text-[13px] text-faint">
          {hasProfile
            ? `${formatNumber(totalContributions)} contributions ${
                year === null
                  ? "in the last year"
                  : year === CURRENT_YEAR
                    ? `so far in ${year}`
                    : `in ${year}`
              }`
            : "Contribution data unavailable"}
        </p>

        <div className="section-note gh-legend">
          <span className="font-mono text-[10px] uppercase tracking-wider text-faint">
            Less
          </span>
          {dotClasses.map((dotClass, index) => (
            <span key={index} className={`gh-dot ${dotClass}`} />
          ))}
          <span className="font-mono text-[10px] uppercase tracking-wider text-faint">
            More
          </span>
        </div>
      </div>
    </Section>
  );
}
