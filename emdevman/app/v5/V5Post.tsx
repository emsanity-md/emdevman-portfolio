import Image from "next/image";
import { Pin } from "lucide-react";

import { V5_AVATAR, V5_FULL_NAME, V5_HANDLE } from "./profile";

/**
 * The post: the one unit every tab on this page is made of.
 *
 * A profile page is a feed, and the reason that shape works for a portfolio is
 * that a portfolio is already a list of things that were made. So the pinned
 * intro, a project, a stack group, the calendar, an education entry and the
 * contact form are all the same component with different children - which is why
 * the column scans as one column rather than as five sections wearing a feed's
 * clothes.
 *
 * `body` and `footer` are passed as nodes rather than as props for the things
 * they contain, because the children are what differ per tab and a prop-shaped
 * API would end up with a union nobody could read.
 */
export function V5Post({
  children,
  pinned = false,
  time,
  meta,
  actions,
}: {
  children?: React.ReactNode;
  /** The "Pinned" line above the name, as on X's own pinned post. */
  pinned?: boolean;
  /** A short relative time, set in the byline. Omit and it is left out entirely. */
  time?: string;
  /** Anything after the handle - a category, a year. */
  meta?: React.ReactNode;
  /** The outbound links row under the body. */
  actions?: React.ReactNode;
}) {
  return (
    <article className="v5-post">
      {pinned ? (
        <p className="mb-2 flex items-center gap-1.5 text-sm font-bold text-muted-foreground">
          <Pin className="size-3.5" aria-hidden="true" />
          Pinned
        </p>
      ) : null}

      <header className="v5-post-head">
        <Avatar />

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-1.5">
            <span className="v5-post-name">{V5_FULL_NAME}</span>
            <span className="v5-badge-check" title="Verified">
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path
                  d="M20 6 9 17l-5-5"
                  stroke="currentColor"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span className="sr-only">Verified</span>
            </span>
            <span className="v5-post-handle">{V5_HANDLE}</span>
            {time ? (
              <>
                <span className="v5-post-handle" aria-hidden="true">
                  ·
                </span>
                <span className="v5-post-handle">{time}</span>
              </>
            ) : null}
            {meta}
          </div>
        </div>
      </header>

      <div className="v5-post-body">{children}</div>

      {actions ? <div className="v5-post-actions">{actions}</div> : null}
    </article>
  );
}

/**
 * The avatar every post carries.
 *
 * The same photograph the header uses, at `next/image`'s smallest useful size.
 * It is declared once per post rather than once per page because these posts are
 * not a list that scrolls - only the panel in view is in the DOM - so a shared
 * element would have to be rendered from a portal to be present in two places at
 * once, and two `<img>` elements for one face is the thing a reader notices.
 */
export function Avatar({
  size = "md",
  priority = false,
  className = "",
}: {
  size?: "md" | "sm" | "xs";
  priority?: boolean;
  className?: string;
}) {
  const dimension = size === "md" ? 48 : size === "sm" ? 40 : 36;
  const sizing = size === "md" ? " v5-avatar--md" : size === "sm" ? " v5-avatar--sm" : " v5-avatar--xs";

  return (
    <div
      className={`v5-avatar${sizing} ${className}`.trim()}
      style={{ height: dimension, width: dimension }}
    >
      <Image
        src={V5_AVATAR}
        alt=""
        width={dimension}
        height={dimension}
        priority={priority}
        draggable={false}
      />
    </div>
  );
}

/** The byline's trailing slot - a category chip, a year, a status. */
export function PostMeta({ children }: { children: React.ReactNode }) {
  return <span className="v5-chip v5-chip--accent ml-1.5">{children}</span>;
}