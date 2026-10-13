import { V5_TABS } from "./tabs";

/**
 * The sticky tab bar.
 *
 * `role="tablist"` with real tabs, because this is a tab panel and a row of six
 * buttons styled to look like links is not one: a screen reader user needs to be
 * able to ask how many tabs there are and move between them. The arrow-key
 * handling below is what makes that promise true - Tab moves out of the bar to
 * the feed, which is the behaviour a tablist is supposed to have and the one a
 * row of buttons does not.
 *
 * The mobile bottom bar is a second control for the same six tabs, and it is a
 * row of plain buttons rather than a second tablist: two tablists describing the
 * same thing means two of everything in the accessibility tree for no gain, and
 * the bottom bar is a navigation convenience rather than the primary way round
 * this page.
 */
export function V5Tabs({
  active,
  onChange,
}: {
  active: string;
  onChange: (id: string) => void;
}) {
  const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;

    const index = V5_TABS.findIndex((tab) => tab.id === active);
    if (index < 0) return;

    event.preventDefault();
    const step = event.key === "ArrowRight" ? 1 : -1;
    const next = V5_TABS[(index + step + V5_TABS.length) % V5_TABS.length];

    onChange(next.id);
    document
      .querySelector<HTMLButtonElement>(`[data-v5-tab="${next.id}"]`)
      ?.focus();
  };

  return (
    <div
      className="v5-sticky v5-tabbar"
      role="tablist"
      aria-label="Profile sections"
      onKeyDown={onKeyDown}
    >
      {V5_TABS.map((tab) => {
        const isActive = tab.id === active;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            data-v5-tab={tab.id}
            id={`v5-tab-${tab.id}`}
            aria-selected={isActive}
            aria-controls="v5-tabpanel"
            tabIndex={isActive ? 0 : -1}
            onClick={() => onChange(tab.id)}
            className="v5-tab"
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

/**
 * The feed area.
 *
 * `tabIndex={-1}` so the panel can take focus programmatically - which is what
 * a tablist is supposed to do on activation, and what lets the reader who used
 * the arrow keys land on the content they chose rather than having to hunt for
 * it. It is not in the normal tab order, so someone tabbing past the bar still
 * reaches the posts themselves.
 */
export function V5TabPanel({
  active,
  children,
}: {
  active: string;
  children: React.ReactNode;
}) {
  return (
    <div
      id="v5-tabpanel"
      role="tabpanel"
      aria-labelledby={`v5-tab-${active}`}
      tabIndex={-1}
      className="outline-none"
    >
      {children}
    </div>
  );
}