# Design v0 — the front door

v0 is the default design and the front door of the site. On a desktop it is one
viewport containing a header, a two-line name, a portrait, and a spiral of five
cards — one per older design. Picking a card opens that version.

On a phone it becomes a different composition: a vertical, cinematic portrait
with the figure above the name, the toolkit and sign-off below it, and a fixed
scroll cue at the bottom. The spiral gives way to a full-screen versions menu
behind a hamburger in the top-right corner.

There is no navbar, no footer, no dropup and no reading. There is one decision,
so the page gives that decision the whole screen.

## Files

| File | What it owns |
| --- | --- |
| `V0Home.tsx` | The page: header, name, accent bar, links, toolkit marks, portrait, texture, versions menu, scroll cue, entrance |
| `SplitText.tsx` | React Bits' per-letter reveal, used for the two name lines and kept close to upstream |
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
5. **Header** (`z-index: 4`) — always on top on a desktop.
6. **Scroll cue** (`z-index: 6`, phones only) — fixed to the bottom edge.
7. **Versions menu** (`z-index: 30`, phones only) — a full-screen dialog, last
   in the tree and above everything, because it is a modal.

The `z-index: 2` in line 3 belongs to the column's *children*, not to the column.
A positioned element with a `z-index` is a stacking context, and a stacking
context is a blending boundary — so a `z-index` on the column would cut the
sign-off off from the portrait it blends against. The column itself carries
none.

Header: `EB` / rule / `Software Developer` on the left, `IDEA / EXECUTE /
IMPROVE` on the right, both in the same gutter as everything else — header, name
column, sign-off and the card stage all share the one right and left margin.

On a phone the header loses the role and the motto and becomes two marks: `EB`
on the left and the hamburger on the right, both on the page's side gutter. The
page stops being a fixed stage and becomes a normal scrolling column — see
[The phone layout](#the-phone-layout).

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

On a phone the portrait is re-fitted rather than cropped: `object-fit:
contain` inside a box whose height is a share of the viewport, so the whole
figure survives at 320px without a horizontal overflow. It is the first object
under the header, lit by a soft radial glow that travels with it and by the
spotlight in the shared backdrop, and its bottom edge is faded into the ground
with a mask. The fade is what makes a cut-out photograph sit in a dark page
instead of looking like a sticker placed on it.

## The entrance

Every page load assembles the front door in reading order: header, the two name
lines, the accent bar, the links, the cards (or, on a phone, the menu when it
opens), the sign-off, and the portrait last. The block transitions live in
`v0.css`; the name is the exception, because its letters are animated by React
Bits' [SplitText](https://reactbits.dev) in `SplitText.tsx`.

`data-intro` is in the server markup, so the hidden starting state is part of
the first paint; the component adds `data-entered` 80 ms after mount, and that
is what releases the transitions. Keeping the start state out of the hydration
effect matters: when hydration finishes before the first paint, a start state
applied by script and an end state applied 80 ms later can be coalesced into a
single style recalc, and the transition never runs. Both states only exist
inside the `scripting: enabled` and `no-preference` media query, so a reader
with no JavaScript or reduced motion never sees a hidden page.

SplitText splits each line into characters, leaves the full words in an
`aria-label` on the line, and hides the generated spans from assistive tech. The
characters rise out of their own line box with a 38 ms stagger and a 0.9 s
ease; the surname starts 120 ms after the first name. The portrait carries the
longest delay (480 ms) and the slowest fade (900 ms), so the typography has
already landed when the figure begins to resolve — it is both the last thing to
start and the last thing to finish.

The component is kept close to upstream. One local addition is `startDelay`,
which waits a moment before a `load` reveal so the two lines can start apart;
the other triggers ignore it.

The whole sequence is gated on `prefers-reduced-motion: no-preference`, and
SplitText itself checks the same query and shows the text in place. Under
`scripting: none` the stylesheet forces the SplitText parent visible, so the
no-JavaScript page keeps its `h1` instead of waiting for a split that will never
run.

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

On a phone the block changes job. It sits below the portrait on a dark ground
rather than crossing a dark figure, so the difference blend is switched off and
the block keeps plain white. The marks sit in a six-column grid — a single row
cannot survive 320px — with no tile or border around them, because a box per
mark turns a signature into a wall of chips; the desktop row is bare for the
same reason. Thirteen is prime, so no two rows can hold the same number: six and
six is the balanced pair, and the thirteenth mark steps aside on a phone rather
than leaving a lone mark on a third row. The desktop row still shows all
thirteen. The sign-off rule turns red, which is the only colour below the accent
bar and reads as the composition's full stop.

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

A phone keeps that same backdrop rather than a second treatment: the same rays,
wash and grain over the same charcoal. The layer is fixed rather than absolute,
so the light and the texture hold still while the composition scrolls past them,
which is what gives the page its depth. Because the phone page is dark in both
themes, the desktop's paper guard — a damped, multiplied beam meant for a light
ground — is switched off there: the rays keep their dark-mode strength and the
grain keeps screening, even when `<html>` is not `.dark`.

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
them changed.

The plate is pitch black and smooth. The material is borrowed from the v3
lanyard badge: a black laminate card with a clearcoat, lit by one soft source
off the top left. All that survives on a flat face is the reflection — one
broad, low sweep of light across the plate, a soft pool where the source is,
and a bright hairline along the top and left edges that is the card's bevelled
rim catching the same light.

There is deliberately no grain and no brushed texture. The badge has a normal
map, but at a scale of 0.06 it is invisible; a visible one turns the plate into
a material with a direction, which is a different object from the one being
referenced. The sling, the clip and the ring are not carried over either — the
cards are the badge's stock and nothing else.

Each version's glyph is drawn in a lightened version of its accent and bloomed
slightly, because the accents as the site uses them are tuned for paper and
lose their chroma on black.

The version number is not in the artwork. It is the one word on the card that
names the destination, so it is real markup laid over the face — selectable,
translatable, and not pixels — with the artwork leaving its space empty. The
component takes it as an `overlay` on the item and renders it inside the card's
anchor, so the label is part of the link rather than a second control competing
with it.

The ring turns automatically (`animationMode="all"`, `speed={0.3}`), which is
the motion the component exists for. It eases to a stop while hovered
(`pauseOnHover`) and stops entirely under `prefers-reduced-motion`, so the
page always has a way to be still. It has no keyboard pause control; if that
becomes a requirement, the component needs one added rather than a CSS
workaround.

## The phone layout

Below 900px v0 stops being a composed desktop screen scaled down and becomes a
different page: a vertical, cinematic portrait.

The root keeps its markup and changes its flow. It becomes `position: relative`,
a flex column, and `min-height: 100svh`; the texture becomes fixed; and a
one-off palette is scoped to `.v0-root`, because the composition is a dark
poster in both themes and a paper version of it would be a different design.
The `<html>` theme is untouched — only this page is dark while it is open.

The DOM order is unchanged — header, name column, portrait, cards — and `order`
does the rearrangement:

| Visual order | Element | `order` |
| --- | --- | --- |
| 1 | Header (`EB`, hamburger) | 0 |
| 2 | Portrait | 1 |
| 3 | Name, accent bar, links, toolkit, sign-off | 2 |
| 4 | No-JavaScript picker | 3 |

The header is taken out of the desktop's absolute offsets (`inset: auto`), so
`EB` starts on the page's own gutter instead of one gutter to the right of it.
The hamburger's target is 44px around a 22px glyph, and the button gives 11px of
that back on the right, which lands the glyph on the gutter while keeping the
target 13px inside the viewport. The menu's close control does the same, so the
X and the rules share a centre.

The portrait comes first because a phone reads top to bottom, and the figure is
the page's light source. The portrait's box is a share of the viewport height
with a floor and a ceiling; the image is fitted inside it with `object-fit:
contain`, so the whole figure survives at 320px without a sideways scroll, and
the bottom of the frame is masked into the ground. The name is centred by
centring the flex items, not with `text-align`, because SplitText sets its own
inline alignment.

The three links become a tracked mono caption row, the toolkit marks become a
bare two-row grid of six, and the sign-off keeps its vertical rule — now red —
under the statement. The page is allowed to scroll: shrinking the name, the
portrait and the toolkit until they fit one viewport would make all three too
small to be worth looking at.

## The versions menu

The hamburger sits in the header's right-hand corner: a 44px target drawn as
two rules, the lower one shorter. It carries `aria-expanded` and
`aria-controls`, and it is `display: none` above 900px, so a desktop never sees
it and it never enters the desktop tab order.

Opening it mounts a full-screen dialog rather than a dropup. The five older
designs get the whole screen, set as large numerals with their year in mono and
an arrow that turns red under a thumb. v0 is deliberately absent: this is the
page the reader is already on, and the menu is a list of destinations. The
version list comes from `V0_CARD_DESIGNS`, so the menu and the desktop ring
cannot disagree about which versions exist or what order they go in.

The dialog owns the keyboard: focus moves to the close button on open, Tab and
Shift+Tab cycle inside the dialog, Escape closes it, and closing puts focus back
on the hamburger. Selecting a version closes the menu in the same commit that
applies the design, and the reveal wipes out from the row that was pressed.
While it is open the body cannot scroll behind it, and a resize past 900px
closes it, because the button that owns it is gone at that width.

Each row enters with a short stagger — five steps, 45 ms apart — after the
overlay fades in. Under `prefers-reduced-motion: reduce` the stagger and the
transitions are removed; the menu still opens and closes, it simply arrives
without moving.

Without JavaScript the menu cannot open, so the hamburger is hidden and the
plain `.v0-fallback` grid at the end of the page is the picker. Every link in it
is a real `?design=` address.

## The scroll cue

The circular down-arrow at the bottom centre is a button, not an ornament. It
appears only when the page has measured that there is something below the fold —
more than 48px of scrollable height, the button's own height — and only while
the reader is still at the top: once they have scrolled, the hint has done its
job, and keeping it would let it drift over the toolkit. It also stands down
while the menu is open. The check
runs after mount, on scroll, on resize, and through a `ResizeObserver` on the
body, because the portrait and the webfonts settling can change the document's
height without a window resize.

Because the button is fixed, a page that scrolls owes it an empty band at the
fold. The page measures the links row in layout offsets — a client rect would
include the entrance transform and come out short — and, only on a page that
already scrolls, writes `--v0-sign-gap` so the toolkit starts just below the
bottom edge. A page whose whole composition fits keeps the compact rhythm and
never shows the cue at all.

A press moves one viewport down. The scroll is smooth normally and an instant
jump under `prefers-reduced-motion: reduce`; the arrow's own nudge animation is
removed there too. On a desktop the page does not scroll, the measurement says
so, and the cue never appears.

## Picking a card

Clicking a card opens that version, and the version number on the card is the
word that says which one. The anchor's own `href` is a `?design=` address, and
an unmodified left click is intercepted so the design changes in place inside
the circular reveal, grown from the card that was pressed. Modified clicks are
left alone and navigate; a drag is cancelled by the component before
the click is handled, so turning the ring never opens a version by accident.

One thing the component has to get right for any of this to work: it must not
capture the pointer on `pointerdown`. Capturing retargets the compatibility
mouse events, so the `mouseup` and the `click` that follow it arrive at the
spiral's root rather than at the card's anchor — the anchor's own navigation
never runs, and the click handler that reads the anchor out of the event finds
nothing. The cards were unclickable for exactly that reason. The capture is
now taken only once the gesture is unambiguously a drag, which is the only case
where the pointer really does need to be ours; until then the ring is simply
held still for the press, so the release lands on the card the press did.

Keyboard: Tab reaches each card as a normal link, and Enter opens it. There is
no roving focus — the spiral is a list of links, not a single composite widget.

A menu row does the same job on a phone and is also a real anchor. Its
`onClick` intercepts an unmodified left click and commits the design through the
same reveal, anchored on the pressed row; modified clicks keep their default
navigation, so a version can still be opened in a new tab from the menu.

## Accessibility

- The name is the page's visible `h1`.
- The spiral is a `role="list"` of five links, each with its version and span
  as an accessible label. The version number on the face is the same word, as
  real text rather than pixels.
- Every card is a real anchor, so the page is a picker without script too, and
  the fallback list repeats the same five destinations.
- Focus rings use the `--ring` token; the spiral has none of its own, so
  `v0.css` adds an inset outline that survives the 3D transforms.
- The hamburger is a labelled button with `aria-expanded` and `aria-controls`.
  It is removed from the tab order above 900px, where its menu does not exist.
- The versions menu is a `role="dialog"` with `aria-modal` and an accessible
  name. Focus moves to the close button on open, cycles inside the dialog, and
  returns to the hamburger on close. Escape closes it, the body is scroll-locked
  behind it, and resizing past the phone breakpoint closes it rather than
  stranding it over a desktop.
- The scroll cue is a labelled button. It is `visibility: hidden` while it has
  nothing to point at, which also keeps it out of the tab order; `opacity: 0`
  alone would leave an invisible stop.
- The portrait and the texture are `aria-hidden`.

## Theme

Dark is the reference. The cards are black in both themes: on charcoal a black
plate is darker than its ground and only has to sit on top of it, and on paper
it is the one black object on the page, which is the point of it. What changes
between the themes is the shadow and the edge hairline, not the plate. The
texture, the wash and the vignette all mix from the page's own tokens, so
nothing is hard-coded twice. The per-version accents (`--v0-v5` … `--v0-v1`)
are the page's own; each card's artwork carries a lightened ink of its own,
because the muted values lose their chroma on black.

The phone layout is dark in both themes, on purpose. It re-declares the page's
background, foreground and ring tokens on `.v0-root` under the mobile query, and
the ground it declares is the dark theme's own `--background` — the same charcoal
the desktop draws on, so the two views are lit by the same backdrop rather than
by two near-blacks. The override is scoped to this page and this width: the rest
of the site, and desktop v0, still follow the stored theme.

## Responsive

Above 900px the page is a single non-scrolling screen. Below it, the page is
rebuilt: header, portrait, centred name, accent bar, links, toolkit marks,
sign-off, and the scroll cue, with the menu behind the hamburger. It scrolls
normally, because a phone cannot hold a display name, a portrait and a picker in
one viewport at a readable scale. The ring is hidden there, as are the header's
role and motto; the portrait is fitted rather than cropped, and the toolkit sits
in a centred six-by-two grid, the thirteenth mark being desktop-only. Nothing is
allowed to exceed the viewport width: the root clips the horizontal axis, the
portrait is `contain`ed, and the marks are spaced six across a 320px screen
instead of shrinking below a readable size.

## Reduced motion and no JavaScript

- `prefers-reduced-motion: reduce`: the spiral stops its automatic travel and
  only moves when dragged or scrolled. The menu's fade and row stagger are
  removed, its transitions are removed, and the scroll cue stops nudging and
  jumps a viewport instead of gliding. The page's entrance is already gated on
  `no-preference`.
- `@media (scripting: none)`: the spiral places its cards with script, so
  `.v0-spiral` is hidden and `.v0-fallback` shows five real links in the same
  card shape. The menu and the scroll cue both need script — the menu opens
  from state and the cue is measured — so both controls are hidden, and the
  fallback is also the phone's picker. Every link is a `?design=` address the
  server already understands.

## What v0 deliberately does not have

Sections, nav, footer, the design dropup, a boot overlay, a scroll region above
900px, captions, card shadow, and a bottom dock. Each one either duplicates the
cards or the menu, assumes a page that is not here, or competes with the
portrait.

## Unused since the card changes

`V0Carousel.tsx` (the vertical marquee) and its rules in `v0.css` — the
`v0-gallery*`, `v0-track*`, `v0-card*` and `v0-pause` blocks — are no longer
mounted. They are left in place only until that file is deleted; nothing on the
page selects them.
