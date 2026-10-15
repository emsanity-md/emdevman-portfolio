import { EMAIL_ADDRESS } from "./contact";
import { experience } from "./experience";

/**
 * v4's content - the CV design.
 *
 * The CV template this design is built from carries three sections the rest of
 * the site has no equivalent of: Education, Job Experience and References. The
 * repo has never held education or work-history data, so rather than invent it
 * the two sections are built from obviously-placeholder values that say what they
 * are. `lib/about.ts` and `lib/tech.ts` stay the single source of truth for
 * everything that *does* have real data.
 *
 * ---------------------------------------------------------------------------
 * REPLACE THESE BEFORE PUBLISHING
 *
 *   cvProfile.phone      - a real phone number, or drop the field entirely
 *   cvProfile.location   - the city/country you actually build from
 *   cvEducation[]        - school, degree, and years, for each entry
 *
 * `cvExperience` is no longer on that list: the work history moved to
 * `lib/experience.ts`, which the CV sheet now reads rather than keeping its own
 * copy. Edit it there.
 *
 * The `phone` and `location` fields are optional: entries that leave them unset
 * are skipped by the rail rather than rendered empty, so removing a value from
 * here removes it from the page.
 * ---------------------------------------------------------------------------
 */

export interface CvProfile {
  /**
   * Split so the surname can take the accent colour on its own, which is the one
   * typographic flourish the template spends its yellow on.
   */
  given: string;
  family: string;
  title: string;
  /** Shown under the title in the header band. */
  tagline: string;
  /** Optional - the rail skips the row when this is absent. */
  phone?: string;
  /** Optional, same rule. */
  location?: string;
}

export const cvProfile: CvProfile = {
  given: "Emmanuel S.",
  family: "Bitancor",
  title: "Full-Stack Developer",
  tagline: "Next.js, React, TypeScript",
  phone: undefined,
  location: "Philippines",
};

export interface CvContactLink {
  label: string;
  value: string;
  href: string;
  /** Whether to open in a new tab. A mailto has nothing to gain from it. */
  external: boolean;
}

/**
 * The rail's "Contact Me" block.
 *
 * Built from `lib/contact.ts` for the address rather than repeated, so a change
 * to the one place that owns it reaches every design. The socials are the same
 * two `app/v1/sections.ts` lists point at; they are declared here rather than
 * imported because `v1Socials` is v1's list and reading another design's data
 * from this one would invert the dependency.
 */
export const cvContact: CvContactLink[] = [
  {
    label: "Email",
    value: EMAIL_ADDRESS,
    href: `mailto:${EMAIL_ADDRESS}`,
    external: false,
  },
  {
    label: "Website",
    value: "emmanuelbitancor.vercel.app",
    href: "https://emmanuelbitancor.vercel.app",
    external: true,
  },
  {
    label: "GitHub",
    value: "github.com/emsanity-md",
    href: "https://github.com/emsanity-md",
    external: true,
  },
  {
    label: "LinkedIn",
    value: "in/emmanuel-bitancor",
    href: "https://www.linkedin.com/in/emmanuel-bitancor-40a582426",
    external: true,
  },
];

export interface CvEntry {
  /** The bold line - a degree, or a job title. */
  title: string;
  /** The line under it - a school, or an organisation. */
  detail: string;
  /**
   * A date range in the template's own format ("2011 - 2013", "2020 -Present").
   * Kept as a string rather than two dates because the template sets one entry's
   * range open-ended, and "Present" is not a year.
   */
  years: string;
  /** Optional supporting copy. The rail renders nothing when absent. */
  summary?: string;
  /** Optional outbound link, rendered as a trailing arrow on the title. */
  href?: string;
}

export const cvEducation: CvEntry[] = [
  {
    title: "Computer Science",
    detail: "Bohol Island State University - Bilar Campus",
    years: "2021 - 2026",
  },
  {
    title: "Information Communications and Technology",
    detail: "Sierra Bullones Technical Vocational High School",
    years: "2016 - 2021",
  },
];

/**
 * The CV's work-history rows.
 *
 * Derived from `lib/experience.ts`, which is the single source of truth for
 * these two roles. The CV renders them as a single `summary` string because
 * that is the shape its template has; the homepage renders the same lines as a
 * list. Joining with a space rather than inventing sentence punctuation keeps
 * the two renderings identical in wording, so a fix to one is a fix to both.
 */
export const cvExperience: CvEntry[] = experience.map((entry) => ({
  title: entry.role,
  detail: entry.organisation,
  years: entry.period,
  summary: entry.outcomes.join(" "),
}));
