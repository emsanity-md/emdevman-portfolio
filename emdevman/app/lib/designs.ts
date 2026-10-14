/**
 * Design resolution.
 *
 * A "design" is one complete visual language for the site. Exactly one is
 * active at a time and it is recorded as `data-design` on <html>, so every
 * style decision in globals.css can key off a single attribute instead of a
 * second class or a conditional render tree.
 *
 * Precedence: ?design= query param -> localStorage -> DEFAULT_DESIGN.
 */

/*
  Order is the switch cycle: each press moves one step along the list and wraps
  back to the first. The oldest design sits last so a press off the newest walks
  down through the designs rather than jumping to the oldest one.

  v4 is the CV design - a yellow-and-charcoal two-column resume sheet, built
  from `app/v4/`. It leads the list because it is the most recent.
*/
export const DESIGN_IDS = ["v5", "v4", "v3", "v2", "v1"] as const;

export type DesignId = (typeof DESIGN_IDS)[number];

/**
 * The designs in the order a visitor is shown the project's history: oldest
 * first. `DESIGN_IDS` reads the other way because it is also the switch cycle,
 * where a press moves one step and wraps - and leading with the newest there is
 * what makes a press walk backwards through the designs rather than jumping to
 * the oldest one.
 *
 * Every design in `DESIGN_IDS` is reachable from `/` through the switcher's
 * menu: `page.tsx` mounts the v5 tree inside `.v5-only`, and the gate for that
 * class keys off `data-design="v5"` exactly as the others do. `/v5` remains a
 * route of its own, but it is not the only way in.
 */
export const DESIGN_IDS_OLDEST_FIRST = [...DESIGN_IDS].reverse() as readonly DesignId[];

export const DESIGN_STORAGE_KEY = "emdevman:design";
export const DESIGN_QUERY_PARAM = "design";

/**
 * v3 is the design new visitors get.
 *
 * Note for anyone who had `aurora` stored before the rename to v2: that value no
 * longer validates, so the pre-paint script falls through to the default and they
 * will land on v3. Pick v2 from the switcher (or `?design=v2`) once and it
 * persists. Deliberately not aliased, so the old name is gone from the codebase.
 */
export const DEFAULT_DESIGN: DesignId = "v3";

/**
 * What the switch's menu shows for each design.
 *
 * `span` is when that design was current, which is what the menu lists instead of
 * a description. It reads as a version history rather than a feature list, and it
 * stays true as a design gains and loses things - the palette moves around, the
 * dates do not.
 *
 * Overlapping ranges are deliberate: v3 and v4 are both live in 2026, v2 spans
 * into the same year, and v1's period covers the work that became them.
 */
export const designs: Record<DesignId, { label: string; span: string }> = {
  v5: { label: "v5", span: "2026" },
  v4: { label: "v4", span: "2026" },
  v3: { label: "v3", span: "2026" },
  v2: { label: "v2", span: "2025-2026" },
  v1: { label: "v1", span: "2023-2025" },
};

export function isDesignId(value: unknown): value is DesignId {
  return (
    typeof value === "string" && (DESIGN_IDS as readonly string[]).includes(value)
  );
}

/*
  ===========================================================================
  v5 - the profile design. Not a member of DESIGN_IDS, on purpose.
  ===========================================================================

  v5 lives at its own route rather than being a fifth entry in the list, so it
  never appears here. DESIGN_IDS drives three things: the pre-paint script, which
  validates `?design=` and the stored value against it before writing
  `data-design`, and the switcher's menu, which applies an id through
  `setDesign`. Adding "v5" would mean `/` could resolve to `data-design="v5"` -
  and since v5's markup only exists on `/v5`, that page would render nothing at
  all. Every rule below is therefore `display: none` and the reader gets a blank
  document.

  So v5 is reached by navigation rather than by being set: the switcher renders
  one extra row, a link to PROFILE_ROUTE, and that row is deliberately not a
  `role="menuitem"` - a menuitem implies "pressing this changes the current
  value", and pressing this leaves the page. It is a link in a menu, which is a
  normal thing for a menu to contain.

  The `span` is when the design is current, which is what the menu lists instead
  of a description, on the same reasoning as the four above.
*/
export const PROFILE_ROUTE = "/v5";

export const V5_DESIGN = {
  label: "v5",
  span: "2026",
} as const;

export function writeStoredDesign(design: DesignId) {
  try {
    window.localStorage.setItem(DESIGN_STORAGE_KEY, design);
  } catch {
    // Nothing to do - the design is already applied for this visit.
  }
}

/**
 * Runs before first paint so the active design is on <html> when the first
 * frame renders, rather than snapping into place after hydration. Kept as a
 * string because it cannot wait for React to boot, and therefore cannot
 * import anything.
 */
export const designPrePaintScript = `(function(){var d=document.documentElement,def=${JSON.stringify(
  DEFAULT_DESIGN,
)},ids=${JSON.stringify(DESIGN_IDS)},v=null;try{v=new URLSearchParams(window.location.search).get(${JSON.stringify(
  DESIGN_QUERY_PARAM,
)})}catch(e){}if(ids.indexOf(v)<0){try{v=localStorage.getItem(${JSON.stringify(
  DESIGN_STORAGE_KEY,
)})}catch(e){}}if(ids.indexOf(v)<0){v=def}d.setAttribute("data-design",v)})();`;
