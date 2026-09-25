import Link from "next/link";
import { ArrowUp, Github, Linkedin, Mail } from "lucide-react";

import { Button } from "@/app/components/ui/button";
import { EMAIL_MAILTO } from "../lib/contact";

const navigation = [
  { label: "Tech Stack", href: "/#tech-stack" },
  { label: "Activity", href: "/#github" },
  { label: "Projects", href: "/#projects" },
  { label: "About", href: "/#about" },
  { label: "Contact", href: "/#contact" },
];

export default function Footer() {
  return (
    <footer className="border-t border-zinc-200/80 bg-background/80 px-4 py-10 backdrop-blur-sm dark:border-zinc-800/80">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-md">
          <Link href="/" className="text-lg font-bold tracking-tight" aria-label="Emmanuel Bitancor home">
            ESB<span className="text-zinc-400 dark:text-zinc-600">.</span>
          </Link>
          <p className="mt-2 text-sm leading-6 text-zinc-500 dark:text-zinc-400">
            Building thoughtful, accessible and performant digital experiences.
          </p>
        </div>

        <div className="flex flex-col gap-5 sm:items-end">
          <nav aria-label="Footer navigation" className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-zinc-600 dark:text-zinc-400">
            {navigation.map((item) => (
              <Link key={item.href} href={item.href} className="rounded-sm transition-colors hover:text-black dark:hover:text-white">
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <Button asChild variant="outline" size="icon" className="rounded-full">
              <a href={EMAIL_MAILTO} aria-label="Email Emmanuel">
                <Mail className="size-4" />
              </a>
            </Button>
            <Button asChild variant="outline" size="icon" className="rounded-full">
              <a
                href="https://github.com/emsanity-md"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Emmanuel on GitHub"
              >
                <Github className="size-4" />
              </a>
            </Button>
            <Button asChild variant="outline" size="icon" className="rounded-full">
              <a
                href="https://www.linkedin.com/in/emmanuel-bitancor-40a582426"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Emmanuel on LinkedIn"
              >
                <Linkedin className="size-4" />
              </a>
            </Button>
            <Button asChild variant="outline" size="icon" className="rounded-full">
              <a href="#top" aria-label="Back to top">
                <ArrowUp className="size-4" />
              </a>
            </Button>
          </div>
        </div>
      </div>
      <p className="mx-auto mt-8 max-w-6xl border-t border-zinc-200/70 pt-6 text-xs text-zinc-500 dark:border-zinc-800/70 dark:text-zinc-500">
        © {new Date().getFullYear()} Emmanuel Bitancor. All rights reserved.
      </p>
    </footer>
  );
}
