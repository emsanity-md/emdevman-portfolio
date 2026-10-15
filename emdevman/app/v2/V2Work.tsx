import { ProjectCard } from "./components/ProjectCard";
import { ProjectRowList } from "./components/ProjectRow";
import { Section } from "./components/Section";
import { featuredProjects, projects } from "@/app/lib/data";

/**
 * Selected work: four cards, then the rest as a list.
 *
 * Two levels on purpose. The four are the ones worth reading about and they get
 * a card each; the other six are worth knowing exist and get a line. Rendering
 * all ten as cards would make the four indistinguishable, and rendering the four
 * as a list would waste the only thing this page has that a resume does not.
 *
 * The year column on the list is conditional on the data. Every `year` in
 * `lib/data.ts` is still a TODO, and a column of em dashes reads as a fault
 * rather than as missing information.
 *
 * No filter. The old section put a row of category pills above the grid, which
 * meant hiding work behind a control on a page whose entire argument is that
 * there is ten of it and all of it fits. The kinds on each card carry the same
 * information as labels.
 */
export function V2Work() {
  const featured = new Set(featuredProjects.map((project) => project.slug));
  const rest = projects.filter((project) => !featured.has(project.slug));
  const showYears = rest.some((project) => Boolean(project.year));

  return (
    <Section id="projects" eyebrow="Selected work" title="Four things worth reading about.">
      <div className="grid gap-5 md:grid-cols-2">
        {featuredProjects.map((project) => (
          <ProjectCard key={project.slug} project={project} />
        ))}
      </div>

      <ProjectRowList projects={rest} showYears={showYears} className="mt-6" />
    </Section>
  );
}