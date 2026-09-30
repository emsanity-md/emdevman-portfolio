"use client";

import {
  ArrowUpRight,
  Code2,
  Layout,
  Server,
  Terminal,
  Wrench,
} from "lucide-react";

import BrandMark from "@/app/components/ui/BrandMark";
import { Section } from "@/app/components/ui/Section";
import ToolTile from "@/app/components/ui/ToolTile";
import { useDesign } from "@/app/context/DesignProvider";
import {
  techCategories,
  workflow,
  type TechAccent as Accent,
  type TechCategory as Category,
} from "@/app/lib/tech";

const accentStyles: Record<Accent, { panel: string; icon: string; label: string; dot: string }> = {
  cyan: {
    panel: "border-accent-c-line bg-accent-c-surface",
    icon: "border-accent-c-chip bg-accent-c-chip text-accent-c",
    label: "text-accent-c",
    dot: "bg-accent-c",
  },
  violet: {
    panel: "border-accent-b-line bg-accent-b-surface",
    icon: "border-accent-b-chip bg-accent-b-chip text-accent-b",
    label: "text-accent-b",
    dot: "bg-accent-b",
  },
  amber: {
    panel: "border-accent-d-line bg-accent-d-surface",
    icon: "border-accent-d-chip bg-accent-d-chip text-accent-d",
    label: "text-accent-d",
    dot: "bg-accent-d",
  },
};

export default function TechStack() {
  const { design } = useDesign();
  if (design === "v3") return <V3Stack />;
  return <V2Stack />;
}

/**
 * v3's toolkit: three groups, each a label, a line of copy, and a wrapping row
 * of tiles. The reference's own idiom for a list of named things is its
 * affiliations row - a small bordered tile, a 13px name, a mono uppercase
 * role - so that is what this borrows. No cards, no tints, no per-group
 * description card; if the page feels emptier than before, that is the intent.
 */
function V3Stack() {
  return (
    <Section
      id="tech-stack"
      index="01"
      eyebrow="the toolkit"
      action={{ label: "all work", href: "/#projects" }}
    >
      <div className="flex flex-col gap-[var(--section-block)]">
        {techCategories.map((category) => (
          <div key={category.name}>
            <p className="font-mono text-[11px] uppercase tracking-wider text-faint">
              {category.label}
            </p>
            <p className="mt-2 max-w-[34rem] text-[14px] leading-relaxed text-muted-foreground">
              {category.description}
            </p>

            <div className="mt-5 flex flex-wrap items-start gap-x-8 gap-y-4">
              {category.skills.map((skill) => (
                <ToolTile
                  key={skill.name}
                  name={skill.name}
                  role={skill.level}
                  mark={<BrandMark name={skill.name} />}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* The workflow, in the reference's hairline row form: a mono index
          column, a title, and an opposing detail. */}
      <div className="rows section-block">
        {workflow.map((step) => (
          <div
            key={step.number}
            className="row grid grid-cols-12 items-baseline gap-3 py-2.5"
          >
            <div className="col-span-2 font-mono text-[11px] text-faint">
              {step.number}
            </div>
            <div className="col-span-10 col-start-3 text-[14px] font-medium text-foreground">
              {step.title}
            </div>
            <div className="col-span-12 col-start-3 text-[13px] text-muted-foreground sm:col-span-4 sm:col-start-9 sm:text-right">
              {step.detail}
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}

/** V2's toolkit: three tinted cards, each with its own accent. Untouched. */
function V2Stack() {
  return (
    <Section
      id="tech-stack"
      index="01"
      eyebrow="the toolkit"
      action={{ label: "all work", href: "/#projects" }}
      icon={<Terminal className="section-badge-icon text-accent-c" aria-hidden="true" />}
      title="The stack behind the work."
      description="A practical toolkit for building responsive, maintainable products from the interface through the data layer."
    >
      <div className="grid gap-5 lg:grid-cols-3">
        {techCategories.map((category, index) => (
          <V2StackCard key={category.name} category={category} index={index} />
        ))}
      </div>

      <div className="stack-summary panel mt-8 overflow-hidden p-5 sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-foreground text-background">
              <Code2 className="size-5" aria-hidden="true" />
            </div>
            <div>
              <p className="eyebrow text-muted-foreground">How it comes together</p>
              <p className="mt-1 text-sm font-semibold">
                A simple path from idea to impact.
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 lg:min-w-[30rem]">
            {workflow.map((step, index) => (
              <div key={step.number} className="flex items-center gap-3 sm:gap-4">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-muted text-foreground">
                  <span className="font-mono text-micro">{step.number}</span>
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{step.title}</p>
                  <p className="truncate text-xs text-muted-foreground">{step.detail}</p>
                </div>
                {index < workflow.length - 1 && (
                  <ArrowUpRight
                    className="ml-auto hidden size-4 text-muted-foreground/50 sm:block"
                    aria-hidden="true"
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-8 flex items-center justify-center gap-2 text-sm text-muted-foreground">
        <Code2 className="size-4 text-accent-c" aria-hidden="true" />
        Always learning, always shipping.
      </div>
    </Section>
  );
}

function V2StackCard({
  category,
  index,
}: {
  category: Category;
  index: number;
}) {
  const styles = accentStyles[category.accent];
  const Icon = category.name === "Frontend" ? Layout : category.name === "Backend" ? Server : Wrench;

  return (
    <article
      className={`stack-card group relative flex h-full flex-col overflow-hidden rounded-3xl border p-1 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl ${styles.panel}`}
    >
      <div className="stack-card-inner relative flex h-full flex-col rounded-[1.4rem] border border-white/60 bg-white/75 p-5 backdrop-blur-sm sm:p-6 dark:border-white/5 dark:bg-zinc-950/55">
        <div className="mb-7 flex items-start justify-between gap-4">
          <div className={`stack-card-icon rounded-2xl border p-3 ${styles.icon}`}>
            <Icon className="size-5" aria-hidden="true" />
          </div>
          <span className="font-mono text-xs tracking-[0.2em] text-muted-foreground/70">
            0{index + 1}
          </span>
        </div>

        <div>
          <p className={`eyebrow font-semibold ${styles.label}`}>{category.label}</p>
          <h3 className="mt-2 text-heading font-bold">{category.name}</h3>
          <p className="mt-3 min-h-12 text-sm leading-6 text-muted-foreground">
            {category.description}
          </p>
        </div>

        <div className="mt-7 flex-1 divide-y divide-border/70 border-y border-border/70">
          {category.skills.map((skill) => (
            <div
              key={skill.name}
              className="flex items-center justify-between gap-3 py-3"
            >
              <span className="flex min-w-0 items-center gap-2.5 text-sm font-medium">
                <span className={`size-1.5 shrink-0 rounded-full ${styles.dot}`} />
                <span className="truncate">{skill.name}</span>
              </span>
              <span className="shrink-0 rounded-full border border-border/80 bg-background/60 px-2 py-0.5 font-mono text-micro uppercase tracking-wide text-muted-foreground">
                {skill.level}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-5 flex items-center justify-between gap-3 text-xs text-muted-foreground">
          <span>{category.skills.length} technologies in rotation</span>
          <ArrowUpRight
            className="size-4 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
            aria-hidden="true"
          />
        </div>
      </div>
    </article>
  );
}
