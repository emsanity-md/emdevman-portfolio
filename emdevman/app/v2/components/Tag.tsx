import { cn } from "@/app/lib/utils";

/**
 * A small mono label: a project kind, a stack name, a date column heading.
 *
 * Mono at 11px is the one place this design's third font is used. The rule that
 * keeps it readable is that nothing in a tag is longer than a word or two - a
 * tag that needed to wrap would be a sentence, and a sentence belongs in the
 * description line above it.
 */
export function Tag({
  children,
  className,
  /** Tinted with the accent rather than outlined. One per group at most. */
  accent = false,
}: {
  children: React.ReactNode;
  className?: string;
  accent?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 font-mono text-micro uppercase tracking-[0.12em]",
        accent
          ? "border-primary/25 bg-primary/10 text-primary"
          : "border-border bg-muted/60 text-muted-foreground",
        className,
      )}
    >
      {children}
    </span>
  );
}