"use client";

import { Briefcase, GraduationCap, Quote } from "lucide-react";

import { aboutFocus, aboutQuote, aboutStrengths } from "@/app/lib/about";
import { cvEducation, cvExperience, cvProfile } from "@/app/lib/cv";
import { V5Post } from "../V5Post";

/**
 * The About tab: bio, education, experience.
 *
 * Education and experience come from `lib/cv.ts` and the rest from
 * `lib/about.ts`, which is the point - this tab is a view over data two other
 * designs already read, not a third place the biography is written down. The
 * header's name, the pinned post's headline and this tab's opening line all
 * resolve to the same two strings.
 *
 * One post per block rather than one post for the whole section, because the
 * feed's unit is a thing and "About" is not a thing - a degree is, a job is, a
 * pull-quote is. Split into four, the tab reads as four entries in a list and the
 * reader can stop after the first one.
 */
export function V5AboutPanel({ onNavigate }: { onNavigate: (id: string) => void }) {
  return (
    <>
      <V5Post>
        <p className="text-[17px] font-bold">About</p>
        <p>
          {cvProfile.given} {cvProfile.family} - {cvProfile.title}.{" "}
          {cvProfile.tagline}.
        </p>
        <p className="text-muted-foreground">{aboutFocus}</p>

        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {aboutStrengths.map((strength) => {
            const Icon = strength.icon;
            return (
              <div key={strength.title} className="v5-card">
                <p className="flex items-center gap-2 text-sm font-bold">
                  <Icon className="size-4 text-primary" aria-hidden="true" />
                  {strength.title}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {strength.description}
                </p>
              </div>
            );
          })}
        </div>
      </V5Post>

      <V5Post>
        <p className="text-[17px] font-bold">Education</p>

        <ul className="mt-2 flex flex-col gap-2">
          {cvEducation.map((entry) => (
            <li key={`${entry.title}-${entry.years}`} className="v5-card">
              <p className="flex flex-wrap items-baseline justify-between gap-2">
                <span className="flex items-center gap-2 text-sm font-bold">
                  <GraduationCap
                    className="size-4 shrink-0 text-primary"
                    aria-hidden="true"
                  />
                  {entry.title}
                </span>
                <span className="text-xs text-muted-foreground">
                  {entry.years}
                </span>
              </p>
              <p className="mt-1 text-sm text-muted-foreground">{entry.detail}</p>
            </li>
          ))}
        </ul>
      </V5Post>

      <V5Post>
        <p className="text-[17px] font-bold">Experience</p>

        <ul className="mt-2 flex flex-col gap-2">
          {cvExperience.map((entry) => (
            <li key={`${entry.title}-${entry.years}`} className="v5-card">
              <p className="flex flex-wrap items-baseline justify-between gap-2">
                <span className="flex items-center gap-2 text-sm font-bold">
                  <Briefcase
                    className="size-4 shrink-0 text-primary"
                    aria-hidden="true"
                  />
                  {entry.title}
                </span>
                <span className="text-xs text-muted-foreground">
                  {entry.years}
                </span>
              </p>
              <p className="mt-1 text-sm text-muted-foreground">{entry.detail}</p>
              {entry.summary ? (
                <p className="mt-1 text-sm">{entry.summary}</p>
              ) : null}
            </li>
          ))}
        </ul>
      </V5Post>

      {/*
        The pull-quote, last, because it is a conclusion and not information. It is
        the same string `lib/about.ts` gives v3's blockquote, so the two designs
        cannot end the About section with different sentences.
      */}
      <V5Post>
        <blockquote className="flex items-start gap-2.5">
          <Quote className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
          <p className="text-[17px] leading-7">{aboutQuote}</p>
        </blockquote>
      </V5Post>

      {/*
        A closing line, so the tab does not simply stop. It switches to the
        Contacts tab rather than linking out to `/#contact`: this page already has
        the form on it, and sending a reader who has just finished reading about
        availability back to the four other designs to find the same form is a
        worse next step than one more panel away.
      */}
      <V5Post>
        <button
          type="button"
          className="v5-btn v5-btn--outline"
          onClick={() => onNavigate("contact")}
        >
          Get in touch
        </button>
      </V5Post>
    </>
  );
}