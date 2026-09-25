import {
  ArrowUpRight,
  Code2,
  Layers3,
  Layout,
  Server,
  Terminal,
  Wrench,
} from "lucide-react";

import { Badge } from "@/app/components/ui/badge";

const techCategories = [
  {
    name: "Frontend",
    label: "Interface",
    icon: <Layout className="size-5" aria-hidden="true" />,
    description: "Interfaces that feel clear, quick, and considered on every screen.",
    skills: [
      { name: "Next.js", level: "Expert" },
      { name: "React", level: "Expert" },
      { name: "TypeScript", level: "Advanced" },
      { name: "Tailwind CSS", level: "Expert" },
    ],
    accent: "cyan",
  },
  {
    name: "Backend",
    label: "Data",
    icon: <Server className="size-5" aria-hidden="true" />,
    description: "Reliable data flows and APIs that keep the experience dependable.",
    skills: [
      { name: "Node.js", level: "Advanced" },
      { name: "MySQL", level: "Advanced" },
      { name: "Supabase", level: "Intermediate" },
      { name: "Firebase", level: "Intermediate" },
    ],
    accent: "violet",
  },
  {
    name: "DevOps & Tools",
    label: "Delivery",
    icon: <Wrench className="size-5" aria-hidden="true" />,
    description: "A practical workflow for shipping, testing, and learning in public.",
    skills: [
      { name: "Git / GitHub", level: "Expert" },
      { name: "Postman", level: "Intermediate" },
      { name: "Vercel", level: "Expert" },
      { name: "Figma", level: "Advanced" },
      { name: "VS Code", level: "Expert" },
    ],
    accent: "amber",
  },
] as const;

type Accent = (typeof techCategories)[number]["accent"];

const accentStyles: Record<
  Accent,
  {
    panel: string;
    icon: string;
    label: string;
    dot: string;
    glow: string;
  }
> = {
  cyan: {
    panel:
      "border-cyan-200/80 bg-cyan-50/70 dark:border-cyan-900/60 dark:bg-cyan-950/20",
    icon: "border-cyan-200 bg-cyan-100 text-cyan-700 dark:border-cyan-900 dark:bg-cyan-950 dark:text-cyan-300",
    label: "text-cyan-700 dark:text-cyan-300",
    dot: "bg-cyan-500",
    glow: "from-cyan-300/25 via-sky-300/10 to-transparent",
  },
  violet: {
    panel:
      "border-violet-200/80 bg-violet-50/70 dark:border-violet-900/60 dark:bg-violet-950/20",
    icon: "border-violet-200 bg-violet-100 text-violet-700 dark:border-violet-900 dark:bg-violet-950 dark:text-violet-300",
    label: "text-violet-700 dark:text-violet-300",
    dot: "bg-violet-500",
    glow: "from-violet-300/25 via-fuchsia-300/10 to-transparent",
  },
  amber: {
    panel:
      "border-amber-200/80 bg-amber-50/70 dark:border-amber-900/60 dark:bg-amber-950/20",
    icon: "border-amber-200 bg-amber-100 text-amber-700 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300",
    label: "text-amber-700 dark:text-amber-300",
    dot: "bg-amber-500",
    glow: "from-amber-300/25 via-orange-300/10 to-transparent",
  },
};

const workflow = [
  { number: "01", title: "Shape", detail: "Interface", icon: Layout },
  { number: "02", title: "Connect", detail: "Data", icon: Code2 },
  { number: "03", title: "Ship", detail: "Delivery", icon: Terminal },
];

function StackCard({
  category,
  index,
}: {
  category: (typeof techCategories)[number];
  index: number;
}) {
  const styles = accentStyles[category.accent];

  return (
    <article
      className={`group relative flex h-full flex-col overflow-hidden rounded-3xl border p-1 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl ${styles.panel}`}
    >
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute -right-20 -top-20 size-64 rounded-full bg-gradient-to-br blur-3xl transition-transform duration-500 group-hover:scale-125 ${styles.glow}`}
      />
      <div className="relative flex h-full flex-col rounded-[1.4rem] border border-white/60 bg-white/75 p-5 backdrop-blur-sm sm:p-6 dark:border-white/5 dark:bg-zinc-950/55">
        <div className="mb-7 flex items-start justify-between gap-4">
          <div className={`rounded-2xl border p-3 ${styles.icon}`}>
            {category.icon}
          </div>
          <span className="font-mono text-xs tracking-[0.2em] text-muted-foreground/70">
            0{index + 1}
          </span>
        </div>

        <div>
          <p className={`font-mono text-[10px] font-semibold uppercase tracking-[0.18em] ${styles.label}`}>
            {category.label}
          </p>
          <h3 className="mt-2 text-2xl font-bold tracking-tight">{category.name}</h3>
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
              <Badge
                variant="outline"
                className="shrink-0 border-border/80 bg-background/60 px-2 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground"
              >
                {skill.level}
              </Badge>
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

export default function TechStack() {
  return (
    <section
      id="tech-stack"
      className="w-full px-4 py-20 transition-colors duration-300 md:px-6 md:py-24"
    >
      <div className="container mx-auto max-w-6xl">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_280px] lg:items-end">
          <div>
            <Badge
              variant="outline"
              className="bg-background/70 px-3 py-1 font-mono text-xs backdrop-blur"
            >
              <Terminal className="size-3.5 text-cyan-600 dark:text-cyan-300" aria-hidden="true" />
              The toolkit
            </Badge>
            <h2 className="mt-5 text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
              The stack behind the work.
            </h2>
            <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground md:text-xl">
              A practical toolkit for building responsive, maintainable products from
              the interface through the data layer.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 lg:grid-cols-1">
          </div>
        </div>

        <div className="mt-12 grid gap-5 lg:grid-cols-3">
          {techCategories.map((category, index) => (
            <StackCard key={category.name} category={category} index={index} />
          ))}
        </div>

        <div className="mt-8 overflow-hidden rounded-3xl border border-border/80 bg-card/75 p-5 shadow-sm backdrop-blur sm:p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-foreground text-background">
                <Layers3 className="size-5" aria-hidden="true" />
              </div>
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                  How it comes together
                </p>
                <p className="mt-1 text-sm font-semibold">A simple path from idea to impact.</p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 lg:min-w-[30rem]">
              {workflow.map((step, index) => {
                const Icon = step.icon;
                return (
                  <div key={step.number} className="flex items-center gap-3 sm:gap-4">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-muted text-foreground">
                      <Icon className="size-4" aria-hidden="true" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-mono text-[10px] text-muted-foreground">{step.number}</p>
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
                );
              })}
            </div>
          </div>
        </div>

        <div className="mt-8 flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Code2 className="size-4 text-cyan-600 dark:text-cyan-300" aria-hidden="true" />
          Always learning, always shipping.
        </div>
      </div>
    </section>
  );
}
