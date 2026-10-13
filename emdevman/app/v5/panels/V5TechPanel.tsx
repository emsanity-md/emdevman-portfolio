"use client";

import BrandMark from "@/app/components/ui/BrandMark";
import LogoLoop from "@/app/components/ui/LogoLoop";
import { techCategories, workflow } from "@/app/lib/tech";
import { V5Post } from "../V5Post";

/**
 * The Tech Stack tab: the three stack groups as cards, then the workflow.
 *
 * Three posts rather than one grid of three cards, because the feed is the page -
 * a grid of three wide panels inside a 600px column reads as a layout rather
 * than as content, and the reader would be looking at three cards at once with no
 * order to them. Stacked, the same three groups are three entries in a list, and
 * the eye goes down it.
 *
 * The chips carry the level - Expert, Advanced, Intermediate - rather than a
 * numeric bar. A bar inside a 600px column is a chart, and the tab's job is to
 * say which tools are in rotation, not to rank them against each other on a scale
 * that `lib/tech.ts` deliberately does not contain: it stores a text level, and
 * `V4Skills` is the only place in the repo that converts one to a percentage.
 */
const allSkills = Array.from(
  new Map<string, { name: string; level: string }>(
    (techCategories as unknown as { skills: { name: string; level: string }[] }[])
      .flatMap((category) => category.skills)
      .map((skill) => [skill.name, skill]),
  ).values(),
);

const techLogos = allSkills.map((skill) => ({
  node: <BrandMark name={skill.name} className="h-10 w-10" />,
  title: skill.name,
}));

export function V5TechPanel() {
  return (
    <>
      <V5Post
        meta={
          <span className="v5-chip v5-chip--accent ml-1.5">
            {allSkills.length} tools
          </span>
        }
      >
        <p className="text-[17px] font-bold">Tech Stack</p>
        <p className="text-muted-foreground">
          Icons in a marquee. Hover to pause.
        </p>

        <div className="v5-card mt-3 overflow-hidden p-4">
          <LogoLoop logos={techLogos} speed={80} gap={48} logoHeight={40} />
        </div>
      </V5Post>

      <V5Post>
        <p className="text-[17px] font-bold">How it comes together</p>
        <p className="text-muted-foreground">
          A simple path from idea to impact.
        </p>

        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          {workflow.map((step) => (
            <div key={step.number} className="v5-card">
              <p className="text-xs text-muted-foreground">{step.number}</p>
              <p className="text-sm font-bold">{step.title}</p>
              <p className="text-xs text-muted-foreground">{step.detail}</p>
            </div>
          ))}
        </div>
      </V5Post>
    </>
  );
}