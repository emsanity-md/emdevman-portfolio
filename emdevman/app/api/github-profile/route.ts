import { unstable_cache } from "next/cache";
import { NextResponse } from "next/server";

const GITHUB_USERNAME = "emsanity-md";
const CACHE_SECONDS = 900;

/* GitHub's contribution graph starts in 2008, so that is the floor. */
const EARLIEST_YEAR = 2008;

const HTML_HEADERS = {
  Accept: "text/html",
  "User-Agent": "emdevman-portfolio",
};

/**
 * A `GITHUB_TOKEN` lifts the limit from 60 to 5000 requests an hour, which is
 * the difference between a section that works and one that disappears. Optional
 * - without it this still runs, it just has an hour to spend 60 requests in.
 */
const API_HEADERS: Record<string, string> = {
  Accept: "application/vnd.github+json",
  "User-Agent": "emdevman-portfolio",
  ...(process.env.GITHUB_TOKEN
    ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` }
    : {}),
};

interface GitHubProfile {
  public_repos: number;
  followers: number;
  following: number;
}

interface GitHubRepo {
  stargazers_count: number;
  forks_count: number;
  language: string | null;
}

interface ContributionPoint {
  date: string;
  count: number;
  level: number;
}

const contributionCellPattern =
  /<td\b(?=[^>]*\bdata-date="(\d{4}-\d{2}-\d{2})")(?=[^>]*\bdata-level="([0-4])")[^>]*>/gi;

function parseContributionCalendar(html: string): ContributionPoint[] {
  const points = new Map<string, ContributionPoint>();

  for (const match of html.matchAll(contributionCellPattern)) {
    const date = match[1];
    const level = Number(match[2]);
    const matchIndex = match.index ?? 0;
    const tagEnd = matchIndex + match[0].length;
    const cellEnd = html.indexOf("</td>", tagEnd);
    const tooltipStart = cellEnd >= 0 ? html.indexOf("<tool-tip", cellEnd) : -1;
    const tooltipEnd =
      tooltipStart >= 0 ? html.indexOf("</tool-tip>", tooltipStart) : -1;
    const tooltip =
      tooltipStart >= 0 && tooltipEnd >= 0
        ? html.slice(tooltipStart, tooltipEnd)
        : "";

    if (!date || Number.isNaN(level)) continue;

    const countMatch = tooltip.match(/(\d+)\s+contribution/i);
    const count = countMatch ? Number(countMatch[1]) : level > 0 ? 1 : 0;

    points.set(date, { date, count, level });
  }

  return [...points.values()].sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * `null` means GitHub's default rolling last-12-months window. Any other value
 * is a calendar year, which the contributions page serves via `from`/`to`.
 * Note that `?year=` is silently ignored by GitHub - only `from`/`to` works.
 */
function parseYear(raw: string | null) {
  if (raw === null) return null;
  const year = Number(raw);
  const current = new Date().getUTCFullYear();
  if (!Number.isInteger(year) || year < EARLIEST_YEAR || year > current) return null;
  return year;
}

function contributionsUrl(year: number | null) {
  const base = `https://github.com/users/${GITHUB_USERNAME}/contributions`;
  return year === null
    ? base
    : `${base}?from=${year}-01-01&to=${year}-12-31`;
}

/**
 * Deliberately outside `unstable_cache`.
 *
 * The calendar is the one part of this payload that has to be current, and the
 * old 15 minute cache was actively harmful: a transient failure - GitHub
 * rate-limiting, or a markup change breaking the parse - was cached as an empty
 * calendar for the full 15 minutes, which is exactly the "the calendar stopped
 * updating" symptom.
 */
async function fetchContributions(year: number | null): Promise<ContributionPoint[]> {
  try {
    const response = await fetch(contributionsUrl(year), {
      headers: HTML_HEADERS,
      cache: "no-store",
    });
    if (!response.ok) return [];
    return parseContributionCalendar(await response.text());
  } catch {
    return [];
  }
}

/**
 * The stats that genuinely only move slowly: repo count, stars, languages.
 * Fifteen minutes is far tighter than these change.
 */
const getCachedStats = unstable_cache(
  async () => {
    const [profileResponse, reposResponse] = await Promise.all([
      fetch(`https://api.github.com/users/${GITHUB_USERNAME}`, {
        headers: API_HEADERS,
        cache: "no-store",
      }),
      fetch(
        `https://api.github.com/users/${GITHUB_USERNAME}/repos?per_page=100&sort=pushed`,
        { headers: API_HEADERS, cache: "no-store" },
      ),
    ]);

    /*
      Throws rather than returning `null`.

      `unstable_cache` only writes to the cache when the wrapped function
      resolves, so throwing means a failed fetch - a rate-limit 403, GitHub
      being briefly down - is never cached. Returning `null` cached the failure
      for the full 900s, which is how a momentary 403 turned into "this section
      is broken" for a quarter of an hour.
    */
    if (!profileResponse.ok || !reposResponse.ok) {
      throw new Error(
        `GitHub API ${profileResponse.status}/${reposResponse.status}`,
      );
    }

    const profile = (await profileResponse.json()) as GitHubProfile;
    const repos = (await reposResponse.json()) as GitHubRepo[];
    if (!Array.isArray(repos)) throw new Error("GitHub repos payload not a list");

    const languageCounts = new Map<string, number>();
    let totalStars = 0;
    let totalForks = 0;

    repos.forEach((repo) => {
      totalStars += repo.stargazers_count ?? 0;
      totalForks += repo.forks_count ?? 0;
      if (repo.language) {
        languageCounts.set(repo.language, (languageCounts.get(repo.language) ?? 0) + 1);
      }
    });

    const topLanguage = [...languageCounts.entries()].sort(
      (a, b) => b[1] - a[1],
    )[0]?.[0];

    return {
      publicRepos: profile.public_repos ?? 0,
      followers: profile.followers ?? 0,
      following: profile.following ?? 0,
      totalStars,
      totalForks,
      topLanguage: topLanguage ?? "—",
    };
  },
  ["github-stats-v1", GITHUB_USERNAME],
  { revalidate: CACHE_SECONDS },
);

export async function GET(request: Request) {
  const year = parseYear(new URL(request.url).searchParams.get("year"));

  /*
    Two independent sources, fetched and failed independently.

    The stats come from `api.github.com`, which is rate limited to 60 requests an
    hour per IP without a token. The contributions come from the *website*
    (`github.com/users/.../contributions`, scraped HTML), which is not rate
    limited at all.

    They used to be joined behind a single `if (!stats) return { ok: false }`,
    which meant a rate-limited stats call threw away a perfectly good calendar
    that had already been fetched - the whole section went blank because of a
    number it did not even need to draw the calendar.
  */
  const [statsResult, contributionsResult] = await Promise.allSettled([
    getCachedStats(),
    fetchContributions(year),
  ]);

  const stats = statsResult.status === "fulfilled" ? statsResult.value : null;
  const contributions =
    contributionsResult.status === "fulfilled" ? contributionsResult.value : [];
  const totalContributions = contributions.reduce(
    (total, point) => total + point.count,
    0,
  );

  return NextResponse.json({
    ok: true,
    profile: {
      publicRepos: stats?.publicRepos ?? null,
      followers: stats?.followers ?? null,
      following: stats?.following ?? null,
      totalStars: stats?.totalStars ?? null,
      totalForks: stats?.totalForks ?? null,
      topLanguage: stats?.topLanguage ?? null,
      statsAvailable: stats !== null,
      contributions,
      contributionsAvailable: contributions.length > 0,
      totalContributions,
      window: { year },
    },
  });
}
