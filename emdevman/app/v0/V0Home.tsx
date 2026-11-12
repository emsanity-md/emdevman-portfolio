"use client";

import Image from "next/image";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

import portrait from "@/app/assets/portrait-no-bg.png";
import BrandMark from "@/app/components/ui/BrandMark";
import { designs, isDesignId } from "@/app/lib/designs";
import { techCategories } from "@/app/lib/tech";
import {
  V0_CARD_DESIGNS,
  type V0CardDesign,
} from "@/app/lib/designGlyphs";
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

/**
 * How much page is enough to justify the scroll cue.
 *
 * The floor is the button's own height: below that, the cue plus the band it
 * needs would be most of what is hidden, and a fixed button would be more
 * obstruction than guidance. Sixty-odd pixels of a cut-off sign-off is still a
 * real page, so the floor is 48 — the cue's 46px plus a hair of clearance.
 */
const SCROLL_CUE_MIN = 48;

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
 * design. There is no page around it - no nav, no footer, no dropup - because
 * there is nothing to read and one thing to choose.
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
 *
 * Under 900px the composition is rebuilt for a phone: the portrait moves above
 * the name, the ring gives way to a full-screen versions menu behind the
 * hamburger, and a fixed scroll cue appears once there is something below the
 * fold to reach. The markup is shared; `v0.css` owns the rearrangement.
 */
export function V0Home() {
  const { setDesign } = useDesign();
  const reveal = useRevealTransition();

  const rootRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLButtonElement>(null);

  /*
    Mobile-only UI state. Both start false and are resolved after mount, so
    the server markup and the first client paint agree. That matters for the
    cue in particular: it is hidden by default, and only a measured page can
    say whether there is anything below the fold.
  */
  const [menuOpen, setMenuOpen] = useState(false);
  const [showScrollCue, setShowScrollCue] = useState(false);

  const closeMenu = useCallback(() => setMenuOpen(false), []);
  const openMenu = useCallback(() => setMenuOpen(true), []);

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
    The cue sits on the bottom edge of the viewport, so the first fold has to
    end above it. Without that, a 320px phone starts the toolkit directly under
    the button and the top row of tiles reads as a missing tile.

    The gap is measured rather than authored: it is the distance from the links
    to the fold, and both ends move independently - the portrait is a share of
    the viewport, the name wraps with its own clamp - so there is no CSS
    expression for it. Only a page that already scrolls gets the gap; one where
    the whole composition fits keeps its compact form, cue and all.

    Written per resize, never per scroll. The page's height changes, and the
    cue's own observer is what notices.
  */
  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const sign = root.querySelector<HTMLElement>(".v0-sign");
    const links = root.querySelector<HTMLElement>(".v0-links");
    if (!sign || !links) return;

    const phone = window.matchMedia("(max-width: 900px)");
    let live = true;

    const apply = () => {
      if (!live) return;
      // Measure the page as the stylesheet alone would lay it out, so a gap
      // left over from a previous width cannot inflate the answer.
      sign.style.removeProperty("--v0-sign-gap");
      if (!phone.matches) return;

      const scrollable =
        document.documentElement.scrollHeight - window.innerHeight;
      if (scrollable <= SCROLL_CUE_MIN) return;

      /*
        The bottom of the links row in layout coordinates.

        Not a client rect: the entrance is still lifting the row by 10px when
        this runs, and a rect reports that transform, which would shorten the
        gap by exactly the distance the row still has to travel. Offsets are
        layout, so the answer is the same before and after the animation. The
        walk stops at the page root, whose own top is the document's.
      */
      let linksBottom = links.offsetHeight;
      for (
        let node: HTMLElement | null = links;
        node;
        node = node.offsetParent as HTMLElement | null
      ) {
        linksBottom += node.offsetTop;
        if (node === root) break;
      }

      const gap = Math.max(0, window.innerHeight + 12 - linksBottom);
      sign.style.setProperty("--v0-sign-gap", `${gap}px`);
    };

    apply();
    phone.addEventListener("change", apply);
    window.addEventListener("resize", apply);
    // The webfont changes the name's height, and with it everything below it.
    void document.fonts.ready.then(apply);

    return () => {
      live = false;
      phone.removeEventListener("change", apply);
      window.removeEventListener("resize", apply);
      sign.style.removeProperty("--v0-sign-gap");
    };
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

  /*
    The versions menu is a modal dialog, so the page owes it more than a class
    toggle: focus has to enter it, stay inside it, and come back to the button
    that opened it. Escape closes it. A resize past the phone breakpoint closes
    it too, because the hamburger that owns it is gone above 900px and the
    overlay would otherwise strand a desktop reader.
  */
  useEffect(() => {
    if (!menuOpen) return;

    const menu = menuRef.current;
    if (!menu) return;

    // Captured before focus moves, so closing can put the reader back where
    // they were. Usually the hamburger.
    const returnFocus =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;

    // The dialog's owner, read now rather than in the cleanup: reading the ref
    // there would be reading a value that may no longer name this node.
    const nav = navRef.current;

    const focusables = () =>
      Array.from(
        menu.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      );

    // The close button leads the tab order, so the first thing a screen reader
    // announces inside the dialog is the way out.
    menu
      .querySelector<HTMLElement>(".v0-menu__close")
      ?.focus({ preventScroll: true });

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setMenuOpen(false);
        return;
      }
      if (event.key !== "Tab") return;

      const items = focusables();
      if (!items.length) return;

      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;

      if (!menu.contains(active)) {
        event.preventDefault();
        (event.shiftKey ? last : first).focus();
        return;
      }
      if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    // The overlay covers the page, so the page behind it must not scroll
    // under a thumb. Restored rather than blanked, in case something else
    // had already set an inline value.
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const desktop = window.matchMedia("(min-width: 901px)");
    const onBreakpoint = (event: MediaQueryListEvent) => {
      if (event.matches) setMenuOpen(false);
    };

    document.addEventListener("keydown", onKeyDown);
    desktop.addEventListener("change", onBreakpoint);

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      desktop.removeEventListener("change", onBreakpoint);
      document.body.style.overflow = previousOverflow;

      /*
        Selecting a version hides the whole v0 tree rather than unmounting it,
        so the hamburger can be display:none by the time this runs. `offsetParent`
        is the cheap check for that: a hidden control is not a place to send
        focus, and focusing it would leave the reader on <body>.

        The hamburger is the owner of the dialog, so it is the return target
        even when the reader opened the menu with a pointer that did not focus
        the button. `returnFocus` is the fallback for the case where it was
        opened from somewhere else.
      */
      const target = nav ?? returnFocus;
      if (
        target &&
        target.isConnected &&
        target.offsetParent !== null
      ) {
        target.focus({ preventScroll: true });
      }
    };
  }, [menuOpen]);

  /*
    The scroll cue.

    It is only honest while the page has somewhere to go and the reader has not
    gone there yet: a desktop v0 is one viewport tall, so is a phone that
    happens to fit, and once the reader has scrolled the hint has done its job.
    Keeping it to the top also means it can never drift over the toolkit on the
    way down. It steps aside while the menu is open as well.

    Measuring after mount rather than during render keeps the server markup and
    the first client frame identical. The ResizeObserver watches the body, not
    the window: fonts and the portrait settling are what change the document's
    height, and neither fires a resize.
  */
  useEffect(() => {
    const update = () => {
      const scrollable =
        document.documentElement.scrollHeight - window.innerHeight;
      setShowScrollCue(
        !menuOpen && scrollable > SCROLL_CUE_MIN && window.scrollY < 24,
      );
    };

    update();

    const observer = new ResizeObserver(update);
    observer.observe(document.body);
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, { passive: true });

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update);
    };
  }, [menuOpen]);

  /*
    A version row in the menu. Same contract as a card: modified clicks keep
    their default navigation, an ordinary click commits the design in place.
    The wipe grows from the row that was pressed, and the menu closes in the
    same commit so the overlay is not still on screen around the new design.
  */
  const handleVersionClick = useCallback(
    (event: React.MouseEvent<HTMLAnchorElement>, id: V0CardDesign) => {
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
      event.preventDefault();
      const row = event.currentTarget;
      reveal(row, () => {
        setMenuOpen(false);
        setDesign(id);
      });
    },
    [reveal, setDesign],
  );

  /*
    One screen down. Reduced motion keeps the jump instead of the glide; the
    cue exists for readers who did not notice there was more page, and a long
    smooth scroll is the wrong thing to hand someone who asked for stillness.
  */
  const scrollToNext = useCallback(() => {
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    window.scrollBy({
      top: window.innerHeight,
      behavior: reduced ? "auto" : "smooth",
    });
  }, []);

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

        {/*
          The phone's menu button. Desktop v0 has the ring instead, so this is
          `display: none` above 900px and never enters the tab order there.
          `aria-expanded` describes the dialog it owns; the label names the
          destination rather than the glyph.
        */}
        <button
          type="button"
          className="v0-nav"
          ref={navRef}
          aria-label="Open design versions"
          aria-expanded={menuOpen}
          aria-controls="v0-versions"
          onClick={openMenu}
        >
          <span className="v0-nav__box" aria-hidden="true">
            <span />
            <span />
          </span>
        </button>
      </header>

      {/*
        The versions menu: a full-screen dialog rather than a dropup, because a
        phone has no room for a flyout under a thumb and the five destinations
        deserve the whole screen. It is mounted only while open, so its links
        never sit in the tab order behind the page.

        v0 is deliberately absent. This is the page the reader is already on;
        the five older designs are what the menu offers.
      */}
      {menuOpen && (
        <div
          className="v0-menu"
          id="v0-versions"
          role="dialog"
          aria-modal="true"
          aria-labelledby="v0-versions-title"
          ref={menuRef}
        >
          <header className="v0-menu__bar">
            <p className="v0-menu__mark">EB</p>
            <button
              type="button"
              className="v0-menu__close"
              aria-label="Close design versions"
              onClick={closeMenu}
            >
              <span aria-hidden="true" />
              <span aria-hidden="true" />
            </button>
          </header>

          <div className="v0-menu__body">
            <p className="v0-menu__eyebrow" id="v0-versions-title">
              Design versions
            </p>
            <ul className="v0-menu__list">
              {V0_CARD_DESIGNS.map((id) => (
                <li key={id} className="v0-menu__item">
                  <a
                    href={`/?design=${id}`}
                    className="v0-menu__row"
                    onClick={(event) => handleVersionClick(event, id)}
                  >
                    <span className="v0-menu__label">
                      {designs[id].label}
                    </span>
                    <span className="v0-menu__span">
                      {designs[id].span}
                    </span>
                    <svg
                      className="v0-menu__arrow"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={1.5}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M7 17 17 7" />
                      <path d="M8 7h9v9" />
                    </svg>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

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
            The portrait is sized by height on a desktop, so its width is the
            viewport height times the source ratio - 1222/1502, about 0.81. On a
            phone the same image is fitted inside a fixed-height box, so the
            `sizes` hint follows the box's width there instead of asking for a
            file larger than the one being drawn.
          */
          sizes="(max-width: 900px) 90vw, 90vh"
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

        Below 900px the spiral is hidden for a reader with script - the
        hamburger's menu is the picker there. The fallback is what comes back
        when scripting is off, and it is the same five destinations.
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

      {/*
        The phone's scroll cue.

        It is fixed to the bottom edge rather than in flow, because its job is
        to be visible from the top of the page, where the fold cuts the
        composition. `data-visible` is driven by measurement in the effect
        above: a page that fits, a page at its end, and the open menu all hide
        it. Under `scripting: none` the stylesheet hides it outright, since
        nothing would ever set the attribute.

        The arrow is decorative; the button's label is the instruction.
      */}
      <button
        type="button"
        className="v0-scroll"
        data-visible={showScrollCue ? "" : undefined}
        onClick={scrollToNext}
        aria-label="Scroll to the next section"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M12 5v14" />
          <path d="m6 13 6 6 6-6" />
        </svg>
      </button>
    </div>
  );
}
