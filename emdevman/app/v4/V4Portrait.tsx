import Image from "next/image";

import portraitHovered from "@/app/assets/images/HOVERED.png";
import portraitDark from "@/app/assets/images/DARK.jpg";
import portraitLight from "@/app/assets/images/LIGHT.jpg";

/**
 * v4's portrait: the same photograph at three expressions.
 *
 * LIGHT.jpg is the resting face, DARK.jpg takes over in dark mode, and
 * HOVERED.png crossfades in over both on hover. All three sit in the DOM from
 * the first paint and only their opacity changes.
 *
 * Why three stacked images rather than a `useTheme()` swap:
 *
 *   - A theme swap in JS needs a `mounted` flag, because the server cannot know
 *     the resolved theme. That flag means the light image renders first and the
 *     dark one replaces it a frame later, which is a visible flash on the one
 *     element the page is built around. The `dark:` variant needs no JavaScript
 *     and no flag: the stylesheet resolves it, and the correct file is painted
 *     on the first frame.
 *   - A hover that mounts an image on demand shows a hole while it decodes, and
 *     the decode is the slow part. HOVERED is in the document at load, so the
 *     hover is a pure opacity change.
 *
 * The two base images are 1024x1024 and the hover is 600x600, but all three are
 * square, so one `aspect-square` frame holds all of them and the swap cannot
 * shift the layout.
 *
 * Deliberately NOT greyscaled. `ProfileCard.tsx` desaturates in light mode, and
 * copying that here would throw away the only thing these three assets have in
 * common - that they are one photograph caught at three expressions. Desaturating
 * them would make the dark and light files differ in luminance but not in
 * character, and the hover would stop reading as a change of expression at all.
 *
 * The hover frame sits on top of the theme pair rather than replacing it, which
 * is what makes hover win in both modes: whichever base is showing, the hover
 * covers it.
 *
 * And because HOVERED.png is a waking face - eyes open, faintly smiling - the
 * sleeping marks only exist in dark mode, where DARK.jpg is the closed-eye frame,
 * and they clear on hover. The same three-asset logic read as a sequence: asleep,
 * awake, and hovering wakes it up.
 */
export function V4Portrait({ alt }: { alt: string }) {
  return (
    <div className="v4-portrait-frame group">
      {/*
        `group` sits on this frame rather than the inner box, for two reasons and
        the second is the point. It makes the whole disc the hit area rather than
        the pixels of the photograph - the visible circle is inset by the white
        ring, so a hover driven by the image alone would start 4px outside the
        face. And it puts the hover state on a box that also contains the sleeping
        marks, so `group-hover` can retire the z's at the same moment the smiling
        face fades in.

        The frame wraps the disc rather than being the disc, because the disc is
        `overflow: hidden` and `border-radius: 9999px`; the z's travel outside the
        circle, so anything inside it would be clipped by the ring.
      */}
      <div className="v4-portrait">
        <div className="relative size-full">
          <Image
            src={portraitLight}
            alt={alt}
            priority
            draggable={false}
            className="absolute inset-0 size-full object-cover dark:hidden"
            style={{ objectPosition: "center 28%" }}
          />

          {/*
            The dark frame is `aria-hidden` and never `alt`-less by accident: it is
            the same person as the light frame, and announcing the portrait twice
            would be noise. `dark:hidden` on the first plus `hidden dark:block` on
            this keeps exactly one of them in the accessibility tree at a time.
          */}
          <Image
            src={portraitDark}
            alt=""
            aria-hidden="true"
            draggable={false}
            className="absolute inset-0 hidden size-full object-cover dark:block"
            style={{ objectPosition: "center 28%" }}
          />

          <Image
            src={portraitHovered}
            alt=""
            aria-hidden="true"
            draggable={false}
            className="absolute inset-0 size-full object-cover opacity-0 transition-opacity duration-300 ease-out motion-reduce:transition-none group-hover:opacity-100"
            style={{ objectPosition: "center 28%" }}
          />
        </div>
      </div>

      {/*
        Decorative, so `aria-hidden` and not a live region - a screen reader
        announcing "asleep" on every page load would be noise about a joke. What it
        describes is already carried by the portrait, which changes expression with
        the theme.
      */}
      <span className="v4-zzz" aria-hidden="true">
        <span>z</span>
        <span>z</span>
        <span>z</span>
      </span>
    </div>
  );
}
