import { Github, Linkedin, Mail, MapPin } from "lucide-react";

import ContactForm from "@/app/components/ui/ContactForm";
import CopyEmailButton from "@/app/components/ui/CopyEmailButton";
import { EMAIL_ADDRESS, EMAIL_MAILTO } from "@/app/lib/contact";

const email = EMAIL_ADDRESS;

const socialLinks = [
  {
    label: "GitHub",
    value: "emasanity-md",
    href: "https://github.com/emsanity-md",
    icon: Github,
  },
  {
    label: "LinkedIn",
    value: "Emmanuel Bitancor",
    href: "https://www.linkedin.com/in/emmanuel-bitancor-40a582426",
    icon: Linkedin,
  },
];

/**
 * v3's contact section.
 *
 * Built on the reference's own contact panel - a mono eyebrow, a pixel title, a
 * 14px body, then the email as a bordered row with a copy control, then the
 * other links as bordered rows with the handle right-aligned in mono.
 *
 * The message form is kept. The reference has none, but deleting a working
 * feature to match a layout would be the wrong trade.
 *
 * Stacked in one column at the reading measure, rather than V2's two-column
 * form-beside-details grid.
 */
export function V3Contact() {
  return (
    <div>
      <h3 className="display-pixel text-[1.75rem] leading-none text-foreground">say hello</h3>
      <p className="mt-4 max-w-[34rem] text-[15px] leading-7 text-muted-foreground">
        For work, collabs, or just to say hi — drop me a line. I read everything
        and reply to most of it.
      </p>

      <p className="mt-6">
        <span className="pill-tag rounded-full bg-foreground px-2.5 py-0.5 text-background">
          Available for collaboration
        </span>
      </p>

      <section className="section-block" aria-labelledby="contact-message">
        <h4 id="contact-message" className="display-pixel mb-5 text-sm text-faint">
          01 - message
        </h4>
        <ContactForm />
      </section>

      <section className="section-block" aria-labelledby="contact-elsewhere">
        <h4 id="contact-elsewhere" className="display-pixel mb-5 text-sm text-faint">
          02 - elsewhere
        </h4>

        <div className="rows">
          <div className="row flex items-center gap-3 px-1 py-4">
            <span
              aria-hidden="true"
              className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground"
            >
              <Mail className="size-4" />
            </span>
            <a
              href={EMAIL_MAILTO}
              className="link min-w-0 flex-1 truncate text-[14px] text-foreground"
            >
              {email}
            </a>
            <CopyEmailButton email={email} />
          </div>

          {socialLinks.map((social) => {
            const Icon = social.icon;
            return (
              <a
                key={social.label}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                className="row group flex items-center gap-3 px-1 py-4"
              >
                <span
                  aria-hidden="true"
                  className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground"
                >
                  <Icon className="size-4" />
                </span>
                <span className="min-w-0 flex-1 truncate text-[14px] text-foreground">
                  {social.label}
                </span>
                <span className="flex shrink-0 items-center gap-1.5 font-mono text-[12px] text-faint">
                  {social.value}
                  <span aria-hidden="true" className="transition-transform group-hover:translate-x-0.5">
                    ↗
                  </span>
                </span>
              </a>
            );
          })}

          <div className="row flex items-center gap-3 px-1 py-4">
            <span
              aria-hidden="true"
              className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground"
            >
              <MapPin className="size-4" />
            </span>
            <span className="min-w-0 flex-1 text-[14px] text-foreground">Location</span>
            <span className="shrink-0 font-mono text-[12px] text-faint">Philippines</span>
          </div>
        </div>

        <a
          href={EMAIL_MAILTO}
          className="mt-4 flex w-full items-center justify-center rounded-lg border border-border px-4 py-2.5 text-center text-[14px] font-medium text-foreground transition-colors hover:border-foreground"
        >
          Open mail app
        </a>
      </section>
    </div>
  );
}
