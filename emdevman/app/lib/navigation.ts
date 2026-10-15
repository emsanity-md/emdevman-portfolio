/**
 * The site's navigation, in one place.
 *
 * Navbar (V2's pill nav), SidebarNav (v3's left rail) and Footer all read
 * from this list, so a new section only has to be added once.
 *
 * The list above is now v3's specifically. v3 has six sections; the other
 * designs have their own counts, and a nav that offers "Activity" and "About"
 * on a page with neither is two links that go nowhere. `v2NavLinks` below is
 * the five that v2 actually has, and the nav picks between them by design.
 */

export const navLinks = [
  { name: "Home", href: "/", section: "home", index: "00" },
  { name: "Tech Stack", href: "/#tech-stack", section: "tech-stack", index: "01" },
  { name: "Activity", href: "/#github", section: "github", index: "02" },
  { name: "Projects", href: "/#projects", section: "projects", index: "03" },
  { name: "About", href: "/#about", section: "about", index: "04" },
  { name: "Contact", href: "/#contact", section: "contact", index: "05" },
] as const;

/**
 * The v2 navigation: the five sections of the rebuilt homepage.
 *
 * `experience` is the only section id in this list that `navLinks` does not
 * have, and `#github` and `#about` are the two it has that this page does not.
 * `app/v2/V2Experience.tsx` owns that id, so a rename on either side shows up
 * here as a link that does not move rather than as a silent scroll to the top.
 */
export const v2NavLinks = [
  { name: "Home", href: "/", section: "home", index: "00" },
  { name: "Work", href: "/#projects", section: "projects", index: "01" },
  { name: "Experience", href: "/#experience", section: "experience", index: "02" },
  { name: "Stack", href: "/#tech-stack", section: "tech-stack", index: "03" },
  { name: "Contact", href: "/#contact", section: "contact", index: "04" },
] as const;

/** Stable identity, so effects that depend on it do not re-run every render. */
export const navSectionIds: readonly string[] = navLinks.map((link) => link.section);

/** The same, for v2. Frozen so the identity holds across renders. */
export const v2NavSectionIds: readonly string[] = Object.freeze(
  v2NavLinks.map((link) => link.section),
);

/** The links that sit between the wordmark and the call to action. */
export const centerLinks = navLinks.slice(1, -1);

/** v2's equivalent: everything but Home and Contact. */
export const v2CenterLinks = v2NavLinks.slice(1, -1);

/** Routes that render without site chrome. */
export const hiddenRoutes = ["/error/private", "/error/site", "/404"];

/**
 * The element a section id refers to *in the design currently on screen*.
 *
 * Every design's markup is in the document at once - `page.tsx` mounts the v1
 * tree and the v2/v3 tree side by side and lets `data-design` pick which one
 * shows - so a section id exists twice, and `getElementById` returns whichever
 * comes first in the document. That is the hidden v1 copy whenever v2 or v3 is
 * the design on screen.
 *
 * A hidden duplicate is not harmless. It has no boxes, so its `top` and its
 * `offsetHeight` are both 0, and then no section ever owns the reference point:
 * the scroll spy sits on the first link for the length of the page, and
 * `scrollIntoView` on a `display: none` element moves nowhere, so the links
 * scroll nowhere either. Home is the one link that works, and only because it
 * is special-cased to `scrollTo(0)` without an element lookup at all. A plain
 * `#fragment` anchor has the same problem, because the browser resolves a
 * fragment exactly the way `getElementById` does.
 *
 * An empty `getClientRects()` is the test for "not on screen": `display: none`
 * on the element or on any ancestor produces no rects, while a section is an
 * ordinary in-flow box that still has one when it is empty.
 *
 * The id is compared as a value rather than interpolated into a selector, so a
 * fragment out of a pasted URL cannot break the lookup.
 */
export function findRenderedSection(id: string): HTMLElement | null {
  const first = document.getElementById(id);
  if (first && first.getClientRects().length > 0) return first;

  for (const element of document.querySelectorAll<HTMLElement>("[id]")) {
    if (element.id === id && element.getClientRects().length > 0) return element;
  }

  return null;
}
