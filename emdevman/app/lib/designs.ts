/**
 * Design resolution.
 *
 * A "design" is one complete visual language for the site. Exactly one is
 * active at a time and it is recorded as `data-design` on <html>, so every
 * style decision in globals.css can key off a single attribute instead of a
 * second class or a conditional render tree.
 *
 * Precedence: ?design= query param -> localStorage -> DEFAULT_DESIGN, except
 * on the site root, which opens DEFAULT_DESIGN unless the URL names a design.
 * The root is the front door, so it does not resume the last preview; every
 * other route still does.
 */

/*
  Order is the menu's order, and the order of the v0 ring beneath it.

  v0 leads because it is the design new visitors get: a ring of the five older
  versions, each card a way into that version. The five it shows sit below it in
  the same order, newest first, so the ring and the dropup cannot disagree about
  what the versions are.

  v4 is the CV design - a yellow-and-charcoal two-column resume sheet, built
  from `app/v4/`.
*/
export const DESIGN_IDS = ["v0", "v5", "v4", "v3", "v2", "v1"] as const;

export type DesignId = (typeof DESIGN_IDS)[number];

export const DESIGN_STORAGE_KEY = "emdevman:design";
export const DESIGN_QUERY_PARAM = "design";

/**
 * v0 is the design new visitors get.
 *
 * It is deliberately the thinnest page on the site: a portrait and a ring of
 * five cards, one per older design. There is no navigation, no footer, no
 * scroll and no loading overlay, because there is nothing to navigate and
 * nothing to wait for - the whole page is one decision, and the entrance is the
 * page. Picking a card applies that design through the same path the dropup
 * uses, so every version is one click away from the front door.
 *
 * `/` is the main page, and it always opens here. A saved choice is still
 * honoured on every other route - a case study reopens in the version it was
 * being read in - and an explicit `?design=` link still names its version.
 * What the root stops doing is resuming whichever version was last previewed
 * when the tab closed, so returning to the site starts from the picker.
 *
 * The pre-paint script and the `html:not([data-design])` fallback in globals.css
 * both name v0 independently. Changing this constant alone leaves the no-JS
 * fallback pointing at the old default.
 */
export const DEFAULT_DESIGN: DesignId = "v0";

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
  v0: { label: "v0", span: "2026" },
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
  v5 - the profile design, and its legacy route
  ===========================================================================

  v5 used to live at `/v5` and be reached by navigation rather than by being
  set, because its markup only existed under that route: `data-design="v5"` on
  `/` would have rendered nothing at all. That is no longer true - the profile
  tree is a sibling of the other designs in `page.tsx`, so v5 is an ordinary
  member of DESIGN_IDS and the dropup applies it like any other.

  PROFILE_ROUTE survives only so the old address keeps working: `/v5` redirects
  to `/?design=v5`. V5_DESIGN is what that redirect and any external copy still
  quote; the menu reads `designs.v5` above.
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
 *
 * The `/` check is the one branch in here. The root is the main page, so it
 * opens the default instead of the stored preference - a reader who was
 * previewing another version when they closed the tab should land back on the
 * picker, not in the middle of a preview. A valid `?design=` still wins on the
 * root, because a link that names a version is a request rather than a memory,
 * and every other route keeps reading the stored value.
 */
export const designPrePaintScript = `(function(){var d=document.documentElement,def=${JSON.stringify(
  DEFAULT_DESIGN,
)},ids=${JSON.stringify(DESIGN_IDS)},root=window.location.pathname==="/",v=null;try{v=new URLSearchParams(window.location.search).get(${JSON.stringify(
  DESIGN_QUERY_PARAM,
)})}catch(e){}if(ids.indexOf(v)<0&&!root){try{v=localStorage.getItem(${JSON.stringify(
  DESIGN_STORAGE_KEY,
)})}catch(e){}}if(ids.indexOf(v)<0){v=def}d.setAttribute("data-design",v)})();`;
