"use client";

import type { CSSProperties } from "react";
import {
  Braces,
  Code2,
  Command,
  Cpu,
  Database,
  GitBranch,
  Layers3,
  Terminal,
  type LucideIcon,
} from "lucide-react";
import { useTheme } from "next-themes";

type Accent = "blue" | "cyan" | "violet" | "emerald" | "slate";

type FloatingIconStyle = CSSProperties & {
  "--float-duration": string;
  "--float-delay": string;
  "--drift-x": string;
  "--drift-y": string;
};

interface FloatingIconConfig {
  Icon: LucideIcon;
  accent: Accent;
  position: CSSProperties;
  size: number;
  duration: string;
  delay: string;
  driftX: string;
  driftY: string;
  optional?: boolean;
}

const floatingIcons: FloatingIconConfig[] = [
  {
    Icon: Code2,
    accent: "blue",
    position: { top: "13%", left: "6%" },
    size: 40,
    duration: "12s",
    delay: "-2s",
    driftX: "14px",
    driftY: "-26px",
  },
  {
    Icon: Braces,
    accent: "violet",
    position: { top: "23%", right: "8%" },
    size: 36,
    duration: "15s",
    delay: "-8s",
    driftX: "-12px",
    driftY: "-22px",
  },
  {
    Icon: Terminal,
    accent: "cyan",
    position: { top: "43%", left: "3%" },
    size: 38,
    duration: "14s",
    delay: "-5s",
    driftX: "18px",
    driftY: "24px",
  },
  {
    Icon: Database,
    accent: "emerald",
    position: { top: "57%", right: "5%" },
    size: 42,
    duration: "17s",
    delay: "-11s",
    driftX: "-16px",
    driftY: "-28px",
  },
  {
    Icon: Cpu,
    accent: "blue",
    position: { bottom: "15%", left: "17%" },
    size: 38,
    duration: "16s",
    delay: "-6s",
    driftX: "12px",
    driftY: "-24px",
    optional: true,
  },
  {
    Icon: GitBranch,
    accent: "violet",
    position: { top: "9%", left: "43%" },
    size: 32,
    duration: "18s",
    delay: "-13s",
    driftX: "18px",
    driftY: "20px",
    optional: true,
  },
  {
    Icon: Layers3,
    accent: "cyan",
    position: { top: "48%", right: "31%" },
    size: 34,
    duration: "15s",
    delay: "-3s",
    driftX: "-14px",
    driftY: "-22px",
    optional: true,
  },
  {
    Icon: Command,
    accent: "slate",
    position: { right: "19%", bottom: "9%" },
    size: 30,
    duration: "13s",
    delay: "-9s",
    driftX: "16px",
    driftY: "-18px",
    optional: true,
  },
];

const palettes = {
  dark: {
    blue: "#60a5fa",
    cyan: "#22d3ee",
    violet: "#a78bfa",
    emerald: "#34d399",
    slate: "#a1a1aa",
  },
  light: {
    blue: "#2563eb",
    cyan: "#0891b2",
    violet: "#7c3aed",
    emerald: "#059669",
    slate: "#52525b",
  },
} as const;

export default function BackgroundEffects() {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const palette = isDark ? palettes.dark : palettes.light;
  const dotColor = isDark ? "#71717a" : "#0ea5e9";

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: isDark
            ? "linear-gradient(rgba(255,255,255,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.035) 1px, transparent 1px)"
            : "linear-gradient(rgba(14,116,144,0.12) 1px, transparent 1px), linear-gradient(90deg, rgba(14,116,144,0.12) 1px, transparent 1px)",
          backgroundSize: "36px 36px",
          opacity: isDark ? 0.55 : 0.8,
          maskImage: "linear-gradient(to bottom, black 0%, black 72%, transparent 100%)",
          WebkitMaskImage:
            "linear-gradient(to bottom, black 0%, black 72%, transparent 100%)",
        }}
      />

      <div
        className="absolute inset-0 transition-opacity duration-500"
        style={{
          backgroundImage: `radial-gradient(${dotColor} 1px, transparent 1px)`,
          backgroundSize: "24px 24px",
          opacity: isDark ? 0.2 : 0.22,
          maskImage: "linear-gradient(to bottom, black 30%, transparent 94%)",
          WebkitMaskImage: "linear-gradient(to bottom, black 30%, transparent 94%)",
        }}
      />

      <div
        className="absolute inset-0"
        style={{
          maskImage: "linear-gradient(to bottom, black 8%, black 62%, transparent 96%)",
          WebkitMaskImage: "linear-gradient(to bottom, black 8%, black 62%, transparent 96%)",
        }}
      >
        {floatingIcons.map((config, index) => {
          const {
            Icon,
            accent,
            position,
            size,
            duration,
            delay,
            driftX,
            driftY,
            optional,
          } = config;
          const color = palette[accent];

          return (
            <div
              key={index}
              className={`floating-icon${optional ? " floating-icon--optional" : ""}`}
              style={
                {
                  ...position,
                  "--float-duration": duration,
                  "--float-delay": delay,
                  "--drift-x": driftX,
                  "--drift-y": driftY,
                  color,
                  borderColor: `${color}35`,
                  backgroundColor: `${color}0d`,
                  boxShadow: `0 18px 50px ${color}14`,
                  opacity: isDark ? 0.22 : 0.14,
                } as FloatingIconStyle
              }
            >
              <Icon size={size} strokeWidth={1.35} aria-hidden="true" />
            </div>
          );
        })}
      </div>
    </div>
  );
}
