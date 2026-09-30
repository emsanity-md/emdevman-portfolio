"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowUpRight,
  ChevronDown,
  ExternalLink,
  Github,
  Layers3,
  LockKeyhole,
  Maximize2,
} from "lucide-react";

import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import { CardContent } from "@/app/components/ui/card";
import { Section } from "@/app/components/ui/Section";
import ProjectModal from "../components/ProjectModal";
import ProjectPanel from "../components/ProjectPanel";
import { V3ProjectsBody } from "./V3Projects";
import { useDesign } from "@/app/context/DesignProvider";
import {
  projectCategories,
  projects,
  type Project,
  type ProjectCategory,
} from "../lib/data";

function formatProjectIndex(index: number) {
  return String(index + 1).padStart(2, "0");
}

function ProjectSourceButton({ project }: { project: Project }) {
  if (project.github) {
    return (
      <Button asChild variant="ghost" size="icon" className="rounded-full">
        <a
          href={project.github}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`View ${project.title} source code`}
        >
          <Github className="size-4" aria-hidden="true" />
        </a>
      </Button>
    );
  }

  return (
    <Button asChild variant="ghost" size="icon" className="rounded-full">
      <Link
        href={`/error/private?project=${encodeURIComponent(project.title)}`}
        aria-label={`Request source access for ${project.title}`}
      >
        <LockKeyhole className="size-4" aria-hidden="true" />
      </Link>
    </Button>
  );
}

function ProjectCard({
  project,
  index,
  onOpen,
}: {
  project: Project;
  index: number;
  onOpen: (project: Project) => void;
}) {
  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.28, delay: Math.min(index * 0.04, 0.16) }}
      className="project-card panel panel--hover group flex h-full flex-col overflow-hidden border border-border"
    >
      <div className="project-well relative h-48 overflow-hidden bg-muted sm:h-52">
        <button
          type="button"
          onClick={() => onOpen(project)}
          className="absolute inset-0 h-full w-full cursor-zoom-in text-left"
          aria-label={`Open quick details for ${project.title}`}
        >
          <Image
            src={project.image}
            alt={`${project.title} project preview`}
            fill
            className="zoomable object-cover"
            sizes="(max-width: 767px) 100vw, (max-width: 1279px) 50vw, 33vw"
          />
          <span className="absolute inset-0 bg-gradient-to-t from-zinc-950/35 via-transparent to-transparent opacity-70 transition-opacity group-hover:opacity-100" />
        </button>
        <span className="pointer-events-none absolute left-4 top-4 font-mono text-xs font-medium tracking-[0.18em] text-white drop-shadow-md">
          {formatProjectIndex(index)}
        </span>
        <Button
          type="button"
          variant="secondary"
          size="icon"
          onClick={() => onOpen(project)}
          className="absolute bottom-3 right-3 rounded-full bg-background/85 text-foreground opacity-0 shadow-lg backdrop-blur transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
          aria-label={`View quick details for ${project.title}`}
        >
          <Maximize2 className="size-4" aria-hidden="true" />
        </Button>
      </div>

      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <div className="mb-3 flex items-center justify-between gap-3">
          <span className="tag">{project.category}</span>
          <span className="truncate text-right text-micro text-muted-foreground">
            {project.role}
          </span>
        </div>
        <h3 className="text-xl font-bold tracking-tight sm:text-heading">{project.title}</h3>
        <p className="mt-3 line-clamp-2 text-sm leading-6 text-muted-foreground">
          {project.description}
        </p>

        <div className="mt-auto flex flex-wrap gap-1.5 pt-5">
          {project.tags.slice(0, 3).map((tag) => (
            <span key={tag} className="tag">
              {tag}
            </span>
          ))}
          {project.tags.length > 3 && (
            <span className="self-center px-1 text-micro text-muted-foreground">
              +{project.tags.length - 3}
            </span>
          )}
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-border/70 pt-3">
          <Button
            type="button"
            variant="link"
            size="sm"
            onClick={() => onOpen(project)}
            className="h-auto p-0 text-xs"
          >
            Quick view
            <ArrowUpRight aria-hidden="true" />
          </Button>
          <ProjectSourceButton project={project} />
        </div>
      </div>
    </motion.article>
  );
}

export default function Projects() {
  const { design } = useDesign();

  /*
    Both section bodies ship; CSS picks one.

    Not a `useDesign()` branch for the body. That returns the server snapshot
    during hydration, so a v2 visitor would be served v3 *markup* while the
    pre-paint script had already put V2 *tokens* on <html>. The modal below
    can still branch in JS - it renders nothing until the visitor opens it,
    which can only happen after hydration.
  */
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleOpen = (project: Project) => {
    setSelectedProject(project);
    setIsModalOpen(true);
  };

  return (
    <>
      <Section
        id="projects"
        index="03"
        eyebrow="projects"
        action={{ label: "case studies", href: "/#projects" }}
        both
        wide
        reveal
        icon={<Layers3 className="section-badge-icon text-accent-a" aria-hidden="true" />}
        title="Things I&apos;ve built"
        description="Product work spanning research platforms, commerce, productivity tools and interactive web experiences."
      >
        <div className="v3-only">
          <V3ProjectsBody onOpen={handleOpen} />
        </div>
        <div className="v2-only">
          <V2ProjectsBody onOpen={handleOpen} />
        </div>
      </Section>

      {design === "v3" ? (
        <ProjectPanel
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          project={selectedProject}
        />
      ) : (
        <ProjectModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          project={selectedProject}
        />
      )}
    </>
  );
}

function V2ProjectsBody({ onOpen }: { onOpen: (project: Project) => void }) {
  const [activeFilter, setActiveFilter] = useState<ProjectCategory>("All");
  const [showAll, setShowAll] = useState(false);

  const filteredProjects = useMemo(
    () =>
      activeFilter === "All"
        ? projects
        : projects.filter((project) => project.category === activeFilter),
    [activeFilter],
  );
  const visibleProjects = showAll ? filteredProjects : filteredProjects.slice(0, 4);
  const featuredProject = visibleProjects[0];
  const secondaryProjects = visibleProjects.slice(1);

  const handleFilterChange = (filter: ProjectCategory) => {
    setActiveFilter(filter);
    setShowAll(false);
  };

  return (
    <>
        <div className="mt-10 flex flex-col gap-4 border-y border-border/70 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="project-filters-label eyebrow">Filters</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Showing {filteredProjects.length} {filteredProjects.length === 1 ? "project" : "projects"}
            </p>
          </div>
          <div
            className="flex max-w-full gap-2 overflow-x-auto pb-1"
            role="group"
            aria-label="Filter projects by category"
          >
            {projectCategories.map((category) => {
              const count =
                category === "All"
                  ? projects.length
                  : projects.filter((project) => project.category === category).length;
              const isActive = activeFilter === category;

              return (
                <Button
                  key={category}
                  type="button"
                  variant={isActive ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleFilterChange(category)}
                  className="filter-pill shrink-0 rounded-full"
                  aria-pressed={isActive}
                >
                  {category} <span className="ml-1 opacity-60">{count}</span>
                </Button>
              );
            })}
          </div>
        </div>

        {featuredProject ? (
          <>
            <motion.article
              layout
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.4 }}
              className="project-featured panel group mt-8 grid overflow-hidden border border-border lg:grid-cols-[1.08fr_0.92fr]"
            >
              <div className="project-well relative min-h-[280px] overflow-hidden bg-muted sm:min-h-[360px]">
                <button
                  type="button"
                  onClick={() => onOpen(featuredProject)}
                  className="absolute inset-0 h-full w-full cursor-zoom-in text-left"
                  aria-label={`Open quick details for ${featuredProject.title}`}
                >
                  <Image
                    src={featuredProject.image}
                    alt={`${featuredProject.title} project preview`}
                    fill
                    priority
                    className="zoomable object-cover"
                    sizes="(max-width: 1023px) 100vw, 55vw"
                  />
                  <span className="absolute inset-0 bg-gradient-to-t from-zinc-950/55 via-zinc-950/5 to-transparent" />
                </button>
                <div className="pointer-events-none absolute left-5 top-5 flex items-center gap-2">
                  <Badge className="project-featured-badge border-white/20 bg-zinc-950/55 text-white backdrop-blur">
                    Featured project
                  </Badge>
                  <span className="font-mono text-xs text-white/75">
                    {formatProjectIndex(0)} / {String(filteredProjects.length).padStart(2, "0")}
                  </span>
                </div>
                <div className="pointer-events-none absolute bottom-5 left-5 right-5 flex items-end justify-between gap-4 text-white">
                  <p className="max-w-xs text-sm leading-6 text-white/80">
                    {featuredProject.role}
                  </p>
                  <span className="project-category-chip rounded-full border border-white/20 bg-black/20 px-3 py-1.5 eyebrow backdrop-blur">
                    {featuredProject.category}
                  </span>
                </div>
              </div>

              <CardContent className="flex flex-col p-6 pt-6 sm:p-8 sm:pt-8">
                <div className="flex items-center justify-between gap-3">
                  <Badge variant="muted" className="w-fit text-micro uppercase tracking-wide">
                    {featuredProject.category}
                  </Badge>
                  <span className="eyebrow text-muted-foreground">
                    01 / Featured
                  </span>
                </div>
                <h3 className="mt-5 text-2xl font-bold tracking-tight sm:text-3xl">
                  {featuredProject.title}
                </h3>
                <p className="mt-4 text-base leading-7 text-muted-foreground">
                  {featuredProject.description}
                </p>
                <div className="mt-5 flex flex-wrap gap-1.5">
                  {featuredProject.tags.map((tag) => (
                    <Badge key={tag} variant="outline" className="px-2.5 py-1 text-xs font-medium">
                      {tag}
                    </Badge>
                  ))}
                </div>

                <div className="mt-auto flex flex-col gap-3 border-t border-border/70 pt-6 sm:flex-row sm:items-center">
                  <Button asChild className="rounded-full">
                    <Link href={`/projects/${featuredProject.slug}`}>
                      Read case study
                      <ArrowUpRight aria-hidden="true" />
                    </Link>
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-full"
                    onClick={() => onOpen(featuredProject)}
                  >
                    Quick view
                    <Maximize2 aria-hidden="true" />
                  </Button>
                  <div className="flex items-center gap-1 sm:ml-auto">
                    <Button asChild variant="ghost" size="icon" className="rounded-full">
                      <a
                        href={featuredProject.demo}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`Open ${featuredProject.title} live demo`}
                      >
                        <ExternalLink aria-hidden="true" />
                      </a>
                    </Button>
                    <ProjectSourceButton project={featuredProject} />
                  </div>
                </div>
              </CardContent>
            </motion.article>

            {secondaryProjects.length > 0 && (
              <>
                <div className="mt-14 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="eyebrow text-muted-foreground">
                      Project index
                    </p>
                    <h3 className="mt-2 text-xl font-bold tracking-tight sm:text-2xl">
                      More experiments and tools
                    </h3>
                  </div>
                  <p className="font-mono text-xs text-muted-foreground">
                    {String(secondaryProjects.length).padStart(2, "0")} additional projects
                  </p>
                </div>

                <motion.div layout className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  <AnimatePresence mode="popLayout">
                    {secondaryProjects.map((project, index) => (
                      <ProjectCard
                        key={project.slug}
                        project={project}
                        index={index + 1}
                        onOpen={onOpen}
                      />
                    ))}
                  </AnimatePresence>
                </motion.div>
              </>
            )}
          </>
        ) : (
          <div className="mt-8 rounded-2xl border border-dashed border-border bg-muted/30 p-10 text-center text-sm text-muted-foreground">
            No projects match this filter yet.
          </div>
        )}

        {filteredProjects.length > 4 && (
          <div className="mt-10 flex justify-center">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowAll((visible) => !visible)}
              className="group h-11 rounded-full bg-background/90 px-5 backdrop-blur"
              aria-expanded={showAll}
            >
              {showAll ? "Show fewer projects" : `View all ${filteredProjects.length} projects`}
              <ChevronDown
                className={`size-4 transition-transform ${showAll ? "rotate-180" : ""}`}
                aria-hidden="true"
              />
            </Button>
          </div>
        )}
    </>
  );
}
