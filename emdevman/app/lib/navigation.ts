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
