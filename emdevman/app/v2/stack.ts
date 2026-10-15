import { techCategories } from "@/app/lib/tech";

/**
 * The stack section's three columns, derived from `lib/tech.ts`.
 *
 * A view over the shared list rather than a second one, for the reason every
 * other file in `lib/` exists: the toolkit is written down once and four designs
 * read it, so a column here cannot drift from a card in v3 or a list in v1.
 *
 * Two things are dropped on the way through, and both are the point:
 *
 *   - The `level` field ("Expert", "Advanced", "Intermediate") is not rendered.
 *     It stays in the data because v4 converts it to a percentage and v1 and v5
 *     show it as a chip, but a label like that is a claim about the person
 *     rather than about the work, and three designs disagreeing about it is the
 *     whole reason it should not be here.
 *   - The descriptions. Three sentences explaining what "Frontend" means sit
 *     above a list of four technologies that say it themselves.
 *
 * The column titles and the one shortened name are renamed because the shared
 * list was written for a layout with an icon and a subtitle per group. Nothing
 * is added - `Tailwind CSS` and `Tailwind` are the same technology.
 */
export interface StackColumn {
  title: string;
  items: string[];
}

const COLUMN_TITLES: Record<string, string> = {
  Frontend: "Frontend",
  Backend: "Backend and data",
  "DevOps & Tools": "Tools",
};

/** The one name the shared list spells longer than this design does. */
const NAME_OVERRIDES: Record<string, string> = {
  "Tailwind CSS": "Tailwind",
  "Git / GitHub": "Git/GitHub",
};

export const stackColumns: StackColumn[] = techCategories.map((category) => ({
  title: COLUMN_TITLES[category.name] ?? category.name,
  items: category.skills.map(
    (skill) => NAME_OVERRIDES[skill.name] ?? skill.name,
  ),
}));

/**
 * The tinted strip under the columns.
 *
 * Its own sentence rather than a line of `lib/tech.ts`, because it is a claim
 * about how the work gets done rather than a fact about the toolkit - and it is
 * the one part of this section that v1, v3 and v5 have no equivalent of.
 */
export const aiApproach = {
  label: "How I work with AI",
  body: "I use Claude and Codex to move faster, then review, test, and own everything that ships.",
} as const;