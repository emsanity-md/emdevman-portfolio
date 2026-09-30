import type { CSSProperties, ReactNode } from "react";

import { cn } from "@/app/lib/utils";
import { Badge } from "@/app/components/ui/badge";
import Reveal from "@/app/components/ui/Reveal";

type SectionProps = {
  /** Anchor target. Must match the id in navLinks so the scroll spy finds it. */
  id: string;
  /** Two-digit position, shown in the pixel "01 - " marker. */
  index: string;
  /** Short lowercase phrase, e.g. "selected work". */
  eyebrow: string;
  /**
   * V2's heading. Optional, because v3 sections carry no heading at all -
   * just the numbered marker and, sometimes, a link.
   */
  title?: ReactNode;
  description?: ReactNode;
  /**
   * Icon for V2's outline badge, supplied as a node so each section can
   * keep its own accent until the tokens land. Ignored by v3, which has no
   * badge.
   */
  icon?: ReactNode;
  /**
   * Mono link opposite the marker - "all projects ↗". v3 only, and the reason
   * a section can get away with no heading of its own.
   */
  action?: { label: string; href: string };
  /** Opt out of the header entirely. */
  bare?: boolean;
  /** Rule on the bottom edge as well as the top. */
  both?: boolean;
  /** Use the wider measure, for sections that genuinely need a grid. */
  wide?: boolean;
  /** Fade the header up as it scrolls into view. */
  reveal?: boolean;
  className?: string;
  children: ReactNode;
};

/**
 * The shell every section shares: padding, the content measure, and the
 * header.
 *
 * One markup serves both designs. Under V2 it reproduces the existing
 * outline badge, large bold heading and wide `max-w-6xl` column. Under v3 the
 * badge is dropped in favour of a small pixel "01 —" marker, the heading
 * becomes a weight-600 sans title, and the column narrows to the reading
 * measure. Which of the two you get is decided entirely by the `data-design`
 * attribute in globals.css, not by a branch here.
 */
export function Section({
  id,
  index,
  eyebrow,
  title,
  description,
  icon,
  action,
  bare = false,
  both = false,
  wide = false,
  reveal = false,
  className,
  children,
}: SectionProps) {
  /*
    Two different headers, not one restyled.

    V2: an outline badge, a large bold heading and a lede. It needs a
    heading because its sections are tall and card-led.

    v3: no heading at all. Just "01 - blog" in the pixel face at small size in
    gray-400, and a mono link opposite it, then straight into the content. The
    content is expected to speak for itself; if a screen feels empty, that is
    usually correct.
  */
  const marker = (
    <h2 className="display-pixel section-index">{`${index} - ${eyebrow}`}</h2>
  );

  const v2Header = (
    <>
      {icon && (
        <Badge variant="outline" className="section-badge">
          {icon}
          {eyebrow}
        </Badge>
      )}
      {title && <h2 className="section-title">{title}</h2>}
      {description && <p className="section-description">{description}</p>}
    </>
  );

  const v3Header = (
    <div className="section-head-v3">
      {marker}
      {action && (
        <a
          href={action.href}
          className="section-action font-mono text-[11px] uppercase tracking-wider text-muted-foreground hover:text-foreground"
        >
          {action.label} <span aria-hidden="true">↗</span>
        </a>
      )}
    </div>
  );

  return (
    <section
      id={id}
      className={cn("section", both && "section--both", wide && "section--wide", className)}
      // Drives the staggered page entrance. The numeric part of `index` is
      // already the section's position down the page, which is exactly the
      // order the stagger wants.
      style={{ "--reveal-index": Number.parseInt(index, 10) || 0 } as CSSProperties}
    >
      <div className="section-inner reveal">
        {bare ? null : reveal ? (
          <>
            <div className="v2-only">{v2Header}</div>
            <Reveal>{v3Header}</Reveal>
          </>
        ) : (
          <>
            <div className="v2-only">{v2Header}</div>
            {v3Header}
          </>
        )}
        {children}
      </div>
    </section>
  );
}
