"use client";

import { useCallback } from "react";
import { Printer } from "lucide-react";

import { ThemeControl } from "@/app/components/ui/ThemeControl";
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
export function V4Controls() {
  const { theme, setTheme, resolvedTheme } = useTheme();

  const handlePrint = useCallback(async () => {
    // Store previous theme to restore after print
    const wasDark = resolvedTheme === "dark";

    // 1. Switch to light theme for print (print CSS forces light vars, but this ensures UI consistency)
    if (wasDark) {
      setTheme("light");
    }

    // 2. Expand all projects in the V4Projects component
    // Find the section and toggle button
    const projectsSection = document.getElementById("projects");
    if (projectsSection) {
      const toggleBtn = projectsSection.querySelector<HTMLButtonElement>(
        ".v4-projects-toggle-btn"
      );
      if (toggleBtn && toggleBtn.getAttribute("aria-expanded") === "false") {
        toggleBtn.click();
      }
    }

    // 3. Wait for fonts and images to be ready
    try {
      await document.fonts.ready;
    } catch {}

    // Decode all project thumbnails so they're not blank in print
    const thumbnails = document.querySelectorAll<HTMLImageElement>(
      "#projects .v4-project-thumb, .v4-portrait-frame img"
    );
    await Promise.allSettled(
      Array.from(thumbnails).map((img) =>
        img.decode ? img.decode() : Promise.resolve()
      )
    );

    // 4. Set clean document title for the PDF filename
    const originalTitle = document.title;
    document.title = "Emmanuel_Bitancor_Full-Stack_Developer";

    // 5. Small delay to let React state propagate (theme, expanded projects)
    await new Promise((r) => setTimeout(r, 100));

    // 6. Trigger print
    window.print();

    // 7. Restore state after print dialog closes
    const restore = () => {
      document.title = originalTitle;
      if (wasDark) {
        setTheme("dark");
      }
      // Collapse projects again if they were collapsed before
      if (projectsSection) {
        const toggleBtn = projectsSection.querySelector<HTMLButtonElement>(
          ".v4-projects-toggle-btn"
        );
        if (toggleBtn && toggleBtn.getAttribute("aria-expanded") === "true") {
          toggleBtn.click();
        }
      }
      window.removeEventListener("afterprint", restore);
    };

    // afterprint fires when print dialog closes (print or cancel)
    window.addEventListener("afterprint", restore, { once: true });

    // Fallback: also restore on focus return (some browsers)
    const onFocus = () => {
      restore();
      window.removeEventListener("focus", onFocus);
    };
    window.addEventListener("focus", onFocus, { once: true });
  }, [theme, setTheme, resolvedTheme]);

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
