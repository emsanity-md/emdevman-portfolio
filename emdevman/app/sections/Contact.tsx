import { Github, Linkedin, Mail, MapPin } from "lucide-react";

import ContactForm from "../components/ui/ContactForm";
import CopyEmailButton from "../components/ui/CopyEmailButton";
import { EMAIL_ADDRESS, EMAIL_MAILTO } from "../lib/contact";
import { Section } from "@/app/components/ui/Section";
import { V3Contact } from "./V3Contact";

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

export default function Contact() {
  /*
    Both bodies ship; CSS picks one. Same reasoning as About and Projects - a
    `useDesign()` branch would serve v3 markup to V2 visitors.
  */
  return (
    <Section
      id="contact"
      index="05"
      eyebrow="say hello"
      action={{ label: "copy email", href: EMAIL_MAILTO }}
      title="Let&apos;s build something useful."
      description="Have a project in mind, want to collaborate or just want to say hi? Send a message and I&apos;ll get back to you soon."
    >
      <div className="v3-only">
        <V3Contact />
      </div>
      <div className="v2-only">
        <V2Contact />
      </div>
    </Section>
  );
}

function V2Contact() {
  return (
    <>
        <div className="mb-14 flex flex-col items-center space-y-4 text-center">
          <span className="tag tag--invert contact-available">
            Available for collaboration
          </span>
        </div>

        <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(280px,0.9fr)] lg:items-start">
          <ContactForm />

          <div className="rows">
            <div className="contact-row row flex items-center gap-3 py-5">
              <div className="contact-row-icon inline-flex size-9 shrink-0 items-center justify-center rounded-lg border border-border bg-background text-foreground">
                <Mail className="size-5" aria-hidden="true" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="contact-row-label text-sm font-medium text-muted-foreground">
                  Prefer email?
                </p>
                <a
                  href={EMAIL_MAILTO}
                  className="contact-row-value mt-0.5 inline-block max-w-full break-words rounded-sm text-sm font-semibold text-foreground hover:underline"
                >
                  {email}
                </a>
              </div>
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
                  className="contact-row row group flex items-center gap-3 py-5"
                >
                  <div className="contact-row-icon contact-row-icon--link inline-flex size-9 shrink-0 items-center justify-center rounded-lg border border-border bg-background text-foreground">
                    <Icon className="size-5" aria-hidden="true" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="contact-row-label text-sm font-medium text-muted-foreground">
                      {social.label}
                    </p>
                    <p className="contact-row-value truncate font-semibold text-foreground">
                      {social.value}
                    </p>
                  </div>
                  <span
                    className="contact-row-arrow text-sm text-faint transition-transform group-hover:translate-x-0.5"
                    aria-hidden="true"
                  >
                    →
                  </span>
                </a>
              );
            })}

            <div className="contact-row row flex items-center gap-3 py-5">
              <div className="contact-row-icon inline-flex size-9 shrink-0 items-center justify-center rounded-lg border border-border bg-background text-foreground">
                <MapPin className="size-5" aria-hidden="true" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="contact-row-label text-sm font-medium text-muted-foreground">
                  Location
                </p>
                <p className="contact-row-value font-semibold text-foreground">
                  Somewhere in the Philippines
                </p>
              </div>
            </div>
          </div>
        </div>
    </>
  );
}
