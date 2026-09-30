import { EMAIL_MAILTO } from "@/app/lib/contact";

/**
 * v1's sections, in page order.
 *
 * v1 has no Activity section, so this is not `navLinks` with an entry removed -
 * its own list, numbered 00-04 with no hole where GitHub was. `home` is the
 * wordmark's target rather than a link in the bar, which is why the nav derives
 * from `slice(1)`.
 */
export const v1Sections = [
  { id: "home", name: "Home", label: "introduction" },
  { id: "tech-stack", name: "Tech Stack", label: "the toolkit" },
  { id: "projects", name: "Projects", label: "selected work" },
  { id: "about", name: "About", label: "background" },
  { id: "contact", name: "Contact", label: "get in touch" },
] as const;

export const v1NavLinks = v1Sections.slice(1);

/** Shared by the hero and the footer, which are the only two places they appear. */
export const v1Socials = [
  { label: "GitHub", href: "https://github.com/emsanity-md" },
  {
    label: "LinkedIn",
    href: "https://www.linkedin.com/in/emmanuel-bitancor-40a582426",
  },
  { label: "Email", href: EMAIL_MAILTO },
] as const;
