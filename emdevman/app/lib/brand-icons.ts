import {
  siFigma,
  siFirebase,
  siGithub,
  siMysql,
  siNextdotjs,
  siNodedotjs,
  siPostman,
  siReact,
  siSupabase,
  siTailwindcss,
  siTypescript,
  siVercel,
} from "simple-icons";

export interface BrandMark {
  title: string;
  path: string;
}

/**
 * Visual Studio Code, inlined.
 *
 * Simple Icons has no VS Code entry - it was removed over the trademark - and
 * the closest thing in the package is the VSCodium mark, which is a visibly
 * different drawing. This is the entry from simple-icons@9, the last release
 * that shipped one.
 *
 * Provenance, since it is a literal string in a source file rather than an
 * import:
 * - `unpkg.com/simple-icons@9.0.0/icons/visualstudiocode.svg`, hex `007ACC`,
 *   which is Microsoft's own VS Code blue, sourced from Wikimedia Commons.
 * - Cross-checked geometrically against devicon's `vscode-plain.svg`, an
 *   unrelated project. They are independently redrawn, so a textual comparison
 *   proves nothing, but flattening both outlines into a 24 unit box and
 *   comparing gives a worst-case deviation of 0.036 (0.15%, rounding) with
 *   identical bounding boxes and areas matching to 0.01%. Same mark.
 */
const visualStudioCode: BrandMark = {
  title: "Visual Studio Code",
  path:
    "M23.15 2.587L18.21.21a1.494 1.494 0 0 0-1.705.29l-9.46 8.63-4.12-3.128a.999.999 0 0 0-1.276.057L.327 7.261A1 1 0 0 0 .326 8.74L3.899 12 .326 15.26a1 1 0 0 0 .001 1.479L1.65 17.94a.999.999 0 0 0 1.276.057l4.12-3.128 9.46 8.63a1.492 1.492 0 0 0 1.704.29l4.942-2.377A1.5 1.5 0 0 0 24 20.06V3.939a1.5 1.5 0 0 0-.85-1.352zm-5.146 14.861L10.826 12l7.178-5.448v10.896z",
};

/**
 * Real brand marks for the toolkit, from Simple Icons (CC0-1.0), keyed by the
 * label the tile already shows.
 *
 * `hex` is deliberately not carried over. These render `fill="currentColor"`,
 * so a mark is whatever the tile's text colour happens to be - one grey in
 * light, one in dark - which is the entire point of a monochrome design. Pulling
 * the brand colour back in would reintroduce the eleven-colour problem the v3
 * palette exists to avoid, and it would be wrong in dark mode regardless, where
 * React's `#61DAFB` on a `#0c0c0f` page is a glow rather than a mark.
 *
 * Keying by the visible label means the name and the mark cannot drift apart.
 * A label that gets renamed simply misses the map and the tile falls back to its
 * monogram, which is a visible degradation rather than a broken icon.
 *
 * Two notes on the entries:
 * - `Git / GitHub` takes the GitHub mark, since that is the recognisable half.
 * - `VS Code` is inlined above, because Simple Icons no longer ships it.
 */
export const brandMarks: Record<string, BrandMark | undefined> = {
  "Next.js": siNextdotjs,
  React: siReact,
  TypeScript: siTypescript,
  "Tailwind CSS": siTailwindcss,
  "Node.js": siNodedotjs,
  MySQL: siMysql,
  Supabase: siSupabase,
  Firebase: siFirebase,
  "Git / GitHub": siGithub,
  Postman: siPostman,
  Vercel: siVercel,
  Figma: siFigma,
  "VS Code": visualStudioCode,
};
