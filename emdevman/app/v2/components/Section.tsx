import type { ReactNode } from "react";

import { cn } from "@/app/lib/utils";

/**
 * A section shell for the v2 design.
 *
 * This is not the shared `ui/Section.tsx`. That component renders two different
 * headers and lets `data-design` pick between them, which is the right trade
 * when two designs share one body of markup. Here there is only one design, so a
 * second branch would be a branch with one arm - the shared one would grow a
 * third set of conditionals to serve a design that has its own file.
 *
 * The header is a mono eyebrow and an `h2`. Deliberately small: the five
 * sections on this page are meant to read as one long document rather than as
 * five panels competing for attention.
 */
export function Section({
  id,
  eyebrow,
  title,
  children,
  className,
  containerClassName,
}: {
  /** Anchor target. Must match the id in `lib/navigation.ts` for the scroll spy. */
  id: string;
  /** Short lowercase phrase, set in mono above the title. */
  eyebrow: string;
  title: ReactNode;
  children: ReactNode;
  className?: string;
  containerClassName?: string;
}) {
  const headingId = `${id}-heading`;

  return (
    <section
      id={id}
      aria-labelledby={headingId}
      className={cn("scroll-mt-24 border-t border-border", className)}
    >
      <div className={cn("mx-auto w-full max-w-6xl px-5 sm:px-8", containerClassName)}>
        <header className="pt-16 sm:pt-24">
          <p className="font-mono text-micro uppercase tracking-[0.18em] text-muted-foreground">
            {eyebrow}
          </p>
          <h2
            id={headingId}
            className="mt-3 font-display text-title font-medium text-foreground"
          >
            {title}
          </h2>
        </header>

        <div className="pt-10 sm:pt-12">{children}</div>
      </div>
    </section>
  );
}