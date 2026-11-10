# React Bits — Circular Carousel

`V0Carousel.tsx` in this directory is adapted from the React Bits
**Circular Carousel** component.

- Source: https://reactbits.dev/components/circular-carousel
- Repository: https://github.com/DavidHDev/react-bits
- Copyright (c) 2026 David Haz

## Licence

MIT + Commons Clause License Condition v1.0

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software **as part of an application, website, or product**,
subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

### Commons Clause Restriction

You may use this Software, including for any commercial purpose, **so long as
you do not sell, sublicense, or redistribute the components themselves —
whether alone, in a bundle, or as a ported version.**

## Modifications

This copy is a port, not the original file. It was reduced to what this site
needs and changed in the following ways:

- Items are DOM cards with an icon and an accessible name, not images. The
  eight-strip curved tile slicing was removed with them, because slicing a card
  whose only content is one icon means duplicating that icon into eight pieces.
  The cards are flat billboards on the same ring instead.
- Image preloading, the leaving/crossfade swap, captions, `fadeColor` and
  `innerShade` were removed. They exist for photographs.
- `onIntroDone` was added so the portrait's fade can start when the last card
  lands rather than on a guessed timeout.
- The reduced-motion query is read on the first client render rather than in an
  effect, so the entrance cannot start for one frame for a reader who asked for
  no motion.
- Cards are anchors to `/?design=vN`; the click is intercepted while the
  carousel is running, so the ring still switches in place but the markup works
  as a picker without JavaScript.
- The wheel handler accepts either axis, since this page has nothing to scroll.

The ring maths, the rise intro, the drift, the drag, momentum, snapping,
parallax and the keyboard controls are the original's.
