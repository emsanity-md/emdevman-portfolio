"use client";

import { useCallback } from "react";
import { flushSync } from "react-dom";

type ViewTransitionDocument = Document & {
  startViewTransition?: (
    callback: () => void,
  ) => { finished: Promise<void> };
};

const prefersReducedMotion = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * The reader's position as a proportion of the document, so a change that
 * alters page height - swapping the whole design language, or a theme that
 * reflows something measured in viewport units - leaves them looking at the same
 * thing rather than at a different part of the page.
 */
function captureScrollRatio() {
  const scrollable = document.documentElement.scrollHeight - window.innerHeight;
  return scrollable > 0 ? window.scrollY / scrollable : 0;
}

function restoreScrollRatio(ratio: number) {
  const scrollable = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
  window.scrollTo({ top: Math.round(ratio * scrollable), behavior: "auto" });
}

/**
 * Runs `commit` inside a view transition that wipes in as an expanding circle
 * growing out of `anchor`.
 *
 * Shared rather than duplicated because the reveal is a property of the design
 * language, not of one button. A reader who has watched the design switch wipe
 * across the page should see the theme wipe the same way, and the CSS half of
 * this - the `design-reveal` keyframes and the `::view-transition-*` pairing -
 * is already global, so every view transition on the root picks it up.
 *
 * `anchor` is the element the circle grows from, normally the control that was
 * pressed. Pass null to grow from the viewport centre instead.
 */
export function useRevealTransition() {
  return useCallback(
    (anchor: Element | null | undefined, commit: () => void) => {
      const ratio = captureScrollRatio();
      const doc = document as ViewTransitionDocument;

      const rect = anchor?.getBoundingClientRect();
      const originX = rect ? rect.left + rect.width / 2 : window.innerWidth / 2;
      const originY = rect ? rect.top + rect.height / 2 : window.innerHeight / 2;

      // Written onto <html>, where the keyframes read it.
      const root = document.documentElement;
      root.style.setProperty("--reveal-origin-x", `${originX}px`);
      root.style.setProperty("--reveal-origin-y", `${originY}px`);

      /*
        v1 has no motion, and that includes this transition.

        The wipe is a page-level effect rather than a component one, so it cannot
        be switched off from CSS the way the entrance animations are: it runs on
        the pseudo-elements the View Transitions API creates, which sit outside
        the document tree. So v1 commits without it. Scroll position is still
        restored, because changing design can still change the page's height.
      */
      const isV1 =
        document.documentElement.getAttribute("data-design") === "v1";

      if (isV1 || !doc.startViewTransition || prefersReducedMotion()) {
        commit();
        restoreScrollRatio(ratio);
        return;
      }

      const transition = doc.startViewTransition(() => {
        // React commits asynchronously, and the view transition snapshots the
        // DOM as soon as the callback returns.
        flushSync(commit);
      });

      // The transition rejects when it is skipped; either way, put the reader
      // back where they were.
      const restore = () => restoreScrollRatio(ratio);
      transition.finished.then(restore, restore);
    },
    [],
  );
}
