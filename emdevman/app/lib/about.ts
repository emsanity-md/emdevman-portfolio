import { Code2, Cpu, Globe, Zap } from "lucide-react";
import type { StaticImageData } from "next/image";

import coding1 from "../assets/images/coding1.png";
import coding2 from "../assets/images/coding2.png";
import coding3 from "../assets/images/coding3.png";

/**
 * The About section's content, shared by both designs.
 *
 * Lives here rather than in either section component so the two can differ in
 * markup without duplicating the copy, and so neither has to import the other.
 */
export interface AboutImage {
  src: StaticImageData;
  alt: string;
  caption: string;
}

export const aboutImages: AboutImage[] = [
  {
    src: coding1,
    alt: "Code editor showing a web application being developed",
    caption: "Turning ideas into maintainable interfaces",
  },
  {
    src: coding2,
    alt: "Developer workspace with monitors and coding equipment",
    caption: "Learning through building and iteration",
  },
  {
    src: coding3,
    alt: "Close-up of code and technical work in progress",
    caption: "Details matter—from data flow to polish",
  },
];

export interface AboutStrength {
  icon: typeof Code2;
  title: string;
  description: string;
}

export const aboutStrengths: AboutStrength[] = [
  {
    icon: Code2,
    title: "Clean code",
    description: "Maintainable, scalable foundations",
  },
  {
    icon: Zap,
    title: "Performance",
    description: "Fast, focused experiences",
  },
  {
    icon: Globe,
    title: "Responsive",
    description: "Mobile-first interaction design",
  },
  {
    icon: Cpu,
    title: "Modern tech",
    description: "Next.js, React and TypeScript",
  },
];

export const aboutBio =
  "I’m a passionate web development enthusiast with a strong eye for design and a drive for creating seamless digital experiences.";

export const aboutFocus = "Accessible interfaces that feel effortless.";
export const aboutLocation = "Building from the Philippines";
export const aboutQuote = "The best interfaces make the right thing feel obvious.";
