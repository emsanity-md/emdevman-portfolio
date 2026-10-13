"use client";

import Image from "next/image";
import Link from "next/link";
import { useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { useDesign } from "@/app/context/DesignProvider";
import { BadgeCheck } from "lucide-react";

import { V5_AVATAR, V5_FULL_NAME, V5_HANDLE, railLinks } from "./profile";
import { V5_TABS } from "./tabs";

/**
 * The left rail: brand, the six destinations, the call to action, and the
 * mini profile card.
 *
 * `sticky h-screen` rather than `fixed`. Fixed would take it out of the grid flow
 * and leave a hole where the column beside it had to start; sticky keeps it a
 * real cell that happens not to scroll.
 *
 * The six links write to the same `onChange` the tab bar does, so the rail and
 * the tab can never disagree - there is no "active" state to sync, because
 * neither of them owns one. The Home entry is not here: the wordmark above is
 * the way back to the feed, and two controls for one destination is one too
 * many. The right rail's footer repeats the other five for the same reason - by
 * the time a reader is at the bottom of the page, the left rail is a screen away.
 */
export function V5LeftRail({
  active,
  onChange,
}: {
  active: string;
  onChange: (id: string) => void;
}) {
  const pathname = usePathname();

  const { design } = useDesign();

  return (
    <aside className="v5-rail v5-rail--left" aria-label="Profile">
      <Link href="/" className="v5-brand" aria-label="Emmanuel Bitancor home">
        ENLSB
      </Link>

      <nav className="v5-nav mt-4" aria-label="Profile sections">
        {railLinks.map((link) => {
          const tab = V5_TABS.find((candidate) => candidate.id === link.section);
          if (!tab) return null;
          const Icon = tab.Icon;
          const isActive = active === tab.id;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChange(tab.id)}
              aria-current={isActive ? "page" : undefined}
              className="v5-nav-link w-full text-left"
            >
              <Icon className="v5-nav-icon" aria-hidden="true" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="mt-6">
        <Link href="/#contact" className="v5-cta" onClick={(event) => {
          // The rail's CTA targets the Contacts tab, not the root's contact
          // section: a reader who presses "Hire Me" here is asking for the form,
          // not for a scroll position on a page that no longer has one.
          if (pathname === "/v5" || design === "v5") {
            event.preventDefault();
            onChange("contact");
          }
        }}>
          Hire Me
        </Link>
      </div>

      <div className="mt-auto border-t border-border pt-3">
        <Link href="/" className="v5-mini">
          {/*
            The rail's avatar is the one place a second <img> for the same face is
            right: it is 36px of chrome, it is a link to a different page, and it
            is in a different part of the tree from the feed, so there is no
            element to share with.
          */}
          <div className="v5-avatar v5-avatar--xs overflow-hidden">
            <Image
              src={V5_AVATAR}
              alt=""
              width={36}
              height={36}
              draggable={false}
              className="size-full object-cover"
            />
          </div>
          <div className="min-w-0">
            <p className="v5-mini-name">{V5_FULL_NAME}</p>
            <p className="v5-mini-handle truncate">{V5_HANDLE}</p>
          </div>
          <BadgeCheck
            className="ml-auto size-4 shrink-0 text-primary"
            aria-label="Verified"
          />
        </Link>

        {/*
          A live announcement of the resolved theme, for the same reason the rest
          of the rail is themed: the control that changes it is three columns
          away. It is text-only and screen-reader-only, so it costs nothing
          visually and it tells assistive tech what the palette is.

          `useTheme()`'s `resolvedTheme` differs between server (always "system")
          and client (the actual resolved theme), so rendering it directly causes
          a hydration mismatch. A mounted guard prevents the SSR render entirely;
          the announcement fires once hydration completes.
        */}
        <ThemeAnnouncer />
      </div>
    </aside>
  );
}

/** Renders only after hydration, so `resolvedTheme` is stable. */
function ThemeAnnouncer() {
  const { resolvedTheme } = useTheme();
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  if (!mounted) return null;

  return (
    <p className="sr-only" role="status" aria-live="polite">
      {resolvedTheme === "dark" ? "Dark" : "Light"} theme active
    </p>
  );
}