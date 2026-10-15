import { Code2 } from "lucide-react";

import { Section } from "@/app/components/ui/Section";
import { V3About } from "./V3About";

/**
 * v3's about section.
 *
 * The branch and `V2About` are gone. That body was a swipeable carousel of three
 * stills with arrow buttons, a thumbnail strip and a live region - a second
 * image carousel on a page that also had a toolkit carousel, both of which
 * existed to make a static gallery feel like motion. v2 owns its own tree now,
 * so the carousel went with the rest of it rather than being parked behind a
 * `display: none`.
 *
 * `Section` still takes an `icon` and a `title` for the two designs that render
 * one; v3 ignores both, and v3 is now the only caller left on this route.
 */
export default function About() {
  return (
    <Section
      id="about"
      index="04"
      eyebrow="about"
      action={{ label: "more", href: "/#contact" }}
      both
      reveal
      icon={<Code2 className="section-badge-icon text-accent-b" aria-hidden="true" />}
      title={
        <>
          Building for people,
          <span className="about-title-second mt-1 block font-display text-4xl italic text-muted-foreground sm:text-5xl">
            not just screens.
          </span>
        </>
      }
      description="I&apos;m a passionate web development enthusiast with a strong eye for design and a drive for creating seamless digital experiences."
    >
      <V3About />
    </Section>
  );
}