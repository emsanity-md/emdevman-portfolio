import { Briefcase, UserRound } from "lucide-react";

import { V4Projects } from "./V4Projects";
import { V4Entry, V4Head, V4Track } from "./bits";
import { aboutBio, aboutFocus } from "@/app/lib/about";
import { cvExperience, cvProfile } from "@/app/lib/cv";

/**
 * v4's right column: the paper.
 *
 * The name band first, then About and Job Experience - the two blocks of prose -
 * and then the full project set, which is the one section here that exists because
 * this is still a portfolio and not only a document.
 *
 * Skills moved to the rail partway through building this. It started here beside
 * Job Experience, where the template puts it, and the measured result was a rail
 * with 2958px of empty charcoal under Education while this column ran to the
 * bottom of the page. Ten projects is 3000px of content against a rail holding
 * three short blocks, so the imbalance had to be closed by moving content rather
 * than by padding. The bars also read better on charcoal - yellow at 7.5:1 -
 * than they did as thin grey-tracked lines on white.
 *
 * The rail carries an index of four projects and this carries all of them, which
 * looks redundant until you use it: the rail answers "has he shipped anything",
 * and this answers "what is it".
 */
export function V4Main() {
  return (
    <div className="v4-main">
      {/*
        The one tinted block in the column, and the first thing on the page after
        the portrait. The surname takes the accent alone - it is the template's one
        typographic flourish, and splitting the name in the data rather than in
        the markup is what lets it be the only coloured word.
      */}
      <header className="v4-band">
        <h1 className="v4-band-name">
          {cvProfile.given}{" "}
          <span className="v4-band-family">{cvProfile.family}</span>
        </h1>
        <p className="v4-band-title">{cvProfile.title}</p>
        <p className="v4-band-tagline">
          {cvProfile.tagline} &middot; {aboutFocus}
        </p>
      </header>

      <div className="v4-main-body">
        <V4Track>
          <section id="about" aria-labelledby="v4-about-heading">
            <V4Head
              icon={<UserRound />}
              title="About Me"
              id="v4-about-heading"
            />
            {/*
              Justified, as the template sets it - but the copy is from
              lib/about.ts rather than written here, so this design cannot end up
              describing the work differently from v1, v2 and v3.
            */}
            <p className="v4-body v4-justify">{aboutBio}</p>
          </section>

          <hr className="v4-dash" />

          <section aria-labelledby="v4-experience-heading">
            <V4Head
              icon={<Briefcase />}
              title="Job Experience"
              id="v4-experience-heading"
            />
            {cvExperience.map((entry) => (
              <V4Entry
                key={`${entry.title}-${entry.years}`}
                title={entry.title}
                detail={entry.detail}
                years={entry.years}
                summary={entry.summary}
              />
            ))}
          </section>

          <hr className="v4-dash" />

          {/*
            The last block on the sheet.

            `V4Projects` renders its own `<section>` rather than being wrapped in
            one here, because wrapping it at the call site meant the heading id
            had to be passed down through a prop or invented out of thin air to
            satisfy `aria-labelledby`. The section belongs with the content it
            labels.

            The heading id is named for what it heads rather than numbered: an
            earlier pass used `v4-projects-heading-v2` to dodge the rail's
            `v4-projects-heading`, which reads like the second v2 design in a
            repo that already has one.

            There is no Contact block after this, and that was a deliberate call.
            There was one - "Get In Touch" - carrying the shared `ContactForm` and
            a second copy of the rail's address list, and it read as duplication
            because it was duplication: the same four addresses twice on one
            page. Removing the section took the contact form with it, which is
            the real cost, and v4 now has no way to send a message. The rail's
            email link is a `mailto:`, so it is one click, but it opens a mail
            client rather than a form.

            The trade was made deliberately rather than by oversight. `id="contact"`
            moved to the rail's Contact Me section so `/` + the `contact` nav
            target still resolve to a real element, and this design has no navbar
            or footer to carry that link anyway.
          */}
          <V4Projects />
        </V4Track>
      </div>
    </div>
  );
}
