import { Github, Linkedin, Mail } from "lucide-react";

import { EMAIL_ADDRESS, EMAIL_MAILTO } from "@/app/lib/contact";
import { Section } from "./components/Section";

const GITHUB_URL = "https://github.com/emsanity-md";
const LINKEDIN_URL = "https://www.linkedin.com/in/emmanuel-bitancor-40a582426";

/**
 * Contact: one heading, one way to write, two ways to look.
 *
 * No form. The old section carried a four-field form that composed a mailto when
 * submitted, which is a worse version of the mailto link underneath it with
 * three more things to go wrong - and a page that ends in a form is a page that
 * ends in a decision rather than in an invitation.
 *
 * The email is read from `lib/contact.ts`, and the two profiles from the same
 * file the hero and the footer read, so there is one GitHub handle and one
 * address in the codebase rather than five spellings of each.
 */
export function V2Contact() {
  return (
    <Section id="contact" eyebrow="Contact" title="Let&apos;s build something useful">
      <div className="flex flex-col items-start gap-6">
        <a
          href={EMAIL_MAILTO}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-primary px-6 text-small font-medium text-primary-foreground outline-none transition-colors hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          <Mail className="size-4" aria-hidden="true" />
          Email me
          <span className="sr-only">at {EMAIL_ADDRESS}</span>
        </a>

        <div className="flex flex-wrap gap-3">
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-11 items-center gap-2 rounded-full border border-border bg-card px-5 text-small font-medium text-foreground outline-none transition-colors hover:border-primary/40 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            <Github className="size-4" aria-hidden="true" />
            GitHub
            <span className="sr-only">, opens in a new tab</span>
          </a>

          <a
            href={LINKEDIN_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-11 items-center gap-2 rounded-full border border-border bg-card px-5 text-small font-medium text-foreground outline-none transition-colors hover:border-primary/40 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            <Linkedin className="size-4" aria-hidden="true" />
            LinkedIn
            <span className="sr-only">, opens in a new tab</span>
          </a>
        </div>

        <p className="font-mono text-micro uppercase tracking-[0.14em] text-faint">
          {EMAIL_ADDRESS}
        </p>
      </div>
    </Section>
  );
}