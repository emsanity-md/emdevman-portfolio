/**
 * The five card faces, drawn as SVG and handed to InfiniteSpiral as data URLs.
 *
 * The spiral only takes images, so a card cannot be a React component. Rather
 * than add five screenshots of five designs that would drift the moment one of
 * them changes, each face is generated from the same data the dropup reads:
 * the version label, its span, and its accent.
 *
 * A data URL keeps this to one request and no files: the string is the image.
 * The artwork is deliberately light in both themes, because a charcoal card on
 * a near-black page has no edge - the same decision the earlier card CSS made.
 *
 * Fonts inside an SVG loaded as an image cannot be the site's webfonts, so the
 * two faces named here are system stacks. They are close enough to Geist Sans
 * and Newsreader at card size and cost nothing to load.
 */

import { designs } from "@/app/lib/designs";
import { V0_CARD_DESIGNS, type V0CardDesign } from "@/app/lib/designGlyphs";
import type { InfiniteSpiralItem } from "./InfiniteSpiral";

/** The card artwork's own pixels. 0.75 is `fit="portrait"`'s aspect. */
const W = 675;
const H = 900;
const PAD = 64;

/**
 * One face per design.
 *
 * `glyph` is the Lucide icon that already means that version everywhere else,
 * redrawn here because the icon components cannot be serialised into an image.
 * The path data is copied from the same package the components come from.
 */
const FACES: Record<
  V0CardDesign,
  { accent: string; glyph: string; name: string }
> = {
  v5: {
    accent: "#0369a1",
    name: "Radio",
    glyph:
      '<path d="M16.247 7.761a6 6 0 0 1 0 8.478"/><path d="M19.075 4.933a10 10 0 0 1 0 14.134"/><path d="M4.925 19.067a10 10 0 0 1 0-14.134"/><path d="M7.753 16.239a6 6 0 0 1 0-8.478"/><circle cx="12" cy="12" r="2"/>',
  },
  v4: {
    accent: "#b45309",
    name: "Scroll Text",
    glyph:
      '<path d="M15 12h-5"/><path d="M15 8h-5"/><path d="M19 17V5a2 2 0 0 0-2-2H4"/><path d="M8 21h12a2 2 0 0 0 2-2v-1a1 1 0 0 0-1-1H11a1 1 0 0 0-1 1v1a2 2 0 1 1-4 0V5a2 2 0 1 0-4 0v2a1 1 0 0 0 1 1h3"/>',
  },
  v3: {
    accent: "#6d28d9",
    name: "Arrow Up Right",
    glyph: '<path d="M7 7h10v10"/><path d="M7 17 17 7"/>',
  },
  v2: {
    accent: "#047857",
    name: "Palette",
    glyph:
      '<path d="M12 22a1 1 0 0 1 0-20 10 9 0 0 1 10 9 5 5 0 0 1-5 5h-2.25a1.75 1.75 0 0 0-1.4 2.8l.3.4a1.75 1.75 0 0 1-1.4 2.8z"/><circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/><circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/><circle cx="6.5" cy="12.5" r=".5" fill="currentColor"/><circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/>',
  },
  v1: {
    accent: "#475569",
    name: "File Text",
    glyph:
      '<path d="M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z"/><path d="M14 2v5a1 1 0 0 0 1 1h5"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/>',
  },
};

function face(id: V0CardDesign) {
  const { accent, glyph } = FACES[id];
  const version = designs[id].label;
  const span = designs[id].span;

  /*
    A 24-unit Lucide glyph scaled into the middle of the card. Stroke width is
    set in Lucide units (1.25), so it lands around 2.5px at the card sizes this
    page actually uses rather than the 4px a 1.75 default would give.
  */
  const glyphScale = 8.5;
  const glyphX = W / 2;
  const glyphY = 386;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" fill="#e2e5ea"/>
  <circle cx="${glyphX}" cy="${glyphY}" r="168" fill="${accent}" opacity="0.07"/>
  <g transform="translate(${glyphX} ${glyphY}) scale(${glyphScale}) translate(-12 -12)"
     fill="none" stroke="${accent}" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round">
    ${glyph}
  </g>
  <g font-family="Helvetica, Arial, sans-serif" fill="#14151a">
    <text x="${PAD}" y="${PAD + 18}" font-size="34" letter-spacing="5" opacity="0.7">EB / DESIGN</text>
    <text x="${W - PAD}" y="${PAD + 18}" font-size="34" letter-spacing="3" text-anchor="end" opacity="0.7">${span}</text>
    <text x="${PAD}" y="${H - PAD - 74}" font-size="150" font-weight="700" letter-spacing="-4">${version}</text>
    <text x="${PAD}" y="${H - PAD - 30}" font-size="34" letter-spacing="5" opacity="0.72">OPEN VERSION</text>
    <path d="M${W - PAD - 52} ${H - PAD - 66} h52 v-52" fill="none" stroke="#14151a" stroke-width="3" opacity="0.6"/>
    <path d="M${W - PAD - 52} ${H - PAD - 66} l52 52" fill="none" stroke="#14151a" stroke-width="3" opacity="0.6"/>
  </g>
  <path d="M${PAD} ${H - PAD - 118} H${W - PAD}" stroke="${accent}" stroke-width="2" opacity="0.5"/>
</svg>`;

  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

/**
 * The spiral's items, in the same newest-first order as the design menu.
 *
 * Each card is a real link to its design, so it can be opened in a new tab and
 * works without JavaScript. `label` is what the anchor announces; the face
 * already carries the version number visually.
 */
export const V0_SPIRAL_ITEMS: InfiniteSpiralItem[] = V0_CARD_DESIGNS.map(
  (id) => ({
    id,
    src: face(id),
    alt: `The ${designs[id].label} design, ${designs[id].span}`,
    href: `/?design=${id}`,
    label: `Version ${designs[id].label}: ${designs[id].span}`,
  }),
);
