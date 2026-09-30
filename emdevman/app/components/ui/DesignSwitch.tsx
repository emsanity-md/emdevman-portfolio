"use client";

import { useCallback, useRef } from "react";
import { ArrowUpRight, Palette } from "lucide-react";

import { designs, DESIGN_IDS, type DesignId } from "@/app/lib/designs";
import { useDesign } from "@/app/context/DesignProvider";
import { useRevealTransition } from "@/app/hooks/useRevealTransition";

export function DesignSwitch() {
  const { design, toggleDesign } = useDesign();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const reveal = useRevealTransition();

  const nextDesign: DesignId =
    DESIGN_IDS[(DESIGN_IDS.indexOf(design) + 1) % DESIGN_IDS.length];

  const handleToggle = useCallback(() => {
    reveal(buttonRef.current, toggleDesign);
  }, [reveal, toggleDesign]);

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={handleToggle}
        className="design-switch"
        aria-label={`Switch to the ${nextDesign} design, ${designs[nextDesign].description}`}
        title={`Switch to the ${nextDesign} design`}
      >
        {design === "v3" ? (
          <ArrowUpRight className="design-switch-glyph" aria-hidden="true" />
        ) : (
          <Palette className="design-switch-glyph" aria-hidden="true" />
        )}
        <span className="eyebrow design-switch-label">{nextDesign}</span>
      </button>

      <span className="sr-only" role="status" aria-live="polite">
        {`${designs[design].label} design active`}
      </span>
    </>
  );
}
