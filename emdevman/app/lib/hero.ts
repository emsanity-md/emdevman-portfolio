/**
 * The hero's words, in one place.
 *
 * These were JSX literals inside `app/v1/V1Hero.tsx`, which meant no other design
 * could use the same headline without either importing another design's component
 * or retyping it - and retyping it is how two versions of a portfolio end up
 * describing themselves differently.
 *
 * The strings are split the way the JSX split them rather than kept as one blob,
 * because the line break is load-bearing: v1 renders them as two nowrap boxes so
 * "Prompt Stack" cannot be split across lines at any desktop width, and v5 stacks
 * them the same way.
 */

/** The two display lines, in order. Never rendered as one string. */
export const heroTitleLines = ["Prompt Stack", "Developer"] as const;

/**
 * The intro paragraph.
 *
 * The middle sentence keeps its own key because v1 bolds exactly "Full Stack
 * Developer" inside it, and v5's pinned post does the same.
 */
export const heroIntro = {
  before: "I’m a passionate",
  strong: "Full Stack Developer",
  after:
    "with a strong focus on building modern, responsive, and user-friendly web applications. I enjoy turning ideas into scalable digital solutions and love working across both frontend and backend technologies to deliver seamless experiences.",
} as const;

/** The heading above the hero copy, which carries the blue accent on the name. */
export const heroGreeting = {
  before: "Hi, I’m",
  name: "Emmanuel S. Bitancor",
} as const;

/** The call-to-action labels, shared so the buttons cannot drift from the copy. */
export const heroActions = {
  primary: "View Projects",
  secondary: "Contact Me",
} as const;

/** The three capability tags that sit under the hero's buttons. */
export const heroStrengths = [
  "Full-stack",
  "Accessible",
  "Responsive",
] as const;