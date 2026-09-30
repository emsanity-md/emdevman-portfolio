/**
 * The toolkit's content, shared by every design.
 *
 * Lives here rather than in a section component for the same reason
 * `lib/about.ts` does: the designs differ in markup, not in what the toolkit
 * says, and duplicating the lists would let them drift apart silently.
 */

export const techCategories = [
  {
    name: "Frontend",
    label: "Interface",
    description:
      "Interfaces that feel clear, quick, and considered on every screen.",
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
    description:
      "Reliable data flows and APIs that keep the experience dependable.",
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
    description:
      "A practical workflow for shipping, testing, and learning in public.",
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

export type TechCategory = (typeof techCategories)[number];
export type TechAccent = TechCategory["accent"];

export const workflow = [
  { number: "01", title: "Shape", detail: "Interface" },
  { number: "02", title: "Connect", detail: "Data" },
  { number: "03", title: "Ship", detail: "Delivery" },
] as const;
