"use client";

import { useCallback, useEffect, useState } from "react";

import { findRenderedSection } from "@/app/lib/navigation";

/**
 * Which section the reader is currently in, by id.
 *
 * The reference point sits a little above the middle of the viewport so a
 * section counts as active while its heading is still comfortably in view,
 * rather than only once its top edge has crossed the halfway line.
 */
const REFERENCE_POINT = 0.28;

export function useScrollSpy(sectionIds: readonly string[], enabled = true) {
  const [activeSection, setActiveSection] = useState(sectionIds[0] ?? "");

  useEffect(() => {
    if (!enabled) return;

    const sections = sectionIds
      .map((id) => findRenderedSection(id))
      .filter((section): section is HTMLElement => section !== null);

    if (sections.length === 0) return;

    let frameId = 0;

    const update = () => {
      frameId = 0;
      const reference = window.scrollY + window.innerHeight * REFERENCE_POINT;
      let current = sections[0];

      for (const section of sections) {
        const top = section.getBoundingClientRect().top + window.scrollY;
        if (reference >= top && reference < top + section.offsetHeight) {
          current = section;
          break;
        }
      }

      // The last section can be too short to ever own the reference point, so
      // the bottom of the document always resolves to the last one.
      const atBottom =
        window.innerHeight + window.scrollY >=
        document.documentElement.scrollHeight - 2;
      if (atBottom) current = sections[sections.length - 1];

      setActiveSection(current.id);
    };

    const handleScroll = () => {
      if (frameId === 0) frameId = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll);

    return () => {
      if (frameId !== 0) window.cancelAnimationFrame(frameId);
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, [sectionIds, enabled]);

  return activeSection;
}

/**
 * Scrolls to a section, and reports whether it handled the navigation. Returns
 * false when the caller is on another route, where a real link navigation is
 * the right thing to do instead.
 */
export function useSectionNavigation() {
  return useCallback(
    (event: React.MouseEvent<HTMLAnchorElement>, href: string, section: string) => {
      if (
        window.location.pathname !== "/" ||
        !(href === "/" || href.startsWith("/#"))
      ) {
        return false;
      }

      event.preventDefault();
      window.history.replaceState(null, "", href);

      const behavior = window.matchMedia("(prefers-reduced-motion: reduce)")
        .matches
        ? "auto"
        : "smooth";

      window.requestAnimationFrame(() => {
        if (section === "home") {
          window.scrollTo({ top: 0, behavior });
          return;
        }

        findRenderedSection(section)?.scrollIntoView({
          behavior,
          block: "start",
        });
      });

      return true;
    },
    [],
  );
}
