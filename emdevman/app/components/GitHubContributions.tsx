/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  ArrowUpRight,
  CalendarDays,
  Code2,
  GitCommitHorizontal,
  GitFork,
  Github,
  Star,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";

import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent } from "@/app/components/ui/card";

const GITHUB_USERNAME = "emsanity-md";
const GITHUB_PROFILE_URL = `https://github.com/${GITHUB_USERNAME}`;
const STATS_URL = `https://github-profile-summary-cards.vercel.app/api/cards/profile-details?username=${GITHUB_USERNAME}&theme=default`;
const LANGUAGES_URL = `https://github-profile-summary-cards.vercel.app/api/cards/repos-per-language?username=${GITHUB_USERNAME}&theme=default`;
const WEEKS = 53;

interface ContributionPoint {
  date: string;
  count: number;
  level: number;
}

interface ProfileData {
  publicRepos: number;
  followers: number;
  following: number;
  totalStars: number;
  totalForks: number;
  topLanguage: string;
  contributionsAvailable: boolean;
  totalContributions: number;
  contributions: ContributionPoint[];
}

interface ProfileResponse {
  ok?: boolean;
  profile?: ProfileData | null;
}

const levelClasses = [
  "border-zinc-200 bg-zinc-100 dark:border-[#30363d] dark:bg-[#161b22]",
  "border-zinc-300 bg-zinc-300 dark:border-[#0e4429] dark:bg-[#0e4429]",
  "border-zinc-400 bg-zinc-400 dark:border-[#006d32] dark:bg-[#006d32]",
  "border-zinc-500 bg-zinc-500 dark:border-[#26a641] dark:bg-[#26a641]",
  "border-zinc-700 bg-zinc-700 dark:border-[#39d353] dark:bg-[#39d353]",
];

function toDateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function buildContributionDays(points: ContributionPoint[]) {
  if (points.length === 0) return [];

  const sortedPoints = [...points].sort((a, b) => a.date.localeCompare(b.date));
  const latestPoint = sortedPoints[sortedPoints.length - 1];
  const latestDate = new Date(`${latestPoint.date}T12:00:00`);
  const start = new Date(latestDate);
  start.setDate(start.getDate() - (latestDate.getDay() + (WEEKS - 1) * 7));
  const pointsByDate = new Map(sortedPoints.map((point) => [point.date, point]));

  return Array.from({ length: WEEKS * 7 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
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

function MetricCard({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <Card className="border-border bg-card/80 shadow-sm backdrop-blur">
      <CardContent className="flex items-center gap-3 p-4">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-muted text-zinc-700 dark:text-zinc-200">
          <Icon className="size-4" aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-xs text-muted-foreground">{label}</p>
          <p className="mt-0.5 text-lg font-semibold tracking-tight">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function Insight({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-3">
      <p className="text-[10px] uppercase tracking-[0.12em] text-zinc-400">{label}</p>
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

  useEffect(() => {
    const controller = new AbortController();

    const loadProfile = async () => {
      try {
        const response = await fetch("/api/github-profile", {
          signal: controller.signal,
          cache: "no-store",
        });
        if (!response.ok) throw new Error("Profile request failed");
        const result = (await response.json()) as ProfileResponse;
        if (!result.ok || !result.profile) throw new Error("Profile unavailable");
        setProfile(result.profile);
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setProfileFailed(true);
      } finally {
        setProfileLoading(false);
      }
    };

    void loadProfile();
    return () => controller.abort();
  }, []);

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

  const calendarUnavailable = Boolean(
    !profileLoading && !profileFailed && profile && !profile.contributionsAvailable,
  );
  const hasProfile = !profileLoading && Boolean(profile);
  const statusLabel = profileLoading
    ? "Syncing public data"
    : profileFailed
      ? "Profile data unavailable"
      : calendarUnavailable
        ? "Calendar unavailable"
        : "Live public data";
  const statusDotClass = profileLoading
    ? "animate-pulse bg-amber-400"
    : profileFailed || calendarUnavailable
      ? "bg-zinc-400"
      : "bg-emerald-400";
  return (
    <section
      id="github"
      className="relative isolate w-full overflow-hidden border-y border-zinc-200/70 bg-zinc-50/60 px-4 py-20 transition-colors duration-300 md:px-6 md:py-24 dark:border-zinc-800/70 dark:bg-zinc-950/30"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-32 -top-32 -z-10 size-[30rem] rounded-full bg-emerald-400/10 blur-3xl dark:bg-emerald-500/10"
      />

      <div className="container relative mx-auto max-w-6xl">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <div className="max-w-3xl">
            <Badge
              variant="outline"
              className="bg-background/80 px-3 py-1 font-mono text-xs backdrop-blur"
            >
              <Github className="size-3.5" aria-hidden="true" />
              Open source rhythm
            </Badge>
            <h2 className="mt-5 text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
              GitHub activity
            </h2>
            <p className="mt-4 max-w-2xl text-base leading-7 text-zinc-500 md:text-xl dark:text-zinc-400">
              A closer look at the public work, experiments, and small consistent
              contributions behind the projects.
            </p>
          </div>

          <div className="flex flex-col items-start gap-4 lg:items-end">
            <Badge
              variant="muted"
              className="gap-2 bg-background/70 px-3 py-1.5 font-mono text-[11px] backdrop-blur"
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
        </div>

        <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <MetricCard
            icon={Github}
            label="Public repositories"
            value={hasProfile ? formatNumber(profile?.publicRepos ?? 0) : "—"}
          />
          <MetricCard
            icon={GitCommitHorizontal}
            label="Contributions"
            value={hasProfile ? formatNumber(profile?.totalContributions ?? 0) : "—"}
          />
          <MetricCard
            icon={CalendarDays}
            label="Active days"
            value={hasProfile ? formatDayCount(activeDays) : "—"}
          />
          <MetricCard
            icon={Star}
            label="Stars earned"
            value={hasProfile ? formatNumber(profile?.totalStars ?? 0) : "—"}
          />
          <MetricCard
            icon={GitFork}
            label="Forks"
            value={hasProfile ? formatNumber(profile?.totalForks ?? 0) : "—"}
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
                      className="size-5 text-zinc-600 dark:text-zinc-300"
                      aria-hidden="true"
                    />
                    <h3 className="text-xl font-bold tracking-tight">
                      Contribution calendar
                    </h3>
                  </div>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                    A live mirror of GitHub&apos;s public contribution calendar. Cell
                    levels and daily counts come directly from GitHub.
                  </p>
                </div>
                <Badge variant="muted" className="w-fit font-mono text-[10px]">
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
                      className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-emerald-700 hover:underline dark:text-emerald-400"
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
                          className="w-4 text-[9px] text-muted-foreground"
                        >
                          {monthLabels[index]}
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <div className="grid w-5 grid-rows-7 gap-1 text-[8px] leading-4 text-muted-foreground">
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

            <Card className="overflow-hidden border-zinc-800 bg-zinc-900 text-zinc-50 shadow-sm dark:bg-zinc-950">
              <CardContent className="p-5 sm:p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <TrendingUp className="size-5 text-zinc-300" aria-hidden="true" />
                      <h3 className="text-lg font-semibold">Contribution rhythm</h3>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-zinc-400">
                      A quick read on the last 53 weeks of public activity.
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className="w-fit border-white/15 bg-white/5 font-mono text-[10px] text-zinc-300"
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
                            <span className="text-[9px] text-zinc-500">{dayLabel}</span>
                          </div>
                        );
                      })
                    ) : (
                      <p className="flex h-full items-center justify-center text-xs text-zinc-500">
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

                <div className="mt-4 flex flex-col gap-2 text-xs text-zinc-400 sm:flex-row sm:items-center sm:justify-between">
                  <span>
                    Last 7 days: {hasProfile ? `${formatNumber(recentContributions)} contributions` : "—"}
                  </span>
                  <a
                    href={GITHUB_PROFILE_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 font-medium text-zinc-200 transition-colors hover:text-white"
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
                      <h3 className="text-lg font-bold tracking-tight">Profile stats</h3>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                      Public GitHub profile summary.
                    </p>
                  </div>
                  <Activity className="size-4 text-emerald-500" aria-hidden="true" />
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
                  <div className="rounded-xl bg-white p-2 dark:bg-zinc-100">
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
                  <Code2 className="size-4 text-emerald-500" aria-hidden="true" />
                  <h3 className="text-lg font-semibold">Most used languages</h3>
                </div>
                {languagesFailed ? (
                  <p className="rounded-xl border border-dashed border-border bg-muted/30 p-5 text-sm text-muted-foreground">
                    Language stats are unavailable right now.
                  </p>
                ) : (
                  <div className="rounded-xl bg-white p-2 dark:bg-zinc-100">
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

            <Card className="border-zinc-800 bg-zinc-900 text-zinc-50 shadow-sm dark:bg-zinc-950">
              <CardContent className="p-5 sm:p-6">
                <p className="font-mono text-xs uppercase tracking-[0.16em] text-zinc-400">
                  Built in public
                </p>
                <p className="mt-3 text-lg font-semibold leading-7">
                  Learning in public, one useful experiment at a time.
                </p>
                <a
                  href={GITHUB_PROFILE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-zinc-300 transition-colors hover:text-white"
                >
                  Explore the repositories
                  <ArrowUpRight className="size-4" aria-hidden="true" />
                </a>
              </CardContent>
            </Card>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Profile cards are provided by GitHub Profile Summary Cards and may be cached
          by their service. The contribution calendar is read from GitHub&apos;s public
          calendar page and cached for 15 minutes.
        </p>
      </div>
    </section>
  );
}
