"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type ReactNode } from "react";

import { projects, type Project } from "@/app/lib/data";

import "./corridor-gallery.css";

/**
 * An endless conveyor of project artwork.
 *
 * Each wall is one slot long. A panel's slot position is `(index + t) % count`,
 * where `t` advances at a constant speed. The slot is the panel width plus the
 * gap. A panel fades in at one end of the loop and out at the other, so the
 * wrap is never visible no matter which way the belt runs.
 *
 * `CORRIDOR_DIRECTION` controls the travel direction. The left and right walls
 * share the same `t`, so they move as one corridor.
 * The right wall is the left wall reversed: the same space, seen from the
 * other side.
 *
 * Only `transform` and `opacity` are written per frame. The transform is built
 * from the measured panel width, so the layout can stay entirely in CSS.
 */

/** Slots travelled per second. Use a negative value to run the conveyor back. */
export const CORRIDOR_SPEED = 0.35;

/**
 * Travel multiplier. Flip this to reverse the whole corridor without changing
 * any widths, angles, depths or fade distances.
 */
const CORRIDOR_DIRECTION = -1;

/** How many slots a panel takes to appear at the outer edge. */
export const CORRIDOR_FADE_IN_SLOTS = 0.5;

/** How many slots a panel takes to dissolve at the far end. */
export const CORRIDOR_FADE_OUT_SLOTS = 1.5;

const DESKTOP_PER_SIDE = 5;
const MOBILE_PER_SIDE = 3;

/**
 * Extra panels beyond the ones we want visible. They give the conveyor a
 * tail at the far end and a head just outside the frame, so a panel cannot
 * vanish before its replacement has arrived.
 */
const OVERSCAN = 2;

const PANEL_GAP_DESKTOP = 26;
const PANEL_GAP_MOBILE = 18;

/** Where the first, nearest slot sits, in percent of the stage width. */
const DESKTOP_BASE_X = 42;
const MOBILE_BASE_X = 38;

/** The Y rotation of a panel's face. */
const DESKTOP_ANGLE = 46;
const MOBILE_ANGLE = 38;

/**
 * Inward drift per slot. This keeps the old corridor's shallow wall direction
 * instead of making the walls run parallel to the view axis. Perspective still
 * does all of the apparent shrinking.
 */
const DESKTOP_INWARD = 0.133;
const MOBILE_INWARD = 0.066;

/** Depth travelled per slot. The small correction makes the slot a true length. */
const DEPTH_PER_SLOT = 0.995;

/** Never let a paused frame turn into a visible jump. */
const DELTA_CLAMP = 0.05;

const DEFAULT_HEADLINE = "My Projects, in perspective.";

const DEFAULT_CAPTION = (
  <>
    A walk through a few of the things I&apos;ve built.
    <br />
    Open any panel to see the live project.
  </>
);

type CorridorGalleryProps = {
  /** The projects to draw. Defaults to every project in `lib/data.ts`. */
  items?: readonly Project[];
  /** How many full panels sit on each side above 1024px. */
  desktopPerSide?: number;
  /** How many full panels sit on each side below 1024px. */
  mobilePerSide?: number;
  headline?: ReactNode;
  caption?: ReactNode;
  /** Pass false while the whole design is hidden, so the loop stays idle. */
  enabled?: boolean;
  id?: string;
  className?: string;
  /** Slots per second. Negative values reverse the direction. */
  speed?: number;
  /** Slots to fade a panel in at the outer edge. */
  fadeInSlots?: number;
  /** Slots to fade a panel out at the vanishing point. */
  fadeOutSlots?: number;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function wrap(value: number, length: number) {
  return ((value % length) + length) % length;
}

export function CorridorGallery({
  items = projects,
  desktopPerSide = DESKTOP_PER_SIDE,
  mobilePerSide = MOBILE_PER_SIDE,
  headline = DEFAULT_HEADLINE,
  caption = DEFAULT_CAPTION,
  enabled = true,
  id = "corridor-gallery",
  className,
  speed = CORRIDOR_SPEED,
  fadeInSlots = CORRIDOR_FADE_IN_SLOTS,
  fadeOutSlots = CORRIDOR_FADE_OUT_SLOTS,
}: CorridorGalleryProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<HTMLDivElement>(null);
  const tRef = useRef(0);

  /*
    The server cannot know the viewport, so it renders the desktop count. The
    first effect corrects it on a phone or tablet. The swap happens below the
    fold, before the gallery is visible.
  */
  const [isDesktop, setIsDesktop] = useState(true);

  useEffect(() => {
    const query = window.matchMedia("(min-width: 1024px)");
    const apply = () => setIsDesktop(query.matches);

    apply();
    query.addEventListener("change", apply);

    return () => query.removeEventListener("change", apply);
  }, []);

  const perSide = Math.min(
    isDesktop ? desktopPerSide : mobilePerSide,
    items.length,
  );
  const panelCount = items.length === 0 ? 0 : Math.max(1, perSide) + OVERSCAN;
  const wall = Array.from(
    { length: panelCount },
    (_, index) => items[index % Math.max(items.length, 1)],
  );
  const headingId = `${id}-heading`;

  useEffect(() => {
    if (!enabled) return;

    const section = sectionRef.current;
    const stage = stageRef.current;
    const scene = sceneRef.current;
    if (!section || !stage || !scene) return;

    const panelEls = Array.from(
      scene.querySelectorAll<HTMLElement>(".corridor-panel"),
    );
    if (panelEls.length === 0) return;

    const count = panelEls.reduce(
      (max, el) => Math.max(max, Number(el.dataset.index ?? 0) + 1),
      0,
    );
    if (count === 0) return;

    const panels = panelEls.map((el) => ({
      el,
      index: Number(el.dataset.index ?? 0),
      side: Number(el.dataset.side ?? -1),
    }));

    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const metrics = {
      slot: 300,
      baseX: 0,
      angle: DESKTOP_ANGLE,
      inward: DESKTOP_INWARD,
    };

    let frame = 0;
    let lastTime = 0;
    let visible = false;
    let t = tRef.current;

    const readMetrics = () => {
      const panelWidth = panelEls[0].offsetWidth || 300;
      const gap = isDesktop ? PANEL_GAP_DESKTOP : PANEL_GAP_MOBILE;
      const stageWidth = stage.clientWidth || window.innerWidth;

      metrics.slot = panelWidth + gap;
      metrics.baseX =
        stageWidth * ((isDesktop ? DESKTOP_BASE_X : MOBILE_BASE_X) / 100);
      metrics.angle = isDesktop ? DESKTOP_ANGLE : MOBILE_ANGLE;
      metrics.inward = isDesktop ? DESKTOP_INWARD : MOBILE_INWARD;
    };

    const opacityFor = (position: number) => {
      const fadeIn = clamp(position / Math.max(fadeInSlots, 0.0001), 0, 1);
      const fadeOut = clamp(
        (count - position) / Math.max(fadeOutSlots, 0.0001),
        0,
        1,
      );

      return Math.min(fadeIn, fadeOut);
    };

    const draw = () => {
      panels.forEach(({ el, index, side }) => {
        const position = wrap(index + t, count);
        const depth = -position * metrics.slot * DEPTH_PER_SLOT;
        const x =
          side * (metrics.baseX - position * metrics.slot * metrics.inward);
        const opacity = opacityFor(position);

        el.style.transform = [
          "translate(-50%, -50%)",
          `translate3d(${x.toFixed(2)}px, 0, ${depth.toFixed(2)}px)`,
          `rotateY(${-side * metrics.angle}deg)`,
        ].join(" ");
        el.style.opacity = opacity.toFixed(3);
      });
    };

    const stop = () => {
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
    };

    const start = () => {
      if (frame || motionQuery.matches || !visible || document.hidden) {
        return;
      }

      lastTime = 0;
      frame = requestAnimationFrame(step);
    };

    const step = (now: number) => {
      frame = 0;

      if (motionQuery.matches || !visible || document.hidden) return;

      if (lastTime === 0) lastTime = now;
      const delta = Math.min(Math.max(now - lastTime, 0) / 1000, DELTA_CLAMP);
      lastTime = now;

      t = wrap(t + speed * CORRIDOR_DIRECTION * delta, count);
      tRef.current = t;
      draw();

      frame = requestAnimationFrame(step);
    };

    const onVisibilityChange = () => {
      if (document.hidden) stop();
      else start();
    };

    const onMotionChange = () => {
      if (motionQuery.matches) {
        stop();
        draw();
      } else {
        start();
      }
    };

    readMetrics();

    /*
      A reduced-motion visit gets a complete frozen frame, not the empty
      starting slot: t=0 would put the first panel on a zero-opacity edge.
    */
    if (motionQuery.matches && t === 0) {
      t = Math.min(fadeInSlots, count / 2);
      tRef.current = t;
    }

    draw();

    const observer = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        if (visible) start();
        else stop();
      },
      { threshold: 0.01 },
    );
    observer.observe(section);

    const resizeObserver = new ResizeObserver(() => {
      readMetrics();
      draw();
    });
    resizeObserver.observe(stage);
    resizeObserver.observe(panelEls[0]);

    document.addEventListener("visibilitychange", onVisibilityChange);
    motionQuery.addEventListener("change", onMotionChange);

    return () => {
      stop();
      observer.disconnect();
      resizeObserver.disconnect();
      document.removeEventListener("visibilitychange", onVisibilityChange);
      motionQuery.removeEventListener("change", onMotionChange);
    };
  }, [enabled, isDesktop, panelCount, speed, fadeInSlots, fadeOutSlots]);

  const renderPanel = (project: Project, index: number, side: -1 | 1) => (
    <a
      key={`${side}-${index}-${project.slug}`}
      className="corridor-panel"
      href={project.demo}
      target="_blank"
      rel="noreferrer"
      data-side={side}
      data-index={index}
      aria-label={`${project.title} — open project`}
      /*
        The right wall mirrors the left. Hiding it from the accessibility tree
        keeps a screen reader from hearing every project twice, and removing
        it from the tab order keeps focus off the duplicates.
      */
      aria-hidden={side === 1 ? "true" : undefined}
      tabIndex={side === 1 ? -1 : undefined}
    >
      <span className="corridor-panel__media">
        <Image
          src={project.image}
          alt=""
          fill
          sizes="(min-width: 1024px) 460px, 300px"
          className="corridor-panel__image"
          draggable={false}
        />
      </span>
      <span className="corridor-panel__meta" aria-hidden="true">
        <span className="corridor-panel__title">{project.title}</span>
        <span className="corridor-panel__action">Open project</span>
      </span>
      <span className="corridor-panel__badge" aria-hidden="true">
        ↗
      </span>
    </a>
  );

  return (
    <section
      ref={sectionRef}
      id={id}
      className={`corridor-gallery ${className ?? ""}`}
      aria-labelledby={headingId}
    >
      <div className="corridor-gallery__header">
        <h2 id={headingId} className="corridor-gallery__title">
          {headline}
        </h2>
      </div>

      <div ref={stageRef} className="corridor-gallery__stage">
        <div ref={sceneRef} className="corridor-gallery__scene">
          {wall.map((project, index) => renderPanel(project, index, -1))}
          {wall.map((_project, index) =>
            renderPanel(wall[wall.length - 1 - index], index, 1),
          )}
        </div>
      </div>

      <p className="corridor-gallery__caption">{caption}</p>
    </section>
  );
}

export default CorridorGallery;
