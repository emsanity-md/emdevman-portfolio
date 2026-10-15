import Image from "next/image";
import { ArrowRight, Download } from "lucide-react";

import portrait from "@/app/assets/images/PROFILE-IMAGE-NO-BG.png";
import { LocalClock } from "./components/LocalClock";

/**
 * The résumé PDF, in `public/` so it is served as a static file rather than
 * bundled through the image optimiser - which is the right call for a document
 * that has to be byte-identical.
 *
 * Local to this component because it has one caller. It reads like something
 * that belongs in `lib/`, next to the email address and the social URLs, and it
 * will move there the moment a second section wants it.
 */
const RESUME_PATH = "/assets/images/emmanuel_bitancor_resume.pdf";

/**
 * The hero: 60/40, name and calls to action on the left, portrait on the right.
 *
 * Server component. The only thing on this section that needs the browser is
 * the clock, and that is a leaf - so the layout itself ships as HTML rather than
 * as a component boundary the client has to hydrate before anything appears.
 *
 * The 60/40 split is `3fr 2fr` rather than `60% 40%` so the right column can
 * hold its own maximum without a second rule: `grid-template-columns: 3fr 2fr`
 * divides the space that is left after the gutter, which is what a 60/40 split
 * actually means. Below `lg` it is one column and the portrait follows the copy.
 */
export function V2Hero() {
  return (
    <section id="home" aria-labelledby="home-heading" className="scroll-mt-24">
      <div className="mx-auto grid w-full max-w-6xl gap-12 px-5 pb-16 pt-28 sm:px-8 sm:pb-24 sm:pt-36 lg:grid-cols-[3fr_2fr] lg:items-center lg:gap-16">
        <div>
          {/* Availability and local time, on one line. The dot is a static
              status indicator, not a live signal - it says the portfolio is
              maintained, which is a statement about the site rather than a claim
              about the calendar. */}
          <p className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5">
              <span aria-hidden="true" className="size-1.5 rounded-full bg-primary" />
              <span className="font-mono text-micro uppercase tracking-[0.12em] text-muted-foreground">
                Available for work
              </span>
            </span>
            <LocalClock />
          </p>

          <h1
            id="home-heading"
            className="mt-8 font-display text-display font-medium text-foreground"
          >
            Emmanuel S. Bitancor
          </h1>

          <p className="mt-5 max-w-xl text-lead text-muted-foreground">
            Full-stack developer building research, commerce and support tools.
          </p>

          <div className="mt-9 flex flex-col gap-3 min-[400px]:flex-row">
            <a
              href="#projects"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-primary px-5 text-small font-medium text-primary-foreground outline-none transition-colors hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              View projects
              <ArrowRight className="size-4" aria-hidden="true" />
            </a>

            <a
              href={RESUME_PATH}
              download="Emmanuel-Bitancor-Resume.pdf"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-border bg-card px-5 text-small font-medium text-foreground outline-none transition-colors hover:border-primary/40 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              <Download className="size-4" aria-hidden="true" />
              Download résumé
              <span className="sr-only">, PDF</span>
            </a>
          </div>

          {/* One location line, read from the same place the contact section
              reads it, so the two cannot say different cities. */}
          <p className="mt-9 font-mono text-micro uppercase tracking-[0.14em] text-faint">
            Philippines
          </p>
        </div>

        {/*
          `sizes` is the whole reason this is not a 3840px request on a phone.
          The source is 600x600 and the slot is roughly 40% of a 1152px
          container, so the largest useful render is ~500px - and at 2x for a
          retina phone, 100vw is already over-specifying past the source's own
          width. Statically imported, so width/height come with it and there is
          no layout shift.
        */}
        <div className="mx-auto w-full max-w-[22rem] lg:max-w-none">
          <div className="overflow-hidden rounded-[0.75rem] border border-border bg-muted">
            <Image
              src={portrait}
              alt="Emmanuel S. Bitancor"
              width={600}
              height={600}
              priority
              sizes="(max-width: 1023px) 352px, 30vw"
              className="h-full w-full object-cover"
            />
          </div>
        </div>
      </div>
    </section>
  );
}