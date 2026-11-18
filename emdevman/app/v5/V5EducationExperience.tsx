"use client";

import { useState } from "react";
import { ArrowUpRight } from "lucide-react";

import { cvEducation } from "@/app/lib/cv";
import { experience } from "@/app/lib/experience";

import { V5ResumeDialog } from "./V5ResumeDialog";

import "./v5-education.css";

/**
 * v5's background section: the work history and study already held in
 * `lib/experience.ts` and `lib/cv.ts`, not a second copy of them.
 *
 * The résumé button opens the same PDF used by the other designs. The preview
 * lives in a native dialog rather than a new page, so reading it does not lose
 * the gallery the visitor was just in.
 */
export function V5EducationExperience() {
  const [resumeOpen, setResumeOpen] = useState(false);

  return (
    <section
      id="v5-experience"
      className="v5-edu-exp"
      aria-labelledby="v5-edu-exp-title"
    >
      <div className="v5-edu-exp__inner">
        <header className="v5-edu-exp__top">
          <div>
            <p className="v5-edu-exp__kicker">Background</p>
            <h2 id="v5-edu-exp-title" className="v5-edu-exp__title">
              Experience &amp; education.
            </h2>
            <p className="v5-edu-exp__intro">
              The work so far, and the study behind it.
            </p>
          </div>

          <button
            type="button"
            className="v5-edu-exp__resume"
            onClick={() => setResumeOpen(true)}
            aria-haspopup="dialog"
          >
            View résumé
            <ArrowUpRight aria-hidden="true" />
          </button>
        </header>

        <div className="v5-edu-exp__grid">
          <section
            className="v5-edu-exp__column"
            aria-labelledby="v5-experience-heading"
          >
            <h3 id="v5-experience-heading" className="v5-edu-exp__column-title">
              Experience
            </h3>

            <div className="v5-edu-exp__entries">
              {experience.map((entry) => (
                <article
                  key={`${entry.role}-${entry.organisation}`}
                  className="v5-edu-exp__entry"
                >
                  <p className="v5-edu-exp__period">{entry.period}</p>
                  <h4 className="v5-edu-exp__entry-title">{entry.role}</h4>
                  <p className="v5-edu-exp__organisation">
                    {entry.organisation}
                  </p>
                  <ul className="v5-edu-exp__outcomes">
                    {entry.outcomes.map((outcome) => (
                      <li key={outcome}>{outcome}</li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          </section>

          <section
            className="v5-edu-exp__column"
            aria-labelledby="v5-education-heading"
          >
            <h3 id="v5-education-heading" className="v5-edu-exp__column-title">
              Education
            </h3>

            <div className="v5-edu-exp__entries">
              {cvEducation.map((entry) => (
                <article
                  key={`${entry.title}-${entry.detail}`}
                  className="v5-edu-exp__entry"
                >
                  <p className="v5-edu-exp__period">{entry.years}</p>
                  <h4 className="v5-edu-exp__entry-title">{entry.title}</h4>
                  <p className="v5-edu-exp__organisation">{entry.detail}</p>
                </article>
              ))}
            </div>
          </section>
        </div>
      </div>

      <V5ResumeDialog open={resumeOpen} onClose={() => setResumeOpen(false)} />
    </section>
  );
}

export default V5EducationExperience;
