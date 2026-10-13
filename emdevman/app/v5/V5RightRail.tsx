"use client";

import Image from "next/image";

import { Search } from "lucide-react";

import { projects, type Project } from "@/app/lib/data";
import { featuredProjects, railLinks, topTech, TOP_TECH_COUNT, V5_AVATAR } from "./profile";
import { tabLabel } from "./tabs";

/**
 * The right rail: search, top tech, featured projects, and the footer.
 *
 * Three cards and a legal line. It is the narrowest column and the least
 * important one, which is why it is the first thing to go below `lg` - and why
 * nothing here is the only copy of anything. The featured list is the same
 * `projects` array the Projects tab renders, the tech list is a view over
 * `lib/tech.ts`, and the footer repeats the nav because by the time a reader is
 * this far down, the left rail is a screen away.
 */
export function V5RightRail({
  query,
  onQueryChange,
  onNavigate,
}: {
  query: string;
  onQueryChange: (value: string) => void;
  onNavigate: (id: string) => void;
}) {
  const visibleProjects = projects.filter((project) =>
    matchesQuery(project, query),
  );

  return (
    <aside className="v5-rail v5-rail--right" aria-label="Search and highlights">
      {/*
        The search input.

        It filters the Projects tab rather than filtering this column, which is
        why it lives here and why typing in it does not visibly change anything
        beside it: the results are in the centre column, and the reader who typed
        a term wants to go and look at them. `onNavigate("projects")` on a
        non-empty query is what makes that happen without a second control.
      */}
      <div className="v5-search" role="search">
        <Search className="size-4 shrink-0" aria-hidden="true" />
        <label htmlFor="v5-search" className="sr-only">
          Search projects
        </label>
        <input
          id="v5-search"
          type="search"
          value={query}
          onChange={(event) => {
            onQueryChange(event.target.value);
            if (event.target.value) onNavigate("projects");
          }}
          placeholder="Search projects"
          className="v5-search-input"
        />
      </div>

      <section className="v5-rail-card" aria-labelledby="v5-top-tech">
        <h2 id="v5-top-tech" className="v5-rail-title">
          Top Tech
        </h2>
        <ul className="flex flex-wrap gap-1.5">
          {topTech.slice(0, TOP_TECH_COUNT).map((name) => (
            <li key={name}>
              <button
                type="button"
                className="v5-chip"
                onClick={() => onNavigate("tech-stack")}
              >
                {name}
              </button>
            </li>
          ))}
        </ul>
        <button
          type="button"
          className="v5-rail-link mt-3 inline-block"
          onClick={() => onNavigate("tech-stack")}
        >
          The whole stack →
        </button>
      </section>

      <section className="v5-rail-card" aria-labelledby="v5-featured">
        <h2 id="v5-featured" className="v5-rail-title">
          Featured Projects
        </h2>

        {visibleProjects.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nothing matches “{query}”.
          </p>
        ) : (
          <ul>
            {visibleProjects.slice(0, featuredProjects.length).map((project) => (
              <FeaturedRow
                key={project.slug}
                project={project}
                onView={() => onNavigate("projects")}
              />
            ))}
          </ul>
        )}
      </section>

      <footer className="px-1 pb-2 pt-2">
        <ul className="flex flex-wrap gap-x-3 gap-y-1">
          {railLinks.map((link) => (
            <li key={link.section}>
              <button
                type="button"
                className="v5-rail-link"
                onClick={() => onNavigate(link.section)}
              >
                {tabLabel(link.section)}
              </button>
            </li>
          ))}
        </ul>

        <div className="mt-3 flex items-center gap-2">
          <div className="v5-avatar v5-avatar--xs">
            <Image src={V5_AVATAR} alt="" width={36} height={36} draggable={false} />
          </div>
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Emmanuel Bitancor
          </p>
        </div>


      </footer>
    </aside>
  );
}

/**
 * One featured project: thumbnail, title, and a "View" button.
 *
 * "View" switches to the Projects tab rather than opening the project. It could
 * link straight to `/projects/<slug>` - that route exists - but then the reader
 * leaves the profile to read a case study, which is a different kind of page,
 * and the button says "View" rather than "Case study". Switching tabs keeps them
 * on the profile and puts the whole set in front of them, which is what a
 * sidebar list is for.
 */
function FeaturedRow({
  project,
  onView,
}: {
  project: Project;
  onView: () => void;
}) {
  return (
    <li className="v5-featured-row">
      <div className="flex min-w-0 items-center gap-2.5">
        <div className="v5-avatar v5-avatar--xs shrink-0 overflow-hidden">
          <Image
            src={project.image}
            alt=""
            width={36}
            height={36}
            draggable={false}
            className="size-full object-cover"
          />
        </div>
        <p className="truncate text-sm font-semibold">{project.title}</p>
      </div>
      <button type="button" className="v5-btn v5-btn--quiet v5-btn--sm" onClick={onView}>
        View
      </button>
    </li>
  );
}

/**
 * The search predicate.
 *
 * Title, description, role and tags, lower-cased once per field per keystroke.
 * It is a `includes` rather than a tokenised match on purpose: with ten projects
 * and short descriptions, a substring is enough to be useful and does not need
 * explaining, where "all these words, any order" would either surprise someone or
 * need a second control to widen it.
 */
function matchesQuery(project: Project, query: string) {
  const needle = query.trim().toLowerCase();
  if (!needle) return true;

  return [project.title, project.description, project.role, ...project.tags]
    .join(" ")
    .toLowerCase()
    .includes(needle);
}