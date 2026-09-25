"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { ExternalLink, Github, LockKeyhole, X } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import type { Project } from "../lib/data";

interface ProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project | null;
}

export default function ProjectModal({ isOpen, onClose, project }: ProjectModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (!isOpen || !dialogRef.current || !project) return;

    const dialog = dialogRef.current;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    if (!dialog.open) dialog.showModal();

    return () => {
      document.body.style.overflow = previousOverflow;
      if (dialog.open) dialog.close();
      previousFocus?.focus();
    };
  }, [isOpen, project]);

  if (!project) return null;

  const privateAccessHref = `/error/private?project=${encodeURIComponent(project.title)}`;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.dialog
          ref={dialogRef}
          aria-labelledby={`project-modal-title-${project.slug}`}
          aria-describedby={`project-modal-description-${project.slug}`}
          initial={reduceMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onCancel={(event) => {
            event.preventDefault();
            onClose();
          }}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) onClose();
          }}
          className="fixed inset-0 m-0 h-[100dvh] max-h-none w-full max-w-none border-0 bg-transparent p-2 text-left backdrop:bg-zinc-950/70 backdrop:backdrop-blur-sm sm:p-6"
        >
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, scale: 0.98, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 12 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="relative mx-auto flex h-[calc(100dvh-1rem)] w-full max-w-5xl flex-col overflow-y-auto rounded-2xl bg-white shadow-2xl dark:bg-zinc-900 sm:h-auto sm:max-h-[calc(100dvh-3rem)] md:flex-row md:overflow-hidden"
          >
            <Button
              type="button"
              variant="secondary"
              size="icon"
              onClick={onClose}
              className="absolute right-3 top-3 z-30 rounded-full bg-background/90 text-foreground shadow-sm backdrop-blur"
              aria-label="Close project details"
            >
              <X className="size-5" aria-hidden="true" />
            </Button>

            <div className="project-modal-image relative w-full shrink-0 overflow-hidden bg-zinc-100 dark:bg-zinc-800 md:h-auto md:w-1/2">
              <Image
                src={project.image}
                alt={`${project.title} project preview`}
                fill
                className="object-contain"
                sizes="(max-width: 767px) 100vw, 50vw"
              />
            </div>

            <div className="relative z-10 flex min-h-0 w-full flex-col bg-white dark:bg-zinc-900 md:w-1/2 md:flex-1">
              <div className="shrink-0 px-5 pb-4 pt-14 sm:px-6 sm:pb-5 sm:pt-14 md:px-8 md:pb-0 md:pt-8">
                <div className="mb-3 flex flex-wrap items-center gap-2 font-mono text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                  <Badge variant="muted" className="px-2.5 py-1 text-[10px] uppercase tracking-wide">
                    {project.category}
                  </Badge>
                  <span>{project.role}</span>
                </div>
                <h2
                  id={`project-modal-title-${project.slug}`}
                  className="pr-10 text-2xl font-bold tracking-tight text-zinc-900 md:text-3xl dark:text-zinc-50"
                >
                  {project.title}
                </h2>
                <div className="mt-4 flex flex-wrap gap-2">
                  {project.tags.map((tag) => (
                    <Badge key={tag} variant="outline" className="px-2.5 py-1 text-xs font-medium">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4 sm:px-6 md:px-8">
                <p
                  id={`project-modal-description-${project.slug}`}
                  className="text-base leading-7 text-zinc-600 dark:text-zinc-400"
                >
                  {project.description}
                </p>
              </div>

              <div className="project-modal-footer grid shrink-0 gap-2 border-t border-zinc-100 bg-white p-4 sm:grid-cols-2 md:grid-cols-3 md:p-5 dark:border-zinc-800 dark:bg-zinc-900">
                <Button asChild className="min-h-11 rounded-xl">
                  <Link href={`/projects/${project.slug}`}>Read case study</Link>
                </Button>
                <Button asChild variant="outline" className="min-h-11 rounded-xl">
                  <a href={project.demo} target="_blank" rel="noopener noreferrer">
                    <ExternalLink aria-hidden="true" />
                    Live demo
                  </a>
                </Button>
                {project.github ? (
                  <Button
                    asChild
                    variant="outline"
                    className="min-h-11 rounded-xl sm:col-span-2 md:col-span-1"
                  >
                    <a href={project.github} target="_blank" rel="noopener noreferrer">
                      <Github aria-hidden="true" />
                      View source code
                    </a>
                  </Button>
                ) : (
                  <Button
                    asChild
                    variant="outline"
                    className="min-h-11 rounded-xl sm:col-span-2 md:col-span-1"
                  >
                    <Link href={privateAccessHref}>
                      <LockKeyhole aria-hidden="true" />
                      Request access
                    </Link>
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        </motion.dialog>
      )}
    </AnimatePresence>
  );
}
