"use client";

import { useSyncExternalStore } from "react";
import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { useRevealTransition } from "@/app/hooks/useRevealTransition";

const subscribeToHydration = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

const OPTIONS = [
  { value: "system", label: "System theme", Icon: Monitor },
  { value: "light", label: "Light theme", Icon: Sun },
  { value: "dark", label: "Dark theme", Icon: Moon },
] as const;

/**
 * The theme control, shared by v2 and v3: three explicit states.
 *
 * V2 used to carry a brightness slider instead - a round trigger opening a
 * popover, with the page dimming under a fixed scrim as the level moved. It
 * could only express light or dark, since it committed `light` at 100% and
 * `dark` at 0% and had no third state, so it could not honour "system" even
 * though that is the default and the design language requires all three. The
 * slider and its glow are gone; this segmented pill replaces them in both
 * designs: one hairline border, three round options, the active one filled.
 *
 * Pressing an option commits inside the design language's circular reveal, the
 * same wipe the design switch uses, growing out of the option that was pressed
 * rather than out of the middle of the screen.
 */
export function ThemeControl() {
  const { theme, setTheme } = useTheme();
  const reveal = useRevealTransition();
  const mounted = useSyncExternalStore(
    subscribeToHydration,
    getClientSnapshot,
    getServerSnapshot,
  );

  const active = mounted ? (theme ?? "system") : "system";

  return (
    <div className="theme-switch" role="group" aria-label="Theme">
      {OPTIONS.map(({ value, label, Icon }) => {
        const isActive = active === value;
        return (
          <button
            key={value}
            type="button"
            onClick={(event) => {
              // Re-pressing the active option is a no-op, and a view transition
              // for a change that does not happen would flash the page for
              // nothing.
              if (isActive) return;
              reveal(event.currentTarget, () => setTheme(value));
            }}
            className={`theme-opt${isActive ? " theme-opt--active" : ""}`}
            aria-pressed={isActive}
            aria-label={label}
            title={label}
          >
            <Icon aria-hidden="true" />
          </button>
        );
      })}
    </div>
  );
}
