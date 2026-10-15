import { experience } from "@/app/lib/experience";
import { Section } from "./components/Section";
import { TimelineItem } from "./components/TimelineItem";

/**
 * Experience: a vertical timeline, newest first.
 *
 * The whole of it is `lib/experience.ts`, which the CV sheet also reads. There
 * is no second copy to keep in step - which is the reason that file exists, and
 * the reason this section is this short.
 */
export function V2Experience() {
  return (
    <Section id="experience" eyebrow="Experience" title="Where the work has been.">
      {/* The `last:` on the final item drops its trailing space, so the list
          ends on the last line of content rather than on a stray 3rem of
          padding below it. */}
      <ol className="max-w-3xl">
        {experience.map((entry, index) => (
          <TimelineItem
            key={entry.organisation}
            entry={entry}
            className={index === experience.length - 1 ? "last:pb-0" : undefined}
          />
        ))}
      </ol>
    </Section>
  );
}