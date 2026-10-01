"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowUpRight, Check, ChevronUp, FileText, Palette, ScrollText } from "lucide-react";

import { designs, DESIGN_IDS, type DesignId } from "@/app/lib/designs";
import { useDesign } from "@/app/context/DesignProvider";
import { useRevealTransition } from "@/app/hooks/useRevealTransition";

/** Each design's glyph on the trigger, so the current one is recognisable at rest. */
const GLYPHS: Record<DesignId, typeof ArrowUpRight> = {
  v4: ScrollText,
  v3: ArrowUpRight,
  v2: Palette,
  v1: FileText,
};

/**
 * The floating control that picks the active design language.
 *
 * It used to cycle: one press moved to the next design and wrapped. That is a
 * fine shortcut between two designs and a bad one between three, where reaching
 * v1 from v3 took two presses and there was no way to go back to the one you
 * were just looking at. So the button opens a menu of all three and each entry
 * applies that design directly - which is what "filter" means here.
 *
 * A dropup rather than a dropdown, because the control is pinned to the bottom
 * corner and the menu opens upward from it. It is positioned against its own
 * wrapper rather than the viewport, so `right`/`bottom` stay declared once.
 *
 * Open and close are CSS transitions on a `data-open` attribute rather than
 * framer-motion, and that is not a style preference: v1 promises no motion, and
 * its stylesheet kills CSS animation and transition outright. A JS-driven menu
 * would keep animating there, because framer-motion writes inline styles that a
 * stylesheet cannot override. This way v1 gets an instant menu for free, with no
 * branch in this file.
 */
export function DesignSwitch() {
  const { design, setDesign } = useDesign();
  const reveal = useRevealTransition();

  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const Glyph = GLYPHS[design];

  /*
    Opening moves focus to the active entry rather than the first one. The menu
    is a list of three, and arriving on the item that is already selected means
    Enter re-applies it - harmless - instead of silently switching the design out
    from under the reader who only wanted to look.
  */
  useEffect(() => {
    if (!isOpen) return;

    const items = menuRef.current?.querySelectorAll<HTMLButtonElement>(
      '[role="menuitem"]',
    );
    const active = Array.from(items ?? []).find(
      (item) => item.getAttribute("aria-current") === "true",
    );
    (active ?? items?.[0])?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
        triggerRef.current?.focus();
        return;
      }

      // Arrow keys walk the list. A menu that only takes Tab is a list of links
      // wearing a menu's clothes.
      if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;

      event.preventDefault();
      const current = Array.from(
        menuRef.current?.querySelectorAll<HTMLButtonElement>(
          '[role="menuitem"]',
        ) ?? [],
      );
      const index = current.indexOf(
        document.activeElement as HTMLButtonElement,
      );
      const step = event.key === "ArrowDown" ? 1 : -1;
      const next = current[(index + step + current.length) % current.length];
      next?.focus();
    };

    const isInsideSwitch = (target: Node | null) =>
      Boolean(target && menuRef.current?.parentElement?.contains(target));

    // A pointer press elsewhere dismisses it, the way any floating menu behaves.
    const handlePointerDown = (event: PointerEvent) => {
      if (!isInsideSwitch(event.target as Node)) setIsOpen(false);
    };

    /*
      Focus leaving the widget dismisses it too, which is the case a keypress
      opens and nothing else covers: Tab walks on out of the menu and into the
      page while it is still open, leaving the trigger advertising
      `aria-expanded="true"` for a panel that no longer holds focus.

      `focusout` rather than a Tab branch in the key handler, because the menu
      hides with `visibility` and v1 gives every element `transition: none` -
      so closing inside the keydown would hide the still-focused item before the
      browser ran Tab's default action, and focus would fall to `body`. Here the
      focus has already moved by the time the panel is hidden, so nothing can
      take it away.
    */
    const handleFocusOut = (event: FocusEvent) => {
      if (isInsideSwitch(event.relatedTarget as Node | null)) return;
      setIsOpen(false);
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("focusout", handleFocusOut);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("focusout", handleFocusOut);
    };
  }, [isOpen]);

  const handleSelect = useCallback(
    (next: DesignId) => {
      setIsOpen(false);
      triggerRef.current?.focus();

      // Re-picking the design already active is a no-op, and a transition for a
      // change that does not happen would flash the page for nothing.
      if (next === design) return;

      reveal(triggerRef.current, () => setDesign(next));
    },
    [design, reveal, setDesign],
  );

  return (
    <div className="design-switch">
      <div
        ref={menuRef}
        className="design-switch-menu"
        id="design-switch-menu"
        role="menu"
        aria-label="Design version"
        data-open={isOpen}
      >
        <p className="design-switch-menu-label eyebrow">Design version</p>

        <ul>
          {DESIGN_IDS.map((id) => {
            const isActive = id === design;
            const Icon = GLYPHS[id];

            return (
              <li key={id}>
                <button
                  type="button"
                  role="menuitem"
                  aria-current={isActive ? "true" : undefined}
                  onClick={() => handleSelect(id)}
                  className={`design-switch-item${isActive ? " design-switch-item--active" : ""}`}
                >
                  <Icon aria-hidden="true" />

                  <span className="design-switch-item-text">
                    <span className="design-switch-item-name">{id}</span>
                    <span className="design-switch-item-span">{designs[id].span}</span>
                  </span>

                  {isActive ? (
                    <Check className="design-switch-item-check" aria-hidden="true" />
                  ) : null}
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      <button
        ref={triggerRef}
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        className="design-switch-trigger"
        aria-label={`Change design version, currently ${designs[design].label}, ${designs[design].span}`}
        title="Change design version"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-controls="design-switch-menu"
      >
        <Glyph className="design-switch-glyph" aria-hidden="true" />
        <span className="eyebrow design-switch-label">{design}</span>
        <ChevronUp
          className={`design-switch-caret${isOpen ? " design-switch-caret--open" : ""}`}
          aria-hidden="true"
        />
      </button>

      <span className="sr-only" role="status" aria-live="polite">
        {`${designs[design].label} design active, ${designs[design].span}`}
      </span>
    </div>
  );
}
