"use client";

import Image, { type StaticImageData } from "next/image";
import {
  useCallback,
  useRef,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from "react";

interface PortraitProps {
  /**
   * A static import, as `app/lib/about.ts` does for the stills, rather than a
   * string path into `public/`. A static import lets Next know the dimensions
   * and hash the file at build time, so there is no second copy of the image to
   * keep in step - and nothing to repoint if the file is renamed.
   */
  src: StaticImageData | string;
  /**
   * Swapped in on hover. Optional, and the portrait renders exactly as it did
   * before when it is absent - the hero's v2 sibling passes nothing.
   *
   * Both images are always in the DOM. A hover that mounts an image on demand
   * shows a hole for a frame while it decodes, and the decode is the slow part,
   * so the swap is a crossfade between two stacked images instead.
   */
  hoverSrc?: StaticImageData | string;
  alt: string;
  /** Widest travel, in px, at the edge of the pointer's range. */
  travel?: number;
  priority?: boolean;
}

/**
 * v3's portrait: the photograph itself, with a slight drift toward the pointer.
 *
 * The reference uses a static illustration that "follows" the pointer by
 * swapping between pre-rendered gaze directions. That needs a set of
 * alternates, so this adapts the idea rather than copying it - a single image
 * drifts a few pixels instead, which reads the same at this size and needs no
 * extra assets.
 *
 * Deliberately not a card: v3's name is the h1 beside this, and its metadata
 * lives in the sidebar. Nothing floats over the photograph, and there is no
 * plate behind it.
 */
export default function Portrait({
  src,
  hoverSrc,
  alt,
  travel = 10,
  priority = true,
}: PortraitProps) {
  const frameRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);

  const recentre = useCallback(() => {
    if (imageRef.current) {
      imageRef.current.style.transform = "translate3d(0, 0, 0)";
    }
  }, []);

  const track = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      const frame = frameRef.current;
      const image = imageRef.current;
      if (!frame || !image) return;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

      const bounds = frame.getBoundingClientRect();
      const x = (event.clientX - bounds.left) / bounds.width - 0.5;
      const y = (event.clientY - bounds.top) / bounds.height - 0.5;

      image.style.transform = `translate3d(${(-x * travel * 2).toFixed(1)}px, ${(-y * travel * 1.2).toFixed(1)}px, 0)`;
    },
    [travel],
  );

  /*
    A static import carries its own dimensions, so they are only supplied for the
    string case. The old pair was hardcoded to 402x402 to match this file, which
    quietly assumed the source stays square and 600px wide.
  */
  const intrinsic = typeof src === "string" ? { width: 402, height: 402 } : {};
  const hoverIntrinsic =
    typeof hoverSrc === "string" ? { width: 402, height: 402 } : {};

  /*
    The halftone field is masked by the photograph's own alpha, which is what
    keeps the dots on the subject rather than in a rectangle over the page.

    It points at the unoptimised asset rather than the `/_next/image` variant the
    <img> requests. That costs a second request for the same file, but the
    optimizer's URL shape is an internal detail, and a mask that silently fails
    to resolve would put the dots back in a box - the exact thing being avoided.

    The mask always comes from `src`, never from `hoverSrc`. The two are the same
    crop and the same silhouette - same 600x600 frame, same alpha profile - so
    one mask describes both, and a mask that changed on hover would have the dots
    fade in and out with the image rather than sitting still on the subject.
  */
  const maskUrl = typeof src === "string" ? src : src.src;

  return (
    <div
      ref={frameRef}
      onPointerMove={track}
      onPointerLeave={recentre}
      className="group relative w-full select-none"
    >
      <div
        ref={imageRef}
        className="relative will-change-transform transition-transform duration-500 ease-out"
      >
        <Image
          src={src}
          alt={alt}
          priority={priority}
          draggable={false}
          className="block h-auto w-full"
          {...intrinsic}
        />

        {/*
          The hover state, stacked over the base and crossfaded in.

          Absolutely positioned rather than in flow so the two occupy one box: in
          flow the second image would sit below the first and the portrait would
          double in height on mount. `group-hover` on the frame drives it, so the
          whole plate is the hit area rather than the pixels of the photograph.

          Not `priority`, so it stays out of the initial load and the LCP image is
          still the one that is actually visible first. Decorative and hidden from
          assistive tech - it is the same person, and announcing two portraits
          would be noise.
        */}
        {hoverSrc ? (
          <Image
            src={hoverSrc}
            alt=""
            aria-hidden="true"
            draggable={false}
            className="pointer-events-none absolute inset-0 block h-full w-full opacity-0 transition-opacity duration-300 ease-out motion-reduce:transition-none group-hover:opacity-100"
            {...hoverIntrinsic}
          />
        ) : null}

        {/* Inside the parallax layer, not beside it, so the field travels with
            the photograph when the pointer drifts it. */}
        <span
          aria-hidden="true"
          className="halftone portrait-halftone"
          style={{ "--halftone-mask": `url(${maskUrl})` } as CSSProperties}
        />
      </div>
    </div>
  );
}
