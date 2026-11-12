"use client";

/*
  The v0 card carousel.

  Three vertical tracks, each holding one column of designs, scrolling at its
  own speed and alternating direction. The motion is CSS: the track is a fixed
  number of identical copies and the animation translates it by exactly half its
  own height, so the loop is seamless without measuring anything in JavaScript.

  Two things JavaScript does own:

    - Which layout is rendered. Columns above 900px, and one horizontal strip
      below it. They need different markup (three tracks against one), and CSS
      cannot turn three independent animation containers into one, so the
      breakpoint is read with `useSyncExternalStore`. The server snapshot is the
      desktop layout, which is also what the prerendered page contains - so
      hydration always agrees, and a phone swaps over once, on the client.

    - Pausing off-screen and on a hidden tab. Hover, focus and the pause button
      are pure CSS (`animation-play-state`), because those states are visible to
      the stylesheet and re-rendering for them would be a round trip for nothing.

  Duplicates are decorative. Only the first copy of each design is focusable and
  named; the rest are `aria-hidden` and `tabindex="-1"`, so a screen reader hears
  five cards rather than eighteen and Tab never lands on a copy.

  Nothing here is adapted from React Bits: the motion is a pair of keyframes on
  a flex track. The licence notice that used to sit beside this file was retired
  along with the ring it covered.
*/

import { Pause, Play } from "lucide-react";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
} from "react";

export interface V0CarouselItem {
  id: string;
  /** The card's screen-reader name, e.g. "Open the v4 design, 2026". */
  label: string;
  /** The card's only visible content. */
  icon: ReactNode;
}

interface V0CarouselProps {
  /** The five designs, in menu order. Used for the horizontal strip. */
  items: V0CarouselItem[];
  /** How those designs are grouped into desktop columns. */
  columns: V0CarouselItem[][];
  /** Apply one design. `anchor` is the card that was pressed, for the reveal. */
  onSelect: (id: string, anchor: HTMLElement | null) => void;
}

/*
  Six copies per column, not two: the animation moves the track by half its
  height, so a column needs three full copies to fill the stage at every viewport
  height. Six halves evenly, which is the part that matters - an odd count would
  put the loop seam a copy out of step.

  The strip repeats the whole set four times for the same reason in one row.
*/
const COLUMN_COPIES = 6;
const STRIP_COPIES = 4;

/* Seconds per copy of a two-card column. Calibrated once by eye: fast enough to
   read as movement, slow enough that a card does not slide out from under a
   cursor that is about to click it. */
const SECONDS_PER_COPY = 38;
const STRIP_DURATION = "56s";

const STACKED_QUERY = "(max-width: 900px)";

function withCopies(list: V0CarouselItem[], copies: number) {
  return Array.from({ length: copies }, (_, copy) =>
    list.map((item) => ({ item, copy })),
  ).flat();
}

/**
 * The breakpoint, for choosing between columns and a strip.
 *
 * `useSyncExternalStore` rather than an effect and state: it reads the query
 * before paint on the client, returns the server snapshot during hydration, and
 * re-renders when the query changes. An effect would render the desktop columns
 * for a frame on every phone.
 */
function useIsStacked() {
  return useSyncExternalStore(
    (onChange) => {
      const query = window.matchMedia(STACKED_QUERY);
      query.addEventListener("change", onChange);
      return () => query.removeEventListener("change", onChange);
    },
    () => window.matchMedia(STACKED_QUERY).matches,
    () => false,
  );
}

export function V0Carousel({ items, columns, onSelect }: V0CarouselProps) {
  const stacked = useIsStacked();
  const rootRef = useRef<HTMLDivElement>(null);

  const [paused, setPaused] = useState(false);
  const [cardFocused, setCardFocused] = useState(false);
  const [onScreen, setOnScreen] = useState(true);
  const [tabHidden, setTabHidden] = useState(false);

  /*
    The click handler is created once and reads the current callback from a ref.
    Writing the ref in an effect rather than during render is what the React
    Compiler's ref rule asks for.
  */
  const onSelectRef = useRef(onSelect);
  useEffect(() => {
    onSelectRef.current = onSelect;
  }, [onSelect]);

  /* Stop the loop when the cards leave the viewport. The page is one screen, so
     in practice this only fires on the stacked layout, where they scroll off. */
  useEffect(() => {
    const node = rootRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(([entry]) => {
      setOnScreen(entry.isIntersecting);
    });
    observer.observe(node);

    return () => observer.disconnect();
  }, []);

  /* And when the tab is hidden - a carousel behind a background tab is a
     compositor animation nobody is watching. */
  useEffect(() => {
    const update = () => setTabHidden(document.hidden);
    update();
    document.addEventListener("visibilitychange", update);
    return () => document.removeEventListener("visibilitychange", update);
  }, []);

  const handleCardClick = useCallback(
    (event: ReactMouseEvent<HTMLAnchorElement>, id: string) => {
      /* Modified clicks are left to the browser: the href is a real address, so
         ctrl/cmd-click opens that design in a new tab. */
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      onSelectRef.current(id, event.currentTarget);
    },
    [],
  );

  const renderCard = (item: V0CarouselItem, clone: boolean, key: string) => (
    <a
      key={key}
      className="v0-card"
      href={`/?design=${item.id}`}
      data-version={item.id}
      data-clone={clone ? "" : undefined}
      /* A duplicate is the same card visually and the same link underneath, but
         it is not a second control: it is hidden from assistive tech and skipped
         by Tab. */
      aria-hidden={clone || undefined}
      tabIndex={clone ? -1 : undefined}
      aria-label={clone ? undefined : item.label}
      onClick={(event) => handleCardClick(event, item.id)}
    >
      {item.icon}
      <span className="v0-card__label">{item.id}</span>
    </a>
  );

  return (
    <div className="v0-cards" ref={rootRef}>
      <div
        className="v0-gallery"
        role="region"
        aria-roledescription="carousel"
        aria-label="Design versions"
        data-paused={paused || !onScreen || tabHidden ? "" : undefined}
        data-focused={cardFocused ? "" : undefined}
        /*
          Focusing a card rewinds the tracks (see the stylesheet). The first copy
          of each design is the focusable one, and it is the copy at the top of
          the track - without the rewind, a keyboard user could Tab to a card
          that the animation had already carried out of the column.
        */
        onFocus={() => setCardFocused(true)}
        onBlur={() => setCardFocused(false)}
      >
        {stacked ? (
          <div className="v0-gallery__stage v0-gallery__stage--strip">
            <div
              className="v0-track v0-track--strip"
              style={{ "--v0-duration": STRIP_DURATION } as CSSProperties}
            >
              {withCopies(items, STRIP_COPIES).map(({ item, copy }) =>
                renderCard(item, copy > 0, `${item.id}-${copy}`),
              )}
            </div>
          </div>
        ) : (
          <div className="v0-gallery__stage v0-gallery__stage--columns">
            {columns.map((column, index) => (
              <div className="v0-gallery__column" key={index}>
                <div
                  className="v0-track"
                  data-dir={index % 2 === 0 ? "up" : "down"}
                  style={
                    {
                      /* Duration is per column, not per track: a column with one
                         card has half the distance to cover, so it needs half
                         the time to move at the same speed. */
                      "--v0-duration": `${column.length * SECONDS_PER_COPY}s`,
                      /* A negative delay starts each column part-way round, so
                         the group is staggered from the first frame instead of
                         falling into step once it has run once. */
                      "--v0-delay": `-${index * 12}s`,
                    } as CSSProperties
                  }
                >
                  {withCopies(column, COLUMN_COPIES).map(({ item, copy }) =>
                    renderCard(item, copy > 0, `${item.id}-${copy}`),
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/*
        WCAG 2.2.2: the cards move on their own for more than five seconds, so
        there is a visible way to stop them. `aria-pressed` carries the state;
        the label says what pressing it will do.
      */}
      <button
        type="button"
        className="v0-pause"
        aria-pressed={paused}
        aria-label={
          paused
            ? "Play the design carousel"
            : "Pause the design carousel"
        }
        onClick={() => setPaused((value) => !value)}
      >
        {paused ? <Play aria-hidden="true" /> : <Pause aria-hidden="true" />}
        <span>{paused ? "Play" : "Pause"}</span>
      </button>
    </div>
  );
}
