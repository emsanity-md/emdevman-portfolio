"use client";

import { useEffect, useState } from "react";

import "./loading-overlay.css";

/**
 * The site's page loader.
 *
 * One dark screen, the monogram and a moving rule, shown over every design. It
 * used to be a terminal built in the DOM, with a boot checklist and a network
 * diagnostic that timed `/api/ping`; that measured the connection but told the
 * reader nothing they could act on. The page is a portfolio, not a status
 * monitor, so the loader is now the same on every design and measures nothing.
 *
 * The component is mounted once in the root layout, so it does not come back on
 * client-side route changes. It reads no design state: every design gets the
 * same wait.
 *
 * `data-app-loaded` is written onto <html> as the loader starts to leave. The
 * v5 hero uses that attribute for its staged fade (copy first, portrait last),
 * which keeps the timing in one place instead of threading a callback through
 * the design tree.
 */

/** How long the loader is held before it starts leaving, in milliseconds. */
const MIN_VISIBLE_MS = 1500;

/** The longest extra wait for the fonts, in milliseconds. */
const MAX_FONT_WAIT_MS = 900;

/** The fade-out, matched to `.loading-overlay` in loading-overlay.css. */
const FADE_MS = 650;

/** Reduced motion still waits, just not long enough to be an animation. */
const REDUCED_MIN_VISIBLE_MS = 400;

const wait = (ms: number) =>
  new Promise<void>((resolve) => {
    window.setTimeout(resolve, ms);
  });

export default function LoadingOverlay() {
  const [leaving, setLeaving] = useState(false);
  const [gone, setGone] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    const run = async () => {
      const fonts = document.fonts?.ready ?? Promise.resolve();

      await Promise.all([
        wait(reduce ? REDUCED_MIN_VISIBLE_MS : MIN_VISIBLE_MS),
        Promise.race([fonts, wait(MAX_FONT_WAIT_MS)]),
      ]);

      if (cancelled) return;

      document.documentElement.setAttribute("data-app-loaded", "true");
      setLeaving(true);

      window.setTimeout(
        () => {
          if (!cancelled) setGone(true);
        },
        reduce ? 0 : FADE_MS,
      );
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, []);

  /*
    Hold the page still while the loader covers it. The previous inline value is
    restored rather than set to an empty string, because v0 already owns
    `overflow: hidden` from its stylesheet and this should not unlock it.
  */
  useEffect(() => {
    if (gone) return;

    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previous;
    };
  }, [gone]);

  if (gone) return null;

  return (
    <div
      className={`loading-overlay${leaving ? " loading-overlay--leaving" : ""}`}
      role="status"
      aria-live="polite"
    >
      <div className="loading-inner">
        <span className="loading-mark" aria-hidden="true">
          EB
        </span>
        <span className="loading-track" aria-hidden="true">
          <span />
        </span>
      </div>
      <span className="sr-only">Loading</span>
    </div>
  );
}
