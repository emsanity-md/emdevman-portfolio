"use client";

import { ThemeControl } from "@/app/components/ui/ThemeControl";

/**
 * The two controls v4 keeps, floating top-right.
 *
 * v4 has no navbar - `Navbar()` returns null for it - and so nowhere to put the
 * theme control in a bar. It needs to exist: without it there is no way to reach
 * dark mode, and dark mode is what swaps the portrait to `DARK.jpg`, so omitting
 * it would make half the design's asset set unreachable.
 *
 * The design switch is not duplicated here. It is mounted once in `layout.tsx`
 * alongside the footer, and CSS keeps it hidden or shown per design - two copies
 * of a menu that owns `aria-expanded`, focus and the active-design checkmark
 * would be two controls fighting over the same state.
 */
export function V4Controls() {
  return (
    <div className="v4-controls">
      <ThemeControl />
    </div>
  );
}
