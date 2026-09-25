"use client";

import { useEffect, useRef, useState, useSyncExternalStore, type CSSProperties } from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@/app/components/ui/button";

const subscribeToHydration = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(
    subscribeToHydration,
    getClientSnapshot,
    getServerSnapshot,
  );
  const [brightnessLevel, setBrightnessLevel] = useState<number | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const brightnessFrameRef = useRef<number | null>(null);
  const pendingBrightnessRef = useRef<number | null>(null);
  const themeTransitionFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  useEffect(() => {
    return () => {
      if (brightnessFrameRef.current !== null) {
        window.cancelAnimationFrame(brightnessFrameRef.current);
      }
      if (themeTransitionFrameRef.current !== null) {
        window.cancelAnimationFrame(themeTransitionFrameRef.current);
      }
    };
  }, []);

  if (!mounted) {
    return (
      <span
        aria-hidden="true"
        className="inline-flex size-10 items-center justify-center rounded-full bg-zinc-100 opacity-50 dark:bg-zinc-800"
      >
        <Sun className="size-4" />
      </span>
    );
  }

  const isDark = resolvedTheme === "dark";
  const value = brightnessLevel ?? (isDark ? 25 : 75);

  const suppressThemeTransitions = () => {
    const root = document.documentElement;
    root.setAttribute("data-theme-transition", "true");

    if (themeTransitionFrameRef.current !== null) {
      window.cancelAnimationFrame(themeTransitionFrameRef.current);
    }

    themeTransitionFrameRef.current = window.requestAnimationFrame(() => {
      themeTransitionFrameRef.current = window.requestAnimationFrame(() => {
        root.removeAttribute("data-theme-transition");
        themeTransitionFrameRef.current = null;
      });
    });
  };

  const commitThemeForValue = (value: number) => {
    const nextTheme = value <= 0 ? "dark" : value >= 100 ? "light" : null;
    if (!nextTheme || nextTheme === resolvedTheme) return;

    suppressThemeTransitions();
    setTheme(nextTheme);
  };

  const setBrightness = (nextValue: number) => {
    const normalizedValue = Math.min(100, Math.max(0, nextValue));
    pendingBrightnessRef.current = normalizedValue;

    if (brightnessFrameRef.current !== null) return;

    brightnessFrameRef.current = window.requestAnimationFrame(() => {
      const value = pendingBrightnessRef.current;
      brightnessFrameRef.current = null;
      if (value === null) return;

      setBrightnessLevel(value);
      const dimOpacity = ((100 - value) / 100) * 0.28;
      document.documentElement.style.setProperty(
        "--theme-dim-opacity",
        dimOpacity.toFixed(3),
      );
    });
  };

  const setExactTheme = (theme: "light" | "dark") => {
    const nextValue = theme === "dark" ? 0 : 100;
    setBrightness(nextValue);
    commitThemeForValue(nextValue);
  };

  return (
    <div
      ref={containerRef}
      className="theme-toggle-source relative isolate inline-flex"
      style={{ "--theme-light-level": value / 100 } as CSSProperties}
    >
      <span className="theme-toggle-glow" aria-hidden="true" />
      <Button
        ref={triggerRef}
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen((open) => !open)}
        className="theme-toggle-trigger relative z-10 rounded-full bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700"
        aria-label={isOpen ? "Close theme settings" : "Open theme settings"}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        aria-controls="theme-brightness-panel"
        title="Theme brightness"
      >
        {isDark ? <Moon className="size-4" /> : <Sun className="size-4" />}
      </Button>

      {isOpen && (
        <div
          id="theme-brightness-panel"
          role="dialog"
          aria-label="Theme brightness"
          className="absolute right-0 top-12 z-[70] w-64 rounded-2xl border border-border bg-popover p-4 text-popover-foreground shadow-xl"
        >
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold">Theme brightness</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Adjust the light level
              </p>
            </div>
            <span className="rounded-full bg-muted px-2 py-1 font-mono text-[10px] text-muted-foreground">
              {value}%
            </span>
          </div>

          <div className="mb-3 flex items-center justify-between text-xs font-medium text-muted-foreground">
            <button
              type="button"
              onClick={() => setExactTheme("dark")}
              className="inline-flex items-center gap-1.5 rounded-md px-1.5 py-1 transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="Use dark theme"
            >
              <Moon className="size-3.5 text-indigo-400" aria-hidden="true" />
              Dark
            </button>
            <button
              type="button"
              onClick={() => setExactTheme("light")}
              className="inline-flex items-center gap-1.5 rounded-md px-1.5 py-1 transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="Use light theme"
            >
              Light
              <Sun className="size-3.5 text-amber-500" aria-hidden="true" />
            </button>
          </div>

          <div className="relative h-2 rounded-full border border-black/10 bg-[linear-gradient(90deg,#000000_0%,#ffffff_100%)] dark:border-white/15">
            <span
              className="pointer-events-none absolute top-1/2 z-10 size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-popover bg-foreground shadow-md transition-[left] duration-150"
              style={{ left: `${value}%` }}
              aria-hidden="true"
            />
            <input
              type="range"
              min={0}
              max={100}
              step={1}
              value={value}
              onChange={(event) => setBrightness(Number(event.target.value))}
              onPointerUp={(event) =>
                commitThemeForValue(Number(event.currentTarget.value))
              }
              onKeyUp={(event) =>
                commitThemeForValue(Number(event.currentTarget.value))
              }
              onBlur={(event) =>
                commitThemeForValue(Number(event.currentTarget.value))
              }
              className="absolute inset-0 z-20 h-full w-full cursor-pointer opacity-0"
              aria-label="Theme brightness"
              aria-valuetext={`${value <= 50 ? "Dark" : "Light"} theme, ${value}% brightness`}
            />
          </div>

          <div className="mt-2 flex justify-between font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
            <span>Dark</span>
            <span>Light</span>
          </div>
        </div>
      )}
    </div>
  );
}
