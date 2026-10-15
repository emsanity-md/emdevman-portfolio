import Image from "next/image";
import type { StaticImageData } from "next/image";

import { cn } from "@/app/lib/utils";

/**
 * A 16:10 screenshot slot.
 *
 * The slot exists before the screenshots do. `app/assets/projects/` already has
 * ten ~1900x865 PNGs, but those are 2.2:1 and were cropped for cards that no
 * longer exist, so reusing them here would letterbox or crop them into a shape
 * they were not shot for. Rather than ship the wrong crops, the slot renders as
 * a labelled placeholder until each one is supplied at 16:10.
 *
 * Passing `image` is all it takes to switch: the frame, the radius and the
 * `sizes` are already right, and a statically imported source carries its own
 * intrinsic width and height, so there is no CLS and no explicit dimension.
 */
export function Screenshot({
  title,
  image,
  priority = false,
  className,
}: {
  title: string;
  image?: StaticImageData;
  /** The first card on screen; the rest lazy-load. */
  priority?: boolean;
  className?: string;
}) {
  const frame = cn(
    "relative w-full overflow-hidden rounded-[0.75rem] border border-border bg-muted",
    className,
  );

  if (image) {
    return (
      <div className={cn(frame, "aspect-[16/10]")}>
        <Image
          src={image}
          alt={`Screenshot of ${title}`}
          fill
          priority={priority}
          /* Half the grid column on desktop, the full measure on a phone. Never
             the 3x device-pixel variant of a wide shot: the source is a UI
             screenshot, so the extra width buys nothing but bytes. */
          sizes="(max-width: 767px) 100vw, 50vw"
          className="object-cover"
        />
      </div>
    );
  }

  return (
    <div
      className={cn(frame, "flex aspect-[16/10] items-center justify-center")}
      /* The slot is decorative until a screenshot lands in it, but the title
         still has to be reachable by a screen reader somewhere - the card
         heading right below carries it, so this is the one place on the card
         that can be hidden. */
      aria-hidden="true"
    >
      <div className="px-6 text-center">
        <p className="font-mono text-micro uppercase tracking-[0.18em] text-faint">
          16:10 screenshot
        </p>
        <p className="mt-2 font-display text-subheading text-muted-foreground">{title}</p>
      </div>
    </div>
  );
}