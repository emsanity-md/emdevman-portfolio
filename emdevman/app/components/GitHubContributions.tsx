/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Activity,
  ArrowUpRight,
  Code2,
  GitCommitHorizontal,
  Github,
  TrendingUp,
} from "lucide-react";

import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent } from "@/app/components/ui/card";
import { Section } from "@/app/components/ui/Section";

const GITHUB_USERNAME = "emsanity-md";
const GITHUB_PROFILE_URL = `https://github.com/${GITHUB_USERNAME}`;
const STATS_URL = `https://github-profile-summary-cards.vercel.app/api/cards/profile-details?username=${GITHUB_USERNAME}&theme=default`;
const LANGUAGES_URL = `https://github-profile-summary-cards.vercel.app/api/cards/repos-per-language?username=${GITHUB_USERNAME}&theme=default`;
const WEEKS = 53;

/**
 * Narrowest a cell may get before the calendar starts dropping weeks.
 *
 * The year is always 53 columns; on a roomy container the cells simply grow.
 * That is how the reference does it - its grid is `w-full`, so 53 columns
 * scale to whatever width they are given.
 */
const MIN_CELL_PX = 4;

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
*/
const levelClasses = [
  "border-gh-0 bg-gh-0",
  "border-gh-1 bg-gh-1",
  "border-gh-2 bg-gh-2",
  "border-gh-3 bg-gh-3",
  "border-gh-4 bg-gh-4",
];

function toDateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function buildContributionDays(points: ContributionPoint[]) {
  if (points.length === 0) return [];

  const sortedPoints = [...points].sort((a, b) => a.date.localeCompare(b.date));
  const latestPoint = sortedPoints[sortedPoints.length - 1];

  /*
    All UTC. The previous version took the weekday from a local-time Date with
    `getDay()` but wrote the key with `toISOString()`, so east of UTC every key
    was one day behind the weekday that positioned it, and the last column
    fell off the end of the year.
  */
  const latestDate = new Date(`${latestPoint.date}T00:00:00Z`);
  const start = new Date(latestDate);
  start.setUTCDate(start.getUTCDate() - (latestDate.getUTCDay() + (WEEKS - 1) * 7));
  const pointsByDate = new Map(sortedPoints.map((point) => [point.date, point]));

  /*
    Derive the length from the real window instead of assuming WEEKS * 7: the
    feed ends on today's weekday, so a fixed 371 appended up to three future
    days at the right edge.
  */
  const totalDays = Math.round((latestDate.getTime() - start.getTime()) / 86400000) + 1;

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

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <Card className="stat border-0 bg-transparent shadow-none">
      <CardContent className="card-pad p-0">
        <span className="stat-value">{value}</span>
        <span className="stat-label">{label}</span>
      </CardContent>
    </Card>
  );
}

function StatCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="stat">
      <span className="stat-value">{value}</span>
      <span className="stat-label">{label}</span>
    </div>
  );
}

function Insight({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-3">
      <p className="eyebrow text-faint">{label}</p>
      <p className="mt-1 text-base font-semibold text-white">{value}</p>
    </div>
  );
}

export default function GitHubContributions() {
  const [statsFailed, setStatsFailed] = useState(false);
  const [languagesFailed, setLanguagesFailed] = useState(false);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileFailed, setProfileFailed] = useState(false);
  const calendarRef = useRef<HTMLAnchorElement>(null);
  const [calendarWidth, setCalendarWidth] = useState(0);
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
    () => buildContributionDays(profile?.contributions ?? []),
    [profile?.contributions],
  );
  const weeks = useMemo(() => {
    const result: ContributionPoint[][] = [];
    for (let index = 0; index < days.length; index += 7) {
      result.push(days.slice(index, index + 7));
    }
    return result;
  }, [days]);

  const activeDays = days.filter((day) => day.count > 0).length;
  const totalContributions = useMemo(
    () => days.reduce((total, day) => total + day.count, 0),
    [days],
  );
  const busiestDay = useMemo(
    () =>
      days.reduce<ContributionPoint | null>((busiest, day) => {
        if (day.count <= (busiest?.count ?? -1)) return busiest;
        return day;
      }, null),
    [days],
  );
  const longestStreak = useMemo(() => {
    let longest = 0;
    let current = 0;

    for (const day of days) {
      if (day.count > 0) {
        current += 1;
        longest = Math.max(longest, current);
      } else {
        current = 0;
      }
    }

    return longest;
  }, [days]);
  const averagePerActiveDay = activeDays > 0 ? totalContributions / activeDays : 0;
  const recentDays = days.slice(-7);
  const recentContributions = recentDays.reduce((total, day) => total + day.count, 0);
  const recentMaximum = Math.max(1, ...recentDays.map((day) => day.count));
  const busiestDayLabel = busiestDay
    ? new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(
        new Date(`${busiestDay.date}T12:00:00`),
      )
    : "—";
  const currentStreak = useMemo(
    () => calculateCurrentStreak(profile?.contributions ?? []),
    [profile?.contributions],
  );
  const monthLabels = weeks.map((week, index) => {
    const firstDay = week[0];
    if (!firstDay) return null;
    const date = new Date(`${firstDay.date}T12:00:00`);
    const previous = weeks[index - 1]?.[0];
    if (previous && previous.date.slice(0, 7) === firstDay.date.slice(0, 7)) {
      return null;
    }
    return new Intl.DateTimeFormat("en", { month: "short" }).format(date);
  });

  /*
    The calendar sizes itself from the width it is given.

    It used to assume a nominal 402px and emit a fixed 134 columns at 10px + 4px,
    which is 1872px of grid. That overflowed every container it was ever put in
    - 74 of the 134 weeks sat off-screen behind a scrollbar, and the dot pitch
    silently changed with the container. Measuring instead means the year always
    fits the space it has, and a cell is always the pitch asked for.
  */
  useEffect(() => {
    const node = calendarRef.current;
    if (!node) return;

    const measure = () => setCalendarWidth(node.clientWidth);
    measure();

    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const calendarColumns = Math.max(
    8,
    Math.min(WEEKS, Math.floor((calendarWidth || 640) / MIN_CELL_PX)),
  );
  const gridTemplate = {
    gridTemplateColumns: `repeat(${calendarColumns}, minmax(0, 1fr))`,
  };

  const calendarUnavailable = Boolean(
    !profileLoading && !profileFailed && profile && !profile.contributionsAvailable,
  );
  /* The two sources fail independently; the badge should say which one did. */
  const statsUnavailable = Boolean(
    !profileLoading && !profileFailed && profile && !profile.statsAvailable,
  );
  const hasProfile = !profileLoading && Boolean(profile);
  /*
    An absent stat is a dash. `?? 0` would report "0 stars" and "0 repositories",
    which is a claim rather than an admission that the number is unknown - and it
    is exactly what a rate-limited stats call looks like from here.
  */
  const apiStat = (value: number | null | undefined) =>
    value == null ? "—" : formatNumber(value);
  const statusLabel = profileLoading
    ? "Syncing public data"
    : profileFailed
      ? "Profile data unavailable"
      : statsUnavailable
        ? "Repo stats rate-limited"
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

          {/* v3 keeps three of the five metrics, in the reference's single row. */}
          <div className="v3-only stats">
            <StatCell
              label="Repositories"
              value={apiStat(profile?.publicRepos)}
            />
            <StatCell
              label="Contributions"
              value={hasProfile ? formatNumber(totalContributions) : "—"}
            />
            <StatCell
              label="Stars earned"
              value={apiStat(profile?.totalStars)}
            />
          </div>
        </div>

        <div className="v2-only">
        <div className="stat-grid stats mt-10">
          <MetricCard
            label="Public repositories"
            value={apiStat(profile?.publicRepos)}
          />
          <MetricCard
            label="Contributions"
            value={hasProfile ? formatNumber(profile?.totalContributions ?? 0) : "—"}
          />
          <MetricCard
            label="Active days"
            value={hasProfile ? formatDayCount(activeDays) : "—"}
          />
          <MetricCard
            label="Stars earned"
            value={apiStat(profile?.totalStars)}
          />
        </div>

        <div className="mt-6 grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
          <div className="min-w-0 space-y-6">
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
                <Badge variant="muted" className="w-fit font-mono text-micro">
                  Last 53 weeks
                </Badge>
              </div>

              <div
                className="mt-8 overflow-x-auto pb-2"
                role="region"
                aria-label="GitHub public contribution calendar"
                tabIndex={0}
              >
                {profileLoading ? (
                  <div
                    className="grid min-w-[760px] grid-flow-col grid-rows-7 gap-1"
                    aria-label="Loading contribution calendar"
                  >
                    {Array.from({ length: WEEKS * 7 }, (_, index) => (
                      <span
                        key={index}
                        className="size-2.5 animate-pulse rounded-[2px] bg-muted"
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
                  <div className="min-w-[760px]">
                    <div className="mb-2 flex gap-1 pl-7">
                      {weeks.map((_, index) => (
                        <div
                          key={index}
                          className="w-4 text-micro text-muted-foreground"
                        >
                          {monthLabels[index]}
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <div className="grid w-5 grid-rows-7 gap-1 text-micro leading-4 text-muted-foreground">
                        <span>Sun</span>
                        <span />
                        <span>Tue</span>
                        <span />
                        <span>Thu</span>
                        <span />
                        <span>Sat</span>
                      </div>
                      <div className="flex gap-1" role="grid">
                        {weeks.map((week, weekIndex) => (
                          <div key={weekIndex} className="grid grid-rows-7 gap-1">
                            {week.map((day) => {
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
                                  className={`size-2.5 rounded-[2px] border transition-[transform,background-color,border-color] duration-300 motion-reduce:transition-none hover:scale-125 ${levelClasses[day.level] ?? levelClasses[0]}`}
                                />
                              );
                            })}
                          </div>
                        ))}
                      </div>
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
                  <p>
                    Current streak: {hasProfile ? formatDayCount(currentStreak) : "—"}
                  </p>
                  <p>
                    Public contributions: {hasProfile ? formatNumber(profile?.totalContributions ?? 0) : "—"}
                  </p>
                </div>
              </div>
            </CardContent>
            </Card>

            <Card className="surface-card overflow-hidden border-surface-invert-line bg-surface-invert text-surface-invert-foreground">
              <CardContent className="p-5 sm:p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <TrendingUp className="size-5 text-surface-invert-muted" aria-hidden="true" />
                      <h3 className="text-subheading font-semibold">Contribution rhythm</h3>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-faint">
                      A quick read on the last 53 weeks of public activity.
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className="w-fit border-surface-invert-line bg-surface-invert-muted font-mono text-micro text-surface-invert-foreground"
                  >
                    Data-backed
                  </Badge>
                </div>

                <div className="mt-6 rounded-xl border border-white/10 bg-black/10 p-3">
                  <div className="flex h-16 items-end gap-2">
                    {profileLoading ? (
                      Array.from({ length: 7 }, (_, index) => (
                        <span
                          key={index}
                          className="h-full flex-1 animate-pulse rounded-t-sm bg-white/10"
                        />
                      ))
                    ) : recentDays.length > 0 ? (
                      recentDays.map((day) => {
                        const dayLabel = new Intl.DateTimeFormat("en", {
                          weekday: "short",
                        }).format(new Date(`${day.date}T12:00:00`));
                        const barHeight =
                          day.count > 0
                            ? Math.max(18, Math.round((day.count / recentMaximum) * 100))
                            : 8;
                        const label =
                          day.count === 0
                            ? `No contributions on ${day.date}`
                            : `${day.count} contribution${day.count === 1 ? "" : "s"} on ${day.date}`;

                        return (
                          <div
                            key={day.date}
                            className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-2"
                            title={label}
                          >
                            <div
                              className={`w-full max-w-8 rounded-t-sm transition-[height,background-color,border-color] duration-300 motion-reduce:transition-none ${levelClasses[day.level] ?? levelClasses[0]}`}
                              style={{ height: `${barHeight}%` }}
                              aria-label={label}
                            />
                            <span className="text-micro text-muted-foreground">{dayLabel}</span>
                          </div>
                        );
                      })
                    ) : (
                      <p className="flex h-full items-center justify-center text-xs text-muted-foreground">
                        Recent activity data is unavailable.
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-2">
                  <Insight
                    label="Busiest day"
                    value={
                      hasProfile && busiestDay
                        ? `${formatNumber(busiestDay.count)} · ${busiestDayLabel}`
                        : "—"
                    }
                  />
                  <Insight
                    label="Longest streak"
                    value={hasProfile ? formatDayCount(longestStreak) : "—"}
                  />
                  <Insight
                    label="Avg. active day"
                    value={hasProfile ? averagePerActiveDay.toFixed(1) : "—"}
                  />
                </div>

                <div className="mt-4 flex flex-col gap-2 text-xs text-faint sm:flex-row sm:items-center sm:justify-between">
                  <span>
                    Last 7 days: {hasProfile ? `${formatNumber(recentContributions)} contributions` : "—"}
                  </span>
                  <a
                    href={GITHUB_PROFILE_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 font-medium text-surface-invert-foreground transition-colors hover:text-surface-invert-muted"
                  >
                    Open GitHub activity
                    <ArrowUpRight className="size-3.5" aria-hidden="true" />
                  </a>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="overflow-hidden border-border bg-card/90 shadow-sm backdrop-blur">
              <CardContent className="p-5 sm:p-6">
                <div className="mb-5 flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <Github className="size-5" aria-hidden="true" />
                      <h3 className="text-subheading font-bold tracking-tight">Profile stats</h3>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                      Public GitHub profile summary.
                    </p>
                  </div>
                  <Activity className="size-4 text-success" aria-hidden="true" />
                </div>

                {statsFailed ? (
                  <div className="flex min-h-40 flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/30 p-5 text-center">
                    <Github
                      className="mb-3 size-7 text-muted-foreground"
                      aria-hidden="true"
                    />
                    <p className="text-sm font-medium">Profile stats are taking a break.</p>
                  </div>
                ) : (
                  <div className="profile-card-frame rounded-xl bg-white p-2">
                    <img
                      src={STATS_URL}
                      alt={`${GITHUB_USERNAME} GitHub profile statistics`}
                      className="w-full rounded-lg"
                      loading="lazy"
                      referrerPolicy="no-referrer"
                      onError={() => setStatsFailed(true)}
                    />
                  </div>
                )}

                <Button asChild variant="outline" className="mt-5 w-full rounded-full">
                  <a href={GITHUB_PROFILE_URL} target="_blank" rel="noopener noreferrer">
                    View profile
                    <ArrowUpRight aria-hidden="true" />
                  </a>
                </Button>
              </CardContent>
            </Card>

            <Card className="overflow-hidden border-border bg-card/90 shadow-sm backdrop-blur">
              <CardContent className="p-5 sm:p-6">
                <div className="mb-5 flex items-center gap-2">
                  <Code2 className="size-4 text-success" aria-hidden="true" />
                  <h3 className="text-subheading font-semibold">Most used languages</h3>
                </div>
                {languagesFailed ? (
                  <p className="rounded-xl border border-dashed border-border bg-muted/30 p-5 text-sm text-muted-foreground">
                    Language stats are unavailable right now.
                  </p>
                ) : (
                  <div className="profile-card-frame rounded-xl bg-white p-2">
                    <img
                      src={LANGUAGES_URL}
                      alt={`${GITHUB_USERNAME} most used GitHub languages`}
                      className="w-full rounded-lg"
                      loading="lazy"
                      referrerPolicy="no-referrer"
                      onError={() => setLanguagesFailed(true)}
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="surface-card border-surface-invert-line bg-surface-invert text-surface-invert-foreground">
              <CardContent className="p-5 sm:p-6">
                <p className="eyebrow text-faint">
                  Built in public
                </p>
                <p className="mt-3 text-lg font-semibold leading-7">
                  Learning in public, one useful experiment at a time.
                </p>
                <a
                  href={GITHUB_PROFILE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-surface-invert-muted transition-colors hover:text-surface-invert-foreground"
                >
                  Explore the repositories
                  <ArrowUpRight className="size-4" aria-hidden="true" />
                </a>
              </CardContent>
            </Card>
          </div>
        </div>

        <p className="v2-only mt-6 text-center text-xs text-muted-foreground">
          Profile cards are provided by GitHub Profile Summary Cards and may be cached
          by their service. The contribution calendar is read from GitHub&apos;s public
          calendar page and cached for 15 minutes.
        </p>
        </div>

      {/*
        v3: the calendar is the whole section. The grid, wrapped in a single
        link to the profile, then a count line - which is the shape the
        reference uses for its GitHub block. No card, no "Contribution
        calendar" heading, no day-of-week column, no rhythm chart, no profile
        summary images.
      */}
      <div className="v3-only">
        {/* No top margin: .section-head-v3 supplies the gap under the marker. */}
        <div className="flex items-center gap-3">
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
              className="gh-grid animate-pulse"
              style={gridTemplate}
              aria-label="Loading contribution calendar"
            >
              {Array.from({ length: calendarColumns }, (_, index) => (
                <div key={index} className="gh-week">
                  <span className="gh-month" />
                  {Array.from({ length: 7 }, (__, day) => (
                    <span key={day} className="gh-cell bg-gh-0" />
                  ))}
                </div>
              ))}
            </div>
          ) : profileFailed || calendarUnavailable ? (
            <p className="py-8 text-center text-[14px] text-muted-foreground">
              GitHub&apos;s contribution calendar is temporarily unavailable.
            </p>
          ) : (
            <div
              className="gh-grid"
              style={gridTemplate}
              role="grid"
              aria-label="Contribution calendar"
            >
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
                        className={`gh-cell transition-transform duration-300 motion-reduce:transition-none group-hover:scale-125 ${levelClasses[day.level] ?? levelClasses[0]}`}
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

        <div className="section-note flex items-center gap-2">
          <span className="font-mono text-[10px] uppercase tracking-wider text-faint">
            Less
          </span>
          {levelClasses.map((levelClass, index) => (
            <span key={index} className={`size-2.5 rounded-[2px] border ${levelClass}`} />
          ))}
          <span className="font-mono text-[10px] uppercase tracking-wider text-faint">
            More
          </span>
        </div>
      </div>
    </Section>
  );
}
