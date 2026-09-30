"use client";

import { useEffect } from "react";

import { findRenderedSection } from "@/app/lib/navigation";

/**
 * Repairs an in-page anchor jump that lands on a hidden copy of its target.
 *
 * The nav links do not need this - `useSectionNavigation` resolves the element
 * itself - but the footer's index, v3's per-section links ("all work", "more")
 * and any pasted or shared `/#section` URL are plain `#fragment` navigations,
 * and the browser resolves a fragment exactly the way `getElementById` does:
 * to whichever element with that id comes first in the document. Under v2 or v3
 * that is the v1 copy, which is `display: none` and has no box to scroll to, so
 * the hash changes and the page does not move.
 *
 * `hashchange` rather than a click handler, so nothing is intercepted: the
 * browser has already done its own jump by the time the event fires, so the only
 * thing left to do is put the reader where the jump meant to go. Middle-click,
 * cmd-click and Back all keep behaving natively for free.
 *
 * The fragment is used raw. `getElementById` does not decode either, so an
 * encoded id finds no target here exactly as it finds none in the browser, and
 * the two stay in agreement.
 */
export function AnchorResolver() {
  useEffect(() => {
    /*
      `instant` on load, because that is not a navigation the reader asked for -
      the page is still settling and its entrance is running. A hash the reader
      * did ask for gets `auto`, which defers to the design's own
      `scroll-behavior`: smooth under v2 and v3, and an honest jump under v1,
      which promises no motion.
    */
    const resolveHash = (behavior: ScrollBehavior) => {
      const id = window.location.hash.slice(1);
      if (!id) return;

      // The browser's own target already has a box, so its jump was real.
      const native = document.getElementById(id);
      if (!native || native.getClientRects().length > 0) return;

      findRenderedSection(id)?.scrollIntoView({ behavior, block: "start" });
    };

    resolveHash("instant");

    const handleHashChange = () => resolveHash("auto");
    window.addEventListener("hashchange", handleHashChange);

    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  return null;
}
