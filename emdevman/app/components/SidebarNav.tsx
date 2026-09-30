"use client";

import { useEffect, useRef, useState, type MouseEvent } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Menu, X } from "lucide-react";

import { Button } from "@/app/components/ui/button";
import { ThemeControl } from "@/app/components/ui/ThemeControl";
import { EMAIL_ADDRESS } from "@/app/lib/contact";
import { hiddenRoutes, navLinks, navSectionIds } from "@/app/lib/navigation";
import {
  useScrollSpy,
  useSectionNavigation,
} from "@/app/hooks/useScrollSpy";

/**
 * Split once, so the label can put a break opportunity after the local part
 * rather than in the middle of the domain. See the sidebar-cta comment in
 * globals.css for why the address cannot simply be shrunk to fit.
 */
const [emailLocal, emailDomain] = EMAIL_ADDRESS.split("@");

/**
 * v3's navigation: a fixed left rail from 1024px up, and a sticky top bar with
 * a full-screen overlay menu below it.
 *
 * Both halves share one list and one scroll spy. The active item is ink with a
 * leading arrow; inactive items sit at gray and darken on hover. Groups are
 * separated by hairlines rather than by boxes.
 */
export default function SidebarNav() {
  const pathname = usePathname();
  const reduceMotion = useReducedMotion();
  const activeSection = useScrollSpy(navSectionIds, pathname === "/");
  const navigate = useSectionNavigation();

  const [isOpen, setIsOpen] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    menuRef.current?.querySelector<HTMLAnchorElement>("a")?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
        toggleRef.current?.focus();
      }
    };

    // The overlay is a small-screen affordance only; growing past the
    // breakpoint reveals the rail, so the menu has nothing left to do.
    const desktop = window.matchMedia("(min-width: 1024px)");
    const handleDesktop = (event: MediaQueryListEvent) => {
      if (event.matches) setIsOpen(false);
    };

    document.addEventListener("keydown", handleKeyDown);
    desktop.addEventListener("change", handleDesktop);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      desktop.removeEventListener("change", handleDesktop);
    };
  }, [isOpen]);

  if (hiddenRoutes.includes(pathname)) return null;

  const handleClick = (
    event: MouseEvent<HTMLAnchorElement>,
    href: string,
    section: string,
  ) => {
    setIsOpen(false);
    navigate(event, href, section);
  };

  const renderLink = (link: (typeof navLinks)[number], variant: "rail" | "menu") => {
    const isActive = pathname === "/" && activeSection === link.section;

    if (variant === "rail") {
      return (
        <li key={link.name}>
          <Link
            href={link.href}
            onClick={(event) => handleClick(event, link.href, link.section)}
            aria-current={isActive ? "location" : undefined}
            className={`sidebar-link${isActive ? " sidebar-link--active" : ""}`}
          >
            <span className="sidebar-link-arrow" aria-hidden="true">
              →
            </span>
            <span>{link.name}</span>
          </Link>
        </li>
      );
    }

    return (
      <li key={link.name}>
        <Link
          href={link.href}
          onClick={(event) => handleClick(event, link.href, link.section)}
          aria-current={isActive ? "location" : undefined}
          className={`overlay-link${isActive ? " overlay-link--active" : ""}`}
        >
          <span className="display-pixel text-micro text-faint">
            {link.index}
          </span>
          <span>{link.name}</span>
        </Link>
      </li>
    );
  };

  return (
    <>
      {/* Left rail, large viewports. */}
      <nav
        className="sidebar fixed inset-y-0 left-0 z-50 hidden w-[var(--sidebar-w)] flex-col border-r border-border px-6 py-8 lg:flex"
        aria-label="Primary navigation"
      >
        <Link
          href="/"
          onClick={(event) => handleClick(event, "/", "home")}
          className="sidebar-brand"
          aria-label="Emmanuel Bitancor home"
        >
          <span className="display-pixel block text-2xl">emmanuel</span>
          <span className="eyebrow mt-1.5 block text-faint">
            full-stack developer
          </span>
        </Link>

        <div className="mt-12 border-t border-border pt-6">
          <p className="eyebrow text-faint">index</p>
          <ul className="mt-4 flex flex-col gap-1">{navLinks.map((link) => renderLink(link, "rail"))}</ul>
        </div>

        {/*
          A flex column, not a plain block. Both children are `inline-flex` -
          the pill and the CTA - and two inline-level boxes in a block container
          share a line, stacking only when they overflow. At 185px of content in
          176px that was a 9px accident: a different font stack or a longer
          label would have put them side by side. `items-start` keeps the pill at
          its own 108px instead of stretching it to the full column.
        */}
        <div className="mt-auto flex flex-col items-start gap-6 border-t border-border pt-6">
          <ThemeControl />
          {/*
            The address is the label, so it comes from EMAIL_ADDRESS rather than
            being typed out again.

            The <wbr> is the part that actually stops it overflowing - a 31
            character token cannot fit a 176px column at any readable size. It
            breaks after the local part, so the second line reads "@gmail.com"
            rather than cutting the domain in half, and it rejoins into a single
            line by itself if the rail is ever widened.
          */}
          <Link
            href="/#contact"
            onClick={(event) => handleClick(event, "/#contact", "contact")}
            className="sidebar-cta"
          >
            {emailLocal}
            <wbr />@{emailDomain}
            <span aria-hidden="true">↗</span>
          </Link>
        </div>
      </nav>

      {/* Top bar, small viewports. */}
      <nav
        className="topbar fixed inset-x-0 top-0 z-50 flex h-14 items-center justify-between border-b border-border bg-background/90 px-4 backdrop-blur-md lg:hidden"
        aria-label="Primary navigation"
      >
        <Link
          href="/"
          onClick={(event) => handleClick(event, "/", "home")}
          className="flex items-center gap-2.5"
          aria-label="Emmanuel Bitancor home"
        >
          <span className="flex size-7 items-center justify-center rounded-md bg-foreground font-mono text-[10px] font-bold text-background">
            ESB
          </span>
          <span className="display-pixel text-base">emmanuel</span>
        </Link>

        <div className="flex items-center gap-1.5">
          <ThemeControl />
          <Button
            ref={toggleRef}
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setIsOpen((open) => !open)}
            className="rounded-lg text-muted-foreground hover:text-foreground"
            aria-label={isOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={isOpen}
            aria-controls="v3-overlay-navigation"
          >
            {isOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </Button>
        </div>
      </nav>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            ref={menuRef}
            id="v3-overlay-navigation"
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="fixed inset-x-0 bottom-0 top-14 z-40 overflow-y-auto bg-background px-4 pb-8 lg:hidden"
          >
            <ul className="flex flex-col border-t border-border">
              {navLinks.map((link) => renderLink(link, "menu"))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
