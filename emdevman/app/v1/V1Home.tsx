import { V1About } from "./V1About";
import { V1Contact } from "./V1Contact";
import { V1Hero } from "./V1Hero";
import { V1Projects } from "./V1Projects";
import { V1TechStack } from "./V1TechStack";

/**
 * v1's whole page, in order: hero, toolkit, projects, about, contact.
 *
 * Rendered as a sibling of the v2/v3 tree in page.tsx and gated on
 * `data-design="v1"` in CSS, so neither design pays for the other's markup
 * beyond the extra bytes already in the document.
 *
 * There is no Activity section. v1's GitHub numbers were the Activity section's
 * whole content, and with the calendar gone there was nothing left but three
 * figures - so the nav drops the entry rather than pointing at a section that no
 * longer exists.
 */
export function V1Home() {
  return (
    <>
      {/*
        The hero sits outside .v1-inner on purpose.

        .v1-inner is the page's centred measure - 64rem, capped and auto-margined -
        which is right for the sections' prose but wrong for the hero. The hero
        carries its own max-w-7xl, and a max-w-7xl nested inside a 64rem box
        renders at 64rem: the headline and the portrait were being squeezed into
        a column far narrower than the design's, and the background painted by the
        section stopped at the measure's edge, leaving the page colour visible as
        a strip down each side.

        Outside the wrapper it is free to be full-bleed, and it lines up with the
        navbar, which is also outside .v1-inner.
      */}
      <V1Hero />

      <div className="v1-inner">
        <V1TechStack />
        <V1Projects />
        <V1About />
        <V1Contact />
      </div>
    </>
  );
}
