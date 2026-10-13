import {
  Activity,
  FolderKanban,
  Home as HomeIcon,
  Layers,
  Mail,
  UserRound,
  type LucideIcon,
} from "lucide-react";

import { navLinks } from "@/app/lib/navigation";

/**
 * v5's six tabs, derived rather than restated.
 *
 * The order comes from `navLinks`, which is the single list the navbar, the v3
 * sidebar rail and the footer all read. Declaring a second order here would be a
 * second place to forget an entry, and the two would disagree silently - which
 * is what happened when v1 needed its own `v1Sections` list with a hole where
 * Activity used to be.
 *
 * Only three things are v5's own: the icon, the label ("Contacts" rather than
 * "Contact", because it holds a form and four addresses rather than one), and
 * the fact that a tab is a route fragment rather than a scroll target.
 */

export interface V5Tab {
  /** The id, which is also the hash: `/v5#projects`. */
  id: string;
  label: string;
  Icon: LucideIcon;
}

const ICONS: Record<string, LucideIcon> = {
  home: HomeIcon,
  "tech-stack": Layers,
  github: Activity,
  projects: FolderKanban,
  about: UserRound,
  contact: Mail,
};

const LABELS: Record<string, string> = {
  contact: "Contacts",
};

export const V5_TABS: V5Tab[] = navLinks.map((link) => ({
  id: link.section,
  label: LABELS[link.section] ?? link.name,
  Icon: ICONS[link.section] ?? HomeIcon,
}));

/**
 * Hash → tab, for a URL that names a tab this build does not have.
 *
 * Falling back rather than throwing is the point: an old bookmark, a link from
 * someone's message, or a fragment left in a shared URL should land on Home
 * rather than on an empty feed.
 */
export function tabFromHash(hash: string): string {
  const id = hash.replace(/^#/, "");
  return V5_TABS.some((tab) => tab.id === id) ? id : V5_TABS[0].id;
}

/** The label for a tab id, for anywhere that has the id and not the tab. */
export function tabLabel(id: string): string {
  return V5_TABS.find((tab) => tab.id === id)?.label ?? id;
}