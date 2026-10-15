import { V2Contact } from "./V2Contact";
import { V2Experience } from "./V2Experience";
import { V2Hero } from "./V2Hero";
import { V2Stack } from "./V2Stack";
import { V2Work } from "./V2Work";

/**
 * The v2 page: five sections, top to bottom, no tabs and no second list.
 *
 * One scroll rather than a tabbed feed, because the five sections together are
 * about a screen and a half and each one answers a question a reader already
 * has - what he does, what he has built, where he has worked, what he works
 * with, and how to reach him. Splitting that across six tabs made every
 * question a click before it could be asked.
 *
 * Server components throughout. The only client leaf anywhere below is the
 * clock in the hero, so none of this ships as a hydration boundary.
 */
export function V2Home() {
  return (
    <>
      <V2Hero />
      <V2Work />
      <V2Experience />
      <V2Stack />
      <V2Contact />

      {/*
        One line, and a `footer` landmark.

        The old site footer was a wordmark, a tagline, an index of every
        section, four social links and a back-to-top - which is the nav bar and
        the contact section again, twice, after the reader had scrolled past both.
        All of that is gone. What stays is the one thing it carried that nothing
        else on the page does: who the work belongs to, and that it is theirs.

        A `<footer>` and not a sixth section: landmarks are what this is for, and
        a section would make the page six sections rather than five.
      */}
      <footer className="border-t border-border">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-5 py-10 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <p className="font-mono text-micro uppercase tracking-[0.14em] text-faint">
            © {new Date().getFullYear()} Emmanuel S. Bitancor
          </p>
          <a
            href="#home"
            className="font-mono text-micro uppercase tracking-[0.14em] text-muted-foreground underline-offset-4 outline-none hover:text-foreground hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            Back to top
          </a>
        </div>
      </footer>
    </>
  );
}