"use client";

import Image, { type StaticImageData } from "next/image";
import { useEffect, useRef, type ReactNode } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";

/**
 * A layered parallax hero.
 *
 * Three images and a copy block sit in one stage. As the stage scrolls out of
 * the viewport, every layer is pushed down at a different rate, so the image
 * furthest away lags behind the page and the figure in front barely moves. The
 * result is depth without a 3D engine: the sky travels 60% of the stage's
 * height while the portrait travels 4%.
 *
 * Ported from Osmo's "Parallax Image Layers" (https://www.osmo.supply/), which
 * ships gsap + ScrollTrigger + Lenis. The cleanup here is deliberately narrower
 * than the original's: killing every ScrollTrigger on the page would reach into
 * other designs on this site, all of which stay mounted behind CSS. A
 * `gsap.context` scoped to this section reverts only what it created, and Lenis
 * is only started when `enabled` is true (the active design is v5).
 *
 * The stage is exactly one dynamic viewport tall. It does not participate in
 * layout after first paint except when the viewport itself changes, so the
 * scroll measurement cannot shift under a loading image - and a short landscape
 * phone gets the whole composition instead of a clipped 560px stage.
 */

type ParallaxImage = string | StaticImageData;

export type ParallaxScrollingProps = {
  /** The opaque sky/landscape plate. Oversized, because it travels furthest. */
  background: ParallaxImage;
  /** The mountain cutout that sits in front of the sky. */
  midground: ParallaxImage;
  /** The foreground cutout - the main subject, usually a portrait. */
  foreground: ParallaxImage;
  foregroundAlt: string;
  /** Small label above the title, e.g. "Portfolio - 2026". */
  eyebrow?: ReactNode;
  /** The display title. Two short lines work best. */
  title: ReactNode;
  /**
   * Optional visual replacement for the default h2 title.
   *
   * v5 passes its name-and-toolkit block here; the title string is still kept
   * for the default path and as the accessible label.
   */
  titleContent?: ReactNode;
  /** A line under the title. */
  caption?: ReactNode;
  /** Accessible name for the whole scene. */
  label?: string;
  /** Only run the scroll animation and smooth scrolling when the design is live. */
  enabled?: boolean;
  className?: string;
};

const LAYER_SPEEDS = [
  { layer: "1", yPercent: 20 },
  { layer: "2", yPercent: 10 },
  { layer: "3", yPercent: 7 },
  { layer: "4", yPercent: 4 },
] as const;

export function ParallaxScrolling({
  background,
  midground,
  foreground,
  foregroundAlt,
  eyebrow,
  title,
  titleContent,
  caption,
  label,
  enabled = true,
  className,
}: ParallaxScrollingProps) {
  const stageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!enabled) return;

    const stage = stageRef.current;
    if (!stage) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reducedMotion.matches) return;

    gsap.registerPlugin(ScrollTrigger);

    const context = gsap.context(() => {
      const layers = stage.querySelector<HTMLElement>("[data-parallax-layers]");
      if (!layers) return;

      const timeline = gsap.timeline({
        scrollTrigger: {
          trigger: layers,
          start: "0% 0%",
          end: "100% 0%",
          scrub: 0,
        },
      });

      LAYER_SPEEDS.forEach((layer, index) => {
        timeline.to(
          layers.querySelectorAll(`[data-parallax-layer="${layer.layer}"]`),
          { yPercent: layer.yPercent, ease: "none" },
          index === 0 ? undefined : "<",
        );
      });
    }, stage);

    /*
      Lenis is created per active design rather than once per page. This site
      mounts every design at the same time and hides the inactive ones with
      `display: none`, so an unconditional Lenis instance would smooth-scroll
      v1-v4 and v0 from code that only v5 is using.
    */
    const lenis = new Lenis();
    const syncScrollTrigger = () => ScrollTrigger.update();
    lenis.on("scroll", syncScrollTrigger);

    const tick = (time: number) => {
      lenis.raf(time * 1000);
    };
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    ScrollTrigger.refresh();

    return () => {
      gsap.ticker.remove(tick);
      gsap.ticker.lagSmoothing(500);
      lenis.off("scroll", syncScrollTrigger);
      lenis.destroy();
      context.revert();
    };
  }, [enabled]);

  return (
    <section
      ref={stageRef}
      aria-label={label}
      className={`parallax-stage relative isolate w-full overflow-hidden bg-[#070b14] ${className ?? ""}`}
      /*
        One viewport, not `max(560px, 100dvh)`. The floor was there to keep the
        scene from collapsing in a short desktop window, but it also meant a
        landscape phone got a 560px stage in a 390px viewport: the name and
        caption were pushed below the fold and the page scrolled inside a hero
        that is supposed to be exactly one screen.
      */
      style={{ minHeight: "100dvh" }}
    >
      <div data-parallax-layers className="absolute inset-0">
        <div
          className="pointer-events-none absolute inset-0"
          aria-hidden="true"
        >
          {/* Sky. The 300% plate with a 20% shift leaves 40% of the scroll
              distance as lag without exposing the stage's background. */}
          <div
            data-parallax-layer="1"
            className="absolute inset-x-0 top-[-100%] h-[300%]"
          >
            <Image
              src={background}
              alt=""
              fill
              priority
              sizes="100vw"
              className="object-cover object-[50%_58%]"
            />
          </div>

          {/* Mountain cutout. Transparent above the ridge, so it can be sized to
              the stage and moved a full 10% without showing a seam. */}
          <div
            data-parallax-layer="2"
            className="absolute inset-x-0 top-[-10%] h-[120%]"
          >
            <Image
              src={midground}
              alt=""
              fill
              priority
              sizes="100vw"
              className="object-cover object-bottom"
            />
          </div>
        </div>

        {/* A single bottom scrim, not the old left-hand one: the copy sits
            centred under the figure now, so the darkness has to fall behind the
            bottom of the scene rather than down one side. It stays below the
            content column, so it darkens the landscape without dimming the
            portrait. */}
        <div
          className="parallax-scrim pointer-events-none absolute inset-x-0 bottom-0 z-10 h-[58%]"
          aria-hidden="true"
          style={{
            background:
              "linear-gradient(to top, rgba(3, 7, 18, 0.92) 0%, rgba(3, 7, 18, 0.66) 30%, rgba(3, 7, 18, 0.18) 66%, transparent 100%)",
          }}
        />

        {/* The figure and the header share the bottom of the stage. The figure
            is a layer above the copy, so the portrait cuts across the name
            instead of sitting above it. */}
        <div
          data-parallax-layer="4"
          className="pointer-events-none absolute inset-0 z-30 flex items-end justify-center"
        >
          <div
            className="relative h-[94%] w-full max-w-[680px]"
            style={{
              maskImage:
                "linear-gradient(to top, transparent 0%, rgba(0, 0, 0, 0.08) 20%, black 56%)",
              WebkitMaskImage:
                "linear-gradient(to top, transparent 0%, rgba(0, 0, 0, 0.08) 20%, black 56%)",
            }}
          >
            <Image
              src={foreground}
              alt={foregroundAlt}
              fill
              priority
              sizes="(min-width: 640px) 680px, 90vw"
              className="object-contain object-bottom drop-shadow-[0_18px_40px_rgba(0,0,0,0.55)]"
            />
          </div>
        </div>

        <div className="parallax-copy absolute inset-x-0 bottom-24 z-20 flex flex-col items-center px-4 text-center lg:bottom-12">
          <div
            data-parallax-layer="3"
            className="flex w-full flex-col items-center"
          >
            {eyebrow ? (
              <p className="mb-3 inline-flex w-fit items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-white/85 backdrop-blur-sm">
                {eyebrow}
              </p>
            ) : null}

            {titleContent ?? (
              <h2 className="parallax-title whitespace-nowrap text-[clamp(1.4rem,8.2vw,8.5rem)] font-extrabold leading-[0.95] tracking-[-0.04em] text-white drop-shadow-[0_2px_24px_rgba(0,0,0,0.55)]">
                {title}
              </h2>
            )}

            {caption ? (
              <p className="mt-3 max-w-[34ch] text-sm leading-6 text-white/80 sm:text-base">
                {caption}
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
