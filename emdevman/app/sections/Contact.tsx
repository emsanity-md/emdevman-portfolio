import { Section } from "@/app/components/ui/Section";
import { EMAIL_MAILTO } from "@/app/lib/contact";
import { V3Contact } from "./V3Contact";

/**
 * v3's contact section.
 *
 * `V2Contact` is gone: a four-field form that composed a mailto on submit, three
 * contact rows and a "Available for collaboration" pill. Every one of those is
 * something the contact section already says, and the form in particular was a
 * worse route to the same mailto as the link directly above it. v2 is its own
 * tree now and carries its own centred version of this section.
 *
 * The `socialLinks` array went with it. It is the one place in the repo that
 * spelled the GitHub handle `emasanity-md` - a typo that made the display name
 * disagree with the URL beside it - and deleting the list is a more reliable fix
 * than correcting the string in a place three other designs also read from.
 */
export default function Contact() {
  return (
    <Section
      id="contact"
      index="05"
      eyebrow="say hello"
      action={{ label: "copy email", href: EMAIL_MAILTO }}
      title="Let&apos;s build something useful."
      description="Have a project in mind, want to collaborate or just want to say hi? Send a message and I&apos;ll get back to you soon."
    >
      <V3Contact />
    </Section>
  );
}