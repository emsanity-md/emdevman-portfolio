import { Github, Linkedin, Mail, MapPin } from "lucide-react";

import ContactForm from "../components/ui/ContactForm";
import CopyEmailButton from "../components/ui/CopyEmailButton";
import { EMAIL_ADDRESS, EMAIL_MAILTO } from "../lib/contact";

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
  return (
    <section
      id="contact"
      className="relative w-full bg-zinc-50/60 px-4 py-20 transition-colors duration-300 md:px-6 md:py-24 dark:bg-zinc-900/25"
    >
      <div className="container mx-auto max-w-6xl">
        <div className="mb-14 flex flex-col items-center space-y-4 text-center">
          <span className="rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-1 font-mono text-xs font-medium text-emerald-700 dark:text-emerald-300">
            Available for collaboration
          </span>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
            Let&apos;s build something useful.
          </h2>
          <p className="max-w-2xl text-base leading-7 text-zinc-500 md:text-xl dark:text-zinc-400">
            Have a project in mind, want to collaborate or just want to say hi?
            Send a message and I&apos;ll get back to you soon.
          </p>
        </div>

        <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(280px,0.9fr)] lg:items-start">
          <ContactForm />

          <div className="space-y-4">
            <div className="flex items-center gap-3 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm sm:gap-4 sm:p-5 dark:border-zinc-800 dark:bg-zinc-900">
              <div className="inline-flex size-12 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100">
                <Mail className="size-5" aria-hidden="true" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                  Prefer email?
                </p>
                <a
                  href={EMAIL_MAILTO}
                  className="mt-0.5 inline-block max-w-full break-words rounded-sm text-sm font-semibold text-zinc-900 hover:underline dark:text-zinc-100"
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
                  className="group flex items-center gap-3 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm transition-colors hover:border-zinc-300 hover:bg-zinc-100 sm:gap-4 sm:p-5 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700 dark:hover:bg-zinc-800"
                >
                  <div className="inline-flex size-12 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-zinc-900 transition-transform group-hover:scale-105 dark:bg-zinc-800 dark:text-zinc-100">
                    <Icon className="size-5" aria-hidden="true" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                      {social.label}
                    </p>
                    <p className="truncate font-semibold text-zinc-900 dark:text-zinc-100">
                      {social.value}
                    </p>
                  </div>
                  <span
                    className="text-sm text-zinc-400 transition-transform group-hover:translate-x-0.5 dark:text-zinc-600"
                    aria-hidden="true"
                  >
                    →
                  </span>
                </a>
              );
            })}

            <div className="flex items-center gap-3 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm sm:gap-4 sm:p-5 dark:border-zinc-800 dark:bg-zinc-900">
              <div className="inline-flex size-12 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100">
                <MapPin className="size-5" aria-hidden="true" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                  Location
                </p>
                <p className="font-semibold text-zinc-900 dark:text-zinc-100">
                  Somewhere in the Philippines
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
