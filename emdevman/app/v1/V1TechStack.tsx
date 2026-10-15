import { TechStackSkills } from "@/app/components/TechStackSkills";

/**
 * v1's toolkit: v1's own label and lede, then the marquee body that v3 shares.
 *
 * The label and lede stay here rather than moving into `TechStackSkills`,
 * because they are section chrome rather than part of the toolkit's content.
 * Under v3 the same eyebrow is drawn by `Section`'s "01 - the toolkit" marker,
 * and a second label two inches below it would say the same thing twice.
 */
export function V1TechStack() {
  return (
    <section id="tech-stack" className="v1-section">
      <p className="v1-label">the toolkit</p>
      <p className="v1-lede mt-4">
        What I reach for, and roughly how deep I am in each.
      </p>

      <TechStackSkills className="mt-12" />
    </section>
  );
}
