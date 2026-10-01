import { AtSign, GraduationCap, PieChart } from "lucide-react";

import { V4Portrait } from "./V4Portrait";
import { V4Skills } from "./V4Skills";
import { V4Dash, V4Entry, V4Head, V4Track } from "./bits";
import { cvContact, cvEducation, cvProfile } from "@/app/lib/cv";

/**
 * v4's left rail: charcoal, the portrait, and the short fact blocks.
 *
 * Three groups: Contact, Education, Skills. Everything on the rail is a fact with
 * a value beside it - an address, a name, a date range, a level - and everything
 * that is prose lives in the main column. That split is the reason the rail can
 * be narrow and still not feel cramped.
 *
 * This is the whole of v4's contact surface. There was a "Get In Touch" block at
 * the foot of the main column carrying the shared `ContactForm` and a second copy
 * of these four addresses, and it was cut as the duplication it plainly was. The
 * consequence is that v4 has no message form: the email link below is a `mailto:`,
 * so reaching out means a mail client rather than an on-page form.
 *
 * There was also a "Selected Work" block here - four of the ten projects as an
 * index - and it went for the same reason. The main column's Work section is the
 * same ten projects with a thumbnail, a role and links each, so the rail version
 * was a strictly poorer copy of something already on the page rather than a
 * different view of it. One list beats two, and Work's "Show all 10" means the
 * four entries on screen at rest are already the four most recent.
 *
 * The cost is balance: the rail's content drops to roughly 1650px against a main
 * column of 2065px, so the pinned rail is now followed by more empty charcoal.
 * That is the right trade against printing the same work twice, and the sticky
 * inner box is what keeps it tolerable - the charcoal stays beside whatever is
 * being read rather than trailing off a page below it.
 */
export function V4Rail() {
  return (
    <aside className="v4-rail" aria-label="Profile and contact details">
      {/*
        The sticky inner box. The charcoal is on the outer element, so the column
        stays solid for the sheet's full height while the content inside it stays
        pinned - which is the difference between a sidebar and a grey void.
      */}
      <div className="v4-rail-inner">
        <div className="v4-portrait-band">
          <V4Portrait alt={`${cvProfile.given} ${cvProfile.family}`} />
        </div>

        <V4Track>
          {/*
            `id="contact"` moved here from the main column's "Get In Touch"
            section, which was removed as a duplicate of this one. It has to land
            somewhere: `navLinks` lists `contact` as a section id and
            `findRenderedSection` resolves it to whatever element actually has
            boxes, so with the id gone from the document a `/` + `#contact` would
            resolve to nothing and the nav target would be dead.

            This is also where it belongs. The addresses are here, so the anchor
            for "contact" points at the addresses.
          */}
          <section id="contact" aria-labelledby="v4-contact-heading">
            <V4Head
              icon={<AtSign />}
              title="Contact Me"
              id="v4-contact-heading"
            />
            <ul className="v4-contact-list">
              {cvContact.map((link) => (
                <li key={link.label} className="v4-contact-row">
                  <span className="v4-contact-label">{link.label}</span>
                  <a
                    className="v4-contact-value"
                    href={link.href}
                    target={link.external ? "_blank" : undefined}
                    rel={link.external ? "noopener noreferrer" : undefined}
                  >
                    {link.value}
                  </a>
                </li>
              ))}

              {/* Both are optional in cv.ts, and an unset value is skipped rather
                  than rendered blank - a CV with an empty phone row reads as a
                  mistake. */}
              {cvProfile.location ? (
                <li className="v4-contact-row">
                  <span className="v4-contact-label">Based in</span>
                  <span className="v4-contact-value">{cvProfile.location}</span>
                </li>
              ) : null}
            </ul>
          </section>

          <V4Dash />

          <section aria-labelledby="v4-education-heading">
            <V4Head
              icon={<GraduationCap />}
              title="Education"
              id="v4-education-heading"
            />
            {cvEducation.map((entry) => (
              <V4Entry
                key={`${entry.title}-${entry.years}`}
                title={entry.title}
                detail={entry.detail}
                years={entry.years}
              />
            ))}
          </section>

          <V4Dash />

          {/*
            Skills lives here rather than in the main column, where the template
            puts it. It started there and left about 3000px of empty charcoal
            under this section - ten projects is a page of content, and the rail
            was holding three short blocks against it. Moving the bars here closed
            most of that gap and put them on charcoal, where the yellow fill
            clears 7.5:1 instead of sitting as a thin line on white.
          */}
          <section id="tech-stack" aria-labelledby="v4-skills-heading">
            <V4Head
              icon={<PieChart />}
              title="Skills"
              id="v4-skills-heading"
            />
            <V4Skills />
          </section>
        </V4Track>
      </div>
    </aside>
  );
}