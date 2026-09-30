"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";

import type { DesignId } from "@/app/lib/designs";
import {
  getDesignSnapshot,
  getServerDesignSnapshot,
  setActiveDesign,
  subscribeToDesign,
} from "./designStore";

type DesignContextValue = {
  /** The design currently applied to <html>. */
  design: DesignId;
  /** Apply one design. The switch's menu calls this per entry. */
  setDesign: (design: DesignId) => void;
};

const DesignContext = createContext<DesignContextValue | null>(null);

export function DesignProvider({ children }: { children: ReactNode }) {
  // Subscribed rather than stored in state: the pre-paint script has already
  // resolved the design on <html> by the time React boots, so there is
  // nothing to synchronise and no effect to run.
  const design = useSyncExternalStore(
    subscribeToDesign,
    getDesignSnapshot,
    getServerDesignSnapshot,
  );

  const setDesign = useCallback((next: DesignId) => {
    setActiveDesign(next);
  }, []);

  const value = useMemo(() => ({ design, setDesign }), [design, setDesign]);

  return (
    <DesignContext.Provider value={value}>{children}</DesignContext.Provider>
  );
}

export function useDesign() {
  const context = useContext(DesignContext);
  if (!context) {
    throw new Error("useDesign must be used within <DesignProvider>");
  }
  return context;
}
