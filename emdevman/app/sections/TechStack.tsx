import { TechStackSkills } from "@/app/components/TechStackSkills";
import { Section } from "@/app/components/ui/Section";

/**
 * v3's toolkit.
 *
 * This section branched on `useDesign()` and carried two toolkits. v2's was an
 * infinite carousel of brand marks inside a `PixelCard` - large tiles, a glow on
 * hover, and the whole skill array duplicated to make the loop seamless - and v2
 * is its own tree now, so that half is gone rather than merely hidden. The
 * `TechStack`/`ToolCard` pair and the `workflow` import went with it, along with
 * the heading and description that only v2 ever rendered.
 *
 * What remains is the section shell and the marquee body in
 * `TechStackSkills`, which is v1's body rendered through v3's tokens. Neither
 * piece moves: v3 reads exactly as it did.
 */
export default function TechStack() {
  return (
    <Section
      id="tech-stack"
      index="01"
      eyebrow="the toolkit"
      action={{ label: "all work", href: "/#projects" }}
    >
      <TechStackSkills />
    </Section>
  );
}