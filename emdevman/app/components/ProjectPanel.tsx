"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Github, LockKeyhole, X } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

import type { Project } from "@/app/lib/data";

interface ProjectPanelProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project | null;
}

/**
 * v3's project quick view: a single `max-w-sm` panel on a blurred scrim, built
 * from the same primitives as the reference's own modals.
 *
 * Anatomy, top to bottom: a mono eyebrow, a pixel title, a 14px description, a
 * 48px thumbnail, then the links as full-width bordered rows with the handle
 * right-aligned in mono. The "case study" row is the filled one, so the
 * destination that continues the story is the obvious tap.
 *
 * A deliberately different component from V2's ProjectModal, which is a
 * wide image-beside-detail split sized for reading a whole project.
 */
export default function ProjectPanel({ isOpen, onClose, project }: ProjectPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (!isOpen || !project) return;

    const previousFocus =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    panelRef.current?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus();
    };
  }, [isOpen, project]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!project) return null;

  const titleId = `v3-panel-title-${project.slug}`;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[110] flex items-center justify-center bg-[var(--overlay-backdrop)] p-5 backdrop-blur-md"
          initial={reduceMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) onClose();
          }}
        >
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            tabIndex={-1}
            initial={reduceMotion ? false : { opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="surface-panel relative w-full max-w-sm rounded-2xl border border-border bg-card p-7 outline-none"
          >
            <button
              type="button"
              onClick={onClose}
              className="absolute right-4 top-4 text-muted-foreground transition-colors hover:text-foreground"
              aria-label="Close"
            >
              <X className="size-4" aria-hidden="true" />
            </button>

            <p className="font-mono text-[11px] uppercase tracking-wider text-faint">
              {project.category}
            </p>
            <h2 id={titleId} className="display-pixel mt-3 text-xl leading-none text-foreground">
              {project.title}
            </h2>
            <p className="mt-3 text-[14px] leading-relaxed text-muted-foreground">
              {project.description}
            </p>

            <div className="mt-5 flex items-center gap-3.5">
              <Image
                src={project.image}
                alt=""
                width={48}
                height={48}
                className="h-12 w-12 shrink-0 rounded-xl border border-border object-cover"
              />
              <p className="text-[13px] leading-snug text-muted-foreground">{project.role}</p>
            </div>

            <div className="mt-5 space-y-2">
              <Link
                href={`/projects/${project.slug}`}
                className="group flex items-center justify-between gap-3 rounded-lg border border-foreground bg-foreground px-3.5 py-2.5 text-background transition-opacity hover:opacity-90"
              >
                <span className="text-[14px] font-medium">Read the case study</span>
                <ArrowUpRight
                  className="size-4 shrink-0 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                  aria-hidden="true"
                />
              </Link>

              <a
                href={project.demo}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center justify-between gap-3 rounded-lg border border-border px-3.5 py-2.5 transition-colors hover:border-foreground"
              >
                <span className="text-[14px] font-medium text-foreground">Live demo</span>
                <span className="flex items-center gap-1.5 font-mono text-[12px] text-faint">
                  open
                  <ArrowUpRight className="size-3.5" aria-hidden="true" />
                </span>
              </a>

              {project.github ? (
                <a
                  href={project.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center justify-between gap-3 rounded-lg border border-border px-3.5 py-2.5 transition-colors hover:border-foreground"
                >
                  <span className="flex items-center gap-2 text-[14px] font-medium text-foreground">
                    <Github className="size-4" aria-hidden="true" />
                    Source
                  </span>
                  <span className="flex items-center gap-1.5 font-mono text-[12px] text-faint">
                    github
                    <ArrowUpRight className="size-3.5" aria-hidden="true" />
                  </span>
                </a>
              ) : (
                <Link
                  href={`/error/private?project=${encodeURIComponent(project.title)}`}
                  className="group flex items-center justify-between gap-3 rounded-lg border border-border px-3.5 py-2.5 transition-colors hover:border-foreground"
                >
                  <span className="flex items-center gap-2 text-[14px] font-medium text-foreground">
                    <LockKeyhole className="size-4" aria-hidden="true" />
                    Source
                  </span>
                  <span className="font-mono text-[12px] uppercase tracking-wider text-faint">
                    private
                  </span>
                </Link>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
