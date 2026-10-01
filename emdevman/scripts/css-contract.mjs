/**
 * The component classes the rendered pages depend on.
 *
 * Shared by `verify-css.mjs` (checks the local build) and `verify-deploy.mjs`
 * (checks the live site), so the two cannot drift apart and pass while disagreeing
 * about what "correct" means.
 *
 * Grouped by the section that owns them, so a failure names the area rather than
 * just the class. Every entry is a hand-written rule in `app/globals.css` that
 * markup references directly - the kind of rule that disappears when the
 * stylesheet is from an older build.
 *
 * Why an explicit list rather than deriving it from the markup: the derived
 * version reports ~234 false positives on a healthy build, because most class
 * names are Tailwind utilities that never appear as literal selectors. They carry
 * variants (`hover:`, `dark:`, `aria-invalid:`), arbitrary values (`w-[42px]`),
 * opacity modifiers (`bg-black/10`) or child selectors (`[&_svg]:size-4`), and
 * the v4 engine emits them under generated names.
 *
 * Add an entry when a section gains a class that carries real styling and is not
 * also a Tailwind utility.
 */
export const CONTRACT = {
  "GitHub calendar": [
    "gh-grid", "gh-week", "gh-month", "gh-dot", "gh-dot-0", "gh-dot-1",
    "gh-dot-2", "gh-dot-3", "gh-dot-4", "gh-legend", "gh-calendar",
  ],
  "Projects deck": [
    "project-deck", "project-deck-card", "project-deck-sizer",
    "project-deck-card.is-center", "project-deck-card.is-left",
    "project-deck-card.is-right",
  ],
  "Project deck cards": [
    "project-card", "project-featured", "project-deck", "filter-pill",
  ],
  "Shared surfaces": [
    "panel", "surface-card", "card-pad", "pill-tag", "section-head-v3",
    "section-block", "section-note", "section-index", "section-action",
  ],
  "v3 navigation": [
    "sidebar", "sidebar-link", "sidebar-link--active", "sidebar-link-arrow",
    "sidebar-cta", "topbar", "overlay-link", "overlay-link--active",
  ],
  "Theme control": ["theme-switch", "theme-opt", "theme-opt--active"],
  "Design switch": [
    "design-switch", "design-switch-trigger", "design-switch-menu",
    "design-switch-item", "design-switch-item--active",
  ],
  "Texture": ["halftone", "halftone--corner", "portrait-halftone"],
  "Stats": ["stats", "stat", "stat-value", "stat-label"],
  /*
    v4, the CV design.

    Present even though v1's classes are not, and the reason is worth recording:
    while building v4 a truncated block comment swallowed every rule after it,
    so `.v4-project-links` and its neighbours were silently dropped by the
    minifier. Nothing failed. The page rendered - just unstyled, with the skill
    list stacked and the project's links one per line. An explicit contract entry
    turns exactly that failure into a build error, and these are the rules that
    carry real styling rather than being Tailwind utilities.
  */
  "v4 CV": [
    "v4-inner", "v4-sheet", "v4-rail", "v4-rail-inner", "v4-main", "v4-band", "v4-band-name",
    "v4-band-family", "v4-band-title", "v4-band-tagline", "v4-main-body",
    "v4-track", "v4-track-line", "v4-tl-bar", "v4-tl-dot", "v4-head",
    "v4-head-icon", "v4-head-title", "v4-dash", "v4-body",
    "v4-entry", "v4-entry-head", "v4-entry-title", "v4-entry-years",
    "v4-entry-detail", "v4-entry-summary",
    "v4-contact-list", "v4-contact-row",
    "v4-contact-label", "v4-contact-value", "v4-skill-group",
    "v4-skill-group-label", "v4-skill-pair", "v4-skill", "v4-skill-head",
    "v4-skill-name", "v4-skill-value", "v4-skill-track", "v4-skill-fill",
    "v4-justify",
    "v4-project", "v4-project--collapsed", "v4-project-head", "v4-project-thumb", "v4-project-title",
    "v4-project-open", "v4-project-role", "v4-project-summary",
    "v4-project-links", "v4-project-link", "v4-project-category",
    "v4-projects-toggle", "v4-projects-toggle-btn", "v4-projects-toggle-chevron",
    "v4-portrait", "v4-portrait-frame", "v4-portrait-band", "v4-zzz", "v4-controls",
    "v4-corner", "v4-corner--tl", "v4-corner--br",
  ],
  // v3's case-study shell only. The other case-* names in globals.css appear in
  // a comment recording rules deleted with v2's markup, so they are deliberately
  // absent here and must stay that way.
  "Case study": ["case-page", "case-inner", "case-title"],
};

/**
 * Does this text define the given selector?
 *
 * Substring match on a literal `.name` rather than a real CSS parse: the output
 * is minified, so a class appears as `.name{` or `.name,` or `.name:hover`, and
 * a plain containment test is enough to tell a rule from a substring of a longer
 * name.
 */
export function hasRule(css, name) {
  return css.includes(`.${name}`);
}

/**
 * The contracted classes missing from a stylesheet, grouped for reporting.
 */
export function missingRules(css) {
  const missing = new Map();
  for (const [group, names] of Object.entries(CONTRACT)) {
    const absent = names.filter((name) => !hasRule(css, name));
    if (absent.length > 0) missing.set(group, absent);
  }
  return missing;
}

/** Total number of contracted classes, for the summary line. */
export const CONTRACT_SIZE = Object.values(CONTRACT).flat().length;

/** Renders a grouped miss list the way both scripts print it. */
export function formatMissing(missing) {
  const total = [...missing.values()].flat().length;
  const groups = [...missing]
    .map(([group, names]) => `\n  ${group}:\n${names.map((n) => `    .${n}`).join("\n")}`)
    .join("\n");
  return `${total} styled class(es) are missing from the stylesheet.\n` +
    `The markup references them, so they render unstyled and invisible:\n${groups}`;
}
