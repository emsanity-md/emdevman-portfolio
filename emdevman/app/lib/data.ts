import type { StaticImageData } from "next/image";

import ctechImage from "../assets/projects/ctech.png";
import inaAniImage from "../assets/projects/ina-ani.png";
import flexwearImage from "../assets/projects/flexwear.png";
import cuisinaImage from "../assets/projects/OUTSIDE.png";
import pcosImage from "../assets/projects/pcos.png";
import coffeeshopImage from "../assets/projects/coffeeshop.png";
import karaokeyImage from "../assets/projects/karaokey.png";
import helpdeskImage from "../assets/projects/helpdeskit.png";

export const projectCategories = ["All", "Next.js", "Full Stack", "Mobile"] as const;

export type ProjectCategory = (typeof projectCategories)[number];

export interface Project {
  slug: string;
  title: string;
  description: string;
  tags: string[];
  category: Exclude<ProjectCategory, "All">;
  role: string;
  github: string | null;
  demo: string;
  image: StaticImageData;
  isPrivate: boolean;
}

export const projects: Project[] = [
  {
    slug: "ctech-ccset",
    title: "CTECH × CCSET",
    description:
      "A collaborative research platform for publishing student papers with an integrated peer-review workflow for instructors. I led the student team, coordinated the product direction, and later revamped the interface and core experience as the system matured beyond its original class requirement.",
    tags: ["Next.js", "TypeScript", "Tailwind", "Node.js", "MySQL"],
    category: "Next.js",
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
    role: "Full-stack and machine-learning integration developer",
    github: null,
    demo: "https://play.google.com/store/apps/details?id=com.fullstack.cuisinaapp",
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
    role: "Web developer",
    github: null,
    demo: "https://digital-awareness-rose.vercel.app/",
    image: pcosImage,
    isPrivate: true,
  },
  {
    slug: "coffee-shop-ordering-system",
    title: "Coffee Shop Ordering System",
    description:
      "A lightweight ordering-system prototype built with Nuxt and Nuxt UI. It demonstrates a responsive menu and local ordering flow while documenting the authentication, backend, testing and deployment work still required before production use.",
    tags: ["Nuxt", "Nuxt UI", "Vue", "Tailwind CSS"],
    category: "Full Stack",
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
    role: "Full-stack developer",
    github: "https://github.com/emsanity-md/HelpDeskIT.git",
    demo: "https://helpdesk-nine-pi.vercel.app",
    image: helpdeskImage,
    isPrivate: true,
  },
];

export function getProjectBySlug(slug: string) {
  return projects.find((project) => project.slug === slug);
}
