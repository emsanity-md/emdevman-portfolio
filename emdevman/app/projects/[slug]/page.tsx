import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowUpRight, ExternalLink, Github, LockKeyhole } from "lucide-react";

import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import { Card } from "@/app/components/ui/card";
import { getProjectBySlug, projects } from "../../lib/data";
import { CaseStudyGate } from "./CaseStudyGate";

interface ProjectPageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return projects.map((project) => ({ slug: project.slug }));
}

export async function generateMetadata({ params }: ProjectPageProps): Promise<Metadata> {
  const { slug } = await params;
  const project = getProjectBySlug(slug);

  if (!project) return {};

  return {
    title: project.title,
    description: project.description,
    alternates: {
      canonical: `/projects/${project.slug}`,
    },
  };
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { slug } = await params;
  const project = getProjectBySlug(slug);

  if (!project) notFound();

  return (
    <>
      <CaseStudyGate />

      <article className="case-page min-h-screen px-4 pb-20 pt-28 md:px-6 md:pb-28 md:pt-36">
        <div className="case-inner mx-auto w-full max-w-5xl">
          <V3CaseStudy project={project} />
          <V2CaseStudy project={project} />
        </div>
      </article>
    </>
  );
}

type Project = NonNullable<ReturnType<typeof getProjectBySlug>>;

/**
 * v3's case study.
 *
 * Gated with the CSS-only `.v3-only` / `.v2-only` pair rather than a design
 * branch in JS. This route is a server component, so the gates keep the page
 * static and ship no design-switching code to the browser.
 *
 * The previous version repeated the description twice - once as the lede and
 * again as the opening of "Project overview" - and followed it with a paragraph
 * of generic filler. Both are gone: the lede is the description, once, and the
 * body carries the details that are actually in the data.
 */
function V3CaseStudy({ project }: { project: Project }) {
  const index = projects.findIndex((entry) => entry.slug === project.slug);
  const previous = projects[(index - 1 + projects.length) % projects.length];
  const next = projects[(index + 1) % projects.length];

  return (
    <div className="v3-only">
      <Link
        href="/#projects"
        className="link font-mono text-[11px] uppercase tracking-wider text-muted-foreground hover:text-foreground"
      >
        ← all projects
      </Link>

      <header className="mt-10">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="pill-tag rounded-full bg-foreground px-2.5 py-0.5 text-background">
            {String(index + 1).padStart(2, "0")} / {String(projects.length).padStart(2, "0")}
          </span>
          <span className="pill-tag rounded-full border border-border px-2 py-0.5 text-muted-foreground">
            {project.category}
          </span>
        </div>

        <h1 className="case-title display-pixel mt-5 text-[2.6rem] leading-none text-foreground">
          {project.title}
        </h1>
        <p className="mt-5 text-[15px] leading-7 text-muted-foreground">
          {project.description}
        </p>
      </header>

      <div className="panel-frame relative mt-10 aspect-video w-full overflow-hidden rounded-2xl border border-border bg-muted">
        <Image
          src={project.image}
          alt={`${project.title} project preview`}
          fill
          priority
          className="object-contain"
          sizes="(max-width: 1024px) 100vw, 672px"
        />
      </div>

      <section className="mt-14" aria-labelledby={`details-${project.slug}`}>
        <div className="mb-6 flex items-baseline justify-between">
          <h2
            id={`details-${project.slug}`}
            className="display-pixel text-sm text-faint"
          >
            01 - details
          </h2>
        </div>

        <div className="rows">
          <div className="row flex items-baseline justify-between gap-6 px-1 py-3.5">
            <span className="stat-label">Role</span>
            <span className="text-right text-[14px] text-foreground">{project.role}</span>
          </div>
          <div className="row flex items-baseline justify-between gap-6 px-1 py-3.5">
            <span className="stat-label">Category</span>
            <span className="text-right text-[14px] text-foreground">{project.category}</span>
          </div>
          <div className="row px-1 py-3.5">
            <span className="stat-label">Stack</span>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {project.tags.map((tag) => (
                <span key={tag} className="tag">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mt-14" aria-labelledby={`links-${project.slug}`}>
        <div className="mb-6 flex items-baseline justify-between">
          <h2 id={`links-${project.slug}`} className="display-pixel text-sm text-faint">
            02 - links
          </h2>
        </div>

        <div className="rows">
          <a
            href={project.demo}
            target="_blank"
            rel="noopener noreferrer"
            className="row flex items-center justify-between gap-4 px-1 py-4"
          >
            <span className="text-[14px] text-foreground">Live demo</span>
            <span className="flex items-center gap-1.5 font-mono text-[12px] text-faint">
              {new URL(project.demo).hostname.replace(/^www\./, "")}
              <ArrowUpRight className="size-3.5" aria-hidden="true" />
            </span>
          </a>

          {project.github ? (
            <a
              href={project.github}
              target="_blank"
              rel="noopener noreferrer"
              className="row flex items-center justify-between gap-4 px-1 py-4"
            >
              <span className="flex items-center gap-2 text-[14px] text-foreground">
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
              className="row flex items-center justify-between gap-4 px-1 py-4"
            >
              <span className="flex items-center gap-2 text-[14px] text-foreground">
                <LockKeyhole className="size-4" aria-hidden="true" />
                Request source access
              </span>
              <span className="font-mono text-[12px] uppercase tracking-wider text-faint">
                private
              </span>
            </Link>
          )}
        </div>
      </section>

      <nav
        className="mt-14 flex items-baseline justify-between gap-6 border-t border-border pt-6"
        aria-label="Project navigation"
      >
        <Link href={`/projects/${previous.slug}`} className="group min-w-0">
          <span className="stat-label block">← previous</span>
          <span className="link mt-1 block truncate text-[14px] text-foreground">
            {previous.title}
          </span>
        </Link>
        <Link href={`/projects/${next.slug}`} className="group min-w-0 text-right">
          <span className="stat-label block">next →</span>
          <span className="link mt-1 block truncate text-[14px] text-foreground">
            {next.title}
          </span>
        </Link>
      </nav>
    </div>
  );
}

/** V2's case study, unchanged apart from the description no longer repeating. */
function V2CaseStudy({ project }: { project: Project }) {
  return (
    <div className="v2-only">
      <Button
        asChild
        variant="ghost"
        className="min-h-10 rounded-full px-3 text-muted-foreground hover:text-foreground"
      >
        <Link href="/#projects">
          <ArrowLeft aria-hidden="true" />
          Back to projects
        </Link>
      </Button>

      <header className="case-header mt-8 max-w-3xl">
        <div className="case-eyebrow mb-4 flex flex-wrap items-center gap-2 text-sm">
          <Badge variant="outline" className="px-3 py-1 font-mono text-xs">
            {project.category}
          </Badge>
          <span className="case-eyebrow-role text-muted-foreground">{project.role}</span>
        </div>
        <h1 className="case-title text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
          {project.title}
        </h1>
        <p className="case-lede mt-5 text-lg leading-8 md:text-xl">{project.description}</p>
      </header>

      <div className="case-hero relative mt-10 aspect-video w-full overflow-hidden rounded-2xl border border-border bg-muted">
        <Image
          src={project.image}
          alt={`${project.title} project preview`}
          fill
          priority
          className="object-contain"
          sizes="(max-width: 1024px) 100vw, 1024px"
        />
      </div>

      <div className="mt-10 grid gap-8 md:grid-cols-[minmax(0,1fr)_280px] md:items-start">
        <section aria-labelledby={`V2-overview-${project.slug}`}>
          <h2
            id={`V2-overview-${project.slug}`}
            className="case-section-title text-2xl font-bold tracking-tight"
          >
            Project overview
          </h2>
          <p className="case-body mt-4 text-base leading-8">{project.description}</p>
        </section>

        <Card className="case-details surface-card rounded-2xl p-5">
          <h2 className="case-details-label text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Project details
          </h2>
          <dl className="case-details-list mt-4 space-y-4 text-sm">
            <div>
              <dt className="case-details-term text-muted-foreground">Role</dt>
              <dd className="mt-1 font-medium text-foreground">{project.role}</dd>
            </div>
            <div>
              <dt className="case-details-term text-muted-foreground">Category</dt>
              <dd className="mt-1 font-medium text-foreground">{project.category}</dd>
            </div>
            <div>
              <dt className="case-details-term text-muted-foreground">Technology</dt>
              <dd className="mt-2 flex flex-wrap gap-1.5">
                {project.tags.map((tag) => (
                  <Badge key={tag} variant="muted" className="px-2.5 py-1 text-xs">
                    {tag}
                  </Badge>
                ))}
              </dd>
            </div>
          </dl>
        </Card>
      </div>

      <div className="case-actions mt-10 flex flex-col gap-3 border-t border-border pt-8 sm:flex-row">
        <Button asChild className="min-h-11 rounded-xl px-5">
          <a href={project.demo} target="_blank" rel="noopener noreferrer">
            <ExternalLink aria-hidden="true" />
            Visit live demo
          </a>
        </Button>
        {project.github ? (
          <Button asChild variant="outline" className="min-h-11 rounded-xl px-5">
            <a href={project.github} target="_blank" rel="noopener noreferrer">
              <Github aria-hidden="true" />
              View source code
            </a>
          </Button>
        ) : (
          <Button asChild variant="outline" className="min-h-11 rounded-xl px-5">
            <Link href={`/error/private?project=${encodeURIComponent(project.title)}`}>
              <LockKeyhole aria-hidden="true" />
              Request source access
            </Link>
          </Button>
        )}
      </div>
    </div>
  );
}
