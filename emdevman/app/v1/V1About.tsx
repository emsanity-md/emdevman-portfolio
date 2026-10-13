import {
  aboutBio,
  aboutFocus,
  aboutLocation,
  aboutQuote,
  aboutStrengths,
} from "@/app/lib/about";

import { V1Section } from "./Section";
import { V1Row, V1Rows } from "./rows";

/**
 * v1's about: the bio, two facts, the principles, and the quote.
 *
 * v3's version carries a three-image gallery; v2's is a carousel with arrows,
 * thumbnails and swipe handlers. Neither belongs here - v1 has one image on the
 * whole page, and the writing stands on its own.
 */
export function V1About() {
  return (
    <V1Section id="about" label="background">
      <p className="v1-lede mt-6 text-foreground">{aboutBio}</p>

      <V1Rows>
        <V1Row label="Focus">{aboutFocus}</V1Row>
        <V1Row label="Based in">{aboutLocation}</V1Row>
      </V1Rows>

      <div className="mt-14">
        <p className="v1-label">Principles</p>

        <div className="v1-rows mt-5">
          {aboutStrengths.map((strength, index) => (
            <div key={strength.title} className="v1-row">
              <span className="v1-label v1-row-key w-8 shrink-0">
                {String(index + 1).padStart(2, "0")}
              </span>

              <span className="min-w-0 flex-1 text-right">
                <span className="block text-[0.9375rem] text-foreground">
                  {strength.title}
                </span>
                <span className="mt-0.5 block text-[0.875rem] text-muted-foreground">
                  {strength.description}
                </span>
              </span>
            </div>
          ))}
        </div>
      </div>

      {/*
        The pull-quote, as a card.

        This was a `.v1-display` - so Newsreader at weight 400 - set in italic
        behind a 2px left rule. Both halves of that are gone with the rest of the
        serif: an 800-weight sans does not take italic well, and a bare rule on
        the page is the one decoration v1 no longer has any use for now that
        every other surface is a card.

        The blue left edge is the replacement - the same accent the hero's
        greeting uses, carrying the one moment on the page that is set as a
        statement rather than as data.
      */}
      <blockquote className="mt-14 max-w-[42rem] rounded-r-xl border border-border border-l-4 border-l-blue-600 bg-card py-7 pl-7 pr-6 text-[1.25rem] font-semibold leading-relaxed text-foreground shadow-sm">
        {aboutQuote}
      </blockquote>
    </V1Section>
  );
}
