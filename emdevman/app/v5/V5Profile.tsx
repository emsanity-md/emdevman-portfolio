"use client";

import { useSyncExternalStore, useState } from "react";

import { V5BottomNav } from "./V5BottomNav";
import { V5Header } from "./V5Header";
import { V5TabPanel, V5Tabs } from "./V5Tabs";
import { V5TopBar } from "./V5TopBar";
import {
  getServerSnapshot,
  getSnapshot,
  selectTab,
  subscribe,
} from "./tabStore";
import { V5AboutPanel } from "./panels/V5AboutPanel";
import { V5ActivityPanel } from "./panels/V5ActivityPanel";
import { V5ContactsPanel } from "./panels/V5ContactsPanel";
import { V5HomePanel } from "./panels/V5HomePanel";
import { V5ProjectsPanel } from "./panels/V5ProjectsPanel";
import { V5TechPanel } from "./panels/V5TechPanel";

/**
 * v5's whole page: two rails, a feed, and the tab that binds them.
 *
 * One tab and one `selectTab`, and everything that can change the tab goes
 * through it. The left rail, the bottom bar, the tab strip, the header's two
 * buttons, the right rail's search and its featured "View" buttons, the tech
 * chips: nine controls, one value, so there is no possibility of two of them
 * disagreeing about which tab is showing. The rail and the tab bar are not
 * "synced"; they cannot be out of step, because neither owns the tab.
 *
 * The search query is the one piece of local state, and it is not in the URL -
 * it is a transient filter, not a destination, and a `/v5#projects?q=react`
 * would be a link worth sharing only once.
 */
export function V5Profile() {
  const active = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const [query, setQuery] = useState("");

  return (
    <div className="v5-frame v5-frame--single">

      <main className="v5-column" id="v5-feed">
        <V5TopBar />
        <V5Header />
        <V5Tabs active={active} onChange={selectTab} />

        {/*
          The panels are all mounted or none of them are: only the selected one is
          in the tree.

          Keeping the other five mounted would mean the GitHub calendar fetching
          on page load while the reader is on Home, and six live regions in one
          document. The trade is that switching tabs re-runs the calendar's fetch -
          which its own effect already handles, and which a reader who moves to
          Activity and back has asked for twice.
        */}
        <V5TabPanel active={active}>
          {active === "home" ? (
            <V5HomePanel onNavigate={selectTab} />
          ) : active === "tech-stack" ? (
            <V5TechPanel />
          ) : active === "github" ? (
            <V5ActivityPanel />
          ) : active === "projects" ? (
            <V5ProjectsPanel query={query} onQueryChange={setQuery} />
          ) : active === "about" ? (
            <V5AboutPanel onNavigate={selectTab} />
          ) : (
            <V5ContactsPanel />
          )}
        </V5TabPanel>
      </main>

      <V5BottomNav active={active} onChange={selectTab} />
    </div>
  );
}