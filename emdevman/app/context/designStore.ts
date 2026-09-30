"use client";

import {
  DEFAULT_DESIGN,
  DESIGN_IDS,
  DESIGN_QUERY_PARAM,
  isDesignId,
  writeStoredDesign,
  type DesignId,
} from "@/app/lib/designs";

/**
 * The active design lives on <html> rather than in React state, so the
 * pre-paint script, CSS and the switch all read the same source of truth.
 * This module is the one place that writes to it, and the store that tells
 * React when it changed.
 */
const listeners = new Set<() => void>();

export function subscribeToDesign(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function readActiveDesign(): DesignId {
  if (typeof document === "undefined") return DEFAULT_DESIGN;
  const attribute = document.documentElement.getAttribute("data-design");
  return isDesignId(attribute) ? attribute : DEFAULT_DESIGN;
}

export function getDesignSnapshot(): DesignId {
  return readActiveDesign();
}

export function getServerDesignSnapshot(): DesignId {
  return DEFAULT_DESIGN;
}

/**
 * Mirrors the choice into the URL so a design can be linked to. Written with
 * replaceState so switching never fills the back button with design changes.
 */
function syncQueryParam(design: DesignId) {
  try {
    const url = new URL(window.location.href);
    if (url.searchParams.get(DESIGN_QUERY_PARAM) === design) return;
    url.searchParams.set(DESIGN_QUERY_PARAM, design);
    window.history.replaceState(null, "", url);
  } catch {
    // History is a convenience here, not a requirement.
  }
}

export function setActiveDesign(design: DesignId) {
  document.documentElement.setAttribute("data-design", design);
  writeStoredDesign(design);
  syncQueryParam(design);

  for (const listener of listeners) listener();
}

export function toggleActiveDesign() {
  const current = readActiveDesign();
  setActiveDesign(
    DESIGN_IDS[(DESIGN_IDS.indexOf(current) + 1) % DESIGN_IDS.length],
  );
}
