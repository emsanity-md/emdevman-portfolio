"use client";

import { useEffect, useRef, useState, type MouseEvent } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowUpRight, Menu, X } from "lucide-react";

import { Button } from "@/app/components/ui/button";
import { ThemeToggle } from "./ui/ThemeToggle";

const navLinks = [
  { name: "Home", href: "/", section: "home", index: "00" },
  { name: "Tech Stack", href: "/#tech-stack", section: "tech-stack", index: "01" },
  { name: "Activity", href: "/#github", section: "github", index: "02" },
  { name: "Projects", href: "/#projects", section: "projects", index: "03" },
  { name: "About", href: "/#about", section: "about", index: "04" },
  { name: "Contact", href: "/#contact", section: "contact", index: "05" },
] as const;

const centerLinks = navLinks.slice(1, -1);
const hiddenRoutes = ["/error/private", "/error/site", "/404"];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("home");
  const pathname = usePathname();
  const reduceMotion = useReducedMotion();
  const toggleRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (pathname !== "/") return;

    const sections = navLinks
      .map((link) => document.getElementById(link.section))
      .filter((section): section is HTMLElement => section !== null);

    if (sections.length === 0) return;

    let frameId = 0;

    const updateActiveSection = () => {
      frameId = 0;
      const referencePoint = window.scrollY + window.innerHeight * 0.28;
      let currentSection = sections[0];

      for (const section of sections) {
        const top = section.getBoundingClientRect().top + window.scrollY;
        const bottom = top + section.offsetHeight;
        if (referencePoint >= top && referencePoint < bottom) {
          currentSection = section;
          break;
        }
      }

      const atPageBottom =
        window.innerHeight + window.scrollY >=
        document.documentElement.scrollHeight - 2;
      if (atPageBottom) currentSection = sections[sections.length - 1];

      setActiveSection(currentSection.id);
    };

    const handleScroll = () => {
      if (frameId !== 0) return;
      frameId = window.requestAnimationFrame(updateActiveSection);
    };

    updateActiveSection();
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll);

    return () => {
      if (frameId !== 0) window.cancelAnimationFrame(frameId);
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, [pathname]);

  useEffect(() => {
    if (!isOpen) return;

    const firstLink = menuRef.current?.querySelector<HTMLAnchorElement>("a");
    firstLink?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
        toggleRef.current?.focus();
      }
    };

    const desktopQuery = window.matchMedia("(min-width: 768px)");
    const handleDesktopChange = (event: MediaQueryListEvent) => {
      if (event.matches) setIsOpen(false);
    };

    document.addEventListener("keydown", handleKeyDown);
    desktopQuery.addEventListener("change", handleDesktopChange);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      desktopQuery.removeEventListener("change", handleDesktopChange);
    };
  }, [isOpen]);

  if (hiddenRoutes.includes(pathname)) return null;

  const handleLinkClick = (
    event: MouseEvent<HTMLAnchorElement>,
    href: string,
    section: string,
  ) => {
    setIsOpen(false);

    if (pathname !== "/" || !(href === "/" || href.startsWith("/#"))) return;

    event.preventDefault();
    setActiveSection(section);
    window.history.replaceState(null, "", href);

    window.requestAnimationFrame(() => {
      if (section === "home") {
        window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
        return;
      }

      document.getElementById(section)?.scrollIntoView({
        behavior: reduceMotion ? "auto" : "smooth",
        block: "start",
      });
    });
  };

  return (
    <motion.nav
      initial={reduceMotion ? false : { y: -18, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="fixed inset-x-3 top-[calc(0.75rem+env(safe-area-inset-top))] z-50 mx-auto w-auto max-w-6xl rounded-2xl border border-border/80 bg-background/85 p-2 shadow-[0_12px_40px_rgba(0,0,0,0.08)] backdrop-blur-xl dark:shadow-black/30"
      aria-label="Primary navigation"
    >
      <div className="flex min-h-14 items-center gap-2 px-1 sm:gap-3 sm:px-2">
        <Link
          href="/"
          className="group flex min-w-0 items-center gap-3 rounded-xl px-1 py-1 outline-none transition-colors hover:bg-muted/60 focus-visible:ring-2 focus-visible:ring-ring"
          onClick={(event) => handleLinkClick(event, "/", "home")}
          aria-label="Emmanuel Bitancor home"
        >
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-foreground font-mono text-xs font-bold tracking-tight text-background transition-transform duration-300 group-hover:-rotate-3">
            ESB
          </span>
          <span className="hidden min-w-0 sm:block">
            <span className="block truncate text-sm font-semibold tracking-tight">
              Emmanuel Bitancor
            </span>
            <span className="block truncate eyebrow text-muted-foreground">
              Full-stack developer
            </span>
          </span>
        </Link>

        <span aria-hidden="true" className="hidden h-7 w-px bg-border lg:block" />

        <div
          className="hidden min-w-0 flex-1 items-center justify-center gap-1 lg:flex"
          role="navigation"
          aria-label="Section navigation"
        >
          {centerLinks.map((link) => {
            const isActive = pathname === "/" && activeSection === link.section;
            return (
              <Link
                key={link.name}
                href={link.href}
                onClick={(event) => handleLinkClick(event, link.href, link.section)}
                className={`group relative flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                  isActive
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
                aria-current={isActive ? "location" : undefined}
              >
                <span
                  className={`font-mono text-micro tracking-widest ${
                    isActive ? "text-background/60" : "text-muted-foreground/60"
                  }`}
                >
                  {link.index}
                </span>
                <span>{link.name}</span>
              </Link>
            );
          })}
        </div>

        <div className="ml-auto flex items-center gap-1.5">
          <ThemeToggle />
          <Button
            asChild
            size="sm"
            className="hidden rounded-full sm:inline-flex"
          >
            <Link
              href="/#contact"
              onClick={(event) => handleLinkClick(event, "/#contact", "contact")}
            >
              Let&apos;s talk
              <ArrowUpRight aria-hidden="true" />
            </Link>
          </Button>
          <Button
            ref={toggleRef}
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setIsOpen((open) => !open)}
            className="rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground md:hidden"
            aria-label={isOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={isOpen}
            aria-controls="mobile-navigation"
          >
            {isOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </Button>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            ref={menuRef}
            id="mobile-navigation"
            initial={reduceMotion ? false : { opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="overflow-hidden border-t border-border/70 pt-2 md:hidden"
          >
            <div
              className="grid gap-1 py-2 sm:grid-cols-2"
              role="navigation"
              aria-label="Mobile navigation"
            >
              {navLinks.slice(1).map((link) => {
                const isActive = pathname === "/" && activeSection === link.section;
                return (
                  <Link
                    key={link.name}
                    href={link.href}
                    onClick={(event) => handleLinkClick(event, link.href, link.section)}
                    className={`group flex items-center justify-between rounded-xl px-3 py-3 text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-foreground text-background"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                    aria-current={isActive ? "location" : undefined}
                  >
                    <span className="flex items-center gap-3">
                      <span className="font-mono text-micro tracking-widest opacity-60">
                        {link.index}
                      </span>
                      {link.name}
                    </span>
                    <ArrowUpRight
                      className="size-4 opacity-50 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                      aria-hidden="true"
                    />
                  </Link>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}
