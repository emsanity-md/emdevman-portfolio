/**
 * The glyph for each design, in one place.
 *
 * The design switch draws one of these on its trigger and beside every row in
 * its menu; the v0 ring draws the same five at card size. They were duplicated
 * for about a minute, which is exactly long enough for the ring and the menu to
 * start disagreeing about which icon means which version - so the map lives
 * here and both import it.
 *
 * Importing lucide components into a server module is fine: they are plain
 * components, and nothing here is rendered until a client component asks for it.
 */

import {
  ArrowUpRight,
  FileText,
  Orbit,
  Palette,
  Radio,
  ScrollText,
  type LucideIcon,
} from "lucide-react";

import type { DesignId } from "./designs";

export const DESIGN_GLYPHS: Record<DesignId, LucideIcon> = {
  // v0's own mark: the ring the design is built from.
  v0: Orbit,
  v5: Radio,
  v4: ScrollText,
  v3: ArrowUpRight,
  v2: Palette,
  v1: FileText,
};

/**
 * What the v0 ring offers.
 *
 * Not `DESIGN_IDS`, because that list now starts with v0 itself and a card that
 * opens the page you are already on is a dead control. Newest first, so the
 * ring reads in the same order as the dropup's menu.
 */
export const V0_CARD_DESIGNS = ["v5", "v4", "v3", "v2", "v1"] as const;

export type V0CardDesign = (typeof V0_CARD_DESIGNS)[number];
