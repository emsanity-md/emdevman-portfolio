import { ArrowRight } from "lucide-react";

import { HeroProfileCard } from "./components/HeroProfileCard";
import { LocalClock } from "./components/LocalClock";
import { ResumeButton } from "./components/ResumeButton";

/**
 * The hero: 60/40, name and calls to action on the left, portrait on the right.
 *
 * Server component. Everything on this section that needs the browser is a
 * leaf - the clock, the profile card, and the résumé button with its preview
 * dialog - so the layout itself ships as HTML rather than as a component
 * boundary the client has to hydrate before anything appears.
 *
 * The 60/40 split is `3fr 2fr` rather than `60% 40%` so the right column can
 * hold its own maximum without a second rule: `grid-template-columns: 3fr 2fr`
 * divides the space that is left after the gutter, which is what a 60/40 split
 * actually means. Below `lg` it is one column and the portrait follows the copy.
 */
export function V2Hero() {
  return (
    <section id="home" aria-labelledby="home-heading" className="scroll-mt-24">
      {/*
        `grid-cols-1` below `lg`, and it is not decoration.

        Without an explicit column definition the single-column case below `lg`
        is an implicit `auto` track, and a grid track is sized from its items'
        min-content contributions. The profile card is a fixed 340px, so the
        track's floor became 340px - and at a 320px viewport both columns were
        forced to 340 and 40px of the hero ran off the right edge.

        `grid-cols-1` is `repeat(1, minmax(0, 1fr))`, and that `minmax(0, ...)`
        is the whole fix: it lets the track shrink below its content, which is
        what "min-width: 0" does by hand on every other layout system. `1fr`
        alone would not - the min-content floor is exactly what `1fr` keeps.

        `min-w-0` on the card's wrapper is belt and braces for the same reason:
        the card is `w-[340px] max-w-full`, and it can only honour that
        `max-w-full` if its own box is allowed to be narrower than 340.
      */}
      <div className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-12 px-5 pb-16 pt-28 sm:px-8 sm:pb-24 sm:pt-36 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:items-center lg:gap-16">
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

            <ResumeButton />
          </div>

          {/* One location line, read from the same place the contact section
              reads it, so the two cannot say different cities. */}
          <p className="mt-9 font-mono text-micro uppercase tracking-[0.14em] text-faint">
            Philippines
          </p>
        </div>

        {/*
          The card, in the 40% column.

          No height here. The card is a fixed 340px wide and sizes itself from
          its 4:5 tile plus the footer, so a box around it only has to be as
          wide as the column - anything more would be a second, competing
          measurement of the same thing.

          `HeroProfileCard` is a client component: the foil needs a pointer and
          the status line needs a fetch. It is the only island in this hero.
        */}
        <div className="flex min-w-0 justify-center lg:justify-end">
          <HeroProfileCard />
        </div>
      </div>
    </section>
  );
}