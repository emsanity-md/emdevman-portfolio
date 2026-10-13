"use client";

import {
  ArrowUpRight,
  Code2,
  Terminal,
} from "lucide-react";

import BrandMark from "@/app/components/ui/BrandMark";
import PixelCard from "@/app/components/ui/PixelCard";
import { Section } from "@/app/components/ui/Section";
import { useDesign } from "@/app/context/DesignProvider";
import {
  techCategories,
  workflow,
} from "@/app/lib/tech";

const allSkills = (techCategories as unknown as { skills: { name: string; level: string }[] }[])
  .flatMap((category) => category.skills);

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

function ToolCard({ name, duplicate }: { name: string; duplicate: boolean }) {
  return (
    <article aria-label={name} aria-hidden={duplicate ? true : undefined} className="shrink-0">
      <PixelCard
        colors={["#53eafd", "#ffffff"]}
        glowColor="#53eafd"
        pixelSize={2}
        gap={5}
        speed={40}
        origin="pointer"
        radius={20}
        theme="dark"
        className="!h-[clamp(190px,22vw,240px)] !w-[clamp(150px,18vw,200px)]"
      >
      <div className="flex h-full w-full flex-col items-center justify-end gap-4 py-5">
        <div className="mt-auto mb-auto flex h-[60%] w-[60%] items-center justify-center text-foreground transition-transform duration-300 group-hover:scale-110 group-hover:text-accent-c [transition-timing-function:steps(5,end)]">
          <BrandMark name={name} className="h-full w-full" />
        </div>
        <span className="pt-2 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground transition-colors duration-300 group-hover:text-accent-c/90">
          {name}
        </span>
      </div>
    </PixelCard>
  </article>
  );
}

function V3Stack() {
  return (
    <Section
      id="tech-stack"
      index="01"
      eyebrow="the toolkit"
      action={{ label: "all work", href: "/#projects" }}
    >
      <div className="panel overflow-hidden p-4">
        <div className="v5-marquee gap-3">
          {[...allSkills, ...allSkills].map((skill, index) => (
            <div
              key={`${skill.name}-${index}`}
              className="flex h-24 w-24 shrink-0 items-center justify-center rounded-xl border border-border bg-muted/40 p-4"
            >
              <BrandMark name={skill.name} className="h-12 w-12" />
            </div>
          ))}
        </div>
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
      {/* Toolkit carousel: large cards on an infinite scroll, retained for V2. */}
      <div className="toolkit-carousel [mask-image:linear-gradient(to_right,transparent_0,black_12%,black_88%,transparent_100%)] [-webkit-mask-image:linear-gradient(to_right,transparent_0,black_12%,black_88%,transparent_100%)] overflow-hidden py-2">
        <div className="toolkit-track flex w-max gap-4">
          {[...allSkills, ...allSkills].map((skill, index) => (
            <ToolCard
              key={`${skill.name}-${index}`}
              name={skill.name}
              duplicate={index >= allSkills.length}
            />
          ))}
        </div>
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

