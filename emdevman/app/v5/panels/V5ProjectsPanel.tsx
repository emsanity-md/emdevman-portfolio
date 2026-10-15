"use client";

import Image from "next/image";
import { useState } from "react";
import { ArrowUpRight, Github, MessageCircle } from "lucide-react";

import ProjectModal from "@/app/components/ProjectModal";
import { projects, type Project } from "@/app/lib/data";
import { V5Post } from "../V5Post";

/**
 * One project, as a post.
 *
 * This is the body of every project on the page - the featured four on Home and
 * all ten on Projects - rather than one component each. A post card and a project
 * card are the same thing here: an avatar, a byline, a description, a thumbnail,
 * a row of chips, and two small outbound buttons. Writing them twice would mean a
 * project looking different on Home than it does on Projects, which is the exact
 * failure the shared `lib/data.ts` exists to prevent everywhere else in the repo.
 *
 * The quick view is the shared `ProjectModal`, imported whole, so pressing a
 * title opens the same dialog it opens under v1, v2 and v3 rather than being a
 * fifth implementation of it.
 */
export function ProjectPost({ project }: { project: Project }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <V5Post
        meta={
          <span className="v5-chip v5-chip--accent ml-1.5">{project.category}</span>
        }
        actions={
          <>
            <button
              type="button"
              className="v5-action"
              onClick={() => setOpen(true)}
            >
              <MessageCircle className="v5-action-icon" aria-hidden="true" />
              Quick view
            </button>

            <a
              className="v5-action-btn"
              href={project.demo}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${project.title} live site`}
              title="Live site"
            >
              <ArrowUpRight className="size-3.5" aria-hidden="true" />
            </a>

            {project.github ? (
              <a
                className="v5-action-btn"
                href={project.github}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${project.title} source on GitHub`}
                title="Source"
              >
                <Github className="size-3.5" aria-hidden="true" />
              </a>
            ) : null}

            {/*
              A private repository gets no control at all. This used to be a
              lock icon linking to `/error/private`, which tells the reader the
              source is closed and then asks them to email - a button that
              looked like an action and was a dead end. The title below opens the
              same dialog the other designs do, and that is the real answer.
            */}
          </>
        }
      >
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="text-left text-[17px] font-bold hover:underline"
        >
          {project.title}
        </button>

        <p className="text-muted-foreground">{project.role}</p>
        <p>{project.description}</p>

        <div className="v5-media">
          <Image
            src={project.image}
            alt={`Screenshot of ${project.title}`}
            width={1200}
            height={630}
            loading="lazy"
            className="object-cover"
          />
        </div>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {project.tags.map((tag) => (
            <span key={tag} className="v5-chip">
              {tag}
            </span>
          ))}
        </div>
      </V5Post>

      <ProjectModal
        isOpen={open}
        project={project}
        onClose={() => setOpen(false)}
      />
    </>
  );
}

/**
 * The Projects tab.
 *
 * All of them, in `lib/data.ts`'s order - which is the order every other design
 * renders them in and the order they were added. There is no category filter
 * here: the brief puts search in the right rail and six tabs in the centre, and a
 * second filtering control inside the feed would be a third way to reach the same
 * ten items.
 *
 * Filtering is a `useMemo` over the array rather than stateful filtering, so
 * typing in the right rail's search re-renders the feed from the same source of
 * truth the rail itself reads - one query, one predicate, one list.
 */
export function V5ProjectsPanel({
  query,
  onQueryChange,
}: {
  query: string;
  onQueryChange: (value: string) => void;
}) {
  const needle = query.trim().toLowerCase();
  const matching = needle
    ? projects.filter((project) => matchesQuery(project, needle))
    : projects;

  return (
    <>
      {matching.length === 0 ? (
        <div className="v5-post">
          <p className="text-sm text-muted-foreground">
            No projects match “{query.trim()}”.{" "}
            {/*
              A button rather than a link to the search box. The box is two
              columns away and it holds state the page owns, so an anchor would
              move the reader's eyes without clearing anything - and its fragment
              would become the URL, which on a reload reads as an unknown tab and
              drops them back on Home.
            */}
            <button
              type="button"
              className="v5-rail-link"
              onClick={() => onQueryChange("")}
            >
              Clear the search
            </button>
          </p>
        </div>
      ) : (
        matching.map((project) => (
          <ProjectPost key={project.slug} project={project} />
        ))
      )}
    </>
  );
}

/**
 * The search predicate, matching on title, description, role and tags.
 *
 * An `includes` rather than a tokenised match, on purpose: with ten projects and
 * short descriptions a substring is enough to be useful and needs no explaining,
 * where "all of these words, in any order" would either surprise someone or want
 * a second control to widen it.
 */
function matchesQuery(project: Project, query: string) {
  const needle = query.trim().toLowerCase();
  if (!needle) return true;

  return [project.title, project.description, project.role, ...project.tags]
    .join(" ")
    .toLowerCase()
    .includes(needle);
}