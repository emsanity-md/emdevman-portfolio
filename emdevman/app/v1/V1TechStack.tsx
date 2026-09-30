import { techCategories } from "@/app/lib/tech";

import { V1Section } from "./Section";

/**
 * v1's toolkit: three groups, each a label and a two-column list of skills with
 * the level right-aligned.
 *
 * No brand marks and no tiles. v3 uses `ToolTile` for this, which is a bordered
 * box with a glyph in it - a component that only makes sense once a design has
 * decided to draw boxes.
 */
export function V1TechStack() {
  return (
    <V1Section
      id="tech-stack"
      label="the toolkit"
      lede="What I reach for, and roughly how deep I am in each."
    >
      <div className="mt-12 space-y-12">
        {techCategories.map((category) => (
          <div key={category.name}>
            <p className="v1-label">{category.label}</p>

            <div className="v1-skills mt-5">
              {category.skills.map((skill) => (
                <div key={skill.name} className="v1-skill">
                  <span className="text-[0.9375rem] text-foreground">{skill.name}</span>
                  <span className="v1-label">{skill.level}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </V1Section>
  );
}
