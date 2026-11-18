"use client";

import portraitNoBg from "@/app/assets/portrait-no-bg.png";
import { TechStackMarquee } from "@/app/components/TechStackSkills";
import { ParallaxScrolling } from "@/app/components/ui/parallax-scrolling";
import { useDesign } from "@/app/context/DesignProvider";
import { cvProfile } from "@/app/lib/cv";

import { V5_FULL_NAME } from "./profile";

/**
 * v5's page: one full-bleed parallax hero.
 *
 * The banner is no longer a banner above a feed, and there is no profile block
 * under it either. A night sky and a mountain cutout travel at different rates
 * while the portrait in front stays almost still. The figure reuses
 * `portrait-no-bg.png`, the transparent head-and-shoulders cutout already in the
 * repo.
 *
 * The social-profile header that used to sit below the scene - avatar, handle,
 * bio, joined date, stats - has been removed rather than restyled. It repeated
 * the name the hero already carries, and it made the page read as a Twitter
 * profile rather than a portfolio. What is left is the scene, the name and
 * toolkit inside it, and the theme control floating over the top-right corner.
 *
 * The two background plates are local copies of Osmo's parallax art
 * (`public/images/parallax/`), not hotlinks: the scene is part of the page's
 * first paint, so it has to survive the CDN being unavailable.
 *
 * `enabled` is the design check that keeps Lenis and ScrollTrigger off the other
 * five designs, which are mounted in the same document and would otherwise be
 * smooth-scrolled by v5's hero.
 */
export function V5Header() {
  const { design } = useDesign();
  const displayName = `${cvProfile.given} ${cvProfile.family}`;

  return (
    <header>
      {/* The page's one h1, ahead of the scene so heading order starts at 1 and
          the name is the first thing a screen reader meets. */}
      <h1 className="sr-only">{V5_FULL_NAME}</h1>

      <ParallaxScrolling
        background="/images/parallax/sky.webp"
        midground="/images/parallax/mountains.webp"
        foreground={portraitNoBg}
        foregroundAlt={`${V5_FULL_NAME}, full-stack developer`}
        title={displayName}
        titleContent={
          /*
            The name stays static: it is the one thing on the page that should
            read instantly, and a canvas that redraws it can only make that
            slower. What animates is the toolkit underneath.

            `TechStackMarquee` is the same row v1 and v3 render in their Tech
            Stack section - same `techCategories`, same three-copy seam, same
            CSS keyframes. v5 only restyles the chips for the dark scene, so
            adding a skill in `lib/tech.ts` reaches this hero too.
          */
          <div className="v5-hero-copy">
            <h2 className="v5-hero-name">{displayName}</h2>
            <div className="v5-hero-stack" role="group" aria-label="Tech stack">
              <TechStackMarquee showLevels={false} />
            </div>
          </div>
        }
        label={`${V5_FULL_NAME}'s banner`}
        enabled={design === "v5"}
      />
    </header>
  );
}
