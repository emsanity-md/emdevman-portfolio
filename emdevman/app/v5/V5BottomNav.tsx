"use client";

import { Briefcase } from "lucide-react";

import { V5_TABS } from "./tabs";

/**
 * The small-screen navigation: six icons on a fixed bottom bar, and the call to
 * action as a disc floating above it.
 *
 * This is what replaces the two rails below `lg`, and it is deliberately not a
 * second tablist - see `V5Tabs`. Plain buttons, because a bottom bar of icons
 * with no labels is a navigation convenience, and announcing two tablists that
 * describe the same six panels would mean announcing every tab twice.
 *
 * The bar sits at the bottom because that is where a thumb is, and the whole
 * reason it exists is that a 275px rail does not fit a phone. The tab bar stays
 * at the top, where it was, because it is part of the page's own structure - it
 * is the thing that says "this profile has six sections".
 *
 * `env(safe-area-inset-bottom)` on the bar, so it clears the home indicator on a
 * device that has one, and the FAB is positioned against the same value so it
 * never sits on top of the bar's last row.
 */
export function V5BottomNav({
  active,
  onChange,
}: {
  active: string;
  onChange: (id: string) => void;
}) {
  return (
    <>
      <nav className="v5-bottom-nav" aria-label="Profile sections">
        {V5_TABS.map((tab) => {
          const Icon = tab.Icon;
          const isActive = tab.id === active;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChange(tab.id)}
              aria-current={isActive ? "page" : undefined}
              aria-label={tab.label}
              className="v5-bottom-item"
            >
              <Icon aria-hidden="true" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </nav>

      {/*
        The FAB. A button rather than a link, because it switches to the Contacts
        tab the same way the rail's "Hire Me" does - on this route there is no
        `/#contact` target worth leaving for, and the form is one tap away.
      */}
      <button
        type="button"
        onClick={() => onChange("contact")}
        className="v5-fab"
        aria-label="Hire Me"
        title="Hire Me"
      >
        <Briefcase aria-hidden="true" />
      </button>
    </>
  );
}