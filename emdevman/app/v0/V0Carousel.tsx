"use client";

/*
  The v0 ring.

  Adapted from React Bits' Circular Carousel (https://reactbits.dev, (c) David
  Haz), used and modified under the MIT + Commons Clause licence. The full
  notice is in `LICENSE.react-bits.md` beside this file.

  What changed, and why:

    - The items are DOM cards, not photographs. The original slices each card
      into eight strips to bend it around the cylinder, which is what makes an
      image look wrapped. A card whose only content is an icon cannot be sliced
      without duplicating the icon into eight pieces, so the cards are flat
      billboards on the same ring: `rotateY(base) translateZ(r) rotateY(-(base +
      angle))` keeps every card face-on while its position still follows the
      circle. The ring maths, the rise intro, the drift, the drag, the momentum,
      the snap and the keyboard controls are the original's.

    - No image preloading, no crossfade when the item list changes, no caption
      and no `fadeColor`/`innerShade`. All of that exists for photographs.

    - The reduced-motion query is read on the first client render rather than in
      an effect. Reading it in an effect means the first frame can start the
      entrance before the effect runs, so a reader who asked for no motion gets a
      frame of it anyway.

    - `onIntroDone` is new: the portrait's fade is timed to the moment the last
      card lands, and guessing at that from outside would drift the two apart.

    - Cards are anchors to `/?design=vN` rather than buttons. The click is taken
      over while the carousel is running, so a normal click still switches the
      design in place, but a modified click opens that design in a new tab and a
      reader with no JavaScript gets a working picker instead of five inert
      boxes.
*/

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";

export interface V0CarouselItem {
  id: string;
  /** The card's screen-reader name, e.g. "v4 design, 2026". */
  label: string;
  /** The card's only visible content. */
  icon: ReactNode;
}

interface V0CarouselProps {
  items: V0CarouselItem[];
  /** Apply one design. `anchor` is the card that was pressed, for the reveal. */
  onSelect: (id: string, anchor: HTMLElement | null) => void;
  /** Play the rise. False once this document has already shown it. */
  intro?: boolean;
  /** Fires once, when the last card has landed. */
  onIntroDone?: () => void;
  /** Degrees per second of idle drift. */
  speed?: number;
  className?: string;
}

interface Press {
  id: number;
  x: number;
  y: number;
  angle: number;
  moved: boolean;
  origin: number;
  samples: { time: number; angle: number }[];
}

interface CarouselState {
  angle: number;
  velocity: number;
  target: number | null;
  dir: number;
  press: Press | null;
  drag: boolean;
  hover: boolean;
  pointerInside: boolean;
  pointerX: number;
  pointerY: number;
  yaw: number;
  pitch: number;
  introStart: number | null;
  introDone: boolean;
  holdUntil: number;
  suppressClick: boolean;
  drop: number;
  last: number;
}

const INTRO_MS = 1400;
const RISE_MS = 900;
const RISE_SPREAD = 480;
const SPRING = 118;
const SETTLE_SPEED = 9;
const DRAG_THRESHOLD = 5;
const TO_RAD = Math.PI / 180;

/* Ring shape. `SPREAD` is the gap between cards as a multiple of their width;
   `RING_OPEN` pushes the cards out from the centre once the chord maths has
   placed them. Five cards is the case the constant is tuned for: at 72 degrees
   apart, a ring sized only by the chord leaves the back two cards directly
   behind the front one, so they read as a shadow rather than as two more
   designs. Opening the ring puts their edges clear of it. */
const GAP = 26;
const SPREAD = 1.34;
const RING_OPEN = 1.55;

/*
  Under 700px the ring closes instead of opening. A phone cannot hold the wide
  ring at a readable card size - the fit-to-container scale shrinks a 125px card
  to about 70px, which is below the size an icon needs to be recognisable. A
  tighter ring lets the stage stay near full size; the back two cards sit behind
  the front one, and the drift brings them round.
*/
const RING_TIGHT = 0.8;
const PERSPECTIVE = 1800;
const TILT = -6;
const PARALLAX = 0.3;

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

/** Signed shortest distance from 0, so -350 becomes 10. */
const wrap = (degrees: number) =>
  ((((degrees + 180) % 360) + 360) % 360) - 180;

const easeOutQuint = (t: number) => 1 - Math.pow(1 - t, 5);

/**
 * The media query, read synchronously on the first client render.
 *
 * `matchMedia` does not exist on the server, so this is false there - and it is
 * never rendered, only used to decide whether to animate, which means the two
 * values cannot disagree in the markup.
 */
function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches === true,
  );

  useEffect(() => {
    const query = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    if (!query) return;
    const update = () => setReduced(query.matches);
    query.addEventListener?.("change", update);
    return () => query.removeEventListener?.("change", update);
  }, []);

  return reduced;
}

export function V0Carousel({
  items,
  onSelect,
  intro = true,
  onIntroDone,
  speed = 7,
  className = "",
}: V0CarouselProps) {
  const count = items.length;
  const step = 360 / count;
  const reduced = usePrefersReducedMotion();

  const rootRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const cameraRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLAnchorElement | null)[]>([]);

  const [active, setActive] = useState(0);
  const [dragging, setDragging] = useState(false);

  const stateRef = useRef<CarouselState>({
    angle: 0,
    velocity: 0,
    target: null,
    dir: -1,
    press: null,
    drag: false,
    hover: false,
    pointerInside: false,
    pointerX: 0,
    pointerY: 0,
    yaw: 0,
    pitch: 0,
    introStart: null,
    introDone: false,
    holdUntil: 0,
    suppressClick: false,
    drop: 0,
    last: 0,
  });

  const activeRef = useRef(0);
  const geoRef = useRef({ radius: 260, cardW: 200, cardH: 200 });

  /* The loop wakes on pointer and key input; the handlers are declared below
     the effect, so the effect publishes its `wake` here rather than closing
     over a function that does not exist yet. */
  const wakeRef = useRef<() => void>(() => {});

  const onSelectRef = useRef(onSelect);
  const onIntroDoneRef = useRef(onIntroDone);

  /*
    The loop and the click handler are created once, so they read the current
    callbacks from refs rather than closing over the first render's. Writing
    those refs in an effect rather than during render is what the React
    Compiler's ref rule asks for, and it also re-wakes the loop after every
    render - which is how a parent state change reaches an animation that is
    otherwise sitting idle.
  */
  useEffect(() => {
    onSelectRef.current = onSelect;
    onIntroDoneRef.current = onIntroDone;
    wakeRef.current();
  });

  useLayoutEffect(() => {
    const root = rootRef.current;
    const stage = stageRef.current;
    const camera = cameraRef.current;
    const ring = ringRef.current;
    if (!root || !stage || !camera || !ring) return;

    const st = stateRef.current;
    const geo = geoRef.current;
    let raf = 0;
    let visible = false;

    const nearest = (angle: number) => Math.round(angle / step) * step;

    const measure = () => {
      const rect = root.getBoundingClientRect();
      if (!rect.width || !rect.height) return;

      const card = cardRefs.current[0];
      const cardW = card?.offsetWidth || 200;
      const cardH = card?.offsetHeight || cardW;

      /*
        The radius the original computes: the chord between two adjacent card
        centres, blended toward the arc length so the spacing stays even as the
        count changes. Five cards is the smallest ring this has to hold, and at
        that count the chord is the term that matters - the cards are 72 degrees
        apart, so anything tighter than their own width overlaps.
      */
      const n = Math.max(count, 3);
      const pitch = (cardW + GAP) * SPREAD;
      const chord = pitch / (2 * Math.sin(Math.PI / n));
      const arc = (n * pitch) / (2 * Math.PI);
      const radius = Math.max(
        (chord + (arc - chord) * 0.65) * (rect.width < 700 ? RING_TIGHT : RING_OPEN),
        cardW * 0.6,
      );

      /*
        How much of the ring has to fit. Every card is a billboard, so its
        corners project to a rectangle around its centre: the widest one is the
        card furthest from the front, at `radius * sin` of the largest angle in
        the ring. The perspective shrink is ignored on purpose - it only ever
        makes the result smaller, so the fit is conservative.
      */
      const maxSin = Math.max(
        ...Array.from({ length: n }, (_, i) => Math.abs(Math.sin(i * step * TO_RAD))),
      );
      const spanX = 2 * (radius * maxSin + cardW / 2) * 1.06;
      const spanY = cardH * 1.2 + 28;
      const fit = Math.min(
        1,
        (rect.width * 0.92) / spanX,
        (rect.height * 0.94) / spanY,
      );

      geo.radius = radius;
      geo.cardW = cardW;
      geo.cardH = cardH;

      /* How far below its landing spot a card starts. Enough that it is clear
         of the viewport, not so far that the rise takes a visible pause. */
      st.drop = (rect.height / fit) * 0.6 + cardH;

      stage.style.perspective = `${PERSPECTIVE}px`;
      stage.style.transform = `scale(${fit.toFixed(4)})`;
    };

    const render = (now: number) => {
      const R = geo.radius;
      const elapsed = st.introStart !== null ? now - st.introStart : 0;

      camera.style.transform = `translate3d(0, 0, ${-R}px) rotateX(${
        TILT + st.pitch
      }deg) rotateY(${st.yaw}deg)`;
      ring.style.transform = `rotateY(${st.angle}deg)`;

      const index = ((Math.round(-st.angle / step) % count) + count) % count;
      if (index !== activeRef.current) {
        activeRef.current = index;
        setActive(index);
      }

      for (let i = 0; i < count; i++) {
        const card = cardRefs.current[i];
        if (!card) continue;

        const base = i * step;
        let transform = `rotateY(${base}deg) translateZ(${R}px) rotateY(${-(base + st.angle)}deg)`;

        if (st.introStart !== null) {
          /* Cards nearer the front land first, so the ring assembles from the
             middle out rather than arriving as one slab. */
          const reach = Math.abs(wrap(base + st.angle));
          const delay = (reach / 180) * RISE_SPREAD;
          const progress = easeOutQuint(
            clamp((elapsed - delay) / RISE_MS, 0, 1),
          );
          const lift = (1 - progress) * st.drop;
          if (lift > 0.5) transform += ` translateY(${lift.toFixed(2)}px)`;
        }

        card.style.transform = transform;

        /*
          Depth, not distance: a card at the back of the ring is washed toward
          the page colour rather than faded out.

          `opacity` was the first attempt and it is wrong on a light page. A
          card at 62% opacity over a dark suit turns into a grey translucent
          slab - the suit shows through it - where the same value on the dark
          page reads as a card receding into the dark. Washing toward
          `--background` instead keeps every card opaque: it works out to the
          same thing against a dark ground, and against a light one it produces
          a paler card rather than a dirty one.

          0.6 is the depth of the wash at the very back of the ring. It has to
          be strong enough that the front card reads as the front, and weak
          enough that the two behind it are still recognisable as two more
          versions - which at five cards they are, 144 degrees round.
        */
        const facing = (Math.cos(wrap(base + st.angle) * TO_RAD) + 1) / 2;
        card.style.setProperty("--v0-fade", ((1 - facing) * 0.6).toFixed(3));
      }
    };

    const advance = (dt: number, now: number) => {
      if (!st.introDone) {
        if (!intro || reduced) {
          st.introDone = true;
          onIntroDoneRef.current?.();
        } else {
          if (st.introStart === null) st.introStart = now;
          if (now - st.introStart >= INTRO_MS) {
            st.introStart = null;
            st.introDone = true;
            onIntroDoneRef.current?.();
          }
        }
      }

      const paused = st.hover || st.drag || now < st.holdUntil;
      const cruise =
        !reduced && st.introDone && st.introStart === null && !paused
          ? speed * st.dir
          : 0;

      let busy = st.introStart !== null || st.drag;

      if (st.drag) {
        /* The pointer owns the angle while dragging; the loop only renders. */
        busy = true;
      } else if (st.target !== null) {
        /* Critically damped spring, integrated in small fixed steps so a long
           frame cannot overshoot the target. */
        let remaining = dt;
        const damping = 2 * Math.sqrt(SPRING);
        while (remaining > 0) {
          const h = Math.min(remaining, 1 / 240);
          const accel = SPRING * (st.target - st.angle) - damping * st.velocity;
          st.velocity += accel * h;
          st.angle += st.velocity * h;
          remaining -= h;
        }
        if (
          Math.abs(st.target - st.angle) < 0.004 &&
          Math.abs(st.velocity) < 0.03
        ) {
          st.angle = st.target;
          st.velocity = 0;
          st.target = null;
        }
        busy = true;
      } else {
        /* The drift eases in and out rather than starting and stopping dead. */
        const tau = 0.18 + 1.1;
        st.velocity += (cruise - st.velocity) * (1 - Math.exp(-dt / tau));
        st.angle += st.velocity * dt;
        if (cruise === 0 && st.introDone && Math.abs(st.velocity) < SETTLE_SPEED) {
          st.target = nearest(st.angle);
        }
        busy = busy || cruise !== 0 || Math.abs(st.velocity) > 0.01;
      }

      /* Pointer parallax: a few degrees of camera movement, never on touch and
         never for a reader who asked for less motion. */
      const ease = 1 - Math.exp(-dt / 0.35);
      const aimYaw = !reduced && st.pointerInside ? st.pointerX * PARALLAX * 9 : 0;
      const aimPitch =
        !reduced && st.pointerInside ? -st.pointerY * PARALLAX * 6 : 0;
      st.yaw += (aimYaw - st.yaw) * ease;
      st.pitch += (aimPitch - st.pitch) * ease;
      if (Math.abs(aimYaw - st.yaw) > 0.01 || Math.abs(aimPitch - st.pitch) > 0.01) {
        busy = true;
      }

      return busy;
    };

    const frame = (now: number) => {
      raf = 0;
      const dt = st.last ? Math.min((now - st.last) / 1000, 0.05) : 1 / 60;
      st.last = now;
      const busy = advance(dt, now);
      render(now);
      if (busy && visible && !document.hidden) raf = requestAnimationFrame(frame);
      else st.last = 0;
    };

    const wake = () => {
      if (!raf && visible && !document.hidden) raf = requestAnimationFrame(frame);
    };

    const onVisibility = () => {
      if (document.hidden) {
        cancelAnimationFrame(raf);
        raf = 0;
        st.last = 0;
      } else {
        wake();
      }
    };

    const resize = new ResizeObserver(() => {
      measure();
      render(performance.now());
      wake();
    });
    resize.observe(root);

    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) wake();
      else {
        cancelAnimationFrame(raf);
        raf = 0;
        st.last = 0;
      }
    });
    io.observe(root);

    const onWheel = (event: WheelEvent) => {
      /* There is no page to scroll on v0, so the wheel spins the ring - either
         axis, whichever the reader is actually moving. */
      const delta =
        Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
      if (!delta) return;
      event.preventDefault();
      const perPixel = 180 / (Math.PI * geo.radius);
      st.target = null;
      st.angle -= delta * perPixel;
      st.velocity = -delta * perPixel * 30;
      st.holdUntil = performance.now() + 1600;
      wake();
    };
    root.addEventListener("wheel", onWheel, { passive: false });
    document.addEventListener("visibilitychange", onVisibility);

    wakeRef.current = wake;
    measure();
    render(performance.now());
    /* Written straight onto the element rather than through state: it is one
       attribute, it never changes back, and a re-render to set it would put a
       frame between the first measure and the stage fading in. */
    root.dataset.ready = "";
    wake();

    return () => {
      cancelAnimationFrame(raf);
      resize.disconnect();
      io.disconnect();
      root.removeEventListener("wheel", onWheel);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [count, step, intro, reduced, speed]);

  /* --- pointer -------------------------------------------------------------- */

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    const st = stateRef.current;
    st.suppressClick = false;
    if (event.button !== 0) return;
    st.press = {
      id: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      angle: st.angle,
      moved: false,
      origin: 0,
      samples: [{ time: performance.now(), angle: st.angle }],
    };
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const st = stateRef.current;
    const root = rootRef.current;

    if (event.pointerType === "mouse" && root) {
      const rect = root.getBoundingClientRect();
      st.pointerInside = true;
      st.pointerX = clamp(((event.clientX - rect.left) / rect.width) * 2 - 1, -1, 1);
      st.pointerY = clamp(((event.clientY - rect.top) / rect.height) * 2 - 1, -1, 1);
    }

    const press = st.press;
    if (!press || press.id !== event.pointerId) {
      wakeRef.current();
      return;
    }

    const delta = event.clientX - press.x;

    if (!press.moved) {
      if (Math.abs(delta) < DRAG_THRESHOLD) return;
      /* A mostly vertical swipe on touch is the reader trying to scroll, not to
         spin the ring. Let it go. */
      if (
        event.pointerType !== "mouse" &&
        Math.abs(event.clientY - press.y) > Math.abs(delta) * 1.2
      ) {
        st.press = null;
        return;
      }
      press.moved = true;
      press.origin = delta;
      st.drag = true;
      st.target = null;
      st.velocity = 0;
      setDragging(true);
      try {
        rootRef.current?.setPointerCapture(event.pointerId);
      } catch {
        // Pointer capture is a nicety; a browser that refuses it still drags.
      }
    }

    const perPixel = 180 / (Math.PI * geoRef.current.radius);
    st.angle = press.angle + (delta - press.origin) * perPixel;
    const now = performance.now();
    press.samples.push({ time: now, angle: st.angle });
    while (press.samples.length > 2 && now - press.samples[0].time > 110) {
      press.samples.shift();
    }
    wakeRef.current();
  };

  const releasePointer = (event: ReactPointerEvent<HTMLDivElement>) => {
    const st = stateRef.current;
    const press = st.press;
    if (!press || press.id !== event.pointerId) return;
    st.press = null;
    if (!press.moved) return;

    st.drag = false;
    setDragging(false);
    st.suppressClick = true;

    const first = press.samples[0];
    const last = press.samples[press.samples.length - 1];
    const span = (last.time - first.time) / 1000;
    const velocity =
      span > 0.008 ? clamp((last.angle - first.angle) / span, -1400, 1400) : 0;

    st.velocity = velocity;
    if (Math.abs(velocity) > 60) st.dir = Math.sign(velocity);
    st.target =
      Math.round((st.angle + velocity * 0.55) / step) * step;
    st.holdUntil = performance.now() + 2400;
    wakeRef.current();
  };

  const handlePointerEnter = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== "mouse") return;
    stateRef.current.hover = true;
    wakeRef.current();
  };

  const handlePointerLeave = (event: ReactPointerEvent<HTMLDivElement>) => {
    const st = stateRef.current;
    if (event.pointerType === "mouse") {
      st.hover = false;
      st.pointerInside = false;
    }
    wakeRef.current();
  };

  /* --- click and keys ------------------------------------------------------- */

  const handleClickCapture = (event: ReactMouseEvent<HTMLDivElement>) => {
    const st = stateRef.current;
    if (!st.suppressClick) return;
    /* A drag that ends over a card must not also open it. */
    st.suppressClick = false;
    event.preventDefault();
    event.stopPropagation();
  };

  const handleCardClick = (event: ReactMouseEvent<HTMLAnchorElement>, id: string) => {
    /* Modified clicks are left to the browser: the href is a real address, so
       ctrl/cmd-click opens that design in a new tab. */
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    onSelectRef.current(id, event.currentTarget);
  };

  const stepBy = useCallback(
    (direction: number) => {
      const st = stateRef.current;
      st.target = Math.round(st.angle / step) * step - direction * step;
      st.holdUntil = performance.now() + 2800;
      wakeRef.current();
    },
    [step],
  );

  const handleKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.key === "ArrowRight") stepBy(1);
    else if (event.key === "ArrowLeft") stepBy(-1);
    else return;
    event.preventDefault();
  };

  return (
    <div
      ref={rootRef}
      className={`v0-carousel ${className}`.trim()}
      role="region"
      aria-roledescription="carousel"
      aria-label="Design versions"
      tabIndex={0}
      data-dragging={dragging ? "" : undefined}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={releasePointer}
      onPointerCancel={releasePointer}
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
      onClickCapture={handleClickCapture}
      onKeyDown={handleKeyDown}
    >
      <div ref={stageRef} className="v0-carousel__stage">
        <div ref={cameraRef} className="v0-carousel__camera">
          <div ref={ringRef} className="v0-carousel__ring">
            {items.map((item, index) => (
              <a
                key={item.id}
                ref={(element) => {
                  cardRefs.current[index] = element;
                }}
                className="v0-carousel__card"
                data-version={item.id}
                href={`/?design=${item.id}`}
                aria-label={item.label}
                draggable={false}
                onClick={(event) => handleCardClick(event, item.id)}
              >
                {item.icon}
              </a>
            ))}
          </div>
        </div>
      </div>

      <p className="v0-carousel__live" aria-live="polite" aria-atomic="true">
        {items[active]?.label ?? ""}
      </p>
    </div>
  );
}
