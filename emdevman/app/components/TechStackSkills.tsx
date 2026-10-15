import BrandMark from "@/app/components/ui/BrandMark";
import { techCategories } from "@/app/lib/tech";
import { cn } from "@/app/lib/utils";

/**
 * The toolkit's body: two infinite marquee rows of brand marks, then the three
 * category descriptions as static cards.
 *
 * It began as v1's alone and v3 now renders this same markup, which is why the
 * `v1-` prefixed classes survive in it. Those rules are unscoped globals that
 * read only design tokens - `--card`, `--card-shadow`, `--card-shadow-hover`,
 * `--radius-card`, `--primary`, `--muted-foreground`, `--font-dm-sans` - and
 * both designs redefine every one of them, so under v3 they resolve to v3's
 * palette and type rather than v1's. Nothing here is v1's unless the markup
 * says so.
 *
 * The marks come from `techCategories`, which every design shares, so the icon
 * for a skill cannot drift from the name the other sections show. Each chip
 * keeps its level as muted micro-text - it is real content, and dropping it
 * would lose something the grid used to say.
 *
 * Two rows running in opposite directions is what stops this reading as a
 * banner: one row is a strip, two crossing strips are a field of tools.
 *
 * The loop is CSS, not JS. Nothing measures the viewport or re-renders on
 * resize - the track is a fixed three copies of the set and the animation
 * translates it by exactly one set's width. See `.v1-marquee-set` in
 * globals.css for why the sets are separate elements rather than one flat row
 * of 39 chips.
 */

/**
 * Every skill, flattened across the three categories. Order is page order.
 *
 * The element type is annotated because `techCategories` is `as const`. Left to
 * itself, `flatMap` over a union of three differently-typed readonly tuples
 * infers a union of tuples rather than one array of skills, and every `skill`
 * downstream becomes `unknown`. Naming the shape here is what collapses it back
 * to a single array.
 */
const allSkills: ReadonlyArray<{ readonly name: string; readonly level: string }> =
  techCategories.flatMap(
    (category) => category.skills as ReadonlyArray<{ name: string; level: string }>,
  );

/**
 * How many copies of the set the track holds.
 *
 * Three, because the row has to stay wider than twice the widest viewport or
 * the marquee runs out of chips and shows a gap. One set is thirteen chips at
 * roughly 140px, so three copies clear a 2560px display with room to spare.
 *
 * This is also the number the keyframes divide by: the animation translates the
 * track by a third of its own width, so it must be a third of a set count or
 * the loop lands off-seam. Changing this means changing the keyframes too.
 */
const REPEATS = 3;

const marqueeSets = Array.from({ length: REPEATS }, (_, group) => ({
  key: `set-${group}`,
  // Everything after the first is decorative repetition. Screen readers
  // otherwise announce all three copies, which turns a list of thirteen tools
  // into a list of thirty-nine.
  hidden: group > 0,
}));

type TechStackSkillsProps = {
  /**
   * Space above the first marquee row, for designs that need it.
   *
   * v1 supplies its own `mt-12`, below the lede. v3 passes nothing: its section
   * head already carries `--section-block`, and a section's first block taking a
   * top margin of its own is exactly what that rule exists to prevent.
   */
  className?: string;
};

export function TechStackSkills({ className }: TechStackSkillsProps) {
  return (
    <>
      <div className={cn("space-y-4", className)}>
        {/* Row one scrolls left, row two scrolls right. */}
        <Marquee />
        <Marquee reverse />
      </div>

      {/*
        The category descriptions.

        The marquee reads as one flat row, which loses the grouping. These keep
        it - the labels and blurbs that used to head each group in the grid, now
        below the row rather than above each third of it.
      */}
      <div className="v1-tech-groups mt-12">
        {techCategories.map((category) => (
          <div key={category.name} className="v1-tech-group">
            <p className="v1-label">{category.label}</p>
            <p className="v1-tech-group-description">{category.description}</p>
          </div>
        ))}
      </div>
    </>
  );
}

function Marquee({ reverse = false }: { reverse?: boolean }) {
  return (
    <div className={cn("v1-marquee", reverse && "v1-marquee--reverse")}>
      <div className="v1-marquee-track">
        {marqueeSets.map((set) => (
          <div
            key={set.key}
            className="v1-marquee-set"
            aria-hidden={set.hidden ? "true" : undefined}
          >
            {allSkills.map((skill) => (
              <div key={skill.name} className="v1-marquee-item">
                <BrandMark name={skill.name} className="size-5 shrink-0" />
                <span className="text-[0.9375rem] font-medium">{skill.name}</span>
                <span className="text-[0.75rem] text-muted-foreground">
                  {skill.level}
                </span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export default TechStackSkills;
