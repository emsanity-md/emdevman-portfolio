import type { ReactNode } from "react";

/**
 * v1's section shell: a hairline, a blue eyebrow, a heading, an optional lede,
 * then content. No badge, no numbered marker, no icon, and no scroll-triggered
 * reveal.
 *
 * Deliberately not the shared `Section`. That one exists to serve two designs
 * from one markup by deciding in CSS which header to show; v1 has one header, so
 * a gate would be a cost with no buyer.
 *
 * The heading's family and weight come from `.v1-display` in globals.css rather
 * than from utilities here, so all the markup has to carry is the size.
 */
export function V1Section({
  id,
  label,
  title,
  lede,
  children,
}: {
  /** Anchor target. Must match the id in v1Sections so the nav links resolve. */
  id: string;
  /** Short lowercase phrase above the heading, e.g. "selected work". */
  label: string;
  title?: ReactNode;
  lede?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <section id={id} className="v1-section">
      <p className="v1-label">{label}</p>
      {title ? <h2 className="v1-display mt-3 text-3xl lg:text-4xl">{title}</h2> : null}
      {lede ? <p className="v1-lede mt-4">{lede}</p> : null}
      {children}
    </section>
  );
}
