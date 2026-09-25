import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink, Github, LockKeyhole } from "lucide-react";

import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import { Card } from "@/app/components/ui/card";
import { getProjectBySlug, projects } from "../../lib/data";

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
    <article className="min-h-screen px-4 pb-20 pt-28 md:px-6 md:pb-28 md:pt-36">
      <div className="mx-auto w-full max-w-5xl">
        <Button asChild variant="ghost" className="min-h-10 rounded-full px-3 text-muted-foreground hover:text-foreground">
          <Link href="/#projects">
            <ArrowLeft aria-hidden="true" />
            Back to projects
          </Link>
        </Button>

        <header className="mt-8 max-w-3xl">
          <div className="mb-4 flex flex-wrap items-center gap-2 text-sm">
            <Badge variant="outline" className="px-3 py-1 font-mono text-xs">
              {project.category}
            </Badge>
            <span className="text-zinc-500 dark:text-zinc-400">{project.role}</span>
          </div>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
            {project.title}
          </h1>
          <p className="mt-5 text-lg leading-8 text-zinc-600 md:text-xl dark:text-zinc-400">
            {project.description}
          </p>
        </header>

        <div className="relative mt-10 aspect-video w-full overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-100 shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
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
          <section aria-labelledby={`overview-${project.slug}`}>
            <h2
              id={`overview-${project.slug}`}
              className="text-2xl font-bold tracking-tight"
            >
              Project overview
            </h2>
            <p className="mt-4 text-base leading-8 text-zinc-600 dark:text-zinc-400">
              {project.description}
            </p>
            <p className="mt-4 text-base leading-8 text-zinc-600 dark:text-zinc-400">
              The project reflects a focus on practical product decisions: clear
              user journeys, maintainable implementation and responsive behavior
              across screen sizes.
            </p>
          </section>

          <Card className="rounded-2xl bg-card/80 p-5 backdrop-blur">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Project details
            </h2>
            <dl className="mt-4 space-y-4 text-sm">
              <div>
                <dt className="text-zinc-500 dark:text-zinc-500">Role</dt>
                <dd className="mt-1 font-medium text-zinc-900 dark:text-zinc-100">
                  {project.role}
                </dd>
              </div>
              <div>
                <dt className="text-zinc-500 dark:text-zinc-500">Category</dt>
                <dd className="mt-1 font-medium text-zinc-900 dark:text-zinc-100">
                  {project.category}
                </dd>
              </div>
              <div>
                <dt className="text-zinc-500 dark:text-zinc-500">Technology</dt>
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

        <div className="mt-10 flex flex-col gap-3 border-t border-zinc-200 pt-8 sm:flex-row dark:border-zinc-800">
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
    </article>
  );
}
