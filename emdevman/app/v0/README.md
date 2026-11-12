# Design v0 — the front door

v0 is the default design and the front door of the site. It is one viewport
containing a header, a two-line name, a portrait, and a spiral of five cards —
one per older design. Picking a card opens that version.

There is no navbar, no footer, no dropup and no reading. There is one decision,
so the page gives that decision the whole screen.

## Files

| File | What it owns |
| --- | --- |
| `V0Home.tsx` | The page: header, name, accent bar, links, toolkit marks, portrait, texture, entrance |
| `LightRays.tsx` | The WebGL light-ray backdrop, React Bits' component kept close to upstream |
| `LightRays.css` | The rays' own stylesheet, also close to upstream |
| `InfiniteSpiral.tsx` | React Bits' spiral, kept close to upstream |
| `InfiniteSpiral.css` | The spiral's own stylesheet, also close to upstream |
| `v0CardArt.ts` | The five card faces, generated as SVG data URLs |
| `v0.css` | All of v0's styling, plus the rules that hide the shared chrome |
| `README.md` | This document |

`v0.css`, `LightRays.css` and `InfiniteSpiral.css` are imported from their
components rather than appended to `globals.css`, so nothing outside v0 carries
their bytes. The few rules that must reach outside the design (hiding the shared
chrome) are attribute-scoped to `html[data-design="v0"]`.

Entry points: `app/page.tsx` renders it inside `.v0-only`, which `globals.css`
shows only for v0 — and also for `html:not([data-design])`, so the pre-paint
frame and the no-JS case fall back to v0 instead of a blank page. `DEFAULT_DESIGN`
in `app/lib/designs.ts` names v0 in two more places (the pre-paint script and the
boot overlay), so changing the default there means changing the fallbacks too.

## Layout

One fixed stage, `position: fixed; inset: 0`, so the document is exactly one
viewport tall. Fixed rather than a tall section because the shell is a column
flex box with a minimum viewport height: a v0 in normal flow would leave the
document one scrollbar tall at some zoom levels.

Stacking order is the composition:

1. **Texture** (`z-index: 0`) — light rays, a wash of light, grain.
2. **Portrait** (`z-index: 1`) — bottom-anchored, sized by viewport height.
3. **Name and sign-off** (`z-index: 2`) — set over the portrait's shoulder.
4. **Cards** (`z-index: 3`) — beside the portrait, never across it.
5. **Header** (`z-index: 4`) — always on top.

The `z-index: 2` in line 3 belongs to the column's *children*, not to the column.
A positioned element with a `z-index` is a stacking context, and a stacking
context is a blending boundary — so a `z-index` on the column would cut the
sign-off off from the portrait it blends against. The column itself carries
none.

Header: `EB` / rule / `Software Developer` on the left, `IDEA / EXECUTE /
IMPROVE` on the right, both in the same gutter as everything else — header, name
column, sign-off and the card stage all share the one right and left margin.

Left column: `EMMANUEL` in Instrument Sans at 700 with `-0.01em` tracking over
`BITANCOR` in Instrument Serif at 400, tracked wide. The tracking on the first
name was `-0.038em`, which closed the letters into each other at display size;
`-0.01em` opens them without losing the tight, deliberate look. The surname is a
single-weight display serif, and that is what makes it sit lighter than the sans
above it — the contrast is the two families, not a weight setting. Three small
bars follow — red, pale, dark, separated by a few pixels so the accent reads as
three marks rather than one striped rule — then the Github / LinkedIn / Email
links, then the toolkit's marks, then the vertical rule and "Let's build
something great". The mockup's two annotation lines are not rendered.

The portrait is sized by height, not `object-fit`: `cover` would crop the head
off on a wide desktop and `contain` would shrink the figure to a stamp on a
phone. It is anchored to the bottom and fills the stage (100% of its height),
except below 1150px where a short viewport would push the head under the last
letters of "EMMANUEL"; there it holds at 92%. Its right edge sits 35.5% in from
the right of the viewport — a fixed distance from the card column, so the gap
between the figure and the cards stays the same from 1024 to 1920 instead of
closing as the viewport narrows. The container clips what leaves the left and
right.

## Typography

Three families, one job each, loaded with `next/font/google` in
`app/layout.tsx`:

| Role | Family | Where it appears |
| --- | --- | --- |
| Sans | Instrument Sans 400/500/600/700 | `EMMANUEL`, the header mark, the links, card numbers |
| Serif | Instrument Serif 400 (normal + italic) | `BITANCOR` |
| Mono | JetBrains Mono 400/500 | the motto, the sign-off line, card labels |

The next/font variables keep their original names — `--font-dm-sans`,
`--font-newsreader`, `--font-ibm-plex-mono` — because dozens of rules across
`globals.css` and `v0.css` reference them by name. Only the families behind them
changed. The `--font-sans` / `--font-serif` / `--font-mono` roles in
`globals.css`'s `@theme inline` block resolve onto those variables, so `font-sans`
and the other Tailwind utilities still reach the right family.

Every family is loaded with `display: "swap"` and a metric-matched `…Fallback`
stack, which is what keeps the name from reflowing when the webfonts arrive.

A few sizes are floors rather than preferences:

- Mono microcopy never goes below **12px**, and card labels never below
  **10px**. The motto's two responsive overrides used to drop it to 8–9px; they
  now hold 12px and give up tracking instead, because mono under 12px stops being
  readable rather than merely small.
- Mono tracking is `0.1em`. It was `0.22em`, which read as a ledger rather than a
  motto.
- The links are 16px at weight 500 in the page's `--foreground`, not an
  inherited 82% opacity — that was the lowest-contrast text on the page against
  charcoal. Their underline is drawn transparent from the start and faded in on
  hover, so nothing reflows.

The card faces are SVG data URLs, which cannot use the site's webfonts. They
name system stacks instead: a neutral grotesque for the version number and a
monospace for `EB / DESIGN`, `OPEN VERSION` and the year, so the card microcopy
matches the page's mono without shipping a second font file.

## The sign-off

Below the links, the block closes the composition in two rows: the toolkit's
marks, then a rule and "Let's build something great".

The thirteen marks are `BrandMark` rendered from the same `techCategories` the
toolkit section uses, in page order — one row, one size, no chips and no
labels, because this is a signature rather than a second list of skills. The
names survive for screen readers only.

The whole block is white under `mix-blend-mode: difference`. That is what lets
one rule work on both grounds: white reads as ink on the light theme's paper and
as light marks on the dark theme's charcoal, and where the block crosses the
portrait's dark cloth at 1024 it flips to light on its own. The plain rule
outside the `@supports` block is the fallback for a browser without blending —
there the block keeps the page's foreground colour.

The blend only works while the block can see the stage. It is a descendant of
the name column, and a column with a `z-index` is a stacking context, which
would be a blending boundary with nothing in it but the name — so the block
would composite as flat white, and white is invisible on paper. The column
carries no `z-index` for exactly that reason; see the stacking list above.

## The texture

The backdrop is **light rays** — React Bits' [LightRays](https://reactbits.dev)
in `LightRays.tsx`, a WebGL beam falling from the top of the frame — under two
CSS layers:

1. **Rays** — a WebGL2 fragment shader on a transparent canvas. A beam of light
   comes down from `top-center`, splits into drifting shafts, and passes through
   haze. It follows the cursor by a small amount, casts a soft shadow behind the
   pointer and sends a wave down the rays on click. The layer is masked to fade
   out toward the bottom of the stage, so the beam dissolves into the page
   instead of ending on a hard edge behind the portrait.
2. **Wash** — a soft light behind the portrait, a cooler one in the top right,
   and an inset shadow in the page's own background colour that vignettes the
   edges. This is also what keeps the canvas from reading as a coloured box.
3. **Grain** — a tiled, desaturated `feTurbulence` SVG screened over charcoal
   and multiplied over paper, which keeps the beam from looking like plastic.

The canvas is transparent, so the page's own `--background` shows through it;
the rays add light rather than paint a colour. Because a white beam blows out
paper, the light theme damps the layer to `opacity: 0.4` and blends it with
`multiply`, so it reads as ink on paper rather than as a white slab. Dark mode
keeps it near full strength.

The rays are one of two things on the page that move, the spiral being the
other. They render a single static frame under `prefers-reduced-motion:
reduce`, pause while the tab is hidden or the layer is off screen, and the whole
layer is `aria-hidden` and `pointer-events: none`. If WebGL2 is unavailable the
canvas is simply absent and the page keeps its flat background colour.

## The cards

The cards are React Bits' [InfiniteSpiral](https://reactbits.dev), TypeScript +
CSS variant. Five portrait faces ride a vertical helix that turns on its own,
can be dragged, and follows the page scroll on a phone. Every card is a real
anchor, so ctrl-click, middle-click and "open in new tab" work and the
no-JavaScript fallback points at exactly the same five destinations.

Both source files are kept close to the published component. Two local changes:

- the stylesheet is imported from the component instead of globally;
- `v0.css` overrides only the card chrome (border and shadow) for the light
  theme, where the component's white hairline disappears, and adds a
  `focus-visible` ring the component does not ship.

The stage is the right-hand column: from 65% of the viewport width to the
header's gutter, top 14% to bottom 2%. It deliberately sits beside the portrait
rather than across it — the figure's right edge is pinned 35.5% from the right,
so the cards never cover the body at any desktop width. Nothing is masked: the
component fades and blurs its own outer cards, so the edges dissolve without a
CSS mask.

The stage used to run from 43% down to 4%. That is a 53%-tall box whose centre
sat at 69.5% of the viewport, so the helix hung in the bottom third, the top
right of the page was empty, and the bottom card was cut off by the viewport
edge. It is now an 84%-tall box centred at 56%, which is the height of the
name column beside it. The helix is about 445px tall at its widest travel and
the box is 756px at 1440×900, so no card is ever clipped by the edge and the
component's own fade does the blending.

The tuned values are the ones in `V0Home.tsx`: `radius={132}`, cards 118×157,
`verticalSpacing={58}`, five per turn, a 16° rotation so no card sits dead
centre, and a 1.16 centre scale. They make the ring fill the column without
clipping at 1024 (the component scales itself by width and height) while keeping
the version numerals readable. Only the front two or three faces are legible at
once; the rest are behind them, which is what a helix is. Because the ring
turns, every card comes to the front on its own within one revolution.

Card faces are generated in `v0CardArt.ts` from the same `designs` data the
dropup reads: version, span, and accent, with the Lucide glyph that already
means that version elsewhere on the site. They are SVG data URLs because the
spiral only takes images; a screenshot per design would drift the moment one of
them changed. The artwork is pale in both themes, because a charcoal card on a
near-black page has no edge.

The ring turns automatically (`animationMode="all"`, `speed={0.3}`), which is
the motion the component exists for. It eases to a stop while hovered
(`pauseOnHover`) and stops entirely under `prefers-reduced-motion`, so the
page always has a way to be still. It has no keyboard pause control; if that
becomes a requirement, the component needs one added rather than a CSS
workaround.

## Picking a card

Clicking a card opens that version. The anchor's own `href` is a `?design=`
address, and an unmodified left click is intercepted so the design changes in
place inside the circular reveal, grown from the card that was pressed. Modified
clicks are left alone and navigate; a drag is cancelled by the component before
the click is handled, so turning the ring never opens a version by accident.

Keyboard: Tab reaches each card as a normal link, and Enter opens it. There is
no roving focus — the spiral is a list of links, not a single composite widget.

## Accessibility

- The name is the page's visible `h1`.
- The spiral is a `role="list"` of five links, each with its version and span
  as an accessible label. The visible face carries the same number.
- Every card is a real anchor, so the page is a picker without script too, and
  the fallback list repeats the same five destinations.
- Focus rings use the `--ring` token; the spiral has none of its own, so
  `v0.css` adds an inset outline that survives the 3D transforms.
- The portrait and the texture are `aria-hidden`.

## Theme

Dark is the reference. The cards are pale in both themes — the mockup's figure,
and the only way a card has an edge on charcoal. The texture, the wash and the
vignette all mix from the page's own tokens, so nothing is hard-coded twice. The
per-version accents (`--v0-v5` … `--v0-v1`) live on the card artwork.

## Responsive

Above 900px the page is a single non-scrolling screen. Below it, the page stacks
header → name, links and sign-off → portrait → cards and scrolls normally: a
phone cannot hold a name this size, a portrait and a card row in one viewport
at a readable scale, so it is allowed to scroll rather than shrunk until it
fits.

## Reduced motion and no JavaScript

- `prefers-reduced-motion: reduce`: the spiral stops its automatic travel and
  only moves when dragged or scrolled. The page's entrance is already gated on
  `no-preference`.
- `@media (scripting: none)`: the spiral places its cards with script, so
  `.v0-spiral` is hidden and `.v0-fallback` shows five real links in the same
  card shape. Every link is a `?design=` address the server already understands.

## What v0 deliberately does not have

Sections, nav, footer, the design dropup, a boot overlay, a scroll region above
900px, captions, and card shadow. Each one either duplicates the cards, assumes
a page that is not here, or competes with the portrait.

## Unused since the card changes

`V0Carousel.tsx` (the vertical marquee) and its rules in `v0.css` — the
`v0-gallery*`, `v0-track*`, `v0-card*` and `v0-pause` blocks — are no longer
mounted. They are left in place only until that file is deleted; nothing on the
page selects them.
