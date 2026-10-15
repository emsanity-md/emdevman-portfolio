import Image from "next/image";
import type { StaticImageData } from "next/image";

import { cn } from "@/app/lib/utils";

/**
 * A 16:10 frame holding a project screenshot.
 *
 * `object-contain`, not `object-cover`, and that is the whole reason this file
 * exists rather than being three lines inside `ProjectCard`.
 *
 * The images in `app/assets/projects/` are not 16:10. Three of them - CTECH,
 * QuizWiz and HelpDeskIT - are 1895x865 and 1660x766 landing-page heroes, about
 * 2.2:1, and Cuisina AI is a 2000x1414 tri-fold brochure scan. Covering a 16:10
 * frame with any of them crops roughly a quarter of the picture: on the wide
 * heroes it takes the left edge of the headline and the primary button, and on
 * the brochure it cuts the top and bottom off all three panels at once. A
 * screenshot whose headline has been cropped away is not showing the work.
 *
 * Containing them instead costs a letterbox - about 13% top and bottom on the
 * wide ones, and about 6% left and right on the brochure - and buys back the
 * whole image. The frame is `--muted` rather than `--card` so the band reads as
 * a canvas the shot is sitting on, not as a gap in the card.
 *
 * If a tighter frame is wanted, `aspect-[16/10]` is the only line to change:
 * `aspect-[22/10]` matches three of the four sources exactly and leaves the
 * brochure with small side bands.
 *
 * `placeholder="blur"` is free here rather than a nicety. A statically imported
 * source carries its own base64 placeholder, and these are 90KB-1.6MB PNGs -
 * without it every card is an empty grey box until the image lands.
 */
export function Screenshot({
  title,
  image,
  className,
}: {
  title: string;
  image: StaticImageData;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative aspect-[16/10] w-full overflow-hidden rounded-[0.75rem] border border-border bg-muted",
        className,
      )}
    >
      <Image
        src={image}
        /* "project preview" rather than "screenshot", because one of these is
           not a screenshot - the Cuisina AI asset is a scan of the printed
           tri-fold - and because the modal, the case study and the deck card
           have always used this wording for the same images. */
        alt={`${title} project preview`}
        fill
        placeholder="blur"
        /*
          Lazy, and that is the whole reason this frame carries no eager flag.

          It used to take a `priority` prop and the first card was marked as
          LCP. It is not: the hero occupies the entire first screenful at every
          viewport, so this is at least one full scroll down. Eager-loading four
          ~1MB screenshots behind a fold the reader has not reached is four
          wasted decodes competing with the fonts and the stylesheet - and in
          Next 16 an eager image also earns a preload link, so the mistake would
          have been paid twice.
        */
        /* Half the grid column on desktop, the full measure on a phone. Not the
           3x variant of a wide shot: these are already ~1900px sources, so the
           extra width buys nothing but bytes. */
        sizes="(max-width: 767px) 100vw, 50vw"
        className="object-contain"
      />
    </div>
  );
}