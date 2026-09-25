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
import ProjectModal from "../components/ProjectModal";
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
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card/90 shadow-sm backdrop-blur transition-shadow hover:shadow-xl dark:bg-zinc-900/90 dark:hover:shadow-2xl dark:hover:shadow-zinc-950"
    >
      <div className="relative h-48 overflow-hidden bg-zinc-100 sm:h-52 dark:bg-zinc-800">
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
            className="object-cover transition-transform duration-500 group-hover:scale-105"
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
          <Badge variant="muted" className="text-[10px] uppercase tracking-wide">
            {project.category}
          </Badge>
          <span className="truncate text-right text-[10px] text-muted-foreground">
            {project.role}
          </span>
        </div>
        <h3 className="text-lg font-bold tracking-tight sm:text-xl">{project.title}</h3>
        <p className="mt-3 line-clamp-2 text-sm leading-6 text-muted-foreground">
          {project.description}
        </p>

        <div className="mt-auto flex flex-wrap gap-1.5 pt-5">
          {project.tags.slice(0, 3).map((tag) => (
            <Badge key={tag} variant="outline" className="px-2.5 py-1 text-[11px] font-medium">
              {tag}
            </Badge>
          ))}
          {project.tags.length > 3 && (
            <span className="self-center px-1 text-[11px] text-muted-foreground">
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
  const [activeFilter, setActiveFilter] = useState<ProjectCategory>("All");
  const [showAll, setShowAll] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

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

  const handleOpenModal = (project: Project) => {
    setSelectedProject(project);
    setIsModalOpen(true);
  };

  const handleFilterChange = (filter: ProjectCategory) => {
    setActiveFilter(filter);
    setShowAll(false);
  };

  return (
    <section
      id="projects"
      className="w-full border-y border-zinc-200/70 bg-zinc-50/50 px-4 py-20 transition-colors duration-300 md:px-6 md:py-24 dark:border-zinc-800/70 dark:bg-zinc-950/20"
    >
      <div className="container mx-auto max-w-6xl">
        <motion.div
          className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_260px] lg:items-end"
          initial={{ opacity: 0, y: -12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.45 }}
        >
          <div>
            <Badge
              variant="outline"
              className="bg-background/70 px-3 py-1 font-mono text-xs backdrop-blur"
            >
              <Layers3 className="size-3.5" aria-hidden="true" />
              Selected work
            </Badge>
            <h2 className="mt-5 text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
              Things I&apos;ve built
            </h2>
            <p className="mt-4 max-w-2xl text-base leading-7 text-zinc-500 md:text-xl dark:text-zinc-400">
              Product work spanning research platforms, commerce, productivity tools
              and interactive web experiences.
            </p>
          </div>
        </motion.div>

        <div className="mt-10 flex flex-col gap-4 border-y border-border/70 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold">Filters</p>
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
                  className="shrink-0 rounded-full"
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
              className="group mt-8 grid overflow-hidden rounded-3xl border border-border bg-card/90 shadow-sm backdrop-blur lg:grid-cols-[1.08fr_0.92fr]"
            >
              <div className="relative min-h-[280px] overflow-hidden bg-zinc-100 sm:min-h-[360px] dark:bg-zinc-800">
                <button
                  type="button"
                  onClick={() => handleOpenModal(featuredProject)}
                  className="absolute inset-0 h-full w-full cursor-zoom-in text-left"
                  aria-label={`Open quick details for ${featuredProject.title}`}
                >
                  <Image
                    src={featuredProject.image}
                    alt={`${featuredProject.title} project preview`}
                    fill
                    priority
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                    sizes="(max-width: 1023px) 100vw, 55vw"
                  />
                  <span className="absolute inset-0 bg-gradient-to-t from-zinc-950/55 via-zinc-950/5 to-transparent" />
                </button>
                <div className="pointer-events-none absolute left-5 top-5 flex items-center gap-2">
                  <Badge className="border-white/20 bg-zinc-950/55 text-white backdrop-blur">
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
                  <span className="rounded-full border border-white/20 bg-black/20 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.14em] backdrop-blur">
                    {featuredProject.category}
                  </span>
                </div>
              </div>

              <CardContent className="flex flex-col p-6 pt-6 sm:p-8 sm:pt-8">
                <div className="flex items-center justify-between gap-3">
                  <Badge variant="muted" className="w-fit text-[10px] uppercase tracking-wide">
                    {featuredProject.category}
                  </Badge>
                  <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                    01 / Featured
                  </span>
                </div>
                <h3 className="mt-5 text-3xl font-bold tracking-tight sm:text-4xl">
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
                    onClick={() => handleOpenModal(featuredProject)}
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
                    <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                      Project index
                    </p>
                    <h3 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
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
                        onOpen={handleOpenModal}
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
      </div>

      <ProjectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        project={selectedProject}
      />
    </section>
  );
}
