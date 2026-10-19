import type { CSSProperties } from "react";

import LanyardBadge from "@/app/components/LanyardBadge";
import { EMAIL_MAILTO } from "@/app/lib/contact";
import profileImage from "../assets/images/PROFILE-IMAGE-NO-BG.png";

const socials = [
  { label: "github", href: "https://github.com/emsanity-md" },
  { label: "linkedin", href: "https://www.linkedin.com/in/emmanuel-bitancor-40a582426" },
  { label: "email", href: EMAIL_MAILTO },
];

/**
 * v3's hero.
 *
 * This section used to branch on `useDesign()` and hold a second hero for v2 -
 * a greeting, a tagline, two raised buttons and the portrait on the right.
 * v2 is its own tree under `app/v2/` now, so what is left here is one layout
 * and nothing above it.
 *
 * Two consequences worth naming, because both are the kind of thing a branch
 * leaves behind:
 *
 *   - The file is a server component again. `"use client"` was here only to
 *     reach `useDesign()`, and a server component cannot be conditionally
 *     client, so the whole hero - including the portrait, which is static - was
 *     shipping as a hydration boundary for a boolean.
 *   - The copy is untouched. The two heroes said different things, and which of
 *     them was right is not a question a refactor gets to answer; v3 keeps
 *     exactly what it said before.
 */
export default function Hero() {
  return (
    <section id="home" className="hero relative z-10">
      {/* Padding belongs to the shell - html[data-design="v3"] .hero owns it,
          so the hero shares the section gutter instead of sitting out of line
          with everything below it. */}
      {/* The badge leads, and is the only thing in the column. The track is
          20rem rather than the old 18rem because the badge carries its own
          type and id line now, and at 18rem those read as smudges.

          Mobile needs no special case. Below `sm` this grid is one column, so
          the badge sits centred above the text on its own, and the badge's own
          `aspect-[4/5]` keeps its height - which is the one thing it needs and
          cannot be given by a parent that sizes to content. */}
      <div className="grid gap-9 sm:grid-cols-[20rem_1fr] sm:items-start sm:gap-10">
        {/* The reveal index is unchanged, so the entrance still staggers
            badge, name, paragraph, paragraph, links. The portrait is imported
            straight from app/assets the way app/lib/about.ts imports the
            stills, so there is no second copy in public/ to keep in step. */}
        <div
          className="reveal mx-auto w-full max-w-[22rem] sm:mx-0 sm:w-full"
          style={{ "--reveal-index": 1 } as CSSProperties}
        >
          <LanyardBadge
            name="Emmanuel Bitancor"
            role="Full-stack developer"
            id="001"
            imageSrc={profileImage.src}
            strapText="EMMANUEL.DEV"
          />
        </div>

        <div>
          <h1
            className="reveal display-pixel text-3xl leading-none sm:text-[2.6rem]"
            style={{ "--reveal-index": 2 } as CSSProperties}
          >
            Emmanuel Bitancor
          </h1>
          <p
            className="reveal mt-6 text-[15px] leading-relaxed text-muted-foreground"
            style={{ "--reveal-index": 3 } as CSSProperties}
          >
            I&apos;m a full-stack engineer. I build modern web &amp; mobile apps, and these days I&apos;m focused on Networking.
          </p>
          <p
            className="reveal mt-5 text-[15px] leading-relaxed text-muted-foreground"
            style={{ "--reveal-index": 4 } as CSSProperties}
          >
            I like taking a rough idea and turn it into something people
            actually want to use.
          </p>

          {/* Mono text links with a trailing arrow - not buttons. */}
          <div
            className="reveal mt-7 flex flex-wrap items-center gap-x-3 gap-y-1.5 font-mono text-[12px] text-muted-foreground"
            style={{ "--reveal-index": 5 } as CSSProperties}
          >
            {socials.map((social) => (
              <a
                key={social.label}
                href={social.href}
                target={social.href.startsWith("http") ? "_blank" : undefined}
                rel={social.href.startsWith("http") ? "noopener noreferrer" : undefined}
                className="hover:text-foreground"
              >
                {social.label} <span aria-hidden="true">↗</span>
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}