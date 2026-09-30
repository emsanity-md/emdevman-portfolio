"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Github, LockKeyhole } from "lucide-react";

import type { Project } from "@/app/lib/data";

interface ProjectDeckCardProps {
  project: Project;
  index: number;
  total: number;
  /** "center" is the live card: it opens the quick view. The flanks promote. */
  slot: "left" | "center" | "right";
  onPromote: () => void;
  onOpen: () => void;
}

/**
 * v3's project card, shaped like the reference's deck card: a filled award pill
 * and outlined tag pills on top, a 48px thumbnail beside a pixel title, a 13px
 * description, then a row of action links.
 *
 * The whole card is a button rather than a card with buttons in it, which is why
 * the links are suppressed on the flanks in CSS - they are dimmed under the
 * overlay and must not be reachable.
 */
export function ProjectDeckCard({
  project,
  index,
  total,
  slot,
  onPromote,
  onOpen,
}: ProjectDeckCardProps) {
  const isCenter = slot === "center";

  const handleActivate = () => {
    if (isCenter) onOpen();
    else onPromote();
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    handleActivate();
  };

  return (
    <article
      className={`project-deck-card is-${slot}`}
      role="button"
      tabIndex={0}
      aria-label={
        isCenter
          ? `Open quick view for ${project.title}`
          : `Show ${project.title} in the deck`
      }
      onClick={handleActivate}
      onKeyDown={handleKeyDown}
    >
      <div className="surface-card h-full rounded-2xl border border-border p-5">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="pill-tag rounded-full bg-foreground px-2.5 py-0.5 text-background">
            {String(index + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
          </span>
          {project.tags.slice(0, 2).map((tag) => (
            <span
              key={tag}
              className="pill-tag rounded-full border border-border px-2 py-0.5 text-muted-foreground"
            >
              {tag}
            </span>
          ))}
        </div>

        <div className="mt-4 flex items-center gap-3.5">
          <Image
            src={project.image}
            alt=""
            width={48}
            height={48}
            className="h-12 w-12 shrink-0 rounded-xl border border-border object-cover"
          />
          <h3 className="display-pixel text-[15px] leading-tight text-foreground">
            {project.title}
          </h3>
        </div>

        <p className="mt-3 line-clamp-3 text-[13px] leading-relaxed text-muted-foreground">
          {project.description}
        </p>

        {isCenter && (
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Link
              href={`/projects/${project.slug}`}
              className="link inline-flex items-center gap-1 font-mono text-[11px] uppercase tracking-wider text-foreground"
            >
              Case study
              <ArrowUpRight className="size-3" aria-hidden="true" />
            </Link>
            {project.github ? (
              <a
                href={project.github}
                target="_blank"
                rel="noopener noreferrer"
                className="link inline-flex items-center gap-1 font-mono text-[11px] uppercase tracking-wider text-foreground"
                aria-label={`View ${project.title} source on GitHub`}
              >
                <Github className="size-3" aria-hidden="true" />
                Source
              </a>
            ) : (
              <Link
                href={`/error/private?project=${encodeURIComponent(project.title)}`}
                className="link inline-flex items-center gap-1 font-mono text-[11px] uppercase tracking-wider text-foreground"
                aria-label={`Request source access for ${project.title}`}
              >
                <LockKeyhole className="size-3" aria-hidden="true" />
                Private
              </Link>
            )}
            <span className="font-mono text-[10px] uppercase tracking-wider text-faint">
              {project.category}
            </span>
          </div>
        )}
      </div>
    </article>
  );
}
