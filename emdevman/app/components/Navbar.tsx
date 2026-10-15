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
import { hiddenRoutes, v2CenterLinks, v2NavLinks, v2NavSectionIds } from "@/app/lib/navigation";
import { useScrollSpy, useSectionNavigation } from "@/app/hooks/useScrollSpy";

/**
 * Picks the navigation for the active design. The branch is above every hook
 * so each design's nav keeps its own hook order.
 *
 * v4 has no nav at all: a CV is one sheet that scrolls, and the template it is
 * built from has nowhere to put a bar. Its sections carry ids anyway, so
 * `/#projects` and friends still resolve - `AnchorResolver` looks for a visible
 * element with that id, not for a link that points at it.
 */
export default function Navbar() {
  const { design } = useDesign();

  if (design === "v4") return null;
  if (design === "v1") return <V1Nav />;
  if (design === "v3") return <SidebarNav />;

  return <PillNav />;
}

/**
 * v2's navigation.
 *
 * A flat bar rather than the floating glass pill it used to be. The pill's
 * blur, its 40px shadow and its rounded slab were all doing one job - lifting
 * a bar off a busy page - and the rebuilt homepage is a single column of five
 * sections with hairline rules between them, so the bar can be a rule like the
 * rest of them. One shadow token instead of three effects, and no backdrop
 * filter to composite on every scroll frame.
 *
 * It reads `v2NavLinks` rather than the shared list because this page has five
 * sections and the shared list has six, two of which point at `#github` and
 * `#about` - ids v2 does not have. `findRenderedSection` would return null for
 * both and the links would quietly do nothing.
 */
function PillNav() {
  const [isOpen, setIsOpen] = useState(false);
  const activeSection = useScrollSpy(v2NavSectionIds);
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
      className="fixed inset-x-0 top-[env(safe-area-inset-top)] z-50 w-full border-b border-border bg-background"
      aria-label="Primary navigation"
    >
      <div className="mx-auto flex min-h-16 w-full max-w-6xl items-center gap-3 px-5 sm:px-8">
        <Link
          href="/"
          className="group flex min-w-0 items-center gap-2.5 rounded-lg px-1 py-1 outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring"
          onClick={(event) => handleLinkClick(event, "/", "home")}
          aria-label="Emmanuel Bitancor home"
        >
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-border font-mono text-micro font-medium text-foreground">
            ESB
          </span>
          <span className="hidden min-w-0 sm:block">
            <span className="block truncate text-small font-medium tracking-tight">
              Emmanuel Bitancor
            </span>
            <span className="block truncate font-mono text-micro uppercase tracking-[0.12em] text-muted-foreground">
              Full-stack developer
            </span>
          </span>
        </Link>

        <span aria-hidden="true" className="hidden h-5 w-px bg-border lg:block" />

        <div
          className="hidden min-w-0 flex-1 items-center justify-center gap-1 lg:flex"
          role="navigation"
          aria-label="Section navigation"
        >
          {v2CenterLinks.map((link) => {
            const isActive = pathname === "/" && activeSection === link.section;
            return (
              <Link
                key={link.name}
                href={link.href}
                onClick={(event) => handleLinkClick(event, link.href, link.section)}
                className={`group relative flex items-center gap-2 rounded-lg px-3 py-2 text-small font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                  isActive
                    ? "bg-muted text-foreground"
                    : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                }`}
                aria-current={isActive ? "location" : undefined}
              >
                <span className="font-mono text-micro tracking-widest text-faint">
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
            className="rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground md:hidden"
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
              {v2NavLinks.slice(1).map((link) => {
                const isActive = pathname === "/" && activeSection === link.section;
                return (
                  <Link
                    key={link.name}
                    href={link.href}
                    onClick={(event) => handleLinkClick(event, link.href, link.section)}
                    className="group flex items-center justify-between rounded-lg px-3 py-3 text-small font-medium text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    aria-current={isActive ? "location" : undefined}
                  >
                    <span className="flex items-center gap-3">
                      <span className="font-mono text-micro tracking-widest text-faint">
                        {link.index}
                      </span>
                      {link.name}
                    </span>
                    <ArrowUpRight
                      className="size-4 text-faint transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
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
