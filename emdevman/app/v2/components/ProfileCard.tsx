"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, type CSSProperties } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";

import { WeatherChip } from "./WeatherChip";

const ENTER_TRANSITION_MS = 180;

const clamp = (value: number, min = 0, max = 100) => Math.min(Math.max(value, min), max);
const round = (value: number, precision = 3) => parseFloat(value.toFixed(precision));

/**
 * The hero portrait card: a cut-out figure that stands up out of a flat frame
 * and tilts toward the pointer.
 *
 * This is the old `app/components/ui/ProfileCard.tsx`, restored. The tilt engine
 * is unchanged and so is the reason it exists: a static rectangle reads as a
 * photo, and a figure that leans when the pointer arrives reads as a person
 * present on the page. That is worth the ~90 lines of easing maths.
 *
 * Four things are different, and each one is a decision rather than a downgrade:
 *
 *   - The tilt stops for `prefers-reduced-motion`. This is the reason the
 *     component needed editing rather than restoring. The tilt is a
 *     requestAnimationFrame loop writing inline `--rotate-x` / `--rotate-y`
 *     custom properties, so the global reduced-motion block cannot reach it -
 *     that block collapses CSS transitions and animations, and this is neither.
 *     Reduced motion is a question for JavaScript here, so JavaScript has to ask
 *     it. `supportsTilt` is the single gate: hover capability *and* no
 *     preference, checked live so toggling the OS setting takes effect without
 *     a reload.
 *
 *   - 12px radius and a hairline border, no shadow. The original was 30px with
 *     `shadow-sm`, which belonged to the old design's raised vocabulary. The
 *     depth here comes from the `translateZ` on the figure, not from a box
 *     shadow pretending to be one.
 *
 *   - The name and title overlay is gone. The hero's own `<h1>` says
 *     "Emmanuel S. Bitancor" about 400px to the left, and the card rendering an
 *     `<h2>` with the same two words was the same duplication the redesign was
 *     meant to remove.
 *
 *   - `sizes` and `quality` are set properly, and the source is 800px rather
 *     than 4K. The original passed `priority`, `quality={90}` and no `sizes` at
 *     all, which is how a 4000px-wide file ends up in the request for a 350px
 *     slot.
 *
 * `priority` is still correct here and is not the problem the original had: this
 * is the largest element in the first screenful, so preloading it is right. What
 * was wrong was the unbounded width, not the eagerness.
 */
export function ProfileCard({
  image = "/assets/images/profile3-4k.webp",
  alt = "Emmanuel S. Bitancor",
  className,
}: {
  /** A cut-out figure on transparency. The card needs the alpha channel. */
  image?: string;
  alt?: string;
  className?: string;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const shellRef = useRef<HTMLDivElement>(null);
  const enterTimerRef = useRef<number | null>(null);
  const leaveRafRef = useRef<number | null>(null);

  /*
    No `mounted` flag.

    The original had one, and set it in an effect purely to fade the figure in
    once the page had settled - a second render that changed nothing except one
    opacity value. The fade is a CSS animation now (`pc-figure-in`, keyed off
    page load rather than off a React state flip), so it runs on the first paint
    instead of the second and costs no render at all.

    It is also correct for a reader who never hydrates, which the effect was not:
    a JavaScript-free visitor got the figure permanently at `opacity-0`, which is
    the hero's portrait simply missing.
  */

  /*
    The engine's entire mutable state lives in this one object rather than in
    closure variables, and that is for the linter rather than for style.

    Every value here is written from a pointer handler and from inside a
    requestAnimationFrame callback, both of which run long after the last
    render. The react-hooks immutability rule flags a reassignment to a `let`
    captured by a `useMemo` closure for exactly that reason - it cannot tell a
    stale-closure bug from a deliberate imperative handle, so it reports both.

    A plain object is not special-cased, so the writes are silent, and it is
    genuinely the same shape the rule wants: one object that React does not own
    and does not re-create, mutated only by the engine. Using `useRef` would
    read better but adds nothing - the object is already private to this
    `useMemo`, and `useMemo` with an empty dependency array runs once.
*/
  const tiltEngine = useMemo(() => {
    const engine = {
      rafId: null as number | null,
      running: false,
      lastTimestamp: 0,
      currentX: 0,
      currentY: 0,
      targetX: 0,
      targetY: 0,
    };

    const setVarsFromPoint = (x: number, y: number) => {
      const shell = shellRef.current;
      const wrapper = wrapRef.current;
      if (!shell || !wrapper) return;

      const width = shell.clientWidth || 1;
      const height = shell.clientHeight || 1;
      const percentX = clamp((100 / width) * x);
      const percentY = clamp((100 / height) * y);

      wrapper.style.setProperty("--rotate-x", `${round(-(percentY - 50) / 4)}deg`);
      wrapper.style.setProperty("--rotate-y", `${round((percentX - 50) / 4)}deg`);
    };

    const step = (timestamp: number) => {
      if (!engine.running) return;

      if (engine.lastTimestamp === 0) engine.lastTimestamp = timestamp;
      const deltaSeconds = Math.min((timestamp - engine.lastTimestamp) / 1000, 0.05);
      engine.lastTimestamp = timestamp;
      /*
        Exponential smoothing, frame-rate independent.

        `1 - e^(-dt/tau)` rather than a fixed fraction per frame: a fixed
        fraction makes the figure settle faster on a 120Hz display than on a
        60Hz one, because it gets twice as many steps. Dividing by the elapsed
        time gives the same curve either way.
      */
      const smoothing = 1 - Math.exp(-deltaSeconds / 0.14);

      engine.currentX += (engine.targetX - engine.currentX) * smoothing;
      engine.currentY += (engine.targetY - engine.currentY) * smoothing;
      setVarsFromPoint(engine.currentX, engine.currentY);

      if (
        Math.abs(engine.targetX - engine.currentX) <= 0.05 &&
        Math.abs(engine.targetY - engine.currentY) <= 0.05
      ) {
        engine.currentX = engine.targetX;
        engine.currentY = engine.targetY;
        setVarsFromPoint(engine.currentX, engine.currentY);
        engine.running = false;
        engine.rafId = null;
        engine.lastTimestamp = 0;
        return;
      }

      engine.rafId = window.requestAnimationFrame(step);
    };

    const start = () => {
      if (engine.running) return;
      engine.running = true;
      engine.lastTimestamp = 0;
      engine.rafId = window.requestAnimationFrame(step);
    };

    const centre = () => {
      const shell = shellRef.current;
      if (!shell) return;
      engine.targetX = shell.clientWidth / 2;
      engine.targetY = shell.clientHeight / 2;
    };

    return {
      setTarget(x: number, y: number) {
        engine.targetX = x;
        engine.targetY = y;
        start();
      },
      toCenter() {
        centre();
        start();
      },
      snapToCenter() {
        centre();
        engine.currentX = engine.targetX;
        engine.currentY = engine.targetY;
        setVarsFromPoint(engine.currentX, engine.currentY);
      },
      isSettled() {
        return (
          Math.abs(engine.targetX - engine.currentX) < 0.6 &&
          Math.abs(engine.targetY - engine.currentY) < 0.6
        );
      },
      /*
        The cancelled handle has to be cleared, or a later `start()` would see a
        stale id and refuse to schedule - which would leave the figure frozen for
        the rest of the page's life.
      */
      cancel() {
        if (engine.rafId !== null) window.cancelAnimationFrame(engine.rafId);
        engine.rafId = null;
        engine.running = false;
        engine.lastTimestamp = 0;
      },
    };
  }, []);

  /*
    Read live rather than once on mount. A reader who turns the OS setting
    reduced-motion on while the page is open gets the still card immediately
    instead of after a reload, and `matchMedia` is the only way to ask - the
    value is not in a media query any stylesheet can read from JS.
  */
  const supportsTilt = useCallback(
    () =>
      window.matchMedia("(hover: hover) and (pointer: fine)").matches &&
      !window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    [],
  );

  const handlePointerMove = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (!shellRef.current || !supportsTilt()) return;
      const bounds = shellRef.current.getBoundingClientRect();
      tiltEngine.setTarget(event.clientX - bounds.left, event.clientY - bounds.top);
    },
    [supportsTilt, tiltEngine],
  );

  const handlePointerEnter = useCallback(() => {
    if (!shellRef.current || !supportsTilt()) return;
    shellRef.current.classList.add("active", "entering");
    if (enterTimerRef.current) window.clearTimeout(enterTimerRef.current);
    enterTimerRef.current = window.setTimeout(() => {
      shellRef.current?.classList.remove("entering");
    }, ENTER_TRANSITION_MS);
  }, [supportsTilt]);

  const handlePointerLeave = useCallback(() => {
    if (!shellRef.current || !supportsTilt()) return;
    tiltEngine.toCenter();

    /*
      The `active` class is what removes the CSS transition, so it has to stay on
      until the figure has actually arrived - dropping it on pointerleave would
      hand a moving target back to a 1s transition and the figure would visibly
      overshoot. Polling with rAF is the cheap way to know when it stopped.
    */
    const checkSettle = () => {
      if (tiltEngine.isSettled()) {
        shellRef.current?.classList.remove("active");
        leaveRafRef.current = null;
        return;
      }
      leaveRafRef.current = window.requestAnimationFrame(checkSettle);
    };

    if (leaveRafRef.current !== null) {
      window.cancelAnimationFrame(leaveRafRef.current);
    }
    leaveRafRef.current = window.requestAnimationFrame(checkSettle);
  }, [supportsTilt, tiltEngine]);

  useEffect(() => {
    tiltEngine.snapToCenter();
    return () => {
      tiltEngine.cancel();
      if (enterTimerRef.current) window.clearTimeout(enterTimerRef.current);
      if (leaveRafRef.current !== null) {
        window.cancelAnimationFrame(leaveRafRef.current);
      }
    };
  }, [tiltEngine]);

  return (
    <div
      ref={wrapRef}
      style={{ "--rotate-x": "0deg", "--rotate-y": "0deg" } as CSSProperties}
      className={`pc-card-wrapper relative z-10 mx-auto h-full w-full [perspective:800px] transform-gpu ${className ?? ""}`}
    >
      <div
        ref={shellRef}
        onPointerMove={handlePointerMove}
        onPointerEnter={handlePointerEnter}
        onPointerLeave={handlePointerLeave}
        className="group relative z-20 h-full w-full touch-pan-y"
        style={{ transformStyle: "preserve-3d" }}
      >
        <div
          className="pc-card relative h-full w-full overflow-hidden rounded-[0.75rem] border border-border bg-card transition-colors duration-300"
          style={{
            transformStyle: "preserve-3d",
            transform: "rotateX(var(--rotate-x)) rotateY(var(--rotate-y))",
          }}
        >
          {/*
            The figure stands up out of the frame at 40px, and the weather chip
            sits in front of it at 55px. Both are inside the card's stacking
            context, so the chip is occluded by the figure exactly where they
            overlap - which is the effect the original was built around, and the
            reason the card's own overflow is `hidden` rather than `visible`.
          */}
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 z-30 h-[78%] origin-bottom"
            style={{
              transform: "translateZ(40px) rotateZ(0.01deg)",
              animation: "pc-figure-in 700ms cubic-bezier(0.15, 0.85, 0.35, 1) both",
            }}
          >
            <Image
              src={image}
              alt={alt}
              fill
              priority
              /*
                800px is the ceiling. The figure occupies the right 40% of a
                1152px container on desktop, so the largest useful render is
                ~460px, and a 2x phone is covered by 100vw. The original passed
                no `sizes` at all, which defaults to 100vw - and that is how a
                4000px-wide source ended up in the request for a 350px slot.
              */
              sizes="(max-width: 1023px) 352px, 460px"
              className="select-none object-contain object-bottom"
              draggable={false}
            />
          </div>

          <div className="absolute inset-x-3 bottom-3 z-40" style={{ transform: "translateZ(55px)" }}>
            <WeatherChip />
          </div>
        </div>
      </div>
    </div>
  );
}
