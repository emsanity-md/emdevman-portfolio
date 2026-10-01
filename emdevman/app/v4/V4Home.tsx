import { V4Controls } from "./V4Controls";
import { V4Main } from "./V4Main";
import { V4Rail } from "./V4Rail";

/**
 * v4's whole page - the CV design.
 *
 * A yellow-and-charcoal two-column resume sheet, built from the mockup in
 * `app/assets/images/CV-TEMPLATE.jpg`. It lives in its own directory for the
 * same reason `app/v1/` does: the layout is genuinely different markup rather
 * than one tree restyled, so the choice happens once here instead of once per
 * section.
 *
 * Rendered as a sibling of the v1 and v2/v3 trees in `page.tsx` and gated on
 * `data-design="v4"` in CSS, so no design pays for another's markup beyond the
 * bytes already in the document.
 *
 * Two columns, one sheet. The rail is charcoal and sticky; the main column is
 * the paper. Under 1024px they stack with the rail first, because the portrait
 * and the contact details are what a reader wants before the prose.
 *
 * There is no Activity section. A CV has no contribution calendar, and v1 set
 * the precedent for dropping it rather than shipping a section the design's own
 * logic does not support.
 */
export function V4Home() {
  return (
    <div className="v4-inner">
      {/*
        `id="home"` on the sheet rather than on the rail or the band.

        The other designs put it on their first section, but under v4 nothing is
        above the sheet - the portrait is inside the rail, and a deep link to
        "home" should land on the top of the page, not on the middle of the
        left column. Putting it on the sheet means `/` and `/#home` agree.

        The id is a third copy in the document, which is the situation
        `findRenderedSection` exists to resolve: it takes the element that has
        client rects, so it picks this one under v4 and the v1 and v2/v3 copies
        under their own designs without anyone maintaining a list.
      */}
      <div className="v4-sheet" id="home">
        {/*
          The two yellow diagonal cuts, as siblings of the columns rather than
          children of either. The top-left one belongs to the sheet's corner, not
          to the rail's - the rail's box is a grid cell that stops at the fold,
          and a corner cut pinned to it would leave a notch of page showing at
          the bottom of the rail on a long sheet.
        */}
        <span className="v4-corner v4-corner--tl" aria-hidden="true" />
        <span className="v4-corner v4-corner--br" aria-hidden="true" />

        <V4Rail />
        <V4Main />
      </div>

      <V4Controls />
    </div>
  );
}
