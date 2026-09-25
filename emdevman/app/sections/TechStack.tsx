import { Code2, Layout, Server, Wrench } from "lucide-react";
import type { ReactNode } from "react";

import { Badge } from "@/app/components/ui/badge";
import { Card } from "@/app/components/ui/card";

const techCategories = [
  {
    name: "Frontend",
    icon: <Layout className="size-5" aria-hidden="true" />,
    skills: [
      { name: "Next.js", level: "Expert" },
      { name: "React", level: "Expert" },
      { name: "TypeScript", level: "Advanced" },
      { name: "Tailwind CSS", level: "Expert" },
    ],
  },
  {
    name: "Backend",
    icon: <Server className="size-5" aria-hidden="true" />,
    skills: [
      { name: "Node.js", level: "Advanced" },
      { name: "MySQL", level: "Advanced" },
      { name: "Supabase", level: "Intermediate" },
      { name: "Firebase", level: "Intermediate" },
    ],
  },
  {
    name: "DevOps & Tools",
    icon: <Wrench className="size-5" aria-hidden="true" />,
    skills: [
      { name: "Git / GitHub", level: "Expert" },
      { name: "Postman", level: "Intermediate" },
      { name: "Vercel", level: "Expert" },
      { name: "Figma", level: "Advanced" },
      { name: "VS Code", level: "Expert" },
    ],
  },
];

function BorderBeamCard({ children }: { children: ReactNode }) {
  return (
    <div className="group relative h-full w-full overflow-hidden rounded-2xl bg-zinc-200 p-px dark:bg-zinc-800">
      <div
        aria-hidden="true"
        className="absolute -inset-[100%] opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-hover:animate-[spin_3s_linear_infinite] motion-reduce:hidden"
      >
        <div className="size-full bg-[conic-gradient(from_90deg_at_50%_50%,transparent_50%,#06b6d4_100%)] dark:bg-[conic-gradient(from_90deg_at_50%_50%,transparent_50%,#ffffff_100%)]" />
      </div>
      <Card className="relative h-full w-full rounded-[15px] border-0 bg-white px-5 py-6 shadow-none sm:p-6 dark:bg-zinc-950">
        {children}
      </Card>
    </div>
  );
}

export default function TechStack() {
  return (
    <section id="tech-stack" className="w-full px-4 py-20 transition-colors duration-300 md:px-6 md:py-24">
      <div className="container mx-auto max-w-6xl">
        <div className="mb-14 flex flex-col items-center space-y-4 text-center">
          <Badge variant="outline" className="bg-background/70 px-3 py-1 font-mono text-xs backdrop-blur">
            Tools I use every day
          </Badge>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
            Tech Stack
          </h2>
          <p className="max-w-2xl text-base leading-7 text-zinc-500 md:text-xl dark:text-zinc-400">
            A practical toolkit for building responsive, maintainable products from
            the interface through the data layer.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-3 md:gap-6">
          {techCategories.map((category) => (
            <BorderBeamCard key={category.name}>
              <div className="flex h-full flex-col">
                <div className="mb-6 flex items-center gap-3">
                  <div className="rounded-lg border border-zinc-200 bg-zinc-100 p-2 text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100">
                    {category.icon}
                  </div>
                  <h3 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                    {category.name}
                  </h3>
                </div>

                <ul className="flex flex-col gap-4" aria-label={`${category.name} skills`}>
                  {category.skills.map((skill) => (
                    <li
                      key={skill.name}
                      className="group/item flex items-center justify-between gap-3"
                    >
                      <span className="inline-flex items-center gap-3 font-medium text-zinc-600 transition-colors group-hover/item:text-zinc-950 dark:text-zinc-400 dark:group-hover/item:text-white">
                        <span className="size-1.5 rounded-full bg-zinc-400 transition-colors group-hover/item:bg-cyan-500 dark:bg-zinc-600 dark:group-hover/item:bg-white" />
                        {skill.name}
                      </span>
                      <Badge
                        variant="outline"
                        className="shrink-0 px-2 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground"
                      >
                        {skill.level}
                      </Badge>
                    </li>
                  ))}
                </ul>
              </div>
            </BorderBeamCard>
          ))}
        </div>

        <div className="mt-8 flex items-center justify-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
          <Code2 className="size-4" aria-hidden="true" />
          Always learning, always shipping.
        </div>
      </div>
    </section>
  );
}
