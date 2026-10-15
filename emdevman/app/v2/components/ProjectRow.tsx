import Link from "next/link";

import { cn } from "@/app/lib/utils";
import type { Project } from "@/app/lib/data";

/**
 * One line of the compact project list.
 *
 * A row rather than a card, because these are the other six: enough to say what
 * each one is and where to read more, in a block that stays shorter than the
 * featured grid above it. A grid of six more cards would make the grid above
 * meaningless - four of them would be the same size as the other four, with no
 * way to tell which four.
 *
 * The year column is conditional on the data rather than on the viewport. Every
 * `year` in `lib/data.ts` is still a TODO, and a column of em dashes reads as a
 * bug; the column appears the moment real years land, and the rows reflow
 * around it.
 */
export function ProjectRow({ project }: { project: Project }) {
  return (
    <li className="group relative">
      <div className="flex flex-col gap-1 px-4 py-4 transition-colors hover:bg-muted/40 sm:flex-row sm:items-baseline sm:gap-6 sm:px-5">
        <h3 className="font-display text-body font-medium text-foreground sm:w-56 sm:shrink-0">
          <Link
            href={`/projects/${project.slug}`}
            className="outline-none after:absolute after:inset-0 focus-visible:underline"
          >
            {project.title}
          </Link>
        </h3>

        <p className="min-w-0 flex-1 text-small leading-relaxed text-muted-foreground">
          {project.lede ?? project.description}
        </p>

        {project.year ? (
          <p className="font-mono text-micro uppercase tracking-[0.12em] text-faint sm:w-16 sm:shrink-0 sm:text-right">
            {project.year}
          </p>
        ) : null}
      </div>
    </li>
  );
}

/**
 * The list wrapper.
 *
 * Kept as its own component so the border, the division rules and the
 * conditional year column are written once rather than per row.
 */
export function ProjectRowList({
  projects,
  showYears,
  className,
}: {
  projects: Project[];
  /** Whether any project has a year. Drives the label above the column. */
  showYears: boolean;
  className?: string;
}) {
  return (
    <div className={cn("rounded-[0.75rem] border border-border bg-card", className)}>
      <div className="flex items-baseline justify-between gap-4 border-b border-border px-4 py-3 sm:px-5">
        <p className="font-mono text-micro uppercase tracking-[0.18em] text-muted-foreground">
          Also built
        </p>
        {showYears ? (
          <p className="font-mono text-micro uppercase tracking-[0.12em] text-faint">Year</p>
        ) : null}
      </div>

      <ul className="divide-y divide-border">
        {projects.map((project) => (
          <ProjectRow key={project.slug} project={project} />
        ))}
      </ul>
    </div>
  );
}