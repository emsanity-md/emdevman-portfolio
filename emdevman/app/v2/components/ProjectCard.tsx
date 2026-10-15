import Link from "next/link";
import { ArrowUpRight, Github } from "lucide-react";

import { cn } from "@/app/lib/utils";
import type { Project } from "@/app/lib/data";
import { Screenshot } from "./Screenshot";
import { Tag } from "./Tag";

/**
 * A featured project: a screenshot slot, the title, one line about it, and the
 * two kinds that describe it.
 *
 * One component for all four cards. They differ in content and not in shape, so
 * the grid is a map over the array rather than four hand-written articles - a
 * hand-written card is a card whose proportions drift from its neighbours the
 * first time one of them is edited.
 *
 * Links, and why there are two kinds:
 *
 *   "Case study"  always. The route at `/projects/[slug]` already exists for
 *                 every project, not just the first one, and it is the only
 *                 link here that says anything about how the thing works.
 *   "Live site"   where a demo exists.
 *   the GitHub    only when the source is actually public. There is no
 *   icon          lock-icon fallback pointing at `/error/private`: a dead end
 *                 that reads as an invitation is worse than no link, so a
 *                 private project simply shows one fewer control.
 */
export function ProjectCard({
  project,
  priority = false,
  className,
}: {
  project: Project;
  priority?: boolean;
  className?: string;
}) {
  /*
    TODO(owner): pass `image={project.image}` once screenshots exist at 16:10.
    The existing PNGs in app/assets/projects/ are 2.2:1 and were cropped for the
    old card, so putting them in this frame would crop or letterbox them.
  */
  const lede = project.lede ?? project.description;

  return (
    <article
      className={cn(
        "group relative flex h-full flex-col rounded-[0.75rem] border border-border bg-card p-4 transition-colors hover:border-primary/40 sm:p-5",
        className,
      )}
    >
      <Screenshot title={project.title} priority={priority} />

      <h3 className="mt-5 font-display text-subheading font-medium text-foreground">
        <Link
          href={`/projects/${project.slug}`}
          className="outline-none after:absolute after:inset-0 focus-visible:underline"
        >
          {project.title}
        </Link>
      </h3>

      <p className="mt-3 line-clamp-2 text-small leading-relaxed text-muted-foreground">
        {lede}
      </p>

      <div className="mt-4 flex flex-wrap gap-1.5">
        {project.kinds.slice(0, 2).map((kind) => (
          <Tag key={kind}>{kind}</Tag>
        ))}
      </div>

      {/* Above the title's stretched overlay, so these stay clickable even
          though the whole card is one link target. */}
      <div className="relative z-10 mt-6 flex items-center gap-4 pt-1">
        <Link
          href={`/projects/${project.slug}`}
          className="inline-flex items-center gap-1.5 font-mono text-micro uppercase tracking-[0.12em] text-foreground underline-offset-4 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          Case study
          <ArrowUpRight className="size-3.5" aria-hidden="true" />
        </Link>

        <a
          href={project.demo}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 font-mono text-micro uppercase tracking-[0.12em] text-muted-foreground underline-offset-4 outline-none hover:text-foreground hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          Live site
          <span className="sr-only">for {project.title}</span>
          <ArrowUpRight className="size-3.5" aria-hidden="true" />
        </a>

        {project.github ? (
          <a
            href={project.github}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-auto inline-flex size-8 items-center justify-center rounded-full border border-border text-muted-foreground outline-none transition-colors hover:border-primary/40 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            <Github className="size-4" aria-hidden="true" />
            <span className="sr-only">Source for {project.title} on GitHub</span>
          </a>
        ) : null}
      </div>
    </article>
  );
}