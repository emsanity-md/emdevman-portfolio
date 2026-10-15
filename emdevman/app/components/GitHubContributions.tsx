"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Github } from "lucide-react";

import { Section } from "@/app/components/ui/Section";
import { useDesign } from "@/app/context/DesignProvider";
import {
  buildContributionDays,
  buildMonthLabels,
  countVisibleWeeks,
  CURRENT_YEAR,
  describeDay,
  groupIntoWeeks,
  sumContributions,
  WEEKS,
  YEAR_OPTIONS,
  type ContributionPoint,
} from "@/app/lib/contributions";

const GITHUB_USERNAME = "emsanity-md";
const GITHUB_PROFILE_URL = `https://github.com/${GITHUB_USERNAME}`;

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
  createdAt: string | null;
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

  One scale now. There were two - a tile class per level for v2's filled squares
  and a dot class per level for v3's halftone field - and v2's is gone with the
  rest of that design's section. The `--gh-*` tokens stay because the dot sizes
  still read them.
*/

/* v3's dots. One class per level; the size and the ink both come from CSS. */
const dotClasses = ["gh-dot-0", "gh-dot-1", "gh-dot-2", "gh-dot-3", "gh-dot-4"];

function formatNumber(value: number) {
  return new Intl.NumberFormat("en", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

export default function GitHubContributions() {
  const { design } = useDesign();
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

  /*
    Only fetch while this section is the one on screen.

    Every design's tree is in the document at once and `data-design` picks which
    one shows, so a visitor reading the default design has this component
    mounted and hidden - and a mounted hidden component still runs its effects.
    Before this gate, opening any design that is not v3 spent a request on
    github.com to build a calendar nobody would ever see, and since v2 became
    the default that was most visitors rather than a few.

    `design` is read inside the effect and never in the render, which is what
    makes it safe here: `getServerDesignSnapshot` returns the default while
    `getDesignSnapshot` returns whatever the pre-paint script actually resolved,
    so the two disagree during hydration by design. A branch in the markup would
    be a hydration mismatch; a branch in an effect is just a fetch that starts
    when the right design is on screen, which is also what makes switching to v3
    from the design switch load the calendar without a reload.
  */
  const isVisible = design === "v3";

  useEffect(() => {
    if (!isVisible) {
      setProfileLoading(false);
      return;
    }

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
  }, [year, isVisible]);

  const days = useMemo(
    () => buildContributionDays(profile?.contributions ?? [], year),
    [profile?.contributions, year],
  );
  const weeks = useMemo(() => groupIntoWeeks(days), [days]);

  const totalContributions = useMemo(() => sumContributions(days), [days]);
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
      /*
        Zero width means the anchor is not on screen - the v3 grid is inside a
        `display: none` wrapper whenever v1 or v2 is the active design - and the
        division inside the helper would round to a single visible week. That
        number feeds `monthLabels`, so a stray "1" under v2 put a forced label near
        the right edge of a grid that does not clip at all. Nothing to measure;
        leave the full width in place.
      */
      const shown = countVisibleWeeks(node.querySelector<HTMLElement>(".gh-grid"));
      if (shown === null) return;
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
    Month labels. The rules they follow, and the reason each one exists, live with
    the function in `lib/contributions.ts` - v5 draws a second calendar and needed
    the same four rules, so they are described once there rather than twice here.
  */
  const monthLabels = buildMonthLabels(weeks, visibleWeekCount);

  const calendarUnavailable = Boolean(
    !profileLoading && !profileFailed && profile && !profile.contributionsAvailable,
  );
  const hasProfile = !profileLoading && Boolean(profile);

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
        {/*
          The v2 half of this section is gone: a status badge, an "Open GitHub"
          button, a card-wrapped tile heatmap with its own day-of-week column and a
          second period filter, and the caption line under it. v2 is its own tree
          now and the rebuilt homepage has no GitHub section at all, so that half
          was deleted rather than left switched off.

          The wrapper stays because the `<Section>` above positions its glow
          against it, and deleting it would move the section up by one line of
          nothing - which is exactly the kind of change that is invisible in a
          diff and visible on the page.
        */}
      </div>

      {/*
        The calendar is the whole section. A period filter, then the dot field
        itself, wrapped in a single link to the profile, then a count line -
        which is the shape the reference uses for its GitHub block. No stat
        cards, no "Contribution calendar" heading, no day-of-week column, no
        rhythm chart, no profile summary images.

        The field is a halftone rather than a tile grid. A filled square per day
        is GitHub's own treatment, and it reads as a UI; a dot that grows with
        the level is the design language's texture motif carrying the data, so a
        busy month reads as density and a quiet one as open paper - the same way
        a printed halftone reads, and the reason the design reserves dots for
        things that are meant to be looked at rather than clicked.

        No `.v3-only` wrapper any more: this component is mounted only inside
        `legacy-only`, which is now v3 alone, so the gate had one arm and the
        markup it guarded was the same markup v3 was already rendering.
      */}
      <div>
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
                    const label = describeDay(day);
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
