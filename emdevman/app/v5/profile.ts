import profileImage from "@/app/assets/images/2x2.1.jpg";
import { cvProfile } from "@/app/lib/cv";
import { techCategories } from "@/app/lib/tech";
import { projects } from "@/app/lib/data";
import { navLinks } from "@/app/lib/navigation";

/**
 * The numbers in the profile header, read off the data rather than typed.
 *
 * The old draft of this layout hardcoded "12 projects, 15 technologies, 3
 * years" - and all three numbers were already wrong, because `lib/data.ts` holds
 * ten projects and `lib/tech.ts` holds thirteen skills. A stats row that disagrees
 * with the page it sits above is worse than no stats row, so each figure counts
 * the thing it claims to count:
 *
 *   - projects, from the array that renders the Projects tab
 *   - technologies, summed across the three stack groups
 *   - years, from `SINCE_YEAR` below
 *
 * Change a project or add a skill and the header moves with it.
 */

/**
 * When this started being published.
 *
 * `lib/cv.ts` dates the degree from 2021, but studying is not shipping. The
 * design switch lists v1 as "2023-2025", which is the span the public work
 * actually covers, so that is what the years figure counts from.
 */
export const SINCE_YEAR = 2023;

export const V5_AVATAR = profileImage;

export const V5_HANDLE = "@emsanity-md";

export const V5_FULL_NAME = `${cvProfile.given} ${cvProfile.family}`;

export const V5_SITE_LABEL = "emmanuelbitancor.vercel.app";

export const V5_STATS = {
  projects: projects.length,
  technologies: techCategories.reduce(
    (total, category) => total + category.skills.length,
    0,
  ),
  years: Math.max(1, new Date().getFullYear() - SINCE_YEAR),
} as const;

/**
 * How many projects the Home tab shows as featured posts.
 *
 * Four, because the Home feed is a pinned post plus featured work, not the whole
 * catalogue - a reader who wants all ten presses Projects, which is what the tab
 * is for. This is also the count the right rail's Featured card is built from, so
 * the two agree by construction.
 */
export const FEATURED_COUNT = 4;

/**
 * The projects a "featured" list means.
 *
 * The first four in `lib/data.ts`, which is the order every design has rendered
 * them in and the order they were added. There is no featured flag to read, and
 * inventing one would need someone to maintain it.
 */
export const featuredProjects = projects.slice(0, FEATURED_COUNT);

/**
 * The rail's index.
 *
 * The nav, minus Home. The Home entry is not a section to go to - it is the feed
 * itself, and the logo above is the way back to it - so listing it twice would be
 * two controls for one destination. The labels come from `navLinks`, so this
 * cannot fall out of step with the tabs.
 */
export const railLinks = navLinks.slice(1);

/**
 * The "Top Tech" list in the right rail.
 *
 * Flattened from `techCategories` and de-duplicated, so a technology that appears
 * in two groups - `Tailwind CSS` is in the Frontend group and `Git / GitHub` is
 * in the tools group, and both appear again as project tags - is listed once.
 * `lib/tech.ts` remains the only place the toolkit is written down; this is a
 * view over it, not a second list.
 */
export const topTech = Array.from(
  new Set(techCategories.flatMap((category) => category.skills.map((skill) => skill.name))),
);

/**
 * The technologies shown in the Top Tech card, capped.
 *
 * Six, which is what fits above the fold of a 350px column without the card
 * pushing the Featured card below it. The full set is on the Tech Stack tab.
 */
export const TOP_TECH_COUNT = 6;