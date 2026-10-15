/**
 * Work history, shared by every design.
 *
 * Lives here rather than in `lib/cv.ts` because the CV sheet is one design's
 * rendering of it. `lib/data.ts` and `lib/tech.ts` earn that separation by
 * being read by designs the CV is not; `cvExperience` was the only place the
 * repo held these two roles, which meant the homepage had nowhere to read them
 * from without importing another design's data.
 *
 * No dates are derived and nothing is inferred. `period` is stored as the string
 * it is displayed as, because "Present" is not a year and splitting it into two
 * `Date`s would be a claim about an end date that does not exist.
 */

export interface ExperienceEntry {
  /** The bold line. */
  role: string;
  /** The line under it. */
  organisation: string;
  /**
   * The date column. Free text rather than two dates for the reason in the note
   * above, and because the two ranges here are shaped differently: one is open
   * and one is a quarter.
   */
  period: string;
  /**
   * What the work actually was. One or two lines, and only what is known - the
   * rule for this file is that a line here has to be something that happened,
   * not something a portfolio wishes had happened.
   */
  outcomes: string[];
}

/** Most recent first: the order a timeline reads in. */
export const experience: ExperienceEntry[] = [
  {
    role: "IT Support/Assistant",
    organisation: "Municipality of Sierra Bullones, Bohol",
    period: "2026 - Present",
    outcomes: [
      "Handle user data management, networking and day-to-day operations for the municipal office.",
    ],
  },
  {
    role: "On-the-Job Training (OJT)",
    organisation: "Bohol Island State University - Bilar Campus",
    period: "April - June 2026",
    outcomes: [
      "Created the CTECH x CCSET website end to end - UI/UX design, implementation and user data management.",
      "Worked through data structures and algorithms as part of the training.",
    ],
  },
];