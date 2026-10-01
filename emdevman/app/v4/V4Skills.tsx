import { techCategories } from "@/app/lib/tech";

/**
 * The template's skill bars.
 *
 * `tech.ts` carries a text level per skill - Expert, Advanced, Intermediate -
 * and nothing anywhere in this repo has ever been numeric. Rather than add a
 * number the other three designs would read and ignore, the level is mapped to a
 * width here, inside v4, where the decision is only visible.
 *
 * The mapping lives in this file rather than in `tech.ts` for the same reason
 * the whole design does: the levels are the project's opinion and the
 * percentages are this design's presentation of them. If the two ever need to
 * disagree, they can - and v1's grid and v2's pills stay exactly as they are.
 *
 * The number is printed beside every bar as well as being the bar's width, so
 * the value is legible to a reader who cannot see the fill - a bar alone encodes
 * its meaning in length and nothing else.
 */
const LEVEL_PERCENT = {
  Expert: 95,
  Advanced: 85,
  Intermediate: 70,
} as const satisfies Record<string, number>;

type SkillLevel = keyof typeof LEVEL_PERCENT;

function percentFor(level: string): number {
  return LEVEL_PERCENT[level as SkillLevel] ?? 70;
}

/**
 * The categories render as a two-column grid, which is how the template lays its
 * five bars out. Thirteen skills across three categories is an odd number of
 * cells, so the last row of the widest category is left empty rather than
 * stretched - a bar spanning two columns would read as a different measurement.
 */
export function V4Skills() {
  return (
    <>
      {techCategories.map((category) => (
        <section
          key={category.name}
          className="v4-skill-group"
          aria-label={category.name}
        >
          <span className="v4-skill-group-label">{category.name}</span>

          <div className="v4-skill-pair">
            {category.skills.map((skill) => {
              const percent = percentFor(skill.level);

              return (
                <div key={skill.name} className="v4-skill">
                  <div className="v4-skill-head">
                    <span className="v4-skill-name">{skill.name}</span>
                    <span className="v4-skill-value">{percent}%</span>
                  </div>

                  {/*
                    `role="meter"` with the value read out, rather than a
                    progressbar: this is a rating of a person, not the progress of
                    a task, and progressbar tells assistive tech it is going to
                    move. `aria-valuetext` carries the level name so the bar is
                    not announced as a bare number.
                  */}
                  <div
                    role="meter"
                    aria-label={`${skill.name} proficiency`}
                    aria-valuenow={percent}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuetext={`${skill.level}, ${percent} percent`}
                    className="v4-skill-track"
                  >
                    <div className="v4-skill-fill" style={{ width: `${percent}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </>
  );
}
