"use client";

import Image from "next/image";
import { useCallback, useLayoutEffect, useRef } from "react";

import portrait from "@/app/assets/portrait-no-bg.png";
import BrandMark from "@/app/components/ui/BrandMark";
import { designs, isDesignId } from "@/app/lib/designs";
import { techCategories } from "@/app/lib/tech";
import { V0_CARD_DESIGNS } from "@/app/lib/designGlyphs";
import { EMAIL_MAILTO } from "@/app/lib/contact";
import { useDesign } from "@/app/context/DesignProvider";
import { useRevealTransition } from "@/app/hooks/useRevealTransition";
import InfiniteSpiral from "./InfiniteSpiral";
import LightRays from "./LightRays";
import SplitText from "./SplitText";
import { V0_SPIRAL_ITEMS } from "./v0CardArt";

import "./v0.css";

/**
 * The roots whose entrance has already been started in this document.
 *
 * A WeakSet rather than a boolean because React StrictMode runs the effect
 * twice on the same element in development: the second run must leave the first
 * run's timer alone instead of settling the page early. A genuinely new root -
 * a remount - is a new element and gets its own entrance.
 */
const introducedRoots = new WeakSet<Element>();

/**
 * The three links under the name.
 *
 * The addresses are the ones the footer and v1's contact rows already use. They
 * are duplicated rather than imported because the other two designs build their
 * own link lists from scratch; pulling those in would mean importing a section
 * component for two strings.
 */
/**
 * The toolkit, flattened in page order.
 *
 * The same `techCategories` the v1/v3 toolkit renders, so the marks above the
 * sign-off cannot drift from the section that names them. Widened to `string`
 * because the categories are `as const` and `flatMap` over a union of tuples
 * infers a union of tuples rather than one array.
 */
const STACK: string[] = techCategories.flatMap((category) =>
  category.skills.map((skill) => skill.name as string),
);

const LINKS = [
  {
    label: "Github",
    href: "https://github.com/emsanity-md",
    external: true,
  },
  {
    label: "LinkedIn",
    href: "https://www.linkedin.com/in/emmanuel-bitancor-40a582426",
    external: true,
  },
  {
    label: "Email",
    href: EMAIL_MAILTO,
    external: false,
  },
] as const;

/**
 * v0: the front door.
 *
 * A header, a name, a portrait and a spiral of five cards, one per older
 * design. There is no page around it - no nav, no footer, no scroll, no dropup -
 * because there is nothing to read and one thing to choose.
 *
 * The stacking order is the layout: texture, then portrait, then the name over
 * its shoulder, then the cards. The name overlaps the portrait on purpose at
 * narrow widths, which is only legible if the portrait is behind it.
 *
 * The cards are React Bits' InfiniteSpiral rather than five plain tiles: a
 * vertical helix that turns on its own, is dragged, and follows the page scroll
 * on a phone. Each card is a real link to its design, so middle-click and
 * ctrl-click work; an ordinary click commits the design through the same
 * `setDesign` the dropup uses, with the wipe anchored on the card that was
 * pressed. The spiral is a `role="list"` of links, so it reads as five choices
 * to a screen reader instead of as five decorative images.
 */
export function V0Home() {
  const { setDesign } = useDesign();
  const reveal = useRevealTransition();

  const rootRef = useRef<HTMLDivElement>(null);

  /*
    `data-intro` is in the markup below, not added here, so the hidden starting
    state is already in the first paint. That matters twice: the browser cannot
    coalesce the start and end states into one recalc and skip the transition,
    and a reader with scripting off never enters the animation at all - the
    stylesheet only applies these states under `scripting: enabled`.

    This effect only starts the clock. The timer is not cleaned up on purpose:
    StrictMode runs the effect twice in development, the second run returns
    early on `introducedRoots`, and a cleanup would cancel the only timer that
    ever gets scheduled - leaving the page half-entered forever.
  */
  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root || introducedRoots.has(root)) return;
    introducedRoots.add(root);
    window.setTimeout(() => root.setAttribute("data-entered", ""), 80);
  }, []);

  /*
    The cards are anchors, so the browser already knows how to open one in a new
    tab. An unmodified left click is intercepted: the wipe grows from the card
    that was pressed and the design changes in place, which is the same path the
    dropup takes. A drag is cancelled by the component before this runs, so
    turning the spiral never opens a version by accident.
  */
  const handleCardClick = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }
      const anchor = (event.target as HTMLElement).closest<HTMLAnchorElement>(
        "a[href]",
      );
      if (!anchor) return;
      const id = new URL(anchor.href, window.location.href).searchParams.get(
        "design",
      );
      if (!id || !isDesignId(id)) return;
      event.preventDefault();
      reveal(anchor, () => setDesign(id));
    },
    [reveal, setDesign],
  );

  return (
    <div className="v0-root" data-intro="" ref={rootRef}>
      {/*
        The backdrop.

        React Bits' LightRays: a WebGL beam of light falling from the top of
        the frame, under a CSS wash of light and a grain overlay. The rays are
        the page's light source rather than decoration, so they come from the
        top-centre, behind the name, and reach far enough to pass the portrait.

        The colour is read from the page's tokens in `v0.css` rather than hard
        coded twice, so the beam warms on paper and cools on charcoal. It is one
        of two things on this page that move, the cards being the other, and it
        honours `prefers-reduced-motion` in the component itself.
      */}
      <div className="v0-texture" aria-hidden="true">
        <LightRays
          className="v0-rays"
          raysOrigin="top-center"
          raysColor="#ffffff"
          raysSpeed={0.5}
          lightSpread={0.6}
          rayLength={2.6}
          rayDensity={1.1}
          raySharpness={0.4}
          glow={0.55}
          haze={0.3}
          fadeDistance={1.4}
          intensity={0.6}
          followMouse
          mouseInfluence={0.12}
          cursorShadow
          clickPulse
          opacity={0.9}
        />
        <div className="v0-texture__wash" />
        <div className="v0-texture__grain" />
      </div>

      <header className="v0-header">
        <p className="v0-mark">
          <span className="v0-mark__initials">EB</span>
          <span className="v0-mark__rule" aria-hidden="true" />
          <span className="v0-mark__role">Software Developer</span>
        </p>

        <p className="v0-motto">Idea / Execute / Improve</p>
      </header>

      {/*
        The left column: name, accent bars, links, tech marks and tagline, in
        that order and in normal flow.

        These five blocks used to live in two separate blocks pinned at
        `top: 33%` and `top: 66%`. That worked only while the name was short:
        the name scales with `vw` while the two offsets scale with `vh`, so on a
        wide, short viewport (1440x700) the name grew downward into a sign-off
        pinned at a fixed percentage and the links landed on the tech marks.
        One flex column cannot overlap itself, so the anchors are gone.
      */}
      <div className="v0-column">
        {/*
          The visible name, and the page's only h1. It is set in two lines and
          two families - a geometric sans over a high-contrast serif - so the
          markup is two spans around one accessible name, not two headings.

          Each line is React Bits' SplitText rather than plain text: the letters
          rise out of their own line box on load, the surname a beat after the
          first name. SplitText keeps the full words in an `aria-label` and
          hides the generated character spans from assistive tech, so the h1
          still reads as "Emmanuel Bitancor".
        */}
        <h1 className="v0-name">
          <SplitText
            tag="span"
            text="Emmanuel"
            className="v0-name__first"
            effect="rise"
            splitType="chars"
            trigger="load"
            delay={38}
            duration={0.9}
            staggerFrom="start"
            textAlign="left"
            startDelay={0.08}
          />
          <SplitText
            tag="span"
            text="Bitancor"
            className="v0-name__last"
            effect="rise"
            splitType="chars"
            trigger="load"
            delay={38}
            duration={0.9}
            staggerFrom="start"
            textAlign="left"
            startDelay={0.2}
          />
        </h1>

        <div className="v0-bar" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>

        <ul className="v0-links">
          {LINKS.map((link) => (
            <li key={link.label}>
              <a
                href={link.href}
                {...(link.external
                  ? { target: "_blank", rel: "noopener noreferrer" }
                  : {})}
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        {/*
          The sign-off: the toolkit's marks, then the rule and the line. It is a
          sibling of the links inside this column rather than its own absolutely
          positioned block, so its position is whatever the blocks above it
          leave.
        */}
        <div className="v0-sign">
          <ul className="v0-stack" aria-label="Tech stack">
            {STACK.map((name) => (
              <li key={name} className="v0-stack__item">
                <BrandMark name={name} className="v0-stack__mark" />
                <span className="v0-stack__name">{name}</span>
              </li>
            ))}
          </ul>
          <div className="v0-sign__line">
            <span className="v0-sign__rule" aria-hidden="true" />
            <p className="v0-sign__text">Let&apos;s build something great</p>
          </div>
        </div>
      </div>

      <div className="v0-portrait" aria-hidden="true">
        <Image
          src={portrait}
          alt=""
          width={1222}
          height={1502}
          /*
            The portrait is sized by height, so its width is the viewport height
            times the source ratio - 1122/1502, which is 0.747. `sizes` wants that
            exact width: a percentage would under-ask on a phone and hand back a
            file smaller than the box it fills.
          */
          sizes="90vh"
          loading="eager"
          fetchPriority="high"
        />
      </div>

      {/*
        The cards. A spiral of five card faces generated from the design list,
        each one a link to its version. Clicking commits the design in place.

        The plain link list underneath is the no-JavaScript page: the spiral is
        positioned by script, so without it the cards would pile up in the
        centre. It is hidden under `scripting: enabled` so the two never both
        show.
      */}
      <div className="v0-cards" onClick={handleCardClick}>
        <div className="v0-spiral">
          <InfiniteSpiral
            items={V0_SPIRAL_ITEMS}
            animationMode="all"
            speed={0.3}
            direction="up"
            radius={132}
            cardWidth={118}
            cardHeight={157}
            verticalSpacing={58}
            perspective={1000}
            cardsPerTurn={5}
            rotation={16}
            cardTilt={-3}
            cardRadius={8}
            centerScale={1.16}
            edgeFade={0.18}
            edgeBlur={2.5}
            pauseOnHover
            imageFit="cover"
          />
        </div>

        <ul className="v0-fallback">
          {V0_CARD_DESIGNS.map((id) => (
            <li key={id}>
              <a href={`/?design=${id}`}>
                <span className="v0-fallback__label">{designs[id].label}</span>
                <span className="v0-fallback__span">{designs[id].span}</span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
