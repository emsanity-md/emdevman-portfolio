"use client";

import { useMemo, useState } from "react";

import { ProjectDeckCard } from "@/app/components/ProjectDeckCard";
import {
  projectCategories,
  projects,
  type Project,
  type ProjectCategory,
} from "@/app/lib/data";

interface V3ProjectsProps {
  onOpen: (project: Project) => void;
}

/**
 * v3's projects section: a three-card deck, the same interaction the reference
 * uses. One card centred at full size with its immediate neighbours rotated out
 * and dimmed; clicking a neighbour promotes it to centre and pushes the old
 * centre into that slot.
 *
 * The deck wraps. The reference always mounts exactly three cards and cycles,
 * so the first project's left neighbour is the last one - clamping at the ends
 * would leave the first and last projects sitting in a two-card deck.
 *
 * Only three cards are ever mounted, so a category with ten projects still costs
 * three cards of layout and paint.
 */
export function V3ProjectsBody({ onOpen }: V3ProjectsProps) {
  const [activeFilter, setActiveFilter] = useState<ProjectCategory>("All");
  const [center, setCenter] = useState(0);

  const filteredProjects = useMemo(
    () =>
      activeFilter === "All"
        ? projects
        : projects.filter((project) => project.category === activeFilter),
    [activeFilter],
  );

  const total = filteredProjects.length;

  // The index can outlive the filter: narrowing the list must not leave the deck
  // pointing past its end. Belt and braces - the filter handler resets to 0.
  const centerIndex = total === 0 ? 0 : Math.min(center, total - 1);

  /*
    Centre first, then the flanks - the same order the reference uses, so tab
    order reaches the live card before its neighbours. Stacking is unaffected
    because every slot sets its own z-index.
  */
  const cards = [
    { slot: "center" as const, offset: 0 },
    { slot: "left" as const, offset: -1 },
    { slot: "right" as const, offset: 1 },
  ]
    // With fewer than three projects there is nothing to wrap onto, and wrapping
    // would repeat a card. Keep only the in-range offsets, which is what an
    // unwrapped deck would show: centre alone at 1, centre + right at 2.
    .filter(({ offset }) => total >= 3 || (offset >= 0 && offset < total))
    .map(({ slot, offset }) => {
      // The double modulo keeps the index positive before it wraps.
      const index = (((centerIndex + offset) % total) + total) % total;
      return { slot, index, project: filteredProjects[index] };
    });

  const handleFilterChange = (next: ProjectCategory) => {
    setActiveFilter(next);
    setCenter(0);
  };

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <label
            htmlFor="project-category"
            className="font-mono text-[10px] uppercase tracking-wider text-faint"
          >
            Category
          </label>
          <select
            id="project-category"
            name="project-category"
            value={activeFilter}
            onChange={(event) => handleFilterChange(event.target.value as ProjectCategory)}
            className="v3-select font-mono text-[11px] uppercase tracking-wider"
          >
            {projectCategories.map((category) => {
              const count =
                category === "All"
                  ? projects.length
                  : projects.filter((project) => project.category === category).length;
              return (
                <option key={category} value={category}>
                  {category} ({count})
                </option>
              );
            })}
          </select>
        </div>

        <p className="font-mono text-[11px] uppercase tracking-wider text-faint">
          {filteredProjects.length} projects
        </p>
      </div>

      {filteredProjects.length === 0 ? (
        <p className="section-block text-[14px] text-muted-foreground">
          No projects in this category yet.
        </p>
      ) : (
        <div className="project-deck section-block" aria-label="Project deck">
          {cards.map(({ slot, index, project }) => (
            <ProjectDeckCard
              key={project.slug}
              project={project}
              index={index}
              total={filteredProjects.length}
              slot={slot}
              onPromote={() => setCenter(index)}
              onOpen={() => onOpen(project)}
            />
          ))}
        </div>
      )}

      {/* Mobile currently holds a single project, so the deck has no
          neighbours there and the instruction would be nonsense. */}
      {total > 1 && (
        <p className="section-note mx-auto max-w-[34rem] text-center text-[12px] text-faint text-balance">
          {total >= 3
            ? "Select a neighbouring card to bring it forward, or open the one in the middle."
            : "Select the card to bring it forward."}
        </p>
      )}
    </>
  );
}
