import type { ReactNode } from "react";

import { cn } from "@/app/lib/utils";

/**
 * v4's small shared pieces.
 *
 * The template's whole structure is one motif - a vertical hairline with a mark
 * on it - repeated with two different marks. Expressing it in each of the two
 * columns would mean the marks drifting apart, so they live here once and both
 * columns import them.
 *
 * All of it is CSS. Nothing here needs state, so nothing here is a client
 * component and the sheet renders on the server.
 *
 * The hairline itself is not here: it belongs to the column, not to a block, so
 * it is drawn once by `V4Track` below. A line per section draws three
 * disconnected stubs with gaps where the section spacing is, which is not the
 * motif.
 */

/**
 * One column's timeline: the hairline, and whatever hangs off it.
 *
 * Rendered as a real element rather than a `::before` because a pseudo-element
 * cannot be positioned relative to the column's padding from inside a wrapper -
 * the marks need to line up with it, and both need to agree on one inset.
 */
export function V4Track({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn("v4-track", className)}>
      <span className="v4-track-line" aria-hidden="true" />
      {children}
    </div>
  );
}

/**
 * A section heading: the yellow pill on the line, an icon in a filled circle,
 * then the title.
 *
 * The circle is decorative and the title is real text, so the icon is hidden from
 * assistive tech rather than the heading being hidden - the heading is the
 * content and the glyph is only there to make the block scannable.
 */
export function V4Head({
  icon,
  title,
  id,
}: {
  icon: ReactNode;
  title: string;
  /** Wired to the section's `aria-labelledby`, so the heading names the region. */
  id?: string;
}) {
  return (
    <div className="v4-head">
      <span className="v4-tl-bar" aria-hidden="true" />
      <span className="v4-head-icon" aria-hidden="true">
        {icon}
      </span>
      <h2 className="v4-head-title" id={id}>
        {title}
      </h2>
    </div>
  );
}

/**
 * The dashed rule the template draws between groups inside a column.
 *
 * A real `<hr>` rather than a border on the next block: it is content order, it
 * is announced by some screen readers as a thematic break, and - unlike a border
 * - it survives being the last thing in a column.
 */
export function V4Dash() {
  return <hr className="v4-dash" />;
}

/**
 * One entry on the timeline: a yellow dot, a bold title, an optional date range
 * opposite it, a muted detail line, and an optional summary.
 *
 * Always a `<div>`. It used to take an `href` and become the anchor itself, so
 * the whole block would be the hit area rather than the three words of a title -
 * which was right, and was built for the rail's "Selected Work" block. That block
 * is gone, because the main column's Work section lists the same projects properly,
 * and nothing else on the rail links anywhere: Education and Job Experience are
 * both plain text.
 *
 * So the `href` branch had one caller and now has none, and it is cut rather than
 * left as an unused capability - along with `.v4-entry-link` and
 * `.v4-entry-arrow` in the stylesheet. Projects that do link out do it through
 * `V4Projects`, which builds its own markup for that and has a quick-view dialog
 * to open.
 */
export function V4Entry({
  title,
  detail,
  years,
  summary,
}: {
  title: string;
  detail?: string;
  years?: string;
  summary?: string;
}) {
  return (
    <div className="v4-entry">
      <span className="v4-tl-dot" aria-hidden="true" />

      <div className="v4-entry-head">
        <span className="v4-entry-title">{title}</span>

        {years ? <span className="v4-entry-years">{years}</span> : null}
      </div>

      {detail ? <p className="v4-entry-detail">{detail}</p> : null}
      {summary ? <p className="v4-entry-summary">{summary}</p> : null}
    </div>
  );
}
