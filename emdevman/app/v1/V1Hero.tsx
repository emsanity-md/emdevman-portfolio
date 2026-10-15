import Image from "next/image";

import {
  heroActions,
  heroGreeting,
  heroIntro,
  heroTitleLines,
} from "@/app/lib/hero";
import profileImage from "../assets/images/v1-profile.png";

/**
 * v1's hero: text left, circular portrait right.
 *
 * Full viewport height minus the navbar, vertically centred, on its own
 * max-w-7xl so its left edge lands on the navbar's wordmark and its right edge
 * on the navbar's last link.
 *
 * Two things here are not left to the markup, and both are in globals.css:
 *
 *   - `.v1-hero-title` / `.v1-hero-title-line`. The font and weight live there
 *     because v1's `h1, h2, h3` rule is unlayered and would otherwise force
 *     Newsreader at weight 400 over the utilities here.
 *   - `.v1-hero`. The background, which has to equal --background so the hero
 *     and the page around it are the same colour with no seam at the gutters.
 *
 * Below lg this is one column and centred, portrait first: who this is, then
 * what they do.
 */
export function V1Hero() {
  return (
    <section
      id="home"
      className="v1-hero min-h-[calc(100vh-78px)] flex items-center"
      aria-labelledby="hero-heading"
    >
      {/* Same container as the navbar: max-w-7xl, px-6, px-8 from lg. */}
      <div className="max-w-7xl mx-auto w-full px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_1fr] gap-12 items-center">
          {/* LEFT COLUMN: greeting, headline, paragraph, buttons. */}
          <div className="text-center lg:text-left">
            {/* 1. Greeting - the name carries the blue accent. */}
            <p className="text-3xl font-medium text-slate-900">
              {heroGreeting.before}{" "}
              <span className="text-blue-600">{heroGreeting.name}</span>
            </p>

            {/*
              2. Headline. font-black and text-7xl/8xl on desktop, 5xl on
              mobile, leading-[0.95] so the two lines sit tight.

              "Prompt Stack" is its own nowrap box, so the <br> is the only thing
              deciding the break - the left column is wide enough for it to hold
              together on one line at every desktop width.

              The `{" "}` between the two boxes is a real space in the text
              content and collapses to nothing visually, because the boxes are
              `display: block`. Without it the rendered page is right but the
              text is not: selecting the headline, copying it, or reading it out
              gives "Prompt StackDeveloper", which is what this line fixes.
            */}
            <h1
              id="hero-heading"
              className="v1-hero-title mt-3 text-[2.75rem] sm:text-5xl lg:text-7xl xl:text-8xl leading-[0.95] tracking-tight text-slate-900"
            >
              <span className="v1-hero-title-line">{heroTitleLines[0]}</span>{" "}
              <span className="v1-hero-title-line">{heroTitleLines[1]}</span>
            </h1>

            {/* 3. Paragraph - ~4 lines at text-xl, capped at max-w-2xl. */}
            <p className="mt-6 max-w-2xl mx-auto lg:mx-0 text-xl leading-relaxed text-slate-600">
              {heroIntro.before}{" "}
              <strong className="font-bold text-slate-900">{heroIntro.strong}</strong>{" "}
              {heroIntro.after}
            </p>

            {/* 4. Buttons - side by side from sm, stacked below. */}
            <div className="mt-8 flex flex-col sm:flex-row flex-wrap items-center justify-center lg:justify-start gap-5">
              <a
                href="#projects"
                className="no-underline w-full sm:w-auto px-8 py-4 rounded-lg bg-blue-600 text-white text-lg font-medium shadow hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
              >
                {heroActions.primary}
              </a>
              <a
                href="#contact"
                className="no-underline w-full sm:w-auto px-8 py-4 rounded-lg border border-blue-600 bg-transparent text-blue-600 text-lg font-medium hover:bg-blue-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
              >
                {heroActions.secondary}
              </a>
            </div>
          </div>

          {/*
            RIGHT COLUMN: the portrait, right-aligned and vertically centred.

            The border and radius sit on the wrapper, the clipping on the image
            beneath it, so the 2px ring is never clipped away by its own
            overflow. object-top keeps the head and shoulders inside the circle
            on a 3:4 photograph.

            `relative` is load-bearing, not decoration: the Image is `fill`, so
            it positions itself against the nearest positioned ancestor. Without
            it the wrapper is `static` and the image escapes to the section
            instead of the circle - which Next.js also warns about at runtime.
          */}
          <div className="order-first lg:order-last flex lg:justify-end justify-center">
            <div className="relative w-[280px] h-[280px] lg:w-[480px] lg:h-[480px] shrink-0 rounded-full overflow-hidden border-2 border-blue-600 shadow-xl">
              <Image
                src={profileImage}
                alt="Emmanuel Bitancor"
                loading="eager"
                fetchPriority="high"
                fill
                className="object-cover object-top"
                sizes="(max-width: 1023px) 280px, 480px"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
