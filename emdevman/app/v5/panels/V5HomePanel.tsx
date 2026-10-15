"use client";

import { aboutBio, aboutFocus } from "@/app/lib/about";
import { heroIntro, heroTitleLines } from "@/app/lib/hero";
import { V5Post } from "../V5Post";
import { featuredProjects } from "../profile";
import { ProjectPost } from "./V5ProjectsPanel";

/**
 * Home: one pinned post, then the featured projects.
 *
 * The pinned post carries the hero's copy - the two-line headline v1 sets in
 * Newsreader and the paragraph under it - read from `lib/hero.ts` rather than
 * restated. A pinned post is the closest thing a profile page has to a hero, so
 * putting the actual hero words in it is what keeps them from being two different
 * introductions to the same person.
 *
 * No activity here, deliberately. Home is the profile and Activity is the
 * calendar; a feed that already carried the calendar would leave the Activity tab
 * nothing to be.
 */
export function V5HomePanel({ onNavigate }: { onNavigate: (id: string) => void }) {
  return (
    <>
      <V5Post pinned>
        <p className="text-[19px] font-extrabold leading-7">
          {heroTitleLines[0]}
          {/* The space collapses before the break and is there so the copied,
              selected and screen-reader text is "Prompt Stack Developer"
              rather than one word. Same fix as `V1Hero`. */}
          {" "}
          <br />
          {heroTitleLines[1]}
        </p>
        <p>
          {heroIntro.before} <strong>{heroIntro.strong}</strong>{" "}
          {heroIntro.after}
        </p>
        <p className="text-muted-foreground">{aboutFocus}</p>
        <p className="text-muted-foreground">{aboutBio}</p>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {heroTitleLines.map((line) => (
            <span key={line} className="v5-chip v5-chip--accent">
              {line}
            </span>
          ))}
        </div>
      </V5Post>

      {featuredProjects.map((project) => (
        <ProjectPost key={project.slug} project={project} />
      ))}

      {/*
        The rest of the work, as a closing note rather than as six more posts.

        Four featured projects is what the right rail promises and what a reader
        scrolling a feed will sit through; the others are one click away and the
        count is right here. Rendering all ten would make Home and Projects the
        same page under two names.
      */}
      <div className="v5-post">
        <button
          type="button"
          className="v5-rail-link"
          onClick={() => onNavigate("projects")}
        >
          See all projects →
        </button>
      </div>
    </>
  );
}