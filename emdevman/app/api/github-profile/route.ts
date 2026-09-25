import { unstable_cache } from "next/cache";
import { NextResponse } from "next/server";

const GITHUB_USERNAME = "emsanity-md";
const CACHE_SECONDS = 900;

export const dynamic = "force-dynamic";
export const revalidate = 900;

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

const getCachedProfile = unstable_cache(
  async () => {
    const headers = {
      Accept: "application/vnd.github+json, text/html",
      "User-Agent": "emdevman-portfolio",
    };

    const [profileResponse, reposResponse, contributionsResponse] =
      await Promise.all([
        fetch(`https://api.github.com/users/${GITHUB_USERNAME}`, {
          headers,
          cache: "no-store",
        }),
        fetch(
          `https://api.github.com/users/${GITHUB_USERNAME}/repos?per_page=100&sort=pushed`,
          { headers, cache: "no-store" },
        ),
        fetch(`https://github.com/users/${GITHUB_USERNAME}/contributions`, {
          headers,
          cache: "no-store",
        }).catch(() => null),
      ]);

    if (!profileResponse.ok || !reposResponse.ok) return null;

    const profile = (await profileResponse.json()) as GitHubProfile;
    const repos = (await reposResponse.json()) as GitHubRepo[];
    if (!Array.isArray(repos)) return null;

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

    const contributions = contributionsResponse?.ok
      ? parseContributionCalendar(await contributionsResponse.text())
      : [];
    const totalContributions = contributions.reduce(
      (total, point) => total + point.count,
      0,
    );

    return {
      publicRepos: profile.public_repos ?? 0,
      followers: profile.followers ?? 0,
      following: profile.following ?? 0,
      totalStars,
      totalForks,
      topLanguage: topLanguage ?? "—",
      contributionsAvailable: contributions.length > 0,
      totalContributions,
      contributions,
    };
  },
  ["github-profile-v2", GITHUB_USERNAME],
  { revalidate: CACHE_SECONDS },
);

export async function GET() {
  try {
    const profile = await getCachedProfile();
    if (!profile) {
      return NextResponse.json({ ok: false, profile: null });
    }
    return NextResponse.json({ ok: true, profile });
  } catch {
    return NextResponse.json({ ok: false, profile: null });
  }
}
