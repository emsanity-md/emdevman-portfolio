"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { animate, useMotionValue, useReducedMotion } from "framer-motion";

import { AnimatedCursor } from "@/app/components/ui/custom-cursor";
import { useDesign } from "@/app/context/DesignProvider";
import { DESIGN_IDS_OLDEST_FIRST, type DesignId } from "@/app/lib/designs";
import { findRenderedSection } from "@/app/lib/navigation";
import { cn } from "@/app/lib/utils";

/**
 * The collaborator cursor, driving the site the way a visitor would.
 *
 * Four acts, in order:
 *
 *   1. the hero, introduced;
 *   2. the header's nav links - one line each, then actually clicked, in the
 *      order they sit in the bar;
 *   3. back to the hero;
 *   4. the design switcher: opened, then each design chosen from the real menu.
 *
 * It runs once and fades out. An earlier version looped, which was harmless
 * while the cursor had nothing to say past the first pass but is wrong once it
 * is clicking through designs - a loop would keep applying them under a reader
 * who had come to stop it.
 *
 * Everything here is driven through the same elements a visitor would use -
 * `a.click()` on the nav links, `click()` on the menu's own buttons - rather
 * than by calling `setDesign` or scrolling by hand. The app already has an
 * anchor resolver and a reveal transition built for those paths, and going
 * round them would mean the tour demonstrated something the site cannot do.
 */

export interface NavStep {
  /** Section id the link points at, e.g. `tech-stack`. */
  section: string;
  title: string;
  /** One short sentence. A tooltip that needs scrolling has failed. */
  body: string;
}

export interface DesignStep {
  id: DesignId;
  title: string;
  body: string;
}

export interface Tip {
  title: string;
  body: string;
}

const START_DELAY = 2600;
const DWELL = 3400;
const DESIGN_DWELL = 2800;
const GLIDE_SECONDS = 0.8;
/** The design switch wipes in over 540ms; see `design-reveal` in globals.css. */
const DESIGN_SWAP_WAIT = 900;
const AFTER_CLICK = 700;
const FADE_OUT = 1100;
const MOBILE_BREAKPOINT = 767;
const TOOLTIP_WIDTH = 264;
const CURSOR_WIDTH = 130;
const SWITCHER_SELECTOR = ".design-switch-trigger";
const MENU_ITEM_SELECTOR = ".design-switch-item";
const EASE = [0.22, 1, 0.36, 1] as const;

interface CursorTourProps {
  username?: string;
  /** Act one. */
  hero?: Tip;
  /** Act two, said once at the bar before any link is pressed. */
  navIntro?: Tip;
  navSteps?: NavStep[];
  /** Act four. */
  designIntro?: Tip;
  designSteps?: DesignStep[];
  /**
   * Design to open the tour on. The walk begins at the oldest design so the
   * history reads forwards; the visitor's own design is restored at the end.
   */
  startDesign?: DesignId;
  startDelay?: number;
  enabled?: boolean;
}

/**
 * The visible link for a section, in whichever design is on screen.
 *
 * Matched on the fragment rather than on a nav class, because the bar is a
 * `<nav>` under v1 and a fixed rail under v3 and the href style differs too
 * (`/#x` against `#x`). All five design trees are mounted at once, so the
 * match has to be filtered on having a box or it finds a hidden copy.
 */
function findNavLink(section: string): HTMLAnchorElement | null {
  return (
    Array.from(document.querySelectorAll<HTMLAnchorElement>("a[href]")).find(
      (a) =>
        a.getAttribute("href")?.endsWith(`#${section}`) &&
        a.getClientRects().length > 0,
    ) ?? null
  );
}

/**
 * Presses a nav link the way the site's own navigation does.
 *
 * The click is real - dispatched at the link, so any handler on it runs - but
 * the browser's navigation is suppressed for that one press, because it has to
 * be. v1's links are plain `<a href="/#id">` rather than the app's own
 * `useSectionNavigation`, and the page is reached on `/?design=...`, so the
 * href is never equal to the current URL: the browser treats the press as a
 * fresh navigation and reloads the document. A reload remounts this component,
 * which then begins again at the hero - the tour visibly restarts instead of
 * moving on.
 *
 * So the press is completed by hand, exactly as `useSectionNavigation` does it
 * in `app/hooks/useScrollSpy.ts`: replace the URL, then scroll the section that
 * is actually on screen rather than the hidden copy the fragment would resolve
 * to. Same observable result, no document swap.
 */
function pressNavLink(link: HTMLAnchorElement, section: string) {
  const swallow = (event: Event) => event.preventDefault();
  link.addEventListener("click", swallow, { capture: true, once: true });
  link.click();

  const href = link.getAttribute("href") ?? `/#${section}`;
  window.history.replaceState(null, "", href);

  if (section === "home") {
    window.scrollTo({ top: 0, behavior: "smooth" });
    return;
  }

  findRenderedSection(section)?.scrollIntoView({
    behavior: "smooth",
    block: "start",
  });
}

/**
 * The design actually on screen, read rather than remembered.
 *
 * `data-design` on <html> is what every rule in globals.css keys off, so it is
 * the most truthful answer to "which design is showing" there is. It also
 * cannot go stale: the tour applies designs itself, and the `design` value from
 * `useDesign()` inside the running effect is frozen at whatever it was when
 * the effect started. Comparing against that made the tour announce the design
 * the visitor arrived on, offer it as if it were a choice, and then have the
 * menu's own handler ignore the press as a no-op.
 */
function onScreenDesign(): DesignId | null {
  return document.documentElement.getAttribute("data-design") as DesignId | null;
}

export function CursorTour({
  username = "Emmans",
  hero,
  navIntro,
  navSteps = [],
  designIntro,
  designSteps = [],
  startDesign,
  startDelay = START_DELAY,
  enabled = true,
}: CursorTourProps) {
  const reduceMotion = useReducedMotion();
  const { design, setDesign } = useDesign();

  const x = useMotionValue(-9999);
  const y = useMotionValue(-9999);
  const glideRef = useRef<ReturnType<typeof animate> | null>(null);

  const [tip, setTip] = useState<Tip | null>(null);
  const [flip, setFlip] = useState(false);
  const [fading, setFading] = useState(false);
  const [gone, setGone] = useState(false);

  const stoppedRef = useRef(false);
  const waitRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const listenersRef = useRef<AbortController | null>(null);

  const wait = useCallback((ms: number) => {
    return new Promise<void>((resolve) => {
      waitRef.current = setTimeout(resolve, ms);
    });
  }, []);

  /*
    Waits for a smooth scroll to actually finish, rather than for a fixed
    period to pass.

    A fixed delay is a guess, and wrong in both directions. Too short and the
    rect is read mid-flight, so the cursor is sent to an intermediate position
    while the page keeps sliding underneath it. Polling `scrollY` for two
    identical reads tracks whatever the browser decided to do, including its
    own choice to animate less far than asked.
  */
  const settleScroll = useCallback(async () => {
    let previous = -1;
    for (let i = 0; i < 60; i++) {
      const current = window.scrollY;
      if (current === previous) return;
      previous = current;
      await wait(60);
      if (stoppedRef.current) return;
    }
  }, [wait]);

  /*
    Moves the cursor and states a tip together, so the two can never disagree.
    The tooltip appearing over the old position while the cursor travels to the
    new one is what made an earlier build look broken.
  */
  const goTo = useCallback(
    (targetX: number, targetY: number, next: Tip | null) => {
      setFlip(targetX + CURSOR_WIDTH + TOOLTIP_WIDTH + 32 > window.innerWidth - 16);
      setTip(next);

      if (reduceMotion) {
        x.set(targetX);
        y.set(targetY);
        return;
      }
      glideRef.current?.stop();
      glideRef.current = animate(x, targetX, { duration: GLIDE_SECONDS, ease: EASE });
      glideRef.current = animate(y, targetY, { duration: GLIDE_SECONDS, ease: EASE });
    },
    [reduceMotion, x, y],
  );

  /**
   * Sits the cursor beside an element: level with it and to its left, which
   * reads as pointing at it.
   *
   * `offset` is how far clear of the element's left edge the cursor sits, and
   * it is not cosmetic. The pill is about 110px wide and hangs to the right of
   * the cursor's own point, so a small offset puts the name on top of whatever
   * it is naming - fine for a full-width section, wrong for a nav link or a
   * menu row, where covering the label is the one thing it must not do.
   */
  const beside = useCallback(
    (rect: DOMRect, next: Tip | null, offset = 26) => {
      const targetX = Math.min(
        Math.max(rect.left - offset, 8),
        window.innerWidth - 24,
      );
      const targetY = Math.min(
        Math.max(rect.top + rect.height / 2 - 18, 24),
        window.innerHeight - 130,
      );
      goTo(targetX, targetY, next);
    },
    [goTo],
  );

  const stop = useCallback(() => {
    stoppedRef.current = true;
    if (waitRef.current) {
      clearTimeout(waitRef.current);
      waitRef.current = null;
    }
    glideRef.current?.stop();
    glideRef.current = null;
    listenersRef.current?.abort();
    listenersRef.current = null;
    x.set(-9999);
    y.set(-9999);
    setTip(null);
    setGone(true);
  }, [x, y]);

  useEffect(() => {
    const disabled =
      !enabled ||
      new URLSearchParams(window.location.search).get("tour") === "0";

    if (disabled) return;

    /*
      Cleared before the run, not just set by the cleanup.

      StrictMode mounts, unmounts and remounts every effect, and that first
      cleanup sets `stoppedRef` to true. The remount inherits it, so without
      this reset every run returns at its first checkpoint and the cursor sits
      parked off-screen for good.
    */
    stoppedRef.current = false;

    const originalDesign = design;

    const run = async () => {
      await wait(startDelay);
      if (stoppedRef.current) return;

      const controller = new AbortController();
      listenersRef.current = controller;

      /*
        Only a *trusted* click stops the tour.

        The tour presses links and menu buttons with `.click()`, which dispatches
        an untrusted event that still reaches this listener - so without the
        check the tour stopped itself the first time it pressed anything. A real
        pointer never produces `isTrusted: false`, so nothing is lost.
      */
      document.addEventListener(
        "click",
        (event: MouseEvent) => {
          if (event.isTrusted) stop();
        },
        { capture: true, signal: controller.signal },
      );
      document.addEventListener(
        "keydown",
        (event) => {
          if (event.key === "Escape") stop();
        },
        { signal: controller.signal },
      );

      // ---- Act one: the hero -------------------------------------------
      if (startDesign && onScreenDesign() !== startDesign) {
        setDesign(startDesign);
        await wait(DESIGN_SWAP_WAIT);
        if (stoppedRef.current) return;
      }

      window.scrollTo({ top: 0, behavior: "auto" });
      await settleScroll();
      if (stoppedRef.current) return;

      if (hero) {
        const rect = findRenderedSection("home")?.getBoundingClientRect();
        if (rect) {
          beside(rect, hero);
          await wait(GLIDE_SECONDS * 1000 + DWELL);
          if (stoppedRef.current) return;
        }
      }

      // ---- Act two: the nav links, pressed in bar order -----------------
      if (navSteps.length > 0) {
        const bar = findNavLink(navSteps[0].section)?.closest("nav");
        const barRect = bar?.getBoundingClientRect();

        if (barRect) {
          setTip(null);
          await wait(240);
          if (stoppedRef.current) return;

          beside(barRect, navIntro ?? null);
          await wait(GLIDE_SECONDS * 1000 + DWELL);
          if (stoppedRef.current) return;
        }

        for (const step of navSteps) {
          if (stoppedRef.current) return;

          const link = findNavLink(step.section);
          if (!link) continue;

          /*
            The press comes after the explanation, not before: the cursor
            arrives at the link, says what it does, and then takes it. The page
            scrolls away underneath afterwards, which is the point.
          */
          beside(
            link.getBoundingClientRect(),
            { title: step.title, body: step.body },
            96,
          );
          await wait(GLIDE_SECONDS * 1000 + DWELL);
          if (stoppedRef.current) return;

          pressNavLink(link, step.section);
          await wait(AFTER_CLICK);
          if (stoppedRef.current) return;
          await settleScroll();
        }

        // ---- Act three: back to the hero ------------------------------
        window.scrollTo({ top: 0, behavior: "auto" });
        await settleScroll();
        if (stoppedRef.current) return;
      }

      // ---- Act four: the design switcher, opened and used -------------
      const trigger = document.querySelector<HTMLElement>(SWITCHER_SELECTOR);
      if (trigger && designSteps.length > 0) {
        const rect = trigger.getBoundingClientRect();
        beside(rect, designIntro ?? null);
        await wait(GLIDE_SECONDS * 1000 + DWELL);
        if (stoppedRef.current) return;

        trigger.click();
        await wait(420);
        if (stoppedRef.current) return;

        /*
          Walked oldest-first regardless of the order the copy happens to be
          written in, so "the project's history" cannot come out backwards if
          the list in `page.tsx` is ever reordered for readability.
        */
        const walk = [...designSteps].sort(
          (a, b) =>
            DESIGN_IDS_OLDEST_FIRST.indexOf(a.id) -
            DESIGN_IDS_OLDEST_FIRST.indexOf(b.id),
        );

        for (const step of walk) {
          if (stoppedRef.current) return;

          // Re-picking the active design is a no-op in the menu's own handler,
          // so there is nothing to show and it is skipped rather than pretended.
          if (step.id === onScreenDesign()) continue;

          // The menu is a dropup that closes after every choice, so it is
          // reopened each round - which is also what a visitor has to do.
          const menu = document.getElementById("design-switch-menu");
          if (menu?.getAttribute("data-open") !== "true") {
            trigger.click();
            await wait(420);
            if (stoppedRef.current) return;
          }

          const item = Array.from(
            document.querySelectorAll<HTMLElement>(MENU_ITEM_SELECTOR),
          ).find((el) => el.querySelector(".design-switch-item-name")?.textContent === step.id);

          if (!item || item.getClientRects().length === 0) continue;

          beside(
            item.getBoundingClientRect(),
            { title: step.title, body: step.body },
            132,
          );
          await wait(GLIDE_SECONDS * 1000 + DESIGN_DWELL);
          if (stoppedRef.current) return;

          item.click();
          await wait(DESIGN_SWAP_WAIT);
          if (stoppedRef.current) return;
        }

        // Hand back the design they arrived on before the curtain.
        if (onScreenDesign() !== originalDesign) {
          setDesign(originalDesign);
          await wait(DESIGN_SWAP_WAIT);
          if (stoppedRef.current) return;
        }
      }

      // ---- Curtain down ------------------------------------------------
      setTip(null);
      await wait(500);
      if (stoppedRef.current) return;

      setFading(true);
      await wait(FADE_OUT);
      setGone(true);
    };

    void run();

    return () => {
      stoppedRef.current = true;
      if (waitRef.current) clearTimeout(waitRef.current);
      glideRef.current?.stop();
      listenersRef.current?.abort();
    };
    // `design` is deliberately absent: it changes as the tour applies each one,
    // and depending on it would restart the tour on every swap.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    enabled, hero, navIntro, navSteps, designIntro, designSteps,
    startDesign, startDelay, reduceMotion, x, y, wait, stop, goTo, beside, settleScroll,
  ]);

  /*
    Below the tour breakpoint the tooltip would sit under the cursor for most of
    the run, and the nav bar the tour presses is not where a thumb is. Better
    absent than half-usable.
  */
  const [tooNarrow, setTooNarrow] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT}px)`);
    const sync = () => setTooNarrow(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  if (tooNarrow || gone) return null;

  return (
    <div
      className={cn(
        "pointer-events-none fixed inset-0 z-[9999] transition-opacity duration-1000 ease-out",
        fading && "opacity-0",
      )}
      aria-hidden="true"
    >
      <AnimatedCursor text={username} x={x} y={y}>
        {tip && (
          <div
            style={{
              // Inside the positioned box, so the tip travels with the cursor
              // without a second animation to keep in step with it. `100%` is
              // the cursor's own width, not the viewport's.
              left: flip ? undefined : "100%",
              right: flip ? "100%" : undefined,
              width: TOOLTIP_WIDTH,
              transform: `translateX(${flip ? -14 : 14}px)${
                flip ? " translateX(-100%)" : ""
              }`,
            }}
            className="absolute top-1 rounded-xl border border-border bg-card px-3.5 py-3 text-card-foreground shadow-xl"
          >
            <p className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
              {tip.title}
            </p>
            <p className="mt-1.5 text-[13px] leading-snug">{tip.body}</p>
          </div>
        )}
      </AnimatedCursor>
    </div>
  );
}

export default CursorTour;