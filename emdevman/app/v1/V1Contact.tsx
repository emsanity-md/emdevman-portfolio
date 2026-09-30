import ContactForm from "@/app/components/ui/ContactForm";
import CopyEmailButton from "@/app/components/ui/CopyEmailButton";
import { EMAIL_ADDRESS } from "@/app/lib/contact";

import { V1Section } from "./Section";
import { V1Row, V1Rows } from "./rows";

/**
 * v1's contact: the form, then the ways to reach him directly.
 *
 * The form is kept because it works and hits /api/contact - v3 makes the same
 * call. The wrapper card comes off via `.contact-surface` in globals.css, which
 * is v2's, leaving a bare set of fields with hairline borders.
 *
 * No "available for collaboration" pill and no status dot: the pulsing dot is one
 * of the few animations v3 has, and a design with no motion cannot borrow it.
 * Availability is a sentence instead.
 */
export function V1Contact() {
  return (
    <V1Section
      id="contact"
      label="get in touch"
      lede="Have a project in mind, want to collaborate, or just want to say hi? Send a message and I read everything."
    >
      <div className="mt-12 grid gap-14 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] lg:items-start">
        <ContactForm />

        <div>
          <p className="v1-label">Elsewhere</p>

          <V1Rows>
            <V1Row label="Email">
              <span className="flex items-center justify-end gap-2">
                <a
                  href={`mailto:${EMAIL_ADDRESS}`}
                  className="break-all text-foreground"
                >
                  {EMAIL_ADDRESS}
                </a>
                <CopyEmailButton email={EMAIL_ADDRESS} />
              </span>
            </V1Row>

            <V1Row label="GitHub">
              <a
                href="https://github.com/emsanity-md"
                target="_blank"
                rel="noopener noreferrer"
                className="text-foreground"
              >
                emsanity-md
              </a>
            </V1Row>

            <V1Row label="LinkedIn">
              <a
                href="https://www.linkedin.com/in/emmanuel-bitancor-40a582426"
                target="_blank"
                rel="noopener noreferrer"
                className="text-foreground"
              >
                Emmanuel Bitancor
              </a>
            </V1Row>

            <V1Row label="Location">Philippines</V1Row>
          </V1Rows>
        </div>
      </div>
    </V1Section>
  );
}
