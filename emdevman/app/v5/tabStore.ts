"use client";

import { V5_TABS, tabFromHash } from "./tabs";

/**
 * Which tab is showing, and the URL that says so.
 *
 * `useState` plus an effect that read `location.hash` on mount was the obvious
 * version and it is wrong twice over: the effect calls `setState` synchronously,
 * which React 19's compiler-enabled lint rightly rejects as a cascading render,
 * and the state it produces arrives one commit *after* the first paint, so a
 * shared `/v5#projects` shows a frame of Home before it shows Projects.
 *
 * `useSyncExternalStore` is the right shape for this and the codebase already
 * uses it for the same problem in `ThemeControl` and in `next-themes` itself.
 * The hash genuinely is an external store - the browser owns it - so the tab is
 * read from it directly rather than mirrored into state that then has to be kept
 * in step. React compares the server snapshot with the client's and re-renders
 * once after hydration if they differ, which is the one re-render this can have
 * and the reason it is not a cascading one.
 *
 * The mirror below is not state, it is a cache. `getSnapshot` must return the
 * same value for the same input - React calls it on every render to check whether
 * the store moved - so the parsed hash is held once instead of being re-parsed,
 * and `selectTab` can publish a value the URL has not caught up with yet.
 */

type Listener = () => void;

let cached: string | null = null;
const listeners = new Set<Listener>();

/**
 * Subscribe to tab changes.
 *
 * `popstate` rather than `hashchange`, because `selectTab` writes with
 * `replaceState`, which fires no event at all. So the only entries that can
 * arrive here are ones the browser pushed on its own, and those always come
 * through `popstate`.
 */
function subscribe(onStoreChange: Listener) {
  listeners.add(onStoreChange);

  const onPopState = () => {
    // Drop the mirror so the next read comes from the URL the browser is now
    // showing, rather than from the value this store last published.
    cached = null;
    onStoreChange();
  };

  window.addEventListener("popstate", onPopState);

  return () => {
    listeners.delete(onStoreChange);
    window.removeEventListener("popstate", onPopState);
  };
}

/**
 * The tab the URL names, or Home.
 *
 * Also where the value gets cached, which is what makes this safe to call during
 * render: `Intl` and the regex in `tabFromHash` are cheap, but the contract is
 * about identity rather than cost.
 */
function getSnapshot() {
  if (cached === null) cached = tabFromHash(window.location.hash);
  return cached;
}

/**
 * What the server rendered.
 *
 * Home, always, and not "whatever the hash says" - the hash is not in the RSC
 * payload, so a server that read it would hand this page markup the client would
 * immediately discard. React reconciles the two snapshots itself; nothing here
 * has to.
 */
function getServerSnapshot() {
  return V5_TABS[0].id;
}

/**
 * Switch tabs and put the tab in the URL.
 *
 * `replaceState`, not `pushState`. A tab switch replaces the panel's contents
 * without moving the reader anywhere, and pushing an entry per click fills the
 * history with near-identical frames - so Back would walk back through six views
 * of the same page before it left.
 *
 * The history entry is written here rather than by a link, because all nine
 * controls - two rails, a tab strip, a header, a search box - share this one
 * function and none of them should own a URL format.
 */
export function selectTab(id: string) {
  cached = id;
  window.history.replaceState(
    null,
    "",
    `${window.location.pathname}#${id}`,
  );
  listeners.forEach((listener) => listener());
}

export { subscribe, getSnapshot, getServerSnapshot };