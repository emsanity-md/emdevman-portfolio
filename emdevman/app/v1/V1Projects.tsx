"use client";

import { useMemo, useState } from "react";

import {
  projectCategories,
  projects,
  type ProjectCategory,
} from "@/app/lib/data";

import { V1Section } from "./Section";

function formatIndex(index: number) {
  return String(index + 1).padStart(2, "0");
}

function countFor(category: ProjectCategory) {
  return category === "All"
    ? projects.length
    : projects.filter((project) => project.category === category).length;
}

/**
 * v1's projects: a numbered list of entries, each a hairline row of title,
 * category, role, description and links.
 *
 * No image anywhere, and no quick view - there is no panel to open, so the only
 * outbound links are the live demo and the source. v3 shows a card deck and v2 a
 * grid of thumbnails; both need a click before you learn anything, and v1 just
 * says it.
 *
 * The category filter survives as a row of text links rather than pills. It is
 * the one piece of state on the page, and it is there because ten projects in one
 * undifferentiated column is a lot to scroll.
 */
export function V1Projects() {
  const [category, setCategory] = useState<ProjectCategory>("All");

  const visible = useMemo(
    () => (category === "All" ? projects : projects.filter((project) => project.category === category)),
    [category],
  );

  return (
    <V1Section
      id="projects"
      label="selected work"
      lede="Product work across research platforms, commerce, productivity tools and interactive web experiences."
    >
      <div className="v1-filter mt-10" role="group" aria-label="Filter projects by category">
        {projectCategories.map((option) => (
          <button
            key={option}
            type="button"
            className="v1-filter-link"
            aria-pressed={category === option}
            onClick={() => setCategory(option)}
          >
            {option} ({countFor(option)})
          </button>
        ))}
      </div>

      <div className="mt-4">
        {visible.map((project, index) => (
          <article key={project.slug} className="v1-entry">
            <div className="v1-entry-head">
              <span className="v1-label w-8 shrink-0">{formatIndex(index)}</span>

              <h3 className="v1-display flex-1 text-[1.25rem]">
                <a
                  href={project.demo}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-foreground no-underline hover:no-underline"
                >
                  {project.title}
                </a>
              </h3>

              <span className="v1-label">{project.category}</span>
            </div>

            <p className="pl-0 text-[0.875rem] text-muted-foreground md:pl-12">
              {project.role}
            </p>

            <p className="max-w-[46rem] pl-0 text-[0.9375rem] leading-7 text-muted-foreground md:pl-12">
              {project.description}
            </p>

            <p className="pl-0 font-mono text-[0.6875rem] uppercase leading-6 tracking-[0.1em] text-faint md:pl-12">
              {project.tags.join(" · ")}
            </p>

            <div className="flex flex-wrap items-baseline gap-x-6 gap-y-2 md:pl-12">
              <a
                href={project.demo}
                target="_blank"
                rel="noopener noreferrer"
                className="v1-label text-foreground"
              >
                Live demo
              </a>

              {project.github ? (
                <a
                  href={project.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="v1-label text-foreground"
                >
                  Source
                </a>
              ) : (
                /*
                  Spelled out rather than linked. A lock icon or a dead control
                  would imply an action that isn't available; the words just say
                  what is true.
                */
                <span className="v1-label text-faint">Source private</span>
              )}
            </div>
          </article>
        ))}
      </div>
    </V1Section>
  );
}
