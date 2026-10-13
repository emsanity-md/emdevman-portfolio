"use client";

import { Github, Globe, Linkedin, Mail } from "lucide-react";

import ContactForm from "@/app/components/ui/ContactForm";
import CopyEmailButton from "@/app/components/ui/CopyEmailButton";
import { cvContact } from "@/app/lib/cv";
import { V5Post } from "../V5Post";

/**
 * The Contacts tab: the form, then the four addresses.
 *
 * Both halves are reused whole. `ContactForm` is the shared component every other
 * design mounts, posting to the same `/api/contact` route, so the mail path, the
 * honeypot, the validation and the three submit states are identical - and v5
 * cannot end up with a form that sends nowhere. The addresses are `cvContact`,
 * the same list v4's rail prints, so there is no fifth copy of the email address
 * in the repo.
 *
 * The form's own styling is `.contact-surface`, which `globals.css` styles with
 * `--card` and `--border`. Both are re-mapped for this subtree by `.v5-root`, so
 * the panel comes out in v5's palette without a single prop or a variant - which
 * is the whole reason v5 overrides the shared tokens rather than inventing a
 * vocabulary of its own.
 */
export function V5ContactsPanel() {
  return (
    <>
      <V5Post>
        <p className="text-[17px] font-bold">Send a message</p>
        <p className="text-muted-foreground">
          Tell me a little about your idea. I&apos;ll get back to you as soon as I
          can.
        </p>

        <div className="mt-3">
          <ContactForm />
        </div>
      </V5Post>

      <V5Post>
        <p className="text-[17px] font-bold">Elsewhere</p>

        <ul className="mt-2 flex flex-col gap-2">
          {cvContact.map((link) => {
            const Icon = ICONS[link.label] ?? Globe;

            return (
              <li key={link.label}>
                <div className="flex items-center gap-3 rounded-2xl border border-border px-3 py-2.5 transition-colors hover:bg-foreground/5">
                  <a
                    href={link.href}
                    target={link.external ? "_blank" : undefined}
                    rel={link.external ? "noopener noreferrer" : undefined}
                    className="flex min-w-0 flex-1 items-center gap-3 no-underline"
                  >
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted">
                      <Icon className="size-4" aria-hidden="true" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-xs text-muted-foreground">
                        {link.label}
                      </span>
                      <span className="block truncate text-sm font-semibold">
                        {link.value}
                      </span>
                    </span>
                  </a>

                  {/*
                    The copy action, inside the email's row rather than in a row
                    of its own. It is an action on that address and nothing else,
                    and a separate panel for it would read as a fifth destination
                    - which is exactly what it is not.
                  */}
                  {link.label === "Email" ? (
                    <CopyEmailButton email={link.value} />
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      </V5Post>
    </>
  );
}

/* One icon per label in `cvContact`, falling back to a globe for anything new. */
const ICONS: Record<string, typeof Mail> = {
  Email: Mail,
  GitHub: Github,
  LinkedIn: Linkedin,
  Website: Globe,
};