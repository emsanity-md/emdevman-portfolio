"use client";

import { useState } from "react";
import { Layers3 } from "lucide-react";

import { Section } from "@/app/components/ui/Section";
import ProjectPanel from "../components/ProjectPanel";
import { V3ProjectsBody } from "./V3Projects";
import { type Project } from "@/app/lib/data";

/**
 * v3's projects section.
 *
 * This file used to hold two complete bodies behind a `.v3-only` /
 * `.v2-only` pair. The v2 body is gone: a filter row of category pills, one
 * large featured card, a second grid of the remaining projects under a "Project
 * index" heading, and a "View all N projects" button to reveal the rest of a
 * grid that was already showing the rest. Two ways to reach the same projects on
 * one page, which is the thing the v2 redesign set out to remove.
 *
 * What is left is the v3 deck and the panel it opens, both unchanged.
 */
export default function Projects() {
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
        wide
        reveal
        icon={<Layers3 className="section-badge-icon text-accent-a" aria-hidden="true" />}
        title="Things I&apos;ve built"
        description="Product work spanning research platforms, commerce, productivity tools and interactive web experiences."
      >
        <V3ProjectsBody onOpen={handleOpen} />
      </Section>

      <ProjectPanel
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        project={selectedProject}
      />
    </>
  );
}