import { cn } from "@/app/lib/utils";
import type { ExperienceEntry } from "@/app/lib/experience";

/**
 * One entry in the experience timeline: a narrow date column on the left, the
 * role and organisation on the right.
 *
 * An ordered list rather than a set of divs, because that is what it is - the
 * most recent role first. `<ol>` also gives assistive technology the "3 of 2"
 * position for free, which is the one fact about a timeline a screen reader
 * cannot get from the markup otherwise.
 *
 * The date column is narrow and fixed rather than sized by its content because
 * the two ranges are different shapes ("2026 - Present" against "April - June
 * 2026") and a content-sized column would make the second entry's body text
 * start somewhere else from the first's. It stacks above the role below
 * `sm`, where a 7rem column would cost more width than it is worth.
 */
export function TimelineItem({
  entry,
  className,
}: {
  entry: ExperienceEntry;
  className?: string;
}) {
  return (
    <li className={cn("relative", className)}>
      <div className="grid gap-1 pb-10 sm:grid-cols-[7rem_minmax(0,1fr)] sm:gap-8 sm:pb-12">
        <p className="font-mono text-micro uppercase leading-relaxed tracking-[0.12em] text-faint sm:pt-1">
          {entry.period}
        </p>

        <div className="min-w-0 border-l border-border pl-5 sm:pl-6">
          <h3 className="font-display text-subheading font-medium text-foreground">
            {entry.role}
          </h3>
          <p className="mt-1 text-small text-muted-foreground">{entry.organisation}</p>

          <ul className="mt-4 space-y-2">
            {entry.outcomes.map((outcome) => (
              <li key={outcome} className="flex gap-3 text-small leading-relaxed text-muted-foreground">
                <span aria-hidden="true" className="mt-2 size-1 shrink-0 rounded-full bg-primary" />
                <span>{outcome}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </li>
  );
}