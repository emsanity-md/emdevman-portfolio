"use client";

import { useCallback } from "react";
import { Printer } from "lucide-react";

import { ThemeControl } from "@/app/components/ui/ThemeControl";
import { findRenderedSection } from "@/app/lib/navigation";
import { useTheme } from "next-themes";

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

/** The filename a reader's "Save as PDF" should suggest. */
const PRINT_TITLE = "Emmanuel_Bitancor_Full-Stack_Developer";

/**
 * How long to wait for fonts and images before printing regardless.
 *
 * Print is not allowed to wait on an image indefinitely. The bound is generous
 * for a cold cache on a slow connection and short enough that a press always
 * produces a dialog promptly - and it is a bound rather than optimism, because
 * the wait it caps is `img.decode()`, which does not always come back. See the
 * note on `promoteToEager` below.
 */
const PREPARE_TIMEOUT = 1500;

/**
 * One tick, long enough for React to commit a state change and for the
 * `data-design`-keyed stylesheet to recalculate.
 */
const SETTLE = 60;

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export function V4Controls() {
  const { setTheme, resolvedTheme } = useTheme();

  const handlePrint = useCallback(async () => {
    const wasDark = resolvedTheme === "dark";
    const originalTitle = document.title;

    /*
      The projects section, found rather than asked for by id.

      `page.tsx` mounts the v1 tree and the v4 tree side by side and lets CSS pick
      one, and all of them ship a section with `id="projects"` - so
      `getElementById` hands back v1's, which is `display: none` under v4. The
      disclosure this is meant to open was never in that subtree, and neither were
      the thumbnails, so both steps silently did nothing. `findRenderedSection`
      is the helper this repo already has for exactly that collision; see
      `lib/navigation.ts`.
    */
    const projects = findRenderedSection("projects");
    const toggle = projects?.querySelector<HTMLButtonElement>(
      ".v4-projects-toggle-btn"
    );

    // Light for print. The print stylesheet sets its own colours, but the
    // surrounding page does not, and `dark` is what decides which of the three
    // portraits is on screen.
    if (wasDark) setTheme("light");

    const wasExpanded = toggle?.getAttribute("aria-expanded") === "true";
    if (toggle && !wasExpanded) toggle.click();

    const images = [
      ...(projects?.querySelectorAll<HTMLImageElement>(".v4-project-thumb") ?? []),
      ...document.querySelectorAll<HTMLImageElement>(".v4-portrait-frame img"),
    ];

    /*
      Promote every lazy image, then decode - in that order.

      `decode()` is the step this used to hang on, and the reason is the order.
      Both `<Image>` calls here default to `loading="lazy"`, and the browser
      defers those fetches until the image is near the viewport. An image inside a
      `display: none` subtree is never near it: the six collapsed projects, and
      the portrait's dark frame under `hidden dark:block` when the page is light.
      `decode()` waits for image data that no one has been asked to fetch, so its
      promise simply never settles, and an `await` on it parks the handler before
      `window.print()` forever. The button did nothing at all in light mode and
      worked in dark mode, which is what made it read as intermittent rather than
      broken.

      Setting `loading="eager"` first starts the fetch, and from that point
      `decode()` is a promise about a transfer already in flight, which settles.
      `Promise.allSettled` then keeps one failed image from holding up the rest.

      The attribute is put back afterwards so the live page is left exactly as it
      was found - the eager promotion exists for the print snapshot only.
    */
    const promoted = images.filter((img) => {
      if (img.getAttribute("loading") !== "lazy") return false;
      img.setAttribute("loading", "eager");
      return true;
    });

    const prepared = (async () => {
      try {
        await document.fonts.ready;
      } catch {
        // Nothing to recover: print regardless.
      }
      await Promise.allSettled(
        images.map((img) => (img.decode ? img.decode() : Promise.resolve()))
      );
    })();

    // Racing the cap, so a slow or wedged asset can never swallow the press.
    await Promise.race([prepared, wait(PREPARE_TIMEOUT)]);

    /*
      Register the undo before printing rather than after.

      `window.print()` blocks in most browsers but is not guaranteed to, and a
      path that throws or is blocked would otherwise leave the renamed document
      behind for the rest of the session - a tab titled
      `Emmanuel_Bitancor_Full-Stack_Developer` forever, and projects still
      expanded. Registered up front, the undo is armed on every path out.

      `once` on both plus the guard means the two events racing after the dialog
      closes - `afterprint` and the `focus` the window gets back - collapse the
      list exactly once between them.
    */
    document.title = PRINT_TITLE;

    let undone = false;
    const restore = () => {
      if (undone) return;
      undone = true;

      document.title = originalTitle;
      for (const img of promoted) img.setAttribute("loading", "lazy");
      if (wasDark) setTheme("dark");
      if (toggle && toggle.getAttribute("aria-expanded") === "true") toggle.click();

      window.removeEventListener("afterprint", restore);
      window.removeEventListener("focus", restore);
    };

    window.addEventListener("afterprint", restore, { once: true });
    window.addEventListener("focus", restore, { once: true });

    await wait(SETTLE);
    window.print();
  }, [setTheme, resolvedTheme]);

  return (
    <div className="v4-controls">
      <ThemeControl />
      <div className="theme-switch">
        <button
          type="button"
          className="theme-opt"
          aria-label="Print CV"
          title="Print CV"
          onClick={handlePrint}
        >
          <Printer aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
