import { Section } from "./components/Section";
import { aiApproach, stackColumns } from "./stack";

/**
 * Stack and approach: three columns, then a strip about working with AI.
 *
 * The strip is tinted rather than bordered because it is the only paragraph on
 * the page that is about process rather than about a thing built. Giving it the
 * same 1px box as the columns would make it a fourth column.
 */
export function V2Stack() {
  return (
    <Section id="tech-stack" eyebrow="Stack and approach" title="The tools, and how they get used.">
      <div className="grid gap-10 sm:grid-cols-3 sm:gap-8">
        {stackColumns.map((column) => (
          <div key={column.title}>
            <h3 className="font-mono text-micro uppercase tracking-[0.18em] text-muted-foreground">
              {column.title}
            </h3>

            {/* A plain list, not a grid of chips: a column of four names reads
                as a column, and a grid would wrap them into a shape that says
                more about the available width than about the stack. */}
            <ul className="mt-5 space-y-2.5">
              {column.items.map((item) => (
                <li key={item} className="text-small text-foreground">
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="mt-14 rounded-[0.75rem] border border-primary/20 bg-primary/5 px-5 py-6 sm:px-7 sm:py-7">
        <p className="font-mono text-micro uppercase tracking-[0.18em] text-primary">
          {aiApproach.label}
        </p>
        <p className="mt-3 max-w-2xl text-lead text-foreground">{aiApproach.body}</p>
      </div>
    </Section>
  );
}