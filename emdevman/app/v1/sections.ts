import { EMAIL_MAILTO } from "@/app/lib/contact";

/**
 * v1's sections, in page order.
 *
 * v1 has no Activity section, so this is not `navLinks` with an entry removed -
 * its own list with no hole where GitHub was. `home` is the wordmark's target
 * as well as a link in the bar, which is why the navbar reads `id`/`name` off
 * this list and re-orders them rather than slicing from index 1.
 *
 * `label` is the short eyebrow each section heads itself with. No v1 markup
 * reads it from here - every section passes its own label prop to `V1Section` -
 * so it is kept as the single place the section's identity is written down, not
 * as the source the components read.
 */
export const v1Sections = [
  { id: "home", name: "Home", label: "introduction" },
  { id: "tech-stack", name: "Tech Stack", label: "the toolkit" },
  { id: "projects", name: "Projects", label: "projects" },
  { id: "about", name: "About", label: "background" },
  { id: "contact", name: "Contact", label: "get in touch" },
] as const;

/** Shared by the hero and the footer, which are the only two places they appear. */
export const v1Socials = [
  { label: "GitHub", href: "https://github.com/emsanity-md" },
  {
    label: "LinkedIn",
    href: "https://www.linkedin.com/in/emmanuel-bitancor-40a582426",
  },
  { label: "Email", href: EMAIL_MAILTO },
] as const;
