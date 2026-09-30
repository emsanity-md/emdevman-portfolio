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
 * v3's theme control: three explicit states.
 *
 * Not a restyle of V2's brightness slider. That slider can only express
 * light or dark - it commits `light` at 100% and `dark` at 0% and has no third
 * state - so it cannot honour "system", which the design language requires and
 * which is also the default. This is a segmented pill instead: one hairline
 * border, three round options, the active one filled.
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
