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

  /*
    The halftone field is masked by the photograph's own alpha, which is what
    keeps the dots on the subject rather than in a rectangle over the page.

    It points at the unoptimised asset rather than the `/_next/image` variant the
    <img> requests. That costs a second request for the same file, but the
    optimizer's URL shape is an internal detail, and a mask that silently fails
    to resolve would put the dots back in a box - the exact thing being avoided.
  */
  const maskUrl = typeof src === "string" ? src : src.src;

  return (
    <div
      ref={frameRef}
      onPointerMove={track}
      onPointerLeave={recentre}
      className="relative w-full select-none"
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
