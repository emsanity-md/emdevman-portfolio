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
  back to the first. v1 sits last so a press off v3 walks down through the
  designs rather than jumping to the oldest one.
*/
export const DESIGN_IDS = ["v3", "v2", "v1"] as const;

export type DesignId = (typeof DESIGN_IDS)[number];

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
 * Overlapping ranges are deliberate: v2 and v3 were both live in 2026, and v1's
 * period covers the work that became them.
 */
export const designs: Record<DesignId, { label: string; span: string }> = {
  v3: { label: "v3", span: "2026" },
  v2: { label: "v2", span: "2025-2026" },
  v1: { label: "v1", span: "2023-2025" },
};

export function isDesignId(value: unknown): value is DesignId {
  return (
    typeof value === "string" && (DESIGN_IDS as readonly string[]).includes(value)
  );
}

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
