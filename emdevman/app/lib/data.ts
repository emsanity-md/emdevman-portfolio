import type { StaticImageData } from "next/image";

import ctechImage from "../assets/projects/ctech.png";
import inaAniImage from "../assets/projects/ina-ani.png";
import flexwearImage from "../assets/projects/flexwear.png";
import cuisinaImage from "../assets/projects/OUTSIDE.png";
import pcosImage from "../assets/projects/pcos.png";
import coffeeshopImage from "../assets/projects/coffeenew.png";
import karaokeyImage from "../assets/projects/karaokey.png";
import helpdeskImage from "../assets/projects/helpdesknew.png";
import quizwizImage from "../assets/projects/quizwiz.png";
import openwallImage from "../assets/projects/openWall.png";

export const projectCategories = ["All", "Next.js", "Full Stack", "Mobile"] as const;

export type ProjectCategory = (typeof projectCategories)[number];

/**
 * What kind of thing a project is, as distinct from what it is built with.
 *
 * `category` above is the old taxonomy and it is kept because four other
 * designs still filter and display on it. It is not a good taxonomy: "Next.js"
 * is a framework, "Full Stack" is a scope and "Mobile" is a platform, so a
 * project lands in whichever of the three happened to be written down first and
 * the three overlap heavily - six of the ten are "Next.js".
 *
 * These five do not overlap. Each one answers a different question - what shape
 * the deliverable is, where it runs, whether it infers, whether it sells, and
 * whether it is an operations surface - so a project can be "Web app" and
 * "AI" without either label being wrong, and no two labels here mean the same
 * thing as each other.
 *
 * A project carries as many as are true rather than being forced into one.
 */
export const projectKinds = [
  "Web app",
  "Mobile",
  "AI",
  "E-commerce",
  "Dashboard",
] as const;

export type ProjectKind = (typeof projectKinds)[number];

export interface Project {
  slug: string;
  title: string;
  description: string;
  tags: string[];
  category: Exclude<ProjectCategory, "All">;
  /** The v2 taxonomy. See `projectKinds` above. */
  kinds: ProjectKind[];
  role: string;
  github: string | null;
  demo: string;
  image: StaticImageData;
  isPrivate: boolean;
  /**
   * The year the project was built, shown on the compact list.
   *
   * Optional because the repo has never held this and inventing ten dates is
   * worse than showing none. The list renders the column only when at least one
   * entry has one, so filling in a few improves it without leaving holes.
   *
   * TODO(owner): fill these in - no source for them exists in the repo today.
   */
  year?: string;
  /**
   * A single sentence for the featured cards, in place of the full description.
   *
   * `description` is two to three sentences written for a case study, and the
   * featured card wants one line. The card falls back to the description when
   * this is absent, which is a working card rather than a broken one - so the
   * gap is visible in the design review rather than hidden behind a blank.
   *
   * TODO(owner): write one per featured project (ctech-ccset, cuisina-ai,
   * QuizWiz, helpdeskit). Outcome, not summary - what changed for someone.
   */
  lede?: string;
}

export const projects: Project[] = [
  {
    slug: "ctech-ccset",
    title: "CTECH × CCSET",
    description:
      "A collaborative research platform for publishing student papers with an integrated peer-review workflow for instructors. I led the student team, coordinated the product direction, and later revamped the interface and core experience as the system matured beyond its original class requirement.",
    tags: ["Next.js", "TypeScript", "Tailwind", "Node.js", "MySQL"],
    category: "Next.js",
    // TODO(owner): a second kind for CTECH x CCSET. It has an instructor-facing
    // peer-review queue, which is arguably a "Dashboard", but the description
    // does not present it as one and that is not a call to make from outside.
    kinds: ["Web app"],
    role: "Project lead and full-stack developer",
    github: null,
    demo: "https://www.ctech.bisubilar.org/",
    image: ctechImage,
    isPrivate: true,
  },
  {
    slug: "ina-ani",
    title: "INA-ANI",
    description:
      "An agricultural marketplace designed to help local farmers and artisans present and sell their products directly to consumers. I designed and built the marketplace experience, including organized product discovery, seller listings and a clear purchasing flow.",
    tags: ["React", "Node.js", "Express", "Postman", "MySQL"],
    category: "Full Stack",
    kinds: ["Web app", "E-commerce"],
    role: "Marketplace feature developer",
    github: null,
    demo: "https://inaani-65603a755da1.herokuapp.com/",
    image: inaAniImage,
    isPrivate: true,
  },
  {
    slug: "flexwear",
    title: "FlexWear",
    description:
      "A modern e-commerce experience for wearable products, featuring responsive product discovery, catalog browsing, cart interactions and a streamlined checkout flow powered by Firebase.",
    tags: ["React", "Vite", "Firebase", "Tailwind CSS", "Framer Motion"],
    category: "Full Stack",
    kinds: ["Web app", "E-commerce"],
    role: "Full-stack developer",
    github: "https://github.com/EmmanuelBitancor/FlexWear.git",
    demo: "https://flex-wear.vercel.app/",
    image: flexwearImage,
    isPrivate: false,
  },
  {
    slug: "cuisina-ai",
    title: "Cuisina AI",
    description:
      "A mobile application that uses convolutional neural networks to identify beef, pork, chicken and goat from an image. The project combines image classification with approachable food-safety and nutrition guidance for everyday cooking decisions.",
    tags: ["Next.js", "Supabase", "Tailwind CSS", "Framer Motion"],
    category: "Mobile",
    kinds: ["Mobile", "AI"],
    role: "Full-stack and machine-learning integration developer",
    github: null,
    demo: "https://play.google.com/store/apps/details?id=com.fullstack.cuisinaapp",
    // TODO(owner): this is a scan of the printed tri-fold brochure, not a shot
    // of the app - the only one of the ten that is. It reads fine contained in
    // the card frame, but a real screen capture would say more about the work.
    image: cuisinaImage,
    isPrivate: true,
  },
  {
    slug: "digital-pcos-awareness",
    title: "Digital PCOS Awareness",
    description:
      "An educational web experience that presents accessible information about Polycystic Ovary Syndrome, including common symptoms, prevention and positive lifestyle changes.",
    tags: ["Next.js", "Tailwind CSS"],
    category: "Next.js",
    kinds: ["Web app"],
    role: "Web developer",
    github: null,
    demo: "https://digital-awareness-rose.vercel.app/",
    image: pcosImage,
    isPrivate: true,
  },
   {
    slug: "openwall",
    title: "Open Wall",
    description:
      "A safe, judgment-free space to share confessions, feelings, and secrets anonymously. Your voice matters — even when it's unnamed.",
    tags: ["NextJS", "Tailwind CSS", "Supabase"],
    category: "Full Stack",
    kinds: ["Web app"],
    role: "Full-Stack developer",
    github: null,
    demo: "https://the-open-wall.vercel.app",
    image: openwallImage,
    isPrivate: true,
  },
  {
    slug: "coffee-shop-ordering-system",
    title: "Coffee Shop Ordering System",
    description:
      "A lightweight ordering-system prototype built with Nuxt and Nuxt UI. It demonstrates a responsive menu and local ordering flow while documenting the authentication, backend, testing and deployment work still required before production use.",
    tags: ["Nuxt", "Nuxt UI", "Vue", "Tailwind CSS"],
    category: "Full Stack",
    kinds: ["Web app", "E-commerce"],
    role: "Application developer",
    github: "https://github.com/emsanity-md/coffeeShop-frontend",
    demo: "https://coffeeshop-pi-cyan.vercel.app",
    image: coffeeshopImage,
    isPrivate: true,
  },
  {
    slug: "karaokey",
    title: "KaraoKey",
    description:
      "A free browser-based karaoke experience powered by YouTube and Supabase. Visitors can search for a song and start singing without downloading an app or creating an account.",
    tags: ["Next.js", "Supabase", "Tailwind CSS", "Framer Motion"],
    category: "Next.js",
    kinds: ["Web app"],
    role: "Full-stack developer",
    github: null,
    demo: "https://karaokey-khaki.vercel.app",
    image: karaokeyImage,
    isPrivate: true,
  },
  {
    slug: "helpdeskit",
    title: "HelpDeskIT",
    description:
      "A centralized IT help-desk system for creating, assigning and tracking support tickets. The interface supports multiple user roles and gives support teams a clear view of service health and workload.",
    tags: ["Next.js", "Supabase", "Tailwind CSS", "Shadcn UI"],
    category: "Next.js",
    kinds: ["Web app", "Dashboard"],
    role: "Full-stack developer",
    github: "https://github.com/emsanity-md/HelpDeskIT.git",
    demo: "https://helpdesk-nine-pi.vercel.app",
    image: helpdeskImage,
    isPrivate: true,
  },
  {
    slug: "QuizWiz",
    title: "QuizWiz",
    description:
      "Quizwiz turns a topic, a document, or a bank of questions you already have into a quiz you can send as a single link. Whoever it is sent to takes it in under a minute without installing anything or making an account, and you get back a per-question breakdown of what landed and what did not. It is built for anyone who keeps needing to check understanding rather than recall it: a teaching assistant building revision sets, an onboarding lead who wants to find the question half the team got wrong, a team lead who would rather ask four questions than hold another meeting.",
    tags: ["Next.js", "Tailwind CSS", "Shadcn UI", "React Bits", "UnPdf", "Motion", "GSAP"],
    category: "Next.js",
    // TODO(owner): a second kind for QuizWiz. "AI" is the obvious candidate - it
    // builds a quiz from a topic or a document - but the description above never
    // says a model does that, so it is not asserted here on the strength of the
    // name.
    kinds: ["Web app"],
    role: "Frontend developer",
    github: "https://github.com/emsanity-md/Quizwiz.git",
    demo: "https://quizwiz-nine.vercel.app",
    image: quizwizImage,
    isPrivate: true,
  },
];

export function getProjectBySlug(slug: string) {
  return projects.find((project) => project.slug === slug);
}

/**
 * The four projects the homepage gives a card to.
 *
 * Named by slug rather than taken from the head of the array. v5 takes the
 * first four, which works for it because its Home tab is a feed and position in
 * the feed is the ranking; here the four are a selection, and the two sets are
 * not the same four. Naming them means adding a project at the top of
 * `projects` cannot silently change which one a design calls featured.
 *
 * A slug that no longer resolves is dropped rather than rendered as a hole, and
 * `FEATURED_SLUGS.length` is what the section's own copy counts, so the list and
 * the number under it cannot disagree.
 */
export const FEATURED_SLUGS = [
  "ctech-ccset",
  "cuisina-ai",
  "QuizWiz",
  "helpdeskit",
] as const;

export const featuredProjects = FEATURED_SLUGS.map(getProjectBySlug).filter(
  (project): project is Project => project !== undefined,
);
