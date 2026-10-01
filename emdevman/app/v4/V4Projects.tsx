"use client";

import Image from "next/image";
import Link from "next/link";
import { useId, useState } from "react";
import { ArrowUpRight, ChevronDown, FolderGit2, Github, LockKeyhole } from "lucide-react";

import ProjectModal from "@/app/components/ProjectModal";
import type { Project } from "@/app/lib/data";
import { projects } from "@/app/lib/data";
import { cn } from "@/app/lib/utils";
import { V4Head } from "./bits";

/**
 * v4's project list.
 *
 * Every design's Projects section is a different layout over the same ten
 * projects in `lib/data.ts` - a carousel in v2, a three-card deck in v3, a
 * filterable grid in v1. This one is a CV entry list: a thumbnail, the title, the
 * category opposite it, the description clamped to two lines, and the outbound
 * links.
 *
 * Deliberately NOT `ProjectDeckCard`. That card is a slot in a carousel - it
 * takes `slot`, `onPromote` and `onOpen`, and its three positions are positioned
 * by `.project-deck-card.is-left / is-center / is-right` in v3's stylesheet. There
 * is no slot here and no deck to promote into, so every one of those props would
 * be a lie, and the card's `display-pixel` title would arrive wearing another
 * design's typeface.
 *
 * `Client` because the quick view is stateful, and because the list collapses.
 * The modal itself is reused whole, so the quick view behaves identically here as
 * it does under v2 and v3 rather than being a fourth implementation of the same
 * dialog.
 */

/**
 * How many projects are shown before the button is pressed.
 *
 * Four was originally chosen to match a "Selected Work" block on the rail, which
 * showed the four most recent. That block is gone - the main column's Work
 * section supersedes it - so the number now stands on its own: it is the same
 * count `sections/Projects.tsx` uses for its own "View all N projects" button,
 * and ten entries is about 3000px of column against a rail holding three short
 * blocks, which left the sheet ending in a long unbalanced tail.
 */
const COLLAPSED_COUNT = 4;

export function V4Projects() {
  const [openProject, setOpenProject] = useState<Project | null>(null);
  const [showAll, setShowAll] = useState(false);

  /*
    A second `useId` because the first is the modal's. Naming the collapsible
    region means the button's `aria-controls` points at a real id rather than at
    nothing, which is the difference between a disclosure a screen reader can
    follow and one it can only hear toggle.
  */
  const listId = useId();
  const hiddenCount = projects.length - COLLAPSED_COUNT;

  return (
    <section id="projects" aria-labelledby="v4-work-heading">
      <V4Head icon={<FolderGit2 />} title="Work" id="v4-work-heading" />

      <div className="v4-projects" id={listId}>
        {projects.map((project, index) => (
          /*
            Collapsed entries carry a class rather than the `hidden` attribute.

            `hidden` is the obvious choice and it does not work here. Tailwind v4's
            preflight declares `[hidden]:where(:not([hidden=until-found])) { display:
            none !important }` - an *author-origin* important declaration, so it
            outranks the print override written to undo it. Putting `!important` on
            that override is not enough either: Lightning CSS hoists unlayered rules
            into a cascade layer, and important declarations resolve by layer order
            rather than by specificity. Measured with the override in place - the
            rule matched the element and still lost, computed `display` staying
            `none`.

            A class is under this design's own control end to end and needs no
            `!important`. `display: none` still removes the entry from the
            accessibility tree exactly as `hidden` does, and still keeps its
            thumbnail from being fetched - which were the two properties that
            actually mattered, not the attribute itself.
          */
          <article
            key={project.slug}
            className={cn(
              "v4-project",
              !showAll && index >= COLLAPSED_COUNT && "v4-project--collapsed",
            )}
          >
            <span className="v4-tl-dot" aria-hidden="true" />

            <div className="v4-project-head">
              <Image
                src={project.image}
                alt=""
                width={40}
                height={40}
                draggable={false}
                className="v4-project-thumb"
              />

              <h3 className="v4-project-title">
                <button
                  type="button"
                  className="v4-project-open"
                  onClick={() => setOpenProject(project)}
                  aria-label={`Open quick view for ${project.title}`}
                >
                  {project.title}
                </button>
              </h3>

              <span className="v4-entry-years">
                {String(index + 1).padStart(2, "0")} / {String(projects.length).padStart(2, "0")}
              </span>
            </div>

            <p className="v4-project-role">{project.role}</p>
            <p className="v4-project-summary">{project.description}</p>

            <div className="v4-project-links">
              <a
                className="v4-project-link"
                href={project.demo}
                target="_blank"
                rel="noopener noreferrer"
              >
                Live site
                <ArrowUpRight aria-hidden="true" />
              </a>

              {project.github ? (
                <a
                  className="v4-project-link"
                  href={project.github}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Github aria-hidden="true" />
                  Source
                </a>
              ) : (
                <Link
                  className="v4-project-link"
                  href={`/error/private?project=${encodeURIComponent(project.title)}`}
                >
                  <LockKeyhole aria-hidden="true" />
                  Private
                </Link>
              )}

              <span className="v4-project-category">{project.category}</span>
            </div>
          </article>
        ))}
      </div>

      {/*
        The disclosure. Guarded on `hiddenCount` rather than on `projects.length`
        so that if the data ever drops to four or fewer entries the button
        disappears instead of offering to show something that is already showing.

        `aria-expanded` on a button that sits *after* the region it controls is
        the pattern, and the count in the label is read on every press rather than
        only on the collapsed state - so "Show fewer" is unambiguous about which
        direction it goes.

        No framer-motion here, unlike v2's version of this button. The sheet is a
        document; entries appearing all at once reads as a page being revealed,
        and animating ten thumbnails in would cost a layout transition per entry
        for something the reader asked to see immediately.
      */}
      {hiddenCount > 0 && (
        <div className="v4-projects-toggle">
          <button
            type="button"
            className="v4-projects-toggle-btn"
            onClick={() => setShowAll((visible) => !visible)}
            aria-expanded={showAll}
            aria-controls={listId}
          >
            {showAll ? "Show fewer projects" : `Show all ${projects.length} projects`}
            <ChevronDown
              className="v4-projects-toggle-chevron"
              data-open={showAll}
              aria-hidden="true"
            />
          </button>

          {/*
            Announced politely so the expansion is not silent. `aria-expanded`
            already conveys the state change; this adds the consequence - six more
            entries now exist below - which is the part a screen reader user cannot
            infer without going and looking.
          */}
          <span className="sr-only" role="status" aria-live="polite">
            {showAll
              ? `Showing all ${projects.length} projects.`
              : `${hiddenCount} more projects hidden.`}
          </span>
        </div>
      )}

      <ProjectModal
        isOpen={openProject !== null}
        project={openProject}
        onClose={() => setOpenProject(null)}
      />
    </section>
  );
}
