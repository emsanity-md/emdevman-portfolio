"use client";

import { useMemo, useState } from "react";

import {
  projectCategories,
  projects,
  type ProjectCategory,
} from "@/app/lib/data";

import { V1Section } from "./Section";

/**
 * How many cards are shown before the reader has to ask for more.
 *
 * Six, because the grid is three wide and six is two full rows - the section
 * reads as complete rather than as truncated, and there is no orphan row of
 * three above the button. V2's equivalent uses four over a two-wide featured
 * layout; the number is layout-specific, not a site-wide constant.
 */
const INITIAL_COUNT = 6;

function formatIndex(index: number) {
  return String(index + 1).padStart(2, "0");
}

function countFor(category: ProjectCategory) {
  return category === "All"
    ? projects.length
    : projects.filter((project) => project.category === category).length;
}

/**
 * v1's projects: a filterable grid of cards with a show more / show less control.
 *
 * No image anywhere, and no quick view - there is no panel to open, so the only
 * outbound links are the live demo and the source. v3 shows a card deck and v2 a
 * grid of thumbnails; both need a click before you learn anything, and v1 just
 * says it.
 *
 * Two pieces of state, and they compose: the category filter narrows the list,
 * and the expander shows the first six of whatever that produced. `expanded` is
 * reset whenever the category changes, because leaving a reader on "Show less"
 * after they have narrowed to a two-project category would hide a control that
 * has nothing left to show.
 */
export function V1Projects() {
  const [category, setCategory] = useState<ProjectCategory>("All");
  const [expanded, setExpanded] = useState(false);

  const visible = useMemo(
    () => (category === "All" ? projects : projects.filter((project) => project.category === category)),
    [category],
  );

  const shown = expanded ? visible : visible.slice(0, INITIAL_COUNT);
  const hiddenCount = visible.length - shown.length;
  const canExpand = visible.length > INITIAL_COUNT;

  return (
    <V1Section
      id="projects"
      label="projects"
      lede="Product work across research platforms, commerce, productivity tools and interactive web experiences."
    >
      <div className="v1-filter mt-10" role="group" aria-label="Filter projects by category">
        {projectCategories.map((option) => (
          <button
            key={option}
            type="button"
            className="v1-filter-link"
            aria-pressed={category === option}
            onClick={() => {
              setCategory(option);
              setExpanded(false);
            }}
          >
            {option} ({countFor(option)})
          </button>
        ))}
      </div>

      {/*
        The grid. `.v1-entry-grid` owns the column count; `.v1-entry` is the card
        and stretches to fill its row, so the description lengths do not decide
        where the buttons sit.
      */}
      <div className="v1-entry-grid mt-8">
        {shown.map((project, index) => (
          <article key={project.slug} className="v1-entry">
            <div className="v1-entry-head">
              <span className="v1-label">{formatIndex(index)}</span>
              <span className="v1-label ml-auto">{project.category}</span>
            </div>

            <h3 className="v1-display text-lg">
              <a
                href={project.demo}
                target="_blank"
                rel="noopener noreferrer"
                className="no-underline hover:no-underline transition-colors hover:text-blue-600"
              >
                {project.title}
              </a>
            </h3>

            <p className="text-[0.9375rem] font-medium text-slate-700">{project.role}</p>

            <p className="text-[0.875rem] leading-6 text-muted-foreground">
              {project.description}
            </p>

            <p className="font-mono text-[0.6875rem] uppercase leading-5 tracking-[0.1em] text-faint">
              {project.tags.join(" · ")}
            </p>

            {/* `mt-auto` is what pins the buttons to the bottom of the tallest
                card in the row; `.v1-entry` is a flex column for exactly this. */}
            <div className="mt-auto flex flex-wrap gap-2 pt-2">
              <a
                href={project.demo}
                target="_blank"
                rel="noopener noreferrer"
                className="no-underline hover:no-underline rounded-lg border border-blue-600 bg-blue-600 px-4 py-2 text-[0.875rem] font-medium text-white transition-colors hover:bg-blue-700"
              >
                Live demo
              </a>

              {project.github ? (
                <a
                  href={project.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="no-underline hover:no-underline rounded-lg border border-blue-600 px-4 py-2 text-[0.875rem] font-medium text-blue-600 transition-colors hover:bg-blue-50"
                >
                  Source
                </a>
              ) : (
                /*
                  Spelled out rather than linked. A lock icon or a dead control
                  would imply an action that isn't available; the words just say
                  what is true.
                */
                <span className="rounded-lg border border-dashed border-border px-4 py-2 text-[0.875rem] text-muted-foreground">
                  Source private
                </span>
              )}
            </div>
          </article>
        ))}
      </div>

      {/*
        The expander.

        Rendered only when there is something to expand - a filter narrow enough
        to leave three or fewer cards hides the control rather than showing a
        disabled one, which would be a target that does nothing.

        The label carries the count on the way out ("Show 4 more") because the
        reader is deciding whether to click, and "Show more" makes them go and
        look at the filter counts to find out how much "more" is.
      */}
      {canExpand ? (
        <div className="mt-12 flex justify-center">
          <button
            type="button"
            className="v1-expand"
            aria-expanded={expanded}
            onClick={() => setExpanded((value) => !value)}
          >
            {expanded ? "Show less" : `Show ${hiddenCount} more`}
          </button>
        </div>
      ) : null}
    </V1Section>
  );
}
