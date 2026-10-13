/* eslint-disable @next/next/no-img-element */
"use client";

import Image from "next/image";
import { useEffect, useState, useSyncExternalStore } from "react";
import { CalendarDays, Github, LinkIcon, MapPin } from "lucide-react";

import { aboutFocus, aboutLocation } from "@/app/lib/about";
import { cvContact, cvProfile } from "@/app/lib/cv";

import {
  SINCE_YEAR,
  V5_AVATAR,
  V5_FULL_NAME,
  V5_HANDLE,
  V5_SITE_LABEL,
  V5_STATS,
} from "./profile";

/**
 * The profile header: banner, avatar, the two buttons, the identity block, the
 * meta row and the stats.
 *
 * The avatar hangs out of the banner's bottom-left with a 4px ring in the *page*
 * background colour, which is the whole trick and the reason `--v5-page` exists
 * as a token separate from `--card`: the ring is what the avatar overlaps with,
 * and using the centre column's white here would cut a white notch across the
 * gradient wherever the light theme was on.
 *
 * Everything below the avatar is data from elsewhere - `lib/cv.ts` for the name
 * and the links, `lib/about.ts` for the location, `lib/data.ts` for the project
 * count - so a change to any of those reaches this header without anyone editing
 * it.
 */
const COVER_MEDIA = [
  { label: "Original", base: "/images/cover" },
  { label: "Cherry Blossom", base: "/images/covers/cover1" },
  { label: "Demon Slayer", base: "/images/covers/cover2" },
  { label: "Black Clover", base: "/images/covers/cover3" },
] as const;

export function V5Header() {
  const [coverIndex, setCoverIndex] = useState(0);
  const prefersReducedMotion = useSyncExternalStore(
    (callback) => {
      const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
      mediaQuery.addEventListener("change", callback);
      return () => mediaQuery.removeEventListener("change", callback);
    },
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => false,
  );

  return (
    <header>
      {/*
        The banner is a CSS gradient, not an image. There is no 3:1 asset in the
        repo to use, and a gradient is the one thing here that follows the theme
        for free - `.v5-banner` and `.dark .v5-banner` in v5.css are two ramps of
        the same three blues, the dark one pitched down so it does not glare.
      */}
      <div
        className="v5-banner relative"
        role="img"
        aria-label={`${V5_FULL_NAME}'s banner`}
        aria-hidden="true"
      >
        <img
          key={`cover-${coverIndex}`}
          src={
            prefersReducedMotion
              ? `${COVER_MEDIA[coverIndex].base}-poster.jpg`
              : `${COVER_MEDIA[coverIndex].base}.gif`
          }
          alt=""
          width={498}
          height={280}
          className="absolute inset-0 h-full w-full object-cover object-center"
          draggable={false}
        />
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/[0.10] to-transparent"
          aria-hidden="true"
        />
        <div className="absolute bottom-2 right-2 z-10 flex gap-1.5 rounded-full bg-black/30 p-1.5 backdrop-blur-sm">
          {COVER_MEDIA.map((cover, index) => (
            <button
              key={cover.base}
              type="button"
              onClick={() => setCoverIndex(index)}
              aria-label={`Show ${cover.label} cover`}
              title={cover.label}
              className={`h-2.5 w-2.5 rounded-full transition-colors ${
                index === coverIndex ? "bg-white" : "bg-white/40 hover:bg-white/70"
              }`}
            />
          ))}
        </div>
      </div>

      <div className="v5-profile-head">
        {/*
          The avatar is absolutely positioned against `.v5-profile-head`, which
          carries `padding-top: 4.25rem` - 68px, being 64px of avatar plus the 4px
          that the -4rem offset pulls up. The button row below starts at 68px
          rather than at 0, so it clears the avatar without a second offset that
          would have to be kept in step with the first.
        */}
        <div className="v5-avatar">
          <Image
            src={V5_AVATAR}
            alt={`${V5_FULL_NAME}, full-stack developer`}
            fill
            priority
            draggable={false}
            sizes="128px"
          />
        </div>

        <div className="v5-profile-row">
          {/* The page's one h1, here rather than in the identity block, so it is
              the first thing in the document order and not a screen down. */}
          <h1 className="sr-only">{V5_FULL_NAME}</h1>


        </div>
      </div>

      <V5Identity />
    </header>
  );
}

/**
 * The identity block: name, handle, bio, the meta row, the stats.
 *
 * The bio is existing copy rather than a new line written for a profile layout.
 * A profile page's bio field is short by convention, and the two sentences this
 * repo already has are exactly the right length for it.
 */
function V5Identity() {
  return (
    <div className="v5-identity">
      <h2 className="flex items-center gap-2 text-xl font-extrabold leading-7">
        {V5_FULL_NAME}
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
      </h2>
      <p className="text-[15px] leading-5 text-muted-foreground">{V5_HANDLE}</p>

      <p className="mt-3 text-[15px] leading-6">{BIO}</p>

      <div className="v5-meta-row">
        <span className="v5-meta">
          <MapPin className="v5-meta-icon" aria-hidden="true" />
          {aboutLocation}
        </span>

        {website ? (
          <a
            href={website.href}
            target="_blank"
            rel="noopener noreferrer"
            className="v5-meta v5-meta--link"
          >
            <LinkIcon className="v5-meta-icon" aria-hidden="true" />
            {V5_SITE_LABEL}
          </a>
        ) : null}

        {github ? (
          <a
            href={github.href}
            target="_blank"
            rel="noopener noreferrer"
            className="v5-meta v5-meta--link"
          >
            <Github className="v5-meta-icon" aria-hidden="true" />
            {github.value}
          </a>
        ) : null}

        <span className="v5-meta">
          <CalendarDays className="v5-meta-icon" aria-hidden="true" />
          <Joined />
        </span>
      </div>

      <div className="v5-stats">
        <span className="v5-stat">
          <span className="v5-stat-value">{V5_STATS.projects}</span> Projects
        </span>
        <span className="v5-stat">
          <span className="v5-stat-value">{V5_STATS.technologies}</span>{" "}
          Technologies
        </span>
        <span className="v5-stat">
          <span className="v5-stat-value">{V5_STATS.years}</span> Years
        </span>
      </div>
    </div>
  );
}

/**
 * "Joined <month year>", from the account creation date the profile route already
 * fetches.
 *
 * It is a live fact rather than a constant, and it is also the one number in the
 * header that can fail: the stats half of `/api/github-profile` is rate limited
 * and falls back to `null`. So the date has a floor - `SINCE_YEAR`, the same
 * year the "3 Years" figure counts from - and the two cannot disagree about when
 * the account appeared without one of them being wrong about something the page
 * can check.
 *
 * Rendered as a `<span>` inside the meta row, so the row's markup does not have
 * to change between the two states.
 */
function Joined() {
  const [label, setLabel] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    const load = async () => {
      try {
        const response = await fetch("/api/github-profile", {
          signal: controller.signal,
          cache: "no-store",
        });
        if (!response.ok) return;

        const result = (await response.json()) as {
          profile?: { createdAt?: string | null } | null;
        };
        const createdAt = result.profile?.createdAt;
        if (!createdAt) return;

        const date = new Date(createdAt);
        if (Number.isNaN(date.getTime())) return;

        setLabel(
          `Joined ${new Intl.DateTimeFormat("en", {
            month: "long",
            year: "numeric",
            timeZone: "UTC",
          }).format(date)}`,
        );
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
        /*
          Every other failure leaves the fallback standing, silently. A missing
          "Joined" line is not worth an error state on a portfolio - the rest of
          the page is unaffected by it, and a reader has no way to fix a rate
          limit.
        */
      }
    };

    void load();
    return () => controller.abort();
  }, []);

  return <>{label ?? `Joined ${SINCE_YEAR}`}</>;
}

/**
 * The bio line.
 *
 * `lib/cv.ts`'s title and `lib/about.ts`'s focus, joined: what he does, then the
 * bit that makes it a specific answer rather than a job title. Both are already
 * written down, so neither is retyped here.
 */
const BIO = `${cvProfile.title}. ${aboutFocus}.`;

/*
  The website and GitHub rows, read from the shared contact list rather than
  written out again. `cvContact` is the one place those four addresses live, and
  hardcoding `https://github.com/emsanity-md` here would be the third copy in the
  repo - the other two being `lib/contributions.ts`'s neighbour `app/v1/sections.ts`
  and the footer.
*/
const website = cvContact.find((link) => link.label === "Website");
const github = cvContact.find((link) => link.label === "GitHub");