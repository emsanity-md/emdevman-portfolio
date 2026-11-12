/**
 * The five card faces, drawn as SVG and handed to InfiniteSpiral as data URLs.
 *
 * The spiral only takes images, so a card cannot be a React component. Rather
 * than add five screenshots of five designs that would drift the moment one of
 * them changed, each face is generated from the same data the dropup reads:
 * the version label, its span, and its accent.
 *
 * A data URL keeps this to one request and no files: the string is the image.
 *
 * The plate is black brushed metal. The metal is three layers over one fill: a
 * diagonal gradient that gives the plate its value range, a broad sheen across
 * it that reads as a reflected light source, and a fine horizontal grain from
 * an SVG turbulence filter that reads as the direction the plate was polished
 * in. The top edge carries a bright hairline and the body a dark one, because
 * a flat black rectangle has no surface - it has a silhouette.
 *
 * The face is black in both themes. On charcoal it is a darker plate with a
 * lit edge; on paper it is the one black object on the page, which is the
 * point of it.
 *
 * The version number is NOT in here. It is the one word on the card that
 * names the destination, so it is real markup laid over the face rather than
 * pixels: see `V0_SPIRAL_ITEMS` below.
 *
 * Fonts inside an SVG loaded as an image cannot be the site's webfonts, so the
 * microcopy below is set in system stacks chosen to sit next to Instrument Sans
 * and IBM Plex Mono at card size: a neutral grotesque, and a mono for the
 * labels so the card's microcopy matches the page's.
 */

import { createElement } from "react";

import { designs } from "@/app/lib/designs";
import { V0_CARD_DESIGNS, type V0CardDesign } from "@/app/lib/designGlyphs";
import type { InfiniteSpiralItem } from "./InfiniteSpiral";

/** The card artwork's own pixels. 0.75 is `fit="portrait"`'s aspect. */
const W = 675;
const H = 900;
const PAD = 64;

/*
  The bottom band of the plate, in the artwork's own units.

  The version number is real markup laid over the plate, so the artwork leaves
  its space empty and these three lines are the landmarks it has to sit
  between:

    RULE_Y     the accent rule that closes the glyph's half of the plate
    655        the cap top of the version number (set in `v0.css`)
    762        its baseline
    LABEL_BASELINE  where `OPEN VERSION` sits below it

  The rule sits 35 units above the cap top and the label 43 units below the
  baseline, so the number has air on both sides and the band reads as three
  things rather than one crowded one.
*/
const RULE_Y = 620;
const LABEL_BASELINE = 820;

/**
 * One face per design.
 *
 * `glyph` is the Lucide icon that already means that version everywhere else,
 * redrawn here because the icon components cannot be serialised into an image.
 * The path data is copied from the same package the components come from.
 *
 * `ink` is the accent as it reads on black. The site's own per-version
 * accents are tuned for paper and for the thin strokes of a card face; on a
 * black plate the same value loses most of its chroma, so each one is
 * lightened here rather than at the token, where it would change every other
 * use of it.
 */
const FACES: Record<
  V0CardDesign,
  { ink: string; glyph: string; name: string }
> = {
  v5: {
    ink: "#38bdf8",
    name: "Radio",
    glyph:
      '<path d="M16.247 7.761a6 6 0 0 1 0 8.478"/><path d="M19.075 4.933a10 10 0 0 1 0 14.134"/><path d="M4.925 19.067a10 10 0 0 1 0-14.134"/><path d="M7.753 16.239a6 6 0 0 1 0-8.478"/><circle cx="12" cy="12" r="2"/>',
  },
  v4: {
    ink: "#f0a03c",
    name: "Scroll Text",
    glyph:
      '<path d="M15 12h-5"/><path d="M15 8h-5"/><path d="M19 17V5a2 2 0 0 0-2-2H4"/><path d="M8 21h12a2 2 0 0 0 2-2v-1a2 2 0 0 0-1-1H11a2 2 0 0 0-1 1v1a2 2 0 1 1-4 0V5a2 2 0 1 0-4 0v2a2 2 0 0 0 1 1h3"/>',
  },
  v3: {
    ink: "#a78bfa",
    name: "Arrow Up Right",
    glyph: '<path d="M7 7h10v10"/><path d="M7 17 17 7"/>',
  },
  v2: {
    ink: "#34d399",
    name: "Palette",
    glyph:
      '<path d="M12 22a1 1 0 0 1 0-20 10 9 0 0 1 10 9 5 5 0 0 1-5 5h-2.25a1.75 1.75 0 0 0-1.4 2.8l.3.4a1.75 1.75 0 0 1-1.4 2.8z"/><circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/><circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/><circle cx="6.5" cy="12.5" r=".5" fill="currentColor"/><circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/>',
  },
  v1: {
    ink: "#9fb0c9",
    name: "File Text",
    glyph:
      '<path d="M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z"/><path d="M14 2v5a2 2 0 0 0 1 1h5"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/>',
  },
};

function face(id: V0CardDesign) {
  const { ink, glyph } = FACES[id];
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
  const glyphTransform = `translate(${glyphX} ${glyphY}) scale(${glyphScale}) translate(-12 -12)`;

  /*
    Label sizing, in SVG units against a 675-wide viewBox drawn into a card
    140px wide at the centre of the ring: 54 units lands at about 9.4-11.2px
    across the card sizes the ring actually uses, which is the 9-10px band a
    mono label wants. They were 60 units (10.5px), and 34 before that (5.9px).

    At 54 units `EB / DESIGN` and the year do not fit on one row - the widest
    span is `2025-2026`, and the pair overruns the content width - so the year
    sits on its own line beneath the label.

    `OPEN VERSION` is checked against the corner arrow: at 54 units the label
    ends at x=464 and the arrow starts at x=559, leaving ~95 units (~20px on a
    140px card) of clearance. Shrinking the type is what creates that gap; the
    earlier 60-unit label ended at 507 with only 52 units to spare, and a longer
    string would have reached the arrow.
  */
  const labelFont =
    'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="plate" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#1c1e22"/>
      <stop offset="0.22" stop-color="#0f1013"/>
      <stop offset="0.44" stop-color="#191b20"/>
      <stop offset="0.62" stop-color="#0a0b0d"/>
      <stop offset="0.8" stop-color="#15171b"/>
      <stop offset="1" stop-color="#0c0d10"/>
    </linearGradient>
    <linearGradient id="sheen" x1="0.05" y1="0" x2="0.95" y2="1">
      <stop offset="0" stop-color="#ffffff" stop-opacity="0"/>
      <stop offset="0.34" stop-color="#ffffff" stop-opacity="0.015"/>
      <stop offset="0.47" stop-color="#ffffff" stop-opacity="0.1"/>
      <stop offset="0.52" stop-color="#ffffff" stop-opacity="0.12"/>
      <stop offset="0.58" stop-color="#ffffff" stop-opacity="0.03"/>
      <stop offset="1" stop-color="#ffffff" stop-opacity="0"/>
    </linearGradient>
    <radialGradient id="specular" cx="0.3" cy="0.14" r="0.62">
      <stop offset="0" stop-color="#ffffff" stop-opacity="0.15"/>
      <stop offset="0.5" stop-color="#ffffff" stop-opacity="0.04"/>
      <stop offset="1" stop-color="#ffffff" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="halo" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0" stop-color="${ink}" stop-opacity="0.22"/>
      <stop offset="0.6" stop-color="${ink}" stop-opacity="0.08"/>
      <stop offset="1" stop-color="${ink}" stop-opacity="0"/>
    </radialGradient>
    <filter id="brush" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB">
      <feTurbulence type="fractalNoise" baseFrequency="0.012 0.75" numOctaves="2" seed="11"/>
      <feColorMatrix type="saturate" values="0"/>
    </filter>
    <filter id="bloom" x="-60%" y="-60%" width="220%" height="220%" color-interpolation-filters="sRGB">
      <feGaussianBlur stdDeviation="13"/>
    </filter>
  </defs>

  <rect width="${W}" height="${H}" fill="url(#plate)"/>
  <rect width="${W}" height="${H}" fill="url(#sheen)"/>
  <rect width="${W}" height="${H}" fill="url(#specular)"/>
  <rect width="${W}" height="${H}" filter="url(#brush)" opacity="0.1"/>
  <rect x="0.9" y="0.9" width="${W - 1.8}" height="${H - 1.8}" fill="none" stroke="#ffffff" stroke-opacity="0.16" stroke-width="1.8"/>
  <path d="M0 2 H${W}" stroke="#ffffff" stroke-opacity="0.22" stroke-width="3.5"/>
  <path d="M2 0 V${H}" stroke="#ffffff" stroke-opacity="0.1" stroke-width="2"/>

  <circle cx="${glyphX}" cy="${glyphY}" r="176" fill="url(#halo)"/>
  <g transform="${glyphTransform}" fill="none" stroke="${ink}" stroke-width="2.2" opacity="0.5" filter="url(#bloom)">
    ${glyph}
  </g>
  <g transform="${glyphTransform}" fill="none" stroke="${ink}" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round">
    ${glyph}
  </g>

  <g font-family="${labelFont}" fill="#d2d5db">
    <text x="${PAD}" y="${PAD + 22}" font-size="54" font-weight="500" letter-spacing="1" opacity="0.66">EB / DESIGN</text>
    <text x="${PAD}" y="${PAD + 90}" font-size="54" font-weight="500" letter-spacing="1" opacity="0.42">${span}</text>
    <text x="${PAD}" y="${LABEL_BASELINE}" font-size="48" font-weight="500" letter-spacing="1" opacity="0.66">OPEN VERSION</text>
  </g>
  <path d="M${W - PAD - 52} ${H - PAD - 66} h52 v-52" fill="none" stroke="#d2d5db" stroke-width="3" opacity="0.5"/>
  <path d="M${W - PAD - 52} ${H - PAD - 66} l52 52" fill="none" stroke="#d2d5db" stroke-width="3" opacity="0.5"/>
  <path d="M${PAD} ${RULE_Y} H${W - PAD}" stroke="${ink}" stroke-width="2" opacity="0.45"/>
</svg>`;

  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

/**
 * The spiral's items, in the same newest-first order as the design menu.
 *
 * Each card is a real link to its design, so it can be opened in a new tab and
 * works without JavaScript. `label` is what the anchor announces; the version
 * number on the face is drawn as real text in the overlay rather than baked
 * into the image, so the word that names the destination is a word.
 */
export const V0_SPIRAL_ITEMS: InfiniteSpiralItem[] = V0_CARD_DESIGNS.map(
  (id) => ({
    id,
    src: face(id),
    alt: `The ${designs[id].label} design, ${designs[id].span}`,
    href: `/?design=${id}`,
    label: `Version ${designs[id].label}: ${designs[id].span}`,
    overlay: createElement(
      "span",
      { className: "v0-card__version", "aria-hidden": "true" },
      designs[id].label,
    ),
  }),
);
