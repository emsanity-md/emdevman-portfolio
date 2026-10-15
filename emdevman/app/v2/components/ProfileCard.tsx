"use client";

import { memo, useEffect, useRef, type CSSProperties } from "react";
import Image from "next/image";
import { Mail } from "lucide-react";

import { cn } from "@/app/lib/utils";

type Palette = "dark" | "light";

interface ProfileCardProps {
  /** The portrait. A cut-out on transparency is what this was built around. */
  avatarUrl?: string;
  /**
   * Describes the photograph.
   *
   * Required, and separate from `name`, because the two answer different
   * questions: this is what a screen reader reads out, and `name` is what the
   * card prints on itself. Deriving one from the other meant that a card
   * rendered without a name overlay - which is how it is used here, since the
   * hero's `h1` already carries the name - shipped with `alt=""`, and an empty
   * alt tells assistive tech the image is decorative. It is not. It is the
   * photograph of the person whose work the rest of the page is about.
   */
  alt: string;
  /** Small round avatar in the footer. Falls back to `avatarUrl`. */
  miniAvatarUrl?: string;
  name?: string;
  title?: string;
  handle?: string;
  /** The footer's right-hand status line, with its dot. */
  status?: string;
  statusColor?: string;
  contactHref?: string;
  contactText?: string;
  /** `none` lets the figure sit on the tile's own gradient. */
  fit?: "cover" | "contain";
  theme?: Palette;
  radius?: number;
  /** Holographic foil strength, 0-1. */
  holo?: number;
  /** Sheen and shade strength, 0-1. */
  glare?: number;
  enableTilt?: boolean;
  tiltStrength?: number;
  /** How far the photo slides against the tilt, in px. */
  parallax?: number;
  /** Plays a tilted settle on load. */
  intro?: boolean;
  className?: string;
}

/*
  The two palettes.

  Every surface on the card is one of four things: a translucent frame, a
  gradient tile, an edge highlight, and ink on top of it. They are variables
  rather than classes because they are read by CSS custom properties inside
  `calc()` in the layer styles below - a class could not carry them.

  The light palette is not the dark one inverted. A frame at 66% dark over a
  light page reads as a dirty smudge rather than as glass, so the light values
  are separately chosen: a near-white frame at 80%, and a highlight at 95%
  instead of 7%, because on a light surface the lit edge is the *only* thing
  that describes the form.
*/
const THEMES: Record<Palette, Record<string, string>> = {
  dark: {
    "--pc-frame": "rgba(38, 35, 46, 0.66)",
    "--pc-frame-edge": "rgba(255, 255, 255, 0.08)",
    "--pc-frame-highlight": "rgba(255, 255, 255, 0.07)",
    "--pc-frame-shadow":
      "0 22px 44px -20px rgba(0, 0, 0, 0.8), 0 6px 16px -8px rgba(0, 0, 0, 0.5)",
    "--pc-tile": "linear-gradient(180deg, #3a3644 0%, #27242f 100%)",
    "--pc-tile-edge": "rgba(255, 255, 255, 0.07)",
    "--pc-tile-highlight": "rgba(255, 255, 255, 0.12)",
    "--pc-tile-shadow": "0 4px 10px -4px rgba(0, 0, 0, 0.7)",
    "--pc-ink": "#f4f4f5",
    "--pc-muted": "rgba(244, 244, 245, 0.6)",
    "--pc-hover": "brightness(1.12)",
    "--pc-press": "brightness(0.8)",
    "--pc-shade": "rgba(0, 0, 0, 0.4)",
  },
  light: {
    "--pc-frame": "rgba(240, 240, 243, 0.8)",
    "--pc-frame-edge": "rgba(24, 24, 27, 0.07)",
    "--pc-frame-highlight": "rgba(255, 255, 255, 0.95)",
    "--pc-frame-shadow":
      "0 22px 44px -22px rgba(24, 24, 27, 0.3), 0 6px 16px -10px rgba(24, 24, 27, 0.16)",
    "--pc-tile": "linear-gradient(180deg, #ffffff 0%, #f6f6f8 100%)",
    "--pc-tile-edge": "rgba(24, 24, 27, 0.08)",
    "--pc-tile-highlight": "rgba(255, 255, 255, 1)",
    "--pc-tile-shadow": "0 4px 10px -5px rgba(24, 24, 27, 0.25)",
    "--pc-ink": "#27272a",
    "--pc-muted": "rgba(39, 39, 42, 0.6)",
    "--pc-hover": "brightness(0.97)",
    "--pc-press": "brightness(0.92)",
    "--pc-shade": "rgba(24, 24, 27, 0.14)",
  },
};

/*
  How the foil blends.

  `color-dodge` in dark and `multiply` in light, which are opposites: dodge
  brightens what is under it, multiply darkens. A single blend mode cannot serve
  both - dodge on a light tile blows out to white the moment the pointer
  arrives, and multiply on a dark tile does nothing at all.

  The light `--pc-holo-filter` inverts and rotates the hue, which is what keeps
  the spectrum visible on a near-white tile instead of washing out.
*/
const FOILS: Record<Palette, Record<string, string>> = {
  dark: {
    "--pc-blend": "color-dodge",
    "--pc-holo-filter": "hue-rotate(0deg)",
    "--pc-sheen": "rgba(255, 255, 255, 0.16)",
  },
  light: {
    "--pc-blend": "multiply",
    "--pc-holo-filter": "invert(1) hue-rotate(180deg)",
    "--pc-sheen": "rgba(255, 255, 255, 0)",
  },
};

/*
  Film grain, as an inline SVG rather than an asset.

  `feTurbulence` with `stitchTiles` generates one tile of noise that repeats
  seamlessly; the `feColorMatrix` remaps it to a narrow band around mid-grey and
  clamps alpha, so what comes out is grain rather than the full 0-1 noise field.
  Inlining it costs one data URI in the document and no request at all, and it is
  the difference between the foil looking printed and looking like a gradient.

  The whole thing is `encodeURIComponent`'d because the SVG contains quotes and
  angle brackets that cannot survive inside a CSS `url()` unescaped.
*/
const GRAIN = `url("data:image/svg+xml,${encodeURIComponent(
  "<svg xmlns='http://www.w3.org/2000/svg' width='500' height='500'><filter id='g' x='0' y='0' width='100%' height='100%' color-interpolation-filters='sRGB'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0.55 0 0 0 -0.24 0.55 0 0 0 -0.24 0.55 0 0 0 -0.24 0 0 0 0 1'/></filter><rect width='100%' height='100%' filter='url(#g)'/></svg>",
)}")`;

/*
  The spectrum is a repeating hue ramp - five bands at 5% intervals, cycling back
  to the start, so the gradient tiles with no seam at either end.

  The bars are the "security print" layer: a hard-stop stripe pattern at -45deg
  in a fixed width (0.7%), which is what gives the foil its direction when the
  card tilts. Without it the spectrum alone reads as a blur rather than as a
  surface with a grain of its own.

  The falloff is a radial darkening centred on the pointer, which is what makes
  the foil *move* rather than merely exist - the light source travels with the
  cursor.
*/
const SPECTRUM =
  "repeating-linear-gradient(0deg, hsl(2, 100%, 73%) 5%, hsl(53, 100%, 69%) 10%, hsl(93, 100%, 69%) 15%, hsl(176, 100%, 76%) 20%, hsl(228, 100%, 74%) 25%, hsl(260, 100%, 76%) 30%, hsl(2, 100%, 73%) 35%)";
const BARS =
  "repeating-linear-gradient(-45deg, #0e152e 0%, hsl(180, 10%, 60%) 3.8%, hsl(180, 29%, 66%) 4.5%, hsl(180, 10%, 60%) 5.2%, #0e152e 10%, #0e152e 12%)";
const FALLOFF =
  "radial-gradient(farthest-corner circle at var(--pc-pointer-x) var(--pc-pointer-y), hsla(0, 0%, 0%, 0.1) 12%, hsla(0, 0%, 0%, 0.15) 20%, hsla(0, 0%, 0%, 0.25) 120%)";

/*
  The mask position runs at 1.5x the card's own shift, so the pattern travels
  further and faster than the surface under it. That difference in rate is the
  whole illusion - a foil that moved exactly with its card would look like a
  printed gradient, and one that moved independently would look like a sticker.
*/
const PATTERN_POSITION = "calc(50% - var(--pc-shift-x) * 1.5) calc(65% - var(--pc-shift-y) * 1.5)";

/*
  Every value the effect reads, declared up front.

  They have to exist before the first frame rather than being written as the
  pointer moves, because each of the layer styles below interpolates against them
  inside `calc()`. A custom property that is unset mid-animation makes the whole
  declaration invalid at that moment, and the layer blinks rather than fades.
*/
const ROOT_VARS = {
  "--pc-light-x": "50%",
  "--pc-light-y": "50%",
  "--pc-pointer-x": "50%",
  "--pc-pointer-y": "50%",
  "--pc-band-x": "50%",
  "--pc-band-y": "50%",
  "--pc-reach": 0,
  "--pc-rotate-x": "0deg",
  "--pc-rotate-y": "0deg",
  "--pc-shift-x": "0px",
  "--pc-shift-y": "0px",
  "--pc-tilt": 0,
  "--pc-active": 0,
};

const SHEEN_STYLE: CSSProperties = {
  background:
    "radial-gradient(farthest-corner circle at calc(var(--pc-light-x) - 10px) calc(var(--pc-light-y) - 10px), var(--pc-sheen) 0%, transparent 55%)",
  opacity: "calc(var(--pc-holo) * var(--pc-active))",
};

/*
  The foil itself: spectrum and bars stacked, blended together, then masked.

  The mask is `--pc-pattern`, which with no `iconUrl` is an opaque black-to-black
  gradient - so the mask passes everything and the foil covers the whole tile.
  `brightness` and `contrast` below are what make it read as a foil rather than
  as a rainbow: contrast is pushed hard and saturation is pulled well down, and
  both rise with `--pc-active` so the effect only intensifies under the pointer.
*/
const HOLO_STYLE: CSSProperties = {
  backgroundImage: `${SPECTRUM}, ${BARS}, ${FALLOFF}`,
  backgroundPosition: "0 var(--pc-band-y), var(--pc-band-x) var(--pc-band-y), center",
  backgroundSize: "500% 500%, 300% 300%, 200% 200%",
  backgroundBlendMode: "color, hard-light",
  filter:
    "brightness(calc(0.66 + 0.19 * var(--pc-active))) contrast(calc(1.33 + 0.17 * var(--pc-active))) saturate(calc(0.33 + 0.17 * var(--pc-active))) var(--pc-holo-filter)",
  opacity: "calc(var(--pc-holo) * var(--pc-holo-gain) * (0.5 + 0.5 * var(--pc-active)))",
  WebkitMaskImage: "var(--pc-pattern)",
  WebkitMaskSize: "var(--pc-pattern-size)",
  WebkitMaskPosition: PATTERN_POSITION,
  WebkitMaskRepeat: "repeat",
  maskImage: "var(--pc-pattern)",
  maskSize: "var(--pc-pattern-size)",
  maskPosition: PATTERN_POSITION,
  maskRepeat: "repeat",
};

/*
  A second, brighter pass over the same tile, on a `luminosity` blend.

  This is the part that produces the hard specular bloom where the light source
  actually is. The first foil layer is the broad rainbow; this one is the glint.
  `--pc-reach` is the tilt magnitude rather than the pointer position, so the
  bloom appears wherever the card is turned rather than wherever it is pointed.
*/
const GLOW_STYLE: CSSProperties = {
  backgroundImage:
    "linear-gradient(45deg, hsl(176, 100%, 76%), hsl(228, 100%, 74%), hsl(260, 100%, 76%), hsl(2, 100%, 73%), hsl(53, 100%, 69%), hsl(93, 100%, 69%)), radial-gradient(circle at var(--pc-pointer-x) var(--pc-pointer-y), hsl(0, 0%, 70%) 0%, hsla(0, 0%, 30%, 0.2) 90%), var(--pc-grain)",
  backgroundSize: "250% 250%, 100% 100%, 220px 220px",
  backgroundPosition: "var(--pc-pointer-x) var(--pc-pointer-y), center, 0 0",
  backgroundBlendMode: "color-dodge",
  filter:
    "brightness(calc(2 - var(--pc-reach))) contrast(calc(var(--pc-reach) + 2)) saturate(calc(0.5 + var(--pc-reach)))",
  mixBlendMode: "luminosity",
  opacity: "calc(var(--pc-active) * var(--pc-holo-detail))",
};

/*
  The same gradients again, offset and inverted.

  `difference` against what is already there is what creates the interference -
  where this layer and the one beneath it agree, they cancel to black; where
  they differ, you get the full spectrum. It is the cheapest way to get real
  foil behaviour out of two static gradients.
*/
const SHIFT_STYLE: CSSProperties = {
  backgroundImage: `${SPECTRUM}, ${BARS}, ${FALLOFF}`,
  backgroundPosition: "0 var(--pc-band-y), calc(var(--pc-band-x) * 0.4) calc(var(--pc-band-y) * 0.5), center",
  backgroundSize: "200% 300%, 700% 700%, 100% 100%",
  backgroundBlendMode: "color, hard-light",
  mixBlendMode: "difference",
  filter: "brightness(0.8) contrast(1.5)",
  opacity: "calc(var(--pc-active) * var(--pc-holo-detail))",
};

/*
  The photo, inset and oversized by `--pc-parallax`.

  The negative inset plus the matching width/height increase is what leaves the
  slide never to expose an edge: the image is always larger than the frame by
  exactly twice the parallax distance, so the worst case at full deflection
  still has `--parallax` px of cover on every side.
*/
const PHOTO_STYLE: CSSProperties = {
  inset: "calc(var(--pc-parallax) * -1)",
  width: "calc(100% + var(--pc-parallax) * 2)",
  height: "calc(100% + var(--pc-parallax) * 2)",
  transform: "translate3d(var(--pc-shift-x), var(--pc-shift-y), 0)",
};

/* The photo itself carries no positioning - its wrapper owns all of it. */

/*
  The scrim under the text, over the photo.

  Six stops in the first 20% and then a long tail to transparent at 52%. That
  shape matters: a linear ramp to transparent leaves a visible edge, and the
  multi-stop version fades out over nothing - the eye reads it as the image
  getting darker, not as a panel with a top.
*/
const SCRIM_STYLE: CSSProperties = {
  background:
    "linear-gradient(to top, rgba(0, 0, 0, 0.6) 0%, rgba(0, 0, 0, 0.57) 6%, rgba(0, 0, 0, 0.5) 12%, rgba(0, 0, 0, 0.4) 19%, rgba(0, 0, 0, 0.28) 26%, rgba(0, 0, 0, 0.16) 33%, rgba(0, 0, 0, 0.07) 40%, rgba(0, 0, 0, 0.02) 46%, rgba(0, 0, 0, 0) 52%)",
};

const GLARE_STYLE: CSSProperties = {
  background:
    "radial-gradient(farthest-corner circle at var(--pc-light-x) var(--pc-light-y), rgba(255, 255, 255, 0.8) 0%, rgba(255, 255, 255, 0.36) 20%, rgba(255, 255, 255, 0) 60%)",
  opacity: "calc(var(--pc-glare) * var(--pc-active))",
};

/*
  The shade, and the only layer that scales with tilt rather than with the
  pointer: it is at 30% transparent in the middle and `--pc-shade` at the
  corners, so turning the card drags the corners further into shadow than the
  centre. Gated on `--pc-tilt` (magnitude x light) rather than `--pc-active`, so
  it survives after the pointer leaves and the surface has eased back.
*/
const SHADE_STYLE: CSSProperties = {
  background:
    "radial-gradient(farthest-corner circle at var(--pc-light-x) var(--pc-light-y), transparent 30%, var(--pc-shade) 100%)",
  opacity: "calc(var(--pc-glare) * var(--pc-tilt))",
};

const ROOT =
  "relative w-[340px] max-w-full touch-pan-y [perspective:1000px] [-webkit-tap-highlight-color:transparent]";

/*
  The frame: a 20px blur with a 1.6 saturation boost behind it.

  `backdrop-saturate` is the part that reads as glass rather than as a
  translucent rectangle. Blur alone diffuses the light behind it; saturating
  first and blurring second is what makes the result look like something with a
  surface, because it is doing to the backdrop what a real pane of glass does.
*/
const BODY =
  "relative flex flex-col gap-[10px] rounded-[calc(var(--pc-radius)+10px)] p-[10px] backdrop-blur-[20px] backdrop-saturate-[1.6] will-change-transform [background:var(--pc-frame)] [box-shadow:var(--pc-frame-shadow)] [transform:rotateX(var(--pc-rotate-x))_rotateY(var(--pc-rotate-y))]";

const TILE =
  "relative isolate aspect-[4/5] overflow-hidden rounded-[var(--pc-radius)] [background:var(--pc-backdrop)] [box-shadow:var(--pc-tile-shadow)]";
const LAYER = "pointer-events-none absolute inset-0 rounded-[inherit]";
const HOLO = `${LAYER} [mix-blend-mode:var(--pc-blend)]`;
const HOLO_LAYER = "absolute inset-0";
const INFO = "absolute bottom-[18px] left-5 right-5 text-white";
const NAME = "m-0 text-[20px] font-semibold leading-[1.25] tracking-[-0.01em] text-[inherit]";
const TITLE = "mx-0 mb-0 mt-1 text-[14px] leading-[1.45] text-white/78";

/*
  The rim: a hairline inset, plus a brighter one-pixel line at the top.

  Two shadows rather than one border, because the top highlight is the only
  thing describing the top edge of a translucent surface. A uniform hairline
  makes a 20px-blurred panel look like a rectangle; a hairline with one lit side
  makes it look thick.
*/
const TILE_RIM = `${LAYER} [box-shadow:inset_0_0_0_1px_var(--pc-tile-edge),inset_0_1px_0_var(--pc-tile-highlight)]`;
const RIM = `${LAYER} [box-shadow:inset_0_0_0_1px_var(--pc-frame-edge),inset_0_1px_0_var(--pc-frame-highlight)]`;
const FOOTER = "flex min-w-0 items-center gap-3 px-5 pb-2 pt-1.5";
const AVATAR =
  "relative h-9 w-9 flex-none overflow-hidden rounded-full [background:var(--pc-tile)] after:absolute after:inset-0 after:rounded-[inherit] after:content-[''] after:[box-shadow:inset_0_0_0_1px_var(--pc-tile-edge)]";
const META = "flex min-w-0 flex-1 flex-col gap-[3px]";
const HANDLE =
  "overflow-hidden text-ellipsis whitespace-nowrap text-[14px] font-semibold leading-[1.25] text-[var(--pc-ink)]";

/*
  The status line and its dot.

  The dot is a `::before` rather than an element so the whole thing stays one
  text node - it is read out as "Mainly clear 30 degrees" rather than with a
  stray empty element in the middle of it.
*/
const STATUS =
  "flex items-center gap-1.5 whitespace-nowrap text-[12.5px] leading-[1.25] text-[var(--pc-muted)] before:h-1.5 before:w-1.5 before:flex-none before:rounded-full before:bg-[var(--pc-status)] before:content-['']";

const CONTACT =
  "flex h-9 flex-none items-center gap-1.5 rounded-[calc(var(--pc-radius)*0.75)] border-none px-3.5 font-[inherit] text-[13px] font-semibold text-[var(--pc-ink)] [background:var(--pc-tile)] [box-shadow:inset_0_0_0_1px_var(--pc-tile-edge),inset_0_1px_0_var(--pc-tile-highlight),var(--pc-tile-shadow)] transition-[filter,transform] duration-200 hover:[filter:var(--pc-hover)] active:scale-[0.96] active:duration-0 active:[filter:var(--pc-press)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--pc-ink)]";

const GLARE = `${LAYER} mix-blend-overlay`;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

function ProfileCard({
  avatarUrl = "/assets/images/profile3-4k.webp",
  alt,
  miniAvatarUrl,
  name,
  title,
  handle,
  status,
  statusColor = "#22c55e",
  contactHref,
  contactText = "Contact",
  fit = "contain",
  theme = "dark",
  radius = 16,
  holo = 0.8,
  glare = 0.5,
  enableTilt = true,
  tiltStrength = 12,
  parallax = 8,
  intro = true,
  className,
}: ProfileCardProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const settingsRef = useRef({ enableTilt, tiltStrength, parallax, intro });

  /*
    The `write` function from the effect below, so a prop change can repaint
    without rebuilding the listeners.

    Declared as an effect rather than assigned during render: writing a ref
    during render is what the latest-ref pattern used to do, and it is exactly
    the thing React cannot reason about - two renders in one commit would leave
    the ref holding whichever value lost the race. An effect runs at a defined
    point instead.
  */
  const writeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    settingsRef.current = { enableTilt, tiltStrength, parallax, intro };
    writeRef.current?.();
  }, [enableTilt, tiltStrength, parallax, intro]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    /*
      Reduced motion is read live, on every frame, rather than once at mount.

      This is the one deliberate departure from the component this was taken
      from, which reads it a single time into a `const` and therefore needs a
      page reload to notice the reader changing their mind. It matters here
      because the card is the only moving thing on the page: a reader who turns
      reduced motion on mid-visit should get a still card immediately, and the
      check costs one cached media-query read per frame.

      It is checked here and not left to CSS because none of this is reachable
      from a stylesheet - the tilt is a spring integration writing inline custom
      properties, and `--pc-rotate-x` is read inside a `calc()`. A media query
      that zeroed those would stop the rotation but not the parallax, the foil
      bands, or the spring still integrating toward a target it can no longer
      reach.
    */
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const canHover = window.matchMedia("(hover: hover) and (pointer: fine)");

    const size = { width: root.offsetWidth, height: root.offsetHeight };
    const x = { p: 0, v: 0, target: 0 };
    const y = { p: 0, v: 0, target: 0 };
    const light = { p: 0, target: 0 };
    let raf = 0;
    let last = 0;
    let slowUntil = 0;
    let touchId: number | null = null;

    const write = () => {
      const { enableTilt: tiltOn, tiltStrength: strength, parallax: depth } = settingsRef.current;
      const reduced = prefersReducedMotion.matches;
      /*
        No hover capability means no pointer to track - a phone has a finger, and
        a finger on the card is a scroll gesture rather than an invitation to
        tilt it. Touch is handled separately below and only while held.
      */
      const angle = tiltOn && !reduced && canHover.matches ? strength : 0;
      const tilt = Math.min(1, Math.hypot(x.p, y.p));
      const style = root.style;

      style.setProperty("--pc-light-x", `${((x.p + 1) * 0.5 * size.width).toFixed(1)}px`);
      style.setProperty("--pc-light-y", `${((y.p + 1) * 0.5 * size.height).toFixed(1)}px`);
      style.setProperty("--pc-pointer-x", `${((x.p + 1) * 50).toFixed(2)}%`);
      style.setProperty("--pc-pointer-y", `${((y.p + 1) * 50).toFixed(2)}%`);
      /* The foil bands trail the pointer by 15% rather than tracking it. */
      style.setProperty("--pc-band-x", `${(50 + x.p * 15).toFixed(2)}%`);
      style.setProperty("--pc-band-y", `${(50 + y.p * 15).toFixed(2)}%`);
      style.setProperty("--pc-rotate-x", `${(y.p * angle).toFixed(3)}deg`);
      style.setProperty("--pc-rotate-y", `${(-x.p * angle).toFixed(3)}deg`);
      /* Parallax is suppressed under reduced motion even when the tilt is not. */
      style.setProperty("--pc-shift-x", `${(x.p * (reduced ? 0 : depth)).toFixed(2)}px`);
      style.setProperty("--pc-shift-y", `${(y.p * (reduced ? 0 : depth)).toFixed(2)}px`);
      style.setProperty("--pc-reach", tilt.toFixed(4));
      style.setProperty("--pc-tilt", (tilt * light.p).toFixed(4));
      style.setProperty("--pc-active", light.p.toFixed(4));
    };

    const frame = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000 || 0);
      last = now;

      /*
        Two stiffness/damping pairs, and the switch between them is the intro.

        `slow` is a heavily under-damped spring - stiffness 24 against damping 9
        means it overshoots and rings. That is what makes the card feel thrown
        onto the page and settling rather than placed there. After `slowUntil`
        it snaps to the tight pair (120 / 16, critically damped) so the card is
        crisp under the pointer instead of wobbling at it.
      */
      const slow = now < slowUntil;
      const stiffness = slow ? 24 : 120;
      const damping = slow ? 9 : 16;

      /*
        Fixed sub-steps of 1/120s.

        The spring is integrated with an explicit Euler step, which is only
        stable while the step is small relative to the spring's own period. A
        single `dt` from a 60Hz frame is 16.7ms and a 120Hz one is 8.3ms, and the
        same constant step size would therefore make the card behave differently
        on different displays - and go unstable outright on a 240Hz one. So the
        frame is divided into a whole number of fixed sub-steps and each is
        taken separately.
      */
      const steps = Math.max(1, Math.ceil(dt / (1 / 120)));
      const h = dt / steps;

      for (let i = 0; i < steps; i++) {
        for (const axis of [x, y]) {
          axis.v += (stiffness * (axis.target - axis.p) - damping * axis.v) * h;
          axis.p += axis.v * h;
        }
      }

      /*
        The light fades in fast and out slowly - 0.18s in, 0.45s out normally
        and 0.9s out after the intro. An effect that switched off as fast as it
        switched on reads as a flicker when the pointer leaves; the asymmetry is
        what makes it feel like a light source rather than a toggle.
      */
      const tau = light.target > light.p ? 0.18 : slow ? 0.9 : 0.45;
      light.p += (light.target - light.p) * (1 - Math.exp(-dt / tau));
      write();

      /*
        Sleep when nothing is moving.

        The thresholds are per-quantity rather than a single epsilon: position
        alone would stop while velocity was still high enough to overshoot on the
        next frame, and the card would visibly creep after it had gone idle.
      */
      const moving =
        Math.abs(x.target - x.p) > 0.0005 ||
        Math.abs(y.target - y.p) > 0.0005 ||
        Math.abs(x.v) > 0.0005 ||
        Math.abs(y.v) > 0.0005 ||
        Math.abs(light.target - light.p) > 0.002;

      if (moving) {
        raf = requestAnimationFrame(frame);
      } else {
        /* Snap to the target so the card parks exactly, not asymptotically. */
        x.p = x.target;
        y.p = y.target;
        light.p = light.target;
        write();
        raf = 0;
      }
    };

    const wake = () => {
      if (raf) return;
      last = performance.now();
      raf = requestAnimationFrame(frame);
    };

    const aim = (nx: number, ny: number, on = true) => {
      x.target = clamp(nx, -1, 1);
      y.target = clamp(ny, -1, 1);
      light.target = on ? 1 : 0;
      slowUntil = 0;
      wake();
    };

    const aimAt = (event: PointerEvent) => {
      const rect = root.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      aim(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        ((event.clientY - rect.top) / rect.height) * 2 - 1,
      );
    };

    const release = () => aim(0, 0, false);

    /*
      Mouse moves tilt the card; touch does not, until it is pressed.

      A finger dragging across the card is almost always scrolling the page, and
      a card that tilted under a scrolling thumb would fight the gesture. Held
      still, it tilts - which is what `pointerdown` below is for.
    */
    const onEnter = (event: PointerEvent) => {
      if (event.pointerType === "mouse") aimAt(event);
    };
    const onMove = (event: PointerEvent) => {
      if (event.pointerType === "mouse" || event.pointerId === touchId) aimAt(event);
    };
    const onLeave = (event: PointerEvent) => {
      if (event.pointerType === "mouse") release();
    };
    const onDown = (event: PointerEvent) => {
      if (event.pointerType === "mouse") return;
      touchId = event.pointerId;
      aimAt(event);
    };
    const onUp = (event: PointerEvent) => {
      if (event.pointerId !== touchId) return;
      touchId = null;
      release();
    };

    root.addEventListener("pointerenter", onEnter);
    root.addEventListener("pointermove", onMove);
    root.addEventListener("pointerleave", onLeave);
    root.addEventListener("pointerdown", onDown);
    root.addEventListener("pointerup", onUp);
    root.addEventListener("pointercancel", onUp);

    /*
      The light position is in pixels, so it has to be recomputed when the card
      is resized - otherwise a card that started 340px wide and is now 280px has
      its light source pointing outside itself.
    */
    const observer = new ResizeObserver(() => {
      size.width = root.offsetWidth;
      size.height = root.offsetHeight;
      write();
    });
    observer.observe(root);

    writeRef.current = write;

    if (settingsRef.current.intro && !prefersReducedMotion.matches) {
      /*
        Thrown on from the upper right at 1.4s of ring.

        Starting parked and easing in would read as a load animation; starting
        displaced and ringing down reads as an object that arrived. The starting
        position is not centre - an object settles *from* somewhere.
      */
      x.p = 0.62;
      y.p = -0.55;
      light.p = 1;
      slowUntil = performance.now() + 1400;
      write();
      wake();
    } else {
      write();
    }

    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
      root.removeEventListener("pointerenter", onEnter);
      root.removeEventListener("pointermove", onMove);
      root.removeEventListener("pointerleave", onLeave);
      root.removeEventListener("pointerdown", onDown);
      root.removeEventListener("pointerup", onUp);
      root.removeEventListener("pointercancel", onUp);
      writeRef.current = null;
    };
  }, []);

  const miniAvatar = miniAvatarUrl ?? avatarUrl;

  return (
    <div
      ref={rootRef}
      className={cn(ROOT, className)}
      style={
        {
          ...ROOT_VARS,
          ...THEMES[theme],
          ...FOILS[theme],
          "--pc-radius": `${Math.max(0, radius)}px`,
          "--pc-backdrop": "var(--pc-tile)",
          "--pc-holo": clamp(holo, 0, 1),
          "--pc-glare": clamp(glare, 0, 1),
          "--pc-parallax": `${Math.max(0, parallax)}px`,
          "--pc-status": statusColor,
          "--pc-grain": GRAIN,
          /*
            An opaque mask, so the foil covers the whole tile.

            The pattern slot exists to take an icon that the foil is cut into -
            a logo shape rather than a rectangle - and with none supplied an
            opaque black-to-black gradient passes everything.

            `--pc-holo-detail` is on in dark, which is a deliberate departure.
            The component this came from gates it on having an icon at all, and
            with no icon on the page it sat at 0, switching off the GLOW and
            SHIFT layers. Those two are not decoration - the `luminosity` and
            `difference` blends between them and the base layer are what make
            the surface interfere with itself, and what turns a soft rainbow wash
            into a foil that has a highlight in it. Losing them because no logo
            was supplied is an incidental reason for a visible downgrade, so the
            condition here is the palette rather than the icon: light keeps the
            original's 0, because `multiply` over a near-white tile with two
            more multiply layers on top goes muddy rather than prismatic.
          */
          "--pc-pattern": "linear-gradient(#000, #000)",
          "--pc-pattern-size": "100% 100%",
          "--pc-holo-gain": 0.75,
          "--pc-holo-detail": theme === "dark" ? 1 : 0,
        } as CSSProperties
      }
    >
      <div className={BODY}>
        <div className={TILE}>
          {/* Order is the effect. Sheen, then foil, then photo, then text. */}
          <span className={LAYER} style={SHEEN_STYLE} />
          <span className={HOLO} style={HOLO_STYLE}>
            <span className={HOLO_LAYER} style={GLOW_STYLE} />
            <span className={HOLO_LAYER} style={SHIFT_STYLE} />
          </span>

          {avatarUrl ? (
            /*
              The parallax wrapper is a div rather than the image itself.

              `next/image` with `fill` writes its own inline `position`,
              `inset`, `height` and `width`, and it merges them with any `style`
              prop - so putting the overspill on the `<Image>` makes the result
              depend on which of the two wins. A wrapper owns the geometry and
              the image just fills it, which is the same output with no
              precedence question attached.
            */
            <div style={PHOTO_STYLE} className="pointer-events-none absolute">
              <Image
                src={avatarUrl}
                alt={alt}
                fill
                /*
                  This is the page's LCP element - it is the largest thing in the
                  first screenful, and a 340px-wide portrait of a person
                  outmeasures a line of text as a paint candidate.

                  `loading="eager"` plus `fetchPriority="high"` rather than
                  `priority`. `priority` is deprecated in Next 16, and in this
                  version it emits a preload link but *not* `loading="eager"` on
                  the element - so the image was being discovered in <head> and
                  then entering the preload queue at default priority alongside
                  the CSS and the JavaScript, which is the opposite of what a
                  LCP image wants.

                  A `<link rel="preload">` still appears in <head> for this
                  image, and it is not something asked for: Next 16 emits one
                  automatically for anything that is `eager` with a high fetch
                  priority, which is what `priority` used to mean. So the swap
                  below is not preload-for-nothing - it is the same preload,
                  arrived at through a prop that also puts `loading="eager"` on
                  the element, where `priority` alone did not.
                */
                loading="eager"
                fetchPriority="high"
                /* The tile is 320px wide plus 2x the parallax overspill. */
                sizes="340px"
                className={cn(
                  "object-bottom",
                  fit === "cover" ? "object-cover" : "object-contain",
                )}
                draggable={false}
              />
            </div>
          ) : null}

          {/*
            Name and title over the photo are opt-in and off here.

            The hero's own `h1` says "Emmanuel S. Bitancor" about 400px to the
            left, and this card sits inside a section whose whole job is that
            sentence. The props are kept because the card is reusable and the
            overlay is the right treatment for it elsewhere - but on this page
            it would be the same words twice within one screenful.
          */}
          {name || title ? (
            <>
              <span className={LAYER} style={SCRIM_STYLE} />
              <div className={INFO}>
                {name ? <h3 className={NAME}>{name}</h3> : null}
                {title ? <p className={TITLE}>{title}</p> : null}
              </div>
            </>
          ) : null}

          <span className={TILE_RIM} />
        </div>

        <div className={FOOTER}>
          {miniAvatar ? (
            <span className={AVATAR}>
              <Image
                src={miniAvatar}
                alt=""
                fill
                sizes="36px"
                className="object-cover object-top"
                draggable={false}
              />
            </span>
          ) : null}

          <div className={META}>
            {handle ? <span className={HANDLE}>@{handle}</span> : null}
            {status ? <span className={STATUS}>{status}</span> : null}
          </div>

          {contactHref ? (
            <a
              href={contactHref}
              className={CONTACT}
              aria-label={name ? `${contactText} ${name}` : contactText}
            >
              <Mail className="size-4" strokeWidth={1.8} aria-hidden="true" />
              {contactText}
            </a>
          ) : null}
        </div>

        {/* Gloss last, over everything including the text. */}
        <span className={GLARE} style={GLARE_STYLE} />
        <span className={LAYER} style={SHADE_STYLE} />
        <span className={RIM} />
      </div>
    </div>
  );
}

export default memo(ProfileCard);