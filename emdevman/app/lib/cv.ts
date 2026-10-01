import { EMAIL_ADDRESS } from "./contact";

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
 *   cvExperience[]       - title, organisation, years, and the summary blurb
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
    title: "Your Degree Here",
    detail: "Your University",
    years: "2021 - 2025",
    summary:
      "Replace this entry with your real course, and the summary with anything worth saying about it.",
  },
  {
    title: "Your Previous Degree",
    detail: "Your Previous School",
    years: "2017 - 2021",
    summary:
      "A second entry is optional - delete the whole object if you only have one.",
  },
];

export const cvExperience: CvEntry[] = [
  {
    title: "Your Job Title",
    detail: "Your Employer / Location",
    years: "2024 -Present",
    summary:
      "Replace this with what you actually did. Two or three sentences is the template's own allowance, and the role reads better with a concrete outcome in it than with a list of responsibilities.",
  },
  {
    title: "Your Previous Role",
    detail: "Your Previous Employer",
    years: "2022 - 2024",
    summary:
      "Keep entries to what is relevant to the role you are applying for. The template holds three; use as many as you need.",
  },
  {
    title: "Your Earliest Role",
    detail: "Your Earliest Employer",
    years: "2020 - 2022",
    summary: "This entry is a placeholder. Replace it or delete it.",
  },
];
