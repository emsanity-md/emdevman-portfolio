"use client";

import { useCallback, useState, useSyncExternalStore } from "react";
import Image from "next/image";

import Lanyard from "./ui/Lanyard";

export interface LanyardBadgeProps {
  /** Printed under the portrait, in caps. */
  name: string;
  /** Printed under the name, in caps. */
  role: string;
  /** Printed after an `ID:` label at the foot of the text block. */
  id: string;
  /**
   * The portrait.
   *
   * A string, not a `StaticImageData`, because the card face is a canvas
   * texture - the image is fetched and drawn by the renderer, which needs a
   * URL. `import portrait from "./x.png"` then `portrait.src` is the shape
   * that works; the static import still gets the hashing and the dimensions.
   */
  imageSrc: string;
  /** Repeat this along the strap. */
  strapText?: string;
  /**
   * Printed on the reverse, centred, above an attribution.
   *
   * Twenty words or fewer. The block is three lines tall and anything longer is
   * cut mid-sentence, which looks like a bug rather than a choice.
   */
  quote?: string;
  /** Attribution under the quote. */
  quoteBy?: string;
  className?: string;
}

/*
  The card stock, read off the document rather than tracked in state.

  `--card` is a different colour in light and dark, and it cannot simply be
  handed to `Lanyard` as `var(--card)`: the face is painted by assigning the
  string to `ctx.fillStyle`, and a canvas resolves only concrete colours. So the
  literal hex the token resolves to is what gets passed.

  Reading it into `useState` from an effect is the obvious version and it is the
  wrong one - a synchronous `setState` in an effect body is a second render pass
  on mount and again on every theme change, for a value that already has a
  change signal attached. `useSyncExternalStore` is built for exactly this: it
  reads the token as a snapshot and re-reads only when the thing it came from
  actually changes.

  Two things can change it, and both are subscribed to. The theme control writes
  a class on `<html>`, which is an attribute mutation. `system` is one step
  further out: nothing on the document changes when the OS flips, the media query
  result does.
*/

const FALLBACK_STOCK = "#ffffff";

const watchStock = (notify: () => void) => {
  const observer = new MutationObserver(notify);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["class", "style", "data-design"],
  });

  const media = window.matchMedia("(prefers-color-scheme: dark)");
  media.addEventListener("change", notify);

  return () => {
    observer.disconnect();
    media.removeEventListener("change", notify);
  };
};

/**
 * The card stock, straight from the `--card` token.
 *
 * The badge adapts to the theme the way every other surface on the site does:
 * white in light mode, near-black in dark. An earlier version tried to force
 * contrast by substituting the *opposite* of whatever the theme was - a light
 * card on a dark page - and that was wrong. A badge that fights the theme reads
 * as a mistake, and it stopped looking like it belonged to the design.
 *
 * The canvas cannot take `var(--card)` directly: the face is painted by
 * assigning the string to `ctx.fillStyle`, and a canvas resolves only concrete
 * colours. So the token is read and its resolved value passed.
 */
const readStock = () => {
  if (typeof document === "undefined") return FALLBACK_STOCK;
  return getComputedStyle(document.documentElement).getPropertyValue("--card").trim() || FALLBACK_STOCK;
};

/**
 * The active design, read from the `data-design` attribute.
 *
 * The attribute on `<html>` is the site's single source of truth for the
 * design - the pre-paint script writes it before React boots, the CSS keys off
 * it, and the switcher changes it. This reads it the same way, rather than
 * through the React context, for one reason: the context only updates when
 * `setActiveDesign` runs, and anything that sets the attribute by another route
 * would leave this component believing it was still on v3 with the canvas
 * running and the layout box hidden.
 *
 * Subscribing to the attribute rather than to the context means the badge
 * follows the design however it was changed.
 */
const watchDesign = (notify: () => void) => {
  const observer = new MutationObserver(notify);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-design"] });
  return () => observer.disconnect();
};

const readDesign = () => document.documentElement.getAttribute("data-design") ?? "";

/**
 * An ID badge on a lanyard.
 *
 * Everything a badge needs - the name, the role, the number, the woven strap -
 * is painted into the card's own texture and then behaves like print on a
 * physical object. It is drawn once, and from then on it swings, catches the
 * light and casts a shadow without anything re-rendering.
 *
 * Sizing is the one thing worth knowing about. `Lanyard` renders `w-full h-full`
 * on an empty div and fits the card to whatever box it is given, so the box has
 * to have a height - an auto-height parent collapses to zero and the canvas
 * never appears. The `aspect-[4/5]` below is the card plus the strap above it:
 * the card is 1.6 x 2.25, and roughly a fifth of that again hangs above the
 * slot.
 *
 * Motion is the existing solver, not a spring layered over it. Dragging already
 * pulls the card through a constraint system with real tension and damping, so
 * the badge settles on its own; a Framer Motion spring on the wrapper would be
 * a second system animating the same transform, and the two would disagree on
 * every frame. The idle sway is fed into the same solver as a small force, so a
 * swaying card that is also being dragged is still one simulation.
 *
 * `prefers-reduced-motion` is honoured inside `Lanyard`: the sway is zeroed and
 * the card stops rendering frames once it settles. Drag stays available, since
 * that is a gesture the visitor asked for.
 */
export default function LanyardBadge({
  name,
  role,
  id,
  imageSrc,
  strapText = "EMMANUEL.DEV",
  quote = "The beautiful thing about learning is nobody can take it away from you.",
  quoteBy = "B.B. King",
  className = "",
}: LanyardBadgeProps) {
  const design = useSyncExternalStore(watchDesign, readDesign, () => "");
  const cardColor = useSyncExternalStore(watchStock, readStock, () => FALLBACK_STOCK);
  const [ready, setReady] = useState(false);
  const markReady = useCallback(() => setReady(true), []);

  /*
    The badge is v3's and v3's only.

    This cannot be left to CSS. The hero lives in `.legacy-only`, which is
    `display: none` for every design but v3 - but the canvas is a fixed layer
    on `<body>`, outside that wrapper, so it is not hidden with the rest of the
    hero. It would render on v1, v2, v4 and v5, hanging from a layout box that
    those designs have hidden: a 0x0 rect, an anchor at NaN, and a canvas
    painting nothing. That was the "nothing happened".

    So the decision is made here, in React, where it can actually stop the
    canvas from being created. Unmounting `Lanyard` runs its cleanup, which
    removes the canvas from the body - so switching designs at runtime tears
    the layer down and puts it back.
  */
  const isV3 = design === "v3";

  /*
    The label is the accessible name.

    The canvas inside `Lanyard` is `aria-hidden` - it is a picture of a picture
    of the portrait - so without this the badge would announce as an unlabelled
    group and the person on it would be invisible to a screen reader. The alt
    text on the fallback image below is empty for the same reason and the same
    way: announcing both would be two portraits.
  */
  const label = `${name}, ${role}. ID ${id}.`;

  return (
    <div
      role="img"
      aria-label={label}
      className={`relative mx-auto aspect-[4/5] w-full max-w-[22rem] select-none ${className}`.trim()}
    >
      {/*
        The fallback, and the reason `Lanyard` grew an `onReady`.

        `new THREE.WebGLRenderer` throws where there is no WebGL context - an
        old device, a locked-down browser, a headless screenshot - and the
        effect returns early when it does. Without this underneath, a visitor in
        that situation gets no badge at all, which is worse than the design it
        replaced.

        It stays in the DOM either way: crossfading keeps the card from
        appearing against a hole, and `display: none` here would reflow the
        column on mount.

        This is also the only element here that occupies space. The canvas is a
        fixed layer on `<body>` and draws the badge outside this box - this box
        exists to reserve the hero column's width and to tell the scene where
        to hang the card from.
      */}
      {isV3 ? (
        <Image
          src={imageSrc}
          alt=""
          aria-hidden="true"
          draggable={false}
          fill
          loading="eager"
          fetchPriority="high"
          sizes="(min-width: 640px) 22rem, 90vw"
          className={`object-contain transition-opacity duration-500 motion-reduce:transition-none ${
            ready ? "opacity-0" : "opacity-100"
          }`}
        />
      ) : null}

      {isV3 ? (
        <Lanyard
          frontImage={imageSrc}
          cardColor={cardColor}
          /*
            `contain`, not `cover`, and deliberately so.

            The portrait is a cut-out on transparency. Cover-filling the photo band
            would crop it at the shoulders, because a square source has to lose its
            sides to fill a taller box. Contained, the card stock shows through
            the cut-out - which is exactly what a printed photo on a badge looks
            like.
          */
          imageFit="contain"
          orientation="portrait"
          finish="glossy"
          cornerRadius={0.3}
          size={0.68}
          anchor="center"
          strapLength={0.5}
          strapColor="#111111"
          strapWidth={0.72}
          metal="silver"
          gravity={1}
          damping={0.5}
          elasticity={0.5}
          breeze={0.35}
          sway={0.5}
          shadow={0.5}
          sheen={1}
          interactive
          intro
          name={name}
          role={role}
          badgeId={id}
          barcode
          strapText={strapText}
          quote={quote}
          quoteBy={quoteBy}
          onReady={markReady}
        />
      ) : null}
    </div>
  );
}
