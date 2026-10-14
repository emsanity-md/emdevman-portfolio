"use client";

import type { MotionStyle, MotionValue } from "framer-motion";
import { motion, useReducedMotion } from "framer-motion";

import { cn } from "@/app/lib/utils";

/**
 * A collaborator's cursor.
 *
 * Two transforms, deliberately on two elements. The outer box carries
 * *position* - either handed in as motion values so something else can steer
 * it, or left to sit wherever `className` puts it. The inner box carries the
 * idle *drift*, a small loop that reads as alive. Driving both from one
 * element would make every glide fight the idle loop, because a second
 * `translateX` animation overwrites the first rather than composing with it.
 *
 * There is no pointer tracking here on purpose: a cursor that follows your own
 * mouse is just a second copy of the one you are already looking at. This is
 * the "someone else is in this document with you" tell from collaborative
 * editors.
 */
interface AnimatedCursorProps {
  /** Name on the pill. This is the whole trick, so it is not optional. */
  text: string;
  /**
   * Viewport position, as motion values. Supply both to steer the cursor from
   * outside; supply neither and `className` decides where it sits.
   */
  x?: MotionValue<number>;
  y?: MotionValue<number>;
  /**
   * Rendered inside the positioned box but outside the drifting one, so an
   * explanation tooltip travels with the cursor without bobbing along with it.
   */
  children?: React.ReactNode;
  /** Seconds per drift cycle. */
  duration?: number;
  /** Horizontal travel in px. */
  travelX?: number;
  /** Vertical travel in px. */
  travelY?: number;
  className?: string;
  /**
   * Colour for the pill and arrow. Defaults to the page's own foreground so
   * the chip inverts with the theme in every design - see the note on `Pill`
   * for why the accent tokens are not usable here.
   */
  color?: string;
}

export function AnimatedCursor({
  text,
  x,
  y,
  children,
  duration = 4,
  travelX = 20,
  travelY = 40,
  className,
  color,
}: AnimatedCursorProps) {
  const reduceMotion = useReducedMotion();

  const inner = (
    <div className="flex items-center gap-4">
      <Pill text={text} color={color} />
      <CursorArrow color={color} />
    </div>
  );

  /*
    Reduced motion drops the drift but keeps the position - the pill is the
    point of the component, and the tour still has to put it somewhere, so a
    reader who asked for less movement gets a cursor that arrives rather than
    glides, not a cursor stranded at the untransformed origin.

    The outer box is a motion.div either way, because a plain div's `style`
    cannot read a MotionValue; handing one to a DOM element silently drops the
    transform.
  */
  return (
    <motion.div
      style={{ x, y } as MotionStyle}
      className={cn("absolute left-0 top-0 z-[2]", className)}
      aria-hidden="true"
    >
      {reduceMotion ? (
        inner
      ) : (
        <motion.div
          initial={{ translateX: 0, translateY: 0 }}
          animate={{
            translateX: [0, travelX, 0],
            translateY: [0, travelY, 0],
          }}
          transition={{ duration, repeat: Infinity, ease: "easeInOut" }}
        >
          {inner}
        </motion.div>
      )}
      {children}
    </motion.div>
  );
}

function Pill({ text, color }: { text: string; color?: string }) {
  return (
    <div
      className="w-fit rounded-full px-2 py-1"
      style={
        color
          ? { backgroundColor: color, color: "#ffffff" }
          : {
              /*
                Ink on the page's own background, which is the only pairing
                every design agrees on.

                Two obvious alternatives both fail here. An accent token
                (`--accent-a`) collapses to the foreground under v3, so the
                pill becomes the page's ink behind its own text. And
                `--surface-invert`, which looks purpose-built for this,
                computes against :root and lands on `#09090b` under v5 -
                indistinguishable from v5's own page colour, so the pill
                vanishes again. `--foreground` and `--background` are redefined
                per design *and* per theme in all five, and they are always
                opposites of each other, so the chip inverts with the theme
                without a branch here.
              */
              backgroundColor: "var(--foreground, #0a0a0a)",
              color: "var(--background, #ffffff)",
            }
      }
    >
      {text}
    </div>
  );
}

/**
 * The arrow is a filled path with a lighter stroke rather than a stroke-only
 * outline, so it keeps an edge against whatever it drifts over. `1em` sizing
 * lets it track the surrounding text size instead of being pinned to a px
 * value that would not match at other breakpoints.
 */
function CursorArrow({ color }: { color?: string }) {
  return (
    <svg
      fill="none"
      height="18"
      viewBox="0 0 17 18"
      width="17"
      aria-hidden="true"
      style={{
        color: color ?? "var(--foreground, #0a0a0a)",
      }}
    >
      <path
        d="M15.5036 3.11002L12.5357 15.4055C12.2666 16.5204 10.7637 16.7146 10.22 15.7049L7.4763 10.6094L2.00376 8.65488C0.915938 8.26638 0.891983 6.73663 1.96711 6.31426L13.8314 1.65328C14.7729 1.28341 15.741 2.12672 15.5036 3.11002ZM7.56678 10.6417L7.56645 10.6416C7.56656 10.6416 7.56667 10.6416 7.56678 10.6417L7.65087 10.4062L7.56678 10.6417Z"
        fill="currentColor"
        stroke="currentColor"
        strokeOpacity="0.45"
        strokeWidth="1.5"
      />
    </svg>
  );
}

export default AnimatedCursor;