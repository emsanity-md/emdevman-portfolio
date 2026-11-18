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

import "./v5-github.css";

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
 * The GitHub contribution calendar, between the corridor and the background
 * section.
 *
 * This is the calendar that used to live in v5's removed Activity tab. The data
 * path is unchanged: the same `/api/github-profile` route, and the week maths
 * and month-label rules from `lib/contributions.ts` that `GitHubContributions`
 * also uses. Only the shell is new - a full-bleed section matching the page's
 * black-and-white poster language instead of a card inside the old feed.
 *
 * The heat ramp uses GitHub's natural dark-theme greens. The section is fixed
 * black in both light and dark themes, so it defines its own five `--v5-heat-*`
 * values below; the shared calendar classes still do the drawing.
 *
 * The fetch is gated by `enabled` because every design is mounted at once.
 * Without the gate, opening v4 would still ask github.com for a calendar hidden
 * under v5's subtree.
 */
export function V5GithubCalendar({ enabled = true }: { enabled?: boolean }) {
  const [data, setData] = useState<CalendarData | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [year, setYear] = useState<number | null>(null);
  const [visibleWeeks, setVisibleWeeks] = useState(WEEKS);
  const gridRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!enabled) return;

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
          contributionsAvailable:
            result.profile.contributionsAvailable ?? false,
        });
        setFailed(false);
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError")
          return;
        setFailed(true);
      } finally {
        setLoading(false);
      }
    };

    void load();
    return () => controller.abort();
  }, [enabled, year]);

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
    Count what is actually visible. The server has no width, so it renders all 53
    weeks and the client corrects the count after the first layout. That count
    feeds the month labels and the "showing the last N weeks" note, so it is
    always the real number rather than a second estimate.
  */
  useEffect(() => {
    if (!enabled) return;

    const grid = gridRef.current;
    const scroller = scrollRef.current;
    if (!grid || !scroller) return;

    const report = () => {
      const days = scroller.querySelector<HTMLElement>(".v5-cal-days");
      const inner = scroller.querySelector<HTMLElement>(".v5-cal-inner");
      const gutter = inner
        ? Number.parseFloat(getComputedStyle(inner).columnGap) || 0
        : 0;
      /*
        The weekday column is sticky, so it takes up the left edge of the
        scroller rather than scrolling away with the grid. Subtract it, and the
        inner flex gap, before asking how many week columns fit.
      */
      const availableWidth = days
        ? scroller.clientWidth - days.offsetWidth - gutter
        : undefined;
      const shown = countVisibleWeeks(grid, ".v5-cal-cell", availableWidth);
      if (shown === null) return;
      setVisibleWeeks((current) => (current === shown ? current : shown));
    };

    report();

    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(report);
    observer.observe(grid);
    observer.observe(scroller);
    return () => observer.disconnect();
  }, [enabled, weeks.length]);

  /*
    The recent weeks are at the right edge of the field, so open there. This is a
    direct assignment rather than a smooth scroll: animating the calendar on
    every load and every period change reads as the page moving under the cursor.
  */
  useEffect(() => {
    if (!enabled) return;

    const scroller = scrollRef.current;
    if (!scroller) return;
    scroller.scrollLeft = scroller.scrollWidth;
  }, [enabled, weeks.length, year, loading]);

  const unavailable =
    !loading && (failed || (data !== null && !data.contributionsAvailable));
  const hasData = !loading && data !== null && !failed;

  return (
    <section
      id="v5-github"
      className="v5-github"
      aria-labelledby="v5-github-title"
    >
      <div className="v5-github__inner">
        <header className="v5-github__top">
          <div>
            <p className="v5-github__kicker">
              <Github aria-hidden="true" />
              Open source
            </p>
            <h2 id="v5-github-title" className="v5-github__title">
              GitHub activity.
            </h2>
            <p className="v5-github__intro">
              Public commits, one year at a time.
            </p>
          </div>

          <div className="v5-github__controls">
            <label htmlFor="v5-gh-year" className="v5-github__control-label">
              Period
            </label>
            <select
              id="v5-gh-year"
              value={year === null ? "rolling" : String(year)}
              onChange={(event) => {
                const next = event.target.value;
                setYear(next === "rolling" ? null : Number(next));
              }}
              className="v5-github__select"
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

        <div className="v5-github__panel">
          <div className="v5-github__meta">
            <p className="v5-github__count">
              {hasData
                ? describeWindow(total, year, formatNumber)
                : loading
                  ? "Syncing public data…"
                  : "Contribution data unavailable"}
            </p>

            {hasData && visibleWeeks < weeks.length ? (
              <p className="v5-github__window">
                Showing the last {visibleWeeks} weeks
              </p>
            ) : null}
          </div>

          <div
            ref={scrollRef}
            className="v5-cal-scroll v5-github__scroll"
            role="region"
            aria-label="GitHub public contribution calendar"
            tabIndex={0}
          >
            <div className="v5-cal-inner">
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
                <div className="v5-github__state">
                  <p>
                    GitHub&apos;s contribution calendar is temporarily
                    unavailable.
                  </p>
                  <a
                    href={GITHUB_PROFILE_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Open the live calendar
                    <ArrowUpRight aria-hidden="true" />
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

          <div className="v5-github__footer">
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

            <a
              href={GITHUB_PROFILE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="v5-github__profile"
            >
              @{GITHUB_USERNAME}
              <ArrowUpRight aria-hidden="true" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

/**
 * The loading state: the same 53x7 grid, empty.
 *
 * Holding the calendar's shape avoids the height jump a spinner would cause, and
 * the cells use the same heat classes so the skeleton is already the section's
 * colour rather than a light flash on black.
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

export default V5GithubCalendar;
