"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, MapPin } from "lucide-react";

import ToolTile from "@/app/components/ui/ToolTile";
import {
  aboutBio,
  aboutFocus,
  aboutImages,
  aboutLocation,
  aboutQuote,
  aboutStrengths,
} from "@/app/lib/about";

/**
 * v3's About section.
 *
 * One column at the reading measure, with numbered pixel markers per block -
 * the same shape the reference uses for its blog, experience and affiliations
 * blocks.
 *
 * Two things are deliberately gone from the version this replaces: the image
 * carousel (three arrows, three thumbnails, two swipe handlers and a live
 * region, to show three still images) and the icon-in-a-box principle cards.
 * The principles now use ToolTile, which is the reference's affiliations row -
 * a mark, a name at 13px and a muted line, with no card around it.
 */
export function V3About() {
  return (
    <div>
      <p className="text-[15px] leading-7 text-muted-foreground">{aboutBio}</p>

      <section className="section-block" aria-labelledby="about-now">
        <h3 id="about-now" className="display-pixel mb-5 text-sm text-faint">
          01 - now
        </h3>
        <div className="rows">
          <div className="row flex items-baseline justify-between gap-6 px-1 py-3.5">
            <span className="stat-label">Focus</span>
            <span className="text-right text-[14px] text-foreground">{aboutFocus}</span>
          </div>
          <div className="row flex items-center justify-between gap-6 px-1 py-3.5">
            <span className="stat-label">Based in</span>
            <span className="flex items-center gap-1.5 text-right text-[14px] text-foreground">
              <MapPin className="size-3.5 shrink-0 text-faint" aria-hidden="true" />
              {aboutLocation}
            </span>
          </div>
        </div>
      </section>

      <section className="section-block" aria-labelledby="about-approach">
        <h3 id="about-approach" className="display-pixel mb-5 text-sm text-faint">
          02 - approach
        </h3>
        <div className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
          {aboutStrengths.map((strength) => (
            <ToolTile
              key={strength.title}
              name={strength.title}
              description={strength.description}
              mark={<strength.icon className="size-4" />}
            />
          ))}
        </div>
      </section>

      <section className="section-block" aria-labelledby="about-frames">
        <h3 id="about-frames" className="display-pixel mb-5 text-sm text-faint">
          03 - frames
        </h3>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          {aboutImages.map((image, index) => (
            <figure key={image.alt} className="m-0">
              <div className="relative aspect-[4/3] overflow-hidden rounded-xl border border-border bg-muted">
                <Image
                  src={image.src}
                  alt={image.alt}
                  fill
                  loading="lazy"
                  className="object-cover"
                  sizes="(max-width: 639px) 100vw, 210px"
                />
              </div>
              <figcaption className="mt-3">
                <span className="font-mono text-[10px] uppercase tracking-wider text-faint">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="mt-1.5 block text-[13px] leading-snug text-foreground">
                  {image.caption}
                </span>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      <section className="section-block" aria-labelledby="about-quote">
        <h3 id="about-quote" className="display-pixel mb-5 text-sm text-faint">
          04 - in short
        </h3>
        <blockquote className="m-0 border-l-2 border-border pl-5">
          <p className="text-[17px] leading-8 text-foreground">{aboutQuote}</p>
          <Link
            href="/#contact"
            className="link mt-4 inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider text-muted-foreground hover:text-foreground"
          >
            Let&apos;s build something thoughtful
            <ArrowUpRight className="size-3" aria-hidden="true" />
          </Link>
        </blockquote>
      </section>
    </div>
  );
}
