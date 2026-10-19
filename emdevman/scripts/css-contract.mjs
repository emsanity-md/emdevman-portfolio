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
  "Texture": ["halftone", "halftone--corner", "portrait-halftone", "v3-grid"],
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
  /*
    The loading overlay.

    A terminal window drawn in CSS, which replaced a 285KB boot animation that
    was a picture of the same thing. Every class here carries real styling
    rather than being a Tailwind utility, so a rule going missing would leave
    the overlay unstyled rather than merely plain - which is exactly the
    failure this contract exists to catch.

    Listed because the overlay is mounted in the root layout and appears over
    every design, so a broken build here is a broken first impression on all
    five of them.
  */
  "Loading overlay": [
    "loading-overlay", "loading-shell", "loading-window", "loading-window-bar",
    "loading-window-dots", "loading-window-title", "loading-window-body",
    "loading-prompt", "loading-prompt-mark", "loading-steps", "loading-step",
    "loading-step--done", "loading-step--link", "loading-step-label",
    "loading-step-mark", "loading-step-verdict", "loading-diag",
    "loading-diag-head", "loading-diag-dot", "loading-diag-dot--danger",
    "loading-diag-verdict", "loading-diag-detail", "loading-spark",
    "loading-spark-bar", "loading-metrics", "loading-metric",
    "loading-metric-key", "loading-metric-value",
  ],
  /*
    v5, the profile design.

    These live in `app/v5/v5.css` rather than in globals.css, because v5 is a
    route rather than a design value and nothing outside `/v5` can select it. The
    contract does not care where a rule lives - it cares whether the class the
    markup references survives minification - so the list is the same shape as
    v4's and catches the same class of failure: a truncated block comment or a
    bad nesting that drops a rule silently and renders the page unstyled with
    nothing failing.

    The token names are in the list too, since `--v5-page` is what the avatar's
    ring is painted with and `--v5-heat-*` are what the whole calendar is - if a
    minifier dropped one of those, the page would build and the calendar would be
    a field of default-grey squares.
  */
  "v5 profile": [
    "v5-root", "v5-frame", "v5-rail", "v5-rail--left", "v5-rail--right",
    "v5-column", "v5-sticky", "v5-topbar", "v5-topbar-row", "v5-icon-btn",
    "v5-brand", "v5-nav", "v5-nav-link", "v5-nav-icon", "v5-cta", "v5-mini",
    "v5-mini-name", "v5-mini-handle", "v5-banner", "v5-profile-head",
    "v5-avatar", "v5-avatar--sm", "v5-avatar--xs", "v5-profile-row", "v5-btn",
    "v5-btn--solid", "v5-btn--outline", "v5-btn--quiet", "v5-btn--sm",
    "v5-identity", "v5-meta-row", "v5-meta", "v5-meta-icon", "v5-stats",
    "v5-stat", "v5-stat-value", "v5-tabbar", "v5-tabs", "v5-tab",
    "v5-post", "v5-post-head", "v5-post-name", "v5-post-handle",
    "v5-post-body", "v5-post-actions", "v5-action", "v5-action-btn",
    "v5-action-icon", "v5-badge-check", "v5-media", "v5-chips", "v5-chip",
    "v5-chip--accent", "v5-card", "v5-card--plain", "v5-card-title",
    "v5-rail-card", "v5-rail-title", "v5-search", "v5-search-input",
    "v5-featured-row", "v5-rail-link", "v5-cal-scroll", "v5-cal-inner",
    "v5-cal-days", "v5-cal-grid", "v5-cal-month", "v5-cal-cell",
    "v5-heat-0", "v5-heat-1", "v5-heat-2", "v5-heat-3", "v5-heat-4",
    "v5-legend", "v5-legend-cell", "v5-select", "v5-bottom-nav",
    "v5-bottom-item", "v5-fab",
  ],
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
