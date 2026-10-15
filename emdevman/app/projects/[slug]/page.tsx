import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowUpRight, Github } from "lucide-react";

import { getProjectBySlug, projects } from "../../lib/data";
import { ogImage } from "../../lib/site";
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

  const url = `/projects/${project.slug}`;

  /*
    OpenGraph and Twitter are named here rather than left to the layout, because
    a route's `openGraph` replaces the layout's object outright instead of
    merging into it. Without this, a shared case study announced the site title,
    the homepage's description, and - the part that was actually wrong - the
    homepage as its own URL, while its canonical said otherwise.
  */
  return {
    title: project.title,
    description: project.description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      type: "article",
      url,
      siteName: "Emmanuel Bitancor Portfolio",
      title: `${project.title} | Emmanuel Bitancor`,
      description: project.description,
      images: [ogImage],
    },
    twitter: {
      card: "summary_large_image",
      title: `${project.title} | Emmanuel Bitancor`,
      description: project.description,
      images: [{ url: ogImage.url, alt: ogImage.alt }],
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
          <CaseStudy project={project} />
        </div>
      </article>
    </>
  );
}

type Project = NonNullable<ReturnType<typeof getProjectBySlug>>;

/**
 * The case study.
 *
 * One body, not one per design. It used to render a `V3CaseStudy` and a
 * `V2CaseStudy` behind the `.v3-only` / `.v2-only` pair, because the shared
 * sections had two designs to serve. v2 has its own tree now, and its design
 * brief for this route was always "the same template as the CTECH case study" -
 * which is what is left.
 *
 * Keeping the route on the same template is the point: `/projects/[slug]` is
 * prerendered for all ten projects, so every featured card's "Case study"
 * link lands on a page that exists and is built from the same thing.
 *
 * The `rows` markup and the pixel markers are v3's class vocabulary, and they
 * are kept as they are rather than renamed to something generic: renaming them
 * would mean touching every rule in a stylesheet three other designs read, to
 * change nothing a reader can see.
 */
function CaseStudy({ project }: { project: Project }) {
  const index = projects.findIndex((entry) => entry.slug === project.slug);
  const previous = projects[(index - 1 + projects.length) % projects.length];
  const next = projects[(index + 1) % projects.length];

  return (
    <>
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
          /* Eager, and not `priority` - deprecated in Next 16, where it emits a
             preload link but leaves the element at default queue priority. This
             is the largest thing on the page, so it is the LCP element here. */
          loading="eager"
          fetchPriority="high"
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
          ) : null}

          {/*
            A private repository gets no row here at all. This used to link to
            `/error/private`, which is a page that says the source is closed and
            then asks the reader to email - so the case study ended on a link
            that promised something and delivered a form letter. "Live demo"
            above is the honest set of outbound links for this project.
          */}
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
    </>
  );
}
