"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowUpRight, Github } from "lucide-react";

import {
  buildContributionDays,
  buildMonthLabels,
  countVisibleWeeks,
  describeDay,
  describeWindow,
  groupIntoWeeks,
  sumContributions,
  WEEKS,
  YEAR_OPTIONS,
  type ContributionPoint,
} from "@/app/lib/contributions";

const GITHUB_USERNAME = "emsanity-md";
const GITHUB_PROFILE_URL = `https://github.com/${GITHUB_USERNAME}`;

const HEAT_CLASSES = [
  "v5-heat-0",
  "v5-heat-1",
  "v5-heat-2",
  "v5-heat-3",
  "v5-heat-4",
] as const;

interface CalendarData {
  contributions: ContributionPoint[];
  contributionsAvailable: boolean;
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("en", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

/**
 * The Activity tab's whole content: one card holding the contribution calendar.
 *
 * Deliberately not `GitHubContributions`, which is v2's and v3's section and
 * carries a `<Section>` shell, two design branches and a status badge this
 * layout has no place for. The *data* is shared wholesale instead - this fetches
 * the same `/api/github-profile` route, and the week arithmetic and month-label
 * rules come from `lib/contributions.ts`, which `GitHubContributions` imports
 * too. So there is one route, one set of rules, two renderings.
 *
 * No `react-github-calendar`, and no GraphQL route either. The package was the
 * first suggestion and the route was already here: it reads the public calendar
 * from `github.com` rather than the API, so it is not rate limited and it works
 * with no `GITHUB_TOKEN` at all - and the token, when one is set, stays in the
 * server route where the client can never see it.
 *
 * The colours come from `--v5-heat-*`, which are plain custom properties flipped
 * by the `.dark` class next-themes already puts on `<html>`. Nothing here reads
 * `useTheme()` to decide what to draw, which is what is why there is no flash on
 * load and no hydrated-versus-server colour mismatch.
 */
export function V5Calendar() {
  const [data, setData] = useState<CalendarData | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [year, setYear] = useState<number | null>(null);
  const [visibleWeeks, setVisibleWeeks] = useState(WEEKS);
  const gridRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const controller = new AbortController();

    const load = async () => {
      setLoading(true);
      try {
        const query = year === null ? "" : `?year=${year}`;
        const response = await fetch(`/api/github-profile${query}`, {
          signal: controller.signal,
          cache: "no-store",
        });
        if (!response.ok) throw new Error("Profile request failed");

        const result = (await response.json()) as {
          profile?: Partial<CalendarData> | null;
        };
        if (!result.profile) throw new Error("Profile unavailable");

        setData({
          contributions: result.profile.contributions ?? [],
          contributionsAvailable: result.profile.contributionsAvailable ?? false,
        });
        setFailed(false);
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setFailed(true);
      } finally {
        setLoading(false);
      }
    };

    void load();
    return () => controller.abort();
  }, [year]);

  const days = useMemo(
    () => buildContributionDays(data?.contributions ?? [], year),
    [data?.contributions, year],
  );
  const weeks = useMemo(() => groupIntoWeeks(days), [days]);
  const monthLabels = useMemo(
    () => buildMonthLabels(weeks, visibleWeeks),
    [weeks, visibleWeeks],
  );
  const total = useMemo(() => sumContributions(days), [days]);

  /*
    Two effects, and they are not the same job.

    This one counts how many weeks are on screen, which only exists after mount -
    the server has no width, so it renders the full 53 and the client corrects it
    once there is a layout to measure. Starting from the full width rather than a
    guess is what keeps the server and the first client render identical, and the
    figure it produces is the one the "showing the last N weeks" line reports, so
    that line is never a second, parallel calculation of the same thing.
  */
  useEffect(() => {
    const grid = gridRef.current;
    if (!grid) return;

    const report = () => {
      /*
        The cell selector, not the grid's first child. v5's first child is a month
        label, which is as wide as its three letters rather than one column wide,
        so measuring it would report a pitch several columns too narrow and the
        count would come out at roughly a third of the truth.
      */
      const shown = countVisibleWeeks(grid, ".v5-cal-cell");
      if (shown === null) return;
      setVisibleWeeks((current) => (current === shown ? current : shown));
    };

    report();

    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(report);
    observer.observe(grid);
    return () => observer.disconnect();
  }, [weeks.length]);

  /*
    And this one scrolls to the end. The trailing weeks are the recent ones and
    the leading ones are a year ago, so a calendar that opens on the left edge is
    a calendar that opens on the least interesting part of itself.

    `scrollLeft = scrollWidth` rather than `scrollTo({ right: 0 })` because the
    latter is smooth, and a scroll that animates on every load - including on the
    year selector, and including on the first paint - reads as the page arriving
    rather than the page being there.
  */
  useEffect(() => {
    const scroller = scrollRef.current;
    if (!scroller) return;
    scroller.scrollLeft = scroller.scrollWidth;
  }, [weeks.length, year, loading]);

  const unavailable =
    !loading && (failed || (data !== null && !data.contributionsAvailable));
  const hasData = !loading && data !== null && !failed;

  return (
    <article className="v5-card v5-card--plain">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="v5-card-title">
            <Github className="size-4 text-muted-foreground" aria-hidden="true" />
            Activity
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {hasData
              ? describeWindow(total, year, formatNumber)
              : loading
                ? "Syncing public data…"
                : "Contribution data unavailable"}
          </p>
        </div>

        {/*
          The period filter, aligned right as the layout asks. It is a real
          `<label>` for a real `<select>` with a real id - the v2 and v3 calendars
          share the same control on their own ids because all three calendars are
          in the document at once under those designs, and two elements with one
          id would leave a label pointing at the wrong control.
        */}
        <div className="flex items-center gap-2">
          <label htmlFor="v5-gh-year" className="text-xs text-muted-foreground">
            Period
          </label>
          <select
            id="v5-gh-year"
            value={year === null ? "rolling" : String(year)}
            onChange={(event) => {
              const next = event.target.value;
              setYear(next === "rolling" ? null : Number(next));
            }}
            className="v5-select"
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
      </header>

      <div
        ref={scrollRef}
        className="v5-cal-scroll mt-5"
        role="region"
        aria-label="GitHub public contribution calendar"
        tabIndex={0}
      >
        <div className="v5-cal-inner">
          {/*
            The day labels, in their own fixed-width column.

            Its row template is identical to the grid's - `auto` for the header,
            then seven `auto` rows - and it sits in the same flex row at the same
            8px gap, so each label's box lands on the same line as the cells it
            names. GitHub labels the odd rows only: Mon, Wed, Fri.

            The empty children are not filler, they are the other rows. A grid
            item's row is its position in the flow, so skipping them would shift
            every label up by one day.
          */}
          <div className="v5-cal-days" aria-hidden="true">
            <span />
            <span />
            <span className="flex items-center">Mon</span>
            <span />
            <span className="flex items-center">Wed</span>
            <span />
            <span className="flex items-center">Fri</span>
            <span />
          </div>

          {loading ? (
            <Skeleton />
          ) : unavailable ? (
            <div className="flex-1 rounded-xl border border-dashed border-border bg-muted/40 p-8 text-center">
              <p className="text-sm font-medium">
                GitHub&apos;s contribution calendar is temporarily unavailable.
              </p>
              <a
                href={GITHUB_PROFILE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-primary"
              >
                Open the live GitHub calendar
                <ArrowUpRight className="size-4" aria-hidden="true" />
              </a>
            </div>
          ) : (
            <div
              ref={gridRef}
              role="grid"
              aria-label="Contribution calendar"
              className="v5-cal-grid"
              style={{
                gridTemplateColumns: `repeat(${weeks.length}, minmax(0, 1fr))`,
              }}
            >
              {weeks.map((_, index) => (
                <span
                  key={`month-${index}`}
                  style={{ gridColumn: index + 1, gridRow: 1 }}
                  className="v5-cal-month"
                  aria-hidden="true"
                >
                  {monthLabels[index] ?? ""}
                </span>
              ))}

              {weeks.map((week) =>
                week.map((day) => {
                  const label = describeDay(day);
                  return (
                    <div
                      key={day.date}
                      role="gridcell"
                      title={label}
                      aria-label={label}
                      data-level={day.level}
                      className={`v5-cal-cell ${HEAT_CLASSES[day.level] ?? HEAT_CLASSES[0]}`}
                    />
                  );
                }),
              )}
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <a
          href={GITHUB_PROFILE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="v5-rail-link"
        >
          @{GITHUB_USERNAME} on GitHub
        </a>

        <div className="v5-legend">
          <span>Less</span>
          {HEAT_CLASSES.map((heatClass, index) => (
            <span
              key={index}
              className={`v5-legend-cell ${heatClass}`}
              aria-hidden="true"
            />
          ))}
          <span>More</span>
        </div>
      </div>

      {/*
        How much of the year is actually on screen. `hiddenWeeks` is what the CSS
        overflow has pushed off the left edge, and it is reported rather than
        hidden - a reader who scrolled and came back to a different number than
        they left with has no way to know it is the same calendar.
      */}
      {hasData && visibleWeeks < weeks.length ? (
        <p className="mt-2 text-xs text-muted-foreground">
          Showing the last {visibleWeeks} weeks
        </p>
      ) : null}
    </article>
  );
}

/**
 * The loading state: the same 53x7 grid, empty.
 *
 * It is the real grid's shape rather than a spinner, which is the point - a
 * spinner tells the reader something is coming and nothing about how big it is,
 * and a calendar that arrives at a different size from the placeholder is the
 * jump the old version had. Fifty-three columns of pulsing squares hold the
 * height the real one will.
 */
function Skeleton() {
  return (
    <div
      className="v5-cal-grid flex-1"
      aria-label="Loading contribution calendar"
      aria-busy="true"
      style={{ gridTemplateColumns: `repeat(${WEEKS}, minmax(0, 1fr))` }}
    >
      {Array.from({ length: WEEKS }, (_, weekIndex) => (
        <span key={weekIndex} className="contents">
          <span className="v5-cal-month" aria-hidden="true" />
          {Array.from({ length: 7 }, (_, dayIndex) => (
            <span
              key={dayIndex}
              className="v5-cal-cell v5-heat-0 animate-pulse"
              aria-hidden="true"
            />
          ))}
        </span>
      ))}
    </div>
  );
}