

import { ThemeControl } from "@/app/components/ui/ThemeControl";
import { V5_FULL_NAME, V5_STATS } from "./profile";

/**
 * v5's sticky top bar.
 *
 * Four cells: back, the name, the project count, and the theme control. The
 * theme control is the shared `ThemeControl` - the same three-state pill v2 puts
 * in its navbar and v4 floats top-right - imported rather than rebuilt, so the
 * circular reveal, the localStorage key and the system-preference default are
 * literally the same component and the choice cannot diverge between versions.
 *
 * It needs no props for that to hold, and none are passed.
 */
export function V5TopBar() {
  return (
    <div className="v5-sticky v5-topbar">
      <div className="v5-topbar-row">
        {/*
          Back to the four designs on `/`. It is a link rather than
          `router.back()` on purpose: a shared `/v5#projects` URL opened in a
          fresh tab has no history to go back to, and "back" that silently does
          nothing is a dead control.
        */}
        <div className="min-w-0">
          <p className="flex items-center gap-1 truncate text-[15px] font-bold leading-tight text-foreground">
            {V5_FULL_NAME}
            <span className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#1d9bf0] text-white" title="Verified">
              <svg viewBox="0 0 24 24" fill="none" className="h-2.5 w-2.5" aria-hidden="true">
                <path
                  d="M20 6 9 17l-5-5"
                  stroke="currentColor"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
          </p>
          <p className="truncate text-xs leading-tight text-muted-foreground">
            {V5_STATS.projects} projects
          </p>
        </div>

        <div className="ml-auto shrink-0">
          <ThemeControl />
        </div>
      </div>
    </div>
  );
}