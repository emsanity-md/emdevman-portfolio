"use client";

import { useEffect, useRef, useState, type MouseEvent } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowUpRight, Menu, X } from "lucide-react";

import { Button } from "@/app/components/ui/button";
import { ThemeControl } from "@/app/components/ui/ThemeControl";
import SidebarNav from "@/app/components/SidebarNav";
import { V1Nav } from "@/app/v1/V1Nav";
import { useDesign } from "@/app/context/DesignProvider";
import { centerLinks, hiddenRoutes, navLinks, navSectionIds } from "@/app/lib/navigation";
import { useScrollSpy, useSectionNavigation } from "@/app/hooks/useScrollSpy";

/**
 * Picks the navigation for the active design. The branch is above every hook
 * so each design's nav keeps its own hook order.
 */
export default function Navbar() {
  const { design } = useDesign();

  if (design === "v1") return <V1Nav />;
  if (design === "v3") return <SidebarNav />;

  return <PillNav />;
}

/** V2's navigation: a fixed glass pill with a disclosure on mobile. */
function PillNav() {
  const [isOpen, setIsOpen] = useState(false);
  const activeSection = useScrollSpy(navSectionIds);
  const navigate = useSectionNavigation();
  const pathname = usePathname();
  const reduceMotion = useReducedMotion();
  const toggleRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

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
    navigate(event, href, section);
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
          <ThemeControl />
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
