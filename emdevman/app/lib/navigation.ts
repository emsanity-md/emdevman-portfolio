/**
 * The site's navigation, in one place.
 *
 * Navbar (V2's pill nav), SidebarNav (v3's left rail) and Footer all read
 * from this list, so a new section only has to be added once.
 */

export const navLinks = [
  { name: "Home", href: "/", section: "home", index: "00" },
  { name: "Tech Stack", href: "/#tech-stack", section: "tech-stack", index: "01" },
  { name: "Activity", href: "/#github", section: "github", index: "02" },
  { name: "Projects", href: "/#projects", section: "projects", index: "03" },
  { name: "About", href: "/#about", section: "about", index: "04" },
  { name: "Contact", href: "/#contact", section: "contact", index: "05" },
] as const;

/** Stable identity, so effects that depend on it do not re-run every render. */
export const navSectionIds: readonly string[] = navLinks.map((link) => link.section);

/** The links that sit between the wordmark and the call to action. */
export const centerLinks = navLinks.slice(1, -1);

/** Routes that render without site chrome. */
export const hiddenRoutes = ["/error/private", "/error/site", "/404"];
