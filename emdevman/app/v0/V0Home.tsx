"use client";

import Image from "next/image";
import { useCallback, useState } from "react";

import portrait from "@/app/assets/portrait-no-bg.png";
import { designs, isDesignId } from "@/app/lib/designs";
import { DESIGN_GLYPHS, V0_CARD_DESIGNS } from "@/app/lib/designGlyphs";
import { useDesign } from "@/app/context/DesignProvider";
import { useRevealTransition } from "@/app/hooks/useRevealTransition";
import { V0Carousel, type V0CarouselItem } from "./V0Carousel";

import "./v0.css";

/**
 * Whether the entrance has already played in this document.
 *
 * Module scope, not state, and not sessionStorage. A refresh reloads the module
 * and the ring rises again; switching away and back inside the same document
 * remounts nothing and does not replay it, because a page that restages its
 * entrance every time you tab back to it is a page that will not sit still.
 */
let introPlayed = false;

/**
 * The five cards, built once.
 *
 * Icon-only on purpose: the version names live in the dropup on every other
 * design, and a ring of five labelled tiles competes with the portrait behind
 * it. The label survives as the card's accessible name, which is the one place
 * it still has to be said.
 */
const CARDS: V0CarouselItem[] = V0_CARD_DESIGNS.map((id) => {
  const Icon = DESIGN_GLYPHS[id];

  return {
    id,
    label: `${designs[id].label} design, ${designs[id].span}`,
    icon: <Icon aria-hidden="true" />,
  };
});

/**
 * v0: the front door.
 *
 * A portrait and a ring of five cards, one per older design. There is no page
 * around it - no nav, no footer, no scroll, no dropup - because there is
 * nothing to read and one thing to choose. Picking a card applies that design
 * through the same `setDesign` the dropup uses, with the circular reveal
 * growing out of the card that was pressed, so leaving the ring looks like
 * opening the card rather than like a page swap.
 *
 * The entrance is the page: the cards fly up into the ring, and the portrait
 * fades in underneath them once the last one has landed. `onIntroDone` is what
 * times that handover - the alternative is a timeout in this file that has to
 * guess at the carousel's own duration and will be wrong the first time either
 * one is tuned.
 */
export function V0Home() {
  const { setDesign } = useDesign();
  const reveal = useRevealTransition();

  /*
    Both are captured on the first render, before the carousel has run, so they
    agree: if the rise is going to play, the portrait starts hidden and the
    carousel's callback reveals it. If it has already played in this document,
    both start settled and the callback is a no-op.
  */
  const [intro] = useState(() => !introPlayed);
  const [portraitIn, setPortraitIn] = useState(() => introPlayed);

  const handleIntroDone = useCallback(() => {
    introPlayed = true;
    setPortraitIn(true);
  }, []);

  const handleSelect = useCallback(
    (id: string, anchor: HTMLElement | null) => {
      if (!isDesignId(id)) return;
      reveal(anchor, () => setDesign(id));
    },
    [reveal, setDesign],
  );

  return (
    <div className="v0-root">
      {/*
        The name, for anyone who arrives without a screen. The portrait is the
        only visual identity on the page, and an image alone is not a heading.
      */}
      <h1 className="sr-only">Emmanuel Bitancor</h1>

      {/*
        The smoke.

        Four blurred blooms of the page's own ink, each drifting on its own path
        and its own clock. Monochrome and slow on purpose: it sits behind a
        portrait, so anything with a colour or a hurry in it would compete with
        the face. CSS only, so it is in the first paint, costs no JavaScript and
        survives with scripting off - and it is the one thing on v0 that keeps
        moving after the entrance has landed.
      */}
      <div className="v0-smoke" aria-hidden="true">
        <span />
        <span />
        <span />
        <span />
      </div>

      <div
        className={`v0-portrait${portraitIn ? " v0-portrait--in" : ""}`}
        aria-hidden="true"
      >
        <Image
          src={portrait}
          alt=""
          width={1122}
          height={1402}
          /*
            The portrait is sized by height, so its width is `100vh` times the
            source ratio - 1122/1402, which is 0.8. `80vh` is therefore the exact
            width it will occupy, at any viewport, which is what `sizes` wants:
            a percentage or `100vw` would under-ask on a phone and hand back a
            file smaller than the box it fills.
          */
          sizes="80vh"
          loading="eager"
          fetchPriority="high"
        />
      </div>

      <div className="v0-ring">
        <V0Carousel
          items={CARDS}
          intro={intro}
          onIntroDone={handleIntroDone}
          onSelect={handleSelect}
        />
      </div>
    </div>
  );
}
